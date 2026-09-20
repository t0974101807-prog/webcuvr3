import fs from 'fs';

let content = fs.readFileSync('src/components/News.tsx', 'utf-8');

const filterSearch = `  // Filter news based on active tab
  const filteredNews = news.filter(item => {
    const cat = item.category || 'TIN TỨC';
    if (activeTab === 'TẤT CẢ') return true;
    return cat === activeTab;
  });`;

const filterReplace = `  // Filter news based on active tab
  // Lọc lấy các bài không thuộc Lĩnh vực hoạt động hay Dịch vụ pháp lý
  const validNews = news.filter(item => {
    return item.category !== 'Lĩnh vực hoạt động' && item.category !== 'Dịch vụ pháp lý';
  });

  const filteredNews = validNews.filter(item => {
    const cat = item.category || 'TIN TỨC';
    if (activeTab === 'TẤT CẢ') return true;
    return cat === activeTab;
  });`;

content = content.replace(filterSearch, filterReplace);

fs.writeFileSync('src/components/News.tsx', content);
console.log('Fixed News component filtering');
