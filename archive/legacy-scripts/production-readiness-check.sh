#!/usr/bin/env bash
# ==============================================================================
# LEGAL OS – PRODUCTION READINESS & GOVERNANCE ORCHESTRATOR
# ==============================================================================
set -euo pipefail

echo "============================================================"
echo " LEGAL OS – FINAL PRODUCTION READINESS & GOVERNANCE AUDIT"
echo "============================================================"

# Run test acceptance gate
npx tsx scripts/test-acceptance.ts

# Run sub-checks
./scripts/security-check.sh
./scripts/docker-check.sh
./scripts/k8s-check.sh
./scripts/migration-check.sh

echo "============================================================"
echo " ALL GATES PASSED: 100% PRODUCTION COMPLIANCE"
echo "============================================================"
exit 0
