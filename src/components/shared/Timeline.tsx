import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export interface TimelineEvent {
  id: string;
  titleVi: string;
  titleEn: string;
  date: string;
  descriptionVi?: string;
  descriptionEn?: string;
  icon?: React.ComponentType<any>;
  badgeVi?: string;
  badgeEn?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  language: "vi" | "en";
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  language,
  className,
}) => {
  return (
    <div className={cn("relative border-l border-slate-100 dark:border-slate-800 ml-3 pl-6 space-y-6 py-2", className)}>
      {events.map((evt, idx) => {
        const IconComponent = evt.icon;
        return (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            key={evt.id || idx}
            className="relative"
          >
            {/* Timeline node */}
            <span className="absolute -left-[31px] top-1 flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-[var(--color-primary)] dark:border-[var(--color-accent)] shadow-xs">
              {IconComponent ? (
                <IconComponent className="w-2.5 h-2.5 text-[var(--color-primary)] dark:text-[var(--color-accent)]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] dark:bg-[var(--color-accent)]" />
              )}
            </span>

            {/* Event Content */}
            <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100/70 dark:border-slate-800/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {language === "vi" ? evt.titleVi : evt.titleEn}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {evt.date}
                </span>
              </div>
              
              {(evt.descriptionVi || evt.descriptionEn) && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {language === "vi" ? evt.descriptionVi : evt.descriptionEn}
                </p>
              )}

              {(evt.badgeVi || evt.badgeEn) && (
                <div className="mt-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[var(--color-primary)]/10 dark:bg-[var(--color-accent)]/10 text-[var(--color-primary)] dark:text-[var(--color-accent)] border border-[var(--color-primary)]/10 dark:border-[var(--color-accent)]/10">
                    {language === "vi" ? evt.badgeVi : evt.badgeEn}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
