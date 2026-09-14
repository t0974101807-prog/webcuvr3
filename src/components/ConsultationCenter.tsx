import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchApi } from '../utils/api';
import { io } from 'socket.io-client';
import { 
  Phone, PhoneOff, PhoneCall, PhoneIncoming, Search, Clock, Play, Pause,
  Volume2, VolumeX, Mic, MicOff, Settings, Check, RefreshCw, Trash2, X, Plus, Star,
  AlertTriangle, Sliders, Info, CheckCircle, Database, Calendar, FileText, Cpu, User,
  ListFilter, Shield, ArrowRight, MessageSquare, PlusCircle, Headphones, Video, BookOpen,
  Award, Eye, BarChart3, TrendingUp, UserCheck, Activity, Radio, Sparkles
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';

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
  staffRole?: string;
  branch?: string;
  status?: "connected" | "failed" | "no_answer" | "busy";
  transcript?: string;
  isViolated?: boolean;
  violatedKeywords?: string[];
  dossierId?: string;
  dossierTitle?: string;
  category?: string;
  consultationNote?: string;
  qcRating?: string;
  qcNotes?: string;
  qcEvaluator?: string;
}

interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  category: string;
  dateTime: string;
  assignedStaff: string;
  type: "phone" | "direct" | "online";
  notes: string;
  status: "pending" | "completed" | "cancelled";
  dossierId?: string;
}

interface ConsultationCenterProps {
  language: "vi" | "en";
  user?: any;
  records?: any[];
  events?: any[];
  setEvents?: React.Dispatch<React.SetStateAction<any[]>>;
  updateRecords?: (records: any[], changedRecord?: any) => void;
  onNavigateToRecord?: (recordId: string) => void;
  onStartMeeting?: (dossierId?: string, clientName?: string) => void;
}

export default function ConsultationCenter({
  language,
  user,
  records = [],
  events = [],
  setEvents,
  updateRecords,
  onNavigateToRecord,
  onStartMeeting
}: ConsultationCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'calls' | 'notes' | 'appointments'>('calls');
  
  // Storage keys
  const CALL_LOGS_KEY = "yeastar_call_logs_v2";
  const APPOINTMENTS_KEY = "consultation_appointments";

  // State hooks
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // New Appointment Form state
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [newAppt, setNewAppt] = useState({
    dossierId: '',
    clientName: '',
    phone: '',
    category: 'Tư vấn pháp lý Đất đai',
    dateTime: '',
    assignedStaff: user?.name || 'Luật sư Chuyên viên',
    type: 'direct' as 'phone' | 'direct' | 'online',
    notes: ''
  });

  // Softphone & Click to Call state
  const [targetPhone, setTargetPhone] = useState('');
  const [targetName, setTargetName] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<string>('yeastar');
  const [gatewaysList, setGatewaysList] = useState<{ id: string; label: string }[]>([
    { id: 'yeastar', label: 'Yeastar VoIP Gateway' },
    { id: 'synway', label: 'Synway Board' },
    { id: 'grandstream', label: 'Grandstream UCM' },
    { id: 'asterisk', label: 'Asterisk / FreePBX' },
    { id: 'stringee', label: 'Stringee Cloud API' },
    { id: '3cx', label: '3CX Phone System' },
  ]);
  const [showAddGatewayInput, setShowAddGatewayInput] = useState(false);
  const [showGatewayConfig, setShowGatewayConfig] = useState(false);
  const [gatewayConfigs, setGatewayConfigs] = useState<Record<string, { host: string; port: string; extension: string; secret: string; protocol: string }>>({
    yeastar: { host: "192.168.1.100", port: "5060", extension: "101", secret: "••••••••", protocol: "SIP" },
    synway: { host: "synway.lawfirm.vn", port: "5060", extension: "102", secret: "••••••••", protocol: "SIP" },
    grandstream: { host: "ucm.lawfirm.vn", port: "5061", extension: "103", secret: "••••••••", protocol: "TLS" },
    asterisk: { host: "pbx.lawfirm.vn", port: "5060", extension: "104", secret: "••••••••", protocol: "WebRTC" },
    stringee: { host: "api.stringee.com", port: "443", extension: "105", secret: "••••••••", protocol: "WebRTC" },
    '3cx': { host: "3cx.lawfirm.vn", port: "5060", extension: "106", secret: "••••••••", protocol: "SIP" },
  });
  const [customGatewayName, setCustomGatewayName] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCallTime, setActiveCallTime] = useState(0);
  const [callStatusText, setCallStatusText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  
  // Consultation Note during ongoing call
  const [activeConsultationNote, setActiveConsultationNote] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tranh chấp Đất đai');

  // Playback control state
  const [playingLogId, setPlayingLogId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [qcFilter, setQcFilter] = useState<'all' | 'unrated' | 'violated'>('all');

  // QC Evaluation Modal state for leadership/supervisors
  const [selectedQcCall, setSelectedQcCall] = useState<CallLog | null>(null);
  const [qcRatingInput, setQcRatingInput] = useState<string>('5');
  const [qcNotesInput, setQcNotesInput] = useState<string>('');
  const [isSavingQc, setIsSavingQc] = useState(false);

  // Live active calls stream state for real-time supervision
  const [liveCalls, setLiveCalls] = useState<any[]>([]);

  const callTimer = useRef<NodeJS.Timeout | null>(null);

  // Load Calls from API and setup real-time socket connection
  const loadCallsFromApi = async () => {
    try {
      const res = await fetchApi('/api/calls');
      const data = await res.json();
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
      console.error("Error loading calls from API:", e);
    }
  };

  useEffect(() => {
    loadCallsFromApi();

    // Socket.IO real-time updates for leadership & controllers
    let socket: any = null;
    try {
      socket = io({
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000
      });
      socket.on('call_log_updated', () => loadCallsFromApi());
      socket.on('call_ended', () => loadCallsFromApi());
      socket.on('call_deleted', () => loadCallsFromApi());
      socket.on('live_call_status', (activeData: any) => {
        if (activeData) {
          setLiveCalls(prev => {
            const filtered = prev.filter(c => c.phone !== activeData.phone && c.id !== activeData.id);
            if (activeData.status === 'ended') return filtered;
            return [activeData, ...filtered];
          });
        }
      });
    } catch (e) {
      console.error("Socket connect error in ConsultationCenter:", e);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Initializing Data (Fallback & Appointments mapping real system records)
  useEffect(() => {
    // Helper to generate seed call logs from actual system records
    const seedRealCallLogsFromRecords = (): CallLog[] => {
      if (!records || records.length === 0) {
        return [
          {
            id: "call-seed-hs001",
            dossierId: "HS-2026-001",
            dossierTitle: "Tranh chấp hợp đồng dịch vụ",
            name: "Công ty TNHH ABC",
            phone: "0903123456",
            type: "outgoing",
            duration: 245,
            timestamp: "10:30 - 25/07/2026",
            hasRecording: true,
            staffName: "Luật sư Nguyễn Văn A",
            status: "connected",
            category: "Tranh chấp Hợp đồng",
            consultationNote: "Biên bản tư vấn vi phạm nghĩa vụ thanh toán đợt 1 hợp đồng dịch vụ. Đã đề xuất phương án thương lượng gửi công văn cảnh báo.",
            transcript: "Luật sư: Dạ chào đại diện Công ty TNHH ABC. Tôi gọi để thống nhất phương án gửi công văn yêu cầu thanh toán đợt 1 cho đối tác.\nKhách hàng: Nhờ Luật sư làm gấp giúp tôi, bên kia đang trễ hạn 15 ngày rồi.\nLuật sư: Vâng, tôi đã hoàn thiện dự thảo công văn và sẽ gửi anh/chị duyệt ngay trong ngày.",
            qcRating: "5",
            qcEvaluator: "Hệ thống AI Copilot"
          },
          {
            id: "call-seed-dn003",
            dossierId: "DN003",
            dossierTitle: "Tư vấn sáp nhập doanh nghiệp",
            name: "Nguyễn Văn B (Cty Nam Á)",
            phone: "0912345678",
            type: "incoming",
            duration: 310,
            timestamp: "14:15 - 24/07/2026",
            hasRecording: true,
            staffName: "Luật sư Lê Hoàn",
            status: "connected",
            category: "Tư vấn Doanh nghiệp",
            consultationNote: "Biên bản tư vấn quy trình sáp nhập M&A và thẩm định rủi ro pháp lý tài sản công ty bị sáp nhập.",
            transcript: "Khách hàng: Chào Luật sư, hồ sơ rà soát pháp lý dự án sáp nhập công ty C tiến triển thế nào rồi?\nLuật sư: Báo cáo anh, đội ngũ pháp lý đã thẩm định xong danh mục hợp đồng hiện hữu và chưa phát hiện nợ xấu tiềm ẩn.",
            qcRating: "5",
            qcEvaluator: "Trưởng ban Pháp chế"
          }
        ];
      }
      return records.slice(0, 6).map((r, idx) => ({
        id: `call-log-${r.id}`,
        dossierId: r.id,
        dossierTitle: r.title || r.category || "Hồ sơ vụ việc",
        name: r.client || r.clientName || `Khách hàng Hồ sơ ${r.id}`,
        phone: r.phone || `090${Math.floor(1000000 + idx * 88888)}`,
        type: idx % 2 === 0 ? "outgoing" : "incoming",
        duration: 180 + idx * 45,
        timestamp: `${10 + idx}:${15 + idx * 5} - 25/07/2026`,
        hasRecording: true,
        staffName: r.mainAssignee || "Luật sư Nguyễn Văn A",
        status: "connected",
        category: r.category || "Tư vấn Pháp lý",
        consultationNote: r.summary || `Biên bản tư vấn thực tế cho Hồ sơ ${r.id} (${r.title || 'Hồ sơ hệ thống'}). Đã rà soát rủi ro và thống nhất phương án xử lý với khách hàng.`,
        transcript: `Luật sư: Chào anh/chị đại diện ${r.client || 'khách hàng'}. Tôi gọi điện để trao đổi phương án xử lý tiếp theo cho Hồ sơ ${r.id}.\nKhách hàng: Cảm ơn luật sư, bên tôi rất mong nhận được văn bản tư vấn chính thức.`,
        qcRating: "5",
        qcEvaluator: "AI Audit System"
      }));
    };

    // Helper to generate seed appointments from actual system records
    const seedRealApptsFromRecords = (): Appointment[] => {
      if (!records || records.length === 0) {
        return [
          {
            id: "appt-seed-1",
            dossierId: "HS-2026-001",
            clientName: "Công ty TNHH ABC",
            phone: "0903123456",
            category: "Tranh chấp Hợp đồng",
            dateTime: "2026-07-27 09:30",
            assignedStaff: "Luật sư Nguyễn Văn A",
            type: "online",
            notes: "Phòng họp trực tuyến Video Meeting thảo luận phương án hòa giải tranh chấp đợt 1.",
            status: "pending"
          },
          {
            id: "appt-seed-2",
            dossierId: "DN003",
            clientName: "Nguyễn Văn B (Cty Nam Á)",
            phone: "0912345678",
            category: "Doanh nghiệp & Đầu tư",
            dateTime: "2026-07-28 14:00",
            assignedStaff: "Luật sư Lê Hoàn",
            type: "direct",
            notes: "Gặp trực tiếp tại Văn phòng Trụ sở chính ký kết Hợp đồng dịch vụ tư vấn M&A.",
            status: "pending"
          }
        ];
      }
      return records.slice(0, 6).map((r, idx) => ({
        id: `appt-rec-${r.id}`,
        dossierId: r.id,
        clientName: r.client || r.clientName || `Khách hàng ${r.id}`,
        phone: r.phone || `091${Math.floor(2000000 + idx * 77777)}`,
        category: r.category || "Tư vấn Pháp lý",
        dateTime: `2026-07-${26 + (idx % 4)} ${9 + idx}:30`,
        assignedStaff: r.mainAssignee || "Luật sư Nguyễn Văn A",
        type: idx % 2 === 0 ? "online" : "direct",
        notes: `Lịch hẹn tư vấn và báo cáo tiến độ xử lý trực tiếp cho Hồ sơ ${r.id} (${r.title || 'Hồ sơ vụ việc'}).`,
        status: "pending"
      }));
    };

    // 1. Setup Live Call Logs Real-time sync via Firestore
    if (db && (db as any).isMock) {
      console.warn("Skipping real-time Firestore listeners in ConsultationCenter because database is in mock fallback mode.");
      return;
    }

    const unsubCalls = onSnapshot(collection(db, 'voip_calls'), (snapshot) => {
      if (!snapshot.empty) {
        const list: CallLog[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            name: data.name,
            phone: data.phone,
            type: data.type,
            duration: Number(data.duration || 0),
            timestamp: data.timestamp,
            hasRecording: Boolean(data.hasRecording),
            recordingUrl: data.recordingUrl,
            staffName: data.staffName,
            staffRole: data.staffRole,
            branch: data.branch,
            status: data.status,
            transcript: data.transcript,
            isViolated: Boolean(data.isViolated),
            dossierId: data.dossierId,
            dossierTitle: data.dossierTitle,
            category: data.category,
            consultationNote: data.consultationNote,
            qcRating: data.qcRating,
            qcNotes: data.qcNotes,
            qcEvaluator: data.qcEvaluator
          });
        });
        // Sort descending
        list.sort((a, b) => b.id.localeCompare(a.id));
        setCallLogs(list);
        localStorage.setItem(CALL_LOGS_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event('storage'));
      } else {
        setCallLogs([]);
        localStorage.setItem(CALL_LOGS_KEY, JSON.stringify([]));
        window.dispatchEvent(new Event('storage'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'voip_calls');
    });

    // 2. Setup Live Appointments Real-time sync via Firestore
    const unsubAppts = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      if (!snapshot.empty) {
        const list: Appointment[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            clientName: data.clientName,
            phone: data.phone,
            category: data.category,
            dateTime: data.dateTime,
            assignedStaff: data.assignedStaff,
            type: data.type,
            notes: data.notes,
            status: data.status,
            dossierId: data.dossierId
          });
        });
        // Sort descending
        list.sort((a, b) => b.id.localeCompare(a.id));
        setAppointments(list);
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event('storage'));
      } else {
        setAppointments([]);
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
        window.dispatchEvent(new Event('storage'));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    });

    return () => {
      unsubCalls();
      unsubAppts();
    };
  }, [user, records]);

  // Sync call logs to Firestore
  const saveCallLogs = async (updatedLogs: CallLog[]) => {
    if (updatedLogs.length > 0) {
      const latestLog = updatedLogs[0];
      try {
        await setDoc(doc(db, 'voip_calls', latestLog.id), latestLog);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `voip_calls/${latestLog.id}`);
      }
    }
  };

  // Sync appointments to Firestore
  const saveAppointments = async (updatedAppts: Appointment[]) => {
    if (updatedAppts.length > 0) {
      const newOrChanged = updatedAppts.find(a => {
        const existing = appointments.find(e => e.id === a.id);
        return !existing || JSON.stringify(existing) !== JSON.stringify(a);
      });
      if (newOrChanged) {
        try {
          await setDoc(doc(db, 'appointments', newOrChanged.id), newOrChanged);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `appointments/${newOrChanged.id}`);
        }
      }
    }
  };

  const deleteAppointmentFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
    }
  };

  // Click to Call simulation
  const handleInitiateCall = (phone: string, name: string) => {
    if (!phone) return;
    setTargetPhone(phone);
    setTargetName(name || "Khách hàng chưa rõ danh tính");
    setIsDialing(true);
    setIsCallActive(false);
    setActiveCallTime(0);
    setLiveTranscript([]);
    setActiveConsultationNote('');
    setCallStatusText(language === 'vi' ? 'Đang kết nối tổng đài...' : 'Connecting gateway...');

    // Clear previous timers
    if (callTimer.current) clearInterval(callTimer.current);

    // Simulate dialing connection in 2 seconds
    setTimeout(() => {
      setIsDialing(false);
      setIsCallActive(true);
      setCallStatusText(language === 'vi' ? 'Đã kết nối - Đang đàm thoại & Ghi âm' : 'Connected - Recording active');
      
      const transcripts = [
        "Nhân viên: Kính chào quý khách, tôi có thể hỗ trợ gì cho anh/chị hôm nay ạ?",
        `Khách hàng: Chào bạn, tôi đang có thắc mắc liên quan đến vấn đề ${activeCategory.toLowerCase()}.`,
        "Nhân viên: Dạ vâng, quý khách vui lòng mô tả chi tiết sự việc, thời gian xảy ra và các giấy tờ hiện có để tôi ghi nhận.",
        "Khách hàng: Sự việc xảy ra từ đầu năm nay, tôi đã có biên bản hòa giải cấp cơ sở nhưng không thành, đối phương vẫn tiếp tục lấn chiếm đất.",
        "Nhân viên: Dạ tôi hiểu rồi, trường hợp này biên bản hòa giải cơ sở không thành là điều kiện bắt buộc để khởi kiện tranh chấp quyền sử dụng đất ra Tòa án nhân dân cấp huyện nơi có đất."
      ];

      let step = 0;
      setLiveTranscript([transcripts[0]]);

      callTimer.current = setInterval(() => {
        setActiveCallTime(prev => {
          const nextSec = prev + 1;
          // Stagger transcript lines based on call duration
          if (nextSec % 8 === 0 && step < transcripts.length - 1) {
            step++;
            setLiveTranscript(t => [...t, transcripts[step]]);
          }
          return nextSec;
        });
      }, 1000);
    }, 2000);
  };

  // End active call
  const handleEndCall = () => {
    if (callTimer.current) {
      clearInterval(callTimer.current);
      callTimer.current = null;
    }
    setIsCallActive(false);
    setIsDialing(false);

    // Generate call log record
    if (targetPhone) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      
      const newLog: CallLog = {
        id: `call-custom-${Date.now()}`,
        name: targetName || "Khách hàng mới",
        phone: targetPhone,
        type: "outgoing",
        duration: activeCallTime || 12,
        timestamp: timeStr,
        hasRecording: true,
        staffName: user?.name || "Luật sư Chuyên viên",
        staffRole: user?.role || "Chuyên viên",
        branch: user?.branch || "Trụ sở chính",
        status: "connected",
        category: activeCategory,
        consultationNote: activeConsultationNote || "Khách hàng gọi điện trao đổi thông tin tư vấn sơ bộ về vụ việc đất đai/hợp đồng.",
        transcript: liveTranscript.join("\n")
      };

      const updatedLogs = [newLog, ...callLogs];
      saveCallLogs(updatedLogs);

      // Save call to central SQLite DB & emit real-time socket event
      try {
        fetchApi('/api/calls', {
          method: 'POST',
          body: JSON.stringify(newLog)
        }).then(() => loadCallsFromApi()).catch(e => console.error("Save call API err:", e));

        fetchApi('/api/calls/active', {
          method: 'POST',
          body: JSON.stringify({ ...newLog, status: 'ended' })
        }).catch(e => {});
      } catch (e) {}

      // Auto add to customers list if they don't exist
      addPhoneToCRM(targetPhone, targetName);
    }

    setTargetPhone('');
    setTargetName('');
    setActiveCallTime(0);
  };

  // QC Rating Evaluation Save Handler for Leadership & Controllers
  const handleSaveQcEvaluation = async () => {
    if (!selectedQcCall) return;
    setIsSavingQc(true);
    try {
      const updatedData = {
        qcRating: qcRatingInput,
        qcNotes: qcNotesInput,
        qcEvaluator: user?.name || "Kiểm soát viên chất lượng"
      };

      await fetchApi(`/api/calls/${selectedQcCall.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });

      // Update Firestore
      try {
        await updateDoc(doc(db, 'voip_calls', selectedQcCall.id), updatedData);
      } catch (err) {
        console.error("Firestore QC update error:", err);
      }

      // Update local state
      setCallLogs(prev => prev.map(c => c.id === selectedQcCall.id ? { ...c, ...updatedData } : c));
      setSelectedQcCall(null);
      await loadCallsFromApi();
    } catch (e) {
      console.error("Save QC error:", e);
    } finally {
      setIsSavingQc(false);
    }
  };

  const addPhoneToCRM = async (phone: string, name: string) => {
    try {
      // Simulate adding to CRM database if backend route exists
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        const exists = data.some((c: any) => c.phone === phone);
        if (!exists) {
          await fetch("/api/users", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: phone,
              name: name || "Khách hàng mới từ cuộc gọi",
              password: `Pass_${phone}`,
              role: "client",
              phone: phone
            })
          });
        }
      }
    } catch (e) {
      console.error("CRM sync failed", e);
    }
  };

  // AI Summary generator simulation (using current active call state)
  const handleTriggerAISummary = () => {
    if (!activeConsultationNote) {
      const summaryText = `🤖 TỔNG HỢP BIÊN BẢN TƯ VẤN AI:
- Chủ đề: Tư vấn giải quyết tranh chấp ${activeCategory.toLowerCase()}.
- Tóm tắt hội thoại: Khách hàng phản ánh vụ việc tranh chấp đất đai kéo dài, đã có biên bản hòa giải xã không thành.
- Hướng xử lý: Đủ điều kiện thụ lý đơn khởi kiện tại Tòa án cấp Huyện. Yêu cầu chuẩn bị hồ sơ gồm đơn khởi kiện, CCCD, sổ đỏ bản sao và biên bản hòa giải cơ sở.`;
      setActiveConsultationNote(summaryText);
    }
  };

  // Mock Audio playback
  const handleTogglePlay = (logId: string) => {
    if (playingLogId === logId) {
      // Pause
      setPlayingLogId(null);
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    } else {
      // Play
      setPlayingLogId(logId);
      setPlaybackProgress(0);
      if (playbackTimer.current) clearInterval(playbackTimer.current);

      playbackTimer.current = setInterval(() => {
        setPlaybackProgress(p => {
          if (p >= 100) {
            setPlayingLogId(null);
            if (playbackTimer.current) clearInterval(playbackTimer.current);
            return 0;
          }
          return p + 4;
        });
      }, 250);
    }
  };

  // Create new appointment
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.clientName || !newAppt.phone || !newAppt.dateTime) return;

    const newApp: Appointment = {
      id: `appt-${Date.now()}`,
      dossierId: newAppt.dossierId || undefined,
      clientName: newAppt.clientName,
      phone: newAppt.phone,
      category: newAppt.category,
      dateTime: newAppt.dateTime.replace('T', ' '),
      assignedStaff: newAppt.assignedStaff,
      type: newAppt.type,
      notes: newAppt.notes,
      status: "pending"
    };

    const updated = [newApp, ...appointments];
    saveAppointments(updated);

    // Synchronize to System Calendar events if setEvents is available
    if (setEvents) {
      const datePart = newAppt.dateTime.split("T")[0] || new Date().toISOString().split("T")[0];
      const timePart = newAppt.dateTime.split("T")[1] || "09:00";
      const calEvent = {
        id: "evt-appt-" + Date.now(),
        title: `[Lịch hẹn tư vấn${newAppt.dossierId ? ` ${newAppt.dossierId}` : ''}] ${newAppt.clientName} - ${newAppt.category}`,
        date: datePart,
        startDate: datePart,
        start: timePart,
        startTime: timePart,
        end: "10:30",
        endTime: "10:30",
        type: "Họp tư vấn",
        location: newAppt.type === "online" ? "Phòng họp trực tuyến Video Meeting" : "Văn phòng Luật",
        priority: "Cao",
        allDay: false,
        reminder: "15_min",
        notes: `Khách hàng: ${newAppt.clientName}. SĐT: ${newAppt.phone}. Chuyên viên: ${newAppt.assignedStaff}. Ghi chú: ${newAppt.notes}`,
        dossierId: newAppt.dossierId,
        clientName: newAppt.clientName,
        color: "indigo",
        icon: "Calendar"
      };
      setEvents(prev => [...prev, calEvent]);
    }
    
    // Dispatch storage event to keep softphone and calendar synced
    window.dispatchEvent(new Event('storage'));

    // Clear & close form
    setNewAppt({
      dossierId: '',
      clientName: '',
      phone: '',
      category: 'Tư vấn pháp lý Đất đai',
      dateTime: '',
      assignedStaff: user?.name || 'Luật sư Chuyên viên',
      type: 'direct',
      notes: ''
    });
    setShowAddAppointment(false);
  };

  // Delete an appointment
  const handleDeleteAppointment = async (id: string) => {
    if (confirm(language === 'vi' ? "Bạn có chắc muốn xóa lịch hẹn này?" : "Are you sure you want to delete this appointment?")) {
      await deleteAppointmentFromFirestore(id);
    }
  };

  // Complete/Update status of appointment
  const handleToggleApptStatus = async (id: string, status: "pending" | "completed" | "cancelled") => {
    const apptToUpdate = appointments.find(a => a.id === id);
    if (apptToUpdate) {
      await saveAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  // Filtered lists
  const filteredLogs = useMemo(() => {
    return callLogs.filter(log => {
      const matchSearch = 
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.phone.includes(searchQuery) ||
        (log.consultationNote && log.consultationNote.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCat = categoryFilter === 'all' || log.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [callLogs, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Consultation Dashboard Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 translate-y-2">
          <Headphones size={200} className="text-white" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-bold flex items-center gap-2.5">
              <Headphones className="text-blue-400 shrink-0" size={24} />
              <span>{language === "vi" ? "Trung tâm Tư vấn Đa kênh" : "Omnichannel Consultation Center"}</span>
              <span className="bg-blue-500/20 text-blue-400 border border-blue-400/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full font-mono">
                AI platform ready
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {language === 'vi' 
                ? 'Điều hợp hội thoại trực tiếp qua Yeastar Softphone và bảng mạch Synway Analog, tự động hóa ghi biên bản tư vấn, xử lý chuyển đổi âm thanh thành văn bản (STT) và tối ưu hóa bằng mô hình trí tuệ nhân tạo Gemini AI.'
                : 'Orchestrating phone and physical consultations via Yeastar and Synway gateways. Featuring automated recording, transcription, AI legal summarization, and direct CRM intake integration.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              Yeastar Extension {user?.extension || "101"}
            </div>
            <div className="bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold font-mono">
              <Database size={13} />
              Synway Channel: Active
            </div>
          </div>
        </div>

        {/* Dynamic Consultation Center Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{language === 'vi' ? 'Tổng tư vấn / ghi âm' : 'Total Consults'}</span>
            <span className="text-xl font-bold text-white mt-1 block">{callLogs.length}</span>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{language === 'vi' ? 'Lịch hẹn sắp tới' : 'Pending Bookings'}</span>
            <span className="text-xl font-bold text-blue-400 mt-1 block">
              {appointments.filter(a => a.status === 'pending').length}
            </span>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{language === 'vi' ? 'Tỉ lệ tuân thủ AI' : 'AI Compliance Rate'}</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">100%</span>
          </div>
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{language === 'vi' ? 'Giải pháp' : 'Dynamic Solution'}</span>
            <span className="text-xs font-semibold text-amber-300 mt-1 block truncate">Yeastar + Synway</span>
          </div>
        </div>
      </div>

      {/* Sub tabs Selector */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('calls')}
          className={`pb-3 font-serif font-bold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'calls' 
              ? 'text-indigo-950 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-indigo-950 border-b-2 border-transparent'
          }`}
        >
          <PhoneCall size={16} />
          <span>{language === 'vi' ? 'Giao diện gọi điện & Dialer' : 'Softphone & Click to Call'}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('notes')}
          className={`pb-3 font-serif font-bold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'notes' 
              ? 'text-indigo-950 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-indigo-950 border-b-2 border-transparent'
          }`}
        >
          <FileText size={16} />
          <span>{language === 'vi' ? 'Biên bản tư vấn & Ghi âm' : 'Consultation Logs'}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('appointments')}
          className={`pb-3 font-serif font-bold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'appointments' 
              ? 'text-indigo-950 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-indigo-950 border-b-2 border-transparent'
          }`}
        >
          <Calendar size={16} />
          <span>{language === 'vi' ? 'Đặt lịch hẹn & Lịch tư vấn' : 'Appointments Scheduler'}</span>
        </button>
      </div>

      {/* Active Tab Contents */}
      {activeSubTab === 'calls' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Softphone Dialer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <h3 className="font-serif font-bold text-slate-800 text-base mb-1">{language === 'vi' ? 'Quay số & Click To Call' : 'Quick Dialer'}</h3>
              <p className="text-xs text-slate-500">{language === 'vi' ? 'Kích hoạt cuộc gọi trực tiếp từ hệ thống' : 'Trigger outgoing calls instantly'}</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">{language === 'vi' ? 'Cổng kết nối thoại' : 'VoIP Gateway'}</label>
                  <button
                    type="button"
                    onClick={() => setShowAddGatewayInput(!showAddGatewayInput)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-all"
                  >
                    <Plus size={12} />
                    {language === 'vi' ? 'Thêm cổng mới' : 'Add Gateway'}
                  </button>
                </div>

                {showAddGatewayInput && (
                  <div className="mb-2 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                    <p className="text-[11px] font-bold text-indigo-900">{language === 'vi' ? 'Thêm cổng kết nối thoại mới:' : 'Add custom VoIP Gateway:'}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customGatewayName}
                        onChange={(e) => setCustomGatewayName(e.target.value)}
                        placeholder={language === 'vi' ? 'Ví dụ: Cisco CallManager' : 'e.g., Cisco CallManager'}
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-indigo-200 outline-none focus:border-indigo-500 font-medium bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customGatewayName.trim()) return;
                          const id = 'gw_' + Date.now();
                          const newGw = { id, label: customGatewayName.trim() };
                          setGatewaysList(prev => [...prev, newGw]);
                          setSelectedGateway(id);
                          setCustomGatewayName('');
                          setShowAddGatewayInput(false);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
                      >
                        {language === 'vi' ? 'Lưu' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <select
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold text-slate-800 bg-slate-50/50 cursor-pointer appearance-none pr-9"
                  >
                    {gatewaysList.map(gw => (
                      <option key={gw.id} value={gw.id}>
                        {gw.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Sliders size={14} />
                  </span>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowGatewayConfig(!showGatewayConfig)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg w-full justify-center transition-all border border-indigo-100"
                  >
                    <Sliders size={14} />
                    {showGatewayConfig 
                      ? (language === 'vi' ? 'Ẩn cấu hình cổng này' : 'Hide Gateway Config')
                      : (language === 'vi' ? `⚙️ Cấu hình thông số kỹ thuật cho ${gatewaysList.find(g => g.id === selectedGateway)?.label || 'Tổng đài'}` : '⚙️ Configure VoIP Gateway Credentials')}
                  </button>

                  {showGatewayConfig && (
                    <div className="mt-3 p-3.5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-amber-400 font-mono">
                          {gatewaysList.find(g => g.id === selectedGateway)?.label || 'Cổng kết nối PBX'}
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                          SIP Live Gateway
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block font-semibold">IP Server / Host Domain</label>
                          <input
                            type="text"
                            value={gatewayConfigs[selectedGateway]?.host || "192.168.1.100"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGatewayConfigs(prev => ({
                                ...prev,
                                [selectedGateway]: { ...(prev[selectedGateway] || { port: "5060", extension: "101", secret: "••••••••", protocol: "SIP" }), host: val }
                              }));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs font-mono font-bold focus:border-amber-400 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block font-semibold">Port SIP / WSS</label>
                          <input
                            type="text"
                            value={gatewayConfigs[selectedGateway]?.port || "5060"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGatewayConfigs(prev => ({
                                ...prev,
                                [selectedGateway]: { ...(prev[selectedGateway] || { host: "192.168.1.100", extension: "101", secret: "••••••••", protocol: "SIP" }), port: val }
                              }));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs font-mono font-bold focus:border-amber-400 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block font-semibold">Số máy lẻ (SIP Ext)</label>
                          <input
                            type="text"
                            value={gatewayConfigs[selectedGateway]?.extension || "101"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGatewayConfigs(prev => ({
                                ...prev,
                                [selectedGateway]: { ...(prev[selectedGateway] || { host: "192.168.1.100", port: "5060", secret: "••••••••", protocol: "SIP" }), extension: val }
                              }));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs font-mono font-bold focus:border-amber-400 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block font-semibold">Giao thức (Protocol)</label>
                          <select
                            value={gatewayConfigs[selectedGateway]?.protocol || "SIP"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setGatewayConfigs(prev => ({
                                ...prev,
                                [selectedGateway]: { ...(prev[selectedGateway] || { host: "192.168.1.100", port: "5060", extension: "101", secret: "••••••••" }), protocol: val }
                              }));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs font-mono font-bold focus:border-amber-400 outline-none cursor-pointer"
                          >
                            <option value="SIP">SIP (UDP/TCP)</option>
                            <option value="WebRTC">WebRTC (WSS)</option>
                            <option value="TLS">SIP TLS (Secure)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const cfg = gatewayConfigs[selectedGateway] || { host: "192.168.1.100", port: "5060" };
                            alert(`🔌 Kết nối thành công đến tổng đài [${gatewaysList.find(g => g.id === selectedGateway)?.label}]\nHost: ${cfg.host}:${cfg.port}\nTrạng thái: ONLINE (8ms latency)`);
                          }}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all text-center"
                        >
                          🔌 Test Kết Nối
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert(`💾 Đã lưu thành công thông số cấu hình tổng đài [${gatewaysList.find(g => g.id === selectedGateway)?.label}]!`);
                            setShowGatewayConfig(false);
                          }}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all text-center"
                        >
                          💾 Lưu Cấu Hình
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Tên khách hàng / Lead' : 'Client Name'}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder={language === 'vi' ? 'Ví dụ: Nguyễn Văn B' : 'e.g., Jane Smith'}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-medium"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={14} />
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Số điện thoại gọi đến' : 'Phone Number'}</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder={language === 'vi' ? 'Ví dụ: 0912345678' : 'e.g., +84912345678'}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone size={14} />
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Lĩnh vực tư vấn' : 'Consulting Domain'}</label>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 outline-none bg-white font-semibold"
                >
                  <option value="Tranh chấp Đất đai">{language === 'vi' ? 'Tranh chấp Đất đai' : 'Land Dispute'}</option>
                  <option value="Hợp đồng thương mại">{language === 'vi' ? 'Hợp đồng Thương mại' : 'Commercial Contract'}</option>
                  <option value="Thừa kế di sản">{language === 'vi' ? 'Thừa kế & Di sản' : 'Inheritance & Wills'}</option>
                  <option value="Hôn nhân gia đình">{language === 'vi' ? 'Hôn nhân & Gia đình' : 'Marriage & Family'}</option>
                  <option value="Pháp lý doanh nghiệp">{language === 'vi' ? 'Doanh nghiệp & Đầu tư' : 'Corporate & Investment'}</option>
                </select>
              </div>

              {/* Action dial trigger */}
              {!isCallActive && !isDialing ? (
                <button
                  type="button"
                  onClick={() => handleInitiateCall(targetPhone, targetName)}
                  disabled={!targetPhone}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 text-white shadow-md transition-all cursor-pointer ${
                    targetPhone ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01]' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <PhoneCall size={15} />
                  {language === 'vi' ? 'KÍCH HOẠT CLICK TO CALL' : 'TRIGGER CLICK TO CALL'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <PhoneOff size={15} />
                  {language === 'vi' ? 'GÁC MÁY / KẾT THÚC' : 'HANG UP / END CALL'}
                </button>
              )}
            </div>
          </div>

          {/* Right Area: Interactive Active Call Panel / Status (2 columns span) */}
          <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-lg space-y-5 relative transition-all ${
            isCallActive || isDialing 
              ? 'bg-slate-900 text-slate-100 border-slate-800' 
              : 'bg-gradient-to-br from-slate-50 via-indigo-50/20 to-blue-50/10 text-slate-800 border-slate-200'
          }`}>
            {/* Softphone status banner */}
            <div className={`flex items-center justify-between border-b pb-4 ${
              isCallActive || isDialing ? 'border-slate-800' : 'border-slate-200/80'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  isCallActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : isDialing 
                      ? 'bg-amber-500/10 text-amber-400 animate-pulse' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                }`}>
                  <Headphones size={20} className={isCallActive ? 'animate-bounce' : ''} />
                </div>
                <div>
                  <h4 className={`font-serif font-bold text-sm ${isCallActive || isDialing ? 'text-white' : 'text-slate-900'}`}>
                    {isCallActive ? (language === 'vi' ? 'Đàm thoại Trực tiếp' : 'Live Call Active') : isDialing ? (language === 'vi' ? 'Đang gọi...' : 'Dialing...') : (language === 'vi' ? 'Sẵn sàng tiếp nhận cuộc gọi' : 'Softphone Ready')}
                  </h4>
                  <p className={`text-[11px] font-mono font-medium ${isCallActive || isDialing ? 'text-slate-400' : 'text-slate-500'}`}>
                    IP:{user?.extension || "101"} @ PBX.HOST.LAW • Gateway: <span className="uppercase font-bold text-indigo-600">{selectedGateway}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isCallActive && !isDialing && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sẵn sàng (Rảnh)
                  </span>
                )}
                {isCallActive && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-mono text-sm text-red-400 font-bold">
                      {Math.floor(activeCallTime / 60).toString().padStart(2, '0')}:{(activeCallTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Interactive Screen */}
            {!isCallActive && !isDialing ? (
              <div className="space-y-4">
                {/* Upper Row: Interactive Quick Dial Numpad + Customer CRM Card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Column 1: Interactive Softphone Numpad (5 cols) */}
                  <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Phone size={14} className="text-indigo-600" />
                        {language === 'vi' ? 'Bàn Phím Quay Số Nhanh (Numpad)' : 'Quick Dial Numpad'}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">SIP READY</span>
                    </div>

                    {/* Phone Display Input */}
                    <div className="mb-3 relative">
                      <input
                        type="text"
                        value={targetPhone}
                        onChange={(e) => setTargetPhone(e.target.value)}
                        placeholder={language === 'vi' ? 'Nhập số hoặc bấm phím...' : 'Enter number or tap keys...'}
                        className="w-full text-base font-mono font-bold px-3 py-2 bg-slate-900 text-cyan-400 rounded-lg outline-none text-center tracking-wider"
                      />
                      {targetPhone && (
                        <button
                          type="button"
                          onClick={() => setTargetPhone(prev => prev.slice(0, -1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-xs font-mono font-bold"
                          title="Xóa"
                        >
                          ⌫
                        </button>
                      )}
                    </div>

                    {/* 3x4 Numpad Grid */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTargetPhone(prev => prev + num)}
                          className="py-2 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white font-mono font-extrabold text-sm text-slate-800 transition-all active:scale-95 shadow-2xs cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    {/* Quick Call Action Button */}
                    <button
                      type="button"
                      onClick={() => handleInitiateCall(targetPhone || "0903123456", targetName || "Khách hàng Hotline")}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <PhoneCall size={14} />
                      {language === 'vi' ? 'Gọi Ngay qua Yeastar Trunk' : 'Call via Yeastar Trunk'}
                    </button>
                  </div>

                  {/* Column 2: Live Client CRM Card & AI Prompt (7 cols) */}
                  <div className="md:col-span-7 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <User size={14} className="text-indigo-600" />
                          {language === 'vi' ? 'Thông tin Khách hàng / Lead CRM' : 'Client CRM Profile'}
                        </span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">
                          Đồng bộ Realtime
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">{language === 'vi' ? 'Tên đối tác:' : 'Partner:'}</span>
                          <span className="font-bold text-slate-800">{targetName || "Công ty TNHH Nam Á (Anh B)"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">{language === 'vi' ? 'Số điện thoại:' : 'Phone:'}</span>
                          <span className="font-mono font-bold text-indigo-600">{targetPhone || "0912345678"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">{language === 'vi' ? 'Hồ sơ thụ lý:' : 'Dossier:'}</span>
                          <span className="font-bold text-emerald-600">HS-2026-003 (Tranh chấp M&A)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">{language === 'vi' ? 'Luật sư phụ trách:' : 'Attorney:'}</span>
                          <span className="font-bold text-purple-700">Luật sư Nguyễn Văn A</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick AI Script / Legal Reference Guide */}
                    <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                      <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 mb-1">
                        <Sparkles size={13} className="text-indigo-600" />
                        {language === 'vi' ? 'Gợi ý Kịch bản Tư vấn Trực tuyến (AI Assist):' : 'AI Consultation Script Guide:'}
                      </p>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        • Mở đầu bằng lời chào chuẩn Luật sư hãng luật.<br />
                        • Lắng nghe mâu thuẫn ranh giới đất / vi phạm nghĩa vụ hợp đồng.<br />
                        • Đề xuất gửi tài liệu qua Zalo / Email chính thức để thẩm định hồ sơ.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Lower Row: Recent Calls Log Feed Table */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <PhoneIncoming size={14} className="text-emerald-600" />
                      {language === 'vi' ? 'Lịch sử Cuộc gọi Gần đây & Yêu cầu Tư vấn Mới' : 'Recent Incoming Calls & Lead Feed'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{callLogs.length} cuộc gọi đã ghi nhận</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2 px-2">Thời gian</th>
                          <th className="py-2 px-2">Khách hàng</th>
                          <th className="py-2 px-2">Số điện thoại</th>
                          <th className="py-2 px-2 text-center">Thời lượng</th>
                          <th className="py-2 px-2 text-center">Tình trạng</th>
                          <th className="py-2 px-2 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {callLogs.slice(0, 4).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-2 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                            <td className="py-2 px-2 font-bold text-slate-800">{log.name}</td>
                            <td className="py-2 px-2 font-mono text-indigo-600 font-bold">{log.phone}</td>
                            <td className="py-2 px-2 text-center font-mono text-slate-600">{Math.floor(log.duration / 60)}m {log.duration % 60}s</td>
                            <td className="py-2 px-2 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Đã ghi âm (STT)
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetName(log.name);
                                  setTargetPhone(log.phone);
                                  handleInitiateCall(log.phone, log.name);
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold text-[10px] rounded transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <PhoneCall size={10} /> Gọi lại
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Live Transcript / Speech To Text (RAG) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col h-80 justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block border-b border-slate-800 pb-2 mb-3 flex items-center gap-1">
                      <Cpu size={12} className="animate-spin" />
                      {language === 'vi' ? 'Văn bản thoại Chuyển đổi (STT) & Phân tích AI' : 'Live Speech To Text & Compliance'}
                    </span>
                    <div className="space-y-3 overflow-y-auto max-h-56 pr-1 text-xs">
                      {liveTranscript.map((line, idx) => {
                        const isStaff = line.startsWith("Nhân viên");
                        return (
                          <div key={idx} className={`p-2 rounded-lg leading-relaxed ${isStaff ? 'bg-indigo-950/40 text-indigo-200 border-l-2 border-indigo-500' : 'bg-slate-800 text-slate-100'}`}>
                            {line}
                          </div>
                        );
                      })}
                      {isDialing && (
                        <div className="text-amber-400 font-mono text-xs animate-pulse">
                          &gt;&gt; Connecting Yeastar Trunk Gateway via port 8088...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isCallActive && (
                    <div className="text-[10px] text-slate-500 italic mt-2 flex items-center gap-1 border-t border-slate-800 pt-2">
                      <CheckCircle size={10} className="text-emerald-500" />
                      {language === 'vi' ? 'AI đã sẵn sàng tự động lập biên bản tư vấn' : 'Compliance validation running'}
                    </div>
                  )}
                </div>

                {/* Live Consultation Note / Notes Center */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'vi' ? 'Nhập ghi chú tư vấn pháp lý' : 'Active Consultation Note'}</span>
                    <button
                      type="button"
                      onClick={handleTriggerAISummary}
                      className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Cpu size={10} />
                      AI Summary
                    </button>
                  </div>
                  <textarea
                    value={activeConsultationNote}
                    onChange={(e) => setActiveConsultationNote(e.target.value)}
                    placeholder={language === 'vi' ? 'Nhập ghi chép nội dung tư vấn của khách hàng tại đây (địa chỉ đất đai, ranh giới, giá trị tranh chấp, ý kiến luật sư, tài liệu cần thu thập...)' : 'Write case notes, advice provided, customer documents required here...'}
                    className="w-full text-xs p-3.5 h-64 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100 outline-none font-sans"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consultation notes and recordings list */}
      {activeSubTab === 'notes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-slate-800 text-base mb-1">{language === 'vi' ? 'Kho dữ liệu biên bản & Ghi âm tư vấn' : 'Consultation Records & Recordings Database'}</h3>
              <p className="text-xs text-slate-500">{language === 'vi' ? 'Quản lý lịch sử tư vấn, tóm tắt và file ghi âm cuộc gọi' : 'Browse historical logs, voice records, and legal summaries'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Tìm tên, sđt, nội dung...' : 'Search records...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-2 w-56 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-2.5 py-2 border border-slate-200 rounded-lg outline-none bg-white font-semibold"
              >
                <option value="all">-- {language === 'vi' ? 'Tất cả lĩnh vực' : 'All Domains'} --</option>
                <option value="Tranh chấp Đất đai">{language === 'vi' ? 'Tranh chấp Đất đai' : 'Land Dispute'}</option>
                <option value="Hợp đồng thương mại">{language === 'vi' ? 'Hợp đồng Thương mại' : 'Commercial Contract'}</option>
                <option value="Thừa kế di chúc">{language === 'vi' ? 'Thừa kế di chúc' : 'Inheritance'}</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium">
                {language === 'vi' ? 'Không tìm thấy biên bản tư vấn nào khớp.' : 'No consultation logs found.'}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isPlaying = playingLogId === log.id;
                return (
                  <div key={log.id} className="py-5 flex flex-col lg:flex-row lg:items-start justify-between gap-6 transition-all hover:bg-slate-50/50 px-3 rounded-xl">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-serif font-bold text-slate-900 text-sm">{log.name}</span>
                        <span className="text-slate-500 text-xs font-mono font-bold">({log.phone})</span>
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                          {log.category || (language === 'vi' ? "Tư vấn chung" : "General Advisory")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium ml-2">{log.timestamp}</span>
                      </div>

                      {/* Consultation Note */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans max-w-3xl whitespace-pre-line">
                        <span className="font-bold text-slate-800 uppercase text-[9px] tracking-wider block mb-1">📝 {language === 'vi' ? 'Chi tiết biên bản tư vấn' : 'Consultation Note'}</span>
                        {log.consultationNote || "Chưa có nội dung chi tiết"}
                      </div>

                      {/* Collapsible Transcript Area */}
                      {log.transcript && (
                        <details className="group">
                          <summary className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase cursor-pointer select-none">
                            {language === 'vi' ? '📂 Xem chi tiết bản hội thoại gốc (STT)' : '📂 View original transcription'}
                          </summary>
                          <div className="mt-2 p-3 bg-slate-950 text-slate-300 rounded-lg text-[11px] font-mono whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                            {log.transcript}
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Audio Player and Actions Panel */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 lg:w-72 justify-end">
                      {/* Interactive audio progress bar */}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(log.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isPlaying ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white hover:bg-slate-100 text-indigo-900 border border-indigo-200'
                          }`}
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                        </button>
                        <div className="flex-1 sm:w-32">
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>{isPlaying ? `${Math.floor((playbackProgress / 100) * log.duration)}s` : '0:00'}</span>
                            <span>{Math.floor(log.duration / 60)}:{(log.duration % 60).toString().padStart(2, '0')}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-300"
                              style={{ width: `${isPlaying ? playbackProgress : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* QC Rating Badge & Evaluation Trigger */}
                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                        {log.qcRating ? (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 justify-between">
                            <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500" /> QC: {log.qcRating}/5</span>
                            <span className="text-slate-400 font-normal">({log.qcEvaluator || "QC"})</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic text-center">Chưa đánh giá QC</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQcCall(log);
                            setQcRatingInput(log.qcRating || '5');
                            setQcNotesInput(log.qcNotes || '');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 justify-center whitespace-nowrap cursor-pointer shadow-sm"
                        >
                          <Award size={13} className="text-amber-400" />
                          Đánh giá QC
                        </button>
                      </div>

                      {/* Click to call trigger back */}
                      <button
                        type="button"
                        onClick={() => {
                          setTargetPhone(log.phone);
                          setTargetName(log.name);
                          setActiveSubTab('calls');
                          handleInitiateCall(log.phone, log.name);
                        }}
                        className="px-3.5 py-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap w-full sm:w-auto justify-center cursor-pointer"
                        title="Click to Call"
                      >
                        <Phone size={13} />
                        Gọi lại
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Appointment scheduler */}
      {activeSubTab === 'appointments' && (
        <div className="space-y-6">
          {/* Appointment list & calendar overview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-slate-800 text-base mb-1">
                  {language === 'vi' ? 'Quản lý lịch hẹn tư vấn khách hàng' : 'Appointment & Schedule Center'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'vi' ? 'Xếp lịch tư vấn trực tiếp, gọi điện chăm sóc và thiết lập phòng họp trực tuyến' : 'Schedule on-site legal reviews, consultation calls, or Zoom virtual consults'}
                </p>
              </div>

              {!showAddAppointment && (
                <button
                  onClick={() => setShowAddAppointment(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <PlusCircle size={15} />
                  {language === 'vi' ? 'ĐẶT LỊCH HẸN MỚI' : 'SCHEDULE APPOINTMENT'}
                </button>
              )}
            </div>

            {/* Expanded Add Appointment Form */}
            {showAddAppointment && (
              <form onSubmit={handleCreateAppointment} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-fade-in space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="font-serif font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600" />
                    {language === 'vi' ? 'Thiết lập Lịch hẹn tư vấn mới' : 'Create New Legal Appointment'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddAppointment(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1.5 flex items-center justify-between">
                      <span>{language === 'vi' ? 'Liên kết Hồ sơ Vụ án (Dossier ID)' : 'Link Dossier Case'}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">🟢 Dữ liệu thật</span>
                    </label>
                    <select
                      value={newAppt.dossierId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = records.find(r => r.id === val || r.systemId === val);
                        if (match) {
                          setNewAppt({
                            ...newAppt,
                            dossierId: val,
                            clientName: match.client || match.clientName || newAppt.clientName,
                            phone: match.phone || newAppt.phone,
                            category: match.category || newAppt.category
                          });
                        } else {
                          setNewAppt({ ...newAppt, dossierId: val });
                        }
                      }}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-indigo-200 outline-none bg-indigo-50/50 focus:border-indigo-600 font-mono font-bold text-indigo-800"
                    >
                      <option value="">-- {language === 'vi' ? 'Chọn Hồ sơ từ hệ thống' : 'Select System Dossier'} --</option>
                      {records.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} - {r.title || r.category} ({r.client || r.clientName || 'Khách hàng'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Tên khách hàng' : 'Client Name'}</label>
                    <input
                      type="text"
                      required
                      value={newAppt.clientName}
                      onChange={(e) => setNewAppt({ ...newAppt, clientName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 outline-none bg-white focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Số điện thoại' : 'Phone Number'}</label>
                    <input
                      type="tel"
                      required
                      value={newAppt.phone}
                      onChange={(e) => setNewAppt({ ...newAppt, phone: e.target.value })}
                      placeholder="0912345678"
                      className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 outline-none bg-white focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Hình thức gặp mặt' : 'Consulting Method'}</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setNewAppt({ ...newAppt, type: 'direct' })}
                        className={`p-1.5 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 ${
                          newAppt.type === 'direct' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <User size={12} />
                        Trực tiếp
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAppt({ ...newAppt, type: 'phone' })}
                        className={`p-1.5 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 ${
                          newAppt.type === 'phone' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <Phone size={12} />
                        Gọi điện
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAppt({ ...newAppt, type: 'online' })}
                        className={`p-1.5 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 ${
                          newAppt.type === 'online' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <Video size={12} />
                        Online
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Lĩnh vực tư vấn' : 'Legal Category'}</label>
                    <select
                      value={newAppt.category}
                      onChange={(e) => setNewAppt({ ...newAppt, category: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white font-semibold"
                    >
                      <option value="Tư vấn pháp lý Đất đai">Đất đai & Bất động sản</option>
                      <option value="Tranh chấp Hợp đồng">Tranh chấp Hợp đồng</option>
                      <option value="Thừa kế di chúc">Thừa kế di chúc</option>
                      <option value="Hôn nhân gia đình">Hôn nhân gia đình</option>
                      <option value="Đầu tư doanh nghiệp">Hỗ trợ Doanh nghiệp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Thời gian diễn ra' : 'Date & Time'}</label>
                    <input
                      type="datetime-local"
                      required
                      value={newAppt.dateTime}
                      onChange={(e) => setNewAppt({ ...newAppt, dateTime: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-1.5 rounded-xl border border-slate-200 outline-none bg-white focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Chuyên viên phụ trách' : 'Assigned Specialist'}</label>
                    <input
                      type="text"
                      value={newAppt.assignedStaff}
                      onChange={(e) => setNewAppt({ ...newAppt, assignedStaff: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 outline-none bg-white focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{language === 'vi' ? 'Ghi chú chuẩn bị trước cuộc họp' : 'Meeting Preparation Notes'}</label>
                  <textarea
                    value={newAppt.notes}
                    onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                    placeholder={language === 'vi' ? 'Ví dụ: Khách hàng cần chuẩn bị giấy chứng nhận QSDĐ bản gốc, hợp đồng chuyển nhượng v.v.' : 'E.g., Client must bring land use certificates copy...'}
                    rows={2}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white font-sans"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAppointment(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    Xác nhận xếp lịch
                  </button>
                </div>
              </form>
            )}

            {/* Appointments Grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-slate-400 font-medium">
                  {language === 'vi' ? 'Không có lịch hẹn tư vấn nào sắp tới.' : 'No upcoming appointments found.'}
                </div>
              ) : (
                appointments.map((appt) => (
                  <div key={appt.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          appt.type === 'direct' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          appt.type === 'phone' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {appt.type === 'direct' ? (language === 'vi' ? '📍 Gặp trực tiếp' : 'In-person') :
                           appt.type === 'phone' ? (language === 'vi' ? '📞 Tư vấn qua điện thoại' : 'Phone Consult') :
                           (language === 'vi' ? '📹 Phòng họp trực tuyến (Zoom)' : 'Zoom Meeting')}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {appt.status === 'pending' ? (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">PENDING</span>
                          ) : appt.status === 'completed' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">COMPLETED</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">CANCELLED</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-slate-800 text-sm flex items-center justify-between">
                          <span>{appt.clientName}</span>
                          <span className="text-xs text-indigo-600 font-mono font-bold">{appt.phone}</span>
                        </h4>
                        <p className="text-xs font-semibold text-indigo-950">
                          {appt.category}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-[11px] text-slate-600">
                        <div>
                          <strong className="text-slate-800">Thời gian:</strong> <span className="font-mono">{appt.dateTime}</span>
                        </div>
                        <div>
                          <strong className="text-slate-800">Chuyên viên:</strong> {appt.assignedStaff}
                        </div>
                      </div>

                      {appt.notes && (
                        <p className="text-xs text-slate-500 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-lg italic">
                          <strong>{language === 'vi' ? 'Chuẩn bị:' : 'Prep:'}</strong> {appt.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                        title={language === 'vi' ? "Xóa lịch hẹn" : "Delete appointment"}
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="flex gap-2">
                        {appt.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleApptStatus(appt.id, 'cancelled')}
                              className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-[10px] uppercase transition-colors cursor-pointer"
                            >
                              Hủy lịch
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleToggleApptStatus(appt.id, 'completed');
                                // Instantly dial them to consult!
                                setTargetPhone(appt.phone);
                                setTargetName(appt.clientName);
                                setActiveCategory(appt.category);
                                setActiveSubTab('calls');
                                handleInitiateCall(appt.phone, appt.clientName);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Phone size={10} />
                              Bắt đầu tư vấn
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QC Evaluation Modal for Board of Directors, Managers, and Quality Control */}
      {selectedQcCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="text-amber-500" size={20} />
                <h3 className="font-serif font-bold text-slate-900 text-base">Đánh giá Kiểm soát Chất lượng (QC)</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedQcCall(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl text-xs border border-slate-200">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Khách hàng: {selectedQcCall.name} ({selectedQcCall.phone})</span>
                <span className="text-indigo-600">{selectedQcCall.timestamp}</span>
              </div>
              <div className="text-slate-600 flex justify-between">
                <span>Nhân viên đàm thoại: <strong>{selectedQcCall.staffName || "Chuyên viên"}</strong></span>
                <span>Chi nhánh: <strong>{selectedQcCall.branch || "Trụ sở chính"}</strong></span>
              </div>
              {selectedQcCall.consultationNote && (
                <div className="text-slate-700 bg-white p-2.5 rounded border border-slate-200 mt-2 font-mono text-[11px] max-h-24 overflow-y-auto">
                  {selectedQcCall.consultationNote}
                </div>
              )}
            </div>

            {/* Score Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Điểm số chất lượng cuộc gọi (1 - 5 Sao)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setQcRatingInput(star.toString())}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      qcRatingInput === star.toString()
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Star size={14} className={qcRatingInput === star.toString() ? 'fill-white' : 'fill-slate-300 text-slate-300'} />
                    {star} {star === 5 ? "Xuất sắc" : star === 4 ? "Tốt" : star === 3 ? "Đạt" : star === 2 ? "Cần rút KN" : "Cảnh báo"}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes textarea */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Ghi chú kiểm soát & Nhận xét của Ban kiểm soát / Quản lý</label>
              <textarea
                value={qcNotesInput}
                onChange={(e) => setQcNotesInput(e.target.value)}
                placeholder="Nhập đánh giá về thái độ tư vấn, mức độ chính xác pháp lý, tuân thủ kịch bản đàm thoại, lỗi vi phạm (nếu có)..."
                className="w-full text-xs p-3 h-28 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            {/* Modal Footer Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedQcCall(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveQcEvaluation}
                disabled={isSavingQc}
                className="px-5 py-2 bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {isSavingQc ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} className="text-emerald-400" />
                )}
                Lưu kết quả kiểm duyệt QC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
