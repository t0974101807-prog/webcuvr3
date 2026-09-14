const fs = require('fs');
let txt = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const searchString = '}"absolute -right-2 -top-2 opacity-[0.15] group-hover:scale-110 transition-transform duration-500">';

const idx = txt.indexOf(searchString);
if (idx > -1) {
  const correctedReplacement = "}\n  );\n}\n\n";
  const endOfClients = txt.indexOf('function Cases({ language = "vi" }');
  
  if (endOfClients > -1) {
     const newTxt = txt.substring(0, idx) + correctedReplacement + txt.substring(endOfClients);
     fs.writeFileSync('src/components/ERP.tsx', newTxt);
     console.log('Fixed ERP.tsx successfully');
  } else {
     console.log('Could not find function Cases');
  }
} else {
  console.log('Could not find corrupted string');
}
