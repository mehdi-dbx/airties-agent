"""MLflow eval runner for main agent tool routing.

Tests whether the agent calls the correct tool for each type of question.

Usage:
  uv run python eval/run_eval_routing.py
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env.local", override=True)

import os
os.environ["MLFLOW_GENAI_EVAL_SKIP_TRACE_VALIDATION"] = "True"

import mlflow
from mlflow.entities import Feedback
from mlflow.genai.scorers import scorer

EVAL_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(EVAL_DIR))

from eval_dataset_routing import eval_dataset_routing

# ── MLflow setup ─────────────────────────────────────────────────────────────
_EXPERIMENT_ID = os.environ.get("MLFLOW_EXPERIMENT_ID", "").strip()
if not _EXPERIMENT_ID:
    raise EnvironmentError("MLFLOW_EXPERIMENT_ID must be set in .env.local")

mlflow.set_experiment(experiment_id=_EXPERIMENT_ID)

# ── Agent predict function ───────────────────────────────────────────────────
# Import the agent module so the @invoke decorator registers the function
from agent import agent as _agent_module  # noqa: F401
from mlflow.genai.agent_server import get_invoke_function
from mlflow.types.responses import ResponsesAgentRequest, ResponsesAgentResponse

_invoke_fn = get_invoke_function()
assert _invoke_fn is not None, "No @invoke function found — is agent.agent imported?"


def predict_agent(query: str) -> dict:
    """Call the main agent and return the full ResponsesAgentResponse as dict."""
    request = ResponsesAgentRequest(input=[{"role": "user", "content": query}])
    if asyncio.iscoroutinefunction(_invoke_fn):
        response: ResponsesAgentResponse = asyncio.run(_invoke_fn(request))
    else:
        response: ResponsesAgentResponse = _invoke_fn(request)
    return response.model_dump()


# ── Tool routing extraction ──────────────────────────────────────────────────

# Genie tool name patterns (from genie_capture.py)
_GENIE_PATTERNS = ("genie", "query_space", "poll_response")


def _extract_tools_called(response_dict: dict) -> list[str]:
    """Extract tool names from agent response output items."""
    tools = []
    for item in response_dict.get("output", []):
        # MLflow Responses format: function_call items have the tool name
        if item.get("type") == "function_call":
            name = item.get("name", "")
            if name:
                tools.append(name)
    return tools


def _normalize_tool(tool_name: str) -> str:
    """Normalize a tool name to one of our expected categories."""
    lower = tool_name.lower()
    for pattern in _GENIE_PATTERNS:
        if pattern in lower:
            return "genie"
    return tool_name


# ── Scorer ───────────────────────────────────────────────────────────────────

@scorer(name="correct_tool_routing")
def correct_tool_routing(inputs: dict, outputs: dict, expectations: dict) -> Feedback:
    """Score 1.0 if the agent called the expected tool. Returns actual_tool in rationale."""
    expected = expectations.get("expected_tool", "")
    tools_called = _extract_tools_called(outputs)
    normalized = [_normalize_tool(t) for t in tools_called]

    actual = ", ".join(dict.fromkeys(normalized)) if normalized else "(none)"
    match = expected in normalized

    mark = "✓" if match else "✗"
    print(f"  [routing] {mark} expected={expected} | actual={actual}")
    return Feedback(
        name="correct_tool_routing",
        value=1.0 if match else 0.0,
        rationale=f"expected={expected} | actual={actual}",
    )


# ── Runner ───────────────────────────────────────────────────────────────────

def _short(q: str, max_len: int = 50) -> str:
    return q[:max_len] + "…" if len(q) > max_len else q


def run() -> None:
    print(f"\n▶ TOOL ROUTING EVAL — {len(eval_dataset_routing)} questions")
    with mlflow.start_run(run_name="run_tool_routing"):
        results = mlflow.genai.evaluate(
            data=eval_dataset_routing,
            predict_fn=predict_agent,
            scorers=[correct_tool_routing],
        )

    print(f"\n{'═' * 65}")
    print("  TOOL ROUTING RESULTS")
    print(f"{'═' * 65}")
    df = results.result_df
    score_col = "correct_tool_routing/value"
    if score_col in df.columns:
        questions = [d["inputs"]["query"] for d in eval_dataset_routing]
        expected_tools = [d["expectations"]["expected_tool"] for d in eval_dataset_routing]
        scores = df[score_col].tolist()
        for q, t, s in zip(questions, expected_tools, scores):
            mark = "✓" if s and s >= 1.0 else "✗"
            print(f"  {mark} [{t:.<25s}]  {_short(q)}")
        avg = sum(s or 0 for s in scores) / len(scores)
        print(f"\n  avg correct_tool_routing: {avg:.2f}")
        failed = sum(1 for s in scores if not s or s < 1.0)
        if failed:
            print(f"  {failed} question(s) routed to wrong tool")
    else:
        print("  (score column not found — dumping available columns)")
        print("  columns:", list(df.columns))
        # Try to find any column with "routing" in the name
        for col in df.columns:
            if "routing" in col.lower():
                print(f"  found: {col} → {df[col].tolist()}")


if __name__ == "__main__":
    run()
