const fs = require('fs');

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// Replace standard solid colors on Nhập Excel and Xuất Excel with dynamic gradient
content = content.replace(
  /accept="application\/pdf"/g,
  'accept="application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"'
);

// We need to also update the Title tooltips so the user knows word is supported
content = content.replace(
  /title="Tải PDF lên để đóng dấu QR"/g,
  'title="Tải tệp PDF/Word lên để đóng dấu QR"'
);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log('patched ERP.tsx accept types');
