# LEGAL OS – PRODUCTION ROLLBACK STRATEGY

## 1. Application Rollback (Kubernetes Zero-Downtime)
If a newly deployed release exhibits elevated HTTP 5xx error rates, memory leaks, or critical functional regressions:

```bash
# Check rollout history
kubectl rollout history deployment/legal-os-backend -n legal-os

# Immediately rollback to previous revision
kubectl rollout undo deployment/legal-os-backend -n legal-os

# Watch rollback status until all pods report 1/1 Ready
kubectl rollout status deployment/legal-os-backend -n legal-os
```

---

## 2. Database Schema Rollback Policy
- **Forward-Compatible Migrations (Expand/Contract)**: Database migrations must never introduce breaking destructive changes (e.g. dropping columns currently accessed by previous backend versions) in the same deployment cycle.
- **Rollback Procedure**:
  1. Rollback application pods to previous version.
  2. If a migration broke compatibility, run the corresponding down-migration script (`./scripts/migrate-down.sh <version>`).
  3. Validate database consistency.
