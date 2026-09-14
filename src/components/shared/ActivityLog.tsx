import React from "react";
import { Clock, User } from "lucide-react";
import { cn } from "../../lib/utils";

export interface LogItem {
  id: string;
  user: string;
  actionVi: string;
  actionEn: string;
  time: string;
  detailsVi?: string;
  detailsEn?: string;
}

interface ActivityLogProps {
  logs: LogItem[];
  language: "vi" | "en";
  className?: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  logs,
  language,
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {logs.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
          {language === "vi" ? "Chưa có hoạt động nào được ghi lại." : "No activities recorded yet."}
        </div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
          >
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5">
              <Clock size={12} />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-slate-100 mr-1 flex inline-items items-center gap-1">
                  <User size={10} className="inline" /> {log.user}
                </span>
                {language === "vi" ? log.actionVi : log.actionEn}
              </p>
              {(log.detailsVi || log.detailsEn) && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {language === "vi" ? log.detailsVi : log.detailsEn}
                </p>
              )}
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                {log.time}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
