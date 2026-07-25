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

from knowledge_base import get_system_prompt, get_format_hint
from llm_providers.deepseek import call_deepseek
from llm_providers.claude import call_claude

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
    description="Backend proxy para chat IA sindical — LLM + knowledge base sindical",
    version="0.1.0",
)

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
class ChatRequest(BaseModel):
    message: str
    formato: str = "consulta"  # podcast|reel|columna|entrevista|consulta
    history: list = []  # [{role, text, sections}]
    grade: str = "A"
    sector: str = "aceitero"


class ChatResponse(BaseModel):
    sections: list
    tags: list
    time: str
    raw: str = ""  # Raw LLM response for debugging


# ===== Endpoints =====
@app.get("/api/config")
async def get_config():
    """Return backend config for the app to know where to connect."""
    return {"backendUrl": APP_BACKEND_URL, "provider": LLM_PROVIDER}


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest) -> ChatResponse:
    """Main chat endpoint — receives user message, returns structured IA response."""

    # Build system prompt
    system_prompt = get_system_prompt(req.formato)
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

    return ChatResponse(
        sections=parsed.get("sections", []),
        tags=parsed.get("tags", [req.formato]),
        time=time_str,
        raw=raw_response,
    )


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "provider": LLM_PROVIDER,
        "timestamp": datetime.now().isoformat(),
    }


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

    # Fallback: wrap raw text as a single section
    return {
        "sections": [
            {
                "title": "Chateá con la IA Sindical",
                "body": raw.strip(),
                "quote": "",
                "quoteAuthor": "",
                "quoteSource": "",
            }
        ],
        "tags": ["respuesta-libre"],
    }
