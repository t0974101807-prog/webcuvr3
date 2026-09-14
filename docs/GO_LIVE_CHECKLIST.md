# Legal OS – Production Go-Live Checklist

## Phase 1: T-24 Hours (Pre-Flight & Verification)
- [x] Run `npm run lint` and `npm run build` to confirm 100% clean compilation.
- [x] Validate all Kubernetes manifests in `/k8s` (`k8s/deployment.yaml`, `k8s/ingress.yaml`, etc.).
- [x] Confirm non-root container user (`10001`) and read-only root security contexts.
- [x] Verify database migration scripts and initial seed data.
- [x] Verify backup automation script (`scripts/backup.sh`) and dry-run restore (`scripts/restore.sh`).

## Phase 2: T-2 Hours (Staging Smoke Test & Secrets Sync)
- [x] Deploy staging cluster and apply `k8s/secrets.yaml` with production credentials.
- [x] Run `scripts/healthcheck.sh` on the staging endpoints.
- [x] Run `scripts/disaster-recovery-drill.sh` to confirm graceful AI failure and zero downtime.
- [x] Confirm TLS certificate provisioning via cert-manager on `legalos.vn`.

## Phase 3: T-0 (Production Cutover & Traffic Migration)
- [x] Trigger Kubernetes rolling update (`maxSurge: 1`, `maxUnavailable: 0`).
- [x] Monitor rollout status with `kubectl rollout status deployment/legal-os-api -n legal-os-prod`.
- [x] Confirm zero dropped requests during cutover.

## Phase 4: T+1 Hour (Post-Launch Monitoring & Verification)
- [x] Inspect Prometheus & Grafana memory and CPU dashboards.
- [x] Verify `/healthz` and `/health` endpoints are returning 200 OK.
- [x] Validate Memory Monitor telemetry logs in `/api/system/metrics`.
- [x] Confirm WAF rate-limiting is actively filtering bad actors.
