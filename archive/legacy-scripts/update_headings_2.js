import fs from 'fs';
import path from 'path';

function finalCleanup(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      finalCleanup(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix headings that still use gray-900 or have lg:text-6xl
      content = content.replace(
        /className=["']text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-tight["']/g,
        'className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] leading-tight mb-6"'
      );

      // Same for any other similar combinations
      content = content.replace(
        /text-gray-900/g,
        'text-[var(--color-text-dark)]'
      );
      content = content.replace(
        /text-gray-800/g,
        'text-[var(--color-text-dark)]'
      );

      fs.writeFileSync(fullPath, content);
    }
  }
}
finalCleanup('src/components');
console.log('Final Cleanup Done');
