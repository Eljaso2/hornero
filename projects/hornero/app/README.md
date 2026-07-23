# Hornero APP — Proyecto

Aplicación de teléfono para organización sindical. Piloto: Federación Aceitera.

## Stack

- **Vanilla JS modular** — sin framework, sin npm, sin build step
- **PWA** (Progressive Web App) — offline-first, instalable desde browser
- **IndexedDB** — persistencia local (informes, fuentes primarias, correcciones)
- **JSON data** — datos externos cacheados por service worker
- **Capacitor** (futuro) — App Store + Play Store

## Estructura

```
hornero-app/
├── index.html            ← Entry point (shell + init script)
├── css/
│   └── hornero.css       ← CSS completo (extraído del monolito original)
├── js/
│   ├── state.js           ← State global + titles + navDef
│   ├── db.js              ← IndexedDB wrapper (8 stores, CRUD, UUID)
│   ├── navigation.js      ← goScreen/goBack/render/renderNav/menu/persistence
│   ├── data-loader.js     ← JSON → IndexedDB → offline fallback
│   ├── is.js              ← (pendiente) IS system: roles, steps, renderIS
│   ├── clipping.js        ← (pendiente) Clipping screens + toggleNews
│   ├── chat-engine.js     ← (pendiente) Motor de animación de chat
│   └── corrections.js     ← (pendiente) Correcciones trazables
├── data/
│   └── is-piloto-aceitero.json ← Datos piloto (fuentes primarias, informes G1, correcciones)
├── assets/
│   ├── manifest.json      ← PWA manifest (start_url: ./index.html)
│   ├── service-worker.js  ← PWA SW v2 (cachea CSS, JS, data, assets)
│   ├── hornero-icon-192.png
│   ├── hornero-icon-512.png
│   └── hornero-icon.svg
└── README.md              ← Este archivo
```

## Workflow de desarrollo

### 1. Agregar un screen nuevo

1. Agregar `<div class="screen-content" id="screenId">` en `index.html`
2. Agregar el title en `titles` object en `state.js`
3. Si es "outside screen" (no dentro de bodyScroll), agregar id a `outsideIds` array en `navigation.js`
4. Si necesita init específico, agregar condición en `render()` en `navigation.js`
5. Crear módulo JS si el screen tiene lógica compleja (ej: `is.js`, `clipping.js`)
6. Agregar `<script src="js/modulo.js">` en `index.html` ANTES del init script
7. Agregar ruta al service worker ASSETS array si necesita cache offline
8. Test: abrir `index.html` en browser, verificar screen funciona

### 2. Agregar data JSON nuevo

1. Crear archivo en `data/` con schema consistente (meta.version + datos)
2. Agregar filename al array `files` en `data-loader.js`
3. Agregar ruta al service worker ASSETS array
4. Bump CACHE_NAME (ej: `hornero-v2` → `hornero-v3`)
5. Test: abrir APP offline → data disponible desde IndexedDB

### 3. Flujo de carga (trabajador → informe)

```
TRABAJADOR abre APP → IS (grado 1)
  → escriba en chat input
  → APP almacena como FUENTE PRIMARIA (IndexedDB: fuentesPrimarias)
  → APP genera INFORME GRADO 1 (etiquetas + datos duros)
  → trabajador verifica → "¿Es correcto?" → confirma
  → INFORME GRADO 1 confirmado → disponible para DELEGADO (grado 2)
```

### 4. Flujo de corrección (delegado → trazabilidad)

```
DELEGADO (grado 2) ve INFORME GRADO 1
  → lee fuente primaria original
  → marca campos a corregir
  → por cada campo: valorOriginal / valorCorregido / justificación
  → APP almacena CORRECCIÓN (IndexedDB: correcciones, additive)
  → FUENTE PRIMARIA NUNCA se modifica
  → Render tabla: Valor original / Corrección delegado / Nueva valor
```

### 5. Git checkpoints

Commit después de cada módulo/screen funcional verificado. Mensajes descriptivos.

## Referencia

- Monolito original: `projects/ecosistema-hornero/hornero-capa2/Hornero Integrada — standalone WhatsApp.html`
- Documentación del ecosistema: `projects/ecosistema-hornero/`
- IS system definición: `projects/ecosistema-hornero/hornero-capa3/nucleo6-is/`
- CCT aceitero: `projects/ecosistema-hornero/hornero-capa3/nucleo7-nuestro-derecho/convenios-colectivos/cct-420-05-aceitera.md`

## Principios

1. **Local-first**: funciona offline, data en IndexedDB, no depende de server
2. **Fuente primaria immutable**: la narrativa original del trabajador NEVER se modifica
3. **Correcciones additive**: cada corrección es un registro nuevo, con trazabilidad completa
4. **Grado visibility**: cada grado ve solo lo que le corresponde por territorio
5. **Sin npm**: el trabajador abre un archivo y funciona
