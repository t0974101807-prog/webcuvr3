#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – PRODUCTION TEST RUNNER
# ==============================================================================
set -euo pipefail

echo "[TEST-CHECK] Running TypeScript linter..."
if npm run lint; then
  echo "[TEST-CHECK] Linter PASSED."
else
  echo "[TEST-CHECK] Linter FAILED."
  exit 1
fi

echo "[TEST-CHECK] Running Automated Acceptance Gate Suite..."
if npx tsx scripts/test-acceptance.ts; then
  echo "[TEST-CHECK] Acceptance test suite PASSED. Exit Code: 0 (PASS)"
  exit 0
else
  echo "[TEST-CHECK] Acceptance test suite FAILED. Exit Code: 1 (FAIL)"
  exit 1
fi
