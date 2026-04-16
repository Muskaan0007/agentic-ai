import os
import re
import time
import hashlib
from dotenv import load_dotenv
from groq import Groq

from agent_app.tools.search_tool import web_search, get_datetime
from agent_app.rag.rag_tool import document_search
from agent_app.agent.memory_store import get_memory

load_dotenv()

MODEL = "llama-3.3-70b-versatile"
MAX_HISTORY_TURNS = 5
MAX_TOOL_RESULT_CHARS = 2000
REQUEST_TIMEOUT_S = 25


# =========================
# CLIENT
# =========================
_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")
        _client = Groq(api_key=api_key)
    return _client


# =========================
# FAST RESPONSES
# =========================
_GREETINGS = {"hi", "hello", "hlo", "hey", "yo", "sup"}
_THANKS = {"thanks", "thank you", "thx", "ty"}

def fast_route(query: str) -> str | None:
    q = query.lower().strip().rstrip("!.,")
    if q in _GREETINGS:
        return "Hello! How can I help you?"
    if q in _THANKS:
        return "You're welcome!"
    if "your name" in q or "who are you" in q:
        return "I'm your AI assistant. Ask me anything!"
    return None


# =========================
# REGEX PLANNER
# =========================
_WEB_PATTERNS = re.compile(
    r"\b(latest|today|news|current|price|weather|recent|trending|update|score)\b",
    re.I,
)

_DOC_PATTERNS = re.compile(
    r"\b(policy|refund|office|hours|email|support|company|founded|document)\b",
    re.I,
)

_TIME_PATTERNS = re.compile(
    r"\b(time|date|today)\b",
    re.I
)

def plan_query(query: str) -> dict:
    if _TIME_PATTERNS.search(query):
        return {"tool": "get_datetime", "query": query}
    if _DOC_PATTERNS.search(query):
        return {"tool": "document_search", "query": query}
    if _WEB_PATTERNS.search(query):
        return {"tool": "web_search", "query": query}
    return {"tool": "document_search", "query": query}


# =========================
# TOOL EXECUTION
# =========================
def execute_tool(plan: dict) -> str:
    tool = plan.get("tool")
    query = plan.get("query", "")

    if tool == "get_datetime":
        return get_datetime(query)

    if tool == "document_search":
        result = document_search(query)
        if result and len(result.strip()) > 20:
            return result
        return web_search(query)

    if tool == "web_search":
        result = web_search(query)
        if result and len(result.strip()) > 10:
            return result
        return document_search(query)

    return ""


# =========================
# TRUNCATE TOOL OUTPUT
# =========================
def _truncate(text: str, limit: int = MAX_TOOL_RESULT_CHARS) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "\n\n[...truncated]"


# =========================
# MEMORY
# =========================
_session_timestamps = {}
SESSION_TTL_S = 3600

def load_memory(session_id: str):
    now = time.time()

    expired = [
        sid for sid, ts in _session_timestamps.items()
        if now - ts > SESSION_TTL_S
    ]
    for sid in expired:
        _session_timestamps.pop(sid, None)

    _session_timestamps[session_id] = now

    memory = get_memory(session_id)

    history = []
    for msg in memory.messages[-(MAX_HISTORY_TURNS * 2):]:
        role = "user" if msg.type == "human" else "assistant"
        history.append({"role": role, "content": msg.content})

    return memory, history


# =========================
# FINAL ANSWER (FIXED)
# =========================
def final_answer(query: str, tool_result: str, history: list) -> str:
    client = _get_client()

    tool_result = _truncate(tool_result or "")
    has_context = bool(tool_result.strip())

    if has_context:
        system = (
            "You are a helpful AI assistant.\n"
            "Use the provided context first.\n"
            "If context is useful, answer from it.\n"
            "You may use general knowledge if needed."
        )

        user_msg = f"CONTEXT:\n{tool_result}\n\nQUESTION:\n{query}"

    else:
        system = "You are a helpful AI assistant."
        user_msg = query

    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            *history[-6:],
            {"role": "user", "content": user_msg},
        ],
        max_tokens=400,
        temperature=0.2,
        timeout=REQUEST_TIMEOUT_S,
    )

    return resp.choices[0].message.content.strip()


# =========================
# DEDUP
# =========================
_recent_requests = {}
DEDUP_WINDOW_S = 3

def _key(session_id: str, query: str) -> str:
    return hashlib.md5(f"{session_id}:{query}".encode()).hexdigest()

def _check(session_id: str, query: str):
    key = _key(session_id, query)
    if key in _recent_requests:
        ts, val = _recent_requests[key]
        if time.time() - ts < DEDUP_WINDOW_S:
            return val
    return None

def _store(session_id: str, query: str, result: str):
    key = _key(session_id, query)
    _recent_requests[key] = (time.time(), result)


# =========================
# MAIN AGENT
# =========================
def run_agent(query: str, session_id: str = "default") -> str:
    query = query.strip()
    if not query:
        return "Please provide a valid query."

    fast = fast_route(query)
    if fast:
        return fast

    cached = _check(session_id, query)
    if cached:
        return cached

    try:
        memory, history = load_memory(session_id)

        plan = plan_query(query)

        tool_result = execute_tool(plan)

        result = final_answer(query, tool_result, history)

    except Exception as e:
        print("[agent error]", e)
        return "Something went wrong. Please try again."

    try:
        memory.add_user_message(query)
        memory.add_ai_message(result)
    except:
        pass

    _store(session_id, query, result)

    return result