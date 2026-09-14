# LEGAL OS CONSTITUTION
## Hiến pháp & Quy chuẩn Kiến trúc Hệ thống Legal OS

---

### Điều 1: Tuyên ngôn Nguyên tắc Tối thượng
> **ONE BUSINESS CAPABILITY – ONE MODULE**  
> *(Một nghiệp vụ chỉ có một chủ sở hữu duy nhất)*

1. Không cho phép tồn tại 02 module hoặc giao diện độc lập cùng thực hiện việc quản lý hoặc thao tác trực tiếp trên cùng một thực thể dữ liệu cốt lõi (Khách hàng, Hồ sơ vụ việc, Hợp đồng, Tài sản - Tài chính, Nhân sự, AI Service).
2. Khi bổ sung tính năng mới, bắt buộc phải đối chiếu với **Module Registry** hiện có. Nếu tính năng thuộc phạm vi của một Module đã tồn tại, tính năng đó phải được tích hợp thành Sub-view, Tab hoặc Sub-component bên trong Module đó, **tuyệt đối không tạo Menu Cấp 1 mới**.

---

### Điều 2: Định cấu trúc Navigation Cấp 1 (Chuẩn Enterprise - Max 11 Modules)
Toàn bộ hệ thống quản trị Legal OS được tinh gọn và quy chuẩn hóa vào 11 Module cấp 1 chính thức:

1. **Dashboard** (`/dashboard`): Trung tâm chỉ huy, tổng hợp KPI toàn diện, Giám sát vận hành & AI Executive Insights.
2. **CRM** (`/crm`): Quản lý vòng đời khách hàng, Khách hàng tiềm năng (Leads), Cơ hội & Lịch sử chăm sóc.
3. **Consultation Center** (`/consultation`): Tổng đài tư vấn, Chat đa kênh, Hotline, Softphone & Lịch hẹn tư vấn.
4. **Legal Case** (`/legal-cases`): Quản lý Hồ sơ vụ án, Tranh tụng, Tư vấn pháp luật, Tiến độ & Giai đoạn tố tụng.
5. **Document Center** (`/documents`): Kho tài liệu tập trung, Hợp đồng, Biểu mẫu pháp lý, Văn bản quy phạm & OCR Scan.
6. **Workflow** (`/workflow`): Quản lý quy trình làm việc, Nhiệm vụ (Tasks), Quy chuẩn QC & Lịch biểu tố tụng.
7. **AI Platform** (`/ai-platform`): Trung tâm trí tuệ nhân tạo, AI Chat, AI Legal Research, AI Contract Review & Cấu hình API.
8. **Finance** (`/finance`): Quản lý Tài chính - Kế toán, Thu/Chi, Công nợ, Tài sản, Báo cáo thuế & Lương thưởng.
9. **HR** (`/hr`): Quản lý Nhân sự, Sơ đồ tổ chức, Đánh giá KPI, Đào tạo & Tuyển dụng.
10. **Administration** (`/admin`): Quản trị hệ thống, Cài đặt CMS, Phân quyền Roles/Permissions, Nhật ký audit & Bảo mật.
11. **Client Portal** (`/portal`): Màn hình dành cho Khách hàng tra cứu hồ sơ, nhận thông báo & gửi yêu cầu trực tuyến.

---

### Điều 3: Quy chuẩn Quản lý Dữ liệu & State (Single Source of Truth)
1. **Database Layer**: SQLite / PostgreSQL (Cloud SQL) / Firestore là nơi lưu trữ trạng thái duy nhất.
2. **Backend Services**: API Routes (`/api/*`) làm nhiệm vụ ủy quyền, kiểm tra vai trò (Role-based access control) và thực thi nghiệp vụ.
3. **Frontend UI**: Mọi giao diện chỉ đóng vai trò Trình biểu diễn (Presenter). Dữ liệu được fetch thông qua API chuẩn, tuyệt đối không nhân bản state giả lập giữa các màn hình khác nhau.

---

### Điều 4: Quy trình Tích hợp AI (AI Service Mesh)
1. AI Platform là **điểm tích hợp duy nhất** kết nối với Gemini API, Google GenAI SDK & Antigravity Agent.
2. Các module khác (CRM, Legal Case, Document Center) khi sử dụng tính năng AI (tóm tắt hồ sơ, trích xuất OCR, rà soát hợp đồng) bắt buộc phải thông qua **AI Platform Endpoint Services** (`/api/ai/*`).

---

### Điều 5: Kỷ luật Phát triển Code (Clean Architecture)
1. Cấm các file "God Components" vượt quá 2,000 dòng code. Phải tách nhỏ thành sub-components trong `/src/components/<module>/`.
2. Mọi API keys và bí mật hệ thống phải được lưu trữ trong biến môi trường hoặc cấu hình cơ sở dữ liệu bảo mật, tuyệt đối không lộ ở phía Client.
