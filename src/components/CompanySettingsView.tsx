import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Plus,
  Play,
  StopCircle,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Key,
  Globe,
  Cpu,
  Layers,
  Settings,
  Shield,
  Sliders,
  Download,
  Copy,
  RefreshCw,
  Bot,
  Database,
  Activity,
  Wifi,
  UserCheck,
  Smartphone,
  Eye,
  EyeOff
} from "lucide-react";

interface GmailCreatorViewProps {
  language: string;
  isFullscreen?: boolean;
}

interface Account {
  email: string;
  pass: string;
  recovery: string;
  proxy: string;
  phone: string;
  status: "Active" | "Pending" | "Failed";
  createdAt: string;
}

export default function CompanySettingsView({ language, isFullscreen = false }: GmailCreatorViewProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"profiles" | "stealth" | "proxies">("profiles");

  // Configuration States
  const [personaRegion, setPersonaRegion] = useState<"vi" | "en">("vi");
  const [usernamePattern, setUsernamePattern] = useState<string>("[first][last][random]");
  const [passwordLength, setPasswordLength] = useState<number>(12);
  const [recoverySuffix, setRecoverySuffix] = useState<string>("@anhduonglaw.vn");
  
  // SMS Gateway config
  const [smsGateway, setSmsGateway] = useState<string>("5sim.net");
  const [smsApiKey, setSmsApiKey] = useState<string>("5s_a78fb0cd2291ea3b889a7f01");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [smsCountry, setSmsCountry] = useState<string>("Vietnam (+84)");
  const [smsOperator, setSmsOperator] = useState<string>("any");

  // Stealth / Browser fingerprinting switches
  const [stealthConfig, setStealthConfig] = useState({
    webglNoise: true,
    canvasNoise: true,
    audioNoise: true,
    webrtcShield: true,
    screenRandom: true,
    uaRotation: true,
    bezierMouse: true,
    humanTyping: true,
  });

  // Proxy Configuration state
  const [proxyInput, setProxyInput] = useState<string>(
    "103.142.14.88:1080:anhduong_proxy:pass123\n194.28.112.44:8080:anhduong_proxy:pass123\n116.102.3.99:1080:anhduong_proxy:pass123\n45.124.95.12:3128\n103.82.20.144:80"
  );
  const [proxiesList, setProxiesList] = useState([
    { ip: "103.142.14.88", port: "1080", region: "Hanoi, VN", type: "SOCKS5", ping: 38, status: "Active" },
    { ip: "194.28.112.44", port: "8080", region: "Da Nang, VN", type: "HTTP", ping: 42, status: "Active" },
    { ip: "116.102.3.99", port: "1080", region: "HCM, VN", type: "SOCKS5", ping: 120, status: "Active" },
    { ip: "45.124.95.12", port: "3128", region: "Singapore", type: "HTTP", ping: 14, status: "Active" },
    { ip: "103.82.20.144", port: "80", region: "Tokyo, JP", type: "HTTP", ping: 95, status: "Active" },
  ]);
  const [isCheckingProxies, setIsCheckingProxies] = useState(false);

  // Runner & Terminal Logger States
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [targetCount, setTargetCount] = useState<number>(3);
  const [runSpeed, setRunSpeed] = useState<string>("human"); // human, instant
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "🤖 [SHADOW_CREATOR] Console Initialized.",
    "🛡️ Ready for secure sandbox automation routing."
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Accounts Database Store
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form States
  const [formEmail, setFormEmail] = useState("");
  const [formPass, setFormPass] = useState("");
  const [formRecovery, setFormRecovery] = useState("");
  const [formProxy, setFormProxy] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Pending" | "Failed">("Active");

  // Fetch accounts from backend
  const fetchAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await fetch("/api/system/gmail-accounts");
      const result = await res.json();
      if (result.success && result.data) {
        setAccounts(result.data);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setFormEmail("");
    setFormPass("");
    setFormRecovery("");
    setFormProxy("");
    setFormPhone("");
    setFormStatus("Active");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setFormEmail(acc.email);
    setFormPass(acc.pass);
    setFormRecovery(acc.recovery);
    setFormProxy(acc.proxy);
    setFormPhone(acc.phone);
    setFormStatus(acc.status);
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail) return;

    const payload = {
      email: formEmail,
      pass: formPass,
      recovery: formRecovery,
      proxy: formProxy,
      phone: formPhone,
      status: formStatus
    };

    try {
      let res;
      if (editingAccount) {
        // Edit mode
        res = await fetch(`/api/system/gmail-accounts/${encodeURIComponent(formEmail)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // Add mode
        res = await fetch("/api/system/gmail-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchAccounts();
      } else {
        const errData = await res.json();
        alert("Error saving account: " + (errData.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving account: " + err.message);
    }
  };

  const handleDeleteAccount = async (email: string) => {
    if (!confirm(language === "vi" ? `Bạn có chắc chắn muốn xóa tài khoản ${email}?` : `Are you sure you want to delete ${email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/system/gmail-accounts/${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAccounts();
      } else {
        const errData = await res.json();
        alert("Error deleting account: " + (errData.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error deleting account: " + err.message);
    }
  };

  // Handle Terminal scroll
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Simulated proxy testing
  const handleTestProxies = () => {
    setIsCheckingProxies(true);
    setTerminalLogs(prev => [...prev, "🌐 [PROXY_ENGINE] Triggering batch connection latency test..."]);
    
    setTimeout(() => {
      setProxiesList(prev =>
        prev.map(p => ({
          ...p,
          ping: Math.floor(Math.random() * 80) + 10,
          status: Math.random() > 0.15 ? "Active" : "Failed"
        }))
      );
      setIsCheckingProxies(false);
      setTerminalLogs(prev => [...prev, "🌐 [PROXY_ENGINE] Batch ping complete. Healthy relays synced!"]);
    }, 1500);
  };

  // Helper generator names
  const vietnameseNames = [
    { first: "Nguyen", last: "Minh Triet" },
    { first: "Tran", last: "Hoang Yen" },
    { first: "Le", last: "Thanh Tung" },
    { first: "Pham", last: "Tuan Anh" },
    { first: "Hoang", last: "Kim Ngan" },
    { first: "Vu", last: "Duc Dam" },
    { first: "Dang", last: "Bao Ngoc" }
  ];

  const englishNames = [
    { first: "James", last: "Smith" },
    { first: "Olivia", last: "Johnson" },
    { first: "William", last: "Brown" },
    { first: "Sophia", last: "Miller" },
    { first: "David", last: "Davis" }
  ];

  // Automated simulator engine loop
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const startAutomation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setTerminalLogs(prev => [
      ...prev,
      `🚀 [LAUNCHER] Starting sequence for ${targetCount} Gmail accounts...`,
      `⚙️ Profiling mode: ${personaRegion === "vi" ? "Vietnam" : "Global English"}. Speed mode: ${runSpeed.toUpperCase()}`
    ]);

    let currentAccountIndex = 0;
    let stepIndex = 0;
    let tempAccount: Partial<Account> = {};

    const delay = runSpeed === "instant" ? 300 : 1500;

    const runNextStep = () => {
      if (currentAccountIndex >= targetCount) {
        setTerminalLogs(prev => [
          ...prev,
          "✅ [FINISHED] Batch automation finished successfully!",
          "📁 Account credentials synced to secure local workspace state."
        ]);
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      // Steps within creating a single account
      const steps = [
        () => {
          // Setup Identity
          const pool = personaRegion === "vi" ? vietnameseNames : englishNames;
          const identity = pool[Math.floor(Math.random() * pool.length)];
          const randSuffix = Math.floor(1000 + Math.random() * 9000);
          
          let emailUser = "";
          if (usernamePattern === "[first][last][random]") {
            emailUser = `${identity.first.toLowerCase()}${identity.last.replace(/\s+/g, "").toLowerCase()}${randSuffix}`;
          } else {
            emailUser = `user${randSuffix}${identity.first.toLowerCase()}`;
          }

          tempAccount = {
            email: `${emailUser}@gmail.com`,
            pass: `SecPass_${Math.random().toString(36).substring(3, 10)}!`,
            recovery: `${emailUser}.recovery${recoverySuffix}`,
            proxy: proxiesList[currentAccountIndex % proxiesList.length].ip + ":" + proxiesList[currentAccountIndex % proxiesList.length].port,
            status: "Pending",
            createdAt: new Date().toISOString().replace("T", " ").substring(0, 16)
          };

          setTerminalLogs(prev => [
            ...prev,
            `\n➡️ [ACCOUNT #${currentAccountIndex + 1}] Synthesizing digital identity for ${identity.first} ${identity.last}...`,
            `🕵️ [CLOAK_BROWSER] Instantiating isolated browser runtime with Canvas Noise.`
          ]);
        },
        () => {
          // Proxy & User agent routing
          setTerminalLogs(prev => [
            ...prev,
            `🌐 [PROXY] Routing traffic through server ${tempAccount.proxy} (Ping: ~${Math.floor(Math.random() * 50) + 10}ms)`,
            `🛡️ [STEALTH] User-Agent spoofed to: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0`
          ]);
        },
        () => {
          // Input names & captcha navigation
          setTerminalLogs(prev => [
            ...prev,
            `⌨️ [HUMAN_SIM] Typing registration fields (Name, Birthdate, Custom Username)...`,
            `🖱️ [BEZIER_MOUSE] Random spline curves injected for mouse movement over Google Form.`
          ]);
        },
        () => {
          // SMS gateway request
          const prefix = smsCountry.includes("+84") ? "+84" : "+1";
          const randomSuffixNum = Math.floor(1000000 + Math.random() * 9000000);
          tempAccount.phone = `${prefix}3${randomSuffixNum}`;

          setTerminalLogs(prev => [
            ...prev,
            `☎️ [SMS_GATEWAY] Requesting rental phone number from ${smsGateway} (Country: ${smsCountry})...`,
            `☎️ [SMS_GATEWAY] Successfully leased number: ${tempAccount.phone}. Injecting into Signup form.`
          ]);
        },
        () => {
          // Waiting for OTP
          const randOtp = Math.floor(100000 + Math.random() * 900000);
          setTerminalLogs(prev => [
            ...prev,
            `⏳ [GATEWAY] Listening on phone line ${tempAccount.phone} for incoming verification code...`,
            `📩 [GATEWAY] OTP Received: "G-${randOtp} is your Google verification code." Entering OTP...`
          ]);
        },
        () => {
          // Finish and Save
          tempAccount.status = "Active";
          const newAcc = tempAccount as Account;
          setAccounts(prev => [newAcc, ...prev]);

          // Save to server database
          fetch("/api/system/gmail-accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newAcc)
          })
            .then(() => fetchAccounts())
            .catch(err => console.error("Error saving automated account:", err));

          setTerminalLogs(prev => [
            ...prev,
            `🎉 [SUCCESS] Account registered successfully! Registered email: ${tempAccount.email}`,
            `💾 [DATABASE] Syncing cookie session state, recovery codes, and credentials locally.`
          ]);
          currentAccountIndex++;
          stepIndex = -1; // reset steps for next account
        }
      ];

      stepIndex++;
      steps[stepIndex - 1]();
    };

    intervalRef.current = setInterval(runNextStep, delay);
  };

  const stopAutomation = () => {
    if (!isRunning) return;
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTerminalLogs(prev => [...prev, "🛑 [STOP] Automation manually suspended by the operator."]);
  };

  const clearLogs = () => {
    setTerminalLogs(["🤖 Console cleared. Ready for next sequence."]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const exportAccountsAsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accounts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "gmail_accounts_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="gmail-creator-pro" className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
            <Bot size={28} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-serif">
                {language === "vi" ? "Công cụ Tạo Gmail Hàng loạt (Pro)" : "Gmail Account Creator Pro"}
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full border border-red-200/50 dark:border-red-900/40 uppercase">
                ShadowEdition
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {language === "vi" 
                ? "Bảng điều khiển mô phỏng quy trình tạo tài khoản Google, vượt tường bảo mật bằng thiết bị ảo, proxy xoay vòng và OTP Gateway."
                : "Stealth automation sandbox simulating isolated browser pools, multi-relay routing, and real-time OTP registration pipelines."
              }
            </p>
          </div>
        </div>

        {/* Dynamic Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">PROXY: ON (45 Active)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-full">
            <Activity size={12} className="text-indigo-500" />
            <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400">SMS GATEWAY: ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 rounded-full">
            <Shield size={12} className="text-purple-500" />
            <span className="text-[11px] font-medium text-purple-700 dark:text-purple-400">CLOAK: STEALTH ACTIVE</span>
          </div>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === "vi" ? "Tổng Tài khoản Đã Tạo" : "Total Created Accounts"}
            </p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-mono">
              {accounts.length}
            </h3>
            <p className="text-[11px] text-emerald-500 mt-1 font-medium">✓ Ready to Export</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 rounded-xl">
            <Database size={24} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === "vi" ? "Relay Proxies Đang dùng" : "Relay Proxies in Pool"}
            </p>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-mono">
              {proxiesList.filter(p => p.status === "Active").length} / {proxiesList.length}
            </h3>
            <p className="text-[11px] text-blue-500 mt-1 font-medium">⚡ Average Ping: 46ms</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 rounded-xl">
            <Globe size={24} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === "vi" ? "Số dư Cổng SMS" : "SMS OTP Balance"}
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              $12.40
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Provider: {smsGateway}</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-xl">
            <Smartphone size={24} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {language === "vi" ? "Tỷ lệ Đăng ký Thành công" : "Success Ratio"}
            </p>
            <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
              94.2%
            </h3>
            <p className="text-[11px] text-purple-500 mt-1 font-medium">🛡️ Zero Shadowban flags</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-500 dark:text-purple-400 rounded-xl">
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SETTINGS TABS & LOGS (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CONFIGURATION PANEL WITH TABS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            
            {/* TABS SELECTOR */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <button
                onClick={() => setActiveTab("profiles")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                  activeTab === "profiles"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Sliders size={16} />
                {language === "vi" ? "1. Cấu hình Tài khoản & OTP" : "1. Account & SMS Setup"}
              </button>
              <button
                onClick={() => setActiveTab("stealth")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                  activeTab === "stealth"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Shield size={16} />
                {language === "vi" ? "2. Chống Phát hiện (Stealth)" : "2. Fingerprint Spoofing"}
              </button>
              <button
                onClick={() => setActiveTab("proxies")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                  activeTab === "proxies"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Globe size={16} />
                {language === "vi" ? "3. Relay Proxies Pool" : "3. Proxy Pool Management"}
              </button>
            </div>

            {/* TAB CONTENT PANEL */}
            <div className="p-6">
              
              {/* TAB 1: PROFILES & PERSONA GENERATION */}
              {activeTab === "profiles" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Identity Generation */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        👤 {language === "vi" ? "Nhân thân & Tên ảo" : "Identity Name Generator"}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPersonaRegion("vi")}
                          className={`py-3 px-4 rounded-xl text-xs font-semibold border transition ${
                            personaRegion === "vi"
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400"
                              : "bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Vietnamese Persona
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonaRegion("en")}
                          className={`py-3 px-4 rounded-xl text-xs font-semibold border transition ${
                            personaRegion === "en"
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400"
                              : "bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          English Persona
                        </button>
                      </div>
                    </div>

                    {/* Username Structure */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        🏷️ {language === "vi" ? "Cấu trúc Username" : "Gmail Username Pattern"}
                      </label>
                      <select
                        value={usernamePattern}
                        onChange={(e) => setUsernamePattern(e.target.value)}
                        className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="[first][last][random]">[first_name][last_name][random_digits] (Highly Human)</option>
                        <option value="[word][random]">[english_noun][random_digits] (Marketing Style)</option>
                      </select>
                    </div>

                    {/* Password Configuration */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          🔑 {language === "vi" ? "Độ dài Mật khẩu" : "Password Length"}
                        </label>
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{passwordLength} chars</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="24"
                        value={passwordLength}
                        onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    {/* Recovery Wildcard Domain */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        🔄 {language === "vi" ? "Email Khôi phục (Wildcard Domain)" : "Wildcard Recovery Email"}
                      </label>
                      <input
                        type="text"
                        value={recoverySuffix}
                        onChange={(e) => setRecoverySuffix(e.target.value)}
                        placeholder="@anhduonglaw.vn"
                        className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                  </div>

                  {/* SMS GATEWAY CONTAINER */}
                  <div className="p-5 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <Smartphone size={18} className="text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {language === "vi" ? "Cài đặt Cổng Thuê SMS OTP" : "Virtual Phone Verification & SMS Gateway"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* SMS Provider selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">SMS API Service Provider</label>
                        <select
                          value={smsGateway}
                          onChange={(e) => setSmsGateway(e.target.value)}
                          className="w-full py-2.5 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <option value="5sim.net">5sim.net (High Speed Verification)</option>
                          <option value="sms-activate.org">sms-activate.org (Global Coverage)</option>
                          <option value="onlinesim.ru">onlinesim.ru (Fallback Simpool)</option>
                        </select>
                      </div>

                      {/* SMS API key */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">API Access Token</label>
                        <div className="relative">
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={smsApiKey}
                            onChange={(e) => setSmsApiKey(e.target.value)}
                            className="w-full py-2.5 pl-3 pr-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-semibold text-slate-700 dark:text-slate-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Country Rental selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Virtual Sim Country Code</label>
                        <select
                          value={smsCountry}
                          onChange={(e) => setSmsCountry(e.target.value)}
                          className="w-full py-2.5 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <option value="Vietnam (+84)">Vietnam (+84)</option>
                          <option value="Philippines (+63)">Philippines (+63)</option>
                          <option value="Indonesia (+62)">Indonesia (+62)</option>
                          <option value="USA (+1)">USA (+1)</option>
                        </select>
                      </div>

                      {/* Operator selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Preferred Carrier Operator</label>
                        <select
                          value={smsOperator}
                          onChange={(e) => setSmsOperator(e.target.value)}
                          className="w-full py-2.5 px-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <option value="any">Any Carrier (Auto Route)</option>
                          <option value="viettel">Viettel (High stability)</option>
                          <option value="vinaphone">Vinaphone / Mobifone</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STEALTH & ANTI-DETECT SUITE */}
              {activeTab === "stealth" && (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl flex items-start gap-3">
                    <Shield className="text-indigo-600 dark:text-indigo-400 mt-0.5" size={18} />
                    <div className="text-xs">
                      <span className="font-bold text-indigo-900 dark:text-indigo-300">CloakBrowser Fingerprinting Spoofer: </span>
                      <p className="text-indigo-700 dark:text-indigo-400 mt-0.5">
                        These options override hardware parameters in Playwright/Puppeteer containers, feeding Google's security endpoints with dynamic, high-entropy synthetic hardware hashes to avoid bulk registration triggers.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Switch 1: WebGL Noise */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">WebGL Metadata Noise Injection</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Spoofs graphic card renderer strings & hashes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={stealthConfig.webglNoise}
                        onChange={(e) => setStealthConfig({ ...stealthConfig, webglNoise: e.target.checked })}
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-800 checked:bg-indigo-600 outline-none transition cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                      />
                    </div>

                    {/* Switch 2: Canvas Noise */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Canvas Fingerprint Defeater</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Injects custom noise in image rendering calls</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={stealthConfig.canvasNoise}
                        onChange={(e) => setStealthConfig({ ...stealthConfig, canvasNoise: e.target.checked })}
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-800 checked:bg-indigo-600 outline-none transition cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                      />
                    </div>

                    {/* Switch 3: Audio Context */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">AudioContext Signature Spoofer</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Injects minute distortion into sound card frequency responses</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={stealthConfig.audioNoise}
                        onChange={(e) => setStealthConfig({ ...stealthConfig, audioNoise: e.target.checked })}
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-800 checked:bg-indigo-600 outline-none transition cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                      />
                    </div>

                    {/* Switch 4: WebRTC protection */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">WebRTC IP Leak Guard</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Disables WebRTC API to prevent local IP leak</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={stealthConfig.webrtcShield}
                        onChange={(e) => setStealthConfig({ ...stealthConfig, webrtcShield: e.target.checked })}
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-800 checked:bg-indigo-600 outline-none transition cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                      />
                    </div>

                    {/* Switch 5: Screen resolution */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Screen Size & Viewport Randomizer</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Sets varied human-like pixel layouts per thread</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={stealthConfig.screenRandom}
                        onChange={(e) => setStealthConfig({ ...stealthConfig, screenRandom: e.target.checked })}
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-800 checked:bg-indigo-600 outline-none transition cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                      />
                    </div>

                    {/* Switch 6: User-Agent Rotation */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dynamic User-Agent Rotation</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Rotates premium desktop & mobile browser headers</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={stealthConfig.uaRotation}
                        onChange={(e) => setStealthConfig({ ...stealthConfig, uaRotation: e.target.checked })}
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-800 checked:bg-indigo-600 outline-none transition cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                      />
                    </div>

                    {/* Switch 7: Mouse Movements */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Bezier Curve Mouse Movement</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Injects organic, non-linear cursor splines</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={stealthConfig.bezierMouse}
                        onChange={(e) => setStealthConfig({ ...stealthConfig, bezierMouse: e.target.checked })}
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-800 checked:bg-indigo-600 outline-none transition cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                      />
                    </div>

                    {/* Switch 8: Human Typing */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dynamic Human Typing Speed</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Simulates keystroke delay variance (60-120 WPM)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={stealthConfig.humanTyping}
                        onChange={(e) => setStealthConfig({ ...stealthConfig, humanTyping: e.target.checked })}
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-800 checked:bg-indigo-600 outline-none transition cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition"
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: PROXY POOL MANAGER */}
              {activeTab === "proxies" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        🌐 Input IP Proxies (Format: IP:Port:User:Pass or IP:Port)
                      </label>
                      <button
                        type="button"
                        onClick={handleTestProxies}
                        disabled={isCheckingProxies}
                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
                      >
                        <RefreshCw size={12} className={isCheckingProxies ? "animate-spin" : ""} />
                        {isCheckingProxies ? "Checking..." : "Re-Check Relays"}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={proxyInput}
                      onChange={(e) => setProxyInput(e.target.value)}
                      className="w-full font-mono text-xs p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* ACTIVE PROXY LIST TABLE */}
                  <div className={`overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-xl transition-all duration-300 ${
                    isFullscreen ? "max-h-[450px] overflow-y-auto" : ""
                  }`}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                          <th className="py-2.5 px-4">Proxy Relay IP</th>
                          <th className="py-2.5 px-4">Port</th>
                          <th className="py-2.5 px-4">Geo-location</th>
                          <th className="py-2.5 px-4">Protocol</th>
                          <th className="py-2.5 px-4">Ping (ms)</th>
                          <th className="py-2.5 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {proxiesList.map((proxy, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{proxy.ip}</td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">{proxy.port}</td>
                            <td className="py-2.5 px-4">{proxy.region}</td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold">{proxy.type}</span>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{proxy.ping}ms</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                proxy.status === "Active"
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${proxy.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                {proxy.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ACTIVE TERMINAL & LOGGING WORKSPACE */}
          <div className={`bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-md flex flex-col transition-all duration-300 ${
            isFullscreen ? "h-[500px] lg:h-[650px]" : "h-[340px]"
          }`}>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-950">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-indigo-400 animate-pulse" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  ⚡ Playwright Stealth Script Console Logger
                </span>
              </div>
              <button
                onClick={clearLogs}
                className="text-[10px] font-mono font-bold tracking-tight bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-2 rounded-md transition"
              >
                Clear Screen
              </button>
            </div>

            {/* MONOSPACE SCROLLER SCREEN */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] text-slate-300 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {terminalLogs.map((log, i) => {
                let colorClass = "text-slate-300";
                if (log.includes("[SUCCESS]")) colorClass = "text-emerald-400 font-bold";
                else if (log.includes("[FAILED]")) colorClass = "text-rose-400 font-bold";
                else if (log.includes("[STOP]")) colorClass = "text-amber-400 font-bold";
                else if (log.includes("[SMS_GATEWAY]") || log.includes("[GATEWAY]")) colorClass = "text-sky-400";
                else if (log.includes("[PROXY]")) colorClass = "text-purple-400";
                else if (log.includes("[CLOAK_BROWSER]") || log.includes("[STEALTH]")) colorClass = "text-pink-400";
                else if (log.includes("[LAUNCHER]")) colorClass = "text-indigo-300 font-bold";

                return (
                  <div key={i} className={`${colorClass} leading-relaxed break-all`}>
                    {log}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RUNNER CONTROL PANEL & DATABASE TABLE (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SCRIPT RUNNER CONTROLLER */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Play size={16} className="text-indigo-600 dark:text-indigo-400" />
              {language === "vi" ? "Bảng Điều khiển Tiến trình" : "Script Runner Control"}
            </h3>

            {/* Target Account count Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Accounts to Create:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{targetCount} accounts</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value))}
                disabled={isRunning}
                className="w-full accent-indigo-600 disabled:opacity-50"
              />
            </div>

            {/* Speed Control Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Automation Speed / Delay</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRunSpeed("human")}
                  disabled={isRunning}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    runSpeed === "human"
                      ? "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      : "bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  🐢 Safe Human Delays
                </button>
                <button
                  type="button"
                  onClick={() => setRunSpeed("instant")}
                  disabled={isRunning}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    runSpeed === "instant"
                      ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/50"
                      : "bg-white border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-500"
                  }`}
                >
                  ⚡ Instant (Debug)
                </button>
              </div>
            </div>

            {/* LARGE RUN ACTION BUTTON */}
            {!isRunning ? (
              <button
                type="button"
                onClick={startAutomation}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/10 active:scale-95 animate-pulse"
              >
                <Play size={16} fill="white" />
                {language === "vi" ? "Chạy Tiến Trình Tạo Gmail" : "Launch Bulking Script"}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopAutomation}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <StopCircle size={16} />
                {language === "vi" ? "Dừng Tiến trình khẩn cấp" : "Emergency Stop Script"}
              </button>
            )}
          </div>

          {/* GENERATED ACCOUNTS REGISTRY DATABASE */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Database size={16} className="text-emerald-500" />
                {language === "vi" ? "CSDL Tài khoản Đăng ký" : "Credentials Registry"}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus size={12} />
                  {language === "vi" ? "Thêm mới" : "Add Account"}
                </button>
                <button
                  type="button"
                  onClick={exportAccountsAsJson}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Download size={12} />
                  Export JSON
                </button>
              </div>
            </div>

            {/* List scroll panel */}
            <div className={`space-y-3 overflow-y-auto scrollbar-thin transition-all duration-300 ${
              isFullscreen ? "max-h-[500px] lg:max-h-[600px]" : "max-h-[300px]"
            }`}>
              {accounts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {language === "vi" ? "Chưa có tài khoản nào được đăng ký." : "No accounts registered yet."}
                </div>
              ) : (
                accounts.map((acc, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-2 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 break-all">{acc.email}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Pass: <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{acc.pass}</span></p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        acc.status === "Active"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                          : acc.status === "Pending"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                          : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                      }`}>
                        {acc.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Phone: {acc.phone}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition duration-150">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition"
                          title={language === "vi" ? "Sửa tài khoản" : "Edit account"}
                        >
                          <Sliders size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.email)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                          title={language === "vi" ? "Xóa tài khoản" : "Delete account"}
                        >
                          <XCircle size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`${acc.email}:${acc.pass}`)}
                          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                          <Copy size={10} />
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ADD/EDIT ACCOUNT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {editingAccount 
                    ? (language === "vi" ? "Chỉnh sửa Tài khoản" : "Edit Account") 
                    : (language === "vi" ? "Thêm mới Tài khoản" : "Add New Account")
                  }
                </h4>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingAccount}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@gmail.com"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                    {language === "vi" ? "Mật khẩu" : "Password"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formPass}
                    onChange={(e) => setFormPass(e.target.value)}
                    placeholder="Mật khẩu bảo mật"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                    {language === "vi" ? "Email Khôi phục" : "Recovery Email"}
                  </label>
                  <input
                    type="email"
                    value={formRecovery}
                    onChange={(e) => setFormRecovery(e.target.value)}
                    placeholder="recovery@domain.vn"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                    Proxy (IP:Port)
                  </label>
                  <input
                    type="text"
                    value={formProxy}
                    onChange={(e) => setFormProxy(e.target.value)}
                    placeholder="1.2.3.4:80"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                    {language === "vi" ? "Số điện thoại" : "Phone number"}
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+84..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                    Trạng thái
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition"
                  >
                    {language === "vi" ? "Hủy" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                  >
                    {language === "vi" ? "Lưu lại" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
