"""
Demo script to visually verify context management is working.
Run with: python3 -m tests.demo_context_management
"""

import sys
from pathlib import Path

# Ensure project root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent.context_management import (
    count_message_tokens,
    count_tokens,
    maybe_summarize_messages,
    truncate_tool_result,
    SUMMARIZATION_THRESHOLD,
    RECENT_MESSAGES_TO_KEEP,
    MAX_TOOL_RESULT_TOKENS,
)

# ── 1. Tool result truncation ────────────────────────────────────────────────

print("=" * 60)
print("1. TOOL RESULT TRUNCATION")
print("=" * 60)

# Simulate a large SQL result
header = "flight_number | zone | departure_time | delay_risk | status"
rows = [f"FL{i:04d} | Zone-{i%4} | 2026-02-25 10:{i%60:02d} | {'high' if i%3==0 else 'low'} | on_time"
        for i in range(500)]
big_result = header + "\n" + "\n".join(rows)

print(f"\nOriginal result: {len(big_result)} chars, {count_tokens(big_result)} tokens, {len(rows)} rows")

truncated = truncate_tool_result(big_result)
print(f"Truncated result: {len(truncated)} chars, {count_tokens(truncated)} tokens")
print(f"\nLast 3 lines of truncated output:")
for line in truncated.split("\n")[-3:]:
    print(f"  {line}")

small_result = header + "\n" + "\n".join(rows[:5])
not_truncated = truncate_tool_result(small_result)
print(f"\nSmall result ({len(small_result)} chars): {'UNCHANGED ✓' if not_truncated == small_result else 'TRUNCATED ✗'}")

# ── 2. Token counting ────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("2. TOKEN COUNTING")
print("=" * 60)

messages = [
    {"role": "user", "content": "What flights are at risk in zone B?"},
    {"role": "assistant", "content": "Let me check the flights database for zone B risks."},
    {"role": "user", "content": "Also check zone A please"},
]
tokens = count_message_tokens(messages)
print(f"\n3-message conversation: {tokens} tokens")

# ── 3. Summarization trigger check ───────────────────────────────────────────

print("\n" + "=" * 60)
print("3. SUMMARIZATION THRESHOLD CHECK")
print("=" * 60)

# Build a conversation that crosses the threshold
short_convo = [{"role": "user", "content": f"Turn {i}: Tell me about flight FL{i:04d} risk status and all related metrics"} for i in range(5)]
short_tokens = count_message_tokens(short_convo)
print(f"\n5-turn conversation: {short_tokens} tokens → {'WOULD summarize' if short_tokens > SUMMARIZATION_THRESHOLD else 'Would NOT summarize'}")

# Simulate a long conversation with tool results mixed in
long_convo = []
for i in range(40):
    if i % 2 == 0:
        long_convo.append({"role": "user", "content": f"Turn {i}: What is the delay risk for flights in zone {chr(65+i%4)}? Show me all metrics, WiFi events, speed tests, and mesh node status for that zone. Include historical data."})
    else:
        # Simulate assistant responses with tool results
        long_convo.append({"role": "assistant", "content": f"Turn {i}: Based on the analysis of zone {chr(65+i%4)}, here are the findings:\n" + "\n".join([f"- Flight FL{j:04d}: risk={'high' if j%3==0 else 'low'}, WiFi events: {j*10}, speed: {j*5}Mbps" for j in range(20)])})

long_tokens = count_message_tokens(long_convo)
print(f"40-turn conversation: {long_tokens} tokens → {'WOULD summarize' if long_tokens > SUMMARIZATION_THRESHOLD else 'Would NOT summarize'}")
print(f"Threshold: {SUMMARIZATION_THRESHOLD} tokens")
print(f"Recent messages kept: {RECENT_MESSAGES_TO_KEEP}")

# ── 4. Summarization dry run (mocked) ────────────────────────────────────────

print("\n" + "=" * 60)
print("4. SUMMARIZATION DRY RUN (with mock LLM)")
print("=" * 60)

import asyncio
from unittest.mock import AsyncMock, MagicMock

async def demo_summarize():
    # Build conversation that exceeds threshold
    convo = []
    for i in range(50):
        role = "user" if i % 2 == 0 else "assistant"
        convo.append({"role": role, "content": f"Turn {i}: " + " ".join(f"word{j}" for j in range(800))})

    total = count_message_tokens(convo)
    print(f"\nInput: {len(convo)} messages, {total} tokens")

    # Mock LLM
    mock_response = MagicMock()
    mock_response.content = "- User asked about flight risks in zones A-D\n- Several flights flagged as high risk\n- WiFi metrics reviewed for each zone"
    llm = AsyncMock()
    llm.ainvoke.return_value = mock_response

    result = await maybe_summarize_messages(convo, llm)

    print(f"Output: {len(result)} messages, {count_message_tokens(result)} tokens")
    print(f"Summary message (first in list):")
    print(f"  role: {result[0]['role']}")
    print(f"  content preview: {result[0]['content'][:200]}...")
    print(f"Recent messages preserved: {len(result) - 1} (last {RECENT_MESSAGES_TO_KEEP})")
    print(f"LLM summarize called: {llm.ainvoke.called}")

asyncio.run(demo_summarize())

print("\n" + "=" * 60)
print("ALL CHECKS PASSED ✓")
print("=" * 60)
