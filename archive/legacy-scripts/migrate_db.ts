import fs from 'fs';
import Database from 'better-sqlite3';

const db = new Database('./lawfirm.db');

try {
  db.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run();
} catch(e) {}

const existingNews = db.prepare('SELECT id, category FROM news').all();
const mainTabs = ['TIN TỨC', 'SỰ KIỆN', 'THÔNG BÁO', 'TRUYỀN THÔNG', 'TẤT CẢ'];

let migrated = 0;
for (const n of existingNews) {
    if (n.category && !mainTabs.includes(n.category)) {
        db.prepare('UPDATE news SET related_service=?, category=? WHERE id=?').run(n.category, 'TIN TỨC', n.id);
        migrated++;
    }
}

console.log('Migrated ' + migrated + ' news items.');
