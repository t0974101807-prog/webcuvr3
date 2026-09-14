const fs = require('fs');let c = fs.readFileSync('src/components/ERP.tsx', 'utf8');const t = '{selectedEvent.location && (
            <div className="bg-white rounded-lg p-4 flex justify-between items-center shadow-sm mt-4">
              <span className="text-slate-800 font-medium">Địa điểm</span>
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={16} />
                <span>{selectedEvent.location}</span>
              </div>
            </div>
          )}'; const t_rep = t + '

          <div className="bg-white rounded-lg p-4 mt-4 shadow-sm">
            <h3 className="text-slate-800 font-bold mb-3">Lịch sử hoạt động</h3>
            <div className="space-y-4">
              {history.filter(h => h.title === selectedEvent.title).length === 0 ? <p className="text-sm text-slate-500">Chưa có lịch sử.</p> : history.filter(h => h.title === selectedEvent.title).map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className={}>
                    {h.action === 'Thêm' ? <Plus size={16} /> : h.action === 'Xóa' ? <Trash2 size={16} /> : <Calendar size={16} />}
                  </div>
                  <div>
                    <p className="text-slate-800"><span className="font-semibold">{h.user}</span> đã <span className={}>{h.action.toLowerCase()}</span> sự kiện</p>
                    <p className="text-xs text-slate-500">{h.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>'; if (c.includes(t)) { c = c.replace(t, t_rep); console.log('Replaced'); } else { console.log('Not found'); } c = c.replace(/{canManageEvents && (s*<button s*onClick={() => handleEditEvent(selectedEvent)}s*className="px-4 py-2 rounded-lg bg-white shadow-sm text-slate-800 font-medium transition-all duration-300 hover:bg-slate-100 transition-all duration-300 active:scale-95">s*Sửas*</button>s*)}/, '<button onClick={() => handleEditEvent(selectedEvent)} className="px-4 py-2 rounded-lg bg-white shadow-sm text-slate-800 font-medium transition-all duration-300 hover:bg-slate-100 active:scale-95">Sửa</button>'); fs.writeFileSync('src/components/ERP.tsx', c);