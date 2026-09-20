const fs = require('fs');
let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// Replace standard solid colors on Nhập Excel and Xuất Excel with dynamic gradient
const dynamicGradientClasses = "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90";

// Replace in RecordsView (Danh sách hồ sơ)
content = content.replace(
  'className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg transition-all duration-300 hover:bg-green-700 font-medium transition-all duration-300 active:scale-95 shadow-sm"',
  `className="flex items-center gap-2 px-4 py-2 ${dynamicGradientClasses} text-white rounded-lg font-medium transition-all duration-300 active:scale-95"`
);

content = content.replace(
  'className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-all duration-300 hover:bg-blue-700 font-medium transition-all duration-300 active:scale-95 shadow-sm"',
  `className="flex items-center gap-2 px-4 py-2 ${dynamicGradientClasses} text-white rounded-lg font-medium transition-all duration-300 active:scale-95"`
);

// Replace in Dữ liệu (Employees View)
content = content.replace(
  'className="flex items-center gap-2 px-4 py-2 bg-[#00B85E] text-white rounded-lg transition-all duration-300 hover:bg-[#00a353] transition-all duration-300 active:scale-95 font-medium text-sm"',
  `className="flex items-center gap-2 px-4 py-2 ${dynamicGradientClasses} text-white rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm"`
);

content = content.replace(
  'className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg transition-all duration-300 hover:bg-[#1d4ed8] transition-all duration-300 active:scale-95 font-medium text-sm"',
  `className="flex items-center gap-2 px-4 py-2 ${dynamicGradientClasses} text-white rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm"`
);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log('patched excel buttons');
