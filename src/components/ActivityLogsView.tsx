import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Activity,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  PlusCircle,
  Edit3,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  User,
  ExternalLink,
  ChevronDown,
  X,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowUpDown,
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react";
import { io as socketIo } from "socket.io-client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ActivityLogItem {
  id: string;
  user: string;
  performedBy: string;
  role?: string;
  action: string;
  entityType: string;
  entityId: string;
  performedAt: string;
  time: string;
  reason?: string;
  result: string;
  details?: any;
}

interface ActivityLogsViewProps {
  user?: any;
  language?: string;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({
  user,
  language = "vi",
  onClose,
  isEmbedded = false
}) => {
  const isVi = language === "vi";

  // State
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterAction, setFilterAction] = useState<"all" | "create" | "update" | "delete" | "restore">("all");
  const [filterDateRange, setFilterDateRange] = useState<"all" | "today" | "7d" | "30d">("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState<boolean>(false);
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState({
    total: 0,
    creations: 0,
    modifications: 0,
    deletions: 0,
    restorations: 0
  });

  // Modal print view
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Fetch data
  const fetchLogs = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (filterAction !== "all") params.append("action", filterAction);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      params.append("limit", "400");

      // Calculate date filters
      if (filterDateRange === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.append("from", today.toISOString());
      } else if (filterDateRange === "7d") {
        const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.append("from", d7.toISOString());
      } else if (filterDateRange === "30d") {
        const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        params.append("from", d30.toISOString());
      }

      const res = await fetch(`/api/system/activity-logs?${params.toString()}`, {
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        // Fallback to legacy /api/audit-logs
        const fallbackRes = await fetch("/api/audit-logs");
        if (fallbackRes.ok) {
          const raw = await fallbackRes.json();
          const normalized: ActivityLogItem[] = raw.map((r: any) => {
            let details = {};
            try {
              details = typeof r.details === "string" ? JSON.parse(r.details) : r.details || {};
            } catch (e) {}
            return {
              id: String(r.id || Math.random()),
              user: r.user || r.performedBy || "Quản trị viên",
              performedBy: r.performedBy || r.user || "Quản trị viên",
              action: r.action || "UPDATE_RECORD",
              entityType: r.entityType || "erp_records",
              entityId: r.entityId || "",
              performedAt: r.performedAt || r.time || new Date().toISOString(),
              time: r.time || r.performedAt || new Date().toISOString(),
              reason: r.reason || "",
              result: r.result || "SUCCESS",
              details
            };
          });
          setLogs(normalized);
          calculateMetrics(normalized);
        }
        return;
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
        if (json.metrics) {
          setMetrics(json.metrics);
        } else {
          calculateMetrics(json.data);
        }
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateMetrics = (data: ActivityLogItem[]) => {
    let c = 0, u = 0, d = 0, r = 0;
    data.forEach((item) => {
      const act = (item.action || "").toUpperCase();
      if (act.includes("CREATE") || act.includes("TẠO")) c++;
      else if (act.includes("UPDATE") || act.includes("CẬP NHẬT") || act.includes("SỬA")) u++;
      else if (act.includes("DELETE") || act.includes("XÓA")) d++;
      else if (act.includes("RESTORE") || act.includes("KHÔI PHỤC")) r++;
    });
    setMetrics({
      total: data.length,
      creations: c,
      modifications: u,
      deletions: d,
      restorations: r
    });
  };

  // Initial load
  useEffect(() => {
    fetchLogs(true);
  }, [filterAction, filterDateRange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real-time socket listener
  useEffect(() => {
    let s: any = null;
    try {
      s = socketIo();
      s.on("connect", () => {
        setLiveConnected(true);
      });

      s.on("disconnect", () => {
        setLiveConnected(false);
      });

      // Handler for incoming activity log
      const handleNewActivity = (newLog: ActivityLogItem) => {
        if (!newLog || !newLog.id) return;
        setLogs((prev) => {
          // Avoid duplicate entries
          if (prev.some((item) => item.id === newLog.id)) {
            return prev;
          }
          const updated = [newLog, ...prev];
          calculateMetrics(updated);
          return updated;
        });

        // Add highlight
        setNewLogIds((prev) => {
          const next = new Set(prev);
          next.add(newLog.id);
          return next;
        });

        // Fade out highlight after 4 seconds
        setTimeout(() => {
          setNewLogIds((prev) => {
            const next = new Set(prev);
            next.delete(newLog.id);
            return next;
          });
        }, 4000);
      };

      s.on("activity_log_created", handleNewActivity);
      s.on("audit_log_created", (payload: any) => {
        if (payload && payload.id) handleNewActivity(payload);
        else fetchLogs(false);
      });

      s.on("erp_record_updated", (payload: any) => {
        // If no direct audit log payload arrived, re-fetch to get newest backend logs
        setTimeout(() => fetchLogs(false), 500);
      });

      s.on("erp_record_deleted", () => {
        setTimeout(() => fetchLogs(false), 500);
      });

      s.on("erp_record_restored", () => {
        setTimeout(() => fetchLogs(false), 500);
      });
    } catch (e) {
      console.warn("Socket connection failed in ActivityLogsView:", e);
    }

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  // Filtered logs by user
  const displayedLogs = useMemo(() => {
    if (filterUser === "all") return logs;
    return logs.filter(
      (item) => (item.user || item.performedBy || "").toLowerCase() === filterUser.toLowerCase()
    );
  }, [logs, filterUser]);

  // Unique users list for dropdown
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((item) => {
      const u = item.user || item.performedBy;
      if (u) set.add(u);
    });
    return Array.from(set);
  }, [logs]);

  // Format date helper
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString(isVi ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  // Relative time helper
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return isVi ? "Vừa xong" : "Just now";
      if (diffMins < 60) return `${diffMins} ${isVi ? "phút trước" : "mins ago"}`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ${isVi ? "giờ trước" : "hours ago"}`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ${isVi ? "ngày trước" : "days ago"}`;
    } catch (e) {
      return "";
    }
  };

  // Get action category styling
  const getActionBadge = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("CREATE") || act.includes("TẠO")) {
      return {
        label: isVi ? "Tạo mới hồ sơ" : "Record Created",
        icon: <PlusCircle size={14} className="text-emerald-600" />,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200"
      };
    }
    if (act.includes("UPDATE") || act.includes("CẬP NHẬT") || act.includes("SỬA")) {
      return {
        label: isVi ? "Chỉnh sửa / Cập nhật" : "Record Modified",
        icon: <Edit3 size={14} className="text-amber-600" />,
        className: "bg-amber-50 text-amber-700 border-amber-200"
      };
    }
    if (act.includes("RESTORE") || act.includes("KHÔI PHỤC")) {
      return {
        label: isVi ? "Khôi phục hồ sơ" : "Record Restored",
        icon: <RotateCcw size={14} className="text-blue-600" />,
        className: "bg-blue-50 text-blue-700 border-blue-200"
      };
    }
    if (act.includes("PERMANENT") || act.includes("VĨNH VIỄN")) {
      return {
        label: isVi ? "Xóa vĩnh viễn" : "Permanent Delete",
        icon: <Trash2 size={14} className="text-purple-600" />,
        className: "bg-purple-50 text-purple-700 border-purple-200"
      };
    }
    if (act.includes("DELETE") || act.includes("XÓA")) {
      return {
        label: isVi ? "Xóa vào thùng rác" : "Record Deleted",
        icon: <Trash2 size={14} className="text-rose-600" />,
        className: "bg-rose-50 text-rose-700 border-rose-200"
      };
    }
    return {
      label: action,
      icon: <Activity size={14} className="text-slate-600" />,
      className: "bg-slate-50 text-slate-700 border-slate-200"
    };
  };

  // Copy entity ID helper
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // -------------------------------------------------------------
  // EXPORT TO CSV
  // -------------------------------------------------------------
  const exportToCsv = () => {
    if (displayedLogs.length === 0) return;

    // Headers with clear Vietnamese names
    const headers = [
      "Mã nhật ký (Log ID)",
      "Thời gian (Timestamp)",
      "Người thực hiện (User)",
      "Vai trò (Role)",
      "Hành động (Action)",
      "Loại đối tượng (Entity Type)",
      "Mã hồ sơ (Record ID)",
      "Tiêu đề hồ sơ (Case Title)",
      "Khách hàng (Client)",
      "Lý do / Thay đổi (Reason / Details)",
      "Kết quả (Result)"
    ];

    const rows = displayedLogs.map((log) => {
      const details = log.details || {};
      const caseTitle = details.title || details.name || "";
      const client = details.client || "";
      const changed = Array.isArray(details.changedFields)
        ? details.changedFields.join("; ")
        : log.reason || "";

      return [
        `"${(log.id || "").replace(/"/g, '""')}"`,
        `"${formatDateTime(log.performedAt || log.time)}"`,
        `"${(log.user || log.performedBy || "").replace(/"/g, '""')}"`,
        `"${(log.role || "staff").replace(/"/g, '""')}"`,
        `"${(log.action || "").replace(/"/g, '""')}"`,
        `"${(log.entityType || "erp_records").replace(/"/g, '""')}"`,
        `"${(log.entityId || "").replace(/"/g, '""')}"`,
        `"${caseTitle.replace(/"/g, '""')}"`,
        `"${client.replace(/"/g, '""')}"`,
        `"${changed.replace(/"/g, '""')}"`,
        `"${(log.result || "SUCCESS").replace(/"/g, '""')}"`
      ].join(",");
    });

    // Add UTF-8 BOM so Excel opens Vietnamese characters cleanly
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    link.setAttribute("href", url);
    link.setAttribute("download", `nhat-ky-hoat-dong-erp-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // EXPORT TO PDF
  // -------------------------------------------------------------
  const exportToPdf = () => {
    if (displayedLogs.length === 0) return;

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const todayStr = new Date().toLocaleDateString("vi-VN");
      const timeStr = new Date().toLocaleTimeString("vi-VN");

      // Header Banner
      doc.setFillColor(15, 23, 42); // Dark slate
      doc.rect(0, 0, 297, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CONG TY LUAT HOP DANH ANH DUONG - ANH DUONG LAW FIRM", 14, 11);

      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.text("HE THONG QUAN TRI ERP & AUDIT TRAIL - BAO CAO NHAT KY HOAT DONG HE THONG", 14, 18);

      // Metadata Box
      doc.setTextColor(30, 41, 59);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text("BAO CAO KIEM SOAT & TRUY VET HOAT DONG (ACTIVITY LOGS AUDIT REPORT)", 14, 32);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Ngay xuat bao cao: ${todayStr} ${timeStr}`, 14, 38);
      doc.text(`Nguoi xuat: ${user?.name || "Quan tri vien he thong"} (${user?.role || "admin"})`, 14, 43);
      doc.text(`Tong so ban ghi: ${displayedLogs.length} thao tac (Tao moi: ${metrics.creations} | Chinh sua: ${metrics.modifications} | Xoa: ${metrics.deletions})`, 14, 48);

      // Table preparation
      const headers = [
        [
          "STT",
          "Thoi gian",
          "Nguoi thuc hien",
          "Hanh dong",
          "Ma ho so / Doi tuong",
          "Tieu de / Khach hang",
          "Ghi chu / Thay doi",
          "Ket qua"
        ]
      ];

      const body = displayedLogs.map((log, index) => {
        const details = log.details || {};
        const titleClient = [details.title || "", details.client ? `KH: ${details.client}` : ""]
          .filter(Boolean)
          .join(" | ");
        const changed = Array.isArray(details.changedFields)
          ? details.changedFields.join("; ")
          : log.reason || "";

        // Simplify action label for clean print
        const actBadge = getActionBadge(log.action);

        return [
          String(index + 1),
          formatDateTime(log.performedAt || log.time),
          log.user || log.performedBy || "System",
          actBadge.label,
          log.entityId || "--",
          titleClient || "--",
          changed || "--",
          log.result || "SUCCESS"
        ];
      });

      autoTable(doc, {
        startY: 52,
        head: headers,
        body: body,
        theme: "striped",
        styles: {
          fontSize: 7.5,
          font: "Helvetica",
          cellPadding: 2
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold"
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 32 },
          2: { cellWidth: 30 },
          3: { cellWidth: 32 },
          4: { cellWidth: 34 },
          5: { cellWidth: 55 },
          6: { cellWidth: 55 },
          7: { cellWidth: 18, halign: "center" }
        },
        margin: { left: 14, right: 14 }
      });

      // Footer Signatures
      const finalY = (doc as any).lastAutoTable?.finalY || 180;
      if (finalY < 165) {
        doc.setFontSize(8.5);
        doc.setFont("Helvetica", "bold");
        doc.text("NGUOI LAP BAO CAO", 40, finalY + 14);
        doc.text("BAN KIEM SOAT / GIAM DOC", 210, finalY + 14);
        doc.setFont("Helvetica", "normal");
        doc.text("(Ky va ghi ro ho ten)", 42, finalY + 19);
        doc.text("(Ky, dong dau xac nhan)", 212, finalY + 19);
      }

      const timestamp = new Date().toISOString().split("T")[0];
      doc.save(`Bao_Cao_Nhat_Ky_Hoat_Dong_ERP_${timestamp}.pdf`);
    } catch (pdfErr) {
      console.error("PDF generation error, opening printable compliance view:", pdfErr);
      setIsPrintModalOpen(true);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 ${isEmbedded ? "p-0" : "p-4 md:p-6"}`}>
      {/* Top Header & Real-time Status */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <Activity size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-800 font-serif">
                    {isVi ? "Nhật ký Hoạt động (Activity Logs)" : "Activity Logs"}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      liveConnected
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        : "bg-slate-100 text-slate-600 border border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        liveConnected ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                      }`}
                    />
                    {liveConnected ? (isVi ? "Thời gian thực" : "Live Stream") : (isVi ? "Đang kết nối" : "Connecting")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isVi
                    ? "Giám sát thời gian thực mọi thao tác tạo mới, chỉnh sửa và xóa hồ sơ trên hệ thống ERP nhằm bảo đảm trách nhiệm giải trình."
                    : "Real-time audit trail of record creations, modifications, and deletions for compliance & accountability."}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Refresh, CSV Export, PDF Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchLogs(false)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 shadow-sm"
              title={isVi ? "Tải lại nhật ký mới nhất" : "Refresh logs"}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
              <span>{isVi ? "Làm mới" : "Refresh"}</span>
            </button>

            <button
              onClick={exportToCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition active:scale-95 shadow-sm"
              title={isVi ? "Xuất dữ liệu bảng sang file CSV Excel" : "Export to CSV"}
            >
              <FileSpreadsheet size={14} />
              <span>{isVi ? "Xuất CSV" : "Export CSV"}</span>
            </button>

            <button
              onClick={exportToPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition active:scale-95 shadow-sm"
              title={isVi ? "Xuất báo cáo tuân thủ PDF chính thức" : "Export Compliance PDF"}
            >
              <Download size={14} />
              <span>{isVi ? "Xuất PDF" : "Export PDF"}</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition active:scale-95 shadow-sm"
              title={isVi ? "In trực tiếp hoặc xem bản in PDF Tiếng Việt chuẩn" : "Printable Document"}
            >
              <Printer size={14} />
              <span>{isVi ? "In báo cáo" : "Print"}</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {isVi ? "Tổng thao tác" : "Total Actions"}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-slate-800">{metrics.total}</span>
              <Layers size={16} className="text-slate-400" />
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-lg p-3 border border-emerald-200/60">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              {isVi ? "Tạo mới hồ sơ" : "Creations"}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-emerald-800">{metrics.creations}</span>
              <PlusCircle size={16} className="text-emerald-500" />
            </div>
          </div>

          <div className="bg-amber-50/70 rounded-lg p-3 border border-amber-200/60">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              {isVi ? "Chỉnh sửa / Cập nhật" : "Modifications"}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-amber-800">{metrics.modifications}</span>
              <Edit3 size={16} className="text-amber-500" />
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-lg p-3 border border-rose-200/60">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
              {isVi ? "Xóa hồ sơ" : "Deletions"}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-rose-800">{metrics.deletions}</span>
              <Trash2 size={16} className="text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isVi
                  ? "Tìm kiếm theo người dùng, mã hồ sơ, tên vụ việc, khách hàng, lý do..."
                  : "Search by user, record ID, case name, client, reason..."
              }
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterAction("all")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                filterAction === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isVi ? "Tất cả" : "All"}
            </button>
            <button
              onClick={() => setFilterAction("create")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                filterAction === "create"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <PlusCircle size={12} />
              {isVi ? "Tạo mới" : "Create"}
            </button>
            <button
              onClick={() => setFilterAction("update")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                filterAction === "update"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Edit3 size={12} />
              {isVi ? "Chỉnh sửa" : "Update"}
            </button>
            <button
              onClick={() => setFilterAction("delete")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                filterAction === "delete"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <Trash2 size={12} />
              {isVi ? "Xóa" : "Delete"}
            </button>
            <button
              onClick={() => setFilterAction("restore")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                filterAction === "restore"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <RotateCcw size={12} />
              {isVi ? "Khôi phục" : "Restore"}
            </button>
          </div>

          {/* Time & User Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={filterDateRange}
              onChange={(e: any) => setFilterDateRange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">{isVi ? "Mọi thời gian" : "All time"}</option>
              <option value="today">{isVi ? "Hôm nay" : "Today"}</option>
              <option value="7d">{isVi ? "7 ngày qua" : "Last 7 days"}</option>
              <option value="30d">{isVi ? "30 ngày qua" : "Last 30 days"}</option>
            </select>

            <select
              value={filterUser}
              onChange={(e: any) => setFilterUser(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[150px] truncate"
            >
              <option value="all">{isVi ? "Mọi nhân sự" : "All users"}</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Real-time Activity Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] whitespace-nowrap">
                  {isVi ? "Thời gian" : "Timestamp"}
                </th>
                <th className="py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] whitespace-nowrap">
                  {isVi ? "Người thực hiện" : "User"}
                </th>
                <th className="py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] whitespace-nowrap">
                  {isVi ? "Hành động" : "Action"}
                </th>
                <th className="py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] whitespace-nowrap">
                  {isVi ? "Mã hồ sơ / Đối tượng" : "Record / Entity ID"}
                </th>
                <th className="py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                  {isVi ? "Chi tiết thao tác" : "Details / Changes"}
                </th>
                <th className="py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] whitespace-nowrap text-center">
                  {isVi ? "Trạng thái" : "Status"}
                </th>
                <th className="py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] whitespace-nowrap text-right">
                  {isVi ? "Thao tác" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                    <span>{isVi ? "Đang tải nhật ký hoạt động..." : "Loading activity logs..."}</span>
                  </td>
                </tr>
              ) : displayedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">
                      {isVi ? "Không tìm thấy hoạt động nào phù hợp" : "No activity logs found"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isVi
                        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem các bản ghi khác."
                        : "Try adjusting your filters or search keywords."}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const isRecentlyAdded = newLogIds.has(log.id);
                  const details = log.details || {};
                  const title = details.title || details.name || "";
                  const client = details.client || "";

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                        isRecentlyAdded ? "bg-emerald-50/70 animate-pulse" : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">
                            {formatDateTime(log.performedAt || log.time)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {getRelativeTime(log.performedAt || log.time)}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {(log.user || log.performedBy || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {log.user || log.performedBy || "Quản trị viên"}
                            </div>
                            <span className="inline-block text-[10px] text-slate-500 font-mono">
                              {log.role || "staff"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.className}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Record / Entity ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.entityId ? (
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {log.entityId}
                            </span>
                            <button
                              onClick={(e) => handleCopyId(log.entityId, e)}
                              className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition p-1"
                              title={isVi ? "Sao chép mã" : "Copy ID"}
                            >
                              {copiedId === log.entityId ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">--</span>
                        )}
                      </td>

                      {/* Details / Summary */}
                      <td className="py-3 px-4 max-w-md">
                        <div className="flex flex-col gap-0.5">
                          {title && (
                            <div className="font-medium text-slate-800 truncate" title={title}>
                              {title}
                            </div>
                          )}
                          {client && (
                            <div className="text-[11px] text-slate-500">
                              <span className="text-slate-400 font-normal">Khách hàng:</span>{" "}
                              <span className="font-medium text-slate-700">{client}</span>
                            </div>
                          )}
                          {Array.isArray(details.changedFields) && details.changedFields.length > 0 && (
                            <div className="text-[10px] text-blue-700 font-mono line-clamp-1 bg-blue-50/50 p-1 rounded">
                              {details.changedFields.join(" | ")}
                            </div>
                          )}
                          {!title && log.reason && (
                            <div className="text-slate-600 text-xs italic line-clamp-1">
                              {log.reason}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            log.result === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {log.result === "SUCCESS" ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          <span>{log.result === "SUCCESS" ? (isVi ? "Thành công" : "Success") : (isVi ? "Thất bại" : "Failed")}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md font-medium transition"
                        >
                          {isVi ? "Chi tiết" : "View"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            {isVi
              ? `Hiển thị ${displayedLogs.length} bản ghi nhật ký`
              : `Showing ${displayedLogs.length} activity entries`}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>{isVi ? "Kiểm toán tự động lưu trữ vĩnh viễn" : "Audit trail permanently preserved"}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DETAILS MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-serif">
                    {isVi ? "Chi tiết Nhật ký Thao tác" : "Activity Log Details"}
                  </h3>
                  <p className="text-xs text-slate-500">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    {isVi ? "Người thực hiện" : "Performed By"}
                  </span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {selectedLog.user || selectedLog.performedBy}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Role: {selectedLog.role || "staff"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    {isVi ? "Thời gian thao tác" : "Timestamp"}
                  </span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {formatDateTime(selectedLog.performedAt || selectedLog.time)}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {getRelativeTime(selectedLog.performedAt || selectedLog.time)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    {isVi ? "Hành động thực hiện" : "Action Performed"}
                  </span>
                  <div className="font-mono text-sm font-bold text-blue-700 mt-0.5">
                    {selectedLog.action}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Entity: {selectedLog.entityType || "erp_records"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    {isVi ? "Mã hồ sơ / Đối tượng" : "Entity / Case ID"}
                  </span>
                  <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">
                    {selectedLog.entityId || "--"}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Result: {selectedLog.result}
                  </span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-lg">
                  <span className="text-[11px] font-bold text-amber-800 block uppercase">
                    {isVi ? "Lý do / Mục đích thao tác" : "Reason / Justification"}
                  </span>
                  <p className="text-amber-900 mt-1">{selectedLog.reason}</p>
                </div>
              )}

              {/* Raw Details / JSON Payload */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block uppercase mb-1.5">
                  {isVi ? "Dữ liệu đối tượng & Thay đổi chi tiết (Audit Payload)" : "Audit Payload & Field Diffs"}
                </span>
                <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed custom-scrollbar">
                  {typeof selectedLog.details === "object"
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : selectedLog.details || "{}"}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition"
              >
                {isVi ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PRINTABLE COMPLIANCE VIEW MODAL (WITH FULL VIETNAMESE ACCENTS) */}
      {/* ------------------------------------------------------------- */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Top Bar */}
            <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-800 text-sm">
                {isVi ? "Xem trước Bản in Báo cáo Tuân thủ (Print Preview)" : "Print Preview"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  <Printer size={14} />
                  <span>{isVi ? "In ngay (Print/Save PDF)" : "Print Now"}</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Paper Canvas */}
            <div className="p-8 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:m-0">
              {/* Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-bold tracking-wider uppercase text-slate-900">
                      CÔNG TY LUẬT HỢP DANH ÁNH DƯƠNG
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Đoàn Luật sư TP. Hà Nội / TP. Hồ Chí Minh
                    </p>
                    <p className="text-xs text-slate-500">
                      Website: anhduonglaw.vn | Hotline: 098.1122.334
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      MÃ BÁO CÁO: AD-AUDIT-{new Date().getFullYear()}
                    </span>
                    <span className="text-xs text-slate-500">
                      Hệ thống quản trị ERP Ánh Dương
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Title */}
              <div className="text-center my-6">
                <h1 className="text-xl font-extrabold uppercase font-serif text-slate-900 tracking-wide">
                  BÁO CÁO NHẬT KÝ HOẠT ĐỘNG VÀ KIỂM SOÁT HỆ THỐNG
                </h1>
                <p className="text-xs text-slate-600 italic mt-1">
                  (Truy vết tạo mới, chỉnh sửa và xóa hồ sơ phục vụ trách nhiệm giải trình & tuân thủ)
                </p>
              </div>

              {/* Metadata */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-6 grid grid-cols-2 gap-2">
                <div>
                  <strong>Thời gian trích xuất:</strong>{" "}
                  {new Date().toLocaleString("vi-VN")}
                </div>
                <div>
                  <strong>Người tạo báo cáo:</strong>{" "}
                  {user?.name || "Quản trị viên"} ({user?.role || "admin"})
                </div>
                <div>
                  <strong>Phạm vi trích xuất:</strong> {displayedLogs.length} bản ghi
                </div>
                <div>
                  <strong>Tổng quan số liệu:</strong> Tạo mới: {metrics.creations} | Chỉnh sửa: {metrics.modifications} | Xóa: {metrics.deletions}
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-xs border-collapse border border-slate-300 mb-8">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 p-2 text-center w-10">STT</th>
                    <th className="border border-slate-300 p-2 text-left w-32">Thời gian</th>
                    <th className="border border-slate-300 p-2 text-left w-28">Người thực hiện</th>
                    <th className="border border-slate-300 p-2 text-left w-28">Hành động</th>
                    <th className="border border-slate-300 p-2 text-left w-28">Mã hồ sơ</th>
                    <th className="border border-slate-300 p-2 text-left">Nội dung / Thay đổi</th>
                    <th className="border border-slate-300 p-2 text-center w-16">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map((log, index) => {
                    const badge = getActionBadge(log.action);
                    const details = log.details || {};
                    const title = details.title || details.name || "";
                    const client = details.client ? `[KH: ${details.client}]` : "";
                    const changed = Array.isArray(details.changedFields)
                      ? details.changedFields.join("; ")
                      : log.reason || "";

                    return (
                      <tr key={log.id} className={index % 2 === 1 ? "bg-slate-50/50" : ""}>
                        <td className="border border-slate-300 p-2 text-center">{index + 1}</td>
                        <td className="border border-slate-300 p-2 whitespace-nowrap">
                          {formatDateTime(log.performedAt || log.time)}
                        </td>
                        <td className="border border-slate-300 p-2 font-medium">
                          {log.user || log.performedBy}
                        </td>
                        <td className="border border-slate-300 p-2">{badge.label}</td>
                        <td className="border border-slate-300 p-2 font-mono text-[11px]">
                          {log.entityId || "--"}
                        </td>
                        <td className="border border-slate-300 p-2">
                          <div className="font-medium text-slate-800">{title} {client}</div>
                          {changed && <div className="text-slate-500 text-[11px] mt-0.5">{changed}</div>}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-emerald-700">
                          {log.result || "SUCCESS"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Sign-off Blocks */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12 pt-4">
                <div>
                  <p className="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</p>
                  <p className="text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                  <div className="h-24" />
                  <p className="font-semibold text-slate-800">{user?.name || "Quản trị viên"}</p>
                </div>
                <div>
                  <p className="font-bold uppercase">BAN KIỂM SOÁT / GIÁM ĐỐC ĐIỀU HÀNH</p>
                  <p className="text-slate-500 italic mt-0.5">(Ký, đóng dấu xác nhận)</p>
                  <div className="h-24" />
                  <p className="font-semibold text-slate-800">CÔNG TY LUẬT HỢP DANH ÁNH DƯƠNG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsView;
