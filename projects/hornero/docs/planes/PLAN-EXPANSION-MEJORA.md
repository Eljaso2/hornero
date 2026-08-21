# Hornero — Plan de expansión y mejora del sistema

> Documento de trabajo. Del **piloto** (Federación Aceitera, en Render) a un **sistema soberano y multi-sindicato**.
> Basado en la auditoría real del código (`DOCUMENTACION-COMPLETA.md`). Fecha: 2026-08.
> Convención: **[DECISIÓN]** = requiere definición del equipo/dirección (no es una tarea técnica automática).

---

## Documentos de parte (detalle técnico)
- **[Backend: pipeline end-to-end ACTUAL](PLAN-BACKEND-PIPELINE-ACTUAL.md)** 🔎 *(cómo funciona hoy + dónde acopla a un solo sindicato — leer primero)*
- **[A1 — Seguridad y autenticación](PLAN-A1-SEGURIDAD.md)** 🔴 *(desbloqueante nº1)*
- **[A2 — Infraestructura soberana (VPS + Postgres)](PLAN-A2-INFRAESTRUCTURA.md)**
- **[A3 — Soberanía de modelo (self-hosted + fine-tuning)](PLAN-A3-MODELO.md)**
- **[B — Motor de IA (RAG real + corpus)](PLAN-B-MOTOR-IA.md)**
- **[C — Funcionalidades (núcleos con motor)](PLAN-C-FUNCIONALIDADES.md)**
- **[D — Escala multi-sindicato + protección](PLAN-D-ESCALA.md)**

## Cómo leer este plan
Cuatro **Partes** (A–D), cada una con: *objetivo · estado actual · tareas · "hecho cuando" · dependencias · decisiones abiertas*. Al final, una **secuencia recomendada por fases** que las entrelaza (porque tienen dependencias entre sí) y los **primeros pasos concretos**.

Regla de oro de secuencia:
```
A(seguridad) ─► habilita todo lo que toque datos reales de afiliados
A(infra)     ─► prerequisito de A(modelo) y de B(RAG con vector DB)
B(corpus)    ─► insumo del fine-tuning de A(modelo) y de C(núcleos)
A+B          ─► base de C(funcionalidades) y D(escala)
```

---

# PARTE A — Fundaciones críticas (soberanía + seguridad)

## A1 · Seguridad y multi-usuario real  🔴 *máxima prioridad*
**Objetivo:** que ningún dato de un afiliado sea accesible por quien no corresponde, ni borrable por error/abuso.

**Estado actual (auditado):**
- No hay autenticación de servidor: el `username` y el `grade` llegan del cliente y se confían.
- Endpoints destructivos globales sin protección: `DELETE /api/chat/clear-all`, `/api/informes/clear-all`, `/api/correcciones/clear-all`.
- CORS en `allow_origins=["*"]`; el código arma una lista de orígenes permitidos pero **no la usa**.
- Rate-limit solo en memoria por IP (se pierde al reiniciar, no sirve entre réplicas).

**Tareas:**
1. **Auth JWT** (login real): emisión de token en `/api/login`, verificación en cada endpoint sensible; el `grade` sale del token, no del request.
2. **Autorización por usuario/grado**: cada `GET/DELETE` valida que el token corresponda al `username`/territorio pedido.
3. **Blindar/eliminar** los `clear-all` (o dejarlos solo tras auth de admin + confirmación).
4. **CORS** restringido al origen real (usar la lista `ALLOWED_ORIGIN` que ya existe).
5. **Rate-limit** a un store compartido (Redis) o al proxy.
6. Auditoría básica de accesos (quién leyó/escribió qué).

**Hecho cuando:** un usuario solo puede ver/editar lo que su grado y territorio permiten, verificado con tests; los `clear-all` no son accesibles sin admin.
**Depende de:** nada (arrancar ya). **Bloquea:** D (multi-sindicato) y cualquier carga de datos reales.
**[DECISIÓN]** ¿Login propio (usuario/clave por sindicato) o federado con el padrón del gremio?

## A2 · Soberanía de infraestructura  🔴
**Objetivo:** salir de la nube comercial (Render) hacia infraestructura controlada por el programa.

**Estado actual:** backend en Render; frontend en GitHub Pages; SQLite local al proceso.

**Tareas:**
1. **[DECISIÓN]** Elegir infraestructura: VPS argentino (ej. proveedor local) vs. servidor físico del programa/federación. Definir specs (CPU/RAM; GPU si se autohospeda el modelo — ver A3).
2. Contenerizar el stack (ya hay `Dockerfile`/`docker-compose`) y desplegar en el VPS.
3. Migrar la persistencia de **SQLite → Postgres** (multi-conexión, backups, y necesario para escalar/multi-tenant).
4. Backups automáticos + cifrado en reposo.
5. Dominio propio + TLS.

**Hecho cuando:** el sistema corre end-to-end en infraestructura del programa, con backups y TLS, sin depender de Render.
**Depende de:** A1 (para no exponer datos al mover). **Bloquea:** A3, B (vector DB), D.

## A3 · Soberanía de modelo  🟠 *meta política central, esfuerzo alto*
**Objetivo:** dejar de depender de GLM/DashScope (Alibaba) y correr un modelo propio.

**Estado actual:** LLM = GLM-5.1 vía DashScope (el adaptador se llama "deepseek" pero apunta a Alibaba). STT: Groq Whisper / DashScope.

**Tareas (por etapas):**
1. **Transición controlada:** aislar el proveedor detrás de la interfaz `llm_providers/` (ya existe) para poder cambiar sin tocar el resto.
2. **Modelo open self-hosted:** desplegar un modelo abierto (ej. de la familia Qwen/Llama/DeepSeek-OSS) en el VPS/GPU; medir calidad vs. el actual en las personas (abogado, compañero, etc.).
3. **STT on-device / soberano:** Whisper self-hosted (ya previsto en la arquitectura) para no mandar audios a terceros.
4. **Fine-tuning propio** (meta): armar dataset desde el corpus soberano (Parte B) + las personas, y afinar el modelo con perspectiva de clase. Requiere cómputo.

**Hecho cuando:** las respuestas se generan con un modelo bajo control del programa, con calidad ≥ la actual en un set de evaluación.
**Depende de:** A2 (infra/GPU) + B (corpus para fine-tuning). **[DECISIÓN]** modelo base, presupuesto de cómputo, si se mantiene DashScope como *fallback* transitorio.

---

# PARTE B — Motor de inteligencia (RAG + corpus)

## B1 · RAG real (de keyword a semántico)  🟠
**Objetivo:** respuestas más precisas y con mejor recuperación, manteniendo el anti-alucinación.

**Estado actual:** `rag_retriever.py` hace keyword/TF-IDF en memoria (sin embeddings). El propio archivo prevé una "Phase 4" con FAISS+embeddings.

**Tareas:**
1. **Embeddings + vector DB** (Qdrant, alineado con la arquitectura; embeddings open ej. BGE) para búsqueda semántica.
2. **Búsqueda híbrida:** semántica + exact-match para citas legales ("Art. 245") — clave para no perder precisión jurídica.
3. **Grafo de conocimiento** (Neo4j) para relaciones (convenio↔ley↔jurisprudencia↔empresa).
4. **Agente verificador** (guardrail): confirma que la respuesta tiene respaldo antes de emitir (refuerza el "si no hay fuente, no responde").
5. Mantener el **filtro por grado/vigencia/formato** que ya existe (evita "persona mixing").

**Hecho cuando:** en un set de preguntas de prueba, el RAG semántico supera al keyword en recuperación y cita correctamente.
**Depende de:** A2 (dónde corre el vector DB). **Habilita:** mejor C (todas las personas) y mejor dataset para A3.

## B2 · Corpus y taxonomía soberana  🟠
**Objetivo:** que el sistema "sepa" de verdad — hoy la base es delgada.

**Estado actual:** 316 chunks = 24 manuales + 292 de **un solo libro** (La Forestal). Taxonomía (~9 familias / ~70 etiquetas) parcialmente definida (inconsistencia entre docs).

**Tareas:**
1. **Pipeline de ingesta** robusto (ya hay `scripts/pdf_to_chunks.py`): mejorar metadata (libro, capítulo, página, vigencia, grado).
2. **Cargar el corpus base:** CCT 420/05 completo, LCT y leyes clave, jurisprudencia, resoluciones de asamblea, discursos, y la biblioteca histórica.
3. **Consolidar la taxonomía** (las ~70 etiquetas) como fuente de verdad única, versionada.
4. **Digitalización de archivos** del sindicato (parte del setup de adopción, Parte D).
5. Control de calidad/curación (perspectiva de clase, no matching de strings).

**Hecho cuando:** el corpus cubre convenio + leyes + jurisprudencia + historia del piloto, con metadata y taxonomía consolidada.
**Depende de:** B1 (para indexar bien). **Insumo de:** A3 (fine-tuning) y C.

---

# PARTE C — Funcionalidades a construir (núcleos con motor)

> Muchos núcleos están **documentados pero sin motor**. Priorizados por valor/esfuerzo.

## C1 · Índices (los que dan "números propios")  🟢 alto valor
- **Comparador SMVM**: "compará tu salario" (mínimo legal vs. valor constitucional) — más dato/UI que LLM, se puede hacer ya.
- **Índice ICE** (comportamiento empresarial): definir la **metodología de ponderación de las 4 dimensiones** [DECISIÓN] y el motor de cálculo.
- **IFT** (felicidad del trabajador): 6 dimensiones; definir ponderaciones [DECISIÓN] con el comité.
- Cruces: **ICE×SMVM**, **IFT×SMVM**.

## C2 · Contenido y derecho
- **Nuestro Derecho** como **convenio vivo navegable** (no solo chat): el CCT interactivo con artículos, vigencia y enlaces.
- **Cómo Somos** (datos de clase, categorías Iñigo Carrera): ingestar fuentes (INDEC/CIFRA/PIMSA/Mate) y armar tableros.
- **Acción Sindical**: repositorio de volantes/comunicados + **barra de conflictos abiertos** (alimentada por el flujo de reportes).
- **Tu Historia**: entrevista adaptativa que archiva testimonios (con protección, Parte D).

## C3 · Coyuntura y multimodal
- **Clipping / InfoMate automatizados** (hoy N10 es "manual"): pipeline de recolección→clasificación→edición.
- **Multimodal real**: cerrar el circuito voz/foto — STT soberano (A3), **EXIF stripping real** en fotos/videos (hoy aspiracional), foto como evidencia.

**Hecho cuando:** cada índice/función tiene motor real (no solo pantalla), con su fuente y metodología documentada.
**Depende de:** B (para las que usan IA) — las de dato/UI (SMVM, convenio vivo) pueden adelantarse.

---

# PARTE D — Escala multi-sindicato y protección

## D1 · Multi-tenant  🟠
**Objetivo:** pasar del piloto a **varios sindicatos**, cada uno con su corpus, su convenio y su config, aislados entre sí.
**Tareas:**
1. Modelo de datos por organización (tenant): corpus, taxonomía, usuarios, grados, territorios propios.
2. Aislamiento y permisos entre tenants (ningún dato cruza).
3. Panel de administración por sindicato.
4. Onboarding reproducible (crear un tenant = correr un playbook).
**Depende de:** A1 (auth) + A2 (Postgres).

## D2 · Adopción y codiseño
- **Kit de arranque** y proceso de codiseño (el que muestra la demo de Adopción): digitalización, carga de corpus, capacitación.
- Modelo de financiamiento B2B2C operativo (membresía por tamaño, subsidio cruzado) — [DECISIÓN] cerrar números reales de setup e infraestructura (hoy son estimadores).

## D3 · Protección de datos (implementar lo aspiracional)
**Estado:** hoy protección "por prompt" y filtros; falta lo técnico.
**Tareas:** consentimiento explícito en la carga, **anonimización real**, **EXIF stripping** efectivo, cifrado en reposo, retención/borrado, y accesos auditables (se cruza con A1).
**Hecho cuando:** un afiliado puede reportar con garantía técnica (no solo declarativa) de que la empresa no accede y su identidad está protegida.

---

# Secuencia recomendada (fases)

| Fase | Foco | Contenido | Por qué en este orden |
|---|---|---|---|
| **0** | Blindar | A1 (auth + cerrar endpoints + CORS) | Sin esto, cualquier dato real es un riesgo. Rápido y desbloquea todo. |
| **1** | Soberanía base + motor | A2 (VPS + Postgres) ‖ B1 (RAG semántico) ‖ B2 (corpus) | La infra soberana y el motor de calidad son la base de todo lo demás. En paralelo. |
| **2** | Modelo propio | A3 (open self-hosted → fine-tuning con B2) | Requiere infra (F1) y corpus (F1). Es la meta política central. |
| **3** | Funcionalidades | C1 índices ‖ C2 contenido ‖ C3 multimodal + D3 protección | Sobre A+B ya sólidos. Las de dato/UI (SMVM, convenio vivo) pueden adelantarse a F1. |
| **4** | Escala | D1 multi-tenant + D2 adopción | Con seguridad, infra y features maduras, sumar sindicatos. |

*Adelantables desde ya (no bloquean): comparador SMVM (C1), convenio vivo (C2), y mejora del pipeline de ingesta (B2.1).*

---

# Primeros pasos concretos (esta/próximas semanas)
1. **[DECISIÓN] equipo** — confirmar prioridad y quién hace qué (dev backend, investigadores para corpus/taxonomía, dirección para las decisiones políticas).
2. **A1 – Auth**: diseñar el esquema JWT + login por sindicato; blindar los `clear-all`; cerrar CORS. *(Es el desbloqueante nº1.)*
3. **A2 – Infra**: [DECISIÓN] proveedor de VPS + specs; preparar el deploy dockerizado y la migración a Postgres.
4. **B2 – Corpus**: empezar a cargar el **CCT 420/05 completo + LCT** con buena metadata (alto impacto inmediato en la calidad).
5. **C1 – SMVM**: prototipar el **comparador salarial** (rápido, muy demostrable, no depende del resto).

---

## Riesgos / cosas a vigilar
- **Datos reales antes de A1** = filtración. No cargar afiliados hasta tener auth.
- **Fine-tuning (A3)** tiene costo de cómputo real; puede convenir empezar con un buen modelo open self-hosted sin fine-tuning y afinar después.
- **Números de financiamiento (D2)** son estimadores — cerrarlos antes de ofrecer a otros gremios.
- **Coherencia de nombres** (SDI/ICE/IFT/núcleos): no renombrar sin grep en `backend/` y `frontend/`.
- **Calidad del corpus**: curación con perspectiva de clase, no cantidad por cantidad.

---
*Cada Parte puede volverse su propio documento de detalle cuando la abordemos. Este es el mapa maestro.*
