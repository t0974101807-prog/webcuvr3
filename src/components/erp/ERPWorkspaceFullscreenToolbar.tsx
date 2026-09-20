import React from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface ERPWorkspaceFullscreenToolbarProps {
  isFullscreen: boolean;
  language: "vi" | "en";
  title: string;
  onToggle: () => void;
}

export default function ERPWorkspaceFullscreenToolbar({
  isFullscreen,
  language,
  title,
  onToggle,
}: ERPWorkspaceFullscreenToolbarProps) {
  if (isFullscreen) {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-850 shrink-0">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {language === "vi"
              ? "Chế độ xem toàn màn hình - Cuộn để xem toàn bộ thông tin hệ thống"
              : "Fullscreen View - Scroll to inspect all system metrics"}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          <Minimize2 size={14} />
          <span>{language === "vi" ? "Thu nhỏ" : "Minimize"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border border-slate-200/50 dark:border-slate-700"
        title={language === "vi" ? "Toàn màn hình" : "Fullscreen"}
      >
        <Maximize2 size={13} />
        <span>{language === "vi" ? "Toàn màn hình" : "Fullscreen"}</span>
      </button>
    </div>
  );
}
