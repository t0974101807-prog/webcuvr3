import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Gavel, Leaf, Globe, Briefcase, Scale, ArrowUpRight, Shield, Users, FileText, Heart, Download, Upload, Loader2, X, ChevronRight, ChevronDown } from 'lucide-react';
import { navigateTo, fetchApi } from '../utils/api';

// Map icon names to components
const iconMap: Record<string, any> = {
  Leaf, Globe, Building2, Briefcase, Gavel, Scale, Shield, Users, FileText, Heart
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

interface ServicesProps {
  isLoggedIn?: boolean;
  user?: any;
  onLoginClick?: () => void;
}

const fallbackActivitiesData: Record<string, { description: string; content: string; icon: string }> = {
  "Doanh nghiệp": {
    description: "Tư vấn thành lập, mua bán sáp nhập, thay đổi đăng ký kinh doanh và tái cấu trúc doanh nghiệp.",
    icon: "Building2",
    content: `### Tư vấn Pháp luật Doanh nghiệp Toàn diện

Chúng tôi đồng hành cùng sự phát triển của doanh nghiệp từ khi khởi sự đến khi vận hành ổn định và phát triển bền vững:

- **Tái cấu trúc & Quản trị**: Tư vấn xây dựng điều lệ, quy chế quản lý nội bộ, phân chia quyền hạn đại diện pháp luật, phòng ngừa tranh chấp nội bộ cổ đông.
- **Thủ tục đăng ký kinh doanh**: Thay đổi ngành nghề, tăng/giảm vốn điều lệ, chuyển đổi loại hình doanh nghiệp, chuyển nhượng cổ phần/vốn góp.
- **Thư ký pháp lý thường xuyên**: Giải đáp các vướng mắc phát sinh trong giao dịch hàng ngày, rà soát văn bản hành chính.`
  },
  "Vụ việc dân sự": {
    description: "Bảo vệ quyền lợi trong các tranh chấp đất đai, thừa kế di sản, đòi nợ và bồi thường thiệt hại ngoài hợp đồng.",
    icon: "Scale",
    content: `### Giải quyết Vụ việc Dân sự & Đất đai

Hỗ trợ khách hàng bảo vệ quyền và lợi ích hợp pháp tối đa trong các giao dịch và tranh chấp dân sự:

- **Thừa kế & Di chúc**: Tư vấn soạn thảo di chúc hợp pháp, phân chia di sản thừa kế theo pháp luật hoặc di chúc, giải quyết tranh chấp di sản thừa kế phức tạp.
- **Giao dịch dân sự**: Tư vấn tính pháp lý của hợp đồng đặt cọc, chuyển nhượng, tặng cho, thế chấp tài sản, đòi lại nhà đất cho mượn, cho ở nhờ.
- **Bồi thường thiệt hại**: Tư vấn và đại diện yêu cầu bồi thường thiệt hại về tính mạng, sức khỏe, danh dự, tài sản do hành vi trái pháp luật gây ra.`
  },
  "Lao động": {
    description: "Tư vấn hợp đồng lao động, nội quy lao động, giải quyết tranh chấp sa thải trái luật.",
    icon: "Briefcase",
    content: `### Tư vấn Pháp luật Lao động & Nhân sự

Kiến tạo môi trường làm việc hài hòa, đúng luật cho doanh nghiệp và bảo vệ quyền lợi hợp pháp cho người lao động:

- **Xây dựng hệ thống quy chế**: Soạn thảo hợp đồng lao động, thỏa ước lao động tập thể, nội quy lao động đăng ký đúng quy định với Sở Lao động.
- **Giải quyết tranh chấp lao động**: Đại diện đàm phán hoặc tham gia tố tụng trong các vụ án đơn phương chấm dứt hợp đồng lao động, kỷ luật sa thải, bồi thường chi phí đào tạo.
- **Giấy phép lao động**: Thực hiện thủ tục cấp mới, gia hạn Giấy phép lao động (Work Permit) và Thẻ tạm trú cho người lao động nước ngoài tại Việt Nam.`
  },
  "Mua bán & Sáp nhập": {
    description: "Thực hiện rà soát pháp lý (due diligence), đàm phán và soạn thảo hợp đồng M&A.",
    icon: "Building2",
    content: `### Dịch vụ Tư vấn Mua bán & Sáp nhập (M&A)

Cung cấp giải pháp chiến lược và kiểm soát rủi ro pháp lý toàn diện cho các giao dịch mua bán, sáp nhập doanh nghiệp:

- **Thẩm định pháp lý (Due Diligence)**: Rà soát toàn bộ hồ sơ đất đai, tài sản, dự án, lao động, thuế và các nghĩa vụ nợ của công ty mục tiêu trước khi chuyển nhượng.
- **Soạn thảo & Đàm phán hợp đồng**: Thiết kế cấu trúc giao dịch an toàn, soạn thảo hợp đồng mua bán cổ phần (SPA), hợp đồng cổ đông (SHA).
- **Thủ tục pháp lý hoàn tất**: Thực hiện thủ tục chuyển nhượng, đăng ký cổ đông mới tại cơ quan nhà nước có thẩm quyền.`
  },
  "Hôn nhân và Gia đình": {
    description: "Tư vấn thủ tục ly hôn thuận tình, ly hôn đơn phương, phân chia tài sản chung và giành quyền nuôi con.",
    icon: "Heart",
    content: `### Luật sư Tư vấn Hôn nhân & Gia đình

Giải pháp pháp lý nhân văn, bảo mật thông tin tuyệt đối cho gia đình bạn:

- **Phân chia tài sản**: Tư vấn thỏa thuận tài sản chung/riêng trước khi kết hôn, phân chia tài sản chung của vợ chồng trong thời kỳ hôn nhân hoặc khi ly hôn.
- **Ly hôn nhanh gọn**: Soạn thảo đơn từ, chuẩn bị hồ sơ ly hôn thuận tình hoặc đơn phương, rút ngắn tối đa thời gian giải quyết tại Tòa án.
- **Giành quyền nuôi con & Cấp dưỡng**: Luật sư tham gia tố tụng chứng minh điều kiện nuôi con tốt nhất, yêu cầu mức cấp dưỡng hợp lý theo pháp luật.`
  },
  "Tư vấn hợp đồng": {
    description: "Soạn thảo, rà soát và đàm phán các loại hợp đồng kinh tế, thương mại, hợp đồng hợp tác đầu tư.",
    icon: "FileText",
    content: `### Dịch vụ Soạn thảo & Rà soát Hợp đồng Chuyên nghiệp

Hợp đồng chặt chẽ là lá chắn pháp lý vững chắc nhất phòng ngừa rủi ro cho cá nhân và doanh nghiệp:

- **Soạn thảo hợp đồng theo yêu cầu**: Hợp đồng mua bán hàng hóa, hợp đồng dịch vụ, hợp đồng hợp tác kinh doanh (BCC), hợp đồng thuê mặt bằng...
- **Rà soát hợp đồng (Contract Review)**: Phát hiện và cảnh báo các điều khoản mập mờ, bất lợi hoặc vô hiệu theo pháp luật, đề xuất điều khoản thay thế tối ưu.
- **Hỗ trợ đàm phán**: Tham gia cùng khách hàng đàm phán với đối tác để đạt được các thỏa thuận có lợi nhất về mặt pháp lý và thương mại.`
  },
  "Đầu tư trong & ngoài nước": {
    description: "Hỗ trợ nhà đầu tư nước ngoài xin cấp IRC, thành lập doanh nghiệp FDI và tư vấn đầu tư ra nước ngoài.",
    icon: "Globe",
    content: `### Tư vấn Đầu tư Trong nước & Nước ngoài

Cầu nối pháp lý hỗ trợ các nhà đầu tư hiện thực hóa dòng vốn an toàn và hiệu quả:

- **Đầu tư trực tiếp nước ngoài (FDI)**: Xin cấp Giấy chứng nhận đăng ký đầu tư (IRC), đăng ký doanh nghiệp (ERC), thuê đất khu công nghiệp, xin ưu đãi đầu tư.
- **Đầu tư gián tiếp**: Hỗ trợ nhà đầu tư nước ngoài góp vốn, mua cổ phần của doanh nghiệp Việt Nam theo đúng quy định pháp luật.
- **Đầu tư ra nước ngoài**: Tư vấn thủ tục chuyển tiền hợp pháp ra nước ngoài, xin giấy chứng nhận đầu tư ra nước ngoài cho doanh nghiệp Việt Nam.`
  },
  "Bất động sản": {
    description: "Thẩm định pháp lý dự án bất động sản, chuyển nhượng quyền sử dụng đất, tách thửa và cấp sổ đỏ.",
    icon: "Building2",
    content: `### Pháp lý Bất động sản & Nhà đất

Đồng hành bảo vệ giá trị tài sản lớn của khách hàng trước các rủi ro pháp lý phức tạp:

- **Thẩm định pháp lý dự án**: Kiểm tra quy hoạch, giấy phép xây dựng, điều kiện bán nhà hình thành trong tương lai của chủ đầu tư trước khi đặt mua.
- **Chuyển nhượng & Sang tên**: Soạn hồ sơ và thực hiện trọn gói thủ tục sang tên sổ đỏ, sổ hồng, thừa kế, tặng cho quyền sử dụng đất.
- **Hỗ trợ thủ tục đất đai**: Tách thửa, hợp thửa, chuyển mục đích sử dụng đất (từ đất nông nghiệp lên đất thổ cư), cấp sổ đỏ lần đầu.`
  },
  "Tranh tụng": {
    description: "Luật sư tranh tụng bảo vệ quyền lợi tại Tòa án các cấp và Trọng tài Thương mại quốc tế.",
    icon: "Gavel",
    content: `### Luật sư Tranh tụng Chuyên nghiệp tại Tòa án & Trọng tài

Đội ngũ Luật sư tố tụng bản lĩnh, giàu kinh nghiệm thực tế đấu tranh bảo vệ công lý:

- **Thu thập chứng cứ**: Nghiên cứu hồ sơ, phân tích điểm mạnh/yếu, định hướng chiến lược tranh tụng tối ưu nhất cho khách hàng.
- **Đại diện giải quyết tranh chấp**: Luật sư đại diện tham gia thương lượng, hòa giải giúp các bên đạt được thỏa thuận trước khi phải khởi kiện.
- **Bảo vệ tại phiên tòa**: Cử Luật sư bào chữa cho bị can/bị cáo trong án Hình sự; bảo vệ quyền lợi cho đương sự trong án Dân sự, Đất đai, Thương mại.`
  },
  "Hàng hải & Vận chuyển": {
    description: "Tư vấn tranh chấp vận đơn, tổn thất hàng hóa hàng hải, bảo hiểm và bắt giữ tàu biển.",
    icon: "Globe",
    content: `### Tư vấn Pháp luật Hàng hải & Vận tải Quốc tế

Hỗ trợ pháp lý chuyên biệt cho các hãng tàu, công ty logistics, bảo hiểm và chủ hàng:

- **Tranh chấp hợp đồng vận chuyển**: Giải quyết tranh chấp liên quan đến vận đơn (B/L), hợp đồng thuê tàu, chậm trễ giao hàng, tổn thất hàng hóa.
- **Tổn thất & Tai nạn hàng hải**: Tư vấn giải quyết đâm va tàu biển, cứu hộ hàng hải, tổn thất chung (General Average) và bảo hiểm thân tàu.
- **Bắt giữ tàu biển**: Thực hiện thủ tục yêu cầu Tòa án bắt giữ tàu biển để bảo đảm giải quyết khiếu nại hàng hải hoặc thả tàu bị bắt giữ.`
  },
  "Thuế": {
    description: "Tư vấn lập kế hoạch thuế tối ưu, đại diện giải trình quyết toán thuế và giải quyết khiếu nại thuế.",
    icon: "Shield",
    content: `### Tư vấn Pháp luật Thuế & Tối ưu Chi phí Thuế

Giúp doanh nghiệp chủ động kiểm soát rủi ro về thuế và thực hiện nghĩa vụ tài chính hiệu quả nhất:

- **Hoạch định kế hoạch thuế**: Tư vấn áp dụng ưu đãi thuế TNDN, thuế suất GTGT cho các dự án mới, tối ưu cơ cấu chi phí hợp lý được trừ.
- **Hỗ trợ thanh tra thuế**: Rà soát trước sổ sách kế toán, phát hiện rủi ro, cùng doanh nghiệp giải trình số liệu trực tiếp với cơ quan thuế.
- **Khiếu nại về thuế**: Đại diện thực hiện thủ tục khiếu nại các quyết định truy thu thuế, xử phạt hành chính về thuế không đúng quy định pháp luật.`
  },
  "Di trú & Visa": {
    description: "Tư vấn thủ tục làm thẻ tạm trú, giấy phép lao động, visa định cư kết hôn nước ngoài.",
    icon: "Globe",
    content: `### Dịch vụ Di trú, Visa & Thẻ tạm trú

Hỗ trợ thủ tục xuất nhập cảnh cho công dân nước ngoài và công dân Việt Nam nhanh chóng, đúng quy định:

- **Visa & Thẻ tạm trú (TRC)**: Xin cấp thẻ tạm trú thời hạn từ 2 đến 5 năm cho nhà đầu tư nước ngoài, chuyên gia nước ngoài làm việc tại Việt Nam.
- **Hợp pháp hóa lãnh sự**: Thực hiện thủ tục dịch thuật công chứng, hợp pháp hóa lãnh sự các giấy tờ nước ngoài để sử dụng tại Việt Nam.
- **Di trú định cư**: Tư vấn hồ sơ bảo lãnh định cư, visa kết hôn, visa du học các nước Châu Âu, Mỹ, Úc, Nhật Bản.`
  },
  "Hộ tịch": {
    description: "Thủ tục làm giấy khai sinh quá hạn, khai sinh có yếu tố nước ngoài, nhận cha mẹ con.",
    icon: "Heart",
    content: `### Tư vấn Thủ tục Hộ tịch & Nhân thân

Đảm bảo đầy đủ các quyền nhân thân cơ bản cho công dân một cách nhanh gọn và chuẩn xác:

- **Khai sinh có yếu tố nước ngoài**: Hỗ trợ đăng ký khai sinh cho con có cha hoặc mẹ là người nước ngoài, trẻ em sinh ra tại nước ngoài về cư trú.
- **Xác định quan hệ nhân thân**: Thực hiện thủ tục nhận cha, mẹ, con, đăng ký khai sinh muộn, thay đổi họ tên, cải chính hộ tịch trên giấy tờ gốc.
- **Đăng ký kết hôn**: Tư vấn thủ tục kết hôn giữa người Việt Nam và người nước ngoài, đảm bảo tính hợp pháp của các giấy tờ cần thiết.`
  }
};

export default function Services({ isLoggedIn = false, user, onLoginClick }: ServicesProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);

  const fetchServices = () => {
    fetchApi(`/api/services?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setServices(data);
        } else {
          console.error('Failed to fetch services: expected array, got:', data);
          setServices([]);
        }
      })
      .catch(err => console.error('Failed to fetch services', err));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const handleOpenActivity = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string }>;
      const title = customEvent.detail?.title;
      if (!title) return;

      const found = services.find(s => s.title.toLowerCase() === title.toLowerCase());
      if (found) {
        setViewingService(found);
      } else {
        const fallback = fallbackActivitiesData[title];
        if (fallback) {
          setViewingService({
            id: -999,
            title: title,
            description: fallback.description,
            content: fallback.content,
            icon: fallback.icon,
          });
        }
      }
    };

    window.addEventListener('open-activity-modal', handleOpenActivity);
    return () => window.removeEventListener('open-activity-modal', handleOpenActivity);
  }, [services]);

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
      const service = services.find(s => s.id === selectedServiceId);
      if (!service) throw new Error('Service not found');

      const updateRes = await fetchApi(`/api/services/${selectedServiceId}`, {
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
      fetchServices();
      
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
    <section id="services" className="py-16 md:py-24 bg-[#FAF9F6] text-slate-800 relative overflow-hidden border-y border-slate-100">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.doc,.docx"
      />

      {/* Background Texture */}
      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(rgba(140,98,57,0.15) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-[var(--color-primary)] font-semibold uppercase tracking-[0.2em] mb-4 text-xs sm:text-sm"
            >
              Lĩnh Vực Hoạt Động
            </motion.h2>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-800 leading-tight"
            >
              <span className="text-slate-800">Đa Ngành & Chuyên Môn</span>
            </motion.h3>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-base sm:text-lg max-w-md leading-relaxed"
          >
            Với kinh nghiệm phong phú, chúng tôi đồng hành cùng doanh nghiệp và cá nhân trong nhiều lĩnh vực khác nhau.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(showAll ? services : services.slice(0, 6)).map((service, index) => {
            const IconComponent = iconMap[service.icon] || Leaf;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (index % 6) * 0.1 }}
                viewport={{ once: true }}
                onClick={() => navigateTo(`/linh-vuc-hoat-dong?item=${encodeURIComponent(service.title)}`)}
                className="group relative bg-white border border-slate-200/80 p-8 rounded-2xl hover:bg-slate-50/20 hover:border-[var(--color-primary)]/20 transition-all duration-500 flex flex-col cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(140,98,57,0.08)] active:scale-95"
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
                      className="p-2 rounded-lg bg-slate-100 hover:bg-[var(--color-accent)] text-slate-600 hover:text-white transition-all"
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
                
                <h4 className="text-2xl font-serif font-bold text-slate-800 mb-4 group-hover:text-[var(--color-primary)] transition-colors">
                  {service.title}
                </h4>
                
                <p className="text-slate-500 leading-relaxed group-hover:text-slate-600 transition-colors mb-6 flex-grow">
                  {service.description}
                </p>

                {/* View Details Button */}
                <button
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-[var(--color-primary)] transition-colors mb-4 group/btn w-fit"
                >
                  <span>Xem chi tiết</span>
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                
                {service.file_url && (
                  <div className="mt-auto pt-4 border-t border-slate-100 w-full">
                    <a 
                      onClick={(e) => e.stopPropagation()}
                      href={service.file_url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white text-[var(--color-primary)] transition-all font-medium text-sm group/link"
                    >
                      <Download size={16} className="group-hover/link:animate-bounce" />
                      <span className="truncate max-w-[200px]">{service.file_name || 'Tải tài liệu'}</span>
                    </a>
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--color-primary)] group-hover:w-full transition-all duration-500 ease-out"></div>
              </motion.div>
            );
          })}
        </div>

        {services.length > 6 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 px-6 py-3 border border-slate-200 hover:border-[var(--color-primary)]/40 text-slate-700 hover:text-[var(--color-primary)] font-bold rounded-xl transition-all shadow-sm hover:shadow-md bg-white text-sm cursor-pointer"
            >
              <span>{showAll ? 'Thu gọn bớt' : 'Xem thêm tất cả lĩnh vực'}</span>
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
