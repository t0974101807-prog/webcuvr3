import React, { useState, useEffect } from "react";
import { 
  CreditCard, QrCode, CheckCircle2, Clock, AlertTriangle, 
  Search, RefreshCw, Printer, ShieldCheck, Zap, DollarSign, 
  TrendingUp, ArrowDownRight, ArrowUpRight, Copy, ExternalLink,
  Bot, Settings, FileSpreadsheet, Building, Sparkles,
  Download, Trash2, Check, RotateCcw, X, Edit3
} from "lucide-react";
import { fetchApi } from "../utils/api";

interface PaymentCenterViewProps {
  language?: "vi" | "en";
  user?: any;
}

export const PaymentCenterView: React.FC<PaymentCenterViewProps> = ({
  language = "vi",
  user
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"schedules" | "transactions" | "receipts" | "ai" | "settings">("schedules");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [simulatingRef, setSimulatingRef] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [previewReceipt, setPreviewReceipt] = useState<any>(null);
  
  // Banking and VietQR Configurations
  const [bankConfig, setBankConfig] = useState(() => {
    const saved = localStorage.getItem("banking_gateway_config");
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return {
      companyName: "CONG TY LUAT TNHH ANH DUONG LEGAL",
      bankName: "Ngân hàng TMCP Quân Đội (MBBank)",
      accountNumber: "0383111222",
      qrTemplate: "Standard VietQR Compact2",
      webhookUrl: typeof window !== "undefined" ? `${window.location.origin}/api/payment/bank-webhook` : "/api/payment/bank-webhook",
      webhookStatus: "Đang hoạt động (Ready)"
    };
  });

  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editedCompany, setEditedCompany] = useState(bankConfig.companyName);
  const [editedBankName, setEditedBankName] = useState(bankConfig.bankName);
  const [editedAccountNumber, setEditedAccountNumber] = useState(bankConfig.accountNumber);
  const [editedQrTemplate, setEditedQrTemplate] = useState(bankConfig.qrTemplate);
  const [editedWebhookUrl, setEditedWebhookUrl] = useState(bankConfig.webhookUrl);
  const [editedWebhookStatus, setEditedWebhookStatus] = useState(bankConfig.webhookStatus);

  // Synchronize input fields when config changes (e.g. on restore defaults)
  useEffect(() => {
    setEditedCompany(bankConfig.companyName);
    setEditedBankName(bankConfig.bankName);
    setEditedAccountNumber(bankConfig.accountNumber);
    setEditedQrTemplate(bankConfig.qrTemplate);
    setEditedWebhookUrl(bankConfig.webhookUrl);
    setEditedWebhookStatus(bankConfig.webhookStatus);
  }, [bankConfig]);

  // Helper to read numbers in Vietnamese
  const numberToVietnameseWords = (num: number): string => {
    if (num === 0) return "Không đồng";
    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const unitsTen = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
    
    const readGroup3 = (group: number, showZero: boolean): string => {
      let s = "";
      const hundred = Math.floor(group / 100);
      const ten = Math.floor((group % 100) / 10);
      const unit = group % 10;
      
      if (hundred > 0 || showZero) {
        s += units[hundred] + " trăm ";
      }
      
      if (ten > 0) {
        if (ten === 1) s += "mười ";
        else s += unitsTen[ten] + " ";
      } else if (hundred > 0 && unit > 0) {
        s += "lẻ ";
      }
      
      if (unit > 0) {
        if (unit === 1 && ten > 1) s += "mốt";
        else if (unit === 5 && ten > 0) s += "lăm";
        else s += units[unit];
      }
      return s.trim();
    };

    const labels = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    let str = "";
    let temp = Math.floor(num);
    let groupCount = 0;
    
    while (temp > 0) {
      const group = temp % 1000;
      if (group > 0) {
        const groupStr = readGroup3(group, temp > 1000);
        str = groupStr + " " + labels[groupCount] + " " + str;
      }
      temp = Math.floor(temp / 1000);
      groupCount++;
    }
    
    str = str.trim().replace(/\s+/g, ' ');
    if (str.endsWith(" ")) str = str.trim();
    return str.charAt(0).toUpperCase() + str.slice(1) + " đồng chẵn";
  };

  const handleSaveConfig = () => {
    const newConfig = {
      companyName: editedCompany,
      bankName: editedBankName,
      accountNumber: editedAccountNumber,
      qrTemplate: editedQrTemplate,
      webhookUrl: editedWebhookUrl,
      webhookStatus: editedWebhookStatus
    };
    setBankConfig(newConfig);
    localStorage.setItem("banking_gateway_config", JSON.stringify(newConfig));
    setIsEditingConfig(false);
    setNotice("🎉 Đã lưu cấu hình kết nối ngân hàng mới thành công!");
  };

  const handleDeleteConfig = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa/khôi phục cấu hình kết nối ngân hàng về mặc định không?")) {
      localStorage.removeItem("banking_gateway_config");
      const defaultConfig = {
        companyName: "CONG TY LUAT TNHH ANH DUONG LEGAL",
        bankName: "Ngân hàng TMCP Quân Đội (MBBank)",
        accountNumber: "0383111222",
        qrTemplate: "Standard VietQR Compact2",
        webhookUrl: typeof window !== "undefined" ? `${window.location.origin}/api/payment/bank-webhook` : "/api/payment/bank-webhook",
        webhookStatus: "Đang hoạt động (Ready)"
      };
      setBankConfig(defaultConfig);
      setIsEditingConfig(false);
      setNotice("ℹ️ Đã xóa cấu hình tùy chỉnh và khôi phục về mặc định thành công.");
    }
  };

  const downloadReceiptHtml = (receipt: any) => {
    const words = numberToVietnameseWords(receipt.amount);
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Phieu_Thu_${receipt.code}</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; padding: 40px; color: #000; line-height: 1.5; background: #fff; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .company { font-weight: bold; font-size: 14px; text-transform: uppercase; }
    .form-template { text-align: right; font-size: 11px; font-style: italic; }
    .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; margin-top: 20px; }
    .subtitle { text-align: center; font-size: 14px; font-style: italic; margin-bottom: 30px; }
    .row { margin-bottom: 12px; font-size: 15px; border-bottom: 1px dotted #ccc; padding-bottom: 4px; }
    .label { display: inline-block; width: 220px; color: #333; }
    .value { font-weight: bold; color: #000; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 14px; }
    .signature-box { width: 18%; }
    .signature-title { font-weight: bold; margin-bottom: 60px; }
    .signature-name { font-weight: bold; }
    .footer { margin-top: 60px; border-top: 1px dashed #000; padding-top: 20px; text-align: center; font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      \${bankConfig.companyName}<br>
      <span style="font-weight: normal; font-size: 11px; text-transform: none;">Hệ thống xác thực & Đối soát tự động VietQR</span>
    </div>
    <div class="form-template">
      <strong>Mẫu số 01 - TT</strong><br>
      (Ban hành theo Thông tư số 200/2014/TT-BTC<br>
      Ngày 22/12/2014 của Bộ Tài chính)
    </div>
  </div>
  
  <div class="title">PHIẾU THU ELECTRONIC</div>
  <div class="subtitle">
    Ngày \${new Date(receipt.date).getDate()} tháng \${new Date(receipt.date).getMonth() + 1} năm \${new Date(receipt.date).getFullYear()}<br>
    <strong>Mã phiếu: \${receipt.code}</strong>
  </div>
  
  <div class="row"><span class="label">Họ và tên người nộp tiền:</span><span class="value">\${receipt.customer.toUpperCase()}</span></div>
  <div class="row"><span class="label">Địa chỉ:</span><span class="value">Thành phố Hồ Chí Minh, Việt Nam</span></div>
  <div class="row"><span class="label">Lý do nộp:</span><span class="value">Thanh lý/Thanh toán đợt cọc hồ sơ \${receipt.refCode} - Hệ thống AI Banking Gateway</span></div>
  <div class="row"><span class="label">Số tiền:</span><span class="value" style="font-size: 16px;">\${Number(receipt.amount).toLocaleString("vi-VN")} VNĐ</span></div>
  <div class="row"><span class="label">Viết bằng chữ:</span><span class="value" style="font-style: italic; color: #111;">\${words}</span></div>
  <div class="row"><span class="label">Chứng từ kèm theo:</span><span class="value">Giao dịch đã khớp lệnh thành công (\${receipt.reconciliation_notes || 'Khớp tự động'})</span></div>
  
  <div class="signatures">
    <div class="signature-box">
      <div class="signature-title">Giám đốc</div>
      <div class="signature-note">(Ký, đóng dấu)</div>
      <div style="margin-top: 50px;" class="signature-name">Ánh Dương Legal</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Kế toán trưởng</div>
      <div class="signature-note">(Ký, họ tên)</div>
      <div style="margin-top: 50px;" class="signature-name">Phòng Kế Toán</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Thủ quỹ</div>
      <div class="signature-note">(Ký, họ tên)</div>
      <div style="margin-top: 50px;" class="signature-name">Thủ quỹ</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Người nộp tiền</div>
      <div class="signature-note">(Ký, họ tên)</div>
      <div style="margin-top: 50px;" class="signature-name">\${receipt.customer}</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Người lập phiếu</div>
      <div class="signature-note">(Ký, họ tên)</div>
      <div style="margin-top: 50px;" class="signature-name">Gateway AI System</div>
    </div>
  </div>
  
  <div class="footer">
    Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ pháp lý của chúng tôi. Phiếu thu điện tử này được tạo tự động khi có xác nhận tiền gửi vào tài khoản công ty.
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Phieu_Thu_\${receipt.code}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const rawRes = await fetchApi("/api/payment/financial-dashboard");
      const res = await rawRes.json();
      if (res && res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error("Error loading financial dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateTransfer = async (paymentRef: string, amount: number) => {
    setSimulatingRef(paymentRef);
    setNotice(null);
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
        setNotice(`🎉 KHỚP LỆNH THÀNH CÔNG: Money received for ${paymentRef}. Receipt generated: ${res.receiptCode}`);
        await loadDashboard();
      } else {
        alert(res?.error || "Không thể thực hiện khớp lệnh thanh toán");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSimulatingRef(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const report = dashboardData?.report || {
    totalContractValue: 0,
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 0,
    receiptsCount: 0,
    schedulesCount: 0,
    completedSchedulesCount: 0,
    topDebtCases: []
  };

  const insights = dashboardData?.insights || [];
  const recentTransactions = dashboardData?.recentTransactions || [];
  const recentEvents = dashboardData?.recentEvents || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <ShieldCheck size={14} className="text-emerald-400" />
            Event-Driven Financial Center • VietQR Banking Gateway AI
          </div>
          <h2 className="text-2xl font-bold mt-2">Trung Tâm Thanh Toán & Quản Lý Dòng Tiền Tự Động</h2>
          <p className="text-sm text-slate-300 mt-1">
            Tự động sinh mã VietQR khi tạo hồ sơ, ghi nhận báo đã thanh toán tức thì khi tiền vào tài khoản công ty.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboard}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới Dữ liệu
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 font-medium text-sm flex items-center justify-between shadow-sm">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-700 hover:underline text-xs">Đóng</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            Tổng Doanh Thu Hợp Đồng
            <DollarSign size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {report.totalContractValue.toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-500">VNĐ</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {report.schedulesCount} đợt thanh toán toàn hệ thống
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
            Thực Thu Đã Ngân Hàng
            <ArrowDownRight size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {report.totalCollected.toLocaleString("vi-VN")} <span className="text-xs font-normal text-emerald-600">VNĐ</span>
          </div>
          <div className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <CheckCircle2 size={12} /> Tỷ lệ thu hồi: {report.collectionRate}%
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center justify-between">
            Công Nợ Chưa Thu (AR)
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {report.totalPending.toLocaleString("vi-VN")} <span className="text-xs font-normal text-amber-600">VNĐ</span>
          </div>
          <div className="text-xs text-amber-600 mt-2">
            {report.schedulesCount - report.completedSchedulesCount} đợt chờ chuyển khoản qua VietQR
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-700 flex items-center justify-between">
            Phiếu Thu Đã Phát Hành
            <Printer size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {report.receiptsCount} <span className="text-xs font-normal text-purple-600">Phiếu</span>
          </div>
          <div className="text-xs text-purple-600 mt-2">
            Tự động xuất ngay khi nhận chuyển khoản
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("schedules")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "schedules"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <CreditCard size={14} /> Quản Lý Đợt Thanh Toán & VietQR
        </button>

        <button
          onClick={() => setActiveSubTab("transactions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "transactions"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Building size={14} /> Nhật Ký Banking Gateway ({recentTransactions.length})
        </button>

        <button
          onClick={() => setActiveSubTab("receipts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "receipts"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Printer size={14} /> Quản Lý Phiếu Thu (Receipts)
        </button>

        <button
          onClick={() => setActiveSubTab("ai")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "ai"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Sparkles size={14} className="text-amber-300" /> Trợ Lý Tài Chính AI ({insights.length})
        </button>

        <button
          onClick={() => setActiveSubTab("settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "settings"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Settings size={14} /> Cấu Hình Ngân Hàng
        </button>
      </div>

      {/* Tab 1: Payment Schedules & VietQR */}
      {activeSubTab === "schedules" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 text-base">Danh sách Đợt Thanh toán & VietQR</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã đợt, số hồ sơ..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
            {report.topDebtCases && report.topDebtCases.length > 0 ? (
              report.topDebtCases
                .filter((c: any) => !searchTerm || c.caseCode?.toLowerCase().includes(searchTerm.toLowerCase()) || c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((debtCase: any, idx: number) => (
                  <div key={debtCase.caseId || idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{debtCase.caseCode}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                          Chờ thanh toán
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">Khách hàng: <strong>{debtCase.clientName}</strong></div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Mã VietQR đợt 1 (Tạm ứng 30%): <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{debtCase.caseCode}-DP01</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Công nợ còn lại</div>
                        <div className="text-base font-bold text-amber-700">
                          {debtCase.remaining.toLocaleString("vi-VN")} đ
                        </div>
                      </div>

                      <button
                        disabled={simulatingRef === `${debtCase.caseCode}-DP01`}
                        onClick={() => handleSimulateTransfer(`${debtCase.caseCode}-DP01`, Math.round(debtCase.remaining * 0.3))}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Zap size={14} />
                        {simulatingRef === `${debtCase.caseCode}-DP01` ? "Đang xử lý..." : "Giả lập Chuyển tiền VietQR"}
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                Tất cả hợp đồng hiện tại đã hoàn tất thanh toán 100%!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Bank Transactions Feed */}
      {activeSubTab === "transactions" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Nhật Ký Giao Dịch Chuyển Khoản Ngân Hàng Tự Động</h3>
          <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-900 text-sm">{tx.transaction_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Nội dung: <code className="font-mono text-blue-700 font-semibold">{tx.transfer_content}</code>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{tx.created_at} • STK: {tx.account_number} ({tx.bank_code})</div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold text-emerald-700">
                      +{Number(tx.amount).toLocaleString("vi-VN")} đ
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{tx.reconciliation_notes}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                Chưa có giao dịch ngân hàng mới. Thử sử dụng nút "Giả lập Chuyển tiền VietQR" để phát sinh giao dịch thử nghiệm!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Receipts Manager */}
      {activeSubTab === "receipts" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Sổ Phiếu Thu Điện Tử</h3>
          <p className="text-xs text-slate-500">
            Phiếu thu được hệ thống tự động sinh khi Banking Gateway AI ghi nhận tiền vào tài khoản công ty.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData?.report?.receiptsCount > 0 ? (
              recentTransactions.map((tx: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="font-bold text-slate-900 text-sm">PT-2026-000{idx + 1}</div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Đã xác nhận
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Khách hàng: <strong>{tx.account_holder || "Khách hàng Chuyển khoản"}</strong></div>
                    <div>Mã đợt thanh toán: <code className="font-mono text-blue-700">{tx.payment_ref}</code></div>
                    <div>Số tiền: <strong className="text-emerald-700 text-sm">{Number(tx.amount).toLocaleString("vi-VN")} VNĐ</strong></div>
                    <div>Ngày lập: {tx.created_at}</div>
                  </div>
                  <button 
                    onClick={() => setPreviewReceipt({
                      code: `PT-2026-000${idx + 1}`,
                      customer: tx.account_holder || "Khách hàng Chuyển khoản",
                      refCode: tx.payment_ref,
                      amount: tx.amount,
                      date: tx.created_at,
                      reconciliation_notes: tx.reconciliation_notes
                    })}
                    className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1 transition"
                  >
                    <Printer size={14} /> In / Xem Xem trước Phiếu Thu
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center text-slate-500 text-sm">
                Chưa có Phiếu Thu phát hành. Thực hiện thanh toán đợt cọc ban đầu để tự động cấp Phiếu Thu.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: AI Financial Assistant */}
      {activeSubTab === "ai" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} />
            <h3 className="font-bold text-slate-900 text-base">Trợ Lý Tài Chính & Dự Báo Dòng Tiền AI</h3>
          </div>

          <div className="space-y-3">
            {insights.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{item.description}</p>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900 font-medium">
                  💡 <strong>Khuyên dùng:</strong> {item.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeSubTab === "settings" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Cấu Hình Kết Nối Banking Gateway & VietQR</h3>
              <p className="text-xs text-slate-500 mt-1">
                Quản lý thông tin tài khoản ngân hàng nhận tiền tự động và tích hợp hệ thống webhook thông minh.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditingConfig ? (
                <>
                  <button
                    onClick={() => {
                      setEditedCompany(bankConfig.companyName);
                      setEditedBankName(bankConfig.bankName);
                      setEditedAccountNumber(bankConfig.accountNumber);
                      setEditedQrTemplate(bankConfig.qrTemplate);
                      setEditedWebhookUrl(bankConfig.webhookUrl);
                      setEditedWebhookStatus(bankConfig.webhookStatus);
                      setIsEditingConfig(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Edit3 size={14} /> Chỉnh sửa Cấu hình
                  </button>
                  <button
                    onClick={handleDeleteConfig}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Trash2 size={14} /> Xóa / Khôi phục Mặc định
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Check size={14} /> Lưu Thay Đổi
                  </button>
                  <button
                    onClick={() => setIsEditingConfig(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <X size={14} /> Hủy bỏ
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Banking details */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Building className="text-blue-600" size={18} />
                <h4 className="font-bold text-slate-800 text-sm">Tài Khoản Ngân Hàng Nhận Tiền Tự Động</h4>
              </div>

              {isEditingConfig ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Công Ty / Đơn Vị</label>
                    <input
                      type="text"
                      value={editedCompany}
                      onChange={(e) => setEditedCompany(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Ngân Hàng</label>
                    <input
                      type="text"
                      value={editedBankName}
                      onChange={(e) => setEditedBankName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số Tài Khoản</label>
                    <input
                      type="text"
                      value={editedAccountNumber}
                      onChange={(e) => setEditedAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mẫu VietQR</label>
                    <select
                      value={editedQrTemplate}
                      onChange={(e) => setEditedQrTemplate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                    >
                      <option value="Standard VietQR Compact2">Standard VietQR Compact2</option>
                      <option value="Standard VietQR Compact">Standard VietQR Compact</option>
                      <option value="Standard VietQR Full">Standard VietQR Full Text</option>
                      <option value="Custom Dynamic Theme">Custom Dynamic Theme</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-600 space-y-3">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Tên Đơn Vị:</span>
                    <strong className="text-slate-900 text-right pl-2">{bankConfig.companyName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <strong className="text-slate-900">{bankConfig.bankName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <strong className="text-blue-700 font-mono text-sm">{bankConfig.accountNumber}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Mẫu VietQR:</span>
                    <span className="font-semibold text-slate-800 bg-slate-200 px-2 py-0.5 rounded text-[10px]">{bankConfig.qrTemplate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Box 2: Webhook details */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Zap className="text-blue-600" size={18} />
                <h4 className="font-bold text-slate-800 text-sm">Địa chỉ Webhook Ngân Hàng</h4>
              </div>

              {isEditingConfig ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Webhook URL Endpoint</label>
                    <input
                      type="text"
                      value={editedWebhookUrl}
                      onChange={(e) => setEditedWebhookUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng Thái Kết Nối</label>
                    <select
                      value={editedWebhookStatus}
                      onChange={(e) => setEditedWebhookStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                    >
                      <option value="Đang hoạt động (Ready)">Đang hoạt động (Ready)</option>
                      <option value="Tạm ngưng">Tạm ngưng</option>
                      <option value="Đang bảo trì">Đang bảo trì</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">Webhook URL:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={bankConfig.webhookUrl}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(bankConfig.webhookUrl)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                        title="Copy Webhook URL"
                      >
                        {copiedText === bankConfig.webhookUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100 text-xs">
                    <span className="text-slate-500">Trạng thái kết nối:</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{bankConfig.webhookStatus}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Hỗ trợ kết nối và đẩy lệnh trực tiếp Cassso, SeABank, MBBank, Vietcombank để tự động đối soát giao dịch thời gian thực.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview & Printing Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-blue-600" />
                <span className="font-bold text-slate-900 text-sm">Xem trước & In Phiếu Thu Điện Tử</span>
              </div>
              <button 
                onClick={() => setPreviewReceipt(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Printable Content */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-100/50">
              {/* Paper receipt container */}
              <div id="print-receipt-modal" className="border border-slate-200 rounded-xl p-8 bg-white text-slate-900 shadow-sm font-serif max-w-xl mx-auto">
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-dashed border-slate-300">
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wide text-slate-900">{bankConfig.companyName}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Hệ thống xác thực & Đối soát tự động VietQR</div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 italic">
                    <strong>Mẫu số 01 - TT</strong><br />
                    (Ban hành theo Thông tư số 200/2014/TT-BTC)
                  </div>
                </div>

                <div className="text-center my-6">
                  <h2 className="text-xl font-bold tracking-wider text-slate-950 uppercase">PHIẾU THU</h2>
                  <div className="text-xs text-slate-600 italic mt-1">
                    Ngày {new Date(previewReceipt.date).getDate()} tháng {new Date(previewReceipt.date).getMonth() + 1} năm {new Date(previewReceipt.date).getFullYear()}
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">Số: {previewReceipt.code}</div>
                </div>

                <div className="space-y-3 text-xs text-slate-800 border-b border-dashed border-slate-300 pb-4">
                  <div className="flex">
                    <span className="w-40 text-slate-500 shrink-0">Người nộp tiền:</span>
                    <strong className="text-slate-950 uppercase font-sans">{previewReceipt.customer}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-slate-500 shrink-0">Địa chỉ:</span>
                    <span className="text-slate-950">Thành phố Hồ Chí Minh, Việt Nam</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-slate-500 shrink-0">Lý do nộp:</span>
                    <span className="text-slate-950">Thanh lý/Thanh toán đợt cọc hồ sơ {previewReceipt.refCode} - Hệ thống AI Banking Gateway</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-slate-500 shrink-0">Số tiền nộp:</span>
                    <strong className="text-emerald-700 text-sm font-sans">{Number(previewReceipt.amount).toLocaleString("vi-VN")} VNĐ</strong>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-slate-500 shrink-0">Viết bằng chữ:</span>
                    <span className="text-slate-950 italic font-medium">{numberToVietnameseWords(previewReceipt.amount)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-slate-500 shrink-0">Chứng từ kèm theo:</span>
                    <span className="text-slate-950 font-mono text-[11px]">{previewReceipt.reconciliation_notes || "Giao dịch khớp lệnh tự động"}</span>
                  </div>
                </div>

                {/* Signatures section */}
                <div className="grid grid-cols-5 gap-1 text-center text-[9px] text-slate-700 mt-6 pt-2">
                  <div>
                    <strong className="text-slate-900 block font-bold">Giám đốc</strong>
                    <span className="text-[8px] italic text-slate-400 block mt-0.5">(Ký, đóng dấu)</span>
                    <div className="h-10"></div>
                    <span className="font-bold text-slate-800 block">Ánh Dương Legal</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold">Kế toán trưởng</strong>
                    <span className="text-[8px] italic text-slate-400 block mt-0.5">(Ký, họ tên)</span>
                    <div className="h-10"></div>
                    <span className="font-bold text-slate-800 block">Phòng Kế Toán</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold">Thủ quỹ</strong>
                    <span className="text-[8px] italic text-slate-400 block mt-0.5">(Ký, họ tên)</span>
                    <div className="h-10"></div>
                    <span className="font-bold text-slate-800 block">Thủ quỹ</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold">Người nộp tiền</strong>
                    <span className="text-[8px] italic text-slate-400 block mt-0.5">(Ký, họ tên)</span>
                    <div className="h-10"></div>
                    <span className="font-bold text-slate-800 block truncate">{previewReceipt.customer}</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-bold">Người lập phiếu</strong>
                    <span className="text-[8px] italic text-slate-400 block mt-0.5">(Ký, họ tên)</span>
                    <div className="h-10"></div>
                    <span className="font-bold text-slate-800 block">AI Gateway</span>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 italic text-center mt-10 border-t border-slate-100 pt-3">
                  Phiếu thu điện tử này được tạo tự động bởi hệ thống AI Banking Gateway.
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => downloadReceiptHtml(previewReceipt)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download size={14} /> Tải xuống Phiếu Thu (.html)
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer size={14} /> In Phiếu Thu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
