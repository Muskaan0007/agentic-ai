# 🤖 Agentic AI — Django + React + Groq + ChromaDB

Full-stack Agentic RAG application with:
- **LLM**: Groq `llama-3.3-70b-versatile` via LangChain ReAct agent
- **Web Search**: DuckDuckGo (no API key needed)
- **Vector Store**: ChromaDB (persistent, local)
- **Auth**: JWT (SimpleJWT)
- **Backend**: Django REST Framework
- **Frontend**: React 18

---

## 📁 Project Structure

```
agentic-ai/
├── backend/
│   ├── agent_app/
│   │   ├── agent/
│   │   │   ├── agent.py          ← LangChain ReAct agent + memory
│   │   │   └── memory_store.py   ← per-session chat history
│   │   ├── rag/
│   │   │   └── rag_tool.py       ← ChromaDB document search
│   │   ├── tools/
│   │   │   └── search_tool.py    ← DuckDuckGo web search
│   │   ├── models.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── agentic_backend/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Chat.js           ← main chat UI
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   └── Upload.js         ← upload docs to ChromaDB
    │   ├── context/AuthContext.js
    │   ├── services/api.js
    │   └── App.js
    └── package.json
```

---

## ⚙️ Setup

### 1. Clone / extract the project

```bash
cd agentic-ai
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Configure `.env`

```env
GROQ_API_KEY=your_groq_api_key_here
DJANGO_SECRET_KEY=any-random-secret-key
DEBUG=True
```

> Get your free Groq API key at https://console.groq.com

### 4. Run Django migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # optional
```

### 5. Start the backend

```bash
python manage.py runserver
# Runs at http://localhost:8000
```

### 6. Frontend setup

```bash
cd ../frontend
npm install
npm start
# Runs at http://localhost:3000
```

---

## 🔗 API Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/register/` | No | Register user |
| POST | `/api/login/` | No | Get JWT tokens |
| POST | `/api/agent/` | JWT | Chat with agent |
| POST | `/api/upload/` | JWT | Upload document to ChromaDB |
| GET | `/api/ask/?q=...` | No | Simple GET query |
| GET | `/api/users/` | JWT Admin | List all users |

---

## 🧠 How the Agent Works

1. User sends a query
2. LangChain ReAct agent decides which tool to use:
   - **`web_search`** — for queries with: *latest, news, today, current, recent, update, trending*
   - **`document_search`** — for internal knowledge base queries
   - **`get_datetime`** — for time/date questions
3. Tool result is passed back to `llama-3.3-70b-versatile` on Groq
4. Final answer is returned with per-user session memory

---

## 📄 Adding Documents to Knowledge Base

**Via UI**: Go to `/upload` → paste text or upload `.txt` file

**Via API**:
```bash
curl -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "text=Your document content here"
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Groq `llama-3.3-70b-versatile` |
| Agent Framework | LangChain ReAct |
| Web Search | DuckDuckGo Search |
| Vector DB | ChromaDB (persistent) |
| Backend | Django 4.2 + DRF |
| Auth | JWT (SimpleJWT) |
| Frontend | React 18 + React Router |
| Styling | Custom CSS (dark theme) |
