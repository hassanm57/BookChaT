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

from backend.config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_text(pages: list[dict], book_id: str) -> list[dict]: # A few changes to the chunker here and there, lets experient with different chunk sizes and overlaps to see how it affects the quality of the answers.
    chunks = []
    step = CHUNK_SIZE - CHUNK_OVERLAP

    for page in pages:
        text = page["text"]
        page_number = page["page_number"]

        start = 0
        while start < len(text):
            chunk_text = text[start : start + CHUNK_SIZE]
            if chunk_text.strip():
                chunks.append(
                    {
                        "text": chunk_text,
                        "book_id": book_id,
                        "page_number": page_number,
                        "char_offset": start,
                    }
                )
            start += step

    return chunks
