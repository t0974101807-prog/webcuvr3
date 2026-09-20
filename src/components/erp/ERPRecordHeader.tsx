import React from "react";
import {
  LayoutDashboard,
  Menu,
  Trello,
  Briefcase,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Camera,
} from "lucide-react";

export type ERPRecordHeaderProps = {
  language: "vi" | "en";
  t: any;
  viewMode: "grid" | "list" | "kanban" | "admin";
  setViewMode: (mode: "grid" | "list" | "kanban" | "admin") => void;
  canViewAll: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleExport: () => void;
  handleExportCSV: () => void;
  records: any[];
  setEditingRecord: (record: any) => void;
  setFormData: (data: any) => void;
  setShowAddRecord: (value: boolean) => void;
  setShowCccdScanner: (value: boolean) => void;
};

export default function ERPRecordHeader({
  language,
  t,
  viewMode,
  setViewMode,
  canViewAll,
  fileInputRef,
  handleImport,
  handleExport,
  handleExportCSV,
  records,
  setEditingRecord,
  setFormData,
  setShowAddRecord,
  setShowCccdScanner,
}: ERPRecordHeaderProps) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-4">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-dark)] font-serif">
          {language === "vi" ? "Danh sách hồ sơ" : "Records List"}
        </h2>
        <p className="text-gray-600 text-sm">
          {(() => {
            const daysVi = [
              "Chủ Nhật",
              "Thứ Hai",
              "Thứ Ba",
              "Thứ Tư",
              "Thứ Năm",
              "Thứ Sáu",
              "Thứ Bảy",
            ];
            const daysEn = [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ];
            const date = new Date();
            const dayName = language === "vi" ? daysVi[date.getDay()] : daysEn[date.getDay()];
            const dd = String(date.getDate()).padStart(2, "0");
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const yyyy = date.getFullYear();
            return `${dayName}, ${dd}/${mm}/${yyyy}`;
          })()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 border-r border-slate-200 transition-all duration-300 active:scale-95 ${
              viewMode === "grid"
                ? "bg-slate-100 text-slate-800"
                : "bg-slate-50 text-slate-400 hover:text-slate-600"
            }`}
          >
            <LayoutDashboard size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 border-r border-slate-200 transition-all duration-300 active:scale-95 ${
              viewMode === "list"
                ? "bg-slate-100 text-slate-800"
                : "bg-slate-50 text-slate-400 hover:text-slate-600"
            }`}
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-2 transition-all duration-300 active:scale-95 ${
              viewMode === "kanban"
                ? "bg-slate-100 text-slate-800"
                : "bg-slate-50 text-slate-400 hover:text-slate-600"
            }`}
            title="Kanban"
          >
            <Trello size={18} />
          </button>
          {canViewAll && (
            <button
              onClick={() => setViewMode("admin")}
              className={`p-2 border-l border-slate-200 transition-all duration-300 active:scale-95 ${
                viewMode === "admin"
                  ? "bg-slate-100 text-slate-800"
                  : "bg-slate-50 text-slate-400 hover:text-slate-600"
              }`}
              title={language === "vi" ? "Góc nhìn quản trị" : "Admin View"}
            >
              <Briefcase size={18} />
            </button>
          )}
        </div>

        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#10b981] via-[#14b8a6] to-[#059669] bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide text-white rounded-lg font-medium transition-all duration-300 active:scale-95"
        >
          <Download size={18} className="rotate-180" />
          <span className="hidden sm:inline">{t.importExcel}</span>
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide text-white rounded-lg font-medium transition-all duration-300 active:scale-95"
          title={language === "vi" ? "Xuất Excel" : "Export Excel"}
        >
          <FileSpreadsheet size={16} />
          <span className="hidden sm:inline">{language === "vi" ? "Xuất Excel" : "Export Excel"}</span>
        </button>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700 bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide text-white rounded-lg font-medium transition-all duration-300 active:scale-95"
          title={language === "vi" ? "Xuất CSV" : "Export CSV"}
        >
          <FileText size={16} />
          <span className="hidden sm:inline">{language === "vi" ? "Xuất CSV" : "Export CSV"}</span>
        </button>

        <button
          onClick={() => {
            setEditingRecord(null);
            const year = new Date().getFullYear();
            const stt = String(records.length + 1).padStart(3, "0");
            setFormData({
              id: `HS-${year}-${stt}`,
              systemId: Math.floor(Math.random() * 1000000000)
                .toString()
                .padStart(9, "0"),
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
            setShowAddRecord(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#9333ea] bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide text-white rounded-lg font-medium transition-all duration-300 active:scale-95"
        >
          <Plus size={18} />
          {t.addRecord}
        </button>

        <button
          onClick={() => setShowCccdScanner(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-700 bg-[length:200%_200%] shadow-md hover:opacity-90 tracking-wide text-white rounded-lg font-medium transition-all duration-300 active:scale-95 animate-gradient"
        >
          <Camera size={18} />
          {language === "vi" ? "Quét CCCD Thêm Hồ Sơ" : "Scan ID Card for New Dossier"}
        </button>
      </div>
    </div>
  );
}
