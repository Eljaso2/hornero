# Integración Biblioteca ↔ Hornero (feature-flag)

**Objetivo 2 del MVP:** que el Abogado del Hornero real responda con la **ley/convenio
vigente citando el artículo**, sin romper nada de lo actual.

## Qué se tocó (aditivo y 100% reversible)

| Archivo | Cambio |
|---|---|
| `library_service/adapter_hornero.py` | Puente. `legal_sources_text(...)` → bloque de fuentes legales, o `""`. |
| `library_service/__init__.py` | Hace importable el paquete. |
| `knowledge_base.py` | `get_system_prompt_rag(..., extra_sources_text="")` → append opcional. |
| `main.py` | Import del puente + 2 sitios del Abogado (`/api/chat`, `/api/chat/stream`). |

**Con el flag apagado, el prompt es idéntico byte a byte al de antes.** El puente:
- Solo actúa para la persona **Abogado** (`formato=="consulta"` o `requested_persona=="abogado"`) → no contamina Compañero/Sociólogo/etc.
- Ante cualquier error (servicio caído, timeout 8s) devuelve `""` → el chat sigue con la KB local.

## Cómo encenderlo

En `backend/.env` (que ya lee `load_dotenv`), una de dos:

```bash
# Opción A — in-process (más simple, sin levantar otro servicio):
LIBRARY_INPROC=1

# Opción B — servicio separado (mejor para Render / escalar aparte):
LIBRARY_URL=http://localhost:8010   # y correr: python3 library_service/server.py
```

Opcional: `HORNERO_TENANT=aceiteros` (default). Preparado para multi-tenant: cada gremio
verá su colección ∪ `shared` (leyes generales).

## Verificado

- Flag off → `legal_sources_text()==""` (comportamiento idéntico). ✅
- Flag on + `consulta` → trae LCT/leyes reales con cita. ✅
- Persona no-legal (debate/panorama) → `""` aunque el flag esté on. ✅
- `main.py`, `knowledge_base.py`, `adapter_hornero.py` compilan. ✅
- Standalone `ask.py` (mismo corpus, GLM-5.2) responde citando Art. 245 / 150 / 197 bis. ✅

## Pendiente para el live run

El Python del sistema no tiene las deps (`fastapi`, `dotenv`, …). Para probar el
servidor real:

```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
echo "LIBRARY_INPROC=1" >> .env
uvicorn main:app --port 8000
# POST /api/chat  { "message":"me despidieron sin causa", "formato":"consulta", "grade":"A" }
```
