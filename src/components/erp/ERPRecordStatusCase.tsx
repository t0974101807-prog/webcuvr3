import React from "react";
import DatePickerInput from "../DatePickerInput";
import { Combobox } from "./ERPFormControls";

export type ERPRecordStatusCaseProps = {
  formData: any;
  setFormData: (value: any) => void;
  STATUS_OPTIONS: string[];
};

export default function ERPRecordStatusCase({
  formData,
  setFormData,
  STATUS_OPTIONS,
}: ERPRecordStatusCaseProps) {
  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] border-b border-slate-300 pb-2 uppercase">
        Tình trạng hồ sơ
      </h3>

      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700">Nộp tạm ứng án phí</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ngày nhận TB</label>
            <DatePickerInput
              value={formData.feeNoticeDate}
              onChange={(val: string) => setFormData({ ...formData, feeNoticeDate: val })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ngày nộp TB</label>
            <DatePickerInput
              value={formData.feeSubmitDate}
              onChange={(val: string) => setFormData({ ...formData, feeSubmitDate: val })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Số tiền TUAP</label>
            <input
              type="text"
              value={formData.tuapAmount}
              onChange={(e) => {
                let rawValue = e.target.value.replace(/,/g, "");
                rawValue = rawValue.replace(/^0+(?=\d)/, "");
                if (/^\d*$/.test(rawValue)) {
                  setFormData({
                    ...formData,
                    tuapAmount: rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                  });
                }
              }}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ghi chú</label>
            <input
              type="text"
              value={formData.feeNote}
              onChange={(e) => setFormData({ ...formData, feeNote: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
