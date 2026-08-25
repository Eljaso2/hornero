# Hornero — Biblioteca soberana + sistema RAG

> Profundización de la Parte B. **La biblioteca es la materia prima soberana**: de ella dependen las personas, el fine-tuning del modelo propio y el multi-sindicato.
> **Decisiones tomadas:** (1) motor = **adaptar meta-rag-oss** (Postgres+pgvector + ingesta OCR/Jina ya andando); (2) acervo inicial = **Derecho (CCT 420/05 + LCT) + Datos de clase/coyuntura + Testimonios/material del sindicato + Historia obrera (curada por el historiador)**.
>
> **Documentos de producción (delegables):**
> - **[Guía de curación — Derecho Laboral](BIBLIO-DERECHO-LABORAL-GUIA-CURACION.md)** → para el abogado laboralista (capa general + sectorial).
> - **[Guía de curación — Historia Obrera](BIBLIO-HISTORIA-OBRERA-GUIA-CURACION.md)** → para el compañero historiador.
> - **[Coyuntura económica: datos → resumen](COYUNTURA-ECONOMICA-DISENO.md)** → datos + InfoMate claro (analista/Mate).

---

## 1. El problema (hoy)
- Corpus = **316 chunks** (24 a mano + 292 de **un solo libro**). El **CCT 420/05 completo no está cargado**.
- Recuperación = **keyword/TF-IDF** (`rag_retriever.py`) sobre una **lista global en memoria**. Sin embeddings, sin biblioteca, sin fuentes primarias del derecho.
- La calidad tiene **techo bajísimo por falta de biblioteca**, no por el modelo.

## 2. Estrategia: NO reinventar el RAG — adaptar meta-rag-oss
Ya tenés un motor RAG funcionando (meta-rag-oss: Postgres+pgvector, backend uv, ingesta quick-ocr+Jina, selector LLM; y `bib_search_local` como servicio de recuperación en Dependency Lab). **Ese stack es ~90% de lo que Hornero necesita.**

**Lo que hay que agregarle para Hornero:**
1. **Multi-tenant** (colección/`tenant_id` por sindicato).
2. **Búsqueda híbrida legal** (semántica + exact-match para "Art. 245", "CCT 420/05 art. X").
3. **Metadata jurídica** en el chunk (norma, artículo, vigencia, jerarquía).
4. **Filtro por grado/vigencia** (que ya existe en Hornero, portarlo al servicio).

**Ventaja:** unifica tus proyectos (Dependency Lab, MEMGS, Hornero) sobre **un mismo motor de biblioteca**.

## 3. Las 5 capas de la Biblioteca

### 3.1 Acervo (los documentos) — orden de carga elegido
1. **Derecho** *(máxima prioridad)*: CCT 420/05 completo, LCT 20.744, leyes clave, jurisprudencia/dictámenes. → alimenta Abogado, Nuestro Derecho, SMVM.
2. **Datos de clase / coyuntura**: INDEC/CIFRA/PIMSA/Mate (series, informes). → Cómo Somos, SMVM, Investigador. *(más estructurado que textual — ver §6.)*
3. **Testimonios y material del sindicato**: resoluciones de asamblea, discursos, volantes, entrevistas. → acervo vivo (se cruza con Tu Historia y la digitalización del archivo, con **protección** D3).

### 3.2 Ingesta (pipeline)
Reusar el de meta-rag-oss (OCR + Jina), agregando:
- **Chunking consciente de estructura legal**: cortar por artículo/inciso (no por ~400 palabras a ciegas como hoy), para que "Art. 245" sea recuperable como unidad.
- **Metadata rica por chunk**: `{fuente, tipo(ley|cct|jurisprudencia|testimonio|dato), norma, articulo, vigencia, grado_access, tenant_id, fecha}`.
- **Curación**: revisión con perspectiva de clase (no cantidad por cantidad).

### 3.3 Índice / RAG
- **pgvector** (o el vector store de meta-rag-oss) con embeddings multilingües/español.
- **Búsqueda híbrida**: denso (semántico) + **exact/BM25** para citas legales. Sin esto, se pierde precisión jurídica.
- **Reranker** opcional.
- **Grafo** (relaciones norma↔jurisprudencia↔empresa) — diferible.
- **Agente verificador** (guardrail): confirma respaldo antes de responder.

### 3.4 Taxonomía / ontología
Las **~70 etiquetas del campo obrero** como **fuente de verdad única, versionada** (hoy inconsistente entre docs). Es la epistemología del sistema y la que clasifica tanto la biblioteca como los reportes.

### 3.5 Multi-tenant: capa COMPARTIDA + capa POR SINDICATO
Principio general de toda la biblioteca (no solo del derecho): cada tipo de acervo tiene una **capa compartida** (común a todos los gremios) + una **capa sectorial/propia** (por sindicato). La recuperación de un tenant consulta **su capa + la compartida**.

| Acervo | Capa GENERAL (compartida) | Capa SECTORIAL / PROPIA (por sindicato) |
|---|---|---|
| **Derecho** | Constitución (14 bis), LCT, leyes, reformas, jurisprudencia general | **su CCT** (ej. 420/05), paritarias, jurisprudencia del sector |
| **Historia** | Movimiento obrero argentino/latinoamericano | historia del gremio / la rama / la región |
| **Coyuntura** | Macro nacional (inflación, SMVM, distribución) | paritaria y datos de la rama |
| **Testimonios** | — | del propio gremio (privado/anónimo) |

Toda query filtra por `tenant_id` (su capa) **∪** la colección `shared`. **El derecho general se cura una vez y lo usan todos; lo sectorial lo arma cada gremio.** → ver [guía de curación legal](BIBLIO-DERECHO-LABORAL-GUIA-CURACION.md).

## 3.6 · Ingesta automatizada (scraping): qué se junta solo y qué cura el humano
**Principio:** el scraping **alimenta** la curación, no la reemplaza. El experto pasa de *"tipear todo"* a **seleccionar, validar, marcar vigencia y poner la perspectiva de clase** — que es lo que la máquina no puede decidir.

**Herramientas (ya en tu stack):** el pipeline de ingesta de meta-rag-oss (quick-ocr + Jina) + **Oxylabs** para scraping robusto (lo usás en MEMGS).

| Acervo | Fuentes scrapeables / API | Qué automatiza el scraping | Qué queda para el humano |
|---|---|---|---|
| **Derecho general** | **InfoLeg**, **SAIJ**, **Boletín Oficial** | Texto completo de LCT, leyes, decretos, DNUs, jurisprudencia | **Cuál** cargar + **VIGENCIA** (qué sigue en pie tras cada reforma) + posición de clase |
| **Derecho sectorial** | **Min. de Trabajo** (CCTs homologados), paritarias | Texto del CCT (ej. 420/05) y acuerdos | Selección + vigencia + relación con la práctica |
| **Coyuntura / datos** | **INDEC**, **BCRA**, Min. Trabajo (APIs/descargas) | Series oficiales (IPC, EPH, salarios, empleo) | Series de clase (Mate/CIFRA/PIMSA) + contexto + el resumen |
| **Historia** | **historiaobrera.com.ar**, repos académicos (SciELO, Memoria Académica UNLP) | Juntar candidatos (artículos, efemérides) | Selección + ficha + criterio de historiador |
| **Clipping (coyuntura semanal)** | Portales de prensa sindical/medios | Recolección diaria de noticias (automatiza N10) | Aprobación de la edición + marca de violencia |
| **Testimonios** | — **(no se scrapea)** | — | Se generan con el afiliado, con consentimiento/anonimización (D3) |

> **Reglas:** sitios públicos/gubernamentales OK (respetar términos y robots). **Los testimonios NO se scrapean** — son datos sensibles con protección. La **vigencia legal** es responsabilidad humana: el scraping trae el texto, el abogado dice si sigue vigente.

## 4. Contrato del servicio (la biblioteca como API)
La biblioteca se expone como **servicio de recuperación** (estilo `bib_search_local`), y el backend de Hornero la consume:
```
POST /library/search
  { query, tenant_id, grade, formato, filtros?: {tipo, vigencia, norma} , k?: 5 }
  → [ { id, texto, fuente, norma, articulo, vigencia, score } ]
```
En Hornero, `rag_retriever.py:retrieve_for_query()` deja de hacer keyword local y **llama a este servicio** (mismo lugar de enganche, cambia la implementación). Los filtros grado/vigencia/formato que ya existen se pasan al servicio.

## 5. ¿APIs más complejas o MCP? (decisión de arquitectura)
**Recomendación: API de recuperación primero, MCP después.**
- **Ahora (RAG clásico "recuperar → generar"):** alcanza una **API REST** clara (§4). Es "una API un poco más compleja" (un servicio de biblioteca), **no** MCP. Es lo que ya hace `bib_search_local`.
- **Cuando el flujo se vuelva agéntico** — el **verificador**, o el modelo decidiendo *cuándo* buscar (tool-use), o el Compañero consultando el convenio como herramienta — ahí **MCP tiene sentido**: exponer la biblioteca (y otras: convenio, SMVM, informes) como **tools MCP** que el modelo/agente invoca.
- **Bonus de MCP:** reusar la **misma biblioteca como herramienta entre tus proyectos** (Dependency Lab, MEMGS, Hornero) con un servidor MCP común.
- **Para el frontend/diseñador de UI:** necesita **REST clásico** (buscar/navegar/citar el Archivo), **no** MCP (MCP es para herramientas de modelos, no para pantallas).

> Regla: **MCP no es requisito para arrancar; es la evolución cuando pasás de "RAG" a "agente con herramientas".** Diseñar la API de §4 desacoplada te deja envolverla en MCP sin reescribir.

## 6. Un matiz: textos vs. datos
- **Textos** (convenio, leyes, testimonios, historia) → RAG semántico (esta biblioteca).
- **Datos de clase/coyuntura** (series INDEC/CIFRA/Mate) → **no** son RAG puro; conviene **tablas/consultas estructuradas** + una capa que el modelo pueda consultar (o precomputar índices SMVM/ICE/IFT). Mezclar series numéricas en un vector store da mala recuperación. → tratar como **dos subsistemas** de la misma biblioteca.

## 7. Próximos pasos concretos
1. **[DECISIÓN]** Confirmar reuso de meta-rag-oss como motor + dónde corre (se cruza con A2/infra).
2. **Cargar el Derecho** (CCT 420/05 + LCT) con **chunking por artículo** + metadata → primer salto de calidad medible.
3. **Definir el contrato `/library/search`** (§4) y **enganchar `rag_retriever.py`** a él (feature-flag: keyword viejo vs. servicio nuevo, para comparar).
4. **Set de evaluación**: preguntas gold del Abogado (derechos, horas extra, art. X) para medir servicio nuevo vs. keyword.
5. Dejar el servicio **desacoplado** para poder **envolverlo en MCP** más adelante.

## 8. Dependencias y riesgos
- **Depende de:** A2 (dónde corre pgvector/servicio) y A1 (tenant_id para multi-colección).
- **Habilita:** todas las personas (mejor RAG), C (índices/convenio vivo), A3 (dataset de fine-tuning).
- **Riesgo:** cargar mucho sin curar = ruido. Priorizar **Derecho bien chunkeado** sobre volumen.
- **Riesgo:** mezclar datos numéricos con textos en el vector store → separarlos (§6).
