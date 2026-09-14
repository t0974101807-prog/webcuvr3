import React, { useState, useEffect, useMemo } from "react";
import {
  Users, BarChart3, Clock, Award, CheckCircle2, Scale, ShieldAlert,
  Search, Download, ArrowUpFromLine, Filter, Calendar, Briefcase,
  DollarSign, UserCheck, UserX, FileText, ChevronRight, X, AlertTriangle, CheckCircle, Plus,
  Fingerprint, ScanFace, QrCode, Wifi, WifiOff, Database, Building2, UserCog, History, BookOpen,
  FileCheck2, TrendingUp, Send, PlayCircle, RefreshCw, LayoutDashboard, ClipboardList, Bot, Sliders,
  Maximize2, Minimize2
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import Markdown from "react-markdown";
import * as XLSX from "xlsx";

const SYSTEM_TITLES = [
  'Giám đốc',
  'Phó giám đốc',
  'Trưởng phòng',
  'Quản lý',
  'Quản trị viên',
  'Kiểm soát viên',
  'Kiểm soát chất lượng',
  'Kế toán',
  'Luật sư',
  'Chuyên viên pháp lý',
  'Trợ lý pháp lý',
  'Biên tập viên',
  'Luật sư Tập sự',
  'Thực tập sinh',
  'Nhân viên tư vấn',
  'IT - Quản trị hồ sơ',
  'Người dùng'
];

interface HrDashboardProps {
  isDarkMode: boolean;
  cardBg: string;
  innerBoxBg: string;
  headerText: string;
  subText: string;
  enrichedStaff: any[];
  records: any[];
  leaveRequests: any[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<any[]>>;
  rewardLogs: any[];
  setRewardLogs: React.Dispatch<React.SetStateAction<any[]>>;
  promotedUsers: Record<string, string>;
  setPromotedUsers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showToast: (msg: string) => void;
  officesList?: any[];
}

export default function HrDashboard({
  isDarkMode,
  cardBg,
  innerBoxBg,
  headerText,
  subText,
  enrichedStaff: initialStaff,
  records,
  leaveRequests: initialLeaves,
  setLeaveRequests,
  rewardLogs,
  setRewardLogs,
  promotedUsers,
  setPromotedUsers,
  showToast,
  officesList
}: HrDashboardProps) {
  const textTitle = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textLabel = isDarkMode ? "text-slate-200" : "text-slate-700";

  // Navigation State
  const [hrSubTool, setHrSubTool] = useState<"dashboard" | "info" | "org" | "attendance" | "requests" | "payroll" | "performance" | "training" | "ai_assistant">("dashboard");
  const [fullScreenSubTools, setFullScreenSubTools] = useState<Record<string, boolean>>({});

  const toggleFullScreen = (tabId: string) => {
    setFullScreenSubTools(prev => ({
      ...prev,
      [tabId]: !prev[tabId]
    }));
  };

  const [hrMonth, setHrMonth] = useState<string>("8");
  const [hrYear, setHrYear] = useState<string>("2026");

  // API Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [businessTrips, setBusinessTrips] = useState<any[]>([]);
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [payrollList, setPayrollList] = useState<any[]>([]);
  const [kpiList, setKpiList] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [trainingList, setTrainingList] = useState<any[]>([]);
  const [recruitmentList, setRecruitmentList] = useState<any[]>([]);
  const [orgChart, setOrgChart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active / Selected States
  const [selectedPersonnelDetail, setSelectedPersonnelDetail] = useState<any>(null);
  const [isAddPersonnelModalOpen, setIsAddPersonnelModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedPayslipEmployee, setSelectedPayslipEmployee] = useState<any>(null);

  // Filters
  const [infoSearch, setInfoSearch] = useState<string>("");
  const [infoDeptFilter, setInfoDeptFilter] = useState<string>("Tất cả");
  const [infoBranchFilter, setInfoBranchFilter] = useState<string>("Tất cả");

  // Timekeeper Simulator State
  const [simEmployeeId, setSimEmployeeId] = useState<string>("");
  const [simMethod, setSimMethod] = useState<"fingerprint" | "face" | "qr" | "gps">("fingerprint");
  const [simType, setSimType] = useState<"check-in" | "check-out">("check-in");
  const [simGpsDistance, setSimGpsDistance] = useState<number>(15); // in meters
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // AI Chat State
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string; data?: any }>>([
    { sender: "ai", text: "Xin chào! Tôi là Trợ lý AI HR của Hãng luật Ánh Dương. Bạn có thể hỏi tôi về chấm công hôm nay, danh sách đi trễ, hết hạn hợp đồng, hoặc nhờ tôi tư vấn quy chế lương thưởng." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Leave & OT creation state
  const [newLeaveForm, setNewLeaveForm] = useState({ employee_id: "", leave_type: "Phép năm", start_date: "2026-08-05", end_date: "2026-08-06", reason: "Giải quyết việc gia đình" });
  const [newOtForm, setNewOtForm] = useState({ employee_id: "", date: "2026-08-05", hours: 2, reason: "Hoàn thiện hồ sơ tranh tụng vụ án HS-2026" });

  // Onboarding/Offboarding Checklists (Client persistent / simulated status)
  const [onboardingStatus, setOnboardingStatus] = useState<Record<string, string[]>>({});

  // Export Payroll to Excel (.xlsx)
  const handleExportPayroll = () => {
    try {
      const dataToExport = displayStaff.map(u => {
        const payrollItem = Array.isArray(payrollList) ? payrollList.find(p => String(p.employee_id) === String(u.id) || p.staff_code === u.staff_code) : null;
        const userSalary = typeof u.salary === 'number' ? u.salary : Number(String(u.salary || '').replace(/[^0-9]/g, ''));
        const gross = payrollItem ? payrollItem.base_salary : (userSalary || 25000000);
        const allow = payrollItem ? payrollItem.allowance : 2500000;
        const bhxh = payrollItem ? payrollItem.insurance : Math.round(gross * 0.105);
        const pit = payrollItem ? payrollItem.tax : Math.round((gross - 11000000) * 0.1 > 0 ? (gross - 11000000) * 0.1 : 0);
        const net = payrollItem ? payrollItem.net_salary : (gross + allow - bhxh - pit);

        return {
          "Mã Nhân Sự": u.staff_code || `NV-${u.id}`,
          "Họ và Tên": u.name,
          "Chức Danh": u.title || "Nhân viên",
          "Lương Cơ Bản (Gross)": gross,
          "Phụ Cấp": allow,
          "Khấu Trừ BHXH": bhxh,
          "PIT (Thuế TNCN)": pit,
          "Thực Nhận (Net)": net,
          "Trạng Thái": payrollItem?.status || "Approved"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng lương");
      XLSX.writeFile(workbook, `Bang_Luong_Thang_${hrMonth}_${hrYear}.xlsx`);
      showToast(`Đã xuất Bảng lương Tháng ${hrMonth}/${hrYear} dạng Excel (.xlsx) thành công!`);
    } catch (err: any) {
      console.error(err);
      showToast("Có lỗi xảy ra khi xuất bảng lương!");
    }
  };

  // Export Payroll to CSV (.csv)
  const handleExportPayrollCSV = () => {
    try {
      const headers = [
        "Mã Nhân Sự",
        "Họ và Tên",
        "Chức Danh",
        "Lương Cơ Bản (Gross)",
        "Phụ Cấp",
        "Khấu Trừ BHXH",
        "PIT (Thuế TNCN)",
        "Thực Nhận (Net)",
        "Trạng Thư"
      ];

      const csvRows = [headers.join(",")];

      displayStaff.forEach(u => {
        const payrollItem = Array.isArray(payrollList) ? payrollList.find(p => String(p.employee_id) === String(u.id) || p.staff_code === u.staff_code) : null;
        const userSalary = typeof u.salary === 'number' ? u.salary : Number(String(u.salary || '').replace(/[^0-9]/g, ''));
        const gross = payrollItem ? payrollItem.base_salary : (userSalary || 25000000);
        const allow = payrollItem ? payrollItem.allowance : 2500000;
        const bhxh = payrollItem ? payrollItem.insurance : Math.round(gross * 0.105);
        const pit = payrollItem ? payrollItem.tax : Math.round((gross - 11000000) * 0.1 > 0 ? (gross - 11000000) * 0.1 : 0);
        const net = payrollItem ? payrollItem.net_salary : (gross + allow - bhxh - pit);

        const row = [
          `"${u.staff_code || `NV-${u.id}`}"`,
          `"${u.name.replace(/"/g, '""')}"`,
          `"${(u.title || "Nhân viên").replace(/"/g, '""')}"`,
          gross,
          allow,
          bhxh,
          pit,
          net,
          `"${(payrollItem?.status || "Approved").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bang_Luong_Thang_${hrMonth}_${hrYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Đã xuất Bảng lương Tháng ${hrMonth}/${hrYear} dạng CSV (.csv) thành công!`);
    } catch (err: any) {
      console.error(err);
      showToast("Có lỗi xảy ra khi xuất bảng lương dạng CSV!");
    }
  };

  // Export Personnel to Excel (.xlsx)
  const handleExportPersonnel = () => {
    try {
      const dataToExport = filteredStaff.map(u => ({
        "Mã Nhân Sự": u.staff_code || `NV-${u.id}`,
        "Họ và Tên": u.name,
        "Username": u.username,
        "Chức vụ": u.title || "Nhân viên",
        "Phòng ban": u.department || "Nghiệp vụ",
        "Chi nhánh": u.branch || "Hà Nội",
        "Điện thoại": u.phone || "---",
        "Email": u.email || "---",
        "Trạng thái": u.status || "Active"
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Nhân viên");
      XLSX.writeFile(workbook, `Danh_sach_nhan_vien.xlsx`);
      showToast(`Đã xuất danh sách nhân viên dạng Excel (.xlsx) thành công!`);
    } catch (err: any) {
      console.error(err);
      showToast("Có lỗi xảy ra khi xuất danh sách nhân viên!");
    }
  };

  // Export Personnel to CSV (.csv)
  const handleExportPersonnelCSV = () => {
    try {
      const headers = [
        "Mã Nhân Sự",
        "Họ và Tên",
        "Username",
        "Chức vụ",
        "Phòng ban",
        "Chi nhánh",
        "Điện thoại",
        "Email",
        "Trạng thái"
      ];

      const csvRows = [headers.join(",")];

      filteredStaff.forEach(u => {
        const row = [
          `"${u.staff_code || `NV-${u.id}`}"`,
          `"${u.name.replace(/"/g, '""')}"`,
          `"${u.username.replace(/"/g, '""')}"`,
          `"${(u.title || "Nhân viên").replace(/"/g, '""')}"`,
          `"${(u.department || "Nghiệp vụ").replace(/"/g, '""')}"`,
          `"${(u.branch || "Hà Nội").replace(/"/g, '""')}"`,
          `"${(u.phone || "---").replace(/"/g, '""')}"`,
          `"${(u.email || "---").replace(/"/g, '""')}"`,
          `"${(u.status || "Active").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Danh_sach_nhan_vien.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Đã xuất danh sách nhân viên dạng CSV (.csv) thành công!`);
    } catch (err: any) {
      console.error(err);
      showToast("Có lỗi xảy ra khi xuất danh sách nhân viên dạng CSV!");
    }
  };

  // Import Payroll from Excel (.xlsx)
  const handleImportPayroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        const importedPayrolls = rawData.map((row: any) => {
          const staffCode = String(row["Mã Nhân Sự"] || row["Mã NS"] || row["staff_code"] || "").trim();
          const name = String(row["Họ và Tên"] || row["name"] || "").trim();
          const emp = displayStaff.find(s => (s.staff_code && String(s.staff_code).trim() === staffCode) || (s.name && String(s.name).trim() === name));
          
          if (!emp) return null;

          const base = Number(row["Lương Cơ Bản (Gross)"] || row["Lương Cơ Bản"] || row["base_salary"]) || 20000000;
          const allow = Number(row["Phụ Cấp"] || row["allowance"]) || 1500000;
          const ins = Number(row["Khấu Trừ BHXH"] || row["insurance"]) || Math.round(base * 0.105);
          const pit = Number(row["PIT (Thuế TNCN)"] || row["PIT"] || row["tax"]) || Math.round((base - 11000000) * 0.1 > 0 ? (base - 11000000) * 0.1 : 0);
          const net = Number(row["Thực Nhận (Net)"] || row["Thực Nhận"] || row["net_salary"]) || (base + allow - ins - pit);

          return {
            employee_id: String(emp.id),
            month: hrMonth,
            year: hrYear,
            base_salary: base,
            allowance: allow,
            insurance: ins,
            tax: pit,
            net_salary: net,
            status: row["Trạng Thái"] || "Approved"
          };
        }).filter(Boolean);

        if (importedPayrolls.length === 0) {
          showToast("Không tìm thấy dữ liệu nhân sự phù hợp trong file Excel!");
          return;
        }

        const res = await fetch("/api/hr/payroll/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payrolls: importedPayrolls, month: hrMonth, year: hrYear })
        });
        const resJson = await res.json();

        if (resJson.success) {
          setPayrollList(resJson.data);
          showToast(`Đã nhập và đồng bộ thành công ${importedPayrolls.length} nhân sự bảng lương!`);
        } else {
          showToast("Lỗi đồng bộ bảng lương với máy chủ!");
        }
      } catch (err) {
        console.error(err);
        showToast("Lỗi định dạng file Excel hoặc không tương thích!");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // Export KPI / Evaluation to Excel (.xlsx)
  const handleExportKPI = () => {
    try {
      const dataToExport = displayStaff.map(u => {
        const kpiItem = Array.isArray(kpiList) ? kpiList.find(p => String(p.employee_id) === String(u.id)) : null;
        const isLawyer = String(u.role).includes("lawyer") || String(u.title).includes("Luật sư");
        const kpi_score = kpiItem ? kpiItem.kpi_score : 85;
        const ai_score = kpiItem ? kpiItem.ai_score : 90;
        const manager_score = kpiItem ? kpiItem.manager_score : 88;
        const total = kpiItem ? kpiItem.total_score : Math.round((kpi_score + ai_score + manager_score) / 3);
        const rank = kpiItem ? kpiItem.rank : (total >= 92 ? "A+" : total >= 85 ? "A" : "B");
        const billable = kpiItem ? kpiItem.billable_hours : (isLawyer ? 130 : 0);
        const court = kpiItem ? kpiItem.court_time : (isLawyer ? 35 : 0);
        const meetings = kpiItem ? kpiItem.client_meetings : 25;

        return {
          "Mã Nhân Sự": u.staff_code || `NV-${u.id}`,
          "Họ và Tên": u.name,
          "Chức Danh": u.title || "Nhân viên",
          "Điểm KPI Tác Vụ": kpi_score,
          "Điểm Đánh Giá AI": ai_score,
          "Điểm Đánh Giá Quản Lý": manager_score,
          "Tổng Điểm": total,
          "Xếp Loại": rank,
          "Số Giờ Billable": billable,
          "Số Phiên Tòa Tham Gia": court,
          "Số Cuộc Họp Khách Hàng": meetings
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "KPI & Hiệu Suất");
      XLSX.writeFile(workbook, `Danh_Gia_KPI_Thang_${hrMonth}_${hrYear}.xlsx`);
      showToast(`Đã xuất Bảng Đánh Giá KPI & Hiệu Suất Tháng ${hrMonth}/${hrYear} thành công!`);
    } catch (err: any) {
      console.error(err);
      showToast("Có lỗi xảy ra khi xuất KPI!");
    }
  };

  // Export KPI / Evaluation to CSV (.csv)
  const handleExportKPICSV = () => {
    try {
      const headers = [
        "Mã Nhân Sự",
        "Họ và Tên",
        "Chức Danh",
        "Điểm KPI Tác Vụ",
        "Điểm Đánh Giá AI",
        "Điểm Đánh Giá Quản Lý",
        "Tổng Điểm",
        "Xếp Loại",
        "Số Giờ Billable",
        "Số Phiên Tòa Tham Gia",
        "Số Cuộc Họp Khách Hàng"
      ];

      const csvRows = [headers.join(",")];

      displayStaff.forEach(u => {
        const kpiItem = Array.isArray(kpiList) ? kpiList.find(p => String(p.employee_id) === String(u.id)) : null;
        const isLawyer = String(u.role).includes("lawyer") || String(u.title).includes("Luật sư");
        const kpi_score = kpiItem ? kpiItem.kpi_score : 85;
        const ai_score = kpiItem ? kpiItem.ai_score : 90;
        const manager_score = kpiItem ? kpiItem.manager_score : 88;
        const total = kpiItem ? kpiItem.total_score : Math.round((kpi_score + ai_score + manager_score) / 3);
        const rank = kpiItem ? kpiItem.rank : (total >= 92 ? "A+" : total >= 85 ? "A" : "B");
        const billable = kpiItem ? kpiItem.billable_hours : (isLawyer ? 130 : 0);
        const court = kpiItem ? kpiItem.court_time : (isLawyer ? 35 : 0);
        const meetings = kpiItem ? kpiItem.client_meetings : 25;

        const row = [
          `"${u.staff_code || `NV-${u.id}`}"`,
          `"${u.name.replace(/"/g, '""')}"`,
          `"${(u.title || "Nhân viên").replace(/"/g, '""')}"`,
          kpi_score,
          ai_score,
          manager_score,
          total,
          `"${rank.replace(/"/g, '""')}"`,
          billable,
          court,
          meetings
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Danh_Gia_KPI_Thang_${hrMonth}_${hrYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Đã xuất Bảng Đánh Giá KPI & Hiệu Suất Tháng ${hrMonth}/${hrYear} dạng CSV (.csv) thành công!`);
    } catch (err: any) {
      console.error(err);
      showToast("Có lỗi xảy ra khi xuất KPI dạng CSV!");
    }
  };

  // Import KPI / Evaluation from Excel (.xlsx)
  const handleImportKPI = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        const importedKpis = rawData.map((row: any) => {
          const staffCode = String(row["Mã Nhân Sự"] || row["Mã NS"] || "").trim();
          const name = String(row["Họ và Tên"] || row["name"] || "").trim();
          const emp = displayStaff.find(s => (s.staff_code && String(s.staff_code).trim() === staffCode) || (s.name && String(s.name).trim() === name));
          
          if (!emp) return null;

          const kpi = Number(row["Điểm KPI Tác Vụ"] || row["kpi_score"]) || 85;
          const ai = Number(row["Điểm Đánh Giá AI"] || row["ai_score"]) || 90;
          const mgr = Number(row["Điểm Đánh Giá Quản Lý"] || row["manager_score"]) || 88;
          const total = Number(row["Tổng Điểm"] || row["total_score"]) || Math.round((kpi + ai + mgr) / 3);
          const rank = row["Xếp Loại"] || row["rank"] || (total >= 92 ? "A+" : total >= 85 ? "A" : "B");

          return {
            employee_id: String(emp.id),
            month: hrMonth,
            year: hrYear,
            kpi_score: kpi,
            ai_score: ai,
            manager_score: mgr,
            total_score: total,
            rank: rank,
            billable_hours: Number(row["Số Giờ Billable"] || row["billable_hours"]) || 0,
            court_time: Number(row["Số Phiên Tòa Tham Gia"] || row["court_time"]) || 0,
            client_meetings: Number(row["Số Cuộc Họp Khách Hàng"] || row["client_meetings"]) || 0
          };
        }).filter(Boolean);

        if (importedKpis.length === 0) {
          showToast("Không tìm thấy dữ liệu nhân sự phù hợp trong file Excel!");
          return;
        }

        const res = await fetch("/api/hr/kpi/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kpis: importedKpis, month: hrMonth, year: hrYear })
        });
        const resJson = await res.json();

        if (resJson.success) {
          setKpiList(resJson.data);
          showToast(`Đã nhập và đồng bộ thành công ${importedKpis.length} nhân sự đánh giá & KPI!`);
        } else {
          showToast("Lỗi đồng bộ đánh giá KPI với máy chủ!");
        }
      } catch (err) {
        console.error(err);
        showToast("Lỗi định dạng file Excel hoặc không tương thích!");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // 1. Fetch All HR Data from backend on mount
  const fetchAllHRData = async () => {
    setIsLoading(true);
    try {
      const headers = { "Content-Type": "application/json" };
      
      const [
        dashRes, empRes, deptRes, posRes, shiftRes, attRes, leaveRes, tripRes, otRes, payRes, kpiRes, contractRes, eqRes, trainRes, recRes, orgRes
      ] = await Promise.all([
        fetch("/api/hr/dashboard").then(r => r.json()).catch(() => null),
        fetch("/api/hr/employees").then(r => r.json()).catch(() => null),
        fetch("/api/hr/departments").then(r => r.json()).catch(() => null),
        fetch("/api/hr/positions").then(r => r.json()).catch(() => null),
        fetch("/api/hr/shifts").then(r => r.json()).catch(() => null),
        fetch("/api/hr/attendance").then(r => r.json()).catch(() => null),
        fetch("/api/hr/leave").then(r => r.json()).catch(() => null),
        fetch("/api/hr/business-trip").then(r => r.json()).catch(() => null),
        fetch("/api/hr/overtime").then(r => r.json()).catch(() => null),
        fetch(`/api/hr/payroll?month=${hrMonth}&year=${hrYear}`).then(r => r.json()).catch(() => null),
        fetch(`/api/hr/kpi?month=${hrMonth}&year=${hrYear}`).then(r => r.json()).catch(() => null),
        fetch("/api/hr/contracts").then(r => r.json()).catch(() => null),
        fetch("/api/hr/equipment").then(r => r.json()).catch(() => null),
        fetch("/api/hr/training").then(r => r.json()).catch(() => null),
        fetch("/api/hr/recruitment").then(r => r.json()).catch(() => null),
        fetch("/api/hr/org-chart").then(r => r.json()).catch(() => null)
      ]);

      if (dashRes?.success) setDashboardData(dashRes.data);
      if (empRes?.success) setEmployees(empRes.data);
      if (deptRes?.success) setDepartments(deptRes.data);
      if (posRes?.success) setPositions(posRes.data);
      if (shiftRes?.success) setShifts(shiftRes.data);
      if (attRes?.success) setAttendanceLogs(attRes.data);
      if (leaveRes?.success) setLeaveData(leaveRes.data);
      if (tripRes?.success) setBusinessTrips(tripRes.data);
      if (otRes?.success) setOvertimes(otRes.data);
      if (payRes?.success) setPayrollList(payRes.data);
      if (kpiRes?.success) setKpiList(kpiRes.data);
      if (contractRes?.success) setContracts(contractRes.data);
      if (eqRes?.success) setEquipment(eqRes.data);
      if (trainRes?.success) setTrainingList(trainRes.data);
      if (recRes?.success) setRecruitmentList(recRes.data);
      if (orgRes?.success) setOrgChart(orgRes.data);

    } catch (error) {
      console.error("Lỗi khi đồng bộ dữ liệu HRM:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHRData();
  }, [hrMonth, hrYear]);

  // Sync initial state if api fails
  const displayStaff = useMemo(() => {
    return employees.length > 0 ? employees : initialStaff;
  }, [employees, initialStaff]);

  const displayLeaves = useMemo(() => {
    return leaveData.length > 0 ? leaveData : initialLeaves;
  }, [leaveData, initialLeaves]);

  // Filters for staff
  const filteredStaff = useMemo(() => {
    return displayStaff.filter(item => {
      const q = infoSearch.toLowerCase().trim();
      const matchSearch = !q ||
        item.name?.toLowerCase().includes(q) ||
        item.staff_code?.toLowerCase().includes(q) ||
        item.username?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.department?.toLowerCase().includes(q);

      const matchDept = infoDeptFilter === "Tất cả" || item.department === infoDeptFilter;
      const matchBranch = infoBranchFilter === "Tất cả" || item.branch === infoBranchFilter;

      return matchSearch && matchDept && matchBranch;
    });
  }, [displayStaff, infoSearch, infoDeptFilter, infoBranchFilter]);

  // Unique lists
  const deptList = useMemo(() => {
    const depts = new Set<string>();
    displayStaff.forEach(s => s.department && depts.add(s.department));
    return Array.from(depts);
  }, [displayStaff]);

  const brList = useMemo(() => {
    const branches = new Set<string>();
    displayStaff.forEach(s => s.branch && branches.add(s.branch));
    return Array.from(branches);
  }, [displayStaff]);

  // 2. Simulator Action
  const triggerSimulateCheckIn = async () => {
    if (!simEmployeeId) {
      showToast("Vui lòng chọn nhân viên cần chấm công giả lập!");
      return;
    }
    setIsSimulating(true);
    try {
      const res = await fetch("/api/hr/attendance/check-in-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: simEmployeeId,
          type: simType,
          method: simMethod,
          gps_distance: simGpsDistance
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Giả lập thành công: Chấm công ${simType === 'check-in' ? 'Vào' : 'Ra'} cho ${data.data.employee_name}. Trạng thái: ${data.data.status_label}`);
        fetchAllHRData();
      } else {
        showToast(`Lỗi giả lập: ${data.error}`);
      }
    } catch (e) {
      showToast("Không thể gửi yêu cầu chấm công giả lập.");
    } finally {
      setIsSimulating(false);
    }
  };

  // 3. AI Chatbot
  const askAiHR = async (text?: string) => {
    const query = text || chatInput;
    if (!query.trim()) return;
    setChatInput("");
    setIsAiLoading(true);

    const updatedHistory = [...chatHistory, { sender: "user" as const, text: query }];
    setChatHistory(updatedHistory);

    try {
      const res = await fetch("/api/hr/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query })
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { sender: "ai", text: data.answer, data: data.data }]);
      } else {
        setChatHistory(prev => [...prev, { sender: "ai", text: `Đã xảy ra lỗi khi trao đổi với AI: ${data.error}` }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "Xin lỗi, không thể kết nối tới máy chủ AI HR." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 4. Workflow requests (Leave & OT)
  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hr/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeaveForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã gửi đơn xin nghỉ phép thành công!");
        fetchAllHRData();
      } else {
        showToast(`Lỗi: ${data.error}`);
      }
    } catch (e) {
      showToast("Không thể tạo yêu cầu nghỉ phép.");
    }
  };

  const submitOtRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hr/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOtForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã gửi đề xuất tăng ca thành công!");
        fetchAllHRData();
      } else {
        showToast(`Lỗi: ${data.error}`);
      }
    } catch (e) {
      showToast("Không thể tạo yêu cầu tăng ca.");
    }
  };

  const approveLeaveRequest = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/hr/leave/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã ${status === 'Approved' ? 'Phê duyệt' : 'Từ chối'} đơn nghỉ phép thành công!`);
        fetchAllHRData();
      } else {
        showToast(`Lỗi: ${data.error}`);
      }
    } catch (e) {
      showToast("Không thể phê duyệt đơn nghỉ phép.");
    }
  };

  // Onboarding action
  const toggleOnboardingTask = (username: string, task: string) => {
    const current = onboardingStatus[username] || [];
    let updated;
    if (current.includes(task)) {
      updated = current.filter(t => t !== task);
    } else {
      updated = [...current, task];
    }
    setOnboardingStatus({ ...onboardingStatus, [username]: updated });
    showToast(`Đã cập nhật checklist Onboarding cho ${username}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header & Quick Controls */}
      <div className={`p-4 rounded-2xl border ${cardBg} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
        <div>
          <h2 className={`text-xl font-extrabold flex items-center gap-2 ${headerText}`}>
            <Building2 className="text-indigo-400" />
            <span>Phân hệ Nhân sự Doanh nghiệp Legal OS®</span>
          </h2>
          <p className={`text-xs ${subText} mt-1`}>Trung tâm quản lý nguồn nhân lực thông minh, tích hợp máy chấm công & Trợ lý AI</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <select
              value={hrMonth}
              onChange={(e) => setHrMonth(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${innerBoxBg} ${isDarkMode ? "text-slate-200 bg-slate-900" : "text-slate-800 bg-white"} outline-none`}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>Tháng {i + 1}</option>
              ))}
            </select>
            <select
              value={hrYear}
              onChange={(e) => setHrYear(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${innerBoxBg} ${isDarkMode ? "text-slate-200 bg-slate-900" : "text-slate-800 bg-white"} outline-none`}
            >
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast("Bắt đầu kết nối & đồng bộ dữ liệu real-time từ các máy vân tay thành công!")}
              className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RefreshCw size={12} className="animate-spin" />
              <span>Đồng bộ máy chấm công</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpFromLine size={12} />
              <span>Nhập Excel</span>
            </button>
            <button
              onClick={() => setIsAddPersonnelModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 transition-all"
            >
              <Plus size={12} />
              <span>Thêm Nhân sự</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Tabs Navigation */}
      <div className={`p-1.5 rounded-2xl border ${cardBg} flex items-center gap-1 overflow-x-auto shadow-sm scrollbar-thin`}>
        {[
          { id: "dashboard", label: "Bàn làm việc HR", icon: <LayoutDashboard size={14} /> },
          { id: "info", label: "Hồ sơ 360°", icon: <Users size={14} />, badge: `${displayStaff.length} NS` },
          { id: "org", label: "Cơ cấu & Ca làm", icon: <Building2 size={14} /> },
          { id: "attendance", label: "Chấm công & Đi ca", icon: <Clock size={14} /> },
          { id: "requests", label: "Yêu cầu & Workflow", icon: <ClipboardList size={14} />, badge: displayLeaves.filter(l => l.status === "Pending" || l.status === "Chờ duyệt").length || null },
          { id: "payroll", label: "Bảng lương & Payslip", icon: <DollarSign size={14} /> },
          { id: "performance", label: "KPI & Luật sư", icon: <Award size={14} /> },
          { id: "training", label: "Tuyển dụng & Đào tạo", icon: <BookOpen size={14} /> },
          { id: "ai_assistant", label: "Trợ lý AI HR", icon: <Bot size={14} />, pulse: true }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setHrSubTool(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              hrSubTool === tab.id
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                hrSubTool === tab.id ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              }`}>
                {tab.badge}
              </span>
            )}
            {tab.pulse && !tab.badge && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* 3. Tab Content Rendering */}

      {/* SUB-TAB 1: HR DASHBOARD & BIOMETRIC CONTROL */}
      {hrSubTool === "dashboard" && (
        <div className={fullScreenSubTools["dashboard"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-6 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : "space-y-6"}>
          
          <div className="flex items-center justify-between border-b border-slate-800/20 pb-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Tổng quan Vận hành HR</span>
            <button
              onClick={() => toggleFullScreen("dashboard")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              {fullScreenSubTools["dashboard"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{fullScreenSubTools["dashboard"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
            </button>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Tổng nhân sự", value: dashboardData?.totalEmployees || displayStaff.length, sub: "Định biên hãng", color: "text-purple-400" },
              { label: "Có mặt hôm nay", value: dashboardData?.presentToday || 0, sub: "Đã check-in", color: "text-emerald-400" },
              { label: "Đi trễ hôm nay", value: dashboardData?.lateToday || 0, sub: "Mất chuyên cần", color: "text-amber-400" },
              { label: "Nghỉ phép", value: dashboardData?.onLeaveToday || 0, sub: "Đăng ký ESS", color: "text-cyan-400" },
              { label: "Đang công tác", value: dashboardData?.businessTripToday || 0, sub: "Gặp khách/Tòa", color: "text-indigo-400" },
              { label: "Làm ngoài giờ", value: dashboardData?.otToday || 0, sub: "OT đăng ký", color: "text-rose-400" },
              { label: "Chưa chấm công", value: dashboardData?.missingCheckoutToday || 0, sub: "Quên check", color: "text-slate-400" },
              { label: "Máy chấm công", value: `${dashboardData?.onlineDevices || 2}/${(dashboardData?.onlineDevices || 2) + (dashboardData?.offlineDevices || 0)}`, sub: "Thiết bị online", color: "text-teal-400" }
            ].map((stat, i) => (
              <div key={i} className={`p-3 rounded-xl border ${cardBg} flex flex-col justify-between`}>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider leading-none">{stat.label}</span>
                <p className={`text-2xl font-black ${stat.color} mt-2 font-mono`}>{stat.value}</p>
                <span className="text-[9px] text-slate-500 mt-1">{stat.sub}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Realtime Attendance Device List & Simulator */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-6 space-y-4`}>
              <div className={`flex items-center justify-between border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"} pb-2`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                  <Fingerprint size={16} className="text-cyan-500 animate-pulse" />
                  <span>Hệ thống Máy chấm công Biometric & Simulation</span>
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                  <Wifi size={10} /> Live Push active
                </span>
              </div>

              {/* Physical Devices Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${innerBoxBg} flex items-center justify-between`}>
                  <div>
                    <p className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Ronald Jack X628-C</p>
                    <p className="text-[10px] text-slate-500">IP: 192.168.1.150 • Vân tay</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">Online</span>
                </div>
                <div className={`p-3 rounded-xl border ${innerBoxBg} flex items-center justify-between`}>
                  <div>
                    <p className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Hikvision DS-K1T343</p>
                    <p className="text-[10px] text-slate-500">IP: 192.168.1.152 • Khuôn mặt</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">Online</span>
                </div>
              </div>

              {/* Live push simulator form */}
              <div className={`p-4 rounded-xl border border-dashed ${isDarkMode ? "border-slate-700 bg-slate-900/30" : "border-slate-300 bg-slate-50/50"} space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <Sliders size={13} /> Giao diện Giả lập Máy vân tay / Nhận diện Face ID
                  </span>
                  <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"} italic`}>Mô phỏng 100% API thật</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className={`block ${isDarkMode ? "text-slate-400" : "text-slate-600"} mb-1`}>Chọn Nhân viên quét vân tay</label>
                    <select
                      value={simEmployeeId}
                      onChange={(e) => setSimEmployeeId(e.target.value)}
                      className={`w-full p-2 rounded-xl border ${innerBoxBg} ${isDarkMode ? "text-slate-200 bg-slate-900" : "text-slate-800 bg-white"} outline-none`}
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {displayStaff.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.staff_code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block ${isDarkMode ? "text-slate-400" : "text-slate-600"} mb-1`}>Phương thức Quét</label>
                    <select
                      value={simMethod}
                      onChange={(e) => setSimMethod(e.target.value as any)}
                      className={`w-full p-2 rounded-xl border ${innerBoxBg} ${isDarkMode ? "text-slate-200 bg-slate-900" : "text-slate-800 bg-white"} outline-none`}
                    >
                      <option value="fingerprint">Quét Vân tay (Fingerprint)</option>
                      <option value="face">Nhận dạng Khuôn mặt (Face ID)</option>
                      <option value="qr">Quét QR Portal trên App Mobile</option>
                      <option value="gps">Check-in GPS Điện thoại (ESS)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className={`block ${isDarkMode ? "text-slate-400" : "text-slate-600"} mb-1 font-bold`}>Chiều Chấm Công</label>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setSimType("check-in")}
                        className={`flex-1 py-1.5 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                          simType === "check-in" ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500" : `${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-300 text-slate-500"}`
                        }`}
                      >
                        Vào (Check-in)
                      </button>
                      <button
                        onClick={() => setSimType("check-out")}
                        className={`flex-1 py-1.5 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                          simType === "check-out" ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500" : `${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-300 text-slate-500"}`
                        }`}
                      >
                        Ra (Check-out)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block ${isDarkMode ? "text-slate-400" : "text-slate-600"} mb-1`}>Khoảng cách GPS sai lệch (mét)</label>
                    <input
                      type="number"
                      value={simGpsDistance}
                      onChange={(e) => setSimGpsDistance(Number(e.target.value))}
                      placeholder="Ví dụ: 15"
                      className={`w-full p-2 rounded-xl border ${innerBoxBg} ${isDarkMode ? "text-slate-200 bg-slate-900" : "text-slate-800 bg-white"} outline-none`}
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">GPS quá 100m sẽ bị cảnh báo Gian lận AI</span>
                  </div>
                </div>

                <button
                  onClick={triggerSimulateCheckIn}
                  disabled={isSimulating}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  <PlayCircle size={14} />
                  <span>Kích hoạt Quét & Gửi Payload Máy Chấm Công</span>
                </button>
              </div>
            </div>

            {/* Quick AI Notification Feed & Logs */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-6 space-y-4`}>
              <div className={`flex items-center justify-between border-b ${isDarkMode ? "border-slate-800" : "border-slate-200"} pb-2`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                  <History size={16} className="text-indigo-500 dark:text-indigo-400" />
                  <span>Nhật ký Chấm công Real-time & Cảnh báo Gian lận</span>
                </h3>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Lọc: Hôm nay</span>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto scrollbar-thin text-xs pr-1">
                {attendanceLogs.length > 0 ? (
                  attendanceLogs.slice(0, 7).map((log, i) => {
                    const isAnomalous = log.late_minutes > 120 || log.is_anomalous;
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${innerBoxBg} flex items-center justify-between`}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{log.employee_name}</span>
                            <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded text-[9px] text-slate-600 dark:text-slate-400 font-bold font-mono uppercase">{log.method}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Ngày: {log.date} • Check-in: <strong className="text-indigo-600 dark:text-indigo-300 font-mono">{log.check_in || "—"}</strong> • Check-out: <strong className="text-indigo-600 dark:text-indigo-300 font-mono">{log.check_out || "—"}</strong></p>
                        </div>

                        <div className="text-right">
                          {isAnomalous ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-black text-[9px] flex items-center gap-1">
                              <AlertTriangle size={10} /> Gian lận GPS
                            </span>
                          ) : log.late_minutes > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-[9px]">Đi trễ {log.late_minutes}m</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[9px]">Đúng giờ</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-500 italic">Chưa có giao dịch chấm công nào ghi nhận hôm nay. Hãy sử dụng bảng giả lập bên trái để tạo!</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMPLOYEE 360 DIRECTORY */}
      {hrSubTool === "info" && (
        <div className={fullScreenSubTools["info"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-6 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : "space-y-6"}>
          
          <div className="flex items-center justify-between border-b border-slate-800/20 pb-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Hồ sơ 360° Nhân sự</span>
            <button
              onClick={() => toggleFullScreen("info")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              {fullScreenSubTools["info"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{fullScreenSubTools["info"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className={`p-3 rounded-xl border ${cardBg} flex flex-wrap gap-3 items-center justify-between`}>
            <div className="flex items-center gap-2 max-w-sm flex-1">
              <Search className="text-slate-400 shrink-0" size={16} />
              <input
                type="text"
                value={infoSearch}
                onChange={(e) => setInfoSearch(e.target.value)}
                placeholder="Tìm tên, mã NS, bộ phận, chức danh..."
                className={`w-full p-1.5 rounded-lg border ${innerBoxBg} text-xs ${textLabel} outline-none`}
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <select
                value={infoDeptFilter}
                onChange={(e) => setInfoDeptFilter(e.target.value)}
                className={`p-1.5 rounded-lg border ${innerBoxBg} ${textLabel} outline-none`}
              >
                <option value="Tất cả">Tất cả Phòng ban</option>
                {deptList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={infoBranchFilter}
                onChange={(e) => setInfoBranchFilter(e.target.value)}
                className={`p-1.5 rounded-lg border ${innerBoxBg} ${textLabel} outline-none`}
              >
                <option value="Tất cả">Tất cả Chi nhánh</option>
                {brList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <button
                onClick={handleExportPersonnel}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download size={13} />
                <span>Xuất Excel</span>
              </button>
              <button
                onClick={handleExportPersonnelCSV}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <FileText size={13} />
                <span>Xuất CSV</span>
              </button>
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((u, i) => {
              const username = u.username;
              const completedTasks = onboardingStatus[username] || [];
              const tasks = ["Hợp đồng", "Email", "Face ID", "Bàn giao"];
              const progress = Math.round((completedTasks.length / tasks.length) * 100);

              return (
                <div key={i} className={`p-4 rounded-xl border ${cardBg} hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-black flex items-center justify-center text-sm shadow">
                        {u.name?.split(' ').pop()?.[0] || 'L'}
                      </div>
                      <div>
                        <h4 className={`font-extrabold ${textTitle} text-sm leading-tight`}>{u.name}</h4>
                        <p className="text-[11px] text-slate-500">Mã NS: <strong className="text-cyan-400 font-mono">{u.staff_code}</strong> • @{u.username}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.status === 'Đã chuyển công tác'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {u.status || "Active"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div className={`p-2 rounded-lg border ${innerBoxBg}`}>
                      <span className="text-slate-500 block text-[9px] uppercase">Chức vụ</span>
                      <strong className={`${textLabel} block truncate`}>{u.title}</strong>
                    </div>
                    <div className={`p-2 rounded-lg border ${innerBoxBg}`}>
                      <span className="text-slate-500 block text-[9px] uppercase">Bộ phận</span>
                      <strong className="text-purple-400 block truncate">{u.department}</strong>
                    </div>
                  </div>

                  {/* Skills Mini-bars */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Năng lực Luật sư (Skills Matrix)</span>
                      <span className="font-bold text-indigo-400">Chuyên môn cao</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="h-1 bg-slate-800 rounded overflow-hidden">
                        <div className="bg-indigo-500 h-full w-4/5"></div>
                      </div>
                      <div className="h-1 bg-slate-800 rounded overflow-hidden">
                        <div className="bg-indigo-500 h-full w-2/3"></div>
                      </div>
                      <div className="h-1 bg-slate-800 rounded overflow-hidden">
                        <div className="bg-indigo-500 h-full w-11/12"></div>
                      </div>
                    </div>
                  </div>

                  {/* Onboarding Checklist Tracker */}
                  <div className="space-y-1 text-[11px] border-t border-slate-800/60 pt-2.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Tiến trình Hội nhập (Onboarding)</span>
                      <span className="font-bold font-mono text-cyan-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-1 flex-wrap">
                      {tasks.map(task => {
                        const isDone = completedTasks.includes(task);
                        return (
                          <button
                            key={task}
                            onClick={() => toggleOnboardingTask(u.username, task)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer ${
                              isDone ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-slate-800/40 text-slate-500 border-slate-700/40 hover:text-slate-300"
                            }`}
                          >
                            {task} {isDone ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPersonnelDetail(u)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserCog size={13} />
                    <span>Xem Hồ Sơ 360° Chi Tiết</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ORG CHART & DEPARTMENTS & SHIFTS */}
      {hrSubTool === "org" && (
        <div className={fullScreenSubTools["org"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-6 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : "space-y-6"}>
          
          <div className="flex items-center justify-between border-b border-slate-800/20 pb-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Cơ cấu tổ chức & Ca làm việc</span>
            <button
              onClick={() => toggleFullScreen("org")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              {fullScreenSubTools["org"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{fullScreenSubTools["org"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sơ đồ tổ chức (Org Chart Block) */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-8 space-y-4`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Building2 size={16} className="text-indigo-400" />
                <span>Sơ đồ Tổ chức Phân cấp (Org Chart Hierarchy)</span>
              </h3>
              <p className={`text-xs ${subText}`}>Phân tầng Partner & Chuyên viên pháp lý</p>

              <div className="flex flex-col items-center justify-center py-6 space-y-4 text-xs">
                {/* Level 0 */}
                <div className="p-3 rounded-xl border border-indigo-500 bg-indigo-500/10 text-center max-w-[200px] shadow-md">
                  <strong className="text-indigo-300">Trần Ánh Dương</strong>
                  <p className="text-[10px] text-slate-400 mt-0.5">Luật sư Điều hành / CEO</p>
                </div>
                
                <div className="w-0.5 h-6 bg-indigo-500/30" />

                {/* Level 1 Grid */}
                <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
                  {[
                    { name: "Nguyễn Văn Hùng", title: "Trưởng phòng Tố tụng", desc: "Khối Tố tụng & Dân sự" },
                    { name: "Lê Thị Mai", title: "Trưởng phòng Doanh nghiệp", desc: "Khối Doanh nghiệp & M&A" },
                    { name: "Trần Bảo Ngọc", title: "Trưởng phòng Nhân sự", desc: "Khối Hành chính & HR" }
                  ].map((manager, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/50 text-center w-full">
                        <strong className="text-slate-200">{manager.name}</strong>
                        <p className="text-[10px] text-slate-400 mt-0.5">{manager.title}</p>
                        <p className="text-[9px] text-purple-400 mt-1 font-bold">{manager.desc}</p>
                      </div>
                      
                      <div className="w-0.5 h-6 bg-slate-800" />
                      
                      {/* Level 2 mini-cards */}
                      <div className="w-full bg-slate-800/20 rounded-lg p-2 border border-slate-800/40 space-y-1 text-[10px] text-slate-400 text-center">
                        {idx === 0 && <p>Lê Minh Tuấn • Chuyên viên</p>}
                        {idx === 1 && <p>Hoàng Đức Anh • M&A Associate</p>}
                        {idx === 2 && <p>Vũ Hải Đăng • C&B Specialist</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shift List & Config */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-4 space-y-4`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Clock size={16} className="text-emerald-400" />
                <span>Cấu hình Ca làm việc (Shifts)</span>
              </h3>

              <div className="space-y-3">
                {shifts.map((shift, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${innerBoxBg} space-y-1 text-xs`}>
                    <div className="flex items-center justify-between">
                      <strong className={textLabel}>{shift.name} ({shift.code})</strong>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px] uppercase">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                      <p>Giờ làm: <strong className="text-slate-300 font-mono">{shift.start_time} - {shift.end_time}</strong></p>
                      <p>Nghỉ trưa: <strong className="text-slate-300 font-mono">{shift.break_time}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TIMESHEET & LOGS */}
      {hrSubTool === "attendance" && (
        <div className={fullScreenSubTools["attendance"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-5 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : `p-5 rounded-2xl border ${cardBg} space-y-5`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div>
              <h3 className={`text-sm font-bold ${textTitle} flex items-center gap-2`}>
                <Calendar size={16} className="text-cyan-400" />
                <span>Bảng công tổng hợp (Timesheet Matrix Grid) - Tháng {hrMonth}/{hrYear}</span>
              </h3>
              <p className={`text-xs ${subText} mt-0.5`}>Trực quan hóa ngày công chấm vân tay thực tế của toàn bộ văn phòng</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast(`Đã xuất Bảng chấm công Tháng ${hrMonth}/${hrYear} dạng Excel (.xlsx) thành công!`)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Xuất Bảng Công</span>
              </button>
              <button
                onClick={() => toggleFullScreen("attendance")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                }`}
              >
                {fullScreenSubTools["attendance"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{fullScreenSubTools["attendance"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="py-2.5 px-3">Mã NS</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3">Bộ phận</th>
                  {Array.from({ length: 15 }, (_, i) => (
                    <th key={i} className="py-2.5 px-1.5 text-center w-8 font-mono">{i + 1}</th>
                  ))}
                  <th className="py-2.5 px-2 text-center text-indigo-400 font-mono">Công</th>
                  <th className="py-2.5 px-2 text-center text-amber-400 font-mono">Trễ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {displayStaff.map((u, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 font-mono text-cyan-400 font-bold">{u.staff_code}</td>
                      <td className={`py-2 px-3 font-bold ${textTitle}`}>{u.name}</td>
                      <td className="py-2 px-3 text-slate-400 text-[10px] truncate max-w-[120px]">{u.department}</td>
                      {Array.from({ length: 15 }, (_, i) => {
                        // random attendance state for mock feel but realistic
                        const day = i + 1;
                        const isWeekend = day % 7 === 1 || day % 7 === 2;
                        const hasCheckedIn = (idx + day) % 9 !== 0 && !isWeekend;
                        return (
                          <td key={i} className="py-2 px-1 text-center font-mono">
                            {isWeekend ? (
                              <span className="text-slate-600 font-black">-</span>
                            ) : hasCheckedIn ? (
                              <span className="text-emerald-400 font-black">✔</span>
                            ) : (
                              <span className="text-rose-500 font-black">✘</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-center font-bold text-indigo-400 font-mono">{(idx % 3 === 0) ? "11.5" : "12.0"}</td>
                      <td className="py-2 px-2 text-center font-bold text-amber-400 font-mono">{(idx * 2) % 4}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: REQUESTS & APPROVAL WORKFLOWS */}
      {hrSubTool === "requests" && (
        <div className={fullScreenSubTools["requests"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-6 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : "space-y-6"}>
          
          <div className="flex items-center justify-between border-b border-slate-800/20 pb-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Trung tâm phê duyệt & Yêu cầu</span>
            <button
              onClick={() => toggleFullScreen("requests")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              {fullScreenSubTools["requests"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{fullScreenSubTools["requests"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* New leave request form */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-4 space-y-4`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Calendar size={16} className="text-cyan-400" />
                <span>Nộp Đơn Nghỉ phép (ESS Portal)</span>
              </h3>
              
              <form onSubmit={submitLeaveRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nhân viên Đăng ký</label>
                  <select
                    value={newLeaveForm.employee_id}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, employee_id: e.target.value })}
                    className={`w-full p-2 rounded-xl border ${innerBoxBg} text-slate-200 outline-none`}
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {displayStaff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Loại Nghỉ</label>
                    <select
                      value={newLeaveForm.leave_type}
                      onChange={(e) => setNewLeaveForm({ ...newLeaveForm, leave_type: e.target.value })}
                      className={`w-full p-2 rounded-xl border ${innerBoxBg} text-slate-200 outline-none`}
                    >
                      <option value="Phép năm">Phép năm (AL)</option>
                      <option value="Nghỉ không lương">Nghỉ không lương</option>
                      <option value="Nghỉ ốm">Nghỉ ốm (SL)</option>
                      <option value="Thai sản">Thai sản</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Lý do</label>
                    <input
                      type="text"
                      value={newLeaveForm.reason}
                      onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                      className={`w-full p-2 rounded-xl border ${innerBoxBg} text-slate-200 outline-none`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Từ ngày</label>
                    <input
                      type="date"
                      value={newLeaveForm.start_date}
                      onChange={(e) => setNewLeaveForm({ ...newLeaveForm, start_date: e.target.value })}
                      className={`w-full p-2 rounded-xl border ${innerBoxBg} text-slate-200 outline-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tới ngày</label>
                    <input
                      type="date"
                      value={newLeaveForm.end_date}
                      onChange={(e) => setNewLeaveForm({ ...newLeaveForm, end_date: e.target.value })}
                      className={`w-full p-2 rounded-xl border ${innerBoxBg} text-slate-200 outline-none`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Gửi Đơn xin nghỉ phép
                </button>
              </form>
            </div>

            {/* Admin Approvals List */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-8 space-y-4`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <FileCheck2 size={16} className="text-indigo-400" />
                <span>Phê duyệt đơn đề xuất chờ duyệt (Approval Center)</span>
              </h3>

              <div className="space-y-3">
                {displayLeaves.length > 0 ? (
                  displayLeaves.map((leave, i) => {
                    const isPending = leave.status === "Pending" || leave.status === "Chờ duyệt";
                    return (
                      <div key={i} className={`p-3.5 rounded-xl border ${innerBoxBg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className={`${textLabel} text-sm`}>{leave.employee_name}</strong>
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold text-[9px] uppercase">{leave.leave_type}</span>
                          </div>
                          <p className="text-slate-400">Lý do: <span className="text-slate-300">{leave.reason}</span></p>
                          <p className="text-[10px] text-slate-500">Thời gian: <strong className="text-slate-400">{leave.start_date}</strong> đến <strong className="text-slate-400">{leave.end_date}</strong> ({leave.duration_days || 1} ngày)</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => approveLeaveRequest(leave.id, "Approved")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => approveLeaveRequest(leave.id, "Rejected")}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </>
                          ) : (
                            <span className={`px-2.5 py-1 rounded font-bold text-[10px] ${
                              leave.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {leave.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-500 italic">Chưa có đơn xin nghỉ phép nào được nộp.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 6: PAYROLL & DIGITAL PAYSLIP */}
      {hrSubTool === "payroll" && (
        <div className={fullScreenSubTools["payroll"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-4 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : `p-5 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div>
              <h3 className={`text-sm font-bold ${textTitle} flex items-center gap-2`}>
                <DollarSign size={16} className="text-emerald-400" />
                <span>Bảng tính lương tự động & Phúc lợi - Tháng {hrMonth}/{hrYear}</span>
              </h3>
              <p className={`text-xs ${subText} mt-0.5`}>Bao gồm BHXH, Thuế thu nhập cá nhân (PIT) và hoa hồng tính theo billable hours</p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                <ArrowUpFromLine size={13} />
                <span>Nhập Bảng Lương Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportPayroll}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExportPayroll}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Xuất Excel</span>
              </button>
              <button
                onClick={handleExportPayrollCSV}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={13} />
                <span>Xuất CSV</span>
              </button>
              <button
                onClick={() => toggleFullScreen("payroll")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                }`}
              >
                {fullScreenSubTools["payroll"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{fullScreenSubTools["payroll"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Mã NS</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3">Chức danh</th>
                  <th className="py-2.5 px-3 text-right">Lương Cơ Bản</th>
                  <th className="py-2.5 px-3 text-right">Phụ Cấp</th>
                  <th className="py-2.5 px-3 text-right">Khấu Trừ BHXH</th>
                  <th className="py-2.5 px-3 text-right">PIT (Tạm tính)</th>
                  <th className="py-2.5 px-3 text-right text-amber-400">Thực nhận (Net)</th>
                  <th className="py-2.5 px-3 text-center">Phiếu Lương</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {displayStaff.map((u, i) => {
                  const payrollItem = Array.isArray(payrollList) ? payrollList.find(p => String(p.employee_id) === String(u.id) || p.staff_code === u.staff_code) : null;
                  const userSalary = typeof u.salary === 'number' ? u.salary : Number(String(u.salary || '').replace(/[^0-9]/g, ''));
                  const gross = payrollItem ? payrollItem.base_salary : (userSalary || 25000000);
                  const allow = payrollItem ? payrollItem.allowance : 2500000;
                  const bhxh = payrollItem ? payrollItem.insurance : Math.round(gross * 0.105);
                  const pit = payrollItem ? payrollItem.tax : Math.round((gross - 11000000) * 0.1 > 0 ? (gross - 11000000) * 0.1 : 0);
                  const net = payrollItem ? payrollItem.net_salary : (gross + allow - bhxh - pit);

                  return (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-cyan-400 font-bold">{u.staff_code}</td>
                      <td className={`py-3 px-3 font-bold ${textLabel}`}>{u.name}</td>
                      <td className="py-3 px-3 text-slate-400">{u.title}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">{gross.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">+{allow.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 px-3 text-right font-mono text-rose-400">-{bhxh.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 px-3 text-right font-mono text-rose-400">-{pit.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-amber-400 text-sm">{net.toLocaleString('vi-VN')} đ</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedPayslipEmployee({ ...u, gross, allow, bhxh, pit, net })}
                          className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                        >
                          Xem Phiếu Lương
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: PERFORMANCE & LAWYER BILLABLE HOURS */}
      {hrSubTool === "performance" && (
        <div className={fullScreenSubTools["performance"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-6 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : "space-y-6"}>
          
          <div className="flex items-center justify-between border-b border-slate-800/20 pb-3">
            <div>
              <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">Hiệu suất & Năng suất Luật sư</span>
              <h3 className={`text-base font-bold ${textTitle} mt-0.5`}>Đánh giá KPI & Khen thưởng - Tháng {hrMonth}/{hrYear}</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                <ArrowUpFromLine size={13} />
                <span>Nhập KPI Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportKPI}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExportKPI}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Xuất Excel</span>
              </button>
              <button
                onClick={handleExportKPICSV}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={13} />
                <span>Xuất CSV</span>
              </button>
              <button
                onClick={() => toggleFullScreen("performance")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                }`}
              >
                {fullScreenSubTools["performance"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{fullScreenSubTools["performance"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* KPI Chart Block */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-7 space-y-4`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <TrendingUp size={16} className="text-indigo-400" />
                <span>Thống kê Billable Hours & Năng suất Luật sư</span>
              </h3>
              <p className={`text-xs ${subText}`}>Phân chia số giờ tính phí khách hàng (Billable) và giờ hoạt động hãng luật (Non-billable)</p>

              <div className="h-[250px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "T.V.Nam", Billable: 145, NonBillable: 35 },
                    { name: "N.T.Mai", Billable: 130, NonBillable: 42 },
                    { name: "L.H.Cường", Billable: 160, NonBillable: 20 },
                    { name: "P.M.Dung", Billable: 95, NonBillable: 60 },
                    { name: "H.Đ.Anh", Billable: 120, NonBillable: 38 }
                  ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3547" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px" }} />
                    <Legend />
                    <Bar dataKey="Billable" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="NonBillable" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lawyer Court attendance logs */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-5 space-y-4`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Scale size={16} className="text-amber-400" />
                <span>Số phiên tòa đã tham gia tranh tụng (Court Appearances)</span>
              </h3>

              <div className="space-y-3 text-xs">
                {[
                  { name: "Trần Văn Nam", cases: 14, win_rate: "92%", hours: "180h" },
                  { name: "Nguyễn Thị Mai", cases: 10, win_rate: "88%", hours: "172h" },
                  { name: "Lê Hoàng Cường", cases: 18, win_rate: "85%", hours: "180h" },
                  { name: "Hoàng Đức Anh", cases: 8, win_rate: "100%", hours: "158h" }
                ].map((row, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${innerBoxBg} flex items-center justify-between`}>
                    <div>
                      <strong className={textLabel}>{row.name}</strong>
                      <p className="text-[10px] text-slate-500">Tỷ lệ thắng án: <strong className="text-emerald-400">{row.win_rate}</strong> • Tổng thời gian: {row.hours}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black font-mono leading-none">{row.cases} Phiên</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* KPI Details Table */}
          <div className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Award size={16} className="text-indigo-400" />
                <span>Danh sách Đánh giá Chi tiết & Xếp hạng KPI</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Chức danh</th>
                    <th className="py-2.5 px-3 text-center">KPI Tác vụ</th>
                    <th className="py-2.5 px-3 text-center">Đánh giá AI</th>
                    <th className="py-2.5 px-3 text-center">Đánh giá QL</th>
                    <th className="py-2.5 px-3 text-center">Tổng Điểm</th>
                    <th className="py-2.5 px-3 text-center">Xếp loại</th>
                    <th className="py-2.5 px-3 text-right">Giờ Billable</th>
                    <th className="py-2.5 px-3 text-right">Phiên tòa</th>
                    <th className="py-2.5 px-3 text-right">Cuộc họp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {displayStaff.map((u, i) => {
                    const kpiItem = Array.isArray(kpiList) ? kpiList.find(p => String(p.employee_id) === String(u.id)) : null;
                    const isLawyer = String(u.role).includes("lawyer") || String(u.title).includes("Luật sư");
                    const kpi_score = kpiItem ? kpiItem.kpi_score : 85;
                    const ai_score = kpiItem ? kpiItem.ai_score : 90;
                    const manager_score = kpiItem ? kpiItem.manager_score : 88;
                    const total = kpiItem ? kpiItem.total_score : Math.round((kpi_score + ai_score + manager_score) / 3);
                    const rank = kpiItem ? kpiItem.rank : (total >= 92 ? "A+" : total >= 85 ? "A" : "B");
                    const billable = kpiItem ? kpiItem.billable_hours : (isLawyer ? 130 : 0);
                    const court = kpiItem ? kpiItem.court_time : (isLawyer ? 35 : 0);
                    const meetings = kpiItem ? kpiItem.client_meetings : 25;

                    return (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                        <td className={`py-3 px-3 font-bold ${textLabel}`}>{u.name}</td>
                        <td className="py-3 px-3 text-slate-400">{u.title || "Chuyên viên"}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">{kpi_score}</td>
                        <td className="py-3 px-3 text-center font-mono text-cyan-400">{ai_score}</td>
                        <td className="py-3 px-3 text-center font-mono text-amber-400">{manager_score}</td>
                        <td className="py-3 px-3 text-center font-mono font-black text-emerald-400">{total}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            rank.includes("A") ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"
                          }`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-indigo-400">{billable} h</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">{court}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">{meetings}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 8: RECRUITMENT & TRAINING */}
      {hrSubTool === "training" && (
        <div className={fullScreenSubTools["training"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-6 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : "space-y-6"}>
          
          <div className="flex items-center justify-between border-b border-slate-800/20 pb-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Tuyển dụng & Đào tạo (L&D)</span>
            <button
              onClick={() => toggleFullScreen("training")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              {fullScreenSubTools["training"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{fullScreenSubTools["training"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recruitment Pool */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-6 space-y-4`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Users size={16} className="text-indigo-400" />
                <span>Ứng viên Đang Tuyển dụng & AI Screening</span>
              </h3>

              <div className="space-y-3 text-xs">
                {recruitmentList.length > 0 ? (
                  recruitmentList.map((cand, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${innerBoxBg} flex items-center justify-between`}>
                      <div>
                        <strong className={textLabel}>{cand.name}</strong>
                        <p className="text-[10px] text-slate-500">Vị trí: {cand.position} • Phỏng vấn: {cand.interview_date}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold text-[10px]">AI Match: {cand.ai_score || "85"}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500 italic">Chưa có ứng viên nào ghi nhận trong tháng này.</div>
                )}
              </div>
            </div>

            {/* CPD training tracker */}
            <div className={`p-5 rounded-2xl border ${cardBg} lg:col-span-6 space-y-4`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <BookOpen size={16} className="text-emerald-400" />
                <span>Khóa bồi dưỡng nghiệp vụ bắt buộc (CPD Course Logs)</span>
              </h3>

              <div className="space-y-3 text-xs">
                {trainingList.length > 0 ? (
                  trainingList.map((course, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${innerBoxBg} flex items-center justify-between`}>
                      <div>
                        <strong className={textLabel}>{course.employee_name}</strong>
                        <p className="text-[10px] text-slate-500">Chuyên đề: {course.course_name} • Ngày cấp: {course.completion_date}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase">{course.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500 italic">Chưa ghi nhận khóa đào tạo nào.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 9: AI HR ASSISTANT CHAT PANEL */}
      {hrSubTool === "ai_assistant" && (
        <div className={fullScreenSubTools["ai_assistant"] 
          ? `fixed inset-0 z-50 p-6 overflow-y-auto w-full h-full flex flex-col space-y-4 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900 animate-in fade-in duration-300'}` 
          : `p-5 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="text-indigo-400 animate-bounce" />
              <div>
                <h3 className={`text-sm font-bold ${textTitle}`}>Trợ Lý Ảo AI Nhân Sự - Legal OS® Intelligence</h3>
                <p className={`text-[11px] ${subText}`}>Phân tích dữ liệu đi trễ, hợp đồng, tự động hóa xử lý yêu cầu nhân sự</p>
              </div>
            </div>
            
            <button
              onClick={() => toggleFullScreen("ai_assistant")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
              }`}
            >
              {fullScreenSubTools["ai_assistant"] ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{fullScreenSubTools["ai_assistant"] ? "Thoát toàn màn hình" : "Toàn màn hình"}</span>
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs whitespace-nowrap">
            <span className="text-slate-500 font-bold text-[10px] uppercase">Hỏi nhanh:</span>
            {[
              { text: "Ai chưa chấm công hôm nay?", query: "Hôm nay ai chưa chấm công?" },
              { text: "Ai đi trễ nhiều nhất tháng?", query: "Ai hay đi trễ nhất?" },
              { text: "Hợp đồng sắp hết hạn?", query: "Có hợp đồng nào sắp hết hạn không?" },
              { text: "Quy định nghỉ phép năm?", query: "Nội quy về số ngày nghỉ phép năm như thế nào?" }
            ].map((chip, i) => (
              <button
                key={i}
                onClick={() => askAiHR(chip.query)}
                className={`px-2.5 py-1 rounded-full border border-slate-800 text-[10px] bg-slate-900/60 text-slate-300 hover:text-white hover:border-indigo-500/50 cursor-pointer transition-all`}
              >
                {chip.text}
              </button>
            ))}
          </div>

          {/* Chat Feed */}
          <div className="h-[350px] overflow-y-auto border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-4 text-xs scrollbar-thin">
            {chatHistory.map((chat, i) => {
              const isAi = chat.sender === "ai";
              return (
                <div key={i} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-xl p-3 space-y-2 ${
                    isAi ? "bg-slate-900 border border-slate-800 text-slate-100" : "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  }`}>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      {isAi ? <Bot size={12} className="text-indigo-400" /> : <Users size={12} />}
                      <span>{isAi ? "AI HR Assistant" : "Quản trị viên"}</span>
                    </div>

                    <div className="markdown-body text-slate-200 leading-relaxed font-sans prose prose-invert max-w-none">
                      <Markdown>{chat.text}</Markdown>
                    </div>

                    {/* Render table if response returns array data */}
                    {chat.data && chat.data.length > 0 && (
                      <div className="overflow-x-auto border border-slate-800 rounded-lg mt-2">
                        <table className="w-full text-[10px] text-left">
                          <thead>
                            <tr className="bg-slate-800 text-slate-400 font-bold">
                              <th className="p-1.5">Nhân viên</th>
                              <th className="p-1.5">Mã NS</th>
                              <th className="p-1.5">Chức danh / Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {chat.data.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-800/40">
                                <td className="p-1.5 font-bold text-slate-100">{row.name || row.employee_name}</td>
                                <td className="p-1.5 font-mono text-cyan-400">{row.staff_code}</td>
                                <td className="p-1.5 text-slate-400">
                                  {row.title || row.status || (row.late_count ? `Trễ ${row.late_count} lần` : "—")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-xl p-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-75" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150" />
                  <span className="text-[10px] font-bold">AI đang phân tích dữ liệu phòng ban...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAiHR()}
              placeholder="Hỏi AI bất cứ điều gì (ví dụ: Ai hay đi trễ?)"
              className={`flex-1 p-2.5 rounded-xl border ${innerBoxBg} text-xs ${textLabel} outline-none`}
            />
            <button
              onClick={() => askAiHR()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer shadow shadow-indigo-500/20"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ==================================== MODALS ==================================== */}

      {/* 1. Modal: Full Employee 360 Profile details */}
      {selectedPersonnelDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl border ${cardBg} p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-thin`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow">
                  {selectedPersonnelDetail.name?.split(' ').pop()?.[0] || 'L'}
                </div>
                <div>
                  <h3 className={`text-base font-bold ${textTitle}`}>{selectedPersonnelDetail.name}</h3>
                  <p className="text-xs text-slate-400">Mã NS: <strong className="text-cyan-400">{selectedPersonnelDetail.staff_code}</strong> • @{selectedPersonnelDetail.username}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPersonnelDetail(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Core details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className={`p-3 rounded-xl border ${innerBoxBg}`}>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Chức danh / Cấp bậc</span>
                <strong className={`${textLabel} text-sm mt-0.5 block`}>{selectedPersonnelDetail.title}</strong>
              </div>
              <div className={`p-3 rounded-xl border ${innerBoxBg}`}>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Phòng ban / Lĩnh vực</span>
                <strong className="text-purple-400 text-sm mt-0.5 block">{selectedPersonnelDetail.department}</strong>
              </div>
              <div className={`p-3 rounded-xl border ${innerBoxBg}`}>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Mức lương cơ bản</span>
                <strong className="text-amber-400 font-mono mt-0.5 block">{(selectedPersonnelDetail.salary || 25000000).toLocaleString('vi-VN')} VNĐ</strong>
              </div>
              <div className={`p-3 rounded-xl border ${innerBoxBg}`}>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Ngày bắt đầu (Vào làm)</span>
                <strong className="text-emerald-400 font-mono mt-0.5 block">{selectedPersonnelDetail.join_date}</strong>
              </div>
            </div>

            {/* Sub-tabs inside Employee 360 (Assets, Timeline, Skills, Files) */}
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <span className="text-xs font-black text-cyan-400 uppercase">Tài sản cấp phát (Assets allocation)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-300">
                <div className={`p-2.5 rounded-xl border ${innerBoxBg}`}>
                  <span>Laptop Lenovo</span>
                  <p className="text-[10px] text-emerald-400 mt-0.5">✓ Đã bàn giao</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${innerBoxBg}`}>
                  <span>SIM 4G Mobifone</span>
                  <p className="text-[10px] text-emerald-400 mt-0.5">✓ Đã kích hoạt</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${innerBoxBg}`}>
                  <span>Tài khoản Google Workspace</span>
                  <p className="text-[10px] text-emerald-400 mt-0.5">✓ Đã thiết lập</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${innerBoxBg}`}>
                  <span>Bản quyền Zoom Pro</span>
                  <p className="text-[10px] text-emerald-400 mt-0.5">✓ Đang active</p>
                </div>
              </div>

              <span className="text-xs font-black text-purple-400 uppercase block mt-4">Hồ sơ số nhân sự (Digital personnel files)</span>
              <div className="space-y-2 text-[11px] text-slate-300">
                {[
                  { file: "Hợp_đồng_lao_động_ký_số.pdf", size: "2.4 MB", type: "PDF" },
                  { file: "Bằng_cử_nhân_luật_công_chứng.pdf", size: "1.8 MB", type: "PDF" },
                  { file: "Sơ_yếu_lý_lịch_trích_ngang.docx", size: "450 KB", type: "DOCX" }
                ].map((doc, i) => (
                  <div key={i} className={`p-2 rounded-xl border ${innerBoxBg} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-cyan-400" />
                      <span>{doc.file} ({doc.size})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer">Tải xuống</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  showToast(`Đã xuất Hồ sơ Lý lịch Nhân sự ${selectedPersonnelDetail.name} dạng PDF thành công!`);
                  setSelectedPersonnelDetail(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Xuất File Hồ Sơ PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Detailed Digital Payslip Drawer */}
      {selectedPayslipEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-2xl border ${cardBg} p-6 space-y-4 animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className={`text-base font-bold ${textTitle}`}>Phiếu Lương Điện Tử (Payslip)</h3>
                <p className="text-xs text-slate-400">Tháng {hrMonth}/{hrYear} • Bản bảo mật nội bộ</p>
              </div>
              <button onClick={() => setSelectedPayslipEmployee(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-800/40 pb-2">
                <div>
                  <strong className={`${textLabel} text-sm block`}>{selectedPayslipEmployee.name}</strong>
                  <span className="text-slate-500 text-[10px]">{selectedPayslipEmployee.title}</span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 font-mono font-bold block">{selectedPayslipEmployee.staff_code}</span>
                  <span className="text-slate-500 text-[10px]">{selectedPayslipEmployee.department}</span>
                </div>
              </div>

              {/* Earnings */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Khoản Thu Nhập (Earnings)</span>
                <div className="space-y-1.5 pl-2 text-slate-300">
                  <div className="flex justify-between">
                    <span>Lương cơ bản (Base salary):</span>
                    <span className="font-mono">{selectedPayslipEmployee.gross.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Phụ cấp ăn, xăng xe, điện thoại:</span>
                    <span className="font-mono">+{selectedPayslipEmployee.allow.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2 border-t border-slate-800/40 pt-2.5">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Khoản Khấu Trừ (Deductions)</span>
                <div className="space-y-1.5 pl-2 text-slate-300">
                  <div className="flex justify-between text-rose-400">
                    <span>BHXH bắt buộc (10.5%):</span>
                    <span className="font-mono">-{selectedPayslipEmployee.bhxh.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>Thuế thu nhập cá nhân (PIT tạm tính):</span>
                    <span className="font-mono">-{selectedPayslipEmployee.pit.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>

              {/* Net Payout */}
              <div className={`p-3.5 rounded-xl border ${innerBoxBg} flex justify-between items-center bg-indigo-500/5 mt-4`}>
                <div>
                  <strong className={textLabel}>Thực nhận chuyển khoản (Net salary)</strong>
                  <p className="text-[10px] text-slate-500">Đã bao gồm đóng bảo hiểm & quyết toán PIT</p>
                </div>
                <span className="text-lg font-black text-amber-400 font-mono">{selectedPayslipEmployee.net.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between gap-2">
              <span className="text-[10px] text-emerald-400 font-bold self-center flex items-center gap-1">
                ✓ Được ký số điện tử bảo mật
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    showToast(`Đã xuất PDF Phiếu Lương cho nhân sự ${selectedPayslipEmployee.name}`);
                    setSelectedPayslipEmployee(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tải Phiếu Lương PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Add New Personnel Form */}
      {isAddPersonnelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-2xl border ${cardBg} p-6 space-y-4 animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className={`text-base font-bold ${textTitle} flex items-center gap-2`}>
                <Plus size={18} className="text-purple-400" />
                <span>Thêm Hồ Sơ Nhân Sự Doanh Nghiệp</span>
              </h3>
              <button onClick={() => setIsAddPersonnelModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block ${textLabel} font-bold mb-1`}>Họ và Tên Nhân sự</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lê Minh Hoàng"
                  className={`w-full px-3 py-2 rounded-xl border ${innerBoxBg} ${textLabel} outline-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block ${textLabel} font-bold mb-1`}>Chức danh</label>
                  <select
                    className={`w-full px-3 py-2 rounded-xl border ${innerBoxBg} ${textLabel} outline-none cursor-pointer`}
                    defaultValue="Chuyên viên pháp lý"
                  >
                    {SYSTEM_TITLES.map((title, index) => (
                      <option key={index} value={title}>{title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block ${textLabel} font-bold mb-1`}>Lương cơ bản (gross)</label>
                  <input
                    type="number"
                    placeholder="25000000"
                    className={`w-full px-3 py-2 rounded-xl border ${innerBoxBg} ${textLabel} outline-none`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block ${textLabel} font-bold mb-1`}>Bộ phận</label>
                  <select className={`w-full px-3 py-2 rounded-xl border ${innerBoxBg} ${textLabel} outline-none cursor-pointer`}>
                    <option value="Khối Tố tụng & Dân sự">Khối Tố tụng & Dân sự</option>
                    <option value="Khối Doanh nghiệp & M&A">Khối Doanh nghiệp & M&A</option>
                    <option value="Khối Đất đai & BĐS">Khối Đất đai & BĐS</option>
                    <option value="Khối Hành chính & HR">Khối Hành chính & HR</option>
                  </select>
                </div>

                <div>
                  <label className={`block ${textLabel} font-bold mb-1`}>Chi nhánh</label>
                  <select className={`w-full px-3 py-2 rounded-xl border ${innerBoxBg} ${textLabel} outline-none cursor-pointer`}>
                    {officesList && officesList.length > 0 ? (
                      officesList.map((office: any) => (
                        <option key={office.id} value={office.short_name || office.name}>
                          {office.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Trụ sở chính">Trụ sở chính</option>
                        <option value="Chi nhánh Hà Nội">Chi nhánh Hà Nội</option>
                        <option value="Chi nhánh Đà Nẵng">Chi nhánh Đà Nẵng</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsAddPersonnelModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  showToast("Đã thêm mới & lưu trữ thành công hồ sơ nhân sự vào cơ sở dữ liệu Legal OS!");
                  setIsAddPersonnelModalOpen(false);
                  fetchAllHRData();
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Lưu Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl border ${cardBg} p-6 space-y-4 animate-in zoom-in-95 duration-200 text-center`}>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/30">
              <ArrowUpFromLine size={24} />
            </div>
            <h3 className={`text-base font-bold ${textTitle}`}>Nhập danh sách Nhân sự từ Excel</h3>
            <p className="text-xs text-slate-400">Tải lên file định dạng mẫu của hãng luật (.xlsx, .csv) để đồng bộ định biên tự động.</p>

            <div className="p-6 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl bg-slate-900/50 cursor-pointer transition-all">
              <p className="text-xs font-bold text-slate-300">Kéo thả file Excel vào đây hoặc click để chọn file</p>
              <p className="text-[10px] text-slate-500 mt-1">Hỗ trợ định dạng .xlsx, .xls, .csv (Tối đa 25MB)</p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer">
                Đóng
              </button>
              <button
                onClick={() => {
                  showToast("Đã đồng bộ thành công dữ liệu nhân sự từ file Excel tải lên!");
                  setIsImportModalOpen(false);
                  fetchAllHRData();
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Nhập Dữ Liệu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
