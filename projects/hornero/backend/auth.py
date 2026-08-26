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

# Admin emails: users confirming with these emails get grade B.d automatically
# Comma-separated in ADMIN_EMAILS env var, or hardcoded fallback for pilot
_ADMIN_EMAILS_ENV = os.getenv("ADMIN_EMAILS", "").strip()
ADMIN_EMAILS = [e.strip().lower() for e in _ADMIN_EMAILS_ENV.split(",") if e.strip()]

# Admin key for grade updates (simple shared secret for pilot)
# Set ADMIN_KEY env var on Render. If not set, admin grade updates only via JWT.
ADMIN_KEY = os.getenv("ADMIN_KEY", "").strip() or [
    # Alejandro Jasinski — admin piloto (add your email here if needed)
]

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

            # --- New columns for gremio verification ---
            for col_ddl in [
                "ALTER TABLE users ADD COLUMN is_tester BOOLEAN NOT NULL DEFAULT FALSE",
                "ALTER TABLE users ADD COLUMN verificacion_pendiente BOOLEAN NOT NULL DEFAULT FALSE",
                "ALTER TABLE users ADD COLUMN sindicato_id TEXT DEFAULT ''",
            ]:
                try:
                    conn.execute(col_ddl)
                    logger.info(f"Added column: {col_ddl.split('ADD COLUMN ')[1].split(' ')[0]}")
                except Exception:
                    pass  # column already exists

            # --- Migrate existing hornero/tester users to is_tester ---
            conn.execute("""
                UPDATE users SET is_tester = TRUE
                WHERE (sector = 'hornero' OR category = 'tester') AND is_tester = FALSE
            """)

            # --- Sindicatos table (for autocomplete search) ---
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sindicatos (
                    id              TEXT PRIMARY KEY,
                    nombre          TEXT NOT NULL,
                    nombre_full     TEXT NOT NULL DEFAULT '',
                    sector_key      TEXT NOT NULL DEFAULT '',
                    sigla           TEXT NOT NULL DEFAULT '',
                    federacion      TEXT NOT NULL DEFAULT '',
                    convenio        TEXT NOT NULL DEFAULT '',
                    keywords        TEXT NOT NULL DEFAULT '',
                    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Migration: add keywords column if missing (existing tables)
            try:
                conn.execute("ALTER TABLE sindicatos ADD COLUMN keywords TEXT NOT NULL DEFAULT ''")
                logger.info("Added keywords column to sindicatos")
            except Exception:
                pass  # column already exists

            # Seed sindicatos from known gremio data
            seed_sindicatos = [
                ("ftciod-ara", "F.T.C.I.O.D y A.R.A.",
                 "Federación de Trabajadores del Complejo Industrial Oleaginoso, Desmotadores de Algodón y Afines de la República Argentina",
                 "aceitero", "FTCIOD", "F.T.C.I.O.D y A.R.A.", "CCT 420/05",
                 "aceitero aceitera oleaginoso aceite desmotadores algodón soja girasol Fatica FATICORA F.T.C.I.O.D"),
                ("sipreba", "SIPREBA",
                 "SIPREBA — Sindicato de Prensa de Buenos Aires",
                 "prensa", "SIPREBA", "SIPREBA", "CCT 301/75",
                 "prensa periodista periodismo medios comunicación prensa gráfica"),
                ("hornero-admin", "Hornero (Admin/Tester)",
                 "Hornero — Acceso administrativo y de testing",
                 "hornero", "Hornero", "", "",
                 "hornero admin tester administración testing desarrollo"),
            ]
            for s in seed_sindicatos:
                conn.execute(
                    "INSERT INTO sindicatos (id, nombre, nombre_full, sector_key, sigla, federacion, convenio, keywords) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING", s
                )

            # Backfill keywords for existing rows that don't have them yet
            conn.execute("""
                UPDATE sindicatos SET keywords = 'aceitero aceitera oleaginoso aceite desmotadores algodón soja girasol Fatica FATICORA F.T.C.I.O.D'
                WHERE id = 'ftciod-ara' AND keywords = ''
            """)
            conn.execute("""
                UPDATE sindicatos SET keywords = 'prensa periodista periodismo medios comunicación prensa gráfica'
                WHERE id = 'sipreba' AND keywords = ''
            """)

            # Backfill sindicato_id for existing users based on sector
            conn.execute("""
                UPDATE users u SET sindicato_id = s.id
                FROM sindicatos s
                WHERE u.sindicato_id = '' AND u.sector = s.sector_key AND s.id != ''
            """)

            # --- Gremio verificación table (verified members per sindicato) ---
            conn.execute("""
                CREATE TABLE IF NOT EXISTS gremio_verificacion (
                    id              TEXT PRIMARY KEY,
                    sindicato_id    TEXT NOT NULL DEFAULT '',
                    nombre          TEXT NOT NULL,
                    cargo           TEXT NOT NULL DEFAULT '',
                    empresa         TEXT NOT NULL DEFAULT '',
                    territorio      TEXT NOT NULL DEFAULT '',
                    active          BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_gremio_verif_sindicato ON gremio_verificacion(sindicato_id)")

            conn.commit()
            logger.info("Auth DB initialized (v2: sindicatos + gremio_verificacion + is_tester)")
    except Exception as e:
        logger.error(f"Auth DB init failed: {e}")


def _get_user_by_username(username: str) -> dict | None:
    try:
        with _get_conn() as conn:
            row = conn.execute(
                "SELECT id, email, username, password_hash, nombre, grade, territory, sector, tenant, category, agremiacion, email_confirmed, active, is_tester, verificacion_pendiente, sindicato_id FROM users WHERE username = %s",
                (username,)
            ).fetchone()
            if not row:
                return None
            cols = ["id", "email", "username", "password_hash", "nombre", "grade", "territory", "sector", "tenant", "category", "agremiacion", "email_confirmed", "active", "is_tester", "verificacion_pendiente", "sindicato_id"]
            return dict(zip(cols, row))
    except Exception as e:
        logger.error(f"DB error getting user {username}: {e}")
        return None


def _get_user_by_email(email: str) -> dict | None:
    try:
        with _get_conn() as conn:
            row = conn.execute(
                "SELECT id, email, username, password_hash, nombre, grade, territory, sector, tenant, category, agremiacion, email_confirmed, active, is_tester, verificacion_pendiente, sindicato_id FROM users WHERE email = %s",
                (email,)
            ).fetchone()
            if not row:
                return None
            cols = ["id", "email", "username", "password_hash", "nombre", "grade", "territory", "sector", "tenant", "category", "agremiacion", "email_confirmed", "active", "is_tester", "verificacion_pendiente", "sindicato_id"]
            return dict(zip(cols, row))
    except Exception as e:
        logger.error(f"DB error getting user by email {email}: {e}")
        return None


def _get_user_by_nombre(nombre: str) -> dict | None:
    """Find user by full name (case-insensitive)."""
    try:
        with _get_conn() as conn:
            row = conn.execute(
                "SELECT id, email, username, password_hash, nombre, grade, territory, sector, tenant, category, agremiacion, email_confirmed, active, is_tester, verificacion_pendiente, sindicato_id FROM users WHERE LOWER(nombre) = LOWER(%s)",
                (nombre,)
            ).fetchone()
            if not row:
                return None
            cols = ["id", "email", "username", "password_hash", "nombre", "grade", "territory", "sector", "tenant", "category", "agremiacion", "email_confirmed", "active", "is_tester", "verificacion_pendiente", "sindicato_id"]
            return dict(zip(cols, row))
    except Exception as e:
        logger.error(f"DB error getting user by nombre {nombre}: {e}")
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


async def _send_verification_failed_notification(email: str, nombre: str, claimed_cargo: str, sindicato_info: dict | None, username: str):
    """Notify admin when a user's cargo verification fails during registration."""
    if not GMAIL_REFRESH_TOKEN or not ADMIN_EMAIL:
        logger.info(f"ADMIN VERIFY FAIL (no Gmail): {username} — {nombre} claimed {claimed_cargo}")
        return

    sindicato_nombre = sindicato_info["nombre"] if sindicato_info else "desconocido"
    cargo_label = CARGO_ROL.get(claimed_cargo, claimed_cargo)

    try:
        import httpx
        import base64
        from email.mime.text import MIMEText

        subject = f"⚠️ Verificación fallida: {nombre} reclamó {cargo_label}"
        body = f"""Un usuario intentó registrarse con un cargo que NO pudimos verificar:

Nombre: {nombre}
Email: {email}
Username: {username}
Cargo reclamado: {cargo_label}
Sindicato: {sindicato_nombre}
Fecha: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}

Se registró como Trabajador/a (B.a) con verificación pendiente.
Revisá la tabla gremio_verificacion y actualizá el grado si corresponde.

Para actualizar el grado:
POST /api/auth/admin/update-user
{{"username": "{username}", "grade": "B.b"}}  (o B.c / B.d según corresponda)"""

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
                logger.error(f"Verify notify: Gmail token error ({token_resp.status_code})")
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
                logger.info(f"Admin notified: verification failed for {username}")
            else:
                logger.error(f"Verify notify: Gmail send error ({send_resp.status_code}): {send_resp.text}")
    except Exception as e:
        logger.error(f"Failed to send verification failed notification: {e}")

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


async def _optional_auth(user: dict = Depends(current_user)) -> dict | None:
    """Return user if authenticated, None otherwise. No error if not authenticated."""
    if not user or not user.get("active"):
        return None
    return user


# ===== Pydantic models =====

class RegisterRequest(BaseModel):
    email: str
    password: str
    nombre: str
    sector: str = "aceitero"          # backward compat, derivado de sindicato_id si existe
    sindicato_id: str = ""            # nuevo: ID de la tabla sindicatos
    cargo: str = "trabajador"         # nuevo: trabajador | delegado | comision_directiva | comision_federacion

class LoginRequest(BaseModel):
    username: str   # email OR username
    password: str

class ResendConfirmationRequest(BaseModel):
    email: str


# ===== Router =====

router = APIRouter()

# Cargo → grade mapping
CARGO_GRADE = {
    "trabajador": "B.a",
    "delegado": "B.b",
    "comision_directiva": "B.c",
    "comision_federacion": "B.d",
}
CARGO_ROL = {
    "trabajador": "Trabajador de Base",
    "delegado": "Delegado/a",
    "comision_directiva": "Comisión Directiva del Sindicato",
    "comision_federacion": "Comisión de la Unión o Federación",
}
VALID_CARGOS = list(CARGO_GRADE.keys())


@router.get("/sindicatos")
async def search_sindicatos(q: str = "", request: Request = None):
    """Search sindicatos for signup autocomplete. Returns matches by name, sigla, or keywords."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")

    # Rate limit: 20 per IP per minute
    client_ip = request.client.host if request and request.client else "unknown"
    if not _check_auth_rate(f"sindicatos:{client_ip}", 20, 60):
        raise HTTPException(429, "Demasiadas búsquedas. Esperá un minuto.")

    try:
        with _get_conn() as conn:
            q_clean = q.strip()
            if len(q_clean) < 2:
                # Return all sindicatos when query is too short
                rows = conn.execute(
                    "SELECT id, nombre, nombre_full, sector_key, sigla, federacion, convenio, keywords FROM sindicatos ORDER BY nombre"
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT id, nombre, nombre_full, sector_key, sigla, federacion, convenio, keywords FROM sindicatos "
                    "WHERE nombre ILIKE %s OR sigla ILIKE %s OR nombre_full ILIKE %s OR keywords ILIKE %s "
                    "ORDER BY nombre",
                    (f"%{q_clean}%", f"%{q_clean}%", f"%{q_clean}%", f"%{q_clean}%")
                ).fetchall()

            results = []
            for r in rows:
                results.append({
                    "id": r[0], "nombre": r[1], "nombre_full": r[2],
                    "sector_key": r[3], "sigla": r[4],
                    "federacion": r[5], "convenio": r[6],
                })
            return {"sindicatos": results}
    except Exception as e:
        logger.error(f"Sindicatos search error: {e}")
        raise HTTPException(500, "Error al buscar sindicatos")


@router.post("/register")
async def register(req: RegisterRequest, request: Request):
    """Create account + send confirmation email. Verifies cargo against gremio_verificacion."""
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

    # Validate cargo
    if req.cargo not in VALID_CARGOS:
        raise HTTPException(400, f"Cargo inválido. Permitidos: {', '.join(VALID_CARGOS)}")

    # Resolve sindicato: if sindicato_id provided, look up sector_key + agremiacion data
    sindicato_info = None
    if req.sindicato_id:
        try:
            with _get_conn() as conn:
                row = conn.execute(
                    "SELECT id, nombre, nombre_full, sector_key, sigla, federacion, convenio FROM sindicatos WHERE id = %s",
                    (req.sindicato_id,)
                ).fetchone()
                if row:
                    sindicato_info = {
                        "id": row[0], "nombre": row[1], "nombre_full": row[2],
                        "sector_key": row[3], "sigla": row[4],
                        "federacion": row[5], "convenio": row[6],
                    }
        except Exception as e:
            logger.error(f"Error looking up sindicato {req.sindicato_id}: {e}")

    # Derive sector from sindicato if found, otherwise use req.sector
    sector = sindicato_info["sector_key"] if sindicato_info else req.sector
    if sector not in ALLOWED_SECTORS:
        raise HTTPException(400, f"Sector inválido. Permitidos: {', '.join(ALLOWED_SECTORS)}")

    # Verify cargo against gremio_verificacion
    verification_passed = True
    if req.cargo != "trabajador" and sindicato_info:
        try:
            with _get_conn() as conn:
                # Normalize name for comparison: lowercase, strip, remove extra spaces
                nombre_norm = " ".join(req.nombre.strip().lower().split())
                row = conn.execute(
                    "SELECT nombre, cargo FROM gremio_verificacion "
                    "WHERE sindicato_id = %s AND active = TRUE "
                    "AND (LOWER(nombre) ILIKE %s OR cargo = %s)",
                    (req.sindicato_id, f"%{nombre_norm}%", req.cargo)
                ).fetchone()
                if not row:
                    verification_passed = False
                    logger.info(f"Cargo verification FAILED: {req.nombre} claimed {req.cargo} in {sindicato_info['nombre']}")
        except Exception as e:
            logger.error(f"Verification DB error: {e}")
            # On DB error, be conservative: don't block registration
            verification_passed = True

    # Determine grade and rol
    if verification_passed:
        grade = CARGO_GRADE.get(req.cargo, "B.a")
        rol = CARGO_ROL.get(req.cargo, "Trabajador de Base")
    else:
        grade = "B.a"
        rol = "Trabajador de Base"
    category = "usuario"

    # Build agremiacion from sindicato data
    if sindicato_info:
        agremiacion = {
            "rol": rol,
            "federacion": sindicato_info["federacion"],
            "sindicato": sindicato_info["nombre"],
            "convenio": sindicato_info["convenio"],
            "sectorName": sindicato_info["sector_key"],
            "territorio": "",
            "empresa": "",
            "puesto": "",
        }
    else:
        agremiacion = {
            "rol": rol,
            "federacion": "",
            "sindicato": "",
            "convenio": "",
            "sectorName": sector,
            "territorio": "",
            "empresa": "",
            "puesto": "",
        }

    verificacion_pendiente = not verification_passed and req.cargo != "trabajador"

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

            conn.execute("""
                INSERT INTO users (id, email, username, password_hash, nombre, grade, sector, category, email_confirmed, confirmation_token, confirmation_sent_at, agremiacion, sindicato_id, verificacion_pendiente)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE, %s, CURRENT_TIMESTAMP, %s, %s, %s)
            """, (
                user_id, email, username, password_hash, req.nombre.strip(),
                grade, sector, category, confirmation_token,
                json.dumps(agremiacion), req.sindicato_id, verificacion_pendiente
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
    await _send_admin_notification(email, req.nombre.strip(), sector, username)

    # If verification failed, send separate admin notification
    if not verification_passed and req.cargo != "trabajador":
        await _send_verification_failed_notification(email, req.nombre.strip(), req.cargo, sindicato_info, username)

    result = {"message": "Te enviamos un email de confirmación. Hacé clic en el enlace para activar tu cuenta.", "email": email}
    if not verification_passed:
        result["verification_failed"] = True
        result["claimed_cargo"] = req.cargo
    return result


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
            # If admin email, assign grade B.d on confirmation
            admin_grade = None
            if ADMIN_EMAILS and user.get("email", "").lower() in ADMIN_EMAILS:
                admin_grade = "B.d"
                logger.info(f"Admin email confirmed: {user['email']} — assigning grade B.d")

            if admin_grade:
                conn.execute("""
                    UPDATE users SET email_confirmed = TRUE, confirmation_token = NULL,
                                    grade = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (admin_grade, user["id"]))
            else:
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

    # Find user by username, email, or nombre completo
    user = _get_user_by_username(req.username)
    if not user:
        user = _get_user_by_email(req.username)
    if not user:
        user = _get_user_by_nombre(req.username)
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

    # Auto-upgrade admin emails to B.d if not already
    if ADMIN_EMAILS and user.get("email", "").lower() in ADMIN_EMAILS and user.get("grade") != "B.d":
        try:
            with _get_conn() as conn:
                conn.execute("UPDATE users SET grade = 'B.d', updated_at = CURRENT_TIMESTAMP WHERE id = %s", (user["id"],))
                conn.commit()
                user["grade"] = "B.d"
                logger.info(f"Login: auto-upgraded admin user {user['username']} to B.d")
        except Exception as e:
            logger.warning(f"Login: failed to upgrade admin grade: {e}")

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
            "is_tester": user.get("is_tester", False),
            "verificacion_pendiente": user.get("verificacion_pendiente", False),
            "sindicato_id": user.get("sindicato_id", ""),
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
    """Return current user profile. Auto-upgrade admin users to B.d."""
    # Auto-upgrade: admin emails → B.d (sector=hornero upgrade replaced by is_tester)
    should_upgrade = False
    if ADMIN_EMAILS and user.get("email", "").lower() in ADMIN_EMAILS and user.get("grade") != "B.d":
        should_upgrade = True
    if should_upgrade and HORNERO_DB_URL:
        try:
            with _get_conn() as conn:
                conn.execute("UPDATE users SET grade = 'B.d', updated_at = CURRENT_TIMESTAMP WHERE id = %s", (user["id"],))
                conn.commit()
                user["grade"] = "B.d"
                logger.info(f"/me: auto-upgraded {user['username']} to B.d")
        except Exception as e:
            logger.warning(f"/me: failed to upgrade admin grade: {e}")

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
        "is_tester": user.get("is_tester", False),
        "verificacion_pendiente": user.get("verificacion_pendiente", False),
        "sindicato_id": user.get("sindicato_id", ""),
    }


@router.get("/admin/users")
async def admin_list_users(user: dict = Depends(_optional_auth), admin_key: str = ""):
    """List all registered users. Accepts JWT auth OR ADMIN_KEY query param."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    # Auth: either JWT or admin key
    if not user and not (ADMIN_KEY and admin_key == ADMIN_KEY):
        raise HTTPException(401, "Autenticación requerida")
    try:
        with _get_conn() as conn:
            rows = conn.execute("""
                SELECT username, email, nombre, grade, sector, territory,
                       category, email_confirmed, created_at, is_tester, verificacion_pendiente, sindicato_id
                FROM users
                ORDER BY created_at DESC
            """).fetchall()
            cols = ["username", "email", "nombre", "grade", "sector", "territory",
                    "category", "email_confirmed", "created_at", "is_tester", "verificacion_pendiente", "sindicato_id"]
            users = []
            for r in rows:
                d = dict(zip(cols, r))
                users.append({
                    "username": d["username"],
                    "email": d["email"],
                    "nombre": d["nombre"],
                    "grade": d["grade"],
                    "sector": d["sector"],
                    "territory": d["territory"],
                    "category": d["category"],
                    "email_confirmed": d["email_confirmed"],
                    "created_at": str(d["created_at"]) if d["created_at"] else "",
                    "is_tester": d.get("is_tester", False),
                    "verificacion_pendiente": d.get("verificacion_pendiente", False),
                    "sindicato_id": d.get("sindicato_id", ""),
                })
            return {"total": len(users), "users": users}
    except Exception as e:
        logger.error(f"Admin list users error: {e}")
        raise HTTPException(500, "Error al listar usuarios")


# ===== Admin: Update user (grade + sector) =====

class UpdateUserRequest(BaseModel):
    username: str
    grade: str = ""  # 'B.a', 'B.b', 'B.c', 'B.d' (empty = no change)
    sector: str = ""  # 'aceitero', 'prensa', 'comercio', 'hornero', 'otro' (empty = no change)
    secret: str = ""  # Admin secret (alternative to JWT auth)

@router.post("/admin/update-user")
async def admin_update_user(req: UpdateUserRequest, user: dict = Depends(_optional_auth)):
    """Update a user's grade and/or sector. Accepts JWT auth OR admin key."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    # Auth: either JWT or admin secret (NUKE_SECRET or ADMIN_KEY)
    if not user and not (NUKE_SECRET and req.secret == NUKE_SECRET) and not (ADMIN_KEY and req.secret == ADMIN_KEY):
        raise HTTPException(401, "Autenticación requerida (JWT o admin key)")
    valid_grades = ['B.a', 'B.b', 'B.c', 'B.d']
    valid_sectors = ['aceitero', 'prensa', 'comercio', 'hornero', 'otro']
    if req.grade and req.grade not in valid_grades:
        raise HTTPException(400, f"Grade inválido. Válidos: {', '.join(valid_grades)}")
    if req.sector and req.sector not in valid_sectors:
        raise HTTPException(400, f"Sector inválido. Válidos: {', '.join(valid_sectors)}")
    if not req.grade and not req.sector:
        raise HTTPException(400, "Especificá grade y/o sector para actualizar")
    try:
        with _get_conn() as conn:
            # Build dynamic UPDATE
            sets = []
            values = []
            if req.grade:
                sets.append("grade = %s")
                values.append(req.grade)
            if req.sector:
                sets.append("sector = %s")
                values.append(req.sector)
                # Also update category for sector hornero
                if req.sector == "hornero":
                    sets.append("category = 'tester'")
                else:
                    sets.append("category = 'usuario'")
            sets.append("updated_at = CURRENT_TIMESTAMP")
            values.append(req.username)
            cursor = conn.execute(
                f"UPDATE users SET {', '.join(sets)} WHERE username = %s",
                values
            )
            conn.commit()
            if cursor.rowcount == 0:
                raise HTTPException(404, f"Usuario '{req.username}' no encontrado")
            logger.info(f"Admin: updated {req.username} — grade={req.grade or 'same'}, sector={req.sector or 'same'}")
            return {"username": req.username, "grade": req.grade or "same", "sector": req.sector or "same", "updated": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin update grade error: {e}")
        raise HTTPException(500, "Error al actualizar grade")


# ===== Admin: Set tester flag =====

class SetTesterRequest(BaseModel):
    username: str
    is_tester: bool
    secret: str = ""

@router.post("/admin/set-tester")
async def admin_set_tester(req: SetTesterRequest, user: dict = Depends(_optional_auth)):
    """Mark/unmark a user as tester. Accepts JWT auth OR admin key."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    if not user and not (NUKE_SECRET and req.secret == NUKE_SECRET) and not (ADMIN_KEY and req.secret == ADMIN_KEY):
        raise HTTPException(401, "Autenticación requerida (JWT o admin key)")
    try:
        with _get_conn() as conn:
            cursor = conn.execute(
                "UPDATE users SET is_tester = %s, updated_at = CURRENT_TIMESTAMP WHERE username = %s",
                (req.is_tester, req.username)
            )
            conn.commit()
            if cursor.rowcount == 0:
                raise HTTPException(404, f"Usuario '{req.username}' no encontrado")
            logger.info(f"Admin: set is_tester={req.is_tester} for {req.username}")
            return {"username": req.username, "is_tester": req.is_tester, "updated": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin set-tester error: {e}")
        raise HTTPException(500, "Error al actualizar tester")


# ===== Admin: Gremio verificación CRUD =====

class GremioVerificacionRequest(BaseModel):
    sindicato_id: str
    nombre: str
    cargo: str          # "delegado" | "comision_directiva" | "comision_federacion"
    empresa: str = ""
    territorio: str = ""
    secret: str = ""

class GremioVerificacionUpdateRequest(BaseModel):
    nombre: str = ""
    cargo: str = ""
    empresa: str = ""
    territorio: str = ""
    active: bool = True
    secret: str = ""


@router.get("/admin/gremio-verificacion")
async def admin_list_verificacion(user: dict = Depends(_optional_auth), admin_key: str = "", sindicato_id: str = ""):
    """List gremio verification records. Optional filter by sindicato_id."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    if not user and not (ADMIN_KEY and admin_key == ADMIN_KEY):
        raise HTTPException(401, "Autenticación requerida")
    try:
        with _get_conn() as conn:
            if sindicato_id:
                rows = conn.execute(
                    "SELECT id, sindicato_id, nombre, cargo, empresa, territorio, active, created_at, updated_at "
                    "FROM gremio_verificacion WHERE sindicato_id = %s ORDER BY nombre",
                    (sindicato_id,)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT id, sindicato_id, nombre, cargo, empresa, territorio, active, created_at, updated_at "
                    "FROM gremio_verificacion ORDER BY sindicato_id, nombre"
                ).fetchall()
            records = []
            for r in rows:
                records.append({
                    "id": r[0], "sindicato_id": r[1], "nombre": r[2],
                    "cargo": r[3], "empresa": r[4], "territorio": r[5],
                    "active": r[6],
                    "created_at": str(r[7]) if r[7] else "",
                    "updated_at": str(r[8]) if r[8] else "",
                })
            return {"total": len(records), "records": records}
    except Exception as e:
        logger.error(f"Admin list verificacion error: {e}")
        raise HTTPException(500, "Error al listar verificaciones")


@router.post("/admin/gremio-verificacion")
async def admin_add_verificacion(req: GremioVerificacionRequest, user: dict = Depends(_optional_auth)):
    """Add a verified gremio member. Accepts JWT auth OR admin key."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    if not user and not (NUKE_SECRET and req.secret == NUKE_SECRET) and not (ADMIN_KEY and req.secret == ADMIN_KEY):
        raise HTTPException(401, "Autenticación requerida")
    if req.cargo not in ["delegado", "comision_directiva", "comision_federacion"]:
        raise HTTPException(400, "Cargo inválido. Permitidos: delegado, comision_directiva, comision_federacion")
    if not req.nombre.strip():
        raise HTTPException(400, "El nombre es obligatorio")
    try:
        with _get_conn() as conn:
            record_id = secrets.token_urlsafe(12)
            conn.execute(
                "INSERT INTO gremio_verificacion (id, sindicato_id, nombre, cargo, empresa, territorio) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (record_id, req.sindicato_id, req.nombre.strip(), req.cargo, req.empresa.strip(), req.territorio.strip())
            )
            conn.commit()
            logger.info(f"Admin: added verificacion {req.nombre} ({req.cargo}) for sindicato {req.sindicato_id}")
            return {"id": record_id, "sindicato_id": req.sindicato_id, "nombre": req.nombre.strip(),
                    "cargo": req.cargo, "empresa": req.empresa.strip(), "territorio": req.territorio.strip(), "created": True}
    except Exception as e:
        logger.error(f"Admin add verificacion error: {e}")
        raise HTTPException(500, "Error al agregar verificación")


@router.put("/admin/gremio-verificacion/{record_id}")
async def admin_update_verificacion(record_id: str, req: GremioVerificacionUpdateRequest, user: dict = Depends(_optional_auth)):
    """Update a gremio verification record. Accepts JWT auth OR admin key."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    if not user and not (NUKE_SECRET and req.secret == NUKE_SECRET) and not (ADMIN_KEY and req.secret == ADMIN_KEY):
        raise HTTPException(401, "Autenticación requerida")
    if req.cargo and req.cargo not in ["delegado", "comision_directiva", "comision_federacion"]:
        raise HTTPException(400, "Cargo inválido")
    try:
        with _get_conn() as conn:
            sets = []
            values = []
            if req.nombre:
                sets.append("nombre = %s")
                values.append(req.nombre.strip())
            if req.cargo:
                sets.append("cargo = %s")
                values.append(req.cargo)
            if req.empresa:
                sets.append("empresa = %s")
                values.append(req.empresa.strip())
            if req.territorio:
                sets.append("territorio = %s")
                values.append(req.territorio.strip())
            sets.append("active = %s")
            values.append(req.active)
            sets.append("updated_at = CURRENT_TIMESTAMP")
            if not sets:
                raise HTTPException(400, "Nada para actualizar")
            values.append(record_id)
            cursor = conn.execute(
                f"UPDATE gremio_verificacion SET {', '.join(sets)} WHERE id = %s", values
            )
            conn.commit()
            if cursor.rowcount == 0:
                raise HTTPException(404, f"Registro '{record_id}' no encontrado")
            logger.info(f"Admin: updated verificacion {record_id}")
            return {"id": record_id, "updated": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin update verificacion error: {e}")
        raise HTTPException(500, "Error al actualizar verificación")


@router.delete("/admin/gremio-verificacion/{record_id}")
async def admin_delete_verificacion(record_id: str, user: dict = Depends(_optional_auth), admin_key: str = ""):
    """Delete a gremio verification record. Accepts JWT auth OR admin key."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "Auth not configured")
    if not user and not (ADMIN_KEY and admin_key == ADMIN_KEY):
        raise HTTPException(401, "Autenticación requerida")
    try:
        with _get_conn() as conn:
            cursor = conn.execute("DELETE FROM gremio_verificacion WHERE id = %s", (record_id,))
            conn.commit()
            if cursor.rowcount == 0:
                raise HTTPException(404, f"Registro '{record_id}' no encontrado")
            logger.info(f"Admin: deleted verificacion {record_id}")
            return {"id": record_id, "deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin delete verificacion error: {e}")
        raise HTTPException(500, "Error al eliminar verificación")


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
