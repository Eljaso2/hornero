# Hornero — Backend: pipeline end-to-end ACTUAL (cómo funciona hoy)

> Revisión del código real (`backend/`) para entender el flujo y **dónde hay que intervenir para multi-sindicato**.
> Referencias: `archivo:línea`. Base de las Partes A/B/D del [PLAN maestro](PLAN-EXPANSION-MEJORA.md).

---

## 1. Arquitectura en una frase
El backend es un **proxy FastAPI sin estado de dominio propio**: recibe un mensaje, **arma un prompt** con una persona + chunks recuperados (RAG por keyword) + clipping, **llama a un LLM externo** (GLM vía DashScope), parsea el JSON y responde. Aparte, **sincroniza** chat/informes/correcciones que el frontend ya tiene en IndexedDB (offline-first) hacia **SQLite**. **Todo el "cerebro" y los datos son de UN solo sindicato (aceiteros).**

---

## 2. Pipeline de una consulta (chat) — paso a paso

```
Frontend (POST /api/chat  ó  /api/chat/stream)
  payload: { message, formato, history, grade, sector, requested_persona,
             session_id, incoming_reports, recipient_chain }
        │
        ▼
main.py:351 chat_endpoint  (ó :438 chat_stream_endpoint)
  1) _check_rate_limit(client_ip)            main.py:70   ← por IP, en memoria (por proceso)
  2) retrieve_for_query(message, formato, grade, history)   rag_retriever.py:223
        ├─ enhance_query: agrega los últimos 3 mensajes de usuario
        ├─ keyword_search sobre ALL_CHUNKS  rag_retriever.py:132  ← TF-IDF + boosts (título/tag/categoría)
        ├─ filtro por GRADE   grade_satisfies()  (A<B.a<B.b<B.c<B.d)
        ├─ filtro por VIGENCIA (solo 'vigente')
        └─ filtro FORMATO→categorías (evita 'persona mixing')   → top 5 chunks
  3) get_system_prompt_rag(formato, chunk_ids, clipping, query, requested_persona,
                           grade, incoming_reports, recipient_chain)   knowledge_base.py
        = PERSONA_* + PRINCIPIOS_COMUNES + contexto de grado
          + reportes entrantes (si G2+) + chunks RAG + clipping (NOTICIAS ACTUALES)
  4) get_format_hint(formato, grade)  → full_message = hint + "Pregunta del trabajador: ..."
  5) call_llm_with_retry(...)   main.py:124   → _call_llm  main.py:177
        → call_deepseek / call_claude   (GLM-5.1 vía DashScope)
        temperatura y max_tokens según formato; 1 reintento si el JSON no valida
  6) parse_llm_response(raw)   main.py:1601   → { text|sections, tags, persona, redirect_persona, image, source_url }
        │
        ▼
ChatResponse (JSON)   +  logger.info("CHAT session=... persona=... chunks=...")
```

**Streaming** (`/api/chat/stream`): igual, pero emite SSE `token`/`done`/`error`. Streaming real solo con DeepSeek/OpenAI-compatible; con Claude cae a no-stream.

**Observaciones del pipeline:**
- El **RAG opera sobre `ALL_CHUNKS`** — una **lista global única** cargada una vez en el `startup` (`main.py:91`, `kb_refresh()`), con IDF precomputado una sola vez (`rag_retriever.py:106`). → **Un corpus para todos.**
- **`grade` y `sector` vienen del request** (los manda el cliente) → hoy no hay forma de confiar en ellos (ver §5, seguridad).
- Las **personas y la KB están hardcodeadas al dominio aceitero** (Federación Aceitera, CCT 420/05, Yofra, Cremonte, La Forestal) en `knowledge_base.py` y `kb_data.py`.

---

## 3. Flujo de datos (offline-first + sync) — y un hallazgo importante

La app es **offline-first**: escribe todo en **IndexedDB** y periódicamente hace **sync** al backend:
- `POST /api/chat/sync` (`main.py:1024`) → tabla `chat_messages`
- `POST /api/informes/sync` (`main.py:1260`) → tabla `informes`
- `POST /api/correcciones/sync` (`main.py:1481`) → tabla `correcciones`
- Lecturas: `/chat/sessions`, `/chat/messages`, `/informes/all`, `/informes/incoming`, `/correcciones`.

Todos hacen **upsert con guard de timestamp** (`ON CONFLICT(id) DO UPDATE ... WHERE excluded.timestamp > tabla.timestamp`) = *last-write-wins* por `timestamp`. El backend es, en la práctica, un **relay entre dispositivos**, no la fuente de verdad (esa es el IndexedDB del teléfono).

> ⚠️ **HALLAZGO CRÍTICO — persistencia efímera.** Las 3 SQLite se crean en `os.path.dirname(__file__)` (`main.py:983`, `:1182`), es decir **dentro del contenedor**. En Render **sin disco persistente** (el `render.yaml` no monta ninguno; `.dockerignore` excluye `*.db`), **el archivo se pierde en cada redeploy/reinicio**. Hoy "no se nota" porque el teléfono re-sincroniza desde IndexedDB, pero **el backend no es durable**. Para multi-usuario/multi-sindicato real esto **hay que resolverlo sí o sí** → Postgres (Parte A2).

---

## 4. La jerarquía de informes (`/informes/incoming`) — el corazón de la IS

`main.py:1340`. Según el `grade` (del request):
- **B.b (delegado)** → ve `grado=1` en estado {pendiente, visto, aceptado}, filtrado por **territorio + empresa** (matching normalizado; sin empresa → todo el territorio).
- **B.c (secretario)** → ve `grado=2` de su **territorio** (todas las empresas).
- **B.d (federación)** → ve `grado=3` de **todos los territorios**.

> ⚠️ **Acoplamiento a un solo sindicato:** la consulta es `SELECT * FROM informes WHERE grado=? AND estado IN (...)` **sin ninguna noción de organización**. Si dos sindicatos compartieran este backend, un **B.d de un sindicato vería los G3 de todos** (incluido el otro) → **fuga cross-sindicato por diseño.** Además `grade`/`territorio`/`empresa` **son del request** (no verificados).

---

## 5. Resumen: dónde está acoplado a "UN solo sindicato"

| Capa | Cómo está hoy | Para multi-sindicato hay que… |
|---|---|---|
| **Identidad/autz** | `grade`,`sector`,`username`,`territorio` vienen del **request**, sin auth (`main.py`) | Auth (A1): que salgan de un **token** con `tenant_id` + grade |
| **Persistencia** | 3 SQLite **efímeras**, **sin columna de organización** | Postgres (A2) + **`tenant_id` en toda tabla** + aislamiento (row-level) |
| **Informes/incoming** | `WHERE grado=... estado=...` global | Agregar `AND tenant_id=?`; grade/territorio del token |
| **RAG/corpus** | `ALL_CHUNKS` **global** en memoria, IDF único | **Corpus por tenant** (colección en vector DB por sindicato) — Parte B/D |
| **Personas/KB** | Hardcodeadas a aceiteros (`knowledge_base.py`, `kb_data.py`) | **Parametrizar por tenant**: convenio, referentes, taxonomía, estilo |
| **Clipping** | Cache global (fetch a GitHub Pages del piloto) | Fuentes/edición **por tenant** |
| **Config/LLM** | 1 proveedor global por env | (puede seguir global) — pero el **prompt** debe cargar el dominio del tenant |
| **Rate-limit** | En memoria por IP y por proceso | Store compartido + por usuario/tenant (A1/A2) |

**Conclusión:** el sistema **no tiene ninguna noción de tenant** (grep de `tenant/organizacion_id/sindicato_id` = vacío). Multi-sindicato = **atravesar `tenant_id` por las 4 capas**: identidad → datos → recuperación (RAG/corpus) → prompt (personas/KB del sindicato).

---

## 6. Hallazgos críticos (más allá de multi-tenant)
1. **Persistencia no durable** (Render sin disco) → el backend pierde datos en cada deploy. *(A2, urgente)*
2. **Sin autenticación** → `grade`/`username` del cliente se confían; endpoints `clear-all` abiertos. *(A1, urgente)*
3. **Corpus único global en memoria** → no escala a varios sindicatos ni a corpus grande; RAG por keyword. *(B, D)*
4. **Cerebro hardcodeado** (personas/KB aceiteras) → cada sindicato necesita su dominio. *(D1 + parametrización)*
5. **Rate-limit por proceso** → inútil con réplicas. *(A2)*

---

## 7. La forma de la solución multi-sindicato (resumen accionable)
El patrón mínimo, en orden de dependencias:
1. **A1** — token con `tenant_id` + `grade` firmados. *(nada confiable sin esto)*
2. **A2** — Postgres; **`tenant_id NOT NULL` en `users`, `chat_messages`, `informes`, `correcciones`, `subscriptions`**; cada query filtra por `tenant_id`.
3. **D1** — el RAG recupera del **corpus del tenant** (colección propia en la vector DB de B1); el prompt carga **personas/KB/convenio del tenant** (parametrizar `knowledge_base.py`/`kb_data.py` como config por sindicato, no hardcode).
4. **Onboarding** = crear tenant: seed de usuarios + cargar su corpus + su config de dominio.

> Regla: **ningún dato ni recuperación cruza el `tenant_id`.** Con eso, el mismo pipeline de §2 sirve para N sindicatos, cada uno con su cerebro y sus datos aislados.

---
*Este doc es la foto del "hoy". Los cambios concretos viven en A1 (auth+tenant en token), A2 (Postgres+tenant_id), B (RAG/corpus por tenant) y D1 (multi-tenant + onboarding).*
