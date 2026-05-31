"""
User PDF upload handler.

Flow:
1. Validate the uploaded file is a PDF
2. Upload PDF bytes to Supabase Storage: pdfs/{user_id}/{book_id}.pdf
3. Run the ingest pipeline (extract → chunk → embed → upsert Qdrant)
4. Extract cover image, upload to Supabase Storage: covers/{user_id}/{book_id}_cover.jpg
5. Insert a row into the public.books table
6. Return the new book record
"""

import io
import os
import tempfile
from pathlib import Path
from uuid import uuid4

import fitz  # PyMuPDF
from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from backend.auth import get_current_user
from backend.chunker import chunk_text
from backend.config import QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT
from backend.embedder import embed_chunks
from backend.supabase_client import get_supabase

router = APIRouter()

PDF_MAGIC = b"%PDF-"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def _validate_pdf(data: bytes) -> None:
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit")
    if not data.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="File is not a valid PDF")


def _get_qdrant() -> QdrantClient:
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    existing = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
    return client


def _upsert_chunks(client: QdrantClient, chunks: list[dict], title: str, author: str, user_id: str) -> None:
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
                    "user_id": user_id,
                },
            )
            for c in batch
        ]
        client.upsert(collection_name=QDRANT_COLLECTION, points=points)


@router.post("/upload")
async def upload_book(
    file: UploadFile = File(...),
    title: str = Form(...),
    author: str = Form(...),
    genre: str = Form("General"),
    user_id: str = Depends(get_current_user),
):
    data = await file.read()
    _validate_pdf(data)

    sb = get_supabase()
    book_id = str(uuid4())
    safe_filename = f"{book_id}.pdf"

    # ── 1. Upload PDF to Supabase Storage ────────────────────────────────────
    pdf_path = f"{user_id}/{safe_filename}"
    sb.storage.from_("pdfs").upload(pdf_path, data, {"content-type": "application/pdf"})

    # ── 2. Ingest pipeline ───────────────────────────────────────────────────
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(data)
        tmp_path = Path(tmp.name)

    try:
        doc = fitz.open(str(tmp_path))

        # Extract text pages
        pages = [{"page_number": i + 1, "text": page.get_text()} for i, page in enumerate(doc)]

        # Extract cover image
        cover_data: bytes | None = None
        if doc.page_count > 0:
            pixmap = doc[0].get_pixmap(dpi=150)
            cover_data = pixmap.tobytes("jpeg")

        doc.close()
    finally:
        tmp_path.unlink(missing_ok=True)

    # Chunk → embed → upsert
    chunks = chunk_text(pages, book_id)
    chunks = embed_chunks(chunks)
    qdrant = _get_qdrant()
    _upsert_chunks(qdrant, chunks, title=title, author=author, user_id=user_id)

    # ── 3. Upload cover to Supabase Storage ──────────────────────────────────
    cover_url: str | None = None
    if cover_data:
        cover_path = f"{user_id}/{book_id}_cover.jpg"
        sb.storage.from_("covers").upload(cover_path, cover_data, {"content-type": "image/jpeg"})
        supabase_url = os.environ["SUPABASE_URL"]
        cover_url = f"{supabase_url}/storage/v1/object/public/covers/{cover_path}"

    # ── 4. Insert book record into Supabase DB ───────────────────────────────
    row = {
        "user_id": user_id,
        "book_id": book_id,
        "title": title,
        "author": author,
        "genre": genre,
        "pdf_filename": safe_filename,
        "cover_image": cover_url,
    }
    sb.table("books").insert(row).execute()

    return {
        "book_id": book_id,
        "title": title,
        "author": author,
        "genre": genre,
        "pdf_filename": safe_filename,
        "cover_image": cover_url,
    }
