"""
User book collections management.

Responsibilities:
- Manages named collections of books per user (e.g. "My Sci-Fi shelf")
- Persists collections to a local JSON file (collections.json) in data/
  — will migrate to a proper DB when moving to SaaS
- Exposed as a FastAPI router with full CRUD:
    POST   /collections              → create collection
    GET    /collections              → list all collections
    GET    /collections/{id}         → get single collection with books
    POST   /collections/{id}/books  → add book to collection
    DELETE /collections/{id}/books/{book_id} → remove book
    DELETE /collections/{id}         → delete collection
"""

# --- Imports ---

# --- Router ---

# --- Helper: load / save collections JSON ---

# --- Pydantic models ---
# CollectionCreate: name, description
# CollectionOut: id, name, description, book_ids, created_at

# --- Endpoints ---
# POST   /collections
# GET    /collections
# GET    /collections/{collection_id}
# POST   /collections/{collection_id}/books
# DELETE /collections/{collection_id}/books/{book_id}
# DELETE /collections/{collection_id}
