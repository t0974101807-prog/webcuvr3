const fs = require('fs');
const filePath = 'src/components/ERP.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\{\(t as any\)\[role\]\}/g, "{(t as any)[language][role]}");
content = content.replace(/\{\(t as any\)\[role \+ 'Desc'\] \|\| ''\}/g, "{(t as any)[language][role + 'Desc'] || ''}");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced t access.");
