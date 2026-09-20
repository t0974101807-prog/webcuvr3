const fs = require('fs');

// --- 1. Fix src/utils/contractUtils.ts (File Upload Error with fetch -> base64 decode) ---
let utilsContent = fs.readFileSync('src/utils/contractUtils.ts', 'utf-8');
utilsContent = utilsContent.replace(
  /const qrImageBytes = await fetch\(qrDataUrl\)\.then\(res => res\.arrayBuffer\(\)\);/g,
  `const base64Data = qrDataUrl.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const qrImageBytes = bytes.buffer;`
);
fs.writeFileSync('src/utils/contractUtils.ts', utilsContent);
console.log('Patched contractUtils.ts for PDF upload');

// --- 2. Fix src/components/ERP.tsx ---
let erpContent = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// A. Fix the dark ID badges (Hình 1)
// Replace "from-slate-800 to-slate-700" with a dynamic gradient
erpContent = erpContent.replace(
  /bg-gradient-to-r from-slate-800 to-slate-700/g,
  'bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] bg-[length:200%_200%] animate-gradient'
);

// Remove "border border-slate-700" from the last badge replacement just to be safe
erpContent = erpContent.replace(/border border-slate-700/g, 'border border-blue-400/30');

// B. Fix the personnel stats cards (Hình 2)
// 1. Tổng nhân sự (Blue)
erpContent = erpContent.replace(
  /<div className="bg-blue-50 border border-blue-200 rounded-xl p-4">/g,
  '<div className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-blue-400/50">'
);
erpContent = erpContent.replace(
  /<div className="text-blue-600 text-sm font-semibold mb-1">/g,
  '<div className="text-white\/90 text-sm font-medium mb-1 drop-shadow-sm">'
);
erpContent = erpContent.replace(
  /<div className="text-3xl font-bold text-blue-700">/g,
  '<div className="text-3xl font-bold text-white drop-shadow-md">'
);

// 2. Số phòng ban (Green)
erpContent = erpContent.replace(
  /<div className="bg-green-50 border border-green-200 rounded-xl p-4">/g,
  '<div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-emerald-400/50">'
);
erpContent = erpContent.replace(
  /<div className="text-green-600 text-sm font-semibold mb-1">/g,
  '<div className="text-white\/90 text-sm font-medium mb-1 drop-shadow-sm">'
);
erpContent = erpContent.replace(
  /<div className="text-3xl font-bold text-green-700">/g,
  '<div className="text-3xl font-bold text-white drop-shadow-md">'
);

// 3. Số chức danh (Amber)
erpContent = erpContent.replace(
  /<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">/g,
  '<div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-amber-400/50">'
);
erpContent = erpContent.replace(
  /<div className="text-amber-600 text-sm font-semibold mb-1">/g,
  '<div className="text-white\/90 text-sm font-medium mb-1 drop-shadow-sm">'
);
erpContent = erpContent.replace(
  /<div className="text-3xl font-bold text-amber-700">/g,
  '<div className="text-3xl font-bold text-white drop-shadow-md">'
);

// 4. Nhân sự xem (Purple)
erpContent = erpContent.replace(
  /<div className="bg-purple-50 border border-purple-200 rounded-xl p-4">/g,
  '<div className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-purple-400/50">'
);
erpContent = erpContent.replace(
  /<div className="text-purple-600 text-sm font-semibold mb-1">/g,
  '<div className="text-white\/90 text-sm font-medium mb-1 drop-shadow-sm">'
);
erpContent = erpContent.replace(
  /<div className="text-3xl font-bold text-purple-700">/g,
  '<div className="text-3xl font-bold text-white drop-shadow-md">'
);

fs.writeFileSync('src/components/ERP.tsx', erpContent);
console.log('Patched ERP.tsx');
