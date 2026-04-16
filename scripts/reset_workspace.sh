#!/usr/bin/env bash
# Delete all agent-forge workspace resources (keeps Unity Catalog + KA).
# Usage:
#   ./scripts/reset_workspace.sh           # interactive reset
#   ./scripts/reset_workspace.sh --dry-run # preview only
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d "$ROOT/.venv" ]]; then
  echo "ERROR: .venv not found. Run 'uv sync' to install dependencies first."
  exit 1
fi

uv run python scripts/reset_workspace.py "$@"
