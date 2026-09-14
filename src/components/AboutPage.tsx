import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Users, Award, Network, Shield, CheckCircle2, 
  Target, ChevronRight, Download, FileText, MapPin, Briefcase, Star, HelpCircle, Phone, Mail, ArrowRight
} from 'lucide-react';
import { navigateTo, fetchApi } from '../utils/api';
import { useContactSettings } from '../hooks/useContactSettings';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'north' | 'central' | 'south'>('all');
  const { settings } = useContactSettings();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Check if there is a specific tab requested in the custom event or query parameter
    const handleOpenAboutTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
    };
    window.addEventListener('open-about-tab', handleOpenAboutTab);
    return () => window.removeEventListener('open-about-tab', handleOpenAboutTab);
  }, []);

  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/api/offices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        }
      })
      .catch(err => console.error("Error loading offices in AboutPage:", err));
  }, []);

  const tabs = [
    { id: 'overview', label: 'Giới thiệu chung', icon: Building2 },
    { id: 'values', label: 'Tầm nhìn - Sứ mệnh', icon: Target },
    { id: 'structure', label: 'Sơ đồ tổ chức', icon: Network },
    { id: 'branches', label: `Hệ thống ${branches.length || '...'} Chi nhánh`, icon: MapPin },
    { id: 'achievements', label: 'Thành tựu & Năng lực', icon: Award },
  ];

  const filteredBranches = branches.filter(b => {
    const nameStr = b.name || '';
    const addrStr = b.address || '';
    const matchesSearch = nameStr.toLowerCase().includes(branchSearch.toLowerCase()) || 
                          addrStr.toLowerCase().includes(branchSearch.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || b.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="bg-[#FAF9F6] min-h-screen">
      {/* Page Hero Header Banner */}
      <div className="relative bg-[var(--color-primary)] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,var(--color-accent),transparent_60%)]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <nav className="flex items-center justify-center lg:justify-start gap-2 text-xs md:text-sm text-white/60 mb-3 font-semibold uppercase tracking-wider">
                <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigateTo('/')}>Trang chủ</span>
                <ChevronRight size={12} />
                <span className="text-[var(--color-accent)]">Giới thiệu</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                Giới Thiệu & Năng Lực Doanh Nghiệp
              </h1>
              <p className="text-white/80 text-sm md:text-base max-w-2xl leading-relaxed">
                Đồng hành cùng hàng vạn doanh nghiệp, bảo vệ tối đa lợi ích hợp pháp của khách hàng trên toàn quốc với tinh thần hành động: Tận tâm, Chuyên nghiệp và Minh bạch.
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center gap-3">
              <a href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-900 font-bold rounded-xl shadow-lg transition-all text-sm">
                <Phone size={16} className="fill-transparent stroke-[2.5]" />
                <span>{settings.hotline_consult}</span>
              </a>
              <button onClick={() => navigateTo('/lien-he')} className="px-6 py-3 border border-white/20 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm">
                Liên hệ ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout with Sticky Left Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar Navigation (3 cols) */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 whitespace-nowrap scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs xl:text-sm font-bold transition-all w-full text-left cursor-pointer ${
                      isSelected 
                        ? 'bg-[var(--color-primary)] text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)]'
                    }`}
                  >
                    <Icon size={16} className={isSelected ? 'text-[var(--color-accent)]' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:block bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
              <h4 className="font-serif font-bold text-base mb-2 text-white">Bảo vệ Pháp lý 24/7</h4>
              <p className="text-white/75 text-xs leading-relaxed mb-4">
                Hãng luật của chúng tôi lấy chất lượng tư vấn và sự tin cậy làm tôn chỉ hàng đầu trong mọi hoạt động.
              </p>
              <button 
                onClick={() => navigateTo('/lien-he')}
                className="w-full py-2.5 bg-white text-[var(--color-primary)] hover:bg-[var(--color-accent)] hover:text-slate-900 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Yêu cầu tư vấn</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Tab Views (9 cols) */}
          <div className="lg:col-span-9 bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-slate-100 min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {/* 1. OVERVIEW VIEW */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.2em] block">Tổng quan doanh nghiệp</span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)]">
                      Công Ty Luật TNHH Ánh Dương
                    </h2>
                    <div className="h-1 w-24 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
                      <p className="font-semibold text-slate-800 border-l-4 border-[var(--color-primary)] pl-4 italic">
                        Ánh Dương Law là hãng luật chuyên nghiệp hàng đầu tại Việt Nam, cung cấp giải pháp pháp lý toàn diện từ doanh nghiệp, đầu tư, kế toán thuế đến giải quyết tranh chấp pháp luật dân sự, hình sự.
                      </p>
                      <p>
                        Với mô hình chuỗi văn phòng pháp lý toàn diện phủ rộng khắp toàn quốc, <strong>Ánh Dương Law</strong> đã không ngừng mở rộng quy mô, hoàn thiện quy trình tư vấn hiện đại nhằm đáp ứng tốt nhất mọi nhu cầu cấp bách của quý khách hàng trên toàn quốc.
                      </p>
                      <p>
                        Với đội ngũ hơn 100 luật sư thành viên, luật sư tư vấn, chuyên gia tài chính kế toán giàu kinh nghiệm, chúng tôi cam kết đem lại cho quý khách hàng những giải pháp an toàn, bền vững và tối ưu nhất về mặt chi phí.
                      </p>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden shadow-md">
                      <img 
                        src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=60&w=800&auto=format&fit=crop" 
                        alt="Ánh Dương Law Office" 
                        className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-1000"
                      />
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl border-l-4 border-[var(--color-accent)] shadow-lg">
                        <p className="font-serif text-2xl font-bold text-[var(--color-primary)]">15+ Năm</p>
                        <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Kinh nghiệm hoạt động vững vàng</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational indicators stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-[var(--color-primary)] font-serif">15+</p>
                      <p className="text-slate-500 text-xs mt-1 font-medium">Năm kinh nghiệm</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-[var(--color-accent)] font-serif">{branches.length}</p>
                      <p className="text-slate-500 text-xs mt-1 font-medium">Chi nhánh phủ rộng</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-[var(--color-primary)] font-serif">100+</p>
                      <p className="text-slate-500 text-xs mt-1 font-medium">Nhân sự chuyên môn</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-3xl font-bold text-[var(--color-primary)] font-serif">20k+</p>
                      <p className="text-slate-500 text-xs mt-1 font-medium">Khách hàng thành công</p>
                    </div>
                  </div>

                  {/* Highlights checklist cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm shrink-0">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Hỗ trợ 24/7 tức thời</h4>
                        <p className="text-slate-500 text-xs mt-1">Đội ngũ luôn túc trực, phản hồi tư vấn sơ bộ trong vòng 15 - 30 phút.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm shrink-0">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Báo giá dịch vụ trọn gói</h4>
                        <p className="text-slate-500 text-xs mt-1">Minh bạch ngân sách ngay đầu, cam kết không phát sinh phụ phí ẩn.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm shrink-0">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Trả kết quả tận nơi miễn phí</h4>
                        <p className="text-slate-500 text-xs mt-1">Hỗ trợ ký hồ sơ tại nhà và trả kết quả tận tay an toàn qua bưu điện.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. VALUES VIEW */}
              {activeTab === 'values' && (
                <motion.div
                  key="values"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.2em] block">Triết lý và Hành trình</span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)]">
                      Tầm Nhìn & Sứ Mệnh Chiến Lược
                    </h2>
                    <div className="h-1 w-24 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary)]/5 rounded-bl-full -z-10 group-hover:bg-[var(--color-primary)]/10 transition-colors" />
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
                        <Target size={24} />
                      </div>
                      <h3 className="font-serif font-bold text-slate-900 text-lg mb-3">Tầm nhìn chiến lược</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        Trở thành biểu tượng pháp lý vững chắc cho niềm tin và sự thành công của doanh nghiệp. Ánh Dương Law hướng tới việc phủ sóng chi nhánh tư vấn tại 100% các tỉnh thành toàn quốc, thiết lập mô hình "Một điểm đến - Ngàn giải pháp pháp lý toàn diện" kết hợp công nghệ hóa quy trình tư vấn.
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-accent)]/5 rounded-bl-full -z-10 group-hover:bg-[var(--color-accent)]/10 transition-colors" />
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] mb-4">
                        <Shield size={24} />
                      </div>
                      <h3 className="font-serif font-bold text-slate-900 text-lg mb-3">Sứ mệnh cốt lõi</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        Sứ mệnh cao cả của chúng tôi là bảo vệ tối đa quyền lợi hợp pháp, giảm thiểu rủi ro pháp lý và tạo tiền đề phát triển bền vững cho doanh nghiệp Việt Nam. Chúng tôi nỗ lực đưa pháp luật đến gần hơn, thân thiện và hữu ích hơn trong đời sống lẫn kinh tế.
                      </p>
                    </div>
                  </div>

                  {/* Core values block */}
                  <div className="border-t border-slate-100 pt-8">
                    <h3 className="font-serif font-bold text-slate-900 text-xl mb-6">4 Giá Trị Cốt Lõi Tác Phong</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 py-1 px-3 rounded-full w-fit">
                          01. TẬN TÂM PHỤC VỤ
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          Đặt vụ việc và sự lo lắng của khách hàng lên trên hết. Tư vấn cặn kẽ, tỉ mỉ và đồng hành vượt qua khó khăn như thể đó là rắc rối của chính mình.
                        </p>
                      </div>

                      <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-primary)] py-1 px-3 rounded-full w-fit">
                          02. TRỌN CHỮ TÍN
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          Nói đi đôi với làm, cam kết rõ ràng về thời gian hoàn thành. Đạo đức nghề nghiệp mẫu mực, tuân thủ tuyệt đối tính trung thực và chính xác.
                        </p>
                      </div>

                      <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 py-1 px-3 rounded-full w-fit">
                          03. CHUYÊN NGHIỆP TỐI ĐA
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          Tác phong nghiêm chỉnh, quy trình tiếp nhận hồ sơ bài bản. Kiến thức pháp lý sâu rộng và phản ứng nhanh chóng trước mọi thay đổi văn bản pháp luật.
                        </p>
                      </div>

                      <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-primary)] py-1 px-3 rounded-full w-fit">
                          04. HIỆU QUẢ THỰC TẾ
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          Hành động hướng đến kết quả cụ thể. Giúp khách hàng vượt qua trở ngại thủ tục pháp lý nhanh nhất với biểu phí kinh tế, tiết kiệm thời gian nhất.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. STRUCTURE VIEW */}
              {activeTab === 'structure' && (
                <motion.div
                  key="structure"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.2em] block">Hệ thống quản trị bộ máy</span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)]">
                      Sơ Đồ Tổ Chức Bộ Máy Hoạt Động
                    </h2>
                    <div className="h-1 w-24 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                    Ánh Dương Law hoạt động theo cơ chế quản trị chuyên nghiệp, phân cấp rõ ràng kết hợp với các hội đồng ban cố vấn chuyên môn, giúp tối ưu hóa tiến độ công việc và kiểm soát chất lượng đầu ra chặt chẽ:
                  </p>

                  {/* Visual org structure tree using CSS classes */}
                  <div className="p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center space-y-6">
                    {/* Top Node */}
                    <div className="w-60 bg-[var(--color-primary)] text-white text-center py-3 px-4 rounded-xl font-serif font-bold text-sm shadow-md border-b-4 border-[var(--color-accent)]">
                      Hội Đồng Thành Viên Sáng Lập
                    </div>

                    {/* Line */}
                    <div className="w-0.5 h-6 bg-slate-300" />

                    {/* Executive Director Node */}
                    <div className="w-60 bg-slate-800 text-white text-center py-3 px-4 rounded-xl font-serif font-bold text-sm shadow-md">
                      Giám Đốc Điều Hành (CEO)
                    </div>

                    {/* Split line */}
                    <div className="w-0.5 h-6 bg-slate-300" />
                    <div className="w-11/12 h-0.5 bg-slate-300 max-w-xl" />

                    {/* Multi columns of departments */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-2">
                      <div className="bg-white border border-slate-150 p-4 rounded-xl text-center shadow-sm hover:border-[var(--color-primary)] transition-all">
                        <Briefcase className="mx-auto text-[var(--color-primary)] mb-2" size={20} />
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Bộ phận Doanh nghiệp</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Đăng ký kinh doanh, giấy phép đầu tư, M&A</p>
                      </div>

                      <div className="bg-white border border-slate-150 p-4 rounded-xl text-center shadow-sm hover:border-[var(--color-primary)] transition-all">
                        <Shield className="mx-auto text-[var(--color-primary)] mb-2" size={20} />
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Bộ phận Tranh tụng</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Luật sư tranh luận, bào chữa tại tòa</p>
                      </div>

                      <div className="bg-white border border-slate-150 p-4 rounded-xl text-center shadow-sm hover:border-[var(--color-primary)] transition-all">
                        <Building2 className="mx-auto text-[var(--color-primary)] mb-2" size={20} />
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Bộ phận Giấy phép con</h4>
                        <p className="text-[10px] text-slate-400 mt-1">ATVSTP, visa lữ hành, công bố sản phẩm</p>
                      </div>

                      <div className="bg-white border border-slate-150 p-4 rounded-xl text-center shadow-sm hover:border-[var(--color-primary)] transition-all">
                        <FileText className="mx-auto text-[var(--color-primary)] mb-2" size={20} />
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Kế toán & Thuế</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Quyết toán thuế doanh nghiệp, hoàn thuế TNCN</p>
                      </div>
                    </div>

                    <div className="text-center pt-4 border-t border-slate-200/50 w-full">
                      <p className="text-xs text-slate-400 font-medium italic">
                        *Cơ cấu phân ban giúp chuyên biệt hóa dịch vụ và tăng trưởng tốc độ giải quyết vụ việc toàn mạng lưới.*
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 4. BRANCHES VIEW */}
              {activeTab === 'branches' && (
                <motion.div
                  key="branches"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.2em] block">Sẵn sàng phục vụ tức thời</span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)]">
                      Hệ Thống {branches.length} Chi Nhánh Toàn Quốc
                    </h2>
                    <div className="h-1 w-24 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tự hào sở hữu mạng lưới {branches.length} văn phòng tư vấn dịch vụ pháp lý trọn gói phủ rộng cả ba miền Bắc - Trung - Nam, Ánh Dương Law giải quyết mọi trở ngại rào cản địa lý và hành chính công tiện lợi nhất cho quý khách hàng:
                  </p>

                  {/* Filter and Search Box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-white rounded-xl border border-slate-200 p-1 w-full md:w-auto overflow-x-auto whitespace-nowrap gap-1">
                      {(['all', 'north', 'central', 'south'] as const).map((reg) => (
                        <button
                          key={reg}
                          onClick={() => setSelectedRegion(reg)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedRegion === reg 
                              ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                              : 'text-slate-600 hover:text-[var(--color-primary)]'
                          }`}
                        >
                          {reg === 'all' && 'Tất cả'}
                          {reg === 'north' && 'Miền Bắc'}
                          {reg === 'central' && 'Miền Trung'}
                          {reg === 'south' && 'Miền Nam'}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full md:w-72">
                      <input
                        type="text"
                        placeholder="Tìm theo tên chi nhánh, địa chỉ..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] bg-white shadow-inner"
                      />
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* Branches Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredBranches.length > 0 ? (
                      filteredBranches.map((branch, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all space-y-3 relative overflow-hidden group"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-slate-800 text-sm group-hover:text-[var(--color-primary)] transition-colors">
                              {branch.name}
                            </h4>
                            <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full shrink-0 ${
                              branch.region === 'north' ? 'bg-red-50 text-red-600' :
                              branch.region === 'central' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {branch.region === 'north' ? 'Bắc' :
                               branch.region === 'central' ? 'Trung' : 'Nam'}
                            </span>
                          </div>
                          
                          <p className="text-slate-500 text-xs leading-relaxed flex items-start gap-1.5">
                            <MapPin size={12} className="text-red-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{branch.address}</span>
                          </p>
                          
                          <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span>ĐT: <strong className="text-slate-600">{branch.phone}</strong></span>
                            <span>{branch.email}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                        Không tìm thấy chi nhánh nào phù hợp với từ khóa của bạn.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 5. ACHIEVEMENTS VIEW */}
              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.2em] block">Thành tích & Năng lực</span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[var(--color-primary)]">
                      Năng Lực Hành Nghề & Giải Thưởng
                    </h2>
                    <div className="h-1 w-24 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                        Với hơn một thập kỷ cống hiến hết mình vì sự an toàn pháp lý của hàng nghìn doanh nghiệp, chúng tôi vô cùng vinh hạnh gặt hái được nhiều giải thưởng, bằng khen cao quý khẳng định uy tín vượt bậc:
                      </p>

                      <div className="space-y-3">
                        <div className="flex gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                          <Star size={20} className="text-[var(--color-accent)] shrink-0 mt-0.5 fill-[var(--color-accent)]" />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Top 10 Hãng Luật tiêu biểu toàn quốc</h4>
                            <p className="text-slate-500 text-xs mt-1">Được bầu chọn bởi Hiệp hội Dịch vụ Pháp lý Doanh nghiệp & Thương hiệu Việt.</p>
                          </div>
                        </div>

                        <div className="flex gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                          <Star size={20} className="text-[var(--color-accent)] shrink-0 mt-0.5 fill-[var(--color-accent)]" />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Thương hiệu vì sự nghiệp Cộng đồng</h4>
                            <p className="text-slate-500 text-xs mt-1">Chứng nhận vinh danh cho các chiến dịch tư vấn, hỗ trợ pháp luật miễn phí cho hơn 1000+ hộ nghèo.</p>
                          </div>
                        </div>

                        <div className="flex gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow transition-shadow">
                          <Star size={20} className="text-[var(--color-accent)] shrink-0 mt-0.5 fill-[var(--color-accent)]" />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Hãng luật tiên phong số hóa hành chính</h4>
                            <p className="text-slate-500 text-xs mt-1">Ứng dụng chuyển đổi số vượt trội trong quản lý vụ án và tự động báo cáo thuế trọn gói.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Profile PDF Download Section */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-lg">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08),transparent_50%)]" />
                      
                      <div className="space-y-4 relative z-10">
                        <FileText size={42} className="text-[var(--color-accent)] mb-2" />
                        <h3 className="font-serif font-bold text-lg md:text-xl text-white">HỒ SƠ NĂNG LỰC PHÁP LÝ (CAPACITY PROFILE)</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Tải xuống tài liệu giới thiệu chi tiết năng lực hoạt động của Công ty Luật TNHH Ánh Dương (bản PDF chính thức, cập nhật năm 2026). Tài liệu cung cấp hồ sơ pháp lý, các vụ án kinh điển đã giải quyết thành công và thông tin bảo mật.
                        </p>
                      </div>

                      <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 relative z-10">
                        <a 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert('Hệ thống đang tải xuống tệp PDF Hồ sơ năng lực Ánh Dương Law...');
                          }}
                          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold text-xs md:text-sm transition-all cursor-pointer shadow-md"
                        >
                          <Download size={16} />
                          <span>Tải PDF (12MB)</span>
                        </a>
                        <button
                          onClick={() => {
                            alert(`Quý khách có thể xem tóm tắt online hoặc liên hệ ${settings.hotline_consult} để nhận hồ sơ in trực tiếp.`);
                          }}
                          className="px-5 py-3 rounded-xl border border-white/15 hover:bg-white/10 text-white font-bold text-xs md:text-sm transition-all text-center"
                        >
                          Xem trực tiếp
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Quality commitment call to action banner */}
      <div className="bg-[var(--color-primary)] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--color-accent)/10,transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 relative z-10 space-y-6">
          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold">
            "Sứ Mệnh Bảo Vệ Công Lý - Đồng Hành Doanh Nghiệp"
          </h3>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Hơn cả một dịch vụ tư vấn pháp luật thông thường, Ánh Dương Law mang lại giải pháp toàn diện vững chắc bảo bọc mọi khía cạnh rủi ro, cho bạn yên tâm gieo mầm gặt hái thành công.
          </p>
          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
            <button 
              onClick={() => navigateTo('/lien-he')}
              className="px-8 py-3.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-900 font-bold rounded-xl shadow-lg transition-all text-sm cursor-pointer"
            >
              Liên hệ tư vấn trực tiếp
            </button>
            <a 
              href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} 
              className="px-8 py-3.5 border border-white/20 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm"
            >
              Tổng đài: {settings.hotline_consult}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
