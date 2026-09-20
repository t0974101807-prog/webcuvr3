const fs = require('fs');
let code = fs.readFileSync('src/modules/cases/cases.routes.ts', 'utf8');

const unreadChatsRoute = `

router.get("/unread-chats", auth, (req: any, res: any) => {
  try {
    const userRole = req.user.role;
    const userName = req.user.name;

    // We can gather visitor_ids that this user is responsible for.
    let unreadCount = 0;

    if (userRole === 'admin') {
      const q = db.prepare('SELECT COUNT(*) as count FROM live_messages WHERE sender_type = ? AND is_read = 0').get('visitor') as {count: number};
      unreadCount = q.count;
    } else {
      // Find cases assigned to this user
      const records = db.prepare('SELECT data FROM erp_records').all();
      const userCaseIds: string[] = [];
      records.forEach((r: any) => {
        try {
          const data = JSON.parse(r.data);
          if (data.mainAssignee === userName || data.partner === userName) {
            userCaseIds.push(data.systemId || data.id);
          }
        } catch(e) {}
      });

      if (userCaseIds.length > 0) {
        // Find clients associated with these caseIds
        const placeholders = userCaseIds.map(() => '?').join(',');
        const clients = db.prepare(\`SELECT username, id FROM users WHERE role = 'client' AND case_id IN (\${placeholders})\`).all(...userCaseIds);
        
        let visitorIds = clients.map((c: any) => c.username || \`client_\${c.id}\`);
        
        if (visitorIds.length > 0) {
          const vPlaceholders = visitorIds.map(() => '?').join(',');
          const q = db.prepare(\`SELECT COUNT(*) as count FROM live_messages WHERE sender_type = ? AND is_read = 0 AND visitor_id IN (\${vPlaceholders})\`).get('visitor', ...visitorIds) as {count: number};
          unreadCount = q.count;
        }
      }
    }

    res.json({ unread: unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
`;

code = code.replace('const router = Router();', 'const router = Router();' + unreadChatsRoute);
fs.writeFileSync('src/modules/cases/cases.routes.ts', code);
