import fs from 'fs';

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

const regex = /\{\/\* Overview Cards \*\/\}[\s\S]*?\{\/\* DOANH THU THÁNG NÀY \*\/\}[\s\S]*?<\/div>[\s]*<\/div>/;

const newKpiUI = `{/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TỔNG SỐ HỒ SƠ */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-5 rounded-xl shadow-lg border border-blue-600/30 flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group" onClick={() => setActiveTab('records')}>
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <FolderOpen size={100} className="text-white" />
          </div>
          <div className="flex justify-between items-start mb-3 relative z-10">
            <p className="text-[12px] font-bold text-blue-100 uppercase tracking-wider">{t.totalRecords}</p>
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <FolderOpen size={16} className="text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[32px] font-bold text-white leading-none">{totalRecords}</h3>
            <span className="text-[13px] font-medium text-blue-200">hồ sơ</span>
          </div>
        </div>

        {/* ĐANG THỤ LÝ */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl shadow-lg border border-indigo-400/30 flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group" onClick={() => { setActiveTab('records'); setTimeout(() => window.dispatchEvent(new CustomEvent('set-record-tab', {detail: 'Đang xử lý'})), 50); }}>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Clock size={100} className="text-white" />
          </div>
          <div className="flex justify-between items-start mb-3 relative z-10">
            <p className="text-[12px] font-bold text-indigo-100 uppercase tracking-wider">{language === 'vi' ? 'ĐANG THỤ LÝ' : 'IN PROGRESS'}</p>
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm text-white">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[32px] font-bold text-white leading-none">{inProgressRecords.length - overdueRecords.length}</h3>
            <span className="text-[13px] font-medium text-indigo-200">hồ sơ</span>
          </div>
        </div>
        
        {/* PHIÊN TÒA SẮP TỚI */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-xl shadow-lg border border-amber-400/30 flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group" onClick={() => setActiveTab('events')}>
          <div className="absolute -right-4 -top-4 opacity-[0.15] text-white group-hover:scale-110 transition-transform duration-500">
            <Gavel size={100} />
          </div>
          <div className="flex justify-between items-start mb-3 relative z-10">
            <p className="text-[12px] font-bold text-amber-100 uppercase tracking-wider">{t.upcomingCourts}</p>
            <div className="p-1.5 bg-white/20 rounded-lg text-white backdrop-blur-sm">
              <Gavel size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[32px] font-bold text-white leading-none">{upcomingCourtSessions}</h3>
            <span className="text-[13px] font-medium text-amber-200">hiện có</span>
          </div>
        </div>
        
        {/* DOANH THU THÁNG NÀY */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-xl shadow-lg border border-emerald-400/30 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 text-white group-hover:scale-110 transition-transform duration-500">
            <BarChart3 size={100} />
          </div>
          <div className="flex justify-between items-start mb-3 relative z-10">
            <p className="text-[12px] font-bold text-emerald-100 uppercase tracking-wider">{t.monthlyRevenue}</p>
            <div className="p-1.5 bg-white/20 rounded-lg text-white backdrop-blur-sm">
              <BarChart3 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[32px] font-bold text-white leading-none">{(monthlyRevenue / 1000000).toLocaleString('vi-VN')}</h3>
            <span className="text-[13px] font-medium text-emerald-200">Tr VNĐ</span>
          </div>
        </div>
        
        {/* VỤ VIỆC MỚI THEO THÁNG */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{t.monthlyNewRecords}</p>
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
              <FileCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[32px] font-bold text-slate-800 leading-none">{monthlyNewRecords}</h3>
            <span className="text-[13px] font-medium text-slate-400">vụ việc</span>
          </div>
        </div>

        {/* HOÀN THÀNH */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden group" onClick={() => { setActiveTab('records'); setTimeout(() => window.dispatchEvent(new CustomEvent('set-record-tab', {detail: 'hoàn thành'})), 50); }}>
          <div className="flex justify-between items-start mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'HOÀN THÀNH' : 'COMPLETED'}</p>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[32px] font-bold text-slate-800 leading-none">{totalRecords - inProgressRecords.length}</h3>
            <span className="text-[13px] font-medium text-slate-400">hồ sơ</span>
          </div>
        </div>
        
        {/* LỊCH HẸN SẮP TỚI */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden group" onClick={() => setActiveTab('events')}>
          <div className="flex justify-between items-start mb-3">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{t.upcomingMeetings}</p>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[32px] font-bold text-slate-800 leading-none">{upcomingMeetings}</h3>
            <span className="text-[13px] font-medium text-slate-400">lịch hẹn</span>
          </div>
        </div>
        
        {/* QUÁ HẠN */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-red-200 flex flex-col justify-between hover:border-red-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group" onClick={() => { setActiveTab('records'); setTimeout(() => window.dispatchEvent(new CustomEvent('set-record-tab', {detail: 'overdue'})), 50); }}>
          <div className="flex justify-between items-start mb-3">
            <p className="text-[12px] font-bold text-red-600 uppercase tracking-wider">{language === 'vi' ? 'QUÁ HẠN' : 'OVERDUE'}</p>
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <AlertCircle size={16} className={overdueRecords.length > 0 ? "animate-pulse" : ""} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[32px] font-bold text-red-600 leading-none">{overdueRecords.length}</h3>
            <span className="text-[13px] font-medium text-red-400">hồ sơ</span>
          </div>
        </div>
      </div>`;

content = content.replace(regex, newKpiUI);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log('Patched ERP.tsx with new KPIs formatting');
