"""
Central configuration constants for the RAG pipeline.
All tuneable values live here — import from this module everywhere else.
"""

import os
from pathlib import Path

# --- Chunking ---
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150

# --- Embedding ---
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# --- Qdrant ---
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
QDRANT_COLLECTION = "books"

# --- File paths ---
BASE_DIR = Path(__file__).resolve().parent.parent  # rag-books/
PDF_DIR = BASE_DIR / "data" / "pdfs"
UPLOADS_DIR = BASE_DIR / "data" / "uploads"
COVERS_DIR = BASE_DIR / "data" / "covers"
EVAL_DIR = BASE_DIR / "data" / "eval"
