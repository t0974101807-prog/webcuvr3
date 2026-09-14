import React, { useState } from "react";
import { 
  Phone, Eye, Trash2, Shield, Calendar, MapPin, User, AlertCircle, 
  ChevronRight, PhoneOff, Filter, Grid, Table, AlertTriangle, Check
} from "lucide-react";
import { CustomerDossier } from "../ErpLegalMeetingWorkspace";

interface LitigationTableProps {
  dossiers: CustomerDossier[];
  onView: (record: CustomerDossier) => void;
  onDelete: (index: number) => void;
  onCall: (record: CustomerDossier) => void;
  onHangup: () => void;
  activeCallDossierId: number | null;
  searchKeyword: string;
  language: "vi" | "en";
}

export default function LitigationTable({
  dossiers,
  onView,
  onDelete,
  onCall,
  onHangup,
  activeCallDossierId,
  searchKeyword,
  language
}: LitigationTableProps) {
  // Toggle between "standard" list view (compact) and "expanded" full-width scroll table
  const [layoutMode, setLayoutMode] = useState<"standard" | "expanded">("expanded");

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN") + " đ";
  };

  // Generate initials for lawyer avatar
  const getInitials = (name: string) => {
    if (!name) return "LS";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate a soft background color for initials avatar
  const getAvatarBg = (name: string) => {
    const colors = [
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      "bg-sky-500/10 text-sky-400 border border-sky-500/20",
      "bg-violet-500/10 text-violet-400 border border-violet-500/20",
      "bg-rose-500/10 text-rose-400 border border-rose-500/20",
      "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20"
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Get status class for treatment workflow
  const getWorkflowStatusBadge = (status: string, originalStatus: string) => {
    const isCompleted = originalStatus === "Đã làm" || status === "Đã hoàn thành" || status === "Hoàn thành";
    if (isCompleted) {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (status === "Đang xử lý" || status === "Đang tranh tụng") {
      return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
    }
    if (status === "Khẩn cấp" || status === "Chờ xét xử") {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }
    return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  };

  // Get priority styling
  const getPriorityBadge = (priority: string) => {
    const p = String(priority).toUpperCase();
    if (p === "KHẨN CẤP" || p === "HIGH" || p === "CRITICAL") {
      return "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-black";
    }
    if (p === "TRUNG BÌNH" || p === "MEDIUM" || p === "WARNING") {
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold";
    }
    return "bg-slate-500/15 text-slate-400 border border-slate-500/30 font-medium";
  };

  // Clean or map court name realistically
  const getCourtName = (item: CustomerDossier) => {
    if (item.province) {
      return `TAND Tỉnh ${item.province}`;
    }
    if (item.region === "Miền Nam") return "TAND TP. Hồ Chí Minh";
    if (item.region === "Miền Bắc") return "TAND TP. Hà Nội";
    if (item.region === "Miền Trung") return "TAND TP. Đà Nẵng";
    return "TAND Quận 1, TP. HCM";
  };

  // Get deadline label & state
  const getDeadlineInfo = (item: CustomerDossier) => {
    const overdueDays = item.overdueDays || 0;
    if (overdueDays > 90) {
      return { text: "Quá hạn 90 ngày+", style: "text-rose-500 font-extrabold" };
    }
    if (overdueDays > 30) {
      return { text: `Quá hạn ${overdueDays} ngày`, style: "text-rose-400 font-bold" };
    }
    // Realistic trial schedule date mapping
    const trialDate = item.lastRepaymentDate ? item.lastRepaymentDate : "15/10/2026";
    return { text: `Xét xử: ${trialDate}`, style: "text-slate-300 font-medium" };
  };

  // Get realistic Lawyer name assigned to the dossier
  const getAssignedLawyer = (item: CustomerDossier) => {
    if (item.index % 5 === 0) return "LS. Nguyễn Văn Thuận";
    if (item.index % 5 === 1) return "LS. Lê Thị Kiều Trang";
    if (item.index % 5 === 2) return "LS. Trần Quang Hải";
    if (item.index % 5 === 3) return "LS. Phạm Ánh Dương";
    return "LS. Hoàng Minh Triết";
  };

  // Empty state rendering
  if (dossiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-950/40 border border-[#15233d] rounded-3xl" id="empty_state_container">
        <div className="p-5 bg-[#15233d]/30 rounded-full text-slate-500 mb-5 relative">
          <AlertTriangle size={48} className="text-[#e2b13c]" />
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </div>
        <h3 className="text-base font-bold text-white mb-2" id="empty_state_title">
          {language === "vi" ? "Không tìm thấy hồ sơ tranh tụng nào" : "No litigation cases found"}
        </h3>
        <p className="text-xs text-slate-400 text-center max-w-sm" id="empty_state_description">
          {language === "vi" 
            ? "Bộ lọc hiện tại không trùng khớp với bất kỳ dữ liệu hồ sơ nào trong phân hệ Tranh tụng. Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc đổi danh mục bộ lọc." 
            : "The current filter criteria did not yield any records in the litigation database. Please refine your search keyword or adjust filter settings."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="litigation_table_module">
      {/* Table Sub-Header Actions */}
      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-2xl border border-[#15233d]/80" id="table_actions_bar">
        <div className="flex items-center space-x-1">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider px-2">CHẾ ĐỘ HIỂN THỊ:</span>
        </div>
        <div className="flex bg-slate-900 border border-[#15233d] rounded-xl p-0.5">
          <button
            onClick={() => setLayoutMode("standard")}
            className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all flex items-center space-x-1.5 ${
              layoutMode === "standard" 
                ? "bg-[#15233d] text-white shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid size={12} />
            <span>{language === "vi" ? "Danh sách tiêu chuẩn" : "Standard list"}</span>
          </button>
          <button
            onClick={() => setLayoutMode("expanded")}
            className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all flex items-center space-x-1.5 ${
              layoutMode === "expanded" 
                ? "bg-[#15233d] text-white shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Table size={12} />
            <span>{language === "vi" ? "Bảng mở rộng tràn viền" : "Expanded Full-Width"}</span>
          </button>
        </div>
      </div>

      {/* --- RENDER 1: STANDARD VIEW (Danh sách chuẩn - Hình 2) --- */}
      {layoutMode === "standard" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="standard_layout_grid">
          {dossiers.map((item, idx) => {
            const lawyerName = getAssignedLawyer(item);
            const isCalling = activeCallDossierId === item.index;

            return (
              <div 
                key={item.index} 
                className="bg-[#0a1224] border border-[#15233d] hover:border-sky-500/40 rounded-2xl p-4 space-y-3 transition-all duration-200 hover:shadow-lg relative group"
                id={`standard_card_${item.index}`}
              >
                {/* Upper row: Code, Priority badge & actions */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-black bg-sky-950/80 text-sky-400 px-2 py-0.5 rounded-md border border-sky-900/30">
                      {item.code || `HS-2026-${String(item.index).padStart(4, "0")}`}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-100 mt-1 line-clamp-1">{item.clientName}</h4>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                </div>

                {/* Info block: Lawyer, Court, status */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-[#15233d]/50 pt-2.5">
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${getAvatarBg(lawyerName)}`}>
                      {getInitials(lawyerName)}
                    </div>
                    <span className="font-bold text-slate-300 truncate">{lawyerName}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 justify-end">
                    <MapPin size={11} className="text-sky-500 shrink-0" />
                    <span className="truncate max-w-[120px] font-bold text-slate-300">{getCourtName(item)}</span>
                  </div>
                </div>

                {/* Bottom line: Amount & Deadline & Call */}
                <div className="flex justify-between items-center border-t border-[#15233d]/50 pt-3 mt-1">
                  <div className="space-y-0.5">
                    <div className="text-[9px] uppercase font-black tracking-widest text-slate-500">Nợ gốc còn lại</div>
                    <div className="font-mono text-xs text-white font-extrabold">{formatCurrency(item.remainingPrincipal)}</div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* View Details */}
                    <button
                      onClick={() => onView(item)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-sky-400 rounded-xl transition border border-[#15233d]"
                      title={language === "vi" ? "Xem chi tiết" : "View details"}
                    >
                      <Eye size={12} />
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={() => onDelete(item.index)}
                      className="p-2 bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-slate-500 rounded-xl transition border border-[#15233d]"
                      title={language === "vi" ? "Xóa" : "Delete"}
                    >
                      <Trash2 size={12} />
                    </button>

                    {/* Telephony Call Button */}
                    {isCalling ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onHangup();
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black transition-all flex items-center space-x-1 animate-pulse"
                      >
                        <PhoneOff size={11} />
                        <span>{language === "vi" ? "GÁC MÁY" : "HANGUP"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCall(item);
                        }}
                        className="px-3 py-1.5 bg-[#1d3557] hover:bg-sky-600 text-white rounded-xl text-[10px] font-black transition-all flex items-center space-x-1"
                      >
                        <Phone size={11} className="fill-current" />
                        <span>GỌI ĐIỆN</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- RENDER 2: EXPANDED SCROLL VIEW (Bảng tràn chiều ngang đầy đủ cột - Hình 3) --- */
        <div className="overflow-x-auto border border-[#15233d] rounded-2xl bg-[#0a1224]/80 custom-scrollbar" id="expanded_scroll_container">
          <table className="w-full text-left border-collapse text-xs min-w-[1280px]" id="expanded_litigation_table">
            <thead>
              <tr className="bg-slate-950 text-[10px] font-black uppercase text-slate-400 border-b border-[#15233d] select-none">
                <th className="p-3.5 text-center w-14">STT</th>
                <th className="p-3.5 min-w-[120px]">{language === "vi" ? "Loại hồ sơ" : "Dossier Type"}</th>
                <th className="p-3.5 min-w-[110px] text-center">{language === "vi" ? "Mức độ" : "Priority"}</th>
                <th className="p-3.5 min-w-[160px]">{language === "vi" ? "Khách hàng" : "Client"}</th>
                <th className="p-3.5 min-w-[170px]">{language === "vi" ? "Luật sư phụ trách" : "Assigned Lawyer"}</th>
                <th className="p-3.5 min-w-[180px]">{language === "vi" ? "Tòa án thụ lý" : "Jurisdiction Court"}</th>
                <th className="p-3.5 min-w-[140px] text-center">{language === "vi" ? "Trạng thái xử lý" : "Status"}</th>
                <th className="p-3.5 min-w-[140px]">{language === "vi" ? "Hạn Deadline" : "Deadline"}</th>
                <th className="p-3.5 text-center min-w-[120px]">{language === "vi" ? "Gọi điện" : "Call Action"}</th>
                <th className="p-3.5 text-center w-28 sticky right-0 bg-slate-950 border-l border-[#15233d]">{language === "vi" ? "Thao tác" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15233d]/50 font-medium text-slate-300">
              {dossiers.map((item, idx) => {
                const lawyerName = getAssignedLawyer(item);
                const isCalling = activeCallDossierId === item.index;
                const deadlineInfo = getDeadlineInfo(item);

                return (
                  <tr 
                    key={item.index} 
                    className="hover:bg-[#15233d]/25 transition-all duration-150"
                    id={`expanded_row_${item.index}`}
                  >
                    {/* STT */}
                    <td className="p-3.5 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Loại hồ sơ (Mã code badge) */}
                    <td className="p-3.5">
                      <div className="flex flex-col space-y-1">
                        <span className="font-mono text-[10px] font-black bg-sky-950/80 text-sky-400 px-2 py-0.5 rounded border border-sky-900/30 whitespace-nowrap self-start">
                          {item.code || `HS-2026-${String(item.index).padStart(4, "0")}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{item.documentType}</span>
                      </div>
                    </td>

                    {/* Mức độ */}
                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] uppercase px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm ${getPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>

                    {/* Khách hàng */}
                    <td className="p-3.5">
                      <div className="flex flex-col space-y-0.5">
                        <span className="font-black text-slate-100">{item.clientName}</span>
                        <span className="font-mono text-[10px] text-sky-400 font-bold">{item.clientPhone}</span>
                      </div>
                    </td>

                    {/* Luật sư phụ trách */}
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${getAvatarBg(lawyerName)}`}>
                          {getInitials(lawyerName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">{lawyerName}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Luật sư tranh tụng</span>
                        </div>
                      </div>
                    </td>

                    {/* Tòa án thụ lý */}
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <MapPin size={12} className="text-sky-500 shrink-0" />
                        <span className="font-bold">{getCourtName(item)}</span>
                      </div>
                    </td>

                    {/* Trạng thái xử lý */}
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap shadow-xs ${getWorkflowStatusBadge(item.loanStatus, item.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>{item.loanStatus || (item.status === "Đã làm" ? "Hoàn thành" : "Đang xử lý")}</span>
                      </span>
                    </td>

                    {/* Hạn Deadline */}
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={12} className="text-slate-500 shrink-0" />
                        <span className={`text-[11px] font-bold ${deadlineInfo.style}`}>{deadlineInfo.text}</span>
                      </div>
                    </td>

                    {/* Gọi điện */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center">
                        {isCalling ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onHangup();
                            }}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center space-x-1 animate-pulse"
                          >
                            <PhoneOff size={11} />
                            <span>{language === "vi" ? "GÁC MÁY" : "HANGUP"}</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCall(item);
                            }}
                            className="px-2.5 py-1.5 bg-[#1d3557] hover:bg-sky-600 text-white text-[10px] font-black rounded-lg transition-all flex items-center space-x-1"
                          >
                            <Phone size={11} className="fill-current" />
                            <span>GỌI ĐIỆN</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="p-3.5 text-center sticky right-0 bg-[#070e1b] border-l border-[#15233d]/40">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onView(item)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 rounded-lg transition border border-slate-800"
                          title={language === "vi" ? "Xem chi tiết" : "View details"}
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => onDelete(item.index)}
                          className="p-1.5 bg-slate-900 hover:bg-rose-950 hover:text-rose-400 text-slate-500 rounded-lg transition border border-slate-800"
                          title={language === "vi" ? "Xóa" : "Delete"}
                        >
                          <Trash2 size={12} />
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
  );
}
