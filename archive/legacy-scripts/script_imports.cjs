const fs = require('fs');
const content = fs.readFileSync('src/components/ERP.tsx', 'utf8');

const targetImport = `  Printer, MapPin, Building2, Phone, Eye, Send, Star, ArrowLeft, Inbox
} from 'lucide-react';`;

const replacementImport = `  Printer, MapPin, Building2, Phone, Eye, Send, Star, ArrowLeft, Inbox,
  FileCheck, Scale, Gavel, BookOpen
} from 'lucide-react';`;

let newContent = content.replace(targetImport, replacementImport);
fs.writeFileSync('src/components/ERP.tsx', newContent);
console.log('Imports updated');
