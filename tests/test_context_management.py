"""Tests for agent.context_management."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from agent.context_management import (
    MAX_TOOL_RESULT_CHARS,
    MAX_TOOL_RESULT_TOKENS,
    RECENT_MESSAGES_TO_KEEP,
    SUMMARIZATION_THRESHOLD,
    count_message_tokens,
    count_tokens,
    maybe_summarize_messages,
    truncate_tool_result,
)


# ---------------------------------------------------------------------------
# Token counting
# ---------------------------------------------------------------------------

def test_count_tokens_basic():
    assert count_tokens("hello world") > 0


def test_count_tokens_empty():
    assert count_tokens("") == 0


def test_count_message_tokens_string_content():
    msgs = [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "hi there"},
    ]
    tokens = count_message_tokens(msgs)
    assert tokens > 0
    # 4 tokens overhead per message + actual content
    assert tokens >= 8


def test_count_message_tokens_list_content():
    msgs = [
        {"role": "user", "content": [{"type": "text", "text": "hello world"}]},
    ]
    tokens = count_message_tokens(msgs)
    assert tokens > 4  # at least overhead + some content


def test_count_message_tokens_empty_content():
    msgs = [{"role": "user", "content": ""}]
    assert count_message_tokens(msgs) == 4  # just overhead


# ---------------------------------------------------------------------------
# Tool result truncation
# ---------------------------------------------------------------------------

def test_truncate_short_result():
    short = "col1 | col2\nval1 | val2"
    assert truncate_tool_result(short) == short


def test_truncate_empty():
    assert truncate_tool_result("") == ""


def test_truncate_long_result():
    # Create content exceeding MAX_TOOL_RESULT_CHARS
    line = "col1 | col2 | col3 | col4 | col5\n"
    content = line * (MAX_TOOL_RESULT_CHARS // len(line) + 100)
    result = truncate_tool_result(content)
    assert len(result) < len(content)
    assert "[truncated:" in result


def test_truncate_preserves_line_boundary():
    lines = ["row " + str(i) for i in range(5000)]
    content = "\n".join(lines)
    result = truncate_tool_result(content)
    # Should not cut mid-line (last char before the truncation notice should be \n or end of a full line)
    before_notice = result.split("\n\n... [truncated:")[0]
    assert before_notice.endswith(lines[0][:4]) or before_notice[-1] != " "


# ---------------------------------------------------------------------------
# Summarization
# ---------------------------------------------------------------------------

def _make_messages(n: int, tokens_per_msg: int = 500) -> list[dict]:
    """Create n messages with approximately tokens_per_msg tokens each.

    Uses space-separated words so tiktoken counts ~1 token per word.
    """
    # "word0 word1 word2 ..." gives ~1 token per word with cl100k_base
    words = " ".join(f"word{j}" for j in range(tokens_per_msg))
    msgs = []
    for i in range(n):
        role = "user" if i % 2 == 0 else "assistant"
        msgs.append({"role": role, "content": f"Message {i}: {words}"})
    return msgs


@pytest.mark.anyio
async def test_maybe_summarize_below_threshold():
    msgs = [{"role": "user", "content": "hi"}]
    llm = AsyncMock()
    result = await maybe_summarize_messages(msgs, llm)
    assert result == msgs
    llm.ainvoke.assert_not_called()


@pytest.mark.anyio
async def test_maybe_summarize_above_threshold():
    # 10 msgs * 3000 tokens each = 30k tokens, well above 20k threshold
    msgs = _make_messages(10, tokens_per_msg=3000)

    mock_response = MagicMock()
    mock_response.content = "- Summary point 1\n- Summary point 2"
    llm = AsyncMock()
    llm.ainvoke.return_value = mock_response

    result = await maybe_summarize_messages(msgs, llm)

    # Should have summary + recent messages
    assert len(result) == RECENT_MESSAGES_TO_KEEP + 1  # 1 summary + recent
    assert "[Conversation summary" in result[0]["content"]
    assert result[0]["role"] == "system"
    # Recent messages preserved
    assert result[-1] == msgs[-1]
    llm.ainvoke.assert_called_once()


@pytest.mark.anyio
async def test_maybe_summarize_all_recent():
    # Fewer messages than RECENT_MESSAGES_TO_KEEP — even if huge, nothing to summarize
    msgs = _make_messages(RECENT_MESSAGES_TO_KEEP - 1, tokens_per_msg=50000)
    llm = AsyncMock()
    result = await maybe_summarize_messages(msgs, llm)
    assert result == msgs
    llm.ainvoke.assert_not_called()


@pytest.mark.anyio
async def test_summarize_llm_failure_returns_originals():
    content_per_msg = SUMMARIZATION_THRESHOLD // 5
    msgs = _make_messages(10, tokens_per_msg=content_per_msg)

    llm = AsyncMock()
    llm.ainvoke.side_effect = RuntimeError("LLM unavailable")

    result = await maybe_summarize_messages(msgs, llm)
    assert result == msgs  # fallback: return originals


# ---------------------------------------------------------------------------
# SQL executor row cap (import test)
# ---------------------------------------------------------------------------

def test_format_query_result_row_cap():
    from tools.sql_executor import format_query_result

    columns = ["id", "name"]
    rows = [[str(i), f"name_{i}"] for i in range(300)]
    result = format_query_result(columns, rows)
    lines = result.strip().split("\n")
    # Should have header + MAX_RESULT_ROWS data lines + truncation notice
    assert "more rows omitted" in result
    assert "300 total" in result
