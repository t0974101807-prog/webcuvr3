# ADR 001: AI Circuit Breaker & Core System Isolation

## Status
Accepted

## Context
Legal OS relies on generative AI for legal document drafting, contract analysis, and voice-to-text transcription. If external AI endpoints experience latency spikes (p99 > 15s), HTTP 429 rate limits, or complete provider outages, the core ERP operations (case management, user authentication, invoice generation, attendance tracking) must not freeze or throw HTTP 500 errors.

## Decision
1. Isolate the AI agent into a separate process and dedicated Kubernetes deployment (`legal-os-ai-agent`).
2. Wrap all outbound AI API calls in a Circuit Breaker pattern with 3 states: `CLOSED` (normal), `OPEN` (failover active, bypass remote calls), `HALF_OPEN` (probe requests).
3. If the primary provider is unavailable, fallback to secondary local heuristics or return a graceful `DEGRADED` status response without crashing the client interface.

## Consequences
- **Positive**: Core legal records and case files remain 100% accessible even during third-party AI outages.
- **Trade-off**: When in degraded mode, AI suggestions are temporarily unavailable until the circuit breaker resets.
