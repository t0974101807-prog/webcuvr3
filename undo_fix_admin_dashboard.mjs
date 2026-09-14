import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Undo activeTab type removal
content = content.replace(/activeTab, setActiveTab\] = useState\<'services'  \| 'news'/g, "activeTab, setActiveTab] = useState<'services' | 'legal_services' | 'news'");

// Unfortunately NavItem was fully deleted. Let's add it back right after the "Lĩnh Vực Hoạt Động" NavItem (which is 'services')
content = content.replace(
  /(<NavItem icon=\{<Briefcase \/>\} label="Lĩnh Vực Hoạt Động" active=\{activeTab === 'services'\}.*\n)/g,
  `$1                <NavItem icon={<Scale />} label="Dịch Vụ" active={activeTab === 'legal_services'} onClick={() => { setActiveTab('legal_services'); setEditingService(null); setEditingLegalService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />\n`
);

// We deleted setEditingLegalService(null) from many places, but maybe it's not super critical if users switch tabs and don't get state reset. 
// Let's add it back to the tab switch callbacks just on nav items.
content = content.replace(/setActiveTab\('services'\); /g, "setActiveTab('services'); setEditingLegalService(null); ");
content = content.replace(/setActiveTab\('news'\); /g, "setActiveTab('news'); setEditingLegalService(null); ");
content = content.replace(/setActiveTab\('team'\); /g, "setActiveTab('team'); setEditingLegalService(null); ");
content = content.replace(/setActiveTab\('recruitment'\); /g, "setActiveTab('recruitment'); setEditingLegalService(null); ");
content = content.replace(/setActiveTab\('users'\); /g, "setActiveTab('users'); setEditingLegalService(null); ");
content = content.replace(/setActiveTab\('stats'\); /g, "setActiveTab('stats'); setEditingLegalService(null); ");
content = content.replace(/setActiveTab\('messages'\); /g, "setActiveTab('messages'); setEditingLegalService(null); ");
content = content.replace(/setActiveTab\('settings'\); /g, "setActiveTab('settings'); setEditingLegalService(null); ");
content = content.replace(/setActiveTab\('profile'\); /g, "setActiveTab('profile'); setEditingLegalService(null); ");

// Restore true activeTab rendering condition
content = content.replace(/\{false && \(/g, "{activeTab === 'legal_services' && (");

// Restore legalServices.map
content = content.replace(/services\.filter\(s => s\.category === 'Dịch vụ pháp lý'\)\.map/g, "legalServices.map");

// Restore fetchApi
content = content.replace(/Promise\.resolve\(\{ ok: true, json: \(\) => Promise\.resolve\(\[\]\) \}\),/g, "fetchApi(`/api/legal-services?t=${t}`),");

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Restored AdminDashboard.tsx!');
