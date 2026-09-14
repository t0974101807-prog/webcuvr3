const fs = require('fs');

const file = 'src/components/ERP.tsx';
let content = fs.readFileSync(file, 'utf8');

const permissionsViewStart = content.indexOf('function PermissionsView({ language }: { language: \'vi\' | \'en\' }) {');
const permissionsViewEnd = content.indexOf('function RecordTypesView({ language }: { language: \'vi\' | \'en\' }) {');

if (permissionsViewStart !== -1 && permissionsViewEnd !== -1) {
  const newPermissionsView = `function PermissionsView({ language }: { language: 'vi' | 'en' }) {
  const [users, setUsers] = useState<any[]>([]);
  
  const loadUsers = () => {
    api.req('/api/users').then(setUsers).catch(console.error);
  };
  
  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      await api.req(\`/api/users/\${userId}\`, 'PUT', { ...user, role: newRole });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const t = {
    vi: {
      title: 'Phân quyền',
      subtitle: 'Chủ Nhật, 15 tháng 3, 2026',
      systemPermissions: 'Phân quyền hệ thống',
      role: 'Vai trò',
      description: 'Mô tả',
      accountsAssigned: 'Tài khoản được phân quyền',
      manageUsers: 'Quản lý người dùng',
      viewAllRecords: 'Xem tất cả hồ sơ',
      editAllRecords: 'Sửa tất cả hồ sơ',
      admin: 'Quản trị viên',
      adminDesc: 'Toàn quyền kiểm soát hệ thống',
      director: 'Giám đốc',
      directorDesc: 'Quản lý tổng thể, xem báo cáo và duyệt hồ sơ',
      manager: 'Quản lý',
      managerDesc: 'Quản lý hoạt động của bộ phận, phân công công việc',
      employee: 'Nhân viên',
      employeeDesc: 'Nhân viên thông thường',
      none: 'Chưa có',
      userList: 'Danh sách tài khoản',
      username: 'Tên đăng nhập',
      name: 'Họ tên',
      assignRole: 'Phân quyền'
    },
    en: {
      title: 'Permissions',
      subtitle: 'Sunday, March 15, 2026',
      systemPermissions: 'System Permissions',
      role: 'Role',
      description: 'Description',
      accountsAssigned: 'Accounts Assigned',
      manageUsers: 'Manage Users',
      viewAllRecords: 'View All Records',
      editAllRecords: 'Edit All Records',
      admin: 'Administrator',
      adminDesc: 'Full system control',
      director: 'Director',
      directorDesc: 'Overall management, view reports and approve records',
      manager: 'Manager',
      managerDesc: 'Manage department activities, assign tasks',
      employee: 'Employee',
      employeeDesc: 'Standard employee',
      none: 'None',
      userList: 'Account List',
      username: 'Username',
      name: 'Full Name',
      assignRole: 'Assign Role'
    }
  }[language];

  // Count users per role
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 font-serif">{t.title}</h3>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
            <Users size={20} />
          </div>
          <h4 className="text-xl font-bold text-slate-800 font-serif">{t.systemPermissions}</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider w-1/5">{t.role}</th>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider w-2/5">{t.description}</th>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider w-1/5">{t.accountsAssigned}</th>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-center w-24">{t.manageUsers}</th>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-center w-24">{t.viewAllRecords}</th>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-center w-24">{t.editAllRecords}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{t.admin}</td>
                <td className="px-6 py-4 text-slate-600">{t.adminDesc}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                    {roleCounts['admin'] || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{t.director}</td>
                <td className="px-6 py-4 text-slate-600">{t.directorDesc}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                    {roleCounts['director'] || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{t.manager}</td>
                <td className="px-6 py-4 text-slate-600">{t.managerDesc}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                    {roleCounts['manager'] || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 text-slate-300">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-green-500 text-green-500">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{t.employee}</td>
                <td className="px-6 py-4 text-slate-600">{t.employeeDesc}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                    {roleCounts['employee'] || roleCounts['user'] || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 text-slate-300">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 text-slate-300">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 text-slate-300">
                    <Check size={14} strokeWidth={3} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* User List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
            <User size={20} />
          </div>
          <h4 className="text-xl font-bold text-slate-800 font-serif">{t.userList}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider">{t.username}</th>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider">{t.name}</th>
                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider">{t.assignRole}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{u.username}</td>
                  <td className="px-6 py-4 text-slate-600">{u.name}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role || 'employee'} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#114B5F] outline-none"
                    >
                      <option value="admin">{t.admin}</option>
                      <option value="director">{t.director}</option>
                      <option value="manager">{t.manager}</option>
                      <option value="employee">{t.employee}</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    {t.none}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

  content = content.substring(0, permissionsViewStart) + newPermissionsView + '\n\n' + content.substring(permissionsViewEnd);
  fs.writeFileSync(file, content, 'utf8');
  console.log('PermissionsView updated');
} else {
  console.log('Could not find PermissionsView boundaries');
}
