import fs from 'fs';

let content = fs.readFileSync('src/components/LegalServices.tsx', 'utf-8');

// Section bg
content = content.replace('bg-[#0F172A] text-white', 'bg-white text-gray-900');

// Background texture
content = content.replace('radial-gradient(#ffffff 1px', 'radial-gradient(#000000 1px');

// h3
content = content.replace('text-white leading-tight', 'text-gray-900 leading-tight');
content = content.replace('text-white/50', 'text-gray-500');

// p definition description
content = content.replace('text-white/60 text-base', 'text-gray-600 text-base');

// Card
content = content.replace(
  'className="group relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-lg hover:bg-white/10 transition-all duration-500 flex flex-col cursor-pointer"',
  'className="group relative bg-white border border-gray-100 shadow-sm p-8 rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col cursor-pointer"'
);

// Upload button inside card
content = content.replace('bg-white/10 hover:bg-[var(--color-accent)] text-white/60 hover:text-white', 'bg-gray-100 hover:bg-[var(--color-primary)] text-gray-500 hover:text-white');

// Card title
content = content.replace('text-white mb-4 group-hover:text-[var(--color-accent)]', 'text-gray-900 mb-4 group-hover:text-[var(--color-primary)]');

// Card desc
content = content.replace('text-white/60 leading-relaxed group-hover:text-white/80', 'text-gray-600 leading-relaxed group-hover:text-gray-900');

// View Details
content = content.replace('text-white/50 hover:text-[var(--color-accent)]', 'text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)]');

// Download Link
content = content.replace(
  'bg-white/10 hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-accent)]', 
  'bg-gray-50 hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-primary)] shadow-sm'
);

// Bottom border animation
content = content.replace('bg-[var(--color-accent)] group-hover:w-full', 'bg-[var(--color-primary)] group-hover:w-full rounded-b-xl');

// Remove border-t border-white/10 for download link container
content = content.replace('border-t border-white/10 w-full', 'border-t border-gray-100 w-full mt-4');

fs.writeFileSync('src/components/LegalServices.tsx', content);
console.log('Done!');
