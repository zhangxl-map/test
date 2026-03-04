"""Per-session conversation memory using LangChain messages."""
from langchain_core.messages import HumanMessage, AIMessage

from app.config import get_settings
from app.database.session_store import list_messages

_memory_cache: dict[str, list] = {}


def get_memory(session_id: str) -> list:
    """
    Return LangChain message list for the session.
    Rebuilds from DB on first access; subsequent calls use cache.
    """
    if session_id in _memory_cache:
        return _memory_cache[session_id]

    settings = get_settings()
    k = settings.MEMORY_WINDOW_SIZE
    rows = list_messages(session_id)

    messages = []
    for row in rows:
        if row["role"] == "user":
            messages.append(HumanMessage(content=row["content"]))
        elif row["role"] == "assistant":
            messages.append(AIMessage(content=row["content"]))

    if len(messages) > k * 2:
        messages = messages[-(k * 2):]

    _memory_cache[session_id] = messages
    return messages


def append_user_message(session_id: str, content: str):
    msgs = get_memory(session_id)
    msgs.append(HumanMessage(content=content))
    _trim(session_id)


def append_ai_message(session_id: str, content: str):
    msgs = get_memory(session_id)
    msgs.append(AIMessage(content=content))
    _trim(session_id)


def clear_memory(session_id: str):
    _memory_cache.pop(session_id, None)


def _trim(session_id: str):
    settings = get_settings()
    k = settings.MEMORY_WINDOW_SIZE
    msgs = _memory_cache.get(session_id, [])
    if len(msgs) > k * 2:
        _memory_cache[session_id] = msgs[-(k * 2):]
