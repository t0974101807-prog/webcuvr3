import React from "react";
import { AlertCircle } from "lucide-react";

interface ERPDeleteConfirmModalProps {
  language: string;
  showDeleteConfirm: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  t: {
    cancel: string;
    [key: string]: any;
  };
}

export default function ERPDeleteConfirmModal({
  language,
  showDeleteConfirm,
  onCancel,
  onConfirm,
  t,
}: ERPDeleteConfirmModalProps) {
  if (!showDeleteConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {language === "vi" ? "Xác nhận xóa" : "Confirm Deletion"}
          </h3>
          <p className="text-slate-600">
            {language === "vi"
              ? "Bạn có chắc chắn muốn xóa hồ sơ này không? Hành động này không thể hoàn tác."
              : "Are you sure you want to delete this record? This action cannot be undone."}
          </p>
        </div>
        <div className="p-4 border-t border-slate-200 flex items-center justify-center gap-3 bg-slate-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg transition-all duration-300 hover:bg-white font-medium transition-all duration-300 active:scale-95"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg transition-all duration-300 hover:bg-red-700 font-medium transition-all duration-300 active:scale-95"
          >
            {language === "vi" ? "Xóa hồ sơ" : "Delete Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
