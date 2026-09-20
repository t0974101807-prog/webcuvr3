import React from "react";
import { Trash2, Video, X } from "lucide-react";

interface ERPMeetingRoomModalsProps {
  showAddRoomModal: boolean;
  newRoomData: {
    code: string;
    title: string;
    desc: string;
    status: string;
  };
  setNewRoomData: React.Dispatch<
    React.SetStateAction<{
      code: string;
      title: string;
      desc: string;
      status: string;
    }>
  >;
  language: "vi" | "en";
  handleCreateRoom: (e: React.FormEvent) => void;
  roomToDelete: any;
  onCloseAddRoom: () => void;
  onCloseDeleteRoom: () => void;
  onConfirmDeleteRoom: () => void;
}

export default function ERPMeetingRoomModals({
  showAddRoomModal,
  newRoomData,
  setNewRoomData,
  language,
  handleCreateRoom,
  roomToDelete,
  onCloseAddRoom,
  onCloseDeleteRoom,
  onConfirmDeleteRoom,
}: ERPMeetingRoomModalsProps) {
  return (
    <>
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Video className="text-indigo-600" size={20} />
                <h3 className="font-serif font-bold text-slate-900 text-base">
                  {language === "vi" ? "Khởi tạo Phòng Họp Tư vấn Mới" : "Create New Consultation Room"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseAddRoom}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === "vi" ? "Mã số phòng họp (Room Code)" : "Meeting room code"}
                </label>
                <input
                  type="text"
                  placeholder={language === "vi" ? "Ví dụ: LEGAL-ROOM-04" : "e.g. LEGAL-ROOM-04"}
                  value={newRoomData.code}
                  onChange={(e) =>
                    setNewRoomData({ ...newRoomData, code: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === "vi" ? "Tên phòng họp tư vấn" : "Consultation room name"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === "vi" ? "Ví dụ: Phòng Họp Tư vấn Hôn nhân & Gia đình" : "e.g. Family & Marriage Consultation Room"}
                  value={newRoomData.title}
                  onChange={(e) =>
                    setNewRoomData({ ...newRoomData, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === "vi" ? "Trạng thái phòng" : "Room status"}
                </label>
                <select
                  value={newRoomData.status}
                  onChange={(e) =>
                    setNewRoomData({ ...newRoomData, status: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-semibold"
                >
                  <option value="🟢 Đang mở">🟢 {language === "vi" ? "Đang mở (Tư vấn trực tuyến)" : "Open (Online consultation)"}</option>
                  <option value="🔵 Trực ban">🔵 {language === "vi" ? "Trực ban (Tiếp nhận yêu cầu)" : "On duty (Accept requests)"}</option>
                  <option value="🟣 Nội bộ">🟣 {language === "vi" ? "Nội bộ (Ban Giám đốc / Chuyên môn)" : "Internal (Board / Specialist)"}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === "vi" ? "Mô tả mục đích & chuyên môn phòng" : "Room purpose & expertise description"}
                </label>
                <textarea
                  rows={3}
                  placeholder={language === "vi" ? "Ghi chú về chuyên môn, tư vấn luật đất đai, hôn nhân, tranh chấp thương mại..." : "Notes about specialization, land law, marriage, commercial disputes..."}
                  value={newRoomData.desc}
                  onChange={(e) =>
                    setNewRoomData({ ...newRoomData, desc: e.target.value })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseAddRoom}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                >
                  {language === "vi" ? "Xác nhận Tạo Phòng" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roomToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden text-center space-y-0">
            <div className="p-6 space-y-3">
              <h3 className="text-xl font-bold text-slate-900">
                {language === "vi" ? "Xóa phòng họp trực tuyến" : "Delete Online Meeting Room"}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {language === "vi"
                  ? "Bạn có chắc chắn muốn xóa phòng họp này? Hành động này không thể hoàn tác."
                  : "Are you sure you want to delete this meeting room? This action cannot be undone."}
              </p>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-sm font-bold">
                <Trash2 size={16} />
                <span>{roomToDelete.code}</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-center gap-3">
              <button
                type="button"
                onClick={onCloseDeleteRoom}
                className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={onConfirmDeleteRoom}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                {language === "vi" ? "Xác nhận xóa" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
