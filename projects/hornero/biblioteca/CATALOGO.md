# Catálogo maestro — Ecosistema Hornero

> Mapa completo del proyecto. La biblioteca contiene el material documental; el taller, la documentación del proyecto.

---

## 📂 Estructura del proyecto

```
hornero/
├── app/              ← Frontend PWA (HTML, Lit, CSS, JS)
├── backend/          ← Servidor Python (FastAPI, RAG, auth)
├── biblioteca/       ← Biblioteca: fuentes documentales + chunks RAG
│   ├── fuentes/      ← Textos, leyes, PDFs, artículos, chunks
│   └── curacion/     ← Guías de curación bibliográfica
├── taller/           ← Documentación del proyecto
│   ├── fundacion/    ← Diseño conceptual y arquitectura
│   ├── planes/       ← Planes de desarrollo, núcleos, ICE
│   ├── comunicacion/ ← Guías de construcción (EN/ES)
│   └── sesiones/     ← Transcripciones de sesiones de prueba
├── feedback/         ← Screenshots de bugs
└── promo/            ← Demos, presentaciones, video pitch
```

---

## 📚 `biblioteca/fuentes/` — Material documental

> Catálogo detallado: [fuentes/CATALOGO.md](fuentes/CATALOGO.md)

| Subdirectorio | Contenido | Documentos | Estado RAG |
|---------------|-----------|------------|------------|
| `leyes-laborales/` | LCT, Higiene y Seguridad, Empleo, etc. | 8 leyes + 1 manual | ✅ Chunks junto al PDF |
| `convenios-colectivos/` | CCT aceiteros, paritarias, comités | 3+ CCT aceiteros + 5 CCT prensa | ✅ Chunks junto al PDF |
| `articulos-academicos/` | Iñigo Carrera, Jasinski, Vogelmann, Krotoschin, etc. | 8 obras | ⚠️ 3 sin PDF |
| `prensa-sindical/` | Guía SIPREBA, El Trabajador Aceitero | 2 periódicos + 1 guía | ✅ Chunks junto al MD |
| `fuentes-primarias/` | Documentos históricos, efemérides | 1 colección + 8 efemérides | ✅ Chunks junto al PDF |
| `entrevistas-discursos/` | Cremonte (6), Yofra (5) | 11 artículos | ✅ .chunks.json + kb_data.py |
| `coyuntura/` | Clipping semanal, Mirador MATE | 2 series | ✅ En app |

### Chunks RAG: por fuente, no en monolito

Los chunks viven en archivos `.chunks.json` junto a su material de origen. El backend escanea `biblioteca/fuentes/**/*.chunks.json` al arrancar y los carga todos en memoria.

| Archivo .chunks.json | Chunks | Ubicación |
|---|---|---|
| `responsabilidad-empresarial-t1.chunks.json` | 970 | `articulos-academicos/responsabilidad-empresarial-lesa-humanidad/` |
| `responsabilidad-empresarial-t2.chunks.json` | 766 | `articulos-academicos/responsabilidad-empresarial-lesa-humanidad/` |
| `peron-1943-1944.chunks.json` | 776 | `fuentes-primarias/peron-1943-1944/` |
| `inigo-carrera-violencia-potencia-economica.chunks.json` | 220 | `articulos-academicos/inigo-carrera-violencia-potencia-economica/` |
| `sipreba-guia-delegado.chunks.json` | 423 | `prensa-sindical/SIPREBA-guia-delegado/` |
| `ley-20744-lct.chunks.json` | 58 | `leyes-laborales/LCT-20.744/` |
| `ley-19587-higiene-seguridad.chunks.json` | 72 | `leyes-laborales/higiene-seguridad-19.587/` |
| `jasinski-encanto-del-tanino.chunks.json` | 161 | `articulos-academicos/jasinski-encanto-del-tanino/` |
| + otros 13 archivos | | |
| `entrevistas-discursos.chunks.json` | 11 | `entrevistas-discursos/` 🆕 library.db schema |
| `efemerides-historia-obrera.chunks.json` | 8 | `fuentes-primarias/efemerides-historia-obrera/` 🆕 library.db schema |

**Total: 3,697 chunks en 23 archivos .chunks.json**

### Data stores operativos

| Archivo | Contenido | Cantidad |
|---------|-----------|----------|
| `biblioteca/fuentes/**/*.chunks.json` | RAG per-source (auto-extracted) | 3,695 chunks en 24 archivos |
| `backend/kb_data.py` (KB_CHUNKS) | RAG manual curado | 36 |
| `backend/library_service/library.db` | Biblioteca next-gen (feature-flagged) | 743 artículos |

---

## 📖 `biblioteca/curacion/` — Curación bibliográfica

| Archivo | Contenido |
|---------|-----------|
| `BIBLIO-DERECHO-LABORAL-GUIA-CURACION.md` | Guía curación derecho laboral |
| `BIBLIO-HISTORIA-OBRERA-GUIA-CURACION.md` | Guía curación historia obrera |

---

## 🔧 `taller/planes/` — Planes y diseño

| Archivo / Dir | Contenido |
|---------------|-----------|
| `PLAN-A1-SEGURIDAD.md` | Seguridad y autenticación |
| `PLAN-A2-INFRAESTRUCTURA.md` | Infraestructura y deploy |
| `PLAN-A3-MODELO.md` | Modelo de datos y LLM |
| `PLAN-B-MOTOR-IA.md` | Motor de IA y RAG |
| `PLAN-C-FUNCIONALIDADES.md` | Funcionalidades de la app |
| `PLAN-D-ESCALA.md` | Escalabilidad |
| `PLAN-BIBLIOTECA-RAG.md` | Plan biblioteca + RAG |
| `PLAN-MVP-Y-CAPTACION.md` | MVP y captación usuarios |
| `PLAN-EXPANSION-MEJORA.md` | Expansión y mejoras |
| `PLAN-SCRAPER-LEGAL.md` | Scraper de legislación |
| `PLAN-BACKEND-PIPELINE-ACTUAL.md` | Pipeline backend actual |
| `sistema-etiquetado-ICE.md` | Sistema de etiquetamiento ICE |
| `ICE-*.md` | Tipología, comportamiento empresarial, metodología |
| `nucleo6-*.md` a `nucleo15-*.md` | Diseño de núcleos Hornero |
| `nucleos6-15-backend.md` | Backend de núcleos 6-15 |
| `rag/` | Mapa fuentes-actores, simulaciones, taxonomía |

---

## 🏛️ `taller/fundacion/` — Diseño fundacional

| Archivo | Contenido |
|---------|-----------|
| `00-design-conceptual.md` | Diseño conceptual del ecosistema |
| `01-architectura-tecnica.md` | Arquitectura técnica |
| `COYUNTURA-ECONOMICA-DISENO.md` | Diseño módulo coyuntura económica |
| `DOCUMENTACION-COMPLETA.md` | Documentación completa del proyecto |

---

## 🏗️ `taller/comunicacion/` — Guías de construcción

| Archivo | Contenido |
|---------|-----------|
| `BUILD-STEP-BY-STEP-EN.md` | Build guide (inglés) |
| `CONSTRUCCION-PASO-A-PASO-ES.md` | Construcción paso a paso (español) |

---

## 💬 `taller/sesiones/` — Transcripciones de prueba

| Archivo | Contenido |
|---------|-----------|
| `Hola, soy abogado laboralista .txt` | Sesión de prueba abogado |
| `infraestructura-epistemica-hornero.html` | Infraestructura epistémica |

---

*Última actualización: 2026-08-25*
