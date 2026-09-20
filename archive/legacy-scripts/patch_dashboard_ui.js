const fs = require('fs');

let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

const overviewCardsSearch = `{/* Overview Cards (Hình 3 style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t.totalRecords}</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-slate-800">{totalRecords}</h3>
            <span className="text-sm font-medium text-slate-400 mb-1">hồ sơ</span>
          </div>
        </div>
        
        <div className="bg-[#f0fdf4] p-5 rounded-lg shadow-sm border border-emerald-100">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-2">{t.expectedRevenue}</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-emerald-700">{(expectedRevenue / 1000000).toFixed(1)}</h3>
            <span className="text-sm font-medium text-emerald-600 mb-1">tr</span>
          </div>
        </div>
        
        <div className="bg-blue-50/70 p-5 rounded-lg shadow-sm border border-blue-100">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-2">{t.monthlyRevenue}</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-blue-700">{(monthlyRevenue / 1000000).toFixed(1)}</h3>
            <span className="text-sm font-medium text-blue-600 mb-1">tr</span>
          </div>
        </div>
        
        <div className="bg-purple-50/70 p-5 rounded-lg shadow-sm border border-purple-100">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-widest mb-2">{t.monthlyNewRecords}</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-purple-700">{monthlyNewRecords}</h3>
            <span className="text-sm font-medium text-purple-600 mb-1">hồ sơ</span>
          </div>
        </div>
      </div>`;

const overviewCardsReplace = `{/* Overview Cards (Hình 3 style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* TỔNG SỐ HỒ SƠ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{t.totalRecords}</p>
            <div className="p-2 bg-slate-50 rounded-lg">
              <FolderOpen size={18} className="text-slate-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[36px] font-bold text-[#1f2937] leading-none">{totalRecords}</h3>
            <span className="text-[14px] font-medium text-slate-400">hồ sơ</span>
          </div>
        </div>
        
        {/* DOANH THU DỰ KIẾN */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{t.expectedRevenue}</p>
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp size={18} className="text-green-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[36px] font-bold text-[#1f2937] leading-none">{(expectedRevenue / 1000000).toLocaleString('vi-VN')}</h3>
            <span className="text-[14px] font-medium text-slate-400">triệu VNĐ</span>
          </div>
        </div>
        
        {/* DOANH THU THÁNG NÀY */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{t.monthlyRevenue}</p>
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[36px] font-bold text-blue-600 leading-none">{(monthlyRevenue / 1000000).toLocaleString('vi-VN')}</h3>
            <span className="text-[14px] font-medium text-slate-400">triệu VNĐ</span>
          </div>
        </div>
        
        {/* HỒ SƠ TẠO TRONG THÁNG */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{t.monthlyNewRecords}</p>
            <div className="p-2 bg-purple-50 rounded-lg">
              <FileCheck size={18} className="text-purple-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[36px] font-bold text-purple-600 leading-none">{monthlyNewRecords}</h3>
            <span className="text-[14px] font-medium text-slate-400">hồ sơ mới</span>
          </div>
        </div>
      </div>`;

content = content.replace(overviewCardsSearch, overviewCardsReplace);


const chartsSearch = `{/* Line Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-6">{t.recordsStats}</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => \`\${(v/1000000).toFixed(0)}M\`} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => [
                  name === t.revenue ? value.toLocaleString() + ' VNĐ' : value, 
                  name
                ]}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
              <Line yAxisId="left" type="monotone" name={t.records} dataKey="records" stroke="#114B5F" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" name={t.revenue} dataKey="revenue" stroke="#F3A712" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>`;

const chartsReplace = `{/* Line Chart & Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[16px] font-bold text-[#1f2937] uppercase tracking-wide">{t.recordsStats}</h3>
          <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-sm font-medium">14 Ngày gần nhất</div>
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} dy={15} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} dx={-10} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => \`\${(v/1000000).toFixed(0)}M\`} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} dx={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => [
                  name === t.revenue ? value.toLocaleString() + ' VNĐ' : value, 
                  name
                ]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
              <Area yAxisId="left" type="monotone" name={t.records} dataKey="records" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRecords)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
              <Area yAxisId="right" type="monotone" name={t.revenue} dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>`;

content = content.replace(chartsSearch, chartsReplace);

const bottomGridSearch = `{/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadline Warning list */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="text-sm font-bold text-slate-800">{t.nearingDeadline} ({nearingDeadlineRecords.length})</h3>
          </div>
          {nearingDeadlineRecords.length > 0 ? (
            <div className="space-y-4">
              {nearingDeadlineRecords.slice(0, 5).map((record, idx) => (
                <div key={idx} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setActiveTab('records')}>
                  <div className="flex gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shrink-0"></div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{record.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: {record.id} • Khách: {record.client}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-orange-600">{record.deadline}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">Hạn chót</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <CheckCircle size={32} className="text-emerald-400 mb-2" />
              <p className="text-emerald-600 font-medium text-sm">Không có hồ sơ nào sắp đến hạn</p>
            </div>
          )}
        </div>

        {/* Categories breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-6">{t.recordsByCategory}</h3>
          
          <div className="space-y-4">
            {Object.entries(recordsByCategory).sort((a,b) => b[1] - a[1]).map(([category, count], idx) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-sm text-slate-600">{category}</span>
                </div>
                <span className="font-bold text-slate-800">{count}</span>
              </div>
            ))}
          </div>
          
          {Object.keys(recordsByCategory).length === 0 && (
            <div className="text-center text-slate-500 text-sm py-4">Chưa có dữ liệu</div>
          )}
        </div>
      </div>`;

const bottomGridReplace = `{/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadline Warning list */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1f2937] uppercase tracking-wide">{t.nearingDeadline} <span className="text-red-500">({nearingDeadlineRecords.length})</span></h3>
            </div>
            {nearingDeadlineRecords.length > 5 && (
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline" onClick={() => setActiveTab('records')}>{t.viewAll}</button>
            )}
          </div>
          {nearingDeadlineRecords.length > 0 ? (
            <div className="space-y-3 flex-1">
              {nearingDeadlineRecords.slice(0, 5).map((record, idx) => (
                <div key={idx} className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer" onClick={() => setActiveTab('records')}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-[15px] group-hover:text-blue-600 transition-colors">{record.title}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">Mã: {record.id} • Khách hàng: <span className="font-medium text-slate-700">{record.client}</span></p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full">
                      <CalendarDays size={14} />
                      <span className="text-sm font-bold">{record.deadline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">An toàn</h4>
              <p className="text-slate-500 text-sm">Không có hồ sơ nào sắp đến hạn cần xử lý gấp.</p>
            </div>
          )}
        </div>

        {/* Categories breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-[#1f2937] uppercase tracking-wide">{t.recordsByCategory}</h3>
          </div>
          
          <div className="flex-1">
            <div className="space-y-4">
              {Object.entries(recordsByCategory).sort((a,b) => b[1] - a[1]).map(([category, count], idx) => {
                const percentage = Math.round((count / totalRecords) * 100) || 0;
                return (
                  <div key={category} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 text-[15px]">{count}</span>
                        <span className="text-xs font-bold text-slate-400 w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: \`\${percentage}%\`, backgroundColor: COLORS[idx % COLORS.length] }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {Object.keys(recordsByCategory).length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-500 text-sm py-4">Chưa có dữ liệu</div>
              </div>
            )}
          </div>
        </div>
      </div>`;

content = content.replace(bottomGridSearch, bottomGridReplace);

fs.writeFileSync('src/components/ERP.tsx', content);
console.log('Dashboard UI updated!');
