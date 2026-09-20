const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

const matchTr = content.match(/<tr className="hover:bg-slate-50\/50 transition-all duration-300">[\s\S]*?renderIcon\("editor", "manageUsers"\)[\s\S]*?<\/tr>/);

if(matchTr) {
    let prosecutorRow = matchTr[0].replace(/"editor"/g, '"prosecutor"').replace(/t\.editor/, 't.prosecutor').replace(/t \as any\)\['editorDesc'\]/, 't as any)[\'prosecutorDesc\']');
    
    // Find where to insert it. The order should be admin, prosecutor, accountant.
    // Let's insert before accountant.
    const accountantMatch = content.match(/<tr className="hover:bg-slate-50\/50 transition-all duration-300">[\s\S]*?renderIcon\("accountant", "manageUsers"\)[\s\S]*?<\/tr>/);
    
    if(accountantMatch) {
       content = content.replace(accountantMatch[0], prosecutorRow + '\n              ' + accountantMatch[0]);
       fs.writeFileSync(path, content, 'utf8');
       console.log("Added prosecutor row successfully");
    } else {
       console.log("Could not find accountant row");
    }
} else {
    console.log("Could not find editor row");
}
