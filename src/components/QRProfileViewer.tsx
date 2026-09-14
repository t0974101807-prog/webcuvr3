import React, { useState, useEffect } from 'react';

export default function QRProfileViewer({ profileId }: { profileId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileId) {
      setError("Mã hồ sơ không hợp lệ");
      setLoading(false);
      return;
    }

    const fetchRecord = async () => {
      try {
        const res = await fetch(`/api/erp-records/detail?id=${encodeURIComponent(profileId)}`);
        if (!res.ok) {
          setError("Hồ sơ không tồn tại hoặc đã bị xóa!");
          setLoading(false);
          return;
        }
        const record = await res.json();
        setData(record);
        setError('');
      } catch (err: any) {
        console.error("Fetch error", err);
        setError("Không thể tải dữ liệu (Lỗi mạng hoặc phân quyền) " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecord();
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium tracking-wide">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy thông tin</h2>
          <p className="text-slate-500 mb-8">{error || "Hồ sơ vụ việc không tồn tại trong hệ thống."}</p>
        </div>
      </div>
    );
  }

  const records = Array.isArray(data) ? data : [data];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-[var(--color-primary)] text-white py-6 px-4 text-center shadow-md sticky top-0 z-10">
        <h1 className="text-xl md:text-2xl font-bold mb-2 tracking-wide font-serif">HỆ THỐNG TRA CỨU TIẾN ĐỘ HỒ SƠ</h1>
        <p className="text-sm md:text-base font-medium opacity-90">Tìm thấy {records.length} hồ sơ liên quan</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
        {records.map((record, index) => {
          const isCompleted = String(record.status || '').toLowerCase().includes('hoàn thành');
          const isProcessing = String(record.status || '').toLowerCase().includes('xử lý');
          
          return (
            <div key={record.id || index} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
              {record.status && (
                <div className={`px-6 py-4 border-b flex justify-between items-center ${
                  isCompleted 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : isProcessing
                    ? 'bg-blue-50 border-blue-100'
                    : 'bg-amber-50 border-amber-100'
                }`}>
                  <span className={`font-bold tracking-wide uppercase text-sm md:text-base ${
                     isCompleted ? 'text-emerald-700' : isProcessing ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    TRẠNG THÁI: {String(record.status).toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/60 shadow-sm text-slate-700">
                    Hồ sơ {index + 1}
                  </span>
                </div>
              )}

              {/* THÔNG TIN HỒ SƠ */}
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
                  Thông tin tiếp nhận
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-6 text-[15px]">
                  <div className="text-slate-500 font-medium">Mã hồ sơ (ID)</div>
                  <div className="md:col-span-2 text-[var(--color-primary)] font-bold text-lg">{record.id || '-'}</div>

                  <div className="text-slate-500 font-medium">Khách hàng</div>
                  <div className="md:col-span-2 text-slate-900 font-medium">{record.client || '-'}</div>

                  <div className="text-slate-500 font-medium">Nội dung vụ việc</div>
                  <div className="md:col-span-2 text-slate-900 leading-relaxed font-medium">
                    {record.title ? `${record.category ? record.category + ' - ' : ''}${record.title}` : (record.category || '-')}
                  </div>

                  <div className="text-slate-500 font-medium">Chuyên viên thụ lý</div>
                  <div className="md:col-span-2 text-slate-900">{record.mainAssignee || '-'}</div>
                  
                  <div className="text-slate-500 font-medium">Ngày tiếp nhận</div>
                  <div className="md:col-span-2 text-slate-900">{record.date || (record.created_at ? new Date(record.created_at).toLocaleDateString('vi-VN') : '-')}</div>
                </div>
              </div>

              {/* TIẾN ĐỘ / KẾT QUẢ GIẢI QUYẾT */}
              <div className="p-6 md:p-8 bg-slate-50/50">
                <div className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] rounded-full hidden sm:block"></div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase sm:pl-4">Ghi chú & Tiến độ mới nhất</h3>
                  <div className="sm:pl-4">
                    <div className="text-[15px] leading-loose text-slate-700 whitespace-pre-wrap bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[120px]">
                      {record.workStatus ? record.workStatus : 
                       <span className="text-slate-400 italic">Hồ sơ đang trong quá trình xử lý, chưa có nội dung ghi chú mới.</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="mt-8 flex justify-center items-center text-xs text-slate-500 py-4 border-t border-slate-200">
          <span>Được cung cấp bởi Hệ thống Quản trị Nội bộ • {new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
}
