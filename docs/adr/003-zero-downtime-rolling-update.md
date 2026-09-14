# ADR 003: Zero-Downtime Rolling Update & Pod Anti-Affinity

## Status
Accepted

## Context
Legal OS serves real-time courtroom calendar alerts, active client chat sessions, and time-tracking services. Deploying new application releases must not cause connection drops or 502 Bad Gateway downtime for active lawyers and paralegals.

## Decision
1. Configure Kubernetes RollingUpdate strategy with `maxUnavailable: 0` and `maxSurge: 1`.
2. Implement PodAntiAffinity to spread backend replicas across distinct failure zones / worker nodes.
3. Configure `PodDisruptionBudget` with `minAvailable: 2`.
4. Attach `preStop` hook (`sleep 5`) and `terminationGracePeriodSeconds: 30` to allow in-flight HTTP requests and database transactions to finish cleanly before container SIGKILL.

## Consequences
- **Positive**: Zero-downtime updates with high availability.
- **Trade-off**: Requires sufficient cluster node capacity to host transient surge pods during deployment.
