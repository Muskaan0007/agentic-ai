from duckduckgo_search import DDGS
from datetime import datetime
import time

_ddgs_instance = None

def _get_ddgs():
    global _ddgs_instance
    if _ddgs_instance is None:
        _ddgs_instance = DDGS()
    return _ddgs_instance

def web_search(query: str) -> str:
    try:
        ddgs = _get_ddgs()
        results = list(ddgs.text(query, max_results=3))
        if not results:
            return ""
        return "\n---\n".join(
            f"Title: {r.get('title','')}\nURL: {r.get('href','')}\nSummary: {r.get('body','')}"
            for r in results if r
        )
    except Exception:
        # Reset instance on failure so next call gets a fresh one
        global _ddgs_instance
        _ddgs_instance = None
        return ""

def get_datetime(query: str = "") -> str:
    return f"Current date and time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"