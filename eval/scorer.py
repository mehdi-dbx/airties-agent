"""Custom MLflow scorer: answers_with_product_detail.

Uses the external FE workspace endpoint (databricks-claude-sonnet-4-6) as LLM judge.
No personal Anthropic token consumed — uses AGENT_MODEL_ENDPOINT + AGENT_MODEL_TOKEN
from .env.local, following the cross-workspace endpoint pattern.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env.local", override=True)

import requests
from mlflow.genai.scorers import scorer

# ── Model endpoint — same-workspace fallback ─────────────────────────────────
_ENDPOINT_URL = os.environ.get("AGENT_MODEL_ENDPOINT", "").strip()
_DATABRICKS_HOST = os.environ.get("DATABRICKS_HOST", "").strip().rstrip("/")

if not _ENDPOINT_URL:
    if not _DATABRICKS_HOST:
        raise EnvironmentError("AGENT_MODEL_ENDPOINT not set and DATABRICKS_HOST not set")
    _ENDPOINT_URL = f"{_DATABRICKS_HOST}/serving-endpoints/databricks-claude-sonnet-4-6/invocations"

# Use AGENT_MODEL_TOKEN for cross-workspace; fall back to DATABRICKS_TOKEN for same-workspace
_ENDPOINT_TOKEN = (
    os.environ.get("AGENT_MODEL_TOKEN", "").strip()
    or os.environ.get("DATABRICKS_TOKEN", "").strip()
)
if not _ENDPOINT_TOKEN:
    raise EnvironmentError("No auth token found — set AGENT_MODEL_TOKEN or DATABRICKS_TOKEN")

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
_JUDGE_PROMPT = (_PROMPTS_DIR / "judges.prompt").read_text(encoding="utf-8").strip()
_JUDGE_GT_PROMPT = (_PROMPTS_DIR / "judges_gt.prompt").read_text(encoding="utf-8").strip()


def _call_judge(prompt: str) -> tuple[float, str]:
    """Call external FE endpoint as LLM judge. Returns (score, justification)."""
    try:
        resp = requests.post(
            _ENDPOINT_URL,
            headers={
                "Authorization": f"Bearer {_ENDPOINT_TOKEN}",
                "Content-Type": "application/json",
            },
            json={"messages": [{"role": "user", "content": prompt}]},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data["choices"][0]["message"]["content"].strip()
        lines = text.split("\n", 1)
        verdict = lines[0].strip().upper()
        justification = lines[1].strip() if len(lines) > 1 else text
        score = 1.0 if "PASS" in verdict else 0.0
        return score, justification
    except Exception as e:
        return 0.0, f"scorer error: {e}"


def _extract_response_text(outputs: dict) -> str:
    """Pull the answer string from the KA output dict.

    Handles two formats:
    - JSON-wrapped: output[0].content[0].text is a JSON string with an "answer" key
    - Plain text: output[0].content[0].text is the answer directly
    """
    try:
        raw_text = outputs["output"][0]["content"][0]["text"]
        try:
            parsed = json.loads(raw_text)
            return parsed.get("answer", raw_text)
        except (json.JSONDecodeError, TypeError):
            return raw_text
    except (KeyError, IndexError, TypeError):
        return str(outputs)


@scorer(name="answers_with_product_detail")
def answers_with_product_detail(inputs: dict, outputs: dict) -> float:
    """Score 1.0 if the response contains specific AirTies product details."""
    question = inputs.get("query", "")
    response_text = _extract_response_text(outputs)

    if not response_text:
        print("  [detail] empty response → 0.0")
        return 0.0

    prompt = _JUDGE_PROMPT.format(question=question, response=response_text[:3000])
    score, justification = _call_judge(prompt)
    print(f"  [detail] score={score} | {justification[:80]}")
    return score


@scorer(name="factual_accuracy")
def factual_accuracy(inputs: dict, outputs: dict, expectations: dict) -> float:
    """Score 1.0 if the response is factually consistent with the ground-truth answer."""
    question = inputs.get("query", "")
    expected = expectations.get("expected_response", "")
    response_text = _extract_response_text(outputs)

    if not response_text:
        print("  [factual] empty response → 0.0")
        return 0.0

    prompt = _JUDGE_GT_PROMPT.format(
        question=question, expected=expected, response=response_text[:3000]
    )
    score, justification = _call_judge(prompt)
    print(f"  [factual] score={score} | {justification[:80]}")
    return score
