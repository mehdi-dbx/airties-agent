#!/usr/bin/env python3
"""Upload PDFs from data/pdf/ to the UC volume for Knowledge Assistants.

Volume path is derived from PROJECT_UNITY_CATALOG_SCHEMA in .env.local:
  e.g. vibe.main → /Volumes/vibe/main/doc

Usage:
  uv run python scripts/py/ka/upload_pdfs.py
  uv run python scripts/py/ka/upload_pdfs.py --dry-run
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

# Find project root by looking for pyproject.toml
def _find_root() -> Path:
    p = Path(__file__).resolve()
    for parent in [p] + list(p.parents):
        if (parent / "pyproject.toml").exists():
            return parent
    # fallback: assume scripts/py/ka/ structure
    return Path(__file__).resolve().parent.parent.parent.parent

ROOT = _find_root()
DATA_DIR = ROOT / "data" / "pdf"

G = "\033[32m"
R = "\033[31m"
Y = "\033[33m"
C = "\033[36m"
W = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

OK = f"{G}✓{W}"
FAIL = f"{R}✗{W}"
WARN = f"{Y}⚠{W}"
INFO = f"{C}→{W}"


def main() -> None:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env.local", override=True)

    spec = os.environ.get("PROJECT_UNITY_CATALOG_SCHEMA", "").strip()
    if not spec or "." not in spec:
        print(f"{FAIL} PROJECT_UNITY_CATALOG_SCHEMA not set or invalid (expected catalog.schema){W}")
        sys.exit(1)

    catalog, schema = spec.split(".", 1)
    vol_path = f"/Volumes/{catalog}/{schema}/doc"

    pdfs = sorted(DATA_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"{WARN} No PDF files found in {DATA_DIR}{W}")
        sys.exit(0)

    dry_run = "--dry-run" in sys.argv

    print(f"\n{BOLD}Uploading {len(pdfs)} PDF(s) to {vol_path}{W}\n")

    for pdf in pdfs:
        remote = f"{vol_path}/{pdf.name}"
        if dry_run:
            print(f"  {INFO} {DIM}would upload:{W} {pdf.name} {DIM}→ {remote}{W}")
        else:
            try:
                from databricks.sdk import WorkspaceClient
                w = WorkspaceClient()
                with open(pdf, "rb") as f:
                    w.files.upload(remote, f, overwrite=True)
                print(f"  {OK} {pdf.name}")
            except Exception as e:
                print(f"  {FAIL} {pdf.name}: {e}{W}")

    if dry_run:
        print(f"\n  {WARN} {DIM}--dry-run: no files uploaded{W}")
    else:
        print(f"\n  {OK} Done")


if __name__ == "__main__":
    main()
