# Runbook: High CPU Saturation (P2)

## Symptoms
- Pod CPU usage exceeds 85% of request/limit.
- Response latency increases.

## Investigation
```bash
kubectl top pod -n legal-os
```

## Mitigation
- Verify HPA (Horizontal Pod Autoscaler) has scaled up replicas.
- Manually increase replicas if sudden traffic surge:
  ```bash
  kubectl scale deployment/legal-os-backend -n legal-os --replicas=6
  ```
