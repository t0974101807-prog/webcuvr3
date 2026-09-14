const fs = require('fs');
let code = fs.readFileSync('src/components/CustomCalendar.tsx', 'utf8');

console.log(code.substring(code.length - 200));
