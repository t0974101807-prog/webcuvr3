import { fetchApi } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useContactSettings } from '../hooks/useContactSettings';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  Loader2, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Instagram, 
  X, 
  FileText, 
  CheckCircle, 
  FileUp, 
  Building2, 
  MessageSquare, 
  ShieldAlert,
  ThumbsUp,
  Award,
  Globe,
  ChevronRight,
  ExternalLink,
  Smartphone
} from 'lucide-react';

interface BranchOffice {
  id: string;
  name: string;
  region: 'south' | 'north' | 'central';
  address: string;
  phone: string;
  email: string;
  mapUrl?: string;
  isHeadquarters?: boolean;
  latitude?: number;
  longitude?: number;
}

const ACC_BRANCHES: BranchOffice[] = [
  {
    id: 'hcm-hq',
    name: "Trụ sở chính TP. Hồ Chí Minh",
    region: 'south',
    address: "Lầu 8, Tòa nhà số 520 Cách Mạng Tháng Tám, Phường 11, Quận 3, TP. Hồ Chí Minh",
    phone: "1900 3330",
    email: "info@anhduonglaw.vn",
    mapUrl: "https://maps.google.com/?q=520+Cach+Mang+Thang+Tam+Quan+3+TP+HCM",
    isHeadquarters: true
  },
  {
    id: 'hn',
    name: "Chi nhánh Hà Nội",
    region: 'north',
    address: "Tầng 13, Toà nhà MD Complex, Số 68 Nguyễn Cơ Thạch, KĐT Mỹ Đình 1, Phường Cầu Diễn, Quận Nam Từ Liêm, Hà Nội",
    phone: "1900 3330",
    email: "info@anhduonglaw.vn",
    mapUrl: "https://maps.google.com/?q=68+Nguyen+Co+Thach+Nam+Tu+Liem+Ha+Noi",
    isHeadquarters: false
  },
  {
    id: 'dn',
    name: "Chi nhánh Đà Nẵng",
    region: 'central',
    address: "Tầng 3, Số 229 Lê Duẩn, Phường Tân Chính, Quận Thanh Khê, TP. Đà Nẵng",
    phone: "1900 3330",
    email: "info@anhduonglaw.vn",
    mapUrl: "https://maps.google.com/?q=229+Le+Duan+Thanh+Khe+Da+Nang",
    isHeadquarters: false
  },
  {
    id: 'bd',
    name: "Chi nhánh Bình Dương",
    region: 'south',
    address: "Số 30/10 Đường Nguyễn Du, KP. Nhị Đồng 1, Phường Dĩ An, TP. Dĩ An, Bình Dương",
    phone: "1900 3330",
    email: "info@anhduonglaw.vn",
    mapUrl: "https://maps.google.com/?q=Nguyen+Du+Di+An+Binh+Duong",
    isHeadquarters: false
  },
  {
    id: 'dnai',
    name: "Chi nhánh Đồng Nai",
    region: 'south',
    address: "Số 262/2 Cách Mạng Tháng Tám, Phường Thanh Bình, TP. Biên Hòa, Đồng Nai",
    phone: "1900 3330",
    email: "info@anhduonglaw.vn",
    mapUrl: "https://maps.google.com/?q=262+CMT8+Thanh+Binh+Bien+Hoa+Dong+Nai",
    isHeadquarters: false
  },
  {
    id: 'ct',
    name: "Chi nhánh Cần Thơ",
    region: 'south',
    address: "Số 120-122 Đường Ngô Quyền, Phường An Hoà, Quận Ninh Kiều, Cần Thơ",
    phone: "1900 3330",
    email: "info@anhduonglaw.vn",
    mapUrl: "https://maps.google.com/?q=120+Ngo+Quyen+An+Hoa+Ninh+Kieu+Can+Tho",
    isHeadquarters: false
  },
  {
    id: 'vt',
    name: "Chi nhánh Vũng Tàu",
    region: 'south',
    address: "Số 516 Cách Mạng Tháng Tám, Phường Phước Trung, TP. Bà Rịa, Vũng Tàu",
    phone: "1900 3330",
    email: "info@anhduonglaw.vn",
    isHeadquarters: false
  },
  {
    id: 'hp',
    name: "Chi nhánh Hải Phòng",
    region: 'north',
    address: "Số 30 Đường Trần Nguyên Hãn, Phường Lê Chân, TP. Hải Phòng",
    phone: "1900 3330",
    email: "info@anhduonglaw.vn",
    isHeadquarters: false
  }
];

const VIETNAM_PROVINCES = [
  "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bình Dương", "Đồng Nai", "Cần Thơ", "Hải Phòng", "Bà Rịa - Vũng Tàu",
  "An Giang", "Bạc Liêu", "Bắc Giang", "Bắc Kạn", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Phước", "Bình Thuận",
  "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh",
  "Hải Dương", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng",
  "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

export default function Contact() {
  const { settings } = useContactSettings();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    province: 'TP. Hồ Chí Minh',
    interest: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeRegion, setActiveRegion] = useState<'all' | 'south' | 'north' | 'central'>('all');
  const [branches, setBranches] = useState<BranchOffice[]>(ACC_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState<BranchOffice>(ACC_BRANCHES[0]);

  useEffect(() => {
    const loadOffices = async () => {
      try {
        const response = await fetchApi('/api/offices');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((o: any) => ({
              id: o.id.toString(),
              name: o.name,
              region: o.region,
              address: o.address,
              phone: o.phone,
              email: o.email,
              mapUrl: o.map_url || '',
              isHeadquarters: !!o.is_headquarters,
              latitude: o.latitude,
              longitude: o.longitude
            }));
            setBranches(mapped);
            const hq = mapped.find((b: any) => b.isHeadquarters) || mapped[0];
            setSelectedBranch(hq);
          }
        }
      } catch (err) {
        console.error("Error loading offices:", err);
      }
    };
    loadOffices();
  }, []);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Submit Contact Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        content: `[LIÊN HỆ ÁNH DƯƠNG LAW - Địa bàn: ${formData.province}]\nLĩnh vực cần tư vấn: ${formData.interest || 'Chưa chọn'}\nNội dung chi tiết:\n${formData.message}`,
        file_url: null,
        file_name: null
      };

      const response = await fetchApi('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          phone: '',
          email: '',
          province: 'TP. Hồ Chí Minh',
          interest: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGoogleMapsDirectionUrl = (branch: BranchOffice) => {
    if (branch.latitude && branch.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`;
    }
    if (branch.mapUrl && branch.mapUrl.startsWith('http')) {
      return branch.mapUrl;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(branch.address + ', ' + branch.name)}`;
  };

  // Filter Branches by selected region
  const filteredBranches = branches.filter(branch => {
    if (activeRegion === 'all') return true;
    return branch.region === activeRegion;
  });

  return (
    <section id="contact" className="py-20 md:py-28 bg-[#FAF9F6] relative overflow-hidden">
      {/* Visual background aesthetics */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--color-accent)]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Page Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-[var(--color-accent)] font-semibold uppercase tracking-[0.25em] mb-4 text-xs sm:text-sm">
            Thông tin liên hệ
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] mb-6 leading-tight">
            Liên Hệ Với Ánh Dương Law
          </h3>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Hệ thống {branches.length} chi nhánh trên toàn quốc luôn sẵn sàng hỗ trợ, phục vụ quý khách hàng nhanh chóng, tận tâm và chuyên nghiệp nhất.
          </p>
        </div>

        {/* Hotlines Overview Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Phone size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">Hotline Tư Vấn Luật</span>
              <a href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} className="text-lg sm:text-xl font-bold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors">{settings.hotline_consult}</a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Smartphone size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">Hotline Kế Toán Thuế</span>
              <a href={`tel:${settings.hotline_accounting.replace(/\s+/g, '')}`} className="text-lg sm:text-xl font-bold text-emerald-600 hover:opacity-80 transition-opacity">{settings.hotline_accounting}</a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">Góp Ý Chất Lượng DV</span>
              <a href={`tel:${settings.hotline_feedback.replace(/\s+/g, '')}`} className="text-lg sm:text-xl font-bold text-amber-600 hover:opacity-80 transition-opacity">{settings.hotline_feedback}</a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mail size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block">Email Liên Hệ</span>
              <a href={`mailto:${settings.email}`} className="text-sm sm:text-base font-bold text-slate-700 hover:text-[var(--color-primary)] transition-colors break-all">{settings.email}</a>
            </div>
          </div>
        </div>

        {/* Middle Main Content Split: Form & Branches Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* LEFT: Premium Advisory Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-text-dark)] p-6 sm:p-8 text-white">
              <h4 className="text-2xl font-serif font-bold mb-2">Đăng Ký Tư Vấn Pháp Lý Trực Tuyến</h4>
              <p className="text-white/80 text-xs sm:text-sm">
                Hãy để lại yêu cầu tư vấn, đội ngũ Luật sư và Chuyên viên pháp lý của Ánh Dương Law sẽ trực tiếp liên hệ và phản hồi sớm nhất trong vòng 15 - 30 phút.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {submitStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-12 space-y-6"
                  >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle size={40} className="stroke-[3px]" />
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-2xl font-serif font-bold text-slate-800">Gửi Yêu Cầu Thành Công!</h5>
                      <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                        Cảm ơn quý khách đã tin tưởng và gửi yêu cầu tư vấn đến Ánh Dương Law. Thông tin của quý khách đã được chuyển trực tiếp đến Luật sư chuyên trách.
                      </p>
                      <p className="text-[var(--color-accent)] text-xs font-bold">
                        Hệ thống sẽ liên hệ lại qua điện thoại trong vòng 15 phút tới.
                      </p>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={() => setSubmitStatus('idle')}
                        className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Gửi thêm yêu cầu khác
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {submitStatus === 'error' && (
                      <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                        <X size={16} className="text-red-500" />
                        Có lỗi xảy ra trong quá trình truyền dữ liệu. Vui lòng thử lại hoặc gọi Hotline để hỗ trợ tức thời.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Name */}
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Họ và tên quý khách *</label>
                        <input
                          type="text"
                          required
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all text-slate-800"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Số điện thoại liên hệ *</label>
                        <input
                          type="tel"
                          required
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Ví dụ: 090xxxxxxx"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Email */}
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Địa chỉ Email</label>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="example@gmail.com"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all text-slate-800"
                        />
                      </div>

                      {/* Province Select */}
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Tỉnh / Thành phố của bạn *</label>
                        <select
                          id="province"
                          value={formData.province}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all text-slate-700 cursor-pointer appearance-none font-medium"
                        >
                          {VIETNAM_PROVINCES.map((prov) => (
                            <option key={prov} value={prov}>{prov}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Interest / Practice Area */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Lĩnh vực pháp lý cần tư vấn *</label>
                      <select
                        id="interest"
                        required
                        value={formData.interest}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all text-slate-700 cursor-pointer appearance-none font-medium"
                      >
                        <option value="">-- Chọn lĩnh vực cần hỗ trợ --</option>
                        <option value="Tư vấn Doanh nghiệp, Đầu tư">Dịch vụ Doanh nghiệp & Đầu tư nước ngoài</option>
                        <option value="Kế toán, Quyết toán thuế">Dịch vụ Kế toán & Quyết toán Thuế Doanh nghiệp</option>
                        <option value="Giấy phép con, Chứng nhận">Hồ sơ Giấy phép con (ATVSTP, Lữ hành, PCCC,...)</option>
                        <option value="Đất đai, Nhà đất">Tranh chấp Đất đai & Thủ tục Bất động sản</option>
                        <option value="Hôn nhân, Gia đình, Dân sự">Hôn nhân gia đình, Thừa kế, Hợp đồng Dân sự</option>
                        <option value="Hình sự, Tranh tụng, Tòa án">Tranh tụng Hình sự, đại diện tố tụng tại Tòa án</option>
                        <option value="Khác">Lĩnh vực pháp lý khác</option>
                      </select>
                    </div>

                    {/* Message Content */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Nội dung yêu cầu tư vấn chi tiết *</label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Quý khách vui lòng mô tả tóm tắt hoàn cảnh sự việc, nhu cầu và câu hỏi cụ thể để Luật sư có đầy đủ cơ sở phân tích và phản hồi chính xác..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all resize-none text-slate-800 leading-relaxed"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Đang gửi yêu cầu...
                        </>
                      ) : (
                        <>
                          Gửi yêu cầu tư vấn ngay
                          <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Branches Directory List (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-serif font-bold text-slate-800 flex items-center gap-2">
                  <Building2 size={20} className="text-[var(--color-accent)]" />
                  Mạng lưới Chi nhánh Ánh Dương Law
                </h4>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {branches.length} văn phòng
                </span>
              </div>

              {/* Region Selector Tablets */}
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-1">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'south', label: 'Miền Nam' },
                  { id: 'north', label: 'Miền Bắc' },
                  { id: 'central', label: 'Miền Trung' }
                ].map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => setActiveRegion(reg.id as any)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeRegion === reg.id
                        ? 'bg-white text-[var(--color-primary)] shadow-sm'
                        : 'text-gray-400 hover:text-slate-700'
                    }`}
                  >
                    {reg.label}
                  </button>
                ))}
              </div>

              {/* Scrollable Branch Cards list */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredBranches.map((branch) => {
                  const isSelected = selectedBranch.id === branch.id;
                  return (
                    <div
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden group ${
                        isSelected 
                          ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)] shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {branch.isHeadquarters && (
                        <span className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider scale-90">
                          Hội sở chính
                        </span>
                      )}
                      
                      <h5 className={`font-bold text-sm mb-1.5 transition-colors ${
                        isSelected ? 'text-[var(--color-primary)]' : 'text-slate-800 group-hover:text-[var(--color-primary)]'
                      }`}>
                        {branch.name}
                      </h5>

                      <p className="text-gray-500 text-xs leading-relaxed flex items-start gap-1.5 mb-2.5">
                        <MapPin size={13} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{branch.address}</span>
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100/70 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 hover:text-[var(--color-primary)]">
                          <Phone size={12} className="text-gray-400" />
                          {branch.phone}
                        </span>
                        
                        <a 
                          href={getGoogleMapsDirectionUrl(branch)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors"
                        >
                          Chỉ đường <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Branch Highlight Action Details Card */}
            {selectedBranch && (
              <motion.div
                key={selectedBranch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-primary)] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-x-1/3 -translate-y-1/3" />
                
                <h5 className="font-serif font-bold text-lg mb-4 text-white">
                  Đang Xem: {selectedBranch.name}
                </h5>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-[var(--color-accent)] shrink-0 mt-1" />
                    <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                      {selectedBranch.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-[var(--color-accent)] shrink-0" />
                    <a href={`tel:${selectedBranch.phone.replace(/\s+/g, '')}`} className="text-white/90 text-xs sm:text-sm font-bold hover:underline">
                      Hotline hỗ trợ: {selectedBranch.phone}
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[var(--color-accent)] shrink-0" />
                    <a href={`mailto:${selectedBranch.email}`} className="text-white/90 text-xs sm:text-sm font-medium hover:underline break-all">
                      {selectedBranch.email}
                    </a>
                  </div>

                  <div className="pt-2">
                    <a
                      href={getGoogleMapsDirectionUrl(selectedBranch)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Mở bằng Google Maps <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>

        {/* Quality Commitment Section */}
        <div className="mt-20 border-t border-slate-200/60 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h4 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 mb-3">
              Cam Kết Dịch Vụ Của Ánh Dương Law
            </h4>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
              Chúng tôi xem việc bảo vệ tối đa lợi ích hợp pháp của quý khách hàng là sứ mệnh cao cả nhất trong hành trình phát triển của doanh nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <ThumbsUp className="text-amber-500" size={24} />,
                title: "Tận Tâm Phục Vụ",
                desc: "Luôn đặt lợi ích của khách hàng làm trọng tâm, lắng nghe sâu sắc để đưa ra giải pháp pháp lý tối ưu nhất cho từng trường hợp."
              },
              {
                icon: <Award className="text-blue-500" size={24} />,
                title: "Chuyên Nghiệp Hàng Đầu",
                desc: "Đội ngũ Luật sư nhiều năm kinh nghiệm, kỹ năng tranh biện xuất sắc, am hiểu sâu sắc quy trình thực tế của từng địa phương."
              },
              {
                icon: <Globe className="text-emerald-500" size={24} />,
                title: "Báo Giá Trọn Gói",
                desc: "Minh bạch chi phí dịch vụ ngay từ đầu, ký kết hợp đồng dịch vụ pháp lý rõ ràng và cam kết tuyệt đối không phát sinh phụ phí."
              }
            ].map((commit, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-600">
                  {commit.icon}
                </div>
                <h5 className="font-serif font-bold text-slate-800 text-base">{commit.title}</h5>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{commit.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
