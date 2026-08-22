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

# Email: Gmail API (OAuth2) — works on Render (HTTPS, no blocked ports)
GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID", "")
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET", "")
GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Hornero <alejandro.jasinski@gmail.com>")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "alejandro.jasinski@gmail.com")  # Notificación de registros

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
    """Send confirmation email via Gmail API (OAuth2 HTTPS). Fails gracefully (logs error)."""
    confirm_url = f"https://eljaso2.github.io/hornero/confirm.html?token={token}"
    subject = "Confirmá tu cuenta en Hornero"
    body = f"""Hola {nombre},

Para activar tu cuenta en Hornero, hacé clic en este enlace:

{confirm_url}

Si no creaste una cuenta, ignorá este mensaje.

El enlace expira en 24 horas.

--
Hornero · Asistente IA sindical"""

    if not GMAIL_REFRESH_TOKEN:
        logger.warning(f"GMAIL_REFRESH_TOKEN not set — confirmation email NOT sent to {email}. Token: {token}")
        logger.info(f"Confirmation URL (for testing): {confirm_url}")
        return

    try:
        import httpx
        import base64

        # 1. Get access token from refresh token
        async with httpx.AsyncClient(timeout=15) as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GMAIL_CLIENT_ID,
                    "client_secret": GMAIL_CLIENT_SECRET,
                    "refresh_token": GMAIL_REFRESH_TOKEN,
                    "grant_type": "refresh_token",
                },
            )
            if token_resp.status_code != 200:
                logger.error(f"Gmail token error ({token_resp.status_code}): {token_resp.text}")
                return

            access_token = token_resp.json()["access_token"]

            # 2. Build raw MIME message (RFC 2822)
            from email.mime.text import MIMEText
            msg = MIMEText(body, "plain", "utf-8")
            msg["From"] = EMAIL_FROM
            msg["To"] = email
            msg["Subject"] = subject
            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

            # 3. Send via Gmail API
            send_resp = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"raw": raw},
            )
            if send_resp.status_code == 200:
                data = send_resp.json()
                logger.info(f"Confirmation email sent to {email} (gmail_id={data.get('id','?')})")
            else:
                logger.error(f"Gmail send error ({send_resp.status_code}): {send_resp.text}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {email}: {e}")


async def _send_admin_notification(email: str, nombre: str, sector: str, username: str):
    """Notify admin when a new user registers."""
    if not GMAIL_REFRESH_TOKEN or not ADMIN_EMAIL:
        logger.info(f"ADMIN NOTIFY (no Gmail): new user {username} — {nombre} ({email}) sector={sector}")
        return

    try:
        import httpx
        import base64
        from email.mime.text import MIMEText

        subject = f"🆕 Nuevo registro en Hornero: {nombre}"
        body = f"""Se registró un nuevo usuario en Hornero:

Nombre: {nombre}
Email: {email}
Username: {username}
Sector: {sector}
Fecha: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}

El usuario aún no confirmó su email."""

        async with httpx.AsyncClient(timeout=15) as client:
            # Get access token (reuse the same flow)
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GMAIL_CLIENT_ID,
                    "client_secret": GMAIL_CLIENT_SECRET,
                    "refresh_token": GMAIL_REFRESH_TOKEN,
                    "grant_type": "refresh_token",
                },
            )
            if token_resp.status_code != 200:
                logger.error(f"Admin notify: Gmail token error ({token_resp.status_code})")
                return

            access_token = token_resp.json()["access_token"]
            msg = MIMEText(body, "plain", "utf-8")
            msg["From"] = EMAIL_FROM
            msg["To"] = ADMIN_EMAIL
            msg["Subject"] = subject
            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

            send_resp = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"raw": raw},
            )
            if send_resp.status_code == 200:
                logger.info(f"Admin notified: new user {username}")
            else:
                logger.error(f"Admin notify: Gmail send error ({send_resp.status_code}): {send_resp.text}")
    except Exception as e:
        logger.error(f"Failed to send admin notification: {e}")


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
            # Sector "hornero" = testers (internal team), others = usuarios reales
            category = "tester" if req.sector == "hornero" else "usuario"

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

    # Notify admin about new registration
    await _send_admin_notification(email, req.nombre.strip(), req.sector, username)

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
        try:
            if isinstance(sent_at, str):
                sent_at = datetime.fromisoformat(sent_at.replace("Z", "+00:00"))
            if hasattr(sent_at, 'tzinfo') and sent_at.tzinfo is None:
                sent_at = sent_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) - sent_at > timedelta(hours=24):
                raise HTTPException(410, "El enlace expiró. Solicitá uno nuevo desde la app.")
        except (ValueError, TypeError):
            pass  # If we can't parse the date, allow confirmation

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

    # Verify user still exists, is active, and email confirmed
    user = _get_user_by_username(payload["sub"])
    if not user or not user.get("active"):
        raise HTTPException(401, "Cuenta desactivada")
    if not user.get("email_confirmed"):
        raise HTTPException(403, "Email no confirmado")

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


@router.get("/admin/users")
async def admin_list_users(user: dict = Depends(require_auth)):
    """List all registered users. Only accessible to authenticated users."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    try:
        with _get_conn() as conn:
            rows = conn.execute("""
                SELECT username, email, nombre, grade, sector, territory,
                       category, email_confirmed, created_at
                FROM users
                ORDER BY created_at DESC
            """).fetchall()
            users = []
            for r in rows:
                users.append({
                    "username": r["username"],
                    "email": r["email"],
                    "nombre": r["nombre"],
                    "grade": r["grade"],
                    "sector": r["sector"],
                    "territory": r["territory"],
                    "category": r["category"],
                    "email_confirmed": r["email_confirmed"],
                    "created_at": str(r["created_at"]) if r["created_at"] else "",
                })
            return {"total": len(users), "users": users}
    except Exception as e:
        logger.error(f"Admin list users error: {e}")
        raise HTTPException(500, "Error al listar usuarios")


# ===== Admin: Update user grade =====

class UpdateGradeRequest(BaseModel):
    username: str
    grade: str  # 'B.a', 'B.b', 'B.c', 'B.d'

@router.post("/admin/update-grade")
async def admin_update_grade(req: UpdateGradeRequest, user: dict = Depends(require_auth)):
    """Update a user's grade. Only accessible to authenticated admin users."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    valid_grades = ['B.a', 'B.b', 'B.c', 'B.d']
    if req.grade not in valid_grades:
        raise HTTPException(400, f"Grade inválido. Válidos: {', '.join(valid_grades)}")
    try:
        with _get_conn() as conn:
            cursor = conn.execute(
                "UPDATE users SET grade = %s, updated_at = CURRENT_TIMESTAMP WHERE username = %s",
                [req.grade, req.username]
            )
            conn.commit()
            if cursor.rowcount == 0:
                raise HTTPException(404, f"Usuario '{req.username}' no encontrado")
            logger.info(f"Admin: updated grade for {req.username} to {req.grade}")
            return {"username": req.username, "grade": req.grade, "updated": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin update grade error: {e}")
        raise HTTPException(500, "Error al actualizar grade")


# ===== Admin Nuke (on-demand, protected by secret) =====

NUKE_SECRET = os.getenv("NUKE_SECRET", "").strip()

class NukeRequest(BaseModel):
    secret: str

@router.post("/admin/nuke")
async def admin_nuke(req: NukeRequest):
    """Nuke ALL data: users, chats, informes, correcciones. Protected by NUKE_SECRET."""
    if not NUKE_SECRET:
        raise HTTPException(403, "NUKE_SECRET not configured on server")
    if req.secret != NUKE_SECRET:
        raise HTTPException(403, "Secret incorrecto")

    results = {}

    # 1. Delete all users from Postgres
    if HORNERO_DB_URL:
        try:
            with _get_conn() as conn:
                cursor = conn.execute("DELETE FROM users")
                conn.commit()
                results["users_deleted"] = cursor.rowcount if hasattr(cursor, 'rowcount') else -1
                logger.info(f"NUKE: deleted {results['users_deleted']} users from auth DB")
        except Exception as e:
            results["users_error"] = str(e)
            logger.error(f"NUKE: users delete failed: {e}")

    # 2. Delete SQLite databases (chat + informes)
    for label, path in [("chat", "/app/chat_history.db"), ("informes", "/app/informes.db")]:
        try:
            import os
            if os.path.exists(path):
                os.remove(path)
                results[f"{label}_deleted"] = True
                logger.info(f"NUKE: deleted {path}")
            else:
                results[f"{label}_deleted"] = False
                results[f"{label}_note"] = "file not found"
        except Exception as e:
            results[f"{label}_error"] = str(e)

    return {"status": "nuked", "results": results}



# ===== Init on import =====

def _nuke_all_data():
    """One-time nuclear cleanup: delete ALL users from Postgres.
    Called once on startup, then disabled via env flag."""
    if not HORNERO_DB_URL:
        return
    nuke = os.environ.get("HORNERO_NUKE_DATA", "")
    if nuke != "yes":
        return
    try:
        with _get_conn() as conn:
            conn.execute("DELETE FROM users")
            conn.commit()
            logger.info("NUKE: deleted ALL users from auth DB")
    except Exception as e:
        logger.error(f"NUKE: failed to delete users: {e}")


def init_auth():
    """Initialize auth: create tables. Called from main.py startup."""
    logger.info(f"[STARTUP] GMAIL_REFRESH_TOKEN={'set' if GMAIL_REFRESH_TOKEN else 'NOT SET'}, EMAIL_FROM={EMAIL_FROM!r}")
    _init_db()
    _nuke_all_data()
