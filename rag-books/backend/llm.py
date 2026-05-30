"""
LLM answer generation via OpenAI Chat Completions (streaming SSE).

Responsibilities:
- Builds a context block from retrieved chunks with page citations
- Streams tokens back as SSE events: {"type": "token", "content": "..."}
- Emits a citations event with source metadata for frontend navigation
- Emits a follow_ups event with 3 suggested follow-up questions
- Emits [DONE] to signal end of stream
"""

import json
import os
from typing import AsyncGenerator

from openai import AsyncOpenAI

SYSTEM_PROMPT = """You are an expert reading assistant with deep knowledge of literature.
Answer the user's question using ONLY the provided context passages.
Be specific and detailed — always include character names, place names, object names, and exact details when they appear in the context.
Do not summarise vaguely; quote or closely paraphrase specific details from the text.
Cite your sources inline using the format [p.X] where X is the page number.
If multiple passages are relevant, weave them together into a coherent answer and refer to them.
IMPORTANT: If the context does not contain the information needed to answer the question, say "There isn't enough information to answer this question." Do not attempt to answer using outside knowledge!
Another thing: Prefer these things: "Prefer exact terminology used by the author.
When summarizing, preserve the author's intended meaning.
If multiple passages conflict, explain the conflict rather than choosing one."
If the context genuinely doesn't contain enough information to answer fully, say so clearly."""

FOLLOW_UP_PROMPT = """Based on the question and answer below, suggest exactly 3 short follow-up questions a reader might want to ask next about this book.
Each question must be under 10 words. Return ONLY a JSON object like: {{"questions": ["...", "...", "..."]}}

Question: {query}
Answer: {answer}"""


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

    full_response = ""
    stream = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            full_response += delta
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

    # Generate follow-up questions based on the actual answer
    try:
        follow_up_response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": FOLLOW_UP_PROMPT.format(
                    query=query,
                    answer=full_response[:600],
                )}
            ],
            response_format={"type": "json_object"},
            max_tokens=120,
        )
        follow_up_text = follow_up_response.choices[0].message.content or "{}"
        follow_ups = json.loads(follow_up_text).get("questions", [])[:3]
    except Exception:
        follow_ups = []

    yield f"data: {json.dumps({'type': 'follow_ups', 'questions': follow_ups})}\n\n"
    yield "data: [DONE]\n\n"
