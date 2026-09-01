"""Claude (Anthropic) API adapter — also works with DashScope Anthropic-compatible endpoint

Supports both synchronous (call_claude) and streaming (call_claude_stream) modes.
Streaming yields tokens as they arrive, keeping the SSE connection alive on Render.
"""

import json
import httpx


def _build_messages(system_prompt: str, user_message: str, history: list) -> tuple:
    """Build system prompt string and messages array for the LLM request.

    Returns (system_prompt, messages) — Anthropic format uses separate system field.
    """
    messages = []

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
    return system_prompt, messages


async def call_claude(
    api_key: str,
    system_prompt: str,
    user_message: str,
    history: list,
    model: str = "glm-5.1",
    temperature: float = 0.3,
    max_tokens: int = 2000,
    base_url: str = "https://dashscope.aliyuncs.com/apps/anthropic/v1/messages",
) -> str:
    """Call Anthropic-compatible API (standard Anthropic or DashScope) and return the assistant message content."""

    system_text, messages = _build_messages(system_prompt, user_message, history)

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "system": system_text,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            base_url, json=payload, headers=headers
        )
        response.raise_for_status()
        data = response.json()

    # Extract text from response content blocks
    text_blocks = [
        block["text"] for block in data["content"] if block["type"] == "text"
    ]
    return "".join(text_blocks)


async def call_claude_stream(
    api_key: str,
    system_prompt: str,
    user_message: str,
    history: list,
    model: str = "glm-5.1",
    temperature: float = 0.3,
    max_tokens: int = 2000,
    base_url: str = "https://dashscope.aliyuncs.com/apps/anthropic/v1/messages",
):
    """Call Anthropic-compatible API with streaming and yield tokens as they arrive.

    Yields dicts with:
      - {"type": "token", "content": "..."} — each token chunk
      - {"type": "done", "full_text": "..."} — complete response text

    Works with standard Anthropic API and DashScope Anthropic-compatible endpoint.
    Keeps the SSE connection alive on Render by sending tokens as they arrive.
    """
    system_text, messages = _build_messages(system_prompt, user_message, history)

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "system": system_text,
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
                    # SSE comment or event type line — skip
                    continue

                data_str = line[6:]  # Remove "data: " prefix
                if data_str == "[DONE]":
                    break

                try:
                    chunk = json.loads(data_str)
                except json.JSONDecodeError:
                    continue

                # Anthropic streaming format:
                # content_block_delta events have delta.type="text_delta" with delta.text
                event_type = chunk.get("type", "")
                if event_type == "content_block_delta":
                    delta = chunk.get("delta", {})
                    if delta.get("type") == "text_delta":
                        content = delta.get("text", "")
                        if content:
                            full_text += content
                            yield {"type": "token", "content": content}
                elif event_type == "message_stop":
                    break
                elif event_type == "error":
                    error_data = chunk.get("error", {})
                    raise httpx.HTTPStatusError(
                        f"Claude API error: {error_data.get('message', 'unknown')}",
                        request=None,
                        response=None,
                    )

    # Yield the complete response for final parsing
    yield {"type": "done", "full_text": full_text}
