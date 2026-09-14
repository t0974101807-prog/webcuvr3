#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – PRODUCTION BUILD VALIDATOR
# ==============================================================================
set -euo pipefail

echo "[BUILD-CHECK] Starting production TypeScript build and bundle..."
if npm run build; then
  echo "[BUILD-CHECK] Production build succeeded. Exit Code: 0 (PASS)"
  exit 0
else
  echo "[BUILD-CHECK] Production build failed. Exit Code: 1 (FAIL)"
  exit 1
fi
