"""DeepSeek API adapter — OpenAI-compatible format"""

import httpx

DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions"


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

    # Build messages array
    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 12 messages for better context)
    for msg in history[-12:]:
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
