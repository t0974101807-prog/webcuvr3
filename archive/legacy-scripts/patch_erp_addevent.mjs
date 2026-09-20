import fs from 'fs';
let content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const target = `<button \n              onClick={() => {\n                setEventFormData({\n                  id: null,\n                  title: '',\n                  type: 'Khác',\n                  startDate: '',\n                  startTime: '09:00',\n                  endDate: '',\n                  endTime: '10:00',\n                  location: '',\n                });\n                setShowAddEvent(true);\n              }}\n              className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg transition-all duration-300 hover:bg-blue-700 font-medium transition-all duration-300 active:scale-95 whitespace-nowrap"\n            >\n              <Plus size={18} />\n              {t.addEvent}\n            </button>`;

const replacement = `{canManageEvents && (\n            <button \n              onClick={() => {\n                setEventFormData({\n                  id: null,\n                  title: '',\n                  type: 'Khác',\n                  startDate: '',\n                  startTime: '09:00',\n                  endDate: '',\n                  endTime: '10:00',\n                  location: '',\n                });\n                setShowAddEvent(true);\n              }}\n              className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg transition-all duration-300 hover:bg-blue-700 font-medium transition-all duration-300 active:scale-95 whitespace-nowrap"\n            >\n              <Plus size={18} />\n              {t.addEvent}\n            </button>\n            )}`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log("Patched ERP AddEvent");
