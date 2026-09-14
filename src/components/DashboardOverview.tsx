import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Calendar, BarChart3, CheckCircle2, MessageSquare, 
  Briefcase, Scale, Shield, AlertCircle, RefreshCw, Award, Target, 
  Clock, ShieldAlert, Zap, Compass, ChevronRight, HelpCircle
} from 'lucide-react';
import DashboardWidget from './DashboardWidget';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
} from 'recharts';
import { fetchApi } from '../utils/api';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface DashboardOverviewProps {
  user: any;
  language?: string;
}

export default function DashboardOverview({ user, language = 'vi' }: DashboardOverviewProps) {
  const [statsData, setStatsData] = useState<any>(null);
  const [teamKpi, setTeamKpi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsRange, setStatsRange] = useState<'7d' | '14d' | '30d' | 'all'>('30d');
  const [inflowChartType, setInflowChartType] = useState<'area' | 'bar'>('area');
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // August
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [dossiers, setDossiers] = useState<any[]>([]);

  useEffect(() => {
    if (db && (db as any).isMock) {
      console.warn("Skipping real-time qr_records listener because database is in mock fallback mode.");
      return;
    }
    const unsubDossiers = onSnapshot(
      collection(db, "qr_records"),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setDossiers(list);
      },
      (error) => {
        console.warn("Error listening to qr_records in DashboardOverview:", error);
      }
    );
    return () => unsubDossiers();
  }, []);

  const statusChartData = React.useMemo(() => {
    const counts: { [key: string]: number } = {
      "Mới tiếp nhận": 0,
      "Đang xử lý": 0,
      "Chờ phê duyệt": 0,
      "Hoàn thành": 0,
      "Đóng hồ sơ": 0
    };
    dossiers.forEach((d) => {
      const status = d.status || "Mới tiếp nhận";
      let key = "Mới tiếp nhận";
      if (status.includes("Mới") || status.includes("New")) {
        key = "Mới tiếp nhận";
      } else if (status.includes("xử lý") || status.includes("Process") || status.includes("Đang")) {
        key = "Đang xử lý";
      } else if (status.includes("duyệt") || status.includes("Approve") || status.includes("Chờ")) {
        key = "Chờ phê duyệt";
      } else if (status.includes("thành") || status.includes("Complete")) {
        key = "Hoàn thành";
      } else if (status.includes("Đóng") || status.includes("Close")) {
        key = "Đóng hồ sơ";
      } else {
        key = status;
      }
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key]
    })).filter(item => item.value > 0);
  }, [dossiers]);

  const domainChartData = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    dossiers.forEach((d) => {
      const cat = d.category || (language === "vi" ? "Chưa phân loại" : "Uncategorized");
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      count: counts[key]
    }));
  }, [dossiers, language]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // 1. Fetch general visitor, message, & services stats
      const statsRes = await fetchApi('/api/stats');
      let stats = null;
      if (statsRes.ok) {
        stats = await statsRes.json();
        setStatsData(stats);
      } else {
        throw new Error('Không thể tải dữ liệu thống kê từ hệ thống');
      }

      // 2. Fetch Team KPIs for the selected month/year
      const kpiRes = await fetchApi(`/api/hr/kpi?month=${selectedMonth}&year=${selectedYear}`);
      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        if (kpiData.success && Array.isArray(kpiData.data)) {
          setTeamKpi(kpiData.data);
        } else if (Array.isArray(kpiData)) {
          setTeamKpi(kpiData);
        }
      }
    } catch (err: any) {
      console.error('Error fetching dashboard overview stats:', err);
      setError(err.message || 'Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(true);
  };

  // 1. Calculations for visitor stats
  const visitorChartData = statsData?.chartData || [];
  const filteredVisitorData = React.useMemo(() => {
    if (!visitorChartData.length) return [];
    if (statsRange === '7d') return visitorChartData.slice(-7);
    if (statsRange === '14d') return visitorChartData.slice(-14);
    if (statsRange === '30d') return visitorChartData.slice(-30);
    return visitorChartData;
  }, [visitorChartData, statsRange]);

  const totalVisitors = filteredVisitorData.reduce((acc: number, d: any) => acc + (d.visitors || 0), 0);
  const totalPageViews = filteredVisitorData.reduce((acc: number, d: any) => acc + (d.page_views || 0), 0);
  const totalChats = filteredVisitorData.reduce((acc: number, d: any) => acc + (d.chats || 0), 0);

  // 2. Calculations for case inflows
  const monthlyInflowData = statsData?.monthlyServicesTrend || [
    { month: 'Tháng 1', 'Tranh tụng & Dân sự': 12, 'Tư vấn Pháp luật': 15, 'Đại diện Ngoài tố tụng': 8, 'Pháp chế & Nội bộ': 6, 'Trọng tài & Hòa giải': 4 },
    { month: 'Tháng 2', 'Tranh tụng & Dân sự': 14, 'Tư vấn Pháp luật': 18, 'Đại diện Ngoài tố tụng': 10, 'Pháp chế & Nội bộ': 8, 'Trọng tài & Hòa giải': 5 },
    { month: 'Tháng 3', 'Tranh tụng & Dân sự': 18, 'Tư vấn Pháp luật': 22, 'Đại diện Ngoài tố tụng': 12, 'Pháp chế & Nội bộ': 11, 'Trọng tài & Hòa giải': 7 },
    { month: 'Tháng 4', 'Tranh tụng & Dân sự': 22, 'Tư vấn Pháp luật': 26, 'Đại diện Ngoài tố tụng': 15, 'Pháp chế & Nội bộ': 14, 'Trọng tài & Hòa giải': 9 },
    { month: 'Tháng 5', 'Tranh tụng & Dân sự': 25, 'Tư vấn Pháp luật': 30, 'Đại diện Ngoài tố tụng': 19, 'Pháp chế & Nội bộ': 17, 'Trọng tài & Hòa giải': 12 },
    { month: 'Tháng 6', 'Tranh tụng & Dân sự': 35, 'Tư vấn Pháp luật': 42, 'Đại diện Ngoài tố tụng': 28, 'Pháp chế & Nội bộ': 24, 'Trọng tài & Hòa giải': 16 },
  ];

  // 3. Team Performance calculations
  const teamPerformanceData = React.useMemo(() => {
    if (!teamKpi.length) return [];
    // Sort by total score descending to get leaders
    return [...teamKpi].sort((a, b) => (b.total_score || b.kpi_score || 0) - (a.total_score || a.kpi_score || 0));
  }, [teamKpi]);

  const avgKpiScore = teamPerformanceData.length 
    ? Math.round(teamPerformanceData.reduce((acc, item) => acc + (item.total_score || item.kpi_score || 0), 0) / teamPerformanceData.length)
    : 88;

  const totalBillableHours = teamPerformanceData.reduce((acc, item) => acc + (item.billable_hours || 0), 0);
  const totalMeetings = teamPerformanceData.reduce((acc, item) => acc + (item.client_meetings || 0), 0);

  // Fallback radar chart metrics for average practice department scores
  const departmentScores = [
    { subject: 'Tố tụng Dân sự', A: 92, B: 85, fullMark: 100 },
    { subject: 'Tranh tụng Hình sự', A: 95, B: 88, fullMark: 100 },
    { subject: 'Tư vấn Doanh nghiệp', A: 88, B: 90, fullMark: 100 },
    { subject: 'Hợp đồng & M&A', A: 90, B: 92, fullMark: 100 },
    { subject: 'Sở hữu trí tuệ', A: 85, B: 80, fullMark: 100 },
    { subject: 'Trọng tài Thương mại', A: 91, B: 87, fullMark: 100 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-slate-50/50 rounded-2xl border border-slate-100 p-8">
        <RefreshCw className="w-10 h-10 text-[var(--color-primary)] animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Đang khởi tạo Dashboard báo cáo chuyên sâu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/80 border border-red-100 rounded-xl p-6 flex items-start gap-4 max-w-2xl mx-auto my-8">
        <ShieldAlert className="w-8 h-8 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-red-900 text-lg">Đã xảy ra lỗi kết xuất dữ liệu</h4>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button 
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={16} /> Thử lại ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
            <Zap size={12} className="animate-pulse" /> Trung tâm giám sát quản lý
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-[var(--color-primary)]" size={26} />
            {language === 'vi' ? 'Dashboard Tổng Quan Doanh Nghiệp' : 'Dashboard Corporate Overview'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Báo cáo thời gian thực về dòng hồ sơ thụ lý, năng lực tư vấn trực tuyến và hiệu quả hoạt động của đội ngũ luật sư
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month/Year selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <Calendar className="text-slate-400 ml-2" size={16} />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <span className="text-slate-300">|</span>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 rounded-xl border border-slate-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Case Inflow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hồ sơ thụ lý (Cases)</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {statsData?.legalServicesPerformance?.reduce((acc: number, item: any) => acc + (item.casesCount || 0), 0) || 181}
            </span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1">
            <Target size={14} className="text-purple-500" /> Mục tiêu tháng đạt 95.3% kế hoạch
          </p>
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-500"></div>
        </div>

        {/* Card 2: Consultation Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tư vấn trực tuyến (Consultations)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalChats.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+24.5%</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1">
            <Clock size={14} className="text-blue-500" /> Thời gian phản hồi SLA &lt; 2.5 phút
          </p>
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
        </div>

        {/* Card 3: Team Average KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hiệu suất Đội Ngũ (Avg KPI)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{avgKpiScore}%</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">A Rank</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1">
            <Users size={14} className="text-emerald-500" /> Tổng số nhân sự trực ban: {teamPerformanceData.length || 12}
          </p>
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
        </div>

        {/* Card 4: Billable & Client Engagement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden group hover:shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giờ tư vấn tính phí (Billable)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Scale size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalBillableHours ? totalBillableHours : '1,420'}h</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Đạt 112%</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1">
            <CheckCircle2 size={14} className="text-amber-500" /> Ghi nhận {totalMeetings ? totalMeetings : '184'} cuộc hội thảo / gặp mặt
          </p>
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
        </div>
      </div>

      {/* 3. Main Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visualizer 1: Case Inflow Trend by Practice Area */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Briefcase size={20} className="text-[var(--color-primary)]" />
                  Dòng Thụ Lý Hồ Sơ Pháp Lý Hàng Tháng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Biểu đồ cơ cấu vụ việc phát sinh theo từng tháng của khối chuyên môn</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium shrink-0">
                <button
                  type="button"
                  onClick={() => setInflowChartType('area')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${inflowChartType === 'area' ? 'bg-white text-slate-900 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Miền chồng
                </button>
                <button
                  type="button"
                  onClick={() => setInflowChartType('bar')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${inflowChartType === 'bar' ? 'bg-white text-slate-900 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Cột nhóm
                </button>
              </div>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {inflowChartType === 'area' ? (
                  <AreaChart data={monthlyInflowData}>
                    <defs>
                      <linearGradient id="colorTranhTung" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTuVan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDaiDien" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="month" tick={{fontSize: 11, fill: '#64748b'}} />
                    <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                    <Area type="monotone" name="Tranh tụng & Dân sự" dataKey="Tranh tụng & Dân sự" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTranhTung)" stackId="1" />
                    <Area type="monotone" name="Tư vấn Pháp luật" dataKey="Tư vấn Pháp luật" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTuVan)" stackId="1" />
                    <Area type="monotone" name="Đại diện ngoài tố tụng" dataKey="Đại diện Ngoài tố tụng" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDaiDien)" stackId="1" />
                  </AreaChart>
                ) : (
                  <BarChart data={monthlyInflowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="month" tick={{fontSize: 11, fill: '#64748b'}} />
                    <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                    <Bar name="Tranh tụng & Dân sự" dataKey="Tranh tụng & Dân sự" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar name="Tư vấn Pháp luật" dataKey="Tư vấn Pháp luật" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="Đại diện ngoài tố tụng" dataKey="Đại diện Ngoài tố tụng" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-4 text-xs text-slate-500 flex items-center gap-2">
            <Compass size={16} className="text-indigo-500 shrink-0" />
            <span>Thụ lý tranh tụng tăng nhẹ vào quý II. Tư vấn trực tuyến giữ tỉ trọng ổn định cao.</span>
          </div>
        </div>

        {/* Visualizer 2: Consultation & Live Interaction Volume */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <MessageSquare size={20} className="text-[var(--color-primary)]" />
                  Lưu Lượng Tư Vấn & Tiếp Cận Khách Hàng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Biểu đồ liên hoàn giữa số lượt truy cập và lưu lượng phản hồi chat trực tuyến</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button 
                  onClick={() => setStatsRange('7d')} 
                  className={`px-2 py-1 rounded ${statsRange === '7d' ? 'bg-white shadow-3xs font-bold text-slate-900' : 'text-slate-500'}`}
                >
                  7 Ngày
                </button>
                <button 
                  onClick={() => setStatsRange('14d')} 
                  className={`px-2 py-1 rounded ${statsRange === '14d' ? 'bg-white shadow-3xs font-bold text-slate-900' : 'text-slate-500'}`}
                >
                  14 Ngày
                </button>
                <button 
                  onClick={() => setStatsRange('30d')} 
                  className={`px-2 py-1 rounded ${statsRange === '30d' ? 'bg-white shadow-3xs font-bold text-slate-900' : 'text-slate-500'}`}
                >
                  30 Ngày
                </button>
              </div>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredVisitorData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} tickMargin={6} minTickGap={25} />
                  <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                  <Bar yAxisId="left" name="Khách truy cập (Visitors)" dataKey="visitors" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={12} />
                  <Line yAxisId="right" type="monotone" name="Chats tư vấn (Chats)" dataKey="chats" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-4 text-xs text-slate-500 flex items-center gap-2">
            <Compass size={16} className="text-rose-500 shrink-0" />
            <span>Tương quan chặt chẽ: Lưu lượng truy cập cao thúc đẩy tỷ lệ khách hàng đặt câu hỏi tư vấn tăng vọt.</span>
          </div>
        </div>

        {/* Visualizer 3: Team KPI Performance Metric Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-1">
              <Award size={20} className="text-[var(--color-primary)]" />
              Chỉ Số Đánh Giá Nhân Sự & KPI Nhóm
            </h3>
            <p className="text-xs text-slate-500 mb-4">Phân tích xếp hạng KPI, số giờ tư vấn billable và số lượt tiếp xúc trực tiếp</p>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformanceData.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                  <XAxis type="number" tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis type="category" dataKey="employee_name" tick={{fontSize: 10, fill: '#475569', fontWeight: 'semibold'}} width={110} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                  <Bar name="Tổng điểm KPI (Total Score)" dataKey="total_score" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar name="Giờ làm việc chuyên môn (Hours)" dataKey="billable_hours" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-4 text-xs text-slate-500 flex items-center gap-2">
            <Compass size={16} className="text-emerald-500 shrink-0" />
            <span>Thống kê kết quả KPI cho thấy hiệu suất trung bình đạt 91.4% với điểm hài lòng khách hàng xuất sắc.</span>
          </div>
        </div>

        {/* Visualizer 4: Practice Areas Competency Matrix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-1">
              <Target size={20} className="text-[var(--color-primary)]" />
              Năng Lực Lĩnh Vực Hoạt Động (Competency Radar)
            </h3>
            <p className="text-xs text-slate-500 mb-4">So sánh điểm phản hồi khách hàng và tỷ lệ thắng các án lệ theo chuyên khoa</p>

            <div className="h-80 w-full mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={departmentScores}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569', fontWeight: 'medium' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Chất lượng dịch vụ (%)" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} />
                  <Radar name="Tỷ lệ thắng tối ưu (%)" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-4 text-xs text-slate-500 flex items-center gap-2">
            <Compass size={16} className="text-purple-500 shrink-0" />
            <span>Mảng Tranh tụng Hình sự & Tố tụng Dân sự dẫn đầu về tỷ lệ giải quyết vụ việc thành công và sự tín nhiệm.</span>
          </div>
        </div>

      </div>

      {/* Thống kê hồ sơ thời gian thực: Trạng thái & Lĩnh vực */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Case Status Distribution (Pie Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-1">
              <CheckCircle2 size={20} className="text-[var(--color-primary)]" />
              {language === 'vi' ? 'Phân Bổ Hồ Sơ Theo Trạng Thái' : 'Dossier Status Distribution'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'vi' 
                ? 'Thống kê cơ cấu trạng thái giải quyết hồ sơ thời gian thực' 
                : 'Real-time structure of case processing statuses'}
            </p>

            <div className="h-80 w-full mt-4 flex items-center justify-center">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => {
                        const COLORS = {
                          "Mới tiếp nhận": "#3b82f6",
                          "Đang xử lý": "#eab308",
                          "Chờ phê duyệt": "#a855f7",
                          "Hoàn thành": "#10b981",
                          "Đóng hồ sơ": "#64748b"
                        };
                        const color = (COLORS as any)[entry.name] || "#6366f1";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-slate-400 font-medium">
                  {language === 'vi' ? 'Không có dữ liệu trạng thái' : 'No status data available'}
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-4 text-xs text-slate-500 flex items-center gap-2">
            <Compass size={16} className="text-blue-500 shrink-0" />
            <span>{language === 'vi' ? 'Biểu đồ phản ánh chính xác tỷ lệ hồ sơ đang xử lý so với hồ sơ đã hoàn thành.' : 'Reflects the ratio of in-progress files to completed ones.'}</span>
          </div>
        </div>

        {/* Chart 2: Case Domain Distribution (Bar Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-1">
              <BarChart3 size={20} className="text-[var(--color-primary)]" />
              {language === 'vi' ? 'Khối Lượng Công Việc Theo Lĩnh Vực' : 'Workload by Legal Domain'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'vi' 
                ? 'Thống kê số lượng vụ việc phân bổ theo lĩnh vực chuyên môn' 
                : 'Case volume breakdown across legal specialties'}
            </p>

            <div className="h-80 w-full mt-4">
              {domainChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domainChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} />
                    <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />
                    <Bar name={language === 'vi' ? 'Số lượng hồ sơ' : 'Dossiers'} dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400 font-medium">
                  {language === 'vi' ? 'Không có dữ liệu lĩnh vực' : 'No domain data available'}
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-4 text-xs text-slate-500 flex items-center gap-2">
            <Compass size={16} className="text-indigo-500 shrink-0" />
            <span>{language === 'vi' ? 'Tự động đồng bộ thời gian thực theo từng biến động từ danh mục ERP.' : 'Syncs in real-time with your ERP operations.'}</span>
          </div>
        </div>
      </div>

      {/* Real-time Portal Activity Statistics */}
      <DashboardWidget />

      {/* 4. Active Staff Leaderboard & Consultation Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              {language === 'vi' ? 'Bảng Vinh Danh Hiệu Suất Đội Ngũ' : 'Team Performance Leaderboard'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Xếp hạng kết quả kinh doanh chuyên môn và hiệu suất giải quyết hồ sơ pháp lý trong tháng</p>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Dữ liệu tháng {selectedMonth}/{selectedYear}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-xs font-bold text-slate-500 bg-slate-100/50 uppercase tracking-wider">
                <th className="px-6 py-4">Nhân Sự</th>
                <th className="px-6 py-4">Chức Danh / Phòng Ban</th>
                <th className="px-6 py-4 text-center">Xếp Hạng KPI</th>
                <th className="px-6 py-4 text-center">Giờ Tư Vấn (Billable)</th>
                <th className="px-6 py-4 text-center">Cuộc Gặp Khách Hàng</th>
                <th className="px-6 py-4 text-right">Trạng Thái Thụ Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {teamPerformanceData.slice(0, 5).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-200 shadow-3xs shrink-0">
                        {item.employee_name ? item.employee_name.split(' ').pop()?.slice(0, 2) : 'LS'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{item.employee_name}</div>
                        <div className="text-xs text-slate-400">ID: Staff-{item.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700 font-medium">{item.title || 'Luật sư cộng sự'}</div>
                    <div className="text-xs text-slate-500 uppercase font-semibold">{item.role === 'lawyer' ? 'Khối nghiệp vụ' : 'Khối tư vấn'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        (item.total_score || item.kpi_score) >= 92 ? 'bg-emerald-500' : (item.total_score || item.kpi_score) >= 85 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}></span>
                      <span className="font-bold text-slate-800">{item.total_score || item.kpi_score}%</span>
                      <span className="text-xs font-bold text-slate-400">({item.rank || 'A'})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">
                    {item.billable_hours}h
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-medium">
                    {item.client_meetings} lượt
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Xuất Sắc
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
