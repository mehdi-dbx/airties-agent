"""MLflow eval runner for AirTies WiFi Knowledge Assistant.

Run 1 (baseline) and Run 2 (after guideline) comparison.
Uses external FE workspace endpoint as LLM judge (no personal tokens).

All configuration from .env.local — no hardcoded workspace paths or profile names.

Usage:
  uv run python eval/run_eval.py           # run 1 (baseline)
  uv run python eval/run_eval.py --run2    # run 2 (after adding guideline to KA)
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env.local", override=True)

import os
os.environ["MLFLOW_GENAI_EVAL_SKIP_TRACE_VALIDATION"] = "True"

import mlflow

EVAL_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(EVAL_DIR))

from eval_dataset import eval_dataset
from eval_dataset_gt import eval_dataset_gt
from predict import predict
from scorer import answers_with_product_detail, factual_accuracy

# ── MLflow setup ─────────────────────────────────────────────────────────────
# MLFLOW_TRACKING_URI and MLFLOW_EXPERIMENT_ID are loaded from .env.local
_EXPERIMENT_ID = os.environ.get("MLFLOW_EXPERIMENT_ID", "").strip()
if not _EXPERIMENT_ID:
    raise EnvironmentError("MLFLOW_EXPERIMENT_ID must be set in .env.local")

mlflow.set_experiment(experiment_id=_EXPERIMENT_ID)


def _short(q: str, max_len: int = 40) -> str:
    return q[:max_len] + "…" if len(q) > max_len else q


def _print_results(results, run_label: str) -> None:
    print(f"\n{'═' * 60}")
    print(f"  {run_label}")
    print(f"{'═' * 60}")
    df = results.result_df
    score_col = "answers_with_product_detail/value"
    if score_col in df.columns:
        questions = [d["inputs"]["query"] for d in eval_dataset]
        scores = df[score_col].tolist()
        for q, s in zip(questions, scores):
            mark = "✓" if s and s >= 1.0 else "✗"
            print(f"  {mark} [{s}]  {_short(q)}")
        avg = sum(s or 0 for s in scores) / len(scores)
        print(f"\n  avg answers_with_product_detail: {avg:.2f}")
    else:
        print("  (score column not found — check MLflow UI)")
        print("  columns:", list(df.columns))


def run1() -> None:
    """Baseline — default KA instructions."""
    print("\n▶ RUN 1 — baseline (default KA instructions)")
    with mlflow.start_run(run_name="run1_baseline"):
        results = mlflow.genai.evaluate(
            data=eval_dataset,
            predict_fn=predict,
            scorers=[answers_with_product_detail],
        )
    _print_results(results, "RUN 1 — baseline")

    score_col = "answers_with_product_detail/value"
    df = results.result_df
    if score_col in df.columns:
        questions = [d["inputs"]["query"] for d in eval_dataset]
        scores = df[score_col].tolist()
        failed = [(q, s) for q, s in zip(questions, scores) if not s or s < 1.0]
        if failed:
            print(f"\n  {len(failed)} question(s) scored 0 — review responses in MLflow UI")

    print("\n  Run 1 complete. Review scores above, then add guideline and re-run with --run2")


def run2() -> None:
    """After adding product-detail guideline to KA."""
    print("\n▶ RUN 2 — with guideline (explicit product detail requirements)")
    with mlflow.start_run(run_name="run2_with_guideline"):
        results = mlflow.genai.evaluate(
            data=eval_dataset,
            predict_fn=predict,
            scorers=[answers_with_product_detail],
        )
    _print_results(results, "RUN 2 — with guideline")


def _print_gt_results(results, run_label: str) -> None:
    print(f"\n{'═' * 70}")
    print(f"  {run_label}")
    print(f"{'═' * 70}")
    df = results.result_df
    detail_col = "answers_with_product_detail/value"
    factual_col = "factual_accuracy/value"
    questions = [d["inputs"]["query"] for d in eval_dataset_gt]

    has_detail = detail_col in df.columns
    has_factual = factual_col in df.columns

    if not has_detail and not has_factual:
        print("  (score columns not found — check MLflow UI)")
        print("  columns:", list(df.columns))
        return

    detail_scores = df[detail_col].tolist() if has_detail else [None] * len(questions)
    factual_scores = df[factual_col].tolist() if has_factual else [None] * len(questions)

    for q, d, f in zip(questions, detail_scores, factual_scores):
        d_mark = "✓" if d and d >= 1.0 else "✗"
        f_mark = "✓" if f and f >= 1.0 else "✗"
        print(f"  detail={d_mark} factual={f_mark}  {_short(q)}")

    if has_detail:
        avg_d = sum(s or 0 for s in detail_scores) / len(detail_scores)
        print(f"\n  avg answers_with_product_detail: {avg_d:.2f}")
    if has_factual:
        avg_f = sum(s or 0 for s in factual_scores) / len(factual_scores)
        print(f"  avg factual_accuracy:            {avg_f:.2f}")


def run_gt() -> None:
    """Ground-truth evaluation — factual accuracy against expected answers."""
    print("\n▶ GROUND-TRUTH EVAL — factual accuracy against reference answers")
    with mlflow.start_run(run_name="run_gt_factual"):
        results = mlflow.genai.evaluate(
            data=eval_dataset_gt,
            predict_fn=predict,
            scorers=[answers_with_product_detail, factual_accuracy],
        )
    _print_gt_results(results, "GROUND-TRUTH EVAL")

    factual_col = "factual_accuracy/value"
    df = results.result_df
    if factual_col in df.columns:
        questions = [d["inputs"]["query"] for d in eval_dataset_gt]
        scores = df[factual_col].tolist()
        failed = [(q, s) for q, s in zip(questions, scores) if not s or s < 1.0]
        if failed:
            print(f"\n  {len(failed)} question(s) failed factual accuracy — review in MLflow UI")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--gt" in args:
        run_gt()
    elif "--run2" in args:
        run2()
    else:
        run1()
