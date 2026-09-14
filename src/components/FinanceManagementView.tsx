import React, { useState, useEffect, useMemo } from "react";
import { PaymentCenterView } from "./PaymentCenterView";
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, ClipboardList, TrendingUp, 
  Settings, CheckCircle2, XCircle, AlertTriangle, Building, ShieldAlert,
  Wallet, Users, FileSpreadsheet, Plus, HelpCircle, Landmark
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

interface FinanceManagementViewProps {
  language: "vi" | "en";
  user?: any;
}

export default function FinanceManagementView({
  language,
  user,
}: FinanceManagementViewProps) {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<"payment-center" | "transactions" | "assets-debts" | "tax" | "budget" | "salary-orders" | "commissions">("payment-center");

  // Core Data Lists
  const [transactions, setTransactions] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [taxReports, setTaxReports] = useState<any[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]);
  const [salaryOrders, setSalaryOrders] = useState<any[]>([]);
  const [staffCommissions, setStaffCommissions] = useState<any[]>([]);
  
  // Modals / Creators
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddTax, setShowAddTax] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddSalaryOrder, setShowAddSalaryOrder] = useState(false);

  // Stats
  const [performance, setPerformance] = useState({ revenue: 0, expense: 0, profit: 0 });

  // Form States
  const [txForm, setTxForm] = useState({ type: "thu", amount: "", category: "Phí dịch vụ", description: "", date: new Date().toISOString().split("T")[0] });
  const [assetForm, setAssetForm] = useState({ name: "", value: "", purchase_date: new Date().toISOString().split("T")[0], description: "" });
  const [debtForm, setDebtForm] = useState({ debtor_name: "", type: "phai_thu", amount: "", due_date: new Date().toISOString().split("T")[0], status: "chua_thanh_toan", description: "" });
  const [taxForm, setTaxForm] = useState({ period: "Quý 3", year: "2026", tax_type: "Thuế GTGT (VAT)", amount: "", status: "pending", submission_date: "", notes: "" });
  const [budgetForm, setBudgetForm] = useState({ period: "Tháng 8", year: "2026", budget_amount: "", expected_revenue: "", expected_expense: "", notes: "" });
  
  // Custom commission edit state
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editCommRate, setEditCommRate] = useState("");
  const [editBonusRate, setEditBonusRate] = useState("");

  // Loaded Payroll Info for automatic salary run
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedSalaryMonth, setSelectedSalaryMonth] = useState("7");
  const [selectedSalaryYear, setSelectedSalaryYear] = useState("2026");

  // Fetch all finances
  const fetchData = async () => {
    try {
      const txRes = await fetch("/api/finance/transactions");
      const txData = await txRes.json();
      if (txData.success) setTransactions(txData.data);

      const adRes = await fetch("/api/finance/assets-debts");
      const adData = await adRes.json();
      if (adData.success) {
        setAssets(adData.data.assets);
        setDebts(adData.data.debts);
      }

      const taxRes = await fetch("/api/finance/tax-reports");
      const taxData = await taxRes.json();
      if (taxData.success) setTaxReports(taxData.data);

      const budRes = await fetch("/api/finance/budget-plans");
      const budData = await budRes.json();
      if (budData.success) setBudgetPlans(budData.data);

      const salRes = await fetch("/api/finance/salary-orders");
      const salData = await salRes.json();
      if (salData.success) setSalaryOrders(salData.data);

      const perfRes = await fetch("/api/finance/performance");
      const perfData = await perfRes.json();
      if (perfData.success) setPerformance(perfData.data);

      const commRes = await fetch("/api/finance/staff-commissions");
      const commData = await commRes.json();
      if (commData.success) setStaffCommissions(commData.data);

      // Also load existing calculated payrolls from system
      const prRes = await fetch("/api/monthly-payrolls");
      const prData = await prRes.json();
      if (Array.isArray(prData)) {
        setPayrolls(prData);
      }
    } catch (error) {
      console.error("Error loading financial information", error);
    }
  };

  useEffect(() => {
    fetchData();

    const handleRealtimeUpdate = () => {
      fetchData();
    };

    window.addEventListener("finance-data-updated", handleRealtimeUpdate);
    return () => {
      window.removeEventListener("finance-data-updated", handleRealtimeUpdate);
    };
  }, [activeSubTab]);

  // Actions
  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || Number(txForm.amount) <= 0) {
      alert(language === "vi" ? "Vui lòng nhập số tiền hợp lệ!" : "Please enter a valid amount!");
      return;
    }
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txForm),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          data.data.status === "pending_approval"
            ? (language === "vi" ? "Tạo lệnh chi thành công! Đã chuyển cho Giám đốc duyệt." : "Expenditure order created! Awaiting Director approval.")
            : (language === "vi" ? "Ghi giao dịch thành công!" : "Transaction successfully recorded!")
        );
        setShowAddTx(false);
        setTxForm({ type: "thu", amount: "", category: "Phí dịch vụ", description: "", date: new Date().toISOString().split("T")[0] });
        fetchData();
      } else {
        alert(data.error || "Error");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleApproveTx = async (id: number, action: "approve" | "reject") => {
    if (!confirm(language === "vi" ? "Xác nhận duyệt lệnh chi này?" : "Confirm approval/rejection of this expenditure?")) return;
    try {
      const res = await fetch("/api/finance/transactions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assetForm),
      });
      if (res.ok) {
        setShowAddAsset(false);
        setAssetForm({ name: "", value: "", purchase_date: new Date().toISOString().split("T")[0], description: "" });
        fetchData();
      }
    } catch (err) {}
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(debtForm),
      });
      if (res.ok) {
        setShowAddDebt(false);
        setDebtForm({ debtor_name: "", type: "phai_thu", amount: "", due_date: new Date().toISOString().split("T")[0], status: "chua_thanh_toan", description: "" });
        fetchData();
      }
    } catch (err) {}
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance/tax-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taxForm),
      });
      if (res.ok) {
        setShowAddTax(false);
        setTaxForm({ period: "Quý 3", year: "2026", tax_type: "Thuế GTGT (VAT)", amount: "", status: "pending", submission_date: "", notes: "" });
        fetchData();
      }
    } catch (err) {}
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance/budget-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetForm),
      });
      if (res.ok) {
        setShowAddBudget(false);
        setBudgetForm({ period: "Tháng 8", year: "2026", budget_amount: "", expected_revenue: "", expected_expense: "", notes: "" });
        fetchData();
      }
    } catch (err) {}
  };

  // Automated batch payroll order creator
  const handleCreateSalaryOrder = async () => {
    const m = Number(selectedSalaryMonth);
    const y = Number(selectedSalaryYear);
    
    // Filter payrolls for this month
    const matchingPayrolls = payrolls.filter((p) => p.month === m && p.year === y);
    if (matchingPayrolls.length === 0) {
      alert(
        language === "vi"
          ? `Bảng lương Tháng ${m}/${y} chưa được tính toán hoặc trống! Hãy tính lương ở tab Bảng Lương trước.`
          : `Payroll table for ${m}/${y} is empty or not calculated yet! Please calculate payroll in the Payroll tab first.`
      );
      return;
    }

    const total = matchingPayrolls.reduce((sum, p) => sum + (Number(p.netSalary) || 0), 0);

    try {
      const res = await fetch("/api/finance/salary-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: m,
          year: y,
          total_amount: total,
          details: matchingPayrolls.map((p) => ({
            employeeName: p.employeeName || p.username,
            baseSalary: p.baseSalary,
            allowance: p.allowance,
            bonus: p.bonus,
            deductions: p.deductions,
            netSalary: p.netSalary,
            bankAccount: p.bankAccount || "999888777666",
            bankName: p.bankName || "Techcombank",
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(language === "vi" ? "Đã lập lệnh thanh toán lương thành công! Hãy chuyển cấp trên phê duyệt." : "Salary payment order created successfully! Please wait for approval.");
        setShowAddSalaryOrder(false);
        fetchData();
      }
    } catch (err) {}
  };

  const handleApproveSalaryOrder = async (id: number) => {
    if (!confirm(language === "vi" ? "Phê duyệt lệnh chi lương này?" : "Approve this payroll order?")) return;
    try {
      const res = await fetch("/api/finance/salary-orders/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {}
  };

  const handlePaySalaryOrder = async (id: number) => {
    if (!confirm(language === "vi" ? "Xác nhận thực hiện chuyển tiền tự động từ tài khoản ngân hàng liên kết để chi lương?" : "Perform direct bank transfer simulation to pay salaries?")) return;
    try {
      const res = await fetch("/api/finance/salary-orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        alert(language === "vi" ? "Đã thực hiện chi tiền lương tự động thành công qua ngân hàng số liên kết!" : "Automatic salary payout triggered successfully via linked bank account!");
        fetchData();
      }
    } catch (err) {}
  };

  // Customize commission percentage rates
  const handleUpdateCommissionConfig = async (userId: number) => {
    try {
      const res = await fetch("/api/finance/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          commission_percent: Number(editCommRate),
          bonus_completion_percent: Number(editBonusRate),
        }),
      });
      if (res.ok) {
        alert(language === "vi" ? "Cập nhật tỷ lệ thành công!" : "Rates updated successfully!");
        setEditingStaffId(null);
        fetchData();
      }
    } catch (err) {}
  };

  // Formatting helpers
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  // Computations for graphs
  const txSummaryChartData = useMemo(() => {
    // Basic grouping by date for cashflow
    const groups: Record<string, { date: string; Revenue: number; Expense: number }> = {};
    transactions.forEach((tx) => {
      if (tx.status !== "completed") return;
      const d = tx.date || "2026-07-18";
      if (!groups[d]) {
        groups[d] = { date: d, Revenue: 0, Expense: 0 };
      }
      if (tx.type === "thu") {
        groups[d].Revenue += tx.amount;
      } else {
        groups[d].Expense += tx.amount;
      }
    });
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  }, [transactions]);

  const totalAssetsValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);
  const totalDebtsReceivable = debts.filter((d) => d.type === "phai_thu" && d.status !== "da_thanh_toan").reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalDebtsPayable = debts.filter((d) => d.type === "phai_tra" && d.status !== "da_thanh_toan").reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top dashboard financial health cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {language === "vi" ? "Tổng Doanh Thu" : "Total Revenue"}
              </p>
              <h3 className="text-xl font-bold text-slate-900 mt-2 font-mono">
                {formatMoney(performance.revenue)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {language === "vi" ? "Ghi nhận từ dịch vụ pháp lý & giao dịch thu" : "Recorded from services & revenue transactions"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {language === "vi" ? "Tổng Chi Phí" : "Total Expenses"}
              </p>
              <h3 className="text-xl font-bold text-slate-900 mt-2 font-mono">
                {formatMoney(performance.expense)}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {language === "vi" ? "Đã bao gồm chi lương & vận hành" : "Includes salary runs & operations expenditure"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {language === "vi" ? "Lợi Nhuận Thục Tế" : "Net Profit"}
              </p>
              <h3 className="text-xl font-bold text-indigo-600 mt-2 font-mono">
                {formatMoney(performance.profit)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {performance.profit >= 0 
              ? (language === "vi" ? "Hoạt động kinh doanh có lãi" : "Profitable operation")
              : (language === "vi" ? "Cần kiểm soát lại dòng tiền chi" : "Need to regulate cashflows")}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {language === "vi" ? "Tài Sản ròng & Công Nợ" : "Assets & Debt Health"}
              </p>
              <h3 className="text-sm font-bold text-slate-900 mt-2 font-mono">
                {language === "vi" ? "TS: " : "Assets: "}{formatMoney(totalAssetsValue)}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                {language === "vi" ? "Nợ phải trả: " : "Payable: "}{formatMoney(totalDebtsPayable)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
              <Building size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Navigation bar of sub-modules */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab("payment-center")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeSubTab === "payment-center" ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <span>⚡ Trung Tâm Thanh Toán & VietQR</span>
          </button>
          <button
            onClick={() => setActiveSubTab("transactions")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === "transactions" ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {language === "vi" ? "Quản lý Thu - Chi" : "Transactions (Thu/Chi)"}
          </button>
          <button
            onClick={() => setActiveSubTab("assets-debts")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === "assets-debts" ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {language === "vi" ? "Tài sản & Công nợ" : "Assets & Debts"}
          </button>
          <button
            onClick={() => setActiveSubTab("tax")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === "tax" ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {language === "vi" ? "Báo cáo Thuế" : "Tax Reports"}
          </button>
          <button
            onClick={() => setActiveSubTab("budget")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === "budget" ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {language === "vi" ? "Ngân sách & Dự báo" : "Budgets & Forecasts"}
          </button>
          <button
            onClick={() => setActiveSubTab("salary-orders")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === "salary-orders" ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {language === "vi" ? "Chi Lương Tự Động" : "Salary Payout Orders"}
          </button>
          <button
            onClick={() => setActiveSubTab("commissions")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === "commissions" ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {language === "vi" ? "Quản lý % Hoa hồng" : "Commission Settings"}
          </button>
        </div>

        <div className="p-6">
          {/* 0. Payment Center Tab */}
          {activeSubTab === "payment-center" && (
            <div className="animate-in fade-in">
              <PaymentCenterView language={language} user={user} />
            </div>
          )}

          {/* 1. Transactions Tab */}
          {activeSubTab === "transactions" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {language === "vi" ? "Danh sách giao dịch tài chính công ty" : "Company Transaction Registry"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === "vi" 
                      ? "Kế toán ghi nhận thu chi chính xác. Các khoản chi yêu cầu Ban giám đốc duyệt trước khi hạch toán."
                      : "Record cash inflows and outflows. Outflows require director approval prior to settlement."}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTx(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
                >
                  <Plus size={14} />
                  {language === "vi" ? "Ghi nhận Thu - Chi" : "Record Transaction"}
                </button>
              </div>

              {/* Cashflow Recharts area graph */}
              {txSummaryChartData.length > 0 ? (
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={txSummaryChartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                      <YAxis tick={{fontSize: 10}} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" name={language === "vi" ? "Doanh Thu" : "Revenue"} />
                      <Area type="monotone" dataKey="Expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExp)" name={language === "vi" ? "Chi Phí" : "Expenses"} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-slate-50/60 p-6 rounded-3xl border border-dashed border-slate-200 text-center py-8">
                  <Landmark size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Chưa có dữ liệu giao dịch tài chính</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Biểu đồ doanh thu & chi phí sẽ tự động cập nhật khi phát sinh các giao dịch thực tế.</p>
                </div>
              )}

              {/* Transactions Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-3">{language === "vi" ? "Ngày" : "Date"}</th>
                      <th className="p-3">{language === "vi" ? "Loại" : "Type"}</th>
                      <th className="p-3">{language === "vi" ? "Số tiền" : "Amount"}</th>
                      <th className="p-3">{language === "vi" ? "Hạng mục" : "Category"}</th>
                      <th className="p-3">{language === "vi" ? "Mô tả" : "Description"}</th>
                      <th className="p-3">{language === "vi" ? "Người lập" : "Recorded By"}</th>
                      <th className="p-3">{language === "vi" ? "Trạng thái" : "Status"}</th>
                      <th className="p-3 text-right">{language === "vi" ? "Thao tác" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          {language === "vi" ? "Chưa có giao dịch nào được ghi nhận." : "No transactions found."}
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-3 font-mono">{tx.date}</td>
                          <td className="p-3 font-semibold">
                            {tx.type === "thu" ? (
                              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 w-max">
                                <ArrowUpRight size={12} />
                                {language === "vi" ? "Thu" : "In"}
                              </span>
                            ) : (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1 w-max">
                                <ArrowDownRight size={12} />
                                {language === "vi" ? "Chi" : "Out"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold font-mono text-slate-800">{formatMoney(tx.amount)}</td>
                          <td className="p-3 font-medium text-slate-700">{tx.category}</td>
                          <td className="p-3 text-slate-500 max-w-[200px] truncate" title={tx.description}>{tx.description}</td>
                          <td className="p-3 text-slate-500">{tx.created_by}</td>
                          <td className="p-3">
                            {tx.status === "completed" && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 w-max">
                                <CheckCircle2 size={12} />
                                {language === "vi" ? "Đã duyệt/Hoàn tất" : "Approved"}
                              </span>
                            )}
                            {tx.status === "pending_approval" && (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 w-max animate-pulse">
                                <AlertTriangle size={12} />
                                {language === "vi" ? "Chờ Giám Đốc duyệt" : "Awaiting Approval"}
                              </span>
                            )}
                            {tx.status === "rejected" && (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 w-max">
                                <XCircle size={12} />
                                {language === "vi" ? "Từ chối" : "Rejected"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {tx.status === "pending_approval" && (user?.role === "director" || user?.role === "Giám đốc" || user?.role === "admin" || user?.role === "accountant" || user?.role === "Kế toán") ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveTx(tx.id, "approve")}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                                >
                                  {language === "vi" ? "Duyệt" : "Approve"}
                                </button>
                                <button
                                  onClick={() => handleApproveTx(tx.id, "reject")}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                                >
                                  {language === "vi" ? "Từ chối" : "Reject"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400">---</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Assets & Debts Tab */}
          {activeSubTab === "assets-debts" && (
            <div className="space-y-6 animate-in fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Building size={16} className="text-indigo-600" />
                    {language === "vi" ? "Quản lý Tài sản Doanh nghiệp" : "Company Assets Inventory"}
                  </h4>
                  <button
                    onClick={() => setShowAddAsset(true)}
                    className="flex items-center gap-0.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition"
                  >
                    <Plus size={10} />
                    {language === "vi" ? "Thêm tài sản" : "Add Asset"}
                  </button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <th className="p-3">{language === "vi" ? "Tên tài sản" : "Asset Name"}</th>
                        <th className="p-3">{language === "vi" ? "Giá trị" : "Value"}</th>
                        <th className="p-3">{language === "vi" ? "Ngày mua" : "Purchase Date"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">
                            {language === "vi" ? "Chưa có tài sản nào." : "No assets recorded."}
                          </td>
                        </tr>
                      ) : (
                        assets.map((a) => (
                          <tr key={a.id} className="border-b border-slate-100">
                            <td className="p-3 font-semibold text-slate-800">{a.name}</td>
                            <td className="p-3 font-mono font-bold text-slate-700">{formatMoney(a.value)}</td>
                            <td className="p-3 text-slate-500 font-mono">{a.purchase_date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Debts Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Wallet size={16} className="text-indigo-600" />
                    {language === "vi" ? "Kiểm soát Công nợ phải thu & phải trả" : "Receivables & Payables Ledger"}
                  </h4>
                  <button
                    onClick={() => setShowAddDebt(true)}
                    className="flex items-center gap-0.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition"
                  >
                    <Plus size={10} />
                    {language === "vi" ? "Thêm công nợ" : "Log Debt"}
                  </button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <th className="p-3">{language === "vi" ? "Đối tác/Đối tượng" : "Debtor/Creditor"}</th>
                        <th className="p-3">{language === "vi" ? "Loại nợ" : "Type"}</th>
                        <th className="p-3">{language === "vi" ? "Số tiền" : "Amount"}</th>
                        <th className="p-3">{language === "vi" ? "Hạn thanh toán" : "Due Date"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">
                            {language === "vi" ? "Chưa ghi nhận công nợ nào." : "No debts recorded."}
                          </td>
                        </tr>
                      ) : (
                        debts.map((d) => (
                          <tr key={d.id} className="border-b border-slate-100">
                            <td className="p-3 font-semibold text-slate-800">{d.debtor_name}</td>
                            <td className="p-3">
                              {d.type === "phai_thu" ? (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                  {language === "vi" ? "Phải thu" : "Receivable"}
                                </span>
                              ) : (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                  {language === "vi" ? "Phải trả" : "Payable"}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-700">{formatMoney(d.amount)}</td>
                            <td className="p-3 text-slate-500 font-mono">{d.due_date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. Tax compliance */}
          {activeSubTab === "tax" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {language === "vi" ? "Nghĩa vụ Thuế & Báo cáo Nhà nước" : "Government Tax & Compliance Reporting"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === "vi" 
                      ? "Lập báo cáo thuế định kỳ (VAT, CIT, PIT) bảo đảm tuân thủ luật tài chính hành chính."
                      : "Create scheduled tax filing reports to comply with fiscal and national regulations."}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTax(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
                >
                  <Plus size={14} />
                  {language === "vi" ? "Khai báo Thuế mới" : "Log New Tax Report"}
                </button>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-3">{language === "vi" ? "Kỳ báo cáo" : "Period"}</th>
                      <th className="p-3">{language === "vi" ? "Năm" : "Year"}</th>
                      <th className="p-3">{language === "vi" ? "Loại thuế" : "Tax Type"}</th>
                      <th className="p-3">{language === "vi" ? "Số tiền nộp" : "Filing Amount"}</th>
                      <th className="p-3">{language === "vi" ? "Trạng thái nộp" : "Filing Status"}</th>
                      <th className="p-3">{language === "vi" ? "Ghi chú" : "Notes"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          {language === "vi" ? "Chưa có báo cáo thuế nào được ghi nhận." : "No tax reports logged."}
                        </td>
                      </tr>
                    ) : (
                      taxReports.map((t) => (
                        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-bold text-indigo-600">{t.period}</td>
                          <td className="p-3 font-semibold">{t.year}</td>
                          <td className="p-3 font-semibold text-slate-700">{t.tax_type}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{formatMoney(t.amount)}</td>
                          <td className="p-3">
                            {t.status === "submitted" ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                                {language === "vi" ? "Đã nộp thuế" : "Submitted"}
                              </span>
                            ) : (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[10px] animate-pulse">
                                {language === "vi" ? "Chờ nộp" : "Pending"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500">{t.notes || "---"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Budget & Cashflow forecasting */}
          {activeSubTab === "budget" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {language === "vi" ? "Dự phóng dòng tiền & Ngân sách Hoạt động" : "Cashflow Projections & Operational Budgets"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === "vi" 
                      ? "Lập hạn mức chi tiêu cho công ty dựa trên số liệu lịch sử để dự phóng rủi ro."
                      : "Establish expenditure thresholds based on historical records to prevent cash crunches."}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddBudget(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
                >
                  <Plus size={14} />
                  {language === "vi" ? "Thiết lập kế hoạch ngân sách" : "Log New Budget Plan"}
                </button>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-3">{language === "vi" ? "Chu kỳ" : "Period"}</th>
                      <th className="p-3">{language === "vi" ? "Năm" : "Year"}</th>
                      <th className="p-3">{language === "vi" ? "Hạn mức ngân sách" : "Budget Cap"}</th>
                      <th className="p-3">{language === "vi" ? "Doanh thu dự kiến" : "Expected Income"}</th>
                      <th className="p-3">{language === "vi" ? "Chi phí dự kiến" : "Expected Outflow"}</th>
                      <th className="p-3">{language === "vi" ? "Trạng thái cảnh báo" : "Budget Thresholds"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetPlans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          {language === "vi" ? "Chưa thiết lập kế hoạch ngân sách chu kỳ nào." : "No budget plans registered."}
                        </td>
                      </tr>
                    ) : (
                      budgetPlans.map((bp) => (
                        <tr key={bp.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-bold text-indigo-600">{bp.period}</td>
                          <td className="p-3 font-semibold">{bp.year}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{formatMoney(bp.budget_amount)}</td>
                          <td className="p-3 font-mono text-emerald-600">{formatMoney(bp.expected_revenue)}</td>
                          <td className="p-3 font-mono text-rose-600">{formatMoney(bp.expected_expense)}</td>
                          <td className="p-3">
                            {bp.expected_expense > bp.budget_amount ? (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold text-[10px] flex items-center gap-1 w-max">
                                <ShieldAlert size={12} />
                                {language === "vi" ? "Vượt hạn mức chi!" : "Over Budget Limit!"}
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px] flex items-center gap-1 w-max">
                                <CheckCircle2 size={12} />
                                {language === "vi" ? "Trong tầm kiểm soát" : "Safe Limits"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Salary orders list and creation */}
          {activeSubTab === "salary-orders" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {language === "vi" ? "Duyệt chi lương & Thanh toán tự động qua ngân hàng" : "Payroll Batch Payment Orders & Linked Banks"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === "vi" 
                      ? "Lập lệnh chi lương dựa trên bảng lương hàng tháng, phê duyệt và thanh toán tự động qua tài khoản ngân hàng."
                      : "Create automated batch payroll payouts, verify, and complete transfers via direct linked bank accounts."}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddSalaryOrder(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
                >
                  <Landmark size={14} />
                  {language === "vi" ? "Tạo Lệnh Chi Lương Mới" : "New Payroll Order"}
                </button>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-3">{language === "vi" ? "Mã Lệnh" : "Order ID"}</th>
                      <th className="p-3">{language === "vi" ? "Kỳ chi lương" : "Month/Year"}</th>
                      <th className="p-3">{language === "vi" ? "Tổng tiền chi trả" : "Total Outflow"}</th>
                      <th className="p-3">{language === "vi" ? "Người lập" : "Created By"}</th>
                      <th className="p-3">{language === "vi" ? "Trạng thái lệnh" : "Order Status"}</th>
                      <th className="p-3 text-right">{language === "vi" ? "Hành động / Liên kết ngân hàng" : "Transfer Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          {language === "vi" ? "Chưa có lệnh chi trả lương nào được lập." : "No salary payout orders logged."}
                        </td>
                      </tr>
                    ) : (
                      salaryOrders.map((so) => (
                        <tr key={so.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-700">#SAL-{so.id}</td>
                          <td className="p-3 font-bold text-indigo-600">{language === "vi" ? `Tháng ${so.month}/${so.year}` : `${so.month}/${so.year}`}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{formatMoney(so.total_amount)}</td>
                          <td className="p-3 text-slate-500">{so.created_by}</td>
                          <td className="p-3">
                            {so.status === "pending_approval" && (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[10px] animate-pulse">
                                {language === "vi" ? "Chờ phê duyệt" : "Awaiting Approval"}
                              </span>
                            )}
                            {so.status === "approved" && (
                              <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                                {language === "vi" ? "Đã phê duyệt - Chờ chuyển tiền" : "Approved"}
                              </span>
                            )}
                            {so.status === "paid" && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px] flex items-center gap-1 w-max">
                                <CheckCircle2 size={12} />
                                {language === "vi" ? "Đã chi trả tự động" : "Paid Out"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              {so.status === "pending_approval" && (user?.role === "director" || user?.role === "Giám đốc" || user?.role === "admin" || user?.role === "accountant" || user?.role === "Kế toán") && (
                                <button
                                  onClick={() => handleApproveSalaryOrder(so.id)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition text-[10px]"
                                >
                                  {language === "vi" ? "Duyệt chi lương" : "Approve Order"}
                                </button>
                              )}
                              {so.status === "approved" && (
                                <button
                                  onClick={() => handlePaySalaryOrder(so.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1 transition text-[10px]"
                                >
                                  <Landmark size={12} />
                                  {language === "vi" ? "Thực hiện chuyển tiền số" : "Simulate Bank Transfer"}
                                </button>
                              )}
                              {so.status === "paid" && (
                                <span className="text-slate-400 font-mono text-[10px]">{language === "vi" ? "Hạch toán tự động thành công" : "Settled in system"}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Commission & Reward Settings */}
          {activeSubTab === "commissions" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  {language === "vi" ? "Công cụ điều chỉnh tỷ lệ Hoa hồng & Thưởng hoàn thành vụ việc" : "Litigation Staff Commission & Completion Bonus Rates"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {language === "vi" 
                    ? "Tùy chỉnh tỷ lệ % hoa hồng (khi tìm hồ sơ mới) và % thưởng (khi hoàn thành vụ việc) của nhân viên tranh tụng."
                    : "Adjust percentages of finder commissions and case completion bonuses. Computes dynamically on actual case fees."}
                </p>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-3">{language === "vi" ? "Nhân sự" : "Staff Name"}</th>
                      <th className="p-3">{language === "vi" ? "Vai trò" : "Role"}</th>
                      <th className="p-3">{language === "vi" ? "% Hoa hồng mới" : "% Commission Rate"}</th>
                      <th className="p-3">{language === "vi" ? "% Thưởng hoàn thành" : "% Completion Reward"}</th>
                      <th className="p-3">{language === "vi" ? "Tổng hoa hồng tích lũy" : "Dynamic Commission Earned"}</th>
                      <th className="p-3">{language === "vi" ? "Tổng thưởng hoàn thành" : "Dynamic Reward Earned"}</th>
                      <th className="p-3 text-right">{language === "vi" ? "Điều chỉnh" : "Customize"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffCommissions.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{language === "vi" ? `Số vụ phụ trách: ${s.cases?.length || 0}` : `Assigned cases: ${s.cases?.length || 0}`}</div>
                        </td>
                        <td className="p-3 text-slate-600 capitalize">{s.title || s.role}</td>
                        <td className="p-3">
                          {editingStaffId === s.id ? (
                            <input
                              type="number"
                              className="w-16 px-1.5 py-1 border rounded"
                              value={editCommRate}
                              onChange={(e) => setEditCommRate(e.target.value)}
                            />
                          ) : (
                            <span className="font-bold text-indigo-600 font-mono">{s.commission_percent}%</span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingStaffId === s.id ? (
                            <input
                              type="number"
                              className="w-16 px-1.5 py-1 border rounded"
                              value={editBonusRate}
                              onChange={(e) => setEditBonusRate(e.target.value)}
                            />
                          ) : (
                            <span className="font-bold text-indigo-600 font-mono">{s.bonus_completion_percent}%</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-emerald-600 font-bold">{formatMoney(s.earnedCommission)}</td>
                        <td className="p-3 font-mono text-indigo-600 font-bold">{formatMoney(s.earnedCompletionReward)}</td>
                        <td className="p-3 text-right">
                          {editingStaffId === s.id ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleUpdateCommissionConfig(s.id)}
                                className="px-2 py-1 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-500"
                              >
                                {language === "vi" ? "Lưu" : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingStaffId(null)}
                                className="px-2 py-1 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300"
                              >
                                {language === "vi" ? "Hủy" : "Cancel"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStaffId(s.id);
                                setEditCommRate(String(s.commission_percent));
                                setEditBonusRate(String(s.bonus_completion_percent));
                              }}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1 transition text-[10px] ml-auto"
                            >
                              <Settings size={12} />
                              {language === "vi" ? "Cấu hình" : "Config"}
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
        </div>
      </div>

      {/* MODALS */}

      {/* 1. Add Transaction modal */}
      {showAddTx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 font-serif mb-4">
              {language === "vi" ? "Ghi nhận giao dịch tài chính" : "Log Financial Transaction"}
            </h3>
            <form onSubmit={handleCreateTx} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{language === "vi" ? "Phân loại" : "Type"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "thu", category: "Phí dịch vụ" })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${txForm.type === "thu" ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    {language === "vi" ? "Thu (Doanh thu)" : "Thu (Revenue)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: "chi", category: "Chi lương" })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${txForm.type === "chi" ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    {language === "vi" ? "Chi (Lệnh chi/Chi phí)" : "Chi (Expenditure)"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{language === "vi" ? "Số tiền (VNĐ)" : "Amount (VND)"}</label>
                <input
                  type="number"
                  required
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-sm"
                  placeholder="5000000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{language === "vi" ? "Hạng mục" : "Category"}</label>
                <select
                  value={txForm.category}
                  onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm"
                >
                  {txForm.type === "thu" ? (
                    <>
                      <option value="Phí dịch vụ">{language === "vi" ? "Phí dịch vụ pháp lý" : "Legal Services Fees"}</option>
                      <option value="Phí tư vấn">{language === "vi" ? "Phí tư vấn" : "Consulting Fees"}</option>
                      <option value="Thu khác">{language === "vi" ? "Doanh thu khác" : "Other Revenue"}</option>
                    </>
                  ) : (
                    <>
                      <option value="Chi lương">{language === "vi" ? "Chi lương nhân sự" : "Personnel Salary"}</option>
                      <option value="Văn phòng">{language === "vi" ? "Thuê văn phòng" : "Office Rental"}</option>
                      <option value="Mua sắm tài sản">{language === "vi" ? "Mua sắm tài sản cố định" : "Asset Purchase"}</option>
                      <option value="Nghĩa vụ thuế">{language === "vi" ? "Nộp thuế Nhà nước" : "Tax Filing Outflow"}</option>
                      <option value="Chi khác">{language === "vi" ? "Chi phí vận hành khác" : "Other Operating Expense"}</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{language === "vi" ? "Ngày giao dịch" : "Transaction Date"}</label>
                <input
                  type="date"
                  required
                  value={txForm.date}
                  onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{language === "vi" ? "Mô tả cụ thể" : "Description"}</label>
                <textarea
                  required
                  rows={2}
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm resize-none"
                  placeholder={language === "vi" ? "Mô tả nội dung thu chi cụ thể..." : "Specific details of payment..."}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTx(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-md shadow-indigo-600/10"
                >
                  {language === "vi" ? "Xác nhận & Tạo" : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Asset modal */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-800 font-serif mb-4">{language === "vi" ? "Khai báo tài sản công ty" : "Declare Company Asset"}</h3>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Tên tài sản" : "Asset Name"}</label>
                <input
                  type="text"
                  required
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm"
                  placeholder={language === "vi" ? "Ví dụ: Laptop Macbook Pro..." : "e.g., Laptop..."}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Giá trị (VNĐ)" : "Value (VND)"}</label>
                <input
                  type="number"
                  required
                  value={assetForm.value}
                  onChange={(e) => setAssetForm({ ...assetForm, value: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm font-mono"
                  placeholder="25000000"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddAsset(false)} className="w-1/2 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl">{language === "vi" ? "Hủy" : "Cancel"}</button>
                <button type="submit" className="w-1/2 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl">{language === "vi" ? "Khai báo" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Debt modal */}
      {showAddDebt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-800 font-serif mb-4">{language === "vi" ? "Ghi nhận công nợ mới" : "Log New Debt"}</h3>
            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Đối tượng đối tác" : "Debtor / Creditor Name"}</label>
                <input
                  type="text"
                  required
                  value={debtForm.debtor_name}
                  onChange={(e) => setDebtForm({ ...debtForm, debtor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder={language === "vi" ? "Nguyễn Văn A" : "Partner Name"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Phân loại nợ" : "Debt Type"}</label>
                <select
                  value={debtForm.type}
                  onChange={(e) => setDebtForm({ ...debtForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="phai_thu">{language === "vi" ? "Phải thu (Khách hàng nợ tiền)" : "Receivable (Clients owe us)"}</option>
                  <option value="phai_tra">{language === "vi" ? "Phải trả (Doanh nghiệp nợ đối tác)" : "Payable (We owe partners)"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Số tiền nợ (VNĐ)" : "Debt Amount"}</label>
                <input
                  type="number"
                  required
                  value={debtForm.amount}
                  onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddDebt(false)} className="w-1/2 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl">{language === "vi" ? "Hủy" : "Cancel"}</button>
                <button type="submit" className="w-1/2 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl">{language === "vi" ? "Lưu" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Tax report modal */}
      {showAddTax && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-800 font-serif mb-4">{language === "vi" ? "Khai báo nghĩa vụ báo cáo thuế" : "Declare Tax Filing"}</h3>
            <form onSubmit={handleCreateTax} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Kỳ báo cáo" : "Reporting Period"}</label>
                <input
                  type="text"
                  required
                  value={taxForm.period}
                  onChange={(e) => setTaxForm({ ...taxForm, period: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Quý 3"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Loại thuế" : "Tax Type"}</label>
                <select
                  value={taxForm.tax_type}
                  onChange={(e) => setTaxForm({ ...taxForm, tax_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="Thuế GTGT (VAT)">{language === "vi" ? "Thuế GTGT (VAT)" : "Value Added Tax (VAT)"}</option>
                  <option value="Thuế TNDN (CIT)">{language === "vi" ? "Thuế Thu nhập Doanh nghiệp" : "Corporate Income Tax (CIT)"}</option>
                  <option value="Thuế TNCN (PIT)">{language === "vi" ? "Thuế Thu nhập Cá nhân" : "Personal Income Tax (PIT)"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Số tiền nộp (VNĐ)" : "Filing Amount"}</label>
                <input
                  type="number"
                  required
                  value={taxForm.amount}
                  onChange={(e) => setTaxForm({ ...taxForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddTax(false)} className="w-1/2 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl">{language === "vi" ? "Hủy" : "Cancel"}</button>
                <button type="submit" className="w-1/2 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl">{language === "vi" ? "Khai báo" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Budget modal */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-800 font-serif mb-4">{language === "vi" ? "Kế hoạch ngân sách chu kỳ" : "Set New Budget Plan"}</h3>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Kỳ kế hoạch" : "Period"}</label>
                <input
                  type="text"
                  required
                  value={budgetForm.period}
                  onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Tháng 8"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Hạn mức ngân sách tối đa" : "Budget Limit Cap"}</label>
                <input
                  type="number"
                  required
                  value={budgetForm.budget_amount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, budget_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Chi phí chi tiêu dự kiến" : "Expected Expenses"}</label>
                <input
                  type="number"
                  required
                  value={budgetForm.expected_expense}
                  onChange={(e) => setBudgetForm({ ...budgetForm, expected_expense: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddBudget(false)} className="w-1/2 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl">{language === "vi" ? "Hủy" : "Cancel"}</button>
                <button type="submit" className="w-1/2 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl">{language === "vi" ? "Lưu" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add Salary Order modal (Automated Batch tool) */}
      {showAddSalaryOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-slate-800 font-serif mb-2">
              {language === "vi" ? "Lập lệnh chi lương tự động định kỳ" : "Automated Periodic Salary Run Creator"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === "vi" 
                ? "Hệ thống sẽ đồng bộ trực tiếp từ bảng tính lương đã được phê duyệt để lập lệnh chi trả đồng loạt."
                : "Synchronizes calculations from computed payroll registries to schedule automated payout transfers."}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Tháng chi lương" : "Month"}</label>
                  <select
                    value={selectedSalaryMonth}
                    onChange={(e) => setSelectedSalaryMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={String(m)}>{language === "vi" ? `Tháng ${m}` : `Month ${m}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{language === "vi" ? "Năm" : "Year"}</label>
                  <select
                    value={selectedSalaryYear}
                    onChange={(e) => setSelectedSalaryYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              {/* Show preview matching payroll count */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{language === "vi" ? "Số nhân sự khả dụng:" : "Available employees:"}</span>
                <span className="font-bold text-indigo-600 font-mono">
                  {payrolls.filter(p => p.month === Number(selectedSalaryMonth) && p.year === Number(selectedSalaryYear)).length}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSalaryOrder(false)}
                  className="w-1/2 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleCreateSalaryOrder}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-md shadow-indigo-600/10"
                >
                  {language === "vi" ? "Khởi tạo lệnh" : "Generate Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
