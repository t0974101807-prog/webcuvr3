import { useState } from "react";

export const UnlockRequestForm = ({
  record,
  fetchUnlockRequests,
  api,
}: {
  record: any;
  fetchUnlockRequests: () => void;
  api: any;
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do giải trình!");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.req("/api/unlock-requests/create", "POST", {
        dossierId: record.id,
        clientName: record.client || record.clientName || "Khách hàng",
        staffName: record.mainAssignee || "Nhân viên",
        eventTitle: `Hòa giải (giai đoạn ${record.status || "vụ án"}) vụ việc ${record.client || ""}`,
        eventDate: record.lastWorkDate,
        reason,
      });
      if (res && res.success) {
        setSuccess(true);
        fetchUnlockRequests();
      }
    } catch (e) {
      console.error(e);
      alert("Gửi yêu cầu thất bại. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm px-4 py-3 rounded-lg font-medium flex items-center gap-2">
        <span>✅</span>
        <span>Yêu cầu mở khóa của bạn đã được gửi thành công đến Kiểm soát chất lượng!</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-white/40 p-4 rounded-xl border border-amber-200/50">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Nhập lý do chi tiết giải trình vì sao nộp báo cáo trễ hạn kèm theo tài liệu chứng minh (nếu có)..."
        className="w-full text-sm p-3 border rounded-lg bg-white/90 border-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 min-h-[80px]"
      />
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu giải trình"}
      </button>
    </div>
  );
};
