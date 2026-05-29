"""
Hybrid retrieval: dense vector search + BM25 re-ranking.

Responsibilities:
- Accepts a natural language query and a book_id filter
- Step 1 — Dense retrieval: embed query, search Qdrant for top-20 candidates within the book
- Step 2 — Sparse re-rank: apply BM25 over candidate texts to re-score and reorder
- Returns top-k results with full metadata for LLM context and frontend navigation
"""

from rank_bm25 import BM25Okapi
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from backend.config import QDRANT_HOST, QDRANT_PORT, QDRANT_COLLECTION
from backend.embedder import get_model

_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    return _client


def retrieve(query: str, book_id: str, top_k: int = 5) -> list[dict]:
    model = get_model()
    query_vector = model.encode(query).tolist()

    results = get_client().search(
        collection_name=QDRANT_COLLECTION,
        query_vector=query_vector,
        limit=20,
        query_filter=Filter(
            must=[FieldCondition(key="book_id", match=MatchValue(value=book_id))]
        ),
    )

    if not results:
        return []

    candidates = [
        {
            "text": r.payload["text"],
            "book_id": r.payload["book_id"],
            "page_number": r.payload["page_number"],
            "char_offset": r.payload["char_offset"],
            "title": r.payload.get("title", ""),
            "author": r.payload.get("author", ""),
            "dense_score": r.score,
        }
        for r in results
    ]

    tokenized = [c["text"].split() for c in candidates]
    bm25 = BM25Okapi(tokenized)
    bm25_scores = bm25.get_scores(query.split())

    for candidate, bm25_score in zip(candidates, bm25_scores):
        candidate["score"] = float(bm25_score)

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:top_k]
