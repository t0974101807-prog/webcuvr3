import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const stateSearch = `const [adminNewsFilter, setAdminNewsFilter] = useState<'ALL' | 'TIN_TUC_CHUNG' | 'LINH_VUC_HOAT_DONG' | 'DICH_VU_PHAP_LY'>('ALL');`;
const stateReplace = `const [adminNewsFilter, setAdminNewsFilter] = useState<'ALL' | 'TIN_TUC_CHUNG' | 'LINH_VUC_HOAT_DONG' | 'DICH_VU_PHAP_LY'>('ALL');\n  const [adminNewsSubFilter, setAdminNewsSubFilter] = useState<string>('ALL');`;
content = content.replace(stateSearch, stateReplace);

// Fix setAdminNewsFilter logic to reset subfilter
const resetFilterSearch = `onClick={() => setAdminNewsFilter('ALL')}`;
content = content.replace(/onClick=\{\(\) \=\> setAdminNewsFilter\('ALL'\)\}/g, `onClick={() => { setAdminNewsFilter('ALL'); setAdminNewsSubFilter('ALL'); }}`);
content = content.replace(/onClick=\{\(\) \=\> setAdminNewsFilter\('TIN_TUC_CHUNG'\)\}/g, `onClick={() => { setAdminNewsFilter('TIN_TUC_CHUNG'); setAdminNewsSubFilter('ALL'); }}`);
content = content.replace(/onClick=\{\(\) \=\> setAdminNewsFilter\('LINH_VUC_HOAT_DONG'\)\}/g, `onClick={() => { setAdminNewsFilter('LINH_VUC_HOAT_DONG'); setAdminNewsSubFilter('ALL'); }}`);
content = content.replace(/onClick=\{\(\) \=\> setAdminNewsFilter\('DICH_VU_PHAP_LY'\)\}/g, `onClick={() => { setAdminNewsFilter('DICH_VU_PHAP_LY'); setAdminNewsSubFilter('ALL'); }}`);

const replaceTableRenderSearch = `<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[800px]">`;

const subFilterRender = `
                          {adminNewsFilter === 'TIN_TUC_CHUNG' && (
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
                          )}
`;

content = content.replace(replaceTableRenderSearch, subFilterRender + replaceTableRenderSearch);

const mapSearch = `                                  if (adminNewsFilter === 'ALL') return true;
                                  if (adminNewsFilter === 'TIN_TUC_CHUNG') {
                                      return !['Lĩnh vực hoạt động', 'Dịch vụ pháp lý'].includes(item.category || '');
                                  }
                                  if (adminNewsFilter === 'LINH_VUC_HOAT_DONG') {
                                      return item.category === 'Lĩnh vực hoạt động';
                                  }
                                  if (adminNewsFilter === 'DICH_VU_PHAP_LY') {
                                      return item.category === 'Dịch vụ pháp lý';
                                  }
                                  return true;`;

const mapReplace = `
                                  if (adminNewsFilter === 'TIN_TUC_CHUNG') {
                                      if (['Lĩnh vực hoạt động', 'Dịch vụ pháp lý'].includes(item.category || '')) return false;
                                      if (adminNewsSubFilter !== 'ALL' && item.category !== adminNewsSubFilter) return false;
                                      return true;
                                  }
                                  if (adminNewsFilter === 'LINH_VUC_HOAT_DONG') {
                                      if (item.category !== 'Lĩnh vực hoạt động') return false;
                                      if (adminNewsSubFilter !== 'ALL' && item.related_service !== adminNewsSubFilter) return false;
                                      return true;
                                  }
                                  if (adminNewsFilter === 'DICH_VU_PHAP_LY') {
                                      if (item.category !== 'Dịch vụ pháp lý') return false;
                                      if (adminNewsSubFilter !== 'ALL' && item.related_service !== adminNewsSubFilter) return false;
                                      return true;
                                  }
                                  return true;
`;

content = content.replace(mapSearch, mapReplace);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);

console.log('Added sub-filters to admin dashboard');
