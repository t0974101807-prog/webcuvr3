import Database from 'better-sqlite3';
const db = new Database('lawfirm.db');

const stmt = db.prepare('INSERT INTO news (title, excerpt, content, date, category) VALUES (?, ?, ?, ?, ?)');

const newsItems = [
  // Du lịch & Đầu tư
  {
    title: 'Thủ tục xin Giấy phép kinh doanh lữ hành quốc tế',
    excerpt: 'Hướng dẫn chi tiết điều kiện và thủ tục cấp Giấy phép kinh doanh dịch vụ lữ hành quốc tế mới nhất.',
    content: '### Giấy phép kinh doanh lữ hành quốc tế\n\nKinh doanh dịch vụ lữ hành quốc tế là ngành nghề kinh doanh có điều kiện. Doanh nghiệp cần đáp ứng các yêu cầu khắt khe về vốn, nhân sự và cơ sở vật chất.\n\n**Điều kiện cơ bản:**\n1. Doanh nghiệp được thành lập theo quy định của pháp luật về doanh nghiệp.\n2. Ký quỹ kinh doanh dịch vụ lữ hành quốc tế.\n3. Người phụ trách kinh doanh dịch vụ lữ hành phải tốt nghiệp cao đẳng trở lên chuyên ngành lữ hành hoặc có chứng chỉ nghiệp vụ.',
    date: '2026-04-18',
    category: 'Du lịch & Đầu tư'
  },
  {
    title: 'Quy định mới về ưu đãi đầu tư cho doanh nghiệp FDI',
    excerpt: 'Cập nhật các chính sách ưu đãi thuế, tiền thuê đất đối với các dự án đầu tư nước ngoài tại Việt Nam.',
    content: '### Chính sách ưu đãi FDI\n\nViệt Nam tiếp tục khẳng định môi trường đầu tư hấp dẫn thông qua các chính sách ưu đãi:\n\n- **Ưu đãi thuế TNDN:** Miễn thuế, giảm thuế có thời hạn đối với các lĩnh vực công nghệ cao, khu vực kinh tế khó khăn.\n- **Miễn thuế nhập khẩu:** Đối với hàng hóa nhập khẩu tạo tài sản cố định.\n- **Ưu đãi tiền thuê đất:** Miễn, giảm tiền thuê đất tùy thuộc vào vị trí và tính chất dự án.',
    date: '2026-04-17',
    category: 'Du lịch & Đầu tư'
  },
  
  // Bất động sản & Doanh nghiệp
  {
    title: 'Trình tự thực hiện mua bán, sáp nhập doanh nghiệp (M&A)',
    excerpt: 'Các bước thẩm định pháp lý và quy trình thực hiện một thương vụ M&A thành công, an toàn.',
    content: '### Quy trình M&A chuẩn mực\n\nMua bán, sáp nhập doanh nghiệp đòi hỏi sự cẩn trọng và đánh giá toàn diện:\n\n1. **Thẩm định pháp lý (Due Diligence):** Đánh giá rủi ro pháp lý, thuế, lao động, hợp đồng của doanh nghiệp mục tiêu.\n2. **Đàm phán hợp đồng:** Chốt các điều khoản quan trọng về giá trị, điều kiện thanh toán và trách nhiệm bồi thường.\n3. **Thủ tục đăng ký:** Đăng ký thay đổi thành viên/cổ đông tại Sở Kế hoạch và Đầu tư.\n4. **Chuyển giao:** Bàn giao tài sản, nhân sự và quản trị.',
    date: '2026-04-16',
    category: 'Bất động sản & Doanh nghiệp'
  },
  {
    title: 'Những điểm mới cần lưu ý trong Luật Kinh doanh BĐS',
    excerpt: 'Tóm tắt các quy định mới ảnh hưởng trực tiếp đến chủ đầu tư và sàn giao dịch bất động sản.',
    content: '### Cập nhật Luật Kinh doanh BĐS\n\nCác chủ thể tham gia thị trường cần lưu ý các cập nhật sau:\n\n- Siết chặt điều kiện đối với dự án hình thành trong tương lai.\n- Bắt buộc giao dịch qua ngân hàng đối với một số loại hình giao dịch.\n- Yêu cầu chứng chỉ hành nghề đối với cá nhân kinh doanh dịch vụ môi giới độc lập.',
    date: '2026-04-14',
    category: 'Bất động sản & Doanh nghiệp'
  },

  // Lao động & Kinh doanh
  {
    title: 'Lưu ý khi đơn phương chấm dứt hợp đồng lao động',
    excerpt: 'Quy trình và lý do hợp pháp giúp doanh nghiệp tránh rủi ro khi đơn phương chấm dứt hợp đồng với người lao động.',
    content: '### Đơn phương chấm dứt HĐLĐ\n\nDoanh nghiệp cần tuân thủ thời hạn báo trước và chỉ được phép chấm dứt trong các trường hợp quy định:\n\n- Người lao động thường xuyên không hoàn thành công việc theo đánh giá hiệu quả.\n- Doanh nghiệp thu hẹp sản xuất do thiên tai, dịch bệnh.\n- Bắt buộc tuân thủ thời hạn báo trước (30 ngày HĐ xác định thời hạn, 45 ngày HĐ không xác định thời hạn).',
    date: '2026-04-15',
    category: 'Lao động & Kinh doanh'
  },
  {
    title: 'Quy trình xin cấp giấy phép lao động cho chuyên gia nước ngoài',
    excerpt: 'Các thủ tục cần thiết để chuyên gia, nhà quản lý nước ngoài được làm việc hợp pháp tại Việt Nam.',
    content: '### Giấy phép lao động (Work Permit)\n\nĐối với người nước ngoài, giấy phép lao động là điều kiện bắt buộc:\n\n1. Giải trình nhu cầu sử dụng lao động nước ngoài (nộp trước 30 ngày).\n2. Chuẩn bị hồ sơ: Lý lịch tư pháp, giấy khám sức khỏe, bằng cấp/chứng nhận chuyên gia hợp pháp hóa lãnh sự.\n3. Nộp hồ sơ xin cấp GPLĐ tại Sở Lao động - Thương binh & Xã hội.',
    date: '2026-04-10',
    category: 'Lao động & Kinh doanh'
  },

  // Tranh tụng & Hình sự
  {
    title: 'Quyền của luật sư trong giai đoạn điều tra vụ án hình sự',
    excerpt: 'Sự tham gia của luật sư từ sớm giúp đảm bảo quyền lợi hợp pháp của bị can, tránh oan sai.',
    content: '### Vai trò của Luật sư Tố tụng Hình sự\n\nLuật sư có quyền tham gia bắt đầu từ khi có quyết định khởi tố:\n\n- Có mặt khi lấy lời khai, hỏi cung bị can.\n- Thu thập và xuất trình tài liệu, đồ vật.\n- Kiến nghị thay đổi biện pháp ngăn chặn (như xin tại ngoại).\n- Đọc, ghi chép bản sao tài liệu trong hồ sơ vụ án.',
    date: '2026-04-12',
    category: 'Tranh tụng & Hình sự'
  },
  
  // Sở hữu trí tuệ & Khác
  {
    title: 'Tầm quan trọng của việc đăng ký Nhãn hiệu độc quyền',
    excerpt: 'Tại sao doanh nghiệp cần đăng ký bảo hộ nhãn hiệu ngay từ khi bắt đầu kinh doanh?',
    content: '### Bảo hộ Nhãn hiệu\n\nNhãn hiệu là tài sản vô hình vô giá. Việc đăng ký mang lại:\n\n- Quyền sở hữu và sử dụng độc quyền.\n- Ngăn chặn đối thủ sao chép, làm giả.\n- Là cơ sở pháp lý để xử lý vi phạm trên nền tảng thương mại điện tử.\n- Tăng giá trị doanh nghiệp khi nhượng quyền (Franchise) hoặc gọi vốn.',
    date: '2026-04-11',
    category: 'Sở hữu trí tuệ & Khác'
  },

  // Tư vấn pháp luật thường xuyên
  {
    title: 'Lợi ích của dịch vụ pháp chế thuê ngoài (In-house Counsel)',
    excerpt: 'Giải pháp tối ưu chi phí nhưng vẫn đảm bảo sự an toàn pháp lý cho các doanh nghiệp vừa và nhỏ.',
    content: '### Pháp chế thuê ngoài\n\nSử dụng dịch vụ tư vấn thường xuyên cung cấp sự linh hoạt:\n\n- Rà soát nhanh chóng các hợp đồng trước ký kết.\n- Có sẵn luật sư tham gia cố vấn các cuộc họp HĐQT quan trọng.\n- Cập nhật quy định mới tự động, tránh phạt vi phạm.',
    date: '2026-04-13',
    category: 'Tư vấn pháp luật thường xuyên'
  },

  // Tư vấn dự án đầu tư
  {
    title: 'Phân tích tính khả thi pháp lý của dự án điện năng lượng mặt trời',
    excerpt: 'Các vấn đề pháp lý then chốt nhà đầu tư cần chuẩn bị khi bước vào mảng năng lượng tái tạo.',
    content: '### Dự án Năng lượng\n\nĐầu tư vào năng lượng xanh yêu cầu việc thẩm định khắt khe:\n\n- Quy hoạch điện VIII và vị trí đất.\n- Các thỏa thuận mua bán điện (PPA) với EVN.\n- Đánh giá tác động môi trường chuyên sâu.',
    date: '2026-04-09',
    category: 'Tư vấn dự án đầu tư'
  },

  // Giải quyết tranh chấp
  {
    title: 'Giải quyết tranh chấp thương mại bằng Trọng tài: Nhanh chóng & Bảo mật',
    excerpt: 'Tại sao ngày càng nhiều doanh nghiệp đưa điều khoản giải quyết qua Trọng tài thương mại vào hợp đồng.',
    content: '### Trọng tài Thương mại\n\nƯu điểm của phương thức giải quyết qua Trọng tài:\n\n- **Bảo mật tuyệt đối:** Không xét xử công khai như Tòa án.\n- **Chung thẩm:** Phán quyết của Trọng tài có giá trị chung thẩm và bắt buộc thi hành, không bị kháng cáo.\n- **Tính chuyên môn:** Được chọn trọng tài viên am hiểu ngành nghề.',
    date: '2026-04-08',
    category: 'Giải quyết tranh chấp'
  },
  
  // Dịch vụ giấy phép
  {
    title: 'Quy trình cấp xin Giấy chứng nhận PCCC đối với nhà xưởng',
    excerpt: 'Các tiêu chuẩn phòng cháy chữa cháy bắt buộc đối với cơ sở sản xuất, kho bãi.',
    content: '### Giấy chứng nhận PCCC\n\nAn toàn cháy nổ là yếu tố sống còn:\n\n- Lập hồ sơ thiết kế xây dựng bản vẽ PCCC.\n- Thẩm duyệt thiết kế PCCC.\n- Lắp đặt theo bản vẽ và tiến hành nghiệm thu.\n- Cấp giấy phép đưa công trình vào sử dụng.',
    date: '2026-04-07',
    category: 'Dịch vụ giấy phép'
  },

  // Tư vấn hợp đồng
  {
    title: 'Các điều khoản phạt vi phạm thông dụng trong hợp đồng thương mại',
    excerpt: 'Mức phạt tối đa 8% và cách cài cắm các điều khoản bồi thường thiệt hại để nắm phần thắng khi có tranh chấp.',
    content: '### Phạt vi phạm Hợp đồng\n\nKết hợp khéo léo giữa Phạt vi phạm và Bồi thường thiệt hại:\n\n- Luật Thương mại giới hạn mức phạt tối đa không quá 8% phần giá trị nghĩa vụ bị vi phạm.\n- Phải có điều khoản ghi nhận về bồi thường phạt để dễ dàng yêu cầu bồi thường toàn bộ thiệt hại thực tế phát sinh.',
    date: '2026-04-06',
    category: 'Tư vấn hợp đồng'
  }
];

newsItems.forEach(item => {
  stmt.run(item.title, item.excerpt, item.content, item.date, item.category);
});

console.log("Seeded " + newsItems.length + " more related news.");
