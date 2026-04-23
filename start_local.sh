#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PROJECT_NAME="$(basename "$ROOT")"
AGENT_PORT=8000
UI_PORT=3000

# ── Colors ────────────────────────────────────────────────────────────────────
G="\033[32m" Y="\033[33m" R="\033[31m" B="\033[34m" W="\033[0m" BOLD="\033[1m"

banner() {
  echo -e "\n${BOLD}${B}╔══════════════════════════════════════════╗${W}"
  echo -e "${BOLD}${B}║  ${PROJECT_NAME} — local dev${W}"
  echo -e "${BOLD}${B}╚══════════════════════════════════════════╝${W}\n"
}

# ── Kill existing processes on ports ─────────────────────────────────────────
kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo -e "  ${Y}⚠${W}  Killing processes on port $port (PIDs $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  fi
}

# ── Health check ──────────────────────────────────────────────────────────────
wait_for() {
  local url=$1 label=$2 max=40 i=0
  echo -e "  Waiting for ${label}…"
  until curl -sf "$url" > /dev/null 2>&1; do
    sleep 1
    i=$((i+1))
    if [[ $i -ge $max ]]; then
      echo -e "  ${R}✗${W}  ${label} did not start in ${max}s" >&2
      return 1
    fi
  done
  echo -e "  ${G}✓${W}  ${label} ready"
}

# ── Cleanup trap ──────────────────────────────────────────────────────────────
AGENT_PID="" UI_PID=""
cleanup() {
  echo -e "\n${Y}Shutting down…${W}"
  [[ -n "$AGENT_PID" ]] && kill "$AGENT_PID" 2>/dev/null || true
  [[ -n "$UI_PID"    ]] && kill "$UI_PID"    2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Main ──────────────────────────────────────────────────────────────────────
banner

# Load env
if [[ -f .env.local ]]; then
  set -a; source .env.local; set +a
  echo -e "  ${G}✓${W}  .env.local loaded"
fi

# Kill old processes
kill_port $AGENT_PORT
kill_port $UI_PORT

# Use the project venv directly
VENV_PYTHON="$ROOT/.venv/bin/python"
VENV_UVICORN="$ROOT/.venv/bin/uvicorn"
export VIRTUAL_ENV="$ROOT/.venv"
export PATH="$ROOT/.venv/bin:$PATH"

# Validate Python
echo -e "\n  ${B}›${W} Checking Python imports…"
"$VENV_PYTHON" -c "from agent.start_server import app" || { echo -e "  ${R}✗${W}  Python import failed"; exit 1; }
echo -e "  ${G}✓${W}  Python OK"

# Start agent backend
echo -e "\n  ${B}›${W} Starting agent (port ${AGENT_PORT})…"
"$VENV_UVICORN" agent.start_server:app \
  --host 0.0.0.0 \
  --port $AGENT_PORT \
  --reload \
  > /tmp/${PROJECT_NAME}-agent.log 2>&1 &
AGENT_PID=$!

# UI (only if ui/ directory exists)
if [[ -d ui ]]; then
  # Install UI deps if needed
  if [[ ! -d ui/node_modules ]]; then
    echo -e "\n  ${B}›${W} Installing UI dependencies…"
    (cd ui && npm install --silent)
  fi

  echo -e "\n  ${B}›${W} Starting UI (port ${UI_PORT})…"
  (cd ui && npm run dev > /tmp/${PROJECT_NAME}-ui.log 2>&1) &
  UI_PID=$!
fi

# Health checks
echo ""
wait_for "http://localhost:${AGENT_PORT}/health" "Agent (port ${AGENT_PORT})"
if [[ -n "$UI_PID" ]]; then
  wait_for "http://localhost:${UI_PORT}"          "UI    (port ${UI_PORT})"
fi

echo -e "\n${BOLD}${G}All services running.${W}"
if [[ -n "$UI_PID" ]]; then
  echo -e "  ${G}→${W}  UI:    http://localhost:${UI_PORT}"
fi
echo -e "  ${G}→${W}  Agent: http://localhost:${AGENT_PORT}/health"
echo -e "\n  Logs: /tmp/${PROJECT_NAME}-agent.log"
[[ -n "$UI_PID" ]] && echo -e "         /tmp/${PROJECT_NAME}-ui.log"
echo -e "  Press ${BOLD}Ctrl+C${W} to stop.\n"

# Monitor — exit if either process dies
while true; do
  sleep 5
  if ! kill -0 "$AGENT_PID" 2>/dev/null; then
    echo -e "${R}✗  Agent process died — check /tmp/${PROJECT_NAME}-agent.log${W}" >&2
    cleanup; exit 1
  fi
  if [[ -n "$UI_PID" ]] && ! kill -0 "$UI_PID" 2>/dev/null; then
    echo -e "${R}✗  UI process died — check /tmp/${PROJECT_NAME}-ui.log${W}" >&2
    cleanup; exit 1
  fi
done
