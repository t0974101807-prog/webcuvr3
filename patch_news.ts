import fs from 'fs';

let content = fs.readFileSync('src/components/News.tsx', 'utf-8');

// Add visibleCount state
content = content.replace(
  `const [viewingNews, setViewingNews] = useState<NewsItem | null>(null);`,
  `const [viewingNews, setViewingNews] = useState<NewsItem | null>(null);\n  const [visibleCount, setVisibleCount] = useState(5);`
);

// Reset visibleCount when tab changes
content = content.replace(
  `onClick={() => setActiveTab(tab.id)}`,
  `onClick={() => { setActiveTab(tab.id); setVisibleCount(5); }}`
);

// Update slice
content = content.replace(
  `const listNews = filteredNews.slice(1, 5); // Increased to 5 items to show more`,
  `const listNews = filteredNews.slice(1, visibleCount);`
);

// Handle "Đang cập nhật" text
const emptyBlockRegex = /\{\/\* News List \*\/\}([\s\S]*?)<div className="mt-8 flex justify-end">/m;
const newEmptyBlock = `{/* News List */}
            <div className="space-y-6">
              {listNews.length > 0 ? (
                listNews.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex gap-4 group cursor-pointer border-b border-gray-100 pb-6 last:border-0 last:pb-0 relative"
                    onClick={() => setViewingNews(item)}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0 z-10">
                      <ArrowUpRight className="text-[#1e3a8a]" size={20} />
                    </div>
                    <div className="w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.file_url ? (
                        <img 
                          src={item.file_url} 
                          alt={item.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-200">
                          Không có hình ảnh
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-xs text-gray-500 mb-1">
                        {getCategoryLabel(item)} | {formatDate(item.created_at)}
                      </div>
                      <h4 className="font-bold text-[#2c3e50] text-sm leading-snug line-clamp-2 group-hover:text-[#1e3a8a] transition-colors uppercase">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))
              ) : (
                !featuredNews && (
                  <div className="text-gray-500 text-sm italic">
                    Đang cập nhật thêm tin tức...
                  </div>
                )
              )}
            </div>

            {filteredNews.length > visibleCount && (
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 5)}
                  className="inline-flex items-center gap-1 text-gray-500 font-medium hover:underline text-sm border-b border-gray-400 pb-0.5"
                >
                  Xem thêm
                </button>
              </div>
            )}
            
            {filteredNews.length <= visibleCount && filteredNews.length > 0 && (
`;

content = content.replace(emptyBlockRegex, newEmptyBlock);

// Add event listener for opening news from outside
const listenerRegex = /window\.addEventListener\('news-updated', handleNewsUpdate\);([\s\S]*?)return \(\) => \{/m;
const newListener = `window.addEventListener('news-updated', handleNewsUpdate);
    const handleOpenNews = (e: any) => {
      setViewingNews(e.detail);
    };
    window.addEventListener('open-news-modal', handleOpenNews);

    return () => {
      window.removeEventListener('open-news-modal', handleOpenNews);
`;

content = content.replace(listenerRegex, newListener);

fs.writeFileSync('src/components/News.tsx', content);

console.log('News.tsx patched');
