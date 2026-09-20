import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const newsCardSearch = `<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                    {item.category || 'TIN TỨC'}
                                  </span>`;

const newsCardReplace = `<div className="flex flex-col items-end gap-1">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                      {item.category || 'TIN TỨC'}
                                    </span>
                                    {item.related_service && (
                                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                                        🔗 {item.related_service}
                                      </span>
                                    )}
                                  </div>`;

content = content.replace(newsCardSearch, newsCardReplace);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);

console.log('Patched AdminDashboard.tsx to show related_service in card');
