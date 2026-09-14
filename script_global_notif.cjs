const fs = require('fs');

const file = 'src/components/ERP.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state to ERP
const erpStart = content.indexOf('export default function ERP({ onBack, user }: ERPProps) {');
const erpStateEnd = content.indexOf('return (', erpStart);

if (erpStart !== -1 && erpStateEnd !== -1) {
  const newErpState = `  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [currentUser, setCurrentUser] = useState(user);
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
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (unreadCount > 0) {
      const interval = setInterval(() => {
        setShowReminder(true);
        setTimeout(() => setShowReminder(false), 5000);
      }, 15000); // Remind every 15 seconds
      return () => clearInterval(interval);
    }
  }, [notifications]);

  `;
  
  content = content.substring(0, erpStart + 'export default function ERP({ onBack, user }: ERPProps) {\n'.length) + newErpState + content.substring(erpStateEnd);
}

// 2. Add toast to ERP render
const erpRenderEnd = content.indexOf('</aside>', erpStart);
if (erpRenderEnd !== -1) {
  // Wait, let's put the toast at the very end of the ERP component render
  const erpReturnEnd = content.indexOf('</div>\n    </div>\n  );\n}', erpStart);
  if (erpReturnEnd !== -1) {
    const toastHtml = `
          {/* Global Notification Reminder */}
          <AnimatePresence>
            {showReminder && (
              <motion.div 
                initial={{ opacity: 0, y: 50, x: 50 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 50, x: 50 }}
                className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border-l-4 border-orange-500 p-4 w-80 z-50 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{language === 'vi' ? 'Nhắc nhở' : 'Reminder'}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {language === 'vi' 
                      ? \`Bạn có \${notifications.filter(n => !n.isRead).length} thông báo chưa đọc!\` 
                      : \`You have \${notifications.filter(n => !n.isRead).length} unread notifications!\`}
                  </p>
                  <button 
                    onClick={() => {
                      setActiveTab('notifications');
                      setShowReminder(false);
                    }}
                    className="mt-2 text-sm text-[#114B5F] font-bold hover:underline"
                  >
                    {language === 'vi' ? 'Xem ngay' : 'View now'}
                  </button>
                </div>
                <button onClick={() => setShowReminder(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
`;
    content = content.substring(0, erpReturnEnd) + toastHtml + content.substring(erpReturnEnd);
  }
}

// 3. Update NotificationsView props
content = content.replace(
  'function NotificationsView({ language }: { language: \'vi\' | \'en\' }) {',
  'function NotificationsView({ language, notifications, setNotifications }: { language: \'vi\' | \'en\', notifications: any[], setNotifications: any }) {'
);

// 4. Remove local state from NotificationsView
const notifStateStart = content.indexOf('const [notifications, setNotifications] = useState([');
const notifStateEnd = content.indexOf('const [newNotif, setNewNotif] = useState({ title: \'\', content: \'\', type: \'normal\' });');

if (notifStateStart !== -1 && notifStateEnd !== -1) {
  content = content.substring(0, notifStateStart) + content.substring(notifStateEnd);
}

// 5. Remove local useEffect from NotificationsView
const notifEffectStart = content.indexOf('// Remind continuously if there are unread notifications');
const notifEffectEnd = content.indexOf('const handleAddNotification = () => {');

if (notifEffectStart !== -1 && notifEffectEnd !== -1) {
  content = content.substring(0, notifEffectStart) + content.substring(notifEffectEnd);
}

// 6. Pass props to NotificationsView
content = content.replace(
  '<NotificationsView language={language} />',
  '<NotificationsView language={language} notifications={notifications} setNotifications={setNotifications} />'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Global notifications updated');
