import React from "react";
import { AlertCircle, Edit2, Eye, Inbox, Phone, Trash2 } from "lucide-react";

export type ERPRecordListViewProps = {
  records: any[];
  language: "vi" | "en";
  formatDisplayDate: (value: string) => string;
  getStatusColor: (status: string) => string;
  isOverdue: (deadline: string, status: string) => boolean;
  setViewingRecord: (record: any) => void;
  canEditRecord: (record: any) => boolean;
  handleEdit: (record: any) => void;
  canDeleteRecord: (record: any) => boolean;
  setShowDeleteConfirm: (id: any) => void;
  activeCallDossierId: any;
  setActiveCallDossierId: (value: any) => void;
  renderLoadMoreControls?: () => React.ReactNode;
};

export default function ERPRecordListView({
  records,
  language,
  formatDisplayDate,
  getStatusColor,
  isOverdue,
  setViewingRecord,
  canEditRecord,
  handleEdit,
  canDeleteRecord,
  setShowDeleteConfirm,
  activeCallDossierId,
  setActiveCallDossierId,
  renderLoadMoreControls,
}: ERPRecordListViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar touch-pan-x">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="py-4 px-4 min-w-[140px]">{language === "vi" ? "LOẠI HỒ SƠ" : "TYPE"}</th>
              <th className="py-4 px-4 min-w-[110px] text-center">{language === "vi" ? "MỨC ĐỘ" : "PRIORITY"}</th>
              <th className="py-4 px-4 min-w-[200px]">{language === "vi" ? "KHÁCH HÀNG" : "CLIENT"}</th>
              <th className="py-4 px-4 min-w-[200px]">{language === "vi" ? "LUẬT SƯ PHỤ TRÁCH" : "LAWYER IN CHARGE"}</th>
              <th className="py-4 px-4 min-w-[180px]">{language === "vi" ? "TÒA ÁN" : "COURT"}</th>
              <th className="py-4 px-4 min-w-[140px] text-center">{language === "vi" ? "TRẠNG THÁI" : "STATUS"}</th>
              <th className="py-4 px-4 min-w-[120px] text-center">{language === "vi" ? "DEADLINE" : "DEADLINE"}</th>
              <th className="py-4 px-4 min-w-[130px] text-center">{language === "vi" ? "HÀNH ĐỘNG" : "ACTIONS"}</th>
              <th className="py-4 px-4 min-w-[150px] text-center font-extrabold">{language === "vi" ? "HÀNH ĐỘNG GỌI" : "CALL ACTION"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records
              .filter((record: any) => record.isDeleted !== true && record.isDeleted !== "true")
              .map((record, idx) => {
                const clientName = record.client || record.clientName || "---";
                const clientInitial = clientName.charAt(0).toUpperCase();
                const docCategory = record.category || record.practice_area || record.caseType || (language === "vi" ? "Tranh tụng" : "Litigation");
                const lawyerName = record.assignee || record.mainAssignee || record.lawyer || (language === "vi" ? "Chưa phân công" : "Unassigned");
                const lawyerInitial = lawyerName.charAt(0).toUpperCase();
                const courtName = record.courtRegion || record.court || (language === "vi" ? "Chưa cập nhật" : "Not updated");
                const deadlineDate = record.deadline ? formatDisplayDate(record.deadline) : "---";

                return (
                  <tr
                    key={`${record.id}-${docCategory}-${idx}`}
                    className="bg-white hover:bg-slate-50 text-slate-700 transition border-b border-slate-100 text-[12px]"
                  >
                    <td className="py-4 px-4">
                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100/80 font-bold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider whitespace-nowrap shadow-xs">
                        {docCategory}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {record.priority === "Khẩn cấp" ? (
                        <span className="inline-block bg-red-50 text-red-700 border border-red-200 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          {language === "vi" ? "KHẨN CẤP" : "URGENT"}
                        </span>
                      ) : record.priority === "Cao" ? (
                        <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          {language === "vi" ? "CAO" : "HIGH"}
                        </span>
                      ) : (
                        <span className="inline-block bg-slate-50 text-slate-500 border border-slate-200 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          {language === "vi" ? "BÌNH THƯỜNG" : "NORMAL"}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-500 hover:bg-indigo-600 transition text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {clientInitial}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 uppercase tracking-wide">
                            {clientName}
                          </span>
                          {record.clientPhone && (
                            <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                              {record.clientPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-600 hover:bg-slate-700 transition text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {lawyerInitial}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {lawyerName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            {language === "vi" ? "Luật sư phụ trách" : "Lawyer"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-medium text-slate-600 line-clamp-2 leading-relaxed">
                        {courtName}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className={['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap shadow-xs', getStatusColor(record.status || 'Mới tiếp nhận')].join(' ')}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-85"></span>
                        <span>{record.status || (language === 'vi' ? 'Mới tiếp nhận' : 'Newly Received')}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-600">
                      {deadlineDate}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingRecord(record);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={language === "vi" ? "Xem chi tiết" : "View details"}
                        >
                          <Eye size={14} />
                        </button>
                        {canEditRecord(record) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(record);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDeleteRecord(record) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(record.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={language === "vi" ? "Chuyển vào thùng rác" : "Move to trash"}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {activeCallDossierId === record.id ? (
                          <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold animate-pulse bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                            <span>{language === "vi" ? "GỌI..." : "CALL..."}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCallDossierId(null);
                                window.dispatchEvent(new CustomEvent("yeastar-hangup"));
                              }}
                              className="hover:underline text-red-600 font-bold cursor-pointer ml-1"
                            >
                              [X]
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const phoneNum = record.clientPhone || record.phone || "0984441771";
                              setActiveCallDossierId(record.id);
                              window.dispatchEvent(
                                new CustomEvent("yeastar-call", {
                                  detail: {
                                    phone: phoneNum,
                                    name: record.client || record.clientName || "Khách hàng",
                                    dossierId: record.id,
                                  },
                                }),
                              );
                            }}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap bg-[#1d3557] hover:bg-[#1d3557]/90 text-white"
                            title={language === "vi" ? "Gọi điện thoại qua Yeastar VoIP" : "Call with Yeastar VoIP"}
                          >
                            <Phone size={11} className="fill-current" />
                            <span>{language === "vi" ? "GỌI ĐIỆN" : "CALL"}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            {records.length === 0 && (
              <tr>
                <td colSpan={9} className="p-12 text-center text-gray-500">
                  <Inbox className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium">
                    {language === "vi" ? "Không tìm thấy hồ sơ nào." : "No records found."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {renderLoadMoreControls?.()}
    </div>
  );
}
