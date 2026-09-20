const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');

let startIdx = 12568; // `            <tbody className="divide-y divide-slate-200">`
let endIdx = 13097; // `            </tbody>`

if (lines[startIdx].includes('<tbody className="divide-y divide-slate-200">') && lines[endIdx].includes('</tbody>')) {
    const tbodyLines = lines.slice(startIdx + 1, endIdx);
    const tbodyStr = tbodyLines.join('\n');
    
    // Split into <tr>
    const trStrs = tbodyStr.split('<tr className="hover:bg-slate-50/50 transition-all duration-300">');
    trStrs.shift(); // remove empty first element
    
    let rowMap = {};
    for (let s of trStrs) {
        const fullRow = '              <tr className="hover:bg-slate-50/50 transition-all duration-300">' + s;
        const roleMatch = fullRow.match(/renderIcon\("([^"]+)"/);
        if(roleMatch) {
            rowMap[roleMatch[1]] = fullRow;
        }
    }
    
    console.log("Roles found:", Object.keys(rowMap));
    
    const order = ['director', 'deputyDirector', 'headOfDept', 'manager', 'admin', 'controller', 'accountant', 'lawyer', 'specialist', 'editor', 'traineeLawyer', 'intern'];
    
    let newRows = [];
    for (let r of order) {
        if(rowMap[r]) {
            newRows.push(rowMap[r]);
        }
    }
    
    const newTbody = '            <tbody className="divide-y divide-slate-200">\n' + newRows.join('') + '            </tbody>';
    
    lines.splice(startIdx, endIdx - startIdx + 1, newTbody);
    
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log("Patched successfully");
} else {
    console.log("Line offsets mismatch!");
    console.log("startIdx:", lines[startIdx]);
    console.log("endIdx:", lines[endIdx]);
}

