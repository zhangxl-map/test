import os
from langchain_community.chat_models.tongyi import ChatTongyi
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.config import get_settings

_llm_instance: ChatTongyi | None = None


def get_llm() -> ChatTongyi:
    global _llm_instance
    if _llm_instance is None:
        settings = get_settings()
        os.environ["DASHSCOPE_API_KEY"] = settings.DASHSCOPE_API_KEY
        _llm_instance = ChatTongyi(
            model=settings.LLM_MODEL,
            streaming=True,
        )
    return _llm_instance


def get_llm_non_streaming() -> ChatTongyi:
    """Non-streaming instance for tool calling / chart analysis."""
    settings = get_settings()
    os.environ["DASHSCOPE_API_KEY"] = settings.DASHSCOPE_API_KEY
    return ChatTongyi(model=settings.LLM_MODEL)
