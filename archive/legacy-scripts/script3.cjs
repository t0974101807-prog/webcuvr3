const fs = require('fs');
const content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const targetStr = `  const [view, setView] = useState<'year' | 'month'>('year');`;
const replacementStr = `  const [view, setView] = useState<'year' | 'month' | 'day'>('year');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);`;

const targetStr2 = `  const renderMonthView = () => {`;
const replacementStr2 = `  const renderDayView = () => {
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
                <div key={i} className="flex flex-col items-center cursor-pointer" onClick={() => {
                  if (wd.month === currentMonth) {
                    setSelectedDay(wd.day);
                  } else {
                    setCurrentMonth(wd.month);
                    setCurrentYear(wd.year);
                    setSelectedDay(wd.day);
                  }
                }}>
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-lg font-medium",
                    isSelected ? "bg-red-500 text-white" : wd.isCurrentMonth ? "text-slate-900" : "text-slate-400"
                  )}>
                    {wd.day}
                  </div>
                  <div className={cn(
                    "text-[10px] mt-1",
                    isFirstLunar ? "text-red-500 font-medium" : "text-slate-400"
                  )}>
                    {isFirstLunar ? \`Thg \${wd.lunar.month}\` : wd.lunar.day}
                  </div>
                  {/* Mock event dots */}
                  {wd.day % 3 === 0 && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1"></div>}
                </div>
              );
            })}
          </div>
          
          {/* Selected Date Header */}
          <div className="py-3 text-center border-b border-slate-200 bg-slate-50/50">
            <div className="font-bold text-slate-900">
              {t.dayNames[selectedDayOfWeek]} - {selectedDay} {t.months[currentMonth].toLowerCase()}, {currentYear}
            </div>
            <div className="text-sm text-slate-500">
              {lunar.day}/{lunar.month} {t.lunarYear}
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
  };

  const renderMonthView = () => {`;

const targetStr3 = `                          <div key={day} className="min-h-[80px] p-1 flex flex-col items-center relative border-r border-slate-100 last:border-r-0">`;
const replacementStr3 = `                          <div key={day} onClick={() => { setSelectedDay(day); setView('day'); }} className="min-h-[80px] p-1 flex flex-col items-center relative border-r border-slate-100 last:border-r-0 cursor-pointer hover:bg-slate-50 transition-colors">`;

const targetStr4 = `        {view === 'year' ? renderYearView() : renderMonthView()}`;
const replacementStr4 = `        {view === 'year' ? renderYearView() : view === 'month' ? renderMonthView() : renderDayView()}`;


let newContent = content;
if (newContent.includes(targetStr)) newContent = newContent.replace(targetStr, replacementStr);
if (newContent.includes(targetStr2)) newContent = newContent.replace(targetStr2, replacementStr2);
if (newContent.includes(targetStr3)) newContent = newContent.replace(targetStr3, replacementStr3);
if (newContent.includes(targetStr4)) newContent = newContent.replace(targetStr4, replacementStr4);

fs.writeFileSync('src/components/ERP.tsx', newContent);
console.log('Replaced successfully');
