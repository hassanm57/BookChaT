"""
FastAPI application entry point.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.auth import get_current_user
from backend.retriever import retrieve
from backend.llm import generate
from backend.supabase_client import get_supabase
from backend.upload import router as upload_router

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

app = FastAPI(title="Folio API")

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


@app.get("/books")
def list_books(user_id: str = Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("books").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data


@app.get("/books/{book_id}")
def get_book(book_id: str, user_id: str = Depends(get_current_user)):
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
def get_pdf_url(book_id: str, user_id: str = Depends(get_current_user)):
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
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user)):
    # Verify ownership before retrieval
    sb = get_supabase()
    result = (
        sb.table("books")
        .select("book_id")
        .eq("user_id", user_id)
        .eq("book_id", request.book_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=403, detail="Book not found or access denied")

    chunks = retrieve(request.query, request.book_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant passages found")

    return StreamingResponse(
        generate(request.query, chunks),
        media_type="text/event-stream",
    )
