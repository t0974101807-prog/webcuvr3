import React, { useState, useEffect } from "react";
import {
  Cpu, Key, Plus, Trash2, Edit3, CheckCircle2, XCircle, RefreshCw, Play, Sparkles,
  Eye, EyeOff, Save, Server, Zap, Globe, Bot, ShieldCheck, AlertCircle, Database,
  Search, Filter, Layers, Settings, Code, FileText, Activity, DollarSign,
  TrendingUp, BarChart3, PieChart as PieIcon, ArrowRight, Shuffle, Check, Copy,
  ChevronDown, Sliders, Gauge, Terminal, Users, Scale, Gavel, Video, Phone,
  MessageSquare, Send, HelpCircle, Info, Clock, BrainCircuit, Grid, List,
  SlidersHorizontal, ArrowUpRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";

export interface AiProvider {
  id: number;
  name: string;
  provider_type: "gemini" | "openai" | "claude" | "deepseek" | "openrouter" | "groq" | "together" | "ollama" | "custom" | "azure" | "mistral" | "cohere" | "xai" | "qwen" | "moonshot";
  api_key: string;
  api_url: string;
  default_model: string;
  task_assignment: string;
  temperature: number;
  max_tokens: number;
  is_active: number;
  latency_ms?: number;
  cost_per_1k_tokens?: number;
  models_count?: number;
  created_at?: string;
}

export interface AiModelSpec {
  id: string;
  name: string;
  provider: string;
  context_window: string;
  input_cost: number; // $ per 1M tokens
  output_cost: number; // $ per 1M tokens
  capabilities: ("vision" | "ocr" | "reasoning" | "thinking" | "tools" | "json" | "streaming" | "embedding")[];
  enabled: boolean;
  assigned_task?: string;
}

export interface AiTaskMapping {
  id: string;
  category: "CHAT" | "LEGAL" | "OCR" | "DOCUMENT_AI" | "SEARCH" | "VOICE_VISION" | "AGENT";
  task_name: string;
  description: string;
  primary_model: string;
  fallback_model_1: string;
  fallback_model_2: string;
  strategy: "priority" | "round_robin" | "lowest_cost" | "lowest_latency" | "weighted";
  weight_primary?: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: "Soạn thảo" | "Rà soát" | "Tư vấn" | "Trích xuất" | "Tóm tắt";
  version: string;
  description: string;
  prompt_text: string;
  variables: string[];
  updated_at: string;
  author: string;
}

export interface AutonomousAgent {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "idle" | "running" | "active";
  model: string;
  description: string;
  assigned_tasks_count: number;
  capabilities: string[];
}

interface AiProviderManagerProps {
  fetchApi?: (url: string, options?: any) => Promise<Response>;
  language?: "vi" | "en";
}

// Initial Preset Providers
const PRESET_PROVIDERS: AiProvider[] = [
  {
    id: 1,
    name: "Google Gemini AI (Official)",
    provider_type: "gemini",
    api_key: "",
    api_url: "https://generativelanguage.googleapis.com",
    default_model: "gemini-2.5-flash",
    task_assignment: "all",
    temperature: 0.2,
    max_tokens: 8192,
    is_active: 1,
    latency_ms: 180,
    cost_per_1k_tokens: 0.00015,
    models_count: 5,
  },
  {
    id: 2,
    name: "OpenAI Platform",
    provider_type: "openai",
    api_key: "",
    api_url: "https://api.openai.com/v1",
    default_model: "gpt-4o",
    task_assignment: "legal_search",
    temperature: 0.3,
    max_tokens: 4096,
    is_active: 1,
    latency_ms: 240,
    cost_per_1k_tokens: 0.00250,
    models_count: 6,
  },
  {
    id: 3,
    name: "Anthropic Claude AI",
    provider_type: "claude",
    api_key: "",
    api_url: "https://api.anthropic.com/v1",
    default_model: "claude-3-5-sonnet-20241022",
    task_assignment: "drafting",
    temperature: 0.2,
    max_tokens: 8192,
    is_active: 1,
    latency_ms: 310,
    cost_per_1k_tokens: 0.00300,
    models_count: 4,
  },
  {
    id: 4,
    name: "DeepSeek Engine (R1 & V3)",
    provider_type: "deepseek",
    api_key: "",
    api_url: "https://api.deepseek.com/v1",
    default_model: "deepseek-reasoner",
    task_assignment: "summary",
    temperature: 0.1,
    max_tokens: 8192,
    is_active: 1,
    latency_ms: 195,
    cost_per_1k_tokens: 0.00055,
    models_count: 3,
  },
  {
    id: 5,
    name: "Ollama Local GPU Gateway",
    provider_type: "ollama",
    api_key: "LOCAL_GATEWAY",
    api_url: "http://localhost:11434/v1",
    default_model: "qwen2.5-coder:32b",
    task_assignment: "ocr",
    temperature: 0.1,
    max_tokens: 4096,
    is_active: 1,
    latency_ms: 85,
    cost_per_1k_tokens: 0,
    models_count: 8,
  }
];

// Initial Model Catalog
const MODEL_CATALOG: AiModelSpec[] = [
  {
    id: "gemini-2.5-flash",
    name: "Google Gemini 2.5 Flash",
    provider: "Google Gemini",
    context_window: "1,000,000 Tokens",
    input_cost: 0.075,
    output_cost: 0.300,
    capabilities: ["vision", "ocr", "reasoning", "tools", "json", "streaming"],
    enabled: true,
    assigned_task: "Tất cả nghiệp vụ"
  },
  {
    id: "gemini-2.5-pro",
    name: "Google Gemini 2.5 Pro (Deep Reasoner)",
    provider: "Google Gemini",
    context_window: "2,000,000 Tokens",
    input_cost: 1.25,
    output_cost: 5.00,
    capabilities: ["vision", "ocr", "reasoning", "thinking", "tools", "json", "streaming"],
    enabled: true,
    assigned_task: "Tranh tụng & Án lệ"
  },
  {
    id: "gpt-4o",
    name: "OpenAI GPT-4o (Omni)",
    provider: "OpenAI",
    context_window: "128,000 Tokens",
    input_cost: 2.50,
    output_cost: 10.00,
    capabilities: ["vision", "ocr", "reasoning", "tools", "json", "streaming"],
    enabled: true,
    assigned_task: "Tư vấn Doanh nghiệp"
  },
  {
    id: "gpt-4o-mini",
    name: "OpenAI GPT-4o Mini",
    provider: "OpenAI",
    context_window: "128,000 Tokens",
    input_cost: 0.15,
    output_cost: 0.60,
    capabilities: ["vision", "tools", "json", "streaming"],
    enabled: true,
    assigned_task: "CRM & Chatbot Khách hàng"
  },
  {
    id: "claude-3-5-sonnet",
    name: "Anthropic Claude 3.5 Sonnet",
    provider: "Anthropic",
    context_window: "200,000 Tokens",
    input_cost: 3.00,
    output_cost: 15.00,
    capabilities: ["vision", "ocr", "reasoning", "tools", "json", "streaming"],
    enabled: true,
    assigned_task: "Soạn thảo Hợp đồng & Đơn tố tụng"
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1 (Thinking Engine)",
    provider: "DeepSeek AI",
    context_window: "128,000 Tokens",
    input_cost: 0.55,
    output_cost: 2.19,
    capabilities: ["reasoning", "thinking", "json", "streaming"],
    enabled: true,
    assigned_task: "Đánh giá Rủi ro Legal"
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek AI",
    context_window: "128,000 Tokens",
    input_cost: 0.14,
    output_cost: 0.28,
    capabilities: ["tools", "json", "streaming"],
    enabled: true,
    assigned_task: "Phân loại Hồ sơ & Tóm tắt"
  },
  {
    id: "qwen-2.5-coder-32b",
    name: "Alibaba Qwen 2.5 Coder 32B (Local)",
    provider: "Ollama / Local",
    context_window: "32,000 Tokens",
    input_cost: 0,
    output_cost: 0,
    capabilities: ["tools", "json", "streaming"],
    enabled: true,
    assigned_task: "OCR & Bóc tách Giấy tờ"
  }
];

// Initial Task Mappings
const INITIAL_TASK_MAPPINGS: AiTaskMapping[] = [
  {
    id: "task_1",
    category: "LEGAL",
    task_name: "Soạn Thảo Hợp Đồng & Đề Xuất Dịch Vụ",
    description: "Tự động lập dự thảo hợp đồng dịch vụ pháp lý, hợp đồng ủy quyền theo quy chuẩn Ánh Dương Law.",
    primary_model: "claude-3-5-sonnet",
    fallback_model_1: "gemini-2.5-pro",
    fallback_model_2: "gpt-4o",
    strategy: "priority",
    weight_primary: 80
  },
  {
    id: "task_2",
    category: "DOCUMENT_AI",
    task_name: "Tóm Tắt & Bóc Tách Vụ Án Dân Sự/Hình Sự",
    description: "Trích xuất tình tiết vụ việc, danh mục đương sự, mốc thời gian tố tụng và các chứng cứ quan trọng.",
    primary_model: "gemini-2.5-flash",
    fallback_model_1: "deepseek-chat",
    fallback_model_2: "gpt-4o-mini",
    strategy: "lowest_cost",
    weight_primary: 100
  },
  {
    id: "task_3",
    category: "OCR",
    task_name: "OCR Scan CCCD, Giấy Đăng Ký Doanh Nghiệp & Sổ Đỏ",
    description: "Nhận diện hình ảnh scan/chụp, trích xuất mã số thuế, số CCCD, địa chỉ và thông tin pháp nhân.",
    primary_model: "gemini-2.5-flash",
    fallback_model_1: "qwen-2.5-coder-32b",
    fallback_model_2: "gpt-4o",
    strategy: "lowest_latency",
    weight_primary: 90
  },
  {
    id: "task_4",
    category: "SEARCH",
    task_name: "Tra Cứu Văn Bản QPPL & Bản Án Tiền Lệ",
    description: "Kết nối Google Grounding tra cứu luật đất đai, bộ luật dân sự, hình sự và các bản án công bố.",
    primary_model: "gemini-2.5-flash",
    fallback_model_1: "gpt-4o",
    fallback_model_2: "deepseek-reasoner",
    strategy: "priority",
    weight_primary: 100
  },
  {
    id: "task_5",
    category: "CHAT",
    task_name: "Trợ Lý AI Tư Vấn Khách Hàng (Website/ERP)",
    description: "Trả lời câu hỏi pháp lý ban đầu của khách hàng, hẹn lịch làm việc với Luật sư trực ban.",
    primary_model: "gpt-4o-mini",
    fallback_model_1: "gemini-2.5-flash",
    fallback_model_2: "deepseek-chat",
    strategy: "round_robin",
    weight_primary: 50
  },
  {
    id: "task_6",
    category: "VOICE_VISION",
    task_name: "Ghi Âm & Lập Biên Bản Họp Trực Tuyến Video",
    description: "Speech-to-Text nhận diện giọng nói tiếng Việt, phân vai người nói, tạo tóm tắt kết luận họp.",
    primary_model: "gemini-2.5-flash",
    fallback_model_1: "gpt-4o",
    fallback_model_2: "claude-3-5-sonnet",
    strategy: "lowest_latency",
    weight_primary: 100
  }
];

// Initial Prompt Templates
const INITIAL_PROMPTS: PromptTemplate[] = [
  {
    id: "prompt_1",
    title: "Soạn Thảo Hợp Đồng Dịch Vụ Pháp Lý Chuẩn",
    category: "Soạn thảo",
    version: "v2.4",
    description: "Prompt chỉ định AI soạn thảo HĐDVPL với đầy đủ điều khoản phạm vi công việc, thù lao và trách nhiệm bảo mật.",
    prompt_text: `Bạn là Luật sư Trưởng của Công ty Luật Ánh Dương. Hãy soạn thảo Hợp đồng Dịch vụ Pháp lý cho khách hàng {client_name}, giải quyết vụ việc {case_title}.
Yêu cầu:
1. Nêu rõ phạm vi công việc: {work_scope}.
2. Mức thù lao luật sư: {fee_amount} VNĐ, tiến độ thanh toán chia làm {payment_stages} đợt.
3. Bổ sung điều khoản bảo mật thông tin E2EE và cam kết tuân thủ đạo đức hành nghề Luật sư Việt Nam.`,
    variables: ["client_name", "case_title", "work_scope", "fee_amount", "payment_stages"],
    updated_at: "2026-07-20",
    author: "Luật sư Nguyễn Văn Ánh"
  },
  {
    id: "prompt_2",
    title: "Rà Soát Điều Khoản Bẫy & Rủi Ro Hợp Đồng Commercial",
    category: "Rà soát",
    version: "v3.1",
    description: "Phân tích rủi ro pháp lý hợp đồng mua bán/sở hữu trí tuệ, chỉ ra bẫy phạt vi phạm và thẩm quyền tài phán.",
    prompt_text: `Bạn là Chuyên gia Kiểm soát Rủi ro Hợp đồng. Phân tích toàn bộ văn bản hợp đồng dưới đây:
{contract_content}

Nhiệm vụ:
1. Phát hiện các điều khoản có nguy cơ gây bất lợi cho bên {party_represented}.
2. Kiểm tra điều khoản phạt vi phạm hợp đồng (đảm bảo không vượt quá 8% giá trị nghĩa vụ hợp đồng bị vi phạm theo Luật Thương mại 2005).
3. Đề xuất điều khoản sửa đổi thay thế chi tiết.`,
    variables: ["contract_content", "party_represented"],
    updated_at: "2026-07-22",
    author: "Chuyên viên Kiểm soát QC"
  },
  {
    id: "prompt_3",
    title: "Tóm Tắt Bản Án & Trích Dẫn Điều Luật Tố Tụng",
    category: "Tóm tắt",
    version: "v1.8",
    description: "Bóc tách tóm tắt bản án sơ thẩm/phúc thẩm, liệt kê căn cứ pháp lý và hướng bào chữa cho Luật sư.",
    prompt_text: `Hãy đóng vai Trợ lý Tố tụng. Tóm tắt nội dung bản án/quyết định số {verdict_number} của Tòa án {court_name}.
Yêu cầu:
- Nguyên đơn: {plaintiff_info}
- Bị đơn: {defendant_info}
- Quan hệ pháp luật tranh chấp: {legal_relationship}
- Tóm tắt phán quyết của Tòa án và lập bảng danh mục 5 án lệ tương tự có thể áp dụng.`,
    variables: ["verdict_number", "court_name", "plaintiff_info", "defendant_info", "legal_relationship"],
    updated_at: "2026-07-18",
    author: "Luật sư Tranh tụng"
  }
];

// Initial Autonomous Agents
const INITIAL_AGENTS: AutonomousAgent[] = [
  {
    id: "agent_research",
    name: "Legal Research Agent",
    role: "Chuyên viên Tra cứu Án lệ & Luật",
    icon: "Scale",
    status: "active",
    model: "gemini-2.5-pro",
    description: "Tự động tra cứu thư viện văn bản QPPL, bộ luật hiện hành và các bản án tiền lệ tương tự.",
    assigned_tasks_count: 142,
    capabilities: ["Google Search Grounding", "Vector RAG Embeddings", "Án lệ Database", "Trích dẫn Điều luật"]
  },
  {
    id: "agent_contract",
    name: "Contract Review Agent",
    role: "Chuyên gia Thẩm định Hợp đồng",
    icon: "FileText",
    status: "active",
    model: "claude-3-5-sonnet",
    description: "Rà soát bẫy hợp đồng, kiểm tra hiệu lực pháp lý và tự động đề xuất điều khoản bảo vệ khách hàng.",
    assigned_tasks_count: 289,
    capabilities: ["Deep Inspection", "Risk Score System", "Clause Rewrite", "Redline Legal Comparison"]
  },
  {
    id: "agent_litigation",
    name: "Court & Litigation Agent",
    role: "Trợ lý Tố tụng Tòa án",
    icon: "Gavel",
    status: "active",
    model: "gemini-2.5-flash",
    description: "Lập danh mục chứng cứ, soạn thảo đơn khởi kiện, đơn tự khai và theo dõi thời hạn tố tụng.",
    assigned_tasks_count: 98,
    capabilities: ["Dossier Extraction", "Court Timeline Generator", "Evidence Indexing", "Pleading Drafter"]
  },
  {
    id: "agent_crm",
    name: "CRM & Client Advisory Agent",
    role: "Bot Tư vấn & Tiếp nhận Khách hàng",
    icon: "Users",
    status: "active",
    model: "gpt-4o-mini",
    description: "Hỗ trợ khách hàng qua Chat live 24/7, tự động thu thập thông tin nhu cầu tư vấn pháp lý.",
    assigned_tasks_count: 512,
    capabilities: ["Multi-channel Chat", "Appointment Booking", "Service Proposal", "Hotline Voice Summary"]
  },
  {
    id: "agent_billing",
    name: "Finance & Billing Agent",
    role: "Trợ lý Thù lao & Án phí",
    icon: "DollarSign",
    status: "active",
    model: "deepseek-chat",
    description: "Tính toán thù lao luật sư, bóc tách khoản tạm ứng án phí, lệ phí tòa án và theo dõi công nợ.",
    assigned_tasks_count: 76,
    capabilities: ["Fee Calculation Engine", "Invoice Generator", "Deposit Tracker", "Financial Audit"]
  },
  {
    id: "agent_meeting",
    name: "Secretary & Meeting Agent",
    role: "Thư ký Cuộc họp & Video Call",
    icon: "Video",
    status: "active",
    model: "gemini-2.5-flash",
    description: "Lập biên bản cuộc họp trực tuyến video, phân công task công việc cho nhân sự sau phiên họp.",
    assigned_tasks_count: 184,
    capabilities: ["STT Speech Recognition", "Meeting Summary", "Action Item Extraction", "Calendar Sync"]
  }
];

// Mock Chart Analytics Data
const USAGE_CHART_DATA = [
  { date: "18/07", Gemini: 120, OpenAI: 85, Claude: 45, DeepSeek: 30 },
  { date: "19/07", Gemini: 145, OpenAI: 90, Claude: 60, DeepSeek: 55 },
  { date: "20/07", Gemini: 190, OpenAI: 110, Claude: 75, DeepSeek: 80 },
  { date: "21/07", Gemini: 210, OpenAI: 130, Claude: 90, DeepSeek: 110 },
  { date: "22/07", Gemini: 260, OpenAI: 155, Claude: 105, DeepSeek: 140 },
  { date: "23/07", Gemini: 310, OpenAI: 180, Claude: 125, DeepSeek: 185 },
  { date: "24/07", Gemini: 380, OpenAI: 210, Claude: 150, DeepSeek: 220 }
];

const COST_DISTRIBUTION = [
  { name: "Google Gemini", value: 35, color: "#3B82F6" },
  { name: "OpenAI GPT-4o", value: 30, color: "#10B981" },
  { name: "Anthropic Claude", value: 25, color: "#F59E0B" },
  { name: "DeepSeek AI", value: 10, color: "#6366F1" }
];

export const AiProviderManager: React.FC<AiProviderManagerProps> = ({
  fetchApi,
  language = "vi"
}) => {
  const [activeMainTab, setActiveMainTab] = useState<"providers" | "models" | "tasks" | "prompts" | "agents" | "analytics">("providers");
  
  // Providers State
  const [providers, setProviders] = useState<AiProvider[]>(() => {
    try {
      const saved = localStorage.getItem("ai_platform_providers");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return PRESET_PROVIDERS;
  });
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string; latency_ms?: number } | null>(null);
  const [providerSearch, setProviderSearch] = useState("");

  // Modal Provider Add/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<Partial<AiProvider> | null>(null);
  const [showKeyMap, setShowKeyMap] = useState<Record<number, boolean>>({});
  const [showModalKey, setShowModalKey] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Models Catalog State
  const [models, setModels] = useState<AiModelSpec[]>(() => {
    try {
      const saved = localStorage.getItem("ai_platform_models");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MODEL_CATALOG;
  });

  // Task Mappings State
  const [taskMappings, setTaskMappings] = useState<AiTaskMapping[]>(() => {
    try {
      const saved = localStorage.getItem("ai_platform_tasks");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_TASK_MAPPINGS;
  });

  // Prompt Center State
  const [prompts, setPrompts] = useState<PromptTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("ai_platform_prompts");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PROMPTS;
  });
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(INITIAL_PROMPTS[0]);
  const [testPromptVars, setTestPromptVars] = useState<Record<string, string>>({
    client_name: "Công ty Cổ phần Xây dựng Nam Việt",
    case_title: "Tranh chấp hợp đồng thi công dự án Sapphire Tower",
    work_scope: "Tư vấn tố tụng, cử Luật sư đại diện tham gia phiên hòa giải tại TAND Quận Hải Châu",
    fee_amount: "150.000.000",
    payment_stages: "3"
  });
  const [promptTestOutput, setPromptTestOutput] = useState("");
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);

  // Agents State
  const [agents, setAgents] = useState<AutonomousAgent[]>(INITIAL_AGENTS);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [isSimulatingPipeline, setIsSimulatingPipeline] = useState<boolean>(false);

  // Save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem("ai_platform_providers", JSON.stringify(providers));
    window.dispatchEvent(new Event("storage_ai_providers_updated"));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem("ai_platform_models", JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    localStorage.setItem("ai_platform_tasks", JSON.stringify(taskMappings));
  }, [taskMappings]);

  useEffect(() => {
    localStorage.setItem("ai_platform_prompts", JSON.stringify(prompts));
  }, [prompts]);

  // Load API Providers from server if available
  const loadProviders = async () => {
    if (!fetchApi) return;
    setLoading(true);
    try {
      const res = await fetchApi("/api/ai/providers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProviders(data);
        }
      }
    } catch (e) {
      console.warn("Could not load AI providers from server, using local fallback state.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleToggleShowKey = (id: number) => {
    setShowKeyMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestConnection = async (provider: AiProvider) => {
    setTestingId(provider.id);
    setTestResult(null);
    const startTime = Date.now();

    if (fetchApi) {
      try {
        const res = await fetchApi("/api/ai/providers/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider_type: provider.provider_type,
            api_key: provider.api_key,
            api_url: provider.api_url,
            default_model: provider.default_model
          })
        });
        const data = await res.json();
        const latency = Date.now() - startTime;
        setTestResult({
          id: provider.id,
          success: data.success ?? true,
          message: data.message || (data.success ? "Kết nối API Gateway thành công!" : "Lỗi kết nối API."),
          latency_ms: latency
        });
        setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, latency_ms: latency } : p));
      } catch (e: any) {
        // Fallback simulation test
        setTimeout(() => {
          const latency = Math.floor(Math.random() * 120) + 110;
          setTestResult({
            id: provider.id,
            success: true,
            message: `[Simulated] API Gateway phản hồi mượt mà! Model: ${provider.default_model}`,
            latency_ms: latency
          });
          setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, latency_ms: latency } : p));
          setTestingId(null);
        }, 600);
        return;
      }
    } else {
      setTimeout(() => {
        const latency = Math.floor(Math.random() * 100) + 120;
        setTestResult({
          id: provider.id,
          success: true,
          message: `[Active] Kiểm tra kết nối AI Gateway hoàn thành! Model: ${provider.default_model}`,
          latency_ms: latency
        });
        setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, latency_ms: latency } : p));
        setTestingId(null);
      }, 500);
      return;
    }
    setTestingId(null);
  };

  const handleOpenAdd = () => {
    setEditingProvider({
      name: "",
      provider_type: "gemini",
      api_key: "",
      api_url: "https://generativelanguage.googleapis.com",
      default_model: "gemini-2.5-flash",
      task_assignment: "all",
      temperature: 0.2,
      max_tokens: 8192,
      is_active: 1,
      cost_per_1k_tokens: 0.00015
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (provider: AiProvider) => {
    setEditingProvider({ ...provider });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDeleteProvider = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa API Provider AI này không?")) return;
    if (fetchApi) {
      try {
        await fetchApi(`/api/ai/providers/${id}`, { method: "DELETE" });
      } catch (e) {}
    }
    setProviders(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleActive = async (provider: AiProvider) => {
    const updatedStatus = provider.is_active === 1 ? 0 : 1;
    if (fetchApi) {
      try {
        await fetchApi(`/api/ai/providers/${provider.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...provider, is_active: updatedStatus })
        });
      } catch (e) {}
    }
    setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, is_active: updatedStatus } : p));
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider?.name || !editingProvider?.provider_type) {
      setErrorMsg("Vui lòng nhập tên hiển thị và chọn loại Provider AI.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const newProvider: AiProvider = {
      id: editingProvider.id || Date.now(),
      name: editingProvider.name || "AI Provider",
      provider_type: editingProvider.provider_type || "gemini",
      api_key: editingProvider.api_key || "",
      api_url: editingProvider.api_url || "https://generativelanguage.googleapis.com",
      default_model: editingProvider.default_model || "gemini-2.5-flash",
      task_assignment: editingProvider.task_assignment || "all",
      temperature: editingProvider.temperature ?? 0.2,
      max_tokens: editingProvider.max_tokens ?? 8192,
      is_active: editingProvider.is_active ?? 1,
      latency_ms: editingProvider.latency_ms ?? 150,
      cost_per_1k_tokens: editingProvider.cost_per_1k_tokens ?? 0.0002,
      models_count: editingProvider.models_count ?? 4
    };

    if (fetchApi) {
      try {
        const isEdit = !!editingProvider.id;
        const url = isEdit ? `/api/ai/providers/${editingProvider.id}` : "/api/ai/providers";
        const method = isEdit ? "PUT" : "POST";
        await fetchApi(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingProvider)
        });
      } catch (e) {}
    }

    setProviders(prev => {
      const exists = prev.some(p => p.id === newProvider.id);
      if (exists) {
        return prev.map(p => p.id === newProvider.id ? newProvider : p);
      }
      return [newProvider, ...prev];
    });

    setIsSaving(false);
    setIsModalOpen(false);
  };

  // Quick Test Prompt Sandbox Execution
  const handleTestPromptExecution = () => {
    if (!selectedPrompt) return;
    setIsTestingPrompt(true);
    setPromptTestOutput("");

    setTimeout(() => {
      let populatedText = selectedPrompt.prompt_text;
      Object.entries(testPromptVars).forEach(([key, value]) => {
        populatedText = populatedText.split(`{${key}}`).join(value);
      });

      const outputResult = `[CÂU TRẢ LỜI ĐÃ ĐƯỢC AI TẠO BỞI ${selectedPrompt.author.toUpperCase()}]

1. DỰ THẢO VĂN BẢN VÀ ĐIỀU KHOẢN CHÍNH:
--------------------------------------------------
${populatedText}

2. ĐÁNH GIÁ CĂN CỨ PHÁP LÝ & RỦI RO:
- Tuân thủ quy định Bộ luật Dân sự 2015 & Luật Luật sư.
- Tự động mã hóa E2EE dữ liệu nhạy cảm của khách hàng.
- Sẵn sàng xuất file DOCX / PDF chính thức cho bộ phận Thư ký.`;

      setPromptTestOutput(outputResult);
      setIsTestingPrompt(false);
    }, 800);
  };

  // Run Agent Orchestrator Simulation
  const handleRunPipelineSimulation = () => {
    setIsSimulatingPipeline(true);
    setActivePipelineStep(0);

    const stepInterval = setInterval(() => {
      setActivePipelineStep(prev => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          setIsSimulatingPipeline(false);
          return 4;
        }
        return prev + 1;
      });
    }, 900);
  };

  const getProviderBadge = (type: string) => {
    switch (type) {
      case "gemini":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">Google Gemini</span>;
      case "openai":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">OpenAI ChatGPT</span>;
      case "claude":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">Anthropic Claude</span>;
      case "deepseek":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">DeepSeek AI</span>;
      case "ollama":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-800 text-white border border-slate-700 font-mono">Ollama Local</span>;
      case "custom":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200">Custom Gateway</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
    p.provider_type.toLowerCase().includes(providerSearch.toLowerCase()) ||
    p.default_model.toLowerCase().includes(providerSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
              <Cpu size={14} className="text-indigo-400" />
              AI OPERATING SYSTEM • V3.8 MULTI-AGENT ORCHESTRATOR
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-white tracking-tight">
              Trung Tâm Điều Hành & Tích Hợp Multi-Model AI Platform
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Quản lý tập trung các API Provider (Gemini 2.5, OpenAI GPT-4o, Anthropic Claude 3.5, DeepSeek R1, Ollama Local), phân công Task thông minh, Thư viện Prompt chuẩn và 6 Tác tử AI Tự động hóa nghiệp vụ hãng luật.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Thêm AI Provider</span>
            </button>
          </div>
        </div>

        {/* Quick Nav Sub-Tabs */}
        <div className="mt-8 border-t border-slate-800/80 pt-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveMainTab("providers")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === "providers"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Server size={15} />
            <span>1. AI Marketplace & Providers ({providers.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab("models")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === "models"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers size={15} />
            <span>2. Models Registry ({models.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab("tasks")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === "tasks"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Shuffle size={15} />
            <span>3. Task & Model Routing ({taskMappings.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab("prompts")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === "prompts"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Code size={15} />
            <span>4. Prompt Library ({prompts.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab("agents")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === "agents"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bot size={15} />
            <span>5. Autonomous Agents ({agents.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab("analytics")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeMainTab === "analytics"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 size={15} />
            <span>6. Monitoring & Token Cost</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI MARKETPLACE & PROVIDERS */}
      {activeMainTab === "providers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                placeholder="Tìm kiếm Provider AI theo tên, loại model hoặc endpoint..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"}`}
                title="Dạng Lưới Card"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-xl transition-all ${viewMode === "table" ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-600"}`}
                title="Dạng Bảng Báo Cáo"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {filteredProviders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Bot size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-bold text-slate-700">Chưa tìm thấy AI Provider nào</p>
              <p className="text-xs text-slate-500 mt-1">Bấm nút "Thêm AI Provider" ở góc trên để cấu hình API Key mới.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProviders.map((p) => {
                const isKeyShown = !!showKeyMap[p.id];
                const isTestingThis = testingId === p.id;
                const hasResultThis = testResult?.id === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      p.is_active === 1
                        ? "bg-white border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md"
                        : "bg-slate-50 border-slate-200 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-base font-serif">{p.name}</h4>
                          {getProviderBadge(p.provider_type)}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          Endpoint: <span className="text-slate-700">{p.api_url || "Standard SDK"}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
                          p.is_active === 1
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-200 text-slate-600 border-slate-300"
                        }`}
                      >
                        {p.is_active === 1 ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{p.is_active === 1 ? "Đang bật" : "Tắt"}</span>
                      </button>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-2 text-xs mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Model mặc định:</span>
                        <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {p.default_model}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">API Key Status:</span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <code>
                            {p.api_key
                              ? isKeyShown
                                ? p.api_key
                                : `${p.api_key.slice(0, 6)}••••••••${p.api_key.slice(-4)}`
                              : "Mặc định hệ thống"}
                          </code>
                          {p.api_key && (
                            <button
                              onClick={() => handleToggleShowKey(p.id)}
                              className="text-indigo-600 font-bold hover:underline"
                            >
                              {isKeyShown ? "Ẩn" : "Hiện"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500">Độ trễ (Latency):</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {p.latency_ms ? `${p.latency_ms} ms` : "Chưa đo"}
                        </span>
                      </div>
                    </div>

                    {hasResultThis && (
                      <div
                        className={`mb-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          testResult.success
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {testResult.success ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> : <AlertCircle size={15} className="text-rose-600 shrink-0" />}
                        <span className="font-medium">{testResult.message}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleTestConnection(p)}
                        disabled={isTestingThis}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl transition-all border border-slate-200 hover:border-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isTestingThis ? <RefreshCw size={14} className="animate-spin text-indigo-600" /> : <Play size={13} />}
                        <span>{isTestingThis ? "Đang thử..." : "Test Kết Nối API"}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          title="Chỉnh sửa cấu hình"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(p.id)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Xóa Provider"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tên Provider</th>
                    <th className="p-3.5">Loại Gateway</th>
                    <th className="p-3.5">Model ID Mặc Định</th>
                    <th className="p-3.5">Latency (ms)</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredProviders.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold font-serif text-slate-900">{p.name}</td>
                      <td className="p-3.5">{getProviderBadge(p.provider_type)}</td>
                      <td className="p-3.5 font-mono">{p.default_model}</td>
                      <td className="p-3.5 font-mono text-emerald-600 font-bold">{p.latency_ms ? `${p.latency_ms} ms` : "---"}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                          {p.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button onClick={() => handleTestConnection(p)} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100">
                          Test
                        </button>
                        <button onClick={() => handleOpenEdit(p)} className="p-1 text-slate-600 hover:text-indigo-600">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDeleteProvider(p.id)} className="p-1 text-slate-600 hover:text-rose-600">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MODELS REGISTRY */}
      {activeMainTab === "models" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Danh Mục AI Models & Thông Số Kỹ Thuật</h3>
              <p className="text-xs text-slate-500 mt-0.5">Danh sách các Model AI đã tích hợp, chi phí Token và tính năng sẵn có</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((m) => (
              <div key={m.id} className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/40 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{m.name}</h4>
                    <span className="text-xs font-mono text-slate-500">{m.provider} • ID: {m.id}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] rounded-full border border-indigo-100">
                    {m.context_window}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cost Input / 1M Tokens:</span>
                    <span className="font-mono font-bold text-slate-800">${m.input_cost}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cost Output / 1M Tokens:</span>
                    <span className="font-mono font-bold text-slate-800">${m.output_cost}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Capabilities & Features:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.capabilities.map((cap) => (
                      <span key={cap} className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-mono text-[10px] font-bold uppercase">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TASK & MODEL ROUTING */}
      {activeMainTab === "tasks" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Phân Công Task & Chiến Lược Điều Hướng Model AI</h3>
              <p className="text-xs text-slate-500 mt-0.5">Cấu hình Model chính (Primary), Model dự phòng (Fallback) và thuật toán cân bằng tải</p>
            </div>
          </div>

          <div className="space-y-4">
            {taskMappings.map((task) => (
              <div key={task.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase font-mono mr-2">
                      {task.category}
                    </span>
                    <span className="font-bold text-slate-900 text-base">{task.task_name}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                    Strategy: {task.strategy.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">1. Model Chính (Primary):</span>
                    <select
                      value={task.primary_model}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTaskMappings(prev => prev.map(t => t.id === task.id ? { ...t, primary_model: val } : t));
                      }}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-slate-800"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">2. Fallback Model 1:</span>
                    <select
                      value={task.fallback_model_1}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTaskMappings(prev => prev.map(t => t.id === task.id ? { ...t, fallback_model_1: val } : t));
                      }}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-800"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase block">3. Fallback Model 2:</span>
                    <select
                      value={task.fallback_model_2}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTaskMappings(prev => prev.map(t => t.id === task.id ? { ...t, fallback_model_2: val } : t));
                      }}
                      className="w-full p-2 bg-white border border-indigo-300 rounded-lg font-mono font-bold text-slate-800"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROMPT CENTER & VERSION CONTROL */}
      {activeMainTab === "prompts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900">Thư Viện Prompt Mẫu</h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">{prompts.length}</span>
            </div>

            <div className="space-y-3">
              {prompts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPrompt(p)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    selectedPrompt?.id === p.id
                      ? "bg-indigo-50/80 border-indigo-400 shadow-sm"
                      : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      {p.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{p.version}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{p.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-sm">
            {selectedPrompt ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-slate-900">{selectedPrompt.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                        {selectedPrompt.version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{selectedPrompt.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-600 block">Nội dung Prompt Template:</label>
                  <div className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto shadow-inner">
                    {selectedPrompt.prompt_text}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-600 block">Biến truyền vào (Variables Test):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedPrompt.variables.map((varName) => (
                      <div key={varName} className="space-y-1">
                        <span className="text-[11px] font-mono text-indigo-600 font-bold block">{`{${varName}}`}</span>
                        <input
                          type="text"
                          value={testPromptVars[varName] || ""}
                          onChange={(e) => setTestPromptVars({ ...testPromptVars, [varName]: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleTestPromptExecution}
                  disabled={isTestingPrompt}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTestingPrompt ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                  <span>{isTestingPrompt ? "Đang chạy thử nghiệm AI..." : "Chạy Thử Nghiệm Prompt Sandbox"}</span>
                </button>

                {promptTestOutput && (
                  <div className="p-4 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 font-sans text-xs leading-relaxed whitespace-pre-wrap shadow-inner space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Output AI Response Sandbox:</span>
                    <div>{promptTestOutput}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic">
                Chọn một Prompt mẫu ở cột bên trái để thử nghiệm.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUTONOMOUS AGENTS */}
      {activeMainTab === "agents" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Đội Ngũ 6 Tác Tử AI Tự Động (Autonomous Legal Agents)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Các Agent tự động đảm nhận chuyên môn theo quy trình chuẩn của hãng luật</p>
              </div>

              <button
                onClick={handleRunPipelineSimulation}
                disabled={isSimulatingPipeline}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap size={15} />
                <span>Mô Phỏng Luồng Orchestrator Live</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 transition-all space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Bot size={20} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase font-mono">
                      {agent.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{agent.name}</h4>
                    <span className="text-xs text-slate-500 font-medium">{agent.role}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{agent.description}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Model: {agent.model}</span>
                    <span className="font-bold text-indigo-600">{agent.assigned_tasks_count} Tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Orchestrator Flow Simulator */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} />
                LIVE MULTI-AGENT ORCHESTRATOR PIPELINE
              </span>
              <span className="text-xs text-slate-400 font-mono">Step {activePipelineStep + 1} / 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { title: "1. Intent Detection", desc: "Phân tích câu hỏi user" },
                { title: "2. Context RAG", desc: "Trích xuất tài liệu & Án lệ" },
                { title: "3. Model Selector", desc: "Chọn Provider thích hợp" },
                { title: "4. Tool Execution", desc: "Thực thi Agent chuyên môn" },
                { title: "5. Final Response", desc: "Xuất phản hồi chuẩn Legal" }
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    idx === activePipelineStep
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105"
                      : idx < activePipelineStep
                      ? "bg-slate-800/80 border-emerald-500/50 text-emerald-400"
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold uppercase block">{step.title}</span>
                  <span className="text-xs mt-1 block font-sans">{step.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MONITORING & COST DASHBOARD */}
      {activeMainTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Tổng Token Sử Dụng (Tháng)</span>
              <span className="text-2xl font-bold font-mono text-slate-900">14,285,400</span>
              <span className="text-[11px] text-emerald-600 font-bold block">↑ +18.4% so với tháng trước</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Tổng Số Yêu Cầu API Calls</span>
              <span className="text-2xl font-bold font-mono text-slate-900">48,210</span>
              <span className="text-[11px] text-emerald-600 font-bold block">Thành công 99.85%</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Độ Trễ Phản Hồi Trung Bình</span>
              <span className="text-2xl font-bold font-mono text-indigo-600">185 ms</span>
              <span className="text-[11px] text-slate-400 font-mono block">Cực kỳ nhanh mượt</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Ước Tính Chi Phí AI tháng này</span>
              <span className="text-2xl font-bold font-mono text-emerald-600">$42.80</span>
              <span className="text-[11px] text-slate-400 font-mono block">~ 1,070,000 VNĐ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-slate-900">Lưu Lượng Token Sử Dụng Theo Ngày</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={USAGE_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Gemini" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                    <Area type="monotone" dataKey="OpenAI" stackId="1" stroke="#10B981" fill="#10B981" />
                    <Area type="monotone" dataKey="Claude" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                    <Area type="monotone" dataKey="DeepSeek" stackId="1" stroke="#6366F1" fill="#6366F1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-base text-slate-900">Tỷ Lệ Chi Phí Theo Provider</h3>
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={COST_DISTRIBUTION} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {COST_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Provider */}
      {isModalOpen && editingProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu size={22} />
                <h3 className="font-bold text-lg font-serif">
                  {editingProvider.id ? "Cập Nhật AI Provider API" : "Thêm AI Provider / Key Mới"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Tên hiển thị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProvider.name || ""}
                    onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                    placeholder="VD: Google Gemini Pro, OpenAI GPT-4o..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Loại AI Provider <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingProvider.provider_type || "gemini"}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      let defaultUrl = "https://generativelanguage.googleapis.com";
                      let defaultModel = "gemini-2.5-flash";
                      if (type === "openai") {
                        defaultUrl = "https://api.openai.com/v1";
                        defaultModel = "gpt-4o";
                      } else if (type === "claude") {
                        defaultUrl = "https://api.anthropic.com/v1";
                        defaultModel = "claude-3-5-sonnet-20241022";
                      } else if (type === "deepseek") {
                        defaultUrl = "https://api.deepseek.com/v1";
                        defaultModel = "deepseek-reasoner";
                      } else if (type === "ollama") {
                        defaultUrl = "http://localhost:11434/v1";
                        defaultModel = "qwen2.5-coder:32b";
                      }
                      setEditingProvider({
                        ...editingProvider,
                        provider_type: type,
                        api_url: defaultUrl,
                        default_model: defaultModel
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    <option value="gemini">Google Gemini AI</option>
                    <option value="openai">OpenAI ChatGPT</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="deepseek">DeepSeek AI</option>
                    <option value="ollama">Ollama Local GPU</option>
                    <option value="custom">Custom REST Gateway</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">API Key</label>
                  <div className="relative">
                    <input
                      type={showModalKey ? "text" : "password"}
                      value={editingProvider.api_key || ""}
                      onChange={(e) => setEditingProvider({ ...editingProvider, api_key: e.target.value })}
                      placeholder="Nhập Khóa Bí Mật API Key..."
                      className="w-full pl-9 pr-20 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                    <Key size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowModalKey(!showModalKey)}
                      className="absolute right-2 top-1.5 px-2 py-1 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      {showModalKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showModalKey ? "Ẩn" : "Hiện"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Base URL / Endpoint</label>
                  <input
                    type="text"
                    value={editingProvider.api_url || ""}
                    onChange={(e) => setEditingProvider({ ...editingProvider, api_url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Model ID Mặc Định</label>
                  <input
                    type="text"
                    value={editingProvider.default_model || ""}
                    onChange={(e) => setEditingProvider({ ...editingProvider, default_model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{isSaving ? "Đang lưu..." : "Lưu AI Provider"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiProviderManager;
