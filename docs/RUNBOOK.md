# Legal OS – Production Operational Runbook

## 1. Incident Response Procedures

### 1.1 Pod OOMKilled / High Memory Warning
1. **Symptom**: Pod restart count increments, `kubectl describe pod` shows `OOMKilled` (Exit code 137).
2. **Immediate Action**:
   - Check which tier crashed:
     - If `legal-os-ai-agent` crashed: Core ERP is intact. No customer impact on login/case records.
     - If `legal-os-api` crashed: Check if a large file upload or PDF conversion caused the spike.
3. **Remediation**:
   - Verify that concurrency throttles in `configmap.yaml` are active (`PDF_MAX_CONCURRENCY=2`).
   - Check `scripts/healthcheck.sh` output.
   - Adjust resource limits in `k8s/deployment.yaml` if regular workload increased.

### 1.2 Database Connection Saturation
1. **Symptom**: HTTP 500 errors mentioning `too many clients` or query timeouts.
2. **Immediate Action**:
   - Verify active connections: `SELECT count(*) FROM pg_stat_activity;`
   - Restart idle connections or increase `max_connections` in `docker/postgres/postgresql.conf`.

### 1.3 AI Provider Quota Exhaustion
1. **Symptom**: AI responses return fallback messages or quota exceeded errors.
2. **Immediate Action**:
   - System automatically degrades gracefully and logs provider state.
   - Insert alternative fallback API key in `/api/ai/providers` or update Kubernetes Secret.

## 2. Routine Maintenance Procedures
- **Daily Automated Backup**: Executed at 02:00 UTC via `scripts/backup.sh`.
- **Pre-Deployment Check**: Run `scripts/pre-flight-check.sh` before promoting releases.
- **Chaos Verification**: Run `scripts/disaster-recovery-drill.sh` monthly in staging.
