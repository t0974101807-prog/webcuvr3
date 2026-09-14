import { useState, useEffect } from 'react';
import { Link as ScrollLink } from 'react-scroll';
const Link = ScrollLink as any;
import { Menu, X, User, LogOut, ChevronDown, Briefcase, LayoutDashboard, Key, Phone, Mail, MapPin, Sun, Moon, Scale, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { navigateTo, fetchApi } from '../utils/api';
import { useContactSettings } from '../hooks/useContactSettings';
import { useLanguage } from '../hooks/useLanguage';

interface NavbarProps {
  onLoginClick: () => void;
  isLoggedIn?: boolean;
  user?: { name: string; role?: string; avatar?: string; title?: string } | null;
  onLogout?: () => void;
  onDashboardClick?: () => void;
  onWorkClick?: () => void;
  onClientPortalClick?: () => void;
  onChangePasswordClick?: () => void;
  isLanding?: boolean;
}

export default function Navbar({ onLoginClick, isLoggedIn = false, user, onLogout, onDashboardClick, onWorkClick, onClientPortalClick, onChangePasswordClick, isLanding = true }: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();

  const tSub = (viText: string) => {
    if (language === 'vi') return viText;
    const subDict: Record<string, string> = {
      // Practice areas
      "Doanh nghiệp": "Enterprise Law",
      "Vụ việc dân sự": "Civil Cases",
      "Lao động": "Labor Law",
      "Mua bán & Sáp nhập": "M&A",
      "Hôn nhân và Gia đình": "Marriage & Family",
      "Tư vấn hợp đồng": "Contract Advisory",
      "Đầu tư trong & ngoài nước": "Domestic & Foreign Investment",
      "Bất động sản": "Real Estate",
      "Tranh tụng": "Litigation",
      "Hàng hải & Vận chuyển": "Maritime & Shipping",
      "Thuế": "Taxation",
      "Di trú & Visa": "Immigration & Visa",
      "Hộ tịch": "Civil Status",

      // Legal services
      "Dịch vụ luật sư": "Lawyer Services",
      "Thành lập công ty": "Company Setup",
      "Giấy phép kinh doanh": "Business Licenses",
      "Đăng ký hộ kinh doanh": "Household Business Registration",
      "Đăng ký mã số thuế": "Tax ID Registration",
      "Quyết toán thuế": "Tax Settlement",
      "Dịch vụ làm visa": "Visa Services",
      "Dịch vụ ly hôn": "Divorce Services",
      "Tạm ngừng kinh doanh": "Business Suspension",
      "Kiểm nghiệm sản phẩm": "Product Testing",
      "Lý lịch tư pháp": "Criminal Records",
      "Báo cáo tài chính": "Financial Reporting",
      "Hoàn thuế thu nhập cá nhân": "PIT Refund",
      "Đăng ký kinh doanh": "Business Registration",
      "Công bố sản phẩm": "Product Declaration",
      "Báo cáo thuế": "Tax Reporting",
      "Giấy chứng nhận vệ sinh an toàn thực phẩm": "Food Safety Certificate",
      "Giải thể công ty": "Company Dissolution",
      "Đầu tư nước ngoài": "Foreign Investment",
      "Làm giấy khai sinh": "Birth Certificate Setup",

      // Recruitment sub tabs
      "Cơ hội nghề nghiệp": "Career Opportunities",
      "Môi trường & Phúc lợi": "Culture & Benefits",
      "Quy trình tuyển dụng": "Hiring Process",
      "Nộp hồ sơ trực tuyến": "Apply Online",

      // Tools tabs
      "Tính án phí Tòa án": "Court Fee Calculator",
      "Tính bảng kê lãi": "Interest Calculator",
      "Biểu mẫu pháp lý": "Legal Templates",
      "Bản án công bố": "Published Judgments",
      "Án lệ Tối cao": "Supreme Precedents",
      "Bảng giá đất nhà nước": "State Land Pricing",
    };
    return subDict[viText] || viText;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const shouldShowSolid = scrolled || !isLanding;
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileSrvOpen, setMobileSrvOpen] = useState(false);
  const [mobileActivityOpen, setMobileActivityOpen] = useState(false);
  const [mobileRecruitmentOpen, setMobileRecruitmentOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [officeCount, setOfficeCount] = useState<number>(8);
  const { settings } = useContactSettings();
  const [navServices, setNavServices] = useState<any[]>([]);
  const [navLegalServices, setNavLegalServices] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/api/services')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNavServices(data);
        }
      })
      .catch(err => console.error("Error loading services for navbar:", err));

    fetchApi('/api/legal-services')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNavLegalServices(data);
        }
      })
      .catch(err => console.error("Error loading legal services for navbar:", err));
  }, []);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("theme") || localStorage.getItem("lawfirm_theme_mode");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Initial sync with localStorage on mount
    try {
      const saved = localStorage.getItem("theme") || localStorage.getItem("lawfirm_theme_mode");
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
      } else if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
      } else {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      }
    } catch {}

    const handleGlobalThemeEvent = (e: any) => {
      if (e.detail && typeof e.detail.isDarkMode === "boolean") {
        setIsDarkMode(e.detail.isDarkMode);
      } else {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme" || e.key === "lawfirm_theme_mode") {
        const isDark = e.newValue === "dark";
        setIsDarkMode(isDark);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    window.addEventListener("global-theme-changed", handleGlobalThemeEvent);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("global-theme-changed", handleGlobalThemeEvent);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
        localStorage.setItem("lawfirm_theme_mode", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
        localStorage.setItem("lawfirm_theme_mode", "light");
      } catch {}
    }
    window.dispatchEvent(new CustomEvent("global-theme-changed", { detail: { isDarkMode: nextMode } }));
  };

  useEffect(() => {
    fetchApi('/api/offices')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch');
      })
      .then(data => {
        if (Array.isArray(data)) {
          setOfficeCount(data.length);
        }
      })
      .catch(err => console.error("Error fetching offices count in Navbar:", err));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / windowHeight) * 100}`;
      setScrollProgress(Number(scroll));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSrvClick = (srvName: string) => {
    navigateTo(`/dich-vu?item=${encodeURIComponent(srvName)}`);
  };

  const handleActivityClick = (actName: string) => {
    navigateTo(`/linh-vuc-hoat-dong?item=${encodeURIComponent(actName)}`);
  };

  const handleAboutClick = (tabName: string, toSection: string) => {
    navigateTo('/gioi-thieu');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-about-tab', { detail: { tab: tabName } }));
    }, 150);
  };

  const handleRecruitmentClick = (tabName: string, toSection: string) => {
    navigateTo('/tuyen-dung');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-recruitment-tab', { detail: { tab: tabName } }));
    }, 150);
  };

  const handleToolsClick = (tabName: string, toSection: string) => {
    navigateTo('/cong-cu');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-tool-tab', { detail: { tab: tabName } }));
    }, 150);
  };

  const handleLinkClick = (e: React.MouseEvent | undefined, link: { name: string; to: string; key?: string }) => {
    const key = link.key || link.name;
    // If the user is currently on the landing page, let react-scroll scroll smoothly to sections
    if (isLanding) {
      // "Công cụ" does not have a section on the landing page, so always navigate
      if (key === 'Công cụ') {
        if (e) e.preventDefault();
        navigateTo('/cong-cu');
        return;
      }
      
      // Let react-scroll do the smooth scrolling for everything else on the landing page
      if (e) {
        e.preventDefault();
      }
      return;
    }

    // If the user is on a separate subpage, clicking an item should navigate to that subpage
    if (e) e.preventDefault();
    
    if (key === 'Giới thiệu') {
      navigateTo('/gioi-thieu');
      return;
    }

    if (key === 'Lĩnh vực hoạt động') {
      navigateTo('/linh-vuc-hoat-dong');
      return;
    }

    if (key === 'Dịch vụ') {
      navigateTo('/dich-vu');
      return;
    }

    if (key === 'Tuyển dụng') {
      navigateTo('/tuyen-dung');
      return;
    }

    if (key === 'Công cụ') {
      navigateTo('/cong-cu');
      return;
    }

    if (key === 'Liên hệ') {
      navigateTo('/lien-he');
      return;
    }

    // Default back to home and scroll to section
    navigateTo('/');
    setTimeout(() => {
      const el = document.getElementById(link.to);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (key === 'Lĩnh vực hoạt động') {
        const srvEl = document.getElementById('services');
        if (srvEl) srvEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (key === 'Dịch vụ') {
        const lSrvEl = document.getElementById('legal-services');
        if (lSrvEl) lSrvEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 300);
  };

  const navLinks = [
    { name: t('nav.home', 'Trang chủ'), to: 'hero', key: 'Trang chủ' },
    { name: t('nav.about', 'Giới thiệu'), to: 'about', key: 'Giới thiệu' },
    { name: t('nav.services', 'Lĩnh vực hoạt động'), to: 'services', key: 'Lĩnh vực hoạt động' },
    { name: t('nav.legalServices', 'Dịch vụ'), to: 'legal-services', key: 'Dịch vụ' },
    { name: t('nav.recruitment', 'Tuyển dụng'), to: 'recruitment', key: 'Tuyển dụng' },
    { name: t('nav.tools', 'Công cụ'), to: 'tools', key: 'Công cụ' },
    { name: t('nav.contact', 'Liên hệ'), to: 'contact', key: 'Liên hệ' },
  ];

  const defaultServices = [
    "Doanh nghiệp",
    "Vụ việc dân sự",
    "Lao động",
    "Mua bán & Sáp nhập",
    "Hôn nhân và Gia đình",
    "Tư vấn hợp đồng",
    "Đầu tư trong & ngoài nước",
    "Bất động sản",
    "Tranh tụng",
    "Hàng hải & Vận chuyển",
    "Thuế",
    "Di trú & Visa",
    "Hộ tịch"
  ];

  const defaultLegalServices = [
    "Dịch vụ luật sư",
    "Thành lập công ty",
    "Giấy phép kinh doanh",
    "Đăng ký hộ kinh doanh",
    "Đăng ký mã số thuế",
    "Quyết toán thuế",
    "Dịch vụ làm visa",
    "Dịch vụ ly hôn",
    "Tạm ngừng kinh doanh",
    "Kiểm nghiệm sản phẩm",
    "Lý lịch tư pháp",
    "Báo cáo tài chính",
    "Hoàn thuế thu nhập cá nhân",
    "Đăng ký kinh doanh",
    "Công bố sản phẩm",
    "Báo cáo thuế",
    "Giấy chứng nhận vệ sinh an toàn thực phẩm",
    "Giải thể công ty",
    "Đầu tư nước ngoài",
    "Làm giấy khai sinh"
  ];

  const activeServices = navServices.length > 0 ? navServices.map(s => s.title) : defaultServices;
  const activeLegalServices = navLegalServices.length > 0 ? navLegalServices.map(s => s.title) : defaultLegalServices;

  const halfServices = Math.ceil(activeServices.length / 2);
  const servicesCol1 = activeServices.slice(0, halfServices);
  const servicesCol2 = activeServices.slice(halfServices);

  const halfLegalServices = Math.ceil(activeLegalServices.length / 2);
  const legalServicesCol1 = activeLegalServices.slice(0, halfLegalServices);
  const legalServicesCol2 = activeLegalServices.slice(halfLegalServices);

  const translateRole = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'quản trị viên':
        return 'Quản trị viên';
      case 'director':
      case 'giám đốc':
        return 'Giám đốc';
      case 'lawyer':
      case 'luật sư':
        return 'Luật sư';
      case 'client':
      case 'khách':
        return 'Khách hàng';
      default:
        return role || 'Thành viên';
    }
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[var(--color-accent)] z-[60] origin-left"
        style={{ scaleX: scrollProgress / 100 }}
      />
      
      {/* Top Info Bar - inspired by high-end law firms like ACC */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 h-8 hidden md:flex items-center justify-between px-8 bg-[var(--color-primary)] text-white/80 text-[11px] font-medium border-b border-white/5 transition-all duration-300 ${
          scrolled ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Phone size={11} className="text-[var(--color-accent)] fill-transparent" />
            {t('nav.freeConsultation', 'Tổng đài tư vấn miễn phí:')} <strong className="text-[var(--color-accent)] font-semibold">{settings.hotline_consult}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Mail size={11} className="text-[var(--color-accent)]" />
            Email: <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">{settings.email}</a>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="network" smooth={true} duration={500} className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--color-accent)] transition-colors">
            <MapPin size={11} className="text-[var(--color-accent)]" />
            {t('nav.branches', `Hệ thống ${officeCount} Chi nhánh`)}
          </Link>
          <span className="text-white/20">|</span>
          <span className="text-[var(--color-accent)] font-bold tracking-wider uppercase">{t('nav.consultation247', 'Tư vấn Pháp luật 24/7')}</span>
        </div>
      </div>

      <nav
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          shouldShowSolid 
            ? 'top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md py-2 border-b border-slate-100 dark:border-slate-800' 
            : 'top-0 md:top-8 bg-black/10 backdrop-blur-sm py-4 border-b border-white/5'
        }`}
      >
      <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2.5">
            <img 
              src={settings.logo_url || "/logo.svg"} 
              alt="Ánh Dương Law Logo" 
              className="h-9 sm:h-10 w-auto object-contain cursor-pointer"
              onClick={() => navigateTo('/')}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/logo.svg')) {
                  target.src = '/logo.svg';
                }
              }}
            />
            <a 
              href="/"
              onClick={(e) => { e.preventDefault(); navigateTo('/'); }}
              className={`font-serif text-sm sm:text-base lg:text-md xl:text-lg 2xl:text-xl font-bold tracking-wider ${shouldShowSolid ? 'text-[var(--color-primary)] dark:text-white' : 'text-white'} whitespace-nowrap`}
            >
              ÁNH DƯƠNG <span className="text-[var(--color-accent)]">LAW</span>
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-4 2xl:gap-6 flex-nowrap shrink-0">
            {navLinks.map((link) => {
              const key = link.key || link.name;
              if (key === 'Giới thiệu') {
                return (
                  <div key={link.name} className="relative group/abt py-1">
                    <Link
                      to={link.to}
                      spy={true}
                      smooth={true}
                      offset={-70}
                      duration={500}
                      onClick={() => handleLinkClick(undefined, link)}
                      activeClass="!text-[var(--color-primary)] font-extrabold"
                      className={`relative cursor-pointer text-[11px] xl:text-xs 2xl:text-sm font-semibold transition-colors duration-300 py-1 flex items-center gap-1 ${
                        shouldShowSolid ? 'text-[var(--color-text-dark)] hover:text-[var(--color-primary)]' : 'text-white hover:text-[var(--color-accent)]'
                      } whitespace-nowrap`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown size={14} className="transition-transform duration-300 group-hover/abt:rotate-180" />
                    </Link>

                    {/* Giới thiệu Dropdown Menu */}
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-4 opacity-0 invisible group-hover/abt:opacity-100 group-hover/abt:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover/abt:translate-y-0 z-50 flex flex-col gap-1">
                      {[
                        { label: "Giới thiệu chung", tab: "overview" },
                        { label: "Tầm nhìn - Sứ mệnh", tab: "values" },
                        { label: "Sơ đồ tổ chức", tab: "structure" },
                        { label: `Hệ thống ${officeCount} Chi nhánh`, tab: "branches" },
                        { label: "Thành tựu & Năng lực", tab: "achievements" }
                      ].map((sub) => (
                        <button
                          key={sub.tab}
                          onClick={() => handleAboutClick(sub.tab, link.to)}
                          className="text-left text-xs xl:text-sm py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[var(--color-primary)] transition-all font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                          {tSub(sub.label)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (key === 'Lĩnh vực hoạt động') {
                return (
                  <div key={link.name} className="relative group/act py-1">
                    <Link
                      to={link.to}
                      spy={true}
                      smooth={true}
                      offset={-70}
                      duration={500}
                      onClick={() => handleLinkClick(undefined, link)}
                      activeClass="!text-[var(--color-primary)] font-extrabold"
                      className={`relative cursor-pointer text-[11px] xl:text-xs 2xl:text-sm font-semibold transition-colors duration-300 py-1 flex items-center gap-1 ${
                        shouldShowSolid ? 'text-[var(--color-text-dark)] hover:text-[var(--color-primary)]' : 'text-white hover:text-[var(--color-accent)]'
                      } whitespace-nowrap`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown size={14} className="transition-transform duration-300 group-hover/act:rotate-180" />
                    </Link>

                    {/* Huge Dropdown Menu with 2 columns of items */}
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[550px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-6 opacity-0 invisible group-hover/act:opacity-100 group-hover/act:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover/act:translate-y-0 z-50 grid grid-cols-2 gap-x-6 gap-y-1">
                      {/* Column 1 */}
                      <div className="flex flex-col">
                        {servicesCol1.map((act) => (
                          <button
                            key={act}
                            onClick={() => handleActivityClick(act)}
                            className="text-left text-xs xl:text-sm py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[var(--color-primary)] transition-all font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                            {tSub(act)}
                          </button>
                        ))}
                      </div>

                      {/* Column 2 */}
                      <div className="flex flex-col">
                        {servicesCol2.map((act) => (
                          <button
                            key={act}
                            onClick={() => handleActivityClick(act)}
                            className="text-left text-xs xl:text-sm py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[var(--color-primary)] transition-all font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                            {tSub(act)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (key === 'Dịch vụ') {
                return (
                  <div key={link.name} className="relative group/srv py-1">
                    <Link
                      to={link.to}
                      spy={true}
                      smooth={true}
                      offset={-70}
                      duration={500}
                      onClick={() => handleLinkClick(undefined, link)}
                      activeClass="!text-[var(--color-primary)] font-extrabold"
                      className={`relative cursor-pointer text-[11px] xl:text-xs 2xl:text-sm font-semibold transition-colors duration-300 py-1 flex items-center gap-1 ${
                        shouldShowSolid ? 'text-[var(--color-text-dark)] hover:text-[var(--color-primary)]' : 'text-white hover:text-[var(--color-accent)]'
                      } whitespace-nowrap`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown size={14} className="transition-transform duration-300 group-hover/srv:rotate-180" />
                    </Link>

                    {/* Huge Dropdown Menu with 2 columns */}
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[650px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-6 opacity-0 invisible group-hover/srv:opacity-100 group-hover/srv:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover/srv:translate-y-0 z-50 grid grid-cols-2 gap-x-6 gap-y-1">
                      {/* Column 1 */}
                      <div className="flex flex-col">
                        {legalServicesCol1.map((srv) => (
                          <button
                            key={srv}
                            onClick={() => handleSrvClick(srv)}
                            className="text-left text-xs xl:text-sm py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[var(--color-primary)] transition-all font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                            {tSub(srv)}
                          </button>
                        ))}
                      </div>

                      {/* Column 2 */}
                      <div className="flex flex-col">
                        {legalServicesCol2.map((srv) => (
                          <button
                            key={srv}
                            onClick={() => handleSrvClick(srv)}
                            className="text-left text-xs xl:text-sm py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[var(--color-primary)] transition-all font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                            {tSub(srv)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (key === 'Tuyển dụng') {
                return (
                  <div key={link.name} className="relative group/rec py-1">
                    <Link
                      to={link.to}
                      spy={true}
                      smooth={true}
                      offset={-70}
                      duration={500}
                      onClick={() => handleLinkClick(undefined, link)}
                      activeClass="!text-[var(--color-primary)] font-extrabold"
                      className={`relative cursor-pointer text-[11px] xl:text-xs 2xl:text-sm font-semibold transition-colors duration-300 py-1 flex items-center gap-1 ${
                        shouldShowSolid ? 'text-[var(--color-text-dark)] hover:text-[var(--color-primary)]' : 'text-white hover:text-[var(--color-accent)]'
                      } whitespace-nowrap`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown size={14} className="transition-transform duration-300 group-hover/rec:rotate-180" />
                    </Link>

                    {/* Tuyển dụng Dropdown Menu */}
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-4 opacity-0 invisible group-hover/rec:opacity-100 group-hover/rec:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover/rec:translate-y-0 z-50 flex flex-col gap-1">
                      {[
                        { label: "Cơ hội nghề nghiệp", tab: "jobs" },
                        { label: "Môi trường & Phúc lợi", tab: "culture" },
                        { label: "Quy trình tuyển dụng", tab: "process" },
                        { label: "Nộp hồ sơ trực tuyến", tab: "apply" }
                      ].map((sub) => (
                        <button
                          key={sub.tab}
                          onClick={() => handleRecruitmentClick(sub.tab, link.to)}
                          className="text-left text-xs xl:text-sm py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[var(--color-primary)] transition-all font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                          {tSub(sub.label)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (key === 'Công cụ') {
                return (
                  <div key={link.name} className="relative group/tool py-1">
                    <Link
                      to={link.to}
                      spy={true}
                      smooth={true}
                      offset={-70}
                      duration={500}
                      onClick={() => handleLinkClick(undefined, link)}
                      activeClass="!text-[var(--color-primary)] font-extrabold"
                      className={`relative cursor-pointer text-[11px] xl:text-xs 2xl:text-sm font-semibold transition-colors duration-300 py-1 flex items-center gap-1 ${
                        shouldShowSolid ? 'text-[var(--color-text-dark)] hover:text-[var(--color-primary)]' : 'text-white hover:text-[var(--color-accent)]'
                      } whitespace-nowrap`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown size={14} className="transition-transform duration-300 group-hover/tool:rotate-180" />
                    </Link>

                    {/* Công cụ Dropdown Menu */}
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-4 opacity-0 invisible group-hover/tool:opacity-100 group-hover/tool:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover/tool:translate-y-0 z-50 flex flex-col gap-1">
                      {[
                        { label: "Tính án phí Tòa án", tab: "fee" },
                        ...(user ? [{ label: "Tính bảng kê lãi", tab: "billing" }] : []),
                        { label: "Biểu mẫu pháp lý", tab: "forms" },
                        { label: "Bản án công bố", tab: "judgments" },
                        { label: "Án lệ Tối cao", tab: "precedents" },
                        { label: "Bảng giá đất nhà nước", tab: "land" }
                      ].map((sub) => (
                        <button
                          key={sub.tab}
                          onClick={() => handleToolsClick(sub.tab, link.to)}
                          className="text-left text-xs xl:text-sm py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-[var(--color-primary)] transition-all font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                          {tSub(sub.label)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.to}
                  spy={true}
                  smooth={true}
                  offset={-70}
                  duration={500}
                  onClick={() => handleLinkClick(undefined, link)}
                  activeClass="!text-[var(--color-primary)] after:!scale-x-100 font-extrabold"
                  className={`relative cursor-pointer text-[11px] xl:text-xs 2xl:text-sm font-semibold transition-colors duration-300 py-1 ${
                    shouldShowSolid ? 'text-[var(--color-text-dark)] hover:text-[var(--color-primary)]' : 'text-white hover:text-[var(--color-accent)]'
                  } whitespace-nowrap after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-current after:transform after:scale-x-0 after:origin-left after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Language Switcher Button */}
            <button
              id="navbar-language-toggle-desktop"
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                shouldShowSolid
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
              }`}
              title={language === 'vi' ? "Switch to English" : "Chuyển sang Tiếng Việt"}
            >
              <Globe size={13} className="text-[var(--color-accent)] shrink-0" />
              <span>{language === 'vi' ? 'VI' : 'EN'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              id="navbar-theme-toggle-desktop"
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                shouldShowSolid
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isDarkMode ? (language === 'vi' ? "Chuyển sang Giao diện Sáng (Light Mode)" : "Switch to Light Mode") : (language === 'vi' ? "Chuyển sang Giao diện Tối (Dark Mode)" : "Switch to Dark Mode")}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun size={15} className="text-amber-400 fill-amber-400/20 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon size={15} className="text-indigo-200 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 xl:gap-2.5 flex-nowrap">
                {user?.role !== 'client' ? (
                  <button
                    onClick={onWorkClick}
                    className={`flex items-center justify-center px-3 xl:px-4 py-1.5 xl:py-2 rounded-full border transition-all hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] duration-300 hover:text-white group whitespace-nowrap ${
                      shouldShowSolid
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-white/50 text-white hover:border-white bg-white/5'
                    }`}
                  >
                    <span className="text-[11px] xl:text-xs 2xl:text-sm font-semibold">Không gian làm việc</span>
                  </button>
                ) : (
                  <button
                    onClick={onClientPortalClick}
                    className={`flex items-center justify-center px-3 xl:px-4 py-1.5 xl:py-2 rounded-full border transition-all hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] duration-300 hover:text-white group whitespace-nowrap ${
                      shouldShowSolid
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-white/50 text-white hover:border-white bg-white/5'
                    }`}
                  >
                    <span className="text-[11px] xl:text-xs 2xl:text-sm font-semibold">Hồ sơ của tôi</span>
                  </button>
                )}

                <div className="relative group ml-0.5 shrink-0">
                  <button
                    className={`flex items-center gap-1 text-[11px] xl:text-xs 2xl:text-sm font-semibold py-1.5 transition-all duration-300 ${
                      shouldShowSolid ? 'text-gray-700 hover:text-[var(--color-primary)]' : 'text-white hover:text-white/80'
                    }`}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="max-w-[80px] xl:max-w-[120px] truncate">Hi, {user?.name}</span>
                    <ChevronDown size={14} className="shrink-0" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right border border-gray-100 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tài khoản</p>
                      <p className="text-xs font-bold text-gray-800 truncate mt-0.5">{user?.name}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5 uppercase tracking-widest">{user?.title || translateRole(user?.role)}</p>
                    </div>

                    {user?.role !== 'client' && (
                      <button
                        onClick={onWorkClick}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                      >
                        <Briefcase size={14} className="text-gray-400" />
                        Công việc (ERP)
                      </button>
                    )}

                    {isLoggedIn && user?.role && user?.role !== 'client' && (
                      <button
                        onClick={onDashboardClick}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                      >
                        <LayoutDashboard size={14} className="text-gray-400" />
                        Quản trị hệ thống
                      </button>
                    )}

                    <button
                      onClick={onClientPortalClick}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                    >
                      <User size={14} className="text-gray-400" />
                      {user?.role === 'client' ? 'Hồ sơ pháp lý' : 'Cổng khách hàng'}
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={onChangePasswordClick}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                    >
                      <Key size={14} className="text-gray-400" />
                      Đổi mật khẩu
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                    >
                      <LogOut size={14} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className={`flex items-center gap-1.5 px-3 xl:px-4 py-1.5 xl:py-2 rounded-full border transition-all hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] duration-300 hover:text-white ${
                  shouldShowSolid
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-white text-white bg-white/5'
                }`}
              >
                <User size={14} />
                <span className="text-[11px] xl:text-xs 2xl:text-sm font-semibold">Đăng nhập</span>
              </button>
            )}
          </div>

          {/* Mobile Menu & Action Buttons */}
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Theme Toggle Button */}
            <button
              id="navbar-theme-toggle-mobile"
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm active:scale-95 ${
                shouldShowSolid
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isDarkMode ? (language === 'vi' ? "Chuyển sang Giao diện Sáng (Light Mode)" : "Switch to Light Mode") : (language === 'vi' ? "Chuyển sang Giao diện Tối (Dark Mode)" : "Switch to Dark Mode")}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun size={15} className="text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon size={15} className="text-indigo-200" />
              )}
            </button>

            {/* Mobile Language Switcher Button */}
            <button
              id="navbar-language-toggle-mobile"
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                shouldShowSolid
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
              }`}
              title={language === 'vi' ? "Switch to English" : "Chuyển sang Tiếng Việt"}
            >
              <Globe size={13} className="text-[var(--color-accent)] shrink-0" />
              <span>{language === 'vi' ? 'VI' : 'EN'}</span>
            </button>
            <button
              id="navbar-hamburger-btn"
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg ${shouldShowSolid ? 'text-gray-700 dark:text-gray-200' : 'text-white'}`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-slate-900 shadow-lg overflow-hidden max-h-[85vh] overflow-y-auto border-b border-slate-100 dark:border-slate-800"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {/* Mobile Drawer Theme Quick Switcher */}
              <div className="flex items-center justify-between px-3 py-2.5 mb-2 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  {isDarkMode ? (
                    <Sun size={16} className="text-amber-400 fill-amber-400/20" />
                  ) : (
                    <Moon size={16} className="text-indigo-400" />
                  )}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {isDarkMode ? (language === 'vi' ? 'Giao diện Tối' : 'Dark Mode') : (language === 'vi' ? 'Giao diện Sáng' : 'Light Mode')}
                  </span>
                </div>
                <button
                  id="navbar-theme-toggle-drawer"
                  onClick={toggleTheme}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {isDarkMode ? (
                    <>
                      <Sun size={13} className="text-amber-400" />
                      <span>{language === 'vi' ? 'Chuyển Sáng' : 'Light'}</span>
                    </>
                  ) : (
                    <>
                      <Moon size={13} className="text-indigo-400" />
                      <span>{language === 'vi' ? 'Chuyển Tối' : 'Dark'}</span>
                    </>
                  )}
                </button>
              </div>
              {isLoggedIn && (
                <div className="pb-4 mb-2 border-b border-gray-100 space-y-2">
                  <div className="flex items-center justify-between px-2 pt-2">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-lg">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-500">Xin chào,</div>
                        <div className="font-bold text-gray-800 leading-tight">{user?.name}</div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5 tracking-wider">{user?.title || translateRole(user?.role)}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          onChangePasswordClick?.();
                          setIsOpen(false);
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        title="Đổi mật khẩu"
                      >
                        <User size={20} />
                      </button>
                      <button
                        onClick={() => {
                          onLogout?.();
                          setIsOpen(false);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Đăng xuất"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-2">
                    {user?.role !== 'client' && (
                      <button
                        onClick={() => {
                          onWorkClick?.();
                          setIsOpen(false);
                        }}
                        className="w-full py-2.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold text-sm hover:bg-[var(--color-primary)]/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Briefcase size={16} />
                        Công việc (ERP)
                      </button>
                    )}
                    {isLoggedIn && user?.role && user?.role !== 'client' && (
                      <button
                        onClick={() => {
                          onDashboardClick?.();
                          setIsOpen(false);
                        }}
                        className="w-full py-2.5 rounded-lg bg-purple-50 text-purple-700 font-semibold text-sm hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard size={16} />
                        Quản trị hệ thống
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onClientPortalClick?.();
                        setIsOpen(false);
                      }}
                      className="w-full py-2.5 rounded-lg bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <User size={16} />
                      {user?.role === 'client' ? 'Hồ sơ của tôi' : 'Cổng khách hàng'}
                    </button>
                  </div>
                </div>
              )}

              {navLinks.map((link) => {
                const key = link.key || link.name;
                if (key === 'Lĩnh vực hoạt động') {
                  return (
                    <div key={link.name} className="space-y-1">
                      <button
                        onClick={() => setMobileActivityOpen(!mobileActivityOpen)}
                        className="w-full flex justify-between items-center px-3 py-3 text-base font-medium text-gray-700 transition-all duration-300 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <span>{link.name}</span>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${mobileActivityOpen ? 'rotate-180 text-[var(--color-primary)] font-bold' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileActivityOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-4 pr-2 py-1 bg-slate-50/50 rounded-lg border border-slate-100 max-h-80 overflow-y-auto space-y-1"
                          >
                            {activeServices.map((act) => (
                              <button
                                key={act}
                                onClick={() => {
                                  setIsOpen(false);
                                  handleActivityClick(act);
                                }}
                                className="w-full text-left text-sm py-2 px-3 rounded hover:bg-slate-100 text-slate-700 hover:text-[var(--color-primary)] font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                                <span className="truncate">{tSub(act)}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                if (key === 'Dịch vụ') {
                  return (
                    <div key={link.name} className="space-y-1">
                      <button
                        onClick={() => setMobileSrvOpen(!mobileSrvOpen)}
                        className="w-full flex justify-between items-center px-3 py-3 text-base font-medium text-gray-700 transition-all duration-300 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <span>{link.name}</span>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${mobileSrvOpen ? 'rotate-180 text-[var(--color-primary)] font-bold' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileSrvOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-4 pr-2 py-1 bg-slate-50/50 rounded-lg border border-slate-100 max-h-80 overflow-y-auto space-y-1"
                          >
                            {activeLegalServices.map((srv) => (
                              <button
                                key={srv}
                                onClick={() => {
                                  setIsOpen(false);
                                  handleSrvClick(srv);
                                }}
                                className="w-full text-left text-sm py-2 px-3 rounded hover:bg-slate-100 text-slate-700 hover:text-[var(--color-primary)] font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                                <span className="truncate">{tSub(srv)}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                if (key === 'Tuyển dụng') {
                  return (
                    <div key={link.name} className="space-y-1">
                      <button
                        onClick={() => setMobileRecruitmentOpen(!mobileRecruitmentOpen)}
                        className="w-full flex justify-between items-center px-3 py-3 text-base font-medium text-gray-700 transition-all duration-300 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <span>{link.name}</span>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${mobileRecruitmentOpen ? 'rotate-180 text-[var(--color-primary)] font-bold' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileRecruitmentOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-4 pr-2 py-1 bg-slate-50/50 rounded-lg border border-slate-100 space-y-1"
                          >
                            {[
                              { label: "Cơ hội nghề nghiệp", tab: "jobs" },
                              { label: "Môi trường & Phúc lợi", tab: "culture" },
                              { label: "Quy trình tuyển dụng", tab: "process" },
                              { label: "Nộp hồ sơ trực tuyến", tab: "apply" }
                            ].map((sub) => (
                              <button
                                key={sub.tab}
                                onClick={() => {
                                  setIsOpen(false);
                                  handleRecruitmentClick(sub.tab, link.to);
                                }}
                                className="w-full text-left text-sm py-2 px-3 rounded hover:bg-slate-100 text-slate-700 hover:text-[var(--color-primary)] font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                                <span className="truncate">{tSub(sub.label)}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                if (key === 'Công cụ') {
                  return (
                    <div key={link.name} className="space-y-1">
                      <button
                        onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                        className="w-full flex justify-between items-center px-3 py-3 text-base font-medium text-gray-700 transition-all duration-300 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <span>{link.name}</span>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${mobileToolsOpen ? 'rotate-180 text-[var(--color-primary)] font-bold' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileToolsOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-4 pr-2 py-1 bg-slate-50/50 rounded-lg border border-slate-100 space-y-1"
                          >
                            {[
                              { label: "Tính án phí Tòa án", tab: "fee" },
                              ...(user ? [{ label: "Tính bảng kê lãi", tab: "billing" }] : []),
                              { label: "Biểu mẫu pháp lý", tab: "forms" },
                              { label: "Bản án công bố", tab: "judgments" },
                              { label: "Án lệ Tối cao", tab: "precedents" },
                              { label: "Bảng giá đất nhà nước", tab: "land" }
                            ].map((sub) => (
                              <button
                                key={sub.tab}
                                onClick={() => {
                                  setIsOpen(false);
                                  handleToolsClick(sub.tab, link.to);
                                }}
                                className="w-full text-left text-sm py-2 px-3 rounded hover:bg-slate-100 text-slate-700 hover:text-[var(--color-primary)] font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                                <span className="truncate">{tSub(sub.label)}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    to={link.to}
                    spy={true}
                    smooth={true}
                    offset={-70}
                    duration={500}
                    activeClass="!text-[var(--color-primary)] bg-gray-50"
                    onClick={() => { setIsOpen(false); handleLinkClick(undefined, link); }}
                    className="block px-3 py-3 text-base font-medium text-gray-700 transition-all duration-300 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    {link.name}
                  </Link>
                );
              })}
              {!isLoggedIn && (
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsOpen(false);
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <User size={18} />
                  <span>{t('nav.login', 'Đăng nhập')}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}