import React, { useState, useEffect } from "react";
import { 
  Search, 
  User, 
  Folder, 
  FileText, 
  CheckCircle, 
  Calendar, 
  ArrowRight, 
  Scale, 
  Building, 
  Phone, 
  CreditCard, 
  X, 
  RefreshCw, 
  Inbox,
  AlertCircle
} from "lucide-react";
import { fetchApi } from "../utils/api";

interface GlobalSearchProps {
  language: "vi" | "en";
  user: any;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ language, user }) => {
  const isVi = language === "vi";
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "clients" | "cases" | "documents">("all");
  const [results, setResults] = useState<{
    clients: any[];
    cases: any[];
    documents: any[];
  }>({ clients: [], cases: [], documents: [] });
  const [error, setError] = useState<string | null>(null);

  // Suggested keywords to click
  const suggestedQueries = [
    { text: "079092001122", label: isVi ? "Mẫu CCCD" : "Sample CCCD" },
    { text: "Nguyễn Văn An", label: isVi ? "Khách hàng An" : "Client An" },
    { text: "HS001", label: isVi ? "Hồ sơ HS001" : "Dossier HS001" },
    { text: "Bào chữa", label: isVi ? "Văn bản/Án lệ" : "Precedents/Forms" },
  ];

  const handleSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults({ clients: [], cases: [], documents: [] });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchApi(`/api/system/global-search?q=${encodeURIComponent(trimmed)}`);
      const json = await response.json();
      if (json && json.success) {
        setResults(json.results);
      } else {
        setError(json.error || (isVi ? "Không thể tải kết quả tìm kiếm." : "Failed to load search results."));
      }
    } catch (err: any) {
      console.error("Global search error:", err);
      setError(isVi ? "Lỗi kết nối máy chủ." : "Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setResults({ clients: [], cases: [], documents: [] });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Identify if query is exactly a CCCD (12 digits) or MST (10 digits)
  const cleanNumOnly = query.trim().replace(/\D/g, "");
  const isCccdSearch = cleanNumOnly.length === 12;
  const isMstSearch = cleanNumOnly.length === 10;

  // Compute total matched count
  const totalClients = results.clients?.length || 0;
  const totalCases = results.cases?.length || 0;
  const totalDocs = results.documents?.length || 0;
  const totalResults = totalClients + totalCases + totalDocs;

  const clickSuggestion = (text: string) => {
    setQuery(text);
    handleSearch(text);
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12" id="global-search-container">
      {/* Search Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 text-white border border-slate-800 shadow-md">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <span className="px-3 py-1 text-[10px] uppercase font-black tracking-widest bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
            {isVi ? "CÔNG CỤ TRA CỨU TOÀN DIỆN" : "COMPREHENSIVE UTILITY"}
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-white leading-tight">
            {isVi ? "Tìm Kiếm Thông Tin Toàn Hệ Thống" : "Global Enterprise Search Engine"}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
            {isVi 
              ? "Tìm nhanh hồ sơ vụ việc, thông tin khách hàng, số CCCD (12 số), mã số thuế (10 số), tệp đính kèm hoặc văn bản pháp quy chỉ với một từ khóa." 
              : "Search legal cases, dynamic client profiles, ID cards, tax codes, attachments, legal forms, or judicial precedents instantly."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <Scale size={240} className="text-white absolute right-10 top-1/2 -translate-y-1/2 rotate-12" />
        </div>
      </div>

      {/* Main Input Control Bar */}
      <div className="p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-4 top-4 h-5 w-5 text-indigo-500" />
          <input
            type="text"
            className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
            placeholder={isVi 
              ? "Nhập CCCD (12 số), Mã số thuế (10 số), Tên khách hàng, Mã hồ sơ, Tiêu đề văn bản pháp luật..." 
              : "Enter CCCD/National ID, Tax ID, Client Name, Case ID, or legal document title..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults({ clients: [], cases: [], documents: [] }); }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quick Suggestion Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            {isVi ? "Gợi ý tra cứu:" : "Suggested queries:"}
          </span>
          {suggestedQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => clickSuggestion(item.text)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all font-semibold border border-slate-200 dark:border-slate-700/60 cursor-pointer flex items-center gap-1"
            >
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{item.text}</span>
              <span className="text-[10px] text-slate-400 font-normal">({item.label})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Notification for CCCD / Tax ID input */}
      {(isCccdSearch || isMstSearch) && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-3 animate-pulse">
          <AlertCircle size={16} className="text-indigo-500 shrink-0" />
          <div>
            <strong>{isVi ? "Nhận diện bộ lọc độc quyền:" : "Exclusive Identification Triggered:"}</strong>{" "}
            {isVi 
              ? `Hệ thống đang định danh hồ sơ khách hàng theo ${isCccdSearch ? "số CCCD (12 số)" : "mã số thuế doanh nghiệp (10 số)"}. Danh sách tất cả các vụ việc đi kèm của khách hàng sẽ được hiển thị và đếm tự động.`
              : `The system is lookup-matching client records by ${isCccdSearch ? "National ID Card (12-digit CCCD)" : "Enterprise Tax Code (10-digit MST)"}.`}
          </div>
        </div>
      )}

      {/* Results View Container */}
      <div className="space-y-6">
        {/* Results Filters & Counters */}
        {query.trim() && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-4">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <span>{isVi ? "Tất cả" : "All Results"}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${activeFilter === "all" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {totalResults}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter("clients")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "clients"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <User size={13} />
                <span>{isVi ? "Khách hàng" : "Clients"}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${activeFilter === "clients" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {totalClients}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter("cases")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "cases"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Folder size={13} />
                <span>{isVi ? "Hồ sơ vụ việc" : "Legal Cases"}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${activeFilter === "cases" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {totalCases}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter("documents")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "documents"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <FileText size={13} />
                <span>{isVi ? "Văn bản & Biểu mẫu" : "Docs & Forms"}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md ${activeFilter === "documents" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"}`}>
                  {totalDocs}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isVi 
                ? `Tìm thấy ${totalResults} bản ghi trong hệ thống cho từ khóa "${query}"` 
                : `Found ${totalResults} matching entries for "${query}"`}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <RefreshCw size={36} className="animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {isVi ? "Đang truy vấn hệ thống..." : "Querying database..."}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && query.trim() && totalResults === 0 && (
          <div className="py-16 text-center space-y-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10">
            <Inbox size={48} className="text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                {isVi ? "Không tìm thấy dữ liệu phù hợp" : "No matching records found"}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {isVi 
                  ? "Hãy kiểm tra lại độ chính xác của số CCCD/mã số thuế hoặc thử tìm kiếm với từ khóa ngắn gọn hơn." 
                  : "Double-check the CCCD/Tax code or try using a simplified client name."}
              </p>
            </div>
          </div>
        )}

        {/* Instructions / Initial State */}
        {!query.trim() && (
          <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
            <Search size={40} className="text-indigo-500/50 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-serif font-black text-slate-800 dark:text-slate-200 text-sm">
                {isVi ? "Bắt đầu tìm kiếm thông tin" : "Start typing to search"}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {isVi 
                  ? "Nhập từ khóa bất kỳ để bắt đầu tra cứu. Hệ thống hỗ trợ tìm kiếm mờ không dấu và truy cập trực tiếp hồ sơ khách hàng bằng CCCD hoặc Mã số thuế." 
                  : "Type any keyword to search. Search supports accent-insensitive queries and direct ID/Tax Number matching."}
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: CLIENTS DISPLAY */}
        {!loading && !error && (activeFilter === "all" || activeFilter === "clients") && totalClients > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <User size={14} className="text-blue-500" />
              <span>{isVi ? "Hồ Sơ Khách Hàng" : "Client Profiles"}</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {totalClients}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.clients.map((client, index) => (
                <div 
                  key={client.idCard || client.name || index}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 hover:border-indigo-500/50 transition duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif">
                          {client.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/30">
                          {isVi ? "Khách hàng" : "Client"}
                        </span>
                      </div>
                      
                      {/* Contacts details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-500 text-[11px] font-medium pt-1">
                        {client.idCard && (
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={11} className="text-slate-400" />
                            <span>CCCD: <strong className="text-slate-700 dark:text-slate-300 font-mono">{client.idCard}</strong></span>
                          </div>
                        )}
                        {client.taxId && (
                          <div className="flex items-center gap-1.5">
                            <Building size={11} className="text-slate-400" />
                            <span>MST: <strong className="text-slate-700 dark:text-slate-300 font-mono">{client.taxId}</strong></span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                            <Phone size={11} className="text-slate-400" />
                            <span>SĐT: <strong className="text-slate-700 dark:text-slate-300 font-mono">{client.phone}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl text-center border border-slate-100 dark:border-slate-800/80">
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">{client.totalDossiers}</div>
                      <div className="text-[9px] uppercase font-black tracking-wider text-slate-400">{isVi ? "Hồ sơ" : "Dossiers"}</div>
                    </div>
                  </div>

                  {/* List of associated dossiers */}
                  {client.dossiers && client.dossiers.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {isVi ? "Danh sách hồ sơ đi kèm:" : "Associated Dossiers List:"}
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                        {client.dossiers.map((d: any) => (
                          <div 
                            key={d.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-850/60 transition text-xs"
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">
                                  {d.id}
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 truncate" title={d.title}>
                                  {d.title}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                                <span>{d.category}</span>
                                <span>•</span>
                                <span>{d.date}</span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[10px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/30 px-1.5 py-0.5 rounded">
                                {d.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: CASES DISPLAY */}
        {!loading && !error && (activeFilter === "all" || activeFilter === "cases") && totalCases > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Folder size={14} className="text-indigo-500" />
              <span>{isVi ? "Hồ Sơ Vụ Việc & Tiến Độ" : "Legal Cases & Progress"}</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {totalCases}
              </span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-16 text-center">ID</th>
                    <th className="p-3">{isVi ? "Tên Hồ Sơ Vụ Việc" : "Case Title"}</th>
                    <th className="p-3">{isVi ? "Khách Hàng" : "Client"}</th>
                    <th className="p-3">{isVi ? "Phân Loại" : "Classification"}</th>
                    <th className="p-3 text-center">{isVi ? "Trạng Thái" : "Status"}</th>
                    <th className="p-3 text-right">{isVi ? "Phí Dịch Vụ" : "Total Fee"}</th>
                    <th className="p-3 text-center">{isVi ? "Luật sư chính" : "Assignee"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                  {results.cases.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                      <td className="p-3 font-mono text-center font-bold text-slate-500 dark:text-slate-400 select-all">
                        {record.id}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-200 font-bold leading-normal">{record.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ngày khởi tạo: {record.date || "N/A"}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-700 dark:text-slate-300 font-bold">{record.client || "N/A"}</div>
                        {record.clientIdCard && (
                          <div className="text-[10px] text-slate-400 font-mono">CCCD: {record.clientIdCard}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px]">
                          {record.category || "Dịch vụ"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20">
                          <CheckCircle size={10} />
                          <span>{record.status}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-800 dark:text-slate-100">
                        {record.revenue ? `${record.revenue.toLocaleString()}đ` : "Liên hệ"}
                      </td>
                      <td className="p-3 text-center text-slate-500 font-bold dark:text-slate-400">
                        {record.mainAssignee || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: DOCUMENTS DISPLAY */}
        {!loading && !error && (activeFilter === "all" || activeFilter === "documents") && totalDocs > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <FileText size={14} className="text-amber-500" />
              <span>{isVi ? "Văn Bản Pháp Luật, Án Lệ & Biểu Mẫu" : "Legal Documents, Judgments & Forms"}</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {totalDocs}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.documents.map((doc) => (
                <div 
                  key={doc.source + doc.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex gap-4 hover:border-amber-500/50 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <FileText size={18} />
                  </div>
                  
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="px-2 py-0.5 text-[9px] uppercase font-black tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                          {doc.source}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-2" title={doc.title}>
                          {doc.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-3 leading-relaxed">
                      {doc.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60 font-medium">
                      <span>Mã/Số: <strong className="text-slate-700 dark:text-slate-300 font-mono">{doc.code || "N/A"}</strong></span>
                      {doc.date && doc.date !== "N/A" && (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{doc.date}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
