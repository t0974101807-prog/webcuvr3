import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, RefreshCw, Save, Shield, Users, X } from "lucide-react";
import { fetchApi } from "../utils/api";

const ROLES = ["admin", "director", "deputyDirector", "controller", "head_of_department", "manager", "prosecutor", "lawyer", "specialist", "legal_associate", "accountant", "editor", "traineeLawyer", "intern", "consultant", "uploader", "user"];
const PERMISSIONS = [
  ["manageUsers", "Quản lý người dùng"], ["manageWeb", "Quản lý nội dung Web"], ["manageEvents", "Quản lý sự kiện"],
  ["manageFinance", "Quản lý tài chính"], ["manageLegalDocs", "Quản lý văn bản PL"], ["editPersonalRecords", "Sửa hồ sơ cá nhân"],
  ["editAllRecords", "Sửa tất cả hồ sơ"], ["viewReports", "Xem báo cáo"], ["viewPersonalRecords", "Xem hồ sơ cá nhân"],
  ["viewEventHistory", "Xem lịch sử sự kiện"], ["viewAllRecords", "Xem tất cả hồ sơ"], ["deleteRecords", "Xóa hồ sơ"],
] as const;
const LABELS: Record<string, string> = { admin: "Quản trị viên", director: "Giám đốc", deputyDirector: "Phó giám đốc", controller: "Kiểm soát viên", head_of_department: "Trưởng phòng", manager: "Quản lý", prosecutor: "Kiểm soát chất lượng", lawyer: "Luật sư", specialist: "Chuyên viên pháp lý", legal_associate: "Trợ lý pháp lý", accountant: "Kế toán", editor: "Biên tập viên", traineeLawyer: "Luật sư Tập sự", intern: "Thực tập sinh", consultant: "Nhân viên tư vấn", uploader: "IT - Quản trị hồ sơ", user: "Người dùng" };
const DESCRIPTIONS: Record<string, string> = { admin: "Toàn quyền kiểm soát hệ thống", director: "Quản lý tổng thể, xem báo cáo và duyệt hồ sơ", controller: "Kiểm soát viên điều hành toàn bộ hệ thống", head_of_department: "Quản lý phòng ban, phê duyệt và điều phối công việc", manager: "Quản lý hoạt động bộ phận, phân công công việc", lawyer: "Luật sư", specialist: "Chuyên viên pháp lý", accountant: "Kế toán", prosecutor: "Kiểm soát chất lượng văn bản pháp lý" };

type PermissionMap = Record<string, Record<string, boolean>>;
const blank = () => Object.fromEntries(PERMISSIONS.map(([key]) => [key, false]));

export default function RolePermissionsMatrix() {
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetchApi("/api/permissions");
      if (!response.ok) throw new Error("Không thể tải ma trận phân quyền.");
      const data = await response.json();
      setPermissions(Object.fromEntries(ROLES.map(role => [role, { ...blank(), ...(data[role] || {}) }] )));
    } catch (err: any) { setError(err.message || "Không thể tải phân quyền."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const rows = useMemo(() => ROLES.map(role => ({ role, label: LABELS[role], description: DESCRIPTIONS[role] || LABELS[role] })), []);
  const toggle = (role: string, permission: string) => { if (role === "admin") return; setPermissions(current => ({ ...current, [role]: { ...current[role], [permission]: !current[role]?.[permission] } })); setMessage(""); };
  const save = async () => {
    setSaving(true); setMessage(""); setError("");
    try { const response = await fetchApi("/api/permissions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(permissions) }); if (!response.ok) throw new Error("Không thể lưu cấu hình phân quyền."); setMessage("Đã lưu phân quyền theo chức danh."); window.dispatchEvent(new CustomEvent("permissions_updated")); }
    catch (err: any) { setError(err.message || "Không thể lưu phân quyền."); }
    finally { setSaving(false); }
  };
  if (loading) return <div className="p-10 text-center text-slate-500"><RefreshCw className="animate-spin mx-auto mb-3 text-blue-600" size={28} />Đang tải ma trận phân quyền...</div>;
  if (error && !Object.keys(permissions).length) return <div className="p-8 text-center bg-white border border-slate-200 rounded-xl"><AlertCircle className="mx-auto mb-3 text-amber-500" size={28} /><p className="text-sm text-slate-600 mb-4">{error}</p><button onClick={load} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">Thử lại</button></div>;
  return <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Shield size={24} /></div><div><h3 className="text-xl font-bold text-slate-800">Trung tâm Phân quyền & Quản lý Truy cập</h3><p className="text-xs text-slate-500 mt-1">Tích chọn quyền theo chức danh; cấu hình được lưu trực tiếp vào backend.</p></div></div><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm disabled:opacity-50"><Save size={16} />{saving ? "Đang lưu..." : "Lưu cấu hình"}</button></div>
    {message && <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">{message}</div>}{error && <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">{error}</div>}
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-5 border-b border-slate-200 flex items-center gap-3"><Users size={20} className="text-slate-600" /><h4 className="text-lg font-bold text-slate-800">Phân quyền theo chức danh</h4></div><div className="overflow-auto max-h-[70vh]"><table className="w-full min-w-max text-left text-sm border-collapse"><thead className="sticky top-0 z-20 bg-white"><tr className="shadow-sm"><th className="sticky left-0 z-30 bg-slate-50 px-5 py-4 w-48 min-w-48 text-xs font-bold text-slate-700">Vai trò</th><th className="sticky left-48 z-30 bg-slate-50 px-5 py-4 w-64 min-w-64 text-xs font-bold text-slate-700">Mô tả</th>{PERMISSIONS.map(([, label]) => <th key={label} className="px-2 py-4 min-w-28 max-w-32 text-center text-[10px] font-bold text-slate-700 border-l border-slate-100">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{rows.map(({ role, label, description }) => <tr key={role} className="group hover:bg-slate-50/60"><td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-5 py-5 font-bold text-slate-800 shadow-[inset_-1px_0_0_#e2e8f0]">{label}</td><td className="sticky left-48 z-10 bg-white group-hover:bg-slate-50 px-5 py-5 text-xs text-slate-600 shadow-[inset_-1px_0_0_#e2e8f0]">{description}</td>{PERMISSIONS.map(([key]) => <td key={key} className="px-2 py-5 text-center border-l border-slate-100"><button disabled={role === "admin"} onClick={() => toggle(role, key)} title={role === "admin" ? "Quản trị viên luôn có toàn quyền" : "Đổi quyền"} className="focus:outline-none disabled:cursor-not-allowed">{permissions[role]?.[key] ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-500 text-emerald-600 bg-emerald-50"><Check size={14} strokeWidth={3} /></span> : <span className="inline-flex items-center justify-center w-6 h-6 text-slate-300"><X size={18} /></span>}</button></td>)}</tr>)}</tbody></table></div></div>
    <p className="text-xs text-slate-500">Quản trị viên luôn có toàn quyền ở backend. Các lựa chọn còn lại áp dụng cho các API sử dụng permission tương ứng.</p>
  </div>;
}
