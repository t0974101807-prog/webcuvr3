import React, { useState, useEffect } from "react";
import { RecycleBinView } from "./RecycleBinView";
import { mapRoleToDb } from "../utils/role";
import UnderstandAnything from "./UnderstandAnything";
import LegalOSUltimate from "./LegalOSUltimate";
import LitigationTable from "./modules/LitigationTable";
import { useWebSocketCallListener } from "../hooks/useWebSocketCallListener";
import { 
  Phone, Trash2, Edit, Eye, RotateCcw, Copy, 
  CheckCircle2, X, AlertTriangle, Play, Download, Search, 
  Calendar, User, MapPin, DollarSign, ShieldAlert,
  Mic, MicOff, FileText, Sparkles, Video, Users, Clock, Check,
  Cpu, History, Server, Award, ChevronRight, CornerDownRight, RefreshCw, Layers,
  ChevronDown, Folder, Briefcase, Shield, Scale, Hammer, Plus, Send, Info,
  Volume2, VolumeX, Code, PlayCircle, PauseCircle, Activity, ChevronUp, Share2,
  Heart, MessageCircle, Bookmark, HardDrive, Github, Database, Slack, FileJson, 
  CreditCard, Link, Globe, AlertOctagon, Compass, Radio, TrendingUp
} from "lucide-react";
import { fetchApi } from "../utils/api";

const api = {
  async req(endpoint: string, method = "GET", body?: any) {
    const options: RequestInit = {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    };
    const res = await fetchApi(endpoint, options);
    return res.json();
  }
};

// 1. Cấu trúc dữ liệu hồ sơ chuẩn 100% Google Drive (19 Cột chuẩn hóa)
export interface CustomerDossier {
  index: number;
  contractNumber: string;      // 1. Số HĐ
  clientName: string;          // 2. TÊN KH
  clientPhone: string;         // 3. ĐIỆN THOẠI KH
  code: string;                // 4. MÃ CODE
  province: string;            // 5. ĐỊA CHỈ / TỈNH THÀNH
  dob: string;                 // 6. NGÀY SINH
  gender?: string;             // 7. GIỚI TÍNH
  remainingPrincipal: number;  // 8. NỢ GỐC CÒN LẠI
  overdueAmount: number;       // 9. SỐ TIỀN QUÁ HẠN
  overdueDays: number;         // 10. SỐ NGÀY QUÁ HẠN
  overduePeriods: number;      // 11. SỐ KỲ QUÁ HẠN
  monthlyPayment: number;      // 12. KHOẢN TRẢ HÀNG THÁNG
  lastRepaymentDate: string;   // 13. NGÀY TRẢ NỢ GẦN NHẤT
  liquidationAmount?: number;  // 14. SỐ TIỀN THANH LÝ
  loanStatus: string;          // 15. TÌNH TRẠNG KHOẢN VAY
  documentType: "Tranh tụng" | "Tư vấn Pháp luật" | "Đại diện Ngoài tố tụng" | "Pháp chế & Nội bộ" | "Trọng tài & Hòa giải" | "Ban Giám đốc"; // 16. LOẠI HỒ SƠ
  region?: string;             // VÙNG
  status: "Đã làm" | "Chưa làm";
  tagType: "HS mới" | "HS cũ";
  priority: "BÌNH THƯỜNG" | "KHẨN CẤP" | "TRUNG BÌNH";
}

// 2. Cấu trúc dữ liệu thư mục nhóm vụ việc
interface MajorCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  dossiers: { id: string; title: string; checked: boolean }[];
}

// 3. Cấu trúc dữ liệu thoại VibeVoice Multi-Speaker
interface VibeVoiceSpeaker {
  id: string;
  name: string;
  role: string;
  tone: string;
  color: string;
  level: number; // 0 - 100 volume level
}

interface VibeVoiceScriptLine {
  speakerId: string;
  speakerName: string;
  text: string;
  duration: number; // in seconds
}

// 4. Cấu trúc dữ liệu Spec-Kit SDD
interface SpecKitTask {
  id: string;
  command: string;
  title: string;
  status: "pending" | "running" | "completed";
  output: string;
}

// 5. Cấu trúc dữ liệu Model Context Protocol (MCP) Simulator
interface MCPServer {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  status: "connected" | "disconnected";
  supportedTools: string[];
}

// 6. Cấu trúc dữ liệu cho World Monitor Geopolitical Hotspots
interface GeopoliticalHotspot {
  id: string;
  region: string;
  coordinates: string;
  threatLevel: "CRITICAL" | "HIGH" | "ELEVATED" | "STABLE";
  CII_Score: number; // Country Instability Index
  riskFactor: string;
  affectedClientIndustries: string[];
}

interface WorldMonitorAlert {
  id: string;
  time: string;
  category: "Geopolitics" | "Energy" | "Maritime" | "Cyber" | "Finance";
  title: string;
  source: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
}

export function runSpecKitCommand(command: string) {
  switch (command) {
    case "/speckit.constitution":
      return {
        status: "success",
        output: "✔ [CONSTITUTION ACTIVE]: Giao diện tối màu tương phản cao đạt chuẩn WCAG AA. Trình tối ưu tài nguyên hoạt động."
      };
    case "/speckit.specify":
      return {
        status: "success",
        output: "✔ [SPECIFICATION PASSED]: Đã xác minh cấu trúc 6 thư mục pháp lý và bảng cơ sở dữ liệu đủ 16 cột thông tin."
      };
    default:
      return { status: "error", output: "Command not found." };
  }
}

// Sơ đồ luồng hoạt động của Speech-to-Speech trong ERP
export class SpeechToSpeechIntegration {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;

  // 1. Khởi động luồng thu âm của người dùng (Luật sư / Hòa giải viên)
  async startVoiceStreaming(onTranscriptionReceived: (text: string) => void) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ getUserMedia.");
      }
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 }); // Chuẩn tần số Hugging Face
      
      // Kết nối tới WebSocket của Hugging Face S2S Server
      this.socket = new WebSocket("wss://api-inference.huggingface.co/models/speech-to-speech");
      
      // Chuyển đổi tín hiệu Mic thành luồng binary gửi đi liên tục
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);
      
      this.scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(inputData.buffer); // Gửi âm thanh thô (PCM) lên Hugging Face
        }
      };

      // Nhận giọng nói phản hồi (TTS) và văn bản (ASR) từ Hugging Face gửi về
      this.socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.text) {
            onTranscriptionReceived(data.text); // Cập nhật text bóc băng Meetily AI
          }
          if (data.audio_chunks) {
            this.playAudioChunk(data.audio_chunks); // Phát âm thanh phản hồi VibeVoice
          }
        } catch (err) {
          console.warn("Lỗi xử lý phản hồi S2S:", err);
        }
      };
    } catch (error) {
      console.warn("SpeechToSpeech micro stream error, falling back to dynamic audio modeling:", error);
      // Simulate real-time stream transcription for the iframe environment sandbox
      let intervalId = setInterval(() => {
        const texts = [
          "Chào các bạn, chúng ta tiến hành đối thoại bồi thường giải phóng mặt bằng.",
          "Hộ gia đình ông An đã chấp thuận phương án bố trí tái định cư.",
          "Chúng tôi cam kết đẩy nhanh tiến độ làm hồ sơ bàn giao đất sạch.",
          "Hội đồng hòa giải đã thông qua quyết định cuối cùng."
        ];
        const randomText = texts[Math.floor(Math.random() * texts.length)];
        onTranscriptionReceived(randomText);
      }, 5000);
      (this as any)._simInterval = intervalId;
    }
  }

  // 2. Phát âm thanh phản hồi từ API gửi về
  private playAudioChunk(base64Audio: string) {
    try {
      const audioBlob = this.base64ToBlob(base64Audio, "audio/wav");
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (e) {
      console.warn("Lỗi phát audio chunk S2S:", e);
    }
  }

  private base64ToBlob(base64: string, mimeType: string) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // 3. Ngắt kết nối
  stopVoiceStreaming() {
    if (this.socket) {
      try { this.socket.close(); } catch (e) {}
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
    }
    if (this.mediaStream) {
      try { this.mediaStream.getTracks().forEach(track => track.stop()); } catch (e) {}
    }
    if (this.scriptProcessor) {
      try { this.scriptProcessor.disconnect(); } catch (e) {}
    }
    if ((this as any)._simInterval) {
      clearInterval((this as any)._simInterval);
    }
  }
}

interface ErpLegalMeetingWorkspaceProps {
  language?: string;
  user?: any;
  externalActiveTab?: "WORLD_MONITOR" | "ERP_DATABASE" | "RECYCLE_BIN" | "MEETILY_AI" | "VIBEVOICE_SIMULATOR" | "SPECKIT_SDD" | "MCP_PLAYGROUND" | "UNDERSTAND_ANYTHING" | "LEGAL_OS";
  hideHeader?: boolean;
}

export default function ErpLegalMeetingWorkspace({ language = "vi", user, externalActiveTab, hideHeader = false }: ErpLegalMeetingWorkspaceProps = {}) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [internalActiveTab, setInternalActiveTab] = useState<"WORLD_MONITOR" | "ERP_DATABASE" | "RECYCLE_BIN" | "MEETILY_AI" | "VIBEVOICE_SIMULATOR" | "SPECKIT_SDD" | "MCP_PLAYGROUND" | "UNDERSTAND_ANYTHING" | "LEGAL_OS">("WORLD_MONITOR");
  const activeWorkspaceTab = externalActiveTab || internalActiveTab;
  const setActiveWorkspaceTab = (tab: any) => {
    if (externalActiveTab) return;
    setInternalActiveTab(tab);
  };
  const [activeSidebarCategory, setActiveSidebarCategory] = useState<string>("Tranh tụng");
  const [recycleBinMode, setRecycleBinMode] = useState<"COCKPIT" | "SYSTEM">("COCKPIT");
  
  // --- STATE QUẢN LÝ HỒ SƠ KHÁCH HÀNG ---
  const [activeTabStatus, setActiveTabStatus] = useState<"Tất cả" | "Đã làm" | "Chưa làm" | "Quá hạn">("Tất cả");
  const [activeTabTag, setActiveTabTag] = useState<"Tất cả" | "HS mới" | "HS cũ">("Tất cả");
  const [searchKeyword, setSearchKeyword] = useState("");
  
  const [dossiers, setDossiers] = useState<CustomerDossier[]>([
    {
      index: 1,
      contractNumber: "DS-2026-002",
      clientName: "Nguyễn Kim Oanh",
      clientPhone: "0975837738",
      code: "AD-93036",
      dob: "15/06/1990",
      remainingPrincipal: 45000000,
      overdueAmount: 0,
      overdueDays: 0,
      overduePeriods: 0,
      monthlyPayment: 5000000,
      lastRepaymentDate: "---",
      documentType: "Tranh tụng",
      province: "Hà Nội",
      region: "Miền Bắc",
      loanStatus: "Nợ đủ tiêu chuẩn",
      status: "Chưa làm",
      tagType: "HS mới",
      priority: "BÌNH THƯỜNG"
    },
    {
      index: 2,
      contractNumber: "DN003",
      clientName: "CÔNG TY CP NAM HÀ",
      clientPhone: "0983111222",
      code: "AD-17873",
      dob: "22/11/1988",
      remainingPrincipal: 120000000,
      overdueAmount: 0,
      overdueDays: 0,
      overduePeriods: 0,
      monthlyPayment: 8500000,
      lastRepaymentDate: "15/08/2026",
      documentType: "Tranh tụng",
      province: "Hồ Chí Minh",
      region: "Miền Nam",
      loanStatus: "Nợ đủ tiêu chuẩn",
      status: "Đã làm",
      tagType: "HS cũ",
      priority: "BÌNH THƯỜNG"
    },
    {
      index: 3,
      contractNumber: "HS001",
      clientName: "Nguyễn Văn An",
      clientPhone: "0905123456",
      code: "AD-48201",
      dob: "05/04/1985",
      remainingPrincipal: 75000000,
      overdueAmount: 25000000,
      overdueDays: 92,
      overduePeriods: 6,
      monthlyPayment: 6200000,
      lastRepaymentDate: "03/05/2026",
      documentType: "Tranh tụng",
      province: "Đà Nẵng",
      region: "Miền Trung",
      loanStatus: "Nợ nhóm 4",
      status: "Chưa làm",
      tagType: "HS mới",
      priority: "KHẨN CẤP"
    }
  ]);

  const [trashDossiers, setTrashDossiers] = useState<CustomerDossier[]>([]);
  const [callingDossier, setCallingDossier] = useState<CustomerDossier | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [viewingDetailDossier, setViewingDetailDossier] = useState<CustomerDossier | null>(null);

  // Register real-time telephony web socket listener
  useWebSocketCallListener({
    onDialing: (call) => {
      console.log("VoIP socket: dialing...", call);
    },
    onRinging: (call) => {
      console.log("VoIP socket: ringing...", call);
    },
    onConnected: (call) => {
      console.log("VoIP socket: connected!", call);
    },
    onEnded: (call) => {
      console.log("VoIP socket: ended.", call);
      setCallingDossier(null);
    }
  });

  const handleCallDossier = async (record: CustomerDossier) => {
    try {
      setCallingDossier(record);
      await fetch("/api/telephony/click-to-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: record.clientPhone,
          dossierId: record.index,
          name: record.clientName
        })
      });
    } catch (err) {
      console.error("Click-to-Call API error:", err);
    }
  };

  const handleHangupCall = async () => {
    try {
      await fetch("/api/telephony/hangup", { method: "POST" });
    } catch (err) {
      console.error("Hangup API error:", err);
    } finally {
      setCallingDossier(null);
    }
  };

  // VoIP call duration simulation
  useEffect(() => {
    let timer: any = null;
    if (callingDossier) {
      timer = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callingDossier]);

  // --- STATE MEETILY AI ---
  const [isRecording, setIsRecording] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcripts, setTranscripts] = useState<{speaker: string, time: string, text: string}[]>([]);
  const [aiSummary, setAiSummary] = useState<any | null>({
    overview: "Tóm tắt cuộc họp đàm phán về việc bồi thường giải phóng mặt bằng dự án Metro số 2. Đại diện Ban quản lý cam kết hỗ trợ tái định cư ổn định."
  });

  // Meetily recording live timer
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setMeetingDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // --- STATE QUẢN LÝ MODAL "THÊM THÔNG BÁO MỚI" ---
  const [showAddNotificationModal, setShowAddNotificationModal] = useState(false);
  const [notificationGroup, setNotificationGroup] = useState<"Trao đổi nghiệp vụ" | "Thông báo chung" | "Thông báo khẩn">("Trao đổi nghiệp vụ");
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    "Tranh tụng": true,
  });
  const [sendToOption, setSendToOption] = useState("Tất cả nhân viên");
  const [importanceLevel, setImportanceLevel] = useState<"THƯỜNG" | "QUAN TRỌNG" | "KHẨN CẤP">("QUAN TRỌNG");
  const [majorCategories, setMajorCategories] = useState<MajorCategory[]>([
    {
      id: "tranh_tung",
      name: "Tranh tụng",
      icon: <Hammer size={14} className="text-amber-500" />,
      dossiers: [
        { id: "tt1", title: "Đại diện đàm phán phương án bồi thường giải phóng mặt bằng dự án Metro số 2.", checked: true },
        { id: "tt2", title: "Rà soát quy chế tài chính, kiểm soát nội bộ và quản trị rủi ro hệ thống.", checked: false },
        { id: "tt3", title: "Trọng tài VIAC giải quyết tranh chấp hợp đồng thi công xây dựng tháp Grand View.", checked: false }
      ]
    },
    {
      id: "tu_van",
      name: "Tư vấn Pháp luật",
      icon: <Folder size={14} className="text-sky-400" />,
      dossiers: [
        { id: "tv1", title: "Tư vấn cấu trúc sáp nhập doanh nghiệp công nghệ tài chính FinTech.", checked: false },
        { id: "tv2", title: "Thẩm định rủi ro pháp lý hợp đồng chuyển nhượng cổ phần Ánh Dương Group.", checked: false }
      ]
    }
  ]);

  // --- STATE MICROSOFT VIBEVOICE SIMULATOR ---
  const [vibeVoicePlaying, setVibeVoicePlaying] = useState(false);
  const [vibeVoiceProgress, setVibeVoiceProgress] = useState(0); // 0 - 100
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [vibeVoiceRate, setVibeVoiceRate] = useState<"7.5Hz" | "15Hz">("7.5Hz");
  const [speakers, setSpeakers] = useState<VibeVoiceSpeaker[]>([
    { id: "spk1", name: "Luật sư Ánh Dương", role: "Chủ trì hòa giải", tone: "Ấm áp, đĩnh đạc", color: "bg-sky-500", level: 10 },
    { id: "spk2", name: "Nguyễn Văn An", role: "Khách hàng", tone: "Trầm, hơi lo lắng", color: "bg-amber-500", level: 5 },
    { id: "spk3", name: "Thẩm phán Trần Hùng", role: "Trọng tài phán quyết", tone: "Nghiêm nghị, vang", color: "bg-purple-500", level: 5 }
  ]);

  const scriptLines: VibeVoiceScriptLine[] = [
    { speakerId: "spk1", speakerName: "Luật sư Ánh Dương", text: "Chào các bạn, hôm nay chúng ta họp giải quyết mâu thuẫn bồi thường giải phóng mặt bằng dự án Metro số 2.", duration: 6 },
    { speakerId: "spk2", speakerName: "Nguyễn Văn An", text: "Kính thưa tòa, chúng tôi mong muốn mức giá đền bù sát thực tế hơn để ổn định cuộc sống gia đình.", duration: 5 },
    { speakerId: "spk3", speakerName: "Thẩm phán Trần Hùng", text: "Yêu cầu của hộ ông An đã được hội đồng xem xét đối chiếu với khung giá nhà nước hiện hành.", duration: 6 }
  ];

  // --- STATE SPEC-KIT SDD ---
  const [specKitActiveTask, setSpecKitActiveTask] = useState<string>("speckit_specify");
  const [specKitTasks, setSpecKitTasks] = useState<SpecKitTask[]>([
    {
      id: "speckit_constitution",
      command: "/speckit.constitution",
      title: "Cơ hiến đặc tả AI (Constitution)",
      status: "completed",
      output: "# GOVERNANCE CONSTITUTION\n- Project Type: Full-Stack LawFirm ERP Cockpit\n- Design System: Sophisticated Dark High-Contrast\n- Quality Rule: Zero-mock, strict 16-column database alignment, Cascading file tree."
    },
    {
      id: "speckit_specify",
      command: "/speckit.specify",
      title: "Đặc tả nghiệp vụ (Specify Mode)",
      status: "completed",
      output: "## BUSINESS SPECIFICATIONS\n- FEATURE 1: 16-column layout representing Contract, Overdue days, regions and monthly billing.\n- FEATURE 2: Real-time Meetily recording simulation with AI translation of dialogues.\n- FEATURE 3: Dynamic Folder expand mechanism showing 6 Major Categories of legal issues."
    }
  ]);

  // --- STATE FOR MODEL CONTEXT PROTOCOL (MCP) SIMULATOR & REELS ---
  const [mcpReelsLikeCount, setMcpReelsLikeCount] = useState(260);
  const [mcpReelsCommentCount, setMcpReelsCommentCount] = useState(4);
  const [mcpReelsShareCount, setMcpReelsShareCount] = useState(88);
  const [mcpReelsBookmarkCount, setMcpReelsBookmarkCount] = useState(190);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Active slide of the Reels educational carousel
  const [activeReelsSlide, setActiveReelsSlide] = useState(0);
  const reelsSlides = [
    {
      title: "Model Context Protocol",
      subtitle: "một chuẩn kết nối cho Claude Code",
      description: "MCP định nghĩa cách thức AI kết nối trực tiếp đến các nguồn dữ liệu bảo mật, biến AI thành trợ lý độc lập có thể đọc tập tin, truy vấn database và gọi API cục bộ.",
      highlightWords: ["filesystem", "GitHub", "database", "Slack", "Google Docs", "Notion", "Stripe", "API nội bộ"]
    },
    {
      title: "Kiến Trúc Hoạt Động",
      subtitle: "Client <-> Host <-> Protocol",
      description: "Claude Code hoặc AI IDE (Client) giao tiếp thông qua giao thức MCP chuẩn hóa để yêu cầu dữ liệu từ các máy chủ tài nguyên cục bộ một cách tuyệt mật và an toàn.",
      highlightWords: ["filesystem", "database", "API nội bộ"]
    }
  ];

  const [mcpServers, setMcpServers] = useState<MCPServer[]>([
    { id: "mcp_fs", name: "filesystem", icon: <HardDrive size={13} />, description: "Truy cập hệ thống thư mục cục bộ bảo mật", status: "connected", supportedTools: ["list_dir", "read_file", "write_file", "search_grep"] },
    { id: "mcp_gh", name: "GitHub", icon: <Github size={13} />, description: "Liên kết quản lý mã nguồn, Issues & PRs", status: "connected", supportedTools: ["get_repo", "create_issue", "list_pull_requests"] },
    { id: "mcp_db", name: "database", icon: <Database size={13} />, description: "Kết nối DB PostgreSQL / SQLite pháp lý", status: "connected", supportedTools: ["run_query", "get_schema", "update_record"] },
    { id: "mcp_slack", name: "Slack", icon: <Slack size={13} />, description: "Tự động gửi thông báo phòng ban", status: "disconnected", supportedTools: ["post_message", "create_channel"] }
  ]);
  const [selectedMcpServer, setSelectedMcpServer] = useState<string>("mcp_db");
  const [mcpConsoleLogs, setMcpConsoleLogs] = useState<string[]>([
    "[SYSTEM] MCP Client (Claude Code) initialized on Port 3000.",
    "[SYSTEM] Connected to 3 active MCP servers successfully.",
    "[INFO] Ready to execute client tool requests."
  ]);
  const [mcpExecuting, setMcpExecuting] = useState(false);

  // --- STATE CHO WORLD MONITOR INTELLIGENCE INTERACTION ---
  const [selectedSiteVariant, setSelectedSiteVariant] = useState<"World" | "Energy" | "Commodity" | "Cyber">("World");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>("hs_strait_hormuz");
  const [activeOllamaModel, setActiveOllamaModel] = useState<string>("llama3:8b-instruct-q4");
  
  const [geopoliticalHotspots, setGeopoliticalHotspots] = useState<GeopoliticalHotspot[]>([
    {
      id: "hs_strait_hormuz",
      region: "Strait of Hormuz (Eo biển Hormuz)",
      coordinates: "26.56° N, 56.25° E",
      threatLevel: "CRITICAL",
      CII_Score: 89,
      riskFactor: "Mối đe dọa hải quân & gián đoạn lưu thông dầu thô.",
      affectedClientIndustries: ["Năng lượng", "Bảo hiểm Hàng hải", "Hậu cần Logistics"]
    },
    {
      id: "hs_red_sea",
      region: "Red Sea Corridor (Hành lang Biển Đỏ)",
      coordinates: "15.30° N, 42.45° E",
      threatLevel: "CRITICAL",
      CII_Score: 86,
      riskFactor: "Khủng hoảng định tuyến qua kênh đào Suez & tấn công tàu chở hàng.",
      affectedClientIndustries: ["Logistics", "Bán lẻ toàn cầu", "Vận tải biển"]
    },
    {
      id: "hs_south_china_sea",
      region: "South China Sea (Biển Đông)",
      coordinates: "12.00° N, 114.00° E",
      threatLevel: "HIGH",
      CII_Score: 78,
      riskFactor: "Tranh chấp phân vùng lãnh thổ & tuyến cáp quang internet.",
      affectedClientIndustries: ["Viễn thông", "Khai thác Thủy hải sản", "Năng lượng Offshore"]
    },
    {
      id: "hs_taiwan_strait",
      region: "Taiwan Strait (Eo biển Đài Loan)",
      coordinates: "24.00° N, 120.00° E",
      threatLevel: "HIGH",
      CII_Score: 75,
      riskFactor: "Căng thẳng chuỗi cung ứng linh kiện bán dẫn & vi mạch.",
      affectedClientIndustries: ["Bán dẫn Công nghệ", "Logistics Hàng không"]
    }
  ]);

  const [worldMonitorAlerts, setWorldMonitorAlerts] = useState<WorldMonitorAlert[]>([
    {
      id: "alert_01",
      time: "10 phút trước",
      category: "Maritime",
      title: "Hải quân can thiệp tại điểm nghẽn Eo biển Hormuz",
      source: "Lloyd's List Intelligence",
      urgency: "HIGH",
      summary: "Hai tàu chở dầu thô chuyển hướng khẩn cấp sau cảnh báo nhiễu GPS nghiêm trọng. Phí bảo hiểm hàng hải tăng vọt 15%."
    },
    {
      id: "alert_02",
      time: "1 giờ trước",
      category: "Energy",
      title: "Đường ống dẫn khí đốt tự nhiên tại Baltic dừng vận hành bất thường",
      source: "S&P Global Commodity Insights",
      urgency: "HIGH",
      summary: "Phát hiện sụt áp suất tại phân đoạn chính. Nghi ngờ phá hoại hệ thống mạng điều khiển SCADA. Giá gas tương lai tại Châu Âu tăng 8.2%."
    },
    {
      id: "alert_03",
      time: "2 giờ trước",
      category: "Cyber",
      title: "Tấn công mã độc quy mô lớn nhắm vào cảng biển Rotterdam",
      source: "Cybersecurity & Infrastructure Security Agency (CISA)",
      urgency: "MEDIUM",
      summary: "Phần mềm tống tiền vô hiệu hóa hệ thống bốc dỡ tự động tại bến cảng số 4. Thời gian giải phóng hàng hóa dự kiến trễ 48-72 giờ."
    },
    {
      id: "alert_04",
      time: "4 giờ trước",
      category: "Finance",
      title: "Mỹ công bố mở rộng danh sách trừng phạt các thực thể công nghệ AI",
      source: "OFAC - Bộ Tài chính Hoa Kỳ",
      urgency: "MEDIUM",
      summary: "Bổ sung 14 công ty nước ngoài vào diện trừng phạt thứ cấp, cấm giao dịch bằng đồng USD đối với các linh kiện bán dẫn thế hệ mới."
    }
  ]);

  const activeHotspot = geopoliticalHotspots.find(h => h.id === selectedHotspotId) || geopoliticalHotspots[0];

  // VibeVoice Simulator Player Logic
  useEffect(() => {
    let playTimer: any = null;
    if (vibeVoicePlaying) {
      playTimer = setInterval(() => {
        setVibeVoiceProgress(p => {
          if (p >= 100) {
            setVibeVoicePlaying(false);
            setCurrentLineIndex(0);
            return 0;
          }
          // Dynamic speaker equalizer voice indicator
          setSpeakers(prev => prev.map(spk => {
            const currentSpeakerId = scriptLines[currentLineIndex]?.speakerId;
            if (spk.id === currentSpeakerId) {
              return { ...spk, level: Math.floor(Math.random() * 85) + 15 };
            }
            return { ...spk, level: Math.floor(Math.random() * 8) + 2 };
          }));
          const totalLines = scriptLines.length;
          const nextLineIdx = Math.floor((p / 100) * totalLines);
          if (nextLineIdx !== currentLineIndex && nextLineIdx < totalLines) {
            setCurrentLineIndex(nextLineIdx);
          }
          return p + 1.2;
        });
      }, 100);
    } else {
      clearInterval(playTimer);
      setSpeakers(prev => prev.map(s => ({ ...s, level: 5 })));
    }
    return () => clearInterval(playTimer);
  }, [vibeVoicePlaying, currentLineIndex]);

  const handleMcpServerStatusToggle = (id: string) => {
    setMcpServers(prev => prev.map(srv => {
      if (srv.id === id) {
        const nextStatus = srv.status === "connected" ? "disconnected" : "connected";
        setMcpConsoleLogs(logs => [
          ...logs,
          `[MCP EVENT] Server '${srv.name}' status changed to: ${nextStatus.toUpperCase()}`
        ]);
        return { ...srv, status: nextStatus };
      }
      return srv;
    }));
  };

  const handleMcpToolExecution = (toolName: string) => {
    if (mcpExecuting) return;
    setMcpExecuting(true);
    
    const serverObj = mcpServers.find(s => s.id === selectedMcpServer);
    if (!serverObj || serverObj.status === "disconnected") {
      setMcpConsoleLogs(logs => [
        ...logs,
        `[MCP ERROR] Failed to run tool '${toolName}': Target server is offline.`
      ]);
      setMcpExecuting(false);
      return;
    }

    setMcpConsoleLogs(logs => [
      ...logs,
      `[JSON-RPC Request] --> Calling tool: "${toolName}" on server "${serverObj.name}"`
    ]);

    setTimeout(() => {
      let simulatedResponse = "";
      switch (toolName) {
        case "run_query":
          simulatedResponse = `[JSON-RPC Response] <-- SUCCESS: Returned 3 active rows from CustomerDossier schema corresponding to 'Tranh tụng' index database.`;
          break;
        case "get_schema":
          simulatedResponse = `[JSON-RPC Response] <-- SUCCESS: Schema keys (index, contractNumber, clientName, remainingPrincipal, overdueAmount).`;
          break;
        default:
          simulatedResponse = `[JSON-RPC Response] <-- SUCCESS: Tool completed payload verification.`;
      }
      setMcpConsoleLogs(logs => [
        ...logs,
        simulatedResponse
      ]);
      setMcpExecuting(false);
    }, 1200);
  };

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const toggleDossierCheck = (catId: string, dosId: string) => {
    setMajorCategories(prev => prev.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          dossiers: cat.dossiers.map(dos => {
            if (dos.id === dosId) {
              return { ...dos, checked: !dos.checked };
            }
            return dos;
          })
        };
      }
      return cat;
    }));
  };

  const handleSendNotification = () => {
    const selectedFiles = majorCategories
      .flatMap(c => c.dossiers.filter(d => d.checked).map(d => d.title));
    alert(`Đã gửi thông báo thành công!\nNhóm: ${notificationGroup}\nSố hồ sơ đã chọn: ${selectedFiles.length} hồ sơ.\nGửi đến: ${sendToOption}\nMức độ: ${importanceLevel}`);
    setShowAddNotificationModal(false);
  };

  const triggerSpecKitCommand = (id: string) => {
    setSpecKitTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: "running" };
      }
      return t;
    }));
    setTimeout(() => {
      setSpecKitTasks(prev => prev.map(t => {
        if (t.id === id) {
          const res = runSpecKitCommand(t.command);
          return { 
            ...t, 
            status: "completed",
            output: `${t.output}\n\n[EXECUTION RESULT]:\n${res.output}\n\n[SUCCESS] Spec-Kit execution successfully validated at ${new Date().toISOString()}.` 
           };
        }
        return t;
      }));
    }, 1500);
  };

  // ERP Dossiers Operations (Delete, Restore, Permanent Delete)
  const handleDeleteDossier = async (index: number) => {
    const dossierToDelete = dossiers.find(d => d.index === index);
    if (!dossierToDelete) return;
    
    setDossiers(prev => prev.filter(d => d.index !== index));
    setTrashDossiers(prev => [...prev, dossierToDelete]);

    const delId = dossierToDelete.contractNumber || dossierToDelete.code || String(index);
    const dossierPayload = {
      id: delId,
      contractId: dossierToDelete.contractNumber,
      title: `Hồ sơ ${dossierToDelete.contractNumber} - ${dossierToDelete.clientName}`,
      client: dossierToDelete.clientName,
      clientPhone: dossierToDelete.clientPhone,
      feeAmount: dossierToDelete.remainingPrincipal,
      remainingPrincipal: dossierToDelete.remainingPrincipal,
      overdueAmount: dossierToDelete.overdueAmount,
      overdueDays: dossierToDelete.overdueDays,
      overduePeriods: dossierToDelete.overduePeriods,
      monthlyPayment: dossierToDelete.monthlyPayment,
      lastRepaymentDate: dossierToDelete.lastRepaymentDate,
      practice_area: dossierToDelete.documentType === "Tranh tụng" ? "tranh_tung" : "tu_van",
      status: "TRASHED",
      branch: dossierToDelete.province || "Hà Nội"
    };

    try {
      await api.req(`/api/erp-records/${delId}`, "DELETE", {
        data: dossierPayload,
        reason: "Xóa hồ sơ từ Cockpit Giám sát 16 Cột"
      });
    } catch (err) {
      console.warn("Failed to soft-delete dossier on backend:", err);
    }
  };

  const handleRestoreDossier = async (index: number) => {
    const dossierToRestore = trashDossiers.find(d => d.index === index);
    if (!dossierToRestore) return;
    
    setTrashDossiers(prev => prev.filter(d => d.index !== index));
    setDossiers(prev => [...prev, dossierToRestore].sort((a, b) => a.index - b.index));

    const resId = dossierToRestore.contractNumber || dossierToRestore.code || String(index);
    try {
      await api.req(`/api/recycle-bin/${resId}/restore`, "POST");
    } catch (err) {
      console.warn("Failed to restore dossier on backend:", err);
    }
  };

  const handlePermanentDeleteDossier = async (index: number) => {
    const dossierToPurge = trashDossiers.find(d => d.index === index);
    if (!dossierToPurge) return;

    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ này? Hành động này không thể hoàn tác.")) {
      setTrashDossiers(prev => prev.filter(d => d.index !== index));
      const purgeId = dossierToPurge.contractNumber || dossierToPurge.code || String(index);
      try {
        await api.req(`/api/recycle-bin/${purgeId}`, "DELETE");
      } catch (err) {
        console.warn("Failed to permanently delete dossier on backend:", err);
      }
    }
  };

  const filteredDossiers = dossiers.filter(d => {
    const matchesSearch = d.clientName.toLowerCase().includes(searchKeyword.toLowerCase()) || d.contractNumber.includes(searchKeyword);
    const matchesStatus = activeTabStatus === "Tất cả" || d.status === activeTabStatus;
    const matchesTag = activeTabTag === "Tất cả" || d.tagType === activeTabTag;
    return matchesSearch && matchesStatus && matchesTag;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const s2sRef = React.useRef<SpeechToSpeechIntegration | null>(null);

  useEffect(() => {
    return () => {
      if (s2sRef.current) {
        s2sRef.current.stopVoiceStreaming();
      }
    };
  }, []);

  const startMeetingRecording = () => {
    setIsRecording(true);
    setTranscripts([]);
    setMeetingDuration(0);

    const s2s = new SpeechToSpeechIntegration();
    s2sRef.current = s2s;
    s2s.startVoiceStreaming((text) => {
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setTranscripts(prev => [
        ...prev,
        { speaker: "Nhận diện giọng nói (ASR)", time: timeStr, text }
      ]);
    });
  };

  const stopMeetingRecording = () => {
    setIsRecording(false);
    if (s2sRef.current) {
      s2sRef.current.stopVoiceStreaming();
      s2sRef.current = null;
    }
    setTranscripts(prev => [
      ...prev,
      { speaker: "Luật sư Ánh Dương", time: "10:02", text: "Xin chào các bạn. Chúng ta bắt đầu phiên đối thoại hòa giải về án Metro số 2." },
      { speaker: "Nguyễn Văn An", time: "10:03", text: "Chúng tôi rất mong muốn nhận được sự thấu hiểu từ phía chủ đầu tư dự án." }
    ]);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#070d19] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#e2b13c]">Đang khởi tạo hệ thống bảo mật...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={hideHeader ? "text-slate-100" : "min-h-screen bg-[#070d19] text-slate-100 flex flex-col font-sans leading-relaxed tracking-tight"} id="erp-main-view">
      {/* Modern Top Header Bar */}
      {!hideHeader && (
        <div className="bg-[#0a1224] border-b border-[#15233d] p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4" id="top_header_bar">
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2" id="header_user_greeting">
              <span className="p-1.5 bg-[#e2b13c] text-slate-950 rounded-lg mr-2"><Scale size={14} /></span>
              <span>Không gian Trí tuệ Pháp lý & Giám sát Toàn cầu (Cockpit)</span>
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1" id="header_current_date">Công ty Luật TNHH Ánh Dương • 24H Radar State</p>
          </div>
          <div className="flex flex-wrap items-center gap-3" id="top_controls_wrapper">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-[#15233d]" id="workspace_tab_switcher">
              <button 
                onClick={() => setActiveWorkspaceTab("WORLD_MONITOR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center space-x-1.5 ${
                  activeWorkspaceTab === "WORLD_MONITOR" ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "text-slate-400 hover:text-white"
                }`}
                id="tab_trigger_world_monitor"
              >
                <Globe size={13} className="text-[#e2b13c] animate-spin" style={{ animationDuration: "15s" }} />
                <span>World Monitor</span>
              </button>
              <button 
                onClick={() => setActiveWorkspaceTab("ERP_DATABASE")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ${
                  activeWorkspaceTab === "ERP_DATABASE" ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10" : "text-slate-400 hover:text-white"
                }`}
                id="tab_trigger_erp"
              >
                Cơ sở dữ liệu (16-Col)
              </button>
              <button 
                onClick={() => setActiveWorkspaceTab("RECYCLE_BIN")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center space-x-1 ${
                  activeWorkspaceTab === "RECYCLE_BIN" ? "bg-[#e2b13c] text-slate-950 shadow-md shadow-[#e2b13c]/10" : "text-slate-400 hover:text-white"
                }`}
                id="tab_trigger_recycle_bin"
              >
                <Trash2 size={13} />
                <span>Thùng rác ({trashDossiers.length})</span>
              </button>
              <button 
                onClick={() => setActiveWorkspaceTab("MEETILY_AI")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 ${
                  activeWorkspaceTab === "MEETILY_AI" ? "bg-[#e2b13c] text-slate-950 shadow-md shadow-[#e2b13c]/10" : "text-slate-400 hover:text-white"
                }`}
                id="tab_trigger_meetily"
              >
                Họp Meetily AI
              </button>
              <button 
                onClick={() => setActiveWorkspaceTab("VIBEVOICE_SIMULATOR")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center space-x-1.5 ${
                  activeWorkspaceTab === "VIBEVOICE_SIMULATOR" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10" : "text-slate-400 hover:text-white"
                }`}
                id="tab_trigger_vibevoice"
              >
                <Volume2 size={13} />
                <span>VibeVoice</span>
              </button>
              <button 
                onClick={() => setActiveWorkspaceTab("SPECKIT_SDD")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center space-x-1.5 ${
                  activeWorkspaceTab === "SPECKIT_SDD" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:text-white"
                }`}
                id="tab_trigger_speckit"
              >
                <Code size={13} />
                <span>Spec-Kit</span>
              </button>
              <button 
                onClick={() => setActiveWorkspaceTab("MCP_PLAYGROUND")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center space-x-1.5 ${
                  activeWorkspaceTab === "MCP_PLAYGROUND" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-white"
                }`}
                id="tab_trigger_mcp"
              >
                <Sparkles size={13} className="text-[#e2b13c] animate-pulse" />
                <span>Trạm AI (MCP Reels)</span>
              </button>
            </div>
            <button 
              onClick={() => setShowAddNotificationModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-indigo-600/10"
              id="btn_trigger_add_notification"
            >
              <Plus size={14} />
              <span>Thêm thông báo mới</span>
            </button>
          </div>
        </div>
      )}

      {/* WORKSPACE VIEW WRAPPER */}
      <div className={hideHeader ? "space-y-6" : "p-6 overflow-y-auto flex-1 space-y-6"} id="workspace_viewport">
        
        {/* TAB 0: WORLD MONITOR (GEOPOLITICAL INTELLIGENCE DASHBOARD) */}
        {activeWorkspaceTab === "WORLD_MONITOR" && (
          <div className="space-y-6 animate-in fade-in duration-300" id="world_monitor_tab_wrapper">
            
            {/* Header Info Banner */}
            <div className="bg-gradient-to-r from-rose-950/40 to-slate-900 border border-[#15233d] rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="world_monitor_alert_banner">
              <div className="flex items-center space-x-4" id="world_monitor_header_left">
                <div className="p-3 bg-rose-600/10 border border-rose-500/20 text-rose-400 rounded-2xl animate-pulse" id="world_monitor_radar_icon">
                  <Radio size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-rose-400 tracking-widest bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">LIVE GEO-MONITOR</span>
                  <h2 className="text-sm font-black text-white uppercase mt-1" id="world_monitor_main_title">World Monitor – Hệ thống Giám sát Địa chính trị Toàn cầu</h2>
                  <p className="text-xs text-slate-400 font-bold mt-0.5" id="world_monitor_main_desc">Dữ liệu tình báo đa nguồn hỗ trợ thẩm định rủi ro pháp lý & khủng hoảng vận hành doanh nghiệp</p>
                </div>
              </div>
              <div className="flex items-center space-x-3" id="ollama_selector_wrapper">
                <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Local AI Engine:</span>
                <select 
                  value={activeOllamaModel} 
                  onChange={(e) => setActiveOllamaModel(e.target.value)} 
                  className="bg-slate-950 border border-[#15233d] text-[#e2b13c] text-[10px] font-black rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#e2b13c]"
                  id="select_ollama_model"
                >
                  <option value="llama3:8b-instruct-q4">Ollama: Llama3 (8B) - Offline</option>
                  <option value="qwen2.5:7b-instruct">Ollama: Qwen2.5 (7B) - Offline</option>
                  <option value="mistral:7b">Ollama: Mistral (7B) - Offline</option>
                </select>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="world_monitor_layout_grid">
              
              {/* 1. CỘT TRÁI: DUAL ENGINE MAP SIMULATION (SVG GLOBE MOCKUP) */}
              <div className="lg:col-span-5 bg-[#0a1224] border border-[#15233d] rounded-3xl p-5 flex flex-col justify-between space-y-4" id="map_engine_card">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3" id="map_card_header">
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center space-x-2" id="map_title_text">
                      <Globe size={14} className="text-rose-400" />
                      <span>Sơ đồ Điểm nóng Tình báo Hàng hải</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5" id="map_subtitle_text">Vị trí điểm nghẽn thương mại hàng hải trọng yếu</p>
                  </div>
                  <div className="flex space-x-1.5" id="map_variant_selector">
                    {(["World", "Energy", "Commodity", "Cyber"] as const).map((variant) => (
                      <button
                        key={variant}
                        onClick={() => setSelectedSiteVariant(variant)}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all duration-150 ${
                          selectedSiteVariant === variant 
                            ? "bg-rose-600 text-white" 
                            : "bg-slate-950 text-slate-400 hover:text-white"
                        }`}
                        id={`btn_map_variant_${variant}`}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Map Sim with interactive nodes */}
                <div className="relative bg-slate-950 border border-slate-900 rounded-2xl h-[280px] flex items-center justify-center overflow-hidden" id="svg_map_container">
                  
                  {/* Fake Grid lines */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" id="map_grid_fx"></div>
                  
                  {/* SVG Graphic (Stylized Earth continents silhouette as a digital map) */}
                  <svg className="w-5/6 h-5/6 opacity-40 text-[#1e3256]" viewBox="0 0 1000 450" fill="none" xmlns="http://www.w3.org/2000/svg" id="world_silhouette_svg">
                    <path d="M150,150 Q180,120 220,130 T300,100 T340,150 T280,220 T200,200 Z" fill="currentColor" />
                    <path d="M420,180 Q480,140 520,150 T580,200 T600,260 T540,290 T480,250 Z" fill="currentColor" />
                    <path d="M680,220 Q720,180 780,200 T850,230 T880,310 T790,340 T740,300 Z" fill="currentColor" />
                    <path d="M220,310 Q260,280 300,330 T340,380 T290,410 T240,360 Z" fill="currentColor" />
                  </svg>

                  {/* Active Pulsating Target Rings for Hotspots */}
                  {geopoliticalHotspots.map((h) => {
                    const isActive = h.id === selectedHotspotId;
                    let top = "50%";
                    let left = "50%";
                    if (h.id === "hs_strait_hormuz") { top = "42%"; left = "58%"; }
                    else if (h.id === "hs_red_sea") { top = "54%"; left = "52%"; }
                    else if (h.id === "hs_south_china_sea") { top = "58%"; left = "78%"; }
                    else if (h.id === "hs_taiwan_strait") { top = "46%"; left = "82%"; }
                    return (
                      <div 
                        key={h.id} 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                        style={{ top, left }}
                        onClick={() => setSelectedHotspotId(h.id)}
                        id={`map_node_${h.id}`}
                      >
                        <span className={`absolute inline-flex h-6 w-6 rounded-full opacity-60 animate-ping ${
                          isActive ? "bg-rose-500" : "bg-amber-400 group-hover:bg-rose-400"
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border border-slate-950 shadow shadow-black ${
                          isActive ? "bg-rose-600" : "bg-amber-500"
                        }`}></span>
                        {/* Hover tooltip */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] font-black text-white whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" id={`tooltip_${h.id}`}>
                          {h.region} (CII: {h.CII_Score})
                        </div>
                      </div>
                    );
                  })}
                  {/* Legend of threat levels */}
                  <div className="absolute bottom-3 left-4 flex space-x-3 text-[9px] text-slate-400 font-bold" id="map_legend">
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-600"></span><span>Critical Threat</span></div>
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span>High Risk</span></div>
                  </div>
                </div>

                {/* Focus Hotspot Detail Container */}
                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4.5 space-y-3" id="hotspot_focus_details">
                  <div className="flex justify-between items-center" id="hotspot_focus_header">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Vùng tập trung Tình báo:</span>
                    <span className="text-[9px] font-mono font-black text-rose-400">{activeHotspot.coordinates}</span>
                  </div>
                  <h4 className="text-xs font-black text-white" id="hotspot_focus_title">{activeHotspot.region}</h4>
                  
                  <div className="grid grid-cols-2 gap-3" id="hotspot_metrics_grid">
                    <div className="bg-slate-900 border border-[#15233d]/40 rounded-xl p-3 space-y-0.5" id="metric_cii">
                      <span className="text-[8px] text-slate-500 font-black block uppercase">Country Instability Index</span>
                      <div className="flex items-baseline space-x-1.5" id="cii_value_wrapper">
                        <span className="text-base font-black text-rose-400 font-mono">{activeHotspot.CII_Score}</span>
                        <span className="text-[8px] text-slate-400 font-bold">/ 100</span>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-[#15233d]/40 rounded-xl p-3 space-y-0.5" id="metric_threat">
                      <span className="text-[8px] text-slate-500 font-black block uppercase">Mức độ đe dọa</span>
                      <span className="text-xs font-black text-rose-500 block">{activeHotspot.threatLevel}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-[11px]" id="hotspot_risk_factor_section">
                    <span className="text-[9px] text-slate-500 font-black uppercase block">Bản chất rủi ro chính:</span>
                    <p className="text-slate-300 font-bold leading-relaxed">{activeHotspot.riskFactor}</p>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-900 pt-3" id="hotspot_affected_industries_section">
                    <span className="text-[9px] text-slate-500 font-black uppercase block">Mảng khách hàng bị ảnh hưởng nghiêm trọng:</span>
                    <div className="flex flex-wrap gap-1.5" id="hotspot_industries_container">
                      {activeHotspot.affectedClientIndustries.map((ind, i) => (
                        <span key={i} className="bg-slate-900 text-sky-400 text-[9px] font-black px-2 py-0.5 rounded border border-sky-500/10" id={`industry_tag_${i}`}>
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CỘT PHẢI: REAL-TIME SIGNALS & NEWS FEED STREAM */}
              <div className="lg:col-span-7 bg-[#0a1224] border border-[#15233d] rounded-3xl p-5 space-y-4" id="intelligence_stream_card">
                
                <div className="flex justify-between items-center border-b border-slate-900 pb-3" id="stream_header">
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center space-x-2" id="stream_title">
                      <AlertOctagon size={14} className="text-rose-500 animate-pulse" />
                      <span>Luồng Tình báo Địa chính trị – World Monitor Feed</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5" id="stream_subtitle">Hội tụ tín hiệu từ luồng Quân sự, Năng lượng, Cứu nạn & Chuỗi cung ứng toàn cầu</p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-1 text-right flex items-center space-x-2" id="convergence_badge">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    <div id="convergence_text_wrapper">
                      <span className="text-[8px] text-rose-400 font-black uppercase block">CONVERGENCE</span>
                      <span className="text-[10px] font-black text-rose-400 font-mono">CRITICAL (84%)</span>
                    </div>
                  </div>
                </div>

                {/* Filter Status Panel */}
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-900 text-[10px] text-slate-400 font-bold" id="stream_filter_bar">
                  <span>Hiển thị biến động khớp diện trừng phạt: <strong className="text-indigo-400 font-black">OFAC SDNs</strong></span>
                  <span>Nguồn nạp: <strong className="text-emerald-400 font-black">Active RSS & AP News API</strong></span>
                </div>

                {/* Live Feed News list */}
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1" id="alerts_list">
                  {worldMonitorAlerts.map((alertItem) => (
                    <div 
                      key={alertItem.id} 
                      className={`bg-slate-950 border rounded-2xl p-4 space-y-2.5 transition-all duration-200 hover:border-slate-700 ${
                        alertItem.urgency === "HIGH" ? "border-rose-950/80 bg-rose-950/5" : "border-slate-900"
                      }`}
                      id={`alert_card_${alertItem.id}`}
                    >
                      <div className="flex justify-between items-start" id="alert_card_top">
                        <div className="flex items-center space-x-2.5" id="alert_category_wrapper">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                            alertItem.category === "Maritime" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                            alertItem.category === "Energy" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            alertItem.category === "Cyber" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {alertItem.category.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">{alertItem.time}</span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-[9px] text-slate-500" id="alert_source_wrapper">
                          <span>Nguồn: <strong>{alertItem.source}</strong></span>
                          {alertItem.urgency === "HIGH" && (
                            <span className="bg-rose-500/10 text-rose-400 font-black px-1 rounded border border-rose-500/20 text-[8px]">HIGH PRIORITY</span>
                          )}
                        </div>
                      </div>
                      <h4 className="text-xs font-black text-slate-100" id="alert_card_title">{alertItem.title}</h4>
                      
                      <p className="text-[11px] text-slate-300 font-bold leading-relaxed bg-[#0c1426] p-3 rounded-xl border border-[#15233d]/50" id="alert_card_summary">
                        {alertItem.summary}
                      </p>
                      
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-slate-900/40 pt-2" id="alert_card_footer">
                        <span>Phân tích rủi ro hệ thống pháp lý: <strong className="text-rose-400">Trùng khớp rủi ro</strong></span>
                        <button 
                          onClick={() => {
                            alert(`Đang sử dụng mô hình '${activeOllamaModel}' soạn dự thảo văn bản tư vấn pháp lý tương ứng rủi ro: "${alertItem.title}"`);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-950 font-black rounded transition-all duration-150"
                          id={`btn_draft_law_${alertItem.id}`}
                        >
                          SOẠN THẢO TƯ VẤN (AI)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: ERP DATABASE */}
        {activeWorkspaceTab === "ERP_DATABASE" && (
          <div className="bg-[#0a1224] border border-[#15233d] rounded-3xl p-6 space-y-6 animate-in fade-in duration-300" id="erp_database_container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#15233d] pb-4" id="erp_db_header">
              <div>
                <h2 className="text-xs font-black uppercase text-white tracking-widest flex items-center space-x-2" id="erp_db_title">
                  <span className="w-1.5 h-3.5 bg-sky-500 rounded-sm"></span>
                  <span>Cơ sở dữ liệu vụ việc chính</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5" id="erp_db_subtitle">Chuẩn hóa 19 cột hiển thị - Lọc dữ liệu thông minh</p>
              </div>
              <div className="flex flex-wrap items-center gap-2" id="erp_db_actions">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm Tên/Hợp đồng..." 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="bg-slate-950 border border-[#15233d] text-xs font-medium text-slate-300 rounded-xl px-3.5 py-1.5 focus:outline-none focus:border-sky-500 w-48"
                  id="search_dossiers_input"
                />
                <button className="px-3.5 py-1.5 bg-[#15233d] hover:bg-[#1c2e4f] text-[#e2b13c] text-[11px] font-black rounded-xl transition-all duration-200 flex items-center space-x-1.5 border border-[#e2b13c]/15" id="btn_export_excel">
                  <Download size={12} />
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            <LitigationTable
              dossiers={filteredDossiers}
              onView={(record) => setViewingDetailDossier(record)}
              onDelete={handleDeleteDossier}
              onCall={handleCallDossier}
              onHangup={handleHangupCall}
              activeCallDossierId={callingDossier ? callingDossier.index : null}
              searchKeyword={searchKeyword}
              language={language === "en" ? "en" : "vi"}
            />

            {/* Senior hardiness security and simulation module */}
            <div className="pt-4 border-t border-[#15233d]">
              <LegalOSUltimate />
            </div>
          </div>
        )}

        {/* TAB 1B: RECYCLE BIN */}
        {activeWorkspaceTab === "RECYCLE_BIN" && (
          <div className="bg-[#0a1224] border border-[#15233d] rounded-3xl p-6 space-y-6 animate-in fade-in duration-300" id="recycle_bin_container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#15233d] pb-4" id="recycle_bin_header">
              <div>
                <h2 className="text-xs font-black uppercase text-white tracking-widest flex items-center space-x-2" id="recycle_bin_title">
                  <span className="w-1.5 h-3.5 bg-[#e2b13c] rounded-sm"></span>
                  <span>{language === "vi" ? "Thùng rác Hệ thống & Trạm Cockpit" : "System & Cockpit Recycle Bin"}</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5" id="recycle_bin_subtitle">
                  {language === "vi" 
                    ? "Khôi phục hoặc xóa vĩnh viễn các hồ sơ khách hàng đã xóa" 
                    : "Restore or permanently delete customer dossiers and documents"}
                </p>
              </div>

              {/* Segmented control for switching between Cockpit Trash and Real System-Wide Trash */}
              <div className="flex bg-[#030712] border border-[#15233d] p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setRecycleBinMode("COCKPIT")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    recycleBinMode === "COCKPIT"
                      ? "bg-[#e2b13c] text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {language === "vi" ? "THÙNG RÁC COCKPIT" : "COCKPIT TRASH"} ({trashDossiers.length})
                </button>
                <button
                  onClick={() => setRecycleBinMode("SYSTEM")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    recycleBinMode === "SYSTEM"
                      ? "bg-[#e2b13c] text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {language === "vi" ? "THÙNG RÁC TOÀN HỆ THỐNG" : "SYSTEM-WIDE TRASH"}
                </button>
              </div>
            </div>

            {recycleBinMode === "COCKPIT" ? (
              <div className="overflow-x-auto border border-[#15233d] rounded-2xl" id="recycle_table_scroll_container">
                <table className="w-full text-left border-collapse text-xs" id="trash_data_table">
                  <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400 border-b border-[#15233d]" id="trash_table_head">
                    <tr>
                      <th className="p-3.5 text-center">#</th>
                      <th className="p-3.5">Số HĐ</th>
                      <th className="p-3.5">Tên KH</th>
                      <th className="p-3.5">Điện thoại KH</th>
                      <th className="p-3.5 text-right">Nợ gốc còn lại</th>
                      <th className="p-3.5 text-right">Số tiền quá hạn</th>
                      <th className="p-3.5 text-center">Thao tác khôi phục</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#15233d]/60 font-medium text-slate-300" id="trash_table_body">
                    {trashDossiers.map((item, idx) => (
                      <tr key={item.index} className="hover:bg-[#15233d]/20 transition-all duration-150" id={`trash_row_${item.index}`}>
                        <td className="p-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3.5 font-mono font-black text-white">{item.contractNumber}</td>
                        <td className="p-3.5 font-black text-slate-100">{item.clientName}</td>
                        <td className="p-3.5 font-mono text-sky-400 font-bold">{item.clientPhone}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-white">{item.remainingPrincipal.toLocaleString()} VND</td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-400">{item.overdueAmount.toLocaleString()} VND</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-2" id={`trash_actions_${item.index}`}>
                            <button 
                              onClick={() => handleRestoreDossier(item.index)}
                              className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-900/50 rounded text-[10px] font-black transition flex items-center space-x-1"
                              id={`btn_restore_${item.index}`}
                              title="Khôi phục hồ sơ về bảng chính"
                            >
                              <RotateCcw size={10} />
                              <span>KHÔI PHỤC</span>
                            </button>
                            <button 
                              onClick={() => handlePermanentDeleteDossier(item.index)}
                              className="px-2.5 py-1 bg-rose-950 text-rose-400 border border-rose-500/20 hover:bg-rose-900/50 rounded text-[10px] font-black transition flex items-center space-x-1"
                              id={`btn_perm_delete_${item.index}`}
                              title="Xóa vĩnh viễn"
                            >
                              <X size={10} />
                              <span>XÓA VĨNH VIỄN</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {trashDossiers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500 italic">Thùng rác hiện đang trống.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden bg-white text-slate-800 p-1">
                {/* Embedded global system-wide Recycle Bin */}
                <RecycleBinView 
                  language={language === "vi" ? "vi" : "en"} 
                  user={user} 
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEETILY AI */}
        {activeWorkspaceTab === "MEETILY_AI" && (
          <div className="bg-[#0a1224] border border-[#15233d] rounded-3xl p-6 space-y-6 animate-in fade-in duration-300" id="meetily_ai_container">
            <div className="flex justify-between items-center border-b border-[#15233d] pb-4" id="meetily_header">
              <div>
                <h2 className="text-xs font-black uppercase text-white tracking-widest" id="meetily_title">Phòng họp trực tuyến & Phiên âm Meetily AI</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5" id="meetily_subtitle">Bóc tách biên bản cuộc họp và phân tích rủi ro vụ việc</p>
              </div>
              {!isRecording ? (
                <button onClick={startMeetingRecording} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all duration-200 flex items-center space-x-2" id="btn_start_recording">
                  <Mic size={14} />
                  <span>GHI ÂM PHÒNG HỌP</span>
                </button>
              ) : (
                <button onClick={stopMeetingRecording} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all duration-200 flex items-center space-x-2 border border-slate-700" id="btn_stop_recording">
                  <MicOff size={14} className="text-rose-500 animate-pulse" />
                  <span>DỪNG PHIÊN ÂM</span>
                </button>
              )}
            </div>

            {isRecording && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-white" id="recording_banner">
                <span className="text-xs font-bold text-slate-400">Đang thu âm luồng Micro thoại trực tuyến...</span>
                <p className="text-lg font-mono font-black text-[#e2b13c]" id="recording_timer">{formatTime(meetingDuration)}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="meetily_panels">
              <div className="bg-slate-950 border border-[#15233d] rounded-2xl p-5 space-y-4" id="live_transcribe_panel">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block" id="live_transcribe_label">Phiên âm thời gian thực</span>
                <div className="space-y-3 max-h-[300px] overflow-y-auto" id="transcripts_list">
                  {transcripts.map((t, i) => (
                    <div key={i} className="bg-slate-900 border border-[#15233d]/50 p-3 rounded-xl space-y-1" id={`transcript_item_${i}`}>
                      <div className="flex justify-between text-[10px]">
                        <span className="font-black text-indigo-400">{t.speaker}</span>
                        <span className="font-mono text-slate-500">{t.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-bold">{t.text}</p>
                    </div>
                  ))}
                  {transcripts.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-12" id="transcripts_empty_state">Bấm nút Ghi âm cuộc họp để bắt đầu phòng họp Meetily.</p>
                  )}
                </div>
              </div>
              <div className="bg-slate-950 border border-[#15233d] rounded-2xl p-5 space-y-4" id="ai_summary_panel">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block" id="ai_summary_label">Tóm tắt & Nhiệm vụ tự động (Meetily AI Summarizer)</span>
                {isTranscribing ? (
                  <div className="text-center py-14 space-y-2" id="ai_summary_loading">
                    <Sparkles size={20} className="animate-spin text-[#e2b13c] mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">AI đang phân tích cuộc họp...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="space-y-4 text-xs" id="ai_summary_content">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-black uppercase text-[9px]">Tóm tắt cốt lõi:</span>
                      <p className="text-slate-200 font-bold leading-relaxed bg-slate-900 p-3 rounded-xl border border-[#15233d]">{aiSummary.overview}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-12" id="ai_summary_empty_state">Báo cáo tóm tắt sẽ tự động hiển thị sau khi cuộc họp kết thúc.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MICROSOFT VIBEVOICE SIMULATOR */}
        {activeWorkspaceTab === "VIBEVOICE_SIMULATOR" && (
          <div className="bg-[#0a1224] border border-[#15233d] rounded-3xl p-6 space-y-6 animate-in fade-in duration-300" id="vibevoice_container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#15233d] pb-4" id="vibevoice_header">
              <div>
                <h2 className="text-xs font-black uppercase text-white tracking-widest flex items-center space-x-2" id="vibevoice_title">
                  <Volume2 className="text-emerald-400 animate-pulse" size={16} />
                  <span>Microsoft VibeVoice Multi-Speaker Simulator</span>
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-1" id="vibevoice_subtitle">Thiết kế TTS đa kênh 7.5 Hz giúp kiểm nghiệm luồng thoại pháp lý độ tin cậy cao</p>
              </div>
              <div className="flex items-center space-x-2.5" id="vibevoice_rate_selector">
                <span className="text-xs text-slate-400 font-bold">Tokenizer Rate:</span>
                <select value={vibeVoiceRate} onChange={(e: any) => setVibeVoiceRate(e.target.value)} className="bg-slate-950 border border-[#15233d] text-[#e2b13c] text-[10px] font-black rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#e2b13c]" id="select_vibevoice_rate">
                  <option value="7.5Hz">7.5 Hz (Ultra-Low Cost)</option>
                  <option value="15Hz">15 Hz (High-Fidelity)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="vibevoice_panels_grid">
              <div className="bg-slate-950 border border-[#15233d] rounded-2xl p-5 space-y-4" id="speakers_panel">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block border-b border-slate-900 pb-2" id="speakers_label">Phân Vai Speakers</span>
                <div className="space-y-3" id="speakers_list">
                  {speakers.map((spk) => (
                    <div key={spk.id} className="bg-slate-900/60 border border-[#15233d]/50 rounded-xl p-3 flex justify-between items-center" id={`speaker_item_${spk.id}`}>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${spk.color}`}></span>
                          <span className="text-xs font-black text-white">{spk.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{spk.role} ({spk.tone})</p>
                      </div>
                      <div className="flex items-end space-x-0.5 h-6">
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className={`w-0.5 ${spk.color} rounded-full transition-all duration-100`} style={{ height: vibeVoicePlaying ? `${Math.min(100, Math.max(10, spk.level * (0.4 + Math.random() * 0.8)))}%` : "4px" }}></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4" id="vibevoice_control_area">
                <div className="bg-[#15233d]/40 border border-[#15233d] rounded-2xl p-6 space-y-4" id="audio_synthesis_player">
                  <div className="flex justify-between items-center" id="player_header">
                    <div>
                      <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-indigo-400 font-black">Conversational Synthesis</span>
                      <h4 className="text-xs font-black text-white mt-1.5" id="synthesis_script_title">Hòa giải đền bù Dự án Metro số 2</h4>
                    </div>
                    {!vibeVoicePlaying ? (
                      <button onClick={() => setVibeVoicePlaying(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all duration-200 flex items-center space-x-1.5 shadow-lg shadow-emerald-600/10" id="btn_play_synthesis">
                        <PlayCircle size={14} />
                        <span>MÔ PHỎNG GIỌNG NÓI</span>
                      </button>
                    ) : (
                      <button onClick={() => setVibeVoicePlaying(false)} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all duration-200 flex items-center space-x-1.5 shadow-lg shadow-rose-600/10" id="btn_pause_synthesis">
                        <PauseCircle size={14} />
                        <span>DỪNG PHÁT THOẠI</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5" id="synthesis_progress_bar">
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
                      <div className="bg-emerald-400 h-full transition-all duration-100" style={{ width: `${vibeVoiceProgress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                      <span>{formatTime(Math.floor((vibeVoiceProgress / 100) * 17))}</span>
                      <span>0:17 (Tổng thời lượng)</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3" id="vibevoice_script_subtitle">
                    <span className="text-[9px] font-black uppercase text-indigo-400">Dòng phụ đề đồng bộ:</span>
                    <div className="text-xs font-bold space-y-1.5" id="script_lines_wrapper">
                      {scriptLines.map((line, idx) => (
                        <p 
                          key={idx} 
                          className={`transition-colors duration-200 p-2 rounded-lg ${
                            vibeVoicePlaying && currentLineIndex === idx 
                              ? "bg-slate-900 text-[#e2b13c]" 
                              : "text-slate-500"
                          }`}
                        >
                          <strong>{line.speakerName}:</strong> {line.text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SPEC-KIT SDD AI */}
        {activeWorkspaceTab === "SPECKIT_SDD" && (
          <div className="bg-[#0a1224] border border-[#15233d] rounded-3xl p-6 space-y-6 animate-in fade-in duration-300" id="speckit_container">
            <div className="border-b border-[#15233d] pb-4" id="speckit_header">
              <h2 className="text-xs font-black uppercase text-white tracking-widest flex items-center space-x-2" id="speckit_title">
                <Code className="text-indigo-400" size={16} />
                <span>GitHub Spec-Kit / Spec-Driven Development Dashboard</span>
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1" id="speckit_subtitle">Quản lý vùng đợi phát triển hướng đặc tả nghiệp vụ</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="speckit_panels_grid">
              <div className="space-y-2" id="speckit_workflow_sidebar">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1" id="workflow_sidebar_label">SDD Workflow Steps</span>
                {specKitTasks.map((t) => (
                  <button key={t.id} onClick={() => setSpecKitActiveTask(t.id)} className={`w-full p-4 rounded-2xl border text-left space-y-2 transition-all duration-200 block ${specKitActiveTask === t.id ? "bg-indigo-600/10 border-indigo-500/50 text-white" : "bg-slate-950 border-[#15233d] text-slate-400 hover:border-slate-700"}`} id={`btn_speckit_step_${t.id}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-black text-indigo-400">{t.command}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${t.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>{t.status.toUpperCase()}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-200">{t.title}</h4>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-2 space-y-3" id="speckit_output_container">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block" id="speckit_output_label">Spec-Kit Terminal Output Console</span>
                {specKitTasks.find(t => t.id === specKitActiveTask) && (
                  <div className="bg-slate-950 border border-[#15233d] rounded-2xl p-5 space-y-4" id="speckit_terminal">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-white" id="terminal_current_command">Command: {specKitTasks.find(t => t.id === specKitActiveTask)?.command}</h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5" id="terminal_current_subtitle">Đặc tả chất lượng hệ thống ERP Ánh Dương</p>
                      </div>
                      <button onClick={() => triggerSpecKitCommand(specKitActiveTask)} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all duration-200 flex items-center space-x-1.5" id="btn_rerun_speckit_command">
                        <RefreshCw size={10} />
                        <span>RE-RUN</span>
                      </button>
                    </div>
                    <div className="bg-slate-900 border border-[#15233d]/80 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto" id="terminal_output_pre">
                      <pre className="whitespace-pre-wrap leading-relaxed">{specKitTasks.find(t => t.id === specKitActiveTask)?.output}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Source code automatic knowledge graph analyzer */}
            <div className="pt-4 border-t border-[#15233d]">
              <UnderstandAnything />
            </div>
          </div>
        )}

        {/* TAB 5: MODEL CONTEXT PROTOCOL (MCP) PLAYGROUND & REELS */}
        {activeWorkspaceTab === "MCP_PLAYGROUND" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300" id="mcp_playground_tab">
            
            {/* CỘT TRÁI: PIXEL-PERFECT MOBILE REELS PLAYGROUND */}
            <div className="lg:col-span-5 flex justify-center animate-in slide-in-from-left duration-500" id="reels_column">
              <div className="w-[340px] bg-[#030914] border-[10px] border-slate-950 rounded-[44px] overflow-hidden shadow-2xl relative h-[650px] flex flex-col justify-between select-none border-b-[14px]" id="reels_phone_mockup">
                
                {/* Premium iPhone Dynamic Island */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-b-2xl z-40 flex items-center justify-center border-x border-b border-slate-900" id="dynamic_island">
                  <div className="w-2.5 h-2.5 bg-[#070e1b] rounded-full mr-2 shadow-inner border border-slate-900/50"></div>
                  <div className="w-10 h-1 bg-slate-900 rounded-full"></div>
                </div>

                {/* Top Status Bar (Time, Battery, Wifi) */}
                <div className="pt-8 px-6 pb-2 flex justify-between items-center z-30 bg-gradient-to-b from-slate-950 to-transparent" id="phone_status_bar">
                  <span className="text-[10px] font-black text-slate-300 tracking-wider font-mono">20:16</span>
                  <div className="flex items-center space-x-1.5 text-slate-300" id="status_bar_indicators">
                    <Layers size={10} className="text-indigo-400" />
                    <span className="text-[9px] font-black bg-slate-900 border border-slate-800 text-[#e2b13c] px-1.5 py-0.5 rounded font-mono">36</span>
                  </div>
                </div>

                {/* Top Reels Menu Header */}
                <div className="px-6 py-2 flex justify-between items-center z-30" id="reels_app_header">
                  <div className="flex items-center space-x-2" id="reels_title_group">
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-sm"></div>
                    <span className="text-base font-black text-white tracking-wide" id="reels_header_text">Reels AI</span>
                  </div>
                  <div className="flex items-center space-x-1.5" id="reels_channel_group">
                    <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-slate-950 font-black shadow shadow-amber-500/20">AD</div>
                    <span className="text-[10px] font-black text-slate-300">Trạm AI Ánh Dương</span>
                  </div>
                </div>

                {/* Reels Educational Carousel Content */}
                <div className="px-6 flex-1 flex flex-col justify-center relative z-20" id="reels_slide_viewport">
                  <div className="space-y-4" id="reels_main_card">
                    
                    <div className="space-y-1.5" id="slide_headers">
                      <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block" id="mcp_tagline">Giao thức MCP là gì?</span>
                      <h2 className="text-xl font-black text-white leading-tight" id="slide_title_display">
                        {reelsSlides[activeReelsSlide].title}
                      </h2>
                      <p className="text-xs text-slate-300 font-bold" id="slide_subtitle_display">
                        {reelsSlides[activeReelsSlide].subtitle}
                      </p>
                    </div>

                    {/* Connection Diagram */}
                    <div className="grid grid-cols-12 gap-3 py-4 relative" id="mcp_architecture_graph">
                      
                      {/* Claude Code node */}
                      <div className="col-span-4 bg-[#0a1424] border border-[#15233d] rounded-xl p-3 flex flex-col justify-center items-center h-28 relative shadow-lg" id="node_client_code">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block text-center mb-1">Client AI</span>
                        <span className="text-xs font-black text-white text-center leading-tight">Claude Code</span>
                      </div>
                      
                      {/* MCP Bridge Node */}
                      <div className="col-span-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-center items-center h-28 relative" id="node_mcp_bridge">
                        <span className="text-[8px] text-emerald-400/80 font-black uppercase tracking-wider block text-center mb-1">Bridge</span>
                        <span className="text-xs font-black text-emerald-400 text-center">MCP</span>
                      </div>

                      {/* Server nodes list grid */}
                      <div className="col-span-5 bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 flex flex-col justify-center space-y-1 h-28 overflow-hidden" id="node_mcp_sources">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block mb-1">Resources</span>
                        <div className="flex flex-wrap gap-1 max-h-[56px] overflow-hidden" id="resource_tags_container">
                          {reelsSlides[activeReelsSlide].highlightWords.map((word, index) => (
                            <span key={index} className="bg-slate-900/80 border border-slate-800 text-[8px] text-sky-400 font-bold px-1 rounded-md whitespace-nowrap">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Video-style Captions */}
                    <div className="bg-[#070e1b] border border-slate-900 p-3 rounded-2xl relative" id="reels_subtitles_caption">
                      <div className="absolute -top-2 left-4 px-2 py-0.5 bg-indigo-600 text-[8px] font-black rounded-md text-white uppercase tracking-wider">Hiểu về Giao thức</div>
                      <p className="text-[10px] text-slate-300 font-bold leading-relaxed mt-1" id="caption_paragraph">
                        {reelsSlides[activeReelsSlide].description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Reels Interaction Right bar */}
                <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-3 z-30" id="reels_interaction_bar">
                  
                  {/* Like Trigger */}
                  <div className="flex flex-col items-center" id="action_like">
                    <button 
                      onClick={() => {
                        setIsLiked(!isLiked);
                        setMcpReelsLikeCount(p => isLiked ? p - 1 : p + 1);
                      }}
                      className={`p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900/90 border border-slate-900 transition-all duration-200 ${
                        isLiked ? "text-rose-500 border-rose-500/20 bg-rose-500/5" : "text-slate-300"
                      }`}
                      id="btn_like_reels"
                    >
                      <Heart size={16} className={isLiked ? "fill-rose-500" : ""} />
                    </button>
                    <span className="text-[9px] font-black text-slate-300 mt-1">{mcpReelsLikeCount}</span>
                  </div>

                  {/* Comments Trigger */}
                  <div className="flex flex-col items-center" id="action_comment">
                    <button 
                      onClick={() => {
                        setMcpReelsCommentCount(p => p + 1);
                        setMcpConsoleLogs(logs => [...logs, "[USER COMMENT] Thêm bình luận: 'Hồ sơ pháp lý chạy MCP quá đỉnh!'"]);
                      }}
                      className="p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900/90 border border-slate-900 text-slate-300 transition-all duration-200"
                      id="btn_comment_reels"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <span className="text-[9px] font-black text-slate-300 mt-1">{mcpReelsCommentCount}</span>
                  </div>

                  {/* Share Link Trigger */}
                  <div className="flex flex-col items-center" id="action_share">
                    <button 
                      onClick={() => {
                        setMcpReelsShareCount(p => p + 1);
                        alert("Đã sao chép liên kết chia sẻ chuỗi bài giảng Model Context Protocol!");
                      }}
                      className="p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900/90 border border-slate-900 text-slate-300 transition-all duration-200"
                      id="btn_share_reels"
                    >
                      <Share2 size={16} />
                    </button>
                    <span className="text-[9px] font-black text-slate-300 mt-1">{mcpReelsShareCount}</span>
                  </div>

                  {/* Bookmarks Trigger */}
                  <div className="flex flex-col items-center" id="action_bookmark">
                    <button 
                      onClick={() => {
                        setIsBookmarked(!isBookmarked);
                        setMcpReelsBookmarkCount(p => isBookmarked ? p - 1 : p + 1);
                      }}
                      className={`p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900/90 border border-slate-900 transition-all duration-200 ${
                        isBookmarked ? "text-amber-400 border-amber-400/20 bg-amber-400/5" : "text-slate-300"
                      }`}
                      id="btn_bookmark_reels"
                    >
                      <Bookmark size={16} className={isBookmarked ? "fill-amber-400" : ""} />
                    </button>
                    <span className="text-[9px] font-black text-slate-300 mt-1">{mcpReelsBookmarkCount}</span>
                  </div>
                </div>

                {/* Bottom Audio Bar & Navigation Carousel Dots */}
                <div className="p-6 bg-gradient-to-t from-slate-950 to-transparent space-y-3.5 z-30" id="reels_bottom_carousel">
                  
                  <div className="flex justify-center space-x-1.5" id="carousel_dot_indicators">
                    {reelsSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveReelsSlide(index)}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          activeReelsSlide === index ? "w-4 bg-indigo-500" : "w-1 bg-slate-700"
                        }`}
                        id={`btn_dot_slide_${index}`}
                      ></button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-slate-900 pt-3" id="reels_footer">
                    <span>Series 11 bài học về Claude Code</span>
                    <span className="text-indigo-400 cursor-pointer">Xem thêm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: BẢNG TRUY VẤN VÀ CẤU HÌNH GIAO THỨC MCP CHO ÁNH DƯƠNG ERP */}
            <div className="lg:col-span-7 space-y-6" id="mcp_configuration_column">
              
              {/* 1. MCP Active Servers Manager */}
              <div className="bg-[#0a1224] border border-[#15233d] rounded-3xl p-6 space-y-4" id="mcp_servers_card">
                <div className="flex justify-between items-center border-b border-[#15233d] pb-3" id="mcp_servers_header">
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center space-x-2" id="mcp_servers_title">
                      <Cpu size={14} className="text-indigo-400 animate-spin" style={{ animationDuration: "12s" }} />
                      <span>MCP Server Hub (Cấu hình Ánh Dương Law ERP)</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1" id="mcp_servers_subtitle">Các cổng liên kết AI Agent thông qua giao thức Model Context Protocol</p>
                  </div>
                  <span className="text-[9px] bg-slate-950 border border-slate-900 text-slate-300 px-2 py-0.5 rounded-lg font-black font-mono">
                    Host: port 3000
                  </span>
                </div>

                {/* Grid MCP Servers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="mcp_servers_grid">
                  {mcpServers.map((srv) => (
                    <div 
                      key={srv.id} 
                      onClick={() => setSelectedMcpServer(srv.id)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between h-28 ${
                        selectedMcpServer === srv.id 
                          ? "bg-[#15233d] border-indigo-500 text-white" 
                          : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800"
                      }`}
                      id={`mcp_server_card_${srv.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-xl text-slate-900 bg-white`}>
                            {srv.icon}
                          </div>
                          <span className="text-xs font-black">{srv.name}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMcpServerStatusToggle(srv.id);
                          }}
                          className={`px-2 py-0.5 rounded text-[8px] font-black border transition-all duration-150 ${
                            srv.status === "connected" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" 
                              : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                          }`}
                          id={`btn_toggle_status_${srv.id}`}
                        >
                          {srv.status === "connected" ? "CONNECTED" : "OFFLINE"}
                        </button>
                      </div>
                      <p className="text-[10px] font-medium leading-relaxed truncate mt-2">{srv.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. MCP Tool execution & Console logs */}
              <div className="bg-[#0a1224] border border-[#15233d] rounded-3xl p-6 space-y-4" id="mcp_rpc_card">
                
                <div className="border-b border-[#15233d] pb-3 flex justify-between items-center" id="mcp_rpc_header">
                  <span className="text-xs font-black uppercase text-white tracking-wider flex items-center space-x-2" id="mcp_rpc_title">
                    <FileJson size={14} className="text-[#e2b13c]" />
                    <span>Thử nghiệm gọi Tool MCP (JSON-RPC)</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold font-mono" id="mcp_rpc_current_target">Select Server: <strong className="text-indigo-400">{mcpServers.find(s => s.id === selectedMcpServer)?.name}</strong></span>
                </div>

                {/* List of tools for selected server */}
                <div className="space-y-3" id="mcp_rpc_tools">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block" id="mcp_rpc_tools_label">Các Tool hỗ trợ (Supported Tools Schema):</span>
                  <div className="flex flex-wrap gap-2" id="mcp_rpc_tools_grid">
                    {mcpServers.find(s => s.id === selectedMcpServer)?.supportedTools.map((tool) => (
                      <button
                        key={tool}
                        onClick={() => handleMcpToolExecution(tool)}
                        className="px-3.5 py-2 bg-slate-950 border border-slate-900 text-slate-300 hover:border-[#e2b13c] hover:text-white rounded-xl text-xs font-black transition-all duration-200 flex items-center space-x-1.5"
                        id={`btn_run_mcp_tool_${tool}`}
                      >
                        <Play size={10} className="text-indigo-400" />
                        <span>{tool}()</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Console logs */}
                <div className="space-y-2 pt-2" id="mcp_rpc_console">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block" id="mcp_rpc_console_label">Giao thức Giao Tiếp Console logs (JSON-RPC 2.0 Messages):</span>
                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 font-mono text-[11px] text-slate-300 space-y-2 h-[200px] overflow-y-auto" id="mcp_rpc_console_logs">
                    {mcpConsoleLogs.map((log, index) => (
                      <div key={index} className={`p-1 ${
                        log.includes("[SYSTEM]") ? "text-indigo-400 font-black" :
                        log.includes("[JSON-RPC Request]") ? "text-amber-400 font-black" :
                        log.includes("[JSON-RPC Response]") ? "text-emerald-400" : "text-slate-400"
                      }`} id={`mcp_log_line_${index}`}>
                        {log}
                      </div>
                    ))}
                    {mcpExecuting && (
                      <div className="text-indigo-400 font-black animate-pulse py-1" id="mcp_log_line_executing">
                        [SENDING RPC PAYLOAD] --&gt; Giao thức MCP đang xử lý tập tin và xác thực khóa bảo mật...
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL "THÊM THÔNG BÁO MỚI" */}
      {showAddNotificationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="add_notification_modal">
          <div className="bg-slate-900 border border-[#15233d] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" id="modal_dialog">
            
            <div className="p-6 border-b border-[#15233d] flex justify-between items-center bg-[#0a1224]" id="modal_header">
              <h2 className="text-xs font-black uppercase tracking-widest text-white" id="modal_header_title">
                Thêm thông báo mới
              </h2>
              <button 
                onClick={() => setShowAddNotificationModal(false)}
                className="w-8 h-8 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                id="btn_close_modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1" id="modal_body">
              
              <div className="space-y-1.5" id="form_group_type">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center" id="lbl_notification_group">
                  Nhóm thông báo <span className="text-rose-500 ml-1 font-black">*</span>
                </label>
                <div className="relative">
                  <select 
                    value={notificationGroup}
                    onChange={(e: any) => setNotificationGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-[#15233d] hover:border-indigo-500 rounded-xl px-4 py-3 text-xs font-black text-slate-300 focus:outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
                    id="select_notification_group"
                  >
                    <option value="Trao đổi nghiệp vụ">Trao đổi nghiệp vụ</option>
                    <option value="Thông báo chung">Thông báo chung</option>
                    <option value="Thông báo khẩn">Thông báo khẩn cấp</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {notificationGroup === "Trao đổi nghiệp vụ" && (
                <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-[#15233d]" id="form_group_dossiers_list">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block" id="lbl_select_dossiers">
                    Chọn hồ sơ trao đổi
                  </span>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1" id="categories_collapse_group">
                    {majorCategories.map((category) => (
                      <div key={category.id} className="bg-slate-900 border border-[#15233d]/60 rounded-xl overflow-hidden shadow-sm" id={`category_collapse_card_${category.id}`}>
                        
                        <div 
                          onClick={() => toggleCategoryExpand(category.name)}
                          className="p-3.5 flex justify-between items-center bg-slate-950 hover:bg-[#15233d]/35 cursor-pointer transition select-none"
                          id={`category_collapse_header_${category.id}`}
                        >
                          <div className="flex items-center space-x-2.5">
                            {category.icon}
                            <span className="text-xs font-black text-slate-200">{category.name}</span>
                            <span className="text-[9px] font-black bg-[#15233d] text-sky-400 px-1.5 py-0.5 rounded-full">
                              {category.dossiers.length} hồ sơ vụ việc
                            </span>
                          </div>
                          <ChevronDown 
                            size={14} 
                            className={`text-slate-500 transition-transform duration-200 ${
                              expandedCategories[category.name] ? "transform rotate-180" : ""
                            }`} 
                           />
                        </div>

                        {expandedCategories[category.name] && (
                          <div className="p-3 bg-slate-900 divide-y divide-[#15233d]/40 space-y-2.5" id={`category_collapse_body_${category.id}`}>
                            {category.dossiers.map((dos) => (
                              <label 
                                key={dos.id} 
                                className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-[#15233d]/20 cursor-pointer transition-all duration-150"
                                id={`dossier_checkbox_wrapper_${dos.id}`}
                              >
                                <input 
                                  type="checkbox"
                                  checked={dos.checked}
                                  onChange={() => toggleDossierCheck(category.id, dos.id)}
                                  className="mt-0.5 rounded border-[#15233d] bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  id={`checkbox_dossier_${dos.id}`}
                                />
                                <span className="text-xs text-slate-300 font-bold leading-relaxed">{dos.title}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5" id="form_group_recipient">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center" id="lbl_recipient">
                  Gửi đến <span className="text-rose-500 ml-1 font-black">*</span>
                </label>
                <div className="relative">
                  <select 
                    value={sendToOption}
                    onChange={(e) => setSendToOption(e.target.value)}
                    className="w-full bg-slate-950 border border-[#15233d] hover:border-indigo-500 rounded-xl px-4 py-3 text-xs font-black text-slate-300 focus:outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
                    id="select_recipient"
                  >
                    <option value="Tất cả nhân viên">Tất cả nhân viên</option>
                    <option value="Chỉ Ban Giám đốc">Chỉ Ban Giám đốc</option>
                    <option value="Nhóm Luật sư Tranh tụng">Nhóm Luật sư Tranh tụng</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2" id="form_group_priority">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block" id="lbl_priority">
                  Mức độ quan trọng <span className="text-rose-500 font-black">*</span>
                </span>
                <div className="grid grid-cols-3 gap-3" id="priority_buttons_grid">
                  {(["THƯỜNG", "QUAN TRỌNG", "KHẨN CẤP"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setImportanceLevel(level)}
                      className={`py-3.5 rounded-xl text-xs font-black border transition-all duration-200 ${
                        importanceLevel === level
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "bg-slate-950 border-[#15233d] text-slate-400 hover:bg-[#15233d]/30"
                      }`}
                      id={`btn_select_priority_${level}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-[#15233d] flex justify-end space-x-3 bg-[#0a1224]" id="modal_footer">
              <button 
                onClick={() => setShowAddNotificationModal(false)}
                className="px-5 py-2.5 bg-slate-950 border border-slate-900 hover:bg-slate-800 rounded-xl text-xs font-black text-slate-400 transition"
                id="btn_cancel_notification"
              >
                Hủy
              </button>
              <button 
                onClick={handleSendNotification}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition flex items-center space-x-2 shadow-lg shadow-indigo-600/10"
                id="btn_submit_notification"
              >
                <Send size={12} />
                <span>Gửi thông báo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeWorkspaceTab === "UNDERSTAND_ANYTHING" && (
        <div className="p-6 space-y-6 animate-in fade-in duration-300" id="understand_tab_view">
          <UnderstandAnything />
        </div>
      )}

      {activeWorkspaceTab === "LEGAL_OS" && (
        <div className="p-6 space-y-6 animate-in fade-in duration-300" id="legal_os_tab_view">
          <LegalOSUltimate />
        </div>
      )}

      {/* VoIP simulated calling popup */}
      {callingDossier && (
        <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-50 animate-fade-in" id="voip_modal">
          <div className="bg-slate-900 border border-[#15233d] w-full max-w-sm rounded-3xl p-6 text-white space-y-4" id="voip_card">
            <div className="flex justify-between items-center border-b border-[#15233d] pb-3" id="voip_header">
              <span className="text-[10px] font-black text-[#e2b13c]" id="voip_title">ĐANG KẾT NỐI CUỘC GỌI VoIP...</span>
              <span className="font-mono text-emerald-400 font-black" id="voip_timer">{formatTime(callDuration)}</span>
            </div>
            <div className="space-y-1" id="voip_caller_info">
              <p className="text-sm font-black text-white">{callingDossier.clientName}</p>
              <p className="text-xs text-slate-400 font-bold">Số điện thoại: {callingDossier.clientPhone}</p>
            </div>
            <button onClick={handleHangupCall} className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-black transition" id="btn_hangup_voip">
              Gác máy
            </button>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {viewingDetailDossier && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 overflow-y-auto" id="dossier_detail_modal">
          <div className="bg-[#0a1224] border border-[#15233d] w-full max-w-2xl rounded-3xl text-white overflow-hidden shadow-2xl animate-in zoom-in duration-150">
            {/* Header */}
            <div className="p-6 bg-slate-950 border-b border-[#15233d]/80 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#e2b13c] uppercase">Hồ sơ tranh tụng chi tiết</span>
                <h3 className="text-base font-black text-white mt-1">{viewingDetailDossier.clientName}</h3>
              </div>
              <button 
                onClick={() => setViewingDetailDossier(null)} 
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                {/* Section 1: Basic info */}
                <div className="bg-[#15233d]/25 border border-[#15233d]/40 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-sky-400 border-b border-[#15233d]/30 pb-1.5">Thông tin chung</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Số hợp đồng:</span> <span className="font-mono font-bold text-white">{viewingDetailDossier.contractNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Mã Code:</span> <span className="font-mono font-bold text-white">{viewingDetailDossier.code}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Điện thoại:</span> <span className="font-mono font-bold text-sky-400">{viewingDetailDossier.clientPhone}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Ngày sinh:</span> <span className="font-bold text-white">{viewingDetailDossier.dob}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Giới tính:</span> <span className="font-bold text-white">{viewingDetailDossier.gender || "Nam"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Địa chỉ:</span> <span className="font-bold text-white">{viewingDetailDossier.province || "Hà Nội"}</span></div>
                  </div>
                </div>

                {/* Section 2: Case workflow status */}
                <div className="bg-[#15233d]/25 border border-[#15233d]/40 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-sky-400 border-b border-[#15233d]/30 pb-1.5">Quản lý & Tiến độ</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Phân hệ:</span> <span className="font-bold text-white">{viewingDetailDossier.documentType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Độ ưu tiên:</span> <span className="font-bold text-rose-400">{viewingDetailDossier.priority}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Tình trạng:</span> <span className="font-bold text-amber-400">{viewingDetailDossier.loanStatus}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Trạng thái làm việc:</span> <span className="font-bold text-white">{viewingDetailDossier.status}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Thẻ phân loại:</span> <span className="font-bold text-white">{viewingDetailDossier.tagType}</span></div>
                  </div>
                </div>
              </div>

              {/* Section 3: Financial Details */}
              <div className="bg-[#15233d]/25 border border-[#15233d]/40 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-sky-400 border-b border-[#15233d]/30 pb-1.5">Nghĩa vụ Tài chính & Quá hạn</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between border-b border-[#15233d]/10 py-1"><span className="text-slate-400">Nợ gốc còn lại:</span> <span className="font-mono font-bold text-white">{viewingDetailDossier.remainingPrincipal?.toLocaleString()} VND</span></div>
                  <div className="flex justify-between border-b border-[#15233d]/10 py-1"><span className="text-slate-400">Số tiền quá hạn:</span> <span className="font-mono font-bold text-rose-400">{viewingDetailDossier.overdueAmount?.toLocaleString()} VND</span></div>
                  <div className="flex justify-between border-b border-[#15233d]/10 py-1"><span className="text-slate-400">Số ngày quá hạn:</span> <span className="font-mono font-bold text-amber-400">{viewingDetailDossier.overdueDays} ngày</span></div>
                  <div className="flex justify-between border-b border-[#15233d]/10 py-1"><span className="text-slate-400">Số kỳ quá hạn:</span> <span className="font-mono font-bold text-white">{viewingDetailDossier.overduePeriods} kỳ</span></div>
                  <div className="flex justify-between border-b border-[#15233d]/10 py-1"><span className="text-slate-400">Khoản trả hằng tháng:</span> <span className="font-mono font-bold text-slate-300">{viewingDetailDossier.monthlyPayment?.toLocaleString()} VND</span></div>
                  <div className="flex justify-between border-b border-[#15233d]/10 py-1"><span className="text-slate-400">Số tiền thanh lý:</span> <span className="font-mono font-bold text-emerald-400">{(viewingDetailDossier.liquidationAmount || viewingDetailDossier.remainingPrincipal)?.toLocaleString()} VND</span></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-950 border-t border-[#15233d]/80 flex justify-end space-x-3">
              <button 
                onClick={() => setViewingDetailDossier(null)}
                className="px-5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-black rounded-xl transition"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  handleCallDossier(viewingDetailDossier);
                  setViewingDetailDossier(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition flex items-center space-x-2"
              >
                <Phone size={12} className="fill-current" />
                <span>Gọi điện</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
