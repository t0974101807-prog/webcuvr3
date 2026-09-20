const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The users tab component block
let usersTabStart = content.indexOf(`{/* Users Tab */}`);
let clientsTabStart = content.indexOf(`{/* Clients Tab */}`);
let settingsTabStart = content.indexOf(`{/* Settings Tab */}`);

if (usersTabStart !== -1 && clientsTabStart !== -1 && settingsTabStart !== -1) {
    let usersBlock = content.substring(usersTabStart, clientsTabStart);
    let clientsBlock = content.substring(clientsTabStart, settingsTabStart);

    usersBlock = usersBlock.replace('users.map(', "users.filter(u => u.role !== 'client').map(");
    clientsBlock = clientsBlock.replace('users.map(', "users.filter(u => u.role === 'client').map(");

    content = content.substring(0, usersTabStart) + usersBlock + clientsBlock + content.substring(settingsTabStart);
    fs.writeFileSync('src/components/AdminDashboard.tsx', content);
    console.log("Replaced map filters");
} else {
    console.log("Could not find blocks");
}
