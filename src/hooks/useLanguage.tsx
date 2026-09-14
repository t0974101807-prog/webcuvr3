import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Comprehensive dictionary for international law firm landing page content
const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Navbar / Menu
    'nav.home': 'Trang chủ',
    'nav.about': 'Giới thiệu',
    'nav.services': 'Lĩnh vực hoạt động',
    'nav.legalServices': 'Dịch vụ',
    'nav.recruitment': 'Tuyển dụng',
    'nav.tools': 'Công cụ',
    'nav.contact': 'Liên hệ',
    'nav.workspace': 'Không gian làm việc',
    'nav.myProfile': 'Hồ sơ của tôi',
    'nav.admin': 'Quản trị hệ thống',
    'nav.hi': 'Xin chào',
    'nav.logout': 'Đăng xuất',
    'nav.freeConsultation': 'Tư vấn miễn phí:',
    'nav.consultation247': 'Tư vấn pháp luật 24/7',
    'nav.branches': 'Chi nhánh toàn quốc',
    'nav.personalInfo': 'Hồ sơ pháp lý',
    'nav.clientPortal': 'Cổng khách hàng',
    'nav.erpWork': 'Công việc (ERP)',
    'nav.account': 'Tài khoản',

    // Hero Section
    'hero.slogan': 'ĐỒNG HÀNH PHÁP LÝ VỮNG CHẮC CÙNG DOANH NGHIỆP VÀ CÁ NHÂN',
    'hero.title': 'CÔNG TY LUẬT TNHH ÁNH DƯƠNG',
    'hero.subtitle': 'Đội ngũ luật sư uy tín, chuyên nghiệp và tận tụy. Cung cấp các giải pháp pháp lý tối ưu, an toàn và toàn diện cho khách hàng trong nước và quốc tế.',
    'hero.title_1': 'Vững Pháp Lý',
    'hero.title_2': 'Sáng Tương Lai',
    'hero.btn.consult': 'Đặt lịch tư vấn',
    'hero.btn.more': 'Tìm hiểu thêm',
    'hero.contact_btn': 'Liên hệ ngay',
    'hero.services_btn': 'Dịch vụ',

    // About Section
    'about.yearsLabel': 'NĂM KINH NGHIỆM VỮNG CHẮC',
    'about.readMore': 'Xem thêm về chúng tôi',
    
    // Tools Page / Sections
    'tools.title': 'CÔNG CỤ PHÁP LÝ',
    'tools.subtitle': 'Hệ thống công cụ hỗ trợ tính toán án phí và tra cứu thông tin nhanh chóng',
  },
  en: {
    // Navbar / Menu
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.services': 'Practice Areas',
    'nav.legalServices': 'Services',
    'nav.recruitment': 'Recruitment',
    'nav.tools': 'Tools',
    'nav.contact': 'Contact',
    'nav.workspace': 'Workspace',
    'nav.myProfile': 'My Profile',
    'nav.admin': 'System Admin',
    'nav.hi': 'Hi',
    'nav.logout': 'Sign Out',
    'nav.freeConsultation': 'Free Hotline:',
    'nav.consultation247': '24/7 Legal Advisory',
    'nav.branches': 'National Branches',
    'nav.personalInfo': 'Legal Records',
    'nav.clientPortal': 'Client Portal',
    'nav.erpWork': 'Workspace (ERP)',
    'nav.account': 'Account',

    // Hero Section
    'hero.slogan': 'STEADY LEGAL COMPANION FOR ENTERPRISES & INDIVIDUALS',
    'hero.title': 'ANH DUONG LAW FIRM CO., LTD',
    'hero.subtitle': 'A prestigious, professional, and dedicated team of lawyers. Providing optimal, safe, and comprehensive legal solutions for domestic and international clients.',
    'hero.title_1': 'Solid Foundations',
    'hero.title_2': 'Bright Future',
    'hero.btn.consult': 'Book a Consultation',
    'hero.btn.more': 'Learn More',
    'hero.contact_btn': 'Contact Now',
    'hero.services_btn': 'Practice Areas',

    // About Section
    'about.yearsLabel': 'YEARS OF SOLID EXPERIENCE',
    'about.readMore': 'Read more about us',

    // Tools Page / Sections
    'tools.title': 'LEGAL TOOLS',
    'tools.subtitle': 'Calculate court fees and lookup legal resources instantaneously',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('lawfirm_language');
      if (saved === 'vi' || saved === 'en') {
        return saved;
      }
    } catch (e) {}
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('lawfirm_language', lang);
      // Dispatch a custom event to notify external listeners of the language shift
      window.dispatchEvent(new CustomEvent('lawfirm_language_change', { detail: { language: lang } }));
    } catch (e) {}
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lawfirm_language' && (e.newValue === 'vi' || e.newValue === 'en')) {
        setLanguageState(e.newValue as Language);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = (key: string, defaultValue?: string): string => {
    const val = translations[language]?.[key];
    if (val !== undefined) return val;
    return defaultValue !== undefined ? defaultValue : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
