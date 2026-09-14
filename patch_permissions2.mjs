import fs from 'fs';

let content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// 1. Add defaults in fillData
content = content.replace(
  "editPersonalRecords: false\n            };",
  "editPersonalRecords: false, manageEvents: false, manageLegalDocs: false\n            };"
);

// 2. Add translations
content = content.replace(
  "editPersonalRecords: 'SỬA HỒ SƠ CÁ NHÂN',",
  "editPersonalRecords: 'SỬA HỒ SƠ CÁ NHÂN',\n      manageEvents: 'QUẢN LÝ SỰ KIỆN',\n      manageLegalDocs: 'QUẢN LÝ VĂN BẢN PL',"
);

content = content.replace(
  "editPersonalRecords: 'EDIT PERSONAL RECORDS',",
  "editPersonalRecords: 'EDIT PERSONAL RECORDS',\n      manageEvents: 'MANAGE EVENTS',\n      manageLegalDocs: 'MANAGE LEGAL DOCS',"
);

// 3. Add table headers
content = content.replace(
  '<th className="px-2 py-4 font-bold text-slate-700 text-center text-xs leading-tight w-24">{t.editPersonalRecords}</th>',
  '<th className="px-2 py-4 font-bold text-slate-700 text-center text-xs leading-tight w-24">{t.editPersonalRecords}</th>\n                <th className="px-2 py-4 font-bold text-slate-700 text-center text-xs leading-tight w-24">{t.manageEvents}</th>\n                <th className="px-2 py-4 font-bold text-slate-700 text-center text-xs leading-tight w-24">{t.manageLegalDocs}</th>'
);

// 4. Add table cells for each role
const roles = ['admin', 'director', 'deputyDirector', 'headOfDept', 'manager', 'prosecutor', 'lawyer', 'specialist', 'accountant', 'editor', 'traineeLawyer', 'intern'];

roles.forEach(role => {
  const target = `<td className="px-2 py-6 text-center">{renderIcon('${role}', 'editPersonalRecords')}</td>`;
  const replacement = `${target}\n                <td className="px-2 py-6 text-center">{renderIcon('${role}', 'manageEvents')}</td>\n                <td className="px-2 py-6 text-center">{renderIcon('${role}', 'manageLegalDocs')}</td>`;
  content = content.split(target).join(replacement);
});

fs.writeFileSync('src/components/ERP.tsx', content);
console.log("Patched ERP.tsx");
