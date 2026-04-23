# Context Window Management

The agent protects itself from context window overflow using two mechanisms: **conversation summarization** and **tool result truncation**. Both are implemented in `agent/context_management.py`.

## Why This Exists

The agent is stateless — the client sends the full conversation history with every request. As conversations grow longer or tools return large SQL results, the total token count can exceed the LLM's context window, causing the API call to fail. These safeguards prevent that silently, with no user-facing impact.

## How It Works

### 1. Conversation Summarization

When the incoming conversation exceeds a token threshold, older messages are replaced with a compact LLM-generated summary while recent messages are kept intact.

**Flow:**
1. Count tokens in the incoming message list
2. If below threshold (default: 20,000 tokens) — do nothing
3. If above — split messages into **older** (to summarize) and **recent** (last 6, kept as-is)
4. Call the same LLM to summarize the older messages into bullet points
5. Replace the older messages with a single system message containing the summary

**Example:** A 50-message conversation at 80,000 tokens becomes 7 messages at ~10,000 tokens (1 summary + 6 recent).

**Failure handling:** If the summarization LLM call fails for any reason, the original messages are returned unchanged — the main agent flow is never broken.

### 2. Tool Result Truncation

Every tool output (Genie queries, SQL results, Knowledge Assistant responses) is checked before being passed back to the LLM. Oversized results are truncated.

**Two layers of defense:**

| Layer | Where | What it does |
|-------|-------|-------------|
| **Row cap** | `tools/sql_executor.py` | Limits formatted SQL output to 100 rows at the source |
| **Token cap** | `agent/utils.py` | Truncates any tool result exceeding 4,000 tokens in the stream processor |

Truncated results include a notice like:
```
... [truncated: showing ~232 of 500 rows; original was 12513 tokens, capped at 4000]
```

## Configuration

All thresholds are configurable via environment variables. Defaults work out of the box.

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `CTX_SUMMARIZATION_THRESHOLD` | `20000` | Token count that triggers conversation summarization |
| `CTX_RECENT_MESSAGES_KEEP` | `6` | Number of recent messages preserved (not summarized) |
| `CTX_MAX_TOOL_RESULT_TOKENS` | `4000` | Max tokens for a single tool result |
| `CTX_MAX_TOOL_RESULT_CHARS` | `12000` | Char-based fast check (skips tokenization if below) |
| `CTX_MAX_RESULT_ROWS` | `100` | Max rows in formatted SQL output |

## Testing

```bash
# Unit tests (14 tests)
python3 -m pytest tests/test_context_management.py -v

# Visual demo showing all features
python3 tests/demo_context_management.py

# Test with lower thresholds to trigger summarization easily
CTX_SUMMARIZATION_THRESHOLD=500 python3 tests/demo_context_management.py
```

When running the agent live, check logs for:
```
Context at XXXXX tokens (threshold 20000) — summarizing N older messages
```

## Files

| File | Role |
|------|------|
| `agent/context_management.py` | All logic: token counting, truncation, summarization |
| `agent/agent.py` | Calls `maybe_summarize_messages()` in `_run_agent()` |
| `agent/utils.py` | Calls `truncate_tool_result()` on every tool message |
| `tools/sql_executor.py` | Row cap in `format_query_result()` |
| `tests/test_context_management.py` | Unit tests |
| `tests/demo_context_management.py` | Interactive demo script |
