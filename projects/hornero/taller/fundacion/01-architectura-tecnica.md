# Hornero — Arquitectura Técnica

> Versión 1.0 — 23 julio 2026
> Estado: Arquitectura definida. Pendiente: implementación Phase 1.
> Precedido por: `00-design-conceptual.md` (diseño conceptual v1.0)

---

## 1. Visión general

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA SOBERANA                   │
│         VPS argentino · Postgres · Qdrant · Neo4j            │
│                    MinIO · TLS · AES-256                      │
├─────────────────────────────────────────────────────────────┤
│                    CAPA 3 — PRODUCCIÓN                        │
│    N6-IS  N7-Derecho  N8-Historia  N9-Cómo Somos            │
│    N10-Coyuntura  N11-CE  N12-Tu Historia                   │
│    N13-IFT  N14-Acción  N15-SMVM                             │
│         FastAPI · LangGraph · RAG pipeline                   │
├─────────────────────────────────────────────────────────────┤
│                    CAPA 2 — APP (PWA)                         │
│    HoComponent nativo · IndexedDB offline                    │
│    <hornero-app> shell + 16 componentes esfera              │
│    Capacitor → App Store (Phase 3)                           │
├─────────────────────────────────────────────────────────────┤
│                    CAPA 1 — GOBERNANZA                        │
│    N1-Filosofía  N2-Laboratorio  N3-Estructura              │
│    N4-Protección · Librería Base · Taxonomía soberana        │
└─────────────────────────────────────────────────────────────┤
```

**Flujo bidireccional:**

- ↓ Capa 3 produce informes, indices, convenios, clipping → Capa 2 presenta al trabajador
- ↑ Capa 2 recibe observaciones, testimonios, consultas → Capa 3 procesa y etiqueta
- ↔ Capa 1 define reglas, categorías, protección → todas las capas consumen

**Principio clave:** la App (N5) es **consumidor**, no productor. No tiene repositorio propio. Local-first en el teléfono, sync con backend soberano. Cada esfera consume lo que su núcleo backend produce.

---

## 2. Stack tecnológico

| Rol | Tecnología | Soberano? | Estado | Phase |
|------|-----------|----------|--------|-------|
| **Frontend shell** | HoComponent (Web Components nativos, ~3KB) | ✅ | Implementado en hornero/app/lit/ | 1 |
| **Frontend offline** | IndexedDB (11 stores) | ✅ | Existente, bugs corregidos | 1 |
| **Frontend packaging** | Capacitor | ✅ | Pendiente | 3 |
| **Backend API** | FastAPI (Python 3.11+) | ✅ | Nuevo — skeleton | 1 |
| **Agent orchestration** | LangGraph | ✅ | Pendiente | 2 |
| **Agent sandbox** | Dify (self-hosted) | ✅ | Pendiente | 2 |
| **LLM generation** | DeepSeek API → fine-tuned own | 🔄 → ✅ | Transitional | 2 → 3 |
| **Embeddings** | BGE (BAAI General Embedding) | ✅ | Pendiente | 2 |
| **Vector search** | Qdrant | ✅ | Pendiente | 2 |
| **Knowledge graph** | Neo4j | ✅ | Pendiente | 3 |
| **Document storage** | MinIO (objects) + Postgres (structured) | ✅ | Postgres Phase 1, MinIO Phase 2 | 1-2 |
| **Audio transcription** | Whisper (on-device) | ✅ | Pendiente | 2 |
| **Encryption transit** | TLS (HTTPS) | — | Phase 1 | 1 |
| **Encryption storage** | AES-256 (sensitive data) | — | Phase 2 | 2 |
| **Infrastructure** | VPS argentino (soberanía funcional) | ✅ | Pendiente setup | 1 |

### Decisiones de stack y su justificación

**HoComponent nativo (frontend)** — Web Components nativos con helper reactivo propio (~3KB, zero dependencies). La app tiene 6 esferas × múltiples sub-funciones con cruces de datos (ICE×SMVM, IFT×CE), chat IA en varias secciones, etiquetamiento automático, sistema de grades, y offline-first. Vanilla JS con estado global no escala para esta complejidad. HoComponent es la opción correcta porque:
- **Web Components son estándar web nativo** — no un framework externo
- **~3KB helper** — archivo local `ho-component.js`, sin npm, sin CDN, zero dependencies
- **Shadow DOM**: encapsula CSS/DOM de cada componente
- **Propiedades reactivas**: cambios trigger re-render automático
- **Custom events + `composed: true`**: comunicación limpia entre Shadow DOM boundaries
- **`html`/`css` tagged templates**: declarative rendering sin librería externa
- Cada esfera = componente independiente → escala bien
- **Principio**: abrir archivo y funciona — literalmente zero dependencies

Originalmente se consideró Lit Web Components, pero Lit no tiene bundle oficial de un solo archivo y requiere npm/CDN. HoComponent alcanza los mismos beneficios arquitecturales (Shadow DOM, reactiva, encapsulación) sin dependencias externas.

**FastAPI (backend)** — El backend es ML-heavy: RAG, fine-tuning, labeling, embeddings, LangGraph, Whisper, Qdrant client, Neo4j driver — todo es Python-nativo. FastAPI es async, ligero, tipado, con OpenAPI automático.

**Qdrant + BGE (vector search)** — BGE es open-source (BAAI, academia china), se puede self-hostar. No es Silicon Valley. Alineado con la filosofía Xiong: crear, no consumir. Qdrant es open-source,高性能, self-hosted.

**DeepSeek transitional → fine-tuned own** — Soberanía de datos ✅ (fragmentos se recuperan localmente antes de composición), soberanía de modelo 🔄 (en camino). El pipeline RAG recupera fragmentos desde Qdrant/Postgres/MinIO antes de pasarlos al LLM — DeepSeek solo ve el prompt compuesto, no el corpus crudo. Migration path: cuando el Laboratorio (N2) produzca modelos fine-tuned, DeepSeek se reemplaza.

**LangGraph + Dify** — LangGraph maneja producción (agent orchestration con state management). Dify como sandbox/banco de pruebas para prototipar y evaluar configuraciones antes de pasar a LangGraph. Pragmático: Dify para iteración rápida, LangGraph para producción.

---

## 3. Frontend — PWA/App (Lit Web Components)

### 3.1 Componentes

| Componente | Esfera/Núcleo | Descripción |
|-----------|--------------|-------------|
| `<hornero-app>` | Shell | Navegación, auth, grade, state global |
| `<hornero-home>` | Inicio | Cards, novedades, entry points |
| `<hornero-is>` | N6 — IS | Roles, steps, chat, observaciones |
| `<hornero-nuestro-derecho>` | N7 — Derecho | Convenio interactivo, leyes, chat derecho |
| `<hornero-argumento>` | N7+8+9+10 — Argumento | Argumentación sindical, arsenal |
| `<hornero-comunicador>` | N14 — Comunicador | Generación de volantes, informes, notas |
| `<hornero-coyuntura>` | N10 — Coyuntura | Clipping, mirador mate, reporte gremial |
| `<hornero-condicion>` | Cluster | Wrapper para CE + IFT + Cómo Somos + SMVM |
| `<hornero-ce>` | N11 — CE | Comportamiento Empresarial, Índice ICE |
| `<hornero-ift>` | N13 — IFT | Felicidad del Trabajador, 6 dimensiones |
| `<hornero-smvm>` | N15 — SMVM | Salario Mínimo en contexto |
| `<hornero-como-somos>` | N9 — Cómo Somos | Foto/película clase trabajadora |
| `<hornero-tu-historia>` | N12 — Tu Historia | Diálogo semiestructurado, testimonios |
| `<hornero-historia-obrera>` | N8 — Historia | Historia del movimiento obrero |
| `<hornero-ecosistema>` | N1 — Info | Qué es Hornero, Xiong, cadena de valor |
| `<hornero-chat>` | Motor reutilizable | Typing, bubbles, input, fuente citations |

Todos heredan de `HoComponent` (`app/lit/ho-component.js`). Shadow DOM encapsula cada componente. Propiedades reactivas via `set(prop, value)`. Eventos via `emit(name, detail)` con `composed: true`.

### 3.2 Estado y comunicación

**Estado global** (en `<hornero-app>`):
- `userGrade`: 'A' | 'B.a' | 'B.b' | 'B.c' | 'B.d'
- `userTerritory`: string (para B grades)
- `userSector`: string (aceitero, etc.)
- `currentScreen`: string
- `isOnline`: boolean
- `authToken`: JWT string (si logged in)

**Comunicación entre componentes**:
- **↓ Props**: `<hornero-app>` pasa grade, territory, sector via properties
- **↑ Events**: componentes emiten custom events (`observation-added`, `query-submitted`, `screen-change`)
- **↔ IndexedDB**: cada componente lee/escribe stores pertinentes directamente
- **↔ Backend**: `sync` module maneja bidirectional sync cuando online

**Sin estado global mutable** — cada componente es responsable de su propio estado reactivo. El `state` object global de la implementación vanilla JS desaparece.

### 3.3 Offline-first

**IndexedDB stores** (schema existente, se mantiene con correcciones):

| Store | keyPath | Índices | Phase |
|-------|---------|---------|-------|
| `cargas` | `id` | `fecha`, `trabajadorId`, `estado` | 1 |
| `fuentesPrimarias` | `id` | `fecha`, `cargaId` | 1 (inmutable) |
| `informes` | `id` | `grado`, `semana`, `territorio`, `estado` | 1 |
| `correcciones` | `id` | `informeId`, `correctorGrado`, `fecha` | 1 |
| `clipping` | `id` | `numero`, `fecha` | 1 |
| `media` | `id` | `cargaId` | 2 |
| `syncQueue` | `id` | `tipo`, `estado` | 1 |
| `uiState` | `key` | (none) | 1 |
| `sectores` | `id` | `federacion`, `cct` | 1 (NEW) |
| `usuarios` | `id` | `grade`, `territorio` | 1 (NEW) |
| `convenios` | `id` | `cctNumero`, `rama` | 1 (NEW) |

**Offline guarantees**:
- Convenio del sector + luchas principales + discursos relevantes = cached en IndexedDB
- App funciona offline para: leer convenio, ver clipping cached, cargar observaciones (queue en syncQueue)
- Sync cuando online: syncQueue procesa → backend recibe observaciones → backend envía updates
- Service Worker: cache-first con pre-cache de JS + data JSON + Lit bundle

### 3.4 Transición desde hornero-app (vanilla JS)

**Estrategia: fix primero, migrar después, módulo por módulo.**

**Step 1 — Fix bugs críticos** ✅ (completado):
- `navigation.js`: typeof checks para módulos inexistentes
- `css/hornero.css`: CSS custom properties
- `service-worker.js`: pre-cache JS + data JSON
- `db.js`: +3 stores (sectores, usuarios, convenios), version bump
- `data-loader.js`: version check + seed sector data

**Step 2 — HoComponent shell + first components** ✅ (completado):
- `app/lit/ho-component.js` — helper reactivo (~3KB, zero deps)
- `<hornero-app>` shell con navigation, state global, Shadow DOM
- `<hornero-home>` cards con grade badge, sector tag
- Vanilla JS modules siguen existiendo — HoComponent se integra gradualmente

**Step 3 — Migrate IS module** (siguiente):
- `<hornero-is>` reemplaza el pending `is.js` vanilla
- Roles, steps, chat → HoComponent reactive properties
- IndexedDB reads/writes → same db.js API (no refactor de db)

**Step 4 — Migrate rest** (gradual, por esfera):
- Coyuntura → `<hornero-coyuntura>`
- Nuestro Derecho → `<hornero-nuestro-derecho>`
- CE → `<hornero-ce>`
- etc.

**Resultado final**: index.html = `<hornero-app>` tag + `hornero-components.js` import. Todo es Web Components. Sin estado global. Sin funciones globales. Sin dependencias externas.

---

## 4. Backend — API + RAG (FastAPI)

### 4.1 API endpoints

```
/api/
├── auth/
│   ├── POST /login          — login con credencial sindical
│   ├── POST /register       — registro libre (grade A)
│   ├── POST /upgrade        — habilitación sindical (A → B.a/B.b/B.c/B.d)
│   ├── POST /revoke         — revocación instantánea de acceso
│   └── GET  /me             — perfil, grade, territory
│
├── query/
│   ├── POST /               — pipeline RAG 6 pasos (universal)
│   ├── POST /convenio       — convenio interactivo
│   └── POST /derecho        — chat derecho con fuente citations
│
├── is/
│   ├── POST /observation    — cargar observación (grade 1)
│   ├── GET  /reports        — informes por grade + territory
│   ├── POST /correction     — corrección aditiva (grade 2+)
│   └── GET  /corrections    — correcciones por informe
│
├── convenio/
│   ├── GET  /{cct_numero}   — convenio completo
│   ├── GET  /clause/{id}    — cláusula específica
│   ├── POST /search         — búsqueda en lenguaje natural
│   └── GET  /paritarias     — historial paritarias
│
├── clipping/
│   ├── GET  /latest         — último clipping semanal
│   ├── GET  /{numero}       — clipping por número
│   ├── GET  /sources        — catalogo de fuentes
│
├── ce/
│   ├── GET  /ice/{empresa}  — ICE por empresa (4 dimensiones)
│   ├── GET  /ice/sector     — ICE por sector (agregado)
│   ├── GET  /ice/region     — ICE por región
│   ├── POST /observation    — carga espontánea (etiquetado 4 dims)
│   ├── GET  /companies      — empresas del sector
│
├── ift/
│   ├── GET  /dimensions     — 6 dimensiones IFT
│   ├── GET  /sector         — IFT agregado por sector
│   ├── GET  /personal       — IFT personal (private)
│
├── smvm/
│   ├── GET  /current        — SMVM actual + contexto
│   ├── GET  /canasta        — canasta básica vs SMVM
│   ├── GET  /inflation      — inflación obrera vs oficial
│   ├── GET  /distribution   — distribución del ingreso
│   ├── POST /chat           — chat "compará tu salario"
│
├── como-somos/
│   ├── GET  /present        — foto presente clase trabajadora
│   ├── GET  /dynamic        — película dinámica
│   ├── GET  /international  — comparación internacional
│
├── tu-historia/
│   ├── POST /testimony      — testimonio con consentimiento
│   ├── GET  /my-archive     — archivo personal (editable)
│   ├── GET  /sector         — síntesis anonimizadas
│
├── sync/
│   ├── POST /push           — observations/testimonios → backend
│   ├── GET  /pull           — updates/informes → app
│   ├── GET  /status         — sync queue status
│
└── admin/
    ├── GET  /users          — lista usuarios (admin only)
    ├── POST /assign-grade   — asignar grade (admin only)
    ├── GET  /analytics      — tendencias agregadas (B.d only)
```

### 4.2 RAG pipeline — 6 pasos (universal)

Todo query pasa por el mismo pipeline. Componente compartido de la Librería Base (N2):

```
1. INTENT CLASSIFICATION
   └───────────────────
   Orchestrator clasifica la consulta:
   ¿Convenio? ¿Derecho? ¿Argumento? ¿CE? ¿IFT? ¿SMVM?
   → Route al agent experto correspondiente

2. BRANCH + VALIDITY FILTERING
   └───────────────────
   Descarta info NO relevante al sector del usuario
   Descarta info NO vigente (convenios/leyes derogados)
   → Scope narrowing

3. HYBRID SEARCH
   └───────────────────
   Vector (Qdrant + BGE): búsqueda semántica
   Exact match: "Art. 245", "Ley 20.744", "CCT 420/05"
   → Fragmentos recuperados con score

4. KNOWLEDGE GRAPH CONNECTION
   └───────────────────
   Neo4j conecta: sindicato → convenio → ley → hecho → figura
   → Contexto relacional enriches fragments

5. VERIFICATION AGENT
   └───────────────────
   Verifica: cada claim tiene respaldo documental?
   Si NO encuentra fuente → explicita "no podemos confirmar"
   → Guardrail contra hallucination

6. SOURCE-CITED RESPONSE
   └───────────────────
   Cada respuesta incluye:
   · Norma/artículo específico
   · Fecha de vigencia
   · Link al documento original
   → Principio: siempre con la fuente
```

### 4.3 Grade enforcement en backend

**Principio**: el backend **nunca** envía al cliente lo que no corresponde al grade del usuario. No es filtrado en frontend — es segregado en backend.

**Implementación**:

```python
# Every endpoint decorator checks grade
def require_grade(min_grade: str):
    """Decorator que valida JWT grade claim >= min_grade."""
    def decorator(endpoint):
        async def wrapper(request, *args, **kwargs):
            token = extract_jwt(request)
            user_grade = token.get("grade")
            user_territory = token.get("territory")

            if not grade_satisfies(user_grade, min_grade):
                raise HTTPException(403, "Acceso no autorizado para este grade")

            # Filter response data by grade + territory
            response = await endpoint(request, *args, **kwargs)
            return filter_by_grade_territory(response, user_grade, user_territory)
        return wrapper
    return decorator
```

**Grade hierarchy**: A → B.a → B.b → B.c → B.d (B.d = máximo)

**Territorial scoping**: un delegado en territorio A NO ve datos de territorio B. Backend filtra por `territorio` del usuario en cada query.

**No horizontal access**: la query SQL/ORM siempre incluye `WHERE territorio = user_territory` para grades B.a/B.b. B.c ve su sindicato. B.d ve toda la federación.

**Encryption scope por grade**:
- Grade 1 (observaciones individuales): AES-256 encrypted, names/companies encrypted
- Grade 2 (informes delegado): some fields encrypted, aggregated
- Grade 3 (informes secretario): mostly clear, strategic data encrypted
- Grade 4 (informes federación): public product when secretary decides, clear
- Chat queries: **privadas, invisibles para todos**, no stored in readable form

**Revocación instantánea**: endpoint `/api/auth/revoke` invalida JWT inmediatamente. Blacklist en Postgres + cache en Redis (Phase 2).

---

## 5. Infraestructura soberana

### 5.1 VPS argentino (Phase 1)

**Principio**: soberanía funcional — control de acceso, datos y modelos, no rack físico. Un VPS donde se controla todo el stack (OS, DB, modelo, acceso) es funcionalmente soberano.

**Requisitos**:
- Jurisdicción argentina (datos en Argentina)
- Empresa chica, confiable, no cloud multinacional
- Full root access, SSH, control del OS
- No AWS, no GCP, no Azure

**Stack en VPS** (Phase 1):
```
┌── Nginx (reverse proxy + TLS) ──────────────────────┐
│                                                      │
│  ├── FastAPI (backend) ─── port 8000                 │
│  ├── Postgres (structured data) ─── port 5432        │
│  ├── Redis (cache + JWT blacklist) ─── Phase 2       │
│  │                                                    │
│  └── Static files (PWA frontend) ─── Nginx serves    │
│                                                      │
│  Backup: cron → pg_dump → local + offsite (Arg)      │
│  Monitoring: simple health check endpoint             │
└──────────────────────────────────────────────────────┘
```

**Stack en VPS** (Phase 2+):
```
┌── Nginx ────────────────────────────────────────────┐
│                                                      │
│  ├── FastAPI (backend)                               │
│  ├── Postgres (structured data)                      │
│  ├── Qdrant (vector search) ─── port 6333            │
│  ├── Neo4j (knowledge graph) ─── port 7474/7687      │
│  ├── MinIO (document storage) ─── port 9000          │
│  ├── Redis (cache + blacklist)                       │
│  ├── Dify (sandbox) ─── self-hosted                  │
│  │                                                    │
│  └── Static files (PWA frontend)                     │
└──────────────────────────────────────────────────────┘
```

### 5.2 Deployment

**Phase 1**: Docker Compose para local dev. VPS deployment via SSH + docker compose. No CI/CD pipeline (too early). Manual deployment con git pull + docker compose up.

**Phase 2**: Considerar CI/CD simple (GitHub Actions → VPS). Auto-deploy on main branch merge. Health checks automáticos.

**Phase 3**: Orchestration más robusto si scale lo exige. Monitoring con Prometheus + Grafana (self-hosted).

### 5.3 Backup

- Postgres: `pg_dump` diario → encrypted → almacenado en VPS + offsite (Argentina)
- IndexedDB (app): worker data local-first, syncQueue cuando online. No se pierde si server down.
- MinIO (Phase 2): replication configurable dentro de Argentina
- No dependency de cloud externo para backup crítico

---

## 6. Sistema de grades — implementación técnica

### 6.1 Tabla de acceso por grade

| Grade | Rol | Ver | Cargar | Produces | Territorial scope |
|-------|-----|-----|--------|----------|-------------------|
| **A** | Libre | Básico, superficial | Nada | Nada | Ninguno (contenido público only) |
| **B.a** (grade 1) | Afiliado | Informes G1 propios + público | Observaciones G1 | Nada | Su territorio (read own only) |
| **B.b** (grade 2) | Delegado | G1 de su territorio + G2 propios | Correcciones G2 | Informes G2 | Su territorio (read all G1 in territory) |
| **B.c** (grade 3) | Secretario | G2 de su sindicato + G3 propios | Correcciones G3 | Informes G3 | Su sindicato (read all G2 in sindicato) |
| **B.d** (grade 4) | Federación | G3 de federación + G4 + tendencias | Tendencias analysis | Informes G4 (panorama) | Federación (read all G3) |

### 6.2 JWT structure

```json
{
  "sub": "user-uuid",
  "grade": "B.b",
  "territory": "San Lorenzo",
  "sindicato": "SOEA-SanLorenzo",
  "sector": "aceitero",
  "federacion": "Federación Aceitera",
  "iat": 1721748000,
  "exp": 1722448000
}
```

### 6.3 API filtering implementation

```python
GRADE_ORDER = ["A", "B.a", "B.b", "B.c", "B.d"]

def grade_satisfies(user_grade: str, required_grade: str) -> bool:
    return GRADE_ORDER.index(user_grade) >= GRADE_ORDER.index(required_grade)

def filter_by_grade_territory(data, user_grade, user_territory, user_sindicato):
    """Filter data based on grade + territorial scope."""
    if user_grade == "A":
        return [d for d in data if d.get("public")]
    if user_grade == "B.a":
        return [d for d in data if d.get("grado") == 1 and d.get("territorio") == user_territory and d.get("trabajadorId") == user_id]
    if user_grade == "B.b":
        return [d for d in data if d.get("grado") <= 2 and d.get("territorio") == user_territory]
    if user_grade == "B.c":
        return [d for d in data if d.get("grado") <= 3 and d.get("sindicato") == user_sindicato]
    if user_grade == "B.d":
        return [d for d in data if d.get("grado") <= 4 and d.get("federacion") == user_federacion]
```

### 6.4 Encryption scope

- **Grade 1 data** (observaciones individuales): AES-256. Nombres, empresas, datos sensibles encrypted. Solo delegado (B.b) del territory puede decrypt.
- **Grade 2 data** (informes delegado): some fields encrypted. Aggregated pero con identifiers.
- **Grade 3 data** (informes secretario): mostly clear. Strategic data encrypted.
- **Grade 4 data** (informes federación): **public product** cuando secretario general decide publicar. Clear.
- **Chat queries**: encrypted in transit + at rest. Privadas, invisibles. Solo tendencias agregadas visibles para B.d (con consentimiento colectivo).

### 6.5 Traceabilidad

Toda pieza de datos tiene audit trail desde fuente (Grade 1 original narrative) hasta todos los aggregation steps. El sistema almacena la **fuente original unmodificada** junto a todos los informes derivados.

Correcciones son **aditivas**: nunca modifican el original. Cada corrección es un registro nuevo con `valorOriginal`, `valorCorregido`, `justificación`, `correctorGrade`, `correctorId`.

---

## 7. Seguridad

### 7.1 Principios (del diseño conceptual)

1. **Separación por niveles**: contenido segregado en backend, nunca se envía al cliente lo que no corresponde al grade
2. **Acceso progresivo + revocación**: cada grade ve solo lo necesario; sindicato puede de-habilitar instantáneamente
3. **Curación como filtro**: chat privado (no trollable), secciones con curación sindical, mecanismos de reporte
4. **Conocimiento server-side**: RAG y prompts viven en el backend; rate limiting; watermarking; no modo "exportar" la biblioteca

### 7.2 Implementación

**TLS**: HTTPS everywhere. VPS con Let's Encrypt (auto-renewal). No HTTP mixed content.

**AES-256**: Grade 1 data encrypted at rest. Implementation: Python `cryptography` library. Key management: environment variable on VPS (Phase 1), proper key management service (Phase 2).

**EXIF stripping**: toda foto/video cargada por la app → automatic EXIF metadata removal (location, device model, timestamp) antes de storage. Visual content preserved; identity traces removed. Implementation: client-side JavaScript EXIF remover before upload.

**Rate limiting**: FastAPI middleware. Limits por endpoint y por user. Previene scraping de la biblioteca. Implementation: slowapi o custom middleware.

**Watermarking**: respuestas RAG carry invisible watermark (stylistic markers, specific phrasing patterns) que permite identificar si un texto proviene de Hornero. No visible al usuario, detectable por análisis.

**No export mode**: no hay endpoint para descargar la biblioteca completa. Cada query devuelve fragmentos específicos con fuente citations. La biblioteca se consulta, no se exporta.

**Chat privacy**: consultas del chat son **privadas, invisibles para todos**. No se almacenan en forma readable. Solo tendencias agregadas (anonimizadas) visibles para B.d con consentimiento colectivo.

---

## 8. Integración gradual — hornero-app ↔ backend

### Phase 1 — Manual + local data

- App funciona **offline-first** con data JSON local
- IndexedDB como storage local
- Backend FastAPI skeleton: auth + sync endpoints
- App → backend: sync observations cuando online (syncQueue)
- Backend → app: updates (new clipping, convenio changes) via pull

**Conexión**: cuando app detecta online → POST `/api/sync/push` (observaciones) → GET `/api/sync/pull` (updates). Cuando offline → queue en syncQueue local.

### Phase 2 — RAG entra

- App → backend: POST `/api/query` (chat queries) → pipeline RAG 6 pasos → response con fuentes
- App → backend: POST `/api/is/observation` (observaciones con etiquetado IA)
- Backend → app: convenio interactivo responses, CE data, IFT data
- IndexedDB cache de responses frecuentes (offline fallback)

**Conexión**: cada componente Lit decide si query es local (cached en IndexedDB) o remota (POST to backend). Si offline → muestra cached o explica "necesitas conexión para esta consulta".

### Phase 3 — Ecosistema completo

- Bidirectional completo: observations, testimonios, queries, sync
- Knowledge graph enriches every query
- Fine-tuned model on VPS replaces DeepSeek
- Capacitor wrapper for App Store

---

## 9. Fases de desarrollo

### Phase 1 — Piloto arranca (6-8 meses)

| Componente | Estado al inicio | Estado al fin |
|-----------|-----------------|---------------|
| **hornero-app bugs** | Runtime errors, CSS hardcoded, SW incomplete | All bugs fixed |
| **Lit migration** | Vanilla JS | Shell + home + IS = Lit components |
| **FastAPI skeleton** | No existe | Auth + sync + basic convenio query |
| **Postgres** | No existe | Users, grades, territories, convenios schema |
| **VPS** | No existe | Setup, TLS, deployment operational |
| **IS (N6)** | Manual | Grade system operativo con aceiteros |
| **Coyuntura (N10)** | Manual (clipping weekly) | Continua manual, App muestra clipping cached |
| **Nuestro Derecho (N7)** | PDFs escaneados | First convenio digitized + basic query |
| **CE (N11)** | Concept defined | First manual ICE×SMVM report |

**Deliverables Phase 1**:
1. hornero-app con bugs corregidos
2. Lit shell + home + IS components funcionando
3. FastAPI backend con auth + sync + convenio query
4. Postgres schema deployed
5. VPS setup con TLS
6. Grade system operativo (manual, con aceiteros)

### Phase 2 — IA entra (8-14 meses)

| Componente | Estado al inicio | Estado al fin |
|-----------|-----------------|---------------|
| **Qdrant + BGE** | No existe | Vector search operational |
| **LangGraph** | No existe | Agent orchestration pipeline |
| **Dify** | No existe | Sandbox self-hosted |
| **Convenio interactivo** | Basic query | Chat natural language |
| **Como Somos (N9)** | Concept defined | Datos Inigo Carrera loaded |
| **IFT (N13)** | Concept defined | Primer índice 6 dimensiones |
| **Tu Historia (N12)** | Concept defined | Diálogo guiado engine |
| **Lit migration** | Shell + home + IS | + coyuntura + derecho + CE |
| **MinIO** | No existe | Document storage operational |
| **Whisper on-device** | No existe | Audio transcription local |
| **AES-256** | TLS only | Encrypted sensitive data at rest |

**Deliverables Phase 2**:
1. RAG pipeline 6 pasos funcionando
2. Convenio interactivo (chat)
3. Como Somos con datos reales
4. IFT primer índice
5. Tu Historia diálogo
6. Más Lit components migrados
7. MinIO + Whisper operational
8. AES-256 encryption operational

### Phase 3 — Ecosistema completo (14-24 meses)

| Componente | Estado al inicio | Estado al fin |
|-----------|-----------------|---------------|
| **Neo4j** | No existe | Knowledge graph operational |
| **Argumento** | Concept defined | Componente completo |
| **Comunicador** | Concept defined | Componente completo |
| **ICE×SMVM** | Manual reports | Interactive + comparative |
| **IFT comparative** | National only | International comparisons |
| **Fine-tuned model** | DeepSeek transitional | Own model on VPS |
| **Starter kit** | No existe | Kit para otras federaciones |
| **Capacitor** | No existe | App Store distribution |
| **All Lit components** | Partial | Todos migrados |
| **Co-design cycle** | Informal | Formal iterative cycle |

**Deliverables Phase 3**:
1. Knowledge graph enriching every query
2. Argumento + Comunicador completos
3. Fine-tuned model replacing DeepSeek
4. Starter kit para replicar con otras federaciones
5. Capacitor para App Store
6. Ciclo de codiseño formal operativo

---

## 10. Acciones inmediatas (Phase 1 start)

### 10.1 Fix bugs hornero-app

1. **navigation.js** — wrap llamadas a módulos inexistentes:
   ```javascript
   // Before: isChatInit(); renderIS();
   // After:
   if (typeof isChatInit === 'function') isChatInit();
   if (typeof renderIS === 'function') renderIS();
   ```
   Same for all chat-engine, corrections, clipping references.

2. **css/hornero.css** — extract colors to CSS variables:
   ```css
   :root {
     --ho-green: #6E8345;
     --ho-green-light: #94A867;
     --ho-green-pale: #E8EDD7;
     --ho-green-dark: #586B33;
     --ho-dark: #33312D;
     --ho-dark-surface: #45433E;
     --ho-dark-mid: #5A574F;
     --ho-bg: #F4F3EE;
     --ho-card: #FBFAF6;
     --ho-warm-gray: #E6E3DB;
     --ho-mid-gray: #ECEAE3;
     --ho-text: #2B2A26;
     --ho-text-mid: #6E6A60;
     --ho-text-light: #9C988D;
     --ho-text-off: #F2F1EC;
     --ho-gold: #B0863F;
   }
   ```

3. **service-worker.js** — add missing files to ASSETS:
   ```javascript
   const ASSETS = [
     './index.html',
     './css/hornero.css',
     './js/state.js',
     './js/db.js',
     './js/navigation.js',
     './js/data-loader.js',
     './data/is-piloto-aceitero.json',
     './assets/manifest.json',
     './assets/hornero-icon-192.png',
     './assets/hornero-icon-512.png',
     'https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap'
   ];
   ```

4. **db.js** — add `sectores` store:
   ```javascript
   // In HORNERO_DB.stores:
   sectores: { keyPath: 'id', indexes: ['federacion', 'cct'] }
   ```

5. **data-loader.js** — add version check + seed sector data:
   ```javascript
   // Check if data already seeded before seeding again
   async function seedData(data) {
     const existing = await dbGet('data-is-piloto-aceitero.json', 'uiState');
     if (existing?.dataVersion === data.meta.version) return; // skip
     // ... existing seed logic ...
     // ADD: seed sector data
     if (data.sector) {
       await dbPut({ id: data.sector.federacion, ...data.sector }, 'sectores');
     }
   }
   ```

### 10.2 Create Lit component skeleton

Crear subdirectory `lit/` en hornero-app con:
- `lit/lit-bundle.js` — Lit library bundle (local file, ~15KB)
- `lit/hornero-app.js` — Shell component (navigation, state, auth)
- `lit/hornero-home.js` — Home component (cards, novedades)
- `lit/hornero-chat.js` — Chat motor reutilizable

Modificar `index.html` para cargar Lit bundle + shell component.

### 10.3 Create FastAPI backend skeleton

Crear subdirectory `backend/` en projects/hornero/ con:
- `backend/main.py` — FastAPI app con CORS, health check
- `backend/api/auth.py` — Auth endpoints (login, register, upgrade, revoke)
- `backend/api/sync.py` — Sync endpoints (push, pull)
- `backend/api/convenio.py` — Basic convenio query
- `backend/db/schema.sql` — Postgres schema (users, grades, territories, convenios)
- `backend/docker-compose.yml` — Local dev (FastAPI + Postgres)
- `backend/requirements.txt` — Dependencies

### 10.4 Write this document

`projects/hornero/01-architectura-tecnica.md` — ✅ This document.

---

## Referencias

- Diseño conceptual: `projects/hornero/00-design-conceptual.md`
- Ecosistema map: `projects/ecosistema-hornero/hornero-ecosistema.md`
- Backend nuclei: `projects/ecosistema-hornero/hornero-capa3/nucleos6-15-backend.md`
- IS grades + taxonomy: `projects/ecosistema-hornero/hornero-capa3/nucleo6-is/nucleo6-is.md`
- Infrastructure: `projects/ecosistema-hornero/hornero-capa1/nucleo3-estructura.md`
- Protection: `projects/ecosistema-hornero/hornero-capa1/nucleo4-proteccion.md`
- App spec: `projects/ecosistema-hornero/hornero-capa2/nucleo5-app.md`
- Financing: `projects/ecosistema-hornero/hornero-financiamiento.md`
- Hornero APP code: `projects/hornero-app/`
