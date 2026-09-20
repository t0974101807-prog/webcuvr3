import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock3,
  Cloud,
  Eye,
  FileText,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageSquare,
  Newspaper,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Briefcase,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchApi } from "../utils/api";
import DashboardWidget from "./DashboardWidget";

interface CMSControlCenterProps {
  user: any;
  language?: string;
}

type SourceState<T> = { data: T; loading: boolean; error: string | null };

const emptyStats = {
  chartData: [],
  summary: { totalMessages: 0, unreadMessages: 0, totalVisitorsThisMonth: 0, totalPageViewsThisMonth: 0, totalChatsThisMonth: 0 },
  legalServicesPerformance: [],
};

const contentLabels: Record<string, string> = {
  news: "Tin tức",
  services: "Lĩnh vực hoạt động",
  legalServices: "Dịch vụ pháp lý",
  team: "Đội ngũ",
  recruitment: "Tuyển dụng",
};

export default function CMSControlCenter({ language = "vi" }: CMSControlCenterProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SourceState<any>>({ data: emptyStats, loading: true, error: null });
  const [content, setContent] = useState<SourceState<Record<string, any[]>>>({ data: {}, loading: true, error: null });
  const isVi = language === "vi";

  const loadDashboard = async () => {
    setRefreshing(true);
    setStats((current) => ({ ...current, loading: true, error: null }));
    setContent((current) => ({ ...current, loading: true, error: null }));

    const [statsResult, ...contentResults] = await Promise.allSettled([
      fetchApi("/api/stats"),
      ...[
        ["news", "/api/news"],
        ["services", "/api/services"],
        ["legalServices", "/api/legal-services"],
        ["team", "/api/team"],
        ["recruitment", "/api/recruitment"],
      ].map(async ([key, url]) => {
        const response = await fetchApi(url);
        if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : payload.data;
        return [key, Array.isArray(rows) ? rows : []] as const;
      }),
    ]);

    if (statsResult.status === "fulfilled") {
      if (statsResult.value.ok) {
        setStats({ data: await statsResult.value.json(), loading: false, error: null });
      } else {
        setStats({ data: emptyStats, loading: false, error: "Không thể tải dữ liệu thống kê CMS." });
      }
    } else {
      setStats({ data: emptyStats, loading: false, error: "Không thể kết nối nguồn thống kê CMS." });
    }

    const nextContent: Record<string, any[]> = {};
    let contentError = false;
    contentResults.forEach((result) => {
      if (result.status === "fulfilled") nextContent[result.value[0]] = result.value[1];
      else contentError = true;
    });
    setContent({ data: nextContent, loading: false, error: contentError ? "Một số nguồn nội dung chưa tải được." : null });
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = stats.data.summary || emptyStats.summary;
  const chartData = Array.isArray(stats.data.chartData) ? stats.data.chartData : [];
  const recentContent = Object.entries(content.data)
    .flatMap(([type, rows]) => rows.map((row: any) => ({ ...row, contentType: type })))
    .sort((a: any, b: any) => String(b.updated_at || b.created_at || b.date || "").localeCompare(String(a.updated_at || a.created_at || a.date || "")))
    .slice(0, 6);

  const publishedCount = Object.values(content.data).flat().filter((row: any) => {
    const status = String(row.status || row.publish_status || row.state || "").toLowerCase();
    return ["published", "đã xuất bản", "published"].some((value) => status.includes(value));
  }).length;
  const draftCount = Object.values(content.data).flat().filter((row: any) => String(row.status || row.publish_status || row.state || "").toLowerCase().includes("draft")).length;
  const contentTotal = Object.values(content.data).reduce((total, rows) => total + rows.length, 0);
  const publicationRate = contentTotal ? Math.round((publishedCount / contentTotal) * 100) : 0;
  const visitorCount = Number(summary.totalVisitorsThisMonth || 0);
  const pageViewCount = Number(summary.totalPageViewsThisMonth || 0);
  const chatCount = Number(summary.totalChatsThisMonth || 0);
  const engagementRate = visitorCount ? Math.round((chatCount / visitorCount) * 1000) / 10 : 0;
  const getContentStatus = (row: any) => {
    const rawStatus = String(row.status || row.publish_status || row.state || "").toLowerCase();
    if (rawStatus.includes("publish") || rawStatus.includes("xuất bản")) return { label: "Đã xuất bản", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    if (rawStatus.includes("draft") || rawStatus.includes("nháp")) return { label: "Bản nháp", className: "bg-amber-50 text-amber-700 border-amber-100" };
    return { label: row.status || "Đang quản lý", className: "bg-slate-50 text-slate-600 border-slate-200" };
  };
  const formatContentDate = (row: any) => {
    const rawDate = row.updated_at || row.created_at || row.date;
    if (!rawDate) return "Chưa có ngày";
    const date = new Date(rawDate);
    return Number.isNaN(date.getTime()) ? String(rawDate) : date.toLocaleDateString("vi-VN");
  };
  const contentHealth = Object.entries(contentLabels).map(([key, label]) => {
    const rows = content.data[key] || [];
    const published = rows.filter((row: any) => getContentStatus(row).label === "Đã xuất bản").length;
    return { key, label, total: rows.length, published, percentage: rows.length ? Math.round((published / rows.length) * 100) : 0 };
  });
  const workflowChecks = [
    { label: "Nội dung đã xuất bản", value: `${publishedCount}/${contentTotal}`, complete: contentTotal > 0 && publishedCount === contentTotal, icon: CheckCircle2 },
    { label: "Bản nháp cần hoàn thiện", value: draftCount, complete: draftCount === 0, icon: BookOpen },
    { label: "Tin nhắn đang chờ xử lý", value: Number(summary.unreadMessages || 0), complete: Number(summary.unreadMessages || 0) === 0, icon: MessageSquare },
  ];

  const kpis = [
    { label: "Tổng nội dung", value: contentTotal, icon: FileText, tone: "text-slate-900", note: "Từ các nguồn CMS hiện có" },
    { label: "Đã xuất bản", value: publishedCount, icon: CheckCircle2, tone: "text-emerald-700", note: "Theo trạng thái thực tế" },
    { label: "Bản nháp", value: draftCount, icon: BookOpen, tone: "text-amber-700", note: "Cần hoàn thiện nếu có" },
    { label: "Tin nhắn chưa đọc", value: Number(summary.unreadMessages || 0), icon: Bell, tone: "text-rose-700", note: "Từ hệ thống tin nhắn" },
  ];

  const contentCards = Object.entries(contentLabels).map(([key, label]) => ({
    key,
    label,
    count: content.data[key]?.length || 0,
    icon: key === "news" ? Newspaper : key === "team" ? Users : key === "recruitment" ? Briefcase : FileText,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
            <LayoutDashboard size={12} /> CMS Control Center
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Trung tâm điều hành nội dung</h2>
          <p className="text-sm text-slate-600 mt-1">Quản lý nội dung website, xuất bản và tương tác theo dữ liệu thực tế.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
          <button onClick={loadDashboard} disabled={refreshing} className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-xl border border-slate-200" title="Làm mới dữ liệu">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </section>

      {content.error && <SourceNotice tone="warning" text={content.error} />}
      {stats.error && <SourceNotice tone="error" text={stats.error} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, tone, note }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span><Icon size={18} className={tone} /></div>
            <p className={`text-3xl font-black mt-3 ${tone}`}>{content.loading ? "—" : value.toLocaleString("vi-VN")}</p>
            <p className="text-xs text-slate-500 mt-2">{note}</p>
          </div>
        ))}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Tỷ lệ xuất bản", value: `${publicationRate}%`, detail: `${publishedCount} nội dung đã xuất bản`, icon: Target, color: "text-blue-700", bar: "bg-blue-600", progress: publicationRate },
          { label: "Mức tương tác", value: `${engagementRate}%`, detail: `${chatCount.toLocaleString("vi-VN")} chat / ${visitorCount.toLocaleString("vi-VN")} khách`, icon: TrendingUp, color: "text-emerald-700", bar: "bg-emerald-500", progress: Math.min(engagementRate, 100) },
          { label: "Lượt xem mỗi khách", value: visitorCount ? (pageViewCount / visitorCount).toFixed(1) : "0", detail: `${pageViewCount.toLocaleString("vi-VN")} lượt xem trong tháng`, icon: Eye, color: "text-violet-700", bar: "bg-violet-500", progress: Math.min(visitorCount ? (pageViewCount / visitorCount) * 10 : 0, 100) },
        ].map(({ label, value, detail, icon: Icon, color, bar, progress }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span><Icon size={17} className={color} /></div>
            <div className="flex items-end justify-between gap-3 mt-3"><span className={`text-2xl font-black ${color}`}>{stats.loading ? "—" : value}</span><span className="text-[11px] text-slate-500 text-right">{detail}</span></div>
            <div className="h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden"><div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${stats.loading ? 0 : Math.max(0, Math.min(progress, 100))}%` }} /></div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-lg text-slate-900">Lưu lượng website</h3><p className="text-xs text-slate-500 mt-1">Theo dõi khách truy cập, lượt xem và chat theo tháng.</p></div><Cloud size={18} className="text-blue-600" /></div>
          <div className="h-64">
            {chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="cmsVisitors" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient><linearGradient id="cmsViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={0.22} /><stop offset="95%" stopColor="#0f766e" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => String(value).slice(5)} /><YAxis tick={{ fontSize: 10 }} /><Tooltip labelFormatter={(value) => `Ngày ${value}`} formatter={(value: number) => value.toLocaleString("vi-VN")} /><Area type="monotone" dataKey="visitors" name="Khách truy cập" stroke="#2563eb" fill="url(#cmsVisitors)" strokeWidth={2} /><Area type="monotone" dataKey="page_views" name="Lượt xem" stroke="#0f766e" fill="url(#cmsViews)" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-400">Chưa có dữ liệu tracking theo tháng.</div>}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-lg text-slate-900">Sức khỏe nội dung</h3><p className="text-xs text-slate-500 mt-1">Mức hoàn thiện theo từng nhóm CMS.</p></div><Sparkles size={18} className="text-amber-500" /></div>
          <div className="space-y-4">{contentHealth.map(({ key, label, total, published, percentage }) => <div key={key}><div className="flex items-center justify-between mb-1.5"><span className="text-sm font-semibold text-slate-700">{label}</span><span className="text-xs font-bold text-slate-500">{published}/{total}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${percentage >= 80 ? "bg-emerald-500" : percentage > 0 ? "bg-amber-500" : "bg-slate-300"}`} style={{ width: `${percentage}%` }} /></div></div>)}</div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.25fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-lg text-slate-900">Trạng thái vận hành</h3><p className="text-xs text-slate-500 mt-1">Các việc cần kiểm tra trước khi kết thúc ngày.</p></div><ListChecks size={18} className="text-emerald-600" /></div>
          <div className="space-y-2.5">{workflowChecks.map(({ label, value, complete, icon: Icon }) => <div key={label} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${complete ? "bg-emerald-50/60 border-emerald-100" : "bg-amber-50/70 border-amber-100"}`}><div className="flex items-center gap-3"><Icon size={17} className={complete ? "text-emerald-600" : "text-amber-600"} /><span className="text-sm font-semibold text-slate-700">{label}</span></div><span className={`text-sm font-black ${complete ? "text-emerald-700" : "text-amber-700"}`}>{value}</span></div>)}</div>
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3"><ShieldCheck size={17} className="text-blue-600 mt-0.5 shrink-0" /><p className="text-xs leading-relaxed text-slate-600">Dashboard chỉ tổng hợp dữ liệu CMS đã ghi nhận. Các số liệu chưa có nguồn sẽ được hiển thị là 0 hoặc trạng thái trống.</p></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-lg text-slate-900">Dòng nội dung mới nhất</h3><p className="text-xs text-slate-500 mt-1">Theo dõi nhanh bản ghi vừa cập nhật trong CMS.</p></div><ArrowUpRight size={18} className="text-[var(--color-primary)]" /></div>
          {recentContent.length ? <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="pb-2 font-bold">Nội dung</th><th className="pb-2 font-bold">Nhóm</th><th className="pb-2 font-bold">Trạng thái</th><th className="pb-2 font-bold text-right">Ngày</th></tr></thead><tbody>{recentContent.map((item, index) => { const status = getContentStatus(item); return <tr key={`${item.id || index}-detail`} className="border-b last:border-0 border-slate-50"><td className="py-3 pr-3"><div className="max-w-[230px] truncate text-sm font-semibold text-slate-700">{item.title || item.name || "Nội dung không có tiêu đề"}</div></td><td className="py-3 pr-3 text-xs text-slate-500">{contentLabels[item.contentType] || item.contentType}</td><td className="py-3 pr-3"><span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${status.className}`}>{status.label}</span></td><td className="py-3 text-right text-xs text-slate-400 whitespace-nowrap">{formatContentDate(item)}</td></tr>; })}</tbody></table></div> : <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500">Chưa phát sinh nội dung gần đây.</div>}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-lg text-slate-900">Tổng quan nội dung</h3><p className="text-xs text-slate-500 mt-1">Các nhóm nội dung đang được quản lý trong CMS.</p></div><FileText size={18} className="text-[var(--color-primary)]" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contentCards.map(({ key, label, count, icon: Icon }) => <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"><div className="flex items-center gap-3"><Icon size={17} className="text-[var(--color-primary)]" /><span className="text-sm font-semibold text-slate-700">{label}</span></div><span className="font-black text-slate-900">{content.loading ? "—" : count}</span></div>)}
          </div>
        </section>
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"><div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-lg text-slate-900">Công việc cần xử lý</h3><p className="text-xs text-slate-500 mt-1">Tín hiệu thực tế từ CMS.</p></div><Send size={18} className="text-[var(--color-primary)]" /></div>{Number(summary.unreadMessages || 0) > 0 ? <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"><span className="text-sm font-semibold text-slate-700">Tin nhắn chưa đọc</span><span className="font-black text-amber-700">{summary.unreadMessages}</span></div> : <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500">Không có công việc cần xử lý.</div>}</section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"><div className="flex items-center justify-between"><div><h3 className="font-bold text-lg text-slate-900">Website & tương tác</h3><p className="text-xs text-slate-500 mt-1">Chỉ hiển thị dữ liệu tracking đã ghi nhận.</p></div><Activity size={18} className="text-[var(--color-primary)]" /></div><div className="grid grid-cols-3 gap-3 mt-5">{[["Khách truy cập", summary.totalVisitorsThisMonth, Eye], ["Lượt xem", summary.totalPageViewsThisMonth, FileText], ["Chat tư vấn", summary.totalChatsThisMonth, MessageSquare]].map(([label, value, Icon]: any) => <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100"><Icon size={16} className="text-[var(--color-primary)] mb-2" /><p className="text-[10px] uppercase font-bold text-slate-500">{label}</p><p className="text-xl font-black text-slate-900 mt-1">{Number(value || 0).toLocaleString("vi-VN")}</p></div>)}</div></section>
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"><div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-lg text-slate-900">Nội dung gần đây</h3><p className="text-xs text-slate-500 mt-1">Bản ghi mới nhất từ các API CMS.</p></div><Clock3 size={18} className="text-[var(--color-primary)]" /></div>{recentContent.length ? <div className="space-y-2">{recentContent.map((item, index) => <div key={`${item.id || index}-${index}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100"><span className="text-sm font-semibold text-slate-700 truncate">{item.title || item.name || "Nội dung không có tiêu đề"}</span><span className="text-[10px] uppercase font-bold text-slate-400">{contentLabels[item.contentType] || item.contentType}</span></div>)}</div> : <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500">Chưa phát sinh nội dung gần đây.</div>}</section>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"><div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-lg text-slate-900">Hiệu suất nội dung và dịch vụ</h3><p className="text-xs text-slate-500 mt-1">Chỉ dùng số hồ sơ thực tế; doanh thu không có dữ liệu sẽ không được suy diễn.</p></div><ShieldCheck size={18} className="text-[var(--color-primary)]" /></div><div className="h-72">{stats.data.legalServicesPerformance?.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.data.legalServicesPerformance}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Area type="monotone" dataKey="casesCount" name="Hồ sơ" stroke="#2563eb" fill="#dbeafe" /></AreaChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-slate-400">Chưa đủ dữ liệu hiệu suất.</div>}</div></section>

      <DashboardWidget />
    </div>
  );
}

function SourceNotice({ tone, text }: { tone: "warning" | "error"; text: string }) {
  return <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${tone === "error" ? "bg-red-50 border-red-100 text-red-700" : "bg-amber-50 border-amber-100 text-amber-700"}`}><AlertCircle size={16} />{text}</div>;
}
