import React from "react";
import { Combobox } from "./ERPFormControls";

export type ERPRecordWorkContentProps = {
  formData: any;
  setFormData: (value: any) => void;
  dynamicAssigneeOptions: any[];
  STATUS_OPTIONS: string[];
};

export default function ERPRecordWorkContent({
  formData,
  setFormData,
  dynamicAssigneeOptions,
  STATUS_OPTIONS,
}: ERPRecordWorkContentProps) {
  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] border-b border-slate-300 pb-2 uppercase">
        Nội dung làm việc
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nhân viên UQ 1</label>
          <Combobox
            value={formData.authStaff1}
            onChange={(val) => setFormData({ ...formData, authStaff1: val })}
            options={dynamicAssigneeOptions}
            placeholder="Chọn hoặc nhập nhân viên..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Tòa án khu vực</label>
          <input
            type="text"
            value={formData.courtRegion || ""}
            onChange={(e) => setFormData({ ...formData, courtRegion: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Nhập mô tả tòa án khu vực..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nhân viên UQ 2</label>
          <Combobox
            value={formData.authStaff2}
            onChange={(val) => setFormData({ ...formData, authStaff2: val })}
            options={dynamicAssigneeOptions}
            placeholder="Chọn hoặc nhập nhân viên..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Trạng thái HS</label>
          <Combobox
            value={formData.workStatus}
            onChange={(val) => setFormData({ ...formData, workStatus: val })}
            options={STATUS_OPTIONS}
            placeholder="Chọn hoặc nhập trạng thái..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nhân viên UQ 3</label>
          <Combobox
            value={formData.authStaff3}
            onChange={(val) => setFormData({ ...formData, authStaff3: val })}
            options={dynamicAssigneeOptions}
            placeholder="Chọn hoặc nhập nhân viên..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Link hồ sơ (NAS)</label>
          <input
            type="text"
            value={formData.nasLink}
            onChange={(e) => setFormData({ ...formData, nasLink: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Ngày l.việc gần nhất</label>
          <input
            type="date"
            value={formData.lastWorkDate || ""}
            onChange={(e) => setFormData({ ...formData, lastWorkDate: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
