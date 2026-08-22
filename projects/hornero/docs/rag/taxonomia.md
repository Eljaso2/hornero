# RAG Hornero — Taxonomía

> Categorías, tags y reglas de clasificación para el sistema RAG.
> Placeholder — la taxonomía completa se diseña en sesión aparte.

## Categorías actuales (de kb_data.py + kb_chunks.json)

| Categoría | Chunks | Tipo |
|-----------|--------|------|
| violencia-empresarial | 295 | académico (Jasinski) |
| historia-obrera | 45 | académico (Lorca, Vogelmann) |
| efemeride | 8 | manual |
| referentes | 4 | manual |
| condiciones | 3 | manual |
| organizacion | 2 | manual |
| convenio | 1 | manual |
| paritaria | 1 | manual |
| smvm | 1 | manual |
| reforma | 1 | manual |
| prensa-sindical | 0 | vacía |

## Tipos de fuente

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| academico | Libros, papers, artículos | Jasinski, Iñigo Carrera, Krotoschin |
| documentos | Convenios, paritarias, leyes | CCT 420/05, LCT 20744 |
| prensa | Periódicos gremiales | El Trabajador Aceitero y Desmotador |
| noticias | Clipping de prensa comercial | Sonido Gremial, Tiempo.ar |
| audiovisual | Podcasts, videos | (pendiente) |

## Pendiente

- [ ] Definir taxonomía de tags cruzados (ej: un chunk de Iñigo Carrera = academico + historia-obrera + violencia-empresarial)
- [ ] Decidir si categorías y tipos se unifican o mantienen separados
- [ ] Mapear cada subdir de `docs/fuentes/` a categorías RAG
