import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { fetchApi } from '../utils/api';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Coins, 
  Search, 
  Building, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  FileText, 
  ArrowUpRight, 
  Send, 
  UploadCloud, 
  Check, 
  Users, 
  Award, 
  ShieldCheck, 
  Heart,
  ChevronRight,
  TrendingUp,
  BookOpen
} from 'lucide-react';

interface RecruitmentJob {
  id: number;
  title: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  content: string;
  file_url?: string;
  file_name?: string;
}

const DEFAULT_BENEFITS = [
  {
    title: "Lương Thưởng Vượt Trội",
    description: "Lương cứng cạnh tranh theo đúng năng lực thực tế. Cơ chế thưởng vụ việc, hoa hồng doanh số mang về cực kỳ vượt trội và minh bạch từ 10% - 20% doanh thu vụ việc.",
    icon: "Coins"
  },
  {
    title: "Lộ Trình Thăng Tiến Rõ Ràng",
    description: "Kế hoạch phát triển sự nghiệp cá nhân chi tiết. Đánh giá tăng lương và thăng cấp vị trí định kỳ 6 tháng một lần dựa hoàn toàn trên năng lực và đóng góp thực tế.",
    icon: "TrendingUp"
  },
  {
    title: "Đào Tạo Thực Chiến",
    description: "Cơ hội rèn luyện sâu rộng thông qua các buổi chia sẻ chuyên đề pháp luật định kỳ. Được kèm cặp, dìu dắt trực tiếp (1-on-1) bởi các Luật sư thành viên gạo cội.",
    icon: "BookOpen"
  },
  {
    title: "Phúc Lợi Toàn Diện",
    description: "Hưởng đầy đủ bảo hiểm xã hội, bảo hiểm y tế. Các hoạt động Teambuilding sôi nổi, du lịch nghỉ dưỡng 5 sao trong & ngoài nước ít nhất 1 lần/năm cùng gia đình Ánh Dương Law.",
    icon: "Heart"
  }
];

const DEFAULT_PROCESS = [
  {
    step: "01",
    title: "Gửi hồ sơ ứng tuyển",
    description: "Ứng viên nộp CV trực tiếp thông qua biểu mẫu website hoặc email tuyển dụng. Bộ phận HR tiến hành sàng lọc và phản hồi kết quả trong tối đa 3 ngày làm việc."
  },
  {
    step: "02",
    title: "Phỏng vấn sơ loại",
    description: "Một buổi trò chuyện thân mật (trực tiếp hoặc online) cùng bộ phận HR để chia sẻ định hướng công việc, lộ trình nghề nghiệp và mức độ phù hợp văn hóa làm việc."
  },
  {
    step: "03",
    title: "Đánh giá năng lực chuyên môn",
    description: "Ứng viên tham gia thực hiện bài đánh giá kiến thức chuyên môn thực tế hoặc trao đổi chuyên sâu trực tiếp cùng Hội đồng Luật sư thành viên sáng lập của Ánh Dương Law."
  },
  {
    step: "04",
    title: "Nhận việc & Onboarding",
    description: "Bộ phận nhân sự gửi Thư mời nhận việc (Offer Letter) với các thỏa thuận đãi ngộ chi tiết. Ứng viên tham gia chương trình đào tạo hội nhập có Mentor dẫn dắt."
  }
];

export default function Recruitment() {
  const [positions, setPositions] = useState<RecruitmentJob[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [processSteps, setProcessSteps] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<RecruitmentJob | null>(null);
  const [activeTab, setActiveTab] = useState<string>('jobs');
  
  // Job filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Form Application states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [cvLink, setCvLink] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetchApi(`/api/recruitment?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPositions(data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch recruitment data', err);
      });

    fetchApi(`/api/recruitment-benefits?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBenefits(data);
        }
      })
      .catch(err => console.error('Failed to fetch benefits', err));

    fetchApi(`/api/recruitment-process?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProcessSteps(data);
        }
      })
      .catch(err => console.error('Failed to fetch process', err));
  }, []);

  const displayBenefits = benefits.length > 0 ? benefits : DEFAULT_BENEFITS;
  const displayProcess = processSteps.length > 0 ? processSteps : DEFAULT_PROCESS;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coins': return <Coins className="text-amber-500" size={24} />;
      case 'TrendingUp': return <TrendingUp className="text-blue-500" size={24} />;
      case 'BookOpen': return <BookOpen className="text-emerald-500" size={24} />;
      case 'Heart': return <Heart className="text-red-500" size={24} />;
      default: return <Coins className="text-slate-500" size={24} />;
    }
  };

  // Listen for custom events from navbar
  useEffect(() => {
    const handleOpenTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tab) {
        setActiveTab(customEvent.detail.tab);
        // If it's a specific job application from modal trigger, let's set it
        if (customEvent.detail.jobTitle) {
          setJobTitle(customEvent.detail.jobTitle);
        }
      }
    };
    window.addEventListener('open-recruitment-tab', handleOpenTab);
    return () => window.removeEventListener('open-recruitment-tab', handleOpenTab);
  }, []);

  // Handle fake file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCvFile(file);
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 20;
        });
      }, 200);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setCvFile(file);
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 25;
        });
      }, 150);
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !jobTitle) return;

    // Simulate saving application
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setJobTitle('');
    setCoverLetter('');
    setCvLink('');
    setCvFile(null);
    setUploadProgress(0);
    setIsSubmitted(false);
  };

  const handleApplyNowFromJob = (job: RecruitmentJob) => {
    setJobTitle(job.title);
    setSelectedJob(null);
    setActiveTab('apply');
    // Scroll to the recruitment section with minor delay to sync state
    setTimeout(() => {
      const el = document.getElementById('recruitment');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Filter positions
  const filteredPositions = positions.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLoc = selectedLocation === 'All' || job.location.includes(selectedLocation);
    const matchesType = selectedType === 'All' || job.type === selectedType;
    return matchesSearch && matchesLoc && matchesType;
  });

  return (
    <section id="recruitment" className="py-16 md:py-24 bg-[#FAF9F6] relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--color-accent)]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[var(--color-accent)] font-semibold uppercase tracking-[0.25em] mb-4 text-xs sm:text-sm">
            Tuyển dụng & Sự nghiệp
          </h2>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] mb-6 leading-tight">
            Kiến Tạo Tương Lai Pháp Lý Bền Vững
          </h3>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Chúng tôi luôn chào đón những nhân tố tài năng, chính trực và khát khao khẳng định giá trị bản thân trong một môi trường hành nghề luật chuyên nghiệp hàng đầu.
          </p>
        </div>

        {/* Custom Premium Tabs Navigation */}
        <div className="flex flex-wrap justify-center items-center gap-2 mb-12 border-b border-gray-200 pb-1 max-w-4xl mx-auto">
          {[
            { id: 'jobs', label: 'Vị trí tuyển dụng', icon: <Briefcase size={16} /> },
            { id: 'culture', label: 'Môi trường & Phúc lợi', icon: <Heart size={16} /> },
            { id: 'process', label: 'Quy trình tuyển dụng', icon: <Award size={16} /> },
            { id: 'apply', label: 'Nộp hồ sơ trực tuyến', icon: <Send size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'apply' && !jobTitle && filteredPositions.length > 0) {
                  setJobTitle(filteredPositions[0].title);
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all relative border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]'
                  : 'border-transparent text-gray-500 hover:text-[var(--color-primary)] hover:bg-white/50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'jobs' && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {filteredPositions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: JOB OPENINGS */}
          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Filters Bar */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                
                {/* Search */}
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm vị trí, kỹ năng, yêu cầu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all placeholder:text-gray-400 font-medium text-slate-800"
                  />
                </div>

                {/* Location Select */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all text-slate-700 font-medium cursor-pointer appearance-none"
                  >
                    <option value="All">Tất cả địa điểm</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>

                {/* Job Type Select */}
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all text-slate-700 font-medium cursor-pointer appearance-none"
                  >
                    <option value="All">Tất cả hình thức</option>
                    <option value="Toàn thời gian">Toàn thời gian</option>
                    <option value="Bán thời gian">Bán thời gian</option>
                    <option value="Thực tập">Thực tập</option>
                  </select>
                </div>
              </div>

              {/* Jobs Grid */}
              {filteredPositions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPositions.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      onClick={() => setSelectedJob(job)}
                      className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full cursor-pointer relative overflow-hidden"
                    >
                      {/* Accent highlight bar */}
                      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                      
                      <div>
                        {/* Upper Details */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {job.type}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold">
                            <span className="flex items-center gap-1">
                              <MapPin size={13} className="text-red-400" /> {job.location}
                            </span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1">
                              <Coins size={13} className="text-amber-500" /> {job.salary}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-xl sm:text-2xl font-serif font-bold text-slate-800 mb-3 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                          {job.title}
                        </h4>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      {/* Footer Details */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                        <span className="text-xs text-slate-400 font-medium">Hạn nộp: Nhận hồ sơ thường xuyên</span>
                        <button className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                          Xem chi tiết <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="text-slate-400" size={28} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-700 mb-2">Không tìm thấy vị trí tuyển dụng phù hợp</h4>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                    Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc địa điểm/hình thức làm việc để có thêm kết quả.
                  </p>
                  <button 
                    onClick={() => { setSearchTerm(''); setSelectedLocation('All'); setSelectedType('All'); }}
                    className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white text-xs font-bold rounded-lg transition-colors shadow-md"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: ENVIRONMENT & BENEFITS */}
          {activeTab === 'culture' && (
            <motion.div
              key="culture"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* Highlight Intro */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold rounded-full uppercase tracking-wide">
                    <Users size={12} /> Gia nhập gia đình Ánh Dương Law
                  </div>
                  <h4 className="text-3xl sm:text-4xl font-serif font-bold text-slate-800 leading-tight">
                    Môi Trường Phát Triển Toàn Diện & Thăng Tiến Bền Vững
                  </h4>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Tại Ánh Dương Law, chúng tôi tin rằng giá trị lớn nhất của một tổ chức hành nghề luật nằm ở con người. Chúng tôi không chỉ xây dựng một văn phòng làm việc hiện đại, mà còn kiến tạo một hệ sinh thái nuôi dưỡng tài năng, thúc đẩy tính sáng tạo, trách nhiệm và ý chí cống hiến vượt bậc của mỗi thành viên.
                  </p>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Đến với chúng tôi, bạn sẽ được trao quyền để xử lý các vụ việc thực chiến đỉnh cao dưới sự đồng hành từ các chuyên gia đầu ngành.
                  </p>
                </div>
                
                {/* Visual Image Banner */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] bg-slate-900 border-4 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200" 
                    alt="Corporate culture office workspace" 
                    className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                    <div>
                      <p className="text-white font-serif font-bold text-lg sm:text-xl">Văn phòng làm việc Hội sở sáng tạo</p>
                      <p className="text-white/80 text-xs mt-1">Nơi nuôi dưỡng giải pháp pháp lý toàn diện cho hàng vạn doanh nghiệp.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Cards Grid */}
              <div>
                <h5 className="text-xl sm:text-2xl font-serif font-bold text-center text-slate-800 mb-8">
                  Quyền Lợi & Đãi Ngộ Đặc Quyền Tại Ánh Dương Law
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {displayBenefits.map((benefit: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        {renderIcon(benefit.icon)}
                      </div>
                      <h6 className="font-bold text-slate-800 text-base">{benefit.title}</h6>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: RECRUITMENT PROCESS */}
          {activeTab === 'process' && (
            <motion.div
              key="process"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              <div className="text-center max-w-2xl mx-auto mb-4">
                <h4 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 mb-3">
                  Quy Trình Tuyển Dụng Chuyên Nghiệp 4 Bước
                </h4>
                <p className="text-slate-500 text-sm">
                  Chúng tôi xây dựng quy trình tuyển chọn minh bạch, tôn trọng và tạo cơ hội tốt nhất để ứng viên chứng tỏ bản lĩnh chuyên môn của mình.
                </p>
              </div>

              {/* Steps timeline */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                {/* Horizontal connection line for desktop */}
                <div className="hidden md:block absolute top-[44px] left-[12%] right-[12%] h-0.5 bg-dashed border-t border-slate-200 -z-10" />

                {displayProcess.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative hover:border-[var(--color-primary)] transition-all group">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-lg mb-4 mx-auto md:mx-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors duration-300">
                      {item.step}
                    </div>
                    <h5 className="font-bold text-slate-800 text-base mb-2 text-center md:text-left">{item.title}</h5>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed text-center md:text-left">{item.description}</p>
                  </div>
                ))}
              </div>

              {/* Quick tip box */}
              <div className="bg-[var(--color-primary)]/5 p-6 rounded-2xl border border-[var(--color-primary)]/20 flex flex-col md:flex-row items-center gap-4 max-w-4xl mx-auto">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h6 className="font-bold text-slate-800 text-sm sm:text-base">Mẹo vượt qua vòng phỏng vấn chuyên môn tại Ánh Dương Law</h6>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                    Hãy rèn luyện thật tốt tư duy logic, nắm chắc các nguyên tắc cơ bản của Luật Doanh nghiệp, Dân sự và rèn luyện kỹ năng giải quyết tình huống thực tế. Chúng tôi luôn đánh giá cao thái độ trung thực, cầu tiến và tinh thần học hỏi chân thành.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: ONLINE APPLICATION FORM */}
          {activeTab === 'apply' && (
            <motion.div
              key="apply"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-text-dark)] p-6 sm:p-8 text-white relative">
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden sm:block">
                    <Send size={120} />
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-serif font-bold mb-2">Biểu Mẫu Ứng Tuyển Trực Tuyến</h4>
                  <p className="text-white/80 text-xs sm:text-sm">
                    Hãy điền đầy đủ thông tin bên dưới và tải lên CV của bạn. Chúng tôi sẽ phản hồi trong vòng 48 giờ làm việc.
                  </p>
                </div>

                <div className="p-6 sm:p-8">
                  {isSubmitted ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-12 space-y-6"
                    >
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Check size={40} className="stroke-[3px]" />
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-2xl font-serif font-bold text-slate-800">Nộp Hồ Sơ Thành Công!</h5>
                        <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                          Cảm ơn bạn <span className="font-bold text-slate-800">{fullName}</span> đã ứng tuyển vào vị trí <span className="font-bold text-[var(--color-primary)]">{jobTitle}</span>. 
                        </p>
                        <p className="text-slate-500 text-xs max-w-md mx-auto">
                          Hệ thống đã ghi nhận thông tin ứng tuyển của bạn. Bộ phận Tuyển dụng (HR) của chúng tôi sẽ xem xét cẩn thận CV và liên hệ trực tiếp với bạn qua điện thoại hoặc email (<span className="underline">{email}</span>) trong vòng 24 - 48 giờ tới.
                        </p>
                      </div>
                      <div className="pt-6">
                        <button
                          onClick={resetForm}
                          className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          Nộp hồ sơ vị trí khác
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmitApplication} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Họ và tên ứng viên *</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Số điện thoại liên hệ *</label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0912 345 678"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Email */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Địa chỉ Email nhận tin tuyển dụng *</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@gmail.com"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all"
                          />
                        </div>

                        {/* Position select */}
                        <div>
                          <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Vị trí ứng tuyển *</label>
                          <select
                            required
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all text-slate-700 font-medium cursor-pointer"
                          >
                            <option value="">-- Chọn vị trí muốn ứng tuyển --</option>
                            {positions.map(job => (
                              <option key={job.id} value={job.title}>{job.title} - {job.location}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Resume CV upload */}
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Tải hồ sơ đính kèm (CV của bạn) *</label>
                        
                        <div 
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[var(--color-primary)] transition-colors cursor-pointer bg-slate-50/50"
                        >
                          <input
                            type="file"
                            id="cv-upload"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <label htmlFor="cv-upload" className="cursor-pointer space-y-2 block">
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
                              <UploadCloud size={24} />
                            </div>
                            <div className="text-slate-600 text-xs sm:text-sm font-semibold">
                              {cvFile ? cvFile.name : "Kéo và thả tệp CV vào đây hoặc bấm để chọn tệp"}
                            </div>
                            <p className="text-slate-400 text-[10px] sm:text-xs">
                              Hỗ trợ định dạng .PDF, .DOC, .DOCX. Dung lượng tối đa 10MB.
                            </p>
                          </label>
                        </div>

                        {/* Fake Upload progress */}
                        {isUploading && (
                          <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                              <span>Đang tải lên tài liệu...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[var(--color-primary)] transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Uploaded File status */}
                        {!isUploading && cvFile && (
                          <div className="mt-3 flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
                            <div className="flex items-center gap-2 text-green-800 text-xs font-semibold truncate">
                              <FileText size={16} className="text-green-600" />
                              <span className="truncate">{cvFile.name}</span>
                              <span className="text-slate-400 text-[10px] font-normal">({(cvFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setCvFile(null)}
                              className="p-1 hover:bg-green-100 rounded text-green-700"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* CV Link alternatif */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs sm:text-sm font-bold text-slate-700">Hoặc dán liên kết CV (Google Drive, Dropbox, TopCV...)</label>
                          <span className="text-slate-400 text-[10px] font-semibold">Không bắt buộc</span>
                        </div>
                        <input
                          type="url"
                          value={cvLink}
                          onChange={(e) => setCvLink(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all"
                        />
                      </div>

                      {/* Cover letter Message */}
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">Thư giới thiệu bản thân & Lời nhắn</label>
                        <textarea
                          rows={4}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Hãy chia sẻ ngắn gọn về kinh nghiệm, thế mạnh pháp lý nổi bật của bạn và mong muốn đóng góp tại Ánh Dương Law..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none text-sm transition-all resize-none"
                        />
                      </div>

                      {/* Submit */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isUploading || !fullName || !email || !phone || !jobTitle || (!cvFile && !cvLink)}
                          className="w-full py-4.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
                        >
                          <Send size={18} />
                          Nộp Hồ Sơ Ứng Tuyển Ngay
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* JOB DETAIL POPUP MODAL */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto z-10 flex flex-col"
            >
              {/* Sticky Top Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedJob.type}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                      <MapPin size={12} className="text-red-400" /> {selectedJob.location}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-800 leading-tight">
                    {selectedJob.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              
              {/* Main Content Body */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                
                {/* Details Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Coins size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mức lương</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">{selectedJob.salary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hình thức</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">{selectedJob.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nơi làm việc</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">{selectedJob.location}</p>
                    </div>
                  </div>
                </div>

                {/* Job description content */}
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                  <div className="markdown-body">
                    <ReactMarkdown>{selectedJob.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Attached File Download */}
                {selectedJob.file_url && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h5 className="font-bold text-slate-800 text-sm sm:text-base mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-slate-500" /> Tài liệu đính kèm (JD Chi tiết)
                    </h5>
                    <a 
                      href={selectedJob.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors text-xs font-semibold"
                    >
                      <FileText size={14} className="text-[var(--color-primary)]" />
                      {selectedJob.file_name || 'Tải xuống File mô tả công việc (JD)'}
                    </a>
                  </div>
                )}

                {/* Bottom Guide and Apply CTA */}
                <div className="mt-8 pt-6 border-t border-gray-100 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <h5 className="font-bold text-slate-800 text-sm sm:text-base mb-2">Cách thức ứng tuyển nhanh</h5>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    Bạn có thể nộp hồ sơ bằng cách điền trực tuyến hoặc gửi CV & Thư giới thiệu về hòm thư điện tử tuyển dụng chính thức: <a href="mailto:hr@anhduonglaw.vn" className="text-[var(--color-primary)] font-bold hover:underline">hr@anhduonglaw.vn</a> (Tiêu đề ghi rõ: [Vị Trí Ứng Tuyển] - Họ và Tên).
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApplyNowFromJob(selectedJob)}
                      className="flex-1 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-[var(--color-primary)]/10 text-center cursor-pointer"
                    >
                      Ứng tuyển ngay vị trí này
                    </button>
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold rounded-xl transition-all text-center cursor-pointer"
                    >
                      Đóng cửa sổ
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
