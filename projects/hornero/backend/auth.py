"""Auth module — JWT auth + user management + email confirmation.

Fase 0.a-0.b del plan de seguridad.
Endpoints: register, confirm, login, refresh, resend-confirmation, me.
Users stored in Postgres (HORNERO_DB_URL), seeded from PILOT_USERS on first run.
"""

import json
import logging
import os
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
import jwt
import psycopg
from dotenv import load_dotenv
from email_validator import validate_email, EmailNotValidError
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

load_dotenv(override=True)

logger = logging.getLogger("hornero.auth")

# ===== Config =====
HORNERO_DB_URL = os.getenv("HORNERO_DB_URL", "").strip()
JWT_SECRET = os.getenv("JWT_SECRET", "").strip()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = 2 * 3600       # 2 hours
REFRESH_TOKEN_EXPIRE = 30 * 86400    # 30 days
CONFIRM_TOKEN_EXPIRE = 24 * 3600     # 24 hours

# SMTP
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "Hornero <noreply@hornero.federacion.org.ar>")
SMTP_TLS = os.getenv("SMTP_TLS", "true").lower() == "true"

# Allowed sectors
ALLOWED_SECTORS = ["aceitero", "prensa", "hornero", "comercio", "otro"]

# ===== Password hashing (bcrypt directly) =====
def _hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return _bcrypt.hashpw(password.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')

def _verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a bcrypt hash."""
    try:
        return _bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except Exception:
        return False

# ===== Auth rate limiting (in-memory) =====
_auth_rate_limit = defaultdict(list)  # key → [timestamps]

def _check_auth_rate(key: str, max_attempts: int, window_seconds: int) -> bool:
    now = time.time()
    timestamps = _auth_rate_limit[key]
    _auth_rate_limit[key] = [t for t in timestamps if now - t < window_seconds]
    if len(_auth_rate_limit[key]) >= max_attempts:
        return False
    _auth_rate_limit[key].append(now)
    return True


# ===== DB helpers =====

def _get_conn():
    """Get a psycopg connection to the Hornero Postgres database."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "HORNERO_DB_URL not configured")
    return psycopg.connect(HORNERO_DB_URL)


def _init_db():
    """Create users table if not exists. Idempotent."""
    if not HORNERO_DB_URL:
        logger.warning("HORNERO_DB_URL not set — auth disabled")
        return
    try:
        with _get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id                  TEXT PRIMARY KEY,
                    email               TEXT NOT NULL,
                    username            TEXT UNIQUE NOT NULL,
                    password_hash       TEXT NOT NULL,
                    nombre              TEXT NOT NULL DEFAULT '',
                    grade               TEXT NOT NULL DEFAULT 'B.a',
                    territory           TEXT NOT NULL DEFAULT '',
                    sector              TEXT NOT NULL DEFAULT 'aceitero',
                    tenant              TEXT NOT NULL DEFAULT '',
                    category            TEXT NOT NULL DEFAULT '',
                    agremiacion         JSONB DEFAULT '{}',
                    email_confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
                    confirmation_token  TEXT UNIQUE,
                    confirmation_sent_at TIMESTAMP,
                    active              BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Migration: drop email UNIQUE constraint (pilot testers share same email)
            try:
                conn.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key")
                logger.info("Dropped email UNIQUE constraint")
            except Exception:
                pass  # already dropped or never existed

            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_confirmation_token ON users(confirmation_token)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_grade ON users(grade)")
            conn.commit()
            logger.info("Auth DB initialized")
    except Exception as e:
        logger.error(f"Auth DB init failed: {e}")


def _get_user_by_username(username: str) -> dict | None:
    try:
        with _get_conn() as conn:
            row = conn.execute(
                "SELECT id, email, username, password_hash, nombre, grade, territory, sector, tenant, category, agremiacion, email_confirmed, active FROM users WHERE username = %s",
                (username,)
            ).fetchone()
            if not row:
                return None
            cols = ["id", "email", "username", "password_hash", "nombre", "grade", "territory", "sector", "tenant", "category", "agremiacion", "email_confirmed", "active"]
            return dict(zip(cols, row))
    except Exception as e:
        logger.error(f"DB error getting user {username}: {e}")
        return None


def _get_user_by_email(email: str) -> dict | None:
    try:
        with _get_conn() as conn:
            row = conn.execute(
                "SELECT id, email, username, password_hash, nombre, grade, territory, sector, tenant, category, agremiacion, email_confirmed, active FROM users WHERE email = %s",
                (email,)
            ).fetchone()
            if not row:
                return None
            cols = ["id", "email", "username", "password_hash", "nombre", "grade", "territory", "sector", "tenant", "category", "agremiacion", "email_confirmed", "active"]
            return dict(zip(cols, row))
    except Exception as e:
        logger.error(f"DB error getting user by email {email}: {e}")
        return None


def _get_user_by_confirmation_token(token: str) -> dict | None:
    try:
        with _get_conn() as conn:
            row = conn.execute(
                "SELECT id, email, username, nombre, email_confirmed, confirmation_sent_at FROM users WHERE confirmation_token = %s",
                (token,)
            ).fetchone()
            if not row:
                return None
            cols = ["id", "email", "username", "nombre", "email_confirmed", "confirmation_sent_at"]
            return dict(zip(cols, row))
    except Exception as e:
        logger.error(f"DB error getting user by token: {e}")
        return None


# ===== JWT helpers =====

def _create_token(user: dict, token_type: str = "access") -> str:
    now = datetime.now(timezone.utc)
    expire = ACCESS_TOKEN_EXPIRE if token_type == "access" else REFRESH_TOKEN_EXPIRE
    payload = {
        "sub": user["username"],
        "grade": user.get("grade", "B.a"),
        "territory": user.get("territory", ""),
        "sector": user.get("sector", "aceitero"),
        "tenant": user.get("tenant", ""),
        "category": user.get("category", ""),
        "type": token_type,
        "iat": now,
        "exp": now + timedelta(seconds=expire),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ===== Email helpers =====

async def _send_confirmation_email(email: str, nombre: str, token: str):
    """Send confirmation email via SMTP. Fails gracefully (logs error)."""
    confirm_url = f"https://eljaso2.github.io/hornero/confirm.html?token={token}"
    subject = "Confirmá tu cuenta en Hornero"
    body = f"""Hola {nombre},

Para activar tu cuenta en Hornero, hacé clic en este enlace:

{confirm_url}

Si no creaste una cuenta, ignorá este mensaje.

El enlace expira en 24 horas.

--
Hornero · Asistente IA sindical"""

    logger.info(f"[SMTP-CHECK] SMTP_HOST={SMTP_HOST!r}, SMTP_USER={SMTP_USER!r}, SMTP_PORT={SMTP_PORT}")

    if not SMTP_HOST:
        logger.warning(f"SMTP not configured — confirmation email NOT sent to {email}. Token: {token}")
        logger.info(f"Confirmation URL (for testing): {confirm_url}")
        return

    try:
        import aiosmtplib
        from email.mime.text import MIMEText

        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = email

        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=SMTP_TLS,
        )
        logger.info(f"Confirmation email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {email}: {e}")


# ===== Auth dependency =====

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def current_user(token: str = Depends(oauth2_scheme)) -> dict | None:
    """Decode JWT, return user claims. Returns None if no token (backward compat)."""
    if not token:
        return None
    if not JWT_SECRET:
        return None
    payload = _decode_token(token)
    if not payload:
        return None
    if payload.get("type") != "access":
        return None
    user = _get_user_by_username(payload["sub"])
    if not user or not user.get("active"):
        return None
    return user


async def require_auth(user: dict = Depends(current_user)) -> dict:
    """Require authenticated + email confirmed user."""
    if not user:
        raise HTTPException(401, "Autenticación requerida")
    if not user.get("email_confirmed"):
        raise HTTPException(403, "Email no confirmado")
    return user


# ===== Pydantic models =====

class RegisterRequest(BaseModel):
    email: str
    password: str
    nombre: str
    sector: str = "aceitero"

class LoginRequest(BaseModel):
    username: str   # email OR username
    password: str

class ResendConfirmationRequest(BaseModel):
    email: str


# ===== Router =====

router = APIRouter()


@router.post("/register")
async def register(req: RegisterRequest, request: Request):
    """Create account + send confirmation email."""
    # Validate DB config
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured on server")

    # Rate limit: 3 per email per hour, 5 per IP per hour
    client_ip = request.client.host if request.client else "unknown"
    if not _check_auth_rate(f"register:{req.email}", 3, 3600):
        raise HTTPException(429, "Demasiados intentos de registro. Esperá una hora.")
    if not _check_auth_rate(f"register-ip:{client_ip}", 5, 3600):
        raise HTTPException(429, "Demasiados intentos desde esta IP. Esperá una hora.")

    # Validate email
    try:
        valid = validate_email(req.email, check_deliverability=False)
        email = valid.normalized
    except EmailNotValidError:
        raise HTTPException(400, "Email inválido")

    # Validate password
    if len(req.password) < 8:
        raise HTTPException(400, "La contraseña debe tener al menos 8 caracteres")

    # Validate nombre
    if not req.nombre.strip():
        raise HTTPException(400, "El nombre es obligatorio")

    # Validate sector
    if req.sector not in ALLOWED_SECTORS:
        raise HTTPException(400, f"Sector inválido. Permitidos: {', '.join(ALLOWED_SECTORS)}")

    # Check if email already taken
    existing = _get_user_by_email(email)
    if existing:
        # Don't reveal if email exists — return same message
        return {"message": "Si el email no está registrado, recibirás un email de confirmación.", "email": email}

    # Generate username from email (before @)
    base_username = email.split("@")[0].lower().replace(".", "_").replace("+", "_")
    username = base_username

    # Ensure unique username
    try:
        with _get_conn() as conn:
            # Check username uniqueness and append number if needed
            suffix = 1
            while conn.execute("SELECT 1 FROM users WHERE username = %s", (username,)).fetchone():
                username = f"{base_username}_{suffix}"
                suffix += 1

            # Generate confirmation token
            confirmation_token = secrets.token_urlsafe(32)
            password_hash = _hash_password(req.password)
            user_id = secrets.token_urlsafe(16)

            # Default grade for new users
            grade = "B.a"
            # Testers get B.d for now (adjust when real users come)
            category = "tester"

            conn.execute("""
                INSERT INTO users (id, email, username, password_hash, nombre, grade, sector, category, email_confirmed, confirmation_token, confirmation_sent_at, agremiacion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE, %s, CURRENT_TIMESTAMP, %s)
            """, (
                user_id, email, username, password_hash, req.nombre.strip(),
                grade, req.sector, category, confirmation_token,
                json.dumps({"rol": "Trabajador de Base", "federacion": "", "sindicato": "", "convenio": "", "sectorName": "", "territorio": "", "empresa": "", "puesto": ""})
            ))
            conn.commit()
    except psycopg.errors.UniqueViolation:
        raise HTTPException(409, "Ya existe una cuenta con ese email")
    except Exception as e:
        logger.error(f"Registration DB error: {e}")
        raise HTTPException(500, "Error al crear la cuenta")

    # Send confirmation email
    await _send_confirmation_email(email, req.nombre.strip(), confirmation_token)

    return {"message": "Te enviamos un email de confirmación. Hacé clic en el enlace para activar tu cuenta.", "email": email}


@router.get("/confirm/{token}")
async def confirm_email(token: str):
    """Verify email via confirmation link."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")

    user = _get_user_by_confirmation_token(token)
    if not user:
        raise HTTPException(410, "El enlace es inválido o ya fue usado.")

    if user.get("email_confirmed"):
        return {"message": "Esta cuenta ya fue confirmada.", "username": user["username"]}

    # Check expiration (24h)
    sent_at = user.get("confirmation_sent_at")
    if sent_at:
        if isinstance(sent_at, str):
            sent_at = datetime.fromisoformat(sent_at.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) - sent_at > timedelta(hours=24):
            raise HTTPException(410, "El enlace expiró. Solicitá uno nuevo desde la app.")

    # Confirm
    try:
        with _get_conn() as conn:
            conn.execute("""
                UPDATE users SET email_confirmed = TRUE, confirmation_token = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (user["id"],))
            conn.commit()
    except Exception as e:
        logger.error(f"Confirmation DB error: {e}")
        raise HTTPException(500, "Error al confirmar la cuenta")

    logger.info(f"Email confirmed for user {user['username']}")
    return {"message": "¡Cuenta confirmada! Ya podés ingresar a Hornero.", "username": user["username"]}


@router.post("/login")
async def login(req: LoginRequest, request: Request):
    """Authenticate user, return JWT pair."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    if not JWT_SECRET:
        raise HTTPException(500, "JWT not configured")

    # Rate limit: 10 per username per 15 minutes
    if not _check_auth_rate(f"login:{req.username}", 10, 900):
        raise HTTPException(429, "Demasiados intentos. Esperá 15 minutos.")

    # Find user by username or email
    user = _get_user_by_username(req.username)
    if not user:
        user = _get_user_by_email(req.username)
    if not user:
        raise HTTPException(401, "Usuario o contraseña incorrectos")

    # Verify password
    if not _verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Usuario o contraseña incorrectos")

    # Check active
    if not user.get("active"):
        raise HTTPException(403, "Cuenta desactivada")

    # Check email confirmed
    if not user.get("email_confirmed"):
        raise HTTPException(403, "Email no confirmado. Te enviamos un email de confirmación.")

    # Generate tokens
    access_token = _create_token(user, "access")
    refresh_token = _create_token(user, "refresh")

    # Parse agremiacion
    agremiacion = user.get("agremiacion", {})
    if isinstance(agremiacion, str):
        try:
            agremiacion = json.loads(agremiacion)
        except:
            agremiacion = {}

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "email": user["email"],
            "nombre": user.get("nombre", ""),
            "grade": user.get("grade", "B.a"),
            "territory": user.get("territory", ""),
            "sector": user.get("sector", "aceitero"),
            "tenant": user.get("tenant", ""),
            "category": user.get("category", ""),
            "agremiacion": agremiacion,
        }
    }


@router.post("/refresh")
async def refresh(request: Request):
    """Refresh access token using refresh token."""
    if not JWT_SECRET:
        raise HTTPException(500, "JWT not configured")

    # Get refresh token from body or header
    body = await request.json()
    refresh_token = body.get("refresh_token", "")
    if not refresh_token:
        raise HTTPException(401, "Refresh token requerido")

    payload = _decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Refresh token inválido o expirado")

    # Verify user still exists and is active
    user = _get_user_by_username(payload["sub"])
    if not user or not user.get("active"):
        raise HTTPException(401, "Cuenta desactivada")

    # Issue new access token
    access_token = _create_token(user, "access")

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/resend-confirmation")
async def resend_confirmation(req: ResendConfirmationRequest, request: Request):
    """Resend confirmation email."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")

    # Rate limit: 3 per email per hour
    client_ip = request.client.host if request.client else "unknown"
    if not _check_auth_rate(f"resend:{req.email}", 3, 3600):
        raise HTTPException(429, "Demasiados intentos. Esperá una hora.")

    user = _get_user_by_email(req.email)
    if not user or user.get("email_confirmed"):
        # Don't reveal if email exists
        return {"message": "Si el email está registrado y no confirmado, recibirás un nuevo email."}

    # Generate new token
    new_token = secrets.token_urlsafe(32)
    try:
        with _get_conn() as conn:
            conn.execute("""
                UPDATE users SET confirmation_token = %s, confirmation_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (new_token, user["id"]))
            conn.commit()
    except Exception as e:
        logger.error(f"Resend confirmation DB error: {e}")
        raise HTTPException(500, "Error al reenviar confirmación")

    await _send_confirmation_email(req.email, user.get("nombre", ""), new_token)

    return {"message": "Si el email está registrado y no confirmado, recibirás un nuevo email."}


@router.get("/me")
async def get_me(user: dict = Depends(require_auth)):
    """Return current user profile."""
    agremiacion = user.get("agremiacion", {})
    if isinstance(agremiacion, str):
        try:
            agremiacion = json.loads(agremiacion)
        except:
            agremiacion = {}

    return {
        "username": user["username"],
        "email": user["email"],
        "nombre": user.get("nombre", ""),
        "grade": user.get("grade", "B.a"),
        "territory": user.get("territory", ""),
        "sector": user.get("sector", "aceitero"),
        "tenant": user.get("tenant", ""),
        "category": user.get("category", ""),
        "agremiacion": agremiacion,
        "email_confirmed": user.get("email_confirmed", False),
    }


# ===== Seed pilot users =====

PILOT_USERS_SEED = {
    'eljaso':   {'password': 'hornero2026', 'grade': 'B.d', 'territory': 'norte-santa-fe', 'sector': 'hornero', 'nombre': 'Eljaso', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Administrador', 'federacion': 'Hornero', 'sindicato': 'Hornero', 'convenio': '', 'sectorName': '', 'territorio': 'Norte de Santa Fe', 'empresa': '', 'puesto': ''}},
    'test4':    {'password': 'fed2026', 'grade': 'B.d', 'territory': 'rosario', 'sector': 'aceitero', 'nombre': 'Tester N4 — Federación', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Secretario General de la Federación', 'federacion': 'F.T.C.I.O.D y A.R.A.', 'sindicato': 'Sindicato de Obreros de la Industria Aceitera — Rosario', 'convenio': 'CCT 420/05', 'sectorName': 'Industria aceitera', 'territorio': 'Rosario', 'empresa': 'Dreyfus', 'puesto': 'Operario de planta'}},
    'test3':    {'password': 'sec2026', 'grade': 'B.c', 'territory': 'norte-santa-fe', 'sector': 'aceitero', 'nombre': 'Tester N3 — Secretario General Sindicato', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Secretario General del Sindicato', 'federacion': 'F.T.C.I.O.D y A.R.A.', 'sindicato': 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', 'convenio': 'CCT 420/05', 'sectorName': 'Industria aceitera', 'territorio': 'Norte de Santa Fe', 'empresa': '', 'puesto': ''}},
    'test_guaycuru': {'password': 'delguay2026', 'grade': 'B.b', 'territory': 'norte-santa-fe', 'sector': 'aceitero', 'nombre': 'Delegado Desmotadora Guaycurú', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Delegado', 'federacion': 'F.T.C.I.O.D y A.R.A.', 'sindicato': 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', 'convenio': 'CCT 420/05', 'sectorName': 'Industria aceitera', 'territorio': 'Norte de Santa Fe', 'empresa': 'Desmotadora Guaycurú', 'puesto': 'Operario de desmotadora'}},
    'test2':    {'password': 'del2026', 'grade': 'B.b', 'territory': 'norte-santa-fe', 'sector': 'aceitero', 'nombre': 'Tester N2 — Delegada', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Delegado', 'federacion': 'F.T.C.I.O.D y A.R.A.', 'sindicato': 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', 'convenio': 'CCT 420/05', 'sectorName': 'Industria aceitera', 'territorio': 'Norte de Santa Fe', 'empresa': 'Vicentín SAIC', 'puesto': 'Operario de planta'}},
    'test1a':   {'password': 'base2026', 'grade': 'B.a', 'territory': 'norte-santa-fe', 'sector': 'aceitero', 'nombre': 'Tester N1 (base)', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Trabajador de Base', 'federacion': 'F.T.C.I.O.D y A.R.A.', 'sindicato': 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', 'convenio': 'CCT 420/05', 'sectorName': 'Industria aceitera', 'territorio': 'Norte de Santa Fe', 'empresa': 'Vicentín SAIC', 'puesto': 'Operario de planta'}},
    'test1b':   {'password': 'adm2026', 'grade': 'B.a', 'territory': 'norte-santa-fe', 'sector': 'aceitero', 'nombre': 'Tester N1 (administración)', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Trabajador de Base', 'federacion': 'F.T.C.I.O.D y A.R.A.', 'sindicato': 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', 'convenio': 'CCT 420/05', 'sectorName': 'Industria aceitera', 'territorio': 'Norte de Santa Fe', 'empresa': 'Vicentín SAIC', 'puesto': 'Administración'}},
    'test1c':   {'password': 'obrero2026', 'grade': 'B.a', 'territory': 'norte-santa-fe', 'sector': 'aceitero', 'nombre': 'Tester N1C — Obrero Guaycurú', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Trabajador de Base', 'federacion': 'F.T.C.I.O.D y A.R.A.', 'sindicato': 'Sindicato de Obreros de la Industria Aceitera — Norte de Santa Fe', 'convenio': 'CCT 420/05', 'sectorName': 'Industria aceitera', 'territorio': 'Norte de Santa Fe', 'empresa': 'Desmotadora Guaycurú', 'puesto': 'Operario de desmotadora'}},
    'test_prensa4':  {'password': 'prensa2026', 'grade': 'B.d', 'territory': 'caba', 'sector': 'prensa', 'nombre': 'Tester P4 — SIPREBA', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Secretario General de SIPREBA', 'federacion': 'SIPREBA', 'sindicato': 'SIPREBA (Sindicato de Prensa de Buenos Aires)', 'convenio': 'CCT 301/75', 'sectorName': 'Prensa y periodismo', 'territorio': 'CABA', 'empresa': '', 'puesto': ''}},
    'test_prensa3':  {'password': 'secprensa2026', 'grade': 'B.c', 'territory': 'caba', 'sector': 'prensa', 'nombre': 'Tester P3 — Secretario Seccional', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Secretario Seccional', 'federacion': 'SIPREBA', 'sindicato': 'SIPREBA', 'convenio': 'CCT 301/75', 'sectorName': 'Prensa y periodismo', 'territorio': 'CABA', 'empresa': '', 'puesto': ''}},
    'test_prensa2':  {'password': 'delprensa2026', 'grade': 'B.b', 'territory': 'caba', 'sector': 'prensa', 'nombre': 'Tester P2 — Delegado Prensa', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Delegado', 'federacion': 'SIPREBA', 'sindicato': 'SIPREBA', 'convenio': 'CCT 301/75', 'sectorName': 'Prensa y periodismo', 'territorio': 'CABA', 'empresa': 'Cronista', 'puesto': 'Cronista'}},
    'test_prensa1':  {'password': 'baseprensa2026', 'grade': 'B.a', 'territory': 'caba', 'sector': 'prensa', 'nombre': 'Tester P1 — Periodista Base', 'email': 'alejandro.jasinski@gmail.com', 'category': 'tester',
        'agremiacion': {'rol': 'Trabajador de Base', 'federacion': 'SIPREBA', 'sindicato': 'SIPREBA', 'convenio': 'CCT 301/75', 'sectorName': 'Prensa y periodismo', 'territorio': 'CABA', 'empresa': '', 'puesto': 'Cronista'}},
    'emiliano': {'password': 'emiliano2026', 'grade': 'B.d', 'territory': '', 'sector': 'hornero', 'nombre': 'Emiliano López', 'email': 'emiliano@thetricontinental.org', 'category': 'tester',
        'agremiacion': {'rol': 'Tester', 'federacion': '', 'sindicato': '', 'convenio': '', 'sectorName': '', 'territorio': '', 'empresa': '', 'puesto': ''}},
    'federico': {'password': 'federico2026', 'grade': 'B.d', 'territory': '', 'sector': 'hornero', 'nombre': 'Federico Ávalos', 'email': 'PENDIENTE', 'category': 'tester',
        'agremiacion': {'rol': 'Tester', 'federacion': '', 'sindicato': '', 'convenio': '', 'sectorName': '', 'territorio': '', 'empresa': '', 'puesto': ''}},
}


def seed_pilot_users():
    """Seed/UPSERT pilot users into Postgres. Always runs on startup — uses ON CONFLICT to update existing."""
    if not HORNERO_DB_URL:
        return

    try:
        with _get_conn() as conn:
            logger.info("Seeding pilot users into auth DB (UPSERT)...")
            for username, data in PILOT_USERS_SEED.items():
                password_hash = _hash_password(data['password'])
                user_id = f"pilot-{username}"
                conn.execute("""
                    INSERT INTO users (id, email, username, password_hash, nombre, grade, territory, sector, category, agremiacion, email_confirmed)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                    ON CONFLICT(username) DO UPDATE SET
                        password_hash=EXCLUDED.password_hash,
                        email=EXCLUDED.email,
                        email_confirmed=TRUE
                """, (
                    user_id, data['email'], username, password_hash,
                    data['nombre'], data['grade'], data.get('territory', ''),
                    data.get('sector', 'aceitero'), data.get('category', 'tester'),
                    json.dumps(data.get('agremiacion', {}))
                ))
            conn.commit()
            logger.info(f"Seeded {len(PILOT_USERS_SEED)} pilot users")
    except Exception as e:
        logger.error(f"Pilot users seeding failed: {e}")


# ===== Init on import =====

def init_auth():
    """Initialize auth: create tables + seed pilot users. Called from main.py startup."""
    logger.info(f"[STARTUP] SMTP_HOST={SMTP_HOST!r} SMTP_USER={SMTP_USER!r} SMTP_PORT={SMTP_PORT}")
    _init_db()
    seed_pilot_users()
