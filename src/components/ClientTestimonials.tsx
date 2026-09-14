import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Quote, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Plus, 
  Grid, 
  Columns, 
  MessageSquare, 
  User, 
  Building, 
  CheckCircle,
  X
} from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  category: 'corporate' | 'individual' | 'investment' | 'dispute';
  categoryLabel: string;
  quote: string;
  rating: number;
  avatarUrl?: string;
  date?: string;
  isCustom?: boolean;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Bà Nguyễn Thu Trang',
    role: 'Giám đốc Tài chính',
    company: 'Vingroup Land',
    category: 'corporate',
    categoryLabel: 'Tư vấn Doanh nghiệp & M&A',
    quote: 'Dịch vụ tư vấn pháp lý của Luật Ánh Dương vượt lên trên sự mong đợi của chúng tôi. Đội ngũ luật sư không chỉ am hiểu luật pháp sâu sắc mà còn có tư duy chiến lược kinh doanh nhạy bén, giúp chúng tôi hoàn tất thương vụ sáp nhập phức tạp một cách an toàn và tối ưu.',
    rating: 5,
    date: '10/05/2026'
  },
  {
    id: '2',
    name: 'Ông Trần Hoàng Nam',
    role: 'Sáng lập & CEO',
    company: 'TechVina Group',
    category: 'corporate',
    categoryLabel: 'Sở hữu Trí tuệ',
    quote: 'Hành trình bảo hộ thương hiệu toàn cầu của TechVina gặp rất nhiều trở ngại pháp lý phức tạp cho đến khi có sự tham gia của Luật Ánh Dương. Sự chuyên nghiệp, chủ động và phản ứng nhanh nhạy của họ đã bảo vệ hoàn hảo tài sản trí tuệ của chúng tôi.',
    rating: 5,
    date: '28/04/2026'
  },
  {
    id: '3',
    name: 'ThS. Michael Jensen',
    role: 'Đại diện Quỹ Đầu tư',
    company: 'ASEAN Capital Partners',
    category: 'investment',
    categoryLabel: 'Đầu tư Nước ngoài',
    quote: 'Đối với một nhà đầu tư nước ngoài tại Việt Nam, sự rõ ràng pháp lý là ưu tiên hàng đầu. Luật Ánh Dương đã cung cấp những phân tích sắc sảo, thực tế và lộ trình triển khai vô cùng vững vàng. Họ chính là điểm tựa pháp lý đáng tin cậy của chúng tôi.',
    rating: 5,
    date: '15/03/2026'
  },
  {
    id: '4',
    name: 'Bà Phạm Minh Hà',
    role: 'Giám đốc Điều hành',
    company: 'Nội thất Cao cấp EliteHome',
    category: 'dispute',
    categoryLabel: 'Giải quyết Tranh chấp',
    quote: 'Trong vụ tranh chấp hợp đồng thương mại quốc tế kéo dài, Luật Ánh Dương đã đại diện bảo vệ quyền lợi hợp pháp của chúng tôi vô cùng xuất sắc. Bản lĩnh nghị trường và sự đanh thép của các luật sư đã mang lại thắng lợi thuyết phục.',
    rating: 5,
    date: '02/02/2026'
  },
  {
    id: '5',
    name: 'Ông Lê Khắc Hải',
    role: 'Đồng sáng lập',
    company: 'GreenEnergy VN',
    category: 'investment',
    categoryLabel: 'Dự án & Năng lượng',
    quote: 'Quy trình xin cấp phép đầu tư dự án năng lượng tái tạo quy mô lớn đòi hỏi sự chuẩn xác tuyệt đối. Nhờ sự hỗ trợ tận tâm và am hiểu sâu sắc quy định của các luật sư Ánh Dương, chúng tôi đã vượt qua rào cản hành chính nhanh hơn kế hoạch đề ra.',
    rating: 5,
    date: '19/01/2026'
  },
  {
    id: '6',
    name: 'Ông Nguyễn Văn Tiến',
    role: 'Khách hàng cá nhân',
    category: 'individual',
    categoryLabel: 'Thừa kế & Đất đai',
    quote: 'Tôi chân thành cảm ơn các Luật sư tại Ánh Dương đã đồng hành tận tụy giải quyết tranh chấp đất đai thừa kế của gia đình tôi. Không chỉ sắc bén về luật pháp, sự nhân văn và thấu hiểu tâm lý khách hàng của họ thực sự làm tôi vô cùng xúc động.',
    rating: 5,
    date: '05/12/2025'
  }
];

export default function ClientTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  // Form State
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCategory, setFormCategory] = useState<'corporate' | 'individual' | 'investment' | 'dispute'>('corporate');
  const [formQuote, setFormQuote] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formSuccess, setFormSuccess] = useState(false);

  // Load custom testimonials from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lawfirm_testimonials');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTestimonials([...DEFAULT_TESTIMONIALS, ...parsed]);
      }
    } catch (e) {
      console.error('Error loading stored testimonials:', e);
    }
  }, []);

  // Filtered list
  const filteredTestimonials = testimonials.filter(t => 
    selectedCategory === 'all' || t.category === selectedCategory
  );

  // Auto scroll effect for carousel (only if not viewing grid and modal is closed)
  useEffect(() => {
    if (viewMode === 'carousel' && !showSubmitModal && filteredTestimonials.length > 1) {
      const timer = setInterval(() => {
        handleNext();
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [viewMode, currentIndex, selectedCategory, showSubmitModal, filteredTestimonials.length]);

  // Handle reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => 
      prev === 0 ? filteredTestimonials.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex(prev => 
      prev === filteredTestimonials.length - 1 ? 0 : prev + 1
    );
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'corporate': return 'Tư vấn Doanh nghiệp & M&A';
      case 'individual': return 'Dân sự, Đất đai & Thừa kế';
      case 'investment': return 'Đầu tư Nước ngoài & Dự án';
      case 'dispute': return 'Giải quyết Tranh chấp';
      default: return 'Tư vấn Pháp lý';
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuote.trim()) return;

    const newTestimonial: Testimonial = {
      id: `custom_${Date.now()}`,
      name: formName,
      role: formRole || 'Khách hàng',
      company: formCompany || undefined,
      category: formCategory,
      categoryLabel: getCategoryLabel(formCategory),
      quote: formQuote,
      rating: formRating,
      date: new Date().toLocaleDateString('vi-VN'),
      isCustom: true
    };

    const updatedList = [...testimonials, newTestimonial];
    setTestimonials(updatedList);

    // Save custom testimonials to localStorage
    try {
      const stored = localStorage.getItem('lawfirm_testimonials');
      const storedParsed = stored ? JSON.parse(stored) : [];
      storedParsed.push(newTestimonial);
      localStorage.setItem('lawfirm_testimonials', JSON.stringify(storedParsed));
    } catch (err) {
      console.error('Error saving testimonial:', err);
    }

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setShowSubmitModal(false);
      // Reset form fields
      setFormName('');
      setFormRole('');
      setFormCompany('');
      setFormCategory('corporate');
      setFormQuote('');
      setFormRating(5);
    }, 2000);
  };

  // Carousel slide variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const categories = [
    { value: 'all', label: 'Tất cả ý kiến' },
    { value: 'corporate', label: 'Doanh nghiệp & M&A' },
    { value: 'investment', label: 'Đầu tư & Dự án' },
    { value: 'dispute', label: 'Tranh chấp & Tranh tụng' },
    { value: 'individual', label: 'Dân sự & Cá nhân' }
  ];

  return (
    <section id="testimonials" className="py-20 md:py-28 relative overflow-hidden bg-slate-50 dark:bg-[#0A0E17] transition-colors duration-300">
      {/* Decorative Subtle Background Graphics */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl pointer-events-none -mr-48 -mt-24"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none -ml-48 -mb-24"></div>
      <div className="absolute top-1/2 left-10 w-[1px] h-60 bg-gradient-to-b from-transparent via-[var(--color-accent)]/30 to-transparent hidden xl:block"></div>
      <div className="absolute top-1/3 right-10 w-[1px] h-60 bg-gradient-to-b from-transparent via-[var(--color-primary)]/30 to-transparent hidden xl:block"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[var(--color-accent)] dark:text-[#E5C047] font-semibold uppercase tracking-[0.25em] mb-4 text-xs sm:text-sm font-sans"
          >
            ĐỐI TÁC VÀ KHÁCH HÀNG
          </motion.p>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight"
          >
            Sự Hài Lòng Của Quý Khách <br className="hidden sm:inline" /> Là Thước Đo Thành Công
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-light leading-relaxed max-w-2xl mx-auto"
          >
            Những chia sẻ thực tế và đánh giá từ các doanh nghiệp, nhà đầu tư cùng khách hàng cá nhân đã đồng hành cùng Công ty Luật TNHH Ánh Dương.
          </motion.p>
        </div>

        {/* Toolbar (Filters & Layout Toggles) */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mb-12 pb-6 border-b border-slate-200 dark:border-slate-800">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start w-full lg:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md dark:bg-[var(--color-accent)] dark:border-[var(--color-accent)] dark:text-slate-950'
                    : 'bg-white dark:bg-[#121824] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[var(--color-accent)] dark:hover:border-[#E5C047]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Controls: Layout Toggle & Submit Review Button */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('carousel')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'carousel'
                    ? 'bg-slate-100 dark:bg-[#1B2336] text-[var(--color-accent)]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dạng trượt"
              >
                <Columns size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 dark:bg-[#1B2336] text-[var(--color-accent)]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dạng lưới"
              >
                <Grid size={18} />
              </button>
            </div>

            {/* Write Testimonial Trigger */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg hover:bg-[var(--color-primary-light)] dark:bg-[var(--color-accent)] dark:text-slate-950 dark:hover:bg-[#f2d263] text-xs sm:text-sm font-medium transition-all duration-300 shadow-md cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>Gửi Đánh Giá</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {filteredTestimonials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#121824] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <MessageSquare size={48} className="text-slate-300 dark:text-slate-700 mb-4 animate-bounce" />
              <p className="text-slate-500 dark:text-slate-400 text-lg">Chưa có ý kiến đánh giá nào trong danh mục này.</p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="mt-4 text-[var(--color-accent)] hover:underline text-sm font-medium"
              >
                Xem tất cả
              </button>
            </div>
          ) : viewMode === 'carousel' ? (
            /* Carousel Presentation (Luxurious Single Highlight Frame) */
            <div className="relative max-w-4xl mx-auto py-6">
              {/* Golden quotes decoration */}
              <div className="absolute top-0 left-0 -translate-x-6 -translate-y-6 opacity-10 text-[var(--color-accent)] dark:text-[#E5C047] pointer-events-none">
                <Quote size={120} strokeWidth={1} />
              </div>

              {/* Slider Content Panel */}
              <div className="relative overflow-hidden bg-white dark:bg-[#121824] rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800/80 p-8 md:p-14 transition-all duration-300">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  {filteredTestimonials.map((item, index) => {
                    if (index !== currentIndex) return null;
                    return (
                      <motion.div
                        key={item.id}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="flex flex-col items-center text-center md:text-left md:items-start"
                      >
                        {/* Rating and date */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between w-full mb-6 md:mb-8 gap-4">
                          <div className="flex items-center gap-1 justify-center md:justify-start">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={18}
                                className={i < item.rating ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-slate-200 dark:text-slate-800'}
                              />
                            ))}
                          </div>
                          {item.date && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium font-sans">
                              {item.date}
                            </span>
                          )}
                        </div>

                        {/* Quote Statement */}
                        <p className="text-lg sm:text-xl md:text-2xl font-serif text-slate-800 dark:text-slate-200 italic leading-relaxed mb-8 select-none text-center md:text-left">
                          "{item.quote}"
                        </p>

                        {/* Customer Metadata Card */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full border-t border-slate-100 dark:border-slate-800 pt-6 md:pt-8 mt-auto">
                          {/* Avatar Circle */}
                          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 dark:bg-amber-400/10 flex items-center justify-center text-[var(--color-primary)] dark:text-[#E5C047] border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                            {item.company ? <Building size={24} /> : <User size={24} />}
                          </div>

                          <div className="text-center sm:text-left">
                            <h4 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                              {item.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans">
                              {item.role} {item.company && `• ${item.company}`}
                            </p>
                            <span className="inline-block mt-1.5 px-3 py-1 bg-slate-100 dark:bg-[#1B2336] text-[var(--color-primary)] dark:text-[#CBD5E1] border border-slate-100 dark:border-[#26324D] rounded-full text-[10px] sm:text-xs font-semibold tracking-wide uppercase">
                              {item.categoryLabel}
                            </span>
                          </div>

                          {/* Stamp decoration for Custom / verified feedback */}
                          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/15 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                            <CheckCircle size={14} />
                            <span>Khách Hàng Thực Tế</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Navigation Actions */}
              {filteredTestimonials.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={handlePrev}
                    className="absolute top-1/2 -left-4 sm:-left-12 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-[#121824] hover:bg-slate-50 dark:hover:bg-[#1B2336] text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-800 transition-all cursor-pointer active:scale-95"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    className="absolute top-1/2 -right-4 sm:-right-12 -translate-y-1/2 w-12 h-12 rounded-full bg-white dark:bg-[#121824] hover:bg-slate-50 dark:hover:bg-[#1B2336] text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-800 transition-all cursor-pointer active:scale-95"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Bullet Slide Indicators */}
                  <div className="flex items-center justify-center gap-2.5 mt-8">
                    {filteredTestimonials.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setDirection(idx > currentIndex ? 1 : -1);
                          setCurrentIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === currentIndex
                            ? 'w-8 bg-[var(--color-primary)] dark:bg-[var(--color-accent)]'
                            : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Elegant Grid Layout with individual card entries */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredTestimonials.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: Math.min(index * 0.1, 0.4) }}
                  className="bg-white dark:bg-[#121824] rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group"
                >
                  {/* Subtle golden quoting marks */}
                  <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 text-[var(--color-accent)] dark:text-[#E5C047] transition-all">
                    <Quote size={48} />
                  </div>

                  <div>
                    {/* Star Rating & Category label */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < item.rating ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-slate-200 dark:text-slate-800'}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] dark:text-[#E5C047]">
                        {item.categoryLabel}
                      </span>
                    </div>

                    {/* Quotation text */}
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 italic mb-6 leading-relaxed font-serif">
                      "{item.quote}"
                    </p>
                  </div>

                  {/* Customer author section */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 dark:bg-amber-400/10 flex items-center justify-center text-[var(--color-primary)] dark:text-[#E5C047] text-sm shrink-0">
                      {item.company ? <Building size={18} /> : <User size={18} />}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-sans">
                        {item.role} {item.company && `• ${item.company}`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Review Submission Modal (Luxurious and accessible fields) */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#121824] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 z-10"
            >
              {/* Gold luxury border top Accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[var(--color-primary)]"></div>

              {/* Close Button */}
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#1B2336] text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className="p-6 sm:p-8">
                {/* Form Header */}
                <div className="text-center sm:text-left mb-6">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Chia Sẻ Trải Nghiệm Của Quý Khách
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                    Đánh giá của bạn là động lực to lớn giúp đội ngũ Luật sư Ánh Dương không ngừng hoàn thiện dịch vụ.
                  </p>
                </div>

                {/* Form Elements */}
                {formSuccess ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-800 shadow-sm animate-bounce">
                      <CheckCircle size={36} />
                    </div>
                    <h4 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Gửi Thành Công!
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Chân thành cảm ơn những ý kiến quý báu từ Quý khách.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Full Name & Role */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                          Họ và tên *
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className="w-full px-4 py-2.5 rounded-lg border text-sm font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                          Chức vụ / Vị trí
                        </label>
                        <input
                          type="text"
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value)}
                          placeholder="Ví dụ: Giám đốc Điều hành"
                          className="w-full px-4 py-2.5 rounded-lg border text-sm font-sans"
                        />
                      </div>
                    </div>

                    {/* Company Name & Legal Field */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                          Tên công ty / Đơn vị
                        </label>
                        <input
                          type="text"
                          value={formCompany}
                          onChange={(e) => setFormCompany(e.target.value)}
                          placeholder="Ví dụ: Công ty ABC (Không bắt buộc)"
                          className="w-full px-4 py-2.5 rounded-lg border text-sm font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                          Lĩnh vực pháp lý tư vấn *
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-lg border text-sm font-sans bg-white dark:bg-[#0D121D] cursor-pointer"
                        >
                          <option value="corporate">Tư vấn Doanh nghiệp & M&A</option>
                          <option value="investment">Đầu tư Nước ngoài & Dự án</option>
                          <option value="dispute">Tranh chấp & Tranh tụng</option>
                          <option value="individual">Dân sự & Cá nhân</option>
                        </select>
                      </div>
                    </div>

                    {/* Star Rating selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        Mức độ hài lòng *
                      </label>
                      <div className="flex items-center gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => setFormRating(starValue)}
                            className="text-2xl cursor-pointer focus:outline-none hover:scale-110 transition-all"
                          >
                            <Star
                              className={
                                starValue <= formRating
                                  ? 'fill-[var(--color-accent)] text-[var(--color-accent)]'
                                  : 'text-slate-200 dark:text-slate-800'
                              }
                              size={28}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-3">
                          {formRating}/5 điểm hài lòng
                        </span>
                      </div>
                    </div>

                    {/* Review text */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        Ý kiến nhận xét của quý khách *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formQuote}
                        onChange={(e) => setFormQuote(e.target.value)}
                        placeholder="Nội dung ý kiến phản hồi về năng lực, thái độ phục vụ hay hiệu quả công việc của luật sư..."
                        className="w-full px-4 py-3 rounded-lg border text-sm font-sans resize-none"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(false)}
                        className="px-5 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1B2336] text-sm font-medium transition cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] dark:bg-[var(--color-accent)] dark:text-slate-950 dark:hover:bg-[#f2d263] rounded-lg text-sm font-semibold shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        Hoàn tất gửi
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
