import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Add news filter state
const stateSearch = `const [legalServiceSearch, setLegalServiceSearch] = useState('');`;
const stateReplace = `const [legalServiceSearch, setLegalServiceSearch] = useState('');
  const [adminNewsFilter, setAdminNewsFilter] = useState<'ALL' | 'TIN_TUC_CHUNG' | 'LINH_VUC_HOAT_DONG' | 'DICH_VU_PHAP_LY'>('ALL');`;

content = content.replace(stateSearch, stateReplace);

// Let's create the filtered news list
const replaceTableRenderSearch = `) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">`;

const replaceTableRender = `) : (
                        <div className="space-y-4">
                          <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-fit overflow-x-auto">
                            <button
                                onClick={() => setAdminNewsFilter('ALL')}
                                className={\`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors \${
                                    adminNewsFilter === 'ALL'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }\`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setAdminNewsFilter('TIN_TUC_CHUNG')}
                                className={\`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors \${
                                    adminNewsFilter === 'TIN_TUC_CHUNG'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }\`}
                            >
                                Tin tức chung
                            </button>
                            <button
                                onClick={() => setAdminNewsFilter('LINH_VUC_HOAT_DONG')}
                                className={\`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors \${
                                    adminNewsFilter === 'LINH_VUC_HOAT_DONG'
                                    ? 'bg-white text-[var(--color-primary)] shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }\`}
                            >
                                Lĩnh vực hoạt động
                            </button>
                            <button
                                onClick={() => setAdminNewsFilter('DICH_VU_PHAP_LY')}
                                className={\`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors \${
                                    adminNewsFilter === 'DICH_VU_PHAP_LY'
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }\`}
                            >
                                Dịch vụ pháp lý
                            </button>
                          </div>
                          
                          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[800px]">`;

content = content.replace(replaceTableRenderSearch, replaceTableRender);

const mapSearch = `{news.map((item) => (`;
const mapReplace = `{news.filter(item => {
                                  if (adminNewsFilter === 'ALL') return true;
                                  if (adminNewsFilter === 'TIN_TUC_CHUNG') {
                                      return !['Lĩnh vực hoạt động', 'Dịch vụ pháp lý'].includes(item.category || '');
                                  }
                                  if (adminNewsFilter === 'LINH_VUC_HOAT_DONG') {
                                      return item.category === 'Lĩnh vực hoạt động';
                                  }
                                  if (adminNewsFilter === 'DICH_VU_PHAP_LY') {
                                      return item.category === 'Dịch vụ pháp lý';
                                  }
                                  return true;
                                }).map((item) => (`;

content = content.replace(mapSearch, mapReplace);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Added admin news tab filtering logic');
