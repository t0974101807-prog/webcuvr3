const { execSync } = require('child_process');
execSync('git show HEAD:src/components/ERP.tsx > src/components/ERP_old.tsx');
