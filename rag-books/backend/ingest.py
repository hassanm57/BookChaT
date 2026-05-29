"""
PDF ingestion pipeline for seed books.

Responsibilities:
- Iterates over all PDFs in PDF_DIR
- Extracts text per page using PyMuPDF (fitz), preserving page numbers
- Extracts first page as a cover image, saves to COVERS_DIR
- Passes raw page text to chunker, receives chunks with metadata
- Passes chunks to embedder, receives dense vectors
- Upserts vectors + metadata (book_id, page_number, char_offset, text) into Qdrant
- Exposed as a FastAPI router: POST /ingest
"""

# --- Imports ---

# --- Router ---

# --- Helper: extract cover image ---
# Open PDF with fitz, render page 0 as PNG, save to COVERS_DIR/<book_id>.jpg

# --- Helper: extract text by page ---
# Iterate fitz pages, return list of {page_number, text}

# --- Ingest endpoint: POST /ingest ---
# For each PDF in PDF_DIR:
#   1. extract cover
#   2. extract text by page
#   3. chunk → embed → upsert to Qdrant
#   4. return summary of books ingested and chunk counts
