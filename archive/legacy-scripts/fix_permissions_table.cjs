const fs = require('fs');
const filePath = 'src/components/ERP.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const permTableStart = content.indexOf('{t.systemPermissions}', 10000);
if(permTableStart === -1) {
  console.log("Could not find permissions start");
  process.exit(1);
}

const tBodyStart = content.indexOf('<tbody', permTableStart);
const tBodyEnd = content.indexOf('</tbody>', tBodyStart) + 8;

const loopContent = `<tbody className="divide-y divide-slate-200">
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
                  {((t as any)[language] as any)[role]}
                </td>
                <td className="px-4 py-6 text-slate-600 font-medium">
                  {((t as any)[language] as any)[role + 'Desc'] || ''}
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
            </tbody>`;

content = content.substring(0, tBodyStart) + loopContent + content.substring(tBodyEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced PermissionsView table.");
