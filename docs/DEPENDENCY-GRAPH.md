# LEGAL OS – SYSTEM DEPENDENCY GRAPH & BLAST RADIUS MATRIX

```
                        ┌──────────────────────────────┐
                        │      Client Web / Mobile     │
                        └──────────────┬───────────────┘
                                       │
                        ┌──────────────▼───────────────┐
                        │      Cloud Load Balancer     │ [CRITICAL]
                        └──────────────┬───────────────┘
                                       │
                        ┌──────────────▼───────────────┐
                        │    Ingress / NGINX Proxy     │ [CRITICAL]
                        └──────────────┬───────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
        ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
        │  Backend API  │      │ Async Worker  │      │  AI Agent Pod │
        │  (Replicas)   │      │ (OCR/PDF/RAG) │      │  (Isolated)   │
        └───────┬───────┘      └───────┬───────┘      └───────┬───────┘
                │                      │                      │
        ┌───────┼──────────────┬───────┼──────────────┐       │
        ▼       ▼              ▼       ▼              ▼       ▼
    ┌──────┐ ┌──────┐      ┌──────┐ ┌──────┐      ┌──────────────┐
    │  DB  │ │Redis │      │Object│ │Audit │      │ External AI  │
    │(ACID)│ │(HA)  │      │Store │ │ Logs │      │ (Gemini/LLM) │
    └──────┘ └──────┘      └──────┘ └──────┘      └──────────────┘
    [CRIT]   [DEGRADABLE]  [CRIT]   [CRIT]          [OPTIONAL]
```

## Blast Radius & Failure Classification

| Component | Classification | If Outage Occurs (Blast Radius) | Fallback / Mitigation Mechanism |
|---|---|---|---|
| **SQL Database (PostgreSQL)** | **CRITICAL** | Write transactions rejected; System shifts to read-only replica or controlled 503 | Auto-failover to standby replica; cached queries served |
| **In-Memory Cache (Redis)** | **DEGRADABLE** | Session lookup slows down slightly; Rate limiter uses in-memory process token bucket | Express fallback to memory store; zero system crash |
| **Object Storage (S3/GCS)** | **CRITICAL** | New file uploads queued to staging disk; Downloads of cached docs unaffected | Staging disk queue reconciles when S3 restores |
| **AI LLM Provider (Gemini)** | **OPTIONAL** | Document drafting suggestions unavailable | Circuit breaker shifts to deterministic parser; Core ERP (Cases, Invoices, Auth) 100% available |
| **Async Worker Tier** | **OPTIONAL** | OCR scanning & export generation delayed | Tasks safely persisted in Redis Queue; worker autorestarts |
