import chromadb
# from langchain.tools import tool
from pathlib import Path


class _HashEmbedding:
    def name(self) -> str:
        return "hash-embedding"

    def __call__(self, input):
        results = []
        for text in input:
            vec = [0.0] * 384
            for i, ch in enumerate(text):
                vec[i % 384] += ord(ch) / 1000.0
            norm = sum(x * x for x in vec) ** 0.5 or 1.0
            results.append([x / norm for x in vec])
        return results


_collection = None


def _get_collection():
    global _collection
    if _collection is not None:
        return _collection
    try:
        _ef = _HashEmbedding()
        _DB_PATH = str(Path(__file__).resolve().parent.parent / "chroma_db")
        _client = chromadb.PersistentClient(path=_DB_PATH)
        _collection = _client.get_or_create_collection(
            name="docs",
            embedding_function=_ef,
        )
        if _collection.count() == 0:
            _sample = [
                "Our company was founded in 2020 and specialises in AI-powered solutions.",
                "Refunds are accepted within 30 days of purchase with a valid receipt.",
                "Support hours: Monday-Friday 9 AM - 6 PM. Email: support@example.com.",
                "The product roadmap for Q3 includes multi-modal search and voice features.",
            ]
            _collection.add(
                documents=_sample,
                ids=[str(i) for i in range(len(_sample))],
            )
    except Exception as e:
        print(f"[ChromaDB] Init error: {e}")
        _collection = None
    return _collection



def document_search(query: str) -> str:
    """Search internal company documents and knowledge base. Use for policy, product, or internal questions."""
    try:
        col = _get_collection()
        if col is None:
            return "Document store is currently unavailable."
        results = col.query(query_texts=[query], n_results=3)
        docs = results.get("documents", [[]])[0]
        if not docs:
            return "No relevant documents found in the knowledge base."
        return "\n\n".join(docs)
    except Exception as e:
        return f"Document search error: {str(e)}"


def add_documents(texts: list, ids: list = None):
    col = _get_collection()
    if col is None:
        return
    if ids is None:
        ids = [str(i) for i in range(len(texts))]
    existing = set()
    try:
        existing = set(col.get()["ids"])
    except Exception:
        pass
    new_texts = [t for t, i in zip(texts, ids) if i not in existing]
    new_ids = [i for t, i in zip(texts, ids) if i not in existing]
    if new_texts:
        col.add(documents=new_texts, ids=new_ids)