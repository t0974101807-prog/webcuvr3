import React, { useState, useMemo, useEffect } from "react";
import { ModuleHeader } from "./components/ModuleHeader";
import { ModuleStats } from "./components/ModuleStats";
import { ModuleFilter } from "./components/ModuleFilter";
import { ModuleTable } from "./components/ModuleTable";
import { ModuleDialogs } from "./components/ModuleDialogs";
import { ModuleTimeline } from "./components/ModuleTimeline";
import { ModuleAIAdvisor } from "./components/ModuleAIAdvisor";
import ModuleConsultantKPI from "./components/ModuleConsultantKPI";
import { SpecializedRecordsRepository, RecordItem } from "./repository/SpecializedRecordsRepository";
import { SpecializedRecordsService } from "./services/SpecializedRecordsService";
import { getModuleByActiveTab } from "../../config/modules";
import { api } from "../../lib/api";
import { AlertCircle, CheckCircle2, Clock, X } from "lucide-react";

interface SpecializedRecordsViewProps {
  language: "vi" | "en";
  user?: any;
  records: any[];
  updateRecords: (records: any[], changedRecord?: any, deletedId?: string) => void;
  users?: any[];
  offices?: any[];
  activeModule: string;
  deletedRecordIds?: string[];
}

export const SpecializedRecordsView: React.FC<SpecializedRecordsViewProps> = ({
  language,
  user,
  records,
  updateRecords,
  users = [],
  offices = [],
  activeModule,
  deletedRecordIds = [],
}) => {
  // Filters matching Image 2
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [partnerFilter, setPartnerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [courtFilter, setCourtFilter] = useState("");
  const [pageSize, setPageSize] = useState(25);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Check if current user is management (admin, director, deputyDirector, controller, Ban Giám đốc)
  const isManagement = useMemo(() => {
    if (!user) return false;
    const roleLower = (user.role || "").toLowerCase().trim();
    const titleLower = (user.title || "").toLowerCase().trim();
    return (
      roleLower.includes("admin") ||
      roleLower.includes("director") ||
      roleLower.includes("giám đốc") ||
      roleLower.includes("giam doc") ||
      roleLower.includes("ban giám đốc") ||
      roleLower.includes("ban giam doc") ||
      roleLower.includes("controller") ||
      roleLower.includes("kiểm soát") ||
      roleLower.includes("quản trị") ||
      titleLower.includes("giám đốc") ||
      titleLower.includes("director") ||
      titleLower.includes("ban giám đốc")
    );
  }, [user]);

  // Check if current user is a consultant (chuyên viên tư vấn)
  const isConsultant = useMemo(() => {
    if (!user) return false;
    const roleLower = (user.role || "").toLowerCase();
    const titleLower = (user.title || "").toLowerCase();
    return (
      roleLower.includes("specialist") ||
      roleLower.includes("chuyên viên") ||
      roleLower.includes("tư vấn") ||
      titleLower.includes("chuyên viên") ||
      titleLower.includes("tư vấn")
    );
  }, [user]);

  // Scope filter: "mine" = Hồ sơ phân bổ cho tôi, "all" = Tất cả hồ sơ (mặc định xem toàn bộ)
  const [scopeFilter, setScopeFilter] = useState<"all" | "mine">("all");

  // QA evaluations from SQLite database
  const [qaEvaluations, setQaEvaluations] = useState<any[]>([]);

  // Timekeeping (CHẤM CÔNG) states
  const [attendance, setAttendance] = useState<any>(null);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [dismissedAttendance, setDismissedAttendance] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const moduleConfig = getModuleByActiveTab(activeModule);

  // Initialize scopeFilter default to "all" so records are immediately visible
  useEffect(() => {
    setScopeFilter("all");
  }, [activeModule]);

  // Fetch real-time QA evaluations for the user or all if admin
  useEffect(() => {
    if (!user) return;
    const fetchQAEvaluations = async () => {
      try {
        const staffQuery = isConsultant ? `?staffName=${encodeURIComponent(user.name || user.username || "")}` : "";
        const res = await api.req(`/api/system/qa-evaluations${staffQuery}`, "GET");
        if (res && res.success && Array.isArray(res.data)) {
          setQaEvaluations(res.data);
        }
      } catch (err) {
        console.error("QA evaluations fetch error:", err);
      }
    };
    fetchQAEvaluations();
  }, [user, isConsultant]);

  // Initialize repository
  const repo = useMemo(() => {
    return new SpecializedRecordsRepository(records, updateRecords);
  }, [records, updateRecords]);

  // Sync latest records into repository
  repo.updateState(records);

  // Fetch real-time attendance status
  useEffect(() => {
    if (!user) return;
    const fetchAttendance = async () => {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const rows = await api.req(`/api/attendance?userId=${user.id}&date=${todayStr}`, "GET");
        if (rows && rows.length > 0) {
          setAttendance(rows[0]);
        }
      } catch (err) {
        console.error("Attendance fetch error:", err);
      }
    };
    fetchAttendance();

    // Set interactive ticking clock for the warning card
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }));
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  // Handle active check-in call
  const handleCheckInNow = async () => {
    if (!user) return;
    setSubmittingAttendance(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const nowTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const response = await api.req("/api/attendance/check-in", "POST", {
        userId: user.id,
        staffCode: user.staff_code || `NV${user.id}`,
        staffName: user.name || user.username,
        role: user.role,
        date: todayStr,
        status: "present",
        checkInTime: nowTime,
        explanation: "",
        proofFile: ""
      });
      
      setAttendance({
        status: "present",
        checkInTime: nowTime
      });
      alert(language === "vi" ? `Chấm công thành công lúc ${nowTime}!` : `Attendance marked successfully at ${nowTime}!`);
    } catch (err: any) {
      console.error(err);
      alert(language === "vi" ? "Chấm công thất bại!" : "Attendance submission failed!");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Only real database records from the repository (Zero-Mock Policy)
  const allAvailableRecords = useMemo(() => {
    let activeDeletedIds = deletedRecordIds || [];
    try {
      const saved = localStorage.getItem("erp_deleted_record_ids");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          activeDeletedIds = Array.from(new Set([...activeDeletedIds, ...parsed.map(String)]));
        }
      }
    } catch {}

    const originalOfModule = repo.getByModule(activeModule, moduleConfig.category);

    const standardizeBranchName = (b?: string): string => {
      if (!b) return offices && offices.length > 0 ? offices[0].name : "Trụ sở chính TP. Hồ Chí Minh";
      if (offices && offices.length > 0) {
        const found = offices.find((off: any) => 
          off.name.toLowerCase() === b.toLowerCase() || 
          off.name.toLowerCase().includes(b.toLowerCase()) ||
          b.toLowerCase().includes(off.name.toLowerCase()) ||
          (off.short_name && off.short_name.toLowerCase() === b.toLowerCase())
        );
        if (found) return found.name;
      }
      return b;
    };

    const mapped = originalOfModule.map((r: any) => {
      return {
        id: r.id,
        title: r.title || r.description?.slice(0, 50) || `Hồ sơ ${r.id}`,
        client: r.client || "Chưa cập nhật",
        clientPhone: r.clientPhone || "",
        address: r.address || "",
        dob: r.dob || "",
        gender: r.gender || "Nam",
        overdueAmount: r.overdueAmount !== undefined ? r.overdueAmount : 0,
        feeAmount: r.feeAmount || r.revenue || 0,
        liquidationAmount: r.liquidationAmount !== undefined ? r.liquidationAmount : (r.feeAmount || r.revenue || 0),
        loanStatus: r.loanStatus || "Bình thường",
        branch: standardizeBranchName(r.branch),
        mainAssignee: r.mainAssignee || "Chưa phân công",
        status: r.status || "Mới tiếp nhận",
        date: r.date || new Date().toISOString().split("T")[0],
        practice_area: r.practice_area || activeModule,
        category: r.category || moduleConfig.category,
        createdBy: r.createdBy || r.created_by || "",
        description: r.description || "",
        courtArea: r.courtArea || "",
        contractId: r.contractId || ""
      };
    });

    return mapped.filter(r => !activeDeletedIds.includes(String(r.id)));
  }, [records, activeModule, moduleConfig.category, repo, deletedRecordIds]);

  // Filter allAvailableRecords based on scope selection
  const scopedAvailableRecords = useMemo(() => {
    if ((scopeFilter === "mine" || !isManagement) && user) {
      const userName = (user.name || user.username || "").toLowerCase().trim();
      const userBranch = (user.branch || "").toLowerCase().trim();
      return allAvailableRecords.filter((r) => {
        const isAssignee = r.mainAssignee?.toLowerCase().trim() === userName;
        const isCreator = r.createdBy?.toLowerCase().trim() === userName;
        const isSameBranch = userBranch && r.branch && String(r.branch).toLowerCase().trim() === userBranch;
        return isAssignee || isCreator || isSameBranch;
      });
    }
    return allAvailableRecords;
  }, [allAvailableRecords, scopeFilter, user, isManagement]);

  // Derived related issues list for the current scope
  const overdueDossiers = useMemo(() => {
    return scopedAvailableRecords.filter((r) => Number(r.overdueAmount) > 0);
  }, [scopedAvailableRecords]);

  const incompleteDossiers = useMemo(() => {
    return scopedAvailableRecords.filter(
      (r) => !r.description || r.description.trim() === "" || !r.clientPhone || r.clientPhone.trim() === ""
    );
  }, [scopedAvailableRecords]);

  const callViolations = useMemo(() => {
    return qaEvaluations.filter((evalItem) => evalItem.has_violation === 1 || evalItem.score === "F");
  }, [qaEvaluations]);

  // Apply filters in sequence
  const filteredRecords = useMemo(() => {
    return scopedAvailableRecords.filter((r) => {
      // 1. Branch filter
      if (branchFilter !== "ALL" && r.branch !== branchFilter) {
        return false;
      }
      // 2. Partner filter
      if (partnerFilter !== "ALL" && r.mainAssignee !== partnerFilter) {
        return false;
      }
      // 3. Status filter
      if (statusFilter !== "ALL" && r.status !== statusFilter) {
        return false;
      }
      // 4. Court Area filter
      if (courtFilter.trim()) {
        const cf = courtFilter.toLowerCase().trim();
        if (!r.courtArea || !r.courtArea.toLowerCase().includes(cf)) {
          return false;
        }
      }
      // 5. Date timeframe filter
      if (dateFilter !== "ALL") {
        const recDate = new Date(r.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (dateFilter === "today") {
          const recStr = recDate.toISOString().split("T")[0];
          const todayStr = new Date().toISOString().split("T")[0];
          if (recStr !== todayStr) return false;
        } else if (dateFilter === "yesterday") {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const recStr = recDate.toISOString().split("T")[0];
          const yesStr = yesterday.toISOString().split("T")[0];
          if (recStr !== yesStr) return false;
        } else if (dateFilter === "week") {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (recDate < sevenDaysAgo) return false;
        } else if (dateFilter === "month") {
          if (recDate.getMonth() !== today.getMonth() || recDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        } else if (dateFilter === "quarter") {
          const currentQuarter = Math.floor(today.getMonth() / 3);
          const recQuarter = Math.floor(recDate.getMonth() / 3);
          if (recQuarter !== currentQuarter || recDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        }
      }
      return true;
    });
  }, [scopedAvailableRecords, branchFilter, partnerFilter, statusFilter, dateFilter, courtFilter]);

  // Find currently selected record item
  const selectedRecord = useMemo(() => {
    if (!selectedRecordId) return null;
    return scopedAvailableRecords.find((r) => r.id === selectedRecordId) || null;
  }, [scopedAvailableRecords, selectedRecordId]);

  const handleCreateRecord = (newRec: any) => {
    repo.create(newRec);
    alert(language === "vi" ? "Thêm hồ sơ thành công!" : "Dossier added successfully!");
  };

  const handleUpdateRecord = (updatedRec: any) => {
    repo.update(updatedRec);
    alert(language === "vi" ? "Cập nhật hồ sơ thành công!" : "Dossier updated successfully!");
  };

  const handleExportExcel = () => {
    const resolvedName = language === "vi" ? moduleConfig.nameVi : moduleConfig.nameEn;
    SpecializedRecordsService.exportExcelFile(filteredRecords, `Danh_sach_ho_so_${resolvedName.replace(/\s+/g, "_")}`);
  };

  const handleExportCSV = () => {
    const resolvedName = language === "vi" ? moduleConfig.nameVi : moduleConfig.nameEn;
    SpecializedRecordsService.exportCSVFile(filteredRecords, `Danh_sach_ho_so_${resolvedName.replace(/\s+/g, "_")}`);
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordToDelete(id);
  };

  const handleRowClick = (row: any) => {
    setSelectedRecordId(row.id);
  };

  const handleImportSuccess = (parsed: any[]) => {
    updateRecords([...parsed, ...records]);
  };

  return (
    <div className="space-y-6 relative min-h-[70vh]">
      
      {/* 1. Header with dynamic configuration-driven title & actions */}
      <ModuleHeader
        activeModule={activeModule}
        language={language}
        currentUser={user}
        onAddClick={() => setShowAddModal(true)}
        onImportSuccess={handleImportSuccess}
        onExportClick={handleExportExcel}
        onExportCSVClick={handleExportCSV}
      />

      {/* Interactive Attendance Check-In Banner (Red Box UI implementation) */}
      {user && user.role !== "client" && !attendance && !dismissedAttendance && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
              <AlertCircle size={20} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">
                {language === "vi" ? "Cảnh báo chấm công hệ thống" : "System Attendance Warning"}
              </h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1">
                {language === "vi" 
                  ? `Bạn chưa thực hiện điểm danh chấm công hôm nay (${currentDate || "ngày hiện tại"}). Vui lòng thực hiện chấm công ngay để hệ thống ghi nhận lịch trình làm việc và đồng bộ bảng lương.`
                  : `You have not checked in today (${currentDate || "today"}). Please check in now to record your daily attendance and synchronize payroll details.`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={handleCheckInNow}
              disabled={submittingAttendance}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition whitespace-nowrap"
            >
              {submittingAttendance 
                ? (language === "vi" ? "Đang xử lý..." : "Processing...") 
                : (language === "vi" ? "Chấm công ngay" : "Check In Now")
              }
            </button>
            <button
              onClick={() => setDismissedAttendance(true)}
              className="p-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 cursor-pointer transition"
              title={language === "vi" ? "Bỏ qua" : "Dismiss"}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {user && user.role !== "client" && attendance && !dismissedAttendance && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                {language === "vi" ? "Đã hoàn thành chấm công" : "Attendance Recorded"}
              </h4>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                {language === "vi"
                  ? `Chấm công vào ca hôm nay lúc ${attendance.checkInTime || "vừa qua"}. Hệ thống đã đồng bộ thành công.`
                  : `Checked in today at ${attendance.checkInTime || "just now"}. Attendance synchronized successfully.`
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissedAttendance(true)}
            className="p-2 text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/40 cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1.5. Scope Switcher and User Assignment Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === "vi" ? "Bộ lọc phân bổ:" : "Assignment Scope:"}
          </span>
          <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setScopeFilter("mine")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                scopeFilter === "mine"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {language === "vi" ? "Hồ sơ được phân bổ cho tôi" : "Cases Allocated to Me"}
            </button>
            <button
              onClick={() => setScopeFilter("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                scopeFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {language === "vi" ? "Tất cả hồ sơ văn phòng" : "All Office Cases"}
            </button>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
              {user.name || user.username}
            </span>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/60 font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100/50 dark:bg-emerald-500/15 rounded-md">
              {user.role || "Chuyên viên"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
              ({scopedAvailableRecords.length} {language === "vi" ? "hồ sơ" : "cases"})
            </span>
          </div>
        )}
      </div>

      {/* 1.8. Consultant Real-time KPI Card summary */}
      <ModuleConsultantKPI records={scopedAvailableRecords} language={language} user={user} />

      {/* 2. Dynamic Statistic Cards */}
      <ModuleStats records={scopedAvailableRecords} language={language} />

      {/* 3. Main Workspace */}
      <div className="w-full space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden">
          {/* Top dropdown filters matching Image 2 */}
          <ModuleFilter
            activeModule={activeModule}
            language={language}
            branchFilter={branchFilter}
            setBranchFilter={setBranchFilter}
            partnerFilter={partnerFilter}
            setPartnerFilter={setPartnerFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            courtFilter={courtFilter}
            setCourtFilter={setCourtFilter}
            users={users}
            offices={offices}
          />

          {/* Custom Interactive Table */}
          <ModuleTable
            records={filteredRecords}
            language={language}
            activeModule={activeModule}
            onRowClick={handleRowClick}
            onDeleteClick={handleDeleteRecord}
            onEditClick={handleEditRecord}
            selectedRecordId={selectedRecordId}
            setSelectedRecordId={setSelectedRecordId}
            pageSize={pageSize}
            setPageSize={setPageSize}
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
            onImportSuccess={handleImportSuccess}
            currentUser={user}
          />
        </div>
      </div>

      {/* 5. Modals and Slide-Over drawers */}
      <ModuleDialogs
        activeModule={activeModule}
        language={language}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        users={users}
        offices={offices}
        currentUser={user}
        onCreateRecord={handleCreateRecord}
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        onUpdateRecord={handleUpdateRecord}
      />

      {/* Slide-over Timeline Drawer */}
      <ModuleTimeline
        record={selectedRecord}
        language={language}
        onClose={() => {
          setShowTimeline(false);
          setSelectedRecordId(null);
        }}
      />

      {/* 6. Custom Confirmation Modal for deletion to bypass iframe restrictions */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-rose-500">⚠️</span>
              {language === "vi" ? "Xác nhận xóa hồ sơ" : "Confirm Record Deletion"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {language === "vi"
                ? "Bạn có chắc chắn muốn xóa hồ sơ này khỏi hệ thống? Thao tác này sẽ chuyển hồ sơ vào Thùng rác."
                : "Are you sure you want to delete this record from the system? This action will move it to the Recycle Bin."}
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                {language === "vi" ? "Hủy bỏ" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  if (recordToDelete) {
                    const targetRec = allAvailableRecords.find(
                      (r) => String(r.id) === String(recordToDelete) || String(r.contractId) === String(recordToDelete)
                    );
                    repo.delete(recordToDelete, targetRec);
                    if (selectedRecordId === recordToDelete) {
                      setSelectedRecordId(null);
                    }
                    setRecordToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
              >
                {language === "vi" ? "Đồng ý xóa" : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecializedRecordsView;
