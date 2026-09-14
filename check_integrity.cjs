const Database = require('better-sqlite3');
try {
  const db = new Database('lawfirm.db', { fileMustExist: true });
  const result = db.pragma('integrity_check');
  console.log(result);
} catch (e) {
  console.error("DB Error:", e);
}
