import { Facebook, Linkedin, Twitter, Instagram, Youtube } from 'lucide-react';
import { useContactSettings } from '../hooks/useContactSettings';

export default function Footer() {
  const { settings } = useContactSettings();

  return (
    <footer className="bg-[#020617] text-white pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <a href="#" className="flex items-center gap-3 mb-6">
              <img 
                src={settings.logo_url || "/logo.svg"} 
                alt="Ánh Dương Law Logo" 
                className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith('/logo.svg')) {
                    target.src = '/logo.svg';
                  }
                }}
              />
              <span className="font-serif text-2xl font-bold tracking-wider block text-white">
                CÔNG TY LUẬT TNHH <span className="text-[var(--color-accent)]">ÁNH DƯƠNG</span>
              </span>
            </a>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Đối tác pháp lý tin cậy, mang đến giải pháp toàn diện và bền vững cho mọi khách hàng.
            </p>
            <div className="flex space-x-3">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" title="Facebook Page" className="p-2 bg-white/5 hover:bg-[var(--color-accent)] rounded-lg text-white/70 hover:text-white transition-all">
                  <Facebook size={18} />
                </a>
              )}
              {settings.messenger_url && (
                <a href={settings.messenger_url} target="_blank" rel="noopener noreferrer" title="Facebook Messenger" className="p-2 bg-white/5 hover:bg-[var(--color-accent)] rounded-lg text-white/70 hover:text-white transition-all font-bold text-xs flex items-center justify-center">
                  Messenger
                </a>
              )}
              {settings.zalo_url && (
                <a href={settings.zalo_url} target="_blank" rel="noopener noreferrer" title="Zalo Official Account" className="p-2 bg-white/5 hover:bg-[var(--color-accent)] rounded-lg text-white/70 hover:text-white transition-all font-bold text-xs flex items-center justify-center">
                  Zalo
                </a>
              )}
              {settings.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube Channel" className="p-2 bg-white/5 hover:bg-[var(--color-accent)] rounded-lg text-white/70 hover:text-white transition-all">
                  <Youtube size={18} />
                </a>
              )}
              {settings.linkedin_url && (
                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="p-2 bg-white/5 hover:bg-[var(--color-accent)] rounded-lg text-white/70 hover:text-white transition-all">
                  <Linkedin size={18} />
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" title="Instagram" className="p-2 bg-white/5 hover:bg-[var(--color-accent)] rounded-lg text-white/70 hover:text-white transition-all">
                  <Instagram size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-6 text-[var(--color-accent)]">Liên kết nhanh</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Trang chủ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Giới thiệu</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Dịch vụ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tin tức & Sự kiện</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tuyển dụng</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-6 text-[var(--color-accent)]">Dịch vụ</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Tư vấn Doanh nghiệp</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bất động sản</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sở hữu trí tuệ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tranh tụng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Đầu tư nước ngoài</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-6 text-[var(--color-accent)]">Đăng ký nhận tin</h4>
            <p className="text-white/60 text-sm mb-4">Nhận thông tin pháp lý mới nhất từ chúng tôi.</p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email của bạn"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />
              <button className="bg-[var(--color-accent)] text-white font-medium py-2 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors text-sm">
                Đăng ký
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>&copy; 2024 Ánh Dương Law. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
