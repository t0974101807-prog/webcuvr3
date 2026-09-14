# Runbook: Backend Down (P1)

## Symptoms
- Ingress returning 502 Bad Gateway or 504 Gateway Timeout.
- Kubernetes backend pods crashing or failing liveness/readiness probes.

## Investigation & Commands
1. Check pod status:
   ```bash
   kubectl get pods -n legal-os -l app=legal-os-backend
   ```
2. Inspect logs of failing pods:
   ```bash
   kubectl logs -n legal-os -l app=legal-os-backend --tail=100
   ```
3. Describe failing pod:
   ```bash
   kubectl describe pod -n legal-os <pod-name>
   ```

## Mitigation & Recovery
- If pods are in CrashLoopBackOff due to bad release: Execute `kubectl rollout undo deployment/legal-os-backend -n legal-os`.
- If database connection exhausted: Check database connection pool and scale up PostgreSQL connections or restart backend pods.
