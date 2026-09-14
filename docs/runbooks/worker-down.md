# Runbook: Async Worker Down (P2)

## Symptoms
- Background tasks (PDF generation, OCR scanning, export archiving) remain in `QUEUED` state without progressing.

## Investigation & Commands
1. Check worker deployment:
   ```bash
   kubectl get pods -n legal-os -l app=legal-os-worker
   kubectl logs -n legal-os -l app=legal-os-worker --tail=100
   ```

## Mitigation
- Restart worker pods: `kubectl rollout restart deployment/legal-os-worker -n legal-os`.
- Scale workers if queue depth is growing: `kubectl scale deployment/legal-os-worker -n legal-os --replicas=5`.
