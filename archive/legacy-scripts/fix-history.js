const fs = require('fs');
let code = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const startStr = '          <div className="bg-white rounded-lg p-4 mt-4 shadow-sm">\n            <h3 className="text-slate-800 font-bold mb-3">Lịch sử chỉnh sửa</h3>';
let startIndex = code.indexOf(startStr);
if(startIndex !== -1) {
    const endStr = '              )}\n            </div>\n          </div>';
    let endIndex = code.indexOf(endStr, startIndex) + endStr.length;
    code = code.substring(0, startIndex) + code.substring(endIndex);
    fs.writeFileSync('src/components/ERP.tsx', code);
    console.log("Removed edit history block.");
} else {
    console.log("Start block not found.");
}
