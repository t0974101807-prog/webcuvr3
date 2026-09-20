const fs = require('fs');

let content = fs.readFileSync('src/components/Services.tsx', 'utf-8');

// Replacements
content = content.replace(/export default function Services/g, 'export default function LegalServices');
content = content.replace(/ServicesProps/g, 'LegalServicesProps');
content = content.replace(/const \[services, setServices\]/g, 'const [legalServices, setLegalServices]');
content = content.replace(/setServices\(data\)/g, 'setLegalServices(data)');
content = content.replace(/fetchServices =/g, 'fetchLegalServices =');
content = content.replace(/fetchServices\(\)/g, 'fetchLegalServices()');
content = content.replace(/\/api\/services/g, '/api/legal-services');
content = content.replace(/id="services"/g, 'id="legal-services"');
content = content.replace(/Lĩnh Vực Hoạt Động/g, 'Dịch Vụ');
content = content.replace(/services\.map/g, 'legalServices.map');
content = content.replace(/services\.find/g, 'legalServices.find');

fs.writeFileSync('src/components/LegalServices.tsx', content);
console.log('Restored LegalServices.tsx');
