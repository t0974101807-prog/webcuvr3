import fs from 'fs';
let content = fs.readFileSync('src/components/FloatingActions.tsx', 'utf-8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/FloatingActions.tsx', content);

let adminContent = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
adminContent = adminContent.replace(/\\`/g, '`');
adminContent = adminContent.replace(/\\\$/g, '$');
fs.writeFileSync('src/components/AdminDashboard.tsx', adminContent);
