# Hornero — Scraper legal (InfoLeg / SAIJ / Min. Trabajo)

> Fase 2 de la biblioteca. Generaliza el `legal_chunker.py` del [prototipo](backend/library_proto/README.md) a un **pipeline de ingesta legal automatizado** que alimenta la capa **general** (compartida) y **sectorial** (por sindicato) del derecho.
> El scraping **trae el texto**; el abogado **valida vigencia y selecciona** ([guía de curación](BIBLIO-DERECHO-LABORAL-GUIA-CURACION.md)).

## 1. Fuentes y para qué sirve cada una
| Fuente | Qué trae | URL / acceso | Capa |
|---|---|---|---|
| **InfoLeg** | **Texto actualizado** de leyes/decretos (ya consolida modificaciones) | `servicios.infoleg.gob.ar/.../texact.htm` (probado con LCT) | general |
| **SAIJ** | Normativa **+ jurisprudencia**, con datos abiertos/API | `saij.gob.ar` (dataset abierto) | general |
| **Boletín Oficial** | **Novedades diarias** → detectar reformas y cambios de vigencia | `boletinoficial.gob.ar` | general (monitoreo) |
| **Min. de Trabajo** | **CCTs homologados** + paritarias (a veces PDF) | portal de convenios | **sectorial** (por gremio) |

## 2. Pipeline
```
[1] Descubrir/seleccionar   → lista de normas objetivo (LCT, leyes clave, CCT del sector)
        │                       (curada por el abogado; para novedades, monitor del Boletín Oficial)
[2] Fetch                   → HTML (InfoLeg/SAIJ) o PDF (CCT del Min. Trabajo)
[3] Extraer texto           → html_to_text  |  PDF → OCR (quick-ocr de meta-rag-oss)
[4] Chunk por artículo      → legal_chunker.chunk_law()  → {norma, articulo, titulo, texto, ...}
[5] Metadata + vigencia     → tipo, jerarquia, ambito, capa, tenant, fuente_oficial
        │                       vigencia: default 'vigente' (texto actualizado) → REVISIÓN del abogado
[6] Embeddings              → (fase B1) BGE/multilingüe
[7] Upsert a la colección   → 'shared' (general)  ó  tenant_id (sectorial)  en pgvector
```
Los pasos [2]-[4] **ya funcionan** en el prototipo (probado con la LCT: 284 artículos). Falta [6]/[7] (embeddings + colección) y el monitor de vigencia.

## 3. Vigencia (lo delicado)
- InfoLeg `texact.htm` = **texto ya actualizado** → arranca en buen estado.
- **Reformas en curso** (DNU, Ley Bases): el **Boletín Oficial** se monitorea (cron diario) para marcar normas afectadas → **el abogado confirma** qué queda vigente/derogado/suspendido.
- La `vigencia` es campo humano-validado; el scraper la propone, no la decide.

## 4. Actualización incremental
- **Cron** (semanal/diario): revisa fechas de última modificación (InfoLeg) + novedades del Boletín Oficial.
- Solo re-ingesta lo cambiado (upsert por `id = norma-art-N`).
- CCTs: re-scrape cuando hay nueva paritaria homologada.

## 5. Ética / robustez
- Sitios **públicos gubernamentales** → OK. User-Agent identificable, **rate suave**, cache local (no golpear de más).
- Respetar `robots.txt` y términos.
- Para **escala/robustez** (o si un sitio bloquea): **Oxylabs** (ya en tu stack).
- **CCTs en PDF** → OCR (quick-ocr) antes del chunker.

## 6. Salida (contrato con la biblioteca)
Cada chunk sale con el formato que ya produce `legal_chunker` y que consume `library_search`:
```json
{ "id": "LCT_20744-art-245", "tipo": "ley", "norma": "LCT 20.744",
  "articulo": "245", "capa": "general", "tenant": "shared",
  "vigencia": "vigente", "titulo": "Indemnización por antigüedad o despido",
  "texto": "...", "fuente": "InfoLeg" }
```
→ va directo a `POST /library/search` (colección `shared` o del tenant).

## 7. Alcance inicial (lo que carga primero)
1. **LCT 20.744** (✅ ya probado en el prototipo).
2. **Leyes generales clave**: jornada (11.544), asociaciones sindicales (23.551), convenciones colectivas (14.250), ART, etc.
3. **Reformas vigentes** (DNU/Ley Bases) con su estado.
4. **CCT 420/05** (sectorial aceitero) desde Min. de Trabajo.
5. **Jurisprudencia** de referencia (SAIJ).

## 8. Próximos pasos concretos
1. Extender `legal_chunker` a un **`scrape_infoleg(norma_id)`** parametrizable (varias leyes, no solo la LCT).
2. Agregar **PDF→OCR** para los CCT del Min. de Trabajo.
3. Enganchar **embeddings + colección pgvector** (cierra la búsqueda híbrida y tapa la limitación léxica del prototipo).
4. **Monitor de Boletín Oficial** para vigencia.
5. Correr el **set de eval** (las consultas gold) sobre el índice híbrido y medir vs. el prototipo léxico.

## 9. Dependencias / riesgos
- **Depende de:** B1 (embeddings/pgvector) y A2 (dónde corre). Reusa meta-rag-oss.
- **Riesgo:** cambios de HTML de los sitios → parser frágil; mitigar con Oxylabs + tests.
- **Riesgo:** vigencia mal marcada = respuesta legal incorrecta → la validación humana es innegociable.
