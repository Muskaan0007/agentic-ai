from duckduckgo_search import DDGS
from datetime import datetime


def web_search(query: str) -> str:
    """Search the web using DuckDuckGo and return top 3 results."""
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=3):
                results.append(
                    f"Title: {r['title']}\nURL: {r['href']}\nSummary: {r['body']}\n"
                )
        return "\n---\n".join(results) if results else "No results found."
    except Exception as e:
        return f"Search error: {str(e)}"


def get_datetime(query: str = "") -> str:
    """Returns the current date and time."""
    return f"Current date and time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"