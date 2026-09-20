import fs from 'fs';
let content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const historyModal = `{showHistory && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
        <h2 className="text-xl font-bold text-slate-800">Lịch sử hoạt động sự kiện</h2>
        <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg">
          <X size={20} />
        </button>
      </div>
      
      <div className="overflow-y-auto p-6 flex-1">
        {history.length === 0 ? (
          <div className="text-center text-slate-500 py-8">Chưa có lịch sử hoạt động nào.</div>
        ) : (
          <div className="space-y-4">
            {history.map((h, i) => (
              <div key={i} className="flex gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                <div className={\`mt-1 shrink-0 \${h.action === 'Thêm' ? 'text-green-500' : h.action === 'Xóa' ? 'text-red-500' : 'text-blue-500'}\`}>
                  {h.action === 'Thêm' ? <Plus size={20} /> : h.action === 'Xóa' ? <Trash2 size={20} /> : <Calendar size={20} />}
                </div>
                <div>
                  <p className="text-sm text-slate-800"><span className="font-semibold">{h.user}</span> đã <span className={\`font-semibold \${h.action === 'Thêm' ? 'text-green-600' : h.action === 'Xóa' ? 'text-red-600' : 'text-blue-600'}\`}>{h.action.toLowerCase()}</span> sự kiện:</p>
                  <p className="text-base font-medium text-slate-900 mt-1">{h.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{h.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}\n        `;

content = content.replace(/{showAddEvent && \(/g, historyModal + '{showAddEvent && (');

fs.writeFileSync('src/components/ERP.tsx', content);
console.log("Patched history modal");
