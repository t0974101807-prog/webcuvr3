const fs = require('fs');

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

const regexMap = [
  {
    find: /className="bg-\[#2644d6\] p-5 rounded-xl/g,
    replace: 'className="bg-gradient-to-br from-[#2644d6] to-[#516aff] p-5 rounded-xl'
  },
  {
    find: /className="bg-\[#8944fd\] p-5 rounded-xl/g,
    replace: 'className="bg-gradient-to-br from-[#8944fd] to-[#b17eff] p-5 rounded-xl'
  },
  {
    find: /className="bg-\[#ff7e00\] p-5 rounded-xl/g,
    replace: 'className="bg-gradient-to-br from-[#ff7e00] to-[#ffab4a] p-5 rounded-xl'
  },
  {
    find: /className="bg-\[#0ab67b\] p-5 rounded-xl/g,
    replace: 'className="bg-gradient-to-br from-[#0ab67b] to-[#1de1a2] p-5 rounded-xl'
  }
];

regexMap.forEach(({find, replace}) => {
  content = content.replace(find, replace);
});

// Update the 4 white cards to match the vibrant gradient style
const cardsToUpdate = [
  {
    old: '<div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">',
    new: '<div className="bg-gradient-to-br from-[#f43f5e] to-[#fb7185] p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group">'
  },
  {
    old: '<div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden group" onClick={() => { setActiveTab(\'records\'); setTimeout(() => window.dispatchEvent(new CustomEvent(\'set-record-tab\', {detail: \'hoàn thành\'})), 50); }}>',
    new: '<div className="bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group" onClick={() => { setActiveTab(\'records\'); setTimeout(() => window.dispatchEvent(new CustomEvent(\'set-record-tab\', {detail: \'hoàn thành\'})), 50); }}>'
  },
  {
    old: '<div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden group" onClick={() => setActiveTab(\'events\')}>',
    new: '<div className="bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group" onClick={() => setActiveTab(\'events\')}>'
  },
  {
    old: '<div className="bg-white p-5 rounded-xl shadow-sm border border-red-200 flex flex-col justify-between hover:border-red-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group" onClick={() => { setActiveTab(\'records\'); setTimeout(() => window.dispatchEvent(new CustomEvent(\'set-record-tab\', {detail: \'overdue\'})), 50); }}>',
    new: '<div className="bg-gradient-to-br from-[#e11d48] to-[#f43f5e] p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group" onClick={() => { setActiveTab(\'records\'); setTimeout(() => window.dispatchEvent(new CustomEvent(\'set-record-tab\', {detail: \'overdue\'})), 50); }}>'
  }
];

content = content.replace(
  '<p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{t.monthlyNewRecords}</p>',
  '<p className="text-[12px] font-bold text-white/90 uppercase tracking-wider">{t.monthlyNewRecords}</p>'
);
content = content.replace(
  '<div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">',
  '<div className="p-1.5 bg-white/20 rounded-lg text-white backdrop-blur-sm">'
);
content = content.replace(
  '<h3 className="text-[32px] font-bold text-slate-800 leading-none">{monthlyNewRecords}</h3>',
  '<h3 className="text-[32px] font-bold text-white leading-none">{monthlyNewRecords}</h3>'
);
content = content.replace(
  '<span className="text-[13px] font-medium text-slate-400">vụ việc</span>',
  '<span className="text-[13px] font-medium text-white/80">vụ việc</span>'
);

content = content.replace(
  '<p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{language === \'vi\' ? \'HOÀN THÀNH\' : \'COMPLETED\'}</p>',
  '<p className="text-[12px] font-bold text-white/90 uppercase tracking-wider">{language === \'vi\' ? \'HOÀN THÀNH\' : \'COMPLETED\'}</p>'
);
content = content.replace(
  '<div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">',
  '<div className="p-1.5 bg-white/20 rounded-lg text-white backdrop-blur-sm">'
);
content = content.replace(
  '<h3 className="text-[32px] font-bold text-slate-800 leading-none">{totalRecords - inProgressRecords.length}</h3>',
  '<h3 className="text-[32px] font-bold text-white leading-none">{totalRecords - inProgressRecords.length}</h3>'
);
content = content.replace(
  '<span className="text-[13px] font-medium text-slate-400">hồ sơ</span>',
  '<span className="text-[13px] font-medium text-white/80">hồ sơ</span>'
);

content = content.replace(
  '<p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{t.upcomingMeetings}</p>',
  '<p className="text-[12px] font-bold text-white/90 uppercase tracking-wider">{t.upcomingMeetings}</p>'
);
content = content.replace(
  '<div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">',
  '<div className="p-1.5 bg-white/20 rounded-lg text-white backdrop-blur-sm">'
);
content = content.replace(
  '<h3 className="text-[32px] font-bold text-slate-800 leading-none">{upcomingMeetings}</h3>',
  '<h3 className="text-[32px] font-bold text-white leading-none">{upcomingMeetings}</h3>'
);
content = content.replace(
  '<span className="text-[13px] font-medium text-slate-400">lịch hẹn</span>',
  '<span className="text-[13px] font-medium text-white/80">lịch hẹn</span>'
);

content = content.replace(
  '<p className="text-[12px] font-bold text-red-600 uppercase tracking-wider">{language === \'vi\' ? \'QUÁ HẠN\' : \'OVERDUE\'}</p>',
  '<p className="text-[12px] font-bold text-white/90 uppercase tracking-wider">{language === \'vi\' ? \'QUÁ HẠN\' : \'OVERDUE\'}</p>'
);
content = content.replace(
  '<div className="p-1.5 bg-red-50 rounded-lg text-red-600">',
  '<div className="p-1.5 bg-white/20 rounded-lg text-white backdrop-blur-sm">'
);
content = content.replace(
  '<h3 className="text-[32px] font-bold text-red-600 leading-none">{overdueRecords.length}</h3>',
  '<h3 className="text-[32px] font-bold text-white leading-none">{overdueRecords.length}</h3>'
);
content = content.replace(
  '<span className="text-[13px] font-medium text-red-400">hồ sơ</span>',
  '<span className="text-[13px] font-medium text-white/80">hồ sơ</span>'
);

cardsToUpdate.forEach(c => {
  content = content.replace(c.old, c.new);
});

content = content.replace(
  'className="w-64 bg-[#0f172a] text-white flex flex-col h-full overflow-hidden"',
  'className="w-64 bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] text-white flex flex-col h-full overflow-hidden"'
);
content = content.replace(
  'className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0f172a] text-white z-50 flex flex-col shadow-2xl overflow-hidden"',
  'className="fixed top-0 left-0 bottom-0 w-[280px] bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] text-white z-50 flex flex-col shadow-2xl overflow-hidden"'
);

fs.writeFileSync('src/components/ERP.tsx', content);

console.log('patched');
