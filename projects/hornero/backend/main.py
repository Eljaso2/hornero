"""Backend Hornero — Chat proxy

FastAPI minimal que recibe mensajes del chat, construye prompt sindical,
llama a LLM externo (DeepSeek o Claude), devuelve respuesta estructurada.

Enfoque híbrido: proxy rápido ahora → migrar a RAG self-hosted en Phase 2.
"""

import json
import logging
import os
import re
import subprocess
import tempfile
import time
from collections import defaultdict
from datetime import datetime

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx

from knowledge_base import get_system_prompt, get_system_prompt_rag, get_legal_prompt_focused, get_format_hint, get_greeting_hint, PERSONA_MAP, PERSONA_NAME_MAP
from llm_providers.deepseek import call_deepseek, call_deepseek_stream
from llm_providers.claude import call_claude, call_claude_stream
from clipping_cache import get_clipping, refresh
from rag_retriever import retrieve_for_query
from library_service.adapter_hornero import legal_sources_text, resolve_tenant  # puente Biblioteca (feature-flag)
from kb_data import ALL_CHUNKS, KB_CHUNKS, KB_CATEGORIES, KB_CATEGORY_META, KB_TIPOS, refresh as kb_refresh
from push_manager import subscribe as push_subscribe, unsubscribe as push_unsubscribe, notify_all, get_vapid_public_key, get_subscription_count
from auth import router as auth_router, init_auth, require_auth, HORNERO_DB_URL

load_dotenv(override=True)

# ===== Config =====
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "claude")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1/chat/completions")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_BASE_URL = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1/messages")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
DASHSCOPE_STT_URL = os.getenv("DASHSCOPE_STT_URL", "")
DASHSCOPE_STT_MODEL = os.getenv("DASHSCOPE_STT_MODEL", "")
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")  # Separate key for STT — falls back to DEEPSEEK_API_KEY
# Groq Whisper STT (OpenAI-compatible, free tier)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_STT_URL = os.getenv("GROQ_STT_URL", "https://api.groq.com/openai/v1/audio/transcriptions")
GROQ_STT_MODEL = os.getenv("GROQ_STT_MODEL", "whisper-large-v3")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "https://eljaso2.github.io")
LOCAL_ORIGIN = os.getenv("LOCAL_ORIGIN", "http://localhost:*")
# Auto-detect: if running on Render, use the public URL; otherwise localhost
_DEFAULT_BACKEND_URL = "https://hornero-ia.onrender.com" if os.getenv("RENDER") else "http://localhost:8000"
APP_BACKEND_URL = os.getenv("APP_BACKEND_URL", _DEFAULT_BACKEND_URL)

# ===== Logging =====
logger = logging.getLogger("hornero")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# ===== Rate Limiting (in-memory) =====
_rate_limit_store = defaultdict(list)  # IP → [timestamps]
RATE_LIMIT_MAX = 20  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds


def _check_rate_limit(client_ip: str) -> bool:
    """Check if the client IP is within rate limits. Returns True if allowed."""
    now = time.time()
    # Clean old timestamps
    timestamps = _rate_limit_store[client_ip]
    _rate_limit_store[client_ip] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    # Check limit
    if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_MAX:
        return False
    _rate_limit_store[client_ip].append(now)
    return True


# ===== FastAPI app =====
app = FastAPI(
    title="Hornero Chat",
    description="Backend proxy para chat IA sindical — LLM + knowledge base sindical + clipping dinámico",
    version="0.2.0",
)

# Global exception handler — ensures CORS headers on 500 errors
# Without this, unhandled exceptions return 500 without CORS headers,
# and the browser blocks the response → "CORS header missing" → NetworkError
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {type(exc).__name__}: {str(exc)}", exc_info=True)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server error: {type(exc).__name__}: {str(exc)[:200]}"},
    )

@app.on_event("startup")
async def startup_event():
    """Initialize clipping cache + KB chunks + auth on startup."""
    clip_count = refresh()
    kb_count = kb_refresh()
    init_auth()  # Auth DB (creates tables, optional nuke via HORNERO_NUKE_DATA=yes)
    _init_pg_tables()  # Sync tables (chat_messages, informes, correcciones in Postgres)

    # One-time nuclear cleanup: wipe ALL sync data (chats, informes, correcciones)
    # Triggered by HORNERO_NUKE_DATA=yes env var — set once, then remove after deploy
    if os.environ.get("HORNERO_NUKE_DATA") == "yes":
        logger.info("NUKE: wiping all sync data from Postgres...")
        try:
            with _get_pg_conn() as conn:
                conn.execute("DELETE FROM chat_messages")
                conn.execute("DELETE FROM correcciones")
                conn.execute("DELETE FROM informes")
                conn.commit()
                logger.info("NUKE: all sync data deleted from Postgres")
        except Exception as e:
            logger.error(f"NUKE: failed to delete sync data: {e}")
        # Push subscriptions too (still SQLite in push_manager)
        try:
            from push_manager import _db_path as push_db_path
            if os.path.exists(push_db_path):
                os.remove(push_db_path)
                logger.info(f"NUKE: deleted {push_db_path}")
        except Exception:
            pass

    print(f"Clipping cache initialized: {clip_count} items")
    print(f"KB chunks loaded: {kb_count} total (manual + PDF-extracted)")


# CORS — allow app origin + localhost (any port) + VSCode webview
# Using regex so VSCode embedded browser (vscode-cdn.net) and any localhost port work
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://eljaso2\.github\.io|http://localhost(:\d+)?|https://[a-z0-9-]+\.vscode-cdn\.net|vscode-webview://.*",
    allow_credentials=True,
    allow_methods=["POST", "GET", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ===== Auth router =====
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])


# ===== Helpers =====
def validated_redirect(redirect_persona: str) -> str:
    """Validate redirect_persona field from LLM response."""
    allowed = ["abogado", "companero", "periodista", "historiador", "sociologo", ""]
    if redirect_persona in allowed:
        return redirect_persona
    return ""


async def call_llm_with_retry(system_prompt: str, user_message: str, history: list,
                                formato: str = "consulta", max_retries: int = 1) -> str:
    """Call LLM with automatic retry on invalid response.

    First attempt: normal call with standard temperature.
    Retry: simplified prompt with low temperature to force valid JSON.
    """
    # Determine temperature based on formato/persona
    temperature_map = {
        'debate': 0.4,     # More natural, conversational
        'consulta': 0.2,   # More precise, factual
        'contenido': 0.5,  # More creative
        'reporte': 0.2,    # More precise
        'historia': 0.2,   # More factual
    }
    temperature = temperature_map.get(formato, 0.3)

    # Determine max_tokens based on formato
    max_tokens_map = {
        'debate': 2000,
        'consulta': 2000,
        'contenido': 3000,  # Content needs more space
        'reporte': 3000,    # Reports need more space
        'historia': 2000,
    }
    max_tokens = max_tokens_map.get(formato, 2000)

    # First attempt
    raw_response = await _call_llm(system_prompt, user_message, history,
                                    temperature=temperature, max_tokens=max_tokens)

    # Validate response
    parsed = parse_llm_response(raw_response)
    if _validate_parsed_response(parsed) and parsed.get("tags", ["respuesta-libre"])[0] != "respuesta-libre":
        return raw_response  # Valid response

    # Retry with simplified prompt
    if max_retries > 0:
        print(f"LLM response invalid (tags: {parsed.get('tags', [])}), retrying with simplified prompt...")
        retry_prompt = (
            "Respondé SOLO con JSON válido. Formato: "
            '{"text": "tu respuesta", "tags": ["tema", "formato"], "persona": "abogado"}\n\n'
            "No agregues texto fuera del JSON. No uses markdown code blocks.\n\n"
            f"Contexto: {system_prompt[:500]}...\n\n"
            f"Pregunta: {user_message}"
        )
        retry_message = f"Respondé con JSON válido a: {user_message[:200]}"
        raw_response = await _call_llm(retry_prompt, retry_message, [],
                                        temperature=0.1, max_tokens=max_tokens)

    return raw_response


async def _call_llm(system_prompt: str, user_message: str, history: list,
                     temperature: float = 0.3, max_tokens: int = 2000) -> str:
    """Call the configured LLM provider."""
    if LLM_PROVIDER == "deepseek":
        return await call_deepseek(
            api_key=DEEPSEEK_API_KEY,
            system_prompt=system_prompt,
            user_message=user_message,
            history=history,
            model=DEEPSEEK_MODEL,
            base_url=DEEPSEEK_BASE_URL,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    elif LLM_PROVIDER == "claude":
        return await call_claude(
            api_key=ANTHROPIC_API_KEY,
            system_prompt=system_prompt,
            user_message=user_message,
            history=history,
            model=ANTHROPIC_MODEL,
            base_url=ANTHROPIC_BASE_URL,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    else:
        raise HTTPException(400, f"Unknown LLM provider: {LLM_PROVIDER}")

# ===== Request/Response models =====
class GreetingRequest(BaseModel):
    section: str = "consulta"  # consulta|contenido|debate|historia
    grade: str = "A"
    sector: str = "aceitero"
    tenant: str = ""  # explicit tenant override; if empty, derived from sector
    requested_persona: str = ""  # companero|abogado|periodista|historiador — override
    session_id: str = ""  # Frontend session ID for correlation
    days_since_last_chat: int = 999  # Days since last chat session — affects greeting tone
    incoming_reports: list = []  # Reports from lower grades (for G2+ users)
    incoming_reports_count: int = 0  # Count of incoming reports (for greeting hint)
    recipient_chain: str = ""  # Chain of recipients for the Ficha section


class GreetingResponse(BaseModel):
    text: str = ""
    sections: list = []
    tags: list
    time: str
    raw: str = ""
    persona: str = "abogado"
    redirect_persona: str = ""  # Derivation: persona to redirect to (empty = no redirect)
    image: str = ""  # Image URL for CHARLA mode
    source_url: str = ""  # Source URL for the image


class ChatRequest(BaseModel):
    message: str
    formato: str = "consulta"  # podcast|reel|columna|entrevista|consulta|contenido|debate|historia
    history: list = []  # [{role, text, sections}]
    grade: str = "A"
    sector: str = "aceitero"
    tenant: str = ""  # gremio (multi-tenant). Vacío → se deriva de `sector`. Ver adapter_hornero.
    requested_persona: str = ""  # companero|abogado|periodista|historiador — override
    session_id: str = ""  # Frontend session ID for correlation
    incoming_reports: list = []  # Reports from lower grades (for G2+ users)
    recipient_chain: str = ""  # Chain of recipients for the Ficha section (e.g. "Delegada → Secretaria → Federación")


class ChatResponse(BaseModel):
    text: str = ""
    sections: list = []
    tags: list
    time: str
    raw: str = ""  # Raw LLM response for debugging
    persona: str = "abogado"  # Who responded: companero|abogado|periodista|historiador
    redirect_persona: str = ""  # Derivation: persona to redirect to (empty = no redirect)
    image: str = ""  # Image URL for CHARLA mode (from FUENTES or clipping)
    source_url: str = ""  # Source URL for the image


class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict  # { auth: str, p256dh: str }


class PushUnsubscribeRequest(BaseModel):
    endpoint: str


class PushNotifyRequest(BaseModel):
    title: str = "📰 Nuevo clipping disponible"
    body: str = ""
    numero: int = 0
    fecha: str = ""


# ===== Endpoints =====
@app.get("/api/config")
async def get_config():
    """Return backend config for the app to know where to connect."""
    return {"backendUrl": APP_BACKEND_URL, "provider": LLM_PROVIDER}


@app.get("/api/config/llm")
async def get_llm_config():
    """Diagnostic: return LLM config without exposing full API keys."""
    def mask_key(k):
        if not k:
            return "(empty)"
        k = k.strip()
        if len(k) <= 8:
            return "(too short)"
        return k[:6] + "..." + k[-4:]
    return {
        "LLM_PROVIDER": LLM_PROVIDER,
        "ANTHROPIC_API_KEY": mask_key(ANTHROPIC_API_KEY),
        "ANTHROPIC_BASE_URL": ANTHROPIC_BASE_URL,
        "ANTHROPIC_MODEL": ANTHROPIC_MODEL,
        "DEEPSEEK_API_KEY": mask_key(DEEPSEEK_API_KEY),
        "DEEPSEEK_BASE_URL": DEEPSEEK_BASE_URL,
        "DEEPSEEK_MODEL": DEEPSEEK_MODEL,
        "APP_BACKEND_URL": APP_BACKEND_URL,
    }


@app.post("/api/greeting")
async def greeting_endpoint(req: GreetingRequest, user: dict = Depends(require_auth)) -> GreetingResponse:
    """Generate the IA's opening message when user enters a chat section.

    The IA greets, explains what it is, and tells what the user can consult
    in that specific section.

    RAG: greeting uses minimal context (no KB chunks needed — persona knows who it is).
    """
    # Override grade/sector/tenant from JWT (prevent spoofing)
    req.grade = user.get("grade", req.grade)
    req.sector = user.get("sector", req.sector)
    req.tenant = user.get("tenant", req.tenant) or req.tenant
    # Greeting: no RAG retrieval needed (persona + principles are sufficient)
    # Use requested_persona if provided, otherwise section-based default
    if req.requested_persona and req.requested_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"]:
        effective_persona = req.requested_persona
    elif req.requested_persona and req.requested_persona in PERSONA_MAP:
        effective_persona = PERSONA_MAP.get(req.requested_persona, 'abogado')
    else:
        effective_persona = PERSONA_MAP.get(req.section, 'abogado')
    # Greeting: inject efeméride chunks for Historiador so they have real data to cite
    greeting_chunk_ids = []
    tenant = resolve_tenant(req.tenant if hasattr(req, 'tenant') else "", req.sector)
    if effective_persona == 'historiador' or req.section == 'historia':
        from rag_retriever import keyword_search
        efem_results = keyword_search('efemeride aniversario conmemoracion', max_chunks=8, tenant=tenant)
        greeting_chunk_ids = [c['id'] for c in efem_results if 'efemeride' in c.get('tags', [])]
    system_prompt = get_system_prompt_rag(req.section, chunk_ids=greeting_chunk_ids, clipping_items=get_clipping(), requested_persona=req.requested_persona, grade=req.grade, incoming_reports=req.incoming_reports, recipient_chain=req.recipient_chain, tenant=tenant)
    # Resolve effective section for greeting hint (requested_persona may override)
    greeting_section = req.section
    if req.requested_persona and req.requested_persona in PERSONA_NAME_MAP:
        greeting_section = PERSONA_NAME_MAP[req.requested_persona]
    greeting_hint = get_greeting_hint(greeting_section, req.grade, req.days_since_last_chat, req.incoming_reports_count)

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
    final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"] else effective_persona

    return GreetingResponse(
        text=parsed.get("text", ""),
        sections=parsed.get("sections", []),
        tags=parsed.get("tags", [req.section, "greeting"]),
        time=time_str,
        raw=raw_response,
        persona=final_persona,
        redirect_persona=validated_redirect(parsed.get("redirect_persona", "")),
        image=parsed.get("image", ""),
        source_url=parsed.get("source_url", ""),
    )


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, request: Request = None, user: dict = Depends(require_auth)) -> ChatResponse:
    """Main chat endpoint — receives user message, returns structured IA response.

    RAG: retrieves relevant KB chunks based on user query, injects only
    those chunks into the system prompt instead of the full KNOWLEDGE_BASE.
    """
    start_time = time.time()

    # SANITIZE history (same as stream endpoint)
    for i, msg in enumerate(req.history):
        if not isinstance(msg, dict):
            req.history[i] = {"role": "user", "text": ""}
            continue
        sections = msg.get("sections")
        if sections is not None and not isinstance(sections, list):
            msg["sections"] = []
        tags = msg.get("tags")
        if tags is not None and not isinstance(tags, list):
            msg["tags"] = []

    # Override grade/sector/tenant from JWT (prevent spoofing)
    req.grade = user.get("grade", req.grade)
    req.sector = user.get("sector", req.sector)
    req.tenant = user.get("tenant", req.tenant) or req.tenant

    # Rate limiting
    client_ip = request.client.host if request else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(429, "Demasiadas solicitudes. Esperá un momento e intentá de nuevo.")

    # RAG retrieval: find relevant chunks based on user query + conversation context
    tenant = resolve_tenant(req.tenant, req.sector)
    relevant_chunks = retrieve_for_query(req.message, req.formato, req.grade,
                                          conversation_history=req.history, tenant=tenant)
    chunk_ids = [c["id"] for c in relevant_chunks]

    # Biblioteca Hornero: ley/convenio real para el Abogado (vacío si el flag está off)
    extra_sources = legal_sources_text(req.message, formato=req.formato,
                                       requested_persona=req.requested_persona,
                                       grade=req.grade, tenant=req.tenant, sector=req.sector,
                                       conversation_history=req.history)

    # Build system prompt with ONLY relevant KB chunks
    # Determine effective persona from requested_persona override or formato
    system_prompt = get_system_prompt_rag(
        formato=req.formato,
        chunk_ids=chunk_ids,
        clipping_items=get_clipping(),
        query=req.message,
        requested_persona=req.requested_persona,
        grade=req.grade,
        incoming_reports=req.incoming_reports,
        recipient_chain=req.recipient_chain,
        extra_sources_text=extra_sources,
        tenant=tenant,
    )
    # Abogado con ley/convenio de la Biblioteca → prompt ENFOCADO (grounding fiable, ver knowledge_base)
    if extra_sources:
        system_prompt = get_legal_prompt_focused(extra_sources, grade=req.grade,
                                                 recipient_chain=req.recipient_chain,
                                                 tenant=tenant)
    # Determine effective persona string for fallback
    effective_persona = PERSONA_MAP.get(req.formato, 'abogado')
    if req.requested_persona:
        if req.requested_persona in PERSONA_NAME_MAP:
            effective_persona = req.requested_persona
        elif req.requested_persona in PERSONA_MAP:
            effective_persona = req.requested_persona
    format_hint = get_format_hint(req.formato, req.grade)

    # Build the user message with format context
    full_message = f"{format_hint}\n\nPregunta del trabajador: {req.message}"

    # Call LLM with retry on invalid response
    try:
        raw_response = await call_llm_with_retry(
            system_prompt=system_prompt,
            user_message=full_message,
            history=req.history,
            formato=req.formato,
        )
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
    final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"] else effective_persona

    # Log structured chat interaction
    elapsed = round(time.time() - start_time, 2)
    logger.info(f"CHAT session={req.session_id[:8]}... formato={req.formato} "
                f"persona={final_persona} chunks={len(chunk_ids)} "
                f"tags={parsed.get('tags', [])} latency={elapsed}s "
                f"ip={client_ip}")

    return ChatResponse(
        text=parsed.get("text", ""),
        sections=parsed.get("sections", []),
        tags=parsed.get("tags", [req.formato]),
        time=time_str,
        raw=raw_response,
        persona=final_persona,
        redirect_persona=validated_redirect(parsed.get("redirect_persona", "")),
        image=parsed.get("image", ""),
        source_url=parsed.get("source_url", ""),
    )


@app.post("/api/chat/stream")
async def chat_stream_endpoint(req: ChatRequest, request: Request = None, user: dict = Depends(require_auth)):
    """Streaming chat endpoint — returns SSE events with tokens as they arrive.

    Events emitted:
      - event: token\ndata: {content}\n\n  — each token chunk
      - event: done\ndata: {text, sections, tags, time, persona, redirect_persona}\n\n  — final parsed response
      - event: error\ndata: {message}\n\n  — if something fails

    Falls back to non-streaming if the LLM provider doesn't support streaming.
    """
    origin = request.headers.get("origin", "no-origin") if request else "no-request"
    logger.info(f"SSE /api/chat/stream: user={user.get('username','?')} grade={user.get('grade','?')} formato={req.formato} origin={origin} history_len={len(req.history)}")

    # SANITIZE history: fix corrupt data (sections/tags as string/null → empty list)
    for i, msg in enumerate(req.history):
        if not isinstance(msg, dict):
            logger.warning(f"SSE: history[{i}] is not dict (type={type(msg).__name__}), replacing with empty")
            req.history[i] = {"role": "user", "text": ""}
            continue
        sections = msg.get("sections")
        if sections is not None and not isinstance(sections, list):
            logger.warning(f"SSE: history[{i}].sections is {type(sections).__name__}='{str(sections)[:50]}', replacing with []")
            msg["sections"] = []
        tags = msg.get("tags")
        if tags is not None and not isinstance(tags, list):
            logger.warning(f"SSE: history[{i}].tags is {type(tags).__name__}='{str(tags)[:50]}', replacing with []")
            msg["tags"] = []
        # Also fix nested sections entries
        if isinstance(sections, list):
            for j, sec in enumerate(sections):
                if not isinstance(sec, dict):
                    logger.warning(f"SSE: history[{i}].sections[{j}] is {type(sec).__name__}, removing")
                    msg["sections"][j] = {"title": "", "body": str(sec)[:200]}
    # Override grade/sector/tenant from JWT (prevent spoofing)
    req.grade = user.get("grade", req.grade)
    req.sector = user.get("sector", req.sector)
    req.tenant = user.get("tenant", req.tenant) or req.tenant

    # Rate limiting
    client_ip = request.client.host if request else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(429, "Demasiadas solicitudes. Esperá un momento e intentá de nuevo.")

    # RAG retrieval: find relevant KB chunks based on user query
    tenant = resolve_tenant(req.tenant, req.sector)
    relevant_chunks = retrieve_for_query(req.message, req.formato, req.grade,
                                          conversation_history=req.history, tenant=tenant)
    chunk_ids = [c["id"] for c in relevant_chunks]

    # Biblioteca Hornero: ley/convenio real para el Abogado (vacío si el flag está off)
    extra_sources = legal_sources_text(req.message, formato=req.formato,
                                       requested_persona=req.requested_persona,
                                       grade=req.grade, tenant=req.tenant, sector=req.sector,
                                       conversation_history=req.history)

    # Build system prompt with ONLY relevant KB chunks
    system_prompt = get_system_prompt_rag(
        formato=req.formato,
        chunk_ids=chunk_ids,
        clipping_items=get_clipping(),
        query=req.message,
        requested_persona=req.requested_persona,
        grade=req.grade,
        incoming_reports=req.incoming_reports,
        recipient_chain=req.recipient_chain,
        extra_sources_text=extra_sources,
        tenant=tenant,
    )
    # Abogado con ley/convenio de la Biblioteca → prompt ENFOCADO (grounding fiable)
    if extra_sources:
        system_prompt = get_legal_prompt_focused(extra_sources, grade=req.grade,
                                                 recipient_chain=req.recipient_chain,
                                                 tenant=tenant)
    effective_persona = PERSONA_MAP.get(req.formato, 'abogado')
    if req.requested_persona:
        if req.requested_persona in PERSONA_NAME_MAP:
            effective_persona = req.requested_persona
        elif req.requested_persona in PERSONA_MAP:
            effective_persona = req.requested_persona
    format_hint = get_format_hint(req.formato, req.grade)

    # Build the user message with format context
    full_message = f"{format_hint}\n\nPregunta del trabajador: {req.message}"

    async def _raw_events():
        """Produce SSE events from the LLM (streaming or non-streaming)."""
        try:
            logger.info(f"SSE _raw_events: LLM_PROVIDER={LLM_PROVIDER}, starting LLM call...")
            if LLM_PROVIDER == "deepseek":
                async for chunk in call_deepseek_stream(
                    api_key=DEEPSEEK_API_KEY,
                    system_prompt=system_prompt,
                    user_message=full_message,
                    history=req.history,
                    model=DEEPSEEK_MODEL,
                    base_url=DEEPSEEK_BASE_URL,
                ):
                    if chunk["type"] == "token":
                        content = chunk["content"].replace("\n", "\\n")
                        yield f"event: token\ndata: {content}\n\n"
                    elif chunk["type"] == "done":
                        full_text = chunk["full_text"]
                        parsed = parse_llm_response(full_text)
                        now = datetime.now()
                        time_str = now.strftime("%H:%M")
                        llm_persona = parsed.get("persona", "")
                        final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"] else effective_persona
                        result = {
                            "text": parsed.get("text", ""),
                            "sections": parsed.get("sections", []),
                            "tags": parsed.get("tags", [req.formato]),
                            "time": time_str,
                            "persona": final_persona,
                            "redirect_persona": validated_redirect(parsed.get("redirect_persona", "")),
                            "image": parsed.get("image", ""),
                            "source_url": parsed.get("source_url", ""),
                        }
                        yield f"event: done\ndata: {json.dumps(result, ensure_ascii=False)}\n\n"
            else:
                # Claude/other provider: no streaming support — fall back to non-streaming
                # wrapped in SSE format for consistent frontend handling
                if LLM_PROVIDER == "claude":
                    logger.info(f"SSE _raw_events: calling call_claude() (model={ANTHROPIC_MODEL})...")
                    raw_response = await call_claude(
                        api_key=ANTHROPIC_API_KEY,
                        system_prompt=system_prompt,
                        user_message=full_message,
                        history=req.history,
                        model=ANTHROPIC_MODEL,
                        base_url=ANTHROPIC_BASE_URL,
                    )
                    logger.info(f"SSE _raw_events: call_claude() returned {len(raw_response)} chars")
                else:
                    raise HTTPException(400, f"Unknown LLM provider: {LLM_PROVIDER}")

                parsed = parse_llm_response(raw_response)
                logger.info(f"SSE _raw_events: parsed tags={parsed.get('tags', [])}, persona={parsed.get('persona', '')}")
                now = datetime.now()
                time_str = now.strftime("%H:%M")
                llm_persona = parsed.get("persona", "")
                final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"] else effective_persona
                text_content = parsed.get("text", "")
                if text_content:
                    content = text_content.replace("\n", "\\n")
                    yield f"event: token\ndata: {content}\n\n"
                result = {
                    "text": parsed.get("text", ""),
                    "sections": parsed.get("sections", []),
                    "tags": parsed.get("tags", [req.formato]),
                    "time": time_str,
                    "persona": final_persona,
                    "redirect_persona": validated_redirect(parsed.get("redirect_persona", "")),
                    "image": parsed.get("image", ""),
                    "source_url": parsed.get("source_url", ""),
                }
                yield f"event: done\ndata: {json.dumps(result, ensure_ascii=False)}\n\n"

        except httpx.HTTPStatusError as e:
            error_msg = f"LLM HTTP error {e.response.status_code}"
            yield f"event: error\ndata: {json.dumps({'message': error_msg})}\n\n"
        except Exception as e:
            error_msg = f"LLM call failed: {type(e).__name__}: {str(e)}"
            yield f"event: error\ndata: {json.dumps({'message': error_msg})}\n\n"

    async def event_generator():
        # Yield SSE comment immediately so FastAPI sends response headers + CORS.
        # Without this, the browser gets NO response until the LLM starts producing tokens,
        # which can take 5-30s → Cloudflare/Render proxy timeout → NetworkError.
        yield ": connected\n\n"

        # Direct streaming path — yield SSE events inline from the LLM.
        # NOTE: The queue/producer pattern was causing events to never reach the client
        # on Render (Cloudflare buffering). Direct yield works reliably.
        try:
            if LLM_PROVIDER == "claude":
                async for chunk in call_claude_stream(
                    api_key=ANTHROPIC_API_KEY,
                    system_prompt=system_prompt,
                    user_message=full_message,
                    history=req.history,
                    model=ANTHROPIC_MODEL,
                    base_url=ANTHROPIC_BASE_URL,
                ):
                    if chunk["type"] == "token":
                        content = chunk["content"].replace("\n", "\\n")
                        yield f"event: token\ndata: {content}\n\n"
                    elif chunk["type"] == "done":
                        full_text = chunk["full_text"]
                        parsed = parse_llm_response(full_text)
                        now = datetime.now()
                        time_str = now.strftime("%H:%M")
                        llm_persona = parsed.get("persona", "")
                        final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"] else effective_persona
                        result = {
                            "text": parsed.get("text", ""),
                            "sections": parsed.get("sections", []),
                            "tags": parsed.get("tags", [req.formato]),
                            "time": time_str,
                            "persona": final_persona,
                            "redirect_persona": validated_redirect(parsed.get("redirect_persona", "")),
                            "image": parsed.get("image", ""),
                            "source_url": parsed.get("source_url", ""),
                        }
                        yield f"event: done\ndata: {json.dumps(result, ensure_ascii=False)}\n\n"
            elif LLM_PROVIDER == "deepseek":
                async for chunk in call_deepseek_stream(
                    api_key=DEEPSEEK_API_KEY,
                    system_prompt=system_prompt,
                    user_message=full_message,
                    history=req.history,
                    model=DEEPSEEK_MODEL,
                    base_url=DEEPSEEK_BASE_URL,
                ):
                    if chunk["type"] == "token":
                        content = chunk["content"].replace("\n", "\\n")
                        yield f"event: token\ndata: {content}\n\n"
                    elif chunk["type"] == "done":
                        full_text = chunk["full_text"]
                        parsed = parse_llm_response(full_text)
                        now = datetime.now()
                        time_str = now.strftime("%H:%M")
                        llm_persona = parsed.get("persona", "")
                        final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"] else effective_persona
                        result = {
                            "text": parsed.get("text", ""),
                            "sections": parsed.get("sections", []),
                            "tags": parsed.get("tags", [req.formato]),
                            "time": time_str,
                            "persona": final_persona,
                            "redirect_persona": validated_redirect(parsed.get("redirect_persona", "")),
                            "image": parsed.get("image", ""),
                            "source_url": parsed.get("source_url", ""),
                        }
                        yield f"event: done\ndata: {json.dumps(result, ensure_ascii=False)}\n\n"
            else:
                yield f"event: error\ndata: {json.dumps({'message': f'Unknown LLM provider: {LLM_PROVIDER}'})}\n\n"

        except httpx.HTTPStatusError as e:
            error_msg = f"LLM HTTP error {e.response.status_code}"
            logger.error(f"SSE: {error_msg}")
            yield f"event: error\ndata: {json.dumps({'message': error_msg})}\n\n"
        except Exception as e:
            error_msg = f"LLM call failed: {type(e).__name__}: {str(e)}"
            logger.error(f"SSE: {error_msg}")
            yield f"event: error\ndata: {json.dumps({'message': error_msg})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )



@app.post("/api/audio")
async def audio_chat_endpoint(
    user: dict = Depends(require_auth),
    audio: UploadFile = File(...),
    formato: str = Form("consulta"),
    grade: str = Form("A"),
    sector: str = Form("aceitero"),
    tenant: str = Form(""),
    requested_persona: str = Form(""),
    session_id: str = Form(""),
    history: str = Form("[]"),
) -> ChatResponse:
    """Audio chat endpoint — receives audio, transcribes with Paraformer-v2, then calls LLM.

    Flow: audio blob → DashScope STT → transcribed text → RAG + LLM → ChatResponse
    Uses the same DEEPSEEK_API_KEY for STT (DashScope unified auth).
    """
    # Override grade/sector/tenant from JWT (prevent spoofing)
    grade = user.get("grade", grade)
    sector = user.get("sector", sector)
    tenant = user.get("tenant", tenant) or tenant

    # 1. Transcribe audio
    audio_bytes = await audio.read()
    filename = audio.filename or "recording.webm"

    transcript = await transcribe_audio(audio_bytes, filename)
    if not transcript or not transcript.strip():
        raise HTTPException(422, "No se pudo transcribir el audio — intentá de nuevo o escribí tu mensaje")

    # 2. Parse history from form string
    try:
        parsed_history = json.loads(history)
    except json.JSONDecodeError:
        parsed_history = []

    # 3. RAG retrieval with transcript as query
    audio_tenant = resolve_tenant(tenant, sector)
    relevant_chunks = retrieve_for_query(transcript, formato, grade, tenant=audio_tenant)
    chunk_ids = [c["id"] for c in relevant_chunks]

    # Biblioteca Hornero: ley/convenio real para el Abogado (vacío si el flag está off)
    extra_sources = legal_sources_text(transcript, formato=formato,
                                       requested_persona=requested_persona,
                                       grade=grade, tenant=tenant, sector=sector,
                                       conversation_history=parsed_history)

    # 4. Build system prompt + format hint
    system_prompt = get_system_prompt_rag(
        formato=formato,
        chunk_ids=chunk_ids,
        clipping_items=get_clipping(),
        query=transcript,
        requested_persona=requested_persona,
        grade=grade,
        recipient_chain="",
        extra_sources_text=extra_sources,
        tenant=audio_tenant,
    )
    # Abogado con ley/convenio de la Biblioteca → prompt ENFOCADO (grounding fiable)
    if extra_sources:
        system_prompt = get_legal_prompt_focused(extra_sources, grade=grade,
                                                 tenant=audio_tenant)
    effective_persona = PERSONA_MAP.get(formato, 'abogado')
    if requested_persona:
        if requested_persona in PERSONA_NAME_MAP:
            effective_persona = requested_persona
        elif requested_persona in PERSONA_MAP:
            effective_persona = requested_persona
    format_hint = get_format_hint(formato, grade)

    full_message = f"{format_hint}\n\nTRANSCRIPCIÓN LITERAL DEL AUDIO DEL TRABAJADOR (conservar palabra por palabra en sección 3 Transcript del informe):\n{transcript}"

    # 5. Call LLM with transcribed text
    try:
        if LLM_PROVIDER == "deepseek":
            raw_response = await call_deepseek(
                api_key=DEEPSEEK_API_KEY,
                system_prompt=system_prompt,
                user_message=full_message,
                history=parsed_history,
                model=DEEPSEEK_MODEL,
                base_url=DEEPSEEK_BASE_URL,
            )
        elif LLM_PROVIDER == "claude":
            raw_response = await call_claude(
                api_key=ANTHROPIC_API_KEY,
                system_prompt=system_prompt,
                user_message=full_message,
                history=parsed_history,
                model=ANTHROPIC_MODEL,
                base_url=ANTHROPIC_BASE_URL,
            )
        else:
            raise HTTPException(400, f"Unknown LLM provider: {LLM_PROVIDER}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(500, f"LLM HTTP error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(500, f"LLM call failed: {type(e).__name__}: {str(e)}")

    # 6. Parse response
    parsed = parse_llm_response(raw_response)
    now = datetime.now()
    time_str = now.strftime("%H:%M")

    llm_persona = parsed.get("persona", "")
    final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"] else effective_persona

    return ChatResponse(
        text=parsed.get("text", ""),
        sections=parsed.get("sections", []),
        tags=parsed.get("tags", [formato, "audio"]),
        time=time_str,
        raw=raw_response,
        persona=final_persona,
        redirect_persona=validated_redirect(parsed.get("redirect_persona", "")),
        image=parsed.get("image", ""),
        source_url=parsed.get("source_url", ""),
    )


async def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio using Groq Whisper (OpenAI-compatible) or DashScope fallback.

    Primary: Groq Whisper API (free, fast, OpenAI-compatible)
    Fallback: DashScope Paraformer-v2 (if DASHSCOPE_API_KEY is set)

    Returns transcribed text string. Empty string on failure.
    """
    # Determine original format
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"

    # Convert unsupported formats to WAV via ffmpeg
    final_bytes = audio_bytes
    final_ext = ext

    unsupported_formats = ("webm", "mp4", "avi", "flv", "mkv", "mov", "wmv", "wma")
    if ext in unsupported_formats:
        try:
            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp_in:
                tmp_in.write(audio_bytes)
                tmp_in_path = tmp_in.name

            tmp_out_path = tmp_in_path.rsplit(".", 1)[0] + ".wav"

            result = subprocess.run(
                ["ffmpeg", "-i", tmp_in_path, "-ar", "16000", "-ac", "1", "-f", "wav", "-y", tmp_out_path],
                capture_output=True, timeout=15,
            )
            if result.returncode == 0 and os.path.exists(tmp_out_path):
                with open(tmp_out_path, "rb") as f:
                    final_bytes = f.read()
                final_ext = "wav"
                print(f"Audio converted: {filename} ({len(audio_bytes)} bytes) → WAV ({len(final_bytes)} bytes)")
            else:
                stderr = result.stderr.decode()[:300] if result.stderr else ""
                print(f"ffmpeg conversion failed (exit {result.returncode}): {stderr}")
                return ""

            # Cleanup temp files
            try: os.unlink(tmp_in_path)
            except: pass
            try: os.unlink(tmp_out_path)
            except: pass
        except Exception as e:
            print(f"ffmpeg error: {type(e).__name__}: {str(e)}")
            return ""

    # Try Groq Whisper first
    if GROQ_API_KEY:
        try:
            files = {
                "file": (f"recording.{final_ext}", final_bytes, f"audio/{final_ext}"),
            }
            data = {
                "model": GROQ_STT_MODEL,
                "response_format": "json",
                "language": "es",
            }
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(GROQ_STT_URL, headers=headers, files=files, data=data)
                print(f"Groq STT response status: {response.status_code}")
                print(f"Groq STT response body: {response.text[:500]}")

                response.raise_for_status()
                result = response.json()
                text = result.get("text", "")

                if text:
                    print(f"Groq STT transcript: '{text[:100]}...' (from {filename} as {final_ext})")
                    return text
                else:
                    print(f"Groq STT returned empty transcript")
        except httpx.HTTPStatusError as e:
            error_body = e.response.text[:500] if e.response else ""
            print(f"Groq STT error: HTTP {e.response.status_code}: {error_body}")
        except Exception as e:
            print(f"Groq STT error: {type(e).__name__}: {str(e)}")

    # Fallback: DashScope native API (if DASHSCOPE_API_KEY is set)
    stt_api_key = DASHSCOPE_API_KEY or DEEPSEEK_API_KEY
    if stt_api_key and DASHSCOPE_STT_URL:
        import base64
        try:
            content_type_map = {
                "wav": "audio/wav", "mp3": "audio/mpeg", "ogg": "audio/ogg",
                "flac": "audio/flac", "aac": "audio/aac", "amr": "audio/amr", "pcm": "audio/pcm",
            }
            audio_mime = content_type_map.get(final_ext, "audio/wav")
            audio_b64 = base64.b64encode(final_bytes).decode("utf-8")
            audio_data_uri = f"data:{audio_mime};base64,{audio_b64}"

            request_body = {
                "model": DASHSCOPE_STT_MODEL,
                "input": {"audio": audio_data_uri},
                "parameters": {"format": final_ext, "sample_rate": 16000},
            }
            headers = {
                "Authorization": f"Bearer {stt_api_key}",
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(DASHSCOPE_STT_URL, headers=headers, json=request_body)
                print(f"DashScope STT response status: {response.status_code}")

                response.raise_for_status()
                result = response.json()
                output = result.get("output", {})
                text = output.get("text", "") or result.get("text", "")

                if text:
                    print(f"DashScope STT transcript: '{text[:100]}...'")
                    return text
        except Exception as e:
            print(f"DashScope STT error: {type(e).__name__}: {str(e)}")

    print(f"STT failed: no provider returned a transcript")
    return ""


@app.get("/api/health")
async def health():
    """Health check endpoint — includes audio diagnostics."""
    # Check ffmpeg availability
    ffmpeg_ok = False
    ffmpeg_version = ""
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=5)
        ffmpeg_ok = result.returncode == 0
        ffmpeg_version = result.stdout.decode()[:80].strip() if result.stdout else ""
    except Exception as e:
        ffmpeg_version = f"error: {type(e).__name__}"

    return {
        "status": "ok",
        "provider": LLM_PROVIDER,
        "clipping_items": len(get_clipping()),
        "kb_chunks": len(ALL_CHUNKS),
        "rag": "keyword",
        "audio": {
            "ffmpeg": ffmpeg_ok,
            "ffmpeg_version": ffmpeg_version,
            "groq_key": bool(GROQ_API_KEY),
            "groq_model": GROQ_STT_MODEL,
            "dashscope_key": bool(DASHSCOPE_API_KEY or DEEPSEEK_API_KEY),
            "dashscope_model": DASHSCOPE_STT_MODEL,
        },
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/test/llm")
async def test_llm():
    """Diagnostic: call the LLM directly and return result or error. No auth required."""
    import time as _time
    t0 = _time.time()
    try:
        if LLM_PROVIDER == "deepseek":
            raw_response = await call_deepseek(
                api_key=DEEPSEEK_API_KEY,
                system_prompt="Respondé con un solo palabra: HOLA",
                user_message="Decí hola",
                history=[],
                model=DEEPSEEK_MODEL,
                base_url=DEEPSEEK_BASE_URL,
            )
        elif LLM_PROVIDER == "claude":
            raw_response = await call_claude(
                api_key=ANTHROPIC_API_KEY,
                system_prompt="Respondé con una sola palabra: HOLA",
                user_message="Decí hola",
                history=[],
                model=ANTHROPIC_MODEL,
                base_url=ANTHROPIC_BASE_URL,
            )
        else:
            return {"error": f"Unknown LLM_PROVIDER: {LLM_PROVIDER}"}
        elapsed = round(_time.time() - t0, 2)
        return {"ok": True, "provider": LLM_PROVIDER,
                "model": ANTHROPIC_MODEL if LLM_PROVIDER == "claude" else DEEPSEEK_MODEL,
                "base_url": ANTHROPIC_BASE_URL if LLM_PROVIDER == "claude" else DEEPSEEK_BASE_URL,
                "api_key_set": bool(ANTHROPIC_API_KEY if LLM_PROVIDER == "claude" else DEEPSEEK_API_KEY),
                "api_key_prefix": (ANTHROPIC_API_KEY[:12] + "...") if (LLM_PROVIDER == "claude" and ANTHROPIC_API_KEY) else (DEEPSEEK_API_KEY[:8] + "..." if DEEPSEEK_API_KEY else "NONE"),
                "response_length": len(raw_response), "response_preview": raw_response[:200],
                "elapsed_s": elapsed}
    except Exception as e:
        elapsed = round(_time.time() - t0, 2)
        return {"ok": False, "provider": LLM_PROVIDER,
                "model": ANTHROPIC_MODEL if LLM_PROVIDER == "claude" else DEEPSEEK_MODEL,
                "base_url": ANTHROPIC_BASE_URL if LLM_PROVIDER == "claude" else DEEPSEEK_BASE_URL,
                "api_key_set": bool(ANTHROPIC_API_KEY if LLM_PROVIDER == "claude" else DEEPSEEK_API_KEY),
                "api_key_prefix": (ANTHROPIC_API_KEY[:12] + "...") if (LLM_PROVIDER == "claude" and ANTHROPIC_API_KEY) else (DEEPSEEK_API_KEY[:8] + "..." if DEEPSEEK_API_KEY else "NONE"),
                "error_type": type(e).__name__, "error": str(e),
                "elapsed_s": elapsed}
@app.get("/api/test/stream")
async def test_stream():
    """Diagnostic SSE stream — no auth required. Tests SSE through Cloudflare/Render proxy."""
    import asyncio as _asyncio
    async def gen():
        yield ": connected\n\n"
        for i in range(1, 6):
            await _asyncio.sleep(1)
            yield f"event: token\ndata: Chunk {i}\n\n"
        yield f'event: done\ndata: {{"ok":true}}\n\n'
    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/test/stream-post")
async def test_stream_post():
    """Diagnostic POST SSE stream — no auth. Tests POST+SSE+CORS (same as /api/chat/stream but no auth)."""
    import asyncio as _asyncio
    async def gen():
        yield ": connected\n\n"
        yield f"event: token\ndata: POST OK\n\n"
        for i in range(1, 4):
            await _asyncio.sleep(1)
            yield f"event: token\ndata: Chunk {i}\n\n"
        yield f'event: done\ndata: {{"ok":true,"method":"POST"}}\n\n'
    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )




@app.get("/api/kb")
async def get_knowledge_base(category: str = None, tipo: str = None):
    """Return knowledge base chunks for Archivo UI. Filterable by category and tipo.

    Uses ALL_CHUNKS (manual + PDF-extracted) for full coverage.
    """
    chunks = ALL_CHUNKS
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
            **({"pdf_url": c["pdf_url"]} if "pdf_url" in c else {}),
        })

    return {
        "chunks": result,
        "categories": KB_CATEGORY_META,
        "tipos": KB_TIPOS,
        "total": len(KB_CHUNKS),
    }


@app.get("/api/kb/search")
async def search_knowledge_base(q: str):
    """Keyword search across KB chunks. Phase 1: keyword matching."""
    from rag_retriever import keyword_search
    results = keyword_search(q, max_chunks=10)
    return {"results": results, "query": q, "total": len(results)}


@app.get("/api/kb/{chunk_id}")
async def get_knowledge_base_chunk(chunk_id: str):
    """Return a single KB chunk with full text."""
    chunk = next((c for c in KB_CHUNKS if c["id"] == chunk_id), None)
    if not chunk:
        raise HTTPException(404, f"Chunk not found: {chunk_id}")
    return chunk


@app.post("/api/refresh-clipping")
async def refresh_clipping(user: dict = Depends(require_auth)):
    """Force refresh of clipping cache from GitHub Pages. Requires auth."""
    count = refresh()
    return {"status": "ok", "clipping_items": count, "timestamp": datetime.now().isoformat()}


# ===== Feedback endpoint =====
class FeedbackRequest(BaseModel):
    session_id: str = ""
    message_index: int = -1
    rating: str = ""  # "like" or "dislike"
    comment: str = ""
    persona: str = ""
    message_text: str = ""  # First 200 chars for context (no PII)


@app.post("/api/feedback")
async def feedback_endpoint(req: FeedbackRequest, user: dict = Depends(require_auth)):
    """Receive and log user feedback on chat responses.

    Feedback is logged to stdout for analysis. Future: persist to SQLite.
    """
    if req.rating not in ("like", "dislike"):
        raise HTTPException(400, "Rating must be 'like' or 'dislike'")

    # Log feedback for analysis
    print(f"FEEDBACK: session={req.session_id} index={req.message_index} "
          f"rating={req.rating} persona={req.persona} "
          f"text_preview={req.message_text[:100]}... "
          f"comment={req.comment}")

    return {"status": "ok", "message": "Feedback registrado"}


# ===== Push Notification endpoints =====
@app.get("/api/push/vapid-key")
async def get_push_vapid_key():
    """Return VAPID public key for frontend subscription."""
    return {"publicKey": get_vapid_public_key()}


@app.post("/api/push/subscribe")
async def push_subscribe_endpoint(req: PushSubscriptionRequest, user: dict = Depends(require_auth)):
    """Register a push subscription from a user device."""
    subscription = {
        "endpoint": req.endpoint,
        "keys": req.keys,
    }
    success = push_subscribe(subscription)
    if success:
        return {"status": "ok", "message": "Suscripción registrada"}
    raise HTTPException(400, "Datos de suscripción inválidos")


@app.post("/api/push/unsubscribe")
async def push_unsubscribe_endpoint(req: PushUnsubscribeRequest, user: dict = Depends(require_auth)):
    """Remove a push subscription (user turned off notifications)."""
    success = push_unsubscribe(req.endpoint)
    if success:
        return {"status": "ok", "message": "Suscripción eliminada"}
    raise HTTPException(400, "Endpoint inválido")


@app.post("/api/push/notify")
async def push_notify_endpoint(req: PushNotifyRequest, user: dict = Depends(require_auth)):
    """Send a push notification to all subscribed devices.

    Called manually when a new clipping is published.
    Future: could be triggered by GitHub webhook on push to main.
    """
    result = notify_all(
        title=req.title,
        body=req.body or f"Edición N°{req.numero}",
        data={"numero": req.numero, "fecha": req.fecha},
    )
    return {
        "status": "ok",
        "sent": result["sent"],
        "failed": result["failed"],
        "expired": result["expired"],
        "subscriptions": get_subscription_count(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/push/stats")
async def push_stats():
    """Return push subscription statistics."""
    return {
        "subscriptions": get_subscription_count(),
        "vapid_key_set": bool(get_vapid_public_key()),
    }


# ===== Chat History Sync (SQLite) =====

# ===== Postgres Connection =====

def _get_pg_conn():
    """Get a psycopg connection to the Hornero Postgres database (dict_row for dict results).
    Uses autocommit=True so every write is immediately persisted."""
    if not HORNERO_DB_URL:
        raise HTTPException(500, "HORNERO_DB_URL not configured")
    conn = psycopg.connect(HORNERO_DB_URL, row_factory=dict_row)
    conn.autocommit = True
    return conn


def _init_pg_tables():
    """Create chat_messages, informes, correcciones tables in Postgres. Idempotent."""
    if not HORNERO_DB_URL:
        logger.warning("HORNERO_DB_URL not set — sync tables not created")
        return
    with _get_pg_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                username TEXT NOT NULL,
                section TEXT NOT NULL,
                role TEXT NOT NULL,
                persona TEXT DEFAULT '',
                text TEXT DEFAULT '',
                sections TEXT DEFAULT '[]',
                tags TEXT DEFAULT '[]',
                time_str TEXT DEFAULT '',
                timestamp BIGINT NOT NULL,
                title TEXT DEFAULT '',
                redirect_persona TEXT DEFAULT '',
                image TEXT DEFAULT '',
                source_url TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_username ON chat_messages(username)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id, username)")

        conn.execute("""
            CREATE TABLE IF NOT EXISTS informes (
                id TEXT PRIMARY KEY,
                grado INTEGER NOT NULL,
                numero INTEGER DEFAULT 0,
                semana TEXT DEFAULT '',
                territorio TEXT DEFAULT '',
                estado TEXT DEFAULT 'pendiente',
                username TEXT NOT NULL,
                empresa TEXT DEFAULT '',
                fecha TEXT DEFAULT '',
                timestamp BIGINT NOT NULL DEFAULT 0,
                contenido TEXT DEFAULT '',
                sections TEXT DEFAULT '[]',
                etiquetas TEXT DEFAULT '{}',
                datosDuros TEXT DEFAULT '[]',
                relato TEXT DEFAULT '',
                clasificacion TEXT DEFAULT '',
                ficha TEXT DEFAULT '',
                tags TEXT DEFAULT '[]',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_username ON informes(username)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_grado ON informes(grado)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_estado ON informes(estado)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_territorio ON informes(territorio)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_empresa ON informes(empresa)")

        conn.execute("""
            CREATE TABLE IF NOT EXISTS correcciones (
                id TEXT PRIMARY KEY,
                informeId TEXT NOT NULL,
                correctorGrado INTEGER DEFAULT 2,
                correctorUsername TEXT DEFAULT '',
                fecha TEXT DEFAULT '',
                tipo TEXT DEFAULT '',
                seccionIndex INTEGER DEFAULT 0,
                seccionTitle TEXT DEFAULT '',
                textoOriginal TEXT DEFAULT '',
                textoNuevo TEXT DEFAULT '',
                resumen TEXT DEFAULT '',
                cambios TEXT DEFAULT '',
                timestamp BIGINT NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Migrate timestamp columns from INTEGER to BIGINT (Date.now() ms overflow)
        for tbl in ("chat_messages", "informes", "correcciones"):
            try:
                conn.execute(f"ALTER TABLE {tbl} ALTER COLUMN timestamp TYPE BIGINT")
                logger.info(f"Migrated {tbl}.timestamp INTEGER → BIGINT")
            except Exception:
                pass  # already BIGINT or column doesn't exist

        conn.execute("CREATE INDEX IF NOT EXISTS idx_corr_informeId ON correcciones(informeId)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_corr_username ON correcciones(correctorUsername)")

        # Deleted sessions tombstones — prevent resurrection of deleted chats
        conn.execute("""
            CREATE TABLE IF NOT EXISTS deleted_sessions (
                username TEXT NOT NULL,
                session_id TEXT NOT NULL,
                deleted_at BIGINT NOT NULL,
                PRIMARY KEY (username, session_id)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_del_sessions_username ON deleted_sessions(username)")

        conn.commit()
        logger.info("Postgres sync tables initialized (chat_messages, informes, correcciones, deleted_sessions)")


class ChatSyncRequest(BaseModel):
    username: str
    messages: list = []


@app.post("/api/chat/sync")
async def chat_sync(req: ChatSyncRequest, user: dict = Depends(require_auth)):
    """Upsert batch of chat messages from a device. Rejects messages for deleted sessions."""
    username = user["username"]  # From JWT, cannot be spoofed
    if not req.messages:
        return {"synced": 0}
    conn = _get_pg_conn()
    try:
        # Fetch deleted session IDs to prevent resurrection of deleted chats
        deleted_rows = conn.execute("""
            SELECT session_id FROM deleted_sessions WHERE username = %s
        """, (username,)).fetchall()
        deleted_session_ids = set(r["session_id"] for r in deleted_rows)

        synced = 0
        skipped = 0
        for msg in req.messages:
            if not isinstance(msg, dict) or not msg.get("id"):
                continue
            # Skip messages belonging to deleted sessions (tombstone guard)
            if msg.get("sessionId", "") in deleted_session_ids:
                skipped += 1
                continue
            conn.execute("""
                INSERT INTO chat_messages (id, session_id, username, section, role, persona,
                    text, sections, tags, time_str, timestamp, title, redirect_persona, image, source_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT(id) DO UPDATE SET
                    session_id=excluded.session_id,
                    username=excluded.username,
                    section=excluded.section,
                    role=excluded.role,
                    persona=excluded.persona,
                    text=excluded.text,
                    sections=excluded.sections,
                    tags=excluded.tags,
                    time_str=excluded.time_str,
                    timestamp=excluded.timestamp,
                    title=excluded.title,
                    redirect_persona=excluded.redirect_persona,
                    image=excluded.image,
                    source_url=excluded.source_url
                WHERE excluded.timestamp > chat_messages.timestamp
            """, (
                msg.get("id"),
                msg.get("sessionId", ""),
                username,
                msg.get("section", ""),
                msg.get("role", "user"),
                msg.get("persona", ""),
                msg.get("text", ""),
                json.dumps(msg.get("sections", []), ensure_ascii=False),
                json.dumps(msg.get("tags", []), ensure_ascii=False),
                msg.get("time", ""),
                msg.get("timestamp", 0),
                msg.get("title", ""),
                msg.get("redirect_persona", ""),
                msg.get("image", ""),
                msg.get("source_url", ""),
            ))
            synced += 1
        if skipped > 0:
            logger.info(f"Chat sync: user={username} skipped {skipped} messages from deleted sessions")
        logger.info(f"Chat sync: user={username} synced={synced}")
        return {"synced": synced}
    except Exception as e:
        logger.error(f"Chat sync error: {e}")
        return {"synced": 0, "error": str(e)}
    finally:
        conn.close()


@app.get("/api/chat/sessions")
async def chat_sessions(user: dict = Depends(require_auth)):
    """List chat sessions for a user. Returns session metadata."""
    username = user["username"]
    with _get_pg_conn() as conn:
        rows = conn.execute("""
            SELECT session_id, section, persona,
                   MAX(timestamp) as timestamp, title, role, text,
                   COUNT(*) as message_count
            FROM chat_messages
            WHERE username = %s
            GROUP BY session_id, section, persona, title, role, text
            ORDER BY MAX(timestamp) DESC
        """, (username,)).fetchall()
        sessions = []
        for r in rows:
            # Use title from first user message as preview
            preview = r["title"] or ""
            if not preview and r["role"] == "user":
                preview = (r["text"] or "")[:80]
            sessions.append({
                "sessionId": r["session_id"],
                "section": r["section"],
                "persona": r["persona"],
                "timestamp": r["timestamp"],
                "preview": preview or "Nuevo chat",
                "messageCount": r["message_count"],
            })
        return sessions


@app.get("/api/chat/messages")
async def chat_messages(sessionId: str = "", user: dict = Depends(require_auth)):
    """Get all messages for a specific chat session."""
    try:
        username = user["username"]
        if not sessionId:
            return []
        with _get_pg_conn() as conn:
            rows = conn.execute("""
                SELECT * FROM chat_messages
                WHERE username = %s AND session_id = %s
                ORDER BY timestamp ASC
            """, (username, sessionId)).fetchall()
            messages = []
            for r in rows:
                sections_raw = r["sections"]
                tags_raw = r["tags"]
                sections_parsed = json.loads(sections_raw) if isinstance(sections_raw, str) else (sections_raw or [])
                tags_parsed = json.loads(tags_raw) if isinstance(tags_raw, str) else (tags_raw or [])
                if not isinstance(sections_parsed, list):
                    logger.error(f"chat/messages: sections NOT list — session={sessionId} msg_id={r['id']} "
                                 f"type={type(sections_parsed).__name__} val={str(sections_parsed)[:100]}")
                if not isinstance(tags_parsed, list):
                    logger.error(f"chat/messages: tags NOT list — session={sessionId} msg_id={r['id']} "
                                 f"type={type(tags_parsed).__name__} val={str(tags_parsed)[:100]}")
                messages.append({
                    "id": r["id"],
                    "sessionId": r["session_id"],
                    "username": r["username"],
                    "section": r["section"],
                    "role": r["role"],
                    "persona": r["persona"],
                    "text": r["text"],
                    "sections": sections_parsed,
                    "tags": tags_parsed,
                    "time": r["time_str"],
                    "timestamp": r["timestamp"],
                    "title": r["title"],
                    "redirect_persona": r["redirect_persona"],
                    "image": r.get("image", ""),
                    "source_url": r.get("source_url", ""),
                })
            return messages
    except Exception as err:
        import traceback
        logger.error(f"chat/messages crash: {type(err).__name__}: {err}\n{traceback.format_exc()}")
        raise HTTPException(500, f"Messages crash: {type(err).__name__}: {str(err)[:200]}")


@app.delete("/api/chat/session")
async def chat_session_delete(sessionId: str = "", user: dict = Depends(require_auth)):
    """Delete all messages for a chat session and record tombstone to prevent resurrection."""
    username = user["username"]
    if not sessionId:
        return {"deleted": 0}
    with _get_pg_conn() as conn:
        cursor = conn.execute("""
            DELETE FROM chat_messages WHERE username = %s AND session_id = %s
        """, (username, sessionId))
        # Insert tombstone so other devices don't re-upload this session
        conn.execute("""
            INSERT INTO deleted_sessions (username, session_id, deleted_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (username, session_id) DO UPDATE SET
                deleted_at = excluded.deleted_at
        """, (username, sessionId, int(time.time() * 1000)))
        conn.commit()
        return {"deleted": cursor.rowcount}


@app.get("/api/chat/deleted-sessions")
async def chat_deleted_sessions(user: dict = Depends(require_auth)):
    """Return list of session IDs deleted by this user (tombstones for sync)."""
    username = user["username"]
    with _get_pg_conn() as conn:
        rows = conn.execute("""
            SELECT session_id, deleted_at FROM deleted_sessions
            WHERE username = %s
            ORDER BY deleted_at DESC
        """, (username,)).fetchall()
        return [{"sessionId": r["session_id"], "deletedAt": r["deleted_at"]} for r in rows]


@app.delete("/api/chat/clear-all")
async def chat_clear_all(user: dict = Depends(require_auth)):
    """Clear ALL chat messages for ALL users. Requires auth."""
    with _get_pg_conn() as conn:
        cursor = conn.execute("DELETE FROM chat_messages")
        conn.commit()
        logger.info(f"Chat clear-all: deleted {cursor.rowcount} messages")
        return {"deleted": cursor.rowcount}


# ===== Informes Sync (Postgres) =====

class InformeSyncRequest(BaseModel):
    username: str
    informes: list = []


@app.post("/api/informes/sync")
async def informes_sync(req: InformeSyncRequest, user: dict = Depends(require_auth)):
    """Upsert batch de informes desde un dispositivo. Timestamp guard: solo actualiza si más nuevo."""
    username = user["username"]  # From JWT, cannot be spoofed
    if not req.informes:
        return {"synced": 0}
    with _get_pg_conn() as conn:
        try:
            synced = 0
            for inf in req.informes:
                if not isinstance(inf, dict) or not inf.get("id"):
                    continue
                conn.execute("""
                    INSERT INTO informes (id, grado, numero, semana, territorio, estado, username,
                        empresa, fecha, timestamp, contenido, sections, etiquetas, datosDuros,
                        relato, clasificacion, ficha, tags)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT(id) DO UPDATE SET
                        grado=excluded.grado,
                        numero=excluded.numero,
                        semana=excluded.semana,
                        territorio=excluded.territorio,
                        estado=excluded.estado,
                        username=excluded.username,
                        empresa=excluded.empresa,
                        fecha=excluded.fecha,
                        timestamp=excluded.timestamp,
                        contenido=excluded.contenido,
                        sections=excluded.sections,
                        etiquetas=excluded.etiquetas,
                        datosDuros=excluded.datosDuros,
                        relato=excluded.relato,
                        clasificacion=excluded.clasificacion,
                        ficha=excluded.ficha,
                        tags=excluded.tags
                    WHERE excluded.timestamp > informes.timestamp
                """, (
                    inf.get("id"),
                    inf.get("grado", 1),
                    inf.get("numero", 0),
                    inf.get("semana", ""),
                    inf.get("territorio", ""),
                    inf.get("estado", "pendiente"),
                    username,
                    inf.get("empresa", ""),
                    inf.get("fecha", ""),
                    inf.get("timestamp", 0),
                    inf.get("contenido", ""),
                    json.dumps(inf.get("sections", []), ensure_ascii=False),
                    json.dumps(inf.get("etiquetas", {}), ensure_ascii=False),
                    json.dumps(inf.get("datosDuros", []), ensure_ascii=False),
                    inf.get("relato", ""),
                    inf.get("clasificacion", ""),
                    inf.get("ficha", ""),
                    json.dumps(inf.get("tags", []), ensure_ascii=False),
                ))
                synced += 1
            conn.commit()
            return {"synced": synced}
        except Exception as e:
            logger.error(f"Informes sync error: {e}")
            return {"synced": 0, "error": str(e)}


@app.get("/api/informes/all")
async def informes_all(user: dict = Depends(require_auth)):
    """Obtener todos los informes de un usuario."""
    username = user["username"]
    with _get_pg_conn() as conn:
        rows = conn.execute("""
            SELECT * FROM informes WHERE username = %s ORDER BY timestamp DESC
        """, (username,)).fetchall()
        return [_row_to_informe(r) for r in rows]


@app.get("/api/informes/incoming")
async def informes_incoming(user: dict = Depends(require_auth)):
    """Informes visibles para un grado/territorio/empresa según jerarquía sindical.
    B.b (delegado): ve G1 pendiente/visto/aceptado de su territorio + empresa
    B.c (secretario): ve G2 pendiente/visto/aceptado de su territorio (todas las empresas)
    B.d (federación): ve G3 pendiente/visto/aceptado de todos los territorios
    """
    grade = user.get("grade", "")
    territorio = user.get("territory", "")
    empresa = ""  # empresa filtering from request body not supported; use JWT territory only
    if not grade:
        return []
    with _get_pg_conn() as conn:
        # Normalize territorio for flexible matching
        def norm_t(t):
            return (t or "").lower().replace(" ", "").replace("-", "").replace("_", "") if t else ""

        norm_terr = norm_t(territorio)
        norm_emp = (empresa or "").lower().strip()
        unresolved = ["pendiente", "visto", "aceptado"]

        if grade == "B.b":
            lower_grado = 1
            rows = conn.execute(
                "SELECT * FROM informes WHERE grado = %s AND estado IN (%s, %s, %s)",
                (lower_grado, *unresolved),
            ).fetchall()
            # Filter by territorio + empresa (flexible matching)
            result = []
            for r in rows:
                if norm_t(r["territorio"]) != norm_terr:
                    continue
                r_emp = (r["empresa"] or "").lower().strip()
                if not empresa:
                    pass  # Delegate with no empresa → show all from territory
                elif r_emp != norm_emp:
                    continue
                result.append(_row_to_informe(r))
            return result

        elif grade == "B.c":
            lower_grado = 2
            rows = conn.execute(
                "SELECT * FROM informes WHERE grado = %s AND estado IN (%s, %s, %s)",
                (lower_grado, *unresolved),
            ).fetchall()
            # Filter by territorio only (all empresas)
            result = []
            for r in rows:
                if norm_t(r["territorio"]) != norm_terr:
                    continue
                result.append(_row_to_informe(r))
            return result

        elif grade == "B.d":
            lower_grado = 3
            rows = conn.execute(
                "SELECT * FROM informes WHERE grado = %s AND estado IN (%s, %s, %s)",
                (lower_grado, *unresolved),
            ).fetchall()
            return [_row_to_informe(r) for r in rows]

        return []


def _row_to_informe(r):
    """Convert a Postgres dict row to a dict for the API response."""
    sections_raw = r.get("sections", "[]")
    etiquetas_raw = r.get("etiquetas", "{}")
    datos_raw = r.get("datosDuros", "[]")
    tags_raw = r.get("tags", "[]")
    return {
        "id": r["id"],
        "grado": r["grado"],
        "numero": r.get("numero", 0),
        "semana": r["semana"],
        "territorio": r["territorio"],
        "estado": r["estado"],
        "username": r["username"],
        "empresa": r["empresa"],
        "fecha": r["fecha"],
        "timestamp": r["timestamp"],
        "contenido": r.get("contenido", ""),
        "sections": json.loads(sections_raw) if isinstance(sections_raw, str) else (sections_raw or []),
        "etiquetas": json.loads(etiquetas_raw) if isinstance(etiquetas_raw, str) else (etiquetas_raw or {}),
        "datosDuros": json.loads(datos_raw) if isinstance(datos_raw, str) else (datos_raw or []),
        "relato": r.get("relato", ""),
        "clasificacion": r.get("clasificacion", ""),
        "ficha": r.get("ficha", ""),
        "tags": json.loads(tags_raw) if isinstance(tags_raw, str) else (tags_raw or []),
    }


@app.delete("/api/informes/clear-user")
async def informes_clear_user(user: dict = Depends(require_auth)):
    """Borrar todos los informes de un usuario."""
    username = user["username"]
    with _get_pg_conn() as conn:
        cursor = conn.execute("DELETE FROM informes WHERE username = %s", (username,))
        conn.commit()
        logger.info(f"Informes clear-user {username}: deleted {cursor.rowcount}")
        return {"deleted": cursor.rowcount}


@app.delete("/api/informes/clear-all")
async def informes_clear_all(user: dict = Depends(require_auth)):
    """Borrar TODOS los informes y correcciones de TODOS los usuarios. Requires auth."""
    with _get_pg_conn() as conn:
        inf_cursor = conn.execute("DELETE FROM informes")
        cor_cursor = conn.execute("DELETE FROM correcciones")
        conn.commit()
        logger.info(f"Informes clear-all: deleted {inf_cursor.rowcount} informes, {cor_cursor.rowcount} correcciones")
        return {"deleted_informes": inf_cursor.rowcount, "deleted_correcciones": cor_cursor.rowcount}


@app.delete("/api/informes/delete")
async def informe_delete(id: str = "", user: dict = Depends(require_auth)):
    """Borrar un informe específico de un usuario + sus correcciones."""
    username = user["username"]
    if not id:
        return {"deleted": 0}
    with _get_pg_conn() as conn:
        # Delete correcciones for this informe first
        conn.execute("DELETE FROM correcciones WHERE informeId = %s", (id,))
        cursor = conn.execute("DELETE FROM informes WHERE username = %s AND id = %s", (username, id))
        conn.commit()
        return {"deleted": cursor.rowcount}


# ===== Correcciones Sync (Postgres) =====

class CorreccionSyncRequest(BaseModel):
    username: str
    correcciones: list = []


@app.post("/api/correcciones/sync")
async def correcciones_sync(req: CorreccionSyncRequest, user: dict = Depends(require_auth)):
    """Upsert batch de correcciones desde un dispositivo. Timestamp guard: solo actualiza si más nuevo."""
    username = user["username"]  # From JWT, cannot be spoofed
    if not req.correcciones:
        return {"synced": 0}
    with _get_pg_conn() as conn:
        try:
            synced = 0
            for cor in req.correcciones:
                if not isinstance(cor, dict) or not cor.get("id"):
                    continue
                conn.execute("""
                    INSERT INTO correcciones (id, informeId, correctorGrado, correctorUsername,
                        fecha, tipo, seccionIndex, seccionTitle, textoOriginal, textoNuevo,
                        resumen, cambios, timestamp)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT(id) DO UPDATE SET
                        informeId=excluded.informeId,
                        correctorGrado=excluded.correctorGrado,
                        correctorUsername=excluded.correctorUsername,
                        fecha=excluded.fecha,
                        tipo=excluded.tipo,
                        seccionIndex=excluded.seccionIndex,
                        seccionTitle=excluded.seccionTitle,
                        textoOriginal=excluded.textoOriginal,
                        textoNuevo=excluded.textoNuevo,
                        resumen=excluded.resumen,
                        cambios=excluded.cambios,
                        timestamp=excluded.timestamp
                    WHERE excluded.timestamp > correcciones.timestamp
                """, (
                    cor.get("id"),
                    cor.get("informeId", ""),
                    cor.get("correctorGrado", 2),
                    cor.get("correctorUsername", ""),
                    cor.get("fecha", ""),
                    cor.get("tipo", ""),
                    cor.get("seccionIndex", 0),
                    cor.get("seccionTitle", ""),
                    cor.get("textoOriginal", ""),
                    cor.get("textoNuevo", ""),
                    cor.get("resumen", ""),
                    cor.get("cambios", ""),
                    cor.get("timestamp", 0),
                ))
                synced += 1
            conn.commit()
            return {"synced": synced}
        except Exception as e:
            logger.error(f"Correcciones sync error: {e}")
            return {"synced": 0, "error": str(e)}


@app.get("/api/correcciones")
async def correcciones_get(informeId: str = "", user: dict = Depends(require_auth)):
    """Obtener correcciones de un informe."""
    if not informeId:
        return []
    with _get_pg_conn() as conn:
        rows = conn.execute("""
            SELECT * FROM correcciones WHERE informeId = %s ORDER BY timestamp ASC
        """, (informeId,)).fetchall()
        return [_row_to_correccion(r) for r in rows]


@app.delete("/api/correcciones/clear-all")
async def correcciones_clear_all(user: dict = Depends(require_auth)):
    """Borrar TODAS las correcciones. Requires auth."""
    with _get_pg_conn() as conn:
        cursor = conn.execute("DELETE FROM correcciones")
        conn.commit()
        logger.info(f"Correcciones clear-all: deleted {cursor.rowcount}")
        return {"deleted": cursor.rowcount}


def _row_to_correccion(r):
    """Convert a Postgres dict row to a dict for the API response."""
    return {
        "id": r["id"],
        "informeId": r["informeId"],
        "correctorGrado": r["correctorGrado"],
        "correctorUsername": r["correctorUsername"],
        "fecha": r["fecha"],
        "tipo": r["tipo"],
        "seccionIndex": r["seccionIndex"],
        "seccionTitle": r.get("seccionTitle", ""),
        "textoOriginal": r["textoOriginal"],
        "textoNuevo": r["textoNuevo"],
        "resumen": r.get("resumen", ""),
        "cambios": r.get("cambios", ""),
        "timestamp": r["timestamp"],
    }


# ===== Chat: per-user clear =====

@app.get("/api/chat/count")
async def chat_count(user: dict = Depends(require_auth)):
    """Diagnostic: count of chat messages for the authenticated user."""
    username = user["username"]
    conn = _get_pg_conn()
    try:
        row = conn.execute("SELECT COUNT(*) as cnt FROM chat_messages WHERE username = %s", (username,)).fetchone()
        return {"username": username, "count": row["cnt"] if row else 0}
    finally:
        conn.close()


@app.delete("/api/chat/clear-user")
async def chat_clear_user(user: dict = Depends(require_auth)):
    """Borrar todos los chats de un usuario (no borra los de otros usuarios)."""
    username = user["username"]
    with _get_pg_conn() as conn:
        cursor = conn.execute("DELETE FROM chat_messages WHERE username = %s", (username,))
        conn.commit()
        logger.info(f"Chat clear-user {username}: deleted {cursor.rowcount} messages")
        return {"deleted": cursor.rowcount}


# ===== Response parser =====
def parse_llm_response(raw: str) -> dict:
    """Parse LLM response into structured format.

    The LLM should return JSON, but sometimes wraps it in markdown
    or adds extra text. We extract the JSON and validate it.
    """

    # Try to find JSON in the response
    # Case 1: pure JSON
    try:
        result = json.loads(raw)
        if _validate_parsed_response(result):
            return result
    except json.JSONDecodeError:
        pass

    # Case 2: JSON wrapped in markdown code block
    json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
    if json_match:
        try:
            result = json.loads(json_match.group(1).strip())
            if _validate_parsed_response(result):
                return result
        except json.JSONDecodeError:
            pass

    # Case 3: JSON somewhere in the text (look for first { to last })
    brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if brace_match:
        try:
            result = json.loads(brace_match.group(0))
            if _validate_parsed_response(result):
                return result
        except json.JSONDecodeError:
            pass

    # Fallback: if LLM responded in plain text (not JSON), treat as conversational text
    return {
        "text": raw.strip(),
        "sections": [],
        "tags": ["respuesta-libre"],
    }


def _validate_parsed_response(parsed: dict) -> bool:
    """Validate that a parsed LLM response has the minimum required fields.

    A valid response must have either:
    - A non-empty 'text' field, OR
    - A non-empty 'sections' list with at least one section
    - A 'tags' list (even if empty)
    """
    if not isinstance(parsed, dict):
        return False

    # Must have text or sections
    has_text = bool(parsed.get("text", "").strip())
    has_sections = bool(parsed.get("sections", []))

    if not has_text and not has_sections:
        return False

    # If sections exist, at least one must have content
    if has_sections:
        sections = parsed.get("sections", [])
        if not any(s.get("body") or s.get("quote") or s.get("title") for s in sections if isinstance(s, dict)):
            return False

    return True


# ===== PDFs estáticos — fuentes RAG accesibles =====
# Sirve los PDFs de convenios y leyes para consulta directa
# Contenido unificado en biblioteca/rag/ (antes docs/fuentes/, luego biblioteca/fuentes/)
import pathlib as _pl
_fuentes_dir = _pl.Path(__file__).parent.parent / "biblioteca" / "rag"
if _fuentes_dir.is_dir():
    app.mount("/fuentes", StaticFiles(directory=str(_fuentes_dir)), name="fuentes")
    logger.info(f"PDFs served from {_fuentes_dir}")


@app.get("/api/pdfs")
async def list_pdfs():
    """Lista los PDFs disponibles y leyes con enlace Infoleg para consulta."""
    pdfs = []
    # PDFs servidos desde docs/fuentes/ (unificado)
    base = _fuentes_dir
    if base.is_dir():
        for f in sorted(base.rglob("*.pdf")):
            rel = f.relative_to(base)
            category = rel.parts[0] if len(rel.parts) > 1 else "general"
            pdfs.append({
                "name": f.stem,
                "category": category,
                "filename": rel.as_posix(),
                "url": f"/fuentes/{rel.as_posix()}",
                "size_kb": round(f.stat().st_size / 1024),
                "source": "pdf",
            })
    # Agregar leyes laborales con enlace Infoleg (ya no usan PDF local)
    from kb_data import DOCUMENTOS_CATALOG
    for doc in DOCUMENTOS_CATALOG.get("leyes-laborales", []):
        pdfs.append({
            "name": doc["name"],
            "category": "leyes-laborales",
            "filename": doc["url"],
            "url": doc["url"],
            "desc": doc["desc"],
            "source": "infoleg",
        })
    return {"pdfs": pdfs, "total": len(pdfs)}
