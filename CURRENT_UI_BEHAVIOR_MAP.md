# Current UI Behavior Map

## Scope and status

This is a repository-grounded behavior map for `webcuvr3` / `main`.

The first audited slice is:

```text
App -> authentication/session -> public route selection -> ERP or Client Portal
```

This document records current implementation evidence. It is not a target architecture document and does not claim that the whole repository has been audited.

Last verified: 2026-09-15

## Working-tree safety

The repository currently contains pre-existing modified, deleted, and untracked files. No reset, checkout, clean, or broad deletion was performed during this audit.

## Architecture boundary observed

```text
React UI
  -> fetchApi / native fetch / Socket.IO / Firestore SDK
  -> Express routes
  -> auth middleware or public route
  -> SystemDataAccess / AuthService / direct database access
  -> SQLite and Firestore synchronization
  -> response parsing and UI state
```

## Status vocabulary

- `WORKING`: the inspected code path, response shape, and UI result agree.
- `PARTIAL`: the main path exists but one state, role, response, or integration is incomplete.
- `BROKEN`: the inspected path contains a reproducible mismatch or runtime failure.
- `DUPLICATED`: more than one owner implements the same business rule or contract.
- `NOT_IMPLEMENTED`: the UI advertises a capability without a real path.
- `UNKNOWN`: the evidence is not sufficient yet.

---

## 1. Application shell and route selection

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Initial application boot | `App` calls `useApp()` and waits for `isLoading` | `AppContext.refreshUser()` calls `/api/auth/me`, then `/api/me` fallback | `fetchApi` sends local token; backend `auth` accepts Bearer JWT or session | Loading spinner until user restoration finishes | `WORKING` | `src/App.tsx`, `src/context/AppContext.tsx`, `src/utils/api.ts`, `src/modules/auth/auth.routes.ts`, `src/middleware/auth.ts` |
| Route detection | `handleRoute()` reads `window.location.pathname` and sets local `view` | No router package; browser `popstate` is observed | Route visibility is enforced only in selected branches | `/`, public pages, `/admin`, `/erp`, `/client-portal`, `/qr/...` are mapped to views | `PARTIAL` | `src/App.tsx` |
| Browser back/forward | `popstate` calls `handleRoute` | No server API | None | View state follows path after browser navigation | `WORKING` | `src/App.tsx` |
| Unknown path | Falls through to `landing` | None | None | Unknown route renders landing view | `WORKING` | `src/App.tsx` |
| QR route | `/qr/...` sets `qrId` from path segment | `QRProfileViewer` owns subsequent data loading | Route itself does not require `currentUser` | QR viewer renders without login gate | `PARTIAL` | `src/App.tsx` |
| Direct `/admin` access | If no `currentUser`, login prompt is rendered; if any user exists, `AdminDashboard` is rendered | Admin APIs perform their own checks selectively | App-level branch checks login, not admin role | A logged-in non-admin can reach the AdminDashboard component; backend enforcement must be checked per action | `PARTIAL` | `src/App.tsx`, `src/components/AdminDashboard.tsx`, `src/middleware/auth.ts` |
| Direct `/erp` access | If no `currentUser`, login prompt is rendered; otherwise `ERP` is rendered | ERP performs many API calls | App-level branch checks login, not role compatibility | A client user can be routed to ERP by manually opening `/erp`; no App-level client-role redirect is visible | `PARTIAL` | `src/App.tsx` |
| Direct `/client-portal` access | If no `currentUser`, login prompt is rendered; otherwise `ClientPortal` is rendered | ClientPortal checks `user.role` internally and falls back to `ClientManagement` for non-client users | App-level branch checks login, component checks role | Portal has a component-level role guard, but route ownership is split between App and ClientPortal | `PARTIAL` | `src/App.tsx`, `src/components/ClientPortal.tsx` |

### Route ownership note

`App.tsx` is the current view orchestrator. It does not use a route library. Navigation callbacks call `history.pushState` and update local state directly. This must be preserved during refactoring.

---

## 2. Authentication and session restoration

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Login form submit | `LoginModal.handleSubmit` collects username, password, and local `device_id` | `POST /api/login` through `fetchApi` | Backend `loginLimiter`, `AuthService.findUserByUsernameOrPhone`, password verification, device verification | Successful response stores JWT token and calls `onLoginSuccess(user)` | `WORKING` | `src/components/LoginModal.tsx`, `src/modules/auth/auth.routes.ts`, `src/modules/auth/auth.service.ts` |
| Role-based post-login routing | `App.handleLoginSuccess` sends `role === 'client'` to Client Portal, all other roles to ERP | No extra API request | Role is taken from login response | Client to `/client-portal`; internal/other to `/erp` | `WORKING` | `src/App.tsx`, `src/components/LoginModal.tsx` |
| New device notification | Login response `isNewDevice` triggers browser alert | Returned by `/api/login` | Backend device verification | User sees alert, then continues | `WORKING` | `src/components/LoginModal.tsx`, `src/modules/auth/auth.service.ts` |
| Failed login | Non-OK or `success === false` sets local `error` | `/api/login` error JSON | Login limiter and backend auth | Error shown in modal | `WORKING` | `src/components/LoginModal.tsx`, `src/modules/auth/auth.routes.ts` |
| Remember checkbox | Checkbox is rendered but has no state, handler, or persistence | None | None | Checking it has no effect | `BROKEN` | `src/components/LoginModal.tsx` |
| Forgot password | Link prevents default and shows contact-admin alert | No password recovery request | None | No recovery workflow exists in this component | `NOT_IMPLEMENTED` | `src/components/LoginModal.tsx` |
| Session restoration | `AppProvider` calls `refreshUser` on mount | `GET /api/auth/me`, fallback `GET /api/me` | `auth` middleware; `handleMe` refreshes user details from `AuthService` | `currentUser` is restored or set to null; loading ends | `WORKING` | `src/context/AppContext.tsx`, `src/modules/auth/auth.routes.ts`, `src/middleware/auth.ts` |
| Logout | `AppContext.logout` calls API, removes local token, clears user, assigns `/` | `POST /api/auth/logout` | `auth` middleware | Session is destroyed server-side when request succeeds; UI returns home even if request fails | `WORKING` | `src/context/AppContext.tsx`, `src/modules/auth/auth.routes.ts`, `src/App.tsx` |
| Client fallback data | `fetchApi` returns safe fallback objects/arrays when native fetch fails | No backend response when network fails | Fallback is client-side only | Some screens may render empty states instead of hard failure | `PARTIAL` | `src/utils/api.ts` |

---

## 3. Public navigation and landing behavior

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Landing sections | `App` renders Hero, About, News, Services, Legal Services, Team, Testimonials, Recruitment, Contact inside IDs | Child components own their own APIs | Public | Landing page exposes section anchors | `WORKING` | `src/App.tsx` |
| Landing navigation | `Navbar` receives `isLanding` and uses scroll links | Services/legal services data fetched from APIs | Public | Landing navigation scrolls to sections | `WORKING` | `src/components/Navbar.tsx`, `src/App.tsx` |
| Subpage navigation | `Navbar` switches behavior when `isLanding` is false | Uses `navigateTo`/browser navigation paths | Public | Subpages use route navigation rather than section scroll | `WORKING` | `src/components/Navbar.tsx` |
| Services menu data | Navbar fetches `/api/services` | `GET /api/services` | Public route behavior must be verified in services routes | Dynamic service menu is populated when response is a non-empty array | `PARTIAL` | `src/components/Navbar.tsx`, `src/modules/cms/cms.routes.ts` |
| Legal services menu data | Navbar fetches `/api/legal-services` | `GET /api/legal-services` | Public route behavior must be verified | Dynamic legal-service menu is populated when response is a non-empty array | `PARTIAL` | `src/components/Navbar.tsx`, `src/modules/cms/cms.routes.ts` |
| Language mode | Navbar uses `useLanguage`; App child pages receive current app structure | Local/context state and component dictionaries | Public | Vietnamese/English labels are selected in components that implement them | `PARTIAL` | `src/components/Navbar.tsx`, `src/hooks/useLanguage.ts` |
| Theme mode | App reads local theme keys and toggles document class through existing components/events | `localStorage` and DOM class | Public | Dark/light class is restored at boot when saved | `WORKING` | `src/App.tsx`, `src/components/Navbar.tsx` |

---

## 4. Client Portal

### 4.1 Portal entry and role guard

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Portal role check | `ClientPortal` returns `ClientManagement` when `user.role !== 'client'` | None | Component-level role check | Non-client users do not see client portal tabs | `WORKING` | `src/components/ClientPortal.tsx` |
| Portal identity | `portalId = user.username || client_<id>` | Used by messages and Socket.IO room | Depends on authenticated user object | Client identity is derived from username or numeric ID | `PARTIAL` | `src/components/ClientPortal.tsx` |

### 4.2 Case records

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Load cases | ClientPortal calls `/api/erp-records` on mount | `GET /api/erp-records` returns `{ success, data, pagination }` | Route uses `auth`; `SystemDataAccess.queryFederated` applies `canViewAll` and `userName` filtering | Client records are filtered again by `user.case_id` when present | `WORKING_AFTER_FIX` | `src/components/ClientPortal.tsx`, `src/modules/cases/cases.routes.ts`, `src/system/data-access/SystemDataAccess.ts` |
| Previous response mismatch | ClientPortal previously accepted only an array and ignored `{ data: [...] }` | Same endpoint | Backend was returning paginated object | Authorized cases rendered empty | `FIXED` | `src/components/ClientPortal.tsx` |
| Case deduplication | ClientPortal maps by `systemId || id` | No extra API | Client-side display normalization | Duplicate case projections are collapsed before render | `WORKING` | `src/components/ClientPortal.tsx` |
| Case status display | `getStatusColor` maps Vietnamese status strings to classes | No extra API | None | Status badge color is selected locally | `WORKING` | `src/components/ClientPortal.tsx` |

### 4.3 Secure messages

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Load visitor messages | ClientPortal calls `/api/live-messages/:portalId` | `GET /api/live-messages/:visitorId` directly queries `live_messages` | Route now uses `auth`; client users are restricted to their username or `client_<id>` thread; staff/admin behavior is preserved | Authenticated Client Portal can read its own thread; cross-client HTTP reads are rejected | `FIXED_HTTP_BOUNDARY` | `src/components/ClientPortal.tsx`, `src/modules/contact/contact.routes.ts`, `src/middleware/auth.ts` |
| Realtime message room | ClientPortal connects Socket.IO and emits `join_visitor(portalId)` | Socket.IO server joins `visitor_<id>` room | Authenticated clients are restricted to their own visitor IDs; anonymous visitor path remains public | Realtime messages are filtered client-side by `visitorId` | `PARTIAL_SECURITY_BOUNDARY` | `src/components/ClientPortal.tsx`, `src/server.ts` |
| Send message | ClientPortal emits `send_message` with `visitorId`, `senderType`, and content | Socket.IO server persists/emits message | Admin sender requires an authenticated non-client session; public visitor sender remains supported | Message appears in local realtime flow | `PARTIAL_SECURITY_BOUNDARY` | `src/components/ClientPortal.tsx`, `src/server.ts`, `src/modules/contact/contact.routes.ts` |
| Scroll to latest | Effect scrolls `messagesEndRef` when messages or active tab change | None | None | Message view follows latest message | `WORKING` | `src/components/ClientPortal.tsx` |

### 4.3.1 Message and socket authorization findings

The same Socket.IO server also exposes these client-controlled operations without an authenticated socket identity check in the inspected handler:

- `join_visitor(visitorId)`
- `join_admin()`
- `send_message({ visitorId, senderType, ... })`
- `mark_read(visitorId)`
- `join_erp()`
- `join_record(recordId)`
- `send_internal_message({ recordId, senderName, senderRole, ... })`

The authenticated boundary is now partially repaired: the server shares the existing session middleware with Engine.IO, requires an authenticated non-client user for admin/ERP rooms and admin message actions, and checks record access before joining or writing internal record messages. Public visitor chat remains available through the unauthenticated visitor path by design.

Additional evidence: Express session middleware is now reused by Engine.IO in `src/server.ts`, so the socket layer can derive the authenticated user from the existing session cookie. Sensitive actions no longer rely on client-supplied `senderName` or `senderRole`; the server derives those fields from the session. Remaining public visitor-room exposure and upload ownership require a separate compatibility review.

### 4.4 File upload

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Upload chat attachment | ClientPortal uses native `fetch('/api/secure-upload')`, then emits returned URL through Socket.IO | `POST /api/secure-upload` with multer | Route uses `auth`; existing extension and 20 MB checks remain | Authenticated portal upload returns a file URL and continues through the existing message flow | `FIXED_HTTP_BOUNDARY` | `src/components/ClientPortal.tsx`, `src/modules/contact/contact.routes.ts`, `src/middleware/auth.ts` |
| Invalid upload | Multer can reject unsupported extension or missing file | Same route | Error is returned as JSON | Client logs error; no visible user error state was verified | `PARTIAL` | `src/components/ClientPortal.tsx`, `src/modules/contact/contact.routes.ts` |

### 4.5 Appointments

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Load appointments | ClientPortal calls `/api/appointments` on mount | `GET /api/appointments` queries SQLite `appointments` | Route uses `auth` and restricts results to the authenticated client's name/phone | Matching appointments are listed in the existing tab | `FIXED_SERVER_BOUNDARY` | `src/components/ClientPortal.tsx`, `src/modules/contact/contact.routes.ts`, `src/db/database.ts` |
| Create appointment | ClientPortal submits the existing form to `/api/appointments` | `POST /api/appointments` inserts SQLite `appointments` | Route requires an authenticated client and derives client identity from the session | New appointment is added to local UI state after successful response | `FIXED_SERVER_BOUNDARY` | `src/components/ClientPortal.tsx`, `src/modules/contact/contact.routes.ts` |
| Legacy Firestore appointment access | Browser no longer reads/writes `appointments`; the unrestricted rule was removed | SQLite/API is now the runtime owner | Firestore default deny applies to the legacy browser collection | Existing UI no longer depends on Firestore for appointments | `FIXED` | `src/components/ClientPortal.tsx`, `firestore.rules`, `src/db/firestore-sync.ts` |

### 4.6 Digital signing

| UI behavior | Current implementation | API/data path | Permission/auth | Result | Status | Evidence |
|---|---|---|---|---|---|---|
| Signing tab | ClientPortal renders `DocumentSigning` for the selected case/context | DocumentSigning uploads through `/api/secure-upload`, then reads/writes `/api/signed-documents`; the API persists SQLite `signed_documents` rows | Route uses `auth`; client users are restricted to their session-derived username/ID, while internal users may operate on an explicit client ID | Existing signing UI and history shape remain, with server-side ownership replacing direct browser Firestore access | `FIXED_SERVER_BOUNDARY` | `src/components/ClientPortal.tsx`, `src/components/DocumentSigning.tsx`, `src/modules/documents/documents.routes.ts`, `src/db/database.ts` |

### 4.7 Firestore rule boundary

The current `firestore.rules` file allows unconditional read/write access for several sensitive collections, including:

- `audit_logs`
- synced `users`, `erp_records`, `live_messages`, `voip_calls`, and permission-related collections

Observed rule shape:

```text
allow read, write: if true;
```

This remains classified as `BROKEN_SECURITY_BOUNDARY` for the collections still accessed directly by the browser. The legacy `signed_documents` rule was removed after the UI moved to SQLite/API; the remaining appointment, call, audit, QA, and sync collection rules still require separate ownership review. Do not tighten all rules blindly because some browser and synchronization paths still use Firestore directly.

---

## 5. Global search boundary repair

`GlobalSearch` calls `/api/system/global-search` and previously had no server-side boundary beyond a generic query string. The route now requires `auth` and, for `client` accounts, narrows results to that client's own records by matching `client`, `clientIdCard`, `clientPhone`, or `case_id` before returning the search payload.

Status: `FIXED_SERVER_BOUNDARY`

Evidence: `src/components/GlobalSearch.tsx`, `src/modules/system/system.routes.ts`, `src/middleware/auth.ts`.

---

## 6. AI management boundary repair

The AI router is mounted both at `/api/ai` and `/public-ai`. The following management and memory endpoints now require `auth` at the route declaration:

- `/memory` CRUD, consolidation, stats, and recall test
- `/training` list/create/delete
- `/providers` and `/models` management
- provider testing and data-formulator actions

The public AI ask path remains separate and was not blocked by this change. Unauthenticated requests and `client` accounts do not receive long-term system memory context and are denied ERP/system-data search, trained-knowledge search, call-history search, system statistics, memory tools, MCP actions, document generation, and record-status mutation. Authenticated internal staff retain those tools for the existing internal AI workflow.

Status: `FIXED_MANAGEMENT_BOUNDARY`, public/client ask data boundary `FIXED_PARTIAL`, internal mutation scope `PARTIAL` pending role-level policy review.

Evidence: `src/modules/ai/ai.routes.ts`, `src/modules/ai/memory.service.ts`, `src/server.ts`, `src/components/AITrainingStudio.tsx`, `src/components/GlobalAIAssistant.tsx`.

---

## 7. Call Center boundary repair

`CallCenterAnalytics` loads statistics, analytics, employee/office/customer reports, realtime calls, and paginated logs through `/api/calls/*`. The history, stats, analytics, and detail routes already use `auth` and apply management/branch/employee filters.

The `/api/calls/realtime` endpoint was previously unauthenticated and returned all active calls. It now:

- requires `auth`
- gives system management roles the global view
- scopes branch managers to their branch/office
- scopes regular employees to calls assigned to their name/employee ID
- preserves the existing `{ currentConcurrent, peakConcurrent, activeCalls }` response shape

Status: `FIXED_SERVER_BOUNDARY`

Evidence: `src/components/CallCenterAnalytics.tsx`, `src/modules/calls/calls.routes.ts`, `src/middleware/auth.ts`, `src/db/database.ts`.

The legacy Firestore rules for `call_logs` and `qa_evaluations` were removed after repository-wide reference search found no runtime browser consumer. They now fall through to default deny. `voip_calls` remains in the sync allowlist because it is still part of the server-side persistence/synchronization path.

---

## 8. Verified repairs in this audit slice

### Client Portal response parsing

Observed mismatch:

```text
ClientPortal expected: response is an array
Backend returned:      { success: true, data: records, pagination: ... }
```

Repair applied in `src/components/ClientPortal.tsx`:

- accepts the existing paginated response
- preserves compatibility with an array response
- leaves backend permissions and UI layout unchanged

Validation:

```bash
npm run build
```

Result: successful Vite and esbuild production build.

### ESM realtime startup

Observed runtime failure:

```text
ReferenceError: require is not defined
```

Cause: `src/server.ts` used `require('./db/firestore-sync')` inside an ESM/tsx runtime even though `syncFromFirestore` was statically imported.

Repair applied:

- statically import `startRealTimeSync`
- call it in both startup branches
- preserve synchronization order

Runtime verification showed:

```text
=== STARTING SERVER-SIDE REAL-TIME SYNC WITH FIRESTORE ===
[RealTimeSync] Synced addition/modification for ...
```

The `require is not defined` failure did not recur. Firestore quota warnings remain an environment/integration limitation and are separately recorded as fallback-to-SQLite behavior.

---

## 9. Pending audit groups

| Group | Status | Next evidence required |
|---|---|---|
| App/auth/routing | Partial audit complete | Verify direct-route role enforcement and admin API boundaries |
| Client Portal | Partial audit complete | Signing and appointments now use authenticated SQLite/API ownership; audit remaining Firestore collections next; HTTP message-history, authenticated upload, and sensitive Socket.IO boundaries repaired; public visitor compatibility remains to verify |
| ERP records and filters | Pending | Trace ERP handlers, filters, pagination, record response contracts |
| Shared identity/branch/personnel | Pending | Trace canonical user/client/office contracts and all selectors |
| Trash and permissions | Pending | Trace soft delete, restore, permanent delete, resource access, UI states |
| Documents and signing | Pending | Trace upload, signing, history, storage, access policy |
| Finance and payments | Pending | Trace revenue, payment schedules, receipts, reports, QR flows |
| Calls and Call Center | Partial implementation work exists | Trace UI-to-route-to-voip_calls and Firestore fallback behavior |
| AI and memory | Partial implementation work exists | Trace prompt context, memory recall/store, tools, data exposure, permissions |
| Admin/CMS | Pending | Trace users, clients, services, news, recruitment, offices, settings |
| Global search/realtime | Pending | Trace search providers, event names, sync owners, stale state paths |

## 7. Next smallest slice

The next smallest evidence-based slice is Client Portal message and upload authorization:

1. inspect Socket.IO `join_visitor` and `send_message` server handlers
2. inspect Firestore rules for appointments
3. identify the canonical authenticated identity available to sockets/routes
4. add ownership checks without changing the portal UI
5. validate message load, send, upload, unauthorized access, and build

Do not begin a broad ERP extraction until this Client Portal boundary is either repaired or explicitly documented as an accepted product contract.
