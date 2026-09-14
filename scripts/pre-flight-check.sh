#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – PRODUCTION PRE-FLIGHT VERIFICATION SCRIPT
# ==============================================================================
set -euo pipefail

echo "================================================================="
echo " [LEGAL OS PRE-FLIGHT CHECK] Validating Production Readiness"
echo "================================================================="

ERRORS=0

# 1. Check Node.js / Runtime Version
echo -n "--> Checking Node.js runtime... "
NODE_VERSION=$(node -v 2>/dev/null || echo "NOT_FOUND")
if [[ "${NODE_VERSION}" =~ ^v(20|22) ]]; then
  echo "PASS (${NODE_VERSION})"
else
  echo "WARN (Found ${NODE_VERSION}, expected Node 20+)"
fi

# 2. Check Build Outputs
echo -n "--> Checking compiled distribution artifacts... "
if [ -f "dist/server.cjs" ] && [ -f "dist/index.html" ]; then
  echo "PASS (dist/server.cjs and dist/index.html found)"
else
  echo "FAIL (Missing build artifacts. Run 'npm run build' first.)"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check Configuration & Environment Template
echo -n "--> Checking .env.example template... "
if [ -f ".env.example" ]; then
  echo "PASS"
else
  echo "FAIL (.env.example not found)"
  ERRORS=$((ERRORS + 1))
fi

# 4. Check Kubernetes Manifests
echo -n "--> Checking Kubernetes manifests integrity... "
REQUIRED_K8S_FILES=(
  "k8s/namespace.yaml"
  "k8s/deployment.yaml"
  "k8s/service.yaml"
  "k8s/configmap.yaml"
  "k8s/secrets.yaml"
  "k8s/hpa.yaml"
  "k8s/pdb.yaml"
  "k8s/networkpolicy.yaml"
  "k8s/rbac.yaml"
  "k8s/ingress.yaml"
)

MISSING_K8S=0
for f in "${REQUIRED_K8S_FILES[@]}"; do
  if [ ! -f "${f}" ]; then
    echo -e "\n    Missing manifest: ${f}"
    MISSING_K8S=$((MISSING_K8S + 1))
  fi
done

if [ "${MISSING_K8S}" -eq 0 ]; then
  echo "PASS (All 10 Core K8s manifests present)"
else
  echo "FAIL (${MISSING_K8S} manifests missing)"
  ERRORS=$((ERRORS + 1))
fi

# 5. Check Docker Configuration
echo -n "--> Checking Docker configurations... "
if [ -f "Dockerfile" ] && [ -f "docker-compose.yml" ] && [ -f "docker/nginx/nginx.conf" ]; then
  echo "PASS"
else
  echo "FAIL (Missing Dockerfile, docker-compose.yml, or docker/nginx/nginx.conf)"
  ERRORS=$((ERRORS + 1))
fi

echo "================================================================="
if [ "${ERRORS}" -eq 0 ]; then
  echo " [RESULT] PRE-FLIGHT PASSED: System is READY for Production Deployment."
  exit 0
else
  echo " [RESULT] PRE-FLIGHT FAILED with ${ERRORS} error(s). Fix issues before Go-Live."
  exit 1
fi
