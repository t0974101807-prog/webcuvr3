const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Standardize headings (H2 - Section Titles)
      // Usually "text-3xl md:text-4xl font-serif font-bold"
      content = content.replace(/text-3xl\s+md:text-4xl\s+font-serif\s+font-bold/g, 'text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)]');
      
      // Standardize subtitles
      content = content.replace(/text-\[var\(--color-accent\)\]\s+font-medium\s+uppercase\s+tracking-\[0\.2em\]\s+mb-4\s+text-sm/g, 'text-[var(--color-accent)] font-medium uppercase tracking-[0.2em] mb-4 text-xs sm:text-sm');
      
      // Standardize body text paragraphs (usually text-lg or text-base text-gray-600)
      content = content.replace(/text-lg\s+md:text-xl\s+text-gray-600/g, 'text-base sm:text-lg md:text-xl text-gray-600');
      content = content.replace(/text-gray-500/g, 'text-gray-600'); // Increase contrast
      
      // Add font-serif to any H1..H6 if it's missing (complex regex, skip for now, fix specific knowns)
      
      fs.writeFileSync(fullPath, content);
    }
  }
}
replaceInDir('src/components');
console.log('Replaced colors and fonts successfully');
