# LEGAL OS – DISASTER RECOVERY (DR) PLAN

## 1. Objectives & Metrics
- **RPO (Recovery Point Objective)**: < 15 minutes (continuous WAL archiving + hourly encrypted snapshots).
- **RTO (Recovery Time Objective)**: < 30 minutes for full standalone restoration to an isolated environment.

---

## 2. Disaster Scenarios & Playbooks

### Scenario A: Primary Database Corruption or Accidental Data Destruction
1. **Immediate Action**: Cut off write traffic by switching backend replicas to Maintenance / Read-Only mode.
2. **Snapshot Extraction**: Retrieve the latest verified encrypted backup from offsite S3 cold storage (`s3://legalos-backups/backups/`).
3. **Decryption & Verification**:
   ```bash
   ./scripts/restore.sh /path/to/backup.sql.gz.enc /var/data/restored-lawfirm.db
   ```
4. **Integrity Validation**: Execute SQLite / PostgreSQL integrity checks and check row counts for `erp_records`, `users`, `audit_logs`.
5. **Traffic Resumption**: Re-point application connection strings to verified restored instance and rollout.

### Scenario B: Cloud Provider Region Outage (Multi-Region Failover)
1. **DNS Cutover**: Update DNS / Cloudflare CNAME to secondary standby cluster.
2. **Storage Replication**: Attach replicated persistent volume snapshots in secondary region.
3. **Application Rollout**: Apply Kubernetes manifest bundle (`kubectl apply -f k8s/`).
4. **Post-Failover Verification**: Execute `scripts/final-production-check.sh` against secondary endpoints.

---

## 3. Disaster Recovery Drill Schedule
- **Frequency**: Conducted semi-annually in an isolated staging environment.
- **Drill Script**: `./scripts/disaster-recovery-drill.sh`
- **Output Artifact**: Drill execution report logged in `docs/dr-reports/` with measured RTO and RPO metrics.
