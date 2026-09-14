const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const clientsTabIdx = content.indexOf("{/* Clients Tab */}");
if (clientsTabIdx > -1) {
  const selectStartCode = `<label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                              <select
                                value={editingUser?.role || 'user'}`;
  
  const targetIdx = content.indexOf(selectStartCode, clientsTabIdx);

  if (targetIdx > -1) {
     const selectEndCode = `</select>`;
     const targetEndIdx = content.indexOf(selectEndCode, targetIdx) + selectEndCode.length;
     
     const replacement = `<label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                              <select
                                value="client"
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 outline-none"
                              >
                                <option value="client">Client (Khách hàng)</option>
                              </select>`;
                              
     content = content.substring(0, targetIdx) + replacement + content.substring(targetEndIdx);
     fs.writeFileSync('src/components/AdminDashboard.tsx', content);
     console.log("Replaced successfully!");
  } else {
     console.error("target select not found");
  }
} else {
  console.error("clients tab not found");
}
