import React, { useState, useEffect, useMemo } from "react";
import { syncService } from "../../../services/BackgroundSyncService";
import { fetchApi } from "../../../utils/api";
import { RecordItem } from "../repository/SpecializedRecordsRepository";
import { 
  Briefcase, CheckCircle2, Clock, RefreshCw, Radio, Server, Wifi, WifiOff, Lock, Unlock 
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface ModuleConsultantKPIProps {
  records: RecordItem[];
  language: "vi" | "en";
  user: any;
}

export default function ModuleConsultantKPI({ records, language, user }: ModuleConsultantKPIProps) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastMetricTimestamp, setLastMetricTimestamp] = useState<string | null>(null);

  const [daysFilter, setDaysFilter] = useState<7 | 30 | 90>(30);
  const [comparePrev, setComparePrev] = useState<boolean>(false);

  // Check if current user is a consultant (chuyên viên tư vấn)
  const isConsultant = useMemo(() => {
    if (!user) return false;
    const roleLower = (user.role || "").toLowerCase();
    const titleLower = (user.title || "").toLowerCase();
    return (
      roleLower.includes("specialist") ||
      roleLower.includes("chuyên viên") ||
      roleLower.includes("tư vấn") ||
      titleLower.includes("chuyên viên") ||
      titleLower.includes("tư vấn")
    );
  }, [user]);

  // Persistent Monthly Goals State
  const [goals, setGoals] = useState<{
    assignedCases: number;
    completionRate: number;
    maxLatency: number;
  }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("consultant_kpi_goals");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved KPI goals:", e);
        }
      }
    }
    return {
      assignedCases: 15,
      completionRate: 80,
      maxLatency: 60,
    };
  });

  const handleGoalChange = (key: 'assignedCases' | 'completionRate' | 'maxLatency', val: number) => {
    if (isConsultant) return;
    const nextGoals = { ...goals, [key]: Math.max(1, val) };
    setGoals(nextGoals);
    if (typeof window !== "undefined") {
      localStorage.setItem("consultant_kpi_goals", JSON.stringify(nextGoals));
    }
  };

  // Filter records to count totals and completions
  const totalAssigned = records.length;
  const completedCount = records.filter(
    (r) => r.status === "Hoàn thành" || r.status === "Completed"
  ).length;
  
  const completionRate = totalAssigned > 0 
    ? Math.round((completedCount / totalAssigned) * 100) 
    : 0;

  // Generate date-range data ending today
  const chartData = useMemo(() => {
    const dataPoints: any[] = [];
    const today = new Date();

    for (let i = daysFilter - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      // Calculate active records and completed records up to this date
      const activeUpToDate = records.filter(r => r.date <= dateStr);
      const completedUpToDate = activeUpToDate.filter(
        r => r.status === "Hoàn thành" || r.status === "Completed"
      );
      
      let rate = 0;
      if (activeUpToDate.length > 0) {
        rate = Math.round((completedUpToDate.length / activeUpToDate.length) * 100);
      }

      // Calculate previous period value (shift by daysFilter)
      const prevD = new Date(today);
      prevD.setDate(today.getDate() - i - daysFilter);
      const prevDateStr = prevD.toISOString().split("T")[0];

      const prevActiveUpToDate = records.filter(r => r.date <= prevDateStr);
      const prevCompletedUpToDate = prevActiveUpToDate.filter(
        r => r.status === "Hoàn thành" || r.status === "Completed"
      );

      let prevRate = 0;
      if (prevActiveUpToDate.length > 0) {
        prevRate = Math.round((prevCompletedUpToDate.length / prevActiveUpToDate.length) * 100);
      }

      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const formattedLabel = `${day}/${month}`;

      dataPoints.push({
        date: dateStr,
        label: formattedLabel,
        "Tỷ lệ hoàn thành": rate,
        "Completion Rate": rate,
        "Tỷ lệ kỳ trước": prevRate,
        "Prev Completion Rate": prevRate,
      });
    }
    return dataPoints;
  }, [records, daysFilter]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      let displayDate = data.date;
      try {
        const parts = data.date.split("-");
        if (parts.length === 3) {
          displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      } catch (e) {}

      return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-3 rounded-xl shadow-lg space-y-2 min-w-[170px] pointer-events-none">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {language === "vi" ? `Ngày ${displayDate}` : `Date: ${displayDate}`}
          </div>
          <div className="space-y-1.5">
            {payload.map((item: any, idx: number) => {
              const isCurrent = item.dataKey === "Tỷ lệ hoàn thành" || item.dataKey === "Completion Rate";
              const labelText = isCurrent 
                ? (language === "vi" ? "Kỳ này" : "Current Period")
                : (language === "vi" ? "Kỳ trước" : "Previous Period");
              const dotColor = isCurrent ? "bg-emerald-500" : "bg-indigo-500";
              const textColor = isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400";
              
              return (
                <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className="font-semibold">{labelText}</span>
                  </div>
                  <span className={`font-extrabold ${textColor}`}>
                    {item.value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Track online status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Update pending queue count periodically
  useEffect(() => {
    const updateQueue = () => {
      setPendingCount(syncService.getPendingCount());
    };
    
    updateQueue();
    const interval = setInterval(updateQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch performance metrics from SQLite to calculate average response time
  const fetchMetricsData = async () => {
    try {
      const res = await fetchApi("/api/system/metrics");
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        // Filter voip_call_latency or page_load_duration
        const latencyMetrics = json.data.filter(
          (m: any) => m.metric_type === "voip_call_latency" || m.metric_type === "call_decline_latency"
        );
        
        if (latencyMetrics.length > 0) {
          const sum = latencyMetrics.reduce((acc: number, cur: any) => acc + (Number(cur.value) || 0), 0);
          setAvgResponseTime(Math.round(sum / latencyMetrics.length));
          setLastMetricTimestamp(latencyMetrics[0].timestamp);
        } else {
          // Fallback static value if no metrics in database yet
          setAvgResponseTime(45); // default 45ms
        }
      }
    } catch (err) {
      console.error("Failed to fetch system metrics for KPI:", err);
      setAvgResponseTime(45);
    }
  };

  useEffect(() => {
    fetchMetricsData();
    const interval = setInterval(fetchMetricsData, 10000); // refresh metrics every 10s
    return () => clearInterval(interval);
  }, []);

  // Trigger manual sync
  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncService.flushQueue();
      // Wait brief moment for animation feedback
      await new Promise((resolve) => setTimeout(resolve, 800));
      setPendingCount(syncService.getPendingCount());
      await fetchMetricsData();
    } catch (e) {
      console.error("Manual sync flush failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Section Title */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {language === "vi" ? "Chỉ số hiệu suất thời gian thực" : "Real-time KPI & System Performance"}
          </h3>
        </div>

        {/* Sync Service Widget */}
        <div className="flex items-center gap-3">
          {/* Network status */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {isOnline ? (
              <>
                <Wifi size={12} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Offline</span>
              </>
            )}
          </div>

          <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-800" />

          {/* Sync Trigger button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition duration-200 cursor-pointer ${
              pendingCount > 0 
                ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse" 
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <RefreshCw size={11} className={`${isSyncing ? "animate-spin" : ""}`} />
            <span>
              {pendingCount > 0 
                ? `${language === "vi" ? "Đồng bộ" : "Sync Now"} (${pendingCount})` 
                : language === "vi" ? "Đồng bộ hóa" : "Synced"}
            </span>
          </button>
        </div>
      </div>

      {/* Monthly Goals Configuration Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {language === "vi" ? "Mục tiêu hiệu suất tháng" : "Monthly Performance Goals"}
              </h4>
              {isConsultant ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  <Lock size={10} />
                  <span>{language === "vi" ? "Chỉ Xem (Chỉ Admin/Quản lý sửa)" : "Read-Only (Manager Restricted)"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  <Unlock size={10} />
                  <span>{language === "vi" ? "Quản trị: Được sửa đổi" : "Admin Mode: Editable"}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isConsultant 
                ? (language === "vi" 
                    ? "Mục tiêu hiệu suất của chuyên viên được chỉ định bởi Ban Quản lý chi nhánh." 
                    : "Your monthly performance goals are designated by Branch Management.")
                : (language === "vi" 
                    ? "Thiết lập mục tiêu hiệu suất tháng để so sánh và theo dõi tiến độ qua các thanh trạng thái." 
                    : "Configure monthly targets to track real-time progress via dedicated completion bars.")}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Target Assigned Cases */}
            <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-xs ${isConsultant ? "opacity-90 select-none" : ""}`}>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {language === "vi" ? "Mục tiêu hồ sơ:" : "Assigned Cases Goal:"}
              </span>
              <input
                type="number"
                min="1"
                max="999"
                value={goals.assignedCases}
                onChange={(e) => handleGoalChange("assignedCases", Number(e.target.value))}
                disabled={isConsultant}
                className="w-12 text-center text-xs font-extrabold text-slate-800 dark:text-slate-100 bg-transparent border-0 p-0 focus:ring-0 focus:outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Target Completion Rate */}
            <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-xs ${isConsultant ? "opacity-90 select-none" : ""}`}>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {language === "vi" ? "Tỷ lệ tối thiểu:" : "Min Rate Goal:"}
              </span>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={goals.completionRate}
                  onChange={(e) => handleGoalChange("completionRate", Number(e.target.value))}
                  disabled={isConsultant}
                  className="w-10 text-center text-xs font-extrabold text-slate-800 dark:text-slate-100 bg-transparent border-0 p-0 focus:ring-0 focus:outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
                <span className="text-xs font-semibold text-slate-400">%</span>
              </div>
            </div>

            {/* Target Max Latency */}
            <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 shadow-xs ${isConsultant ? "opacity-90 select-none" : ""}`}>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {language === "vi" ? "Độ trễ tối đa:" : "Max Latency Goal:"}
              </span>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min="10"
                  max="9999"
                  value={goals.maxLatency}
                  onChange={(e) => handleGoalChange("maxLatency", Number(e.target.value))}
                  disabled={isConsultant}
                  className="w-12 text-center text-xs font-extrabold text-slate-800 dark:text-slate-100 bg-transparent border-0 p-0 focus:ring-0 focus:outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
                <span className="text-xs font-semibold text-slate-400">ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Assigned Files Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 min-h-[125px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === "vi" ? "Tổng hồ sơ được giao" : "Total Assigned Files"}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {totalAssigned}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {language === "vi" ? "vụ việc" : "cases"}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Briefcase size={18} />
            </div>
          </div>
          {/* Progress bar towards goal */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.round((totalAssigned / goals.assignedCases) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>{language === "vi" ? `Đạt ${Math.round((totalAssigned / goals.assignedCases) * 100)}% mục tiêu` : `${Math.round((totalAssigned / goals.assignedCases) * 100)}% of target`}</span>
              <span>{goals.assignedCases} {language === "vi" ? "mục tiêu" : "goal"}</span>
            </div>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 min-h-[125px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === "vi" ? "Tỷ lệ hoàn thành" : "Completion Rate"}
              </p>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {completionRate}%
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          {/* Progress bar towards goal */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>{language === "vi" ? `Mục tiêu: ${goals.completionRate}%` : `Goal: ${goals.completionRate}%`}</span>
              <span className={completionRate >= goals.completionRate ? "text-emerald-500 font-bold" : "text-amber-500 font-semibold"}>
                {completionRate >= goals.completionRate 
                  ? (language === "vi" ? "Đạt chỉ tiêu" : "Goal Met") 
                  : `${Math.round((completionRate / goals.completionRate) * 100)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Average Response Time Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 min-h-[125px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {language === "vi" ? "Độ trễ phản hồi VoIP" : "Average Response Time"}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {avgResponseTime}
                </span>
                <span className="text-xs font-bold text-slate-500">ms</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  avgResponseTime <= goals.maxLatency 
                    ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" 
                    : "text-rose-500 bg-rose-50 dark:bg-rose-500/10 animate-pulse"
                }`}>
                  {avgResponseTime <= goals.maxLatency ? "Compliant" : "Over Target"}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock size={18} />
            </div>
          </div>
          {/* Progress bar towards latency limit */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  avgResponseTime <= goals.maxLatency ? "bg-indigo-500" : "bg-rose-500"
                }`} 
                style={{ width: `${Math.min(100, Math.round((avgResponseTime / goals.maxLatency) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>{language === "vi" ? `Tối đa mục tiêu: ${goals.maxLatency}ms` : `Max Goal Limit: ${goals.maxLatency}ms`}</span>
              <span className={avgResponseTime <= goals.maxLatency ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                {Math.round((avgResponseTime / goals.maxLatency) * 100)}% {language === "vi" ? "ngưỡng" : "budget"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Date-Range Filterable Completion Rate Trend Area Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {language === "vi" 
                ? `Xu hướng tỷ lệ hoàn thành (${daysFilter} ngày)` 
                : `Completion Rate Trend (Last ${daysFilter} Days)`}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === "vi" ? "Đo lường tiến độ giải quyết hồ sơ pháp lý theo thời gian thực" : "Real-time tracking of active vs completed legal case files"}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Previous Period Comparison Toggle */}
            <button
              onClick={() => setComparePrev(!comparePrev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition duration-200 border cursor-pointer ${
                comparePrev 
                  ? "bg-indigo-50 dark:bg-indigo-950/25 border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400" 
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${comparePrev ? "bg-indigo-500 animate-pulse" : "bg-slate-400 dark:bg-slate-600"}`} />
              <span>
                {language === "vi" ? "So sánh kỳ trước" : "Compare Previous"}
              </span>
            </button>

            {/* Elegant 7, 30, 90 day toggles */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setDaysFilter(days)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-200 ${
                    daysFilter === days
                      ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/40 dark:border-slate-800/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {days === 7 ? (language === "vi" ? "7 ngày" : "7 Days") : ""}
                  {days === 30 ? (language === "vi" ? "30 ngày" : "30 Days") : ""}
                  {days === 90 ? (language === "vi" ? "90 ngày" : "90 Days") : ""}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {language === "vi" ? "Kỳ này" : "Current"} (%)
                </span>
              </div>
              {comparePrev && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-indigo-500 border-t-2 border-dashed border-indigo-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {language === "vi" ? "Kỳ trước" : "Previous"} (%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/40" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 9, fontWeight: 600 }}
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 9, fontWeight: 600 }}
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={language === "vi" ? "Tỷ lệ hoàn thành" : "Completion Rate"} 
                stroke="#10b981" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorRate)" 
              />
              {comparePrev && (
                <Area 
                  type="monotone" 
                  dataKey={language === "vi" ? "Tỷ lệ kỳ trước" : "Prev Completion Rate"} 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  fill="none" 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
