"""
Hybrid retrieval: dense vector search + BM25 re-ranking.

Responsibilities:
- Accepts a natural language query and optional book_id filter
- Step 1 — Dense retrieval: embed query, search Qdrant for top-N candidates
- Step 2 — Sparse re-rank: apply BM25 over candidate texts to re-score and reorder
- Returns top-k results, each with:
    text         — the chunk text (used as LLM context)
    book_id      — source book
    page_number  — for PDF viewer navigation
    char_offset  — for highlight anchoring in the frontend
    score        — final relevance score
- BM25 index is built lazily per request over the candidate set (no pre-indexing needed at this scale)
"""

# --- Imports ---

# --- Qdrant client (singleton) ---

# --- retrieve(query, book_id=None, top_k=5) → List[dict] ---
# 1. embed query via embedder.get_model()
# 2. Qdrant search with optional book_id filter, retrieve top N (e.g. 20)
# 3. BM25 re-rank candidates → take top_k
# 4. Return results with full metadata
