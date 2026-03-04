import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///data/sample.db")
    SESSION_DB_URL: str = os.getenv("SESSION_DB_URL", "sqlite:///data/sessions.db")

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    LLM_MODEL: str = "qwen3-max"
    MEMORY_WINDOW_SIZE: int = 10

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
