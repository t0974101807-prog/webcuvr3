import fs from 'fs';

let servicesContent = fs.readFileSync('src/components/Services.tsx', 'utf-8');
const servicesRegex = /(<div key=\{news\.id\} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow)(")/g;
const servicesReplace = `$1 cursor-pointer"$2 onClick={() => {\n                          setViewingService(null);\n                          const newsSection = document.getElementById('news');\n                          if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth' });\n                          setTimeout(() => window.dispatchEvent(new CustomEvent('open-news-modal', { detail: news })), 500);\n                        }}`;
servicesContent = servicesContent.replace(servicesRegex, servicesReplace);
fs.writeFileSync('src/components/Services.tsx', servicesContent);

let legalServicesContent = fs.readFileSync('src/components/LegalServices.tsx', 'utf-8');
const legalServicesRegex = /(<div key=\{news\.id\} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow)(")/g;
const legalServicesReplace = `$1 cursor-pointer"$2 onClick={() => {\n                          setViewingService(null);\n                          const newsSection = document.getElementById('news');\n                          if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth' });\n                          setTimeout(() => window.dispatchEvent(new CustomEvent('open-news-modal', { detail: news })), 500);\n                        }}`;
legalServicesContent = legalServicesContent.replace(legalServicesRegex, legalServicesReplace);
fs.writeFileSync('src/components/LegalServices.tsx', legalServicesContent);

console.log('Patched related news clicks');
