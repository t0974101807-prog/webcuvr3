# LEGAL OS – MASTER OPERATIONS RUNBOOK

## 1. Incident Classification & Severity Levels
| Level | Criteria | Response Time | Action |
|---|---|---|---|
| **P1** | Core API down, DB unreachable, active data loss, security breach | < 15 minutes | Halt all non-essential deployments, notify Incident Commander, initiate immediate mitigation. |
| **P2** | Major feature degraded, elevated p99 latency (> 3s), multiple backend pods restarting | < 30 minutes | Review telemetry, trigger HPA scale-up, or rollback release. |
| **P3** | Third-party AI provider outage, async worker backlog, non-critical background task failure | < 2 hours | Circuit breaker automatically switches to fallback mode; notify AI team. |
| **P4** | Informational metric alert, minor UI cosmetic issue | Next business day | Log ticket in sprint backlog. |

---

## 2. Directory of Specific Runbooks
- [Backend Outage](runbooks/backend-down.md)
- [Database Outage](runbooks/database-down.md)
- [Redis Outage](runbooks/redis-down.md)
- [Async Worker Outage](runbooks/worker-down.md)
- [AI Provider Down / Degraded](runbooks/ai-down.md)
- [Container OOM (Out of Memory)](runbooks/oom.md)
- [High CPU Saturation](runbooks/high-cpu.md)
- [High Memory Saturation](runbooks/high-memory.md)
- [Queue Backlog Spikes](runbooks/queue-backlog.md)
- [Object Storage Failure](runbooks/storage-failure.md)
- [TLS Certificate Expiration](runbooks/certificate-expiry.md)
- [Security Incident & Breach Containment](runbooks/security-incident.md)
- [Backup Failure](runbooks/backup-failure.md)
- [Database Restore](runbooks/restore.md)
- [Rollback Execution](runbooks/rollback.md)
