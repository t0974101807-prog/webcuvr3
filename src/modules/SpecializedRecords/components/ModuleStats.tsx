import React from "react";
import { Briefcase, Clock, CheckCircle2, Coins } from "lucide-react";
import { StatisticCards, StatCardItem } from "../../../components/shared/StatisticCards";
import { SpecializedRecordsService } from "../services/SpecializedRecordsService";
import { RecordItem } from "../repository/SpecializedRecordsRepository";

interface ModuleStatsProps {
  records: RecordItem[];
  language: "vi" | "en";
}

export const ModuleStats: React.FC<ModuleStatsProps> = ({ records, language }) => {
  const metrics = SpecializedRecordsService.calculateStats(records);

  const statsList: StatCardItem[] = [
    {
      id: "total",
      labelVi: "TỔNG SỐ HỒ SƠ",
      labelEn: "TOTAL DOSSIERS",
      value: metrics.totalCount,
      icon: Briefcase,
      colorClass: "text-slate-900 dark:text-slate-100",
      bgColorClass: "bg-slate-50 dark:bg-slate-800",
    },
    {
      id: "processing",
      labelVi: "ĐANG THỰC HIỆN",
      labelEn: "IN PROGRESS",
      value: metrics.inProgressCount,
      icon: Clock,
      colorClass: "text-blue-600 dark:text-blue-400",
      bgColorClass: "bg-blue-50/50 dark:bg-blue-500/10",
    },
    {
      id: "completed",
      labelVi: "ĐẠT HOÀN THÀNH",
      labelEn: "COMPLETED",
      value: metrics.completedCount,
      icon: CheckCircle2,
      colorClass: "text-emerald-600 dark:text-emerald-400",
      bgColorClass: "bg-emerald-50/50 dark:bg-emerald-500/10",
    },
    {
      id: "revenue",
      labelVi: "TỔNG PHÍ DỊCH VỤ",
      labelEn: "REVENUE",
      value: `${metrics.totalRevenue.toLocaleString("vi-VN")} VND`,
      icon: Coins,
      colorClass: "text-slate-900 dark:text-slate-100 font-bold",
      bgColorClass: "bg-amber-50/50 dark:bg-amber-500/10",
    },
  ];

  return <StatisticCards stats={statsList} language={language} />;
};
