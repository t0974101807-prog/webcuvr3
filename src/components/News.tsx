import ReactMarkdown from 'react-markdown';
import { fetchApi } from '../utils/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ArrowRight, X, Clock, ArrowUpRight } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  content?: string;
  icon?: string;
  file_url?: string;
  video_url?: string;
  created_at?: string;
  category?: string;
}

interface NewsProps {
  isLoggedIn?: boolean;
  user?: any;
}

export default function News({ isLoggedIn: propIsLoggedIn, user: propUser }: NewsProps = {}) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeTab, setActiveTab] = useState('TẤT CẢ');
  const [viewingNews, setViewingNews] = useState<NewsItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const [isInternalUser, setIsInternalUser] = useState(() => {
    if (propIsLoggedIn) return true;
    try {
      const savedUser = localStorage.getItem("lawfirm_user");
      return !!savedUser;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (propIsLoggedIn) {
      setIsInternalUser(true);
    } else {
      try {
        const savedUser = localStorage.getItem("lawfirm_user");
        setIsInternalUser(!!savedUser);
      } catch {
        setIsInternalUser(false);
      }
    }
  }, [propIsLoggedIn]);

  useEffect(() => {
    const fetchNews = () => {
      fetchApi(`/api/news?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNews(data);
          } else {
            console.error('Failed to fetch news: expected array, got:', data);
            setNews([]);
          }
        })
        .catch(err => console.error('Failed to fetch news', err));
    };

    fetchNews();

    const handleNewsUpdate = () => {
      fetchNews();
    };

    window.addEventListener('news-updated', handleNewsUpdate);
    const handleOpenNews = (e: any) => {
      setViewingNews(e.detail);
    };
    window.addEventListener('open-news-modal', handleOpenNews);

    return () => {
      window.removeEventListener('open-news-modal', handleOpenNews);

      window.removeEventListener('news-updated', handleNewsUpdate);
    };
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Mới cập nhật';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getCategoryLabel = (item: NewsItem) => {
    if (item.category) return item.category;
    switch (item.icon) {
      case 'Megaphone': return 'Thông báo';
      case 'BookOpen': return 'Tài liệu';
      case 'MessageCircle': return 'Tư vấn';
      case 'Radio': return 'Truyền thông';
      case 'Calendar': return 'Sự kiện';
      default: return 'Tin tức';
    }
  };

  const MAIN_TABS = ['SỰ KIỆN', 'THÔNG BÁO', 'TRUYỀN THÔNG'];

  // Filter news based on active tab and internal access
  // Lọc lấy các bài không thuộc Lĩnh vực hoạt động hay Dịch vụ
  const validNews = news.filter(item => {
    if (item.category === 'Lĩnh vực hoạt động' || item.category === 'Dịch vụ') return false;
    if (!isInternalUser) {
      if (item.category === 'CHÚC MỪNG SINH NHẬT' || item.category === 'HOẠT ĐỘNG NỘI BỘ') {
        return false;
      }
    }
    return true;
  });

  const filteredNews = validNews.filter(item => {
    const cat = item.category || 'TIN TỨC';
    if (activeTab === 'TẤT CẢ') return true;
    return cat === activeTab;
  });

  const featuredNews = filteredNews[0];
  const listNews = filteredNews.slice(1, visibleCount);

  const tabs = [
    { id: 'TẤT CẢ', label: 'TẤT CẢ' },
    { id: 'TIN TỨC', label: 'TIN TỨC' },
    { id: 'SỰ KIỆN', label: 'SỰ KIỆN' },
    ...(isInternalUser ? [
      { id: 'CHÚC MỪNG SINH NHẬT', label: '🎉 SINH NHẬT' },
      { id: 'HOẠT ĐỘNG NỘI BỘ', label: '📸 NỘI BỘ' },
    ] : []),
    { id: 'THÔNG BÁO', label: 'THÔNG BÁO' },
    { id: 'TRUYỀN THÔNG', label: 'TRUYỀN THÔNG' },
  ];

  return (
    <section id="news" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column - Featured News */}
          <div>
            {featuredNews ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="group cursor-pointer relative hover:shadow-2xl hover:shadow-slate-100/80 transition-all duration-500 p-5 -m-5 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/20"
                onClick={() => setViewingNews(featuredNews)}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0 z-10 bg-white/80 p-2 rounded-lg backdrop-blur-sm">
                  <ArrowUpRight className="text-[var(--color-text-dark)]" size={24} />
                </div>
                <div className="aspect-[3/2] w-full overflow-hidden rounded-lg mb-6 bg-gray-100 shadow-sm">
                  {featuredNews.file_url ? (
                    <img 
                      src={featuredNews.file_url} 
                      alt={featuredNews.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                      <span>Không có hình ảnh</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 font-medium">
                    {getCategoryLabel(featuredNews)} | {formatDate(featuredNews.created_at)}
                  </div>
                  
                  <h2 className="text-3xl font-bold text-[var(--color-text-dark)] leading-tight group-hover:text-[var(--color-primary)] transition-colors uppercase">
                    {featuredNews.title}
                  </h2>
                  
                  <p className="text-gray-600 text-base leading-relaxed line-clamp-3">
                    {featuredNews.description}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="p-12 text-center text-gray-600 bg-gray-50 rounded-lg">
                Chưa có tin tức nổi bật
              </div>
            )}
          </div>

          {/* Right Column - Tabs & News List */}
          <div>
            {/* Tabs Header */}
            <div className="bg-[#f3f4f6] mb-6">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setVisibleCount(5); }}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* News List */}
            <div className="space-y-6">
              {listNews.length > 0 ? (
                listNews.map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="flex gap-4 group cursor-pointer border-b border-slate-100 pb-5 last:border-0 last:pb-0 relative hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-300 p-3 -mx-3 rounded-xl border border-transparent hover:border-slate-100/60 hover:bg-slate-50/50"
                    onClick={() => setViewingNews(item)}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0 z-10">
                      <ArrowUpRight className="text-[var(--color-primary)]" size={20} />
                    </div>
                    <div className="w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
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
                      <div className="text-xs text-gray-600 mb-1">
                        {getCategoryLabel(item)} | {formatDate(item.created_at)}
                      </div>
                      <h4 className="font-bold text-[var(--color-text-dark)] text-sm leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors uppercase">
                        {item.title}
                      </h4>
                    </div>
                  </motion.div>
                ))
              ) : (
                !featuredNews && (
                  <div className="text-gray-600 text-sm italic">
                    Đang cập nhật thêm tin tức...
                  </div>
                )
              )}
            </div>

            {filteredNews.length > visibleCount && (
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 5)}
                  className="inline-flex items-center gap-1 text-gray-600 font-medium hover:underline text-sm border-b border-gray-400 pb-0.5"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* News Detail Modal */}
      <AnimatePresence>
        {viewingNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setViewingNews(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-[var(--color-text-dark)] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="relative h-64 sm:h-80 flex-shrink-0">
                {viewingNews.file_url ? (
                  <img 
                    src={viewingNews.file_url} 
                    alt={viewingNews.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <span>Không có hình ảnh</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6 sm:p-8">
                  <div className="flex items-center gap-3 text-white/90 text-sm mb-2">
                    <span className="bg-[var(--color-primary)] px-2 py-0.5 rounded-lg text-xs font-bold text-white">
                      {getCategoryLabel(viewingNews)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {formatDate(viewingNews.created_at)}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                    {viewingNews.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setViewingNews(null)}
                  className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-lg transition-colors backdrop-blur-sm"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto">
                {viewingNews.video_url && (
                  <div className="mb-6 rounded-xl overflow-hidden bg-black shadow-lg">
                    {viewingNews.video_url.includes('youtube.com') || viewingNews.video_url.includes('youtu.be') ? (
                      <iframe
                        src={viewingNews.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        title="Video Player"
                        className="w-full aspect-video border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={viewingNews.video_url}
                        controls
                        className="w-full max-h-[400px] object-contain mx-auto"
                      >
                        Trình duyệt không hỗ trợ phát video.
                      </video>
                    )}
                  </div>
                )}

                <p className="text-lg text-[var(--color-text-dark)] font-medium mb-6 leading-relaxed">
                  {viewingNews.description}
                </p>
                
                <div className="prose prose-lg max-w-none text-gray-600">
                  {viewingNews.content ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{viewingNews.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-600 italic">Nội dung chi tiết đang được cập nhật.</p>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setViewingNews(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
