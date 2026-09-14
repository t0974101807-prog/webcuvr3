# EVENT CATALOG
## Danh mục Sự kiện Hệ thống & Luồng Giao tiếp Giữa các Module (Event-Driven Mesh)

---

### Sơ đồ Luồng Sự kiện Cốt lõi (Core Event Bus)

1. **`CustomerCreated`** (Tạo khách hàng mới từ Consultation Center / Hotline)
   - *Source*: Consultation Center
   - *Subscribers*: CRM (Tạo Lead), Notification System.

2. **`CaseCreated`** (Khởi tạo hồ sơ vụ việc mới)
   - *Source*: Legal Case
   - *Subscribers*: Finance (Tạo bản ghi công nợ dự kiến), Workflow (Tạo lịch làm việc sơ khởi), Dashboard (Cập nhật KPI vụ việc).

3. **`PaymentReceived`** (Thu phí dịch vụ thành công)
   - *Source*: Finance
   - *Subscribers*: Legal Case (Cập nhật số tiền còn nợ `remainingFee`), Dashboard (Cập nhật Doanh thu thực tế `totalRevenue`).

4. **`AIDocumentProcessed`** (AI phân tích xong hợp đồng / OCR)
   - *Source*: AI Platform
   - *Subscribers*: Document Center (Lưu metadata trích xuất), Legal Case (Gắn tóm tắt vào hồ sơ vụ án).
