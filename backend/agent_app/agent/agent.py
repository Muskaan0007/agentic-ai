import os
from dotenv import load_dotenv
from groq import Groq

from agent_app.tools.search_tool import web_search, get_datetime
from agent_app.rag.rag_tool import document_search
from agent_app.agent.memory_store import get_memory

load_dotenv()

MODEL = "llama-3.3-70b-versatile"

WEB_TRIGGERS = {"latest", "news", "today", "current", "recent", "now", "update", "trending", "weather"}
DATE_TRIGGERS = {"time", "date", "day", "what time", "what day"}


def _get_client():
    """Get Groq client with current API key from environment."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")
    return Groq(api_key=api_key)


def _pick_tool(query: str) -> tuple[str, str]:
    """Decide which tool to call and return (tool_name, result)."""
    q = query.lower()
    if any(t in q for t in DATE_TRIGGERS):
        return "get_datetime", get_datetime(query)
    if any(t in q for t in WEB_TRIGGERS):
        return "web_search", web_search(query)
    return "document_search", document_search(query)


def run_agent(query: str, session_id: str = "default") -> str:
    """Agentic RAG: route query → tool → Groq LLM → answer."""
    if not query:
        return "Please provide a valid query."

    memory = get_memory(session_id)

    # Build chat history for context
    history = []
    for msg in memory.messages[-10:]:
        role = "user" if msg.type == "human" else "assistant"
        history.append({"role": role, "content": msg.content})

    # Pick tool and get context
    tool_name, context = _pick_tool(query)

    system_prompt = (
        f"You are an intelligent AI assistant. "
        f"Answer the user's question using the context below retrieved via {tool_name}.\n\n"
        f"Context:\n{context}"
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": query})

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=1024,
        )
        answer = response.choices[0].message.content.strip()
    except Exception as e:
        answer = f"LLM error: {str(e)}"

    # Save to memory
    memory.add_user_message(query)
    memory.add_ai_message(answer)

    return answer