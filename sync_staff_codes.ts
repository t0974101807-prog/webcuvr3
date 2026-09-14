import Database from 'better-sqlite3';

const db = new Database('lawfirm.db');

const generateStaffCode = (title: string, userIndex: number) => {
  if (!title) return `NV${String(userIndex).padStart(3, '0')}`;
  const words = title.trim().split(/\s+/);
  let prefix = '';
  if (words.length === 1) {
    prefix = words[0].substring(0, 2).toUpperCase();
  } else {
    prefix = words.map(w => w[0]).join('').toUpperCase();
  }
  
  // Clean up prefix to only be alphanumeric
  prefix = prefix.replace(/[^A-Z0-9]/g, '');
  
  // Truncate to max 4 chars if too long
  if (prefix.length > 4) {
    prefix = prefix.substring(0, 4);
  }
  
  return `${prefix}${String(userIndex).padStart(3, '0')}`;
};

const users = db.prepare('SELECT id, title, role FROM users').all() as {id: number, title: string, role: string}[];

const updateStmt = db.prepare('UPDATE users SET staff_code = ? WHERE id = ?');

let updated = 0;
for (const user of users) {
    const title = user.title || user.role || '';
    const newCode = generateStaffCode(title, user.id);
    updateStmt.run(newCode, user.id);
    console.log(`Updated user ${user.id} code to ${newCode}`);
    updated++;
}

console.log(`Successfully synchronized ${updated} users.`);
