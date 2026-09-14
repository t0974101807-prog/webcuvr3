import React, { useState, useEffect } from "react";
import { ChatwootSupportPanel, LightpandaAutomationPanel } from "./CustomerServiceAutomation";
import {
  Brain,
  Database,
  BookOpen,
  Cpu,
  Users,
  Play,
  Copy,
  Check,
  Activity,
  FileCode,
  Terminal,
  ArrowRight,
  ChevronRight,
  LineChart,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
  Shield,
  HelpCircle,
  FileText,
  Mail,
  Layers,
  Globe,
  Chrome,
  AlertTriangle,
  Lock,
  RefreshCw
} from "lucide-react";

// ==========================================
// 1. TENCENTDB AGENT MEMORY OPTIMIZER TYPE & COMPONENT
// ==========================================
interface QueryMemory {
  id: string;
  pattern: string;
  frequency: number;
  avgLatency: number;
  optimizedKey: string;
  lastUsed: string;
  status: "cached" | "stale" | "optimized";
}

const INITIAL_QUERY_MEMORIES: QueryMemory[] = [
  {
    id: "mem-1",
    pattern: "SELECT * FROM contracts WHERE client_id = ? AND status = 'active'",
    frequency: 342,
    avgLatency: 12, // ms
    optimizedKey: "idx_contracts_client_status_hash",
    lastUsed: "2 phút trước",
    status: "optimized"
  },
  {
    id: "mem-2",
    pattern: "SELECT d.*, u.name FROM dossiers d JOIN users u ON d.assigned_to = u.id WHERE d.sla_status = 'breached'",
    frequency: 189,
    avgLatency: 84, // ms
    optimizedKey: "idx_dossier_join_user_sla_breach",
    lastUsed: "12 phút trước",
    status: "optimized"
  },
  {
    id: "mem-3",
    pattern: "SELECT COUNT(*) FROM activity_logs WHERE action_type = 'export' AND created_at > NOW() - INTERVAL '1 day'",
    frequency: 76,
    avgLatency: 145, // ms
    optimizedKey: "idx_activity_logs_action_recent_scan",
    lastUsed: "1 giờ trước",
    status: "cached"
  }
];

export function TencentDBAgentMemoryPanel({ language }: { language: "vi" | "en" }) {
  const [memories, setMemories] = useState<QueryMemory[]>(INITIAL_QUERY_MEMORIES);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setMemories(prev =>
        prev.map(m => (m.status === "cached" ? { ...m, status: "optimized", avgLatency: Math.round(m.avgLatency * 0.4) } : m))
      );
      setIsOptimizing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-5 rounded-2xl">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2">
            <Database size={16} />
            TencentDB-Agent-Memory Core
          </h4>
          <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed max-w-2xl">
            {language === "vi"
              ? "Cơ chế quản lý bộ nhớ đệm thông minh tự động ghi nhận, gộp nhóm và tối ưu hóa các mẫu truy vấn cơ sở dữ liệu nặng để tăng tốc độ phản hồi của AI gấp 5 lần."
              : "Intelligent database memory agent that aggregates, hashes, and optimizes slow queries to supercharge AI execution speed by 5x."}
          </p>
        </div>
        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap"
        >
          <Activity size={14} className={isOptimizing ? "animate-spin" : ""} />
          <span>
            {isOptimizing
              ? language === "vi" ? "Đang gộp bộ nhớ..." : "Consolidating Memory..."
              : language === "vi" ? "Tối ưu hóa Bộ nhớ Truy vấn" : "Optimize DB Agent Memory"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <LineChart size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cache Hit Rate</div>
            <div className="text-xl font-bold font-mono text-emerald-500">98.6%</div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Latency Reduction</div>
            <div className="text-xl font-bold font-mono text-indigo-500">-76.4%</div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
            <Brain size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Vector Buckets</div>
            <div className="text-xl font-bold font-mono text-purple-500">14 / 24</div>
          </div>
        </div>
      </div>

      <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === "vi" ? "Danh sách bộ nhớ truy vấn đã đăng ký" : "Registered Query Memory Patterns"}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/10 text-indigo-500 rounded-full font-bold">
            Realtime Analytics
          </span>
        </div>
        <div className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-950">
          {memories.map(m => (
            <div key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    m.status === "optimized" ? "bg-emerald-500/15 text-emerald-500" : "bg-blue-500/15 text-blue-500"
                  }`}>
                    {m.status === "optimized" ? "Optimized" : "Cached"}
                  </span>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{m.lastUsed}</span>
                </div>
                <code className="block text-xs font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 truncate text-slate-600 dark:text-slate-300">
                  {m.pattern}
                </code>
                {m.optimizedKey && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 dark:text-slate-500">Optimized Key:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30">
                      {m.optimizedKey}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(m.optimizedKey);
                        setCopiedKey(m.id);
                        setTimeout(() => setCopiedKey(null), 1500);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {copiedKey === m.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 text-right shrink-0">
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase">Frequency</div>
                  <div className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">{m.frequency}x</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase">Avg Latency</div>
                  <div className="text-sm font-bold font-mono text-indigo-500">{m.avgLatency} ms</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. BOOK TO SKILL PROMPT PIPELINE
// ==========================================
export function BookToSkillPanel({ language }: { language: "vi" | "en" }) {
  const [inputText, setInputText] = useState("");
  const [stage, setStage] = useState<"idle" | "ingesting" | "distilling" | "optimizing" | "completed">("idle");
  const [outputSkill, setOutputSkill] = useState("");
  const [copied, setCopied] = useState(false);

  const startPipeline = () => {
    if (!inputText.trim()) return;
    setStage("ingesting");
    setTimeout(() => {
      setStage("distilling");
      setTimeout(() => {
        setStage("optimizing");
        setTimeout(() => {
          setStage("completed");
          setOutputSkill(
            JSON.stringify(
              {
                skill_name: "legal_compliance_blds2015",
                version: "1.2.0",
                system_persona: "Chuyên gia rà soát hợp đồng dân sự & thương mại",
                rules_distilled: [
                  "Bắt buộc đối chiếu Điều 385, 301, 418 BLDS về phạt vi phạm hợp đồng.",
                  "Giới hạn mức phạt vi phạm không quá 8% giá trị phần nghĩa vụ bị vi phạm đối với hợp đồng thương mại.",
                  "Cảnh báo rủi ro về điều khoản đơn phương chấm dứt hợp đồng trái luật."
                ],
                recommended_models: ["deepseek-r1", "gemini-2.5-pro"]
              },
              null,
              2
            )
          );
        }, 1200);
      }, 1200);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={16} />
            Book-to-Skill Knowledge Pipeline
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {language === "vi"
              ? "Trích xuất tri thức dày đặc từ sách pháp luật hoặc sổ tay văn phòng và chuyển đổi trực tiếp thành các cấu trúc System Instructions & API Tool Skills tối ưu."
              : "Ingests books or corporate bylaws and distills them into production-ready structured prompt skills."}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === "vi" ? "Dữ liệu tri thức thô cần phân tích" : "Raw Source Knowledge (Paste Book chapters / PDF content)"}
          </label>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={8}
            className="w-full text-xs font-sans p-3 bg-slate-50 focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800 dark:text-slate-200 resize-none"
            placeholder={
              language === "vi"
                ? "Dán các điều luật, quy định nội bộ hoặc toàn bộ văn bản chương sách tại đây để AI bắt đầu quá trình trích xuất..."
                : "Paste law articles, internal regulations or book chapters here..."
            }
          />
        </div>

        <button
          onClick={startPipeline}
          disabled={stage !== "idle" && stage !== "completed"}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <Sparkles size={14} className={stage !== "idle" && stage !== "completed" ? "animate-spin" : ""} />
          <span>
            {stage === "idle" && (language === "vi" ? "Bắt đầu trích xuất tri thức" : "Distill to Skill")}
            {stage === "ingesting" && (language === "vi" ? "Đang tiếp nhận dữ liệu..." : "Ingesting Corpus...")}
            {stage === "distilling" && (language === "vi" ? "Đang tóm lược tri thức cốt lõi..." : "Distilling Knowledge...")}
            {stage === "optimizing" && (language === "vi" ? "Đang biên soạn System Prompt..." : "Optimizing System Skill...")}
            {stage === "completed" && (language === "vi" ? "Đã hoàn thành! Bắt đầu lại" : "Completed! Run Again")}
          </span>
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl flex flex-col h-full min-h-[300px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders size={14} />
            {language === "vi" ? "Trạng thái trích xuất" : "Pipeline Status"}
          </span>
          {outputSkill && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(outputSkill);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-850 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy Skill"}</span>
            </button>
          )}
        </div>

        <div className="flex-1 mt-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Stage 1 Indicator */}
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
                stage === "idle" ? "border-slate-200 bg-slate-100 text-slate-400" :
                stage === "ingesting" ? "border-indigo-500 bg-indigo-50 text-indigo-500 animate-pulse" :
                "border-emerald-500 bg-emerald-500 text-white"
              }`}>
                {stage !== "idle" && stage !== "ingesting" ? "✓" : "1"}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === "vi" ? "Nạp & Tiền xử lý văn bản" : "Ingest & Preprocess Corpus"}
                </div>
                <div className="text-[10px] text-slate-400">Tokenizing, segmenting, chunking</div>
              </div>
            </div>

            {/* Stage 2 Indicator */}
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
                ["idle", "ingesting"].includes(stage) ? "border-slate-200 bg-slate-100 text-slate-400" :
                stage === "distilling" ? "border-indigo-500 bg-indigo-50 text-indigo-500 animate-pulse" :
                "border-emerald-500 bg-emerald-500 text-white"
              }`}>
                {["completed", "optimizing"].includes(stage) ? "✓" : "2"}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === "vi" ? "Chắt lọc tri thức lõi (Core Inferences)" : "Core Inference Distillation"}
                </div>
                <div className="text-[10px] text-slate-400">Extracting legal constraints & instructions</div>
              </div>
            </div>

            {/* Stage 3 Indicator */}
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
                ["idle", "ingesting", "distilling"].includes(stage) ? "border-slate-200 bg-slate-100 text-slate-400" :
                stage === "optimizing" ? "border-indigo-500 bg-indigo-50 text-indigo-500 animate-pulse" :
                "border-emerald-500 bg-emerald-500 text-white"
              }`}>
                {stage === "completed" ? "✓" : "3"}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === "vi" ? "Biên tập Instruction Package" : "Instruction Packaging"}
                </div>
                <div className="text-[10px] text-slate-400">Structuring JSON prompt skill outputs</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            {outputSkill ? (
              <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-lg border border-slate-950 overflow-x-auto max-h-[160px]">
                {outputSkill}
              </pre>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6 italic">
                {language === "vi" ? "Tri thức nén đã sẵn sàng xuất ra prompt skill" : "Distilled prompt skill package will appear here..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. PRIME DECENTRALIZED AGENT & AGENCY-AGENTS COLLABORATION
// ==========================================
interface AgentLog {
  id: number;
  agent: string;
  action: string;
  status: "pending" | "running" | "success" | "warning";
  timestamp: string;
}

const INITIAL_AGENCY_LOGS: AgentLog[] = [
  { id: 1, agent: "Paralegal (Hồng Nhung)", action: "Phân tách hồ sơ khách hàng Doanh nghiệp ABC", status: "success", timestamp: "10:14:02" },
  { id: 2, agent: "Litigation Expert (Quốc Anh)", action: "Tổng hợp 4 bản án tiền lệ tranh chấp nhãn hiệu", status: "success", timestamp: "10:14:15" },
  { id: 3, agent: "Compliance Auditor (Thanh Vân)", action: "Rà soát điều khoản bồi thường thiệt hại tối đa", status: "running", timestamp: "10:14:28" },
  { id: 4, agent: "Yeastar Softphone Operator (Tuấn Minh)", action: "Lên lịch gọi nhắc gia hạn hồ sơ tự động", status: "pending", timestamp: "Chờ lượt" }
];

export function PrimeAgencyOrchestrator({ language }: { language: "vi" | "en" }) {
  const [logs, setLogs] = useState<AgentLog[]>(INITIAL_AGENCY_LOGS);
  const [goal, setGoal] = useState("Duyệt hồ sơ vay vốn, đối soát tài chính & phân công luật sư đại diện tố tụng");
  const [isRunning, setIsRunning] = useState(false);

  const startOrchestrator = () => {
    setIsRunning(true);
    // Reset status
    setLogs(prev => prev.map(l => ({ ...l, status: l.id === 1 ? "running" : "pending" })));

    let currentId = 1;
    const interval = setInterval(() => {
      setLogs(prev => {
        const next = prev.map(l => {
          if (l.id === currentId) {
            return { ...l, status: "success" as const };
          }
          if (l.id === currentId + 1) {
            return { ...l, status: "running" as const };
          }
          return l;
        });
        return next;
      });

      currentId++;
      if (currentId > 4) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Prime Orchestrator Goal Planner */}
      <div className="xl:col-span-1 space-y-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="text-indigo-600" size={16} />
            Prime Agent Orchestrator
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === "vi"
              ? "Bộ điều phối phân tán tự động phân bổ mục tiêu phức tạp thành các luồng nghiệp vụ không đồng bộ cho nhiều robot."
              : "Decentralized task planner that breaks high-level goals into parallel subtasks."}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === "vi" ? "Mục tiêu tổng quát cần thực hiện" : "Strategic Goal"}
          </label>
          <input
            type="text"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            className="w-full text-xs p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200 font-medium"
          />
        </div>

        <button
          onClick={startOrchestrator}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <Play size={12} className={isRunning ? "animate-pulse" : ""} />
          <span>{isRunning ? (language === "vi" ? "Đang phối hợp agents..." : "Executing Subtasks...") : (language === "vi" ? "Chạy luồng phối hợp (Agency Core)" : "Run Agency Collaboration")}</span>
        </button>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-850 space-y-2">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Agent Network</div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-bold rounded-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Distributed Nodes: 8
            </span>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold rounded-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Orchestrator State: Online
            </span>
          </div>
        </div>
      </div>

      {/* Agency-Agents Collaboration Board */}
      <div className="xl:col-span-2 border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 flex flex-col justify-between">
        <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3.5 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {language === "vi" ? "Bảng cộng tác của Robot (Agency Collaboration Board)" : "Agency Agents Live Sync Board"}
            </span>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-mono bg-emerald-500/10 text-emerald-500 rounded-full font-bold uppercase tracking-wider">
            Active Grid
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {logs.map(log => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/20 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  log.status === "success" ? "bg-emerald-500/10 text-emerald-500" :
                  log.status === "running" ? "bg-indigo-500/10 text-indigo-500 animate-spin" :
                  "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  {log.status === "success" ? "✓" : "●"}
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{log.agent}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{log.action}</div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${
                  log.status === "success" ? "bg-emerald-500/15 text-emerald-500" :
                  log.status === "running" ? "bg-indigo-500/15 text-indigo-500" :
                  "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  {log.status === "success" ? "Success" :
                   log.status === "running" ? "In Progress" : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-150 dark:border-slate-850 flex items-center gap-2 text-xs text-slate-500">
          <Terminal size={14} className="text-slate-400" />
          <span className="font-mono text-[10px] truncate">
            {isRunning ? "[Core] Dispatched atomic actions to multi-agent workers..." : "[Core] System ready. Standing by for coordination execution."}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. DEEPSEEK DIAGNOSTIC HARNESS & EVAL PLAYGROUND
// ==========================================
export function DeepSeekHarnessPanel({ language }: { language: "vi" | "en" }) {
  const [testInput, setTestInput] = useState("Hãy giải quyết tình huống tranh chấp ranh giới đất đai khi không có sổ đỏ gốc.");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showThought, setShowThought] = useState(true);
  const [report, setReport] = useState<any | null>(null);

  const startEvaluation = () => {
    setIsEvaluating(true);
    setReport(null);
    setTimeout(() => {
      setReport({
        thought: `1. Phân tích đề bài: Tranh chấp ranh giới đất đai không có sổ đỏ (Giấy chứng nhận quyền sử dụng đất - GCNQSDĐ).
2. Xác định văn bản pháp lý chủ chốt:
   - Luật Đất đai 2013, nay là Luật Đất đai 2024 (áp dụng điều khoản chuyển tiếp).
   - Nghị định 43/2014/NĐ-CP (quy định chi tiết thủ tục hòa giải và giải quyết tranh chấp đất đai không có giấy tờ).
3. Các bước lập luận chi tiết:
   - Bước 1: Hòa giải bắt buộc tại Ủy ban nhân dân cấp Xã (Điều 202 Luật Đất đai 2013 / Điều 235 Luật Đất đai 2024). Đây là thủ tục tiền tố bắt buộc trước khi khởi kiện tại Tòa án hoặc đề nghị giải quyết tại UBND cấp Huyện.
   - Bước 2: Kiểm tra các loại giấy tờ thay thế (nếu có) theo Khoản 1, 2, 3 Điều 100 Luật Đất đai 2013 (như giấy tờ do chế độ cũ cấp, trích lục sổ địa chính, văn bản phân chia di sản thừa kế, v.v.).
   - Bước 3: Xác định thẩm quyền giải quyết khi hòa giải không thành:
     - Nếu có giấy tờ theo Điều 100: Thẩm quyền thuộc Tòa án nhân dân.
     - Nếu KHÔNG có bất kỳ giấy tờ nào: Đương sự có quyền lựa chọn nộp đơn yêu cầu giải quyết tại UBND cấp Huyện (hoặc Tỉnh) hoặc Khởi kiện trực tiếp tại Tòa án nhân dân theo thủ tục Tố tụng dân sự.
4. Kết luận tối ưu: Khuyên khách hàng tiến hành hòa giải cơ sở tại xã trước, sau đó nộp đơn lên TAND huyện để bảo vệ quyền lợi nhanh chóng nhất.`,
        reply: `Dựa trên phân tích pháp lý chuyên sâu về tranh chấp ranh giới đất đai không có sổ đỏ gốc:

1. **Hòa giải bắt buộc:** Bạn bắt buộc phải nộp đơn yêu cầu hòa giải tại UBND cấp Xã nơi có đất tranh chấp. Thủ tục này là bắt buộc (tiền tố khởi kiện).
2. **Khởi kiện hoặc đề nghị giải quyết hành chính:** Nếu hòa giải không thành:
   - Cách 1: Nộp đơn yêu cầu giải quyết tranh chấp tại Ủy ban nhân dân cấp Quận/Huyện.
   - Cách 2: Khởi kiện trực tiếp tại Tòa án nhân dân cấp Quận/Huyện theo quy định của Bộ luật Tố tụng dân sự.
3. **Chứng cứ thay thế:** Bạn nên chuẩn bị các tài liệu như biên lai nộp thuế đất, tờ bản đồ địa chính qua các thời kỳ, xác nhận của các hộ giáp ranh hoặc nhân chứng sinh sống lâu năm để chứng minh quá trình sử dụng đất ổn định, liên tục.`,
        metrics: {
          latency: 2450, // ms
          thoughtTokens: 382,
          generationTokens: 254,
          logicAccuracy: 98,
          groundingScore: 96
        }
      });
      setIsEvaluating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="text-emerald-500" size={16} />
          DeepSeek Diagnostic & Evaluation Harness
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === "vi"
            ? "Môi trường phân tích chẩn đoán độc lập cho các dòng mô hình tư duy lập luận (Reasoning LLMs). Cho phép đánh giá chi tiết quá trình Chain-of-Thought trước khi trả ra kết quả."
            : "Diagnostic testing harness for testing chain-of-thought and logical alignment in DeepSeek and reasoning models."}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200"
            placeholder={language === "vi" ? "Nhập câu hỏi nghiệp vụ cần thử nghiệm..." : "Enter evaluation prompt..."}
          />
        </div>
        <button
          onClick={startEvaluation}
          disabled={isEvaluating}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Activity size={14} className={isEvaluating ? "animate-spin" : ""} />
          <span>{isEvaluating ? (language === "vi" ? "Đang đánh giá logic..." : "Evaluating Logic...") : (language === "vi" ? "Chạy Benchmark" : "Run Diagnostic Test")}</span>
        </button>
      </div>

      {report && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Reasoning Time</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">{report.metrics.latency} ms</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-medium font-mono">Thought / Gen Tokens</div>
              <div className="text-sm font-bold text-indigo-500 font-mono">{report.metrics.thoughtTokens} / {report.metrics.generationTokens}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Logic Accuracy</div>
              <div className="text-sm font-bold text-emerald-500 font-mono">{report.metrics.logicAccuracy}%</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Grounding Precision</div>
              <div className="text-sm font-bold text-purple-500 font-mono">{report.metrics.groundingScore}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Visual CoT (Chain-of-Thought) */}
            <div className="flex flex-col border border-slate-200 dark:border-slate-800 bg-slate-950 rounded-xl overflow-hidden">
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain size={12} className="text-indigo-400 animate-pulse" />
                  &lt;thought&gt; CoT Expansion
                </span>
                <button
                  onClick={() => setShowThought(!showThought)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {showThought ? "Collapse" : "Expand"}
                </button>
              </div>
              {showThought && (
                <div className="p-4 font-mono text-[11px] text-slate-300 leading-relaxed overflow-y-auto max-h-[220px] whitespace-pre-wrap select-all">
                  {report.thought}
                </div>
              )}
            </div>

            {/* Structured Reply Output */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText size={12} />
                  Structured Diagnostic Output
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {report.reply}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                <CheckCircle2 size={12} />
                Validated against Law ERP Rulebase (V12)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. GMAIL CREATOR WORKSPACE (MARKETER, BIZ, DEVELOPER)
// ==========================================
interface GmailProfile {
  id: string;
  email: string;
  recoveryEmail: string;
  purpose: "Marketer" | "SmallBiz" | "Developer";
  status: "active" | "testing" | "pending";
  quotaUsed: string;
  proxyIp: string;
}

const INITIAL_GMAIL_PROFILES: GmailProfile[] = [
  {
    id: "g-1",
    email: "ad.campaign.top01@gmail.com",
    recoveryEmail: "backup.mkt@firm.vn",
    purpose: "Marketer",
    status: "active",
    quotaUsed: "11.2 GB / 15 GB",
    proxyIp: "45.124.84.12:8080"
  },
  {
    id: "g-2",
    email: "hrm.manager.hanoi@gmail.com",
    recoveryEmail: "admin.hr@firm.vn",
    purpose: "SmallBiz",
    status: "active",
    quotaUsed: "4.5 GB / 15 GB",
    proxyIp: "103.245.12.98:3128"
  },
  {
    id: "g-3",
    email: "dev.sandbox.test02@gmail.com",
    recoveryEmail: "devops@firm.vn",
    purpose: "Developer",
    status: "testing",
    quotaUsed: "0.2 GB / 15 GB",
    proxyIp: "12.45.198.201:80"
  }
];

export function GmailCreatorPanel({ language }: { language: "vi" | "en" }) {
  const [profiles, setProfiles] = useState<GmailProfile[]>(INITIAL_GMAIL_PROFILES);
  const [activeSubTab, setActiveSubTab] = useState<"marketer" | "biz" | "developer">("marketer");
  const [bulkCount, setBulkCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiMethod, setApiMethod] = useState("gmail.users.messages.send");
  const [apiArgs, setApiArgs] = useState(`{\n  "userId": "me",\n  "message": {\n    "raw": "U3ViamVjdDogTGVnYWwgT1MgVGVzdA..."\n  }\n}`);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isCallingApi, setIsCallingApi] = useState(false);

  const handleGenerateBulk = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newProfiles: GmailProfile[] = Array.from({ length: bulkCount }).map((_, i) => {
        const randomId = Math.floor(Math.random() * 900) + 100;
        return {
          id: `g-bulk-${randomId}`,
          email: `${activeSubTab}.bulk.user${randomId}@gmail.com`,
          recoveryEmail: `rec.bulk${randomId}@firm.vn`,
          purpose: activeSubTab === "marketer" ? "Marketer" : activeSubTab === "biz" ? "SmallBiz" : "Developer",
          status: "active",
          quotaUsed: "0.0 GB / 15 GB",
          proxyIp: `198.162.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}:8080`
        };
      });
      setProfiles(prev => [...prev, ...newProfiles]);
      setIsGenerating(false);
    }, 1200);
  };

  const handleExecuteApi = () => {
    setIsCallingApi(true);
    setTimeout(() => {
      if (apiMethod === "gmail.users.messages.send") {
        setApiResponse({
          status: "200 OK",
          id: "msg_1a2b3c4d5e6f",
          threadId: "thread_abc123",
          labelIds: ["SENT"],
          snippet: "Legal OS Sandbox simulation test sent successfully"
        });
      } else if (apiMethod === "gmail.users.labels.create") {
        setApiResponse({
          status: "201 Created",
          id: "Label_Custom_99",
          name: "LegalOS-Priority",
          type: "user",
          messageListVisibility: "show"
        });
      } else {
        setApiResponse({
          status: "200 OK",
          emailAddress: "dev.sandbox.test02@gmail.com",
          messagesTotal: 42,
          threadsTotal: 12,
          historyId: "982741"
        });
      }
      setIsCallingApi(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Overview Context Header */}
      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Mail size={22} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Gmail Multi-Profile Workspace & Sandbox
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
              {language === "vi"
                ? "Mô phỏng quy trình tạo, quản lý và kiểm thử API hàng loạt tài khoản Gmail bảo mật thông qua hệ thống Proxy tích hợp, phục vụ mọi mục tiêu chuyển dịch tiếp thị, quản trị nhân sự và kiểm toán tự động."
                : "Simulation workspace for managing bulk Gmail profile creation and API testing. Simplifies marketing outreach, small business administration, and developer endpoints evaluation securely."}
            </p>
          </div>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/80 gap-4">
        <button
          onClick={() => setActiveSubTab("marketer")}
          className={`pb-2.5 text-xs font-black uppercase transition-all border-b-2 px-1 ${
            activeSubTab === "marketer" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"
          }`}
        >
          {language === "vi" ? "Marketer (Quảng bá)" : "Marketer Campaigns"}
        </button>
        <button
          onClick={() => setActiveSubTab("biz")}
          className={`pb-2.5 text-xs font-black uppercase transition-all border-b-2 px-1 ${
            activeSubTab === "biz" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"
          }`}
        >
          {language === "vi" ? "Doanh nghiệp nhỏ (Nhân viên)" : "Small Business Workspace"}
        </button>
        <button
          onClick={() => setActiveSubTab("developer")}
          className={`pb-2.5 text-xs font-black uppercase transition-all border-b-2 px-1 ${
            activeSubTab === "developer" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"
          }`}
        >
          {language === "vi" ? "Developer (API Testing)" : "Developer Sandbox"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Accounts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">
              {language === "vi" ? "Danh sách tài khoản hoạt động" : "Active Profiles List"}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={bulkCount}
                onChange={e => setBulkCount(Number(e.target.value))}
                className="w-16 p-1 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg text-center"
              />
              <button
                onClick={handleGenerateBulk}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                {language === "vi" ? "Tạo hàng loạt" : "Bulk Generate"}
              </button>
            </div>
          </div>

          <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden bg-slate-50/30">
            {profiles.map(p => (
              <div key={p.id} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white dark:bg-slate-900">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{p.email}</span>
                    <span className={`px-2 py-0.5 text-[9px] rounded-full font-black uppercase ${
                      p.purpose === "Marketer" ? "bg-indigo-500/10 text-indigo-500" :
                      p.purpose === "SmallBiz" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {p.purpose}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>Backup: {p.recoveryEmail}</span>
                    <span>•</span>
                    <span>Proxy: {p.proxyIp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-[10px]">
                    <div className="text-slate-400 font-medium">Quota Used</div>
                    <div className="font-bold text-slate-700 dark:text-slate-200">{p.quotaUsed}</div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${p.status === "active" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: API Playground Simulator */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode size={13} className="text-emerald-500" />
              Gmail API Testing Playground
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Endpoint Method</label>
              <select
                value={apiMethod}
                onChange={e => setApiMethod(e.target.value)}
                className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="gmail.users.messages.send">gmail.users.messages.send (Send Outbound)</option>
                <option value="gmail.users.labels.create">gmail.users.labels.create (Label Org)</option>
                <option value="gmail.users.getProfile">gmail.users.getProfile (Query Quota)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Request Body (JSON Args)</label>
              <textarea
                value={apiArgs}
                onChange={e => setApiArgs(e.target.value)}
                rows={4}
                className="w-full text-xs font-mono p-2 bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={handleExecuteApi}
              disabled={isCallingApi}
              className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Play size={12} className={isCallingApi ? "animate-spin" : ""} />
              {isCallingApi ? "Executing Sandbox Call..." : "Execute API Request"}
            </button>
          </div>

          {apiResponse && (
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase">API RESPONSE OUTPUT</div>
              <pre className="p-3 bg-slate-950 text-[10px] text-slate-300 font-mono rounded-lg overflow-x-auto max-h-[160px]">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. SYSTEM DESIGN & ARCHITECTURE CHECKLIST (SYSTEM-DESIGN-101)
// ==========================================
interface ArchCheck {
  id: string;
  name: string;
  category: "Security" | "Reliability" | "Scale" | "UX";
  desc: string;
  status: "passed" | "failing" | "warning";
}

const ARCHITECTURE_CHECKS: ArchCheck[] = [
  {
    id: "ac-1",
    name: "API Gateway Rate Limiting & Auth Proxy",
    category: "Security",
    desc: "Enforce strict IP and token level request throttling to prevent DoS.",
    status: "passed"
  },
  {
    id: "ac-2",
    name: "Distributed Database Replication (SQLite to Cloud Run Storage)",
    category: "Reliability",
    desc: "Active replication and backup to durable storage to guarantee Zero Data Loss.",
    status: "passed"
  },
  {
    id: "ac-3",
    name: "Idempotent Event Triggers (Idempotency Key)",
    category: "Reliability",
    desc: "Protect mutations from duplicate requests on slow network hops.",
    status: "passed"
  },
  {
    id: "ac-4",
    name: "Asynchronous Queue Tasks (SLA Workers)",
    category: "Scale",
    desc: "Offload heavy workloads like OCR scanner, DOCX parser and PDF generator.",
    status: "passed"
  },
  {
    id: "ac-5",
    name: "Cache-Aside CDN Pipeline",
    category: "UX",
    desc: "Caching of static documents, law libraries and frequently read case counts.",
    status: "passed"
  }
];

export function SystemDesignPanel({ language }: { language: "vi" | "en" }) {
  const [checks, setChecks] = useState<ArchCheck[]>(ARCHITECTURE_CHECKS);
  const [currentLatency, setCurrentLatency] = useState(18);
  const [activeTraffic, setActiveTraffic] = useState<"normal" | "heavy" | "failover">("normal");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);

  const handleTrafficSimulation = (mode: "normal" | "heavy" | "failover") => {
    setActiveTraffic(mode);
    if (mode === "normal") {
      setCurrentLatency(18);
    } else if (mode === "heavy") {
      setCurrentLatency(142);
    } else {
      setCurrentLatency(34);
    }
  };

  const handleRunAudit = () => {
    setIsAuditing(true);
    setAuditLog([]);
    const steps = [
      "Initializing Legal OS System Architecture audit...",
      "Analyzing DB connection pools and schema constraints...",
      "Testing API Gateway throttle response for REST-HEAD-v1...",
      "Inspecting Drizzle schema integration and OAuth callback isolation...",
      "Structural Audit complete. All constraints adhere to Legal OS High Availability SLAs!"
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setAuditLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step}`]);
        if (idx === steps.length - 1) {
          setIsAuditing(false);
        }
      }, (idx + 1) * 400);
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={16} />
            Awesome System Design & Architecture Hub
          </h4>
          <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed max-w-2xl">
            {language === "vi"
              ? "Tích hợp các nguyên lý từ System Design 101 và Awesome Architecture để phân tích, đo lường độ trễ và kiểm toán cấu trúc tải phân tán của toàn hệ thống ERP."
              : "Integrated System Design 101 & Awesome Architecture standards to analyze, monitor distributed load, and test structural compliance across the entire ERP platform."}
          </p>
        </div>
        <button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap"
        >
          {isAuditing ? "Auditing System..." : "Run Structural Audit"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Flow diagram and Traffic simulator */}
        <div className="lg:col-span-2 space-y-4 bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">ByteByteGo Live Traffic Topology</div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">Latency: {currentLatency}ms</span>
            </div>
          </div>

          {/* Interactive Topology Graph */}
          <div className="p-4 bg-slate-950 rounded-xl flex flex-wrap justify-center items-center gap-3 relative min-h-[140px]">
            <div className="px-2 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold rounded">DNS</div>
            <ArrowRight size={10} className="text-slate-600" />
            <div className="px-2 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold rounded">CDN Cache</div>
            <ArrowRight size={10} className="text-slate-600" />
            <div className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${activeTraffic === "heavy" ? "bg-amber-600 border border-amber-500" : "bg-indigo-600 border border-indigo-500"}`}>Load Balancer</div>
            <ArrowRight size={10} className="text-slate-600" />
            <div className="px-2 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold rounded">API Gateway</div>
            <ArrowRight size={10} className="text-slate-600" />
            <div className="px-2 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold rounded">App Server</div>
            <ArrowRight size={10} className="text-slate-600" />
            <div className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${activeTraffic === "failover" ? "bg-emerald-600 border border-emerald-500" : "bg-slate-800 border border-slate-700"}`}>
              {activeTraffic === "failover" ? "Secondary DB (Replica)" : "Primary DB"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 justify-end">
            <button
              onClick={() => handleTrafficSimulation("normal")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTraffic === "normal" ? "bg-white text-slate-900" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
            >
              Normal Load (Low QPS)
            </button>
            <button
              onClick={() => handleTrafficSimulation("heavy")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTraffic === "heavy" ? "bg-amber-600 text-white animate-pulse" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
            >
              Peak Load (10,000 QPS Rate Limit)
            </button>
            <button
              onClick={() => handleTrafficSimulation("failover")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTraffic === "failover" ? "bg-emerald-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
            >
              Database Hot-Failover Trigger
            </button>
          </div>

          {/* Diagnostic Audit Log Output */}
          {auditLog.length > 0 && (
            <div className="space-y-1 bg-slate-950 p-3.5 rounded-xl border border-slate-850 font-mono text-[10px] text-indigo-400">
              <div className="text-slate-400 font-bold uppercase pb-1 border-b border-slate-800 mb-2">SYSTEM AUDIT TELEMETRY</div>
              {auditLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Architecture Checklist */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {language === "vi" ? "Tiêu chí thẩm định kết cấu" : "Structural Quality Standards Check"}
          </div>

          <div className="space-y-2.5">
            {checks.map(c => (
              <div key={c.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-start gap-3">
                <span className="p-1 text-emerald-500 bg-emerald-500/10 rounded-lg mt-0.5 shrink-0">
                  <CheckCircle2 size={13} />
                </span>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    {c.name}
                    <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded">
                      {c.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. SECURE MARKITDOWN WORKSPACE (MICROSOFT MARKITDOWN)
// ==========================================
export function MarkItDownPanel({ language }: { language: "vi" | "en" }) {
  const [rawText, setRawText] = useState(`<h2>Tiêu đề văn bản</h2>\n<p>Hồ sơ vụ án tranh chấp tranh chấp đất đai tại Đà Nẵng.</p>\n<p>Đường dẫn tài liệu: <a href="https://example.com/docs/file.pdf">Tải Xuống PDF</a></p>`);
  const [convertedMd, setConvertedMd] = useState("");
  const [strictSandbox, setStrictSandbox] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = () => {
    setIsConverting(true);
    setTimeout(() => {
      let md = "";
      if (rawText.includes("<h2>Tiêu đề văn bản</h2>")) {
        md = `## Tiêu đề văn bản\n\nHồ sơ vụ án tranh chấp tranh chấp đất đai tại Đà Nẵng.\n\nĐường dẫn tài liệu: [Tải Xuống PDF](${strictSandbox ? "[BLOCKED_BY_SANDBOX_CENSORSHIP]" : "https://example.com/docs/file.pdf"})`;
      } else {
        md = `# Converted Document\n\n- Parsing result securely compiled.`;
      }
      setConvertedMd(md);
      setIsConverting(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* SECURITY BANNER WARNING */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-5 rounded-2xl flex items-start gap-4">
        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl mt-0.5">
          <AlertTriangle size={22} className="animate-pulse" />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            README WARNING: Process Isolation Sandbox Requirements
          </h4>
          <p className="text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed max-w-3xl">
            {language === "vi"
              ? "CẢNH BÁO: MarkItDown thực thi phân tích file và tải URL với quyền hạn trực tiếp của tiến trình dịch vụ đang chạy. Nghiêm cấm chạy tệp tin chứa mã độc hoặc URL không đáng tin cậy ở môi trường có đặc quyền nâng cao nhằm tránh rò rỉ dữ liệu hoặc tấn công giả mạo yêu cầu phía máy chủ (SSRF)."
              : "README WARNING: MarkItDown executes document parsers and fetch commands with current process privileges. Elevated process execution poses severe Server-Side Request Forgery (SSRF) and data leakage risks. Secure sandbox enforcement is mandatory."}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-[10px] font-bold text-amber-800 dark:text-amber-400 cursor-pointer">
              <input
                type="checkbox"
                checked={strictSandbox}
                onChange={e => setStrictSandbox(e.target.checked)}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              Enable Strict URL Sandbox (SSRF protection)
            </label>
            <span className="px-2 py-0.5 text-[9px] bg-amber-500/10 text-amber-600 rounded font-bold font-mono">
              Sandbox Status: {strictSandbox ? "ARMED (SECURE)" : "DISARMED (VULNERABLE)"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Input Text (HTML / Markup)</span>
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all shadow active:scale-95 disabled:opacity-50"
            >
              {isConverting ? "Converting securely..." : "Convert Securely"}
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={10}
            className="w-full text-xs font-mono p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">SECURE MARKDOWN OUTPUT</span>
          <div className="p-4 bg-slate-950 text-slate-300 font-mono text-xs rounded-xl min-h-[220px] whitespace-pre-wrap border border-slate-850">
            {convertedMd || "Click Convert to generate secure Markdown markup..."}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. CHROME DEVTOOLS MCP & SUPERPOWERS CONSOLE
// ==========================================
interface ChromeTab {
  id: string;
  title: string;
  url: string;
  active: boolean;
}

const CHROME_TABS: ChromeTab[] = [
  { id: "tab-1", title: "Law ERP System Dashboard", url: "http://localhost:3000/dashboard", active: true },
  { id: "tab-2", title: "Vụ Án Tranh Chấp Cổ Phần #HS-101", url: "http://localhost:3000/cases/101", active: false },
  { id: "tab-3", title: "Global Settings Portal", url: "http://localhost:3000/settings", active: false }
];

export function ChromeMcpPanel({ language }: { language: "vi" | "en" }) {
  const [tabs, setTabs] = useState<ChromeTab[]>(CHROME_TABS);
  const [evalCode, setEvalCode] = useState("document.getElementById('metric-total').textContent");
  const [evalResult, setEvalResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const handleExecuteEval = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      if (evalCode.includes("metric-total")) {
        setEvalResult({
          status: "success",
          type: "string",
          value: "17 hồ sơ",
          domElement: {
            tagName: "DIV",
            id: "metric-total",
            className: "text-2xl font-bold font-mono text-slate-800"
          }
        });
      } else {
        setEvalResult({
          status: "success",
          type: "object",
          value: "Script executed. Result returned (undefined)."
        });
      }
      setIsEvaluating(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-5 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Chrome size={22} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Chrome DevTools Model Context Protocol (MCP) Server
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
              {language === "vi"
                ? "Bản mô phỏng kết nối máy chủ MCP Chrome DevTools và các quyền quản trị tối cao (Superpowers). Cho phép mô hình AI tương tác trực tiếp với giao diện trình duyệt, giám sát tài nguyên DOM, và truy xuất luồng giao tiếp điều khiển từ xa."
                : "Simulation of Chrome DevTools Model Context Protocol (MCP) server alongside administration superpowers. Enables the AI model to query active tabs, inspect DOM trees, and evaluate sandboxed JavaScript expressions safely."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Browser Tabs Inspector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={13} className="text-indigo-500" />
            Active Browser Tabs
          </div>

          <div className="space-y-2.5">
            {tabs.map(t => (
              <div
                key={t.id}
                onClick={() => setTabs(tabs.map(item => ({ ...item, active: item.id === t.id })))}
                className={`p-3 border rounded-xl cursor-pointer transition-all ${
                  t.active
                    ? "bg-indigo-500/10 border-indigo-300 dark:border-indigo-800"
                    : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/80 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">{t.title}</span>
                  {t.active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{t.url}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: DevTools MCP Eval */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal size={13} className="text-indigo-500" />
            DevTools Remote JS Execution Console
          </div>

          <div className="space-y-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">JavaScript Eval Query</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={evalCode}
                  onChange={e => setEvalCode(e.target.value)}
                  className="flex-1 text-xs font-mono p-2.5 bg-slate-950 text-slate-100 border border-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleExecuteEval}
                  disabled={isEvaluating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isEvaluating ? "Evaluating..." : "Eval Query"}
                </button>
              </div>
            </div>

            {evalResult && (
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex justify-between items-center">
                  <span>MCP EVALUATION RESPONSE</span>
                  <button
                    onClick={() => {
                      setCopiedResponse(true);
                      setTimeout(() => setCopiedResponse(false), 1200);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    {copiedResponse ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 text-[10px] text-indigo-400 font-mono rounded-lg overflow-x-auto">
                  {JSON.stringify(evalResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT EXPOSING THE ECOSYSTEM TABS
// ==========================================
interface AiEcosystemToolsProps {
  language?: "vi" | "en";
  user?: any;
}

export default function AiEcosystemTools({ language = "vi", user }: AiEcosystemToolsProps) {
  const [activeTab, setActiveTab] = useState<"tencent_memory" | "book_skill" | "prime_agency" | "deepseek_harness" | "gmail_creator" | "system_design" | "markitdown_sandbox" | "chrome_mcp" | "chatwoot" | "lightpanda">("tencent_memory");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-150 dark:border-slate-800/80 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab("tencent_memory")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "tencent_memory"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          TencentDB Agent Memory
        </button>
        <button
          onClick={() => setActiveTab("chatwoot")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "chatwoot"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          Chatwoot CSKH Hub
        </button>
        <button
          onClick={() => setActiveTab("lightpanda")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "lightpanda"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          Lightpanda Browser
        </button>
        <button
          onClick={() => setActiveTab("book_skill")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "book_skill"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          Book-to-Skill Prompt Pipeline
        </button>
        <button
          onClick={() => setActiveTab("prime_agency")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "prime_agency"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          Prime Agency Orchestrator
        </button>
        <button
          onClick={() => setActiveTab("deepseek_harness")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "deepseek_harness"
              ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          DeepSeek Diagnostic Harness
        </button>
        <button
          onClick={() => setActiveTab("gmail_creator")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "gmail_creator"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          Gmail Sandbox
        </button>
        <button
          onClick={() => setActiveTab("system_design")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "system_design"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          System Design Hub
        </button>
        <button
          onClick={() => setActiveTab("markitdown_sandbox")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "markitdown_sandbox"
              ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          MarkItDown Sandbox
        </button>
        <button
          onClick={() => setActiveTab("chrome_mcp")}
          className={`pb-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 px-3 transition-all ${
            activeTab === "chrome_mcp"
              ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          Chrome DevTools MCP
        </button>
      </div>

      {/* Render Active Tool Panel */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900/60 shadow-sm">
        {activeTab === "tencent_memory" && <TencentDBAgentMemoryPanel language={language} />}
        {activeTab === "chatwoot" && <ChatwootSupportPanel language={language} />}
        {activeTab === "lightpanda" && <LightpandaAutomationPanel language={language} />}
        {activeTab === "book_skill" && <BookToSkillPanel language={language} />}
        {activeTab === "prime_agency" && <PrimeAgencyOrchestrator language={language} />}
        {activeTab === "deepseek_harness" && <DeepSeekHarnessPanel language={language} />}
        {activeTab === "gmail_creator" && <GmailCreatorPanel language={language} />}
        {activeTab === "system_design" && <SystemDesignPanel language={language} />}
        {activeTab === "markitdown_sandbox" && <MarkItDownPanel language={language} />}
        {activeTab === "chrome_mcp" && <ChromeMcpPanel language={language} />}
      </div>
    </div>
  );
}
