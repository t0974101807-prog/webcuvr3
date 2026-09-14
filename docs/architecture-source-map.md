 # Legal AI Operating System - Source Map

## Nguyên tắc bất biến

UI/UX hiện tại là bất biến: không thay đổi layout, màu sắc, icon, typography, navigation, form hoặc màn hình hiện có. Tài liệu này chỉ lập bản đồ backend, API, service, repository, data access, schema và synchronization.

## Luồng runtime thực tế

```text
React components
	-> fetchApi / api.req / fetch
	-> Express route mounted in src/server.ts
	-> route handler/controller
	-> service or repository
	-> SystemDataAccess and/or src/db/database.ts
	-> SQLite lawfirm.db
	-> optional Firestore synchronization
```

Các router chính được mount trong [src/server.ts](../src/server.ts):

- `auth`, `users`, `clients`, `cases`, `documents`, `cms`, `payroll`, `contact`
- `ai`, `permissions`, `legal_documents`, `system`, `finance`, `calls`, `payment`
- `hrm` tại `/api/hr`, `iot` tại `/api/iot`
- `api_gateway` được mount trực tiếp

## Source map theo domain

| Domain | API/route thực tế | Service/repository | Bảng hoặc nguồn dữ liệu | Data owner |
|---|---|---|---|---|
| User / Personnel | `/api/users`, `/api/users/employees`, `/api/employees`, `/api/hr/employees` | `src/modules/users/users.routes.ts`, `src/modules/hrm/hrm.routes.ts`, `src/utils/staffCode.ts` | `users`, `employees` | Shared system entity |
| Branch / Office | `/api/offices` | `src/modules/cms/cms.routes.ts` | `offices` | Shared system entity |
| Client | `/api/clients`, `/api/partners` | `src/modules/clients/clients.routes.ts`, `src/components/ClientManagement.tsx` | `users` với `role/account_type`, một phần payload ERP | Shared entity, hiện còn trộn với users |
| Legal records | `/api/cases`, `/api/erp-records` | `src/modules/cases/cases.routes.ts`, `src/system/data-access/SystemDataAccess.ts` | domain repositories + `erp_records` + `cases` | Domain record; `SystemDataAccess` là federation boundary |
| Litigation | dùng `SystemDataAccess` với domain `litigation` | `src/modules/litigation/repositories/LitigationRepository.ts` | domain storage của repository | Domain-specific record |
| Consultation | dùng `SystemDataAccess` với domain `consultation` | `src/modules/consultation/repositories/ConsultationRepository.ts` | domain storage của repository | Domain-specific record |
| Representation | dùng `SystemDataAccess` với domain `representation` | `src/modules/representation/repositories/RepresentationRepository.ts` | domain storage của repository | Domain-specific record |
| Compliance | dùng `SystemDataAccess` với domain `compliance` | `src/modules/compliance/repositories/ComplianceRepository.ts` | domain storage của repository | Domain-specific record |
| Arbitration | dùng `SystemDataAccess` với domain `arbitration` | `src/modules/arbitration/repositories/ArbitrationRepository.ts` | domain storage của repository | Domain-specific record |
| Documents | `/api/documents`, `/api/legal_documents` | `src/modules/documents/documents.routes.ts`, `src/modules/legal_documents/legal_documents.routes.ts` | `files`, `legal_documents` | Shared document service target |
| Permissions | `/api/permissions`, `/api/permissions/me` | `src/modules/permissions/permissions.routes.ts`, `src/middleware/auth.ts` | `role_permissions` | Shared auth/RBAC entity |
| Trash | `/api/trash/*`, `/api/recycle-bin/*` | `src/services/trash.service.ts`, `src/modules/cases/cases.routes.ts` | `recycle_bin` + soft-delete fields in records | Shared system service |
| Payroll / Finance | `/api/monthly-payrolls`, `/api/finance/*`, `/api/payment/*` | `src/modules/payroll`, `finance`, `payment` | `monthly_payrolls`, `evaluations`, `payments`, `payment_schedules` | Shared financial projections |

## Shared data access

`src/system/data-access/SystemDataAccess.ts` hiện là điểm hợp nhất quan trọng nhất:

- `DOMAINS`: `litigation`, `consultation`, `representation`, `compliance`, `arbitration`
- `mapCategoryToDomain`: ánh xạ category/practice area vào domain
- `getAllRecords`: federation đọc nhiều domain
- `getRecordById`: federation lookup
- `saveRecord`: route ghi vào domain repository và write-through vào `erp_records`
- `deleteRecord`: xóa qua các domain repository và legacy `erp_records`
- `queryFederated`: search/filter/scope/sort/pagination dùng chung

### Data owner hiện tại

```text
Shared owners:
	users / personnel
	offices
	role_permissions
	files / legal_documents
	recycle_bin

Domain owners:
	litigation records
	consultation records
	representation records
	compliance records
	arbitration records

Compatibility projection:
	erp_records
```

## Database foundation

`src/db/database.ts` khởi tạo SQLite connection và các bảng chính:

```text
users, clients, offices
cases, erp_records, recycle_bin
files, legal_documents
monthly_payrolls, evaluations
payments, payment_schedules
role_permissions, visitor_stats
```

`src/db/firestore-sync.ts` là lớp đồng bộ SQLite/Firestore, được gọi qua `syncRowToFirestore`, `syncToFirestore` và `deleteFromFirestore`.

## Service layer hiện tại

- `src/services/trash.service.ts`: soft delete, restore, permanent purge, 30-day cleanup, audit và Firestore cleanup.
- `src/services/activityLog.service.ts`: activity log.
- `src/services/ai.service.ts`: AI application boundary.
- `src/services/BackgroundSyncService.ts`: background sync.
- `src/services/ConcurrencyManager.ts`: concurrency coordination.
- `src/services/OperationTracker.ts`: operation tracking.

## Chồng chéo cần xử lý ở phase tiếp theo

1. **Personnel API overlap:** `/api/users`, `/api/users/employees`, `/api/employees`, `/api/hr/employees` trả các shape khác nhau cho cùng một nhóm dữ liệu.
2. **Client identity overlap:** client được biểu diễn qua `users`, `/api/clients` và các payload ERP; cần xác định một shared client contract.
3. **Legacy record projection:** `SystemDataAccess.saveRecord` ghi cả domain repository và `erp_records`; `erp_records` phải là projection tương thích, không phải nguồn thứ hai.
4. **Branch aliases:** dữ liệu cũ có `Hà Nội`, `Chi nhánh Hà Nội`, `Trụ sở chính`, `TP.HCM`; chuẩn hóa phải nằm ở boundary, không rải trong UI.
5. **Trash semantics:** hệ thống thật dùng `recycle_bin` và `TrashService`; không dùng riêng schema mô phỏng `cases.is_deleted` để thay thế luồng thật.
6. **Auth/RBAC overlap:** quyền được kiểm tra ở `auth`, `requirePermission`, role mapping và fallback frontend; cần hợp nhất sau khi khóa contract.
7. **Finance projections:** payroll/evaluation/payment/finance cùng tính các giá trị lương, thưởng, thu nhập; cần xác định authoritative field trước khi refactor công thức.

## PHẦN 2 - Phát hiện chồng chéo thực tế

### 1. Personnel / User API

| Endpoint | Route owner | Nguồn | Shape/behavior | Overlap |
|---|---|---|---|---|
| `/api/users` | `src/modules/users/users.routes.ts` | `users` | Directory fields, pagination; includes all roles | General account directory |
| `/api/users/employees` | `src/modules/users/users.routes.ts` | `users` | Excludes `admin`, `client`, `partner`; normalizes branch | Operational personnel lookup |
| `/api/employees` | `src/modules/hrm/hrm.routes.ts` | `users` | Enriched HR payload: employee code, department, citizen/tax/social IDs, face/fingerprint/QR IDs | HR personnel projection |
| `/api/employees` | `src/modules/calls/calls.routes.ts` | `voip_calls` grouped by staff | Call-performance employees, not personnel directory | Same URL family, different meaning when mounted under `/api/calls` |
| `/api/hr/employees` | `src/modules/hrm/hrm.routes.ts` | `users` | HR-specific enriched list | UI HR surface |

Concrete duplication:

- `users.branch` is the shared stored branch field; HR and users routes both project it.
- HR adds derived identity fields that do not belong in the base personnel entity.
- `users.routes.ts` excludes admin/client/partner; HRM currently excludes only `client`, so admin/partner exposure must be treated as a contract risk.
- Creation paths differ: `/api/users` accepts broad user fields; `/api/employees` creates a personnel record with defaults and a random staff code.

**Proposed owner:** `users` remains the personnel/account owner; HR fields and derived identifiers should be a projection/service contract, not a second personnel store.

### 2. Client identity

`src/modules/clients/clients.routes.ts` confirms that Client is currently stored in `users`:

- `POST /api/client` inserts `users` with `role = 'client'`.
- `GET /api/clients` selects `role = 'client'` in paginated mode.
- Non-paginated `GET /api/clients` selects `role = 'client' OR account_type = 'CUSTOMER'`.
- `GET /api/partners` selects `role = 'partner' OR account_type = 'PARTNER'`.

This creates two classification authorities for client identity:

```text
role = client / partner
account_type = CUSTOMER / PARTNER
```

The UI also creates related records through `ClientManagement.tsx`, which fetches `/api/users` for manager selection while creating client/partner accounts through `/api/users`. Therefore client identity, user identity, and operational personnel are currently adjacent projections of the same `users` table.

**Proposed owner:** one shared client/account contract backed by `users` until a migration is proven. Do not create `litigation_clients`, `consultation_clients`, or other domain copies.

### 3. Branch / Office contracts

`src/modules/cms/cms.routes.ts` owns the branch directory:

```text
GET    /api/offices
POST   /api/offices
PUT    /api/offices/:id
DELETE /api/offices/:id
```

The directory schema is `offices` with `name`, `short_name`, `region`, address/contact fields, map fields, and `is_headquarters`.

There is a separate metrics endpoint in `src/modules/calls/calls.routes.ts` mounted under `/api/calls`:

```text
GET /api/calls/offices
```

It groups `voip_calls.branch` and returns `office_name`, call counts, answer rate and talk time. This is an office performance report, not an office directory and must not become a second branch source.

Concrete branch contract risk:

- Directory uses `offices.name` and `short_name`.
- Personnel stores free-text `users.branch`.
- Legacy aliases include `Hà Nội`, `Chi nhánh Hà Nội`, `Trụ sở chính`, `TP.HCM`, and `Hội sở`.
- `src/utils/branch.ts` is the current normalization boundary, but writes are not yet fully centralized across every module.

**Proposed owner:** `offices` owns branch identity; personnel and records reference the canonical office code/name through a shared contract. `/api/calls/offices` remains a read-only metrics projection.

### 4. Documents and records

The codebase currently has multiple document/record paths:

- `files` is used by `src/modules/documents/documents.routes.ts` for case-linked uploaded files.
- `legal_documents` is used by `src/modules/legal_documents/legal_documents.routes.ts` for legal document management.
- Domain records are federated by `SystemDataAccess` and also projected to `erp_records`.
- `recycle_bin` stores serialized deleted payloads from multiple original tables.

The overlap is legitimate at business level only if ownership is explicit:

```text
Legal record owner: domain repository
Legacy compatibility projection: erp_records
Document owner: files/legal_documents service boundary
Deleted snapshot owner: TrashService/recycle_bin
```

### 5. Permissions and scope

`src/middleware/auth.ts`, `requirePermission`, role mapping, and `role_permissions` all participate in authorization. UI components also contain fallback role arrays. This is a distributed policy surface, not a duplicate database entity yet, but it is a high-risk overlap because a module can disagree with the central permission table.

**Proposed owner:** auth middleware plus `role_permissions`; UI fallbacks remain compatibility behavior until route contracts are covered by tests.

## PHẦN 3 - Quyết định chủ sở hữu dữ liệu

| Dữ liệu | Authoritative owner | Read models / projections | Không được làm |
|---|---|---|---|
| User / Personnel / Account | `users` + users service boundary | HR enriched employee response, staff-code enrichment, call metrics | Không tạo `LitigationUser`, `ConsultationPersonnel` hoặc bảng personnel theo domain |
| Client / Partner account | `users` với contract role/account type thống nhất dần | `/api/clients`, `/api/partners`, client/partner cards | Không tạo client copy theo từng legal domain |
| Branch / Office | `offices` + office service boundary | normalized `users.branch`, call-office metrics, dashboard filters | Không để UI tự sở hữu danh sách chi nhánh hoặc dùng call metrics làm directory |
| Legal record | Một trong năm domain repositories, truy cập qua `SystemDataAccess` | `erp_records`, dashboard/search/payment projections | Không coi `erp_records` là database thứ hai có quyền ghi độc lập |
| Document | Document service boundary trên `files` và `legal_documents` | record cards, case/document views, search results | Không tạo document service lặp lại chỉ vì domain khác nhau |
| Permission / Data scope | `role_permissions` + auth middleware | `/api/permissions/me`, frontend permission state | Không để từng module tự quyết định quyền trái với middleware |
| Trash lifecycle | `TrashService` + `recycle_bin` | Recycle Bin UI, audit events, Firestore deleted snapshots | Không tạo trash table cho từng domain |
| Payroll / bonus / finance | Phân biệt payroll projection, evaluation bonus và payment ledger trước khi sửa | HR payroll, Finance dashboard, payment reports | Không coi cùng một con số ở nhiều màn hình là cùng nguồn nếu chưa có contract |

### Ownership rules

1. Ghi dữ liệu shared chỉ đi qua service/route boundary của owner.
2. Domain repository chỉ sở hữu domain record; nó không sở hữu lại Client, User, Personnel hoặc Branch.
3. Projection phải có tên và mục đích rõ ràng; projection không được trở thành nguồn ghi thứ hai.
4. Khi đồng bộ Firestore, SQLite vẫn là application source hiện tại; mọi thay đổi phải đi qua cùng ownership boundary.
5. UI hiện tại chỉ tiêu thụ API contracts; không thay đổi component để bù cho ownership chưa rõ.

## Cấu trúc đích đề xuất

```text
src/
	modules/                 # business domains and compatible route surfaces
	application/
		services/              # shared use cases: users, clients, offices, documents, trash
	domain/
		shared/                # contracts for User, Client, Personnel, Office, Document
		legal/                 # domain record contracts and policies
	repositories/
		shared/                # shared entity persistence boundaries
		legal/                 # five domain repositories
	system/
		data-access/           # existing SystemDataAccess federation boundary
	db/                      # SQLite/Firestore infrastructure
```

The first implementation step should be contract extraction and compatibility adapters, not moving files or redesigning UI.

Implemented contract foundation:

- `src/types/shared-entities.ts` defines the shared type contracts for `UserAccount`, `Personnel`, `Office`, `ClientAccount`, `LegalRecord`, and `DocumentRecord`.
- These contracts are type-only and currently do not alter API behavior, runtime wiring, or UI/UX.

Implemented shared service boundary:

- `src/application/services/sharedDirectory.service.ts` now owns compatibility reads for shared personnel and office directories.
- Existing `GET /api/users/employees` and `GET /api/offices` routes delegate to that service without changing their URLs or UI-facing response behavior.
- Personnel reads use the shared `users` source, exclude operationally isolated roles, normalize branch names, and support an optional branch filter.
- Office reads use the shared `offices` source and preserve headquarters-first ordering.

## Cấu trúc đích giữ nguyên UI

```text
UI hiện tại (không đổi)
	-> API/controller
	-> application service
	-> shared entities + legal domain service
	-> repository / SystemDataAccess
	-> SQLite / Firestore
```

Năm domain vẫn được giữ repository riêng; Client, User, Personnel, Branch, Document, Permission và Trash không được nhân bản theo domain.

## Thứ tự triển khai tiếp theo

1. Khóa API contracts hiện tại bằng type/schema tests.
2. Chuẩn hóa response contract cho personnel và offices.
3. Giữ `SystemDataAccess` làm federation boundary duy nhất cho legal records.
4. Tách shared entity persistence khỏi domain repositories nếu có duplicate.
5. Giữ compatibility routes cho UI hiện tại.
6. Chuẩn hóa TrashService callers.
7. Xác định owner cho payroll/finance projections.
8. Thêm integration tests, typecheck và build sau từng phase.

## Không làm

- Không redesign hoặc thay thế UI.
- Không xóa legacy tables trước khi trace hết callers và sync paths.
- Không thêm mock/seed data vào production path.
- Không tạo domain-specific bản sao của Client, User, Personnel, Branch, Document, Permission hoặc Trash.
