"""Adaptador de embeddings — enchufable.

Proveedores por env EMBED_PROVIDER:
  - none (default)  → devuelve None → la biblioteca usa TF-IDF (léxico)
  - dashscope       → reusa la DASHSCOPE_API_KEY que Hornero YA tiene (¡sin key nueva!)
  - jina            → api.jina.ai (usa JINA_API_KEY)  [tu stack meta-rag-oss]
  - openai          → OpenAI/compatible (EMBED_API_KEY, EMBED_BASE_URL, EMBED_MODEL)

Cuando hay proveedor, la búsqueda pasa a SEMÁNTICA (tapa la limitación léxica,
p.ej. 'horas extra' ↔ 'horas suplementarias'). Solo stdlib (urllib).
"""
import os
import json
import urllib.request

PROVIDER = os.getenv("EMBED_PROVIDER", "none").lower()


def _post(url, payload, headers):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def _jina(texts):
    key = os.getenv("JINA_API_KEY", "")
    data = _post("https://api.jina.ai/v1/embeddings",
                 {"model": os.getenv("EMBED_MODEL", "jina-embeddings-v3"),
                  "input": texts},
                 {"Authorization": f"Bearer {key}"})
    return [d["embedding"] for d in data["data"]]


def _dashscope(texts):
    # Reusa la key de Hornero (compatible-mode de DashScope = formato OpenAI)
    key = os.getenv("DASHSCOPE_API_KEY", "") or os.getenv("EMBED_API_KEY", "")
    data = _post("https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings",
                 {"model": os.getenv("EMBED_MODEL", "text-embedding-v3"),
                  "input": texts},
                 {"Authorization": f"Bearer {key}"})
    return [d["embedding"] for d in data["data"]]


def _openai(texts):
    key = os.getenv("EMBED_API_KEY", "")
    base = os.getenv("EMBED_BASE_URL", "https://api.openai.com/v1/embeddings")
    data = _post(base,
                 {"model": os.getenv("EMBED_MODEL", "text-embedding-3-small"),
                  "input": texts},
                 {"Authorization": f"Bearer {key}"})
    return [d["embedding"] for d in data["data"]]


def get_embedder():
    """Devuelve una función embed(texts)->list[vector], o None si no hay proveedor."""
    if PROVIDER == "dashscope" and (os.getenv("DASHSCOPE_API_KEY") or os.getenv("EMBED_API_KEY")):
        return _dashscope
    if PROVIDER == "jina" and os.getenv("JINA_API_KEY"):
        return _jina
    if PROVIDER == "openai" and os.getenv("EMBED_API_KEY"):
        return _openai
    return None  # → TF-IDF léxico
