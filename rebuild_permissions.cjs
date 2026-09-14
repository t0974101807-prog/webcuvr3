const fs = require('fs');

const columns = [
  'manageUsers',
  'viewAllRecords',
  'editAllRecords',
  'deleteRecords',
  'viewPersonalRecords',
  'editPersonalRecords',
  'manageLegalDocs',
  'manageEvents',
  'viewEventHistory',
  'viewReports',
  'manageFinance',
  'manageWeb'
];

const roles = [
  'admin', 'director', 'deputyDirector', 'headOfDept', 'manager', 
  'prosecutor', 'lawyer', 'specialist', 
  'accountant', 'editor', 'traineeLawyer', 'intern'
];

let content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

let newThead = `<tr>
                <th className="px-4 py-4 font-bold text-slate-700 text-left text-xs leading-tight w-48">
                  {t.role}
                </th>
                <th className="px-4 py-4 font-bold text-slate-700 text-left text-xs leading-tight w-1/4">
                  {t.description}
                </th>\n`;
columns.forEach(col => {
  newThead += `                <th className="px-2 py-4 font-bold text-slate-700 text-center text-xs leading-tight w-24">
                  {t.${col}}
                </th>\n`;
});
newThead += `              </tr>`;

const viewOffset = content.indexOf('function PermissionsView');
const theadStart = content.indexOf('<thead>', viewOffset);
const theadEnd = content.indexOf('</thead>', theadStart) + 8;
content = content.substring(0, theadStart) + '<thead>\n              ' + newThead + '\n            </thead>' + content.substring(theadEnd);


let newTbody = `<tbody className="divide-y divide-slate-200">\n`;

roles.forEach(role => {
  newTbody += `              <tr className="hover:bg-slate-50/50 transition-all duration-300">
                <td className="px-4 py-6 font-bold text-slate-800">
                  {t.${role}}
                </td>
                <td className="px-4 py-6 text-slate-600 font-medium">
                  {(t as any)['${role}Desc'] || ''}
                </td>\n`;
  columns.forEach(col => {
    newTbody += `                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon("${role}", "${col}")}
                </td>\n`;
  });
  newTbody += `              </tr>\n`;
});
newTbody += `            </tbody>`;

const tbodyStart = content.indexOf('<tbody className="divide-y divide-slate-200">', viewOffset);
const tbodyEnd = content.indexOf('</tbody>', tbodyStart) + 8;
content = content.substring(0, tbodyStart) + newTbody + content.substring(tbodyEnd);

fs.writeFileSync('src/components/ERP.tsx', content);
