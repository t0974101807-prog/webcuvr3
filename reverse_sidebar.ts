import fs from 'fs';

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// Reverse Sidebar Desktop
content = content.replace(
  'className="w-64 bg-gradient-to-b from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-white flex flex-col flex-shrink-0 shadow-xl"',
  'className="w-64 bg-[var(--color-primary)] text-white flex flex-col flex-shrink-0"'
);

// Reverse Menu item hover effect
content = content.replace(
  /hover:bg-white\/20 text-white\/80 hover:text-white hover:shadow-lg hover:backdrop-blur-sm/g,
  'hover:bg-white/10 text-white/70 hover:text-white'
);

// Reverse Active menu item string
content = content.replace(
  /bg-white\/25 text-white shadow-lg backdrop-blur-md/g,
  'bg-white/10 text-white'
);

// Reverse Mobile sidebar
content = content.replace(
  'className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out shadow-2xl',
  'className="fixed inset-y-0 left-0 w-64 bg-[var(--color-primary)] text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out'
);
content = content.replace(
  'className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out shadow-2xl',
  'className={`fixed inset-y-0 left-0 w-64 bg-[var(--color-primary)] text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out'
);

fs.writeFileSync('src/components/ERP.tsx', content);

console.log('reversed sidebar patch');
