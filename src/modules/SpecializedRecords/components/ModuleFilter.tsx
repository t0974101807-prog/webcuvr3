import React from "react";
import { Search } from "lucide-react";
import { getModuleByActiveTab } from "../../../config/modules";

interface ModuleFilterProps {
  activeModule: string;
  language: "vi" | "en";
  branchFilter: string;
  setBranchFilter: (val: string) => void;
  partnerFilter: string;
  setPartnerFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  courtFilter: string;
  setCourtFilter: (val: string) => void;
  users: any[];
  offices?: any[];
}

export const ModuleFilter: React.FC<ModuleFilterProps> = ({
  activeModule,
  language,
  branchFilter,
  setBranchFilter,
  partnerFilter,
  setPartnerFilter,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  courtFilter,
  setCourtFilter,
  users = [],
  offices = [],
}) => {
  const moduleConfig = getModuleByActiveTab(activeModule);

  // List of partners/staff
  const partners = users.filter((u) => u.role !== "client" && u.name);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border-b border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-3">
      {/* 1. Chọn chi nhánh */}
      <div className="flex flex-col min-w-[140px] flex-1 sm:flex-initial">
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition"
        >
          <option value="ALL">
            {language === "vi" ? "Chọn chi nhánh" : "Choose Branch"}
          </option>
          {offices && offices.length > 0 ? (
            offices.map((off: any) => (
              <option key={off.id} value={off.name}>
                {off.name}
              </option>
            ))
          ) : (
            <>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
            </>
          )}
        </select>
      </div>

      {/* 2. Chọn đối tác */}
      <div className="flex flex-col min-w-[140px] flex-1 sm:flex-initial">
        <select
          value={partnerFilter}
          onChange={(e) => setPartnerFilter(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition"
        >
          <option value="ALL">
            {language === "vi" ? "Chọn đối tác" : "Choose Partner"}
          </option>
          {partners.map((u) => (
            <option key={u.id || u.username} value={u.name}>
              {u.name}
            </option>
          ))}
          {/* Default fallback partners in case user list is empty */}
          {partners.length === 0 && (
            <>
              <option value="Đặng Văn Hùng">Đặng Văn Hùng</option>
              <option value="Nguyễn Thị Mai">Nguyễn Thị Mai</option>
              <option value="Trần Thanh Bình">Trần Thanh Bình</option>
              <option value="Lê Hoàng Quân">Lê Hoàng Quân</option>
            </>
          )}
        </select>
      </div>

      {/* 3. Chọn trạng thái */}
      <div className="flex flex-col min-w-[140px] flex-1 sm:flex-initial">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition"
        >
          <option value="ALL">
            {language === "vi" ? "Chọn trạng thái" : "Choose Status"}
          </option>
          {moduleConfig.statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {language === "vi" ? s.labelVi : s.labelEn}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Chọn thời gian lập */}
      <div className="flex flex-col min-w-[140px] flex-1 sm:flex-initial">
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer transition"
        >
          <option value="ALL">
            {language === "vi" ? "Chọn thời gian lập" : "Choose Date"}
          </option>
          <option value="today">{language === "vi" ? "Hôm nay" : "Today"}</option>
          <option value="yesterday">{language === "vi" ? "Hôm qua" : "Yesterday"}</option>
          <option value="week">{language === "vi" ? "Tuần này" : "This Week"}</option>
          <option value="month">{language === "vi" ? "Tháng này" : "This Month"}</option>
          <option value="quarter">{language === "vi" ? "Quý này" : "This Quarter"}</option>
        </select>
      </div>

      {/* 5. Chọn Tòa Án khu vực */}
      <div className="flex flex-col min-w-[180px] flex-1 sm:flex-initial relative">
        <input
          type="text"
          value={courtFilter}
          onChange={(e) => setCourtFilter(e.target.value)}
          placeholder={language === "vi" ? "Chọn Tòa Án khu vực" : "Select Court Area"}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
        />
        <Search size={12} className="absolute right-2.5 top-2.5 text-slate-400" />
      </div>
    </div>
  );
};
