"""
Batch RAG evaluator — runs every question in data/eval/testset.json through
the full pipeline and scores the results.

Retrieval metrics (always computed, zero API cost):
  Hit Rate@K   — was the expected page in the top-K chunks? (K = 3, 5, 8)
  MRR          — Mean Reciprocal Rank of the first chunk on the correct page
  Ctx Precision — fraction of top-8 chunks that are on the correct page

Answer quality (opt-in, requires --judge flag, uses GPT-4o-mini):
  Faithfulness   — every claim in the answer is supported by the context
  Relevance      — the answer actually addresses the question

Worst queries are flagged automatically (bottom 20% by MRR).

Run from rag-books/:
  python -m backend.evaluator                  # retrieval metrics only
  python -m backend.evaluator --judge          # + LLM answer quality scoring
  python -m backend.evaluator --book-id hp1   # single book
  python -m backend.evaluator --limit 10       # first N questions only
"""

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from backend.config import EVAL_DIR
from backend.retriever import retrieve

PAGE_TOLERANCE = 1   # ±N pages counts as a hit (chunk boundaries straddle pages)

JUDGE_PROMPT = """\
You are evaluating a RAG system's answer quality.

Question: {question}

Retrieved context:
{context}

Answer given:
{answer}

Evaluate both dimensions and reply ONLY with valid JSON (no markdown):
{{
  "faithful": true or false,
  "relevant": true or false
}}

faithful — every factual claim in the answer is directly supported by the context above (no hallucination)
relevant — the answer actually addresses the question being asked"""


# ── Metrics ───────────────────────────────────────────────────────────────────

def _on_page(chunk: dict, expected: int) -> bool:
    return abs(chunk["page_number"] - expected) <= PAGE_TOLERANCE


def hit_at_k(chunks: list[dict], expected: int, k: int) -> bool:
    return any(_on_page(c, expected) for c in chunks[:k])


def reciprocal_rank(chunks: list[dict], expected: int) -> float:
    for i, c in enumerate(chunks):
        if _on_page(c, expected):
            return 1.0 / (i + 1)
    return 0.0


def context_precision(chunks: list[dict], expected: int) -> float:
    if not chunks:
        return 0.0
    return sum(1 for c in chunks if _on_page(c, expected)) / len(chunks)


# ── LLM answer generation ─────────────────────────────────────────────────────

async def _collect_answer(query: str, chunks: list[dict]) -> str:
    from backend.llm import generate
    full = ""
    async for event in generate(query, chunks):
        if event.startswith("data: "):
            data = event[6:].strip()
            if data == "[DONE]":
                break
            try:
                obj = json.loads(data)
                if obj.get("type") == "token":
                    full += obj["content"]
            except Exception:
                pass
    return full


def get_answer(query: str, chunks: list[dict]) -> str:
    return asyncio.run(_collect_answer(query, chunks))


# ── LLM judge ─────────────────────────────────────────────────────────────────

def judge_answer(client, question: str, chunks: list[dict], answer: str) -> dict:
    context = "\n\n".join(f"[p.{c['page_number']}] {c['text'][:300]}" for c in chunks)
    prompt  = JUDGE_PROMPT.format(question=question, context=context, answer=answer[:600])
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60,
            temperature=0,
        )
        raw = resp.choices[0].message.content or "{}"
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed = json.loads(raw)
        return {
            "faithful": bool(parsed.get("faithful", False)),
            "relevant": bool(parsed.get("relevant", False)),
        }
    except Exception as e:
        return {"faithful": None, "relevant": None, "_error": str(e)}


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate the RAG pipeline on the test set")
    parser.add_argument("--judge",   action="store_true", help="Run LLM-as-judge for answer quality")
    parser.add_argument("--book-id", help="Evaluate only questions for this book_id")
    parser.add_argument("--limit",   type=int, help="Only evaluate the first N questions")
    args = parser.parse_args()

    testset_path = EVAL_DIR / "testset.json"
    if not testset_path.exists():
        print("testset.json not found. Run: python -m backend.generate_testset")
        sys.exit(1)

    testset: list[dict] = json.loads(testset_path.read_text())
    if args.book_id:
        testset = [q for q in testset if q["book_id"] == args.book_id]
    if args.limit:
        testset = testset[: args.limit]

    if not testset:
        print("No questions matched the filters.")
        sys.exit(0)

    oai_client = None
    if args.judge:
        from openai import OpenAI
        oai_client = OpenAI()

    print(f"\nEvaluating {len(testset)} questions"
          + (" (+ LLM judge)" if args.judge else " (retrieval only)"))
    print("─" * 60)

    results = []
    for idx, q in enumerate(testset, 1):
        query    = q["question"]
        book_id  = q["book_id"]
        expected = q["expected_page"]

        print(f"  [{idx:>3}/{len(testset)}] {book_id:<20} p.{expected:<4} {query[:55]}", end="", flush=True)

        # Retrieve
        try:
            chunks = retrieve(query, book_id)
        except Exception as e:
            print(f"  → RETRIEVAL ERROR: {e}")
            continue

        retrieved_pages = [c["page_number"] for c in chunks]
        rr  = reciprocal_rank(chunks, expected)
        h3  = hit_at_k(chunks, expected, 3)
        h5  = hit_at_k(chunks, expected, 5)
        h8  = hit_at_k(chunks, expected, 8)
        cp  = context_precision(chunks, expected)

        hit_str = ("HIT@3" if h3 else "HIT@5" if h5 else "HIT@8" if h8 else "MISS ")
        print(f"  {hit_str}  MRR={rr:.2f}", end="")

        result = {
            "question":         query,
            "book_id":          book_id,
            "question_type":    q.get("question_type", ""),
            "difficulty":       q.get("difficulty", ""),
            "expected_page":    expected,
            "retrieved_pages":  retrieved_pages,
            "hit_at_3":         h3,
            "hit_at_5":         h5,
            "hit_at_8":         h8,
            "rr":               round(rr, 4),
            "context_precision": round(cp, 4),
        }

        # Optional LLM judge
        if args.judge and oai_client:
            answer = get_answer(query, chunks)
            scores = judge_answer(oai_client, query, chunks, answer)
            result["answer"]    = answer
            result["faithful"]  = scores["faithful"]
            result["relevant"]  = scores["relevant"]
            f_str = ("F✓" if scores["faithful"] else "F✗") if scores["faithful"] is not None else "F?"
            r_str = ("R✓" if scores["relevant"] else "R✗") if scores["relevant"] is not None else "R?"
            print(f"  {f_str} {r_str}", end="")
            time.sleep(0.1)

        print()
        results.append(result)

    # ── Summary ───────────────────────────────────────────────────────────────

    n = len(results)
    hr3 = sum(r["hit_at_3"] for r in results) / n
    hr5 = sum(r["hit_at_5"] for r in results) / n
    hr8 = sum(r["hit_at_8"] for r in results) / n
    mrr = sum(r["rr"]       for r in results) / n
    cp  = sum(r["context_precision"] for r in results) / n

    print(f"\n{'═'*60}")
    print("  RETRIEVAL METRICS")
    print(f"{'─'*60}")
    print(f"  Hit Rate@3 : {hr3:.3f}  ({sum(r['hit_at_3'] for r in results)}/{n})")
    print(f"  Hit Rate@5 : {hr5:.3f}  ({sum(r['hit_at_5'] for r in results)}/{n})")
    print(f"  Hit Rate@8 : {hr8:.3f}  ({sum(r['hit_at_8'] for r in results)}/{n})")
    print(f"  MRR        : {mrr:.3f}")
    print(f"  Ctx Prec.  : {cp:.3f}  (avg fraction of top-8 on correct page)")

    summary = {
        "total": n,
        "hit_rate_at_3": round(hr3, 4),
        "hit_rate_at_5": round(hr5, 4),
        "hit_rate_at_8": round(hr8, 4),
        "mrr":           round(mrr, 4),
        "context_precision": round(cp, 4),
    }

    if args.judge:
        judged = [r for r in results if r.get("faithful") is not None]
        if judged:
            faith = sum(1 for r in judged if r["faithful"]) / len(judged)
            relev = sum(1 for r in judged if r["relevant"]) / len(judged)
            print(f"\n  ANSWER QUALITY  (n={len(judged)})")
            print(f"{'─'*60}")
            print(f"  Faithfulness   : {faith:.3f}  ({sum(1 for r in judged if r['faithful'])}/{len(judged)})")
            print(f"  Relevance      : {relev:.3f}  ({sum(1 for r in judged if r['relevant'])}/{len(judged)})")
            summary["faithfulness"] = round(faith, 4)
            summary["answer_relevance"] = round(relev, 4)

    # ── Worst queries ─────────────────────────────────────────────────────────
    misses = sorted([r for r in results if not r["hit_at_8"]], key=lambda r: r["rr"])
    near   = sorted([r for r in results if r["hit_at_8"] and not r["hit_at_3"]],
                    key=lambda r: r["rr"])
    worst  = (misses + near)[:10]

    if worst:
        print(f"\n  WORST QUERIES (complete misses first, then late hits)")
        print(f"{'─'*60}")
        for r in worst:
            status = "MISS" if not r["hit_at_8"] else f"HIT@{'5' if r['hit_at_5'] else '8'}"
            pages  = r["retrieved_pages"]
            print(f"  [{r['book_id']:<20}] p.{r['expected_page']:<4} {status}  "
                  f"retrieved={pages}  {r['question'][:55]}")

    # ── Save ──────────────────────────────────────────────────────────────────
    output = {"summary": summary, "results": results}
    out_path = EVAL_DIR / "results.json"
    out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"\n  Results saved → {out_path}")
    print(f"{'═'*60}\n")


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    main()
