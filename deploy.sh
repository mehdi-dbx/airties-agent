#!/usr/bin/env bash
# Deploy agent-forge to Databricks.
# Usage:
#   ./deploy.sh      # full deploy
exec "$(cd "$(dirname "$0")" && pwd)/deploy/deploy.sh" "$@"
