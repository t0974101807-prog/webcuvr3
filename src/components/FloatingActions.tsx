import React, { useState, useEffect, useRef } from 'react';
import { Phone, MessageCircle, X, Send, Paperclip, FileText, Image as ImageIcon, Home, MessageSquare, Search, ChevronRight, ChevronLeft, ThumbsUp, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchApi } from '../utils/api';
import { io, Socket } from 'socket.io-client';
import { useContactSettings } from '../hooks/useContactSettings';

export default function FloatingActions() {
  const { settings } = useContactSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'chat'>('home');

  // Chat States
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [visitorId, setVisitorId] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', content: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    let vid: string | null = null;
    try {
      vid = localStorage.getItem('visitor_id');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitor_id', vid);
      }
    } catch (e) {
      vid = 'v_' + Math.random().toString(36).substr(2, 9);
      console.warn('Local storage disabled or failed:', e);
    }
    setVisitorId(vid);

    fetchApi(`/api/live-messages/${vid}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_visitor', vid);
    });

    newSocket.on('receive_message', (msg) => {
      setMessages(prev => {
        const exists = prev.find(m => m.created_at === msg.created_at && m.content === msg.content);
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isOpen && currentTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (socket && visitorId) {
        socket.emit('mark_read', visitorId);
      }
    }
  }, [messages, isOpen, currentTab, socket, visitorId]);

  const handleSendLive = () => {
    if (!input.trim() || !socket || !visitorId) return;

    const msg = {
      visitorId,
      senderType: 'visitor',
      content: input,
    };
    
    socket.emit('send_message', msg);
    setInput('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !visitorId) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("File quá lớn. Vui lòng chọn file nhỏ hơn 20MB.");
      return;
    }

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetchApi('/api/live-upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      
      const msg = {
        visitorId,
        senderType: 'visitor',
        content: '',
        fileUrl: data.url,
        fileName: data.name
      };
      
      socket.emit('send_message', msg);
    } catch(err) {
      alert("Lỗi tải file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      const res = await fetchApi('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed');
      setFormStatus('success');
      setFormData({ name: '', phone: '', email: '', content: '' });
      setTimeout(() => {
        setFormStatus('idle');
      }, 3000);
    } catch (err) {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 3000);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[360px] max-w-[calc(100vw-3rem)] shadow-2xl z-50 flex flex-col rounded-lg overflow-hidden border border-gray-100 bg-white"
            style={{ height: '600px', maxHeight: '85vh' }}
          >
            {/* --- HOME TAB --- */}
            {currentTab === 'home' && (
              <div className="flex flex-col flex-1 relative bg-[#f8f9fa] h-full"> 
                  <>
                    <div className="bg-[var(--color-primary)] text-white px-6 py-10 pb-16 relative">
                      <button 
                        onClick={() => setIsOpen(false)} 
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                      >
                        <X size={24} />
                      </button>
                      <h2 className="text-3xl font-bold mb-3 flex items-center gap-2">Xin chào <span className="animate-bounce">👋</span></h2>
                      <p className="text-white/90 text-sm leading-relaxed">
                        Bạn cần trợ giúp? Hãy tìm kiếm trong trung tâm trợ giúp của chúng tôi để có câu trả lời hoặc bắt đầu một cuộc trò chuyện:
                      </p>
                    </div>

                    <div className="px-5 -mt-8 flex-1 flex flex-col gap-4 relative z-10 overflow-y-auto pb-6">
                      {/* Box 1: Live Chat */}
                      <div 
                        onClick={() => setCurrentTab('chat')}
                        className="bg-white rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.05)] p-5 cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all flex justify-between items-center group"
                      >
                        <div>
                          <h3 className="font-bold text-[var(--color-text-dark)] mb-1">Cuộc trò chuyện Mới</h3>
                          <p className="text-sm text-gray-600">Chúng tôi thường trả lời trong vòng vài phút</p>
                        </div>
                        <Send size={20} className="text-[var(--color-primary)] opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>

                      {/* Box 2: Form */}
                      <div className="bg-white rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3">
                        <h3 className="font-bold text-[var(--color-text-dark)]">
                           Gửi yêu cầu tư vấn
                        </h3>
                        {formStatus === 'success' ? (
                          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 text-[var(--color-primary)] animate-in fade-in zoom-in">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                              <MessageCircle size={24} />
                            </div>
                            <h4 className="font-bold text-lg">Đã gửi tin nhắn!</h4>
                            <p className="text-gray-600 text-xs">Chúng tôi sẽ liên hệ lại với bạn sớm nhất có thể.</p>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmitForm} className="space-y-3">
                            <div>
                              <input type="text" placeholder="Họ và tên *" required disabled={formStatus === 'sending'}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-gray-50/50 text-sm"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                              <input type="tel" placeholder="Số điện thoại *" required disabled={formStatus === 'sending'}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-gray-50/50 text-sm"
                                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                              <input type="email" placeholder="Email" disabled={formStatus === 'sending'}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-gray-50/50 text-sm"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div>
                              <textarea placeholder="Nhập nội dung tin nhắn..." required disabled={formStatus === 'sending'}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none resize-none bg-gray-50/50 text-sm" rows={3}
                                value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                            </div>
                            <button type="submit" disabled={formStatus === 'sending'}
                              className="w-full py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-light)] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-sm">
                              {formStatus === 'sending' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                              {formStatus === 'sending' ? 'Đang gửi...' : 'Gửi tin nhắn'}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </>
              </div>
            )}

            {/* --- CHAT TAB --- */}
            {currentTab === 'chat' && (
              <div className="flex flex-col flex-1 h-full bg-white relative">
                {/* Header Chat */}
                <div className="bg-[var(--color-primary)] text-white p-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                  <button 
                    onClick={() => setCurrentTab('home')} 
                    className="p-1 hover:bg-black/10 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={20} /> Nhân viên hỗ trợ
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 p-4 bg-white overflow-y-auto custom-scrollbar flex flex-col gap-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                       {/* Initial State similar to intercom empty if no messages */}
                    </div>
                  ) : null}

                  {/* Intro Message like Screenshot */}
                  <div className="flex flex-col mb-4">
                    <span className="text-xs text-gray-600 mb-1 ml-10">Nhân viên hỗ trợ</span>
                    <div className="flex max-w-[85%] self-start">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] shrink-0 flex items-center justify-center text-white mr-2 shadow-sm relative overflow-hidden">
                         <img src={settings.logo_url || "/logo.svg"} alt="Admin" className="w-full h-full object-cover p-1 bg-white" onError={(e) => { e.currentTarget.src = '/logo.svg'; }} />
                      </div>
                      <div className="flex flex-col gap-1 items-start">
                        <div className="px-4 py-2.5 text-sm shadow-sm bg-[#cfa961] text-white rounded-lg rounded-lg font-medium">
                          👋 Xin chào, Bạn cần tôi hỗ trợ gì không?
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real Messages */}
                  {messages.map((msg, i) => {
                    const isVisitor = msg.sender_type === 'visitor' || msg.senderType === 'visitor';
                    const showName = !isVisitor && (i === 0 || (messages[i-1].sender_type !== 'admin' && messages[i-1].senderType !== 'admin'));
                    
                    return (
                      <div key={i} className="flex flex-col">
                        {!isVisitor && showName && <span className="text-xs text-gray-600 mb-1 ml-10">Nhân viên hỗ trợ</span>}
                        <div className={`flex max-w-[85%] ${isVisitor ? 'self-end' : 'self-start'}`}>
                          {!isVisitor && (
                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] shrink-0 flex items-center justify-center text-white mr-2 mt-auto text-xs font-bold shadow-sm relative overflow-hidden">
                              <img src={settings.logo_url || "/logo.svg"} alt="Admin" className="w-full h-full object-cover p-1 bg-white" onError={(e) => { e.currentTarget.src = '/logo.svg'; }} />
                            </div>
                          )}
                          <div className={`flex flex-col gap-1 ${isVisitor ? 'items-end' : 'items-start'}`}>
                            <div 
                              className={`px-4 py-2 text-sm shadow-sm ${
                                isVisitor 
                                  ? 'bg-[var(--color-primary)] text-white rounded-lg rounded-lg' 
                                  : 'bg-[#cfa961] text-white rounded-lg rounded-lg'
                              }`}
                            >
                              {msg.content}
                              
                              {(msg.file_url || msg.fileUrl) && (
                                <a 
                                  href={msg.file_url || msg.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`mt-2 flex items-center gap-2 p-2 rounded-lg ${isVisitor ? 'bg-black/10' : 'bg-black/10'} hover:opacity-80 transition-opacity`}
                                >
                                  {(msg.file_url || msg.fileUrl).match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                    <img src={msg.file_url || msg.fileUrl} alt="attachment" className="max-w-[200px] rounded-lg object-cover cursor-pointer" />
                                  ) : (
                                    <>
                                     <FileText size={16} />
                                     <span className="text-xs truncate max-w-[150px] font-medium">{msg.file_name || msg.fileName || 'Tệp đính kèm'}</span>
                                    </>
                                  )}
                                </a>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 px-1 font-medium select-none">
                              {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg pl-2 pr-1 py-1">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-lg shadow-sm"
                      title="Đính kèm tệp"
                    >
                      <Paperclip size={18} />
                    </button>

                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendLive();
                        }
                      }}
                      placeholder={isUploading ? "Đang tải tệp..." : "Bạn cần tư vấn vấn đề gì..."}
                      className="flex-1 bg-transparent border-none outline-none text-sm px-2 placeholder:text-gray-400 disabled:opacity-50 min-w-0"
                      disabled={isUploading}
                    />
                    
                    <button 
                      onClick={handleSendLive}
                      disabled={!input.trim() || isUploading}
                      className="p-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Gửi"
                    >
                      <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- BOTTOM TABS NAV --- */}
            <div className="flex bg-white border-t border-gray-100 shrink-0 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] relative z-20">
              <button 
                onClick={() => setCurrentTab('home')}
                className={`flex-1 flex justify-center items-center py-2 transition-colors ${currentTab === 'home' ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Home size={22} className={currentTab === 'home' ? 'fill-current' : 'fill-none stroke-[2]'} />
              </button>
              <div className="w-[1px] bg-gray-100 my-2"></div>
              <button 
                onClick={() => setCurrentTab('chat')}
                className={`flex-1 flex justify-center items-center py-2 transition-colors ${currentTab === 'chat' ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-gray-600'}`}
                title="Tin nhắn"
              >
                <MessageSquare size={22} className={currentTab === 'chat' ? 'fill-[var(--color-primary)] stroke-none text-white' : 'fill-none stroke-[2] text-gray-400 hover:text-gray-600'} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-4">
        {/* Zalo Button */}
        <motion.a
          href="https://zalo.me/0123456789" 
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="contact-btn-wrapper w-14 h-14 bg-[#0068FF] rounded-full text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-shadow cursor-pointer"
          title="Chat qua Zalo"
        >
          <span className="font-bold text-lg animate-ring">Zalo</span>
        </motion.a>
        
        {/* Phone Button */}
        <motion.a
          href="tel:0123456789"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="contact-btn-wrapper w-14 h-14 bg-[#16566D] rounded-full text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-shadow cursor-pointer"
          title="Gọi điện thoại"
        >
          <Phone size={26} className="fill-white animate-ring" />
        </motion.a>

        {/* Chat Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="contact-btn-wrapper w-14 h-14 bg-[var(--color-primary)] rounded-full text-white shadow-lg shadow-teal-900/30 hover:shadow-xl transition-shadow cursor-pointer relative"
          title="Trợ giúp trực tuyến"
        >
          {isOpen ? <X size={28} /> : <MessageSquare size={26} className="fill-white" />}
          
          {!isOpen && messages.length > 0 && messages[messages.length-1].sender_type === 'admin' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-lg bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-lg h-4 w-4 bg-red-500 border-2 border-white text-[8px] flex items-center justify-center font-bold">1</span>
            </span>
          )}
        </motion.button>
      </div>
    </>
  );
}
