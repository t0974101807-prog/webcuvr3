# Runbook: High Memory Saturation (P2)

## Symptoms
- Container working set bytes > 80% of limit.
- Garbage collection frequency spikes.

## Investigation
```bash
kubectl top pod -n legal-os
kubectl exec -it deployment/legal-os-backend -n legal-os -- node -e "console.log(process.memoryUsage())"
```

## Mitigation
- In-memory event loop throttle triggers automatically to shed non-essential background tasks.
- If memory leak suspected, generate heap snapshot and restart pod sequentially.
