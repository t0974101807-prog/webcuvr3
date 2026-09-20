const fs = require('fs');
const file = 'src/components/ERP.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');

// Find the end of the new NotificationsView
const endOfNewNotificationsView = lines.findIndex((line, index) => index > 3595 && line === '  );' && lines[index + 1] === '}');
const endLine = endOfNewNotificationsView + 1;

// Find the start of SettingsView
const startOfSettingsView = lines.findIndex(line => line.startsWith('function SettingsView'));

if (endLine !== -1 && startOfSettingsView !== -1) {
  const newLines = [
    ...lines.slice(0, endLine + 1),
    ...lines.slice(startOfSettingsView)
  ];
  fs.writeFileSync(file, newLines.join('\n'), 'utf8');
  console.log('Fixed duplication');
} else {
  console.log('Could not find boundaries');
}
