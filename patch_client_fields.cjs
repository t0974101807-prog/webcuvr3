const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const clientsTabIdx = content.indexOf("{/* Clients Tab */}");
if (clientsTabIdx !== -1) {
    // The previous field is Vai trò
    const vaiTroIdx = content.indexOf('<option value="client">Client (Khách hàng)</option>', clientsTabIdx);
    
    // Let's find the first <div className="flex justify-end gap-3 pt-4"> AFTER vaiTroIdx.
    const endDivIdx = content.indexOf('<div className="flex justify-end gap-3 pt-4">', vaiTroIdx);
    // The start is the </div> right after the Vai trò select.
    const vaiTroEndIdx = content.indexOf('</div>', vaiTroIdx) + 6;
    
    const blockToReplace = content.substring(vaiTroEndIdx, endDivIdx);
    const newBlock = `
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mã hồ sơ (Case ID)</label>
                              <div className="relative">
                                {/* Type icon not imported if we use a different one, but Type is imported. */}
                                <input
                                  type="text"
                                  value={editingUser?.case_id || ''}
                                  onChange={(e) => setEditingUser({ ...editingUser, case_id: e.target.value })}
                                  placeholder="Mã hồ sơ liên kết"
                                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">Khách hàng sẽ chỉ xem được hồ sơ có mã này.</p>
                            </div>
                          </div>
                          `;
                          
    content = content.substring(0, vaiTroEndIdx) + newBlock + content.substring(endDivIdx);
    fs.writeFileSync('src/components/AdminDashboard.tsx', content);
    console.log("Successfully replaced client fields");
} else {
    console.log("Could not find Clients Tab");
}
