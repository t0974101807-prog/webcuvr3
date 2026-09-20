import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const search = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {news.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-[var(--color-primary)]">
                                    <span className="font-bold">{item.icon}</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                      {item.category || 'TIN TỨC'}
                                    </span>
                                    {item.related_service && (
                                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                                        🔗 {item.related_service}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {item.file_url && (
                                  <img src={item.file_url} alt={item.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                                )}
                                <h4 className="font-bold text-gray-800 mb-2">{item.title}</h4>
                                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                              </div>
                              {canEditContent && (
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                  <button
                                    onClick={() => setEditingNews(item)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNews(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>`;

const replace = `<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                                  <th className="p-4 font-medium w-24">Hình ảnh</th>
                                  <th className="p-4 font-medium">Tiêu đề & Mô tả</th>
                                  <th className="p-4 font-medium w-48">Phân loại</th>
                                  {canEditContent && <th className="p-4 font-medium text-right w-24">Thao tác</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {news.map((item) => (
                                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 align-top">
                                      {item.file_url ? (
                                        <img src={item.file_url} alt={item.title} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                      ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                          <FileText size={24} />
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-4 align-top">
                                      <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{item.title}</h4>
                                      <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                                    </td>
                                    <td className="p-4 align-top">
                                      <div className="flex flex-col items-start gap-1">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                          {item.category || 'TIN TỨC'}
                                        </span>
                                        {item.related_service && (
                                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium truncate max-w-[180px]" title={item.related_service}>
                                            🔗 {item.related_service}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    {canEditContent && (
                                      <td className="p-4 align-top text-right">
                                        <div className="flex justify-end gap-2">
                                          <button
                                            onClick={() => setEditingNews(item)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          >
                                            <Edit2 size={16} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteNews(item.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {news.length === 0 && (
                              <div className="p-8 text-center text-gray-500">
                                Chưa có bài viết nào
                              </div>
                            )}
                          </div>
                        </div>`;

content = content.replace(search, replace);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Replaced news grid with table in AdminDashboard');
