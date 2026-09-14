# Legal OS – Production Architecture & System Topography

## 1. High-Level Architecture Topology

```
                       INTERNET
                          │
                   HTTPS / WAF / CDN
                          │
                     K8S INGRESS
                (TLS Termination & Rate-Limit)
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
 [ legal-os-api ]                   [ legal-os-worker ]
 (Core ERP, Auth, Cases)            (OCR, PDF, Background Jobs)
        │                                   │
        ├─────────────────┬─────────────────┤
        │                 │                 │
        ▼                 ▼                 ▼
[ PostgreSQL HA ]     [ Redis ]     [ legal-os-ai-agent ]
 (Persistent Data)  (Queue/Cache)   (Isolated AI Service)
                                            │
                                            ▼
                               [ Fallback AI Providers ]
                             (Gemini -> OpenAI -> Claude)
```

## 2. Failure Hierarchy & Self-Healing Model

### Principle: AI is an Enhancement, NOT a Survival Condition
- **Core Operations**: User Login, Case Management, Financial Auditing, and Contract Storage operate strictly on the relational database and cache layers.
- **AI Outage Isolation**: If the AI Agent service crashes, suffers OOMKilled, or runs out of API quota, the core Legal OS continues operating with zero downtime.
- **Circuit Breaker**: The backend AI integration automatically traps errors, switches between candidate providers (Gemini, OpenRouter, OpenAI, Claude, DeepSeek), and fails over gracefully without 500 server crashes.

## 3. Kubernetes Orchestration Specs
- **Zero-Downtime Rolling Updates**: Configured with `maxSurge: 1` and `maxUnavailable: 0`.
- **Probes**:
  - `startupProbe`: Allows up to 30s for database migrations and warm-up.
  - `readinessProbe`: Validates health before traffic routing.
  - `livenessProbe`: Recovers stuck pods automatically.
- **Resource Protection**:
  - Node old space memory size capped at 768MB / 1536MB to prevent unmanaged V8 heap bloat.
  - Memory Monitor subsystem proactively logs memory pressure and throttles concurrent PDF/OCR tasks before container OOM thresholds are breached.
