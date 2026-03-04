import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.chat import router as chat_router
from app.api.session import router as session_router
from app.api.database import router as database_router
from app.database.init_sample_db import init_sample_database

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="Smart Data Analysis API",
    description="智能数据分析助理 - 基于 LangChain + Qwen3 的自然语言数据查询系统",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(session_router)
app.include_router(database_router)


@app.on_event("startup")
async def startup():
    init_sample_database()


@app.get("/api/health")
async def health():
    return {"status": "ok"}
