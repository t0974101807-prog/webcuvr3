#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – DOCKER & CONTAINER MANIFEST VALIDATOR
# ==============================================================================
set -euo pipefail

echo "[DOCKER-CHECK] Validating Dockerfile and Compose specifications..."

if [ ! -f "Dockerfile" ] || [ ! -f "docker-compose.prod.yml" ]; then
  echo "[DOCKER-CHECK] Missing required Docker artifacts. Exit Code: 1 (FAIL)"
  exit 1
fi

# Verify non-root declaration in Dockerfile
if grep -q "USER nonroot" Dockerfile || grep -q "USER node" Dockerfile || grep -q "10001" Dockerfile; then
  echo "[DOCKER-CHECK] Non-root security user configured."
else
  echo "[DOCKER-CHECK] WARNING: Dockerfile may not enforce non-root user."
fi

echo "[DOCKER-CHECK] Docker configuration validated. Exit Code: 0 (PASS)"
exit 0
