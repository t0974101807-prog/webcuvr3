const fs = require('fs');

const file = 'src/components/ERP.tsx';
let content = fs.readFileSync(file, 'utf8');

const notificationsViewStart = content.indexOf('function NotificationsView({ language }: { language: \'vi\' | \'en\' }) {');
const notificationsViewEnd = content.indexOf('function PermissionsView({ language }: { language: \'vi\' | \'en\' }) {');

if (notificationsViewStart !== -1 && notificationsViewEnd !== -1) {
  const newNotificationsView = `function NotificationsView({ language }: { language: 'vi' | 'en' }) {
  const [showAddNotification, setShowAddNotification] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'TEAM BILDING',
      content: 'Ngày 20',
      date: '08:26 15/03/2026',
      isRead: false,
      type: 'normal'
    },
    {
      id: '2',
      title: 'Hồ sơ DS123',
      content: 'Cần xử lý gấp',
      date: '5 đây 25',
      isRead: false,
      type: 'urgent'
    }
  ]);

  const [newNotif, setNewNotif] = useState({ title: '', content: '', type: 'normal' });

  const t = {
    vi: {
      title: 'Thông báo',
      subtitle: 'Chủ Nhật, 15 tháng 3, 2026',
      systemNotifications: 'Thông báo hệ thống',
      addNotification: 'Thêm thông báo',
      markAllRead: 'Đánh dấu tất cả đã đọc',
      addNewNotification: 'Thêm thông báo mới',
      cancel: 'Hủy',
      sendNotification: 'Gửi thông báo',
      notificationTitle: 'Tiêu đề',
      notificationTitlePlaceholder: 'Nhập tiêu đề thông báo',
      content: 'Nội dung',
      contentPlaceholder: 'Nhập nội dung chi tiết',
      importance: 'Mức độ quan trọng',
      normal: 'Bình thường',
      important: 'Quan trọng',
      urgent: 'Khẩn cấp',
      sendTo: 'Gửi đến',
      allEmployees: 'Tất cả nhân viên',
      onlyLawyers: 'Chỉ Luật sư',
      onlySpecialists: 'Chỉ Chuyên viên',
      teamBuilding: 'TEAM BILDING',
      date20: 'Ngày 20',
      time: '08:26 15/03/2026',
      delete: 'Xóa',
      urgentNotif: 'Thông báo khẩn cấp'
    },
    en: {
      title: 'Notifications',
      subtitle: 'Sunday, March 15, 2026',
      systemNotifications: 'System Notifications',
      addNotification: 'Add Notification',
      markAllRead: 'Mark all as read',
      addNewNotification: 'Add New Notification',
      cancel: 'Cancel',
      sendNotification: 'Send Notification',
      notificationTitle: 'Title',
      notificationTitlePlaceholder: 'Enter notification title',
      content: 'Content',
      contentPlaceholder: 'Enter detailed content',
      importance: 'Importance Level',
      normal: 'Normal',
      important: 'Important',
      urgent: 'Urgent',
      sendTo: 'Send To',
      allEmployees: 'All Employees',
      onlyLawyers: 'Lawyers Only',
      onlySpecialists: 'Specialists Only',
      teamBuilding: 'TEAM BUILDING',
      date20: '20th',
      time: '08:26 15/03/2026',
      delete: 'Delete',
      urgentNotif: 'Urgent Notifications'
    }
  }[language];

  // Remind continuously if there are unread notifications
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (unreadCount > 0) {
      const interval = setInterval(() => {
        // In a real app, this might trigger a toast or sound
        console.log(\`Reminder: You have \${unreadCount} unread notifications!\`);
        // We can show an alert or a custom toast here if needed, but alert might be too intrusive.
        // Let's just rely on the UI red dots and maybe a floating banner if we want.
      }, 10000); // Remind every 10 seconds
      return () => clearInterval(interval);
    }
  }, [notifications]);

  const handleAddNotification = () => {
    if (!newNotif.title.trim()) return;
    
    const now = new Date();
    const dateStr = \`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')} \${String(now.getDate()).padStart(2, '0')}/\${String(now.getMonth() + 1).padStart(2, '0')}/\${now.getFullYear()}\`;
    
    setNotifications([
      {
        id: Date.now().toString(),
        title: newNotif.title,
        content: newNotif.content,
        date: dateStr,
        isRead: false,
        type: newNotif.type as any
      },
      ...notifications
    ]);
    
    setNewNotif({ title: '', content: '', type: 'normal' });
    setShowAddNotification(false);
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const normalNotifications = notifications.filter(n => n.type !== 'urgent');
  const urgentNotifications = notifications.filter(n => n.type === 'urgent');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 font-serif">{t.title}</h3>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
      </div>

      {urgentNotifications.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <h4 className="text-xl font-bold text-slate-800 font-serif">{t.urgentNotif}</h4>
          </div>
          <div className="p-6 space-y-4">
            {urgentNotifications.map(notif => (
              <div key={notif.id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="font-bold">!</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">{notif.title}</h5>
                    <p className="text-slate-600 text-sm mt-0.5">{notif.content}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-slate-500 text-sm font-medium">
                    {notif.date}
                  </div>
                  {!notif.isRead && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>}
                  <button onClick={() => handleDelete(notif.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                  {!notif.isRead && (
                    <button onClick={() => handleMarkAsRead(notif.id)} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-blue-50 rounded-lg">
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell size={28} className="text-[#114B5F]" />
            <h4 className="text-2xl font-bold text-[#114B5F] font-serif">{t.systemNotifications}</h4>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowAddNotification(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#114B5F] text-white rounded-lg hover:bg-[#0d3a4a] font-medium transition-colors"
            >
              <Plus size={18} />
              {t.addNotification}
            </button>
            <button onClick={handleMarkAllRead} className="text-[#114B5F] font-bold text-sm hover:underline">
              {t.markAllRead}
            </button>
          </div>
        </div>

        {showAddNotification && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 font-serif">{t.addNewNotification}</h3>
                <button onClick={() => setShowAddNotification(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.notificationTitle}</label>
                  <input 
                    type="text" 
                    value={newNotif.title}
                    onChange={e => setNewNotif({...newNotif, title: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#114B5F] focus:border-transparent outline-none" 
                    placeholder={t.notificationTitlePlaceholder} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.content}</label>
                  <textarea 
                    value={newNotif.content}
                    onChange={e => setNewNotif({...newNotif, content: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#114B5F] focus:border-transparent outline-none" 
                    rows={4} 
                    placeholder={t.contentPlaceholder}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.importance}</label>
                  <select 
                    value={newNotif.type}
                    onChange={e => setNewNotif({...newNotif, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#114B5F] focus:border-transparent outline-none bg-white"
                  >
                    <option value="normal">{t.normal}</option>
                    <option value="important">{t.important}</option>
                    <option value="urgent">{t.urgent}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.sendTo}</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#114B5F] focus:border-transparent outline-none bg-white">
                    <option value="all">{t.allEmployees}</option>
                    <option value="lawyers">{t.onlyLawyers}</option>
                    <option value="specialists">{t.onlySpecialists}</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setShowAddNotification(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">{t.cancel}</button>
                <button onClick={handleAddNotification} className="px-4 py-2 bg-[#114B5F] text-white font-medium hover:bg-[#0d3a4a] rounded-lg transition-colors">{t.sendNotification}</button>
              </div>
            </div>
          </div>
        )}

        <div className="px-6">
          <div className="border-b border-slate-300 w-full"></div>
        </div>

        <div className="p-6 space-y-4">
          {normalNotifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Không có thông báo nào
            </div>
          ) : (
            normalNotifications.map(notif => (
              <div key={notif.id} className="bg-[#FCECD9] rounded-xl p-5 flex items-start sm:items-center justify-between gap-4 group">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-600 shrink-0 shadow-sm">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-lg">{notif.title}</h5>
                    <p className="text-slate-700 mt-1">{notif.content}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                    <Clock size={16} />
                    <span>{notif.date}</span>
                  </div>
                  {!notif.isRead && <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>}
                  <button onClick={() => handleDelete(notif.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                  {!notif.isRead && (
                    <button onClick={() => handleMarkAsRead(notif.id)} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-blue-100 rounded-lg">
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
`;

  content = content.substring(0, notificationsViewStart) + newNotificationsView + '\n\n' + content.substring(notificationsViewEnd);
  fs.writeFileSync(file, content, 'utf8');
  console.log('NotificationsView updated');
} else {
  console.log('Could not find NotificationsView boundaries');
}
