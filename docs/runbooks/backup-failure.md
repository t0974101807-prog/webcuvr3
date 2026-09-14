# Runbook: Backup Job Failure (P2)

## Symptoms
- Daily automated backup cron job fails or SHA-256 checksum check fails.

## Mitigation
1. Check backup job logs:
   ```bash
   kubectl logs job/legal-os-backup-cron -n legal-os
   ```
2. Manually trigger emergency backup script:
   ```bash
   ./scripts/backup.sh
   ```
3. Verify output archive file exists, is non-empty (> 1MB), and encrypted.
