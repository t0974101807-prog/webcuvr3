import React from "react";

interface FilterOption {
  value: string;
  labelVi: string;
  labelEn: string;
}

interface FilterPanelProps {
  labelVi: string;
  labelEn: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  language: "vi" | "en";
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  labelVi,
  labelEn,
  value,
  onChange,
  options,
  language,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {language === "vi" ? labelVi : labelEn}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
      >
        <option value="ALL">
          {language === "vi" ? "Tất cả" : "All"}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {language === "vi" ? opt.labelVi : opt.labelEn}
          </option>
        ))}
      </select>
    </div>
  );
};
