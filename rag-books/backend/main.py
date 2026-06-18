"""
FastAPI application entry point.
"""

import os
import re
from pathlib import Path

from dotenv import load_dotenv

# Load .env before any backend modules read os.environ at import time
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

import logging

import fitz
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, FilterSelector, MatchValue
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.auth import get_current_user
from backend.cache import cache_del, cache_get, cache_set
from backend.config import QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT
from backend.rate_limiter import limiter
from backend.retriever import retrieve
from backend.llm import generate
from backend.supabase_client import get_supabase
from backend.upload import router as upload_router

logger = logging.getLogger(__name__)

app = FastAPI(title="Folio API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)


class ChatRequest(BaseModel):
    book_id: str
    query: str


def _heuristic_metadata(doc: fitz.Document) -> tuple[str, str]:
    """Extract title and author from first two pages using font-size and pattern heuristics."""
    title = ""
    author = ""

    pages_to_scan = min(doc.page_count, 2)

    # ── Title: largest font span on the first page ───────────────────────────
    if not title and doc.page_count > 0:
        spans: list[dict] = []
        for block in doc[0].get_text("dict").get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span["text"].strip()
                    if text and len(text) > 1:
                        spans.append({"text": text, "size": span["size"]})

        if spans:
            max_size = max(s["size"] for s in spans)
            # Collect all spans within 10% of max font size as the title
            title_parts = [s["text"] for s in spans if s["size"] >= max_size * 0.90]
            title = " ".join(title_parts[:6]).strip()

    # ── Author: scan lines for "by …" / "Author:" patterns ──────────────────
    for i in range(pages_to_scan):
        if author:
            break
        lines = [l.strip() for l in doc[i].get_text().splitlines() if l.strip()]
        for idx, line in enumerate(lines):
            low = line.lower()

            # Standalone "by" keyword followed by next line
            if low in ("by", "written by", "edited by"):
                if idx + 1 < len(lines):
                    author = lines[idx + 1]
                    break

            # "By Author Name" on same line
            m = re.match(r"^(?:written |edited )?by\s+(.+)$", line, re.IGNORECASE)
            if m:
                author = m.group(1).strip()
                break

            # "Author: Name" or "Authors: Name"
            m = re.match(r"^authors?:\s*(.+)$", line, re.IGNORECASE)
            if m:
                author = m.group(1).strip()
                break

    return title, author


@app.post("/extract-metadata")
@limiter.limit("20/minute")
async def extract_metadata(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    data = await file.read()
    doc = fitz.open(stream=data, filetype="pdf")

    # 1 — PDF metadata (fastest, works for most exported/digital PDFs)
    meta = doc.metadata or {}
    title = (meta.get("title") or "").strip()
    author = (meta.get("author") or "").strip()

    # 2 — Heuristic scan of first pages
    if not title or not author:
        h_title, h_author = _heuristic_metadata(doc)
        if not title:
            title = h_title
        if not author:
            author = h_author

    doc.close()

    # 3 — Filename fallback for title
    if not title and file.filename:
        title = file.filename.removesuffix(".pdf").replace("-", " ").replace("_", " ").title()

    return {"title": title, "author": author}


@app.get("/books")
@limiter.limit("60/minute")
def list_books(request: Request, user_id: str = Depends(get_current_user)):
    ck = f"books:{user_id}"
    cached = cache_get(ck)
    if cached is not None:
        return cached
    sb = get_supabase()
    result = sb.table("books").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    cache_set(ck, result.data, 30)
    return result.data


@app.get("/books/{book_id}")
@limiter.limit("120/minute")
def get_book(request: Request, book_id: str, user_id: str = Depends(get_current_user)):
    ck = f"book:{user_id}:{book_id}"
    cached = cache_get(ck)
    if cached is not None:
        return cached
    sb = get_supabase()
    result = (
        sb.table("books")
        .select("*")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Book not found")
    cache_set(ck, result.data, 30)
    return result.data


@app.get("/books/{book_id}/pdf-url")
@limiter.limit("30/minute")
def get_pdf_url(request: Request, book_id: str, user_id: str = Depends(get_current_user)):
    ck = f"pdf_url:{user_id}:{book_id}"
    cached = cache_get(ck)
    if cached:
        return {"url": cached}

    sb = get_supabase()
    result = (
        sb.table("books")
        .select("pdf_filename")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Book not found")

    pdf_path = f"{user_id}/{result.data['pdf_filename']}"
    signed = sb.storage.from_("pdfs").create_signed_url(pdf_path, expires_in=3600)
    url = signed["signedURL"]
    cache_set(ck, url, 3300)  # 55 min — 5 min buffer before Supabase 1hr expiry
    return {"url": url}


@app.delete("/books/{book_id}")
@limiter.limit("30/minute")
def delete_book(request: Request, book_id: str, user_id: str = Depends(get_current_user)):
    sb = get_supabase()

    # Verify ownership and get pdf_filename before deleting anything
    result = (
        sb.table("books")
        .select("book_id, pdf_filename")
        .eq("user_id", user_id)
        .eq("book_id", book_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Book not found")

    pdf_filename = result.data["pdf_filename"]

    # 1. Delete Qdrant vectors (best-effort — don't let Qdrant failure block the rest)
    try:
        qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        qdrant.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[
                        FieldCondition(key="book_id", match=MatchValue(value=book_id)),
                        FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                    ]
                )
            ),
        )
    except Exception:
        logger.exception("Qdrant delete failed for book %s — continuing", book_id)

    # 2. Delete PDF from Storage
    try:
        sb.storage.from_("pdfs").remove([f"{user_id}/{pdf_filename}"])
    except Exception:
        logger.exception("Storage delete (PDF) failed for book %s — continuing", book_id)

    # 3. Delete cover from Storage
    try:
        sb.storage.from_("covers").remove([f"{user_id}/{book_id}_cover.jpg"])
    except Exception:
        pass  # cover may not exist for processing/error books

    # 4. Delete DB row
    sb.table("books").delete().eq("user_id", user_id).eq("book_id", book_id).execute()

    # 5. Bust cache
    cache_del(f"books:{user_id}", f"book:{user_id}:{book_id}", f"pdf_url:{user_id}:{book_id}")

    return {"deleted": book_id}


@app.post("/chat")
@limiter.limit("20/minute")
async def chat(request: Request, body: ChatRequest, user_id: str = Depends(get_current_user)):
    # Verify ownership before retrieval
    sb = get_supabase()
    result = (
        sb.table("books")
        .select("book_id")
        .eq("user_id", user_id)
        .eq("book_id", body.book_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=403, detail="Book not found or access denied")

    try:
        chunks = retrieve(body.query, body.book_id, user_id=user_id)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail={"code": "RETRIEVAL_UNAVAILABLE", "message": "Search is temporarily unavailable. Please try again in a moment."},
        )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_RESULTS", "message": "No relevant passages found for that question. Try rephrasing or asking about a different topic."},
        )

    return StreamingResponse(
        generate(body.query, chunks),
        media_type="text/event-stream",
    )
