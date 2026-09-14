import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import LegalServices from './components/LegalServices';
import Team from './components/Team';
import ClientTestimonials from './components/ClientTestimonials';
import Recruitment from './components/Recruitment';
import News from './components/News';
import Contact from './components/Contact';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import LegalDocumentsManager from './components/LegalDocumentsManager';
import CourtFeeCalculator from './components/CourtFeeCalculator';
import { fetchApi } from './utils/api';
import AboutPage from './components/AboutPage';
import ToolsPage from './components/ToolsPage';
import RecruitmentTeaser from './components/RecruitmentTeaser';
import ContactTeaser from './components/ContactTeaser';
import PracticeAreasPage from './components/PracticeAreasPage';
import ServicesPage from './components/ServicesPage';

import QRProfileViewer from './components/QRProfileViewer';
import GlobalAIAssistant from './components/GlobalAIAssistant';
import BottomLeftContacts from './components/BottomLeftContacts';
import { useApp } from './context/AppContext';

// Import heavy components statically for instant route transitions
import AdminDashboard from './components/AdminDashboard';
import ERP from './components/ERP';
import ClientPortal from './components/ClientPortal';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium text-sm">Đang tải trang...</p>
    </div>
  </div>
);

function App() {
  const { currentUser, setCurrentUser, isLoading, logout } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [view, setView] = useState('landing');
  const [qrId, setQrId] = useState('');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") || localStorage.getItem("lawfirm_theme_mode");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {}

    const handleRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith('/qr/')) {
        setView('qr');
        setQrId(path.split('/')[2]);
      } else if (path.startsWith('/admin')) {
        setView('admin');
      } else if (path.startsWith('/erp')) {
        setView('erp');
      } else if (path.startsWith('/client-portal')) {
        setView('client_portal');
      } else if (path === '/gioi-thieu') {
        setView('gioi_thieu');
      } else if (path === '/linh-vuc-hoat-dong') {
        setView('linh_vuc_hoat_dong');
      } else if (path === '/dich-vu') {
        setView('dich_vu');
      } else if (path === '/cong-cu') {
        setView('cong_cu');
      } else if (path === '/tuyen-dung') {
        setView('tuyen_dung');
      } else if (path === '/lien-he') {
        setView('lien_he');
      } else {
        setView('landing');
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const handleLoginSuccess = (u: any) => {
    setCurrentUser(u);
    setShowLogin(false);
    if (u.role === 'client') {
      setView('client_portal');
      window.history.pushState({}, '', '/client-portal');
    } else {
      setView('erp');
      window.history.pushState({}, '', '/erp');
    }
  };

  const handleLogout = async () => {
    await logout();
    setView('landing');
    window.history.pushState({}, '', '/');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (view === 'qr') {
    return (
      <ErrorBoundary>
        <QRProfileViewer profileId={qrId} />
      </ErrorBoundary>
    );
  }

  if (view === 'admin') {
    if (!currentUser) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50 flex-col gap-4">
          <p className="text-gray-600 font-medium tracking-wide">Bạn cần đăng nhập để truy cập quản trị.</p>
          <button onClick={() => setShowLogin(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition">Đăng nhập ngay</button>
          {showLogin && (
             <LoginModal isOpen={true} onClose={() => setShowLogin(false)} onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <AdminDashboard 
            user={currentUser} 
            onUpdateUser={setCurrentUser} 
            onBack={() => { setView('landing'); window.history.pushState({}, '', '/'); }} 
          />
        </Suspense>
        <GlobalAIAssistant currentUser={currentUser} />
      </ErrorBoundary>
    );
  }

  if (view === 'erp') {
    if (!currentUser) {
       return (
        <div className="flex items-center justify-center h-screen bg-slate-50 flex-col gap-4">
          <p className="text-gray-600 font-medium tracking-wide">Vui lòng đăng nhập vào không gian làm việc.</p>
          <button onClick={() => setShowLogin(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition">Đăng nhập</button>
          {showLogin && (
             <LoginModal isOpen={true} onClose={() => setShowLogin(false)} onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <ERP 
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onBack={() => { setView('landing'); window.history.pushState({}, '', '/'); }}
            onChangePasswordClick={() => setShowChangePassword(true)}
          />
        </Suspense>
        <GlobalAIAssistant currentUser={currentUser} />
        {showChangePassword && (
          <ChangePasswordModal isOpen={true} user={currentUser} onClose={() => setShowChangePassword(false)} />
        )}
      </ErrorBoundary>
    );
  }

  if (view === 'client_portal') {
    if (!currentUser) {
       return (
        <div className="flex items-center justify-center h-screen bg-slate-50 flex-col gap-4 text-center px-4">
          <p className="text-gray-600 font-medium tracking-wide">Vui lòng đăng nhập để truy cập Cổng Khách Hàng.</p>
          <button onClick={() => setShowLogin(true)} className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg hover:bg-[var(--color-primary-light)] transition">Đăng nhập</button>
          {showLogin && (
             <LoginModal isOpen={true} onClose={() => setShowLogin(false)} onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <ClientPortal
            user={currentUser}
            onBack={() => { setView('landing'); window.history.pushState({}, '', '/'); }}
          />
        </Suspense>
        <GlobalAIAssistant currentUser={currentUser} />
        <BottomLeftContacts />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="font-sans antialiased text-gray-900 bg-white min-h-screen">
        <Navbar 
          isLoggedIn={!!currentUser}
          user={currentUser}
          onLoginClick={() => setShowLogin(true)}
          onLogout={handleLogout}
          onDashboardClick={() => { setView('admin'); window.history.pushState({}, '', '/admin'); }}
          onWorkClick={() => { setView('erp'); window.history.pushState({}, '', '/erp'); }}
          onClientPortalClick={() => { setView('client_portal'); window.history.pushState({}, '', '/client-portal'); }}
          onChangePasswordClick={() => setShowChangePassword(true)}
          isLanding={view === 'landing'}
        />
        <main className={view === 'landing' ? '' : 'pt-20 lg:pt-28 bg-[#FAF9F6]'}>
          {view === 'landing' && (
            <>
              <div id="hero"><Hero /></div>
              <div id="about"><About /></div>
              <div id="news"><News isLoggedIn={!!currentUser} user={currentUser} /></div>
              <div id="services"><Services /></div>
              <div id="legal-services"><LegalServices /></div>
              <div id="team"><Team /></div>
              <div id="testimonials"><ClientTestimonials /></div>
              <div id="recruitment"><RecruitmentTeaser /></div>
              <div id="contact"><ContactTeaser /></div>
            </>
          )}
          {view === 'gioi_thieu' && <AboutPage />}
          {view === 'linh_vuc_hoat_dong' && <PracticeAreasPage />}
          {view === 'dich_vu' && <ServicesPage />}
          {view === 'cong_cu' && <ToolsPage user={currentUser} />}
          {view === 'tuyen_dung' && <Recruitment />}
          {view === 'lien_he' && <Contact />}
        </main>
        <Footer />
        <GlobalAIAssistant currentUser={currentUser} />
        <BottomLeftContacts />
        {showLogin && (
          <LoginModal 
            isOpen={true}
            onClose={() => setShowLogin(false)} 
            onLoginSuccess={handleLoginSuccess} 
          />
        )}
        {showChangePassword && (
          <ChangePasswordModal isOpen={true} user={currentUser} onClose={() => setShowChangePassword(false)} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
