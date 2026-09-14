const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update headerInfo state
content = content.replace(
  /const \[headerInfo, setHeaderInfo\] = useState<\{title: string, subtitle: React\.ReactNode\} \| null>\(null\);/,
  "const [headerInfo, setHeaderInfo] = useState<{title: string, subtitle: React.ReactNode, rightContent?: React.ReactNode} | null>(null);"
);

// 2. Update the header render block in ERP view
const oldHeaderRender = `{headerInfo && activeTab === "events" ? (
              <div className="flex flex-col">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--color-text-dark)] font-serif line-clamp-1">
                  {headerInfo.title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-600 hidden sm:flex mt-1">
                  <CalendarDays size={16} className="text-slate-400" />
                  <div>{headerInfo.subtitle}</div>
                </div>
              </div>
            ) : (`;

const newHeaderRender = `{headerInfo && activeTab === "events" ? (
              <div className="flex flex-col w-full">
                <div className="flex lg:items-center flex-col lg:flex-row gap-4 justify-between w-full">
                   <div className="flex flex-col">
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--color-text-dark)] font-serif line-clamp-1 flex items-center gap-4 hidden sm:flex">
                         {headerInfo.title}
                         {headerInfo.rightContent && (
                            <div className="hidden sm:block">
                               {headerInfo.rightContent}
                            </div>
                         )}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-600 hidden sm:flex mt-1">
                        <CalendarDays size={16} className="text-slate-400" />
                        <div>{headerInfo.subtitle}</div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (`;

if (content.includes(oldHeaderRender)) {
  content = content.replace(oldHeaderRender, newHeaderRender);
} else {
  // alternative matching
  const fallbackMatch = /\{headerInfo && activeTab === "events" \? \([\s\S]*?\) :\s*\(/;
  if(content.match(fallbackMatch)) {
     content = content.replace(fallbackMatch, newHeaderRender);
  }
}

// 3. Instead of parsing the two useEffects in EventsView, let's just find and replace them entirely.
// Find getWeekRangeString
// ...
// Actually, `EventsView` has a lot of code, let's use regex to replace BOTH `useEffect`s that call `setHeaderInfo`.
// The first one:
const useEffect1 = /useEffect\(\(\) => \{\s*if \(setHeaderInfo\) \{\s*setHeaderInfo\(\{\s*title: t\.title,\s*subtitle: \([\s\S]*?\)\s*\}\);\s*\}\s*\}, \[t\.title, currentDate, language, setHeaderInfo\]\);/;

const replaceEffect1 = `/* Removed old useEffect */`;
content = content.replace(useEffect1, replaceEffect1);

const useEffect2 = /useEffect\(\(\) => \{\s*if \(setHeaderInfo\) \{\s*setHeaderInfo\(\{\s*title: t\.title,\s*subtitle: getWeekRangeString\(\),\s*\}\);\s*\}\s*\}, \[t\.title, calendarViewMode, currentDate\.getTime\(\), language, setHeaderInfo\]\);/;

const newCombinedEffect = \`
  useEffect(() => {
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
  }, [t.title, calendarViewMode, currentDate.getTime(), language, setHeaderInfo]);
\`;

content = content.replace(useEffect2, newCombinedEffect);


// 4. Move "Thứ Năm 04/06/2026" up in the container!
// We will look for: <div className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
// Wait, the "Thứ Năm" box MUST be there. Let's find it.
// The user says "Thứ hãy dời lên bằng với dòng đỏ bên phải", the red line is basically under the search/avatar row.
// Let's replace the whole top header section inside EventsView:

fs.writeFileSync(path, content, 'utf8');
console.log("Patched headers");
