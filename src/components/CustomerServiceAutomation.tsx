import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  User,
  Users,
  Settings,
  Terminal,
  Activity,
  Chrome,
  Globe,
  Play,
  Check,
  Copy,
  Zap,
  Cpu,
  RefreshCw,
  Clock,
  Shield,
  HelpCircle,
  FileText,
  AlertCircle,
  Database,
  Search,
  MessageCircle,
  ArrowRight,
  Code
} from "lucide-react";

// =========================================================================
// 1. CHATWOOT OMNICHANNEL CUSTOMER SUPPORT PANEL
// =========================================================================

interface ChatwootTicket {
  id: string;
  customerName: string;
  source: "web_chat" | "facebook" | "whatsapp" | "email";
  lastMessage: string;
  time: string;
  status: "open" | "snoozed" | "resolved";
  assignedAgent: string;
  avatarBg: string;
  messages: Array<{
    sender: "customer" | "agent" | "bot";
    text: string;
    time: string;
  }>;
}

const INITIAL_TICKETS: ChatwootTicket[] = [
  {
    id: "t-1",
    customerName: "Nguyễn Thị Lan",
    source: "web_chat",
    lastMessage: "Chào luật sư, tôi muốn được tư vấn thủ tục ly hôn đơn phương ạ.",
    time: "3 phút trước",
    status: "open",
    assignedAgent: "Luật sư Lê Anh",
    avatarBg: "bg-blue-500",
    messages: [
      { sender: "customer", text: "Xin chào Ánh Dương Law Firm.", time: "10:14 AM" },
      { sender: "bot", text: "Kính chào Quý khách! Trợ lý AI đang chuyển kết nối đến Luật sư chuyên trách hôn nhân gia đình. Vui lòng chờ trong giây lát.", time: "10:14 AM" },
      { sender: "customer", text: "Chào luật sư, tôi muốn được tư vấn thủ tục ly hôn đơn phương ạ.", time: "10:15 AM" }
    ]
  },
  {
    id: "t-2",
    customerName: "Trần Hữu Khánh",
    source: "facebook",
    lastMessage: "Công ty đã gửi hồ sơ đăng ký nhãn hiệu cho Cục SHTT chưa?",
    time: "25 phút trước",
    status: "open",
    assignedAgent: "Trợ lý Mai Chi",
    avatarBg: "bg-indigo-500",
    messages: [
      { sender: "customer", text: "Tôi là Khánh bên Công ty Thực phẩm sạch Gia An.", time: "09:50 AM" },
      { sender: "agent", text: "Chào anh Khánh, hồ sơ của mình đã được thụ lý hợp lệ từ tuần trước rồi ạ.", time: "09:52 AM" },
      { sender: "customer", text: "Công ty đã gửi hồ sơ đăng ký nhãn hiệu cho Cục SHTT chưa?", time: "09:55 AM" }
    ]
  },
  {
    id: "t-3",
    customerName: "David Miller",
    source: "whatsapp",
    lastMessage: "Need help reviewing the joint-venture partnership draft.",
    time: "1 giờ trước",
    status: "snoozed",
    assignedAgent: "Luật sư Trần Hoàng",
    avatarBg: "bg-emerald-500",
    messages: [
      { sender: "customer", text: "Hi team, I have some inquiries on corporate structure in Vietnam.", time: "09:00 AM" },
      { sender: "agent", text: "Hello Mr. Miller, our FDI experts are available to consult on zoom at 2:00 PM.", time: "09:15 AM" },
      { sender: "customer", text: "Great. Need help reviewing the joint-venture partnership draft.", time: "09:18 AM" }
    ]
  },
  {
    id: "t-4",
    customerName: "hoangvu.dautu@gmail.com",
    source: "email",
    lastMessage: "Báo giá dịch vụ tranh tụng đất đai tại Đồng Nai.",
    time: "4 giờ trước",
    status: "resolved",
    assignedAgent: "Hệ thống",
    avatarBg: "bg-purple-500",
    messages: [
      { sender: "customer", text: "Yêu cầu báo giá chi tiết tranh chấp đất đai diện tích 500m2.", time: "06:05 AM" },
      { sender: "bot", text: "Đã gửi bảng báo giá chuẩn số KD-2026-904 qua email cho khách hàng thành công.", time: "06:07 AM" }
    ]
  }
];

export function ChatwootSupportPanel({ language }: { language: "vi" | "en" }) {
  const [tickets, setTickets] = useState<ChatwootTicket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("t-1");
  const [inputMessage, setInputMessage] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("https://anhduonglaw.vn/api/chatwoot-callback");
  const [copiedToken, setCopiedToken] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "integrations" | "bots">("inbox");
  
  // Real-time notification trigger simulation
  const [liveLog, setLiveLog] = useState<string[]>([]);
  
  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  useEffect(() => {
    // Simulate real-time client traffic via background timer
    const interval = setInterval(() => {
      const logs = [
        "Chatwoot Webhook: New visitor created session from IP 113.161.4.92",
        "Agent assigned: Ticket #t-1 auto-allocated to 'Luật sư Lê Anh' via Round Robin",
        "Chatwoot Sync: Updated contact fields for 'Trần Hữu Khánh' (Facebook ID)",
        "Chatwoot AI Bot: Response generated in 820ms using Gemini API"
      ];
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      setLiveLog(prev => [randomLog, ...prev.slice(0, 5)]);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Append to active ticket
    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        return {
          ...t,
          lastMessage: inputMessage,
          messages: [
            ...t.messages,
            { sender: "agent", text: inputMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        };
      }
      return t;
    }));

    setInputMessage("");

    // Simulate auto AI response if chatbot option is open
    setTimeout(() => {
      setTickets(prev => prev.map(t => {
        if (t.id === selectedTicketId) {
          return {
            ...t,
            lastMessage: "[AI Gợi ý phản hồi]: Dạ, tôi sẽ xếp lịch trực tuyến cho Luật sư giải quyết ngay ạ.",
            messages: [
              ...t.messages,
              { sender: "bot", text: "[AI Assistant Co-Pilot]: Dựa trên cơ sở dữ liệu Luật Hôn nhân & Gia đình 2014, bạn cần chuẩn bị Đơn khởi kiện, Đăng ký kết hôn bản chính và CCCD.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]
          };
        }
        return t;
      }));
    }, 2000);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "web_chat":
        return <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">Web LiveChat</span>;
      case "facebook":
        return <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold">Messenger</span>;
      case "whatsapp":
        return <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">WhatsApp</span>;
      default:
        return <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">Email Inbox</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-5 rounded-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500 animate-pulse" />
              Chatwoot Omni-Channel Customer Hub
            </h4>
            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed max-w-2xl">
              {language === "vi"
                ? "Giải pháp cổng CSKH hợp nhất lấy ý tưởng từ Chatwoot. Cho phép gộp luồng trò chuyện từ Website LiveChat, Facebook Messenger, WhatsApp, Email về một hộp thư duy nhất, kết hợp Co-Pilot AI đề xuất lời phản hồi tối ưu."
                : "Omnichannel customer relationship suite inspired by Chatwoot. Unifies conversations across web live chat, Facebook Messenger, WhatsApp, and email, integrated with a co-pilot AI responder."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === "inbox" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
              }`}
            >
              Hộp thư hỗ trợ
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === "integrations" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
              }`}
            >
              Webhook & API setup
            </button>
          </div>
        </div>
      </div>

      {activeTab === "inbox" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List of active client tickets */}
          <div className="lg:col-span-1 space-y-4">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Đoạn chat hoạt động</span>
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold">4 Active</span>
            </div>

            <div className="space-y-2">
              {tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3 border rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                    t.id === selectedTicketId
                      ? "bg-blue-500/10 border-blue-400 dark:border-blue-800"
                      : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${t.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                    {t.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{t.customerName}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0">{t.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1.5">{t.lastMessage}</p>
                    <div className="flex items-center justify-between">
                      {getSourceBadge(t.source)}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Phụ trách: {t.assignedAgent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Webhook Log Monitor */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={12} className="text-emerald-500" />
                  Chatwoot Webhook Log
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="h-28 overflow-y-auto space-y-1.5 font-mono text-[9px] text-slate-300">
                {liveLog.length === 0 ? (
                  <p className="text-slate-500 italic">Đang lắng nghe tín hiệu kết nối...</p>
                ) : (
                  liveLog.map((log, i) => (
                    <div key={i} className="flex items-start gap-1 p-1 bg-slate-900/50 rounded border border-slate-800/50">
                      <span className="text-slate-500 shrink-0">&gt;</span>
                      <span className="break-all">{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Active conversation viewport */}
          <div className="lg:col-span-2 flex flex-col border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 h-[520px]">
            
            {/* Window bar */}
            <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${activeTicket.avatarBg} text-white flex items-center justify-center font-bold`}>
                  {activeTicket.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">{activeTicket.customerName}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getSourceBadge(activeTicket.source)}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">ID: {activeTicket.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {activeTicket.status === "open" ? "Đang mở" : activeTicket.status === "snoozed" ? "Tạm hoãn" : "Đã xong"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Giao việc: <strong>{activeTicket.assignedAgent}</strong></span>
              </div>
            </div>

            {/* Conversation Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {activeTicket.messages.map((msg, idx) => {
                const isCustomer = msg.sender === "customer";
                const isBot = msg.sender === "bot";
                return (
                  <div key={idx} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs shadow-xs ${
                      isCustomer
                        ? "bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800"
                        : isBot
                        ? "bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50 italic font-medium"
                        : "bg-blue-600 text-white"
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className={`text-[9px] mt-1 text-right ${isCustomer ? "text-slate-400" : isBot ? "text-indigo-400" : "text-blue-200"}`}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat message input console */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-950 border-t border-slate-150 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Nhập tin nhắn phản hồi của bạn..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 border rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-[#1e1e1e] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Send size={13} />
                <span>Trả lời</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chatwoot REST Webhook Setup */}
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 p-5 rounded-2xl space-y-4">
            <h5 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings size={15} className="text-blue-500" />
              Cấu hình Webhook Callback URL
            </h5>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Chatwoot Webhook Event Handler</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    className="flex-1 text-xs font-mono p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 outline-none"
                  />
                  <button
                    onClick={() => {
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 1200);
                    }}
                    className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black rounded-lg transition-all"
                  >
                    {copiedToken ? "Saved" : "Save"}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-xs">Chatwoot API Access Token</label>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="font-mono text-xs text-blue-400 truncate max-w-xs">ct_usr_7f8490a12e34bd78a2e1d09e59bb6a201</span>
                  <button className="text-[10px] font-bold text-blue-400 hover:underline">Copy</button>
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 rounded-xl leading-relaxed">
                <strong>Yêu cầu cấu hình Webhook:</strong> Chọn kích hoạt các sự kiện <code>message_created</code>, <code>conversation_created</code> và <code>contact_created</code> bên trong trang điều khiển Chatwoot của bạn để liên kết dữ liệu trực tiếp với hệ thống.
              </div>
            </div>
          </div>

          {/* Sample embed code */}
          <div className="space-y-3.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Code size={13} className="text-blue-500" />
              Chatwoot Widget Embed Script
            </div>
            
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>INDEX.HTML - HEAD INJECTION</span>
                <span className="text-indigo-400">JavaScript (HTML)</span>
              </div>
              <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto text-blue-300">
{`<!-- Chatwoot LiveChat Widget -->
<script>
  (function(d,t) {
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src="https://chatwoot.anhduonglaw.vn/packs/js/sdk.js";
    g.defer=true; g.async=true;
    s.parentNode.insertBefore(g,s);
    g.onload=function() {
      window.chatwootSDK.run({
        websiteToken: 'Z87fA290Bce9a12c0199',
        baseUrl: 'https://chatwoot.anhduonglaw.vn'
      })
    }
  })(document,"script");
</script>`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 2. LIGHTPANDA HEADLESS BROWSER & AUTOMATION SCRAPER PANEL
// =========================================================================

interface ScrapingJob {
  id: string;
  targetUrl: string;
  domSelector: string;
  status: "idle" | "running" | "success" | "failed";
  elapsedMs: number;
  resultBytes: number;
  dataCount: number;
  logs: string[];
}

export function LightpandaAutomationPanel({ language }: { language: "vi" | "en" }) {
  const [targetUrl, setTargetUrl] = useState("https://vanban.chinhphu.vn/he-thong-van-ban");
  const [domSelector, setDomSelector] = useState("div.document-item");
  const [isScraping, setIsScraping] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"golang" | "json">("golang");
  const [jobHistory, setJobHistory] = useState<ScrapingJob[]>([
    {
      id: "job-1",
      targetUrl: "https://congbao.chinhphu.vn/danh-muc-cong-bao",
      domSelector: "table.list-congbao tr",
      status: "success",
      elapsedMs: 14, // Extremely fast Lightpanda Go footprint
      resultBytes: 24890,
      dataCount: 15,
      logs: [
        "[00:01.00] Initialized Lightpanda sandbox instance",
        "[00:01.02] HTTP Request dispatched in lightweight Go channel",
        "[00:01.08] Received response 200 OK. Content size: 24.3KB",
        "[00:01.12] Embedded JS engine executed standard document querySelectorAll",
        "[00:01.14] Successfully aggregated 15 items. Shutting down browser thread gracefully"
      ]
    }
  ]);

  const [currentLogs, setCurrentLogs] = useState<string[]>([]);

  const handleTriggerScrape = () => {
    setIsScraping(true);
    setCurrentLogs(["[00:00.00] Launching ultra-fast Lightpanda headless browser context..."]);
    
    setTimeout(() => {
      setCurrentLogs(prev => [...prev, "[00:00.02] Parsing Go-JS bridge context without full Chromium window overhead..."]);
    }, 300);

    setTimeout(() => {
      setCurrentLogs(prev => [...prev, `[00:00.05] Connected to remote target: ${targetUrl}`]);
    }, 600);

    setTimeout(() => {
      setCurrentLogs(prev => [...prev, `[00:00.09] Executing selector query: "${domSelector}"`]);
    }, 900);

    setTimeout(() => {
      const newJob: ScrapingJob = {
        id: `job-${Date.now()}`,
        targetUrl,
        domSelector,
        status: "success",
        elapsedMs: 12 + Math.floor(Math.random() * 8), // extremely fast under 20ms!
        resultBytes: 45210 + Math.floor(Math.random() * 5000),
        dataCount: 12 + Math.floor(Math.random() * 20),
        logs: [
          "[00:00.00] Launching ultra-fast Lightpanda headless browser context...",
          "[00:00.02] Parsing Go-JS bridge context without full Chromium window overhead...",
          `[00:00.05] Connected to remote target: ${targetUrl}`,
          `[00:00.09] Executing selector query: "${domSelector}"`,
          "[00:00.12] Scrape operation executed. Extracted records successfully!"
        ]
      };

      setJobHistory(prev => [newJob, ...prev]);
      setCurrentLogs(prev => [...prev, `[00:00.12] Job success! Elapsed time: ${newJob.elapsedMs}ms. Extracted ${newJob.dataCount} records.`]);
      setIsScraping(false);
    }, 1400);
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-5 rounded-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
              <Zap size={16} className="text-amber-500 fill-amber-500 animate-bounce" />
              Lightpanda Headless Web Scraper & Automation Engine
            </h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed max-w-2xl">
              {language === "vi"
                ? "Bản mô phỏng hiệu năng vượt trội của trình duyệt không đầu Lightpanda (viết bằng Go). Giúp quét văn bản quy phạm pháp luật và thông tin đăng ký doanh nghiệp với tốc độ dưới 15ms và tiết kiệm RAM gấp 10 lần so với Puppeteer."
                : "Simulation of the high-performance Lightpanda headless browser written in Go. Scrape government legal documents and corporate registration indices with <15ms execution latency and 10x RAM optimization over Puppeteer."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Resource comparison dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Execution Speed</div>
            <div className="text-xl font-bold font-mono text-emerald-500">12 ms</div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Memory Footprint (per thread)</div>
            <div className="text-xl font-bold font-mono text-indigo-500">15 MB <span className="text-[10px] text-slate-400 font-normal">vs 150MB Chrome</span></div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bypass Rate (Anti-Scrape)</div>
            <div className="text-xl font-bold font-mono text-purple-500">99.8%</div>
          </div>
        </div>
      </div>

      {/* Scraper Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input parameters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 p-4 rounded-2xl space-y-4 shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={13} className="text-amber-500" />
              Scraper Parameters
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Target Scrape URL</label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">CSS DOM Selector</label>
                <input
                  type="text"
                  value={domSelector}
                  onChange={e => setDomSelector(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleTriggerScrape}
                disabled={isScraping || !targetUrl}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-955 text-xs font-black rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play size={13} className={isScraping ? "animate-spin" : "fill-slate-955"} />
                <span>{isScraping ? "Scraping fast..." : "Run Lightpanda Scraper"}</span>
              </button>
            </div>
          </div>

          {/* Performance Comparison Visual card */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
              <Activity size={12} className="text-amber-500" />
              Lightpanda Performance Benchmarks
            </span>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                  <span>Lightpanda (Go + Webassembly JS Engine)</span>
                  <span className="text-emerald-500 font-bold">12ms</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[12%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                  <span>Puppeteer / Playwright (Chromium Node)</span>
                  <span className="text-slate-500">240ms</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[95%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Console Outputs & Codes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-slate-150 dark:border-slate-800 gap-2">
            <button
              onClick={() => setActiveCodeTab("golang")}
              className={`pb-2 text-xs font-bold uppercase ${
                activeCodeTab === "golang" ? "border-b-2 border-amber-500 text-slate-800 dark:text-slate-100" : "text-slate-400"
              }`}
            >
              Go Scraper Code
            </button>
            <button
              onClick={() => setActiveCodeTab("json")}
              className={`pb-2 text-xs font-bold uppercase ${
                activeCodeTab === "json" ? "border-b-2 border-amber-500 text-slate-800 dark:text-slate-100" : "text-slate-400"
              }`}
            >
              Scrape Jobs Logs
            </button>
          </div>

          {activeCodeTab === "golang" ? (
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>LIGHTPANDA AUTOMATION - SCRAPE_DOCS.GO</span>
                <span className="text-amber-500">Go (Golang)</span>
              </div>
              <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto text-amber-300">
{`package main

import (
	"fmt"
	"github.com/lightpanda-io/browser"
)

func main() {
	// Initialize Go-based headless browser instance
	b := browser.New()
	defer b.Close()

	// Navigate to site under 10ms with sandboxed JS engine
	page, err := b.NewPage("${targetUrl}")
	if err != nil {
		panic(err)
	}

	// Query selector matching DOM nodes instantly
	elements, _ := page.QuerySelectorAll("${domSelector}")
	for _, el := range elements {
		text, _ := el.TextContent()
		fmt.Printf("Parsed Document Item: %s\\n", text)
	}
}`}
              </pre>
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {currentLogs.length > 0 && (
                <div className="p-3 bg-slate-950 font-mono text-[10px] rounded-xl border border-amber-500/30 text-amber-400 space-y-1">
                  <div className="font-bold border-b border-amber-500/10 pb-1 flex justify-between items-center">
                    <span>LIVE SHELL RUNNING...</span>
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  </div>
                  {currentLogs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              )}

              {jobHistory.map(job => (
                <div key={job.id} className="p-4 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-xs">{job.targetUrl}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">
                      Completed in {job.elapsedMs}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div>
                      <span className="text-slate-400">Selector:</span> <code>{job.domSelector}</code>
                    </div>
                    <div>
                      <span className="text-slate-400">Extracted:</span> <strong className="text-indigo-500">{job.dataCount} nodes</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
