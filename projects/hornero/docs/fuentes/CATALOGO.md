# Catálogo de fuentes del Ecosistema Hornero

> Índice maestro de todo el material documental. Cada entrada tiene: nombre, tipo, ubicación, estado en el RAG, y cantidad de chunks.

---

## Leyes laborales

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| LCT 20.744 | Ley | [leyes-laborales/LCT-20.744/](leyes-laborales/LCT-20.744/) | 58 (kb_chunks) + 284 (library.db) | `kb-ley-ley-20744-*` | ✅ Completo |
| Higiene y Seguridad 19.587 + Dec. 351/79 | Ley | [leyes-laborales/higiene-seguridad-19.587/](leyes-laborales/higiene-seguridad-19.587/) | 72 | `kb-ley-ley-19587-*` | ✅ Completo |
| Empleo 24.013 | Ley | [leyes-laborales/empleo-24.013/](leyes-laborales/empleo-24.013/) | 23 + 163 (library.db) | `kb-ley-ley-24013-*` | ✅ Completo |
| Asociaciones Sindicales 23.551 | Ley | [leyes-laborales/asociaciones-sindicales-23.551/](leyes-laborales/asociaciones-sindicales-23.551/) | 22 + 69 (library.db) | `kb-ley-ley-23551-*` | ✅ Completo |
| Riesgos del Trabajo 24.557 | Ley | [leyes-laborales/riesgos-trabajo-24.557/](leyes-laborales/riesgos-trabajo-24.557/) | 16 + 51 (library.db) | `kb-ley-ley-24557-*` | ✅ Completo |
| Convenciones Colectivas 14.250 | Ley | [leyes-laborales/convenciones-colectivas-14.250/](leyes-laborales/convenciones-colectivas-14.250/) | 3 | `kb-ley-ley-14250-*` | ✅ Completo |
| Negociación Colectiva 23.546 | Ley | [leyes-laborales/negociacion-colectiva-23.546/](leyes-laborales/negociacion-colectiva-23.546/) | 1 | `kb-ley-ley-23546-*` | ✅ Completo |
| Jornada 11.544 | Ley | — | 14 (library.db) | — | ⚠️ Solo library.db |
| Manual Práctico Salud y Seguridad Laboral | Manual | [leyes-laborales/manual-salud-seguridad-laboral/](leyes-laborales/manual-salud-seguridad-laboral/) | 50 | `kb-manual-ssl-*` | ✅ Completo (MD + chunks + PDF) |

## Convenios colectivos

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| CCT 420/05 Aceiteros | CCT | [convenios-colectivos/CCT-420-05-aceiteros/](convenios-colectivos/CCT-420-05-aceiteros/) | 55 (library.db) + 2 (kb_chunks) | — | ✅ |
| Paritarias aceiteras 2023-2025 | Acuerdos | [convenios-colectivos/paritarias-aceiteras/](convenios-colectivos/paritarias-aceiteras/) | 6 | `Paritaria-*` | ✅ |
| Comités Mixtos | Actas | [convenios-colectivos/comites-mixtos/](convenios-colectivos/comites-mixtos/) | — | — | 📄 PDFs sin procesar |
| CCT 301/75 Prensa Escrita y Oral | CCT | (chunked desde Guía SIPREBA) | 73 | `prensa-cct301-*` | ✅ Chunks en RAG |
| CCT 124/75 Prensa Televisada | CCT | (chunked desde Guía SIPREBA) | 123 | `prensa-cct124-*` | ✅ Chunks en RAG |
| CCT 541/08 Prensa Interior | CCT | (chunked desde Guía SIPREBA) | 60 | `prensa-cct541-*` | ✅ Chunks en RAG |
| Dec. Ley 13.839/46 Empleados Periodísticos | Decreto | (chunked desde Guía SIPREBA) | 45 | `prensa-dec13839-*` | ✅ Chunks en RAG |
| Ley 12.908 Estatuto del Periodista | Ley | (chunked desde Guía SIPREBA) | 114 | `prensa-ley12908-*` | ✅ Chunks en RAG |

## Artículos académicos y libros

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Iñigo Carrera, *La violencia como potencia económica* | Libro | [articulos-academicos/inigo-carrera-violencia-potencia-economica/](articulos-academicos/inigo-carrera-violencia-potencia-economica/) | 220 | `kb-inigo-violencia-*` | ✅ |
| Iñigo Carrera, *La superpoblación relativa* | Libro | [articulos-academicos/inigo-carrera-superpoblacion-relativa/](articulos-academicos/inigo-carrera-superpoblacion-relativa/) | 30 | `kb-inigo-superpob-*` | ✅ |
| Iñigo Carrera, *La huelga general* | Paper | [articulos-academicos/inigo-carrera-huelga-general/](articulos-academicos/inigo-carrera-huelga-general/) | 13 | `kb-inigo-huelga-*` | ✅ |
| Jasinski, *El encanto del tanino* | Libro | [articulos-academicos/jasinski-encanto-del-tanino/](articulos-academicos/jasinski-encanto-del-tanino/) | 161 | `kb-jasinski-*` | 🔴 Sin PDF fuente |
| Fuentes Lorca, *La gestión del delegado aceitero* | Tesis | [articulos-academicos/fuentes-lorca-gestion-delegado/](articulos-academicos/fuentes-lorca-gestion-delegado/) | 25 | `kb-fuentes-lorca-*` | 🔴 Sin PDF fuente |
| Vogelmann & Soul, *Espacio y trabajo en el Polo Oleaginoso* | Libro | [articulos-academicos/vogelmann-espacio-trabajo/](articulos-academicos/vogelmann-espacio-trabajo/) | 20 | `kb-vogelmann-*` | 🔴 Sin PDF fuente |
| Krotoschin, *Manual del derecho del trabajo* | Doctrina | [articulos-academicos/krotoschin-manual-derecho-trabajo.md](articulos-academicos/krotoschin-manual-derecho-trabajo.md) | — | — | 🔴 Ficha bibliográfica, sin texto |
| Responsabilidad empresarial en delitos de lesa humanidad (T1+T2) | Compilación | [articulos-academicos/responsabilidad-empresarial-lesa-humanidad/](articulos-academicos/responsabilidad-empresarial-lesa-humanidad/) | 1,736 | `kb-respemp-*` | ✅ MD + PDF |

## Prensa sindical

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Guía del Delegado SIPREBA 2024 | Guía gremial | [prensa-sindical/SIPREBA-guia-delegado/](prensa-sindical/SIPREBA-guia-delegado/) | 420+4 | `prensa-*` / `kb-sipreba-*` | ⚠️ MD fuente no en proyecto |
| El Trabajador Aceitero N°5, Nov 2016 | Periódico | [prensa-sindical/peron-aceitero/](prensa-sindical/peron-aceitero/) | 11 | `kb-prensa-aceitero-*` | ✅ |
| El Trabajador Aceitero N°7, Abr 2019 | Periódico | [prensa-sindical/peron-aceitero/](prensa-sindical/peron-aceitero/) | 10 | `kb-prensa-aceitero-*` | ✅ |

## Fuentes primarias

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Perón, *Discursos... 1943-1944* (BCN 2022) | Compilación histórica | [fuentes-primarias/peron-1943-1944/](fuentes-primarias/peron-1943-1944/) | 776 | `kb-peron-43-44-*` | ✅ PDF + MD + chunks |

## Entrevistas y discursos

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Cremonte (7 artículos) | Entrevistas | [entrevistas-discursos/](entrevistas-discursos/) | ~10 | manual (kb_data.py) | ✅ |
| Yofra (4 artículos) | Entrevistas | [entrevistas-discursos/](entrevistas-discursos/) | ~10 | manual (kb_data.py) | ✅ |

## Coyuntura

| Fuente | Tipo | Ubicación | En app | Estado |
|--------|------|-----------|--------|--------|
| Clipping semanal 2026 | Noticias | [coyuntura/clipping/](coyuntura/clipping/) | `app/data/clipping-*.json` | ✅ |
| Mirador MATE | Datos macro | [coyuntura/mirador-mate/](coyuntura/mirador-mate/) | `app/data/mate-*.json` | ✅ |

---

## Data stores operativos (backend/)

| Archivo | Contenido | Chunks |
|---------|-----------|--------|
| `backend/kb_chunks.json` | RAG production (auto-extracted) | 3,678 |
| `backend/kb_data.py` | RAG manual curado | 36 |
| `backend/library_service/library.db` | Biblioteca next-gen (feature-flagged) | 743 |
