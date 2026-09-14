const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const replacements = [
  {
    target: `        {/* VỤ VIỆC MỚI THEO THÁNG */}
        <div className="bg-gradient-to-br from-[#f43f5e] via-[#fb7185] to-[#f43f5e] bg-[length:200%_200%] animate-gradient p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">`,
    replacement: `        {/* VỤ VIỆC MỚI THEO THÁNG */}
        <div className="bg-gradient-to-br from-[#f43f5e] via-[#fb7185] to-[#f43f5e] bg-[length:200%_200%] animate-gradient p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
            <FileCheck size={100} className="text-white" />
          </div>
          <div className="flex justify-between items-start mb-3 relative z-10">`
  },
  {
    target: `          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[32px] font-bold text-white leading-none">
              {monthlyNewRecords}
            </h3>`,
    replacement: `          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[32px] font-bold text-white leading-none">
              {monthlyNewRecords}
            </h3>`
  },
  {
    target: `        {/* HOÀN THÀNH */}
        <div
          className="bg-gradient-to-br from-[#06b6d4] via-[#22d3ee] to-[#06b6d4] bg-[length:200%_200%] animate-gradient p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
          onClick={() => {
            setActiveTab("records");
            setTimeout(
              () =>
                window.dispatchEvent(
                  new CustomEvent("set-record-tab", { detail: "hoàn thành" }),
                ),
              50,
            );
          }}
        >
          <div className="flex justify-between items-start mb-3">`,
    replacement: `        {/* HOÀN THÀNH */}
        <div
          className="bg-gradient-to-br from-[#06b6d4] via-[#22d3ee] to-[#06b6d4] bg-[length:200%_200%] animate-gradient p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
          onClick={() => {
            setActiveTab("records");
            setTimeout(
              () =>
                window.dispatchEvent(
                  new CustomEvent("set-record-tab", { detail: "hoàn thành" }),
                ),
              50,
            );
          }}
        >
          <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
            <CheckCircle2 size={100} className="text-white" />
          </div>
          <div className="flex justify-between items-start mb-3 relative z-10">`
  },
  {
    target: `          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[32px] font-bold text-white leading-none">
              {totalRecords - inProgressRecords.length}
            </h3>`,
    replacement: `          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[32px] font-bold text-white leading-none">
              {totalRecords - inProgressRecords.length}
            </h3>`
  },
  {
    target: `        {/* LỊCH HẸN SẮP TỚI */}
        <div
          className="bg-gradient-to-br from-[#0ea5e9] via-[#38bdf8] to-[#0ea5e9] bg-[length:200%_200%] animate-gradient p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
          onClick={() => setActiveTab("events")}
        >
          <div className="flex justify-between items-start mb-3">`,
    replacement: `        {/* LỊCH HẸN SẮP TỚI */}
        <div
          className="bg-gradient-to-br from-[#0ea5e9] via-[#38bdf8] to-[#0ea5e9] bg-[length:200%_200%] animate-gradient p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
          onClick={() => setActiveTab("events")}
        >
          <div className="absolute -right-4 -bottom-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
            <Users size={100} className="text-white" />
          </div>
          <div className="flex justify-between items-start mb-3 relative z-10">`
  },
  {
    target: `          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[32px] font-bold text-white leading-none">
              {upcomingMeetings}
            </h3>`,
    replacement: `          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[32px] font-bold text-white leading-none">
              {upcomingMeetings}
            </h3>`
  },
  {
    target: `        {/* QUÁ HẠN */}
        <div
          className="bg-gradient-to-br from-[#e11d48] via-[#f43f5e] to-[#e11d48] bg-[length:200%_200%] animate-gradient p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
          onClick={() => {
            setActiveTab("records");
            setTimeout(
              () =>
                window.dispatchEvent(
                  new CustomEvent("set-record-tab", { detail: "overdue" }),
                ),
              50,
            );
          }}
        >
          <div className="flex justify-between items-start mb-3">`,
    replacement: `        {/* QUÁ HẠN */}
        <div
          className="bg-gradient-to-br from-[#e11d48] via-[#f43f5e] to-[#e11d48] bg-[length:200%_200%] animate-gradient p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
          onClick={() => {
            setActiveTab("records");
            setTimeout(
              () =>
                window.dispatchEvent(
                  new CustomEvent("set-record-tab", { detail: "overdue" }),
                ),
              50,
            );
          }}
        >
          <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
            <AlertCircle size={100} className="text-white" />
          </div>
          <div className="flex justify-between items-start mb-3 relative z-10">`
  },
  {
    target: `          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <h3 className="text-[32px] font-bold text-white leading-none">
              {overdueRecords.length}
            </h3>`,
    replacement: `          </div>
          <div className="flex items-baseline gap-2 mt-auto relative z-10">
            <h3 className="text-[32px] font-bold text-white leading-none">
              {overdueRecords.length}
            </h3>`
  }
];

let changedCount = 0;
for (const r of replacements) {
    if (code.includes(r.target)) {
        code = code.replace(r.target, r.replacement);
        changedCount++;
    } else {
        console.log("Could not find target:", r.target.substring(0, 50));
    }
}

console.log("Changed", changedCount, "targets");
fs.writeFileSync('src/components/ERP.tsx', code);
