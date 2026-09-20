import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Ensure related_service is part of editingNews initialization
content = content.replace(
  /setEditingNews\(\{ id: 0, title: '', description: '', icon: 'FileText', category: 'TIN TỨC' \}\);/g,
  `setEditingNews({ id: 0, title: '', description: '', icon: 'FileText', category: 'TIN TỨC', related_service: '' });`
);

const selectSearch = `<label className="block text-sm font-medium text-gray-700 mb-1">Doanh mục / Liên kết dịch vụ</label>
                              <select
                                value={editingNews?.category || 'TIN TỨC'}
                                onChange={(e) => setEditingNews({ ...editingNews!, category: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              >
                                <optgroup label="Danh mục chung">
                                  <option value="TIN TỨC">TIN TỨC</option>
                                  <option value="SỰ KIỆN">SỰ KIỆN</option>
                                  <option value="THÔNG BÁO">THÔNG BÁO</option>
                                  <option value="TRUYỀN THÔNG">TRUYỀN THÔNG</option>
                                </optgroup>
                                <optgroup label="Lĩnh vực hoạt động">
                                  {services.map(s => (
                                    <option key={\`service-\${s.id}\`} value={s.title}>{s.title}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Dịch vụ pháp lý">
                                  {legalServices.map(l => (
                                    <option key={\`legal-\${l.id}\`} value={l.title}>{l.title}</option>
                                  ))}
                                </optgroup>
                              </select>`;

const selectReplace = `<div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại bài viết</label>
                                  <select
                                    value={editingNews?.category || 'TIN TỨC'}
                                    onChange={(e) => setEditingNews({ ...editingNews!, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                  >
                                    <option value="TIN TỨC">TIN TỨC</option>
                                    <option value="SỰ KIỆN">SỰ KIỆN</option>
                                    <option value="THÔNG BÁO">THÔNG BÁO</option>
                                    <option value="TRUYỀN THÔNG">TRUYỀN THÔNG</option>
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ (Mở rộng)</label>
                                  <select
                                    value={editingNews?.related_service || ''}
                                    onChange={(e) => setEditingNews({ ...editingNews!, related_service: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                  >
                                    <option value="">-- Không đính kèm --</option>
                                    <optgroup label="Lĩnh vực hoạt động">
                                      {services.map(s => (
                                        <option key={\`service-\${s.id}\`} value={s.title}>{s.title}</option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Dịch vụ pháp lý">
                                      {legalServices.map(l => (
                                        <option key={\`legal-\${l.id}\`} value={l.title}>{l.title}</option>
                                      ))}
                                    </optgroup>
                                  </select>
                                </div>
                              </div>`;

content = content.replace(selectSearch, selectReplace);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);

console.log('Patched AdminDashboard.tsx to separate category and related_service');
