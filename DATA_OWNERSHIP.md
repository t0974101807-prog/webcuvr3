# DATA OWNERSHIP
## Bảng Phân định Chủ sở hữu Dữ liệu Duy nhất (Single Data Owners)

---

### Nguyên tắc
Mỗi thực thể dữ liệu chỉ có **ĐÚNG MỘT MODULE** làm chủ sở hữu trực tiếp (Owner). Các module khác muốn sử dụng phải thông qua **API** hoặc **Foreign Keys**, không tạo bản sao dữ liệu.

---

### Bảng Phân định Trách nhiệm

| Thực thể Dữ liệu (Entity) | Database Table | Module Chủ sở hữu (Data Owner) | API Endpoints Quản lý |
| :--- | :--- | :--- | :--- |
| **Khách hàng & Doanh nghiệp** | `clients`, `users` (role=client) | **CRM** | `/api/clients` |
| **Hồ sơ Vụ án & Tranh tụng** | `cases`, `erp_records` | **Legal Case** | `/api/cases`, `/api/erp-records` |
| **Cuộc gọi & Lịch hẹn** | `consultations` | **Consultation Center** | `/api/contact` |
| **Tài liệu, Hợp đồng, Án lệ** | `legal_documents`, `legal_forms` | **Document Center** | `/api/legal-documents` |
| **Nhiệm vụ & Lịch Tòa** | `tasks`, `qc_rules` | **Workflow** | `/api/system/qc-rules` |
| **Cấu hình AI & Model Keys** | `contact_settings` (`ai_*`) | **AI Platform** | `/api/settings` |
| **Sổ quỹ Thu/Chi, Tài sản** | `finance_transactions`, `company_assets` | **Finance** | `/api/finance/*` |
| **Nhân sự & Bảng lương** | `users`, `payrolls` | **HR** | `/api/users`, `/api/payroll` |
| **Nội dung CMS Website** | `news`, `services`, `recruitment` | **Administration** | `/api/cms/*` |
