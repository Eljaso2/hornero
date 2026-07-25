# Hornero App — Instrucciones para Claude

## 🔴 Regla estructural: Version bump + push OBLIGATORIO después de cada cambio

**DESPUÉS de cada cambio en archivos de la app** (JS, CSS, HTML, JSON, SW, data), ejecutar SIEMPRE estos pasos **sin esperar que el usuario lo pida**:

1. **Bump CACHE_NAME** en `app/service-worker.js` — incrementar el número (e.g., `hornero-v27` → `hornero-v28`)
2. **Bump ?v=** en `app/app-ho.html` y `app/lit/hornero-components.js` — incrementar en todos los `?v=XX` (e.g., `?v=33` → `?v=34`)
3. **Commit** cada paso lógico con mensaje descriptivo
4. **Push a GitHub** (`git push origin main`) — esto deploya automáticamente en GitHub Pages

Esto garantiza que la app se actualice sin refresh manual ni borrar cache en el dispositivo del usuario.

### Archivos de versioning

| Archivo | Qué bumpar | Ejemplo |
|---------|-----------|---------|
| `app/service-worker.js` | `CACHE_NAME = 'hornero-vXX'` | `v27` → `v28` |
| `app/app-ho.html` | `?v=XX` en `<script>` tag | `?v=33` → `?v=34` |
| `app/lit/hornero-components.js` | `?v=XX` en todos los imports | `?v=33` → `?v=34` |

### Secuencia de commits sugerida

1. Commit del cambio funcional (e.g., "Home: badge Actualidad en carrusel")
2. Commit del version bump (e.g., "Bump SW v28 + ?v=34")
3. Push

## Hosting

La app está en **GitHub Pages** (repo: `Eljaso2/hornero`). Push a `main` = deploy automático. No sugerir cloud comercial sin explicitar riesgos de privacidad — ver [[feedback-hosting-privacidad]].

## No restaurar versiones viejas

NUNCA restaurar HTML/CSS/JS desde backup o versión vieja. Solo Edit incremental + git checkpoints. Ver [[no-restaurar-version-vieja]].

## Archivos legacy (no tocar salvo cleanup deliberado)

- `app/index.html` — copia vieja con `?v=28` (stale). Entry point canónico = `app-ho.html`.
- `app/assets/service-worker.js` — SW v4 legacy, no registrado por la app.
- `app/assets/manifest.json` — manifest viejo con theme_color distinto.

## Git commits

Commits recurrentes por cada paso lógico, no acumular al final. Ver [[feedback-commits-recurrentes]].
