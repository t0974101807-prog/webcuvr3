const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// 1. Add states for internal unread messages
if (!code.includes('const [unreadInternalChats, setUnreadInternalChats] = useState')) {
  code = code.replace(
    'const [unreadLiveMessages, setUnreadLiveMessages] = useState(0);',
    'const [unreadLiveMessages, setUnreadLiveMessages] = useState(0);\n  const [unreadInternalChats, setUnreadInternalChats] = useState<Record<string, number>>({});\n  const [totalUnreadInternal, setTotalUnreadInternal] = useState(0);'
  );
}

// 2. Fetch unread internal chats inside fetchStats
const fetchStatsOld = `      api
        .req("/api/cases/unread-chats")
        .then((data) => {
          setUnreadLiveMessages(data?.unread || 0);
        })
        .catch(() => {});`;

const fetchStatsNew = `      api
        .req("/api/cases/unread-chats")
        .then((data) => {
          setUnreadLiveMessages(data?.unread || 0);
        })
        .catch(() => {});
        
      api
        .req("/api/cases/internal-unread")
        .then((data) => {
          if (data) {
             setTotalUnreadInternal(data.totalUnread || 0);
             setUnreadInternalChats(data.unreadByRecord || {});
          }
        })
        .catch(() => {});`;

if (code.includes(fetchStatsOld)) {
  code = code.replace(fetchStatsOld, fetchStatsNew);
}

// 3. Socket event bindings
const socketBindOld = `      s.on("connect", () => s.emit("join_admin"));
      s.on("receive_message", () => fetchStats());
      s.on("messages_read", () => fetchStats());`;

const socketBindNew = `      s.on("connect", () => {
        s.emit("join_admin");
        s.emit("join_erp");
      });
      s.on("receive_message", () => fetchStats());
      s.on("messages_read", () => fetchStats());
      s.on("internal_message_notification", (msg: any) => {
        fetchStats();
      });
      s.on("internal_messages_read", () => fetchStats());`;

if (code.includes(socketBindOld)) {
  code = code.replace(socketBindOld, socketBindNew);
}

// 4. Update the reminder badge total to include totalUnreadInternal
const badgeCondOld = `(notifications.filter((n) => !n.read).length > 0 ||
                unreadLiveMessages > 0)`;
const badgeCondNew = `(notifications.filter((n) => !n.read).length > 0 ||
                unreadLiveMessages > 0 || totalUnreadInternal > 0)`;

const badgeTotalOld = `{notifications.filter((n) => !n.read).length +
                    unreadLiveMessages}`;
const badgeTotalNew = `{notifications.filter((n) => !n.read).length +
                    unreadLiveMessages + totalUnreadInternal}`;

code = code.split(badgeCondOld).join(badgeCondNew);
code = code.split(badgeTotalOld).join(badgeTotalNew);

// 5. Global Reminder Toast logic
const reminderEffectOld = `if (unreadCount > 0 || unreadLiveMessages > 0) {`;
const reminderEffectNew = `if (unreadCount > 0 || unreadLiveMessages > 0 || totalUnreadInternal > 0) {`;
code = code.split(reminderEffectOld).join(reminderEffectNew);

const reminderDepsOld = `[notifications, unreadLiveMessages]`;
const reminderDepsNew = `[notifications, unreadLiveMessages, totalUnreadInternal]`;
if (code.includes('}, ' + reminderDepsOld + ');')) {
  code = code.replace('}, ' + reminderDepsOld + ');', '}, ' + reminderDepsNew + ');');
}

const reminderContentOld = `{unreadLiveMessages > 0 && (
                <div className="mb-1">
                  {language === "vi"
                    ? \`Bạn có \${unreadLiveMessages} tin nhắn Live Chat!\`
                    : \`You have \${unreadLiveMessages} live messages!\`}
                </div>
              )}`;

const reminderContentNew = `{unreadLiveMessages > 0 && (
                <div className="mb-1">
                  {language === "vi"
                    ? \`Bạn có \${unreadLiveMessages} tin nhắn Live Chat!\`
                    : \`You have \${unreadLiveMessages} live messages!\`}
                </div>
              )}
              {totalUnreadInternal > 0 && (
                <div className="mb-1">
                  {language === "vi"
                    ? \`Bạn có \${totalUnreadInternal} tin nhắn Nội bộ chưa đọc!\`
                    : \`You have \${totalUnreadInternal} unread internal messages!\`}
                </div>
              )}`;

if (code.includes(reminderContentOld)) {
  code = code.replace(reminderContentOld, reminderContentNew);
}

// 6. Badge on the "Internal Chat" button inside record view
const internalBtnOld = `<Users size={18} />
                {language === "vi" ? "Nội bộ" : "Internal Chat"}`;

const internalBtnNew = `<div className="relative">
                  <Users size={18} />
                  {unreadInternalChats[viewingRecord?.id || viewingRecord?.systemId] > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                    </span>
                  )}
                </div>
                {language === "vi" ? "Nội bộ" : "Internal Chat"}`;

if (code.includes(internalBtnOld)) {
  code = code.replace(internalBtnOld, internalBtnNew);
}

// 7. When clicking the button to open Internal Chat, mark as read
const internalBtnClickOld = `onClick={() => {
                  setSelectedRecord(viewingRecord);
                  setShowInternalChatModal(true);
                }}`;
                
const internalBtnClickNew = `onClick={() => {
                  setSelectedRecord(viewingRecord);
                  setShowInternalChatModal(true);
                 
                }}`;
// We will emit read inside InternalChatModal to ensure it updates globally.

fs.writeFileSync('src/components/ERP.tsx', code);
