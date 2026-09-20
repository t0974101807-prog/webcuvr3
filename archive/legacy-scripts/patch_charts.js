const fs = require('fs');
let content = fs.readFileSync('src/components/ERP.tsx', 'utf-8');

// Add ComposedChart to line 27 import
if (!content.includes('ComposedChart } from \'recharts\';')) {
  content = content.replace(
    "AreaChart, Area } from 'recharts';",
    "AreaChart, Area, ComposedChart } from 'recharts';"
  );
}

// Fix Dashboard Chart
const dashboardChartRegex = /<AreaChart data={t\.recordsStats \? trendData : chartData}.*?<\/AreaChart>|<AreaChart data={trendData}.*?<\/AreaChart>/s;
const dashboardChartReplace = `<ComposedChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#114B5F" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#114B5F" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F3A712" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#F3A712" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} dy={15} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} dx={-10} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => \`\${(v/1000000).toFixed(0)}M\`} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} dx={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                formatter={(value, name, props) => [
                  name === t.revenue ? value.toLocaleString() + ' VNĐ' : value, 
                  name
                ]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
              
              {/* Records */}
              <Area yAxisId="left" type="monotone" name={t.records} dataKey="records" stroke="none" fillOpacity={1} fill="url(#colorRecords)" />
              <Line yAxisId="left" type="monotone" name={t.records} dataKey="records" stroke="#114B5F" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#114B5F' }} />
              
              {/* Revenue */}
              <Area yAxisId="right" type="monotone" name={t.revenue} dataKey="revenue" stroke="none" fillOpacity={1} fill="url(#colorRevenue)" />
              <Line yAxisId="right" type="monotone" name={t.revenue} dataKey="revenue" stroke="#F3A712" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#F3A712' }} />
            </ComposedChart>`;

if (dashboardChartRegex.test(content)) {
  content = content.replace(dashboardChartRegex, dashboardChartReplace);
  console.log("Dashboard Chart updated");
} else {
  console.log("Could not find dashboard AreaChart");
}


// Fix Report Chart 1 (Revenue)
const revenueChartRegex = /<AreaChart data={chartData}>([\s\S]*?)<stop offset="5%" stopColor="#3b82f6" stopOpacity={0\.8}\/>([\s\S]*?)<Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url\(#colorRevenue\)" \/>\s*<\/AreaChart>/s;
const revenueChartReplace = `<ComposedChart data={chartData}>$1<stop offset="5%" stopColor="#114B5F" stopOpacity={0.4}/>$2<Area type="monotone" dataKey="value" stroke="none" fillOpacity={1} fill="url(#colorRevenue)" /><Line type="monotone" dataKey="value" stroke="#114B5F" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#114B5F' }} /></ComposedChart>`;

if (revenueChartRegex.test(content)) {
  content = content.replace(revenueChartRegex, revenueChartReplace);
  console.log("Report Chart 1 updated");
}

// Fix Report Chart 2
const eventChartRegex = /<AreaChart data={chartData}>\s*<CartesianGrid strokeDasharray="3 3" vertical={false} \/>\s*<XAxis dataKey="name" \/>\s*<YAxis \/>\s*<Tooltip \/>\s*<Area type="monotone" dataKey="value" stroke="#06b6d4" fill="#cffafe" \/>\s*<\/AreaChart>/s;
const eventChartReplace = `<ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="value" stroke="none" fillOpacity={1} fill="url(#colorEvents)" />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }} />
            </ComposedChart>`;

if (eventChartRegex.test(content)) {
  content = content.replace(eventChartRegex, eventChartReplace);
  console.log("Report Chart 2 updated");
}

// Fix Report Chart 3
const generalChartRegex = /<AreaChart data={chartData}>([\s\S]*?)<stop offset="5%" stopColor="#6366f1" stopOpacity={0\.8}\/>([\s\S]*?)<Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url\(#colorGeneral\)" \/>\s*<\/AreaChart>/s;
const generalChartReplace = `<ComposedChart data={chartData}>$1<stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>$2<Area type="monotone" dataKey="value" stroke="none" fillOpacity={1} fill="url(#colorGeneral)" /><Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} /></ComposedChart>`;

if (generalChartRegex.test(content)) {
  content = content.replace(generalChartRegex, generalChartReplace);
  console.log("Report Chart 3 updated");
}


fs.writeFileSync('src/components/ERP.tsx', content);
