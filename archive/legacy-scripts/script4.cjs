const fs = require('fs');
const content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const targetState = `  const [view, setView] = useState<'year' | 'month' | 'day'>('year');`;
const replacementState = `  const [view, setView] = useState<'year' | 'month' | 'day' | 'event-detail'>('year');`;

const targetDayView = `  const renderDayView = () => {
    const lunar = getLunarDate(currentYear, currentMonth, selectedDay || 1);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Calculate the week containing the selected day
    const selectedDateObj = new Date(currentYear, currentMonth, selectedDay || 1);
    const selectedDayOfWeek = selectedDateObj.getDay() === 0 ? 6 : selectedDateObj.getDay() - 1; // 0=Mon, 6=Sun
    
    // Generate dates for the current week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentYear, currentMonth, (selectedDay || 1) - selectedDayOfWeek + i);
      weekDates.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isCurrentMonth: d.getMonth() === currentMonth,
        lunar: getLunarDate(d.getFullYear(), d.getMonth(), d.getDate())
      });
    }

    const hours = Array.from({ length: 24 }).map((_, i) => \`\${i.toString().padStart(2, '0')}:00\`);
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const timePosition = (currentHour * 60 + currentMinute) / (24 * 60) * 100; // rough percentage

    return (
      <div className="bg-white min-h-full pb-24 relative flex flex-col">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
            <button 
              onClick={() => setView('month')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 font-medium"
            >
              <ChevronLeft size={18} />
              {t.months[currentMonth]}
            </button>
            <div className="flex gap-3">
              <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <div className="flex gap-0.5">
                  <span className="w-1 h-3 bg-slate-700 rounded-full"></span>
                  <span className="w-1 h-3 bg-slate-700 rounded-full"></span>
                  <span className="w-1 h-3 bg-slate-700 rounded-full"></span>
                </div>
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Search size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          {/* Week Strip */}
          <div className="grid grid-cols-7 border-b border-slate-200 px-2 pb-2 pt-2 text-center">
            {t.dayNames.map((dayName, i) => (
              <div key={dayName} className={cn("text-xs font-medium mb-2", i === 6 ? "text-slate-400" : "text-slate-800")}>
                {dayName}
              </div>
            ))}
            {weekDates.map((wd, i) => {
              const isSelected = wd.day === selectedDay && wd.month === currentMonth;
              const isFirstLunar = wd.lunar.day === 1;
              return (
                <div key={i} className="flex flex-col items-center cursor-pointer pb-2 relative" onClick={() => {
                  if (wd.month === currentMonth) {
                    setSelectedDay(wd.day);
                  } else {
                    setCurrentMonth(wd.month);
                    setCurrentYear(wd.year);
                    setSelectedDay(wd.day);
                  }
                }}>
                  {isSelected && (
                    <div className="absolute top-0 w-12 h-12 bg-red-500 rounded-full -z-10"></div>
                  )}
                  <div className={cn(
                    "w-10 h-8 flex items-end justify-center text-xl font-medium",
                    isSelected ? "text-white" : wd.isCurrentMonth ? "text-slate-900" : "text-slate-400"
                  )}>
                    {wd.day}
                  </div>
                  <div className={cn(
                    "text-[11px] mt-0.5",
                    isSelected ? "text-white" : isFirstLunar ? "text-red-500 font-medium" : "text-slate-500"
                  )}>
                    {isFirstLunar ? \`Thg \${wd.lunar.month}\` : wd.lunar.day}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Selected Date Header */}
          <div className="py-3 text-center border-b border-slate-200 bg-slate-50/50">
            <div className="font-bold text-slate-900 text-lg">
              {t.dayNames[selectedDayOfWeek]} - {selectedDay} {t.months[currentMonth].toLowerCase()}, {currentYear}
            </div>
            <div className="text-sm text-slate-500">
              {lunar.day}/{lunar.month} năm {t.lunarYear}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="py-4">
            {hours.map((hour, i) => (
              <div key={hour} className="flex items-start group">
                <div className="w-16 text-right pr-4 text-xs text-slate-400 font-medium pt-2">
                  {hour}
                </div>
                <div className="flex-1 border-t border-slate-100 min-h-[60px] relative group-hover:bg-slate-50 transition-colors">
                  {/* Mock event block */}
                  {i === 9 && selectedDay === 27 && (
                    <div className="absolute top-2 left-2 right-4 bg-red-100 border-l-4 border-red-500 rounded p-2 text-sm">
                      <div className="font-bold text-red-700">Họp giao ban</div>
                      <div className="text-red-600/80 text-xs">09:00 - 10:30</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Current Time Indicator (Mocked for visual) */}
            {isToday(currentYear, currentMonth, selectedDay || 1) && (
              <div 
                className="absolute left-0 right-0 flex items-center pointer-events-none"
                style={{ top: \`calc(1rem + \${currentHour * 60 + currentMinute}px)\` }} // Rough positioning
              >
                <div className="w-16 text-right pr-2">
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {currentHour.toString().padStart(2, '0')}:{currentMinute.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex-1 h-[2px] bg-red-500 relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };`;

const replacementDayView = `  const renderDayView = () => {
    const lunar = getLunarDate(currentYear, currentMonth, selectedDay || 1);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Calculate the week containing the selected day
    const selectedDateObj = new Date(currentYear, currentMonth, selectedDay || 1);
    const selectedDayOfWeek = selectedDateObj.getDay() === 0 ? 6 : selectedDateObj.getDay() - 1; // 0=Mon, 6=Sun
    
    // Generate dates for the current week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentYear, currentMonth, (selectedDay || 1) - selectedDayOfWeek + i);
      weekDates.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isCurrentMonth: d.getMonth() === currentMonth,
        lunar: getLunarDate(d.getFullYear(), d.getMonth(), d.getDate())
      });
    }

    const hours = Array.from({ length: 24 }).map((_, i) => \`\${i.toString().padStart(2, '0')}:00\`);
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    return (
      <div className="bg-white min-h-full pb-24 relative flex flex-col">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 shadow-sm">
          <div className="px-4 py-3 flex justify-between items-center">
            <button 
              onClick={() => setView('month')}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-slate-100 text-slate-800 font-medium"
            >
              <ChevronLeft size={18} />
              {t.months[currentMonth]}
            </button>
            <div className="flex gap-3">
              <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <div className="flex gap-0.5">
                  <span className="w-1 h-3 bg-slate-700 rounded-full"></span>
                  <span className="w-1 h-3 bg-slate-700 rounded-full"></span>
                  <span className="w-1 h-3 bg-slate-700 rounded-full"></span>
                </div>
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Search size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          {/* Week Strip */}
          <div className="grid grid-cols-7 border-b border-slate-200 px-2 pb-2 pt-2 text-center">
            {t.dayNames.map((dayName, i) => (
              <div key={dayName} className={cn("text-xs font-medium mb-2", i === 6 ? "text-slate-400" : "text-slate-800")}>
                {dayName}
              </div>
            ))}
            {weekDates.map((wd, i) => {
              const isSelected = wd.day === selectedDay && wd.month === currentMonth;
              const isFirstLunar = wd.lunar.day === 1;
              const isTodayDate = isToday(wd.year, wd.month, wd.day);
              
              return (
                <div key={i} className="flex flex-col items-center cursor-pointer pb-2" onClick={() => {
                  if (wd.month === currentMonth) {
                    setSelectedDay(wd.day);
                  } else {
                    setCurrentMonth(wd.month);
                    setCurrentYear(wd.year);
                    setSelectedDay(wd.day);
                  }
                }}>
                  <div className={cn(
                    "w-11 h-11 flex flex-col items-center justify-center rounded-full",
                    isSelected ? (isTodayDate ? "bg-red-500 text-white" : "bg-slate-900 text-white") : "bg-transparent"
                  )}>
                    <div className={cn(
                      "text-lg font-medium leading-none",
                      isSelected ? "text-white" : isTodayDate ? "text-red-500" : wd.isCurrentMonth ? "text-slate-900" : "text-slate-400"
                    )}>
                      {wd.day}
                    </div>
                    <div className={cn(
                      "text-[10px] mt-0.5 leading-none",
                      isSelected ? "text-white" : isTodayDate ? "text-red-500" : isFirstLunar ? "text-red-500 font-medium" : "text-slate-500"
                    )}>
                      {isFirstLunar ? \`Thg \${wd.lunar.month}\` : wd.lunar.day}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Selected Date Header */}
          <div className="py-3 text-center border-b border-slate-200 bg-white">
            <div className="font-bold text-slate-900 text-[15px]">
              {t.dayNames[selectedDayOfWeek]} - {selectedDay} thg {currentMonth + 1}, {currentYear}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {lunar.day}/{lunar.month} năm {t.lunarYear}
            </div>
          </div>

          {/* All-day events */}
          {selectedDay === 25 && currentMonth === 2 && (
            <div className="flex border-b border-slate-200 bg-white min-h-[40px]">
              <div className="w-14 flex-shrink-0 flex items-center justify-center border-r border-slate-100">
                <span className="text-[10px] text-slate-400 text-center leading-tight">cả<br/>ngày</span>
              </div>
              <div className="flex-1 p-2 flex gap-2 overflow-x-auto no-scrollbar">
                <div 
                  onClick={() => setView('event-detail')}
                  className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Calendar size={12} />
                  8h30 hòa giải lê ngọc tâm
                </div>
                <div className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                  <Calendar size={12} />
                  8h30 hòa giải phan x...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto relative bg-white">
          <div className="py-2">
            {hours.map((hour, i) => (
              <div key={hour} className="flex items-start group min-h-[60px]">
                <div className="w-14 text-center text-[11px] text-slate-400 font-medium relative -top-2">
                  {hour}
                </div>
                <div className="flex-1 border-t border-slate-100 relative group-hover:bg-slate-50 transition-colors">
                  {/* Mock event block */}
                  {i === 9 && selectedDay === 27 && (
                    <div className="absolute top-0 left-0 right-4 bg-red-50 border-l-4 border-red-500 p-2 text-sm z-10">
                      <div className="font-bold text-red-700 text-sm">Họp giao ban</div>
                      <div className="text-red-600/80 text-xs mt-0.5">09:00 - 10:30</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Current Time Indicator (Mocked for visual) */}
            {isToday(currentYear, currentMonth, selectedDay || 1) && (
              <div 
                className="absolute left-0 right-0 flex items-center pointer-events-none"
                style={{ top: \`calc(0.5rem + \${currentHour * 60 + currentMinute}px)\` }} // Rough positioning
              >
                <div className="w-14 text-center">
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {currentHour.toString().padStart(2, '0')}:{currentMinute.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex-1 h-[2px] bg-red-500 relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEventDetail = () => {
    return (
      <div className="bg-slate-50 min-h-full flex flex-col">
        <div className="sticky top-0 bg-slate-50 z-20 px-4 py-3 flex justify-between items-center">
          <button 
            onClick={() => setView('day')}
            className="flex items-center gap-1 px-4 py-2 rounded-full bg-white shadow-sm text-slate-800 font-medium"
          >
            <ChevronLeft size={18} />
            25 thg 3
          </button>
          <button className="px-4 py-2 rounded-full bg-white shadow-sm text-slate-800 font-medium">
            Sửa
          </button>
        </div>

        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">8h30 hòa giải lê ngọc tâm</h2>
          <div className="text-slate-800">Thứ Tư, ngày 25 thg 3, 2026</div>
          <div className="text-slate-500 text-sm mb-8">Cả ngày</div>

          <div className="bg-white rounded-2xl p-4 flex justify-between items-center mb-4 shadow-sm">
            <span className="text-slate-800 font-medium">Lịch</span>
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
              <span>Công Việc</span>
              <ChevronRight size={16} className="rotate-90" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm">
            <span className="text-slate-800 font-medium">Cảnh báo</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span>Không có</span>
              <ChevronRight size={16} className="rotate-90" />
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 flex justify-center">
          <button className="px-6 py-3 rounded-full bg-white shadow-sm text-red-500 font-medium">
            Xóa sự kiện
          </button>
        </div>
      </div>
    );
  };`;

const targetReturn = `        {view === 'year' ? renderYearView() : view === 'month' ? renderMonthView() : renderDayView()}`;
const replacementReturn = `        {view === 'year' ? renderYearView() : view === 'month' ? renderMonthView() : view === 'day' ? renderDayView() : renderEventDetail()}`;

let newContent = content;
if (newContent.includes(targetState)) newContent = newContent.replace(targetState, replacementState);
if (newContent.includes(targetDayView)) newContent = newContent.replace(targetDayView, replacementDayView);
if (newContent.includes(targetReturn)) newContent = newContent.replace(targetReturn, replacementReturn);

fs.writeFileSync('src/components/ERP.tsx', newContent);
console.log('Replaced successfully');
