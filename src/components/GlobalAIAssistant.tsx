import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Maximize2, Minimize2, Trash2, MessageSquare, Search, ChevronUp, Key, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import LiveChatModal from "./LiveChatModal";
import InternalChatModal from "./InternalChatModal";

export default function GlobalAIAssistant({ currentUser }: { currentUser?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "cases">("ai");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Xin chào! Tôi là Trợ lý AI của Ánh Dương Law. Tôi có thể giúp gì cho bạn hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [quickApiKey, setQuickApiKey] = useState(localStorage.getItem("ai_custom_api_key") || "");
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to Top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Data for cases
  const [records, setRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchCase, setSearchCase] = useState("");
  const [chatRecord, setChatRecord] = useState<any | null>(null);
  const [chatType, setChatType] = useState<"client" | "internal" | null>(null);

  useEffect(() => {
    if (isOpen && currentUser && (currentUser.role === "admin" || currentUser.role === "lawyer" || currentUser.role === "staff")) {
      // Fetch records and users
      fetch("/api/erp-records")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const unique = Array.from(new Map(data.map((item: any) => [item.id, item])).values());
            setRecords(unique);
          }
        })
        .catch(console.error);

      fetch("/api/users")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch(console.error);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (isOpen && activeTab === "ai") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeTab]);

  const handleSend = async (forcedPrompt?: string) => {
    const userMessage = forcedPrompt || input.trim();
    if (!userMessage || isLoading) return;

    if (!forcedPrompt) setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const activeKey = quickApiKey || localStorage.getItem("ai_custom_api_key") || "";
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ 
          prompt: userMessage,
          customApiKey: activeKey || undefined
        }),
      });

      const data = await res.json();

      if (!res.ok || data.needApiKeyPrompt || data.quotaExceeded) {
        setShowKeyInput(true);
        const errMsg = data.error || data.message || "Lỗi 429: API Key hết dung lượng. Vui lòng nhập API Key của bạn để tiếp tục.";
        setMessages((prev) => [...prev, { role: "ai", text: `⚠️ ${errMsg}` }]);
        return;
      }

      setMessages((prev) => [...prev, { role: "ai", text: data.text || "Xin lỗi, tôi không có phản hồi." }]);
    } catch (err: any) {
      setShowKeyInput(true);
      setMessages((prev) => [...prev, { role: "ai", text: "Lỗi kết nối AI: " + err.message + ". Bạn có thể dán API Key cá nhân bên dưới để khắc phục ngay." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuickKey = async () => {
    if (!quickApiKey.trim()) return;
    localStorage.setItem("ai_custom_api_key", quickApiKey.trim());
    setKeySaveSuccess(true);
    setShowKeyInput(false);

    // Save to settings table on backend as well
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_api_key: quickApiKey.trim() })
      });
    } catch (e) {}

    setTimeout(() => setKeySaveSuccess(false), 3000);

    // Automatically retry last prompt or send ping
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.text || "Xin chào";
    setMessages(prev => [...prev, { role: "ai", text: "⚡ Đã kích hoạt API Key thành công! Đang xử lý lại yêu cầu của bạn..." }]);
    handleSend(lastUserMsg);
  };

  const handleClear = () => {
    setMessages([{ role: "ai", text: "Xin chào! Tôi là Trợ lý AI của Ánh Dương Law. Tôi có thể giúp gì cho bạn hôm nay?" }]);
  };

  const filteredRecords = records.filter(r => {
    if (!currentUser) return false;
    const isAssignee = r.mainAssignee === currentUser.username || (r.secondaryAssignees && r.secondaryAssignees.includes(currentUser.username));
    if (currentUser.role !== "admin" && !isAssignee) return false;
    
    if (searchCase && !r.title?.toLowerCase().includes(searchCase.toLowerCase()) && !r.code?.toLowerCase().includes(searchCase.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-center">
        {/* Scroll To Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              key="scroll-to-top"
              initial={{ opacity: 0, scale: 0.5, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 15 }}
              onClick={scrollToTop}
              whileHover={{ scale: 1.15, translateY: -3 }}
              whileTap={{ scale: 0.85 }}
              className="w-12 h-12 mb-3 bg-gradient-to-r from-[var(--color-accent)] to-[#BDA230] text-slate-900 rounded-full shadow-[0_4px_15px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.6)] flex items-center justify-center transition-all cursor-pointer border border-white/20 group animate-ripple-gold"
              title="Về đầu trang"
            >
              <ChevronUp size={24} className="stroke-[3] transition-transform group-hover:-translate-y-0.5 text-slate-950" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className={`w-14 h-14 rounded-full text-white shadow-[0_4px_25px_rgba(12,54,69,0.4)] hover:shadow-[0_6px_30px_rgba(12,54,69,0.6)] transition-all flex items-center justify-center relative overflow-hidden cursor-pointer border-2 border-[var(--color-accent)]/40 ${
            isOpen
              ? "bg-[var(--color-primary)]"
              : "bg-gradient-to-tr from-[#16566D] to-[#10C856] animate-ripple-green"
          }`}
          title="Trợ lý AI & Nhắn tin"
        >
          {/* Background overlay on open state */}
          {isOpen && (
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-light)] opacity-95 z-0"></div>
          )}
          {isOpen ? (
            <X size={28} className="relative z-10 text-white" />
          ) : (
            <Bot size={28} className="relative z-10 text-white animate-ring" />
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            className={`fixed bottom-24 right-6 shadow-2xl z-[60] flex flex-col rounded-xl overflow-hidden border border-[var(--color-primary)]/10 bg-white transition-all duration-300 max-w-[calc(100vw-3rem)] ${
              isExpanded ? "w-[90vw] md:w-[800px] h-[80vh]" : "w-[360px] h-[550px] max-h-[calc(100vh-10rem)]"
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white flex flex-col shrink-0 shadow-md">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Trợ lý AI & Nhắn tin</h3>
                    <p className="text-[10px] text-white/70">Powered by Gemini AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {activeTab === "ai" && (
                    <button
                      onClick={handleClear}
                      className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white/80 hover:text-white cursor-pointer"
                      title="Xóa cuộc trò chuyện"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white/80 hover:text-white"
                    title={isExpanded ? "Thu nhỏ" : "Phóng to"}
                  >
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white/80 hover:text-white"
                    title="Đóng"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              {currentUser && (currentUser.role === "admin" || currentUser.role === "lawyer" || currentUser.role === "staff") && (
                <div className="flex bg-white/10 px-2 pb-0">
                  <button 
                    onClick={() => setActiveTab("ai")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "ai" ? "border-white text-white" : "border-transparent text-white/70 hover:text-white"}`}
                  >
                    Trợ lý AI
                  </button>
                  <button 
                    onClick={() => setActiveTab("cases")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "cases" ? "border-white text-white" : "border-transparent text-white/70 hover:text-white"}`}
                  >
                    Danh sách hồ sơ
                  </button>
                </div>
              )}
            </div>

            {/* Chat Body for AI */}
            {activeTab === "ai" && (
              <>
                <div className="flex-1 p-4 bg-slate-50 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex max-w-[90%] ${msg.role === "user" ? "self-end" : "self-start"}`}
                    >
                      {msg.role === "ai" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-light)] shrink-0 flex items-center justify-center text-white mr-2 mt-auto shadow-md">
                          <Bot size={16} />
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 text-sm shadow-sm rounded-2xl ${
                          msg.role === "user"
                            ? "bg-[var(--color-primary)] text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                        }`}
                      >
                        {msg.role === "ai" ? (
                          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-gray-800 dark:text-slate-200">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Inline API Key Prompt Card when quota or key error occurs */}
                  {(showKeyInput || keySaveSuccess) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 shadow-md my-1 text-xs text-amber-950 space-y-2.5 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between font-bold text-amber-900 border-b border-amber-200/60 pb-1.5">
                        <span className="flex items-center gap-1.5 text-xs">
                          <Key size={15} className="text-amber-700" /> Dynamic AI Key Direct Input
                        </span>
                        <button 
                          onClick={() => setShowKeyInput(false)}
                          className="text-amber-700 hover:text-amber-950 p-0.5 rounded cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {keySaveSuccess ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold py-1">
                          <CheckCircle2 size={16} /> Đã kích hoạt API Key cá nhân thành công!
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] leading-relaxed text-amber-800">
                            Nhập trực tiếp API Key của bạn (Gemini, OpenAI, Claude hoặc DeepSeek) để tiếp tục sử dụng ngay lập tức mà không bị ngắt quãng:
                          </p>

                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={quickApiKey}
                              onChange={(e) => setQuickApiKey(e.target.value)}
                              placeholder="Dán API Key (AI_API_KEY) tại đây..."
                              className="flex-1 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 font-mono"
                            />
                            <button
                              onClick={handleSaveQuickKey}
                              disabled={!quickApiKey.trim()}
                              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                            >
                              <Sparkles size={13} /> Kích Hoạt
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {isLoading && (
                    <div className="flex max-w-[85%] self-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-light)] shrink-0 flex items-center justify-center text-white mr-2 shadow-md">
                        <Bot size={16} />
                      </div>
                      <div className="px-4 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-none flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[var(--color-primary-light)] rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-[var(--color-primary-light)] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                        <span className="w-2 h-2 bg-[var(--color-primary-light)] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                  <div className="flex items-center gap-2 bg-slate-50 border border-[var(--color-primary)]/10 rounded-xl pl-4 pr-1.5 py-1.5 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10 transition-all">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Hỏi AI về luật pháp, tư vấn..."
                      className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400 min-w-0"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="p-2.5 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
                    >
                      <Send size={16} className="translate-x-[1px] translate-y-[1px]" />
                    </button>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-400">AI có thể cung cấp thông tin không chính xác. Hãy kiểm tra lại.</span>
                  </div>
                </div>
              </>
            )}

            {/* Cases Tab Body */}
            {activeTab === "cases" && (
              <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                <div className="p-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
                   <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm hồ sơ..." 
                        value={searchCase}
                        onChange={e => setSearchCase(e.target.value)}
                        className="w-full bg-slate-100 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                      />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(record => (
                      <div key={record.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:border-[var(--color-primary)]/20 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm text-gray-800 line-clamp-1">{record.code ? `${record.code} - ` : ''}{record.title || "Không tên"}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${record.status === "hoan_thanh" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                            {record.status === "hoan_thanh" ? "Hoàn thành" : "Đang xử lý"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{record.clientName || "Chưa có tên KH"}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setChatRecord(record); setChatType("client"); }}
                            className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-medium bg-[var(--color-primary)]/5 text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)]/10 transition-colors cursor-pointer"
                          >
                            <MessageSquare size={14} /> Khách hàng
                          </button>
                          <button 
                            onClick={() => { setChatRecord(record); setChatType("internal"); }}
                            className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition-colors"
                          >
                            <MessageSquare size={14} /> Nội bộ
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Không tìm thấy hồ sơ nào.
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Chat Modals if selected */}
      {chatRecord && chatType === "client" && (
        <LiveChatModal 
          record={chatRecord} 
          users={users} 
          onClose={() => { setChatRecord(null); setChatType(null); }} 
        />
      )}
      
      {chatRecord && chatType === "internal" && (
        <InternalChatModal 
          record={chatRecord} 
          user={currentUser}
          onClose={() => { setChatRecord(null); setChatType(null); }} 
        />
      )}
    </>
  );
}
