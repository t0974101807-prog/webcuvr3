# SYSTEM INVENTORY
## Kiểm kê 100% Tài nguyên Hệ thống Legal OS (System Audit Report)

---

### 1. Danh mục Component & Views (UI Inventory)

| File Component | Vai trò Hiện tại | Đánh giá Trùng lặp / Phân tán | Module Đích (IA Target) |
| :--- | :--- | :--- | :--- |
| `src/components/ERP.tsx` | God Component (~24k lines), Router chính | ⚠️ Chứa quá nhiều logic trùng giữa Dashboard, Records, Forms | Quy về Core Router + Layout Frame |
| `src/components/ExecutiveDashboard.tsx` | Dashboard Ban giám đốc & Thống kê KPI | ⚠ Trùng lặp một phần với Supervision Dashboard & ERP Stats | **Dashboard** (Tab: Executive) |
| `src/components/FinanceManagementView.tsx` | Màn hình Quản lý Tài chính - Chi phí - Thu thuế | ✅ Độc lập, đúng nghiệp vụ | **Finance** |
| `src/components/AdminDashboard.tsx` | Màn hình CMS Quản trị nội dung & Settings | ✅ Độc lập | **Administration / CMS** |
| `src/components/ConsultationCenter.tsx` | Màn hình Tư vấn & Tổng đài Softphone | ✅ Độc lập | **Consultation Center** |
| `src/components/LegalDocumentsManager.tsx` | Quản lý Văn bản pháp luật | ⚠ Trùng lặp với Công cụ pháp lý / Legal Forms | **Document Center** |
| `src/components/ContractsView.tsx` | Quản lý Hợp đồng | ⚠ Trùng lặp với Hồ sơ vụ việc / ERP records | **Document Center / Legal Case** |
| `src/components/SecurityView.tsx` | Bảo mật & Phân quyền Roles | ✅ Độc lập | **Administration** |
| `src/components/SupervisionDashboard.tsx` | Giám sát tiến độ | ⚠ Trùng lặp với Executive Dashboard | **Dashboard** (Tab: Live Supervision) |
| `src/components/ToolsPage.tsx` | Công cụ tra cứu pháp lý | ⚠ Trùng lặp với Legal Documents Manager | **Document Center / AI Platform** |
| `src/components/CaseDetailsSection.tsx` | Chi tiết hồ sơ vụ án | ✅ Đúng nghiệp vụ | **Legal Case** |

---

### 2. Danh mục Backend Routes (`/src/modules/` & `/src/routes/`)

1. **`/api/ai`** (`src/modules/ai/ai.routes.ts`): Xử lý Gemini Chat, Tóm tắt hồ sơ, OCR Scan, Dự báo AI.
2. **`/api/auth` & `/api/users`** (`src/modules/users/users.routes.ts`): Đăng nhập, Quản lý tài khoản, Vai trò.
3. **`/api/cases` & `/api/erp-records`** (`src/modules/cases/`): Quản lý Hồ sơ vụ án, Trạng thái tố tụng, Công nợ hồ sơ.
4. **`/api/documents` & `/api/legal-documents`**: Quản lý Văn bản pháp luật, Án lệ, Biểu mẫu.
5. **`/api/cms`**: Tin tức, Tuyển dụng, Lĩnh vực hoạt động, Cấu hình trang chủ.
6. **`/api/finance`** (`src/modules/finance/finance.routes.ts`): Thu/Chi, Tài sản, Nợ phải thu/trả, Bảng lương, Thuế.
7. **`/api/contact` & `/api/settings`** (`src/modules/contact/contact.routes.ts`): Hotline, Email, Cấu hình API Keys.
8. **`/api/permissions`**: Bảng phân quyền Role-Based Access Control (RBAC).

---

### 3. Danh mục Database Tables (`src/db/database.ts`)

- `users` (Tài khoản & Vai trò)
- `cases` / `erp_records` (Hồ sơ vụ án & Tranh tụng)
- `legal_documents` (Văn bản quy phạm pháp luật)
- `legal_forms` (Biểu mẫu hợp đồng)
- `judgments` & `precedents` (Bản án công bố & Án lệ Tối cao)
- `finance_transactions` (Giao dịch Thu/Chi)
- `company_assets` (Tài sản công ty)
- `company_debts` (Công nợ phải thu / phải trả)
- `contact_settings` (Cấu hình liên hệ & API Keys hệ thống)
- `role_permissions` (Quyền thao tác của từng chức danh)
