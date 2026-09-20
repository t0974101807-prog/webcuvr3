const cp = require("child_process");
console.log(cp.execSync("find / -type f -name 'LegalDocumentsManager.tsx' 2>/dev/null || true").toString());
console.log(cp.execSync("ls -la / || true").toString());
