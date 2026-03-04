import uuid
from datetime import datetime, timezone
from app.database.connection import get_session_db

_INIT_DONE = False


def _ensure_tables():
    global _INIT_DONE
    if _INIT_DONE:
        return
    with get_session_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT '新会话',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                sql_query TEXT,
                chart_data TEXT,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
        """)
    _INIT_DONE = True


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Session CRUD ----------

def create_session(title: str = "新会话") -> dict:
    _ensure_tables()
    sid = str(uuid.uuid4())
    now = _now()
    with get_session_db() as conn:
        conn.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (sid, title, now, now),
        )
    return {"id": sid, "title": title, "created_at": now, "updated_at": now}


def list_sessions() -> list[dict]:
    _ensure_tables()
    with get_session_db() as conn:
        rows = conn.execute(
            "SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def get_session(session_id: str) -> dict | None:
    _ensure_tables()
    with get_session_db() as conn:
        row = conn.execute(
            "SELECT id, title, created_at, updated_at FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
    return dict(row) if row else None


def delete_session(session_id: str) -> bool:
    _ensure_tables()
    with get_session_db() as conn:
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        cur = conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    return cur.rowcount > 0


def update_session_title(session_id: str, title: str):
    _ensure_tables()
    with get_session_db() as conn:
        conn.execute(
            "UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?",
            (title, _now(), session_id),
        )


def touch_session(session_id: str):
    _ensure_tables()
    with get_session_db() as conn:
        conn.execute(
            "UPDATE sessions SET updated_at = ? WHERE id = ?", (_now(), session_id)
        )


# ---------- Message CRUD ----------

def add_message(
    session_id: str,
    role: str,
    content: str,
    sql_query: str | None = None,
    chart_data: str | None = None,
) -> dict:
    _ensure_tables()
    mid = str(uuid.uuid4())
    now = _now()
    with get_session_db() as conn:
        conn.execute(
            "INSERT INTO messages (id, session_id, role, content, sql_query, chart_data, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (mid, session_id, role, content, sql_query, chart_data, now),
        )
    touch_session(session_id)
    return {
        "id": mid, "session_id": session_id, "role": role,
        "content": content, "sql_query": sql_query, "chart_data": chart_data,
        "created_at": now,
    }


def list_messages(session_id: str) -> list[dict]:
    _ensure_tables()
    with get_session_db() as conn:
        rows = conn.execute(
            "SELECT id, session_id, role, content, sql_query, chart_data, created_at "
            "FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,),
        ).fetchall()
    return [dict(r) for r in rows]
