"""DeepSeek API adapter — OpenAI-compatible format

Supports both synchronous (call_deepseek) and streaming (call_deepseek_stream) modes.
The streaming mode uses SSE to yield tokens as they arrive from the LLM.
"""

import json
import httpx

DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions"


def _build_messages(system_prompt: str, user_message: str, history: list) -> list:
    """Build the messages array for the LLM request."""
    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 30 messages for full session context)
    for msg in history[-30:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        # For assistant messages, prefer text over sections for conversational context
        if role == "assistant":
            if msg.get("text"):
                content = msg["text"]
            elif msg.get("sections"):
                content = "\n".join(
                    s.get("body", "") or s.get("quote", "") for s in msg["sections"]
                )
            else:
                content = ""
        else:
            content = msg.get("text", "")
        if content:
            messages.append({"role": role, "content": content})

    # Add current user message
    messages.append({"role": "user", "content": user_message})
    return messages


async def call_deepseek(
    api_key: str,
    system_prompt: str,
    user_message: str,
    history: list,
    model: str = "deepseek-chat",
    temperature: float = 0.3,
    max_tokens: int = 2000,
    base_url: str = DEEPSEEK_CHAT_URL,
) -> str:
    """Call DeepSeek API and return the assistant message content."""

    messages = _build_messages(system_prompt, user_message, history)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(base_url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    return data["choices"][0]["message"]["content"]


async def call_deepseek_stream(
    api_key: str,
    system_prompt: str,
    user_message: str,
    history: list,
    model: str = "deepseek-chat",
    temperature: float = 0.3,
    max_tokens: int = 2000,
    base_url: str = DEEPSEEK_CHAT_URL,
):
    """Call DeepSeek API with streaming and yield tokens as they arrive.

    Yields dicts with:
      - {"type": "token", "content": "..."} — each token chunk
      - {"type": "done", "full_text": "..."} — complete response text

    The caller can parse the full_text as JSON to extract tags/persona/etc.
    """
    messages = _build_messages(system_prompt, user_message, history)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }

    full_text = ""

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", base_url, json=payload, headers=headers) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                line = line.strip()
                if not line:
                    continue
                if not line.startswith("data: "):
                    continue

                data_str = line[6:]  # Remove "data: " prefix
                if data_str == "[DONE]":
                    break

                try:
                    chunk = json.loads(data_str)
                except json.JSONDecodeError:
                    continue

                choices = chunk.get("choices", [])
                if not choices:
                    continue

                delta = choices[0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    full_text += content
                    yield {"type": "token", "content": content}

    # Yield the complete response for final parsing
    yield {"type": "done", "full_text": full_text}
