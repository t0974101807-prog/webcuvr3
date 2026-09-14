const fs = require('fs');
const lines = fs.readFileSync('src/components/ERP.tsx', 'utf-8').split('\n');
let lastComp = '';
for (let i = 0; i < 14437; i++) {
  if (lines[i].includes('const ') && lines[i].includes(' = ({')) lastComp = `${i+1}: ${lines[i]}`;
  if (lines[i].includes('function ')) lastComp = `${i+1}: ${lines[i]}`;
}
console.log(lastComp);
