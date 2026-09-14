# LEGAL OS – BACKUP & RESTORATION PROCEDURE

## 1. Backup Strategy & Encryption
All production databases, audit logs, and configuration state are backed up on an automated schedule.

### Characteristics:
- **Encryption**: AES-256-CBC with PBKDF2 key derivation.
- **Compression**: Gzip level 9 (`.sql.gz.enc`).
- **Retention**: 7 daily snapshots, 4 weekly snapshots, 12 monthly archives.
- **Integrity**: SHA-256 checksums generated and verified for every archive file.

```bash
# Manual or Cron Backup Execution:
BACKUP_ENCRYPTION_KEY="SecureProductionKey2026!" ./scripts/backup.sh
```

---

## 2. Restoration & Integrity Validation Procedure

Restoration must always be performed in an isolated sandbox prior to pointing live traffic:

1. **Decrypt & Extract**:
   ```bash
   BACKUP_ENCRYPTION_KEY="SecureProductionKey2026!" ./scripts/restore.sh ./backups/lawfirm-backup-20260825_000000.sql.gz.enc ./sandbox/lawfirm.db
   ```
2. **Schema & Integrity Verification**:
   ```sql
   PRAGMA integrity_check;
   PRAGMA foreign_key_check;
   SELECT count(*) FROM erp_records;
   SELECT count(*) FROM audit_logs;
   ```
3. **Smoke Test**: Launch lightweight headless backend pointing to `./sandbox/lawfirm.db` and query `/health/ready`.
4. **Promotion**: Move verified database into `/app/lawfirm.db` and trigger graceful pod restart.
