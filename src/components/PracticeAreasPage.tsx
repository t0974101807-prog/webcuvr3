import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Building2, Scale, Briefcase, Heart, FileText, Globe, Gavel, Shield, 
  ChevronRight, Phone, ArrowRight, Download, Calendar, ArrowUpRight, Loader2, BookOpen
} from 'lucide-react';
import { navigateTo, fetchApi } from '../utils/api';
import { useContactSettings } from '../hooks/useContactSettings';

const iconMap: Record<string, any> = {
  Building2, Scale, Briefcase, Heart, FileText, Globe, Gavel, Shield
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

export default function PracticeAreasPage() {
  const [activeAreaId, setActiveAreaId] = useState<string>('');
  const [areas, setAreas] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);
  const { settings } = useContactSettings();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. Fetch practice areas (database table `services`)
    fetchApi(`/api/services?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        let finalAreas: Service[] = [];
        if (Array.isArray(data) && data.length > 0) {
          finalAreas = [...data];
        } else {
          // Add fallback items if the database/API is empty
          Object.keys(fallbackActivitiesData).forEach(key => {
            const fb = fallbackActivitiesData[key];
            finalAreas.push({
              id: -Math.abs(key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)), // Unique negative id
              title: key,
              description: fb.description,
              content: fb.content,
              icon: fb.icon
            });
          });
        }

        setAreas(finalAreas);
        setLoading(false);

        // 2. Pre-select item based on URL query parameter
        const params = new URLSearchParams(window.location.search);
        const itemParam = params.get('item');
        if (itemParam) {
          const match = finalAreas.find(a => a.title.toLowerCase() === itemParam.toLowerCase());
          if (match) {
            setActiveAreaId(match.title);
            return;
          }
        }
        if (finalAreas.length > 0) {
          setActiveAreaId(finalAreas[0].title);
        }
      })
      .catch(err => {
        console.error("Failed to load services in PracticeAreasPage:", err);
        // Fallback exclusively to static data
        const fallbackList = Object.keys(fallbackActivitiesData).map((key, i) => ({
          id: -i - 1,
          title: key,
          description: fallbackActivitiesData[key].description,
          content: fallbackActivitiesData[key].content,
          icon: fallbackActivitiesData[key].icon
        }));
        setAreas(fallbackList);
        setLoading(false);

        const params = new URLSearchParams(window.location.search);
        const itemParam = params.get('item');
        if (itemParam) {
          const match = fallbackList.find(a => a.title.toLowerCase() === itemParam.toLowerCase());
          if (match) {
            setActiveAreaId(match.title);
            return;
          }
        }
        if (fallbackList.length > 0) {
          setActiveAreaId(fallbackList[0].title);
        }
      });
  }, []);

  // Update URL and fetch related news whenever active area changes
  const activeArea = areas.find(a => a.title === activeAreaId);

  useEffect(() => {
    if (!activeArea) return;
    
    // Set query string in URL without full page reload
    const newUrl = `${window.location.pathname}?item=${encodeURIComponent(activeArea.title)}`;
    window.history.replaceState({}, '', newUrl);

    // Fetch related news articles
    fetchApi(`/api/news?category=${encodeURIComponent(activeArea.title)}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRelatedNews(data.filter((n: any) => n.related_service === activeArea.title || (n.category || '').toLowerCase() === activeArea.title.toLowerCase()));
        }
      })
      .catch(err => console.error('Failed to fetch related news:', err));
  }, [activeAreaId, areas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="text-[var(--color-primary)] animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Đang tải lĩnh vực hoạt động...</p>
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
                <span className="text-[var(--color-accent)]">Lĩnh vực hoạt động</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                Lĩnh Vực Hoạt Động Chuyên Môn
              </h1>
              <p className="text-white/80 text-sm md:text-base max-w-2xl leading-relaxed">
                Chúng tôi cung cấp các giải pháp pháp lý đa ngành cho cá nhân, hộ kinh doanh và các doanh nghiệp trong nước và quốc tế.
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center gap-3">
              <a href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-900 font-bold rounded-xl shadow-lg transition-all text-sm">
                <Phone size={16} className="fill-transparent stroke-[2.5]" />
                <span>{settings.hotline_consult}</span>
              </a>
              <button onClick={() => navigateTo('/lien-he')} className="px-6 py-3 border border-white/20 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm">
                Yêu cầu tư vấn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dynamic Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Sidebar Navigation (3 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 max-h-[75vh] overflow-y-auto flex flex-col gap-1 scrollbar-thin">
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest block">Danh mục chuyên môn</span>
              </div>
              {areas.map((area) => {
                const Icon = iconMap[area.icon] || Scale;
                const isSelected = activeAreaId === area.title;
                return (
                  <button
                    key={area.title}
                    onClick={() => setActiveAreaId(area.title)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs xl:text-sm font-bold transition-all w-full text-left cursor-pointer ${
                      isSelected 
                        ? 'bg-[var(--color-primary)] text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon size={16} className={isSelected ? 'text-[var(--color-accent)]' : 'text-slate-400'} />
                      <span className="truncate">{area.title}</span>
                    </div>
                    <ChevronRight size={14} className={`opacity-60 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:block bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
              <h4 className="font-serif font-bold text-base mb-2 text-white">Cần giải đáp gấp?</h4>
              <p className="text-white/75 text-xs leading-relaxed mb-4">
                Đội ngũ luật sư Ánh Dương Law sẵn sàng hỗ trợ bạn tháo gỡ mọi khó khăn về mặt pháp lý 24/7.
              </p>
              <button 
                onClick={() => navigateTo('/lien-he')}
                className="w-full py-2.5 bg-white text-[var(--color-primary)] hover:bg-[var(--color-accent)] hover:text-slate-900 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Gửi thông tin liên hệ</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* RIGHT: Content Views (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {activeArea && (
                <motion.div
                  key={activeArea.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-md border border-slate-200/50 space-y-8 min-h-[500px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                        {React.createElement(iconMap[activeArea.icon] || Scale, { size: 20 })}
                      </div>
                      <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.2em] block">
                        Chi tiết lĩnh vực
                      </span>
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)]">
                      {activeArea.title}
                    </h2>
                    <div className="h-1 w-24 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  {/* Summary / Description */}
                  <p className="text-slate-600 font-semibold text-sm md:text-base border-l-4 border-[var(--color-accent)] pl-4 italic leading-relaxed">
                    {activeArea.description}
                  </p>

                  {/* Markdown Content */}
                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
                    <ReactMarkdown>
                      {activeArea.content || "Nội dung chi tiết đang được cập nhật..."}
                    </ReactMarkdown>
                  </div>

                  {/* Attachment Document (if exists) */}
                  {activeArea.file_url && (
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FileText size={16} className="text-[var(--color-primary)]" />
                        <span>Tài liệu / Văn bản hướng dẫn đi kèm:</span>
                      </h4>
                      <a 
                        href={activeArea.file_url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white text-[var(--color-primary)] transition-all font-semibold text-sm group"
                      >
                        <Download size={16} className="group-hover:animate-bounce" />
                        <span>{activeArea.file_name || 'Tải tài liệu chi tiết'}</span>
                      </a>
                    </div>
                  )}

                  {/* Related News section */}
                  {relatedNews.length > 0 && (
                    <div className="pt-8 border-t border-slate-100 space-y-4">
                      <h4 className="text-lg font-serif font-bold text-[var(--color-primary)] flex items-center gap-2">
                        <BookOpen size={18} className="text-[var(--color-accent)]" />
                        <span>Bài viết & Bản tin Pháp lý liên quan</span>
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
