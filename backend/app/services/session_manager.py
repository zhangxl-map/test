"""Session management: thin wrapper over session_store for API layer."""
from app.database.session_store import (
    create_session,
    list_sessions,
    get_session,
    delete_session,
    update_session_title,
    add_message,
    list_messages,
)


def new_session(title: str = "新会话") -> dict:
    return create_session(title)


def get_all_sessions() -> list[dict]:
    return list_sessions()


def remove_session(session_id: str) -> bool:
    return delete_session(session_id)


def rename_session(session_id: str, title: str):
    update_session_title(session_id, title)


def get_or_create_session(session_id: str | None) -> dict:
    """Get existing session or create a new one."""
    if session_id:
        s = get_session(session_id)
        if s:
            return s
    return create_session()


def save_user_message(session_id: str, content: str) -> dict:
    return add_message(session_id, "user", content)


def save_ai_message(
    session_id: str,
    content: str,
    sql_query: str | None = None,
    chart_data: str | None = None,
) -> dict:
    return add_message(session_id, "assistant", content, sql_query, chart_data)


def get_history(session_id: str) -> list[dict]:
    return list_messages(session_id)


def auto_title(session_id: str, first_message: str):
    """Set session title from the first user message (truncated)."""
    title = first_message[:30].replace("\n", " ")
    if len(first_message) > 30:
        title += "..."
    update_session_title(session_id, title)
