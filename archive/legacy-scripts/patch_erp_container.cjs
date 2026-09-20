const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Move "Thứ Năm" to the search bar row.
// The search bar row starts at:
// <div className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">

// And the "Thứ Năm" block:
/*
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] p-3 rounded-xl">
              <CalendarDays size={28} />
            </div>
            <div className="text-center sm:text-left text-[var(--color-primary)] font-serif tracking-tight flex flex-col justify-center">
              {(() => {
                const dayNamesVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
                const dayName = language === "vi" ? dayNamesVi[currentDate.getDay()] : currentDate.toLocaleString("en-US", { weekday: 'long' });
                const dateString = language === "vi" 
                  ? \`\${String(currentDate.getDate()).padStart(2, "0")}/\${String(currentDate.getMonth() + 1).padStart(2, "0")}/\${currentDate.getFullYear()}\`
                  : \`\${currentDate.toLocaleString("en-US", { month: 'short' })} \${String(currentDate.getDate()).padStart(2, "0")}, \${currentDate.getFullYear()}\`;
                
                return (
                  <>
                    <span className="font-bold text-2xl md:text-3xl">{dayName}</span>
                    <span className="text-lg md:text-xl opacity-90 font-medium">{dateString}</span>
                  </>
                );
              })()}
            </div>
          </div>
*/

const searchRowRegex = /<div className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">([\s\S]*?)<div className="px-6 pb-4 flex flex-col gap-4 shrink-0 mt-2">/s;

const dayBlock = \`
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-200">
              <CalendarDays size={24} />
            </div>
            <div className="text-center sm:text-left text-slate-800 font-serif tracking-tight flex flex-col justify-center">
              {(() => {
                const dayNamesVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
                const dayName = language === "vi" ? dayNamesVi[currentDate.getDay()] : currentDate.toLocaleString("en-US", { weekday: 'long' });
                const dateString = language === "vi" 
                  ? \`\${String(currentDate.getDate()).padStart(2, "0")}/\${String(currentDate.getMonth() + 1).padStart(2, "0")}/\${currentDate.getFullYear()}\`
                  : \`\${currentDate.toLocaleString("en-US", { month: 'short' })} \${String(currentDate.getDate()).padStart(2, "0")}, \${currentDate.getFullYear()}\`;
                return (
                  <>
                    <span className="font-bold text-xl md:text-2xl leading-none">{dayName}</span>
                    <span className="text-sm md:text-base opacity-70 font-medium">{dateString}</span>
                  </>
                );
              })()}
            </div>
          </div>
\`;

const oldRowContent = content.match(searchRowRegex);
if(oldRowContent) {
   let replacingSearch = oldRowContent[0].replace(
      'justify-end', 
      'justify-between border-b border-slate-100' // added justify-between and border
   );
   
   // insert dayBlock before the old children
   replacingSearch = replacingSearch.replace(
      '<div className="flex items-center gap-3">',
      dayBlock + '\\n          <div className="flex items-center gap-3">'
   );

   content = content.replace(searchRowRegex, replacingSearch);
} else {
   console.log("Could not find search row regex");
}

// 2. Remove the old day block from Navigation actions
const oldDayBlockPattern = /<div className="px-6 pb-4 flex flex-col gap-4 shrink-0 mt-2">\s*<div className="flex items-center gap-3">\s*<div className="bg-\[var\(--color-primary\)\]\/10[\s\S]*?<\/div>\s*<\/div>\s*<div className="flex flex-wrap items-center justify-between gap-4 mt-2">/s;

if(content.match(oldDayBlockPattern)) {
   content = content.replace(
       oldDayBlockPattern,
       '<div className="px-6 pb-4 flex flex-col gap-4 shrink-0 mt-2 border-b border-slate-100 py-2 bg-slate-50/50">\n          <div className="flex flex-wrap items-center justify-between gap-4">'
   );
} else {
   console.log("Could not find old day block pattern");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Patched container");
