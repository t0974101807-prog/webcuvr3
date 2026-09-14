import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, RotateCw, Crop, Trash2, ArrowUp, ArrowDown, 
  FileText, Download, Sparkles, RefreshCw, Check, X, Sliders, Image as ImageIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ScannedPage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  rotation: number; // 0, 90, 180, 270
  filter: 'none' | 'magic' | 'grayscale' | 'bw';
  cropRect?: { x: number; y: number; w: number; h: number }; // percentage 0-100
}

export default function DocumentScanner() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState('Tai_lieu_CamScanner');
  const [isGenerating, setIsGenerating] = useState(false);

  // Crop overlay editor state
  const [isCropping, setIsCropping] = useState(false);
  const [cropPoints, setCropPoints] = useState({ top: 10, bottom: 90, left: 10, right: 90 }); // in percentages

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Selected Page
  const selectedPage = pages.find(p => p.id === selectedPageId) || null;

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Không thể truy cập camera. Vui lòng cấp quyền truy cập hoặc sử dụng tính năng tải ảnh lên.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      const newPage: ScannedPage = {
        id: 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        originalUrl: dataUrl,
        processedUrl: dataUrl,
        rotation: 0,
        filter: 'none'
      };
      
      setPages(prev => [...prev, newPage]);
      setSelectedPageId(newPage.id);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const newPage: ScannedPage = {
            id: 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            originalUrl: dataUrl,
            processedUrl: dataUrl,
            rotation: 0,
            filter: 'none'
          };
          setPages(prev => [...prev, newPage]);
          setSelectedPageId(prev => prev || newPage.id);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Processing core
  const processImage = (page: ScannedPage, rotation: number, filter: ScannedPage['filter'], cropPercent?: typeof cropPoints) => {
    const img = new Image();
    img.src = page.originalUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate width & height based on rotation
      const is90or270 = rotation === 90 || rotation === 270;
      const origW = img.width;
      const origH = img.height;
      
      // Determine crop bounds in pixels relative to original image
      let cropX = 0, cropY = 0, cropW = origW, cropH = origH;
      if (cropPercent) {
        cropX = (cropPercent.left / 100) * origW;
        cropY = (cropPercent.top / 100) * origH;
        cropW = ((cropPercent.right - cropPercent.left) / 100) * origW;
        cropH = ((cropPercent.bottom - cropPercent.top) / 100) * origH;
      }

      // Final canvas bounds based on rotated crop
      const finalW = is90or270 ? cropH : cropW;
      const finalH = is90or270 ? cropW : cropH;
      
      canvas.width = finalW;
      canvas.height = finalH;

      // Translate context to rotate
      ctx.translate(finalW / 2, finalH / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw original image cropped
      ctx.drawImage(
        img, 
        cropX, cropY, cropW, cropH, 
        -cropW / 2, -cropH / 2, cropW, cropH
      );

      // Apply Filters
      const imgData = ctx.getImageData(0, 0, finalW, finalH);
      const data = imgData.data;

      if (filter === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          data[i] = gray;     // R
          data[i+1] = gray;   // G
          data[i+2] = gray;   // B
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filter === 'bw') {
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          const bw = gray > 120 ? 255 : 0;
          data[i] = bw;
          data[i+1] = bw;
          data[i+2] = bw;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filter === 'magic') {
        // Boost contrast and brightness for CamScanner scanning effect
        const contrast = 1.4; // factor
        const brightness = 15; // addition
        for (let i = 0; i < data.length; i += 4) {
          // Boost and flatten background whites
          for (let c = 0; c < 3; c++) {
            let val = data[i+c];
            val = contrast * (val - 128) + 128 + brightness;
            if (val > 230) val = 255; // Whitening page background
            else if (val < 40) val = 0; // Darken text
            data[i+c] = Math.max(0, Math.min(255, val));
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const processedUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPages(prev => prev.map(p => {
        if (p.id === page.id) {
          return {
            ...p,
            processedUrl,
            rotation,
            filter,
            cropRect: cropPercent ? { x: cropPercent.left, y: cropPercent.top, w: cropPercent.right - cropPercent.left, h: cropPercent.bottom - cropPercent.top } : p.cropRect
          };
        }
        return p;
      }));
    };
  };

  const handleRotate = (page: ScannedPage) => {
    const nextRotation = (page.rotation + 90) % 360;
    const currentCropPoints = page.cropRect ? {
      top: page.cropRect.y,
      bottom: page.cropRect.y + page.cropRect.h,
      left: page.cropRect.x,
      right: page.cropRect.x + page.cropRect.w
    } : undefined;
    processImage(page, nextRotation, page.filter, currentCropPoints);
  };

  const handleFilterChange = (page: ScannedPage, filterType: ScannedPage['filter']) => {
    const currentCropPoints = page.cropRect ? {
      top: page.cropRect.y,
      bottom: page.cropRect.y + page.cropRect.h,
      left: page.cropRect.x,
      right: page.cropRect.x + page.cropRect.w
    } : undefined;
    processImage(page, page.rotation, filterType, currentCropPoints);
  };

  const startCropping = (page: ScannedPage) => {
    if (page.cropRect) {
      setCropPoints({
        top: page.cropRect.y,
        bottom: page.cropRect.y + page.cropRect.h,
        left: page.cropRect.x,
        right: page.cropRect.x + page.cropRect.w
      });
    } else {
      setCropPoints({ top: 10, bottom: 90, left: 10, right: 90 });
    }
    setIsCropping(true);
  };

  const saveCrop = (page: ScannedPage) => {
    processImage(page, page.rotation, page.filter, cropPoints);
    setIsCropping(false);
  };

  const deletePage = (id: string) => {
    const updated = pages.filter(p => p.id !== id);
    setPages(updated);
    if (selectedPageId === id) {
      setSelectedPageId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pages.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPages(updated);
  };

  const generatePDF = async () => {
    if (pages.length === 0) return;
    setIsGenerating(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Load image to get original dimensions
        const img = new Image();
        img.src = pages[i].processedUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Compute aspect ratio to fit A4 perfectly without distortion
        const imgRatio = img.width / img.height;
        const pageRatio = pdfWidth / pdfHeight;

        let printWidth = pdfWidth;
        let printHeight = pdfHeight;
        let xOffset = 0;
        let yOffset = 0;

        if (imgRatio > pageRatio) {
          // Landscape-oriented image, fit to width
          printHeight = pdfWidth / imgRatio;
          yOffset = (pdfHeight - printHeight) / 2;
        } else {
          // Portrait-oriented image, fit to height
          printWidth = pdfHeight * imgRatio;
          xOffset = (pdfWidth - printWidth) / 2;
        }

        pdf.addImage(pages[i].processedUrl, 'JPEG', xOffset, yOffset, printWidth, printHeight);
      }

      const filename = pdfName.trim() ? `${pdfName.trim()}.pdf` : 'scanned_document.pdf';
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl min-h-[500px] flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--color-primary)] font-serif">
            <Sparkles className="text-amber-500" size={24} />
            Hệ Thống Quét & Số Hóa PDF (CamScanner Pro)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chụp tài liệu từ camera hoặc tải ảnh lên để căn chỉnh, xoay, lọc tăng tương phản (Magic Color) và đóng gói thành 1 file PDF sắc nét.
          </p>
        </div>
        
        {pages.length > 0 && (
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              value={pdfName}
              onChange={(e) => setPdfName(e.target.value)}
              placeholder="Tên file PDF"
              className="px-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
            />
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-teal-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
              Xuất PDF ({pages.length} trang)
            </button>
          </div>
        )}
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left pane: File capture & Upload */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-850 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Thêm nguồn tài liệu
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                  isCameraActive 
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                    : 'bg-indigo-50/50 border-indigo-100 text-indigo-700 hover:bg-indigo-50 dark:bg-slate-800 dark:border-slate-700 dark:text-indigo-400'
                }`}
              >
                <Camera size={24} />
                {isCameraActive ? "Tắt Camera" : "Mở Máy Ảnh"}
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-emerald-50/50 border border-emerald-100 text-emerald-700 hover:bg-emerald-50 rounded-xl flex flex-col items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400"
              >
                <Upload size={24} />
                Tải ảnh lên
              </button>
              
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </div>

            {/* Video Preview stream */}
            {isCameraActive && (
              <div className="relative border border-indigo-100 dark:border-slate-800 rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <button 
                    onClick={capturePhoto}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg active:scale-90 border-2 border-white cursor-pointer"
                    title="Chụp ảnh"
                  >
                    <Camera size={24} />
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="p-2 bg-slate-800/80 hover:bg-slate-900/90 text-white rounded-full shadow-md active:scale-90 cursor-pointer"
                    title="Hủy"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-xs rounded-xl border border-amber-100 dark:border-amber-900/30">
                {cameraError}
              </div>
            )}
          </div>

          {/* List of Scanned Pages */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-850 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Thứ tự trang ({pages.length})
              </h3>
              {pages.length > 0 && (
                <button 
                  onClick={() => { setPages([]); setSelectedPageId(null); }}
                  className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {pages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl flex flex-col items-center gap-2">
                <ImageIcon size={32} className="text-slate-300" />
                <span className="text-xs">Chưa có trang nào. Hãy thêm ảnh để bắt đầu.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {pages.map((p, idx) => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      if (!isCropping) setSelectedPageId(p.id);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      selectedPageId === p.id 
                        ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/40 shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-transparent dark:bg-slate-900/40 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 font-mono">
                        {idx + 1}
                      </span>
                      <img 
                        src={p.processedUrl} 
                        alt={`Trang ${idx + 1}`} 
                        className="w-12 h-16 object-cover bg-white rounded border border-slate-200 dark:border-slate-800"
                      />
                      <div>
                        <div className="text-xs font-bold truncate max-w-[120px]">Page_{idx + 1}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{p.filter === 'none' ? 'Gốc' : p.filter.toUpperCase()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button 
                        disabled={idx === 0}
                        onClick={() => movePage(idx, 'up')}
                        className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        disabled={idx === pages.length - 1}
                        onClick={() => movePage(idx, 'down')}
                        className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button 
                        onClick={() => deletePage(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Image processing workstation */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-850 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={16} />
                3. Bàn làm việc số hóa ảnh
              </h3>
              {selectedPage && (
                <div className="text-xs font-mono text-slate-400">
                  Kích thước gốc: Page_{pages.indexOf(selectedPage) + 1}
                </div>
              )}
            </div>

            {!selectedPage ? (
              <div className="text-center py-24 text-slate-400 flex flex-col items-center justify-center gap-3">
                <FileText size={48} className="text-slate-300" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Không có trang nào được chọn</h4>
                <p className="text-xs max-w-xs leading-relaxed text-slate-500">
                  Tải ảnh tài liệu hoặc mở Camera để ghi hình. Bạn có thể chỉnh sửa xoay, cắt viền, tăng độ tương phản để làm nét chữ trước khi lưu.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Visual Canvas Area */}
                <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850 relative min-h-[350px]">
                  {isCropping ? (
                    /* Interactive Cropper Panel */
                    <div className="relative max-w-full max-h-[400px] overflow-hidden select-none">
                      <img 
                        src={selectedPage.originalUrl} 
                        alt="Cắt viền"
                        className="max-h-[380px] object-contain block opacity-70"
                        style={{ transform: `rotate(${selectedPage.rotation}deg)` }}
                      />
                      
                      {/* Crop Window overlay handles */}
                      <div 
                        className="absolute border-2 border-indigo-600 bg-indigo-500/10 shadow-lg cursor-move"
                        style={{
                          top: `${cropPoints.top}%`,
                          bottom: `${100 - cropPoints.bottom}%`,
                          left: `${cropPoints.left}%`,
                          right: `${100 - cropPoints.right}%`,
                        }}
                      >
                        {/* Drag handlers at borders */}
                        {/* Top slider handle */}
                        <div 
                          onMouseDown={(e) => {
                            const onMouseMove = (ev: MouseEvent) => {
                              const container = e.currentTarget.parentElement?.parentElement;
                              if (!container) return;
                              const rect = container.getBoundingClientRect();
                              const percent = ((ev.clientY - rect.top) / rect.height) * 100;
                              setCropPoints(p => ({ ...p, top: Math.max(0, Math.min(p.bottom - 10, percent)) }));
                            };
                            const onMouseUp = () => {
                              window.removeEventListener('mousemove', onMouseMove);
                              window.removeEventListener('mouseup', onMouseUp);
                            };
                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                          }}
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-indigo-600 border border-white rounded-full cursor-ns-resize shadow-md flex items-center justify-center"
                        />
                        {/* Bottom slider handle */}
                        <div 
                          onMouseDown={(e) => {
                            const onMouseMove = (ev: MouseEvent) => {
                              const container = e.currentTarget.parentElement?.parentElement;
                              if (!container) return;
                              const rect = container.getBoundingClientRect();
                              const percent = ((ev.clientY - rect.top) / rect.height) * 100;
                              setCropPoints(p => ({ ...p, bottom: Math.max(p.top + 10, Math.min(100, percent)) }));
                            };
                            const onMouseUp = () => {
                              window.removeEventListener('mousemove', onMouseMove);
                              window.removeEventListener('mouseup', onMouseUp);
                            };
                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                          }}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-indigo-600 border border-white rounded-full cursor-ns-resize shadow-md flex items-center justify-center"
                        />
                        {/* Left slider handle */}
                        <div 
                          onMouseDown={(e) => {
                            const onMouseMove = (ev: MouseEvent) => {
                              const container = e.currentTarget.parentElement?.parentElement;
                              if (!container) return;
                              const rect = container.getBoundingClientRect();
                              const percent = ((ev.clientX - rect.left) / rect.width) * 100;
                              setCropPoints(p => ({ ...p, left: Math.max(0, Math.min(p.right - 10, percent)) }));
                            };
                            const onMouseUp = () => {
                              window.removeEventListener('mousemove', onMouseMove);
                              window.removeEventListener('mouseup', onMouseUp);
                            };
                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                          }}
                          className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-8 w-3 bg-indigo-600 border border-white rounded-full cursor-ew-resize shadow-md flex items-center justify-center"
                        />
                        {/* Right slider handle */}
                        <div 
                          onMouseDown={(e) => {
                            const onMouseMove = (ev: MouseEvent) => {
                              const container = e.currentTarget.parentElement?.parentElement;
                              if (!container) return;
                              const rect = container.getBoundingClientRect();
                              const percent = ((ev.clientX - rect.left) / rect.width) * 100;
                              setCropPoints(p => ({ ...p, right: Math.max(p.left + 10, Math.min(100, percent)) }));
                            };
                            const onMouseUp = () => {
                              window.removeEventListener('mousemove', onMouseMove);
                              window.removeEventListener('mouseup', onMouseUp);
                            };
                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                          }}
                          className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-8 w-3 bg-indigo-600 border border-white rounded-full cursor-ew-resize shadow-md flex items-center justify-center"
                        />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={selectedPage.processedUrl} 
                      alt="Xem trước trang tài liệu" 
                      className="max-h-[380px] object-contain shadow-lg rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
                    />
                  )}
                </div>

                {/* Processing adjustment controls */}
                <div className="md:col-span-5 space-y-6">
                  {isCropping ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Căn biên tài liệu</h4>
                      <p className="text-xs text-slate-400">
                        Kéo thả 4 chốt điều khiển xung quanh tài liệu để cắt bớt lề thừa hoặc căn chỉnh góc chụp.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveCrop(selectedPage)}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                          <Check size={14} /> Xong
                        </button>
                        <button
                          onClick={() => setIsCropping(false)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <X size={14} /> Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Geometric controls */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Điều chỉnh hình học</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleRotate(selectedPage)}
                            className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                          >
                            <RotateCw size={14} /> Xoay 90°
                          </button>
                          
                          <button
                            onClick={() => startCropping(selectedPage)}
                            className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                          >
                            <Crop size={14} /> Cắt / Căn Biên
                          </button>
                        </div>
                      </div>

                      {/* Filter Presets */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Bộ lọc thông minh (CamScanner mode)</h4>
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { id: 'none', label: 'Nguyên Bản', desc: 'Không bộ lọc' },
                            { id: 'magic', label: 'Magic Color', desc: 'Tăng sáng & tương phản' },
                            { id: 'grayscale', label: 'Mức Xám', desc: 'Làm mờ nền đen trắng' },
                            { id: 'bw', label: 'Đen Trắng (B&W)', desc: 'Văn bản nhị phân' }
                          ].map(f => {
                            const isCurrent = selectedPage.filter === f.id;
                            return (
                              <button
                                key={f.id}
                                onClick={() => handleFilterChange(selectedPage, f.id as any)}
                                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-95 ${
                                  isCurrent
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 dark:bg-indigo-950/30 dark:border-indigo-800/80 dark:text-indigo-400'
                                    : 'bg-white hover:bg-slate-50 border-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                                }`}
                              >
                                <span className="font-bold text-xs flex items-center gap-1.5">
                                  {isCurrent && <Check size={12} className="text-indigo-600 dark:text-indigo-400" />}
                                  {f.label}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1">{f.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
