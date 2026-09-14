import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Building2, Scale, Briefcase, Heart, FileText, Globe, Gavel, Shield, 
  ChevronRight, Phone, ArrowRight, Download, Calendar, ArrowUpRight, Loader2, BookOpen, Users, Leaf
} from 'lucide-react';
import { navigateTo, fetchApi } from '../utils/api';
import { useContactSettings } from '../hooks/useContactSettings';

const iconMap: Record<string, any> = {
  Building2, Scale, Briefcase, Heart, FileText, Globe, Gavel, Shield, Users, Leaf
};

interface Service {
  id: number;
  title: string;
  description: string;
  content?: string;
  icon: string;
  file_url?: string;
  file_name?: string;
}

const fallbackServicesData: Record<string, { description: string; content: string; icon: string }> = {
  "Dịch vụ luật sư": {
    description: "Tư vấn pháp lý thường xuyên, giải quyết tranh chấp dân sự, thương mại và hình sự.",
    icon: "Gavel",
    content: `### Dịch vụ Luật sư Chuyên nghiệp & Uy tín

Chúng tôi cung cấp đội ngũ Luật sư giàu kinh nghiệm thực tế, sẵn sàng hỗ trợ khách hàng giải quyết mọi vướng mắc pháp lý:

- **Tư vấn pháp lý thường xuyên**: Đồng hành cùng cá nhân và doanh nghiệp trong hoạt động hàng ngày.
- **Tham gia tố tụng**: Bào chữa trong các vụ án Hình sự; Bảo vệ quyền và lợi ích hợp pháp trong các vụ án Dân sự, Đất đai, Hôn nhân gia đình, Kinh doanh thương mại, Lao động...
- **Đại diện ngoài tố tụng**: Thực hiện đàm phán, thương lượng, làm việc với các đối tác và cơ quan Nhà nước có thẩm quyền.
- **Soạn thảo văn bản**: Đơn khởi kiện, đơn khiếu nại, các loại hợp đồng và văn bản pháp lý khác.`
  },
  "Thành lập công ty": {
    description: "Trọn gói thủ tục đăng ký kinh doanh, chuẩn bị hồ sơ thành lập doanh nghiệp, khắc dấu và khai thuế ban đầu.",
    icon: "Building2",
    content: `### Dịch vụ Thành lập Công ty Trọn gói

Giải pháp tối ưu cho người khởi nghiệp, cam kết nhanh chóng, uy tín và không phát sinh chi phí:

- **Tư vấn trước thành lập**: Lựa chọn loại hình doanh nghiệp phù hợp (TNHH, Cổ phần, Doanh nghiệp tư nhân...), đặt tên công ty, chọn ngành nghề kinh doanh, vốn điều lệ và địa chỉ trụ sở.
- **Soạn thảo hồ sơ**: Hoàn thiện toàn bộ hồ sơ đăng ký doanh nghiệp theo quy định.
- **Nộp hồ sơ & Nhận kết quả**: Đại diện khách hàng nộp hồ sơ tại Sở Kế hoạch và Đầu tư, nhận Giấy chứng nhận đăng ký doanh nghiệp.
- **Thủ tục sau thành lập**: Khắc dấu tròn công ty, công bố mẫu dấu, đăng ký tài khoản ngân hàng, mua chữ ký số, hóa đơn điện tử, kê khai thuế ban đầu.`
  },
  "Giấy phép kinh doanh": {
    description: "Xin cấp các loại giấy phép con, giấy phép hoạt động ngành nghề có điều kiện.",
    icon: "FileText",
    content: `### Xin cấp Giấy phép kinh doanh & Giấy phép con

Hỗ trợ doanh nghiệp hoàn thiện các điều kiện pháp lý để hoạt động trong các ngành nghề kinh doanh có điều kiện:

- **Giấy phép lữ hành**: Lữ hành nội địa, lữ hành quốc tế.
- **Giấy phép giáo dục**: Thành lập trung tâm ngoại ngữ, trung tâm tin học, tư vấn du học.
- **Giấy phép vận tải**: Phù hiệu xe, giấy phép kinh doanh vận tải bằng xe ô tô.
- **Giấy phép hoạt động khác**: Giấy phép bán lẻ rượu, thuốc lá, giấy phép phòng cháy chữa cháy, cam kết môi trường.`
  },
  "Đăng ký hộ kinh doanh": {
    description: "Hỗ trợ đăng ký thành lập hộ kinh doanh cá thể tại các quận, huyện nhanh chóng, thủ tục đơn giản.",
    icon: "Users",
    content: `### Đăng ký thành lập Hộ kinh doanh cá thể

Phương án kinh doanh phù hợp cho quy mô nhỏ, gia đình, thủ tục tinh gọn và tiết kiệm thuế:

- **Tư vấn đặt tên**: Đảm bảo tên hộ kinh doanh không trùng lặp và tuân thủ pháp luật.
- **Tư vấn ngành nghề**: Lựa chọn ngành nghề kinh doanh phù hợp với năng lực hoạt động.
- **Soạn hồ sơ**: Chuẩn bị đơn đăng ký, bản sao giấy tờ cá nhân và các tài liệu liên quan khác.
- **Đại diện nộp hồ sơ**: Nộp hồ sơ tại UBND quận/huyện và bàn giao Giấy đăng ký hộ kinh doanh cùng mã số thuế tận nơi.`
  },
  "Đăng ký mã số thuế": {
    description: "Cấp mới mã số thuế cá nhân, doanh nghiệp và hướng dẫn sử dụng hóa đơn điện tử.",
    icon: "Shield",
    content: `### Dịch vụ Đăng ký mã số thuế cá nhân & doanh nghiệp

Đảm bảo nghĩa vụ thuế được thực hiện đúng hạn, chính xác và chuyên nghiệp:

- **Mã số thuế cá nhân**: Đăng ký mã số thuế cho người lao động, người có thu nhập chịu thuế.
- **Mã số thuế doanh nghiệp**: Cấp mã số thuế tích hợp trên Giấy chứng nhận đăng ký kinh doanh.
- **Mã số thuế phụ thuộc**: Đăng ký mã số thuế cho người phụ thuộc để giảm trừ gia cảnh.
- **Khai thuế ban đầu**: Thiết lập hồ sơ thuế ban đầu cho doanh nghiệp mới thành lập.`
  },
  "Quyết toán thuế": {
    description: "Thực hiện quyết toán thuế thu nhập cá nhân, thuế thu nhập doanh nghiệp định kỳ hoặc khi giải thể.",
    icon: "FileText",
    content: `### Dịch vụ Quyết toán thuế Chuyên nghiệp

Hỗ trợ doanh nghiệp và cá nhân rà soát, nộp hồ sơ quyết toán thuế đúng quy định pháp luật:

- **Quyết toán thuế TNCN**: Dành cho cá nhân có nhiều nguồn thu nhập, người nước ngoài tại Việt Nam hoặc ủy quyền qua tổ chức chi trả.
- **Quyết toán thuế TNDN**: Lập báo cáo quyết toán thuế thu nhập doanh nghiệp hàng năm, tối ưu chi phí hợp lý.
- **Hỗ trợ thanh tra thuế**: Chuẩn bị hồ sơ sổ sách, đại diện giải trình số liệu với cơ quan thuế khi có thanh tra, kiểm tra.`
  },
  "Dịch vụ làm visa": {
    description: "Tư vấn thủ tục và làm visa nhập cảnh, xuất cảnh, gia hạn visa, thẻ tạm trú cho người nước ngoài.",
    icon: "Globe",
    content: `### Dịch vụ Visa & Thẻ tạm trú

Hỗ trợ thủ tục xuất nhập cảnh cho người Việt Nam ra nước ngoài và người nước ngoài vào Việt Nam:

- **Visa du lịch, công tác**: Tư vấn xin visa các nước Châu Âu, Mỹ, Úc, Nhật Bản, Hàn Quốc...
- **Công văn nhập cảnh**: Xin công văn cho người nước ngoài vào Việt Nam làm việc, du lịch.
- **Gia hạn Visa**: Thực hiện gia hạn thời gian tạm trú hợp pháp tại Việt Nam.
- **Thẻ tạm trú & Giấy phép lao động**: Làm thẻ tạm trú (2-5 năm), Giấy phép lao động cho chuyên gia, lao động kỹ thuật nước ngoài.`
  },
  "Dịch vụ ly hôn": {
    description: "Tư vấn ly hôn thuận tình, đơn phương, phân chia tài sản và giành quyền nuôi con nhanh chóng, bảo mật.",
    icon: "Heart",
    content: `### Dịch vụ Luật sư Giải quyết Ly hôn nhanh, bảo mật

Đóng hành và bảo vệ tối đa quyền lợi hợp pháp của bạn trong giai đoạn khó khăn:

- **Ly hôn thuận tình**: Tư vấn soạn hồ sơ, nộp đơn và hỗ trợ giải quyết nhanh gọn tại Tòa án trong vòng 7 - 15 ngày, hạn chế số lần lên Tòa.
- **Ly hôn đơn phương**: Luật sư hỗ trợ thu thập chứng cứ chứng minh mâu thuẫn trầm trọng, bảo vệ quyền lợi khi tranh chấp quyền nuôi con và phân chia tài sản chung.
- **Ly hôn có yếu tố nước ngoài**: Giải quyết thủ tục ly hôn khi một bên ở nước ngoài hoặc là người nước ngoài.`
  },
  "Tạm ngừng kinh doanh": {
    description: "Hỗ trợ làm thủ tục tạm ngừng hoạt động kinh doanh cho doanh nghiệp theo quy định mới nhất.",
    icon: "Briefcase",
    content: `### Thủ tục Tạm ngừng hoạt động kinh doanh

Hỗ trợ doanh nghiệp tạm dừng hoạt động hợp pháp để tái cấu trúc hoặc giải quyết khó khăn tài chính:

- **Tư vấn thời hạn**: Giải thích quy định về thời gian tạm ngừng tối đa, quyền và nghĩa vụ thuế trong thời gian tạm ngừng.
- **Soạn hồ sơ**: Chuẩn bị thông báo tạm ngừng, nghị quyết/quyết định của Hội đồng thành viên/Hội đồng quản trị.
- **Nộp hồ sơ**: Đại diện nộp hồ sơ lên Phòng Đăng ký kinh doanh và nhận thông báo chấp thuận tạm ngừng.`
  },
  "Kiểm nghiệm sản phẩm": {
    description: "Hỗ trợ lấy mẫu, gửi kiểm nghiệm và nhận kết quả kiểm nghiệm sản phẩm tại các trung tâm uy tín.",
    icon: "Leaf",
    content: `### Dịch vụ Kiểm nghiệm sản phẩm chuyên nghiệp

Kiểm nghiệm chất lượng sản phẩm là bước bắt buộc để thực hiện công bố chất lượng sản phẩm ra thị trường:

- **Tư vấn chỉ tiêu**: Lên chỉ tiêu kiểm nghiệm phù hợp cho từng loại sản phẩm (thực phẩm, mỹ phẩm, thức ăn chăn nuôi, hàng tiêu dùng) để tiết kiệm chi phí mà vẫn đúng luật.
- **Gửi mẫu**: Đại diện gửi mẫu đến các trung tâm kiểm nghiệm được Nhà nước chỉ định (Eurofins, Quatest...).
- **Nhận kết quả**: Theo dõi quá trình, nhận phiếu kết quả kiểm nghiệm đạt chuẩn.`
  },
  "Lý lịch tư pháp": {
    description: "Xin cấp phiếu Lý lịch tư pháp số 1, số 2 cho công dân Việt Nam và người nước ngoài nhanh gọn.",
    icon: "Shield",
    content: `### Dịch vụ Làm Lý lịch tư pháp nhanh toàn quốc

Hỗ trợ khách hàng xin phiếu Lý lịch tư pháp số 1 và số 2 nhanh chóng, không cần xếp hàng chờ đợi:

- **Lý lịch tư pháp số 1**: Phục vụ nhu cầu xin việc làm, đi học, làm thủ tục hành chính...
- **Lý lịch tư pháp số 2**: Phục vụ mục đích đi định cư, kết hôn với người nước ngoài, làm visa định cư...
- **Đặc biệt**: Hỗ trợ làm nhanh cho người đang ở nước ngoài, người ngoại tỉnh, người nước ngoài từng cư trú tại Việt Nam.`
  },
  "Báo cáo tài chính": {
    description: "Lập báo cáo tài chính cuối năm, rà soát sổ sách kế toán, báo cáo thuế cho doanh nghiệp.",
    icon: "FileText",
    content: `### Dịch vụ Lập Báo cáo tài chính cuối năm

Đảm bảo hệ thống sổ sách kế toán minh bạch, chính xác và tuân thủ đúng chuẩn mực kế toán Việt Nam:

- **Thu thập dữ liệu**: Rà soát chứng từ đầu vào, đầu ra, tờ khai thuế đã nộp.
- **Xử lý số liệu**: Định khoản kế toán, lập bảng cân đối phát sinh, báo cáo kết quả hoạt động kinh doanh, lưu chuyển tiền tệ, thuyết minh báo cáo tài chính.
- **Nộp báo cáo**: Nộp báo cáo tài chính đến cơ quan thuế, cơ quan thống kê đúng thời hạn pháp luật.`
  },
  "Hoàn thuế thu nhập cá nhân": {
    description: "Hỗ trợ hồ sơ xin hoàn thuế thu nhập cá nhân cho người lao động, chuyên gia nước ngoài.",
    icon: "Scale",
    content: `### Dịch vụ Hoàn thuế thu nhập cá nhân (TNCN)

Hỗ trợ người lao động lấy lại số tiền thuế TNCN đã nộp thừa một cách nhanh chóng, đúng luật:

- **Rà soát chứng từ**: Kiểm tra chứng từ khấu trừ thuế, thư xác nhận thu nhập, hồ sơ người phụ thuộc.
- **Tính toán số thuế hoàn**: Tính chính xác số thuế được hoàn hoặc số thuế nộp thêm.
- **Nộp hồ sơ quyết toán**: Đại diện nộp hồ sơ lên cơ quan thuế quản lý và theo dõi nhận tiền hoàn thuế về tài khoản cá nhân.`
  },
  "Đăng ký kinh doanh": {
    description: "Thay đổi nội dung đăng ký doanh nghiệp như tăng vốn, thay đổi đại diện pháp luật, chuyển địa chỉ.",
    icon: "Building2",
    content: `### Thay đổi nội dung Đăng ký kinh doanh

Hỗ trợ doanh nghiệp cập nhật các thay đổi trong quá trình hoạt động kinh doanh theo quy định mới:

- **Tăng/Giảm vốn điều lệ**: Thay đổi cơ cấu góp vốn của các thành viên, cổ đông.
- **Thay đổi đại diện pháp luật**: Thay đổi Giám đốc, Chủ tịch công ty.
- **Thay đổi trụ sở, tên công ty**: Chuyển địa chỉ cùng quận hoặc khác quận, tỉnh thành.
- **Thay đổi ngành nghề**: Thêm mới hoặc lược bỏ các ngành nghề kinh doanh.`
  },
  "Công bố sản phẩm": {
    description: "Thực hiện thủ tục tự công bố, công bố chất lượng sản phẩm thực phẩm, mỹ phẩm nhập khẩu và trong nước.",
    icon: "Leaf",
    content: `### Dịch vụ Tự công bố & Công bố chất lượng sản phẩm

Đảm bảo sản phẩm của doanh nghiệp đủ điều kiện lưu hành hợp pháp trên thị trường Việt Nam:

- **Thực phẩm thường & Nhập khẩu**: Soạn hồ sơ tự công bố sản phẩm, nộp lên cơ quan quản lý an toàn thực phẩm.
- **Thực phẩm chức năng, bảo vệ sức khỏe**: Đăng ký công bố sản phẩm tại Cục An toàn thực phẩm - Bộ Y tế.
- **Mỹ phẩm**: Công bố mỹ phẩm sản xuất trong nước và mỹ phẩm nhập khẩu.`
  },
  "Báo cáo thuế": {
    description: "Dịch vụ kế toán thuế trọn gói hàng tháng, hàng quý, nộp tờ khai thuế đúng hạn, chính xác.",
    icon: "FileText",
    content: `### Dịch vụ Kế toán & Báo cáo thuế trọn gói

Giải pháp tiết kiệm chi phí tối đa cho doanh nghiệp vừa và nhỏ, không cần thuê kế toán nội bộ:

- **Kê khai thuế hàng tháng/quý**: Lập và nộp tờ khai thuế GTGT, thuế TNCN, tình hình sử dụng hóa đơn.
- **Cân đối chi phí**: Tư vấn hóa đơn hợp lệ, hợp pháp, cân đối doanh thu - chi phí tối ưu nhất cho doanh nghiệp.
- **Sổ sách kế toán**: Thiết lập hệ thống sổ sách kế toán theo quy chuẩn, in và lưu trữ hồ sơ cẩn thận.`
  },
  "Giấy chứng nhận vệ sinh an toàn thực phẩm": {
    description: "Tư vấn set up cơ sở và xin cấp giấy chứng nhận đủ điều kiện an toàn thực phẩm cho nhà hàng, hộ kinh doanh.",
    icon: "Leaf",
    content: `### Xin Giấy phép Vệ sinh an toàn thực phẩm (ATTP)

Đảm bảo nhà hàng, quán ăn, cơ sở sản xuất thực phẩm hoạt động đúng luật, tránh bị phạt nặng:

- **Khảo sát thực tế**: Khảo sát mặt bằng, tư vấn cách bố trí bếp theo nguyên tắc một chiều.
- **Tập huấn & Khám sức khỏe**: Hỗ trợ thủ tục đăng ký tập huấn kiến thức ATTP và khám sức khỏe cho chủ cơ sở và nhân viên.
- **Soạn & Nộp hồ sơ**: Chuẩn bị hồ sơ xin cấp giấy chứng nhận đủ điều kiện gửi cơ quan chức năng.
- **Đón đoàn thẩm định**: Hướng dẫn cơ sở chuẩn bị sổ sách, mẫu lưu thực phẩm để đón đoàn thẩm định đạt kết quả tốt nhất.`
  },
  "Giải thể công ty": {
    description: "Thực hiện thủ tục đóng mã số thuế, quyết toán thuế giải thể, trả con dấu và hoàn tất giải thể doanh nghiệp.",
    icon: "Building2",
    content: `### Dịch vụ Giải thể Doanh nghiệp trọn gói

Hỗ trợ doanh nghiệp hoàn tất thủ tục chấm dứt hoạt động một cách an toàn, đúng pháp luật, tránh nợ đọng thuế:

- **Quyết toán thuế giải thể**: Đây là bước khó khăn nhất, chúng tôi sẽ hỗ trợ dọn dẹp sổ sách kế toán, nộp hồ sơ quyết toán thuế giải thể với cơ quan thuế.
- **Đóng mã số thuế**: Nhận thông báo khóa mã số thuế từ cơ quan thuế quản lý.
- **Giải thể tại Sở KH&ĐT**: Nộp hồ sơ xin giải thể doanh nghiệp tại Phòng Đăng ký kinh doanh và nhận quyết định giải thể chính thức.`
  },
  "Đầu tư nước ngoài": {
    description: "Tư vấn thành lập công ty có vốn nước ngoài (FDI), điều chỉnh giấy chứng nhận đầu tư, xin visa đầu tư.",
    icon: "Globe",
    content: `### Tư vấn Đầu tư nước ngoài tại Việt Nam

Hỗ trợ toàn diện cho nhà đầu tư nước ngoài thiết lập và vận hành doanh nghiệp FDI tại Việt Nam:

- **Thành lập công ty FDI**: Xin cấp Giấy chứng nhận đăng ký đầu tư (IRC) và Giấy chứng nhận đăng ký doanh nghiệp (ERC).
- **Góp vốn, mua cổ phần**: Tư vấn và thực hiện thủ tục cho nhà đầu tư nước ngoài mua lại phần vốn góp của công ty Việt Nam.
- **Thay đổi dự án đầu tư**: Hỗ trợ điều chỉnh quy mô, tăng vốn, thay đổi địa điểm dự án đầu tư.`
  },
  "Làm giấy khai sinh": {
    description: "Tư vấn thủ tục đăng ký khai sinh quá hạn, khai sinh có yếu tố nước ngoài, đăng ký nhận cha mẹ con.",
    icon: "Heart",
    content: `### Tư vấn thủ tục Đăng ký khai sinh & Nhận cha mẹ con

Hỗ trợ pháp lý tận tâm để đảm bảo quyền nhân thân cho trẻ em:

- **Đăng ký khai sinh có yếu tố nước ngoài**: Khi cha hoặc mẹ là người nước ngoài, trẻ em sinh ra tại Việt Nam hoặc nước ngoài.
- **Khai sinh quá hạn**: Tư vấn thủ tục, giấy tờ thay thế khi đăng ký khai sinh muộn.
- **Nhận cha, mẹ, con**: Thực hiện thủ tục nhận con ngoài giá thú, xét nghiệm ADN chứng minh quan hệ huyết thống để làm giấy khai sinh hợp lệ.`
  }
};

export default function ServicesPage() {
  const [activeServiceId, setActiveServiceId] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);
  const { settings } = useContactSettings();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. Fetch legal services (database table `legal_services`)
    fetchApi(`/api/legal-services?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        let finalServices: Service[] = [];
        if (Array.isArray(data) && data.length > 0) {
          finalServices = [...data];
        } else {
          // Add fallback items if the database/API is empty
          Object.keys(fallbackServicesData).forEach(key => {
            const fb = fallbackServicesData[key];
            finalServices.push({
              id: -Math.abs(key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)), // Unique negative id
              title: key,
              description: fb.description,
              content: fb.content,
              icon: fb.icon
            });
          });
        }

        setServices(finalServices);
        setLoading(false);

        // 2. Pre-select item based on URL query parameter
        const params = new URLSearchParams(window.location.search);
        const itemParam = params.get('item');
        if (itemParam) {
          const match = finalServices.find(s => s.title.toLowerCase() === itemParam.toLowerCase());
          if (match) {
            setActiveServiceId(match.title);
            return;
          }
        }
        if (finalServices.length > 0) {
          setActiveServiceId(finalServices[0].title);
        }
      })
      .catch(err => {
        console.error("Failed to load legal-services in ServicesPage:", err);
        // Fallback exclusively to static data
        const fallbackList = Object.keys(fallbackServicesData).map((key, i) => ({
          id: -i - 1,
          title: key,
          description: fallbackServicesData[key].description,
          content: fallbackServicesData[key].content,
          icon: fallbackServicesData[key].icon
        }));
        setServices(fallbackList);
        setLoading(false);

        const params = new URLSearchParams(window.location.search);
        const itemParam = params.get('item');
        if (itemParam) {
          const match = fallbackList.find(s => s.title.toLowerCase() === itemParam.toLowerCase());
          if (match) {
            setActiveServiceId(match.title);
            return;
          }
        }
        if (fallbackList.length > 0) {
          setActiveServiceId(fallbackList[0].title);
        }
      });
  }, []);

  // Update URL and fetch related news whenever active service changes
  const activeService = services.find(s => s.title === activeServiceId);

  useEffect(() => {
    if (!activeService) return;
    
    // Set query string in URL without full page reload
    const newUrl = `${window.location.pathname}?item=${encodeURIComponent(activeService.title)}`;
    window.history.replaceState({}, '', newUrl);

    // Fetch related news articles
    fetchApi(`/api/news?category=${encodeURIComponent(activeService.title)}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRelatedNews(data.filter((n: any) => n.related_service === activeService.title || (n.category || '').toLowerCase() === activeService.title.toLowerCase()));
        }
      })
      .catch(err => console.error('Failed to fetch related news:', err));
  }, [activeServiceId, services]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="text-[var(--color-primary)] animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Đang tải danh sách dịch vụ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen">
      {/* Page Hero Header */}
      <div className="relative bg-[var(--color-primary)] text-white py-20 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,var(--color-accent),transparent_60%)]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <nav className="flex items-center justify-center lg:justify-start gap-2 text-xs md:text-sm text-white/60 mb-3 font-semibold uppercase tracking-wider">
                <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigateTo('/')}>Trang chủ</span>
                <ChevronRight size={12} />
                <span className="text-[var(--color-accent)]">Dịch vụ</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                Dịch Vụ Pháp Lý Trọn Gói
              </h1>
              <p className="text-white/80 text-sm md:text-base max-w-2xl leading-relaxed">
                Ánh Dương Law cung cấp trọn gói các dịch vụ pháp lý từ đăng ký doanh nghiệp, giấy phép hoạt động đến kế toán thuế và giải quyết ly hôn.
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center gap-3">
              <a href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-900 font-bold rounded-xl shadow-lg transition-all text-sm">
                <Phone size={16} className="fill-transparent stroke-[2.5]" />
                <span>{settings.hotline_consult}</span>
              </a>
              <button onClick={() => navigateTo('/lien-he')} className="px-6 py-3 border border-white/20 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm">
                Yêu cầu dịch vụ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dynamic Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Sidebar Navigation (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 max-h-[75vh] overflow-y-auto flex flex-col gap-1 scrollbar-thin">
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block">Danh sách dịch vụ pháp lý</span>
              </div>
              {services.map((service) => {
                const Icon = iconMap[service.icon] || Scale;
                const isSelected = activeServiceId === service.title;
                return (
                  <button
                    key={service.title}
                    onClick={() => setActiveServiceId(service.title)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs xl:text-sm font-bold transition-all w-full text-left cursor-pointer ${
                      isSelected 
                        ? 'bg-[var(--color-primary)] text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon size={16} className={isSelected ? 'text-[var(--color-accent)]' : 'text-slate-400'} />
                      <span className="truncate">{service.title}</span>
                    </div>
                    <ChevronRight size={14} className={`opacity-60 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:block bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
              <h4 className="font-serif font-bold text-base mb-2 text-white">Bạn cần hỗ trợ ngay?</h4>
              <p className="text-white/75 text-xs leading-relaxed mb-4">
                Nhấn gọi ngay hotline của chúng tôi để gặp trực tiếp Luật sư tư vấn chuyên môn một cách nhanh chóng.
              </p>
              <a 
                href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`}
                className="w-full py-2.5 bg-white text-[var(--color-primary)] hover:bg-[var(--color-accent)] hover:text-slate-900 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Phone size={12} className="fill-transparent stroke-[2.5]" />
                <span>Gọi điện ngay</span>
              </a>
            </div>
          </div>

          {/* RIGHT: Content Views (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {activeService && (
                <motion.div
                  key={activeService.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-md border border-slate-200/50 space-y-8 min-h-[500px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                        {React.createElement(iconMap[activeService.icon] || Scale, { size: 20 })}
                      </div>
                      <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.2em] block">
                        Chi tiết dịch vụ
                      </span>
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)]">
                      {activeService.title}
                    </h2>
                    <div className="h-1 w-24 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  {/* Summary / Description */}
                  <p className="text-slate-600 font-semibold text-sm md:text-base border-l-4 border-[var(--color-accent)] pl-4 italic leading-relaxed">
                    {activeService.description}
                  </p>

                  {/* Markdown Content */}
                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                    <ReactMarkdown>
                      {activeService.content || "Nội dung chi tiết dịch vụ đang được cập nhật..."}
                    </ReactMarkdown>
                  </div>

                  {/* Attachment Document / Form (if exists) */}
                  {activeService.file_url && (
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FileText size={16} className="text-[var(--color-primary)]" />
                        <span>Mẫu tờ khai / Biểu mẫu / Văn bản hướng dẫn đi kèm:</span>
                      </h4>
                      <a 
                        href={activeService.file_url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white text-[var(--color-primary)] transition-all font-semibold text-sm group"
                      >
                        <Download size={16} className="group-hover:animate-bounce" />
                        <span>{activeService.file_name || 'Tải biểu mẫu chi tiết'}</span>
                      </a>
                    </div>
                  )}

                  {/* Related News section */}
                  {relatedNews.length > 0 && (
                    <div className="pt-8 border-t border-slate-100 space-y-4">
                      <h4 className="text-lg font-serif font-bold text-[var(--color-primary)] flex items-center gap-2">
                        <BookOpen size={18} className="text-[var(--color-accent)]" />
                        <span>Tin bài & Hướng dẫn Pháp luật liên quan</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {relatedNews.slice(0, 4).map((newsItem: any) => (
                          <div 
                            key={newsItem.id}
                            onClick={() => {
                              navigateTo('/');
                              setTimeout(() => {
                                const el = document.getElementById('news');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }, 350);
                            }}
                            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-[var(--color-primary)]/20 transition-all cursor-pointer group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mb-2 uppercase">
                                <Calendar size={10} />
                                <span>{new Date(newsItem.created_at || Date.now()).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <h5 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors mb-2">
                                {newsItem.title}
                              </h5>
                              <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                {newsItem.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary)] mt-3 group-hover:text-[var(--color-accent)] transition-colors">
                              <span>Xem bài viết</span>
                              <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
