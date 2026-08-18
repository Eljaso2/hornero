"""Expansión de consulta con LLM (GLM-5.2 vía Aliyun) — tapa el problema de sinónimos
del léxico SIN embeddings. 'horas extra' → 'horas suplementarias, recargo, jornada'.

Usa el token de chat (ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL, formato Anthropic).
Si no está configurado, devuelve None → la búsqueda usa la consulta tal cual. Solo stdlib.
"""
import os
import json
import urllib.request

# Reutiliza el mismo LLM que Hornero: acepta ANTHROPIC_AUTH_TOKEN o ANTHROPIC_API_KEY.
TOKEN = os.getenv("ANTHROPIC_AUTH_TOKEN", "") or os.getenv("ANTHROPIC_API_KEY", "")
BASE = os.getenv("EXPAND_BASE_URL", "") or os.getenv("ANTHROPIC_BASE_URL", "")
MODEL = os.getenv("EXPAND_MODEL", "glm-5.2")


def _endpoint():
    """Devuelve la URL /v1/messages sin duplicar el sufijo (call_claude lo incluye)."""
    b = BASE.rstrip("/")
    return b if b.endswith("/v1/messages") else b + "/v1/messages"

_PROMPT = (
    "Sos un asistente jurídico laboral argentino. Para esta consulta de un trabajador, "
    "devolvé SOLO una lista corta (máx 10, separada por comas) de términos y sinónimos "
    "jurídicos que convenga buscar en la ley/convenio. Sin explicar, sin numerar.\n"
    "Consulta: {q}"
)


def _chat(prompt: str) -> str:
    body = {"model": MODEL, "max_tokens": 700,   # GLM razona antes del texto final
            "messages": [{"role": "user", "content": prompt}]}
    req = urllib.request.Request(
        _endpoint(),
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json",
                 "anthropic-version": "2023-06-01", "x-api-key": TOKEN},
    )
    d = json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
    return " ".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text")


def get_expander():
    """Devuelve expand(query)->query_enriquecida, o None si no hay LLM configurado."""
    if not (TOKEN and BASE):
        return None

    def expand(query: str) -> str:
        try:
            terms = _chat(_PROMPT.format(q=query)).replace("\n", " ").strip()
            return (query + " " + terms) if terms else query
        except Exception:
            return query
    return expand
