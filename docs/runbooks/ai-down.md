# Runbook: AI Provider Down / Degraded (P3)

## Symptoms
- Outbound Gemini / AI calls returning 429 (quota exceeded), 503, or connection timeouts.
- Circuit breaker state moves to `OPEN` or `HALF_OPEN`.

## Architecture Guarantee
- **Core ERP functions (Case management, files, payroll, clients, invoices) remain 100% operational.**

## Investigation & Commands
1. Check circuit breaker metrics via `/health/info` or Prometheus metrics `ai_fallback_total`.
2. Verify external AI API key quotas and Google Cloud AI Studio / Vertex AI status dashboards.

## Mitigation
- Let circuit breaker manage automated failover to local deterministic legal parser.
- If upstream provider is down, trigger AI Global Kill Switch via ConfigMap if necessary:
  ```bash
  kubectl patch configmap legal-os-config -n legal-os --type merge -p '{"data":{"AI_GLOBAL_KILL_SWITCH":"true"}}'
  ```
