import fs from 'fs';
import Database from 'better-sqlite3';

const db = new Database('./lawfirm.db');

try {
  // Update "Pháp luật" -> "Dịch vụ pháp lý" + "Giải quyết tranh chấp"
  db.prepare("UPDATE news SET category=?, related_service=? WHERE category=?").run('Dịch vụ pháp lý', 'Giải quyết tranh chấp', 'Pháp luật');
  
  // Update "Doanh nghiệp" -> "Lĩnh vực hoạt động" + "Bất động sản & Doanh nghiệp"
  db.prepare("UPDATE news SET category=?, related_service=? WHERE category=?").run('Lĩnh vực hoạt động', 'Bất động sản & Doanh nghiệp', 'Doanh nghiệp');
  console.log('Fixed categories!');
} catch(e) {
  console.log('Error', e);
}
