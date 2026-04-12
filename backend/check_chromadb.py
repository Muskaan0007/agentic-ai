import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agentic_backend.settings')
django.setup()

from agent_app.rag.rag_tool import _collection
from agent_app.models import CompanyDocument

# Check ChromaDB
docs = _collection.get()
print(f'\n✓ Documents in ChromaDB: {len(docs["ids"])}')
for i, (id, content) in enumerate(zip(docs['ids'], docs['documents'])):
    print(f'  {i+1}. ID: {id}')
    print(f'     Content: {content[:70]}...\n')

# Check Database
db_docs = CompanyDocument.objects.all()
print(f'✓ Documents in Database: {db_docs.count()}')
for doc in db_docs:
    print(f'  - {doc.title} (uploaded by {doc.uploaded_by.username})')
