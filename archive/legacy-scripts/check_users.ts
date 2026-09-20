import Database from 'better-sqlite3';
const db = new Database('lawfirm.db');
const users = db.prepare("SELECT id, username, password, name, role FROM users").all();
console.log(users);
