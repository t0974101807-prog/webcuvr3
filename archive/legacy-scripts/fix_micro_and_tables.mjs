import fs from 'fs';

// 1. Fix ERP.tsx tables
let erpContent = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// Ensure tables don't squish on mobile
erpContent = erpContent.replace(/table className="w-full/g, 'table className="w-full min-w-max');

// Add custom scrollbar and touch pan styling to overflow containers
erpContent = erpContent.replace(/className="([^"]*overflow-x-auto[^"]*)"/g, (match, p1) => {
    if (!p1.includes('custom-scrollbar')) {
        return `className="${p1} custom-scrollbar touch-pan-x"`;
    }
    return match;
});

// Also make some hovering interactions smoother such as buttons in ERP
erpContent = erpContent.replace(/hover:bg-/g, 'transition-all duration-300 hover:bg-');
erpContent = erpContent.replace(/transition-all duration-300 transition-all duration-300 hover:bg-/g, 'transition-all duration-300 hover:bg-'); // deduplicate
// transition-colors could be upgraded to transition-all duration-300
erpContent = erpContent.replace(/transition-colors/g, 'transition-all duration-300 active:scale-95');

fs.writeFileSync('src/components/ERP.tsx', erpContent);


// 2. Fix Services.tsx micro-interactions
let servicesContent = fs.readFileSync('src/components/Services.tsx', 'utf-8');
servicesContent = servicesContent.replace(
    /className="group relative([^"]*)p-8 rounded-lg([^"]*)"/g,
    'className="group relative$1p-8 rounded-lg$2 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)] active:scale-95"'
);
fs.writeFileSync('src/components/Services.tsx', servicesContent);

// 3. Fix LegalServices.tsx micro-interactions
let legalServicesContent = fs.readFileSync('src/components/LegalServices.tsx', 'utf-8');
legalServicesContent = legalServicesContent.replace(
    /className="group relative([^"]*)p-8 rounded-xl([^"]*)"/g,
    'className="group relative$1p-8 rounded-xl$2 active:scale-[0.98]"'
);
fs.writeFileSync('src/components/LegalServices.tsx', legalServicesContent);


// 4. Update index.css to add custom-scrollbar
let cssContent = fs.readFileSync('src/index.css', 'utf-8');
if (!cssContent.includes('.custom-scrollbar')) {
    cssContent += `
@layer utilities {
  .custom-scrollbar::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(107, 114, 128, 0.8);
  }
}
`;
    fs.writeFileSync('src/index.css', cssContent);
}

// 5. Enhance Button Hover effects globally (e.g. active:scale-95)
let headerContent = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');
headerContent = headerContent.replace(/hover:text-/g, 'transition-all duration-300 hover:text-');
headerContent = headerContent.replace(/transition-all duration-300 transition-all duration-300 hover:text-/g, 'transition-all duration-300 hover:text-'); // deduplicate
fs.writeFileSync('src/components/Navbar.tsx', headerContent);

console.log("Applied interaction and responsive fixes.");
