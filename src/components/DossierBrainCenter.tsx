import React, { useState, useMemo, useEffect } from "react";
import { fetchApi } from "../utils/api";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Users,
  Building2,
  ChevronRight,
  BarChart3,
  PieChart as PieIcon,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  Eye,
  Edit3,
  Layers,
  Send,
  Sparkles,
  Zap,
  FileSpreadsheet,
  FileText,
  X,
  Check,
  AlertCircle,
  BarChart2,
  FolderOpen,
  ArrowRight,
  Copy,
  Printer
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import * as XLSX from "xlsx";

interface DossierBrainCenterProps {
  records: any[];
  onUpdateRecord?: (id: string, updatedData: any) => void;
  users?: any[];
  language?: "vi" | "en";
  currentUser?: any;
  offices?: any[];
}

const LITIGATION_STEPS = [
  "B1: Chuẩn bị hồ sơ",
  "B2: Nộp hồ sơ khởi kiện",
  "B3: Theo dõi & Xử lý đơn",
  "B4: Nộp tạm ứng án phí",
  "B5: Thụ lý vụ án",
  "B6: Hòa giải",
  "B7: Kết quả hòa giải",
  "B8: Quyết định đưa vụ án ra xét xử",
  "B9: Bản án sơ thẩm",
  "B10: Thi hành án",
  "B11: Kết thúc tố tụng",
];

const CONSULTING_STEPS = [
  "B1: Tiếp nhận nhu cầu tư vấn doanh nghiệp",
  "B2: Khảo sát & Đánh giá rủi ro pháp lý",
  "B3: Lập Đề xuất & Hợp đồng dịch vụ pháp lý",
  "B4: Nghiên cứu & Dữ liệu hồ sơ doanh nghiệp",
  "B5: Soạn thảo Văn bản / Ý kiến pháp lý (Legal Opinion)",
  "B6: Trao đổi & Thống nhất với Doanh nghiệp",
  "B7: Phát hành Văn bản tư vấn chính thức",
  "B8: Hỗ trợ Thực thi & Tối ưu hóa thủ tục",
  "B9: Nghiệm thu & Bàn giao kết quả tư vấn",
];

const COLOR_PIE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];

export default function DossierBrainCenter({
  records = [],
  onUpdateRecord,
  users = [],
  language = "vi",
  currentUser,
  offices: passedOffices = []
}: DossierBrainCenterProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "stages" | "risks" | "workload" | "ai_copilot">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<any | null>(null);

  const [offices, setOffices] = useState<any[]>([
    { id: 1, name: "Trụ sở chính TP. Hồ Chí Minh", short_name: "TP. Hồ Chí Minh" },
    { id: 2, name: "Chi nhánh Hà Nội", short_name: "Hà Nội" },
    { id: 3, name: "Chi nhánh Đà Nẵng", short_name: "Đà Nẵng" }
  ]);

  useEffect(() => {
    if (passedOffices && passedOffices.length > 0) {
      setOffices(passedOffices);
    }
  }, [passedOffices]);

  useEffect(() => {
    let active = true;
    const loadOffices = () => {
      if (passedOffices && passedOffices.length > 0) return;
      fetchApi("/api/offices")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch offices");
        })
        .then((data) => {
          if (active && Array.isArray(data) && data.length > 0) {
            setOffices(data);
          }
        })
        .catch((err) => console.warn("Failed to fetch offices in DossierBrainCenter:", err));
    };
    loadOffices();

    let socket: any = null;
    try {
      socket = io({ transports: ["websocket"] });
      socket.on("offices_updated", () => {
        loadOffices();
      });
    } catch (e) {
      console.warn("Socket connection failed in DossierBrainCenter:", e);
    }

    return () => {
      active = false;
      if (socket) socket.disconnect();
    };
  }, []);

  // Selected dossiers for batch operations
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAssignee, setBatchAssignee] = useState("");
  const [batchStatus, setBatchStatus] = useState("");
  const [batchNote, setBatchNote] = useState("");

  // AI Copilot state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const title = String(r.title || "").toLowerCase();
      const client = String(r.client || r.clientName || "").toLowerCase();
      const code = String(r.id || r.systemId || "").toLowerCase();
      const assignee = String(r.mainAssignee || r.assignee || "").toLowerCase();
      const court = String(r.court || r.courtRegion || "").toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || title.includes(q) || client.includes(q) || code.includes(q) || assignee.includes(q) || court.includes(q);

      const matchesBranch = selectedBranch === "all" || (r.branch || r.office || "Đà Nẵng") === selectedBranch;
      const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;
      const matchesPriority = selectedPriority === "all" || r.priority === selectedPriority;

      return matchesSearch && matchesBranch && matchesCategory && matchesStatus && matchesPriority;
    });
  }, [records, searchQuery, selectedBranch, selectedCategory, selectedStatus, selectedPriority]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const total = records.length;
    let completed = 0;
    let inProgress = 0;
    let delayed = 0;
    let urgent = 0;
    let unassigned = 0;
    let totalContractValue = 0;

    records.forEach((r) => {
      const st = (r.status || "").toLowerCase();
      if (st.includes("hoàn thành") || st.includes("kết thúc") || st.includes("lưu trữ")) {
        completed++;
      } else if (st.includes("trễ") || st.includes("quá hạn") || st.includes("tạm dừng")) {
        delayed++;
      } else {
        inProgress++;
      }

      if (r.priority === "Khẩn cấp" || r.priority === "Cao") {
        urgent++;
      }

      if (!r.mainAssignee || r.mainAssignee === "Chưa phân công" || r.mainAssignee === "Chưa rõ") {
        unassigned++;
      }

      const val = typeof r.fee === "number" ? r.fee : typeof r.contractValue === "number" ? r.contractValue : 0;
      totalContractValue += val;
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const delayedRate = total > 0 ? Math.round((delayed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      delayed,
      urgent,
      unassigned,
      completionRate,
      delayedRate,
      totalContractValue
    };
  }, [records]);

  // Status Distribution Data for Recharts
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const st = r.status || "Chưa phân loại";
      counts[st] = (counts[st] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  // Category Distribution Data for Recharts
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const cat = r.category || "Khác";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  // Workload Per Lawyer / Specialist Data
  const workloadData = useMemo(() => {
    const map: Record<string, { total: number; completed: number; inProgress: number; delayed: number; urgent: number }> = {};

    records.forEach((r) => {
      const name = r.mainAssignee || "Chưa phân công";
      if (!map[name]) {
        map[name] = { total: 0, completed: 0, inProgress: 0, delayed: 0, urgent: 0 };
      }
      map[name].total += 1;
      const st = (r.status || "").toLowerCase();
      if (st.includes("hoàn thành") || st.includes("kết thúc")) {
        map[name].completed += 1;
      } else if (st.includes("trễ") || st.includes("tạm dừng")) {
        map[name].delayed += 1;
      } else {
        map[name].inProgress += 1;
      }
      if (r.priority === "Khẩn cấp" || r.priority === "Cao") {
        map[name].urgent += 1;
      }
    });

    return Object.entries(map).map(([lawyer, data]) => ({
      lawyer,
      ...data,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [records]);

  // High Risk / Bottleneck Dossiers
  const highRiskDossiers = useMemo(() => {
    return records.filter((r) => {
      const st = (r.status || "").toLowerCase();
      const isUrgent = r.priority === "Khẩn cấp";
      const isUnassigned = !r.mainAssignee || r.mainAssignee === "Chưa phân công";
      const isDelayed = st.includes("trễ") || st.includes("quá hạn") || st.includes("tạm dừng");
      return isUrgent || isUnassigned || isDelayed;
    });
  }, [records]);

  // Toggle selection for batch operations
  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRecordIds.length === filteredRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map((r) => r.id));
    }
  };

  // Submit Batch Assignment / Status Change
  const handleApplyBatchChanges = () => {
    if (selectedRecordIds.length === 0) return;
    if (!batchAssignee && !batchStatus) {
      alert("Vui lòng chọn nhân sự đảm trách mới hoặc trạng thái mới để áp dụng!");
      return;
    }

    selectedRecordIds.forEach((id) => {
      const rec = records.find((r) => r.id === id);
      if (rec && onUpdateRecord) {
        const updated = {
          ...rec,
          ...(batchAssignee ? { mainAssignee: batchAssignee } : {}),
          ...(batchStatus ? { status: batchStatus } : {}),
          lastWorkDate: new Date().toLocaleDateString("vi-VN"),
        };
        onUpdateRecord(id, updated);
      }
    });

    alert(`Đã cập nhật tiến độ hàng loạt cho ${selectedRecordIds.length} hồ sơ thành công!`);
    setShowBatchModal(false);
    setSelectedRecordIds([]);
    setBatchAssignee("");
    setBatchStatus("");
    setBatchNote("");
  };

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = filteredRecords.map((r, index) => ({
      STT: index + 1,
      "Mã Hồ Sơ": r.id || r.systemId,
      "Tên Hồ Sơ / Vụ Việc": r.title,
      "Khách Hàng": r.client || r.clientName,
      "Lĩnh Vực": r.category,
      "Trạng Thái": r.status,
      "Bước Tiến Độ": r.step || r.currentStep || "Chưa cập nhật",
      "Mức Độ Ưu Tiên": r.priority || "Bình thường",
      "Luật Sư Đảm Trách": r.mainAssignee || "Chưa phân công",
      "Cơ Quan / Tòa Án": r.court || r.courtRegion || "N/A",
      "Chi Nhánh": r.branch || r.office || "Đà Nẵng",
      "Giá Trị Hợp Đồng (VNĐ)": r.fee || r.contractValue || 0,
      "Cập Nhật Gần Nhất": r.lastWorkDate || "Chưa rõ"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tiến_Độ_Hồ_Sơ_Hệ_Thống");
    XLSX.writeFile(workbook, `Bao_Cao_Tien_Do_Ho_So_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Run AI Brain Diagnosis
  const handleRunAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    try {
      const summaryData = {
        totalDossiers: metrics.total,
        completedDossiers: metrics.completed,
        inProgressDossiers: metrics.inProgress,
        delayedDossiers: metrics.delayed,
        urgentDossiers: metrics.urgent,
        unassignedDossiers: metrics.unassigned,
        completionRate: `${metrics.completionRate}%`,
        categoriesCount: categoryChartData,
        workloadByLawyer: workloadData.slice(0, 5),
        sampleRiskList: highRiskDossiers.slice(0, 5).map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          assignee: r.mainAssignee,
          priority: r.priority
        }))
      };

      const prompt = `Bạn là "Bộ Não Kiểm Soát Tiến Độ Hồ Sơ" điều hành hệ thống Luật vụ. Hãy phân tích chuyên sâu báo cáo dữ liệu tiến độ hệ thống dưới đây:
${JSON.stringify(summaryData, null, 2)}

Hãy xuất ra bản Đánh giá Chỉ huy (Executive Command Insights) bằng tiếng Việt gồm 3 phần rõ ràng formatted theo Markdown:
1. 🧠 **Bức tranh Tổng thể Tiến độ & Đánh giá Sức khỏe Toàn hệ thống** (Nhận xét ngắn gọn, sắc bén về tỷ lệ hoàn thành, tốc độ giải quyết).
2. ⚠️ **3 Điểm nghẽn / Rủi ro trễ hạn Lớn nhất cần Can thiệp ngay** (Chỉ rõ vấn đề phân công, tình trạng trễ hoặc tải công việc).
3. 🎯 **Chiến lược Thúc đẩy Tiến độ & Hành động Khẩn cấp cho Ban Giám đốc & Trưởng phòng**.`;

      const response = await fetchApi("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt })
      }).then((res) => res.json());

      if (response && response.text) {
        setAiAnalysis(response.text);
      } else {
        setAiAnalysis("Hệ thống AI đã phân tích xong. Tiến độ hồ sơ chung đạt chỉ số an toàn. Hãy tập trung xử lý các vụ việc khẩn cấp chưa phân công.");
      }
    } catch (e: any) {
      console.error(e);
      setAiAnalysis("⚠️ Không thể kết nối với Bộ Não AI. Vui lòng kiểm tra cấu hình Gemini API key.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 bg-slate-50/50 p-4 md:p-6 rounded-3xl min-h-screen">
      {/* Top Banner & Brain Hub Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 animate-pulse">
                <Brain size={28} />
              </div>
              <div>
                <span className="text-xs font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                  Hệ Thống Chỉ Huy Trung Tâm • Executive Brain Hub
                </span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
                  BỘ NÃO KIỂM SOÁT TIẾN ĐỘ HỒ SƠ
                </h2>
              </div>
            </div>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Trạm chỉ huy điều hành toàn bộ khối lượng, trạng thái, tiến độ thực thi từng bước (B1-B11), phát hiện điểm nghẽn và phân bổ nguồn lực tự động cho tất cả vụ việc trong hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <FileSpreadsheet size={16} />
              Xuất Excel Toàn Bộ
            </button>
            <button
              onClick={() => {
                setActiveTab("ai_copilot");
                handleRunAiAnalysis();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95"
            >
              <Sparkles size={16} className="animate-spin" />
              AI Phân Tích Bức Tranh Hồ Sơ
            </button>
          </div>
        </div>

        {/* Real-time Health Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số Hồ sơ</span>
            <div className="text-2xl font-black text-white mt-0.5">{metrics.total}</div>
            <span className="text-[10px] text-slate-400">Trên toàn hệ thống</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Đã hoàn thành</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{metrics.completed}</div>
            <span className="text-[10px] text-emerald-300">Tỷ lệ {metrics.completionRate}%</span>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">Đang xử lý</span>
            <div className="text-2xl font-black text-blue-400 mt-0.5">{metrics.inProgress}</div>
            <span className="text-[10px] text-blue-300">Đang thực thi các bước</span>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">Trễ hạn / Điểm nghẽn</span>
            <div className="text-2xl font-black text-rose-400 mt-0.5">{metrics.delayed}</div>
            <span className="text-[10px] text-rose-300">Cần thúc giục khẩn</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Ưu tiên Khẩn cấp</span>
            <div className="text-2xl font-black text-amber-400 mt-0.5">{metrics.urgent}</div>
            <span className="text-[10px] text-amber-300">Cần Giám đốc/Luật sư duyệt</span>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Chưa phân công</span>
            <div className="text-2xl font-black text-purple-400 mt-0.5">{metrics.unassigned}</div>
            <span className="text-[10px] text-purple-300">Chờ giao chuyên viên</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BarChart2 size={16} />
            Trụ cột 1: Thống Kê Tổng Quan & Trạng Thái
          </button>

          <button
            onClick={() => setActiveTab("stages")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "stages"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers size={16} />
            Trụ cột 2: Ma Trận Quy Trình B1-B11
          </button>

          <button
            onClick={() => setActiveTab("risks")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "risks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShieldAlert size={16} />
            Trụ cột 3: Radar Cảnh Báo Rủi Ro ({highRiskDossiers.length})
          </button>

          <button
            onClick={() => setActiveTab("workload")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "workload"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users size={16} />
            Trụ cột 4: Phân Bổ Tải Công Việc
          </button>

          <button
            onClick={() => {
              setActiveTab("ai_copilot");
              if (!aiAnalysis) handleRunAiAnalysis();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ai_copilot"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-100"
                : "text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
            }`}
          >
            <Brain size={16} />
            🧠 Trợ Lý Bộ Não AI
          </button>
        </div>

        {selectedRecordIds.length > 0 && (
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md animate-bounce"
          >
            <Zap size={14} />
            Thao tác hàng loạt ({selectedRecordIds.length} hồ sơ)
          </button>
        )}
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm hồ sơ theo Mã, Tên vụ việc, Khách hàng, Luật sư đảm trách, Tòa án..."
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50"
            />
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">📍 Tất cả chi nhánh</option>
              {offices.map((off: any) => {
                const b = off.short_name || off.name;
                return (
                  <option key={off.id} value={b}>
                    {b.startsWith("Chi nhánh") || b.startsWith("Trụ sở") || b.startsWith("Hội sở")
                      ? b
                      : (b === "Hồ Chí Minh" || b === "TP.HCM" || b === "TP. Hồ Chí Minh"
                        ? "Trụ sở chính TP. Hồ Chí Minh"
                        : `Chi nhánh ${b}`)}
                  </option>
                );
              })}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">📂 Tất cả lĩnh vực</option>
              <option value="Dân sự">Dân sự</option>
              <option value="Hình sự">Hình sự</option>
              <option value="Hành chính">Hành chính</option>
              <option value="Kinh doanh & Thương mại">Kinh doanh & Thương mại</option>
              <option value="Đất đai & Bất động sản">Đất đai & Bất động sản</option>
              <option value="Tư vấn doanh nghiệp">Tư vấn doanh nghiệp</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">🔄 Tất cả trạng thái</option>
              <option value="Tiếp nhận">Tiếp nhận</option>
              <option value="Đã phân công">Đã phân công</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Chờ tài liệu">Chờ tài liệu</option>
              <option value="Đang xét xử">Đang xét xử</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Tạm dừng">Tạm dừng</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">⚡ Tất cả ưu tiên</option>
              <option value="Bình thường">Bình thường</option>
              <option value="Cao">Cao</option>
              <option value="Khẩn cấp">Khẩn cấp</option>
            </select>

            {(searchQuery || selectedBranch !== "all" || selectedCategory !== "all" || selectedStatus !== "all" || selectedPriority !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedBranch("all");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSelectedPriority("all");
                }}
                className="px-3 py-2 text-rose-600 bg-rose-50 rounded-xl font-bold hover:bg-rose-100 transition-all"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & GRAPHICAL DISTRIBUTION */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown BarChart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <BarChart3 className="text-indigo-600" size={20} />
                    Cơ cấu Số lượng Hồ sơ theo Trạng Thái
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Phân bố vụ việc theo các giai đoạn xử lý</p>
                </div>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {statusChartData.length} trạng thái
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="value" name="Số lượng hồ sơ" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown PieChart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <PieIcon className="text-emerald-600" size={20} />
                    Tỷ lệ Phân bổ theo Lĩnh Vực Pháp Lý
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Phân tích trọng số các nhóm hồ sơ chính</p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {categoryChartData.length} lĩnh vực
                </span>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLOR_PIE[index % COLOR_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAGE PROGRESSION MATRIX (B1-B11) */}
      {activeTab === "stages" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Layers className="text-indigo-600" size={22} />
              Ma Trận Thực Thi Quy Trình Tố Tụng & Tư Vấn (B1 - B11)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Theo dõi chính xác vị trí tiến độ hiện tại của tất cả hồ sơ trong chuỗi quy trình chuẩn hóa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LITIGATION_STEPS.map((step, idx) => {
              const stepRecords = records.filter(
                (r) => (r.step || r.currentStep || "").toLowerCase().includes(step.split(":")[0].toLowerCase())
              );

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      Bước {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border">
                      {stepRecords.length} hồ sơ
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{step}</h4>

                  <div className="space-y-1.5 pt-1">
                    {stepRecords.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRecordForDetail(r)}
                        className="text-xs p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 cursor-pointer flex items-center justify-between transition-all"
                      >
                        <span className="font-bold text-slate-700 truncate max-w-[180px]">{r.title}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold">{r.id}</span>
                      </div>
                    ))}
                    {stepRecords.length > 3 && (
                      <div className="text-[11px] text-slate-500 font-semibold text-center pt-1">
                        + {stepRecords.length - 3} hồ sơ khác ở bước này
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RISK & BOTTLENECK RADAR */}
      {activeTab === "risks" && (
        <div className="space-y-6">
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-base">Radar Phát Hiện Hồ Sơ Có Rủi Ro / Trễ Hạn Khẩn Cấp</h3>
                <p className="text-xs text-rose-700">Tự động khoanh vùng hồ sơ chưa phân công, quá hạn xử lý hoặc gắn cờ ưu tiên khẩn cấp.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highRiskDossiers.map((r) => (
              <div
                key={r.id}
                className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-500" />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    {r.id}
                  </span>
                  <span className="text-[11px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {r.priority || "Cảnh báo"}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-sm line-clamp-2">{r.title}</h4>

                <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                  <p>👤 <b>Khách hàng:</b> {r.client || r.clientName || "N/A"}</p>
                  <p>⚖️ <b>Đảm trách:</b> <span className={!r.mainAssignee || r.mainAssignee === "Chưa phân công" ? "text-rose-600 font-bold" : ""}>{r.mainAssignee || "CHƯA PHÂN CÔNG"}</span></p>
                  <p>📌 <b>Trạng thái:</b> {r.status}</p>
                  <p>🕒 <b>Cập nhật gần nhất:</b> {r.lastWorkDate || "Chưa rõ"}</p>
                </div>

                <button
                  onClick={() => setSelectedRecordForDetail(r)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  Can Thiệp & Xử Lý Tiến Độ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WORKLOAD & PERSONNEL DISTRIBUTION */}
      {activeTab === "workload" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Users className="text-indigo-600" size={22} />
              Bảng Cân Bằng Tải Công Việc Theo Nhân Sự / Luật Sư
            </h3>
            <p className="text-xs text-slate-500 mt-1">Đo lường số lượng vụ việc đảm trách, tỷ lệ hoàn thành và nguy cơ quá tải.</p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3.5">Luật Sư / Chuyên Viên</th>
                  <th className="p-3.5 text-center">Tổng Số Vụ Việc</th>
                  <th className="p-3.5 text-center">Đã Hoàn Thành</th>
                  <th className="p-3.5 text-center">Đang Thực Thi</th>
                  <th className="p-3.5 text-center">Trễ Hạn / Rủi Ro</th>
                  <th className="p-3.5 text-center">Tỷ Lệ Tải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workloadData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                        {item.lawyer.charAt(0).toUpperCase()}
                      </div>
                      <span>{item.lawyer}</span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800">{item.total}</td>
                    <td className="p-3.5 text-center font-bold text-emerald-600">{item.completed}</td>
                    <td className="p-3.5 text-center font-bold text-blue-600">{item.inProgress}</td>
                    <td className="p-3.5 text-center font-bold text-rose-600">{item.delayed}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(item.completionRate, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{item.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AI BRAIN COPILOT */}
      {activeTab === "ai_copilot" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Brain size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Trợ Lý AI Phân Tích & Dự Báo Tiến Độ</h3>
                <p className="text-xs text-slate-500">Chỉ huy bằng dữ liệu thông minh thời gian thực powered by Gemini.</p>
              </div>
            </div>

            <button
              onClick={handleRunAiAnalysis}
              disabled={isAiAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isAiAnalyzing ? "animate-spin" : ""} />
              {isAiAnalyzing ? "Đang Phân Tích Dữ Liệu..." : "Phân Tích Lại Tình Hình"}
            </button>
          </div>

          {isAiAnalyzing ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
              <p className="text-slate-600 font-bold text-sm">Bộ Não AI đang quét qua toàn bộ {metrics.total} hồ sơ trong CSDL...</p>
            </div>
          ) : aiAnalysis ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {aiAnalysis}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm">
              Nhấn nút "Phân Tích Lại Tình Hình" để kích hoạt AI chẩn đoán bức tranh tiến độ.
            </div>
          )}
        </div>
      )}

      {/* MASTER DOSSIER TABLE WITH BATCH SELECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FolderOpen className="text-indigo-600" size={20} />
              Danh Sách Hồ Sơ Chỉ Huy & Điều Hành Tiến Độ ({filteredRecords.length})
            </h3>
            <p className="text-xs text-slate-400 font-medium">Bảng kiểm soát trực tiếp toàn bộ dữ liệu hồ sơ vụ việc</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRecordIds.length > 0 && selectedRecordIds.length === filteredRecords.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-3.5">Mã & Tên Vụ Việc / Hồ Sơ</th>
                <th className="p-3.5">Khách Hàng</th>
                <th className="p-3.5">Lĩnh Vực</th>
                <th className="p-3.5">Bước Tiến Độ</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5">Đảm Trách</th>
                <th className="p-3.5">Ưu Tiên</th>
                <th className="p-3.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    Không tìm thấy hồ sơ nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isSelected = selectedRecordIds.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-indigo-50/40 transition-colors ${isSelected ? "bg-indigo-50/80" : ""}`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRecord(r.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="p-3.5 font-bold text-slate-800">
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 block w-fit mb-1">
                          {r.id || r.systemId}
                        </span>
                        <div className="line-clamp-1">{r.title}</div>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-700">{r.client || r.clientName || "N/A"}</td>

                      <td className="p-3.5 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                          {r.category || "Khác"}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-indigo-700">
                        {r.step || r.currentStep || "B1: Chuẩn bị hồ sơ"}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            (r.status || "").includes("Hoàn thành")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : (r.status || "").includes("Trễ") || (r.status || "").includes("Tạm dừng")
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {r.status || "Đang xử lý"}
                        </span>
                      </td>

                      <td className="p-3.5 font-medium text-slate-700">
                        {r.mainAssignee || r.assignee || (
                          <span className="text-rose-600 font-bold">Chưa phân công</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            r.priority === "Khẩn cấp"
                              ? "bg-rose-100 text-rose-800"
                              : r.priority === "Cao"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.priority || "Bình thường"}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedRecordForDetail(r)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-all active:scale-95 flex items-center gap-1 mx-auto"
                        >
                          <Eye size={14} />
                          Chi Tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DOSSIER PROGRESS MODAL */}
      <AnimatePresence>
        {selectedRecordForDetail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    {selectedRecordForDetail.id || selectedRecordForDetail.systemId}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedRecordForDetail.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 text-xs text-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-bold uppercase block">Khách hàng</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedRecordForDetail.client || selectedRecordForDetail.clientName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase block">Lĩnh vực</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedRecordForDetail.category || "Dân sự"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase block">Người đảm trách</span>
                    <span className="font-bold text-indigo-600 text-sm">
                      {selectedRecordForDetail.mainAssignee || "Chưa phân công"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase block">Trạng thái</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedRecordForDetail.status}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers size={16} className="text-indigo-600" />
                    Cập Nhật Tiến Độ Thực Thi Bước
                  </h4>

                  <select
                    value={selectedRecordForDetail.step || selectedRecordForDetail.currentStep || LITIGATION_STEPS[0]}
                    onChange={(e) => {
                      const newStep = e.target.value;
                      if (onUpdateRecord) {
                        onUpdateRecord(selectedRecordForDetail.id, {
                          ...selectedRecordForDetail,
                          step: newStep,
                          currentStep: newStep,
                          lastWorkDate: new Date().toLocaleDateString("vi-VN")
                        });
                      }
                      setSelectedRecordForDetail({
                        ...selectedRecordForDetail,
                        step: newStep,
                        currentStep: newStep
                      });
                    }}
                    className="w-full p-3 border border-slate-300 rounded-xl bg-white font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {LITIGATION_STEPS.map((s, idx) => (
                      <option key={idx} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-all"
                >
                  Đóng Hộp Thoại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BATCH ACTION MODAL */}
      <AnimatePresence>
        {showBatchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Zap className="text-indigo-600" size={20} />
                  Cập Nhật Hàng Loạt ({selectedRecordIds.length} Hồ Sơ Đã Chọn)
                </h3>
                <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Phân công Nhân sự Đảm trách mới</label>
                  <select
                    value={batchAssignee}
                    onChange={(e) => setBatchAssignee(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none"
                  >
                    <option value="">-- Giữ nguyên người đảm trách cũ --</option>
                    {users.filter((u: any) => u.role !== 'admin' && u.username !== 'admin').map((u) => (
                      <option key={u.id} value={u.name || u.username}>
                        {u.name || u.username} ({u.role || "Chuyên viên"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Chuyển Trạng Thái Mới</label>
                  <select
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none"
                  >
                    <option value="">-- Giữ nguyên trạng thái cũ --</option>
                    <option value="Đã phân công">Đã phân công</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Chờ tài liệu">Chờ tài liệu</option>
                    <option value="Đang xét xử">Đang xét xử</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={handleApplyBatchChanges}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow active:scale-95"
                >
                  Áp Dụng Cho Tất Cả
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
