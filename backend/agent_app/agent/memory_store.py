from langchain_core.chat_history import InMemoryChatMessageHistory

_sessions: dict[str, InMemoryChatMessageHistory] = {}


def get_memory(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in _sessions:
        _sessions[session_id] = InMemoryChatMessageHistory()
    return _sessions[session_id]
