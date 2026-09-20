import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const removeSubfiltersSearch = `                          {adminNewsFilter === 'TIN_TUC_CHUNG' && (
                            <div className="flex gap-2 mb-4">
                               <select 
                                    value={adminNewsSubFilter} 
                                    onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="ALL">-- Tất cả mục --</option>
                                    <option value="TIN TỨC">Tin tức</option>
                                    <option value="SỰ KIỆN">Sự kiện</option>
                                    <option value="THÔNG BÁO">Thông báo</option>
                                    <option value="TRUYỀN THÔNG">Truyền thông</option>
                               </select>
                            </div>
                          )}

                          {adminNewsFilter === 'LINH_VUC_HOAT_DONG' && (
                            <div className="flex gap-2 mb-4">
                               <select 
                                    value={adminNewsSubFilter} 
                                    onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary)] max-w-xs"
                                >
                                    <option value="ALL">-- Tất cả lĩnh vực --</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.title}>{s.title}</option>
                                    ))}
                               </select>
                            </div>
                          )}

                          {adminNewsFilter === 'DICH_VU_PHAP_LY' && (
                            <div className="flex gap-2 mb-4">
                               <select 
                                    value={adminNewsSubFilter} 
                                    onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-purple-500 max-w-xs"
                                >
                                    <option value="ALL">-- Tất cả dịch vụ --</option>
                                    {legalServices.map(ls => (
                                        <option key={ls.id} value={ls.title}>{ls.title}</option>
                                    ))}
                               </select>
                            </div>
                          )}`;

content = content.replace(removeSubfiltersSearch, '');

const replaceThSearch = `<th className="p-4 font-medium w-48">Phân loại</th>`;
const replaceTh = `<th className="p-4 font-medium w-64">
                                    {adminNewsFilter === 'ALL' ? 'Phân loại' : (
                                       adminNewsFilter === 'TIN_TUC_CHUNG' ? (
                                         <select 
                                            value={adminNewsSubFilter} 
                                            onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                            className="px-2 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white w-full font-medium"
                                        >
                                            <option value="ALL">Phân loại: TẤT CẢ DỮ LIỆU</option>
                                            <option value="TIN TỨC">TIN TỨC</option>
                                            <option value="SỰ KIỆN">SỰ KIỆN</option>
                                            <option value="THÔNG BÁO">THÔNG BÁO</option>
                                            <option value="TRUYỀN THÔNG">TRUYỀN THÔNG</option>
                                        </select>
                                       ) : adminNewsFilter === 'LINH_VUC_HOAT_DONG' ? (
                                         <select 
                                            value={adminNewsSubFilter} 
                                            onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                            className="px-2 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary)] bg-white w-full font-medium"
                                        >
                                            <option value="ALL">Phân loại: TẤT CẢ DỮ LIỆU</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.title}>{s.title}</option>
                                            ))}
                                        </select>
                                       ) : (
                                        <select 
                                            value={adminNewsSubFilter} 
                                            onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                            className="px-2 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-purple-500 bg-white w-full font-medium"
                                        >
                                            <option value="ALL">Phân loại: TẤT CẢ DỮ LIỆU</option>
                                            {legalServices.map(ls => (
                                                <option key={ls.id} value={ls.title}>{ls.title}</option>
                                            ))}
                                        </select>
                                       )
                                    )}
                                  </th>`;

content = content.replace(replaceThSearch, replaceTh);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);

console.log('Moved subfilters into table header');
