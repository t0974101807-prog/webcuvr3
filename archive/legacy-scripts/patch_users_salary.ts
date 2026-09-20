import Database from 'better-sqlite3';

const db = new Database('lawfirm.db');
try {
  db.exec('ALTER TABLE users ADD COLUMN salary TEXT;');
  console.log('Added salary column');
} catch (e) {
  console.log('salary column may already exist', e.message);
}

try {
  db.exec('ALTER TABLE users ADD COLUMN bonus TEXT;');
  console.log('Added bonus column');
} catch (e) {
  console.log('bonus column may already exist', e.message);
}
