"""Context window management: token counting, conversation summarization, and tool result truncation."""

import logging
import os

import tiktoken

logger = logging.getLogger(__name__)

# tiktoken doesn't have a Claude-specific tokenizer; cl100k_base slightly
# overestimates for Claude, which is the safe direction (triggers early).
try:
    _ENCODING = tiktoken.get_encoding("cl100k_base")
except Exception:
    _ENCODING = None
    logger.warning("tiktoken encoding unavailable — falling back to char-based estimation")

# ---------------------------------------------------------------------------
# Configuration (override via environment variables)
# ---------------------------------------------------------------------------
SUMMARIZATION_THRESHOLD = int(os.environ.get("CTX_SUMMARIZATION_THRESHOLD", "20000"))
RECENT_MESSAGES_TO_KEEP = int(os.environ.get("CTX_RECENT_MESSAGES_KEEP", "6"))
SUMMARY_TARGET_TOKENS = 2_000
MAX_TOOL_RESULT_TOKENS = int(os.environ.get("CTX_MAX_TOOL_RESULT_TOKENS", "4000"))
MAX_TOOL_RESULT_CHARS = int(os.environ.get("CTX_MAX_TOOL_RESULT_CHARS", "12000"))
MAX_RESULT_ROWS = int(os.environ.get("CTX_MAX_RESULT_ROWS", "100"))

# ---------------------------------------------------------------------------
# Token counting
# ---------------------------------------------------------------------------

def count_tokens(text: str) -> int:
    """Count tokens in a string."""
    if _ENCODING is not None:
        return len(_ENCODING.encode(text))
    return len(text) // 4  # rough fallback


def count_message_tokens(messages: list[dict]) -> int:
    """Count tokens across a list of chat-completion-format messages."""
    total = 0
    for msg in messages:
        content = msg.get("content", "")
        if isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and "text" in part:
                    total += count_tokens(part["text"])
        elif isinstance(content, str):
            total += count_tokens(content)
        total += 4  # per-message overhead (role tags, separators)
    return total


# ---------------------------------------------------------------------------
# Tool result truncation
# ---------------------------------------------------------------------------

def truncate_tool_result(content: str) -> str:
    """Truncate tool output if it exceeds the token budget."""
    if not content or len(content) <= MAX_TOOL_RESULT_CHARS:
        return content  # fast path: skip tokenization

    token_count = count_tokens(content)
    if token_count <= MAX_TOOL_RESULT_TOKENS:
        return content

    # Approximate target char count (1 token ~ 3 chars for tabular data)
    target_chars = MAX_TOOL_RESULT_TOKENS * 3
    truncated = content[:target_chars]

    # Cut at a line boundary for readability
    last_newline = truncated.rfind("\n")
    if last_newline > target_chars * 0.8:
        truncated = truncated[:last_newline]

    original_lines = content.count("\n")
    kept_lines = truncated.count("\n")

    return (
        truncated
        + f"\n\n... [truncated: showing ~{kept_lines} of {original_lines} rows; "
        f"original was {token_count} tokens, capped at {MAX_TOOL_RESULT_TOKENS}]"
    )


# ---------------------------------------------------------------------------
# Conversation summarization
# ---------------------------------------------------------------------------

def _format_messages_for_summary(messages: list[dict]) -> str:
    """Format messages into a readable string for the summarizer LLM."""
    parts = []
    for msg in messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        if isinstance(content, list):
            content = " ".join(
                p.get("text", "") for p in content if isinstance(p, dict)
            )
        if isinstance(content, str) and len(content) > 2000:
            content = content[:2000] + "... [truncated]"
        parts.append(f"[{role}]: {content}")
    return "\n\n".join(parts)


async def summarize_history(older_messages: list[dict], llm) -> str:
    """Use the same LLM to produce a concise summary of older messages."""
    summary_prompt = [
        {
            "role": "system",
            "content": (
                "You are a conversation summarizer. Condense the following conversation "
                "into a concise summary preserving: key facts established, decisions made, "
                "tool results referenced, and any open questions. Use bullet points. "
                "Keep it under 500 words."
            ),
        },
        {"role": "user", "content": _format_messages_for_summary(older_messages)},
    ]
    response = await llm.ainvoke(summary_prompt)
    summary = response.content

    # Cap the summary itself if the LLM was too verbose
    if count_tokens(summary) > SUMMARY_TARGET_TOKENS:
        target_chars = SUMMARY_TARGET_TOKENS * 3
        summary = summary[:target_chars]
        last_newline = summary.rfind("\n")
        if last_newline > target_chars * 0.8:
            summary = summary[:last_newline]
        summary += "\n... [summary truncated]"

    return summary


async def maybe_summarize_messages(messages: list[dict], llm) -> list[dict]:
    """Summarize older messages if the conversation exceeds the token threshold.

    Returns the (possibly shortened) message list. On any error, returns the
    original messages unchanged so the main agent flow is never broken.
    """
    try:
        total_tokens = count_message_tokens(messages)
        if total_tokens <= SUMMARIZATION_THRESHOLD:
            return messages

        split_idx = max(0, len(messages) - RECENT_MESSAGES_TO_KEEP)
        older = messages[:split_idx]
        recent = messages[split_idx:]

        if not older:
            return messages

        logger.info(
            "Context at %d tokens (threshold %d) — summarizing %d older messages",
            total_tokens,
            SUMMARIZATION_THRESHOLD,
            len(older),
        )
        summary_text = await summarize_history(older, llm)
        summary_message = {
            "role": "system",
            "content": (
                f"[Conversation summary of {len(older)} earlier messages]:\n{summary_text}"
            ),
        }
        return [summary_message] + recent
    except Exception:
        logger.exception("Summarization failed — returning original messages")
        return messages
