import fs from 'fs';

// Update Services.tsx check
let services = fs.readFileSync('src/components/Services.tsx', 'utf-8');
services = services.replace(
  `then(data => setRelatedNews(data.filter((n: any) => n.category === viewingService.title)))`,
  `then(data => setRelatedNews(data.filter((n: any) => n.related_service === viewingService.title)))`
);
fs.writeFileSync('src/components/Services.tsx', services);

// Update LegalServices.tsx check
let legalServices = fs.readFileSync('src/components/LegalServices.tsx', 'utf-8');
legalServices = legalServices.replace(
  `then(data => setRelatedNews(data.filter((n: any) => n.category === viewingService.title)))`,
  `then(data => setRelatedNews(data.filter((n: any) => n.related_service === viewingService.title)))`
);
fs.writeFileSync('src/components/LegalServices.tsx', legalServices);

// Update active tabs filter
let news = fs.readFileSync('src/components/News.tsx', 'utf-8');
news = news.replace(
  `const filteredNews = news.filter(item => {\n    const cat = item.category || 'TIN TỨC';\n    if (activeTab === 'TẤT CẢ') return true;\n    if (activeTab === 'TIN TỨC') {\n      return !MAIN_TABS.includes(cat);\n    }\n    return cat === activeTab;\n  });`,
  `const filteredNews = news.filter(item => {\n    const cat = item.category || 'TIN TỨC';\n    if (activeTab === 'TẤT CẢ') return true;\n    return cat === activeTab;\n  });`
);
fs.writeFileSync('src/components/News.tsx', news);

console.log('Filters patched');
