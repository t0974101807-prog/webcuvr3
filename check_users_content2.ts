import Database from 'better-sqlite3';
const db = new Database('lawfirm.db');
console.log(db.prepare("SELECT * FROM users").all());
