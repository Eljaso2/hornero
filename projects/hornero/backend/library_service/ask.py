"""MVP: 'El Abogado' responde una consulta laboral CITANDO la ley real.

Flujo RAG completo, con lo que hay:
  consulta → recuperar artículos de la biblioteca → GLM-5.2 responde con la cita.
Usa el token de chat (ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL). Solo stdlib.

    python3 ask.py "¿me pueden obligar a hacer horas extra?"
"""
import os
import sys
import json
import urllib.request

import library

TOKEN = os.getenv("ANTHROPIC_AUTH_TOKEN", "")
BASE = os.getenv("ANTHROPIC_BASE_URL", "")
MODEL = os.getenv("EXPAND_MODEL", "glm-5.2")

SYSTEM = (
    "Sos 'El Abogado', abogado laboralista de un sindicato argentino. Respondés desde "
    "la posición del trabajador, en lenguaje claro. Reglas: (1) Respondé SOLO con base en "
    "los artículos provistos abajo. (2) CITÁ el artículo y la norma (ej. 'Art. 201 LCT'). "
    "(3) Si los artículos no alcanzan para responder, decilo (no inventes). No razones en voz alta; "
    "dá la respuesta directa."
)


def _chat(system, user, max_tokens=900):
    body = {"model": MODEL, "max_tokens": max_tokens, "system": system,
            "messages": [{"role": "user", "content": user}]}
    req = urllib.request.Request(
        BASE.rstrip("/") + "/v1/messages", data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json",
                 "anthropic-version": "2023-06-01", "x-api-key": TOKEN})
    d = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
    return " ".join(b.get("text", "") for b in d.get("content", []) if b.get("type") == "text").strip()


def answer(question: str, tenant: str = "aceiteros", k: int = 8) -> dict:
    hits = library.search(question, k=k, filtros={"tenant": tenant, "vigencia": "vigente"})
    contexto = "\n\n".join(
        f"[{h['norma']} · Art. {h['articulo']}] {h['titulo']}\n{h['texto'][:1800]}"
        for h in hits)
    user = f"CONSULTA DEL TRABAJADOR:\n{question}\n\nARTÍCULOS DISPONIBLES:\n{contexto}"
    resp = _chat(SYSTEM, user)
    return {"answer": resp, "fuentes": [f"{h['norma']} Art. {h['articulo']}" for h in hits]}


if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) or "¿me pueden obligar a hacer horas extra?"
    print(f"CONSULTA: {q}\n")
    r = answer(q)
    print("RESPUESTA (El Abogado):\n" + r["answer"])
    print("\nArtículos recuperados:", ", ".join(r["fuentes"]))
