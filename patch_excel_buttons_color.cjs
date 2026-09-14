const fs = require('fs');
let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

const importGradient = "bg-gradient-to-r from-[#10b981] via-[#14b8a6] to-[#059669] bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide";
const exportGradient = "bg-gradient-to-r from-[#3b82f6] via-[#0ea5e9] to-[#2563eb] bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide";
const addGradient = "bg-gradient-to-r from-[#8b5cf6] via-[#d946ef] to-[#9333ea] bg-[length:200%_200%] animate-gradient shadow-md hover:opacity-90 tracking-wide"; 

// importExcel in RecordsView
content = content.replace(
  /<button\s+onClick=\{\(\) => fileInputRef\.current\?\.click\(\)\}\s+className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-\[length:200%_200%\] animate-gradient shadow-md hover:opacity-90 text-white rounded-lg font-medium transition-all duration-300 active:scale-95"/g,
  `<button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 ${importGradient} text-white rounded-lg font-medium transition-all duration-300 active:scale-95"`
);

// exportExcel in RecordsView
content = content.replace(
  /<button\s+onClick=\{handleExport\}\s+className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-\[length:200%_200%\] animate-gradient shadow-md hover:opacity-90 text-white rounded-lg font-medium transition-all duration-300 active:scale-95"/g,
  `<button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 ${exportGradient} text-white rounded-lg font-medium transition-all duration-300 active:scale-95"`
);

// exportExcel in Personnel View
content = content.replace(
  /<button onClick=\{\(\) => alert\(t\.exportAlert \|\| 'Tính năng đang được phát triển'\)\} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-\[length:200%_200%\] animate-gradient shadow-md hover:opacity-90 text-white rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm">/g,
  `<button onClick={() => alert(t.exportAlert || 'Tính năng đang được phát triển')} className="flex items-center gap-2 px-4 py-2 ${exportGradient} text-white rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm">`
);

// importExcel in Personnel View
content = content.replace(
  /<button onClick=\{\(\) => alert\(t\.importAlert \|\| 'Tính năng đang được phát triển'\)\} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-\[length:200%_200%\] animate-gradient shadow-md hover:opacity-90 text-white rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm">/g,
  `<button onClick={() => alert(t.importAlert || 'Tính năng đang được phát triển')} className="flex items-center gap-2 px-4 py-2 ${importGradient} text-white rounded-lg transition-all duration-300 active:scale-95 font-medium text-sm">`
);

// addRecord (Thêm mới) in RecordsView
content = content.replace(
  /className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-\[length:200%_200%\] animate-gradient shadow-md text-white rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-300 active:scale-95"/g,
  `className="flex items-center gap-2 px-4 py-2 ${addGradient} text-white rounded-lg font-medium transition-all duration-300 active:scale-95"`
);

// activeTab === tab
content = content.replace(
  /tab === 'overdue' \? "bg-red-600 text-white shadow-sm" : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-\[length:200%_200%\] animate-gradient shadow-md text-white shadow-sm"/g,
  `tab === 'overdue' ? "bg-red-600 text-white shadow-sm" : "${addGradient} text-white shadow-sm"`
);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log('patched correct gradients');
