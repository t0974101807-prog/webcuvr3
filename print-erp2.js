const fs = require('fs');
const lines = fs.readFileSync('src/components/ERP.tsx', 'utf8').split('\n');
console.log(lines.slice(3960, 4100).join('\n'));
