# Runbook: Redis Down (P2)

## Symptoms
- Session lookup failures, queue worker halts, or rate limiter falling back to in-memory mode.

## Investigation & Commands
1. Check Redis pod status:
   ```bash
   kubectl get pods -n legal-os -l app=legal-os-redis
   ```
2. Verify Redis memory usage & evictions:
   ```bash
   kubectl exec -it deployment/legal-os-redis -n legal-os -- redis-cli info memory
   ```

## Mitigation
- Backend automatically shifts to local in-memory session/cache mode to prevent core outage.
- Restart Redis deployment: `kubectl rollout restart deployment/legal-os-redis -n legal-os`.
