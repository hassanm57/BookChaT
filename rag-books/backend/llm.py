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

SYSTEM_PROMPT = """You are an expert reading assistant helping a user understand their book.
You are given a set of passages extracted from the book, each labelled with its page number [p.X].
These passages are a representative sample — not every page — selected because they are most relevant to the question.

Follow these rules based on the type of question:

SPECIFIC QUESTIONS (about a character, event, quote, definition, or detail):
  - Answer directly from the passages. Cite page numbers inline as [p.X].
  - If the passages don't contain the exact detail, say what related information you do have and answer as fully as you can from it.

BROAD / SYNTHESIS QUESTIONS (summaries, themes, key ideas, chapter overviews, comparisons):
  - Use the provided passages as anchors and synthesize the most useful answer you can.
  - For chapter summaries: weave the available fragments into a coherent arc — what the chapter opens with, what develops, and how it resolves — based on the passages at hand. Clearly note you are working from excerpts, not every page.
  - For whole-book summaries or "key ideas": draw on the passages to identify recurring themes, major arguments, and central threads. Be confident — a thoughtful synthesis from representative excerpts is genuinely useful.
  - It is always better to give a partial but honest synthesis than to refuse or deflect.

ALWAYS:
  - Cite inline as [p.X] — never say "the book says", "according to the context", or "in the provided passages".
  - Use the author's exact terminology. Preserve their intended meaning.
  - If passages conflict with each other, surface the tension rather than picking a side.
  - Do not invent names, facts, or events that do not appear in the passages.
  - Never respond with a flat refusal. If your coverage is limited, say so briefly, then give your best synthesis from what you have.
  - Write in plain prose only. Never use markdown: no **, no __, no ##, no ###, no bullet dashes, no numbered lists with markdown syntax. Use natural paragraph breaks and plain numbered sentences if listing is needed."""

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
        model="gpt-5.4-mini",
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
            model="gpt-5.4-mini",
            messages=[
                {"role": "user", "content": FOLLOW_UP_PROMPT.format(
                    query=query,
                    answer=full_response[:600],
                )}
            ],
            response_format={"type": "json_object"},
            max_completion_tokens=120,
        )
        follow_up_text = follow_up_response.choices[0].message.content or "{}"
        follow_ups = json.loads(follow_up_text).get("questions", [])[:3]
    except Exception:
        follow_ups = []

    yield f"data: {json.dumps({'type': 'follow_ups', 'questions': follow_ups})}\n\n"
    yield "data: [DONE]\n\n"
