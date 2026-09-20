#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – PRODUCTION CLUSTER & SERVICE HEALTH VERIFICATION
# ==============================================================================
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

echo "================================================================="
echo " [LEGAL OS HEALTH CHECK] Testing services at ${BASE_URL}"
echo "================================================================="

# 1. Healthz / Basic Ping
echo -n "--> Checking /healthz HTTP endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/healthz")
if [ "${HTTP_CODE}" -eq 200 ]; then
  echo "OK [200]"
else
  echo "FAILED [${HTTP_CODE}]"
  exit 1
fi

# 2. Detailed Health & Subsystem Status
echo -n "--> Checking /health detailed JSON status... "
RESPONSE=$(curl -s "${BASE_URL}/health")
if echo "${RESPONSE}" | grep -q '"status":"ok"'; then
  echo "OK"
else
  echo "FAILED (${RESPONSE})"
  exit 1
fi

# 3. System Metrics & Memory Monitor API
echo -n "--> Checking /api/system/metrics endpoint... "
METRICS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/system/metrics" || echo "404")
if [ "${METRICS_STATUS}" -eq 200 ] || [ "${METRICS_STATUS}" -eq 401 ]; then
  echo "OK [${METRICS_STATUS}]"
else
  echo "WARNING [${METRICS_STATUS}]"
fi

# 4. AI Endpoint Resiliency Check (Should not crash or return 500 when AI is unavailable)
echo -n "--> Checking AI Service Circuit Breaker & Resiliency... "
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/ai/ask" -H "Content-Type: application/json" -d '{"prompt":"Ping"}' || echo "500")
if [ "${AI_STATUS}" -ne 500 ]; then
  echo "OK (Status ${AI_STATUS}: Gracefully Handled)"
else
  echo "FAILED (Received 500 Internal Server Error)"
  exit 1
fi

echo "================================================================="
echo " [LEGAL OS HEALTH CHECK] All health gates verified successfully!"
echo "================================================================="
