"""
PDF ingestion pipeline for seed books.

Responsibilities:
- Iterates over all PDFs in PDF_DIR
- Extracts text per page using PyMuPDF (fitz), preserving page numbers
- Extracts first page as a cover image, saves to COVERS_DIR
- Passes raw page text to chunker, receives chunks with metadata
- Passes chunks to embedder, receives dense vectors
- Upserts vectors + metadata (book_id, page_number, char_offset, text) into Qdrant
- Runnable as: python backend/ingest.py  (from inside rag-books/)
"""

import json
import sys
from pathlib import Path
from uuid import uuid4

import fitz  # PyMuPDF
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from backend.config import (
    COVERS_DIR,
    PDF_DIR,
    QDRANT_COLLECTION,
    QDRANT_HOST,
    QDRANT_PORT,
)
from backend.chunker import chunk_text
from backend.embedder import embed_chunks

# --- Helpers ---

def extract_cover(pdf_path: Path, book_id: str) -> None:
    doc = fitz.open(pdf_path)
    page = doc[0]
    pixmap = page.get_pixmap(dpi=150)
    out_path = COVERS_DIR / f"{book_id}_cover.jpg"
    pixmap.save(str(out_path))
    doc.close()


def extract_pages(pdf_path: Path) -> list[dict]:
    doc = fitz.open(pdf_path)
    pages = [{"page_number": i + 1, "text": page.get_text()} for i, page in enumerate(doc)]
    doc.close()
    return pages


def ensure_collection(client: QdrantClient) -> None:
    existing = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print(f"Created collection '{QDRANT_COLLECTION}'")


def upsert_chunks(client: QdrantClient, chunks: list[dict], title: str, author: str) -> None:
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        points = [
            PointStruct(
                id=str(uuid4()),
                vector=c["vector"],
                payload={
                    "text": c["text"],
                    "book_id": c["book_id"],
                    "page_number": c["page_number"],
                    "char_offset": c["char_offset"],
                    "title": title,
                    "author": author,
                },
            )
            for c in batch
        ]
        client.upsert(collection_name=QDRANT_COLLECTION, points=points)


# --- Main ---

def main() -> None:
    books_path = Path(__file__).resolve().parent.parent / "books.json"
    books = json.loads(books_path.read_text())

    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    ensure_collection(client)

    for book in books:
        book_id = book["book_id"]
        pdf_path = PDF_DIR / book["pdf_filename"]

        if not pdf_path.exists():
            print(f"  SKIP {book['title']} — PDF not found at {pdf_path}")
            continue

        print(f"\nIngesting: {book['title']}")

        print("  Extracting cover...")
        extract_cover(pdf_path, book_id)

        print("  Extracting text...")
        pages = extract_pages(pdf_path)

        print("  Chunking text...")
        chunks = chunk_text(pages, book_id)
        print(f"  {len(chunks)} chunks created")

        print("  Embedding...")
        chunks = embed_chunks(chunks)

        print("  Upserting to Qdrant...")
        upsert_chunks(client, chunks, title=book["title"], author=book["author"])

        print(f"  Done — {len(chunks)} vectors stored")

    print("\nIngestion complete.")


if __name__ == "__main__":
    # Allow running as: python backend/ingest.py from inside rag-books/
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    main()
