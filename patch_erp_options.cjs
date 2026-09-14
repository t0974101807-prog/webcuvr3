const fs = require('fs');
const path = './src/components/ERP.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `  const dynamicUserOptions = React.useMemo(() => {
    return users.map((u: any) => \`\${u.name} (@\${u.username})\`);
  }, [users]);`;

const newCode = `  const dynamicStaffOptions = React.useMemo(() => {
    return users.map((u: any) => u.name || u.username);
  }, [users]);

  const dynamicUserAccountOptions = React.useMemo(() => {
    return users.map((u: any) => \`\${u.name || u.username} (@\${u.username})\`);
  }, [users]);`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
} else {
    // If not found, look for something similar
    const genericMatch = /const dynamicUserOptions = React\.useMemo.*?\}, \[users\]\);/s;
    if (content.match(genericMatch)) {
        content = content.replace(genericMatch, newCode);
    }
}

// Now replace usages
content = content.replace(/options=\{dynamicUserOptions\}/g, "options={dynamicStaffOptions}");

// Then, specifically for userEA (Nộp án phí -> Chọn tài khoản), we want dynamicUserAccountOptions
// Wait, we need to locate where value={formData.userEA} is
// There's a Combobox there
content = content.replace(
    /onChange=\{\(val\) =>\s*setFormData\(\{ \.\.\.formData, userEA: val \}\)\s*\}\s*options=\{dynamicStaffOptions\}/,
    `onChange={(val) =>
                            setFormData({ ...formData, userEA: val })
                          }
                          options={dynamicUserAccountOptions}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched dynamic options");
