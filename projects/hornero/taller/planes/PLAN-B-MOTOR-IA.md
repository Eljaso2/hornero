# Hornero — B: Motor de inteligencia (RAG real + corpus)

> Parte B / Fase 1 del [PLAN maestro](PLAN-EXPANSION-MEJORA.md). Subir la **calidad y confiabilidad** de todas las respuestas.
> **[DECISIÓN]** = definición del equipo.

---

## B1 · RAG real (de keyword a semántico)

### Estado actual (auditado)
`backend/rag_retriever.py` = **keyword/TF-IDF en memoria** (IDF precomputado, stemming manual, filtros por grado/vigencia/formato). Sin embeddings. El propio archivo prevé una "Phase 4" con FAISS+embeddings.

### Diseño
1. **Embeddings + vector DB:** modelo de embeddings multilingüe/español (**[DECISIÓN]** ej. BGE-m3) + **Qdrant** (alineado con la arquitectura). Indexar los chunks del corpus (B2).
2. **Búsqueda híbrida:** denso (semántico) **+** exact/BM25 para **citas legales** ("Art. 245", "CCT 420/05 art. X") — sin esto se pierde precisión jurídica.
3. **Reranker** (opcional): cross-encoder para ordenar el top-k.
4. **Grafo de conocimiento** (Neo4j, **[DECISIÓN]** ahora o después): relaciones convenio↔ley↔jurisprudencia↔empresa↔efeméride.
5. **Agente verificador (guardrail):** antes de emitir, confirma que la respuesta tiene respaldo en lo recuperado (refuerza "si no hay fuente, no responde").
6. **Conservar** los filtros que ya funcionan: por **grado** (`grade_satisfies`), **vigencia** y **formato→categorías** (evita "persona mixing").
7. **Ingesta:** el pipeline produce chunk + metadata + embedding en un paso; reindexado incremental al agregar corpus.

### Hecho cuando
- [ ] En un set de preguntas gold, el RAG semántico **supera** al keyword en recuperación.
- [ ] Las citas legales exactas se recuperan (búsqueda híbrida).
- [ ] El verificador reduce respuestas sin fuente.

---

## B2 · Corpus y taxonomía soberana

### Estado actual (auditado)
316 chunks = **24 manuales** + **292 de un solo libro** (La Forestal, Jasinski). Taxonomía (~9 familias / ~70 etiquetas) **parcialmente definida** (inconsistencia entre docs).

### Tareas
1. **Mejorar el pipeline de ingesta** (`scripts/pdf_to_chunks.py`): metadata sólida (libro/capítulo/página/vigencia/grado/tipo), corte de chunks por sección, autotagging revisado.
2. **Cargar el corpus base** (alto impacto inmediato):
   - **CCT 420/05 completo** + **LCT 20.744** + leyes clave.
   - **Jurisprudencia** y dictámenes relevantes.
   - Resoluciones de asamblea, discursos, volantes (material del sindicato).
   - Biblioteca histórica (ampliar más allá del único libro).
3. **Consolidar la taxonomía** (~70 etiquetas) como **fuente de verdad única, versionada** (hoy hay inconsistencia entre N6 y `00-design`). Es la epistemología del sistema.
4. **Digitalización de archivos** del sindicato (se cruza con el setup de adopción, Parte D2).
5. **Curación con perspectiva de clase** — calidad, no cantidad; no matching de strings.

### Hecho cuando
- [ ] El corpus cubre **convenio + leyes + jurisprudencia + historia** del piloto, con metadata.
- [ ] Taxonomía consolidada y versionada, usada por RAG y clasificación.

---

## Dependencias (B)
- **Depende de:** A2 (dónde corren Qdrant/Neo4j).
- **Insumo de:** A3 (dataset de fine-tuning) y C (todas las personas mejoran con mejor RAG+corpus).

## Decisiones abiertas [DECISIÓN]
1. Modelo de embeddings.
2. Grafo (Neo4j) ¿en esta fase o diferido?
3. Alcance inicial del corpus (arrancar por CCT 420/05 + LCT es lo de mayor impacto/esfuerzo).

## Riesgos
- Cargar mucho sin curar = ruido. Priorizar calidad.
- La taxonomía es decisión **política/epistemológica**, no solo técnica: definirla con el equipo, no improvisar.
