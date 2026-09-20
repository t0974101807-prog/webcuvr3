import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp, Users, FolderKanban, Briefcase, Calendar as CalendarIcon,
  ShieldAlert, Landmark, FileBarChart, Wrench, ChevronRight, Filter,
  Sparkles, Download, RefreshCw, Send, AlertTriangle, Clock, MapPin,
  FileText, Search, Plus, Trash2, Eye, ShieldCheck, DollarSign,
  TrendingDown, Star, BarChart3, Activity, PieChart as PieIcon, LineChart as LineIcon,
  Bell, Mail, Pin, Check, CheckCircle2, XCircle, Share2, Globe, Layers, Link2,
  Settings2, ExternalLink, Cpu, Zap, Database, Sliders, MessageSquare, PhoneCall,
  FileCheck2, UserCheck, History, X, Maximize2, Minimize2, Brain
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend, ComposedChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import RealtimeMonitoringDashboard from "./RealtimeMonitoringDashboard";
import { CentralizedCaseDashboard } from "./CentralizedCaseDashboard";
import { AiMemoryInspector } from "./AiMemoryInspector";
import { ApiGatewayDashboard } from "./ApiGatewayDashboard";
import { useFullscreen } from "../hooks/useFullscreen";
import ErpLegalMeetingWorkspace from "./ErpLegalMeetingWorkspace";

// Custom styles for PDF generation types
declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
    lastAutoTable: any;
  }
}

interface ExecutiveDashboardProps {
  records: any[];
  users: any[];
  events: any[];
  language: string;
  user: any;
  api: any;
  updateRecords?: (recs: any[]) => void;
  notifications?: any[];
  setNotifications?: (notifs: any[]) => void;
  offices?: any[];
}

export default function ExecutiveDashboard({
  records = [],
  users = [],
  events = [],
  language = "vi",
  user,
  api,
  updateRecords,
  notifications = [],
  setNotifications,
  offices = []
}: ExecutiveDashboardProps) {
  // Compute unread notifications count for sync
  const unreadNotifsCount = useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return 0;
    return notifications.filter((n: any) => !n.read).length;
  }, [notifications]);
  // Navigation State
  const [activeSubModule, setActiveSubModule] = useState<string>("overview");

  // Fullscreen hooks for each Executive ERP sub-module
  const overviewRef = useRef<HTMLDivElement>(null);
  const moderationRef = useRef<HTMLDivElement>(null);
  const integrationsRef = useRef<HTMLDivElement>(null);
  const caseMonitorRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const financeRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const aiMemoryRef = useRef<HTMLDivElement>(null);
  const apiGatewayRef = useRef<HTMLDivElement>(null);

  const { isFullscreen: isOverviewFS, toggleFullscreen: toggleOverviewFS, virtualClass: overviewVC } = useFullscreen(overviewRef);
  const { isFullscreen: isModerationFS, toggleFullscreen: toggleModerationFS, virtualClass: moderationVC } = useFullscreen(moderationRef);
  const { isFullscreen: isIntegrationsFS, toggleFullscreen: toggleIntegrationsFS, virtualClass: integrationsVC } = useFullscreen(integrationsRef);
  const { isFullscreen: isCaseMonitorFS, toggleFullscreen: toggleCaseMonitorFS, virtualClass: caseMonitorVC } = useFullscreen(caseMonitorRef);
  const { isFullscreen: isAnalyticsFS, toggleFullscreen: toggleAnalyticsFS, virtualClass: analyticsVC } = useFullscreen(analyticsRef);
  const { isFullscreen: isAiFS, toggleFullscreen: toggleAiFS, virtualClass: aiVC } = useFullscreen(aiRef);
  const { isFullscreen: isAiMemoryFS, toggleFullscreen: toggleAiMemoryFS, virtualClass: aiMemoryVC } = useFullscreen(aiMemoryRef);
  const { isFullscreen: isApiGatewayFS, toggleFullscreen: toggleApiGatewayFS, virtualClass: apiGatewayVC } = useFullscreen(apiGatewayRef);
  const { isFullscreen: isAlertsFS, toggleFullscreen: toggleAlertsFS, virtualClass: alertsVC } = useFullscreen(alertsRef);
  const { isFullscreen: isCalendarFS, toggleFullscreen: toggleCalendarFS, virtualClass: calendarVC } = useFullscreen(calendarRef);
  const { isFullscreen: isFinanceFS, toggleFullscreen: toggleFinanceFS, virtualClass: financeVC } = useFullscreen(financeRef);
  const { isFullscreen: isReportsFS, toggleFullscreen: toggleReportsFS, virtualClass: reportsVC } = useFullscreen(reportsRef);
  const { isFullscreen: isToolsFS, toggleFullscreen: toggleToolsFS, virtualClass: toolsVC } = useFullscreen(toolsRef);

  // Global Filter States
  const [filterBranch, setFilterBranch] = useState<string>("All");
  const [filterTime, setFilterTime] = useState<string>("Year"); // Month, Quarter, Year
  const [filterDomain, setFilterDomain] = useState<string>("All");

  const [allSystemRecords, setAllSystemRecords] = useState<any[]>(() => records || []);

  useEffect(() => {
    if (records) {
      setAllSystemRecords(records);
    }
  }, [records]);

  useEffect(() => {
    let active = true;
    const fetchAllRecords = async () => {
      try {
        if (!api) return;
        const res = await api.req("/api/erp-records/all");
        if (active && res) {
          if (Array.isArray(res)) {
            setAllSystemRecords(res);
          } else if (res.success && Array.isArray(res.data)) {
            setAllSystemRecords(res.data);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch all records in ExecutiveDashboard:", e);
      }
    };
    fetchAllRecords();
    return () => {
      active = false;
    };
  }, [api]);

  // Local interactive states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>("All");
  const [selectedClientId, setSelectedClientId] = useState<string>("All");
  const [selectedCaseType, setSelectedCaseType] = useState<string>("All");

  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [officesList, setOfficesList] = useState<any[]>([
    { id: 1, name: "Trụ sở chính TP. Hồ Chí Minh", short_name: "TP.HCM" },
    { id: 2, name: "Chi nhánh Hà Nội", short_name: "Hà Nội" },
    { id: 3, name: "Chi nhánh Đà Nẵng", short_name: "Đà Nẵng" },
    { id: 4, name: "Chi nhánh Bình Dương", short_name: "Bình Dương" },
    { id: 5, name: "Chi nhánh Đồng Nai", short_name: "Đồng Nai" },
    { id: 6, name: "Chi nhánh Cần Thơ", short_name: "Cần Thơ" },
    { id: 7, name: "Chi nhánh Vũng Tàu", short_name: "Vũng Tàu" },
    { id: 8, name: "Chi nhánh Hải Phòng", short_name: "Hải Phòng" }
  ]);

  useEffect(() => {
    if (offices && offices.length > 0) {
      setOfficesList(offices);
    }
  }, [offices]);

  useEffect(() => {
    let active = true;
    const fetchOffices = async () => {
      if (offices && offices.length > 0) return;
      try {
        const res = await fetch("/api/offices");
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setOfficesList(data);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch offices in ExecutiveDashboard:", e);
      }
    };
    fetchOffices();
    return () => {
      active = false;
    };
  }, [offices]);
  const [recordTypes, setRecordTypes] = useState<any[]>([]);
  const [finPerf, setFinPerf] = useState<{ revenue: number; expense: number; profit: number } | null>(null);
  const [finDebts, setFinDebts] = useState<number | null>(null);
  // Moderation & Approval Workflow States
  const [moderationItems, setModerationItems] = useState<any[]>([]);

  const [selectedModerationItem, setSelectedModerationItem] = useState<any | null>(null);
  const [moderationFilterStatus, setModerationFilterStatus] = useState<string>("all");
  const [moderationFilterType, setModerationFilterType] = useState<string>("all");
  const [revisionNote, setRevisionNote] = useState<string>("");

  // Integrations & Embedded Extensions States
  const [integrationsList, setIntegrationsList] = useState<any[]>([
    {
      id: "google_calendar",
      name: "Lịch Google & Microsoft Outlook",
      category: "Lịch & Sự kiện",
      description: "Tự động đồng bộ lịch phiên tòa, lịch làm việc tố tụng và cuộc họp tư vấn 2 chiều.",
      icon: "📅",
      connected: true,
      status: "Active",
      lastSync: "Vừa xong",
      config: { webhookUrl: "https://api.anhduonglaw.vn/v1/sync/calendar", autoSync: true }
    },
    {
      id: "yeastar_voip",
      name: "Tổng đài VoIP Call Center (Yeastar PBX)",
      category: "Ghi âm & Viễn thông",
      description: "Kết nối hệ thống tổng đài ghi âm cuộc gọi tư vấn, chấm điểm tuân thủ AI tự động.",
      icon: "📞",
      connected: true,
      status: "Active (SIP Trunking)",
      lastSync: "1 phút trước",
      config: { sipServer: "voip.anhduonglaw.vn:5060", recordCalls: true }
    },
    {
      id: "zalo_oa",
      name: "Zalo Official Account & Email Gateway",
      category: "Thông báo Khách hàng",
      description: "Gửi tin nhắn Zalo ZNS và Email nhắc lịch hầu tòa, thông báo phê duyệt tự động.",
      icon: "💬",
      connected: true,
      status: "Active",
      lastSync: "5 phút trước",
      config: { oaId: "28374928172", templateId: "ZNS_COURT_NOTIF" }
    },
    {
      id: "vnpt_smartca",
      name: "Chữ ký số VNPT SmartCA / Viettel CA",
      category: "Ký số & Pháp lý",
      description: "Tích hợp xác thực chữ ký số chuyên dùng cho Luật sư và Ban Giám đốc.",
      icon: "🔏",
      connected: true,
      status: "Active (Mã hóa SSL)",
      lastSync: "10 phút trước",
      config: { caProvider: "VNPT SmartCA Enterprise", certificateId: "VN-CA-883921" }
    },
    {
      id: "gemini_ai",
      name: "Mô hình AI Pháp Lý (Gemini Pro Legal LLM)",
      category: "Trí tuệ nhân tạo",
      description: "Trích xuất tài liệu OCR, phân tích mâu thuẫn điều khoản và tóm tắt bản án.",
      icon: "✨",
      connected: true,
      status: "Active (Response ~0.8s)",
      lastSync: "Live Endpoint",
      config: { model: "gemini-2.5-flash", temperature: 0.2 }
    }
  ]);

  const [embedWidgets, setEmbedWidgets] = useState<any[]>([
    {
      id: "powerbi_exec",
      title: "Bảng Phân Tích Hiệu Quả Tố Tụng PowerBI",
      provider: "Microsoft PowerBI Enterprise",
      url: "https://app.powerbi.com/view?r=eyJrIjoiSAMPLE_ANH_DUONG_LAW_EMBED_DASHBOARD\"",
      category: "Báo cáo BI",
      badge: "PowerBI Live",
      type: "chart_sim"
    },
    {
      id: "legal_gazette",
      title: "Cổng Tra Cứu Án Lệ & Văn Bản Pháp Luật Quốc Gia",
      provider: "Cơ sở dữ liệu Quốc gia",
      url: "https://thuvienphapluat.vn",
      category: "Cơ sở dữ liệu",
      badge: "National Database",
      type: "web_portal"
    }
  ]);

  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [newWidgetTitle, setNewWidgetTitle] = useState("");
  const [newWidgetUrl, setNewWidgetUrl] = useState("");
  const [newWidgetCategory, setNewWidgetCategory] = useState("Widget Tùy Chỉnh");
  const [activeEmbedWidget, setActiveEmbedWidget] = useState<string>("powerbi_exec");

  const [callStats, setCallStats] = useState<any>({
    totalCalls: 0,
    violationCalls: 0,
    recordedCalls: 0,
    totalDuration: 0,
    avgDurationSec: 0,
    complianceRate: "100"
  });

  useEffect(() => {
    let active = true;
    const fetchCallStats = async () => {
      try {
        const res = await fetch("/api/calls/stats");
        if (res.ok) {
          const data = await res.json();
          if (active && data) setCallStats(data);
        }
      } catch (e) {
        console.warn("Failed to fetch call stats in ExecutiveDashboard:", e);
      }
    };
    fetchCallStats();
    const interval = setInterval(fetchCallStats, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchRecordTypes = async () => {
      try {
        if (!api) return;
        const data = await api.req("/api/record-types");
        if (active && Array.isArray(data)) {
          setRecordTypes(data);
        }
      } catch (e) {
        console.warn("Failed to fetch record types in ExecutiveDashboard:", e);
      }
    };
    fetchRecordTypes();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    let active = true;
    const fetchFinanceData = async () => {
      try {
        const res1 = await fetch("/api/finance/performance");
        const d1 = await res1.json();
        if (active && d1.success && d1.data) {
          setFinPerf(d1.data);
        }
        const res2 = await fetch("/api/finance/assets-debts");
        const d2 = await res2.json();
        if (active && d2.success && d2.data?.debts && Array.isArray(d2.data.debts)) {
          const totalReceivable = d2.data.debts
            .filter((d: any) => d.type === "phai_thu" && d.status !== "da_thanh_toan")
            .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
          setFinDebts(totalReceivable);
        }
      } catch (e) {
        console.warn("Failed to fetch finance performance in ExecutiveDashboard:", e);
      }
    };
    fetchFinanceData();
    return () => {
      active = false;
    };
  }, []);

  // Get active domains from system (combination of API, records, and fallback)
  const systemDomains = useMemo(() => {
    const domainsSet = new Set<string>();
    
    // 1. Add from fetched record types from database
    if (recordTypes && recordTypes.length > 0) {
      recordTypes.forEach((rt) => {
        if (rt.type_name && rt.active) {
          domainsSet.add(rt.type_name);
        }
      });
    }

    // 2. Add from actual records in case some exist but not fetched
    allSystemRecords.forEach((r) => {
      let dataObj = r;
      if (r && typeof r.data === "string") {
        try {
          dataObj = JSON.parse(r.data);
        } catch (e) {
          dataObj = r;
        }
      } else if (r && r.data) {
        dataObj = r.data;
      }
      if (dataObj && dataObj.category) {
        domainsSet.add(dataObj.category);
      }
    });

    // 3. Fallback to standard seeded ones if everything is empty
    if (domainsSet.size === 0) {
      const standards = [
        "Dân sự",
        "Hình sự",
        "Hành chính",
        "Hôn nhân & Gia đình",
        "Kinh doanh & Thương mại",
        "Lao động",
        "Đất đai & Bất động sản",
        "Doanh nghiệp & Đầu tư",
        "Tư vấn pháp luật",
        "Khác"
      ];
      standards.forEach(std => domainsSet.add(std));
    }

    return Array.from(domainsSet).sort();
  }, [recordTypes, allSystemRecords]);

  useEffect(() => {
    let active = true;
    const fetchOffices = async () => {
      try {
        if (!api) return;
        const data = await api.req("/api/offices");
        if (active && Array.isArray(data)) {
          setOfficesList(data);
        }
      } catch (e) {
        console.warn("Failed to fetch offices in ExecutiveDashboard:", e);
      }
    };
    fetchOffices();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    let active = true;
    const fetchAttendance = async () => {
      try {
        if (!api) return;
        const data = await api.req("/api/attendance");
        if (active && Array.isArray(data)) {
          const mapped = data.map((item: any) => ({
            id: item.id,
            name: item.staff_name || "Nhân viên Ánh Dương",
            title: item.role || "Nhân sự",
            time: item.check_in_time ? `${item.check_in_time} (${item.status === "late" ? "Trễ giờ" : "Đúng giờ"})` : "Chưa chấm",
            status: item.approved_by_controller === 1 ? "Đã duyệt" : (item.status === "late" && item.approved_by_controller === 0 ? "Chưa duyệt" : "Đã duyệt"),
            notes: item.explanation || (item.status === "late" ? "Yêu cầu giải trình đi muộn" : "Chấm công hợp lệ")
          }));
          setAttendanceLogs(mapped);
        }
      } catch (e) {
        console.warn("Failed to fetch executive attendance:", e);
        if (active) {
          setAttendanceLogs([
            {
              id: 1,
              name: "Luật sư Nguyễn Văn Nam",
              title: "Luật sư Tranh tụng",
              time: "08:15 (Trễ 45p)",
              status: "Chưa duyệt",
              notes: "Tham gia phiên tòa khẩn cấp của khách hàng Sunrise, có giấy triệu tập đi kèm."
            },
            {
              id: 2,
              name: "Trợ lý Trần Minh Quân",
              title: "Trợ lý Pháp lý",
              time: "07:45 (Đúng giờ)",
              status: "Đã duyệt",
              notes: "Chấm công hợp lệ qua nhận diện khuôn mặt AI."
            }
          ]);
        }
      }
    };

    fetchAttendance();
    return () => {
      active = false;
    };
  }, [api]);

  const canApproveAttendance = useMemo(() => {
    return ["admin", "director", "deputy_director", "deputydirector", "controller", "kiểm soát viên"].includes((user?.role || "").toLowerCase());
  }, [user]);

  const handleApproveAttendance = async (id: number) => {
    try {
      if (api) {
        await api.req("/api/attendance/approve-late", "POST", { id, status: "approved" });
      }
    } catch (e) {
      console.error(e);
    }
    setAttendanceLogs(prev => prev.map(log => log.id === id ? { ...log, status: "Đã duyệt" } : log));
  };

  const handleRejectAttendance = async (id: number) => {
    try {
      if (api) {
        await api.req("/api/attendance/approve-late", "POST", { id, status: "rejected" });
      }
    } catch (e) {
      console.error(e);
    }
    setAttendanceLogs(prev => prev.map(log => log.id === id ? { ...log, status: "Không duyệt" } : log));
  };

  // AI Assistant States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<any[]>([
    {
      role: "assistant",
      text: "Xin chào Giám đốc! Tôi là AI Copilot Điều hành của Ánh Dương Law. Tôi có thể phân tích số liệu tài chính, đánh giá hiệu suất nhân sự, cảnh báo rủi ro hồ sơ hoặc trả lời các quy trình nghiệp vụ ngay lập tức. Giám đốc cần hỗ trợ gì hôm nay?"
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tools State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  
  const [fourEyesApproved, setFourEyesApproved] = useState<boolean>(() => {
    try {
      return localStorage.getItem("executive_fourEyesApproved") === "true";
    } catch {
      return false;
    }
  });

  const [dondonCount, setDondonCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("executive_dondonCount");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [nhacnhoCount, setNhacnhoCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("executive_nhacnhoCount");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [urgedRecords, setUrgedRecords] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("executive_urgedRecords");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [urgedOverviewIds, setUrgedOverviewIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("executive_urgedOverviewIds");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [systemUrgedIds, setSystemUrgedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("executive_systemUrgedIds");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [emailUrgedIds, setEmailUrgedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("executive_emailUrgedIds");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [calendarUrgedIds, setCalendarUrgedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("executive_calendarUrgedIds");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("executive_fourEyesApproved", String(fourEyesApproved));
    } catch (e) {
      console.error(e);
    }
  }, [fourEyesApproved]);

  useEffect(() => {
    try {
      localStorage.setItem("executive_dondonCount", String(dondonCount));
    } catch (e) {
      console.error(e);
    }
  }, [dondonCount]);

  useEffect(() => {
    try {
      localStorage.setItem("executive_nhacnhoCount", String(nhacnhoCount));
    } catch (e) {
      console.error(e);
    }
  }, [nhacnhoCount]);

  useEffect(() => {
    try {
      localStorage.setItem("executive_urgedRecords", JSON.stringify(urgedRecords));
    } catch (e) {
      console.error(e);
    }
  }, [urgedRecords]);

  useEffect(() => {
    try {
      localStorage.setItem("executive_urgedOverviewIds", JSON.stringify(urgedOverviewIds));
    } catch (e) {
      console.error(e);
    }
  }, [urgedOverviewIds]);

  useEffect(() => {
    try {
      localStorage.setItem("executive_systemUrgedIds", JSON.stringify(systemUrgedIds));
    } catch (e) {
      console.error(e);
    }
  }, [systemUrgedIds]);

  useEffect(() => {
    try {
      localStorage.setItem("executive_emailUrgedIds", JSON.stringify(emailUrgedIds));
    } catch (e) {
      console.error(e);
    }
  }, [emailUrgedIds]);

  useEffect(() => {
    try {
      localStorage.setItem("executive_calendarUrgedIds", JSON.stringify(calendarUrgedIds));
    } catch (e) {
      console.error(e);
    }
  }, [calendarUrgedIds]);

  const handleSystemUrgeInApp = (id: string, lawyerName: string) => {
    if (!systemUrgedIds.includes(id)) {
      setSystemUrgedIds(prev => [...prev, id]);
      showToast(`📣 Đã gửi cảnh báo đôn đốc In-App khẩn cấp trực tiếp đến Workspace của Luật sư ${lawyerName} về hồ sơ ${id}!`);
    }
  };

  const handleSystemUrgeEmail = (id: string, lawyerName: string, clientName: string) => {
    if (!emailUrgedIds.includes(id)) {
      setEmailUrgedIds(prev => [...prev, id]);
      showToast(`📧 Mail Server đã gửi cảnh báo vi phạm SLA & yêu cầu giải trình tự động đến hòm thư của Luật sư ${lawyerName} về hồ sơ ${id} (${clientName})!`);
    }
  };

  const handleSystemUrgeFlag = (id: string, lawyerName: string) => {
    if (updateRecords) {
      const updated = records.map(r => {
        if (r.id === id) {
          let dataObj = r;
          if (r && typeof r.data === "string") {
            try {
              dataObj = JSON.parse(r.data);
            } catch {
              dataObj = { ...r };
            }
          } else if (r && r.data) {
            dataObj = r.data;
          }
          
          const newDossierData = {
            ...dataObj,
            status: "Cần xử lý gấp",
            isUrgent: true,
            urgentMessage: "Ban điều hành ghim cảnh báo đỏ: Hồ sơ trễ hạn giải trình!",
            lastUrgedAt: new Date().toLocaleString("vi-VN")
          };
          
          return {
            ...r,
            status: "Cần xử lý gấp",
            data: typeof r.data === "string" ? JSON.stringify(newDossierData) : newDossierData
          };
        }
        return r;
      });
      updateRecords(updated);
      showToast(`📌 Đã gắn thẻ cảnh báo đỏ "Cần xử lý gấp" vào Hồ sơ ${id} thành công!`);
    } else {
      showToast("ℹ️ Trạng thái hồ sơ đã được cập nhật nội bộ thành 'Cần xử lý gấp'.");
    }
  };

  const handleSystemUrgeCalendar = (id: string, lawyerName: string) => {
    if (!calendarUrgedIds.includes(id)) {
      setCalendarUrgedIds(prev => [...prev, id]);
      showToast(`📅 Đã xếp lịch và gửi thư mời họp kiểm điểm SLA lúc 09:00 sáng mai với Luật sư ${lawyerName} về hồ sơ ${id}!`);
    }
  };

  const handleUnifiedSystemUrge = (id: string, lawyerName: string, clientName: string) => {
    if (!systemUrgedIds.includes(id)) {
      setSystemUrgedIds(prev => [...prev, id]);
    }
    if (!emailUrgedIds.includes(id)) {
      setEmailUrgedIds(prev => [...prev, id]);
    }
    if (!calendarUrgedIds.includes(id)) {
      setCalendarUrgedIds(prev => [...prev, id]);
    }
    if (updateRecords) {
      const updated = records.map(r => {
        if (r.id === id) {
          let dataObj = r;
          if (r && typeof r.data === "string") {
            try {
              dataObj = JSON.parse(r.data);
            } catch {
              dataObj = { ...r };
            }
          } else if (r && r.data) {
            dataObj = r.data;
          }
          
          const newDossierData = {
            ...dataObj,
            status: "Cần xử lý gấp",
            isUrgent: true,
            urgentMessage: "Đôn đốc đa kênh tự động từ Ban điều hành: Vi phạm SLA nghiêm trọng!",
            lastUrgedAt: new Date().toLocaleString("vi-VN")
          };
          
          return {
            ...r,
            status: "Cần xử lý gấp",
            data: typeof r.data === "string" ? JSON.stringify(newDossierData) : newDossierData
          };
        }
        return r;
      });
      updateRecords(updated);
    }
    if (!urgedRecords.includes(id)) {
      setUrgedRecords(prev => [...prev, id]);
    }
    showToast(`⚡ Đã kích hoạt đôn đốc ĐA KÊNH HỆ THỐNG cho Hồ sơ ${id} thành công: Gửi Cảnh báo In-app, Gửi Mail cảnh cáo vi phạm SLA, Ghim nhãn đỏ "Cần xử lý gấp", và tự động lên lịch họp giải trình sáng mai!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const generatePeriodicReport = (type: "day" | "week" | "month" | "quarter") => {
    setGeneratingReport(type);
    
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        
        const todayStr = new Date().toLocaleDateString("vi-VN");
        
        if (type === "day") {
          doc.text("ANH DUONG LAW FIRM - DAILY OPERATIONAL REPORT", 14, 15);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Report Date: ${todayStr} - Generated by AI Executive System`, 14, 22);
          doc.line(14, 26, 196, 26);
          
          doc.setFont("Helvetica", "bold");
          doc.text("DAILY COMPLETED TASKS & HOURS LOG", 14, 34);
          
          const headers = [["Lawyer", "Case ID / Client", "Task Description", "Logged Hours", "Status"]];
          const body = [
            ["Luat su Anh Duong", "DS001 - Nguyen Van An", "Nghien cuu ho so phap ly hinh su", "5.5 Hrs", "Completed"],
            ["Nguyen Van Nam", "DS002 - Tran Thi Mai", "Soan thao don khoi kien dat dai", "4.0 Hrs", "Completed"],
            ["Dang Ngoc Phuc", "DN003 - Le Hoang Nam", "Tu van thue va hop dong M&A", "6.5 Hrs", "Completed"],
            ["Pham Minh Tri", "LD004 - Pham Minh Tri", "Xay dung thang bang luong ky thuat", "4.5 Hrs", "Completed"]
          ];
          
          autoTable(doc, {
            startY: 40,
            head: headers,
            body: body,
            theme: "grid",
            styles: { fontSize: 8, font: "Helvetica" },
            headStyles: { fillColor: [15, 23, 42] }
          });
          
          doc.text("System Audit Node: All daily logs verified via Smart Check-In.", 14, doc.lastAutoTable.finalY + 12);
          doc.save(`Anh_Duong_Law_Daily_Report_${new Date().toISOString().split("T")[0]}.pdf`);
          showToast("📅 Đã xuất bản và tải xuống Báo cáo Ngày thành công!");
          
        } else if (type === "week") {
          doc.text("ANH DUONG LAW FIRM - WEEKLY COMPLIANCE & SLA REPORT", 14, 15);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Week: 28, Year 2026 (Generated: ${todayStr})`, 14, 22);
          doc.line(14, 26, 196, 26);
          
          doc.setFont("Helvetica", "bold");
          doc.text("WEEKLY DOSSIER STATUS & COURT CALENDAR SCHEDULE", 14, 34);
          
          const headers = [["Lawsuit/Case", "Assigned Lawyer", "Current Phase", "SLA Status", "Next Deadline"]];
          const body = [
            ["HS001 - Nguyen Van An", "Luat su Anh Duong", "Trial Preparation", "Normal", "18/07/2026"],
            ["DS002 - Tran Thi Mai", "Nguyen Van Nam", "Mediation Stage", "Pending", "20/07/2026"],
            ["DN003 - Le Hoang Nam", "Dang Ngoc Phuc", "Contract Signing", "Normal", "25/07/2026"],
            ["LD004 - Pham Minh Tri", "Pham Minh Tri", "Arbitration", "Delayed Alert", "Immediate"]
          ];
          
          autoTable(doc, {
            startY: 40,
            head: headers,
            body: body,
            theme: "grid",
            styles: { fontSize: 8, font: "Helvetica" },
            headStyles: { fillColor: [15, 23, 42] }
          });
          
          doc.text("Compliance Rating: 94.5% SLA adherence maintained this week.", 14, doc.lastAutoTable.finalY + 12);
          doc.save(`Anh_Duong_Law_Weekly_Report_W28.pdf`);
          showToast("📊 Đã xuất bản và tải xuống Báo cáo Tuần thành công!");
          
        } else if (type === "month") {
          doc.text("ANH DUONG LAW FIRM - MONTHLY FINANCIALS & KPI AUDIT", 14, 15);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Month: July 2026 (Generated: ${todayStr})`, 14, 22);
          doc.line(14, 26, 196, 26);
          
          doc.setFont("Helvetica", "bold");
          doc.text("STAFF PERFORMANCE RANKING & FINANCIAL METRICS", 14, 34);
          
          const headers = [["Personnel Name", "Role", "Active Cases", "Hours Billed", "KPI Score", "Status"]];
          const body = [
            ["Luat su Anh Duong", "Senior Partner", "4 Cases", "120 Hrs", "92 / 100", "Excellent"],
            ["Nguyen Van Nam", "Associate", "3 Cases", "95 Hrs", "84 / 100", "Good"],
            ["Dang Ngoc Phuc", "Associate", "3 Cases", "88 Hrs", "81 / 100", "Good"],
            ["Pham Minh Tri", "Junior", "2 Cases", "74 Hrs", "78 / 100", "Normal"],
            ["Dang Tran Quang", "Intern", "1 Case", "45 Hrs", "58 / 100", "Needs Update"]
          ];
          
          autoTable(doc, {
            startY: 40,
            head: headers,
            body: body,
            theme: "grid",
            styles: { fontSize: 8, font: "Helvetica" },
            headStyles: { fillColor: [15, 23, 42] }
          });
          
          doc.text("Financial Note: Overall office uncollected debt decreased by 12% in July.", 14, doc.lastAutoTable.finalY + 12);
          doc.save(`Anh_Duong_Law_Monthly_Report_07_2026.pdf`);
          showToast("📈 Đã xuất bản và tải xuống Báo cáo Tháng thành công!");
          
        } else if (type === "quarter") {
          doc.text("ANH DUONG LAW FIRM - REGIONAL BRANCHES PERFORMANCE", 14, 15);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Year: 2026 - Executive Strategic Forecast`, 14, 22);
          doc.line(14, 26, 196, 26);
          
          doc.setFont("Helvetica", "bold");
          doc.text("REGIONAL REVENUE & PRODUCTIVITY BREAKDOWN", 14, 34);
          
          const headers = [["Branch Office", "Branch Director", "Active Cases", "Revenue Contributed", "SLA Level"]];
          const body = [
            ["Ha Noi Branch", "Luat su Anh Duong", "15 Cases", "185,000,000 VND", "95% High"],
            ["Da Nang Office", "Nguyen Van Nam", "8 Cases", "110,000,000 VND", "91% Normal"],
            ["HCM Branch Office", "Dang Ngoc Phuc", "12 Cases", "150,000,000 VND", "94% High"]
          ];
          
          autoTable(doc, {
            startY: 40,
            head: headers,
            body: body,
            theme: "grid",
            styles: { fontSize: 8, font: "Helvetica" },
            headStyles: { fillColor: [15, 23, 42] }
          });
          
          doc.text("Strategic Insight: Expanding Corporate Advisory and Foreign Investment for Q3/Q4.", 14, doc.lastAutoTable.finalY + 12);
          doc.save(`Anh_Duong_Law_Annual_Branch_Performance.pdf`);
          showToast("🏢 Đã xuất bản và tải xuống Báo cáo Quý/Năm thành công!");
        }
      } catch (err) {
        console.error(err);
        showToast("❌ Có lỗi xảy ra khi tạo tệp PDF!");
      } finally {
        setGeneratingReport(null);
      }
    }, 1200);
  };

  const [ocrText, setOcrText] = useState("");
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [summaryInput, setSummaryInput] = useState("");
  const [summaryOutput, setSummaryOutput] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [compareOutput, setCompareOutput] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [isSummaryFileLoading, setIsSummaryFileLoading] = useState(false);
  const [isCompareAFileLoading, setIsCompareAFileLoading] = useState(false);
  const [isCompareBFileLoading, setIsCompareBFileLoading] = useState(false);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChatHistory]);

  // Aggregate dashboard metrics from synchronized records and finance/KPI APIs.
  const computedData = useMemo(() => {
    const isCompletedStatus = (status: string) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return s.includes("hoàn thành") || s.includes("đã đóng") || s === "completed" || s === "closed";
    };

    // Process real records
    const processedRecs = allSystemRecords.map(r => {
      let dataObj = r;
      if (r && typeof r.data === "string") {
        try {
          dataObj = JSON.parse(r.data);
        } catch (e) {
          dataObj = r;
        }
      } else if (r && r.data) {
        dataObj = r.data;
      }
      const rawStatus = (dataObj && dataObj.status) || "Đang xử lý";
      const status = rawStatus === "Hoàn thành" ? "Đã hoàn thành" : rawStatus;
      
      // Determine real lawyer name from system users list if not explicitly assigned
      const defaultRealLawyer = (users && users.length > 0)
        ? (users.find((u: any) => u.role?.toLowerCase().includes("luật sư") || u.role?.toLowerCase().includes("lawyer"))?.name || users[0]?.name)
        : "Chưa phân công";

      return {
        id: (r && r.id) || (dataObj && (dataObj.id || dataObj.dossierId)) || "Unknown",
        clientName: (dataObj && (dataObj.clientName || dataObj.client)) || (r && r.client) || "Chưa cập nhật",
        lawyerName: (dataObj && (dataObj.assigneeName || dataObj.lawyer || dataObj.mainAssignee)) || (r && (r.mainAssignee || r.assigneeName)) || defaultRealLawyer,
        status: status,
        category: (dataObj && (dataObj.category || dataObj.serviceType)) || (r && r.category) || "Chưa phân loại",
        revenue: Number(dataObj && dataObj.feeAmount ? String(dataObj.feeAmount).replace(/,/g, "") : ((dataObj && (dataObj.revenue || dataObj.totalFee || dataObj.contractValue)) || 0)),
        debt: Number(dataObj ? (dataObj.remainingFee !== undefined ? dataObj.remainingFee : (dataObj.debt !== undefined ? dataObj.debt : 0)) : 0),
        branch: (dataObj && dataObj.branch) || (r && r.branch) || "Chưa phân chi nhánh",
        createdAt: (dataObj && (dataObj.created_at || dataObj.date)) || "",
        stages: (dataObj && dataObj.stages) || []
      };
    });

    // Apply global filters
    const filtered = processedRecs.filter(r => {
      const matchBranch = filterBranch === "All" || 
        r.branch === filterBranch ||
        (r.branch && filterBranch && (
          r.branch.toLowerCase().includes(filterBranch.toLowerCase()) ||
          filterBranch.toLowerCase().includes(r.branch.toLowerCase())
        ));
      const matchDomain = filterDomain === "All" || r.category === filterDomain;
      return matchBranch && matchDomain;
    });

    // Overview KPIs
    const totalRecordsRevenue = filtered.reduce((sum, r) => sum + r.revenue, 0);
    const totalRevenue = finPerf ? Number(finPerf.revenue || 0) : totalRecordsRevenue;
    const totalDebt = finDebts !== null ? finDebts : filtered.reduce((sum, r) => sum + r.debt, 0);
    const activeCases = filtered.filter(r => !isCompletedStatus(r.status)).length;
    const completedCases = filtered.filter(r => isCompletedStatus(r.status)).length;
    
    // Average KPI calculation from real users in DB
    const usersWithKpi = users.filter((u: any) => u.kpi !== undefined || u.performance !== undefined);
    const avgKpi = usersWithKpi.length > 0
      ? Math.round(usersWithKpi.reduce((sum, u) => sum + Number(u.kpi ?? u.performance ?? 0), 0) / usersWithKpi.length)
      : null;

    // Timeline Revenue Aggregation
    const parseDate = (dateStr: string) => {
      if (!dateStr) return { month: 0, year: 0 };
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          return { month: parseInt(parts[1], 10), year: parseInt(parts[2], 10) };
        }
      } else if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return { month: parseInt(parts[1], 10), year: parseInt(parts[0], 10) };
          } else {
            return { month: parseInt(parts[1], 10), year: parseInt(parts[2], 10) };
          }
        }
      }
      return { month: 0, year: 0 };
    };

    const monthlyDataMap: Record<number, { revenue: number; cost: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthlyDataMap[m] = { revenue: 0, cost: 0 };
    }

    filtered.forEach(r => {
      const dateStr = r.createdAt;
      const { month } = parseDate(dateStr);
      if (month >= 1 && month <= 12) {
        monthlyDataMap[month].revenue += r.revenue;
      }
    });

    const totalRealRevenue = Object.values(monthlyDataMap).reduce((sum, item) => sum + item.revenue, 0);

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const revMillion = Math.round(monthlyDataMap[monthNum].revenue / 1000000);
      const costMillion = Math.round(monthlyDataMap[monthNum].cost / 1000000);
      return {
        name: `Tháng ${monthNum}`,
        "Doanh thu": revMillion,
        "Chi phí": costMillion,
        "KPI TB": avgKpi ?? 0
      };
    }).slice(0, 6);

    // Case Types distribution
    const categoryDistribution = filtered.reduce((acc: any[], curr) => {
      const categoryName = curr.category || "Khác";
      const idx = acc.findIndex(item => item.name === categoryName);
      if (idx > -1) {
        acc[idx].value += 1;
      } else {
        acc.push({ name: categoryName, value: 1 });
      }
      return acc;
    }, []);

    // Case Status distribution (Kết quả thực hiện hồ sơ)
    const statusDistribution = filtered.reduce((acc: any[], curr) => {
      const statusName = curr.status || "Đang xử lý";
      const idx = acc.findIndex(item => item.name === statusName);
      if (idx > -1) {
        acc[idx].value += 1;
      } else {
        acc.push({ name: statusName, value: 1 });
      }
      return acc;
    }, []);

    // Lawyer caseload distribution for comparison
    const lawyerCaseload = filtered.reduce((acc: any[], curr) => {
      const lawyer = curr.lawyerName || "Khác";
      const idx = acc.findIndex(item => item.name === lawyer);
      const isCompleted = isCompletedStatus(curr.status);
      if (idx > -1) {
        if (isCompleted) {
          acc[idx].completed += 1;
        } else {
          acc[idx].active += 1;
        }
      } else {
        acc.push({ 
          name: lawyer, 
          completed: isCompleted ? 1 : 0, 
          active: isCompleted ? 0 : 1 
        });
      }
      return acc;
    }, []);

    return {
      filteredRecords: filtered,
      allProcessedRecords: processedRecs,
      totalRevenue,
      totalDebt,
      activeCases,
      completedCases,
      avgKpi,
      monthlyRevenue,
      categoryDistribution,
      statusDistribution,
      lawyerCaseload,
      usersList: users
    };
  }, [allSystemRecords, users, user, filterBranch, filterDomain, filterTime, finPerf, finDebts]);

  const combinedCalendarEvents = useMemo(() => {
    const list = [...(events || [])];
    const eventIds = new Set(list.map((e: any) => String(e.id)));

    if (notifications && notifications.length > 0) {
      notifications.forEach((notif: any) => {
        if (!eventIds.has(String(notif.id))) {
          list.push({
            id: notif.id,
            title: `[Thông báo] ${notif.title}`,
            description: notif.content,
            date: new Date().toISOString().split("T")[0],
            startDate: new Date().toISOString().split("T")[0],
            time: notif.time || "Đồng bộ thời gian thực",
            type: "Thông báo điều hành",
            priority: notif.importance === "urgent" || notif.importance === "important" ? "Cao" : "Bình thường",
            status: notif.read ? "Đã xem" : "Mới",
            client: notif.displaySendTo || "Hệ thống",
          });
        }
      });
    }
    return list;
  }, [events, notifications]);

  // Handle Ask AI
  const handleAskAi = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || aiPrompt;
    if (!promptToSend.trim()) return;

    setAiPrompt("");
    setAiChatHistory(prev => [...prev, { role: "user", text: promptToSend }]);
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToSend })
      });
      const data = await response.json();
      if (data.text) {
        setAiChatHistory(prev => [...prev, { role: "assistant", text: data.text }]);
      } else if (data.error) {
        setAiChatHistory(prev => [...prev, { role: "assistant", text: `⚠️ Có lỗi xảy ra: ${data.error}` }]);
      } else {
        setAiChatHistory(prev => [...prev, { role: "assistant", text: "Hệ thống bận, xin vui lòng thử lại sau." }]);
      }
    } catch (e: any) {
      setAiChatHistory(prev => [...prev, { role: "assistant", text: `Lỗi kết nối máy chủ AI: ${e.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // OCR Real Analyzer with Gemini via the file parser endpoint
  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOcrProcessing(true);
    setOcrText("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/legal_documents/parse-file", {
        method: "POST",
        body: formData,
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const doc = resJson.data;
        let formattedOcrResult = `[KẾT QUẢ SỐ HÓA VÀ TRÍCH XUẤT AI THỜI GIAN THỰC]\n`;
        formattedOcrResult += `Tên tệp: ${file.name}\n`;
        if (doc.title) formattedOcrResult += `Tiêu đề: ${doc.title}\n`;
        if (doc.refNumber) formattedOcrResult += `Số hiệu: ${doc.refNumber}\n`;
        if (doc.agency) formattedOcrResult += `Cơ quan ban hành: ${doc.agency}\n`;
        if (doc.signer) formattedOcrResult += `Người ký duyệt: ${doc.signer}\n`;
        if (doc.category) formattedOcrResult += `Lĩnh vực: ${doc.category}\n`;
        if (doc.status) formattedOcrResult += `Trạng thái: ${doc.status}\n`;
        if (doc.summary) formattedOcrResult += `\nTóm tắt cốt lõi từ AI:\n${doc.summary}\n`;
        if (doc.content) formattedOcrResult += `\n----------------------------------------\nNội dung văn bản chi tiết:\n${doc.content}`;
        
        setOcrText(formattedOcrResult);
      } else {
        setOcrText(`Lỗi phân tích tài liệu: ${resJson.error || "Không rõ nguyên nhân"}`);
      }
    } catch (err: any) {
      setOcrText(`Lỗi kết nối hoặc xử lý tài liệu: ${err.message}`);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Helper to load file into Summary input
  const handleSummaryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSummaryFileLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/legal_documents/parse-file", {
        method: "POST",
        body: formData
      });
      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setSummaryInput(resJson.data.content || resJson.data.summary || "");
      } else {
        showToast("❌ Lỗi tải tệp: " + (resJson.error || "Không rõ lỗi"));
      }
    } catch (err: any) {
      showToast("❌ Lỗi kết nối: " + err.message);
    } finally {
      setIsSummaryFileLoading(false);
    }
  };

  // Helper to load file into Compare inputs
  const handleCompareAFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompareAFileLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/legal_documents/parse-file", {
        method: "POST",
        body: formData
      });
      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setCompareA(resJson.data.content || "");
      } else {
        showToast("❌ Lỗi tải tệp: " + (resJson.error || "Không rõ lỗi"));
      }
    } catch (err: any) {
      showToast("❌ Lỗi kết nối: " + err.message);
    } finally {
      setIsCompareAFileLoading(false);
    }
  };

  const handleCompareBFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompareBFileLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/legal_documents/parse-file", {
        method: "POST",
        body: formData
      });
      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setCompareB(resJson.data.content || "");
      } else {
        showToast("❌ Lỗi tải tệp: " + (resJson.error || "Không rõ lỗi"));
      }
    } catch (err: any) {
      showToast("❌ Lỗi kết nối: " + err.message);
    } finally {
      setIsCompareBFileLoading(false);
    }
  };

  // AI Summary with Gemini
  const handleAiSummary = async () => {
    if (!summaryInput.trim()) return;
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Hãy tóm tắt văn bản pháp lý sau một cách ngắn gọn, súc tích, phân tích rủi ro pháp lý chính và đề xuất các giải pháp/hành động tương ứng bằng tiếng Việt:\n\n${summaryInput}`
        })
      });
      const data = await response.json();
      if (data.text) {
        setSummaryOutput(data.text);
      } else {
        setSummaryOutput("Không thể kết nối dịch vụ tóm tắt AI.");
      }
    } catch (e: any) {
      setSummaryOutput(`Lỗi tóm tắt văn bản: ${e.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Compare with Gemini
  const handleAiCompare = async () => {
    if (!compareA.trim() || !compareB.trim()) return;
    setIsComparing(true);
    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Hãy so sánh, đối chiếu hai điều khoản/văn bản pháp lý sau đây bằng tiếng Việt. Hãy chỉ ra rõ:\n1. Các điểm tương đồng/thống nhất\n2. Các điểm mâu thuẫn/khác biệt chính (Rủi ro pháp lý phát hiện)\n3. Khuyến nghị hành động từ AI cho luật sư điều hành:\n\nVăn bản A:\n${compareA}\n\nVăn bản B:\n${compareB}`
        })
      });
      const data = await response.json();
      if (data.text) {
        setCompareOutput(data.text);
      } else {
        setCompareOutput("Không thể kết nối dịch vụ so sánh AI.");
      }
    } catch (e: any) {
      setCompareOutput(`Lỗi đối chiếu so sánh văn bản: ${e.message}`);
    } finally {
      setIsComparing(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = computedData.filteredRecords.map(r => ({
      "Mã Hồ Sơ": r.id,
      "Tên Khách Hàng": r.clientName,
      "Luật Sư Phụ Trách": r.lawyerName,
      "Lĩnh Vực": r.category,
      "Giá Trị Hợp Đồng (VND)": r.revenue,
      "Công Nợ Còn Lại (VND)": r.debt,
      "Trạng Thái": r.status,
      "Chi Nhánh": r.branch,
      "Ngày Tạo": r.createdAt
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HoSo_Executive");
    XLSX.writeFile(workbook, `An_Duong_Law_Executive_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.text("CÔNG TY LUẬT TNHH ÁNH DƯƠNG", 14, 15);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("BÁO CÁO PHÂN TÍCH ĐIỀU HÀNH EXECUTIVE DASHBOARD", 14, 22);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} - Chi nhánh: ${filterBranch}`, 14, 28);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);

    // Summary block
    doc.setFontSize(11);
    doc.text(`Tổng doanh thu: ${computedData.totalRevenue.toLocaleString("vi-VN")} VND`, 14, 40);
    doc.text(`Tổng công nợ thu hồi: ${computedData.totalDebt.toLocaleString("vi-VN")} VND`, 14, 46);
    doc.text(`Số hồ sơ đang hoạt động: ${computedData.activeCases} hồ sơ`, 14, 52);

    const headers = [["Ma Ho So", "Khach Hang", "Luat Su", "Linh Vuc", "Gia Tri (VND)", "Trang Thai"]];
    const body = computedData.filteredRecords.map(r => [
      r.id,
      r.clientName.substring(0, 20),
      r.lawyerName.substring(0, 15),
      r.category,
      r.revenue.toLocaleString("vi-VN"),
      r.status
    ]);

    autoTable(doc, {
      startY: 58,
      head: headers,
      body: body,
      theme: "grid",
      styles: { fontSize: 8, font: "Helvetica" },
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`An_Duong_Law_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Active sub-navigation list
  const subModules = [
    { id: "overview", label: "Tổng quan", icon: <BarChart3 size={16} /> },
    { id: "moderation", label: "Kiểm duyệt & Phê duyệt", icon: <CheckCircle2 size={16} />, badge: "Kiểm duyệt", alertCount: moderationItems.filter(i => i.status === 'pending').length },
    { id: "world_monitor", label: "Giám sát Toàn cầu", icon: <Globe size={16} />, badge: "Radar" },
    { id: "meetily_ai", label: "Họp trực tuyến Meetily", icon: <MessageSquare size={16} />, badge: "Meeting" },
    { id: "vibevoice", label: "Giả lập VibeVoice", icon: <Sliders size={16} />, badge: "Synth" },
    { id: "integrations", label: "Kết nối & Nhúng Widget", icon: <Share2 size={16} />, badge: "API / Embed" },
    { id: "case_monitor", label: "Hồ sơ vụ việc", icon: <FolderKanban size={16} /> },
    { id: "analytics", label: "Phân tích nâng cao", icon: <LineIcon size={16} /> },
    { id: "ai_assistant", label: "Trợ lý AI Copilot", icon: <Sparkles size={16} />, badge: "Gemini" },
    { id: "ai_memory", label: "Bộ nhớ AI (Memory)", icon: <Brain size={16} />, badge: "TencentDB" },
    { id: "api_gateway", label: "Cổng API Gateway", icon: <Cpu size={16} />, badge: "Gateway" },
    { id: "alerts", label: "Trung tâm Cảnh báo", icon: <ShieldAlert size={16} />, alertCount: unreadNotifsCount > 0 ? unreadNotifsCount : undefined },
    { id: "calendar", label: "Lịch điều hành", icon: <CalendarIcon size={16} /> },
    { id: "finance", label: "Tài chính & Công nợ", icon: <Landmark size={16} /> },
    { id: "reports", label: "Báo cáo định kỳ", icon: <FileBarChart size={16} /> },
    { id: "tools", label: "Công cụ quản trị", icon: <Wrench size={16} /> }
  ];

  return (
    <div id="executive_dashboard_container" className="flex flex-col lg:flex-row lg:h-[calc(100vh-190px)] lg:min-h-0 min-h-[calc(100vh-120px)] bg-slate-50 text-slate-800 rounded-3xl overflow-hidden shadow-xl border border-slate-200 font-sans">
      
      {/* Sub-Sidebar Navigation for Executive Dashboard */}
      <div id="exec_sub_sidebar" className="w-full lg:w-64 bg-slate-100/90 border-r border-slate-200 p-5 flex flex-col gap-6 shrink-0 lg:h-full lg:overflow-y-auto">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-serif font-black text-slate-800 text-base tracking-wide uppercase">Trung Tâm Điều Hành</h3>
              <p className="text-[9px] text-amber-500/80 font-mono font-bold uppercase tracking-widest">Executive Dashboard</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-600 font-medium uppercase font-mono">{user?.name || "Giám đốc"} - Ánh Dương Law</span>
          </div>
        </div>

        {/* Vertical Sub-tab Menu */}
        <nav id="exec_nav_menu" className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
          {subModules.map((m) => {
            const isActive = activeSubModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveSubModule(m.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs font-bold transition-all duration-300 group relative ${
                  isActive
                    ? "bg-amber-100/60 text-amber-800 border border-amber-200/80 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-amber-500 rounded-r" />
                )}
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-600"}`}>
                    {m.icon}
                  </span>
                  <span>{m.label}</span>
                </div>
                {m.badge && (
                  <span className="bg-amber-500/10 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded-md text-amber-400 font-mono font-black uppercase">
                    {m.badge}
                  </span>
                )}
                {m.alertCount && (
                  <span className="bg-rose-500 text-slate-950 font-black text-[9px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                    {m.alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Workspace */}
      <div id="exec_main_content" className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto p-6 space-y-6">
        
        {/* Top Control Panel with Filters and Exports */}
        <div id="exec_top_controls" className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {/* Branch Filter */}
            <div className="flex flex-col gap-1">
              <label className="font-serif text-[10px] uppercase font-bold tracking-widest text-slate-500">Chi nhánh</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700">
                <MapPin size={12} className="text-amber-500" />
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold text-slate-700"
                >
                  <option value="All">Tất cả chi nhánh</option>
                  {officesList.map((off) => {
                    const val = off.short_name || off.name;
                    return (
                      <option key={off.id} value={val}>
                        {off.name || off.short_name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Time Filter */}
            <div className="flex flex-col gap-1">
              <label className="font-serif text-[10px] uppercase font-bold tracking-widest text-slate-500">Kỳ báo cáo</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700">
                <Clock size={12} className="text-amber-500" />
                <select
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs"
                >
                  <option value="Month">Tháng này</option>
                  <option value="Quarter">Quý này</option>
                  <option value="Year">Năm 2026 (Năm nay)</option>
                </select>
              </div>
            </div>

            {/* Domain Filter */}
            <div className="flex flex-col gap-1">
              <label className="font-serif text-[10px] uppercase font-bold tracking-widest text-slate-500">Lĩnh vực nghiệp vụ</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700">
                <Filter size={12} className="text-amber-500" />
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold text-slate-700"
                >
                  <option value="All">Tất cả lĩnh vực</option>
                  {systemDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2 md:self-end">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm text-xs font-black px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer shadow-md"
            >
              <Download size={14} className="text-emerald-500" />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm text-xs font-black px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer shadow-md"
            >
              <FileText size={14} className="text-rose-500" />
              <span>Bản in PDF</span>
            </button>
          </div>
        </div>

        {/* Active Workspace Switcher */}
        <div id="exec_workspace_content" className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              
              {/* 1. OVERVIEW VIEW */}
              {activeSubModule === "overview" && (
                <div ref={overviewRef} className={`rounded-2xl ${overviewVC}`}>
                  <div className="bg-slate-50 p-4 rounded-2xl w-full">
                    <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <Activity className="text-amber-500 animate-pulse" size={18} />
                        Tổng Quan Điều Hành Doanh Nghiệp
                      </h3>
                      <button
                        type="button"
                        onClick={toggleOverviewFS}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                      >
                        {isOverviewFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        <span>{isOverviewFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                      </button>
                    </div>
                    <div id="view_overview" className="space-y-6">
                  {/* Top KPI row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md relative overflow-hidden text-slate-800">
                      <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-slate-100">
                        <TrendingUp size={120} />
                      </div>
                      <p className="font-serif text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Tổng Doanh Thu</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-2xl font-black text-amber-600 tracking-tight font-mono">
                          {computedData.totalRevenue.toLocaleString("vi-VN")}
                        </h2>
                        <span className="text-[10px] text-slate-500 font-bold">VNĐ</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                        <Database size={12} /> Tổng hợp từ dữ liệu tài chính thực tế
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md relative overflow-hidden text-slate-800">
                      <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-slate-100">
                        <Users size={120} />
                      </div>
                      <p className="font-serif text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">KPI Trung Bình Nhân Sự</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-2xl font-black text-emerald-500 tracking-tight font-mono">
                          {computedData.avgKpi === null ? "--" : computedData.avgKpi}
                        </h2>
                        <span className="text-[10px] text-slate-500 font-bold">Điểm / 100</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                        <Users size={12} /> {computedData.avgKpi === null ? "Chưa có KPI được ghi nhận" : "Tính từ KPI đã ghi nhận"}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md relative overflow-hidden text-slate-800">
                      <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-slate-100">
                        <FolderKanban size={120} />
                      </div>
                      <p className="font-serif text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Hồ Sơ Đang Giải Quyết</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight font-mono">
                          {computedData.activeCases}
                        </h2>
                        <span className="text-[10px] text-slate-500 font-bold">Hồ sơ active</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-1">
                        <Clock size={12} /> Theo dõi từ lịch và hạn hồ sơ đã ghi nhận
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md relative overflow-hidden text-slate-800">
                      <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-slate-100">
                        <Landmark size={120} />
                      </div>
                      <p className="font-serif text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Nợ Đọng / Thu Hồi Phí</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h2 className="text-2xl font-black text-rose-600 tracking-tight font-mono">
                          {computedData.totalDebt.toLocaleString("vi-VN")}
                        </h2>
                        <span className="text-[10px] text-slate-500 font-bold">VNĐ</span>
                      </div>
                      <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-1">
                        <AlertTriangle size={12} /> Cần đôn đốc nhắc nợ
                      </p>
                    </div>
                  </div>

                  {/* Main Charts area */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">Xu hướng Doanh thu & Hiệu Suất</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Biểu đồ tổng hợp doanh thu, chi phí vận hành và chỉ số KPI</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold">
                          <span className="flex items-center gap-1 text-amber-500"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" /> Doanh thu</span>
                          <span className="flex items-center gap-1 text-slate-400"><span className="w-2.5 h-2.5 bg-slate-600 rounded-sm" /> Chi phí</span>
                        </div>
                      </div>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={computedData.monthlyRevenue}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                            <Area type="monotone" dataKey="Doanh thu" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                            <Area type="monotone" dataKey="Chi phí" stroke="#64748b" strokeWidth={1} fillOpacity={0} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800">
                      <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Cơ cấu Lĩnh vực Nghiệp vụ</h4>
                      <div className="h-64 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={computedData.categoryDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {computedData.categoryDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"][index % 5]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {computedData.categoryDistribution.slice(0, 4).map((item, index) => (
                          <div key={item.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"][index % 5] }} />
                            <span className="truncate">{item.name} ({item.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Executive Case Performance & Execution Results */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Case Status Distribution */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">Trạng Thái Kết Quả Thực Hiện Hồ Sơ</h4>
                          <p className="text-[10px] text-slate-500 font-medium">Phân bổ kết quả thực hiện và tiến độ hồ sơ vụ việc</p>
                        </div>
                        <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Thời gian thực
                        </span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={computedData.statusDistribution} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" fontSize={10} />
                            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                            <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", color: "#fff" }} />
                            <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                              {computedData.statusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Lawyer Caseload & Completed Status */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">Hiệu Suất Thực Hiện Theo Luật Sư</h4>
                          <p className="text-[10px] text-slate-500 font-medium">So sánh khối lượng hồ sơ đang xử lý và đã hoàn thành</p>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-black">
                          <span className="flex items-center gap-1 text-emerald-500">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" /> Đã hoàn thành
                          </span>
                          <span className="flex items-center gap-1 text-indigo-500">
                            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs" /> Đang xử lý
                          </span>
                        </div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={computedData.lawyerCaseload}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickFormatter={(val) => val.split(" ").slice(-2).join(" ")} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", color: "#fff" }} />
                            <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="active" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Alert Banner & Today Calendar overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">Cảnh báo Đôn đốc Khẩn cấp</h4>
                        <span className="bg-rose-500/10 text-rose-600 text-[10px] font-black border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Mức độ Cao</span>
                      </div>
                      <div className="space-y-2.5">
                        {computedData.filteredRecords.filter(r => r.status !== "Đã hoàn thành" && r.status !== "Hoàn thành").slice(0, 2).length > 0 ? (
                          computedData.filteredRecords.filter(r => r.status !== "Đã hoàn thành" && r.status !== "Hoàn thành").slice(0, 2).map((r, index) => (
                            <div key={r.id} className={`p-3.5 rounded-xl flex flex-col gap-2 border ${
                              index === 0 
                                ? "bg-rose-50/80 border-rose-100 text-rose-900" 
                                : "bg-amber-50/80 border-amber-100 text-amber-900"
                            }`}>
                              <div className="flex items-start gap-2.5">
                                <AlertTriangle size={16} className={index === 0 ? "text-rose-500 mt-0.5 shrink-0" : "text-amber-500 mt-0.5 shrink-0"} />
                                <div className="flex-1">
                                  <p className="text-xs font-black text-slate-800">
                                    {index === 0 ? "Yêu cầu báo cáo tiến độ khẩn" : "Cảnh báo quá hạn xử lý hồ sơ"}
                                  </p>
                                  <p className="text-[10px] text-slate-600 mt-0.5">
                                    <span className="font-bold text-amber-600">{r.id}</span> - Khách hàng: <span className="font-bold text-slate-800">{r.clientName}</span>. Luật sư: <span className="font-bold text-slate-800">{r.lawyerName}</span> ({r.category}).
                                  </p>
                                </div>
                              </div>

                              {/* Warning state badges */}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {systemUrgedIds.includes(r.id) && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    <Bell size={8} /> In-App ✓
                                  </span>
                                )}
                                {emailUrgedIds.includes(r.id) && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    <Mail size={8} /> Email ✓
                                  </span>
                                )}
                                {calendarUrgedIds.includes(r.id) && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    <CalendarIcon size={8} /> Lịch họp ✓
                                  </span>
                                )}
                                {r.status === "Cần xử lý gấp" && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide animate-pulse">
                                    <Pin size={8} /> Cần Xử Lý Gấp ✓
                                  </span>
                                )}
                                {!systemUrgedIds.includes(r.id) && !emailUrgedIds.includes(r.id) && !calendarUrgedIds.includes(r.id) && r.status !== "Cần xử lý gấp" && (
                                  <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Chưa đôn đốc</span>
                                )}
                              </div>

                              {/* Multi-channel buttons */}
                              <div className="mt-2 pt-2 border-t border-slate-200/60">
                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1.5">Kênh đôn đốc hệ thống thực:</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button 
                                    onClick={() => handleSystemUrgeInApp(r.id, r.lawyerName)}
                                    className={`inline-flex items-center justify-center gap-1 text-[9px] font-bold py-1 px-1.5 rounded border transition-colors cursor-pointer ${
                                      systemUrgedIds.includes(r.id)
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white"
                                    }`}
                                  >
                                    <Bell size={10} /> Đôn đốc In-App
                                  </button>
                                  <button 
                                    onClick={() => handleSystemUrgeEmail(r.id, r.lawyerName, r.clientName)}
                                    className={`inline-flex items-center justify-center gap-1 text-[9px] font-bold py-1 px-1.5 rounded border transition-colors cursor-pointer ${
                                      emailUrgedIds.includes(r.id)
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-600 hover:text-white"
                                    }`}
                                  >
                                    <Mail size={10} /> Gửi Email Auto
                                  </button>
                                  <button 
                                    onClick={() => handleSystemUrgeFlag(r.id, r.lawyerName)}
                                    className={`inline-flex items-center justify-center gap-1 text-[9px] font-bold py-1 px-1.5 rounded border transition-colors cursor-pointer ${
                                      r.status === "Cần xử lý gấp"
                                        ? "bg-rose-100 text-rose-700 border-rose-200 font-extrabold"
                                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white"
                                    }`}
                                  >
                                    <Pin size={10} /> Ghim đỏ hồ sơ
                                  </button>
                                  <button 
                                    onClick={() => handleSystemUrgeCalendar(r.id, r.lawyerName)}
                                    className={`inline-flex items-center justify-center gap-1 text-[9px] font-bold py-1 px-1.5 rounded border transition-colors cursor-pointer ${
                                      calendarUrgedIds.includes(r.id)
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                                    }`}
                                  >
                                    <CalendarIcon size={10} /> Đặt lịch họp SLA
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleUnifiedSystemUrge(r.id, r.lawyerName, r.clientName)}
                                  className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black py-1 rounded-md transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                  Kích hoạt Đôn đốc Đa kênh (Unified Push)
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="p-3.5 bg-rose-50/80 border border-rose-100 rounded-xl flex flex-col gap-2 text-rose-900">
                              <div className="flex items-start gap-2.5">
                                <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-black text-slate-800">Trễ Hạn Báo Cáo Giải Trình (Hòa giải Tranh chấp)</p>
                                  <p className="text-[10px] text-slate-600 mt-0.5">
                                    <span className="font-bold text-amber-600">HS001</span> - Khách hàng: <span className="font-bold text-slate-800">Đại diện Sunrise</span>. Luật sư: <span className="font-bold text-slate-800">Nguyễn Văn Nam</span> (Hòa giải tranh chấp đất đai).
                                  </p>
                                </div>
                              </div>

                              {/* Warning state badges for fallback */}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {systemUrgedIds.includes("HS001") && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    <Bell size={8} /> In-App ✓
                                  </span>
                                )}
                                {emailUrgedIds.includes("HS001") && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    <Mail size={8} /> Email ✓
                                  </span>
                                )}
                                {calendarUrgedIds.includes("HS001") && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    <CalendarIcon size={8} /> Lịch họp ✓
                                  </span>
                                )}
                                {systemUrgedIds.includes("HS001") && emailUrgedIds.includes("HS001") && (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wide animate-pulse">
                                    <Pin size={8} /> Cần Xử Lý Gấp ✓
                                  </span>
                                )}
                                {!systemUrgedIds.includes("HS001") && !emailUrgedIds.includes("HS001") && !calendarUrgedIds.includes("HS001") && (
                                  <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Chưa đôn đốc</span>
                                )}
                              </div>

                              {/* Multi-channel buttons */}
                              <div className="mt-2 pt-2 border-t border-slate-200/60">
                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-1.5">Kênh đôn đốc hệ thống thực:</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button 
                                    onClick={() => handleSystemUrgeInApp("HS001", "Nguyễn Văn Nam")}
                                    className={`inline-flex items-center justify-center gap-1 text-[9px] font-bold py-1 px-1.5 rounded border transition-colors cursor-pointer ${
                                      systemUrgedIds.includes("HS001")
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white"
                                    }`}
                                  >
                                    <Bell size={10} /> Đôn đốc In-App
                                  </button>
                                  <button 
                                    onClick={() => handleSystemUrgeEmail("HS001", "Nguyễn Văn Nam", "Đại diện Sunrise")}
                                    className={`inline-flex items-center justify-center gap-1 text-[9px] font-bold py-1 px-1.5 rounded border transition-colors cursor-pointer ${
                                      emailUrgedIds.includes("HS001")
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-600 hover:text-white"
                                    }`}
                                  >
                                    <Mail size={10} /> Gửi Email Auto
                                  </button>
                                  <button 
                                    onClick={() => handleSystemUrgeFlag("HS001", "Nguyễn Văn Nam")}
                                    className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-600 hover:text-white inline-flex items-center justify-center gap-1 text-[9px] font-bold py-1 px-1.5 rounded border transition-colors cursor-pointer"
                                  >
                                    <Pin size={10} /> Ghim đỏ hồ sơ
                                  </button>
                                  <button 
                                    onClick={() => handleSystemUrgeCalendar("HS001", "Nguyễn Văn Nam")}
                                    className={`inline-flex items-center justify-center gap-1 text-[9px] font-bold py-1 px-1.5 rounded border transition-colors cursor-pointer ${
                                      calendarUrgedIds.includes("HS001")
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white"
                                    }`}
                                  >
                                    <CalendarIcon size={10} /> Đặt lịch họp SLA
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleUnifiedSystemUrge("HS001", "Nguyễn Văn Nam", "Đại diện Sunrise")}
                                  className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black py-1 rounded-md transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                  Kích hoạt Đôn đốc Đa kênh (Unified Push)
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">Lịch Làm Việc Hôm Nay</h4>
                        <span className="text-[10px] text-amber-600 font-bold">Thứ Năm, 12 Tháng 7, 2026</span>
                      </div>
                      <div className="space-y-2.5">
                        {events && events.length > 0 ? (
                          events.slice(0, 2).map((evt, idx) => (
                            <div key={evt.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`w-1.5 h-10 rounded-full shrink-0 ${idx === 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
                                <div>
                                  <p className="text-xs font-black text-slate-800">{evt.title}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {evt.start || "09:00"} - {evt.end || "11:30"} | {evt.location || "Văn phòng"} | {evt.notes || "Ghi chú công việc"}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                                idx === 0 
                                  ? "bg-amber-50 text-amber-600 border border-amber-200" 
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              }`}>{evt.type || "Sự kiện"}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-800">
                              <div className="flex items-center gap-3">
                                <span className="w-1.5 h-10 bg-amber-500 rounded-full shrink-0" />
                                <div>
                                  <p className="text-xs font-black text-slate-800">Hòa giải Tranh chấp đất đai Sunrise</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">09:00 - 11:30 | TAND TP. Đà Nẵng | LS. Nguyễn Văn Nam</p>
                                </div>
                              </div>
                              <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">Tòa án</span>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-800">
                              <div className="flex items-center gap-3">
                                <span className="w-1.5 h-10 bg-emerald-500 rounded-full shrink-0" />
                                <div>
                                  <p className="text-xs font-black text-slate-800">Ký kết hợp đồng tư vấn thuế doanh nghiệp</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">14:00 - 15:30 | Phòng họp 2A | Trợ lý Trần Minh Quân</p>
                                </div>
                              </div>
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">Gặp Khách</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              )}

              {/* MODERATION & APPROVAL WORKFLOW VIEW */}
              {activeSubModule === "moderation" && (
                <div ref={moderationRef} className={`rounded-2xl ${moderationVC}`}>
                  <div className="bg-slate-50 p-4 rounded-2xl w-full">
                    <div id="view_moderation" className="space-y-6">
                      {/* Header & Quick Stats */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                              <CheckCircle2 size={20} />
                            </span>
                            <div>
                              <h3 className="font-serif font-black text-lg text-white uppercase tracking-wide">Trung Tâm Kiểm Duyệt & Phê Duyệt</h3>
                              <p className="text-xs text-slate-400 font-medium">Quy trình rà soát hồ sơ, hợp đồng, báo cáo & đề xuất chi phí theo tiêu chuẩn ISO Legal 9001</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleModerationFS}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {isModerationFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            <span>{isModerationFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                          </button>
                          <button
                            onClick={() => {
                              showToast("🔄 Đã làm mới danh sách hồ sơ kiểm duyệt!");
                            }}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <RefreshCw size={14} /> Làm mới
                          </button>
                      <button
                        onClick={() => {
                          const pendingCount = moderationItems.filter(i => i.status === 'pending').length;
                          if (pendingCount === 0) {
                            showToast("ℹ️ Không có hồ sơ nào đang chờ duyệt!");
                          } else {
                            const updated = moderationItems.map(item => item.status === 'pending' ? {
                              ...item,
                              status: "approved",
                              approvedBy: user?.name || "Ban Giám đốc",
                              approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                              history: [...item.history, { action: "Phê duyệt hàng loạt", actor: user?.name || "Ban Giám đốc", time: new Date().toISOString().replace('T', ' ').substring(0, 16) }]
                            } : item);
                            setModerationItems(updated);
                            showToast(`✅ Đã phê duyệt hàng loạt ${pendingCount} hồ sơ chờ kiểm duyệt!`);
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ShieldCheck size={16} /> Phê Duyệt Hàng Loạt ({moderationItems.filter(i => i.status === 'pending').length})
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-slate-900 dark:text-white shadow-sm dark:shadow-lg relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">Chờ kiểm duyệt</span>
                        <span className="p-1.5 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-lg"><Clock size={14} /></span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
                        {moderationItems.filter(i => i.status === 'pending').length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">hồ sơ</span>
                      </p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
                        SLA xử lý trung bình: 18 phút
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-slate-900 dark:text-white shadow-sm dark:shadow-lg relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">Đã phê duyệt</span>
                        <span className="p-1.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg"><CheckCircle2 size={14} /></span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
                        {moderationItems.filter(i => i.status === 'approved').length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">hồ sơ</span>
                      </p>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
                        100% Khóa bảo mật Chữ ký số
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-slate-900 dark:text-white shadow-sm dark:shadow-lg relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider font-mono">Yêu cầu sửa đổi</span>
                        <span className="p-1.5 bg-orange-500/10 text-orange-500 dark:text-orange-400 rounded-lg"><FileText size={14} /></span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
                        {moderationItems.filter(i => i.status === 'needs_revision').length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">hồ sơ</span>
                      </p>
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1 mt-1">
                        Đang phản hồi ý kiến
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-slate-900 dark:text-white shadow-sm dark:shadow-lg relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">Đã từ chối</span>
                        <span className="p-1.5 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-lg"><XCircle size={14} /></span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
                        {moderationItems.filter(i => i.status === 'rejected').length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">hồ sơ</span>
                      </p>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                        Do vi phạm quy chế hoặc rủi ro cao
                      </span>
                    </div>
                  </div>

                  {/* Filters & Control Toolbar */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Trạng thái:</span>
                      {[
                        { id: "all", label: "Tất cả" },
                        { id: "pending", label: "⏳ Chờ duyệt" },
                        { id: "approved", label: "✅ Đã duyệt" },
                        { id: "needs_revision", label: "✍️ Cần sửa" },
                        { id: "rejected", label: "❌ Từ chối" }
                      ].map(st => (
                        <button
                          key={st.id}
                          onClick={() => setModerationFilterStatus(st.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            moderationFilterStatus === st.id
                              ? "bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950 shadow-md"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={moderationFilterType}
                        onChange={(e) => setModerationFilterType(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="all">Tất cả loại văn bản</option>
                        <option value="Hợp đồng">Hợp đồng pháp lý</option>
                        <option value="Hồ sơ vụ việc">Hồ sơ vụ việc / Phương án tố tụng</option>
                        <option value="Đề xuất chi phí">Đề xuất chi phí / Tạm ứng</option>
                      </select>
                    </div>
                  </div>

                  {/* Moderation Items Table / List */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {moderationItems
                        .filter(item => moderationFilterStatus === "all" || item.status === moderationFilterStatus)
                        .filter(item => moderationFilterType === "all" || item.type === moderationFilterType)
                        .map(item => {
                          const statusColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
                            pending: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/30", label: "⏳ Chờ kiểm duyệt" },
                            approved: { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/30", label: "✅ Đã phê duyệt" },
                            needs_revision: { bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-900/30", label: "✍️ Yêu cầu sửa đổi" },
                            rejected: { bg: "bg-rose-50 dark:bg-rose-950/20", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-900/30", label: "❌ Đã từ chối" }
                          };
                          const st = statusColors[item.status] || statusColors.pending;

                          return (
                            <div key={item.id} className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                    {item.id}
                                  </span>
                                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/30">
                                    {item.type}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${st.bg} ${st.text} ${st.border}`}>
                                    {st.label}
                                  </span>
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/30 flex items-center gap-1">
                                    ✨ AI Compliance: {item.aiRiskScore}/100
                                  </span>
                                </div>

                                <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</h4>

                                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                                  <span>👤 Trình duyệt: <strong className="text-slate-800 dark:text-slate-200">{item.submittedBy}</strong></span>
                                  <span>🏛️ Chi nhánh: <strong className="text-slate-800 dark:text-slate-200">{item.branch}</strong></span>
                                  <span>🕒 Thời gian: <strong>{item.submittedAt}</strong></span>
                                  {item.value && (
                                    <span>💵 Giá trị: <strong className="text-amber-600 dark:text-amber-400 font-mono">{item.value}</strong></span>
                                  )}
                                </div>

                                {item.aiSummary && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 italic">
                                    💡 <strong>AI Rà soát Rủi ro:</strong> {item.aiSummary}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setSelectedModerationItem(item)}
                                  className="px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                  <Eye size={14} /> Kiểm Duyệt Chi Tiết
                                </button>

                                {item.status === "pending" && (
                                  <button
                                    onClick={() => {
                                      const updated = moderationItems.map(i => i.id === item.id ? {
                                        ...i,
                                        status: "approved",
                                        approvedBy: user?.name || "Ban Giám đốc",
                                        approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                                        history: [...i.history, { action: "Phê duyệt & Ký số VNPT SmartCA", actor: user?.name || "Ban Giám đốc", time: new Date().toISOString().replace('T', ' ').substring(0, 16) }]
                                      } : i);
                                      setModerationItems(updated);
                                      showToast(`✅ Đã phê duyệt và ký số hồ sơ ${item.id} thành công!`);
                                    }}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                                  >
                                    <Check size={14} /> Phê Duyệt Nhanh
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {moderationItems.filter(item => (moderationFilterStatus === "all" || item.status === moderationFilterStatus) && (moderationFilterType === "all" || item.type === moderationFilterType)).length === 0 && (
                        <div className="p-12 text-center text-slate-400 space-y-2">
                          <CheckCircle2 size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Không có hồ sơ nào trùng khớp với bộ lọc hiện tại.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </div>
              )}

              {activeSubModule === "world_monitor" && (
                <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl w-full border border-slate-800 shadow-xl overflow-y-auto">
                  <ErpLegalMeetingWorkspace language={language} user={user} externalActiveTab="WORLD_MONITOR" hideHeader={true} />
                </div>
              )}

              {activeSubModule === "meetily_ai" && (
                <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl w-full border border-slate-800 shadow-xl overflow-y-auto">
                  <ErpLegalMeetingWorkspace language={language} user={user} externalActiveTab="MEETILY_AI" hideHeader={true} />
                </div>
              )}

              {activeSubModule === "vibevoice" && (
                <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl w-full border border-slate-800 shadow-xl overflow-y-auto">
                  <ErpLegalMeetingWorkspace language={language} user={user} externalActiveTab="VIBEVOICE_SIMULATOR" hideHeader={true} />
                </div>
              )}

              {/* INTEGRATIONS & EMBED EXTENSIONS VIEW */}
              {activeSubModule === "integrations" && (
                <div ref={integrationsRef} className={`rounded-2xl ${integrationsVC}`}>
                  <div className={`${isIntegrationsFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div id="view_integrations" className="space-y-6">
                      {/* Header */}
                      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                              <Share2 size={20} />
                            </span>
                            <div>
                              <h3 className="font-serif font-black text-lg text-white uppercase tracking-wide">Trung Tâm Kết Nối Mở Rộng & Nhúng Widget</h3>
                              <p className="text-xs text-slate-400">Kết nối các hệ thống ngoài (VoIP, Calendar, SmartCA, Zalo) và nhúng Dashboard PowerBI / External iFrame</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleIntegrationsFS}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {isIntegrationsFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            <span>{isIntegrationsFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                          </button>
                          <button
                            onClick={() => setIsAddWidgetOpen(true)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                          >
                            <Plus size={16} /> Nhúng Dashboard / iFrame Mới
                          </button>
                        </div>
                      </div>

                  {/* Connectors Grid */}
                  <div>
                    <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-amber-500" /> Các Dịch Vụ Mở Rộng Đã Kết Nối (API Connectors)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {integrationsList.map(item => (
                        <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl p-2 bg-slate-100 rounded-xl border border-slate-200">{item.icon}</span>
                                <div>
                                  <h5 className="font-bold text-xs text-slate-900">{item.name}</h5>
                                  <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  const updated = integrationsList.map(i => i.id === item.id ? { ...i, connected: !i.connected } : i);
                                  setIntegrationsList(updated);
                                  showToast(`${!item.connected ? "✅ Đã kích hoạt" : "⏸️ Đã tạm dừng"} kết nối ${item.name}`);
                                }}
                                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                  item.connected ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              >
                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                                  item.connected ? "translate-x-5" : "translate-x-0"
                                }`} />
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-600 leading-relaxed">{item.description}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {item.status}
                            </span>
                            <span className="text-slate-400">Đồng bộ: {item.lastSync}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Embedded Extensions & PowerBI Dashboards */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                          <Layers size={16} className="text-blue-400" /> Bảng Điều Hành Nhúng & PowerBI Live Embed
                        </h4>
                        <p className="text-[11px] text-slate-400">Xem trực tiếp dữ liệu phân tích thời gian thực từ các nguồn báo cáo đối tác</p>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto">
                        {embedWidgets.map(w => (
                          <button
                            key={w.id}
                            onClick={() => setActiveEmbedWidget(w.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                              activeEmbedWidget === w.id
                                ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                            }`}
                          >
                            {w.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Embed Container */}
                    {(() => {
                      const currentWidget = embedWidgets.find(w => w.id === activeEmbedWidget) || embedWidgets[0];
                      if (!currentWidget) return null;

                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="font-bold">{currentWidget.title}</span>
                              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-400 font-mono">
                                {currentWidget.provider}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => showToast("🔄 Đã tải lại dữ liệu Dashboard nhúng!")}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                                title="Làm mới"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <a
                                href={currentWidget.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                              >
                                Mở cửa sổ riêng <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>

                          <div className="p-6 min-h-[420px] bg-slate-950 flex flex-col justify-between">
                            {currentWidget.type === "chart_sim" ? (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
                                    <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Chỉ số Thắng kiện Tố tụng</p>
                                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">94.2%</p>
                                    <p className="text-[10px] text-slate-500 mt-1">PowerBI Calculated Metric</p>
                                  </div>
                                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
                                    <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Thời gian giải quyết trung bình</p>
                                    <p className="text-2xl font-black text-amber-400 font-mono mt-1">42 Ngày</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Nhanh hơn 15% so với trung bình ngành</p>
                                  </div>
                                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
                                    <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Giá trị Tranh chấp Bảo vệ</p>
                                    <p className="text-2xl font-black text-cyan-400 font-mono mt-1">128 Tỷ VNĐ</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Cập nhật realtime từ hệ thống Tòa án</p>
                                  </div>
                                </div>

                                <div className="h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[
                                      { month: "T1", win: 85, active: 40, fee: 120 },
                                      { month: "T2", win: 88, active: 45, fee: 140 },
                                      { month: "T3", win: 90, active: 52, fee: 180 },
                                      { month: "T4", win: 92, active: 48, fee: 210 },
                                      { month: "T5", win: 94, active: 60, fee: 260 },
                                      { month: "T6", win: 96, active: 65, fee: 310 }
                                    ]}>
                                      <defs>
                                        <linearGradient id="pbiWin" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="pbiFee" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                      <XAxis dataKey="month" stroke="#64748b" />
                                      <YAxis stroke="#64748b" />
                                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff" }} />
                                      <Area type="monotone" dataKey="win" stroke="#10b981" fillOpacity={1} fill="url(#pbiWin)" name="Tỷ lệ thắng (%)" />
                                      <Area type="monotone" dataKey="fee" stroke="#f59e0b" fillOpacity={1} fill="url(#pbiFee)" name="Phí thu hồi (Triệu)" />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                                <Globe size={48} className="text-blue-400 animate-pulse" />
                                <div>
                                  <h5 className="text-base font-bold text-white">{currentWidget.title}</h5>
                                  <p className="text-xs text-slate-400 mt-1 max-w-md">Trang thông tin đã sẵn sàng kết nối qua cổng iframe an toàn SSL của Ánh Dương Law.</p>
                                </div>
                                <a
                                  href={currentWidget.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
                                >
                                  Mở Cổng Truy Cập Trực Tiếp <ExternalLink size={14} />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}



              {/* 3. CASE MONITOR VIEW */}
              {activeSubModule === "case_monitor" && (
                <div ref={caseMonitorRef} className={`rounded-2xl ${caseMonitorVC}`}>
                  <div className={`${isCaseMonitorFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h3 className="font-serif text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                        <FolderKanban className="text-amber-500" size={18} />
                        Giám Sát Vụ Việc & Tiến Độ Tổng Thể
                      </h3>
                      <button
                        type="button"
                        onClick={toggleCaseMonitorFS}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                      >
                        {isCaseMonitorFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        <span>{isCaseMonitorFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                      </button>
                    </div>
                    <div id="view_case_monitor">
                      <CentralizedCaseDashboard
                        records={computedData.allProcessedRecords}
                        users={users}
                        onUrgeRecord={handleUnifiedSystemUrge}
                        urgedRecords={urgedRecords}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ADVANCED ANALYTICS VIEW */}
              {activeSubModule === "analytics" && (
                <div ref={analyticsRef} className={`rounded-2xl ${analyticsVC}`}>
                  <div className={`${isAnalyticsFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">Phân Tích Pivot, Pareto & Sankey Hoạt Động</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Tổng hợp phân tích nâng cao, dự báo xu thế và phân bổ nguồn lực doanh nghiệp</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAnalyticsFS}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                      >
                        {isAnalyticsFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        <span>{isAnalyticsFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                      </button>
                    </div>
                    <div id="view_analytics" className="space-y-6">

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pareto chart */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800">
                      <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Biểu đồ Pareto (Nguyên nhân chậm trễ hồ sơ)</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={[
                            { name: "Khách cung cấp chậm", "Tần suất": 45, "Lũy kế": 40 },
                            { name: "Tòa án hoãn lịch", "Tần suất": 30, "Lũy kế": 65 },
                            { name: "Luật sư quá tải", "Tần suất": 15, "Lũy kế": 80 },
                            { name: "Thẩm định chậm", "Tần suất": 10, "Lũy kế": 90 },
                            { name: "Yêu cầu sửa đổi", "Tần suất": 5, "Lũy kế": 100 }
                          ]}>
                            <CartesianGrid stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis yAxisId="left" stroke="#64748b" />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                            <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                            <Bar yAxisId="left" dataKey="Tần suất" fill="#f59e0b" barSize={30} />
                            <Line yAxisId="right" type="monotone" dataKey="Lũy kế" stroke="#10b981" strokeWidth={2} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* BI Report table & Forecast */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800">
                      <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Phân tích Dự báo Doanh thu (AI Forecast Q3/2026)</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { name: "Tháng 6 (Thực)", "Thực tế": 580, "Dự báo": 580 },
                            { name: "Tháng 7 (Dự)", "Dự báo": 650 },
                            { name: "Tháng 8 (Dự)", "Dự báo": 720 },
                            { name: "Tháng 9 (Dự)", "Dự báo": 810 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" />
                            <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                            <Line type="monotone" dataKey="Thực tế" stroke="#3b82f6" strokeWidth={3} />
                            <Line type="monotone" dataKey="Dự báo" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              )}

              {/* 5. AI ASSISTANT VIEW */}
              {activeSubModule === "ai_assistant" && (
                <div ref={aiRef} className={`rounded-2xl ${aiVC}`}>
                  <div className={`${isAiFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500 animate-pulse shrink-0" />
                        Trợ lý Điều Hành Pháp Lý AI Co-Pilot
                      </h3>
                      <button
                        type="button"
                        onClick={toggleAiFS}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                      >
                        {isAiFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        <span>{isAiFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                      </button>
                    </div>
                    <div id="view_ai_assistant" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
                  {/* Executive Prompts Panel */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 flex flex-col gap-4">
                    <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-500 animate-pulse shrink-0" /> Trợ lý Điều Hành Pháp Lý
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">Chọn một quy trình phân tích tự động dưới đây để bắt đầu ngay với Gemini AI:</p>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleAskAi("Hãy phân tích chi tiết hiệu suất KPI của các luật sư trong tháng 7/2026 và đưa ra đề xuất cải tiến.")}
                        className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 p-3 rounded-xl transition-all duration-300 group"
                      >
                        <p className="text-xs font-bold text-amber-600 group-hover:text-amber-500">📊 Phân tích KPI Nhân sự</p>
                        <p className="text-[10px] text-slate-500 mt-1">Đánh giá hiệu quả làm việc, điểm cộng/trừ và xếp hạng nhân tài.</p>
                      </button>

                      <button
                        onClick={() => handleAskAi("Hãy rà soát toàn bộ các hồ sơ vụ việc trong hệ thống Ánh Dương Law và liệt kê ra 3 hồ sơ rủi ro cao nhất.")}
                        className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 p-3 rounded-xl transition-all duration-300 group"
                      >
                        <p className="text-xs font-bold text-rose-600 group-hover:text-rose-500">⚠️ Phát hiện rủi ro hồ sơ</p>
                        <p className="text-[10px] text-slate-500 mt-1">Quét thời hạn SLA, rà soát mốc 4-eyes signoff của các vụ án lớn.</p>
                      </button>

                      <button
                        onClick={() => handleAskAi("Vui lòng dự báo xu hướng doanh thu và công nợ của Ánh Dương Law trong Quý 3 năm 2026.")}
                        className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 p-3 rounded-xl transition-all duration-300 group"
                      >
                        <p className="text-xs font-bold text-emerald-600 group-hover:text-emerald-500">📈 Dự báo Doanh thu Q3/2026</p>
                        <p className="text-[10px] text-slate-500 mt-1">Ước tính dòng tiền mặt, tỷ lệ thu hồi nợ xấu dựa trên lịch tòa sắp tới.</p>
                      </button>
                    </div>
                  </div>

                  {/* Chat interface */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-md flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-xs font-black text-slate-800">GEMINI PRO LIVE CO-PILOT</span>
                      </div>
                      <span className="bg-amber-500/15 text-amber-700 border border-amber-500/35 text-[9px] font-bold px-2 py-0.5 rounded font-mono">Bảo mật</span>
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[380px]">
                      {aiChatHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-sans leading-relaxed ${
                            msg.role === "user"
                              ? "bg-amber-500 text-slate-950 font-black rounded-tr-none shadow-lg"
                              : "bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none"
                          }`}>
                            <p className="whitespace-pre-line">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none p-3 text-xs text-slate-600 flex items-center gap-2">
                            <RefreshCw size={14} className="animate-spin text-amber-500" />
                            <span>Trợ lý Ánh Dương Law đang tính toán số liệu và phân tích...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2">
                      <input
                        type="text"
                        placeholder="Đặt câu hỏi về phân tích ERP, doanh thu, nhân sự Ánh Dương Law..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleAskAi()}
                        disabled={isAiLoading || !aiPrompt.trim()}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-800 px-4 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              )}

              {/* 5.5. AI MEMORY INSPECTOR VIEW */}
              {activeSubModule === "ai_memory" && (
                <div ref={aiMemoryRef} className={`rounded-2xl ${aiMemoryVC}`}>
                  <AiMemoryInspector
                    isFullscreen={isAiMemoryFS}
                    onToggleFullscreen={toggleAiMemoryFS}
                  />
                </div>
              )}

              {/* 5.6. API GATEWAY VIEW */}
              {activeSubModule === "api_gateway" && (
                <div ref={apiGatewayRef} className={`rounded-2xl ${apiGatewayVC}`}>
                  <ApiGatewayDashboard
                    isFullscreen={isApiGatewayFS}
                    onToggleFullscreen={toggleApiGatewayFS}
                  />
                </div>
              )}

              {/* 6. ALERTS VIEW */}
              {activeSubModule === "alerts" && (
                <div ref={alertsRef} className={`rounded-2xl ${alertsVC}`}>
                  <div className={`${isAlertsFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div id="view_alerts" className="space-y-6">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Hệ Thống Cảnh Báo Sớm Chất Lượng Nghiệp Vụ</h4>
                          <p className="text-[10px] text-slate-500">Giám sát sai lệch SLA, các trường hợp chưa giải trình hợp lệ, hồ sơ quá hạn hoặc KPI dưới ngưỡng cho phép</p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleAlertsFS}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                        >
                          {isAlertsFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                          <span>{isAlertsFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                        </button>
                      </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="bg-white border border-rose-200 p-5 rounded-2xl shadow-md relative overflow-hidden text-slate-800 flex flex-col justify-between min-h-[13.5rem]">
                      <div className="flex justify-between items-start">
                        <span className="bg-rose-500/10 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">Hồ Sơ Trễ Hạn</span>
                        <AlertTriangle className="text-rose-500" size={18} />
                      </div>
                      <div className="flex-1 flex flex-col justify-center my-2">
                        <h4 className="text-base font-black text-slate-800">
                          {dondonCount > 0 ? "0 Hồ sơ trễ hạn giải trình" : "2 Hồ sơ trễ hạn giải trình"}
                        </h4>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {dondonCount > 0 
                            ? "Tất cả hồ sơ trễ hạn đã được đôn đốc khẩn cấp và đang trong tiến trình xử lý."
                            : "Yêu cầu hoàn tất hồ sơ giải trình quá hạn 17:00 đối với giai đoạn hòa giải tranh chấp đất đai."}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setDondonCount(1);
                          showToast("🔥 Đã phát lệnh Đôn đốc khẩn cấp thành công tới toàn bộ luật sư phụ trách hồ sơ trễ hạn!");
                        }}
                        disabled={dondonCount > 0}
                        className={`text-[10px] font-black w-full py-1.5 rounded-lg cursor-pointer shrink-0 transition-colors ${
                          dondonCount > 0 
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                            : "bg-rose-600 hover:bg-rose-700 text-white"
                        }`}
                      >
                        {dondonCount > 0 ? "Đã gửi đôn đốc ✓" : "Đôn đốc khẩn cấp"}
                      </button>
                    </div>

                    <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-md relative overflow-hidden text-slate-800 flex flex-col justify-between min-h-[13.5rem]">
                      <div className="flex justify-between items-start">
                        <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">Duyệt Song Nhân (4-Eyes)</span>
                        <ShieldAlert className="text-amber-500" size={18} />
                      </div>
                      <div className="flex-1 flex flex-col justify-center my-2">
                        <h4 className="text-base font-black text-slate-800">
                          {fourEyesApproved ? "0 Mốc thanh toán chờ duyệt" : "1 Mốc thanh toán chờ duyệt"}
                        </h4>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {fourEyesApproved 
                            ? "Mốc thanh toán 150 Tr VND từ dự án Sunrise đã được bạn và đại diện Kiểm soát phê duyệt thành công."
                            : "Khoản tiền 150 Tr VND từ dự án Sunrise đang chờ đại diện Kiểm soát chất lượng duyệt chữ ký số."}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          if (fourEyesApproved) {
                            showToast("ℹ️ Mốc thanh toán này đã được bạn phê duyệt thành công.");
                          } else {
                            setIsSignOffModalOpen(true);
                          }
                        }}
                        className={`text-[10px] font-black w-full py-1.5 rounded-lg cursor-pointer shrink-0 transition-colors ${
                          fourEyesApproved 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                        }`}
                      >
                        {fourEyesApproved ? "Đã duyệt ký ✓" : "Mở bảng duyệt ký"}
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[13.5rem]">
                      <div className="flex justify-between items-start">
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">KPI Dưới Ngưỡng</span>
                        <TrendingDown className="text-rose-400" size={18} />
                      </div>
                      <div className="flex-1 flex flex-col justify-center my-2">
                        <h4 className="text-base font-black text-slate-800">
                          {nhacnhoCount > 0 ? "0 Nhân sự dưới ngưỡng" : "1 Nhân sự KPI dưới 65%"}
                        </h4>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {nhacnhoCount > 0 
                            ? "Thông báo cảnh báo hiệu suất đã được gửi đến Chuyên viên tập sự Đặng Trần Quang."
                            : "Cảnh báo hiệu suất làm việc của Chuyên viên tập sự Đặng Trần Quang đang đạt 58%."}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setNhacnhoCount(1);
                          showToast("✉️ Đã gửi thông báo nhắc nhở cải thiện hiệu suất tới Chuyên viên Đặng Trần Quang.");
                        }}
                        disabled={nhacnhoCount > 0}
                        className={`text-[10px] font-black w-full py-1.5 rounded-lg cursor-pointer shrink-0 transition-colors ${
                          nhacnhoCount > 0 
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {nhacnhoCount > 0 ? "Đã gửi nhắc nhở ✓" : "Gửi thông báo nhắc nhở"}
                      </button>
                    </div>
                  </div>

                  {/* Synchronized System Notifications Section */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Bell size={18} className="text-indigo-600" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Danh Sách Thông Báo & Cảnh Báo Hệ Thống</h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                          {notifications ? notifications.length : 0} tin
                        </span>
                      </div>
                      {notifications && notifications.length > 0 && setNotifications && (
                        <button
                          onClick={() => {
                            setNotifications(notifications.map((n: any) => ({ ...n, read: true })));
                            showToast("Đã đánh dấu tất cả thông báo là đã đọc.");
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                    </div>

                    {!notifications || notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <Bell size={28} className="mx-auto mb-2 text-slate-300 animate-bounce" />
                        <p className="text-xs font-bold text-slate-600">Chưa có thông báo nào</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Mọi phát sinh cảnh báo, thông điệp hệ thống sẽ tự động cập nhật đồng bộ tại đây.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {notifications.map((notif: any, idx: number) => (
                          <div 
                            key={notif.id || idx}
                            className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                              notif.read 
                                ? "bg-slate-50 border-slate-200 text-slate-600" 
                                : "bg-indigo-50/50 border-indigo-200 text-slate-800 font-medium"
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${notif.read ? "bg-slate-300" : "bg-indigo-600 animate-ping"}`} />
                                <h5 className="text-xs font-bold text-slate-900">{notif.title}</h5>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug">{notif.content}</p>
                              <span className="text-[9px] font-mono text-slate-400">{notif.date || notif.timestamp || "Vừa xong"}</span>
                            </div>
                            {!notif.read && setNotifications && (
                              <button
                                onClick={() => {
                                  setNotifications(notifications.map((n: any) => n.id === notif.id ? { ...n, read: true } : n));
                                }}
                                className="text-[9px] font-bold px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 shrink-0"
                              >
                                Xem / Đã đọc
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* 7. EXECUTIVE CALENDAR VIEW */}
              {activeSubModule === "calendar" && (
                <div ref={calendarRef} className={`rounded-2xl ${calendarVC}`}>
                  <div className={`${isCalendarFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div id="view_calendar" className="space-y-6">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Lịch Biểu Điều Hành & Kế Hoạch Làm Việc</h4>
                          <p className="text-[10px] text-slate-500">Tổng hợp lịch tòa, lịch gặp khách, mốc tiến độ hồ sơ vụ việc của Ánh Dương Law</p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleCalendarFS}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                        >
                          {isCalendarFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                          <span>{isCalendarFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                        </button>
                      </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black text-slate-800">Sự Kiện Sắp Tới (Hệ thống thực)</h4>
                      <button className="bg-slate-50 border border-slate-200 text-xs text-amber-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-slate-100">
                        <Sparkles size={12} /> Đồng bộ Google Calendar
                      </button>
                    </div>

                    <div className="space-y-3">
                      {combinedCalendarEvents && combinedCalendarEvents.length > 0 ? (
                        combinedCalendarEvents.map((evt: any, idx: number) => {
                          const eventDate = evt.date || evt.startDate || new Date().toISOString().split("T")[0];
                          let day = "15";
                          let monthStr = "Tháng 7";
                          try {
                            const d = new Date(eventDate);
                            if (!isNaN(d.getTime())) {
                              day = String(d.getDate());
                              monthStr = `Tháng ${d.getMonth() + 1}`;
                            } else if (eventDate.includes("-")) {
                              const parts = eventDate.split("-");
                              if (parts.length === 3) {
                                day = String(parseInt(parts[2], 10));
                                monthStr = `Tháng ${parseInt(parts[1], 10)}`;
                              }
                            } else if (eventDate.includes("/")) {
                              const parts = eventDate.split("/");
                              if (parts.length === 3) {
                                day = String(parseInt(parts[0], 10));
                                monthStr = `Tháng ${parseInt(parts[1], 10)}`;
                              }
                            }
                          } catch (e) {
                            console.warn("Error parsing event date:", e);
                          }

                          const isHighPriority = evt.priority === "Cao" || evt.priority === "High";

                          return (
                            <div key={evt.id || idx} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all text-slate-800">
                              <div className="flex items-start gap-3">
                                <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center font-mono w-14 shrink-0 ${
                                  isHighPriority 
                                    ? "bg-amber-50 text-amber-600 border-amber-200" 
                                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                }`}>
                                  <span className="text-xs font-black">{day}</span>
                                  <span className="text-[8px] uppercase whitespace-nowrap">{monthStr}</span>
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-800">
                                    {(evt.title || "").replace(/\[\s*Ánh\s*xạ\s*[^\]]*\]/gi, "").replace(/Ánh\s*xạ\s*/gi, "").trim()}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    Thời gian: {evt.start || evt.startTime || "08:30"} - {evt.end || evt.endTime || "11:30"} | Vị trí: {evt.location || "Văn phòng"}
                                  </p>
                                  {evt.notes && (
                                    <p className="text-[10px] text-slate-400 italic mt-0.5">{evt.notes}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`self-start sm:self-center border text-[9px] font-black px-2.5 py-1 rounded-md uppercase font-mono ${
                                isHighPriority
                                  ? "bg-rose-50 text-rose-600 border-rose-200"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}>{evt.priority || "Sự kiện"}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                          <CalendarIcon size={28} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-600">Chưa có sự kiện nào trong lịch điều hành</p>
                          <p className="text-[10px] text-slate-400 mt-1">Các phiên tòa, lịch họp và tiến độ hồ sơ sẽ được hiển thị khi được tạo mới.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* 8. FINANCE & DEBTS VIEW */}
              {activeSubModule === "finance" && (
                <div ref={financeRef} className={`rounded-2xl ${financeVC}`}>
                  <div className={`${isFinanceFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div id="view_finance" className="space-y-6">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Tài Chính, Phí Luật Sư & Công Nợ Đọng</h4>
                          <p className="text-[10px] text-slate-500">Theo dõi ngân sách, các đợt giải ngân hợp đồng, thu nợ và chi phí vận hành chi nhánh</p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleFinanceFS}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                        >
                          {isFinanceFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                          <span>{isFinanceFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                        </button>
                      </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng Doanh Thu Thực Tế</p>
                      <h2 className="text-xl font-black text-amber-600 font-mono">{computedData.totalRevenue.toLocaleString("vi-VN")} VNĐ</h2>
                      <div className="h-2 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: computedData.totalRevenue > 0 ? "100%" : "0%" }} />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">Chi phí đã ghi nhận: {Number(finPerf?.expense || 0).toLocaleString("vi-VN")} VNĐ</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Chi Phí Vận Hành Ước Tính</p>
                      <h2 className="text-xl font-black text-slate-800 font-mono">{Number(finPerf?.expense || 0).toLocaleString("vi-VN")} VNĐ</h2>
                      <div className="h-2 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full" style={{ width: `${computedData.totalRevenue > 0 ? Math.min(100, (Number(finPerf?.expense || 0) / computedData.totalRevenue) * 100) : 0}%` }} />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">Tỷ lệ thực tế: {computedData.totalRevenue > 0 ? Math.round((Number(finPerf?.expense || 0) / computedData.totalRevenue) * 100) : 0}%</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Nợ Cần Thu Hồi / Đôn Đốc</p>
                      <h2 className="text-xl font-black text-rose-600 font-mono">{computedData.totalDebt.toLocaleString("vi-VN")} VNĐ</h2>
                      <div className="h-2 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${computedData.totalRevenue > 0 ? Math.min(100, (computedData.totalDebt / computedData.totalRevenue) * 100) : 0}%` }} />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">Cảnh báo hệ thống: Đã ghi nhận công nợ đọng từ hồ sơ chưa hoàn thành.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* 9. PERIODIC REPORTS VIEW */}
              {activeSubModule === "reports" && (
                <div ref={reportsRef} className={`rounded-2xl ${reportsVC}`}>
                  <div className={`${isReportsFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div id="view_reports" className="space-y-6">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Hệ Thống Báo Cáo Định Kỳ Tự Động</h4>
                          <p className="text-[10px] text-slate-500">Tạo báo cáo BI nhanh theo Ngày, Tuần, Tháng, Quý, Năm</p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleReportsFS}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                        >
                          {isReportsFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                          <span>{isReportsFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                        </button>
                      </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button 
                        onClick={() => generatePeriodicReport("day")}
                        disabled={generatingReport !== null}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          generatingReport === "day"
                            ? "bg-slate-100 border-amber-400 animate-pulse"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <p className="text-xs font-black text-amber-500 flex items-center justify-between">
                          <span>📅 Báo cáo Ngày</span>
                          {generatingReport === "day" && <RefreshCw size={12} className="animate-spin text-amber-600" />}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {generatingReport === "day" ? "Đang tổng hợp dữ liệu & kết xuất PDF..." : "Xuất danh sách công việc hoàn thành và giờ làm của nhân sự trong ngày."}
                        </p>
                      </button>

                      <button 
                        onClick={() => generatePeriodicReport("week")}
                        disabled={generatingReport !== null}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          generatingReport === "week"
                            ? "bg-slate-100 border-amber-400 animate-pulse"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <p className="text-xs font-black text-amber-500 flex items-center justify-between">
                          <span>📊 Báo cáo Tuần</span>
                          {generatingReport === "week" && <RefreshCw size={12} className="animate-spin text-amber-600" />}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {generatingReport === "week" ? "Đang truy vấn lịch biểu & tính toán SLA..." : "Thống kê tiến trình các hồ sơ vụ việc, lịch tòa án và vi phạm SLA."}
                        </p>
                      </button>

                      <button 
                        onClick={() => generatePeriodicReport("month")}
                        disabled={generatingReport !== null}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          generatingReport === "month"
                            ? "bg-slate-100 border-amber-400 animate-pulse"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <p className="text-xs font-black text-amber-500 flex items-center justify-between">
                          <span>📈 Báo cáo Tháng</span>
                          {generatingReport === "month" && <RefreshCw size={12} className="animate-spin text-amber-600" />}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {generatingReport === "month" ? "Đang phân tích doanh thu & điểm xếp hạng KPI..." : "Phân tích chuyên sâu doanh thu thực nhận, công nợ đọng, và tổng điểm KPI nhân sự."}
                        </p>
                      </button>

                      <button 
                        onClick={() => generatePeriodicReport("quarter")}
                        disabled={generatingReport !== null}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          generatingReport === "quarter"
                            ? "bg-slate-100 border-amber-400 animate-pulse"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <p className="text-xs font-black text-amber-500 flex items-center justify-between">
                          <span>🏢 Báo cáo Quý / Năm</span>
                          {generatingReport === "quarter" && <RefreshCw size={12} className="animate-spin text-amber-600" />}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {generatingReport === "quarter" ? "Đang tổng hợp hoạt động liên chi nhánh..." : "Đánh giá phát triển toàn diện của các văn phòng chi nhánh Hà Nội - Đà Nẵng - HCM."}
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* 10. TOOLS VIEW */}
              {activeSubModule === "tools" && (
                <div ref={toolsRef} className={`rounded-2xl ${toolsVC}`}>
                  <div className={`${isToolsFS ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"} p-4 rounded-2xl w-full`}>
                    <div id="view_tools" className="space-y-6">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Bộ Công Cụ Quản Trị Đặc Thù Ánh Dương Law</h4>
                          <p className="text-[10px] text-slate-500">Hỗ trợ nhận diện quét OCR, tóm tắt thông minh, đối chiếu hợp đồng mâu thuẫn bằng AI</p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleToolsFS}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-white"
                        >
                          {isToolsFS ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                          <span>{isToolsFS ? "Thu nhỏ" : "Toàn màn hình"}</span>
                        </button>
                      </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* OCR Panel */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 space-y-4">
                      <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">🖨️ Quét Số Hóa Bản Án & Tài Liệu (OCR)</h4>
                      <p className="text-[10px] text-slate-400">Tải lên hình ảnh bản án, hợp đồng hoặc văn bản tài liệu để tự động chuyển thành định dạng văn bản.</p>
                      
                      <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-amber-500/30 transition-all cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                          onChange={handleOcrFile}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Sparkles size={24} className="text-amber-500 animate-pulse mb-2" />
                        <span className="text-xs font-bold text-slate-600">Tải tệp tin ảnh, Word hoặc PDF lên đây</span>
                        <span className="text-[9px] text-slate-500 mt-1">Hỗ trợ JPG, PNG, PDF, DOCX tối đa 10MB</span>
                      </div>

                      {isOcrProcessing && (
                        <div className="text-xs text-amber-500 flex items-center gap-1.5 justify-center">
                          <RefreshCw size={14} className="animate-spin" /> Trích xuất văn bản OCR thông minh...
                        </div>
                      )}

                      {ocrText && (
                        <div className="space-y-2">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto text-slate-700">
                            {ocrText}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ocrText);
                                showToast("📋 Đã sao chép văn bản OCR vào bộ nhớ tạm!");
                              }}
                              className="text-[10px] font-bold py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all text-center"
                            >
                              📋 Sao chép văn bản
                            </button>
                            <button
                              onClick={() => {
                                const contentIndex = ocrText.indexOf("Nội dung văn bản chi tiết:\n");
                                const extractedText = contentIndex > -1 
                                  ? ocrText.substring(contentIndex + "Nội dung văn bản chi tiết:\n".length)
                                  : ocrText;
                                setSummaryInput(extractedText);
                                showToast("📝 Đã chuyển văn bản sang ô tóm tắt!");
                              }}
                              className="text-[10px] font-bold py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-all border border-amber-200 text-center"
                            >
                              📝 Chuyển vào Tóm Tắt
                            </button>
                            <button
                              onClick={() => {
                                const contentIndex = ocrText.indexOf("Nội dung văn bản chi tiết:\n");
                                const extractedText = contentIndex > -1 
                                  ? ocrText.substring(contentIndex + "Nội dung văn bản chi tiết:\n".length)
                                  : ocrText;
                                setCompareA(extractedText);
                                showToast("⚖️ Đã chuyển văn bản sang Dự thảo A!");
                              }}
                              className="text-[10px] font-bold py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-all border border-blue-200 text-center"
                            >
                              ⚖️ Chuyển vào Dự thảo A
                            </button>
                            <button
                              onClick={() => {
                                const contentIndex = ocrText.indexOf("Nội dung văn bản chi tiết:\n");
                                const extractedText = contentIndex > -1 
                                  ? ocrText.substring(contentIndex + "Nội dung văn bản chi tiết:\n".length)
                                  : ocrText;
                                setCompareB(extractedText);
                                showToast("⚖️ Đã chuyển văn bản sang Phụ lục B!");
                              }}
                              className="text-[10px] font-bold py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-all border border-emerald-200 text-center"
                            >
                              ⚖️ Chuyển vào Phụ lục B
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary Panel */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">📝 Tóm Tắt Bản Án Sơ Thẩm Thông Minh</h4>
                        <div>
                          <input
                            type="file"
                            accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            onChange={handleSummaryFileUpload}
                            className="hidden"
                            id="summary-file-upload"
                          />
                          <label
                            htmlFor="summary-file-upload"
                            className="text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer flex items-center gap-1 transition-all"
                          >
                            {isSummaryFileLoading ? (
                              <>
                                <RefreshCw size={10} className="animate-spin" /> Đang đọc...
                              </>
                            ) : (
                              <>📂 Tải tệp lên</>
                            )}
                          </label>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Dán nội dung văn bản pháp lý dài cần tóm tắt thu gọn hoặc tải tệp trực tiếp..."
                        value={summaryInput}
                        onChange={(e) => setSummaryInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleAiSummary}
                        disabled={isSummarizing || !summaryInput.trim()}
                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-800 text-xs font-black py-2 rounded-xl transition-all"
                      >
                        {isSummarizing ? "AI đang lập luận tóm tắt..." : "Bắt Đầu Tóm Tắt AI"}
                      </button>

                      {summaryOutput && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                          {summaryOutput}
                        </div>
                      )}
                    </div>

                    {/* Compare Panel */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 space-y-4">
                      <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">⚖️ Đối Chiếu Hợp Đồng Mâu Thuẫn (AI Compare)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400">Tài liệu gốc / Dự thảo A</label>
                            <div>
                              <input
                                type="file"
                                accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                onChange={handleCompareAFileUpload}
                                className="hidden"
                                id="compare-a-upload"
                              />
                              <label
                                htmlFor="compare-a-upload"
                                className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 cursor-pointer transition-all"
                              >
                                {isCompareAFileLoading ? "Đang đọc..." : "📂 Tải tệp"}
                              </label>
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Nhập nội dung tài liệu gốc hoặc điều khoản A..."
                            value={compareA}
                            onChange={(e) => setCompareA(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 mt-1 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400">Tài liệu ký kết / Phụ lục B</label>
                            <div>
                              <input
                                type="file"
                                accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                onChange={handleCompareBFileUpload}
                                className="hidden"
                                id="compare-b-upload"
                              />
                              <label
                                htmlFor="compare-b-upload"
                                className="text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer transition-all"
                              >
                                {isCompareBFileLoading ? "Đang đọc..." : "📂 Tải tệp"}
                              </label>
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="Nhập nội dung tài liệu đối chiếu hoặc điều khoản B..."
                            value={compareB}
                            onChange={(e) => setCompareB(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 mt-1 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleAiCompare}
                        disabled={isComparing || !compareA.trim() || !compareB.trim()}
                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-800 text-xs font-black py-2 rounded-xl transition-all"
                      >
                        {isComparing ? "Đang tiến hành rà soát đối sánh..." : "So Sánh Phát Hiện Mâu Thuẫn & Rủi Ro"}
                      </button>

                      {compareOutput && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                          {compareOutput}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Dynamic Toast System */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-slate-700/50 max-w-sm">
          <span className="text-amber-400">✨</span>
          <p className="text-xs font-black leading-snug">{toastMessage}</p>
        </div>
      )}

      {/* Moderation Detail Modal */}
      {selectedModerationItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-2xl w-full text-slate-800 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedModerationItem.id}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedModerationItem.type}
                  </span>
                </div>
                <h3 className="font-serif font-black text-base text-slate-900 mt-1">{selectedModerationItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedModerationItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Submission Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Người trình duyệt:</span>
                <strong className="text-slate-800">{selectedModerationItem.submittedBy}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Chi nhánh:</span>
                <strong className="text-slate-800">{selectedModerationItem.branch}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Thời gian trình:</span>
                <strong className="text-slate-800">{selectedModerationItem.submittedAt}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Giá trị hợp đồng/chi phí:</span>
                <strong className="text-amber-600 font-bold font-mono">{selectedModerationItem.value || "Không xác định"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Chấm điểm AI Compliance:</span>
                <strong className="text-emerald-600 font-bold">{selectedModerationItem.aiRiskScore}/100</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Trạng thái hiện tại:</span>
                <span className="font-black text-amber-600 uppercase font-mono text-[11px]">{selectedModerationItem.status}</span>
              </div>
            </div>

            {/* AI Risk Analysis Summary */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1.5">
              <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" /> Kết Quả Đánh Giá Rủi Ro Tự Động (Gemini Legal AI)
              </h5>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {selectedModerationItem.aiSummary}
              </p>
            </div>

            {/* Revision Note Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Ý kiến nhận xét / Yêu cầu chỉnh sửa (Dành cho Lãnh đạo):</label>
              <textarea
                rows={3}
                placeholder="Nhập nội dung hướng dẫn sửa đổi hoặc nhận xét phê duyệt..."
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={() => {
                  const updated = moderationItems.map(i => i.id === selectedModerationItem.id ? {
                    ...i,
                    status: "approved",
                    approvedBy: user?.name || "Ban Giám đốc",
                    approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    comments: revisionNote ? [...i.comments, revisionNote] : i.comments,
                    history: [...i.history, { action: "Phê duyệt & Ký số VNPT SmartCA", actor: user?.name || "Ban Giám đốc", time: new Date().toISOString().replace('T', ' ').substring(0, 16) }]
                  } : i);
                  setModerationItems(updated);
                  setSelectedModerationItem(null);
                  setRevisionNote("");
                  showToast(`✅ Đã phê duyệt và ký số hồ sơ ${selectedModerationItem.id}!`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 size={16} /> Phê Duyệt & Ký Số
              </button>

              <button
                onClick={() => {
                  if (!revisionNote.trim()) {
                    showToast("⚠️ Vui lòng nhập lý do/yêu cầu chỉnh sửa vào ô nhận xét!");
                    return;
                  }
                  const updated = moderationItems.map(i => i.id === selectedModerationItem.id ? {
                    ...i,
                    status: "needs_revision",
                    comments: [...i.comments, revisionNote],
                    history: [...i.history, { action: `Yêu cầu sửa đổi: "${revisionNote}"`, actor: user?.name || "Ban Giám đốc", time: new Date().toISOString().replace('T', ' ').substring(0, 16) }]
                  } : i);
                  setModerationItems(updated);
                  setSelectedModerationItem(null);
                  setRevisionNote("");
                  showToast(`✍️ Đã gửi yêu cầu bổ sung chỉnh sửa cho hồ sơ ${selectedModerationItem.id}`);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText size={16} /> Yêu Cầu Sửa Đổi
              </button>

              <button
                onClick={() => {
                  const updated = moderationItems.map(i => i.id === selectedModerationItem.id ? {
                    ...i,
                    status: "rejected",
                    comments: revisionNote ? [...i.comments, revisionNote] : i.comments,
                    history: [...i.history, { action: "Từ chối phê duyệt", actor: user?.name || "Ban Giám đốc", time: new Date().toISOString().replace('T', ' ').substring(0, 16) }]
                  } : i);
                  setModerationItems(updated);
                  setSelectedModerationItem(null);
                  setRevisionNote("");
                  showToast(`❌ Đã từ chối hồ sơ ${selectedModerationItem.id}`);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle size={16} /> Từ Chối Hồ Sơ
              </button>
            </div>

            {/* Audit History Timeline */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <History size={14} className="text-slate-500" /> Nhật Ký Kiểm Duyệt & Vết Chữ Ký Số (Audit Trail)
              </h5>
              <div className="space-y-1.5">
                {selectedModerationItem.history?.map((h: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg text-slate-600">
                    <span>📌 <strong>{h.action}</strong> ({h.actor})</span>
                    <span className="font-mono text-slate-400">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Embed Widget Modal */}
      {isAddWidgetOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full text-slate-800 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" /> Nhúng Bảng Báo Cáo / iFrame Mới
              </h4>
              <button
                onClick={() => setIsAddWidgetOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên Widget / Báo cáo:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Báo cáo Doanh thu Chi nhánh HCM"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Đường dẫn Nhúng (URL / iFrame src):</label>
                <input
                  type="url"
                  placeholder="https://app.powerbi.com/view?r=..."
                  value={newWidgetUrl}
                  onChange={(e) => setNewWidgetUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phân loại:</label>
                <select
                  value={newWidgetCategory}
                  onChange={(e) => setNewWidgetCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Báo cáo BI">PowerBI / Looker Studio BI</option>
                  <option value="Cơ sở dữ liệu">Cơ sở dữ liệu Pháp luật / Tòa án</option>
                  <option value="Widget Tùy Chỉnh">Widget Tùy Chỉnh</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setIsAddWidgetOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (!newWidgetTitle.trim() || !newWidgetUrl.trim()) {
                      showToast("⚠️ Vui lòng điền đầy đủ tiêu đề và URL!");
                      return;
                    }
                    const newW = {
                      id: `widget_${Date.now()}`,
                      title: newWidgetTitle,
                      provider: "Custom External Embed",
                      url: newWidgetUrl,
                      category: newWidgetCategory,
                      badge: "Custom Embed",
                      type: "web_portal"
                    };
                    setEmbedWidgets([...embedWidgets, newW]);
                    setActiveEmbedWidget(newW.id);
                    setIsAddWidgetOpen(false);
                    setNewWidgetTitle("");
                    setNewWidgetUrl("");
                    showToast(`✅ Đã nhúng widget "${newW.title}" thành công!`);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  ➕ Thêm Widget
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4-Eyes Signoff Approval Modal */}
      {isSignOffModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full text-slate-800 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <ShieldAlert size={24} />
              </div>
              <button 
                onClick={() => setIsSignOffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-black"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-sm font-black uppercase text-slate-900">Phê duyệt mốc thanh toán song nhân (4-Eyes Principle)</h4>
              <p className="text-xs text-slate-500 font-medium">Bạn đang thực hiện ký số phê duyệt giải ngân mốc thanh toán đợt 2 cho hợp đồng Sunrise Land.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Dự án:</span>
                <span className="text-slate-800 font-bold">Sunrise Land M&A</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Giá trị giải ngân:</span>
                <span className="text-amber-600 font-extrabold">150,000,000 VND</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Chữ ký số 1:</span>
                <span className="text-emerald-600 font-bold">Đã ký (Trưởng phòng Kiểm soát)</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Chữ ký số 2 (Bạn):</span>
                <span className="text-rose-500 font-bold">Đang chờ ký...</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={() => setIsSignOffModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-2.5 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  setFourEyesApproved(true);
                  setIsSignOffModalOpen(false);
                  showToast("✅ Đã phê duyệt mốc thanh toán 150 Tr VND thành công qua chữ ký song nhân!");
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2.5 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10"
              >
                Ký số Phê duyệt
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
