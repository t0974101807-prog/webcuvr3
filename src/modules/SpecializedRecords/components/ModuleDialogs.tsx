import React, { useState, useEffect } from "react";
import { getModuleByActiveTab } from "../../../config/modules";
import { RecordItem } from "../repository/SpecializedRecordsRepository";

interface ModuleDialogsProps {
  activeModule: string;
  language: "vi" | "en";
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  users: any[];
  offices?: any[];
  currentUser: any;
  onCreateRecord: (formData: RecordItem) => void;
  editingRecord?: any | null;
  setEditingRecord?: (rec: any | null) => void;
  onUpdateRecord?: (formData: RecordItem) => void;
}

export const ModuleDialogs: React.FC<ModuleDialogsProps> = ({
  activeModule,
  language,
  showAddModal,
  setShowAddModal,
  users = [],
  offices = [],
  currentUser,
  onCreateRecord,
  editingRecord = null,
  setEditingRecord,
  onUpdateRecord,
}) => {
  const moduleConfig = getModuleByActiveTab(activeModule);
  const isOpen = showAddModal || !!editingRecord;

  const [formValues, setFormValues] = useState<any>({});

  // Reset form when modal state or editing record changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingRecord) {
      setFormValues({
        contractId: editingRecord.contractId || "",
        client: editingRecord.client || "",
        clientPhone: editingRecord.clientPhone || "",
        address: editingRecord.address || "",
        dob: editingRecord.dob || "",
        gender: editingRecord.gender || "Nam",
        overdueAmount: editingRecord.overdueAmount || 0,
        liquidationAmount: editingRecord.liquidationAmount || 0,
        loanStatus: editingRecord.loanStatus || "",
        mainAssignee: editingRecord.mainAssignee || "",
        branch: editingRecord.branch || "",
        status: editingRecord.status || "Mới tiếp nhận",
        description: editingRecord.description || "",
        date: editingRecord.date || new Date().toISOString().split("T")[0],
      });
    } else {
      // Add flow defaults
      setFormValues({
        contractId: `930${Math.floor(Math.random() * 900000000000000 + 100000000000000)}`,
        client: "",
        clientPhone: "",
        address: "",
        dob: "15/06/1990",
        gender: "Nam",
        overdueAmount: 0,
        liquidationAmount: 0,
        loanStatus: "null",
        mainAssignee: currentUser?.name || "",
        branch: "",
        status: "Mới tiếp nhận",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [activeModule, showAddModal, editingRecord, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleInputChange = (fieldName: string, value: any) => {
    setFormValues((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleClose = () => {
    setShowAddModal(false);
    if (setEditingRecord) {
      setEditingRecord(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.client) {
      alert(language === "vi" ? "Vui lòng nhập tên khách hàng!" : "Please enter customer name!");
      return;
    }

    const payload: RecordItem = {
      id: editingRecord ? editingRecord.id : (Date.now().toString() + Math.floor(Math.random() * 1000)),
      contractId: formValues.contractId || `930${Math.floor(Math.random() * 900000000000000 + 100000000000000)}`,
      client: formValues.client,
      clientPhone: formValues.clientPhone,
      address: formValues.address || "null",
      dob: formValues.dob || "15/06/1990",
      gender: formValues.gender || "Nam",
      overdueAmount: formValues.overdueAmount !== undefined ? Number(formValues.overdueAmount) : 0,
      liquidationAmount: formValues.liquidationAmount !== undefined ? Number(formValues.liquidationAmount) : 0,
      loanStatus: formValues.loanStatus || "null",
      feeAmount: formValues.liquidationAmount || 0,
      status: formValues.status || "Mới tiếp nhận",
      mainAssignee: formValues.mainAssignee || currentUser?.name || "",
      branch: formValues.branch || currentUser?.branch || "",
      createdBy: editingRecord ? (editingRecord.createdBy || "Hệ thống") : (currentUser?.name || currentUser?.username || "Hệ thống"),
      description: formValues.description || "",
      date: formValues.date || new Date().toISOString().split("T")[0],
      practice_area: activeModule,
      category: moduleConfig.category,
    };

    if (editingRecord) {
      if (onUpdateRecord) {
        onUpdateRecord(payload);
      }
    } else {
      onCreateRecord(payload);
    }
    handleClose();
  };

  const isEditMode = !!editingRecord;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        <div className="bg-[var(--color-primary)] dark:bg-[var(--color-primary-light)] text-white p-6 flex justify-between items-center border-b border-white/10">
          <div>
            <h3 className="font-bold text-lg">
              {isEditMode 
                ? (language === "vi" ? "Chỉnh sửa hồ sơ chuyên môn" : "Edit Specialized Dossier")
                : (language === "vi" ? "Thêm hồ sơ chuyên môn" : "Add Specialized Dossier")}
            </h3>
            <p className="text-[10px] text-white/70 mt-1">
              {language === "vi" ? moduleConfig.nameVi : moduleConfig.nameEn}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
            
            {/* 1. Số HĐ */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Số HĐ / Mã hồ sơ" : "Contract ID"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formValues.contractId || ""}
                onChange={(e) => handleInputChange("contractId", e.target.value)}
                placeholder="Ví dụ: 930370005598406000"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 2. Tên KH */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Tên khách hàng" : "Customer Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formValues.client || ""}
                onChange={(e) => handleInputChange("client", e.target.value)}
                placeholder="Ví dụ: NGUYEN VAN A"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 3. Điện thoại KH */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Điện thoại khách hàng" : "Phone"}
              </label>
              <input
                type="text"
                value={formValues.clientPhone || ""}
                onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                placeholder="Ví dụ: 0984441771"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 4. Địa chỉ */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Địa chỉ" : "Address"}
              </label>
              <input
                type="text"
                value={formValues.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Ví dụ: Hà Nội"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 5. Ngày sinh */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Ngày sinh" : "DOB"}
              </label>
              <input
                type="text"
                value={formValues.dob || ""}
                onChange={(e) => handleInputChange("dob", e.target.value)}
                placeholder="Ví dụ: 01/04/1992"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 6. Giới tính */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Giới tính" : "Gender"}
              </label>
              <select
                value={formValues.gender || "Nam"}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              >
                <option value="Nam">{language === "vi" ? "Nam" : "Male"}</option>
                <option value="Nữ">{language === "vi" ? "Nữ" : "Female"}</option>
              </select>
            </div>

            {/* 7. Số tiền quá hạn */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Số tiền quá hạn (VND)" : "Overdue Amount"}
              </label>
              <input
                type="number"
                value={formValues.overdueAmount !== undefined ? formValues.overdueAmount : 0}
                onChange={(e) => handleInputChange("overdueAmount", Number(e.target.value))}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 8. Số tiền thanh lý */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Số tiền thanh lý / Phí thanh lý (VND)" : "Liquidation Amount"}
              </label>
              <input
                type="number"
                value={formValues.liquidationAmount !== undefined ? formValues.liquidationAmount : 0}
                onChange={(e) => handleInputChange("liquidationAmount", Number(e.target.value))}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 9. Tình trạng khoản vay */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Tình trạng khoản vay" : "Loan Status"}
              </label>
              <input
                type="text"
                value={formValues.loanStatus || ""}
                onChange={(e) => handleInputChange("loanStatus", e.target.value)}
                placeholder="Ví dụ: Quá hạn nhóm 5, Đã thanh lý, v.v."
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 10. Người phụ trách */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Người phụ trách" : "Assignee"}
              </label>
              <select
                value={formValues.mainAssignee || ""}
                onChange={(e) => handleInputChange("mainAssignee", e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              >
                <option value="">
                  {language === "vi" ? "-- Chọn nhân sự --" : "-- Select Staff --"}
                </option>
                {users
                  .filter((u: any) => u.role !== "client" && u.role !== "partner" && u.name)
                  .map((u: any) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.title || "Nhân viên"})
                    </option>
                  ))
                }
              </select>
            </div>

            {/* 10.5 Chi nhánh */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Chi nhánh" : "Branch"}
              </label>
              <select
                value={formValues.branch || ""}
                onChange={(e) => handleInputChange("branch", e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              >
                <option value="">
                  {language === "vi" ? "-- Chọn chi nhánh --" : "-- Select Branch --"}
                </option>
                {offices.map((off: any) => (
                  <option key={off.id} value={off.name}>
                    {off.name}
                  </option>
                ))}
                {offices.length === 0 && (
                  <>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  </>
                )}
              </select>
            </div>

            {/* 11. Trạng thái */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Trạng thái" : "Status"}
              </label>
              <select
                value={formValues.status || "Mới tiếp nhận"}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              >
                {moduleConfig.statuses?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {language === "vi" ? opt.labelVi : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 12. Ngày tiếp nhận */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Ngày tiếp nhận" : "Date Received"}
              </label>
              <input
                type="date"
                value={formValues.date || ""}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition"
              />
            </div>

            {/* 13. Mô tả */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === "vi" ? "Mô tả / Nội dung tóm tắt" : "Description / Summary"}
              </label>
              <textarea
                rows={3}
                value={formValues.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={language === "vi" ? "Mô tả ngắn gọn nội dung vụ việc..." : "Brief description..."}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none transition"
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              {language === "vi" ? "Hủy bỏ" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] dark:bg-[var(--color-accent)] dark:hover:bg-[var(--color-accent-hover)] dark:text-slate-950 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              {isEditMode 
                ? (language === "vi" ? "Cập nhật hồ sơ" : "Update Record")
                : (language === "vi" ? "Tạo hồ sơ" : "Create Record")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
