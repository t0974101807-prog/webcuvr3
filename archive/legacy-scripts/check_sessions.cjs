const Database = require('better-sqlite3');
try {
  const db = new Database('sessions.db', { fileMustExist: true });
  const result = db.pragma('integrity_check');
  console.log('sessions.db:', result);
} catch (e) {
  console.error("sessions.db Error:", e);
}
