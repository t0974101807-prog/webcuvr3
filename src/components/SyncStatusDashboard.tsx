import React, { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  Cloud, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpFromLine, 
  ArrowDownToLine, 
  User, 
  FileText, 
  Sliders, 
  Check, 
  X, 
  AlertCircle, 
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { fetchApi } from "../utils/api";

interface SyncStatusDashboardProps {
  language: "vi" | "en";
  user?: any;
}

export const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({ language, user }) => {
  const isVi = language === "vi";
  const [syncData, setSyncData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "cases" | "clients" | "conflicts">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Advanced Filter states
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");
  const [filterUserRole, setFilterUserRole] = useState<string>("all");
  const [filterEventType, setFilterEventType] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true); // Start visible for easier discovery

  // Helper to extract and normalize record date
  const getRecordDate = (item: any): Date | null => {
    let dateStr = item.lastSyncTime || item.localState?.date || item.remoteState?.date || item.localState?.createdAt || item.remoteState?.createdAt;
    if (!dateStr) return null;
    
    // Normalize format like "DD/MM/YYYY" to Date object
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Helper to match associated user role from record assignees or attributes
  const getRecordUserRole = (item: any): string => {
    const localAssignee = item.localState?.mainAssignee || item.localState?.createdBy || item.localState?.manager || "";
    const remoteAssignee = item.remoteState?.mainAssignee || item.remoteState?.createdBy || item.remoteState?.manager || "";
    const assigneeName = (localAssignee || remoteAssignee || "").toLowerCase();
    
    if (!assigneeName) return "lawyer"; // Default fallback if none is found
    
    if (assigneeName.includes("quản trị") || assigneeName.includes("admin") || assigneeName.includes("qtv")) {
      return "admin";
    }
    if (assigneeName.includes("nam") || assigneeName.includes("giám đốc") || assigneeName.includes("director")) {
      return "director";
    }
    if (assigneeName.includes("phó giám đốc") || assigneeName.includes("deputy")) {
      return "deputy_director";
    }
    if (assigneeName.includes("trưởng phòng") || assigneeName.includes("head")) {
      return "head_of_department";
    }
    if (assigneeName.includes("bình") || assigneeName.includes("quản lý") || assigneeName.includes("manager")) {
      return "manager";
    }
    if (assigneeName.includes("kiểm soát chất lượng") || assigneeName.includes("prosecutor") || assigneeName.includes("thông")) {
      return "prosecutor";
    }
    if (assigneeName.includes("kiểm soát viên") || assigneeName.includes("controller") || assigneeName.includes("phong")) {
      return "controller";
    }
    if (assigneeName.includes("dung") || assigneeName.includes("chuyên viên") || assigneeName.includes("specialist")) {
      return "specialist";
    }
    if (assigneeName.includes("thủy") || assigneeName.includes("trợ lý") || assigneeName.includes("assistant") || assigneeName.includes("associate")) {
      return "legal_associate";
    }
    if (assigneeName.includes("mai") || assigneeName.includes("quân") || assigneeName.includes("hùng") || assigneeName.includes("cường") || assigneeName.includes("anh") || assigneeName.includes("lâm") || assigneeName.includes("luật sư") || assigneeName.includes("lawyer")) {
      return "lawyer";
    }
    return "lawyer";
  };

  // Fetch sync audit results from backend
  const fetchSyncData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchApi("/api/system/sync-audit");
      const json = await response.json();
      if (json && json.success) {
        setSyncData(json.data || []);
      } else {
        setError(json.error || (isVi ? "Không thể tải dữ liệu đối soát đồng bộ." : "Failed to fetch sync audit data."));
      }
    } catch (err) {
      console.error("Error fetching sync data:", err);
      setError(isVi ? "Lỗi kết nối máy chủ dữ liệu." : "Server communication error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, []);

  // Handle manual sync override / overwrite actions
  const handleSyncOverride = async (id: string, tableName: string, direction: "push" | "pull") => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetchApi("/api/system/sync-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, tableName, direction })
      });
      const json = await res.json();
      if (json && json.success) {
        setSuccessMsg(
          isVi 
            ? `Giải quyết xung đột thành công! Đã ghi đè dữ liệu ${direction === "push" ? "lên Đám mây (Cloud)" : "xuống Cục bộ (Local)"} cho bản ghi ID ${id}.` 
            : `Conflict successfully resolved! Overwrote ${direction === "push" ? "cloud remote state" : "local SQLite state"} for ID ${id}.`
        );
        // Clear message after 4 seconds
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchSyncData();
      } else {
        setError(json.error || (isVi ? "Thao tác đồng bộ thất bại." : "Sync override failed."));
      }
    } catch (err: any) {
      setError(isVi ? "Lỗi kết nối khi gửi yêu cầu đồng bộ." : "Sync override connection error.");
    }
  };

  // Perform a full automatic resolution for all conflicts
  const handleAutoResolveAll = async () => {
    const conflicts = syncData.filter(item => item.status === "conflict");
    if (conflicts.length === 0) return;

    setIsSyncingAll(true);
    setError(null);
    setSuccessMsg(null);
    let resolvedCount = 0;

    try {
      // For safety, let's overwrite Cloud with Local (standard "push" model)
      for (const item of conflicts) {
        const res = await fetchApi("/api/system/sync-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, tableName: item.tableName, direction: "push" })
        });
        const json = await res.json();
        if (json && json.success) {
          resolvedCount++;
        }
      }
      setSuccessMsg(
        isVi 
          ? `Đã tự động giải quyết thành công ${resolvedCount}/${conflicts.length} hồ sơ xung đột (Mặc định chọn bản ghi SQLite cục bộ làm chuẩn).` 
          : `Automatically resolved ${resolvedCount}/${conflicts.length} conflicting files (Local SQLite took precedence).`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
      fetchSyncData();
    } catch (err) {
      console.error(err);
      setError(isVi ? "Có lỗi xảy ra trong quá trình tự động giải quyết." : "An error occurred during auto resolution.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Perform a full automatic synchronization for all unsynced records
  const handleSyncAllOutstanding = async () => {
    const unsyncedItems = syncData.filter(item => item.status === "local_only" || item.status === "remote_only");
    if (unsyncedItems.length === 0) return;

    setIsSyncingAll(true);
    setError(null);
    setSuccessMsg(null);
    let resolvedCount = 0;

    try {
      for (const item of unsyncedItems) {
        const direction = item.status === "local_only" ? "push" : "pull";
        const res = await fetchApi("/api/system/sync-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, tableName: item.tableName, direction })
        });
        const json = await res.json();
        if (json && json.success) {
          resolvedCount++;
        }
      }
      setSuccessMsg(
        isVi 
          ? `Đã đồng bộ hóa thành công ${resolvedCount}/${unsyncedItems.length} hồ sơ chưa khớp giữa SQLite cục bộ và Đám mây.` 
          : `Successfully synchronized ${resolvedCount}/${unsyncedItems.length} unmatched files between Local SQLite and Cloud.`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
      fetchSyncData();
    } catch (err) {
      console.error(err);
      setError(isVi ? "Lỗi kết nối trong quá trình đồng bộ hàng loạt." : "Connection error during bulk synchronization.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Aggregate Client Profiles dynamically from the sync-audit data
  const clientProfiles = useMemo(() => {
    const clientsMap = new Map<string, {
      name: string;
      idCard: string;
      taxId: string;
      phone: string;
      tableName: string;
      recordsCount: number;
      status: "synced" | "conflict" | "local_only" | "remote_only";
      localState: any;
      remoteState: any;
      associatedIds: string[];
    }>();

    syncData.forEach(item => {
      const state = item.localState || item.remoteState;
      if (!state) return;

      // Extract client attributes
      const clientName = (state.client || state.name || "").trim();
      const idCard = (state.clientIdCard || state.clientId || "").trim();
      const taxId = (state.taxCode || state.taxId || "").trim();
      const phone = (state.clientPhone || "").trim();

      const uniqueKey = idCard || taxId || clientName;
      if (!uniqueKey) return;

      if (!clientsMap.has(uniqueKey)) {
        clientsMap.set(uniqueKey, {
          name: clientName,
          idCard: idCard,
          taxId: taxId,
          phone: phone,
          tableName: item.tableName,
          recordsCount: 0,
          status: "synced",
          localState: item.localState,
          remoteState: item.remoteState,
          associatedIds: []
        });
      }

      const existing = clientsMap.get(uniqueKey)!;
      existing.recordsCount += 1;
      existing.associatedIds.push(item.id);

      // If any of the associated cases has a conflict, mark the client profile as having conflict
      if (item.status === "conflict") {
        existing.status = "conflict";
      } else if (item.status === "local_only" && existing.status !== "conflict") {
        existing.status = "local_only";
      } else if (item.status === "remote_only" && existing.status !== "conflict" && existing.status !== "local_only") {
        existing.status = "remote_only";
      }
    });

    return Array.from(clientsMap.values());
  }, [syncData]);

  // Filtered synchronization records based on advanced filters
  const filteredSyncData = useMemo(() => {
    return syncData.filter(item => {
      // 1. Basic active tab filter (tab filters conflicts directly if on conflicts tab, otherwise all/cases)
      if (activeTab === "conflicts" && item.status !== "conflict") {
        return false;
      }
      
      // 2. Date Range Filter
      if (filterDateStart || filterDateEnd) {
        const itemDate = getRecordDate(item);
        if (itemDate) {
          if (filterDateStart) {
            const start = new Date(filterDateStart);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (filterDateEnd) {
            const end = new Date(filterDateEnd);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        } else {
          return false;
        }
      }
      
      // 3. User Role Filter
      if (filterUserRole !== "all") {
        const itemRole = getRecordUserRole(item);
        if (itemRole !== filterUserRole) return false;
      }
      
      // 4. Event Type Filter
      if (filterEventType !== "all") {
        if (filterEventType === "insert_local" && item.status !== "local_only") return false;
        if (filterEventType === "insert_remote" && item.status !== "remote_only") return false;
        if (filterEventType === "conflict" && item.status !== "conflict") return false;
        if (filterEventType === "synced" && item.status !== "synced") return false;
      }
      
      return true;
    });
  }, [syncData, activeTab, filterDateStart, filterDateEnd, filterUserRole, filterEventType]);

  // Filtered Client Profiles consistent with filtered sync data
  const filteredClientProfiles = useMemo(() => {
    const filteredRecordIds = new Set(filteredSyncData.map(item => item.id));
    return clientProfiles.filter(client => 
      client.associatedIds.some(id => filteredRecordIds.has(id))
    );
  }, [clientProfiles, filteredSyncData]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = syncData.length;
    const synced = syncData.filter(i => i.status === "synced").length;
    const conflicts = syncData.filter(i => i.status === "conflict").length;
    const localOnly = syncData.filter(i => i.status === "local_only").length;
    const remoteOnly = syncData.filter(i => i.status === "remote_only").length;
    const healthScore = total > 0 ? Math.round((synced / total) * 100) : 100;

    const totalClients = clientProfiles.length;
    const syncedClients = clientProfiles.filter(c => c.status === "synced").length;
    const conflictingClients = clientProfiles.filter(c => c.status === "conflict").length;

    return {
      total,
      synced,
      conflicts,
      localOnly,
      remoteOnly,
      healthScore,
      totalClients,
      syncedClients,
      conflictingClients
    };
  }, [syncData, clientProfiles]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Render Diff side-by-side details
  const renderDetailDiff = (item: any) => {
    const local = item.localState;
    const remote = item.remoteState;

    if (!local || !remote) return null;

    // Define keys we want to visually compare
    const keysToCompare = item.tableName === "cases" 
      ? [
          { key: "name", label: isVi ? "Tên vụ việc" : "Case Name" },
          { key: "client", label: isVi ? "Tên khách hàng" : "Client Name" },
          { key: "fee", label: isVi ? "Phí dịch vụ" : "Service Fee", format: (v: any) => v ? `${Number(v).toLocaleString()}đ` : "0đ" }
        ]
      : [
          { key: "title", label: isVi ? "Tiêu đề tài liệu" : "Document Title" },
          { key: "client", label: isVi ? "Khách hàng" : "Client" },
          { key: "status", label: isVi ? "Trạng thái hồ sơ" : "Dossier Status" },
          { key: "revenue", label: isVi ? "Phí/Doanh thu" : "Fee/Revenue", format: (v: any) => v ? `${Number(v).toLocaleString()}đ` : "0đ" },
          { key: "clientIdCard", label: isVi ? "Số CCCD" : "National ID" }
        ];

    return (
      <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
        <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
          <AlertTriangle size={13} className="text-rose-500" />
          <span>{isVi ? "So Sánh Chi Tiết Sai Lệch Thuộc Tính" : "Attribute Discrepancy Comparison"}</span>
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local SQLite database */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
            <div className="flex items-center gap-1.5 mb-3">
              <Database size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isVi ? "SQLite Cục bộ (Trạm cơ sở)" : "Local SQLite State"}
              </span>
            </div>

            <div className="space-y-2">
              {keysToCompare.map(({ key, label, format }) => {
                const localVal = local[key];
                const remoteVal = remote[key];
                const isDifferent = String(localVal) !== String(remoteVal);

                return (
                  <div key={key} className={`p-2 rounded-lg text-xs flex flex-col ${isDifferent ? "bg-amber-500/5 border border-amber-500/20" : "bg-slate-50/50 dark:bg-slate-950/25"}`}>
                    <span className="text-[10px] text-slate-400 font-extrabold">{label}</span>
                    <span className={`font-semibold mt-0.5 break-all ${isDifferent ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                      {format ? format(localVal) : String(localVal || "N/A")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remote Cloud Firestore */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
            <div className="flex items-center gap-1.5 mb-3">
              <Cloud size={14} className="text-indigo-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isVi ? "Firestore Đám mây (Đồng bộ Live)" : "Firestore Remote State"}
              </span>
            </div>

            <div className="space-y-2">
              {keysToCompare.map(({ key, label, format }) => {
                const localVal = local[key];
                const remoteVal = remote[key];
                const isDifferent = String(localVal) !== String(remoteVal);

                return (
                  <div key={key} className={`p-2 rounded-lg text-xs flex flex-col ${isDifferent ? "bg-rose-500/5 border border-rose-500/20" : "bg-slate-50/50 dark:bg-slate-950/25"}`}>
                    <span className="text-[10px] text-slate-400 font-extrabold">{label}</span>
                    <span className={`font-semibold mt-0.5 break-all ${isDifferent ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                      {format ? format(remoteVal) : String(remoteVal || "N/A")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Override Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
          <button
            onClick={() => handleSyncOverride(item.id, item.tableName, "push")}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <ArrowUpFromLine size={13} />
            <span>{isVi ? "Ghi đè Đám mây (Sử dụng dữ liệu Cục bộ)" : "Overwrite Cloud (Push Local)"}</span>
          </button>
          <button
            onClick={() => handleSyncOverride(item.id, item.tableName, "pull")}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <ArrowDownToLine size={13} />
            <span>{isVi ? "Ghi đè Cục bộ (Sử dụng dữ liệu Đám mây)" : "Overwrite Local (Pull Cloud)"}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12" id="sync-management-container">
      {/* Realtime Sync Status Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 text-white border border-slate-800 shadow-md">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isVi ? "HỆ THỐNG ĐỒNG BỘ REALTIME" : "REALTIME LIVE SYNC"}</span>
            </span>
            <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              SQLite ⇄ Firestore Cloud
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-white leading-tight">
            {isVi ? "Trung Tâm Đối Soát & Đồng Bộ Dữ Liệu" : "Data Reconciliation & Sync Center"}
          </h2>
          
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
            {isVi 
              ? "Giám sát trạng thái đồng bộ dữ liệu đa nền tảng giữa Cơ sở dữ liệu SQLite tại biên và Cloud Firestore. Phát hiện và xử lý tức thời các xung đột thuộc tính vụ việc hoặc hồ sơ khách hàng để đảm bảo tính toàn vẹn hệ thống." 
              : "Monitor dynamic sync states between edge SQLite & secure Cloud Firestore. Instantly identify case properties discrepancies or client profiles mismatches with point-in-time override resolutions."}
          </p>
        </div>
        
        {/* Large Decorative Sync Icon */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <Database size={240} className="text-white absolute right-10 top-1/2 -translate-y-1/2 rotate-12" />
        </div>
      </div>

      {/* Main Stats Widgets Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Health Score widget */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl ${stats.healthScore === 100 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"} shrink-0`}>
            <Database size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">
              {isVi ? "Độ tin cậy dữ liệu" : "Data Health Score"}
            </span>
            <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
              {stats.healthScore}%
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${stats.healthScore === 100 ? "bg-emerald-500" : "bg-amber-500"}`} 
                style={{ width: `${stats.healthScore}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Fully Synced Count widget */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">
              {isVi ? "Hồ sơ khớp hoàn toàn" : "Synced Records"}
            </span>
            <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
              {stats.synced}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              {isVi ? "Nội dung đồng bộ tuyệt đối" : "100% cloud matched"}
            </span>
          </div>
        </div>

        {/* Discrepancies / Conflicts widget */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl ${stats.conflicts > 0 ? "bg-rose-500/10 text-rose-500 animate-pulse" : "bg-slate-100 text-slate-400"} shrink-0`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">
              {isVi ? "Hồ sơ có xung đột" : "Conflicting State"}
            </span>
            <span className={`text-2xl font-black font-mono ${stats.conflicts > 0 ? "text-rose-500" : "text-slate-800 dark:text-slate-100"}`}>
              {stats.conflicts}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              {isVi ? "Phát hiện sai lệch thuộc tính" : "Requires manual override"}
            </span>
          </div>
        </div>

        {/* Local-only Pending backup widget */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <ArrowUpFromLine size={24} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400">
              {isVi ? "Hồ sơ chỉ có ở máy chủ" : "Local Only State"}
            </span>
            <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
              {stats.localOnly + stats.remoteOnly}
            </span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              {isVi ? "Chờ đồng bộ sao lưu" : "Awaiting sync lifecycle"}
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Feedback Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="space-y-6">
        {/* Filters and Control Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              <span>{isVi ? "Tất cả hồ sơ dữ liệu" : "All Documents"}</span>
              <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${activeTab === "all" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("clients")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "clients"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              <User size={13} />
              <span>{isVi ? "Hồ sơ Khách hàng" : "Client Profiles"}</span>
              <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${activeTab === "clients" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                {stats.totalClients}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("conflicts")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "conflicts"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600"
              }`}
            >
              <AlertTriangle size={13} className={stats.conflicts > 0 ? "text-rose-500" : ""} />
              <span>{isVi ? "Cần giải quyết xung đột" : "Required Conflicts"}</span>
              <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${activeTab === "conflicts" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                {stats.conflicts}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {stats.conflicts > 0 && (
              <button
                disabled={isSyncingAll}
                onClick={handleAutoResolveAll}
                className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 flex items-center gap-1.5 cursor-pointer transition"
                title={isVi ? "Tự động ghi đè tất cả xung đột bằng dữ liệu SQLite cục bộ làm chuẩn" : "Overwrite cloud with local for all conflicts"}
              >
                {isSyncingAll ? <RefreshCw size={12} className="animate-spin" /> : <Sliders size={12} />}
                <span>{isVi ? "Giải quyết tự động" : "Auto Resolve All"}</span>
              </button>
            )}

            {(stats.localOnly > 0 || stats.remoteOnly > 0) && (
              <button
                disabled={isSyncingAll}
                onClick={handleSyncAllOutstanding}
                className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/20 flex items-center gap-1.5 cursor-pointer transition animate-pulse"
                title={isVi ? "Đồng bộ tất cả hồ sơ chưa khớp giữa SQLite và Đám mây" : "Synchronize all out-of-sync records"}
              >
                {isSyncingAll ? <RefreshCw size={12} className="animate-spin" /> : <Database size={12} />}
                <span>{isVi ? "Đồng bộ tất cả" : "Sync All Outstanding"}</span>
              </button>
            )}

            <button
              disabled={loading}
              onClick={fetchSyncData}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span>{isVi ? "Đối soát ngay" : "Audit Now"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              <Sliders size={14} className="text-indigo-500" />
              <span>{isVi ? "Bộ lọc nâng cao" : "Advanced Filters"}</span>
              <ChevronDown size={14} className={`transform transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
            </button>
            
            {(filterDateStart || filterDateEnd || filterUserRole !== "all" || filterEventType !== "all") && (
              <button
                onClick={() => {
                  setFilterDateStart("");
                  setFilterDateEnd("");
                  setFilterUserRole("all");
                  setFilterEventType("all");
                }}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition"
              >
                <X size={12} />
                <span>{isVi ? "Xóa bộ lọc" : "Clear Filters"}</span>
              </button>
            )}
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 animate-fadeIn">
              {/* Date Range Group */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">
                  {isVi ? "Khoảng thời gian" : "Date Range"}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="text-slate-400 text-xs">→</span>
                  <input
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                {/* Date presets */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      setFilterDateStart(today);
                      setFilterDateEnd(today);
                    }}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 cursor-pointer"
                  >
                    {isVi ? "Hôm nay" : "Today"}
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 7);
                      setFilterDateStart(start.toISOString().split("T")[0]);
                      setFilterDateEnd(end.toISOString().split("T")[0]);
                    }}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 cursor-pointer"
                  >
                    {isVi ? "7 ngày" : "7 Days"}
                  </button>
                  <button
                    onClick={() => {
                      setFilterDateStart("");
                      setFilterDateEnd("");
                    }}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 cursor-pointer"
                  >
                    {isVi ? "Tất cả" : "All"}
                  </button>
                </div>
              </div>

              {/* User Role Group */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">
                  {isVi ? "Vai trò người dùng" : "Associated User Role"}
                </label>
                <select
                  value={filterUserRole}
                  onChange={(e) => setFilterUserRole(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">{isVi ? "Tất cả vai trò" : "All Roles"}</option>
                  <option value="admin">{isVi ? "Quản trị viên" : "Administrator"}</option>
                  <option value="director">{isVi ? "Giám đốc (Director)" : "Director"}</option>
                  <option value="deputy_director">{isVi ? "Phó giám đốc (Deputy Director)" : "Deputy Director"}</option>
                  <option value="head_of_department">{isVi ? "Trưởng phòng (Head of Department)" : "Head of Dept"}</option>
                  <option value="manager">{isVi ? "Quản lý (Manager)" : "Manager"}</option>
                  <option value="prosecutor">{isVi ? "Kiểm soát chất lượng" : "Quality Prosecutor"}</option>
                  <option value="controller">{isVi ? "Kiểm soát viên" : "Controller"}</option>
                  <option value="lawyer">{isVi ? "Luật sư" : "Lawyer"}</option>
                  <option value="specialist">{isVi ? "Chuyên viên pháp lý" : "Legal Specialist"}</option>
                  <option value="legal_associate">{isVi ? "Trợ lý pháp lý" : "Legal Associate"}</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  {isVi ? "Lọc theo chức danh quản lý hồ sơ" : "Filter by record manager's title"}
                </p>
              </div>

              {/* Event/Sync Type Group */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">
                  {isVi ? "Loại sự kiện đối soát" : "Reconciliation Event Type"}
                </label>
                <select
                  value={filterEventType}
                  onChange={(e) => setFilterEventType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">{isVi ? "Tất cả loại" : "All Types"}</option>
                  <option value="insert_local">{isVi ? "Thêm mới Cục bộ (Insert Local)" : "New Local Record (Insert)"}</option>
                  <option value="insert_remote">{isVi ? "Thêm mới Đám mây (Insert Remote)" : "New Remote Record (Insert)"}</option>
                  <option value="conflict">{isVi ? "Xung đột Sửa đổi (Update Conflict)" : "Modification Conflict (Update)"}</option>
                  <option value="synced">{isVi ? "Đã đồng bộ hoàn tất (Synced Match)" : "Synchronized Match"}</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  {isVi ? "Lọc theo trạng thái và nguồn phát sinh" : "Filter by source and mismatch status"}
                </p>
              </div>
            </div>
          )}

          {/* Active filters summary */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1">
            <span className="bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded text-xs">
              {isVi 
                ? `Hiển thị ${activeTab === "clients" ? filteredClientProfiles.length : filteredSyncData.length} bản ghi khớp lọc (Tổng số: ${activeTab === "clients" ? clientProfiles.length : syncData.length})`
                : `Showing ${activeTab === "clients" ? filteredClientProfiles.length : filteredSyncData.length} matching entries (Total: ${activeTab === "clients" ? clientProfiles.length : syncData.length})`}
            </span>
            
            <div className="flex flex-wrap gap-1">
              {filterDateStart && (
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/40 font-mono text-[10px] flex items-center gap-1">
                  <span>Start: {filterDateStart}</span>
                  <X size={10} className="cursor-pointer hover:text-indigo-800" onClick={() => setFilterDateStart("")} />
                </span>
              )}
              {filterDateEnd && (
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/40 font-mono text-[10px] flex items-center gap-1">
                  <span>End: {filterDateEnd}</span>
                  <X size={10} className="cursor-pointer hover:text-indigo-800" onClick={() => setFilterDateEnd("")} />
                </span>
              )}
              {filterUserRole !== "all" && (
                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/40 text-[10px] flex items-center gap-1 capitalize">
                  <span>Role: {filterUserRole}</span>
                  <X size={10} className="cursor-pointer hover:text-amber-800" onClick={() => setFilterUserRole("all")} />
                </span>
              )}
              {filterEventType !== "all" && (
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/40 text-[10px] flex items-center gap-1 uppercase font-mono">
                  <span>Event: {filterEventType}</span>
                  <X size={10} className="cursor-pointer hover:text-emerald-800" onClick={() => setFilterEventType("all")} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab content loading state */}
        {loading && syncData.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={36} className="animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {isVi ? "Đang so khớp cơ sở dữ liệu..." : "Reconciling tables databases..."}
            </p>
          </div>
        )}

        {/* TAB 1 & 3: DOCUMENTS / CONFLICTS LIST */}
        {(activeTab === "all" || activeTab === "conflicts") && (
          <div className="space-y-4">
            {/* Filtered records view */}
            {filteredSyncData.length === 0 ? (
              <div className="py-16 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/30 dark:bg-slate-900/10">
                <CheckCircle size={44} className="text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {isVi ? "Không tìm thấy hồ sơ dữ liệu phù hợp" : "No matching documents found"}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {isVi ? "Hãy thử điều chỉnh hoặc xóa các điều kiện lọc nâng cao của bạn." : "Try adjusting or clearing your advanced filtering criteria."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSyncData.map((item, idx) => {
                    const isConflict = item.status === "conflict";
                    const isExpanded = expandedId === item.id;

                    return (
                      <div 
                        key={item.id + idx}
                        className={`p-4 rounded-2xl border transition duration-300 bg-white dark:bg-slate-900 shadow-sm ${
                          isConflict 
                            ? "border-rose-200 dark:border-rose-950/40 hover:border-rose-500/50" 
                            : "border-slate-100 dark:border-slate-800 hover:border-indigo-500/40"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Document icon with badge */}
                            <div className={`p-2.5 rounded-xl shrink-0 ${isConflict ? "bg-rose-500/10 text-rose-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                              <FileText size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">
                                  {item.id}
                                </span>
                                <span className="px-2 py-0.5 text-[9px] uppercase font-black tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                  {item.type}
                                </span>
                                
                                {/* Live Sync Indicators badges */}
                                {item.status === "synced" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold border border-emerald-500/10">
                                    <Check size={8} />
                                    <span>{isVi ? "Đồng bộ" : "Synced"}</span>
                                  </span>
                                )}
                                {isConflict && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-bold border border-rose-500/10 animate-pulse">
                                    <AlertTriangle size={8} />
                                    <span>{isVi ? "Xung Đột Dữ Liệu" : "Conflict State"}</span>
                                  </span>
                                )}
                                {item.status === "local_only" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-bold border border-amber-500/10">
                                    <ArrowUpFromLine size={8} />
                                    <span>{isVi ? "Chưa Backup" : "Local Only"}</span>
                                  </span>
                                )}
                                {item.status === "remote_only" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-bold border border-indigo-500/10">
                                    <ArrowDownToLine size={8} />
                                    <span>{isVi ? "Chỉ Đám mây" : "Cloud Only"}</span>
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif mt-1.5 truncate">
                                {item.title}
                              </h4>
                              
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {isVi ? "Bảng dữ liệu: " : "Data table: "} <strong className="font-mono text-slate-500">{item.tableName}</strong>
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions / Expand trigger */}
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            {isConflict && (
                              <button
                                onClick={() => toggleExpand(item.id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-1 cursor-pointer transition"
                              >
                                <span>{isVi ? "So sánh sai lệch" : "Compare details"}</span>
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            )}

                            {!isConflict && (
                              <div className="flex gap-1.5">
                                {item.status === "local_only" && (
                                  <button
                                    onClick={() => handleSyncOverride(item.id, item.tableName, "push")}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition"
                                    title={isVi ? "Đẩy bản ghi cục bộ lên đám mây" : "Push to Cloud"}
                                  >
                                    <ArrowUpFromLine size={10} />
                                    <span>{isVi ? "Đẩy Cloud" : "Push Cloud"}</span>
                                  </button>
                                )}
                                {item.status === "remote_only" && (
                                  <button
                                    onClick={() => handleSyncOverride(item.id, item.tableName, "pull")}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition"
                                    title={isVi ? "Tải bản ghi đám mây xuống máy chủ cục bộ" : "Pull to Local"}
                                  >
                                    <ArrowDownToLine size={10} />
                                    <span>{isVi ? "Đồng bộ SQLite" : "Pull SQLite"}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Collapsible details for conflicts */}
                        {isConflict && isExpanded && renderDetailDiff(item)}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLIENT PROFILES LIST */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            {filteredClientProfiles.length === 0 ? (
              <div className="py-16 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/30 dark:bg-slate-900/10">
                <CheckCircle size={44} className="text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {isVi ? "Không tìm thấy hồ sơ khách hàng phù hợp" : "No matching client profiles found"}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {isVi ? "Không có hồ sơ khách hàng nào thỏa mãn điều kiện lọc của các tài liệu liên quan." : "No client profiles match the selected filters of linked documents."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClientProfiles.map((client, index) => {
                  const isConflict = client.status === "conflict";
                  const hasLocalOnly = client.status === "local_only";
                  
                  return (
                    <div 
                      key={client.idCard || client.name || index}
                      className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition duration-300 flex flex-col justify-between ${
                        isConflict 
                          ? "border-rose-200 dark:border-rose-950/40" 
                          : "border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif">
                                {client.name || (isVi ? "Chưa rõ danh tính" : "Anonymous Client")}
                              </h4>
                              
                              {/* Sync state badge */}
                              {isConflict ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-bold border border-rose-500/10">
                                  <AlertTriangle size={8} />
                                  <span>{isVi ? "Xung Đột" : "Mismatched"}</span>
                                </span>
                              ) : hasLocalOnly ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-bold border border-amber-500/10">
                                  <ArrowUpFromLine size={8} />
                                  <span>{isVi ? "Chỉ cục bộ" : "Local Only"}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold border border-emerald-500/10">
                                  <Check size={8} />
                                  <span>{isVi ? "Đồng bộ" : "Synced"}</span>
                                </span>
                              )}
                            </div>

                            {/* Contact Details */}
                            <div className="grid grid-cols-1 text-slate-500 text-[11px] font-medium space-y-1 pt-1">
                              {client.idCard && (
                                <div className="flex items-center gap-1.5">
                                  <span>CCCD: <strong className="text-slate-700 dark:text-slate-300 font-mono">{client.idCard}</strong></span>
                                </div>
                              )}
                              {client.taxId && (
                                <div className="flex items-center gap-1.5">
                                  <span>MST: <strong className="text-slate-700 dark:text-slate-300 font-mono">{client.taxId}</strong></span>
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center gap-1.5">
                                  <span>SĐT: <strong className="text-slate-700 dark:text-slate-300 font-mono">{client.phone}</strong></span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">{client.recordsCount}</div>
                            <div className="text-[9px] uppercase font-black tracking-wider text-slate-400">{isVi ? "Hồ sơ" : "Dossiers"}</div>
                          </div>
                        </div>

                        {/* Associated Cases list summary */}
                        <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                          <div>• {isVi ? "Bảng định danh: " : "Identified source: "} <strong className="text-slate-500 font-mono">{client.tableName}</strong></div>
                          <div>• {isVi ? "Danh sách mã hồ sơ vụ việc liên kết: " : "Linked Case ID list: "} 
                            <span className="font-mono text-indigo-500 font-bold ml-1">
                              {client.associatedIds.join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Conflict resolution quick action buttons for Client Profiles */}
                      {isConflict && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 justify-end">
                          <button
                            onClick={() => handleSyncOverride(client.associatedIds[0], client.tableName, "push")}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                            title={isVi ? "Ghi đè thông tin cục bộ lên đám mây Firestore" : "Overwrite cloud with local data"}
                          >
                            <ArrowUpFromLine size={10} />
                            <span>{isVi ? "Ghi đè Cloud" : "Push"}</span>
                          </button>
                          <button
                            onClick={() => handleSyncOverride(client.associatedIds[0], client.tableName, "pull")}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                            title={isVi ? "Ghi đè thông tin đám mây xuống SQLite cục bộ" : "Overwrite local with cloud data"}
                          >
                            <ArrowDownToLine size={10} />
                            <span>{isVi ? "Ghi đè SQLite" : "Pull"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
