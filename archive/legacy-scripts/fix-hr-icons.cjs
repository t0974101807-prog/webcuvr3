"use strict";
const fs = require("fs");
let code = fs.readFileSync("src/components/ERP.tsx", "utf8");
const replacements = [
  {
    target: `            <div className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-blue-400/50">
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm">`,
    replacement: `            <div className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-blue-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Users size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">`
  },
  {
    target: `              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md">
                {users.length}
              </div>
            </div>`,
    replacement: `              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {users.length}
              </div>
            </div>`
  },
  {
    target: `            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-emerald-400/50">
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm">`,
    replacement: `            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-emerald-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Building2 size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">`
  },
  {
    target: `              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md">
                {uniqueBranches.length}
              </div>
            </div>`,
    replacement: `              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {uniqueBranches.length}
              </div>
            </div>`
  },
  {
    target: `            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-amber-400/50">
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm">`,
    replacement: `            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-amber-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Briefcase size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">`
  },
  {
    target: `              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md">
                {uniqueRoles.length}
              </div>
            </div>`,
    replacement: `              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {uniqueRoles.length}
              </div>
            </div>`
  },
  {
    target: `            <div className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-purple-400/50">
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm">`,
    replacement: `            <div className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 bg-[length:200%_200%] animate-gradient shadow-md rounded-xl p-4 border border-purple-400/50 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.08] group-hover:scale-110 transition-transform duration-500">
                <Eye size={100} className="text-white" />
              </div>
              <div className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm relative z-10">`
  },
  {
    target: `              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md">
                {filteredUsers.length}
              </div>
            </div>`,
    replacement: `              </div>
              <div className="text-3xl font-bold text-white drop-shadow-md relative z-10">
                {filteredUsers.length}
              </div>
            </div>`
  }
];
let changedCount = 0;
for (const r of replacements) {
  if (code.includes(r.target)) {
    code = code.replace(r.target, r.replacement);
    changedCount++;
  } else {
    console.log("Could not find target:", r.target.substring(0, 50).replace(/\\n/g, "\\\\n"));
  }
}
if (!code.includes("Building2,")) {
  code = code.replace(/import \{([\s\S]*?)Users,/g, "import {$1Users, Building2,");
}
console.log("Changed", changedCount, "targets");
fs.writeFileSync("src/components/ERP.tsx", code);
