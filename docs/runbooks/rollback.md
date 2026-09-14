# Runbook: Release Rollback Execution (P1/P2)

## Triggers
- Core API error rate > 1%.
- Unrecoverable regression in case management or financial billing.

## Rollback Execution Steps
1. Rollback Kubernetes deployment revision:
   ```bash
   kubectl rollout undo deployment/legal-os-backend -n legal-os
   kubectl rollout undo deployment/legal-os-worker -n legal-os
   ```
2. Monitor rolling replacement:
   ```bash
   kubectl rollout status deployment/legal-os-backend -n legal-os
   ```
3. Verify `/health/live` and `/health/ready` on all pods.
