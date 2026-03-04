"""Chat API: POST /api/chat -> SSE streaming response."""
import json
import asyncio
import logging

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from app.models.schemas import ChatRequest
from app.services.session_manager import (
    get_or_create_session,
    save_user_message,
    save_ai_message,
    get_history,
    auto_title,
)
from app.services.memory_manager import (
    get_memory,
    append_user_message,
    append_ai_message,
)
from app.services.sql_agent import run_agent_stream
from app.services.chart_analyzer import analyze_and_generate_chart

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/api/chat")
async def chat(req: ChatRequest, request: Request):
    session = get_or_create_session(req.session_id)
    session_id = session["id"]

    save_user_message(session_id, req.message)
    append_user_message(session_id, req.message)

    history = get_history(session_id)
    if len(history) <= 1:
        auto_title(session_id, req.message)

    memory_msgs = get_memory(session_id)

    async def event_generator():
        full_text = ""
        sql_query = None
        query_result = None

        try:
            async for event in run_agent_stream(req.message, memory_msgs):
                if await request.is_disconnected():
                    break

                etype = event.get("type")

                if etype == "text":
                    content = event["content"]
                    full_text = content
                    for ch in content:
                        yield {
                            "event": "text",
                            "data": json.dumps({"content": ch}, ensure_ascii=False),
                        }
                        await asyncio.sleep(0.02)

                elif etype == "sql":
                    sql_query = event["content"]
                    yield {
                        "event": "sql",
                        "data": json.dumps({"sql": sql_query}, ensure_ascii=False),
                    }

                elif etype == "data":
                    query_result = event["content"]

                elif etype == "done":
                    sql_query = event.get("sql_query") or sql_query
                    query_result = event.get("query_result") or query_result

            chart_data = None
            if sql_query and query_result:
                try:
                    chart_data = await analyze_and_generate_chart(
                        req.message, sql_query, query_result
                    )
                    if chart_data:
                        yield {
                            "event": "chart",
                            "data": json.dumps(chart_data, ensure_ascii=False),
                        }
                except Exception as e:
                    logger.error(f"Chart generation failed: {e}")

            yield {"event": "done", "data": "{}"}

            chart_json = json.dumps(chart_data, ensure_ascii=False) if chart_data else None
            save_ai_message(session_id, full_text, sql_query, chart_json)
            append_ai_message(session_id, full_text)

        except Exception as e:
            logger.error(f"Chat stream error: {e}")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}, ensure_ascii=False),
            }
            yield {"event": "done", "data": "{}"}

    return EventSourceResponse(event_generator())
