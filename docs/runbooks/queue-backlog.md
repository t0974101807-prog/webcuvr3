# Runbook: Queue Backlog Spikes (P3)

## Symptoms
- Pending background job count > 500 items.
- Processing latency for uploaded attachments exceeds 5 minutes.

## Mitigation
- Scale async worker tier:
  ```bash
  kubectl scale deployment/legal-os-worker -n legal-os --replicas=8
  ```
- Purge poison/dead-letter messages into DLQ if worker is crashing repeatedly on a single corrupted payload.
