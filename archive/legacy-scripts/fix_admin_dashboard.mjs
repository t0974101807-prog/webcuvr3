import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Remove types
content = content.replace(/\| 'legal_services'/g, '');
// Remove NavItem
content = content.replace(/<NavItem icon=\{<Scale \/>\} label="Dịch Vụ" active=\{activeTab === 'legal_services'\}.*\n/g, '');
// Replace setEditingLegalService
content = content.replace(/setEditingLegalService\(null\); /g, '');
content = content.replace(/setEditingLegalService\(null\);/g, '');
// Change activeTab === 'legal_services' block to never render by replacing it with a fake condition
content = content.replace(/\{activeTab === 'legal_services'/g, '{false');

// Replace usages of legalServices in map
content = content.replace(/legalServices\.map/g, "services.filter(s => s.category === 'Dịch vụ pháp lý').map");

// Update /api/legal-services fetch
content = content.replace(/fetchApi\(`\/api\/legal-services\?t=\$\{t\}`\),/g, "Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),");

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Fixed AdminDashboard.tsx');
