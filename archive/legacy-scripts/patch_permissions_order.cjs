const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

const order = ['director', 'deputyDirector', 'headOfDept', 'manager', 'admin', 'controller', 'accountant', 'lawyer', 'specialist', 'editor', 'traineeLawyer', 'intern'];

const match = content.match(/<tbody className="divide-y divide-slate-200">([\s\S]*?)<\/tbody>/);
if (match) {
   const tbodyContent = match[1];
   const rowRegex = /<tr className="hover:bg-slate-50\/50 transition-all duration-300">([\s\S]*?)<\/tr>/g;
   let rows = [];
   let m;
   while ((m = rowRegex.exec(tbodyContent)) !== null) {
      rows.push(m[0]);
   }
   
   console.log("Found rows:", rows.length);
   
   let rowMap = {};
   for (let r of rows) {
      const roleMatch = r.match(/renderIcon\("([^"]+)"/);
      if (roleMatch) {
         rowMap[roleMatch[1]] = r;
      }
   }
   
   console.log("Roles found in map:", Object.keys(rowMap));
   
   let newTbodyContent = '\n';
   for (let role of order) {
      if (rowMap[role]) {
         newTbodyContent += "              " + rowMap[role] + "\n";
      } else {
         console.log("Missing role:", role);
      }
   }
   
   const newTbody = '<tbody className="divide-y divide-slate-200">' + newTbodyContent + '            </tbody>';
   content = content.replace(match[0], newTbody);
   fs.writeFileSync(path, content, 'utf8');
   console.log("Patched permissions order successfully");
} else {
   console.log("Tbody not found");
}
