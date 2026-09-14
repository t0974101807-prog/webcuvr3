import React, { useState, useEffect } from "react";
import {
  Brain,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  Edit3,
  Sliders,
  Layers,
  Database,
  History,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  UserCheck,
  Briefcase,
  BookOpen,
  Tag,
  ArrowUpRight,
  Filter,
  Check
} from "lucide-react";

export interface MemoryItem {
  id: number;
  user_email: string;
  memory_type: string;
  category: string;
  title: string;
  content: string;
  summary?: string;
  entity_type?: string;
  entity_id?: string;
  importance_score: number;
  confidence_score: number;
  access_count: number;
  last_accessed_at?: string;
  status: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AiMemoryInspectorProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const AiMemoryInspector: React.FC<AiMemoryInspectorProps> = ({
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [activeTab, setActiveTab] = useState<"memories" | "simulator" | "entities" | "reflections">("memories");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Recall Simulator state
  const [simQuery, setSimQuery] = useState<string>("Khách hàng Đô Thành muốn nhận báo cáo thế nào?");
  const [simResults, setSimResults] = useState<any[]>([]);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Add Memory Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("user_preference");
  const [newCategory, setNewCategory] = useState("legal_preference");
  const [newEntityType, setNewEntityType] = useState("SYSTEM");
  const [newEntityId, setNewEntityId] = useState("");
  const [newImportance, setNewImportance] = useState(0.8);
  const [newTags, setNewTags] = useState("pháp_lý, quy_chuẩn");

  // Fetch Memories and Stats
  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set("query", searchQuery);
      if (selectedType !== "all") queryParams.set("type", selectedType);
      if (selectedCategory !== "all") queryParams.set("category", selectedCategory);

      const [resMem, resStats] = await Promise.all([
        fetch(`/api/ai/memory?${queryParams.toString()}`),
        fetch("/api/ai/memory/stats")
      ]);

      if (resMem.ok) {
        const d = await resMem.json();
        setMemories(d.memories || []);
      }
      if (resStats.ok) {
        const s = await resStats.json();
        setStats(s.stats || {});
      }
    } catch (e) {
      console.error("Error fetching memory data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedType, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleRunSimulator = async () => {
    if (!simQuery.trim()) return;
    setSimLoading(true);
    try {
      const res = await fetch("/api/ai/memory/recall-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: simQuery, limit: 6 })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResults(data.results || []);
      }
    } catch (e) {
      console.error("Error testing recall:", e);
    } finally {
      setSimLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const res = await fetch("/api/ai/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          memory_type: newType,
          category: newCategory,
          entity_type: newEntityType,
          entity_id: newEntityId || null,
          importance_score: newImportance,
          tags: newTags.split(",").map(t => t.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewTitle("");
        setNewContent("");
        fetchData();
      }
    } catch (e) {
      console.error("Error saving memory:", e);
    }
  };

  const handleDeleteMemory = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn lưu trữ mẩu ký ức này?")) return;
    try {
      const res = await fetch(`/api/ai/memory/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error("Error deleting memory:", e);
    }
  };

  const handleConsolidate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/memory/consolidate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Đã hợp nhất bộ nhớ thành công!");
        fetchData();
      }
    } catch (e) {
      console.error("Error consolidating:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-memory-inspector-root" className={`bg-slate-900 text-slate-100 rounded-xl border border-slate-800 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen overflow-y-auto' : 'w-full shadow-lg'}`}>
      
      {/* Top Banner & Header */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">AI Cognitive Memory Hub</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                TencentDB / Mem0 Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400">Bộ nhớ dài hạn, thói quen tác nghiệp & tri thức nhận thức cho Legal OS Copilot</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleConsolidate}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
            title="Kích hoạt chu trình suy ngẫm và hợp nhất ký ức"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Hợp nhất Ký ức
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Ghi nhớ Mới
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title={isFullscreen ? "Thu nhỏ về giao diện thường" : "Xem toàn màn hình độc lập"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900/50 border-b border-slate-800/80">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Ký ức Hoạt động</span>
            <Database className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.total_active_memories || memories.length}</div>
          <div className="text-[10px] text-slate-500">Ký ức dài hạn được lập chỉ mục</div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Độ quan trọng TB</span>
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">{((stats.average_importance || 0.85) * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500">Mức ưu tiên nhận thức trung bình</div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Thực thể Tri thức</span>
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{stats.total_entities || 3}</div>
          <div className="text-[10px] text-slate-500">Khách hàng, Vụ án, Điều luật</div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Phân tích Đúc kết</span>
            <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400">{stats.total_reflections || 1}</div>
          <div className="text-[10px] text-slate-500">Quy tắc tự suy ngẫm (Reflections)</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
        <button
          onClick={() => setActiveTab("memories")}
          className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
            activeTab === "memories"
              ? "text-indigo-400 border-indigo-500 bg-slate-900/80"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Kho Ký ức ({memories.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("simulator");
            if (simResults.length === 0) handleRunSimulator();
          }}
          className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
            activeTab === "simulator"
              ? "text-indigo-400 border-indigo-500 bg-slate-900/80"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Mô phỏng Truy xuất (Recall Scoring)
        </button>

        <button
          onClick={() => setActiveTab("entities")}
          className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
            activeTab === "entities"
              ? "text-indigo-400 border-indigo-500 bg-slate-900/80"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Mạng lưới Thực thể (Entity Graph)
        </button>
      </div>

      {/* Main Tab Content Area */}
      <div className="p-4 flex-1">
        {/* TAB 1: MEMORIES LIST */}
        {activeTab === "memories" && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm ký ức, quy tắc, thói quen hoặc kinh nghiệm..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">Tất cả loại ký ức</option>
                <option value="user_preference">Sở thích & Thói quen</option>
                <option value="case_insight">Kinh nghiệm Vụ án</option>
                <option value="client_fact">Hồ sơ Khách hàng</option>
                <option value="decision_pattern">Quy tắc Ra quyết định</option>
                <option value="semantic">Tri thức Ngữ nghĩa</option>
                <option value="episodic">Sự kiện Từng diễn ra</option>
              </select>

              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                Lọc
              </button>
            </form>

            {/* Memory Items Grid */}
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                Đang tải dữ liệu ký ức...
              </div>
            ) : memories.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 text-slate-400 text-xs">
                Không tìm thấy mẩu ký ức nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {memories.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            m.memory_type === 'user_preference' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            m.memory_type === 'case_insight' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            m.memory_type === 'client_fact' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            m.memory_type === 'decision_pattern' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {m.memory_type}
                          </span>
                          {m.entity_type && m.entity_type !== "SYSTEM" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {m.entity_type}: {m.entity_id || "N/A"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-amber-400 font-mono font-medium">
                            ★ {(m.importance_score * 100).toFixed(0)}%
                          </span>
                          <button
                            onClick={() => handleDeleteMemory(m.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition rounded"
                            title="Lưu trữ / Xóa ký ức"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-white mb-1">{m.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2 line-clamp-3">{m.content}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-1 flex-wrap">
                        {m.tags && m.tags.map((t, idx) => (
                          <span key={idx} className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <div>Truy xuất: {m.access_count} lần</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECALL SIMULATOR */}
        {activeTab === "simulator" && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-semibold text-indigo-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Bộ giải mã Thuật toán Nhận thức (Cognitive Formula Simulation)
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Công thức xếp hạng: <code className="text-amber-300 font-mono">Score = (Similarity × 0.50) + (Importance × 0.30) + (RecencyDecay × 0.15) + (AccessCount × 0.05)</code>
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={simQuery}
                  onChange={(e) => setSimQuery(e.target.value)}
                  placeholder="Nhập câu hỏi để thử nghiệm thuật toán truy xuất bộ nhớ..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleRunSimulator}
                  disabled={simLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Truy xuất
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400">Kết quả ký ức được AI ưu tiên nạp vào ngữ cảnh ({simResults.length}):</h4>
              {simResults.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/30 rounded-lg">
                  Không có ký ức nào vượt qua ngưỡng kích hoạt nhận thức (min_score: 0.25).
                </div>
              ) : (
                simResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/70 border border-indigo-950 hover:border-indigo-800 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 text-[10px] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">{item.memory.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{item.memory.memory_type}</span>
                      </div>
                      <p className="text-xs text-slate-300">{item.memory.content}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800 shrink-0">
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500">Tương đồng</div>
                        <div className="text-xs font-bold text-cyan-400 font-mono">{(item.relevanceScore * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500">Quan trọng</div>
                        <div className="text-xs font-bold text-amber-400 font-mono">{(item.importanceScore * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500">Độ mới</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono">{(item.recencyScore * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center pl-2 border-l border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold">Điểm Tổng</div>
                        <div className="text-sm font-black text-indigo-400 font-mono">{item.score}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ENTITY GRAPH */}
        {activeTab === "entities" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400">ORGANIZATION</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Khách hàng VIP</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Tập đoàn Bất động sản Đô Thành</h4>
                <p className="text-xs text-slate-400 mb-2">Người liên hệ chính: Trần Đình Toàn (Trưởng phòng Pháp chế).</p>
                <div className="text-[11px] text-indigo-400 font-mono">Quan hệ: CLIENT_OF → Ánh Dương Law (0.95)</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-400">LAW</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">31/2024/QH15</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Luật Đất đai 2024</h4>
                <p className="text-xs text-slate-400 mb-2">Quy định chế độ sở hữu, quản lý và sử dụng đất đai có hiệu lực từ 01/08/2024.</p>
                <div className="text-[11px] text-indigo-400 font-mono">Quan hệ: GOVERNS → Hòa giải tranh chấp đất đai</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-400">LAW</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">92/2015/QH13</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Bộ luật Tố tụng Dân sự 2015</h4>
                <p className="text-xs text-slate-400 mb-2">Điều chỉnh trình tự, thủ tục khởi kiện và giải quyết vụ án dân sự.</p>
                <div className="text-[11px] text-indigo-400 font-mono">Quan hệ: REGULATES → Chuẩn văn bản tố tụng</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Thêm Ký ức mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                Ghi nhớ Ký ức / Thói quen vào AI Long-term Memory
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tiêu đề mẩu ký ức</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Thói quen soạn thảo của Luật sư Hùng"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nội dung chi tiết</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Nội dung bài học kinh nghiệm, thói quen hoặc quy tắc cần ghi nhớ..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Loại Ký ức</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    <option value="user_preference">Sở thích & Thói quen</option>
                    <option value="case_insight">Kinh nghiệm Vụ án</option>
                    <option value="client_fact">Hồ sơ Khách hàng</option>
                    <option value="decision_pattern">Quy tắc Ra quyết định</option>
                    <option value="semantic">Tri thức Ngữ nghĩa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Mã thực thể (nếu có)</label>
                  <input
                    type="text"
                    value={newEntityId}
                    onChange={(e) => setNewEntityId(e.target.value)}
                    placeholder="HS-2026-001 hoặc KH-01"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Mức độ quan trọng ({((newImportance || 0.8) * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={newImportance}
                  onChange={(e) => setNewImportance(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Thẻ nhãn (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Lưu Ký ức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
