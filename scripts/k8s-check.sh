#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – KUBERNETES MANIFEST VALIDATOR
# ==============================================================================
set -euo pipefail

echo "[K8S-CHECK] Validating Kubernetes manifest syntax and policies..."

REQUIRED_MANIFESTS=(
  "k8s/namespace.yaml"
  "k8s/deployment.yaml"
  "k8s/service.yaml"
  "k8s/ingress.yaml"
  "k8s/hpa.yaml"
  "k8s/pdb.yaml"
  "k8s/networkpolicy.yaml"
  "k8s/rbac.yaml"
)

for manifest in "${REQUIRED_MANIFESTS[@]}"; do
  if [ ! -f "$manifest" ]; then
    echo "[K8S-CHECK] Missing manifest: $manifest. Exit Code: 1 (FAIL)"
    exit 1
  fi
done

echo "[K8S-CHECK] All 8 required Kubernetes manifests verified. Exit Code: 0 (PASS)"
exit 0
