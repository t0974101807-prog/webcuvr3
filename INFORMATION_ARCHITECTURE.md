# INFORMATION ARCHITECTURE
## Sơ đồ Kiến trúc Thông tin & Luồng Dữ liệu Độc lập (Single Source of Truth)

---

### 1. Nguyên lý Cấu trúc Tầng (Layered Architecture)

```
[ FRONTEND LAYER ]
    │
    ├─► Navigation Sidebar (Max 11 Level-1 Modules)
    │
    └─► View Presenters (Sub-tabs / Modular Components)
            │
[ SERVICE MESH LAYER ]
    │
    ├─► Authentication & RBAC Middleware (`auth`, `checkPermission`)
    ├─► AI Gateway Service (`/api/ai/*`)
    └─► Data Services (`/api/cases`, `/api/finance`, `/api/cms`, `/api/documents`)
            │
[ PERSISTENCE LAYER ]
    │
    ├─► SQLite / Cloud SQL / Firestore Database (Single Source of Truth)
    └─► Local Assets & Document File Store
```

---

### 2. Ma trận Loại bỏ Trùng lặp (De-duplication Matrix)

| Chức năng trùng lặp trước đây | Vị trí phân tán | Giải pháp Hợp nhất (Unified Target) |
| :--- | :--- | :--- |
| Executive Dashboard vs. Supervision Dashboard | Mở riêng lẻ 2 menu trên Sidebar | Hợp nhất vào **Dashboard (`/dashboard`)** sử dụng sub-tabs "Tổng quan Giám đốc" & "Giám sát Thời gian thực" |
| Quản lý Hợp đồng vs. Hồ sơ Vụ án | Xuất hiện ở menu Tranh tụng, Tư vấn, Hợp đồng | Hợp nhất Hợp đồng dịch vụ pháp lý vào **Legal Case (`/legal-cases`)** và Mẫu Hợp đồng vào **Document Center (`/documents`)** |
| Tra cứu Pháp luật vs. Công cụ Pháp lý | Có mặt ở 3 nơi khác nhau | Hợp nhất toàn bộ Văn bản quy phạm, Án lệ & Biểu mẫu vào **Document Center (`/documents`)** |
| Cài đặt API AI vs. Cài đặt Hệ thống | Phân tán trong CMS và Code | Đặt duy nhất tại **Administration (`/admin` -> Cài đặt)** và **AI Platform (`/ai-platform` -> Cài đặt API Keys)** |
