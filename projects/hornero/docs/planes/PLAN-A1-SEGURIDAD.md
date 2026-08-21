# Hornero — A1: Seguridad y autenticación (diseño técnico)

> Detalle de la **Parte A / Fase 0** del [PLAN-EXPANSION-MEJORA](PLAN-EXPANSION-MEJORA.md). Es el **desbloqueante nº1**: sin esto, cualquier dato real de afiliados es un riesgo.
> Alcance: backend FastAPI (`projects/hornero/backend/main.py`) + frontend PWA (`app/lit/hornero-login.js`, `app/js/db.js`).
> **Requiere acceso al repo/deploy** (`Eljaso2/hornero` en Render). Convención: **[DECISIÓN]** = definición del equipo.

---

## 1. Problema (lo que hoy está mal)
De la auditoría (`DOCUMENTACION-COMPLETA.md` §13):
1. **No hay auth de servidor.** El `username` y el `grade` llegan como parámetros del request y se confían. Cualquiera que conozca un `username` puede leer/escribir/borrar sus datos.
2. **Login 100% en el cliente.** `hornero-login.js` valida contra `PILOT_USERS` **hardcodeado con contraseñas en texto plano**; la "sesión" es solo local.
3. **Endpoints destructivos globales abiertos:** `DELETE /api/chat/clear-all`, `/api/informes/clear-all`, `/api/correcciones/clear-all` borran TODO de TODOS, sin auth.
4. **CORS `allow_origins=["*"]`** con `allow_credentials=True` (el código arma una lista de orígenes permitidos pero **no la usa**).
5. **Rate-limit solo en memoria por IP** (se pierde al reiniciar; no sirve entre réplicas).

## 2. Modelo de amenaza (qué queremos evitar)
| Amenaza | Hoy | Con A1 |
|---|---|---|
| La **empresa/un tercero** lee reportes de afiliados | Posible (basta el username) | Requiere token válido del propio usuario/grado |
| **Suplantar un grado** superior para ver más informes | Trivial (grade en el request) | El `grade` sale del token firmado, no del request |
| **Borrado masivo** (accidental o malicioso) | `clear-all` abierto | Solo admin autenticado + confirmación |
| **Fuga de credenciales** | Passwords en texto plano en el JS público | Passwords hasheadas en el server; el JS no las tiene |
| **Abuso/DoS del LLM** | Rate-limit débil | Rate-limit compartido + por usuario |

## 3. Diseño de autenticación (JWT)

### 3.1 Flujo
```
POST /api/login  {username, password}
      └─► server valida (hash) ─► devuelve  {access_token (JWT, ~2h), refresh_token (~30d)}
Cliente guarda los tokens (ver §7) y manda en cada request:
      Authorization: Bearer <access_token>
POST /api/refresh {refresh_token} ─► nuevo access_token
POST /api/logout  ─► invalida el refresh (lista de revocación)
```

### 3.2 Claims del token (lo que reemplaza a los params confiados)
```json
{
  "sub": "test1a",              // username
  "grade": "B.a",              // ← ahora viene firmado, NO del request
  "territory": "norte-santa-fe",
  "sector": "aceitero",
  "tenant": "aceiteros",       // preparar multi-sindicato (Parte D)
  "roles": ["base"],           // o ["delegado"], ["secretario"], ["federacion"], ["admin"]
  "iat": ..., "exp": ...
}
```

### 3.3 Usuarios en el servidor (mover `PILOT_USERS`)
- Nueva tabla **`users`** (en SQLite ahora; Postgres en A2): `username PK, password_hash, grade, territory, sector, tenant, nombre, email, roles(JSON), created_at, active`.
- **Hash de contraseñas** con `bcrypt` (`passlib`). Migración: importar los 8 usuarios piloto una sola vez, hasheando sus passwords actuales; **borrar `PILOT_USERS` del frontend**.
- **[DECISIÓN]** origen de usuarios: (a) alta manual por sindicato, (b) importación del **padrón** del gremio, (c) auto-registro con validación. Para el piloto: alta manual.

### 3.4 Librerías
`pyjwt` (o `python-jose[cryptography]`) + `passlib[bcrypt]`. Secreto `JWT_SECRET` por env (rotable). Agregar a `requirements.txt`.

## 4. Diseño de autorización (matriz endpoint → regla)

Regla general: **el `username`/`grade`/`territory` operativos salen del token**, no del query/body. Los params que hoy los mandan se ignoran o se validan contra el token.

| Endpoint | Regla de acceso |
|---|---|
| `POST /api/login`, `/api/refresh`, `/api/health`, `/api/config` | Público |
| `POST /api/chat`, `/chat/stream`, `/greeting`, `/audio` | Autenticado. `grade`/`sector` del token. Rate-limit por usuario. |
| `POST /api/chat/sync`, `GET /chat/sessions`, `/chat/messages`, `DELETE /chat/session` | Autenticado. **Solo sobre el propio `username`** (del token). |
| `POST /api/informes/sync`, `GET /informes/all`, `DELETE /informes/delete`, `/informes/clear-user` | Autenticado. Solo sobre el propio `username`. |
| `GET /api/informes/incoming` | Autenticado. `grade`/`territorio` **del token**; devuelve solo lo que ese grado puede ver (ya hay lógica de jerarquía, ahora blindada). |
| `POST /api/correcciones/sync`, `GET /correcciones` | Autenticado. El corrector debe tener grado ≥ al del informe (validar contra token). |
| `GET /api/kb*`, `/kb/search` | Autenticado. Filtro por `grade` del token (ya existe `grade_satisfies`). |
| `POST /api/push/*` | Autenticado (subscribe/unsubscribe atados al usuario). `notify` solo **admin**. |
| `POST /api/feedback`, `/refresh-clipping` | Autenticado. |
| **`DELETE /api/*/clear-all`** | **Solo `admin`** + header de confirmación (o eliminarlos del todo — ver §5). |

Implementación FastAPI (patrón):
```python
def current_user(token = Depends(oauth2_scheme)) -> User:
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    return get_user(payload["sub"])          # o construir desde claims

def require_admin(u: User = Depends(current_user)):
    if "admin" not in u.roles: raise HTTPException(403)

@app.get("/api/informes/all")
def informes_all(u: User = Depends(current_user)):
    return query_informes(username=u.username)   # ← del token, no del query
```

## 5. Endpoints destructivos (`clear-all`)
Hoy son "one-time cleanup" abiertos. Opciones:
- **A (recomendada):** eliminarlos del código. Para mantenimiento, usar un script CLI con acceso directo a la DB.
- **B:** dejarlos solo tras `Depends(require_admin)` + `X-Confirm: <token>`.
En ambos casos, `clear-user` pasa a operar **solo sobre el usuario del token** (no un `username` arbitrario), salvo que sea admin.

## 6. CORS, rate-limit y cabeceras
- **CORS**: usar la lista `ALLOWED_ORIGIN`/`LOCAL_ORIGIN` que ya existe (dejar de pasar `["*"]`). `allow_credentials` solo con orígenes explícitos.
- **Rate-limit**: mover a store compartido (Redis o similar en A2); clave por **usuario** (del token) además de IP; mantener el límite en `/chat` y `/chat/stream`.
- **Headers de seguridad**: `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` (via middleware).
- **Secrets**: `JWT_SECRET`, claves LLM/VAPID — todo por env (ya lo están las de LLM).

## 7. Cambios en el frontend (sin romper la app actual)
- `hornero-login.js`: **quitar `PILOT_USERS`**; el submit hace `POST /api/login` y guarda `{access, refresh}` (en IndexedDB `uiState`, no en localStorage plano; el access en memoria/sessionStorage).
- Un **wrapper de `fetch`** (como el que ya hicimos para el demo EN) que agrega `Authorization: Bearer` a todo `/api/*` y, ante `401`, intenta `/api/refresh` y reintenta; si falla, va al login.
- `db.js` (sync de informes/chat/correcciones): dejar de mandar `username` en query/body (o mandarlo y que el server lo ignore); confiar en el token.
- **Streaming**: el chat usa `fetch` a `/api/chat/stream` (SSE por fetch, no `EventSource`), así que el header `Authorization` funciona sin problema. ✅
- **Audio** (`multipart`): el token va en el header igual.
- **Logout**: `POST /api/logout` + limpiar tokens locales.

## 8. Migración por fases (deploy sin cortar el servicio)
Como la app está en producción con usuarios piloto, hacerlo **compatible hacia atrás**:

| Sub-fase | Backend | Frontend | Estado |
|---|---|---|---|
| **0.a** | Agregar `/api/login`, tabla `users` (seed piloto), `current_user` **opcional** (si viene token, se usa; si no, comportamiento viejo). Blindar `clear-all` ya. | — | Nada se rompe |
| **0.b** | — | Login real + wrapper de token; empieza a mandar `Authorization`. | Doble vía |
| **0.c** | Hacer auth **obligatoria** en los endpoints sensibles; empezar a **ignorar** `username`/`grade` de params y usar el token. | Quitar `PILOT_USERS`. | Cierre |
| **0.d** | Endurecer CORS, rate-limit compartido, headers, borrar rutas de compat. | — | Blindado |

Recordar la regla del repo (CLAUDE.md): bumpear `CACHE_NAME`/`?ver=` en cada cambio del frontend para que la PWA actualice.

## 9. Criterios de "hecho" (tests)
- [ ] Sin token válido, los endpoints sensibles devuelven **401**.
- [ ] Con token de `B.a`, `GET /informes/incoming` **no** devuelve informes de otro territorio/grado superior.
- [ ] Un usuario no puede leer/borrar chats/informes de **otro** `username`.
- [ ] `clear-all` inaccesible salvo admin (o eliminado).
- [ ] CORS rechaza orígenes no listados.
- [ ] Passwords **no** aparecen en ningún archivo del frontend.
- [ ] La app piloto sigue funcionando end-to-end tras la migración.

## 10. Decisiones abiertas [DECISIÓN]
1. **Login**: propio por sindicato (usuario/clave) vs. federado con el padrón del gremio.
2. **Duración de tokens** y si se usa refresh + revocación (recomendado sí).
3. **Roles/admin**: quién es admin (¿federación? ¿el Laboratorio del programa?).
4. **`clear-all`**: eliminar (A) vs. dejar tras admin (B).
5. **Store de rate-limit/refresh**: Redis ahora o esperar a A2 (Postgres/infra).

## 11. Riesgos / cuidados
- **No cargar datos reales de afiliados** hasta cerrar 0.c (auth obligatoria).
- Migrar los 8 usuarios piloto **hasheando** sus passwords; avisarles si hay que resetear.
- El wrapper de `fetch` no debe romper el **fallback offline** ni el streaming (probar ambos).
- Coordinar el deploy backend (Render) + frontend (GitHub Pages) para no dejar una vía a medias.

---
*Próximo documento de parte sugerido: **A2 — Infraestructura soberana (VPS + Postgres)**, que además habilita el store de refresh/rate-limit de este A1.*
