import Database from 'better-sqlite3';
const db = new Database('lawfirm.db');

// Check if we need to migrate data back from services to legal_services
const services = db.prepare("SELECT * FROM services WHERE category='Dịch vụ pháp lý'").all();
if (services.length > 0) {
  const insertLegalService = db.prepare("INSERT INTO legal_services (title, description, content, icon, file_url, file_name) VALUES (?, ?, ?, ?, ?, ?)");
  for (const s of services) {
    insertLegalService.run(s.title, s.description, s.content, s.icon, s.file_url, s.file_name);
  }
  db.prepare("DELETE FROM services WHERE category='Dịch vụ pháp lý'").run();
}
console.log('Restored legal_services');
