"""
LLM answer generation via OpenAI Chat Completions.

Responsibilities:
- Accepts a user query + list of retrieved chunks (from retriever)
- Builds a system prompt instructing the model to answer from context only
- Constructs the context block, including source tags: [book_id, page_number]
- Calls OpenAI API with streaming enabled
- Yields streamed tokens for server-sent events (SSE) delivery
- Final response includes structured source citations:
    [{book_id, page_number, char_offset, excerpt}]
  so the frontend can render clickable passage links
"""

# --- Imports ---

# --- Prompt builder ---
# system_prompt: instructs model to cite sources with [book_id:page] inline
# build_context_block(chunks) → formatted string of chunks with source labels

# --- generate(query, chunks) → AsyncGenerator[str] ---
# Build messages list
# Stream OpenAI response
# Yield each token
# After stream: yield final JSON citations block
