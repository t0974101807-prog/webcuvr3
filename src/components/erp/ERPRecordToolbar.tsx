import React from "react";
import { Search } from "lucide-react";

export type ERPRecordToolbarProps = {
  language: "vi" | "en";
  t: any;
  selectedSortBy: string;
  setSelectedSortBy: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

export default function ERPRecordToolbar({
  language,
  t,
  selectedSortBy,
  setSelectedSortBy,
  searchQuery,
  setSearchQuery,
}: ERPRecordToolbarProps) {
  return (
    <>
      <select
        value={selectedSortBy}
        onChange={(e) => setSelectedSortBy(e.target.value)}
        className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] max-w-[150px] truncate"
      >
        <option value="newest">
          {language === "vi" ? "Sắp xếp: Mới nhất" : "Sort: Newest"}
        </option>
        <option value="oldest">
          {language === "vi" ? "Sắp xếp: Cũ nhất" : "Sort: Oldest"}
        </option>
        <option value="deadline">
          {language === "vi" ? "Sắp xếp: Đến hạn" : "Sort: Deadline"}
        </option>
      </select>

      <div className="relative min-w-[200px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.search}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
    </>
  );
}
