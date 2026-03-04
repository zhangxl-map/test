"""Analyze query results and generate ECharts option JSON via LLM."""
import json
import logging

from langchain_core.messages import HumanMessage, SystemMessage

from app.services.llm_service import get_llm_non_streaming

logger = logging.getLogger(__name__)

CHART_SYSTEM_PROMPT = """你是一个数据可视化专家。根据用户的 SQL 查询结果，判断最佳图表类型并生成 ECharts 配置。

你必须返回一个严格的 JSON 对象，不要包含任何其他文字、解释或 markdown 格式。

JSON 结构要求：
{
  "chart_type": "bar|line|pie|scatter|area|table",
  "title": "图表标题",
  "option": {
    // 完整的 ECharts option 配置，前端可直接使用
  },
  "table": {
    "columns": [{"title": "列名", "dataIndex": "字段名", "key": "字段名"}],
    "data": [{"字段名": "值", ...}]
  }
}

规则：
1. 分类比较（如各类别销售额）→ 柱状图 bar
2. 时间序列趋势 → 折线图 line
3. 占比分布 → 饼图 pie
4. 两个数值变量关系 → 散点图 scatter
5. 累积趋势 → 面积图 area（type: "line", areaStyle: {}）
6. 数据行数 > 10 或无法图表化 → 表格 table
7. option 中必须包含 tooltip, xAxis/yAxis（饼图除外）, series
8. 颜色使用美观的调色板
9. table.data 中每条记录必须有 "key" 字段（用行号）
"""


async def analyze_and_generate_chart(
    user_query: str,
    sql_query: str,
    query_result: str,
) -> dict | None:
    """
    Ask LLM to produce ECharts config from query results.
    Returns parsed dict or None on failure.
    """
    if not query_result or query_result.strip() == "[]":
        return None

    prompt = (
        f"用户问题: {user_query}\n"
        f"SQL 查询: {sql_query}\n"
        f"查询结果: {query_result}\n\n"
        "请根据以上信息生成 ECharts 图表配置 JSON。"
    )

    try:
        llm = get_llm_non_streaming()
        result = llm.invoke([
            SystemMessage(content=CHART_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ])

        text = result.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
            if text.endswith("```"):
                text = text[:-3].strip()

        chart_data = json.loads(text)
        if "option" not in chart_data:
            logger.warning("Chart LLM response missing 'option' field")
            return None

        return chart_data

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse chart JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"Chart analysis error: {e}")
        return None
