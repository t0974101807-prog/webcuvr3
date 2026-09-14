const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

code = code.replace(
  `  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n  useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);\n  const [activeTab, setActiveTab] = useState("dashboard");`,
  `  const [activeTab, setActiveTab] = useState("dashboard");\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n  useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);`
);

fs.writeFileSync('src/components/ERP.tsx', code);
console.log('Fixed state order!');
