import React, { useState, useEffect } from 'react';
import { Edit2, QrCode, User, Briefcase, Activity, FileText, CheckCircle2, X, Copy, ExternalLink, Download, Printer, Settings, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import { fetchApi } from '../utils/api';

interface QRProfileManagerProps {
  records: any[];
  updateRecords: (records: any[]) => void;
  myPermissions?: any;
  user?: any;
}

export default function QRProfileManager({ records = [], updateRecords, myPermissions, user }: QRProfileManagerProps) {
  const canEdit = myPermissions ? myPermissions.editAllRecords : ['admin', 'director', 'deputyDirector', 'deputy_director', 'manager', 'manage', 'head_of_department'].includes(user?.role || '');
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    status: '',
    workStatus: ''
  });
  const [qrPreviewData, setQrPreviewData] = useState<{ id: string; name: string; qrUrl: string; url: string } | null>(null);
  const [litigationRecords, setLitigationRecords] = useState<any[]>(records);
  const [caseQrTokens, setCaseQrTokens] = useState<Record<string, string>>({});
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [copied, setCopied] = useState(false);

  // QR Style configuration states (persisted in localStorage)
  const [qrSize, setQrSize] = useState(() => {
    try {
      const saved = localStorage.getItem("tracking_qr_size");
      return saved ? parseInt(saved, 10) : 250;
    } catch {
      return 250;
    }
  });

  const [qrMargin, setQrMargin] = useState(() => {
    try {
      const saved = localStorage.getItem("tracking_qr_margin");
      return saved ? parseInt(saved, 10) : 2;
    } catch {
      return 2;
    }
  });

  const [qrColor, setQrColor] = useState(() => {
    try {
      const saved = localStorage.getItem("tracking_qr_color");
      return saved || "#1e3a8a"; // Default deep blue primary color
    } catch {
      return "#1e3a8a";
    }
  });

  const [configNotice, setConfigNotice] = useState<string | null>(null);

  const handleSaveConfig = () => {
    try {
      localStorage.setItem("tracking_qr_size", qrSize.toString());
      localStorage.setItem("tracking_qr_margin", qrMargin.toString());
      localStorage.setItem("tracking_qr_color", qrColor);
      setConfigNotice("💾 Đã lưu cấu hình QR thành công!");
      setTimeout(() => setConfigNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetConfig = () => {
    try {
      localStorage.removeItem("tracking_qr_size");
      localStorage.removeItem("tracking_qr_margin");
      localStorage.removeItem("tracking_qr_color");
      setQrSize(250);
      setQrMargin(2);
      setQrColor("#1e3a8a");
      setConfigNotice("🗑️ Đã xóa cấu hình tùy chỉnh & khôi phục mặc định!");
      setTimeout(() => setConfigNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadLitigationRecords = async () => {
      setLoadingRecords(true);
      try {
        const response = await fetchApi('/api/erp-records?activeTab=litigation&limit=100');
        const payload = await response.json();
        const fetched = Array.isArray(payload) ? payload : payload.data;
        if (!cancelled && Array.isArray(fetched)) setLitigationRecords(fetched);
      } catch (error) {
        console.error('Không thể tải hồ sơ Tranh tụng cho QR:', error);
        if (!cancelled) setLitigationRecords(records);
      } finally {
        if (!cancelled) setLoadingRecords(false);
      }
    };
    loadLitigationRecords();
    return () => { cancelled = true; };
  }, [records]);

  useEffect(() => {
    let cancelled = false;
    const loadPaymentTokens = async () => {
      const entries = await Promise.all(litigationRecords.map(async (record) => {
        try {
          const response = await fetchApi(`/api/payment/case/${encodeURIComponent(record.id)}`);
          const payload = await response.json();
          const token = payload?.caseQrToken;
          return token ? [String(record.id), String(token)] as const : null;
        } catch {
          return null;
        }
      }));
      if (!cancelled) setCaseQrTokens(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, string]>));
    };
    if (litigationRecords.length) loadPaymentTokens();
    return () => { cancelled = true; };
  }, [litigationRecords]);

  const generateQRUrl = async (id: string, size: number, margin: number, color: string) => {
    const token = caseQrTokens[id];
    const url = token
      ? `${window.location.origin}/case-qr/${encodeURIComponent(token)}`
      : `${window.location.origin}/qr/${encodeURIComponent(id)}`;
    const qrUrl = await QRCode.toDataURL(url, { 
      width: size * 2, // higher resolution for printing/viewing
      margin: margin,
      color: {
        dark: color,
        light: "#ffffff"
      }
    });
    return { qrUrl, url };
  };

  const handleShowQR = async (id: string, name: string) => {
    try {
      const { qrUrl, url } = await generateQRUrl(id, qrSize, qrMargin, qrColor);
      setQrPreviewData({ id, name, qrUrl, url });
    } catch (error) {
      console.error(error);
    }
  };

  // Regenerate QR on the fly when styling config changes
  useEffect(() => {
    if (!qrPreviewData?.id) return;
    const regenerate = async () => {
      try {
        const { qrUrl, url } = await generateQRUrl(qrPreviewData.id, qrSize, qrMargin, qrColor);
        setQrPreviewData(prev => prev ? { ...prev, qrUrl, url } : null);
      } catch (err) {
        console.error(err);
      }
    };
    regenerate();
  }, [qrSize, qrMargin, qrColor]);

  const handleCopyLink = () => {
    if (!qrPreviewData) return;
    navigator.clipboard.writeText(qrPreviewData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    
    // Update the record in the main ERP list
    const updatedRecords = records.map(r => {
      if (r.id === editingProfile.id) {
        return {
          ...r,
          workStatus: formData.workStatus
        };
      }
      return r;
    });
    
    updateRecords(updatedRecords);
    setShowModal(false);
    setEditingProfile(null);
  };

  const handleEdit = (profile: any) => {
    setEditingProfile(profile);
    setFormData({
      status: profile.status || 'Chưa cập nhật',
      workStatus: profile.workStatus || ''
    });
    setShowModal(true);
  };

  const handlePrintQR = () => {
    if (!qrPreviewData) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.write(`
        <html>
          <head>
            <title>In mã QR Tra cứu - ${qrPreviewData.id}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin: 0;
                font-family: system-ui, -apple-system, sans-serif;
                text-align: center;
                padding: 40px;
                background-color: white;
              }
              .container {
                border: 2px dashed #cbd5e1;
                padding: 40px;
                border-radius: 24px;
                background: white;
                max-width: 420px;
                display: inline-block;
              }
              img {
                width: ${qrSize}px;
                height: ${qrSize}px;
                margin: 20px auto;
                display: block;
                object-fit: contain;
              }
              h2 {
                margin: 0;
                color: #0f172a;
                font-size: 22px;
                font-weight: 700;
              }
              p {
                margin: 8px 0 0 0;
                color: #475569;
                font-size: 14px;
              }
              .id {
                font-family: monospace;
                background: #f1f5f9;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 13px;
                color: #334155;
                font-weight: 700;
                display: inline-block;
                margin-bottom: 15px;
              }
              .footer-url {
                font-size: 11px;
                color: #94a3b8;
                word-break: break-all;
                margin-top: 15px;
                max-width: 320px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="id">MÃ HỒ SƠ: ${qrPreviewData.id}</div>
              <h2>${qrPreviewData.name}</h2>
              <p>Quét mã QR để tra cứu tiến độ hồ sơ</p>
              <img src="${qrPreviewData.qrUrl}" />
              <div class="footer-url">${qrPreviewData.url}</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 3000);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrPreviewData) return;
    try {
      const response = await fetch(qrPreviewData.qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `QRCode_Tracking_${qrPreviewData.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      const a = document.createElement("a");
      a.href = qrPreviewData.qrUrl;
      a.download = `QRCode_Tracking_${qrPreviewData.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="p-6 w-full max-w-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-all">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold font-serif text-[var(--color-primary)]">Quản lý Tiến Độ Hồ Sơ</h2>
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-900/30">
                Tổng số lượng: {litigationRecords.length} hồ sơ
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Hệ thống tạo mã QR phục vụ tra cứu tiến độ vụ việc cho khách hàng dựa trên hồ sơ hiện có</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto transition-all">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 whitespace-nowrap">
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 w-16">STT</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Mã Hồ Sơ</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Khách Hàng</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Thông tin vụ việc</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Trạng thái (Khách xem)</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loadingRecords ? (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500 dark:text-slate-400">Đang đồng bộ hồ sơ Tranh tụng...</td></tr>
            ) : litigationRecords.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500 dark:text-slate-400">Chưa có hồ sơ nào trong hệ thống.</td></tr>
            )}
            {litigationRecords.length > 0 && litigationRecords.map((p, index) => (
              <tr key={p.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/45 transition-colors">
                <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{index + 1}</td>
                <td className="p-4">
                  <div className="font-bold text-slate-700 dark:text-slate-300">{p.id}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{p.date}</div>
                </td>
                <td className="p-4">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{p.client || 'Chưa cập nhật tên'}</span>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{p.clientPhone || ''}</div>
                </td>
                <td className="p-4">
                  <div className="text-slate-800 dark:text-slate-200">{p.title || p.category}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Thụ lý: {p.mainAssignee || 'Chưa phân công'}</div>
                </td>
                <td className="p-4">
                  <span className={
                     String(p.status).includes('hoàn thành')
                    ? 'px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30' 
                    : String(p.status).includes('xử lý')
                    ? 'px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30'
                    : 'px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'
                  }>
                    {p.status || 'Chưa cập nhật'}
                  </span>
                  {p.workStatus && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs truncate font-medium" title={p.workStatus}>
                      Ghi chú: {p.workStatus}
                    </div>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleShowQR(p.id, p.client || p.id)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg tooltip-btn" title="QR Code">
                      <QrCode size={18} />
                    </button>
                    {canEdit && (
                      <button onClick={() => handleEdit(p)} className="flex items-center gap-1 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg tooltip-btn border border-slate-200 dark:border-slate-700" title="Cập nhật tiến độ">
                        <Edit2 size={16} /> <span className="text-xs font-medium">Cập nhật</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit progress notes modal */}
      {showModal && editingProfile && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 transition-all animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Cập nhật Tiến độ cho {editingProfile.id}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-stretch gap-4 text-sm">
              <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-md">
                  <User size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider font-semibold">Khách hàng</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{editingProfile.client}</div>
                </div>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md">
                  <Briefcase size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider font-semibold">Vụ việc</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{editingProfile.title}</div>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto w-full">
              <form id="qr-form" onSubmit={handleSave} className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
                     <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Activity size={16} className="text-[var(--color-primary)]" />
                        Trạng thái Tự Động
                     </span>
                     <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">Đã đồng bộ</span>
                  </div>
                  <div className="px-4 py-3 bg-white dark:bg-slate-900">
                     <div className="font-bold text-lg text-slate-800 dark:text-slate-100">{editingProfile.status || 'Chưa cập nhật'}</div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">Trạng thái này được đồng bộ từ hệ thống quản lý hồ sơ, khách hàng sẽ thấy trạng thái này.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-slate-500" />
                    Ghi chú tiến độ mới nhất (Khách sẽ xem qua mã QR)
                  </label>
                  <textarea rows={6} value={formData.workStatus} onChange={e=>setFormData({...formData, workStatus: e.target.value})} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all resize-none leading-relaxed text-slate-700 dark:text-slate-300" placeholder="Ví dụ: - Ngày 22/05: Đã nộp đơn khởi kiện thay khách hàng tại TAND Quận Nam Từ Liêm.\n- Ngày 25/05: Tòa án đã ra Thông báo nộp tiền tạm ứng án phí..." />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750 font-semibold transition-all">Đóng</button>
              <button type="submit" form="qr-form" className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} />
                Lưu Tiến Độ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Style Configuration & Print Preview Modal */}
      {qrPreviewData && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 transition-all max-h-[95vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-950">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <QrCode size={20} className="text-blue-600 animate-pulse" />
                <span>Xem trước Bản in & Cấu hình Thiết kế QR Code</span>
              </h3>
              <button
                onClick={() => setQrPreviewData(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {configNotice && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-900/30 px-6 py-2.5 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>{configNotice}</span>
              </div>
            )}

            {/* Split Content View: Left = Preview, Right = Configuration Panel */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left Side: Real-time QR Preview Frame */}
              <div className="md:col-span-6 flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner">
                <div className="bg-white/80 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 mb-4 font-mono text-xs text-slate-500 dark:text-slate-400 tracking-wider">
                  MÃ HỒ SƠ: <span className="font-bold text-slate-800 dark:text-slate-200">{qrPreviewData.id}</span>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1 truncate max-w-xs">{qrPreviewData.name}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-6">Khách quét mã này để nhận diện và tra cứu tiến độ</p>

                {/* QR Image Display with adjustable live size preview */}
                <div className="p-4 bg-white dark:bg-white rounded-2xl shadow-md border border-slate-100 dark:border-slate-200 transition-all flex items-center justify-center bg-radial-pattern">
                  <img
                    src={qrPreviewData.qrUrl}
                    alt="QR Code Tracking"
                    style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
                    className="object-contain transition-all duration-150"
                  />
                </div>
                
                <span className="text-[10px] text-slate-400 mt-2">Kích thước hiển thị hiện tại: {qrSize}px • Margin: {qrMargin}</span>

                {/* URL String */}
                <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 mt-6">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate text-left flex-1" title={qrPreviewData.url}>
                    {qrPreviewData.url}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
                      copied
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Copy size={13} />
                    {copied ? "Đã chép" : "Sao chép"}
                  </button>
                </div>
              </div>

              {/* Right Side: Configuration & Action Tools Panel */}
              <div className="md:col-span-6 space-y-6">
                
                {/* Configuration Area */}
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <Settings size={16} className="text-blue-600" />
                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Chỉnh Sửa Cấu Hình Thiết Kế</h5>
                  </div>

                  {/* Size Adjust Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      <span>Kích Thước Thiết Kế</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">{qrSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="150" 
                      max="380" 
                      value={qrSize} 
                      onChange={(e) => setQrSize(parseInt(e.target.value))} 
                      className="w-full accent-blue-600 dark:accent-blue-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">Điều chỉnh kích thước của mã QR phù hợp cho việc in ấn hoặc đính kèm tài liệu.</p>
                  </div>

                  {/* Margin Adjust Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      <span>Độ Rộng Viền (Margin)</span>
                      <span className="text-blue-600 dark:text-blue-400 font-mono">{qrMargin}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="8" 
                      value={qrMargin} 
                      onChange={(e) => setQrMargin(parseInt(e.target.value))} 
                      className="w-full accent-blue-600 dark:accent-blue-500 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">Khoảng cách từ các điểm ảnh của mã QR tới khung viền ngoài.</p>
                  </div>

                  {/* Color Preset Selector */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Màu Sắc Đại Diện (Brand Color)</div>
                    
                    <div className="flex gap-2.5 flex-wrap">
                      {[
                        { name: "Đen tuyền", hex: "#000000" },
                        { name: "Navy Business", hex: "#1e3a8a" },
                        { name: "Emerald Green", hex: "#065f46" },
                        { name: "Crimson Red", hex: "#991b1b" },
                        { name: "Deep Amethyst", hex: "#5b21b6" },
                      ].map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setQrColor(c.hex)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${qrColor === c.hex ? "scale-110 border-blue-600 dark:border-blue-400 shadow-md" : "border-transparent"}`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    
                    {/* Custom Hex Color Picker */}
                    <div className="flex items-center gap-3 pt-1">
                      <input 
                        type="color" 
                        value={qrColor} 
                        onChange={(e) => setQrColor(e.target.value)} 
                        className="w-8 h-8 rounded cursor-pointer border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">{qrColor}</span>
                        <span className="text-[10px] text-slate-400">Chọn mã màu Hex tùy chỉnh</span>
                      </div>
                    </div>
                  </div>

                  {/* Config Persistence Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Lưu Cấu Hình
                    </button>
                    <button
                      type="button"
                      onClick={handleResetConfig}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-600 dark:text-slate-300 rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      Khôi Phục Mặc Định
                    </button>
                  </div>
                </div>

                {/* Print & Download Execution Tools */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Xuất Bản & Sử Dụng</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handlePrintQR}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
                    >
                      <Printer size={16} />
                      In Mã QR Tra Cứu
                    </button>
                    <button
                      onClick={handleDownloadQR}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
                    >
                      <Download size={16} />
                      Tải Xuống Ảnh QR
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setQrPreviewData(null)}
                className="px-6 py-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-750 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition-all text-sm cursor-pointer"
              >
                Đóng Màn Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
