export function mapRoleToDb(role: string | undefined): string {
  if (!role) return "";
  const r = role.toLowerCase().trim();
  switch (r) {
    case 'admin':
    case 'quản trị viên':
    case 'quan tri vien':
      return 'admin';
    case 'director':
    case 'giám đốc':
    case 'giam doc':
    case 'ban giám đốc':
    case 'ban giam doc':
    case 'board of directors':
    case 'bgd':
    case 'tổng giám đốc':
    case 'tong giam doc':
    case 'chủ tịch':
    case 'chu tich':
    case 'ceo':
    case 'executive':
      return 'director';
    case 'deputydirector':
    case 'deputy_director':
    case 'deputy director':
    case 'phó giám đốc':
    case 'pho giam doc':
      return 'deputyDirector';
    case 'head_of_department':
    case 'head of department':
    case 'headofdept':
    case 'trưởng phòng':
      return 'head_of_department';
    case 'manager':
    case 'manage':
    case 'quản lý':
      return 'manager';
    case 'controller':
    case 'kiểm soát viên':
    case 'kiểm soát viên điều hành':
      return 'controller';
    case 'prosecutor':
    case 'qc':
    case 'qc specialist':
    case 'kiểm soát chất lượng':
    case 'kiểm soát chất lượng văn bản pháp lý':
      return 'prosecutor';
    case 'lawyer':
    case 'luật sư':
      return 'lawyer';
    case 'legal_associate':
    case 'legal associate':
    case 'trợ lý pháp lý':
      return 'legal_associate';
    case 'specialist':
    case 'chuyên viên':
    case 'chuyên viên pháp lý':
      return 'specialist';
    case 'accountant':
    case 'kế toán':
      return 'accountant';
    case 'editor':
    case 'biên tập viên':
      return 'editor';
    case 'traineelawyer':
    case 'trainee_lawyer':
    case 'trainee lawyer':
    case 'luật sư tập sự':
      return 'traineeLawyer';
    case 'intern':
    case 'legal_intern':
    case 'legal intern':
    case 'thực tập sinh':
      return 'intern';
    case 'uploader':
    case 'nhân viên upload':
    case 'quản trị hồ sơ':
      return 'uploader';
    case 'consultant':
    case 'nhân viên tư vấn':
      return 'consultant';
    case 'user':
    case 'người dùng':
    case 'khách hàng':
    case 'client':
      return 'user';
    default:
      return role;
  }
}
