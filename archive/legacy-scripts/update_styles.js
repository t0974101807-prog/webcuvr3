import fs from 'fs';
import path from 'path';

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix colors
      content = content.replace(/#114B5F/g, 'var(--color-primary)');
      content = content.replace(/#D4AF37/g, 'var(--color-accent)');
      content = content.replace(/#F8F9FA/g, 'var(--color-text-light)');
      content = content.replace(/#293241/g, 'var(--color-text-dark)');
      
      // Fix font sizes and standardization
      content = content.replace(/text-3xl md:text-4xl/g, 'text-3xl sm:text-4xl md:text-5xl');
      content = content.replace(/text-xl md:text-2xl/g, 'text-xl sm:text-2xl');
      
      // Make text-gray-500 higher contrast
      content = content.replace(/text-gray-500/g, 'text-gray-600');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}
replaceInDir('src/components');
console.log('Processed');
