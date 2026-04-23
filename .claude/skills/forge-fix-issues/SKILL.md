# Agent Forge — Fix Issues

Diagnoses and auto-fixes known deployment issues. Claude runs checks, detects the problem, applies the fix, and confirms resolution — no terminal commands for the user.

Reference doc: `docs/known-issues.md`

## When to invoke

- Deploy exits non-zero but app may be running
- `GET /` returns 500 after deploy
- Bundle validate fails with wrong workspace
- Deploy lock blocks re-deploy
- Tables or Genie missing on a fresh environment
- PAT rejected after workspace switch

## Flow

### 1. Load state (run in parallel)

```bash
grep -E "^(DATABRICKS_HOST|DATABRICKS_TOKEN|DATABRICKS_WAREHOUSE_ID|PROJECT_UNITY_CATALOG_SCHEMA|DBX_APP_NAME)" /Users/mehdi.lamrani/code/code/agent-forge/.env.local 2>/dev/null
```
```bash
cd /Users/mehdi.lamrani/code/code/agent-forge && uv run python scripts/py/setup_dbx_env.py --check 2>&1
```

### 2. Check app status
```bash
DATABRICKS_HOST=$(grep "^DATABRICKS_HOST=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2) \
DATABRICKS_TOKEN=$(grep "^DATABRICKS_TOKEN=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2) \
databricks apps get "$(grep "^DBX_APP_NAME=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2)" 2>&1
```

### 3. Present diagnosis

```
forge-fix-issues — Diagnosis

[+]  env vars           all present
[x]  --check            some checks failed
[x]  app status         500 on GET /  OR  RUNNING
[x]  known issues       detected: #N, #M
```

Map symptoms to known issues (see table below). Show which apply.

### 4. Offer fixes

Show only the issues detected:

```
Detected issues:

[1]  #6 — Frontend dist missing (500 on GET /)       → npm install + build:client on next startup
[2]  #2 — Tables missing in schema                    → run create_flights.sql fallback
[3]  #5 — Deploy lock stuck                           → bundle deploy --force-lock
[4]  #3 — Wrong CLI profile for bundle validate       → (informational — source .env.local before CLI)
[5]  #4 — deploy.sh false exit 1 (grants timing)      → (informational — app is actually running)
[6]  #1 — Stale PAT after workspace switch             → regenerate PAT

[A]  Fix all detected issues
[S]  Skip — I'll handle manually
```

### 5. Apply fixes

Apply each selected fix in order. Each fix is self-contained below.

---

## Fix #1 — Stale PAT after workspace switch

**Detect:** `DATABRICKS_TOKEN` is set but connection check fails with 401/403, AND `DATABRICKS_HOST` changed recently.

**Fix:**
```bash
cd /Users/mehdi.lamrani/code/code/agent-forge && uv run python -c "
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from scripts.py.setup_dbx_env import _profile_for_host, _isolated_client, _redact, write_env_entry, ENV_FILE
import os
host = os.environ['DATABRICKS_HOST'].strip()
profile = _profile_for_host(host)
if not profile: print('[x] No matching CLI profile for', host); exit(1)
w = _isolated_client(profile)
t = w.tokens.create(comment='agent-forge-init', lifetime_seconds=604800)
write_env_entry(ENV_FILE, 'DATABRICKS_TOKEN', t.token_value)
print('[+] PAT generated (7d):', _redact(t.token_value))
" 2>&1
```

**Verify:** Re-run `--check` and confirm connection passes.

---

## Fix #2 — Tables missing (no CSV files)

**Detect:** `--check` shows tables section failing OR `create_all_assets.py` aborted with "No tables".

**Fix:** Run the SQL fallback to create `flights`:
```bash
cd /Users/mehdi.lamrani/code/code/agent-forge && uv run python -c "
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os; from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState
spec = os.environ['PROJECT_UNITY_CATALOG_SCHEMA'].strip()
wh_id = os.environ['DATABRICKS_WAREHOUSE_ID'].strip()
w = WorkspaceClient()
sql = open('data/init/create_flights.sql').read().replace('__SCHEMA_QUALIFIED__', spec)
for stmt in [s.strip() for s in sql.split(';') if s.strip()]:
    r = w.statement_execution.execute_statement(statement=stmt, warehouse_id=wh_id, wait_timeout='30s')
    state = r.status.state
    print('[+]' if state == StatementState.SUCCEEDED else '[x]', stmt[:60].replace('\n',' '))
" 2>&1
```

After tables exist, re-run Genie setup if needed:
```bash
cd /Users/mehdi.lamrani/code/code/agent-forge && GENIE_ROOM_NAME="Checkin Metrics" uv run python data/init/create_genie_space.py 2>&1
```

**Verify:** Re-run `--check` and confirm tables section passes.

---

## Fix #3 — `databricks bundle validate` wrong profile

**Detect:** `databricks bundle validate` fails with token error referencing a different host than `DATABRICKS_HOST`.

**This is informational only** — no code fix needed. Instruct the user:
```
bundle validate must be run with env vars loaded:

  source .env.local && databricks bundle validate

deploy.sh does this automatically — only affects manual CLI usage.
```

---

## Fix #4 — `deploy.sh` false exit 1 (grants timing)

**Detect:** `deploy.sh` returned exit 1 but the app is `RUNNING` in the status check.

**This is informational only.** Show:
```
[~] deploy.sh exited non-zero but app is RUNNING — this is a known false negative.
    The grants step fails on first deploy before the service principal is fully provisioned.
    Re-run --check after a few minutes to verify grants applied.
```

Then run:
```bash
cd /Users/mehdi.lamrani/code/code/agent-forge && uv run python scripts/py/setup_dbx_env.py --check 2>&1
```

---

## Fix #5 — Bundle deploy lock stuck

**Detect:** Deploy fails with "deploy lock acquired by ... Use --force-lock to override"

**Fix:**
```bash
DATABRICKS_HOST=$(grep "^DATABRICKS_HOST=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2) \
DATABRICKS_TOKEN=$(grep "^DATABRICKS_TOKEN=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2) \
databricks bundle deploy --force-lock 2>&1
```

**Verify:** Exit code 0 and "Deployment complete!" in output.

---

## Fix #6 — Frontend `client/dist/` missing (500 on GET /)

**Detect:** App logs show `ENOENT: .../client/dist/index.html` OR `GET /` returns 500.

**Check current `start_server.py`:**
```bash
grep -n "CLIENT_DIST\|npm install\|build:client" /Users/mehdi.lamrani/code/code/agent-forge/agent/start_server.py
```

**If the build step is missing**, apply it:
```bash
python3 -c "
from pathlib import Path
f = Path('/Users/mehdi.lamrani/code/code/agent-forge/agent/start_server.py')
src = f.read_text()

old = '''@app.on_event(\"startup\")
async def start_frontend():
    if _NODE_SERVER.exists():'''

new = '''_CLIENT_DIST = Path(__file__).resolve().parents[1] / \"app\" / \"client\" / \"dist\" / \"index.html\"

@app.on_event(\"startup\")
async def start_frontend():
    if not _CLIENT_DIST.exists() and _NODE_SERVER.exists():
        _frontend_root = str(_NODE_SERVER.parents[2])
        subprocess.run([\"npm\", \"install\"], cwd=_frontend_root, check=True)
        subprocess.run([\"npm\", \"run\", \"build:client\"], cwd=_frontend_root, check=True)
    if _NODE_SERVER.exists():'''

if old in src:
    f.write_text(src.replace(old, new))
    print('[+] Build step added to start_server.py')
elif 'CLIENT_DIST' in src:
    print('[+] Build step already present — no change needed')
else:
    print('[x] Could not locate startup hook — check start_server.py manually')
"
```

After patching, redeploy:
```bash
DATABRICKS_HOST=$(grep "^DATABRICKS_HOST=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2) \
DATABRICKS_TOKEN=$(grep "^DATABRICKS_TOKEN=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2) \
databricks bundle deploy --force-lock && \
DATABRICKS_HOST=$(grep "^DATABRICKS_HOST=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2) \
DATABRICKS_TOKEN=$(grep "^DATABRICKS_TOKEN=" /Users/mehdi.lamrani/code/code/agent-forge/.env.local | cut -d= -f2) \
databricks bundle run agent_app 2>&1
```

**Verify:** App logs show `✓ built in X.XXs` and `Application startup complete.`

---

## Symptom → Issue mapping

| Symptom | Issue # |
|---------|---------|
| 401/403 after workspace switch | #1 |
| `create_all_assets.py` aborts "No tables" | #2 |
| Genie space missing after setup | #2 |
| `bundle validate` wrong host/token error | #3 |
| `deploy.sh` exit 1 but app RUNNING | #4 |
| "deploy lock acquired by..." | #5 |
| `GET /` returns 500 / ENOENT client/dist | #6 |
| App logs show `npm error` / `Cannot find module vite` | #6 |

## After all fixes

Re-run the full check:
```bash
cd /Users/mehdi.lamrani/code/code/agent-forge && uv run python scripts/py/setup_dbx_env.py --check 2>&1
```

Report final `[+]/[x]` summary to the user.
