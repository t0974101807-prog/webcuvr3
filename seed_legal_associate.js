import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('lawfirm.db');
const hash = bcrypt.hashSync('123456', 10);

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('chuyen_vien');

if (!existing) {
  db.prepare(`
    INSERT INTO users (username, password, name, role, title, staff_code, branch, start_date, contract_type, contract_sign_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('chuyen_vien', hash, 'Nguyễn Hữu Thắng', 'legal_associate', 'Chuyên viên pháp lý', 'NV003', 'Hà Nội', '2023-01-01', 'HĐLĐ xác định thời hạn', '2023-01-01');
  console.log("Created legal associate user 'chuyen_vien'. Password: 123456");
} else {
  console.log("User 'chuyen_vien' already exists.");
}
