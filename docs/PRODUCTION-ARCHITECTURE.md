# LEGAL OS – PRODUCTION ARCHITECTURE & GOVERNANCE MODEL

## 1. Executive Summary & Core Principle
LEGAL OS Enterprise is designed with a **Decoupled Resilient Architecture** based on the fundamental tenet:
> **PRINCIPLE: The Core System (Authentication, Case Management, Invoicing, Document Storage, Compliance) must NEVER depend on AI availability.**

When Generative AI (Gemini / Anthropic / Local LLM) is available and healthy, it acts as an accelerator (Primary Mode). When AI encounters rate limits (429), timeouts, quota exhaustion, network partitions, or OOM crashes, the system gracefully shifts into Fallback / Degraded Mode without interrupting core legal practice operations.

---

## 2. Master Top-Level Architecture

```
                                [ External Internet ]
                                         │
                                  [ Cloudflare / WAF ]
                                         │ (HTTPS / TLS 1.3)
                           [ Kubernetes Ingress Controller ]
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                 [ Static Assets ]              [ Express API Tier ]
                 (CDN / Nginx)              (legal-os-backend Replicas)
                                                         │
               ┌───────────────────────┬─────────────────┼────────────────────────┐
               ▼                       ▼                 ▼                        ▼
      [ Auth & RBAC ]         [ Case / Docs ERP ]   [ SQL Database ]       [ Redis Cache / Queue ]
   (JWT / Session Store)       (Business Logic)     (PostgreSQL ACID)       (Jobs & Session Data)
               │                                         │                        │
               │                                         ▼                        ▼
               │                                [ Object Storage / S3 ]   [ Async Worker Tier ]
               │                                 (Encrypted Documents)     (OCR, PDF, Indexing)
               ▼
     [ AI Orchestrator Gateway ]
    (Circuit Breaker Protected)
               │
        ┌──────┴──────────────────────────┐
        ▼ (Primary)                       ▼ (Isolated Failover)
[ Remote LLM API ]              [ Rule-based Legal Parser / Cache ]
(Gemini 2.5/3.0 / Claude)        (Deterministic Fallback Engine)
```

---

## 3. High Availability & Failure Domain Isolation

1. **Backend Service Replicas**:
   - Deployed with `PodAntiAffinity` across multiple Kubernetes worker nodes/zones.
   - Zero-Downtime Rolling Update: `maxSurge: 1`, `maxUnavailable: 0`.
   - Pod Disruption Budget: `minAvailable: 2`.

2. **AI Tier Bulkhead Isolation**:
   - The AI Agent (`legal-os-ai-agent`) runs in an isolated Deployment and container with hard memory limits (`limits.memory: 1Gi`).
   - If AI processes run out of memory (`OOMKilled`), the kernel terminates only the AI container without affecting the core backend or database.

3. **Storage & Persistence**:
   - PostgreSQL runs as a `StatefulSet` with `PersistentVolumeClaim` backed by high-IOPS SSDs.
   - Write-Ahead Logging (WAL) and automated point-in-time recovery (PITR).
   - Document binaries are streamed directly to S3-compatible object storage via signed, time-limited URLs.
