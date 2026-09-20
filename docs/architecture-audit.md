# Architecture Audit & Ownership Map

This document is the concrete execution of the repo audit requested for the Legal AI Operating System. It categorizes the current project by layer and declares the action for each major file or area: keep, move, merge, or archive.

## Guiding rule

The target architecture is:

UI / presentation
  -> API / route boundary
  -> application service
  -> domain service / repository
  -> shared data access
  -> infrastructure / persistence
  -> integrations

The repo is allowed to keep legacy code only where it is still part of the runtime contract; anything that is temporary or duplicate must be isolated and archived.

---

## 1) Keep as-is (presentation / UI)

These files belong to the presentation layer and should remain in the app shell without being rewritten as business logic.

- src/App.tsx
- src/main.tsx
- src/index.css
- src/components/ERP.tsx
- src/components/AdminDashboard.tsx
- src/components/SecurityView.tsx
- src/components/ClientManagement.tsx
- src/components/GlobalSearch.tsx
- src/components/LegalOSUltimate.tsx
- src/components/HrDashboard.tsx
- src/components/DossierBrainCenter.tsx
- src/components/CentralizedCaseDashboard.tsx
- src/components/CallCenterAnalytics.tsx
- src/components/ConsultationCenter.tsx
- src/components/FinanceManagementView.tsx
- src/components/PaymentCenterView.tsx
- src/components/RecycleBinView.tsx
- src/components/LegalDocumentsManager.tsx
- src/components/YeastarSoftphone.tsx
- src/components/VideoMeetingModal.tsx

Decision: KEEP
Rationale: these files are user-facing surfaces. They may call APIs and hooks but must not directly own database access, repository logic, or permission enforcement.

---

## 2) Keep as API / route boundary

These files should remain as route entrypoints and call underlying application services or repositories.

- src/server.ts
- src/modules/users/users.routes.ts
- src/modules/cases/cases.routes.ts
- src/modules/clients/clients.routes.ts
- src/modules/documents/documents.routes.ts
- src/modules/permissions/permissions.routes.ts
- src/modules/cms/cms.routes.ts
- src/modules/hrm/hrm.routes.ts
- src/modules/finance/finance.routes.ts
- src/modules/payment/payment.routes.ts
- src/modules/calls/calls.routes.ts
- src/modules/legal_documents/legal_documents.routes.ts
- src/modules/contact/contact.routes.ts
- src/modules/system/system.routes.ts
- src/modules/ai/ai.routes.ts
- src/modules/api_gateway/gateway.routes.ts
- src/modules/iot/iot.routes.ts
- src/modules/auth/auth.routes.ts

Decision: KEEP
Rationale: route layer is the correct boundary for auth validation, DTO conversion, authorization checks, and dispatch to application services.

---

## 3) Keep as application service boundary

These files already behave like application services and should remain in the service boundary, even if they are still under a legacy folder.

- src/application/services/sharedDirectory.service.ts
- src/domain/shared/sharedDirectory.repository.ts
- src/services/ai.service.ts
- src/services/trash.service.ts
- src/services/activityLog.service.ts
- src/services/BackgroundSyncService.ts
- src/services/ConcurrencyManager.ts
- src/services/OperationTracker.ts
- src/services/MemoryMonitor.ts
- src/services/provinceService.ts

Decision: KEEP
Rationale: these services coordinate use cases, permissions, orchestration, and cross-domain workflows. They are not UI and are not persistence implementation detail.

---

## 4) Move to clearer ownership layers

These files are semantically correct but currently sit in a legacy layer that blurs the architecture.

### 4.1 Controller / system boundary
- src/controllers/telephony.controller.ts
- src/middleware/auth.ts
- src/middleware/RequestTracker.ts
- src/middleware/upload.ts
- src/middleware/role.ts

Decision: MOVE
Rationale: these are system or integration utilities. They belong in a system boundary, not the business feature layer. They should remain operational but not be treated as feature logic.

### 4.2 Infrastructure / integration
- src/lib/api.ts
- src/db/firestore-sync.ts
- src/db/DatabaseManager.ts
- src/firebase.ts
- src/config/env.ts
- src/utils/api.ts
- src/utils/firestore.ts
- src/utils/firebase.ts
- src/utils/socket-client.ts

Decision: MOVE
Rationale: these are infra or integration-layer helpers. They support runtime but should not sit as business code with feature modules.

### 4.3 AI / system orchestration
- src/services/ai.service.ts
- src/modules/ai/*
- src/mcp/MCPRegistry.ts

Decision: MOVE / RECLASSIFY
Rationale: AI and MCP are integration/orchestration boundaries, not standard end-user components. They must remain isolated behind a strict service boundary.

---

## 5) Merge / unify ownership

These files need to be unified under shared ownership so the data model does not fork by module.

### 5.1 Shared entities: User / Personnel / Client / Branch
- src/modules/users/users.routes.ts
- src/modules/clients/clients.routes.ts
- src/modules/hrm/hrm.routes.ts
- src/modules/cms/cms.routes.ts
- src/application/services/sharedDirectory.service.ts
- src/domain/shared/sharedDirectory.repository.ts
- src/utils/personnelFilters.ts
- src/utils/staffCode.ts
- src/utils/branch.ts
- src/types/shared-entities.ts

Decision: MERGE
Rationale: there must be only one shared contract for personnel, staff directory, client identity, and office identity. Domain modules should read from these contracts, not create competing data owners.

### 5.2 Shared records and domain federation
- src/modules/cases/cases.routes.ts
- src/domain/shared/record-contracts.ts
- src/modules/litigation/repositories/LitigationRepository.ts
- src/modules/consultation/repositories/ConsultationRepository.ts
- src/modules/representation/repositories/RepresentationRepository.ts
- src/modules/compliance/repositories/ComplianceRepository.ts
- src/modules/arbitration/repositories/ArbitrationRepository.ts
- src/system/data-access/SystemDataAccess.ts

Decision: MERGE
Rationale: one domain record owner per domain, plus one federation boundary. `erp_records` is a compatibility projection, not a second source of truth.

Completed implementation:
- All five domain type definitions extend the shared `RecordItem` contract from `src/domain/shared`.
- `SystemDataAccess` owns federated reads, writes, deletes, token lookup, and canonical realtime change events.
- Finance, contact analytics, payment reporting, and payment QR lookup consume `SystemDataAccess` instead of querying `erp_records` directly.
- Legacy `SpecializedRecordsRepository` exports the shared type only for import compatibility.

### 5.3 Permission / RBAC contract
- src/middleware/auth.ts
- src/middleware/role.ts
- src/modules/permissions/permissions.routes.ts
- src/utils/personnelFilters.ts

Decision: MERGE
Rationale: authorization must reside in one system-wide policy boundary; UI should not define real permissions.

---

## 6) Domain repositories to preserve

These repositories are directionally correct and should remain, but only as domain owners behind the shared data access boundary.

- src/modules/litigation/repositories/LitigationRepository.ts
- src/modules/consultation/repositories/ConsultationRepository.ts
- src/modules/representation/repositories/RepresentationRepository.ts
- src/modules/compliance/repositories/ComplianceRepository.ts
- src/modules/arbitration/repositories/ArbitrationRepository.ts

Decision: KEEP but constrain
Rationale: they represent domain-specific data ownership. They must not become independent duplicate systems. They should be read through a shared federation layer and not be recreated into domain-specific copies of users, offices, or client identities.

---

## 7) Shared data access and persistence layer

These are the critical files for the architecture foundation.

- src/db/database.ts
- src/db/firestore-sync.ts
- src/firebase.ts
- src/system/data-access/SystemDataAccess.ts
- src/db/migration.ts
- src/db/DatabaseManager.ts

Decision: KEEP
Rationale: these are the real infrastructure foundation of the cleaned architecture. The project already has the correct direction here.

Important rule:
- SQLite = primary persistence / source of truth
- Firestore = sync layer / secondary projection / cross-platform cache or indexing layer
- not both acting as uncontrolled source-of-truths

---

## 8) Archive / remove from product architecture

These files should not remain as product runtime code. They are temporary repair scripts, patch scripts, or migration artifacts. They should be moved to a separate archive directory or removed after migration is complete.

Top-level examples:
- patch_*.js
- patch_*.cjs
- fix_*.js
- fix_*.cjs
- restore_*.js
- restore_*.cjs
- alter.cjs
- update_*.js
- update_*.cjs
- script_*.js
- script_*.cjs
- test_*.js
- test_*.cjs
- recover.sql
- dump.sql
- recovered.sql
- lawfirm_dump.sql
- metadata-*.json
- map_results.txt
- grep_out.txt
- states.txt
- tmp/

Decision: ARCHIVE / REMOVE FROM PRODUCT SOURCE
Rationale: these files are not architecture. They are operational scaffolding and should not be mixed with real product modules.

---

## 9) Final ownership board

| Domain | Owner | Notes |
|---|---|---|
| User / Personnel / Account | src/modules/users/users.routes.ts + shared entity contract | shared owner |
| Client / Partner | src/modules/clients/clients.routes.ts + shared user persona contract | shared owner |
| Branch / Office | src/modules/cms/cms.routes.ts + branch normalization layer | shared owner |
| Legal record / domain case | domain repositories + SystemDataAccess | domain owner |
| Document | src/modules/documents/documents.routes.ts + legal_documents routes | shared document owner |
| Permission / RBAC | auth + permission route + role policy | system owner |
| Audit / logs | src/services/activityLog.service.ts + system services | shared system service |
| Trash / recycle | src/services/trash.service.ts | shared system service |
| Payroll / finance | finance + payroll routes | structured business area |
| AI / MCP | ai service + MCP registry + integrations | integration boundary |

| Cross-domain analytics | SystemDataAccess | shared records for finance, contact, payment, dashboards |

---

## 10) Executive decision summary

### KEEP
- UI layer
- API route layer
- infrastructure / data layer
- domain repositories
- shared service layer

### MOVE
- controller + middleware + helper layer
- integration helpers
- AI and system boundary helpers

### MERGE
- user / personnel / client / branch contract
- domain record federation vs source-of-truth ownership
- auth / RBAC ownership

### ARCHIVE
- repair scripts, patch scripts, dump scripts, migration debris, root temp files

---

## Conclusion

The repo is already partially aligned with the target architectural model. The correct direction is present, and the ownership map is now documented. The remaining work is not a rewrite from scratch; it is a disciplined cleanup of ownership boundaries, a consolidation of shared contracts, and the retirement of temporary scripts and duplicate logic.

This is the complete audit and classified ownership outcome requested for the next refactor phase.
