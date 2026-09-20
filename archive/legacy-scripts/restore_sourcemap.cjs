const fs = require('fs');
const content = fs.readFileSync('src/components/ERP_cached.js', 'utf8');
const match = content.match(/sourceMappingURL=data:application\/json;base64,(.*)/);
if (match) {
  const base64 = match[1];
  const json = Buffer.from(base64, 'base64').toString('utf8');
  const parsed = JSON.parse(json);
  fs.writeFileSync('src/components/ERP_original.tsx', parsed.sourcesContent[0]);
  console.log('Restored original ERP.tsx!');
} else {
  console.log('No source map found');
}
