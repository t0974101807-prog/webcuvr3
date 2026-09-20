import React from "react";
import { Eye, Settings } from "lucide-react";
import DatePickerInput from "../DatePickerInput";
import { Combobox } from "./ERPFormControls";

export type ERPRecordContractInfoProps = {
  formData: any;
  setFormData: (value: any) => void;
  dynamicUserAccountOptions: any[];
  dynamicAssigneeOptions: any[];
  records: any[];
  setSelectedContractType: React.Dispatch<React.SetStateAction<"HĐDVPL" | "HĐUQ" | null>>;
  setShowContractDetailsModal: (value: boolean) => void;
};

export default function ERPRecordContractInfo({
  formData,
  setFormData,
  dynamicUserAccountOptions,
  dynamicAssigneeOptions,
  records,
  setSelectedContractType,
  setShowContractDetailsModal,
}: ERPRecordContractInfoProps) {
  return (
    <div className="space-y-4 mt-8">
      <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] border-b border-slate-300 pb-2 uppercase">
        Thông tin hợp đồng
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Mã HĐ chính (HĐDVPL)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={formData.contractId}
                readOnly
                disabled
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                placeholder="Tự động tạo (STT/năm/HĐDVPL)"
              />
              {formData.contractId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContractType("HĐDVPL");
                    setShowContractDetailsModal(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:bg-clip-text transition-all duration-300 active:scale-95"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              disabled={!!formData.contractId}
              onClick={() => {
                const year = new Date().getFullYear();
                let maxStt = 0;
                records.forEach((r) => {
                  if (r.contractId && r.contractId.includes("/HĐDVPL")) {
                    const num = parseInt(r.contractId.split("/")[0], 10);
                    if (!isNaN(num) && num > maxStt) maxStt = num;
                  }
                });
                const stt = (maxStt + 1).toString().padStart(3, "0");
                setFormData({
                  ...formData,
                  contractId: `${stt}/${year}/HĐDVPL`,
                });
              }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300 active:scale-95 ${formData.contractId ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-50 text-blue-600 transition-all duration-300 hover:bg-blue-100"}`}
            >
              Tạo mã
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Mã HĐ ủy quyền (HĐUQ)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={formData.authContractId || ""}
                readOnly
                disabled
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                placeholder="Tự động tạo (STT/năm/HĐUQ)"
              />
              {formData.authContractId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContractType("HĐUQ");
                    setShowContractDetailsModal(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:bg-clip-text transition-all duration-300 active:scale-95"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              disabled={!!formData.authContractId}
              onClick={() => {
                const year = new Date().getFullYear();
                let maxStt = 0;
                records.forEach((r) => {
                  if (r.authContractId && r.authContractId.includes("/HĐUQ")) {
                    const num = parseInt(r.authContractId.split("/")[0], 10);
                    if (!isNaN(num) && num > maxStt) maxStt = num;
                  }
                });
                const stt = (maxStt + 1).toString().padStart(3, "0");
                setFormData({
                  ...formData,
                  authContractId: `${stt}/${year}/HĐUQ`,
                });
              }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300 active:scale-95 ${formData.authContractId ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-50 text-blue-600 transition-all duration-300 hover:bg-blue-100"}`}
            >
              Tạo mã
            </button>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">User</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Combobox
                value={formData.userEA}
                onChange={(val) => setFormData({ ...formData, userEA: val })}
                options={dynamicUserAccountOptions}
                placeholder="Chọn tài khoản..."
              />
            </div>
            <button
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 transition-all duration-300 hover:bg-blue-100 transition-all duration-300 active:scale-95 flex items-center gap-2"
              title="Công cụ hỗ trợ"
            >
              <Settings size={18} />
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Chỉ tài khoản được giao mới thấy thông tin hồ sơ này.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Tổng giá trị hợp đồng
          </label>
          <input
            type="text"
            value={formData.feeAmount || ""}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              const formatted = val ? parseInt(val).toLocaleString("vi-VN") : "";
              setFormData({
                ...formData,
                feeAmount: formatted,
                baseFeeAmount: formatted,
                vatIncluded: "Đã bao gồm",
                vatPercent: "",
              });
            }}
            className="w-full px-3 py-2 border rounded-lg font-medium text-slate-900"
            placeholder="Nhập số tiền..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Thanh toán đợt 1
          </label>
          <input
            type="text"
            value={formData.paymentInstallment1 || ""}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              const formatted = val ? parseInt(val).toLocaleString("vi-VN") : "";
              setFormData({
                ...formData,
                paymentInstallment1: formatted,
              });
            }}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Nhập số tiền..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Thanh toán đợt 2
          </label>
          <input
            type="text"
            value={formData.paymentInstallment2 || ""}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              const formatted = val ? parseInt(val).toLocaleString("vi-VN") : "";
              setFormData({
                ...formData,
                paymentInstallment2: formatted,
              });
            }}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Nhập số tiền..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Còn lại (Tự động tính)
          </label>
          <input
            type="text"
            value={formData.remainingPayment || "0"}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-semibold text-slate-700 cursor-not-allowed"
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Ngày thanh toán
          </label>
          <DatePickerInput
            value={formData.paymentDate}
            onChange={(val: string) => setFormData({ ...formData, paymentDate: val })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Phương thức thanh toán
          </label>
          <Combobox
            value={formData.paymentMethod}
            onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
            options={["Tiền mặt", "Chuyển khoản"]}
            placeholder="Chọn phương thức..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Giá trị hợp đồng đã bao gồm VAT chưa?
          </label>
          <Combobox
            value={formData.vatIncluded || "Đã bao gồm"}
            onChange={(val) => {
              if (val === "Đã bao gồm") {
                setFormData({
                  ...formData,
                  vatIncluded: val,
                  vatPercent: "",
                  feeAmount: formData.baseFeeAmount || formData.feeAmount,
                });
              } else {
                setFormData({
                  ...formData,
                  vatIncluded: val,
                  baseFeeAmount: formData.baseFeeAmount || formData.feeAmount,
                });
              }
            }}
            options={["Đã bao gồm", "Chưa bao gồm"]}
            placeholder="Chọn..."
          />
        </div>

        {formData.vatIncluded === "Chưa bao gồm" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">% VAT</label>
            <Combobox
              value={formData.vatPercent}
              onChange={(val) => {
                const percentMatch = Number(val.replace("%", ""));
                const base = Number((formData.baseFeeAmount || formData.feeAmount || "0").replace(/[^0-9]/g, "")) || 0;
                const calculatedFee = base + (base * percentMatch) / 100;
                const formattedCalculatedFee = calculatedFee.toLocaleString("vi-VN");
                setFormData({
                  ...formData,
                  vatPercent: val,
                  feeAmount: formattedCalculatedFee,
                });
              }}
              options={["5%", "8%", "10%"]}
              placeholder="Chọn % VAT..."
            />
          </div>
        )}

        {formData.vatIncluded !== "Chưa bao gồm" && (
          <div className="space-y-2 hidden md:block"></div>
        )}
      </div>
    </div>
  );
}
