# Runbook: Container OOMKilled (P2)

## Symptoms
- Container terminates with `ExitCode: 137` or `Reason: OOMKilled`.
- Kubernetes Prometheus alert `ContainerOOMKilled` fires.

## Investigation & Commands
1. Identify which container was terminated:
   ```bash
   kubectl get pods -n legal-os -o custom-columns=NAME:.metadata.name,CONTAINER:.status.containerStatuses[*].name,TERMINATION:.status.containerStatuses[*].lastState.terminated.reason
   ```
2. Inspect memory usage trends leading up to the crash:
   ```bash
   kubectl top pod -n legal-os --containers
   ```

## Mitigation
- If AI Agent was OOMKilled: The AI process restarts cleanly in isolation; verify core backend was unharmed.
- If Backend was OOMKilled: Increase `limits.memory` in `k8s/deployment.yaml` and scale replicas to distribute memory load.
