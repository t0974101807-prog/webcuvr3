import React, { useState, useEffect, useMemo } from 'react';
import { Users, Activity, DollarSign, Search, User, UserCheck, Trash2 } from 'lucide-react';
import { fetchApi } from '../utils/api';
import { io } from 'socket.io-client';
import { useContactSettings } from '../hooks/useContactSettings';

export default function ClientManagement({ language = "vi", onBack, isEmbedded = false }: { language?: "vi" | "en"; onBack?: () => void; isEmbedded?: boolean }) {
  const { settings: contactSettings } = useContactSettings();
  const t = {
    vi: {
      addClient: "Thêm khách hàng",
      addPartner: "Thêm đối tác",
      clientName: "Tên khách hàng",
      partnerName: "Tên đối tác",
      phone: "Số điện thoại",
      noClients: "Chưa có khách hàng nào",
      noPartners: "Chưa có đối tác nào",
      totalClients: "Tổng khách hàng",
      totalPartners: "Tổng đối tác",
      activeClients: "Khách đang có vụ việc",
      activePartners: "Đối tác hoạt động",
      onlineClients: "Đang truy cập hiện tại",
      onlinePartners: "Đối tác trực tuyến",
      totalRevenue: "Tổng doanh thu ước tính",
      casesOverview: "Thông tin hồ sơ",
      searchPlaceholder: "Tìm kiếm...",
      submit: "Lưu thông tin",
    },
    en: {
      addClient: "Add Client",
      addPartner: "Add Partner",
      clientName: "Client Name",
      partnerName: "Partner Name",
      phone: "Phone Number",
      noClients: "No clients yet",
      noPartners: "No partners yet",
      totalClients: "Total Clients",
      totalPartners: "Total Partners",
      activeClients: "Clients w/ Active Cases",
      activePartners: "Active Partners",
      onlineClients: "Currently Online",
      onlinePartners: "Partners Online",
      totalRevenue: "Est. Total Revenue",
      casesOverview: "Cases Info",
      searchPlaceholder: "Search...",
      submit: "Save info",
    },
  }[language];

  const [activeCategory, setActiveCategory] = useState<"client" | "partner">("client");
  const [clients, setClients] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineVisitors, setOnlineVisitors] = useState(1);
  const [offices, setOffices] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const load = () => {
    const endpoint = activeCategory === "client" ? "/api/clients" : "/api/partners";
    fetchApi(endpoint)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          setClients([]);
        }
      })
      .catch(err => {
        console.error(err);
        setClients([]);
      });
    fetchApi("/api/erp-records").then(res => res.json()).then(data => {
      if (data && Array.isArray(data)) {
        const unique = Array.from(new Map(data.map((item: any) => [item.id, item])).values());
        setRecords(unique as any);
      } else {
        setRecords([]);
      }
    }).catch(err => {
      console.error(err);
      setRecords([]);
    });

    fetchApi("/api/offices")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOffices(data);
      })
      .catch(console.error);

    fetchApi("/api/users/employees")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllUsers(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    load();
  }, [activeCategory]);

  useEffect(() => {
    let s: any = null;
    try {
      s = io();
      s.on("users_updated", () => load());
      s.on("erp_record_updated", () => load());
      s.on("erp_record_deleted", () => load());
    } catch (e) {}

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rawRes = await fetchApi("/api/users", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: fd.get("username"),
        name: fd.get("name"),
        password: fd.get("password"),
        role: activeCategory === "client" ? "client" : "partner",
        phone: fd.get("username"), // Ensure phone is set to username for table mapping
        case_id: fd.get("case_id"),
        branch: fd.get("branch") || "",
        manager_id: fd.get("manager_id") || "",
      })
    });
    
    if (rawRes.ok) {
      e.currentTarget.reset();
      load();
    } else {
      let err = 'Thêm mới thất bại';
      try { const data = await rawRes.json(); err = data.error || data.message || err; } catch(ex){}
      alert("Lỗi thêm: " + err);
    }
  };

  const handleDeleteClient = async (id: any, name?: string) => {
    const isVirtual = typeof id === 'string' && id.startsWith('virtual-');
    if (isVirtual) {
      const clientName = name || id.replace('virtual-', '');
      if (confirm(`Bạn có chắc chắn muốn xóa khách hàng "${clientName}" và toàn bộ hồ sơ của họ? Các hồ sơ liên quan của họ sẽ được chuyển vào Thùng rác.`)) {
        try {
          // Find all records belonging to this client name
          const clientRecords = records.filter(r => {
            const rClient = (r.client || r.clientName || "").trim().toLowerCase();
            return rClient === clientName.trim().toLowerCase();
          });
          
          for (const rec of clientRecords) {
            await fetchApi(`/api/erp-records/${rec.id}`, { method: 'DELETE' });
          }
          
          load();
        } catch (error: any) {
          alert('Xoá thất bại: ' + (error.message || error));
        }
      }
      return;
    }

    if (confirm("Các hồ sơ liên quan của khách hàng vẫn sẽ được giữ lại, bạn có chắc chắn xóa tài khoản khách hàng này? Hành động này không thể hoàn tác.")) {
      try {
        const res = await fetchApi(`/api/users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
        load();
      } catch (error: any) {
        alert('Xoá thất bại: ' + (error.message || error));
      }
    }
  };

  // Derive stats
  const clientStats = useMemo(() => {
    const stats: Record<string, { totalCases: number, activeCases: number }> = {};
    const clientsArr = Array.isArray(clients) ? clients : [];
    const recordsArr = Array.isArray(records) ? records : [];
    
    // First setup stats entries for all registered clients
    clientsArr.forEach(c => {
      stats[c.name] = { totalCases: 0, activeCases: 0 };
    });

    recordsArr.forEach(r => {
      // Only count actual Cases (Hồ sơ)
      if (r.type !== 'Hồ sơ' && r.type !== 'Vụ việc' && r.category) {
        // sometimes records have category but no explicit type if they are cases, but let's be safe:
        // if it's explicitly an event, don't count it as a case.
        if (r.type === 'Sự kiện' || r.type === 'Họp' || r.type === 'Gặp khách hàng' || r.type === 'Phiên tòa' || r.type === 'Xin nghỉ' || r.type === 'Khác') {
          return;
        }
      }

      const rawClientName = r.client || r.clientName;
      if (!rawClientName) return;
      
      const normalizedName = rawClientName.trim().toLowerCase();
      // Find matching client in our known clients list
      const matchedClient = clientsArr.find(c => c.name.trim().toLowerCase() === normalizedName);
      const targetName = matchedClient ? matchedClient.name : rawClientName.trim();
      
      if (!stats[targetName]) {
        stats[targetName] = { totalCases: 0, activeCases: 0 };
      }
      
      stats[targetName].totalCases += 1;
      
      const isCompleted = r.status?.includes("Hoàn thành") || r.status?.includes("Completed") || r.status?.includes("Đóng");
      if (!isCompleted) {
        stats[targetName].activeCases += 1;
      }
    });
    
    return stats;
  }, [clients, records]);

  // Merge client data
  const processedClients = useMemo(() => {
    const clientsArr = Array.isArray(clients) ? clients : [];
    const merged = [...clientsArr.map(c => ({
      ...c,
      isApiAdded: true,
      stats: clientStats[c.name] || { totalCases: 0, activeCases: 0 }
    }))];
    
    Object.entries(clientStats).forEach(([name, cStats]) => {
      if (!merged.find(c => c.name === name)) {
        merged.push({
          id: `virtual-${name}`,
          name: name,
          phone: "---",
          isApiAdded: false,
          stats: cStats
        });
      }
    });

    return merged.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => b.stats.totalCases - a.stats.totalCases); 
  }, [clients, clientStats, searchTerm]);

  const overview = useMemo(() => {
    let totals = { clients: 0, active: 0 };
    totals.clients = processedClients.length;
    processedClients.forEach(c => {
      if (c.stats.activeCases > 0) totals.active += 1;
    });
    return totals;
  }, [processedClients]);

  return (
    <div className={isEmbedded ? "font-sans w-full" : "min-h-screen bg-slate-50 font-sans"}>
      {!isEmbedded && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
              {language === "vi" ? "Quản lý Khách hàng & Đối tác" : "Client & Partner Management"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="text-sm font-medium text-blue-600 hover:text-blue-700">Thoát / Trang chủ</button>
            )}
          </div>
        </header>
      )}

      <main className={isEmbedded ? "space-y-6" : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"}>
        {/* Toggle Category Segmented Control */}
        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveCategory("client")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeCategory === "client"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {language === "vi" ? "Khách hàng" : "Customers"}
          </button>
          <button
            onClick={() => setActiveCategory("partner")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeCategory === "partner"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {language === "vi" ? "Đối tác" : "Partners"}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-blue-400 relative overflow-hidden group">
              <div className="absolute -right-2 -top-2 opacity-[0.15] group-hover:scale-110 transition-transform duration-500">
                  <Users size={80} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {activeCategory === "client" ? t.totalClients : t.totalPartners}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">{overview.clients}</div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-emerald-400 relative overflow-hidden group">
              <div className="absolute -right-2 -top-2 opacity-[0.15] group-hover:scale-110 transition-transform duration-500">
                  <Activity size={80} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {activeCategory === "client" ? t.activeClients : t.activePartners}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">{overview.active}</div>
          </div>
          <div className="bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-orange-400 relative overflow-hidden group">
              <div className="absolute -right-2 -top-2 opacity-[0.15] group-hover:scale-110 transition-transform duration-500">
                  <UserCheck size={80} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10 flex items-center gap-2">
                {activeCategory === "client" ? t.onlineClients : t.onlinePartners}
                <span className="relative flex h-2.5 w-2.5 mt-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">{onlineVisitors}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h3 className="text-lg font-semibold mb-2 text-slate-800">
              {activeCategory === "client" ? t.addClient : t.addPartner}
            </h3>
            <p className="text-xs text-slate-500 mb-4 bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-100">
              {activeCategory === "client"
                ? (language === 'vi' 
                  ? 'Tài khoản "Cổng Khách Hàng" sẽ được cấp quyền truy cập vào hồ sơ liên kết.' 
                  : 'Client Portal account will have access to the linked case.')
                : (language === 'vi'
                  ? 'Tài khoản "Cổng Đối Tác" sẽ được liên kết và theo dõi các hồ sơ được chỉ định.'
                  : 'Partner Portal account will be linked and monitor assigned cases.')
              }
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập / Điện thoại</label>
                <input
                  name="username"
                  placeholder="Nhập số ĐT/Tên đăng nhập"
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {activeCategory === "client" ? t.clientName : t.partnerName}
                </label>
                <input
                  name="name"
                  placeholder={activeCategory === "client" ? t.clientName : t.partnerName}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã hồ sơ (Case ID)</label>
                <input
                  name="case_id"
                  placeholder="Mã hồ sơ liên kết"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-slate-100"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {activeCategory === "client" 
                    ? "Khách hàng sẽ chỉ xem được hồ sơ có mã này." 
                    : "Đối tác sẽ được cấp quyền xem hồ sơ có mã này."
                  }
                </p>
              </div>

              {/* 📍 Dynamic Branch Select Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">📍 Chi nhánh phụ trách</label>
                <select
                  name="branch"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {offices.map((off: any) => (
                    <option key={off.id} value={off.name}>
                      🏢 {off.name}
                    </option>
                  ))}
                  {offices.length === 0 && (
                    <>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    </>
                  )}
                </select>
              </div>

              {/* 👤 Dynamic Personnel Manager Select Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">👤 Nhân sự quản lý</label>
                <select
                  name="manager_id"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="">-- Chọn nhân sự quản lý --</option>
                  {allUsers.filter((u: any) => u.name).map((p: any) => (
                      <option key={p.id} value={p.id}>
                        👨‍💼 {p.name} ({p.title || "Nhân viên"})
                      </option>
                    ))}
                  {allUsers.length === 0 && (
                    <option value="" disabled>Chưa có nhân sự thực tế</option>
                  )}
                </select>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 mt-2 rounded-lg transition-all shadow-md active:scale-95 text-sm cursor-pointer">
                {activeCategory === "client" ? t.addClient : t.addPartner}
              </button>
            </form>
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                {activeCategory === "client"
                  ? (language === "vi" ? "Danh sách Khách hàng" : "Client List")
                  : (language === "vi" ? "Danh sách Đối tác" : "Partner List")
                }
              </h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-full text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white w-64"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
               <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium text-slate-500">
                      {activeCategory === "client" ? t.clientName : t.partnerName}
                    </th>
                    <th className="px-6 py-3 font-medium text-slate-500">Thông tin tài khoản</th>
                    <th className="px-6 py-3 font-medium text-slate-500">📍 Chi nhánh</th>
                    <th className="px-6 py-3 font-medium text-slate-500">👤 Nhân sự quản lý</th>
                    <th className="px-6 py-3 font-medium text-slate-500 text-center">{t.casesOverview}</th>
                    <th className="px-6 py-3 font-medium text-slate-500 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedClients.map((c) => {
                    const manager = allUsers.find(u => String(u.id) === String(c.manager_id || ''));
                    return (
                      <tr key={c.id} className="transition-all hover:bg-slate-50/80 group">
                        <td className="px-6 py-3">
                          <div className="font-medium text-slate-800 flex items-center gap-2">
                            {c.name}
                            {!c.isApiAdded && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium border border-slate-200" title="Được tự động thêm từ hồ sơ">Auto</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {c.isApiAdded ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm text-slate-700 font-medium">{c.phone || c.username}</span>
                              <span className="text-xs text-slate-400 font-mono">TK/MK: {c.username || c.phone} / ******</span>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-sm">{c.phone}</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-600 font-medium">
                          {c.branch ? `🏢 ${c.branch}` : "—"}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {manager ? `👨‍💼 ${manager.name}` : "Chưa bàn giao"}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium text-xs border border-blue-200" title="Tổng số hồ sơ">
                              {c.stats.totalCases}
                            </span>
                            {c.stats.activeCases > 0 && (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium text-xs border border-emerald-200" title="Hồ sơ đang xử lý">
                                {c.stats.activeCases} active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleDeleteClient(c.id, c.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {processedClients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 border-none">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={32} className="opacity-20" />
                          <span className="font-medium">
                            {searchTerm 
                              ? (activeCategory === "client" ? "Không tìm thấy khách hàng nào" : "Không tìm thấy đối tác nào") 
                              : (activeCategory === "client" ? t.noClients : t.noPartners)
                            }
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
