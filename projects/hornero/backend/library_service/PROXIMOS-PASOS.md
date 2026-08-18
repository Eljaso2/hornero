# Hornero — Biblioteca legal + RAG · Estado y pasos a seguir

Roadmap del motor de conocimiento de Hornero. Para el *cómo se construyó* (metodológico y
técnico), ver `../../CONSTRUCCION-PASO-A-PASO-ES.md` / `../../BUILD-STEP-BY-STEP-EN.md`.

---

## ✅ Estado actual (hecho y probado)

- **Biblioteca legal real, multi-tenant.** 737 artículos · 7 normas · 3 gremios.
  - General (`shared`): LCT 20.744 + Leyes 11.544, 23.551, 24.013, 24.557.
  - Sectorial: CCT 420/05 (aceiteros), CCT 130/75 (comercio).
- **Recuperación:** cita exacta de artículo + léxico (TF-IDF) + expansión de consulta con LLM.
- **El Abogado responde citando la ley/convenio reales**, vía prompt enfocado (`get_legal_prompt_focused`).
- **Integrado en `main.py`** detrás de flags (`LIBRARY_INPROC` / `LIBRARY_URL`), aditivo y reversible.
- **Tenant desde el request** (`resolve_tenant`, deriva de `sector`); aislamiento entre gremios verificado.
- **Durabilidad:** store dual SQLite/Postgres; migración con `migrate_pg.py` (737 chunks en Postgres).
- **Calidad de datos:** limpieza de "artículos fantasma"; chunker con detección de encoding.

---

## 🔴 Paso 0 — Seguridad inmediata

- [ ] **Rotar todas las API keys** que se pegaron durante el desarrollo (OpenAI, DashScope,
      Anthropic, Gemini, Oxylabs). Viven solo en `keys.env` (gitignored), pero quedaron en historial.
- [ ] Confirmar que `keys.env` **nunca** se commitea (protegido por `*.env` en `.gitignore`).

---

## 🧭 Pasos a seguir (por prioridad)

### 1. Autenticación + tenant atado a la sesión  *(Fase 0 del plan — bloqueante de producción)*
**Por qué.** Hoy el `tenant` se confía del body del cliente; sin auth, un gremio podría pedir el
convenio de otro. El aislamiento real depende de esto.
**Qué.** Login por gremio/grado; derivar `tenant` de la sesión autenticada, no del request.
**Dónde.** `main.py` (middleware de auth), `adapter_hornero.resolve_tenant`. Ref. `../../PLAN-A1-SEGURIDAD.md`.

### 2. Embeddings locales y soberanos → búsqueda semántica
**Por qué.** Mejora el recall en consultas muy parafraseadas. Las keys de embeddings externas
fallaron y el plan GLM no tiene modelo de embeddings.
**Qué.** Correr un embedder multilingüe **local** (p. ej. `fastembed` + `multilingual-e5-small`,
ONNX, ~130 MB, sin key, offline). Poblar con `library.embed_index()` y migrar la columna `vec` a
`pgvector` nativo (ya disponible en la base).
**Dónde.** `embeddings.py` (agregar proveedor `local`), `library.py` (`_semantic`).

### 3. Deploy a Render (con Postgres administrado)
**Por qué.** Que el MVP viva online, durable.
**Qué.** Crear un Render Postgres; setear `LIBRARY_DB_URL` + `LIBRARY_INPROC=1` (o `LIBRARY_URL`
si la biblioteca corre como servicio aparte). Correr `migrate_pg.py` una vez.
**Dónde.** `render.yaml`, variables de entorno del servicio.

### 4. Ampliar el corpus
- [ ] Más **CCT sectoriales** (metalúrgicos UOM, camioneros, etc.) — un gremio, una entrada en `SOURCES`.
- [ ] **Vigencia / actualización:** re-scrapear periódicamente; marcar artículos derogados (`vigencia`).
- [ ] Evaluar sumar **jurisprudencia** y **acuerdos paritarios** recientes.

### 5. Calidad y confianza
- [ ] **Verificador de citas:** chequear que todo artículo citado por el modelo exista realmente en
      la biblioteca del gremio (bloquear/marcar si cita algo que no está).
- [ ] **Tests** del chunker (dos notaciones, encoding), del aislamiento multi-tenant y del retrieval.
- [ ] **Observabilidad:** loguear qué artículos se recuperan y cuáles cita el modelo (métrica de grounding).

### 6. Extender más allá del Abogado (si aplica)
Evaluar si el Sociólogo/Historiador se benefician de una biblioteca análoga (datos de clase,
fuentes históricas) con el mismo patrón recuperar → prompt enfocado → citar.

---

## Cómo correrlo (referencia rápida)

```bash
# biblioteca como servicio (opcional)
cd backend/library_service && python3 server.py            # :8010

# backend Hornero con la biblioteca activada
cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
export LIBRARY_INPROC=1                                     # o LIBRARY_URL=http://localhost:8010
export LIBRARY_DB_URL=postgresql://127.0.0.1:5432/hornero  # opcional (durabilidad)
uvicorn main:app --port 8000
# POST /api/chat {"message":"¿cuánto me pagan la hora extra?","formato":"consulta","sector":"aceitero"}
```

Migrar a Postgres:
```bash
LIBRARY_DB_URL=postgresql://127.0.0.1:5432/hornero python3 library_service/migrate_pg.py
```
