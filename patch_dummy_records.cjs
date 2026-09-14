const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

const recordsMatch = /const \[records, setRecords\] = useState<any\[\]>\(\[[\s\S]*?\]\);/
content = content.replace(recordsMatch, 'const [records, setRecords] = useState<any[]>([]);');

const mockRewardsMatch = /const mockRewards = \[[\s\S]*?\];/
content = content.replace(mockRewardsMatch, 'const mockRewards = [];');

fs.writeFileSync(path, content, 'utf8');
console.log("Cleared dummy data");
