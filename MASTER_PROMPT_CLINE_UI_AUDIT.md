# MASTER PROMPT FOR CLINE

## Legal AI Operating System - Anh Duong Law

You are working directly inside the repository `webcuvr3`, branch `main`.

This repository is the source of truth. Do not infer behavior from filenames, old plans, screenshots, generated summaries, or assumed architecture. Read the actual code and trace the actual runtime behavior before changing anything.

The goal is to understand the current product completely, document its real behavior, and then repair/refactor it incrementally without changing the existing user interface.

---

## 1. Non-negotiable rules

### 1.1 Do not change the existing UI

The existing UI is part of the product contract. Do not change it unless a change is explicitly requested and separately approved.

Do not change:

- page layout
- header
- sidebar
- navigation labels
- navigation behavior
- menu structure
- routes
- tabs
- forms
- field order
- buttons
- button labels
- icons
- colors
- typography
- spacing
- responsive behavior
- modal structure
- loading states
- empty states
- error messages
- landing-page section anchors
- light/dark mode behavior
- Vietnamese/English behavior

A backend or architecture fix must preserve the current rendered result and interaction contract.

Do not use a UI redesign, visual cleanup, component restyle, CSS rewrite, design-system migration, or layout rewrite as a substitute for understanding the existing behavior.

### 1.2 Do not rewrite large components

`src/components/ERP.tsx` is a large God Component of approximately 24,000 lines. Do not rewrite it, replace it, regenerate it, or perform a broad formatting pass.

Use this sequence instead:

1. trace existing code
2. identify ownership
3. extract one small domain slice
4. preserve public props and rendered output
5. build and test
6. continue only after validation

### 1.3 Do not create duplicate systems

Before creating any helper, service, repository, controller, route, table, hook, type, or data-access module:

1. search the entire repository for an equivalent
2. identify the current owner
3. decide whether to reuse, extend, or merge it
4. document that decision

Do not create a second implementation of:

- User
- Client
- Personnel
- Branch/Office
- Document
- Trash/Recycle Bin
- Permission/RBAC
- Record/Case
- Finance/Payment
- Call/Call Center
- AI memory
- notification
- realtime synchronization
- shared data access

### 1.4 Preserve existing work

The working tree may contain user changes, generated artifacts, migrations, untracked files, or staged changes.

Before editing:

- inspect `git status --short`
- inspect the relevant diff
- do not reset, checkout, clean, restore, or delete unrelated changes
- do not commit or push unless explicitly requested
- do not discard data files or databases

When unrelated changes exist, work around them and mention them in the final report.

### 1.5 Code is required

Do not return only architecture prose or a plan.

Whenever a repair or refactor is justified, make the actual code change in the repository. Every completed change must include:

- files changed
- exact behavior fixed or preserved
- why the chosen ownership is correct
- validation command
- validation result
- remaining risks

If the evidence does not justify a code change, document the finding instead of inventing a refactor.

---

## 2. Product and architecture context

The product is a Legal AI Operating System for Anh Duong Law.

The intended architecture is:

```text
UI / presentation
  -> API / route boundary
  -> auth and permission policy
  -> application service
  -> domain service / repository
  -> shared data access
  -> SQLite persistence
  -> Firestore sync / integrations
```

The target product model is:

```text
ONE ERP
  -> FIVE INDEPENDENT BUSINESS DOMAINS
  -> ONE SYSTEM-WIDE DATA LAYER
```

The five domain areas must remain independent in business rules while sharing canonical contracts and data access:

1. litigation
2. consultation
3. representation
4. compliance
5. arbitration / mediation

SQLite is the primary persistence layer unless the existing runtime proves otherwise. Firestore is a synchronization, projection, or integration layer and must not become an uncontrolled competing source of truth.

Read and respect existing architecture documentation, especially:

- `docs/architecture-audit.md`
- `DATA_OWNERSHIP.md`
- `MODULE_REGISTRY.md`
- `NAVIGATION_BLUEPRINT.md`
- `INFORMATION_ARCHITECTURE.md`
- `LEGAL_OS_CONSTITUTION.md`
- `AI_DEVELOPMENT_GUIDE.md`

These documents do not override the runtime code. When documentation and code disagree, record the discrepancy and use the runtime behavior as the current truth until a deliberate fix is made.

---

## 3. Required first phase: repository inventory

Do not edit application code during this phase.

Read the repository directly and produce an inventory of:

- frontend entrypoints
- route/state orchestration
- public pages
- authenticated pages
- admin pages
- ERP pages
- Client Portal pages
- shared layout and navigation
- components with direct API calls
- hooks
- API utilities
- Express route modules
- middleware
- controllers
- services
- domain repositories
- shared contracts and types
- `SystemDataAccess`
- SQLite schema and migrations
- Firestore sync
- Socket.IO/realtime events
- AI routes, tools, memory, training, and logs
- call-center/telephony routes and UI
- document and signing flows
- trash/delete/restore flows
- global search
- finance/payment flows
- permission/RBAC checks
- test/build/runtime commands

Start from these real entrypoints and verify their current code:

- `src/App.tsx`
- `src/components/Navbar.tsx`
- `src/components/ClientPortal.tsx`
- `src/components/AdminDashboard.tsx`
- `src/components/ERP.tsx`
- `src/components/CallCenterAnalytics.tsx`
- `src/modules/ai/ai.routes.ts`
- `src/modules/cases/cases.routes.ts`
- `src/system/data-access/SystemDataAccess.ts`
- `src/middleware/auth.ts`
- `src/db/database.ts`
- `src/db/firestore-sync.ts`
- `src/server.ts`

Do not assume that component names describe the full behavior. Inspect event handlers, effects, state transitions, API calls, response parsing, and error branches.

---

## 4. Required deliverable: CURRENT_UI_BEHAVIOR_MAP.md

Create `CURRENT_UI_BEHAVIOR_MAP.md` at the repository root.

This document must describe the current implementation, not the desired future architecture.

For every important screen and interaction, record:

| Field | Required content |
|---|---|
| Route/view | URL or state-based view name |
| Entry condition | How the user reaches it |
| User role | Allowed and denied roles |
| Visible control | Button, tab, form, menu, link, modal, row action, etc. |
| User action | Click, submit, upload, search, drag, realtime event, etc. |
| UI state change | State/hook/effect that changes |
| Frontend owner | Exact file and symbol |
| API request | HTTP method, path, query/body |
| Auth | Middleware/session/token behavior |
| Permission | Exact role/permission/resource check |
| Backend owner | Exact route/controller/service/repository |
| Data owner | Table, repository, `SystemDataAccess`, Firestore collection, or external integration |
| Response shape | Actual response object/array and error shape |
| UI result | Exact resulting render/state/notification |
| Status | Working, partial, broken, duplicated, or not implemented |
| Evidence | File paths and symbols used to verify the entry |

Cover at minimum:

### Public and navigation

- landing page `/`
- landing section scroll behavior
- subpage routing
- `/gioi-thieu`
- `/linh-vuc-hoat-dong`
- `/dich-vu`
- `/cong-cu`
- `/tuyen-dung`
- `/lien-he`
- Vietnamese/English switching
- light/dark mode
- responsive navigation
- API-backed Services and Legal Services menus

### Authentication and routing

- login
- logout
- session restoration
- `/admin`
- `/erp`
- `/client-portal`
- `/qr/...`
- client role routing
- internal role routing
- unauthenticated behavior
- change password
- token/session behavior

### Client Portal

Trace all four actual tabs:

1. case records
2. secure messages
3. consultation appointments
4. digital signing

Include:

- `/api/erp-records`
- `/api/live-messages/:portalId`
- `/api/live-upload`
- Socket.IO events
- Firestore appointment listeners and writes
- client case filtering
- upload and message response handling
- error and empty states

### ERP and records

Do not summarize `ERP.tsx` by name. Trace real controls and handlers for:

- record creation
- record editing
- record deletion
- trash
- restore
- filters
- branch selection
- personnel/assignee selection
- search
- record detail
- domain selection
- forms
- document attachments
- realtime updates
- notifications
- AI analysis
- dashboards and reports

### Admin and CMS

Trace:

- users
- clients
- services
- legal services
- news
- recruitment
- team
- offices/branches
- settings
- contacts
- tools
- permissions
- activity logs
- deletion and restoration

### Finance and payments

Trace:

- finance dashboard
- revenue and expense records
- invoices
- payment schedules
- payment transactions
- receipts
- QR payment
- reports
- finance permissions

### Calls and telephony

Trace:

- Yeastar/softphone
- click-to-call
- call logs
- Call Center Analytics
- live calls
- missed calls
- employee and branch statistics
- QC evaluation
- recordings/transcripts
- Socket.IO events
- `/api/calls/*`
- `voip_calls`
- Firestore synchronization

### AI

Trace:

- global AI assistant
- ERP AI assistant
- training data
- agent memory
- memory recall
- memory storage
- consolidation
- system-data search
- call-history search
- MCP tools
- AI logs
- provider/model selection
- permissions and data exposure

For AI, explicitly distinguish:

- deterministic code
- user-provided training rules
- retrieved records
- retrieved memories
- model-generated output
- actions that mutate data

Do not describe the system as autonomous learning unless the code proves how feedback is collected, stored, reviewed, recalled, and authorized.

---

## 5. Required audit classification

For every traced flow, classify it as exactly one of:

- `WORKING`: code path, API, response, and UI result agree
- `PARTIAL`: some path works but one state, role, response, or integration is incomplete
- `BROKEN`: reproducible mismatch, exception, wrong response parsing, missing route, or denied valid access
- `DUPLICATED`: more than one owner implements the same business rule or data contract
- `NOT_IMPLEMENTED`: visible UI or declared capability has no real working path
- `UNKNOWN`: evidence is insufficient; specify what must be checked next

Do not call a flow working only because the page renders.

---

## 6. Required audit method

For each high-value flow, follow this exact chain:

```text
user action
 -> rendered component
 -> handler
 -> state/hook
 -> API client
 -> HTTP method/path
 -> middleware
 -> auth/session/token
 -> permission/resource check
 -> route/controller
 -> application service
 -> domain service/repository
 -> shared data access
 -> SQLite/Firestore/external integration
 -> response DTO
 -> frontend response parsing
 -> state update
 -> rendered result
 -> error/empty/realtime behavior
```

When a link is missing, mark it `PARTIAL`, `BROKEN`, or `UNKNOWN`; do not fill the gap with assumptions.

Use exact file paths and symbol names. Do not rely on vague descriptions such as “the backend handles it.”

---

## 7. Second phase: repair only after mapping

After `CURRENT_UI_BEHAVIOR_MAP.md` exists, select one smallest broken or duplicated slice.

Before editing, write a short local hypothesis:

- observed behavior
- suspected controlling code path
- expected behavior
- one cheap check that could disprove the hypothesis
- smallest code change that tests it

Then edit only that slice.

Preferred repair order:

1. response-shape mismatches
2. missing auth/permission enforcement
3. duplicate data ownership
4. incorrect delete/trash/restore semantics
5. branch/personnel/client identity mismatches
6. realtime synchronization mismatches
7. search/filter inconsistencies
8. finance/payment calculations
9. AI context and memory boundaries
10. controlled extraction from `ERP.tsx`

Do not start with a broad refactor.

---

## 8. Shared ownership requirements

Use one canonical system-wide contract and access path for:

- users
- clients
- personnel
- branches/offices
- records/cases
- documents
- trash
- permissions
- audit/activity logs
- AI memory
- calls
- finance/payment data

Keep the five legal domains independent in business rules. Do not merge their domain-specific workflows into one generic service merely to reduce file count.

The ERP may remain the UI orchestrator while logic is extracted into small, domain-named helpers or services. Preserve existing props, state meaning, labels, and rendered output.

---

## 9. Validation after every change

After every substantive edit:

1. run the narrowest relevant test or check
2. run TypeScript/build validation for the touched slice
3. test the affected API response shape
4. test the affected role/permission path
5. test loading, empty, error, and success states
6. test realtime behavior when applicable
7. inspect the diff for accidental UI changes

At minimum, use the repository's real commands, such as:

```bash
npm run build
```

Also use focused scripts/tests when they exist. Do not claim runtime success from a build alone.

For UI behavior, verify the actual route with the dev server and HTTP/API checks when practical. Record environment limitations such as Firestore quota, missing secrets, unavailable external providers, or absent test credentials.

---

## 10. Progress ledger

Maintain a progress section in `CURRENT_UI_BEHAVIOR_MAP.md` with:

- completed screens/flows
- audited but broken flows
- repaired flows
- pending flows
- files changed
- validation results
- known environment blockers

Update it after each validated group.

Use small groups:

1. App/auth/routing
2. Client Portal
3. ERP record and filter flows
4. shared identity and branch/personnel
5. trash and permissions
6. documents and signing
7. finance and payments
8. calls and Call Center
9. AI and memory
10. Admin/CMS
11. global search and realtime synchronization

Do not mark a group complete when only the component has been read. Mark it complete only when the UI-to-database path and result have been verified.

---

## 11. Final response requirements

At the end of each work session, report:

- what was actually inspected
- what was actually changed
- exact files and symbols changed
- what remains broken or unknown
- validation commands and results
- runtime limitations
- whether the UI contract was preserved
- the next smallest evidence-based slice

Never report an imagined audit. Never claim the entire system is stable unless the repository evidence supports that claim.

Start now by inspecting the repository and creating `CURRENT_UI_BEHAVIOR_MAP.md`. Do not modify UI code during the first inventory phase.
