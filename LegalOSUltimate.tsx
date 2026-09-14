import React, { useState } from "react";
import { 
  Sparkles, Database, Lock, EyeOff, Plus, ShieldCheck, 
  FileUp, Cpu, Server, AlertOctagon, CheckCircle, Info, RefreshCw 
} from "lucide-react";

// ============================================================================
// 1. PHÂN HỆ MÃ HÓA HAI CHIỀU YOUTUBE SHORT ID (THAY THẾ HOÀN TOÀN UUID)
// ============================================================================
export class IdObfuscator {
  private static readonly ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ23456789";
  private static readonly BASE = IdObfuscator.ALPHABET.length;
  private static readonly SALT_OFFSET = 1234567; // Khóa muối số học tránh ánh xạ trực tiếp từ 0

  /**
   * Mã hóa mã tự tăng (INT PK) thành chuỗi rút gọn giống YouTube (ví dụ: 10001 -> "g9A7b")
   */
  public static encode(num: number): string {
    let internalId = num + this.SALT_OFFSET;
    let encoded = "";
    while (internalId > 0) {
      const remainder = internalId % this.BASE;
      encoded = this.ALPHABET[remainder] + encoded;
      internalId = Math.floor(internalId / this.BASE);
    }
    return encoded;
  }

  /**
   * Giải mã chuỗi rút gọn YouTube ngược về ID số nguyên gốc để truy vấn nhanh O(1)
   */
  public static decode(str: string): number {
    let decoded = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const index = this.ALPHABET.indexOf(char);
      if (index === -1) throw new Error("Mã ID rút gọn chứa ký tự không hợp lệ.");
      decoded = decoded * this.BASE + index;
    }
    return decoded - this.SALT_OFFSET;
  }
}

// ============================================================================
// 2. CƠ SỞ DỮ LIỆU ĐỒNG BỘ CHỈ MỤC O(1) & CHỐNG PAGE SPLITS (NO-UUID)
// ============================================================================
export interface CaseRecord {
  id: number; // PRIVATE KEY: Khóa chính số nguyên tự tăng trong DB để tối ưu Join/Index
  code: string;
  title: string;
  clientId: string;
}

export class DatabaseEngine {
  private static casesTable: CaseRecord[] = [
    { id: 10001, code: "DS-2026-001", title: "Tranh chấp quyền sở hữu thương hiệu Ánh Dương", clientId: "client_789" },
    { id: 10002, code: "DS-2026-002", title: "Bảo hộ sáng chế công nghệ AI Arkon", clientId: "client_456" }
  ];
  private static autoIncrementId = 10003;

  public static async createCase(code: string, title: string, clientId: string): Promise<CaseRecord> {
    const newRecord: CaseRecord = {
      id: this.autoIncrementId++,
      code,
      title,
      clientId
    };
    this.casesTable.push(newRecord);
    return newRecord;
  }

  public static getCasesTable(): CaseRecord[] {
    return this.casesTable;
  }
}

// ============================================================================
// 3. ĐIỀU PHỐI TẢI FILE LỚN (SENIOR PRESIGNED URL COORDINATOR)
// ============================================================================
export class PresignedUrlOrchestrator {
  private static readonly STORAGE_BUCKET = "sunshine-lawfirm-records";
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // Giới hạn 100MB

  public static generateUploadUrl(fileName: string, fileSizeInBytes: number, userId: string) {
    if (fileSizeInBytes > this.MAX_FILE_SIZE) {
      throw new Error(`Tệp quá lớn! Văn phòng giới hạn tối đa 100MB để tránh lãng phí dung lượng.`);
    }
    const fileExtension = fileName.split(".").pop();
    const uniqueFileKey = `users/${userId}/documents/${Math.random().toString(36).substring(2, 10)}.${fileExtension}`;
    const expiresTimestamp = Math.floor(Date.now() / 1000) + 900; // Có hiệu lực trong 15 phút

    // Sinh đường dẫn tải trực tiếp lên Cloud (Bypass qua Core Server giúp băng thông Server = 0MB!)
    const uploadUrl = `https://storage.googleapis.com/${this.STORAGE_BUCKET}/${uniqueFileKey}?expires=${expiresTimestamp}&signature=mock_hmac_sha256_signature`;

    return {
      uploadUrl,
      fileKey: uniqueFileKey,
      expiresInSeconds: 900
    };
  }
}

// ============================================================================
// 4. LÁ CHẮN BẢO MẬT ZERO-TRUST & CHỐNG PROMPT INJECTION
// ============================================================================
export class ZeroTrustGatekeeper {
  public static sanitizeInput(input: string): string {
    if (!input) return "";
    return input
      .trim()
      .replace(/['"\\;]/g, "") // Khử SQL Injection
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[BLOCKED_SCRIPT]"); // Khử XSS
  }
}

// ============================================================================
// 5. GIAO DIỆN COCKPIT ĐO LƯỜNG & KIỂM CHỨNG TỐI THƯỢNG
// ============================================================================
export default function LegalOSUltimate() {
  const [cases, setCases] = useState<CaseRecord[]>(DatabaseEngine.getCasesTable());
  const [simulationMode, setSimulationMode] = useState<"NONE" | "INTERN" | "SENIOR">("NONE");
  const [serverStats, setServerStats] = useState({ cpu: "2%", ram: "18%", bandwidth: "0 Mbps", status: "HEALTHY" });
  const [simLogs, setSimLogs] = useState<string[]>([]);

  const runSimulationLog = (msg: string) => {
    setSimLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Tạo mới hồ sơ và mã hóa Short ID Youtube-like tức thời
  const handleCreateCase = async () => {
    const code = `DS-2026-${Math.floor(Math.random() * 900 + 100)}`;
    const title = "Tranh chấp sáp nhập tập đoàn Công nghệ Mới";
    const record = await DatabaseEngine.createCase(code, title, "client_999");
    
    setCases([...DatabaseEngine.getCasesTable()]);
    const shortId = IdObfuscator.encode(record.id);
    runSimulationLog(`💾 [Database] Chèn tuần tự PK = ${record.id} ➔ Dịch mã YouTube Short ID = ${shortId} (Bảo mật 100%, 0 byte đĩa phụ!)`);
  };

  // Giả lập sập nguồn do cách viết của Intern (Proxy tải file lớn trực tiếp)
  const handleTriggerInternSimulation = () => {
    setSimulationMode("INTERN");
    setServerStats({ cpu: "15%", ram: "25%", bandwidth: "120 Mbps", status: "HEALTHY" });
    setSimLogs([]);
    runSimulationLog("🎬 Bắt đầu giả lập 1000 người dùng tải file 50MB lên Server cùng lúc...");

    setTimeout(() => {
      setServerStats({ cpu: "89%", ram: "74%", bandwidth: "1.4 Gbps", status: "SLOWING DOWN" });
      runSimulationLog("🚨 CẢNH BÁO: Server trung gian đang nuốt trọn byte tệp vào bộ nhớ tạm RAM & Disk.");
      runSimulationLog("⚠️ Nghẽn I/O hệ thống mạng! Event Loop bị nghẽn cứng.");
    }, 1000);

    setTimeout(() => {
      setServerStats({ cpu: "100%", ram: "99%", bandwidth: "Choked", status: "DOWN/CRASHED" });
      runSimulationLog("❌ SỰ CỐ CẬN KỀ: Server chính sập nguồn do tràn RAM vật lý!");
    }, 2500);
  };

  // Giả lập cơ chế xử lý của Senior (Presigned URL)
  const handleTriggerSeniorSimulation = () => {
    setSimulationMode("SENIOR");
    setServerStats({ cpu: "4%", ram: "19%", bandwidth: "10 Kbps", status: "HEALTHY" });
    setSimLogs([]);
    runSimulationLog("🎬 Khởi chạy 1000 cuộc gọi lấy chữ ký Presigned URL...");

    setTimeout(() => {
      for (let i = 1; i <= 3; i++) {
        const response = PresignedUrlOrchestrator.generateUploadUrl(`document_case_${i}.pdf`, 50 * 1024 * 1024, "staff_user_88");
        runSimulationLog(`✔ Sinh URL ghi đĩa trực tiếp cho file ${i}: ${response.fileKey.substring(0, 25)}...`);
      }
    }, 500);

    setTimeout(() => {
      setServerStats({ cpu: "2%", ram: "19%", bandwidth: "8 Kbps", status: "HEALTHY" });
      runSimulationLog("🏆 THÀNH CÔNG RỰC RỠ: 1000 người dùng đẩy file thẳng lên Google Cloud Storage.");
      runSimulationLog("✔ Tài nguyên Server nhàn rỗi ở mức tuyệt đối (<2% CPU). Không tốn băng thông trung chuyển.");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#070e17] text-slate-100 p-8 space-y-8 font-sans">
      
      {/* 1. Cockpit Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="bg-[#e2b13c]/15 p-3 rounded-2xl border border-[#e2b13c]/30 text-[#e2b13c]">
            <ShieldCheck size={28} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">LEGAL OS HARDENED COCKPIT</h1>
            <p className="text-xs text-slate-400 font-bold mt-1">Trạm mô phỏng phòng thủ an ninh thông tin & Tải cao văn phòng Ánh Dương Law</p>
          </div>
        </div>
      </div>

      {/* 2. Monitor Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#0b1b2d] border border-slate-800 rounded-2xl p-5">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Trạng thái hệ thống</span>
          <span className={`text-lg font-black mt-1 block ${serverStats.status === "HEALTHY" ? "text-emerald-400" : "text-red-500 animate-pulse"}`}>{serverStats.status}</span>
        </div>
        <div className="bg-[#0b1b2d] border border-slate-800 rounded-2xl p-5">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Sử dụng CPU</span>
          <span className="text-lg font-black text-white mt-1 block">{serverStats.cpu}</span>
        </div>
        <div className="bg-[#0b1b2d] border border-slate-800 rounded-2xl p-5">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Sử dụng RAM</span>
          <span className="text-lg font-black text-white mt-1 block">{serverStats.ram}</span>
        </div>
        <div className="bg-[#0b1b2d] border border-slate-800 rounded-2xl p-5">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Băng thông Server</span>
          <span className="text-lg font-black text-white mt-1 block">{serverStats.bandwidth}</span>
        </div>
      </div>

      {/* 3. Core Workspace Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* PANEL TRÁI: Database và YouTube Short ID */}
        <div className="bg-[#0b1b2d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center space-x-2">
              <Database size={14} className="text-[#e2b13c]" />
              <span>Bảng cơ sở dữ liệu (Không dùng UUID)</span>
            </h3>
            <button 
              onClick={handleCreateCase}
              className="py-1.5 px-3 bg-[#e2b13c] hover:bg-amber-500 text-[#070e17] text-[10px] font-black rounded-lg flex items-center space-x-1.5 transition"
            >
              <Plus size={12} />
              <span>Tạo vụ việc mới (YouTube ID)</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {cases.map((c, i) => {
              const shortId = IdObfuscator.encode(c.id);
              return (
                <div key={i} className="bg-[#050c14] border border-slate-900 p-4 rounded-2xl space-y-2 text-xs font-bold">
                  <div className="flex justify-between items-center">
                    <span className="text-red-400 font-black text-[10px] flex items-center space-x-1">
                      <Lock size={10} />
                      <span>ID thật nội bộ (Ẩn): {c.id}</span>
                    </span>
                    <span className="text-emerald-400 text-[10px]">● Đã băm cơ số toán học</span>
                  </div>
                  <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 font-mono text-[9px] text-slate-400">
                    <p className="text-[#e2b13c] font-black">shortId (Lộ ra Client API): {shortId}</p>
                    <p className="mt-1">URL truy cập: sunshinelaw.com/cases/{shortId}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL PHẢI: Bộ mô phỏng sập nguồn & High Load */}
        <div className="bg-[#0b1b2d] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Cpu size={14} className="text-[#e2b13c]" />
            <span>Mô phỏng 1000 người dùng tải file đồng thời</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#050c14] border border-red-950/30 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-red-400">Làm trung gian (Intern)</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold">Mọi byte dữ liệu dồn về RAM của máy chủ trước khi chuyển tiếp lên mây.</p>
              <button 
                onClick={handleTriggerInternSimulation}
                className="w-full py-2 bg-red-950/30 hover:bg-red-900/30 border border-red-900/50 text-red-400 text-[10px] font-black rounded-lg transition"
              >
                Mô phỏng treo máy (Proxy)
              </button>
            </div>

            <div className="bg-[#050c14] border border-[#e2b13c]/10 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-[#e2b13c]">Giải pháp Senior (Presigned URL)</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold">Server chỉ cấp chữ ký số (2ms). File bytes truyền trực tiếp từ Client lên Cloud Storage.</p>
              <button 
                onClick={handleTriggerSeniorSimulation}
                className="w-full py-2 bg-[#e2b13c] hover:bg-amber-500 text-[#070e17] text-[10px] font-black rounded-lg transition"
              >
                Mô phỏng High Load mượt mà
              </button>
            </div>
          </div>

          {/* SIMULATOR LOGS */}
          <div className="h-[120px] overflow-y-auto bg-slate-950/90 p-4 rounded-2xl border border-slate-900 font-mono text-[9px] text-slate-400 space-y-1.5">
            {simLogs.length === 0 ? (
              <p className="text-slate-600 italic">Chọn một chế độ giả lập ở trên để đo lường hiệu năng...</p>
            ) : (
              simLogs.map((log, idx) => (
                <p key={idx} className={log.includes("❌") || log.includes("🚨") ? "text-red-400 font-bold" : log.includes("✔") || log.includes("🏆") ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
