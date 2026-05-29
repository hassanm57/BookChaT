"""
Sanity-check script: encode a query, search Qdrant, print top results.
Run from inside rag-books/: python test_query.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from qdrant_client import QdrantClient
from backend.config import QDRANT_HOST, QDRANT_PORT, QDRANT_COLLECTION
from backend.embedder import get_model

QUERY = "What is a cell membrane?"

def main():
    print(f"Query: '{QUERY}'\n")

    model = get_model()
    vector = model.encode(QUERY).tolist()

    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    results = client.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=vector,
        limit=3,
    )

    if not results:
        print("No results — has ingest been run?")
        return

    for i, r in enumerate(results, 1):
        p = r.payload
        snippet = p["text"].replace("\n", " ")[:120]
        print(f"[{i}] score={r.score:.4f} | {p['book_id']} | p.{p['page_number']} | {snippet}")

if __name__ == "__main__":
    main()
