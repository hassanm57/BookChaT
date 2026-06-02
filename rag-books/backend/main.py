"""
FastAPI application entry point.
"""

import os
import re
from pathlib import Path

from dotenv import load_dotenv

# Load .env before any backend modules read os.environ at import time
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

import fitz
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.auth import get_current_user
from backend.rate_limiter import limiter
from backend.retriever import retrieve
from backend.llm import generate
from backend.supabase_client import get_supabase
from backend.upload import router as upload_router

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
    sb = get_supabase()
    result = sb.table("books").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data


@app.get("/books/{book_id}")
@limiter.limit("120/minute")
def get_book(request: Request, book_id: str, user_id: str = Depends(get_current_user)):
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
    return result.data


@app.get("/books/{book_id}/pdf-url")
@limiter.limit("30/minute")
def get_pdf_url(request: Request, book_id: str, user_id: str = Depends(get_current_user)):
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
    return {"url": signed["signedURL"]}


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

    chunks = retrieve(body.query, body.book_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant passages found")

    return StreamingResponse(
        generate(body.query, chunks),
        media_type="text/event-stream",
    )
