# LEGAL OS – SINGLE POINT OF FAILURE (SPOF) AUDIT

| Infrastructure / Component | Potential SPOF Risk | Architecture Mitigation Strategy | Current Production Status |
|---|---|---|---|
| **1. Kubernetes Cluster Nodes** | Single Node failure crashes pods | Regional GKE with 3+ nodes across distinct AZs, PodAntiAffinity, PDB (`minAvailable: 2`) | **MITIGATED** |
| **2. Ingress & Load Balancer** | Ingress controller down drops traffic | Managed Cloud Load Balancer + NGINX Ingress replicas (3 replicas, HPA up to 10) | **MITIGATED** |
| **3. Database (PostgreSQL)** | Single DB instance failure halts ERP | Multi-AZ Regional HA with automated synchronous standby failover & PITR | **MITIGATED** |
| **4. In-Memory Cache (Redis)** | Redis down halts session lookups | Redis Sentinel / MemoryStore Standard HA + in-memory local fallback in Express | **MITIGATED** |
| **5. Object Storage (Docs/PDFs)** | Storage region outage prevents downloads | S3/GCS dual-region geo-redundant storage with short-lived signed URLs | **MITIGATED** |
| **6. AI Generative Tier** | Upstream API timeout, 429 quota exhaustion, OOM crash | Bulkhead isolation, Circuit Breaker with 3 states, local heuristic fallback | **MITIGATED** |
| **7. Async Job Workers** | Worker process crash drops OCR/indexing jobs | Redis-backed BullMQ queue with automatic exponential backoff retry & Dead Letter Queue (DLQ) | **MITIGATED** |
| **8. DNS & SSL Certificates** | Certificate expiry causes 502/SSL errors | Automated Let's Encrypt / Google Managed Certificates with 30/14/7-day proactive alerts | **MITIGATED** |
