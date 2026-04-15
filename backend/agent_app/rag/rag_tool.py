import chromadb
from langchain.tools import tool
from pathlib import Path

# ---------------------------------------------------------------------------
# ChromaDB setup (safe for production)
# ---------------------------------------------------------------------------
_DB_PATH = str(Path(__file__).resolve().parent.parent / "chroma_db")
_client = chromadb.PersistentClient(path=_DB_PATH)

_collection = _client.get_or_create_collection(name="docs")


# ---------------------------------------------------------------------------
# SAFE document search (no heavy loading at startup)
# ---------------------------------------------------------------------------
@tool
def document_search(query: str) -> str:
    """Search internal company documents and knowledge base."""
    try:
        results = _collection.query(
            query_texts=[query],
            n_results=3
        )
        docs = results.get("documents", [[]])[0]

        if not docs:
            return "No relevant documents found in the knowledge base."

        return "\n\n".join(docs)

    except Exception as e:
        return f"Document search error: {str(e)}"


# ---------------------------------------------------------------------------
# OPTIONAL: Add documents manually (call this via API or script)
# ---------------------------------------------------------------------------
def add_documents(texts: list, ids: list = None):
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


# ---------------------------------------------------------------------------
# OPTIONAL: Manual seed function (DO NOT auto-run)
# ---------------------------------------------------------------------------
def seed_data():
    sample = [
        "Our company was founded in 2020 and specialises in AI-powered solutions.",
        "Refunds are accepted within 30 days of purchase with a valid receipt.",
        "Support hours: Monday-Friday 9 AM - 6 PM. Email: support@example.com.",
        "The product roadmap for Q3 includes multi-modal search and voice features.",
        "The company owner is Muskaan.",
    ]

    add_documents(sample)