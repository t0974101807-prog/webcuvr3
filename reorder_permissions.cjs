const fs = require('fs');
const content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

const columns = [
  'manageUsers',
  'manageWeb',
  'manageEvents',
  'manageFinance',
  'manageLegalDocs',
  'editPersonalRecords',
  'editAllRecords',
  'viewReports',
  'viewPersonalRecords',
  'viewEventHistory',
  'viewAllRecords',
  'deleteRecords'
];

let newHeader = `          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-4 font-bold text-slate-700 text-left text-xs leading-tight w-48">
                  {t.role}
                </th>
                <th className="px-4 py-4 font-bold text-slate-700 text-left text-xs leading-tight w-1/4">
                  {t.description}
                </th>
${columns.map(col => `                <th className="px-2 py-4 font-bold text-slate-700 text-center text-xs leading-tight w-24">
                  {t.${col}}
                </th>`).join('\n')}
              </tr>
            </thead>`;

const rows = [
  'editor',
  'specialist',
  'director',
  'accountant',
  'prosecutor',
  'lawyer',
  'traineeLawyer',
  'deputyDirector',
  'manager',
  'admin',
  'intern',
  'headOfDept'
];

let newBody = `\n            <tbody className="divide-y divide-slate-200">
${rows.map(row => `              <tr className="hover:bg-slate-50/50 transition-all duration-300">
                <td className="px-4 py-6 font-bold text-slate-800">
                  {t.${row}}
                </td>
                <td className="px-4 py-6 text-slate-600 font-medium">
                  {(t as any)['${row}Desc'] || ''}
                </td>
${columns.map(col => `                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon("${row}", "${col}")}
                </td>`).join('\n')}
              </tr>`).join('\n')}
            </tbody>
          </table>`;

const tableRegex = /<table className="w-full min-w-max text-left text-sm">[\s\S]*?<\/table>/;
const newContent = content.replace(tableRegex, newHeader + newBody);
fs.writeFileSync('src/components/ERP.tsx', newContent);
console.log('Replaced table successfully.');
