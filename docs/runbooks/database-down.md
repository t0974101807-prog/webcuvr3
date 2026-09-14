# Runbook: Database Down (P1)

## Symptoms
- Backend logs show `SQLITE_BUSY`, `Connection refused`, or `ECONNREFUSED` on DB host.
- `/health/ready` returns HTTP 503 with `"status": "degraded"`.

## Investigation & Commands
1. Check StatefulSet status:
   ```bash
   kubectl get statefulset -n legal-os
   kubectl get pods -n legal-os -l app=legal-os-postgres
   ```
2. Check PVC & disk space:
   ```bash
   kubectl get pvc -n legal-os
   kubectl describe pvc data-legal-os-postgres-0 -n legal-os
   ```

## Mitigation & Recovery
- If disk is full: Expand PVC volume or remove old WAL archives.
- If database process corrupted: Recover from latest verified snapshot using `scripts/restore.sh`.
