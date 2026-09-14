import fs from 'fs';
let content = fs.readFileSync('src/components/CustomCalendar.tsx', 'utf8');

content = content.replace(
  '<button \n                onClick={handleAddEvent}\n                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"\n              >\n                <Plus size={20} />\n              </button>',
  '{canManageEvents && (\n              <button \n                onClick={handleAddEvent}\n                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"\n              >\n                <Plus size={20} />\n              </button>\n            )}'
);

content = content.split(
  '<button \n              onClick={handleAddEvent}\n              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"\n            >\n              <Plus size={20} />\n            </button>'
).join(
  '{canManageEvents && (\n              <button \n                onClick={handleAddEvent}\n                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"\n              >\n                <Plus size={20} />\n              </button>\n            )}'
);

fs.writeFileSync('src/components/CustomCalendar.tsx', content);
console.log("Patched CustomCalendar.tsx");
