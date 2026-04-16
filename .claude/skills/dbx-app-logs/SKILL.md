---
name: dbx-app-logs
description: Fetch and display Databricks app logs for agent-vibe-app. Triggered when user says /dbx-app-logs, "pull app logs", "check app logs", "what's in the app logs", "fetch remote logs", or similar.
---

# DBX App Logs

Fetches logs from the deployed Databricks App (`agent-vibe-app`) using the CLI.

## Workflow

### 1. Load env and fetch logs

```bash
set -a && source .env.local && set +a && databricks apps logs "$DBX_APP_NAME" --tail-lines 100 2>&1
```

### 2. Filter and display

Strip the noisy `[SYSTEM] [INFO] Updated file:` lines — they are source-sync noise and hide the real signal:

```bash
set -a && source .env.local && set +a \
  && databricks apps logs "$DBX_APP_NAME" --tail-lines 100 2>&1 \
  | grep -v "\[SYSTEM\] \[INFO\] Updated file"
```

### 3. Interpret

Focus on these log prefixes:
- `[BUILD]` — pip/package install phase. Look for `ERROR` lines.
- `[SYSTEM] [ERROR]` — runtime system errors (secret resolution, deploy failures).
- `[APP]` — actual application stdout/stderr. This is where crashes and 5xx errors appear.
- `[SYSTEM] [INFO] Starting app with command:` — confirms what command ran.
- `[SYSTEM] [INFO] Deployment ... ended` — final deploy status.

Common patterns:
- `Failed to spawn: start-app` — entry point not registered
- `app crashed unexpectedly` — check `[APP]` lines above it
- `503 Service Unavailable` on `GET /` — frontend proxy (port 3000) not running, not a crash
- `secrets/agent-forge/AGENT_MODEL_TOKEN not found` — non-fatal warning, secret not injected
- `Requirements have not changed. Skipping installation.` — pip cache hit, no reinstall

## Notes

- `DBX_APP_NAME` is read from `.env.local` (currently `agent-vibe-app`)
- Increase `--tail-lines` if the deploy was long and logs are cut off
- To stream live logs: `databricks apps logs "$DBX_APP_NAME" --follow`
