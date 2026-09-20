import Database from 'better-sqlite3';

const db = new Database('sessions.db');
const sessions = db.prepare('SELECT * FROM sessions').all();
console.log(sessions);
