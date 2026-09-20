const fs = require('fs');
let content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const fieldsToRemove = [
  'editPersonalRecords',
  'manageEvents',
  'manageLegalDocs',
  'viewEventHistory'
];

fieldsToRemove.forEach(field => {
  const regex = new RegExp('<td className="px-2 py-6 text-center">\\s*\\{renderIcon\\("[a-zA-Z]+", "' + field + '"\\)\\}\\s*</td>', 'g');
  content = content.replace(regex, '');
});

fs.writeFileSync('src/components/ERP.tsx', content);
