import fs from 'fs';
let content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

content = content.replace(
  'setEvents([...events, newEvent]);',
  "setEvents([...events, newEvent]);\n      setHistory(h => [{ action: 'Thêm', title: eventFormData.title, user: user?.name || user?.username || 'Chưa rõ', time: new Date().toLocaleString('vi-VN') }, ...h]);"
);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log("Patched setHistory");
