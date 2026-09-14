import React, { useState, useRef, useEffect } from "react";
import {
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Eye,
  FileText,
  Settings,
  AlignLeft,
  Calendar,
  User,
  Shield,
  Smartphone,
  Laptop,
  Maximize2,
  Minimize2,
  FileDown,
  Info
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface DocumentExporterProps {
  title: string;
  refNumber?: string;
  agency?: string;
  signer?: string;
  dateStr?: string;
  content: string; // Plain text with line breaks or HTML
  onClose?: () => void;
  metadata?: Record<string, string>;
}

export default function DocumentExporter({
  title,
  refNumber = "---/---",
  agency = "Văn phòng Luật sư",
  signer = "Luật sư thành viên",
  dateStr = new Date().toLocaleDateString("vi-VN"),
  content,
  onClose,
  metadata = {}
}: DocumentExporterProps) {
  // Configurations
  const [paperSize, setPaperSize] = useState<"a4" | "letter">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState<"compact" | "normal" | "wide">("normal");
  const [theme, setTheme] = useState<"serif" | "sans" | "editorial">("serif");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [showWatermark, setShowWatermark] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showMeta, setShowMeta] = useState(true);
  
  // State
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Reference for content element to print/render
  const previewRef = useRef<HTMLDivElement>(null);

  // Helper styles based on configuration
  const fontClass = {
    serif: "font-serif",
    sans: "font-sans",
    editorial: "font-mono"
  }[theme];

  const sizeClass = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-base sm:text-lg"
  }[fontSize];

  const marginPadding = {
    compact: "p-6 sm:p-8",
    normal: "p-8 sm:p-12",
    wide: "p-12 sm:p-16"
  }[margin];

  // HTML content rendering helper
  const renderContent = () => {
    // Check if content looks like HTML
    if (content.trim().startsWith("<") && content.trim().endsWith(">")) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    
    // Otherwise, render text with paragraph breaks
    return content.split("\n").map((para, idx) => {
      if (!para.trim()) return <div key={idx} className="h-4" />;
      return (
        <p key={idx} className="mb-4 leading-relaxed text-justify text-slate-800 dark:text-slate-200">
          {para}
        </p>
      );
    });
  };

  // 1. ADVANCED PRINT IMPLEMENTATION
  // Uses a hidden iframe to isolate the document from the rest of the application's DOM and style sheets, 
  // guaranteeing that only the document content is printed cleanly without UI widgets.
  const handlePrint = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    setExportMessage("Đang chuẩn bị trang in...");

    try {
      // Create iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) throw new Error("Không thể khởi tạo môi trường in.");

      // Pull document stylesheets to preserve Tailwind typography and layout
      let stylesHtml = "";
      document.querySelectorAll("style, link[rel='stylesheet']").forEach((el) => {
        stylesHtml += el.outerHTML;
      });

      // HTML template for printing
      const documentHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            ${stylesHtml}
            <style>
              @page {
                size: ${paperSize} ${orientation};
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-container {
                width: ${orientation === "portrait" ? "210mm" : "297mm"};
                min-height: ${orientation === "portrait" ? "297mm" : "210mm"};
                padding: ${margin === "compact" ? "15mm" : margin === "wide" ? "30mm" : "20mm"};
                box-sizing: border-box;
                position: relative;
                font-family: ${theme === "serif" ? "Georgia, serif" : theme === "editorial" ? "Courier, monospace" : "system-ui, sans-serif"};
                font-size: ${fontSize === "sm" ? "12px" : fontSize === "lg" ? "16px" : "14px"};
              }
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 4rem;
                font-weight: bold;
                color: rgba(0,0,0,0.03);
                white-space: nowrap;
                pointer-events: none;
                z-index: 0;
              }
              @media print {
                html, body {
                  width: ${orientation === "portrait" ? "210mm" : "297mm"};
                  height: ${orientation === "portrait" ? "297mm" : "210mm"};
                }
                .print-container {
                  border: none !important;
                  box-shadow: none !important;
                  margin: 0 !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${previewRef.current.innerHTML}
            </div>
          </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(documentHtml);
      iframeDoc.close();

      // Wait for resources to load in iframe
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Cleanup after print dialog completes
        setTimeout(() => {
          document.body.removeChild(iframe);
          setIsExporting(false);
          setExportMessage("");
        }, 1000);
      }, 500);

    } catch (error) {
      console.error("Print failed:", error);
      setIsExporting(false);
      alert("Đã xảy ra lỗi khi in văn bản.");
    }
  };

  // 2. HIGHLY COMPATIBLE PDF GENERATION
  // Using html2canvas + jsPDF is extremely robust for Vietnamese characters and diacritics.
  // It handles multi-page calculation beautifully and supports both desktop and mobile file delivery workflows.
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    setExportMessage("Đang chuyển đổi định dạng PDF...");

    try {
      const element = previewRef.current;
      
      // Compute A4 point dimensions: A4 is 595.28 x 841.89 points
      const isPortrait = orientation === "portrait";
      const pageWidth = isPortrait ? 595.28 : 841.89;
      const pageHeight = isPortrait ? 841.89 : 595.28;
      
      // Temporarily lock sizing to high quality desktop format for beautiful rendering
      const originalStyle = element.getAttribute("style") || "";
      element.style.width = isPortrait ? "800px" : "1130px";
      element.style.transform = "none";
      element.style.boxShadow = "none";

      // Render element to high-res canvas (scale: 2 offers great balance of resolution and performance)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      // Restore original container styling
      element.setAttribute("style", originalStyle);

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Calculate height of one page in canvas pixels matching target aspect ratio
      const pageRatio = pageHeight / pageWidth;
      const canvasPageHeight = canvasWidth * pageRatio;
      
      const totalPages = Math.ceil(canvasHeight / canvasPageHeight);
      
      // Initialize jsPDF
      const pdf = new jsPDF({
        orientation: orientation,
        unit: "pt",
        format: paperSize
      });

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Slice canvas to individual page height
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvasWidth;
        pageCanvas.height = Math.min(canvasPageHeight, canvasHeight - i * canvasPageHeight);

        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            i * canvasPageHeight,
            canvasWidth,
            pageCanvas.height,
            0,
            0,
            canvasWidth,
            pageCanvas.height
          );
        }

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
        
        // Put image onto the PDF page
        const destHeight = (pageCanvas.height / canvasWidth) * pageWidth;
        pdf.addImage(pageImgData, "JPEG", 0, 0, pageWidth, destHeight);
      }

      const fileName = `${title.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g, "").replace(/\s+/g, "_")}.pdf`;

      // DELIVERY MECHANISMS ACCORDING TO USER PLATFORM
      // Mobile Safari / Chrome / WebViews block classical file downloads.
      // We leverage blob triggers or Web Share API where possible, otherwise open in new window.
      const pdfBlob = pdf.output("blob");
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // Option A: Web Share API (File-based) - This is the absolute gold standard for mobile
        if (navigator.canShare && navigator.share) {
          try {
            const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
            if (navigator.canShare({ files: [pdfFile] })) {
              setExportMessage("Đang kích hoạt Chia sẻ trên thiết bị di động...");
              await navigator.share({
                files: [pdfFile],
                title: title,
                text: `Tải văn bản: ${title}`
              });
              setIsExporting(false);
              setExportMessage("");
              return;
            }
          } catch (shareError) {
            console.warn("Native file sharing failed, falling back to blob open:", shareError);
          }
        }

        // Option B: Blob URL representation opened in a new tab/window for mobile
        setExportMessage("Đang hiển thị tài liệu trong cửa sổ mới...");
        const fileURL = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(fileURL, "_blank");
        if (!newWindow) {
          // If popup is blocked, try direct download
          const link = document.createElement("a");
          link.href = fileURL;
          link.download = fileName;
          link.click();
        }
      } else {
        // Option C: Standard desktop browser download
        pdf.save(fileName);
      }

      setIsExporting(false);
      setExportMessage("");
    } catch (error) {
      console.error("PDF generation failed:", error);
      setIsExporting(false);
      setExportMessage("");
      alert("Không thể xuất tài liệu sang PDF. Vui lòng thử lại hoặc sử dụng tính năng In.");
    }
  };

  // 3. COPY PLAIN TEXT TO CLIPBOARD
  const handleCopyText = async () => {
    try {
      // Strips HTML if present, converts to beautiful plain text representation
      let cleanText = "";
      if (content.trim().startsWith("<")) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;
        cleanText = tempDiv.innerText || tempDiv.textContent || "";
      } else {
        cleanText = content;
      }

      const fullDocumentText = `
${agency.toUpperCase()}
Số: ${refNumber}
----------
TÀI LIỆU: ${title.toUpperCase()}
Ngày lập: ${dateStr}

${cleanText}

Người thực hiện / Ký tên:
${signer}
      `.trim();

      await navigator.clipboard.writeText(fullDocumentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
      alert("Không thể sao chép văn bản vào khay nhớ tạm.");
    }
  };

  // 4. MOBILE-FRIENDLY WEB SHARE (TEXT / METADATA)
  const handleShareText = async () => {
    if (navigator.share) {
      try {
        let cleanText = "";
        if (content.trim().startsWith("<")) {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = content;
          cleanText = tempDiv.innerText || "";
        } else {
          cleanText = content;
        }

        await navigator.share({
          title: title,
          text: `${title}\n\nSố: ${refNumber}\nNgày lập: ${dateStr}\n\n${cleanText.substring(0, 150)}...`,
          url: window.location.href
        });
      } catch (err) {
        console.warn("Share text failed or cancelled", err);
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col md:flex-row bg-slate-900/80 backdrop-blur-md transition-all duration-300 ${isFullscreen ? "p-0" : "p-2 sm:p-4 md:p-6"}`}>
      {/* LEFT PANEL: CONFIGURATION AND EXPORT OPERATIONS */}
      <div className={`flex flex-col w-full md:w-[380px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 ${isFullscreen ? "h-full" : "rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none shadow-2xl"} max-h-[50vh] md:max-h-none overflow-y-auto`}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" id="doc-exporter-icon" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">Xuất & Tải tài liệu</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Tối ưu hóa thiết bị di động & in ấn</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition"
              id="doc-exporter-close-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Configuration Section */}
        <div className="p-5 space-y-6 flex-1">
          {/* Action Hub */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tác vụ chính</h4>
            
            <button
              disabled={isExporting}
              onClick={handleDownloadPDF}
              className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition shadow-sm hover:shadow shadow-blue-500/20"
              id="doc-exporter-pdf-btn"
            >
              <FileDown className={`w-5 h-5 ${isExporting ? "animate-bounce" : ""}`} />
              <span>{isExporting ? "Đang xử lý..." : "Tải xuống PDF"}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 px-3 rounded-lg text-sm font-medium transition"
                id="doc-exporter-print-btn"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>In ấn / Lưu</span>
              </button>
              
              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 px-3 rounded-lg text-sm font-medium transition"
                id="doc-exporter-copy-btn"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copied ? "Đã chép" : "Chép văn bản"}</span>
              </button>
            </div>

            {/* Smart Share Action for Mobile Device */}
            <button
              onClick={handleShareText}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 px-4 rounded-lg text-sm font-medium transition"
              id="doc-exporter-share-btn"
            >
              <Share2 className="w-4 h-4 text-blue-500" />
              <span>Chia sẻ nhanh (Zalo/iMessage)</span>
            </button>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Design Layout Customizations */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span>Tùy chỉnh bố cục</span>
            </h4>

            {/* Aesthetic Theme Selection */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Phong cách văn bản</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "serif", label: "Mẫu Pháp lý", desc: "Serif truyền thống" },
                  { id: "sans", label: "Hiện đại", desc: "Sạch sẽ, tinh tế" },
                  { id: "editorial", label: "Tối giản", desc: "Văn bản thô" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition ${
                      theme === t.id
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                    id={`doc-theme-btn-${t.id}`}
                  >
                    <span className="text-xs font-semibold">{t.label}</span>
                    <span className="text-[10px] opacity-75">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Margins */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Cỡ chữ</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                  id="doc-fontsize-select"
                >
                  <option value="sm">Nhỏ</option>
                  <option value="md">Trung bình</option>
                  <option value="lg">Lớn</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Lề trang</label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(e.target.value as any)}
                  className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                  id="doc-margin-select"
                >
                  <option value="compact">Hẹp (Compact)</option>
                  <option value="normal">Thường (Normal)</option>
                  <option value="wide">Rộng (Wide)</option>
                </select>
              </div>
            </div>

            {/* Paper Size & Orientation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Khổ giấy</label>
                <div className="flex bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setPaperSize("a4")}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition ${paperSize === "a4" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                    id="doc-paper-a4"
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPaperSize("letter")}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition ${paperSize === "letter" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                    id="doc-paper-letter"
                  >
                    Letter
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Chiều trang</label>
                <div className="flex bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setOrientation("portrait")}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition ${orientation === "portrait" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                    id="doc-orient-portrait"
                  >
                    Dọc
                  </button>
                  <button
                    onClick={() => setOrientation("landscape")}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition ${orientation === "landscape" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100" : "text-slate-500 hover:text-slate-700"}`}
                    id="doc-orient-landscape"
                  >
                    Ngang
                  </button>
                </div>
              </div>
            </div>

            {/* Document Elements Switches */}
            <div className="space-y-2.5 pt-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Thành phần văn bản</label>
              
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Bản quyền / Chữ ký chìm</span>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                  id="doc-watermark-toggle"
                />
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Hiển thị thông tin hành chính</span>
                <input
                  type="checkbox"
                  checked={showMeta}
                  onChange={(e) => setShowMeta(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                  id="doc-meta-toggle"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Chữ ký cuối văn bản</span>
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                  id="doc-signature-toggle"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Alert Footer */}
        {exportMessage && (
          <div className="p-4 bg-blue-50 dark:bg-slate-800 border-t border-blue-100 dark:border-slate-700 flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium animate-pulse">{exportMessage}</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: LIVE WYSIWYG DOCUMENT PREVIEW */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 overflow-hidden">
        {/* Controls Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Eye className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Xem trước văn bản</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View scale toggles (Simulate Desktop vs Phone Layout view) */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 rounded-md transition ${previewMode === "desktop" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700"}`}
                title="Xem trên máy tính"
                id="preview-mode-desktop-btn"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 rounded-md transition ${previewMode === "mobile" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700"}`}
                title="Xem trên điện thoại"
                id="preview-mode-mobile-btn"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toàn màn hình"
              id="preview-fullscreen-btn"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Interactive Workspace area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center items-start">
          {/* Main Paper Template wrapper */}
          <div
            className={`w-full transition-all duration-300 ${
              previewMode === "mobile" 
                ? "max-w-[360px] shadow-lg border border-slate-300 dark:border-slate-800" 
                : "max-w-4xl shadow-xl"
            }`}
          >
            {/* The actual paper element which represents A4/Letter size container */}
            <div
              ref={previewRef}
              id="document-print-target"
              className={`w-full bg-white text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden transition-all ${fontClass} ${sizeClass} ${marginPadding}`}
              style={{
                minHeight: orientation === "portrait" ? "297mm" : "210mm",
                aspectRatio: orientation === "portrait" ? "210 / 297" : "297 / 210",
                boxSizing: "border-box"
              }}
            >
              {/* Optional Custom Watermark */}
              {showWatermark && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
                  style={{ opacity: 0.04 }}
                >
                  <span className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-widest text-slate-800 uppercase transform -rotate-45">
                    LOCKED LAW FIRM
                  </span>
                </div>
              )}

              {/* Document Structure Layout */}
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                
                {/* Header elements: Agency Name & Administrative formula */}
                {showMeta && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-xs sm:text-sm border-b border-slate-100 pb-4 mb-4 gap-4">
                    <div className="space-y-0.5 text-slate-600">
                      <p className="font-bold tracking-wide uppercase">{agency}</p>
                      <p className="text-[11px] opacity-80">Số: {refNumber}</p>
                      <p className="text-[11px] opacity-80">V/v: Tài liệu pháp lý</p>
                    </div>
                    <div className="text-right sm:text-right space-y-0.5 text-slate-500">
                      <p className="font-bold tracking-wider uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="text-[11px] font-medium underline decoration-slate-300 underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
                      <p className="text-[11px] italic opacity-85 mt-2">Hà Nội, ngày {dateStr}</p>
                    </div>
                  </div>
                )}

                {/* Main Body */}
                <div className="flex-1 flex flex-col">
                  {/* Document Title */}
                  <div className="text-center my-6 sm:my-8">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide text-slate-900 border-b-2 border-slate-800 pb-2 inline-block">
                      {title}
                    </h1>
                  </div>

                  {/* Additional specific metadata if provided */}
                  {Object.keys(metadata).length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      {Object.entries(metadata).map(([key, val]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-semibold text-slate-700 shrink-0">{key}:</span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Document Body Text */}
                  <div className="whitespace-pre-line text-justify text-slate-800 leading-relaxed text-sm sm:text-base">
                    {renderContent()}
                  </div>
                </div>

                {/* Footer and Signatures */}
                {showSignature && (
                  <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end">
                    <div className="w-64 text-center space-y-12">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Đại diện pháp lý</p>
                        <p className="font-bold uppercase text-xs sm:text-sm text-slate-800">{signer}</p>
                        <p className="text-[11px] italic text-slate-400">(Ký và đóng dấu)</p>
                      </div>
                      
                      {/* Placeholder for stamp & signature block */}
                      <div className="relative h-16 flex items-center justify-center">
                        <div className="absolute w-12 h-12 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center text-[9px] text-slate-300 font-bold uppercase rotate-12">
                          STAMP
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Watermark/Copyright Notice inside printable page footer */}
                <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-4">
                  <p>Tài liệu được bảo mật bởi hệ thống Luật sư Việt Nam. Mã xác thực: LSM-{refNumber.replace(/\//g, "-")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Tip Overlay */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-500">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-slate-600 dark:text-slate-400">Gợi ý xuất bản:</p>
            <p className="opacity-90">Để có bản in đẹp nhất, chọn kích thước <b>A4</b> và tỉ lệ lề <b>Normal</b>. Trong hộp thoại In, hãy bật tùy chọn <i>"In hình nền" (Background graphics)</i> để hiển thị đúng màu nền và chữ ký chìm.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
