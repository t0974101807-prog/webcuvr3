import React from "react";
import {
  Check,
  Download,
  FileText,
  Trash2,
  UploadCloud,
} from "lucide-react";
import DatePickerInput from "../DatePickerInput";
import { Combobox, DOMAIN_OPTIONS } from "./ERPFormControls";

const ERPRecordDocumentSections = ({
  formData,
  setFormData,
  language,
  viewingRecord,
  user,
  myPermissions,
  unlockRequests,
  fetchUnlockRequests,
  api,
  handleUpdateReport,
  handleDownloadAttachment,
  isDossierReportLocked,
}: {
  formData: any;
  setFormData: (data: any) => void;
  language: string;
  viewingRecord: any;
  user: any;
  myPermissions: any;
  unlockRequests: any[];
  fetchUnlockRequests: () => void;
  api: any;
  handleUpdateReport: () => void;
  handleDownloadAttachment: (attachment: { name: string; url: string }) => void;
  isDossierReportLocked: (record: any) => boolean;
}) => {
  return (
    <>
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between border-b border-slate-300 pb-2">
          <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] uppercase">
            {language === "vi" ? "Tài liệu đính kèm" : "Attachments"}
          </h3>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-95 shadow-sm">
            <UploadCloud size={16} /> {language === "vi" ? "Tải tài liệu lên" : "Upload Document"}
            <input
              type="file"
              className="hidden"
              multiple
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const files = Array.from(e.target.files);
                  const uploadedAttachments = files.map((file) => ({
                    name: file.name,
                    originalName: file.name,
                    url: URL.createObjectURL(file),
                  }));
                  setFormData((prev: any) => ({
                    ...prev,
                    attachments: [...(prev.attachments || []), ...uploadedAttachments],
                  }));
                }
              }}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          {(() => {
            const attachments = formData.attachments || [];
            return (
              <>
                {attachments.map((att: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm transition-all duration-300 hover:border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 break-all">{att.name}</p>
                        {att.originalName && <p className="text-xs text-slate-400 break-all">{att.originalName}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newAttachments = [...attachments];
                        newAttachments.splice(idx, 1);
                        setFormData({ ...formData, attachments: newAttachments });
                      }}
                      className="p-2 shrink-0 text-slate-400 hover:text-red-600 transition-all duration-300 hover:bg-red-50 rounded-lg active:scale-95"
                      title={language === "vi" ? "Xóa" : "Delete"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {attachments.length === 0 && (
                  <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
                    {language === "vi" ? "Chưa có tài liệu đính kèm" : "No attachments yet"}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-serif font-bold text-[var(--color-primary)] border-b border-slate-300 pb-2 uppercase">
          Tài liệu báo cáo
        </h3>
        {isDossierReportLocked(viewingRecord) ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5 shrink-0">🔒</span>
              <div>
                <h4 className="text-base font-bold text-amber-800 font-serif">Báo cáo kết quả làm việc đã bị KHÓA</h4>
                <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                  Theo quy định: Hệ thống tự động ghi nhận sau 17h nếu chưa cập nhật kết quả. Quá 24h từ mốc này (hoặc 8h sáng thứ Hai tuần sau đối với lịch Thứ Sáu), báo cáo sẽ bị khóa lại.
                </p>
              </div>
            </div>

            <div className="border-t border-amber-200/60 pt-4 mt-2 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                Gửi giải trình yêu cầu mở khóa đến Kiểm soát chất lượng:
              </p>

              {(() => {
                const existingRequest = unlockRequests && unlockRequests.find(
                  (req: any) => req.dossier_id === viewingRecord.id && req.event_date === viewingRecord.lastWorkDate,
                );

                if (existingRequest) {
                  const statusColors: Record<string, string> = {
                    pending: "bg-amber-100 text-amber-800 border border-amber-200",
                    approved: "bg-emerald-100 text-emerald-800 border border-emerald-200",
                    rejected: "bg-red-100 text-red-800 border border-red-200",
                  };
                  const statusLabels: Record<string, string> = {
                    pending: "Đang chờ Kiểm soát chất lượng phê duyệt",
                    approved: "Đã được phê duyệt mở khóa (Tải lại trang nếu chưa mở)",
                    rejected: "Yêu cầu bị từ chối",
                  };

                  return (
                    <div className="space-y-3">
                      <div className={`text-sm px-4 py-3 rounded-lg flex items-center justify-between font-medium ${statusColors[existingRequest.status] || "bg-slate-100"}`}>
                        <span>Trạng thái yêu cầu: {statusLabels[existingRequest.status] || existingRequest.status}</span>
                        <span className="text-xs opacity-75">{new Date(existingRequest.created_at).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="p-3 bg-white/70 rounded-lg text-xs italic border border-amber-100">
                        <strong>Lý do giải trình đã gửi:</strong> {existingRequest.reason}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="text-sm text-amber-800">
                    Yêu cầu mở khóa phải được gửi từ form mở khóa tương ứng.
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Lĩnh vực</label>
                <Combobox
                  value={formData.reportDomain}
                  onChange={(val) => setFormData({ ...formData, reportDomain: val })}
                  options={DOMAIN_OPTIONS}
                  placeholder="Chọn hoặc nhập lĩnh vực..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Chọn văn bản</label>
                <input
                  type="text"
                  value={formData.reportDocType}
                  onChange={(e) => setFormData({ ...formData, reportDocType: e.target.value })}
                  placeholder="VD: Đơn khởi kiện"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="space-y-2 flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 block mb-2">File đính kèm</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      className="hidden"
                      id="report-file-upload"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const files = Array.from(e.target.files);
                          setFormData({
                            ...formData,
                            reportFiles: [...(formData.reportFiles || []), ...files],
                            reportFileName: files[0].name,
                            reportFileUrl: URL.createObjectURL(files[0]),
                          });
                        }
                      }}
                    />
                    <label
                      htmlFor="report-file-upload"
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-blue-100 active:scale-95"
                    >
                      {language === "vi" ? "Chọn File" : "Choose File"}
                    </label>
                    <span
                      className="text-sm text-slate-500 truncate max-w-[150px]"
                      title={formData.reportFiles?.map((f: any) => f.name).join(", ")}
                    >
                      {formData.reportFiles && formData.reportFiles.length > 0
                        ? formData.reportFiles.length === 1
                          ? formData.reportFiles[0].name
                          : `${formData.reportFiles.length} file đã chọn`
                        : language === "vi"
                          ? "Chưa chọn file"
                          : "No file chosen"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleUpdateReport}
                  className="p-2 bg-slate-200 rounded-lg text-slate-600 transition-all duration-300 hover:bg-slate-300 mt-7 active:scale-95"
                  title="Tải lên"
                >
                  <Download size={20} className="rotate-180" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium text-slate-700">Ghi chú báo cáo (Lưu vào lịch sử)</label>
              <textarea
                value={formData.reportNote}
                onChange={(e) => setFormData({ ...formData, reportNote: e.target.value })}
                placeholder="Nhập ghi chú ngắn gọn về lần cập nhật này..."
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              ></textarea>
            </div>

            <div className="space-y-4 border-t pt-4 mt-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide font-sans text-indigo-600 flex items-center gap-2">
                <span>📅</span> Lịch làm việc & Báo cáo tiếp theo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Ngày làm việc tiếp theo
                  </label>
                  <DatePickerInput
                    value={formData.nextWorkingDate || ""}
                    onChange={(val: string) => setFormData({ ...formData, nextWorkingDate: val })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Giờ làm việc tiếp theo
                  </label>
                  <input
                    type="time"
                    value={formData.nextWorkingTime || ""}
                    onChange={(e) => setFormData({ ...formData, nextWorkingTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleUpdateReport}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md text-white rounded-lg font-medium transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 active:scale-95 flex items-center gap-2"
              >
                <Check size={18} />
                Cập nhật báo cáo
              </button>
            </div>
          </>
        )}

        {formData.reportHistory &&
          formData.reportHistory.length > 0 &&
          (user?.role === "admin" || myPermissions?.viewReports || myPermissions?.viewAllRecords || myPermissions?.editAllRecords) && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase">Lịch sử báo cáo</h4>
              <div className="space-y-3">
                {formData.reportHistory.map((report: any) => (
                  <div key={report.id} className="p-3 bg-slate-50 border rounded-lg text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-[var(--color-primary)]">{report.timestamp}</span>

                      {report.files && report.files.length > 0 && (
                        <div className="flex flex-col gap-1 items-end">
                          {report.files.map((f: any, i: number) => (
                            <button
                              key={i}
                              onClick={() =>
                                handleDownloadAttachment({
                                  name: f.name,
                                  url:
                                    f.url ||
                                    viewingRecord?.attachments?.find(
                                      (a: any) => a.originalName === f.name || a.name === f.name,
                                    )?.url ||
                                    "",
                                })
                              }
                              className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs hover:bg-blue-100 transition-all duration-300 active:scale-95 cursor-pointer"
                              title="Tải xuống"
                            >
                              <FileText size={14} />
                              {f.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {report.fileName && (!report.files || report.files.length === 0) && (
                        <button
                          onClick={() =>
                            handleDownloadAttachment({
                              name: report.fileName,
                              url:
                                report.url ||
                                viewingRecord?.attachments?.find(
                                  (a: any) => a.originalName === report.fileName || a.name === report.fileName,
                                )?.url ||
                                "",
                            })
                          }
                          className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs hover:bg-blue-100 transition-all duration-300 active:scale-95 cursor-pointer"
                          title="Tải xuống"
                        >
                          <FileText size={14} />
                          {report.fileName}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2 text-slate-600 text-xs">
                      <div>
                        <span className="font-medium">Lĩnh vực:</span> {report.domain || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Văn bản:</span> {report.docType || "-"}
                      </div>
                    </div>
                    {report.note && <div className="text-slate-700 bg-white p-2 rounded-lg border border-slate-100">{report.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default ERPRecordDocumentSections;
