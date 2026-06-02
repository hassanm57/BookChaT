"""
Re-ingestion script — wipes and rebuilds Qdrant vectors for all books
using the current CHUNK_SIZE / CHUNK_OVERLAP from config.py.

Handles two book sources:
  Seed books  — defined in books.json, PDFs on local disk at data/pdfs/
  User books  — stored in Supabase DB + Storage (requires .env credentials)

Run from rag-books/:
  python -m backend.reindex                  # reindex everything
  python -m backend.reindex --seed-only      # seed books only (no Supabase needed)
  python -m backend.reindex --book-id <id>   # single book by book_id
"""

import argparse
import json
import sys
from pathlib import Path
from uuid import uuid4

import fitz
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    FilterSelector,
    MatchValue,
    PointStruct,
    VectorParams,
)

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from backend.chunker import chunk_text
from backend.config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    PDF_DIR,
    QDRANT_COLLECTION,
    QDRANT_HOST,
    QDRANT_PORT,
)
from backend.embedder import embed_chunks


# ── Qdrant helpers ────────────────────────────────────────────────────────────

def get_qdrant() -> QdrantClient:
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    existing = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print(f"  Created Qdrant collection '{QDRANT_COLLECTION}'")
    return client


def delete_book_vectors(client: QdrantClient, book_id: str) -> None:
    client.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=FilterSelector(
            filter=Filter(must=[FieldCondition(key="book_id", match=MatchValue(value=book_id))])
        ),
    )


def upsert(client: QdrantClient, chunks: list[dict], title: str, author: str, user_id: str | None = None) -> None:
    for i in range(0, len(chunks), 100):
        batch = chunks[i : i + 100]
        payload_base = {"title": title, "author": author}
        if user_id:
            payload_base["user_id"] = user_id
        points = [
            PointStruct(
                id=str(uuid4()),
                vector=c["vector"],
                payload={
                    **payload_base,
                    "text": c["text"],
                    "book_id": c["book_id"],
                    "page_number": c["page_number"],
                    "char_offset": c["char_offset"],
                },
            )
            for c in batch
        ]
        client.upsert(collection_name=QDRANT_COLLECTION, points=points)


# ── PDF helpers ───────────────────────────────────────────────────────────────

def extract_pages(pdf_bytes_or_path) -> list[dict]:
    if isinstance(pdf_bytes_or_path, bytes):
        doc = fitz.open(stream=pdf_bytes_or_path, filetype="pdf")
    else:
        doc = fitz.open(str(pdf_bytes_or_path))
    pages = [{"page_number": i + 1, "text": page.get_text()} for i, page in enumerate(doc)]
    doc.close()
    return pages


# ── Core reindex logic ────────────────────────────────────────────────────────

def reindex_book(client: QdrantClient, book_id: str, title: str, author: str,
                 pdf_bytes_or_path, user_id: str | None = None) -> int:
    print(f"  Deleting old vectors for '{book_id}'...")
    delete_book_vectors(client, book_id)

    print(f"  Extracting text...")
    pages = extract_pages(pdf_bytes_or_path)
    non_empty = [p for p in pages if p["text"].strip()]
    print(f"  {len(pages)} pages, {len(non_empty)} with text")

    print(f"  Chunking  (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})...")
    chunks = chunk_text(pages, book_id)
    print(f"  {len(chunks)} chunks")

    print(f"  Embedding...")
    chunks = embed_chunks(chunks)

    print(f"  Upserting to Qdrant...")
    upsert(client, chunks, title=title, author=author, user_id=user_id)

    return len(chunks)


# ── Seed books (books.json + local PDFs) ─────────────────────────────────────

def reindex_seed_books(client: QdrantClient, target_id: str | None = None) -> None:
    books_path = Path(__file__).resolve().parent.parent / "books.json"
    if not books_path.exists():
        print("books.json not found — skipping seed books")
        return

    books = json.loads(books_path.read_text())
    for book in books:
        book_id = book["book_id"]
        if target_id and book_id != target_id:
            continue

        pdf_path = PDF_DIR / book["pdf_filename"]
        if not pdf_path.exists():
            print(f"\n[SKIP] {book['title']} — PDF not found at {pdf_path}")
            continue

        print(f"\n── Seed: {book['title']} ({book_id}) ──")
        n = reindex_book(
            client, book_id,
            title=book["title"], author=book["author"],
            pdf_bytes_or_path=pdf_path,
        )
        print(f"  ✓ {n} vectors stored")


# ── User books (Supabase DB + Storage) ───────────────────────────────────────

def reindex_user_books(client: QdrantClient, target_id: str | None = None) -> None:
    try:
        from backend.supabase_client import get_supabase
    except Exception as e:
        print(f"Cannot import Supabase client: {e}")
        return

    try:
        sb = get_supabase()
        rows = sb.table("books").select("book_id,title,author,pdf_filename,user_id,status").execute().data
    except Exception as e:
        print(f"Supabase query failed: {e}")
        return

    if not rows:
        print("No user books found in Supabase.")
        return

    for row in rows:
        book_id = row["book_id"]
        if target_id and book_id != target_id:
            continue
        if row.get("status") == "error":
            print(f"\n[SKIP] {row['title']} — status=error")
            continue

        print(f"\n── User book: {row['title']} ({book_id}) ──")
        user_id = row["user_id"]
        pdf_path_storage = f"{user_id}/{book_id}.pdf"

        try:
            print(f"  Downloading PDF from Storage ({pdf_path_storage})...")
            pdf_bytes = bytes(sb.storage.from_("pdfs").download(pdf_path_storage))
        except Exception as e:
            print(f"  [SKIP] Could not download PDF: {e}")
            continue

        n = reindex_book(
            client, book_id,
            title=row["title"], author=row["author"],
            pdf_bytes_or_path=pdf_bytes,
            user_id=user_id,
        )
        print(f"  ✓ {n} vectors stored")


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Re-ingest books into Qdrant with current chunk settings")
    parser.add_argument("--seed-only", action="store_true", help="Only reindex seed books (no Supabase)")
    parser.add_argument("--user-only", action="store_true", help="Only reindex user-uploaded books")
    parser.add_argument("--book-id", help="Reindex a single book by book_id")
    args = parser.parse_args()

    print(f"\nReindex — CHUNK_SIZE={CHUNK_SIZE}, CHUNK_OVERLAP={CHUNK_OVERLAP}")
    print("=" * 60)

    client = get_qdrant()

    if not args.user_only:
        print("\n[Seed books]")
        reindex_seed_books(client, target_id=args.book_id)

    if not args.seed_only:
        print("\n[User books]")
        reindex_user_books(client, target_id=args.book_id)

    print("\n" + "=" * 60)
    print("Reindex complete.")


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    main()
