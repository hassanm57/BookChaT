"""
FastAPI application entry point.

Responsibilities:
- Initialises the FastAPI app and configures CORS
- Exposes /books (list + detail) and /chat (streaming SSE) endpoints
- Loads environment variables from .env at startup
"""

import json
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.config import COVERS_DIR, PDF_DIR

from backend.retriever import retrieve
from backend.llm import generate

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

BOOKS_PATH = Path(__file__).resolve().parent.parent / "books.json"

app = FastAPI(title="BookChat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/covers", StaticFiles(directory=str(COVERS_DIR)), name="covers")
app.mount("/pdfs", StaticFiles(directory=str(PDF_DIR)), name="pdfs")


class ChatRequest(BaseModel):
    book_id: str
    query: str


def _load_books() -> list[dict]:
    return json.loads(BOOKS_PATH.read_text())


@app.get("/books")
def list_books():
    return _load_books()


@app.get("/books/{book_id}")
def get_book(book_id: str):
    books = _load_books()
    for book in books:
        if book["book_id"] == book_id:
            return book
    raise HTTPException(status_code=404, detail="Book not found")


@app.post("/chat")
async def chat(request: ChatRequest):
    chunks = retrieve(request.query, request.book_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant passages found for this book")
    return StreamingResponse(
        generate(request.query, chunks),
        media_type="text/event-stream",
    )
