#!/usr/bin/env bash
# Start the visual architecture viewer.
# Backend (graph API) on port 9001, frontend (React Flow) on port 9000.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install deps on first run
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
  echo "[visual] Installing backend deps..."
  (cd "$SCRIPT_DIR/backend" && npm install)
fi
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
  echo "[visual] Installing frontend deps..."
  (cd "$SCRIPT_DIR/frontend" && npm install)
fi

trap 'kill 0' SIGINT SIGTERM

echo "[visual] Backend  → http://localhost:9001/api/graph"
echo "[visual] Frontend → http://localhost:9000"
echo "[visual] Stop with Ctrl+C"
echo ""

(cd "$SCRIPT_DIR/backend"  && node index.js) &
(cd "$SCRIPT_DIR/frontend" && npx vite --port 9000) &

wait
