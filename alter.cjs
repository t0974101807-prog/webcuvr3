const Database = require('better-sqlite3');
const db = new Database('lawfirm.db');

try {
  db.prepare("ALTER TABLE role_permissions ADD COLUMN manageEvents INTEGER DEFAULT 0").run();
  console.log("Added manageEvents");
} catch(e) { console.log(e.message); }

try {
  db.prepare("ALTER TABLE role_permissions ADD COLUMN manageLegalDocs INTEGER DEFAULT 0").run();
  console.log("Added manageLegalDocs");
} catch(e) { console.log(e.message); }

try {
  db.prepare("ALTER TABLE role_permissions ADD COLUMN viewEventHistory INTEGER DEFAULT 0").run();
  console.log("Added viewEventHistory");
} catch(e) { console.log(e.message); }

console.log("Done");
