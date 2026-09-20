import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  Activity, 
  Download, 
  AlertCircle,
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
  BarChart
} from 'recharts';
import { fetchApi } from '../utils/api';

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
  

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const response = await fetchApi('/api/portal-activities');
        if (!response.ok) throw new Error('Không thể tải hoạt động cổng khách hàng.');
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error("Portal activities API error:", err);
        setError("Không thể tải dữ liệu hoạt động cổng khách hàng.");
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
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
        
        <span className="text-[10px] font-semibold text-slate-400">Dữ liệu thực tế</span>
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
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{totalDocAccesses}</span>
              </div>
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                <FileText size={18} />
              </div>
            </div>

            {/* Metric 2 */}
            <div id="metric-response-time" className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Phản hồi trung bình</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{averageResponseTime} phút</span>
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

    </div>
  );
}
