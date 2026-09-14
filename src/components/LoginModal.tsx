import { fetchApi } from '../utils/api';
import React, { useState } from 'react';
import { X, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: { id: number; username: string; name: string; role?: string }) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let deviceId = '';
      try {
        deviceId = localStorage.getItem('device_id') || '';
        if (!deviceId) {
          deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('device_id', deviceId);
        }
      } catch (e) {
        console.warn('Local storage disabled');
      }

      const response = await fetchApi('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, deviceId }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        data = { success: false, message: 'Không thể xử lý phản hồi từ máy chủ' };
      }

      if (response.ok && (data.success !== false)) {
        if (data.token) {
          try {
            localStorage.setItem('token', data.token);
          } catch (e) {
            console.warn('Local storage disabled or failed:', e);
          }
        }
        if (data.isNewDevice) {
          alert("Hệ thống nhận thấy bạn đang đăng nhập từ một thiết bị mới.");
        }
        if (data.user) {
          onLoginSuccess?.(data.user);
        }
        setUsername('');
        setPassword('');
      } else {
        setError(data.message || data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
      console.error("Login attempt failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          ></motion.div>

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#fdfbf7] border border-[#c2a278]/40 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10"
          >
            {/* Top Navigation */}
            <div className="flex justify-between items-center px-6 pt-5 relative">
              <button
                onClick={onClose}
                className="text-[#8c6239] hover:text-[#c2a278] flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft size={14} />
                <span>QUAY LẠI TRANG CHỦ</span>
              </button>
              
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-all"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Header / Brand Identity */}
            <div className="flex flex-col items-center pt-8 px-6 pb-2 text-center relative">
              <div className="w-14 h-14 rounded-full border border-[#c2a278]/40 flex items-center justify-center bg-[#faf6f0] mb-4 shadow-sm">
                <Sparkles size={20} className="text-[#8c6239]" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-800 tracking-wide">Đăng Nhập Hệ Thống</h3>
              <p className="text-[#8c6239] text-[10px] uppercase tracking-widest font-bold mt-1.5">Dành cho nhân viên và khách hàng</p>
            </div>

            <div className="px-8 pb-8 pt-4">
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-red-500" />
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8c6239] mb-2">Số điện thoại hoặc tài khoản</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#ebd8c8] focus:border-[#c2a278] focus:ring-1 focus:ring-[#c2a278] bg-white text-slate-800 outline-none transition-all text-sm placeholder:text-slate-400"
                    placeholder="Nhập tài khoản..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8c6239] mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#ebd8c8] focus:border-[#c2a278] focus:ring-1 focus:ring-[#c2a278] bg-white text-slate-800 outline-none transition-all text-sm placeholder:text-slate-400"
                    placeholder="Nhập mật khẩu..."
                  />
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group text-slate-600">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#ebd8c8] bg-white text-[#8c6239] focus:ring-[#c2a278] focus:ring-offset-0 focus:ring-1 cursor-pointer" 
                    />
                    <span className="group-hover:text-slate-800 transition-colors">Ghi nhớ</span>
                  </label>
                  <a 
                    href="#" 
                    className="text-[#8c6239] hover:text-[#c2a278] transition-colors hover:underline font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Vui lòng liên hệ quản trị viên để lấy lại mật khẩu.");
                    }}
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#8c6239] hover:bg-[#734e29] text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center uppercase tracking-widest text-xs active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Đăng nhập hệ thống'
                  )}
                </button>
                
                <div className="text-center text-xs text-slate-500 mt-4 space-y-1.5 flex flex-col items-center">
                  <div className="flex items-center gap-2 border border-[#c2a278]/40 bg-[#faf6f0] px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#8c6239] shadow-sm">
                    <span className="text-[#8c6239] font-semibold">
                      {(() => {
                        const now = new Date();
                        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                        const dayName = days[now.getDay()];
                        const dateStr = String(now.getDate()).padStart(2, '0');
                        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
                        const yearStr = now.getFullYear();
                        return `${dayName}, ngày ${dateStr} tháng ${monthStr} năm ${yearStr}`;
                      })()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Mật khẩu là chữ cái, số và ký tự đặc biệt</p>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
