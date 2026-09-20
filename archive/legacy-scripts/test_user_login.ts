import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('lawfirm.db');

try {
  // Clear any test user
  db.prepare("DELETE FROM users WHERE username = 'testuser123'").run();
  
  // Insert a test user
  const data = {
    username: 'testuser123',
    password: 'Abcd@12345',
    name: 'Test User',
    role: 'user'
  };
  
  const fields = ['username', 'password', 'name', 'role'];
  let keys: string[] = [];
  let values: string[] = [];
  let params: any[] = [];
  
  for (const field of fields) {
    if (data[field] !== undefined) {
      keys.push(field);
      values.push('?');
      let val = data[field];
      if (field === 'password' && val) {
        val = bcrypt.hashSync(val.toString(), 10);
      }
      params.push(val);
    }
  }
  
  const query = `INSERT INTO users (${keys.join(', ')}) VALUES (${values.join(', ')})`;
  db.prepare(query).run(...params);
  console.log('Inserted test user successfully.');
  
  // Query back the user
  const dbUser: any = db.prepare(`SELECT * FROM users WHERE username = ?`).get('testuser123');
  console.log('Stored password hash:', dbUser.password);
  
  // Try to compare
  const isMatch = bcrypt.compareSync('Abcd@12345', dbUser.password);
  console.log('Login match:', isMatch);
  
  // Clean up
  db.prepare("DELETE FROM users WHERE username = 'testuser123'").run();
} catch (e) {
  console.error('Error:', e);
}
