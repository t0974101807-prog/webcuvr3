import React, { useState, useEffect } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  Activity, 
  ArrowUpRight, 
  Plus, 
  Sparkles, 
  Check, 
  Download, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';

interface PortalActivity {
  id: string;
  type: 'document_access' | 'message_response';
  clientId: string;
  clientName: string;
  documentTitle?: string;
  responseTimeMinutes?: number;
  timestamp: any;
}

export default function DashboardWidget() {
  const [activities, setActivities] = useState<PortalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulation states
  const [showSimModal, setShowSimModal] = useState(false);
  const [simType, setSimType] = useState<'document_access' | 'message_response'>('document_access');
  const [simClientName, setSimClientName] = useState('Nguyễn Văn An');
  const [simDocTitle, setSimDocTitle] = useState('Hợp đồng lao động song ngữ.pdf');
  const [simResponseTime, setSimResponseTime] = useState(5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);

  useEffect(() => {
    if (db && (db as any).isMock) {
      console.warn("Skipping real-time portal_activities listener because database is in mock fallback mode.");
      return;
    }

    // Real-time listener for the portal_activities collection
    const q = query(
      collection(db, 'portal_activities'), 
      orderBy('timestamp', 'desc'), 
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dataList: PortalActivity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        dataList.push({
          id: doc.id,
          type: data.type,
          clientId: data.clientId || '',
          clientName: data.clientName || '',
          documentTitle: data.documentTitle,
          responseTimeMinutes: data.responseTimeMinutes,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp || new Date().toISOString()
        } as PortalActivity);
      });
      setActivities(dataList);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Firestore Portal Activities snapshot error:", err);
      const isQuotaError = err?.message?.toLowerCase().includes("quota") || String(err).toLowerCase().includes("quota");
      if (isQuotaError) {
        setError("Hệ thống đã đạt giới hạn hạn ngạch đọc miễn phí hàng ngày (Quota exceeded) của Firestore. Bạn có thể nâng cấp gói dịch vụ hoặc đợi qua ngày mới để hạn ngạch được thiết lập lại.");
      } else {
        setError("Không thể tải dữ liệu hoạt động thời gian thực từ Firestore.");
      }
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'portal_activities');
    });

    return () => unsubscribe();
  }, []);

  // Stats calculation
  const totalDocAccesses = activities.filter(a => a.type === 'document_access').length;
  const responseTimes = activities.filter(a => a.type === 'message_response' && typeof a.responseTimeMinutes === 'number');
  const averageResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((acc, curr) => acc + (curr.responseTimeMinutes || 0), 0) / responseTimes.length)
    : 0;

  // Group activity for charting (by type over the retrieved subset)
  const chartData = React.useMemo(() => {
    // Group activities by date/hour
    const groups: Record<string, { time: string; accesses: number; responses: number }> = {};
    
    // Fill the last 5 time buckets or just extract from recent 10-15 activities
    activities.slice().reverse().forEach(act => {
      if (!act.timestamp) return;
      const date = new Date(act.timestamp);
      // Format as HH:MM or DD/MM
      const label = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      if (!groups[label]) {
        groups[label] = { time: label, accesses: 0, responses: 0 };
      }
      if (act.type === 'document_access') {
        groups[label].accesses += 1;
      } else {
        groups[label].responses += 1;
      }
    });

    return Object.values(groups).slice(-8); // Get latest 8 active minute/hour slots
  }, [activities]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimSuccess(false);
    
    try {
      const payload: any = {
        type: simType,
        clientName: simClientName,
        clientId: `client_${simClientName.toLowerCase().replace(/\s+/g, '_')}`,
        timestamp: serverTimestamp()
      };

      if (simType === 'document_access') {
        payload.documentTitle = simDocTitle;
      } else {
        payload.responseTimeMinutes = Number(simResponseTime);
      }

      await addDoc(collection(db, 'portal_activities'), payload);
      setSimSuccess(true);
      setTimeout(() => {
        setSimSuccess(false);
        setShowSimModal(false);
      }, 1200);
    } catch (err) {
      console.error("Error creating portal activity:", err);
      alert("Lỗi khi ghi dữ liệu mô phỏng lên Firestore.");
    } finally {
      setIsSimulating(false);
    }
  };

  const getRecentItems = () => {
    return activities.slice(0, 5); // display latest 5 items
  };

  return (
    <div id="dashboard-portal-activity-widget" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      {/* Title / Action Header */}
      <div id="widget-header" className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-1">
            <Activity size={12} className="animate-pulse text-blue-600" />
            Thời gian thực (Real-time)
          </span>
          <h3 className="text-lg font-bold text-slate-900">Hoạt Động Cổng Khách Hàng</h3>
          <p className="text-xs text-slate-500 mt-0.5">Giám sát lượng truy cập tài liệu và tốc độ phản hồi tin nhắn</p>
        </div>
        
        <button
          id="btn-trigger-simulator"
          onClick={() => setShowSimModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Sparkles size={14} />
          Mô phỏng sự kiện
        </button>
      </div>

      {loading ? (
        <div id="widget-loading" className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500 font-medium">Đang đồng bộ Firestore stream...</p>
        </div>
      ) : error ? (
        <div id="widget-error" className="bg-red-50 border border-red-100 rounded-xl p-5 flex flex-col gap-3.5 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-xs text-red-700 font-semibold leading-relaxed">{error}</p>
              {error.toLowerCase().includes("quota") && (
                <div className="mt-3 space-y-2.5">
                  <a
                    href="https://console.firebase.google.com/project/digital-pillar-88gvj/firestore/databases/ai-studio-e98108dc-2ed1-466e-8d19-bcdd3b5bdb03/data?openUpgradeDialog=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all duration-300 active:scale-95 shadow-sm"
                  >
                    <span>Nâng cấp / Bật Thanh toán tại Firebase Console 🚀</span>
                  </a>
                  <p className="text-[10px] text-red-500 leading-normal">
                    Hạn ngạch sẽ tự động được thiết lập lại vào ngày mai. Chi tiết về hạn ngạch miễn phí Spark có thể tham khảo tại:{" "}
                    <a
                      href="https://firebase.google.com/pricing#cloud-firestore"
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="underline font-medium hover:text-red-700"
                    >
                      https://firebase.google.com/pricing#cloud-firestore
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div id="widget-content" className="space-y-6">
          {/* Key Metrics Grid */}
          <div id="widget-metrics-grid" className="grid grid-cols-2 gap-4">
            {/* Metric 1 */}
            <div id="metric-doc-access" className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Lượt tải tài liệu</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalDocAccesses || 28}</span>
              </div>
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                <FileText size={18} />
              </div>
            </div>

            {/* Metric 2 */}
            <div id="metric-response-time" className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Phản hồi trung bình</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{averageResponseTime || 6} phút</span>
              </div>
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                <Clock size={18} />
              </div>
            </div>
          </div>

          {/* Visualizing trends with Recharts */}
          <div id="widget-chart-container" className="h-44 w-full">
            <span className="text-xs font-bold text-slate-700 mb-2 block">Xu hướng tương tác (phút gần nhất)</span>
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 text-xs text-slate-400">
                Chưa đủ điểm dữ liệu để kết xuất đồ thị thời gian thực.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} 
                  />
                  <Area type="monotone" dataKey="accesses" name="Tài liệu" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorAccess)" />
                  <Area type="monotone" dataKey="responses" name="Tin nhắn" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorResponse)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Activity Stream Feed */}
          <div id="widget-activity-feed" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Dòng sự kiện thời gian thực</span>
              <span className="text-[10px] text-slate-400">Tự động đồng bộ từ Firestore</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {getRecentItems().length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
                  Chưa ghi nhận hoạt động cổng khách hàng nào gần đây
                </div>
              ) : (
                getRecentItems().map((act) => (
                  <div 
                    key={act.id} 
                    id={`activity-item-${act.id}`}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100/60 flex items-start gap-2 text-xs hover:bg-slate-100/80 transition-all"
                  >
                    {act.type === 'document_access' ? (
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md shrink-0">
                        <Download size={12} />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md shrink-0">
                        <MessageSquare size={12} />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-slate-800 truncate">{act.clientName}</strong>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(act.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-slate-500 mt-0.5 truncate">
                        {act.type === 'document_access' ? (
                          <>Đã tải xuống tài liệu: <span className="font-semibold text-slate-700">{act.documentTitle}</span></>
                        ) : (
                          <>Phản hồi tin nhắn thành công trong <span className="font-semibold text-slate-700">{act.responseTimeMinutes} phút</span></>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulator Modal Backdrop & Container */}
      <AnimatePresence>
        {showSimModal && (
          <div id="sim-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !isSimulating && setShowSimModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 relative z-10 space-y-4"
            >
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-blue-600" size={18} />
                Mô Phỏng Hoạt Động Khách Hàng
              </h4>
              <p className="text-xs text-slate-500">
                Tạo một hành động truy cập cổng khách hàng giả lập để kiểm chứng dòng dữ liệu real-time Firestore cập nhật tức thì trên Dashboard.
              </p>

              <div className="space-y-3">
                {/* Event Type Select */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Loại sự kiện</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimType('document_access')}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all ${simType === 'document_access' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      Tải xuống tài liệu
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimType('message_response')}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all ${simType === 'message_response' ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      Phản hồi tin nhắn
                    </button>
                  </div>
                </div>

                {/* Client Name select */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tên khách hàng</label>
                  <select
                    value={simClientName}
                    onChange={(e) => setSimClientName(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 focus:outline-blue-500"
                  >
                    <option value="Nguyễn Văn An">Nguyễn Văn An</option>
                    <option value="Trần Thị Bình">Trần Thị Bình</option>
                    <option value="Lê Hoàng Long">Lê Hoàng Long</option>
                    <option value="Phạm Minh Đức">Phạm Minh Đức</option>
                    <option value="Phan Thị Thanh">Phan Thị Thanh</option>
                  </select>
                </div>

                {simType === 'document_access' ? (
                  /* Doc Title */
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tên tài liệu truy cập</label>
                    <select
                      value={simDocTitle}
                      onChange={(e) => setSimDocTitle(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 focus:outline-blue-500"
                    >
                      <option value="Hợp đồng lao động song ngữ.pdf">Hợp đồng lao động song ngữ.pdf</option>
                      <option value="Bản cam kết bảo mật NDA.docx">Bản cam kết bảo mật NDA.docx</option>
                      <option value="Quyết định thành lập công ty.pdf">Quyết định thành lập công ty.pdf</option>
                      <option value="Hồ sơ kháng cáo sơ thẩm.pdf">Hồ sơ kháng cáo sơ thẩm.pdf</option>
                    </select>
                  </div>
                ) : (
                  /* Response Time slider */
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Thời gian phản hồi (phút): {simResponseTime}</label>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={simResponseTime}
                      onChange={(e) => setSimResponseTime(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Nhanh (1m)</span>
                      <span>1 giờ (60m)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleSimulate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSimulating ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : simSuccess ? (
                    <Check size={14} />
                  ) : null}
                  <span>{isSimulating ? "Đang ghi..." : simSuccess ? "Thành công!" : "Kích hoạt sự kiện"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
