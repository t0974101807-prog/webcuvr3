import fs from 'fs';

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

// Add confirmDialog state
const stateSearch = `const [adminNewsSubFilter, setAdminNewsSubFilter] = useState<string>('ALL');`;
const stateReplace = `const [adminNewsSubFilter, setAdminNewsSubFilter] = useState<string>('ALL');
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);`;
content = content.replace(stateSearch, stateReplace);

// Update all confirm() calls
const confirmUser = `if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;`;
const confirmUserReplace = `setConfirmDialog({
      isOpen: true,
      title: 'Xóa người dùng',
      message: 'Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setUsers(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/users/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete user', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    }); return;`;
content = content.replace(confirmUser + `\n    try {
      setUsers(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/users/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete user', error);
      alert('Xoá thất bại: ' + (error.message || error));
      fetchData();
    }`, confirmUserReplace);


const confirmServ = `if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;`;
const confirmServReplace = `setConfirmDialog({
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
        } catch (error) {
          console.error('Failed to delete service', error);
          alert('Lỗi: ' + error);
          fetchData();
        }
      }
    }); return;`;
content = content.replace(confirmServ + `\n    try {
      setServices(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/services/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (error) {
      console.error('Failed to delete service', error);
      alert('Lỗi: ' + error);
      fetchData();
    }`, confirmServReplace);

const confirmLegalServ = `if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;`;
const confirmLegalServReplace = `setConfirmDialog({
      isOpen: true,
      title: 'Xóa dịch vụ',
      message: 'Bạn có chắc chắn muốn xóa dịch vụ pháp lý này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setLegalServices(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/legal-services/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error) {
          console.error('Failed to delete legal service', error);
          alert('Lỗi: ' + error);
          fetchData();
        }
      }
    }); return;`;
content = content.replace(confirmLegalServ + `\n    try {
      setLegalServices(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/legal-services/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (error) {
      console.error('Failed to delete legal service', error);
      alert('Lỗi: ' + error);
      fetchData();
    }`, confirmLegalServReplace);

const confirmNews = `if (!confirm('Bạn có chắc chắn muốn xóa tin tức này?')) return;`;
const confirmNewsReplace = `setConfirmDialog({
      isOpen: true,
      title: 'Xóa tin tức',
      message: 'Bạn có chắc chắn muốn xóa tin tức này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setNews(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/news/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
          window.dispatchEvent(new CustomEvent('news-updated'));
        } catch (error: any) {
          console.error('Failed to delete news', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    }); return;`;
content = content.replace(confirmNews + `\n    try {
      setNews(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/news/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      window.dispatchEvent(new CustomEvent('news-updated'));
    } catch (error: any) {
      console.error('Failed to delete news', error);
      alert('Xoá thất bại: ' + (error.message || error));
      fetchData();
    }`, confirmNewsReplace);

const confirmRecruit = `if (!confirm('Bạn có chắc chắn muốn xóa tin tuyển dụng này?')) return;`;
const confirmRecruitReplace = `setConfirmDialog({
      isOpen: true,
      title: 'Xóa tuyển dụng',
      message: 'Bạn có chắc chắn muốn xóa tin tuyển dụng này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setRecruitment(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/recruitment/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete recruitment', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    }); return;`;
content = content.replace(confirmRecruit + `\n    try {
      setRecruitment(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/recruitment/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete recruitment', error);
      alert('Xoá thất bại: ' + (error.message || error));
      fetchData();
    }`, confirmRecruitReplace);


const confirmTeam = `if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;`;
const confirmTeamReplace = `setConfirmDialog({
      isOpen: true,
      title: 'Xóa đội ngũ',
      message: 'Bạn có chắc chắn muốn xóa thành viên này khỏi đội ngũ? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setTeam(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(\`/api/team/\${id}\`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    }); return;`;
content = content.replace(confirmTeam + `\n    try {
      setTeam(prev => prev.filter(item => item.id !== id));
      const res = await fetchApi(\`/api/team/\${id}\`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete', error);
      alert('Xoá thất bại: ' + (error.message || error));
      fetchData();
    }`, confirmTeamReplace);


const renderDialog = `
      {/* Confirm Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 custom-scrollbar">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-600 font-medium">
                {confirmDialog.message}
              </p>
            </div>
            
            <div className="flex gap-2 p-4 bg-gray-50 border-t border-gray-100 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} /> Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(`    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">`, `    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">\n${renderDialog}`);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Replaced confirm dialogs');
