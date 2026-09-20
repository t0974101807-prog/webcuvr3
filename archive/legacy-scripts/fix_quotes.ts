import fs from 'fs';

for (const file of ['src/components/Services.tsx', 'src/components/LegalServices.tsx']) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/cursor-pointer"" onClick/g, 'cursor-pointer" onClick');
  fs.writeFileSync(file, content);
}
