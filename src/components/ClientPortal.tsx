import React, { useState, useEffect, useRef } from 'react';
import { Shield, MessageCircle, FileText, Clock, CheckCircle, AlertCircle, Send, ChevronRight, Paperclip, Download, Calendar, PenTool, Maximize2, Minimize2 } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ClientManagement from './ClientManagement';
import { useContactSettings } from '../hooks/useContactSettings';
import DocumentSigning from './DocumentSigning';
import { useFullscreen } from '../hooks/useFullscreen';
import { matchesClientRecord } from '../utils/clientRecordLink';

interface ClientPortalProps {
  user: any;
  onBack: () => void;
}

export default function ClientPortal({ user, onBack }: ClientPortalProps) {
  const { settings: contactSettings } = useContactSettings();
  const accountType = String(user?.account_type || user?.accountType || '').toUpperCase();
  const isExternalUser = accountType === 'CUSTOMER' || accountType === 'PARTNER' || ['client', 'customer', 'partner'].includes(String(user?.role || '').toLowerCase());
  if (!isExternalUser) {
    return <ClientManagement language="vi" onBack={onBack} />;
  }

  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cases' | 'messages' | 'appointments' | 'signing'>('cases');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Appointments state and authenticated API booking flow
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showAddApptForm, setShowAddApptForm] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('09:00');
  const [apptCategory, setApptCategory] = useState('Tư vấn pháp lý Đất đai');
  const [apptType, setApptType] = useState<'phone' | 'direct' | 'online'>('direct');
  const [apptNotes, setApptNotes] = useState('');
  const [isBookingAppt, setIsBookingAppt] = useState(false);

  const portalId = user?.username || `client_${user?.id}`;

  const casesTabRef = useRef<HTMLDivElement>(null);
  const messagesTabRef = useRef<HTMLDivElement>(null);
  const appointmentsTabRef = useRef<HTMLDivElement>(null);
  const signingTabRef = useRef<HTMLDivElement>(null);

  const { isFullscreen: isCasesFS, toggleFullscreen: toggleCasesFS, virtualClass: casesVC } = useFullscreen(casesTabRef);
  const { isFullscreen: isMessagesFS, toggleFullscreen: toggleMessagesFS, virtualClass: messagesVC } = useFullscreen(messagesTabRef);
  const { isFullscreen: isApptsFS, toggleFullscreen: toggleApptsFS, virtualClass: apptsVC } = useFullscreen(appointmentsTabRef);
  const { isFullscreen: isSigningFS, toggleFullscreen: toggleSigningFS, virtualClass: signingVC } = useFullscreen(signingTabRef);

  useEffect(() => {
    if (!user) return;
    fetchApi('/api/appointments')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch((error) => console.error('Failed to load appointments', error));
  }, [user]);

  useEffect(() => {
    // Fetch cases
    fetchApi('/api/erp-records')
      .then(res => res.json())
      .then(data => {
        const records = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        if (records.length > 0 || data?.success) {
          const userCases = records.filter((record) => matchesClientRecord(record, user));
          const deduplicated = Array.from(new Map(userCases.map(c => [c.systemId || c.id, c])).values());
          setCases(deduplicated);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch messages
    fetchApi(`/api/live-messages/${portalId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);

    // Setup Socket
    const newSocket = io({ path: '/socket.io' });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_visitor', portalId);
    });

    newSocket.on('receive_message', (msg: any) => {
      if (msg.visitorId === portalId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [portalId]);

  useEffect(() => {
    if (activeTab === 'messages' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadRes = await fetchApi('/api/secure-upload', { method: 'POST', body: formData });
      const data = await uploadRes.json();
      if (data.url) {
        socket.emit('send_message', {
          visitorId: portalId,
          senderType: 'visitor',
          content: 'Đã gửi tệp đính kèm: ' + file.name,
          fileUrl: data.url,
          fileName: file.name
        });
      }
    } catch(err) {
      console.error(err);
    }
    if (e.target) e.target.value = '';
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const msg = {
      visitorId: portalId,
      senderType: 'visitor',
      content: newMessage,
    };
    
    socket.emit('send_message', msg);
    setNewMessage('');
  };

  const getStatusColor = (status: string) => {
    if (status === 'Đang giải quyết' || status === 'Đang xử lý') return 'bg-blue-100 text-blue-700';
    if (status === 'Hoàn thành' || status === 'Đã giải quyết') return 'bg-green-100 text-green-700';
    if (status === 'Tạm đình chỉ' || status === 'Tạm dừng') return 'bg-yellow-100 text-yellow-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={contactSettings.logo_portal_url || contactSettings.logo_url || "/logo.svg"} 
            alt="Logo" 
            className="h-10 w-auto object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith('/logo.svg')) {
                target.src = '/logo.svg';
              }
            }}
          />
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Cổng Khách Hàng</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Xin chào, {user?.name}</span>
          <button onClick={onBack} className="text-sm font-medium text-blue-600 hover:text-blue-700">Thoát / Trang chủ</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 md:p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Bảo Mật & Riêng Tư Tuyệt Đối</h2>
            <p className="text-blue-100 max-w-2xl">
              Cổng thông tin được mã hóa bảo mật. Xem trạng thái hồ sơ vụ việc và trao đổi bảo mật trực tiếp với Luật sư phụ trách.
            </p>
          </div>
          <Shield size={64} className="text-blue-400 opacity-50 mt-4 md:mt-0" />
        </div>

        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1 rounded-xl w-full max-w-2xl mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('cases')}
            className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'cases' ? 'bg-blue-50 text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <FileText size={18} />
            Hồ sơ vụ việc
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'messages' ? 'bg-blue-50 text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <MessageCircle size={18} />
            Tin nhắn bảo mật
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'appointments' ? 'bg-blue-50 text-blue-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Clock size={18} />
            Lịch hẹn tư vấn
          </button>
          <button
            onClick={() => setActiveTab('signing')}
            className={`flex-1 min-w-[120px] py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'signing' ? 'bg-amber-50 text-amber-700 shadow-sm font-semibold ring-1 ring-amber-500/20' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <PenTool size={18} className="text-amber-500" />
            Ký hồ sơ số
          </button>
        </div>

        {activeTab === 'cases' && (
          <div ref={casesTabRef} className={`p-4 rounded-xl ${casesVC}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                Vụ việc đang hoạt động ({cases.length})
              </h3>
              <button
                onClick={toggleCasesFS}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                {isCasesFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isCasesFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
              </button>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500">Đang tải dữ liệu hồ sơ...</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có hồ sơ vụ việc</h3>
                <p className="text-slate-500">Hiện tại hệ thống không ghi nhận vụ việc nào đang cần bạn theo dõi.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {cases.map((c, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(c.status)}`}>
                            {c.status || "Đang xử lý"}
                          </span>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Clock size={14} /> Cập nhật: {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-1">{c.caseName || c.systemId || "Hồ sơ Tư vấn"}</h4>
                        <p className="text-slate-600 text-sm">Luật sư phụ trách: <span className="font-medium text-slate-800">{c.lawyer || c.mainAssignee || 'Đang chờ phân công'}</span></p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="text-sm text-slate-600 max-w-2xl w-full">
                        <p className="line-clamp-2 mb-4">{c.content || c.background || "Đang trong quá trình thu thập tài liệu và nghiên cứu pháp lý. Vui lòng liên hệ nếu có thông tin bổ sung."}</p>
                        
                        {(() => {
                          let clientFiles: any[] = [];
                          if (c.reportHistory && Array.isArray(c.reportHistory)) {
                            c.reportHistory.forEach((report: any) => {
                              if (report.files && Array.isArray(report.files)) {
                                report.files.forEach((f: any) => {
                                  clientFiles.push({...f, reportDocType: report.docType, reportNote: report.note});
                                });
                              } else if (report.fileName) {
                                clientFiles.push({ name: report.fileName, url: report.fileUrl, reportDocType: report.docType, reportNote: report.note });
                              }
                            });
                          }
                          
                          return clientFiles.length > 0 ? (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Paperclip size={14} /> Tài liệu đính kèm (Báo cáo vụ việc)
                              </h5>
                              <div className="flex flex-col gap-2">
                                {clientFiles.map((att: any, attIdx: number) => (
                                  <div key={attIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-white border border-slate-200 rounded-lg shadow-sm gap-2">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5">
                                        <FileText size={14} className="text-blue-500" />
                                        <span className="text-sm font-medium text-slate-800">{att.name || `Tài liệu ${attIdx + 1}`}</span>
                                      </div>
                                      {(att.reportDocType || att.reportNote) ? (
                                        <span className="text-xs text-slate-500 mt-1 pl-5">
                                          {att.reportDocType ? <strong className="font-semibold text-slate-600">{att.reportDocType}: </strong> : ''}
                                          {att.reportNote || 'Báo cáo vụ việc'}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-slate-500 mt-1 pl-5">Báo cáo vụ việc</span>
                                      )}
                                    </div>
                                    <a 
                                      href={att.url || att.fileUrl || "#"} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      onClick={async () => {
                                        try {
                                          await addDoc(collection(db, 'portal_activities'), {
                                            type: 'document_access',
                                            clientName: user?.name || 'Khách hàng',
                                            clientId: user?.username || `client_${user?.id || 'unknown'}`,
                                            documentTitle: att.name || 'Tài liệu báo cáo',
                                            timestamp: serverTimestamp()
                                          });
                                        } catch (err) {
                                          console.error("Failed to log document access to Firestore:", err);
                                        }
                                      }}
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors whitespace-nowrap self-start sm:self-auto"
                                    >
                                      <Download size={14} /> Tải xuống
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <button onClick={() => setActiveTab('messages')} className="whitespace-nowrap sm:self-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2 shadow-sm">
                        <span>Gửi tin nhắn</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div ref={messagesTabRef} className={`rounded-2xl ${messagesVC}`}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[600px] flex flex-col w-full">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    LS
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Luật sư phụ trách</h4>
                    <p className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Kênh bảo mật E2EE</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleMessagesFS}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  {isMessagesFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span>{isMessagesFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                </button>
              </div>

            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-6">
              <div className="text-center text-xs text-slate-400 font-medium">Bắt đầu đoạn chat bảo mật</div>
              {messages.length === 0 && (
                <div className="text-center text-sm text-slate-500 mt-10">
                  Chưa có tin nhắn. Hãy để lại yêu cầu cho chúng tôi.
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.sender_type === 'visitor';
                const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '';
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[70%] text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                      {msg.content}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 px-1">{timeStr}</div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <label className="cursor-pointer px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0">
                  <Paperclip size={20} />
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập nội dung tin nhắn..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-[46px] flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div ref={appointmentsTabRef} className={`rounded-2xl ${apptsVC}`}>
            <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} />
                Lịch hẹn tư vấn ({appointments.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleApptsFS}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  {isApptsFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span>{isApptsFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                </button>
                <button
                  onClick={() => setShowAddApptForm(!showAddApptForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
                >
                  Đặt lịch hẹn mới
                </button>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {showAddApptForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4"
              >
                <h4 className="font-bold text-slate-800 text-sm">Điền thông tin đặt lịch hẹn</h4>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!apptDate) return;
                  setIsBookingAppt(true);
                  const newApp = {
                    id: `appt-client-${Date.now()}`,
                    clientName: user.name,
                    phone: user.phone || '0903123456',
                    category: apptCategory,
                    dateTime: `${apptDate} ${apptTime}`,
                    assignedStaff: 'Đang phân công',
                    type: apptType,
                    notes: apptNotes,
                    status: 'pending' as const
                  };
                  try {
                    const response = await fetchApi('/api/appointments', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newApp),
                    });
                    if (!response.ok) throw new Error('Không thể đặt lịch hẹn');
                    const saved = await response.json();
                    setAppointments((previous) => [{ ...newApp, id: saved.id || newApp.id }, ...previous]);
                    setShowAddApptForm(false);
                    setApptNotes('');
                    setApptDate('');
                  } catch (error) {
                    console.error('Failed to create appointment', error);
                  } finally {
                    setIsBookingAppt(false);
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Ngày hẹn</label>
                      <input 
                        type="date" 
                        required
                        value={apptDate}
                        onChange={(e) => setApptDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Giờ hẹn</label>
                      <input 
                        type="time" 
                        required
                        value={apptTime}
                        onChange={(e) => setApptTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Chuyên mục cần tư vấn</label>
                      <select 
                        value={apptCategory}
                        onChange={(e) => setApptCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:outline-none"
                      >
                        <option value="Tư vấn pháp lý Đất đai">Tư vấn pháp lý Đất đai</option>
                        <option value="Tư vấn pháp lý Hợp đồng">Tư vấn pháp lý Hợp đồng</option>
                        <option value="Doanh nghiệp & Đầu tư">Doanh nghiệp & Đầu tư</option>
                        <option value="Hình sự & Tố tụng">Hình sự & Tố tụng</option>
                        <option value="Hôn nhân & Gia đình">Hôn nhân & Gia đình</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Hình thức tư vấn</label>
                      <select 
                        value={apptType}
                        onChange={(e: any) => setApptType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:outline-none"
                      >
                        <option value="direct">Gặp trực tiếp tại Văn phòng</option>
                        <option value="online">Tư vấn trực tuyến qua Video Meeting</option>
                        <option value="phone">Gọi điện qua tổng đài</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nội dung tóm tắt vụ việc & Yêu cầu cụ thể</label>
                    <textarea 
                      value={apptNotes}
                      onChange={(e) => setApptNotes(e.target.value)}
                      placeholder="Mô tả tóm tắt sự việc và chuẩn bị các tài liệu gì để Luật sư hỗ trợ tốt nhất..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddApptForm(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      disabled={isBookingAppt}
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isBookingAppt ? "Đang gửi đăng ký..." : "Gửi đăng ký lịch hẹn"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-slate-300 mb-4 animate-pulse" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có lịch hẹn tư vấn</h3>
                <p className="text-slate-500">Bạn có thể tạo lịch hẹn mới để gặp gỡ trực tiếp hoặc tư vấn trực tuyến cùng Luật sư.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.map((appt) => {
                  const isPending = appt.status === 'pending';
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'cancelled';

                  let statusText = 'Đang chờ duyệt';
                  let statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                  if (isCompleted) {
                    statusText = 'Đã hoàn thành';
                    statusColor = 'bg-green-50 text-green-700 border-green-200';
                  } else if (isCancelled) {
                    statusText = 'Đã hủy';
                    statusColor = 'bg-red-50 text-red-700 border-red-200';
                  }

                  let typeText = 'Gặp trực tiếp';
                  if (appt.type === 'online') typeText = 'Video Meeting';
                  if (appt.type === 'phone') typeText = 'Điện thoại';

                  return (
                    <div key={appt.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColor}`}>
                            {statusText}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            ID: {appt.id}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-800 text-base">{appt.category}</h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <Clock size={14} className="text-blue-500" />
                            {appt.dateTime} ({typeText})
                          </p>
                        </div>

                        {appt.notes && (
                          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                            "{appt.notes}"
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Luật sư phụ trách:</span>
                        <span className="font-semibold text-slate-700">{appt.assignedStaff || "Đang phân công"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
          </div>
        )}

        {activeTab === 'signing' && (
          <div ref={signingTabRef} className={`rounded-2xl ${signingVC}`}>
            <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PenTool className="text-amber-500" size={20} />
                Không gian ký hồ sơ số bảo mật
              </h3>
              <button
                type="button"
                onClick={toggleSigningFS}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                {isSigningFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isSigningFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
              </button>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <DocumentSigning user={user} />
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
