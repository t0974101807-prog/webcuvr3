"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const targetStr = `        {activeTab === "info" && (`;
const insertIndex = code.indexOf(targetStr);
if (insertIndex !== -1) {
  const injection = `        {activeTab === "performance" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-blue-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <FolderOpen size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "T\u1ED5ng h\u1ED3 s\u01A1" : "Total Cases"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {performanceData.reduce((acc, curr) => acc + (typeof curr.totalCases === 'number' ? curr.totalCases : 0), 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-amber-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Clock size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "\u0110ang th\u1EE5 l\xFD" : "In Progress"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {performanceData.reduce((acc, curr) => acc + (typeof curr.inProgressCases === 'number' ? curr.inProgressCases : 0), 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-emerald-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Ho\xE0n th\xE0nh" : "Completed"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {performanceData.reduce((acc, curr) => acc + (typeof curr.completedCases === 'number' ? curr.completedCases : 0), 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-red-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <AlertCircle size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">
                {language === "vi" ? "Qu\xE1 h\u1EA1n" : "Overdue"}
              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {performanceData.reduce((acc, curr) => acc + (typeof curr.overdueCases === 'number' ? curr.overdueCases : 0), 0)}
              </div>
            </div>
          </div>
        )}

`;
  code = code.substring(0, insertIndex) + injection + code.substring(insertIndex);
  fs.writeFileSync("src/components/ERP.tsx", code);
  console.log("Injected performance cards");
} else {
  console.log("Target not found");
}
