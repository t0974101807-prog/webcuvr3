import React, { useState, useMemo, useEffect, useRef } from "react";
import { Eye, Copy, Check, ChevronLeft, ChevronRight, Inbox, Phone, Download, ArrowUpFromLine } from "lucide-react";
import { RecordItem } from "../repository/SpecializedRecordsRepository";
import { SpecializedRecordsService } from "../services/SpecializedRecordsService";
import { getModuleByActiveTab } from "../../../config/modules";

interface ModuleTableProps {
  records: any[];
  language: "vi" | "en";
  activeModule: string;
  onRowClick?: (row: any) => void;
  onDeleteClick?: (id: string, e: React.MouseEvent) => void;
  onEditClick?: (row: any) => void;
  selectedRecordId: string | null;
  setSelectedRecordId: (id: string | null) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  onExportExcel?: () => void;
  onExportCSV?: () => void;
  onImportSuccess?: (parsed: any[]) => void;
  currentUser?: any;
}

export const ModuleTable: React.FC<ModuleTableProps> = ({
  records,
  language,
  activeModule,
  onRowClick,
  onDeleteClick,
  onEditClick,
  selectedRecordId,
  setSelectedRecordId,
  pageSize,
  setPageSize,
  onExportExcel,
  onExportCSV,
  onImportSuccess,
  currentUser,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCallDossierId, setActiveCallDossierId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const moduleConfig = getModuleByActiveTab(activeModule);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportSuccess) {
      try {
        const records = await SpecializedRecordsService.parseExcelFile(
          file,
          currentUser,
          activeModule,
          moduleConfig.category
        );
        onImportSuccess(records);
        alert(
          language === "vi"
            ? `Nhập thành công ${records.length} hồ sơ ${moduleConfig.nameVi} từ file!`
            : `Successfully imported ${records.length} ${moduleConfig.nameEn} records!`
        );
      } catch (err: any) {
        console.error(err);
        if (err.message === "no_data") {
          alert(language === "vi" ? "File không có dữ liệu!" : "File contains no data!");
        } else {
          alert(language === "vi" ? "Đã có lỗi xảy ra khi đọc file!" : "Error parsing file!");
        }
      }
    }
  };

  useEffect(() => {
    const handleCallEnded = (e: any) => {
      setActiveCallDossierId(null);
    };
    window.addEventListener("yeastar-call-ended", handleCallEnded);
    return () => window.removeEventListener("yeastar-call-ended", handleCallEnded);
  }, []);

  // Filter records locally by search query ("Tìm:")
  const searchedRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter((r) => {
      return (
        (r.client && r.client.toLowerCase().includes(q)) ||
        (r.contractId && r.contractId.toLowerCase().includes(q)) ||
        (r.clientPhone && r.clientPhone.includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.courtArea && r.courtArea.toLowerCase().includes(q))
      );
    });
  }, [records, searchQuery]);

  // Pagination calculation
  const totalItems = searchedRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = useMemo(() => {
    return searchedRecords.slice(startIndex, startIndex + pageSize);
  }, [searchedRecords, startIndex, pageSize]);

  // Handle Clipboard Copy
  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Safe detail modal or timeline expansion
  const handleDetailClick = (row: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecordId(row.id);
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* 1. Header Toolbar matching Image 2 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
        
        {/* Left Side: Page Size Selector & Total Status Text */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {language === "vi" ? "Xem" : "Show"}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {language === "vi" ? "mục" : "entries"}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>

          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {language === "vi" ? (
              `${totalItems > 0 ? startIndex + 1 : 0} đến ${Math.min(
                startIndex + pageSize,
                totalItems
              )} trong tổng số ${totalItems} hồ sơ`
            ) : (
              `Showing ${totalItems > 0 ? startIndex + 1 : 0} to ${Math.min(
                startIndex + pageSize,
                totalItems
              )} of ${totalItems} dossiers`
            )}
          </span>
        </div>

        {/* Right Side: Search Box "Tìm:" & Interactive Pagination Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export / Import Button Group inside support toolbar */}
          <div className="flex items-center gap-1.5">
            {onImportSuccess && (
              <label className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer transition">
                <ArrowUpFromLine size={12} />
                <span>{language === "vi" ? "Nhập Excel" : "Import Excel"}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            )}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer transition"
              >
                <Download size={12} />
                <span>{language === "vi" ? "Xuất Excel" : "Export Excel"}</span>
              </button>
            )}
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="px-2.5 py-1 bg-slate-600 hover:bg-slate-500 text-white text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer transition"
              >
                <Download size={12} />
                <span>{language === "vi" ? "Xuất CSV" : "Export CSV"}</span>
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden md:block"></div>

          {/* Search "Tìm:" */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === "vi" ? "Tìm:" : "Search:"}
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 transition"
              placeholder={language === "vi" ? "Nhập từ khóa..." : "Keyword..."}
            />
          </div>

          {/* Quick Pagination Links */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Trước */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                {language === "vi" ? "Trước" : "Prev"}
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-emerald-600 text-white border border-emerald-600"
                        : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="text-xs text-slate-400 px-1">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                      currentPage === totalPages
                        ? "bg-emerald-600 text-white border border-emerald-600"
                        : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Sau */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                {language === "vi" ? "Sau" : "Next"}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 2. Main Data Table matching 19-Column Specification */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[2200px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
              <th className="py-3.5 px-3 text-center w-12 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">STT</th>
              <th className="py-3.5 px-3 min-w-[170px] sticky left-12 bg-slate-50 dark:bg-slate-900 z-10">{language === "vi" ? "1. Số HĐ" : "1. Contract ID"}</th>
              <th className="py-3.5 px-3 min-w-[160px] sticky left-[218px] bg-slate-50 dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">{language === "vi" ? "2. Tên KH" : "2. Customer Name"}</th>
              <th className="py-3.5 px-3 min-w-[140px]">{language === "vi" ? "3. Điện thoại KH" : "3. Phone"}</th>
              <th className="py-3.5 px-3 min-w-[110px]">{language === "vi" ? "4. Mã Code" : "4. Code"}</th>
              <th className="py-3.5 px-3 min-w-[140px]">{language === "vi" ? "5. Địa chỉ" : "5. Address"}</th>
              <th className="py-3.5 px-3 min-w-[100px]">{language === "vi" ? "6. Ngày sinh" : "6. DOB"}</th>
              <th className="py-3.5 px-3 min-w-[90px]">{language === "vi" ? "7. Giới tính" : "7. Gender"}</th>
              <th className="py-3.5 px-3 text-right min-w-[130px]">{language === "vi" ? "8. Nợ gốc còn lại" : "8. Principal"}</th>
              <th className="py-3.5 px-3 text-right min-w-[130px]">{language === "vi" ? "9. Số tiền quá hạn" : "9. Overdue Amt"}</th>
              <th className="py-3.5 px-3 text-center min-w-[110px]">{language === "vi" ? "10. Số ngày quá hạn" : "10. Overdue Days"}</th>
              <th className="py-3.5 px-3 text-center min-w-[100px]">{language === "vi" ? "11. Số kỳ quá hạn" : "11. Overdue Periods"}</th>
              <th className="py-3.5 px-3 text-right min-w-[125px]">{language === "vi" ? "12. Khoản trả/tháng" : "12. Monthly Pay"}</th>
              <th className="py-3.5 px-3 text-center min-w-[115px]">{language === "vi" ? "13. Ngày trả gần nhất" : "13. Last Pay Date"}</th>
              <th className="py-3.5 px-3 text-right min-w-[130px]">{language === "vi" ? "14. Số tiền thanh lý" : "14. Liquidation Amt"}</th>
              <th className="py-3.5 px-3 min-w-[140px]">{language === "vi" ? "15. Tình trạng khoản vay" : "15. Loan Status"}</th>
              <th className="py-3.5 px-3 min-w-[130px]">{language === "vi" ? "16. Loại hồ sơ" : "16. Category"}</th>
              <th className="py-3.5 px-3 text-center min-w-[140px] font-extrabold">{language === "vi" ? "17. HÀNH ĐỘNG GỌI" : "17. CALL ACTION"}</th>
              <th className="py-3.5 px-3 text-center min-w-[180px] sticky right-0 bg-slate-50 dark:bg-slate-900 z-10 border-l border-slate-200 dark:border-slate-800">{language === "vi" ? "18. Thao tác" : "18. Action"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={19} className="py-16 text-center">
                  <Inbox className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4">
                    {language === "vi" ? "Không tìm thấy hồ sơ nào phù hợp." : "No matching records found."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((row, idx) => {
                const isSelected = selectedRecordId === row.id;
                
                // Styling classes based on selection
                const rowClass = isSelected
                  ? "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white"
                  : "bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300";

                const stickyClass = isSelected
                  ? "bg-emerald-500 dark:bg-emerald-600"
                  : "bg-white dark:bg-slate-950";

                const contractNum = row.contractId || row.id;
                const clientCode = row.code || `AD-${String(contractNum).slice(-5)}`;
                const principalAmt = row.remainingPrincipal !== undefined 
                  ? Number(row.remainingPrincipal) 
                  : (row.feeAmount !== undefined ? Number(row.feeAmount) : 50000000);
                const overdueAmt = row.overdueAmount !== undefined && row.overdueAmount !== "null"
                  ? Number(row.overdueAmount)
                  : 0;
                const overdueDays = row.overdueDays !== undefined 
                  ? row.overdueDays 
                  : (overdueAmt > 0 ? 45 : 0);
                const overduePeriods = row.overduePeriods !== undefined 
                  ? row.overduePeriods 
                  : (overdueAmt > 0 ? 2 : 0);
                const monthlyPayment = row.monthlyPayment !== undefined 
                  ? Number(row.monthlyPayment) 
                  : Math.round(principalAmt / 12);
                const lastPayDate = row.lastRepaymentDate || row.date || "2026-08-01";
                const liquidationAmt = row.liquidationAmount !== undefined && row.liquidationAmount !== "null"
                  ? Number(row.liquidationAmount)
                  : principalAmt;

                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={`${rowClass} transition border-b border-slate-150 dark:border-slate-800 cursor-pointer`}
                  >
                    {/* STT (Sticky) */}
                    <td className={`py-3.5 px-3 text-center font-medium opacity-70 sticky left-0 ${stickyClass} z-10`}>
                      {startIndex + idx + 1}
                    </td>

                    {/* 1. Số HĐ with eye icon (Sticky) */}
                    <td className={`py-3.5 px-3 font-semibold sticky left-12 ${stickyClass} z-10`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono tracking-wider">{contractNum}</span>
                        <button
                          onClick={(e) => handleDetailClick(row, e)}
                          className={`p-1 rounded-full shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-white/20 text-white hover:bg-white/30"
                              : "bg-sky-50 dark:bg-sky-950 text-sky-500 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60"
                          }`}
                          title={language === "vi" ? "Xem chi tiết" : "View details"}
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>

                    {/* 2. Tên KH (Sticky) */}
                    <td className={`py-3.5 px-3 font-bold uppercase tracking-wide sticky left-[218px] ${stickyClass} z-10 border-r border-slate-200 dark:border-slate-800`}>
                      {row.client || "---"}
                    </td>

                    {/* 3. Điện thoại KH with Copy button */}
                    <td className="py-3.5 px-3 font-semibold">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono">{row.clientPhone || "---"}</span>
                        {row.clientPhone && (
                          <button
                            onClick={(e) => handleCopyPhone(row.id, row.clientPhone, e)}
                            className={`p-1 rounded-md shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-white/20 text-white hover:bg-white/30"
                                : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                            }`}
                            title={language === "vi" ? "Sao chép số" : "Copy number"}
                          >
                            {copiedId === row.id ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 4. Mã Code */}
                    <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      {clientCode}
                    </td>

                    {/* 5. Địa chỉ */}
                    <td className={`py-3.5 px-3 font-medium ${row.address === "null" || !row.address ? "text-slate-400" : ""}`}>
                      {row.address || row.province || "Hà Nội"}
                    </td>

                    {/* 6. Ngày sinh */}
                    <td className="py-3.5 px-3 font-medium font-mono">
                      {row.dob || "---"}
                    </td>

                    {/* 7. Giới tính */}
                    <td className="py-3.5 px-3 font-semibold">
                      {row.gender || "---"}
                    </td>

                    {/* 8. Nợ gốc còn lại */}
                    <td className="py-3.5 px-3 text-right font-bold font-mono">
                      {principalAmt.toLocaleString("vi-VN")} đ
                    </td>

                    {/* 9. Số tiền quá hạn */}
                    <td className="py-3.5 px-3 text-right font-semibold font-mono text-rose-500 dark:text-rose-400">
                      {overdueAmt.toLocaleString("vi-VN")} đ
                    </td>

                    {/* 10. Số ngày quá hạn */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        overdueDays > 90 ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30" : 
                        overdueDays > 0 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30" : 
                        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {overdueDays} ngày
                      </span>
                    </td>

                    {/* 11. Số kỳ quá hạn */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {overduePeriods} kỳ
                    </td>

                    {/* 12. Khoản trả/tháng */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-600 dark:text-slate-300">
                      {monthlyPayment.toLocaleString("vi-VN")} đ
                    </td>

                    {/* 13. Ngày trả gần nhất */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-500 dark:text-slate-400">
                      {lastPayDate}
                    </td>

                    {/* 14. Số tiền thanh lý */}
                    <td className="py-3.5 px-3 text-right font-bold font-mono">
                      {liquidationAmt.toLocaleString("vi-VN")} đ
                    </td>

                    {/* 15. Tình trạng khoản vay */}
                    <td className={`py-3.5 px-3 font-semibold ${row.loanStatus === "null" || !row.loanStatus ? "text-slate-400" : ""}`}>
                      {row.loanStatus && row.loanStatus !== "null" ? row.loanStatus : "Bình thường"}
                    </td>

                    {/* 16. Loại hồ sơ / Phân hệ */}
                    <td className="py-3.5 px-3 font-medium">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">
                        {row.category || (language === "vi" ? "Tư vấn" : "Advisory")}
                      </span>
                    </td>

                    {/* 17. HÀNH ĐỘNG GỌI */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {activeCallDossierId === row.id ? (
                          <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-bold animate-pulse bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900/60 rounded-lg px-2 py-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                            <span>{language === "vi" ? "GỌI..." : "CALL..."}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCallDossierId(null);
                                window.dispatchEvent(new CustomEvent("yeastar-hangup"));
                              }}
                              className="hover:underline text-red-600 dark:text-red-400 font-bold cursor-pointer ml-1"
                            >
                              [X]
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const phoneNum = row.clientPhone || "0984441771";
                              setActiveCallDossierId(row.id);
                              window.dispatchEvent(new CustomEvent("yeastar-call", { 
                                detail: { phone: phoneNum, name: row.client || "Khách hàng", dossierId: row.id } 
                              }));
                            }}
                            className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
                              isSelected
                                ? "bg-white text-[#1d3557] hover:bg-white/95"
                                : "bg-[#1d3557] hover:bg-[#1d3557]/90 text-white"
                            }`}
                          >
                            <Phone size={11} className="fill-current" />
                            <span>{language === "vi" ? "GỌI ĐIỆN" : "CALL"}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 18. Thao tác action buttons (Sticky) */}
                    <td className={`py-3.5 px-3 text-center sticky right-0 ${stickyClass} z-10 border-l border-slate-200 dark:border-slate-800`}>
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDetailClick(row, e)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? "bg-white text-emerald-700 hover:bg-white/90"
                              : "bg-sky-500 hover:bg-sky-600 text-white"
                          }`}
                          title={language === "vi" ? "Chi tiết" : "Detail"}
                        >
                          <Eye size={11} />
                          <span>{language === "vi" ? "Chi tiết" : "Detail"}</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditClick) onEditClick(row);
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400"
                              : "bg-amber-500 hover:bg-amber-600 text-white"
                          }`}
                          title={language === "vi" ? "Sửa" : "Edit"}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>{language === "vi" ? "Sửa" : "Edit"}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteClick) onDeleteClick(row.id, e);
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? "bg-red-700 hover:bg-red-800 text-white border border-red-500"
                              : "bg-rose-600 hover:bg-rose-700 text-white"
                          }`}
                          title={language === "vi" ? "Xóa" : "Delete"}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>{language === "vi" ? "Xóa" : "Delete"}</span>
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
  );
};
