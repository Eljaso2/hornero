"""Backend Hornero — Chat proxy

FastAPI minimal que recibe mensajes del chat, construye prompt sindical,
llama a LLM externo (DeepSeek o Claude), devuelve respuesta estructurada.

Enfoque híbrido: proxy rápido ahora → migrar a RAG self-hosted en Phase 2.
"""

import json
import logging
import os
import re
import sqlite3
import subprocess
import tempfile
import time
from collections import defaultdict
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

from knowledge_base import get_system_prompt, get_system_prompt_rag, get_format_hint, get_greeting_hint, PERSONA_MAP, PERSONA_NAME_MAP
from llm_providers.deepseek import call_deepseek, call_deepseek_stream
from llm_providers.claude import call_claude
from clipping_cache import get_clipping, refresh
from rag_retriever import retrieve_for_query
from kb_data import ALL_CHUNKS, KB_CHUNKS, KB_CATEGORIES, KB_CATEGORY_META, KB_TIPOS, refresh as kb_refresh
from push_manager import subscribe as push_subscribe, unsubscribe as push_unsubscribe, notify_all, get_vapid_public_key, get_subscription_count

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
APP_BACKEND_URL = os.getenv("APP_BACKEND_URL", "http://localhost:8000")

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

@app.on_event("startup")
async def startup_event():
    """Initialize clipping cache + KB chunks on startup."""
    clip_count = refresh()
    kb_count = kb_refresh()
    print(f"Clipping cache initialized: {clip_count} items")
    print(f"KB chunks loaded: {kb_count} total (manual + PDF-extracted)")


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
    allow_methods=["POST", "GET", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


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
    requested_persona: str = ""  # companero|abogado|periodista|historiador — override
    session_id: str = ""  # Frontend session ID for correlation
    days_since_last_chat: int = 999  # Days since last chat session — affects greeting tone
    incoming_reports: list = []  # Reports from lower grades (for G2+ users)
    incoming_reports_count: int = 0  # Count of incoming reports (for greeting hint)


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
    requested_persona: str = ""  # companero|abogado|periodista|historiador — override
    session_id: str = ""  # Frontend session ID for correlation
    incoming_reports: list = []  # Reports from lower grades (for G2+ users)


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


@app.post("/api/greeting")
async def greeting_endpoint(req: GreetingRequest) -> GreetingResponse:
    """Generate the IA's opening message when user enters a chat section.

    The IA greets, explains what it is, and tells what the user can consult
    in that specific section.

    RAG: greeting uses minimal context (no KB chunks needed — persona knows who it is).
    """
    # Greeting: no RAG retrieval needed (persona + principles are sufficient)
    # Use requested_persona if provided, otherwise section-based default
    if req.requested_persona and req.requested_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"]:
        effective_persona = req.requested_persona
    elif req.requested_persona and req.requested_persona in PERSONA_MAP:
        effective_persona = PERSONA_MAP.get(req.requested_persona, 'abogado')
    else:
        effective_persona = PERSONA_MAP.get(req.section, 'abogado')
    system_prompt = get_system_prompt_rag(req.section, chunk_ids=[], clipping_items=get_clipping(), requested_persona=req.requested_persona, grade=req.grade, incoming_reports=req.incoming_reports)
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
async def chat_endpoint(req: ChatRequest, request: Request = None) -> ChatResponse:
    """Main chat endpoint — receives user message, returns structured IA response.

    RAG: retrieves relevant KB chunks based on user query, injects only
    those chunks into the system prompt instead of the full KNOWLEDGE_BASE.
    """
    start_time = time.time()

    # Rate limiting
    client_ip = request.client.host if request else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(429, "Demasiadas solicitudes. Esperá un momento e intentá de nuevo.")

    # RAG retrieval: find relevant chunks based on user query + conversation context
    relevant_chunks = retrieve_for_query(req.message, req.formato, req.grade,
                                          conversation_history=req.history)
    chunk_ids = [c["id"] for c in relevant_chunks]

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
    )
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
async def chat_stream_endpoint(req: ChatRequest, request: Request = None):
    """Streaming chat endpoint — returns SSE events with tokens as they arrive.

    Events emitted:
      - event: token\ndata: {content}\n\n  — each token chunk
      - event: done\ndata: {text, sections, tags, time, persona, redirect_persona}\n\n  — final parsed response
      - event: error\ndata: {message}\n\n  — if something fails

    Falls back to non-streaming if the LLM provider doesn't support streaming.
    """
    # Rate limiting
    client_ip = request.client.host if request else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(429, "Demasiadas solicitudes. Esperá un momento e intentá de nuevo.")

    # RAG retrieval: find relevant KB chunks based on user query
    relevant_chunks = retrieve_for_query(req.message, req.formato, req.grade)
    chunk_ids = [c["id"] for c in relevant_chunks]

    # Build system prompt with ONLY relevant KB chunks
    system_prompt = get_system_prompt_rag(
        formato=req.formato,
        chunk_ids=chunk_ids,
        clipping_items=get_clipping(),
        query=req.message,
        requested_persona=req.requested_persona,
        grade=req.grade,
        incoming_reports=req.incoming_reports,
    )
    effective_persona = PERSONA_MAP.get(req.formato, 'abogado')
    if req.requested_persona:
        if req.requested_persona in PERSONA_NAME_MAP:
            effective_persona = req.requested_persona
        elif req.requested_persona in PERSONA_MAP:
            effective_persona = req.requested_persona
    format_hint = get_format_hint(req.formato, req.grade)

    # Build the user message with format context
    full_message = f"{format_hint}\n\nPregunta del trabajador: {req.message}"

    async def event_generator():
        try:
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
                        # Escape newlines for SSE data field
                        content = chunk["content"].replace("\n", "\\n")
                        yield f"event: token\ndata: {content}\n\n"
                    elif chunk["type"] == "done":
                        # Parse the full response
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
                # Claude/other provider: no streaming support yet — fall back to non-streaming
                # wrapped in SSE format for consistent frontend handling
                if LLM_PROVIDER == "claude":
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

                parsed = parse_llm_response(raw_response)
                now = datetime.now()
                time_str = now.strftime("%H:%M")

                llm_persona = parsed.get("persona", "")
                final_persona = llm_persona if llm_persona in ["companero", "abogado", "periodista", "historiador", "sociologo"] else effective_persona

                # Send entire text as single token event for non-streaming fallback
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
    audio: UploadFile = File(...),
    formato: str = Form("consulta"),
    grade: str = Form("A"),
    sector: str = Form("aceitero"),
    requested_persona: str = Form(""),
    session_id: str = Form(""),
    history: str = Form("[]"),
) -> ChatResponse:
    """Audio chat endpoint — receives audio, transcribes with Paraformer-v2, then calls LLM.

    Flow: audio blob → DashScope STT → transcribed text → RAG + LLM → ChatResponse
    Uses the same DEEPSEEK_API_KEY for STT (DashScope unified auth).
    """

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
    relevant_chunks = retrieve_for_query(transcript, formato, grade)
    chunk_ids = [c["id"] for c in relevant_chunks]

    # 4. Build system prompt + format hint
    system_prompt = get_system_prompt_rag(
        formato=formato,
        chunk_ids=chunk_ids,
        clipping_items=get_clipping(),
        query=transcript,
        requested_persona=requested_persona,
        grade=grade,
    )
    effective_persona = PERSONA_MAP.get(formato, 'abogado')
    if requested_persona:
        if requested_persona in PERSONA_NAME_MAP:
            effective_persona = requested_persona
        elif requested_persona in PERSONA_MAP:
            effective_persona = requested_persona
    format_hint = get_format_hint(formato, grade)

    full_message = f"{format_hint}\n\nPregunta del trabajador (mensaje de audio): {transcript}"

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


# ===== Feedback endpoint =====
class FeedbackRequest(BaseModel):
    session_id: str = ""
    message_index: int = -1
    rating: str = ""  # "like" or "dislike"
    comment: str = ""
    persona: str = ""
    message_text: str = ""  # First 200 chars for context (no PII)


@app.post("/api/feedback")
async def feedback_endpoint(req: FeedbackRequest):
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
async def push_subscribe_endpoint(req: PushSubscriptionRequest):
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
async def push_unsubscribe_endpoint(req: PushUnsubscribeRequest):
    """Remove a push subscription (user turned off notifications)."""
    success = push_unsubscribe(req.endpoint)
    if success:
        return {"status": "ok", "message": "Suscripción eliminada"}
    raise HTTPException(400, "Endpoint inválido")


@app.post("/api/push/notify")
async def push_notify_endpoint(req: PushNotifyRequest):
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

CHAT_DB_PATH = os.path.join(os.path.dirname(__file__), "chat_history.db")


def _get_chat_db():
    """Get or create SQLite connection for chat history + table."""
    conn = sqlite3.connect(CHAT_DB_PATH)
    conn.row_factory = sqlite3.Row
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
            timestamp INTEGER NOT NULL,
            title TEXT DEFAULT '',
            redirect_persona TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_username ON chat_messages(username)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id, username)")
    # Add image and source_url columns (additive, safe to re-run)
    try: conn.execute("ALTER TABLE chat_messages ADD COLUMN image TEXT DEFAULT ''")
    except: pass
    try: conn.execute("ALTER TABLE chat_messages ADD COLUMN source_url TEXT DEFAULT ''")
    except: pass
    conn.commit()
    return conn


class ChatSyncRequest(BaseModel):
    username: str
    messages: list = []


@app.post("/api/chat/sync")
async def chat_sync(req: ChatSyncRequest):
    """Upsert batch of chat messages from a device. Fire-and-forget sync."""
    if not req.username or not req.messages:
        return {"synced": 0}
    conn = _get_chat_db()
    try:
        synced = 0
        for msg in req.messages:
            if not isinstance(msg, dict) or not msg.get("id"):
                continue
            conn.execute("""
                INSERT INTO chat_messages (id, session_id, username, section, role, persona,
                    text, sections, tags, time_str, timestamp, title, redirect_persona, image, source_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                req.username,
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
        conn.commit()
        return {"synced": synced}
    except Exception as e:
        logger.error(f"Chat sync error: {e}")
        return {"synced": 0, "error": str(e)}
    finally:
        conn.close()


@app.get("/api/chat/sessions")
async def chat_sessions(username: str = ""):
    """List chat sessions for a user. Returns session metadata."""
    if not username:
        return []
    conn = _get_chat_db()
    try:
        rows = conn.execute("""
            SELECT session_id, section, persona, timestamp, title, role, text,
                   COUNT(*) as message_count
            FROM chat_messages
            WHERE username = ?
            GROUP BY session_id
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
    finally:
        conn.close()


@app.get("/api/chat/messages")
async def chat_messages(username: str = "", sessionId: str = ""):
    """Get all messages for a specific chat session."""
    if not username or not sessionId:
        return []
    conn = _get_chat_db()
    try:
        rows = conn.execute("""
            SELECT * FROM chat_messages
            WHERE username = ? AND session_id = ?
            ORDER BY timestamp ASC
        """, (username, sessionId)).fetchall()
        messages = []
        for r in rows:
            messages.append({
                "id": r["id"],
                "sessionId": r["session_id"],
                "section": r["section"],
                "role": r["role"],
                "persona": r["persona"],
                "text": r["text"],
                "sections": json.loads(r["sections"]) if r["sections"] else [],
                "tags": json.loads(r["tags"]) if r["tags"] else [],
                "time": r["time_str"],
                "timestamp": r["timestamp"],
                "title": r["title"],
                "redirect_persona": r["redirect_persona"],
                "image": r["image"] if "image" in r.keys() else "",
                "source_url": r["source_url"] if "source_url" in r.keys() else "",
            })
        return messages
    finally:
        conn.close()


@app.delete("/api/chat/session")
async def chat_session_delete(username: str = "", sessionId: str = ""):
    """Delete all messages for a chat session."""
    if not username or not sessionId:
        return {"deleted": 0}
    conn = _get_chat_db()
    try:
        cursor = conn.execute("""
            DELETE FROM chat_messages WHERE username = ? AND session_id = ?
        """, (username, sessionId))
        conn.commit()
        return {"deleted": cursor.rowcount}
    finally:
        conn.close()


@app.delete("/api/chat/clear-all")
async def chat_clear_all():
    """Clear ALL chat messages for ALL users. Used for one-time cleanup."""
    conn = _get_chat_db()
    try:
        cursor = conn.execute("DELETE FROM chat_messages")
        conn.commit()
        logger.info(f"Chat clear-all: deleted {cursor.rowcount} messages")
        return {"deleted": cursor.rowcount}
    finally:
        conn.close()


# ===== Informes Sync (SQLite) =====

INFORMES_DB_PATH = os.path.join(os.path.dirname(__file__), "informes.db")


def _get_informes_db():
    """Get or create SQLite connection for informes + correcciones tables."""
    conn = sqlite3.connect(INFORMES_DB_PATH)
    conn.row_factory = sqlite3.Row
    # Informes: campos que el frontend envía (contenido, sections, etiquetas, datosDuros, numero)
    # Legacy: relato, clasificacion, ficha, tags se mantienen por compatibilidad
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
            timestamp INTEGER NOT NULL DEFAULT 0,
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
    # Add missing columns if they don't exist (for existing DBs)
    try: conn.execute("ALTER TABLE informes ADD COLUMN numero INTEGER DEFAULT 0")
    except: pass
    try: conn.execute("ALTER TABLE informes ADD COLUMN contenido TEXT DEFAULT ''")
    except: pass
    try: conn.execute("ALTER TABLE informes ADD COLUMN sections TEXT DEFAULT '[]'")
    except: pass
    try: conn.execute("ALTER TABLE informes ADD COLUMN etiquetas TEXT DEFAULT '{}'")
    except: pass
    try: conn.execute("ALTER TABLE informes ADD COLUMN datosDuros TEXT DEFAULT '[]'")
    except: pass
    conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_username ON informes(username)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_grado ON informes(grado)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_estado ON informes(estado)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_territorio ON informes(territorio)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_inf_empresa ON informes(empresa)")
    # Correcciones: trazabilidad aditiva por informe
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
            timestamp INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_corr_informeId ON correcciones(informeId)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_corr_username ON correcciones(correctorUsername)")
    conn.commit()
    return conn


class InformeSyncRequest(BaseModel):
    username: str
    informes: list = []


@app.post("/api/informes/sync")
async def informes_sync(req: InformeSyncRequest):
    """Upsert batch de informes desde un dispositivo. Timestamp guard: solo actualiza si más nuevo."""
    if not req.username or not req.informes:
        return {"synced": 0}
    conn = _get_informes_db()
    try:
        synced = 0
        for inf in req.informes:
            if not isinstance(inf, dict) or not inf.get("id"):
                continue
            conn.execute("""
                INSERT INTO informes (id, grado, numero, semana, territorio, estado, username,
                    empresa, fecha, timestamp, contenido, sections, etiquetas, datosDuros,
                    relato, clasificacion, ficha, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                req.username,
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
    finally:
        conn.close()


@app.get("/api/informes/all")
async def informes_all(username: str = ""):
    """Obtener todos los informes de un usuario."""
    if not username:
        return []
    conn = _get_informes_db()
    try:
        rows = conn.execute("""
            SELECT * FROM informes WHERE username = ? ORDER BY timestamp DESC
        """, (username,)).fetchall()
        return [_row_to_informe(r) for r in rows]
    finally:
        conn.close()


@app.get("/api/informes/incoming")
async def informes_incoming(grade: str = "", territorio: str = "", empresa: str = ""):
    """Informes visibles para un grado/territorio/empresa según jerarquía sindical.
    B.b (delegado): ve G1 pendiente/visto/aceptado de su territorio + empresa
    B.c (secretario): ve G2 pendiente/visto/aceptado de su territorio (todas las empresas)
    B.d (federación): ve G3 pendiente/visto/aceptado de todos los territorios
    """
    if not grade:
        return []
    conn = _get_informes_db()
    try:
        # Normalize territorio for flexible matching
        def norm_t(t):
            return (t or "").lower().replace(" ", "").replace("-", "").replace("_", "") if t else ""

        norm_terr = norm_t(territorio)
        norm_emp = (empresa or "").lower().strip()
        unresolved = ["pendiente", "visto", "aceptado"]

        if grade == "B.b":
            lower_grado = 1
            rows = conn.execute(
                "SELECT * FROM informes WHERE grado = ? AND estado IN (?, ?, ?)",
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
                "SELECT * FROM informes WHERE grado = ? AND estado IN (?, ?, ?)",
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
                "SELECT * FROM informes WHERE grado = ? AND estado IN (?, ?, ?)",
                (lower_grado, *unresolved),
            ).fetchall()
            return [_row_to_informe(r) for r in rows]

        return []
    finally:
        conn.close()


def _row_to_informe(r):
    """Convert a SQLite Row to a dict for the API response."""
    return {
        "id": r["id"],
        "grado": r["grado"],
        "numero": r["numero"] if "numero" in r.keys() else 0,
        "semana": r["semana"],
        "territorio": r["territorio"],
        "estado": r["estado"],
        "username": r["username"],
        "empresa": r["empresa"],
        "fecha": r["fecha"],
        "timestamp": r["timestamp"],
        "contenido": r["contenido"] if "contenido" in r.keys() else "",
        "sections": json.loads(r["sections"]) if "sections" in r.keys() and r["sections"] else [],
        "etiquetas": json.loads(r["etiquetas"]) if "etiquetas" in r.keys() and r["etiquetas"] else {},
        "datosDuros": json.loads(r["datosDuros"]) if "datosDuros" in r.keys() and r["datosDuros"] else [],
        "relato": r["relato"] if "relato" in r.keys() else "",
        "clasificacion": r["clasificacion"] if "clasificacion" in r.keys() else "",
        "ficha": r["ficha"] if "ficha" in r.keys() else "",
        "tags": json.loads(r["tags"]) if "tags" in r.keys() and r["tags"] else [],
    }


@app.delete("/api/informes/clear-user")
async def informes_clear_user(username: str = ""):
    """Borrar todos los informes de un usuario."""
    if not username:
        return {"deleted": 0}
    conn = _get_informes_db()
    try:
        cursor = conn.execute("DELETE FROM informes WHERE username = ?", (username,))
        conn.commit()
        logger.info(f"Informes clear-user {username}: deleted {cursor.rowcount}")
        return {"deleted": cursor.rowcount}
    finally:
        conn.close()


@app.delete("/api/informes/clear-all")
async def informes_clear_all():
    """Borrar TODOS los informes y correcciones de TODOS los usuarios. One-time cleanup."""
    conn = _get_informes_db()
    try:
        inf_cursor = conn.execute("DELETE FROM informes")
        cor_cursor = conn.execute("DELETE FROM correcciones")
        conn.commit()
        logger.info(f"Informes clear-all: deleted {inf_cursor.rowcount} informes, {cor_cursor.rowcount} correcciones")
        return {"deleted_informes": inf_cursor.rowcount, "deleted_correcciones": cor_cursor.rowcount}
    finally:
        conn.close()


@app.delete("/api/informes/delete")
async def informe_delete(username: str = "", id: str = ""):
    """Borrar un informe específico de un usuario + sus correcciones."""
    if not username or not id:
        return {"deleted": 0}
    conn = _get_informes_db()
    try:
        # Delete correcciones for this informe first
        conn.execute("DELETE FROM correcciones WHERE informeId = ?", (id,))
        cursor = conn.execute("DELETE FROM informes WHERE username = ? AND id = ?", (username, id))
        conn.commit()
        return {"deleted": cursor.rowcount}
    finally:
        conn.close()


# ===== Correcciones Sync (SQLite) =====

class CorreccionSyncRequest(BaseModel):
    username: str
    correcciones: list = []


@app.post("/api/correcciones/sync")
async def correcciones_sync(req: CorreccionSyncRequest):
    """Upsert batch de correcciones desde un dispositivo. Timestamp guard: solo actualiza si más nuevo."""
    if not req.username or not req.correcciones:
        return {"synced": 0}
    conn = _get_informes_db()
    try:
        synced = 0
        for cor in req.correcciones:
            if not isinstance(cor, dict) or not cor.get("id"):
                continue
            conn.execute("""
                INSERT INTO correcciones (id, informeId, correctorGrado, correctorUsername,
                    fecha, tipo, seccionIndex, seccionTitle, textoOriginal, textoNuevo,
                    resumen, cambios, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    finally:
        conn.close()


@app.get("/api/correcciones")
async def correcciones_get(informeId: str = ""):
    """Obtener correcciones de un informe."""
    if not informeId:
        return []
    conn = _get_informes_db()
    try:
        rows = conn.execute("""
            SELECT * FROM correcciones WHERE informeId = ? ORDER BY timestamp ASC
        """, (informeId,)).fetchall()
        return [_row_to_correccion(r) for r in rows]
    finally:
        conn.close()


@app.delete("/api/correcciones/clear-all")
async def correcciones_clear_all():
    """Borrar TODAS las correcciones. One-time cleanup."""
    conn = _get_informes_db()
    try:
        cursor = conn.execute("DELETE FROM correcciones")
        conn.commit()
        logger.info(f"Correcciones clear-all: deleted {cursor.rowcount}")
        return {"deleted": cursor.rowcount}
    finally:
        conn.close()


def _row_to_correccion(r):
    """Convert a SQLite Row to a dict for the API response."""
    return {
        "id": r["id"],
        "informeId": r["informeId"],
        "correctorGrado": r["correctorGrado"],
        "correctorUsername": r["correctorUsername"],
        "fecha": r["fecha"],
        "tipo": r["tipo"],
        "seccionIndex": r["seccionIndex"],
        "seccionTitle": r["seccionTitle"] if "seccionTitle" in r.keys() else "",
        "textoOriginal": r["textoOriginal"],
        "textoNuevo": r["textoNuevo"],
        "resumen": r["resumen"] if "resumen" in r.keys() else "",
        "cambios": r["cambios"] if "cambios" in r.keys() else "",
        "timestamp": r["timestamp"],
    }


# ===== Chat: per-user clear =====

@app.delete("/api/chat/clear-user")
async def chat_clear_user(username: str = ""):
    """Borrar todos los chats de un usuario (no borra los de otros usuarios)."""
    if not username:
        return {"deleted": 0}
    conn = _get_chat_db()
    try:
        cursor = conn.execute("DELETE FROM chat_messages WHERE username = ?", (username,))
        conn.commit()
        logger.info(f"Chat clear-user {username}: deleted {cursor.rowcount} messages")
        return {"deleted": cursor.rowcount}
    finally:
        conn.close()


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
