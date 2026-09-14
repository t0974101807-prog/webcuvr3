const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    let s: any = null;
    const canManageWeb = myPermissions?.manageWeb || user?.role === "admin";
    if (canManageWeb) {
      const fetchStats = () => {
        api
          .req("/api/stats")
          .then((data) => {
            setUnreadLiveMessages(data?.summary?.unreadMessages || 0);
          })
          .catch(() => {});
      };
      // Only fetch stats if not already fetched this mount or on permission change
      fetchStats();

      try {
        s = io();
        s.on("connect", () => s.emit("join_admin"));
        s.on("receive_message", () => fetchStats());
        s.on("messages_read", () => fetchStats());
      } catch (e) {}
    }
    return () => {
      if (s) s.disconnect();
    };
  }, [myPermissions, user?.role]);`;

const newEffect = `  useEffect(() => {
    let s: any = null;
    const fetchStats = () => {
      // Fetch unread count specific to this user's assigned cases
      api
        .req("/api/cases/unread-chats")
        .then((data) => {
          setUnreadLiveMessages(data?.unread || 0);
        })
        .catch(() => {});
    };
    
    fetchStats();

    try {
      s = io();
      s.on("connect", () => s.emit("join_admin"));
      s.on("receive_message", () => fetchStats());
      s.on("messages_read", () => fetchStats());
    } catch (e) {}

    return () => {
      if (s) s.disconnect();
    };
  }, [myPermissions, user?.role]);`;

if (code.includes('const canManageWeb = myPermissions?.manageWeb || user?.role === "admin";')) {
    code = code.replace(oldEffect, newEffect);
    fs.writeFileSync('src/components/ERP.tsx', code);
    console.log("Successfully patched ERP.tsx stats fetching");
} else {
    console.log("Failed to find stats fetching block in ERP.tsx");
}
