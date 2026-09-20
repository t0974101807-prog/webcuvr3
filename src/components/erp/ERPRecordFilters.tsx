import React from "react";
import { clsx } from "clsx";

export type ERPRecordFiltersProps = {
  language: "vi" | "en";
  t: any;
  selectedAssignee: string;
  setSelectedAssignee: (value: string) => void;
  selectedBranch: string;
  setSelectedBranch: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedPriority: string;
  setSelectedPriority: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  uniqueAssignees: string[];
  dynamicBranchOptions: string[];
  STATUS_OPTIONS: string[];
  globalRecordTypes: any[];
};

export default function ERPRecordFilters({
  language,
  t,
  selectedAssignee,
  setSelectedAssignee,
  selectedBranch,
  setSelectedBranch,
  selectedStatus,
  setSelectedStatus,
  selectedPriority,
  setSelectedPriority,
  selectedCategory,
  setSelectedCategory,
  uniqueAssignees,
  dynamicBranchOptions,
  STATUS_OPTIONS,
  globalRecordTypes,
}: ERPRecordFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={selectedAssignee}
        onChange={(e) => setSelectedAssignee(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] max-w-[150px] truncate"
      >
        <option value="">
          {language === "vi" ? "Người phụ trách" : "Assignee"}
        </option>
        {uniqueAssignees.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <select
        value={selectedBranch}
        onChange={(e) => setSelectedBranch(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <option value="">{t.selectBranch}</option>
        {dynamicBranchOptions.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] max-w-[150px] truncate"
      >
        <option value="">
          {language === "vi" ? "Trạng thái" : "Status"}
        </option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <select
        value={selectedPriority}
        onChange={(e) => setSelectedPriority(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] max-w-[150px] truncate"
      >
        <option value="">
          {language === "vi" ? "Mức độ" : "Priority"}
        </option>
        {["Bình thường", "Gấp", "Rất gấp"].map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <option value="">{t.selectCategory}</option>
        {globalRecordTypes && globalRecordTypes.length > 0 ? (
          globalRecordTypes.map((rt: any, idx) => (
            <option key={idx} value={rt.type_name}>
              {rt.type_name}
            </option>
          ))
        ) : (
          <>
            <option value="Tư vấn">Tư vấn</option>
            <option value="Hình sự">Hình sự</option>
            <option value="Dân sự">Dân sự</option>
            <option value="Đất đai">Đất đai</option>
          </>
        )}
      </select>
    </div>
  );
}
