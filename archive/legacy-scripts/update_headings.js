import fs from 'fs';
import path from 'path';

function standardizeHeadings(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      standardizeHeadings(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Standardize section subtitles (uppercase accent text above title)
      content = content.replace(
        /className=["']text-var--color-accent[^"']*font-medium\s+uppercase\s+tracking-[^"']+\s+mb-4\s+text-[a-z]+["']/g,
        'className="text-[var(--color-accent)] font-semibold uppercase tracking-[0.2em] mb-4 text-xs sm:text-sm"'
      );
      content = content.replace(
        /className=["']text-\[var\(--color-accent\)\]\s+font-medium\s+uppercase\s+tracking-[^"']+\s+mb-4\s+text-[a-z]+["']/g,
        'className="text-[var(--color-accent)] font-semibold uppercase tracking-[0.2em] mb-4 text-xs sm:text-sm"'
      );

      // Standardize section titles (H3 mostly)
      content = content.replace(
        /className=["']text-\d+xl[^"']*font-serif font-bold text-\[var\(--color-text-dark\)\][^"']*["']/g,
        'className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[var(--color-text-dark)] mb-6 leading-tight"'
      );
      
      // Look for text-gray-900 heading 4 and make them consistent text-xl
      content = content.replace(
        /className=["']text-2xl font-serif font-bold text-gray-900[^"']*["']/g,
        'className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-text-dark)] mb-4"'
      );
      content = content.replace(
        /className=["']text-xl font-serif font-bold text-gray-900[^"']*["']/g,
        'className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-text-dark)] mb-3"'
      );
      
      // Specific fix for Contact block without text-dark but same role
      content = content.replace(
        /className=["']text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6 md:mb-8 leading-tight["']/g,
        'className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6 md:mb-8 leading-tight"' 
      );
      
      // Convert gray text properly for better contract and standardized sizes
      content = content.replace(
        /className=["']text-gray-600 text-lg font-light["']/g,
        'className="text-base sm:text-lg text-gray-600 leading-relaxed"'
      );
      content = content.replace(
        /className=["']text-gray-600 text-lg max-w-2xl mx-auto["']/g,
        'className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"'
      );
      
      // Standardize large spacing (py-24, py-32 to py-16 md:py-24)
      content = content.replace(
        /className=["']py-24\b/g,
        'className="py-16 md:py-24 '
      );
      content = content.replace(
        /className=["']py-16 md:py-32\b/g,
        'className="py-16 md:py-24 '
      );

      fs.writeFileSync(fullPath, content);
    }
  }
}
standardizeHeadings('src/components');
console.log('Standardized Headings');
