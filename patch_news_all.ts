import fs from 'fs';

let content = fs.readFileSync('src/components/News.tsx', 'utf-8');

// Change default activeTab to 'TẤT CẢ'
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\('TIN TỨC'\);/,
  `const [activeTab, setActiveTab] = useState('TẤT CẢ');`
);

// Update tabs array
content = content.replace(
  /const tabs = \[\s*\{ id: 'TIN TỨC', label: 'TIN TỨC' \},/,
  `const tabs = [\n    { id: 'TẤT CẢ', label: 'TẤT CẢ' },\n    { id: 'TIN TỨC', label: 'TIN TỨC' },`
);

// Update filter logic
content = content.replace(
  /const filteredNews = news\.filter\(item => \{\s+const cat = item\.category \|\| 'TIN TỨC';\s+if \(activeTab === 'TIN TỨC'\) \{\s+return !MAIN_TABS\.includes\(cat\);\s+\}\s+return cat === activeTab;\s+\}\);/,
  `const filteredNews = news.filter(item => {\n    const cat = item.category || 'TIN TỨC';\n    if (activeTab === 'TẤT CẢ') return true;\n    if (activeTab === 'TIN TỨC') {\n      return !MAIN_TABS.includes(cat);\n    }\n    return cat === activeTab;\n  });`
);

fs.writeFileSync('src/components/News.tsx', content);
console.log('Added TAT CA tab');
