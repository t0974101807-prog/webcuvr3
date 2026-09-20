const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

// 1. Add state variable for mobile menu
const stateAnchor = `  const [activeTab, setActiveTab] = useState("dashboard");`;
if (code.includes(stateAnchor) && !code.includes("isMobileMenuOpen")) {
  code = code.replace(
    stateAnchor,
    `  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n` + stateAnchor
  );
}

// 2. Add Menu icon import if not present
if (!code.includes('Menu,') && code.includes('lucide-react')) {
  code = code.replace('import {', 'import { Menu,');
}

// 3. Update Sidebar wrapper
const sidebarOld = `<aside className="w-64 bg-[var(--color-primary)] text-white flex flex-col flex-shrink-0">`;
const sidebarNew = `
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={\`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-primary)] text-white flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}\`}>`;

if (code.includes(sidebarOld)) {
  code = code.replace(sidebarOld, sidebarNew);
}

// 4. Update header to include Menu button
const headerOld = `<header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-8 flex-shrink-0">
          <div>`;
const headerNew = `<header className="bg-white border-b border-gray-200 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>`;

if (code.includes(headerOld)) {
  code = code.replace(headerOld, headerNew);
}

// 5. Ensure main content can scroll properly on mobile
const mainContainerOld = `<div className="flex-1 flex flex-col overflow-hidden">`;
const mainContainerNew = `<div className="flex-1 flex flex-col overflow-hidden w-full relative">`;
if (code.includes(mainContainerOld)) {
    code = code.replace(mainContainerOld, mainContainerNew);
}

// 6. Make header title responsive text
const titleOld = `<h2 className="text-xl font-bold text-[var(--color-text-dark)] font-serif">`;
const titleNew = `<h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--color-text-dark)] font-serif line-clamp-1">`;
if (code.includes(titleOld)) {
  code = code.replace(titleOld, titleNew);
}

// Close mobile menu on tab change effect
const useEffectAnchor = `  const [activeTab, setActiveTab] = useState("dashboard");`;
if (code.includes(useEffectAnchor) && !code.includes("useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);")) {
   code = code.replace(
      useEffectAnchor,
      `  useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);\n  const [activeTab, setActiveTab] = useState("dashboard");`
   );
}

fs.writeFileSync('src/components/ERP.tsx', code);
console.log('Fixed responsive layout!');
