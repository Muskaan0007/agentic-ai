import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path

# Path
_DB_PATH = str(Path(__file__).resolve().parent.parent / "chroma_db")

# ✅ Lightweight embedding (small model)
embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"  # small + fast
)

# Client
_client = chromadb.Client()

# Collection
_collection = _client.get_or_create_collection(
    name="docs",
    embedding_function=embedding_function
)