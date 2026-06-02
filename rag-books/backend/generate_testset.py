"""
Test set generator for RAG evaluation.

Samples pages evenly across each book, sends each page's text to GPT-4o-mini,
and asks it to write one evaluation question whose answer lives on that page.

Output: data/eval/testset.json
  [{
    "question":      "Who gives Harry the Marauder's Map?",
    "book_id":       "hp3",
    "title":         "Harry Potter and the Prisoner of Azkaban",
    "expected_page": 212,
    "question_type": "factual",     # factual | conceptual
    "difficulty":    "easy"         # easy | hard
  }, ...]

Run from rag-books/:
  python -m backend.generate_testset
  python -m backend.generate_testset --samples-per-book 30  # more questions
"""

import argparse
import json
import sys
import time
from pathlib import Path

import fitz
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from backend.config import EVAL_DIR, PDF_DIR

# ── Constants ─────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You write evaluation questions for a RAG (retrieval-augmented generation) system.

Given a passage from a book, produce ONE question a reader might genuinely ask,
whose answer is clearly present in the passage.

Rules:
- The question must be answerable from this passage alone.
- Do not quote the passage verbatim in the question.
- Prefer questions that require understanding, not just keyword matching.
- Return ONLY valid JSON — no prose, no markdown fences:
  {"question": "...", "question_type": "factual|conceptual", "difficulty": "easy|hard"}

question_type:
  factual    — asks for a specific name, number, event, definition, or quote
  conceptual — asks how/why something works, what it means, or its significance

difficulty:
  easy — answer uses words that appear almost verbatim in the question
  hard — answer requires inference, context, or understanding of the passage
"""

MIN_TEXT_LEN = 200   # discard pages with less text than this (figures, TOC, etc.)
TEXT_EXCERPT = 700   # chars of page text sent to GPT (keeps cost minimal)


# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_text_pages(pdf_path: Path) -> list[dict]:
    """Return [{page_number, text}] for every page with enough real text."""
    doc = fitz.open(str(pdf_path))
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if len(text) >= MIN_TEXT_LEN:
            pages.append({"page_number": i + 1, "text": text})
    doc.close()
    return pages


def sample_pages(pages: list[dict], n: int) -> list[dict]:
    """Pick n pages spread evenly across the book."""
    if len(pages) <= n:
        return pages
    step = len(pages) / n
    return [pages[int(i * step)] for i in range(n)]


def generate_question(client: OpenAI, title: str, author: str, page: dict) -> dict | None:
    """Call GPT-4o-mini to generate one question for a page. Returns None on failure."""
    excerpt = page["text"][:TEXT_EXCERPT]
    user_msg = f'Book: "{title}" by {author}\nPage {page["page_number"]}:\n\n{excerpt}'

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_completion_tokens=120,
            temperature=0.4,
        )
        raw = resp.choices[0].message.content or ""
        # Strip accidental markdown fences
        raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed = json.loads(raw)
        return {
            "question":      parsed["question"],
            "question_type": parsed.get("question_type", "factual"),
            "difficulty":    parsed.get("difficulty", "easy"),
        }
    except Exception as e:
        print(f"    [warn] GPT call failed for p.{page['page_number']}: {e}")
        return None


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate RAG eval test set")
    parser.add_argument("--samples-per-book", type=int, default=20,
                        help="Questions to generate per book (default: 20)")
    args = parser.parse_args()

    books_path = Path(__file__).resolve().parent.parent / "books.json"
    books = json.loads(books_path.read_text())

    client = OpenAI()
    testset: list[dict] = []

    for book in books:
        book_id    = book["book_id"]
        title      = book["title"]
        author     = book["author"]
        pdf_path   = PDF_DIR / book["pdf_filename"]

        if not pdf_path.exists():
            print(f"\n[SKIP] {title} — PDF not found")
            continue

        print(f"\n── {title} ({book_id}) ──")
        pages = extract_text_pages(pdf_path)
        print(f"  {len(pages)} pages with text → sampling {args.samples_per_book}")

        sampled = sample_pages(pages, args.samples_per_book)
        ok = 0

        for page in sampled:
            result = generate_question(client, title, author, page)
            if result:
                testset.append({
                    "question":      result["question"],
                    "book_id":       book_id,
                    "title":         title,
                    "expected_page": page["page_number"],
                    "question_type": result["question_type"],
                    "difficulty":    result["difficulty"],
                })
                ok += 1
                print(f"  p.{page['page_number']:>4}  [{result['question_type']:<11} {result['difficulty']:<4}]  {result['question'][:80]}")
            time.sleep(0.1)  # stay well within rate limits

        print(f"  → {ok}/{len(sampled)} questions generated")

    out_path = EVAL_DIR / "testset.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(testset, indent=2, ensure_ascii=False))

    print(f"\n{'='*60}")
    print(f"Saved {len(testset)} questions to {out_path}")

    # Summary breakdown
    by_book  = {}
    by_type  = {}
    by_diff  = {}
    for q in testset:
        by_book[q["title"]] = by_book.get(q["title"], 0) + 1
        by_type[q["question_type"]] = by_type.get(q["question_type"], 0) + 1
        by_diff[q["difficulty"]] = by_diff.get(q["difficulty"], 0) + 1

    print("\nBy book:")
    for t, n in by_book.items():
        print(f"  {t:<50} {n}")
    print(f"\nBy type:  {by_type}")
    print(f"By difficulty: {by_diff}")


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    main()
