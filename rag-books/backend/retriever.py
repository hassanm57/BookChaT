"""
Hybrid retrieval: dense vector search + BM25, fused via Reciprocal Rank Fusion (RRF).

Pipeline:
1. Dense retrieval  — embed query, fetch top-20 candidates from Qdrant
2. BM25 scoring     — score the same 20 candidates with BM25
3. RRF fusion       — combine both ranked lists: score = 1/(k+dense_rank) + 1/(k+bm25_rank)
4. Return top-k     — sorted by RRF score, with all intermediate scores for inspection

RRF constant k=60 is the standard value; it dampens the influence of very high ranks
so that a result ranked #1 in one list but absent in the other isn't over-penalised.
"""

from rank_bm25 import BM25Okapi
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from backend.config import QDRANT_HOST, QDRANT_PORT, QDRANT_COLLECTION
from backend.embedder import get_model

_client: QdrantClient | None = None
RRF_K = 60


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    return _client


def retrieve(query: str, book_id: str, user_id: str | None = None, top_k: int = 8) -> list[dict]:
    model = get_model()
    query_vector = model.encode(query).tolist()

    must = [FieldCondition(key="book_id", match=MatchValue(value=book_id))]
    if user_id:
        must.append(FieldCondition(key="user_id", match=MatchValue(value=user_id)))

    results = get_client().search(
        collection_name=QDRANT_COLLECTION,
        query_vector=query_vector,
        limit=20,
        query_filter=Filter(must=must),
    )

    if not results:
        return []

    # Qdrant returns results sorted by cosine similarity descending — dense_rank is already known
    candidates = [
        {
            "text": r.payload["text"],
            "book_id": r.payload["book_id"],
            "page_number": r.payload["page_number"],
            "char_offset": r.payload["char_offset"],
            "title": r.payload.get("title", ""),
            "author": r.payload.get("author", ""),
            "dense_score": r.score,
            "dense_rank": i + 1,
        }
        for i, r in enumerate(results)
    ]

    # BM25 over the candidate texts
    tokenized = [c["text"].split() for c in candidates]
    bm25 = BM25Okapi(tokenized)
    raw_bm25 = bm25.get_scores(query.split())

    # Derive BM25 ranks (highest score = rank 1)
    bm25_order = sorted(range(len(candidates)), key=lambda i: raw_bm25[i], reverse=True)
    bm25_rank = [0] * len(candidates)
    for rank, orig_idx in enumerate(bm25_order):
        bm25_rank[orig_idx] = rank + 1

    # RRF fusion
    for i, c in enumerate(candidates):
        c["bm25_score"] = float(raw_bm25[i])
        c["bm25_rank"] = bm25_rank[i]
        c["score"] = 1 / (RRF_K + c["dense_rank"]) + 1 / (RRF_K + c["bm25_rank"])

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:top_k]
