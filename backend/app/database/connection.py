import sqlite3
import os
from contextlib import contextmanager
from app.config import get_settings


def _resolve_path(url: str) -> str:
    """Extract file path from sqlite:/// URL."""
    return url.replace("sqlite:///", "")


@contextmanager
def get_session_db():
    """Context manager for session/message storage database."""
    settings = get_settings()
    db_path = _resolve_path(settings.SESSION_DB_URL)
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_business_db_path() -> str:
    settings = get_settings()
    return _resolve_path(settings.DATABASE_URL)


def get_business_db_uri() -> str:
    settings = get_settings()
    return settings.DATABASE_URL
