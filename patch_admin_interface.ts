import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');
const searchDef = `interface Service {
  id: number;
  title: string;
  description: string;
  content?: string;
  icon: string;
  file_url?: string;
  file_name?: string;
  category?: string;
}`;

const replaceDef = `interface Service {
  id: number;
  title: string;
  description: string;
  content?: string;
  icon: string;
  file_url?: string;
  file_name?: string;
  category?: string;
  related_service?: string;
}`;

content = content.replace(searchDef, replaceDef);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);

console.log('Fixed interface type');
