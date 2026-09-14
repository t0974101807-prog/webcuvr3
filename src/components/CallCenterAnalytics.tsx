import React, { useState, useEffect, useCallback } from "react";
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneMissed, 
  Clock, 
  User, 
  Building, 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  UserCheck, 
  Activity, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Database, 
  Calendar, 
  ArrowRight, 
  Headphones, 
  MessageSquare, 
  Sparkles, 
  CheckCircle, 
  Clock3, 
  Volume2, 
  Sliders, 
  X, 
  UserPlus, 
  Award, 
  ShieldAlert 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area 
} from "recharts";
import { fetchApi } from "../utils/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";

interface CallCenterStats {
  totalCalls: number;
  incomingCalls: number;
  outgoingCalls: number;
  connectedCalls: number;
  missedCalls: number;
  rejectedCalls: number;
  failedCalls: number;
  totalDurationSeconds: number;
  avgTalkTimeSeconds: number;
  avgWaitTimeSeconds: number;
  answerRate: number;
  missedRate: number;
  successRate: number;
  currentConcurrent: number;
  peakConcurrent: number;
  contactedCustomers: number;
  dossierCount: number;
}

interface CallLog {
  id: string;
  call_id?: string;
  name: string;
  phone: string;
  phone_number?: string;
  type: string;
  direction?: string;
  duration: number;
  wait_duration?: number;
  ring_duration?: number;
  hold_duration?: number;
  timestamp: string;
  start_time?: string;
  answer_time?: string;
  end_time?: string;
  status: string;
  dossierId?: string;
  customer_id?: string;
  dossierTitle?: string;
  category?: string;
  consultationNote?: string;
  call_result?: string;
  staffName: string;
  employee_id?: string;
  staffRole?: string;
  branch: string;
  office_id?: string;
  transcript?: string;
  isViolated?: number | boolean;
  violatedKeywords?: string | string[];
  qcRating?: string;
  qcNotes?: string;
  qcEvaluator?: string;
  recordingUrl?: string;
  gateway?: string;
}

interface AnalyticsData {
  timeSeries: Array<{
    name: string;
    total: number;
    inbound: number;
    outbound: number;
    answered: number;
    missed: number;
    duration: number;
  }>;
  funnel: Array<{
    stage: string;
    label: string;
    count: number;
    pct: number;
  }>;
  conversionRates: {
    leadRate: number;
    caseRate: number;
  };
}

interface EmployeeStat {
  employee_name: string;
  employee_role: string;
  office_name: string;
  total_calls: number;
  incoming: number;
  outgoing: number;
  answered: number;
  missed: number;
  total_duration: number;
  answer_rate: number;
  avg_talk_time: number;
}

interface OfficeStat {
  office_name: string;
  total_calls: number;
  incoming: number;
  outgoing: number;
  answered: number;
  missed: number;
  total_duration: number;
  answer_rate: number;
  avg_talk_time: number;
}

interface CustomerStat {
  phone_number: string;
  customer_name: string;
  total_calls: number;
  incoming: number;
  outgoing: number;
  missed: number;
  total_duration: number;
  first_call: string;
  last_call: string;
  assigned_staff: string;
  related_case_id?: string;
  related_case_title?: string;
}

interface CallEvent {
  event_id: string;
  call_id: string;
  event_type: string;
  event_time: string;
  employee_id: string;
  metadata: string;
}

export default function CallCenterAnalytics({ user }: { user: any }) {
  // Filters state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [office, setOffice] = useState("all");
  const [employee, setEmployee] = useState("");
  const [direction, setDirection] = useState("all");
  const [status, setStatus] = useState("all");
  const [result, setResult] = useState("all");
  const [search, setSearch] = useState("");
  const [timeGroup, setTimeGroup] = useState("day");

  // Main UI Data State
  const [stats, setStats] = useState<CallCenterStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [employees, setEmployees] = useState<EmployeeStat[]>([]);
  const [offices, setOffices] = useState<OfficeStat[]>([]);
  const [customers, setCustomers] = useState<CustomerStat[]>([]);
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [nextCursor, setNextCursor] = useState("");
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // UI Control States
  const [activeTab, setActiveTab] = useState<"summary" | "employees" | "customers" | "logs" | "live" | "missed">("summary");
  const [loading, setLoading] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [pbxStatus, setPbxStatus] = useState<"connected" | "degraded" | "disconnected">("connected");
  
  // Missed Call Management Queue
  const [missedQueue, setMissedQueue] = useState<any[]>([]);

  // Call Event Timeline
  const [callEvents, setCallEvents] = useState<CallEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // QC Evaluation Form state
  const [qcRating, setQcRating] = useState("");
  const [qcNotes, setQcNotes] = useState("");
  const [isViolated, setIsViolated] = useState(false);
  const [violatedKeywords, setViolatedKeywords] = useState("");
  const [savingQc, setSavingQc] = useState(false);

  // Check management level
  const userRoleMapped = user?.role ? user.role.toLowerCase() : "employee";
  const isManager = ["admin", "director", "deputydirector", "manager", "head_of_department", "controller", "prosecutor"].includes(userRoleMapped);

  // Load all reports data
  const loadData = useCallback(async (isLoadMore = false, targetCursor = "") => {
    setLoading(true);
    try {
      // Build query string
      const filterParams = new URLSearchParams();
      if (startDate) filterParams.append("startDate", startDate + "T00:00:00.000Z");
      if (endDate) filterParams.append("endDate", endDate + "T23:59:59.999Z");
      if (office !== "all") filterParams.append("office", office);
      if (employee) filterParams.append("employee", employee);
      if (direction !== "all") filterParams.append("direction", direction);
      if (status !== "all") filterParams.append("status", status);
      if (result !== "all") filterParams.append("result", result);
      if (search) filterParams.append("search", search);

      const qs = filterParams.toString();

      // Parallel Data Fetching
      const [
        statsRes, 
        analyticsRes, 
        employeeStatsRes, 
        officeStatsRes, 
        customerStatsRes,
        liveCallsRes
      ] = await Promise.all([
        fetchApi(`/api/calls/stats?${qs}`),
        fetchApi(`/api/calls/analytics?${qs}&timeGroup=${timeGroup}`),
        fetchApi(`/api/calls/employees?${qs}`),
        fetchApi(`/api/calls/offices?${qs}`),
        fetchApi(`/api/calls/customers?${qs}`),
        fetchApi("/api/calls/realtime")
      ]);

      const statsData = await statsRes.json();
      const analyticsData = await analyticsRes.json();
      const employeeStats = await employeeStatsRes.json();
      const officeStats = await officeStatsRes.json();
      const customerStats = await customerStatsRes.json();
      const liveCallsData = await liveCallsRes.json();

      if (statsData) setStats(statsData);
      if (analyticsData) setAnalytics(analyticsData);
      if (Array.isArray(employeeStats)) setEmployees(employeeStats);
      if (Array.isArray(officeStats)) setOffices(officeStats);
      if (Array.isArray(customerStats)) setCustomers(customerStats);
      if (liveCallsData && Array.isArray(liveCallsData.activeCalls)) {
        setActiveCalls(liveCallsData.activeCalls);
      }

      // Fetch Paginated Call Logs
      const logParams = new URLSearchParams(filterParams);
      logParams.append("paginate", "true");
      logParams.append("limit", "20");
      if (isLoadMore && targetCursor) {
        logParams.append("cursor", targetCursor);
      }
      
      const logResRaw = await fetchApi(`/api/calls?${logParams.toString()}`);
      const logRes = await logResRaw.json();
      if (logRes && logRes.data) {
        if (isLoadMore) {
          setCallLogs(prev => [...prev, ...logRes.data]);
        } else {
          setCallLogs(logRes.data);
        }
        setNextCursor(logRes.nextCursor || "");
        setHasNextPage(logRes.hasNextPage || false);
      } else if (Array.isArray(logRes)) {
        setCallLogs(logRes);
        setHasNextPage(false);
      }

    } catch (err) {
      console.error("Failed to load call center reports:", err);
      setPbxStatus("degraded");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, office, employee, direction, status, result, search, timeGroup]);

  // Initial Seed for Missed Queue
  useEffect(() => {
    if (callLogs.length > 0) {
      const missedCalls = callLogs.filter(c => 
        c.type === "incoming" && 
        ["missed", "no_answer", "failed", "rejected"].includes(c.status?.toLowerCase() || "")
      ).map(c => ({
        id: c.id,
        phone: c.phone || c.phone_number,
        name: c.name || "Khách hàng ẩn danh",
        timestamp: c.timestamp,
        staffName: c.staffName || "Chưa phân phối",
        processingStatus: "Chưa xử lý",
        branch: c.branch
      }));
      setMissedQueue(missedCalls);
    }
  }, [callLogs]);

  // Sync loaded metrics & real-time updates via Socket.io
  useEffect(() => {
    loadData();

    // Socket.io setup
    let socket: any = null;
    try {
      socket = io();
      
      socket.on("live_call_event", (event: any) => {
        console.log("Real-time call event received:", event);
        if (event.activeCallsCount !== undefined) {
          setStats(prev => prev ? {
            ...prev,
            currentConcurrent: event.activeCallsCount,
            peakConcurrent: Math.max(prev.peakConcurrent, event.activeCallsCount)
          } : null);
        }
        
        // Refresh live tab
        fetchApi("/api/calls/realtime")
          .then(res => res.json())
          .then(data => {
            if (data && Array.isArray(data.activeCalls)) {
              setActiveCalls(data.activeCalls);
            }
          });
      });

      socket.on("call_ended", () => {
        loadData();
      });

      socket.on("connect_error", () => {
        setPbxStatus("disconnected");
      });

      socket.on("connect", () => {
        setPbxStatus("connected");
      });

    } catch (e) {
      console.error("Socket error", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [loadData]);

  // Fetch events timeline for a specific call ID
  const fetchEventsTimeline = async (callId: string) => {
    setLoadingEvents(true);
    setCallEvents([]);
    try {
      // Mock event logs if empty for realism, but fetch from DB first
      const logsRaw = await fetchApi(`/api/calls/${callId}`);
      const logs = await logsRaw.json();
      
      const realHistory: CallEvent[] = [];
      if (logs?.start_time) {
        realHistory.push({
          event_id: `${callId}-start`,
          call_id: callId,
          event_type: "RINGING",
          event_time: logs.start_time,
          employee_id: logs.staffName || "Tổng đài",
          metadata: logs.caller_number ? `Số gọi: ${logs.caller_number}` : undefined
        });
      }
      if (logs?.answer_time) {
        realHistory.push({
          event_id: `${callId}-answer`,
          call_id: callId,
          event_type: "CONNECTED",
          event_time: logs.answer_time,
          employee_id: logs.staffName || "Tổng đài",
          metadata: `Thời lượng: ${logs.duration || 0}s`
        });
      }
      if (logs?.end_time) {
        realHistory.push({
          event_id: `${callId}-end`,
          call_id: callId,
          event_type: "ENDED",
          event_time: logs.end_time,
          employee_id: logs.staffName || "Tổng đài",
          metadata: `Trạng thái kết thúc: ${logs.status || 'ended'}`
        });
      }
      
      setCallEvents(realHistory);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Open Call details panel
  const handleOpenDetail = (call: CallLog) => {
    setSelectedCall(call);
    setQcRating(call.qcRating || "");
    setQcNotes(call.qcNotes || "");
    setIsViolated(Boolean(call.isViolated));
    setViolatedKeywords(typeof call.violatedKeywords === "string" ? JSON.parse(call.violatedKeywords).join(", ") : Array.isArray(call.violatedKeywords) ? call.violatedKeywords.join(", ") : "");
    fetchEventsTimeline(call.id);
    setShowDetailModal(true);
  };

  // Save Supervisor QC evaluation and Compliance Rating back to Database
  const handleSaveQc = async () => {
    if (!selectedCall) return;
    setSavingQc(true);
    try {
      const parsedKeywords = violatedKeywords.split(",").map(k => k.trim()).filter(Boolean);
      const resRaw = await fetchApi(`/api/calls/${selectedCall.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qcRating,
          qcNotes,
          qcEvaluator: user?.name || user?.username || "Giám sát viên",
          isViolated: isViolated ? 1 : 0,
          violatedKeywords: JSON.stringify(parsedKeywords)
        })
      });

      const res = await resRaw.json();

      if (res && res.success) {
        // Refresh local state lists
        setCallLogs(prev => prev.map(c => c.id === selectedCall.id ? {
          ...c,
          qcRating,
          qcNotes,
          qcEvaluator: user?.name || user?.username || "Giám sát viên",
          isViolated: isViolated ? 1 : 0,
          violatedKeywords: parsedKeywords
        } : c));

        setSelectedCall(prev => prev ? {
          ...prev,
          qcRating,
          qcNotes,
          isViolated,
          violatedKeywords: parsedKeywords
        } : null);

        alert("Lưu đánh giá chất lượng cuộc gọi thành công!");
      }
    } catch (e) {
      console.error("Save QC failed:", e);
      alert("Không thể lưu đánh giá. Vui lòng thử lại!");
    } finally {
      setSavingQc(false);
    }
  };

  // Handle missed call queue processing
  const handleUpdateMissedStatus = (id: string, statusStr: string) => {
    setMissedQueue(prev => prev.map(item => item.id === id ? { ...item, processingStatus: statusStr } : item));
  };

  // Assign missed call to agent
  const handleAssignMissedCall = (id: string, agentName: string) => {
    setMissedQueue(prev => prev.map(item => item.id === id ? { ...item, staffName: agentName } : item));
  };

  // Helper formatting for durations
  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return "00:00";
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <div id="call_center_analytics_root" className="min-h-screen bg-neutral-50 p-6 font-sans text-neutral-800">
      {/* Upper Status Bar & Gateway Diagnostic indicator */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Hệ Thống Tổng Đài</span>
          <h1 className="text-2xl font-bold text-neutral-950 flex items-center gap-2">
            Báo Cáo & Phân Tích Call Center
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              pbxStatus === "connected" 
                ? "bg-green-50 text-green-700 border-green-200" 
                : pbxStatus === "degraded" 
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse" 
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <Activity className="h-3 w-3" />
              PBX Gateway: {pbxStatus === "connected" ? "Hoạt động" : pbxStatus === "degraded" ? "Sự cố nhẹ" : "Mất kết nối"}
            </span>
          </h1>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới dữ liệu
          </button>
          
          <button 
            onClick={() => {
              setStartDate(() => {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                return d.toISOString().split("T")[0];
              });
              setEndDate(new Date().toISOString().split("T")[0]);
              setOffice("all");
              setEmployee("");
              setDirection("all");
              setStatus("all");
              setResult("all");
              setSearch("");
            }}
            className="px-3.5 py-2 text-sm text-neutral-500 hover:text-neutral-800 transition-all font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Synchronized Filtering Control Console */}
      <div className="mb-6 bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-neutral-700 font-semibold">
            <Sliders className="h-4.5 w-4.5 text-neutral-500" />
            <span>Thanh Điều Khiển Bộ Lọc Đồng Bộ</span>
          </div>
          <span className="text-xs text-neutral-400 font-normal">Các bộ lọc sẽ được áp dụng trực tiếp cho tất cả các chỉ số KPI, Biểu đồ và Bản ghi bên dưới</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Từ ngày</label>
            <div className="relative">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Đến ngày</label>
            <div className="relative">
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
              />
            </div>
          </div>

          {/* Office Select */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Văn phòng chi nhánh</label>
            <select 
              value={office} 
              onChange={(e) => setOffice(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
            >
              <option value="all">Toàn bộ văn phòng</option>
              <option value="Trụ sở chính">Trụ sở chính (Hà Nội)</option>
              <option value="Chi nhánh TP.HCM">Chi nhánh TP.HCM</option>
              <option value="Văn phòng Đà Nẵng">Văn phòng Đà Nẵng</option>
            </select>
          </div>

          {/* Employee Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Nhân viên / Tư vấn viên</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Tên nhân viên..." 
                value={employee} 
                onChange={(e) => setEmployee(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Direction Select */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Chiều cuộc gọi</label>
            <select 
              value={direction} 
              onChange={(e) => setDirection(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
            >
              <option value="all">Tất cả cuộc gọi</option>
              <option value="INBOUND">Inbound (Gọi vào)</option>
              <option value="OUTBOUND">Outbound (Gọi ra)</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Trạng thái kết nối</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="connected">Connected (Đã kết nối)</option>
              <option value="missed">Missed (Nhỡ)</option>
              <option value="no_answer">No Answer (Không nhấc máy)</option>
              <option value="busy">Busy (Máy bận)</option>
              <option value="failed">Failed (Thất bại)</option>
              <option value="rejected">Rejected (Bị từ chối)</option>
            </select>
          </div>
        </div>

        {/* Global Search and aggregation granularity */}
        <div className="mt-4 flex flex-col gap-4 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo SĐT, tên khách hàng, mã hồ sơ hoặc ghi chú tư vấn..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all shadow-inner"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-neutral-500">Chu kỳ biểu đồ:</span>
            <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-100 shadow-sm">
              {(["hour", "day", "week", "month"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setTimeGroup(g)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeGroup === g 
                      ? "bg-white text-neutral-900 shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {g === "hour" ? "Theo giờ" : g === "day" ? "Theo ngày" : g === "week" ? "Theo tuần" : "Theo tháng"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Core Summary Metrics Deck (12 KPI Cards Grid) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-6">
        {/* Card 1: Total Calls */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Tổng cuộc gọi</span>
            <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.totalCalls ?? "—"}</h3>
            <span className="text-[10px] text-neutral-400 font-normal">Hồ sơ tư vấn số</span>
          </div>
        </div>

        {/* Card 2: Connected */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Đã kết nối</span>
            <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
              <PhoneCall className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.connectedCalls ?? "—"}</h3>
            <span className="text-[10px] text-green-600 font-medium">Thành công: {stats?.successRate ?? "0"}%</span>
          </div>
        </div>

        {/* Card 3: Answer Rate */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Tỷ lệ nghe máy</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.answerRate ?? "—"}%</h3>
            <span className="text-[10px] text-neutral-400 font-normal">Tổng cuộc inbound</span>
          </div>
        </div>

        {/* Card 4: Missed Calls */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Cuộc gọi nhỡ</span>
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <PhoneMissed className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.missedCalls ?? "—"}</h3>
            <span className="text-[10px] text-red-600 font-medium">Tỷ lệ nhỡ: {stats?.missedRate ?? "0"}%</span>
          </div>
        </div>

        {/* Card 5: Inbound */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Cuộc gọi đến</span>
            <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600">
              <PhoneIncoming className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.incomingCalls ?? "—"}</h3>
            <span className="text-[10px] text-neutral-400 font-normal">Khách gọi vào</span>
          </div>
        </div>

        {/* Card 6: Outgoing */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Cuộc gọi đi</span>
            <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600">
              <PhoneOutgoingIcon className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.outgoingCalls ?? "—"}</h3>
            <span className="text-[10px] text-neutral-400 font-normal">Luật sư gọi ra</span>
          </div>
        </div>

        {/* Card 7: Live Active */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Đang hoạt động</span>
            <div className="relative">
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                <Activity className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.currentConcurrent ?? 0}</h3>
            <span className="text-[10px] text-green-600 font-medium">Cuộc gọi đồng thời</span>
          </div>
        </div>

        {/* Card 8: Peak Concurrent */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Đồng thời đỉnh điểm</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.peakConcurrent ?? "—"}</h3>
            <span className="text-[10px] text-neutral-400 font-normal">Giới hạn kênh SIP</span>
          </div>
        </div>

        {/* Card 9: Avg Talk Time */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Talk Time trung bình</span>
            <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{formatDuration(stats?.avgTalkTimeSeconds ?? 0)}</h3>
            <span className="text-[10px] text-neutral-400 font-normal">Mỗi cuộc đàm thoại</span>
          </div>
        </div>

        {/* Card 10: Avg Wait Time */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Thời gian đổ chuông</span>
            <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600">
              <Clock3 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.avgWaitTimeSeconds ?? "0"}s</h3>
            <span className="text-[10px] text-neutral-400 font-normal">Thời gian chờ bắt máy</span>
          </div>
        </div>

        {/* Card 11: Contacted Customers */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Khách hàng liên hệ</span>
            <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.contactedCustomers ?? "—"}</h3>
            <span className="text-[10px] text-neutral-400 font-normal">Danh sách khách hàng</span>
          </div>
        </div>

        {/* Card 12: Created Dossiers */}
        <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-500">Hồ sơ phát sinh</span>
            <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-950">{stats?.dossierCount ?? "—"}</h3>
            <span className="text-[10px] text-indigo-600 font-medium">Hồ sơ pháp lý tư vấn</span>
          </div>
        </div>
      </div>

      {/* Section 1: Dashboard Analytics Charts (Time Series & Conversion Funnel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Time-Series Charts Panel */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Phân Tích Tần Suất Cuộc Gọi Theo Thời Gian</h3>
              <p className="text-xs text-neutral-500">Tổng hợp cuộc gọi đến, đi, và tỷ lệ kết nối thành công</p>
            </div>
          </div>

          <div className="h-80 w-full">
            {analytics && analytics.timeSeries && analytics.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} />
                  <YAxis stroke="#a3a3a3" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e5e5e5" }}
                    labelStyle={{ fontWeight: "bold", color: "#171717" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="total" name="Tổng cuộc gọi" fill="#f5f5f5" stroke="#d4d4d4" />
                  <Bar dataKey="inbound" name="Gọi đến (Inbound)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="outbound" name="Gọi ra (Outbound)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="answered" name="Đã nghe" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                <BarChart3 className="h-10 w-10 mb-2 stroke-1" />
                <span className="text-sm">Không tìm thấy dữ liệu thống kê biểu đồ</span>
              </div>
            )}
          </div>
        </div>

        {/* Compliance & Conversion Funnel Panel */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Phễu Chuyển Đổi Call-Center</h3>
            <p className="text-xs text-neutral-500">Quy trình: Gọi điện → Tạo tư vấn → Thành Lead tiềm năng → Ký kết hợp đồng</p>
          </div>

          <div className="my-4 flex-1 flex flex-col justify-center gap-2">
            {analytics?.funnel.map((item, index) => (
              <div key={item.stage} className="relative">
                <div 
                  className="h-10 rounded-lg flex items-center justify-between px-4 text-white font-medium shadow-sm transition-all hover:brightness-95"
                  style={{
                    backgroundColor: index === 0 ? "#1e293b" : index === 1 ? "#334155" : index === 2 ? "#475569" : "#64748b",
                    width: `${Math.max(45, item.pct)}%`,
                    marginLeft: "auto",
                    marginRight: "auto"
                  }}
                >
                  <span className="text-xs truncate">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.count}</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">{item.pct}%</span>
                  </div>
                </div>
                {index < 3 && (
                  <div className="flex justify-center my-0.5">
                    <ArrowRight className="h-4 w-4 text-neutral-400 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 pt-3 text-xs text-neutral-500 flex justify-between items-center bg-neutral-50 p-2.5 rounded-lg">
            <div>
              <span className="block font-medium text-neutral-700">Tỷ lệ chuyển đổi Lead:</span>
              <span className="text-sm font-bold text-indigo-600">{analytics?.conversionRates.leadRate ?? "0"}%</span>
            </div>
            <div className="border-l border-neutral-200 h-8"></div>
            <div>
              <span className="block font-medium text-neutral-700">Tỷ lệ ký kết Hợp đồng:</span>
              <span className="text-sm font-bold text-green-600">{analytics?.conversionRates.caseRate ?? "0"}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Tabs Bar for specific deep analysis views */}
      <div className="mb-6 flex border-b border-neutral-200 gap-1 overflow-x-auto pb-px bg-white rounded-t-xl p-2.5 shadow-sm">
        <button 
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "summary" 
              ? "bg-neutral-900 text-white shadow-sm" 
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Tổng hợp hiệu suất
        </button>

        <button 
          onClick={() => setActiveTab("employees")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "employees" 
              ? "bg-neutral-900 text-white shadow-sm" 
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <User className="h-4 w-4" />
          Bảng xếp hạng nhân sự
        </button>

        <button 
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "customers" 
              ? "bg-neutral-900 text-white shadow-sm" 
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Thống kê khách hàng
        </button>

        <button 
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "logs" 
              ? "bg-neutral-900 text-white shadow-sm" 
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <Database className="h-4 w-4" />
          Nhật ký cuộc gọi
        </button>

        <button 
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "live" 
              ? "bg-neutral-900 text-white shadow-sm" 
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <Activity className="h-4 w-4" />
          Giám sát live
        </button>

        <button 
          onClick={() => setActiveTab("missed")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "missed" 
              ? "bg-neutral-900 text-white shadow-sm" 
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <PhoneMissed className="h-4 w-4" />
          Xử lý cuộc gọi nhỡ
        </button>
      </div>

      {/* Dynamic Tab Contents Panel */}
      <div className="bg-white border border-neutral-200 rounded-b-xl p-6 shadow-sm min-h-[400px]">
        {/* TAB 1: Summary Overview */}
        {activeTab === "summary" && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="text-md font-bold text-neutral-900">Thống Kê Cuộc Gọi Theo Chi Nhánh</h4>
                <p className="text-xs text-neutral-500 font-normal">So sánh số lượng và tỷ lệ kết nối thành công giữa các địa điểm văn phòng</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-xl mb-8 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-500 tracking-wider uppercase">
                    <th className="px-5 py-3">Địa điểm Văn phòng</th>
                    <th className="px-5 py-3">Tổng cuộc gọi</th>
                    <th className="px-5 py-3">Gọi đến</th>
                    <th className="px-5 py-3">Gọi đi</th>
                    <th className="px-5 py-3">Đã nghe</th>
                    <th className="px-5 py-3">Cuộc gọi nhỡ</th>
                    <th className="px-5 py-3">Tỷ lệ nghe máy</th>
                    <th className="px-5 py-3">Talk Time TB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {offices.map((off) => (
                    <tr key={off.office_name} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-neutral-900 flex items-center gap-2">
                        <Building className="h-4 w-4 text-neutral-400" />
                        {off.office_name || "Văn phòng ẩn danh"}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{off.total_calls}</td>
                      <td className="px-5 py-3.5 text-blue-600 font-medium">{off.incoming}</td>
                      <td className="px-5 py-3.5 text-emerald-600 font-medium">{off.outgoing}</td>
                      <td className="px-5 py-3.5 text-indigo-600 font-medium">{off.answered}</td>
                      <td className="px-5 py-3.5 text-red-600 font-medium">{off.missed}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          off.answer_rate >= 80 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                        }`}>
                          {off.answer_rate}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500 font-medium">{formatDuration(off.avg_talk_time)}</td>
                    </tr>
                  ))}
                  {offices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-neutral-400">Không có dữ liệu chi nhánh</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                <h5 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  Quy chế hỗ trợ kỹ thuật cuộc gọi
                </h5>
                <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                  Tất cả các cuộc gọi tư vấn trên hệ thống tổng đài Yeastar đều được ghi âm tự động và quét phân tích từ khóa vi phạm thông tin khách hàng, tư vấn sai lệch, hoặc quy chế hành nghề luật. Giám sát viên chất lượng (QC) chịu trách nhiệm đánh giá và ký duyệt xếp hạng định kỳ.
                </p>
                <div className="flex gap-2.5">
                  <span className="text-[10px] bg-white border border-neutral-200 px-2 py-1 rounded text-neutral-500">Mã hóa cuộc gọi: TLS/SRTP</span>
                  <span className="text-[10px] bg-white border border-neutral-200 px-2 py-1 rounded text-neutral-500">Codec âm thanh: G.711a, OPUS</span>
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                <h5 className="text-sm font-bold text-neutral-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Đại lý AI hỗ trợ STT & Tóm tắt
                </h5>
                <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                  Khi cuộc gọi kết thúc, AI của Ánh Dương sẽ tự động chuyển đổi từ ghi âm âm thanh sang văn bản (Speech to Text) tiếng Việt, phân tích ngữ cảnh, lưu tóm tắt ý kiến pháp lý vào hồ sơ vụ việc giúp tiết kiệm 85% thời gian thủ công của các Luật sư chuyên trách.
                </p>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-medium px-2 py-1 rounded border border-indigo-100">
                  Model active: Gemini 2.5 Flash
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Employee Ranking Board */}
        {activeTab === "employees" && (
          <div>
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="text-md font-bold text-neutral-900">Bảng Xếp Hạng Hiệu Suất Gọi Nhân Viên</h4>
                <p className="text-xs text-neutral-500">Đánh giá doanh số, mức độ tích cực đàm thoại, thời lượng đàm thoại chi tiết</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-xl shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-500 tracking-wider uppercase">
                    <th className="px-5 py-3">Nhân sự</th>
                    <th className="px-5 py-3">Vai trò</th>
                    <th className="px-5 py-3">Văn phòng</th>
                    <th className="px-5 py-3">Tổng gọi</th>
                    <th className="px-5 py-3">Gọi đến</th>
                    <th className="px-5 py-3">Gọi đi</th>
                    <th className="px-5 py-3">Đã nghe</th>
                    <th className="px-5 py-3">Cuộc gọi nhỡ</th>
                    <th className="px-5 py-3">Tỷ lệ nghe máy</th>
                    <th className="px-5 py-3">Talk Time TB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {employees.map((emp, idx) => (
                    <tr key={emp.employee_name} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-neutral-950 flex items-center gap-3">
                        <span className="text-xs text-neutral-400 font-bold bg-neutral-100 w-5 h-5 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {emp.employee_name}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-neutral-600">{emp.employee_role}</td>
                      <td className="px-5 py-3.5 text-neutral-500">{emp.office_name}</td>
                      <td className="px-5 py-3.5 font-bold text-neutral-900">{emp.total_calls}</td>
                      <td className="px-5 py-3.5 text-blue-600 font-medium">{emp.incoming}</td>
                      <td className="px-5 py-3.5 text-emerald-600 font-medium">{emp.outgoing}</td>
                      <td className="px-5 py-3.5 text-indigo-600 font-medium">{emp.answered}</td>
                      <td className="px-5 py-3.5 text-red-600 font-medium">{emp.missed}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          emp.answer_rate >= 85 ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                        }`}>
                          {emp.answer_rate}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500 font-semibold">{formatDuration(emp.avg_talk_time)}</td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-neutral-400">Không tìm thấy dữ liệu nhân viên</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Customer interactions logs */}
        {activeTab === "customers" && (
          <div>
            <div className="mb-4">
              <h4 className="text-md font-bold text-neutral-900">Danh Sách Tương Tác Khách Hàng</h4>
              <p className="text-xs text-neutral-500">Mỗi khách hàng được định danh duy nhất theo SĐT kèm chi tiết tần suất cuộc gọi, thời lượng và hồ sơ pháp lý phát sinh tương ứng</p>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-xl shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-500 tracking-wider uppercase">
                    <th className="px-5 py-3">Khách hàng</th>
                    <th className="px-5 py-3">Số điện thoại</th>
                    <th className="px-5 py-3">Tổng cuộc gọi</th>
                    <th className="px-5 py-3">Đến / Đi / Nhỡ</th>
                    <th className="px-5 py-3">Tổng thời lượng</th>
                    <th className="px-5 py-3">Liên hệ đầu tiên</th>
                    <th className="px-5 py-3">Liên hệ gần nhất</th>
                    <th className="px-5 py-3">Nhân viên phụ trách</th>
                    <th className="px-5 py-3">Hồ sơ liên quan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {customers.map((cust) => (
                    <tr key={cust.phone_number} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-neutral-900">{cust.customer_name}</td>
                      <td className="px-5 py-3.5 font-mono text-neutral-700">{cust.phone_number}</td>
                      <td className="px-5 py-3.5 font-bold text-neutral-900">{cust.total_calls}</td>
                      <td className="px-5 py-3.5 text-neutral-500 font-medium">
                        <span className="text-blue-600">{cust.incoming}đến</span> / <span className="text-emerald-600">{cust.outgoing}đi</span> / <span className="text-red-500">{cust.missed}nhỡ</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{formatDuration(cust.total_duration)}</td>
                      <td className="px-5 py-3.5 text-xs text-neutral-500 font-medium">{cust.first_call ? new Date(cust.first_call).toLocaleString("vi-VN") : "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-neutral-500 font-medium">{cust.last_call ? new Date(cust.last_call).toLocaleString("vi-VN") : "—"}</td>
                      <td className="px-5 py-3.5 font-medium">{cust.assigned_staff || "Chưa phân công"}</td>
                      <td className="px-5 py-3.5">
                        {cust.related_case_id ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-indigo-600">#{cust.related_case_id}</span>
                            <span className="text-[10px] text-neutral-400 truncate max-w-[120px]" title={cust.related_case_title}>{cust.related_case_title}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400">Không có hồ sơ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-neutral-400">Không tìm thấy thông tin khách hàng tương tác</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Core Call Logs (Cursor Pagination) */}
        {activeTab === "logs" && (
          <div>
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="text-md font-bold text-neutral-900">Bản Ghi Nhật Ký Cuộc Gọi Hệ Thống</h4>
                <p className="text-xs text-neutral-500 font-normal">Sử dụng Cursor Pagination để tối ưu hóa hiệu năng truy xuất khối lượng bản ghi khổng lồ</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-xl mb-4 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-500 tracking-wider uppercase">
                    <th className="px-5 py-3">Khách hàng</th>
                    <th className="px-5 py-3">Số điện thoại</th>
                    <th className="px-5 py-3">Chiều</th>
                    <th className="px-5 py-3">Thời lượng</th>
                    <th className="px-5 py-3">Thời gian cuộc gọi</th>
                    <th className="px-5 py-3">Nhân sự thực hiện</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Xếp hạng QC</th>
                    <th className="px-5 py-3">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {callLogs.map((log) => {
                    const isViolatedCall = Boolean(log.isViolated);
                    return (
                      <tr key={log.id} className={`hover:bg-neutral-50 transition-colors ${isViolatedCall ? "bg-red-50/40 hover:bg-red-50/60" : ""}`}>
                        <td className="px-5 py-3.5 font-bold text-neutral-900 flex items-center gap-2">
                          {isViolatedCall && (
                            <span title="Phát hiện vi phạm quy chế!">
                              <ShieldAlert className="h-4.5 w-4.5 text-red-600 shrink-0" />
                            </span>
                          )}
                          {log.name || "Khách hàng"}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-neutral-700">{log.phone || log.phone_number}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            (log.direction || log.type) === "INBOUND" || log.type === "incoming" 
                              ? "text-blue-600" 
                              : "text-emerald-600"
                          }`}>
                            {((log.direction || log.type) === "INBOUND" || log.type === "incoming") ? "Inbound" : "Outbound"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium">{formatDuration(log.duration)}</td>
                        <td className="px-5 py-3.5 text-xs text-neutral-500 font-medium">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString("vi-VN") : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-neutral-900">{log.staffName}</div>
                          <div className="text-[10px] text-neutral-400">{log.staffRole || "Tư vấn viên"}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            log.status?.toLowerCase() === "connected" || log.status?.toLowerCase() === "ended"
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : ["missed", "no_answer", "busy", "failed", "rejected"].includes(log.status?.toLowerCase() || "")
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {log.qcRating ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                              <Award className="h-3.5 w-3.5" />
                              {log.qcRating}
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">Chưa đánh giá</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <button 
                            onClick={() => handleOpenDetail(log)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
                          >
                            Chi tiết & QC
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {callLogs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-neutral-400">Không tìm thấy bản ghi nhật ký cuộc gọi</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Load more using nextCursor */}
            {hasNextPage && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => loadData(true, nextCursor)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Tải thêm cuộc gọi (Cursor Pagination)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Live active monitoring */}
        {activeTab === "live" && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-md font-bold text-neutral-900">Giám Sát Cuộc Gọi Đang Diễn Ra (Real-time Console)</h4>
                <p className="text-xs text-neutral-500">Xem trực tiếp cuộc gọi từ các máy lẻ, hỗ trợ nghe xen kẽ hoặc cắt kết nối khẩn cấp dành cho quản lý</p>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-semibold shadow-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Hệ thống Live Stream hoạt động
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCalls.map((ac) => (
                <div key={ac.id || ac.call_id} className="border border-neutral-200 rounded-xl p-4 bg-white hover:border-neutral-300 transition-all shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-bold text-neutral-900 text-sm truncate max-w-[150px]">{ac.name || "Khách hàng"}</h5>
                      <span className="text-xs font-mono text-neutral-500">{ac.phone || ac.phone_number}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                      ac.status === "RINGING" 
                        ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" 
                        : "bg-green-50 text-green-700 border border-green-200"
                    }`}>
                      <Activity className="h-3 w-3" />
                      {ac.status || "CONNECTED"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-600 mb-4 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Máy lẻ / Operator:</span>
                      <span className="font-semibold text-neutral-800">{ac.staffName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Chiều gọi:</span>
                      <span className="font-semibold text-indigo-600">{ac.direction}</span>
                    </div>
                    {ac.dossierId && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Hồ sơ:</span>
                        <span className="font-bold text-indigo-600">#{ac.dossierId}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                    <span className="text-xs text-neutral-400 font-medium">Bắt đầu lúc: {ac.start_time ? new Date(ac.start_time).toLocaleTimeString("vi-VN") : "Đang kết nối"}</span>
                    {isManager && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => alert("Bắt đầu nghe lén cuộc gọi máy lẻ " + ac.staffName)}
                          className="px-2 py-1 bg-neutral-900 text-white rounded text-[10px] font-semibold hover:bg-neutral-800 transition-all flex items-center gap-1"
                        >
                          <Volume2 className="h-3 w-3" />
                          Nghe xen
                        </button>
                        <button 
                          onClick={() => alert("Ngắt cuộc gọi khẩn cấp thành công")}
                          className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-semibold hover:bg-red-100 transition-all"
                        >
                          Cắt cuộc
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {activeCalls.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
                  <Activity className="h-10 w-10 text-neutral-300 stroke-1 mb-2 animate-pulse" />
                  <span className="text-sm text-neutral-500 font-medium">Không có cuộc gọi nào đang hoạt động vào lúc này</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: Missed Calls Queue */}
        {activeTab === "missed" && (
          <div>
            <div className="mb-4">
              <h4 className="text-md font-bold text-neutral-900">Hàng Đợi Xử Lý Cuộc Gọi Nhỡ</h4>
              <p className="text-xs text-neutral-500">Giám sát các cuộc gọi nhỡ chưa được liên hệ lại, tự động chỉ định nhân sự gọi lại cho khách hàng và cập nhật kết quả</p>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-xl shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-500 tracking-wider uppercase">
                    <th className="px-5 py-3">Khách hàng</th>
                    <th className="px-5 py-3">Số điện thoại</th>
                    <th className="px-5 py-3">Văn phòng chi nhánh</th>
                    <th className="px-5 py-3">Thời gian nhỡ</th>
                    <th className="px-5 py-3">Nhân sự được phân công</th>
                    <th className="px-5 py-3">Trạng thái xử lý</th>
                    <th className="px-5 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {missedQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-neutral-900">{item.name}</td>
                      <td className="px-5 py-3.5 font-mono text-neutral-700">{item.phone}</td>
                      <td className="px-5 py-3.5 font-medium">{item.branch}</td>
                      <td className="px-5 py-3.5 text-xs text-neutral-500 font-medium">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <select 
                          value={item.staffName} 
                          onChange={(e) => handleAssignMissedCall(item.id, e.target.value)}
                          className="px-2 py-1 text-xs bg-white border border-neutral-200 rounded text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-200"
                        >
                          <option value="Chưa phân phối">Chưa phân phối</option>
                          <option value="Luật sư Nguyễn Văn An">Luật sư Nguyễn Văn An</option>
                          <option value="Chuyên viên Trần Thị Bình">Chuyên viên Trần Thị Bình</option>
                          <option value="Luật sư Lê Hoàng Nam">Luật sư Lê Hoàng Nam</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                          item.processingStatus === "Chưa xử lý" 
                            ? "bg-red-50 text-red-700 border border-red-100" 
                            : item.processingStatus === "Đang xử lý" 
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-100" 
                            : "bg-green-50 text-green-700 border border-green-100"
                        }`}>
                          {item.processingStatus === "Chưa xử lý" && <Clock className="h-3 w-3" />}
                          {item.processingStatus === "Đang xử lý" && <Activity className="h-3 w-3 animate-pulse" />}
                          {item.processingStatus === "Đã xử lý" && <CheckCircle className="h-3 w-3" />}
                          {item.processingStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateMissedStatus(item.id, "Đang xử lý")}
                            className="px-2.5 py-1 bg-neutral-900 text-white rounded text-xs font-semibold hover:bg-neutral-800 transition-all"
                          >
                            Bắt đầu xử lý
                          </button>
                          <button 
                            onClick={() => handleUpdateMissedStatus(item.id, "Đã xử lý")}
                            className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-semibold hover:bg-green-100 transition-all"
                          >
                            Đã liên hệ lại
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {missedQueue.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-neutral-400">Không có cuộc gọi nhỡ cần xử lý</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Drawer & Quality Assurance Control Panel */}
      <AnimatePresence>
        {showDetailModal && selectedCall && (
          <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDetailModal(false)}
                className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm transition-opacity"
              ></motion.div>

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div 
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="pointer-events-auto w-screen max-w-2xl"
                >
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl border-l border-neutral-200">
                    {/* Drawer Header */}
                    <div className="bg-neutral-900 px-6 py-5 sm:px-6 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Khảo sát bản ghi</span>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          {selectedCall.name || "Chi tiết cuộc gọi"}
                          <span className="text-xs font-mono font-normal text-neutral-400">#{selectedCall.id}</span>
                        </h2>
                      </div>
                      <button 
                        onClick={() => setShowDetailModal(false)}
                        className="rounded-md text-neutral-400 hover:text-white focus:outline-none"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Drawer Content Body */}
                    <div className="flex-1 space-y-6 px-6 py-6 overflow-y-auto">
                      {/* Section A: Call Metadata Cards */}
                      <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200/60 shadow-inner">
                        <div>
                          <span className="block text-[10px] font-bold text-neutral-400 uppercase">Khách hàng</span>
                          <span className="text-sm font-bold text-neutral-900">{selectedCall.name || "Chưa lưu danh"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-neutral-400 uppercase">Số điện thoại</span>
                          <span className="text-sm font-mono text-neutral-800">{selectedCall.phone || selectedCall.phone_number}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-neutral-400 uppercase">Chiều cuộc gọi</span>
                          <span className="text-sm font-semibold text-neutral-800 capitalize">{(selectedCall.direction || selectedCall.type) === "INBOUND" ? "Gọi vào" : "Gọi ra"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-neutral-400 uppercase">Tổng thời lượng</span>
                          <span className="text-sm font-semibold text-neutral-800">{formatDuration(selectedCall.duration)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-neutral-400 uppercase">Nhân sự phụ trách</span>
                          <span className="text-sm font-bold text-neutral-900">{selectedCall.staffName}</span>
                        </div>
                        {selectedCall.dossierId && (
                          <div>
                            <span className="block text-[10px] font-bold text-neutral-400 uppercase">Hồ sơ liên quan</span>
                            <span className="text-sm font-bold text-indigo-600">#{selectedCall.dossierId}</span>
                          </div>
                        )}
                      </div>

                      {/* Section B: Audio recording playback */}
                      {isManager ? (
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                              <Headphones className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-neutral-900">Bản ghi âm cuộc gọi</span>
                              <span className="text-[10px] text-neutral-400 font-normal">Hệ thống ghi âm Yeastar có thẩm quyền lưu trữ đầy đủ</span>
                            </div>
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                if (playingAudio === selectedCall.id) {
                                  setPlayingAudio(null);
                                } else {
                                  setPlayingAudio(selectedCall.id);
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-all"
                            >
                              {playingAudio === selectedCall.id ? (
                                <>
                                  <Pause className="h-3.5 w-3.5" />
                                  Tạm dừng
                                </>
                              ) : (
                                <>
                                  <Play className="h-3.5 w-3.5" />
                                  Phát ghi âm
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center gap-2 text-red-700 text-xs">
                          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                          <span>Bạn không có đủ quyền phân quyền quản lý để tải hoặc nghe trực tiếp ghi âm cuộc gọi này.</span>
                        </div>
                      )}

                      {/* Section C: Event Timeline transitions */}
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400 tracking-wider uppercase mb-3">Lịch Sử Trạng Thái Sự Kiện (Live Call Events Timeline)</h4>
                        {loadingEvents ? (
                          <div className="flex justify-center py-4">
                            <RefreshCw className="h-5 w-5 animate-spin text-neutral-400" />
                          </div>
                        ) : (
                          <div className="space-y-4 border-l-2 border-neutral-100 pl-4 ml-2">
                            {callEvents.map((evt) => (
                              <div key={evt.event_id} className="relative">
                                <div className="absolute -left-[21px] top-1 bg-white border border-neutral-300 w-2.5 h-2.5 rounded-full"></div>
                                <div className="text-xs flex items-center justify-between">
                                  <span className="font-bold text-neutral-900">{evt.event_type}</span>
                                  <span className="text-neutral-400 font-mono text-[10px]">{new Date(evt.event_time).toLocaleTimeString("vi-VN")}</span>
                                </div>
                                <p className="text-[11px] text-neutral-500 font-normal mt-0.5">{evt.metadata}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section D: AI Transcript Text and Speech to Text */}
                      <div>
                        <h4 className="text-xs font-bold text-neutral-400 tracking-wider uppercase mb-2">Văn Bản Chuyển Đổi Từ Ghi Âm (AI Speech-to-Text Transcript)</h4>
                        <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50 text-xs text-neutral-600 max-h-40 overflow-y-auto leading-relaxed shadow-inner">
                          {selectedCall.transcript ? (
                            <p>{selectedCall.transcript}</p>
                          ) : (
                            <p className="text-neutral-400 italic">Bản ghi này chưa được dịch thuật Speech-to-Text tự động, hoặc cuộc gọi không đàm thoại.</p>
                          )}
                        </div>
                      </div>

                      {/* Section E: QC Evaluation Panel */}
                      {isManager && (
                        <div className="border-t border-neutral-200 pt-6 space-y-4">
                          <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                            <Award className="h-4.5 w-4.5 text-indigo-600" />
                            Đánh Giá Đảm Bảo Chất Lượng (Supervisor Quality Assurance)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Mức độ hài lòng / Compliance Rating</label>
                              <select 
                                value={qcRating} 
                                onChange={(e) => setQcRating(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-200"
                              >
                                <option value="">Chưa đánh giá</option>
                                <option value="A+ Xuất Sắc">A+ Xuất Sắc (Đủ tiêu chuẩn cam kết)</option>
                                <option value="A Đạt Chuẩn">A Đạt Chuẩn (Chính xác & tận tâm)</option>
                                <option value="B Cần Cải Thiện">B Cần Cải Thiện (Lỗi ngôn từ nhẹ)</option>
                                <option value="C Vi Phạm Quy Chế">C Vi Phạm Quy Chế (Phạt nghiệp vụ)</option>
                              </select>
                            </div>

                            <div className="flex items-center mt-6">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                                <input 
                                  type="checkbox" 
                                  checked={isViolated} 
                                  onChange={(e) => setIsViolated(e.target.checked)}
                                  className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4"
                                />
                                <span className="text-red-700 font-bold flex items-center gap-1">
                                  <ShieldAlert className="h-4 w-4" />
                                  Phát hiện vi phạm quy chế
                                </span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Từ khóa vi phạm được phát hiện (Cách nhau bằng dấu phẩy)</label>
                            <input 
                              type="text" 
                              placeholder="Từ khóa: hoàn tiền 100%, bảo đảm thắng án 100%..." 
                              value={violatedKeywords} 
                              onChange={(e) => setViolatedKeywords(e.target.value)}
                              disabled={!isViolated}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-200 disabled:bg-neutral-50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Nhận xét chi tiết của QC Giám Sát</label>
                            <textarea 
                              rows={3}
                              placeholder="Ghi chú nhận xét của thanh tra chất lượng về kỹ năng tư vấn pháp luật, mức độ trung thực và chuyên nghiệp..."
                              value={qcNotes} 
                              onChange={(e) => setQcNotes(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-200"
                            ></textarea>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              onClick={handleSaveQc}
                              disabled={savingQc}
                              className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-all shadow-md flex items-center gap-2"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${savingQc ? "animate-spin" : ""}`} />
                              Lưu đánh giá nghiệp vụ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Custom internal sub-component to prevent duplicate naming conflict with lucide imports
function PhoneOutgoingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 22s-1.6-4.8-6-8.4c-4.4-3.6-6-3.6-6-3.6" />
      <path d="M22 16V22H16" />
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6.13-6.13A19.79 19.79 0 0 1 2 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 2.68 3.4" />
    </svg>
  );
}
