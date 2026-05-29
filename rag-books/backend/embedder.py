"""
Dense vector embedding using SentenceTransformers.

Responsibilities:
- Loads the SentenceTransformer model specified by EMBEDDING_MODEL (singleton, loaded once)
- Encodes a list of chunk dicts, adding a 'vector' field to each
- Returns the enriched chunk list ready for Qdrant upsert
- Handles batching for large ingestions to manage memory
"""

from sentence_transformers import SentenceTransformer
from backend.config import EMBEDDING_MODEL

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_chunks(chunks: list[dict]) -> list[dict]:
    model = get_model()
    texts = [c["text"] for c in chunks]
    vectors = model.encode(texts, batch_size=64, show_progress_bar=True)
    for chunk, vector in zip(chunks, vectors):
        chunk["vector"] = vector.tolist()
    return chunks
