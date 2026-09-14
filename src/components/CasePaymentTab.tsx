import React, { useState, useEffect } from "react";
import { 
  QrCode, CreditCard, CheckCircle2, Clock, AlertCircle, 
  Copy, ExternalLink, RefreshCw, Printer, ShieldCheck, Zap, Download, Send
} from "lucide-react";
import { fetchApi } from "../utils/api";

interface CasePaymentTabProps {
  caseId: string;
  caseCode?: string;
  clientName?: string;
  feeAmount?: number;
}

export const CasePaymentTab: React.FC<CasePaymentTabProps> = ({
  caseId,
  caseCode,
  clientName,
  feeAmount = 0
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const rawRes = await fetchApi(`/api/payment/case/${caseId}`);
      const res = await rawRes.json();
      if (res && res.success) {
        setData(res);
        if (res.pendingSchedule) {
          setSelectedSchedule(res.pendingSchedule);
        } else if (res.schedules && res.schedules.length > 0) {
          setSelectedSchedule(res.schedules[0]);
        }
      }
    } catch (err) {
      console.error("Error loading case payment details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      loadData();
    }
  }, [caseId]);

  const handleSimulateTransfer = async (paymentRef: string, amount: number) => {
    setSimulating(true);
    setSuccessMsg(null);
    try {
      const rawRes = await fetchApi("/api/payment/simulate-transfer", {
        method: "POST",
        body: JSON.stringify({
          paymentRef,
          amount
        })
      });
      const res = await rawRes.json();

      if (res && res.success) {
        setSuccessMsg(`✅ ${res.message}`);
        await loadData();
      } else {
        alert(res?.error || "Không thể giả lập thanh toán");
      }
    } catch (err: any) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadQR = async () => {
    if (!selectedSchedule) return;
    const url = selectedSchedule.qr_code_url || `https://img.vietqr.io/image/MB-0383111222-compact2.png?amount=${selectedSchedule.amount}&addInfo=${selectedSchedule.payment_ref}&accountName=CONG%20TY%20LUAT%20ANH%20DUONG`;
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `VietQR_Payment_${selectedSchedule.payment_ref}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = `VietQR_Payment_${selectedSchedule.payment_ref}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handlePrintQR = () => {
    if (!selectedSchedule) return;
    const url = selectedSchedule.qr_code_url || `https://img.vietqr.io/image/MB-0383111222-compact2.png?amount=${selectedSchedule.amount}&addInfo=${selectedSchedule.payment_ref}&accountName=CONG%20TY%20LUAT%20ANH%20DUONG`;
    
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
            <title>In mã QR Thanh toán - ${selectedSchedule.payment_ref}</title>
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
                max-width: 380px;
                display: inline-block;
              }
              img {
                width: 260px;
                height: auto;
                margin: 20px auto;
                display: block;
              }
              h2 {
                margin: 0;
                color: #0f172a;
                font-size: 20px;
                font-weight: 700;
              }
              p {
                margin: 8px 0 0 0;
                color: #475569;
                font-size: 13px;
                line-height: 1.4;
              }
              .ref {
                font-family: monospace;
                background: #f1f5f9;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 14px;
                color: #1e293b;
                font-weight: 700;
                display: inline-block;
                margin-bottom: 15px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="ref">${selectedSchedule.payment_ref}</div>
              <h2>Mã QR Thanh Toán VietQR</h2>
              <p>Quét mã QR bằng ứng dụng Ngân hàng để thanh toán đợt ${selectedSchedule.round}</p>
              <img src="${url}" />
              <p style="font-size: 14px; font-weight: bold; color: #059669; margin: 10px 0 0 0;">Số tiền: ${Number(selectedSchedule.amount).toLocaleString('vi-VN')} VNĐ</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-500 dark:text-slate-400">
        <RefreshCw className="animate-spin mr-2" size={20} />
        Đang tải thông tin Thanh toán & VietQR...
      </div>
    );
  }

  const payment = data?.payment || {
    contract_value: feeAmount,
    paid_amount: 0,
    remaining_amount: feeAmount,
    status: "Pending"
  };

  const schedules = data?.schedules || [];
  const receipts = data?.receipts || [];
  const caseQrUrl = data?.caseQrUrl || `${window.location.origin}/case-qr/${data?.caseQrToken || caseId}`;

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-white shadow-sm border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Giá trị hợp đồng</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">
            {Number(payment.contract_value || 0).toLocaleString("vi-VN")} <span className="text-sm font-normal text-slate-300">VNĐ</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            Hợp đồng chính thức Legal OS
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100 shadow-sm border border-emerald-200 dark:border-emerald-900/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Đã thanh toán thực thu</div>
          <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
            {Number(payment.paid_amount || 0).toLocaleString("vi-VN")} <span className="text-sm font-normal text-emerald-600 dark:text-emerald-500">VNĐ</span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-2 flex items-center gap-1">
            <CheckCircle2 size={14} />
            Đã đối chiếu thành công
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100 shadow-sm border border-amber-200 dark:border-amber-900/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Công nợ còn lại</div>
          <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">
            {Number(payment.remaining_amount || 0).toLocaleString("vi-VN")} <span className="text-sm font-normal text-amber-600 dark:text-amber-500">VNĐ</span>
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
            <Clock size={14} />
            {payment.remaining_amount === 0 ? "Đã hoàn tất 100%" : "Đang đợi thanh toán đợt kế tiếp"}
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-medium text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs">Đóng</button>
        </div>
      )}

      {/* Dynamic 2-in-1 Case QR & VietQR Payment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* QR Display Column */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
          <div className="text-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              <QrCode size={14} />
              Mã QR Đa Năng 2-Trong-1
            </span>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-2">Mã QR Thanh Toán & Tra Cứu Hồ Sơ</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Quét QR để thanh toán 30% cọc ban đầu hoặc xem tiến độ xử lý hồ sơ tự động
            </p>
          </div>

          {selectedSchedule && (
            <div className="relative p-3 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 my-2 text-center">
              <img 
                src={selectedSchedule.qr_code_url || `https://img.vietqr.io/image/MB-0383111222-compact2.png?amount=${selectedSchedule.amount}&addInfo=${selectedSchedule.payment_ref}&accountName=CONG%20TY%20LUAT%20ANH%20DUONG`} 
                alt="VietQR Payment"
                className="w-56 h-auto object-contain rounded-lg mx-auto"
              />
              <div className="text-center mt-2">
                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  {selectedSchedule.payment_ref}
                </span>
              </div>
            </div>
          )}

          {/* Action Tools for QR (Print & Download & Share) */}
          <div className="grid grid-cols-2 gap-2 mt-3 w-full">
            <button
              onClick={handlePrintQR}
              className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer size={14} />
              In Mã QR
            </button>
            <button
              onClick={handleDownloadQR}
              className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Download size={14} />
              Tải Xuống QR
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2 w-full">
            <button
              onClick={() => selectedSchedule && copyToClipboard(selectedSchedule.payment_ref)}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition"
            >
              <Copy size={14} />
              {copiedRef ? "Đã sao chép!" : "Sao chép mã CK"}
            </button>
            <a
              href={caseQrUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition"
            >
              <ExternalLink size={14} />
              Mở link QR
            </a>
          </div>
        </div>

        {/* Schedule & Payment Details Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              Lịch trình Thanh toán theo Hợp đồng
            </h3>
            <button 
              onClick={loadData}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
            >
              <RefreshCw size={12} /> Làm mới
            </button>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {schedules.map((sched: any, idx: number) => {
              const isCompleted = sched.status === "Completed" || sched.status === "Receipt Created" || sched.status === "Finance Approved";
              const isSelected = selectedSchedule?.payment_ref === sched.payment_ref;

              return (
                <div 
                  key={sched.payment_ref || idx}
                  onClick={() => setSelectedSchedule(sched)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm" 
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          Đợt {sched.round}: {sched.type === 'DP' ? 'Đặt cọc / Tạm ứng' : sched.type === 'IP' ? 'Thanh toán tiến độ' : 'Thanh lý hợp đồng'} ({sched.percentage}%)
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isCompleted 
                            ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30" 
                            : "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30"
                        }`}>
                          {isCompleted ? "Đã thanh toán" : "Chờ thanh toán"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                        <span>Mã CK: <strong className="font-mono text-slate-800 dark:text-slate-200">{sched.payment_ref}</strong></span>
                        <span>Hạn thanh toán: {sched.due_date}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">{sched.notes}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">
                        {Number(sched.amount || 0).toLocaleString("vi-VN")} đ
                      </div>
                      {!isCompleted && (
                        <button
                          disabled={simulating}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateTransfer(sched.payment_ref, sched.amount);
                          }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                        >
                          <Zap size={13} />
                          {simulating ? "Đang xử lý..." : "Chuyển tiền ngay (Test)"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Company Banking Information */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              Tài khoản Ngân hàng Công ty Nhận Tiền Tự Động
            </div>
            <div>Tên tài khoản: <strong className="text-slate-900 dark:text-slate-200">CONG TY LUAT TNHH ANH DUONG LEGAL</strong></div>
            <div>Số tài khoản: <strong className="font-mono text-blue-700 dark:text-blue-400 text-sm">0383111222</strong></div>
            <div>Ngân hàng: <strong className="text-slate-900 dark:text-slate-200">Ngân hàng TMCP Quân Đội (MBBank)</strong></div>
            <div className="text-slate-500 dark:text-slate-400 italic mt-1">
              * Hệ thống tự động báo "Đã thanh toán thành công" lập tức khi tiền vào tài khoản nhờ Banking Gateway AI.
            </div>
          </div>
        </div>
      </div>

      {/* Receipts History */}
      {receipts && receipts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <Printer size={18} className="text-emerald-600" />
            Lịch sử Phiếu Thu đã xuất ({receipts.length})
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {receipts.map((r: any) => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{r.receipt_code}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mã đợt: {r.payment_ref} • Phương thức: {r.payment_method}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{r.created_at}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-base">
                    +{Number(r.amount).toLocaleString("vi-VN")} VNĐ
                  </div>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 font-medium">
                    Hợp lệ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
