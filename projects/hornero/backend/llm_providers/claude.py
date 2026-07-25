"""Claude (Anthropic) API adapter — also works with DashScope Anthropic-compatible endpoint"""

import httpx


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

    # Build messages array (Anthropic format: no system in messages, separate field)
    messages = []

    # Add conversation history (last 6 messages)
    for msg in history[-6:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        if role == "assistant" and msg.get("sections"):
            content = "\n".join(
                s.get("body", "") or s.get("quote", "") for s in msg["sections"]
            )
        else:
            content = msg.get("text", "")
        if content:
            messages.append({"role": role, "content": content})

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "system": system_prompt,
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
