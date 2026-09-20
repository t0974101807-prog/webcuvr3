const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

const useEffect1 = /useEffect\(\(\) => \{\s*if \(setHeaderInfo\) \{\s*setHeaderInfo\(\{\s*title: t\.title,\s*subtitle: \([\s\S]*?\)\s*\}\);\s*\}\s*\}, \[t\.title, currentDate, language, setHeaderInfo\]\);/;

const replaceEffect1 = `/* Removed old useEffect */`;
content = content.replace(useEffect1, replaceEffect1);

const useEffect2 = /useEffect\(\(\) => \{\s*if \(setHeaderInfo\) \{\s*setHeaderInfo\(\{\s*title: t\.title,\s*subtitle: getWeekRangeString\(\),\s*\}\);\s*\}\s*\}, \[t\.title, calendarViewMode, currentDate\.getTime\(\), language, setHeaderInfo\]\);/;

const newCombinedEffect = `  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: t.title,
        subtitle: getWeekRangeString(),
        rightContent: (
          <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden text-sm shrink-0">
            <div className="relative h-[32px] flex items-center hover:bg-slate-50 transition-all duration-300 border-r border-slate-200 bg-white">
              <select
                value={currentDate.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(parseInt(e.target.value));
                  setCurrentDate(newDate);
                  const day = newDate.getDay();
                  setSelectedDayIndex(day === 0 ? 6 : day - 1);
                }}
                className="pl-3 pr-8 h-full text-slate-700 outline-none bg-transparent cursor-pointer font-medium appearance-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {language === "vi" ? \`Tháng \${i + 1}\` : \`Month \${i + 1}\`}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative h-[32px] flex items-center hover:bg-slate-50 transition-all duration-300 bg-white">
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(parseInt(e.target.value));
                  setCurrentDate(newDate);
                  const day = newDate.getDay();
                  setSelectedDayIndex(day === 0 ? 6 : day - 1);
                }}
                className="pl-3 pr-8 h-full text-slate-700 outline-none bg-transparent cursor-pointer font-medium appearance-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                {Array.from({ length: 11 }).map((_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} className="absolute right-2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        )
      });
    }
  }, [t.title, calendarViewMode, currentDate.getTime(), language, setHeaderInfo]);`;

content = content.replace(useEffect2, newCombinedEffect);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched headers logic");
