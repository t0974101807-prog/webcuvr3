import fs from 'fs';

let content = fs.readFileSync('src/db/database.ts', 'utf-8');

if (!content.includes('CREATE TABLE IF NOT EXISTS live_messages')) {
    const tableCreation = `
  CREATE TABLE IF NOT EXISTS live_messages(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    visitor_id TEXT, 
    sender_type TEXT, 
    content TEXT, 
    file_url TEXT,
    file_name TEXT,
    created_at TEXT, 
    is_read INTEGER DEFAULT 0
  );
`;
    content = content.replace('CREATE TABLE IF NOT EXISTS users(id', tableCreation + '  CREATE TABLE IF NOT EXISTS users(id');
    fs.writeFileSync('src/db/database.ts', content);
    console.log('Added live_messages table');
}

