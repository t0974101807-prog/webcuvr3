import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Update activeTab types to include messages and stats
content = content.replace(`const [activeTab, setActiveTab] = useState<'services' | 'legal_services' | 'news' | 'recruitment' | 'team' | 'users' | 'profile' | 'settings'>('services');`, `const [activeTab, setActiveTab] = useState<'services' | 'legal_services' | 'news' | 'recruitment' | 'team' | 'users' | 'messages' | 'stats' | 'profile' | 'settings'>('services');
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ chartData: [], summary: { totalMessages: 0, unreadMessages: 0 } });
`);

// Add fetching messages and stats
const fetchSearch = `      if (canManageUsers) {
        const usersRes = await fetchApi(\`/api/users?t=\${t}\`);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch users:', await usersRes.text());
          setUsers([]);
        }
      }`;

const fetchReplace = `      if (canManageUsers) {
        const usersRes = await fetchApi(\`/api/users?t=\${t}\`);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch users:', await usersRes.text());
          setUsers([]);
        }
      }

      // Fetch messages and stats
      try {
        const msgsRes = await fetchApi(\`/api/messages?t=\${t}\`);
        if (msgsRes.ok) setMessages(await msgsRes.json());
        const statsRes = await fetchApi(\`/api/stats?t=\${t}\`);
        if (statsRes.ok) setStats(await statsRes.json());
      } catch(e) {}
`;

content = content.replace(fetchSearch, fetchReplace);

// Add sidebar icons
const iconsSearch = `import { 
  X, Plus, Edit2, Trash2, Save, Image, Type, AlignLeft, FileText, Search,
  LayoutDashboard, Calendar, CalendarDays, FolderOpen, Users, BarChart3, 
  FileSpreadsheet, ShieldCheck, FileType, Bell, Settings, Briefcase, Scale, 
  Newspaper, UserPlus, Users2, UserCircle
} from 'lucide-react';`;

const iconsReplace = `import { 
  X, Plus, Edit2, Trash2, Save, Image, Type, AlignLeft, FileText, Search,
  LayoutDashboard, Calendar, CalendarDays, FolderOpen, Users, BarChart3, 
  FileSpreadsheet, ShieldCheck, FileType, Bell, Settings, Briefcase, Scale, 
  Newspaper, UserPlus, Users2, UserCircle, MessageSquare, TrendingUp, Check
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';`;

content = content.replace(iconsSearch, iconsReplace);


// Add sidebar menu item
const sidebarSearch = `              {canManageUsers && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={\`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors \${
                    activeTab === 'users' 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }\`}
                >
                  <Users2 size={20} /> Người dùng
                </button>
              )}`;

const sidebarReplace = `              {canManageUsers && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={\`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors \${
                    activeTab === 'users' 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }\`}
                >
                  <Users2 size={20} /> Người dùng
                </button>
              )}
              {canManageUsers && (
                <button
                  onClick={() => setActiveTab('messages')}
                  className={\`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors \${
                    activeTab === 'messages' 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }\`}
                >
                  <div className="relative">
                    <MessageSquare size={20} />
                    {stats?.summary?.unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                  Tin nhắn
                </button>
              )}
              {canManageUsers && (
                <button
                  onClick={() => setActiveTab('stats')}
                  className={\`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors \${
                    activeTab === 'stats' 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }\`}
                >
                  <TrendingUp size={20} /> Thống kê
                </button>
              )}`;

content = content.replace(sidebarSearch, sidebarReplace);

// Add Tab Views
const tabViewsSearch = `                  {/* Users Tab */}`;
const tabViewsReplace = `                  {/* Messages Tab */}
                  {activeTab === 'messages' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">Quản lý tin nhắn liên hệ</h3>
                      </div>
                      
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-gray-100 text-slate-600 text-sm">
                              <tr>
                                <th className="p-4 font-medium w-16">Trạng thái</th>
                                <th className="p-4 font-medium w-64">Thông tin khách hàng</th>
                                <th className="p-4 font-medium">Nội dung</th>
                                <th className="p-4 font-medium w-48">Thời gian</th>
                                <th className="p-4 font-medium w-16 text-center">Đã trả lời</th>
                              </tr>
                            </thead>
                            <tbody>
                              {messages.map((item: any) => (
                                <tr key={item.id} className={\`border-b border-gray-50 hover:bg-gray-50 transition-colors \${!item.is_read ? 'bg-blue-50/30' : ''}\`}>
                                  <td className="p-4 align-top">
                                    {!item.is_read ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 shrink-0">
                                        <Bell size={14} />
                                      </span>
                                    ) : (
                                       <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 shrink-0">
                                         <Check size={14} />
                                       </span>
                                    )}
                                  </td>
                                  <td className="p-4 align-top">
                                    <div className="font-bold text-gray-900">{item.name}</div>
                                    <div className="text-sm text-gray-500">{item.phone}</div>
                                    <div className="text-sm text-gray-500">{item.email}</div>
                                  </td>
                                  <td className="p-4 align-top">
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.content}</p>
                                  </td>
                                  <td className="p-4 align-top text-sm text-gray-500">
                                    {new Date(item.created_at).toLocaleString('vi-VN')}
                                  </td>
                                  <td className="p-4 align-top text-center">
                                    <button 
                                      onClick={async () => {
                                        try {
                                          await fetchApi(\`/api/messages/\${item.id}\`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ is_read: !item.is_read })
                                          });
                                          fetchData();
                                        } catch(e) {}
                                      }}
                                      className={\`\${item.is_read ? 'text-gray-400 hover:text-gray-600' : 'text-[var(--color-primary)] hover:text-blue-700'}\`}
                                      title={item.is_read ? "Đánh dấu chưa đọc" : "Đánh dấu đã trả lời"}
                                    >
                                      {item.is_read ? <X size={20} /> : <Check size={20} />}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {messages.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chưa có tin nhắn nào</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Tab */}
                  {activeTab === 'stats' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">Thống kê truy cập & Tương tác</h3>
                        <button
                          onClick={async () => {
                            await fetchApi('/api/stats/seed', { method: 'POST' });
                            fetchData();
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                           Nạp dữ liệu mẫu
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><Users size={16}/> Lượt xem trang hôm nay</h4>
                          <span className="text-3xl font-bold text-gray-900">
                            {stats.chartData.length > 0 ? stats.chartData[stats.chartData.length - 1].page_views : 0}
                          </span>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><UserPlus size={16}/> Khách truy cập mới</h4>
                          <span className="text-3xl font-bold text-gray-900">
                            {stats.chartData.length > 0 ? stats.chartData[stats.chartData.length - 1].visitors : 0}
                          </span>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><MessageSquare size={16}/> Tin nhắn hôm nay</h4>
                          <span className="text-3xl font-bold text-[var(--color-primary)]">
                            {stats.chartData.length > 0 ? stats.chartData[stats.chartData.length - 1].chats : 0}
                          </span>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><Bell size={16}/> Tin nhắn chưa đọc</h4>
                          <span className="text-3xl font-bold text-red-500">
                            {stats.summary.unreadMessages}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96">
                         <h4 className="font-bold text-gray-800 mb-6">Biểu đồ Lượt xem & Khách truy cập</h4>
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                              <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} tickMargin={10} minTickGap={20} />
                              <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                              <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '20px' }} />
                              <Line type="monotone" name="Lượt xem trang (Page Views)" dataKey="page_views" stroke="var(--color-primary)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                              <Line type="monotone" name="Khách truy cập (Visitors)" dataKey="visitors" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                              <Line type="monotone" name="Tin nhắn (Chats)" dataKey="chats" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                            </LineChart>
                         </ResponsiveContainer>
                      </div>

                    </div>
                  )}

                  {/* Users Tab */}`;
content = content.replace(tabViewsSearch, tabViewsReplace);


fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Added Messages and Stats tabs to AdminDashboard');
