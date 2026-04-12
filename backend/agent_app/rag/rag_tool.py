import chromadb
from langchain.tools import tool
from pathlib import Path


# ---------------------------------------------------------------------------
# ChromaDB — persistent on disk with default embedding
# ---------------------------------------------------------------------------
_DB_PATH = str(Path(__file__).resolve().parent.parent / "chroma_db")
_client = chromadb.PersistentClient(path=_DB_PATH)

# Use chromadb's default embedding function (no custom embedding needed)
_collection = _client.get_or_create_collection(name="docs")

# Seed only if empty
if _collection.count() == 0:
    _sample = [
        "Our company was founded in 2020 and specialises in AI-powered solutions.",
        "Refunds are accepted within 30 days of purchase with a valid receipt.",
        "Support hours: Monday-Friday 9 AM - 6 PM. Email: support@example.com.",
        "The product roadmap for Q3 includes multi-modal search and voice features.",
        "The company owner is Muskaan.",
    ]
    _collection.add(documents=_sample, ids=[str(i) for i in range(len(_sample))])


@tool
def document_search(query: str) -> str:
    """Search internal company documents and knowledge base. Use for policy, product, or internal questions."""
    try:
        results = _collection.query(query_texts=[query], n_results=3)
        docs = results.get("documents", [[]])[0]
        if not docs:
            return "No relevant documents found in the knowledge base."
        return "\n\n".join(docs)
    except Exception as e:
        return f"Document search error: {str(e)}"


def add_documents(texts: list, ids: list = None):
    """Add documents to the ChromaDB 'docs' collection."""
    if ids is None:
        ids = [str(i) for i in range(len(texts))]
    existing = set()
    try:
        existing = set(_collection.get()["ids"])
    except Exception:
        pass
    new_texts = [t for t, i in zip(texts, ids) if i not in existing]
    new_ids = [i for t, i in zip(texts, ids) if i not in existing]
    if new_texts:
        _collection.add(documents=new_texts, ids=new_ids)
