const fs = require('fs');
const filePath = 'src/components/ERP.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const tBodyStart = content.indexOf('<tbody className="divide-y divide-slate-200">');
if (tBodyStart === -1) {
    console.error("Could not find tbody start");
    process.exit(1);
}

const tableEnd = content.indexOf('</table>', tBodyStart);
if (tableEnd === -1) {
    console.error("Could not find table end");
    process.exit(1);
}

const replacement = `<tbody className="divide-y divide-slate-200">
              {[
                "admin",
                "director",
                "deputyDirector",
                "headOfDept",
                "manager",
                "lawyer",
                "specialist",
                "accountant",
                "prosecutor",
                "editor",
                "traineeLawyer",
                "intern",
              ].map(role => (
              <tr key={role} className="hover:bg-slate-50/50 transition-all duration-300">
                <td className="px-4 py-6 font-bold text-slate-800">
                  {(t as any)[role]}
                </td>
                <td className="px-4 py-6 text-slate-600 font-medium">
                  {(t as any)[role + 'Desc'] || ''}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "manageUsers")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "manageWeb")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "manageEvents")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "manageFinance")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "manageLegalDocs")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "editPersonalRecords")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "editAllRecords")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "viewReports")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "viewPersonalRecords")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "viewEventHistory")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "viewAllRecords")}
                </td>
                <td className="px-2 py-6 text-center border-l whitespace-nowrap border-slate-100">
                  {renderIcon(role, "deleteRecords")}
                </td>
              </tr>
              ))}
            </tbody>
          `;

const newContent = content.substring(0, tBodyStart) + replacement + content.substring(tableEnd);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully replaced table body");
