# Prototipo — Biblioteca legal + RAG (fase 1)

Prueba de concepto **con datos reales** de que chunkear el derecho **por artículo** + una
recuperación **consciente de citas** supera al RAG keyword actual de Hornero.
Solo librería estándar (sin infra, sin embeddings). Corre: `python3 demo.py`.

## Qué hay acá
- `legal_chunker.py` — baja una norma de **InfoLeg** y la parte en **chunks por artículo** con metadata (`norma, articulo, capa, tenant, vigencia, titulo, texto, fuente`).
- `library_search.py` — el servicio **`/library/search`** (contrato): **cita exacta** (`art. 245`) + **temático** (TF-IDF). Filtros: `tenant, capa, vigencia, tipo, norma`.
- `demo.py` — baja LCT 20.744 → chunkea (284 arts) → indexa → corre consultas gold comparando **nuevo vs. keyword actual**.
- `data/LCT_20744.txt` — cache del texto (se genera al correr).

## Resultado (verificado)
| Consulta | Biblioteca nueva | Hornero actual |
|---|---|---|
| indemnización por despido | **Art. 245** ✅ | sin resultados |
| salario mínimo vital y móvil | **Art. 116** ✅ | sin resultados |
| `art. 245` (cita) | **cita exacta** ✅ | sin resultados |
| preaviso | Art. 19 / 232 ✅ | sin resultados |
| horas extra | Art. 129/92ter ⚠️ (esperado 201) | sin resultados |

El actual da "sin resultados" porque **la LCT no está en su corpus**.

## Limitación conocida (y por qué importa)
La recuperación es **léxica**: *"horas extra"* no matchea *"horas suplementarias"* (Art. 201).
→ En producción, el camino "temático" se reemplaza por **búsqueda híbrida (embeddings + este exact-match legal)**. El exact-match de citas y el chunking por artículo ya quedan resueltos acá.

## Cómo mapea a producción
- `legal_chunker.chunk_law()` → el chunker del **scraper legal** (fase 2).
- `library_search.search()` → el endpoint **`POST /library/search`** que consume `rag_retriever.py` de Hornero (reemplaza el keyword local).
- `capa`/`tenant` → el patrón **compartida + por sindicato** (multi-tenant).

## Caveats del prototipo
- Dedup por nº de artículo quedándose con el bloque más largo → 284 vs. ~288 detecciones (remisiones inline abreviadas descartadas). Aceptable para PoC; el scraper de fase 2 lo hace fino.
- InfoLeg `texact.htm` = **texto actualizado** (ya consolida modificaciones); la **vigencia post-reforma** la valida el abogado (guía de curación).
