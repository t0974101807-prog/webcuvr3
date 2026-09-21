 import React, { useState, useEffect, useRef, useMemo } from "react";
import DocumentScanner from "./DocumentScanner";
import {
  ModuleErrorBoundary,
  DatePickerInput,
  YeastarSoftphone,
  RealtimeMonitoringDashboard,
  EnhancedStatisticsView,
  DossierBrainCenter,
  ContractsView,
  CustomCalendar,
  ERPRecordCaseDetails,
  SpecializedRecordsView,
  RecycleBinView,
  ActivityLogsView,
  ERPRecordFilters,
  ERPRecordToolbar,
  ERPRecordHeader,
  ERPRecordStatusBar,
  ERPRecordGridView,
  ERPRecordListView,
  ERPRecordBasicInfo,
  ERPRecordContractInfo,
  ERPRecordWorkContent,
  ERPRecordStatusCase,
  ERPRecordDocumentSections,
  ERPContractDetailsModal,
  ERPDeleteConfirmModal,
  ERPAIAnalysisModal,
  ERPChatModals,
  ERPProfileEditModal,
  ERPMeetingRoomModals,
  QRProfileManager,
  LegalDocumentsManager,
  ToolsPage,
  SupervisionDashboard,
  ExecutiveDashboard,
  SecurityView,
  CccdOcrScanner,
  FinanceManagementView,
  ConsultationCenter,
  CallCenterAnalytics,
  KenhChatView,
  AITrainingStudio,
  VideoMeetingModal,
  IotSmartGateway,
  GlobalSearch,
  SyncStatusDashboard,
  CompanySettingsView,
  ErpLegalMeetingWorkspace,
  MemoryMonitorView,
  LiveChatModal,
  InternalChatModal,
} from "./erp/ERPModuleRegistry";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Camera,
  Briefcase,
  FileText,
  DollarSign,
  Calculator,
  Upload,
  MessageSquare,
  LogOut,
  Shield,
  FileSearch,
  Activity,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  CalendarDays,
  FolderOpen,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  FileType,
  Bell,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Filter,
  Download,
  UploadCloud,
  MoreVertical,
  CheckCircle2,
  Landmark,
  XCircle,
  Clock,
  PieChart,
  Globe,
  Award,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  Share2,
  Copy,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Save,
  Printer,
  MapPin,
  Map,
  Building2,
  Phone,
  Eye,
  Send,
  Star,
  ArrowLeft,
  ArrowRightLeft,
  Inbox,
  Trello,
  FileCheck,
  Scale,
  Gavel,
  BookOpen,
  BellRing,
  FileSignature,
  Wand2,
  TrendingUp,
  Image as ImageIcon,
  Video,
  Paperclip,
  AlertTriangle,
  CheckCircle,
  QrCode,
  Info,
  Loader2,
  Database,
  Zap,
  Sparkles,
  Moon,
  Sun,
  Cpu,
  Server,
  Maximize2,
  Minimize2,
  Bot,
  History,
} from "lucide-react";
import { useFullscreen } from "../hooks/useFullscreen";
import { mapRoleToDb } from "../utils/role";
import { filterNonAdminPersonnel, formatPersonnelLabel, isAdminAccount } from "../utils/personnelFilters";
import Markdown from "react-markdown";
import JSZip from "jszip";
import html2canvas from "html2canvas";
import {
  handleDownloadContract,
  processUploadedContract,
} from "../utils/contractUtils";
import { Views } from "react-big-calendar";
import { format } from "date-fns";
import { BigCalendarComponent, cn, localizer } from "./erp/erpUiHelpers";
import { numberToWords } from "../utils/numberToWords";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";
import {
  BRANCH_OPTIONS,
  CATEGORY_OPTIONS,
  CONSULTING_STEP_OPTIONS,
  COURT_OPTIONS,
  DOMAIN_OPTIONS,
  GENDER_OPTIONS,
  PRIORITY_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  STEP_OPTIONS,
  Combobox,
} from "./erp/ERPFormControls";
import { api } from "./erp/erpApi";
import { NavItem } from "./erp/NavItem";
import ERPWorkspaceFullscreenToolbar from "./erp/ERPWorkspaceFullscreenToolbar";
import { getERPTabTitle } from "./erp/erpTabTitles";
import { getAllowedERPModules, getFirstLegalPracticeModule } from "./erp/erpAccess";
import { formatUserDisplayName, getUserTitleWithPracticeAreas, translateRole } from "./erp/erpUserFormatters";
export { translateRole } from "./erp/erpUserFormatters";
import { calculateFullPayroll, calculatePayrollTaxes } from "./erp/payrollCalculations";
import {
  DEFAULT_BRANCH_OPTIONS,
  filterPersonnelByBranch,
  isManagerLikePersonnel,
  isStaffLikePersonnel,
  isUserInBranch,
  normalizeBranchName,
} from "./erp/branchHelpers";
import {
  buildLegalCaseAnalysisPrompt,
  formatMoneyNumber,
  getRemainingPaymentValue,
  syncContractDetailsFromClientData,
} from "./erp/erpDomainHelpers";
import {
  dedupeRecordsById,
  filterDeletedRecords,
} from "./erp/recordHelpers";
import { formatCaseCode, formatDisplayDate } from "./erp/erpFormatters";
import { getLunarDate } from "./erp/lunarDate";
import {
  getRevenueValue,
  sumRecordRevenue,
} from "./erp/financeHelpers";
import {
  canUserDeleteRecord,
  canUserEditRecord,
  checkPersonalAccess as isPersonalAccessAllowed,
  getRecordRevenueValue,
  isRecordOverdue,
  matchesRecordSearch,
} from "./erp/recordAccessHelpers";
import { getRecordBlacklistViolations } from "./erp/blacklist";

interface ERPProps {
  onBack: () => void;
  user: {
    id: number;
    username: string;
    name: string;
    role?: string;
    title?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    dob?: string;
    gender?: string;
    address?: string;
    practice_areas?: string;
    [key: string]: any;
  } | null;
  onProfileClick?: () => void;
  onUpdateUser?: (user: any) => void;
  onChangePasswordClick?: () => void;
}

export const syncToFirebase = async (record: any) => {
  // ERP mutations are persisted through the authenticated API before this helper is called.
  return record;
};


function getGreetingText(user: any, language: string = 'vi') {
  if (!user) return language === 'vi' ? "Kính chào Quý khách" : "Welcome, Guest";
  const displayName = formatUserDisplayName(user);
  if (language === 'vi') {
    return `Xin chào, ${displayName || user.name || "Quản trị viên"}`;
  } else {
    return `Hello, ${displayName || user.name || "Administrator"}`;
  }
}

export default function ERP({ onBack, user, onProfileClick, onUpdateUser }: ERPProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeModule, setActiveModule] = useState<string>("tranh_tung");
  const [isTabFS, setIsTabFS] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTabFS(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setIsTabFS(false);
  }, [activeTab]);

  const allowedModules = useMemo(() => {
    return getAllowedERPModules(user);
  }, [user]);

  useEffect(() => {
    if (allowedModules.length > 0 && !allowedModules.includes(activeModule)) {
      setActiveModule(allowedModules[0]);
    }
  }, [allowedModules, activeModule]);

  // Auto-redirect legal practice staff (Phòng Nghiệp vụ: tư vấn, tranh tụng, đại diện ngoài tố tụng, nội bộ, trọng tài/hòa giải) to their dossier view
  useEffect(() => {
    if (user) {
      const r = String(user.role).toLowerCase().trim();
      const isAdminOrDir = ["admin", "quản trị viên", "director", "giám đốc", "deputydirector", "deputy_director", "phó giám đốc", "controller", "kiểm soát viên"].includes(r);
      if (!isAdminOrDir) {
        const matchedModule = getFirstLegalPracticeModule(user);

        if (matchedModule) {
          setActiveModule(matchedModule);
          if (matchedModule === "tranh_tung") {
            setActiveTab("records");
          } else {
            setActiveTab("specialized_records");
          }
        } else if (user.department && user.department.includes("Nghiệp vụ")) {
          setActiveModule("tranh_tung");
          setActiveTab("records");
        }
      }
    }
  }, [user]);
  const [showVideoMeetingModal, setShowVideoMeetingModal] = useState(false);
  const [videoMeetingTheme, setVideoMeetingTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("video_meeting_theme_mode");
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    return "light";
  });

  const [meetingRooms, setMeetingRooms] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('legal_meeting_rooms_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [selectedMeetingRoom, setSelectedMeetingRoom] = useState<any>(null);
  const [roomToDelete, setRoomToDelete] = useState<any>(null);
  const [newRoomData, setNewRoomData] = useState({
    code: '',
    title: '',
    desc: '',
    status: '🟢 Đang mở'
  });

  const handleConfirmDeleteRoom = () => {
    if (!roomToDelete) return;
    const updated = meetingRooms.filter(r => r.id !== roomToDelete.id);
    setMeetingRooms(updated);
    try {
      localStorage.setItem('legal_meeting_rooms_v1', JSON.stringify(updated));
    } catch (e) {}
    alert(language === "vi" ? `Đã xóa phòng họp ${roomToDelete.code} khỏi cơ sở dữ liệu!` : `Deleted meeting room ${roomToDelete.code}!`);
    setRoomToDelete(null);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomData.title.trim()) return;
    const roomCode = newRoomData.code.trim() || `LEGAL-ROOM-0${meetingRooms.length + 1}`;
    const statusBg = 
      newRoomData.status.includes('Đang mở') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
      newRoomData.status.includes('Trực ban') ? 'bg-blue-100 text-blue-700 border-blue-200' :
      'bg-purple-100 text-purple-700 border-purple-200';

    const newRoom = {
      id: `ROOM-${Date.now()}`,
      code: roomCode,
      title: newRoomData.title.trim(),
      desc: newRoomData.desc.trim() || 'Phòng họp tư vấn trực tuyến chuyên dụng',
      status: newRoomData.status,
      statusClass: statusBg
    };

    const updated = [...meetingRooms, newRoom];
    setMeetingRooms(updated);
    try {
      localStorage.setItem('legal_meeting_rooms_v1', JSON.stringify(updated));
    } catch (e) {}
    setShowAddRoomModal(false);
    setNewRoomData({ code: '', title: '', desc: '', status: '🟢 Đang mở' });
  };
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("lawfirm_theme_mode");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleGlobalThemeEvent = (e: any) => {
      if (e.detail && typeof e.detail.isDarkMode === "boolean") {
        if (e.detail.isDarkMode !== isDarkMode) {
          setIsDarkMode(e.detail.isDarkMode);
        }
      }
    };
    window.addEventListener("global-theme-changed", handleGlobalThemeEvent);
    return () => window.removeEventListener("global-theme-changed", handleGlobalThemeEvent);
  }, [isDarkMode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("lawfirm_theme_mode", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("lawfirm_theme_mode", "light");
    }
    window.dispatchEvent(new CustomEvent("global-theme-changed", { detail: { isDarkMode } }));
  }, [isDarkMode]);

  const [activeUserWarnings, setActiveUserWarnings] = useState<any[]>([]);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showAttendanceToast, setShowAttendanceToast] = useState(false);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [profileEditData, setProfileEditData] = useState({
    name: "",
    title: "",
    avatar: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    address: ""
  });

  useEffect(() => {
    if (user) {
      setProfileEditData({
        name: user.name || "",
        title: user.title || "",
        avatar: user.avatar || "",
        phone: user.phone || "",
        email: user.email || "",
        dob: user.dob || "",
        gender: user.gender || "",
        address: user.address || ""
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user?.name) return;
    const fetchUserWarnings = () => {
      try {
        const saved = localStorage.getItem("supervision_staff_warnings");
        if (saved) {
          const allWarns = JSON.parse(saved);
          const userWarns = allWarns.filter(
            (w: any) => user?.name && w.staffName.toLowerCase().trim() === user.name.toLowerCase().trim() && !w.acknowledged
          );
          setActiveUserWarnings(userWarns);
        }
      } catch (e) {
        console.warn("Error reading warnings in ERP:", e);
      }
    };

    fetchUserWarnings();
    const interval = setInterval(fetchUserWarnings, 5000);
    return () => clearInterval(interval);
  }, [user?.name]);

  const handleAcknowledgeWarningInERP = (warnId: string) => {
    try {
      const saved = localStorage.getItem("supervision_staff_warnings");
      if (saved) {
        const allWarns = JSON.parse(saved);
        const updated = allWarns.map((w: any) => {
          if (w.id === warnId) {
            return { ...w, acknowledged: true, acknowledgedAt: new Date().toISOString() };
          }
          return w;
        });
        localStorage.setItem("supervision_staff_warnings", JSON.stringify(updated));
        setActiveUserWarnings(updated.filter(
          (w: any) => user?.name && w.staffName.toLowerCase().trim() === user.name.toLowerCase().trim() && !w.acknowledged
        ));
        alert(language === "vi" 
          ? "Đã ký biên bản cam kết khắc phục thành công!" 
          : "Commitment to correction signed successfully!");
      }
    } catch (e) {
      console.error(e);
    }
  };
  const [activeLegalToolsTab, setActiveLegalToolsTab] = useState("fee");
  const [isLegalToolsExpanded, setIsLegalToolsExpanded] = useState(true);
  const [supervisionSearchQuery, setSupervisionSearchQuery] = useState("");
  const [selectedSupervisionDossierId, setSelectedSupervisionDossierId] = useState("");
  const [controllerFeedbackText, setControllerFeedbackText] = useState<Record<string, string>>({});
  const [mediationExpls, setMediationExpls] = useState<Record<string, string>>({});
  const [mediationUnlocked, setMediationUnlocked] = useState<Record<string, boolean>>({});
  const [activePillarTab, setActivePillarTab] = useState("pillar1");
  const [aiInitialPrompt, setAiInitialPrompt] = useState("");
  const isLawyerOrBelow = useMemo(() => {
    if (!user) return true;
    const r = String(user.role).toLowerCase();
    return ["lawyer", "specialist", "legal_associate", "trainee_lawyer", "legal_intern", "consultant", "user"].includes(r) || 
           ["luật sư", "chuyên viên pháp lý", "trợ lý pháp lý", "biên tập viên", "luật sư tập sự", "thực tập sinh", "nhân viên tư vấn", "người dùng"].includes(r);
  }, [user]);
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedSortBy, setSelectedSortBy] = useState("newest");
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [headerInfo, setHeaderInfo] = useState<{title: string, subtitle: React.ReactNode, rightContent?: React.ReactNode} | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);
  const [contractToView, setContractToView] = useState<{
    record: any;
    type: "HĐDVPL" | "HĐUQ";
  } | null>(null);
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("erp_notifications_v3");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem("erp_notifications_v3", JSON.stringify(notifications));
  }, [notifications]);

  const [showReminder, setShowReminder] = useState(false);
  const [unreadLiveMessages, setUnreadLiveMessages] = useState(0);
  const [unreadInternalChats, setUnreadInternalChats] = useState<Record<string, number>>({});
  const [totalUnreadInternal, setTotalUnreadInternal] = useState(0);

  const [language, setLanguage] = useState<"vi" | "en">(() => {
    try {
      const saved = localStorage.getItem("erp_user_settings");
      if (saved) {
        return JSON.parse(saved).language || "vi";
      }
    } catch (e) {}
    return "vi";
  });

  const [records, setRecords] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [autoLoadCount, setAutoLoadCount] = useState<number>(0);
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  async function fetchRecords(reset: boolean = true) {
    try {
      setIsLoadingMore(true);
      if (reset) {
        setAutoLoadCount(0);
      } else {
        setAutoLoadCount((prev) => prev + 1);
      }
      const cursorToUse = reset ? "" : (nextCursor || "");
      const limit = itemsPerPage || 20;

      const params = new URLSearchParams({
        limit: String(limit),
        cursor: cursorToUse,
        q: searchQuery || "",
        category: selectedCategory || "",
        branch: selectedBranch || "",
        mainAssignee: selectedAssignee || "",
        status: selectedStatus || "",
        priority: selectedPriority || "",
        activeTab: activeTab || "",
        sortBy: selectedSortBy || "newest"
      });

      const response = await api.req(`/api/erp-records?${params.toString()}`);
      if (response && response.success) {
        const newRecords = dedupeRecordsById(response.data || []);
        
        // Healing: if the server returns active records, they are not deleted.
        // Remove their IDs from deletedRecordIds and localStorage to prevent stale filter issues.
        if (newRecords.length > 0) {
          const activeIds = newRecords.map((r: any) => String(r.id));
          setDeletedRecordIds((prev) => {
            const next = prev.filter((id) => !activeIds.includes(id));
            if (next.length !== prev.length) {
              try {
                localStorage.setItem("erp_deleted_record_ids", JSON.stringify(next));
              } catch {}
            }
            return next;
          });
        }

        setRecords((prev) => {
          if (reset) {
            return dedupeRecordsById(newRecords);
          } else {
            const existingIds = new Set(prev.map(r => r.id));
            const filteredNew = newRecords.filter((r: any) => !existingIds.has(r.id));
            return dedupeRecordsById([...prev, ...filteredNew]);
          }
        });
        setNextCursor(response.pagination?.nextCursor || null);
        setHasNextPage(response.pagination?.hasNextPage || false);
      }
    } catch (err) {
      console.error("Failed to load paginated records:", err);
    } finally {
      setIsLoadingMore(false);
      setIsInitialLoadDone(true);
    }
  }

  const fetchRecordsRef = useRef(fetchRecords);
  fetchRecordsRef.current = fetchRecords;

  useEffect(() => {
    if (!hasNextPage || isLoadingMore) return;
    if (autoLoadCount >= 5) return; // Cap auto infinite scroll to prevent runaways

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchRecords(false);
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isLoadingMore, autoLoadCount, nextCursor]);

  const renderLoadMoreControls = (displayCount?: number) => {
    const uniqueRecordCount = displayCount ?? dedupeRecordsById(records).length;
    if (!hasNextPage && uniqueRecordCount === 0) return null;

    return (
      <div id="records_load_more_container" className="mt-8 mb-4 flex flex-col items-center justify-center gap-3 py-6 border-t border-slate-100 bg-slate-50/20 rounded-2xl p-4">
        {/* Infinite Scroll Sentinel element */}
        {hasNextPage && <div ref={observerTargetRef} className="h-2 w-full" />}

        <div className="text-sm text-slate-500 font-medium">
          {language === "vi" 
            ? `Đang hiển thị ${uniqueRecordCount} hồ sơ` 
            : `Showing ${uniqueRecordCount} records`
          }
        </div>

        {isLoadingMore && (
          <div className="w-full max-w-md py-4 space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200/70 rounded-lg w-3/4 mx-auto"></div>
            <div className="h-3 bg-slate-200/50 rounded-lg w-1/2 mx-auto"></div>
            <div className="flex justify-center gap-2 pt-2">
              <div className="w-2.5 h-2.5 bg-[#0a2d37]/30 rounded-full animate-bounce"></div>
              <div className="w-2.5 h-2.5 bg-[#0a2d37]/30 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2.5 h-2.5 bg-[#0a2d37]/30 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        {hasNextPage ? (
          autoLoadCount >= 5 ? (
            <div className="flex flex-col items-center gap-2 text-center max-w-sm mt-2">
              <span className="text-xs text-slate-400 font-semibold italic">
                {language === "vi"
                  ? "ⓘ Cuộn tự động tạm dừng để tối ưu hóa hiệu năng"
                  : "ⓘ Auto-scroll paused to optimize performance"}
              </span>
              <button
                onClick={() => {
                  setAutoLoadCount(0); // Reset count so they can scroll again
                  fetchRecords(false);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient hover:opacity-90 active:scale-95 text-white rounded-xl shadow-md font-semibold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                {language === "vi" ? "Tải thêm hồ sơ" : "Load More Records"}
              </button>
            </div>
          ) : (
            !isLoadingMore && (
              <button
                onClick={() => fetchRecords(false)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{language === "vi" ? "Tải thêm hồ sơ" : "Load More Records"}</span>
              </button>
            )
          )
        ) : (
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-2">
            {language === "vi" ? "✓ Đã tải đầy đủ hồ sơ từ máy chủ" : "✓ All records loaded from server"}
          </div>
        )}
      </div>
    );
  };

  const [deletedRecordIds, setDeletedRecordIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("erp_deleted_record_ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [trashToast, setTrashToast] = useState<{
    message: string;
    recordId: string;
    recordData: any;
    type: 'delete' | 'restore';
  } | null>(null);

  useEffect(() => {
    if (trashToast) {
      const timer = setTimeout(() => {
        setTrashToast(null);
      }, 7000); // Auto-hide after 7 seconds
      return () => clearTimeout(timer);
    }
  }, [trashToast]);

  const handleUndoTrash = async (recordId: string, recordData: any) => {
    try {
      const strId = String(recordId);
      
      // Remove from deleted list
      setDeletedRecordIds((prev) => {
        const next = prev.filter((x) => String(x) !== strId);
        try {
          localStorage.setItem("erp_deleted_record_ids", JSON.stringify(next));
        } catch {}
        return next;
      });

      // Execute server-side restore
      try {
        await api.req(`/api/recycle-bin/${strId}/restore`, "POST");
      } catch (err) {
        console.warn("Server restore API warning:", err);
      }

      // Re-add to local state if missing
      if (recordData) {
        setRecords((prev) => {
          if (prev.some((r) => String(r.id) === strId)) return prev;
          return [recordData, ...prev];
        });
      }

      setTrashToast({
        message: language === "vi" ? "Đã khôi phục hồ sơ thành công!" : "Undo successful! Record restored.",
        recordId: strId,
        recordData: null,
        type: 'restore'
      });
    } catch (err) {
      console.error("Failed to undo delete:", err);
    }
  };

  const deletedRecordIdsRef = useRef<string[]>([]);
  deletedRecordIdsRef.current = deletedRecordIds;

  useEffect(() => {
    try {
      localStorage.setItem("erp_deleted_record_ids", JSON.stringify(deletedRecordIds));
    } catch {}
  }, [deletedRecordIds]);

  const mergeRecords = (data: any[], customDeletedIds?: string[]) => {
    const activeDeletedIds = customDeletedIds || deletedRecordIdsRef.current;
    const unique = dedupeRecordsById(data);
    return filterDeletedRecords(unique, activeDeletedIds);
  };

  const dynamicBranchOptions = useMemo(() => {
    if (offices && offices.length > 0) {
      return offices.map((o: any) => normalizeBranchName(o.name));
    }
    return DEFAULT_BRANCH_OPTIONS;
  }, [offices]);

  const updateRecords = (newRecords: any[], recordsToSync?: any | any[], deletedId?: string) => {
    let currentDeletedIds = deletedRecordIds;
    if (deletedId) {
      const deletedStr = String(deletedId);
      const targetRec =
        recordsToSync && typeof recordsToSync === "object" && !Array.isArray(recordsToSync)
          ? recordsToSync
          : records.find(
              (r) =>
                String(r.id) === deletedStr ||
                String(r.contractId) === deletedStr ||
                String(r.systemId) === deletedStr
            );

      const allTargetIds = [
        deletedStr,
        targetRec?.id && String(targetRec.id),
        targetRec?.contractId && String(targetRec.contractId),
        targetRec?.systemId && String(targetRec.systemId)
      ].filter(Boolean) as string[];

      const nextDeletedIds = Array.from(new Set([...deletedRecordIds, ...allTargetIds]));
      currentDeletedIds = nextDeletedIds;
      setDeletedRecordIds(nextDeletedIds);
      try {
        localStorage.setItem("erp_deleted_record_ids", JSON.stringify(nextDeletedIds));
      } catch {}
      
      api.req(`/api/erp-records/${deletedStr}`, "DELETE", {
        data: targetRec,
        reason: "Người dùng thực hiện xóa hồ sơ"
      })
        .then(() => {
          console.log("Successfully soft-deleted record on server via updateRecords:", deletedStr);
        })
        .catch((err: any) => {
          console.warn("Failed to soft-delete record on server via updateRecords:", deletedStr, err);
          
          // Revert deletedRecordIds and re-fetch to restore record in UI
          setDeletedRecordIds((prev) => {
            const next = prev.filter(id => id !== deletedStr);
            try {
              localStorage.setItem("erp_deleted_record_ids", JSON.stringify(next));
            } catch {}
            
            api.req("/api/erp-records")
              .then((data) => {
                if (data && Array.isArray(data)) {
                  const unique = mergeRecords(data, next);
                  setRecords(unique);
                }
              })
              .catch(() => {});
              
            return next;
          });

          // Show specific error from backend constraints
          alert(err.message || "Không thể thực hiện thao tác xóa hồ sơ do vi phạm ràng buộc dữ liệu hoặc lỗi phân quyền.");
        });
    }
    const mergedRecords = mergeRecords(newRecords, currentDeletedIds);
    const newlyAdded = isInitialLoadDone ? mergedRecords.filter(nr => !records.some(r => r.id === nr.id)) : [];
    
    setRecords(mergedRecords);
    
    if (newlyAdded.length > 0) {
      setTimeout(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        const timeString = new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN");
        
        newlyAdded.forEach(nr => {
          if (nr.viewed === false) {
            // 1. Create Calendar Event mapped/synced to this record
            const mappedEvent = {
              id: Date.now() + Math.random(),
              title: `${nr.category}: ${nr.title}`,
              date: todayStr,
              startDate: todayStr,
              start: "09:00",
              startTime: "09:00",
              end: "10:00",
              endTime: "10:00",
              type: "Khác",
              location: nr.court || "Văn phòng Luật",
              priority: nr.priority || "Bình thường",
              allDay: true,
              reminder: "15_min",
              notes: `Hồ sơ ID: ${nr.id}. Khách hàng: ${nr.client}. Lĩnh vực: ${nr.category}. Người phụ trách: ${nr.mainAssignee || 'Chưa rõ'}.`,
              color: "emerald",
              icon: "Briefcase"
            };
            setEvents(prev => [...prev, mappedEvent]);
            
            // 2. Create System Notification for this record
            const mappedNotification = {
              id: Date.now() + Math.random(),
              title: `Hồ sơ mới chưa xử lý: ${nr.title}`,
              content: `Hồ sơ có mã ${nr.id} vừa được tiếp nhận thuộc lĩnh vực ${nr.category}. Vui lòng kiểm tra thông tin chi tiết.`,
              time: timeString,
              read: false,
              importance: "high",
              sendTo: "all",
              selectedUsers: [],
              selectedCases: [nr.id],
              sender: "Hệ thống",
              displaySendTo: "Tất cả",
            };
            setNotifications(prev => [mappedNotification, ...prev]);
          }
        });
        
        setShowReminder(true);
      }, 50);
    }

    const toSync = recordsToSync ? (Array.isArray(recordsToSync) ? recordsToSync : [recordsToSync]) : newRecords;

    toSync.forEach((r) => {
      if (!r) return;
      const primaryId = String(r.id || r.systemId || r.contractId || "");
      if (!primaryId || currentDeletedIds.includes(primaryId)) {
        return;
      }

      api
        .req("/api/erp-records", "POST", { id: primaryId, data: { ...r, id: primaryId } })
        .catch((e) => console.warn("Failed to sync record", primaryId, e));
    });
  };

  // Synchronized Cursor Pagination retrieval on mount and state changes
  useEffect(() => {
    fetchRecords(true);
  }, [
    searchQuery,
    selectedCategory,
    selectedBranch,
    selectedAssignee,
    selectedStatus,
    selectedPriority,
    activeTab,
    selectedSortBy,
    itemsPerPage
  ]);

  useEffect(() => {
    api
      .req("/api/events")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setEvents(data);
      })
      .catch(() => {});

    api
      .req("/api/notifications")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setNotifications(data);
      })
      .catch(() => {});
  }, []);

  const [unlockRequests, setUnlockRequests] = useState<any[]>([]);

  const fetchUnlockRequests = () => {
    api.req("/api/unlock-requests")
      .then((data) => {
        if (Array.isArray(data)) {
          setUnlockRequests(data);
        }
      })
      .catch((e) => console.warn("Failed to fetch unlock requests", e));
  };

  useEffect(() => {
    fetchUnlockRequests();
    const interval = setInterval(fetchUnlockRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const isDossierReportLocked = (record: any) => {
    if (!record || !record.lastWorkDate) return false;
    
    // Check if unlocked by controller
    const isUnlocked = unlockRequests && unlockRequests.some(
      (req: any) => req.dossier_id === record.id && req.status === "approved"
    );
    if (isUnlocked) return false;

    const now = new Date();
    const dateStr = record.lastWorkDate;
    const parts = dateStr.split("/");
    let eventDate: Date;
    if (parts.length === 3) {
      // DD/MM/YYYY
      eventDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      eventDate = new Date(dateStr);
    }
    
    if (isNaN(eventDate.getTime())) return false;

    const dayOfWeek = eventDate.getDay(); // 5 is Friday

    if (dayOfWeek === 5) {
      // Friday: locks Mon 08:00
      const lockTime = new Date(eventDate);
      lockTime.setDate(eventDate.getDate() + 3);
      lockTime.setHours(8, 0, 0, 0);
      return now > lockTime;
    } else {
      // Standard: locks next day at 17:00
      const lockTime = new Date(eventDate);
      lockTime.setDate(eventDate.getDate() + 1);
      lockTime.setHours(17, 0, 0, 0);
      return now > lockTime;
    }
  };

  const [users, setUsers] = useState<any[]>([]);
  const [caseTypes, setCaseTypes] = useState<string[]>(DOMAIN_OPTIONS);

  const dynamicStaffOptions = React.useMemo(() => {
    return users.map((u: any) => u.name || u.username);
  }, [users]);

  const dynamicUserAccountOptions = React.useMemo(() => {
    return users.map((u: any) => {
      const translatedRole = u.role === 'admin' ? 'Quản trị viên' : u.role === 'controller' ? 'Kiểm soát viên' : 'Nhân viên';
      return `${u.name || u.username} (${translatedRole})`;
    });
  }, [users]);


  const [events, setEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("erp_events_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((e: any) => 
            e.title !== "Phiên tòa tranh chấp hợp đồng thương mại" &&
            e.title !== "Họp giao ban tuần văn phòng" &&
            e.title !== "Tiệc" &&
            e.title !== "họp" &&
            !e.title?.includes("Tiệc")
          );
          return cleaned;
        }
      }
    } catch (e) {
      console.warn("Could not load events from localStorage:", e);
    }
    return [];
  });

  const customSetEvents = (value: any[] | ((prev: any[]) => any[])) => {
    setEvents(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      
      const addedEvents = next.filter(ne => !prev.some(pe => pe.id === ne.id));
      if (addedEvents.length > 0) {
        addedEvents.forEach(evt => {
          api.req("/api/events", "POST", evt).catch(console.warn);

          const cleanEvtTitle = evt.title ? evt.title.replace(/\[\s*Ánh\s*xạ\s*[^\]]*\]/gi, "").replace(/Ánh\s*xạ\s*/gi, "").trim() : "";
          if (!cleanEvtTitle.startsWith("[Hồ sơ]")) {
            const timeString = new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN");
            const newNotification = {
              id: Date.now() + Math.random(),
              title: `Sự kiện mới được tạo: ${evt.title}`,
              content: `Sự kiện "${evt.title}" được lên lịch vào ngày ${evt.date || evt.startDate} lúc ${evt.start || evt.startTime || '---'}.`,
              time: timeString,
              read: false,
              importance: "normal",
              sendTo: "all",
              selectedUsers: [],
              selectedCases: [],
              sender: "Hệ thống",
              displaySendTo: "Tất cả",
            };
            api.req("/api/notifications", "POST", newNotification).catch(console.warn);
          }
        });
        setShowReminder(true);
      }

      const deletedEvents = prev.filter(pe => !next.some(ne => ne.id === pe.id));
      if (deletedEvents.length > 0) {
        deletedEvents.forEach(evt => {
          api.req(`/api/events/${evt.id}`, "DELETE").catch(console.warn);
        });
      }

      return next;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem("erp_events_v3", JSON.stringify(events));
    } catch (e) {
      console.warn("Could not save events to localStorage:", e);
    }
  }, [events]);

  const [myPermissions, setMyPermissions] = useState<any>(null);

  useEffect(() => {
    api.req("/api/users").then(setUsers).catch(console.error);
    api.req("/api/offices").then((data) => {
      if (Array.isArray(data)) {
        setOffices(data);
      }
    }).catch(console.error);
    
    const applyFallbackPermissions = () => {
      const roleKey = mapRoleToDb(user?.role);
      if (roleKey === "admin" || roleKey === "director" || roleKey === "deputyDirector") {
        setMyPermissions({
          manageUsers: true,
          viewAllRecords: true,
          editAllRecords: true,
          deleteRecords: true,
          viewPersonalRecords: true,
          manageFinance: true,
          viewReports: true,
          manageWeb: true,
          manageEvents: true,
          manageLegalDocs: true,
          viewEventHistory: true,
          editPersonalRecords: true,
        });
      } else if (roleKey === "controller" || roleKey === "prosecutor") {
        setMyPermissions({
          manageUsers: false,
          viewAllRecords: true,
          editAllRecords: true,
          deleteRecords: roleKey === "controller",
          viewPersonalRecords: true,
          manageFinance: false,
          viewReports: true,
          manageWeb: false,
          manageEvents: true,
          manageLegalDocs: true,
          viewEventHistory: true,
          editPersonalRecords: true,
        });
      } else if (roleKey === "head_of_department" || roleKey === "manager") {
        setMyPermissions({
          manageUsers: true,
          viewAllRecords: true,
          editAllRecords: true,
          deleteRecords: false,
          viewPersonalRecords: true,
          manageFinance: false,
          viewReports: true,
          manageWeb: false,
          manageEvents: true,
          manageLegalDocs: true,
          viewEventHistory: true,
          editPersonalRecords: true,
        });
      } else if (roleKey === "accountant") {
        setMyPermissions({
          manageUsers: false,
          viewAllRecords: false,
          editAllRecords: false,
          deleteRecords: false,
          viewPersonalRecords: true,
          manageFinance: true,
          viewReports: true,
          manageWeb: false,
          manageEvents: false,
          manageLegalDocs: false,
          viewEventHistory: false,
          editPersonalRecords: true,
        });
      } else if (roleKey === "editor" || roleKey === "uploader") {
        setMyPermissions({
          manageUsers: false,
          viewAllRecords: true,
          editAllRecords: true,
          deleteRecords: false,
          viewPersonalRecords: true,
          manageFinance: false,
          viewReports: false,
          manageWeb: true,
          manageEvents: false,
          manageLegalDocs: true,
          viewEventHistory: false,
          editPersonalRecords: true,
        });
      } else {
        // lawyer, specialist, legal_associate, traineeLawyer, intern, consultant, user
        setMyPermissions({
          manageUsers: false,
          viewAllRecords: ["lawyer", "legal_associate", "consultant"].includes(roleKey),
          editAllRecords: false,
          deleteRecords: false,
          manageEvents: false,
          manageLegalDocs: ["lawyer", "legal_associate"].includes(roleKey),
          manageFinance: false,
          manageWeb: false,
          viewEventHistory: ["lawyer", "legal_associate"].includes(roleKey),
          viewReports: false,
          viewPersonalRecords: true,
          editPersonalRecords: true,
        });
      }
    };

    api.req("/api/permissions/me").then((data) => {
      const roleKey = mapRoleToDb(user?.role);
      if (roleKey === "admin" || roleKey === "director" || roleKey === "deputyDirector") {
        setMyPermissions({
          manageUsers: true,
          viewAllRecords: true,
          editAllRecords: true,
          deleteRecords: true,
          viewPersonalRecords: true,
          manageFinance: true,
          viewReports: true,
          manageWeb: true,
          manageEvents: true,
          manageLegalDocs: true,
          viewEventHistory: true,
          editPersonalRecords: true,
        });
      } else if (data && Object.keys(data).length > 0) {
        setMyPermissions(data);
      } else {
        setMyPermissions({});
      }
    }).catch((e) => {
      console.warn("Failed to fetch permissions:", e);
      setMyPermissions({});
    });
  }, [user?.role]);

  useEffect(() => {
    let s: any = null;
    const fetchStats = () => {
      // Fetch unread count specific to this user's assigned cases
      api
        .req("/api/unread-chats")
        .then((data) => {
          setUnreadLiveMessages(data?.unread || 0);
        })
        .catch(() => {});
        
      api
        .req("/api/internal-unread")
        .then((data) => {
          if (data) {
             setTotalUnreadInternal(data.totalUnread || 0);
             setUnreadInternalChats(data.unreadByRecord || {});
          }
        })
        .catch(() => {});
    };
    
    fetchStats();

    try {
      s = io();
      s.on("connect", () => {
        s.emit("join_admin");
        s.emit("join_erp");
      });
      s.on("receive_message", () => fetchStats());
      s.on("messages_read", () => fetchStats());
      s.on("internal_message_notification", (msg: any) => {
        fetchStats();
      });
      s.on("internal_messages_read", () => fetchStats());
      
      // Real-time offices update listener
      s.on("offices_updated", () => {
        api.req("/api/offices").then((data) => {
          if (Array.isArray(data)) {
            setOffices(data);
          }
        }).catch(console.error);
      });
      
      // Real-time record update listener
      const applyRecordUpdate = (payload: any) => {
        if (payload?.id && payload?.data) {
          const targetId = payload.data.id || payload.id;
          setRecords((prev) => {
            const exists = prev.some((r) => String(r.id) === String(targetId));
            if (exists) {
              return prev.map((r) => (String(r.id) === String(targetId) ? payload.data : r));
            }
            return [payload.data, ...prev];
          });
        } else {
          fetchRecordsRef.current(true);
        }
      };

      const applyRecordDelete = (payload: any) => {
        if (payload?.id) {
          const deletedStr = String(payload.id);
          setDeletedRecordIds((prev) => {
            const next = prev.includes(deletedStr) ? prev : [...prev, deletedStr];
            setRecords((currentRecords) => currentRecords.filter((r) => String(r.id) !== deletedStr));
            return next;
          });
        }
      };

      s.on("erp_record_updated", applyRecordUpdate);
      s.on("erp_record_deleted", applyRecordDelete);

      // Canonical federation event used by all five business domains.
      s.on("domain_records_updated", (payload: any) => {
        if (payload?.action === "delete") {
          applyRecordDelete(payload);
        } else if (payload?.action === "upsert") {
          applyRecordUpdate(payload);
        }
      });

      // Real-time record deletion listener
      // Real-time record restoration listener
      s.on("erp_record_restored", (payload: any) => {
        if (payload?.id) {
          const restoredStr = String(payload.id);
          setDeletedRecordIds((prev) => {
            const next = prev.filter(id => id !== restoredStr);
            try {
              localStorage.setItem("erp_deleted_record_ids", JSON.stringify(next));
            } catch {}
            if (payload.data) {
              setRecords((currentRecords) => {
                const filtered = currentRecords.filter((r) => String(r.id) !== restoredStr);
                return [payload.data, ...filtered];
              });
            } else {
              fetchRecordsRef.current(true);
            }
            return next;
          });
        }
      });

      // Real-time finance update listener
      s.on("finance_updated", () => {
        window.dispatchEvent(new CustomEvent("finance-data-updated"));
      });

      // Real-time events update listener
      s.on("events_updated", () => {
        api.req("/api/events").then((data) => {
          if (Array.isArray(data) && data.length > 0) setEvents(data);
        }).catch(() => {});
      });

      // Real-time notifications listener
      s.on("notifications_updated", () => {
        api.req("/api/notifications").then((data) => {
          if (Array.isArray(data) && data.length > 0) setNotifications(data);
        }).catch(() => {});
      });

      // Real-time unlock requests listener
      s.on("unlock_requests_updated", () => {
        fetchUnlockRequests();
      });

      // Real-time settings update listener
      s.on("settings_updated", () => {
        window.dispatchEvent(new CustomEvent("contact-settings-updated"));
      });
    } catch (e) {}

    // 12-second resilient background sync loop
    const syncInterval = setInterval(() => {
      fetchRecordsRef.current(true).catch(() => {});
    }, 12000);

    return () => {
      if (s) s.disconnect();
      clearInterval(syncInterval);
    };
  }, [user?.role]);

  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    const unviewedCount = records.filter((r) => r.viewed === false).length;
    if (unreadCount > 0 || unviewedCount > 0 || unreadLiveMessages > 0 || totalUnreadInternal > 0) {
      setShowReminder(true);
      const hideTimeout = setTimeout(() => setShowReminder(false), 8000);

      const interval = setInterval(() => {
        setShowReminder(true);
        setTimeout(() => setShowReminder(false), 8000);
      }, 30000);
      return () => {
        clearInterval(interval);
        clearTimeout(hideTimeout);
      };
    }
  }, [notifications, records, unreadLiveMessages, totalUnreadInternal]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-primary)] text-white flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/5 bg-black/10">
          <div className="w-10 h-10 bg-gradient-to-tr from-[var(--color-accent)] to-amber-300 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(212,175,55,0.25)] border border-white/10 transition-transform duration-300 hover:rotate-3">
            <Gavel size={20} className="text-[var(--color-primary)] font-bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[var(--color-accent)] font-extrabold text-base tracking-wider uppercase leading-none">
              LawFirm ERP
            </span>
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">
              {language === "vi" ? "HỆ THỐNG QUẢN TRỊ" : "ADMIN PORTAL"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-[var(--color-primary-light)] hover:scrollbar-thumb-[var(--color-primary-light)]/80">
          {/* 1. DASHBOARD & ANALYTICS */}
          <div className="pt-2 pb-1 px-3">
            <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
              1. {language === "vi" ? "DASHBOARD & ĐIỀU HÀNH" : "DASHBOARD & ANALYTICS"}
            </p>
          </div>
          <NavItem
            icon={<LayoutDashboard />}
            label={language === "vi" ? "Tổng quan Hệ thống" : "Overview"}
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          {["admin", "director", "deputyDirector", "manager", "head_of_department", "controller", "prosecutor"].includes(mapRoleToDb(user?.role)) && (
            <NavItem
              icon={<BarChart3 />}
              label={language === "vi" ? "Trung tâm Điều hành" : "Executive Dashboard"}
              active={activeTab === "executive_center"}
              onClick={() => setActiveTab("executive_center")}
            />
          )}
          {["admin", "director", "deputyDirector", "manager", "head_of_department", "controller", "prosecutor"].includes(mapRoleToDb(user?.role)) && (
            <NavItem
              icon={<Activity />}
              label={
                <span className="flex items-center justify-between w-full">
                  <span>{language === "vi" ? "Giám sát Tiến độ (SLA)" : "SLA Supervision"}</span>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono shrink-0 animate-pulse uppercase ml-2">
                    Live
                  </span>
                </span>
              }
              active={activeTab === "supervision"}
              onClick={() => setActiveTab("supervision")}
            />
          )}
          {/* Removed duplicate Statistics tab to avoid overlap with Executive Dashboard & Overview */}
          {(myPermissions?.viewReports || ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager", "accountant"].includes(mapRoleToDb(user?.role))) && (
            <NavItem
              icon={<FileSpreadsheet />}
              label={language === "vi" ? "Báo cáo Vận hành" : "Operational Reports"}
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
            />
          )}
          <NavItem
            icon={<Database />}
            label={
              <span className="flex items-center justify-between w-full">
                <span>{language === "vi" ? "Đồng bộ Đám mây" : "Cloud Sync Status"}</span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-2 animate-pulse uppercase">
                  Live
                </span>
              </span>
            }
            active={activeTab === "sync_management"}
            onClick={() => setActiveTab("sync_management")}
          />
          {["admin", "director", "deputyDirector", "manager", "head_of_department", "controller", "prosecutor", "lawyer", "legal_assistant", "staff"].includes(mapRoleToDb(user?.role)) && (
            <NavItem
              icon={<Trash2 />}
              label={language === "vi" ? "Thùng rác Hệ thống" : "Recycle Bin"}
              active={activeTab === "recycle_bin"}
              onClick={() => setActiveTab("recycle_bin")}
            />
          )}

          {/* 2. LEGAL CASES */}
          <div className="pt-4 pb-1 px-3">
            <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
              2. {language === "vi" ? "HỒ SƠ VỤ VIỆC & TỐ TỤNG" : "LEGAL CASES"}
            </p>
          </div>
          {(myPermissions?.viewPersonalRecords || myPermissions?.viewAllRecords || ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager", "prosecutor", "lawyer", "specialist", "legal_associate", "traineeLawyer", "intern", "uploader", "user"].includes(mapRoleToDb(user?.role))) && (
            <>
              {allowedModules.map((mod) => {
                let label = "";
                let icon: React.ReactNode = null;
                if (mod === "tranh_tung") {
                  label = language === "vi" ? "Tranh tụng" : "Litigation";
                  icon = <Gavel />;
                } else if (mod === "tu_van") {
                  label = language === "vi" ? "Tư vấn Pháp luật" : "Legal Consultancy";
                  icon = <FolderOpen />;
                } else if (mod === "dai_dien_ngoai_to_tung") {
                  label = language === "vi" ? "Đại diện Ngoài tố tụng" : "Out-of-court Rep";
                  icon = <Users />;
                } else if (mod === "noi_bo") {
                  label = language === "vi" ? "Pháp chế & Nội bộ" : "In-house Legal";
                  icon = <Shield />;
                } else if (mod === "trong_tai_hoa_giai") {
                  label = language === "vi" ? "Trọng tài & Hòa giải" : "Arbitration / Med";
                  icon = <Scale />;
                } else if (mod === "ban_giam_doc") {
                  label = language === "vi" ? "Ban Giám đốc" : "Board of Directors";
                  icon = <Briefcase />;
                } else {
                  // Fallback for custom or unknown practice areas
                  label = mod;
                  icon = <FolderOpen />;
                }

                return (
                  <NavItem
                    key={mod}
                    icon={icon}
                    label={label}
                    active={activeModule === mod && (activeTab === "records" || activeTab === "specialized_records")}
                    onClick={() => {
                      setActiveModule(mod);
                      if (mod === "tranh_tung") {
                        setActiveTab("records");
                      } else {
                        setActiveTab("specialized_records");
                      }
                    }}
                  />
                );
              })}
              <NavItem
                icon={<Search />}
                label={language === "vi" ? "Tìm kiếm Toàn cục" : "Global Search"}
                active={activeTab === "global_search"}
                onClick={() => setActiveTab("global_search")}
              />
            </>
          )}

          {/* 3. CONSULTATION CENTER */}
          {(["consultant", "lawyer", "specialist", "head_of_department", "manager", "controller", "prosecutor", "director", "deputyDirector", "admin", "legal_associate"].includes(mapRoleToDb(user?.role)) || myPermissions?.viewAllRecords) && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
                  3. {language === "vi" ? "TRUNG TÂM TƯ VẤN" : "CONSULTATION CENTER"}
                </p>
              </div>
              <NavItem
                icon={<Phone />}
                label={language === "vi" ? "Tổng đài & Tư vấn Hotline" : "Consultation Center"}
                active={activeTab === "consultation_center"}
                onClick={() => setActiveTab("consultation_center")}
              />
              <NavItem
                icon={<BarChart3 />}
                label={language === "vi" ? "Phân tích Call Center" : "Call Center Analytics"}
                active={activeTab === "call_center_analytics"}
                onClick={() => setActiveTab("call_center_analytics")}
              />
              <NavItem
                icon={<MessageSquare />}
                label={language === "vi" ? "Kênh Chat" : "Chat Channel"}
                active={activeTab === "kenh_chat"}
                onClick={() => setActiveTab("kenh_chat")}
              />
            </>
          )}

          {/* 4. DOCUMENT CENTER */}
          <div className="pt-4 pb-1 px-3">
            <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
              4. {language === "vi" ? "TRUNG TÂM TÀI LIỆU" : "DOCUMENT CENTER"}
            </p>
          </div>
          <NavItem
            icon={<BookOpen />}
            label={language === "vi" ? "Văn bản Pháp luật & Án lệ" : "Legal Documents"}
            active={activeTab === "legal_docs"}
            onClick={() => setActiveTab("legal_docs")}
          />
          <NavItem
            icon={<Scale />}
            label={language === "vi" ? "Công cụ & Biểu mẫu Legal" : "Legal Tools & Templates"}
            active={activeTab === "legal_tools"}
            onClick={() => setActiveTab("legal_tools")}
          />
          <NavItem
            icon={<QrCode />}
            label={language === "vi" ? "Tra cứu Hồ sơ QR" : "QR Profile Search"}
            active={activeTab === "qr_profiles"}
            onClick={() => setActiveTab("qr_profiles")}
          />
          <NavItem
            icon={<Camera />}
            label={language === "vi" ? "Quét & Số hóa Paperless" : "Paperless Scan & Digitize"}
            active={activeTab === "document_scanner"}
            onClick={() => setActiveTab("document_scanner")}
          />

          {/* 5. WORKFLOW & SCHEDULE */}
          <div className="pt-4 pb-1 px-3">
            <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
              5. {language === "vi" ? "QUY TRÌNH & LỊCH BIỂU" : "WORKFLOW & SCHEDULE"}
            </p>
          </div>
          <NavItem
            icon={<Calendar />}
            label={language === "vi" ? "Lịch Công tác & Tòa án" : "Court & Work Calendar"}
            active={activeTab === "calendar"}
            onClick={() => setActiveTab("calendar")}
          />
          <NavItem
            icon={<CalendarDays />}
            label={language === "vi" ? "Sự kiện & Hạn Tố tụng" : "Litigation Events"}
            active={activeTab === "events"}
            onClick={() => setActiveTab("events")}
          />
          <NavItem
            icon={<Bell />}
            label={language === "vi" ? "Thông báo & Cảnh báo" : "Notifications"}
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          />

          {/* 6. AI PLATFORM */}
          <div className="pt-4 pb-1 px-3">
            <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
              6. {language === "vi" ? "NỀN TẢNG TRÍ TUỆ AI & TRUYỀN THÔNG" : "AI PLATFORM & MEETING"}
            </p>
          </div>
          <NavItem
            icon={<MessageSquare />}
            label={language === "vi" ? "Trợ lý AI & Rà soát Hợp đồng" : "Legal AI Assistant"}
            active={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
          />
          <NavItem
            icon={<Sparkles />}
            label={language === "vi" ? "Huấn luyện Trợ lý AI" : "AI Training Studio"}
            active={activeTab === "ai_training"}
            onClick={() => setActiveTab("ai_training")}
          />
          <NavItem
            icon={<Camera />}
            label={language === "vi" ? "Họp Trực Tuyến (Live Meeting)" : "Online Video Meeting"}
            active={activeTab === "video_meeting"}
            onClick={() => {
              setActiveTab("video_meeting");
              setShowVideoMeetingModal(true);
            }}
          />

          {/* 7. FINANCE & PAYROLL */}
          {(myPermissions?.manageFinance || ["accountant", "director", "deputyDirector", "admin"].includes(mapRoleToDb(user?.role))) && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
                  7. {language === "vi" ? "TÀI CHÍNH & KẾ TOÁN" : "FINANCE & PAYROLL"}
                </p>
              </div>
              <NavItem
                icon={<TrendingUp />}
                label={language === "vi" ? "Quản lý Tài chính & Sổ quỹ" : "Finance Management"}
                active={activeTab === "finance"}
                onClick={() => setActiveTab("finance")}
              />
              {(myPermissions?.viewPersonalRecords || myPermissions?.manageFinance || ["accountant", "director", "deputyDirector", "admin"].includes(mapRoleToDb(user?.role))) && (
                <NavItem
                  icon={<DollarSign />}
                  label={language === "vi" ? "Bảng lương & Thưởng" : "Payroll & Bonus"}
                  active={activeTab === "payroll"}
                  onClick={() => setActiveTab("payroll")}
                />
              )}
            </>
          )}

          {/* 8. HUMAN RESOURCES */}
          {(myPermissions?.manageUsers || ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager"].includes(mapRoleToDb(user?.role))) && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
                  8. {language === "vi" ? "NHÂN SỰ & TỔ CHỨC" : "HUMAN RESOURCES"}
                </p>
              </div>
              <NavItem
                icon={<Users />}
                label={language === "vi" ? "Hồ sơ Nhân sự & KPI" : "Personnel Directory"}
                active={activeTab === "employees"}
                onClick={() => setActiveTab("employees")}
              />
              <NavItem
                icon={<Cpu />}
                label={language === "vi" ? "IoT & Arduino Smart Gateway" : "IoT & Arduino Gateway"}
                active={activeTab === "iot_gateway"}
                onClick={() => setActiveTab("iot_gateway")}
              />
            </>
          )}

          {/* 9. SYSTEM ADMINISTRATION */}
          {(myPermissions?.manageWeb || ["admin", "director", "deputyDirector", "controller", "editor", "uploader"].includes(mapRoleToDb(user?.role))) && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] font-extrabold text-[var(--color-accent)] tracking-widest uppercase">
                  9. {language === "vi" ? "QUẢN TRỊ HỆ THỐNG" : "SYSTEM ADMINISTRATION"}
                </p>
              </div>
              {(myPermissions?.manageWeb || ["admin", "director", "deputyDirector", "editor", "uploader"].includes(mapRoleToDb(user?.role))) && (
                <NavItem
                  icon={<FileType />}
                  label={language === "vi" ? "Cấu hình Loại hồ sơ" : "Record Types Config"}
                  active={activeTab === "record_types"}
                  onClick={() => setActiveTab("record_types")}
                />
              )}
              {(["admin", "director", "deputyDirector"].includes(mapRoleToDb(user?.role))) && (
                <NavItem
                  icon={<Bot />}
                  label={language === "vi" ? "Tạo Gmail Hàng loạt" : "Gmail Creator Pro"}
                  active={activeTab === "company_settings"}
                  onClick={() => setActiveTab("company_settings")}
                />
              )}
              {(["admin", "director", "deputyDirector", "controller"].includes(mapRoleToDb(user?.role))) && (
                <NavItem
                  icon={<History />}
                  label={language === "vi" ? "Nhật ký Hoạt động (Activity Logs)" : "Activity Logs"}
                  active={activeTab === "activity_logs"}
                  onClick={() => setActiveTab("activity_logs")}
                />
              )}
              {(["admin", "director", "deputyDirector", "controller"].includes(mapRoleToDb(user?.role))) && (
                <NavItem
                  icon={<Shield />}
                  label={language === "vi" ? "Bảo mật & Nhật ký Audit" : "Security & Audit Logs"}
                  active={activeTab === "security"}
                  onClick={() => setActiveTab("security")}
                />
              )}
              {(["admin", "director", "deputyDirector", "controller"].includes(mapRoleToDb(user?.role))) && (
                <NavItem
                  icon={<Cpu />}
                  label={language === "vi" ? "Giám sát Bộ nhớ & OOM" : "Memory & OOM Monitor"}
                  active={activeTab === "memory_monitor"}
                  onClick={() => setActiveTab("memory_monitor")}
                />
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/10 mt-auto bg-black/10">
          <button
            className="flex items-center gap-3 w-full text-left p-2.5 rounded-xl transition-all duration-300 hover:bg-white/10 border border-transparent hover:border-white/5 active:scale-[0.98] group"
            onClick={onProfileClick || (() => setShowProfileEditModal(true))}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner border border-white/20 group-hover:scale-105 transition-transform duration-300">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[var(--color-primary)] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-[var(--color-accent)] transition-colors duration-300">
                {formatUserDisplayName(user) || "Administrator"}
              </p>
              <p className="text-xs text-white/70 truncate flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1 h-1 bg-white/40 rounded-full" />
                {getUserTitleWithPracticeAreas(user, language)}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 sticky top-0 z-30 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            {headerInfo && activeTab === "events" ? (
              <div className="flex flex-col flex-1 w-full relative">
                <div className="flex sm:items-center flex-col sm:flex-row gap-4 justify-between w-full">
                   <div className="flex flex-col">
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--color-text-dark)] font-serif line-clamp-1 flex items-center gap-4">
                         {headerInfo.title}
                         {headerInfo.rightContent && (
                            <div className="hidden sm:block">
                               {headerInfo.rightContent}
                            </div>
                         )}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-600 hidden sm:flex mt-1">
                        <CalendarDays size={16} className="text-slate-400" />
                        <div>{headerInfo.subtitle}</div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--color-text-dark)] font-serif line-clamp-1">
                  {getGreetingText(user, language)}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const daysVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
                    const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    const date = new Date();
                    const dayName = language === 'vi' ? daysVi[date.getDay()] : daysEn[date.getDay()];
                    const dd = String(date.getDate()).padStart(2, '0');
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const yyyy = date.getFullYear();
                    return `${dayName}, ${dd}/${mm}/${yyyy}`;
                  })()}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Mode Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-xs ${
                isDarkMode
                  ? "bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700 shadow-amber-500/10"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title={isDarkMode ? (language === "vi" ? "Chuyển sang Giao diện Sáng (Light Mode)" : "Switch to Light Mode") : (language === "vi" ? "Chuyển sang Giao diện Tối (Dark Mode)" : "Switch to Dark Mode")}
            >
              {isDarkMode ? (
                <>
                  <Sun size={16} className="text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">{language === "vi" ? "Giao diện Sáng" : "Light Mode"}</span>
                </>
              ) : (
                <>
                  <Moon size={16} className="text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline">{language === "vi" ? "Giao diện Tối" : "Dark Mode"}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <span
                onClick={() => setLanguage("vi")}
                className={`px-2 py-1 border rounded-lg cursor-pointer transition-all duration-300 active:scale-95 ${language === "vi" ? "border-slate-200 bg-slate-50 text-slate-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                VI
              </span>
              <span
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 border rounded-lg cursor-pointer transition-all duration-300 active:scale-95 ${language === "en" ? "border-slate-200 bg-slate-50 text-slate-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                EN
              </span>
            </div>
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative p-2 text-slate-400 hover:text-slate-600 transition-all duration-300 active:scale-95"
            >
              <Bell size={20} />
              {(notifications.filter((n) => !n.read).length > 0 ||
                unreadLiveMessages > 0 || totalUnreadInternal > 0) && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                  {notifications.filter((n) => !n.read).length +
                    unreadLiveMessages + totalUnreadInternal}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                if (activeTab === "reports" && selectedReport) {
                  setSelectedReport(null);
                } else if (contractToView) {
                  setContractToView(null);
                } else {
                  onBack();
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-300 active:scale-95 group font-medium text-xs sm:text-sm"
              title={language === "vi" ? "Quay lại trang chủ" : "Back to Home"}
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span>{language === "vi" ? "Quay lại trang chủ" : "Back to Home"}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          {activeUserWarnings.length > 0 && (
            <div className="mb-6 space-y-4">
              {activeUserWarnings.map((warn) => (
                <motion.div
                  key={warn.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border-2 border-rose-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                        ⚠️ CẢNH CÁO NGHIỆP VỤ KHẨN (URGENT REPRIMAND)
                      </span>
                      <span className="text-xs font-bold text-rose-700 font-mono">
                        {language === "vi" ? `Ban hành bởi: ${warn.issuedBy}` : `Issued by: ${warn.issuedBy}`}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {warn.reason}
                    </h4>
                    <p className="text-xs text-rose-800 font-semibold bg-rose-100/50 p-2.5 rounded-xl border border-rose-200/50 font-mono">
                      <span className="font-extrabold">{language === "vi" ? "BIỆN PHÁP CHẾ TÀI: " : "PENALTY: "}</span>
                      {warn.penalty}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeWarningInERP(warn.id)}
                    className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-5 py-3 rounded-xl transition-all duration-300 shadow-md whitespace-nowrap active:scale-95 font-sans"
                  >
                    {language === "vi" ? "Tôi đã đọc quyết định & cam kết khắc phục" : "I acknowledge & commit to correct"}
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          <div className={`${
            isTabFS 
              ? "fixed inset-0 z-[9999] w-screen h-screen overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col gap-6 animate-in fade-in duration-300" 
              : "bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800/80 p-6 md:p-8 min-h-full relative"
          }`}>
            <ERPWorkspaceFullscreenToolbar
              isFullscreen={isTabFS}
              language={language}
              title={getERPTabTitle(activeTab, language)}
              onToggle={() => setIsTabFS((current) => !current)}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full min-h-full"
              >
                <ModuleErrorBoundary moduleName={getERPTabTitle(activeTab, language)}>
                {activeTab === "dashboard" && (
              <ExecutiveDashboard
                language={language}
                user={user}
                records={records}
                updateRecords={updateRecords}
                users={users}
                events={events}
                api={api}
                notifications={notifications}
                setNotifications={setNotifications}
                offices={offices}
              />
            )}
            {activeTab === "global_search" && (
              <GlobalSearch
                language={language}
                user={user}
              />
            )}
            {activeTab === "sync_management" && (
              <SyncStatusDashboard
                language={language}
                user={user}
              />
            )}
            {activeTab === "qr_profiles" && (
              <QRProfileManager
                records={records}
                updateRecords={updateRecords}
                user={user}
                myPermissions={myPermissions}
              />
            )}
            {activeTab === "document_scanner" && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <DocumentScanner />
              </div>
            )}
            {activeTab === "legal_docs" && (
              <LegalDocumentsManager
                user={user}
                myPermissions={myPermissions}
              />
            )}

            {activeTab === "legal_tools" && (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <ToolsPage isERP={true} user={user} />
              </div>
            )}

            {activeTab === "calendar" && (
              <CustomCalendar
                language={language}
                user={user}
                myPermissions={myPermissions}
                users={users}
                events={events}
                setEvents={customSetEvents}
              />
            )}
            {activeTab === "events" && (
              <EventsView
                language={language}
                user={user}
                records={records}
                events={events}
                setEvents={customSetEvents}
                myPermissions={myPermissions}
                setHeaderInfo={setHeaderInfo}
              />
            )}
            {activeTab === "payroll" && (
              <PayrollView
                language={language}
                user={user}
                myPermissions={myPermissions}
              />
            )}
            {activeTab === "finance" && (
              <FinanceManagementView
                language={language}
                user={user}
              />
            )}
            {activeTab === "ai_training" && (
              <AITrainingStudio
                language={language}
                fetchApi={(url, options) => fetch(url, options).then(res => res.json())}
              />
            )}
            {activeTab === "records" && (
              <RecordsView
                language={language}
                user={user}
                users={users}
                caseTypes={caseTypes}
                records={records.filter(r => {
                  const pa = r.practice_area;
                  if (pa && pa !== "tranh_tung") {
                    return false;
                  }
                  const cat = r.category ? r.category.toLowerCase().trim() : "";
                  if (
                    cat.includes("tư vấn") ||
                    cat.includes("đại diện") ||
                    cat.includes("nội bộ") ||
                    cat.includes("trọng tài") ||
                    cat.includes("hòa giải")
                  ) {
                    return false;
                  }
                  return true;
                })}
                updateRecords={updateRecords}
                contractToView={contractToView}
                setContractToView={setContractToView}
                myPermissions={myPermissions}
                unreadInternalChats={unreadInternalChats}
                selectedCategoryProp={selectedCategory}
                setSelectedCategoryProp={setSelectedCategory}
                isDossierReportLocked={isDossierReportLocked}
                unlockRequests={unlockRequests}
                fetchUnlockRequests={fetchUnlockRequests}
                events={events}
                dynamicBranchOptions={dynamicBranchOptions}
                setEvents={setEvents}
                notifications={notifications}
                setNotifications={setNotifications}
                onDeleteRecord={(id) => setDeletedRecordIds(prev => prev.includes(String(id)) ? prev : [...prev, String(id)])}
                onCloseContractDetails={() => {
                  if (previousTab) {
                    setActiveTab(previousTab);
                    setPreviousTab(null);
                  }
                }}
                searchQueryProp={searchQuery}
                setSearchQueryProp={setSearchQuery}
                selectedBranchProp={selectedBranch}
                setSelectedBranchProp={setSelectedBranch}
                selectedAssigneeProp={selectedAssignee}
                setSelectedAssigneeProp={setSelectedAssignee}
                selectedStatusProp={selectedStatus}
                setSelectedStatusProp={setSelectedStatus}
                selectedPriorityProp={selectedPriority}
                setSelectedPriorityProp={setSelectedPriority}
                selectedSortByProp={selectedSortBy}
                setSelectedSortByProp={setSelectedSortBy}
                itemsPerPageProp={itemsPerPage}
                setItemsPerPageProp={setItemsPerPage}
                trashToast={trashToast}
                setTrashToast={setTrashToast}
                renderLoadMoreControls={renderLoadMoreControls}
                hasNextPageProp={hasNextPage}
              />
            )}
            {activeTab === "specialized_records" && (
              <SpecializedRecordsView
                language={language}
                user={user}
                records={records}
                updateRecords={updateRecords}
                users={users}
                offices={offices}
                activeModule={activeModule}
                deletedRecordIds={deletedRecordIds}
              />
            )}
            {activeTab === "contracts" && (
              <ContractsView
                language={language}
                user={user}
                records={records}
                setRecords={updateRecords}
                onOpenContractDetails={(record, type) => {
                  setPreviousTab("contracts");
                  setContractToView({ record, type });
                  setActiveTab("records");
                }}
                onDownloadContract={handleDownloadContract}
                myPermissions={myPermissions}
              />
            )}
            {activeTab === "statistics" && (
              <StatisticsView
                language={language}
                user={user}
                records={records}
                events={events}
                myPermissions={myPermissions}
              />
            )}
            {activeTab === "reports" && (
              <ReportsView
                language={language}
                user={user}
                records={records}
                events={events}
                users={users}
                myPermissions={myPermissions}
                selectedReport={selectedReport}
                setSelectedReport={setSelectedReport}
                onOpenContractDetails={(record, type) => {
                  setPreviousTab("reports");
                  setContractToView({
                    record,
                    type: (type ?? "HĐDVPL") as "HĐDVPL" | "HĐUQ",
                  });
                  setActiveTab("records");
                }}
              />
            )}
            {activeTab === "employees" && (
              <SecurityView language={language} records={records} users={users} events={events} user={user} offices={offices} defaultTab="hr_dashboard" />
            )}
            {activeTab === "iot_gateway" && (
              <IotSmartGateway language={language} />
            )}
            {activeTab === "company_settings" && (
              <CompanySettingsView language={language} isFullscreen={isTabFS} />
            )}
            {activeTab === "activity_logs" && (
              <ActivityLogsView user={user} language={language} isEmbedded={true} />
            )}
            {activeTab === "security" && (
              <SecurityView language={language} records={records} users={users} events={events} user={user} offices={offices} defaultTab="monitor" />
            )}
            {activeTab === "memory_monitor" && (
              <MemoryMonitorView language={language} />
            )}
            {activeTab === "record_types" && (
              <RecordTypesView
                language={language}
                myPermissions={myPermissions}
                setActiveTab={setActiveTab}
                setSelectedCategory={setSelectedCategory}
                records={records}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationsView
                language={language}
                notifications={notifications}
                setNotifications={setNotifications}
                records={records}
                currentUser={user}
                users={users}
                events={events}
                setEvents={setEvents}
              />
            )}
            {activeTab === "executive_center" && (
              <ExecutiveDashboard
                language={language}
                user={user}
                records={records}
                updateRecords={updateRecords}
                users={users}
                events={events}
                api={api}
                notifications={notifications}
                setNotifications={setNotifications}
                offices={offices}
              />
            )}
            {activeTab === "dossier_brain" && (
              <DossierBrainCenter
                records={records}
                onUpdateRecord={(id, updatedRecord) => {
                  const updatedList = records.map((r) => r.id === id ? updatedRecord : r);
                  updateRecords(updatedList, updatedRecord);
                }}
                users={users}
                language={language}
                currentUser={user}
                offices={offices}
              />
            )}
            {activeTab === "supervision" && (
              <SupervisionDashboard
                language={language}
                user={user}
                records={records}
                updateRecords={updateRecords}
                users={users}
                setViewingRecord={(record) => setContractToView({ record, type: "HĐDVPL" })}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === "recycle_bin" && (
              <RecycleBinView
                language={language}
                user={user}
                onRestoreSuccess={(restoredId) => {
                  if (restoredId) {
                    const restoredStr = String(restoredId);
                    setDeletedRecordIds((prev) => {
                      const next = prev.filter(id => id !== restoredStr);
                      try {
                        localStorage.setItem("erp_deleted_record_ids", JSON.stringify(next));
                      } catch {}
                      api.req("/api/erp-records")
                        .then((data) => {
                          if (data && Array.isArray(data)) {
                            const unique = mergeRecords(data, next);
                            setRecords(unique);
                          }
                        })
                        .catch(() => {});
                      return next;
                    });
                  } else {
                    api.req("/api/erp-records")
                      .then((data) => {
                        if (data && Array.isArray(data)) {
                            const unique = mergeRecords(data);
                          setRecords(unique);
                        }
                      })
                      .catch(() => {});
                  }
                }}
              />
            )}
            {activeTab === "ai" && (
              <AIAssistant 
                language={language} 
                initialPrompt={aiInitialPrompt}
                setInitialPrompt={setAiInitialPrompt}
              />
            )}
            {activeTab === "consultation_center" && (
              <ConsultationCenter
                language={language}
                user={user}
                records={records}
                events={events}
                setEvents={customSetEvents}
                updateRecords={updateRecords}
                onStartMeeting={(dossierId, clientName) => {
                  setShowVideoMeetingModal(true);
                }}
                onNavigateToRecord={(recordId) => {
                  const found = records.find(r => r.id === recordId);
                  if (found) {
                    setPreviousTab("consultation_center");
                    setContractToView({ record: found, type: found.category || "HĐDVPL" });
                    setActiveTab("records");
                  }
                }}
              />
            )}
            {activeTab === "call_center_analytics" && (
              <CallCenterAnalytics user={user} />
            )}
            {activeTab === "kenh_chat" && (
              <KenhChatView language={language} user={user} users={users} />
            )}
            {activeTab === "video_meeting" && (
              <div className={`space-y-6 animate-in fade-in duration-300 p-2 sm:p-4 rounded-3xl transition-colors duration-300 ${
                videoMeetingTheme === "dark" ? "bg-slate-950/90 text-slate-100 border border-slate-800" : "bg-transparent text-slate-900"
              }`}>
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Live Meeting Server • Mã hóa SSL 256-Bit Active
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
                        Trung Tâm Họp Trực Tuyến & Tư Vấn Pháp Lý
                      </h2>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        Kết nối video đa phương tiện độ phân giải cao giữa Luật sư trực ban và Khách hàng/Đối tác. Tự động ghi âm, truyền dữ liệu mã hóa end-to-end và lập Biên bản cuộc họp thông minh bằng AI.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                      {/* Local Tab Theme Toggle Button [ ☼ ] / [ ☾ ] */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = videoMeetingTheme === "dark" ? "light" : "dark";
                          setVideoMeetingTheme(next);
                          try {
                            localStorage.setItem("video_meeting_theme_mode", next);
                          } catch {}
                        }}
                        className={`px-3.5 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                          videoMeetingTheme === "dark"
                            ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30"
                            : "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
                        }`}
                        title="Chuyển đổi Giao diện Độc lập cho Tab Họp trực tuyến"
                      >
                        {videoMeetingTheme === "dark" ? (
                          <>
                            <Sun size={16} className="text-amber-400" />
                            <span>[ ☼ ] Giao diện Sáng</span>
                          </>
                        ) : (
                          <>
                            <Moon size={16} className="text-indigo-300" />
                            <span>[ ☾ ] Giao diện Tối</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setShowVideoMeetingModal(true)}
                        className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Video size={18} />
                        <span>Mở Phòng Họp Ngay</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-colors ${
                    videoMeetingTheme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-800"
                  }`}>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Video size={24} />
                    </div>
                    <div>
                      <span className={`text-xs font-medium block ${videoMeetingTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Trạng thái Camera & Mic</span>
                      <span className={`text-sm font-bold ${videoMeetingTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Sẵn sàng kết nối</span>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-colors ${
                    videoMeetingTheme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-800"
                  }`}>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <span className={`text-xs font-medium block ${videoMeetingTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Bảo mật kênh truyền</span>
                      <span className={`text-sm font-bold ${videoMeetingTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Mã hóa End-to-End</span>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-colors ${
                    videoMeetingTheme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-800"
                  }`}>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <span className={`text-xs font-medium block ${videoMeetingTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Biên bản cuộc họp</span>
                      <span className={`text-sm font-bold ${videoMeetingTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Tự động hóa bằng AI</span>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-colors ${
                    videoMeetingTheme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-800"
                  }`}>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Users size={24} />
                    </div>
                    <div>
                      <span className={`text-xs font-medium block ${videoMeetingTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Phòng họp chờ</span>
                      <span className={`text-sm font-bold ${videoMeetingTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>3 Phòng khả dụng</span>
                    </div>
                  </div>
                </div>

                {/* Pre-configured Live Rooms */}
                <div className={`rounded-2xl border p-6 shadow-sm space-y-4 transition-colors ${
                  videoMeetingTheme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-800"
                }`}>
                  <div className={`flex items-center justify-between border-b pb-4 ${
                    videoMeetingTheme === "dark" ? "border-slate-800" : "border-slate-100"
                  }`}>
                    <div>
                      <h3 className={`font-serif font-bold text-lg ${videoMeetingTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Danh sách Phòng Họp Đang Khả Dụng</h3>
                      <p className={`text-xs mt-0.5 ${videoMeetingTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Chọn phòng họp tương ứng để kích hoạt cuộc gọi truyền hình trực tiếp, hoặc thêm/xóa phòng họp</p>
                    </div>
                    <button
                      onClick={() => setShowAddRoomModal(true)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus size={16} />
                      <span>Tạo Phòng Mới</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {meetingRooms.length === 0 ? (
                      <div className="col-span-3 py-12 text-center text-slate-400 font-medium">
                        Chưa có phòng họp nào. Vui lòng nhấn "Tạo Phòng Mới" để khởi tạo.
                      </div>
                    ) : (
                      meetingRooms.map((room) => (
                        <div key={room.id} className={`p-5 rounded-xl border transition-all space-y-4 flex flex-col justify-between ${
                          videoMeetingTheme === "dark"
                            ? "bg-slate-950/80 border-slate-800 hover:border-indigo-500/50 text-slate-100"
                            : "bg-slate-50/50 border-slate-200 hover:border-indigo-300 text-slate-800"
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${room.statusClass || 'bg-indigo-100 text-indigo-700'}`}>
                                {room.status || '🟢 Đang mở'}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-slate-400">{room.code}</span>
                                <button
                                  type="button"
                                  onClick={() => setRoomToDelete(room)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Xóa phòng họp này"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                            <h4 className={`font-bold text-sm ${videoMeetingTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{room.title}</h4>
                            <p className={`text-xs leading-relaxed ${videoMeetingTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{room.desc}</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedMeetingRoom(room);
                              setShowVideoMeetingModal(true);
                            }}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Video size={15} />
                            <span>Vào Phòng Họp</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <ERPMeetingRoomModals
                  showAddRoomModal={showAddRoomModal}
                  newRoomData={newRoomData}
                  setNewRoomData={setNewRoomData}
                  language={language}
                  handleCreateRoom={handleCreateRoom}
                  roomToDelete={roomToDelete}
                  onCloseAddRoom={() => setShowAddRoomModal(false)}
                  onCloseDeleteRoom={() => setRoomToDelete(null)}
                  onConfirmDeleteRoom={handleConfirmDeleteRoom}
                />
              </div>
            )}
                </ModuleErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Floating Yellow Attendance Toast */}
      <AnimatePresence>
        {showAttendanceToast && !isCheckedInToday && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-28 right-6 bg-amber-400 text-amber-950 px-5 py-4 rounded-2xl shadow-2xl z-[100] flex items-start gap-3.5 max-w-sm border-2 border-amber-300 font-sans"
          >
            <div className="p-2 bg-amber-500/30 rounded-xl shrink-0">
              <Clock size={20} className="text-amber-950 animate-pulse" />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase tracking-wider font-mono text-amber-950">CHẤM CÔNG</span>
                <span className="text-[10px] font-mono text-amber-900/90 font-bold">
                  {new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} {new Date().toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-xs font-bold leading-snug text-amber-950">
                {language === "vi" ? "Bạn chưa chấm công, vui lòng bấm vào chấm công!" : "You haven't checked in today. Please click to check in!"}
              </p>
              
              <button
                onClick={async () => {
                  try {
                    const todayStr = new Date().toISOString().split("T")[0];
                    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    await api.req("/api/attendance/check-in", "POST", {
                      userId: user?.id,
                      staffCode: user?.staff_code || `NV${user?.id || 1}`,
                      staffName: user?.name || user?.username,
                      role: user?.role,
                      date: todayStr,
                      status: "present",
                      checkInTime: nowTime,
                      explanation: "",
                      proofFile: ""
                    });
                    setIsCheckedInToday(true);
                    setShowAttendanceToast(false);
                    alert("Chấm công đúng giờ thành công!");
                  } catch (err) {
                    setIsCheckedInToday(true);
                    setShowAttendanceToast(false);
                    alert("Ghi nhận chấm công thành công!");
                  }
                }}
                className="mt-2 w-full py-1.5 bg-amber-950 hover:bg-amber-900 text-white rounded-xl text-xs font-black shadow transition-all active:scale-95"
              >
                {language === "vi" ? "📌 Bấm Vào Chấm Công" : "📌 Click To Check In"}
              </button>
            </div>

            <button
              onClick={() => setShowAttendanceToast(false)}
              className="p-1 hover:bg-amber-500/30 rounded-lg transition-colors text-amber-950 font-bold"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Reminder Toast */}
      <AnimatePresence>
        {showReminder && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 bg-[#ef4444] text-white px-5 py-4 rounded-xl shadow-2xl z-[100] flex items-start gap-4 max-w-sm border border-red-400/20"
          >
            <div className="bg-white/10 p-2 rounded-lg mt-0.5">
              <BellRing size={20} className="text-white animate-pulse" />
            </div>
            
            <div className="flex-1">
              <div className="font-bold text-base tracking-wide">
                {language === "vi" ? "Nhắc nhở" : "Reminder"}
              </div>
              <div className="text-sm mt-1 leading-relaxed opacity-90">
                {records.filter((r) => r.viewed === false).length > 0 && (
                  <div className="font-medium">
                    {language === "vi"
                      ? `Bạn có ${records.filter((r) => r.viewed === false).length} hồ sơ mới chưa xem!`
                      : `You have ${records.filter((r) => r.viewed === false).length} unviewed records!`}
                  </div>
                )}
                {notifications.filter((n) => !n.read).length > 0 && (
                  <div className="font-medium">
                    {language === "vi"
                      ? `Bạn có ${notifications.filter((n) => !n.read).length} thông báo chưa đọc!`
                      : `You have ${notifications.filter((n) => !n.read).length} unread notifications!`}
                  </div>
                )}
                {unreadLiveMessages > 0 && (
                  <div className="font-medium">
                    {language === "vi"
                      ? `Bạn có ${unreadLiveMessages} tin nhắn Live Chat!`
                      : `You have ${unreadLiveMessages} live messages!`}
                  </div>
                )}
                {totalUnreadInternal > 0 && (
                  <div className="font-medium">
                    {language === "vi"
                      ? `Bạn có ${totalUnreadInternal} tin nhắn Nội bộ chưa đọc!`
                      : `You have ${totalUnreadInternal} unread internal messages!`}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  if (records.filter((r) => r.viewed === false).length > 0) {
                    setActiveTab("records");
                  } else {
                    setActiveTab("notifications");
                  }
                  setShowReminder(false);
                }}
                className="text-xs font-semibold underline hover:text-red-100 mt-2.5 inline-block transition-colors"
              >
                {language === "vi" ? "Xem ngay" : "View now"}
              </button>
            </div>
            
            <button
              onClick={() => setShowReminder(false)}
              className="p-1 hover:bg-white/15 rounded-lg transition-colors ml-1 mt-0.5"
              aria-label="Close reminder"
            >
              <X size={16} className="text-white opacity-80 hover:opacity-100" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ERPProfileEditModal
        showProfileEditModal={showProfileEditModal}
        language={language}
        user={user}
        profileEditData={profileEditData}
        setProfileEditData={setProfileEditData}
        onClose={() => setShowProfileEditModal(false)}
        onSubmit={(e) => {
          e.preventDefault();
          api.req(`/api/users/${user?.id}`, "PUT", profileEditData)
            .then(() => {
              if (onUpdateUser) {
                onUpdateUser({ ...user, ...profileEditData });
              }
              setShowProfileEditModal(false);
              alert(language === "vi" ? "Cập nhật thông tin thành công!" : "Profile updated successfully!");
              window.location.reload();
            })
            .catch((err) => {
              console.error("Update failed:", err);
              alert(language === "vi" ? "Cập nhật thất bại" : "Update failed");
            });
        }}
      />

      {/* Video Meeting Modal */}
      <VideoMeetingModal
        isOpen={showVideoMeetingModal}
        onClose={() => {
          setShowVideoMeetingModal(false);
          setSelectedMeetingRoom(null);
        }}
        language={language}
        initialRoomTitle={selectedMeetingRoom?.title}
        dossierId={selectedMeetingRoom?.code || 'HS-2026-001'}
        currentUser={user || undefined}
        records={records}
        events={events}
        setEvents={customSetEvents}
        updateRecords={updateRecords}
      />

      {trashToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-xl px-5 py-4 shadow-2xl flex items-center gap-4 animate-bounce-short border border-slate-800 max-w-sm">
          <div className="p-2 bg-slate-800 rounded-lg text-rose-400">
            {trashToast.type === 'delete' ? (
              <Trash2 size={20} />
            ) : (
              <RotateCcw size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold tracking-wide">{trashToast.message}</p>
            {trashToast.type === 'delete' && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">ID: {trashToast.recordId}</p>
            )}
          </div>
          {trashToast.type === 'delete' && trashToast.recordData && (
            <button
              onClick={() => handleUndoTrash(trashToast.recordId, trashToast.recordData)}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>{language === "vi" ? "Hoàn tác" : "Undo"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const renderTaxDetails = (row: any, language: string) => {
  const gross = row.gross || 0;
  const dependents = row.dependents || 0;
  const baseSalary = 2340000;
  const regionMinWage = 4960000;
  const bhxh_bhyt_cap = baseSalary * 20;
  const bhtn_cap = regionMinWage * 20;

  const bhxh = Math.round(Math.min(gross, bhxh_bhyt_cap) * 0.08);
  const bhyt = Math.round(Math.min(gross, bhxh_bhyt_cap) * 0.015);
  const bhtn = Math.round(Math.min(gross, bhtn_cap) * 0.01);

  const insurance = bhxh + bhyt + bhtn;

  const personalDeduction = 15500000;
  const dependentDeduction = 6200000 * dependents;
  const incomeBeforeTax = gross - insurance;

  // Thu nhập tính thuế = Tổng thu nhập - Bảo hiểm - Các khoản giảm trừ
  // Should be zero if negative
  const taxableIncome = Math.max(
    0,
    incomeBeforeTax - personalDeduction - dependentDeduction,
  );

  const taxBrackets = [
    { label: language === 'vi' ? 'Đến 10 triệu VNĐ' : 'Up to 10M VND', rate: 5, max: 10000000 },
    { label: language === 'vi' ? 'Trên 10 triệu đến 30 triệu' : 'Over 10M up to 30M', rate: 10, max: 20000000 },
    { label: language === 'vi' ? 'Trên 30 triệu đến 50 triệu' : 'Over 30M up to 50M', rate: 20, max: 20000000 },
    { label: language === 'vi' ? 'Trên 50 triệu đến 80 triệu' : 'Over 50M up to 80M', rate: 28, max: 30000000 },
    { label: language === 'vi' ? 'Trên 80 triệu' : 'Over 80M', rate: 35, max: Infinity },
  ];

  let remainingTaxable = taxableIncome;
  let totalTax = 0;

  const breakdownRows = taxBrackets.map((b) => {
    const amountInBracket = Math.min(remainingTaxable, b.max);
    const taxInBracket = amountInBracket * (b.rate / 100);
    remainingTaxable -= amountInBracket;
    if (remainingTaxable < 0) remainingTaxable = 0;
    totalTax += taxInBracket;

    return {
      label: b.label,
      rate: b.rate + "%",
      amount: amountInBracket,
      tax: taxInBracket,
    };
  });

  return (
    <div className="mt-8 border-t border-slate-200 pt-6 space-y-6">
      <h3 className="font-bold text-slate-800 text-lg uppercase mb-4">
        {language === "vi"
          ? "(*) Chi tiết thuế thu nhập cá nhân (VNĐ)"
          : "(*) Personal Income Tax Details (VND)"}
      </h3>

      <div className="overflow-x-auto border border-slate-200 rounded-lg custom-scrollbar touch-pan-x">
        <table className="w-full min-w-max text-left bg-white text-sm">
          <thead className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white">
            <tr>
              <th className="px-4 py-3 border-r border-[#1a6681]">
                {language === "vi" ? "Mức chịu thuế" : "Tax Bracket"}
              </th>
              <th className="px-4 py-3 border-r border-[#1a6681] text-center">
                {language === "vi" ? "Thuế suất" : "Rate"}
              </th>
              <th className="px-4 py-3 border-r border-[#1a6681] text-right">
                {language === "vi" ? "Lương chịu thuế" : "Taxable Amount"}
              </th>
              <th className="px-4 py-3 text-right">
                {language === "vi" ? "Tiền nộp" : "Tax Amount"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {breakdownRows.map((tr, idx) => (
              <tr key={idx} className={tr.amount > 0 ? "bg-amber-50/50" : ""}>
                <td className="px-4 py-2 border-r border-slate-200 font-sans text-slate-700">
                  {tr.label}
                </td>
                <td className="px-4 py-2 border-r border-slate-200 text-center">
                  {tr.rate}
                </td>
                <td className="px-4 py-2 border-r border-slate-200 text-right">
                  {tr.amount > 0 ? tr.amount.toLocaleString("en-US") : "0"}
                </td>
                <td className="px-4 py-2 text-right font-bold text-[var(--color-primary)]">
                  {tr.tax > 0 ? tr.tax.toLocaleString("en-US") : "0"}
                </td>
              </tr>
            ))}
            {(() => {
              const actualTax = row.tax || 0;
              const roundedTotalTax = Math.round(totalTax);
              if (actualTax !== roundedTotalTax) {
                const diff = actualTax - roundedTotalTax;
                return (
                  <tr className="bg-rose-50/30">
                    <td className="px-4 py-2 border-r border-slate-200 font-sans text-slate-700 font-medium">
                      {language === "vi" ? "Điều chỉnh / Các khoản khác" : "Adjustments / Other"}
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200 text-center">-</td>
                    <td className="px-4 py-2 border-r border-slate-200 text-right">-</td>
                    <td className="px-4 py-2 text-right font-bold text-rose-600">
                      {diff > 0 ? "+" : ""}{diff.toLocaleString("en-US")}
                    </td>
                  </tr>
                );
              }
              return null;
            })()}
            <tr className="bg-slate-100">
              <td colSpan={3} className="px-4 py-3 border-r border-slate-200 font-sans text-slate-900 font-bold text-right uppercase">
                {language === "vi" ? "Tổng thuế TNCN" : "Total PIT"}
              </td>
              <td className="px-4 py-3 text-right font-bold text-[var(--color-primary)] text-base mt-2">
                {(row.tax || Math.round(totalTax)).toLocaleString("en-US")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg shrink-0 custom-scrollbar touch-pan-x">
        <table className="w-full min-w-max text-left bg-white text-[15px]">
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-5 py-3 font-medium text-slate-700">
                {language === "vi" ? "Lương cơ bản" : "Gross Salary"}
              </td>
              <td className="px-5 py-3 text-right font-mono font-bold">
                {gross.toLocaleString("en-US")}
              </td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="px-5 py-3 font-medium text-slate-700">
                {language === "vi"
                  ? "Bảo hiểm xã hội (8%)"
                  : "Social Insurance (8%)"}
              </td>
              <td className="px-5 py-3 text-right font-mono text-red-600">
                -{bhxh.toLocaleString("en-US")}
              </td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="px-5 py-3 font-medium text-slate-700">
                {language === "vi"
                  ? "Bảo hiểm y tế (1.5%)"
                  : "Health Insurance (1.5%)"}
              </td>
              <td className="px-5 py-3 text-right font-mono text-red-600">
                -{bhyt.toLocaleString("en-US")}
              </td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="px-5 py-3 font-medium text-slate-700">
                {language === "vi"
                  ? "Bảo hiểm thất nghiệp (1%)"
                  : "Unemployment Insurance (1%)"}
              </td>
              <td className="px-5 py-3 text-right font-mono text-red-600">
                -{bhtn.toLocaleString("en-US")}
              </td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-bold text-[var(--color-primary)]">
                {language === "vi"
                  ? "Thu nhập trước thuế"
                  : "Income before tax"}
              </td>
              <td className="px-5 py-3 text-right font-mono font-bold text-[var(--color-primary)]">
                {incomeBeforeTax.toLocaleString("en-US")}
              </td>
            </tr>
            <tr className="bg-emerald-50/30">
              <td className="px-5 py-3 font-medium text-slate-700">
                {language === "vi"
                  ? "Giảm trừ gia cảnh bản thân"
                  : "Personal Deduction"}
              </td>
              <td className="px-5 py-3 text-right font-mono text-emerald-700">
                -{personalDeduction.toLocaleString("en-US")}
              </td>
            </tr>
            <tr className="bg-emerald-50/30">
              <td className="px-5 py-3 font-medium text-slate-700">
                {language === "vi"
                  ? "Giảm trừ gia cảnh người phụ thuộc"
                  : "Dependent Deduction"}
              </td>
              <td className="px-5 py-3 text-right font-mono text-emerald-700">
                -{dependentDeduction.toLocaleString("en-US")}
              </td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-medium text-slate-700">
                {language === "vi" ? "Thu nhập chịu thuế" : "Taxable Income"}
              </td>
              <td className="px-5 py-3 text-right font-mono font-bold">
                {taxableIncome.toLocaleString("en-US")}
              </td>
            </tr>
            <tr className="bg-red-50/50">
              <td className="px-5 py-3 font-bold text-[var(--color-primary)]">
                {language === "vi"
                  ? "Thuế thu nhập cá nhân(*)"
                  : "Personal Income Tax"}
              </td>
              <td className="px-5 py-3 text-right font-mono font-bold text-red-600">
                -{totalTax.toLocaleString("en-US")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

function PayrollView({
  language,
  user,
  myPermissions,
}: {
  language: "vi" | "en";
  user: any;
  myPermissions?: any;
}) {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // New state variables for evaluations/bonuses toolbar and filters
  const [evalSearchQuery, setEvalSearchQuery] = useState("");
  const [evalSelectedBranch, setEvalSelectedBranch] = useState("");
  const [evalEntriesPerPage, setEvalEntriesPerPage] = useState(10);
  const [evalCurrentPage, setEvalCurrentPage] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const evalFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredPayrolls.map((p) => ({
        [language === "vi" ? "Mã NV" : "Emp Code"]: p.staff_code || `NV${String(p.user_id).padStart(3, "0")}`,
        [language === "vi" ? "Tháng/Năm" : "Month/Year"]: `${p.month}/${p.year}`,
        [language === "vi" ? "Họ tên NV" : "Name"]: p.user_name || p.name,
        [language === "vi" ? "Chức vụ" : "Title"]: translateRole(p.title, language),
        [language === "vi" ? "Chi nhánh" : "Branch"]: p.branch || "",
        [language === "vi" ? "Số ngày công" : "Working days"]: p.working_days || 0,
        [language === "vi" ? "Tổng lương (Gross)" : "Gross Salary"]: p.gross || 0,
        [language === "vi" ? "Phụ cấp ăn trưa" : "Lunch Allowance"]: p.food_allowance || 0,
        [language === "vi" ? "Phụ cấp xăng xe" : "Gas Allowance"]: p.gas_allowance || 0,
        [language === "vi" ? "Phụ cấp điện thoại" : "Phone Allowance"]: p.phone_allowance || 0,
        [language === "vi" ? "Phúc lợi khác" : "Other Benefits"]: p.other_benefits || 0,
        [language === "vi" ? "Thưởng nóng" : "Bonus"]: p.bonus || 0,
        [language === "vi" ? "Vi phạm/Khấu trừ" : "Violations"]: p.violations || 0,
        [language === "vi" ? "Khấu trừ BHXH" : "Insurance"]: p.insurance || 0,
        [language === "vi" ? "Khấu trừ thuế TNCN" : "Tax"]: p.tax || 0,
        [language === "vi" ? "Tổng thu nhập" : "Total Salary"]: p.total_salary || 0,
        [language === "vi" ? "Thực nhận (Net)" : "Net Salary"]: p.net || 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, language === "vi" ? "Bảng Lương" : "Payroll");
      
      const maxLens = Object.keys(dataToExport[0] || {}).map(key => {
        let maxLen = key.length;
        dataToExport.forEach(row => {
          const val = String((row as any)[key] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: maxLen + 3 };
      });
      worksheet["!cols"] = maxLens;

      XLSX.writeFile(workbook, `Bang_Luong_Thang_${currentMonth}_${currentYear}.xlsx`);
    } catch (error) {
      console.error("Export Excel error:", error);
      alert(language === "vi" ? "Có lỗi xảy ra khi xuất file Excel!" : "Failed to export Excel!");
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        language === "vi" ? "Ma NV" : "Emp Code",
        language === "vi" ? "Thang/Nam" : "Month/Year",
        language === "vi" ? "Ho ten NV" : "Name",
        language === "vi" ? "Chuc vu" : "Title",
        language === "vi" ? "Chi nhanh" : "Branch",
        language === "vi" ? "So ngay cong" : "Working days",
        language === "vi" ? "Tong luong" : "Gross Salary",
        language === "vi" ? "Thuong" : "Bonus",
        language === "vi" ? "Khau tru BHXH" : "Insurance",
        language === "vi" ? "Khau tru thue TNCN" : "Tax",
        language === "vi" ? "Thuc nhan" : "Net Salary",
      ];

      const csvRows = [headers.join(",")];

      filteredPayrolls.forEach((p) => {
        const row = [
          `"${p.staff_code || `NV${String(p.user_id).padStart(3, "0")}`}"`,
          `"${p.month}/${p.year}"`,
          `"${p.user_name || p.name}"`,
          `"${translateRole(p.title, language)}"`,
          `"${p.branch || ""}"`,
          p.working_days || 0,
          p.gross || 0,
          p.bonus || 0,
          p.insurance || 0,
          p.tax || 0,
          p.net || 0,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bang_Luong_Thang_${currentMonth}_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export CSV error:", error);
      alert(language === "vi" ? "Có lỗi xảy ra khi xuất file CSV!" : "Failed to export CSV!");
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const allUsers: any[] = await api.req("/api/users");
      
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (rawRows.length === 0) {
            alert(language === "vi" ? "File không có dữ liệu!" : "File contains no data!");
            return;
          }

          let successCount = 0;
          let failCount = 0;

          for (const row of rawRows) {
            const getVal = (keys: string[]) => {
              for (const k of keys) {
                const foundKey = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
                if (foundKey) return row[foundKey];
              }
              return undefined;
            };

            const staffCode = String(getVal(["mã nv", "ma nv", "emp code", "mã nhân sự"]) || "").trim();
            const fullName = String(getVal(["họ tên nv", "ho ten nv", "name", "tên nv", "họ và tên"]) || "").trim();
            
            let matchedUser = allUsers.find(u => u.staff_code && u.staff_code.toLowerCase().trim() === staffCode.toLowerCase());
            if (!matchedUser && fullName) {
              matchedUser = allUsers.find(u => u.name && u.name.toLowerCase().trim() === fullName.toLowerCase());
            }

            if (!matchedUser) {
              failCount++;
              continue;
            }

            const parseNum = (keys: string[]) => {
              const val = getVal(keys);
              if (val === undefined || val === null) return 0;
              return Number(String(val).replace(/[^0-9.-]/g, "")) || 0;
            };

            const workingDays = parseNum(["số ngày công", "so ngay cong", "working days"]) || 26;
            const gross = parseNum(["tổng lương (gross)", "tong luong", "gross salary", "lương cơ bản", "luong co ban", "gross"]);
            const food = parseNum(["phụ cấp ăn trưa", "phu cap an trua", "lunch allowance", "food allowance"]);
            const gas = parseNum(["phụ cấp xăng xe", "phu cap xang xe", "gas allowance"]);
            const phone = parseNum(["phụ cấp điện thoại", "phu cap dien thoai", "phone allowance"]);
            const other = parseNum(["phúc lợi khác", "phuc loi khac", "other benefits"]);
            const violations = parseNum(["vi phạm/khấu trừ", "vi pham/khau tru", "violations", "phạt", "khấu trừ"]);
            const dependents = parseNum(["số người phụ thuộc", "so nguoi phu thuoc", "dependents"]) || 0;

            const total_salary = gross + food + gas + phone;

            await api.req("/api/monthly-payrolls", "POST", {
              user_id: matchedUser.id,
              month: currentMonth,
              year: currentYear,
              staff_code: matchedUser.staff_code || staffCode,
              title: matchedUser.title || matchedUser.role,
              branch: matchedUser.branch || "",
              working_days: workingDays,
              dependents: dependents,
              gross: gross,
              food_allowance: food,
              gas_allowance: gas,
              phone_allowance: phone,
              other_benefits: other,
              violations: violations,
              total_salary: total_salary
            });

            successCount++;
          }

          loadData();

          if (successCount > 0) {
            alert(
              language === "vi"
                ? `Nhập thành công ${successCount} nhân sự! ${failCount > 0 ? `(Thất bại ${failCount} dòng không khớp nhân sự)` : ""}`
                : `Successfully imported ${successCount} entries! ${failCount > 0 ? `(Failed ${failCount} rows due to unmatched employee)` : ""}`
            );
          } else {
            alert(
              language === "vi"
                ? "Không nhập được nhân sự nào! Vui lòng kiểm tra lại cột Họ tên hoặc Mã NV."
                : "No entries imported! Please verify Employee Name or Emp Code columns."
            );
          }
        } catch (err) {
          console.error(err);
          alert(language === "vi" ? "Lỗi xử lý nội dung file!" : "Error processing file contents!");
        }
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      alert(language === "vi" ? "Lỗi đọc file!" : "Error reading file!");
    } finally {
      e.target.value = "";
    }
  };

  const handleImportEvalExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const allUsers: any[] = await api.req("/api/users");
      
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (rawRows.length === 0) {
            alert(language === "vi" ? "File không có dữ liệu!" : "File contains no data!");
            return;
          }

          let successCount = 0;
          let failCount = 0;

          for (const row of rawRows) {
            const getVal = (keys: string[]) => {
              for (const k of keys) {
                const foundKey = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
                if (foundKey) return row[foundKey];
              }
              return undefined;
            };

            const staffCode = String(getVal(["mã ns", "ma ns", "emp code", "mã nv", "ma nv", "mã nhân sự"]) || "").trim();
            const fullName = String(getVal(["tên nhân sự", "ten nhan su", "employee name", "họ tên nv", "ho ten nv", "name", "tên nv", "họ và tên"]) || "").trim();
            
            let matchedUser = allUsers.find(u => u.staff_code && u.staff_code.toLowerCase().trim() === staffCode.toLowerCase());
            if (!matchedUser && fullName) {
              matchedUser = allUsers.find(u => u.name && u.name.toLowerCase().trim() === fullName.toLowerCase());
            }

            if (!matchedUser) {
              failCount++;
              continue;
            }

            const rating = String(getVal(["xếp loại", "xep loai", "rating"]) || "A").trim();
            
            const parseNum = (keys: string[]) => {
              const val = getVal(keys);
              if (val === undefined || val === null) return 0;
              return Number(String(val).replace(/[^0-9.-]/g, "")) || 0;
            };

            const bonusAmount = parseNum(["mức thưởng", "muc thuong", "bonus amount", "bonus"]);
            const notes = String(getVal(["ghi chú/đánh giá", "ghi chu/danh gia", "notes/evaluations", "ghi chú", "notes"]) || "").trim();

            await api.req("/api/evaluations", "POST", {
              user_id: matchedUser.id,
              month: currentMonth,
              year: currentYear,
              rating: rating,
              bonus_amount: bonusAmount,
              notes: notes,
              target_type: "personnel"
            });

            successCount++;
          }

          loadData();

          if (successCount > 0) {
            alert(
              language === "vi"
                ? `Nhập thành công ${successCount} đánh giá/thưởng! ${failCount > 0 ? `(Thất bại ${failCount} dòng không khớp nhân sự)` : ""}`
                : `Successfully imported ${successCount} evaluations! ${failCount > 0 ? `(Failed ${failCount} rows due to unmatched employee)` : ""}`
            );
          } else {
            alert(
              language === "vi"
                ? "Không nhập được dòng nào! Vui lòng kiểm tra lại cột Họ tên hoặc Mã NS."
                : "No entries imported! Please verify Employee Name or Emp Code columns."
            );
          }
        } catch (err) {
          console.error(err);
          alert(language === "vi" ? "Lỗi xử lý nội dung file!" : "Error processing file contents!");
        }
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      alert(language === "vi" ? "Lỗi đọc file!" : "Error reading file!");
    } finally {
      e.target.value = "";
    }
  };

  const handleExportEvalExcel = () => {
    try {
      const dataToExport = filteredEvaluations.map((row, i) => ({
        [language === "vi" ? "STT" : "No."]: i + 1,
        [language === "vi" ? "Mã NS" : "Emp Code"]: row.staff_code || `NV${String(row.user_id).padStart(3, "0")}`,
        [language === "vi" ? "Họ tên NV" : "Name"]: row.user_name || row.name || `Nhân sự ${row.user_id}`,
        [language === "vi" ? "Chức vụ" : "Title"]: translateRole(row.title, language),
        [language === "vi" ? "Chi nhánh" : "Branch"]: row.branch || "Trụ sở chính",
        [language === "vi" ? "Tháng/Năm" : "Month/Year"]: `${row.month}/${row.year}`,
        [language === "vi" ? "Xếp loại" : "Rating"]: row.rating,
        [language === "vi" ? "Mức thưởng" : "Bonus Amount"]: row.bonus_amount || 0,
        [language === "vi" ? "Ghi chú" : "Notes"]: row.notes || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, language === "vi" ? "Thưởng Đánh Giá" : "Evaluations");
      
      const maxLens = Object.keys(dataToExport[0] || {}).map(key => {
        let maxLen = key.length;
        dataToExport.forEach(row => {
          const val = String((row as any)[key] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: maxLen + 3 };
      });
      worksheet["!cols"] = maxLens;

      XLSX.writeFile(workbook, `Thuong_Danh_Gia_Thang_${currentMonth}_${currentYear}.xlsx`);
    } catch (error) {
      console.error("Export Excel error:", error);
      alert(language === "vi" ? "Có lỗi xảy ra khi xuất file Excel!" : "Failed to export Excel!");
    }
  };

  const handleExportEvalCSV = () => {
    try {
      const headers = [
        language === "vi" ? "STT" : "No.",
        language === "vi" ? "Ma NS" : "Emp Code",
        language === "vi" ? "Ho ten NV" : "Name",
        language === "vi" ? "Chuc vu" : "Title",
        language === "vi" ? "Chi nhanh" : "Branch",
        language === "vi" ? "Thang/Nam" : "Month/Year",
        language === "vi" ? "Xep loai" : "Rating",
        language === "vi" ? "Muc thuong" : "Bonus Amount",
        language === "vi" ? "Ghi chu" : "Notes"
      ];

      const csvRows = [headers.join(",")];

      filteredEvaluations.forEach((row, i) => {
        const csvRow = [
          i + 1,
          `"${row.staff_code || `NV${String(row.user_id).padStart(3, "0")}`}"`,
          `"${row.user_name || row.name || `Nhan su ${row.user_id}`}"`,
          `"${translateRole(row.title, language)}"`,
          `"${row.branch || "Tru so chinh"}"`,
          `"${row.month}/${row.year}"`,
          `"${row.rating}"`,
          row.bonus_amount || 0,
          `"${(row.notes || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(csvRow.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Thuong_Danh_Gia_Thang_${currentMonth}_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export CSV error:", error);
      alert(language === "vi" ? "Có lỗi xảy ra khi xuất file CSV!" : "Failed to export CSV!");
    }
  };

  // Extract unique branches dynamically from payroll data
  const uniqueBranches = useMemo(() => {
    const fromData = payrolls
      .filter((p) => !isAdminAccount({ name: p.user_name || p.name, username: p.username, role: p.role, title: p.title }))
      .map((p) => p.branch)
      .filter(Boolean);
    const standard = ["Trụ sở chính", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng"];
    return Array.from(new Set([...fromData, ...standard]));
  }, [payrolls]);

  // Filter payroll rows
  const filteredPayrolls = useMemo(() => {
    const filtered = payrolls.filter((p) => {
      if (isAdminAccount({
        id: p.user_id,
        name: p.user_name || p.name,
        username: p.username,
        email: p.email,
        role: p.role,
        title: p.title,
      })) return false;
      if (selectedBranch && p.branch !== selectedBranch) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const code = (p.staff_code || "").toLowerCase();
        const name = (p.user_name || p.name || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        if (!code.includes(query) && !name.includes(query) && !title.includes(query)) {
          return false;
        }
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const numA = Number((a.staff_code || "").match(/\d+$/)?.[0] || 999);
      const numB = Number((b.staff_code || "").match(/\d+$/)?.[0] || 999);
      return numA - numB;
    });
  }, [payrolls, selectedBranch, searchQuery]);

  // Paginated payroll rows
  const paginatedPayrolls = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredPayrolls.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredPayrolls, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredPayrolls.length / entriesPerPage) || 1;

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranch, searchQuery, entriesPerPage]);

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((row) => {
      if (isAdminAccount({
        id: row.user_id,
        name: row.user_name || row.name,
        username: row.username,
        email: row.email,
        role: row.role,
        title: row.title,
      })) return false;
      if (evalSelectedBranch && row.branch !== evalSelectedBranch) return false;
      if (evalSearchQuery) {
        const query = evalSearchQuery.toLowerCase().trim();
        const code = (row.staff_code || "").toLowerCase();
        const name = (row.user_name || row.name || "").toLowerCase();
        const title = (row.title || "").toLowerCase();
        const rating = (row.rating || "").toLowerCase();
        const notes = (row.notes || "").toLowerCase();
        if (
          !code.includes(query) &&
          !name.includes(query) &&
          !title.includes(query) &&
          !rating.includes(query) &&
          !notes.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [evaluations, evalSelectedBranch, evalSearchQuery]);

  const paginatedEvaluations = useMemo(() => {
    const startIndex = (evalCurrentPage - 1) * evalEntriesPerPage;
    return filteredEvaluations.slice(startIndex, startIndex + evalEntriesPerPage);
  }, [filteredEvaluations, evalCurrentPage, evalEntriesPerPage]);

  const evalTotalPages = Math.ceil(filteredEvaluations.length / evalEntriesPerPage) || 1;

  useEffect(() => {
    setEvalCurrentPage(1);
  }, [evalSelectedBranch, evalSearchQuery, evalEntriesPerPage]);

  const loadData = () => {
    api
      .req(`/api/monthly-payrolls?month=${currentMonth}&year=${currentYear}`)
      .then((data) => {
        if (!data || data.length === 0) {
          setPayrolls([]);
        } else {
          // Luôn đồng bộ lại toàn bộ số liệu khi hiển thị
          setPayrolls(data.map((d: any) => calculateFullPayroll(d)));
        }
      })
      .catch(console.error);
    api
      .req(`/api/evaluations?month=${currentMonth}&year=${currentYear}`)
      .then((data) => {
        if (!data || data.length === 0) {
          setEvaluations([]);
        } else {
          setEvaluations(data);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, [currentMonth, currentYear, user?.id]);

  const chartData = useMemo(() => {
    if (!myPermissions?.manageFinance) return [];
    const data = payrolls.map((p) => {
      const evalData = evaluations.find((e) => e.user_id === p.user_id);
      const salary = Number(p.net) || 0;
      const bonus = Number(evalData?.bonus_amount) || 0;
      return {
        name: p.user_name || `User ${p.user_id}`,
        salary,
        bonus,
        total: salary + bonus,
      };
    });
    // Sort by total descending and take top 10
    return data.sort((a, b) => b.total - a.total).slice(0, 10);
  }, [payrolls, evaluations, myPermissions]);

  const currentSalary = myPermissions?.manageFinance
    ? payrolls.length > 0
      ? Math.max(...payrolls.map((p) => Number(p.net) || 0))
      : null
    : (payrolls.find((p) => p.user_id === user?.id)?.net ??
      (user?.salary ? Number(String(user.salary).replace(/[^0-9]/g, '')) : null) ??
      (payrolls.length > 0 ? payrolls[0].net : null));

  const currentBonus = myPermissions?.manageFinance
    ? evaluations.length > 0
      ? Math.max(...evaluations.map((e) => Number(e.bonus_amount) || 0))
      : null
    : (evaluations.find((e) => e.user_id === user?.id)?.bonus_amount ??
      (evaluations.length > 0 ? evaluations[0].bonus_amount : null));

  const titleText = myPermissions?.manageFinance
    ? language === "vi"
      ? "Tổng quan Lương & Thưởng"
      : "Payroll & Bonus Overview"
    : language === "vi"
      ? "Bảng lương của tôi"
      : "My Payroll";

  const salaryLabel = myPermissions?.manageFinance
    ? language === "vi"
      ? "LƯƠNG CAO NHẤT"
      : "HIGHEST SALARY"
    : language === "vi"
      ? "LƯƠNG"
      : "SALARY";

  const bonusLabel = myPermissions?.manageFinance
    ? language === "vi"
      ? "THƯỞNG CAO NHẤT"
      : "HIGHEST BONUS"
    : language === "vi"
      ? "THƯỞNG"
      : "BONUS";

  return (
    <div className="space-y-6 relative">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {titleText}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden text-slate-800 flex items-center justify-between hover:border-slate-300 transition-all duration-300">
            <div className="relative z-10">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" />
                {salaryLabel}
              </p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
                {currentSalary != null
                  ? `${Number(currentSalary).toLocaleString("vi-VN")} ₫`
                  : language === "vi"
                    ? "Chưa cập nhật"
                    : "Not updated"}
              </p>
            </div>
            <div className="relative z-10 w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden text-slate-800 flex items-center justify-between hover:border-slate-300 transition-all duration-300">
            <div className="relative z-10">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                {bonusLabel}
              </p>
              <p className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
                {currentBonus != null
                  ? `${Number(currentBonus).toLocaleString("vi-VN")} ₫`
                  : language === "vi"
                    ? "Chưa cập nhật"
                    : "Not updated"}
              </p>
            </div>
            <div className="relative z-10 w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0 border border-amber-100 shadow-sm">
              <Award size={24} />
            </div>
          </div>
        </div>
      </div>

      {myPermissions?.manageFinance && chartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              {language === "vi"
                ? "Biểu đồ Lương & Thưởng (Top 10)"
                : "Payroll & Bonus Chart (Top 10)"}
            </h3>
          </div>
          <div className="p-6 h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={40}
              >
                <defs>
                  <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="colorBonus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc", opacity: 0.6 }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow:
                      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(4px)",
                  }}
                  itemStyle={{
                    fontWeight: 600,
                  }}
                  formatter={
                    ((value: number) => {
                      const v = value.toLocaleString("vi-VN");
                      return `${v} ₫`;
                    }) as any
                  }
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px" }}
                  formatter={(value) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
                />
                <Bar
                  dataKey="salary"
                  name={language === "vi" ? "Lương" : "Salary"}
                  fill="url(#colorSalary)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1500}
                />
                <Bar
                  dataKey="bonus"
                  name={language === "vi" ? "Thưởng" : "Bonus"}
                  fill="url(#colorBonus)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Date Filter & Search Tools */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {language === "vi" ? "Xem" : "Show"}
          </span>
          <select 
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            className="border border-slate-200 rounded-lg text-sm bg-white px-2 py-1 outline-none focus:border-blue-400"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <span className="text-sm font-medium text-slate-700">
            {language === "vi" ? "mục" : "entries"}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-x-6 gap-y-2">
          {/* Action buttons (Import/Export) */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportExcel}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            {myPermissions?.manageFinance && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                title={language === "vi" ? "Nhập dữ liệu bảng lương từ file Excel/CSV" : "Import payroll data from Excel/CSV file"}
              >
                <Upload size={14} />
                {language === "vi" ? "Nhập Excel/CSV" : "Import Excel/CSV"}
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
              title={language === "vi" ? "Tải xuống bảng lương định dạng Excel (.xlsx)" : "Download payroll as Excel (.xlsx)"}
            >
              <FileSpreadsheet size={14} />
              {language === "vi" ? "Xuất Excel" : "Export Excel"}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
              title={language === "vi" ? "Tải xuống bảng lương định dạng CSV (.csv)" : "Download payroll as CSV (.csv)"}
            >
              <FileText size={14} />
              {language === "vi" ? "Xuất CSV" : "Export CSV"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {language === "vi" ? "Tháng" : "Month"}
            </span>
            <input
              type="month"
              value={`${currentYear}-${currentMonth.toString().padStart(2, "0")}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-");
                if (y && m) {
                  setCurrentYear(Number(y));
                  setCurrentMonth(Number(m));
                }
              }}
              className="border border-slate-200 rounded-lg text-sm bg-white px-3 py-1 outline-none focus:border-blue-400 h-[34px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {language === "vi" ? "Chi nhánh" : "Branch"}
            </span>
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm bg-white px-3 py-1 outline-none focus:border-blue-400 h-[34px] min-w-[180px]"
            >
              <option value="">
                {language === "vi" ? "Chọn chi nhánh" : "Select branch"}
              </option>
              {uniqueBranches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {language === "vi" ? "Tìm:" : "Search:"}
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === "vi" ? "Mã, tên, chức vụ..." : "Code, name, title..."}
              className="border border-slate-200 rounded-lg text-sm bg-white px-3 py-1 outline-none focus:border-blue-400 h-[34px] w-48"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[14px] font-bold text-slate-700">
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Mã NV" : "Emp Code"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Tháng" : "Month"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Tên NV" : "Name"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Chức vụ" : "Title"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Chi nhánh" : "Branch"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Số ngày công" : "Working days"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Tổng lương" : "Total Salary"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Thưởng" : "Bonus"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "BHXH" : "Insurance"}
                </th>
                <th className="px-3 py-3 border-r border-slate-200 whitespace-nowrap text-left">
                  {language === "vi" ? "Thuế TNCN" : "Tax"}
                </th>
                <th className="px-3 py-3 whitespace-nowrap text-left">
                  {language === "vi" ? "Thực nhận" : "Net Salary"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-left text-slate-500">
                    {language === "vi" ? "Không tìm thấy dữ liệu phù hợp" : "No matching payroll records found"}
                  </td>
                </tr>
              ) : (
                paginatedPayrolls.map((payroll: any) => (
                  <tr key={payroll.id} className="hover:bg-slate-50 transition-all duration-300">
                    <td className="px-3 py-3 border-r border-slate-200 text-left font-mono text-slate-600">
                      {payroll.staff_code || `NV${String(payroll.user_id).padStart(3, "0")}`}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 text-left text-slate-800">
                      {payroll.month}/{payroll.year}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 font-bold text-slate-800 text-left">
                      {payroll.user_name || payroll.name}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 text-slate-600 text-left">
                      {translateRole(payroll.title, language)}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 text-slate-600 text-left">
                      {payroll.branch}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 text-left text-slate-600">
                      {payroll.working_days}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 text-left font-mono text-[var(--color-primary)] font-medium">
                      {payroll.gross?.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 text-left font-mono text-emerald-600 font-medium">
                      {payroll.bonus?.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 text-left font-mono text-rose-500 font-medium">
                      -{payroll.insurance?.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 border-r border-slate-200 text-left font-mono text-rose-600 font-medium">
                      -{payroll.tax?.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-left font-mono text-indigo-700 font-bold">
                      {payroll.net?.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex justify-between items-center text-[13px] text-slate-600 border-t border-slate-200">
          <span>
            {language === "vi"
              ? `Đang xem ${filteredPayrolls.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} đến ${Math.min(currentPage * entriesPerPage, filteredPayrolls.length)} trong tổng số ${filteredPayrolls.length} mục`
              : `Showing ${filteredPayrolls.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to ${Math.min(currentPage * entriesPerPage, filteredPayrolls.length)} of ${filteredPayrolls.length} entries`}
          </span>
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1.5 text-slate-600 transition-all duration-300 hover:bg-slate-100 border-r border-slate-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {language === "vi" ? "Trước" : "Prev"}
            </button>
            <span className="px-3 py-1.5 bg-slate-50 text-slate-800 font-medium font-mono border-r border-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 text-slate-600 transition-all duration-300 hover:bg-slate-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {language === "vi" ? "Tiếp" : "Next"}
            </button>
          </div>
        </div>
      </div>

      {/* Evaluations/Bonuses Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {language === "vi" ? "Xem" : "Show"}
          </span>
          <select 
            value={evalEntriesPerPage}
            onChange={(e) => setEvalEntriesPerPage(Number(e.target.value))}
            className="border border-slate-200 rounded-lg text-sm bg-white px-2 py-1 outline-none focus:border-blue-400"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <span className="text-sm font-medium text-slate-700">
            {language === "vi" ? "mục" : "entries"}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-x-6 gap-y-2">
          {/* Action buttons (Import/Export) */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
            <input
              type="file"
              ref={evalFileInputRef}
              onChange={handleImportEvalExcel}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            {myPermissions?.manageFinance && (
              <button
                onClick={() => evalFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                title={language === "vi" ? "Nhập dữ liệu thưởng từ file Excel/CSV" : "Import evaluations data from Excel/CSV file"}
              >
                <Upload size={14} />
                {language === "vi" ? "Nhập Excel/CSV" : "Import Excel/CSV"}
              </button>
            )}
            <button
              onClick={handleExportEvalExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
              title={language === "vi" ? "Tải xuống thưởng định dạng Excel (.xlsx)" : "Download evaluations as Excel (.xlsx)"}
            >
              <FileSpreadsheet size={14} />
              {language === "vi" ? "Xuất Excel" : "Export Excel"}
            </button>
            <button
              onClick={handleExportEvalCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
              title={language === "vi" ? "Tải xuống thưởng định dạng CSV (.csv)" : "Download evaluations as CSV (.csv)"}
            >
              <FileText size={14} />
              {language === "vi" ? "Xuất CSV" : "Export CSV"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {language === "vi" ? "Tháng" : "Month"}
            </span>
            <input
              type="month"
              value={`${currentYear}-${currentMonth.toString().padStart(2, "0")}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-");
                if (y && m) {
                  setCurrentYear(Number(y));
                  setCurrentMonth(Number(m));
                }
              }}
              className="border border-slate-200 rounded-lg text-sm bg-white px-3 py-1 outline-none focus:border-blue-400 h-[34px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {language === "vi" ? "Chi nhánh" : "Branch"}
            </span>
            <select 
              value={evalSelectedBranch}
              onChange={(e) => setEvalSelectedBranch(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm bg-white px-3 py-1 outline-none focus:border-blue-400 h-[34px] min-w-[180px]"
            >
              <option value="">
                {language === "vi" ? "Chọn chi nhánh" : "Select branch"}
              </option>
              {uniqueBranches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {language === "vi" ? "Tìm:" : "Search:"}
            </span>
            <input
              type="text"
              value={evalSearchQuery}
              onChange={(e) => setEvalSearchQuery(e.target.value)}
              placeholder={language === "vi" ? "Mã, tên, xếp loại..." : "Code, name, rating..."}
              className="border border-slate-200 rounded-lg text-sm bg-white px-3 py-1 outline-none focus:border-blue-400 h-[34px] w-48"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-xl">
            {language === "vi" ? "Thưởng/Đánh giá tháng" : "Bonuses for Month"}{" "}
            {currentMonth}
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[13px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-4 w-12 text-left">STT</th>
                <th className="px-4 py-4 text-left">
                  {language === "vi" ? "MÃ NS" : "EMP CODE"}
                </th>
                <th className="px-4 py-4 text-left">
                  {language === "vi" ? "TÊN NHÂN SỰ" : "EMPLOYEE NAME"}
                </th>
                <th className="px-4 py-4 text-left">
                  {language === "vi" ? "CHỨC VỤ" : "TITLE"}
                </th>
                <th className="px-4 py-4 text-left">
                  {language === "vi" ? "CHI NHÁNH" : "BRANCH"}
                </th>
                <th className="px-4 py-4 text-left">
                  {language === "vi" ? "THÁNG/NĂM" : "MONTH/YEAR"}
                </th>
                <th className="px-4 py-4 text-left whitespace-nowrap">
                  {language === "vi" ? "XẾP LOẠI" : "RATING"}
                </th>
                <th className="px-4 py-4 text-left whitespace-nowrap">
                  {language === "vi" ? "MỨC THƯỞNG" : "BONUS AMOUNT"}
                </th>
                <th className="px-4 py-4 min-w-[250px] text-left">
                  {language === "vi" ? "GHI CHÚ/ĐÁNH GIÁ" : "NOTES/EVALUATIONS"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedEvaluations.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-left text-slate-500 text-[15px]"
                  >
                    {language === "vi" ? "Chưa có thông tin" : "No data"}
                  </td>
                </tr>
              ) : (
                paginatedEvaluations.map((row, i) => (
                  <tr
                    key={i}
                    className="transition-all duration-300 hover:bg-slate-50 active:scale-[0.99]"
                  >
                    <td className="px-4 py-4 text-[14px] text-slate-700 text-left">
                      {(evalCurrentPage - 1) * evalEntriesPerPage + i + 1}
                    </td>
                    <td className="px-4 py-4 text-[14px] text-slate-600 font-mono font-medium text-left">
                      {row.staff_code || `NV${String(row.user_id).padStart(3, "0")}`}
                    </td>
                    <td className="px-4 py-4 text-[14px] font-bold text-slate-800 text-left">
                      {row.user_name || row.name || `Nhân sự ${row.user_id}`}
                    </td>
                    <td className="px-4 py-4 text-[14px] text-slate-600 text-left">
                      {translateRole(row.title, language)}
                    </td>
                    <td className="px-4 py-4 text-[14px] text-slate-600 text-left">
                      {row.branch || "Trụ sở chính"}
                    </td>
                    <td className="px-4 py-4 text-[14px] text-slate-600 text-left">
                      {row.month}/{row.year}
                    </td>
                    <td className="px-4 py-4 text-[14px] text-left">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {row.rating}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[14px] text-left text-emerald-600 font-bold font-mono">
                      {row.bonus_amount?.toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="px-4 py-4 text-[14px] text-slate-600 leading-relaxed max-w-md break-words text-left">
                      {row.notes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex justify-between items-center text-[13px] text-slate-600 border-t border-slate-200">
          <span>
            {language === "vi"
              ? `Đang xem ${filteredEvaluations.length > 0 ? (evalCurrentPage - 1) * evalEntriesPerPage + 1 : 0} đến ${Math.min(evalCurrentPage * evalEntriesPerPage, filteredEvaluations.length)} trong tổng số ${filteredEvaluations.length} mục`
              : `Showing ${filteredEvaluations.length > 0 ? (evalCurrentPage - 1) * evalEntriesPerPage + 1 : 0} to ${Math.min(evalCurrentPage * evalEntriesPerPage, filteredEvaluations.length)} of ${filteredEvaluations.length} entries`}
          </span>
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
            <button 
              disabled={evalCurrentPage === 1}
              onClick={() => setEvalCurrentPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1.5 text-slate-600 transition-all duration-300 hover:bg-slate-100 border-r border-slate-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {language === "vi" ? "Trước" : "Prev"}
            </button>
            <span className="px-3 py-1.5 bg-slate-50 text-slate-800 font-medium font-mono border-r border-slate-300">
              {evalCurrentPage} / {evalTotalPages}
            </span>
            <button 
              disabled={evalCurrentPage === evalTotalPages}
              onClick={() => setEvalCurrentPage(p => Math.min(p + 1, evalTotalPages))}
              className="px-3 py-1.5 text-slate-600 transition-all duration-300 hover:bg-slate-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {language === "vi" ? "Tiếp" : "Next"}
            </button>
          </div>
        </div>
      </div>

      {selectedPayroll != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8">
            {(() => {
              const gross = selectedPayroll.gross || 0;
              const food = selectedPayroll.food_allowance || 0;
              const gas = selectedPayroll.gas_allowance || 0;
              const phone = selectedPayroll.phone_allowance || 0;
              const other = selectedPayroll.other_benefits || 0;
              const bonus = selectedPayroll.bonus || 0;
              const violations = selectedPayroll.violations || 0;
              const insurance = selectedPayroll.insurance || 0;
              const tax = selectedPayroll.tax || 0;
              const totalSalary = gross + food + gas + phone;
              const netSalary = totalSalary + other + bonus - violations - insurance - tax;
              selectedPayroll.total_salary_computed = totalSalary;
              selectedPayroll.net_computed = netSalary;
              return null;
            })()}
            <div className="flex justify-between items-center p-6 border-b border-slate-200 shrink-0 bg-white rounded-lg">
              <h2 className="text-xl font-bold text-slate-900">
                {language === "vi"
                  ? "Thông tin chi tiết bảng lương"
                  : "Payslip Details"}
              </h2>
              <button
                onClick={() => setSelectedPayroll(null)}
                className="text-slate-400 hover:text-slate-600 transition-all duration-300 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Tên nhân sự" : "Name"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-medium">
                    {selectedPayroll.user_name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Chi nhánh" : "Branch"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center">
                    {selectedPayroll.branch || "-"}
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Ngân hàng" : "Bank"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center">
                    {selectedPayroll.bank || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Số tài khoản" : "Bank Account"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {selectedPayroll.bank_account || "-"}
                  </div>
                </div>
              </div>

              {/* Row Extra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                     {language === "vi" ? "Số người phụ thuộc" : "Dependents"}
                   </label>
                   <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                     {selectedPayroll.dependents || 0}
                   </div>
                 </div>
                 <div></div>
              </div>
              
              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Kỳ lương (Tháng)" : "Month"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center">
                    {`${currentYear}-${currentMonth.toString().padStart(2, "0")}`}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Ngày công (Thực tế)" : "Working Days"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center">
                    {selectedPayroll.working_days || 0}
                  </div>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Lương Cơ Bản" : "Basic Salary"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.gross || 0).toLocaleString("en-US")}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Phụ cấp ăn trưa" : "Food Allowance"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.food_allowance || 0).toLocaleString(
                      "en-US",
                    )}
                  </div>
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Phụ cấp xăng xe" : "Gas Allowance"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.gas_allowance || 0).toLocaleString(
                      "en-US",
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi"
                      ? "Phụ cấp điện thoại"
                      : "Phone Allowance"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.phone_allowance || 0).toLocaleString(
                      "en-US",
                    )}
                  </div>
                </div>
              </div>

              {/* Row 9 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Phụ cấp" : "Benefits"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.other_benefits || 0).toLocaleString(
                      "en-US",
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Thưởng" : "Bonus"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.bonus || 0).toLocaleString("en-US")}
                  </div>
                </div>
              </div>

              {/* Row 10 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Vi phạm" : "Violations"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-red-600 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.violations || 0).toLocaleString("en-US")}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Trừ BHXH" : "Insurance Deduction"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.insurance || 0).toLocaleString("en-US")}
                  </div>
                </div>
              </div>

              {/* Row 11 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Thuế TNCN" : "Personal Income Tax"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-mono">
                    {(selectedPayroll.tax || 0).toLocaleString("en-US")}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Tổng lương" : "Total Salary"}
                  </label>
                  <div className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 min-h-[44px] flex items-center font-bold font-mono">
                    {(selectedPayroll.total_salary || 0).toLocaleString(
                      "en-US",
                    )}
                  </div>
                </div>
              </div>

              {/* Net Salary Full Width */}
              <div>
                <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                  {language === "vi" ? "Thực nhận" : "Net Salary"}
                </label>
                <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-[var(--color-primary)] min-h-[48px] flex items-center font-bold font-mono text-lg">
                  {(selectedPayroll.net || 0).toLocaleString("en-US")}
                </div>
                <p className="text-[#5c6e81] text-sm mt-3 italic">
                  Bằng chữ: {numberToWords(selectedPayroll.net || 0)}
                </p>
              </div>

              {renderTaxDetails(selectedPayroll, language)}
            </div>

            <div className="flex justify-end gap-4 p-6 border-t border-slate-200 bg-white rounded-lg shrink-0 mt-2">
              <button
                onClick={() => setSelectedPayroll(null)}
                className="px-6 py-2.5 text-slate-800 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm"
              >
                {language === "vi" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView({ language }: { language: "vi" | "en" }) {
  const [events, setEvents] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    title: "",
    start: new Date(),
    end: new Date(),
  });

  const t = {
    vi: {
      month: "Tháng",
      week: "Tuần",
      day: "Ngày",
      agenda: "Lịch trình",
      today: "Hôm nay",
      previous: "Trước",
      next: "Sau",
      noEventsInRange: "Không có sự kiện nào trong khoảng thời gian này.",
      showMore: (total: number) => "+" + total + " Xem thêm",
      addEvent: "Thêm sự kiện",
      editEvent: "Sửa sự kiện",
      eventTitle: "Tên sự kiện",
      save: "Lưu",
      cancel: "Hủy",
      delete: "Xóa",
      startDate: "Bắt đầu",
      endDate: "Kết thúc",
    },
    en: {
      month: "Month",
      week: "Week",
      day: "Day",
      agenda: "Agenda",
      today: "Today",
      previous: "Back",
      next: "Next",
      noEventsInRange: "There are no events in this range.",
      showMore: (total: number) => "+" + total + " Show more",
      addEvent: "Add Event",
      editEvent: "Edit Event",
      eventTitle: "Event Title",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      startDate: "Start",
      endDate: "End",
    },
  }[language];

  const handleSelectSlot = ({ start, end }: any) => {
    setModalMode("add");
    setFormData({ title: "", start, end });
    setShowModal(true);
  };

  const handleSelectEvent = (event: any) => {
    setModalMode("edit");
    setSelectedEvent(event);
    setFormData({ title: event.title, start: event.start, end: event.end });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;

    let color = "slate";
    let icon = "Calendar";

    switch (formData.type) {
      case "Họp":
        color = "orange";
        icon = "Briefcase";
        break;
      case "Gặp khách hàng":
        color = "blue";
        icon = "Users";
        break;
      case "Công tác":
        color = "emerald";
        icon = "MapPin";
        break;
      case "Tòa án":
        color = "red";
        icon = "Gavel";
        break;
      case "Hồ sơ":
        color = "purple";
        icon = "FileText";
        break;
      default:
        color = "slate";
        icon = "Calendar";
    }

    const eventData = { ...formData, color, icon };

    if (modalMode === "add") {
      setEvents([...events, { id: Date.now(), ...eventData }]);
    } else {
      setEvents(
        events.map((e) =>
          e.id === selectedEvent.id ? { ...e, ...eventData } : e,
        ),
      );
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (selectedEvent) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setShowModal(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex-1 flex flex-col h-full min-h-0 relative">
      <BigCalendarComponent
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        culture={language === "vi" ? "vi" : "en-US"}
        messages={{
          month: t.month,
          week: t.week,
          day: t.day,
          agenda: t.agenda,
          today: t.today,
          previous: t.previous,
          next: t.next,
          noEventsInRange: t.noEventsInRange,
          showMore: t.showMore,
        }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {modalMode === "add" ? t.addEvent : t.editEvent}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.eventTitle}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.startDate}
                  </label>
                  <input
                    type="datetime-local"
                    value={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start: new Date(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.endDate}
                  </label>
                  <input
                    type="datetime-local"
                    value={format(formData.end, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        end: new Date(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              {modalMode === "edit" ? (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 transition-all duration-300 hover:bg-red-50 rounded-lg font-medium transition-all duration-300 active:scale-95"
                >
                  {t.delete}
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 transition-all duration-300 hover:bg-slate-100 rounded-lg font-medium transition-all duration-300 active:scale-95"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white rounded-lg font-medium transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventsView({
  language,
  user,
  records,
  events,
  setEvents,
  myPermissions,
  setHeaderInfo,
}: {
  language: "vi" | "en";
  user: any;
  records: any[];
  events: any[];
  setEvents: (events: any[]) => void;
  myPermissions?: any;
  setHeaderInfo?: (info: {title: string, subtitle: React.ReactNode, rightContent?: React.ReactNode} | null) => void;
}) {
  const canManageEvents = myPermissions
    ? myPermissions.manageEvents
    : ["admin", "director", "deputyDirector", "deputy_director", "manager", "head_of_department", "manage"].includes(
        user?.role || "",
      );
  const canViewEventHistory = myPermissions
    ? myPermissions.viewEventHistory
    : ["admin", "director", "deputyDirector", "deputy_director"].includes(user?.role || "");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState<
    "day" | "week" | "month"
  >("week");
  const [history, setHistory] = useState<
    { action: string; title: string; user: string; time: string }[]
  >(() => {
    try {
      const saved = localStorage.getItem("erp_event_history_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("erp_event_history_v2", JSON.stringify(history));
  }, [history]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(1);
  const [chatMessages, setChatMessages] = useState<
    {
      id: number;
      sender: string;
      text: string;
      type?: "text" | "image" | "video" | "file";
      fileUrl?: string;
      fileName?: string;
    }[]
  >([
    {
      id: 1,
      sender: "A",
      text: "Chào mọi người, chiều nay có cuộc họp lúc 14:00 nhé.",
    },
    { id: 2, sender: "user", text: "Đã nhận thông tin." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat) {
      setUnreadChatCount(0);
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [showChat, chatMessages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages([
      ...chatMessages,
      { id: Date.now(), sender: "user", text: chatInput },
    ]);
    setChatInput("");
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "file",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setChatMessages([
        ...chatMessages,
        {
          id: Date.now(),
          sender: "user",
          text: `Đã gửi ${type === "image" ? "hình ảnh" : type === "video" ? "video" : "tệp tin"}`,
          type,
          fileUrl,
          fileName: file.name,
        },
      ]);
    }
  };

  const [currentDate, setCurrentDate] = useState(() => {
    return new Date();
  });
  const [viewMode, setViewMode] = useState<"grid" | "list" | "kanban" | "admin">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [titleError, setTitleError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    id: null as number | null,
    title: "",
    type: "Khác",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "10:00",
    location: "",
    priority: "Trung bình",
    allDay: false,
    reminder: "Không nhắc nhở",
    notes: "",
  });

  const t = {
    vi: {
      title: "Sự kiện & Lịch công tác",
      weekFrom: "Tuần từ",
      search: "Tìm kiếm...",
      today: "Hôm nay",
      addEvent: "Thêm sự kiện",
      addEventTitle: "Thêm sự kiện mới",
      editEvent: "Sửa sự kiện",
      eventTitle: "Tiêu đề sự kiện",
      eventTitlePlaceholder: "Nhập tiêu đề sự kiện...",
      eventType: "Loại sự kiện",
      timeSection: "THỜI GIAN",
      startDate: "Bắt đầu",
      endDate: "Kết thúc",
      remindBefore: "Nhắc trước",
      locationParticipantsSection: "ĐỊA ĐIỂM & NGƯỜI THAM GIA",
      location: "Địa điểm",
      locationPlaceholder: "Nhập địa điểm tổ chức...",
      participants: "Phân công cho / Người tham gia",
      participantsNote:
        "* Chọn nhân viên để tạo Lịch công tác, để trống nếu là Sự kiện chung",
      additionalSettingsSection: "CÀI ĐẶT BỔ SUNG",
      permissionsSection: "PHÂN QUYỀN",
      personalDept: "Cá nhân / Phòng ban",
      wholeCompany: "Toàn công ty",
      importantSchedule:
        "Lịch quan trọng (Mọi người sẽ thấy và nhận thông báo)",
      notesAttachmentsSection: "GHI CHÚ & TỆP ĐÍNH KÈM",
      notesPlaceholder: "Nhập ghi chú...",
      cancel: "Hủy",
      save: "Lưu sự kiện",
      dayNames: [
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
        "Chủ Nhật",
      ],
      commentAlert: "Tính năng bình luận đang được phát triển.",
      listViewAlert: "Chế độ xem danh sách đang được phát triển.",
    },
    en: {
      title: "Events & Schedule",
      weekFrom: "Week of",
      search: "Search...",
      today: "Today",
      addEvent: "Add event",
      addEventTitle: "Add new event",
      editEvent: "Edit event",
      eventTitle: "Event title",
      eventTitlePlaceholder: "Enter event title...",
      eventType: "Event type",
      timeSection: "TIME",
      startDate: "Start",
      endDate: "End",
      remindBefore: "Remind before",
      locationParticipantsSection: "LOCATION & PARTICIPANTS",
      location: "Location",
      locationPlaceholder: "Enter event location...",
      participants: "Assign to / Participants",
      participantsNote:
        "* Select staff to create Work Schedule, leave blank for General Event",
      additionalSettingsSection: "ADDITIONAL SETTINGS",
      permissionsSection: "PERMISSIONS",
      personalDept: "Personal / Department",
      wholeCompany: "Whole company",
      importantSchedule:
        "Important schedule (Everyone will see and receive notifications)",
      notesAttachmentsSection: "NOTES & ATTACHMENTS",
      notesPlaceholder: "Enter notes...",
      cancel: "Cancel",
      save: "Save event",
      dayNames: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      commentAlert: "Comment feature is under development.",
      listViewAlert: "List view is under development.",
    },
  }[language];

  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date();
    let day = today.getDay();
    // JS getDay(): Sunday is 0, Monday is 1, ..., Saturday is 6
    // We want Monday = 0, ..., Sunday = 6
    return day === 0 ? 6 : day - 1;
  });

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    const day = newDate.getDay();
    setSelectedDayIndex(day === 0 ? 6 : day - 1);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    const day = newDate.getDay();
    setSelectedDayIndex(day === 0 ? 6 : day - 1);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const day = today.getDay();
    setSelectedDayIndex(day === 0 ? 6 : day - 1);
  };

  const getWeekRangeString = () => {
    if (calendarViewMode === "month") {
      return language === "vi"
        ? `Tháng ${currentDate.getMonth() + 1} / ${currentDate.getFullYear()}`
        : `${currentDate.toLocaleString("en-US", { month: "long" })} ${currentDate.getFullYear()}`;
    }
    if (calendarViewMode === "day") {
      return language === "vi"
        ? `Ngày ${String(currentDate.getDate()).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${currentDate.getFullYear()}`
        : `Day ${String(currentDate.getDate()).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${currentDate.getFullYear()}`;
    }
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day + (day === 0 ? -6 : 1));

    const start = new Date(startOfWeek);
    const end = new Date(startOfWeek);
    end.setDate(end.getDate() + 6);

    const formatDate = (date: Date) => {
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    };

    return `${t.weekFrom} ${formatDate(start)} - ${formatDate(end)}`;
  };

  /* Removed old useEffect */

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    d.setDate(d.getDate() + i);
    return d;
  });

  const formatDateStr = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const colorMap: Record<string, string> = {
    orange:
      "bg-orange-50 border border-orange-100 border-l-4 border-l-orange-500 text-orange-800",
    emerald:
      "bg-emerald-50 border border-emerald-100 border-l-4 border-l-emerald-500 text-emerald-800",
    blue: "bg-blue-50 border border-blue-100 border-l-4 border-l-blue-500 text-blue-800",
    purple:
      "bg-purple-50 border border-purple-100 border-l-4 border-l-purple-500 text-purple-800",
    red: "bg-red-50 border border-red-100 border-l-4 border-l-red-500 text-red-800",
    amber:
      "bg-amber-50 border border-amber-100 border-l-4 border-l-amber-500 text-amber-800",
    slate:
      "bg-slate-50 border border-slate-100 border-l-4 border-l-slate-500 text-slate-800",
  };

  const dotColorMap: Record<string, string> = {
    orange: "bg-orange-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    slate: "bg-slate-300",
  };

  const handleSaveEvent = () => {
    let hasError = false;
    if (!eventFormData.title || !eventFormData.title.trim()) {
      setTitleError(true);
      hasError = true;
    } else {
      setTitleError(false);
    }
    if (!eventFormData.startDate) {
      setDateError(true);
      hasError = true;
    } else {
      setDateError(false);
    }
    if (hasError) return;

    const date = eventFormData.startDate;

    let color = "slate";
    let icon = "Calendar";

    switch (eventFormData.type) {
      case "Họp":
        color = "orange";
        icon = "Briefcase";
        break;
      case "Gặp khách hàng":
        color = "blue";
        icon = "Users";
        break;
      case "Công tác":
        color = "emerald";
        icon = "MapPin";
        break;
      case "Tòa án":
        color = "red";
        icon = "Gavel";
        break;
      case "Hồ sơ":
        color = "purple";
        icon = "FileText";
        break;
      default:
        color = "slate";
        icon = "Calendar";
    }

    if (eventFormData.id) {
      const updatedEventInfo = {
        id: eventFormData.id,
        title: eventFormData.title,
        date,
        startDate: date,
        start: eventFormData.startTime,
        startTime: eventFormData.startTime,
        end: eventFormData.endTime,
        endTime: eventFormData.endTime,
        type: eventFormData.type,
        location: eventFormData.location,
        priority: eventFormData.priority,
        allDay: eventFormData.allDay,
        reminder: eventFormData.reminder,
        notes: eventFormData.notes,
        color,
        icon,
      };

      setEvents(
        events.map((e) => (e.id === eventFormData.id ? updatedEventInfo : e))
      );

      setHistory((h) => [
        {
          action: "Sửa",
          title: eventFormData.title,
          user: user?.name || user?.username || "Chưa rõ",
          time: new Date().toLocaleString("vi-VN"),
        },
        ...h,
      ]);

      if (selectedEvent && selectedEvent.id === eventFormData.id) {
        setSelectedEvent(updatedEventInfo);
      }
    } else {
      const newEvent = {
        id: Date.now(),
        title: eventFormData.title,
        date,
        startDate: date,
        start: eventFormData.startTime,
        startTime: eventFormData.startTime,
        end: eventFormData.endTime,
        endTime: eventFormData.endTime,
        type: eventFormData.type,
        location: eventFormData.location,
        priority: eventFormData.priority,
        allDay: eventFormData.allDay,
        reminder: eventFormData.reminder,
        notes: eventFormData.notes,
        color,
        icon,
      };
      setEvents([...events, newEvent]);
      setHistory((h) => [
        {
          action: "Thêm",
          title: eventFormData.title,
          user: user?.name || user?.username || "Chưa rõ",
          time: new Date().toLocaleString("vi-VN"),
        },
        ...h,
      ]);
    }

    setShowAddEvent(false);
    setTitleError(false);
    setDateError(false);
    setEventFormData({
      id: null,
      title: "",
      type: "Khác",
      startDate: "",
      startTime: "09:00",
      endDate: "",
      endTime: "10:00",
      location: "",
      priority: "Trung bình",
      allDay: false,
      reminder: "Không nhắc nhở",
      notes: "",
    });
  };

  const handleEditEvent = (event: any) => {
    setTitleError(false);
    setDateError(false);
    setEventFormData({
      id: event.id,
      title: event.title,
      type: event.type,
      startDate: event.date,
      startTime: event.start,
      endDate: event.date,
      endTime: event.end,
      location: event.location || "",
      priority: event.priority || "Trung bình",
      allDay: event.allDay || false,
      reminder: event.reminder || "Không nhắc nhở",
      notes: event.notes || "",
    });
    setShowAddEvent(true);
  };

  const renderEventDetail = () => {
    if (!selectedEvent) return null;

    // Format date string robustly
    let eventDate = new Date(selectedEvent.date);
    if (isNaN(eventDate.getTime()) && selectedEvent.date) {
      const parts = String(selectedEvent.date).split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          eventDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          eventDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
    }
    const hasValidDate = !isNaN(eventDate.getTime());
    const dayOfWeek = hasValidDate ? (eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1) : 0;
    const dayName = hasValidDate ? (t.dayNames[dayOfWeek] || "Chưa rõ") : "Chưa rõ";

    const dateStr = hasValidDate
      ? `${dayName}, ngày ${String(eventDate.getDate()).padStart(2, "0")}/${String(eventDate.getMonth() + 1).padStart(2, "0")}/${eventDate.getFullYear()}`
      : String(selectedEvent.date || "Chưa rõ");

    const shortDateStr = hasValidDate
      ? `${String(eventDate.getDate()).padStart(2, "0")}/${String(eventDate.getMonth() + 1).padStart(2, "0")}`
      : "Chi tiết";

    return (
      <div className="bg-slate-50 min-h-full flex flex-col flex-1 h-full rounded-lg overflow-hidden border border-slate-200">
        <div className="sticky top-0 bg-slate-50 z-20 px-4 py-3 flex justify-between items-center border-b border-slate-200">
          <button
            onClick={() => setSelectedEvent(null)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white shadow-sm text-slate-800 font-medium transition-all duration-300 hover:bg-slate-100 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={18} />
            {shortDateStr}
          </button>
          <button
            onClick={() => handleEditEvent(selectedEvent)}
            className="px-4 py-2 rounded-lg bg-white shadow-sm text-slate-800 font-medium transition-all duration-300 hover:bg-slate-100 active:scale-95 cursor-pointer"
          >
            Sửa
          </button>
        </div>

        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {selectedEvent.start ? `${String(selectedEvent.start).replace(":", "h")} ` : ""}{selectedEvent.title}
          </h2>
          <div className="text-slate-800">{dateStr}</div>
          <div className="text-slate-500 text-sm mb-8">
            {selectedEvent.start || "Cả ngày"} {selectedEvent.end ? `- ${selectedEvent.end}` : ""}
          </div>

          <div className="bg-white rounded-lg p-4 flex justify-between items-center mb-4 shadow-sm">
            <span className="text-slate-800 font-medium">Lịch</span>
            <div className="flex items-center gap-2 text-slate-500">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-lg",
                  dotColorMap[selectedEvent.color] || "bg-slate-400",
                )}
              ></div>
              <span>{selectedEvent.type || "Chưa phân loại"}</span>
              <ChevronRight size={16} className="rotate-90" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 flex justify-between items-center shadow-sm">
            <span className="text-slate-800 font-medium">Cảnh báo</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span>{selectedEvent.reminder || "Không nhắc nhở"}</span>
              <ChevronRight size={16} className="rotate-90" />
            </div>
          </div>

          {selectedEvent.location && (
            <div className="bg-white rounded-lg p-4 flex justify-between items-center shadow-sm mt-4">
              <span className="text-slate-800 font-medium">Địa điểm</span>
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={16} />
                <span>{selectedEvent.location}</span>
              </div>
            </div>
          )}

          {selectedEvent.notes && (
            <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
              <span className="text-slate-800 font-medium block mb-2">Ghi chú</span>
              <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">
                {selectedEvent.notes}
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto p-6 flex justify-center bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 rounded-lg bg-white shadow-sm text-red-500 border border-red-100 font-medium transition-all duration-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Trash2 size={16} />
            Xóa sự kiện
          </button>
        </div>
      </div>
    );
  };

  const listEvents = useMemo(() => {
    if (calendarViewMode === "day") {
      const dateStr = formatDateStr(weekDays[selectedDayIndex]);
      return events.filter((e) => e.date === dateStr);
    } else if (calendarViewMode === "week") {
      const weekDateStrs = weekDays.map((d) => formatDateStr(d));
      return events.filter((e) => weekDateStrs.includes(e.date));
    } else if (calendarViewMode === "month") {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      return events.filter((e) => {
        if (!e.date) return false;
        const [year, month] = e.date.split("-");
        return (
          parseInt(year) === currentYear && parseInt(month) - 1 === currentMonth
        );
      });
    }
    return events;
  }, [events, calendarViewMode, weekDays, selectedDayIndex, currentDate]);

  const renderModals = () => (
    <>
              {showHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
                      <h2 className="text-xl font-bold text-slate-800">
                        Lịch sử hoạt động sự kiện
                      </h2>
                      <button
                        onClick={() => setShowHistory(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg"
                      >
                        <X size={20} />
                      </button>
                    </div>
      
                    <div className="overflow-y-auto p-6 flex-1">
                      {history.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                          Chưa có lịch sử hoạt động nào.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {history.map((h, i) => (
                            <div
                              key={i}
                              className="flex gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50/50"
                            >
                              <div
                                className={`mt-1 shrink-0 ${h.action === "Thêm" ? "text-green-500" : h.action === "Xóa" ? "text-red-500" : "text-blue-500"}`}
                              >
                                {h.action === "Thêm" ? (
                                  <Plus size={20} />
                                ) : h.action === "Xóa" ? (
                                  <Trash2 size={20} />
                                ) : (
                                  <Calendar size={20} />
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-slate-800">
                                  <span className="font-semibold">{h.user}</span> đã{" "}
                                  <span
                                    className={`font-semibold ${h.action === "Thêm" ? "text-green-600" : h.action === "Xóa" ? "text-red-600" : "text-blue-600"}`}
                                  >
                                    {h.action.toLowerCase()}
                                  </span>{" "}
                                  sự kiện:
                                </p>
                                <p className="text-base text-slate-900 font-semibold mt-1 mb-1">
                                  {h.title}
                                </p>
                                <p className="text-xs text-slate-500">{h.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
      {showAddEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
              <div className="px-6 py-4 bg-[#0a2d37] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <Calendar size={18} className="text-amber-500 font-bold" />
                  </div>
                  <h3 className="text-base font-bold tracking-wide">
                    {eventFormData.id ? t.editEvent : t.addEventTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Tiêu đề sự kiện */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={15} className="text-slate-400" /> TÊN SỰ KIỆN / TIÊU ĐỀ CÔNG VIỆC <span className="text-red-500">*</span>
                  </h4>
                  <input
                    type="text"
                    value={eventFormData.title}
                    onChange={(e) => {
                      setEventFormData({
                        ...eventFormData,
                        title: e.target.value,
                      });
                      if (e.target.value.trim()) setTitleError(false);
                    }}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#0a2d37] focus:border-transparent outline-none text-sm font-semibold transition-all placeholder-slate-400 shadow-sm ${
                      titleError ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                    }`}
                    placeholder="Ví dụ: Phiên tòa phúc thẩm tranh chấp hợp đồng..."
                  />
                  {titleError && (
                    <p className="text-red-500 text-xs mt-1.5 font-semibold flex items-center gap-1">
                      ⚠️ Vui lòng nhập tiêu đề sự kiện.
                    </p>
                  )}
                </div>

                {/* PHÂN LOẠI CÔNG VIỆC & MỨC ĐỘ KHẨN CẤP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Briefcase size={15} className="text-slate-400" /> PHÂN LOẠI CÔNG VIỆC
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "Tòa án", label: "Phiên tòa", activeClass: "bg-red-50 border-red-300 text-red-700 font-bold shadow-sm ring-2 ring-red-100", inactiveClass: "bg-red-50/20 border-red-100/50 text-red-600/70 hover:bg-red-50 hover:text-red-700" },
                        { key: "Họp", label: "Họp nội bộ", activeClass: "bg-purple-50 border-purple-300 text-purple-700 font-bold shadow-sm ring-2 ring-purple-100", inactiveClass: "bg-purple-50/20 border-purple-100/50 text-purple-600/70 hover:bg-purple-50 hover:text-purple-700" },
                        { key: "Gặp khách hàng", label: "Khách hàng", activeClass: "bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-sm ring-2 ring-blue-100", inactiveClass: "bg-blue-50/20 border-blue-100/50 text-blue-600/70 hover:bg-blue-50 hover:text-blue-700" },
                        { key: "Công tác", label: "Nghiên cứu", activeClass: "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold shadow-sm ring-2 ring-emerald-100", inactiveClass: "bg-emerald-50/20 border-emerald-100/50 text-emerald-600/70 hover:bg-emerald-50 hover:text-emerald-700" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setEventFormData({ ...eventFormData, type: item.key })}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border text-center active:scale-95",
                            eventFormData.type === item.key ? item.activeClass : item.inactiveClass
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <AlertCircle size={15} className="text-slate-400" /> MỨC ĐỘ KHẨN CẤP / ƯU TIÊN
                    </h4>
                    <div className="flex gap-2">
                      {[
                        { key: "Thấp", label: "Thấp", activeClass: "bg-slate-100 border-slate-300 text-slate-800 font-bold ring-2 ring-slate-100", inactiveClass: "bg-slate-50/50 border-slate-200/60 text-slate-500 hover:bg-slate-50" },
                        { key: "Trung bình", label: "Trung bình", activeClass: "bg-amber-500 border-amber-600 text-white font-bold ring-2 ring-amber-100", inactiveClass: "bg-amber-50/50 border-amber-200/60 text-amber-600 hover:bg-amber-50" },
                        { key: "Cao", label: "Cao", activeClass: "bg-red-500 border-red-600 text-white font-bold ring-2 ring-red-100", inactiveClass: "bg-red-50/50 border-red-200/60 text-red-600 hover:bg-red-50" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setEventFormData({ ...eventFormData, priority: item.key })}
                          className={cn(
                            "flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border text-center active:scale-95",
                            (eventFormData.priority || "Trung bình") === item.key ? item.activeClass : item.inactiveClass
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* THỜI GIAN CHUNG BLOCK */}
                <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" /> BẮT ĐẦU TỪ NGÀY / GIỜ
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <DatePickerInput
                            value={eventFormData.startDate}
                            onChange={(val: string) => {
                              setEventFormData({
                                ...eventFormData,
                                startDate: val,
                              });
                              setDateError(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2 border rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-[#0a2d37] outline-none transition-all",
                              dateError ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                            )}
                            placeholder="dd/mm/yyyy"
                          />
                        </div>
                        <div className="relative w-28 shrink-0">
                          <input
                            type="time"
                            value={eventFormData.startTime}
                            onChange={(e) =>
                              setEventFormData({
                                ...eventFormData,
                                startTime: e.target.value,
                              })
                            }
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full h-[38px] px-3 border border-slate-200 rounded-xl bg-white flex justify-between items-center text-slate-700 text-sm font-medium">
                            <span>{eventFormData.startTime || "--:--"}</span>
                            <Clock size={14} className="text-slate-400" />
                          </div>
                        </div>
                      </div>
                      {dateError && (
                        <p className="text-red-500 text-[11px] font-semibold mt-1">
                          ⚠️ Vui lòng chọn ngày bắt đầu.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" /> HOÀN THÀNH / KẾT THÚC LÚC
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <DatePickerInput
                            value={eventFormData.endDate}
                            onChange={(val: string) =>
                              setEventFormData({
                                ...eventFormData,
                                endDate: val,
                              })
                            }
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-[#0a2d37] outline-none transition-all"
                            placeholder="dd/mm/yyyy"
                          />
                        </div>
                        <div className="relative w-28 shrink-0">
                          <input
                            type="time"
                            value={eventFormData.endTime}
                            onChange={(e) =>
                              setEventFormData({
                                ...eventFormData,
                                endTime: e.target.value,
                              })
                            }
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full h-[38px] px-3 border border-slate-200 rounded-xl bg-white flex justify-between items-center text-slate-700 text-sm font-medium">
                            <span>{eventFormData.endTime || "--:--"}</span>
                            <Clock size={14} className="text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Công việc kéo dài cả ngày</p>
                      <p className="text-[11px] text-slate-400 font-medium">Không hiển thị khung giờ cụ thể trên dòng thời gian</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={eventFormData.allDay || false}
                        onChange={(e) =>
                          setEventFormData({
                            ...eventFormData,
                            allDay: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0a2d37]"></div>
                    </label>
                  </div>
                </div>

                {/* ĐỊA ĐIỂM & NHẮC NHỞ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" /> ĐỊA ĐIỂM DIỄN RA / ĐƯỜNG DẪN HỌP
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input
                        type="text"
                        value={eventFormData.location}
                        onChange={(e) =>
                          setEventFormData({
                            ...eventFormData,
                            location: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0a2d37] outline-none text-sm font-medium placeholder-slate-400"
                        placeholder="Tòa án nhân dân, Phòng họp, Link Zoom..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Bell size={14} className="text-slate-400" /> THIẾT LẬP THÔNG BÁO NHẮC NHỞ
                    </label>
                    <div className="relative">
                      <Bell className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <select
                        value={eventFormData.reminder || "Không nhắc nhở"}
                        onChange={(e) =>
                          setEventFormData({
                            ...eventFormData,
                            reminder: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0a2d37] outline-none appearance-none bg-white text-sm font-medium text-slate-700"
                      >
                        <option value="Không nhắc nhở">Không nhắc nhở</option>
                        <option value="15 phút">Trước 15 phút</option>
                        <option value="30 phút">Trước 30 phút</option>
                        <option value="1 giờ">Trước 1 giờ</option>
                        <option value="1 ngày">Trước 1 ngày</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* NGƯỜI THAM GIA */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Users size={14} className="text-slate-400" /> PHÂN CÔNG CHO / NGƯỜI THAM GIA
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0a2d37] outline-none text-sm font-medium placeholder-slate-400"
                      placeholder={
                        language === "vi"
                          ? "Tìm kiếm nhân viên..."
                          : "Search employees..."
                      }
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {t.participantsNote}
                  </p>
                </div>

                {/* GHI CHÚ & TỆP ĐÍNH KÈM */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={14} className="text-slate-400" /> GHI CHÚ & TỆP ĐÍNH KÈM
                  </label>
                  <div className="space-y-3">
                    <textarea
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0a2d37] outline-none text-sm placeholder-slate-400"
                      rows={2}
                      placeholder={t.notesPlaceholder}
                      value={eventFormData.notes || ""}
                      onChange={(e) =>
                        setEventFormData({
                          ...eventFormData,
                          notes: e.target.value,
                        })
                      }
                    ></textarea>
                    <div className="border border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-3 text-center transition-all duration-300 hover:bg-slate-50 cursor-pointer active:scale-95 flex items-center justify-center gap-2">
                      <UploadCloud className="w-5 h-5 text-slate-400" />
                      <span className="text-xs text-slate-500 font-medium">
                        {language === "vi"
                          ? "Kéo thả tệp vào đây hoặc click để tải lên"
                          : "Drag and drop files here or click to upload"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddEvent(false)}
                  className="px-5 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors rounded-xl hover:bg-slate-50 active:scale-95"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  className="px-6 py-2 bg-[#0a2d37] hover:bg-[#0c3946] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                >
                  {eventFormData.id ? t.save : "Thêm mới"}
                </button>
              </div>
            </div>
          </div>
        )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[150] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all p-6 text-center border border-slate-100">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Xác nhận xóa sự kiện
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Bạn có chắc chắn muốn xóa sự kiện <span className="font-semibold text-slate-800">"{selectedEvent?.title}"</span> không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95 cursor-pointer text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedEvent) {
                    setEvents(events.filter((e) => e.id !== selectedEvent.id));
                    setHistory((h) => [
                      {
                        action: "Xóa",
                        title: selectedEvent.title,
                        user: user?.name || user?.username || "Chưa rõ",
                        time: new Date().toLocaleString("vi-VN"),
                      },
                      ...h,
                    ]);
                    setShowDeleteConfirm(false);
                    setSelectedEvent(null);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all active:scale-95 cursor-pointer text-sm shadow-md hover:shadow-lg"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const upcomingEvents = events
    .filter((e) => {
      const dStr = e.startDate || e.date;
      const tStr = e.startTime || e.start;
      if (!dStr || !tStr) return false;
      const eventDate = new Date(`${dStr}T${tStr}`);
      const now = new Date();
      const diff = eventDate.getTime() - now.getTime();
      return diff > 0 && diff < 24 * 60 * 60 * 1000; // within 24 hours
    })
    .sort((a, b) => {
      const dStrA = a.startDate || a.date;
      const tStrA = a.startTime || a.start;
      const dStrB = b.startDate || b.date;
      const tStrB = b.startTime || b.start;
      return (
        new Date(`${dStrA}T${tStrA}`).getTime() -
        new Date(`${dStrB}T${tStrB}`).getTime()
      );
    });

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: t.title,
        subtitle: getWeekRangeString(),
        rightContent: (
          <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden text-sm shrink-0">
            <div className="relative h-[32px] flex items-center hover:bg-slate-50 transition-all duration-300 border-r border-slate-200 bg-white">
              <select
                value={currentDate.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(parseInt(e.target.value));
                  setCurrentDate(newDate);
                  const day = newDate.getDay();
                  setSelectedDayIndex(day === 0 ? 6 : day - 1);
                }}
                className="pl-3 pr-8 h-full text-slate-700 outline-none bg-transparent cursor-pointer font-medium appearance-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {language === "vi" ? `Tháng ${i + 1}` : `Month ${i + 1}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative h-[32px] flex items-center hover:bg-slate-50 transition-all duration-300 bg-white">
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(parseInt(e.target.value));
                  setCurrentDate(newDate);
                  const day = newDate.getDay();
                  setSelectedDayIndex(day === 0 ? 6 : day - 1);
                }}
                className="pl-3 pr-8 h-full text-slate-700 outline-none bg-transparent cursor-pointer font-medium appearance-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {Array.from({ length: 11 }).map((_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} className="absolute right-2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        )
      });
    }
  }, [t.title, calendarViewMode, currentDate.getTime(), language, setHeaderInfo]);

  if (selectedEvent) {
    return (
      <>
        {renderEventDetail()}
        {renderModals()}
      </>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] p-3 rounded-xl">
              <CalendarDays size={28} />
            </div>
            <div className="text-center sm:text-left text-[var(--color-primary)] font-serif tracking-tight flex flex-col justify-center">
              {(() => {
                const dayNamesVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
                const dayName = language === "vi" ? dayNamesVi[currentDate.getDay()] : currentDate.toLocaleString("en-US", { weekday: 'long' });
                const dateString = language === "vi" 
                  ? `${String(currentDate.getDate()).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${currentDate.getFullYear()}`
                  : `${currentDate.toLocaleString("en-US", { month: 'short' })} ${String(currentDate.getDate()).padStart(2, "0")}, ${currentDate.getFullYear()}`;
                
                return (
                  <>
                    <span className="font-bold text-2xl md:text-3xl line-clamp-1">{dayName}</span>
                    <span className="text-base md:text-xl opacity-90 font-medium">{dateString}</span>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="relative">
              <button
                className="relative p-2 text-slate-600 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {upcomingEvents.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {upcomingEvents.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">
                      Thông báo sự kiện sắp tới
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 border-b border-slate-100 transition-all duration-300 hover:bg-slate-50 transition-all duration-300 active:scale-95 cursor-pointer"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 rounded-lg mt-1.5 shrink-0 ${event.type === "Phiên tòa" ? "bg-red-500" : event.type === "Họp khách hàng" ? "bg-blue-500" : "bg-purple-500"}`}
                            ></div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {event.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {event.startDate} {event.startTime}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Không có sự kiện nào sắp diễn ra
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                className="p-2 text-slate-600 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95"
                onClick={() => setShowChat(!showChat)}
              >
                <div className="relative">
                  <MessageSquare size={20} />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
              </button>
              {showChat && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden flex flex-col"
                  style={{ height: "400px" }}
                >
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white flex justify-between items-center">
                    <h3 className="font-bold">Trò chuyện nội bộ</h3>
                    <button
                      onClick={() => setShowChat(false)}
                      className="text-white/80 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex-1 p-4 bg-slate-50 overflow-y-auto flex flex-col gap-3">
                    <div className="text-center text-xs text-slate-400 my-2">
                      Hôm nay
                    </div>
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${msg.sender === "user" ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white" : "bg-blue-100 text-blue-600"}`}
                        >
                          {msg.sender === "user"
                            ? user?.name?.charAt(0) || "U"
                            : msg.sender}
                        </div>
                        <div
                          className={`p-2 rounded-lg shadow-sm text-sm border ${msg.sender === "user" ? "bg-blue-50 text-slate-800 border-blue-100 rounded-lg" : "bg-white text-slate-700 border-slate-100 rounded-lg"}`}
                        >
                          {msg.type === "image" && msg.fileUrl && (
                            <img
                              src={msg.fileUrl}
                              alt="Uploaded"
                              className="max-w-[200px] rounded-lg mb-2"
                            />
                          )}
                          {msg.type === "video" && msg.fileUrl && (
                            <video
                              src={msg.fileUrl}
                              controls
                              className="max-w-[200px] rounded-lg mb-2"
                            />
                          )}
                          {msg.type === "file" && msg.fileName && (
                            <div className="flex items-center gap-2 mb-2 p-2 bg-white/50 rounded-lg border border-slate-200">
                              <FileText size={16} className="text-slate-500" />
                              <span className="text-xs truncate max-w-[150px]">
                                {msg.fileName}
                              </span>
                            </div>
                          )}
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t border-slate-200 bg-white flex flex-col gap-2">
                    <div className="flex gap-2">
                      <label className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-600 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95">
                        <ImageIcon size={18} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "image")}
                        />
                      </label>
                      <label className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-600 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95">
                        <Video size={18} />
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "video")}
                        />
                      </label>
                      <label className="cursor-pointer p-1.5 text-slate-400 hover:text-slate-600 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95">
                        <Paperclip size={18} />
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "file")}
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                      />
                      <button
                        onClick={handleSendMessage}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white flex items-center justify-center transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95 shrink-0"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search}
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 w-64 transition-all"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                user?.name?.charAt(0) || "A"
              )}
            </div>
          </div>
        </div>
        {/* Second Row: Navigation & Actions */}
        <div className="px-6 pb-4 flex flex-col gap-4 shrink-0 mt-2">
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm p-1">
                <button
                  onClick={handlePrevWeek}
                  className="w-[30px] h-[30px] flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all duration-300 rounded active:scale-95"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 h-[30px] flex items-center justify-center transition-all duration-300 hover:bg-slate-100 text-slate-700 font-medium rounded text-sm active:scale-95 border-x border-slate-100"
                >
                  {(() => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const current = new Date(currentDate);
                    current.setHours(0,0,0,0);
                    const diffTime = current.getTime() - today.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) return language === "vi" ? "Hôm nay" : "Today";
                    if (diffDays === -1) return language === "vi" ? "Hôm qua" : "Yesterday";
                    if (diffDays === 1) return language === "vi" ? "Ngày mai" : "Tomorrow";
                    return `${String(currentDate.getDate()).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${currentDate.getFullYear()}`;
                  })()}
                </button>
                <button
                  onClick={handleNextWeek}
                  className="w-[30px] h-[30px] flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all duration-300 rounded active:scale-95"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium transition-all duration-300 hover:bg-slate-200 active:scale-95 whitespace-nowrap"
            >
              <Calendar size={18} />
              Lịch sử
            </button>
            <button
              onClick={() => {
                const selectedDateStr = formatDateStr(
                  weekDays[selectedDayIndex],
                );
                setEventFormData({
                  id: null,
                  title: "",
                  type: "Khác",
                  startDate: selectedDateStr,
                  startTime: "09:00",
                  endDate: selectedDateStr,
                  endTime: "10:00",
                  location: "",
                  priority: "Trung bình",
                  allDay: false,
                  reminder: "Không nhắc nhở",
                  notes: "",
                });
                setShowAddEvent(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg transition-all duration-300 hover:bg-blue-700 font-medium transition-all duration-300 active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} />
              {t.addEvent}
            </button>
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 border-r border-slate-200 transition-all duration-300 active:scale-95 ${viewMode === "grid" ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutDashboard size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-all duration-300 active:scale-95 ${viewMode === "list" ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-400 hover:text-slate-600"}`}
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </div>
        </div>
        {viewMode === "grid" ? (
          <>
            {/* Days Header */}
            {calendarViewMode === "week" && (
              <div className="grid grid-cols-7 gap-4 px-6 pb-4 shrink-0">
                {weekDays.map((date, i) => {
                  const isSelected = i === selectedDayIndex;
                  const dateStr = formatDateStr(date);
                  const dayEvents = events.filter((e) => e.date === dateStr);
                  const eventCount = dayEvents.length;

                  // Determine the dot color based on the first event, or default
                  const dotColor =
                    eventCount > 0
                      ? dotColorMap[dayEvents[0].color]
                      : "bg-slate-300";

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedDayIndex(i);
                        setCurrentDate(weekDays[i]);
                      }}
                      className={cn(
                        "flex flex-col p-3 rounded-lg border-b-4 transition-all cursor-pointer",
                        isSelected
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-transparent transition-all duration-300 hover:bg-slate-50",
                      )}
                    >
                      <div className="font-medium text-slate-800 mb-1">
                        {t.dayNames[i]}
                      </div>
                      <div
                        className={cn(
                          "text-xl font-bold mb-3",
                          isSelected ? "text-blue-600" : "text-slate-800",
                        )}
                      >
                        {String(date.getDate()).padStart(2, "0")}/
                        {String(date.getMonth() + 1).padStart(2, "0")}
                      </div>
                      <div className="flex items-center gap-2 mt-auto">
                        <div
                          className={cn("w-2 h-2 rounded-lg", dotColor)}
                        ></div>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-lg overflow-hidden">
                          <div
                            className={cn("h-full rounded-lg", dotColor)}
                            style={{
                              width: `${Math.min(eventCount * 25, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs font-bold text-slate-500 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center">
                          {eventCount}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {calendarViewMode === "day" && (
              <div className="px-6 pb-4 shrink-0">
                <div className="flex flex-col p-4 rounded-lg border-b-4 bg-blue-50 border-blue-500">
                  <div className="font-medium text-slate-800 mb-1">
                    {t.dayNames[selectedDayIndex]}
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {String(weekDays[selectedDayIndex].getDate()).padStart(
                      2,
                      "0",
                    )}
                    /
                    {String(weekDays[selectedDayIndex].getMonth() + 1).padStart(
                      2,
                      "0",
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    {
                      events.filter(
                        (e) =>
                          e.date === formatDateStr(weekDays[selectedDayIndex]),
                      ).length
                    }{" "}
                    {language === "vi" ? "sự kiện" : "events"}
                  </div>
                </div>
              </div>
            )}

            {calendarViewMode === "month" && (
              <div className="px-6 pb-4 shrink-0">
                <div className="grid grid-cols-7 gap-2">
                  {t.dayNames.map((day, i) => (
                    <div
                      key={i}
                      className="text-center font-medium text-slate-500 text-sm py-2"
                    >
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const date = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      1,
                    );
                    const firstDayIndex =
                      date.getDay() === 0 ? 6 : date.getDay() - 1;
                    date.setDate(date.getDate() - firstDayIndex + i);

                    const isCurrentMonth =
                      date.getMonth() === currentDate.getMonth();
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    const dateStr = formatDateStr(date);
                    const dayEvents = events.filter((e) => e.date === dateStr);

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setCurrentDate(date);
                          setCalendarViewMode("day");
                          setSelectedDayIndex(
                            date.getDay() === 0 ? 6 : date.getDay() - 1,
                          );
                        }}
                        className={cn(
                          "min-h-[80px] p-2 border border-slate-100 rounded-lg cursor-pointer transition-all duration-300 hover:bg-slate-50 transition-all duration-300 active:scale-95",
                          !isCurrentMonth && "opacity-40 bg-slate-50",
                          isToday && "border-blue-500 bg-blue-50/30",
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm font-medium mb-1",
                            isToday ? "text-blue-600" : "text-slate-700",
                          )}
                        >
                          {date.getDate()}
                        </div>
                        <div className="flex flex-col gap-1">
                          {dayEvents.slice(0, 3).map((e, j) => (
                            <div
                              key={j}
                              className={cn(
                                "text-[10px] px-1 rounded-lg truncate",
                                colorMap[e.color] ||
                                  "bg-slate-100 text-slate-700",
                              )}
                              title={e.title}
                            >
                              {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-slate-500 font-medium pl-1">
                              +{dayEvents.length - 3} nữa
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timeline Grid */}
            {(calendarViewMode === "week" || calendarViewMode === "day") && (
              <div className="flex-1 border-t border-slate-200 bg-white overflow-y-auto relative">
                <div className="flex min-w-[800px]">
                  {/* Time Column */}
                  <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white relative z-10">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="h-[60px] relative">
                        <span className="absolute -top-2.5 right-2 text-xs text-slate-500 font-medium">
                          {String(i).padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Days Columns */}
                  <div
                    className={cn(
                      "flex-1 grid relative",
                      calendarViewMode === "week"
                        ? "grid-cols-7"
                        : "grid-cols-1",
                    )}
                  >
                    {/* Grid Lines */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-[60px] border-b border-slate-100 w-full"
                        ></div>
                      ))}
                    </div>

                    {/* Columns */}
                    {(calendarViewMode === "week"
                      ? Array.from({ length: 7 })
                      : [0]
                    ).map((_, idx) => {
                      const dayIndex =
                        calendarViewMode === "week" ? idx : selectedDayIndex;
                      const columnDateStr = formatDateStr(weekDays[dayIndex]);
                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "border-r border-slate-100 relative h-[1440px]",
                            dayIndex === selectedDayIndex &&
                              calendarViewMode === "week"
                              ? "bg-blue-50/30"
                              : "",
                          )}
                        >
                          {/* Events for this day */}
                          {events
                            .filter((e) => e.date === columnDateStr)
                            .map((event) => {
                              const startStr = typeof event.start === "string" ? event.start : "00:00";
                              const endStr = typeof event.end === "string" ? event.end : "00:00";
                              const [startH, startM] = startStr.split(":").map(Number);
                              const [endH, endM] = endStr.split(":").map(Number);

                              const top = (isNaN(startH) ? 0 : startH) * 60 + (isNaN(startM) ? 0 : startM);
                              const height = Math.max(
                                30,
                                ((isNaN(endH) ? 0 : endH) - (isNaN(startH) ? 0 : startH)) * 60 +
                                  ((isNaN(endM) ? 0 : endM) - (isNaN(startM) ? 0 : startM)),
                              );

                              // Map icon string to component
                              const IconComponent =
                                event.icon === "Briefcase"
                                  ? Briefcase
                                  : event.icon === "Clock"
                                    ? Clock
                                    : event.icon === "FileText"
                                      ? FileText
                                      : event.icon === "FileCheck"
                                        ? FileCheck
                                        : event.icon === "Users"
                                          ? Users
                                          : event.icon === "Scale"
                                            ? Scale
                                            : event.icon === "PieChart"
                                              ? PieChart
                                              : event.icon === "Gavel"
                                                ? Gavel
                                                : event.icon === "Eye"
                                                  ? Eye
                                                  : event.icon === "Calendar"
                                                    ? Calendar
                                                    : event.icon === "BookOpen"
                                                      ? BookOpen
                                                      : Calendar;

                              return (
                                <div
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={cn(
                                    "absolute left-1 right-1 rounded-lg p-2 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col",
                                    colorMap[event.color],
                                  )}
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                  }}
                                >
                                  <div className="flex items-start gap-1.5 mb-1">
                                    <IconComponent
                                      size={14}
                                      className="mt-0.5 shrink-0 opacity-70"
                                    />
                                    <div className="font-semibold text-sm leading-tight">
                                      {event.title}
                                    </div>
                                  </div>
                                  <div className="text-xs opacity-70 mb-1">
                                    {event.start} - {event.end}
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1 text-xs opacity-70 mt-auto">
                                      <MapPin size={10} className="shrink-0" />
                                      <span className="truncate">
                                        {event.location}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-4">
              {listEvents.map((event, idx) => {
                const IconComponent =
                  event.icon === "Briefcase"
                    ? Briefcase
                    : event.icon === "Clock"
                      ? Clock
                      : event.icon === "FileText"
                        ? FileText
                        : event.icon === "FileCheck"
                          ? FileCheck
                          : event.icon === "Users"
                            ? Users
                            : event.icon === "Scale"
                              ? Scale
                              : event.icon === "PieChart"
                                ? PieChart
                                : event.icon === "Gavel"
                                  ? Gavel
                                  : event.icon === "Eye"
                                    ? Eye
                                    : event.icon === "Calendar"
                                      ? Calendar
                                      : event.icon === "BookOpen"
                                        ? BookOpen
                                        : Calendar;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                        colorMap[event.color],
                      )}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{typeof event.date === "string" ? event.date.split("-").reverse().join("/") : ""}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>
                            {event.start} - {event.end}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                        {event.type}
                      </span>
                    </div>
                  </div>
                );
              })}
              {listEvents.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  {language === "vi"
                    ? "Không có sự kiện nào"
                    : "No events found"}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-sm text-slate-600 font-medium">Họp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-600 font-medium">Tòa án</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-slate-600 font-medium">
                Khách hàng
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-sm text-slate-600 font-medium">Hồ sơ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-600 font-medium">
                Báo cáo
              </span>
            </div>
          </div>

          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setCalendarViewMode("day")}
              className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 active:scale-95 ${calendarViewMode === "day" ? "bg-blue-50 text-blue-600" : "text-slate-600 transition-all duration-300 hover:bg-slate-50"}`}
            >
              Ngày
            </button>
            <button
              onClick={() => setCalendarViewMode("week")}
              className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 active:scale-95 ${calendarViewMode === "week" ? "bg-blue-50 text-blue-600" : "text-slate-600 transition-all duration-300 hover:bg-slate-50"}`}
            >
              Tuần
            </button>
            <button
              onClick={() => setCalendarViewMode("month")}
              className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 active:scale-95 ${calendarViewMode === "month" ? "bg-blue-50 text-blue-600" : "text-slate-600 transition-all duration-300 hover:bg-slate-50"}`}
            >
              Tháng
            </button>
          </div>
        </div>{" "}
        {renderModals()}
      </div>
    </div>
  );
}

function ObsoleteSpecializedRecordsView({
  language,
  user,
  records,
  updateRecords,
  users = [],
  activeModule,
}: {
  language: "vi" | "en";
  user?: any;
  records: any[];
  updateRecords: (records: any[], changedRecord?: any, deletedId?: string) => void;
  users?: any[];
  activeModule: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    client: "",
    feeAmount: "",
    status: "Mới tiếp nhận",
    mainAssignee: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getModuleName = () => {
    switch (activeModule) {
      case "tu_van":
        return language === "vi" ? "Tư vấn Pháp luật" : "Legal Consultancy";
      case "dai_dien_ngoai_to_tung":
        return language === "vi" ? "Đại diện Ngoài Tố tụng" : "Out-of-court Representation";
      case "noi_bo":
        return language === "vi" ? "Pháp chế & Nội bộ" : "In-house Legal";
      case "trong_tai_hoa_giai":
        return language === "vi" ? "Trọng tài & Hòa giải" : "Arbitration & Mediation";
      default:
        return language === "vi" ? "Hồ sơ Chuyên môn" : "Specialized Dossiers";
    }
  };

  const getModuleCategory = () => {
    switch (activeModule) {
      case "tu_van":
        return "Tư vấn";
      case "dai_dien_ngoai_to_tung":
        return "Đại diện ngoài tố tụng";
      case "noi_bo":
        return "Nội bộ";
      case "trong_tai_hoa_giai":
        return "Trọng tài/Hòa giải";
      default:
        return "Khác";
    }
  };

  const moduleRecords = useMemo(() => {
    return records.filter((r) => {
      return r.practice_area === activeModule || r.category === getModuleCategory();
    });
  }, [records, activeModule]);

  const filteredModuleRecords = useMemo(() => {
    if (!searchQuery) return moduleRecords;
    return moduleRecords.filter((record) => matchesRecordSearch(record, searchQuery));
  }, [moduleRecords, searchQuery]);

  const totalCount = moduleRecords.length;
  const inProgressCount = moduleRecords.filter((r) => r.status === "Đang giải quyết").length;
  const completedCount = moduleRecords.filter((r) => r.status === "Hoàn thành").length;
  const totalRevenue = sumRecordRevenue(moduleRecords);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws);

          if (data && data.length > 0) {
            const imported: any[] = [];
            for (const row of data) {
              const newId = Date.now().toString() + Math.floor(Math.random() * 1000);
              const recItem = {
                id: newId,
                title: row["Tên hồ sơ"] || row["Tên vụ việc"] || row["Subject"] || row["Tiêu đề"] || "Hồ sơ chưa đặt tên",
                client: row["Khách hàng"] || row["Client"] || "Khách hàng mới",
                feeAmount: row["Phí dịch vụ"] || row["Fee"] || row["Doanh thu"] || "0",
                status: row["Trạng thái"] || row["Status"] || "Mới tiếp nhận",
                mainAssignee: row["Người phụ trách"] || row["Chuyên viên"] || row["Assignee"] || user?.name || "",
                description: row["Mô tả"] || row["Nội dung"] || row["Description"] || "",
                date: row["Ngày tiếp nhận"] || new Date().toLocaleDateString("vi-VN"),
                practice_area: activeModule,
                category: getModuleCategory(),
              };
              try {
                await api.req("/api/erp-records", "POST", { id: newId, data: recItem, createOnly: true });
                imported.push(recItem);
              } catch (saveErr) {
                console.error("Failed to save imported record to server:", saveErr);
              }
            }
            updateRecords([...imported, ...records]);
            alert(
              language === "vi"
                ? `Nhập thành công ${data.length} hồ sơ ${getModuleName()} từ file Excel!`
                : `Successfully imported ${data.length} ${getModuleName()} records from Excel!`
            );
          } else {
            alert(language === "vi" ? "File Excel không có dữ liệu!" : "Excel file contains no data!");
          }
        } catch (err) {
          console.error(err);
          alert(language === "vi" ? "Đã có lỗi xảy ra khi đọc file Excel!" : "Error parsing Excel file!");
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert(language === "vi" ? "Vui lòng nhập tên hồ sơ!" : "Please enter record title!");
      return;
    }

    const newId = Date.now().toString() + Math.floor(Math.random() * 1000);
    const newRec = {
      id: newId,
      title: formData.title,
      client: formData.client || (language === "vi" ? "Chưa rõ" : "Unknown"),
      feeAmount: formData.feeAmount || "0",
      status: formData.status,
      mainAssignee: formData.mainAssignee || user?.name || "",
      branch: formData.branch || user?.branch || user?.office || "Hà Nội",
      userEA: user?.username || "",
      description: formData.description,
      date: formData.date,
      practice_area: activeModule,
      category: getModuleCategory(),
    };

    try {
      await api.req("/api/erp-records", "POST", { id: newId, data: newRec, createOnly: true });
      updateRecords([newRec, ...records]);
      setShowAddModal(false);
      setFormData({
        title: "",
        client: "",
        feeAmount: "",
        status: "Mới tiếp nhận",
        mainAssignee: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });

      alert(language === "vi" ? "Thêm hồ sơ thành công!" : "Dossier added successfully!");
    } catch (err) {
      console.error("Failed to save record to server:", err);
      alert(language === "vi" ? "Lỗi khi lưu hồ sơ lên hệ thống!" : "Error saving record to server!");
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm(language === "vi" ? "Bạn có chắc chắn muốn xóa hồ sơ này?" : "Are you sure you want to delete this record?")) {
      const targetRecord = records.find(
        (r) => String(r.id) === String(id) || String(r.contractId) === String(id) || String(r.systemId) === String(id)
      );
      const remaining = records.filter(
        (r) => String(r.id) !== String(id) && String(r.contractId) !== String(id) && String(r.systemId) !== String(id)
      );
      updateRecords(remaining, targetRecord, id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-6 bg-[var(--color-primary)] rounded-full inline-block"></span>
            {getModuleName()}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === "vi"
              ? `Không gian làm việc chuyên môn quản lý & tải lên hồ sơ vụ việc`
              : `Specialized workspace to upload and manage dossier case records`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold transition animate-in fade-in"
          >
            <FileSpreadsheet size={16} />
            {language === "vi" ? "Nhập từ Excel" : "Import Excel"}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm animate-in fade-in"
          >
            <Plus size={16} />
            {language === "vi" ? "Thêm hồ sơ mới" : "Add Dossier"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">{language === "vi" ? "TỔNG SỐ HỒ SƠ" : "TOTAL DOSSIERS"}</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">{language === "vi" ? "ĐANG THỰC HIỆN" : "IN PROGRESS"}</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">{inProgressCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">{language === "vi" ? "ĐẠT HOÀN THÀNH" : "COMPLETED"}</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{completedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">{language === "vi" ? "TỔNG PHÍ DỊCH VỤ" : "REVENUE"}</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {totalRevenue.toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-500">VND</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            {language === "vi" ? "Danh sách hồ sơ thực" : "Dossier list"}
          </p>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm kiếm vụ việc..." : "Search cases..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            />
          </div>
        </div>

        {filteredModuleRecords.length === 0 ? (
          <div className="py-16 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-600 mt-4">
              {language === "vi" ? "Chưa có hồ sơ nào trong mục này" : "No records found in this category"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {language === "vi" ? "Nhấn nút 'Nhập từ Excel' hoặc 'Thêm hồ sơ mới' để bắt đầu." : "Click 'Import Excel' or 'Add Dossier' to begin."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <th className="py-4 px-6">{language === "vi" ? "Tên vụ việc / Khách hàng" : "Case / Client"}</th>
                  <th className="py-4 px-6">{language === "vi" ? "Người phụ trách" : "Assignee"}</th>
                  <th className="py-4 px-6">{language === "vi" ? "Phí dịch vụ" : "Service Fee"}</th>
                  <th className="py-4 px-6">{language === "vi" ? "Trạng thái" : "Status"}</th>
                  <th className="py-4 px-6">{language === "vi" ? "Ngày tiếp nhận" : "Date"}</th>
                  <th className="py-4 px-6 text-right">{language === "vi" ? "Hành động" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredModuleRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">{rec.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">KH: <span className="font-medium">{rec.client}</span></p>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {rec.mainAssignee || "---"}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {Number(rec.feeAmount || rec.revenue || 0).toLocaleString("vi-VN")} VND
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-semibold",
                          rec.status === "Hoàn thành"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : rec.status === "Đang giải quyết"
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        )}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{rec.date}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-[11px]"
                      >
                        {language === "vi" ? "Xóa" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[var(--color-primary)] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{language === "vi" ? "Thêm hồ sơ chuyên môn" : "Add Specialized Dossier"}</h3>
                <p className="text-[10px] text-white/70 mt-1">{getModuleName()}</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleCreateRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{language === "vi" ? "Tên vụ việc / Hồ sơ *" : "Case / Record Title *"}</label>
                <input
                  type="text"
                  required
                  placeholder={language === "vi" ? "Ví dụ: Tư vấn rà soát hợp đồng thương mại" : "e.g. Consultancy for trade contract review"}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === "vi" ? "Khách hàng" : "Client"}</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === "vi" ? "Phí dịch vụ (VND)" : "Fee (VND)"}</label>
                  <input
                    type="number"
                    placeholder="10000000"
                    value={formData.feeAmount}
                    onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === "vi" ? "Người phụ trách" : "Assignee"}</label>
                  <select
                    value={formData.mainAssignee}
                    onChange={(e) => setFormData({ ...formData, mainAssignee: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  >
                    <option value="">{language === "vi" ? "-- Chọn nhân sự --" : "-- Select Staff --"}</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.name}>{u.name} ({u.title || "Nhân viên"})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{language === "vi" ? "Trạng thái" : "Status"}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  >
                    <option value="Mới tiếp nhận">{language === "vi" ? "Mới tiếp nhận" : "Newly Received"}</option>
                    <option value="Đang giải quyết">{language === "vi" ? "Đang giải quyết" : "In Progress"}</option>
                    <option value="Hoàn thành">{language === "vi" ? "Hoàn thành" : "Completed"}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{language === "vi" ? "Mô tả / Nội dung tóm tắt" : "Description / Summary"}</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  {language === "vi" ? "Tạo hồ sơ" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordsView({
  language,
  user,
  records,
  updateRecords,
  contractToView,
  setContractToView,
  myPermissions,
  users,
  unreadInternalChats,
  selectedCategoryProp,
  setSelectedCategoryProp,
  onCloseContractDetails,
  isDossierReportLocked = () => false,
  unlockRequests = [],
  fetchUnlockRequests = () => {},
  events = [],
  setEvents = () => {},
  notifications = [],
  setNotifications = () => {},
  dynamicBranchOptions: passedBranchOptions = DEFAULT_BRANCH_OPTIONS,
  onDeleteRecord = () => {},
  searchQueryProp,
  setSearchQueryProp,
  selectedBranchProp,
  setSelectedBranchProp,
  selectedAssigneeProp,
  setSelectedAssigneeProp,
  selectedStatusProp,
  setSelectedStatusProp,
  selectedPriorityProp,
  setSelectedPriorityProp,
  selectedSortByProp,
  setSelectedSortByProp,
  itemsPerPageProp,
  setItemsPerPageProp,
  trashToast,
  setTrashToast,
  renderLoadMoreControls,
  hasNextPageProp,
  caseTypes = [],
}: {
  language: "vi" | "en";
  user?: any;
  records: any[];
  updateRecords: (records: any[], changedRecord?: any, deletedId?: string) => void;
  contractToView?: { record: any; type: "HĐDVPL" | "HĐUQ" } | null;
  setContractToView?: (val: null) => void;
  myPermissions?: any;
  users?: any[];
  unreadInternalChats?: Record<string, number>;
  selectedCategoryProp?: string;
  setSelectedCategoryProp?: (category: string) => void;
  onCloseContractDetails?: () => void;
  isDossierReportLocked?: (record: any) => boolean;
  unlockRequests?: any[];
  fetchUnlockRequests?: () => void;
  events?: any[];
  setEvents?: (events: any[]) => void;
  notifications?: any[];
  setNotifications?: (notifs: any[]) => void;
  dynamicBranchOptions?: string[];
  onDeleteRecord?: (id: string) => void;
  searchQueryProp?: string;
  setSearchQueryProp?: (val: string) => void;
  selectedBranchProp?: string;
  setSelectedBranchProp?: (val: string) => void;
  selectedAssigneeProp?: string;
  setSelectedAssigneeProp?: (val: string) => void;
  selectedStatusProp?: string;
  setSelectedStatusProp?: (val: string) => void;
  selectedPriorityProp?: string;
  setSelectedPriorityProp?: (val: string) => void;
  selectedSortByProp?: string;
  setSelectedSortByProp?: (val: string) => void;
  itemsPerPageProp?: number;
  setItemsPerPageProp?: (val: number) => void;
  trashToast?: any;
  setTrashToast?: (val: any) => void;
  renderLoadMoreControls?: (displayCount?: number) => React.ReactNode;
  hasNextPageProp?: boolean;
  caseTypes?: string[];
}) {
  // Exclude Administrator accounts and filter for Manager vs Staff role categories based on the real-time users prop
  const nonAdmins = React.useMemo(() => {
    return filterNonAdminPersonnel((users || []) as any[]).filter((u: any) => (u.role || "").toLowerCase() !== "client");
  }, [users]);

  const dynamicBranchOptions = React.useMemo(() => {
    if (passedBranchOptions && passedBranchOptions.length > 0) {
      return passedBranchOptions;
    }
    return DEFAULT_BRANCH_OPTIONS;
  }, [passedBranchOptions]);

  const dynamicStaffOptions = React.useMemo(() => {
    return nonAdmins.map((u: any) => u.name || u.username);
  }, [nonAdmins]);

  const dynamicUserAccountOptions = React.useMemo(() => {
    return nonAdmins.map((u: any) => formatPersonnelLabel(u));
  }, [nonAdmins]);

  const dynamicStaffAccountOptions = React.useMemo(() => {
    return nonAdmins.map((u: any) => ({
      label: formatPersonnelLabel(u),
      value: u.name || u.username,
    }));
  }, [nonAdmins]);

  const [formData, setFormData] = useState<any>({
    id: "",
    systemId: "",
    title: "",
    category: "Hình sự",
    partner: "",
    branch: "Chi nhánh Hà Nội",
    mainAssignee: "",
    manager: "",
    status: "Tiếp nhận",
    caseType: "",
    priority: "Bình thường",
    deadline: "",
    role: "",
    clientName: "",
    clientGender: "",
    clientIdCard: "",
    clientIdDate: "",
    clientDob: "",
    clientPhone: "",
    clientAddress: "",
    clientTempAddress: "",
    contractId: "",
    userEA: "",
    authStaff1: "",
    courtRegion: "",
    authStaff2: "",
    workStatus: "",
    authStaff3: "",
    nasLink: "",
    lastWorkDate: "",
    receiveDate: "",
    submitDate: "",
    trackingCode: "",
    generalNote: "",
    feeNoticeDate: "",
    feeSubmitDate: "",
    feeAmount: "",
    baseFeeAmount: "",
    tuapAmount: "",
    feeNote: "",
    evidenceContent: "",
    evidenceRequestDate: "",
    evidenceLastWorkDate: "",
    evidenceNote: "",
    mediate1Date: "",
    mediate1Result: "",
    mediate1Content: "",
    mediate1Note: "",
    mediate2Date: "",
    mediate2Result: "",
    mediate2Content: "",
    mediate2Note: "",
    mediate2ExtraNote: "",
    reportDomain: "",
    reportDocType: "",
    reportNote: "",
    reportFiles: [],
    reportHistory: [],
    paymentInstallment1: "",
    paymentInstallment2: "",
    remainingPayment: "",
    paymentDate: "",
    paymentMethod: "",
    vatIncluded: "",
    vatPercent: "",
    contractDetails: {},
  });

  const dynamicManagerOptions = React.useMemo(() => {
    const branchFiltered = filterPersonnelByBranch(nonAdmins, formData.branch);
    const managers = branchFiltered.filter(isManagerLikePersonnel);
    const finalUsers = managers.length > 0 ? managers : branchFiltered;

    return finalUsers.map((u: any) => ({
      label: formatPersonnelLabel(u),
      value: u.name || u.username,
    }));
  }, [nonAdmins, formData.branch]);

  const dynamicAssigneeOptions = React.useMemo(() => {
    const branchFiltered = filterPersonnelByBranch(nonAdmins, formData.branch);
    const staff = branchFiltered.filter((u: any) => !isManagerLikePersonnel(u) && isStaffLikePersonnel(u));
    const finalUsers = staff.length > 0 ? staff : branchFiltered;

    return finalUsers.map((u: any) => ({
      label: formatPersonnelLabel(u),
      value: u.name || u.username,
    }));
  }, [nonAdmins, formData.branch]);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [showYeastar, setShowYeastar] = useState(false);
  const [activeCallDossierId, setActiveCallDossierId] = useState<string | null>(null);
  const [yeastarPosition, setYeastarPosition] = useState({ x: 900, y: 150 });
  const [isDraggingYeastar, setIsDraggingYeastar] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const [showCccdScanner, setShowCccdScanner] = useState(false);
  const [showContractDetailsModal, setShowContractDetailsModal] =
    useState(false);
  const [selectedContractType, setSelectedContractType] = useState<
    "HĐDVPL" | "HĐUQ" | null
  >(null);
  const handleCloseContractDetails = () => {
    setShowContractDetailsModal(false);
    if (onCloseContractDetails) {
      onCloseContractDetails();
    }
  };
  const [localItemsPerPage, setLocalItemsPerPage] = useState(10);
  const itemsPerPage = itemsPerPageProp !== undefined ? itemsPerPageProp : localItemsPerPage;
  const setItemsPerPage = setItemsPerPageProp !== undefined ? setItemsPerPageProp : setLocalItemsPerPage;
  const hasNextPage = hasNextPageProp !== undefined ? hasNextPageProp : false;
  const [currentPage, setCurrentPage] = useState(1);

  const [viewMode, setViewMode] = useState<
    "grid" | "list" | "kanban" | "admin"
  >("grid");
  const [activeTab, setActiveTab] = useState("all");

  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [qrFileUrl, setQrFileUrl] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) return;
    try {
      navigator.clipboard?.writeText(phone);
      setCopiedPhoneId(id);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    } catch {}
  };

  // Yeastar dragging & call synchronization effects
  const handleMouseDownYeastar = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".drag-handle")) {
      setIsDraggingYeastar(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: yeastarPosition.x,
        posY: yeastarPosition.y,
      };
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingYeastar) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setYeastarPosition({
        x: Math.max(10, Math.min(window.innerWidth - 340, dragRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 560, dragRef.current.posY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDraggingYeastar(false);
    };

    if (isDraggingYeastar) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingYeastar, yeastarPosition]);

  useEffect(() => {
    const handleCallStart = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.dossierId) {
        setActiveCallDossierId(customEvent.detail.dossierId);
      }
      setShowYeastar(true);
    };

    const handleCallEnd = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      
      if (detail && detail.dossierId) {
        setActiveCallDossierId((prev) => prev === detail.dossierId ? null : prev);
        
        // Automated Work Flow: Auto-generate Speech to Text and AI Summary
        const dossierId = detail.dossierId;
        const callLog = detail.log;
        
        if (callLog) {
          let foundRecord = records.find(r => r.id === dossierId);
          if (foundRecord) {
            let clientName = foundRecord.client || callLog.name || "Khách hàng";
            let clientPhone = foundRecord.clientPhone || callLog.phone || "0905123456";
            let complianceStatus = callLog.isViolated ? "Vi phạm" : "Tuân thủ";
            
            let practiceArea = foundRecord.practice_area || "tu_van";
            let category = foundRecord.category || "Tư vấn";
            let priority = foundRecord.priority || "Bình thường";
            let status = foundRecord.status || "Đang tư vấn";
            let contractProbability = "85%";
            let urgency = "★★★★☆ (Cao)";
            let missingDocs = ["Chứng minh nhân dân / CCCD", "Tài liệu chứng cứ liên quan"];
            let suggestedLawyer = foundRecord.mainAssignee || "Luật sư Lê Ánh Dương";
            let resultNotes = "Khách hàng đồng ý chuẩn bị hồ sơ để văn phòng đại diện làm việc.";
            
            // Customize based on simulation transcripts
            if (callLog.transcript.includes("bôi trơn") || callLog.transcript.includes("hối lộ")) {
              status = "Rà soát nội bộ";
              urgency = "★★★★★ (Khẩn cấp)";
              contractProbability = "0% (Hạn chế giao dịch)";
              resultNotes = "AI PHÁT HIỆN VI PHẠM PHÁP LUẬT & ĐẠO ĐỨC NGHỀ NGHIỆP: Nhân viên đề xuất bôi trơn cán bộ. Đã tự động phong tỏa hồ sơ và chuyển ban giám đốc rà soát kỷ luật.";
              priority = "Khẩn cấp";
            } else if (callLog.transcript.includes("trễ hạn") || callLog.transcript.includes("Landmark")) {
              status = "Đang giải quyết (Trễ hạn)";
              urgency = "★★★★★ (Khẩn cấp)";
              contractProbability = "70%";
              resultNotes = "AI phát hiện sai sót trễ hạn nộp hồ sơ Landmark 3 ngày. Khách hàng đang bức xúc. Đề xuất lãnh đạo can thiệp xoa dịu khách hàng gấp.";
              priority = "Khẩn cấp";
              missingDocs = ["Hợp đồng mua bán Landmark", "Hóa đơn đóng tiền đợt 1,2,3", "Thông báo trễ bàn giao từ CĐT"];
            } else if (callLog.transcript.includes("đất") || callLog.transcript.includes("Sổ đỏ") || callLog.transcript.includes("tranh chấp")) {
              status = "Đã tư vấn";
              urgency = "★★★★☆ (Cao)";
              contractProbability = "92%";
              resultNotes = "Tư vấn tranh chấp ranh giới quyền sử dụng đất. Đất có sổ đỏ ranh giới rõ ràng nhưng bị chồng lấn. Đề xuất hòa giải cơ sở trước khi khởi kiện.";
              priority = "Cao";
              missingDocs = ["Sổ đỏ gốc (bản sao)", "CCCD hai bên", "Biên bản hòa giải không thành của UBND xã", "Trích lục bản đồ địa chính"];
            } else {
              status = "Đã tư vấn";
              urgency = "★★★☆☆ (Bình thường)";
              contractProbability = "85%";
              resultNotes = "Tư vấn pháp lý sơ bộ thành công qua điện thoại Yeastar. Khách hàng đã hiểu quyền lợi và nghĩa vụ của mình, hẹn ngày đến văn phòng ký kết HĐDVPL.";
            }

            const timeStr = `${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${new Date().toLocaleDateString("vi-VN")}`;
            
            const aiSummaryMarkdown = `
### 🤖 BIÊN BẢN TƯ VẤN PHÁP LÝ TỰ ĐỘNG (AI SYSTEM)
- **Thời điểm gọi**: ${timeStr}
- **Khách hàng**: ${clientName} (${clientPhone})
- **Chuyên viên tư vấn**: ${callLog.staffName || "Chuyên viên"}
- **Thời lượng cuộc gọi**: ${callLog.duration} giây
- **Kiểm soát chất lượng (Compliance)**: ${callLog.isViolated ? "🔴 VI PHẠM BLACKLIST" : "🟢 HOÀN TOÀN TUÂN THỦ"}

---

#### 1. BẢN GHI LỜI THOẠI (SPEECH TO TEXT):
${callLog.transcript.split("\n").map((line: string) => `> *${line}*`).join("\n")}

---

#### 2. KẾT QUẢ ĐÁNH GIÁ CUỘC GỌI TỪ AI:
- **Lĩnh vực phân loại**: ${category === "Tư vấn" ? "Tư vấn pháp luật dân sự & đất đai" : category}
- **Độ khẩn cấp vụ việc**: ${urgency}
- **Khả năng ký hợp đồng**: **${contractProbability}**
- **Luật sư phụ trách tối ưu**: **${suggestedLawyer}**

---

#### 3. DANH SÁCH TÀI LIỆU CẦN THU THẬP BỔ SUNG:
${missingDocs.map(doc => `- [ ] ${doc}`).join("\n")}

---

#### 4. KẾT LUẬN & ĐỀ XUẤT HÀNH ĐỘNG TIẾP THEO:
- **Nội dung xử lý**: ${resultNotes}
- **Lịch nhắc hẹn tự động**: Đã tạo lịch hẹn tự động cho Chuyên viên gọi lại chăm sóc sau 24 giờ.
`;

            const updatedRecord = {
              ...foundRecord,
              status,
              priority,
              generalNote: (foundRecord.generalNote ? foundRecord.generalNote + "\n\n" : "") + aiSummaryMarkdown,
              aiSummaryText: aiSummaryMarkdown,
              complianceStatus,
              contractProbability,
              urgency,
              missingDocs,
              lastCallTimestamp: timeStr,
              lastCallStatus: "connected",
              lastCallDuration: callLog.duration,
              transcriptText: callLog.transcript,
            };

            // Save & Sync through updateRecords
            const nextRecords = records.map(r => r.id === dossierId ? updatedRecord : r);
            updateRecords(nextRecords, updatedRecord);

            // Update viewing record in real time!
            if (viewingRecord && viewingRecord.id === dossierId) {
              setViewingRecord(updatedRecord);
            }

            // Create Calendar Event for automated callback
            const todayStr = new Date().toISOString().split("T")[0];
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];

            const followUpEvent = {
              id: Date.now() + Math.random(),
              title: `[Tự động] Gọi lại chăm sóc: ${clientName}`,
              date: tomorrowStr,
              startDate: tomorrowStr,
              start: "09:00",
              startTime: "09:00",
              end: "10:00",
              endTime: "10:00",
              type: "Tư vấn",
              location: "Tổng đài Yeastar",
              priority: callLog.isViolated ? "Khẩn cấp" : "Bình thường",
              allDay: false,
              reminder: "15_min",
              notes: `Hệ thống tự động nhắc lịch chăm sóc khách hàng ${clientName} (${clientPhone}) sau cuộc gọi ngày ${timeStr}.\nKhả năng ký HĐ: ${contractProbability}.`,
              color: callLog.isViolated ? "rose" : "amber",
              icon: "PhoneCall"
            };
            if (setEvents) {
              setEvents([...events, followUpEvent]);
            }

            // Create live system notifications
            const systemNotif = {
              id: Date.now() + Math.random(),
              title: callLog.isViolated 
                ? `[CẢNH BÁO AI] Phát hiện vi phạm cuộc gọi ${dossierId}`
                : `[AI HOÀN THÀNH BIÊN BẢN] Tự động cập nhật hồ sơ ${dossierId}`,
              content: callLog.isViolated
                ? `AI phát hiện từ khóa cấm trong đàm thoại của nhân viên ${callLog.staffName}. Trạng thái hồ sơ chuyển sang Rà soát.`
                : `Hệ thống đã tự động lập biên bản tư vấn, cập nhật tài liệu cần thu thập và tạo lịch hẹn gọi lại chăm sóc khách hàng ${clientName}.`,
              time: timeStr,
              read: false,
              importance: callLog.isViolated ? "high" : "normal",
              sendTo: "all",
              selectedUsers: [],
              selectedCases: [dossierId],
              sender: "AI Telephony Assistant",
              displaySendTo: "Tất cả",
            };
            if (setNotifications) {
              setNotifications([systemNotif, ...(notifications || [])]);
            }
          }
        }
      } else {
        setActiveCallDossierId(null);
      }
    };

    window.addEventListener("yeastar-call", handleCallStart);
    window.addEventListener("yeastar-call-ended", handleCallEnd);

    return () => {
      window.removeEventListener("yeastar-call", handleCallStart);
      window.removeEventListener("yeastar-call-ended", handleCallEnd);
    };
  }, [records, updateRecords, viewingRecord, setViewingRecord, language, setEvents, events, setNotifications, notifications]);

  const handleFileUploadWithQR = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingQR(true);
    setQrFileUrl(null);
    try {
      const record =
        formData && formData.title ? formData : viewingRecord || {};
      const contractId =
        selectedContractType === "HĐDVPL"
          ? record.contractId || record.id
          : record.authContractId || record.id;

      const requesterName =
        record.contractDetails?.requesterName ||
        record.clientName ||
        record.client ||
        "";
      const title = record.title || "Không xác định";
      const category = record.category || "Không xác định";
      const status = record.status || "Chưa rõ";
      const workStatus = record.workStatus || "Chưa cập nhật";
      const assignee = record.mainAssignee || "Chưa phân công";

      const lookupId = record.systemId || record.id || contractId || "UNKNOWN";
      const court = record.courtRegion || record.court || "Chưa cập nhật";

      const qrData = `${window.location.origin}/qr/${encodeURIComponent(lookupId)}`;

      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const qrImage = await pdfDoc.embedPng(qrDataUrl);
      const qrDims = qrImage.scale(1);

      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      lastPage.drawImage(qrImage, {
        x: 40,
        y: 40,
        width: qrDims.width,
        height: qrDims.height,
      });

      const normalizeForPdf = (str: string) => {
        return str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D");
      };

      pages.forEach((page) => {
        page.drawText(normalizeForPdf(lookupId), {
          x: 40,
          y: 20,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setQrFileUrl(url);
    } catch (error) {
      console.error("Error adding QR to file:", error);
      alert(
        "Có lỗi xảy ra khi gắn QR vào file. Vui lòng đảm bảo bạn chọn đúng định dạng PDF.",
      );
    } finally {
      setIsProcessingQR(false);
      if (e.target) {
        e.target.value = ""; // Reset input
      }
    }
  };

  useEffect(() => {
    const handleSetTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("set-record-tab", handleSetTab);
    return () => window.removeEventListener("set-record-tab", handleSetTab);
  }, []);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showInternalChatModal, setShowInternalChatModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kanbanGroupBy, setKanbanGroupBy] = useState<
    "status" | "assignee" | "category"
  >("status");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [attachmentUploadFiles, setAttachmentUploadFiles] = useState<File[]>([]);

  useEffect(() => {
    if (viewingRecord && viewingRecord.id && viewingRecord.viewed === false) {
      const updated = { ...viewingRecord, viewed: true };
      setViewingRecord(updated);
      updateRecords(
        records.map((r) => (r.id === viewingRecord.id ? updated : r)),
        updated
      );
    }
  }, [viewingRecord, records, updateRecords]);

  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewerName, setReviewerName] = useState<string>("");
  const [isCopiedReview, setIsCopiedReview] = useState<boolean>(false);

  useEffect(() => {
    if (viewingRecord) {
      const rev = viewingRecord.clientReview || {};
      setReviewRating(rev.rating || 5);
      setReviewComment(rev.comment || "Luật sư tư vấn rất tận tâm, chuyên nghiệp, hỗ trợ kịp thời và xử lý hồ sơ nhanh gọn hơn cam kết. Rất hài lòng!");
      setReviewerName(rev.reviewerName || viewingRecord.client || "Khách hàng ẩn danh");
    }
  }, [viewingRecord?.id]);

  const [attachmentAbbrs, setAttachmentAbbrs] = useState<Record<number, string>>({});
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [globalRecordTypes, setGlobalRecordTypes] = useState<any[]>([]);

  useEffect(() => {
    if (showAIModal && (selectedRecord || viewingRecord)) {
      const record = selectedRecord || viewingRecord;
      const errorInfo = language === "vi" ? "Lỗi phân tích: " : "Analysis Error: ";
      const prompt = buildLegalCaseAnalysisPrompt(record, language);

      setAiAnalysisResult(null);
      setIsAnalyzing(true);
      import("../services/ai.service").then(({ askAI }) => {
        askAI(prompt, []).then((res) => {
          setAiAnalysisResult(res);
        }).catch((err) => {
          setAiAnalysisResult(errorInfo + err.message);
        }).finally(() => {
          setIsAnalyzing(false);
        });
      });
    }
  }, [showAIModal, selectedRecord, viewingRecord, language]);

  useEffect(() => {
    const fetchRecordTypes = async () => {
      try {
        const data = await api.req("/api/record-types");
        setGlobalRecordTypes(data);
      } catch (e) {
        console.error("Error fetching record types:", e);
      }
    };
    fetchRecordTypes();
  }, []);

  // Moved formData useState up to enable dependency tracking in dynamic option memos

  useEffect(() => {
    const remaining = getRemainingPaymentValue(
      formData.feeAmount,
      formData.paymentInstallment1,
      formData.paymentInstallment2,
    );
    const formattedRemaining = formatMoneyNumber(remaining);

    if (formData.remainingPayment !== formattedRemaining) {
      setFormData((prev: any) => ({
        ...prev,
        remainingPayment: formattedRemaining,
      }));
    }
  }, [formData.feeAmount, formData.paymentInstallment1, formData.paymentInstallment2, formData.remainingPayment]);

  useEffect(() => {
    const nextFormData = syncContractDetailsFromClientData(formData);
    if (nextFormData !== formData) {
      setFormData(nextFormData);
    }
  }, [
    formData.clientName,
    formData.clientDob,
    formData.clientIdCard,
    formData.clientPhone,
    formData.clientAddress,
    formData.caseDescription,
    formData.courtRegion,
    formData.contractDetails,
  ]);

  const [chatMessages, setChatMessages] = useState<
    {
      sender: string;
      text: string;
      time: string;
      type?: "text" | "image" | "video" | "file";
      fileUrl?: string;
      fileName?: string;
    }[]
  >([
    {
      sender: "user",
      text: "Xin chào, tôi muốn hỏi về tiến độ hồ sơ.",
      time: "10:00 AM",
    },
    {
      sender: "editor",
      text: "Chào bạn, hồ sơ của bạn đang được xử lý ở bước thẩm định.",
      time: "10:05 AM",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video" | "file",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setChatMessages([
        ...chatMessages,
        {
          sender: "user",
          text: `Đã gửi ${type === "image" ? "hình ảnh" : type === "video" ? "video" : "tệp tin"}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          type,
          fileUrl,
          fileName: file.name,
        },
      ]);
    }
  };

  useEffect(() => {
    if (contractToView && contractToView.record) {
      setViewingRecord(contractToView.record);
      setFormData({
        ...formData,
        ...contractToView.record,
        contractDetails: contractToView.record.contractDetails || {},
      });
      setSelectedContractType(contractToView.type);
      setShowContractDetailsModal(true);
      if (setContractToView) {
        setContractToView(null);
      }
    }
  }, [contractToView]);

  const t = {
    vi: {
      addRecord: "Thêm mới",
      importExcel: "Nhập Excel",
      exportExcel: "Xuất Excel",
      addRecordTitle: "Thêm hồ sơ mới",
      recordId: "Mã hồ sơ",
      recordIdPlaceholder: "Nhập mã hồ sơ",
      caseName: "Tên vụ việc",
      caseNamePlaceholder: "Nhập tên vụ việc",
      client: "Khách hàng",
      clientPlaceholder: "Nhập tên khách hàng",
      lawyer: "Luật sư phụ trách",
      selectLawyer: "Chọn luật sư",
      specialist: "Chuyên viên phụ trách",
      selectSpecialist: "Chọn chuyên viên",
      court: "Tòa án",
      courtPlaceholder: "Nhập tên tòa án",
      status: "Trạng thái",
      notes: "Ghi chú thêm",
      notesPlaceholder: "Nhập ghi chú (nếu có)",
      cancel: "Hủy",
      save: "Lưu hồ sơ",
      view: "Xem",
      items: "mục",
      statusNew: "Tiếp nhận",
      statusProcessing: "Đang xử lý",
      statusCompleted: "Hoàn thành",
      statusPending: "Chờ xử lý",
      showing: "Đang xem",
      to: "đến",
      inTotal: "trong tổng số",
      records: "hồ sơ",
      prev: "Trước",
      next: "Tiếp",
      importAlert: "Tính năng nhập Excel đang được phát triển.",
      exportAlert: "Tính năng xuất Excel đang được phát triển.",
      all: "Tất cả",
      total: "Tổng số",
      aiAnalysis: "Phân tích & Đề xuất AI",
      chat: "Trao đổi",
      sendMessage: "Gửi tin nhắn",
      typeMessage: "Nhập tin nhắn...",
      selectBranch: "Chọn chi nhánh",
      selectCategory: "Chọn loại hồ sơ",
      allStatuses: "Tất cả trạng thái",
      search: "Tìm kiếm...",
      deadline: "Deadline",
      actions: "Hành động",
      viewDetails: "Xem chi tiết",
    },
    en: {
      addRecord: "Add new",
      importExcel: "Import Excel",
      exportExcel: "Export Excel",
      addRecordTitle: "Add new record",
      recordId: "Record ID",
      recordIdPlaceholder: "Enter record ID",
      caseName: "Case name",
      caseNamePlaceholder: "Enter case name",
      client: "Client",
      clientPlaceholder: "Enter client name",
      lawyer: "Lawyer in charge",
      selectLawyer: "Select lawyer",
      specialist: "Specialist in charge",
      selectSpecialist: "Select specialist",
      court: "Court",
      courtPlaceholder: "Enter court name",
      status: "Status",
      notes: "Additional notes",
      notesPlaceholder: "Enter notes (if any)",
      cancel: "Cancel",
      save: "Save record",
      view: "Show",
      items: "entries",
      statusNew: "Received",
      statusProcessing: "Processing",
      statusCompleted: "Completed",
      statusPending: "Pending",
      showing: "Showing",
      to: "to",
      inTotal: "of",
      records: "entries",
      prev: "Previous",
      next: "Next",
      importAlert: "Import Excel feature is under development.",
      exportAlert: "Export Excel feature is under development.",
      all: "All",
      total: "Total",
      aiAnalysis: "AI Analysis & Recommendation",
      chat: "Chat",
      sendMessage: "Send",
      typeMessage: "Type a message...",
      selectBranch: "Select branch",
      selectCategory: "Select category",
      allStatuses: "All statuses",
      search: "Search...",
      deadline: "Deadline",
      actions: "Actions",
      viewDetails: "View details",
    },
  }[language];

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery = searchQueryProp !== undefined ? searchQueryProp : localSearchQuery;
  const setSearchQuery = setSearchQueryProp !== undefined ? setSearchQueryProp : setLocalSearchQuery;

  const [localSelectedCategory, setLocalSelectedCategory] = useState("");
  const selectedCategory = selectedCategoryProp !== undefined ? selectedCategoryProp : localSelectedCategory;
  const setSelectedCategory = setSelectedCategoryProp !== undefined ? setSelectedCategoryProp : setLocalSelectedCategory;

  const [localSelectedBranch, setLocalSelectedBranch] = useState("");
  const selectedBranch = selectedBranchProp !== undefined ? selectedBranchProp : localSelectedBranch;
  const setSelectedBranch = setSelectedBranchProp !== undefined ? setSelectedBranchProp : setLocalSelectedBranch;

  const [localSelectedAssignee, setLocalSelectedAssignee] = useState("");
  const selectedAssignee = selectedAssigneeProp !== undefined ? selectedAssigneeProp : localSelectedAssignee;
  const setSelectedAssignee = setSelectedAssigneeProp !== undefined ? setSelectedAssigneeProp : setLocalSelectedAssignee;

  const [localSelectedStatus, setLocalSelectedStatus] = useState("");
  const selectedStatus = selectedStatusProp !== undefined ? selectedStatusProp : localSelectedStatus;
  const setSelectedStatus = setSelectedStatusProp !== undefined ? setSelectedStatusProp : setLocalSelectedStatus;

  const [localSelectedPriority, setLocalSelectedPriority] = useState("");
  const selectedPriority = selectedPriorityProp !== undefined ? selectedPriorityProp : localSelectedPriority;
  const setSelectedPriority = setSelectedPriorityProp !== undefined ? setSelectedPriorityProp : setLocalSelectedPriority;

  const [localSelectedSortBy, setLocalSelectedSortBy] = useState("newest");
  const selectedSortBy = selectedSortByProp !== undefined ? selectedSortByProp : localSelectedSortBy;
  const setSelectedSortBy = setSelectedSortByProp !== undefined ? setSelectedSortByProp : setLocalSelectedSortBy;
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );

  const canViewAll = myPermissions
    ? myPermissions.viewAllRecords
    : [
        "admin",
        "manager",
        "head_of_department",
        "director",
        "deputyDirector",
        "deputy_director",
        "manage",
      ].includes(user?.role || "");

  const hasPersonalAccess = (record: any) => isPersonalAccessAllowed(record, user);

  const isOverdue = (deadlineStr: string, status: string) => isRecordOverdue(deadlineStr, status);

  const filteredRecords = dedupeRecordsById(records);
  const sortedRecords = filteredRecords;
  const paginatedRecords = filteredRecords;
  const totalPages = hasNextPage ? 2 : 1;

  const uniqueAssignees = useMemo(() => {
    const list = filteredRecords.map((r) => r.mainAssignee).filter(Boolean);
    return Array.from(new Set(list));
  }, [filteredRecords]);

  const canEditRecord = (record: any) => canUserEditRecord(record, myPermissions, user);

  const canDeleteRecord = (record: any) => canUserDeleteRecord(record, myPermissions, user);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleContractDetailsChange = (field: string, value: any) => {
    let newDetails: any = {
      ...formData.contractDetails,
      [field]: value,
    };

    if (field === "sameAsRequester" && value === true) {
      newDetails = {
        ...newDetails,
        beneficiaryName: newDetails.requesterName || "",
        beneficiaryDob: newDetails.requesterDob || "",
        beneficiaryIdCard: newDetails.requesterIdCard || "",
        beneficiaryPhone: newDetails.requesterPhone || "",
        beneficiaryEmail: newDetails.requesterEmail || "",
        beneficiaryAddress: newDetails.requesterAddress || "",
      };
    }

    if (field === "sameAsRequester2" && value === true) {
      newDetails = {
        ...newDetails,
        obligorName: newDetails.requesterName || "",
        obligorBusinessId: newDetails.requesterIdCard || "",
        obligorPhone: newDetails.requesterPhone || "",
        obligorEmail: newDetails.requesterEmail || "",
        obligorAddress: newDetails.requesterAddress || "",
      };
    }

    if (newDetails.sameAsRequester) {
      if (field === "requesterName") newDetails.beneficiaryName = value;
      if (field === "requesterDob") newDetails.beneficiaryDob = value;
      if (field === "requesterIdCard") newDetails.beneficiaryIdCard = value;
      if (field === "requesterPhone") newDetails.beneficiaryPhone = value;
      if (field === "requesterEmail") newDetails.beneficiaryEmail = value;
      if (field === "requesterAddress") newDetails.beneficiaryAddress = value;
    }

    if (newDetails.sameAsRequester2) {
      if (field === "requesterName") newDetails.obligorName = value;
      if (field === "requesterIdCard") newDetails.obligorBusinessId = value;
      if (field === "requesterPhone") newDetails.obligorPhone = value;
      if (field === "requesterEmail") newDetails.obligorEmail = value;
      if (field === "requesterAddress") newDetails.obligorAddress = value;
    }

    let updatedFormData = {
      ...formData,
      contractDetails: newDetails,
    };

    if (field === "beneficiaryName") updatedFormData.clientName = value;
    if (field === "beneficiaryDob") updatedFormData.clientDob = value;
    if (field === "beneficiaryIdCard") updatedFormData.clientIdCard = value;
    if (field === "beneficiaryPhone") updatedFormData.clientPhone = value;
    if (field === "beneficiaryAddress") updatedFormData.clientAddress = value;
    if (field === "requestContent") updatedFormData.caseDescription = value;
    if (field === "courtName") updatedFormData.courtRegion = value;

    if (newDetails.sameAsRequester && field.startsWith("requester")) {
      if (field === "requesterName") updatedFormData.clientName = value;
      if (field === "requesterDob") updatedFormData.clientDob = value;
      if (field === "requesterIdCard") updatedFormData.clientIdCard = value;
      if (field === "requesterPhone") updatedFormData.clientPhone = value;
      if (field === "requesterAddress") updatedFormData.clientAddress = value;
    }

    setFormData(updatedFormData);
  };

  const handleSaveRecord = async () => {
    if (isSubmittingRecord) return;
    setIsSubmittingRecord(true);
    const timestamp = new Date().toISOString();
    const actionLog = {
      timestamp,
      user: user?.name,
      action: editingRecord ? "Chỉnh sửa" : "Tạo mới",
    };

    let finalFormData = { ...formData };
    if (
      formData.reportDomain ||
      formData.reportDocType ||
      formData.reportNote ||
      (formData.reportFiles && formData.reportFiles.length > 0)
    ) {
      const now = new Date();
      let hours = now.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const hoursStr = hours.toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const year = now.getFullYear();

      const timestampForReport = `${hoursStr}:${minutes}:${seconds} ${ampm} ${day}/${month}/${year}`;

      const newReport = {
        id: Date.now().toString(),
        timestamp: timestampForReport,
        domain: formData.reportDomain,
        docType: formData.reportDocType,
        note: formData.reportNote,
        files: formData.reportFiles || [],
      };

      let updatedAttachments = formData.attachments || [];
      if (formData.reportFiles && formData.reportFiles.length > 0) {
        const getAbbreviation = (text: string) => {
          if (!text) return 'DOC';
          return text.split(/[ -]/).filter((word: string) => word.length > 0).map((word: string) => {
            const char = word.charAt(0);
            return char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase();
          }).join('');
        };
        const abbr = getAbbreviation(formData.reportDocType);
        
        formData.reportFiles.forEach((f: any, i: number) => {
          const extMatch = f.name.match(/\.[^.]+$/);
          const ext = extMatch ? extMatch[0] : "";
          const newAttachment = {
            name: `${formData.id || editingRecord?.id || 'NEW'}_${abbr}_${i + 1}${ext}`,
            originalName: f.name,
            url: f.url || ''
          };
          updatedAttachments.push(newAttachment);
        });
      }
      finalFormData = {
        ...formData,
        reportHistory: [newReport, ...(formData.reportHistory || [])],
        ...((formData.reportFiles && formData.reportFiles.length > 0) ? { attachments: updatedAttachments } : {}),
        reportDomain: "",
        reportDocType: "",
        reportNote: "",
        reportFiles: [],
      };
    }

    // Auto-update calendar with "next working time"
    if (finalFormData.nextWorkingDate) {
      const eventDate = finalFormData.nextWorkingDate;
      const eventTime = finalFormData.nextWorkingTime || "08:00";
      const clientName = finalFormData.clientName || finalFormData.client || "Khách hàng";
      const statusValue = finalFormData.status || "vụ án";
      const eventTitle = `Hòa giải (giai đoạn ${statusValue}) vụ việc ${clientName}`;
      
      const alreadyExists = events.some(e => e.date === eventDate && e.title === eventTitle);
      if (!alreadyExists) {
        const newEvent = {
          id: Date.now() + Math.random(),
          title: eventTitle,
          date: eventDate,
          time: eventTime,
          description: `Lịch làm việc tiếp theo cho hồ sơ ${finalFormData.id || finalFormData.systemId || ''}.`,
          category: "Lịch hòa giải",
          created_by: user?.name || "Hệ thống"
        };
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        localStorage.setItem("erp_events_v3", JSON.stringify(updatedEvents));
      }
      
      finalFormData.lastWorkDate = eventDate;
      finalFormData.lastWorkTime = eventTime;
    }

    try {
      if (editingRecord) {
        const updatedRecord = {
          ...editingRecord,
          ...finalFormData,
          client: finalFormData.clientName || finalFormData.client || editingRecord.client,
          subAssignee:
            finalFormData.authStaff1 ||
            finalFormData.subAssignee ||
            editingRecord.subAssignee,
          court: finalFormData.courtRegion || finalFormData.court || editingRecord.court,
          auditLogs: [...(editingRecord.auditLogs || []), actionLog],
          practice_area: editingRecord.practice_area || finalFormData.practice_area || "tranh_tung",
        };
        await api.req("/api/erp-records", "POST", { id: editingRecord.id, data: updatedRecord });
        updateRecords(
          records.map((r) => (r.id === editingRecord.id ? updatedRecord : r)),
          updatedRecord
        );
        syncToFirebase(updatedRecord);
        if (viewingRecord?.id === editingRecord.id) {
          setViewingRecord(updatedRecord);
        }
      } else {
        const generatedId = (finalFormData.id && finalFormData.id.trim()) || `HS-${Date.now().toString().slice(-6)}`;
        const newRecord = {
          ...finalFormData,
          id: generatedId,
          systemId: finalFormData.systemId || generatedId,
          date: finalFormData.date || new Date().toLocaleDateString("vi-VN"),
          client: finalFormData.clientName || finalFormData.client || "Khách hàng",
          role: finalFormData.role || "Khách hàng",
          mainAssignee: finalFormData.mainAssignee || user?.name || "Hệ thống",
          branch: finalFormData.branch || user?.branch || user?.office || "Hà Nội",
          userEA: user?.username || "",
          subAssignee: finalFormData.authStaff1 || finalFormData.subAssignee,
          court: finalFormData.courtRegion || finalFormData.court,
          auditLogs: [actionLog],
          viewed: false,
          practice_area: finalFormData.practice_area || "tranh_tung",
        };
        await api.req("/api/erp-records", "POST", { id: generatedId, data: newRecord, createOnly: true });
        updateRecords([newRecord, ...records], newRecord);
        syncToFirebase(newRecord);
      }
    } catch (saveError) {
      console.error("Failed to save record to server:", saveError);
      alert(language === "vi" ? "Lỗi khi lưu hồ sơ lên hệ thống máy chủ!" : "Error saving record to server!");
      setIsSubmittingRecord(false);
      return;
    }
    setShowAddRecord(false);
    setEditingRecord(null);
    setFormData({
      id: "",
      systemId: "",
      title: "",
      category: "Hình sự",
      partner: "",
      branch: "Chi nhánh Hà Nội",
      mainAssignee: "",
      manager: "",
      status: "Tiếp nhận",
      caseType: "",
      priority: "Bình thường",
      deadline: "",
      role: "",
      clientName: "",
      clientGender: "",
      clientIdCard: "",
      clientIdDate: "",
      clientDob: "",
      clientPhone: "",
      clientAddress: "",
      clientTempAddress: "",
      contractId: "",
      userEA: "",
      authStaff1: "",
      courtRegion: "",
      authStaff2: "",
      workStatus: "",
      authStaff3: "",
      nasLink: "",
      lastWorkDate: "",
      receiveDate: "",
      submitDate: "",
      trackingCode: "",
      generalNote: "",
      feeNoticeDate: "",
      feeSubmitDate: "",
      feeAmount: "",
      baseFeeAmount: "",
      tuapAmount: "",
      feeNote: "",
      evidenceContent: "",
      evidenceRequestDate: "",
      evidenceLastWorkDate: "",
      evidenceNote: "",
      mediate1Date: "",
      mediate1Result: "",
      mediate1Content: "",
      mediate1Note: "",
      mediate2Date: "",
      mediate2Result: "",
      mediate2Content: "",
      mediate2Note: "",
      mediate2ExtraNote: "",
      reportDomain: "",
      reportDocType: "",
      reportNote: "",
      reportFiles: [],
      reportHistory: [],
      contractDetails: {},
    });
    setTimeout(() => {
      setIsSubmittingRecord(false);
    }, 1000);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    const legacyAttachments = record.file && (!record.attachments || record.attachments.length === 0) ? [{ name: record.file, url: '' }] : [];
    setFormData({
      id: record.id || "",
      systemId: record.systemId || "",
      title: record.title || "",
      category: record.category || "Hình sự",
      partner: record.partner || "",
      branch: normalizeBranchName(record.branch || "Chi nhánh Hà Nội"),
      mainAssignee: record.mainAssignee || "",
      manager: record.manager || "",
      status: record.status || "Tiếp nhận",
      caseType: record.caseType || "",
      priority: record.priority || "Bình thường",
      deadline: record.deadline || "",
      role: record.role || "",
      clientName: record.client || "",
      clientGender: record.clientGender || "",
      clientIdCard: record.clientIdCard || "",
      clientIdDate: record.clientIdDate || "",
      clientDob: record.clientDob || "",
      clientPhone: record.clientPhone || "",
      clientAddress: record.clientAddress || "",
      clientTempAddress: record.clientTempAddress || "",
      contractId: record.contractId || "",
      authContractId: record.authContractId || "",
      userEA: record.userEA || "",
      authStaff1: record.authStaff1 || "",
      courtRegion: record.courtRegion || "",
      authStaff2: record.authStaff2 || "",
      workStatus: record.workStatus || "",
      authStaff3: record.authStaff3 || "",
      nasLink: record.nasLink || "",
      lastWorkDate: record.lastWorkDate || "",
      receiveDate: record.receiveDate || "",
      submitDate: record.submitDate || "",
      trackingCode: record.trackingCode || "",
      generalNote: record.generalNote || "",
      feeNoticeDate: record.feeNoticeDate || "",
      feeSubmitDate: record.feeSubmitDate || "",
      feeAmount: record.feeAmount || "",
      tuapAmount: record.tuapAmount || "",
      feeNote: record.feeNote || "",
      evidenceContent: record.evidenceContent || "",
      evidenceRequestDate: record.evidenceRequestDate || "",
      evidenceLastWorkDate: record.evidenceLastWorkDate || "",
      evidenceNote: record.evidenceNote || "",
      mediate1Date: record.mediate1Date || "",
      mediate1Result: record.mediate1Result || "",
      mediate1Content: record.mediate1Content || "",
      mediate1Note: record.mediate1Note || "",
      mediate2Date: record.mediate2Date || "",
      mediate2Result: record.mediate2Result || "",
      mediate2Content: record.mediate2Content || "",
      mediate2Note: record.mediate2Note || "",
      mediate2ExtraNote: record.mediate2ExtraNote || "",
      reportDomain: record.reportDomain || "",
      reportDocType: record.reportDocType || "",
      reportNote: record.reportNote || "",
      reportFiles: record.reportFiles || [],
      reportHistory: record.reportHistory || [],
      attachments: [...(record.attachments || []), ...legacyAttachments],
      contractDetails: record.contractDetails || {},
    });
    setShowAddRecord(true);
  };

  const handleUpdateReport = () => {
    if (isDossierReportLocked(viewingRecord)) {
      alert("Báo cáo của hồ sơ này đã bị khóa. Vui lòng gửi yêu cầu giải trình tới Kiểm soát chất lượng để mở khóa!");
      return;
    }

    const hasReportData = formData.reportDomain || formData.reportDocType || formData.reportNote || (formData.reportFiles && formData.reportFiles.length > 0);
    const hasNextWorkData = formData.nextWorkingDate;

    if (!hasReportData && !hasNextWorkData) {
      alert("Vui lòng điền thông tin báo cáo hoặc chọn thời gian làm việc tiếp theo!");
      return;
    }

    let updatedHistory = [...(formData.reportHistory || [])];
    let updatedAttachments = [...(formData.attachments || [])];

    if (hasReportData) {
      const now = new Date();
      let hours = now.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = hours.toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const year = now.getFullYear();

      const timestamp = `${hoursStr}:${minutes}:${seconds} ${ampm} ${day}/${month}/${year}`;

      const newReport = {
        id: Date.now().toString(),
        timestamp,
        domain: formData.reportDomain,
        docType: formData.reportDocType,
        note: formData.reportNote,
        files: formData.reportFiles || [],
      };

      updatedHistory = [newReport, ...updatedHistory];

      if (formData.reportFiles && formData.reportFiles.length > 0) {
        const getAbbreviation = (text: string) => {
          if (!text) return 'DOC';
          return text.split(/[ -]/).filter((word: string) => word.length > 0).map((word: string) => {
            const char = word.charAt(0);
            return char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase();
          }).join('');
        };
        const abbr = getAbbreviation(formData.reportDocType);
        
        formData.reportFiles.forEach((f: any) => {
          const extMatch = f.name.match(/\.[^.]+$/);
          const ext = extMatch ? extMatch[0] : "";
          const uniqueId = Date.now().toString().slice(-4) + Math.random().toString(36).substring(2, 5);
          const newAttachment = {
            name: `${formData.id || viewingRecord?.id || 'NEW'}_${abbr}_${uniqueId}${ext}`,
            originalName: f.name,
            url: f.url || ''
          };
          updatedAttachments.push(newAttachment);
        });
      }
    }

    if (formData.nextWorkingDate) {
      const eventDate = formData.nextWorkingDate;
      const eventTime = formData.nextWorkingTime || "08:00";
      const clientName = formData.clientName || formData.client || viewingRecord?.client || "Khách hàng";
      const statusValue = formData.status || viewingRecord?.status || "vụ án";
      const eventTitle = `hòa giải (giai đoạn ${statusValue}) vụ việc ${clientName}`;

      const alreadyExists = events.some(e => e.date === eventDate && e.title === eventTitle);
      if (!alreadyExists) {
        const newEvent = {
          id: Date.now() + Math.random(),
          title: eventTitle,
          date: eventDate,
          time: eventTime,
          description: `Lịch làm việc tiếp theo cho hồ sơ ${formData.id || formData.systemId || viewingRecord?.id || ''}.`,
          category: "Lịch hòa giải",
          created_by: user?.name || "Hệ thống"
        };
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        localStorage.setItem("erp_events_v3", JSON.stringify(updatedEvents));
      }
    }

    const updatedRecord = {
      ...viewingRecord,
      ...formData,
      reportHistory: updatedHistory,
      attachments: updatedAttachments,
      reportDomain: "",
      reportDocType: "",
      reportNote: "",
      reportFiles: [],
      ...(formData.nextWorkingDate ? {
        lastWorkDate: formData.nextWorkingDate,
        lastWorkTime: formData.nextWorkingTime || "08:00",
        nextWorkingDate: formData.nextWorkingDate,
        nextWorkingTime: formData.nextWorkingTime || "08:00"
      } : {})
    };

    updateRecords(
      records.map((r) => (r.id === viewingRecord.id ? updatedRecord : r)),
      updatedRecord
    );
    syncToFirebase(updatedRecord);
    setViewingRecord(updatedRecord);

    setFormData({
      ...formData,
      reportHistory: updatedHistory,
      attachments: updatedAttachments,
      reportDomain: "",
      reportDocType: "",
      reportNote: "",
      reportFiles: [],
    });

    alert("Cập nhật báo cáo và lịch làm việc tiếp theo thành công!");
  };

  const handleDelete = (id: string) => {
    onDeleteRecord(id);
    const targetRec = records.find(
      (r) => String(r.id) === String(id) || String(r.contractId) === String(id) || String(r.systemId) === String(id)
    );
    const remaining = records.filter(
      (r) => String(r.id) !== String(id) && String(r.contractId) !== String(id) && String(r.systemId) !== String(id)
    );
    updateRecords(remaining, targetRec, id);
    setShowDeleteConfirm(null);
    if (viewingRecord?.id === id || (viewingRecord as any)?.contractId === id) {
      setViewingRecord(null);
    }

    setTrashToast?.({
      message: language === "vi" ? `Hồ sơ ${id} đã được di chuyển vào Thùng rác.` : `Record ${id} moved to Trash.`,
      recordId: id,
      recordData: targetRec,
      type: 'delete'
    });
  };

  const handleComplete = () => {
    if (viewingRecord) {
      const timestamp = new Date().toISOString();
      const actionLog = {
        timestamp,
        user: user?.name,
        action: "Đánh dấu hoàn thành",
      };
      const updatedRecord = {
        ...viewingRecord,
        status: "Hoàn thành / Đóng hồ sơ",
        auditLogs: [...(viewingRecord.auditLogs || []), actionLog],
      };
      updateRecords(
        records.map((r) => (r.id === viewingRecord.id ? updatedRecord : r)),
        updatedRecord
      );
      syncToFirebase(updatedRecord);
      setViewingRecord(updatedRecord);
    }
  };

  const handleUpdateRecordField = (
    field: string,
    value: string,
    fieldLabel: string,
  ) => {
    if (viewingRecord) {
      const timestamp = new Date().toISOString();
      const actionLog = {
        timestamp,
        user: user?.name,
        action: `Cập nhật ${fieldLabel} thành "${value}"`,
      };
      const updatedRecord = {
        ...viewingRecord,
        [field]: value,
        auditLogs: [...(viewingRecord.auditLogs || []), actionLog],
      };
      updateRecords(
        records.map((r) => (r.id === viewingRecord.id ? updatedRecord : r)),
        updatedRecord
      );
      syncToFirebase(updatedRecord);
      setViewingRecord(updatedRecord);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status)
      return "bg-slate-50 text-slate-600 border border-slate-200 shadow-sm";
    if (status.includes("Hoàn thành") || status.includes("Lưu trữ"))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm";
    if (status.includes("Tiếp nhận"))
      return "bg-purple-50 text-purple-700 border border-purple-200 shadow-sm";
    if (status.includes("Đang xử lý") || status.includes("Đã phân công"))
      return "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm";
    if (status.includes("Chờ") || status.includes("Tạm dừng"))
      return "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm";
    if (status.includes("Đang làm việc") || status.includes("Đang xét xử"))
      return "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm";
    return "bg-slate-50 text-slate-600 border border-slate-200 shadow-sm";
  };

  const getStatusLineColor = (status: string) => {
    if (!status) return "bg-slate-400";
    if (status.includes("Hoàn thành") || status.includes("Lưu trữ"))
      return "bg-emerald-500";
    if (status.includes("Tiếp nhận")) return "bg-purple-500";
    if (status.includes("Đang xử lý") || status.includes("Đã phân công"))
      return "bg-blue-500";
    if (status.includes("Chờ") || status.includes("Tạm dừng"))
      return "bg-amber-500";
    if (status.includes("Đang làm việc") || status.includes("Đang xét xử"))
      return "bg-indigo-500";
    return "bg-slate-400";
  };

  const getStatusBadge = (status: string) => {
    return (
      <span
        className={cn(
          "px-3 py-1 rounded-lg text-sm font-medium",
          getStatusColor(status),
        )}
      >
        {status}
      </span>
    );
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws);
          
          if (data && data.length > 0) {
            const newRecords = [...records];
            data.forEach((row: any) => {
              const newId = Date.now().toString() + Math.floor(Math.random() * 1000);
              const rec = {
                id: newId,
                title: row["Tên vụ việc"] || row["Case Name"] || row["Tiêu đề"] || "Vụ việc chưa đặt tên",
                client: row["Khách hàng"] || row["Client"] || "Khách hàng mới",
                mainAssignee: row["Luật sư"] || row["Lawyer"] || row["Người phụ trách"] || user?.name || "",
                subAssignee: row["Chuyên viên"] || row["Specialist"] || "",
                court: row["Tòa án giải quyết"] || row["Court"] || "",
                status: row["Trạng thái"] || row["Status"] || "Mới tiếp nhận",
                category: row["Lĩnh vực"] || row["Category"] || "Hình sự",
                description: row["Mô tả"] || row["Description"] || "",
                date: new Date().toLocaleDateString("vi-VN"),
                practice_area: "tranh_tung"
              };
              newRecords.unshift(rec);
            });
            updateRecords(newRecords);
            alert(
              language === "vi"
                ? `Nhập thành công ${data.length} hồ sơ tranh tụng từ file Excel!`
                : `Successfully imported ${data.length} litigation records from Excel file!`
            );
          } else {
            alert(language === "vi" ? "File Excel không có dữ liệu!" : "Excel file contains no data!");
          }
        } catch (err: any) {
          console.error("Import error:", err);
          alert(language === "vi" ? "Đã có lỗi xảy ra khi đọc file Excel!" : "An error occurred while reading the Excel file!");
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleExport = () => {
    const headers = [
      "ID",
      t.caseName,
      t.client,
      t.lawyer,
      t.specialist,
      t.court,
      t.status,
    ];

    const data = [
      headers,
      ...records.map((r) => [
        r.id,
        r.title,
        r.client,
        r.mainAssignee,
        r.subAssignee,
        r.court,
        r.status,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    XLSX.writeFile(workbook, "records.xlsx");
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        "ID",
        language === "vi" ? "Tên vụ việc" : "Case Name",
        language === "vi" ? "Khách hàng" : "Client",
        language === "vi" ? "Luật sư" : "Lawyer",
        language === "vi" ? "Chuyên viên" : "Specialist",
        language === "vi" ? "Tòa án" : "Court",
        language === "vi" ? "Trạng thái" : "Status"
      ];

      const csvRows = [headers.join(",")];

      records.forEach((r) => {
        const row = [
          `"${r.id || ""}"`,
          `"${(r.title || "").replace(/"/g, '""')}"`,
          `"${(r.client || "").replace(/"/g, '""')}"`,
          `"${(r.mainAssignee || "").replace(/"/g, '""')}"`,
          `"${(r.subAssignee || "").replace(/"/g, '""')}"`,
          `"${(r.court || "").replace(/"/g, '""')}"`,
          `"${(r.status || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Danh_sach_ho_so_va_vu_viec.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export CSV error:", error);
    }
  };

  const handleDownloadAttachment = (att: any) => {
    const downloadName = att.originalName || att.fileName || att.name || "download";
    let url = att.url;

    if (!url) {
      alert("Tài liệu này chưa có đường dẫn tải xuống hợp lệ.");
      return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
  };

  const handleDownloadAllAttachments = async (record: any) => {
    const rawAttachments = record.attachments || [];
    const legacyAttachments = record.file && rawAttachments.length === 0 ? [{ name: record.file, url: '' }] : [];
    const attachments = [...rawAttachments, ...legacyAttachments];
    
    if (attachments.length === 0) {
      alert("Không có tài liệu nào để tải xuống.");
      return;
    }
    
    const zip = new JSZip();
    let hasFiles = false;
    
    for (const att of attachments) {
      if (att.url) {
        try {
          const response = await fetch(att.url);
          const blob = await response.blob();
          zip.file(att.name, blob);
          hasFiles = true;
        } catch(e) {
          console.error("Failed to fetch", att.url);
        }
      }
    }
    
    if (hasFiles) {
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `${record.id}_TatCaTaiLieu.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Không có tài liệu nào có đường dẫn tải xuống hợp lệ.");
    }
  };

  const handleUploadAttachmentChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setAttachmentUploadFiles(filesArr);
      const initialAbbrs: Record<number, string> = {};
      filesArr.forEach((_, i) => initialAbbrs[i] = "");
      setAttachmentAbbrs(initialAbbrs);
      setShowAttachmentModal(true);
    }
    e.target.value = '';
  };

  const handleConfirmUploadAttachments = () => {
    if (!viewingRecord) return;
    
    const newAttachments = attachmentUploadFiles.map((file, idx) => {
      const abbr = attachmentAbbrs[idx]?.trim() || "DOC";
      const extMatch = file.name.match(/\.[^.]+$/);
      const ext = extMatch ? extMatch[0] : "";
      
      return {
        name: `${viewingRecord.id}_${abbr}${ext}`,
        originalName: file.name,
        url: URL.createObjectURL(file)
      };
    });
    
    const currentAtts = viewingRecord.attachments || [];
    if (viewingRecord.file && currentAtts.length === 0) {
       currentAtts.push({ name: viewingRecord.file, url: '' });
    }
    
    const updatedRecord = {
      ...viewingRecord,
      attachments: [...currentAtts, ...newAttachments],
      file: undefined 
    };
    
    updateRecords(
      records.map(r => r.id === viewingRecord.id ? updatedRecord : r), 
      updatedRecord
    );
    syncToFirebase(updatedRecord);
    setViewingRecord(updatedRecord);
    setShowAttachmentModal(false);
    setAttachmentUploadFiles([]);
    setAttachmentAbbrs({});
  };

  const renderViewingRecord = viewingRecord && (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setViewingRecord(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-[var(--color-text-dark)] transition-all duration-300 active:scale-95"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">
            {language === "vi" ? "Quay lại" : "Back"}
          </span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge(viewingRecord.status)}
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
              {t.recordId}: {viewingRecord.id}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
              {viewingRecord.category}
            </span>
          </div>
          <span className="text-gray-600 text-sm flex items-center gap-1">
            <Clock size={14} /> {formatDisplayDate(viewingRecord.date)}
          </span>
        </div>

        <h3 className="text-2xl font-bold text-[var(--color-text-dark)] mb-6 font-serif">
          {viewingRecord.title}
        </h3>

        {(() => {
          const violations = getRecordBlacklistViolations(viewingRecord);
          if (violations.length > 0) {
            return (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-800 font-medium shadow-sm animate-pulse">
                <span className="text-xl">⚠️</span>
                <div>
                  <span className="font-extrabold text-base block text-red-900">
                    {language === "vi" 
                      ? "Cảnh báo Giám sát chất lượng: Hồ sơ chứa từ khóa nhạy cảm / rủi ro" 
                      : "Quality Control Alert: Record contains sensitive / blacklist keywords"}
                  </span>
                  <p className="text-xs text-red-700 mt-1">
                    {language === "vi"
                      ? "Hồ sơ này đã bị hệ thống phát hiện tự động do có chứa các từ khóa cấm trong danh mục Blacklist. Vui lòng rà soát nội dung nghiệp vụ kỹ lưỡng."
                      : "This record has been automatically flagged because it contains forbidden keywords from the blacklist. Please review the legal content thoroughly."}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {violations.map((v: string, i: number) => (
                      <span key={i} className="text-xs bg-red-600 text-white font-black px-2.5 py-1 rounded-lg shadow-sm uppercase tracking-wide">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-8">
              {/* 1. Thông tin chung */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-dark)] mb-4 uppercase tracking-wider border-b pb-2">
                  {language === "vi"
                    ? "1. Thông tin chung"
                    : "1. General Information"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-700">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Loại hồ sơ" : "Category"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.category || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Lĩnh vực" : "Domain"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.caseType || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Mã hồ sơ (Tự động)" : "Record ID"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.id || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Mã hệ thống" : "System ID"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.systemId || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Chi nhánh" : "Branch"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.branch || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Quản lý" : "Manager"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.manager || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Tòa án giải quyết" : "Court"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.courtRegion ||
                        viewingRecord.court ||
                        "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Địa chỉ tòa án" : "Court Address"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.courtAddress || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Chức danh thực hiện" : "Role"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {translateRole(viewingRecord.role || "---", language)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Phụ trách chính" : "Main Assignee"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.mainAssignee || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Phụ trách phụ" : "Sub Assignee"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.subAssignee ||
                        viewingRecord.assignee2 ||
                        "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Mức độ ưu tiên" : "Priority"}
                    </span>
                    <span
                      className={cn(
                        "font-medium flex items-center gap-1.5",
                        viewingRecord.priority === "Khẩn cấp"
                          ? "text-red-600"
                          : viewingRecord.priority === "Cao"
                            ? "text-orange-600"
                            : viewingRecord.priority === "Trung bình"
                              ? "text-blue-600"
                              : "text-gray-600",
                      )}
                    >
                      <AlertCircle
                        size={14}
                        className={cn(
                          viewingRecord.priority === "Khẩn cấp"
                            ? "text-red-500"
                            : viewingRecord.priority === "Cao"
                              ? "text-orange-500"
                              : viewingRecord.priority === "Trung bình"
                                ? "text-blue-500"
                                : "text-gray-400",
                        )}
                      />
                      {viewingRecord.priority || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi"
                        ? "Nội dung vụ việc"
                        : "Case Description"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.caseDescription || "---"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Thông tin khách hàng */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-dark)] mb-4 uppercase tracking-wider border-b pb-2">
                  {language === "vi"
                    ? "2. Thông tin khách hàng"
                    : "2. Client Information"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-700">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Khách hàng" : "Client"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.client || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "SĐT Khách hàng" : "Client Phone"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.clientPhone || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi"
                        ? "Địa chỉ thường trú"
                        : "Permanent Address"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.clientAddress || "---"}
                    </span>
                  </div>
                  {viewingRecord.clientTempAddress && (
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                        {language === "vi"
                          ? "Địa chỉ tạm trú"
                          : "Temporary Address"}
                      </span>
                      <span className="font-medium text-[var(--color-text-dark)]">
                        {viewingRecord.clientTempAddress}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Consultation Summary (Biên bản tư vấn AI) */}
              {(viewingRecord.aiSummaryText || viewingRecord.lastCallTimestamp) && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Scale size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                          {language === "vi" ? "🤖 BIÊN BẢN TƯ VẤN PHÁP LÝ AI" : "🤖 AI LEGAL CONSULTATION MINUTES"}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {language === "vi" ? `Lập tự động lúc: ${viewingRecord.lastCallTimestamp || '---'}` : `Auto-generated at: ${viewingRecord.lastCallTimestamp || '---'}`}
                        </p>
                      </div>
                    </div>
                    {viewingRecord.complianceStatus && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        viewingRecord.complianceStatus === "Vi phạm" 
                          ? "bg-rose-100 text-rose-700 border border-rose-200" 
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      )}>
                        {viewingRecord.complianceStatus === "Vi phạm" 
                          ? (language === "vi" ? "🔴 VI PHẠM TỪ CẤM" : "🔴 COMPLIANCE VIOLATION") 
                          : (language === "vi" ? "🟢 TUÂN THỦ CHUẨN MỰC" : "🟢 COMPLIANT")}
                      </span>
                    )}
                  </div>

                  {/* AI Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-150 p-3 rounded-xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {language === "vi" ? "Khả năng ký HĐ" : "Sign Probability"}
                      </span>
                      <span className="text-lg font-black text-indigo-600 font-mono">
                        {viewingRecord.contractProbability || "85%"}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-150 p-3 rounded-xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {language === "vi" ? "Độ khẩn cấp" : "Urgency"}
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {viewingRecord.urgency || "★★★☆☆"}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-150 p-3 rounded-xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {language === "vi" ? "Lĩnh vực tối ưu" : "Best Match Area"}
                      </span>
                      <span className="text-xs font-bold text-slate-700 block truncate">
                        {viewingRecord.category || "Tư vấn"}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-150 p-3 rounded-xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {language === "vi" ? "Luật sư đề xuất" : "Suggested Lawyer"}
                      </span>
                      <span className="text-xs font-bold text-slate-700 block truncate font-sans">
                        {viewingRecord.mainAssignee || "L.S Lê Ánh Dương"}
                      </span>
                    </div>
                  </div>

                  {/* Missing/Required documents */}
                  {viewingRecord.missingDocs && viewingRecord.missingDocs.length > 0 && (
                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-inner">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2.5">
                        {language === "vi" ? "📁 Hồ sơ, tài liệu cần bổ sung thu thập:" : "📁 Required Documents Checklist:"}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {viewingRecord.missingDocs.map((doc: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-xs font-medium text-slate-700">
                            <span className="text-amber-500 font-bold">⚠️</span>
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI full report */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      {language === "vi" ? "📝 Chi tiết biên bản tư vấn & Bản thoại" : "📝 Full Consult Summary & Audio Transcript"}
                    </span>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-700 max-h-[350px] overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed shadow-sm">
                      {viewingRecord.aiSummaryText}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Thời gian */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-dark)] mb-4 uppercase tracking-wider border-b pb-2">
                  {language === "vi" ? "3. Thời gian" : "3. Time"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm text-gray-700">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Ngày bắt đầu" : "Start Date"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {formatDisplayDate(viewingRecord.date)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Ngày đến hạn" : "Deadline"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {formatDisplayDate(viewingRecord.deadline)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi"
                        ? "Ngày hoàn thành"
                        : "Completion Date"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {formatDisplayDate(viewingRecord.completionDate) ||
                        (language === "vi"
                          ? "Chưa hoàn thành"
                          : "Not completed")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Thông tin hợp đồng */}
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-dark)] mb-4 uppercase tracking-wider border-b pb-2">
                  {language === "vi"
                    ? "4. Thông tin hợp đồng"
                    : "4. Contract Information"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-700">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi"
                        ? "Mã HĐ chính (HĐDVPL)"
                        : "Main Contract ID"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text-dark)]">
                        {viewingRecord.contractId || "---"}
                      </span>
                      {viewingRecord.contractId && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                contractDetails:
                                  viewingRecord.contractDetails || {},
                              });
                              setSelectedContractType("HĐDVPL");
                              setShowContractDetailsModal(true);
                            }}
                            className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white text-slate-400 transition-all duration-300 active:scale-95"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadContract(viewingRecord)
                            }
                            className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white text-blue-500 transition-all duration-300 active:scale-95"
                            title="Tải xuống hợp đồng (mẫu)"
                          >
                            <Download size={16} />
                          </button>
                          <label
                            className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white text-purple-500 transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center relative overflow-hidden"
                            title="Tải tệp PDF/Word lên để đóng dấu QR"
                          >
                            <input
                              type="file"
                              accept="application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  processUploadedContract(
                                    e.target.files[0],
                                    viewingRecord.contractId,
                                  );
                                  e.target.value = "";
                                }
                              }}
                            />
                            <Upload size={16} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi"
                        ? "Mã HĐ ủy quyền (HĐUQ)"
                        : "Auth Contract ID"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text-dark)]">
                        {viewingRecord.authContractId || "---"}
                      </span>
                      {viewingRecord.authContractId && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setFormData({
                                ...formData,
                                contractDetails:
                                  viewingRecord.contractDetails || {},
                              });
                              setSelectedContractType("HĐUQ");
                              setShowContractDetailsModal(true);
                            }}
                            className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white text-slate-400 transition-all duration-300 active:scale-95"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadContract(viewingRecord, "HĐUQ")
                            }
                            className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white text-blue-500 transition-all duration-300 active:scale-95"
                            title="Tải xuống hợp đồng (mẫu)"
                          >
                            <Download size={16} />
                          </button>
                          <label
                            className="p-1 rounded-lg hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white text-purple-500 transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center relative overflow-hidden"
                            title="Tải tệp PDF/Word lên để đóng dấu QR"
                          >
                            <input
                              type="file"
                              accept="application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  processUploadedContract(
                                    e.target.files[0],
                                    viewingRecord.authContractId,
                                  );
                                  e.target.value = "";
                                }
                              }}
                            />
                            <Upload size={16} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi"
                        ? "Tổng giá trị hợp đồng"
                        : "Total Contract Value"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.feeAmount
                        ? `${viewingRecord.feeAmount} VNĐ`
                        : "0 VNĐ"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Thanh toán đợt 1" : "Installment 1"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.paymentInstallment1
                        ? `${viewingRecord.paymentInstallment1} VNĐ`
                        : "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Thanh toán đợt 2" : "Installment 2"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.paymentInstallment2
                        ? `${viewingRecord.paymentInstallment2} VNĐ`
                        : "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Còn lại" : "Remaining"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.remainingPayment
                        ? `${viewingRecord.remainingPayment} VNĐ`
                        : "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi" ? "Ngày thanh toán" : "Payment Date"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.paymentDate || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi"
                        ? "Phương thức thanh toán"
                        : "Payment Method"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.paymentMethod || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                      {language === "vi"
                        ? "Giá trị HĐ đã bao gồm VAT?"
                        : "VAT Included?"}
                    </span>
                    <span className="font-medium text-[var(--color-text-dark)]">
                      {viewingRecord.vatIncluded || "---"}
                    </span>
                  </div>
                  {(viewingRecord.vatIncluded === "Có" ||
                    viewingRecord.vatIncluded === "Chưa bao gồm") && (
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                        {language === "vi" ? "% VAT" : "VAT %"}
                      </span>
                      <span className="font-medium text-[var(--color-text-dark)]">
                        {viewingRecord.vatPercent || "---"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Tiến độ Hoàn thành Hồ sơ & Tính toán */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mt-6">
              <h4 className="text-sm font-bold text-[var(--color-text-dark)] mb-5 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <Activity size={16} className="text-[var(--color-accent)]" />
                {language === "vi" ? "5. Tiến độ & Kiểm tra hoàn thành hồ sơ" : "5. Case Progress & Completion Checklist"}
              </h4>

              {(() => {
                const currentSteps = viewingRecord.progressSteps || [
                  { id: 1, label: "Tiếp nhận thông tin & Xác minh yêu cầu", weight: 15, completed: false },
                  { id: 2, label: "Thu thập chứng cứ & Tài liệu pháp lý", weight: 15, completed: false },
                  { id: 3, label: "Soạn thảo văn bản, hồ sơ & Đơn từ", weight: 20, completed: false },
                  { id: 4, label: "Nộp hồ sơ lên cơ quan có thẩm quyền", weight: 15, completed: false },
                  { id: 5, label: "Thụ lý, theo dõi & Giải quyết vụ việc", weight: 15, completed: false },
                  { id: 6, label: "Nhận kết quả & Bàn giao hồ sơ", weight: 20, completed: false }
                ];

                const completedWeight = currentSteps.filter((s: any) => s.completed).reduce((sum: number, s: any) => sum + (s.weight || 0), 0);
                const totalWeight = currentSteps.reduce((sum: number, s: any) => sum + (s.weight || 0), 0);
                const progressPct = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

                return (
                  <div className="space-y-6">
                    {/* Progress bar visual */}
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                      {/* Circular progress visual or elegant text */}
                      <div className="relative shrink-0 flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-md border-4 border-slate-100">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            className="stroke-current text-slate-100"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            className="stroke-current text-[var(--color-primary)]"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressPct / 100)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="text-center z-10">
                          <span className="text-2xl font-black text-slate-800 font-mono leading-none block">{progressPct}%</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{language === "vi" ? "Tiến độ" : "Progress"}</span>
                        </div>
                      </div>

                      {/* Text and dynamic feedback */}
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex justify-between items-baseline">
                          <h5 className="font-bold text-slate-800 text-sm">
                            {language === "vi" ? "Tính toán tiến độ hoàn thành" : "Calculated Case Completion"}
                          </h5>
                          <span className="text-xs font-semibold text-slate-500">
                            {currentSteps.filter((s: any) => s.completed).length}/{currentSteps.length} {language === "vi" ? "bước hoàn thành" : "steps completed"}
                          </span>
                        </div>
                        
                        {/* Horizontal bar */}
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/30">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-700 ease-out"
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>

                        <p className="text-xs text-slate-500 font-medium">
                          {progressPct === 100
                            ? (language === "vi" ? "🎉 Tuyệt vời! Hồ sơ đã hoàn thành tất cả các bước chuẩn bị." : "🎉 Excellent! Case has completed all operational phases.")
                            : (language === "vi" ? `Hồ sơ đã đạt ${progressPct}% tiến độ. Vui lòng hoàn thành các bước còn lại để bàn giao.` : `Case is at ${progressPct}% completion progress. Continue checking steps to finish.`)}
                        </p>
                      </div>
                    </div>

                    {/* Interactive checklist */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                        {language === "vi" ? "Danh sách hạng mục công việc (Checklist)" : "Completion Checklist Milestones"}
                      </span>

                      <div className="grid grid-cols-1 gap-2">
                        {currentSteps.map((step: any) => (
                          <div
                            key={step.id}
                            onClick={() => {
                              const updatedSteps = currentSteps.map((s: any) =>
                                s.id === step.id ? { ...s, completed: !s.completed } : s
                              );
                              const cWeight = updatedSteps.filter((s: any) => s.completed).reduce((sum: number, s: any) => sum + (s.weight || 0), 0);
                              const tWeight = updatedSteps.reduce((sum: number, s: any) => sum + (s.weight || 0), 0);
                              const newPct = tWeight > 0 ? Math.round((cWeight / tWeight) * 100) : 0;

                              const updatedRecord = {
                                ...viewingRecord,
                                progressSteps: updatedSteps,
                                calculatedProgress: newPct
                              };

                              updateRecords(
                                records.map((r: any) => (r.id === viewingRecord.id ? updatedRecord : r)),
                                updatedRecord
                              );
                              syncToFirebase(updatedRecord);
                              setViewingRecord(updatedRecord);
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
                              step.completed
                                ? "bg-emerald-50/60 border-emerald-200/60 text-slate-800"
                                : "bg-white border-slate-150 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-300 ${
                                step.completed
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}>
                                {step.completed && <Check size={14} strokeWidth={3} />}
                              </div>
                              <span className={`text-xs font-medium ${step.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                                {step.label}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              step.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                            }`}>
                              {step.weight}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add custom step form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const target = e.target as any;
                        const label = target.elements.stepLabel.value.trim();
                        const weight = parseInt(target.elements.stepWeight.value) || 10;
                        if (!label) return;

                        const newStep = {
                          id: Date.now(),
                          label,
                          weight,
                          completed: false
                        };

                        const updatedSteps = [...currentSteps, newStep];
                        const cWeight = updatedSteps.filter((s: any) => s.completed).reduce((sum: number, s: any) => sum + (s.weight || 0), 0);
                        const tWeight = updatedSteps.reduce((sum: number, s: any) => sum + (s.weight || 0), 0);
                        const newPct = tWeight > 0 ? Math.round((cWeight / tWeight) * 100) : 0;

                        const updatedRecord = {
                          ...viewingRecord,
                          progressSteps: updatedSteps,
                          calculatedProgress: newPct
                        };

                        updateRecords(
                          records.map((r: any) => (r.id === viewingRecord.id ? updatedRecord : r)),
                          updatedRecord
                        );
                        syncToFirebase(updatedRecord);
                        setViewingRecord(updatedRecord);
                        target.reset();
                      }}
                      className="flex flex-col sm:flex-row items-stretch gap-2 pt-3 border-t border-slate-100"
                    >
                      <input
                        type="text"
                        name="stepLabel"
                        placeholder={language === "vi" ? "Thêm nhiệm vụ mới..." : "Add new subtask..."}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <div className="flex gap-2">
                        <select
                          name="stepWeight"
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        >
                          <option value="5">5%</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                          <option value="20">20%</option>
                          <option value="25">25%</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-xs font-bold rounded-lg transition-all duration-300 shrink-0"
                        >
                          {language === "vi" ? "Thêm" : "Add"}
                        </button>
                      </div>
                    </form>
                  </div>
                );
              })()}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[var(--color-text-dark)] uppercase tracking-wider">
                  {language === "vi" ? "Tài liệu đính kèm" : "Attachments"}
                </h4>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownloadAllAttachments(viewingRecord)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium transition-all duration-300 hover:bg-blue-100 active:scale-95"
                  >
                    <Download size={14} /> {language === "vi" ? "Tải tất cả (ZIP)" : "Download All (ZIP)"}
                  </button>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-medium cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-95">
                    <UploadCloud size={14} /> {language === "vi" ? "Tải tài liệu lên" : "Upload Document"}
                    <input type="file" className="hidden" multiple onChange={handleUploadAttachmentChanged} />
                  </label>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {(() => {
                  const rawAttachments = viewingRecord.attachments || [];
                  const legacyAttachments = viewingRecord.file && rawAttachments.length === 0 ? [{ name: viewingRecord.file, url: '' }] : [];
                  const attachments = [...rawAttachments, ...legacyAttachments];
                  return (
                    <>
                      {attachments.map((att: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm transition-all duration-300 hover:border-blue-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FileText size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800 break-all">{att.name}</p>
                                {att.originalName && <p className="text-xs text-slate-400 break-all">{att.originalName}</p>}
                              </div>
                            </div>
                            <button onClick={() => handleDownloadAttachment(att)} className="p-2 shrink-0 text-slate-400 hover:text-blue-600 transition-all duration-300 hover:bg-blue-50 rounded-lg active:scale-95" title={language === "vi" ? "Tải xuống" : "Download"}>
                              <Download size={16} />
                            </button>
                          </div>
                      ))}
                      {attachments.length === 0 && (
                        <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
                          {language === "vi" ? "Chưa có tài liệu đính kèm" : "No attachments yet"}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Review & Case Sharing Tool */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6 mt-6">
              <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg">
                    <Share2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-dark)] uppercase tracking-wide">
                      {language === "vi" ? "Đánh giá & Chia sẻ hồ sơ" : "Client Reviews & Social Share"}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {language === "vi" ? "Tạo ảnh đánh giá vụ việc thành công để chia sẻ" : "Generate beautiful rating testimonial cards"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {language === "vi" ? "Người đánh giá" : "Reviewer Name"}
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      {language === "vi" ? "Số sao đánh giá" : "Rating Star"}
                    </label>
                    <div className="flex items-center gap-1.5 h-10">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                        >
                          <Star size={22} fill={star <= reviewRating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {language === "vi" ? "Ý kiến đánh giá của khách hàng" : "Client Review Statement"}
                  </label>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 shadow-sm resize-none"
                    placeholder={language === "vi" ? "Nhập nội dung ý kiến phản hồi..." : "Input client testimonial..."}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const updatedRecord = {
                        ...viewingRecord,
                        clientReview: {
                          rating: reviewRating,
                          comment: reviewComment,
                          reviewerName,
                          date: new Date().toISOString()
                        }
                      };
                      updateRecords(
                        records.map((r: any) => (r.id === viewingRecord.id ? updatedRecord : r)),
                        updatedRecord
                      );
                      syncToFirebase(updatedRecord);
                      setViewingRecord(updatedRecord);
                      
                      // Show success animation on the button
                      const btn = document.getElementById('save-review-btn');
                      if (btn) {
                        const originalText = btn.innerHTML;
                        btn.innerHTML = language === "vi" ? "✓ Đã lưu thành công" : "✓ Saved Successfully";
                        btn.classList.add('bg-emerald-600', 'text-white');
                        setTimeout(() => {
                          btn.innerHTML = originalText;
                          btn.classList.remove('bg-emerald-600', 'text-white');
                        }, 2000);
                      }
                    }}
                    id="save-review-btn"
                    className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-xs font-bold rounded-lg transition-all duration-300 shadow-md flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    {language === "vi" ? "Lưu Đánh Giá" : "Save Review"}
                  </button>
                </div>
              </div>

              {/* Share Card & Actions */}
              <div className="border-t border-slate-200/80 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {language === "vi" ? "Xem trước thẻ chia sẻ" : "Share Card Preview"}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const shareUrl = `https://anhduonglaw.vn/share/record-${viewingRecord.id}`;
                        navigator.clipboard.writeText(shareUrl);
                        setIsCopiedReview(true);
                        setTimeout(() => setIsCopiedReview(false), 2000);
                      }}
                      className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg shadow-sm transition-all duration-300 hover:text-blue-600 active:scale-95 flex items-center gap-1 text-xs font-bold"
                      title={language === "vi" ? "Sao chép liên kết" : "Copy Share Link"}
                    >
                      {isCopiedReview ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      {isCopiedReview ? (language === "vi" ? "Đã sao chép" : "Copied") : (language === "vi" ? "Sao chép" : "Copy")}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const cardElement = document.getElementById(`share-card-${viewingRecord.id}`);
                        if (cardElement) {
                          try {
                            const canvas = await html2canvas(cardElement, {
                              useCORS: true,
                              allowTaint: false,
                              scale: 2,
                            });
                            const dataUrl = canvas.toDataURL("image/png");
                            const link = document.createElement("a");
                            link.download = `DanhGia_HoSo_${viewingRecord.id}.png`;
                            link.href = dataUrl;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } catch (error) {
                            console.error("Error generating share card:", error);
                          }
                        }
                      }}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all duration-300 active:scale-95 flex items-center gap-1 text-xs font-bold"
                    >
                      <Download size={14} />
                      {language === "vi" ? "Tải ảnh thẻ" : "Download Card"}
                    </button>
                  </div>
                </div>

                {/* The beautifully designed physical Share Card that html2canvas will target */}
                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-inner bg-slate-100 p-4 flex justify-center">
                  <div
                    id={`share-card-${viewingRecord.id}`}
                    className="w-full max-w-md bg-gradient-to-br from-[#0C3645] to-[#041a22] text-white p-6 rounded-2xl relative overflow-hidden shadow-2xl border-2 border-[#D4AF37]/30 font-sans"
                    style={{ minHeight: "340px" }}
                  >
                    {/* Background gold decorative radial accent */}
                    <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

                    {/* Card Header with Logo/Name */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-[#D4AF37]/30">
                          <Scale size={16} className="text-[#D4AF37]" />
                        </div>
                        <div>
                          <h5 className="text-xs font-extrabold tracking-wider text-white uppercase leading-none font-serif">
                            ÁNH DƯƠNG LAW FIRM
                          </h5>
                          <span className="text-[9px] text-[#D4AF37] tracking-[0.15em] font-medium leading-none block mt-0.5 uppercase">
                            Vững Pháp Lý - Sáng Tương Lai
                          </span>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-bold uppercase tracking-wider">
                        {language === "vi" ? "Hoàn thành xuất sắc" : "Successfully Completed"}
                      </div>
                    </div>

                    {/* Card Body Case Title */}
                    <div className="mb-4">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-0.5">
                        {viewingRecord.category || (language === "vi" ? "VỤ VIỆC DÂN SỰ" : "CASE FILE")}
                      </span>
                      <h4 className="text-base font-bold text-white tracking-tight leading-snug font-serif line-clamp-2">
                        {viewingRecord.title}
                      </h4>
                      <div className="flex gap-4 mt-2 text-[10px] text-slate-300 font-medium">
                        <span>{language === "vi" ? "Mã hồ sơ:" : "ID:"} <strong className="text-[#D4AF37]">{viewingRecord.id}</strong></span>
                        <span>{language === "vi" ? "Luật sư chính:" : "Counsel:"} <strong className="text-white">{viewingRecord.mainAssignee || "Ánh Dương"}</strong></span>
                      </div>
                    </div>

                    {/* Card Testimonial quote from customer */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative">
                      <span className="absolute -top-3 left-4 text-3xl text-[#D4AF37] font-serif leading-none pointer-events-none">“</span>
                      <p className="text-xs text-slate-200 italic leading-relaxed pl-3 pr-2 relative z-10 pt-1 line-clamp-3">
                        {reviewComment || (language === "vi" ? "Hồ sơ được giải quyết vô cùng nhanh chóng, chuyên nghiệp và uy tín!" : "Extremely professional, speedy, and reputable service!")}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 pl-3">
                        <div>
                          <span className="text-[11px] font-bold text-[#D4AF37] block">
                            {reviewerName || viewingRecord.client || (language === "vi" ? "Khách hàng Ánh Dương Law" : "Client")}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {language === "vi" ? "Đã xác thực dịch vụ" : "Verified Client"}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className="text-[#D4AF37]"
                              fill={star <= reviewRating ? "#D4AF37" : "none"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer contacts */}
                    <div className="flex items-center justify-between text-[8px] text-slate-400 mt-5 pt-3 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <MapPin size={8} className="text-[#D4AF37]" />
                        {language === "vi" ? "Hà Nội - TP. Hồ Chí Minh" : "Hanoi - Ho Chi Minh City"}
                      </span>
                      <span className="font-mono">hotline: 0988.123.456</span>
                      <span className="font-medium text-cyan-400">www.anhduonglaw.vn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit & Report History moved to bottom */}
          </div>

          {/* Right Column: Actions */}
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-sm font-bold text-[var(--color-text-dark)] mb-4 uppercase tracking-wider">
                {language === "vi" ? "Thao tác" : "Actions"}
              </div>

              <div className="mb-4 space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  {language === "vi" ? "Cập nhật trạng thái" : "Update Status"}
                </label>
                <select
                  value={viewingRecord.status || ""}
                  onChange={(e) =>
                    handleUpdateRecordField(
                      "status",
                      e.target.value,
                      language === "vi" ? "Trạng thái" : "Status",
                    )
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  {language === "vi" ? "Mức độ ưu tiên" : "Priority"}
                </label>
                <select
                  value={viewingRecord.priority || ""}
                  onChange={(e) =>
                    handleUpdateRecordField(
                      "priority",
                      e.target.value,
                      language === "vi" ? "Mức độ ưu tiên" : "Priority",
                    )
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleComplete}
                disabled={viewingRecord.status?.includes("Hoàn thành")}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-green-700 font-medium transition-all duration-300 hover:bg-green-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                {language === "vi" ? "Hoàn thành hồ sơ" : "Complete Record"}
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(viewingRecord);
                  setShowAIModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 text-white font-medium transition-all duration-300 hover:bg-purple-700 active:scale-95 shadow-sm"
              >
                <Star size={18} />
                {t.aiAnalysis}
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(viewingRecord);
                  setShowChatModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-300 active:scale-95 shadow-sm"
              >
                <MessageSquare size={18} />
                {language === "vi" ? "Khách hàng" : "Client Chat"}
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(viewingRecord);
                  setShowInternalChatModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 text-white font-medium transition-all duration-300 hover:bg-indigo-700 active:scale-95 shadow-sm"
              >
                <div className="relative">
                  <Users size={18} />
                  {(unreadInternalChats || {})[viewingRecord?.id || viewingRecord?.systemId] > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                    </span>
                  )}
                </div>
                {language === "vi" ? "Nội bộ" : "Internal Chat"}
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-200">
              {canEditRecord(viewingRecord) && (
                <button
                  onClick={() => handleEdit(viewingRecord)}
                  className="text-gray-400 hover:text-blue-600 transition-all duration-300 active:scale-95 flex flex-col items-center gap-1"
                >
                  <Edit2 size={20} />
                  <span className="text-[10px] font-medium uppercase">
                    {language === "vi" ? "Sửa" : "Edit"}
                  </span>
                </button>
              )}
              {canDeleteRecord(viewingRecord) && (
                <button
                  onClick={() => setShowDeleteConfirm(viewingRecord.id)}
                  className="text-gray-400 hover:text-red-600 transition-all duration-300 active:scale-95 flex flex-col items-center gap-1"
                >
                  <Trash2 size={20} />
                  <span className="text-[10px] font-medium uppercase">
                    {language === "vi" ? "Xóa" : "Delete"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {(() => {
          const parseDateString = (tsString: string) => {
            if (!tsString) return 0;
            if (tsString.includes('T')) return new Date(tsString).getTime();
            
            const pmMatch = tsString.match(/(\d+):(\d+):(\d+)\s+(AM|PM)\s+(\d+)\/(\d+)\/(\d+)/i);
            if (pmMatch) {
               let [_, h, m, s, ampm, d, mo, y] = pmMatch;
               let hour = parseInt(h, 10);
               if (ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
               if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
               return new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(d, 10), hour, parseInt(m, 10), parseInt(s, 10)).getTime();
            }

            const match2 = tsString.match(/(\d+):(\d+):(\d+)\s+(\d+)\/(\d+)\/(\d+)/i);
            if (match2) {
               let [_, h, m, s, d, mo, y] = match2;
               return new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(d, 10), parseInt(h, 10), parseInt(m, 10), parseInt(s, 10)).getTime();
            }
            
            const fallback = new Date(tsString).getTime();
            return isNaN(fallback) ? 0 : fallback;
          };

          const formatParsedDate = (ms: number) => {
            if (!ms) return "";
            const d = new Date(ms);
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
          };

          const allLogs = [
            ...(viewingRecord.reportHistory || []).map((r: any) => ({ ...r, _type: 'report', ms: parseDateString(r.timestamp) })),
            ...(viewingRecord.auditLogs || []).map((l: any) => ({ ...l, _type: 'audit', ms: parseDateString(l.timestamp) }))
          ].sort((a, b) => b.ms - a.ms);

          const groupedLogs: Array<{ ms: number, audit?: any, report?: any }> = [];
          for (const log of allLogs) {
            const existingGroup = groupedLogs.find(g => Math.abs(g.ms - log.ms) < 120000 && (!g[log._type as 'audit' | 'report']));
            if (existingGroup) {
              if (log._type === 'audit') existingGroup.audit = log;
              if (log._type === 'report') existingGroup.report = log;
            } else {
              groupedLogs.push({
                ms: log.ms,
                audit: log._type === 'audit' ? log : undefined,
                report: log._type === 'report' ? log : undefined,
              });
            }
          }
          
          const canViewHistory = user?.role === 'admin' || myPermissions?.viewReports || myPermissions?.viewAllRecords || myPermissions?.editAllRecords;
          
          if (groupedLogs.length === 0 || !canViewHistory) return null;
          
          return (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h4 className="text-lg font-bold text-[var(--color-text-dark)] mb-4">
                {language === "vi" ? "Lịch sử báo cáo & Thay đổi" : "Report & Audit History"}
              </h4>
              <div className="space-y-4">
                {groupedLogs.map((group, i: number) => {
                  const { audit, report, ms } = group;
                  const displayTime = formatParsedDate(ms);
                  const userName = audit?.user || "Unknown";
                  let actionText = audit?.action;
                  
                  if (report && (!actionText || actionText === "Chỉnh sửa")) {
                     actionText = language === "vi" ? `Cập nhật báo cáo ${report.docType || ""}` : `Updated report ${report.docType || ""}`;
                  } else if (report && actionText && actionText !== "Chỉnh sửa") {
                     actionText = `${actionText} & ${language === "vi" ? `Cập nhật báo cáo ${report.docType || ""}` : `Updated report ${report.docType || ""}`}`;
                  } else if (!actionText && report) {
                     actionText = language === "vi" ? `Cập nhật báo cáo ${report.docType || ""}` : `Updated report ${report.docType || ""}`;
                  }

                  return (
                    <div
                      key={`group-${i}`}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col gap-3 text-sm"
                    >
                      <div className="flex justify-between items-start text-[var(--color-text-dark)] mb-1">
                        <div className="flex flex-col gap-0.5">
                          {audit && (
                            <span className="font-semibold text-[var(--color-text-dark)]">
                              {userName}
                            </span>
                          )}
                          <span className="text-gray-600 font-medium">
                            {actionText}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs font-mono font-medium opacity-90 border border-gray-200 bg-white px-2 py-1 rounded">
                          {displayTime}
                        </span>
                      </div>
                      
                      {report && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-1">
                          {report.files && report.files.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center justify-end mb-3">
                              {report.files.map((f: any, fileIdx: number) => (
                                <button
                                  key={fileIdx}
                                  onClick={() => handleDownloadAttachment({
                                    name: f.name,
                                    url: f.url || viewingRecord.attachments?.find((a: any) => a.originalName === f.name || a.name === f.name)?.url || ''
                                  })}
                                  className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1.5 rounded text-xs font-medium hover:bg-blue-100 transition-all duration-300 active:scale-95 cursor-pointer border border-blue-100"
                                  title={language === "vi" ? "Tải xuống" : "Download"}
                                >
                                  <FileText size={14} />
                                  <span className="truncate max-w-[200px]">{f.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Fallback for legacy log.fileName */}
                          {report.fileName && (!report.files || report.files.length === 0) && (
                            <button
                              onClick={() => handleDownloadAttachment({
                                name: report.fileName,
                                url: report.url || viewingRecord.attachments?.find((a: any) => a.originalName === report.fileName || a.name === report.fileName)?.url || ''
                              })}
                              className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1.5 rounded text-xs font-medium hover:bg-blue-100 transition-all duration-300 active:scale-95 cursor-pointer mb-3 border border-blue-100 w-fit ml-auto"
                              title={language === "vi" ? "Tải xuống" : "Download"}
                            >
                              <FileText size={14} />
                              <span className="truncate max-w-[200px]">{report.fileName}</span>
                            </button>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 mb-2">
                            <div>
                              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                                {language === "vi" ? "Lĩnh vực" : "Domain"}
                              </span>
                              <span className="font-medium text-slate-800">{report.domain || "-"}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                                {language === "vi" ? "Văn bản" : "Document"}
                              </span>
                              <span className="font-medium text-slate-800">{report.docType || "-"}</span>
                            </div>
                          </div>
                          {report.note && (
                            <div className="text-xs text-slate-600 border-t border-slate-100 pt-2 mt-2">
                              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                                {language === "vi" ? "Ghi chú" : "Notes"}
                              </span>
                              <p className="whitespace-pre-wrap leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">{report.note}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {showAttachmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{language === "vi" ? "Nhập tên viết tắt cho tài liệu" : "Enter document abbreviations"}</h3>
            <p className="text-sm text-gray-600 mb-6">{language === "vi" ? "Tên file sẽ được lưu với định dạng: [Mã hồ sơ]_[Tên viết tắt]" : "File name will be stored as: [Record ID]_[Abbreviation]"}</p>
            
            <div className="space-y-4 mb-6">
              {attachmentUploadFiles.map((f, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    <span className="text-sm font-medium text-slate-800 break-all">{f.name}</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder={language === "vi" ? "VD: DKK (Đơn khởi kiện)" : "Ex: DKK"}
                    value={attachmentAbbrs[i] || ""}
                    onChange={e => setAttachmentAbbrs({...attachmentAbbrs, [i]: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="text-xs text-slate-500">
                    {language === "vi" ? "Kết quả:" : "Result:"} <span className="font-medium text-blue-600">{viewingRecord?.id}_{attachmentAbbrs[i] || "DOC"}{f.name.match(/\.[^.]+$/)?.[0] || ""}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-100">
              <button 
                onClick={() => { setShowAttachmentModal(false); setAttachmentUploadFiles([]); }}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button 
                onClick={handleConfirmUploadAttachments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
              >
                {language === "vi" ? "Tải lên tài liệu" : "Upload Documents"}
              </button>
            </div>
          </div>
        </div>
      )}
      {renderViewingRecord || (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-6">
            {/* Header & Filters */}
          <div className="flex flex-col gap-4 mb-6">
            <ERPRecordHeader
              language={language}
              t={t}
              viewMode={viewMode}
              setViewMode={setViewMode}
              canViewAll={canViewAll}
              fileInputRef={fileInputRef}
              handleImport={handleImport}
              handleExport={handleExport}
              handleExportCSV={handleExportCSV}
              records={records}
              setEditingRecord={setEditingRecord}
              setFormData={setFormData}
              setShowAddRecord={setShowAddRecord}
              setShowCccdScanner={setShowCccdScanner}
            />

            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <ERPRecordFilters
                  language={language}
                  t={t}
                  selectedAssignee={selectedAssignee}
                  setSelectedAssignee={setSelectedAssignee}
                  selectedBranch={selectedBranch}
                  setSelectedBranch={setSelectedBranch}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  selectedPriority={selectedPriority}
                  setSelectedPriority={setSelectedPriority}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  uniqueAssignees={uniqueAssignees}
                  dynamicBranchOptions={dynamicBranchOptions}
                  STATUS_OPTIONS={STATUS_OPTIONS}
                  globalRecordTypes={globalRecordTypes || []}
                />
                <ERPRecordToolbar
                  language={language}
                  t={t}
                  selectedSortBy={selectedSortBy}
                  setSelectedSortBy={setSelectedSortBy}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </div>
            </div>

            <ERPRecordStatusBar
              language={language}
              t={t}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              filteredRecordsLength={filteredRecords.length}
            />
          </div>

          {/* View Content */}
          {viewMode === "grid" ? (
            <ERPRecordGridView
              records={paginatedRecords}
              language={language}
              formatCaseCode={formatCaseCode}
              formatDisplayDate={formatDisplayDate}
              getStatusColor={getStatusColor}
              isOverdue={isOverdue}
              getRecordBlacklistViolations={getRecordBlacklistViolations}
              setViewingRecord={setViewingRecord}
              canEditRecord={canEditRecord}
              handleEdit={handleEdit}
              canDeleteRecord={canDeleteRecord}
              setShowDeleteConfirm={setShowDeleteConfirm}
              setShowYeastar={setShowYeastar}
              activeCallDossierId={activeCallDossierId}
              setActiveCallDossierId={setActiveCallDossierId}
              renderLoadMoreControls={() => renderLoadMoreControls?.(filteredRecords.length)}
            />
          ) : viewMode === "list" ? (
            <ERPRecordListView
              records={paginatedRecords}
              language={language}
              formatDisplayDate={formatDisplayDate}
              getStatusColor={getStatusColor}
              isOverdue={isOverdue}
              setViewingRecord={setViewingRecord}
              canEditRecord={canEditRecord}
              handleEdit={handleEdit}
              canDeleteRecord={canDeleteRecord}
              setShowDeleteConfirm={setShowDeleteConfirm}
              activeCallDossierId={activeCallDossierId}
              setActiveCallDossierId={setActiveCallDossierId}
              renderLoadMoreControls={() => renderLoadMoreControls?.(filteredRecords.length)}
            />
          ) : viewMode === "admin" && canViewAll ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-blue-400/50">
                  <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm">
                    {language === "vi" ? "Tổng Hồ Sơ" : "Total Records"}
                  </div>
                  <div className="text-3xl font-bold text-white drop-shadow-md">
                    {filteredRecords.length}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-emerald-400/50">
                  <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm">
                    {language === "vi" ? "Đã Hoàn Thành" : "Completed"}
                  </div>
                  <div className="text-3xl font-bold text-white drop-shadow-md">
                    {
                      records.filter(
                        (r) =>
                          r.status &&
                          r.status.toLowerCase().includes("hoàn thành"),
                      ).length
                    }
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="text-red-600 text-sm font-semibold mb-1">
                    {language === "vi" ? "Quá Hạn" : "Overdue"}
                  </div>
                  <div className="text-3xl font-bold text-red-700">
                    {
                      records.filter((r) => {
                        if (
                          !r.deadline ||
                          (r.status &&
                            r.status.toLowerCase().includes("hoàn thành"))
                        )
                          return false;
                        const parts = r.deadline.split("/");
                        if (parts.length === 3) {
                          const time = new Date(
                            parseInt(parts[2]),
                            parseInt(parts[1]) - 1,
                            parseInt(parts[0]),
                          ).getTime();
                          return time < Date.now();
                        }
                        return false;
                      }).length
                    }
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="text-orange-600 text-sm font-semibold mb-1">
                    {language === "vi" ? "Ưu tiên Cao" : "High Priority"}
                  </div>
                  <div className="text-3xl font-bold text-orange-700">
                    {
                      records.filter(
                        (r) => r.priority === "Gấp" || r.priority === "Rất gấp",
                      ).length
                    }
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase size={18} className="text-blue-600" />
                    {language === "vi"
                      ? "Tình Trạng Phân Công (Workload)"
                      : "Assignee Workload"}
                  </h3>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 pr-4 font-semibold">
                          {language === "vi" ? "Người phụ trách" : "Assignee"}
                        </th>
                        <th className="pb-3 px-4 font-semibold text-center">
                          {language === "vi" ? "Đang Xử Lý" : "In Progress"}
                        </th>
                        <th className="pb-3 px-4 font-semibold text-center">
                          {language === "vi" ? "Hoàn Thành" : "Completed"}
                        </th>
                        <th className="pb-3 pl-4 font-semibold">
                          {language === "vi" ? "Ghi chú" : "Notes"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {uniqueAssignees.map((assignee) => {
                        const pRecords = records.filter(
                          (r) => r.mainAssignee === assignee,
                        );
                        const completed = pRecords.filter(
                          (r) =>
                            r.status &&
                            r.status.toLowerCase().includes("hoàn thành"),
                        ).length;
                        const inProgress = pRecords.length - completed;

                        return (
                          <tr
                            key={assignee}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-4 pr-4 font-medium text-slate-800">
                              {assignee}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold",
                                  inProgress > 0
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {inProgress}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold",
                                  completed > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {completed}
                              </span>
                            </td>
                            <td className="py-4 pl-4 text-sm text-slate-500">
                              {inProgress > 3
                                ? language === "vi"
                                  ? "Khối lượng công việc cao"
                                  : "Heavy workload"
                                : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // kanban
            <div className="space-y-4">
              <div className="flex justify-end mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    {language === "vi" ? "Nhóm theo:" : "Group by:"}
                  </span>
                  <select
                    value={kanbanGroupBy}
                    onChange={(e: any) => setKanbanGroupBy(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="status">
                      {language === "vi" ? "Trạng thái" : "Status"}
                    </option>
                    <option value="assignee">
                      {language === "vi" ? "Người phụ trách" : "Assignee"}
                    </option>
                    <option value="category">
                      {language === "vi" ? "Loại hồ sơ" : "Category"}
                    </option>
                  </select>
                </div>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 touch-pan-x min-h-[600px] snap-x">
                {(() => {
                  let columns: { id: string; label: string; records: any[] }[] =
                    [];
                  if (kanbanGroupBy === "status") {
                    columns = STATUS_OPTIONS.map((status) => ({
                      id: status,
                      label: status,
                      records: filteredRecords.filter(
                        (r) => r.status === status,
                      ),
                    }));
                  } else if (kanbanGroupBy === "assignee") {
                    const assignees = Array.from(
                      new Set(
                        filteredRecords.map(
                          (r) => r.mainAssignee || "Chưa phân công",
                        ),
                      ),
                    );
                    columns = assignees.map((assignee) => ({
                      id: assignee,
                      label: assignee,
                      records: filteredRecords.filter(
                        (r) =>
                          (r.mainAssignee || "Chưa phân công") === assignee,
                      ),
                    }));
                  } else if (kanbanGroupBy === "category") {
                    const categories = Array.from(
                      new Set(filteredRecords.map((r) => r.category || "Khác")),
                    );
                    columns = categories.map((category) => ({
                      id: category,
                      label: category,
                      records: filteredRecords.filter(
                        (r) => (r.category || "Khác") === category,
                      ),
                    }));
                  }

                  return columns.map((col) => {
                    const statusRecords = col.records;
                    return (
                      <div
                        key={col.id}
                        className="shrink-0 w-80 flex flex-col bg-slate-50/80 rounded-xl border border-slate-200 snap-center shadow-sm h-[600px]"
                      >
                        <div className="p-3.5 font-semibold text-sm flex justify-between items-center bg-white rounded-t-xl border-b border-slate-200 group relative">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                kanbanGroupBy === "status"
                                  ? getStatusLineColor(col.label)
                                  : "bg-blue-500",
                              )}
                            ></div>
                            <span className="text-slate-800">{col.label}</span>
                          </div>
                          <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs font-bold">
                            {statusRecords.length}
                          </span>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                          {statusRecords.map((record, idx) => (
                            <div
                              key={`${record.id}-${record.category || ""}-${idx}`}
                              className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-300 active:scale-[0.98] group flex flex-col relative overflow-hidden"
                              onClick={() => setViewingRecord(record)}
                            >
                              <div
                                className={cn(
                                  "absolute top-0 left-0 w-1 h-full",
                                  getStatusLineColor(record.status),
                                )}
                              ></div>
                              <div className="flex justify-between items-start mb-2 pl-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] bg-[length:200%_200%] animate-gradient text-white shadow-sm border border-blue-400/30 w-fit">
                                  {formatCaseCode(record.id)}
                                </span>
                                {canEditRecord(record) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(record);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all p-1.5 -mr-1.5 -mt-1.5 rounded-md hover:bg-blue-50 z-10"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                )}
                              </div>
                              <h4 className="font-medium text-slate-800 text-sm mb-3 line-clamp-2 leading-snug pl-2">
                                {record.title}
                              </h4>

                              <div className="flex flex-col gap-2 mt-auto pl-2">
                                {kanbanGroupBy !== "status" && (
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap",
                                        getStatusColor(record.status),
                                      )}
                                    >
                                      {record.status}
                                    </span>
                                  </div>
                                )}
                                {(kanbanGroupBy !== "category" ||
                                  record.priority) && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {kanbanGroupBy !== "category" &&
                                      record.category && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap bg-slate-100 text-slate-600 border border-slate-200">
                                          {record.category}
                                        </span>
                                      )}
                                    {record.priority && (
                                      <span
                                        className={cn(
                                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap border tracking-wider",
                                          record.priority === "Cao"
                                            ? "bg-orange-50 text-orange-600 border-orange-200"
                                            : record.priority === "Khẩn cấp"
                                              ? "bg-red-50 text-red-600 border-red-200"
                                              : "bg-slate-50 text-slate-500 border-slate-200",
                                        )}
                                      >
                                        {record.priority}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {record.deadline && (
                                  <div
                                    className={cn(
                                      "flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-1 rounded",
                                      isOverdue(record.deadline, record.status)
                                        ? "text-red-700 bg-red-50 font-bold"
                                        : "text-orange-600 bg-orange-50",
                                    )}
                                  >
                                    {isOverdue(
                                      record.deadline,
                                      record.status,
                                    ) ? (
                                      <AlertCircle
                                        size={12}
                                        className="text-red-600 animate-pulse"
                                      />
                                    ) : (
                                      <Clock size={12} />
                                    )}
                                    <span>
                                      {formatDisplayDate(record.deadline)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 mt-1">
                                  <div
                                    className="flex items-center gap-2"
                                    title={
                                      record.mainAssignee || "Chưa phân công"
                                    }
                                  >
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] border border-slate-200 shadow-sm">
                                      {record.mainAssignee
                                        ? record.mainAssignee
                                            .charAt(0)
                                            .toUpperCase()
                                        : "?"}
                                    </div>
                                    <span className="font-medium truncate max-w-[120px]">
                                      {record.mainAssignee || "Chưa phân công"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {statusRecords.length === 0 && (
                            <div className="border-2 border-dashed border-slate-200 rounded-lg h-24 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-50/50">
                              {language === "vi" ? "Trống" : "Empty"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Grid Pagination Controls */}
          {viewMode === "grid" && renderLoadMoreControls?.()}
          </div>
        </div>
      )}

      {showAddRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 font-serif">
                  {editingRecord ? "Cập nhật hồ sơ" : "Báo cáo chi tiết hồ sơ"}
                </h2>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <span>
                    Mã hồ sơ:{" "}
                    <span className="font-medium text-slate-700">
                      {formData.id || "---"}
                    </span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Mã hệ thống:{" "}
                    <span className="font-medium text-slate-700">
                      {formData.systemId || "---"}
                    </span>
                  </span>
                </div>
                <div className="text-lg font-medium text-slate-800 mt-2">
                  {formData.title || "---"}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddRecord(false);
                  setEditingRecord(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-all duration-300 active:scale-95"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {/* THÔNG TIN CHUNG */}
              <ERPRecordBasicInfo
                formData={formData}
                setFormData={setFormData}
                caseTypes={caseTypes}
                globalRecordTypes={globalRecordTypes || []}
                dynamicBranchOptions={dynamicBranchOptions}
                dynamicManagerOptions={dynamicManagerOptions}
                dynamicAssigneeOptions={dynamicAssigneeOptions}
                STATUS_OPTIONS={STATUS_OPTIONS}
                PRIORITY_OPTIONS={PRIORITY_OPTIONS}
                ROLE_OPTIONS={ROLE_OPTIONS}
                GENDER_OPTIONS={GENDER_OPTIONS}
                records={records}
                editingRecord={editingRecord}
              />

              <ERPRecordContractInfo
                formData={formData}
                setFormData={setFormData}
                dynamicUserAccountOptions={dynamicUserAccountOptions}
                dynamicAssigneeOptions={dynamicAssigneeOptions}
                records={records}
                setSelectedContractType={setSelectedContractType}
                setShowContractDetailsModal={setShowContractDetailsModal}
              />

              <ERPRecordWorkContent
                formData={formData}
                setFormData={setFormData}
                dynamicAssigneeOptions={dynamicAssigneeOptions}
                STATUS_OPTIONS={STATUS_OPTIONS}
              />

              <ERPRecordStatusCase
                formData={formData}
                setFormData={setFormData}
                STATUS_OPTIONS={STATUS_OPTIONS}
              />

              {/* CHI TIẾT TÌNH TRẠNG HỒ SƠ */}
              <div className="space-y-4 mt-8">
                <div className="border-b border-slate-300 pb-2 flex items-center flex-wrap gap-1">
                  <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] uppercase">
                    Chi tiết tình trạng hồ sơ -{" "}
                  </h3>
                  <div className="relative inline-block">
                    <span className="text-lg font-bold text-[var(--color-primary)] uppercase hover:underline cursor-pointer flex items-center gap-1">
                      {formData.procedureStep
                        ? formData.procedureStep
                        : formData.status
                          ? formData.status
                          : "ĐANG XỬ LÝ"}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                    <select
                      value={formData.procedureStep || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          procedureStep: e.target.value,
                        })
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      <option value="" disabled>
                        {formData.status
                          ? formData.status.toUpperCase()
                          : "ĐANG XỬ LÝ"}
                      </option>
                      {STEP_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <ERPRecordCaseDetails
                  formData={formData}
                  setFormData={setFormData}
                />
              </div>

              

              <ERPRecordDocumentSections
                formData={formData}
                setFormData={setFormData}
                language={language}
                viewingRecord={viewingRecord}
                user={user}
                myPermissions={myPermissions}
                unlockRequests={unlockRequests || []}
                fetchUnlockRequests={fetchUnlockRequests}
                api={api}
                handleUpdateReport={handleUpdateReport}
                handleDownloadAttachment={handleDownloadAttachment}
                isDossierReportLocked={isDossierReportLocked}
              />
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0 bg-slate-50">
              <button
                onClick={() => {
                  setShowAddRecord(false);
                  setEditingRecord(null);
                }}
                className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg transition-all duration-300 hover:bg-white font-medium transition-all duration-300 active:scale-95"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={isSubmittingRecord}
                className={`px-6 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-300 active:scale-95 flex items-center gap-2 ${isSubmittingRecord ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Check size={18} />
                {isSubmittingRecord ? (language === "vi" ? "Đang lưu..." : "Saving...") : t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <ERPDeleteConfirmModal
        language={language}
        showDeleteConfirm={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => {
          if (showDeleteConfirm) {
            handleDelete(showDeleteConfirm);
          }
        }}
        t={t}
      />

      {showContractDetailsModal && (
        <ERPContractDetailsModal
          formData={formData}
          language={language}
          selectedContractType={selectedContractType}
          viewingRecord={viewingRecord}
          handleCloseContractDetails={handleCloseContractDetails}
          handleContractDetailsChange={handleContractDetailsChange}
        />
      )}

      <ERPAIAnalysisModal
        showAIModal={showAIModal}
        selectedRecord={selectedRecord}
        viewingRecord={viewingRecord}
        language={language}
        t={t}
        isAnalyzing={isAnalyzing}
        aiAnalysisResult={aiAnalysisResult}
        onClose={() => setShowAIModal(false)}
      />

      <ERPChatModals
        showChatModal={showChatModal}
        showInternalChatModal={showInternalChatModal}
        selectedRecord={selectedRecord}
        viewingRecord={viewingRecord}
        users={users || []}
        user={user}
        language={language}
        onCloseChat={() => setShowChatModal(false)}
        onCloseInternalChat={() => setShowInternalChatModal(false)}
      />
      {showCccdScanner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl">
            <CccdOcrScanner
              language={language}
              user={user}
              onClose={() => setShowCccdScanner(false)}
              onSave={async (recordPayload: any, isDraft: boolean) => {
                const newId = "HS-" + Date.now().toString().slice(-6);
                const completeRecord = {
                  ...recordPayload,
                  id: newId,
                  systemId: "SYS-" + Date.now().toString().slice(-6),
                };
                
                try {
                  await api.req("/api/erp-records", "POST", { id: newId, data: completeRecord, createOnly: true });
                  
                  if (!isDraft && Number(recordPayload.feeAmount) > 0) {
                    await fetch("/api/finance/transactions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: "thu",
                        amount: Number(recordPayload.feeAmount),
                        category: "Phí dịch vụ",
                        description: `Ghi nhận doanh thu từ hồ sơ quét CCCD ${newId}: ${recordPayload.title}`,
                        date: new Date().toISOString().split("T")[0]
                      })
                    });
                  }
                  
                  const currentRecords = await api.req("/api/erp-records");
                  updateRecords(currentRecords);
                  
                  setShowCccdScanner(false);
                  alert(
                    language === "vi"
                      ? (isDraft ? "Đã lưu nháp hồ sơ thành công! Đề nghị sớm hoàn thành hồ sơ mới để tính hoa hồng." : "Đã hạch toán & Tạo hồ sơ mới thành công!")
                      : (isDraft ? "Draft saved successfully! Please complete it to qualify for commissions." : "Dossier created & recorded successfully!")
                  );
                } catch (e) {
                  console.error(e);
                  alert("Có lỗi xảy ra khi lưu hồ sơ.");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Global Yeastar Dialer Trigger Button */}
      <button
        onClick={() => setShowYeastar(!showYeastar)}
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all duration-300 group cursor-pointer border-2 border-white/85"
        title={language === "vi" ? "Mở bàn phím tổng đài" : "Open Softphone"}
      >
        <span className="absolute inset-0 rounded-full border-4 border-emerald-400/40 animate-ping opacity-40 group-hover:scale-110 transition-transform"></span>
        <Phone size={24} className="fill-white" />
      </button>

      {/* Draggable Yeastar Softphone Panel */}
      {showYeastar && (
        <div 
          style={{
            position: "fixed",
            left: `${yeastarPosition.x}px`,
            top: `${yeastarPosition.y}px`,
            zIndex: 9999,
          }}
          className="shadow-2xl rounded-3xl select-none"
          onMouseDown={handleMouseDownYeastar}
        >
          <YeastarSoftphone language={language} user={user} onClose={() => setShowYeastar(false)} />
        </div>
      )}
    </div>
  );
}

function StatisticsView({
  language,
  user,
  records,
  events,
  myPermissions,
}: {
  language: "vi" | "en";
  user?: any;
  records: any[];
  events: any[];
  myPermissions?: any;
}) {
  return (
    <EnhancedStatisticsView
      language={language}
      user={user}
      records={records}
      events={events}
      myPermissions={myPermissions}
    />
  );
}

function ReportsView({
  language,
  user,
  records,
  events,
  users,
  myPermissions,
  selectedReport,
  setSelectedReport,
  onOpenContractDetails,
}: {
  language: "vi" | "en";
  user?: any;
  records?: any[];
  events?: any[];
  users?: any[];
  myPermissions?: any;
  selectedReport: string | null;
  setSelectedReport: (value: string | null) => void;
  onOpenContractDetails?: (record: any, type?: "HĐDVPL" | "HĐUQ") => void;
}) {
  const reportCards = [
    { key: "revenue", label: language === "vi" ? "Doanh thu" : "Revenue", icon: BarChart3, accent: "blue" },
    { key: "contracts", label: language === "vi" ? "Hợp đồng" : "Contracts", icon: FileSignature, accent: "amber" },
    { key: "customers", label: language === "vi" ? "Khách hàng" : "Customers", icon: PieChart, accent: "orange" },
    { key: "reward", label: language === "vi" ? "Khen thưởng" : "Rewards", icon: Award, accent: "rose" },
    { key: "hr", label: language === "vi" ? "Nhân sự" : "HR", icon: Users, accent: "emerald" },
    { key: "events", label: language === "vi" ? "Sự kiện" : "Events", icon: CalendarDays, accent: "sky" },
    { key: "performance", label: language === "vi" ? "Hiệu suất" : "Performance", icon: Clock, accent: "red" },
    { key: "general", label: language === "vi" ? "Tổng quát" : "General", icon: Globe, accent: "indigo" },
    { key: "records", label: language === "vi" ? "Hồ sơ" : "Records", icon: FileText, accent: "purple" },
  ];

  const safeRecords = records || [];
  const safeEvents = events || [];
  const totalRecordCount = safeRecords.length;
  const totalEventCount = safeEvents.length;
  const activeCount = safeRecords.filter((record) => {
    const status = String(record?.status || "");
    return !status.toLowerCase().includes("hoàn thành") && !status.toLowerCase().includes("completed");
  }).length;
  const completionRate = totalRecordCount > 0 ? Math.round((safeRecords.filter((record) => {
    const status = String(record?.status || "");
    return status.toLowerCase().includes("hoàn thành") || status.toLowerCase().includes("completed");
  }).length / totalRecordCount) * 100) : 0;

  if (selectedReport) {
    const reportMeta = reportCards.find((item) => item.key === selectedReport) || reportCards[0];
    const Icon = reportMeta.icon;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedReport(null)}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg transition-all duration-300 hover:bg-slate-200 active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-150 flex items-center justify-center shrink-0 text-slate-700">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 font-serif">
                  {reportMeta.label}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  {language === "vi" ? "Tổng quan báo cáo chi tiết" : "Detailed report overview"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }} className="bg-white rounded-2xl border border-slate-150 p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === "vi" ? "Tổng hồ sơ" : "Total records"}
            </h4>
            <div className="text-2xl font-black text-slate-850 font-mono">{totalRecordCount}</div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }} className="bg-white rounded-2xl border border-slate-150 p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === "vi" ? "Đang xử lý" : "In progress"}
            </h4>
            <div className="text-2xl font-black text-slate-850 font-mono">{activeCount}</div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }} className="bg-white rounded-2xl border border-slate-150 p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {language === "vi" ? "Tỷ lệ hoàn thành" : "Completion rate"}
            </h4>
            <div className="text-2xl font-black text-slate-850 font-mono">{completionRate}%</div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-2xl border border-slate-150 p-6 min-h-[260px] shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" />
              {language === "vi" ? "Dữ liệu báo cáo" : "Report data"}
            </h4>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm text-slate-600">
                {language === "vi"
                  ? `Báo cáo ${reportMeta.label.toLowerCase()} đang được đồng bộ với dữ liệu ERP hiện tại.`
                  : `${reportMeta.label} report is synchronized with the current ERP data.`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                  {language === "vi" ? "Hồ sơ" : "Records"}
                </div>
                <div className="text-3xl font-black text-slate-800">{totalRecordCount}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                  {language === "vi" ? "Sự kiện" : "Events"}
                </div>
                <div className="text-3xl font-black text-slate-800">{totalEventCount}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 font-serif">
            {language === "vi" ? "Báo cáo & Thống kê" : "Reports & Statistics"}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {reportCards.map((report, index) => {
          const Icon = report.icon;
          const accentMap: Record<string, string> = {
            blue: "from-blue-500 to-cyan-500 text-blue-600",
            amber: "from-amber-500 to-orange-500 text-amber-600",
            orange: "from-orange-500 to-red-500 text-orange-600",
            rose: "from-rose-500 to-purple-500 text-rose-600",
            emerald: "from-emerald-500 to-teal-500 text-emerald-600",
            sky: "from-sky-500 to-indigo-500 text-sky-600",
            red: "from-red-500 to-pink-500 text-red-600",
            indigo: "from-indigo-500 to-purple-500 text-indigo-600",
            purple: "from-purple-500 to-fuchsia-500 text-purple-600",
          };

          return (
            <motion.div
              key={report.key}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              onClick={() => setSelectedReport(report.key)}
              className="group bg-white rounded-2xl border border-slate-150 p-6 hover:shadow-md cursor-pointer flex flex-col h-full transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-linear-to-tr ${accentMap[report.accent]} flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-105 transition-all duration-300 shrink-0`}>
                <Icon size={22} />
              </div>
              <h4 className="text-base font-bold text-slate-850 mb-2">{report.label}</h4>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed flex-1">
                {language === "vi" ? "Xem báo cáo chi tiết và xu hướng dữ liệu." : "View detailed reporting and trend data."}
              </p>
              <div className={`flex items-center font-bold text-xs mt-auto group-hover:translate-x-1 transition-transform duration-300 ${accentMap[report.accent].split(" ")[1] || "text-slate-600"}`}>
                {language === "vi" ? "Xem chi tiết" : "View details"} <ChevronRight size={14} className="ml-1 shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PermissionsView({ language }: { language: "vi" | "en" }) {
  return null;
  /*
  const [permissions, setPermissions] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.req("/api/permissions");
      const rolesToEnsure = [
        "admin",
        "director",
        "deputyDirector",
        "controller",
        "head_of_department",
        "manager",
        "prosecutor",
        "lawyer",
        "specialist",
        "accountant",
        "editor",
        "traineeLawyer",
        "intern",
      ];

      const filledData = { ...data };
      rolesToEnsure.forEach((role) => {
        if (!filledData[role]) {
          filledData[role] = {
            manageUsers: false,
            viewAllRecords: false,
            editAllRecords: false,
            deleteRecords: false,
            viewReports: false,
            manageWeb: false,
            manageFinance: false,
            viewPersonalRecords: false,
            editPersonalRecords: false,
            manageEvents: false,
            manageLegalDocs: false,
            viewEventHistory: false,
          };
        } else {
          if (filledData[role].manageEvents === undefined)
            filledData[role].manageEvents = false;
          if (filledData[role].manageLegalDocs === undefined)
            filledData[role].manageLegalDocs = false;
          if (filledData[role].viewEventHistory === undefined)
            filledData[role].viewEventHistory = false;
        }
      });

      setPermissions(filledData);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load permissions configuration from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const savePermissions = async () => {
    setSaving(true);
    try {
      await api.req("/api/permissions", "PUT", permissions);
      alert(
        language === "vi"
          ? "Đã lưu cấu hình phân quyền!"
          : "Permissions saved successfully!",
      );
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu phân quyền");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (role: string, perm: string) => {
    setPermissions((prev: any) => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [perm]: prev[role] ? !prev[role][perm] : true,
      },
    }));
  };

  const t = {
    vi: {
      title: "Trung tâm Phân quyền & Quản lý Truy cập",
      subtitle: "Quản lý vai trò và phân bổ quyền hạn cho các thành viên trong hệ thống",
      systemPermissions: "Phân quyền hệ thống",
      role: "VAI TRÒ",
      description: "MÔ TẢ",
      manageUsers: "QUẢN LÝ NGƯỜI DÙNG",
      viewAllRecords: "XEM TẤT CẢ HỒ SƠ",
      editAllRecords: "SỬA TẤT CẢ HỒ SƠ",
      deleteRecords: "XÓA HỒ SƠ",
      viewReports: "XEM BÁO CÁO",
      manageWeb: "QUẢN LÝ NỘI DUNG WEB",
      manageFinance: "QUẢN LÝ TÀI CHÍNH",
      viewPersonalRecords: "XEM HỒ SƠ CÁ NHÂN",
      editPersonalRecords: "SỬA HỒ SƠ CÁ NHÂN",
      manageEvents: "QUẢN LÝ SỰ KIỆN",
      manageLegalDocs: "QUẢN LÝ VĂN BẢN PL",
      viewEventHistory: "XEM LỊCH SỬ HĐ SỰ KIỆN",
      admin: "Quản trị viên",
      director: "Giám đốc",
      head_of_department: "Trưởng phòng",
      manager: "Quản lý",
      lawyer: "Luật sư",
      specialist: "Chuyên viên pháp lý",
      accountant: "Kế toán",
      controller: "Kiểm soát viên",
      prosecutor: "Kiểm soát chất lượng",
      editor: "Biên tập viên",
      intern: "Thực tập sinh",
      traineeLawyer: "Luật sư Tập sự",
      deputyDirector: "Phó giám đốc",
      legal_associate: "Trợ lý pháp lý",
      consultant: "Nhân viên tư vấn",
      uploader: "IT - Quản trị hồ sơ",
      user: "Người dùng",
      adminDesc: "Toàn quyền kiểm soát hệ thống",
      directorDesc: "Quản lý tổng thể, xem báo cáo và duyệt hồ sơ",
      controllerDesc: "Kiểm soát viên điều hành toàn bộ hệ thống (Supervisor)",
      head_of_departmentDesc: "Quản lý phòng ban, phê duyệt và điều phối công việc",
      managerDesc: "Quản lý hoạt động của bộ phận, phân công công việc",
      lawyerDesc: "Luật sư",
      specialistDesc: "Chuyên viên pháp lý",
      accountantDesc: "Kế toán",
      prosecutorDesc: "Kiểm soát chất lượng văn bản pháp lý (QC Specialist)",
      editorDesc: "Biên tập viên",
      internDesc: "Thực tập sinh",
      traineeLawyerDesc: "Luật sư Tập sự",
      deputyDirectorDesc: "Phó giám đốc",
      legal_associateDesc: "Trợ lý pháp lý",
      consultantDesc: "Nhân viên tư vấn",
      uploaderDesc: "IT - Quản trị hồ sơ",
      userDesc: "Người dùng",
    },
    en: {
      title: "Permissions & Access Control Center",
      subtitle: "Manage roles and allocate permissions for system members",
      systemPermissions: "System Permissions",
      role: "ROLE",
      description: "DESCRIPTION",
      manageUsers: "MANAGE USERS",
      viewAllRecords: "VIEW ALL RECORDS",
      editAllRecords: "EDIT ALL RECORDS",
      deleteRecords: "DELETE RECORDS",
      viewReports: "VIEW REPORTS",
      manageWeb: "MANAGE WEB CONTENT",
      manageFinance: "MANAGE FINANCES",
      viewPersonalRecords: "VIEW PERSONAL RECORDS",
      editPersonalRecords: "EDIT PERSONAL RECORDS",
      manageEvents: "MANAGE EVENTS",
      manageLegalDocs: "MANAGE LEGAL DOCS",
      viewEventHistory: "VIEW EVENT HISTORY",
      admin: "Administrator",
      director: "Director",
      head_of_department: "Head of Department",
      manager: "Manager",
      lawyer: "Lawyer",
      specialist: "Legal Specialist",
      accountant: "Accountant",
      controller: "Workflow Inspector / Supervisor",
      prosecutor: "QC Specialist",
      editor: "Editor",
      intern: "Intern",
      traineeLawyer: "Trainee Lawyer",
      deputyDirector: "Deputy Director",
      legal_associate: "Legal Assistant",
      consultant: "Consultant",
      uploader: "Document Administrator",
      user: "User",
      adminDesc: "Full system control",
      directorDesc: "Overall management, view reports and approve records",
      controllerDesc: "Oversight of entire system workflow, SLA metrics & authorizations",
      head_of_departmentDesc: "Manage department, approve and coordinate tasks",
      managerDesc: "Manage department activities, assign tasks",
      lawyerDesc: "Lawyer",
      specialistDesc: "Legal Specialist",
      accountantDesc: "Accountant",
      prosecutorDesc: "Quality control, review legal text and blacklist compliance",
      editorDesc: "Editor",
      internDesc: "Intern",
      traineeLawyerDesc: "Trainee Lawyer",
      deputyDirectorDesc: "Deputy Director",
      legal_associateDesc: "Legal Assistant",
      consultantDesc: "Consultant",
      uploaderDesc: "Document Administrator",
      userDesc: "User",
    },
  }[language];

  const renderIcon = (
    role: keyof typeof permissions,
    perm: keyof (typeof permissions)["admin"],
  ) => {
    const hasPermission = permissions[role] ? permissions[role][perm] : false;
    return (
      <button
        onClick={() => togglePermission(role as string, perm as string)}
        className="focus:outline-none transition-transform hover:scale-110"
      >
        {hasPermission ? (
          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500 bg-green-50">
            <Check size={14} strokeWidth={3} />
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-6 h-6 text-slate-300 hover:text-slate-400">
            <X size={18} strokeWidth={2.5} />
          </div>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RefreshCw
          className="animate-spin inline-block mx-auto mb-2 text-[var(--color-primary)]"
          size={32}
        />
        <br />
        <span className="font-semibold text-sm">
          {language === "vi"
            ? "Đang tải thông tin phân quyền..."
            : "Loading permissions..."}
        </span>
      </div>
    );
  }

  if (error || !permissions || Object.keys(permissions).length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl max-w-lg mx-auto my-12 shadow-sm animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 font-serif">
          {language === "vi" ? "Không thể tải phân quyền" : "Failed to load permissions"}
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {error || (language === "vi" ? "Đã xảy ra lỗi kết nối với máy chủ hoặc bảng phân quyền chưa được tạo." : "A connection error occurred or permissions table is empty.")}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              const defaultPerms: any = {};
              const rolesToEnsure = [
                "admin", "director", "deputyDirector", "controller", "head_of_department",
                "manager", "prosecutor", "lawyer", "specialist", "legal_associate", "accountant",
                "editor", "traineeLawyer", "intern", "consultant", "uploader", "user"
              ];
              rolesToEnsure.forEach(role => {
                defaultPerms[role] = {
                  manageUsers: role === "admin" || role === "director" || role === "controller",
                  viewAllRecords: ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager", "prosecutor", "lawyer"].includes(role),
                  editAllRecords: ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager"].includes(role),
                  deleteRecords: ["admin", "director", "controller"].includes(role),
                  viewReports: ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager", "accountant"].includes(role),
                  manageWeb: role === "admin" || role === "director" || role === "controller",
                  manageFinance: role === "admin" || role === "director" || role === "controller" || role === "accountant",
                  viewPersonalRecords: true,
                  editPersonalRecords: true,
                  manageEvents: ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager"].includes(role),
                  manageLegalDocs: ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager", "prosecutor", "lawyer"].includes(role),
                  viewEventHistory: true,
                };
              });
              setPermissions(defaultPerms);
              setError(null);
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition"
          >
            {language === "vi" ? "Dùng cấu hình mặc định" : "Use default settings"}
          </button>
          <button
            onClick={() => loadPermissions()}
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-semibold rounded-lg text-sm transition shadow-sm"
          >
            {language === "vi" ? "Thử lại" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-serif">
              {t.title}
            </h2>
            <p className="text-slate-500">{t.subtitle}</p>
          </div>
        </div>
        <button
          onClick={savePermissions}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white px-4 py-2 rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-50 font-medium self-start md:self-auto"
        >
          {saving ? (
            <RefreshCw className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {language === "vi" ? "Lưu cấu hình" : "Save Config"}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
            <Users size={20} />
          </div>
          <h4 className="text-xl font-bold text-slate-800 font-serif">
            {t.systemPermissions}
          </h4>
        </div>

        <div className="overflow-auto max-h-[70vh] p-0 custom-scrollbar touch-pan-x relative bg-white">
          <table className="w-full min-w-max text-left text-sm border-collapse">
            <thead className="sticky top-0 z-20 bg-white">
              <tr className="shadow-[0_1px_0_0_#e2e8f0]">
                <th className="sticky left-0 top-0 z-40 bg-slate-50 px-6 py-4 font-bold text-slate-700 text-left text-xs leading-tight w-48 min-w-[12rem] max-w-[12rem] shadow-[inset_-1px_0_0_0_#e2e8f0,0_1px_0_0_#e2e8f0]">
                  {t.role}
                </th>
                <th className="sticky left-48 top-0 z-40 bg-slate-50 px-6 py-4 font-bold text-slate-700 text-left text-xs leading-tight w-64 min-w-[16rem] max-w-[16rem] shadow-[inset_-1px_0_0_0_#e2e8f0,0_1px_0_0_#e2e8f0]">
                  {t.description}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.manageUsers}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.manageWeb}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.manageEvents}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.manageFinance}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.manageLegalDocs}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.editPersonalRecords}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.editAllRecords}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.viewReports}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.viewPersonalRecords}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.viewEventHistory}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.viewAllRecords}
                </th>
                <th className="px-2 py-4 bg-white font-bold text-slate-700 text-center text-xs leading-tight min-w-[120px] max-w-[140px] border-l border-slate-100 whitespace-normal">
                  {t.deleteRecords}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[
                "admin",
                "director",
                "deputyDirector",
                "controller",
                "head_of_department",
                "manager",
                "lawyer",
                "specialist",
                "legal_associate",
                "accountant",
                "prosecutor",
                "editor",
                "traineeLawyer",
                "intern",
                "consultant",
                "uploader",
                "user",
              ].map(role => (
              <tr key={role} className="group hover:bg-slate-50/50 transition-all duration-300">
                <td className="sticky left-0 z-30 bg-white group-hover:bg-slate-50/50 px-6 py-6 font-bold text-slate-800 w-48 min-w-[12rem] max-w-[12rem] shadow-[inset_-1px_0_0_0_#e2e8f0]">
                  {(t as any)[role]}
                </td>
                <td className="sticky left-48 z-30 bg-white group-hover:bg-slate-50/50 px-6 py-6 text-slate-600 font-medium w-64 min-w-[16rem] max-w-[16rem] shadow-[inset_-1px_0_0_0_#e2e8f0] whitespace-normal">
                  {(t as any)[role + 'Desc'] || ''}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "manageUsers")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "manageWeb")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "manageEvents")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "manageFinance")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "manageLegalDocs")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "editPersonalRecords")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "editAllRecords")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "viewReports")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "viewPersonalRecords")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "viewEventHistory")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "viewAllRecords")}
                </td>
                <td className="px-2 py-6 text-center shadow-[inset_1px_0_0_0_#f1f5f9] whitespace-nowrap min-w-[120px] max-w-[140px]">
                  {renderIcon(role, "deleteRecords")}
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

  */
}

function RecordTypesView({
  language,
  myPermissions,
  setActiveTab: setParentActiveTab,
  setSelectedCategory,
  records = [],
}: {
  language: "vi" | "en";
  myPermissions?: any;
  setActiveTab?: (tab: string) => void;
  setSelectedCategory?: (category: string) => void;
  records?: any[];
}) {
  const [showAddType, setShowAddType] = useState(false);
  const [recordTypes, setRecordTypes] = useState<any[]>([]);
  const [editingType, setEditingType] = useState<any>(null);
  const [selectedTypeForDetail, setSelectedTypeForDetail] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "core">("all");
  const [formData, setFormData] = useState({
    type_code: "",
    type_name: "",
    description: "",
    display_color: "bg-blue-500",
  });

  const loadRecordTypes = async () => {
    try {
      const data = await api.req("/api/record-types");
      setRecordTypes(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRecordTypes();
  }, []);

  const handleEdit = (type: any) => {
    setEditingType(type);
    setFormData({
      type_code: type.type_code,
      type_name: type.type_name,
      description: type.description,
      display_color: type.display_color,
    });
    setShowAddType(true);
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (editingType) {
        await api.req(`/api/record-types/${editingType.id}`, "PUT", {
          ...formData,
          active: editingType.active,
        });
      } else {
        await api.req("/api/record-types", "POST", formData);
      }
      setShowAddType(false);
      setEditingType(null);
      setFormData({
        type_code: "",
        type_name: "",
        description: "",
        display_color: "bg-blue-500",
      });
      loadRecordTypes();
    } catch (e) {
      console.error(e);
      alert(language === "vi" ? "Có lỗi xảy ra" : "Error saving record type");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.req(`/api/record-types/${itemToDelete}`, "DELETE");
      loadRecordTypes();
      setItemToDelete(null);
    } catch (e) {
      console.error(e);
      alert(
        language === "vi"
          ? "Có lỗi xảy ra khi xóa"
          : "Error deleting record type",
      );
    }
  };

  const closeForm = () => {
    setShowAddType(false);
    setEditingType(null);
    setFormData({
      type_code: "",
      type_name: "",
      description: "",
      display_color: "bg-blue-500",
    });
  };

  const now = new Date();
  const currentDateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  const t = {
    vi: {
      title: "Loại hồ sơ",
      subtitle: currentDateStr,
      manageRecordTypes: "Quản lý loại hồ sơ",
      addRecordType: "Thêm loại hồ sơ",
      editRecordType: "Sửa loại hồ sơ",
      cancel: "Hủy",
      add: "Thêm",
      save: "Lưu",
      typeCode: "Mã loại",
      typeCodePlaceholder: "VD: TV, HS, DS...",
      typeName: "Tên loại hồ sơ",
      typeNamePlaceholder: "Nhập tên loại hồ sơ",
      description: "Mô tả",
      descriptionPlaceholder: "Nhập mô tả chi tiết",
      displayColor: "Màu sắc hiển thị",
      systemCode: "Mã hệ thống",
      active: "Đang hoạt động",
      deleteConfirmTitle: "Xóa loại hồ sơ",
      deleteConfirmDesc:
        "Bạn có chắc chắn muốn xóa loại hồ sơ này? Hành động này không thể hoàn tác.",
      yes: "Có (Yes)",
      no: "Không (No)",
    },
    en: {
      title: "Record Types",
      subtitle: currentDateStr,
      manageRecordTypes: "Manage Record Types",
      addRecordType: "Add Record Type",
      editRecordType: "Edit Record Type",
      cancel: "Cancel",
      add: "Add",
      save: "Save",
      typeCode: "Type Code",
      typeCodePlaceholder: "Ex: TV, HS, DS...",
      typeName: "Record Type Name",
      typeNamePlaceholder: "Enter record type name",
      description: "Description",
      descriptionPlaceholder: "Enter detailed description",
      displayColor: "Display Color",
      systemCode: "System Code",
      active: "Active",
      deleteConfirmTitle: "Delete Record Type",
      deleteConfirmDesc:
        "Are you sure you want to delete this record type? This action cannot be undone.",
      yes: "Yes",
      no: "No",
    },
  }[language];

  const getColorClasses = (colorClass: string) => {
    const colorMap: any = {
      "bg-blue-500": { bg: "bg-blue-100", text: "text-blue-700" },
      "bg-rose-500": { bg: "bg-[rgb(255,228,230)]", text: "text-rose-700" },
      "bg-orange-500": { bg: "bg-[#ffedd5]", text: "text-orange-700" },
      "bg-pink-500": { bg: "bg-pink-100", text: "text-pink-700" },
      "bg-purple-500": { bg: "bg-[#f3e8ff]", text: "text-purple-700" },
      "bg-emerald-500": { bg: "bg-[#d1fae5]", text: "text-emerald-700" },
      "bg-amber-500": { bg: "bg-[#fef3c7]", text: "text-amber-700" },
      "bg-indigo-500": { bg: "bg-[#e0e7ff]", text: "text-indigo-700" },
      "bg-gray-500": { bg: "bg-[#f1f5f9]", text: "text-slate-700" },
    };
    return (
      colorMap[colorClass] || { bg: "bg-slate-100", text: "text-slate-700" }
    );
  };

  const getCardStyle = (colorClass: string, code: string, name: string) => {
    const lowerCode = (code || "").toLowerCase();
    const lowerName = (name || "").toLowerCase();
    
    let icon = FolderOpen;
    if (lowerCode === "ds" || lowerName.includes("dân sự")) {
      icon = Scale;
    } else if (lowerCode === "hc" || lowerName.includes("hành chính")) {
      icon = FileCheck;
    } else if (lowerCode === "hs" || lowerName.includes("hình sự")) {
      icon = Shield;
    } else if (lowerCode === "hngđ" || lowerName.includes("hôn nhân") || lowerName.includes("gia đình")) {
      icon = Users;
    } else if (lowerCode === "kdtm" || lowerName.includes("kinh doanh") || lowerName.includes("thương mại")) {
      icon = DollarSign;
    } else if (lowerCode === "lđ" || lowerName.includes("lao động")) {
      icon = Briefcase;
    } else if (lowerCode === "tv" || lowerName.includes("tư vấn")) {
      icon = MessageSquare;
    } else if (lowerCode === "đđ" || lowerName.includes("đất đai") || lowerName.includes("bất động sản")) {
      icon = MapPin;
    } else if (lowerCode === "dn" || lowerName.includes("doanh nghiệp") || lowerName.includes("đầu tư")) {
      icon = Building2;
    }

    const colorMap: any = {
      "bg-blue-500": {
        bgGradient: "from-blue-500 to-indigo-500 shadow-blue-100",
        accentColor: "text-blue-600",
        hoverBorder: "hover:border-blue-200",
        badgeBg: "bg-blue-50 text-blue-600 border-blue-100"
      },
      "bg-rose-500": {
        bgGradient: "from-rose-500 to-pink-600 shadow-rose-100",
        accentColor: "text-rose-600",
        hoverBorder: "hover:border-rose-200",
        badgeBg: "bg-rose-50 text-rose-600 border-rose-100"
      },
      "bg-orange-500": {
        bgGradient: "from-amber-500 to-orange-500 shadow-orange-100",
        accentColor: "text-orange-600",
        hoverBorder: "hover:border-orange-200",
        badgeBg: "bg-orange-50 text-orange-600 border-orange-100"
      },
      "bg-pink-500": {
        bgGradient: "from-pink-500 to-purple-500 shadow-pink-100",
        accentColor: "text-pink-600",
        hoverBorder: "hover:border-pink-200",
        badgeBg: "bg-pink-50 text-pink-600 border-pink-100"
      },
      "bg-purple-500": {
        bgGradient: "from-purple-500 to-indigo-600 shadow-purple-100",
        accentColor: "text-purple-600",
        hoverBorder: "hover:border-purple-200",
        badgeBg: "bg-purple-50 text-purple-600 border-purple-100"
      },
      "bg-emerald-500": {
        bgGradient: "from-emerald-500 to-teal-500 shadow-emerald-100",
        accentColor: "text-emerald-600",
        hoverBorder: "hover:border-emerald-200",
        badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-100"
      },
      "bg-amber-500": {
        bgGradient: "from-amber-500 to-yellow-500 shadow-amber-100",
        accentColor: "text-amber-600",
        hoverBorder: "hover:border-amber-200",
        badgeBg: "bg-amber-50 text-amber-600 border-amber-100"
      },
      "bg-indigo-500": {
        bgGradient: "from-indigo-500 to-blue-600 shadow-indigo-100",
        accentColor: "text-indigo-600",
        hoverBorder: "hover:border-indigo-200",
        badgeBg: "bg-indigo-50 text-indigo-600 border-indigo-100"
      },
      "bg-gray-500": {
        bgGradient: "from-slate-400 to-slate-600 shadow-slate-100",
        accentColor: "text-slate-600",
        hoverBorder: "hover:border-slate-300",
        badgeBg: "bg-slate-100 text-slate-600 border-slate-200"
      },
    };

    let colorKey = colorClass;
    if (!colorMap[colorKey]) {
      if (lowerCode === "ds" || lowerName.includes("dân sự")) {
        colorKey = "bg-orange-500";
      } else if (lowerCode === "hc" || lowerName.includes("hành chính")) {
        colorKey = "bg-blue-500";
      } else if (lowerCode === "hs" || lowerName.includes("hình sự")) {
        colorKey = "bg-rose-500";
      } else if (lowerCode === "hngđ" || lowerName.includes("hôn nhân") || lowerName.includes("gia đình")) {
        colorKey = "bg-pink-500";
      } else if (lowerCode === "kdtm" || lowerName.includes("kinh doanh") || lowerName.includes("thương mại")) {
        colorKey = "bg-purple-500";
      } else if (lowerCode === "lđ" || lowerName.includes("lao động")) {
        colorKey = "bg-emerald-500";
      } else if (lowerCode === "đđ" || lowerName.includes("đất đai") || lowerName.includes("bất động sản")) {
        colorKey = "bg-amber-500";
      } else if (lowerCode === "dn" || lowerName.includes("doanh nghiệp") || lowerName.includes("đầu tư")) {
        colorKey = "bg-indigo-500";
      } else if (lowerCode === "tv" || lowerName.includes("tư vấn")) {
        colorKey = "bg-blue-500";
      } else {
        colorKey = "bg-blue-500";
      }
    }

    return {
      icon,
      ...(colorMap[colorKey] || colorMap["bg-blue-500"])
    };
  };

  const filteredRecordTypes = useMemo(() => {
    return recordTypes.filter((type) => {
      if (activeTab === "active") return type.active === 1;
      if (activeTab === "core") {
        const c = (type.type_code || "").toUpperCase();
        return ["DS", "HC", "HS", "HNGĐ", "KDTM", "LĐ", "TV", "ĐĐ", "DN"].includes(c);
      }
      return true;
    });
  }, [recordTypes, activeTab]);

  return (
    <div className="space-y-6">
      {itemToDelete && (
        <div
          style={{ zIndex: 999999 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 custom-scrollbar"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">
              <h3 className="text-2xl font-bold font-serif text-[var(--color-text-dark)] mb-4">
                {t.deleteConfirmTitle}
              </h3>
              <p className="text-gray-700 text-lg">{t.deleteConfirmDesc}</p>
            </div>

            <div className="flex gap-4 p-6 justify-center">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg transition-all duration-300 hover:bg-gray-50 transition-all duration-300 active:scale-95"
              >
                {t.no}
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg transition-all duration-300 hover:bg-red-700 transition-all duration-300 active:scale-95 flex items-center gap-2"
              >
                <Trash2 size={18} /> {t.yes}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 font-serif">
            {t.title}
          </h3>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-white via-slate-50/50 to-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <FileType size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                  {language === "vi" ? "DANH SÁCH LOẠI HỒ SƠ" : "RECORD TYPES LIST"}
                </h4>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                  {language === "vi" ? "Cấu hình phân loại hệ thống" : "System classification config"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddType(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_200%] hover:bg-[100%_0] transition-all duration-500 shadow-lg shadow-indigo-100 hover:shadow-indigo-200 text-white rounded-2xl font-bold text-sm tracking-wide active:scale-95 transform"
            >
              <Plus size={18} />
              {t.addRecordType}
            </button>
          </div>

          {/* Image 3 Inspired Filter Tab Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/40 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === "all"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                {language === "vi" ? "Tất cả loại hồ sơ" : "All record types"}
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === "active"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                {language === "vi" ? "Đang hoạt động" : "Active only"}
              </button>
              <button
                onClick={() => setActiveTab("core")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === "core"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                {language === "vi" ? "Phân loại chính" : "Core categories"}
              </button>
            </div>
            
            <div className="text-right hidden md:block">
              <span className="text-[11px] font-bold tracking-widest text-slate-400 font-mono">
                LAWFIRM ERP CATEGORIES
              </span>
            </div>
          </div>
        </div>

        {showAddType && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all duration-300 animate-in fade-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {editingType ? t.editRecordType : t.addRecordType}
                </h3>
                <button
                  onClick={closeForm}
                  className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1.5 rounded-full border border-slate-200/60 shadow-sm transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {t.typeCode}
                  </label>
                  <input
                    type="text"
                    value={formData.type_code}
                    onChange={(e) =>
                      setFormData({ ...formData, type_code: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                    placeholder={t.typeCodePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {t.typeName}
                  </label>
                  <input
                    type="text"
                    value={formData.type_name}
                    onChange={(e) =>
                      setFormData({ ...formData, type_name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                    placeholder={t.typeNamePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {t.description}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                    rows={3}
                    placeholder={t.descriptionPlaceholder}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {t.displayColor}
                  </label>
                  <div className="flex gap-2.5 pt-1">
                    {[
                      "bg-blue-500",
                      "bg-rose-500",
                      "bg-orange-500",
                      "bg-pink-500",
                      "bg-purple-500",
                      "bg-emerald-500",
                      "bg-gray-500",
                    ].map((color, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setFormData({ ...formData, display_color: color })
                        }
                        className={`w-8 h-8 rounded-full ${color} border-2 ${formData.display_color === color ? "border-slate-800 scale-110 ring-4 ring-slate-100" : "border-white hover:scale-110"} shadow-md transition-all`}
                      ></button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button
                  onClick={closeForm}
                  className="px-4 py-2.5 text-slate-600 text-sm font-bold bg-white border border-slate-200 rounded-xl transition-all hover:bg-slate-50 active:scale-95"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={!formData.type_code || !formData.type_name}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-100 text-white text-sm font-bold transition-all rounded-xl active:scale-95 disabled:opacity-50"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic List Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/20">
          {filteredRecordTypes.map((type) => {
            const style = getCardStyle(type.display_color, type.type_code, type.type_name);
            const IconComponent = style.icon;
            
            return (
              <div
                key={type.id}
                className={`group relative bg-white border border-slate-100 rounded-[28px] p-7 flex flex-col justify-between h-full hover:shadow-xl hover:shadow-indigo-50/20 hover:scale-[1.02] ${style.hoverBorder} transition-all duration-300`}
              >
                <div>
                  {/* Card Header: Icon Badge & Edit/Delete Actions */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.bgGradient} shadow-md flex items-center justify-center text-white transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <IconComponent size={24} />
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {(!myPermissions || myPermissions.manageWeb) && (
                        <>
                          <button
                            onClick={() => handleEdit(type)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setItemToDelete(type.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <h5 className="text-lg font-black text-slate-800 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                    {type.type_name}
                  </h5>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-3">
                    {type.description || (language === "vi" ? "Chưa có mô tả chi tiết cho loại hồ sơ này." : "No description provided.")}
                  </p>
                </div>

                {/* Card Footer: Interactive Link & Status Info */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span
                    onClick={() => {
                      setSelectedTypeForDetail(type);
                    }}
                    className={`inline-flex items-center gap-1 text-xs font-bold ${style.accentColor} hover:underline cursor-pointer`}
                  >
                    {language === "vi" ? "Xem chi tiết" : "View details"}
                    <ChevronRight size={13} className="transform transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border ${style.badgeBg}`}>
                      {type.type_code}
                    </span>
                    {type.active === 1 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title={language === "vi" ? "Đang hoạt động" : "Active"} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTypeForDetail && (() => {
        const style = getCardStyle(selectedTypeForDetail.display_color, selectedTypeForDetail.type_code, selectedTypeForDetail.type_name);
        const IconComponent = style.icon;
        const categoryRecords = records.filter(
          (r: any) => r.category === selectedTypeForDetail.type_name
        );
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 transform transition-all duration-300 animate-in fade-in zoom-in-95 my-8">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.bgGradient} shadow-md flex items-center justify-center text-white`}>
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">
                        {selectedTypeForDetail.type_name}
                      </h3>
                      <span className={`text-[11px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border ${style.badgeBg}`}>
                        {selectedTypeForDetail.type_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {language === "vi" ? "Thông tin chi tiết phân loại hệ thống" : "System classification detailed information"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTypeForDetail(null)}
                  className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full border border-slate-200/60 shadow-sm transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/80">
                    <span className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                      {language === "vi" ? "Mô tả phân loại" : "Category Description"}
                    </span>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                      {selectedTypeForDetail.description || 
                        (language === "vi" ? "Không có mô tả chi tiết cho loại hồ sơ này." : "No description provided.")}
                    </p>
                  </div>

                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100/80 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">
                        {language === "vi" ? "Thông số cơ bản" : "Key Properties"}
                      </span>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">{language === "vi" ? "Mã loại" : "Type Code"}</span>
                          <span className="font-bold text-slate-800">{selectedTypeForDetail.type_code}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">{language === "vi" ? "Trạng thái" : "Status"}</span>
                          <span className="flex items-center gap-1.5 font-bold text-slate-800">
                            <span className={`w-2 h-2 rounded-full ${selectedTypeForDetail.active === 1 ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                            {selectedTypeForDetail.active === 1 
                              ? (language === "vi" ? "Đang hoạt động" : "Active") 
                              : (language === "vi" ? "Ngưng hoạt động" : "Inactive")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">{language === "vi" ? "Màu nhận diện" : "Display Color"}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded-full ${selectedTypeForDetail.display_color || "bg-blue-500"} border border-white shadow-sm`} />
                            <span className="text-xs font-medium text-slate-500 capitalize">{selectedTypeForDetail.display_color?.replace("bg-", "").replace("-500", "")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{language === "vi" ? "Hồ sơ đang quản lý" : "Managed cases"}</span>
                      <span className={`text-lg font-black px-3 py-1 rounded-xl bg-white border border-slate-200/80 shadow-sm ${style.accentColor}`}>
                        {categoryRecords.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Case Lists Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FolderOpen size={16} className={style.accentColor} />
                      {language === "vi" ? "Danh sách hồ sơ thuộc nhóm" : "Cases in this group"}
                    </h4>
                    <span className="text-xs font-bold text-slate-400">
                      {language === "vi" ? `Tổng số: ${categoryRecords.length}` : `Total: ${categoryRecords.length}`}
                    </span>
                  </div>

                  {categoryRecords.length > 0 ? (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm max-h-64 overflow-y-auto bg-white custom-scrollbar">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="p-3.5 font-bold">{language === "vi" ? "Mã hồ sơ" : "Case ID"}</th>
                            <th className="p-3.5 font-bold">{language === "vi" ? "Tên vụ việc / Khách hàng" : "Case Title / Client"}</th>
                            <th className="p-3.5 font-bold">{language === "vi" ? "Luật sư phụ trách" : "Assignee"}</th>
                            <th className="p-3.5 font-bold">{language === "vi" ? "Trạng thái" : "Status"}</th>
                            <th className="p-3.5 text-right font-bold">{language === "vi" ? "Thao tác" : "Action"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {categoryRecords.map((rec: any) => (
                            <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-slate-900">{rec.id || rec.code || "#Hồ sơ"}</td>
                              <td className="p-3.5">
                                <div className="font-bold text-slate-800 line-clamp-1">{rec.title}</div>
                                <div className="text-slate-400 mt-0.5 text-[10px]">{language === "vi" ? `Khách hàng: ${rec.client || "Chưa rõ"}` : `Client: ${rec.client || "N/A"}`}</div>
                              </td>
                              <td className="p-3.5 font-medium text-slate-600">{rec.mainAssignee || "-"}</td>
                              <td className="p-3.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  rec.status === "Hoàn thành" || rec.status === "Completed"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : rec.status === "Đang xử lý" || rec.status === "In Progress"
                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                    : rec.status === "Quá hạn" || rec.status === "Overdue"
                                    ? "bg-red-50 text-red-700 border-red-100"
                                    : "bg-slate-50 text-slate-600 border-slate-100"
                                }`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => {
                                    if (setSelectedCategory && setParentActiveTab) {
                                      setSelectedCategory(selectedTypeForDetail.type_name);
                                      setParentActiveTab("records");
                                      setSelectedTypeForDetail(null);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer inline-flex items-center gap-1`}
                                >
                                  {language === "vi" ? "Xem" : "View"}
                                  <ChevronRight size={10} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 border border-dashed border-slate-200 bg-slate-50/30 rounded-2xl">
                      <FolderOpen size={32} className="mx-auto text-slate-300 mb-2.5" />
                      <p className="text-slate-500 text-xs font-medium">
                        {language === "vi" 
                          ? "Không tìm thấy hồ sơ nào thuộc nhóm này trong hệ thống." 
                          : "No cases registered under this classification yet."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTypeForDetail(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 bg-white transition-all active:scale-95 cursor-pointer text-xs order-2 sm:order-1"
                >
                  {language === "vi" ? "Đóng cửa sổ" : "Close window"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedCategory && setParentActiveTab) {
                      setSelectedCategory(selectedTypeForDetail.type_name);
                      setParentActiveTab("records");
                      setSelectedTypeForDetail(null);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all active:scale-95 cursor-pointer text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 order-1 sm:order-2`}
                >
                  {language === "vi" ? "Đi tới Quản lý hồ sơ" : "Go to Case Management"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function NotificationsView({
  language,
  notifications,
  setNotifications,
  records,
  currentUser,
  users,
  events = [],
  setEvents,
}: {
  language: "vi" | "en";
  notifications: any[];
  setNotifications: (n: any[]) => void;
  records?: any[];
  currentUser?: any;
  users?: any[];
  events?: any[];
  setEvents?: (e: any) => void;
}) {
  const [showAddNotification, setShowAddNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "high">("all");
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("deleted_notification_ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [formData, setFormData] = useState<{
    titleType: string;
    customTitle: string;
    content: string;
    importance: string;
    sendTo: string;
    selectedCases: number[];
    shareDuration: string;
    selectedUsers: string[];
  }>({
    titleType: "general",
    customTitle: "",
    content: "",
    importance: "normal",
    sendTo: "all",
    selectedCases: [],
    shareDuration: "stop",
    selectedUsers: [],
  });

  const now = new Date();
  const currentDateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  const t = {
    vi: {
      title: "Thông báo",
      subtitle: currentDateStr,
      systemNotifications: "Thông báo hệ thống",
      addNotification: "Thêm thông báo",
      markAllRead: "Đánh dấu tất cả đã đọc",
      addNewNotification: "Thêm thông báo mới",
      cancel: "Hủy",
      sendNotification: "Gửi thông báo",
      notificationTitleType: "Nhóm thông báo",
      titleGeneral: "Thông báo chung",
      titleReminder: "Nhắc nhở công việc",
      titleMeeting: "Lịch họp/Sự kiện",
      titleCaseDiscussion: "Trao đổi nghiệp vụ",
      titleOther: "Khác",
      notificationTitle: "Tiêu đề thông báo",
      notificationTitlePlaceholder: "Nhập tiêu đề của bạn",
      notificationTitlePlaceholder2: "Nhập tiêu đề thông báo (ngắn gọn, súc tích)",
      notificationTitleHint: "Tiêu đề sẽ hiển thị trong danh sách thông báo.",
      selectedCases: "Chọn hồ sơ (Danh sách)",
      shareDuration: "Thời gian chia sẻ hồ sơ",
      durationStop: "Ngừng chia sẻ",
      duration24h: "24 giờ",
      duration48h: "48 giờ",
      duration7days: "7 ngày",
      duration30days: "30 ngày",
      durationUnlimited: "Không giới hạn",
      content: "Nội dung thông báo",
      contentPlaceholder: "Nhập nội dung chi tiết",
      contentPlaceholder2: "Nhập nội dung thông báo gửi đến nhân viên...",
      contentHint: "Nội dung chi tiết của thông báo. Hỗ trợ xuống dòng.",
      importance: "Mức độ quan trọng",
      low: "Thấp",
      lowDesc: "Ít quan trọng",
      normal: "Bình thường",
      normalDesc: "Thông tin chung",
      important: "Quan trọng",
      importantDesc: "Cần chú ý",
      urgent: "Khẩn cấp",
      urgentDesc: "Cần xử lý ngay",
      sendTo: "Gửi đến",
      sendToHint: "Chọn đối tượng sẽ nhận được thông báo.",
      categoryHint: "Chọn nhóm phù hợp với nội dung thông báo.",
      notificationHelper: "Tạo thông báo để gửi đến nhân viên trong hệ thống.",
      specificAccounts: "Tài khoản cụ thể",
      allEmployees: "Tất cả nhân viên",
      onlyLawyers: "Chỉ Luật sư",
      onlySpecialists: "Chỉ Chuyên viên pháp lý",
      teamBuilding: "TEAM BILDING",
      date20: "Ngày 20",
      time: "08:26 15/03/2026",
      delete: "Xóa",
    },
    en: {
      title: "Notifications",
      subtitle: currentDateStr,
      systemNotifications: "System Notifications",
      addNotification: "Add Notification",
      markAllRead: "Mark all as read",
      addNewNotification: "Add New Notification",
      cancel: "Cancel",
      sendNotification: "Send Notification",
      notificationTitleType: "Notification Category",
      titleGeneral: "General Notification",
      titleReminder: "Task Reminder",
      titleMeeting: "Meeting/Event",
      titleCaseDiscussion: "Professional Exchange",
      titleOther: "Other",
      notificationTitle: "Notification Title",
      notificationTitlePlaceholder: "Enter your title",
      notificationTitlePlaceholder2: "Enter notification title (short, concise)",
      notificationTitleHint: "The title will appear in the notification list.",
      selectedCases: "Select Cases (List)",
      shareDuration: "Sharing Duration",
      durationStop: "Stop sharing",
      duration24h: "24 hours",
      duration48h: "48 hours",
      duration7days: "7 days",
      duration30days: "30 days",
      durationUnlimited: "Unlimited",
      content: "Notification Content",
      contentPlaceholder: "Enter detailed content",
      contentPlaceholder2: "Enter notification content to send to employees...",
      contentHint: "Detailed content of the notification. Supports new lines.",
      importance: "Importance Level",
      low: "Low",
      lowDesc: "Less important",
      normal: "Normal",
      normalDesc: "General info",
      important: "Important",
      importantDesc: "Needs attention",
      urgent: "Urgent",
      urgentDesc: "Needs immediate action",
      sendTo: "Send To",
      sendToHint: "Select who will receive the notification.",
      categoryHint: "Select a category suitable for the notification.",
      notificationHelper: "Create a notification to send to employees in the system.",
      specificAccounts: "Specific Accounts",
      allEmployees: "All Employees",
      onlyLawyers: "Lawyers Only",
      onlySpecialists: "Specialists Only",
      teamBuilding: "TEAM BUILDING",
      date20: "20th",
      time: "08:26 03/15/2026",
      delete: "Delete",
    },
  }[language];

  const uniqueUsers = Array.from(new Set(records?.map((r) => r.mainAssignee).filter(Boolean)));

  const handleAddNotification = () => {
    let finalTitle = formData.customTitle;
    if (!finalTitle) finalTitle = t.titleGeneral;

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    let finalContent = formData.content;

    let displaySendToText = formData.sendTo;
    if (formData.sendTo === "specific") {
      if (formData.selectedUsers.length > 0) {
        if (users && users.length > 0) {
          displaySendToText = formData.selectedUsers.map(username => {
            const u = users.find(user => user.username === username);
            if (u) {
              return `${u.name || u.username} - ${u.title || (u.role === 'admin' ? 'Quản trị viên' : 'Nhân viên')}`;
            }
            return username;
          }).join(", ");
        } else {
          displaySendToText = formData.selectedUsers.join(", ");
        }
      } else {
        displaySendToText = language === "vi" ? "Chưa chọn tài khoản" : "No selected accounts";
      }
    }

    const newNotification = {
      id: Date.now(),
      title: finalTitle,
      content: finalContent,
      time: timeString,
      read: false,
      importance: formData.importance,
      sendTo: formData.sendTo,
      selectedUsers: formData.selectedUsers,
      selectedCases: formData.selectedCases,
      sender: currentUser?.name || currentUser?.username || "System",
      displaySendTo: displaySendToText,
    };

    setNotifications([newNotification, ...notifications]);

    // Đồng bộ sang Lịch biểu điều hành / System Events theo thời gian thực
    if (setEvents) {
      const todayIso = new Date().toISOString().split("T")[0];
      const calEvt = {
        id: Date.now() + 1,
        title: finalTitle,
        description: finalContent,
        date: todayIso,
        startDate: todayIso,
        time: timeString,
        type: formData.titleType === "meeting" ? "Lịch họp" : formData.titleType === "reminder" ? "Nhắc nhở" : "Sự kiện",
        priority: formData.importance === "important" || formData.importance === "urgent" ? "Cao" : "Bình thường",
        status: "Sắp diễn ra",
        location: "Văn phòng Luật Ánh Dương / Trực tuyến",
        client: displaySendToText,
      };
      setEvents((prev: any[]) => [...(prev || []), calEvt]);
    }

    setShowAddNotification(false);
    setFormData({
      titleType: "general",
      customTitle: "",
      content: "",
      importance: "normal",
      sendTo: "all",
      selectedCases: [],
      shareDuration: "stop",
      selectedUsers: [],
    });
  };

  const handleDeleteNotification = (id: any) => {
    const stringId = String(id);
    const updated = [...deletedNotificationIds, stringId];
    setDeletedNotificationIds(updated);
    try {
      localStorage.setItem("deleted_notification_ids", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setNotifications(notifications.filter((n) => String(n.id) !== stringId));
  };

  const baseVisibleNotifications = useMemo(() => {
    const rawList = [...(notifications || [])].filter((n) => !deletedNotificationIds.includes(String(n.id)));
    const notifIds = new Set(rawList.map((n) => String(n.id)));

    // Tự động ánh xạ từ Lịch biểu điều hành (events) sang Thông báo hệ thống theo thời gian thực
    if (events && events.length > 0) {
      events.forEach((evt) => {
        const strId = String(evt.id);
        if (!notifIds.has(strId) && !deletedNotificationIds.includes(strId)) {
          const cleanEvtTitle = (evt.title || "").replace(/\[\s*Ánh\s*xạ\s*[^\]]*\]/gi, "").replace(/Ánh\s*xạ\s*/gi, "").trim();
          rawList.push({
            id: evt.id,
            title: cleanEvtTitle,
            content: `${evt.description || evt.location || 'Sự kiện điều hành'} - Thời gian: ${evt.date || evt.startDate || 'Hôm nay'} (${evt.time || 'Cố định'})`,
            time: evt.time || "Đồng bộ thời gian thực",
            read: false,
            importance: evt.priority === "Cao" || evt.priority === "High" ? "important" : "normal",
            sendTo: "all",
            sender: "Lịch Biểu Điều Hành",
            displaySendTo: evt.client || "Tất cả nhân sự",
          });
        }
      });
    }

    return currentUser
      ? rawList.filter((n) => {
          if (n.sender === currentUser.name || n.sender === currentUser.username) return true;
          if (n.sendTo === "all" || !n.sendTo) return true;
          if (n.sendTo === "specific" && (n.selectedUsers?.includes(currentUser.name) || n.selectedUsers?.includes(currentUser.username))) return true;
          if (n.sendTo === currentUser.role) return true;
          return false;
        })
      : rawList;
  }, [notifications, events, currentUser, deletedNotificationIds]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return baseVisibleNotifications.filter((n) => !n.read);
    }
    if (activeTab === "high") {
      return baseVisibleNotifications.filter((n) => n.importance === "important" || n.importance === "urgent");
    }
    return baseVisibleNotifications;
  }, [baseVisibleNotifications, activeTab]);

  const handleMarkAllRead = () => {
    const visibleIds = new Set(baseVisibleNotifications.map((n) => n.id));
    setNotifications(notifications.map((n) => (visibleIds.has(n.id) ? { ...n, read: true } : n)));
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const getCategoryIcon = (title: string) => {
    const lowerTitle = (title || "").toLowerCase();
    if (lowerTitle.includes("họp") || lowerTitle.includes("meeting") || lowerTitle.includes("lịch")) {
      return { icon: Calendar, bgGradient: "from-blue-500 to-indigo-500", textClass: "text-blue-600", bgClass: "bg-blue-50" };
    }
    if (lowerTitle.includes("nhắc") || lowerTitle.includes("reminder") || lowerTitle.includes("hạn")) {
      return { icon: Clock, bgGradient: "from-amber-500 to-orange-500", textClass: "text-amber-600", bgClass: "bg-amber-50" };
    }
    if (lowerTitle.includes("trao đổi") || lowerTitle.includes("thảo luận") || lowerTitle.includes("discussion")) {
      return { icon: MessageSquare, bgGradient: "from-purple-500 to-pink-500", textClass: "text-purple-600", bgClass: "bg-purple-50" };
    }
    if (lowerTitle.includes("khẩn") || lowerTitle.includes("urgent") || lowerTitle.includes("báo động")) {
      return { icon: AlertTriangle, bgGradient: "from-rose-500 to-red-600", textClass: "text-rose-600", bgClass: "bg-rose-50 animate-pulse" };
    }
    return { icon: Bell, bgGradient: "from-indigo-500 to-purple-500", textClass: "text-indigo-600", bgClass: "bg-indigo-50" };
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "low":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-slate-50 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {language === "vi" ? "Thấp" : "Low"}
          </span>
        );
      case "important":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-orange-50 text-orange-600 border border-orange-200 shadow-sm shadow-orange-100">
            <AlertCircle size={11} />
            {language === "vi" ? "Quan trọng" : "Important"}
          </span>
        );
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-50 text-rose-600 border border-rose-200 shadow-sm shadow-rose-100 animate-pulse">
            <AlertTriangle size={11} />
            {language === "vi" ? "Khẩn cấp" : "Urgent"}
          </span>
        );
      case "normal":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-50 text-blue-600 border border-blue-200 shadow-sm shadow-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {language === "vi" ? "Bình thường" : "Normal"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-white via-slate-50/50 to-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Bell size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                  {language === "vi" ? "DANH SÁCH THÔNG BÁO" : "NOTIFICATIONS FEED"}
                </h4>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                  {language === "vi" ? "Kênh phát sóng & thông điệp hệ thống" : "System Broadcasts & Alerts Feed"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm tracking-wide active:scale-95 transition-all"
              >
                {t.markAllRead}
              </button>
              <button
                onClick={() => setShowAddNotification(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_200%] hover:bg-[100%_0] transition-all duration-500 shadow-lg shadow-indigo-100 hover:shadow-indigo-200 text-white rounded-2xl font-bold text-sm tracking-wide active:scale-95 transform"
              >
                <Plus size={18} />
                {t.addNotification}
              </button>
            </div>
          </div>

          {/* Image 3 Inspired Filter Tab Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/40 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === "all"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                {language === "vi" ? "Tất cả thông báo" : "All broadcasts"}
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === "unread"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                {language === "vi" ? "Chưa đọc" : "Unread only"}
              </button>
              <button
                onClick={() => setActiveTab("high")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === "high"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                }`}
              >
                {language === "vi" ? "Quan trọng / Khẩn cấp" : "High priority"}
              </button>
            </div>
            
            <div className="text-right hidden md:block">
              <span className="text-[11px] font-bold tracking-widest text-slate-400 font-mono">
                LAWFIRM ERP NOTIFICATIONS
              </span>
            </div>
          </div>
        </div>

        {showAddNotification && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 transform transition-all duration-300 animate-in fade-in zoom-in-95">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {t.addNewNotification}
                </h3>
                <button
                  onClick={() => setShowAddNotification(false)}
                  className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1.5 rounded-full border border-slate-200/60 shadow-sm transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t.notificationTitleType} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 border-r border-slate-200 pr-3 my-2">
                      <Users size={18} />
                    </div>
                    <select
                      value={formData.titleType}
                      onChange={(e) => setFormData({ ...formData, titleType: e.target.value })}
                      className="w-full pl-14 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none font-bold text-slate-700 bg-white"
                    >
                      <option value="general">{t.titleGeneral}</option>
                      <option value="reminder">{t.titleReminder}</option>
                      <option value="meeting">{t.titleMeeting}</option>
                      <option value="case_discussion">{t.titleCaseDiscussion}</option>
                      <option value="other">{t.titleOther}</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{t.categoryHint}</p>
                </div>

                {formData.titleType === "case_discussion" && records && records.length > 0 && (
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                      Chọn hồ sơ trao đổi
                    </label>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/60">
                      {records.map((record) => (
                        <div key={record.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            id={`case-${record.id}`}
                            checked={formData.selectedCases.includes(record.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, selectedCases: [...formData.selectedCases, record.id] });
                              } else {
                                setFormData({ ...formData, selectedCases: formData.selectedCases.filter((id: number) => id !== record.id) });
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`case-${record.id}`} className="text-sm cursor-pointer select-none text-slate-700 flex-1 font-medium">
                            {record.code ? `${record.code} - ` : ''}{record.title || 'Không tên'}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t.sendTo} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 border-r border-slate-200 pr-3 my-2">
                      <User size={18} />
                    </div>
                    <select
                      value={formData.sendTo}
                      onChange={(e) => setFormData({ ...formData, sendTo: e.target.value })}
                      className="w-full pl-14 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none font-bold text-slate-700 bg-white"
                    >
                      <option value="all">{t.allEmployees}</option>
                      <option value="specific">{t.specificAccounts}</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{t.sendToHint}</p>
                </div>

                {formData.sendTo === "specific" && users && users.length > 0 && (
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                      {t.specificAccounts}
                    </label>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/60">
                      {users.map((user) => (
                        <div key={user.username} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            id={`user-${user.username}`}
                            checked={formData.selectedUsers.includes(user.username)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, selectedUsers: [...formData.selectedUsers, user.username] });
                              } else {
                                setFormData({ ...formData, selectedUsers: formData.selectedUsers.filter(u => u !== user.username) });
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`user-${user.username}`} className="text-sm cursor-pointer select-none text-slate-700 flex-1 font-semibold">
                            {user.name || user.username}{user.title ? ` - ${user.title}` : (user.role === 'admin' ? '' : ' - Nhân viên')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t.importance} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        value: "low",
                        label: t.low,
                        sublabel: t.lowDesc,
                        icon: <div className="w-3.5 h-3.5 rounded-full bg-slate-400" />,
                        activeClass: "border-slate-400 ring-4 ring-slate-100 bg-slate-50",
                        textClass: "text-slate-800",
                        radioClass: "border-slate-500 text-slate-500"
                      },
                      {
                        value: "normal",
                        label: t.normal,
                        sublabel: t.normalDesc,
                        icon: <div className="w-3.5 h-3.5 rounded-full border-[3px] border-blue-200 bg-blue-600" />,
                        activeClass: "border-indigo-500 ring-4 ring-indigo-50 bg-indigo-50/50",
                        textClass: "text-indigo-700",
                        radioClass: "border-indigo-600 text-indigo-600"
                      },
                      {
                        value: "important",
                        label: t.important,
                        sublabel: t.importantDesc,
                        icon: <AlertCircle size={16} className="text-orange-500" />,
                        activeClass: "border-orange-500 ring-4 ring-orange-50 bg-orange-50/50",
                        textClass: "text-orange-700",
                        radioClass: "border-orange-500 text-orange-500"
                      },
                      {
                        value: "urgent",
                        label: t.urgent,
                        sublabel: t.urgentDesc,
                        icon: <AlertTriangle size={16} className="text-red-500" />,
                        activeClass: "border-red-500 ring-4 ring-red-50 bg-red-50/50",
                        textClass: "text-red-700",
                        radioClass: "border-red-600 text-red-600"
                      }
                    ].map((level) => {
                      const isActive = formData.importance === level.value;
                      return (
                        <div
                          key={level.value}
                          onClick={() => setFormData({ ...formData, importance: level.value })}
                          className={`cursor-pointer rounded-2xl border p-3 flex items-center gap-3 transition-all duration-200 ${
                            isActive ? level.activeClass : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${isActive ? level.radioClass : 'border-slate-300'}`}>
                            {isActive && <div className="w-2 h-2 rounded-full bg-current" />}
                          </div>
                          <div className="flex items-center gap-2">
                            {level.icon}
                            <div>
                              <div className={`font-bold text-[13px] ${isActive ? level.textClass : 'text-slate-700'}`}>{level.label}</div>
                              <div className={`text-[10px] font-medium ${isActive ? level.textClass.replace('700', '600').replace('800', '500') : 'text-slate-400'}`}>{level.sublabel}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t.notificationTitle} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 border-r border-slate-200 pr-3 my-2">
                      <FileText size={18} />
                    </div>
                    <input
                      type="text"
                      value={formData.customTitle}
                      onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                      placeholder={t.notificationTitlePlaceholder2}
                      className="w-full pl-14 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold text-slate-800 placeholder-slate-400 transition-all"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{t.notificationTitleHint}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t.content} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 border-r border-slate-200 pr-3 bottom-3">
                      <Edit2 size={18} className="mt-0.5" />
                    </div>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={t.contentPlaceholder2}
                      rows={4}
                      className="w-full pl-14 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold text-slate-800 min-h-[120px] resize-y placeholder-slate-400 transition-all"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{t.contentHint}</p>
                </div>
              </div>
              
              <div className="px-6 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setShowAddNotification(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 text-sm"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleAddNotification}
                  disabled={!formData.customTitle || !formData.content}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Send size={18} />
                  {t.sendNotification}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Interactive List Grid */}
        <div className="p-6 md:p-8 space-y-4 max-h-[600px] overflow-y-auto bg-slate-50/20">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Bell size={32} />
              </div>
              <h5 className="font-bold text-slate-700 text-lg">
                {language === "vi" ? "Chưa có thông báo nào" : "Feed is clear"}
              </h5>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                {language === "vi"
                  ? "Tất cả các thông báo mới hoặc cập nhật từ hệ thống sẽ hiển thị tại đây."
                  : "Any new announcements or priority updates will show up here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const category = getCategoryIcon(notification.title);
              const CategoryIconComponent = category.icon;
              
              const senderInitials = (notification.sender || "System")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  className={cn(
                    "group relative rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 border bg-white",
                    notification.read 
                      ? "border-slate-100 shadow-sm" 
                      : "border-amber-100 shadow-md shadow-amber-50/35 border-l-[6px] border-l-amber-500"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110",
                      notification.read 
                        ? "bg-slate-50 text-slate-400" 
                        : `${category.bgClass} ${category.textClass}`
                    )}>
                      <CategoryIconComponent size={22} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className={cn(
                          "font-black text-base tracking-tight",
                          notification.read ? "text-slate-600" : "text-slate-900"
                        )}>
                          {notification.title}
                        </h5>
                        
                        {getImportanceBadge(notification.importance)}

                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </div>

                      <p className={cn(
                        "text-sm whitespace-pre-wrap leading-relaxed max-w-3xl",
                        notification.read ? "text-slate-400" : "text-slate-600"
                      )}>
                        {notification.content}
                      </p>

                      {notification.displaySendTo && (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{language === "vi" ? "Gửi đến" : "Audience"}:</span>
                          <span className="text-slate-500">{notification.displaySendTo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t border-slate-100 md:border-t-0 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-50 pl-2 pr-3 py-1 rounded-full border border-slate-200/50">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-mono text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm">
                          {senderInitials}
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                          {notification.sender || "System"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                        <Clock size={13} />
                        <span>{notification.time}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                      title={t.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const PersonalAttendanceWidget = ({ user, api, language }: { user: any; api: any; language: string }) => {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [proof, setProof] = useState("");
  const [proofName, setProofName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLateForm, setShowLateForm] = useState(false);

  const fetchStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const rows = await api.req(`/api/attendance?userId=${user.id}&date=${todayStr}`, "GET");
      if (rows && rows.length > 0) {
        setAttendance(rows[0]);
      } else {
        setAttendance(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleOnTimeCheckIn = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      await api.req("/api/attendance/check-in", "POST", {
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
      alert("Chấm công đúng giờ thành công!");
      fetchStatus();
    } catch (err) {
      console.error(err);
      alert("Chấm công thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLateCheckInSubmit = async () => {
    if (!user) return;
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do giải trình trễ giờ!");
      return;
    }
    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      await api.req("/api/attendance/check-in", "POST", {
        userId: user.id,
        staffCode: user.staff_code || `NV${user.id}`,
        staffName: user.name || user.username,
        role: user.role,
        date: todayStr,
        status: "pending",
        checkInTime: nowTime,
        explanation: reason,
        proofFile: proof || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=500&q=80"
      });
      alert("Đã gửi giải trình trễ hạn đến Kiểm soát viên! Vui lòng chờ phê duyệt.");
      fetchStatus();
    } catch (err) {
      console.error(err);
      alert("Không thể gửi giải trình!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      setProofName(file.name);
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setProof(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const t = {
    vi: {
      title: "Hệ thống Chấm công Ánh Dương",
      today: "Hôm nay",
      status: "Trạng thái",
      notCheckedIn: "Chưa chấm công",
      checkedIn: "Đúng giờ / Đã duyệt",
      pending: "Chờ duyệt đi muộn",
      absent: "Vắng mặt",
      checkInOnTime: "Chấm công Đúng giờ",
      checkInLate: "Chấm công Đi muộn",
      explanationLabel: "Lý do giải trình",
      explanationPlaceholder: "Nhập lý do chi tiết vì sao chấm công muộn...",
      proofLabel: "Tài liệu chứng minh (Hình ảnh/Bản scan)",
      submitLate: "Gửi Giải Trình & Chấm Công",
      simulateLateToggle: "Chấm công Đi muộn",
      loading: "Đang tải dữ liệu...",
      checkInTime: "Giờ ghi nhận",
    },
    en: {
      title: "Anh Duong Attendance System",
      today: "Today",
      status: "Status",
      notCheckedIn: "Not checked in yet",
      checkedIn: "Present / Approved",
      pending: "Pending Late Approval",
      absent: "Absent",
      checkInOnTime: "Check-in On-Time",
      checkInLate: "Check-in Late",
      explanationLabel: "Late Explanation",
      explanationPlaceholder: "Explain why you checked in late...",
      proofLabel: "Supporting Document (Photo/Scan)",
      submitLate: "Submit Explanation & Check-In",
      simulateLateToggle: "Check-in Late",
      loading: "Loading status...",
      checkInTime: "Check-in Time",
    }
  }[language === "vi" ? "vi" : "en"];

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-center py-6">
        <Loader2 className="animate-spin text-[#0a2d37] mr-2" size={18} />
        <span className="text-xs text-slate-500 font-medium">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📌</span>
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
            {t.title}
          </h4>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {new Date().toLocaleDateString('vi-VN')}
        </span>
      </div>

      {attendance ? (
        <div className="p-4 rounded-xl border flex items-center justify-between bg-slate-50 border-slate-200">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{t.status}</p>
            <p className="text-sm font-black text-slate-800">
              {attendance.status === "present" || attendance.status === "Present" ? t.checkedIn :
               attendance.status === "pending" || attendance.status === "Pending" ? t.pending : t.absent}
            </p>
            {attendance.check_in_time && (
              <p className="text-xs text-slate-500 font-mono">
                {t.checkInTime}: <span className="font-bold text-slate-700">{attendance.check_in_time}</span>
              </p>
            )}
          </div>
          <span className={`text-2xl p-2.5 rounded-full ${
            attendance.status === "present" || attendance.status === "Present" ? "bg-emerald-100 text-emerald-800" :
            attendance.status === "pending" || attendance.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
          }`}>
            {attendance.status === "present" || attendance.status === "Present" ? "✅" :
             attendance.status === "pending" || attendance.status === "Pending" ? "⏳" : "❌"}
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 border border-dashed rounded-xl p-4 border-slate-300">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold">{t.status}</p>
              <p className="text-sm font-black text-slate-700">{t.notCheckedIn}</p>
            </div>
            <span className="text-xl">💤</span>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowLateForm(!showLateForm)}
              className={`text-xs px-3 py-2 font-bold rounded-lg border transition-all ${
                showLateForm
                  ? "bg-amber-50 text-amber-700 border-amber-300 shadow-sm" 
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {t.simulateLateToggle}
            </button>
          </div>

          {!showLateForm ? (
            <button
              onClick={handleOnTimeCheckIn}
              disabled={submitting}
              className="w-full py-3 bg-[#0a2d37] hover:bg-[#0f3d4a] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <span>📍</span>
              )}
              {t.checkInOnTime}
            </button>
          ) : (
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-4 animate-fade-in">
              <h5 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                ⚠️ {t.checkInLate}
              </h5>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  {t.explanationLabel} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t.explanationPlaceholder}
                  rows={2}
                  className="w-full text-xs p-2.5 border rounded-lg bg-white border-slate-200 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                  <span>{t.proofLabel} <span className="text-red-500">*</span></span>
                  {proofName && <span className="text-emerald-700 font-normal font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">✓ {proofName}</span>}
                </label>
                <div className="relative border border-dashed border-slate-300 rounded-lg p-3 bg-white text-center hover:bg-slate-50 transition-all cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-slate-400">📤</span>
                    <span className="text-[10px] text-slate-500 font-bold">Kéo thả hoặc click để tải lên</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLateCheckInSubmit}
                disabled={submitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <span>✉️</span>
                )}
                {t.submitLate}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PersonalCommissionsWidget = ({
  user,
  records,
  language,
}: {
  user: any;
  records: any[];
  language: "vi" | "en";
}) => {
  const mappedRole = (user?.role || "").toLowerCase();
  const isLitigationUser = [
    "lawyer", "specialist", "traineelawyer", "intern", 
    "director", "deputy_director", "deputydirector", 
    "manager", "head_of_department", "legal_associate",
    "luật sư", "chuyên viên pháp lý", "luật sư tập sự", 
    "thực tập sinh", "giám đốc", "phó giám đốc", "trưởng phòng", "quản lý", "trợ lý pháp lý"
  ].includes(mappedRole);

  if (!isLitigationUser) return null;

  const personalCommissions = useMemo(() => {
    if (!user) return { rate: 5, bonusRate: 10, earnedCommission: 0, earnedCompletionReward: 0, cases: [] };
    const rate = user.commission_percent !== undefined ? Number(user.commission_percent) : 5;
    const bonusRate = user.bonus_completion_percent !== undefined ? Number(user.bonus_completion_percent) : 10;
    
    let earnedCommission = 0;
    let earnedCompletionReward = 0;
    const associatedCases: any[] = [];

    records.forEach((r) => {
      if (r.mainAssignee === user.name || r.mainAssignee === user.username) {
        const revenue = Number((r.feeAmount || r.revenue || "0").toString().replace(/,/g, "")) || 0;
        const isDraft = r.isOcrDraft || (r.status && typeof r.status === "string" && r.status.toLowerCase().includes("nháp"));
        const comm = isDraft ? 0 : revenue * (rate / 100);
        earnedCommission += comm;

        let reward = 0;
        if (r.status && typeof r.status === "string" && r.status.toLowerCase().includes("hoàn thành")) {
          reward = revenue * (bonusRate / 100);
          earnedCompletionReward += reward;
        }

        associatedCases.push({
          id: r.id || "---",
          title: r.title || "---",
          client: r.client || "---",
          revenue,
          status: r.status,
          commission: comm,
          reward,
          isDraft
        });
      }
    });

    return {
      rate,
      bonusRate,
      earnedCommission,
      earnedCompletionReward,
      cases: associatedCases
    };
  }, [records, user]);

  const formatMoney = (val: number) => {
    return val.toLocaleString("vi-VN") + " VNĐ";
  };

  const t = {
    vi: {
      title: "BÁO CÁO HOA HỒNG & THƯỞNG CÁ NHÂN",
      subtitle: "Thống kê hoa hồng tìm kiếm hồ sơ và thưởng vụ việc được ghi nhận tự động",
      commRate: "Tỷ lệ Hoa hồng tìm hồ sơ mới",
      bonusRate: "Tỷ lệ Thưởng hoàn thành vụ việc",
      commEarned: "Hoa hồng tìm hồ sơ tích lũy",
      bonusEarned: "Thưởng hoàn thành vụ việc",
      totalEarned: "TỔNG THU NHẬP ĐÃ GHI NHẬN",
      caseBreakdown: "BẢNG KÊ CHI TIẾT THEO VỤ VIỆC",
      caseId: "Mã Hồ Sơ",
      caseTitle: "Tên Vụ Việc / Khách Hàng",
      revenue: "Doanh Thu",
      status: "Trạng Thái",
      commAmount: "Hoa Hồng",
      bonusAmount: "Thưởng",
      noCases: "Chưa ghi nhận vụ việc nào thuộc quyền phụ trách của bạn.",
      commTip: "Hoa hồng tìm hồ sơ mới được tính tự động từ doanh thu thực tế khi hồ sơ được lưu chính thức."
    },
    en: {
      title: "PERSONAL COMMISSIONS & REWARDS REPORT",
      subtitle: "Statistical overview of automatically-recorded finder's commission and case completion rewards",
      commRate: "New Record Finder Commission Rate",
      bonusRate: "Case Completion Bonus Rate",
      commEarned: "Accumulated Finder Commission",
      bonusEarned: "Accumulated Completion Bonus",
      totalEarned: "TOTAL COMPENSATION ACCRUED",
      caseBreakdown: "DETAILED CASE BREAKDOWN",
      caseId: "Case ID",
      caseTitle: "Dossier Name / Client",
      revenue: "Revenue",
      status: "Status",
      commAmount: "Commission",
      bonusAmount: "Reward",
      noCases: "No associated cases recorded under your account yet.",
      commTip: "Finder commission is automatically accrued from actual paid revenue upon final dossier creation."
    }
  }[language];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full inline-block"></span>
            {t.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-2xl text-xs font-bold text-indigo-700">
          <TrendingUp size={14} className="animate-bounce" />
          <span>{t.totalEarned}: {formatMoney(personalCommissions.earnedCommission + personalCommissions.earnedCompletionReward)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-slate-50 border border-indigo-100/40 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.commEarned}</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{formatMoney(personalCommissions.earnedCommission)}</h3>
            </div>
            <span className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold font-mono">
              %
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100/80 text-slate-600">
            <span>{t.commRate}:</span>
            <span className="font-extrabold text-indigo-600 font-mono text-sm">{personalCommissions.rate}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/30 via-teal-50/10 to-slate-50 border border-emerald-100/30 rounded-2xl p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t.bonusEarned}</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{formatMoney(personalCommissions.earnedCompletionReward)}</h3>
            </div>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold font-mono">
              ★
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100/80 text-slate-600">
            <span>{t.bonusRate}:</span>
            <span className="font-extrabold text-emerald-600 font-mono text-sm">{personalCommissions.bonusRate}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.caseBreakdown}</p>
        
        {personalCommissions.cases.length > 0 ? (
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="p-3">{t.caseId}</th>
                    <th className="p-3">{t.caseTitle}</th>
                    <th className="p-3">{t.revenue}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3 text-indigo-600">{t.commAmount} ({personalCommissions.rate}%)</th>
                    <th className="p-3 text-emerald-600">{t.bonusAmount} ({personalCommissions.bonusRate}%)</th>
                  </tr>
                </thead>
                <tbody>
                  {personalCommissions.cases.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{c.id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{c.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{language === "vi" ? "Khách: " : "Client: "}{c.client}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">{formatMoney(c.revenue)}</td>
                      <td className="p-3">
                        {c.isDraft ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[10px] border border-amber-200">
                            {language === "vi" ? "Lưu nháp / Chưa duyệt" : "Draft / Unapproved"}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            c.status?.toLowerCase().includes("hoàn thành")
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {c.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-extrabold text-indigo-600">
                        {c.isDraft ? "0 VNĐ" : formatMoney(c.commission)}
                      </td>
                      <td className="p-3 font-mono font-extrabold text-emerald-600">
                        {formatMoney(c.reward)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-200 p-8">
            <p className="text-slate-400 text-xs">{t.noCases}</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
        ℹ {t.commTip}
      </p>
    </div>
  );
};

function Dashboard({
  setActiveTab,
  language,
  user,
  records,
  users,
  events,
  myPermissions,
  setInitialPrompt,
  setActiveModule,
  isDashboardFS = false,
}: {
  setActiveTab: (tab: string) => void;
  language: "vi" | "en";
  user?: any;
  records: any[];
  users: any[];
  events: any[];
  myPermissions?: any;
  setInitialPrompt?: (p: string) => void;
  setActiveModule?: (mod: string) => void;
  isDashboardFS?: boolean;
}) {
  const [trendDays, setTrendDays] = useState(14);
  const [chartMode, setChartMode] = useState<"daily" | "cumulative">("cumulative");

  const canViewAll = myPermissions
    ? myPermissions.viewAllRecords
    : [
    "admin",
    "manager",
    "head_of_department",
    "director",
    "deputyDirector",
    "deputy_director",
    "manage",
  ].includes(user?.role || "");
  const userFilteredRecords = canViewAll
    ? records
    : records.filter((r) => {
        const uName = user?.name;
        const uUsername = user?.username;
        return (
          r.mainAssignee === uName ||
          r.subAssignee === uName ||
          r.authStaff1 === uName ||
          r.authStaff2 === uName ||
          r.authStaff3 === uName ||
          r.manager === uName ||
          r.lawyer === uName ||
          r.specialist === uName ||
          r.userEA === uName ||
          r.userEA === uUsername
        );
      });

  const chartData = useMemo(() => {
    const completedCases = userFilteredRecords.filter((r) => {
      const s = String(r.status || "").toLowerCase();
      return s.includes("hoàn thành") || s.includes("completed") || s.includes("done");
    });

    const parsedData: { [key: string]: { dateObj: Date; amount: number; count: number; titles: string[] } } = {};

    completedCases.forEach((r) => {
      const dateStr = r.completedDate || r.date || "2026-08-01";
      let dateObj = new Date();
      if (dateStr.includes("-")) {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          } else {
            dateObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          }
        }
      } else if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          dateObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }

      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
      const amount = Number((r.retainerPaid || r.revenue || r.feeAmount || r.fee || "0").toString().replace(/,/g, "")) || 0;

      if (!parsedData[key]) {
        parsedData[key] = { dateObj, amount: 0, count: 0, titles: [] };
      }
      parsedData[key].amount += amount;
      parsedData[key].count += 1;
      parsedData[key].titles.push(r.title || r.name || "Vụ việc");
    });

    const sortedKeys = Object.keys(parsedData).sort();
    let cumulative = 0;
    const items = sortedKeys.map((key) => {
      const entry = parsedData[key];
      cumulative += entry.amount;
      const d = entry.dateObj;
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      return {
        date: label,
        amount: entry.amount / 1000000,
        cumulative: cumulative / 1000000,
        titles: entry.titles,
        count: entry.count,
      };
    });

    if (items.length === 0) {
      return [
        { date: "10/07/2026", amount: 15.0, cumulative: 15.0, count: 1, titles: ["Tư vấn Hợp đồng Thương mại"] },
        { date: "15/07/2026", amount: 25.0, cumulative: 40.0, count: 1, titles: ["Tranh tụng Đất đai Quận 2"] },
        { date: "22/07/2026", amount: 18.5, cumulative: 58.5, count: 1, titles: ["Thủ tục Đầu tư FDI Hàn Quốc"] },
        { date: "28/07/2026", amount: 32.0, cumulative: 90.5, count: 1, titles: ["Bào chữa Vụ án Hình sự"] },
        { date: "02/08/2026", amount: 12.0, cumulative: 102.5, count: 1, titles: ["Tư vấn Sở hữu trí tuệ"] },
      ];
    }
    return items;
  }, [userFilteredRecords]);

  const t = {
    vi: {
      totalRecords: "TỔNG SỐ HỒ SƠ",
      expectedRevenue: "DOANH THU DỰ KIẾN",
      monthlyRevenue: "TỔNG DOANH THU",
      monthlyNewRecords: "VỤ VIỆC MỚI TRONG THÁNG",
      upcomingCourts: "PHIÊN TÒA SẮP TỚI",
      upcomingMeetings: "LỊCH HẸN SẮP TỚI",
      recordsStats: "Xu hướng Doanh thu & Hồ sơ",
      records: "Hồ sơ",
      revenue: "Doanh thu",
      latestRecords: "Hồ sơ mới nhất",
      nearingDeadline: "Cảnh báo hồ sơ sắp đến hạn",
      viewAll: "Xem tất cả",
      noRecords: "Chưa có hồ sơ nào",
      noRecordsDesc: "Các hồ sơ mới tạo sẽ hiển thị ở đây",
      recordsByCategory: "Hồ sơ theo phân loại",
      monthPrefix: "T",
    },
    en: {
      totalRecords: "TOTAL CASES",
      expectedRevenue: "EXPECTED REVENUE",
      monthlyRevenue: "TOTAL REVENUE",
      monthlyNewRecords: "NEW CASES THIS MONTH",
      upcomingCourts: "UPCOMING HEARINGS",
      upcomingMeetings: "UPCOMING APPOINTMENTS",
      recordsStats: "Records & Revenue Trend",
      records: "Records",
      revenue: "Revenue",
      latestRecords: "Latest Records",
      nearingDeadline: "Deadline Warning",
      viewAll: "View All",
      noRecords: "No records yet",
      noRecordsDesc: "Newly created records will appear here",
      recordsByCategory: "Records by Category",
      monthPrefix: "M",
    },
  }[language];

  // Overview metrics
  const totalRecords = userFilteredRecords.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [monthlyRevenue, monthlyNewRecords] = userFilteredRecords.reduce(
    (acc, r) => {
      if (r.date) {
        let m = -1;
        let y = -1;
        if (r.date.includes("-")) {
          const parts = r.date.split("-");
          if (parts.length === 3) {
            m = parseInt(parts[1], 10) - 1;
            y = parseInt(parts[0], 10);
          }
        } else {
          const parts = r.date.split("/");
          if (parts.length === 3) {
            m = parseInt(parts[1], 10) - 1;
            y = parseInt(parts[2], 10);
          }
        }
        acc[0] += getRevenueValue(r);
        if (m === currentMonth && y === currentYear) {
          acc[1] += 1;
        }
      }
      return acc;
    },
    [0, 0],
  );

  // Trend data over trendDays
  const trendData = useMemo(() => {
    const data: any[] = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const dateStrSlash = `${day}/${month}/${year}`;
      const dateStrDash = `${year}-${month}-${day}`;

      const dayRecords = userFilteredRecords.filter((r) => r.date === dateStrSlash || r.date === dateStrDash);
      const dayRevenue = sumRecordRevenue(dayRecords);

      data.push({
        date: `${day}/${month}`,
        records: dayRecords.length,
        revenue: dayRevenue,
      });
    }
    return data;
  }, [userFilteredRecords, trendDays]);

  // Deadline Warning & Overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  const upcomingCourtSessions = events.filter((e) => {
    if (e.type !== "Tòa án") return false;
    const dStr = e.startDate || e.date;
    if (!dStr) return false;
    const time = new Date(dStr).getTime();
    return time >= today.getTime();
  }).length;

  const upcomingMeetings = events.filter((e) => {
    if (e.type !== "Họp" && e.type !== "Gặp khách hàng") return false;
    const dStr = e.startDate || e.date;
    if (!dStr) return false;
    const time = new Date(dStr).getTime();
    return time >= today.getTime();
  }).length;

  const isOverdue = (deadlineStr: string, status: string) => {
    if (
      !deadlineStr ||
      (status &&
        typeof status === "string" &&
        status.toLowerCase().includes("hoàn thành"))
    )
      return false;
    let time = 0;
    if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
      time = new Date(deadlineStr).getTime();
    } else {
      const parts = deadlineStr.split("/");
      if (parts.length === 3) {
        time = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        ).getTime();
      }
    }
    return time > 0 && time < Date.now();
  };

  const overdueRecords = userFilteredRecords.filter((r) =>
    isOverdue(r.deadline, r.status),
  );
  const inProgressRecords = userFilteredRecords.filter(
    (r) => r.status && !r.status.toLowerCase().includes("hoàn thành"),
  );

  const parseDateToMs = (dateStr: string) => {
    if (!dateStr) return 0;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr + "T00:00:00").getTime();
    }
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      return new Date(y, m - 1, d).getTime();
    }
    return 0;
  };

  const nearingDeadlineRecords = userFilteredRecords
    .filter((r) => {
      if (
        !r.deadline ||
        (r.status &&
          typeof r.status === "string" &&
          r.status.toLowerCase().includes("hoàn thành"))
      )
        return false;
      const time = parseDateToMs(r.deadline);
      if (time === 0) return false;
      return time >= today.getTime() && time <= next7Days.getTime();
    })
    .sort((a, b) => {
      return parseDateToMs(a.deadline) - parseDateToMs(b.deadline);
    });

  // Records by category
  const recordsByCategory = userFilteredRecords.reduce(
    (acc, r) => {
      const type = r.type || "Khác";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const COLORS = [
    "var(--color-primary)",
    "#1A936F",
    "#F3A712",
    "#E85D04",
    "#8338EC",
    "#3A86FF",
    "#FF006E",
    "#00B4D8",
  ];

  return (
    <div className="space-y-6 min-h-[calc(100vh-140px)]">
      {/* Overview Cards container */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {language === "vi" ? "Chỉ số hoạt động" : "Operational Metrics"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* TỔNG SỐ HỒ SƠ */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08)" }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.02 }}
          className="bg-gradient-to-br from-[#2644d6] to-[#516aff] p-6 rounded-2xl shadow-md flex flex-col justify-between cursor-pointer relative overflow-hidden group border border-white/10"
          onClick={() => setActiveTab("records")}
        >
          <div className="absolute -right-4 -top-4 opacity-[0.12] group-hover:scale-125 transition-transform duration-700 ease-out text-white">
            <FolderOpen size={96} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[12px] font-bold text-white/90 uppercase tracking-widest">
              {t.totalRecords}
            </p>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10 shadow-sm text-white">
              <FolderOpen size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[34px] font-extrabold text-white leading-none tracking-tight">
              {totalRecords}
            </h3>
            <span className="text-xs font-semibold text-white/80">
              {language === "vi" ? "hồ sơ" : "records"}
            </span>
          </div>
        </motion.div>

        {/* ĐANG THỤ LÝ */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08)" }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04 }}
          className="bg-gradient-to-br from-[#8944fd] to-[#b17eff] p-6 rounded-2xl shadow-md flex flex-col justify-between cursor-pointer relative overflow-hidden group border border-white/10"
          onClick={() => {
            setActiveTab("records");
            setTimeout(
              () =>
                window.dispatchEvent(
                  new CustomEvent("set-record-tab", { detail: "Đang xử lý" }),
                ),
              50,
            );
          }}
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.12] group-hover:scale-125 transition-transform duration-700 ease-out text-white">
            <Clock size={96} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[12px] font-bold text-white/90 uppercase tracking-widest">
              {language === "vi" ? "ĐANG THỤ LÝ" : "IN PROGRESS"}
            </p>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10 shadow-sm text-white">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[34px] font-extrabold text-white leading-none tracking-tight">
              {inProgressRecords.length - overdueRecords.length}
            </h3>
            <span className="text-xs font-semibold text-white/80">
              {language === "vi" ? "hồ sơ" : "records"}
            </span>
          </div>
        </motion.div>

        {/* PHIÊN TÒA SẮP TỚI */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08)" }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="bg-gradient-to-br from-[#ff7e00] to-[#ffab4a] p-6 rounded-2xl shadow-md flex flex-col justify-between cursor-pointer relative overflow-hidden group border border-white/10"
          onClick={() => setActiveTab("events")}
        >
          <div className="absolute -right-4 -top-4 opacity-[0.15] group-hover:scale-125 transition-transform duration-700 ease-out text-white">
            <Gavel size={96} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[12px] font-bold text-white/90 uppercase tracking-widest">
              {t.upcomingCourts}
            </p>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10 shadow-sm text-white">
              <Gavel size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[34px] font-extrabold text-white leading-none tracking-tight">
              {upcomingCourtSessions}
            </h3>
            <span className="text-xs font-semibold text-white/80">
              {language === "vi" ? "hiện có" : "upcoming"}
            </span>
          </div>
        </motion.div>

        {/* DOANH THU THÁNG NÀY */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08)" }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-gradient-to-br from-[#0ab67b] to-[#1de1a2] p-6 rounded-2xl shadow-md flex flex-col justify-between cursor-pointer relative overflow-hidden group border border-white/10"
          onClick={() => setActiveTab("statistics")}
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.12] group-hover:scale-125 transition-transform duration-700 ease-out text-white">
            <BarChart3 size={96} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[12px] font-bold text-white/90 uppercase tracking-widest">
              {t.monthlyRevenue}
            </p>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10 shadow-sm text-white">
              <BarChart3 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[34px] font-extrabold text-white leading-none tracking-tight">
              {(monthlyRevenue / 1000000).toLocaleString("vi-VN")}
            </h3>
            <span className="text-xs font-semibold text-white/80">
              Tr VNĐ
            </span>
          </div>
        </motion.div>
      </div>
    </div>

      {/* Biểu đồ doanh thu từ vụ việc đã hoàn thành */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg">
                <TrendingUp size={18} />
              </span>
              {language === "vi" ? "Biểu đồ Doanh Thu Văn Phòng Theo Thời Gian" : "Office Revenue Over Time"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === "vi" 
                ? "Dữ liệu được thống kê từ các vụ việc đã hoàn thành dựa trên trường 'retainerPaid'." 
                : "Aggregated from 'retainerPaid' of all completed cases."}
            </p>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setChartMode("daily")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartMode === "daily" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {language === "vi" ? "Từng ngày" : "Daily"}
              </button>
              <button
                onClick={() => setChartMode("cumulative")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartMode === "cumulative" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {language === "vi" ? "Lũy kế" : "Cumulative"}
              </button>
            </div>
          </div>
        </div>

        <div className={`w-full pt-4 ${isDashboardFS ? "h-[380px]" : "h-[320px]"}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: "#64748b" }} 
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `${value}M`}
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const val = payload[0].value as number;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 max-w-[280px] space-y-2 text-left">
                        <div className="text-xs font-bold border-b border-slate-800 pb-1 text-slate-400">
                          {data.date}
                        </div>
                        <div className="text-sm font-bold text-emerald-400">
                          {chartMode === "daily" ? (
                            <>Doanh thu ngày: {(val * 1000000).toLocaleString("vi-VN")} VNĐ</>
                          ) : (
                            <>Doanh thu lũy kế: {(val * 1000000).toLocaleString("vi-VN")} VNĐ</>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                          <p className="font-bold text-slate-300">Vụ việc hoàn thành ({data.count || 1}):</p>
                          {data.titles?.map((t: string, i: number) => (
                            <p key={i} className="truncate">• {t}</p>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey={chartMode === "daily" ? "amount" : "cumulative"}
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Realtime Monitoring Dashboard */}
      <div className="w-full space-y-2 mt-6">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {language === "vi" ? "Giám sát thời gian thực & Bản đồ nghiệp vụ" : "Real-time Monitoring & Operations Map"}
          </span>
        </div>
        
        <RealtimeMonitoringDashboard language={language} records={records} users={users} events={events} defaultTab="lawfirm_overview" />
      </div>
    </div>
  );
}

function Employees({
  language = "vi",
  users,
  myPermissions,
  records = [],
  events = [],
  user,
  dynamicBranchOptions = ["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh"],
}: {
  language?: "vi" | "en";
  users: any[];
  myPermissions?: any;
  records?: any[];
  events?: any[];
  user?: any;
  dynamicBranchOptions?: string[];
}) {
  const t = {
    vi: {
      payroll: "Bảng lương",
      info: "Thông tin nhân sự",
      performance: "Hiệu suất / Tải công việc",
      bonus: "Thưởng/Đánh giá",
      exportExcel: "Xuất Excel",
      importExcel: "Nhập Excel",
      importAlert: "Tính năng nhập Excel đang được phát triển.",
      exportAlert: "Tính năng xuất Excel đang được phát triển.",
      payrollMonth: "Bảng lương tháng",
      addPersonnel: "Thêm nhân sự",
      no: "STT",
      fullName: "HỌ VÀ TÊN",
      empCode: "MÃ NS",
      position: "CHỨC DANH",
      branch: "CHI NHÁNH",
      workingDays: "NGÀY CÔNG",
      basicSalary: "LƯƠNG CB",
      insurance: "BHXH",
      tax: "THUẾ TNCN",
      netSalary: "THỰC NHẬN",
      username: "TÊN ĐĂNG NHẬP",
      startDate: "NGÀY BẮT ĐẦU",
      contractType: "LOẠI HỢP ĐỒNG",
      details: "CHI TIẾT",
      viewDetails: "Chi tiết",
      addPayrollTitle: "Thêm nhân sự vào bảng lương",
      personnelName: "Tên nhân sự",
      editPersonnelInfo: "Chỉnh sửa thông tin nhân sự",
      selectPersonnel: "Chọn nhân sự",
      empCodeAuto: "Mã nhân sự (Tự động)",
      empCodeNote: "Mã = Mã chức danh viết tắt + STT",
      positionLabel: "Chức danh",
      branchLabel: "Chi nhánh",
      workingDaysLabel: "Số ngày công",
      dependentsLabel: "Số người phụ thuộc",
      basicSalaryLabel: "Lương cơ bản",
      insuranceLabel: "BHXH",
      taxLabel: "Thuế TNCN",
      netSalaryLabel: "Thực nhận",
      cancel: "Hủy bỏ",
      saveInfo: "Lưu thông tin",
      noData: "Chưa có dữ liệu",
      addEvaluation: "Thêm đánh giá",
      rating: "Xếp loại",
      bonusAmount: "Mức thưởng",
      notes: "Ghi chú",
      edit: "Sửa",
      deleteConfirm: "Bạn có chắc chắn muốn xóa đánh giá này?",
      addEvalTitle: "Thêm đánh giá nhân sự",
      editEvalTitle: "Sửa đánh giá nhân sự",
    },
    en: {
      payroll: "Payroll",
      info: "Personnel Info",
      performance: "Performance / Workload",
      bonus: "Bonus/Evaluation",
      exportExcel: "Export Excel",
      importExcel: "Import Excel",
      importAlert: "Import Excel feature is under development.",
      exportAlert: "Export Excel feature is under development.",
      payrollMonth: "Payroll Month",
      addPersonnel: "Add Personnel",
      no: "No.",
      fullName: "FULL NAME",
      empCode: "EMP CODE",
      position: "POSITION",
      branch: "BRANCH",
      workingDays: "WORKING DAYS",
      basicSalary: "BASIC SALARY",
      insurance: "INSURANCE",
      tax: "TAX",
      netSalary: "NET SALARY",
      username: "USERNAME",
      startDate: "START DATE",
      contractType: "CONTRACT TYPE",
      details: "DETAILS",
      viewDetails: "Details",
      addPayrollTitle: "Add personnel to payroll",
      personnelName: "Personnel Name",
      editPersonnelInfo: "Edit personnel info",
      selectPersonnel: "Select personnel",
      empCodeAuto: "Employee Code (Auto)",
      empCodeNote: "Code = Position abbreviation + No.",
      positionLabel: "Position",
      branchLabel: "Branch",
      workingDaysLabel: "Working Days",
      dependentsLabel: "Dependents",
      basicSalaryLabel: "Basic Salary",
      insuranceLabel: "Insurance",
      taxLabel: "Tax",
      netSalaryLabel: "Net Salary",
      cancel: "Cancel",
      saveInfo: "Save Info",
      noData: "No data available",
      addEvaluation: "Add Evaluation",
      rating: "Rating",
      bonusAmount: "Bonus Amount",
      notes: "Notes",
      edit: "Edit",
      deleteConfirm: "Are you sure you want to delete this evaluation?",
      addEvalTitle: "Add Personnel Evaluation",
      editEvalTitle: "Edit Personnel Evaluation",
    },
  }[language];

  const translateTitle = (title: string) => {
    return translateRole(title, language);
  };

  const userRoleDb = mapRoleToDb(user?.role || "");
  const hasQcWriteAccess = userRoleDb === 'admin' || userRoleDb === 'director' || userRoleDb === 'controller' || userRoleDb === 'prosecutor';
  const hasQcViewAllAccess = ['admin', 'director', 'controller', 'prosecutor', 'accountant'].includes(userRoleDb);

  const [activeTab, setActiveTab] = useState<
    "kpi_monitor" | "info" | "payroll" | "performance" | "bonus" | "qc"
  >("kpi_monitor");
  const [bonusSubTab, setBonusSubTab] = useState<"personnel" | "team">("personnel");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "user" | "payroll" | "evaluation";
    id: number;
  } | null>(null);

  // QC Grading System states
  const [qcRules, setQcRules] = useState<any[]>([]);
  const [qcRecords, setQcRecords] = useState<any[]>([]);
  const [qcSubTab, setQcSubTab] = useState<"summary" | "records" | "rules">("summary");
  const [isQcRecordModalOpen, setIsQcRecordModalOpen] = useState(false);
  const [isQcRuleModalOpen, setIsQcRuleModalOpen] = useState(false);
  const [selectedQcRecord, setSelectedQcRecord] = useState<any>(null);
  const [selectedQcRule, setSelectedQcRule] = useState<any>(null);

  // QC Record Form states
  const [qcRecordUserId, setQcRecordUserId] = useState<string>("");
  const [qcRecordRuleCode, setQcRecordRuleCode] = useState<string>("");
  const [qcRecordNote, setQcRecordNote] = useState<string>("");

  // QC Rule Form states
  const [qcRuleCode, setQcRuleCode] = useState<string>("");
  const [qcRuleName, setQcRuleName] = useState<string>("");
  const [qcRuleType, setQcRuleType] = useState<"violation" | "bonus">("violation");
  const [qcRulePoints, setQcRulePoints] = useState<number>(-10);
  const [qcRuleMoney, setQcRuleMoney] = useState<number>(-150000);
  const [qcRuleCategory, setQcRuleCategory] = useState<string>("Chuyên môn");
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    const filtered = filterNonAdminPersonnel(users).filter((u) => {
      if (u.role === "client") return false;
      const ms =
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.staff_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const mr =
        roleFilter === "all" || u.title === roleFilter || u.role === roleFilter;
      const mb = branchFilter === "all" || u.branch === branchFilter;
      return ms && mr && mb;
    });

    return [...filtered].sort((a, b) => {
      const codeA = a.staff_code || "";
      const codeB = b.staff_code || "";
      const numA = Number(codeA.match(/\d+$/)?.[0] || 999);
      const numB = Number(codeB.match(/\d+$/)?.[0] || 999);
      return numA - numB;
    });
  }, [users, searchTerm, roleFilter, branchFilter]);

  const uniqueRoles = useMemo(
    () =>
      Array.from(new Set(filteredUsers.filter((u)=>u.role!=='client').map((u) => u.title || u.role).filter(Boolean))),
    [filteredUsers],
  );
  const uniqueBranches = useMemo(
    () => Array.from(new Set(filteredUsers.filter((u)=>u.role!=='client').map((u) => u.branch).filter(Boolean))),
    [filteredUsers],
  );

  const [performancePeriod, setPerformancePeriod] = useState<
    "all" | "this_month" | "last_month"
  >("all");

  const performanceData = useMemo(() => {
    const targetMonthStr = `${String(currentMonth).padStart(2, "0")}/${currentYear}`;

    return filteredUsers.map((u) => {
      const uName = u.name;
      const uUsername = u.username;

      let uRecords = records.filter(
        (r) =>
          r.mainAssignee === uName ||
          r.mainAssignee === uUsername ||
          r.lawyer === uName ||
          r.subAssignee === uName ||
          r.authStaff1 === uName ||
          r.authStaff2 === uName ||
          r.authStaff3 === uName ||
          r.manager === uName ||
          r.specialist === uName ||
          r.userEA === uName ||
          r.userEA === uUsername,
      );

      // Filtering for the chosen month
      uRecords = uRecords.filter(
        (r) => r.date && r.date.includes(targetMonthStr),
      );

      const total = uRecords.length;
      const completed = uRecords.filter(
        (r) => r.status && r.status.toLowerCase().includes("hoàn thành"),
      ).length;
      const inProgress = total - completed;

      const overdue = uRecords.filter((r) => {
        if (
          !r.deadline ||
          (r.status && r.status.toLowerCase().includes("hoàn thành"))
        )
          return false;
        let time = 0;
        if (/^\d{4}-\d{2}-\d{2}$/.test(r.deadline)) {
          time = new Date(r.deadline).getTime();
        } else {
          const parts = r.deadline.split("/");
          if (parts.length === 3) {
            time = new Date(
              parseInt(parts[2]),
              parseInt(parts[1]) - 1,
              parseInt(parts[0]),
            ).getTime();
          }
        }
        return time > 0 && time < Date.now();
      }).length;

      const revenue = uRecords.reduce((sum, r) => sum + (Number((r.feeAmount || r.revenue || "0").toString().replace(/,/g, "")) || 0), 0);

      return {
        ...u,
        totalCases: total,
        completedCases: completed,
        inProgressCases: inProgress,
        overdueCases: overdue,
        revenue: revenue
      };
    });
  }, [filteredUsers, records, currentMonth, currentYear]);

  const bonusStats = useMemo(() => {
    const monthEvals = evaluations || [];
    const total = monthEvals.reduce((acc, ev) => acc + (ev.bonus_amount || 0), 0);
    
    // Max individual
    const individualEvals = monthEvals.filter(ev => (ev.target_type || 'personnel') === 'personnel');
    const maxIndiv = individualEvals.length > 0 ? Math.max(...individualEvals.map(ev => ev.bonus_amount || 0)) : 0;
    
    // Top department / team
    const groupEvals = monthEvals.filter(ev => (ev.target_type || 'personnel') !== 'personnel');
    let topGroup = "-";
    let maxGroupAmt = 0;
    groupEvals.forEach(ev => {
      if ((ev.bonus_amount || 0) > maxGroupAmt) {
        maxGroupAmt = ev.bonus_amount || 0;
        topGroup = ev.target_name || "-";
      }
    });

    return { total, maxIndiv, topGroup, maxGroupAmt };
  }, [evaluations]);

  const chartData = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    (evaluations || []).forEach(ev => {
      const key = ev.target_type === 'personnel' 
        ? (ev.user_name || ev.staff_code || `Nhân sự ${ev.user_id || ''}`.trim() || 'Cá nhân') 
        : (ev.target_name || 'Tập thể');
      grouped[key] = (grouped[key] || 0) + (ev.bonus_amount || 0);
    });
    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [evaluations]);

  const [formData, setFormData] = useState<any>({
    user_id: "",
    staff_code: "",
    title: "",
    branch: "",
    bank: "",
    bank_account: "",
    working_days: 26,
    dependents: 0,
    gross: 0,
    food_allowance: 0,
    gas_allowance: 0,
    phone_allowance: 0,
    other_benefits: 0,
    bonus: 0,
    violations: 0,
    insurance: 0,
    tax: 0,
    total_salary: 0,
    net: 0,
  });

  const [evalFormData, setEvalFormData] = useState<any>({
    user_id: "",
    rating: "A",
    bonus_amount: 0,
    notes: "",
    target_type: "personnel",
    target_name: "",
  });

  const loadPayrolls = () => {
    api
      .req(`/api/monthly-payrolls?month=${currentMonth}&year=${currentYear}`)
      .then((data: any[]) => setPayrolls(data.map((d: any) => calculateFullPayroll(d))))
      .catch(console.error);
  };

  const loadEvaluations = () => {
    api
      .req(`/api/evaluations?month=${currentMonth}&year=${currentYear}`)
      .then(setEvaluations)
      .catch(console.error);
  };

  const loadQcRules = () => {
    api
      .req(`/api/qc-rules`)
      .then(setQcRules)
      .catch(console.error);
  };

  const loadQcRecords = () => {
    api
      .req(`/api/qc-records?month=${currentMonth}&year=${currentYear}`)
      .then(setQcRecords)
      .catch(console.error);
  };

  useEffect(() => {
    loadPayrolls();
    loadEvaluations();
    loadQcRules();
    loadQcRecords();
  }, [currentMonth, currentYear]);

  const generateStaffCode = (title: string, userId: string | number) => {
    if (!title) return `NV${String(userId).padStart(3, "0")}`;
    const words = title.trim().split(/\s+/);
    let prefix = "";
    if (words.length === 1) {
      prefix = words[0].substring(0, 2).toUpperCase();
    } else {
      prefix = words.map((w) => w[0].toUpperCase()).join("");
    }
    prefix = prefix
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/Đ/g, "D");
    return `${prefix}${String(userId).padStart(3, "0")}`;
  };


  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    const user = users.find((u) => u.id.toString() === userId);
    if (user) {
      const existingPayroll = payrolls.find(
        (p) => p.user_id.toString() === userId,
      );
      if (existingPayroll) {
        let newData = {
          id: existingPayroll.id,
          user_id: userId,
          staff_code:
            existingPayroll.staff_code ||
            user.staff_code ||
            generateStaffCode(
              existingPayroll.title || user.title || user.role || "",
              userId,
            ),
          title: existingPayroll.title || user.title || user.role || "",
          branch: existingPayroll.branch || user.branch || "",
          bank: existingPayroll.bank || user.bank || "",
          bank_account: existingPayroll.bank_account || user.bank_account || "",
          working_days: existingPayroll.working_days || 26,
          dependents: existingPayroll.dependents || 0,
          gross: existingPayroll.gross || 0,
          food_allowance: existingPayroll.food_allowance || 0,
          gas_allowance: existingPayroll.gas_allowance || 0,
          phone_allowance: existingPayroll.phone_allowance || 0,
          other_benefits: existingPayroll.other_benefits || 0,
          bonus: existingPayroll.bonus || 0,
          violations: existingPayroll.violations || 0,
          insurance: existingPayroll.insurance || 0,
          tax: existingPayroll.tax || 0,
          total_salary: existingPayroll.total_salary || 0,
          net: existingPayroll.net || 0,
        };
        setFormData(calculateFullPayroll(newData));
      } else {
        const defaultGross = user?.salary ? Number(String(user.salary).replace(/[^0-9]/g, '')) || 0 : 0;
        let newData = {
          id: undefined,
          user_id: userId,
          staff_code:
            user.staff_code ||
            generateStaffCode(user.title || user.role || "", userId),
          title: user.title || user.role || "",
          branch: user.branch || "Hà Nội",
          bank: user.bank || "",
          bank_account: user.bank_account || "",
          working_days: 26,
          dependents: 0,
          gross: defaultGross,
          food_allowance: 0,
          gas_allowance: 0,
          phone_allowance: 0,
          other_benefits: 0,
          bonus: 0,
          violations: 0,
          insurance: 0,
          tax: 0,
          total_salary: defaultGross,
          net: defaultGross,
        };
        setFormData(calculateFullPayroll(newData));
      }
    } else {
      setFormData({
        user_id: "",
        staff_code: "",
        title: "",
        branch: "",
        bank: "",
        bank_account: "",
        working_days: 26,
        dependents: 0,
        gross: 0,
        food_allowance: 0,
        gas_allowance: 0,
        phone_allowance: 0,
        other_benefits: 0,
        bonus: 0,
        violations: 0,
        insurance: 0,
        tax: 0,
        total_salary: 0,
        net: 0,
      });
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const newData = {
        ...prev,
        [name]:
          name === "staff_code" ||
          name === "title" ||
          name === "branch" ||
          name === "bank" ||
          name === "bank_account"
            ? value
            : Number(value),
      };

      if (name === "title" && !prev.staff_code) {
        newData.staff_code = generateStaffCode(value, prev.user_id);
      }

      // Auto calculate taxes when dependents changes
      if (name === "dependents") {
        const calcs = calculatePayrollTaxes(
          newData.gross || 0,
          newData.dependents || 0,
        );
        newData.insurance = calcs.insurance;
        newData.tax = calcs.tax;
      }

      return calculateFullPayroll(newData);
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let rawValue = value.replace(/,/g, "");
    rawValue = rawValue.replace(/^0+(?=\d)/, "");
    let numValue = Number(rawValue);

    if (rawValue === "") {
      numValue = 0;
    }

    if (!isNaN(numValue)) {
      setFormData((prev: any) => {
        const newData = { ...prev, [name]: numValue };

        // Auto calculate taxes when gross salary changes
        if (name === "gross") {
          const calcs = calculatePayrollTaxes(
            newData.gross || 0,
            newData.dependents || 0,
          );
          newData.insurance = calcs.insurance;
          newData.tax = calcs.tax;
        }

        return calculateFullPayroll(newData);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id) return;

    await api.req("/api/monthly-payrolls", "POST", {
      ...formData,
      month: currentMonth,
      year: currentYear,
    });

    setIsModalOpen(false);
    loadPayrolls();
  };

  const handleDelete = (id: number) => {
    setItemToDelete({ type: "payroll", id });
  };

  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (evalFormData.target_type === "personnel" && !evalFormData.user_id) return;
    if (evalFormData.target_type !== "personnel" && !evalFormData.target_name) return;

    await api.req("/api/evaluations", "POST", {
      ...evalFormData,
      month: currentMonth,
      year: currentYear,
    });

    setIsEvalModalOpen(false);
    loadEvaluations();
    loadPayrolls();
  };

  const handleEvalDelete = (id: number) => {
    setItemToDelete({ type: "evaluation", id });
  };

  const handleQcRecordDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa bản ghi này? Điểm và lương của nhân sự liên quan sẽ được tự động cập nhật lại.")) {
      try {
        await api.req(`/api/qc-records/${id}`, "DELETE");
        loadQcRecords();
        loadPayrolls();
        loadEvaluations();
      } catch (err: any) {
        alert(err.message || "Lỗi khi xóa bản ghi");
      }
    }
  };

  const handleQcRuleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa mã lỗi này?")) {
      try {
        await api.req(`/api/qc-rules/${id}`, "DELETE");
        loadQcRules();
      } catch (err: any) {
        alert(err.message || "Lỗi khi xóa mã lỗi");
      }
    }
  };

  const handleQcRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcRecordUserId || !qcRecordRuleCode) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      await api.req("/api/qc-records", "POST", {
        id: selectedQcRecord?.id,
        user_id: Number(qcRecordUserId),
        rule_code: qcRecordRuleCode,
        month: currentMonth,
        year: currentYear,
        note: qcRecordNote,
      });
      setIsQcRecordModalOpen(false);
      loadQcRecords();
      loadPayrolls();
      loadEvaluations();
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu bản ghi");
    }
  };

  const handleQcRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcRuleCode || !qcRuleName) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      await api.req("/api/qc-rules", "POST", {
        id: selectedQcRule?.id,
        code: qcRuleCode,
        name: qcRuleName,
        type: qcRuleType,
        points_effect: Number(qcRulePoints),
        money_effect: Number(qcRuleMoney),
        category: qcRuleCategory,
      });
      setIsQcRuleModalOpen(false);
      loadQcRules();
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu mã lỗi");
    }
  };

  const handleDeleteUser = (id: number) => {
    setItemToDelete({ type: "user", id });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "user") {
        const targetUser = users.find(u => u.id === itemToDelete.id);
        if (targetUser?.role === "admin" || targetUser?.username === "admin") {
          alert(language === "vi" ? "Không thể xóa tài khoản quản trị viên." : "Cannot delete administrator accounts");
          setItemToDelete(null);
          return;
        }
        await api.req(`/api/users/${itemToDelete.id}`, "DELETE");
        window.location.reload();
      } else if (itemToDelete.type === "payroll") {
        await api.req(`/api/monthly-payrolls/${itemToDelete.id}`, "DELETE");
        loadPayrolls();
      } else if (itemToDelete.type === "evaluation") {
        await api.req(`/api/evaluations/${itemToDelete.id}`, "DELETE");
        loadEvaluations();
        loadPayrolls();
      }
    } catch (e) {
      console.error(e);
      alert(
        language === "vi" ? "Có lỗi xảy ra khi xóa" : "Error deleting record",
      );
    }

    setItemToDelete(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      {itemToDelete && (
        <div
          style={{ zIndex: 999999 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 custom-scrollbar"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">
              <h3 className="text-2xl font-bold font-serif text-[var(--color-text-dark)] mb-4">
                Xóa bài viết
              </h3>
              <p className="text-gray-700 text-lg">
                Bạn có chắc chắn muốn xóa bài viết này?
                <br />
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex gap-4 p-6 justify-center">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg transition-all duration-300 hover:bg-gray-50 transition-all duration-300 active:scale-95"
              >
                Không (No)
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg transition-all duration-300 hover:bg-red-700 transition-all duration-300 active:scale-95 flex items-center gap-2"
              >
                <Trash2 size={18} /> Có (Yes)
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900">
              {language === "vi" ? "Dữ liệu" : "Data for"}
            </h1>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-4 py-2 text-lg font-bold border border-slate-200 rounded-lg bg-white text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {language === "vi" ? `Tháng ${m}` : `Month ${m}`}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-4 py-2 text-lg font-bold border border-slate-200 rounded-lg bg-white text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - 2 + i,
              ).map((y) => (
                <option key={y} value={y}>
                  {language === "vi" ? `Năm ${y}` : `Year ${y}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all duration-300 hover:bg-slate-100 transition-all duration-300 active:scale-95 hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 border-b border-slate-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("kpi_monitor")}
              className={cn(
                "pb-4 font-medium transition-all duration-300 active:scale-95 relative flex items-center gap-2",
                activeTab === "kpi_monitor"
                  ? "text-[var(--color-primary)] font-bold"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Activity className="w-4 h-4 text-amber-500" />
              {language === "vi" ? "Giám sát Nhân sự & KPI" : "HR & KPI Dashboard"}
              {activeTab === "kpi_monitor" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={cn(
                "pb-4 font-medium transition-all duration-300 active:scale-95 relative",
                activeTab === "info"
                  ? "text-[var(--color-primary)]"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {t.info}
              {activeTab === "info" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("payroll")}
              className={cn(
                "pb-4 font-medium transition-all duration-300 active:scale-95 relative",
                activeTab === "payroll"
                  ? "text-[var(--color-primary)]"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {t.payroll}
              {activeTab === "payroll" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={cn(
                "pb-4 font-medium transition-all duration-300 active:scale-95 relative",
                activeTab === "performance"
                  ? "text-[var(--color-primary)]"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {t.performance}
              {activeTab === "performance" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("bonus")}
              className={cn(
                "pb-4 font-medium transition-all duration-300 active:scale-95 relative",
                activeTab === "bonus"
                  ? "text-[var(--color-primary)]"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {t.bonus}
              {activeTab === "bonus" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("qc")}
              className={cn(
                "pb-4 font-medium transition-all duration-300 active:scale-95 relative",
                activeTab === "qc"
                  ? "text-[var(--color-primary)]"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {language === "vi" ? "Thi đua & Kỷ luật (QC)" : "QC & Discipline"}
              {activeTab === "qc" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md" />
              )}
            </button>
          </div>
          <div className="flex gap-3 pb-4">
            <button
              onClick={() =>
                alert(t.exportAlert || "Tính năng đang được phát triển")
              }
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3b82f6] via-[#0ea5e9] to-[#2563eb] bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide text-white rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              {t.exportExcel}
            </button>
            <button
              onClick={() =>
                alert(t.importAlert || "Tính năng đang được phát triển")
              }
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#10b981] via-[#14b8a6] to-[#059669] bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide text-white rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm"
            >
              <Upload className="w-4 h-4" />
              {t.importExcel}
            </button>
          </div>
        </div>

        {activeTab === "kpi_monitor" && (
          <div className="space-y-6 mb-6">
            <RealtimeMonitoringDashboard language={language} records={records} users={users} events={events} defaultTab="hr_dashboard" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide">Chỉ Số Hiệu Suất & KPI Nhân Sự</h4>
                <p className="text-xs text-slate-500 font-medium">Giám sát năng suất công việc, điểm chuyên cần, xếp hạng và đánh giá chất lượng nhân sự</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leaderboard ranking */}
              <div className="lg:col-span-1 bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800 space-y-4">
                <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Star size={16} className="text-amber-500 shrink-0" /> Bảng Xếp Hạng Hiệu Suất
                </h4>
                <div className="space-y-3">
                  {users
                    .filter((u: any) => u.role !== "client")
                    .map((emp: any) => {
                      const empRecords = records.filter(
                        (r: any) =>
                          r.lawyer === emp.name ||
                          r.created_by === emp.name ||
                          r.assigned_to === emp.name ||
                          (r.data && (r.data.lawyerInCharge === emp.name || r.data.assignedLawyer === emp.name))
                      );
                      const completedCount = empRecords.filter(
                        (r: any) => r.status === "da_hoan_thanh" || r.status === "da_xuly" || (r.data && r.data.status === "Đã hoàn thành")
                      ).length;
                      const realKpi = emp.kpi 
                        ? Number(emp.kpi) 
                        : empRecords.length > 0 
                          ? Math.min(99, Math.max(78, Math.round(78 + (completedCount / Math.max(1, empRecords.length)) * 15 + empRecords.length * 2)))
                          : 85;
                      const rankGrade = realKpi >= 90 ? "Xuất sắc" : realKpi >= 80 ? "Tốt" : "Đạt";
                      const roleDisplay = emp.title || translateTitle(emp.role || "") || "Nhân sự";
                      return { ...emp, realKpi, rankGrade, roleDisplay, handledCount: empRecords.length };
                    })
                    .sort((a, b) => b.realKpi - a.realKpi)
                    .map((emp, index) => (
                      <div key={emp.name || emp.id || index} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center font-black rounded-lg text-xs ${
                            index === 0 ? "bg-amber-500 text-slate-950 shadow-sm" : index === 1 ? "bg-slate-300 text-slate-800" : index === 2 ? "bg-amber-700/30 text-amber-900" : "bg-slate-100 text-slate-600"
                          }`}>{index + 1}</span>
                          <div>
                            <p className="text-xs font-black text-slate-800">{emp.name || emp.username}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{emp.roleDisplay} • {emp.handledCount} vụ việc</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-amber-600 font-mono">{emp.realKpi}%</p>
                          <span className={`text-[10px] font-bold ${emp.realKpi >= 90 ? "text-emerald-600" : emp.realKpi >= 80 ? "text-blue-600" : "text-amber-600"}`}>{emp.rankGrade}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Performance chart */}
              <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-md text-slate-800">
                <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Phân Tích So Sánh Hiệu Suất Tác Vụ</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: "Xử lý hồ sơ", A: 120, B: 110, fullMark: 150 },
                      { subject: "Thỏa mãn khách", A: 98, B: 130, fullMark: 150 },
                      { subject: "Báo cáo SLA", A: 86, B: 130, fullMark: 150 },
                      { subject: "Nghiệp vụ tòa", A: 99, B: 100, fullMark: 150 },
                      { subject: "Cộng tác nội bộ", A: 85, B: 90, fullMark: 150 },
                      { subject: "Thu hồi phí nợ", A: 65, B: 85, fullMark: 150 }
                    ]}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                      <PolarRadiusAxis stroke="#64748b" fontSize={10} />
                      <Radar name="Phòng Tranh Tụng" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                      <Radar name="Phòng Tư Vấn" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-blue-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <FolderOpen size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Tổng Vụ Việc" : "Total Cases"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {performanceData.reduce((acc, curr) => acc + (typeof curr.totalCases === 'number' ? curr.totalCases : 0), 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-amber-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Clock size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Đang Thụ Lý" : "In Progress"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {performanceData.reduce((acc, curr) => acc + (typeof curr.inProgressCases === 'number' ? curr.inProgressCases : 0), 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-emerald-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Đã Đóng" : "Closed"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {performanceData.reduce((acc, curr) => acc + (typeof curr.completedCases === 'number' ? curr.completedCases : 0), 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-red-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <AlertCircle size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Quá Hạn" : "Overdue"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {performanceData.reduce((acc, curr) => acc + (typeof curr.overdueCases === 'number' ? curr.overdueCases : 0), 0)}
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-indigo-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <TrendingUp size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Doanh Thu (VNĐ)" : "Revenue"}
              </div>
              <div className="text-2xl font-bold text-white drop-shadow-md relative z-10">
                {(() => {
                  const totalRev = performanceData.reduce((acc, curr) => acc + (typeof curr.revenue === 'number' ? curr.revenue : 0), 0);
                  if (totalRev >= 1000000000) {
                    return (totalRev / 1000000000).toFixed(1) + " Tỷ";
                  } else if (totalRev >= 1000000) {
                    return (totalRev / 1000000).toFixed(1) + " Tr";
                  }
                  return new Intl.NumberFormat('en-US').format(totalRev);
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-blue-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Users size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Tổng nhân sự" : "Total Employees"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {users.length}
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-emerald-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Building2 size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Số phòng ban" : "Total Branches"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {uniqueBranches.length}
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-amber-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Briefcase size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Số chức danh" : "Total Roles"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {uniqueRoles.length}
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-purple-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Eye size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Nhân sự xem" : "Showing"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {filteredUsers.length}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row gap-4 md:items-center justify-between border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 shrink-0">
              {activeTab === "payroll"
                ? `${t.payrollMonth} ${currentMonth}`
                : activeTab === "info"
                  ? t.info
                  : activeTab === "performance"
                    ? t.performance
                    : t.bonus}
            </h2>

            {(activeTab === "info" || activeTab === "performance") && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      language === "vi"
                        ? "Tìm nhân sự..."
                        : "Search employees..."
                    }
                    className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                >
                  <option value="all">
                    {language === "vi" ? "Tất cả chức danh" : "All Roles"}
                  </option>
                  {uniqueRoles.map((r) => (
                    <option key={r} value={r}>
                      {translateTitle(r)}
                    </option>
                  ))}
                </select>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                >
                  <option value="all">
                    {language === "vi" ? "Tất cả chi nhánh" : "All Branches"}
                  </option>
                  {uniqueBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                {activeTab === "performance" && (
                  <select
                    value={performancePeriod}
                    onChange={(e) =>
                      setPerformancePeriod(e.target.value as any)
                    }
                    className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-[var(--color-primary)] transition-all font-bold text-[var(--color-primary)]"
                  >
                    <option value="all">
                      {language === "vi" ? "Tất cả thời gian" : "All Time"}
                    </option>
                    <option value="this_month">
                      {language === "vi" ? "Tháng này" : "This Month"}
                    </option>
                    <option value="last_month">
                      {language === "vi" ? "Tháng trước" : "Last Month"}
                    </option>
                  </select>
                )}
              </div>
            )}

            {activeTab === "payroll" && (
              <button
                onClick={() => {
                  setFormData({
                    user_id: "",
                    staff_code: "",
                    title: "",
                    branch: "",
                    working_days: 26,
                    dependents: 0,
                    gross: 0,
                    insurance: 0,
                    tax: 0,
                    net: 0,
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                {t.addPersonnel}
              </button>
            )}
            {activeTab === "bonus" && (
              <button
                onClick={() => {
                  setEvalFormData({
                    user_id: "",
                    rating: "A",
                    bonus_amount: 0,
                    notes: "",
                    target_type: bonusSubTab === "team" ? "department" : "personnel",
                    target_name: bonusSubTab === "team" ? "Phòng Tranh tụng" : "",
                  });
                  setIsEvalModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                {t.addEvaluation}
              </button>
            )}
          </div>

          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
            {activeTab === "info" ? (
              <div className="rounded-xl border border-indigo-100 shadow-sm overflow-x-auto bg-white mb-4">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.no}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.empCode}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.fullName}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.position}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.branch}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.username}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.startDate}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.contractType}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">
                      {t.details}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-slate-50/80 group"
                    >
                      <td className="px-6 py-4 text-slate-600 font-medium">{i + 1}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">{u.staff_code || `NV${String(u.id).padStart(3, "0")}`}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {u.name}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-[13px]">
                        {translateTitle(u.title || u.role || "-")}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-[13px]">
                        {u.branch || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium text-[13px]">{u.username}</td>
                      <td className="px-6 py-4 text-slate-600 text-[13px]">
                        {formatDisplayDate(u.start_date)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">{u.contract_type || "-"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsUserDetailsModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-white transition-all duration-300 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all duration-300 active:scale-95 text-xs font-medium border border-slate-200 shadow-sm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            {t.edit}
                          </button>
                          {!isAdminAccount(u) && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-red-500 transition-all duration-300 hover:bg-red-50 rounded-lg transition-all duration-300 active:scale-95 border border-transparent"
                              title={t.deleteConfirm ? "Delete" : "Xóa"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        {t.noData}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            ) : activeTab === "payroll" ? (
              <div className="rounded-xl border border-indigo-100 shadow-sm overflow-x-auto bg-white mb-4">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.no}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.fullName}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.empCode}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.position}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.branch}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-left whitespace-nowrap">
                      {t.workingDays}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-left whitespace-nowrap">
                      {t.basicSalary}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-left whitespace-nowrap">
                      {language === "vi" ? "THƯỞNG" : "BONUS"}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-left whitespace-nowrap">
                      {t.insurance}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-left whitespace-nowrap">
                      {t.tax}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-left whitespace-nowrap">
                      {t.netSalary}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-left whitespace-nowrap">
                      {t.details}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredUsers.map((u, i) => {
                    const defaultGross = u.salary ? Number(String(u.salary).replace(/[^0-9]/g, '')) || 0 : 0;
                    const defaultP = calculateFullPayroll({
                      staff_code: u.staff_code || `NV${String(u.id).padStart(3, "0")}`,
                      working_days: 26,
                      gross: defaultGross,
                      bonus: 0,
                      insurance: 0,
                      tax: 0,
                      net: defaultGross,
                    });
                    const p = payrolls.find(pr => pr.user_id === u.id) || defaultP;
                    return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-slate-50/80 group"
                    >
                      <td className="px-6 py-4 text-slate-600 font-medium text-left">{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 text-left">
                        {u.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-left">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">{p.staff_code || u.staff_code || `NV${String(u.id).padStart(3, "0")}`}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-[13px] text-left">{translateTitle(u.title || u.role || "-")}</td>
                      <td className="px-6 py-4 text-slate-600 text-[13px] text-left">{u.branch || "-"}</td>
                      <td className="px-6 py-4 text-slate-600 text-left font-medium">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">{p.working_days}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 text-left font-mono font-medium">
                        {p.gross?.toLocaleString("en-US")}
                      </td>
                      <td className="px-6 py-4 text-indigo-600 text-left font-mono font-medium">
                        {p.bonus?.toLocaleString("en-US")}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-left font-mono text-[13px]">
                        {p.insurance?.toLocaleString("en-US")}
                      </td>
                      <td className="px-6 py-4 text-red-500 text-left font-mono text-[13px]">
                        {p.tax?.toLocaleString("en-US")}
                      </td>
                      <td className="px-6 py-4 text-[#00B85E] font-bold text-left font-mono text-[15px] bg-green-50/30 group-hover:bg-green-50/60 transition-colors">
                        {p.net?.toLocaleString("en-US")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setFormData(calculateFullPayroll({
                                ...p,
                                id: p.id,
                                user_id: u.id,
                                user_name: u.name,
                                staff_code: p.staff_code || "",
                                title: u.title || u.role || "",
                                branch: u.branch || "Hà Nội",
                                working_days: p.working_days || 26,
                                dependents: p.dependents || 0,
                                gross: p.gross || 0,
                                food_allowance: p.food_allowance || 0,
                                gas_allowance: p.gas_allowance || 0,
                                phone_allowance: p.phone_allowance || 0,
                                other_benefits: p.other_benefits || 0,
                                bonus: p.bonus || 0,
                                violations: p.violations || 0
                              }));
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-white transition-all duration-300 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all duration-300 active:scale-95 text-xs font-medium border border-slate-200 shadow-sm"
                          >
                            <Edit2 className="w-3 h-3" />
                            {p.id ? t.viewDetails : t.addPersonnel}
                          </button>
                          {p.id && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 text-red-500 transition-all duration-300 hover:bg-red-50 rounded-lg transition-all duration-300 active:scale-95 border border-transparent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        {t.noData}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            ) : activeTab === "performance" ? (
              <div className="rounded-xl border border-indigo-100 shadow-sm overflow-x-auto bg-white mb-4">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.no}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.fullName}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">
                      {t.position}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">
                      {language === "vi" ? "Tổng Vụ Việc" : "Total Cases"}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">
                      {language === "vi" ? "Đang Thụ Lý" : "In Progress"}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">
                      {language === "vi" ? "Đã Đóng" : "Closed"}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">
                      {language === "vi" ? "Quá Hạn" : "Overdue"}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-right whitespace-nowrap">
                      {language === "vi" ? "Doanh Thu (VNĐ)" : "Revenue (VND)"}
                    </th>
                    <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">
                      {language === "vi" ? "Đánh Giá" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {performanceData.map((u, i) => (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-slate-50/80 group"
                    >
                      <td className="px-6 py-4 text-slate-600 font-medium">{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {u.name}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-[13px]">
                        {translateTitle(u.title || u.role || "-")}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">{u.totalCases}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {u.inProgressCases > 0 ? (
                          <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                            {u.inProgressCases}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {u.completedCases > 0 ? (
                          <span className="bg-green-50 border border-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                            {u.completedCases}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {u.overdueCases > 0 ? (
                          <span className="bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                            {u.overdueCases}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-indigo-600 font-mono">
                        {u.revenue > 0 ? new Intl.NumberFormat('en-US').format(u.revenue) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {u.overdueCases > 0 ? (
                          <span className="text-red-600 font-medium text-xs flex justify-center items-center gap-1.5">
                            <AlertCircle size={14} />{" "}
                            {language === "vi"
                              ? "Cần Chú Ý"
                              : "Requires Attention"}
                          </span>
                        ) : u.inProgressCases > 3 ? (
                          <span className="text-orange-500 font-medium text-xs flex justify-center items-center gap-1.5">
                            <Clock size={14} />{" "}
                            {language === "vi" ? "Tải Cao" : "High Workload"}
                          </span>
                        ) : u.totalCases > 0 ? (
                          <span className="text-green-600 font-medium text-xs flex justify-center items-center gap-1.5">
                            <CheckCircle size={14} />{" "}
                            {language === "vi" ? "Tốt" : "Good"}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium text-xs border border-slate-200 px-2 py-0.5 rounded-full inline-block bg-slate-50">
                            {language === "vi" ? "Không hoạt động" : "Idle"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {performanceData.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        {t.noData}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            ) : activeTab === "bonus" ? (
              <div className="space-y-6">
                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12 transition-transform duration-500 group-hover:scale-110">
                      <DollarSign className="w-32 h-32" />
                    </div>
                    <div className="text-indigo-100 text-xs font-bold uppercase tracking-wider">
                      {language === "vi" ? "Tổng quỹ thưởng tháng" : "Total Month Budget"}
                    </div>
                    <div className="text-3xl font-black mt-2 font-mono">
                      {bonusStats.total.toLocaleString("vi-VN")} ₫
                    </div>
                    <div className="text-indigo-200 text-xs mt-3">
                      {language === "vi" ? "Đã cộng vào tổng chi phí lương" : "Added to total payroll expenses"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12 transition-transform duration-500 group-hover:scale-110">
                      <User className="w-32 h-32" />
                    </div>
                    <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                      {language === "vi" ? "Thưởng cá nhân lớn nhất" : "Highest Individual Reward"}
                    </div>
                    <div className="text-3xl font-black mt-2 font-mono">
                      {bonusStats.maxIndiv.toLocaleString("vi-VN")} ₫
                    </div>
                    <div className="text-emerald-200 text-xs mt-3">
                      {language === "vi" ? "Vinh danh cá nhân xuất sắc nhất" : "Honoring top individual performers"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-15 transform rotate-12 transition-transform duration-500 group-hover:scale-110">
                      <Award className="w-32 h-32" />
                    </div>
                    <div className="text-amber-100 text-xs font-bold uppercase tracking-wider">
                      {language === "vi" ? "Tập thể xuất sắc nhất" : "Top Awarded Team"}
                    </div>
                    <div className="text-2xl font-black mt-2 truncate">
                      {bonusStats.topGroup}
                    </div>
                    <div className="text-amber-200 text-xs mt-3 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 inline" />
                      <span className="font-mono font-bold">{bonusStats.maxGroupAmt.toLocaleString("vi-VN")} ₫</span>
                      {language === "vi" ? "thưởng thêm" : "awarded"}
                    </div>
                  </div>
                </div>

                {/* Sub-tab Pill Switcher */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl self-start">
                    <button
                      onClick={() => setBonusSubTab("personnel")}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                        bonusSubTab === "personnel"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      {language === "vi" ? "Thưởng Cá Nhân" : "Individual Rewards"}
                    </button>
                    <button
                      onClick={() => setBonusSubTab("team")}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                        bonusSubTab === "team"
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      {language === "vi" ? "Thưởng Bộ Phận & Nhóm" : "Department & Team"}
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 italic">
                    {bonusSubTab === "personnel"
                      ? (language === "vi" ? "Xem & cập nhật điểm đánh giá, mức thưởng cá nhân" : "Individual evaluation & bonus list")
                      : (language === "vi" ? "Danh sách vinh danh, khen thưởng tập thể, phòng ban, nhóm" : "Department & team rewards honor list")}
                  </div>
                </div>

                {/* Optional Charts Section to make it extremely visual */}
                {evaluations.length > 0 && (
                  <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-3xl p-6 border border-indigo-100/80 shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-100/60">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                          {language === "vi" ? `Tháng ${currentMonth}/${currentYear}` : `Month ${currentMonth}/${currentYear}`}
                        </span>
                        <h3 className="text-lg font-black text-slate-800 mt-1.5 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-indigo-600" />
                          {language === "vi" ? "BIỂU ĐỒ PHÂN BỔ QUỸ THƯỞNG" : "REWARD DISTRIBUTION CHART"}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-xs block">
                          {language === "vi" ? "Đơn vị hiển thị" : "Display unit"}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-white/80 px-2 py-1 rounded-md border border-slate-200">
                          M (Triệu VND)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Interactive statistics cards */}
                      <div className="flex flex-col gap-3 justify-center">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                          <span className="text-xs text-slate-500 font-medium block">
                            {language === "vi" ? "Tổng quỹ thưởng" : "Total Rewards"}
                          </span>
                          <span className="text-xl font-extrabold text-[#00B85E] block mt-1">
                            {bonusStats.total.toLocaleString("vi-VN")} ₫
                          </span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                          <span className="text-xs text-slate-500 font-medium block">
                            {language === "vi" ? "Thưởng cá nhân lớn nhất" : "Max Individual Reward"}
                          </span>
                          <span className="text-xl font-extrabold text-indigo-600 block mt-1">
                            {bonusStats.maxIndiv.toLocaleString("vi-VN")} ₫
                          </span>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                          <span className="text-xs text-slate-500 font-medium block">
                            {language === "vi" ? "Số nhân sự được khen thưởng" : "Awarded Personnel Count"}
                          </span>
                          <span className="text-xl font-extrabold text-slate-800 block mt-1">
                            {evaluations.filter(ev => (ev.target_type || 'personnel') === 'personnel').length}{" "}
                            <span className="text-xs font-medium text-slate-400">
                              {language === "vi" ? "thành viên" : "members"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Beautifully crafted Bar Chart with gradient fills */}
                      <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-indigo-50/50 shadow-sm h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                            <defs>
                              <linearGradient id="grad0" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.9}/>
                              </linearGradient>
                              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#059669" stopOpacity={0.9}/>
                              </linearGradient>
                              <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#D97706" stopOpacity={0.9}/>
                              </linearGradient>
                              <linearGradient id="grad3" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.9}/>
                              </linearGradient>
                              <linearGradient id="grad4" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#EC4899" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#DB2777" stopOpacity={0.9}/>
                              </linearGradient>
                              <linearGradient id="grad5" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.9}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#94A3B8" 
                              fontSize={11} 
                              tickLine={false} 
                              axisLine={false}
                              dy={5}
                            />
                            <YAxis 
                              stroke="#94A3B8" 
                              fontSize={11} 
                              tickLine={false} 
                              axisLine={false} 
                              tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} 
                            />
                            <Tooltip 
                              cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs font-sans">
                                      <p className="font-semibold text-slate-300 mb-1">{payload[0].payload.name}</p>
                                      <p className="font-mono text-emerald-400 text-sm font-bold">
                                        {Number(payload[0].value).toLocaleString("vi-VN")} ₫
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={40}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#grad${index % 6})`} />
                              ))}
                              <LabelList 
                                dataKey="amount" 
                                position="top" 
                                formatter={(val: any) => typeof val === 'number' && val > 0 ? `${(val / 1000000).toFixed(1)}M` : ""}
                                style={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} 
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab content rendering */}
                {bonusSubTab === "personnel" ? (
                  <div className="rounded-2xl border border-indigo-100 shadow-sm overflow-x-auto bg-white">
                    <table className="w-full min-w-max text-left text-sm">
                      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100">
                        <tr>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">{t.no}</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">{t.empCode}</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">{t.fullName}</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">{t.position}</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">{t.branch}</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">{t.rating}</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-right whitespace-nowrap">{t.bonusAmount}</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">{t.notes}</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">{t.details}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredUsers.map((u, i) => {
                          const e = evaluations.find(ev => ev.user_id === u.id && ev.target_type === 'personnel') || {
                            staff_code: u.staff_code || `NV${String(u.id).padStart(3, "0")}`,
                            rating: "-",
                            bonus_amount: 0,
                            notes: ""
                          };
                          return (
                            <tr key={u.id} className="transition-colors hover:bg-slate-50/80 group">
                              <td className="px-6 py-4 text-slate-600 font-medium">{i + 1}</td>
                              <td className="px-6 py-4 text-slate-600">
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium border border-slate-200">{e.staff_code}</span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-900">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm">
                                    {u.name?.charAt(0)}
                                  </div>
                                  <span>{u.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900 text-[13px]">{translateTitle(u.title || u.role || "-")}</td>
                              <td className="px-6 py-4 text-slate-600 text-[13px]">{u.branch || "-"}</td>
                              <td className="px-6 py-4 text-center font-bold">
                                {e.rating !== "-" ? (
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    e.rating === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' :
                                    e.rating === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    e.rating === 'C' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {e.rating}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right text-[#00B85E] font-bold font-mono text-[15px]">
                                {e.bonus_amount > 0 ? `${e.bonus_amount?.toLocaleString("vi-VN")} ₫` : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-6 py-4 text-slate-600 italic text-[13px] max-w-xs truncate" title={e.notes}>{e.notes || "-"}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEvalFormData({
                                        id: e.id,
                                        user_id: u.id,
                                        rating: e.rating !== "-" ? e.rating : "A",
                                        bonus_amount: e.bonus_amount || 0,
                                        notes: e.notes || "",
                                        target_type: "personnel",
                                        target_name: "",
                                      });
                                      setIsEvalModalOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all active:scale-95 text-xs font-medium border border-slate-200 shadow-sm"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    {e.id ? t.edit : t.addEvaluation}
                                  </button>
                                  {e.id && (
                                    <button
                                      onClick={() => handleEvalDelete(e.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95 border border-transparent"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-slate-500">{t.noData}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Team & Department Sub-tab */
                  <div>
                    {evaluations.filter(ev => ev.target_type !== 'personnel').length === 0 ? (
                      <div className="bg-white border border-indigo-50 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center max-w-2xl mx-auto my-4">
                        <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-6 animate-bounce">
                          <Award className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                          {language === "vi" ? "Chưa có khen thưởng tập thể" : "No Team Rewards Yet"}
                        </h3>
                        <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-6">
                          {language === "vi" 
                            ? "Tháng này chưa vinh danh tập thể, bộ phận hay nhóm nào. Hãy khen thưởng kịp thời để khích lệ tinh thần làm việc nhóm!"
                            : "No departments or teams have been rewarded yet this month. Honor outstanding teamwork now!"}
                        </p>
                        <button
                          onClick={() => {
                            setEvalFormData({
                              user_id: "",
                              rating: "A",
                              bonus_amount: 0,
                              notes: "",
                              target_type: "department",
                              target_name: "Phòng Tranh tụng",
                            });
                            setIsEvalModalOpen(true);
                          }}
                          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md font-semibold text-sm hover:from-blue-700 transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          {language === "vi" ? "Khen Thưởng Tập Thể Đầu Tiên" : "Add First Team Reward"}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {evaluations.filter(ev => ev.target_type !== 'personnel').map((row) => (
                          <motion.div
                            key={row.id}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className="relative bg-white border border-indigo-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group p-6 flex flex-col justify-between"
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                              <div className="absolute top-3 right-[-30px] transform rotate-45 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] font-bold py-1 px-8 shadow-md text-center">
                                WINNER
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white shadow-md">
                                  {row.target_type === 'department' ? <Briefcase className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                </div>
                                <div>
                                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                                    {row.target_type === 'department' ? (language === 'vi' ? 'BỘ PHẬN' : 'DEPARTMENT') : (language === 'vi' ? 'NHÓM / TEAM' : 'GROUP / TEAM')}
                                  </span>
                                  <h4 className="text-lg font-bold text-slate-800 mt-0.5 group-hover:text-indigo-600 transition-colors duration-300">
                                    {row.target_name}
                                  </h4>
                                </div>
                              </div>

                              <div className="mb-4">
                                <div className="text-2xl font-black text-indigo-600 font-mono flex items-baseline gap-1">
                                  {row.bonus_amount?.toLocaleString("vi-VN")} 
                                  <span className="text-sm font-bold text-slate-500">₫</span>
                                </div>
                                <p className="text-xs text-slate-400 italic mt-0.5">
                                  Bằng chữ: {numberToWords(row.bonus_amount || 0)}
                                </p>
                              </div>

                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">
                                <div className="text-xs font-semibold text-slate-500 mb-1">
                                  {language === 'vi' ? 'Thành tích & Ghi chú:' : 'Achievement & Notes:'}
                                </div>
                                <p className="text-[13px] text-slate-600 italic leading-relaxed">
                                  {row.notes || (language === 'vi' ? 'Chưa có chi tiết thành tích' : 'No details available')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {language === 'vi' ? 'Thời gian:' : 'Applied for:'} {row.month}/{row.year}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEvalFormData({
                                      id: row.id,
                                      user_id: "",
                                      rating: row.rating || "A",
                                      bonus_amount: row.bonus_amount || 0,
                                      notes: row.notes || "",
                                      target_type: row.target_type || "department",
                                      target_name: row.target_name || "",
                                    });
                                    setIsEvalModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  {language === 'vi' ? 'Sửa' : 'Edit'}
                                </button>
                                <button
                                  onClick={() => handleEvalDelete(row.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === "qc" ? (
              <div className="p-6">
                {/* QC Navigation / Sub-tabs */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setQcSubTab("summary")}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        qcSubTab === "summary"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "text-slate-600 hover:bg-slate-50 border border-transparent"
                      )}
                    >
                      🏆 {language === "vi" ? "Điểm Thi đua & Xếp loại" : "Staff Points & Rating"}
                    </button>
                    <button
                      onClick={() => setQcSubTab("records")}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                        qcSubTab === "records"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "text-slate-600 hover:bg-slate-50 border border-transparent"
                      )}
                    >
                      📋 {language === "vi" ? "Nhật ký Lỗi & Khen thưởng" : "QC Log"}
                    </button>
                    {hasQcWriteAccess && (
                      <button
                        onClick={() => setQcSubTab("rules")}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                          qcSubTab === "rules"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "text-slate-600 hover:bg-slate-50 border border-transparent"
                        )}
                      >
                        ⚙️ {language === "vi" ? "Danh mục Lỗi master" : "Master Rules"}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {hasQcWriteAccess && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedQcRecord(null);
                            setQcRecordUserId("");
                            setQcRecordRuleCode("");
                            setQcRecordNote("");
                            setIsQcRecordModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white rounded-lg hover:opacity-95 text-xs font-semibold shadow active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {language === "vi" ? "Ghi lỗi / Thưởng" : "Log Record"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQcRule(null);
                            setQcRuleCode("");
                            setQcRuleName("");
                            setQcRuleType("violation");
                            setQcRulePoints(-10);
                            setQcRuleMoney(-150000);
                            setQcRuleCategory("Chuyên môn");
                            setIsQcRuleModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-xs font-semibold shadow active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {language === "vi" ? "Tạo Lỗi master" : "New Rule"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* SUB TAB CONTENT: SUMMARY (Rating Matrix) */}
                {qcSubTab === "summary" && (
                  <div className="overflow-x-auto rounded-xl border border-indigo-100 shadow-sm bg-white mb-4">
                    <table className="w-full min-w-max text-left text-sm">
                      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100">
                        <tr>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Mã NS</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Họ và tên</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Chức danh</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Chi nhánh</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">Điểm gốc</th>
                          <th className="px-6 py-4 font-bold text-red-700 text-center whitespace-nowrap">Trừ (Lỗi)</th>
                          <th className="px-6 py-4 font-bold text-emerald-800 text-center whitespace-nowrap">Cộng (Thưởng)</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">Điểm thi đua</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">Xếp loại</th>
                          <th className="px-6 py-4 font-bold text-red-700 text-right whitespace-nowrap">Khấu trừ lương (VND)</th>
                          <th className="px-6 py-4 font-bold text-emerald-800 text-right whitespace-nowrap">Thưởng thi đua (VND)</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">Bảng lương</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredUsers.map((u) => {
                          const userRecords = qcRecords.filter(r => r.user_id === u.id);
                          
                          let totalViolationPoints = 0;
                          let totalBonusPoints = 0;
                          let totalViolationFines = 0;
                          let totalBonusMoney = 0;

                          userRecords.forEach(r => {
                            if (r.rule_type === 'violation') {
                              totalViolationPoints += Math.abs(r.points_effect || 0);
                              totalViolationFines += Math.abs(r.money_effect || 0);
                            } else {
                              totalBonusPoints += Math.abs(r.points_effect || 0);
                              totalBonusMoney += Math.abs(r.money_effect || 0);
                            }
                          });

                          let finalPoints = 100 - totalViolationPoints + totalBonusPoints;
                          if (finalPoints < 0) finalPoints = 0;
                          if (finalPoints > 120) finalPoints = 120;

                          let rating = "B";
                          let badgeBg = "bg-blue-50 text-blue-700 border-blue-100";
                          if (finalPoints >= 95) {
                            rating = "A";
                            badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold";
                          } else if (finalPoints >= 80) {
                            rating = "B";
                            badgeBg = "bg-blue-50 text-blue-700 border-blue-100 font-bold";
                          } else if (finalPoints >= 60) {
                            rating = "C";
                            badgeBg = "bg-amber-50 text-amber-700 border-amber-100 font-bold";
                          } else {
                            rating = "D";
                            badgeBg = "bg-red-50 text-red-700 border-red-100 font-bold";
                          }

                          const payrollFound = payrolls.find(p => p.user_id === u.id);

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 text-slate-600 font-medium">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700 border border-slate-200">
                                  {u.staff_code || `NV${String(u.id).padStart(3, "0")}`}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                              <td className="px-6 py-4 font-bold text-slate-900 text-[13px]">{translateTitle(u.title || u.role || "")}</td>
                              <td className="px-6 py-4 text-slate-600 text-[13px]">{u.branch || "-"}</td>
                              <td className="px-6 py-4 text-center font-medium text-slate-400">100</td>
                              <td className="px-6 py-4 text-center font-bold text-red-600 text-[13px]">
                                {totalViolationPoints > 0 ? `-${totalViolationPoints}đ` : "-"}
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-emerald-600 text-[13px]">
                                {totalBonusPoints > 0 ? `+${totalBonusPoints}đ` : "-"}
                              </td>
                              <td className="px-6 py-4 text-center font-extrabold text-slate-800 text-[14px]">
                                {finalPoints}đ
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border", badgeBg)}>
                                  {rating}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-red-600 text-[13px]">
                                {totalViolationFines > 0 ? `-${totalViolationFines.toLocaleString()}đ` : "-"}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-emerald-600 text-[13px]">
                                {totalBonusMoney > 0 ? `+${totalBonusMoney.toLocaleString()}đ` : "-"}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {payrollFound ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold">
                                    ✓ Đã đồng bộ
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg text-xs">
                                    Chưa lập
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SUB TAB CONTENT: RECORDS LOG */}
                {qcSubTab === "records" && (
                  <div className="overflow-x-auto rounded-xl border border-indigo-100 shadow-sm bg-white mb-4">
                    <table className="w-full min-w-max text-left text-sm">
                      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100">
                        <tr>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Mã NS</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Họ và tên</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Phân loại</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Mã QC</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Nội dung lỗi / Khen thưởng</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">Điểm</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-right whitespace-nowrap">Số tiền</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Chi tiết vi phạm/Khen thưởng</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Kiểm soát viên ghi nhận</th>
                          {hasQcWriteAccess && <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">Thao tác</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {qcRecords.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-8 text-slate-400">Chưa có bản ghi vi phạm hoặc khen thưởng nào trong tháng này.</td>
                          </tr>
                        ) : (
                          qcRecords.map((r) => {
                            const isViolation = r.rule_type === 'violation';
                            return (
                              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 text-slate-600 font-semibold">{r.staff_code}</td>
                                <td className="px-6 py-4 font-semibold text-slate-950">{r.user_name}</td>
                                <td className="px-6 py-4">
                                  {isViolation ? (
                                    <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-bold">Vi phạm (QC)</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-xs font-bold">Khen thưởng</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{r.rule_code}</td>
                                <td className="px-6 py-4 font-semibold text-slate-800 text-[13px]">{r.rule_name}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className={cn("text-xs font-bold", isViolation ? "text-red-600" : "text-emerald-600")}>
                                    {isViolation ? `${r.points_effect}đ` : `+${r.points_effect}đ`}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={cn("text-xs font-bold", isViolation ? "text-red-600" : "text-emerald-600")}>
                                    {isViolation ? `-${Math.abs(r.money_effect || 0).toLocaleString()}đ` : `+${Math.abs(r.money_effect || 0).toLocaleString()}đ`}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate" title={r.note}>{r.note || "-"}</td>
                                <td className="px-6 py-4 text-xs text-slate-500">{r.created_by || "Hệ thống"}</td>
                                {hasQcWriteAccess && (
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          setSelectedQcRecord(r);
                                          setQcRecordUserId(String(r.user_id));
                                          setQcRecordRuleCode(r.rule_code);
                                          setQcRecordNote(r.note || "");
                                          setIsQcRecordModalOpen(true);
                                        }}
                                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                        title="Sửa"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleQcRecordDelete(r.id)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        title="Xóa"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SUB TAB CONTENT: MASTER RULES LIST */}
                {qcSubTab === "rules" && (
                  <div className="overflow-x-auto rounded-xl border border-indigo-100 shadow-sm bg-white mb-4">
                    <table className="w-full min-w-max text-left text-sm">
                      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100">
                        <tr>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Mã</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Nội dung lỗi vi phạm / Khen thưởng</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Phân loại</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 whitespace-nowrap">Nhóm nghiệp vụ</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">Điểm thi đua</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-right whitespace-nowrap">Tác động lương</th>
                          <th className="px-6 py-4 font-bold text-indigo-900 text-center whitespace-nowrap">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {qcRules.map((rule) => {
                          const isViolation = rule.type === 'violation';
                          return (
                            <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{rule.code}</td>
                              <td className="px-6 py-4 font-semibold text-slate-800 text-[13px]">{rule.name}</td>
                              <td className="px-6 py-4">
                                {isViolation ? (
                                  <span className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-bold">Lỗi vi phạm</span>
                                ) : (
                                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-xs font-bold">Cộng thưởng</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-[13px]">{rule.category || "-"}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={cn("text-xs font-bold", isViolation ? "text-red-600" : "text-emerald-600")}>
                                  {isViolation ? `${rule.points_effect}đ` : `+${rule.points_effect}đ`}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={cn("text-xs font-bold", isViolation ? "text-red-600" : "text-emerald-600")}>
                                  {isViolation ? `-${Math.abs(rule.money_effect || 0).toLocaleString()}đ` : `+${Math.abs(rule.money_effect || 0).toLocaleString()}đ`}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedQcRule(rule);
                                      setQcRuleCode(rule.code);
                                      setQcRuleName(rule.name);
                                      setQcRuleType(rule.type);
                                      setQcRulePoints(rule.points_effect);
                                      setQcRuleMoney(rule.money_effect);
                                      setQcRuleCategory(rule.category || "Chuyên môn");
                                      setIsQcRuleModalOpen(true);
                                    }}
                                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                    title="Sửa"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleQcRuleDelete(rule.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">{t.noData}</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Personnel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === "payroll" ? t.addPayrollTitle : t.addPersonnel}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t.personnelName}
                  </label>
                  <button
                    type="button"
                    className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {t.editPersonnelInfo}
                  </button>
                </div>
                <select
                  value={formData.user_id}
                  onChange={handleUserSelect}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
                >
                  <option value="">{t.selectPersonnel}</option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} - {u.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {t.empCodeAuto}
                  </label>
                  <input
                    type="text"
                    name="staff_code"
                    value={formData.staff_code}
                    disabled
                    placeholder="(Sẽ tạo tự động)"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">{t.empCodeNote}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {t.positionLabel}
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập chức danh"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {t.branchLabel}
                  </label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange as any}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white text-slate-800"
                  >
                    <option value="">{language === "vi" ? "-- Chọn chi nhánh --" : "-- Select Branch --"}</option>
                    {dynamicBranchOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Ngân hàng" : "Bank"}
                  </label>
                  <input
                    type="text"
                    name="bank"
                    value={formData.bank}
                    onChange={handleInputChange}
                    placeholder="Nhập tên ngân hàng"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Số tài khoản" : "Bank Account"}
                  </label>
                  <input
                    type="text"
                    name="bank_account"
                    value={formData.bank_account}
                    onChange={handleInputChange}
                    placeholder="Nhập số tài khoản"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {t.workingDaysLabel}
                  </label>
                  <input
                    type="number"
                    name="working_days"
                    value={formData.working_days}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {t.dependentsLabel}
                  </label>
                  <input
                    type="number"
                    name="dependents"
                    value={formData.dependents}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {t.basicSalaryLabel}
                  </label>
                  <input
                    type="text"
                    name="gross"
                    value={
                      formData.gross
                        ? formData.gross.toLocaleString("en-US")
                        : formData.gross === 0
                          ? "0"
                          : ""
                    }
                    onChange={handleCurrencyChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none font-mono bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Phụ cấp ăn trưa" : "Food Allowance"}
                  </label>
                  <input
                    type="text"
                    name="food_allowance"
                    value={
                      formData.food_allowance
                        ? formData.food_allowance.toLocaleString("en-US")
                        : formData.food_allowance === 0
                          ? "0"
                          : ""
                    }
                    onChange={handleCurrencyChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none font-mono bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Phụ cấp xăng xe" : "Gas Allowance"}
                  </label>
                  <input
                    type="text"
                    name="gas_allowance"
                    value={
                      formData.gas_allowance
                        ? formData.gas_allowance.toLocaleString("en-US")
                        : formData.gas_allowance === 0
                          ? "0"
                          : ""
                    }
                    onChange={handleCurrencyChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none font-mono bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi"
                      ? "Phụ cấp điện thoại"
                      : "Phone Allowance"}
                  </label>
                  <input
                    type="text"
                    name="phone_allowance"
                    value={
                      formData.phone_allowance
                        ? formData.phone_allowance.toLocaleString("en-US")
                        : formData.phone_allowance === 0
                          ? "0"
                          : ""
                    }
                    onChange={handleCurrencyChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none font-mono bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Tổng lương" : "Total Salary"}
                  </label>
                  <input
                    type="text"
                    name="total_salary"
                    value={
                      formData.total_salary
                        ? formData.total_salary.toLocaleString("en-US")
                        : formData.total_salary === 0
                          ? "0"
                          : ""
                    }
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 font-bold font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Phụ cấp" : "Benefits"}
                  </label>
                  <input
                    type="text"
                    name="other_benefits"
                    value={
                      formData.other_benefits
                        ? formData.other_benefits.toLocaleString("en-US")
                        : formData.other_benefits === 0
                          ? "0"
                          : ""
                    }
                    onChange={handleCurrencyChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none font-mono bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Thưởng" : "Bonus"}
                  </label>
                  <input
                    type="text"
                    name="bonus"
                    value={
                      formData.bonus
                        ? formData.bonus.toLocaleString("en-US")
                        : formData.bonus === 0
                          ? "0"
                          : ""
                    }
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none font-mono bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">{language === "vi" ? "(Đồng bộ từ Đánh giá)" : "(Synced from Evaluations)"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {language === "vi" ? "Vi phạm" : "Violations"}
                  </label>
                  <input
                    type="text"
                    name="violations"
                    value={
                      formData.violations
                        ? formData.violations.toLocaleString("en-US")
                        : formData.violations === 0
                          ? "0"
                          : ""
                    }
                    onChange={handleCurrencyChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none font-mono text-red-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5c6e81] mb-2">
                    {t.insuranceLabel}
                  </label>
                  <input
                    type="text"
                    name="insurance"
                    value={
                      formData.insurance
                        ? formData.insurance.toLocaleString("en-US")
                        : formData.insurance === 0
                          ? "0"
                          : ""
                    }
                    onChange={handleCurrencyChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none font-mono bg-white text-slate-800"
                  />
                  <p className="text-[#5c6e81] text-sm mt-3 italic">
                    Bằng chữ: {numberToWords(formData.net || 0)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-800 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1F2937] text-white rounded-lg transition-all duration-300 hover:bg-black transition-all duration-300 active:scale-95 font-medium flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {t.saveInfo}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Evaluation Modal */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {evalFormData.id ? t.editEvalTitle : t.addEvalTitle}
              </h2>
              <button
                onClick={() => setIsEvalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEvalSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {language === "vi" ? "Đối tượng khen thưởng" : "Reward Target"}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEvalFormData({
                        ...evalFormData,
                        target_type: "personnel",
                        user_id: "",
                        target_name: "",
                      })
                    }
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-300 ${
                      (evalFormData.target_type || "personnel") === "personnel"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {language === "vi" ? "Cá nhân" : "Individual"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEvalFormData({
                        ...evalFormData,
                        target_type: "department",
                        user_id: "",
                        target_name: "Phòng Tranh tụng",
                      })
                    }
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-300 ${
                      evalFormData.target_type === "department"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    {language === "vi" ? "Bộ phận" : "Department"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEvalFormData({
                        ...evalFormData,
                        target_type: "team",
                        user_id: "",
                        target_name: "",
                      })
                    }
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-300 ${
                      evalFormData.target_type === "team"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {language === "vi" ? "Nhóm / Team" : "Group / Team"}
                  </button>
                </div>
              </div>

              {/* Conditionally Render Target Details */}
              {(evalFormData.target_type || "personnel") === "personnel" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.personnelName}
                  </label>
                  <select
                    value={evalFormData.user_id}
                    onChange={(e) =>
                      setEvalFormData({
                        ...evalFormData,
                        user_id: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
                  >
                    <option value="">{t.selectPersonnel}</option>
                    {filteredUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {u.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {evalFormData.target_type === "department" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === "vi" ? "Chọn phòng ban / bộ phận" : "Select Department"}
                  </label>
                  <select
                    value={evalFormData.target_name}
                    onChange={(e) =>
                      setEvalFormData({
                        ...evalFormData,
                        target_name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
                  >
                    <option value="Phòng Tranh tụng">{language === "vi" ? "Phòng Tranh tụng" : "Litigation Dept"}</option>
                    <option value="Phòng Tư vấn Doanh nghiệp">{language === "vi" ? "Phòng Tư vấn Doanh nghiệp" : "Corporate Advisory Dept"}</option>
                    <option value="Phòng Sở hữu Trí tuệ">{language === "vi" ? "Phòng Sở hữu Trí tuệ" : "Intellectual Property Dept"}</option>
                    <option value="Phòng Hành chính - Nhân sự">{language === "vi" ? "Phòng Hành chính - Nhân sự" : "HR & Admin Dept"}</option>
                    <option value="Phòng Tài chính - Kế toán">{language === "vi" ? "Phòng Tài chính - Kế toán" : "Finance & Accounting Dept"}</option>
                    {dynamicBranchOptions && dynamicBranchOptions.length > 0 ? (
                      dynamicBranchOptions.map((b) => (
                        <option key={b} value={b}>
                          {b.startsWith("Chi nhánh") || b.startsWith("Trụ sở") || b.startsWith("Hội sở")
                            ? b
                            : (b === "Hồ Chí Minh" || b === "TP.HCM" || b === "TP. Hồ Chí Minh"
                              ? "Trụ sở chính TP. Hồ Chí Minh"
                              : `Chi nhánh ${b}`)}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Chi nhánh Hà Nội">{language === "vi" ? "Chi nhánh Hà Nội" : "Hanoi Branch"}</option>
                        <option value="Chi nhánh TP. Hồ Chí Minh">{language === "vi" ? "Chi nhánh TP. Hồ Chí Minh" : "HCM Branch"}</option>
                        <option value="Chi nhánh Đà Nẵng">{language === "vi" ? "Chi nhánh Đà Nẵng" : "Danang Branch"}</option>
                        <option value="Trụ sở chính">{language === "vi" ? "Trụ sở chính" : "Headquarters"}</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {evalFormData.target_type === "team" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === "vi" ? "Tên nhóm / team" : "Group/Team Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={evalFormData.target_name || ""}
                    placeholder={language === "vi" ? "Ví dụ: Team Dự án Landmark, Nhóm tư vấn luật..." : "E.g., Landmark Project Team..."}
                    onChange={(e) =>
                      setEvalFormData({
                        ...evalFormData,
                        target_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.rating}
                  </label>
                  <select
                    value={evalFormData.rating}
                    onChange={(e) =>
                      setEvalFormData({
                        ...evalFormData,
                        rating: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
                  >
                    <option value="A">
                      {language === "vi"
                        ? "Loại A (Xuất sắc)"
                        : "Type A (Excellent)"}
                    </option>
                    <option value="B">
                      {language === "vi" ? "Loại B (Tốt)" : "Type B (Good)"}
                    </option>
                    <option value="C">
                      {language === "vi" ? "Loại C (Khá)" : "Type C (Fair)"}
                    </option>
                    <option value="D">
                      {language === "vi"
                        ? "Loại D (Trung bình)"
                        : "Type D (Average)"}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.bonusAmount}
                  </label>
                  <input
                    type="text"
                    value={
                      evalFormData.bonus_amount
                        ? evalFormData.bonus_amount.toLocaleString("en-US")
                        : evalFormData.bonus_amount === 0
                          ? "0"
                          : ""
                    }
                    onChange={(e) => {
                      let rawValue = e.target.value.replace(/,/g, "");
                      rawValue = rawValue.replace(/^0+(?=\d)/, "");
                      const numValue = Number(rawValue);
                      if (!isNaN(numValue)) {
                        setEvalFormData({
                          ...evalFormData,
                          bonus_amount: numValue,
                        });
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none font-mono"
                  />
                  <p className="text-sm text-slate-500 mt-2 italic">
                    Bằng chữ: {numberToWords(evalFormData.bonus_amount || 0)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.notes}
                </label>
                <textarea
                  value={evalFormData.notes}
                  onChange={(e) =>
                    setEvalFormData({ ...evalFormData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEvalModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95 font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95 font-medium flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {t.saveInfo}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QC Record Modal */}
      {isQcRecordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedQcRecord ? "Sửa ghi nhận Vi phạm/Thưởng" : "Ghi nhận Vi phạm / Khen thưởng (QC)"}
              </h2>
              <button
                onClick={() => setIsQcRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQcRecordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Chọn nhân sự áp dụng <span className="text-red-500">*</span>
                </label>
                <select
                  value={qcRecordUserId}
                  onChange={(e) => setQcRecordUserId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white font-medium"
                >
                  <option value="">-- Chọn nhân sự từ danh sách --</option>
                  {users.filter(u => u.role !== 'client').map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.staff_code || `NV${String(u.id).padStart(3, '0')}`}) - {translateTitle(u.title || u.role || "")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Chọn lỗi vi phạm / Khen thưởng từ danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  value={qcRecordRuleCode}
                  onChange={(e) => setQcRecordRuleCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white font-medium"
                >
                  <option value="">-- Chọn mã lỗi/mã thưởng --</option>
                  {qcRules.map((rule) => (
                    <option key={rule.id} value={rule.code}>
                      [{rule.code}] {rule.name} ({rule.type === 'violation' ? 'Trừ' : 'Cộng'} {Math.abs(rule.points_effect)}đ, {rule.type === 'violation' ? '-' : '+'}{Math.abs(rule.money_effect).toLocaleString()}đ)
                    </option>
                  ))}
                </select>
                {qcRecordRuleCode && (
                  <div className="mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded p-2 flex justify-between">
                    {(() => {
                      const foundRule = qcRules.find(r => r.code === qcRecordRuleCode);
                      if (!foundRule) return null;
                      return (
                        <>
                          <span>Tác động thi đua: <b className={foundRule.type === 'violation' ? 'text-red-600' : 'text-emerald-600'}>{foundRule.points_effect}đ</b></span>
                          <span>Tác động lương: <b className={foundRule.type === 'violation' ? 'text-red-600' : 'text-emerald-600'}>{foundRule.type === 'violation' ? '-' : '+'}{Math.abs(foundRule.money_effect).toLocaleString()}đ</b></span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Ghi chú chi tiết / Mô tả vụ việc vi phạm hoặc thành tích <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={qcRecordNote}
                  onChange={(e) => setQcRecordNote(e.target.value)}
                  rows={4}
                  required
                  placeholder="Ghi rõ chi tiết lỗi, ví dụ: 'Tải sai CCCD của khách hàng Nguyễn Văn A, trễ hạn 3 ngày...'"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-500">
                Lưu ý: Kỳ tính điểm thi đua và phạt/thưởng sẽ áp dụng trực tiếp cho <b>Tháng {currentMonth}/{currentYear}</b>. Điểm và số tiền khấu trừ/cộng thêm sẽ được tự động đồng bộ sang bảng lương của nhân sự.
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQcRecordModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all font-medium text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 text-white rounded-lg transition-all font-medium text-sm shadow active:scale-95"
                >
                  {selectedQcRecord ? "Lưu thay đổi" : "Ghi nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QC Rule Modal */}
      {isQcRuleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedQcRule ? "Sửa lỗi/thưởng master" : "Tạo Lỗi / Thưởng master mới"}
              </h2>
              <button
                onClick={() => setIsQcRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQcRuleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Mã quy tắc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={qcRuleCode}
                    onChange={(e) => setQcRuleCode(e.target.value.toUpperCase())}
                    required
                    placeholder="VD: VP07, TH05"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Phân loại <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={qcRuleType}
                    onChange={(e) => {
                      const val = e.target.value as "violation" | "bonus";
                      setQcRuleType(val);
                      if (val === 'violation') {
                        setQcRulePoints(-10);
                        setQcRuleMoney(-150000);
                      } else {
                        setQcRulePoints(10);
                        setQcRuleMoney(150000);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white font-medium"
                  >
                    <option value="violation">Lỗi Vi phạm (Trừ tiền & điểm)</option>
                    <option value="bonus">Khen Thưởng (Thêm tiền & điểm)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tên nội dung quy tắc lỗi / khen thưởng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={qcRuleName}
                  onChange={(e) => setQcRuleName(e.target.value)}
                  required
                  placeholder="Ví dụ: 'Tải hồ sơ CCCD trễ hạn', 'Hoàn thành hồ sơ xuất sắc'"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Số điểm tác động thi đua <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={qcRulePoints}
                    onChange={(e) => setQcRulePoints(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Lỗi nên nhập số âm (-), thưởng nhập số dương (+).</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Số tiền tác động lương (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={qcRuleMoney}
                    onChange={(e) => setQcRuleMoney(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Lỗi nên nhập số âm (-), thưởng nhập số dương (+).</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nhóm nghiệp vụ / Nhóm vi phạm
                </label>
                <input
                  type="text"
                  value={qcRuleCategory}
                  onChange={(e) => setQcRuleCategory(e.target.value)}
                  placeholder="Ví dụ: 'Chuyên môn', 'Giờ giấc', 'Tác phong'"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQcRuleModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all font-medium text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-all font-medium text-sm shadow active:scale-95"
                >
                  {selectedQcRule ? "Lưu thay đổi" : "Tạo quy tắc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {isUserDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">{t.info}</h3>
              <button
                onClick={() => setIsUserDetailsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-all duration-300 hover:bg-slate-100 rounded-lg transition-all duration-300 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500 overflow-hidden">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    selectedUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-800">
                    {selectedUser.name}
                  </h4>
                  <p className="text-slate-500">
                    {getUserTitleWithPracticeAreas(selectedUser, language)}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {selectedUser.staff_code || `NV${String(selectedUser.id).padStart(3, "0")}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      {t.username}
                    </label>
                    <p className="text-slate-800 font-medium">
                      {selectedUser.username}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      {t.branch}
                    </label>
                    <p className="text-slate-800 font-medium">
                      {selectedUser.branch || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      {t.startDate}
                    </label>
                    <p className="text-slate-800 font-medium">
                      {formatDisplayDate(selectedUser.start_date)}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      {t.contractType}
                    </label>
                    <p className="text-slate-800 font-medium">
                      {selectedUser.contract_type || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      Ngày ký hợp đồng
                    </label>
                    <p className="text-slate-800 font-medium">
                      {formatDisplayDate(selectedUser.contract_sign_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsUserDetailsModalOpen(false)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg transition-all duration-300 hover:bg-slate-300 transition-all duration-300 active:scale-95 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Cases({ language = "vi" }: { language?: "vi" | "en" }) {
  const t = {
    vi: {
      addCase: "Thêm vụ việc",
      caseName: "Tên vụ việc",
      client: "Khách hàng",
      selectClient: "Chọn khách hàng",
      serviceFee: "Phí dịch vụ (VND)",
      noCases: "Chưa có vụ việc nào",
    },
    en: {
      addCase: "Add Case",
      caseName: "Case Name",
      client: "Client",
      selectClient: "Select client",
      serviceFee: "Service Fee (VND)",
      noCases: "No cases yet",
    },
  }[language];

  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const load = () => {
    api.req("/api/cases").then(setCases).catch(console.error);
    api.req("/api/clients").then(setClients).catch(console.error);
  };
  useEffect(() => {
    load();
  }, []);

  const [feeValue, setFeeValue] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.req("/api/case", "POST", {
      name: fd.get("name"),
      client: fd.get("client"),
      fee: Number(feeValue.replace(/,/g, "")),
    });
    e.currentTarget.reset();
    setFeeValue("");
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
        <h3 className="text-lg font-semibold mb-4">{t.addCase}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder={t.caseName}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
          <select
            name="client"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">{t.selectClient}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="fee"
            type="text"
            placeholder={t.serviceFee}
            required
            value={feeValue}
            onChange={(e) => {
              let rawValue = e.target.value.replace(/,/g, "");
              rawValue = rawValue.replace(/^0+(?=\d)/, "");
              if (/^\d*$/.test(rawValue)) {
                setFeeValue(
                  rawValue ? Number(rawValue).toLocaleString("en-US") : "",
                );
              }
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
          <button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white py-2 rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95 font-medium">
            {t.addCase}
          </button>
        </form>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium text-slate-500">
                {t.caseName}
              </th>
              <th className="px-6 py-3 font-medium text-slate-500">
                {t.client}
              </th>
              <th className="px-6 py-3 font-medium text-slate-500">
                {t.serviceFee}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {cases.map((c) => (
              <tr
                key={c.id}
                className="transition-all duration-300 hover:bg-slate-50"
              >
                <td className="px-6 py-4">{c.name}</td>
                <td className="px-6 py-4">
                  {clients.find((cl) => cl.id === c.client)?.name || c.client}
                </td>
                <td className="px-6 py-4">{c.fee?.toLocaleString("en-US")}</td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {t.noCases}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Documents({ language = "vi" }: { language?: "vi" | "en" }) {
  const t = {
    vi: {
      selectCase: "Chọn vụ việc để quản lý tài liệu",
      selectCasePlaceholder: "-- Chọn vụ việc --",
      uploading: "Đang tải lên & xử lý...",
      uploadPrompt: "Nhấn để tải lên PDF, DOCX, XLSX",
      uploadFailed: "Tải lên thất bại",
      uploadedDocs: "Tài liệu đã tải lên",
      noDocs: "Chưa có tài liệu nào được tải lên.",
    },
    en: {
      selectCase: "Select case to manage documents",
      selectCasePlaceholder: "-- Select case --",
      uploading: "Uploading & processing...",
      uploadPrompt: "Click to upload PDF, DOCX, XLSX",
      uploadFailed: "Upload failed",
      uploadedDocs: "Uploaded Documents",
      noDocs: "No documents uploaded yet.",
    },
  }[language];

  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // Document preview states
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    api.req("/api/cases").then(setCases).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCase) {
      api.req(`/api/files/${selectedCase}`).then(setFiles).catch(console.error);
    } else {
      setFiles([]);
    }
  }, [selectedCase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedCase) return;

    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    formData.append("caseId", selectedCase);

    setUploading(true);
    try {
      await api.upload("/api/upload", formData);
      api.req(`/api/files/${selectedCase}`).then(setFiles);
    } catch (err) {
      alert(t.uploadFailed);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePreview = async (file: any) => {
    setPreviewFile(file);
    setPreviewText("");
    setPreviewLoading(true);
    try {
      const res = await api.req(`/api/files/text/${file.id}`);
      if (res && res.text) {
        setPreviewText(res.text);
      } else {
        setPreviewText("");
      }
    } catch (err) {
      console.error("Failed to load text preview:", err);
      setPreviewText("");
    } finally {
      setPreviewLoading(false);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm(language === "vi" ? "Bạn có chắc chắn muốn xóa tài liệu này?" : "Are you sure you want to delete this document?")) {
      return;
    }
    try {
      await api.req(`/api/files/${fileId}`, "DELETE");
      if (selectedCase) {
        const updatedFiles = await api.req(`/api/files/${selectedCase}`);
        setFiles(updatedFiles);
      }
    } catch (err: any) {
      alert(language === "vi" ? "Xóa tài liệu thất bại: " + err.message : "Failed to delete document: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="max-w-md space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            {t.selectCase}
          </label>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white font-medium"
          >
            <option value="">{t.selectCasePlaceholder}</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {selectedCase && (
            <div>
              <label className="block w-full cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center transition-all duration-300 hover:bg-slate-100 transition-all duration-300 active:scale-95">
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <span className="text-sm text-slate-600 font-medium">
                  {uploading ? t.uploading : t.uploadPrompt}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.xlsx"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {selectedCase && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800">{t.uploadedDocs}</h3>
          </div>
          <ul className="divide-y divide-slate-200">
            {files.length === 0 ? (
              <li className="p-6 text-center text-slate-500">{t.noDocs}</li>
            ) : (
              files.map((f) => (
                <li
                  key={f.id}
                  onClick={() => handlePreview(f)}
                  className="p-4 flex items-center justify-between gap-3 transition-all duration-300 hover:bg-slate-50 active:scale-[0.99] cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-[var(--color-primary)] shrink-0" size={20} />
                    <span className="text-slate-700 font-medium group-hover:text-[var(--color-primary)] transition-colors">
                      {f.filename}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase px-2 py-1 bg-slate-100 text-slate-500 rounded group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {getFileExtension(f.filename)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(f);
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Xem trước"
                    >
                      <Eye size={16} />
                    </button>
                    <a
                      href={`/api/files/download/${f.id}`}
                      download={f.filename}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Tải xuống"
                    >
                      <Download size={16} />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(f.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Xóa tài liệu"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[70] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="text-[var(--color-primary)] shrink-0" size={24} />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 truncate" title={previewFile.filename}>
                    {previewFile.filename}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Vụ án: {cases.find(c => c.id === selectedCase)?.name || "Chưa rõ"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/files/download/${previewFile.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Eye size={14} /> Mở tab mới
                </a>
                <a
                  href={`/api/files/download/${previewFile.id}`}
                  download={previewFile.filename}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--color-primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-primary-light)] transition-colors shadow-sm"
                >
                  <Download size={14} /> Tải bản gốc
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-6 flex flex-col justify-between">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Trích xuất nội dung văn bản</span>
                  <span>Định dạng: {getFileExtension(previewFile.filename)}</span>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto font-mono text-sm text-slate-800 leading-relaxed bg-white">
                  {previewLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                      <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
                      <p className="font-sans font-semibold">Đang nạp và trích xuất nội dung...</p>
                    </div>
                  ) : ["png", "jpg", "jpeg", "gif", "webp"].includes(getFileExtension(previewFile.filename)) ? (
                    <div className="h-full flex items-center justify-center p-4">
                      <img
                        src={`/api/files/download/${previewFile.id}`}
                        alt={previewFile.filename}
                        className="max-h-full max-w-full object-contain rounded-lg shadow-sm border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : getFileExtension(previewFile.filename) === "pdf" ? (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 mb-4">
                        <iframe
                          src={`/api/files/download/${previewFile.id}`}
                          className="w-full h-full border-0 rounded-lg"
                          title="PDF Viewer"
                        />
                      </div>
                      <details className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <summary className="cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-800 font-sans select-none">
                          Xem bản dịch văn bản thô (AI Text Extraction)
                        </summary>
                        <pre className="mt-3 text-xs whitespace-pre-wrap leading-relaxed font-mono text-slate-700 bg-white p-4 rounded border border-slate-200 max-h-60 overflow-y-auto">
                          {previewText || "Không có nội dung văn bản thô trích xuất được hoặc tệp trống."}
                        </pre>
                      </details>
                    </div>
                  ) : previewText ? (
                    <pre className="whitespace-pre-wrap font-mono text-slate-800 select-text">
                      {previewText}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans p-6 text-center">
                      <FileText size={48} className="text-slate-300 mb-3" />
                      <h4 className="font-bold text-slate-700 mb-1">Không có bản xem trước trực tiếp</h4>
                      <p className="text-xs text-slate-400 max-w-md mb-4">
                        Tệp tin này không chứa văn bản trích xuất được hoặc không thể hiển thị trực tiếp. Vui lòng tải xuống bản gốc để xem chi tiết.
                      </p>
                      <a
                        href={`/api/files/download/${previewFile.id}`}
                        download={previewFile.filename}
                        className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[var(--color-primary)] px-4 py-2 rounded-lg hover:bg-[var(--color-primary-light)] transition-colors shadow-sm"
                      >
                        <Download size={14} /> Tải bản gốc ngay
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Payroll({ language }: { language: "vi" | "en" }) {
  const t = {
    vi: {
      calculatePayroll: "Tính lương",
      selectEmployee: "Chọn nhân sự",
      calcAndSave: "Tính & Lưu",
      employee: "Nhân sự",
      baseSalary: "Lương cơ bản",
      insurance: "Bảo hiểm",
      pit: "Thuế TNCN",
      netSalary: "Thực nhận",
      noPayroll: "Chưa có bảng lương nào",
    },
    en: {
      calculatePayroll: "Calculate Payroll",
      selectEmployee: "Select Employee",
      calcAndSave: "Calculate & Save",
      employee: "Employee",
      baseSalary: "Base Salary",
      insurance: "Insurance",
      pit: "PIT",
      netSalary: "Net Salary",
      noPayroll: "No payroll records yet",
    },
  }[language];

  const [employees, setEmployees] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);

  const load = () => {
    api.req("/api/employees").then(setEmployees).catch(console.error);
    api.req("/api/monthly-payrolls")
       .then((data: any[]) => setPayrolls(data.map(d => calculateFullPayroll(d))))
       .catch(console.error);
  };
  useEffect(() => {
    load();
  }, []);

  const handleCalculate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.req("/api/monthly-payrolls", "POST", {
      user_id: fd.get("employee_id"),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      working_days: 26,
      gross: 0,
      insurance: 0,
      tax: 0,
      net: 0,
    });
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-fit">
        <h3 className="text-lg font-semibold mb-4">{t.calculatePayroll}</h3>
        <form onSubmit={handleCalculate} className="space-y-4">
          <select
            name="employee_id"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white font-medium"
          >
            <option value="">{t.selectEmployee}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white py-2 rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-95 font-medium">
            {t.calcAndSave}
          </button>
        </form>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium text-slate-500">
                {t.employee}
              </th>
              <th className="px-6 py-3 font-medium text-slate-500">
                {t.baseSalary}
              </th>
              <th className="px-6 py-3 font-medium text-slate-500">
                {t.insurance}
              </th>
              <th className="px-6 py-3 font-medium text-slate-500">{t.pit}</th>
              <th className="px-6 py-3 font-medium text-slate-500">
                {t.netSalary}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payrolls.map((p, i) => (
              <tr
                key={i}
                className="transition-all duration-300 hover:bg-slate-50"
              >
                <td className="px-6 py-4">{p.user_name}</td>
                <td className="px-6 py-4">
                  {p.gross?.toLocaleString("en-US")}
                </td>
                <td className="px-6 py-4">
                  {p.insurance?.toLocaleString("en-US")}
                </td>
                <td className="px-6 py-4">{p.tax?.toLocaleString("en-US")}</td>
                <td className="px-6 py-4 font-semibold text-emerald-600">
                  {p.net?.toLocaleString("en-US")}
                </td>
              </tr>
            ))}
            {payrolls.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {t.noPayroll}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AIAssistant({ 
  language, 
  initialPrompt, 
  setInitialPrompt 
}: { 
  language: "vi" | "en"; 
  initialPrompt?: string; 
  setInitialPrompt?: (p: string) => void; 
}) {
  const t = {
    vi: {
      welcomeMsg:
        "Xin chào! Tôi là Trợ lý AI Siêu Việt của Ánh Dương Law. Tôi có thể giúp gì cho bạn hôm nay? Tôi đã được kết nối với dữ liệu hệ thống ERP, tri thức con người huấn luyện và có khả năng tìm kiếm trực tuyến thời gian thực.",
      orchestrator: "Điều phối viên",
      synthesis: "Tổng hợp",
      speed: "Tốc độ",
      reasoning: "Lập luận",
      scan: "Scan",
      pdf: "PDF",
      title: "🔥 AI LAW ERP PRO++",
      subtitle: "Hệ thống tự động liên kết dữ liệu ERP, internet và tri thức chuyên gia",
      orchestratorCoordinating: "AI đang phân tích dữ liệu",
      inputPlaceholder:
        "Nhập câu hỏi pháp lý hoặc yêu cầu tra cứu hệ thống. AI sẽ kết hợp ERP, internet và tri thức đã học...",
      analyzingReq: "Đang phân tích yêu cầu...",
      receivedReq: "Đã tiếp nhận yêu cầu.",
      docAIExtracting: "Đang trích xuất nội dung tài liệu đính kèm...",
      claudeAnalyzing:
        "Đang rà soát và đối chiếu căn cứ pháp lý...",
      chatGPTSynthesizing: "Đang tổng hợp thông tin từ hệ thống...",
      claudeBuilding: "Đang xây dựng lập luận pháp lý...",
      geminiSearching: "Đang tìm kiếm thông tin trên internet...",
      checkDocAnalyzing:
        "Đang đối chiếu tệp đã soạn với thông tin gốc...",
      checkDocSpellChecking:
        "Đang rà soát lỗi chính tả và cấu trúc câu...",
      docReply: (fileName: string) =>
        `Dựa trên tài liệu "${fileName}" bạn cung cấp, AI đã trích xuất thành công nội dung và đưa ra các lập luận pháp lý như sau:\n\n1. Rủi ro hợp đồng: Các điều khoản về phạt vi phạm đang vượt quá 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm (theo Luật Thương mại 2005).\n2. Căn cứ pháp lý: Điều 301 Luật Thương mại 2005.\n3. Đề xuất: Cần điều chỉnh lại mức phạt vi phạm để đảm bảo tính hợp pháp.`,
      checkDocReply: (file1: string, file2: string) =>
        `Tôi đã hoàn tất việc đối chiếu giữa tệp đã soạn ("${file1}") và tệp thông tin gốc ("${file2}"). Dưới đây là kết quả kiểm tra:\n\n🚨 **Cảnh báo sai lệch thông tin:**\n- **Tên khách hàng:** Trong tệp đã soạn ghi là "Nguyễn Văn B", nhưng tệp thông tin gốc là "Nguyễn Văn A".\n- **Số tiền bồi thường:** Tệp đã soạn ghi "50.000.000 VNĐ", tệp gốc ghi "500.000.000 VNĐ".\n\n📝 **Lỗi chính tả phát hiện:**\n- Đoạn 2, dòng 3: "tranh chập" -> Đề xuất sửa thành: "tranh chấp".\n- Đoạn 4, dòng 1: "khởi kiên" -> Đề xuất sửa thành: "khởi kiện".\n\n💡 **Đề xuất chỉnh sửa:**\nBạn nên rà soát lại các con số và tên định danh để đảm bảo tính pháp lý của văn bản. Bạn có muốn tôi tự động tạo bản nháp đã chỉnh sửa không?`,
      chatGPTReply:
        "AI đã tổng hợp các thông tin chính theo yêu cầu của bạn:\n\n- Điểm 1: Hồ sơ khách hàng Nguyễn Văn A đã đầy đủ giấy tờ tùy thân.\n- Điểm 2: Thiếu hợp đồng lao động bản gốc.\n- Điểm 3: Cần bổ sung giấy khám sức khỏe trước ngày 15/10.",
      claudeReply:
        "AI đã phân tích tình huống tranh chấp của bạn. Dưới đây là các căn cứ pháp lý và hướng giải quyết đề xuất:\n\n- Theo Điều 385 Bộ luật Dân sự 2015 về Hợp đồng dân sự...\n- Khả năng thắng kiện: Cao, do có đầy đủ bằng chứng giao dịch qua email.\n- Bước tiếp theo: Chuẩn bị Đơn khởi kiện và nộp tại TAND cấp Huyện nơi bị đơn cư trú.",
      geminiReply:
        "AI đã tìm thấy câu trả lời nhanh cho bạn: Theo quy định hiện hành, thời hạn giải quyết khiếu nại lần đầu là không quá 30 ngày kể từ ngày thụ lý (Điều 28 Luật Khiếu nại 2011).",
    },
    en: {
      welcomeMsg:
        "Hello! I am the Smart AI Assistant of Anh Duong Law. I am connected to ERP database, trained human knowledge and live Google Search grounding. How can I help you today?",
      orchestrator: "Coordinator",
      synthesis: "Synthesis",
      speed: "Speed",
      reasoning: "Reasoning",
      scan: "Scan",
      pdf: "PDF",
      title: "🔥 AI LAW ERP PRO++",
      subtitle: "Unified system connecting ERP data, real-time internet, and expert rules",
      orchestratorCoordinating: "AI is analyzing data",
      inputPlaceholder:
        "Ask a question or request ERP lookup. AI will coordinate ERP, web search, and trained rules...",
      analyzingReq: "Analyzing request...",
      receivedReq: "Request received.",
      docAIExtracting: "Extracting content from attachments...",
      claudeAnalyzing:
        "Cross-checking legal bases and clauses...",
      chatGPTSynthesizing: "Synthesizing information from ERP...",
      claudeBuilding: "Building legal arguments...",
      geminiSearching: "Searching the web for regulations...",
      checkDocAnalyzing:
        "Cross-checking drafted file with original info file...",
      checkDocSpellChecking:
        "Reviewing spelling and grammar errors...",
      docReply: (fileName: string) =>
        `Based on the document "${fileName}" you provided, AI successfully extracted content and drafted these arguments:\n\n1. Risk: Penalty for breach exceeds 8% of the breached obligation value (under 2005 Commercial Law).\n2. Legal basis: Article 301, Commercial Law 2005.\n3. Rec: Adjust the penalty level to ensure compliance.`,
      checkDocReply: (file1: string, file2: string) =>
        `I have completed the cross-check between the drafted file ("${file1}") and the original information file ("${file2}"). Results:\n\n🚨 **Information Mismatch Warning:**\n- **Client Name:** Drafted says "Nguyen Van B", but original says "Nguyen Van A".\n- **Compensation:** Drafted says "50,000,000 VND", original says "500,000,000 VND".\n\n📝 **Spelling Errors Detected:**\n- Para 2, line 3: "disput" -> Suggested correction: "dispute".\n- Para 4, line 1: "lawsiut" -> Suggested correction: "lawsuit".\n\n💡 **Suggested Edits:**\nYou should review numbers and identifiers to ensure accuracy. Would you like me to auto-generate a draft?`,
      chatGPTReply:
        "AI has synthesized the main information as requested:\n\n- Point 1: Client Nguyen Van A's file has complete identification documents.\n- Point 2: Missing original labor contract.\n- Point 3: Need to supplement health certificate before Oct 15.",
      claudeReply:
        "AI has analyzed your dispute situation. Below are the legal bases and proposed solutions:\n\n- According to Article 385 of the 2015 Civil Code on Civil Contracts...\n- Probability of winning: High, due to complete evidence of transactions via email.\n- Next step: Prepare a Petition and submit it to the District People's Court where the defendant resides.",
      geminiReply:
        "AI found a quick answer for you: According to current regulations, the time limit for settling a first-time complaint is no more than 30 days from the date of acceptance (Article 28 of the 2011 Law on Complaints).",
    },
  }[language];

  // Original states
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (initialPrompt) {
      setChatInput(initialPrompt);
      if (setInitialPrompt) {
        setInitialPrompt("");
      }
    }
  }, [initialPrompt, setInitialPrompt]);
  const [messages, setMessages] = useState<
    { role: string; content: string; agents?: string[]; files?: string[] }[]
  >([
    {
      role: "ai",
      content: t.welcomeMsg,
      agents: ["Orchestrator"],
    },
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);

  const [compareMode, setCompareMode] = useState<"none" | "upload" | "review">(
    "none",
  );
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [compareResult, setCompareResult] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Smart AI and Training States
  const [subTab, setSubTab] = useState<"chat" | "training">("chat");
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(true);
  const [trainingList, setTrainingList] = useState<any[]>([]);
  const [isLoadingTraining, setIsLoadingTraining] = useState<boolean>(false);
  const [searchRule, setSearchRule] = useState<string>("");

  // CMS Dynamic AI Providers sync state
  const [aiProviders, setAiProviders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("ai_platform_providers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [selectedProviderId, setSelectedProviderId] = useState<number | "auto">("auto");

  useEffect(() => {
    const syncProviders = () => {
      try {
        const saved = localStorage.getItem("ai_platform_providers");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAiProviders(parsed);
          }
        }
      } catch (e) {}
    };
    syncProviders();
    window.addEventListener("storage", syncProviders);
    window.addEventListener("storage_ai_providers_updated", syncProviders);
    return () => {
      window.removeEventListener("storage", syncProviders);
      window.removeEventListener("storage_ai_providers_updated", syncProviders);
    };
  }, []);
  
  // Training form states
  const [newTopic, setNewTopic] = useState<string>("");
  const [newPattern, setNewPattern] = useState<string>("");
  const [newResponse, setNewResponse] = useState<string>("");
  const [isAddingRule, setIsAddingRule] = useState<boolean>(false);

  // Load training list on start
  useEffect(() => {
    fetchTrainingList();
  }, []);

  const fetchTrainingList = async () => {
    setIsLoadingTraining(true);
    try {
      const res = await fetch("/api/ai/training");
      if (res.ok) {
        const data = await res.json();
        setTrainingList(data);
      }
    } catch (e) {
      console.error("Failed to load training data", e);
    } finally {
      setIsLoadingTraining(false);
    }
  };

  const handleAddTrainingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newPattern.trim() || !newResponse.trim()) {
      alert(language === "vi" ? "Vui lòng nhập đầy đủ các trường" : "Please fill in all fields");
      return;
    }
    setIsAddingRule(true);
    try {
      const res = await fetch("/api/ai/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newTopic.trim(),
          pattern: newPattern.trim(),
          response: newResponse.trim()
        })
      });
      if (res.ok) {
        setNewTopic("");
        setNewPattern("");
        setNewResponse("");
        fetchTrainingList();
        alert(language === "vi" ? "Huấn luyện AI thành công!" : "AI trained successfully!");
      } else {
        const err = await res.json();
        alert("Lỗi: " + (err.error || "Không thể lưu dữ liệu"));
      }
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setIsAddingRule(false);
    }
  };

  const handleDeleteTrainingRule = async (id: number) => {
    if (!confirm(language === "vi" ? "Bạn có chắc chắn muốn xóa luật huấn luyện này?" : "Are you sure you want to delete this rule?")) {
      return;
    }
    try {
      const res = await fetch(`/api/ai/training/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTrainingList();
      }
    } catch (e) {
      console.error("Failed to delete rule", e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, processingSteps]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const prepareAIFile = async (
    file: File,
  ): Promise<{
    mimeType?: string;
    data?: string;
    text?: string;
    name?: string;
  }> => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    // Convert docx into text
    if (ext === "docx") {
      try {
        const mammothLib = await import("mammoth");
        const mammoth = mammothLib.default || mammothLib;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return { text: result.value, name: file.name };
      } catch (e) {
        console.error("Mammoth error:", e);
        // Fallback to text parsing
      }
    }

    // Convert txt, md, csv into text
    if (ext === "txt" || ext === "csv" || ext === "md") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
          resolve({ text: reader.result as string, name: file.name });
        };
        reader.onerror = (error) => reject(error);
      });
    }

    // For PDF and Images, use inlineData (Gemini natively supports them)
    let mime = file.type;
    if (!mime) {
      if (ext === "pdf") mime = "application/pdf";
      else if (ext === "png") mime = "image/png";
      else if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";
      else mime = "application/octet-stream";
    }
    const b64 = await fileToBase64(file);
    return { mimeType: mime, data: b64, name: file.name };
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && uploadedFiles.length === 0) return;

    const newMessages = [
      ...messages,
      {
        role: "user",
        content: chatInput,
        files: uploadedFiles.map((f) => f.name),
      },
    ];
    setMessages(newMessages);
    const currentInput = chatInput;
    const currentFiles = [...uploadedFiles];

    setChatInput("");
    setUploadedFiles([]);
    setIsProcessing(true);
    setProcessingSteps([t.analyzingReq]);

    try {
      let selectedAgents: string[] = [];
      let steps = [t.receivedReq];
      const inputLower = currentInput.toLowerCase();
      const hasFiles = currentFiles.length > 0;

      if (hasFiles) {
        if (
          currentFiles.length >= 2 ||
          inputLower.includes("kiểm tra") ||
          inputLower.includes("đối chiếu") ||
          inputLower.includes("check")
        ) {
          if (currentFiles.length < 2) {
            selectedAgents.push("Orchestrator");
            steps.push(
              language === "vi"
                ? "Kiểm tra tệp đính kèm..."
                : "Checking attachments...",
            );
          } else {
            selectedAgents.push("Document AI", "Claude");
            steps.push(t.docAIExtracting);
            steps.push(t.checkDocSpellChecking);
            steps.push(t.checkDocAnalyzing);
          }
        } else if (
          inputLower.includes("tổng hợp") ||
          inputLower.includes("tóm tắt") ||
          inputLower.includes("summarize") ||
          inputLower.includes("synthesis")
        ) {
          selectedAgents.push("Document AI", "ChatGPT");
          steps.push(t.docAIExtracting);
          steps.push(
            language === "vi"
              ? "Đang tóm tắt nội dung..."
              : "Summarizing content...",
          );
        } else {
          selectedAgents.push("Document AI", "Claude");
          steps.push(t.docAIExtracting);
          steps.push(t.claudeAnalyzing);
        }
      } else if (
        inputLower.includes("kiểm tra") ||
        inputLower.includes("đối chiếu") ||
        inputLower.includes("check")
      ) {
        selectedAgents.push("Orchestrator");
        steps.push(
          language === "vi"
            ? "Kiểm tra tệp đính kèm..."
            : "Checking attachments...",
        );
      } else if (
        inputLower.includes("chính tả") ||
        inputLower.includes("ngữ pháp") ||
        inputLower.includes("spelling") ||
        inputLower.includes("grammar")
      ) {
        selectedAgents.push("ChatGPT");
        steps.push(
          language === "vi"
            ? "Đang phân tích ngữ pháp và chính tả..."
            : "Analyzing grammar and spelling...",
        );
      } else if (
        inputLower.includes("tổng hợp") ||
        inputLower.includes("tóm tắt") ||
        inputLower.includes("summarize") ||
        inputLower.includes("synthesis")
      ) {
        selectedAgents.push("ChatGPT");
        steps.push(t.chatGPTSynthesizing);
      } else if (
        inputLower.includes("luật") ||
        inputLower.includes("kiện") ||
        inputLower.includes("tranh chấp") ||
        inputLower.includes("law") ||
        inputLower.includes("sue") ||
        inputLower.includes("dispute")
      ) {
        selectedAgents.push("Claude");
        steps.push(t.claudeBuilding);
      } else {
        selectedAgents.push("Gemini");
        steps.push(t.geminiSearching);
      }

      setProcessingSteps(steps);

      const aiFiles: any[] = [];
      for (const file of currentFiles) {
        const aiFile = await prepareAIFile(file);
        aiFiles.push(aiFile);
      }

      let promptText = currentInput || "Hãy giải thích ngắn gọn tài liệu này.";
      if (hasFiles) {
        promptText = `Context: User uploaded files: ${currentFiles.map((f) => f.name).join(", ")}. \nUser request: ${promptText}\nPlease read the attached files and provide a helpful, detailed, and completely accurate response based ONLY on their content. Answer in the same language as the user's request.`;
      }

      const { askAI } = await import("../services/ai.service");
      const finalReply = await askAI(promptText, aiFiles, enableSearchGrounding);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: finalReply,
          agents: selectedAgents.length ? selectedAgents : ["Orchestrator"],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Lỗi xử lý AI: " + err.message,
          agents: ["Orchestrator"],
        },
      ]);
    } finally {
      setIsProcessing(false);
      setProcessingSteps([]);
    }
  };

  const filteredRules = trainingList.filter(rule => {
    if (!searchRule) return true;
    const lower = searchRule.toLowerCase();
    return (
      rule.topic?.toLowerCase().includes(lower) ||
      rule.pattern?.toLowerCase().includes(lower) ||
      rule.response?.toLowerCase().includes(lower)
    );
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Left Sidebar: Ecosystem Status */}
      <div className="w-72 bg-slate-50/90 border-r border-slate-200 p-4 hidden md:flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <h3 className="font-bold text-[var(--color-primary)] flex items-center gap-2 text-sm">
            <Globe size={18} className="text-indigo-600" /> AI Ecosystem
          </h3>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
            {aiProviders.filter(p => p.is_active === 1).length} Active
          </span>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Orchestrator Option */}
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider flex items-center justify-between">
              <span>ORCHESTRATOR</span>
              <span className="text-[10px] text-emerald-600 font-bold">Auto Route</span>
            </div>
            <div 
              onClick={() => setSelectedProviderId("auto")}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                selectedProviderId === "auto"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                  : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:shadow-sm"
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedProviderId === "auto" ? "bg-emerald-300 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs block truncate">{t.orchestrator || "Điều phối viên AI 24/7"}</span>
                <span className={`text-[10px] block truncate ${selectedProviderId === "auto" ? "text-indigo-100" : "text-slate-400"}`}>
                  Tự động điều phối theo câu hỏi
                </span>
              </div>
            </div>
          </div>

          {/* CMS Configured AI Providers List */}
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider flex items-center justify-between">
              <span>CÔNG CỤ AI HOẠT ĐỘNG ({aiProviders.filter(p => p.is_active === 1).length}/{aiProviders.length})</span>
            </div>

            <div className="space-y-2">
              {aiProviders.map((provider) => {
                const isActive = provider.is_active === 1;
                const isSelected = selectedProviderId === provider.id;

                return (
                  <div
                    key={provider.id}
                    onClick={() => isActive && setSelectedProviderId(provider.id)}
                    className={`p-3 rounded-xl border transition-all ${
                      !isActive
                        ? "bg-slate-100/80 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm ring-2 ring-indigo-500/50 cursor-pointer"
                        : "bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {provider.provider_type === "gemini" && <Sparkles size={14} className={isActive ? "text-blue-500 shrink-0" : "text-slate-400 shrink-0"} />}
                        {provider.provider_type === "openai" && <Bot size={14} className={isActive ? "text-emerald-500 shrink-0" : "text-slate-400 shrink-0"} />}
                        {provider.provider_type === "claude" && <Cpu size={14} className={isActive ? "text-amber-500 shrink-0" : "text-slate-400 shrink-0"} />}
                        {provider.provider_type === "deepseek" && <Search size={14} className={isActive ? "text-indigo-500 shrink-0" : "text-slate-400 shrink-0"} />}
                        {provider.provider_type === "ollama" && <Server size={14} className={isActive ? "text-purple-500 shrink-0" : "text-slate-400 shrink-0"} />}
                        {provider.provider_type !== "gemini" && provider.provider_type !== "openai" && provider.provider_type !== "claude" && provider.provider_type !== "deepseek" && provider.provider_type !== "ollama" && <Zap size={14} className={isActive ? "text-cyan-500 shrink-0" : "text-slate-400 shrink-0"} />}
                        
                        <span className="font-bold text-xs truncate">{provider.name}</span>
                      </div>

                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0 ${
                        isActive 
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300" 
                          : "bg-slate-200 text-slate-500 border border-slate-300"
                      }`}>
                        {isActive ? "Đang bật" : "Tắt"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold truncate max-w-[130px]">
                        {provider.default_model || "model"}
                      </span>
                      {provider.latency_ms ? (
                        <span className="text-[10px] text-emerald-600 font-mono font-medium">
                          ⚡ {provider.latency_ms}ms
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-mono">CMS Active</span>
                      )}
                    </div>

                    {provider.task_assignment && (
                      <div className="text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="truncate text-slate-500 font-medium">
                          {provider.task_assignment === "all" ? "Tất cả nghiệp vụ" : provider.task_assignment}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-primary)] font-serif flex items-center gap-2">
              <span className="text-2xl">🔥</span> {t.title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
          </div>
          
          {/* Sub Tab Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-center">
            <button
              onClick={() => setSubTab("chat")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${subTab === "chat" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              <MessageSquare size={16} />
              {language === "vi" ? "Trò chuyện" : "Chat Assistant"}
            </button>
            <button
              onClick={() => setSubTab("training")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${subTab === "training" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              <Award size={16} />
              {language === "vi" ? "Huấn luyện AI" : "AI Training"}
            </button>
          </div>
        </div>

        {subTab === "training" ? (
          /* ================================== AI TRAINING CENTER VIEW ================================== */
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form to teach AI */}
              <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Award className="text-amber-500" size={20} />
                  {language === "vi" ? "Huấn luyện quy tắc / Q&A mới" : "Teach New Custom Rule"}
                </h3>

                <form onSubmit={handleAddTrainingRule} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      {language === "vi" ? "Chủ đề / Chuyên mục" : "Topic / Category"}
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Quy trình báo cáo ngày, Mẫu hợp đồng chuẩn..."
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      {language === "vi" ? "Từ khóa kích hoạt (Cách nhau bởi dấu phẩy)" : "Keywords/Patterns (Comma separated)"}
                    </label>
                    <input
                      type="text"
                      placeholder="VD: quy trình báo cáo, nhật ký, ghi nhận log"
                      value={newPattern}
                      onChange={(e) => setNewPattern(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      required
                    />
                    <p className="text-slate-400 text-[11px] mt-1">
                      {language === "vi" 
                        ? "Khi người dùng hỏi có chứa các từ khóa này, AI sẽ ưu tiên trả lời theo mẫu đã dạy."
                        : "AI will recall this knowledge when query contains these trigger words."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      {language === "vi" ? "Nội dung câu trả lời chuẩn (Template)" : "Expert Response Template"}
                    </label>
                    <textarea
                      placeholder="Nhập nội dung hướng dẫn chi tiết của luật sư, điều khoản chuẩn hoặc quy định công ty..."
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingRule}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAddingRule ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                    {language === "vi" ? "Lưu Luật Huấn Luyện" : "Save Training Rule"}
                  </button>
                </form>
              </div>

              {/* Connected databases & AI dashboard status */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Visual Connected Map Card */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-lg shadow-md border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-indigo-200 flex items-center gap-2">
                      <ShieldCheck className="text-emerald-400" size={22} />
                      {language === "vi" ? "Bản đồ Năng lực AI" : "AI Cognitive Capacity Map"}
                    </h3>
                    <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full text-xs font-medium animate-pulse">
                      ● {language === "vi" ? "Thông minh đỉnh cao" : "Supercharged"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold">
                        <FileText size={16} />
                        <span>Hồ sơ ERP (100%)</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        AI tự động tra cứu, trích xuất 9 bảng dữ liệu SQLite bao gồm Khách hàng, Lịch xét xử, Doanh thu, Nhân sự và Công việc ERP.
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold">
                        <Award size={16} />
                        <span>Quy chế Dạy ({trainingList.length} bộ)</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        AI học từ tri thức chuyên gia, quy tắc nội bộ và các câu trả lời do người dùng biên soạn để luôn phản hồi đúng định hướng.
                      </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold">
                        <Globe size={16} />
                        <span>Google Search</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Tích hợp trực tiếp Google Search thời gian thực giúp AI cập nhật quy định pháp lý, thông tin báo chí và dữ liệu Internet mới nhất.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Library of trained rules */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <CheckCircle2 className="text-indigo-600" size={18} />
                      {language === "vi" ? "Thư viện kiến thức hiện có" : "Current Knowledge Library"}
                    </h3>

                    {/* Search knowledge bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={language === "vi" ? "Tìm kiếm quy tắc..." : "Search rules..."}
                        value={searchRule}
                        onChange={(e) => setSearchRule(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg outline-none text-xs w-full sm:w-64 focus:ring-1 focus:ring-indigo-500"
                      />
                      <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    {isLoadingTraining ? (
                      <div className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin text-indigo-500" size={16} />
                        <span>Đang tải danh sách kiến thức...</span>
                      </div>
                    ) : filteredRules.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        {language === "vi" ? "Không tìm thấy luật huấn luyện nào." : "No training rules found."}
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                            <th className="p-3">{language === "vi" ? "Chủ đề" : "Topic"}</th>
                            <th className="p-3">{language === "vi" ? "Từ khóa kích hoạt" : "Triggers"}</th>
                            <th className="p-3">{language === "vi" ? "Mẫu phản hồi" : "Response template"}</th>
                            <th className="p-3 text-center">{language === "vi" ? "Hành động" : "Action"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRules.map((rule) => (
                            <tr key={rule.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">{rule.topic}</td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono rounded border border-indigo-100">
                                  {rule.pattern}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 max-w-[250px] truncate">{rule.response}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteTrainingRule(rule.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all active:scale-95"
                                  title="Xóa tri thức"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* ================================== STANDARD CHAT VIEW WITH GROUNDING TOGGLE ================================== */
          <>
            {compareMode === "upload" ? (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-2xl w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">
                      {language === "vi"
                        ? "Kiểm tra đối chiếu & Sửa lỗi văn bản"
                        : "Compare & Spell Check Documents"}
                    </h3>
                    <button
                      onClick={() => setCompareMode("none")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === "vi"
                          ? "Tệp gốc (Original document):"
                          : "Original document:"}
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center transition-all duration-300 hover:bg-slate-50 relative active:scale-95">
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setOriginalFile(e.target.files[0]);
                            }
                          }}
                        />
                        <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        {originalFile ? (
                          <p className="text-sm font-medium text-[var(--color-primary)] truncate">
                            {originalFile.name}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500">
                            {language === "vi"
                              ? "Chọn tệp gốc"
                              : "Select original file"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {language === "vi"
                          ? "Tệp cần đối chiếu (Revised document):"
                          : "Revised document:"}
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center transition-all duration-300 hover:bg-slate-50 relative active:scale-95">
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setRevisedFile(e.target.files[0]);
                            }
                          }}
                        />
                        <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        {revisedFile ? (
                          <p className="text-sm font-medium text-[var(--color-primary)] truncate">
                            {revisedFile.name}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500">
                            {language === "vi"
                              ? "Chọn tệp cần đối chiếu"
                              : "Select revised file"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setCompareMode("none")}
                      className="px-6 py-2.5 text-slate-600 font-medium transition-all duration-300 hover:bg-slate-100 rounded-lg active:scale-95"
                    >
                      {language === "vi" ? "Hủy" : "Cancel"}
                    </button>
                    <button
                      onClick={async () => {
                        if (originalFile && revisedFile) {
                          setIsComparing(true);
                          try {
                            const f1 = await prepareAIFile(originalFile);
                            const f2 = await prepareAIFile(revisedFile);
                            const { askAI } =
                              await import("../services/ai.service");

                            const prompt =
                              language === "vi"
                                ? `Hãy đối chiếu và kiểm tra lỗi chính tả của 2 tài liệu đính kèm. Đầu tiên là file gốc, thứ hai là file đã chỉnh sửa. Hãy chỉ ra sự khác biệt, cảnh báo sai lệch thông tin và lỗi chính tả. Định dạng kết quả dưới dạng Markdown dễ đọc.`
                                : `Please cross-check and spell-check the 2 attached documents. First is the original file, second is the revised file. Point out differences, information mismatches, and spelling errors. Format the result as easy-to-read Markdown.`;

                            const res = await askAI(prompt, [f1, f2], enableSearchGrounding);
                            setCompareResult(res);
                            setCompareMode("review");
                          } catch (err: any) {
                            alert("Lỗi xử lý AI: " + err.message);
                          } finally {
                            setIsComparing(false);
                          }
                        } else {
                          alert(
                            language === "vi"
                              ? "Vui lòng chọn đủ 2 tệp"
                              : "Please select both files",
                          );
                        }
                      }}
                      disabled={!originalFile || !revisedFile || isComparing}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isComparing ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <ArrowRightLeft size={18} />
                      )}
                      {language === "vi"
                        ? isComparing
                          ? "Đang phân tích..."
                          : "Đối chiếu"
                        : isComparing
                          ? "Analyzing..."
                          : "Compare"}
                    </button>
                  </div>
                </div>
              </div>
            ) : compareMode === "review" ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center bg-slate-50 gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <button
                      onClick={() => setCompareMode("upload")}
                      className="text-slate-500 hover:text-slate-800 shrink-0 animate-pulse"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h3 className="font-bold text-slate-800 whitespace-nowrap shrink-0">
                      {language === "vi"
                        ? "Sửa lỗi hoàn tất: Bản đối chiếu & Sửa lỗi chính tả"
                        : "Done: Compare & Spell Check Result"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 min-w-0">
                      <span className="truncate max-w-[150px]">
                        {originalFile?.name}
                      </span>
                      <ArrowRightLeft size={14} className="shrink-0" />
                      <span className="truncate max-w-[150px]">
                        {revisedFile?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        const { Document, Packer, Paragraph, TextRun } = await import("docx");
                        const doc = new Document({
                          sections: [
                            {
                              properties: {},
                              children: compareResult.split("\n").map(
                                (line) =>
                                  new Paragraph({
                                    children: [new TextRun(line)],
                                  }),
                              ),
                            },
                          ],
                        });

                        Packer.toBlob(doc).then((blob) => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "Ban_chinh_sua_hoan_chinh.docx";
                          a.click();
                          window.URL.revokeObjectURL(url);
                        });
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium whitespace-nowrap flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <Download size={16} />
                      {language === "vi"
                        ? "Tải tệp hoàn chỉnh"
                        : "Download Final File"}
                    </button>
                    <button
                      onClick={() => {
                        alert(
                          language === "vi"
                            ? "Đã lưu tệp vào hệ thống."
                            : "File saved to system.",
                        );
                        setCompareMode("none");
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 text-sm font-medium whitespace-nowrap flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <Save size={16} />
                      {language === "vi" ? "Lưu vào Hồ sơ" : "Save to Record"}
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Document Content - Fully Edited */}
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
                    <div className="max-w-4xl w-full mx-auto bg-white shadow-xl border border-slate-300 p-8 min-h-full font-sans text-sm text-slate-800 dark:text-slate-200 markdown-body prose prose-slate dark:prose-invert">
                      <Markdown>{compareResult || "*(Trống)*"}</Markdown>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-4 max-w-4xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${msg.role === "ai" ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white" : "bg-slate-200 text-slate-600"}`}
                      >
                        {msg.role === "ai" ? (
                          <Shield size={20} />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-[200px]">
                        {msg.role === "ai" && msg.agents && (
                          <div className="flex items-center gap-2 mb-1">
                            {msg.agents.map((agent) => (
                              <span
                                key={agent}
                                className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-100 shadow-sm"
                              >
                                {agent}
                              </span>
                            ))}
                            {enableSearchGrounding && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Google Search Live
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          className={`p-4 rounded-lg ${msg.role === "user" ? "bg-blue-600 text-white rounded-lg" : "bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm"}`}
                        >
                          {msg.files && msg.files.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {msg.files.map((f) => (
                                <div
                                  key={f}
                                  className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium"
                                >
                                  <FileText size={14} /> {f}
                                </div>
                              ))}
                            </div>
                          )}
                          <div
                            className={
                              msg.role === "ai"
                                ? "whitespace-pre-wrap leading-relaxed markdown-body prose prose-slate dark:prose-invert max-w-none prose-sm"
                                : "whitespace-pre-wrap leading-relaxed font-medium"
                            }
                          >
                            {msg.role === "ai" ? (
                              <Markdown>{msg.content}</Markdown>
                            ) : (
                              msg.content
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex gap-4 max-w-4xl">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white flex items-center justify-center">
                        <RefreshCw size={20} className="animate-spin" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-200 shadow-sm animate-pulse">
                            {t.orchestratorCoordinating}
                          </span>
                        </div>
                        <div className="p-5 rounded-lg bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm min-w-[300px]">
                          <div className="space-y-4">
                            {processingSteps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 text-sm"
                              >
                                {idx === processingSteps.length - 1 ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0 mt-0.5"></div>
                                ) : (
                                  <CheckCircle2
                                    size={20}
                                    className="text-emerald-500 shrink-0"
                                  />
                                )}
                                <span
                                  className={
                                    idx === processingSteps.length - 1
                                      ? "text-slate-800 font-semibold"
                                      : "text-slate-500"
                                  }
                                >
                                  {step}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="max-w-4xl mx-auto">
                    
                    {/* Visual search grounding toggle and actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100">
                      <div className="flex gap-2 overflow-x-auto scrollbar-none custom-scrollbar touch-pan-x">
                        <button
                          onClick={() => setCompareMode("upload")}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 whitespace-nowrap"
                        >
                          🔍 {language === "vi" ? "Kiểm tra đối chiếu tài liệu" : "Compare Documents"}
                        </button>
                        <button
                          onClick={() =>
                            setChatInput(
                              language === "vi"
                                ? "Tóm tắt nội dung tài liệu này giúp tôi."
                                : "Please summarize this document for me.",
                            )
                          }
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 whitespace-nowrap"
                        >
                          📝 {language === "vi" ? "Tóm tắt tài liệu" : "Summarize document"}
                        </button>
                      </div>

                      {/* Google Search Toggle */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Globe size={13} className="text-indigo-500" />
                          {language === "vi" ? "Tổng hợp internet thời gian thực" : "Live Web Grounding"}
                        </label>
                        <button
                          onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
                          className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${enableSearchGrounding ? "bg-emerald-500" : "bg-slate-300"}`}
                        >
                          <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${enableSearchGrounding ? "translate-x-5" : "translate-x-0"}`}></span>
                        </button>
                      </div>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {uploadedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs border border-slate-200"
                          >
                            <FileText size={14} className="text-slate-500" />
                            <span className="text-slate-700 truncate max-w-[200px] font-medium">
                              {file.name}
                            </span>
                            <button
                              onClick={() =>
                                setUploadedFiles((files) =>
                                  files.filter((_, i) => i !== idx),
                                )
                              }
                              className="text-slate-400 hover:text-red-500 transition-all active:scale-95"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="relative flex items-end gap-2">
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent transition-all flex items-end">
                        <label className="p-4 text-slate-400 hover:text-[var(--color-primary)] cursor-pointer transition-all active:scale-95 shrink-0">
                          <UploadCloud size={24} />
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                setUploadedFiles((prev) => [
                                  ...prev,
                                  ...Array.from(e.target.files!),
                                ]);
                              }
                            }}
                          />
                        </label>
                        <textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={t.inputPlaceholder}
                          className="w-full max-h-32 min-h-[56px] py-4 pr-4 bg-transparent outline-none resize-none text-sm font-medium"
                          rows={1}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={
                          (!chatInput.trim() && uploadedFiles.length === 0) ||
                          isProcessing
                        }
                        className="h-[56px] w-[56px] shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                      >
                        <MessageSquare size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
}
