import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const search = `                            {news.length === 0 && (
                              <div className="p-8 text-center text-gray-500">
                                Chưa có bài viết nào
                              </div>
                            )}
                          </div>
                        </div>
                      )}`;

const replace = `                            {news.length === 0 && (
                              <div className="p-8 text-center text-gray-500">
                                Chưa có bài viết nào
                              </div>
                            )}
                          </div>
                        </div>
                        </div>
                      )}`;

content = content.replace(search, replace);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);

console.log('Fixed missing closing div');
