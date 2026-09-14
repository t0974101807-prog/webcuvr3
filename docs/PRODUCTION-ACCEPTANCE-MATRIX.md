# LEGAL OS – PRODUCTION ACCEPTANCE MATRIX

| ID | Component | Test Case | Expected Result | Actual Result | Status | Severity |
|---|---|---|---|---|---|---|
| **AUTH-001** | Authentication | Rejection of unauthenticated / forged JWT tokens | HTTP 401 Unauthorized | Rejected as expected | **PASS** | CRITICAL |
| **AUTH-002** | Authentication | Valid JWT signing and verified session hydration | Decoded user object matches DB payload | Decoded user matches token signature | **PASS** | CRITICAL |
| **AUTH-003** | Authentication | Password cryptographic hashing (PBKDF2/Argon2) | Matches only on valid credentials | Strict comparison passed | **PASS** | CRITICAL |
| **AUTHZ-001** | Authorization | RBAC permission isolation on Client role | `viewAllRecords=0`, `deleteRecords=0` | Restricted to own cases | **PASS** | CRITICAL |
| **AUTHZ-002** | Authorization | Admin & Director full management access | Admin delete & edit access granted | Properly authorized | **PASS** | HIGH |
| **TRASH-001** | Trash / Lifecycle | Soft delete active ERP case to `recycle_bin` | Status changed to `TRASHED`, stored in `recycle_bin` | Row present in `recycle_bin` | **PASS** | CRITICAL |
| **TRASH-002** | Trash / Lifecycle | Restore trashed case back to active status | Restores previous status, `deleted=false` | Record active, removed from bin | **PASS** | CRITICAL |
| **TRASH-003** | Trash / Lifecycle | Permanent delete by authorized admin | Fully purged from database & cache | No residual data | **PASS** | HIGH |
| **AUDIT-001** | Audit Log | Append-only immutability for security actions | Log inserted with who, when, what, result | Record indexed in `audit_logs` | **PASS** | CRITICAL |
| **AI-001** | AI Resilience | Circuit breaker healthy state monitoring | `CLOSED` when external API healthy | Circuit breaker state healthy | **PASS** | HIGH |
| **AI-002** | AI Resilience | Fallback isolation during provider outage | Core ERP operations remain 100% available | Zero cascade failures | **PASS** | HIGH |
| **OOM-001** | Memory Resilience | Proactive garbage collection & concurrency throttle | Memory limit capped, event loop unblocked | High memory throttled | **PASS** | HIGH |
| **DB-001** | Database | SQLite WAL mode & connection pooling | `journal_mode=wal` for concurrent IO | Write-Ahead Logging active | **PASS** | HIGH |
| **DB-002** | Database | Foreign key integrity enforcement | `foreign_keys=ON` | Referential integrity active | **PASS** | HIGH |
| **BACKUP-001** | Disaster Recovery | Encrypted database backup generation | AES-256-CBC encrypted `.sql.gz.enc` | Generated with checksum | **PASS** | HIGH |
| **RESTORE-001**| Disaster Recovery | Isolated backup restoration & verification | Integrity check passes on restored DB | Validation successful | **PASS** | HIGH |
