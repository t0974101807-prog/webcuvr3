import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { io } from "socket.io-client";
import axios from "axios";
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Clock, 
  User, 
  Tag, 
  AlertCircle,
  FileText,
  ChevronDown,
  Check,
  MoreVertical,
  X,
  Calendar,
  Settings,
  ArrowLeft,
  ArrowRight,
  Filter,
  Undo2,
  HelpCircle,
  DollarSign,
  Sun,
  Moon,
  Hash,
  MessageSquare
} from "lucide-react";

interface RecycleBinItem {
  id: string;
  originalTable: string;
  data: {
    title?: string;
    description?: string;
    client?: string;
    mainAssignee?: string;
    feeAmount?: number;
    revenue?: number;
    practice_area?: string;
    deletedBy?: string;
    filename?: string;
    case_id?: string;
    name?: string;
    category?: string;
  };
  deletedAt: string;
  deletedBy?: string;
  reason?: string;
  previousStatus?: string;
}

interface RecycleBinViewProps {
  language: "vi" | "en";
  user: any;
  onRestoreSuccess?: (id?: string) => void;
}

export const RecycleBinView: React.FC<RecycleBinViewProps> = ({ 
  language, 
  user,
  onRestoreSuccess
}) => {
  // Theme state: default to light (false) as requested, persistent in localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("recycle_bin_theme");
      return saved ? saved === "dark" : false;
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem("recycle_bin_theme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  };

  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastUndoAction, setToastUndoAction] = useState<{ type: 'restore' | 'delete'; items: RecycleBinItem[] } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dropdown states
  const [showSelectDropdown, setShowSelectDropdown] = useState(false);
  const [showRestoreDropdown, setShowRestoreDropdown] = useState(false);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Chip filters states & value selection
  const [activeFilterChip, setActiveFilterChip] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    id: "",
    client: "",
    assignee: "",
    area: "all",
    expiry: "all"
  });

  // Date picker state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Refs for closing dropdowns when clicking outside
  const selectDropdownRef = useRef<HTMLDivElement>(null);
  const restoreDropdownRef = useRef<HTMLDivElement>(null);
  const deleteDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectDropdownRef.current && !selectDropdownRef.current.contains(event.target as Node)) {
        setShowSelectDropdown(false);
      }
      if (restoreDropdownRef.current && !restoreDropdownRef.current.contains(event.target as Node)) {
        setShowRestoreDropdown(false);
      }
      if (deleteDropdownRef.current && !deleteDropdownRef.current.contains(event.target as Node)) {
        setShowDeleteDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRecycleBin = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
      }

      let serverData: any[] = [];
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const config = {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        };
        const response = await axios.get(`/api/trash/records?limit=50`, config);
        if (response && response.data && response.data.success) {
          serverData = response.data.data || response.data.items || [];
        }
      } catch (e) {
        console.warn("Failed to fetch server recycle bin list via Axios:", e);
      }

      const combinedMap = new Map<string, RecycleBinItem>();

      // Merge server items
      serverData.forEach((item) => {
        combinedMap.set(String(item.id), {
          id: String(item.id),
          originalTable: item.originalTable || "erp_records",
          deletedAt: item.deletedAt || new Date().toISOString(),
          deletedBy: item.deletedBy || "Hệ thống",
          reason: item.reason || "Xóa từ cổng quản trị",
          previousStatus: item.previousStatus || "Đang xử lý",
          data: item.data || {}
        });
      });

      setItems(Array.from(combinedMap.values()));
      setError(null);
    } catch (err: any) {
      console.error("Failed to load recycle bin:", err);
      setError(err.message || "Không thể tải danh sách thùng rác");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecycleBin(true);
  }, []);

  useEffect(() => {
    let s: any = null;
    try {
      s = io();
      s.on("connect", () => {
        s.emit("join_erp");
      });
      s.on("recycle_bin_updated", () => fetchRecycleBin(false));
      s.on("erp_record_deleted", () => fetchRecycleBin(false));
      s.on("erp_record_restored", () => fetchRecycleBin(false));
    } catch (err) {
      console.error("Socket connection failed in RecycleBinView:", err);
    }

    return () => {
      if (s) {
        s.close();
      }
    };
  }, []);

  // Time remaining calculator
  const calculateTimeRemaining = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr);
    const expiryDate = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 Days expiry
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return { text: "Hết hạn", color: "red", days: 0 };
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let color = "slate";
    if (diffDays < 1) {
      color = "red"; // Under 24 hours
    } else if (diffDays < 7) {
      color = "orange"; // Under 7 days
    }

    return {
      text: `Còn ${diffDays} ngày ${diffHours} giờ`,
      color,
      days: diffDays
    };
  };

  const getPracticeAreaLabel = (area?: string) => {
    if (!area) return "Khác";
    const mapping: Record<string, string> = {
      "tranh_tung": "Tranh tụng",
      "tu_van": "Tư vấn Pháp luật",
      "dai_dien": "Đại diện Ngoài tố tụng",
      "phap_che": "Pháp chế & Nội bộ",
      "trong_tai": "Trọng tài & Hòa giải",
      "ban_giam_doc": "Ban Giám đốc & Điều hành",
    };
    return mapping[area] || area;
  };

  // Checkbox interactions
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === getFilteredItems().length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(getFilteredItems().map(item => item.id));
    }
  };

  const handleSelectNone = () => {
    setSelectedIds([]);
  };

  // Time-based quick selection handler
  const handleSelectByTimeRange = (hours: number, label: string) => {
    const now = new Date();
    const threshold = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const matched = getFilteredItems().filter(item => {
      const delDate = new Date(item.deletedAt);
      return delDate >= threshold;
    });
    setSelectedIds(matched.map(m => m.id));
    setToastMessage(`Đã chọn ${matched.length} hồ sơ xóa trong ${label}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectByDateRange = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const matched = getFilteredItems().filter(item => {
      const delDate = new Date(item.deletedAt);
      return delDate >= start && delDate <= end;
    });

    setSelectedIds(matched.map(m => m.id));
    setShowDateRangePicker(false);
    setToastMessage(`Đã chọn ${matched.length} hồ sơ xóa từ ngày ${startDate} đến ${endDate}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Action methods: Restoration
  const executeRestoreItems = async (itemsToRestore: RecycleBinItem[]) => {
    const ids = [...new Set(itemsToRestore.map(x => x.id))];
    if (!ids.length) {
      setToastMessage("Không có hồ sơ phù hợp để khôi phục");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setActioningId("batch");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      };
      const response = await axios.post("/api/trash/restore", { ids }, config);
      if (!response.data?.success) {
        throw new Error(response.data?.error || "Không thể khôi phục hồ sơ đã chọn");
      }

      await fetchRecycleBin(true);
      setSelectedIds([]);
      setCurrentPage(1);
      setToastUndoAction(null);
      setToastMessage(`Đã khôi phục ${ids.length} hồ sơ`);
      setTimeout(() => setToastMessage(null), 5000);

      if (onRestoreSuccess) {
        ids.forEach(id => onRestoreSuccess(id));
      }
    } catch (err: any) {
      setError(err.message || "Khôi phục hàng loạt thất bại");
    } finally {
      setActioningId(null);
    }
  };

  // Action methods: Permanent deletion
  const executeDeleteItems = async (itemsToDelete: RecycleBinItem[]) => {
    const ids = [...new Set(itemsToDelete.map(x => x.id))];
    if (!ids.length) {
      setToastMessage("Không có hồ sơ phù hợp để xóa");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setActioningId("batch");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      };
      const isEmptyingAll = itemsToDelete.length === items.length && items.length > 0;
      const response = isEmptyingAll
        ? await axios.delete("/api/trash/empty-bin", config)
        : await axios.delete("/api/trash/hard-delete", {
            ...config,
            data: { ids }
          });
      if (!response.data?.success) {
        throw new Error(response.data?.error || "Không thể xóa vĩnh viễn hồ sơ đã chọn");
      }

      await fetchRecycleBin(true);
      if (isEmptyingAll) {
        setItems([]);
      } else {
        const remainingIds = new Set(itemsToDelete.map(item => item.id));
        setItems(prev => prev.filter(item => !remainingIds.has(item.id)));
      }
      setSelectedIds([]);
      setCurrentPage(1);
      setToastUndoAction(null);
      setToastMessage(`Đã xóa vĩnh viễn ${ids.length} hồ sơ`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || "Xóa vĩnh viễn hàng loạt thất bại");
    } finally {
      setActioningId(null);
    }
  };

  // Handle Undo Callback
  const handleUndo = async () => {
    if (!toastUndoAction) return;
    const { type, items: restoredOrDeletedItems } = toastUndoAction;
    
    setActioningId("undo");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      };
      if (type === 'restore') {
        // Redo deleting
        for (const item of restoredOrDeletedItems) {
          try {
            await axios.delete(`/api/trash/${item.id}`, config);
          } catch {}
        }
        setItems(prev => [...prev, ...restoredOrDeletedItems]);
        setToastMessage(`Đã hoàn tác khôi phục. Đã chuyển hồ sơ về thùng rác.`);
      } else {
        // Redo restoring
        for (const item of restoredOrDeletedItems) {
          try {
            await axios.post(`/api/trash/${item.id}/restore`, {}, config);
          } catch {}
        }
        setItems(prev => [...prev, ...restoredOrDeletedItems]);
        setToastMessage(`Đã hoàn tác xóa vĩnh viễn.`);
      }
      setToastUndoAction(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setError("Không thể hoàn tác hành động này.");
    } finally {
      setActioningId(null);
    }
  };

  // Select filtered items by time interval helper
  const getItemsByTimeThreshold = (hours: number) => {
    const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);
    return items.filter(x => new Date(x.deletedAt) >= threshold);
  };

  // Filtering engine
  const getFilteredItems = () => {
    return items.filter(item => {
      // Free text search query
      const queryStr = searchQuery.toLowerCase().trim();
      const title = (item.data?.title || "").toLowerCase();
      const client = (item.data?.client || "").toLowerCase();
      const mainAssignee = (item.data?.mainAssignee || "").toLowerCase();
      const docName = (item.data?.filename || "").toLowerCase();
      const idMatch = item.id.toLowerCase().includes(queryStr);
      
      const textMatch = !queryStr || (
        title.includes(queryStr) || 
        client.includes(queryStr) || 
        mainAssignee.includes(queryStr) || 
        docName.includes(queryStr) || 
        idMatch
      );

      // Advanced chip filters
      const chipIdMatch = !filters.id || item.id.toLowerCase().includes(filters.id.toLowerCase().trim());
      const chipClientMatch = !filters.client || (item.data?.client || "").toLowerCase().includes(filters.client.toLowerCase().trim());
      const chipAssigneeMatch = !filters.assignee || (item.data?.mainAssignee || "").toLowerCase().includes(filters.assignee.toLowerCase().trim());
      const chipAreaMatch = filters.area === "all" || item.data?.practice_area === filters.area;
      
      let chipExpiryMatch = true;
      if (filters.expiry !== "all") {
        const hoursMap: Record<string, number> = {
          "24h": 24,
          "48h": 48,
          "7d": 168,
          "30d": 720
        };
        const threshold = new Date(Date.now() - (hoursMap[filters.expiry] || 24) * 60 * 60 * 1000);
        chipExpiryMatch = new Date(item.deletedAt) >= threshold;
      }

      return textMatch && chipIdMatch && chipClientMatch && chipAssigneeMatch && chipAreaMatch && chipExpiryMatch;
    });
  };

  const filtered = getFilteredItems();
  const pageCount = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearAllFilters = () => {
    setFilters({ id: "", client: "", assignee: "", area: "all", expiry: "all" });
    setSearchQuery("");
  };

  return (
    <div 
      id="local-db-trash-recycle-bin" 
      className={`min-h-screen font-sans p-2 sm:p-6 space-y-4 transition-colors duration-300 ${
        isDarkMode ? "bg-[#121212] text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      
      {/* Header Panel */}
      <div 
        id="local-db-header" 
        className={`flex items-center justify-between border-b pb-4 transition-colors ${
          isDarkMode ? "border-slate-850" : "border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border transition-colors ${
            isDarkMode 
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
              : "bg-rose-50 text-rose-600 border-rose-200"
          }`}>
            <Trash2 size={24} />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}>
              <span>Thùng rác hệ thống</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isDarkMode 
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                  : "bg-indigo-50 border-indigo-200 text-indigo-700"
              }`}>
                Local DB Mode (lawfirm.db)
              </span>
            </h1>
            <p className={`text-xs mt-1 hidden sm:block ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              {language === "vi" 
                ? "Hệ thống tương tác trực tiếp với cơ sở dữ liệu nội bộ lawfirm.db" 
                : "System interacts directly with the local database lawfirm.db"}
            </p>
          </div>
        </div>

        {/* Header Tools: Theme Toggle, Settings & Refresh */}
        <div className="flex items-center gap-2">
          {/* Light/Dark Mode Switcher Tool */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-bold ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:border-slate-600" 
                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs"
            }`}
            title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
          >
            {isDarkMode ? (
              <>
                <Sun size={15} className="text-amber-400 animate-spin-slow" />
                <span className="hidden md:inline">Giao diện sáng</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-indigo-600" />
                <span className="hidden md:inline">Giao diện tối</span>
              </>
            )}
          </button>

          <button 
            onClick={() => fetchRecycleBin(true)}
            className={`p-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700" 
                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-xs"
            }`}
            title="Làm mới dữ liệu"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Action Toolbar & Search Grid */}
      <div 
        id="local-db-toolbar" 
        className={`border rounded-xl p-3 space-y-3 shadow-sm transition-colors ${
          isDarkMode ? "bg-[#1a1a1a] border-slate-800/80" : "bg-white border-slate-200"
        }`}
      >
        
        {/* Row 1: Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-2">
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-2.5 h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Tìm kiếm trong thùng rác..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`pl-10 pr-4 py-2 w-full border rounded-lg text-xs font-medium focus:outline-none transition-colors ${
                isDarkMode 
                  ? "bg-[#242424] border-slate-700 text-slate-200 placeholder-slate-400 focus:border-slate-500" 
                  : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500"
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Clear filters */}
          {(searchQuery || Object.values(filters).some(v => v !== "" && v !== "all")) && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-rose-500/20"
            >
              <X size={14} />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Row 2: Chip filters style */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Chip filter 1: Mã hồ sơ */}
          <div className="relative">
            <button
              onClick={() => setActiveFilterChip(activeFilterChip === 'id' ? null : 'id')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${
                filters.id 
                  ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700 font-semibold')
                  : (isDarkMode ? 'bg-[#242424] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')
              }`}
            >
              <span>Mã hồ sơ: {filters.id || "Tất cả"}</span>
              <ChevronDown size={12} />
            </button>
            {activeFilterChip === 'id' && (
              <div className={`absolute left-0 mt-1 z-30 p-2 border rounded-lg shadow-xl w-48 space-y-2 ${
                isDarkMode ? 'bg-[#282828] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <input
                  type="text"
                  placeholder="Nhập mã..."
                  value={filters.id}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, id: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className={`w-full text-xs p-1.5 border rounded ${
                    isDarkMode ? 'bg-[#1e1e1e] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <button 
                  onClick={() => setActiveFilterChip(null)}
                  className={`w-full text-[10px] py-1 rounded font-bold ${
                    isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>

          {/* Chip filter 2: Khách hàng */}
          <div className="relative">
            <button
              onClick={() => setActiveFilterChip(activeFilterChip === 'client' ? null : 'client')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${
                filters.client 
                  ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700 font-semibold')
                  : (isDarkMode ? 'bg-[#242424] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')
              }`}
            >
              <span>Khách hàng: {filters.client || "Tất cả"}</span>
              <ChevronDown size={12} />
            </button>
            {activeFilterChip === 'client' && (
              <div className={`absolute left-0 mt-1 z-30 p-2 border rounded-lg shadow-xl w-48 space-y-2 ${
                isDarkMode ? 'bg-[#282828] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <input
                  type="text"
                  placeholder="Tên khách hàng..."
                  value={filters.client}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, client: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className={`w-full text-xs p-1.5 border rounded ${
                    isDarkMode ? 'bg-[#1e1e1e] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <button 
                  onClick={() => setActiveFilterChip(null)}
                  className={`w-full text-[10px] py-1 rounded font-bold ${
                    isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>

          {/* Chip filter 3: Người phụ trách */}
          <div className="relative">
            <button
              onClick={() => setActiveFilterChip(activeFilterChip === 'assignee' ? null : 'assignee')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${
                filters.assignee 
                  ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700 font-semibold')
                  : (isDarkMode ? 'bg-[#242424] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')
              }`}
            >
              <span>Người phụ trách: {filters.assignee || "Tất cả"}</span>
              <ChevronDown size={12} />
            </button>
            {activeFilterChip === 'assignee' && (
              <div className={`absolute left-0 mt-1 z-30 p-2 border rounded-lg shadow-xl w-48 space-y-2 ${
                isDarkMode ? 'bg-[#282828] border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <input
                  type="text"
                  placeholder="Tên nhân viên..."
                  value={filters.assignee}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, assignee: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className={`w-full text-xs p-1.5 border rounded ${
                    isDarkMode ? 'bg-[#1e1e1e] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <button 
                  onClick={() => setActiveFilterChip(null)}
                  className={`w-full text-[10px] py-1 rounded font-bold ${
                    isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>

          {/* Chip filter 4: Phân loại */}
          <div className="relative">
            <button
              onClick={() => setActiveFilterChip(activeFilterChip === 'area' ? null : 'area')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${
                filters.area !== "all"
                  ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700 font-semibold')
                  : (isDarkMode ? 'bg-[#242424] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')
              }`}
            >
              <span>Phân loại: {filters.area === "all" ? "Tất cả" : getPracticeAreaLabel(filters.area)}</span>
              <ChevronDown size={12} />
            </button>
            {activeFilterChip === 'area' && (
              <div className={`absolute left-0 mt-1 z-30 p-1 border rounded-lg shadow-xl w-48 text-xs ${
                isDarkMode ? 'bg-[#282828] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <button onClick={() => { setFilters(prev => ({ ...prev, area: "all" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Tất cả</button>
                <button onClick={() => { setFilters(prev => ({ ...prev, area: "tu_van" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Tư vấn Pháp luật</button>
                <button onClick={() => { setFilters(prev => ({ ...prev, area: "tranh_tung" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Tranh tụng</button>
                <button onClick={() => { setFilters(prev => ({ ...prev, area: "phap_che" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Pháp chế</button>
              </div>
            )}
          </div>

          {/* Chip filter 5: Hạn tự xóa */}
          <div className="relative">
            <button
              onClick={() => setActiveFilterChip(activeFilterChip === 'expiry' ? null : 'expiry')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${
                filters.expiry !== "all"
                  ? (isDarkMode ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700 font-semibold')
                  : (isDarkMode ? 'bg-[#242424] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')
              }`}
            >
              <span>Xóa lúc: {filters.expiry === "all" ? "Tất cả" : filters.expiry === "24h" ? "24 giờ qua" : filters.expiry === "48h" ? "48 giờ qua" : filters.expiry === "7d" ? "7 ngày qua" : "30 ngày qua"}</span>
              <ChevronDown size={12} />
            </button>
            {activeFilterChip === 'expiry' && (
              <div className={`absolute left-0 mt-1 z-30 p-1 border rounded-lg shadow-xl w-48 text-xs ${
                isDarkMode ? 'bg-[#282828] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <button onClick={() => { setFilters(prev => ({ ...prev, expiry: "all" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Mọi lúc</button>
                <button onClick={() => { setFilters(prev => ({ ...prev, expiry: "24h" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Trong 24 giờ qua</button>
                <button onClick={() => { setFilters(prev => ({ ...prev, expiry: "48h" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Trong 48 giờ qua</button>
                <button onClick={() => { setFilters(prev => ({ ...prev, expiry: "7d" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Trong 7 ngày qua</button>
                <button onClick={() => { setFilters(prev => ({ ...prev, expiry: "30d" })); setActiveFilterChip(null); }} className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-100'}`}>Trong 30 ngày qua</button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Master Actions bar */}
        <div className={`flex flex-wrap items-center justify-between gap-3 pt-2 border-t ${
          isDarkMode ? "border-slate-800" : "border-slate-200"
        }`}>
          <div className="flex items-center gap-2">
            
            {/* Toolbar Checkbox with Dropdown */}
            <div 
              ref={selectDropdownRef} 
              className={`relative inline-flex items-center border rounded-lg p-1 transition-colors ${
                isDarkMode ? "bg-[#242424] border-slate-700" : "bg-slate-50 border-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-slate-700 text-rose-500 focus:ring-0 bg-transparent ml-1 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setShowSelectDropdown(!showSelectDropdown)}
                className={`p-1 rounded ${
                  isDarkMode ? "hover:bg-slate-700 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                }`}
              >
                <ChevronDown size={14} />
              </button>

              {showSelectDropdown && (
                <div className={`absolute left-0 top-full mt-1.5 z-40 border rounded-xl shadow-2xl py-1.5 w-60 text-xs ${
                  isDarkMode ? "bg-[#282828] border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                }`}>
                  <button 
                    onClick={() => { handleSelectAll(); setShowSelectDropdown(false); }}
                    className={`w-full text-left px-4 py-2 font-medium ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                  >
                    Chọn tất cả
                  </button>
                  <button 
                    onClick={() => { handleSelectNone(); setShowSelectDropdown(false); }}
                    className={`w-full text-left px-4 py-2 font-medium ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                  >
                    Bỏ chọn tất cả
                  </button>
                  <div className={`border-t my-1 ${isDarkMode ? 'border-slate-850' : 'border-slate-100'}`}></div>
                  <div className={`px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Chọn nhanh theo mốc thời gian</div>
                  <button 
                    onClick={() => { handleSelectByTimeRange(24, "24 giờ qua"); setShowSelectDropdown(false); }}
                    className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                  >
                    Trong vòng 24 giờ qua
                  </button>
                  <button 
                    onClick={() => { handleSelectByTimeRange(48, "48 giờ qua"); setShowSelectDropdown(false); }}
                    className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                  >
                    Trong vòng 48 giờ qua
                  </button>
                  <button 
                    onClick={() => { handleSelectByTimeRange(168, "7 ngày qua"); setShowSelectDropdown(false); }}
                    className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                  >
                    Trong vòng 7 ngày qua
                  </button>
                  <button 
                    onClick={() => { handleSelectByTimeRange(720, "30 ngày qua"); setShowSelectDropdown(false); }}
                    className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                  >
                    Trong vòng 30 ngày qua
                  </button>
                  <button 
                    onClick={() => { setShowDateRangePicker(true); setShowSelectDropdown(false); }}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-700 font-bold flex items-center gap-1 text-blue-500`}
                  >
                    <Calendar size={12} />
                    Tùy chọn khoảng ngày...
                  </button>
                </div>
              )}
            </div>

            {/* ACTION TRIGGERS - Only fully active or stylized if entries selected */}
            <div className="flex items-center gap-1">
              
              {/* RESTORE ACTION MENU */}
              <div ref={restoreDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowRestoreDropdown(!showRestoreDropdown)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                    selectedIds.length > 0 
                      ? 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-600 dark:text-emerald-300' 
                      : (isDarkMode ? 'bg-[#242424] border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
                  }`}
                >
                  <RotateCcw size={14} />
                  <span>Khôi phục</span>
                  <ChevronDown size={12} />
                </button>

                {showRestoreDropdown && (
                  <div className={`absolute left-0 top-full mt-1.5 z-40 border rounded-xl shadow-2xl py-1.5 w-64 text-xs ${
                    isDarkMode ? "bg-[#282828] border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                  }`}>
                    <button
                      disabled={selectedIds.length === 0}
                      onClick={() => {
                        setShowRestoreDropdown(false);
                        const targets = items.filter(i => selectedIds.includes(i.id));
                        setConfirmModal({
                          show: true,
                          title: "Xác nhận khôi phục",
                          message: `Bạn có chắc chắn muốn khôi phục ${selectedIds.length} mục đã chọn về lại hệ thống?`,
                          onConfirm: () => executeRestoreItems(targets)
                        });
                      }}
                      className={`w-full text-left px-4 py-2 disabled:opacity-50 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Khôi phục các mục đã chọn ({selectedIds.length})
                    </button>
                    <button
                      onClick={() => {
                        setShowRestoreDropdown(false);
                        setConfirmModal({
                          show: true,
                          title: "Khôi phục toàn bộ",
                          message: "Khôi phục TẤT CẢ các hồ sơ và tài liệu trong thùng rác về lại hệ thống?",
                          onConfirm: () => executeRestoreItems(items)
                        });
                      }}
                      className={`w-full text-left px-4 py-2 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Khôi phục tất cả ({items.length})
                    </button>
                    <div className={`border-t my-1 ${isDarkMode ? 'border-slate-850' : 'border-slate-100'}`}></div>
                    <div className={`px-4 py-1 text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Khôi phục theo mốc thời gian</div>
                    <button
                      onClick={() => {
                        setShowRestoreDropdown(false);
                        const targets = getItemsByTimeThreshold(24);
                        setConfirmModal({
                          show: true,
                          title: "Xác nhận khôi phục",
                          message: `Khôi phục ${targets.length} mục đã xóa trong 24 giờ qua?`,
                          onConfirm: () => executeRestoreItems(targets)
                        });
                      }}
                      className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Xóa trong 24 giờ qua
                    </button>
                    <button
                      onClick={() => {
                        setShowRestoreDropdown(false);
                        const targets = getItemsByTimeThreshold(48);
                        setConfirmModal({
                          show: true,
                          title: "Xác nhận khôi phục",
                          message: `Khôi phục ${targets.length} mục đã xóa trong 48 giờ qua?`,
                          onConfirm: () => executeRestoreItems(targets)
                        });
                      }}
                      className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Xóa trong 48 giờ qua
                    </button>
                    <button
                      onClick={() => {
                        setShowRestoreDropdown(false);
                        const targets = getItemsByTimeThreshold(168);
                        setConfirmModal({
                          show: true,
                          title: "Xác nhận khôi phục",
                          message: `Khôi phục ${targets.length} mục đã xóa trong 7 ngày qua?`,
                          onConfirm: () => executeRestoreItems(targets)
                        });
                      }}
                      className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Xóa trong 7 ngày qua
                    </button>
                  </div>
                )}
              </div>

              {/* PERMANENT DELETE ACTION MENU */}
              <div ref={deleteDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeleteDropdown(!showDeleteDropdown)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                    selectedIds.length > 0 
                      ? 'bg-rose-600/20 hover:bg-rose-600/30 border-rose-500/40 text-rose-600 dark:text-rose-300' 
                      : (isDarkMode ? 'bg-[#242424] border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
                  }`}
                >
                  <Trash2 size={14} />
                  <span>Xóa vĩnh viễn</span>
                  <ChevronDown size={12} />
                </button>

                {showDeleteDropdown && (
                  <div className={`absolute left-0 top-full mt-1.5 z-40 border rounded-xl shadow-2xl py-1.5 w-64 text-xs ${
                    isDarkMode ? "bg-[#282828] border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                  }`}>
                    <button
                      disabled={selectedIds.length === 0}
                      onClick={() => {
                        setShowDeleteDropdown(false);
                        const targets = items.filter(i => selectedIds.includes(i.id));
                        setConfirmModal({
                          show: true,
                          title: "CẢNH BÁO: Xóa vĩnh viễn",
                          message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedIds.length} mục đã chọn? Hành động này KHÔNG THỂ khôi phục hay hoàn tác!`,
                          onConfirm: () => executeDeleteItems(targets)
                        });
                      }}
                      className={`w-full text-left px-4 py-2 font-semibold text-rose-500 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"} disabled:opacity-50`}
                    >
                      Xóa vĩnh viễn các mục đã chọn ({selectedIds.length})
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteDropdown(false);
                        setConfirmModal({
                          show: true,
                          title: "CẢNH BÁO: Dọn rác toàn bộ",
                          message: "Bạn có chắc muốn XÓA VĨNH VIỄN TOÀN BỘ hồ sơ và tài liệu trong thùng rác? Hệ thống sẽ trống hoàn toàn.",
                          onConfirm: () => executeDeleteItems(items)
                        });
                      }}
                      className={`w-full text-left px-4 py-2 font-semibold text-rose-500 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Xóa vĩnh viễn tất cả ({items.length})
                    </button>
                    <div className={`border-t my-1 ${isDarkMode ? 'border-slate-850' : 'border-slate-100'}`}></div>
                    <div className={`px-4 py-1 text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Xóa vĩnh viễn theo mốc</div>
                    <button
                      onClick={() => {
                        setShowDeleteDropdown(false);
                        const targets = getItemsByTimeThreshold(24);
                        setConfirmModal({
                          show: true,
                          title: "Cảnh báo mốc thời gian",
                          message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${targets.length} hồ sơ đã xóa trong 24 giờ qua?`,
                          onConfirm: () => executeDeleteItems(targets)
                        });
                      }}
                      className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Đã xóa trong 24 giờ qua
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteDropdown(false);
                        const targets = getItemsByTimeThreshold(48);
                        setConfirmModal({
                          show: true,
                          title: "Cảnh báo mốc thời gian",
                          message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${targets.length} hồ sơ đã xóa trong 48 giờ qua?`,
                          onConfirm: () => executeDeleteItems(targets)
                        });
                      }}
                      className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Đã xóa trong 48 giờ qua
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteDropdown(false);
                        const targets = getItemsByTimeThreshold(168);
                        setConfirmModal({
                          show: true,
                          title: "Cảnh báo mốc thời gian",
                          message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${targets.length} hồ sơ đã xóa trong 7 ngày qua? Hành động không thể hoàn tác.`,
                          onConfirm: () => executeDeleteItems(targets)
                        });
                      }}
                      className={`w-full text-left px-4 py-1.5 ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
                    >
                      Đã xóa trong 7 ngày qua
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side counters & navigation page controls */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {selectedIds.length > 0 && (
              <span className={`font-semibold border px-2 py-0.5 rounded-md ${
                isDarkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                Đã chọn {selectedIds.length}/{filtered.length}
              </span>
            )}
            
            {/* Pagination Controls */}
            {pageCount > 1 && (
              <div className={`flex items-center gap-2 border-l pl-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <span>{currentPage}/{pageCount}</span>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={`p-1 disabled:opacity-30 rounded cursor-pointer ${
                    isDarkMode ? 'hover:bg-[#242424] text-slate-300' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  disabled={currentPage === pageCount}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                  className={`p-1 disabled:opacity-30 rounded cursor-pointer ${
                    isDarkMode ? 'hover:bg-[#242424] text-slate-300' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning Banner under Toolbar */}
      <div 
        id="local-db-banner" 
        className={`border rounded-lg p-3 flex items-center justify-between text-xs shadow-xs animate-in fade-in duration-300 ${
          isDarkMode 
            ? "bg-[#2a1b1b] border-rose-950/40 text-rose-300" 
            : "bg-rose-50 border-rose-100 text-rose-800"
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className={`${isDarkMode ? 'text-rose-400' : 'text-rose-600'} shrink-0`} />
          <span>
            Hồ sơ trong Thùng rác sẽ tự động xóa vĩnh viễn sau <strong className={`${isDarkMode ? 'text-rose-200' : 'text-rose-900'}`}>30 ngày</strong> kể từ lúc xóa.
          </span>
        </div>
        <button
          onClick={() => {
            setConfirmModal({
              show: true,
              title: "Dọn sạch thùng rác",
              message: "Hệ thống sẽ xóa vĩnh viễn TẤT CẢ mục trong thùng rác ngay lập tức. Bạn chắc chắn chứ?",
              onConfirm: () => executeDeleteItems(items)
            });
          }}
          className={`font-bold underline transition-colors cursor-pointer shrink-0 ml-4 text-[11px] ${
            isDarkMode ? "text-rose-400 hover:text-white" : "text-rose-700 hover:text-rose-900"
          }`}
        >
          [Dọn sạch thùng rác ngay]
        </button>
      </div>

      {/* Date Range Picker Modal Popup */}
      {showDateRangePicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
          <div className={`border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl ${
            isDarkMode ? "bg-[#242424] border-slate-700" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Chọn khoảng ngày xóa
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full text-xs p-2 border rounded-lg ${
                    isDarkMode ? "bg-[#1e1e1e] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full text-xs p-2 border rounded-lg ${
                    isDarkMode ? "bg-[#1e1e1e] border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDateRangePicker(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  isDarkMode ? "bg-[#1e1e1e] hover:bg-slate-850 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                Hủy
              </button>
              <button
                onClick={handleSelectByDateRange}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white shadow-md"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List items representation (Local DB row style) */}
      <div 
        id="local-db-list-rows-container" 
        className={`border rounded-xl overflow-hidden shadow-xs divide-y transition-colors ${
          isDarkMode 
            ? "border-slate-800 bg-[#181818] divide-slate-800/60" 
            : "border-slate-200 bg-white divide-slate-100"
        }`}
      >
        
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-medium">Đang tải và cập nhật trạng thái thùng rác...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          /* Empty state representation */
          <div className="py-28 text-center max-w-sm mx-auto space-y-4">
            <div className={`w-16 h-16 border rounded-full flex items-center justify-center mx-auto shadow-inner ${
              isDarkMode ? 'bg-slate-800/40 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <Trash2 size={28} />
            </div>
            <div className="space-y-1">
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {language === "vi" ? "Không có hồ sơ nào trong thùng rác" : "No records in trash"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed px-4">
                {language === "vi" 
                  ? "Các tài liệu hoặc hồ sơ bị xóa tạm thời sẽ hiện ở đây để lưu trữ tối đa trong 30 ngày."
                  : "Temporarily deleted documents or records will appear here for a maximum of 30 days."}
              </p>
            </div>
          </div>
        ) : (
          paginatedItems.map((item) => {
            const isFile = item.originalTable === "files";
            const isChannel = item.originalTable === "chat_channels";
            const r = item.data || {};
            const countdown = calculateTimeRemaining(item.deletedAt);
            const isSelected = selectedIds.includes(item.id);

            // Row dynamic classes based on selection & theme
            return (
              <div
                key={item.id}
                id={`local-db-row-${item.id}`}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 transition-all relative border-l-2 ${
                  isSelected 
                    ? (isDarkMode ? 'bg-rose-950/10 border-rose-500' : 'bg-rose-50 border-rose-500') 
                    : (isDarkMode ? 'hover:bg-slate-800/30 border-transparent' : 'hover:bg-slate-50 border-transparent')
                }`}
              >
                {/* Left section: Checkbox, Trash Icon, ID, badge & Content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  
                  {/* Select row Checkbox */}
                  <div className="flex items-center pt-1 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(item.id)}
                      className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-0 bg-transparent cursor-pointer"
                    />
                  </div>

                  {/* Document Type Icon */}
                  <div className={`pt-0.5 shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isFile ? (
                      <FileText size={16} className="text-blue-500" />
                    ) : isChannel ? (
                      <Hash size={16} className="text-indigo-500" />
                    ) : (
                      <Tag size={16} className="text-teal-500" />
                    )}
                  </div>

                  {/* Main contents details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    
                    {/* Header meta line */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Bold ID (Sender analogy) */}
                      <span className={`font-mono text-xs font-bold hover:underline cursor-pointer ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        {item.id}
                      </span>
                      
                      {/* Classification Badge */}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                        isDarkMode 
                          ? 'bg-slate-800 text-slate-300 border-slate-700' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isFile ? "Tệp tài liệu" : isChannel ? "Kênh thảo luận" : getPracticeAreaLabel(r.practice_area)}
                      </span>
                    </div>

                    {/* Bold Title */}
                    <h4 className={`text-xs font-bold line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {isFile ? r.filename : isChannel ? (r.name || r.title || `Kênh ${item.id}`) : (r.title || r.description || `Hồ sơ ${item.id}`)}
                    </h4>

                    {/* Snippet connecting fields with spacer */}
                    <p className={`text-[11px] line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isFile ? (
                        <>Hồ sơ: <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{r.case_id}</span> · Người xóa: <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{item.deletedBy || "N/A"}</span></>
                      ) : isChannel ? (
                        <>
                          Phân loại: <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{r.category || "Chung"}</span> · 
                          {r.description ? ` Mô tả: ${r.description} · ` : " "}
                          Người xóa: <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{item.deletedBy || "N/A"}</span>
                        </>
                      ) : (
                        <>
                          KH: <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{r.client || "Không rõ"}</span> · 
                          Người phụ trách: <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{r.mainAssignee || "N/A"}</span> · 
                          Phí dịch vụ: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{(r.feeAmount || 0).toLocaleString("vi-VN")} VNĐ</span>
                        </>
                      )}
                    </p>

                    {/* Display deletion date explicitly */}
                    <span className={`inline-block text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Xóa lúc: {new Date(item.deletedAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Right section: Countdown or actions on hover */}
                <div className="flex items-center justify-end shrink-0 gap-3 mt-3 sm:mt-0 pl-7 sm:pl-4">
                  
                  {/* Default State: Countdown status display */}
                  <div className="block group-hover:hidden transition-all text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Clock size={12} className={`
                        ${countdown.color === 'red' ? 'text-red-500 animate-pulse' : ''}
                        ${countdown.color === 'orange' ? 'text-amber-500' : ''}
                        ${countdown.color === 'slate' ? (isDarkMode ? 'text-slate-500' : 'text-slate-400') : ''}
                      `} />
                      <span className={`text-[11px] font-bold tracking-tight
                        ${countdown.color === 'red' ? 'text-red-500 font-extrabold' : ''}
                        ${countdown.color === 'orange' ? 'text-amber-600 dark:text-amber-400' : ''}
                        ${countdown.color === 'slate' ? (isDarkMode ? 'text-slate-300' : 'text-slate-600') : ''}
                      `}>
                        {countdown.text}
                      </span>
                    </div>
                  </div>

                  {/* Active/Hover State: Action shortcuts (Restore / Erase) */}
                  <div className="hidden group-hover:flex items-center gap-1 transition-all">
                    <button
                      disabled={actioningId !== null}
                      onClick={() => executeRestoreItems([item])}
                      className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                        isDarkMode 
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
                          : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600"
                      }`}
                      title="Khôi phục mục này"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      disabled={actioningId !== null}
                      onClick={() => {
                        setConfirmModal({
                          show: true,
                          title: "CẢNH BÁO: Xóa vĩnh viễn",
                          message: `Bạn chắc chắn muốn XÓA VĨNH VIỄN hồ sơ ${item.id}? Trạng thái này không thể phục hồi!`,
                          onConfirm: () => executeDeleteItems([item])
                        });
                      }}
                      className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                        isDarkMode 
                          ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400" 
                          : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                      }`}
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Global Toast with interactive Undo option */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 border px-5 py-4 rounded-xl shadow-2xl flex items-center justify-between gap-5 z-[120] animate-in slide-in-from-bottom-5 duration-300 max-w-sm w-full ${
          isDarkMode ? "bg-[#282828] border-slate-700 text-white" : "bg-slate-900 border-slate-800 text-white"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shrink-0" />
            <span className="text-xs font-semibold text-slate-100">{toastMessage}</span>
          </div>
          {toastUndoAction && (
            <button
              onClick={handleUndo}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Undo2 size={12} />
              Hoàn tác
            </button>
          )}
        </div>
      )}

      {/* Confirmation Backdrop & Dialog Modal */}
      {confirmModal && confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-[130] p-4 animate-fade-in">
          <div className={`border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl transition-colors ${
            isDarkMode ? "bg-[#1e1e1e] border-slate-800" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{confirmModal.title}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{confirmModal.message}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md transition-all"
              >
                Xác nhận thực hiện
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
