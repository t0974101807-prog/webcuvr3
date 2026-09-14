"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
code = code.replace(
  `  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);
  const [activeTab, setActiveTab] = useState("dashboard");`,
  `  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);`
);
fs.writeFileSync("src/components/ERP.tsx", code);
console.log("Fixed state order!");
