# Runbook: Database Restore Execution (P1)

## Prerequisites
- Authorized by Incident Commander.
- Latest verified backup artifact (`.sql.gz.enc`).

## Step-by-Step Restoration
1. Scale backend to 0 to prevent incoming database writes:
   ```bash
   kubectl scale deployment/legal-os-backend -n legal-os --replicas=0
   ```
2. Execute restoration script into target volume:
   ```bash
   BACKUP_ENCRYPTION_KEY="SecureProductionKey2026!" ./scripts/restore.sh ./backups/latest-backup.sql.gz.enc /var/data/lawfirm.db
   ```
3. Run verification integrity checks:
   ```bash
   sqlite3 /var/data/lawfirm.db "PRAGMA integrity_check;"
   ```
4. Scale backend back up:
   ```bash
   kubectl scale deployment/legal-os-backend -n legal-os --replicas=3
   ```
5. Run smoke test `/health/ready` to verify 200 OK.
