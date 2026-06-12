"""
Single-query inspector — opens the black box for one query.

Shows every intermediate step:
  - All 20 dense candidates from Qdrant with their cosine scores
  - BM25 scores and ranks for those same 20
  - RRF-fused scores and final ranking
  - Exact text sent to the LLM
  - Generated answer (optional, --answer flag)

Run from rag-books/:
  python -m backend.inspect_query --query "Who is Sirius Black?" --book-id hp3
  python -m backend.inspect_query --query "What is mitosis?" --book-id biology_campbell --answer
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from backend.embedder import get_model
from backend.retriever import RRF_K, get_client
from backend.config import QDRANT_COLLECTION
from qdrant_client.models import Filter, FieldCondition, MatchValue
from rank_bm25 import BM25Okapi

SEP  = "─" * 72
SEP2 = "═" * 72


def _shorten(text: str, n: int = 90) -> str:
    text = text.replace("\n", " ").strip()
    return text[:n] + "…" if len(text) > n else text


def inspect(query: str, book_id: str, generate_answer: bool = False) -> None:
    print(f"\n{SEP2}")
    print(f"  Query    : {query}")
    print(f"  Book ID  : {book_id}")
    print(f"  Model    : all-MiniLM-L6-v2  |  RRF k={RRF_K}")
    print(SEP2)

    # ── 1. Embed ──────────────────────────────────────────────────────────────
    print("\n[1] Embedding query...")
    model = get_model()
    query_vector = model.encode(query).tolist()
    print(f"    Vector dim: {len(query_vector)}")

    # ── 2. Dense retrieval ────────────────────────────────────────────────────
    print("\n[2] Dense retrieval (Qdrant top-20)...")
    results = get_client().search(
        collection_name=QDRANT_COLLECTION,
        query_vector=query_vector,
        limit=20,
        query_filter=Filter(must=[FieldCondition(key="book_id", match=MatchValue(value=book_id))]),
    )

    if not results:
        print("    No results returned. Is Qdrant running and the book ingested?")
        return

    candidates = [
        {
            "text":        r.payload["text"],
            "page_number": r.payload["page_number"],
            "book_id":     r.payload.get("book_id", book_id),
            "title":       r.payload.get("title", book_id),
            "char_offset": r.payload.get("char_offset", 0),
            "dense_score": r.score,
            "dense_rank":  i + 1,
        }
        for i, r in enumerate(results)
    ]

    # ── 3. BM25 scoring ───────────────────────────────────────────────────────
    print("[3] BM25 scoring over candidates...")
    tokenized  = [c["text"].split() for c in candidates]
    bm25       = BM25Okapi(tokenized)
    raw_bm25   = bm25.get_scores(query.split())

    bm25_order = sorted(range(len(candidates)), key=lambda i: raw_bm25[i], reverse=True)
    bm25_rank  = [0] * len(candidates)
    for rank, orig_idx in enumerate(bm25_order):
        bm25_rank[orig_idx] = rank + 1

    for i, c in enumerate(candidates):
        c["bm25_score"] = float(raw_bm25[i])
        c["bm25_rank"]  = bm25_rank[i]
        c["rrf_score"]  = 1 / (RRF_K + c["dense_rank"]) + 1 / (RRF_K + c["bm25_rank"])

    # ── 4. Full candidate table ───────────────────────────────────────────────
    print(f"\n{SEP}")
    print(f"  {'#':>2}  {'Page':>4}  {'Dense':>7}  {'D.Rank':>6}  {'BM25':>7}  {'B.Rank':>6}  {'RRF':>8}  Preview")
    print(SEP)
    for c in candidates:
        print(
            f"  {c['dense_rank']:>2}  {c['page_number']:>4}  "
            f"{c['dense_score']:>7.4f}  {c['dense_rank']:>6}  "
            f"{c['bm25_score']:>7.3f}  {c['bm25_rank']:>6}  "
            f"{c['rrf_score']:>8.5f}  {_shorten(c['text'], 60)}"
        )

    # ── 5. Final top-8 after RRF ──────────────────────────────────────────────
    top8 = sorted(candidates, key=lambda x: x["rrf_score"], reverse=True)[:8]
    print(f"\n{SEP}")
    print("  Final top-8 after RRF fusion")
    print(SEP)
    print(f"  {'Rank':>4}  {'Page':>4}  {'RRF':>8}  {'Dense':>7}  {'BM25':>7}  Preview")
    print(SEP)
    for rank, c in enumerate(top8, 1):
        print(
            f"  {rank:>4}  {c['page_number']:>4}  "
            f"{c['rrf_score']:>8.5f}  {c['dense_score']:>7.4f}  "
            f"{c['bm25_score']:>7.3f}  {_shorten(c['text'], 60)}"
        )

    # ── 6. Context sent to LLM ────────────────────────────────────────────────
    print(f"\n{SEP}")
    print("  LLM context (what the model sees)")
    print(SEP)
    for c in top8:
        print(f"\n  [p.{c['page_number']}]  {_shorten(c['text'], 120)}")

    # ── 7. Optional answer generation ─────────────────────────────────────────
    if generate_answer:
        print(f"\n{SEP}")
        print("  Generated answer")
        print(SEP)
        from backend.llm import generate

        async def _stream():
            async for event in generate(query, top8):
                if event.startswith("data: "):
                    data = event[6:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                        if obj.get("type") == "token":
                            print(obj["content"], end="", flush=True)
                    except Exception:
                        pass
            print()

        asyncio.run(_stream())

    print(f"\n{SEP2}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect a single RAG query step-by-step")
    parser.add_argument("--query",   required=True, help="The question to ask")
    parser.add_argument("--book-id", required=True, help="book_id to search within")
    parser.add_argument("--answer",  action="store_true", help="Also generate the LLM answer")
    args = parser.parse_args()
    inspect(args.query, args.book_id, generate_answer=args.answer)


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    main()
