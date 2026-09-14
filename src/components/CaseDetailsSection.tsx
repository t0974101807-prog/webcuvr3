import React from 'react';

export const CaseDetailsSection = ({ formData, setFormData }: { formData: any, setFormData: (data: any) => void }) => {
  const status = formData.procedureStep || '';

  const renderField = (label: string, fieldName: string, type: string = 'text', width: string = 'w-full') => (
    <div className={`space-y-2 ${width}`}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {type === 'textarea' ? (
        <textarea 
          value={formData[fieldName] || ''} 
          onChange={e => setFormData({ ...formData, [fieldName]: e.target.value })} 
          className="w-full px-3 py-2 border rounded-lg" 
          rows={3}
        />
      ) : (
        <input 
          type={type} 
          value={formData[fieldName] || ''} 
          onChange={e => setFormData({ ...formData, [fieldName]: e.target.value })} 
          className="w-full px-3 py-2 border rounded-lg" 
        />
      )}
    </div>
  );

  switch (status) {
    case 'B1: Chuẩn bị hồ sơ':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Người xử lý', 'b1Assignee')}
          {renderField('Chức vụ', 'b1Role')}
          {renderField('Ngày tiếp nhận chuẩn bị hồ sơ', 'b1ReceiveDate', 'date')}
          {renderField('Ngày hoàn thành hồ sơ', 'b1CompleteDate', 'date')}
          {renderField('Hạn xử lý (15-30 ngày)', 'b1Deadline')}
        </div>
      );
    case 'B2: Nộp hồ sơ khởi kiện':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Ngày tiếp nhận hồ sơ', 'receiveDate', 'date')}
          {renderField('Ngày nộp hồ sơ', 'submitDate', 'date')}
          {renderField('Mã vận đơn', 'trackingCode', 'text', 'md:col-span-2')}
          {renderField('Người xử lý', 'b2Assignee')}
          {renderField('Chức vụ', 'b2Role')}
          {renderField('Theo dõi đơn khởi kiện (Tên/SĐT)', 'b2Tracker')}
          {renderField('Hạn xử lý (5-10 ngày)', 'b2Deadline')}
          {renderField('Ghi chú chung', 'generalNote', 'textarea', 'md:col-span-2')}
        </div>
      );
    case 'B3: Theo dõi & Xử lý đơn':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Người xử lý', 'b3Assignee')}
          {renderField('Chức vụ', 'b3Role')}
          {renderField('Ngày nộp hồ sơ', 'b3SubmitDate', 'date')}
          {renderField('Ngày Tòa án nhận được hồ sơ', 'b3CourtReceiveDate', 'date')}
          {renderField('Hạn xử lý (15-20 ngày)', 'b3Deadline')}
          {renderField('Tình trạng', 'b3Status', 'text', 'md:col-span-2')}
        </div>
      );
    case 'B4: Nộp tạm ứng án phí':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Người xử lý', 'b4Assignee')}
          {renderField('Chức vụ', 'b4Role')}
          {renderField('Ngày nhận thông báo', 'b4ReceiveDate', 'date')}
          {renderField('Số biên lai tạm ứng', 'b4ReceiptCode')}
          {renderField('Ngày biên lai', 'b4ReceiptDate', 'date')}
          {renderField('Số tiền', 'b4ReceiptAmount')}
          {renderField('Hạn xử lý (07 ngày)', 'b4Deadline')}
          {renderField('Đề xuất chi', 'b4Proposal', 'textarea', 'md:col-span-2')}
        </div>
      );
    case 'B5: Thụ lý vụ án':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Người xử lý (Tên Tòa án)', 'b5Assignee')}
          {renderField('Chức vụ (Thẩm phán/Thư ký/SĐT)', 'b5Role')}
          {renderField('Ngày nộp biên lai cho Tòa án', 'b5SubmitDate', 'date')}
          {renderField('Hạn xử lý (07 ngày)', 'b5Deadline')}
          {renderField('Số hiệu Thông báo Thụ lý vụ án', 'b5NoticeCode', 'text', 'md:col-span-2')}
        </div>
      );
    case 'B6: Hòa giải':
      return (
        <div className="space-y-4 md:col-span-2">
          <h4 className="font-semibold text-slate-800">Hòa giải Lần 1</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Khách hàng', 'b6Client1')}
            {renderField('Bị đơn', 'b6Defendant1')}
            {renderField('Người xử lý (Tòa án)', 'b6CourtAssignee1')}
            {renderField('Chức vụ', 'b6CourtRole1')}
            {renderField('Thời gian nhận văn bản', 'b6ReceiveTextDate1', 'date')}
            {renderField('Thời gian mời hòa giải', 'b6InviteDate1', 'date')}
          </div>
          <h4 className="font-semibold text-slate-800 mt-4">Hòa giải Lần 2</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Khách hàng', 'b6Client2')}
            {renderField('Bị đơn', 'b6Defendant2')}
            {renderField('Người xử lý (Tòa án)', 'b6CourtAssignee2')}
            {renderField('Chức vụ', 'b6CourtRole2')}
            {renderField('Thời gian nhận văn bản', 'b6ReceiveTextDate2', 'date')}
            {renderField('Thời gian mời hòa giải', 'b6InviteDate2', 'date')}
            {renderField('Tình trạng bổ sung chứng cứ', 'b6EvidenceStatus', 'text', 'md:col-span-2')}
          </div>
        </div>
      );
    case 'B7: Kết quả hòa giải':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Người xử lý (Tòa án)', 'b7Assignee')}
          {renderField('Chức vụ', 'b7Role')}
          {renderField('Phân loại', 'b7Type')}
          {renderField('Thời gian mời hòa giải', 'b7InviteDate', 'date')}
          {renderField('Người xử lý (Nội bộ)', 'b7InternalAssignee')}
          {renderField('Chức vụ (Nội bộ)', 'b7InternalRole')}
          {renderField('Nội dung hòa giải', 'b7Content', 'textarea', 'md:col-span-2')}
          {renderField('Kết quả', 'b7Result', 'text', 'md:col-span-2')}
        </div>
      );
    case 'B8: Quyết định đưa vụ án ra xét xử':
      return (
        <div className="space-y-4 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Khách hàng', 'b8Client')}
            {renderField('Bị đơn', 'b8Defendant')}
            {renderField('Người xử lý (Tòa án)', 'b8Assignee')}
            {renderField('Chức vụ', 'b8Role')}
          </div>
          <h4 className="font-semibold text-slate-800 mt-4">Lần 1</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField('Ngày nhận quyết định', 'b8ReceiveDate1', 'date')}
            {renderField('Số hiệu quyết định', 'b8Code1')}
            {renderField('Thời gian đưa vụ án ra xét xử', 'b8TrialDate1', 'date')}
            {renderField('Tình trạng', 'b8Status1')}
          </div>
          <h4 className="font-semibold text-slate-800 mt-4">Lần 2</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {renderField('Ngày nhận quyết định', 'b8ReceiveDate2', 'date')}
             {renderField('Số hiệu quyết định', 'b8Code2')}
             {renderField('Thời gian đưa vụ án ra xét xử', 'b8TrialDate2', 'date')}
             {renderField('Tình trạng', 'b8Status2')}
          </div>
        </div>
      );
    case 'B9: Bản án sơ thẩm':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Người xử lý (Tòa án)', 'b9Assignee')}
          {renderField('Chức vụ', 'b9Role')}
          {renderField('Ngày nhận bản án', 'b9ReceiveDate', 'date')}
          {renderField('Số hiệu bản án', 'b9Code')}
          {renderField('Người nhận bản án', 'b9Receiver')}
          {renderField('Chức vụ người nhận', 'b9ReceiverRole')}
          {renderField('Kháng cáo phúc thẩm (nếu có)', 'b9Appeal', 'textarea', 'md:col-span-2')}
        </div>
      );
    case 'B10: Thi hành án':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Cơ quan / Người xử lý', 'b10Assignee')}
          {renderField('Chức vụ', 'b10Role')}
          {renderField('Ngày nhận Quyết định', 'b10ReceiveDate', 'date')}
          {renderField('Người nhận', 'b10Receiver')}
          {renderField('Số hiệu văn bản', 'b10Code')}
          {renderField('Ngày tiếp nhận hồ sơ', 'b10DossierReceiveDate', 'date')}
          {renderField('Ngày nộp hồ sơ', 'b10DossierSubmitDate', 'date')}
          {renderField('Kết quả thi hành án', 'b10Result', 'textarea', 'md:col-span-2')}
        </div>
      );
    case 'B11: Kết thúc tố tụng':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Thanh toán tại phiên hòa giải', 'b11Pay1')}
          {renderField('Thanh toán sau phiên hòa giải', 'b11Pay2')}
          {renderField('Thanh toán sau khi có Bản án', 'b11Pay3')}
          {renderField('Thanh toán sau CĐ Thi hành án', 'b11Pay4')}
        </div>
      );
    default:
      return (
        <div className="p-4 border rounded-lg bg-slate-50 text-slate-500 text-center">
          Vui lòng chọn Tình trạng (bước tố tụng) để xem và nhập chi tiết hồ sơ.
        </div>
      );
  }
};

export default CaseDetailsSection;
