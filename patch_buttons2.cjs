const fs = require('fs');

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// The generic gradient replaced earlier was:
content = content.replace(
  /bg-gradient-to-r from-blue-600 to-indigo-600/g,
  'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md'
);

content = content.replace(
  /hover:-from-blue-700 hover:to-indigo-700/g,
  'hover:opacity-90'
);

// We also replaced some specific cards, maybe we can animate them too:
content = content.replace(
  /from-\[#f43f5e\] to-\[#fb7185\]/g,
  'from-[#f43f5e] via-[#fb7185] to-[#f43f5e] bg-[length:200%_200%] animate-gradient'
);

content = content.replace(
  /from-\[#06b6d4\] to-\[#22d3ee\]/g,
  'from-[#06b6d4] via-[#22d3ee] to-[#06b6d4] bg-[length:200%_200%] animate-gradient'
);

content = content.replace(
  /from-\[#0ea5e9\] to-\[#38bdf8\]/g,
  'from-[#0ea5e9] via-[#38bdf8] to-[#0ea5e9] bg-[length:200%_200%] animate-gradient'
);

content = content.replace(
  /from-\[#e11d48\] to-\[#f43f5e\]/g,
  'from-[#e11d48] via-[#f43f5e] to-[#e11d48] bg-[length:200%_200%] animate-gradient'
);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log('patched all gradients to be dynamic');
