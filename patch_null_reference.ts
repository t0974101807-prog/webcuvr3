import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

content = content.replace(
  `{editingNews.category.toLowerCase()}</label>`,
  `{editingNews?.category?.toLowerCase()}</label>`
);

content = content.replace(
  `{editingNews.category === 'Lĩnh vực hoạt động'`,
  `{editingNews?.category === 'Lĩnh vực hoạt động'`
);

content = content.replace(
  `{editingNews.category === 'Dịch vụ pháp lý'`,
  `{editingNews?.category === 'Dịch vụ pháp lý'`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Fixed undefined category reference');
