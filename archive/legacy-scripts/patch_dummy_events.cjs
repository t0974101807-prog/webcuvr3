const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const \[events, setEvents\] = useState<any\[\]>\(\(\) => \{[\s\S]*?\}\);/;
content = content.replace(regex, 'const [events, setEvents] = useState<any[]>([]);');

// Also fix: topEmployee = filteredRecords[0]?.mainAssignee || "";
content = content.replace(/topEmployee = filteredRecords\[0\]\.mainAssignee \|\| "Nguyễn Văn A";/g, 'topEmployee = filteredRecords[0]?.mainAssignee || "";');

fs.writeFileSync(path, content, 'utf8');
console.log("Cleared dummy events");
