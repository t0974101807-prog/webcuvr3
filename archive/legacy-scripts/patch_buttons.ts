import fs from 'fs';

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// We want to replace standard bg-[var(--color-primary)] in buttons to a gradient.
// Also update hover states.
// Generic replacement for buttons and clickable items:
content = content.replace(
  /bg-\[var\(--color-primary\)\]/g,
  'bg-gradient-to-r from-blue-600 to-indigo-600'
);

content = content.replace(
  /hover:bg-\[#0d3a4a\]/g,
  'hover:from-blue-700 hover:to-indigo-700'
);

content = content.replace(
  /hover:bg-\[#0a2e3b\]/g,
  'hover:from-blue-700 hover:to-indigo-700'
);
content = content.replace(
  /hover:bg-\[#0a2f3c\]/g,
  'hover:from-blue-700 hover:to-indigo-700'
);
content = content.replace(
  /hover:bg-\[#0A2F3D\]/g,
  'hover:from-blue-700 hover:to-indigo-700'
);


fs.writeFileSync('src/components/ERP.tsx', content);

console.log('patched primary colors to gradients');
