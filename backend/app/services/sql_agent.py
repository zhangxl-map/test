"""NL2SQL Agent: natural language → SQL query → result."""
import json
import logging
from typing import AsyncGenerator

from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from app.database.connection import get_business_db_uri
from app.services.llm_service import get_llm, get_llm_non_streaming

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一个专业的数据分析助手，帮助用户查询和分析 SQLite 数据库中的数据。

工作流程：
1. 先使用 sql_db_list_tables 查看可用表
2. 使用 sql_db_schema 了解表结构
3. 根据用户问题编写 SQL
4. 使用 sql_db_query_checker 校验 SQL
5. 使用 sql_db_query 执行查询
6. 用清晰的中文总结查询结果

注意事项：
- 只使用 SELECT 语句，不允许修改数据
- 限制返回行数，避免返回过多数据（默认 LIMIT 50）
- 如果查询出错，分析错误原因并重试
- 用中文回答用户问题，包括对数据的分析和洞察
"""

_db: SQLDatabase | None = None
_toolkit: SQLDatabaseToolkit | None = None


def _get_db() -> SQLDatabase:
    global _db
    if _db is None:
        _db = SQLDatabase.from_uri(get_business_db_uri())
    return _db


def reload_db():
    """Reload the database connection (e.g. after uploading a new db file)."""
    global _db, _toolkit
    _db = None
    _toolkit = None


def _get_toolkit() -> SQLDatabaseToolkit:
    global _toolkit
    if _toolkit is None:
        _toolkit = SQLDatabaseToolkit(db=_get_db(), llm=get_llm_non_streaming())
    return _toolkit


def create_sql_agent_instance(history_messages: list | None = None):
    """Create a fresh agent with optional conversation history."""
    toolkit = _get_toolkit()
    tools = toolkit.get_tools()
    llm = get_llm_non_streaming()
    agent = create_react_agent(llm, tools, prompt=SYSTEM_PROMPT)
    return agent


async def run_agent_stream(
    query: str,
    history_messages: list | None = None,
) -> AsyncGenerator[dict, None]:
    """
    Stream agent execution, yielding structured events:
      {"type": "text", "content": "..."}
      {"type": "sql", "content": "SELECT ..."}
      {"type": "data", "content": "[(...)...]"}
      {"type": "done"}
    """
    agent = create_sql_agent_instance(history_messages)

    messages = []
    if history_messages:
        messages.extend(history_messages)
    messages.append({"role": "user", "content": query})

    sql_query = None
    query_result = None

    for step in agent.stream({"messages": messages}):
        if "agent" in step:
            msg = step["agent"]["messages"][-1]
            if isinstance(msg, AIMessage):
                if msg.tool_calls:
                    for tc in msg.tool_calls:
                        if tc["name"] == "sql_db_query":
                            sql_query = tc["args"].get("query", "")
                            yield {"type": "sql", "content": sql_query}
                elif msg.content:
                    yield {"type": "text", "content": msg.content}

        elif "tools" in step:
            msg = step["tools"]["messages"][-1]
            if isinstance(msg, ToolMessage):
                if msg.name == "sql_db_query":
                    query_result = msg.content
                    yield {"type": "data", "content": query_result}

    yield {
        "type": "done",
        "sql_query": sql_query,
        "query_result": query_result,
    }


def run_agent_sync(query: str, history_messages: list | None = None) -> dict:
    """Synchronous invoke for testing."""
    agent = create_sql_agent_instance(history_messages)

    messages = []
    if history_messages:
        messages.extend(history_messages)
    messages.append({"role": "user", "content": query})

    result = agent.invoke({"messages": messages})

    final_text = ""
    sql_query = None
    query_result = None

    for msg in result["messages"]:
        if isinstance(msg, AIMessage):
            if msg.tool_calls:
                for tc in msg.tool_calls:
                    if tc["name"] == "sql_db_query":
                        sql_query = tc["args"].get("query", "")
            elif msg.content:
                final_text = msg.content
        elif isinstance(msg, ToolMessage) and msg.name == "sql_db_query":
            query_result = msg.content

    return {
        "text": final_text,
        "sql": sql_query,
        "data": query_result,
    }
