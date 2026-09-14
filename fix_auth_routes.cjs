const fs = require('fs');
let file = fs.readFileSync('src/modules/auth/auth.routes.ts', 'utf-8');
file = file.replace(/const isMatch = await bcrypt.compare\(password, (.*?).password\);/g, 'const isMatch = await bcrypt.compare(password, ($1 as any).password);');
file = file.replace(/!(\w+).password/g, '!($1 as any).password');
file = file.replace(/(\w+).password === null/g, '($1 as any).password === null');
file = file.replace(/dbUser = /g, 'dbUser: any = ');
fs.writeFileSync('src/modules/auth/auth.routes.ts', file);
console.log('Fixed auth.routes.ts');
