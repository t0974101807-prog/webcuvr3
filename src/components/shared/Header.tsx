import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface ActionConfig {
  labelVi: string;
  labelEn: string;
  icon?: LucideIcon | React.ComponentType<any>;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
}

interface HeaderProps {
  titleVi: string;
  titleEn: string;
  descriptionVi?: string;
  descriptionEn?: string;
  icon?: LucideIcon | React.ComponentType<any>;
  actions?: ActionConfig[];
  language: "vi" | "en";
}

export const Header: React.FC<HeaderProps> = ({
  titleVi,
  titleEn,
  descriptionVi,
  descriptionEn,
  icon: IconComponent,
  actions = [],
  language,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        {IconComponent && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-[var(--color-primary)] dark:text-[var(--color-accent)] shrink-0 mt-0.5">
            <IconComponent size={20} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {!IconComponent && (
              <span className="w-2 h-6 bg-[var(--color-primary)] dark:bg-[var(--color-accent)] rounded-full inline-block"></span>
            )}
            {language === "vi" ? titleVi : titleEn}
          </h1>
          {(descriptionVi || descriptionEn) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {language === "vi" ? descriptionVi : descriptionEn}
            </p>
          )}
        </div>
      </div>
      
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions.map((act, index) => {
            const ActIcon = act.icon;
            const isPrimary = act.variant === "primary" || !act.variant;
            const isSecondary = act.variant === "secondary";
            const isSuccess = act.variant === "success";
            const isDanger = act.variant === "danger";

            return (
              <button
                key={index}
                onClick={act.onClick}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-xs cursor-pointer",
                  isPrimary && "bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white dark:bg-[var(--color-accent)] dark:hover:bg-[var(--color-accent-hover)] dark:text-slate-950",
                  isSecondary && "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200",
                  isSuccess && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20",
                  isDanger && "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20"
                )}
              >
                {ActIcon && <ActIcon size={16} />}
                <span>{language === "vi" ? act.labelVi : act.labelEn}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
