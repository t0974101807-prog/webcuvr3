import React from "react";

export type ERPRecordStatusBarProps = {
  language: "vi" | "en";
  t: any;
  activeTab: string;
  setActiveTab: (value: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  filteredRecordsLength: number;
};

export default function ERPRecordStatusBar({
  language,
  t,
  activeTab,
  setActiveTab,
  itemsPerPage,
  setItemsPerPage,
  filteredRecordsLength,
}: ERPRecordStatusBarProps) {
  const tabs = ["all", "Tiếp nhận", "Chờ tài liệu", "Đang xử lý", "Hoàn thành", "overdue"];

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar custom-scrollbar touch-pan-x">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 active:scale-95",
              activeTab === tab
                ? tab === "overdue"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#9333ea] bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide text-white shadow-sm"
                : tab === "overdue"
                  ? "bg-white text-red-600 border border-red-200 transition-all duration-300 hover:bg-red-50"
                  : "bg-white text-gray-600 border border-gray-200 transition-all duration-300 hover:bg-gray-50",
            ].join(" ")}
          >
            {tab === "all"
              ? t.allStatuses
              : tab === "overdue"
                ? language === "vi"
                  ? "Quá hạn"
                  : "Overdue"
                : tab}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 w-full md:w-auto md:mt-0">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{language === "vi" ? "Xem" : "Show"}</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>{t.items}</span>
        </div>
        <div className="ml-6 text-sm text-gray-600">
          {language === "vi" ? "Tổng số:" : "Total:"}{" "}
          <span className="font-bold text-[var(--color-text-dark)]">{filteredRecordsLength}</span>{" "}
          {t.records}
        </div>
      </div>
    </div>
  );
}
