"""
LLM answer generation via OpenAI Chat Completions (streaming SSE).

Responsibilities:
- Builds a context block from retrieved chunks with page citations
- Streams tokens back as SSE events: {"type": "token", "content": "..."}
- Emits a final citations event with source metadata for frontend navigation
- Emits [DONE] to signal end of stream
"""

import json
import os
from typing import AsyncGenerator

from openai import AsyncOpenAI

SYSTEM_PROMPT = """You are a helpful reading assistant. Answer the user's question using ONLY the provided context passages.
Cite your sources inline using the format [p.X] where X is the page number.
If the context doesn't contain enough information, say so — do not invent answers."""


def _build_context(chunks: list[dict]) -> str:
    return "\n\n".join(
        f"[p.{c['page_number']}] {c['text'].strip()}" for c in chunks
    )


async def generate(query: str, chunks: list[dict]) -> AsyncGenerator[str, None]:
    client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    context = _build_context(chunks)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"},
    ]

    stream = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"

    sources = [
        {
            "page_number": c["page_number"],
            "char_offset": c["char_offset"],
            "text": c["text"][:120],
            "title": c["title"],
        }
        for c in chunks
    ]
    yield f"data: {json.dumps({'type': 'citations', 'sources': sources})}\n\n"
    yield "data: [DONE]\n\n"
