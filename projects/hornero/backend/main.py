"""Backend Hornero — Chat IA Sindical proxy

FastAPI minimal que recibe mensajes del chat, construye prompt sindical,
llama a LLM externo (DeepSeek o Claude), devuelve respuesta estructurada.

Enfoque híbrido: proxy rápido ahora → migrar a RAG self-hosted en Phase 2.
"""

import json
import os
import re
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from knowledge_base import get_system_prompt, get_system_prompt_rag, get_format_hint, get_greeting_hint, PERSONA_MAP, PERSONA_NAME_MAP
from llm_providers.deepseek import call_deepseek
from llm_providers.claude import call_claude
from clipping_cache import get_clipping
from rag_retriever import retrieve_for_query
from kb_data import KB_CHUNKS, KB_CATEGORIES, KB_CATEGORY_META, refresh

load_dotenv(override=True)

# ===== Config =====
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "claude")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1/chat/completions")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_BASE_URL = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1/messages")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "https://eljaso2.github.io")
LOCAL_ORIGIN = os.getenv("LOCAL_ORIGIN", "http://localhost:*")
APP_BACKEND_URL = os.getenv("APP_BACKEND_URL", "http://localhost:8000")

# ===== FastAPI app =====
app = FastAPI(
    title="Hornero IA Sindical",
    description="Backend proxy para chat IA sindical — LLM + knowledge base sindical + clipping dinámico",
    version="0.2.0",
)

@app.on_event("startup")
async def startup_event():
    """Initialize clipping cache on startup."""
    count = refresh()
    print(f"Clipping cache initialized: {count} items")


# CORS — allow app origin + localhost for development
origins = [ALLOWED_ORIGIN]
if LOCAL_ORIGIN:
    # localhost:* pattern for development
    origins.append("http://localhost")
    origins.append("http://localhost:8000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permissive for dev — tighten in production
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# ===== Request/Response models =====
class GreetingRequest(BaseModel):
    section: str = "consulta"  # consulta|contenido|debate
    grade: str = "A"
    sector: str = "aceitero"


class GreetingResponse(BaseModel):
    text: str = ""
    sections: list = []
    tags: list
    time: str
    raw: str = ""
    persona: str = "ia-sindical"


class ChatRequest(BaseModel):
    message: str
    formato: str = "consulta"  # podcast|reel|columna|entrevista|consulta|contenido|debate
    history: list = []  # [{role, text, sections}]
    grade: str = "A"
    sector: str = "aceitero"
    requested_persona: str = ""  # companero|abogado|periodista|relator — override


class ChatResponse(BaseModel):
    text: str = ""
    sections: list = []
    tags: list
    time: str
    raw: str = ""  # Raw LLM response for debugging
    persona: str = "ia-sindical"  # Who responded: companero|abogado|periodista|relator|ia-sindical


# ===== Endpoints =====
@app.get("/api/config")
async def get_config():
    """Return backend config for the app to know where to connect."""
    return {"backendUrl": APP_BACKEND_URL, "provider": LLM_PROVIDER}


@app.post("/api/greeting")
async def greeting_endpoint(req: GreetingRequest) -> GreetingResponse:
    """Generate the IA's opening message when user enters a chat section.

    The IA greets, explains what it is, and tells what the user can consult
    in that specific section.

    RAG: greeting uses minimal context (no KB chunks needed — persona knows who it is).
    """
    # Greeting: no RAG retrieval needed (persona + principles are sufficient)
    effective_persona = PERSONA_MAP.get(req.section, 'abogado')
    system_prompt = get_system_prompt_rag(req.section, chunk_ids=[], clipping_items=get_clipping())
    greeting_hint = get_greeting_hint(req.section)

    try:
        if LLM_PROVIDER == "deepseek":
            raw_response = await call_deepseek(
                api_key=DEEPSEEK_API_KEY,
                system_prompt=system_prompt,
                user_message=greeting_hint,
                history=[],
                model=DEEPSEEK_MODEL,
                base_url=DEEPSEEK_BASE_URL,
                temperature=0.5,  # Slightly higher for more natural greeting
            )
        elif LLM_PROVIDER == "claude":
            raw_response = await call_claude(
                api_key=ANTHROPIC_API_KEY,
                system_prompt=system_prompt,
                user_message=greeting_hint,
                history=[],
                model=ANTHROPIC_MODEL,
                base_url=ANTHROPIC_BASE_URL,
                temperature=0.5,
            )
        else:
            raise HTTPException(400, f"Unknown LLM provider: {LLM_PROVIDER}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(500, f"LLM HTTP error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(500, f"LLM call failed: {type(e).__name__}: {str(e)}")

    parsed = parse_llm_response(raw_response)
    now = datetime.now()
    time_str = now.strftime("%H:%M")

    # Determine persona from LLM response or fallback
    llm_persona = parsed.get("persona", "")
    final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "relator", "ia-sindical"] else effective_persona

    return GreetingResponse(
        text=parsed.get("text", ""),
        sections=parsed.get("sections", []),
        tags=parsed.get("tags", [req.section, "greeting"]),
        time=time_str,
        raw=raw_response,
        persona=final_persona,
    )


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest) -> ChatResponse:
    """Main chat endpoint — receives user message, returns structured IA response.

    RAG: retrieves relevant KB chunks based on user query, injects only
    those chunks into the system prompt instead of the full KNOWLEDGE_BASE.
    """

    # RAG retrieval: find relevant chunks based on user query
    relevant_chunks = retrieve_for_query(req.message, req.formato, req.grade)
    chunk_ids = [c["id"] for c in relevant_chunks]

    # Build system prompt with ONLY relevant KB chunks
    # Determine effective persona from requested_persona override or formato
    system_prompt = get_system_prompt_rag(
        formato=req.formato,
        chunk_ids=chunk_ids,
        clipping_items=get_clipping(),
        query=req.message,
        requested_persona=req.requested_persona,
    )
    # Determine effective persona string for fallback
    effective_persona = PERSONA_MAP.get(req.formato, 'abogado')
    if req.requested_persona:
        if req.requested_persona in PERSONA_NAME_MAP:
            effective_persona = req.requested_persona
        elif req.requested_persona in PERSONA_MAP:
            effective_persona = req.requested_persona
    format_hint = get_format_hint(req.formato)

    # Build the user message with format context
    full_message = f"{format_hint}\n\nPregunta del trabajador: {req.message}"

    # Call LLM
    try:
        if LLM_PROVIDER == "deepseek":
            raw_response = await call_deepseek(
                api_key=DEEPSEEK_API_KEY,
                system_prompt=system_prompt,
                user_message=full_message,
                history=req.history,
                model=DEEPSEEK_MODEL,
                base_url=DEEPSEEK_BASE_URL,
            )
        elif LLM_PROVIDER == "claude":
            raw_response = await call_claude(
                api_key=ANTHROPIC_API_KEY,
                system_prompt=system_prompt,
                user_message=full_message,
                history=req.history,
                model=ANTHROPIC_MODEL,
                base_url=ANTHROPIC_BASE_URL,
            )
        else:
            raise HTTPException(400, f"Unknown LLM provider: {LLM_PROVIDER}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(500, f"LLM HTTP error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(500, f"LLM call failed: {type(e).__name__}: {str(e)}")

    # Parse LLM response — expect JSON
    parsed = parse_llm_response(raw_response)

    # Add time stamp
    now = datetime.now()
    time_str = now.strftime("%H:%M")

    # Determine persona from LLM response or fallback
    llm_persona = parsed.get("persona", "")
    final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "relator", "ia-sindical"] else effective_persona

    return ChatResponse(
        text=parsed.get("text", ""),
        sections=parsed.get("sections", []),
        tags=parsed.get("tags", [req.formato]),
        time=time_str,
        raw=raw_response,
        persona=final_persona,
    )


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "provider": LLM_PROVIDER,
        "clipping_items": len(get_clipping()),
        "kb_chunks": len(KB_CHUNKS),
        "rag": "keyword",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/kb")
async def get_knowledge_base(category: str = None, tipo: str = None):
    """Return knowledge base chunks for Archivo UI. Filterable by category and tipo.

    Args:
        category: filter by category (organizacion, convenio, paritaria, etc.)
        tipo: filter by tipo (documento, academico, multimedia)
    """
    chunks = KB_CHUNKS
    if category:
        chunks = [c for c in chunks if c["category"] == category]
    if tipo:
        chunks = [c for c in chunks if c["tipo"] == tipo]

    # Strip full text for list view (return excerpt only)
    result = []
    for c in chunks:
        excerpt = c["text"].strip()[:200] + "..." if len(c["text"].strip()) > 200 else c["text"].strip()
        result.append({
            "id": c["id"],
            "tipo": c["tipo"],
            "category": c["category"],
            "tags": c["tags"],
            "title": c["title"],
            "excerpt": excerpt,
            "sources": c["sources"],
            "quotes_count": len(c.get("quotes", [])),
            "grade_access": c["grade_access"],
            "vigencia": c["vigencia"],
        })

    return {
        "chunks": result,
        "categories": KB_CATEGORY_META,
        "tipos": KB_TIPOS,
        "total": len(KB_CHUNKS),
    }


@app.get("/api/kb/{chunk_id}")
async def get_knowledge_base_chunk(chunk_id: str):
    """Return a single KB chunk with full text."""
    chunk = next((c for c in KB_CHUNKS if c["id"] == chunk_id), None)
    if not chunk:
        raise HTTPException(404, f"Chunk not found: {chunk_id}")
    return chunk


@app.get("/api/kb/search")
async def search_knowledge_base(q: str):
    """Keyword search across KB chunks. Phase 1: keyword matching."""
    from rag_retriever import keyword_search
    results = keyword_search(q, max_chunks=10)
    return {"results": results, "query": q, "total": len(results)}


@app.post("/api/refresh-clipping")
async def refresh_clipping():
    """Force refresh of clipping cache from GitHub Pages."""
    count = refresh()
    return {"status": "ok", "clipping_items": count, "timestamp": datetime.now().isoformat()}


# ===== Response parser =====
def parse_llm_response(raw: str) -> dict:
    """Parse LLM response into structured format.

    The LLM should return JSON, but sometimes wraps it in markdown
    or adds extra text. We extract the JSON and validate it.
    """

    # Try to find JSON in the response
    # Case 1: pure JSON
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Case 2: JSON wrapped in markdown code block
    json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Case 3: JSON somewhere in the text (look for first { to last })
    brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    # Fallback: if LLM responded in plain text (not JSON), treat as conversational text
    return {
        "text": raw.strip(),
        "sections": [],
        "tags": ["respuesta-libre"],
    }
