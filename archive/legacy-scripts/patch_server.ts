import fs from 'fs';

let content = fs.readFileSync('src/server.ts', 'utf-8');

if (!content.includes('import contactRoutes')) {
    content = content.replace('import payrollRoutes from "./modules/payroll/payroll.routes";', 'import payrollRoutes from "./modules/payroll/payroll.routes";\nimport contactRoutes from "./modules/contact/contact.routes";');
    content = content.replace('app.use("/api", payrollRoutes);', 'app.use("/api", payrollRoutes);\napp.use("/api", contactRoutes);');
    fs.writeFileSync('src/server.ts', content);
    console.log('Added contactRoutes to server.ts');
}

let dbContent = fs.readFileSync('src/db/database.ts', 'utf-8');
if (!dbContent.includes('CREATE TABLE IF NOT EXISTS messages')) {
    const tableCreation = `
  CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, content TEXT, created_at TEXT, is_read INTEGER DEFAULT 0, reply_notes TEXT);
  CREATE TABLE IF NOT EXISTS visitor_stats(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT UNIQUE, visitors INTEGER DEFAULT 0, page_views INTEGER DEFAULT 0, chats INTEGER DEFAULT 0);
`;
    dbContent = dbContent.replace('CREATE TABLE IF NOT EXISTS users(id', tableCreation + '  CREATE TABLE IF NOT EXISTS users(id');
    fs.writeFileSync('src/db/database.ts', dbContent);
    console.log('Added tables to database.ts');
}
