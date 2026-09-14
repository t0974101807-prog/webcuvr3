import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Gavel, Leaf, Globe, Briefcase, Scale, ArrowUpRight, Shield, Users, FileText, Heart, Download, Upload, Loader2, X, ChevronRight, ChevronDown } from 'lucide-react';
import { navigateTo, fetchApi } from '../utils/api';

// Map icon names to components
const iconMap: Record<string, any> = {
  Leaf, Globe, Building2, Briefcase, Gavel, Scale, Shield, Users, FileText, Heart
};

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

Đồng hành và bảo vệ tối đa quyền lợi hợp pháp của bạn trong giai đoạn khó khăn:

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

interface Service {
  id: number;
  title: string;
  description: string;
  content?: string;
  icon: string;
  file_url?: string;
  file_name?: string;
}

interface LegalServicesProps {
  isLoggedIn?: boolean;
  user?: any;
  onLoginClick?: () => void;
}

export default function LegalServices({ isLoggedIn = false, user, onLoginClick }: LegalServicesProps) {
  const [legalServices, setLegalServices] = useState<Service[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);

  const fetchLegalServices = () => {
    fetchApi(`/api/legal-services?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLegalServices(data);
        } else {
          console.error('Failed to fetch legal services: expected array, got:', data);
          setLegalServices([]);
        }
      })
      .catch(err => console.error('Failed to fetch services', err));
  };

  useEffect(() => {
    fetchLegalServices();
  }, []);

  useEffect(() => {
    if (viewingService) {
      fetchApi(`/api/news?category=${encodeURIComponent(viewingService.title)}&t=${Date.now()}`)
        .then(res => res.json())
        .then(data => setRelatedNews(data.filter((n: any) => n.related_service === viewingService.title)))
        .catch(err => console.error('Failed to fetch related news', err));
    } else {
      setRelatedNews([]);
    }
  }, [viewingService]);

  useEffect(() => {
    const handleOpenService = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string }>;
      const title = customEvent.detail?.title;
      if (!title) return;

      // Check if we have it in active legalServices loaded from database
      const found = legalServices.find(s => s.title.toLowerCase() === title.toLowerCase());
      if (found) {
        setViewingService(found);
      } else {
        // Use fallback data
        const fallback = fallbackServicesData[title];
        if (fallback) {
          setViewingService({
            id: -999, // dummy ID
            title: title,
            description: fallback.description,
            content: fallback.content,
            icon: fallback.icon,
          });
        }
      }
    };

    window.addEventListener('open-service-modal', handleOpenService);
    return () => window.removeEventListener('open-service-modal', handleOpenService);
  }, [legalServices]);

  const handleUploadClick = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || selectedServiceId === null) return;

    // Check file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        alert('Chỉ chấp nhận file PDF hoặc DOCX/DOC.');
        return;
    }

    // Prompt for display name, pre-filled with original file name
    const displayName = window.prompt("Nhập tên hiển thị cho tài liệu:", file.name);
    if (displayName === null) {
      // User cancelled
      if (fileInputRef.current) fileInputRef.current.value = '';
      return; 
    }

    setUploadingId(selectedServiceId);
    
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('image', file); // API expects 'image' field

      const uploadRes = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.imageUrl;
      
      // 2. Update service with file info
      const service = legalServices.find(s => s.id === selectedServiceId);
      if (!service) throw new Error('Service not found');

      const updateRes = await fetchApi(`/api/legal-services/${selectedServiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...service,
          file_url: fileUrl,
          file_name: displayName || file.name // Use the new name
        }),
      });

      if (!updateRes.ok) throw new Error('Update failed');

      // 3. Refresh list
      fetchLegalServices();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Có lỗi xảy ra khi tải file lên.');
    } finally {
      setUploadingId(null);
      setSelectedServiceId(null);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <section id="legal-services" className="py-16 md:py-24 bg-white text-[var(--color-text-dark)] relative overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.doc,.docx"
      />

      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-[var(--color-accent)] font-medium uppercase tracking-[0.2em] mb-4 text-xs sm:text-sm"
            >
              Dịch Vụ
            </motion.h2>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] leading-tight mb-6"
            >
              <span className="text-gray-600">Chuyên Sâu & Toàn Diện</span>
            </motion.h3>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-base sm:text-lg max-w-md leading-relaxed"
          >
            Chúng tôi cung cấp đa dạng các dịch vụ pháp lý, tập trung vào chất lượng 
            và hiệu quả thực tế cho khách hàng.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(showAll ? legalServices : legalServices.slice(0, 6)).map((service, index) => {
            const IconComponent = iconMap[service.icon] || Leaf;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index % 6) * 0.1 }}
                viewport={{ once: true }}
                onClick={() => navigateTo(`/dich-vu?item=${encodeURIComponent(service.title)}`)}
                className="group relative bg-white border border-gray-100 shadow-sm p-8 rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col cursor-pointer active:scale-[0.98]"
              >
                {/* Upload Button for Logged In Users */}
                {isLoggedIn && (
                  <div className="absolute top-4 right-4 z-20">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadClick(service.id);
                      }}
                      disabled={uploadingId === service.id}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-[var(--color-primary)] text-gray-600 hover:text-white transition-all"
                      title="Tải lên tài liệu"
                    >
                      {uploadingId === service.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                    </button>
                  </div>
                )}

                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <ArrowUpRight className="text-[var(--color-accent)]" size={24} />
                </div>
                
                <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] mb-8 group-hover:scale-110 transition-transform duration-500">
                  <IconComponent size={28} />
                </div>
                
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-text-dark)] mb-4">
                  {service.title}
                </h4>
                
                <p className="text-gray-600 leading-relaxed group-hover:text-[var(--color-text-dark)] transition-colors mb-6 flex-grow">
                  {service.description}
                </p>

                {/* View Details Button */}
                <button
                  className="flex items-center gap-2 text-sm text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)] transition-colors mb-4 group/btn w-fit"
                >
                  <span>Xem chi tiết</span>
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                
                {service.file_url && (
                  <div className="mt-auto pt-4 border-t border-gray-100 w-full mt-4">
                    <a 
                      onClick={(e) => e.stopPropagation()}
                      href={service.file_url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-gray-50 hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-primary)] shadow-sm transition-all font-medium text-sm group/link"
                    >
                      <Download size={16} className="group-hover/link:animate-bounce" />
                      <span className="truncate max-w-[200px]">{service.file_name || 'Tải tài liệu'}</span>
                    </a>
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--color-primary)] group-hover:w-full rounded-b-xl transition-all duration-500 ease-out"></div>
              </motion.div>
            );
          })}
        </div>

        {legalServices.length > 6 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 px-6 py-3 border border-slate-200 hover:border-[var(--color-primary)]/40 text-slate-700 hover:text-[var(--color-primary)] font-bold rounded-xl transition-all shadow-sm hover:shadow-md bg-white text-sm cursor-pointer"
            >
              <span>{showAll ? 'Thu gọn bớt' : 'Xem thêm tất cả dịch vụ'}</span>
              <motion.div
                animate={{ rotate: showAll ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={16} />
              </motion.div>
            </button>
          </div>
        )}
      </div>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {viewingService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setViewingService(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-[var(--color-text-dark)] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                    {(() => {
                      const Icon = iconMap[viewingService.icon] || Leaf;
                      return <Icon size={20} />;
                    })()}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-text-dark)] mb-3">{viewingService.title}</h3>
                </div>
                <button 
                  onClick={() => setViewingService(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto">
                <p className="text-lg text-gray-700 font-medium mb-6 italic border-l-4 border-[var(--color-accent)] pl-4">
                  {viewingService.description}
                </p>
                
                <div className="prose prose-lg max-w-none text-gray-600 mb-8">
                  {viewingService.content ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{viewingService.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-600 italic">Nội dung chi tiết đang được cập nhật.</p>
                  )}
                </div>

                {/* Related News */}
                {relatedNews.length > 0 && (
                  <div className="mt-8 border-t border-gray-100 pt-8">
                    <h4 className="text-xl font-bold text-[var(--color-text-dark)] mb-6 flex items-center gap-2">
                      Bài viết liên quan
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {relatedNews.map((news) => (
                        <div key={news.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                          setViewingService(null);
                          const newsSection = document.getElementById('news');
                          if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth' });
                          setTimeout(() => window.dispatchEvent(new CustomEvent('open-news-modal', { detail: news })), 500);
                        }}>
                          {news.file_url && (
                            <img src={news.file_url} alt={news.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                          )}
                          <div className="text-xs text-[var(--color-primary)] font-bold mb-1 uppercase tracking-wider">{news.category}</div>
                          <h5 className="font-bold text-[var(--color-text-dark)] text-base line-clamp-2 mb-2">{news.title}</h5>
                          <p className="text-sm text-gray-600 line-clamp-2">{news.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setViewingService(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
