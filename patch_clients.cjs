const fs = require('fs');
const content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const usersStart = content.indexOf("{/* Users Tab */}");
const settingsStart = content.indexOf("{/* Settings Tab */}");

const usersBlock = content.substring(usersStart, settingsStart);

// Replace parts to make it for clients
let clientsBlock = usersBlock
  .replace("{/* Users Tab */}", "{/* Clients Tab */}")
  .replace("activeTab === 'users'", "activeTab === 'clients'")
  .replace("Quản lý người dùng", "Quản lý khách hàng")
  .replace("Thêm người dùng mới", "Thêm khách hàng mới")
  .replace("Chỉnh sửa người dùng", "Chỉnh sửa khách hàng")
  .replace("role: 'user'", "role: 'client'")
  .replace("users.filter(u => u.role !== 'client').map", "users.filter(u => u.role === 'client').map");

const newContent = content.substring(0, settingsStart) + clientsBlock + "\n" + content.substring(settingsStart);
fs.writeFileSync('src/components/AdminDashboard.tsx', newContent);
