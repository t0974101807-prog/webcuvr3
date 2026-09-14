# ADR 002: Soft-Delete Lifecycle & Immutability Audit Trail

## Status
Accepted

## Context
In legal practice management, accidental or malicious deletion of litigation files, court evidence, or client contracts can lead to severe liability and data loss. Direct physical deletion from database tables must be restricted.

## Decision
1. Implement a two-tiered deletion architecture:
   - **Soft Delete**: Move record to `recycle_bin` table, mark `deleted: true`, `status: "TRASHED"`, capture `deleted_by`, `deleted_at`, and `delete_reason`.
   - **Restoration**: Allow users to restore items back to their exact previous state within a 7-day retention window.
   - **Permanent Delete**: Only authorized roles (`admin`, `director`, `controller`) can execute physical purges.
2. Every soft delete, restore, and permanent deletion action automatically writes an immutable log entry into the `audit_logs` table.

## Consequences
- **Positive**: Zero accidental data loss; full forensic traceability.
- **Trade-off**: Storage requirements slightly higher due to 7-day soft-delete retention.
