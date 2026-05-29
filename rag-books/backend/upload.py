"""
User PDF upload handler.

Responsibilities:
- Accepts multipart file upload via POST /upload
- Validates file is a PDF (MIME type + extension check)
- Saves uploaded file to UPLOADS_DIR with a sanitised filename
- Generates a new book_id (UUID) and appends entry to books.json
- Triggers the ingest pipeline for the uploaded file
- Associates the new book with the requesting user's collection (if provided)
- Returns the new book_id and upload status
"""

# --- Imports ---

# --- Router ---

# --- Helper: validate PDF ---
# Check content-type and file magic bytes (starts with %PDF-)

# --- Helper: sanitise filename ---
# Strip unsafe characters, ensure .pdf extension

# --- Upload endpoint: POST /upload ---
# 1. Validate file
# 2. Save to UPLOADS_DIR
# 3. Generate book_id, update books.json
# 4. Run ingest for the single file
# 5. Optionally add to collection via collections module
# 6. Return {book_id, filename, status}
