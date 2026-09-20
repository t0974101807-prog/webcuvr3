import React from "react";
import {
  AlertCircle,
  Edit2,
  Eye,
  Phone,
  Trash2,
} from "lucide-react";

export type ERPRecordGridViewProps = {
  records: any[];
  language: "vi" | "en";
  formatCaseCode: (value: string) => string;
  formatDisplayDate: (value: string) => string;
  getStatusColor: (status: string) => string;
  isOverdue: (deadline: string, status: string) => boolean;
  getRecordBlacklistViolations: (record: any) => string[];
  setViewingRecord: (record: any) => void;
  canEditRecord: (record: any) => boolean;
  handleEdit: (record: any) => void;
  canDeleteRecord: (record: any) => boolean;
  setShowDeleteConfirm: (id: any) => void;
  setShowYeastar: (value: boolean) => void;
  activeCallDossierId: any;
  setActiveCallDossierId: (value: any) => void;
  renderLoadMoreControls?: () => React.ReactNode;
};

export default function ERPRecordGridView({
  records,
  language,
  formatCaseCode,
  formatDisplayDate,
  getStatusColor,
  isOverdue,
  getRecordBlacklistViolations,
  setViewingRecord,
  canEditRecord,
  handleEdit,
  canDeleteRecord,
  setShowDeleteConfirm,
  setShowYeastar,
  activeCallDossierId,
  setActiveCallDossierId,
  renderLoadMoreControls,
}: ERPRecordGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {records.map((record, idx) => (
        <div
          key={`${record.id}-${record.category || ""}-${idx}`}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] bg-[length:200%_200%] animate-gradient text-white shadow-sm w-fit uppercase tracking-wider">
                  {formatCaseCode(record.id)}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 w-fit uppercase tracking-wider">
                  {record.category}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={['px-2.5 py-1 rounded-lg text-xs font-medium', getStatusColor(record.status)].join(' ')}>
                  {record.status}
                </span>
                {record.priority && (
                  <span
                    className={[
                      'px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border',
                      record.priority === 'Cao'
                        ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm'
                        : record.priority === 'Khẩn cấp'
                          ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                          : 'bg-slate-50 text-slate-500 border-slate-200',
                    ].join(' ')}
                  >
                    {record.priority}
                  </span>
                )}
                <span className="text-xs text-gray-600 font-medium mt-1">
                  {formatDisplayDate(record.date)}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-[var(--color-text-dark)] mb-4 line-clamp-2">
              {record.title}
            </h3>

            {(() => {
              const violations = getRecordBlacklistViolations(record);
              if (violations.length > 0) {
                return (
                  <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 font-medium">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <span className="font-extrabold block">
                        {language === 'vi' ? 'Cảnh báo chất lượng (Blacklist):' : 'Quality Warning (Blacklist):'}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {violations.map((v: string, i: number) => (
                          <span
                            key={i}
                            className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded-md shadow-xs uppercase"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-gray-600">
                  {language === 'vi' ? 'Người phụ trách chính:' : 'Main Assignee:'}
                </span>
                <span className="font-medium text-[var(--color-text-dark)] text-right">
                  {record.assignee || record.mainAssignee || 'Chưa phân công'}
                </span>
              </div>
              {record.role && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">
                    {language === 'vi' ? 'Chức danh:' : 'Role:'}
                  </span>
                  <span className="font-medium text-[var(--color-text-dark)] text-right">
                    {record.role}
                  </span>
                </div>
              )}
              {record.assignee2 && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">
                    {language === 'vi' ? 'Người phụ trách 2:' : 'Assignee 2:'}
                  </span>
                  <span className="font-medium text-[var(--color-text-dark)] text-right">
                    {record.assignee2}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-gray-600">
                  {language === 'vi' ? 'Khách hàng:' : 'Client:'}
                </span>
                <span className="font-medium text-[var(--color-text-dark)] text-right">
                  {record.client || record.clientName || 'Chưa cập nhật'}
                </span>
              </div>
              {record.clientPhone && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">
                    {language === 'vi' ? 'SĐT Khách hàng:' : 'Client Phone:'}
                  </span>
                  <span className="font-medium text-[var(--color-text-dark)] text-right flex items-center gap-1.5 justify-end">
                    <span>{record.clientPhone}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowYeastar(true);
                        window.dispatchEvent(
                          new CustomEvent('yeastar-call', {
                            detail: {
                              phone: record.clientPhone,
                              name: record.client,
                              dossierId: record.id,
                            },
                          }),
                        );
                      }}
                      className="p-1 hover:bg-slate-150 rounded text-emerald-600 hover:text-emerald-700 transition-all active:scale-90"
                      title={language === 'vi' ? 'Gọi điện qua Yeastar' : 'Call with Yeastar'}
                    >
                      <Phone size={10} className="fill-emerald-600 text-emerald-600" />
                    </button>
                  </span>
                </div>
              )}
              {record.priority && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">
                    {language === 'vi' ? 'Mức độ ưu tiên:' : 'Priority:'}
                  </span>
                  <span
                    className={[
                      'font-medium text-right',
                      record.priority === 'Khẩn cấp'
                        ? 'text-red-600'
                        : record.priority === 'Cao'
                          ? 'text-orange-600'
                          : record.priority === 'Thấp'
                            ? 'text-green-600'
                            : 'text-blue-600',
                    ].join(' ')}
                  >
                    {record.priority}
                  </span>
                </div>
              )}
              {record.deadline && (
                <div className="flex justify-between items-start mt-2">
                  <span className="text-gray-600">
                    {language === 'vi' ? 'Hạn chót:' : 'Deadline:'}
                  </span>
                  <span
                    className={[
                      'font-medium text-right flex items-center gap-1',
                      isOverdue(record.deadline, record.status)
                        ? 'text-red-600 font-bold'
                        : 'text-gray-700',
                    ].join(' ')}
                  >
                    {isOverdue(record.deadline, record.status) && (
                      <AlertCircle size={14} className="text-red-500 animate-pulse" />
                    )}
                    {formatDisplayDate(record.deadline)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={() => setViewingRecord(record)}
              className="px-4 py-2 bg-white border border-gray-200 text-[var(--color-primary)] rounded-lg transition-all duration-300 hover:bg-gray-50 font-medium transition-all duration-300 active:scale-95 text-sm shadow-sm"
            >
              {language === 'vi' ? 'Chi tiết' : 'Details'}
            </button>
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <div className="col-span-full p-12 text-center text-gray-600 bg-white rounded-lg border border-gray-200">
          {language === 'vi' ? 'Không tìm thấy hồ sơ nào.' : 'No records found.'}
        </div>
      )}
      {renderLoadMoreControls?.()}
    </div>
  );
}
