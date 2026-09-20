const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const loginSuccessCode = `const handleLoginSuccess = (u: any) => {
    setCurrentUser(u);
    setShowLogin(false);
    if (u.role === 'client') {
      setView('client_portal');
      window.history.pushState({}, '', '/client-portal');
    }
  };`;

// Insert after handleLogout
content = content.replace(`const handleLogout = () => {`, loginSuccessCode + '\n\n  const handleLogout = () => {');

// Now replace all onLoginSuccess handler inline
content = content.replace(/onLoginSuccess=\{\(u: any\) \=\> \{ setCurrentUser\(u\); setShowLogin\(false\); \}\}/g, 'onLoginSuccess={handleLoginSuccess}');

content = content.replace(/onLoginSuccess=\{\(u: any\) \=> \{\n\s*setCurrentUser\(u\);\n\s*setShowLogin\(false\);\n\s*\}\}/g, 'onLoginSuccess={handleLoginSuccess}');

fs.writeFileSync('src/App.tsx', content);
