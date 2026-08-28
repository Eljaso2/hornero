# Catálogo de fuentes del Ecosistema Hornero

> Índice maestro del material documental y su estado en el sistema RAG.
> **Este archivo** = estado técnico (chunks, IDs, estado de carga en RAG).
> **INVENTARIO.md** = estado curatorial (pendientes de subir, prioridades, URLs fuente).

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

**Catálogo de categoría:** [leyes-laborales/catalogo-leyes.md](leyes-laborales/catalogo-leyes.md)

---

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

**Catálogo de categoría:** [convenios-colectivos/catalogo-paritarias.md](convenios-colectivos/catalogo-paritarias.md)

---

## Investigaciones (artículos académicos, libros, ensayos)

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Iñigo Carrera, *La violencia como potencia económica* | Libro | [inigo-carrera-violencia-potencia-economica/](investigaciones/inigo-carrera-violencia-potencia-economica/) | 220 | `kb-inigo-violencia-*` | ✅ |
| Iñigo Carrera, *La superpoblación relativa* | Libro | [inigo-carrera-superpoblacion-relativa/](investigaciones/inigo-carrera-superpoblacion-relativa/) | 30 | `kb-inigo-superpob-*` | ✅ |
| Iñigo Carrera, *La huelga general* | Paper | [inigo-carrera-huelga-general/](investigaciones/inigo-carrera-huelga-general/) | 13 | `kb-inigo-huelga-*` | ✅ |
| Jasinski, *El encanto del tanino* | Libro | [jasinski-encanto-del-tanino/](investigaciones/jasinski-encanto-del-tanino/) | 161 | `kb-jasinski-*` | 🔴 Sin PDF fuente — ver [README.md](investigaciones/jasinski-encanto-del-tanino/README.md) |
| Fuentes Lorca, *La gestión del delegado aceitero* | Tesis | [fuentes-lorca-gestion-delegado/](investigaciones/fuentes-lorca-gestion-delegado/) | 25 | `kb-fuentes-lorca-*` | 🔴 Sin PDF fuente — ver [README.md](investigaciones/fuentes-lorca-gestion-delegado/README.md) |
| Vogelmann & Soul, *Espacio y trabajo en el Polo Oleaginoso* | Libro | [vogelmann-espacio-trabajo/](investigaciones/vogelmann-espacio-trabajo/) | 20 | `kb-vogelmann-*` | 🔴 Sin PDF fuente — ver [README.md](investigaciones/vogelmann-espacio-trabajo/README.md) |
| Krotoschin, *Manual del derecho del trabajo* | Doctrina | [krotoschin-manual-derecho-trabajo/](investigaciones/krotoschin-manual-derecho-trabajo/) | — | — | 📄 Ficha bibliográfica, sin texto |
| Responsabilidad empresarial en delitos de lesa humanidad (T1+T2) | Compilación | [responsabilidad-empresarial-lesa-humanidad/](investigaciones/responsabilidad-empresarial-lesa-humanidad/) | 1,736 | `kb-respemp-*` | ✅ MD + PDF |
| Waisberg, *Aceiteros* Cap. 5: Un salto de calidad | Libro | [waisberg-aceiteros-cap5-salto-calidad/](investigaciones/waisberg-aceiteros-cap5-salto-calidad/) | 10 | `kb-waisberg-cap5-*` | ✅ MD + chunks |
| Waisberg, *Aceiteros* Cap. 6: La pelea por renovar la Federación | Libro | [waisberg-aceiteros-cap6-renovar-federacion/](investigaciones/waisberg-aceiteros-cap6-renovar-federacion/) | 9 | `kb-waisberg-cap6-*` | ✅ MD + chunks |

**Catálogos de categoría:** [_catalogo-articulos-derecho-laboral.md](investigaciones/_catalogo-articulos-derecho-laboral.md) (artículos DNU 70, pendientes), [responsabilidad-empresarial-lesa-humanidad/catalogo-responsabilidad-empresarial.md](investigaciones/responsabilidad-empresarial-lesa-humanidad/catalogo-responsabilidad-empresarial.md)

---

## Prensa sindical

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Guía del Delegado SIPREBA 2024 | Guía gremial | [prensa-sindical/SIPREBA-guia-delegado/](prensa-sindical/SIPREBA-guia-delegado/) | 420+4 | `prensa-*` / `kb-sipreba-*` | ⚠️ MD fuente no en proyecto |
| El Trabajador Aceitero N°5, Nov 2016 | Periódico | [prensa-sindical/peron-aceitero/](prensa-sindical/peron-aceitero/) | 11 | `kb-prensa-aceitero-*` | ✅ |
| El Trabajador Aceitero N°7, Abr 2019 | Periódico | [prensa-sindical/peron-aceitero/](prensa-sindical/peron-aceitero/) | 10 | `kb-prensa-aceitero-*` | ✅ |

**Índice de categoría:** [prensa-sindical/INDEX.md](prensa-sindical/INDEX.md)

---

## Fuentes primarias

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Perón, *Discursos... 1943-1944* (BCN 2022) | Compilación histórica | [fuentes-primarias/peron-1943-1944/](fuentes-primarias/peron-1943-1944/) | 776 | `kb-peron-43-44-*` | ✅ PDF + MD + chunks |
| Efemérides de Historia Obrera | Efemérides | [fuentes-primarias/efemerides-historia-obrera/](fuentes-primarias/efemerides-historia-obrera/) | 8 | `efem-*` | ✅ .chunks.json (schema library.db) |

**Índice de efemérides:** [efemerides-historia-obrera/INDEX.md](fuentes-primarias/efemerides-historia-obrera/INDEX.md)

---

## Entrevistas y discursos

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Cremonte (6 artículos) | Entrevistas | [entrevistas-discursos/](entrevistas-discursos/) | 1 (consolidado) | `kb-discursos-cremonte` | ✅ En kb_data.py |
| Yofra (5 artículos) | Entrevistas | [entrevistas-discursos/](entrevistas-discursos/) | 1 (consolidado) | `kb-discursos-yofra` | ✅ En kb_data.py |
| Entrevistas individuales (11 .md) | Entrevistas | [entrevistas-discursos/](entrevistas-discursos/) | — | — | ⚠️ Sin .chunks.json |

**Índice de categoría:** [entrevistas-discursos/INDEX.md](entrevistas-discursos/INDEX.md)

---

## Actualidad (columnas, artículos de opinión)

| Fuente | Tipo | Ubicación | RAG chunks | ID prefix | Estado |
|--------|------|-----------|------------|-----------|--------|
| Columnas de Daniel Yofra (7 artículos, 2024-2026) | Opinión | [yofra-columnas/](actualidad/yofra-columnas/) | 7 | `kb-yofra-col-*` | ✅ MD + chunks |

---

## Coyuntura

| Fuente | Tipo | Ubicación | En app | Estado |
|--------|------|-----------|--------|--------|
| Clipping semanal 2026 | Noticias | [coyuntura/clipping/](coyuntura/clipping/) | `app/data/clipping-*.json` | ✅ |
| Mirador MATE | Datos macro | [coyuntura/mirador-mate/](coyuntura/mirador-mate/) | `app/data/mate-*.json` | ✅ |

---

## Data stores operativos

| Archivo | Contenido | Cantidad | Schema |
|---------|-----------|----------|--------|
| `biblioteca/fuentes/**/*.chunks.json` | RAG per-source (auto-extracted) | 3,686 chunks en 22 archivos | Formato libre (legacy) |
| `biblioteca/fuentes/**/entrevistas-discursos.chunks.json` | Entrevistas (migrado) | (pendiente) | library.db schema |
| `biblioteca/fuentes/**/efemerides-historia-obrera.chunks.json` | Efemérides (migrado) | 8 | library.db schema |
| `backend/kb_data.py` (KB_CHUNKS) | RAG manual curado | 36 | Formato libre (legacy) |
| `backend/library_service/library.db` | Biblioteca next-gen (feature-flagged) | 743 artículos | library.db schema |

### Convergencia library.db

Los nuevos .chunks.json (efemérides, entrevistas) usan el schema del library.db (`id`, `tipo`, `norma`, `articulo`, `capa`, `tenant`, `vigencia`, `titulo`, `texto`, `fuente`). Esto permite migrarlos sin transformación cuando la biblioteca se active como servicio principal.

Los .chunks.json existentes (21 archivos, 3,678 chunks) usan formato libre y requerirán migración posterior.

---

*Última actualización: 2026-08-28*
