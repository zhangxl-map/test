from pydantic import BaseModel, Field
from datetime import datetime


class HealthResponse(BaseModel):
    status: str


# ---------- Session ----------

class SessionCreate(BaseModel):
    title: str = "新会话"


class SessionUpdate(BaseModel):
    title: str


class SessionOut(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class SessionListResponse(BaseModel):
    sessions: list[SessionOut]


# ---------- Message ----------

class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    sql_query: str | None = None
    chart_data: str | None = None
    created_at: str


class MessageListResponse(BaseModel):
    messages: list[MessageOut]


# ---------- Chat ----------

class ChatRequest(BaseModel):
    session_id: str
    message: str


# ---------- Database ----------

class TableInfo(BaseModel):
    name: str
    columns: list[dict]
    row_count: int


class TablesResponse(BaseModel):
    tables: list[TableInfo]
