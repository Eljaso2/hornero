"""Puente Biblioteca ↔ backend de Hornero. Feature-flag, aditivo y reversible.

La arquitectura de Hornero inyecta CHUNKS DE LA KB POR ID (get_chunks_text busca el
texto en ALL_CHUNKS). Los chunks de la Biblioteca no viven ahí, así que el enganche
correcto NO es reemplazar el retrieval por IDs, sino APORTAR el texto legal ya
formateado como un bloque de fuentes extra en el system prompt del Abogado.

Interruptor:
  - LIBRARY_URL=http://host:8010  → consulta el servicio por HTTP (modo servicio).
  - LIBRARY_INPROC=1              → importa library.py y busca en proceso (modo local).
  - ninguno                       → devuelve "" → Hornero se comporta EXACTAMENTE igual.

Cualquier error (servicio caído, timeout) devuelve "" y el chat sigue con la KB local.
Solo stdlib.
"""
import os
import json
import urllib.request

LIBRARY_URL = os.getenv("LIBRARY_URL", "").strip()
LIBRARY_INPROC = os.getenv("LIBRARY_INPROC", "").strip() not in ("", "0", "false", "no")
HORNERO_TENANT = os.getenv("HORNERO_TENANT", "aceiteros").strip()  # fallback si no viene en la request

# El gremio (tenant) viaja en la request. Si no llega un tenant explícito, se deriva del
# campo `sector` que Hornero ya envía (aceitero → aceiteros). Último recurso: HORNERO_TENANT.
# SEGURIDAD: en producción con auth, el tenant debe atarse a la sesión autenticada, NO
# confiarse del body del cliente (o un gremio podría leer el CCT sectorial de otro).
SECTOR_TENANT = {
    "aceitero": "aceiteros", "aceiteros": "aceiteros",
    "comercio": "comercio", "mercantil": "comercio",
}


def resolve_tenant(tenant: str = "", sector: str = "") -> str:
    t = (tenant or "").strip()
    if t:
        return t
    s = (sector or "").strip().lower()
    return SECTOR_TENANT.get(s, HORNERO_TENANT)

# El Abogado (persona legal) es el único que recibe ley/convenio; evita contaminar
# a las otras personas (mismo criterio que FORMATO_CATEGORY_MAP en rag_retriever).
_LEGAL_FORMATOS = {"consulta"}
_LEGAL_PERSONAS = {"abogado"}


def _is_legal(formato: str, requested_persona: str) -> bool:
    return formato in _LEGAL_FORMATOS or (requested_persona or "") in _LEGAL_PERSONAS


def _search_http(query, tenant, k):
    payload = {"query": query, "tenant": tenant, "k": k,
               "filtros": {"vigencia": "vigente"}}
    req = urllib.request.Request(
        LIBRARY_URL.rstrip("/") + "/library/search",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read().decode()).get("results", [])


def _search_inproc(query, tenant, k):
    try:
        from . import library
    except Exception:
        import library  # cuando se corre desde dentro de library_service/
    return library.search(query, k=k, filtros={"tenant": tenant, "vigencia": "vigente"})


def _search(query, tenant, k):
    if LIBRARY_URL:
        return _search_http(query, tenant, k)
    if LIBRARY_INPROC:
        return _search_inproc(query, tenant, k)
    return []


def legal_sources_text(query: str, formato: str = "", requested_persona: str = "",
                       grade: str = "A", tenant: str = "", sector: str = "",
                       conversation_history: list = None, k: int = 6) -> str:
    """Bloque de fuentes legales para inyectar en el system prompt del Abogado.

    El gremio se toma de `tenant` (o se deriva de `sector`). Devuelve "" si el flag
    está apagado, si la persona no es legal, si no hay resultados, o ante cualquier
    error. Nunca rompe el chat.
    """
    if not (LIBRARY_URL or LIBRARY_INPROC):
        return ""
    if not _is_legal(formato, requested_persona):
        return ""
    tenant = resolve_tenant(tenant, sector)
    try:
        # contexto conversacional, igual que hace el retrieval de Hornero
        enhanced = query
        if conversation_history:
            ctx = " ".join(m.get("text", "") for m in conversation_history[-3:]
                           if m.get("role") == "user" and m.get("text"))
            enhanced = (ctx + " " + query).strip()
        hits = _search(enhanced, tenant, k)
    except Exception:
        return ""
    if not hits:
        return ""

    lines = ["=== LEY Y CONVENIO APLICABLE A ESTE TRABAJADOR (Biblioteca Hornero) ===",
             "Estos son los artículos EXACTOS y vigentes que rigen para el gremio de este "
             "trabajador (fuente verificada). Reglas obligatorias:",
             "· Estos son los ÚNICOS artículos que podés citar. NO cites, menciones ni inventes "
             "NINGÚN artículo, ley ni convenio que no aparezca abajo (si el Art. 201 LCT no está "
             "en la lista, NO lo cites, aunque lo recuerdes de memoria).",
             "· Basá TODA la respuesta en estos artículos y citalos por número (ej. «Art. 27 CCT 420/05», «Art. 245 LCT»), diciendo qué establece cada uno.",
             "· Si hay un artículo de CONVENIO (CCT) sobre el tema, ESE es el que rige el gremio: "
             "citalo primero y decí exactamente su contenido; la LCT solo como marco general.",
             "· Si estos artículos no alcanzan para responder, decilo con honestidad; NO rellenes con derecho de memoria.", ""]
    for h in hits:
        norma = h.get("norma", ""); art = h.get("articulo", "")
        titulo = h.get("titulo", ""); texto = (h.get("texto", "") or "").strip()
        cita = f"{norma} · Art. {art}".strip(" ·")
        head = f"[{cita} — {titulo}]" if titulo else f"[{cita}]"
        lines.append(head)
        lines.append(texto[:1500])
        if h.get("fuente"):
            lines.append(f"Fuente: {h['fuente']}")
        lines.append("")
    return "\n".join(lines)


# --- compat: firma vieja que devolvía una lista (por si algún caller la usa) ---
def retrieve(query, formato, grade="A", tenant=None,
             conversation_history=None, k=5):
    tenant = tenant or HORNERO_TENANT
    if LIBRARY_URL or LIBRARY_INPROC:
        try:
            return _search(query, tenant, k)
        except Exception:
            pass
    from rag_retriever import retrieve_for_query
    return retrieve_for_query(query, formato, grade, conversation_history)
