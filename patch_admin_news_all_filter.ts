import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const filterSearch = `{news.filter(item => {

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

                                }).map((item) => (`

const filterReplace = `{news.filter(item => {
                                  // Update logic for ALL view so it renders based on ALL drop down.  Wait, ALL doesn't have a dropdown.

                                  if (adminNewsFilter === 'ALL') {
                                      return true;
                                  }

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

                                }).map((item) => (`

content = content.replace(filterSearch, filterReplace);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Fixed ALL Admin filter logic');
