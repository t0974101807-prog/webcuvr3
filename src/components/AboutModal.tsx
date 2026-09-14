import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Building2, Users, Award, Network, Shield, CheckCircle2, 
  Target, ChevronRight, Download, FileText, MapPin, Briefcase, Star, HelpCircle
} from 'lucide-react';
import { useContactSettings } from '../hooks/useContactSettings';
import { fetchApi } from '../utils/api';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export default function AboutModal({ isOpen, onClose, initialTab = 'overview' }: AboutModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'north' | 'central' | 'south'>('all');
  const { settings } = useContactSettings();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/api/offices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
        }
      })
      .catch(err => console.error("Error loading offices in AboutModal:", err));
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-slate-900/80 backdrop-blur-md">
          {/* Backdrop click */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-default"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 border border-slate-100"
          >
            {/* Top Header */}
            <div className="bg-[var(--color-primary)] text-white px-6 py-4 md:py-5 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[var(--color-accent)] shrink-0">
                  <Building2 size={22} className="fill-transparent" />
                </div>
                <div>
                  <h3 className="font-serif text-lg md:text-xl font-bold tracking-wide uppercase">
                    Hồ sơ Giới thiệu & Năng lực
                  </h3>
                  <p className="text-white/60 text-xs hidden sm:block">
                    Công ty Luật TNHH Ánh Dương (Ánh Dương Law)
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                title="Đóng cửa sổ"
              >
                <X size={22} />
              </button>
            </div>

            {/* Main Layout */}
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden bg-slate-50">
              {/* Left sidebar navigation */}
              <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-100 p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0 scrollbar-none whitespace-nowrap md:whitespace-normal">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 shrink-0 cursor-pointer text-left w-full ${
                        activeTab === tab.id 
                          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)]'
                      }`}
                    >
                      <Icon size={16} className={activeTab === tab.id ? 'text-[var(--color-accent)]' : 'text-slate-400'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right content view area */}
              <div className="flex-grow overflow-y-auto p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-wider block mb-1">Tổng quan doanh nghiệp</span>
                        <h4 className="text-2xl font-serif font-bold text-[var(--color-primary)] mb-4">
                          Công Ty Luật TNHH Ánh Dương
                        </h4>
                        <div className="h-1 w-20 bg-[var(--color-accent)] mb-6 rounded-full" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        <div className="md:col-span-7 space-y-4 text-slate-700 leading-relaxed text-sm md:text-base">
                          <p className="font-semibold text-slate-900 border-l-4 border-[var(--color-primary)] pl-4 italic">
                            Ánh Dương Law là tổ chức hành nghề luật sư chuyên nghiệp hàng đầu tại Việt Nam, cung cấp dịch vụ pháp lý trọn gói toàn diện cho doanh nghiệp và cá nhân trên phạm vi cả nước.
                          </p>
                          <p>
                            Với mô hình phát triển chuỗi cung ứng pháp lý toàn diện rộng khắp cả nước, <strong>Ánh Dương Law</strong> đã không ngừng nỗ lực bứt phá để xây dựng hệ thống chi nhánh phủ khắp toàn quốc với tinh thần hành động: <strong className="text-[var(--color-primary)]">Tận tâm, Chuyên nghiệp và Tối ưu chi phí</strong>.
                          </p>
                          <p>
                            Chúng tôi hiểu rằng, trong thời đại toàn cầu hóa và chuyển đổi số, pháp lý không chỉ đơn thuần là giải quyết tranh chấp mà là hoạt động chủ động kiểm soát rủi ro, tối ưu hóa lợi ích và kiến tạo cơ hội. Từ đó, chúng tôi cung cấp giải pháp đồng hành toàn diện từ thành lập doanh nghiệp, xin giấy phép con, sở hữu trí tuệ, dịch vụ kế toán thuế cho đến tranh tụng bảo vệ quyền lợi tối đa tại Tòa án.
                          </p>
                        </div>

                        <div className="md:col-span-5 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-5">
                          <h5 className="font-serif font-bold text-slate-900 border-b pb-2 text-base">Chỉ số năng lực nổi bật</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-3xl font-bold text-[var(--color-primary)] font-serif">15+</p>
                              <p className="text-slate-500 text-xs mt-1">Năm Kinh Nghiệm</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-3xl font-bold text-[var(--color-accent)] font-serif">{branches.length}</p>
                              <p className="text-slate-500 text-xs mt-1">Chi Nhánh Toàn Quốc</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-3xl font-bold text-[var(--color-primary)] font-serif">100+</p>
                              <p className="text-slate-500 text-xs mt-1">Luật Sư & Chuyên Gia</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-3xl font-bold text-[var(--color-primary)] font-serif">20k+</p>
                              <p className="text-slate-500 text-xs mt-1">Khách Hàng Tin Dùng</p>
                            </div>
                          </div>

                          <div className="pt-3">
                            <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-[var(--color-accent)]/10 p-3 rounded-lg border border-[var(--color-accent)]/20">
                              <Shield size={16} className="text-[var(--color-primary)] shrink-0" />
                              <span>Cam kết bảo mật tuyệt đối 100% thông tin khách hàng và tài liệu vụ việc.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-100/50 p-6 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm shrink-0">
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <h6 className="font-bold text-slate-900 text-sm">Tư vấn 24/7</h6>
                            <p className="text-slate-500 text-xs mt-1">Tổng đài luôn trực tuyến hỗ trợ giải đáp mọi lúc, mọi nơi.</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm shrink-0">
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <h6 className="font-bold text-slate-900 text-sm">Chi phí trọn gói</h6>
                            <p className="text-slate-500 text-xs mt-1">Minh bạch ngay từ đầu, tuyệt đối không phát sinh chi phí phụ.</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm shrink-0">
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <h6 className="font-bold text-slate-900 text-sm">Giao kết quả tận nhà</h6>
                            <p className="text-slate-500 text-xs mt-1">Nhận hồ sơ và trả kết quả miễn phí qua bưu điện toàn quốc.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'values' && (
                    <motion.div
                      key="values"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
                      <div>
                        <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-wider block mb-1">Triết lý hoạt động</span>
                        <h4 className="text-2xl font-serif font-bold text-[var(--color-primary)] mb-4">
                          Tầm Nhìn - Sứ Mệnh - Giá Trị Cốt Lõi
                        </h4>
                        <div className="h-1 w-20 bg-[var(--color-accent)] mb-6 rounded-full" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Vision */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary)]/5 rounded-bl-full -z-10 group-hover:bg-[var(--color-primary)]/10 transition-colors" />
                          <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
                            <Target size={24} />
                          </div>
                          <h5 className="font-serif font-bold text-slate-900 text-lg mb-3">Tầm nhìn chiến lược</h5>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            Trở thành định chế pháp lý biểu tượng cho sự <strong className="text-[var(--color-primary)]">Tin cậy và Sáng tạo</strong>, là hãng luật tiên phong tích hợp công nghệ số, sở hữu chuỗi văn phòng tư vấn chuyên nghiệp phủ khắp 63 tỉnh thành Việt Nam. Chúng tôi cam kết đưa pháp lý đến gần hơn, dễ tiếp cận hơn cho mọi người dân và doanh nghiệp.
                          </p>
                        </div>

                        {/* Mission */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-accent)]/5 rounded-bl-full -z-10 group-hover:bg-[var(--color-accent)]/10 transition-colors" />
                          <div className="w-12 h-12 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] mb-4">
                            <Shield size={24} />
                          </div>
                          <h5 className="font-serif font-bold text-slate-900 text-lg mb-3">Sứ mệnh thiêng liêng</h5>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            <strong>"Bảo vệ công lý - Đồng hành phát triển"</strong>. Chúng tôi mang sứ mệnh cung cấp lá chắn pháp lý an toàn vững chắc, giải quyết tận gốc các khó khăn pháp luật phức tạp, tháo gỡ rào cản thủ tục hành chính, giúp các nhà đầu tư và doanh nghiệp vững tâm bứt phá trên hành trình kinh doanh.
                          </p>
                        </div>
                      </div>

                      {/* Core Values */}
                      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <h5 className="font-serif font-bold text-slate-900 text-lg mb-6 border-b pb-3">4 Giá Trị Cốt Lõi Tác Phong</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 py-1 px-2.5 rounded-full w-fit">
                              01. TẬN TÂM
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              Đặt lợi ích hợp pháp của khách hàng lên hàng đầu. Lắng nghe sâu sắc, chia sẻ gánh nặng lo âu của khách hàng như việc của chính mình.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-primary)] py-1 px-2.5 rounded-full w-fit">
                              02. UY TÍN
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              Nói đi đôi với làm, cam kết tiến độ rõ ràng. Tuyệt đối tuân thủ đạo đức nghề nghiệp và giữ trọn chữ tín với đối tác, khách hàng.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 py-1 px-2.5 rounded-full w-fit">
                              03. CHUYÊN NGHIỆP
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              Quy trình xử lý vụ việc chặt chẽ, chính xác. Đội ngũ luật sư có kiến thức chuyên môn sâu rộng và kỹ năng giải quyết công việc cực kỳ nhạy bén.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--color-primary)] py-1 px-2.5 rounded-full w-fit">
                              04. HIỆU QUẢ
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              Không chỉ đưa ra lý thuyết, chúng tôi mang lại kết quả thực tế tối ưu nhất trong thời gian ngắn nhất với mức ngân sách hợp lý nhất.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'structure' && (
                    <motion.div
                      key="structure"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-wider block mb-1">Mô hình quản trị chuyên sâu</span>
                        <h4 className="text-2xl font-serif font-bold text-[var(--color-primary)] mb-4">
                          Sơ Đồ Tổ Chức Bộ Máy Hoạt Động
                        </h4>
                        <div className="h-1 w-20 bg-[var(--color-accent)] mb-6 rounded-full" />
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        Bộ máy Ánh Dương Law vận hành theo cơ chế phân quyền chuyên nghiệp và phối hợp liên ngành chặt chẽ, tối ưu hóa năng lực xử lý vụ việc từ khâu tiếp nhận đến bàn giao kết quả:
                      </p>

                      {/* Visual Organizational Chart Tree representation */}
                      <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center space-y-6">
                        {/* Board Level */}
                        <div className="w-56 bg-[var(--color-primary)] text-white text-center py-2.5 px-4 rounded-lg font-serif font-bold text-sm shadow-md border-b-4 border-[var(--color-accent)]">
                          Hội Đồng Thành Viên
                        </div>

                        {/* Connector */}
                        <div className="w-0.5 h-6 bg-slate-300" />

                        {/* Executive Level */}
                        <div className="w-56 bg-slate-800 text-white text-center py-2.5 px-4 rounded-lg font-serif font-bold text-sm shadow-md">
                          Giám Đốc Điều Hành
                        </div>

                        {/* Connector with split */}
                        <div className="w-0.5 h-6 bg-slate-300" />
                        <div className="w-4/5 h-0.5 bg-slate-300 max-w-2xl" />
                        
                        {/* Departments grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl pt-2">
                          <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center shadow-sm hover:border-[var(--color-primary)] transition-all">
                            <Briefcase className="mx-auto text-[var(--color-primary)] mb-2" size={18} />
                            <p className="font-bold text-slate-800 text-xs">Phòng Doanh Nghiệp & Đầu Tư</p>
                            <p className="text-[10px] text-slate-500 mt-1">Đăng ký KD, FDI, M&A</p>
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center shadow-sm hover:border-[var(--color-primary)] transition-all">
                            <Shield className="mx-auto text-[var(--color-primary)] mb-2" size={18} />
                            <p className="font-bold text-slate-800 text-xs">Phòng Tranh Tụng</p>
                            <p className="text-[10px] text-slate-500 mt-1">Tòa án & Trọng tài</p>
                          </div>

                          <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center shadow-sm hover:border-[var(--color-primary)] transition-all">
                            <Building2 className="mx-auto text-[var(--color-primary)] mb-2" size={18} />
                            <p className="font-bold text-slate-800 text-xs">Phòng Tư Vấn Giấy Phép Con</p>
                            <p className="text-[10px] text-slate-500 mt-1">ATTP, Visa, Thẻ tạm trú</p>
                          </div>

                          <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center shadow-sm hover:border-[var(--color-primary)] transition-all">
                            <FileText className="mx-auto text-[var(--color-primary)] mb-2" size={18} />
                            <p className="font-bold text-slate-800 text-xs">Phòng Kế Toán & Thuế</p>
                            <p className="text-[10px] text-slate-500 mt-1">Báo cáo thuế, quyết toán</p>
                          </div>
                        </div>

                        {/* Footer process description */}
                        <div className="text-center pt-4 border-t border-slate-100 w-full mt-4">
                          <p className="text-xs text-slate-500 font-medium italic">
                            *Sự phối hợp chặt chẽ giữa các phòng chuyên môn giúp mỗi vụ việc của khách hàng được phân tích đa chiều.*
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'branches' && (
                    <motion.div
                      key="branches"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-wider block mb-1">Quy mô phục vụ toàn quốc</span>
                          <h4 className="text-2xl font-serif font-bold text-[var(--color-primary)]">
                            Hệ Thống {branches.length} Văn Phòng Toàn Quốc
                          </h4>
                          <div className="h-1 w-20 bg-[var(--color-accent)] mt-3 rounded-full" />
                        </div>
                        <div className="flex gap-2">
                          <a href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white px-4 py-2 rounded-lg font-bold text-xs md:text-sm shadow-sm transition-all">
                            <span>Hotline: {settings.hotline_consult}</span>
                          </a>
                        </div>
                      </div>

                      {/* Region Filters and Search */}
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 w-full md:w-auto">
                          {(['all', 'north', 'central', 'south'] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => setSelectedRegion(r)}
                              className={`flex-grow md:flex-grow-0 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                selectedRegion === r 
                                  ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                                  : 'text-slate-600 hover:text-[var(--color-primary)]'
                              }`}
                            >
                              {r === 'all' && 'Tất cả'}
                              {r === 'north' && 'Miền Bắc'}
                              {r === 'central' && 'Miền Trung'}
                              {r === 'south' && 'Miền Nam'}
                            </button>
                          ))}
                        </div>

                        <div className="relative w-full md:w-64">
                          <input
                            type="text"
                            placeholder="Tìm chi nhánh, tỉnh thành..."
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            className="w-full text-xs md:text-sm pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--color-primary)] bg-slate-50"
                          />
                          <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      {/* Branches Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin">
                        {filteredBranches.length > 0 ? (
                          filteredBranches.map((branch, i) => (
                            <div 
                              key={i} 
                              className="bg-white p-4 rounded-lg border border-slate-150 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all space-y-2 relative overflow-hidden group"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="font-bold text-slate-900 text-sm group-hover:text-[var(--color-primary)] transition-colors">
                                  {branch.name}
                                </h5>
                                <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full ${
                                  branch.region === 'north' ? 'bg-red-50 text-red-600' :
                                  branch.region === 'central' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {branch.region === 'north' ? 'Miền Bắc' :
                                   branch.region === 'central' ? 'Miền Trung' : 'Miền Nam'}
                                </span>
                              </div>
                              <p className="text-slate-600 text-xs leading-relaxed flex items-start gap-1.5">
                                <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>{branch.address}</span>
                              </p>
                              <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                                <span>ĐT: <strong>{branch.phone}</strong></span>
                                <span className="text-slate-400">{branch.email}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-lg border border-slate-100">
                            Không tìm thấy chi nhánh nào phù hợp với điều kiện tìm kiếm.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'achievements' && (
                    <motion.div
                      key="achievements"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-wider block mb-1">Thành tích & Minh chứng</span>
                        <h4 className="text-2xl font-serif font-bold text-[var(--color-primary)] mb-4">
                          Hồ Sơ Năng Lực & Thành Tựu Doanh Nghiệp
                        </h4>
                        <div className="h-1 w-20 bg-[var(--color-accent)] mb-6 rounded-full" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            Trải qua hơn 15 năm hình thành và phát triển vững bền, Ánh Dương Law vinh hạnh nhận được nhiều bằng khen, chứng nhận uy tín từ các Hiệp hội Doanh nghiệp, cơ quan ban ngành và hàng vạn khách hàng mến mộ:
                          </p>

                          <div className="space-y-3">
                            <div className="flex gap-3 bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm">
                              <Star size={18} className="text-[var(--color-accent)] shrink-0 mt-0.5 fill-[var(--color-accent)]" />
                              <div>
                                <h6 className="font-bold text-slate-900 text-sm">Top 10 Hãng Luật tiêu biểu năm 2024</h6>
                                <p className="text-slate-500 text-xs mt-0.5">Bình chọn bởi Hiệp hội tư vấn dịch vụ Pháp lý và Thương hiệu Việt Nam.</p>
                              </div>
                            </div>

                            <div className="flex gap-3 bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm">
                              <Star size={18} className="text-[var(--color-accent)] shrink-0 mt-0.5 fill-[var(--color-accent)]" />
                              <div>
                                <h6 className="font-bold text-slate-900 text-sm">Chứng nhận thương hiệu vì cộng đồng</h6>
                                <p className="text-slate-500 text-xs mt-0.5">Nhờ tích cực thực hiện hơn 1,000+ vụ việc tư vấn pháp luật miễn phí cho người nghèo.</p>
                              </div>
                            </div>

                            <div className="flex gap-3 bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm">
                              <Star size={18} className="text-[var(--color-accent)] shrink-0 mt-0.5 fill-[var(--color-accent)]" />
                              <div>
                                <h6 className="font-bold text-slate-900 text-sm">Doanh nghiệp xuất sắc của năm</h6>
                                <p className="text-slate-500 text-xs mt-0.5">Tiên phong số hóa quy trình và tư vấn dịch vụ hành chính công trọn gói tiện ích.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Credentials / Capacity Profile Download Box */}
                        <div className="bg-slate-950 text-white p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,200,86,0.1),transparent_50%)]" />
                          
                          <div className="space-y-4 relative z-10">
                            <FileText size={40} className="text-[var(--color-accent)] mb-2" />
                            <h5 className="font-serif font-bold text-lg md:text-xl text-white">HỒ SƠ NĂNG LỰC PHÁP LÝ (CAPACITY PROFILE)</h5>
                            <p className="text-slate-400 text-xs leading-relaxed">
                              Tải xuống bản đầy đủ Hồ sơ năng lực Công ty Luật TNHH Ánh Dương (bản PDF, cập nhật Quý II/2026). Tài liệu cung cấp đầy đủ thông tin pháp nhân, giấy phép hành nghề, danh sách luật sư, các dự án tiêu biểu và biểu phí tham khảo.
                            </p>
                          </div>

                          <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 relative z-10">
                            <a 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                alert('Đang tải hồ sơ năng lực Ánh Dương Law...');
                              }}
                              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold text-xs md:text-sm transition-all cursor-pointer shadow-md"
                            >
                              <Download size={16} />
                              <span>Tải xuống bản PDF (12MB)</span>
                            </a>
                            <button
                              onClick={() => {
                                alert(`Thông tin tư vấn trực tuyến: ${settings.hotline_consult} hoặc ${settings.email}`);
                              }}
                              className="px-5 py-3 rounded-lg border border-white/20 hover:bg-white/10 text-white font-bold text-xs md:text-sm transition-all"
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

            {/* Bottom Footer block inside Modal */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 shrink-0">
              <span className="text-center sm:text-left">
                © 2026 Ánh Dương Law. Bản quyền phát triển thuộc về Công ty Luật Ánh Dương (Ánh Dương Law).
              </span>
              <div className="flex gap-4">
                <a href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} className="hover:text-[var(--color-primary)] font-semibold transition-colors">Tổng đài: {settings.hotline_consult}</a>
                <span>•</span>
                <span className="font-semibold text-slate-700">Tư vấn tận tâm - Giải pháp tối ưu</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
