# MAS Newsletter Tricontinental — IA en América Latina

Sistema Multi-Agent declarativo (POMASA) para escribir el newsletter del Boletín Nuestra América (Tricontinental) sobre IA y colonialismo digital en América Latina.

## Tesis central

**"IA en América Latina no es solo una cuestión tecnológica: es una cuestión de soberanía."**

Del Modelo Agroexportador al Modelo Dato-Exportador: la misma lógica extractiva, nuevo commodity. De soja a datos. De La Forestal a Palantir. Argentina no cambió de modelo — mutó de commodity.

---

## Arquitectura del sistema

```
mas/
├── agents/                          # Agent Blueprints
│   ├── 00.orchestrator.md           # Coordina el pipeline completo
│   ├── 01.fuentes_verificador.md    # Verifica fuentes, agrega URLs, identifica gaps
│   ├── 02.seccion_escritor.md       # Escribe cada sección del newsletter
│   └── 03.assembler.md              # Assemble + quality check final
│
├── references/                      # Reference Data
│   ├── domain/                      # Materiales de investigación (copiados del proyecto)
│   │   ├── investigacion.md         # Compilación principal de investigación
│   │   ├── milei-ft.md              # Análisis Milei+Sturzenegger FT
│   │   ├── moyano-czertok.md        # Soberanía digital y mediación algorítmica
│   │   ├── modelo-dato-exportador.md # Framework dato-exportador
│   │   └── notas-clase-ia.md        # Notas de clase sobre sesgos en IA
│   │
│   └── methodology/                 # Guía metodológica
│       ├── research-overview.md     # Objetivos, stance, preguntas centrales
│       ├── data-sources.md          # Tipos de fuentes + credibilidad + formato
│       ├── newsletter-template.md   # Estructura 10 secciones + specs
│       └── quality-standards.md     # Estilo militante-académico + checklist
│
├── scripts/
│   └── assemble.sh                  # Assembly mecánico de secciones
│
├── workspace/                       # Runtime workspace (se crea durante ejecución)
│   ├── 01.fuentes/                  # Fuentes verificadas + gaps
│   ├── 02.secciones/                # Archivos de cada sección
│   └── 03.assembly/                 # Newsletter final + informe calidad
│
├── _output/                         # Deliverable final
│
├── wip/                             # Work in progress
│   └── notes.md                     # Notas de ejecución, errores, observaciones
│
└── README.md                        # Este archivo
```

---

## Pipeline de ejecución

```
Stage 1: Fuentes Verificador
    │ Lee references/domain/ (todos los materiales)
    │ Busca URLs faltantes (WebSearch/WebFetch)
    │ Verifica URLs existentes
    │ Asigna credibilidad ratings
    │ Identifica gaps de información
    ▼
    workspace/01.fuentes/fuentes_verificadas.md
    workspace/01.fuentes/gaps.md

Stage 2: Sección Escritor (10 instancias, paralelas o secuenciales)
    │ Cada instancia lee:
    │   - newsletter-template.md (su sección específica)
    │   - quality-standards.md (estilo y calidad)
    │   - fuentes_verificadas.md (catálogo de fuentes)
    │   - domain files relevantes a su sección
    │ Escribe sección con citas [SRC-XXX]
    │ Self-quality check antes de output
    ▼
    workspace/02.secciones/00.apertura.md ... 09.conclusion.md

Stage 3: Assembler
    │ Lee todas las secciones
    │ Verifica cross-section consistency
    │ Verifica data lineage (citas → fuentes)
    │ Assembly mecánico (concatena secciones + header + references)
    │ Quality report
    ▼
    workspace/03.assembly/newsletter_tricontinental_ia_al.md
    workspace/03.assembly/informe_calidad.md
    _output/newsletter_tricontinental_ia_al.md
```

---

## Patterns POMASA adoptados

| Pattern | Tipo | Adoptado | Rationale |
|---------|------|----------|-----------|
| COR-01 Prompt-Defined Agent | Required | ✅ | Blueprints en Markdown definen cada agente |
| COR-02 Intelligent Runtime | Required | ✅ | Claude Code como runtime |
| STR-01 Reference Data Configuration | Required | ✅ | domain/ + methodology/ separados |
| STR-06 Methodological Guidance | Required | ✅ | 4 archivos methodology/ |
| BHV-02 Faithful Agent Instantiation | Required | ✅ | Subagents leen Blueprint completo, Orchestrator solo pasa parámetros |
| QUA-03 Verifiable Data Lineage | Required | ✅ | SRC-XXX numbering, verification agent, lineage chain |
| STR-02 Filesystem Data Bus | Recommended | ✅ | workspace/ como data bus entre stages |
| STR-03 Workspace Isolation | Recommended | ✅ | Cada agente opera en workspace/xx.yy/ |
| STR-04 Business-Driven Agent Design | Recommended | ✅ | Agentes = pasos del negocio (verify → write → assemble) |
| STR-05 Composable Document Assembly | Recommended | ✅ | Newsletter largo = secciones independientes + assembly mecánico |
| BHV-01 Orchestrated Agent Pipeline | Recommended | ✅ | Pipeline secuencial 3 stages |
| QUA-01 Embedded Quality Standards | Recommended | ✅ | quality-standards.md embebido en blueprints |
| STR-07 Reverse-Engineered Questions | Recommended | ❌ | Ya tenemos preguntas claras desde investigacion.md |
| STR-08 Pandoc-Ready Markdown | Recommended | ❌ | Newsletter se publica web, no DOCX/PDF |
| STR-09 Deliverable Export Pipeline | Recommended | ❌ | No necesitamos export pipeline |
| BHV-03 Parallel Instance Execution | Optional | ✅ | Secciones se pueden generar en paralelo |
| BHV-05 Grounded Web Research | Optional | ✅ | fuentes_verificador usa WebSearch/WebFetch |

---

## Cómo ejecutar el sistema

### Opción A: Ejecución completa (pipeline automatizado)

En Claude Code (VS Code o CLI), abrir el directorio `mas/` y ejecutar:

```
Please read agents/00.orchestrator.md and execute strictly according to that Blueprint.
```

El Orchestrator coordinará los 3 stages automáticamente.

### Opción B: Ejecución stage por stage (manual)

Si prefieres controlar cada etapa:

**Stage 1 — Verificar fuentes:**
```
Please read agents/01.fuentes_verificador.md and execute strictly according to that Blueprint.
```

**Stage 2 — Escribir secciones (una por vez o en paralelo):**
```
Please read agents/02.seccion_escritor.md and execute strictly according to that Blueprint.
Parameters: SECCION_ID=00, SECCION_TITULO="Apertura: Dos países, dos caminos"
```

Repetir para cada sección (00-09). Se pueden lanzar en paralelo.

**Stage 3 — Assemble:**
```
Please read agents/03.assembler.md and execute strictly according to that Blueprint.
```

### Opción C: Assembly mecánico solo

Si ya tienes las secciones escritas y solo necesitas assembly:
```bash
bash scripts/assemble.sh
```

---

## Newsletter output

El newsletter final se produce en:
- `_output/newsletter_tricontinental_ia_al.md`

Estructura del newsletter:
1. **00. Apertura**: Dos países, dos caminos
2. **01. Modelo Dato-Exportador**: De soja a datos
3. **02. Milei como Promoter**: La IA que Milei promete es la que Thiel necesita
4. **03. Palantir = La Forestal digital**: Data centers son las nuevas fábricas del imperialismo
5. **04. Tierras para Data Centers**: RIGI + Ley de Tierras
6. **05. Sociedades Automatizadas**: Capitalismo post-humano
7. **06. Desinformación**: El prompt no arregla lo estructural
8. **07. Brasil como Contrapunto**: Dato-industrialización soberana
9. **08. Resistencia**: Sistemas más simples pero gobernables
10. **09. Conclusión**: Del ALCA al ALCA digital

---

## Ajustes y personalización

- **Modificar estructura del newsletter**: Editar `references/methodology/newsletter-template.md`
- **Modificar estilo de escritura**: Editar `references/methodology/quality-standards.md`
- **Agregar fuentes**: Agregar archivos a `references/domain/` y actualizar `references/methodology/data-sources.md`
- **Modificar un agente**: Editar el Blueprint correspondiente en `agents/`
- **Cambiar orden de secciones**: Editar `newsletter-template.md` y `scripts/assemble.sh`

---

## Notas importantes

- **Idioma**: Todo el output es en español. Los domain materials están en español y portugués (milei-ft.md original en PT, traducido en el archivo).
- **Posición política**: El newsletter tiene stance explícito (soberanía digital). No es neutral — es militante-académico. Rigor metodológico + compromiso político.
- **Data lineage**: Todas las citas usan formato [SRC-XXX] y deben trazarse al catálogo de fuentes verificadas. Sin fuente = sin claim.
- **Página/12**: Artículos de Página/12 son fuentes críticas. El verificador debe buscar URLs para todos los artículos referenciados.
