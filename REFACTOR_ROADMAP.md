# REFACTOR ROADMAP
## Lộ trình Thực thi Refactor Hệ thống Legal OS (Phân kỳ Ưu tiên)

---

### Giai đoạn P0: Chuẩn hóa Điều hướng & Cấu hình AI Module (Hoàn thành Ngay)
- [x] **Cài đặt API AI trong CMS / Settings**: Bổ sung khu vực cấu hình API Key (Gemini API / Custom Provider), AI Temperature, Max Tokens & Toggles tính năng AI trong Admin Dashboard & AI Platform.
- [x] **Gộp Menu Cấp 1 về 11 Module Chuẩn**: Tinh gọn thanh điều hướng Sidebar tại `ERP.tsx` và `AdminDashboard.tsx`, xóa bỏ các menu dư thừa / trùng lặp chức năng.
- [x] **Khởi tạo Bộ Tài liệu Kiến trúc Chuẩn**: `LEGAL_OS_CONSTITUTION.md`, `SYSTEM_INVENTORY.md`, `MODULE_REGISTRY.md`, `INFORMATION_ARCHITECTURE.md`, `NAVIGATION_BLUEPRINT.md`, `DATA_OWNERSHIP.md`, `EVENT_CATALOG.md`, `REFACTOR_ROADMAP.md`, `AI_DEVELOPMENT_GUIDE.md`.

---

### Giai đoạn P1: Tách rời God Component (`ERP.tsx`)
- [ ] Tách `ERP.tsx` thành các Module Container độc lập trong `/src/components/modules/`:
  - `DashboardModule.tsx`
  - `CRMModule.tsx`
  - `ConsultationModule.tsx`
  - `LegalCaseModule.tsx`
  - `DocumentCenterModule.tsx`
  - `WorkflowModule.tsx`
  - `AIPlatformModule.tsx`
  - `FinanceModule.tsx`
  - `HRModule.tsx`
  - `AdminModule.tsx`

---

### Giai đoạn P2: Tối ưu hóa Performance & Realtime Synchronization
- [ ] Áp dụng React Lazy Loading (`React.lazy`) cho từng Module Container.
- [ ] Tối ưu hóa Firestore / WebSocket real-time event listener.
