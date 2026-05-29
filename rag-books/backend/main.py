"""
FastAPI application entry point.

Responsibilities:
- Initialises the FastAPI app and configures CORS
- Registers all routers: /books, /ingest, /upload, /collections, /chat
- Serves static frontend files in development
- Starts uvicorn server when run directly
"""

# --- Imports ---

# --- App initialisation ---

# --- CORS middleware ---

# --- Router registration ---
# include books router      → GET /books, GET /books/{book_id}
# include ingest router     → POST /ingest  (seed PDFs from PDF_DIR)
# include upload router     → POST /upload  (user-uploaded PDFs)
# include collections router → CRUD /collections
# include chat router       → POST /chat, GET /chat/stream

# --- Static file serving ---

# --- Entry point ---
# uvicorn with host="0.0.0.0", port=8000, reload=True
