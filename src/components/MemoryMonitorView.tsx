import React, { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  HardDrive, 
  Clock, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  AlertOctagon, 
  BarChart4, 
  ListFilter 
} from "lucide-react";

interface MemoryMonitorViewProps {
  language: "vi" | "en";
}

interface MemoryTelemetry {
  success: boolean;
  status: string;
  node: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  container: {
    memoryCurrent: number;
    memoryLimit: number;
    memoryPercent: number;
    memorySource: string;
  };
  system: {
    total: number;
    free: number;
  };
  process: {
    pid: number;
    uptime: number;
    leakSuspected: boolean;
    restartLoopDetected: boolean;
  };
  workload: {
    activeRequests: number;
    activeConnections: number;
    queueSize: number;
    aiJobs: number;
    pdfJobs: number;
    ocrJobs: number;
  };
  stats: {
    oomCount: number;
    crashCount: number;
    abnormalShutdownCount: number;
  };
  lastState: Array<{
    timestamp: string;
    rss: number;
    heapUsed: number;
    memoryCurrent: number;
    memoryLimit: number;
    memoryPercent: number;
  }>;
  possibleCause: string;
}

export default function MemoryMonitorView({ language }: MemoryMonitorViewProps) {
  const [telemetry, setTelemetry] = useState<MemoryTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'5m' | '1h' | '24h'>('5m');
  const [events, setEvents] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const t = {
    vi: {
      title: "Hệ thống Giám sát Bộ nhớ & Chống OOM-Kill",
      subtitle: "Giám sát thời gian thực, bảo vệ tiến trình, cảnh báo rò rỉ bộ nhớ và khôi phục sự cố tự động",
      normal: "Bình thường",
      warning: "Cảnh báo",
      critical: "Nguy cấp",
      oom_risk: "Rủi ro OOM",
      nodeHeap: "Vùng nhớ Heap Node.js",
      heapUsed: "Heap đã dùng",
      heapTotal: "Tổng vùng nhớ Heap",
      external: "External Memory",
      arrayBuffers: "Array Buffers",
      containerMemory: "Bộ nhớ Container (cgroup)",
      memoryLimit: "Giới hạn bộ nhớ",
      memoryPercent: "Phần trăm bộ nhớ",
      status: "Trạng thái",
      uptime: "Thời gian chạy",
      eventsHistory: "Nhật ký Sự kiện Hệ thống",
      activeWorkloads: "Tiến trình Xử lý Nặng",
      activeRequests: "Yêu cầu Hoạt động",
      queueSize: "Hàng đợi Giới hạn",
      aiJobs: "Tác vụ AI",
      pdfJobs: "Tác vụ PDF",
      ocrJobs: "Tác vụ OCR",
      oomCount: "Số lần OOM",
      crashCount: "Số lần Crash",
      abnormalCount: "Khởi động Bất thường",
      leakSuspected: "Nghi ngờ Rò rỉ Bộ nhớ",
      restartLoop: "Cảnh báo Lặp Khởi động",
      loadMore: "Tải thêm sự kiện",
      noEvents: "Không có sự kiện hệ thống nào được ghi nhận",
      refresh: "Làm mới",
      metricsChart: "Biểu đồ Phân tích Telemetry",
    },
    en: {
      title: "Memory System & OOM-Kill Monitor",
      subtitle: "Real-time tracking, leak detection, crash monitoring, and proactive workload protection",
      normal: "Normal",
      warning: "Warning",
      critical: "Critical",
      oom_risk: "OOM Risk",
      nodeHeap: "Node.js Heap Allocation",
      heapUsed: "Heap Used",
      heapTotal: "Heap Total",
      external: "External Memory",
      arrayBuffers: "Array Buffers",
      containerMemory: "Container Memory (cgroup)",
      memoryLimit: "Memory Limit",
      memoryPercent: "Memory Percentage",
      status: "Status",
      uptime: "Uptime",
      eventsHistory: "System Events History",
      activeWorkloads: "Heavy Load Workloads",
      activeRequests: "Active Requests",
      queueSize: "Bounded Queue Size",
      aiJobs: "AI Agents Tasks",
      pdfJobs: "PDF Processes",
      ocrJobs: "OCR Scans",
      oomCount: "OOM Kills",
      crashCount: "Process Crashes",
      abnormalCount: "Abnormal Restarts",
      leakSuspected: "Memory Leak Suspected",
      restartLoop: "Restart Loop Protection",
      loadMore: "Load more events",
      noEvents: "No system events found",
      refresh: "Refresh",
      metricsChart: "Telemetry Analytics Chart",
    }
  }[language];

  // Fetch telemetry on load and interval
  const fetchTelemetry = async () => {
    try {
      const res = await fetch("/api/system/memory");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error(language === "vi" ? "Từ chối truy cập: Quyền giám sát yêu cầu" : "Access Denied: Permissions required");
        }
        throw new Error("Failed to fetch memory data");
      }
      const json = await res.ok ? await res.json() : null;
      if (json && json.success) {
        setTelemetry(json);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cursor-paginated system events
  const fetchEvents = async (cursor?: string) => {
    setLoadingEvents(true);
    try {
      let url = "/api/system/memory/events?limit=8";
      if (cursor) url += `&cursor=${cursor}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (cursor) {
            setEvents(prev => [...prev, ...json.data]);
          } else {
            setEvents(json.data);
          }
          setNextCursor(json.nextCursor);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchEvents();

    const timer = setInterval(() => {
      fetchTelemetry();
    }, 10000); // 10 seconds interval

    return () => clearInterval(timer);
  }, [language]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m ${s}s`;
  };

  // Format charts telemetry data
  const chartData = React.useMemo(() => {
    if (!telemetry || !telemetry.lastState) return [];
    
    // Sort chronological order
    const sorted = [...telemetry.lastState].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Limit based on selected time range
    let filtered = sorted;
    if (timeRange === '5m') {
      filtered = sorted.slice(-60); // roughly last 5 mins (at 5s interval)
    } else if (timeRange === '1h') {
      filtered = sorted.slice(-120); // downsampled
    }

    return filtered.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      "RSS (MB)": parseFloat((item.rss / 1024 / 1024).toFixed(1)),
      "Heap Used (MB)": parseFloat((item.heapUsed / 1024 / 1024).toFixed(1)),
      "Memory %": parseFloat(item.memoryPercent.toFixed(1))
    }));
  }, [telemetry, timeRange]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-blue-600 w-10 h-10 mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading Memory Metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col items-center justify-center text-center">
        <AlertOctagon className="text-rose-500 w-16 h-16 mb-4" />
        <p className="text-lg font-bold text-rose-800 mb-2">{language === "vi" ? "Lỗi truy xuất hệ thống" : "Telemetry Access Error"}</p>
        <p className="text-sm text-rose-600 mb-6">{error}</p>
        <button 
          onClick={fetchTelemetry}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-rose-700 transition"
        >
          {t.refresh}
        </button>
      </div>
    );
  }

  const memoryPercent = telemetry?.container?.memoryPercent || 0;
  let statusColor = "bg-emerald-500 text-emerald-500";
  let statusBg = "bg-emerald-50 border-emerald-100 text-emerald-800";
  let statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  let statusLabel = t.normal;

  if (telemetry?.status === 'OOM_RISK') {
    statusColor = "bg-rose-600 text-rose-600 animate-pulse";
    statusBg = "bg-rose-50 border-rose-200 text-rose-900";
    statusIcon = <AlertOctagon className="w-5 h-5 text-rose-600" />;
    statusLabel = t.oom_risk;
  } else if (telemetry?.status === 'CRITICAL') {
    statusColor = "bg-amber-500 text-amber-500";
    statusBg = "bg-amber-50 border-amber-200 text-amber-900";
    statusIcon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
    statusLabel = t.critical;
  } else if (telemetry?.status === 'WARNING') {
    statusColor = "bg-yellow-400 text-yellow-400";
    statusBg = "bg-yellow-50 border-yellow-100 text-yellow-900";
    statusIcon = <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    statusLabel = t.warning;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Cpu className="text-blue-600 w-7 h-7" />
            {t.title}
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 border rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs ${statusBg}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            {statusLabel}
          </span>
          <button 
            onClick={() => { fetchTelemetry(); fetchEvents(); }}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition shadow-sm active:scale-95 cursor-pointer"
            title={t.refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Core Container Usage */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.containerMemory}</span>
            <HardDrive className="text-indigo-500 w-5 h-5" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">
              {memoryPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatBytes(telemetry?.container?.memoryCurrent || 0)} / {formatBytes(telemetry?.container?.memoryLimit || 1024 * 1024 * 512)}
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                memoryPercent >= 90 ? 'bg-rose-500' : memoryPercent >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(memoryPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Node.js Heap */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.nodeHeap}</span>
            <Activity className="text-emerald-500 w-5 h-5" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">
              {((telemetry?.node?.heapUsed || 0) / (1024 * 1024)).toFixed(1)} <span className="text-lg font-bold">MB</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatBytes(telemetry?.node?.heapUsed || 0)} / {formatBytes(telemetry?.node?.heapTotal || 0)}
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${Math.min(((telemetry?.node?.heapUsed || 0) / (telemetry?.node?.heapTotal || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Workload Telemetry */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.activeWorkloads}</span>
            <Database className="text-blue-500 w-5 h-5" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
            <div className="flex justify-between border-b border-slate-50 pb-1">
              <span className="text-slate-400 font-semibold">{t.aiJobs}:</span>
              <span className="font-bold text-slate-800">{telemetry?.workload?.aiJobs}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1">
              <span className="text-slate-400 font-semibold">{t.pdfJobs}:</span>
              <span className="font-bold text-slate-800">{telemetry?.workload?.pdfJobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">{t.ocrJobs}:</span>
              <span className="font-bold text-slate-800">{telemetry?.workload?.ocrJobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">{t.queueSize}:</span>
              <span className={`font-bold ${telemetry?.workload?.queueSize && telemetry?.workload?.queueSize > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
                {telemetry?.workload?.queueSize}
              </span>
            </div>
          </div>
        </div>

        {/* Process Metrics */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.uptime}</span>
            <Clock className="text-orange-500 w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-800">{formatUptime(telemetry?.process?.uptime || 0)}</p>
            <p className="text-[10px] text-slate-400">PID: {telemetry?.process?.pid} | {t.activeRequests}: {telemetry?.workload?.activeRequests}</p>
          </div>
          
          <div className="space-y-1 pt-1.5 border-t border-slate-50">
            {telemetry?.process?.leakSuspected && (
              <div className="flex items-center gap-1.5 text-[10px] text-rose-600 font-black tracking-wide animate-bounce-short">
                <AlertOctagon size={12} />
                <span>{t.leakSuspected}</span>
              </div>
            )}
            {telemetry?.process?.restartLoopDetected && (
              <div className="flex items-center gap-1.5 text-[10px] text-rose-700 font-black tracking-wide animate-pulse">
                <AlertOctagon size={12} />
                <span>{t.restartLoop}</span>
              </div>
            )}
            {!telemetry?.process?.leakSuspected && !telemetry?.process?.restartLoopDetected && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                <ShieldCheck size={12} />
                <span>Protection Engine: OK</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Historical Incident Stats Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
            <AlertOctagon size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.oomCount}</p>
            <p className="text-2xl font-black text-slate-800">{telemetry?.stats?.oomCount}</p>
          </div>
        </div>
        
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.crashCount}</p>
            <p className="text-2xl font-black text-slate-800">{telemetry?.stats?.crashCount}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-slate-200 text-slate-600 rounded-xl">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.abnormalCount}</p>
            <p className="text-2xl font-black text-slate-800">{telemetry?.stats?.abnormalShutdownCount}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Telemetry Charts (Colspan-2) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <BarChart4 className="text-blue-600 w-5 h-5" />
              {t.metricsChart}
            </h2>
            
            {/* Time Ranges */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['5m', '1h', '24h'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    timeRange === range 
                      ? 'bg-white text-slate-800 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {range === '5m' ? '5 Mins' : range === '1h' ? '1 Hour' : '24 Hours'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHeap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="RSS (MB)" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRss)" />
                <Area type="monotone" dataKey="Heap Used (MB)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorHeap)" />
                <Area type="monotone" dataKey="Memory %" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPercent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Logs history */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col space-y-4">
          <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <ListFilter className="text-blue-600 w-5 h-5" />
            {t.eventsHistory}
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-72">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <CheckCircle2 className="text-emerald-500 w-10 h-10 mb-2" />
                <p className="text-xs text-slate-500 font-semibold">{t.noEvents}</p>
              </div>
            ) : (
              events.map((ev, index) => {
                const details = ev.details || {};
                let icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                let color = "border-emerald-100 bg-emerald-50 text-emerald-800";
                
                if (details.eventType === "OOM_KILLED") {
                  icon = <AlertOctagon className="w-4 h-4 text-rose-600" />;
                  color = "border-rose-200 bg-rose-50 text-rose-900";
                } else if (details.eventType === "PROCESS_CRASH") {
                  icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
                  color = "border-amber-200 bg-amber-50 text-amber-900";
                } else if (details.eventType === "ABNORMAL_SHUTDOWN") {
                  icon = <AlertTriangle className="w-4 h-4 text-slate-600" />;
                  color = "border-slate-200 bg-slate-100 text-slate-800";
                }

                return (
                  <div key={ev.id || index} className={`p-3 border rounded-xl space-y-1 ${color}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                        {icon}
                        {details.eventType || "SYSTEM_EVENT"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(ev.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {details.lastState && (
                      <p className="text-[10px] opacity-80 leading-relaxed">
                        Peak RSS: {formatBytes(details.lastState.rss)} | Peak RAM: {details.lastState.memoryPercent?.toFixed(1)}% | 
                        Route: {details.lastState.currentRoute || 'unknown'}
                      </p>
                    )}
                    {details.restartLoopDetected && (
                      <span className="inline-block text-[8px] bg-rose-200 text-rose-800 font-black px-1.5 py-0.5 rounded-md mt-1 animate-pulse">
                        RESTART_LOOP
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {nextCursor && (
            <button
              onClick={() => fetchEvents(nextCursor)}
              disabled={loadingEvents}
              className="w-full py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loadingEvents ? "Loading..." : t.loadMore}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
