"""Database API: upload SQLite file, inspect tables."""
import os
import sqlite3
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.database.connection import get_business_db_path
from app.services.sql_agent import reload_db

router = APIRouter()


@router.post("/api/database/upload")
async def upload_database(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith(".db"):
        raise HTTPException(status_code=400, detail="Only .db files are accepted")

    db_path = get_business_db_path()
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    tmp_path = db_path + ".tmp"
    try:
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        conn = sqlite3.connect(tmp_path)
        conn.execute("SELECT 1")
        conn.close()
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=400, detail="Invalid SQLite database file")

    if os.path.exists(db_path):
        os.remove(db_path)
    shutil.move(tmp_path, db_path)

    reload_db()

    return {"success": True, "message": f"Database uploaded: {file.filename}"}


@router.get("/api/database/tables")
async def get_tables():
    db_path = get_business_db_path()
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="No database loaded")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    table_names = [row["name"] for row in cursor.fetchall()]

    tables = []
    for name in table_names:
        cursor.execute(f"PRAGMA table_info('{name}')")
        columns = [
            {"name": col["name"], "type": col["type"], "notnull": bool(col["notnull"]), "pk": bool(col["pk"])}
            for col in cursor.fetchall()
        ]

        cursor.execute(f"SELECT COUNT(*) as cnt FROM '{name}'")
        row_count = cursor.fetchone()["cnt"]

        tables.append({"name": name, "columns": columns, "row_count": row_count})

    conn.close()
    return {"tables": tables}
