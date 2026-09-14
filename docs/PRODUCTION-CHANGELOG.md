# LEGAL OS – PRODUCTION CHANGELOG

## [Release 2026.08.25] - Production Auto-Verification & Hardening Gate

### Added
- **Tiered Health Probes**: Implemented `/health/live`, `/health/ready`, and `/health/info` in Express backend server for Kubernetes probes.
- **Production Acceptance Test Suite**: Automated programmatic runner `scripts/test-acceptance.ts` testing auth, permissions, soft-delete, audit trails, and DB pragmas.
- **Automated Verification Script**: `scripts/final-production-check.sh` providing complete gate evaluation.
- **Circuit Breaker for AI**: Isolated external AI provider latency/failures from core legal operations.

### Changed
- **Auth Middleware Hardening**: Removed unauthenticated admin fallbacks in `src/middleware/auth.ts` and `src/middleware/role.ts` to strictly return 401 Unauthorized for unauthenticated requests.
- **Recycle Bin Cursor Pagination**: Upgraded recycle bin and case listings to use cursor-based pagination to prevent memory exhaustion on high record volumes.

### Verified
- Automated zero-downtime rolling update configuration (`maxSurge: 1`, `maxUnavailable: 0`).
- Non-root container security context (`runAsNonRoot: true`, `readOnlyRootFilesystem: true`).
