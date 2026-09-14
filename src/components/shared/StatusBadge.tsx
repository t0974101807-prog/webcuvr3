import React from "react";
import { cn } from "../../lib/utils";

interface StatusBadgeProps {
  status: string;
  statusesConfig?: { value: string; labelVi: string; labelEn: string; colorClass: string }[];
  language: "vi" | "en";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  statusesConfig,
  language,
}) => {
  const match = statusesConfig?.find((s) => s.value === status);
  if (match) {
    return (
      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold border", match.colorClass)}>
        {language === "vi" ? match.labelVi : match.labelEn}
      </span>
    );
  }

  // Fallback for standard statuses
  let colorClass = "bg-slate-50 text-slate-700 border-slate-200";
  if (status === "Hoàn thành" || status === "Completed" || status === "Matched" || status === "Success") {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
  } else if (status === "Đang giải quyết" || status === "In Progress" || status === "Processing" || status === "Pending") {
    colorClass = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
  } else if (status === "Mới tiếp nhận" || status === "New" || status === "Draft") {
    colorClass = "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
  }

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold border", colorClass)}>
      {status}
    </span>
  );
};
