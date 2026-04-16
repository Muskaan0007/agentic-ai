import chromadb
from pathlib import Path
from chromadb.utils import embedding_functions

embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)
_collection = None

def _get_collection():
    global _collection
    if _collection is not None:
        return _collection
    DB_PATH = str(Path(__file__).resolve().parent.parent / "chroma_db")
    client = chromadb.PersistentClient(path=DB_PATH)
    _collection = client.get_or_create_collection(
        name="docs",
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"},  # explicit cosine distance
    )
    if _collection.count() == 0:
        _sample = [
            "Company was founded in 2020.",
            "Refund policy allows returns within 30 days with receipt.",
            "Office timing is 9 AM to 6 PM Monday to Friday.",
            "Support email is support@example.com.",
        ]
        _collection.add(documents=_sample, ids=[str(i) for i in range(len(_sample))])
    return _collection

def document_search(query: str, threshold: float = 0.7):
    try:
        col = _get_collection()

        results = col.query(
            query_texts=[query],
            n_results=5,
            include=["documents", "distances"],
        )

        docs = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]

        filtered = [
            d for d, dist in zip(docs, distances)
            if dist < threshold
        ]

        if not filtered and docs:
            filtered = [docs[0]]

        return "\n\n".join(filtered)

    except Exception:
        return ""