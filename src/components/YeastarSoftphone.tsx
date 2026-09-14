import React, { useState, useEffect, useRef } from "react";
import { fetchApi } from "../utils/api";
import { io } from "socket.io-client";
import { syncService } from "../services/BackgroundSyncService";
import { 
  Phone, PhoneOff, PhoneCall, PhoneIncoming, Search, Clock, Play, Pause,
  Volume2, VolumeX, Mic, MicOff, Settings, Check, RefreshCw, Trash2, X, Plus, Star,
  AlertTriangle, Sliders, Info, ShieldAlert, CheckCircle, Database
} from "lucide-react";

interface CallLog {
  id: string;
  name: string;
  phone: string;
  type: "incoming" | "outgoing" | "missed";
  duration: number; // in seconds
  timestamp: string;
  hasRecording: boolean;
  recordingUrl?: string;
  staffName?: string;
  status?: "connected" | "failed" | "no_answer" | "busy";
  transcript?: string;
  isViolated?: boolean;
  violatedKeywords?: string[];
  dossierId?: string;
}

interface YeastarSoftphoneProps {
  language: "vi" | "en";
  user?: any;
  onClose?: () => void;
}

export default function YeastarSoftphone({ language, user, onClose }: YeastarSoftphoneProps) {
  // Advanced Yeastar Connection Configuration
  const [yeastarConfig, setYeastarConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("yeastar_config");
      return saved ? JSON.parse(saved) : {
        pbxHost: "192.168.1.250",
        pbxPort: "8088",
        secretToken: "sec_yeastar_auth_token_8899",
        callbackUrl: "https://crm.law.internal/api/v1/yeastar/callback-cdr",
        extension: "101",
        timeout: 30,
        enableSrtp: true,
        enableAutoRecord: true
      };
    } catch {
      return {
        pbxHost: "192.168.1.250",
        pbxPort: "8088",
        secretToken: "sec_yeastar_auth_token_8899",
        callbackUrl: "https://crm.law.internal/api/v1/yeastar/callback-cdr",
        extension: "101",
        timeout: 30,
        enableSrtp: true,
        enableAutoRecord: true
      };
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [extension, setExtension] = useState(() => localStorage.getItem("yeastar_ext") || yeastarConfig.extension);
  const [isConnected, setIsConnected] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");
  const [callState, setCallState] = useState<"idle" | "dialing" | "ringing" | "connected" | "incoming" | "failed">("idle");
  const [currentCall, setCurrentCall] = useState<{ name: string; phone: string; dossierId?: string } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(true); // Default active for AI Compliance requirement
  const [searchLog, setSearchLog] = useState("");
  
  // Simulation Simulation Option State
  const [simulationMode, setSimulationMode] = useState<"compliant" | "bribery" | "delay" | "conflict">("compliant");
  const [connectionFailureSim, setConnectionFailureSim] = useState(false);

  // Load call logs
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem("yeastar_call_logs_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<"dialer" | "logs">("dialer");
  const [playingLogId, setPlayingLogId] = useState<string | null>(null);
  const [playingProgress, setPlayingProgress] = useState(0);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync logs and configs to localStorage and API
  useEffect(() => {
    localStorage.setItem("yeastar_call_logs_v2", JSON.stringify(callLogs));
  }, [callLogs]);

  // Load call logs from API on mount
  useEffect(() => {
    const loadCallsFromApi = async () => {
      try {
        const data = await fetchApi("/api/calls");
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map((item: any) => ({
            ...item,
            hasRecording: Boolean(item.hasRecording),
            isViolated: Boolean(item.isViolated),
            violatedKeywords: typeof item.violatedKeywords === 'string' ? JSON.parse(item.violatedKeywords || '[]') : item.violatedKeywords || []
          }));
          setCallLogs(parsed);
        }
      } catch (e) {
        console.error("Failed to load calls from API:", e);
      }
    };
    loadCallsFromApi();

    let s: any = null;
    try {
      s = io();
      s.on("call_log_updated", () => loadCallsFromApi());
      s.on("call_ended", () => loadCallsFromApi());
    } catch (e) {}

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("yeastar_ext", extension);
  }, [extension]);

  useEffect(() => {
    localStorage.setItem("yeastar_config", JSON.stringify(yeastarConfig));
  }, [yeastarConfig]);

  // Listen to global dialing events (can dial from case lists)
  useEffect(() => {
    const handleGlobalDial = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.phone) {
        const { phone, name, dossierId } = customEvent.detail;
        setPhoneInput(phone);
        setActiveTab("dialer");
        // Start call automatically
        triggerCall(phone, name || "Khách hàng", dossierId);
      }
    };

    const handleGlobalHangup = () => {
      handleHangup();
    };

    window.addEventListener("yeastar-call", handleGlobalDial);
    window.addEventListener("yeastar-hangup", handleGlobalHangup);
    return () => {
      window.removeEventListener("yeastar-call", handleGlobalDial);
      window.removeEventListener("yeastar-hangup", handleGlobalHangup);
    };
  }, [callState, currentCall, simulationMode, isRecording, callDuration]);

  // Timer logic for active call
  useEffect(() => {
    if (callState === "connected") {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [callState]);

  // Simulated recording playback timer
  useEffect(() => {
    if (playingLogId) {
      setPlayingProgress(0);
      playbackTimerRef.current = setInterval(() => {
        setPlayingProgress(prev => {
          if (prev >= 100) {
            clearInterval(playbackTimerRef.current!);
            setPlayingLogId(null);
            return 0;
          }
          return prev + 10;
        });
      }, 800);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      setPlayingProgress(0);
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [playingLogId]);

  // DTMF Tone Generator
  const playDTMFTone = (digit: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const context = audioContextRef.current;
      if (context.state === "suspended") {
        context.resume();
      }

      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const gain = context.createGain();

      const frequencies: Record<string, [number, number]> = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
      };

      if (frequencies[digit]) {
        const [f1, f2] = frequencies[digit];
        osc1.frequency.value = f1;
        osc2.frequency.value = f2;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(context.destination);

        gain.gain.setValueAtTime(0.05, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);

        osc1.start();
        osc2.start();

        osc1.stop(context.currentTime + 0.15);
        osc2.stop(context.currentTime + 0.15);
      }
    } catch (e) {
      console.warn("AudioContext tone failed:", e);
    }
  };

  const handleKeyPress = (digit: string) => {
    playDTMFTone(digit);
    if (callState === "idle" || callState === "failed") {
      setPhoneInput(prev => prev + digit);
    }
  };

  const triggerCall = (phoneToCall: string, nameToCall?: string, dossierId?: string) => {
    if (!phoneToCall.trim()) return;
    
    // Check connection failure simulation
    if (connectionFailureSim) {
      setCallState("dialing");
      setCurrentCall({ name: nameToCall || "Số điện thoại lạ", phone: phoneToCall, dossierId });
      setTimeout(() => {
        setCallState("failed");
        alert(language === "vi" 
          ? "LỖI TỔNG ĐÀI: Không thể liên kết cuộc gọi qua PBX Yeastar! Vui lòng quay số khác hoặc kiểm tra cấu hình máy lẻ."
          : "PBX ERROR: Failed to link call via Yeastar PBX! Please try another number or verify your extension configuration."
        );
      }, 1500);
      return;
    }

    setCallState("dialing");
    const targetName = nameToCall || "Số điện thoại lạ";
    setCurrentCall({ name: targetName, phone: phoneToCall, dossierId });

    // Multi-stage realistic VoIP PBX Connection
    setTimeout(() => {
      setCallState("ringing");
      setTimeout(() => {
        setCallState("connected");
      }, 2000);
    }, 1500);
  };

  const handleDial = () => {
    triggerCall(phoneInput);
  };

  const handleHangup = () => {
    if (callState === "connected" && currentCall) {
      const activeStaffName = user?.name || "Chuyên viên tư vấn";
      
      // Auto-generate transcripts & AI analysis based on simulation mode
      let transcriptText = "";
      let isViolated = false;
      let violatedKeywords: string[] = [];

      // Load blacklist keywords from localStorage
      let blacklist: string[] = ["tham nhũng", "hối lộ", "trễ hạn", "từ chối", "sai sót", "đình chỉ", "kháng cáo quá hạn", "vi phạm", "xung đột lợi ích"];
      try {
        const savedBlacklist = localStorage.getItem("blacklist_keywords");
        if (savedBlacklist) blacklist = JSON.parse(savedBlacklist);
      } catch (e) {}

      if (simulationMode === "compliant") {
        transcriptText = `Nhân viên: Dạ em chào anh/chị ${currentCall.name} ạ. Em là ${activeStaffName} phụ trách hồ sơ của anh/chị đây ạ.\nKhách hàng: Ồ chào em, hồ sơ vụ việc của anh tiến triển thế nào rồi?\nNhân viên: Dạ thưa anh, các chuyên viên pháp lý đã hoàn thiện dự thảo đơn khởi kiện và thẩm định đầy đủ chứng cứ hợp lệ. Mọi quy trình đều tuân thủ nghiêm ngặt bảo mật và tiêu chuẩn chất lượng đạo đức nghề nghiệp.\nKhách hàng: Tuyệt vời quá, cảm ơn em và văn phòng nhiều nhé.`;
      } else if (simulationMode === "bribery") {
        transcriptText = `Nhân viên: Dạ anh ${currentCall.name} ơi, hồ sơ đất đai đang kẹt ở Sở. Nhưng anh yên tâm, em đã có phương án lách luật bằng cách gửi một khoản tiền nhỏ bôi trơn cho cán bộ duyệt nhanh rồi. Chi phí này em xin phép ghi nhận quà cáp đối ngoại.\nKhách hàng: Việc này có an toàn không em? Có sợ bị thanh tra tham nhũng hối lộ không?\nNhân viên: Anh cứ yên tâm, bên em xử lý bôi trơn suốt, không sợ vấn đề tham nhũng hối lộ đâu ạ.`;
        isViolated = true;
        violatedKeywords = ["hối lộ", "tham nhũng", "bôi trơn"].filter(w => blacklist.some(b => b.toLowerCase() === w.toLowerCase() || w.toLowerCase().includes(b.toLowerCase())));
        if (violatedKeywords.length === 0) violatedKeywords = ["hối lộ", "tham nhũng"];
      } else if (simulationMode === "delay") {
        transcriptText = `Nhân viên: Chị ${currentCall.name} thông cảm giúp em nhé, hồ sơ tranh chấp Landmark em sơ suất nộp trễ hạn mất 3 ngày do quên lịch hạn chót.\nKhách hàng: Ơ sao lại thế được em? Chị đã nhắc đi nhắc lại là hạn nộp rất gấp mà!\nNhân viên: Dạ do công việc lu bu quá nên em sơ suất gặp sai sót nghiêm trọng này, em xin lỗi ạ.`;
        isViolated = true;
        violatedKeywords = ["trễ hạn", "sai sót"].filter(w => blacklist.some(b => b.toLowerCase() === w.toLowerCase() || w.toLowerCase().includes(b.toLowerCase())));
        if (violatedKeywords.length === 0) violatedKeywords = ["trễ hạn", "sai sót"];
      } else if (simulationMode === "conflict") {
        transcriptText = `Nhân viên: Em thấy hồ sơ tranh chấp này bên đối thủ của anh cũng có liên hệ nhờ bên em tư vấn trước đó rồi. Thôi anh thông cảm, em xin từ chối hỗ trợ hồ sơ của anh nhé, để em tập trung làm cho bên kia lợi ích cao hơn.\nKhách hàng: Sao lại thế được, hợp đồng dịch vụ đã ký rồi cơ mà?\nNhân viên: Việc này có xung đột lợi ích nên bên em bắt buộc phải từ chối anh ạ.`;
        isViolated = true;
        violatedKeywords = ["xung đột lợi ích", "từ chối"].filter(w => blacklist.some(b => b.toLowerCase() === w.toLowerCase() || w.toLowerCase().includes(b.toLowerCase())));
        if (violatedKeywords.length === 0) violatedKeywords = ["xung đột lợi ích", "từ chối"];
      }

      // 1. Create VoIP call log
      const newLog: CallLog = {
        id: "call-" + Date.now(),
        name: currentCall.name,
        phone: currentCall.phone,
        type: "outgoing",
        duration: callDuration === 0 ? Math.floor(Math.random() * 45) + 15 : callDuration,
        timestamp: `${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${new Date().toLocaleDateString("vi-VN")}`,
        hasRecording: isRecording,
        staffName: activeStaffName,
        status: "connected",
        transcript: transcriptText,
        isViolated,
        violatedKeywords,
        dossierId: currentCall.dossierId
      };
      
      setCallLogs(prev => [newLog, ...prev]);

      // Use the background sync service to offload call log, performance metrics, and quality evaluation silently in background
      try {
        syncService.enqueueCallLog(newLog);

        // Queue system VoIP metrics automatically
        const voipLatency = Math.floor(Math.random() * 80) + 20; // 20-100ms
        const audioJitter = parseFloat((Math.random() * 2 + 0.5).toFixed(2)); // 0.5 - 2.5ms
        syncService.enqueuePerformanceMetric(
          "voip_call_latency",
          voipLatency,
          `Mã cuộc gọi: ${newLog.id}, Tiêu chuẩn kết nối: SIP/RTP/SRTP, Máy lẻ: Ext ${extension}`
        );
        syncService.enqueuePerformanceMetric(
          "audio_jitter",
          audioJitter,
          `Mã cuộc gọi: ${newLog.id}`
        );

        // Queue Quality Assurance evaluation silently
        const score = isViolated ? "F" : "A";
        const details = isViolated
          ? `Phát hiện hành vi vi phạm từ khóa cấm trong đàm thoại: [${violatedKeywords.join(", ")}]. Cần giám sát, nhắc nhở kỷ luật.`
          : "Cuộc gọi chuẩn mực đạo đức nghề nghiệp, hỗ trợ khách hàng tốt.";
        syncService.enqueueQualityEvaluation(
          newLog.id,
          activeStaffName,
          score,
          isViolated,
          violatedKeywords,
          details
        );
      } catch (e) {
        console.error("Background Sync enqueue error:", e);
      }

      // 2. If violated, trigger compliance actions
      if (isViolated) {
        // A. Trigger high-priority warning in localStorage "supervision_staff_warnings"
        try {
          const savedWarns = localStorage.getItem("supervision_staff_warnings");
          const allWarns = savedWarns ? JSON.parse(savedWarns) : [];
          
          const newWarning = {
            id: "warn-voip-" + Date.now(),
            staffName: activeStaffName,
            level: "critical",
            reason: `Hệ thống AI phát hiện từ khóa cấm Blacklist (${violatedKeywords.join(", ")}) trong cuộc gọi đàm thoại với khách hàng ${currentCall.name} (${currentCall.phone}).`,
            penalty: "Đình chỉ nghiệp vụ tư vấn trực tiếp, điều chuyển làm giải trình nội bộ và lập biên bản kiểm điểm.",
            issuedBy: "AI Compliance Auditor Engine",
            issuedAt: new Date().toISOString(),
            dossierId: currentCall.dossierId || "HS-VOIP-COMPLIANCE",
            acknowledged: false,
            evidenceText: transcriptText
          };
          
          localStorage.setItem("supervision_staff_warnings", JSON.stringify([newWarning, ...allWarns]));
        } catch (e) {
          console.error("Failed to write compliance warning:", e);
        }

        // B. Add to real-time notifications "erp_notifications_v2"
        try {
          const savedNotifs = localStorage.getItem("erp_notifications_v2");
          const notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
          const newNotif = {
            id: "notif-voip-" + Date.now(),
            title: language === "vi" ? "CẢNH BÁO VI PHẠM TỪ CẤM VOIP" : "VOIP COMPLIANCE VIOLATION",
            description: language === "vi" 
              ? `AI phát hiện nhân viên ${activeStaffName} dùng từ khóa nhạy cảm: [${violatedKeywords.join(", ")}] trong cuộc gọi.`
              : `AI flagged sensitive words [${violatedKeywords.join(", ")}] used by ${activeStaffName} during call.`,
            category: "risk_alert",
            timestamp: new Date().toISOString(),
            read: false
          };
          localStorage.setItem("erp_notifications_v2", JSON.stringify([newNotif, ...notifs]));
          // Dispatch global custom event to update notifications counter in real time
          window.dispatchEvent(new Event("erp_notifications_updated"));
        } catch (e) {}
      }

      setCallState("idle");
      if (currentCall?.dossierId) {
        window.dispatchEvent(new CustomEvent("yeastar-call-ended", { 
          detail: { dossierId: currentCall.dossierId, log: newLog } 
        }));
      }
    } else {
      setCallState("idle");
      if (currentCall?.dossierId) {
        window.dispatchEvent(new CustomEvent("yeastar-call-ended", { detail: { dossierId: currentCall.dossierId } }));
      }
    }
    setCurrentCall(null);
    setIsMuted(false);
    setIsOnHold(false);
  };

  const handleDeclineIncoming = () => {
    if (currentCall) {
      const activeStaffName = user?.name || "Chuyên viên tư vấn";
      const newLog: CallLog = {
        id: "call-" + Date.now(),
        name: currentCall.name,
        phone: currentCall.phone,
        type: "incoming",
        duration: 0,
        timestamp: `${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${new Date().toLocaleDateString("vi-VN")}`,
        hasRecording: false,
        staffName: activeStaffName,
        status: "busy",
        transcript: "Cuộc gọi đến bị gác máy/từ chối từ chuyên viên.",
        isViolated: false,
        violatedKeywords: []
      };
      setCallLogs(prev => [newLog, ...prev]);

      try {
        syncService.enqueueCallLog(newLog);
        syncService.enqueuePerformanceMetric("call_decline_latency", 0, `Mã cuộc gọi: ${newLog.id}`);
        syncService.enqueueQualityEvaluation(
          newLog.id,
          activeStaffName,
          "B",
          false,
          [],
          "Cuộc gọi đến bị gác máy/từ chối."
        );
      } catch (e) {
        console.error("Failed to enqueue decline metrics:", e);
      }
    }
    setCallState("idle");
    if (currentCall?.dossierId) {
      window.dispatchEvent(new CustomEvent("yeastar-call-ended", { detail: { dossierId: currentCall.dossierId } }));
    }
    setCurrentCall(null);
  };

  const handleAcceptIncoming = () => {
    setCallState("connected");
  };

  const triggerSimulatedIncoming = () => {
    if (callState !== "idle") return;
    setCallState("incoming");
    setCurrentCall({
      name: "Nguyễn Khách Hàng",
      phone: "0969888999",
      dossierId: "HS-2026-0003"
    });
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter logs based on logged-in user role
  // Consultants can only see their own logs; Directors/Admins see all logs (this is done in the dashboard, but here we show user's own logs)
  const isDirector = user && ["admin", "director", "giám đốc", "deputydirector", "phó giám đốc", "controller", "kiểm soát viên", "prosecutor", "kiểm soát chất lượng"].includes(String(user.role).toLowerCase().trim());
  const activeUserLogs = callLogs.filter(log => {
    if (isDirector) return true; // Director can see everything
    return log.staffName === (user?.name || "Luật sư Lê Ánh Dương") || log.staffName === "Trợ lý Pháp lý Vũ Nam" || !log.staffName;
  });

  const filteredLogs = activeUserLogs.filter(log => 
    log.name.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.phone.includes(searchLog)
  );

  const saveSettingsForm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSettings(false);
    setIsConnected(true);
  };

  const subLabels: Record<string, string> = {
    "1": "",
    "2": "ABC",
    "3": "DEF",
    "4": "GHI",
    "5": "JKL",
    "6": "MNO",
    "7": "PQRS",
    "8": "TUV",
    "9": "WXYZ",
    "*": "",
    "0": "+",
    "#": "",
  };

  return (
    <div className="w-[335px] bg-[#f8fafc] text-[#1e293b] rounded-3xl border border-slate-200/80 shadow-2xl flex flex-col h-[540px] overflow-hidden select-none font-sans transition-all duration-300">
      {/* Softphone Header */}
      <div className="px-4 py-3 bg-[#f1f5f9] border-b border-slate-200/60 flex items-center justify-between shrink-0 drag-handle cursor-move">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center">
            <Phone className="text-emerald-600 animate-pulse" size={15} />
          </div>
          <div className="text-left">
            <h4 className="font-extrabold text-xs tracking-wider text-[#1e293b] uppercase">Yeastar Softphone</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
              <span className="text-[10px] text-slate-500 font-semibold">
                {isConnected ? `${language === "vi" ? "Sẵn sàng" : "Ready"} (Ext ${extension})` : (language === "vi" ? "Mất kết nối" : "Disconnected")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Settings button */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-500 hover:text-[#1e293b] transition-colors cursor-pointer"
            title={language === "vi" ? "Cấu hình tổng đài" : "PBX Settings"}
          >
            <Settings size={14} className="stroke-[2.5]" />
          </button>
          
          {/* Incoming Call Tester */}
          {callState === "idle" && (
            <button 
              onClick={triggerSimulatedIncoming}
              className="px-2 py-1 bg-[#fef3c7] hover:bg-[#fde68a] text-[#b45309] rounded-md text-[9px] font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
              title={language === "vi" ? "Thử nghiệm cuộc gọi đến" : "Test Incoming Call"}
            >
              Test In
            </button>
          )}

          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Settings View */}
      {showSettings ? (
        <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 mb-4">
              <h5 className="font-extrabold text-[11px] text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                <Database size={13} />
                {language === "vi" ? "Cấu hình tổng đài Yeastar" : "Yeastar PBX Credentials"}
              </h5>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            
            <form onSubmit={saveSettingsForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">IP/Host Tổng đài (SIP Server)</label>
                <input 
                  type="text" 
                  value={yeastarConfig.pbxHost}
                  onChange={e => setYeastarConfig({...yeastarConfig, pbxHost: e.target.value})}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cổng API Port</label>
                  <input 
                    type="text" 
                    value={yeastarConfig.pbxPort}
                    onChange={e => setYeastarConfig({...yeastarConfig, pbxPort: e.target.value})}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Máy lẻ SIP Ext</label>
                  <input 
                    type="text" 
                    value={extension}
                    onChange={e => setExtension(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Secret Access Token / API Key</label>
                <input 
                  type="password" 
                  value={yeastarConfig.secretToken}
                  onChange={e => setYeastarConfig({...yeastarConfig, secretToken: e.target.value})}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yeastar CDR Webhook URL</label>
                <input 
                  type="text" 
                  value={yeastarConfig.callbackUrl}
                  onChange={e => setYeastarConfig({...yeastarConfig, callbackUrl: e.target.value})}
                  className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-3 py-1.5 text-slate-500 font-mono text-[9px] focus:ring-1 focus:ring-emerald-500/30 outline-none"
                />
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-2xl border border-slate-100 space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-widest">Giả lập lỗi kết nối</span>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={connectionFailureSim}
                    onChange={e => setConnectionFailureSim(e.target.checked)}
                    className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">{language === "vi" ? "Báo lỗi đàm thoại tổng đài" : "Simulate Call Failure"}</span>
                </label>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Khi bật, nhấn nút gọi sẽ trả về lỗi tổng đài Yeastar giúp thử nghiệm tính năng nhảy/chuyển qua số điện thoại khác của nhân viên tư vấn.
                </p>
              </div>
            </form>
          </div>

          <button 
            onClick={saveSettingsForm}
            className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-[0.98]"
          >
            <Check size={14} className="stroke-[3]" />
            <span>{language === "vi" ? "Lưu cấu hình tổng đài" : "Save PBX Config"}</span>
          </button>
        </div>
      ) : (
        /* Main Panel - Phone Interface */
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {callState !== "idle" ? (
            /* Active Call Screen */
            <div className="flex-1 p-5 flex flex-col justify-between bg-white text-slate-800 overflow-y-auto">
              <div className="text-center space-y-4 py-3">
                <div className="relative inline-block mx-auto">
                  <div className="w-20 h-20 rounded-full bg-[#f8fafc] border border-slate-100 flex items-center justify-center shadow-lg">
                    {callState === "incoming" ? (
                      <PhoneIncoming className="text-emerald-600 animate-bounce" size={28} />
                    ) : (
                      <PhoneCall className="text-[#1d3557] animate-pulse" size={28} />
                    )}
                  </div>
                  {(callState === "ringing" || callState === "incoming") && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/40 animate-ping opacity-25"></div>
                      <div className="absolute -inset-2 rounded-full border border-emerald-500/20 animate-ping opacity-15"></div>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-base text-[#1d3557] truncate max-w-[240px] mx-auto tracking-tight">{currentCall?.name}</h3>
                  <p className="text-slate-400 text-xs font-mono tracking-wider font-semibold">{currentCall?.phone}</p>
                  
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wider uppercase ${
                      callState === "failed" ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {callState === "dialing" && (language === "vi" ? "Đang kết nối Yeastar..." : "Connecting...")}
                      {callState === "ringing" && (language === "vi" ? "Đang đổ chuông..." : "Ringing...")}
                      {callState === "connected" && (language === "vi" ? "Đang đàm thoại" : "In Call")}
                      {callState === "incoming" && (language === "vi" ? "Cuộc gọi đến..." : "Incoming...")}
                      {callState === "failed" && (language === "vi" ? "Lỗi đàm thoại" : "Failed")}
                    </span>
                  </div>

                  {callState === "connected" && (
                    <div className="text-2xl font-black font-mono tracking-widest text-[#1d3557] pt-2">
                      {formatDuration(callDuration)}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Soundwave Graphics when connected */}
              {callState === "connected" && (
                <div className="flex items-center justify-center gap-1.5 py-3 h-11 bg-slate-50 rounded-2xl border border-slate-100/80 max-w-[220px] mx-auto w-full shadow-inner">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((val) => (
                    <div 
                      key={val}
                      className="w-1 bg-[#10b981] rounded-full transition-all duration-300"
                      style={{ 
                       height: isMuted || isOnHold ? "3px" : `${Math.floor(Math.random() * 26) + 6}px`,
                       animation: isMuted || isOnHold ? "none" : `bounce 0.8s ease-in-out infinite alternate ${val * 0.08}s`
                      }}
                    ></div>
                  ))}
                </div>
              )}

              {/* Simulation AI Control Suite during dial/connected state */}
              {callState !== "failed" && (
                <div className="p-3 border border-slate-200/80 bg-[#f8fafc] rounded-2xl space-y-1.5 my-2 shrink-0 text-left">
                  <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-amber-600 uppercase">
                    <Sliders size={11} className="stroke-[2.5]" />
                    <span>Giả lập kịch bản AI giám sát</span>
                  </div>
                  
                  <div className="space-y-1">
                    <select 
                      value={simulationMode}
                      onChange={e => setSimulationMode(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="compliant">✓ Thỏa thuận bình thường (Hợp lệ)</option>
                      <option value="bribery">⚠ Từ cấm: Gợi ý bôi trơn, hối lộ</option>
                      <option value="delay">⚠ Từ cấm: Nộp trễ hạn đơn, sơ suất</option>
                      <option value="conflict">⚠ Từ cấm: Từ chối do xung đột lợi ích</option>
                    </select>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed leading-snug">
                    AI tự động dịch âm thanh thành văn bản thời gian thực và quét cảnh báo từ khóa cấm theo chuẩn tuân thủ.
                  </p>
                </div>
              )}

              {/* Action buttons (Mute, Hold, Record) */}
              {callState === "connected" && (
                <div className="grid grid-cols-3 gap-2.5 py-1 shrink-0">
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${isMuted ? "bg-red-50 text-red-600 border border-red-150 shadow-xs" : "hover:bg-slate-50 text-[#1d3557] border border-slate-100"}`}
                  >
                    {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                    <span className="text-[9px] font-black tracking-wide uppercase">{language === "vi" ? "Tắt tiếng" : "Mute"}</span>
                  </button>
                  
                  <button 
                    onClick={() => setIsOnHold(!isOnHold)} 
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${isOnHold ? "bg-amber-50 text-amber-600 border border-amber-150 shadow-xs" : "hover:bg-slate-50 text-[#1d3557] border border-slate-100"}`}
                  >
                    {isOnHold ? <Pause size={15} /> : <Play size={15} />}
                    <span className="text-[9px] font-black tracking-wide uppercase">{isOnHold ? (language === "vi" ? "Tiếp tục" : "Resume") : (language === "vi" ? "Chờ" : "Hold")}</span>
                  </button>

                  <button 
                    disabled={true}
                    className="p-2 rounded-xl flex flex-col items-center gap-1 bg-red-50 text-red-600 border border-red-100 cursor-not-allowed"
                    title={language === "vi" ? "Yêu cầu ghi âm tự động" : "Auto-recording"}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-[9px] font-black tracking-wide uppercase">{language === "vi" ? "Ghi âm AI" : "AI Rec"}</span>
                  </button>
                </div>
              )}

              {/* Accept / Decline / Hangup Controls */}
              <div className="flex justify-center gap-6 pt-3 pb-1 shrink-0">
                {callState === "incoming" ? (
                  <>
                    <button 
                      onClick={handleDeclineIncoming}
                      className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 cursor-pointer"
                      title={language === "vi" ? "Từ chối" : "Decline"}
                    >
                      <PhoneOff size={18} />
                    </button>
                    <button 
                      onClick={handleAcceptIncoming}
                      className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 animate-bounce cursor-pointer"
                      title={language === "vi" ? "Nhận cuộc gọi" : "Answer"}
                    >
                      <Phone size={18} />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleHangup}
                    className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 cursor-pointer"
                    title={language === "vi" ? "Gác máy" : "Hang Up"}
                  >
                    <PhoneOff size={18} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Standby Interface: Dialpad & Logs Tab */
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Tab Menu */}
              <div className="flex bg-[#f1f5f9] p-1 rounded-2xl mx-4 my-2.5 shrink-0 border border-slate-200/30">
                <button 
                  onClick={() => setActiveTab("dialer")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === "dialer" ? "bg-white text-emerald-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {language === "vi" ? "Bàn phím" : "Dialer"}
                </button>
                <button 
                  onClick={() => setActiveTab("logs")}
                  className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === "logs" ? "bg-white text-emerald-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {language === "vi" ? "Lịch sử cuộc gọi" : "Call Logs"}
                </button>
              </div>

              {activeTab === "dialer" ? (
                /* Dialer screen */
                <div className="flex-1 px-4 pb-4 pt-1 flex flex-col justify-between overflow-y-auto">
                  <div>
                    {/* Dialed Number Display */}
                    <div className="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60 flex items-center justify-between mb-2.5">
                      <input 
                        type="text" 
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/[^\d*#]/g, ""))}
                        placeholder={language === "vi" ? "Nhập số hoặc chọn HS.." : "Dial a number..."}
                        className="bg-transparent border-none outline-none font-mono text-base font-bold text-slate-800 w-full tracking-widest placeholder-slate-400"
                      />
                      {phoneInput && (
                        <button 
                          onClick={() => setPhoneInput("")}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Extension Selection Info */}
                    <div className="flex items-center justify-between px-1 mb-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <span>{language === "vi" ? "Đường dây máy lẻ:" : "Extension:"}</span>
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-lg">
                        Ext {extension}
                      </span>
                    </div>

                    {/* Number Pad Grid */}
                    <div className="grid grid-cols-3 gap-y-2 gap-x-4 max-w-[220px] mx-auto py-1 shrink-0">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                        <button
                          key={key}
                          onClick={() => handleKeyPress(key)}
                          className="w-12 h-12 md:w-[50px] md:h-[50px] rounded-full bg-white hover:bg-slate-50 active:bg-slate-150 flex flex-col items-center justify-center transition-all duration-100 border border-slate-150/50 active:scale-95 shadow-xs text-slate-700 cursor-pointer"
                        >
                          <span className="text-[17px] font-black leading-none">{key}</span>
                          {subLabels[key] && (
                            <span className="text-[7.5px] text-slate-400 font-extrabold tracking-widest uppercase mt-0.5 leading-none">
                              {subLabels[key]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Call Button */}
                  <div className="flex justify-center pt-2 shrink-0">
                    <button 
                      onClick={handleDial}
                      disabled={!phoneInput.trim()}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md transition-all active:scale-90 ${phoneInput.trim() ? "bg-emerald-600 hover:bg-emerald-750 cursor-pointer shadow-emerald-100" : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"}`}
                      title={language === "vi" ? "Bắt đầu cuộc gọi" : "Call"}
                    >
                      <Phone size={18} className="fill-current" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Call Logs tab */
                <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4 pt-1 text-left">
                  {/* Search Log Bar */}
                  <div className="relative mb-3 shrink-0">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                    <input 
                      type="text" 
                      value={searchLog}
                      onChange={(e) => setSearchLog(e.target.value)}
                      placeholder={language === "vi" ? "Tìm số, tên cuộc gọi..." : "Search call logs..."}
                      className="w-full bg-[#f8fafc] border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-400/80 font-medium"
                    />
                  </div>

                  {/* Call logs list */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-thin">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-[#f8fafc] border border-slate-200/40 rounded-2xl flex flex-col gap-2.5 group transition-all duration-200 hover:bg-white hover:shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${log.type === "missed" ? "bg-red-50 text-red-500 border-red-100/60" : "bg-emerald-50 text-emerald-600 border-emerald-100/60"}`}>
                                <Phone size={12} className="fill-current" />
                              </div>
                              <div className="min-w-0 text-left">
                                <h5 className="text-[11px] font-extrabold truncate text-slate-800 flex items-center">
                                  <span>{log.name}</span>
                                  {log.isViolated && (
                                    <span className="border border-red-200 bg-red-50 text-red-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ml-1.5 tracking-wider">
                                      Violated
                                    </span>
                                  )}
                                </h5>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5 font-bold tracking-wide">{log.phone}</p>
                              </div>
                            </div>

                            {/* Quick callback / play recording buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {log.hasRecording && (
                                <button 
                                  onClick={() => setPlayingLogId(playingLogId === log.id ? null : log.id)}
                                  className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${playingLogId === log.id ? "text-emerald-600 bg-emerald-50/50" : "text-slate-400"}`}
                                  title={language === "vi" ? "Nghe ghi âm" : "Listen Recording"}
                                >
                                  {playingLogId === log.id ? <Pause size={11} className="stroke-[3]" /> : <Play size={11} className="fill-current" />}
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setPhoneInput(log.phone);
                                  setActiveTab("dialer");
                                  triggerCall(log.phone, log.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-lg transition-colors cursor-pointer"
                                title={language === "vi" ? "Gọi lại" : "Call Back"}
                              >
                                <PhoneCall size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Recording progress bar when playing */}
                          {playingLogId === log.id && (
                            <div className="space-y-1.5 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/40 text-left">
                              <div className="flex items-center justify-between text-[9px] text-slate-500">
                                <span className="font-mono flex items-center gap-1 text-emerald-600 font-bold">
                                  <Volume2 size={10} className="animate-pulse" />
                                  Playing...
                                </span>
                                <span className="font-mono font-bold text-slate-600">{playingProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-200/70 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-600 h-full transition-all duration-300"
                                  style={{ width: `${playingProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-[9px] text-slate-400 leading-snug italic pt-1 border-t border-slate-200/20">
                                {language === "vi" 
                                  ? "Đang phát ghi âm giải nén trực tiếp từ tổng đài SIP..." 
                                  : "Streaming audio file directly from Cloud Yeastar SIP..."}
                              </p>
                            </div>
                          )}

                          {/* Render Transcript snippet if violated or playing */}
                          {(log.isViolated || playingLogId === log.id) && log.transcript && (
                            <div className="bg-[#f1f5f9]/60 p-2.5 border border-slate-200/40 rounded-xl text-left space-y-1.5 mt-0.5">
                              <span className="text-[9px] font-black text-slate-500 tracking-wide block uppercase">
                                {language === "vi" ? "Bản ghi lời thoại AI:" : "AI Voice Transcript:"}
                              </span>
                              <p className="text-[10px] text-slate-600 leading-relaxed font-sans whitespace-pre-line max-h-24 overflow-y-auto pr-1">
                                {log.transcript}
                              </p>
                              {log.violatedKeywords && log.violatedKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-slate-200/30">
                                  <span className="text-[8px] font-extrabold text-red-600 flex items-center gap-0.5 mr-1">
                                    <ShieldAlert size={9} />
                                    {language === "vi" ? "Từ khóa cấm:" : "Flagged words:"}
                                  </span>
                                  {log.violatedKeywords.map((k, i) => (
                                    <span key={i} className="bg-red-50 text-red-600 text-[8px] px-2 py-0.5 rounded border border-red-200/80 font-black tracking-wider uppercase">
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100/80 pt-2 font-medium">
                            <span className="font-mono flex items-center gap-1 font-semibold">
                              <Clock size={10} />
                              {log.timestamp}
                            </span>
                            {log.duration > 0 && (
                              <span className="font-mono bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded-lg font-bold">
                                {formatDuration(log.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-slate-400 space-y-2 text-xs">
                        <Clock size={20} />
                        <span>{language === "vi" ? "Chưa có cuộc gọi nào" : "No call logs yet"}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
