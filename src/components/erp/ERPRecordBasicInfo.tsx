import React from "react";
import DatePickerInput from "../DatePickerInput";
import { Combobox } from "../erp/ERPFormControls";

type ComboboxOption = string | { label: string; value: string };

export type ERPRecordBasicInfoProps = {
  formData: any;
  setFormData: (value: any) => void;
  caseTypes: string[];
  globalRecordTypes: any[];
  dynamicBranchOptions: string[];
  dynamicManagerOptions: ComboboxOption[];
  dynamicAssigneeOptions: ComboboxOption[];
  STATUS_OPTIONS: string[];
  PRIORITY_OPTIONS: string[];
  ROLE_OPTIONS: string[];
  GENDER_OPTIONS: string[];
  records: any[];
  editingRecord: any;
};

export default function ERPRecordBasicInfo({
  formData,
  setFormData,
  caseTypes,
  globalRecordTypes,
  dynamicBranchOptions,
  dynamicManagerOptions,
  dynamicAssigneeOptions,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  ROLE_OPTIONS,
  GENDER_OPTIONS,
  records,
  editingRecord,
}: ERPRecordBasicInfoProps) {
  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] border-b border-slate-300 pb-2 uppercase">
          Thông tin chung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Tiêu đề</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Mã hồ sơ (Tự động)</label>
            <input
              type="text"
              value={formData.id}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Lĩnh vực (Vụ việc)</label>
            <Combobox
              value={formData.caseType}
              onChange={(val) => setFormData({ ...formData, caseType: val })}
              options={caseTypes}
              placeholder="Chọn hoặc nhập lĩnh vực..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Loại hồ sơ</label>
            <Combobox
              value={formData.category}
              onChange={(val) => {
                const getCategoryPrefix = (cat: string) => {
                  if (globalRecordTypes && globalRecordTypes.length > 0) {
                    const match = globalRecordTypes.find((rt) => rt.type_name === cat);
                    if (match) return match.type_code;
                  }
                  switch (cat) {
                    case "Hình sự":
                      return "HS";
                    case "Dân sự":
                      return "DS";
                    case "Tư vấn":
                    case "Tư vấn pháp luật":
                      return "TV";
                    case "Hôn nhân Gia đình":
                    case "Hôn nhân & Gia đình":
                      return "HNGĐ";
                    case "Kinh doanh Thương mại":
                    case "Kinh doanh & Thương mại":
                      return "KDTM";
                    case "Hành chính":
                      return "HC";
                    case "Lao động":
                      return "LĐ";
                    case "Đất đai":
                    case "Đất đai & Bất động sản":
                      return "ĐĐ";
                    case "Doanh nghiệp":
                    case "Doanh nghiệp & Đầu tư":
                      return "DN";
                    default:
                      return "K";
                  }
                };

                const prefix = getCategoryPrefix(val);
                if (!editingRecord) {
                  const year = new Date().getFullYear();
                  const stt = String(records.length + 1).padStart(3, "0");
                  setFormData({ ...formData, category: val, id: `${prefix}-${year}-${stt}` });
                } else {
                  const parts = formData.id?.split("-");
                  let newId = `${prefix}-${new Date().getFullYear()}-001`;
                  if (parts && parts.length >= 2) {
                    parts[0] = prefix;
                    newId = parts.join("-");
                  }
                  setFormData({ ...formData, category: val, id: newId });
                }
              }}
              options={globalRecordTypes && globalRecordTypes.length > 0 ? globalRecordTypes.map((rt) => rt.type_name) : ["Hình sự", "Dân sự", "Tư vấn", "Doanh nghiệp", "Đất đai", "Hành chính", "Lao động"]}
              placeholder="Chọn hoặc nhập loại vụ việc..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Mã hệ thống</label>
            <input
              type="text"
              value={formData.systemId}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Chi nhánh</label>
            <Combobox
              value={formData.branch}
              onChange={(val) => setFormData({ ...formData, branch: val })}
              options={dynamicBranchOptions}
              placeholder="Chọn chi nhánh..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Quản lý</label>
            <Combobox
              value={formData.manager}
              onChange={(val) => setFormData({ ...formData, manager: val })}
              options={dynamicManagerOptions}
              placeholder="Chọn hoặc nhập quản lý..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Chức danh</label>
            <Combobox
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val })}
              options={ROLE_OPTIONS}
              placeholder="Chọn hoặc nhập chức danh..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">NV phụ trách</label>
            <Combobox
              value={formData.mainAssignee}
              onChange={(val) => setFormData({ ...formData, mainAssignee: val })}
              options={dynamicAssigneeOptions}
              placeholder="Chọn hoặc nhập nhân viên..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tình trạng</label>
            <Combobox
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              options={STATUS_OPTIONS}
              placeholder="Chọn hoặc nhập tình trạng..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Mức độ ưu tiên</label>
            <Combobox
              value={formData.priority}
              onChange={(val) => setFormData({ ...formData, priority: val })}
              options={PRIORITY_OPTIONS}
              placeholder="Chọn hoặc nhập mức độ ưu tiên..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Hạn chót</label>
            <DatePickerInput
              value={formData.deadline}
              onChange={(val: string) => setFormData({ ...formData, deadline: val })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tòa án</label>
            <input
              type="text"
              value={formData.courtRegion || ""}
              onChange={(e) => setFormData({ ...formData, courtRegion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Nhập mô tả tòa án..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Địa chỉ của Tòa án</label>
            <input
              type="text"
              value={formData.courtAddress || ""}
              onChange={(e) => setFormData({ ...formData, courtAddress: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Nhập địa chỉ của tòa án..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Nội dung vụ việc</label>
            <textarea
              value={formData.caseDescription || ""}
              onChange={(e) => setFormData({ ...formData, caseDescription: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Nhập mô tả chi tiết vụ án..."
            ></textarea>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] border-b border-slate-300 pb-2 uppercase">
          Thông tin khách hàng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Họ và tên</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Giới tính</label>
            <Combobox
              value={formData.clientGender}
              onChange={(val) => setFormData({ ...formData, clientGender: val })}
              options={GENDER_OPTIONS}
              placeholder="Chọn hoặc nhập giới tính..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ngày sinh</label>
            <DatePickerInput
              value={formData.clientDob}
              onChange={(val: string) => setFormData({ ...formData, clientDob: val })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
            <input
              type="text"
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Số CMND/CCCD</label>
            <input
              type="text"
              value={formData.clientIdCard}
              onChange={(e) => setFormData({ ...formData, clientIdCard: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ngày cấp</label>
            <DatePickerInput
              value={formData.clientIdDate}
              onChange={(val: string) => setFormData({ ...formData, clientIdDate: val })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Địa chỉ thường trú</label>
            <input
              type="text"
              value={formData.clientAddress}
              onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Nhập địa chỉ thường trú..."
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Địa chỉ tạm trú</label>
            <input
              type="text"
              value={formData.clientTempAddress}
              onChange={(e) => setFormData({ ...formData, clientTempAddress: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Nhập địa chỉ tạm trú (nếu có)..."
            />
          </div>
        </div>
      </div>
    </>
  );
}
