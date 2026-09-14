import fs from 'fs';

function updateFile(path, regex, replacement) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content, 'utf8');
  }
}

// WhyChooseUs.tsx: Add nice floating hover to cards
updateFile('src/components/WhyChooseUs.tsx', 
  /shadow-sm hover:shadow-md transition-shadow/g, 
  'shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all');

// Team.tsx: Add active scale
updateFile('src/components/Team.tsx',
  /className="group relative"/g,
  'className="group relative cursor-pointer active:scale-[0.98] transition-transform duration-300"');

// About.tsx: buttons active state
updateFile('src/components/About.tsx',
  /hover:bg-\[var\(--color-primary-light\)\] transition-all duration-300/g,
  'hover:bg-[var(--color-primary-light)] transition-all duration-300 active:scale-95');
updateFile('src/components/About.tsx',
  /hover:bg-\[var\(--color-primary\)\] hover:text-white transition-all duration-300/g,
  'hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 active:scale-95');

// Network.tsx styling
updateFile('src/components/Network.tsx',
  /hover:shadow-md transition-shadow/g,
  'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]');

// Navbar.tsx button hover polish
updateFile('src/components/Navbar.tsx',
  /activeClass="!text-\[var\(--color-primary\)\] after:!scale-x-100"/g,
  'activeClass="!text-[var(--color-primary)] after:!scale-x-100 font-extrabold"');

// Hero.tsx heading and buttons text shadow
updateFile('src/components/Hero.tsx',
  /text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 md:mb-8 leading-tight tracking-tight/g,
  'text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 md:mb-8 leading-tight tracking-tight drop-shadow-md');

updateFile('src/components/Hero.tsx',
  /className="group relative w-full sm:w-auto px-8 py-3 sm:px-10 sm:py-4 bg-\[var\(--color-accent\)\]/g,
  'className="group relative w-full sm:w-auto px-8 py-3 sm:px-10 sm:py-4 bg-[var(--color-accent)] active:scale-95');

updateFile('src/components/Hero.tsx',
  /className="group w-full sm:w-auto px-8 py-3 sm:px-10 sm:py-4 bg-transparent/g,
  'className="group w-full sm:w-auto px-8 py-3 sm:px-10 sm:py-4 bg-transparent active:scale-95');

// Fix ERP.tsx tables
if (fs.existsSync('src/components/ERP.tsx')) {
  let erpContent = fs.readFileSync('src/components/ERP.tsx', 'utf-8');
  // Just in case fix_micro... didn't catch all
  erpContent = erpContent.replace(/overflow-x-auto(?!.*custom-scrollbar touch-pan-x)/g, 'overflow-x-auto custom-scrollbar touch-pan-x');
  fs.writeFileSync('src/components/ERP.tsx', erpContent);
}

console.log("Enhanced UI elements");
