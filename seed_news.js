import Database from 'better-sqlite3';
const db = new Database('lawfirm.db');

const stmt = db.prepare('INSERT INTO news (title, excerpt, content, date, category) VALUES (?, ?, ?, ?, ?)');

stmt.run(
  'Hướng dẫn lập Báo cáo đánh giá tác động môi trường (ĐTM)',
  'ĐTM là thủ tục pháp lý quan trọng đối với các dự án có tác động đến môi trường. Cùng tìm hiểu quy trình cơ bản.',
  '### Báo cáo Đánh giá tác động môi trường (ĐTM)\n\nCăn cứ theo Luật Bảo vệ Môi trường 2020, dự án đầu tư nhóm I và nhóm II có nguy cơ tác động xấu đến môi trường phải thực hiện ĐTM.\n\n**Quy trình thực hiện:**\n1. Chuẩn bị hồ sơ và đánh giá.\n2. Lập báo cáo ĐTM.\n3. Nộp hồ sơ thẩm định tại Cơ quan chuyên môn về bảo vệ môi trường.\n4. Phê duyệt báo cáo ĐTM.',
  '2026-04-18',
  'Môi trường & ATTP'
);

stmt.run(
  'Điều kiện cấp Giấy chứng nhận cơ sở đủ điều kiện vệ sinh an toàn thực phẩm',
  'Chi tiết các điều kiện cơ sở nhà xưởng, trang thiết bị và con người để được cấp giấy chứng nhận VSATTP.',
  '### Giấy chứng nhận cơ sở đủ điều kiện ATTP\n\nCơ sở sản xuất, kinh doanh thực phẩm phải tuân thủ nghiêm ngặt các điều kiện về ATTP:\n\n- **Cơ sở vật chất:** Phải có khoảng cách an toàn đối với nguồn gây độc hại, nguồn gây ô nhiễm.\n- **Trang thiết bị:** Có đủ trang thiết bị phù hợp để xử lý nguyên liệu, chế biến, bảo quản thực phẩm.\n- **Con người:** Người trực tiếp sản xuất, kinh doanh phải được tập huấn kiến thức về ATTP và khám sức khỏe định kỳ.',
  '2026-04-15',
  'Môi trường & ATTP'
);

console.log("Seeded related news.");
