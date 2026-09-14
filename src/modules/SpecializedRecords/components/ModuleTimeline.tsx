import React from "react";
import { X, Calendar } from "lucide-react";
import { Timeline, TimelineEvent } from "../../../components/shared/Timeline";
import { RecordItem } from "../repository/SpecializedRecordsRepository";
import { SpecializedRecordsService } from "../services/SpecializedRecordsService";

interface ModuleTimelineProps {
  record: RecordItem | null;
  language: "vi" | "en";
  onClose: () => void;
}

export const ModuleTimeline: React.FC<ModuleTimelineProps> = ({
  record,
  language,
  onClose,
}) => {
  if (!record) return null;

  const events: TimelineEvent[] = SpecializedRecordsService.getMockTimelineEvents(record);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[90] flex flex-col border-l border-slate-100 dark:border-slate-800 animate-in slide-in-from-right duration-300">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
          <Calendar size={16} className="text-[var(--color-primary)] dark:text-[var(--color-accent)]" />
          <span>{language === "vi" ? "Lịch trình hồ sơ chuyên môn" : "Specialized Dossier Timeline"}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div>
          <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{record.title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === "vi" ? "Khách hàng" : "Client"}: <span className="font-semibold text-slate-700 dark:text-slate-300">{record.client}</span>
          </p>
          {record.description && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-slate-800/50 leading-relaxed italic">
              "{record.description}"
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <Timeline events={events} language={language} />
        </div>
      </div>
    </div>
  );
};
