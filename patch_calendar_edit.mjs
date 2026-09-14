import fs from 'fs';
let content = fs.readFileSync('src/components/CustomCalendar.tsx', 'utf8');

content = content.replace(
  `const handleEditEvent = (event: Event) => {\n    setModalMode('edit');\n    setSelectedEvent(event);`,
  `const handleEditEvent = (event: Event) => {\n    if (!canManageEvents) return;\n    setModalMode('edit');\n    setSelectedEvent(event);`
);

fs.writeFileSync('src/components/CustomCalendar.tsx', content);
console.log("Patched CustomCalendar Edit");
