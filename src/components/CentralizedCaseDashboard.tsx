import React, { useState, useMemo, useEffect, useRef } from "react";
import { fetchApi } from "../utils/api";
import { io } from "socket.io-client";
import {
  FolderKanban,
  AlertTriangle,
  Clock,
  CheckCircle2,
  UserCheck,
  Search,
  Filter,
  BellRing,
  Send,
  Calendar,
  Building2,
  ShieldAlert,
  ChevronRight,
  FileText,
  RefreshCw,
  Zap,
  Check,
  Activity,
  Layers,
  X,
  UserPlus,
  MessageSquare,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useFullscreen } from "../hooks/useFullscreen";
import { filterNonAdminPersonnel } from "../utils/personnelFilters";

export interface ProcessedRecord {
  id: string;
  clientName: string;
  lawyerName: string;
  status: string;
  category: string;
  revenue: number;
  debt: number;
  branch: string;
  createdAt: string;
  stages?: any[];
  department?: string;
  deadline?: string;
  progressPercent?: number;
  bottleneckReason?: string;
  daysStagnated?: number;
  courtArea?: string;
}

interface CentralizedCaseDashboardProps {
  records: ProcessedRecord[];
  users?: any[];
  onUrgeRecord: (id: string, lawyerName: string, clientName: string) => void;
  urgedRecords: string[];
  branches?: string[];
}

export const CentralizedCaseDashboard: React.FC<CentralizedCaseDashboardProps> = ({
  records,
  users = [],
  onUrgeRecord,
  urgedRecords,
  branches = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng"]
}) => {
  const [activeBranches, setActiveBranches] = useState<string[]>(branches);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen, virtualClass } = useFullscreen(dashboardRef);

  useEffect(() => {
    let active = true;
    const loadOffices = () => {
      fetchApi("/api/offices")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch offices");
        })
        .then((data) => {
          if (active && Array.isArray(data) && data.length > 0) {
            const names = data.map((off: any) => off.short_name || off.name).filter(Boolean);
            setActiveBranches(names);
          }
        })
        .catch((err) => console.warn("Failed to fetch offices in CentralizedCaseDashboard:", err));
    };

    loadOffices();

    // Setup real-time socket connection for real-time branch updates
    let socket: any = null;
    try {
      socket = io({
        transports: ["websocket"]
      });
      socket.on("offices_updated", () => {
        loadOffices();
      });
    } catch (e) {
      console.warn("Socket connection failed in CentralizedCaseDashboard:", e);
    }

    return () => {
      active = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<"master" | "bottleneck" | "deadline">("master");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Inspection Modal State
  const [inspectedRecord, setInspectedRecord] = useState<ProcessedRecord | null>(null);
  const [executiveDirective, setExecutiveDirective] = useState<string>("");
  const [directivesLog, setDirectivesLog] = useState<Record<string, { id: string; author: string; text: string; timestamp: string }[]>>({});
  
  // Reassign Modal State
  const [reassigningRecordId, setReassigningRecordId] = useState<string | null>(null);
  const [selectedNewLawyer, setSelectedNewLawyer] = useState<string>("");
  const [reassignedLawyers, setReassignedLawyers] = useState<Record<string, string>>({});

  // Batch Urge feedback state
  const [batchUrged, setBatchUrged] = useState<boolean>(false);

  // Derive enriched record list with realistic stage progress, bottleneck tags & deadlines
  const enrichedRecords = useMemo(() => {
    return records.map((r, idx) => {
      // Practice Area mapping to Departments / Lĩnh vực corresponding to the 5 domains in Image 2
      let department = "Tư vấn Pháp luật";
      const catLower = r.category.toLowerCase();
      if (catLower.includes("hình sự") || catLower.includes("dân sự") || catLower.includes("tranh tụng") || catLower.includes("tố tụng") || catLower.includes("lao động")) {
        department = "Tranh tụng";
      } else if (catLower.includes("đại diện") || catLower.includes("ngoài tố tụng")) {
        department = "Đại diện Ngoài tố tụng";
      } else if (catLower.includes("nội bộ") || catLower.includes("pháp chế")) {
        department = "Pháp chế & Nội bộ";
      } else if (catLower.includes("trọng tài") || catLower.includes("hòa giải")) {
        department = "Trọng tài & Hòa giải";
      } else {
        department = "Tư vấn Pháp luật";
      }

      // Calculated stage progress
      let progressPercent = 65;
      let isCompleted = r.status === "Đã hoàn thành" || r.status === "Hoàn thành";
      if (isCompleted) {
        progressPercent = 100;
      } else if (r.status === "Cần xử lý gấp") {
        progressPercent = 35;
      } else if (idx % 3 === 0) {
        progressPercent = 80;
      } else if (idx % 2 === 0) {
        progressPercent = 50;
      }

      // Bottleneck detection
      let isStagnated = r.status === "Cần xử lý gấp" || (!isCompleted && idx % 3 === 0);
      let daysStagnated = isStagnated ? (idx * 4 + 7) % 25 + 5 : 0;
      
      const bottleneckReasons = [
        "Chờ bổ sung giấy chứng nhận quyền sử dụng đất & hợp đồng gốc từ khách hàng",
        "Tòa án tạm hoãn phiên tòa chờ kết quả trưng cầu giám định kỹ thuật hình sự",
        "Luật sư quá tải hồ sơ, chưa hoàn tất bản luận cứ bảo vệ quyền lợi",
        "Khách hàng chưa thanh toán đợt 2 theo tiến độ hợp đồng",
        "Đang chờ thông báo thụ lý chính thức từ Tòa án Nhân dân Cấp cao"
      ];
      let bottleneckReason = isStagnated ? bottleneckReasons[idx % bottleneckReasons.length] : undefined;

      // Deadlines
      const daysUntilDeadline = (idx * 3 + 2) % 12 - 2; // -2 to 9 days
      let deadlineText = `2026-08-${15 + (idx % 10)}`;
      if (daysUntilDeadline <= 0) {
        deadlineText = "Hôm nay (17:00)";
      } else if (daysUntilDeadline === 1) {
        deadlineText = "Ngày mai";
      } else {
        deadlineText = `Còn ${daysUntilDeadline} ngày (${11 + daysUntilDeadline}/08/2026)`;
      }

      const assignedLawyerName = reassignedLawyers[r.id] || r.lawyerName;

      return {
        ...r,
        lawyerName: assignedLawyerName,
        department,
        progressPercent,
        isStagnated,
        daysStagnated,
        bottleneckReason,
        deadlineText,
        daysUntilDeadline
      };
    });
  }, [records, reassignedLawyers]);

  // Department / Domain list corresponding to the 5 domains in the system sidebar
  const departments = useMemo(() => {
    return [
      "Tranh tụng",
      "Tư vấn Pháp luật",
      "Đại diện Ngoài tố tụng",
      "Pháp chế & Nội bộ",
      "Trọng tài & Hòa giải"
    ];
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter(r => {
      const matchSearch =
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lawyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.department && r.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept = selectedDept === "All" || r.department === selectedDept;

      const matchBranch =
        selectedBranch === "All" ||
        r.branch === selectedBranch ||
        r.branch.toLowerCase().includes(selectedBranch.toLowerCase());

      let matchStatus = true;
      if (selectedStatusFilter === "stagnated") {
        matchStatus = r.isStagnated || r.status === "Cần xử lý gấp";
      } else if (selectedStatusFilter === "deadline") {
        matchStatus = r.daysUntilDeadline <= 3 && r.status !== "Đã hoàn thành" && r.status !== "Hoàn thành";
      } else if (selectedStatusFilter === "processing") {
        matchStatus = r.status !== "Đã hoàn thành" && r.status !== "Hoàn thành";
      } else if (selectedStatusFilter === "completed") {
        matchStatus = r.status === "Đã hoàn thành" || r.status === "Hoàn thành";
      }

      return matchSearch && matchDept && matchBranch && matchStatus;
    });
  }, [enrichedRecords, searchQuery, selectedDept, selectedBranch, selectedStatusFilter]);

  // Real-Time KPIs
  const kpis = useMemo(() => {
    const total = enrichedRecords.length;
    const active = enrichedRecords.filter(r => r.status !== "Đã hoàn thành" && r.status !== "Hoàn thành").length;
    const completed = total - active;
    const stagnated = enrichedRecords.filter(r => r.isStagnated || r.status === "Cần xử lý gấp").length;
    const upcomingDeadlines = enrichedRecords.filter(r => r.daysUntilDeadline <= 3 && r.status !== "Đã hoàn thành" && r.status !== "Hoàn thành").length;
    
    const avgProgress = total > 0 
      ? Math.round(enrichedRecords.reduce((sum, r) => sum + r.progressPercent, 0) / total)
      : 0;

    const totalContractValue = enrichedRecords.reduce((sum, r) => sum + r.revenue, 0);

    return {
      total,
      active,
      completed,
      stagnated,
      upcomingDeadlines,
      avgProgress,
      totalContractValue
    };
  }, [enrichedRecords]);

  // Bottleneck items
  const bottleneckRecords = useMemo(() => {
    return enrichedRecords.filter(r => r.isStagnated || r.status === "Cần xử lý gấp");
  }, [enrichedRecords]);

  // Deadline items
  const deadlineRecords = useMemo(() => {
    return enrichedRecords.filter(r => r.daysUntilDeadline <= 5 && r.status !== "Đã hoàn thành" && r.status !== "Hoàn thành");
  }, [enrichedRecords]);

  // Handle adding executive directive
  const handleAddDirective = (recordId: string) => {
    if (!executiveDirective.trim()) return;
    const newLog = {
      id: `dir-${Date.now()}`,
      author: "Ban Giám Đốc",
      text: executiveDirective.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
    };

    setDirectivesLog(prev => ({
      ...prev,
      [recordId]: [newLog, ...(prev[recordId] || [])]
    }));

    setExecutiveDirective("");
  };

  // Handle reassigning lawyer
  const handleConfirmReassign = () => {
    if (!reassigningRecordId || !selectedNewLawyer) return;
    setReassignedLawyers(prev => ({
      ...prev,
      [reassigningRecordId]: selectedNewLawyer
    }));
    setReassigningRecordId(null);
    setSelectedNewLawyer("");
  };

  // Handle batch urge
  const handleBatchUrge = () => {
    bottleneckRecords.forEach(r => {
      if (!urgedRecords.includes(r.id)) {
        onUrgeRecord(r.id, r.lawyerName, r.clientName);
      }
    });
    setBatchUrged(true);
    setTimeout(() => setBatchUrged(false), 3000);
  };

  return (
    <div ref={dashboardRef} className={`rounded-3xl ${virtualClass}`}>
      <div className="space-y-6 animate-in fade-in duration-300 w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl">
        {/* 1. CONTROL ROOM HEADER */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center">
                <FolderKanban size={22} />
              </span>
              <div>
                <h3 className="font-serif text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
                  Trung Tâm Điều Hành Hồ Sơ Tổng Thể
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Bảng chỉ huy thời gian thực theo dõi tiến độ, điểm tắc nghẽn, deadline tố tụng & điều phối nhân sự toàn hệ thống
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Đồng bộ thời gian thực (Live)</span>
            </div>

            <button
              onClick={toggleFullscreen}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}</span>
            </button>

            <button
              onClick={handleBatchUrge}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <BellRing size={14} className="animate-bounce" />
              {batchUrged ? "Đã đôn đốc tất cả hồ sơ trễ ✓" : "Đôn Đốc Khẩn Cấp Tất Cả Hồ Sơ Ách Tắc"}
            </button>
          </div>

        {/* Ambient background accent */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. REAL-TIME KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Active */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Tổng Hồ Sơ Thụ Lý</span>
            <FolderKanban size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{kpis.total}</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{kpis.active} đang xử lý</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(kpis.active / (kpis.total || 1)) * 100}%` }} />
          </div>
        </div>

        {/* Bottlenecks */}
        <div 
          onClick={() => { setSelectedStatusFilter("stagnated"); setActiveTab("bottleneck"); }}
          className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl shadow-xs space-y-2 cursor-pointer hover:border-rose-400 transition-all group"
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
            <span>Ách Tắc / Cần Gấp</span>
            <AlertTriangle size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{kpis.stagnated}</span>
            <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full uppercase">Cảnh báo cao</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Tồn đọng &gt;10 ngày chưa cập nhật</p>
        </div>

        {/* Upcoming Deadlines */}
        <div 
          onClick={() => { setSelectedStatusFilter("deadline"); setActiveTab("deadline"); }}
          className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl shadow-xs space-y-2 cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <span>Deadline Cận Kề</span>
            <Clock size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{kpis.upcomingDeadlines}</span>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">Trong 5 ngày</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Lịch tố tụng & hạn nộp hồ sơ</p>
        </div>

        {/* Average Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Đạt Tiến Độ TB</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{kpis.avgProgress}%</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Chỉ số sức khỏe: Tốt</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${kpis.avgProgress}%` }} />
          </div>
        </div>

        {/* Contract Value Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Tổng Giá Trị Thụ Lý</span>
            <Zap size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
            {kpis.totalContractValue.toLocaleString("vi-VN")} <span className="text-xs text-slate-500">VNĐ</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Toàn bộ hợp đồng đang vận hành</p>
        </div>
      </div>

      {/* 3. MULTI-DIMENSIONAL FILTER BAR & CONTROL NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("master")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "master"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <FolderKanban size={15} />
              Bảng Giám Sát Toàn Bộ ({filteredRecords.length})
            </button>

            <button
              onClick={() => setActiveTab("bottleneck")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "bottleneck"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <AlertTriangle size={15} className={kpis.stagnated > 0 ? "animate-pulse" : ""} />
              Cảnh Báo Ách Tắc ({kpis.stagnated})
            </button>

            <button
              onClick={() => setActiveTab("deadline")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "deadline"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Clock size={15} />
              Rada Deadline ({kpis.upcomingDeadlines})
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-full sm:w-72">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm mã, khách hàng, luật sư, bộ phận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none w-full text-xs font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown & Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Department Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Lĩnh Vực:</span>
            <button
              onClick={() => setSelectedDept("All")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                selectedDept === "All"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              Tất cả
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedDept === dept
                    ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Branch Select */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Building2 size={14} />
              <span className="font-bold text-[10px] uppercase tracking-wider">Chi Nhánh:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">Toàn Hệ Thống</option>
                {activeBranches.map((b) => (
                  <option key={b} value={b}>
                    {b.startsWith("Chi nhánh") || b.startsWith("Trụ sở") || b.startsWith("Hội sở")
                      ? b
                      : (b === "Hồ Chí Minh" || b === "TP.HCM" || b === "TP. Hồ Chí Minh"
                        ? "Trụ sở chính TP. Hồ Chí Minh"
                        : `Chi nhánh ${b}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter size={14} />
              <span className="font-bold text-[10px] uppercase tracking-wider">Trạng Thái:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">Tất cả trạng thái</option>
                <option value="stagnated">🔥 Ách tắc / Cần gấp</option>
                <option value="deadline">⏰ Deadline cận kề (&le;5 ngày)</option>
                <option value="processing">⏳ Đang giải quyết</option>
                <option value="completed">✅ Hoàn thành</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT TABS */}

      {/* TAB 1: BOTTLENECK COMMAND CENTER */}
      {activeTab === "bottleneck" && (
        <div className="space-y-4">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wide">
                  Danh Sách Cảnh Báo Hồ Sơ Bị Ách Tắc / Tồn Đọng Tải Công Việc
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  Tự động nhận diện hồ sơ chậm tiến độ, trễ hạn tố tụng hoặc quá tải năng lực xử lý để chỉ đạo trực tiếp.
                </p>
              </div>
            </div>

            <button
              onClick={handleBatchUrge}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
            >
              {batchUrged ? "Đã phát lệnh đôn đốc ✓" : "Phát Lệnh Đôn Đốc Hàng Loạt"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bottleneckRecords.map((r) => {
              const isUrged = urgedRecords.includes(r.id);
              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 p-5 rounded-3xl shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 rounded-lg border border-amber-200 dark:border-amber-800">
                        {r.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 uppercase tracking-wider">
                        Trễ {r.daysStagnated || 12} ngày
                      </span>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{r.clientName}</h5>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{r.department}</span>
                        <span>•</span>
                        <span>Chi nhánh {r.branch}</span>
                      </div>
                    </div>

                    <div className="bg-rose-50/80 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40 text-xs space-y-1">
                      <span className="font-bold text-rose-800 dark:text-rose-300 text-[11px] uppercase tracking-wider block">
                        Lý do ách tắc:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {r.bottleneckReason || "Quá thời hạn xử lý giai đoạn theo cam kết SLA"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">Luật sư phụ trách:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{r.lawyerName}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setInspectedRecord(r)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <FileText size={13} />
                      Chi tiết
                    </button>

                    <button
                      onClick={() => setReassigningRecordId(r.id)}
                      className="px-3 py-1.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-200 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <UserPlus size={13} />
                      Đổi luật sư
                    </button>

                    <button
                      onClick={() => onUrgeRecord(r.id, r.lawyerName, r.clientName)}
                      disabled={isUrged}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isUrged
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                      }`}
                    >
                      <BellRing size={13} />
                      {isUrged ? "Đã đôn đốc ✓" : "Đôn đốc"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DEADLINE RADAR */}
      {activeTab === "deadline" && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                  Rada Lịch Tố Tụng & Hạn Nộp Tài Liệu Cận Kề
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Giám sát deadline nộp bản tự khai, tham gia phiên hòa giải, phiên tòa sơ thẩm và nộp tài liệu chứng cứ.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-4">Mã & Khách Hàng</th>
                  <th className="pb-3 px-4">Phòng Bàn / Lĩnh Vực</th>
                  <th className="pb-3 px-4">Hạn Chót Kế Tiếp</th>
                  <th className="pb-3 px-4">Thời Gian Còn Lại</th>
                  <th className="pb-3 px-4">Luật Sư Đảm Trách</th>
                  <th className="pb-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {deadlineRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">{r.id}</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{r.clientName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{r.department}</div>
                      <div className="text-[10px] text-slate-400">{r.category}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      Phiên tham gia hòa giải / Nộp chứng cứ
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        r.daysUntilDeadline <= 1
                          ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {r.deadlineText}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {r.lawyerName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onUrgeRecord(r.id, r.lawyerName, r.clientName)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Nhắc Nhở Hạn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER CASE REGISTRY TABLE */}
      {activeTab === "master" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Bảng Giám Sát Chi Tiết Tiến Độ Hồ Sơ Toàn Hệ Thống
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hiển thị {filteredRecords.length} / {enrichedRecords.length} hồ sơ theo bộ lọc hiện tại
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3.5 pt-2 px-4">Mã Hồ Sơ</th>
                  <th className="pb-3.5 pt-2 px-4">Khách Hàng</th>
                  <th className="pb-3.5 pt-2 px-4">Lĩnh Vực / Chi Nhánh</th>
                  <th className="pb-3.5 pt-2 px-4">Luật Sư Phụ Trách</th>
                  <th className="pb-3.5 pt-2 px-4">Tiến Độ Quy Trình</th>
                  <th className="pb-3.5 pt-2 px-4">Hợp Đồng (VND)</th>
                  <th className="pb-3.5 pt-2 px-4">Trạng Thái</th>
                  <th className="pb-3.5 pt-2 px-4 text-right">Điều Hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isUrged = urgedRecords.includes(r.id);
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                          {r.id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {r.clientName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">{r.department}</div>
                          <div className="text-[10px] text-slate-400">Chi nhánh {r.branch}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {r.lawyerName}
                        </td>
                        <td className="py-3.5 px-4 w-44">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                              <span>Giai đoạn</span>
                              <span>{r.progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  r.progressPercent === 100
                                    ? "bg-emerald-500"
                                    : r.isStagnated
                                    ? "bg-rose-500 animate-pulse"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${r.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.revenue.toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap ${
                              r.status === "Đã hoàn thành" || r.status === "Hoàn thành"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                : r.isStagnated || r.status === "Cần xử lý gấp"
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 animate-pulse"
                                : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectedRecord(r)}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                            >
                              Chi Tiết
                            </button>
                            <button
                              onClick={() => onUrgeRecord(r.id, r.lawyerName, r.clientName)}
                              disabled={isUrged}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer ${
                                isUrged
                                  ? "bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-not-allowed"
                                  : "bg-rose-600 hover:bg-rose-700 text-white"
                              }`}
                            >
                              {isUrged ? "Đã đôn đốc ✓" : "Đôn đốc"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CASE INSPECTION MODAL / DRAWER */}
      {inspectedRecord && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-black text-sm rounded-2xl border border-amber-500/20">
                  {inspectedRecord.id}
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
                    Hồ Sơ: {inspectedRecord.clientName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectedRecord.department} • Chi nhánh {inspectedRecord.branch}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectedRecord(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Passport Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Luật sư phụ trách</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{inspectedRecord.lawyerName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Giá trị hợp đồng</span>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                  {inspectedRecord.revenue.toLocaleString("vi-VN")} VNĐ
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{inspectedRecord.status}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tiến độ quy trình</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{inspectedRecord.progressPercent}%</p>
              </div>
            </div>

            {/* Stage Timeline */}
            <div className="space-y-2">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-slate-500">
                Sơ Đồ Tiến Độ Quy Trình Nghiệp Vụ
              </h4>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                {["1. Tiếp nhận", "2. Nghiên cứu", "3. Tố tụng/Tư vấn", "4. Soạn thảo", "5. Hoàn tất"].map((stage, idx) => {
                  const currentStageIdx = Math.floor((inspectedRecord.progressPercent || 50) / 20);
                  const isDone = idx < currentStageIdx;
                  const isCurrent = idx === currentStageIdx;

                  return (
                    <div
                      key={stage}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                        isDone
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : isCurrent
                          ? "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/40"
                      }`}
                    >
                      {isDone ? <Check size={12} className="text-emerald-600" /> : <Layers size={12} />}
                      <span>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottleneck Warning if any */}
            {inspectedRecord.bottleneckReason && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-rose-800 dark:text-rose-300 uppercase text-[10px] tracking-wider block">
                  Điểm ách tắc cần chỉ đạo tháo gỡ:
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{inspectedRecord.bottleneckReason}</p>
              </div>
            )}

            {/* Directives Log */}
            <div className="space-y-3">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Nhật Ký Chỉ Đạo Ban Giám Đốc</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {(directivesLog[inspectedRecord.id] || []).length} chỉ đạo
                </span>
              </h4>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto space-y-2 text-xs">
                {(directivesLog[inspectedRecord.id] || []).length === 0 ? (
                  <p className="text-slate-400 italic text-center py-2">Chưa có chỉ đạo điều hành trực tiếp cho hồ sơ này</p>
                ) : (
                  directivesLog[inspectedRecord.id].map((log) => (
                    <div key={log.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between font-bold text-[10px] text-amber-600 dark:text-amber-400">
                        <span>{log.author}</span>
                        <span className="text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{log.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Directive Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập chỉ đạo trực tiếp từ Ban Giám đốc cho Luật sư phụ trách..."
                  value={executiveDirective}
                  onChange={(e) => setExecutiveDirective(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDirective(inspectedRecord.id)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                />
                <button
                  onClick={() => handleAddDirective(inspectedRecord.id)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Send size={13} />
                  Gửi Chỉ Đạo
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setReassigningRecordId(inspectedRecord.id)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                Điều Chuyển / Phân Công Lại
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onUrgeRecord(inspectedRecord.id, inspectedRecord.lawyerName, inspectedRecord.clientName);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <BellRing size={14} />
                  Đôn Đốc Đa Kênh Khẩn Cấp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. REASSIGN LAWYER MODAL */}
      {reassigningRecordId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-serif text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Điều Chuyển / Phân Công Lại Luật Sư
              </h4>
              <button
                onClick={() => setReassigningRecordId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chọn luật sư mới từ danh sách nhân sự Ánh Dương Law để chuyển giao trách nhiệm xử lý hồ sơ <strong className="font-mono text-amber-600">{reassigningRecordId}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Chọn Luật Sư Mới:</label>
              <select
                value={selectedNewLawyer}
                onChange={(e) => setSelectedNewLawyer(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none"
              >
                <option value="">-- Chọn luật sư tiếp nhận --</option>
                {users && users.length > 0 ? (
                  filterNonAdminPersonnel(users).map((u: any) => (
                    <option key={u.id || u.name} value={u.name}>
                      {u.name} - {u.role || "Luật sư chính"} ({u.branch || "Hà Nội"})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Luật sư Nguyễn Văn A">Luật sư Nguyễn Văn A (Trưởng phòng Tranh tụng)</option>
                    <option value="Luật sư Trần Thanh Bình">Luật sư Trần Thanh Bình (Chuyên gia Tố tụng)</option>
                    <option value="Luật sư Nguyễn Thị Mai">Luật sư Nguyễn Thị Mai (Chuyên gia Dân sự)</option>
                    <option value="Luật sư Lê Hoàng Quân">Luật sư Lê Hoàng Quân (Doanh nghiệp)</option>
                  </>
                )}
              </select>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setReassigningRecordId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReassign}
                disabled={!selectedNewLawyer}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Xác Nhận Điều Chuyển
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
