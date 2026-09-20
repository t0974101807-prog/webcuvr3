import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Replace handleDeleteService
content = content.replace(`  const handleDeleteService = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;
    try {
      setServices(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/services/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete', error);
      alert('Xoá thất bại: ' + (error.message || error));
      fetchData();
    }
  };`, `  const handleDeleteService = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa dịch vụ',
      message: 'Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setServices(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/services/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };`);

// Replace handleDeleteLegalService
content = content.replace(`  const handleDeleteLegalService = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;
    try {
      setLegalServices(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/legal-services/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete legal service', error);
      alert('Xoá thất bại: ' + (error.message || error));
      fetchData();
    }
  };`, `  const handleDeleteLegalService = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa dịch vụ pháp lý',
      message: 'Bạn có chắc chắn muốn xóa dịch vụ pháp lý này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setLegalServices(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/legal-services/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete legal service', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };`);

// Replace handleDeleteNews
content = content.replace(`  const handleDeleteNews = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tin tức này?')) return;
    try {
      setNews(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/news/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      window.dispatchEvent(new Event('news-updated'));
    } catch (error: any) {
      console.error('Failed to delete news', error);
      alert('Xoá thất bại: ' + (error.message || error));
      fetchData();
    }
  };`, `  const handleDeleteNews = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setNews(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/news/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
          window.dispatchEvent(new Event('news-updated'));
        } catch (error: any) {
          console.error('Failed to delete news', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };`);

// Replace handleDeleteRecruitment
content = content.replace(`  const handleDeleteRecruitment = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tin tuyển dụng này?')) return;
    try {
      setRecruitment(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/recruitment/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete', error);
      alert('Xoá thất bại: ' + (error.message || error));
      fetchData();
    }
  };`, `  const handleDeleteRecruitment = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa tin tuyển dụng',
      message: 'Bạn có chắc chắn muốn xóa tin tuyển dụng này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setRecruitment(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/recruitment/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };`);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Fixed ALL confirm dialogs');
