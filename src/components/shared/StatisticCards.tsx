import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export interface StatCardItem {
  id: string;
  labelVi: string;
  labelEn: string;
  value: string | number;
  icon?: LucideIcon | React.ComponentType<any>;
  colorClass?: string;
  bgColorClass?: string;
}

interface StatisticCardsProps {
  stats: StatCardItem[];
  language: "vi" | "en";
}

export const StatisticCards: React.FC<StatisticCardsProps> = ({
  stats,
  language,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            key={stat.id || idx}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between card-hover-effect"
          >
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                {language === "vi" ? stat.labelVi : stat.labelEn}
              </p>
              <p className={cn("text-2xl font-extrabold text-slate-900 dark:text-slate-100", stat.colorClass)}>
                {stat.value}
              </p>
            </div>
            {IconComponent && (
              <div className={cn("p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50", stat.bgColorClass)}>
                <IconComponent className={cn("w-5 h-5", stat.colorClass || "text-slate-500")} />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
