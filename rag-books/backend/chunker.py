"""
Text chunking with position metadata.

Responsibilities:
- Accepts a list of {page_number, text} dicts from the ingest pipeline
- Splits text into overlapping chunks using CHUNK_SIZE and CHUNK_OVERLAP from config
- Preserves and propagates per-chunk metadata:
    book_id      — which book this chunk belongs to
    page_number  — source page (for PDF viewer navigation)
    char_offset  — character start position within the page (for highlight anchoring)
- Returns a list of chunk dicts ready for the embedder
"""

# --- Imports ---

# --- chunk_text(pages, book_id) → List[dict] ---
# For each page:
#   sliding window over text with step = CHUNK_SIZE - CHUNK_OVERLAP
#   each chunk: {text, book_id, page_number, char_offset}
