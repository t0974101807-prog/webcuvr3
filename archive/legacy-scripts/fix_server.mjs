import fs from 'fs';

let content = fs.readFileSync('src/server.ts', 'utf-8');

// The endpoints are app.get('/api/legal-services', ...), app.post('/api/legal-services', ...)
// Actually it's probably easier to just let them be, but deleting is cleaner. Let's just comment them out if we can, or just leave them.
// "mục nào giống nhau thì hiển thị 1 nội dung" -> let's make sure /api/services returns EVERYTHING (Lĩnh vực hoạt động + Dịch vụ)
// Wait, Services table already has everything because we migrated legal_services to services!
// Let's modify /api/services to return all of them.

// Find where db.prepare("SELECT * FROM services").all() is and see if it has WHERE clause
// Actually, Services endpoint: db.prepare("SELECT * FROM services").all() will now return ALL items, which means Both "Lĩnh vực hoạt động" and "Dịch vụ pháp lý" will be returned! 
// This is exactly what we want if we want to display both on the same grid.

fs.writeFileSync('src/server.ts', content);
console.log('Fixed server.ts');
