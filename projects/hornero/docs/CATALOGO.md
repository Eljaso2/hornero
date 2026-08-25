# Catálogo maestro de documentación — Ecosistema Hornero

> Mapa completo de la documentación del proyecto. Cada sección enlaza a su catálogo o índice detallado.

---

## 📂 Estructura de `docs/`

```
docs/
├── fuentes/          ← Material documental (leyes, CCT, artículos, clipping, entrevistas)
├── planes/           ← Planes de desarrollo, núcleos, RAG, ICE
├── biblioteca/       ← Guías de curación bibliográfica
├── comunicacion/     ← Guías de construcción paso a paso
├── fundacion/        ← Diseño conceptual y arquitectura técnica
└── sesiones/         ← Transcripciones de sesiones de prueba
```

---

## 📚 `fuentes/` — Material documental

> Catálogo detallado: [fuentes/CATALOGO.md](fuentes/CATALOGO.md)

| Subdirectorio | Contenido | Documentos | Estado RAG |
|---------------|-----------|------------|------------|
| `leyes-laborales/` | LCT, Higiene y Seguridad, Empleo, etc. | 8 leyes + 1 manual | ✅ Mayoría en RAG |
| `convenios-colectivos/` | CCT aceiteros, paritarias, comités | 3+ CCT aceiteros + 5 CCT prensa | ✅ En RAG |
| `articulos-academicos/` | Iñigo Carrera, Jasinski, Vogelmann, etc. | 7 autores/obras | ⚠️ Algunos sin PDF |
| `prensa-sindical/` | Guía SIPREBA, El Trabajador Aceitero | 2 periódicos + 1 guía | ✅ 423 chunks |
| `fuentes-primarias/` | Documentos históricos (Perón 1943-44) | 1 colección | 📄 Sin procesar |
| `entrevistas-discursos/` | Cremonte (7), Yofra (4) | 11 artículos | ✅ En kb_data.py |
| `coyuntura/` | Clipping semanal, Mirador MATE | 2 series | ✅ En app |

### Data stores operativos (backend/)

| Archivo | Contenido | Chunks |
|---------|-----------|--------|
| `backend/kb_chunks.json` | RAG production (auto-extracted) | 3,678 |
| `backend/kb_data.py` | RAG manual curado | 36 |
| `backend/library_service/library.db` | Biblioteca next-gen (feature-flagged) | 743 |

---

## 📋 `planes/` — Planes y diseño

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

## 📖 `biblioteca/` — Curación bibliográfica

| Archivo | Contenido |
|---------|-----------|
| `BIBLIO-DERECHO-LABORAL-GUIA-CURACION.md` | Guía curación derecho laboral |
| `BIBLIO-HISTORIA-OBRERA-GUIA-CURACION.md` | Guía curación historia obrera |

---

## 🏗️ `comunicacion/` — Guías de construcción

| Archivo | Contenido |
|---------|-----------|
| `BUILD-STEP-BY-STEP-EN.md` | Build guide (inglés) |
| `CONSTRUCCION-PASO-A-PASO-ES.md` | Construcción paso a paso (español) |

---

## 🏛️ `fundacion/` — Diseño fundacional

| Archivo | Contenido |
|---------|-----------|
| `00-design-conceptual.md` | Diseño conceptual del ecosistema |
| `01-architectura-tecnica.md` | Arquitectura técnica |
| `COYUNTURA-ECONOMICA-DISENO.md` | Diseño módulo coyuntura económica |
| `DOCUMENTACION-COMPLETA.md` | Documentación completa del proyecto |

---

## 💬 `sesiones/` — Transcripciones de prueba

| Archivo | Contenido |
|---------|-----------|
| `Hola, soy abogado laboralista .txt` | Sesión de prueba abogado |
| `infraestructura-epistemica-hornero.html` | Infraestructura epistémica |

---

*Última actualización: 2026-08-25*
