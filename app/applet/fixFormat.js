const fs = require('fs');
let content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const s1 = "formatter={(value: number) => `${value.toLocaleString('vi-VN')} đ`}";
const r1 = "formatter={((value: number) => `${value.toLocaleString('vi-VN')} đ`) as any}";
content = content.replace(s1, r1);

const s2 = "formatter={(value: number) => [value.toLocaleString('vi-VN') + ' đ', language === 'vi' ? 'Doanh thu' : 'Revenue']}";
const r2 = "formatter={((value: number) => [value.toLocaleString('vi-VN') + ' đ', language === 'vi' ? 'Doanh thu' : 'Revenue']) as any}";
content = content.replace(s2, r2);

const s3 = "formatter={(value: number, name: string) => [";
const r3 = "formatter={((value: number, name: string) => [";
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('formatter={(value: number, name: string) => [')) {
       lines[i] = lines[i].replace('formatter={(value: number, name: string) => [', 'formatter={((value: any, name: any) => [');
   }
}

fs.writeFileSync('src/components/ERP.tsx', lines.join('\n'));
console.log('patched ERP');
