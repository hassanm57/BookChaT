"""
Dense vector embedding using SentenceTransformers.

Responsibilities:
- Loads the SentenceTransformer model specified by EMBEDDING_MODEL (singleton, loaded once)
- Encodes a list of chunk dicts, adding a 'vector' field to each
- Returns the enriched chunk list ready for Qdrant upsert
- Handles batching for large ingestions to manage memory
"""

# --- Imports ---

# --- Model loader (singleton) ---
# _model = None
# get_model() → loads once, returns cached instance

# --- embed_chunks(chunks: List[dict]) → List[dict] ---
# Extract texts, encode in batches
# Attach vector to each chunk dict
# Return enriched chunks
