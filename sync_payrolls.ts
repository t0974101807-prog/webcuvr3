import Database from 'better-sqlite3';

const db = new Database('lawfirm.db');

const updatePayrolls = () => {
  const payrolls = db.prepare('SELECT p.id, u.staff_code, u.title, u.branch FROM monthly_payrolls p JOIN users u ON p.user_id = u.id').all() as any[];
  
  const updateStmt = db.prepare('UPDATE monthly_payrolls SET staff_code = ?, title = ?, branch = ? WHERE id = ?');
  
  let updated = 0;
  for (const p of payrolls) {
    if (p.staff_code) {
      updateStmt.run(p.staff_code, p.title, p.branch, p.id);
      updated++;
    }
  }
  return updated;
};

const count = updatePayrolls();
console.log(`Updated ${count} payrolls.`);
