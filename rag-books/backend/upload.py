"""
User PDF upload handler.

Fast path (immediate response):
1. Validate PDF
2. Upload PDF to Supabase Storage
3. Insert book record with status='processing'
4. Return immediately

Background task:
5. Extract text, chunk, embed, upsert Qdrant
6. Extract cover → upload to Storage
7. Update book record: status='ready', cover_image=<url>
"""

import os
import tempfile
from pathlib import Path
from uuid import uuid4

import fitz
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from backend.auth import get_current_user
from backend.chunker import chunk_text
from backend.config import QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT
from backend.embedder import embed_chunks
from backend.supabase_client import get_supabase

router = APIRouter()

PDF_MAGIC = b"%PDF-"
MAX_FILE_SIZE = 50 * 1024 * 1024


def _validate_pdf(data: bytes) -> None:
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit")
    if not data.startswith(PDF_MAGIC):
        raise HTTPException(status_code=400, detail="File is not a valid PDF")


def _ensure_buckets(sb) -> None:
    existing = {b.name for b in sb.storage.list_buckets()}
    if "pdfs" not in existing:
        sb.storage.create_bucket("pdfs", options={"public": False})
    if "covers" not in existing:
        sb.storage.create_bucket("covers", options={"public": True})


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
    for i in range(0, len(chunks), 100):
        batch = chunks[i : i + 100]
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


def _run_ingest(book_id: str, data: bytes, title: str, author: str, user_id: str) -> None:
    sb = get_supabase()
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(data)
            tmp_path = Path(tmp.name)

        try:
            doc = fitz.open(str(tmp_path))
            pages = [{"page_number": i + 1, "text": page.get_text()} for i, page in enumerate(doc)]
            cover_data: bytes | None = None
            if doc.page_count > 0:
                pixmap = doc[0].get_pixmap(dpi=150)
                cover_data = pixmap.tobytes("jpeg")
            doc.close()
        finally:
            tmp_path.unlink(missing_ok=True)

        chunks = chunk_text(pages, book_id)
        chunks = embed_chunks(chunks)
        _upsert_chunks(_get_qdrant(), chunks, title=title, author=author, user_id=user_id)

        cover_url: str | None = None
        if cover_data:
            cover_path = f"{user_id}/{book_id}_cover.jpg"
            sb.storage.from_("covers").upload(cover_path, cover_data, {"content-type": "image/jpeg"})
            cover_url = f"{os.environ['SUPABASE_URL']}/storage/v1/object/public/covers/{cover_path}"

        update: dict = {"status": "ready"}
        if cover_url:
            update["cover_image"] = cover_url
        sb.table("books").update(update).eq("book_id", book_id).execute()

    except Exception:
        sb.table("books").update({"status": "error"}).eq("book_id", book_id).execute()


@router.post("/upload")
async def upload_book(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    author: str = Form(...),
    genre: str = Form("General"),
    user_id: str = Depends(get_current_user),
):
    data = await file.read()
    _validate_pdf(data)

    sb = get_supabase()
    _ensure_buckets(sb)
    book_id = str(uuid4())
    safe_filename = f"{book_id}.pdf"

    pdf_path = f"{user_id}/{safe_filename}"
    sb.storage.from_("pdfs").upload(pdf_path, data, {"content-type": "application/pdf"})

    row = {
        "user_id": user_id,
        "book_id": book_id,
        "title": title,
        "author": author,
        "genre": genre,
        "pdf_filename": safe_filename,
        "cover_image": None,
        "status": "processing",
    }
    sb.table("books").insert(row).execute()

    background_tasks.add_task(_run_ingest, book_id, data, title, author, user_id)

    return row
