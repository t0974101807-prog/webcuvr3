# AI DEVELOPMENT GUIDE
## Quy tắc Quy chuẩn dành cho AI & Lập trình viên Phát triển Legal OS

---

### Quy tắc 1: Kiểm tra Hiến pháp trước khi Viết Code
Trước khi bổ sung bất kỳ file component hay tính năng mới nào, AI / Lập trình viên **BẮT BUỘC** phải đọc file `LEGAL_OS_CONSTITUTION.md` và `NAVIGATION_BLUEPRINT.md`.

### Quy tắc 2: Không Tạo Menu Cấp 1 Mới
- Menu Sidebar Cấp 1 **cố định tối đa 11 module** (Dashboard, CRM, Consultation Center, Legal Case, Document Center, Workflow, AI Platform, Finance, HR, Administration, Client Portal).
- Bất kỳ tính năng mới nào cũng phải được đặt vào **Sub-tab** hoặc **Modal / Drawer** bên trong 1 trong 11 module này.

### Quy tắc 3: Tích hợp AI Tập trung qua AI Platform
Mọi thao tác gọi LLM / Gemini API phải đi qua Gateway Service `/api/ai/*`. Tuyệt đối không nhúng direct API Key hoặc gọi endpoint lạ từ phía UI Components.

### Quy tắc 4: Tuân thủ Single Source of Truth
Mọi dữ liệu hiển thị trên UI phải được fetch từ API Backend chuẩn (`/api/*`). Tuyệt đối không duplicate state giả lập ở nhiều màn hình khác nhau.
