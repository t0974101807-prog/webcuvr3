import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Plus,
  Trash2,
  Sparkles,
  Save,
  CheckCircle,
  FileText,
  Search,
  BookOpen,
  Send,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  Settings
} from "lucide-react";
import { AiProviderManager } from "./AiProviderManager";
import AiEcosystemTools from "./AiEcosystemTools";

interface TrainingRule {
  id: number;
  topic: string;
  pattern: string;
  response: string;
  created_at: string;
}

interface AITrainingStudioProps {
  language?: "vi" | "en";
  fetchApi?: (url: string, options?: any) => Promise<Response>;
}

export const AITrainingStudio: React.FC<AITrainingStudioProps> = ({ language = "vi", fetchApi }) => {
  const [activeTab, setActiveTab] = useState<"fine_tuning" | "providers_center" | "ai_ecosystem">("fine_tuning");
  const [rules, setRules] = useState<TrainingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add Rule Form
  const [topic, setTopic] = useState("");
  const [pattern, setPattern] = useState("");
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Sandbox Test State
  const [testPrompt, setTestPrompt] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // System Persona Settings
  const [systemPersona, setSystemPersona] = useState(
    "Bạn là Trợ lý AI Siêu việt của Ánh Dương Law Firm. Bạn trả lời chuyên nghiệp, chính xác, sử dụng ngôn từ chuẩn mực pháp lý Việt Nam."
  );
  const [disclaimer, setDisclaimer] = useState(
    "Thông tin do Trợ lý AI cung cấp mang tính chất tham khảo chuyên môn nội bộ. Cần có sự phê duyệt của Luật sư trước khi ban hành cho khách hàng."
  );

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/training");
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (e) {
      console.error("Failed to fetch training rules:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !pattern.trim() || !response.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ai/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, pattern, response })
      });
      if (res.ok) {
        setTopic("");
        setPattern("");
        setResponse("");
        setSuccessMsg("Đã bổ sung quy tắc huấn luyện AI mới thành công!");
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchRules();
      }
    } catch (e) {
      console.error("Error adding training rule:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa quy tắc huấn luyện này?")) return;
    try {
      const res = await fetch(`/api/ai/training/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRules();
      }
    } catch (e) {
      console.error("Error deleting training rule:", e);
    }
  };

  const handleTestTraining = async () => {
    if (!testPrompt.trim()) return;
    setIsTesting(true);
    setTestOutput("");
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: testPrompt })
      });
      const data = await res.json();
      if (data.text) {
        setTestOutput(data.text);
      } else if (data.error) {
        setTestOutput(`[Lỗi]: ${data.error}`);
      }
    } catch (e: any) {
      setTestOutput(`[Lỗi kết nối]: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.response.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab("fine_tuning")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "fine_tuning"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BrainCircuit size={16} />
          <span>Huấn Luyện Tri Thức AI (RAG & Rules)</span>
        </button>

        <button
          onClick={() => setActiveTab("providers_center")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "providers_center"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Cpu size={16} />
          <span>Cấu Hình AI Multi-Model Platform (Gemini, ChatGPT, Claude, DeepSeek...)</span>
        </button>

        <button
          onClick={() => setActiveTab("ai_ecosystem")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ai_ecosystem"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles size={16} />
          <span>Công Cụ AI Nâng Cao (GitHub Labs)</span>
        </button>
      </div>

      {activeTab === "ai_ecosystem" ? (
        <AiEcosystemTools language={language} />
      ) : activeTab === "providers_center" ? (
        <AiProviderManager fetchApi={fetchApi} language={language} />
      ) : (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <BrainCircuit size={18} />
                <span>AI Fine-Tuning & Knowledge Engine</span>
              </div>
              <h2 className="text-xl font-bold font-serif">Huấn Luyện & Tùy Chỉnh Trợ Lý AI</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Cung cấp tri thức pháp lý đặc thù, quy trình nghiệp vụ nội bộ, biểu mẫu chuẩn và cách phản hồi cho Trợ lý AI Ánh Dương Law. Dữ liệu huấn luyện sẽ được đưa trực tiếp vào RAG Context.
              </p>
            </div>

            <div className="bg-indigo-600/20 border border-indigo-400/30 px-4 py-2.5 rounded-xl text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">Tổng số Quy tắc Đã Học</span>
              <span className="text-2xl font-extrabold text-white font-mono">{rules.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Manage Trained Rules & Add Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Form: Add New Training Rule */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b pb-3 border-slate-100">
                  <Plus size={16} className="text-indigo-600" />
                  <span>Thêm Bài Học / Quy Tắc Huấn Luyện Mới</span>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAddRule} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Chủ đề / Quy trình (Topic)</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ví dụ: Quy trình nộp đơn khởi kiện vụ án dân sự"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Từ khóa / Câu hỏi nhận diện (Trigger Pattern)</label>
                    <input
                      type="text"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      placeholder="Ví dụ: quy trình nộp đơn khởi kiện, các bước nộp đơn tòa án"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nội dung câu trả lời chuẩn (Trained Output)</label>
                    <textarea
                      rows={4}
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Nhập nội dung quy trình, căn cứ pháp lý hoặc hướng dẫn chuẩn mà AI cần phản hồi cho người dùng..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting || !topic.trim() || !pattern.trim() || !response.trim()}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                        isSubmitting || !topic.trim() || !pattern.trim() || !response.trim()
                          ? "bg-slate-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-500"
                      }`}
                    >
                      <Save size={14} />
                      <span>{isSubmitting ? "Đang lưu..." : "Lưu Bài Học Vào AI Engine"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List: Existing Trained Rules */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <BookOpen size={16} className="text-indigo-600" />
                    <span>Kho Tri Thức Đã Huấn Luyện ({filteredRules.length})</span>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm bài học..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
                    />
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-indigo-600" />
                    <span>Đang tải kho tri thức AI...</span>
                  </div>
                ) : filteredRules.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    Chưa có bài học nào khớp với từ khóa tìm kiếm.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {filteredRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 transition-all bg-slate-50/50 space-y-2 relative group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-bold text-[10px] uppercase tracking-wider inline-block">
                              {rule.topic}
                            </span>
                            <div className="text-[11px] text-slate-500 font-mono mt-1">
                              Pattern: <span className="font-semibold text-slate-700">{rule.pattern}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa bài học này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed font-sans whitespace-pre-wrap">
                          {rule.response}
                        </p>

                        <div className="text-[10px] text-slate-400 text-right font-mono">
                          Ngày cập nhật: {new Date(rule.created_at).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right 1 Col: AI Sandbox & Test Output */}
            <div className="space-y-6">
              {/* Interactive Sandbox Test */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-3">
                  <Sparkles size={16} />
                  <span>Kiểm Thử Trực Tiếp (AI Sandbox)</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Đặt câu hỏi thử nghiệm để kiểm tra xem Trợ lý AI có áp dụng đúng tri thức vừa được huấn luyện hay không.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Câu hỏi kiểm thử</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={testPrompt}
                        onChange={(e) => setTestPrompt(e.target.value)}
                        placeholder="Ví dụ: Quy trình tiếp nhận khách hàng mới thế nào?"
                        className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={handleTestTraining}
                        disabled={isTesting || !testPrompt.trim()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer disabled:bg-slate-800"
                      >
                        <Send size={13} className={isTesting ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Kết quả Trả lời từ AI:</span>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 min-h-[160px] text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap shadow-inner overflow-y-auto max-h-64">
                      {isTesting ? (
                        <div className="text-indigo-400 flex items-center justify-center h-full gap-2 italic">
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Đang đối chiếu dữ liệu RAG & Tạo phản hồi...</span>
                        </div>
                      ) : testOutput ? (
                        testOutput
                      ) : (
                        <span className="text-slate-600 italic">Nhập câu hỏi phía trên và nhấn nút Gửi để kiểm tra phản hồi.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Persona & Tone Customizer */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-3">
                  <BrainCircuit size={15} className="text-indigo-600" />
                  <span>Cấu hình Tính Cách & Khước Từ</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Chỉ thị hệ thống (System Prompt Persona)</label>
                    <textarea
                      rows={3}
                      value={systemPersona}
                      onChange={(e) => setSystemPersona(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-sans outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Cảnh báo miễn trừ trách nhiệm pháp lý</label>
                    <textarea
                      rows={2}
                      value={disclaimer}
                      onChange={(e) => setDisclaimer(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-sans outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() => alert("Đã cập nhật cấu hình Chỉ thị Hệ thống & Cảnh báo pháp lý!")}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cập Nhật Chỉ Thị Hệ Thống
                  </button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};
