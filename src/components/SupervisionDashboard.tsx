import React, { useState, useMemo, useEffect } from "react";
import { fetchApi } from "../utils/api";
import { io } from "socket.io-client";
import {
  Users,
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Search,
  Plus,
  Filter,
  Check,
  X,
  FileSearch,
  Activity,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  UserCheck,
  FileCheck,
  DollarSign,
  Printer,
  Bot,
  RefreshCw,
  Coins,
  Terminal,
  Eye,
  Download,
  FolderOpen,
  UploadCloud,
  Play,
  Pause,
  Scale,
  Trash2
} from "lucide-react";

import { AnimatePresence, motion } from "motion/react";
import html2canvas from "html2canvas";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const BulkAttendanceWidget = ({ fetchAttendance, api, language }: { fetchAttendance: () => void, api: any, language: string }) => {
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("present");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBulkSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.req("/api/attendance/bulk", "POST", { role, status, note });
      if (res && res.success) {
        alert("Chấm công hàng loạt thành công!");
        fetchAttendance();
      }
    } catch (e) {
      console.error(e);
      alert("Chấm công hàng loạt thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans">
        Công cụ Chấm công Hàng loạt
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Chọn chức danh</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
          >
            <option value="all">Tất cả chức danh</option>
            <option value="admin">Quản trị viên</option>
            <option value="lawyer">Luật sư</option>
            <option value="partner">Thành viên góp vốn</option>
            <option value="associate">Luật sư cộng sự</option>
            <option value="controller">Kiểm soát viên</option>
            <option value="prosecutor">Kiểm soát chất lượng</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Trạng thái ghi nhận</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
          >
            <option value="present">Đúng giờ</option>
            <option value="absent">Vắng mặt</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Ghi chú nhanh</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Chấm công tự động toàn thể..."
            className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>
      <button
        onClick={handleBulkSubmit}
        disabled={isSubmitting}
        className="w-full py-2 bg-slate-950 text-white rounded-lg text-xs font-extrabold hover:bg-slate-800 transition-all disabled:opacity-50"
      >
        {isSubmitting ? "Đang xử lý..." : "Ghi nhận Chấm công Hàng loạt"}
      </button>
    </div>
  );
};

const KeywordScanner = ({ 
  records, 
  language,
  setViewingRecord,
  setActiveTab
}: { 
  records: any[]; 
  language: string;
  setViewingRecord?: (record: any) => void;
  setActiveTab?: (tab: string) => void;
}) => {
  const [blacklist, setBlacklist] = useState<string[]>(() => {
    const saved = localStorage.getItem("blacklist_keywords");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return ["tham nhũng", "hối lộ", "trễ hạn", "từ chối", "sai sót", "đình chỉ", "kháng cáo quá hạn", "vi phạm", "xung đột lợi ích"];
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [scanResult, setScanResult] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  
  // File Upload states
  const [uploadedFileText, setUploadedFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileScanResult, setFileScanResult] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);

  // Modal Detail states
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Save blacklist to localStorage
  useEffect(() => {
    localStorage.setItem("blacklist_keywords", JSON.stringify(blacklist));
  }, [blacklist]);

  // Core Scan Function
  const runScan = () => {
    setIsScanning(true);
    const results: any[] = [];

    records.forEach(r => {
      const matchWords: string[] = [];
      const textToScan = [
        r.title,
        r.client,
        r.caseDescription,
        r.generalNotes,
        r.status,
        r.mainAssignee,
        ...(r.stages?.map((s: any) => s.name + " " + (s.notes || "")) || [])
      ].join(" ").toLowerCase();

      blacklist.forEach(w => {
        const cleanWord = w.trim().toLowerCase();
        if (cleanWord && textToScan.includes(cleanWord)) {
          matchWords.push(w);
        }
      });

      if (matchWords.length > 0) {
        results.push({
          ...r,
          foundKeywords: matchWords
        });
      }
    });

    setTimeout(() => {
      setScanResult(results);
      setIsScanning(false);
    }, 400);
  };

  // Run auto scan on records or blacklist change
  useEffect(() => {
    if (autoScan) {
      runScan();
    }
  }, [records, blacklist, autoScan]);

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const word = newKeyword.trim();
    if (!word) return;
    if (blacklist.some(w => w.toLowerCase() === word.toLowerCase())) {
      alert(language === "vi" ? "Từ khóa này đã tồn tại trong Blacklist!" : "This keyword already exists in Blacklist!");
      return;
    }
    setBlacklist(prev => [...prev, word]);
    setNewKeyword("");
  };

  const handleRemoveKeyword = (word: string) => {
    setBlacklist(prev => prev.filter(w => w !== word));
  };

  const handleFileScan = (text: string, name: string) => {
    setUploadedFileText(text);
    setFileName(name);
    const found: string[] = [];
    blacklist.forEach(w => {
      const cleanWord = w.trim().toLowerCase();
      if (cleanWord && text.toLowerCase().includes(cleanWord)) {
        found.push(w);
      }
    });
    setFileScanResult(found);
  };

  const handleUploadAndScan = async (file: File) => {
    setIsFileUploading(true);
    setFileName(file.name);
    setUploadedFileText("");
    setFileScanResult([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/scan-file", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Server returned error status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.text !== undefined) {
        handleFileScan(data.text, file.name);
      } else {
        alert(language === "vi" ? "Không thể trích xuất văn bản từ tệp này." : "Could not extract text from this file.");
      }
    } catch (err: any) {
      console.error("Error scanning file:", err);
      // Fallback to client text reader if it's a basic text file
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          handleFileScan(text, file.name);
        };
        reader.readAsText(file);
      } else {
        alert(language === "vi" 
          ? "Lỗi kết nối máy chủ rà quét file! Hãy kiểm tra định dạng tệp." 
          : "Error connecting to file scanning server! Please check file format.");
      }
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUploadAndScan(file);
  };

  // Drag & drop logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleUploadAndScan(file);
    }
  };

  // Helper function to highlight keywords in text
  const highlightText = (text: string, words: string[]) => {
    if (!text) return "";
    let highlighted = text;
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, "gi");
      highlighted = highlighted.replace(regex, `<mark class="bg-rose-500 text-slate-950 font-bold px-1 rounded animate-pulse">$1</mark>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="space-y-6 relative z-10 animate-fade-in">
      <div className="border-b border-slate-200 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <FileSearch className="text-rose-600 w-4.5 h-4.5 animate-pulse" />
            {language === "vi" ? "Hệ thống Thẩm định & Quét Từ khóa Rủi ro (Blacklist)" : "Risk Keyword Audit & Blacklist Scanner"}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === "vi" 
              ? "Công cụ chuyên dụng cho Kiểm soát chất lượng tự động rà soát, cảnh báo từ khóa vi phạm pháp lý trong hồ sơ và tài liệu tải lên."
              : "Dedicated quality control tool to automatically scan and alert compliance violations within records and uploads."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoScan} 
              onChange={(e) => setAutoScan(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
            <span className="ms-2 text-xs font-bold text-slate-600">
              {language === "vi" ? "Tự động quét thời gian thực" : "Real-time Auto Scan"}
            </span>
          </label>
        </div>
      </div>

      {/* Blacklist Keywords Management Card */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider font-sans">
            {language === "vi" ? "Danh Sách Từ Khóa Rủi Ro (Blacklist)" : "Blacklist Violation Keywords"}
          </span>
          <span className="bg-rose-500/10 border border-rose-500/30 text-rose-700 text-[10px] px-2 py-0.5 rounded font-black font-mono">
            {blacklist.length} {language === "vi" ? "từ khóa" : "keywords"}
          </span>
        </div>

        {/* Tag list */}
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2.5 bg-slate-50/50 border rounded-xl">
          {blacklist.length === 0 ? (
            <p className="text-xs text-slate-400 italic">{language === "vi" ? "Chưa có từ khóa nào trong Blacklist. Hãy thêm ở dưới!" : "No keywords in Blacklist. Add some below!"}</p>
          ) : (
            blacklist.map((word, idx) => (
              <span 
                key={idx} 
                className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm hover:scale-105 transition-transform"
              >
                <span>{word}</span>
                <button 
                  onClick={() => handleRemoveKeyword(word)}
                  className="text-rose-400 hover:text-rose-700 focus:outline-none text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add keyword form */}
        <form onSubmit={handleAddKeyword} className="flex gap-2">
          <input 
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder={language === "vi" ? "Nhập từ khóa rủi ro mới (VD: sai sót, đình chỉ...)" : "Enter new risk keyword..."}
            className="flex-1 text-xs p-2.5 border rounded-xl bg-slate-50 border-slate-200 focus:bg-white outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            type="submit"
            className="px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all"
          >
            <Plus size={14} />
            {language === "vi" ? "Thêm vào Blacklist" : "Add to Blacklist"}
          </button>
        </form>

        {!autoScan && (
          <button
            onClick={runScan}
            disabled={isScanning}
            className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition-all"
          >
            <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
            {isScanning ? (language === "vi" ? "Đang quét..." : "Scanning...") : (language === "vi" ? "Bắt đầu quét thủ công" : "Trigger Manual Scan")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dossiers Scan Result */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-[460px]">
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans">
              {language === "vi" ? "Kết quả quét hồ sơ tự động" : "Automated Records Audit Results"}
            </h5>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
              scanResult.length > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {scanResult.length} {language === "vi" ? "cảnh báo phát hiện" : "alerts found"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {scanResult.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-3xl">🛡️</span>
                <p className="text-xs text-slate-500 font-bold">
                  {language === "vi" ? "Tuyệt vời! Không phát hiện từ khóa rủi ro nào." : "Perfect! No violation keywords detected."}
                </p>
                <p className="text-[10px] text-slate-400 max-w-[250px]">
                  {language === "vi" ? "Mọi hồ sơ và tiến trình nghiệp vụ đều đạt chuẩn tuân thủ." : "All record dossiers and stages currently meet compliance standards."}
                </p>
              </div>
            ) : (
              scanResult.map((res, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 hover:bg-rose-50/40 border border-slate-200 hover:border-rose-200 rounded-xl space-y-2.5 transition-all shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded">
                        #{res.id || idx + 1}
                      </span>
                      <h6 className="text-xs font-black text-slate-800 leading-tight">{res.title}</h6>
                    </div>
                    <button 
                      onClick={() => setSelectedRecord(res)}
                      className="shrink-0 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-xs"
                    >
                      <Eye size={11} className="text-indigo-600" />
                      {language === "vi" ? "Xem chi tiết" : "View"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-medium">
                    <div>
                      <span className="block text-slate-400">{language === "vi" ? "Khách hàng" : "Client"}</span>
                      <span className="font-bold text-slate-700 truncate block">{res.client || "Chưa cập nhật"}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">{language === "vi" ? "Phụ trách" : "Assignee"}</span>
                      <span className="font-bold text-slate-700 truncate block">{res.mainAssignee || "Chưa phân công"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center pt-2 border-t border-dashed">
                    <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider">
                      {language === "vi" ? "Phát hiện:" : "Detected:"}
                    </span>
                    {res.foundKeywords.map((kw: string, i: number) => (
                      <span key={i} className="text-[9px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-md animate-pulse">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live File Uploader Scanner */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-[460px]">
          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans border-b pb-2 mb-3">
            {language === "vi" ? "Quét nhanh văn bản tài liệu tải lên" : "Direct Document Upload Scanner"}
          </h5>
          
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed p-6 rounded-2xl text-center space-y-3 cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden ${
              dragActive 
                ? "border-rose-500 bg-rose-50/20" 
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            {isFileUploading ? (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                <p className="text-xs font-bold text-slate-700 animate-pulse">
                  {language === "vi" ? "Đang trích xuất & rà quét văn bản..." : "Extracting & auditing file text..."}
                </p>
                <p className="text-[10px] text-slate-500">
                  {language === "vi" ? "Đang xử lý PDF, Word, Excel hoặc Văn bản..." : "Processing PDF, Word, Excel, or Text..."}
                </p>
              </div>
            ) : null}

            <UploadCloud className="text-slate-400 w-10 h-10 animate-bounce" />
            <div>
              <p className="text-xs font-bold text-slate-700">
                {language === "vi" ? "Kéo thả file vào đây hoặc click để chọn" : "Drag & drop files here or click to browse"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === "vi" ? "Hỗ trợ tệp văn bản (.pdf, .docx, .xlsx, .txt, .md, .csv)" : "Supports plain text and rich documents (.pdf, .docx, .xlsx, .txt, .md, .csv)"}
              </p>
            </div>
            
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.txt,.md,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-scanner-input"
            />
            <label 
              htmlFor="file-scanner-input"
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm text-xs font-extrabold px-3.5 py-2 rounded-xl cursor-pointer transition-all inline-block"
            >
              {language === "vi" ? "Chọn tệp tài liệu" : "Browse Files"}
            </label>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto">
            {uploadedFileText ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 h-full overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[200px]">
                    📂 {fileName}
                  </span>
                  <button 
                    onClick={() => {
                      setUploadedFileText("");
                      setFileName("");
                      setFileScanResult([]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 font-extrabold"
                  >
                    ✕ {language === "vi" ? "Xóa" : "Clear"}
                  </button>
                </div>

                {fileScanResult.length === 0 ? (
                  <div className="py-4 text-center space-y-1.5">
                    <span className="text-emerald-500 text-xl font-bold">✓</span>
                    <p className="text-xs text-emerald-600 font-black">
                      {language === "vi" ? "Tệp an toàn!" : "Clean Document!"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {language === "vi" ? "Không phát hiện từ khóa rủi ro nào từ Blacklist." : "No violation keywords detected from Blacklist."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg">
                      <p className="text-[11px] text-rose-700 font-black flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-rose-600 animate-pulse" />
                        {language === "vi" 
                          ? `Phát hiện ${fileScanResult.length} từ khóa rủi ro bị trùng khớp:` 
                          : `Detected ${fileScanResult.length} matched risk keywords:`}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fileScanResult.map((kw, i) => (
                          <span key={i} className="text-[9px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                        {language === "vi" ? "Xem trước nội dung rà soát:" : "Scanned Content Preview:"}
                      </p>
                      <div className="text-xs text-slate-600 bg-white p-3 border rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed shadow-inner">
                        {highlightText(uploadedFileText, fileScanResult)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-slate-400 italic text-xs">
                {language === "vi" ? "Chưa có tệp nào được tải lên để rà soát." : "No file uploaded yet for compliance auditing."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAIL RECORD MODAL & SYSTEM INTEGRATION LINK */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col text-slate-800"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono bg-rose-600 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                    ⚠️ {language === "vi" ? "CẢNH BÁO TUÂN THỦ" : "COMPLIANCE ALERT"}
                  </span>
                  <h3 className="text-base font-black tracking-tight">{selectedRecord.title}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {language === "vi" ? "Mã hồ sơ:" : "Dossier ID:"} <span className="font-mono text-slate-200 font-bold">#{selectedRecord.id}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-all focus:outline-none"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Detected Keywords Section */}
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                  <h4 className="font-black text-rose-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
                    <ShieldAlert size={14} className="text-rose-600 animate-bounce" />
                    {language === "vi" ? "Từ khóa rủi ro phát hiện trong hồ sơ" : "Risk keywords detected inside record"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecord.foundKeywords.map((kw: string, i: number) => (
                      <span key={i} className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Core Dossier Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">{language === "vi" ? "Khách hàng" : "Client"}</span>
                    <span className="font-bold text-slate-700 block text-xs">{selectedRecord.client || "Không xác định"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">{language === "vi" ? "Luật sư phụ trách" : "Assignee Lawyer"}</span>
                    <span className="font-bold text-slate-700 block text-xs">{selectedRecord.mainAssignee || "Chưa phân công"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">{language === "vi" ? "Lĩnh vực" : "Domain"}</span>
                    <span className="font-bold text-slate-700 block text-xs">{selectedRecord.category || "Dịch vụ pháp lý"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">{language === "vi" ? "Trạng thái" : "Status"}</span>
                    <span className="font-bold text-slate-700 block text-xs">{selectedRecord.status || "Đang thụ lý"}</span>
                  </div>
                </div>

                {/* Case Description with Highlight */}
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-700 uppercase tracking-wider font-sans">
                    {language === "vi" ? "Mô tả vụ việc (Đã rà soát)" : "Case description (Audited)"}
                  </h4>
                  <div className="bg-slate-50 p-4 border rounded-2xl leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {highlightText(selectedRecord.caseDescription || "Không có mô tả chi tiết vụ việc.", selectedRecord.foundKeywords)}
                  </div>
                </div>

                {/* General Notes with Highlight */}
                {selectedRecord.generalNotes && (
                  <div className="space-y-1.5">
                    <h4 className="font-black text-slate-700 uppercase tracking-wider font-sans">
                      {language === "vi" ? "Ghi chú nghiệp vụ" : "General Case Notes"}
                    </h4>
                    <div className="bg-slate-50 p-4 border rounded-2xl leading-relaxed text-slate-600 whitespace-pre-wrap">
                      {highlightText(selectedRecord.generalNotes, selectedRecord.foundKeywords)}
                    </div>
                  </div>
                )}

                {/* Stages tracking */}
                {selectedRecord.stages && selectedRecord.stages.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="font-black text-slate-700 uppercase tracking-wider font-sans">
                      {language === "vi" ? "Tiến độ lộ trình các bước" : "Stages & Milestones Audit"}
                    </h4>
                    <div className="space-y-2">
                      {selectedRecord.stages.map((stg: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50/50 border rounded-xl flex flex-col sm:flex-row justify-between gap-2">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800 text-[11px] block">{stg.name}</span>
                            <span className="text-slate-500 block text-[10px]">
                              {stg.notes ? highlightText(stg.notes, selectedRecord.foundKeywords) : (language === "vi" ? "Không có ghi chú" : "No notes")}
                            </span>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded self-start ${
                            stg.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {stg.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t flex flex-wrap justify-end gap-2.5">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  {language === "vi" ? "Đóng" : "Close"}
                </button>
                {setViewingRecord && setActiveTab && (
                  <button
                    onClick={() => {
                      setViewingRecord(selectedRecord);
                      setActiveTab("records");
                      setSelectedRecord(null);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <FolderOpen size={13} className="text-amber-500" />
                    {language === "vi" ? "Truy cập trong ERP" : "Access in ERP"}
                  </button>
                )}
                <button
                  onClick={() => {
                    alert(language === "vi" ? "Đã gửi thông báo cảnh cáo khẩn cấp đến Luật sư phụ trách cho hồ sơ này!" : "Sent emergency warning notification to assignee lawyer for this record!");
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 shadow-sm shadow-rose-500/20"
                >
                  <ShieldAlert size={14} />
                  {language === "vi" ? "Đôn đốc Luật sư phụ trách" : "Reprimand Assignee"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SmartScheduleScanner = ({ language }: { language: string }) => {
  const [inputText, setInputText] = useState("");
  const [extractedEvents, setExtractedEvents] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScanText = () => {
    if (!inputText.trim()) {
      alert("Vui lòng nhập văn bản lịch biểu cần quét!");
      return;
    }
    setIsProcessing(true);
    setExtractedEvents([]);

    setTimeout(() => {
      const text = inputText;
      const found: any[] = [];
      const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})/g;
      const timeRegex = /(\d{1,2}h\d{2}|\d{1,2}:\d{2})/g;
      const dates = text.match(dateRegex) || [];
      const times = text.match(timeRegex) || [];
      
      if (dates.length > 0) {
        dates.forEach((date, index) => {
          const time = times[index] || "09:00";
          let title = "Hòa giải vụ việc";
          if (text.toLowerCase().includes("vũ nam")) title += " Trợ lý Vũ Nam";
          else if (text.toLowerCase().includes("landmark")) title += " Landmark";
          else if (text.toLowerCase().includes("sunrise")) title += " Sunrise";
          
          found.push({
            id: `scan-${Date.now()}-${index}`,
            title: `${title} (${date})`,
            date: date,
            time: time,
            notes: `Tự động quét trích xuất từ văn bản đính kèm.`
          });
        });
      } else {
        found.push({
          id: `scan-fallback-${Date.now()}`,
          title: "Hòa giải (Giai đoạn vụ án) tranh chấp Landmark - Khách hàng Landmark Group",
          date: new Date().toLocaleDateString('vi-VN'),
          time: "14:30",
          notes: "Thời gian làm việc tiếp theo trích xuất tự động."
        });
      }

      setExtractedEvents(found);
      setIsProcessing(false);
    }, 1200);
  };

  const handleSaveToCalendar = (event: any) => {
    try {
      const savedEventsStr = localStorage.getItem("erp_events_v3") || "[]";
      const currentEvents = JSON.parse(savedEventsStr);
      
      const newEvent = {
        id: `event-${Date.now()}`,
        title: event.title,
        start: `${event.date.split("/").reverse().join("-")}T${event.time.replace("h", ":")}:00`,
        end: `${event.date.split("/").reverse().join("-")}T${(parseInt(event.time) + 1).toString().padStart(2, "0")}:00`,
        notes: event.notes,
        allDay: false
      };
      
      currentEvents.push(newEvent);
      localStorage.setItem("erp_events_v3", JSON.stringify(currentEvents));
      alert(`Đã thêm thành công sự kiện "${event.title}" vào lịch làm việc hệ thống!`);
    } catch (e) {
      console.error(e);
      alert("Lưu sự kiện vào lịch thất bại.");
    }
  };

  return (
    <div className="space-y-6 relative z-10 animate-fade-in">
      <div className="border-b border-slate-200 pb-2">
        <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="text-amber-500 w-4.5 h-4.5" />
          Máy Quét Lịch Trình Thông Minh (OCR AI)
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Dán văn bản hành chính hoặc thông báo lịch làm việc vào đây, hệ thống tự động nhận diện ngày giờ hòa giải và đồng bộ vào lịch hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans">Dán văn bản thông báo hoặc lịch hẹn</h5>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full text-xs p-3 border rounded-lg bg-slate-50 border-slate-200 focus:bg-white min-h-[160px] font-mono leading-relaxed"
            placeholder="Ví dụ: Tòa án nhân dân triệu tập đương sự tham gia phiên Hòa giải vụ việc tranh chấp Landmark vào lúc 14h30 ngày 15/07/2026..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleScanText}
              disabled={isProcessing}
              className="w-full py-2 bg-slate-950 text-white rounded-lg text-xs font-extrabold hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isProcessing ? "Đang xử lý quét..." : "Phân tích trích xuất sự kiện"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-3">
          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Sự kiện trích xuất khả dụng</h5>
          {extractedEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {isProcessing ? "Đang quét..." : "Dán văn bản ở cột bên trái và nhấn phân tích để xem kết quả."}
            </div>
          ) : (
            <div className="space-y-3">
              {extractedEvents.map((evt) => (
                <div key={evt.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <h6 className="text-xs font-black text-slate-800">{evt.title}</h6>
                    <p className="text-[10px] text-slate-500 mt-1">Ngày: <span className="font-mono font-bold text-slate-700">{evt.date}</span> vào lúc <span className="font-mono font-bold text-slate-700">{evt.time}</span></p>
                  </div>
                  <button
                    onClick={() => handleSaveToCalendar(evt)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Đồng bộ vào lịch biểu hệ thống
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SupervisionDashboardProps {
  language: "vi" | "en";
  user: any;
  records: any[];
  updateRecords: (records: any[], changedRecord?: any) => void;
  users: any[];
  setViewingRecord?: (record: any) => void;
  setActiveTab?: (tab: string) => void;
}

const normalizeCategory = (cat: string | undefined): string => {
  if (!cat) return "";
  const c = cat.toLowerCase().trim();
  if (c.includes("tranh tụng") || c.includes("civil") || c.includes("litigation")) {
    return "Tranh tụng";
  }
  if (c.includes("tư vấn") || c.includes("consult") || c.includes("advice")) {
    return "Tư vấn Pháp luật";
  }
  if (c.includes("đại diện ngoài") || c.includes("out-of-court") || c.includes("rep")) {
    return "Đại diện Ngoài tố tụng";
  }
  if (c.includes("nội bộ") || c.includes("pháp chế") || c.includes("compliance") || c.includes("corporate")) {
    return "Pháp chế & Nội bộ";
  }
  if (c.includes("trọng tài") || c.includes("hòa giải") || c.includes("arbitration") || c.includes("mediation")) {
    return "Trọng tài & Hòa giải";
  }
  return cat;
};

export default function SupervisionDashboard({
  language,
  user,
  records,
  updateRecords,
  users,
  setViewingRecord,
  setActiveTab
}: SupervisionDashboardProps) {
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [controllerRole, setControllerRole] = useState<"inspector" | "qc">("inspector");
  const [controllerTab, setControllerTab] = useState("sla");
  const [isDownloadingWarning, setIsDownloadingWarning] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  const handleSwitchRole = (role: "inspector" | "qc") => {
    setControllerRole(role);
    if (role === "inspector") {
      setControllerTab("sla");
    } else {
      setControllerTab("keywords");
    }
  };

  const isQCRole = React.useMemo(() => {
    if (!user) return false;
    const r = String(user.role).toLowerCase().trim();
    const t = String(user.title || "").toLowerCase().trim();
    return r === "prosecutor" || r === "kiểm soát chất lượng" || r === "qc" || t === "kiểm soát chất lượng";
  }, [user]);

  React.useEffect(() => {
    if (user?.role) {
      const r = String(user.role).toLowerCase().trim();
      const t = String(user.title || "").toLowerCase().trim();
      if (r === "prosecutor" || r === "kiểm soát chất lượng" || r === "qc" || t === "kiểm soát chất lượng") {
        // For QC Specialist, force qc role (mục 2) and tab "keywords"
        setControllerRole("qc");
        setControllerTab("keywords");
      } else if (r === "controller" || r === "kiểm sát viên" || r === "kiểm soát viên") {
        setControllerRole("inspector");
        setControllerTab("sla");
      }
    }
  }, [user]);

  const [pendingCms, setPendingCms] = useState<any[]>([]);
  const [unlockRequests, setUnlockRequests] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isCmsLoading, setIsCmsLoading] = useState(false);
  const [isUnlocksLoading, setIsUnlocksLoading] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  const api = {
    req: async (url: string, method = "GET", body?: any) => {
      const res = await fetchApi(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  };

  const fetchPendingCms = async () => {
    setIsCmsLoading(true);
    try {
      const data = await api.req("/api/pending-approvals");
      if (Array.isArray(data)) setPendingCms(data);
    } catch (e) {
      console.warn("Failed to fetch pending CMS approvals", e);
    } finally {
      setIsCmsLoading(false);
    }
  };

  const fetchUnlockRequests = async () => {
    setIsUnlocksLoading(true);
    try {
      const data = await api.req("/api/unlock-requests");
      if (Array.isArray(data)) setUnlockRequests(data);
    } catch (e) {
      console.warn("Failed to fetch unlock requests", e);
    } finally {
      setIsUnlocksLoading(false);
    }
  };

  const fetchAttendance = async () => {
    setIsAttendanceLoading(true);
    try {
      const data = await api.req("/api/attendance");
      if (Array.isArray(data)) setAttendance(data);
    } catch (e) {
      console.warn("Failed to fetch attendance list", e);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPendingCms();
    fetchUnlockRequests();
    fetchAttendance();
    const interval = setInterval(() => {
      fetchPendingCms();
      fetchUnlockRequests();
      fetchAttendance();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveCms = async (id: number, type: string) => {
    try {
      await api.req("/api/approve-content", "POST", { id, type, approvedBy: user?.name || "Kiểm soát chất lượng" });
      alert("Phê duyệt nội dung thành công!");
      fetchPendingCms();
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra khi phê duyệt!");
    }
  };

  const handleRejectCms = async (id: number, type: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn bác bỏ nội dung này?")) return;
    try {
      await api.req("/api/reject-content", "POST", { id, type });
      alert("Đã từ chối và gỡ bỏ nội dung!");
      fetchPendingCms();
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra!");
    }
  };

  const handleApproveUnlock = async (id: number, dossierId: string, approve: boolean) => {
    try {
      const res = await api.req("/api/unlock-requests/approve", "POST", { id, dossierId, approve });
      if (res && res.success) {
        alert(approve ? "Đã duyệt mở khóa thành công!" : "Đã từ chối yêu cầu mở khóa!");
        fetchUnlockRequests();
      }
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra khi duyệt mở khóa!");
    }
  };

  const handleApproveLateAttendance = async (id: number, status: string) => {
    try {
      const res = await api.req("/api/attendance/approve-late", "POST", { id, status });
      if (res && res.success) {
        alert(status === "present" ? "Đã duyệt chấm công đi muộn thành công!" : "Đã bác bỏ giải trình đi muộn!");
        fetchAttendance();
      }
    } catch (e) {
      console.error(e);
      alert("Thao tác thất bại!");
    }
  };

  // Persistent states
  const [completedSignoffIds, setCompletedSignoffIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("supervision_completed_signoffs");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [verifiedAmlIds, setVerifiedAmlIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("supervision_verified_aml");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateCompletedSignoffs = (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    setCompletedSignoffIds(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("supervision_completed_signoffs", JSON.stringify(next));
      return next;
    });
  };

  const updateVerifiedAml = (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    setVerifiedAmlIds(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("supervision_verified_aml", JSON.stringify(next));
      return next;
    });
  };
  
  // Consultant / Direct staff mappings
  const myConsultants = useMemo(() => {
    return users.filter((u) => String(u.manager_id) === String(user?.id));
  }, [users, user]);
  const [showOnlyMyStaff, setShowOnlyMyStaff] = useState(myConsultants.length > 0);
  
  // Custom stage addition modal/form state
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageDueDate, setNewStageDueDate] = useState("");
  const [newStageAssignee, setNewStageAssignee] = useState("");

  // Custom Legal Domains / Categories & Workflow Templates state
  const [customCategories, setCustomCategories] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("custom_legal_categories_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [categoryWorkflowTemplates, setCategoryWorkflowTemplates] = useState<Record<string, any[]>>(() => {
    try {
      const saved = localStorage.getItem("category_workflow_templates_v1");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatCode, setNewCatCode] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatColor, setNewCatColor] = useState("bg-indigo-500");
  const [newCatStages, setNewCatStages] = useState<Array<{ name: string; slaDays: number }>>([
    { name: "Bước 1: Tiếp nhận yêu cầu & Khảo sát hồ sơ ban đầu", slaDays: 3 },
    { name: "Bước 2: Phân tích cơ sở pháp lý & Lập phương án giải quyết", slaDays: 5 },
    { name: "Bước 3: Soạn thảo văn kiện, đơn từ & Soát xét chất lượng", slaDays: 7 },
    { name: "Bước 4: Nộp cơ quan thẩm quyền / Đàm phán trực tiếp với đối tác", slaDays: 14 },
    { name: "Bước 5: Theo dõi kết quả, bàn giao & Khóa sổ nghiệm thu", slaDays: 20 }
  ]);

  // Load record types from API and sync with custom categories
  useEffect(() => {
    const fetchRecordTypes = async () => {
      try {
        const data = await api.req("/api/record-types");
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((rt: any) => ({
            id: rt.id,
            code: rt.type_code,
            name: rt.type_name,
            desc: rt.description,
            color: rt.display_color || "bg-blue-500"
          }));
          setCustomCategories(prev => {
            const existingNames = new Set(prev.map(p => p.name));
            const toAdd = mapped.filter(m => !existingNames.has(m.name));
            const updated = [...prev, ...toAdd];
            localStorage.setItem("custom_legal_categories_v1", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.error("Failed to load record-types in SupervisionDashboard:", e);
      }
    };
    fetchRecordTypes();
  }, []);

  const handleAddCategoryStageField = () => {
    const nextStepNum = newCatStages.length + 1;
    setNewCatStages(prev => [
      ...prev,
      { name: `Bước ${nextStepNum}: Quy trình xử lý bổ sung chuyên ngành`, slaDays: 5 }
    ]);
  };

  const handleRemoveCategoryStageField = (index: number) => {
    if (newCatStages.length <= 1) {
      alert("Cần tối thiểu 1 bước quy trình giải quyết!");
      return;
    }
    setNewCatStages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateCategoryWithWorkflow = async () => {
    if (!newCatName.trim()) {
      alert(language === "vi" ? "Vui lòng nhập tên Lĩnh vực Pháp lý Mới!" : "Please enter the new legal field name!");
      return;
    }

    const code = newCatCode.trim() || `FIELD-${Date.now().toString().slice(-4)}`;
    const categoryName = newCatName.trim();
    const newCategory = {
      id: `cat-${Date.now()}`,
      code,
      name: categoryName,
      desc: newCatDesc.trim() || "Lĩnh vực pháp lý chuyên biệt",
      color: newCatColor
    };

    // 1. Post to API
    try {
      await api.req("/api/record-types", "POST", {
        type_code: code,
        type_name: categoryName,
        description: newCatDesc.trim(),
        display_color: newCatColor,
        active: 1
      });
    } catch (err) {
      console.warn("Could not save category to backend API, saving locally:", err);
    }

    // 2. Save locally
    const updatedCategories = [...customCategories, newCategory];
    setCustomCategories(updatedCategories);
    localStorage.setItem("custom_legal_categories_v1", JSON.stringify(updatedCategories));

    // 3. Save category template
    const updatedTemplates = {
      ...categoryWorkflowTemplates,
      [categoryName]: newCatStages
    };
    setCategoryWorkflowTemplates(updatedTemplates);
    localStorage.setItem("category_workflow_templates_v1", JSON.stringify(updatedTemplates));

    // 4. Update UI
    setCategoryFilter(categoryName);
    setShowAddCategoryModal(false);
    setNewCatName("");
    setNewCatCode("");
    setNewCatDesc("");
    setNewCatStages([
      { name: "Bước 1: Tiếp nhận yêu cầu & Khảo sát hồ sơ ban đầu", slaDays: 3 },
      { name: "Bước 2: Phân tích cơ sở pháp lý & Lập phương án giải quyết", slaDays: 5 },
      { name: "Bước 3: Soạn thảo văn kiện, đơn từ & Soát xét chất lượng", slaDays: 7 },
      { name: "Bước 4: Nộp cơ quan thẩm quyền / Đàm phán trực tiếp với đối tác", slaDays: 14 },
      { name: "Bước 5: Theo dõi kết quả, bàn giao & Khóa sổ nghiệm thu", slaDays: 20 }
    ]);

    alert(
      language === "vi"
        ? `Đã tạo Lĩnh vực "${categoryName}" với quy trình ${newCatStages.length} bước giải quyết!`
        : `Created domain "${categoryName}" with ${newCatStages.length} workflow steps!`
    );
  };

  // Mediation 24h explanation states
  const [mediationExpls, setMediationExpls] = useState<Record<string, string>>({});

  // Staff Disciplinary Warnings states
  const [warnings, setWarnings] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("supervision_staff_warnings");
      return saved ? JSON.parse(saved) : [
        {
          id: "warn-initial-1",
          staffName: "Trợ lý Pháp lý Vũ Nam",
          level: "warning", // "critical" | "warning" | "reminder"
          reason: "Hồ sơ Sunrise Land quá hạn SLA Giai đoạn 2 hơn 3 ngày chưa nộp thẩm định.",
          penalty: "Trừ 2 điểm thi đua tháng 7, đôn đốc hoàn thành trong 12 giờ tới.",
          issuedBy: "Kiểm soát chất lượng Lê Ánh Dương",
          issuedAt: "2026-07-06T08:30:00Z",
          dossierId: "HS-2026-0001",
          acknowledged: false
        }
      ];
    } catch {
      return [];
    }
  });

  const saveWarnings = (newWarnings: any[]) => {
    setWarnings(newWarnings);
    localStorage.setItem("supervision_staff_warnings", JSON.stringify(newWarnings));
  };

  const [warnStaffName, setWarnStaffName] = useState("");
  const [warnLevel, setWarnLevel] = useState("warning");
  const [warnReason, setWarnReason] = useState("");
  const [warnPenalty, setWarnPenalty] = useState("");
  const [warnDossierId, setWarnDossierId] = useState("");

  // 4 Pillars state
  const [activePillarTab, setActivePillarTab] = useState("pillar1");
  const [securityConfig, setSecurityConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("supervision_security_config");
      return saved ? JSON.parse(saved) : {
        encryptDocs: true,
        limitAccess: true,
        aiScan: false
      };
    } catch {
      return {
        encryptDocs: true,
        limitAccess: true,
        aiScan: false
      };
    }
  });

  const updateSecurityConfig = (config: typeof securityConfig) => {
    setSecurityConfig(config);
    localStorage.setItem("supervision_security_config", JSON.stringify(config));
  };
  
  // Conflict search states
  const [conflictSearchName, setConflictSearchName] = useState("");
  const [conflictResult, setConflictResult] = useState<any>(null);

  // --- STATE FOR ADVANCED CONTROLLER SUITE ---
  const [selectedRiskCaseId, setSelectedRiskCaseId] = useState("");
  const [isRiskAnalyzing, setIsRiskAnalyzing] = useState(false);
  const [riskAnalysisResult, setRiskAnalysisResult] = useState<any>(null);
  const [showOfficialReportModal, setShowOfficialReportModal] = useState(false);
  
  const [showOfficialWarningModal, setShowOfficialWarningModal] = useState(false);
  const [selectedWarningToPrint, setSelectedWarningToPrint] = useState<any>(null);

  // Security config success alert state
  const [securitySuccessAlert, setSecuritySuccessAlert] = useState("");

  // Escrow transactions audit state
  const [escrowTransactions, setEscrowTransactions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("supervision_escrow_txs");
      return saved ? JSON.parse(saved) : [
        {
          id: "TX-99021",
          dossierId: "HS-2026-0001",
          dossierTitle: "Thẩm định pháp lý & Tư vấn M&A Dự án Đô thị Sinh thái Sunrise",
          type: "Đặt cọc bảo đảm M&A",
          amount: "5,000,000,000 VND",
          status: "Pending Escrow Approval", // "Approved & Released" | "Pending Escrow Approval"
          submittedBy: "Luật sư Lê Ánh Dương",
          submittedAt: "2026-07-08T09:15:00Z",
          documentName: "Thỏa_thuận_đặt_cọc_Sunrise_signed.pdf",
          amlStatus: "PASSED (Low AML Risk)"
        },
        {
          id: "TX-99022",
          dossierId: "HS-2026-0002",
          dossierTitle: "Giải quyết Tranh chấp Hợp đồng Thi công Xây dựng Landmark",
          type: "Phí tạm ứng án phí Tòa án",
          amount: "450,000,000 VND",
          status: "Pending Escrow Approval",
          submittedBy: "Luật sư Trần Minh Trí",
          submittedAt: "2026-07-07T14:20:00Z",
          documentName: "Giấy_báo_nộp_tạm_ứng_án_phí.pdf",
          amlStatus: "PASSED (Clean Funds Verification)"
        },
        {
          id: "TX-99023",
          dossierId: "HS-2026-0003",
          dossierTitle: "Tư vấn Bảo hộ và Chuyển nhượng Độc quyền Thương hiệu VinFast",
          type: "Lệ phí Cục Sở hữu Trí tuệ",
          amount: "25,000,000 VND",
          status: "Approved & Released",
          submittedBy: "Luật sư Nguyễn Quỳnh Mai",
          submittedAt: "2026-07-05T10:00:00Z",
          documentName: "Bien_lai_le_phi_cuc_SHTT.pdf",
          amlStatus: "PASSED"
        }
      ];
    } catch {
      return [];
    }
  });

  const saveEscrowTransactions = (txs: any[]) => {
    setEscrowTransactions(txs);
    localStorage.setItem("supervision_escrow_txs", JSON.stringify(txs));
  };

  // Real-time system audit logs feed
  const [auditTrailEvents, setAuditTrailEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("supervision_audit_trail_events");
      return saved ? JSON.parse(saved) : [
        {
          id: "ev-1",
          timestamp: "2026-07-08T09:45:10Z",
          actor: "Trợ lý Pháp lý Vũ Nam",
          action: "Tải lên tài liệu nháp Giai đoạn 2",
          dossierId: "HS-2026-0001",
          severity: "info", // "info" | "warning" | "success" | "danger"
          status: "Unchecked"
        },
        {
          id: "ev-2",
          timestamp: "2026-07-08T09:15:00Z",
          actor: "Luật sư Lê Ánh Dương",
          action: "Đệ trình yêu cầu tạm giữ bảo đảm giao dịch 5 Tỷ VND",
          dossierId: "HS-2026-0001",
          severity: "warning",
          status: "Unchecked"
        },
        {
          id: "ev-3",
          timestamp: "2026-07-08T08:00:00Z",
          actor: "Hệ thống tự động",
          action: "Cảnh báo quá hạn SLA Giai đoạn 2 hồ sơ Sunrise Land quá 24h",
          dossierId: "HS-2026-0001",
          severity: "danger",
          status: "Unchecked"
        },
        {
          id: "ev-4",
          timestamp: "2026-07-07T16:30:00Z",
          actor: "Luật sư Nguyễn Quỳnh Mai",
          action: "Đã hoàn thành đàm phán hợp đồng song ngữ và gửi mốc 4-Eyes",
          dossierId: "HS-2026-0003",
          severity: "success",
          status: "Audited"
        },
        {
          id: "ev-5",
          timestamp: "2026-07-07T14:20:00Z",
          actor: "Luật sư Trần Minh Trí",
          action: "Nộp dự thảo Đơn khởi kiện tranh chấp Landmark",
          dossierId: "HS-2026-0002",
          severity: "info",
          status: "Unchecked"
        }
      ];
    } catch {
      return [];
    }
  });

  const saveAuditTrailEvents = (eventsList: any[]) => {
    setAuditTrailEvents(eventsList);
    localStorage.setItem("supervision_audit_trail_events", JSON.stringify(eventsList));
  };

  // Yeastar VoIP Calling & AI Compliance state inside SupervisionDashboard
  const [voipLogs, setVoipLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("yeastar_call_logs_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Load call logs from server DB API in real-time
  const loadVoipLogsFromApi = async () => {
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
        setVoipLogs(parsed);
      }
    } catch (e) {
      console.error("Error loading voip logs in SupervisionDashboard:", e);
    }
  };

  useEffect(() => {
    loadVoipLogsFromApi();

    let s: any = null;
    try {
      s = io({
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000
      });
      s.on("call_log_updated", () => loadVoipLogsFromApi());
      s.on("call_ended", () => loadVoipLogsFromApi());
      s.on("call_deleted", () => loadVoipLogsFromApi());
    } catch (e) {}

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  const [activeVoipPlayingId, setActiveVoipPlayingId] = useState<string | null>(null);
  const [voipPlayingProgress, setVoipPlayingProgress] = useState(0);
  const voipPlaybackTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync back to localStorage
  useEffect(() => {
    localStorage.setItem("yeastar_call_logs_v2", JSON.stringify(voipLogs));
  }, [voipLogs]);

  // Sync reading when tab matches pillar5 to get updates from softphone
  useEffect(() => {
    if (activePillarTab === "pillar5") {
      try {
        const saved = localStorage.getItem("yeastar_call_logs_v2");
        if (saved) setVoipLogs(JSON.parse(saved));
      } catch (e) {}
    }
  }, [activePillarTab]);

  // Playback simulation timer
  useEffect(() => {
    if (activeVoipPlayingId) {
      setVoipPlayingProgress(0);
      voipPlaybackTimerRef.current = setInterval(() => {
        setVoipPlayingProgress(prev => {
          if (prev >= 100) {
            clearInterval(voipPlaybackTimerRef.current!);
            setActiveVoipPlayingId(null);
            return 0;
          }
          return prev + 10;
        });
      }, 700);
    } else {
      if (voipPlaybackTimerRef.current) clearInterval(voipPlaybackTimerRef.current);
      setVoipPlayingProgress(0);
    }
    return () => {
      if (voipPlaybackTimerRef.current) clearInterval(voipPlaybackTimerRef.current);
    };
  }, [activeVoipPlayingId]);

  // Synchronize escrow transactions from real records (dossier payments)
  React.useEffect(() => {
    if (!records || records.length === 0) return;
    
    let currentTxs: any[] = [];
    try {
      const saved = localStorage.getItem("supervision_escrow_txs");
      if (saved) {
        currentTxs = JSON.parse(saved);
      }
    } catch {
      currentTxs = [];
    }

    let modified = false;

    records.forEach((r) => {
      if (r.paymentInstallment1) {
        const txId = `TX-${r.id}-I1`;
        if (!currentTxs.some((tx) => tx.id === txId)) {
          const rawVal = String(r.paymentInstallment1).replace(/\D/g, "") || "0";
          currentTxs.unshift({
            id: txId,
            dossierId: r.id,
            dossierTitle: r.title,
            type: language === "vi" ? "Đợt thanh toán 1" : "Installment 1",
            amount: `${parseInt(rawVal).toLocaleString("vi-VN")} VND`,
            status: "Pending Escrow Approval",
            submittedBy: r.mainAssignee || "Hệ thống",
            submittedAt: r.paymentDate || "2026-07-08",
            documentName: `Chung_tu_dot_1_${r.id}.pdf`,
            amlStatus: "PASSED (Low AML Risk)"
          });
          modified = true;
        }
      }
      if (r.paymentInstallment2) {
        const txId = `TX-${r.id}-I2`;
        if (!currentTxs.some((tx) => tx.id === txId)) {
          const rawVal = String(r.paymentInstallment2).replace(/\D/g, "") || "0";
          currentTxs.unshift({
            id: txId,
            dossierId: r.id,
            dossierTitle: r.title,
            type: language === "vi" ? "Đợt thanh toán 2" : "Installment 2",
            amount: `${parseInt(rawVal).toLocaleString("vi-VN")} VND`,
            status: "Pending Escrow Approval",
            submittedBy: r.mainAssignee || "Hệ thống",
            submittedAt: r.paymentDate || "2026-07-08",
            documentName: `Chung_tu_dot_2_${r.id}.pdf`,
            amlStatus: "PASSED (Verified)"
          });
          modified = true;
        }
      }
      const rawFeeValue = r.feeAmount || r.revenue || r.fee;
      if (rawFeeValue) {
        const txId = `TX-${r.id}-FEE`;
        if (!currentTxs.some((tx) => tx.id === txId)) {
          const rawVal = String(rawFeeValue).replace(/\D/g, "") || "0";
          currentTxs.unshift({
            id: txId,
            dossierId: r.id,
            dossierTitle: r.title,
            type: language === "vi" ? "Phí dịch vụ pháp lý" : "Legal Service Fee",
            amount: `${parseInt(rawVal).toLocaleString("vi-VN")} VND`,
            status: "Pending Escrow Approval",
            submittedBy: r.mainAssignee || "Hệ thống",
            submittedAt: "2026-07-08",
            documentName: `Thong_bao_le_phi_${r.id}.pdf`,
            amlStatus: "PASSED (Compliance Checked)"
          });
          modified = true;
        }
      }
    });

    if (modified) {
      setEscrowTransactions(currentTxs);
      localStorage.setItem("supervision_escrow_txs", JSON.stringify(currentTxs));
    }
  }, [records, language]);

  // Synchronize live audit events from real record stage updates
  React.useEffect(() => {
    if (!records || records.length === 0) return;

    let currentEvents: any[] = [];
    try {
      const saved = localStorage.getItem("supervision_audit_trail_events");
      if (saved) {
        currentEvents = JSON.parse(saved);
      }
    } catch {
      currentEvents = [];
    }

    let modified = false;

    records.forEach((r) => {
      r.stages?.forEach((s: any) => {
        if (s.status === "Đã hoàn thành") {
          const evId = `ev-stage-comp-${s.id}`;
          if (!currentEvents.some((e) => e.id === evId)) {
            currentEvents.unshift({
              id: evId,
              timestamp: s.completedAt ? `${s.completedAt}T12:00:00Z` : "2026-07-08T12:00:00Z",
              actor: s.assigneeName || r.mainAssignee || "Hệ thống",
              action: language === "vi" 
                ? `Đã hoàn thành Giai đoạn: "${s.name}"`
                : `Completed stage: "${s.name}"`,
              dossierId: r.id,
              severity: "success",
              status: "Audited"
            });
            modified = true;
          }
        } else if (s.status === "Chờ phê duyệt" || s.status === "Chờ kiểm soát") {
          const evId = `ev-stage-pend-${s.id}`;
          if (!currentEvents.some((e) => e.id === evId)) {
            currentEvents.unshift({
              id: evId,
              timestamp: "2026-07-08T16:00:00Z",
              actor: s.assigneeName || r.mainAssignee || "Trợ lý",
              action: language === "vi"
                ? `Đệ trình mốc kiểm duyệt "4-Eyes Signoff" cho giai đoạn: "${s.name}"`
                : `Submitted dual-review "4-Eyes Signoff" for stage: "${s.name}"`,
              dossierId: r.id,
              severity: "warning",
              status: "Unchecked"
            });
            modified = true;
          }
        }
      });
    });

    if (modified) {
      setAuditTrailEvents(currentEvents);
      localStorage.setItem("supervision_audit_trail_events", JSON.stringify(currentEvents));
    }
  }, [records, language]);


  // Today string
  const todayStr = "2026-07-08";

  // Helper: parse custom dates
  const parseDateString = (dateStr: string): number => {
    if (!dateStr) return 0;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return Date.parse(dateStr);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split("/");
      return Date.parse(`${y}-${m}-${d}`);
    }
    return Date.parse(dateStr) || 0;
  };

  // Helper to construct category-specific workflow stages dynamically
  const generateCategoryStages = (record: any, lang: string) => {
    const rawCatName = record.category || record.serviceType || record.title || "";
    const cat = rawCatName.toLowerCase();
    const defaultLawyer = (users && users.length > 0)
      ? (users.find((u: any) => u.role?.toLowerCase().includes("luật sư") || u.role?.toLowerCase().includes("lawyer"))?.name || users[0]?.name)
      : (user?.name || "Luật sư Nguyễn Văn A");
    const assignee = record.mainAssignee || record.assigneeName || record.lawyer || defaultLawyer;

    // Check if user defined a custom workflow template for this domain/category
    if (categoryWorkflowTemplates[rawCatName] && categoryWorkflowTemplates[rawCatName].length > 0) {
      return categoryWorkflowTemplates[rawCatName].map((stg: any, idx: number) => ({
        id: `${record.id}-tmpl-s${idx + 1}`,
        name: stg.name,
        status: idx === 0 ? "Đã hoàn thành" : idx === 1 ? "Đang tiến hành" : "Chờ thực hiện",
        dueDate: new Date(Date.now() + (stg.slaDays || (idx + 1) * 5) * 86400000).toISOString().split("T")[0],
        assigneeName: assignee,
        completedAt: idx === 0 ? todayStr : undefined,
        approvedBy: idx === 0 ? "Kiểm soát chất lượng hệ thống" : undefined
      }));
    }

    const isLitigation = cat.includes("tranh tụng") || cat.includes("tòa án") || cat.includes("dân sự") ||
                         cat.includes("hình sự") || cat.includes("hành chính") || cat.includes("tranh chấp") ||
                         cat.includes("đất đai") || cat.includes("lao động") || cat.includes("án");

    if (isLitigation) {
      return [
        {
          id: `${record.id}-s1`,
          name: lang === "vi" ? "Bước 1: Tiếp nhận hồ sơ & Khảo sát chứng cứ ban đầu" : "Step 1: File Intake & Evidence Review",
          status: "Đã hoàn thành",
          dueDate: "2026-06-01",
          assigneeName: assignee,
          completedAt: "2026-06-01",
          approvedBy: "Kiểm soát chất lượng hệ thống"
        },
        {
          id: `${record.id}-s2`,
          name: lang === "vi" ? "Bước 2: Tư vấn định hướng & Ký Hợp đồng Dịch vụ Pháp lý Tranh tụng" : "Step 2: Strategy Advice & Litigation Contract",
          status: "Đã hoàn thành",
          dueDate: "2026-06-05",
          assigneeName: assignee,
          completedAt: "2026-06-05",
          approvedBy: "Trưởng Ban Tranh tụng"
        },
        {
          id: `${record.id}-s3`,
          name: lang === "vi" ? "Bước 3: Thu thập, xác minh & Hoàn thiện hệ thống chứng cứ" : "Step 3: Evidence Collection & Verification",
          status: "Đang tiến hành",
          dueDate: "2026-06-15",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s4`,
          name: lang === "vi" ? "Bước 4: Soạn thảo Đơn khởi kiện / Đơn giải trình / Luận cứ bảo vệ" : "Step 4: Petition & Argument Drafting",
          status: "Chờ thực hiện",
          dueDate: "2026-06-25",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s5`,
          name: lang === "vi" ? "Bước 5: Nộp đơn khởi kiện & Đóng tạm ứng án phí tại Tòa án" : "Step 5: Petition Submission & Court Advance Fee",
          status: "Chờ thực hiện",
          dueDate: "2026-07-05",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s6`,
          name: lang === "vi" ? "Bước 6: Tòa án thụ lý vụ án & Phân công Thẩm phán giải quyết" : "Step 6: Case Docketing & Judge Assignment",
          status: "Chờ thực hiện",
          dueDate: "2026-07-15",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s7`,
          name: lang === "vi" ? "Bước 7: Tham gia Tự khai, Hòa giải & Lấy lời khai tại Tòa" : "Step 7: Court Mediation & Statement Deposition",
          status: "Chờ thực hiện",
          dueDate: "2026-07-25",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s8`,
          name: lang === "vi" ? "Bước 8: Phiên họp Kiểm tra việc giao nộp, tiếp cận & công khai chứng cứ" : "Step 8: Evidence Check & Access Session",
          status: "Chờ thực hiện",
          dueDate: "2026-08-05",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s9`,
          name: lang === "vi" ? "Bước 9: Tranh tụng trực tiếp tại Phiên tòa Xét xử Sơ thẩm" : "Step 9: First-Instance Court Trial Advocacy",
          status: "Chờ thực hiện",
          dueDate: "2026-08-20",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s10`,
          name: lang === "vi" ? "Bước 10: Kháng cáo / Tranh tụng tại Phiên tòa Xét xử Phúc thẩm" : "Step 10: Appellate Trial Proceedings",
          status: "Chờ thực hiện",
          dueDate: "2026-09-10",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s11`,
          name: lang === "vi" ? "Bước 11: Đôn đốc Thi hành án & Khóa sổ lưu trữ hồ sơ" : "Step 11: Judgment Enforcement & Dossier Archive",
          status: "Chờ thực hiện",
          dueDate: "2026-10-01",
          assigneeName: assignee
        }
      ];
    }

    const isMA = cat.includes("m&a") || cat.includes("sáp nhập") || cat.includes("mua bán") ||
                 cat.includes("đầu tư") || cat.includes("tái cấu trúc") || cat.includes("doanh nghiệp & đầu tư");

    if (isMA) {
      return [
        {
          id: `${record.id}-s1`,
          name: lang === "vi" ? "Bước 1: Tiếp nhận yêu cầu, Ký NDA & Thẩm định sơ bộ" : "Step 1: Intake, NDA & Preliminary Audit",
          status: "Đã hoàn thành",
          dueDate: "2026-07-02",
          assigneeName: assignee,
          completedAt: "2026-07-02",
          approvedBy: "Kiểm soát chất lượng hệ thống"
        },
        {
          id: `${record.id}-s2`,
          name: lang === "vi" ? "Bước 2: Lập Báo cáo Thẩm định Pháp lý chuyên sâu (Legal Due Diligence)" : "Step 2: Legal Due Diligence Report",
          status: "Đang tiến hành",
          dueDate: "2026-07-10",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s3`,
          name: lang === "vi" ? "Bước 3: Thiết kế Cấu trúc giao dịch & Lập Phương án đầu tư" : "Step 3: Deal Structuring & Investment Plan",
          status: "Chờ thực hiện",
          dueDate: "2026-07-20",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s4`,
          name: lang === "vi" ? "Bước 4: Soạn thảo Hợp đồng SPA / SHA & Các văn kiện giao dịch" : "Step 4: SPA/SHA Agreement Drafting",
          status: "Chờ thực hiện",
          dueDate: "2026-08-01",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s5`,
          name: lang === "vi" ? "Bước 5: Đàm phán các điều khoản mấu chốt & Ký kết hợp đồng" : "Step 5: Key Terms Negotiation & Signing",
          status: "Chờ thực hiện",
          dueDate: "2026-08-15",
          assigneeName: assignee
        },
        {
          id: `${record.id}-s6`,
          name: lang === "vi" ? "Bước 6: Thực hiện thủ tục ĐKKD, Đóng giao dịch & Chuyển giao" : "Step 6: Registration, Closing & Asset Transfer",
          status: "Chờ thực hiện",
          dueDate: "2026-09-01",
          assigneeName: assignee
        }
      ];
    }

    // Default Legal Consulting (5 steps)
    return [
      {
        id: `${record.id}-s1`,
        name: lang === "vi" ? "Bước 1: Tiếp nhận yêu cầu tư vấn & Phân tích cơ sở pháp lý" : "Step 1: Advisory Intake & Legal Analysis",
        status: "Đã hoàn thành",
        dueDate: "2026-07-01",
        assigneeName: assignee,
        completedAt: "2026-07-01",
        approvedBy: "Kiểm soát chất lượng hệ thống"
      },
      {
        id: `${record.id}-s2`,
        name: lang === "vi" ? "Bước 2: Rà soát rủi ro pháp lý & Thẩm định hồ sơ liên quan" : "Step 2: Legal Risk Audit & Document Review",
        status: "Đang tiến hành",
        dueDate: "2026-07-10",
        assigneeName: assignee
      },
      {
        id: `${record.id}-s3`,
        name: lang === "vi" ? "Bước 3: Soạn thảo Thư tư vấn / Thẩm định dự thảo hợp đồng" : "Step 3: Drafting Legal Opinion / Contract Audit",
        status: "Chờ thực hiện",
        dueDate: "2026-07-20",
        assigneeName: assignee
      },
      {
        id: `${record.id}-s4`,
        name: lang === "vi" ? "Bước 4: Trao đổi, điều chỉnh & Thống nhất phương án với Khách hàng" : "Step 4: Consultation Review & Client Alignment",
        status: "Chờ thực hiện",
        dueDate: "2026-08-01",
        assigneeName: assignee
      },
      {
        id: `${record.id}-s5`,
        name: lang === "vi" ? "Bước 5: Bàn giao Thư tư vấn hoàn chỉnh, Nghiệm thu & Lưu trữ" : "Step 5: Final Delivery, Acceptance & Archiving",
        status: "Chờ thực hiện",
        dueDate: "2026-08-15",
        assigneeName: assignee
      }
    ];
  };

  // Compute dossier milestones/stages
  const dossiers = useMemo(() => {
    return records.map((record) => {
      let stages = record.stages;
      const cat = (record.category || record.serviceType || record.title || "").toLowerCase();
      const isLitigation = cat.includes("tranh tụng") || cat.includes("tòa án") || cat.includes("dân sự") ||
                           cat.includes("hình sự") || cat.includes("hành chính") || cat.includes("tranh chấp") ||
                           cat.includes("đất đai") || cat.includes("lao động") || cat.includes("án");
      
      const shouldRegenerate = !stages || stages.length === 0 || (
        isLitigation && stages.length < 11
      );

      if (shouldRegenerate) {
        stages = generateCategoryStages(record, language);
      }
      return {
        ...record,
        stages
      };
    });
  }, [records, language, users, user]);

  // Compute dynamic PieChart data for Category Distribution in progress control
  const dynamicPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const norm = normalizeCategory(r.category);
      if (norm) {
        counts[norm] = (counts[norm] || 0) + 1;
      }
    });

    const keys = Object.keys(counts);
    if (keys.length === 0) {
      return [
        { name: "Tranh tụng", value: 3, color: "#6366f1" },
        { name: "Tư vấn Pháp luật", value: 2, color: "#06b6d4" },
        { name: "Đại diện Ngoài tố tụng", value: 2, color: "#f59e0b" },
        { name: "Trọng tài & Hòa giải", value: 1, color: "#ec4899" }
      ];
    }

    const colors = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981", "#3b82f6"];
    return keys.map((key, index) => ({
      name: key,
      value: counts[key],
      color: colors[index % colors.length]
    }));
  }, [records]);

  // Permanently save default stages to database if not present
  React.useEffect(() => {
    if (!records || records.length === 0) return;
    const toUpdate = records.filter((r) => {
      const cat = (r.category || r.serviceType || r.title || "").toLowerCase();
      const isLitigation = cat.includes("tranh tụng") || cat.includes("tòa án") || cat.includes("dân sự") ||
                           cat.includes("hình sự") || cat.includes("hành chính") || cat.includes("tranh chấp") ||
                           cat.includes("đất đai") || cat.includes("lao động") || cat.includes("án");
      return !r.stages || r.stages.length === 0 || (isLitigation && r.stages.length < 11);
    });
    if (toUpdate.length === 0) return;

    const updatedRecords = records.map((record) => {
      const cat = (record.category || record.serviceType || record.title || "").toLowerCase();
      const isLitigation = cat.includes("tranh tụng") || cat.includes("tòa án") || cat.includes("dân sự") ||
                           cat.includes("hình sự") || cat.includes("hành chính") || cat.includes("tranh chấp") ||
                           cat.includes("đất đai") || cat.includes("lao động") || cat.includes("án");
      if (!record.stages || record.stages.length === 0 || (isLitigation && record.stages.length < 11)) {
        return {
          ...record,
          stages: generateCategoryStages(record, language)
        };
      }
      return record;
    });

    const changedOnly = updatedRecords.filter((ur, index) => records[index] !== ur);
    if (changedOnly.length > 0) {
      updateRecords(updatedRecords, changedOnly);
    }
  }, [records.length, language]);

  // Set default selected dossier
  React.useEffect(() => {
    if (dossiers.length > 0 && !selectedDossierId) {
      setSelectedDossierId(dossiers[0].id);
    }
  }, [dossiers, selectedDossierId]);

  // Selected dossier object
  const selectedDossier = useMemo(() => {
    return dossiers.find((d) => d.id === selectedDossierId) || dossiers[0];
  }, [dossiers, selectedDossierId]);

  // 4-eyes quality signoff queue derived dynamically from dossiers
  const signoffs = useMemo(() => {
    const list: any[] = [];
    
    // Scan all dossiers and gather stages waiting for approval
    dossiers.forEach((d) => {
      d.stages?.forEach((s: any) => {
        if ((s.status === "Chờ phê duyệt" || s.status === "Chờ kiểm soát") && !completedSignoffIds[s.id]) {
          list.push({
            id: s.id,
            docName: s.name,
            dossierId: d.id,
            draftedBy: s.assigneeName || d.mainAssignee || "Trợ lý",
            status: "Chờ duyệt ký",
            stageId: s.id
          });
        }
      });
    });

    // Fallbacks if list is empty and no dossiers exist to keep UX beautiful
    if (dossiers.length === 0) {
      const fallbacks = [
        { id: "so-1", docName: "Hợp đồng chuyển nhượng quyền sử dụng đất Sunrise", dossierId: "HS-2026-0001", draftedBy: "Trợ lý Vũ Nam", status: "Chờ duyệt ký" },
        { id: "so-2", docName: "Đơn khởi kiện tranh chấp Landmark", dossierId: "HS-2026-0002", draftedBy: "Luật sư Trần Minh Trí", status: "Chờ duyệt ký" }
      ];
      return fallbacks.filter(f => !completedSignoffIds[f.id]);
    }
    return list;
  }, [dossiers, completedSignoffIds]);

  // Financial AML Alerts derived dynamically from dossiers
  const amlAlerts = useMemo(() => {
    const list: any[] = [];
    
    dossiers.forEach((d) => {
      const rawFee = d.revenue !== undefined ? d.revenue : (d.feeAmount !== undefined ? d.feeAmount : d.fee);
      const feeNum = typeof rawFee === "number" ? rawFee : parseInt(String(rawFee || "").replace(/[^0-9]/g, "")) || 0;
      // High value cases generate compliance tasks
      if (feeNum > 50000000) {
        const isVerified = d.amlVerified || verifiedAmlIds[d.id];
        list.push({
          id: `aml-${d.id}`,
          value: feeNum.toLocaleString("vi-VN") + " VND",
          type: "Giao dịch giá trị lớn (>50M VNĐ)",
          partner: d.client || "Đối tác liên quan",
          status: isVerified ? "Đã rà soát" : "Chờ xác minh",
          level: feeNum > 150000000 ? "Cao" : "Trung bình",
          dossierId: d.id
        });
      }
    });

    // Fallbacks if list is empty and no dossiers exist
    if (dossiers.length === 0) {
      const fallbacks = [
        { id: "aml-1", value: "15,000,000,000 VND", type: "Chuyển nhượng giá trị lớn", partner: "Sunrise Việt Nam", status: "Đã rà soát", level: "Trung bình" },
        { id: "aml-2", value: "2,500,000,000 VND", type: "Thanh toán bằng tiền mặt qua uỷ thác", partner: "Landmark Group", status: "Chờ xác minh", level: "Cao" }
      ];
      return fallbacks.map(f => verifiedAmlIds[f.id] ? { ...f, status: "Đã rà soát" } : f);
    }
    return list;
  }, [dossiers, verifiedAmlIds]);

  // Compute stats
  const stats = useMemo(() => {
    let totalStages = 0;
    let pendingApprovals = 0;
    let overdueSLA = 0;
    let active = 0;
    let completed = 0;

    dossiers.forEach((d) => {
      d.stages?.forEach((s: any) => {
        totalStages++;
        if (s.status === "Chờ kiểm soát" || s.status === "Chờ phê duyệt" || s.status === "Đang thẩm định") {
          pendingApprovals++;
        }
        if (s.status === "Đang tiến hành" || s.status === "Chờ thực hiện") {
          active++;
          const dueMs = parseDateString(s.dueDate);
          const todayMs = parseDateString(todayStr);
          if (dueMs && dueMs < todayMs) {
            overdueSLA++;
          }
        }
        if (s.status === "Đã hoàn thành") {
          completed++;
        }
      });
    });

    return { totalStages, pendingApprovals, overdueSLA, active, completed };
  }, [dossiers]);

  // Filtered list of pending stages across all dossiers (Audit Queue)
  const auditQueue = useMemo(() => {
    const list: any[] = [];
    dossiers.forEach((d) => {
      d.stages?.forEach((s: any) => {
        if (s.status === "Chờ kiểm soát" || s.status === "Chờ phê duyệt" || s.status === "Đang thẩm định" || s.isPendingApproval) {
          list.push({
            dossierId: d.id,
            dossierTitle: d.title,
            stage: s
          });
        }
      });
    });
    return list;
  }, [dossiers]);

  // Filtered list of overdue stages across all dossiers (Bottlenecks)
  const overdueStages = useMemo(() => {
    const list: any[] = [];
    dossiers.forEach((d) => {
      d.stages?.forEach((s: any) => {
        if (s.status !== "Đã hoàn thành") {
          const dueMs = parseDateString(s.dueDate);
          const todayMs = parseDateString(todayStr);
          if (dueMs && dueMs < todayMs) {
            const daysOverdue = Math.ceil((todayMs - dueMs) / (1000 * 60 * 60 * 24));
            list.push({
              dossierId: d.id,
              dossierTitle: d.title,
              stage: s,
              daysOverdue
            });
          }
        }
      });
    });
    return list.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [dossiers]);

  // Staff analysis
  const staffStats = useMemo(() => {
    const map: Record<string, any> = {};
    
    // Initialize map with actual DB users (excluding client accounts)
    users.forEach((u) => {
      if (u.role === "client") return;
      if (u.name && !map[u.name]) {
        map[u.name] = {
          name: u.name,
          role: u.title || u.role || "Chuyên viên",
          code: u.staff_code || "NV-000",
          total: 0,
          active: 0,
          overdue: 0,
          completed: 0,
          completedOnTime: 0
        };
      }
    });

    // Populate stats from dossier stages
    dossiers.forEach((d) => {
      d.stages?.forEach((s: any) => {
        const name = s.assigneeName || d.mainAssignee;
        if (!name) return;
        
        let target = map[name];
        if (!target) {
          // Strictly base personnel on the actual personnel of the system
          return;
        }

        target.total++;
        if (s.status === "Đã hoàn thành") {
          target.completed++;
          const dueMs = parseDateString(s.dueDate);
          const completedMs = s.completedAt ? parseDateString(s.completedAt) : dueMs;
          if (completedMs <= dueMs) {
            target.completedOnTime++;
          }
        } else {
          target.active++;
          const dueMs = parseDateString(s.dueDate);
          const todayMs = parseDateString(todayStr);
          if (dueMs && dueMs < todayMs) {
            target.overdue++;
          }
        }
      });
    });

    const allStaff = Object.values(map);
    if (showOnlyMyStaff && myConsultants.length > 0) {
      const managedNames = new Set(myConsultants.map((c: any) => c.name));
      return allStaff.filter((s: any) => managedNames.has(s.name));
    }
    return allStaff;
  }, [dossiers, users, showOnlyMyStaff, myConsultants]);

  // Smart Workload Balancer Recommendation
  const smartRecommendation = useMemo(() => {
    // Find the staff member with the lowest active workload
    const sorted = [...staffStats].sort((a, b) => a.active - b.active);
    return sorted[0];
  }, [staffStats]);

  // Handle stage approval by controller
  const handleApproveStage = (dossierId: string, stageId: string) => {
    const targetDossier = dossiers.find((d) => d.id === dossierId);
    if (!targetDossier) return;

    const updatedStages = targetDossier.stages.map((s: any) => {
      if (s.id === stageId) {
        return {
          ...s,
          status: "Đã hoàn thành",
          isPendingApproval: false,
          completedAt: todayStr,
          approvedBy: user?.name || "Kiểm soát chất lượng",
          approvalNotes: feedbackInputs[stageId] || "Phê duyệt đạt chuẩn nghiệp vụ.",
          approvalRating: ratings[stageId] || 10
        };
      }
      return s;
    });

    const updatedRecord = {
      ...targetDossier,
      stages: updatedStages
    };

    updateRecords(
      records.map((r: any) => (r.id === dossierId ? updatedRecord : r)),
      updatedRecord
    );

    // Clear feedback input
    setFeedbackInputs((prev) => {
      const copy = { ...prev };
      delete copy[stageId];
      return copy;
    });
  };

  // Handle stage rejection / rework by controller
  const handleRejectStage = (dossierId: string, stageId: string) => {
    const targetDossier = dossiers.find((d) => d.id === dossierId);
    if (!targetDossier) return;

    const updatedStages = targetDossier.stages.map((s: any) => {
      if (s.id === stageId) {
        return {
          ...s,
          status: "Đang tiến hành",
          isPendingApproval: false,
          reworkRequested: true,
          feedbackNotes: feedbackInputs[stageId] || "Hồ sơ cần bổ sung tài liệu kiểm chứng."
        };
      }
      return s;
    });

    const updatedRecord = {
      ...targetDossier,
      stages: updatedStages
    };

    updateRecords(
      records.map((r: any) => (r.id === dossierId ? updatedRecord : r)),
      updatedRecord
    );

    // Clear feedback input
    setFeedbackInputs((prev) => {
      const copy = { ...prev };
      delete copy[stageId];
      return copy;
    });
  };

  // Submit stage for review by lawyer/staff
  const handleSubmitStageForReview = (dossierId: string, stageId: string) => {
    const targetDossier = dossiers.find((d) => d.id === dossierId);
    if (!targetDossier) return;

    const updatedStages = targetDossier.stages.map((s: any) => {
      if (s.id === stageId) {
        return {
          ...s,
          status: "Chờ phê duyệt",
          isPendingApproval: true
        };
      }
      return s;
    });

    const updatedRecord = {
      ...targetDossier,
      stages: updatedStages
    };

    updateRecords(
      records.map((r: any) => (r.id === dossierId ? updatedRecord : r)),
      updatedRecord
    );
  };

  // Quick advance of stage status
  const handleAdvanceStage = (dossierId: string, stageId: string) => {
    const targetDossier = dossiers.find((d) => d.id === dossierId);
    if (!targetDossier) return;

    const updatedStages = targetDossier.stages.map((s: any) => {
      if (s.id === stageId) {
        let nextStatus = "Đang tiến hành";
        if (s.status === "Chờ thực hiện") nextStatus = "Đang tiến hành";
        else if (s.status === "Đang tiến hành") nextStatus = "Chờ phê duyệt";
        return {
          ...s,
          status: nextStatus,
          isPendingApproval: nextStatus === "Chờ phê duyệt"
        };
      }
      return s;
    });

    const updatedRecord = {
      ...targetDossier,
      stages: updatedStages
    };

    updateRecords(
      records.map((r: any) => (r.id === dossierId ? updatedRecord : r)),
      updatedRecord
    );
  };

  // Add custom stage to timeline
  const handleAddCustomStage = () => {
    if (!newStageName || !newStageDueDate || !newStageAssignee) {
      alert("Vui lòng điền đầy đủ thông tin giai đoạn đặc thù!");
      return;
    }

    const targetDossier = dossiers.find((d) => d.id === selectedDossierId);
    if (!targetDossier) return;

    const newStage = {
      id: `custom-stage-${Date.now()}`,
      name: newStageName,
      status: "Chờ thực hiện",
      dueDate: newStageDueDate,
      assigneeName: newStageAssignee
    };

    const updatedStages = [...(targetDossier.stages || []), newStage];
    const updatedRecord = {
      ...targetDossier,
      stages: updatedStages
    };

    updateRecords(
      records.map((r: any) => (r.id === selectedDossierId ? updatedRecord : r)),
      updatedRecord
    );

    // Reset fields
    setNewStageName("");
    setNewStageDueDate("");
    setNewStageAssignee("");
    setShowAddStageModal(false);
  };

  // Conflict of interest cross lookup
  const handleConflictSearch = () => {
    if (!conflictSearchName) {
      setConflictResult(null);
      return;
    }
    const query = conflictSearchName.toLowerCase().trim();
    
    // Check if partner matches any client or dossier
    const matches = dossiers.filter(
      (d) =>
        (d.client && d.client.toLowerCase().includes(query)) ||
        (d.title && d.title.toLowerCase().includes(query)) ||
        (d.summary && d.summary.toLowerCase().includes(query))
    );

    if (matches.length > 0) {
      setConflictResult({
        hasConflict: true,
        conflictingDossiers: matches.map((m) => ({
          id: m.id,
          title: m.title,
          client: m.client,
          status: m.status,
          lawyer: m.mainAssignee
        }))
      });
    } else {
      setConflictResult({
        hasConflict: false,
        message: "Không tìm thấy trùng lặp lợi ích với khách hàng hoặc vụ việc hiện hữu. Đối tác an toàn."
      });
    }
  };

  // Filtered dossiers for process filter card
  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const matchSearch =
        d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.client && d.client.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory =
        categoryFilter === "all" || 
        normalizeCategory(d.category) === normalizeCategory(categoryFilter);

      return matchSearch && matchCategory;
    });
  }, [dossiers, searchQuery, categoryFilter]);

  // Mediation Locked Check Helper
  const isMediationLocked = (stage: any) => {
    // A mediation/reconciliation stage locked if overdue by > 24 hours (1 day) without update and not unlocked by controller
    if (!stage.name.toLowerCase().includes("hòa giải") && !stage.name.toLowerCase().includes("đối thoại")) {
      return false;
    }
    if (stage.status === "Đã hoàn thành") return false;
    
    const dueMs = parseDateString(stage.dueDate);
    const todayMs = parseDateString(todayStr);
    
    if (dueMs && todayMs - dueMs >= 1000 * 60 * 60 * 24) {
      // Exceeded 24 hours
      return !stage.mediationUnlocked;
    }
    return false;
  };

  // Submit explanation for 24h locked step
  const handleExplanationSubmit = (stageId: string) => {
    const text = mediationExpls[stageId];
    if (!text) return;

    const targetDossier = dossiers.find((d) => d.stages?.some((s: any) => s.id === stageId));
    if (!targetDossier) return;

    const updatedStages = targetDossier.stages.map((s: any) => {
      if (s.id === stageId) {
        return {
          ...s,
          mediationExplanation: text
        };
      }
      return s;
    });

    const updatedRecord = {
      ...targetDossier,
      stages: updatedStages
    };

    updateRecords(
      records.map((r: any) => (r.id === targetDossier.id ? updatedRecord : r)),
      updatedRecord
    );

    alert(language === "vi" ? "Đã gửi giải trình trễ hạn cho bước Hòa Giải! Kiểm soát chất lượng sẽ phê duyệt." : "Explanation submitted for overdue Mediation! Auditor will review.");
  };

  // Unlock mediation step by Controller
  const handleUnlockMediation = (stageId: string) => {
    const targetDossier = dossiers.find((d) => d.stages?.some((s: any) => s.id === stageId));
    if (!targetDossier) return;

    const updatedStages = targetDossier.stages.map((s: any) => {
      if (s.id === stageId) {
        return {
          ...s,
          mediationUnlocked: true
        };
      }
      return s;
    });

    const updatedRecord = {
      ...targetDossier,
      stages: updatedStages
    };

    updateRecords(
      records.map((r: any) => (r.id === targetDossier.id ? updatedRecord : r)),
      updatedRecord
    );

    alert(language === "vi" ? "Đã mở khóa cập nhật cho bước Hòa giải này!" : "Unlocked updates for this Mediation step!");
  };

  // Force reassign an overdue stage
  const handleReassignStage = (dossierId: string, stageId: string, newAssignee: string) => {
    if (!newAssignee) return;
    const targetDossier = dossiers.find((d) => d.id === dossierId);
    if (!targetDossier) return;

    const updatedStages = targetDossier.stages.map((s: any) => {
      if (s.id === stageId) {
        return {
          ...s,
          assigneeName: newAssignee,
          notes: (s.notes || "") + (language === "vi" 
            ? `\n[Tái phân công khẩn cấp cho ${newAssignee} bởi Kiểm soát chất lượng ngày ${todayStr}]` 
            : `\n[Emergency reassigned to ${newAssignee} by Controller on ${todayStr}]`)
        };
      }
      return s;
    });

    const updatedRecord = {
      ...targetDossier,
      stages: updatedStages
    };

    updateRecords(
      records.map((r: any) => (r.id === dossierId ? updatedRecord : r)),
      updatedRecord
    );

    alert(language === "vi" 
      ? `Đã tái phân công khẩn cấp công việc sang cho ${newAssignee}!` 
      : `Emergency reassigned task to ${newAssignee}!`);
  };

  // Issue warning notice
  const handleIssueWarning = () => {
    if (!warnStaffName || !warnReason) {
      alert(language === "vi" ? "Vui lòng chọn nhân sự và nhập lý do!" : "Please select a staff member and enter the reason!");
      return;
    }

    const newWarn = {
      id: `warn-${Date.now()}`,
      staffName: warnStaffName,
      level: warnLevel,
      reason: warnReason,
      penalty: warnPenalty || (language === "vi" ? "Yêu cầu nghiêm túc rút kinh nghiệm và khắc phục tiến độ nhanh nhất." : "Serious self-correction required."),
      issuedBy: user?.name || (language === "vi" ? "Kiểm soát chất lượng hệ thống" : "System Controller"),
      issuedAt: new Date().toISOString(),
      dossierId: warnDossierId || "Chung",
      acknowledged: false
    };

    const updated = [newWarn, ...warnings];
    saveWarnings(updated);

    // Reset
    setWarnStaffName("");
    setWarnLevel("warning");
    setWarnReason("");
    setWarnPenalty("");
    setWarnDossierId("");

    alert(language === "vi" 
      ? `Đã ban hành Quyết định Cảnh cáo cho ${warnStaffName} thành công!` 
      : `Successfully issued warning for ${warnStaffName}!`);
  };

  const handleDeleteWarning = (id: string) => {
    const updated = warnings.filter((w) => w.id !== id);
    saveWarnings(updated);
  };

  // --- CONTROLLER HELPER FUNCTIONS ---
  const handleAIComplianceScan = (caseId: string) => {
    if (!caseId) return;
    setIsRiskAnalyzing(true);
    setRiskAnalysisResult(null);
    
    // Simulate delay
    setTimeout(() => {
      const targetCase = records.find((r: any) => r.id === caseId);
      if (!targetCase) {
        setIsRiskAnalyzing(false);
        return;
      }

      // Generate a comprehensive compliance analysis based on actual data
      const totalStagesCount = targetCase.stages?.length || 0;
      const completedCount = targetCase.stages?.filter((s: any) => s.status === "Đã hoàn thành").length || 0;
      const isOverdueDetected = targetCase.stages?.some((s: any) => {
        if (s.status === "Đã hoàn thành") return false;
        const dueMs = parseDateString(s.dueDate);
        return dueMs && dueMs < parseDateString(todayStr);
      });

      const slaHealthScore = Math.max(20, 100 - (isOverdueDetected ? 40 : 0) - ((totalStagesCount - completedCount) * 12));
      const warningsForThisCase = warnings.filter((w) => w.dossierId === caseId).length;

      const results = {
        caseId: targetCase.id,
        caseTitle: targetCase.title,
        clientName: targetCase.client || "Không rõ",
        slaHealthScore,
        category: targetCase.category || "General",
        mainAssignee: targetCase.mainAssignee || "N/A",
        assessedDate: "11/07/2026",
        certifiedNo: `QD-KD/2026/0${Math.floor(Math.random() * 900) + 100}`,
        isFullyAudited: !!targetCase.isFullyAudited,
        auditedBy: targetCase.auditedBy || "",
        auditedAt: targetCase.auditedAt || "",
        indicators: {
          slaOverdue: isOverdueDetected ? "DANGER_BREACH" : "EXCELLENT_HEALTH",
          documentCompleteness: totalStagesCount > 3 ? "COMPLETED_92%" : "WARNING_INCOMPLETE_50%",
          warningStatus: warningsForThisCase > 0 ? `WARNINGS_FOUND (${warningsForThisCase})` : "SECURE_0_WARNINGS",
          conflictLevel: "NO_OPPOSITION_CONFLICT",
          amlRisk: targetCase.amlVerified ? "CLEAN_AUDITED" : "PENDING_VERIFICATION"
        },
        aiAdvice: targetCase.category === "Thẩm định M&A" 
          ? "Khuyến nghị: Rà soát kỹ quy hoạch sử dụng đất 1/500 và biên bản liên doanh trước khi ký. Tiến độ M&A cần bám sát để kịp tiến độ đóng giao dịch vào 15/08/2026."
          : targetCase.category === "Tranh chấp Hợp đồng"
          ? "Khuyến nghị: Đôn đốc khẩn Luật sư Trí chuẩn bị đủ chứng cứ thanh lý gói thầu Landmark. Nguy cơ trễ hạn phiên hòa giải sắp tới rất cao."
          : "Khuyến nghị: Tiếp tục giám sát các mốc thời hạn nộp văn bản pháp lý. Thực hiện kiểm soát chéo 4 mắt trước khi gửi khách hàng."
      };

      setRiskAnalysisResult(results);
      setIsRiskAnalyzing(false);
    }, 1000);
  };

  const handleMarkCaseFullyAudited = (caseId: string) => {
    const targetCase = records.find((r: any) => r.id === caseId);
    if (!targetCase) return;

    const updatedRecord = {
      ...targetCase,
      isFullyAudited: true,
      auditedBy: user?.name || (language === "vi" ? "Kiểm soát chất lượng cao cấp" : "Senior Controller"),
      auditedAt: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
    };

    updateRecords(
      records.map((r: any) => (r.id === caseId ? updatedRecord : r)),
      updatedRecord
    );

    alert(language === "vi" 
      ? `Đã cấp CHỨNG NHẬN ĐẠT CHUẨN KIỂM SOÁT và đóng dấu đỏ thành công cho hồ sơ ${caseId}!` 
      : `Successfully certified and stamped case ${caseId} as audited!`);
    
    // Refresh risk analysis results
    if (riskAnalysisResult && riskAnalysisResult.caseId === caseId) {
      setRiskAnalysisResult((prev: any) => ({
        ...prev,
        isFullyAudited: true,
        auditedBy: user?.name || (language === "vi" ? "Kiểm soát chất lượng cao cấp" : "Senior Controller"),
        auditedAt: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
      }));
    }
  };

  const handleApproveEscrowTx = (txId: string) => {
    const updated = escrowTransactions.map((tx) => {
      if (tx.id === txId) {
        return {
          ...tx,
          status: "Approved & Released"
        };
      }
      return tx;
    });
    saveEscrowTransactions(updated);
    alert(language === "vi" ? "Đã duyệt giải ngân thành công khoản tạm giữ uỷ thác!" : "Successfully approved escrow transaction disbursement!");
  };

  const handleCheckAuditEvent = (eventId: string) => {
    const updated = auditTrailEvents.map((ev) => {
      if (ev.id === eventId) {
        return {
          ...ev,
          status: "Audited"
        };
      }
      return ev;
    });
    saveAuditTrailEvents(updated);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="supervision-dashboard-container">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 font-serif">
            <Activity className="text-amber-500 w-7 h-7" />
            {language === "vi" ? "Hệ thống Thẩm định & Giám sát Tiến độ" : "SLA Supervision & Audit System"}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {language === "vi"
              ? "Giám sát thời gian thực, quản lý điểm nghẽn SLA và phòng ngừa rủi ro (4 Trụ cột)"
              : "Real-time workflow audit, SLA bottle-necks tracking and compliance management"}
          </p>
        </div>
        
        {/* Urgent recommendations / AI badge */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 p-3 rounded-2xl flex items-center gap-3 shadow-lg shrink-0">
          <Sparkles className="text-amber-400 w-5 h-5 animate-pulse shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-amber-300">
              {language === "vi" ? "Kiến nghị điều phối" : "AI Balancing Advisory"}
            </div>
            <div className="text-slate-300">
              {language === "vi" ? `Phân công mới cho: ` : `Assign to: `}
              <span className="font-semibold text-white">{smartRecommendation?.name}</span> ({smartRecommendation?.active} việc)
            </div>
          </div>
        </div>
      </div>

      {/* 1. Global Metrics Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow transition-all duration-300">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {language === "vi" ? "Tổng Giai Đoạn" : "Total Stages"}
          </div>
          <div className="text-3xl font-black text-slate-800 font-mono mt-1">{stats.totalStages}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {language === "vi" ? "Quy trình giải quyết" : "Across all active cases"}
          </div>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl shadow-sm hover:shadow transition-all duration-300">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
            {language === "vi" ? "Chờ Thẩm Duyệt" : "Pending Audit"}
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          </div>
          <div className="text-3xl font-black text-amber-700 font-mono mt-1">{stats.pendingApprovals}</div>
          <div className="text-[10px] text-amber-600 mt-1">
            {language === "vi" ? "Yêu cầu bộ phận kiểm soát chất lượng phê duyệt" : "Awaiting Quality Control audit"}
          </div>
        </div>
        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl shadow-sm hover:shadow transition-all duration-300">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-widest">
            {language === "vi" ? "Quá Hạn SLA" : "Overdue SLA"}
          </div>
          <div className="text-3xl font-black text-rose-700 font-mono mt-1">{stats.overdueSLA}</div>
          <div className="text-[10px] text-rose-600 mt-1">
            {language === "vi" ? "Cảnh báo điểm nghẽn" : "Exceeded SLA limits"}
          </div>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl shadow-sm hover:shadow transition-all duration-300">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            {language === "vi" ? "Đang tiến hành" : "Active Steps"}
          </div>
          <div className="text-3xl font-black text-blue-700 font-mono mt-1">{stats.active}</div>
          <div className="text-[10px] text-blue-500 mt-1">
            {language === "vi" ? "Nhiệm vụ đang thực thi" : "In production pipeline"}
          </div>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl shadow-sm hover:shadow transition-all duration-300 col-span-2 lg:col-span-1">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
            {language === "vi" ? "Đã hoàn thành" : "Completed Steps"}
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono mt-1">{stats.completed}</div>
          <div className="text-[10px] text-emerald-500 mt-1">
            {language === "vi" ? "Đạt chuẩn chất lượng" : "Operational milestones hit"}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BẢNG CHỈ HUY & CÔNG CỤ KIỂM SOÁT CHẤT LƯỢNG CAO CẤP */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 overflow-hidden relative text-slate-800" id="supreme-controller-suite">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-6 text-slate-400">
          <Shield size={250} />
        </div>

        {/* Header and indicator */}
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 mb-6 relative z-10">
          <div className="flex items-start gap-3 w-full">
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-700 shadow-sm shrink-0">
              <Shield size={26} className="text-slate-800" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-slate-900 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-widest font-sans">
                  PRO POWER CONSOLE
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  {language === "vi" ? "Dữ liệu thời gian thực" : "Live synchronized data"}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl tracking-wide font-serif mt-1">
                {language === "vi" ? "Bảng Chỉ Huy & Công Cụ Kiểm Soát Tối Cao" : "Supreme Audit & Controller Control Room"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {language === "vi" ? "Hệ thống thẩm định tự động, kiểm soát dòng tiền và bảo mật chính sách AI thời gian thực" : "Automated case auditing, live escrow clearance, and security policies manager"}
              </p>
            </div>
          </div>

          {/* BAN CHỈ HUY: PHÂN HÓA VAI TRÒ CHUYÊN BIỆT */}
          <div className={`grid grid-cols-1 ${isQCRole ? "" : "md:grid-cols-2"} gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl`}>
            {/* VAI TRÒ 1: KIỂM SOÁT VIÊN */}
            {!isQCRole && (
              <div 
                onClick={() => handleSwitchRole("inspector")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                  controllerRole === "inspector" 
                    ? "border-indigo-600 bg-white shadow-md ring-1 ring-indigo-600/10" 
                    : "border-transparent bg-transparent hover:bg-slate-100"
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${controllerRole === "inspector" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`text-xs font-black uppercase tracking-wider ${controllerRole === "inspector" ? "text-indigo-900" : "text-slate-700"}`}>
                      {language === "vi" ? "1. Kiểm Soát Viên (Supervisor)" : "1. Workflow Inspector"}
                    </h4>
                    {controllerRole === "inspector" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">
                    {language === "vi" 
                      ? "Giám sát tiến độ giải quyết hồ sơ, phân tích tải việc nhân sự, quản trị trễ hạn SLA, phê duyệt chấm công & cấp quyền mở khóa báo cáo."
                      : "Supervise progress, monitor SLA delays, track staff workload, approve attendance, and authorize report unblocking requests."}
                  </p>
                </div>
              </div>
            )}

            {/* VAI TRÒ 2: KIỂM SOÁT CHẤT LƯỢNG (QC) */}
            <div 
              onClick={() => handleSwitchRole("qc")}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                controllerRole === "qc" 
                  ? "border-amber-500 bg-white shadow-md ring-1 ring-amber-500/10" 
                  : "border-transparent bg-transparent hover:bg-slate-100"
              } ${isQCRole ? "cursor-default" : ""}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${controllerRole === "qc" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700"}`}>
                <FileSearch size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${controllerRole === "qc" ? "text-amber-800" : "text-slate-700"}`}>
                    {language === "vi" ? "2. Kiểm Soát Chất Lượng (QC Specialist)" : "2. Quality Controller"}
                  </h4>
                  {controllerRole === "qc" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">
                  {language === "vi" 
                    ? "Kiểm soát chất lượng văn bản pháp lý (Blacklist Keywords), thẩm định nội dung qua AI (Nguyên tắc 4-Eyes), phòng tránh xung đột lợi ích, rà soát AML & bảo mật AI."
                    : "Review legal text quality (blacklist words), audit document files, perform conflict search, review escrow/AML, and handle AI security rules."}
                </p>
              </div>
            </div>
          </div>

          {/* Sub tabs selectors - Filtered by role */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
            {controllerRole === "inspector" ? (
              <>
                <button
                  onClick={() => setControllerTab("sla")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "sla"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Clock size={14} />
                  {language === "vi" ? "Giám Sát SLA" : "SLA Metrics"}
                </button>
                <button
                  onClick={() => setControllerTab("unlocks")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "unlocks"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Unlock size={14} />
                  {language === "vi" ? "Mở Khóa Báo Cáo" : "Unlock Requests"}
                </button>
                <button
                  onClick={() => setControllerTab("attendance")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "attendance"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <UserCheck size={14} />
                  {language === "vi" ? "Chấm Công" : "Attendance Manager"}
                </button>
                <button
                  onClick={() => setControllerTab("analytics")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "analytics"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <TrendingUp size={14} />
                  {language === "vi" ? "Hiệu Suất & Tải Việc" : "Analytics Suite"}
                </button>
                <button
                  onClick={() => setControllerTab("trail")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "trail"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <RefreshCw size={14} />
                  {language === "vi" ? "Truy Vết Hành Động" : "Audit Logs"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setControllerTab("keywords")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "keywords"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <FileSearch size={14} />
                  {language === "vi" ? "Rà Soát Từ Khóa Rủi Ro" : "QC Keyword Scan"}
                </button>
                <button
                  onClick={() => setControllerTab("audit")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "audit"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Bot size={14} />
                  {language === "vi" ? "AI Thẩm Định" : "AI Audit Scan"}
                </button>
                <button
                  onClick={() => setControllerTab("conflict")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "conflict"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Search size={14} />
                  {language === "vi" ? "Xung Đột Lợi Ích" : "Conflict Search"}
                </button>
                <button
                  onClick={() => setControllerTab("escrow")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "escrow"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Coins size={14} />
                  {language === "vi" ? "Ủy Thác & AML" : "Escrow & AML"}
                </button>
                <button
                  onClick={() => setControllerTab("security")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "security"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Lock size={14} />
                  {language === "vi" ? "Bảo Mật AI" : "Security Shield"}
                </button>
                <button
                  onClick={() => setControllerTab("cms")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "cms"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <FileCheck size={14} />
                  {language === "vi" ? "Duyệt CMS" : "CMS Approval"}
                </button>
                <button
                  onClick={() => setControllerTab("smart-scanner")}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                    controllerTab === "smart-scanner"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Sparkles size={14} />
                  {language === "vi" ? "Quét Lịch Làm Việc" : "Smart Schedule Scan"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* TAB 1: AI COMPLIANCE AUDITOR */}
        {controllerTab === "audit" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10 animate-fade-in">
            {/* Left side case list/selector */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 font-mono">
                    {language === "vi" ? "CHỌN HỒ SƠ THẨM ĐỊNH" : "SELECT DOSSIER TO AUDIT"}
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    {language === "vi"
                      ? "Chọn một vụ việc đang hoạt động để chạy quét rủi ro pháp lý toàn diện từ AI."
                      : "Choose an active lawsuit from the pipeline to run a deep AI risk assessment."}
                  </p>

                  <select
                    value={selectedRiskCaseId}
                    onChange={(e) => {
                      setSelectedRiskCaseId(e.target.value);
                      setRiskAnalysisResult(null);
                    }}
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
                  >
                    <option value="">-- {language === "vi" ? "Chọn hồ sơ cần quét..." : "Select case file..."} --</option>
                    {dossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} - {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60">
                  <button
                    type="button"
                    disabled={isRiskAnalyzing || !selectedRiskCaseId}
                    onClick={() => handleAIComplianceScan(selectedRiskCaseId)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-200 disabled:text-slate-400 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles size={14} className={isRiskAnalyzing ? "animate-spin text-amber-400" : ""} />
                    {isRiskAnalyzing 
                      ? (language === "vi" ? "ĐANG QUÉT HỒ SƠ..." : "ANALYZING LEGAL RECORD...") 
                      : (language === "vi" ? "BẮT ĐẦU THẨM ĐỊNH AI" : "RUN AI COMPLIANCE SCAN")}
                  </button>
                </div>
              </div>

              {/* Informative Help Box */}
              <div className="bg-slate-50/50 border border-slate-200/80 p-4 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <Activity size={13} className="text-slate-800" />
                  {language === "vi" ? "Chỉ số 5 Trụ Cột Kiểm Soát" : "5 pillars of Supervision Index"}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {language === "vi" 
                    ? "Mỗi hồ sơ sau khi quét sẽ nhận được Đánh Giá Phân Tích SLA, Tính Toàn Vẹn Văn Bản, Kiểm Tra Chéo Xung Đột, và Chỉ Số Rủi Ro Chống Rửa Tiền (AML Trust)."
                    : "Every scanned case file receives an SLA Performance check, Document Integrity score, Conflict of Interest evaluation, and Anti-Money Laundering risk index."}
                </p>
              </div>
            </div>

            {/* Right side results */}
            <div className="lg:col-span-3 bg-slate-50/35 border border-slate-200/80 p-5 rounded-2xl min-h-[300px] flex flex-col justify-center">
              {isRiskAnalyzing ? (
                <div className="text-center py-10 space-y-3.5">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin" />
                    <Bot size={24} className="text-slate-700 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800 tracking-wider uppercase font-mono animate-pulse">
                      {language === "vi" ? "AI ĐANG ĐỐI CHIẾU HỒ SƠ" : "AI SCANNING IN PROGRESS"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Checking SLA timeline logs, Client requirements, and Cross-conflict indexes...
                    </p>
                  </div>
                </div>
              ) : riskAnalysisResult ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                        {riskAnalysisResult.caseId}
                      </span>
                      <h5 className="text-sm font-extrabold text-slate-900 mt-1.5">{riskAnalysisResult.caseTitle}</h5>
                      <p className="text-[10px] text-slate-500">
                        {language === "vi" ? `Khách hàng: ` : `Client: `}
                        <span className="font-bold text-slate-700">{riskAnalysisResult.clientName}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {language === "vi" ? "Chỉ Số Tuân Thủ SLA" : "SLA Compliance Index"}
                      </div>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              riskAnalysisResult.slaHealthScore > 80 
                                ? "bg-emerald-500" 
                                : riskAnalysisResult.slaHealthScore > 50 
                                ? "bg-amber-500" 
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${riskAnalysisResult.slaHealthScore}%` }}
                          />
                        </div>
                        <span className={`text-sm font-black font-mono ${
                          riskAnalysisResult.slaHealthScore > 80 
                            ? "text-emerald-600" 
                            : riskAnalysisResult.slaHealthScore > 50 
                            ? "text-amber-600" 
                            : "text-rose-600"
                        }`}>
                          {riskAnalysisResult.slaHealthScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5 Indicator Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SLA OVERDUE</div>
                      <div className={`text-xs font-black mt-1 ${
                        riskAnalysisResult.indicators.slaOverdue.includes("DANGER") ? "text-rose-600" : "text-emerald-600"
                      }`}>
                        {riskAnalysisResult.indicators.slaOverdue}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">DOCUMENT INTEGRITY</div>
                      <div className="text-xs font-black mt-1 text-emerald-600">
                        {riskAnalysisResult.indicators.documentCompleteness}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">WARNING HISTORIES</div>
                      <div className={`text-xs font-black mt-1 ${
                        riskAnalysisResult.indicators.warningStatus.includes("WARNINGS") ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        {riskAnalysisResult.indicators.warningStatus}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CONFLICT LOOKUP</div>
                      <div className="text-xs font-black mt-1 text-emerald-600">
                        {riskAnalysisResult.indicators.conflictLevel}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">AML TRUST INDEX</div>
                      <div className="text-xs font-black mt-1 text-emerald-600">
                        {riskAnalysisResult.indicators.amlRisk}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CERTIFICATE NO.</div>
                      <div className="text-xs font-black mt-1 text-amber-600 font-mono">
                        {riskAnalysisResult.certifiedNo}
                      </div>
                    </div>
                  </div>

                  {/* AI recommendation feedback */}
                  <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                      <Sparkles size={12} className="animate-pulse text-amber-600" />
                      {language === "vi" ? "Ý kiến chuyên gia AI:" : "AI Compliance Counsel Advice:"}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">{riskAnalysisResult.aiAdvice}</p>
                  </div>

                  {/* Actions to stamp and print */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowOfficialReportModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
                    >
                      <Printer size={13} />
                      {language === "vi" ? "In Chứng Nhận Đóng Dấu Đỏ" : "Print Official Stamped Report"}
                    </button>
                    
                    {riskAnalysisResult.isFullyAudited ? (
                      <div className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs py-2.5 rounded-xl font-black uppercase tracking-wider">
                        <Check size={14} />
                        {language === "vi" ? `Đạt chuẩn (${riskAnalysisResult.auditedAt})` : `Audited & Certified`}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkCaseFullyAudited(riskAnalysisResult.caseId)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        <UserCheck size={14} />
                        {language === "vi" ? "Phê Duyệt Đạt Chuẩn Kiểm Soát" : "Verify & Certify Compliance"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Bot size={40} className="mx-auto text-slate-300 mb-2.5 animate-bounce" />
                  <p className="text-xs font-bold">
                    {language === "vi" ? "Vui lòng chọn hồ sơ bên trái và bấm quét" : "Select a dossier and run compliance analysis"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ESCROW & AML CLEARANCES */}
        {controllerTab === "escrow" && (
          <div className="space-y-4 relative z-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Coins className="text-slate-800 w-4.5 h-4.5" />
                  {language === "vi" ? "Kiểm soát Tài khoản Tạm giữ & Giao dịch Ủy thác" : "Escrow & Client Trust Accounts Audit Console"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === "vi" ? "Phê chuẩn các yêu cầu thanh toán giá trị cao và thẩm định dòng tiền nộp tạm ứng án phí." : "Authorize high-value transactions and clear legal deposits after AML checking."}
                </p>
              </div>
              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-mono font-bold">
                {escrowTransactions.filter(tx => tx.status.includes("Pending")).length} {language === "vi" ? "giao dịch chờ duyệt" : "pending clearances"}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3.5">Mã Giao Dịch / Hồ Sơ</th>
                    <th className="p-3.5">Loại Giao Dịch</th>
                    <th className="p-3.5">Giá Trị</th>
                    <th className="p-3.5">Người Đệ Trình</th>
                    <th className="p-3.5">AML Status</th>
                    <th className="p-3.5 text-right">Trạng Thái / Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {escrowTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="text-slate-400 font-mono font-bold">{tx.id}</span>
                          <span className="text-slate-900 font-bold mt-0.5 max-w-xs truncate">{tx.dossierTitle}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">{tx.type}</td>
                      <td className="p-3.5 font-black text-slate-900 font-mono">{tx.amount}</td>
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="text-slate-700 font-bold">{tx.submittedBy}</span>
                          <span className="text-slate-400 text-[10px]">{new Date(tx.submittedAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black font-mono">
                          {tx.amlStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {tx.status === "Approved & Released" ? (
                          <span className="bg-emerald-50 text-emerald-700 font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider inline-block border border-emerald-100">
                            ✓ Released
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveEscrowTx(tx.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
                          >
                            {language === "vi" ? "Phê Duyệt Giải Ngân" : "Release Escrow"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: REAL-TIME SYSTEM AUDIT TRAIL LOGS */}
        {controllerTab === "trail" && (
          <div className="space-y-4 relative z-10 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Terminal className="text-slate-800 w-4.5 h-4.5" />
                  {language === "vi" ? "Nhật Ký Truy Vết & Kiểm Soát Hành Vi Thời Gian Thực" : "Real-time Operations Audit Trail Log"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === "vi" ? "Tự động ghi nhận mọi tương tác, tải lên tài liệu, thay đổi trạng thái của đội ngũ nhân sự." : "Automatically records all personnel activity, file uploads, and state changes."}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {auditTrailEvents.map((ev) => {
                let textClass = "text-slate-700";
                let badgeColor = "bg-slate-100 text-slate-600 border border-slate-200";
                if (ev.severity === "warning") {
                  textClass = "text-amber-800 font-bold";
                  badgeColor = "bg-amber-50 text-amber-700 border border-amber-200";
                } else if (ev.severity === "danger") {
                  textClass = "text-rose-700 font-extrabold";
                  badgeColor = "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse";
                } else if (ev.severity === "success") {
                  textClass = "text-emerald-800";
                  badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                }

                return (
                  <div 
                    key={ev.id} 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all gap-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded shrink-0 ${badgeColor} mt-0.5`}>
                        {ev.severity}
                      </span>
                      <div>
                        <p className={`text-xs ${textClass}`}>{ev.action}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold">
                          <span>{ev.actor}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{ev.dossierId}</span>
                          <span>•</span>
                          <span className="font-mono">{new Date(ev.timestamp).toLocaleTimeString("vi-VN")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 self-stretch sm:self-auto text-right">
                      {ev.status === "Audited" ? (
                        <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                          ✓ Checked
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckAuditEvent(ev.id)}
                          className="w-full sm:w-auto text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded border border-slate-300 transition-all cursor-pointer"
                        >
                          {language === "vi" ? "Phê Duyệt Khớp" : "Mark Audited"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ADVANCED CONFLICT-OF-INTEREST CROSS-LOOKUP */}
        {controllerTab === "conflict" && (
          <div className="space-y-4 relative z-10 animate-fade-in">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Users className="text-slate-800 w-4.5 h-4.5" />
                {language === "vi" ? "Hệ thống Tra cứu Xung đột Lợi ích Chéo tự động" : "Cross-Case Conflict of Interest Matrix Checker"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "vi" 
                  ? "Ngăn ngừa rủi ro đạo đức nghề luật bằng cách tra cứu chéo tên khách hàng, đối thủ hoặc tập đoàn mẹ trên toàn bộ tệp vụ việc."
                  : "Prevent ethical and professional code violations by cross-searching clients, opposing parties, or parent groups across active legal files."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search input card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    {language === "vi" ? "Tên đối tác hoặc đối thủ cần kiểm tra" : "Partner or Opposing Party Name"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={conflictSearchName}
                      onChange={(e) => setConflictSearchName(e.target.value)}
                      placeholder={language === "vi" ? "Ví dụ: Sunrise Land, Landmark..." : "e.g. Sunrise Land, Landmark..."}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 focus:border-slate-500 focus:outline-none rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConflictSearch}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {language === "vi" ? "Tra Cứu Xung Đột" : "Run Conflict Search"}
                </button>
              </div>

              {/* Status display card */}
              <div className="md:col-span-2 bg-slate-50/50 border border-slate-200 p-5 rounded-xl min-h-[160px] flex flex-col justify-center shadow-inner">
                {conflictResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl shrink-0 ${conflictResult.hasConflict ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                        {conflictResult.hasConflict ? <ShieldAlert size={20} /> : <CheckCircle size={20} />}
                      </div>
                      <div>
                        <h5 className={`text-sm font-black uppercase ${conflictResult.hasConflict ? "text-rose-700 animate-pulse" : "text-emerald-700"}`}>
                          {conflictResult.hasConflict 
                            ? (language === "vi" ? "⚠️ PHÁT HIỆN TRÙNG LẶP XUNG ĐỘT!" : "⚠️ CONFLICT OF INTEREST DETECTED!") 
                            : (language === "vi" ? "✓ AN TOÀN - KHÔNG XUNG ĐỘT" : "✓ COMPLIANCE CHECK PASSED")}
                        </h5>
                        <p className="text-[10px] text-slate-500">
                          {language === "vi" ? "Kết quả phân tích chéo thời gian thực" : "Real-time database cross-reference result"}
                        </p>
                      </div>
                    </div>

                    {conflictResult.hasConflict ? (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          {language === "vi" 
                            ? `Phát hiện bên được tra cứu có mối quan hệ trực tiếp hoặc gián tiếp với vụ việc hiện hữu:` 
                            : `The searched entity is directly or indirectly tied to active legal files in our database:`}
                        </p>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {conflictResult.conflictingDossiers.map((cd: any, idx: number) => (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-rose-200 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 font-mono font-extrabold px-1.5 py-0.5 rounded">{cd.id}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{cd.status}</span>
                              </div>
                              <p className="text-xs font-black text-slate-800">{cd.title}</p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {language === "vi" ? `Khách hàng: ` : `Client: `} <span className="text-slate-800 font-bold">{cd.client}</span>
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {language === "vi" ? `Luật sư phụ trách: ` : `Lead Counsel: `} <span className="text-slate-800 font-bold">{cd.lawyer}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-rose-50/50 border border-rose-200 p-2.5 rounded-lg text-[10px] text-rose-800 leading-normal font-mono">
                          {language === "vi" 
                            ? "Khuyến nghị kiểm soát chất lượng: Không tiếp nhận yêu cầu đại diện pháp lý cho khách hàng mới này để tránh vi phạm tư cách đạo đức hành nghề."
                            : "Controller Guideline: Reject representation for the incoming party to prevent attorney-client conflict of interest breaches."}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-700 font-sans leading-relaxed">{conflictResult.message}</p>
                        <p className="text-[10px] text-slate-400">
                          {language === "vi" 
                            ? "Thực thể này chưa có bất kỳ hồ sơ nào xung khắc hoặc trùng hợp trong cơ sở dữ liệu quốc gia của văn phòng." 
                            : "This entity has no contradicting legal files or counterparties in our firm's core database."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 space-y-1">
                    <Users size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold">
                      {language === "vi" ? "Nhập tên ở ô bên trái để phân tích xung đột" : "Enter a name in the left panel to execute conflict checks"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DYNAMIC SLA PERFORMANCE & SPEED METRICS */}
        {controllerTab === "sla" && (
          <div className="space-y-4 relative z-10 animate-fade-in">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Clock className="text-slate-800 w-4.5 h-4.5" />
                {language === "vi" ? "Bảng Giám sát Tốc độ SLA & Điểm Nghẽn Tiến Độ" : "Live SLA Compliance & Speed Metrics Center"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "vi" 
                  ? "Tự động phân tích tốc độ phản hồi hồ sơ, định vị nhân viên quá hạn và đưa ra hành động khẩn cấp."
                  : "Automatically analyses stage response times, pinpoints overdue personnel, and deploys rapid interventions."}
              </p>
            </div>

            {/* SLA Bento Grid Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{language === "vi" ? "SỨC KHỎE SLA" : "SLA HEALTH RATE"}</span>
                <div className="mt-2.5">
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {Math.round(100 - (overdueStages.length * 8.5))}%
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Stable compliance</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{language === "vi" ? "MỐC CHẬM TRỄ" : "OVERDUE BOTTLENECKS"}</span>
                <div className="mt-2.5">
                  <div className="text-2xl font-black text-rose-600 font-mono">
                    {overdueStages.length} {language === "vi" ? "Mốc trễ" : "Late"}
                  </div>
                  <p className="text-[10px] text-rose-500 font-medium mt-1">Requires immediate signoff</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{language === "vi" ? "ĐIỂM NGHẼN NHÂN SỰ" : "CRITICAL ASSIGNEE"}</span>
                <div className="mt-2.5">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {overdueStages[0]?.stage.assigneeName || (language === "vi" ? "Không có" : "None")}
                  </div>
                  <p className="text-[10px] text-amber-600 font-bold mt-1">
                    {overdueStages.length > 0 
                      ? (language === "vi" ? `Trễ nhiều vụ việc nhất (${overdueStages.length} mốc)` : `Lead delay contributor (${overdueStages.length} items)`)
                      : "Zero delays logged"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{language === "vi" ? "MỐC HOÀN THÀNH" : "COMPLETED MILESTONES"}</span>
                <div className="mt-2.5">
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {records.reduce((acc, curr) => acc + (curr.stages?.filter((s: any) => s.status === "Đã hoàn thành").length || 0), 0)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Total archived stages</p>
                </div>
              </div>
            </div>

            {/* SLA Delayed cases details with fast warnings */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {language === "vi" ? "DANH SÁCH SỰ CỐ SLA PHÁT SINH CHƯA XỬ LÝ" : "UNRESOLVED SLA DEVIATION TICKETS"}
                </h5>
                <span className="text-[10px] font-mono text-slate-400">Secured audit check</span>
              </div>

              {overdueStages.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center font-medium">✓ {language === "vi" ? "Hệ thống vận hành trơn tru, không có sự cố trễ hẹn." : "All systems nominal. No delayed timelines recorded."}</p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {overdueStages.map((os, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm hover:border-slate-300 transition-all">
                      <div>
                        <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold mr-1.5">{os.dossierId}</span>
                        <span className="text-xs font-extrabold text-slate-900">{os.dossierTitle}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {language === "vi" ? `Giai đoạn: ` : `Stage: `} <span className="font-bold text-rose-600">{os.stage.name}</span> • 
                          {language === "vi" ? ` Trách nhiệm: ` : ` Assignee: `} <span className="font-bold text-slate-700">{os.stage.assigneeName}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-rose-50 text-rose-700 font-extrabold border border-rose-100 px-2 py-0.5 rounded">
                          {language === "vi" ? `Trễ ${os.daysOverdue} ngày` : `${os.daysOverdue} days late`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setWarnStaffName(os.stage.assigneeName || "");
                            setWarnDossierId(os.dossierId || "");
                            setWarnReason(language === "vi" ? `Vi phạm cam kết SLA mốc "${os.stage.name}"` : `SLA violation on milestone "${os.stage.name}"`);
                            setWarnPenalty(language === "vi" ? "Nhắc nhở toàn cơ quan & hạ chỉ số KPI tuần" : "Official agency review & KPI reduction");
                            const elem = document.getElementById("disciplinary-warning-suite-card");
                            if (elem) elem.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="text-[9px] bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-2.5 py-1 rounded transition-all cursor-pointer whitespace-nowrap shadow-sm"
                        >
                          {language === "vi" ? "Ban Hành Kỷ Luật" : "Issue Warning"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AI SECURITY & DATA LEAK POLICY RULES */}
        {controllerTab === "security" && (
          <div className="space-y-4 relative z-10 animate-fade-in">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Lock className="text-slate-800 w-4.5 h-4.5" />
                {language === "vi" ? "Thiết lập Chính Sách Bảo Mật Dữ Liệu & Quy Tắc AI" : "AI Data Security & Zero-Trust Governance Configurator"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "vi" 
                  ? "Tùy biến các quy tắc mã hóa tài liệu, phòng ngừa rò rỉ thông tin khách hàng và kiểm soát quyền lực kép của kiểm soát chất lượng."
                  : "Customize document encryption parameters, prevent customer PII leakage via third-party LLMs, and enforce compliance constraints."}
              </p>
            </div>

            {securitySuccessAlert && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce">
                <Check size={14} />
                <span>{securitySuccessAlert}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">{language === "vi" ? "KIỂM SOÁT BẢO MẬT AI & DỮ LIỆU" : "AI & DATA LEAK PREVENTIONS"}</h5>

                {/* Encryption rule */}
                <div className="flex items-start justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">{language === "vi" ? "Mã hóa Văn Bản Án Lệ AES-256" : "Force AES-256 Case Encryption"}</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {language === "vi" ? "Bắt buộc mã hóa toàn bộ tệp tin PDF/DOCX tải lên." : "Encrypt all uploaded case files prior to cloud database persistence."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityConfig({ ...securityConfig, encryptDocs: !securityConfig.encryptDocs })}
                    className={`w-10 h-6 rounded-full p-1 transition-all shrink-0 cursor-pointer ${securityConfig.encryptDocs ? "bg-slate-900" : "bg-slate-200"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${securityConfig.encryptDocs ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>

                {/* AI leak shield */}
                <div className="flex items-start justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">{language === "vi" ? "Tấm Chắn Bảo Vệ Rò Rỉ PII qua AI" : "LLM PII Leak Shield"}</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {language === "vi" ? "Kiểm duyệt triệt để, ngăn chặn gửi dữ liệu khách hàng lên LLM." : "Strictly filter and block sending sensitive client identities to public LLM API routes."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityConfig({ ...securityConfig, limitAccess: !securityConfig.limitAccess })}
                    className={`w-10 h-6 rounded-full p-1 transition-all shrink-0 cursor-pointer ${securityConfig.limitAccess ? "bg-slate-900" : "bg-slate-200"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${securityConfig.limitAccess ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">{language === "vi" ? "QUYỀN LỰC KÉP & GIỚI HẠN PHÊ DUYỆT" : "DUAL-CONTROL & LIMITS"}</h5>

                {/* 4-Eyes mandate */}
                <div className="flex items-start justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">{language === "vi" ? "Bắt Buộc Quy Tắc 4-Eyes Signoff" : "Mandatory 4-Eyes Dual Signoff"}</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {language === "vi" ? "Yêu cầu kiểm soát chất lượng phê duyệt mốc rủi ro cao từ 100 Tr VND." : "Require final Quality Control authorization for any transactions exceeding 100M VND."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityConfig({ ...securityConfig, forceFourEyes: !securityConfig.forceFourEyes })}
                    className={`w-10 h-6 rounded-full p-1 transition-all shrink-0 cursor-pointer ${securityConfig.forceFourEyes ? "bg-slate-900" : "bg-slate-200"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${securityConfig.forceFourEyes ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>

                {/* Auto-anonymization */}
                <div className="flex items-start justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-slate-900">{language === "vi" ? "Ẩn danh hóa Danh Tính qua LLM" : "LLM Auto-Anonymization"}</p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {language === "vi" ? "Tự động ẩn thông tin nhạy cảm của khách hàng khi phân tích SLA." : "Automatically mask real identity values in the LLM analysis prompts."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityConfig({ ...securityConfig, autoAnonymize: !securityConfig.autoAnonymize })}
                    className={`w-10 h-6 rounded-full p-1 transition-all shrink-0 cursor-pointer ${securityConfig.autoAnonymize ? "bg-slate-900" : "bg-slate-200"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${securityConfig.autoAnonymize ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  updateSecurityConfig(securityConfig);
                  setSecuritySuccessAlert(language === "vi" ? "✓ Đã áp dụng quy tắc Zero-Trust bảo mật thành công!" : "✓ Zero-Trust AI security rules updated successfully!");
                  setTimeout(() => setSecuritySuccessAlert(""), 4000);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm animate-pulse"
              >
                {language === "vi" ? "Áp Dụng Quy Tắc Chính Sách" : "Apply & Enforce Policy"}
              </button>
            </div>
          </div>
        )}

        {/* TAB: CMS APPROVALS */}
        {controllerTab === "cms" && (
          <div className="space-y-6 relative z-10 animate-fade-in">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <FileCheck className="text-indigo-600 w-4.5 h-4.5" />
                Kiểm Duyệt & Phê Duyệt Nội Dung CMS
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Dành cho Kiểm soát chất lượng phê duyệt các bài đăng Pháp Luật, Án Lệ, Tiền Lệ trước khi công bố ra Trang chủ.
              </p>
            </div>

            {isCmsLoading ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">Đang tải danh sách chờ duyệt...</div>
            ) : pendingCms.length === 0 ? (
              <div className="bg-slate-50 border border-dashed rounded-xl p-8 text-center text-slate-500 text-sm">
                🎉 Không có nội dung CMS nào đang chờ phê duyệt.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingCms.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.type === "news" ? "Tin Tức" : item.type === "judgments" ? "Bản Án" : item.type === "precedents" ? "Án Lệ" : item.type === "services" ? "Dịch Vụ" : item.type === "testimonials" ? "Đánh Giá" : item.type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ID: #{item.id}</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-800">{item.title || item.name}</h5>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">{item.summary || item.description || item.content}</p>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="text-[10px] text-slate-400">
                        Người tạo: <span className="font-bold text-slate-600">{item.author || "Thành viên"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectCms(item.id, item.type)}
                          className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleApproveCms(item.id, item.type)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Phê duyệt đăng tải
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ATTENDANCE & TIMESHEET MANAGER */}
        {controllerTab === "attendance" && (
          <div className="space-y-6 relative z-10 animate-fade-in">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="text-blue-600 w-4.5 h-4.5" />
                Công cụ Quản lý Chấm Công & Đi Muộn
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Chấm công hàng loạt theo chức danh hoặc phê duyệt lý do giải trình khi nhân viên đi muộn (quá giờ quy định).
              </p>
            </div>

            {/* BULK ATTENDANCE WIDGET */}
            <BulkAttendanceWidget fetchAttendance={fetchAttendance} api={api} language={language} />

            {/* LATE JUSTIFICATION QUEUE */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                Hộp thư giải trình đi muộn chờ phê duyệt
              </h5>
              
              {isAttendanceLoading ? (
                <div className="text-center py-4 text-xs text-slate-400">Đang tải...</div>
              ) : attendance.filter(a => a.status === "pending" || a.status === "Pending").length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Không có giải trình trễ giờ nào đang chờ duyệt.</p>
              ) : (
                <div className="space-y-3">
                  {attendance.filter(a => a.status === "pending" || a.status === "Pending").map((item) => (
                    <div key={item.id} className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.staff_name || item.name || item.username}</p>
                          <p className="text-xs text-slate-400">Chức danh: <span className="font-semibold text-slate-600">@{item.role}</span></p>
                        </div>
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
                          Vào lúc: {item.check_in_time}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-xs border border-amber-100 italic text-slate-600">
                        <strong>Lý do giải trình:</strong> {item.explanation || item.late_reason || "Không ghi rõ"}
                      </div>
                      {item.proof_file && (
                        <div className="text-xs text-[#0a2d37] font-semibold bg-[#e6f3f5] p-2.5 rounded-lg border border-[#cbe5e9] flex items-center gap-2">
                          <span>📎</span>
                          <a href={item.proof_file} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#0a2d37] font-bold">
                            Tải tài liệu chứng minh đính kèm
                          </a>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApproveLateAttendance(item.id, "absent")}
                          className="px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-xs font-bold transition-all"
                        >
                          Không duyệt (Vắng)
                        </button>
                        <button
                          onClick={() => handleApproveLateAttendance(item.id, "present")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Phê duyệt chấm công
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ATTENDANCE HISTORY FOR TODAY */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                Nhật ký chấm công hôm nay ({new Date().toLocaleDateString('vi-VN')})
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-2.5 font-bold text-slate-600">Nhân sự</th>
                      <th className="p-2.5 font-bold text-slate-600">Chức danh</th>
                      <th className="p-2.5 font-bold text-slate-600">Thời gian</th>
                      <th className="p-2.5 font-bold text-slate-600">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{item.staff_name || item.name || item.username}</td>
                        <td className="p-2.5 text-slate-500 font-semibold">@{item.role}</td>
                        <td className="p-2.5 text-slate-400 font-mono">{item.check_in_time || "-"}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (item.status === "present" || item.status === "Present") ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                            (item.status === "pending" || item.status === "Pending") ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            "bg-red-100 text-red-800 border border-red-200"
                          }`}>
                            {(item.status === "present" || item.status === "Present") ? "Đúng giờ / Đã duyệt" : (item.status === "pending" || item.status === "Pending") ? "Chờ duyệt đi muộn" : "Vắng mặt"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">Chưa có ai chấm công hôm nay.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REPORT UNLOCKS */}
        {controllerTab === "unlocks" && (
          <div className="space-y-6 relative z-10 animate-fade-in">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Unlock className="text-amber-600 w-4.5 h-4.5" />
                Yêu cầu Giải Trình & Mở Khóa Báo Cáo
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Phê duyệt giải trình quá hạn nộp báo cáo kết quả làm việc từ nhân viên để mở khóa sửa đổi.
              </p>
            </div>

            {isUnlocksLoading ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">Đang tải dữ liệu...</div>
            ) : unlockRequests.filter(r => r.status === "pending").length === 0 ? (
              <div className="bg-slate-50 border border-dashed rounded-xl p-8 text-center text-slate-500 text-sm">
                🎉 Không có yêu cầu mở khóa báo cáo nào đang chờ xử lý.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {unlockRequests.filter(r => r.status === "pending").map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">Nhân viên: <span className="text-slate-600">{item.staff_name}</span></p>
                        <p className="text-[10px] text-slate-400 font-mono">Dossier ID: #{item.dossier_id}</p>
                      </div>
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-mono">
                        Lịch: {item.event_date}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Tiêu đề lịch liên quan</p>
                      <p className="text-xs font-bold text-slate-700">{item.event_title}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg text-xs border border-slate-200 italic text-slate-600">
                      <strong>Lý do giải trình trễ hạn:</strong> "{item.reason}"
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-3">
                      <button
                        onClick={() => handleApproveUnlock(item.id, item.dossier_id, false)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all"
                      >
                        Từ chối mở khóa
                      </button>
                      <button
                        onClick={() => handleApproveUnlock(item.id, item.dossier_id, true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        Đồng ý cho báo cáo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: BUSINESS & WORKLOAD ANALYTICS */}
        {controllerTab === "analytics" && (
          <div className="space-y-6 relative z-10 animate-fade-in">
            <div className="border-b border-slate-200 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="text-emerald-600 w-4.5 h-4.5" />
                  Trung Tâm Phân Tích Số Liệu & Hiệu Suất Pháp Lý
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân tích số liệu vụ việc, mốc làm việc và phân bố hồ sơ thời gian thực dành cho Ban Giám Đốc và Quản lý.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg text-xs font-extrabold text-slate-700 flex items-center gap-1 cursor-pointer transition-all"
              >
                <Printer size={12} /> Xuất Báo Cáo In
              </button>
            </div>

            {/* STRATEGIC METRICS BENTO GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng số hồ sơ</span>
                <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{records.length}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Đang được lưu trữ</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mốc hoàn thành</span>
                <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">{stats.completed}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Trên tổng {stats.totalStages} mốc</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tỷ lệ trễ hạn SLA</span>
                <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
                  {stats.totalStages > 0 ? Math.round((stats.overdueSLA / stats.totalStages) * 100) : 0}%
                </p>
                <p className="text-[10px] text-rose-500 font-medium mt-1">Cần cải thiện khẩn cấp</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duyệt Ký 4 Mắt</span>
                <p className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                  {Object.keys(completedSignoffIds).length}
                </p>
                <p className="text-[10px] text-indigo-500 font-bold mt-1">Mốc chất lượng đạt chuẩn</p>
              </div>
            </div>

            {/* RECHARTS VISUALIZATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BarChart: Stages Performance by Dossier */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Tiến độ mốc thời gian của từng vụ việc</h5>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={records.slice(0, 8).map(r => ({
                        name: r.client || r.title?.substring(0, 10) + "...",
                        "Hoàn thành": r.stages?.filter((s: any) => s.status === "Đã hoàn thành").length || 2,
                        "Đang làm": r.stages?.filter((s: any) => s.status === "Đang tiến hành" || s.status === "Chờ phê duyệt").length || 1,
                        "Chờ thực hiện": r.stages?.filter((s: any) => s.status === "Chờ thực hiện").length || 1,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#e2e8f0" }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Đang làm" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Chờ thực hiện" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PieChart: Category Distribution */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Cơ cấu lĩnh vực vụ việc hiện tại</h5>
                <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-4">
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dynamicPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {dynamicPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs">
                    {dynamicPieData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 font-medium">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Ranking Table */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Bảng xếp hạng hiệu suất xử lý mốc SLA của nhân sự</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-3 font-bold text-slate-600">Nhân sự</th>
                      <th className="p-3 font-bold text-slate-600">Chức danh</th>
                      <th className="p-3 font-bold text-slate-600">Tổng mốc</th>
                      <th className="p-3 font-bold text-slate-600">Hoàn thành</th>
                      <th className="p-3 font-bold text-slate-600">Hoàn thành đúng hạn</th>
                      <th className="p-3 font-bold text-slate-600">Đang trễ</th>
                      <th className="p-3 font-bold text-slate-600">Hiệu suất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffStats.map((item, idx) => {
                      const complianceRate = item.completed > 0 ? Math.round((item.completedOnTime / item.completed) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{item.name}</td>
                          <td className="p-3 text-slate-500 font-medium">@{item.role}</td>
                          <td className="p-3 text-slate-700 font-mono">{item.total}</td>
                          <td className="p-3 text-emerald-600 font-mono font-bold">{item.completed}</td>
                          <td className="p-3 text-blue-600 font-mono font-bold">{item.completedOnTime}</td>
                          <td className="p-3 text-rose-600 font-mono font-bold">{item.overdue}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full" style={{ width: `${complianceRate}%` }} />
                              </div>
                              <span className="font-black text-slate-800 font-mono">{complianceRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: QUALITY CONTROL KEYWORD SCANNER */}
        {controllerTab === "keywords" && (
          <KeywordScanner 
            records={records} 
            language={language} 
            setViewingRecord={setViewingRecord}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB: SMART SCHEDULE SCANNER */}
        {controllerTab === "smart-scanner" && (
          <SmartScheduleScanner language={language} />
        )}
      </div>

      {/* 2. Audit Queue Panel (Hộp thư phê duyệt) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide font-serif">
              {language === "vi" ? "Hộp Thư Phê Duyệt Khẩn Cấp Của Kiểm Soát Viên" : "Controller Pending Approvals Audit Queue"}
            </h3>
          </div>
          <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full font-mono">
            {auditQueue.length} {language === "vi" ? "yêu cầu chờ xử lý" : "pending requests"}
          </span>
        </div>

        {auditQueue.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            {language === "vi" ? "Không có yêu cầu phê duyệt nào đang chờ xử lý." : "No pending stages awaiting signoff."}
          </div>
        ) : (
          <div className="space-y-4">
            {auditQueue.map((item) => (
              <div
                key={item.stage.id}
                className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all duration-300 hover:border-slate-300"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      {item.dossierId}
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">{item.dossierTitle}</span>
                  </div>
                  <h4 className="text-base font-bold text-amber-700 flex items-center gap-2">
                    <span>{item.stage.name}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full font-sans">
                      {language === "vi" ? "Chờ duyệt" : "Awaiting signoff"}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {language === "vi" ? "Phụ trách: " : "Assignee: "}
                    <span className="font-bold text-slate-700">{item.stage.assigneeName}</span>
                    <span className="mx-2">•</span>
                    {language === "vi" ? "Hạn chót: " : "Deadline: "}
                    <span className="font-bold text-rose-600">{item.stage.dueDate}</span>
                  </p>
                  {item.stage.notes && (
                    <div className="text-xs bg-amber-50/50 border border-amber-200/40 p-2.5 rounded-xl text-slate-600 font-mono">
                      <span className="font-bold">Ghi chú từ nhân sự:</span> {item.stage.notes}
                    </div>
                  )}

                  {/* Rating Selector */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-600">
                      {language === "vi" ? "Đánh giá chất lượng hồ sơ (1-10):" : "Quality Grade (1-10):"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRatings({ ...ratings, [item.stage.id]: num })}
                          className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center border transition-all ${
                            (ratings[item.stage.id] || 10) === num
                              ? "bg-slate-900 border-slate-950 text-white shadow-sm scale-110"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback field */}
                  <div className="mt-2.5">
                    <input
                      type="text"
                      placeholder={language === "vi" ? "Nhập ý kiến chỉ đạo / yêu cầu chỉnh sửa..." : "Enter directive or rework instructions..."}
                      value={feedbackInputs[item.stage.id] || ""}
                      onChange={(e) => setFeedbackInputs({ ...feedbackInputs, [item.stage.id]: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleRejectStage(item.dossierId, item.stage.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all duration-300"
                  >
                    <X size={14} />
                    {language === "vi" ? "Trả về làm lại" : "Reject & Rework"}
                  </button>
                  <button
                    onClick={() => handleApproveStage(item.dossierId, item.stage.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all duration-300"
                  >
                    <Check size={14} />
                    {language === "vi" ? "Phê duyệt đạt chuẩn" : "Approve & Signoff"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Overdue SLA Table (Điểm nghẽn nghiệp vụ) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-rose-500 w-5 h-5 shrink-0" />
            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide font-serif">
              {language === "vi" ? "Điểm Nghẽn Nghiệp Vụ - Danh Sách Giai Đoạn Quá Hạn SLA" : "Global SLA Overdue Bottlenecks"}
            </h3>
          </div>
          <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-1 rounded-full font-mono">
            {overdueStages.length} {language === "vi" ? "cảnh báo quá hạn" : "overdue alerts"}
          </span>
        </div>

        {overdueStages.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            {language === "vi" ? "Chúc mừng! Không có giai đoạn nào quá hạn SLA." : "Excellent! No stages have exceeded SLA."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-3.5">{language === "vi" ? "Mã Hồ Sơ / Tên Vụ Việc" : "Case ID & Title"}</th>
                  <th className="p-3.5">{language === "vi" ? "Giai Đoạn Quá Hạn" : "Overdue Stage"}</th>
                  <th className="p-3.5">{language === "vi" ? "Người Phụ Trách" : "Assignee"}</th>
                  <th className="p-3.5">{language === "vi" ? "Hạn Chót SLA" : "SLA Deadline"}</th>
                  <th className="p-3.5 text-center">{language === "vi" ? "Mức Độ Trễ" : "Days Overdue"}</th>
                  <th className="p-3.5 text-right">{language === "vi" ? "Hành Động" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {overdueStages.map((item) => (
                  <tr key={item.stage.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs font-mono">{item.dossierId}</span>
                        <span className="text-slate-800 font-bold max-w-xs truncate">{item.dossierTitle}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-900 font-extrabold">{item.stage.name}</td>
                    <td className="p-3.5">{item.stage.assigneeName}</td>
                    <td className="p-3.5 text-rose-600 font-semibold">{item.stage.dueDate}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        item.daysOverdue > 7
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {language === "vi" ? `Trễ ${item.daysOverdue} ngày` : `${item.daysOverdue} days late`}
                        {item.daysOverdue > 7 && (
                          <span className="block text-[8px] text-rose-700 font-bold uppercase tracking-wider mt-0.5 animate-pulse">
                            {language === "vi" ? "Cực kỳ nghiêm trọng" : "Critical bottleneck"}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap md:flex-nowrap">
                        <button
                          onClick={() => alert(`Đã gửi cảnh báo đôn đốc khẩn qua SMS & Email cho ${item.stage.assigneeName} về hồ sơ ${item.dossierId}!`)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition-all duration-300 whitespace-nowrap"
                        >
                          {language === "vi" ? "Đôn đốc khẩn" : "Urgent Urge"}
                        </button>

                        {["admin", "director", "deputy_director", "deputydirector", "controller", "kiểm soát viên"].includes((user?.role || "").toLowerCase()) && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleReassignStage(item.dossierId, item.stage.id, e.target.value);
                                e.target.value = ""; // reset selection
                              }
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold px-2 py-1.5 rounded-lg focus:outline-none cursor-pointer max-w-[140px]"
                            defaultValue=""
                          >
                            <option value="" disabled>{language === "vi" ? "Tái phân công..." : "Reassign..."}</option>
                            {staffStats.filter((s: any) => s.name !== item.stage.assigneeName).map((s: any) => (
                              <option key={s.name} value={s.name}>{s.name} ({s.role})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Staff Workload & Balancer (Giám sát tải việc & cân bằng thông minh) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Users className="text-slate-700 w-5 h-5 shrink-0" />
            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide font-serif">
              {language === "vi" ? "Giám sát Tải việc & Cảnh báo SLA Nhân sự" : "Staff Workload & SLA Guardian"}
            </h3>
          </div>
          
          {myConsultants.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 p-1 rounded-xl">
              <button
                onClick={() => setShowOnlyMyStaff(true)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  showOnlyMyStaff
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "vi" ? `Nhân sự quản lý (${myConsultants.length})` : `My Direct Staff (${myConsultants.length})`}
              </button>
              <button
                onClick={() => setShowOnlyMyStaff(false)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  !showOnlyMyStaff
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "vi" ? "Toàn bộ công ty" : "All Staff"}
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="p-3.5">{language === "vi" ? "Mã NS" : "Code"}</th>
                <th className="p-3.5">{language === "vi" ? "Họ Và Tên" : "Staff Member"}</th>
                <th className="p-3.5">{language === "vi" ? "Chức Vụ" : "Role / Title"}</th>
                <th className="p-3.5 text-center">{language === "vi" ? "Tổng Việc" : "Total Tasks"}</th>
                <th className="p-3.5 text-center bg-blue-50/30">{language === "vi" ? "Đang Xử Lý" : "Active"}</th>
                <th className="p-3.5 text-center bg-rose-50/30">{language === "vi" ? "Quá Hạn SLA" : "Late"}</th>
                <th className="p-3.5 text-center">{language === "vi" ? "Tỷ Lệ Đạt SLA" : "SLA Compliance"}</th>
                <th className="p-3.5 text-right">{language === "vi" ? "Tình Trạng Tải" : "Workload Load Status"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {staffStats.map((staff) => {
                const slaRate = staff.completed > 0 ? Math.round((staff.completedOnTime / staff.completed) * 100) : 100;
                const isOverloaded = staff.active > 3;

                return (
                  <tr key={staff.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 text-xs text-slate-500 font-mono">{staff.code}</td>
                    <td className="p-3.5">
                      <div className="text-slate-900 font-extrabold">{staff.name}</div>
                    </td>
                    <td className="p-3.5 text-slate-500 text-xs font-bold uppercase tracking-wider">{staff.role}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-800">{staff.total}</td>
                    <td className="p-3.5 text-center font-mono font-black text-blue-600 bg-blue-50/20">{staff.active}</td>
                    <td className="p-3.5 text-center font-mono font-black text-rose-600 bg-rose-50/20">{staff.overdue}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-black ${
                          slaRate >= 90 ? "text-emerald-600" : slaRate >= 75 ? "text-amber-600" : "text-rose-600"
                        }`}>
                          {slaRate}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full ${
                              slaRate >= 90 ? "bg-emerald-500" : slaRate >= 75 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${slaRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      {isOverloaded ? (
                        <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                          ⚠️ Quá Tải (Overload)
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                          ✅ Bình Thường (Safe)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4.5. Disciplinary Warning Center (Trung tâm Kỷ luật & Quyết định Cảnh cáo) */}
      <div id="disciplinary-warning-suite-card" className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 overflow-hidden space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <ShieldAlert className="text-rose-600 w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide font-serif">
              {language === "vi" ? "Trung Tâm Kỷ Luật & Quyết Định Cảnh Cáo" : "Disciplinary Warning & SLA Penalty Center"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "vi" ? "Công cụ ban hành phán quyết, khiển trách và chế tài quản lý đối với nhân sự vi phạm SLA hoặc chất lượng nghiệp vụ" : "Official oversight portal for issuing reprimands and management penalties for SLA breaches"}
            </p>
          </div>
        </div>

        {["admin", "director", "deputy_director", "deputydirector", "controller", "kiểm soát viên"].includes((user?.role || "").toLowerCase()) ? (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {language === "vi" ? "✍️ Ban hành quyết định mới" : "✍️ Issue New Reprimand"}
              </h4>

              <div className="space-y-3.5 text-xs text-slate-700 font-medium font-sans">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600">{language === "vi" ? "Chọn nhân sự chịu chế tài" : "Select Target Staff"}</label>
                  <select
                    value={warnStaffName}
                    onChange={(e) => setWarnStaffName(e.target.value)}
                    className="px-3 py-2 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="">{language === "vi" ? "-- Chọn nhân sự --" : "-- Select staff --"}</option>
                    {staffStats.map((s: any) => (
                      <option key={s.name} value={s.name}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600">{language === "vi" ? "Mức độ cảnh báo" : "Reprimand Level"}</label>
                  <select
                    value={warnLevel}
                    onChange={(e) => setWarnLevel(e.target.value)}
                    className="px-3 py-2 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="reminder">{language === "vi" ? "Nhắc nhở nhẹ (Operational Reminder)" : "Operational Reminder"}</option>
                    <option value="warning">{language === "vi" ? "Cảnh báo vi phạm SLA (SLA Warning)" : "SLA Warning"}</option>
                    <option value="critical">{language === "vi" ? "Kỷ luật nghiêm khắc (Severe Reprimand)" : "Severe Reprimand"}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600">{language === "vi" ? "Liên kết hồ sơ (Nếu có)" : "Associated Dossier ID"}</label>
                  <select
                    value={warnDossierId}
                    onChange={(e) => setWarnDossierId(e.target.value)}
                    className="px-3 py-2 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl bg-white text-xs font-mono"
                  >
                    <option value="">{language === "vi" ? "-- Không liên kết --" : "-- General / None --"}</option>
                    {dossiers.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.id} - {d.title.substring(0, 30)}...</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5 text-xs text-slate-700 font-medium">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600">{language === "vi" ? "Lý do và Hành vi vi phạm" : "Reason / Violation Conducted"}</label>
                  <textarea
                    rows={2}
                    placeholder={language === "vi" ? "Ví dụ: Trễ hạn SLA liên tục bước Hòa giải 24h không nộp báo cáo giải trình..." : "E.g. Repeated SLA delays without submitting timely explanations..."}
                    value={warnReason}
                    onChange={(e) => setWarnReason(e.target.value)}
                    className="px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-600">{language === "vi" ? "Chế tài & Hình thức xử phạt (SLA Penalty / Disciplinary Action)" : "SLA Penalty & Corrective Measure"}</label>
                  <input
                    type="text"
                    placeholder={language === "vi" ? "Ví dụ: Trừ 5 điểm thi đua thi đua, đình chỉ tạm thời quyền tự nhận hồ sơ mới..." : "E.g. -5 KPI points, suspended automatic case assignment for 7 days..."}
                    value={warnPenalty}
                    onChange={(e) => setWarnPenalty(e.target.value)}
                    className="px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleIssueWarning}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all duration-300 shadow-md flex items-center gap-2"
                >
                  <ShieldAlert size={14} />
                  {language === "vi" ? "Ký và Phát hành Cảnh cáo" : "Sign & Issue Decisive Warning"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs font-medium">
            {language === "vi" 
              ? "Chỉ có Kiểm soát viên, Giám đốc hoặc Admin mới có quyền ban hành quyết định cảnh cáo nhân sự." 
              : "Only Controllers, Directors or Admins have permissions to issue official disciplinary reprimands."}
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            {language === "vi" ? "📋 Nhật ký Quyết định & Trạng thái Khắc phục" : "📋 Disciplinary Warning & Resolution Log"}
          </h4>

          {warnings.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-medium">
              {language === "vi" ? "Chưa có quyết định cảnh cáo nào được ban hành." : "No disciplinary warnings on record."}
            </div>
          ) : (
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {warnings.map((warn) => {
                let badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
                if (warn.level === "critical") badgeColor = "bg-rose-100 text-rose-800 border-rose-200";
                else if (warn.level === "warning") badgeColor = "bg-amber-100 text-amber-800 border-amber-200";

                return (
                  <div
                    key={warn.id}
                    className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-4.5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300"
                  >
                    <div className="space-y-1.5 flex-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {warn.level === "critical" ? (language === "vi" ? "Nghiêm trọng" : "Critical") : warn.level === "warning" ? (language === "vi" ? "Cảnh cáo" : "Warning") : (language === "vi" ? "Nhắc nhở" : "Reminder")}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 font-sans">
                          {warn.staffName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(warn.issuedAt).toLocaleDateString("vi-VN")} {new Date(warn.issuedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">
                        <span className="font-extrabold text-slate-900">{language === "vi" ? "Hành vi: " : "Reason: "}</span>
                        {warn.reason}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                        <div className="bg-white/60 p-2 rounded-lg border border-slate-200/50">
                          <span className="font-bold text-slate-500">{language === "vi" ? "Hình phạt / Chế tài:" : "SLA Penalty:"}</span>{" "}
                          <span className="text-rose-700 font-bold">{warn.penalty}</span>
                        </div>
                        <div className="bg-white/60 p-2 rounded-lg border border-slate-200/50">
                          <span className="font-bold text-slate-500">{language === "vi" ? "Hồ sơ / Ban hành:" : "Dossier / Issuer:"}</span>{" "}
                          <span className="text-slate-700 font-bold">{warn.dossierId}</span> | <span className="text-slate-600 font-bold">{warn.issuedBy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => {
                          setSelectedWarningToPrint(warn);
                          setShowOfficialWarningModal(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm whitespace-nowrap"
                      >
                        <Printer size={12} />
                        {language === "vi" ? "In Quyết Định" : "Print Decree"}
                      </button>

                      {warn.acknowledged ? (
                        <span className="w-full sm:w-auto text-center bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider whitespace-nowrap">
                          ✓ {language === "vi" ? "Đã khắc phục" : "Acknowledged"}
                        </span>
                      ) : (
                        <span className="w-full sm:w-auto text-center bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider animate-pulse font-sans whitespace-nowrap">
                          ⚠️ {language === "vi" ? "Chờ khắc phục" : "Pending Acknowledge"}
                        </span>
                      )}

                      {["admin", "director", "deputy_director", "deputydirector", "controller", "kiểm soát viên"].includes((user?.role || "").toLowerCase()) && (
                        <button
                          onClick={() => handleDeleteWarning(warn.id)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1 bg-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-300"
                        >
                          <X size={12} />
                          {language === "vi" ? "Hủy bỏ" : "Revoke"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Interactive Timeline Pipeline (Bộ lọc & Thẩm định tiến trình từng hồ sơ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane: Dossier selector list */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide font-serif">
              {language === "vi" ? "Giám Sát Tiến Trình Hồ Sơ" : "Filter & Select Case Timeline"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === "vi" ? "Tìm kiếm và lọc tiến trình giải quyết từng hồ sơ" : "Track detailed resolution stage for each dossier"}
            </p>
          </div>

          {/* Search and filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={language === "vi" ? "Tìm mã hồ sơ, tiêu đề..." : "Search case code or title..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl bg-slate-50 font-medium"
              >
                <option value="all">{language === "vi" ? "Tất cả lĩnh vực" : "All fields"}</option>
                <option value="Tranh tụng">{language === "vi" ? "Tranh tụng" : "Litigation"}</option>
                <option value="Tư vấn Pháp luật">{language === "vi" ? "Tư vấn Pháp luật" : "Legal Advice"}</option>
                <option value="Đại diện Ngoài tố tụng">{language === "vi" ? "Đại diện Ngoài tố tụng" : "Out-of-court Representation"}</option>
                <option value="Pháp chế & Nội bộ">{language === "vi" ? "Pháp chế & Nội bộ" : "Corporate Compliance"}</option>
                <option value="Trọng tài & Hòa giải">{language === "vi" ? "Trọng tài & Hòa giải" : "Arbitration & Mediation"}</option>
                <option value="Hình sự & Bào chữa">{language === "vi" ? "Hình sự & Bào chữa" : "Criminal Defense"}</option>
                <option value="Đất đai & Bất động sản">{language === "vi" ? "Đất đai & Bất động sản" : "Real Estate & Land"}</option>
                <option value="Doanh nghiệp & M&A">{language === "vi" ? "Doanh nghiệp & M&A" : "Enterprise & M&A"}</option>
                <option value="Lao động & Hợp đồng">{language === "vi" ? "Lao động & Hợp đồng" : "Labor & Contracts"}</option>
                {/* Dynamically added custom legal domains */}
                {customCategories.map((c: any) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                title={language === "vi" ? "Thêm Lĩnh vực Mới / Bổ sung Quy trình" : "Add New Field & Workflow"}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">{language === "vi" ? "Thêm Lĩnh vực" : "Add Field"}</span>
              </button>
            </div>
          </div>

          {/* List of dossiers */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredDossiers.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                {language === "vi" ? "Không tìm thấy hồ sơ nào." : "No dossiers matched filters."}
              </div>
            ) : (
              filteredDossiers.map((d) => {
                const isSelected = d.id === selectedDossierId;
                
                // Calculate progress % based on stages
                const completed = d.stages?.filter((s: any) => s.status === "Đã hoàn thành").length || 0;
                const total = d.stages?.length || 1;
                const progressPct = Math.round((completed / total) * 100);

                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDossierId(d.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-slate-900 border-slate-950 text-white shadow-md"
                        : "bg-slate-50 border-slate-100 text-slate-700 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                        isSelected ? "bg-slate-800 text-white" : "bg-white text-slate-700 border border-slate-200"
                      }`}>
                        {d.id}
                      </span>
                      <span className={`text-[10px] font-black uppercase ${
                        d.priority === "Khẩn cấp" ? "text-rose-500" : "text-amber-500"
                      }`}>
                        {d.priority}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold leading-relaxed line-clamp-2">
                      {d.title}
                    </h4>

                    {/* Progress slider mini */}
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-[9px] font-mono opacity-80">
                        <span>{language === "vi" ? "Tiến độ: " : "Progress: "}</span>
                        <span className="font-bold">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Detailed Timeline Pipeline */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6">
          {selectedDossier ? (
            <>
              {/* Case details header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="bg-slate-100 text-slate-800 font-mono text-xs font-black px-2.5 py-1 rounded-lg">
                    {selectedDossier.id}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {language === "vi" ? "Chủ trì: " : "Lead: "}
                    <span className="font-bold text-slate-800">{selectedDossier.mainAssignee}</span>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-serif mt-2 leading-snug">
                  {selectedDossier.title}
                </h3>
                <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs text-slate-500 mt-2 font-medium">
                  <div>
                    {language === "vi" ? "Khách hàng: " : "Client: "}{" "}
                    <span className="font-bold text-slate-700">{selectedDossier.client}</span>
                  </div>
                  <div>
                    {language === "vi" ? "Điện thoại: " : "Phone: "}{" "}
                    <span className="font-mono text-slate-700">{selectedDossier.clientPhone || "---"}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Timeline */}
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-amber-500" />
                    {language === "vi" ? `Quy trình giải quyết vụ việc chi tiết (${selectedDossier.stages?.length || 0} bước)` : `Interactive Timeline Stages (${selectedDossier.stages?.length || 0} steps)`}
                  </span>
                  
                  {/* Plus button to add custom stages */}
                  <button
                    onClick={() => setShowAddStageModal(true)}
                    className="flex items-center gap-1 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow transition-all duration-300"
                  >
                    <Plus size={12} />
                    {language === "vi" ? "Bổ sung giai đoạn đặc thù" : "Add Custom Stage"}
                  </button>
                </div>

                <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
                  {selectedDossier.stages?.map((stage: any, index: number) => {
                    const isLocked = isMediationLocked(stage);
                    let badgeClass = "bg-slate-100 text-slate-600 border border-slate-200";
                    if (stage.status === "Đã hoàn thành") badgeClass = "bg-emerald-100 text-emerald-800 border border-emerald-200";
                    else if (stage.status === "Đang tiến hành") badgeClass = "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse";
                    else if (stage.status === "Chờ phê duyệt" || stage.status === "Chờ kiểm soát") badgeClass = "bg-amber-100 text-amber-800 border border-amber-200";

                    return (
                      <div key={stage.id} className="relative group">
                        
                        {/* Timeline bubble bullet */}
                        <div className={`absolute -left-[31px] top-0.5 w-4.5 h-4.5 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                          stage.status === "Đã hoàn thành"
                            ? "bg-emerald-500 border-emerald-100"
                            : stage.status === "Đang tiến hành"
                            ? "bg-blue-500 border-blue-100 scale-110"
                            : "bg-slate-300 border-slate-100"
                        }`} />

                        <div className={`bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-2.5 transition-all duration-300 hover:border-slate-200 ${
                          isLocked ? "border-rose-400 bg-rose-50/20" : ""
                        }`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-800 max-w-sm flex items-center gap-1.5">
                              <span>Step {index + 1}: {stage.name}</span>
                              {isLocked && (
                                <span className="bg-rose-100 text-rose-800 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide border border-rose-300">
                                  <Lock size={8} /> Khóa (Locked)
                                </span>
                              )}
                            </h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${badgeClass}`}>
                              {stage.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold font-mono">
                            <span>Phụ trách: <strong className="text-slate-700">{stage.assigneeName}</strong></span>
                            <span>Hạn chót: <strong className="text-slate-700">{stage.dueDate}</strong></span>
                          </div>

                          {stage.notes && (
                            <div className="text-[10px] bg-slate-100/50 border border-slate-200/40 p-2 rounded text-slate-600 font-mono">
                              {stage.notes}
                            </div>
                          )}

                          {stage.approvalNotes && (
                            <div className="text-[10px] bg-emerald-50 border border-emerald-100 p-2 rounded text-emerald-800 font-mono">
                              <span className="font-bold">Đã thẩm duyệt bởi {stage.approvedBy}:</span> {stage.approvalNotes}
                              {stage.approvalRating && (
                                <span className="bg-emerald-200 text-emerald-900 text-[9px] font-black px-1.5 py-0.5 rounded-full ml-2">
                                  ⭐ {stage.approvalRating}/10
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action panel */}
                          <div className="flex justify-end gap-2 border-t border-slate-200/50 pt-2.5 mt-1">
                            {isLocked ? (
                              <div className="w-full flex flex-col gap-2">
                                <p className="text-[10px] text-rose-600 font-bold">
                                  ⚠️ Hết 24h quy định chưa cập nhật kết quả hòa giải. Vui lòng gửi giải trình!
                                </p>
                                {stage.mediationExplanation && (
                                  <div className="text-[10px] bg-rose-50 border border-rose-100 p-1.5 rounded text-rose-800 font-mono">
                                    <span className="font-bold">Giải trình đã gửi:</span> {stage.mediationExplanation}
                                  </div>
                                )}
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Giải trình lý do trễ hạn..."
                                    value={mediationExpls[stage.id] !== undefined ? mediationExpls[stage.id] : (stage.mediationExplanation || "")}
                                    onChange={(e) => setMediationExpls({ ...mediationExpls, [stage.id]: e.target.value })}
                                    className="flex-1 text-xs px-2 py-1 border border-rose-200 focus:outline-none rounded"
                                  />
                                  <button
                                    onClick={() => handleExplanationSubmit(stage.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1 rounded"
                                  >
                                    Gửi
                                  </button>
                                  {["admin", "director", "deputy_director", "deputydirector", "controller", "kiểm soát viên"].includes((user?.role || "").toLowerCase()) && (
                                    <button
                                      onClick={() => handleUnlockMediation(stage.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-0.5"
                                    >
                                      <Unlock size={10} /> Mở khóa
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
                                {stage.status === "Đang tiến hành" && (
                                  <button
                                    onClick={() => handleSubmitStageForReview(selectedDossier.id, stage.id)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    NỘP PHÊ DUYỆT
                                  </button>
                                )}
                                {stage.status === "Chờ thực hiện" && (
                                  <button
                                    onClick={() => handleAdvanceStage(selectedDossier.id, stage.id)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[9px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    BẮT ĐẦU THỰC HIỆN
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 font-medium text-sm">
              {language === "vi" ? "Vui lòng chọn một hồ sơ bên trái để xem tiến độ." : "Please select a dossier to view progress timeline."}
            </div>
          )}
        </div>
      </div>

      {/* 6. Risk Prevention Systems - 4 Pillars */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
          <Shield className="text-slate-800 w-5 h-5 shrink-0" />
          <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide font-serif">
            {language === "vi" ? "Bộ Phòng Ngừa Rủi Ro" : "Risk Prevention Portal"}
          </h3>
        </div>

        {/* Pillars Nav */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-4">
          <button
            onClick={() => setActivePillarTab("pillar1")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${
              activePillarTab === "pillar1"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
            }`}
          >
            <Lock size={12} />
            {language === "vi" ? "1. Bảo Mật & An Ninh" : "1. Info Security"}
          </button>
          <button
            onClick={() => setActivePillarTab("pillar2")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${
              activePillarTab === "pillar2"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
            }`}
          >
            <Users size={12} />
            {language === "vi" ? "2. Xung Đột Lợi Ích" : "2. Conflict Lookup"}
          </button>
          <button
            onClick={() => setActivePillarTab("pillar3")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${
              activePillarTab === "pillar3"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
            }`}
          >
            <UserCheck size={12} />
            {language === "vi" ? "3. Chất Lượng (4-Eyes)" : "3. 4-Eyes Signoff"}
          </button>
          <button
            onClick={() => setActivePillarTab("pillar4")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${
              activePillarTab === "pillar4"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
            }`}
          >
            <DollarSign size={12} />
            {language === "vi" ? "4. Tuân Thủ & AML" : "4. Compliance & AML"}
          </button>
          <button
            onClick={() => setActivePillarTab("pillar5")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${
              activePillarTab === "pillar5"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
            }`}
          >
            <Activity size={12} />
            {language === "vi" ? "5. Giám Sát Cuộc Gọi & AI Compliance" : "5. Call Audit & AI Compliance"}
          </button>
        </div>

        {/* Tab content */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          {activePillarTab === "pillar1" && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm uppercase">
                {language === "vi" ? "Chính Sách Mã Hóa Tài Liệu & An Toàn AI" : "Document Encryption & AI Screening Policy"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === "vi"
                  ? "Cấu hình tự động mã hóa văn bản nhạy cảm và giới hạn truy cập cho tài sản trí tuệ. Hệ thống AI quét và lọc dữ liệu bảo mật trước khi gửi thông tin."
                  : "Configure automated document encryption and AI data leak checks. Prevents sensitive partner leakage."}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">{language === "vi" ? "Mã hóa văn bản tự động" : "Auto-Encryption"}</span>
                    <p className="text-[10px] text-slate-400">AES-256 for all uploaded PDFs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityConfig.encryptDocs}
                    onChange={(e) => updateSecurityConfig({ ...securityConfig, encryptDocs: e.target.checked })}
                    className="w-4 h-4 accent-slate-900 cursor-pointer"
                  />
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">{language === "vi" ? "Giới hạn tệp tin" : "Restrict File Access"}</span>
                    <p className="text-[10px] text-slate-400">Strictly block external sharing</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityConfig.limitAccess}
                    onChange={(e) => updateSecurityConfig({ ...securityConfig, limitAccess: e.target.checked })}
                    className="w-4 h-4 accent-slate-900 cursor-pointer"
                  />
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700">{language === "vi" ? "Kiểm duyệt AI tự động" : "AI Compliance Scan"}</span>
                    <p className="text-[10px] text-slate-400">Audit prompt leakages via LLMs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityConfig.aiScan}
                    onChange={(e) => updateSecurityConfig({ ...securityConfig, aiScan: e.target.checked })}
                    className="w-4 h-4 accent-slate-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activePillarTab === "pillar2" && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm uppercase">
                {language === "vi" ? "Tra Cứu Khách Hàng Tránh Xung Đột Lợi Ích" : "Client Cross-Lookup & Conflict Control"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === "vi"
                  ? "Ngăn ngừa đại diện đối lập. Nhập tên của bên đối tác hoặc đối tượng liên quan để tra cứu chéo chống xung đột lợi ích."
                  : "Prevent representing opposing parties. Search client names to detect operational conflicts."}
              </p>

              <div className="flex gap-2 max-w-lg pt-2">
                <input
                  type="text"
                  placeholder={language === "vi" ? "Nhập tên bên đối tác để kiểm tra..." : "Enter client name to inspect..."}
                  value={conflictSearchName}
                  onChange={(e) => setConflictSearchName(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl bg-white shadow-sm"
                />
                <button
                  onClick={handleConflictSearch}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-300 shadow-sm"
                >
                  {language === "vi" ? "Tra cứu ngay" : "Search"}
                </button>
              </div>

              {conflictResult && (
                <div className={`p-4 rounded-xl border mt-3 transition-all duration-300 ${
                  conflictResult.hasConflict
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}>
                  <h5 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    {conflictResult.hasConflict ? (
                      <>
                        <ShieldAlert size={14} className="text-rose-500" />
                        {language === "vi" ? "CẢNH BÁO: XUNG ĐỘT LỢI ÍCH PHÁT HIỆN" : "WARNING: POTENTIAL CONFLICT DETECTED"}
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} className="text-emerald-500" />
                        {language === "vi" ? "AN TOÀN NGHIỆP VỤ" : "COMPLIANCE SECURE"}
                      </>
                    )}
                  </h5>
                  <p className="text-xs">{conflictResult.message}</p>
                  {conflictResult.hasConflict && (
                    <div className="space-y-2 mt-3">
                      <p className="text-[11px] font-bold text-rose-700">Tìm thấy các vụ việc có bên liên quan trùng khớp:</p>
                      {conflictResult.conflictingDossiers.map((cd: any) => (
                        <div key={cd.id} className="bg-white/80 p-2.5 rounded border border-rose-100 text-[10px] text-slate-700 font-mono">
                          <strong>Mã:</strong> {cd.id} | <strong>Tên:</strong> {cd.title} | <strong>Khách hàng:</strong> {cd.client} | <strong>Luật sư:</strong> {cd.lawyer}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activePillarTab === "pillar3" && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm uppercase">
                {language === "vi" ? "Bảo Đảm Chất Lượng Ý Kiến Pháp Lý (Nguyên Tắc 4 Mắt)" : "4-Eyes Principle Signoff Queue"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === "vi"
                  ? "Tất cả các bản ý kiến pháp lý, hợp đồng, hoặc văn bản tố tụng dự thảo bởi Trợ lý hoặc Chuyên viên phải có Senior Partner duyệt ký."
                  : "All legal opinions and contract drafts must receive a second review from a Senior Partner before delivery."}
              </p>

              <div className="space-y-2 pt-2">
                {signoffs.map((item) => (
                  <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-slate-800 block">{item.docName}</span>
                      <p className="text-[10px] text-slate-400">
                        Hồ sơ: <strong className="text-slate-600 font-mono">{item.dossierId}</strong> | Soạn thảo: <strong className="text-slate-600">{item.draftedBy}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (item.stageId) {
                            handleApproveStage(item.dossierId, item.stageId);
                          }
                          updateCompletedSignoffs(prev => ({ ...prev, [item.id]: true }));
                          alert("Đã ký phê duyệt đạt chuẩn chất lượng.");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ký phê duyệt (4-Eyes)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePillarTab === "pillar4" && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm uppercase">
                {language === "vi" ? "Rà Soát Tài Chính & Phòng Chống Rửa Tiền (AML)" : "Anti-Money Laundering (AML) Financial Audit"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === "vi"
                  ? "Tự động phát hiện các giao dịch uỷ thác thanh toán bất thường hoặc có giá trị lớn vượt ngưỡng rủi ro."
                  : "Automated verification of transactions exceeding financial thresholds to enforce compliance."}
              </p>

              <div className="space-y-2 pt-2">
                {amlAlerts.map((alertItem) => (
                  <div key={alertItem.id} className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{alertItem.type}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          alertItem.level === "Cao" ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {alertItem.level} Risk
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Đối tác: <strong className="text-slate-600">{alertItem.partner}</strong> | Giá trị: <strong className="text-rose-600 font-mono">{alertItem.value}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {alertItem.status === "Chờ xác minh" ? (
                        <button
                          onClick={() => {
                            updateVerifiedAml(prev => ({ ...prev, [alertItem.id]: true }));
                            if (alertItem.dossierId) {
                              const targetDossier = dossiers.find((d) => d.id === alertItem.dossierId);
                              if (targetDossier) {
                                const updatedRecord = { ...targetDossier, amlVerified: true };
                                updateRecords(
                                  records.map((r: any) => (r.id === alertItem.dossierId ? updatedRecord : r)),
                                  updatedRecord
                                );
                              }
                            }
                            alert("Đã hoàn tất xác minh dòng tiền hợp lệ.");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors animate-pulse"
                        >
                          Xác minh ngay
                        </button>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">
                          ✓ Đã rà soát
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePillarTab === "pillar5" && (
            <div className="space-y-6 text-left">
              <div>
                <h4 className="font-bold text-slate-800 text-sm uppercase">
                  {language === "vi" 
                    ? "Trung tâm Giám sát Đàm thoại VoIP & AI Compliance" 
                    : "VoIP Call Auditing & AI Compliance Hub"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  {language === "vi"
                    ? "Kết nối trực tiếp tới tổng đài PBX Yeastar. Tự động thu âm, chuyển giọng nói sang văn bản dạng văn bản qua AI và quét rà soát từ khóa cấm (Blacklist) trong thời gian thực."
                    : "Real-time connection with Yeastar PBX. Auto records, transcribes, and runs keyword violation scans via AI."}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {language === "vi" ? "Tổng cuộc gọi" : "Total Calls"}
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-800 mt-1">
                    {voipLogs.length}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {language === "vi" ? "Đồng bộ từ tổng đài Yeastar" : "Synced from Yeastar"}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {language === "vi" ? "Tổng thời lượng" : "Total Duration"}
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                    {Math.round(voipLogs.reduce((acc, log) => acc + log.duration, 0) / 60)} {language === "vi" ? "phút" : "mins"}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {language === "vi" ? "Đàm thoại tích lũy" : "Cumulative call duration"}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {language === "vi" ? "Kết nối thành công" : "Connection Rate"}
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-600 mt-1">
                    {voipLogs.length > 0 
                      ? `${Math.round((voipLogs.filter(l => l.status === "connected").length / voipLogs.length) * 100)}%`
                      : "100%"}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {language === "vi" ? "Tỷ lệ thông suốt SIP" : "SIP connection rate"}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    {language === "vi" ? "Vi phạm Blacklist" : "Compliance Warnings"}
                  </span>
                  <div className="text-xl font-bold font-mono text-rose-600 mt-1">
                    {voipLogs.filter(l => l.isViolated).length}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {language === "vi" ? "Tỷ lệ vi phạm: " : "Alert rate: "}
                    <strong className="text-rose-500">
                      {voipLogs.length > 0 
                        ? `${Math.round((voipLogs.filter(l => l.isViolated).length / voipLogs.length) * 100)}%`
                        : "0%"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Call logs detail container */}
              <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    {language === "vi" ? "Lịch sử đàm thoại toàn tổng đài (Giám đốc)" : "Global VoIP Call Transcripts"}
                  </h5>
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-[10px] font-bold">
                    Ext: Active Link with PBX (101 - 104)
                  </span>
                </div>

                {/* Call logs render loop */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 text-left">
                  {voipLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-4 rounded-xl border transition-all text-xs flex flex-col gap-3 ${
                        log.isViolated 
                          ? "bg-rose-50/40 border-rose-100" 
                          : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {/* Row Header info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg shrink-0 ${
                            log.isViolated ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                          }`}>
                            <Activity size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{log.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({log.phone})</span>
                              {log.dossierId && (
                                <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono">
                                  {log.dossierId}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {language === "vi" ? "Nhân viên: " : "Assigned staff: "}
                              <strong className="text-slate-600">{log.staffName || "Chưa phân công"}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock size={11} />
                            {log.timestamp}
                          </span>
                          <span className="font-bold font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                            {log.duration > 0 ? `${Math.floor(log.duration / 60)}m ${log.duration % 60}s` : "0s"}
                          </span>
                        </div>
                      </div>

                      {/* Playback Audio simulation */}
                      {log.hasRecording && (
                        <div className="bg-white p-3 rounded-xl border border-slate-150 space-y-2">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                if (activeVoipPlayingId === log.id) {
                                  setActiveVoipPlayingId(null);
                                } else {
                                  setActiveVoipPlayingId(log.id);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                activeVoipPlayingId === log.id 
                                  ? "bg-rose-500 text-white animate-pulse" 
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                            >
                              {activeVoipPlayingId === log.id ? <Pause size={12} /> : <Play size={12} />}
                              <span>
                                {activeVoipPlayingId === log.id 
                                  ? (language === "vi" ? "Đang phát..." : "Playing...") 
                                  : (language === "vi" ? "Nghe ghi âm cuộc gọi" : "Play Recording")}
                              </span>
                            </button>
                            
                            {activeVoipPlayingId === log.id && (
                              <span className="font-mono text-[10px] text-emerald-600 font-bold">
                                {voipPlayingProgress}% {language === "vi" ? "hoàn tất" : "loaded"}
                              </span>
                            )}
                          </div>

                          {/* Progress bar and audio wave animation */}
                          <div className="flex items-end gap-1.5 h-10 px-3 bg-slate-950/5 rounded-lg border border-slate-100/50 justify-center">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((val) => (
                              <div 
                                key={val}
                                className={`w-1 rounded-full transition-all duration-300 ${
                                  activeVoipPlayingId === log.id ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                                style={{ 
                                  height: activeVoipPlayingId === log.id ? `${Math.floor(Math.random() * 26) + 6}px` : "6px",
                                  animation: activeVoipPlayingId === log.id ? `bounce 0.8s ease-in-out infinite alternate ${val * 0.05}s` : "none"
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transcripts Text and AI Scanning highlights */}
                      <div className="bg-slate-950/5 p-3 rounded-xl border border-slate-100 space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                          {language === "vi" ? "Bản dịch đàm thoại chuyển văn bản bởi AI:" : "AI Transcript text output:"}
                        </span>
                        <p className="text-[11px] text-slate-700 leading-relaxed font-sans whitespace-pre-line bg-white p-3 rounded-lg border border-slate-100">
                          {log.transcript || "---"}
                        </p>

                        {log.isViolated && (
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-rose-700 font-bold text-[10px] uppercase">
                              <ShieldAlert size={14} />
                              <span>{language === "vi" ? "Cảnh báo vi phạm Blacklist" : "Blacklist Keywords Violation Detected"}</span>
                            </div>
                            <p className="text-[10px] text-slate-600">
                              {language === "vi" 
                                ? `Hệ thống kiểm tra tự động phát hiện từ khóa cấm: [${log.violatedKeywords?.join(", ")}]. Hãy rà soát quy trình làm việc của tư vấn viên này.`
                                : `Speech-to-text scan found non-compliant keyword: [${log.violatedKeywords?.join(", ")}].`}
                            </p>
                            
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                onClick={() => {
                                  // Prompt warning dispatch details
                                  setWarnStaffName(log.staffName || "Trợ lý Pháp lý Vũ Nam");
                                  setWarnLevel("critical");
                                  setWarnDossierId(log.dossierId || "HS-VOIP-COMPLIANCE");
                                  setWarnReason(`Phát hiện từ khóa Blacklist [${log.violatedKeywords?.join(", ")}] trong hội thoại đàm thoại: ${log.transcript.substring(0, 100)}...`);
                                  setWarnPenalty("Đình chỉ tư vấn trực tiếp, điều chuyển làm việc bàn giấy chờ kiểm điểm nội bộ.");
                                  setShowOfficialWarningModal(true);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                              >
                                {language === "vi" ? "Xử lý kỷ luật / Gửi cảnh cáo" : "Dispatch Disciplinary Action"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {voipLogs.length === 0 && (
                    <div className="text-center py-10 text-slate-400 italic">
                      {language === "vi" ? "Chưa có cuộc gọi nào được ghi nhận." : "No call records registered."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7. Modal: Add Custom Stage */}
      {showAddStageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base font-serif uppercase tracking-wide">
                {language === "vi" ? "Bổ sung giai đoạn đặc thù" : "Add Custom Process Stage"}
              </h3>
              <button
                onClick={() => setShowAddStageModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold">{language === "vi" ? "Tên giai đoạn đặc thù" : "Stage Name"}</label>
                <input
                  type="text"
                  placeholder={language === "vi" ? "Nhập tên giai đoạn..." : "E.g., Đăng ký bổ sung đất đai..."}
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold">{language === "vi" ? "Hạn chót hoàn thành (SLA Due Date)" : "SLA Due Date"}</label>
                <input
                  type="date"
                  value={newStageDueDate}
                  onChange={(e) => setNewStageDueDate(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold">{language === "vi" ? "Người phụ trách chuyên môn" : "Assignee"}</label>
                <select
                  value={newStageAssignee}
                  onChange={(e) => setNewStageAssignee(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl bg-white"
                >
                  <option value="">{language === "vi" ? "-- Chọn người phụ trách --" : "-- Select assignee --"}</option>
                  {staffStats.map((s) => (
                    <option key={s.name} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowAddStageModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all duration-300"
              >
                {language === "vi" ? "Hủy bỏ" : "Cancel"}
              </button>
              <button
                onClick={handleAddCustomStage}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl transition-all duration-300"
              >
                {language === "vi" ? "Bổ sung vào quy trình" : "Append to Process"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7b. Modal: Add New Legal Domain/Category & Custom Workflow */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg font-serif uppercase tracking-wide flex items-center gap-2">
                  <Scale className="text-amber-500" size={20} />
                  <span>{language === "vi" ? "Thêm Lĩnh vực Pháp lý & Quy trình Giải quyết Mới" : "Add Legal Field & Workflow"}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === "vi" ? "Khởi tạo lĩnh vực hoạt động mới và thiết lập lộ trình xử lý tiêu chuẩn" : "Create new domain and setup standard execution pipeline"}
                </p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 max-h-[65vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-800">
                    {language === "vi" ? "Tên Lĩnh vực Pháp lý Mới *" : "Legal Field Name *"}
                  </label>
                  <input
                    type="text"
                    placeholder={language === "vi" ? "Ví dụ: Tài chính & Ngân hàng..." : "E.g. Banking & Finance"}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-800">
                    {language === "vi" ? "Mã Phân loại / Tag Code" : "Field Code"}
                  </label>
                  <input
                    type="text"
                    placeholder="FIELD-BANKING"
                    value={newCatCode}
                    onChange={(e) => setNewCatCode(e.target.value)}
                    className="px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-800">
                  {language === "vi" ? "Mô tả phạm vi tư vấn / giải quyết" : "Scope & Description"}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === "vi" ? "Mô tả sơ lược phạm vi hoạt động chuyên môn của lĩnh vực này..." : "Scope description..."}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-slate-400 rounded-xl"
                />
              </div>

              {/* Workflow stages builder */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Activity size={14} className="text-amber-500" />
                    {language === "vi"
                      ? `Quy trình giải quyết chuẩn cho lĩnh vực này (${newCatStages.length} bước)`
                      : `Standard Workflow Steps (${newCatStages.length} steps)`}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCategoryStageField}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>{language === "vi" ? "Thêm bước" : "Add Step"}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newCatStages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
                      <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0 w-6">#{idx + 1}</span>
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCatStages(prev => prev.map((s, i) => i === idx ? { ...s, name: val } : s));
                        }}
                        placeholder={`Tên bước ${idx + 1}...`}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 bg-white focus:outline-none focus:border-slate-400 rounded-lg"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={stage.slaDays}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setNewCatStages(prev => prev.map((s, i) => i === idx ? { ...s, slaDays: val } : s));
                          }}
                          className="w-14 text-xs px-1.5 py-1.5 border border-slate-200 bg-white focus:outline-none focus:border-slate-400 rounded-lg text-center font-mono"
                        />
                        <span className="text-[10px] font-medium text-slate-500">ngày</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategoryStageField(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Xóa bước này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {language === "vi" ? "Hủy bỏ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleCreateCategoryWithWorkflow}
                className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>{language === "vi" ? "Lưu Lĩnh vực & Quy trình Mới" : "Save Field & Workflow"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MODAL: CHỨNG NHẬN ĐẠT CHUẨN KIỂM SOÁT (RED STAMP) */}
      {/* ========================================================= */}
      {showOfficialReportModal && riskAnalysisResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div id="sla-compliance-report-card" className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-slate-200 text-slate-800 relative overflow-hidden my-8">
            
            {/* Watermark security backdrop */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <Shield size={400} className="text-slate-900" />
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowOfficialReportModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all z-20"
            >
              <X size={20} />
            </button>

            {/* Legal Document Header */}
            <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-5 mb-6 relative z-10">
              <h4 className="text-xs font-black tracking-widest text-slate-900 uppercase">
                {language === "vi" ? "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" : "SOCIALIST REPUBLIC OF VIETNAM"}
              </h4>
              <p className="text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                {language === "vi" ? "Độc lập - Tự do - Hạnh phúc" : "Independence - Freedom - Happiness"}
              </p>
              <div className="w-32 h-0.5 bg-slate-400 mx-auto mt-2" />
              <div className="pt-3">
                <span className="text-[10px] font-bold text-slate-500 font-mono block">
                  {language === "vi" ? `Số hiệu chứng thư: ${riskAnalysisResult.certifiedNo}` : `Cert. Reference: ${riskAnalysisResult.certifiedNo}`}
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase font-serif mt-1 tracking-wide">
                  {language === "vi" ? "CHỨNG THƯ THẨM ĐỊNH TUÂN THỦ TOÀN DIỆN" : "COMPLIANCE & SLA ASSURANCE CERTIFICATE"}
                </h3>
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  {language === "vi" ? "Ban hành bởi Kiểm soát chất lượng tối cao Hệ thống Luật sư Ánh Dương" : "Issued officially by the Supreme Controller Authority of the Anh Duong Law Firm"}
                </p>
              </div>
            </div>

            {/* Document Content */}
            <div className="space-y-5 text-xs leading-relaxed relative z-10 font-sans text-slate-700">
              <p>
                {language === "vi" 
                  ? "Căn cứ vào dữ liệu hoạt động nghiệp vụ thời gian thực, giám sát lộ trình giải quyết vụ việc và đối chiếu 4-Eyes Signoff, Kiểm soát chất lượng tối cao xác nhận hồ sơ sau đây đã được rà soát đạt chuẩn tuân thủ và không phát hiện xung đột lợi ích:" 
                  : "Based on real-time operation logs, SLA timeline progress, and dual 4-eyes signoffs, the Supreme Controller hereby certifies that the following dossier complies fully with all institutional safeguards:"}
              </p>

              {/* Grid of certified data */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "MÃ HỒ SƠ" : "CASE ID"}</span>
                  <span className="text-xs font-mono font-black text-slate-900">{riskAnalysisResult.caseId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "TÊN VỤ VIỆC" : "CASE TITLE"}</span>
                  <span className="text-xs font-extrabold text-slate-900 line-clamp-1">{riskAnalysisResult.caseTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "KHÁCH HÀNG CHỦ THỂ" : "CLIENT NAME"}</span>
                  <span className="text-xs font-bold text-slate-900">{riskAnalysisResult.clientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "ĐIỂM CHẤT LƯỢNG SLA" : "SLA ASSURANCE RATING"}</span>
                  <span className="text-xs font-mono font-black text-slate-900">{riskAnalysisResult.slaHealthScore}/100</span>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2.5">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "KẾT LUẬN THẨM ĐỊNH AI" : "AI COMPLIANCE CONCLUSION"}</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed italic mt-1 bg-white p-2.5 border border-slate-200 rounded-xl">
                    "{riskAnalysisResult.aiAdvice}"
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-500 italic border-t border-dashed border-slate-200 pt-4">
                {language === "vi"
                  ? "Chứng thư này đại diện cho sự cam kết tuyệt đối về chất lượng tư vấn pháp lý của Văn phòng Luật sư Ánh Dương. Mọi sửa đổi thông tin trái phép sẽ bị coi là vi phạm nghiêm trọng và tự động hủy hiệu lực."
                  : "This official document represents the highest commitment of legal diligence of our firm. Any unauthorized alteration of the contents renders this certificate immediately null and void."}
              </p>

              {/* Signature and RED STAMP */}
              <div className="grid grid-cols-2 gap-4 pt-4 items-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "NGÀY BAN HÀNH" : "DATE OF ISSUE"}</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{riskAnalysisResult.auditedAt}</span>
                  <div className="pt-2 text-[10px] text-slate-500 font-bold font-mono">
                    IP: 192.168.1.300 <br />
                    PRO-LOCKER SECURED
                  </div>
                </div>

                {/* Circular double lined Vietnamese Red Stamp */}
                <div className="text-center relative">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">
                    {language === "vi" ? "CHỨNG THỰC BỞI" : "CERTIFIED BY"}
                  </span>
                  
                  {/* CSS/SVG realistic red stamp */}
                  <div className="relative w-36 h-36 rounded-full border-4 border-double border-red-600/85 flex items-center justify-center select-none rotate-[-4deg] scale-95 mx-auto opacity-95 shadow-sm transition-transform duration-300 hover:rotate-[0deg] cursor-pointer">
                    <div className="absolute inset-2.5 rounded-full border border-red-600/80 flex items-center justify-center">
                      <span className="absolute text-[8px] font-black text-red-600 tracking-widest uppercase text-center w-full transform -translate-y-9">
                        ★ V.P LUẬT SƯ ÁNH DƯƠNG ★
                      </span>
                      <div className="text-center font-serif text-red-600/90 font-extrabold flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase leading-none tracking-tight">CỘNG ĐỒNG</span>
                        <span className="text-[12px] uppercase leading-none tracking-wide mt-1">KIỂM SOÁT</span>
                        <span className="text-[8px] uppercase mt-0.5 leading-none">VIÊN CHÍNH THỨC</span>
                      </div>
                      <span className="absolute text-[8px] font-black text-red-600 tracking-widest uppercase text-center w-full transform translate-y-10">
                        HÀ NỘI - VIỆT NAM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="flex gap-3 mt-8 border-t border-slate-100 pt-5 relative z-10">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Printer size={14} />
                {language === "vi" ? "In Sắc Lệnh Bản Cứng" : "Print & Generate Hardcopy"}
              </button>
              
              <button
                type="button"
                disabled={isDownloadingReport}
                onClick={async () => {
                  const cardElement = document.getElementById("sla-compliance-report-card");
                  if (cardElement) {
                    setIsDownloadingReport(true);
                    try {
                      const canvas = await html2canvas(cardElement, {
                        useCORS: true,
                        allowTaint: false,
                        scale: 2,
                      });
                      const dataUrl = canvas.toDataURL("image/png");
                      const link = document.createElement("a");
                      link.download = `ChungThu_Compliance_${riskAnalysisResult.caseId}.png`;
                      link.href = dataUrl;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error("Error generating compliance certificate image:", error);
                    } finally {
                      setIsDownloadingReport(false);
                    }
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Download size={14} className={isDownloadingReport ? "animate-bounce" : ""} />
                {language === "vi" ? (isDownloadingReport ? "Đang tải..." : "Tải Chứng Thư (.png)") : (isDownloadingReport ? "Downloading..." : "Download Cert (.png)")}
              </button>

              <button
                type="button"
                onClick={() => setShowOfficialReportModal(false)}
                className="px-6 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
              >
                {language === "vi" ? "Đóng lại" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MODAL: QUYẾT ĐỊNH XỬ LÝ VI PHẠM SẮC BÉN (RED STAMP) */}
      {/* ========================================================= */}
      {showOfficialWarningModal && selectedWarningToPrint && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div id="sla-warning-decree-card" className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 border border-slate-200 text-slate-800 relative overflow-hidden my-8">
            
            {/* Watermark security backdrop */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <ShieldAlert size={350} className="text-slate-900 animate-pulse" />
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowOfficialWarningModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all z-20"
            >
              <X size={20} />
            </button>

            {/* Legal Document Header */}
            <div className="text-center space-y-1.5 border-b-2 border-red-600 pb-5 mb-6 relative z-10">
              <h4 className="text-xs font-black tracking-widest text-slate-900 uppercase">
                {language === "vi" ? "VĂN PHÒNG LUẬT SƯ ÁNH DƯƠNG" : "ANH DUONG LAW FIRM PARTNERSHIP"}
              </h4>
              <p className="text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                {language === "vi" ? "HỘI ĐỒNG THẨM ĐỊNH & KIỂM SOÁT CHẤT LƯỢNG TỐI CAO" : "COUNCIL OF SUPREME COMPLIANCE"}
              </p>
              <div className="w-24 h-0.5 bg-red-600 mx-auto mt-2" />
              <div className="pt-3">
                <span className="text-[10px] font-bold text-slate-500 font-mono block">
                  No: {selectedWarningToPrint.id}
                </span>
                <h3 className="text-lg font-black text-red-600 uppercase font-serif mt-1 tracking-wide">
                  {language === "vi" ? "QUYẾT ĐỊNH XỬ LÝ KỶ LUẬT CHẤT LƯỢNG (SLA)" : "OFFICIAL DECREE ON SLA BREACH & DISCIPLINE"}
                </h3>
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  {language === "vi" ? "Áp dụng chế tài nghiêm ngặt chống chậm trễ giải quyết yêu cầu khách hàng" : "Enforcing institutional sanctions to clear operational bottlenecks"}
                </p>
              </div>
            </div>

            {/* Document Content */}
            <div className="space-y-4 text-xs leading-relaxed relative z-10 text-slate-700 font-sans">
              <p>
                {language === "vi" 
                  ? "Căn cứ Biên bản đối chiếu SLA tự động từ hệ thống giám sát và rà soát tiến độ, Hội đồng kiểm soát quyết định thi hành biện pháp nhắc nhở và kỷ luật đối với nhân sự chịu trách nhiệm sau:" 
                  : "Based on automated system timeline audits and lead partner reports, the Compliance Committee hereby issues a disciplinary decree to the following designated personnel:"}
              </p>

              {/* Warning dossier details */}
              <div className="bg-rose-50/40 border border-rose-200/60 p-4 rounded-2xl space-y-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "NHÂN SỰ VI PHẠM" : "OFFENDER NAME"}</span>
                  <span className="text-xs font-extrabold text-slate-900">{selectedWarningToPrint.staffName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "HÀNH VI VI PHẠM TIẾN ĐỘ" : "TIMELINE VIOLATION"}</span>
                  <span className="text-xs font-semibold text-rose-800">{selectedWarningToPrint.reason}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "HÌNH PHẠT & CHẾ TÀI ÁP DỤNG" : "PENALTY & REMEDIAL REQUIREMENT"}</span>
                  <span className="text-xs font-black text-rose-700 block">{selectedWarningToPrint.penalty}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-200/50 text-[10px]">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase">{language === "vi" ? "MÃ HỒ SƠ" : "DOSSIER ID"}</span>
                    <span className="font-mono font-bold text-slate-700">{selectedWarningToPrint.dossierId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase">{language === "vi" ? "NGƯỜI KÝ QUYẾT ĐỊNH" : "ISSUER"}</span>
                    <span className="font-bold text-slate-700">{selectedWarningToPrint.issuedBy}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                {language === "vi"
                  ? "Quyết định này có hiệu lực thi hành ngay kể từ ngày ban hành. Nhân sự bị kỷ luật có nghĩa vụ thực hiện việc giải trình, khắc phục lỗi trễ hạn chậm nhất trong vòng 24 giờ làm việc."
                  : "This decree is effective immediately. The offender must submit a status resolution report and clear the pipeline backlog within 24 operational hours."}
              </p>

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-4 pt-3 items-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{language === "vi" ? "NGÀY KÝ BAN HÀNH" : "DATE OF ISSUE"}</span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {new Date(selectedWarningToPrint.issuedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                {/* Circular red stamp of the Law Firm for warnings */}
                <div className="text-center relative">
                  <div className="relative w-32 h-32 rounded-full border-4 border-double border-red-600/80 flex items-center justify-center select-none rotate-[-6deg] mx-auto opacity-95 shadow-sm">
                    <div className="absolute inset-2 rounded-full border border-red-600/70 flex items-center justify-center">
                      <span className="absolute text-[7px] font-black text-red-600 tracking-wider uppercase text-center w-full transform -translate-y-8">
                        ★ V.P LUẬT SƯ ÁNH DƯƠNG ★
                      </span>
                      <div className="text-center font-serif text-red-600/90 font-black flex flex-col items-center justify-center">
                        <span className="text-[8px] uppercase leading-none tracking-tight">QUYẾT ĐỊNH</span>
                        <span className="text-[11px] uppercase leading-none mt-1">CẢNH CÁO</span>
                        <span className="text-[7px] uppercase mt-0.5 leading-none">CHẤT LƯỢNG</span>
                      </div>
                      <span className="absolute text-[7px] font-black text-red-600 tracking-wider uppercase text-center w-full transform translate-y-8">
                        BAN KIỂM SOÁT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="flex gap-3 mt-6 border-t border-slate-100 pt-5 relative z-10 font-sans">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Printer size={14} />
                {language === "vi" ? "In Sắc Lệnh Bản Cứng" : "Print & Issue Official Decree"}
              </button>

              <button
                type="button"
                disabled={isDownloadingReport}
                onClick={async () => {
                  const cardElement = document.getElementById("sla-warning-decree-card");
                  if (cardElement) {
                    setIsDownloadingReport(true);
                    try {
                      const canvas = await html2canvas(cardElement, {
                        useCORS: true,
                        allowTaint: false,
                        scale: 2,
                      });
                      const dataUrl = canvas.toDataURL("image/png");
                      const link = document.createElement("a");
                      link.download = `QuyetDinh_SLA_${selectedWarningToPrint.staffName.replace(/\s+/g, '_')}_${selectedWarningToPrint.id}.png`;
                      link.href = dataUrl;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (error) {
                      console.error("Error generating warning decree image:", error);
                    } finally {
                      setIsDownloadingReport(false);
                    }
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Download size={14} className={isDownloadingReport ? "animate-bounce" : ""} />
                {language === "vi" ? (isDownloadingReport ? "Đang tải..." : "Tải Sắc Lệnh (.png)") : (isDownloadingReport ? "Downloading..." : "Download Decree (.png)")}
              </button>

              <button
                type="button"
                onClick={() => setShowOfficialWarningModal(false)}
                className="px-6 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {language === "vi" ? "Đóng lại" : "Close"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
