import React, { useState, useMemo } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ColumnConfig<T> {
  key: string;
  headerVi: string;
  headerEn: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  language: "vi" | "en";
  pageSize?: number;
  emptyTextVi?: string;
  emptyTextEn?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  language,
  pageSize = 10,
  emptyTextVi = "Không tìm thấy dữ liệu phù hợp.",
  emptyTextEn = "No matching records found.",
  onRowClick,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const sorted = [...data];
    return sorted.sort((a: any, b: any) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      const strA = (valA || "").toString().toLowerCase();
      const strB = (valB || "").toString().toLowerCase();
      return sortDirection === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [data, sortKey, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "py-4 px-6 select-none",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer font-bold uppercase tracking-widest"
                    >
                      <span>{language === "vi" ? col.headerVi : col.headerEn}</span>
                      <ArrowUpDown size={10} />
                    </button>
                  ) : (
                    <span>{language === "vi" ? col.headerVi : col.headerEn}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Inbox className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">
                    {language === "vi" ? emptyTextVi : emptyTextEn}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition border-slate-100 dark:border-slate-800",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "py-4 px-6 text-slate-700 dark:text-slate-300",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center"
                      )}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key] || "---"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === "vi"
              ? `Hiển thị ${(currentPage - 1) * pageSize + 1}-${Math.min(
                  currentPage * pageSize,
                  data.length
                )} trong tổng số ${data.length} dòng`
              : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(
                  currentPage * pageSize,
                  data.length
                )} of ${data.length} records`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
