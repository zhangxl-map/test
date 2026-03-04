"""Session API: CRUD for conversations."""
from fastapi import APIRouter, HTTPException

from app.models.schemas import SessionCreate, SessionUpdate, SessionOut, SessionListResponse, MessageListResponse
from app.services.session_manager import (
    new_session,
    get_all_sessions,
    remove_session,
    rename_session,
    get_history,
)
from app.services.memory_manager import clear_memory

router = APIRouter()


@router.get("/api/sessions", response_model=SessionListResponse)
async def list_sessions():
    sessions = get_all_sessions()
    return {"sessions": sessions}


@router.post("/api/sessions", response_model=SessionOut)
async def create_session(body: SessionCreate):
    return new_session(body.title)


@router.patch("/api/sessions/{session_id}")
async def update_session(session_id: str, body: SessionUpdate):
    rename_session(session_id, body.title)
    return {"success": True}


@router.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    ok = remove_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    clear_memory(session_id)
    return {"success": True}


@router.get("/api/sessions/{session_id}/messages", response_model=MessageListResponse)
async def get_messages(session_id: str):
    msgs = get_history(session_id)
    return {"messages": msgs}
