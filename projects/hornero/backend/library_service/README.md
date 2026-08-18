# Biblioteca de Hornero — servicio real (backend)

Servicio de biblioteca **durable, multi-tenant, alimentado por scraping**, con el contrato
`/library/search`. Solo **stdlib + numpy** — corre sin instalar nada. Es la versión "de verdad"
del [prototipo](../library_proto/README.md).

## Qué resuelve (vs. el backend actual de Hornero)
| Problema del backend actual | Acá |
|---|---|
| Persistencia efímera (SQLite en contenedor) | **SQLite durable** (`library.db`), listo para migrar a Postgres/pgvector |
| Sin noción de sindicato | **`tenant` + `capa`**: cada gremio ve *su* colección ∪ `shared` |
| RAG keyword, sin el convenio ni las leyes | **Ingesta por scraping** (InfoLeg) + **chunk por artículo** + **cita exacta** |
| Sin corpus legal | **5 leyes reales = 581 artículos** (LCT, Jornada, Sindicatos, Empleo, ART) buscables |

## Archivos
- `chunker.py` — fetch InfoLeg + chunk por artículo (cp1252). **Robusto a las dos notaciones** ('Art. N.' y 'Artículo N°', detecta la dominante).
- `scraper.py` — `SOURCES` (normas) + `scrape(norma_id)` / `scrape_all()`.
- `library.py` — **store SQLite** (upsert/fetch/stats) + **retrieval** (cita exacta + TF-IDF/semántico).
- `embeddings.py` — adaptador enchufable (`EMBED_PROVIDER=none|jina|openai`). Default `none` → léxico.
- `server.py` — servicio HTTP (stdlib) en `:8010` (como `bib_search_local`).
- `seed.py` — carga inicial (5 leyes reales de InfoLeg) + búsquedas de prueba.
- `demo_multitenant.py` — prueba el **aislamiento por sindicato** (capa compartida + sectorial; un gremio no ve el CCT del otro). ✅
- `adapter_hornero.py` — cómo `main.py`/`rag_retriever.py` de Hornero lo consumen (con feature-flag y fallback).

## Uso
```bash
python3 seed.py                 # ingesta LCT → SQLite + pruebas
python3 server.py               # levanta el servicio en :8010

curl localhost:8010/library/stats
curl -X POST localhost:8010/library/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"art. 245","tenant":"aceiteros","k":3}'
```

## Contrato `/library/search`
```
POST /library/search
  { query, tenant?, k?, filtros?: { capa, vigencia, tipo, norma } }
  → { results: [ { id, tipo, norma, articulo, capa, tenant, vigencia,
                   titulo, texto, fuente, score, match } ] }
```
`match` = `cita exacta` | `semántico` | `léxico`.

## Enganchar a Hornero (sin romper lo actual)
En `main.py`, cambiar la llamada a `retrieve_for_query(...)` por `adapter_hornero.retrieve(...)`
y setear `LIBRARY_URL=http://localhost:8010`. Sin `LIBRARY_URL`, sigue el keyword viejo (rollback).

## Encender la búsqueda semántica (tapar la limitación léxica)
Hoy corre en **léxico** (`horas extra` no matchea `horas suplementarias`, Art. 201).
Para semántico, setear el proveedor (tu Jina de meta-rag-oss):
```bash
export EMBED_PROVIDER=jina
export JINA_API_KEY=xxxx
python3 seed.py     # (opcional: precomputar vectores)
```
Sin cambiar código, la búsqueda pasa a semántica.

## Próximos pasos (backend)
1. **Migrar el store a Postgres+pgvector** (durabilidad + vectores) — reusa meta-rag-oss.
2. **Precomputar embeddings** al ingestar (hoy se calculan on-the-fly en semántico).
3. **Más normas** en `SOURCES` (leyes clave) + **CCT 420/05** (Min. Trabajo, PDF→OCR) como `capa=sectorial, tenant=aceiteros`.
4. **Búsqueda híbrida** (denso + exact legal) y **set de eval** (consultas gold).
5. **Auth + `tenant_id`** (A1) delante del servicio.
