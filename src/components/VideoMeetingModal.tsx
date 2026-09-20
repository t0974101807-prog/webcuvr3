import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Share2,
  Users,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  FileText,
  Clock,
  Link as LinkIcon,
  Plus,
  Search,
  Scale,
  AlertTriangle,
  BookOpen,
  CheckSquare,
  Edit3,
  Shield,
  ArrowRight,
  Send,
  Paperclip,
  FolderOpen,
  RefreshCw,
  Layout,
  CheckCircle2,
  Settings,
  Filter,
  Bot,
  ChevronDown,
  Maximize2,
  Minimize2,
  Radio,
  FileCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Briefcase,
  Calendar,
  Layers,
  BarChart2,
  Lock,
  Trash2,
  Save,
  Download,
  Volume2,
  Sliders,
  Camera,
  Monitor,
  Sun,
  Moon
} from "lucide-react";

interface VideoMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "vi" | "en";
  initialRoomTitle?: string;
  initialClientName?: string;
  dossierId?: string;
  currentUser?: { name?: string; role?: string; avatar?: string };
  records?: any[];
  events?: any[];
  setEvents?: React.Dispatch<React.SetStateAction<any[]>>;
  updateRecords?: (records: any[], changedRecord?: any) => void;
}

export const VideoMeetingModal: React.FC<VideoMeetingModalProps> = ({
  isOpen,
  onClose,
  language = "vi",
  initialRoomTitle = "Tranh chấp hợp đồng dịch vụ",
  initialClientName = "Công ty TNHH ABC",
  dossierId = "HS-2026-001",
  currentUser,
  records = [],
  events = [],
  setEvents,
  updateRecords
}) => {
  const [meetingState, setMeetingState] = useState<"lobby" | "in_meeting" | "ended">("lobby");
  const [selectedDossierId, setSelectedDossierId] = useState<string>(dossierId || "HS-2026-001");
  const [roomTitle, setRoomTitle] = useState(initialRoomTitle);
  const [clientName, setClientName] = useState(initialClientName);
  const [roomCode] = useState(() => `LEGAL-MEET-${Math.floor(100000 + Math.random() * 900000)}`);

  // Auto-link active record when selectedDossierId changes
  useEffect(() => {
    if (selectedDossierId && records && records.length > 0) {
      const match = records.find((r: any) => r.id === selectedDossierId || r.systemId === selectedDossierId);
      if (match) {
        if (match.client || match.clientName) {
          setClientName(match.client || match.clientName);
        }
        if (match.title || match.category) {
          setRoomTitle(match.title || match.category);
        }
      }
    }
  }, [selectedDossierId, records]);

  // Active Sidebar & Navigation State
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "meeting" | "dossier" | "client" | "calendar" | "tasks" | "docs" | "knowledge" | "reports" | "settings"
  >("meeting");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hardware State
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"grid" | "speaker" | "split">("grid");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("videomeeting_theme_mode");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      localStorage.setItem("videomeeting_theme_mode", nextMode ? "dark" : "light");
    } catch {}
    showToast(nextMode ? "Đã chuyển sang Giao diện Tối (Dark Mode)" : "Đã chuyển sang Giao diện Sáng (Light Mode)");
  };

  // Active Bottom Bar Panels & Modals Toggle
  const [activePanels, setActivePanels] = useState({
    case_summary: true,
    ai_copilot: true,
    chat: true,
    pdf_review: true,
    tasks: true,
    legal_research: true
  });

  const [aiTab, setAiTab] = useState<"summary" | "analysis" | "hints" | "warnings">("summary");
  const [taskFilter, setTaskFilter] = useState<"all" | "mine" | "assigned">("all");
  const [legalTab, setLegalTab] = useState<"law" | "precedents">("law");

  // Modals inside meeting
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Chat Messages
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string; isAi?: boolean; attachment?: string }>>([
    {
      sender: "Luật sư Nguyễn Văn A",
      text: "Mọi người xem giúp tôi hợp đồng trang 5, điều khoản thanh toán.",
      time: "10:15"
    },
    {
      sender: "Khách hàng - Chị Linh",
      text: "Tôi đã upload thêm chứng từ thanh toán đợt 1.",
      time: "10:16",
      attachment: "Chung-tu-thanh-toan-dot-1.pdf"
    },
    {
      sender: "Trợ lý pháp lý - Mai",
      text: "Tôi sẽ tổng hợp lại timeline để mọi người theo dõi.",
      time: "10:17"
    }
  ]);
  const [newMessage, setNewMessage] = useState("");

  // Tasks in Meeting
  const [meetingTasks, setMeetingTasks] = useState([
    { id: 1, title: "Gửi công văn yêu cầu thanh toán lần 2", due: "22/05/2026", assignee: "NV", done: false },
    { id: 2, title: "Chuẩn bị hồ sơ khởi kiện", due: "25/05/2026", assignee: "NVA", done: false },
    { id: 3, title: "Thu thập chứng cứ bổ sung", due: "23/05/2026", assignee: "Mai", done: true },
    { id: 4, title: "Dự kiến lịch làm việc với khách hàng", due: "21/05/2026", assignee: "NVB", done: false },
    { id: 5, title: "Nghiên cứu án lệ liên quan", due: "24/05/2026", assignee: "Mai", done: false }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("NVA");

  // Legal Notes
  const [liveNotes, setLiveNotes] = useState(
    "• Khách hàng xác nhận đã bàn giao đợt 1 chứng từ vào ngày 10/05/2026.\n• Luật sư A đề xuất gửi Công văn cảnh báo vi phạm nghĩa vụ thanh toán trước ngày 22/05/2026.\n• Cần bổ sung Giấy ủy quyền ký hợp đồng của bên phía Công ty XYZ."
  );

  // PDF Annotations
  const [annotations, setAnnotations] = useState([
    { id: 1, author: "Luật sư Nguyễn Văn A", time: "10:16", text: "Điều khoản quan trọng", color: "amber" },
    { id: 2, author: "Luật sư Trần Minh B", time: "10:17", text: "Cần đối chiếu với phụ lục", color: "blue" },
    { id: 3, author: "Trợ lý pháp lý - Mai", time: "10:18", text: "Kiểm tra chứng từ thanh toán đợt 1", color: "purple" }
  ]);

  // Search Legal
  const [legalSearchQuery, setLegalSearchQuery] = useState("");

  // Whiteboard Canvas
  const [whiteboardNotes, setWhiteboardNotes] = useState<string[]>([
    "Sơ đồ dòng tiền đợt 1 & đợt 2",
    "Thời điểm phát sinh vi phạm: 15/05/2026",
    "Cơ quan giải quyết: TAND Quận 1, TP.HCM"
  ]);
  const [newWhiteboardItem, setNewWhiteboardItem] = useState("");

  // Meeting Timer
  const [meetingTimer, setMeetingTimer] = useState(1518); // ~25:18
  const timerRef = useRef<any>(null);
  const [aiSummaryText, setAiSummaryText] = useState("");
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isHardwareActive, setIsHardwareActive] = useState(false);
  const [mediaStatusText, setMediaStatusText] = useState("Đang kết nối luồng Video Full HD...");
  const [audioLevel, setAudioLevel] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Callback ref to bind stream instantly whenever video element mounts
  const setVideoRef = (node: HTMLVideoElement | null) => {
    localVideoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  };

  // Generate an active live stream canvas if camera device permission is restricted
  const generateLiveStudioStream = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let frameCount = 0;
      const drawCanvas = () => {
        frameCount++;
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#0F172A");
        grad.addColorStop(0.5, "#1E1B4B");
        grad.addColorStop(1, "#020617");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 20;

        // Animated pulsing halo
        const pulse = Math.sin(frameCount * 0.05) * 15;
        const haloGrad = ctx.createRadialGradient(centerX, centerY, 60, centerX, centerY, 160 + pulse);
        haloGrad.addColorStop(0, "rgba(99, 102, 241, 0.35)");
        haloGrad.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 160 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Legal Badge Icon
        ctx.fillStyle = "#6366F1";
        ctx.beginPath();
        ctx.arc(centerX, centerY - 20, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚖️", centerX, centerY - 20);

        ctx.fillStyle = "#F8FAFC";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("Luật sư Nguyễn Văn A", centerX, centerY + 75);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "14px monospace";
        ctx.fillText("CHỦ TRÌ PHÒNG HỌP • LIVE STUDIO FEED 1080P", centerX, centerY + 110);

        // Dynamic audio bar visualization
        ctx.fillStyle = "#34D399";
        for (let i = 0; i < 20; i++) {
          const barHeight = Math.abs(Math.sin(frameCount * 0.1 + i * 0.4)) * 25 + 5;
          ctx.fillRect(centerX - 150 + i * 15, canvas.height - 40 - barHeight, 10, barHeight);
        }

        requestAnimationFrame(drawCanvas);
      };

      drawCanvas();

      const canvasStream = (canvas as any).captureStream(30);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = canvasStream;
      setIsHardwareActive(false);
      setMediaStatusText("Đang mở luồng Video HD Trực tiếp (Live 30FPS Studio Feed)");

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = canvasStream;
        localVideoRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.error("Canvas stream error", e);
    }
  };

  // Request real physical camera & microphone with maximum hardware capabilities
  const requestHardwareMedia = async () => {
    setMediaError(null);
    setMediaStatusText("Đang kết nối Camera & Microphone phần cứng ở chất lượng tối đa...");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ mediaDevices");
      }

      let stream: MediaStream | null = null;
      try {
        // Attempt maximum 4K Ultra HD (3840x2160 @ 60fps) hardware stream
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 3840, min: 1280 },
            height: { ideal: 2160, min: 720 },
            frameRate: { ideal: 60, min: 30 },
            facingMode: "user"
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (e1) {
        try {
          // Fallback to Full HD 1080p @ 60fps
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 60 }
            },
            audio: true
          });
        } catch (e2) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (e3) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
        }
      }

      if (stream) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        streamRef.current = stream;
        setIsHardwareActive(true);
        setIsVideoOn(true);
        setIsMicOn(true);

        // Inspect actual hardware track settings
        const videoTrack = stream.getVideoTracks()[0];
        let resolutionText = "Full HD 1080p";
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          const w = settings.width || 1920;
          const h = settings.height || 1080;
          const fps = settings.frameRate ? Math.round(settings.frameRate) : 60;

          if (w >= 3840 || h >= 2160) {
            resolutionText = `4K Ultra HD (${w}x${h} @ ${fps}fps)`;
          } else if (w >= 2560 || h >= 1440) {
            resolutionText = `2K Quad HD (${w}x${h} @ ${fps}fps)`;
          } else if (w >= 1920 || h >= 1080) {
            resolutionText = `Full HD 1080p (${w}x${h} @ ${fps}fps)`;
          } else {
            resolutionText = `HD Ready (${w}x${h} @ ${fps}fps)`;
          }
        }

        setMediaStatusText(`Đã kết nối trực tiếp Camera & Micro phần cứng tối đa (${resolutionText})`);
        showToast(`Đã kết nối thành công Camera phần cứng: ${resolutionText}`);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        // Setup audio visualizer
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              audioContextRef.current = ctx;
              const source = ctx.createMediaStreamSource(stream);
              const analyser = ctx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const updateVolume = () => {
                if (analyserRef.current) {
                  analyserRef.current.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                  const avg = sum / dataArray.length;
                  setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
                  requestAnimationFrame(updateVolume);
                }
              };
              updateVolume();
            }
          } catch (e) {}
        }
      }
    } catch (err: any) {
      console.warn("Hardware camera/mic access failed:", err);
      setMediaError(
        "Trình duyệt chưa cấp quyền Camera/Micro phần cứng. Đã tự động kích hoạt luồng Live Studio HD. Bạn có thể bấm nút 'Cấp quyền Cam/Mic' bất cứ lúc nào để thử kết nối lại."
      );
      generateLiveStudioStream();
    }
  };

  // Handle real browser Screen Capture
  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia) {
          const screenStream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
            video: { cursor: "always" },
            audio: false
          });
          screenStreamRef.current = screenStream;
          setIsScreenSharing(true);
          showToast("Đã kích hoạt Chia sẻ màn hình trực tiếp!");

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
            localVideoRef.current.play().catch(() => {});
          }

          const videoTrack = screenStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.onended = () => {
              setIsScreenSharing(false);
              if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
                screenStreamRef.current = null;
              }
              if (localVideoRef.current && streamRef.current) {
                localVideoRef.current.srcObject = streamRef.current;
                localVideoRef.current.play().catch(() => {});
              }
              showToast("Đã dừng chia sẻ màn hình");
            };
          }
        } else {
          setIsScreenSharing(true);
          showToast("Đã bật chế độ Chia sẻ màn hình");
        }
      } catch (err) {
        console.warn("Screen sharing cancelled or not allowed", err);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      showToast("Đã dừng chia sẻ màn hình");
      if (localVideoRef.current && streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    }
  };

  const initializeMediaStream = async () => {
    await requestHardwareMedia();
  };

  useEffect(() => {
    if (isOpen) {
      initializeMediaStream();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // Keep video element attached whenever isVideoOn or meetingState changes
  useEffect(() => {
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [isVideoOn, meetingState]);

  // Handle track toggles
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = isVideoOn;
      });
    }
  }, [isVideoOn]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  useEffect(() => {
    if (meetingState === "in_meeting") {
      timerRef.current = setInterval(() => {
        setMeetingTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [meetingState]);

  if (!isOpen) return null;

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting?room=${roomCode}`);
    setCopiedLink(true);
    showToast("Đã sao chép liên kết cuộc họp an toàn!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleStartMeeting = () => {
    setMeetingState("in_meeting");
    setActiveSidebarTab("meeting");
    showToast("Đã kết nối vào WORKSPACE họp trực tuyến!");
  };

  const handleEndMeeting = async () => {
    setIsGeneratingAiSummary(true);
    setMeetingState("ended");

    setTimeout(() => {
      setAiSummaryText(
        `📌 BIÊN BẢN HỌP TRỰC TUYẾN & TÓM TẮT PHÁP LÝ (LEGAL AI MINUTES)\n` +
        `• Mã vụ án: ${dossierId} | Tranh chấp hợp đồng dịch vụ\n` +
        `• Khách hàng: ${clientName} | Thời lượng: ${Math.floor(meetingTimer / 60)} phút ${meetingTimer % 60} giây\n\n` +
        `📝 NỘI DUNG TÓM TẮT THỐNG NHẤT:\n` +
        `1. Cuộc họp tập trung thảo luận về tranh chấp thanh toán hợp đồng dịch vụ giữa Công ty ABC và Công ty XYZ.\n` +
        `2. Khách hàng cung cấp thêm chứng từ thanh toán đợt 1 và xác nhận đã thực hiện đúng nghĩa vụ theo hợp đồng.\n` +
        `3. Phía Luật sư Ánh Dương chịu trách nhiệm gửi Công văn yêu cầu thanh toán lần 2 và hoàn thiện hồ sơ khởi kiện.\n\n` +
        `✅ CÔNG VIỆC TỰ ĐỘNG KHỞI TẠO:\n` +
        `• Gửi công văn yêu cầu thanh toán lần 2 (NV - 22/05/2026)\n` +
        `• Chuẩn bị hồ sơ khởi kiện (NVA - 25/05/2026)\n` +
        `• Thu thập chứng cứ bổ sung (Mai - 23/05/2026)`
      );
      setIsGeneratingAiSummary(false);
    }, 1200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        sender: currentUser?.name || "Luật sư Nguyễn Văn A",
        text: newMessage,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setNewMessage("");
  };

  const toggleTaskDone = (id: number) => {
    setMeetingTasks((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  // Filter tasks
  const filteredTasks = meetingTasks.filter((t) => {
    if (taskFilter === "mine") return t.assignee === "NVA" || t.assignee === "NV";
    if (taskFilter === "assigned") return t.assignee === "Mai" || t.assignee === "NVB";
    return true;
  });

  // Law Data Filter
  const legalArticles = [
    { title: "Điều 300 - Bộ luật Dân sự 2015", desc: "Phạt vi phạm hợp đồng và mức phạt tối đa theo thỏa thuận." },
    { title: "Điều 301 - Luật Thương mại 2005", desc: "Mức phạt vi phạm đối với nghĩa vụ hợp đồng thương mại không quá 8%." },
    { title: "Điều 306 - Luật Thương mại 2005", desc: "Quyền yêu cầu tiền lãi do chậm thanh toán theo lãi suất nợ quá hạn." }
  ].filter(
    (item) =>
      item.title.toLowerCase().includes(legalSearchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(legalSearchQuery.toLowerCase())
  );

  const legalPrecedents = [
    { title: "Án lệ số 02/2016/AL", desc: "Về tranh chấp đòi lại tài sản và hợp đồng chuyển nhượng quyền sử dụng đất." },
    { title: "Án lệ số 43/2021/AL", desc: "Về hiệu lực của hợp đồng thế chấp nhà ở khi bên thế chấp chậm thực hiện nghĩa vụ." }
  ].filter(
    (item) =>
      item.title.toLowerCase().includes(legalSearchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(legalSearchQuery.toLowerCase())
  );

  return (
    <div className={`fixed inset-0 z-50 flex overflow-hidden font-sans select-none animate-in fade-in duration-200 theme-independent ${
      isDarkMode ? "theme-dark dark bg-[#0B0F19] text-slate-100" : "theme-light bg-slate-100 text-slate-900"
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <div
        className={`${
          sidebarCollapsed ? "w-16" : "w-56"
        } ${
          isDarkMode ? "bg-[#0F172A] border-slate-800/80 text-slate-200" : "bg-white border-slate-200 text-slate-800 shadow-sm"
        } border-r flex flex-col justify-between shrink-0 transition-all duration-200 z-20`}
      >
        {/* Logo & Brand */}
        <div>
          <div className="h-14 px-4 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
              <Scale size={18} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="font-serif font-extrabold text-sm tracking-wider text-white block leading-tight">
                  LEGAL OS
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Meeting HD</span>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <div className="p-2 space-y-1 text-xs font-medium">
            {[
              { id: "meeting", label: "Họp trực tuyến", icon: Video },
              { id: "dossier", label: "Hồ sơ vụ án", icon: FolderOpen },
              { id: "client", label: "Khách hàng", icon: Users },
              { id: "calendar", label: "Lịch", icon: Calendar },
              { id: "tasks", label: "Công việc", icon: CheckSquare },
              { id: "docs", label: "Tài liệu", icon: FileText },
              { id: "knowledge", label: "Trí thức pháp lý", icon: BookOpen },
              { id: "reports", label: "Báo cáo", icon: BarChart2 },
              { id: "settings", label: "Cài đặt", icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebarTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebarTab(item.id as any);
                    showToast(`Đã chuyển sang mục: ${item.label}`);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={isActive ? "text-indigo-400" : "text-slate-400"} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Collapse Action */}
        <div className="p-2 border-t border-slate-800/80">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl text-xs font-medium flex items-center gap-3 cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!sidebarCollapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE WRAPPER */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isDarkMode ? "bg-[#0B0F19]" : "bg-slate-100"}`}>
        {/* 2. TOP NAVIGATION HEADER BAR */}
        <div className={`h-14 border-b px-4 flex items-center justify-between shrink-0 gap-3 ${
          isDarkMode ? "bg-[#0F172A] border-slate-800/80 text-slate-200" : "bg-white border-slate-200 text-slate-800 shadow-xs"
        }`}>
          {/* Left Case Info */}
          <div className="flex items-center gap-3 truncate">
            <span className="text-xs font-bold text-slate-200 truncate">
              Hợp vụ án: <span className="text-amber-400 font-mono">{dossierId}</span> - {roomTitle}
            </span>

            {meetingState === "in_meeting" && (
              <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                {isRecording ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    REC {formatTime(meetingTimer)}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 font-bold">
                    PAUSED {formatTime(meetingTimer)}
                  </span>
                )}
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 items-center gap-1">
                  <Zap size={11} className="text-emerald-400" /> 6 Thành viên
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 items-center gap-1">
                  1080p Full HD
                </span>
                <span className="hidden lg:inline-flex px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 items-center gap-1">
                  <Lock size={11} /> Mã hóa AES-256
                </span>
              </div>
            )}
          </div>

          {/* Right Top Bar Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                isDarkMode
                  ? "bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700"
                  : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100"
              }`}
              title={isDarkMode ? "Chuyển sang Giao diện Sáng (Light Mode)" : "Chuyển sang Giao diện Tối (Dark Mode)"}
            >
              {isDarkMode ? (
                <>
                  <Sun size={14} className="text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Giao diện Sáng</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline">Giao diện Tối</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setActiveSidebarTab("meeting");
                setActivePanels((p) => ({ ...p, ai_copilot: !p.ai_copilot }));
                showToast("Đã bật/tắt AI Copilot");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activePanels.ai_copilot
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
              }`}
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>AI Copilot</span>
            </button>

            <button
              onClick={() => {
                const modes: Array<"grid" | "speaker" | "split"> = ["grid", "speaker", "split"];
                const nextMode = modes[(modes.indexOf(layoutMode) + 1) % modes.length];
                setLayoutMode(nextMode);
                showToast(`Đã đổi bố cục sang: ${nextMode === "grid" ? "Lưới 6 ô" : nextMode === "speaker" ? "Tập trung Diễn giả" : "Chia đôi Tài liệu"}`);
              }}
              className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 items-center gap-1 cursor-pointer"
            >
              <Layout size={14} /> Bố cục ({layoutMode.toUpperCase()})
            </button>

            <button
              onClick={() => showToast(`Đã lưu bố cục tùy chỉnh cho vụ án ${dossierId}`)}
              className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 items-center gap-1 cursor-pointer"
            >
              Lưu bố cục
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"}
                alt="User"
                className="w-8 h-8 rounded-xl object-cover border border-slate-700"
              />
              <div className="hidden xl:block text-left">
                <span className="text-xs font-bold text-slate-200 block leading-tight">{currentUser?.name || "Luật sư Nguyễn Văn A"}</span>
                <span className="text-[10px] text-slate-400 font-mono">Senior Partner</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer ml-1"
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* LOBBY VIEW STATE */}
        {meetingState === "lobby" && (
          <div className={`flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center ${
            isDarkMode ? "bg-[#0B0F19]" : "bg-slate-100"
          }`}>
            <div className={`max-w-2xl w-full border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 ${
              isDarkMode ? "bg-[#0F172A] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 text-xs font-mono font-bold">
                  <Sparkles size={14} /> Legal Collaboration Center Ready
                </div>
                <h3 className={`text-2xl sm:text-3xl font-bold font-serif tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Họp trực tuyến Tư vấn Pháp lý
                </h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Chuẩn bị thiết bị phần cứng, cấp quyền Camera/Mic và sẵn sàng làm việc trực tiếp cùng Khách hàng & AI Copilot.
                </p>
              </div>

              {/* Camera Preview Box */}
              <div className="relative w-full h-56 sm:h-64 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                {isVideoOn ? (
                  <video
                    ref={setVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="text-center space-y-2 p-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto text-xl font-bold">
                      {currentUser?.name?.charAt(0) || "L"}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Camera đang tắt</p>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur text-xs font-medium text-slate-200 rounded-lg border border-slate-800 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isHardwareActive ? "bg-emerald-400 animate-pulse" : "bg-indigo-400"}`}></span>
                  <span className="text-[11px] font-semibold">{mediaStatusText}</span>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    onClick={requestHardwareMedia}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow flex items-center gap-1 cursor-pointer"
                    title="Cấp quyền Camera phần cứng"
                  >
                    <Video size={13} />
                    <span>Thử bật Webcam</span>
                  </button>
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isMicOn ? "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700" : "bg-rose-600 text-white border-rose-500"
                    }`}
                  >
                    {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isVideoOn ? "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700" : "bg-rose-600 text-white border-rose-500"
                    }`}
                  >
                    {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
                  </button>
                </div>
              </div>

              {mediaError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                  <span>{mediaError}</span>
                </div>
              )}

              {/* Form inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                    <span>Mã Vụ án / Dossier ID hệ thống</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">🟢 Live System Data</span>
                  </label>
                  <select
                    value={selectedDossierId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDossierId(val);
                      const match = records.find((r: any) => r.id === val || r.systemId === val);
                      if (match) {
                        setClientName(match.client || match.clientName || clientName);
                        setRoomTitle(match.title || roomTitle);
                        showToast(`⚡ Đã tự động cập nhật thông tin Live Hồ sơ ${val} (${match.client || 'Khách hàng'})!`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-indigo-500/50 rounded-xl font-mono text-amber-400 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="HS-2026-001">HS-2026-001 - Tranh chấp hợp đồng dịch vụ (Công ty TNHH ABC)</option>
                    {records && records.length > 0 && records.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.id} - {r.title || r.category} ({r.client || r.clientName || 'Khách hàng'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                    <span>Tên Khách hàng / Đối tác</span>
                    <span className="text-[10px] text-indigo-400 font-normal">Tự động đồng bộ</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Hủy thao tác
                </button>
                <button
                  onClick={handleStartMeeting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Video size={16} />
                  <span>Tham gia WORKSPACE HỌP NGAY</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. ACTIVE VIEW CONTAINER BASED ON ACTIVE SIDEBAR TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "meeting" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0B0F19] p-3 gap-3">
            {/* TOP SECTION: VIDEO GRID + CASE DETAILS + AI COPILOT */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-3 min-h-0 overflow-y-auto xl:overflow-hidden">
              {/* VIDEO PARTICIPANTS GRID */}
              <div className="xl:col-span-5 bg-[#0F172A] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative shadow-xl min-h-[320px]">
                {/* Screen Sharing Banner */}
                {isScreenSharing && (
                  <div className="mb-2 p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <Monitor size={14} className="text-amber-400 animate-pulse" />
                      Bạn đang chia sẻ toàn bộ màn hình làm việc
                    </span>
                    <button
                      onClick={() => setIsScreenSharing(false)}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] rounded font-bold"
                    >
                      Dừng chia sẻ
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 grid-rows-2 gap-2 flex-1">
                  {/* Tile 1: Luật sư Nguyễn Văn A */}
                  <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                    {isVideoOn ? (
                      <video
                        ref={setVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
                        alt="Luật sư Nguyễn Văn A"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[10px] font-semibold text-slate-200 border border-slate-800 flex items-center gap-1.5 z-10">
                      <span className={`w-1.5 h-1.5 rounded-full ${isHardwareActive ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}></span>
                      <span className="truncate">Luật sư Nguyễn Văn A {isHardwareActive ? "(Hardware Cam)" : "(Live Studio)"}</span>
                    </div>

                    {!isHardwareActive && isVideoOn && (
                      <button
                        onClick={requestHardwareMedia}
                        className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-indigo-600/90 hover:bg-indigo-500 text-white text-[9px] font-bold rounded border border-indigo-400/50 shadow flex items-center gap-1 z-10 cursor-pointer"
                        title="Bấm để cấp quyền camera phần cứng"
                      >
                        <Video size={10} /> Cấp quyền Cam/Mic
                      </button>
                    )}

                    <div className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-900/80 text-emerald-400 border border-slate-800 z-10">
                      {isMicOn ? <Mic size={11} /> : <MicOff size={11} className="text-rose-400" />}
                    </div>
                  </div>

                  {/* Tile 2: Khách hàng - Chị Linh */}
                  <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
                      alt="Khách hàng"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[10px] font-semibold text-slate-200 border border-slate-800 flex items-center gap-1.5">
                      <span className="truncate">Khách hàng - Chị Linh</span>
                    </div>
                  </div>

                  {/* Tile 3: Luật sư Trần Minh B */}
                  <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
                      alt="Luật sư Trần Minh B"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[10px] font-semibold text-slate-200 border border-slate-800 flex items-center gap-1.5">
                      <span className="truncate">Luật sư Trần Minh B</span>
                    </div>
                  </div>

                  {/* Tile 4: Luật sư Phạm Hoàng C */}
                  <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"
                      alt="Luật sư Phạm Hoàng C"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[10px] font-semibold text-slate-200 border border-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="truncate">Luật sư Phạm Hoàng C</span>
                    </div>
                  </div>

                  {/* Tile 5: Trợ lý pháp lý - Mai */}
                  <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                    <img
                      src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400"
                      alt="Trợ lý pháp lý Mai"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded text-[10px] font-semibold text-slate-200 border border-slate-800 flex items-center gap-1.5">
                      <span className="truncate">Trợ lý pháp lý - Mai</span>
                    </div>
                  </div>

                  {/* Tile 6: AI Assistant */}
                  <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-indigo-500/30 flex flex-col items-center justify-center p-2 bg-gradient-to-b from-slate-900 to-indigo-950/40">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-indigo-500/60 flex items-center justify-center text-white mb-1 shadow-md shadow-indigo-500/20">
                      <Bot size={22} className="text-indigo-400" />
                    </div>
                    <span className="text-[11px] font-bold text-white">AI Assistant</span>
                    <div className="absolute top-1.5 right-1.5 p-1 rounded bg-rose-950/60 text-rose-400 border border-rose-800/60">
                      <MicOff size={11} />
                    </div>
                  </div>
                </div>
              </div>

              {/* HỒ SƠ VỤ ÁN PANEL */}
              <div className="xl:col-span-4 bg-[#0F172A] border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between relative shadow-xl overflow-y-auto text-xs">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                    <span className="font-bold text-xs text-slate-200 flex items-center gap-2">
                      <FolderOpen size={16} className="text-indigo-400" />
                      HỒ SƠ VỤ ÁN
                    </span>
                    <button
                      onClick={() => {
                        setActiveSidebarTab("dossier");
                        showToast("Đã mở chi tiết hồ sơ vụ án!");
                      }}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      title="Phóng to Hồ sơ"
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Mã hồ sơ</span>
                      <span className="font-mono font-bold text-white block">{dossierId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">TIMELINE VỤ ÁN</span>
                      <div className="space-y-1.5 pl-2 border-l-2 border-indigo-500/40 text-[10px]">
                        <div>
                          <span className="text-indigo-400 font-bold block">15/05/2026</span>
                          <span className="text-slate-300">Tiếp nhận hồ sơ</span>
                        </div>
                        <div>
                          <span className="text-indigo-400 font-bold block">18/05/2026</span>
                          <span className="text-slate-300">Ký hợp đồng dịch vụ</span>
                        </div>
                        <div>
                          <span className="text-indigo-400 font-bold block">20/05/2026</span>
                          <span className="text-slate-300">Thu thập chứng cứ</span>
                        </div>
                        <div>
                          <span className="text-indigo-400 font-bold block">25/05/2026</span>
                          <span className="text-slate-300">Gửi công văn đối tác</span>
                        </div>
                      </div>
                    </div>

                    <div className="-mt-20">
                      <span className="text-slate-400 block mb-0.5">Tên vụ việc</span>
                      <span className="font-bold text-white block mb-2">{roomTitle}</span>

                      <span className="text-slate-400 block mb-0.5">Khách hàng</span>
                      <span className="text-indigo-300 font-medium block mb-2">{clientName}</span>

                      <span className="text-slate-400 block mb-0.5">Trạng thái</span>
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] mb-2">
                        Đang xử lý
                      </span>

                      <span className="text-slate-400 block mb-0.5">Luật sư phụ trách</span>
                      <span className="text-slate-200 font-semibold block mb-2">Nguyễn Văn A</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => setActiveSidebarTab("dossier")}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-[11px] transition-all cursor-pointer"
                  >
                    Xem chi tiết hồ sơ
                  </button>
                  <button
                    onClick={() => setActiveSidebarTab("dossier")}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-[11px] transition-all cursor-pointer"
                  >
                    Xem toàn bộ timeline
                  </button>
                </div>
              </div>

              {/* AI COPILOT PANEL */}
              <div className="xl:col-span-3 bg-[#0F172A] border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between relative shadow-xl overflow-y-auto text-xs">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                    <span className="font-bold text-xs text-slate-200 flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-400" />
                      AI COPILOT
                    </span>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 mb-3 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                    {[
                      { id: "summary", label: "Tóm tắt" },
                      { id: "analysis", label: "Phân tích" },
                      { id: "hints", label: "Gợi ý" },
                      { id: "warnings", label: "Cảnh báo" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAiTab(tab.id as any)}
                        className={`flex-1 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          aiTab === tab.id ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic AI Content based on active tab */}
                  {aiTab === "summary" && (
                    <div className="space-y-3 animate-in fade-in">
                      <div>
                        <span className="font-bold text-slate-300 block mb-1 text-[11px] uppercase tracking-wider">TÓM TẮT CUỘC HỌP</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                          Cuộc họp tập trung thảo luận về tranh chấp thanh toán hợp đồng dịch vụ giữa Công ty ABC và Công ty XYZ. Khách hàng cung cấp thêm chứng từ thanh toán đợt 1.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-300 block mb-1.5 text-[11px] uppercase tracking-wider">HÀNH ĐỘNG ĐỀ XUẤT</span>
                        <div className="space-y-1.5 text-[11px]">
                          {[
                            "Gửi công văn yêu cầu thanh toán lần 2",
                            "Chuẩn bị hồ sơ khởi kiện",
                            "Thu thập chứng cứ bổ sung",
                            "Dự kiến lịch làm việc với khách hàng"
                          ].map((act, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                const newTask = {
                                  id: Date.now() + i,
                                  title: act,
                                  due: "Hôm nay 17:00",
                                  done: false,
                                  assignee: "Của tôi",
                                };
                                setMeetingTasks((prev) => [newTask, ...prev]);
                                showToast(`Đã tạo công việc mới: "${act}"`);
                              }}
                              className="w-full flex items-center justify-between gap-2 text-slate-200 bg-slate-950/60 hover:bg-slate-900 p-2 rounded-lg border border-slate-800/80 transition-all cursor-pointer text-left group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                                <span className="group-hover:text-indigo-300 transition-colors">{act}</span>
                              </div>
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/50 opacity-80 group-hover:opacity-100">+ Tạo task</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {aiTab === "analysis" && (
                    <div className="space-y-2 animate-in fade-in text-[11px]">
                      <span className="font-bold text-indigo-300 block">ĐÁNH GIÁ RỦI RO PHÁP LÝ:</span>
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-amber-400 font-bold block">1. Điều khoản phạt vi phạm (Điều 5.2):</span>
                        <p className="text-slate-300">
                          Theo Luật Thương mại 2005 (Điều 301), mức phạt tối đa là 8% giá trị phần nghĩa vụ bị vi phạm. Cần rà soát xem mức phạt trong hợp đồng có vượt quá không.
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-indigo-400 font-bold block">2. Khả năng hòa giải:</span>
                        <p className="text-slate-300">Khách hàng sẵn sàng gia hạn thanh toán thêm 15 ngày nếu bên đối tác có văn bản cam kết rõ ràng.</p>
                      </div>
                    </div>
                  )}

                  {aiTab === "hints" && (
                    <div className="space-y-2 animate-in fade-in text-[11px]">
                      <span className="font-bold text-emerald-400 block">GỢI Ý CÂU HỎI THẨM VẤN:</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300">
                        <li>Đối tác đã phản hồi bằng email hay văn bản chính thức sau khi nhận thông báo?</li>
                        <li>Chứng từ giao nhận đợt 1 có biên bản xác nhận khối lượng của kỹ sư giám sát không?</li>
                        <li>Có phụ lục gia hạn thời gian thực hiện dịch vụ không?</li>
                      </ul>
                    </div>
                  )}

                  {aiTab === "warnings" && (
                    <div className="space-y-2 animate-in fade-in text-[11px]">
                      <span className="font-bold text-rose-400 block">CẢNH BÁO THỜI HẠN TỐ TỤNG:</span>
                      <div className="p-2.5 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-200">
                        ⚠️ Thời hiệu khởi kiện tranh chấp hợp đồng thương mại là 02 năm kể từ ngày quyền và lợi ích hợp pháp bị xâm phạm.
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowAddTaskModal(true);
                  }}
                  className="w-full py-2 mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Tạo task từ nội dung họp
                </button>
              </div>
            </div>

            {/* BOTTOM ROW: CHAT + PDF CONTRACT + TASK + LEGAL ARTICLES */}
            <div className="h-64 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 min-h-0 shrink-0">
              {/* WIDGET 1: CHAT */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative shadow-xl overflow-hidden text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-indigo-400" />
                    CHAT TRONG PHÒNG HỌP
                  </span>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {messages.map((m, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-bold text-indigo-300">{m.sender}</span>
                        <span className="text-slate-500 font-mono">{m.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-200 leading-snug">{m.text}</p>
                      {m.attachment && (
                        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2 text-rose-400 font-mono text-[10px] mt-1">
                          <FileText size={14} />
                          <div className="flex-1 truncate">
                            <span className="block font-bold truncate">{m.attachment}</span>
                            <span className="text-slate-500 text-[9px]">2.4 MB</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="mt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button type="submit" className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer">
                    <Send size={12} />
                  </button>
                </form>
              </div>

              {/* WIDGET 2: PDF HỢP ĐỒNG DỊCH VỤ */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative shadow-xl overflow-hidden text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5 truncate">
                    <FileText size={14} className="text-indigo-400" />
                    PDF HỢP ĐỒNG DỊCH VỤ
                  </span>
                  <button onClick={() => setActiveSidebarTab("docs")} className="text-indigo-400 text-[10px] hover:underline">
                    Xem full PDF
                  </button>
                </div>

                {/* PDF Content */}
                <div className="flex-1 grid grid-cols-12 gap-2 min-h-0">
                  <div className="col-span-7 bg-slate-950 p-2 rounded-lg border border-slate-800 overflow-y-auto text-[10px] space-y-1.5 font-serif">
                    <p className="font-bold text-white uppercase text-[11px]">ĐIỀU 5. THANH TOÁN</p>
                    <p className="text-slate-300">5.1. Bên A thanh toán cho Bên B theo các đợt như sau:</p>
                    <div className="bg-amber-500/20 p-1 rounded text-amber-200 font-sans border border-amber-500/30">
                      - Đợt 1: 30% giá trị hợp đồng, thanh toán trong vòng 07 ngày kể từ ngày ký hợp đồng.
                    </div>
                    <div className="bg-blue-500/20 p-1 rounded text-blue-200 font-sans border border-blue-500/30">
                      - Đợt 2: 50% giá trị hợp đồng, thanh toán khi Bên B hoàn thành 60% khối lượng công việc.
                    </div>
                    <p className="text-slate-300 font-sans">- Đợt 3: 20% giá trị hợp đồng khi nghiệm thu.</p>
                  </div>

                  {/* Annotations */}
                  <div className="col-span-5 bg-slate-950/60 p-2 rounded-lg border border-slate-800 overflow-y-auto space-y-2 text-[10px]">
                    <span className="font-bold text-slate-400 block border-b border-slate-800 pb-1">GHI CHÚ (3)</span>
                    {annotations.map((ann) => (
                      <div key={ann.id} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="font-bold text-indigo-300 truncate">{ann.author}</span>
                        </div>
                        <p className="text-slate-300 leading-tight">{ann.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* WIDGET 3: TASK */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative shadow-xl overflow-hidden text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-indigo-400" />
                    CÔNG VIỆC CẦN XỬ LÝ
                  </span>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={11} /> Tạo task
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-2 text-[10px] border-b border-slate-800/80 pb-1">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "mine", label: "Của tôi" },
                    { id: "assigned", label: "Giao cho tôi" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTaskFilter(t.id as any)}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        taskFilter === t.id ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Task Checklist */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => toggleTaskDone(t.id)}
                      className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-2 cursor-pointer ${
                        t.done ? "bg-slate-950/40 border-slate-800 text-slate-500 line-through" : "bg-slate-950 border-slate-800 text-slate-200"
                      }`}
                    >
                      <input type="checkbox" checked={t.done} onChange={() => {}} className="rounded border-slate-700 text-indigo-600 focus:ring-0" />
                      <span className="flex-1 truncate">{t.title}</span>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0">{t.due}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-1 text-right">
                  <button onClick={() => setActiveSidebarTab("tasks")} className="text-[10px] text-indigo-400 hover:underline cursor-pointer">
                    Xem tất cả task →
                  </button>
                </div>
              </div>

              {/* WIDGET 4: ĐIỀU LUẬT & ÁN LỆ */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between relative shadow-xl overflow-hidden text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                    <Scale size={14} className="text-indigo-400" />
                    ĐIỀU LUẬT & ÁN LỆ
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-2 text-[10px] border-b border-slate-800/80 pb-1">
                  <button
                    onClick={() => setLegalTab("law")}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                      legalTab === "law" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Điều luật
                  </button>
                  <button
                    onClick={() => setLegalTab("precedents")}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                      legalTab === "precedents" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Án lệ
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={legalSearchQuery}
                    onChange={(e) => setLegalSearchQuery(e.target.value)}
                    placeholder="Tìm tra cứu văn bản..."
                    className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-200 focus:outline-none"
                  />
                  <Search size={12} className="absolute right-2 top-1.5 text-slate-500" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px]">
                  {legalTab === "law" ? (
                    legalArticles.map((art, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const now = new Date();
                          const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                          setMessages((prev) => [
                            ...prev,
                            {
                              sender: "Hệ thống Tra cứu",
                              time: timeStr,
                              text: `📌 Trích dẫn quy định: ${art.title} - ${art.desc}`,
                            },
                          ]);
                          showToast(`Đã trích dẫn "${art.title}" vào Chat!`);
                        }}
                        className="p-2 bg-slate-950 hover:bg-slate-900/90 rounded-lg border border-slate-800 hover:border-indigo-500/50 space-y-0.5 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300 block group-hover:text-indigo-200">{art.title}</span>
                          <span className="text-[9px] text-indigo-400 opacity-0 group-hover:opacity-100 font-semibold">Trích dẫn →</span>
                        </div>
                        <p className="text-slate-300 leading-snug">{art.desc}</p>
                      </div>
                    ))
                  ) : (
                    legalPrecedents.map((prec, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const now = new Date();
                          const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                          setMessages((prev) => [
                            ...prev,
                            {
                              sender: "Hệ thống Tra cứu",
                              time: timeStr,
                              text: `⚖️ Trích dẫn Án lệ: ${prec.title} - ${prec.desc}`,
                            },
                          ]);
                          showToast(`Đã trích dẫn Án lệ "${prec.title}" vào Chat!`);
                        }}
                        className="p-2 bg-slate-950 hover:bg-slate-900/90 rounded-lg border border-slate-800 hover:border-amber-500/50 space-y-0.5 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400 block group-hover:text-amber-300">{prec.title}</span>
                          <span className="text-[9px] text-amber-400 opacity-0 group-hover:opacity-100 font-semibold">Trích dẫn →</span>
                        </div>
                        <p className="text-slate-300 leading-snug">{prec.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: HỒ SƠ VỤ ÁN FULL TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "dossier" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold block">{dossierId}</span>
                <h2 className="text-2xl font-serif font-bold text-white">{roomTitle}</h2>
                <p className="text-xs text-slate-400">Khách hàng: {clientName} | TAND Quận 1, TP.HCM</p>
              </div>
              <button
                onClick={() => setActiveSidebarTab("meeting")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Video size={14} /> Quay lại họp
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-indigo-400">Thông tin chung</h3>
                <div className="space-y-2 text-slate-300">
                  <p><strong>Loại vụ việc:</strong> Dân sự - Thương mại</p>
                  <p><strong>Ngày thụ lý:</strong> 15/05/2026</p>
                  <p><strong>Giá trị tranh chấp:</strong> 1.500.000.000 VNĐ</p>
                  <p><strong>Luật sư chính:</strong> Nguyễn Văn A</p>
                  <p><strong>Trợ lý pháp lý:</strong> Đỗ Thị Mai</p>
                </div>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-3 col-span-2">
                <h3 className="font-bold text-sm text-indigo-400">Tiến trình tố tụng & Timeline</h3>
                <div className="space-y-3 pl-3 border-l-2 border-indigo-500/50">
                  <div>
                    <span className="text-xs font-bold text-amber-400">15/05/2026</span>
                    <p className="text-slate-200">Tiếp nhận thông tin vụ việc và lập hồ sơ tư vấn ban đầu.</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-400">18/05/2026</span>
                    <p className="text-slate-200">Ký hợp đồng dịch vụ pháp lý số 42/HĐDV-2026.</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-400">20/05/2026</span>
                    <p className="text-slate-200">Rà soát hợp đồng gốc và thu thập 05 tài liệu chứng cứ đợt 1.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: KHÁCH HÀNG FULL TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "client" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white">{clientName}</h2>
                <p className="text-xs text-slate-400">Mã khách hàng: KH-8829 | Loại: Doanh nghiệp</p>
              </div>
              <button onClick={() => setActiveSidebarTab("meeting")} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                Quay lại phòng họp
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-sm text-indigo-400">Thông tin liên hệ</h3>
                <p><strong>Người đại diện:</strong> Bà Nguyễn Thị Linh (Giám đốc)</p>
                <p><strong>Email:</strong> linh.nguyen@abc-company.vn</p>
                <p><strong>Điện thoại:</strong> 0903.123.456</p>
                <p><strong>Địa chỉ:</strong> Số 100 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-sm text-indigo-400">Lịch sử giao dịch</h3>
                <p>• Hợp đồng dịch vụ tư vấn thường xuyên (2025)</p>
                <p>• Vụ án tranh chấp hợp đồng dịch vụ (HS-2026-001)</p>
                <p>• Tổng thanh toán đã hoàn tất: 120.000.000 VNĐ</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: LỊCH FULL TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "calendar" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white">Lịch Họp & Lịch Tố Tụng</h2>
              <button onClick={() => setActiveSidebarTab("meeting")} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                Quay lại họp
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {[
                { date: "22/05/2026 - 10:00", title: "Họp làm việc với Khách hàng Công ty ABC", type: "Họp trực tuyến" },
                { date: "25/05/2026 - 14:00", title: "Hạn chót gửi Công văn cho Công ty XYZ", type: "Thời hạn tố tụng" },
                { date: "01/06/2026 - 08:30", title: "Phiên hòa giải tại TAND Quận 1", type: "Lịch Tòa án" }
              ].map((cal, i) => (
                <div key={i} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-indigo-400">{cal.type}</span>
                  <p className="font-bold text-white">{cal.title}</p>
                  <p className="text-slate-400 font-mono">{cal.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: CÔNG VIỆC FULL TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "tasks" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white">Quản lý Công việc (Task Manager)</h2>
              <button onClick={() => setShowAddTaskModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                + Tạo task mới
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {meetingTasks.map((t) => (
                <div key={t.id} className="p-3 bg-[#0F172A] border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)} />
                    <span className={t.done ? "line-through text-slate-500" : "text-white font-medium"}>{t.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-mono">
                    <span>Người xử lý: {t.assignee}</span>
                    <span>Hạn: {t.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 6: TÀI LIỆU FULL TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "docs" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white">Thư viện Tài liệu & PDF Reader</h2>
              <button onClick={() => setActiveSidebarTab("meeting")} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                Quay lại họp
              </button>
            </div>
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 font-serif text-sm text-slate-200 leading-relaxed max-w-4xl mx-auto space-y-4">
              <h3 className="text-center text-lg font-bold text-white uppercase">HỢP ĐỒNG DỊCH VỤ TƯ VẤN PHÁP LÝ</h3>
              <p>Số: 42/HĐDV-2026/ANHDUONG-ABC</p>
              <p>Hôm nay, ngày 18 tháng 05 năm 2026, tại Văn phòng Luật sư Ánh Dương...</p>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl font-sans text-xs">
                📌 Điều khoản trọng yếu: Bên A cam kết thanh toán đợt 1 trong vòng 07 ngày làm việc kể từ khi ký kết hợp đồng.
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: TRÍ THỨC PHÁP LÝ FULL TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "knowledge" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white">Trí thức Pháp lý & Tra cứu Án lệ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {legalArticles.concat(legalPrecedents as any).map((item, idx) => (
                <div key={idx} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-indigo-400 text-sm">{item.title}</h4>
                  <p className="text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 8: BÁO CÁO FULL TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "reports" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white">Báo cáo & Phân tích Thời gian Họp</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-slate-400 block mb-1">Thời lượng họp</span>
                <span className="text-2xl font-mono font-bold text-indigo-400">{formatTime(meetingTimer)}</span>
              </div>
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-slate-400 block mb-1">Thành viên tham gia</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">6/6</span>
              </div>
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 text-center">
                <span className="text-slate-400 block mb-1">Task đã tạo</span>
                <span className="text-2xl font-mono font-bold text-amber-400">{meetingTasks.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 9: CÀI ĐẶT FULL TAB */}
        {meetingState === "in_meeting" && activeSidebarTab === "settings" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0B0F19] space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-serif font-bold text-white">Cài đặt Thiết bị & Hệ thống Họp</h2>
            </div>
            <div className="max-w-xl space-y-4 text-xs bg-[#0F172A] border border-slate-800 p-6 rounded-2xl">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Camera thiết bị</label>
                <select className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200">
                  <option>Integrated HD Webcam (1080p)</option>
                  <option>External USB Camera</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Microphone thu âm</label>
                <select className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200">
                  <option>Default High Definition Audio Device</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Khử tiếng ồn bằng AI</label>
                <input type="checkbox" defaultChecked className="mr-2" /> Tự động loại bỏ tiếng ồn nền
              </div>
            </div>
          </div>
        )}

        {/* 4. BOTTOM FLOATING CONTROL DOCK BAR */}
        {meetingState === "in_meeting" && (
          <div className="h-14 bg-[#0F172A] border-t border-slate-800/80 px-4 flex items-center justify-between shrink-0 overflow-x-auto gap-2">
            {/* Left Hardware & Core Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isMicOn ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700" : "bg-rose-600 text-white"
                }`}
                title="Microphone"
              >
                {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                <span className="hidden sm:inline">{isMicOn ? "Mic On" : "Mic Mute"}</span>
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isVideoOn ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700" : "bg-rose-600 text-white"
                }`}
                title="Camera"
              >
                {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
                <span className="hidden sm:inline">{isVideoOn ? "Camera On" : "Cam Off"}</span>
              </button>

              <button
                onClick={() => setShowParticipantsModal(true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Users size={16} />
                <span className="hidden md:inline">Thành viên</span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">6</span>
              </button>

              <button
                onClick={() => {
                  setActiveSidebarTab("meeting");
                  showToast("Đã cuộn đến phần trò chuyện Chat");
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare size={16} />
                <span className="hidden md:inline">Chat</span>
              </button>

              <button
                onClick={handleToggleScreenShare}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isScreenSharing ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                }`}
              >
                <Share2 size={16} />
                <span className="hidden lg:inline">Chia sẻ màn hình</span>
              </button>

              <button
                onClick={() => setShowWhiteboardModal(true)}
                className="hidden xl:flex p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 items-center gap-1 cursor-pointer"
              >
                <Edit3 size={16} />
                <span>Whiteboard</span>
              </button>
            </div>

            {/* Middle Tools */}
            <div className="hidden 2xl:flex items-center gap-1.5">
              <button
                onClick={() => setActiveSidebarTab("dossier")}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 items-center gap-1 cursor-pointer"
              >
                <FolderOpen size={16} />
                <span>Hồ sơ vụ án</span>
              </button>

              <button
                onClick={() => {
                  setActiveSidebarTab("meeting");
                  setActivePanels((p) => ({ ...p, ai_copilot: true }));
                }}
                className="p-2 bg-indigo-600/30 text-indigo-300 rounded-xl text-xs border border-indigo-500/40 items-center gap-1 cursor-pointer"
              >
                <Sparkles size={16} className="text-amber-300" />
                <span>AI Copilot</span>
              </button>

              <button
                onClick={() => setShowNotesModal(true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 items-center gap-1 cursor-pointer"
              >
                <Edit3 size={16} />
                <span>Ghi chú</span>
              </button>

              <button
                onClick={() => setShowAddTaskModal(true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 items-center gap-1 cursor-pointer"
              >
                <CheckSquare size={16} />
                <span>Task</span>
              </button>

              <button
                onClick={() => setActiveSidebarTab("knowledge")}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 items-center gap-1 cursor-pointer"
              >
                <Scale size={16} />
                <span>Điều luật</span>
              </button>

              <button
                onClick={() => {
                  setIsRecording(!isRecording);
                  showToast(isRecording ? "Đã tạm dừng ghi hình cuộc họp" : "Đã tiếp tục ghi hình HD");
                }}
                className={`p-2 rounded-xl text-xs border items-center gap-1 cursor-pointer ${
                  isRecording ? "bg-rose-950/40 text-rose-400 border-rose-800/60" : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                <Radio size={16} className={isRecording ? "animate-pulse" : ""} />
                <span>{isRecording ? "Ghi hình ON" : "Ghi hình Off"}</span>
              </button>

              <button
                onClick={() => setActiveSidebarTab("settings")}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs border border-slate-700 items-center gap-1 cursor-pointer"
              >
                <Settings size={16} />
                <span>Cài đặt</span>
              </button>
            </div>

            {/* Leave Call Action Button */}
            <button
              onClick={handleEndMeeting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <PhoneOff size={16} />
              <span>Rời cuộc họp</span>
            </button>
          </div>
        )}

        {/* 5. POST-MEETING AUTOMATION SUMMARY MODAL */}
        {meetingState === "ended" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-[#0B0F19]">
            <div className="max-w-2xl w-full bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white">Đã Kết Thúc Cuộc Họp Trực Tuyến</h3>
                <p className="text-xs text-slate-400">
                  Hệ thống AI đang tự động tổng hợp biên bản, trích xuất công việc và đồng bộ vào Hệ thống Hồ sơ ERP Ánh Dương Law.
                </p>
              </div>

              {/* AI Generated Minutes Output */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                {isGeneratingAiSummary ? (
                  <div className="flex items-center justify-center py-8 gap-3 text-indigo-400">
                    <RefreshCw size={20} className="animate-spin" />
                    <span>AI đang phân tích âm thanh và tạo Biên bản cuộc họp...</span>
                  </div>
                ) : (
                  aiSummaryText
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Đóng & Trở về Hệ thống ERP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PARTICIPANTS MODAL */}
        {showParticipantsModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" />
                  Danh sách Thành viên Cuộc họp (6)
                </h4>
                <button onClick={() => setShowParticipantsModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { name: "Luật sư Nguyễn Văn A", role: "Chủ trì cuộc họp", mic: true, avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" },
                  { name: "Khách hàng - Chị Linh", role: "Khách hàng", mic: true, avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
                  { name: "Luật sư Trần Minh B", role: "Luật sư thành viên", mic: false, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400" },
                  { name: "Luật sư Phạm Hoàng C", role: "Luật sư tố tụng", mic: true, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" },
                  { name: "Trợ lý pháp lý - Mai", role: "Ghi biên bản", mic: true, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400" },
                  { name: "Legal AI Assistant", role: "Trợ lý Trí tuệ nhân tạo", mic: false, isAi: true }
                ].map((p, i) => (
                  <div key={i} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.isAi ? (
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                          <Bot size={14} />
                        </div>
                      ) : (
                        <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-lg object-cover" />
                      )}
                      <div>
                        <span className="font-bold text-white block">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.role}</span>
                      </div>
                    </div>
                    {p.mic ? <Mic size={14} className="text-emerald-400" /> : <MicOff size={14} className="text-rose-400" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WHITEBOARD MODAL */}
        {showWhiteboardModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 max-w-2xl w-full space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Edit3 size={16} className="text-indigo-400" />
                  Bảng Trắng Trực Tuyến (Interactive Legal Whiteboard)
                </h4>
                <button onClick={() => setShowWhiteboardModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 h-64 overflow-y-auto space-y-2">
                {whiteboardNotes.map((note, i) => (
                  <div key={i} className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-xs text-indigo-200">
                    📌 {note}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWhiteboardItem}
                  onChange={(e) => setNewWhiteboardItem(e.target.value)}
                  placeholder="Nhập ghi chú lên bảng trắng..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (newWhiteboardItem.trim()) {
                      setWhiteboardNotes((prev) => [...prev, newWhiteboardItem]);
                      setNewWhiteboardItem("");
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Thêm note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIVE NOTES MODAL */}
        {showNotesModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 max-w-lg w-full space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileText size={16} className="text-indigo-400" />
                  Ghi Chú Nhanh Trong Cuộc Họp
                </h4>
                <button onClick={() => setShowNotesModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={liveNotes}
                onChange={(e) => setLiveNotes(e.target.value)}
                rows={8}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (liveNotes.trim()) {
                      // Save consultation record into yeastar_call_logs_v2 & real-time sync
                      const existing = localStorage.getItem("yeastar_call_logs_v2");
                      let currentLogs = [];
                      try { currentLogs = existing ? JSON.parse(existing) : []; } catch (e) { currentLogs = []; }
                      
                      const newLog = {
                        id: `call-meet-${Date.now()}`,
                        dossierId: selectedDossierId,
                        dossierTitle: roomTitle,
                        name: clientName,
                        phone: "0903123456",
                        type: "outgoing",
                        duration: 360,
                        timestamp: `${new Date().getHours()}:${new Date().getMinutes()} - ${new Date().toLocaleDateString('vi-VN')}`,
                        hasRecording: true,
                        staffName: currentUser?.name || "Luật sư Nguyễn Văn A",
                        status: "connected",
                        category: "Tư vấn Trực tuyến Video Meeting",
                        consultationNote: liveNotes,
                        transcript: `Luật sư: Biên bản họp trực tuyến ngày ${new Date().toLocaleDateString('vi-VN')} cho Hồ sơ ${selectedDossierId} (${clientName}).\nNội dung ghi nhận: ${liveNotes}`,
                        qcRating: "5",
                        qcEvaluator: "System Auto Sync"
                      };
                      
                      const updated = [newLog, ...currentLogs];
                      localStorage.setItem("yeastar_call_logs_v2", JSON.stringify(updated));
                      window.dispatchEvent(new Event('storage'));

                      showToast(`⚡ Đã đồng bộ Biên bản họp vào Hồ sơ ${selectedDossierId} theo thời gian thực!`);
                    } else {
                      showToast("Đã lưu ghi chú cuộc họp thành công!");
                    }
                    setShowNotesModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Lưu Ghi Chú & Đồng Bộ Hồ Sơ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD TASK MODAL */}
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <CheckSquare size={16} className="text-indigo-400" />
                  Giao Task Mới Từ Cuộc Họp ({selectedDossierId})
                </h4>
                <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nội dung công việc</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ví dụ: Lập công văn yêu cầu thanh toán đợt 2"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Người chịu trách nhiệm</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  >
                    <option value="Luật sư Nguyễn Văn A">Luật sư Nguyễn Văn A</option>
                    <option value="Luật sư Lê Hoàn">Luật sư Lê Hoàn</option>
                    <option value="Trợ lý pháp lý Mai">Trợ lý pháp lý Mai</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (newTaskTitle.trim()) {
                        const newT = {
                          id: Date.now(),
                          title: newTaskTitle,
                          due: "28/07/2026",
                          assignee: newTaskAssignee,
                          done: false
                        };
                        setMeetingTasks((prev) => [newT, ...prev]);

                        // Sync to System Calendar events
                        if (setEvents) {
                          const calEvt = {
                            id: "evt-task-" + Date.now(),
                            title: `[Nhiệm vụ Hồ sơ ${selectedDossierId}] ${newTaskTitle}`,
                            date: new Date().toISOString().split("T")[0],
                            startDate: new Date().toISOString().split("T")[0],
                            start: "09:00",
                            startTime: "09:00",
                            end: "10:30",
                            endTime: "10:30",
                            type: "Nhiệm vụ tố tụng",
                            location: "Văn phòng / Hệ thống Quản lý Vụ án",
                            priority: "Cao",
                            allDay: false,
                            reminder: "15_min",
                            notes: `Công việc giao từ phiên họp Hồ sơ ${selectedDossierId}. Khách hàng: ${clientName}. Người phụ trách: ${newTaskAssignee}.`,
                            dossierId: selectedDossierId,
                            clientName: clientName,
                            color: "emerald"
                          };
                          setEvents((prev) => [...prev, calEvt]);
                        }

                        // Sync to consultation_appointments in localStorage
                        const existingAppts = localStorage.getItem("consultation_appointments");
                        let apptList = [];
                        try { apptList = existingAppts ? JSON.parse(existingAppts) : []; } catch (e) { apptList = []; }
                        const newApptItem = {
                          id: `appt-task-${Date.now()}`,
                          dossierId: selectedDossierId,
                          clientName: clientName,
                          phone: "0903123456",
                          category: "Lịch làm việc / Nhiệm vụ vụ án",
                          dateTime: "2026-07-28 09:00",
                          assignedStaff: newTaskAssignee,
                          type: "direct" as const,
                          notes: `[Tự động tạo từ phiên họp] Task: ${newTaskTitle}`,
                          status: "pending" as const
                        };
                        localStorage.setItem("consultation_appointments", JSON.stringify([newApptItem, ...apptList]));
                        window.dispatchEvent(new Event('storage'));

                        setNewTaskTitle("");
                        setShowAddTaskModal(false);
                        showToast(`⚡ Đã tự động ghi nhận công việc & đồng bộ Lịch làm việc cho Hồ sơ ${selectedDossierId} theo thời gian thực!`);
                      }
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Lưu Task & Đồng Bộ Lịch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
