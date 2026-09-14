import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Edit2, Trash2, Save, Image as ImageIcon, Type, AlignLeft, FileText, Search,
  LayoutDashboard, Calendar, CalendarDays, FolderOpen, Users, BarChart3, 
  FileSpreadsheet, ShieldCheck, FileType, Bell, Settings, Briefcase, Scale, 
  Newspaper, UserPlus, Users2, UserCircle, User, MessageSquare, TrendingUp, Check, CheckCircle2,
  Paperclip, Send, Phone, Mail, Shield, Lock, Key, Clock, Smartphone, Info, RefreshCw, Building2,
  BookOpen, Award, ArrowLeft, Calculator, Cpu, Sparkles, ChevronDown, Bot, Eye, EyeOff, Terminal, Share2, Layout, Upload, History
} from 'lucide-react';

import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';

import { fetchApi } from '../utils/api';
import { fetchBranches } from '../utils/firestore';
import { usePersonnel } from '../hooks/usePersonnel';
import DatePickerInput from './DatePickerInput';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import ToolsPage from './ToolsPage';
import { AiProviderManager } from './AiProviderManager';
import DashboardOverview from './DashboardOverview';
import { io } from 'socket.io-client';
import { numberToWords } from '../utils/numberToWords';
import { PROVINCES_DATA } from '../data/provinces';
import { ActivityLogsView } from './ActivityLogsView';

interface AdminDashboardProps {
  onBack: () => void;
  user: User | null;
  onUpdateUser?: (user: any) => void;
  initialTab?: 'services' | 'legal_services' | 'news' | 'recruitment' | 'team' | 'users' | 'clients' | 'messages' | 'stats' | 'profile' | 'settings' | 'offices' | 'contacts' | 'tools' | 'dashboard_overview' | 'activity_logs';
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[var(--color-primary)] text-white' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
      {label}
    </button>
  );
}

interface Service {
  id?: number;
  title: string;
  description: string;
  content?: string;
  icon: string;
  file_url?: string;
  file_name?: string;
  category?: string;
  related_service?: string;
  video_url?: string;
}

interface Recruitment {
  id: number;
  title: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  content: string;
  file_url?: string;
  file_name?: string;
}

interface RecruitmentBenefit {
  id?: number;
  title: string;
  description: string;
  icon: string;
}

interface RecruitmentProcessStep {
  id?: number;
  step: string;
  title: string;
  description: string;
}

interface TeamMember {
  id: number;
  name: string;
  title: string;
  description?: string;
  image: string;
  email?: string;
  phone?: string;
  specialties?: string;
  degrees?: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  title?: string;
  staff_code?: string;
  branch?: string;
  start_date?: string;
  contract_type?: string;
  contract_sign_date?: string;
  salary?: string;
  bonus?: string;
  manager_id?: string;
  password?: string; // For editing
  avatar?: string;
  phone?: string;
  email?: string;
  dob?: string;
  gender?: string;
  address?: string;
  case_id?: string;
  practice_areas?: string;
}

const SYSTEM_TITLES = [
  'Giám đốc',
  'Phó giám đốc',
  'Trưởng phòng',
  'Quản lý',
  'Quản trị viên',
  'Kiểm soát viên',
  'Kiểm soát chất lượng',
  'Kế toán',
  'Luật sư',
  'Chuyên viên pháp lý',
  'Trợ lý pháp lý',
  'Biên tập viên',
  'Luật sư Tập sự',
  'Thực tập sinh',
  'Nhân viên tư vấn',
  'IT - Quản trị hồ sơ',
  'Người dùng'
];

import { translateRole } from './ERP';

export const ROLE_NAMES: Record<string, string> = {
  admin: 'Quản trị viên',
  director: 'Giám đốc',
  deputyDirector: 'Phó giám đốc',
  deputy_director: 'Phó giám đốc',
  head_of_department: 'Trưởng phòng',
  manager: 'Quản lý',
  manage: 'Quản lý',
  prosecutor: 'Kiểm soát chất lượng',
  controller: 'Kiểm soát viên',
  lawyer: 'Luật sư',
  specialist: 'Chuyên viên pháp lý',
  legal_associate: 'Trợ lý pháp lý',
  accountant: 'Kế toán',
  editor: 'Biên tập viên',
  trainee_lawyer: 'Luật sư Tập sự',
  legal_intern: 'Thực tập sinh',
  uploader: 'IT - Quản trị hồ sơ',
  user: 'Người dùng',
  client: 'Khách hàng',
};

export const PRACTICE_AREAS = [
  {
    key: 'ban_giam_doc',
    label: 'Ban Giám đốc',
    department: 'Ban Giám đốc',
    desc: 'Chỉ đạo, điều hành tổng thể toàn bộ hoạt động Hãng luật, chiến lược phát triển và quyết định điều hành.'
  },
  {
    key: 'phong_van_hanh',
    label: 'Phòng Vận hành',
    department: 'Phòng Vận hành',
    desc: 'Điều phối quy trình vận hành, giám sát SLA, quy định hoạt động và hạ tầng cơ sở vật chất.'
  },
  {
    key: 'hanh_chinh_nhan_su',
    label: 'Hành chính – Nhân sự',
    department: 'Hành chính – Nhân sự',
    desc: 'Quản lý nhân sự, tuyển dụng, chấm công, đào tạo CPD, chế độ chính sách và thủ tục hành chính.'
  },
  {
    key: 'ke_toan_tai_chinh',
    label: 'Kế toán – Tài chính',
    department: 'Kế toán – Tài chính',
    desc: 'Quản lý thu chi, ngân sách, hóa đơn, bảng lương, báo cáo tài chính và phê duyệt chi tiêu tài chính.'
  },
  {
    key: 'phong_nghiep_vu',
    label: 'Phòng Nghiệp vụ (Khối Chuyên môn)',
    department: 'Phòng Nghiệp vụ',
    desc: 'Khối chuyên môn luật: Tranh tụng, Tư vấn, Đại diện ngoài tố tụng, Pháp chế nội bộ, Trọng tài/Hòa giải.'
  },
  {
    key: 'tranh_tung',
    label: 'Phòng Nghiệp vụ - Tranh tụng',
    department: 'Phòng Nghiệp vụ',
    desc: 'Tham gia bảo vệ, bào chữa tại Tòa án, Trọng tài; Đại diện khách hàng trong các vụ án dân sự, hình sự, hành chính, kinh doanh thương mại, lao động…'
  },
  {
    key: 'tu_van',
    label: 'Phòng Nghiệp vụ - Tư vấn Pháp luật',
    department: 'Phòng Nghiệp vụ',
    desc: 'Tư vấn pháp luật cho cá nhân, doanh nghiệp; Soạn thảo hợp đồng, ý kiến pháp lý, xử lý rủi ro, tuân thủ pháp luật'
  },
  {
    key: 'dai_dien_ngoai_to_tung',
    label: 'Phòng Nghiệp vụ - Đại diện ngoài tố tụng',
    department: 'Phòng Nghiệp vụ',
    desc: 'Đại diện khách hàng làm việc với cơ quan nhà nước, đối tác, ngân hàng, cơ quan thuế... Đàm phán, thương lượng, hòa giải.'
  },
  {
    key: 'noi_bo',
    label: 'Phòng Nghiệp vụ - Pháp chế & Nội bộ',
    department: 'Phòng Nghiệp vụ',
    desc: 'Không tham gia phiên tòa với tư cách luật sư tranh tụng; Làm việc cho doanh nghiệp, tập đoàn; Phụ trách pháp chế, quản trị rủi ro, tuân thủ, hợp đồng.'
  },
  {
    key: 'trong_tai_hoa_giai',
    label: 'Phòng Nghiệp vụ - Trọng tài / Hòa giải',
    department: 'Phòng Nghiệp vụ',
    desc: 'Tham gia giải quyết tranh chấp bằng trọng tài hoặc hòa giải; Đại diện cho khách hàng hoặc kiêm trọng tài viên, hòa giải viên.'
  },
  {
    key: 'kinh_doanh_cskh',
    label: 'Kinh doanh – Chăm sóc khách hàng',
    department: 'Kinh doanh – Chăm sóc khách hàng',
    desc: 'Phát triển thị trường, tiếp nhận thông tin yêu cầu dịch vụ pháp lý, tư vấn ban đầu và chăm sóc khách hàng.'
  },
  {
    key: 'cong_nghe_thong_tin',
    label: 'Công nghệ thông tin (IT)',
    department: 'Công nghệ thông tin (IT)',
    desc: 'Quản trị hạ tầng mạng, bảo mật WAF, hỗ trợ kỹ thuật, vận hành hệ thống phần mềm ERP & AI Studio.'
  }
];

export function getFilteredPracticeAreas(role: string, title: string = '') {
  const roleLower = (role || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();

  // Ban Giám đốc, Admin, Trưởng phòng, Quản lý có thể chọn mọi phòng ban
  if (['admin', 'director', 'deputydirector', 'deputy_director', 'head_of_department', 'manager', 'manage'].includes(roleLower) ||
      titleLower.includes('giám đốc') || titleLower.includes('trưởng phòng') || titleLower.includes('quản lý')) {
    return PRACTICE_AREAS;
  }

  // Hành chính - Nhân sự
  if (roleLower === 'hr' || titleLower.includes('nhân sự') || titleLower.includes('hành chính')) {
    return PRACTICE_AREAS.filter(area => area.key === 'hanh_chinh_nhan_su');
  }

  // Kế toán - Tài chính
  if (roleLower === 'accountant' || titleLower.includes('kế toán') || titleLower.includes('tài chính')) {
    return PRACTICE_AREAS.filter(area => area.key === 'ke_toan_tai_chinh');
  }

  // IT / Quản trị hồ sơ
  if (roleLower === 'it' || roleLower === 'uploader' || roleLower === 'it_admin' || titleLower.includes('it') || titleLower.includes('công nghệ') || titleLower.includes('kỹ thuật') || titleLower.includes('quản trị hồ sơ')) {
    return PRACTICE_AREAS.filter(area => area.key === 'cong_nghe_thong_tin');
  }

  // Kinh doanh - CSKH
  if (roleLower === 'consultant' || titleLower.includes('tư vấn') || titleLower.includes('kinh doanh') || titleLower.includes('cskh')) {
    return PRACTICE_AREAS.filter(area => area.key === 'kinh_doanh_cskh');
  }

  // Biên tập viên / Truyền thông
  if (roleLower === 'editor' || titleLower.includes('biên tập') || titleLower.includes('báo chí') || titleLower.includes('truyền thông')) {
    return PRACTICE_AREAS.filter(area => area.key === 'phong_van_hanh');
  }

  // Luật sư, Luật sư tập sự, Chuyên viên pháp lý, Trợ lý pháp lý, Thực tập sinh, Kiểm soát viên, Kiểm soát chất lượng
  if (
    ['lawyer', 'trainee_lawyer', 'traineelawyer', 'legal_intern', 'intern', 'prosecutor', 'controller', 'specialist', 'legal_associate'].includes(roleLower) ||
    titleLower.includes('luật sư') || 
    titleLower.includes('chuyên viên') || 
    titleLower.includes('trợ lý') || 
    titleLower.includes('thực tập') || 
    titleLower.includes('kiểm soát') ||
    titleLower.includes('pháp lý')
  ) {
    // Phòng Nghiệp vụ (gồm cả các phòng nghiệp vụ chuyên môn sâu)
    return PRACTICE_AREAS.filter(area => 
      ['phong_nghiep_vu', 'tranh_tung', 'tu_van', 'dai_dien_ngoai_to_tung', 'noi_bo', 'trong_tai_hoa_giai'].includes(area.key)
    );
  }

  // Mặc định: hiện các phòng ban vận hành và nghiệp vụ thông thường (không hiện ban giám đốc cho user thường)
  return PRACTICE_AREAS.filter(area => area.key !== 'ban_giam_doc');
}

export const PERMISSION_KEYS = [
  { key: 'litigation', label: 'Hồ sơ Tranh tụng', desc: 'Xem & quản trị hồ sơ vụ án tranh tụng, tố tụng' },
  { key: 'advisory', label: 'Tư vấn Pháp luật', desc: 'Xem & quản trị hồ sơ tư vấn pháp luật, hợp đồng' },
  { key: 'external_rep', label: 'Đại diện Ngoài tố tụng', desc: 'Xem & quản trị hồ sơ đại diện đàm phán, thương lượng' },
  { key: 'in_house', label: 'Pháp chế & Nội bộ', desc: 'Xem & quản trị hồ sơ tư vấn pháp chế doanh nghiệp' },
  { key: 'arbitration', label: 'Trọng tài / Hòa giải', desc: 'Xem & giải quyết các tranh chấp trọng tài, hòa giải' },
  { key: 'reports_finance', label: 'Báo cáo & Tài chính', desc: 'Xem thống kê doanh thu, báo cáo thu chi, bảng lương' },
  { key: 'expense_approvals', label: 'Phê duyệt Chi tiêu', desc: 'Duyệt các khoản chi tiêu tài chính, tạm ứng, thanh toán' },
  { key: 'user_management', label: 'Quản trị Người dùng', desc: 'Thêm, sửa, xóa tài khoản nhân sự và phân quyền' },
  { key: 'hr_recruitment', label: 'Nhân sự & Tuyển dụng', desc: 'Xem thông tin CPD, chấm công, tuyển dụng, đào tạo' },
  { key: 'news_editor', label: 'Quản lý Tin tức', desc: 'Đăng tải tin tức, sự kiện, chỉnh sửa nội dung website' },
];

export const DEFAULT_DEPARTMENT_PERMISSIONS = {
  ban_giam_doc: {
    label: 'Ban Giám đốc',
    permissions: {
      litigation: true,
      advisory: true,
      external_rep: true,
      in_house: true,
      arbitration: true,
      reports_finance: true,
      expense_approvals: true,
      user_management: true,
      hr_recruitment: true,
      news_editor: true,
    }
  },
  phong_van_hanh: {
    label: 'Phòng Vận hành',
    permissions: {
      litigation: false,
      advisory: false,
      external_rep: false,
      in_house: false,
      arbitration: false,
      reports_finance: true,
      expense_approvals: false,
      user_management: false,
      hr_recruitment: true,
      news_editor: true,
    }
  },
  hanh_chinh_nhan_su: {
    label: 'Hành chính – Nhân sự',
    permissions: {
      litigation: false,
      advisory: false,
      external_rep: false,
      in_house: false,
      arbitration: false,
      reports_finance: false,
      expense_approvals: false,
      user_management: false,
      hr_recruitment: true,
      news_editor: false,
    }
  },
  ke_toan_tai_chinh: {
    label: 'Kế toán – Tài chính',
    permissions: {
      litigation: false,
      advisory: false,
      external_rep: false,
      in_house: false,
      arbitration: false,
      reports_finance: true,
      expense_approvals: true,
      user_management: false,
      hr_recruitment: false,
      news_editor: false,
    }
  },
  phong_nghiep_vu: {
    label: 'Phòng Nghiệp vụ',
    permissions: {
      litigation: true,
      advisory: true,
      external_rep: true,
      in_house: true,
      arbitration: true,
      reports_finance: false,
      expense_approvals: false,
      user_management: false,
      hr_recruitment: false,
      news_editor: false,
    }
  },
  kinh_doanh_cskh: {
    label: 'Kinh doanh – CSKH',
    permissions: {
      litigation: false,
      advisory: false,
      external_rep: false,
      in_house: false,
      arbitration: false,
      reports_finance: false,
      expense_approvals: false,
      user_management: false,
      hr_recruitment: false,
      news_editor: false,
    }
  },
  cong_nghe_thong_tin: {
    label: 'Công nghệ thông tin (IT)',
    permissions: {
      litigation: false,
      advisory: false,
      external_rep: false,
      in_house: false,
      arbitration: false,
      reports_finance: true,
      expense_approvals: false,
      user_management: true,
      hr_recruitment: false,
      news_editor: true,
    }
  }
};

function getGreetingText(user: any, language: string = 'vi') {
  if (!user) return "Kính chào Quý khách";
  
  const role = user.role || '';
  let titleStr = '';
  
  if (role === 'admin') {
    titleStr = user.title || 'Quản trị viên';
  } else {
    const rawTitle = user.title || (role ? ROLE_NAMES[role] : '') || role || 'Biên tập viên';
    titleStr = String(rawTitle).trim();
  }
  
  let translatedTitle = titleStr;
  const t = titleStr.toLowerCase();
  if (language === 'vi') {
    if (t === 'admin' || t === 'quản trị viên') translatedTitle = 'Quản trị viên';
    else if (t === 'manager' || t === 'manage' || t === 'quản lý') translatedTitle = 'Quản lý';
    else if (t === 'deputy_director' || t === 'deputy director' || t === 'deputydirector' || t === 'phó giám đốc') translatedTitle = 'Phó giám đốc';
    else if (t === 'director' || t === 'giám đốc') translatedTitle = 'Giám đốc';
    else if (t === 'head_of_department' || t === 'head of department' || t === 'headofdept' || t === 'trưởng phòng') translatedTitle = 'Trưởng phòng';
    else if (t === 'lawyer' || t === 'luật sư') translatedTitle = 'Luật sư';
    else if (t === 'traineelawyer' || t === 'trainee lawyer' || t === 'trainee_lawyer' || t === 'luật sư tập sự') translatedTitle = 'Luật sư Tập sự';
    else if (t === 'legal_associate' || t === 'legal associate' || t === 'trợ lý pháp lý') translatedTitle = 'Trợ lý pháp lý';
    else if (t === 'specialist' || t === 'chuyên viên pháp lý') translatedTitle = 'Chuyên viên pháp lý';
    else if (t === 'accountant' || t === 'kế toán') translatedTitle = 'Kế toán';
    else if (t === 'prosecutor' || t === 'kiểm soát viên' || t === 'kiểm soát chất lượng') translatedTitle = 'Kiểm soát chất lượng';
    else if (t === 'controller' || t === 'kiểm soát viên') translatedTitle = 'Kiểm soát viên';
    else if (t === 'editor' || t === 'biên tập viên') translatedTitle = 'Biên tập viên';
    else if (t === 'intern' || t === 'legal_intern' || t === 'thực tập sinh') translatedTitle = 'Thực tập sinh';
    else if (t === 'user' || t === 'người dùng') translatedTitle = 'Người dùng';
  } else {
    if (t === 'admin' || t === 'quản trị viên') translatedTitle = 'Admin';
    else if (t === 'manager' || t === 'manage' || t === 'quản lý') translatedTitle = 'Manager';
    else if (t === 'deputy_director' || t === 'deputy director' || t === 'deputydirector' || t === 'phó giám đốc') translatedTitle = 'Deputy Director';
    else if (t === 'director' || t === 'giám đốc') translatedTitle = 'Director';
    else if (t === 'head_of_department' || t === 'head of department' || t === 'headofdept' || t === 'trưởng phòng') translatedTitle = 'Head of Department';
    else if (t === 'lawyer' || t === 'luật sư') translatedTitle = 'Lawyer';
    else if (t === 'traineelawyer' || t === 'trainee lawyer' || t === 'trainee_lawyer' || t === 'luật sư tập sự') translatedTitle = 'Trainee Lawyer';
    else if (t === 'legal_associate' || t === 'legal associate' || t === 'trợ lý pháp lý') translatedTitle = 'Legal Associate';
    else if (t === 'specialist' || t === 'chuyên viên pháp lý') translatedTitle = 'Specialist';
    else if (t === 'accountant' || t === 'kế toán') translatedTitle = 'Accountant';
    else if (t === 'prosecutor' || t === 'kiểm soát viên' || t === 'kiểm soát chất lượng') translatedTitle = 'Quality Controller';
    else if (t === 'controller' || t === 'kiểm soát viên') translatedTitle = 'Controller';
    else if (t === 'editor' || t === 'biên tập viên') translatedTitle = 'Editor';
    else if (t === 'intern' || t === 'legal_intern' || t === 'thực tập sinh') translatedTitle = 'Intern';
    else if (t === 'user' || t === 'người dùng') translatedTitle = 'User';
  }

  const capitalizedTitle = typeof translatedTitle === 'string' && translatedTitle.length > 0
    ? translatedTitle.charAt(0).toUpperCase() + translatedTitle.slice(1)
    : 'Biên tập viên';
    
  const userName = (user.name || '').trim();
  const userNameLower = userName.toLowerCase();
  
  const defaultNames = ["admin", "administrator", "system", "quản trị viên", "quantrivien", "root", "user", "người dùng", "nguoidung", "director", "giám đốc", "giamdoc", "deputy_director", "phó giám đốc", "phogiamdoc", "manager", "quản lý", "quanly", "lawyer", "luật sư", "luatsu", "editor", "biên tập viên", "bientapvien"];
  const isDefaultName = defaultNames.includes(userNameLower) || userNameLower === "";
  
  if (language === 'vi') {
    if (isDefaultName) {
      return `Xin chào, ${capitalizedTitle}`;
    }
    if (userNameLower.startsWith(capitalizedTitle.toLowerCase())) {
      return `Xin chào, ${userName}`;
    }
    return `Xin chào, ${capitalizedTitle} ${userName}`;
  } else {
    if (isDefaultName) {
      return `Hello, ${capitalizedTitle}`;
    }
    if (userNameLower.startsWith(capitalizedTitle.toLowerCase())) {
      return `Hello, ${userName}`;
    }
    return `Hello, ${capitalizedTitle} ${userName}`;
  }
}

export default function AdminDashboard({ onBack, user, onUpdateUser, initialTab = 'dashboard_overview' }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'services' | 'legal_services' | 'news' | 'recruitment' | 'team' | 'users' | 'clients' | 'messages' | 'stats' | 'profile' | 'settings' | 'offices' | 'contacts' | 'tools' | 'dashboard_overview' | 'activity_logs'>(initialTab);
  const [messages, setMessages] = useState<any[]>([]);
  const [formMessages, setFormMessages] = useState<any[]>([]);
  const [activeMessageTab, setActiveMessageTab] = useState<'live' | 'form'>('live');
  const [stats, setStats] = useState<any>({ chartData: [], summary: { totalMessages: 0, unreadMessages: 0 } });
  const [statsRange, setStatsRange] = useState<'7d' | '14d' | '30d' | 'all'>('30d');
  const [websiteChartType, setWebsiteChartType] = useState<'area' | 'line' | 'bar'>('area');
  const [serviceChartMetric, setServiceChartMetric] = useState<'cases' | 'revenue' | 'conversion'>('cases');

  const rawChartData = stats?.chartData || [];
  const filteredChartData = React.useMemo(() => {
    if (!rawChartData.length) return [];
    if (statsRange === '7d') return rawChartData.slice(-7);
    if (statsRange === '14d') return rawChartData.slice(-14);
    if (statsRange === '30d') return rawChartData.slice(-30);
    return rawChartData;
  }, [rawChartData, statsRange]);

  const legalPerfData = stats?.legalServicesPerformance || [
    { name: 'Tranh tụng', casesCount: 35, revenue: 1200000000, conversionRate: 85, satisfaction: 98, activeConsultations: 12, color: '#a855f7' },
    { name: 'Tư vấn Pháp luật', casesCount: 42, revenue: 850000000, conversionRate: 90, satisfaction: 97, activeConsultations: 15, color: '#3b82f6' },
    { name: 'Đại diện Ngoài tố tụng', casesCount: 28, revenue: 620000000, conversionRate: 88, satisfaction: 95, activeConsultations: 9, color: '#06b6d4' },
    { name: 'Pháp chế & Nội bộ', casesCount: 54, revenue: 490000000, conversionRate: 94, satisfaction: 99, activeConsultations: 18, color: '#10b981' },
    { name: 'Trọng tài & Hòa giải', casesCount: 22, revenue: 380000000, conversionRate: 86, satisfaction: 96, activeConsultations: 7, color: '#f59e0b' },
  ];

  const monthlyTrendData = stats?.monthlyServicesTrend || [
    { month: 'Tháng 1', 'Tranh tụng': 5, 'Tư vấn Pháp luật': 6, 'Đại diện Ngoài tố tụng': 4, 'Pháp chế & Nội bộ': 8, 'Trọng tài & Hòa giải': 3 },
    { month: 'Tháng 2', 'Tranh tụng': 6, 'Tư vấn Pháp luật': 8, 'Đại diện Ngoài tố tụng': 5, 'Pháp chế & Nội bộ': 10, 'Trọng tài & Hòa giải': 4 },
    { month: 'Tháng 3', 'Tranh tụng': 8, 'Tư vấn Pháp luật': 9, 'Đại diện Ngoài tố tụng': 7, 'Pháp chế & Nội bộ': 12, 'Trọng tài & Hòa giải': 5 },
    { month: 'Tháng 4', 'Tranh tụng': 10, 'Tư vấn Pháp luật': 12, 'Đại diện Ngoài tố tụng': 8, 'Pháp chế & Nội bộ': 15, 'Trọng tài & Hòa giải': 6 },
    { month: 'Tháng 5', 'Tranh tụng': 12, 'Tư vấn Pháp luật': 15, 'Đại diện Ngoài tố tụng': 10, 'Pháp chế & Nội bộ': 18, 'Trọng tài & Hòa giải': 8 },
    { month: 'Tháng 6', 'Tranh tụng': 35, 'Tư vấn Pháp luật': 42, 'Đại diện Ngoài tố tụng': 28, 'Pháp chế & Nội bộ': 54, 'Trọng tài & Hòa giải': 22 },
  ];
  const [activeVisitorId, setActiveVisitorId] = useState<string | null>(null);
  const [visitorMessages, setVisitorMessages] = useState<any[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [adminSocket, setAdminSocket] = useState<any>(null);
  const visitorEndRef = React.useRef<HTMLDivElement>(null);
  const adminFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingObj, setIsUploadingObj] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const handleGlobalThemeEvent = (e: any) => {
      if (e.detail && typeof e.detail.isDarkMode === "boolean") {
        if (e.detail.isDarkMode !== darkMode) {
          setDarkMode(e.detail.isDarkMode);
        }
      }
    };
    window.addEventListener("global-theme-changed", handleGlobalThemeEvent);
    return () => window.removeEventListener("global-theme-changed", handleGlobalThemeEvent);
  }, [darkMode]);

  const handleToggleDarkMode = (val: boolean) => {
    setDarkMode(val);
    if (val) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lawfirm_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lawfirm_theme_mode', 'light');
    }
    window.dispatchEvent(new CustomEvent('global-theme-changed', { detail: { isDarkMode: val } }));
  };


  const [services, setServices] = useState<Service[]>([]);
  const [legalServices, setLegalServices] = useState<Service[]>([]);
  const [news, setNews] = useState<Service[]>([]); // Using Service type for simplicity as structure is similar
  const [recruitment, setRecruitment] = useState<Recruitment[]>([]);
  const [recruitmentBenefits, setRecruitmentBenefits] = useState<RecruitmentBenefit[]>([]);
  const [recruitmentProcess, setRecruitmentProcess] = useState<RecruitmentProcessStep[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Editing state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingLegalService, setEditingLegalService] = useState<Service | null>(null);
  const [editingNews, setEditingNews] = useState<Service | null>(null);
  const [editingRecruitment, setEditingRecruitment] = useState<Recruitment | null>(null);
  const [editingBenefit, setEditingBenefit] = useState<RecruitmentBenefit | null>(null);
  const [editingProcessStep, setEditingProcessStep] = useState<RecruitmentProcessStep | null>(null);
  const [recruitmentSubTab, setRecruitmentSubTab] = useState<'positions' | 'benefits' | 'process'>('positions');
  const [editingTeam, setEditingTeam] = useState<TeamMember | null>(null);
  const [editingOffice, setEditingOffice] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPracticeDropdown, setShowPracticeDropdown] = useState(false);
  const [usersSubTab, setUsersSubTab] = useState<'list' | 'matrix'>('list');
  const [departmentPermissions, setDepartmentPermissions] = useState<any>(() => {
    const saved = localStorage.getItem('dept_permissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_DEPARTMENT_PERMISSIONS;
  });

  // Legal tools & Testimonials state
  const [legalForms, setLegalForms] = useState<any[]>([]);
  const [judgments, setJudgments] = useState<any[]>([]);
  const [precedents, setPrecedents] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [landPrices, setLandPrices] = useState<any[]>([]);
  const [subdivisionLimits, setSubdivisionLimits] = useState<any[]>([]);
  const [landDocuments, setLandDocuments] = useState<any[]>([]);
  const [isSavingLandDoc, setIsSavingLandDoc] = useState(false);

  // Editing state for legal tools & Testimonials
  const [editingLegalForm, setEditingLegalForm] = useState<any | null>(null);
  const [editingJudgment, setEditingJudgment] = useState<any | null>(null);
  const [editingPrecedent, setEditingPrecedent] = useState<any | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<any | null>(null);
  const [editingLandPrice, setEditingLandPrice] = useState<any | null>(null);
  const [editingSubdivisionLimit, setEditingSubdivisionLimit] = useState<any | null>(null);

  const [toolsSubTab, setToolsSubTab] = useState<'forms' | 'judgments' | 'precedents' | 'land' | 'subdivision'>('forms');
  const [profileForm, setProfileForm] = useState({ 
    name: '', password: '', phone: '', email: '', dob: '', gender: 'other', address: '' 
  });
  const [isAdding, setIsAdding] = useState(false);
  const [legalServiceSearch, setLegalServiceSearch] = useState('');
  const [adminNewsFilter, setAdminNewsFilter] = useState<'ALL' | 'TIN_TUC_CHUNG' | 'LINH_VUC_HOAT_DONG' | 'DICH_VU_PHAP_LY' | 'CHUC_MUNG_SINH_NHAT' | 'HOAT_DONG_NOI_BO'>('ALL');
  const [adminNewsSubFilter, setAdminNewsSubFilter] = useState<string>('ALL');
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);
  
  // Contact Settings state
  const [contactSettings, setContactSettings] = useState({
    hotline_consult: '',
    hotline_accounting: '',
    hotline_feedback: '',
    email: '',
    facebook_url: '',
    messenger_url: '',
    zalo_url: '',
    youtube_url: '',
    tiktok_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    logo_url: '/logo.svg',
    logo_cms_url: '/logo.svg',
    logo_portal_url: '/logo.svg',
    hero_image_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=60&w=1280&auto=format&fit=crop',
    hero_subtitle: 'Công ty Luật TNHH Ánh Dương',
    hero_title_1: 'Vững Pháp Lý',
    hero_title_2: 'Sáng Tương Lai',
    hero_description: 'Kiến tạo giải pháp pháp lý toàn diện, đẳng cấp và tận tâm. Đối tác tin cậy cho sự thịnh vượng bền vững.',
    about_image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=60&w=800&auto=format&fit=crop',
    about_years_exp: '15+',
    about_years_label: 'NĂM KINH NGHIỆM VỮNG CHẮC',
    about_vision_title: '1. Tầm nhìn (Vision)',
    about_vision_text: '"Trở thành định chế pháp lý biểu tượng cho sự Tin cậy và Sáng tạo."',
    about_mission_title: '2. Sứ mệnh (Mission)',
    about_mission_text: '"Chiếu sáng lộ trình pháp lý - Bảo vệ giá trị thịnh vượng."',
  });
  const [cmsSubTab, setCmsSubTab] = useState<'logo' | 'hero' | 'about' | 'contact'>('logo');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingContacts, setIsSavingContacts] = useState(false);
  const [saveContactsSuccess, setSaveContactsSuccess] = useState<boolean | null>(null);

  const handleCmsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      let uploadedUrl = '';
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetchApi('/api/live-upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        uploadedUrl = data.fileUrl || data.url || '';
      }
      
      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve((evt.target?.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }

      if (uploadedUrl) {
        if (fieldName === 'logo_url') {
          try { localStorage.setItem('lawfirm_custom_logo', uploadedUrl); } catch (e) {}
        }
        const updatedSettings = { ...contactSettings, [fieldName]: uploadedUrl };
        setContactSettings(updatedSettings);
        
        // Auto-save immediately to database so settings persist across reloads
        await fetchApi('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSettings)
        });
        window.dispatchEvent(new Event('contact-settings-updated'));
        setSaveContactsSuccess(true);
        setTimeout(() => setSaveContactsSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // AI Module & API Settings state
  const [aiSettings, setAiSettings] = useState({
    api_key: '',
    provider: 'gemini-2.5-flash',
    model: 'gemini-2.5-flash',
    temperature: '0.2',
    max_tokens: '2048',
    auto_summary: true,
    contract_ocr: true,
    legal_search: true,
    consultation_bot: true,
  });
  const [showAiKey, setShowAiKey] = useState(false);
  const [isSavingAiSettings, setIsSavingAiSettings] = useState(false);
  const [saveAiSuccess, setSaveAiSuccess] = useState<boolean | null>(null);

  // Team Header Settings state
  const [isEditingTeamHeader, setIsEditingTeamHeader] = useState(false);
  const [isSavingTeamHeader, setIsSavingTeamHeader] = useState(false);
  const [teamHeaderSettings, setTeamHeaderSettings] = useState({
    team_subtitle: 'Hội Đồng Luật Sư',
    team_title: 'Đội Ngũ **Luật Sư Cộng Sự** Cấp Cao',
    team_description: 'Hội tụ những chuyên gia luật học hàng đầu tốt nghiệp tại các trường đại học danh tiếng tại Pháp, Singapore, tận tâm và dạn dày kinh nghiệm lâm trận thực tế.'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchApi('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setContactSettings({
              hotline_consult: data.hotline_consult || '1900 3330',
              hotline_accounting: data.hotline_accounting || '084.696.7979',
              hotline_feedback: data.hotline_feedback || '090.999.3330',
              email: data.email || 'info@anhduonglaw.vn',
              facebook_url: data.facebook_url || '',
              messenger_url: data.messenger_url || '',
              zalo_url: data.zalo_url || '',
              youtube_url: data.youtube_url || '',
              tiktok_url: data.tiktok_url || '',
              instagram_url: data.instagram_url || '',
              twitter_url: data.twitter_url || '',
              linkedin_url: data.linkedin_url || '',
              logo_url: data.logo_url || '/logo.svg',
              logo_cms_url: data.logo_cms_url || data.logo_url || '/logo.svg',
              logo_portal_url: data.logo_portal_url || data.logo_url || '/logo.svg',
              hero_image_url: data.hero_image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=60&w=1280&auto=format&fit=crop',
              hero_subtitle: data.hero_subtitle || 'Công ty Luật TNHH Ánh Dương',
              hero_title_1: data.hero_title_1 || 'Vững Pháp Lý',
              hero_title_2: data.hero_title_2 || 'Sáng Tương Lai',
              hero_description: data.hero_description || 'Kiến tạo giải pháp pháp lý toàn diện, đẳng cấp và tận tâm. Đối tác tin cậy cho sự thịnh vượng bền vững.',
              about_image_url: data.about_image_url || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=60&w=800&auto=format&fit=crop',
              about_years_exp: data.about_years_exp || '15+',
              about_years_label: data.about_years_label || 'NĂM KINH NGHIỆM VỮNG CHẮC',
              about_vision_title: data.about_vision_title || '1. Tầm nhìn (Vision)',
              about_vision_text: data.about_vision_text || '"Trở thành định chế pháp lý biểu tượng cho sự Tin cậy và Sáng tạo."',
              about_mission_title: data.about_mission_title || '2. Sứ mệnh (Mission)',
              about_mission_text: data.about_mission_text || '"Chiếu sáng lộ trình pháp lý - Bảo vệ giá trị thịnh vượng."',
            });
            setAiSettings({
              api_key: data.ai_api_key || '',
              provider: data.ai_provider || 'gemini-2.5-flash',
              model: data.ai_model || 'gemini-2.5-flash',
              temperature: data.ai_temperature || '0.2',
              max_tokens: data.ai_max_tokens || '2048',
              auto_summary: data.ai_auto_summary !== 'false',
              contract_ocr: data.ai_contract_ocr !== 'false',
              legal_search: data.ai_legal_search !== 'false',
              consultation_bot: data.ai_consultation_bot !== 'false',
            });
            setTeamHeaderSettings({
              team_subtitle: data.team_subtitle || 'Hội Đồng Luật Sư',
              team_title: data.team_title || 'Đội Ngũ **Luật Sư Cộng Sự** Cấp Cao',
              team_description: data.team_description || 'Hội tụ những chuyên gia luật học hàng đầu tốt nghiệp tại các trường đại học danh tiếng tại Pháp, Singapore, tận tâm và dạn dày kinh nghiệm lâm trận thực tế.'
            });
          }
        }
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
    };
    fetchSettings();
  }, [activeTab]);

  const handleSaveAiSettings = async () => {
    setIsSavingAiSettings(true);
    setSaveAiSuccess(null);
    try {
      const payload = {
        ai_api_key: aiSettings.api_key,
        ai_provider: aiSettings.provider,
        ai_model: aiSettings.model,
        ai_temperature: aiSettings.temperature,
        ai_max_tokens: aiSettings.max_tokens,
        ai_auto_summary: String(aiSettings.auto_summary),
        ai_contract_ocr: String(aiSettings.contract_ocr),
        ai_legal_search: String(aiSettings.legal_search),
        ai_consultation_bot: String(aiSettings.consultation_bot),
      };
      const res = await fetchApi('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveAiSuccess(true);
        setTimeout(() => setSaveAiSuccess(null), 3500);
      } else {
        setSaveAiSuccess(false);
      }
    } catch (e) {
      setSaveAiSuccess(false);
    } finally {
      setIsSavingAiSettings(false);
    }
  };

  const handleSaveTeamHeader = async () => {
    setIsSavingTeamHeader(true);
    try {
      const res = await fetchApi('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_subtitle: teamHeaderSettings.team_subtitle,
          team_title: teamHeaderSettings.team_title,
          team_description: teamHeaderSettings.team_description
        })
      });
      if (res.ok) {
        setIsEditingTeamHeader(false);
        alert('Lưu tiêu đề Hội đồng luật sư thành công!');
        window.dispatchEvent(new Event('contact-settings-updated'));
      } else {
        alert('Có lỗi xảy ra khi lưu tiêu đề.');
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi kết nối server.');
    } finally {
      setIsSavingTeamHeader(false);
    }
  };
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState('vi');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const profileAvatarRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleProfileAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadRes = await fetchApi('/api/upload', { method: 'POST', body: formData }); const uploadData = await uploadRes.json();
      if (uploadRes.ok && uploadData.imageUrl) {
        // Update user avatar in db
        const saveRes = await fetchApi(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: uploadData.imageUrl })
        });
        
        if (saveRes.ok) {
           // update global user
           if (onUpdateUser) {
             const meRes = await fetchApi('/api/me'); if (meRes.ok) { const meData = await meRes.json();
               if (meData.user) {
                 onUpdateUser(meData.user);
               }
             }
           }
           alert('Cập nhật ảnh đại diện thành công!');
        } else {
           throw new Error('Lỗi cập nhật CSDL');
        }
      } else {
        throw new Error('Lỗi tải ảnh');
      }
    } catch(err: any) {
      console.error(err);
      alert('Đã có lỗi xảy ra: ' + err.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
  // Security functionality states
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [autoLogout, setAutoLogout] = useState('30');
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (stats?.summary?.unreadMessages > 0) {
      setShowReminder(true);
      const hideTimeout = setTimeout(() => setShowReminder(false), 5000);

      const interval = setInterval(() => {
        setShowReminder(true);
        setTimeout(() => setShowReminder(false), 5000); 
      }, 30000); 
      return () => {
        clearInterval(interval);
        clearTimeout(hideTimeout);
      };
    }
  }, [stats?.summary?.unreadMessages]);

  useEffect(() => {
    fetchData();
    
    // Connect Admin socket
    let s: any = null;
    try {
      s = io();
      setAdminSocket(s);
      s.on('connect', () => s.emit('join_admin'));
      s.on('receive_message', (msg: any) => {
        // If it's a new message, refresh thread list
        fetchData();
        setVisitorMessages(prev => {
          const exists = prev.find(m => m.created_at === msg.created_at && m.content === msg.content);
          if (exists) return prev;
          return [...prev, msg];
        });
      });
      s.on('messages_read', () => fetchData());
      s.on('cms_updated', () => fetchData());
      s.on('users_updated', () => fetchData());
      s.on('settings_updated', () => {
        fetchData();
        window.dispatchEvent(new CustomEvent("contact-settings-updated"));
      });
      s.on('permissions_updated', () => {
        fetchData();
        fetchApi('/api/permissions/me').then(res => res.json()).then(setMyPermissions).catch(() => {});
      });
      s.on('legal_docs_updated', () => fetchData());
      
    } catch(e) {}
    
    return () => { 
      if (s) s.disconnect(); 
    };
  }, []); // Remove user from here, and don't re-run fetchData endlessly

  useEffect(() => {
    if (user) {
      setProfileForm({ 
        name: user.name || '', 
        password: '',
        phone: user.phone || '',
        email: user.email || '',
        dob: user.dob || '',
        gender: user.gender || 'other',
        address: user.address || ''
      });
    }
  }, [user]);

  const [myPermissions, setMyPermissions] = useState<any>(null);

  useEffect(() => {
    fetchApi('/api/permissions/me').then(res => res.json()).then(setMyPermissions).catch(() => {});
  }, []);

  const isSystemAdminOrDirector = ['admin', 'director', 'deputydirector', 'deputy_director', 'deputy director', 'giám đốc', 'phó giám đốc', 'quản trị viên'].includes((user?.role || '').toLowerCase());
  const canManageUsers = isSystemAdminOrDirector || (myPermissions ? myPermissions.manageUsers : ['admin', 'director', 'deputyDirector', 'deputy_director', 'manager', 'manage', 'head_of_department', 'controller'].includes(user?.role || ''));
  const canEditContent = isSystemAdminOrDirector || (myPermissions ? myPermissions.manageWeb : ['admin', 'director', 'deputyDirector', 'deputy_director', 'manager', 'manage', 'head_of_department', 'controller', 'editor'].includes(user?.role || ''));

  // Users without edit content access will only have access to allowed tabs
  useEffect(() => {
    if (!canEditContent && canManageUsers && !['users', 'settings', 'profile', 'contacts'].includes(activeTab)) {
      setActiveTab('users');
    } else if (!canEditContent && !canManageUsers && activeTab !== 'profile') {
      setActiveTab('profile');
    }
  }, [canEditContent, canManageUsers, activeTab]);


  const fetchThreadMessages = async (vid: string) => {
     try {
       const res = await fetchApi(`/api/live-messages/${vid}`);
       if (res.ok) {
         setVisitorMessages(await res.json());
       }
     } catch(e) {}
  };

  useEffect(() => {
    if (activeVisitorId) {
      fetchThreadMessages(activeVisitorId);
      visitorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeVisitorId]);

  useEffect(() => {
    if (visitorMessages.length > 0) {
      visitorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visitorMessages]);

  const sendAdminMessage = () => {
    if ((!adminInput.trim() && !adminFileInputRef.current?.files?.[0]) || !adminSocket || !activeVisitorId) return;
    
    const msg = {
      visitorId: activeVisitorId,
      senderType: 'admin',
      content: adminInput
    };
    adminSocket.emit('send_message', msg);
    setAdminInput('');
  };

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminSocket || !activeVisitorId) return;
    
    setIsUploadingObj(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetchApi('/api/live-upload', { method: 'POST', body: formData });
      const data = await res.json();
      adminSocket.emit('send_message', {
        visitorId: activeVisitorId, senderType: 'admin', content: '', fileUrl: data.url, fileName: data.name
      });
    } catch(err) {
      alert("Lỗi tải file");
    } finally {
      setIsUploadingObj(false);
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const t = Date.now();
      const responses = await Promise.all([
        fetchApi(`/api/services?t=${t}`),
        fetchApi(`/api/legal-services?t=${t}`),
        fetchApi(`/api/news?t=${t}`),
        fetchApi(`/api/recruitment?t=${t}`),
        fetchApi(`/api/team?t=${t}`),
        fetchApi(`/api/recruitment-benefits?t=${t}`),
        fetchApi(`/api/recruitment-process?t=${t}`),
        fetchApi(`/api/offices?t=${t}`),
        fetchApi(`/api/cms/legal-forms?t=${t}`),
        fetchApi(`/api/cms/judgments?t=${t}`),
        fetchApi(`/api/cms/precedents?t=${t}`),
        fetchApi(`/api/cms/testimonials?t=${t}`),
        fetchApi(`/api/cms/land-prices?t=${t}`),
        fetchApi(`/api/cms/subdivision-limits?t=${t}`),
        fetchApi(`/api/cms/land-documents?t=${t}`)
      ]);

      for (const res of responses) {
        if (!res.ok) {
           console.error("fetchData error on", res.url, await res.text());
        }
      }

      if (responses[0].ok) setServices(await responses[0].json());
      if (responses[1].ok) setLegalServices(await responses[1].json());
      if (responses[2].ok) setNews(await responses[2].json());
      if (responses[3].ok) setRecruitment(await responses[3].json());
      if (responses[4].ok) setTeam(await responses[4].json());
      if (responses[5] && responses[5].ok) setRecruitmentBenefits(await responses[5].json());
      if (responses[6] && responses[6].ok) setRecruitmentProcess(await responses[6].json());
      
      // Fetch office branches dynamically from Firestore as requested
      try {
        const firestoreBranches = await fetchBranches();
        if (firestoreBranches && firestoreBranches.length > 0) {
          setOffices(firestoreBranches);
        } else if (responses[7] && responses[7].ok) {
          setOffices(await responses[7].json());
        }
      } catch (e) {
        console.error("Error fetching branches from Firestore in AdminDashboard:", e);
        if (responses[7] && responses[7].ok) {
          setOffices(await responses[7].json());
        }
      }

      if (responses[8] && responses[8].ok) setLegalForms(await responses[8].json());
      if (responses[9] && responses[9].ok) setJudgments(await responses[9].json());
      if (responses[10] && responses[10].ok) setPrecedents(await responses[10].json());
      if (responses[11] && responses[11].ok) setTestimonials(await responses[11].json());
      if (responses[12] && responses[12].ok) setLandPrices(await responses[12].json());
      if (responses[13] && responses[13].ok) setSubdivisionLimits(await responses[13].json());
      if (responses[14] && responses[14].ok) {
        const docRes = await responses[14].json();
        setLandDocuments(docRes.data || []);
      }
      
      if (canManageUsers) {
        const usersRes = await fetchApi(`/api/users?t=${t}`);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch users:', await usersRes.text());
          setUsers([]);
        }
      }

      // Fetch messages and stats
      try {
        const msgsRes = await fetchApi(`/api/live-threads?t=${t}`);
        if (msgsRes.ok) setMessages(await msgsRes.json());
        
        const formMsgsRes = await fetchApi(`/api/messages?t=${t}`);
        if (formMsgsRes.ok) setFormMessages(await formMsgsRes.json());

        const statsRes = await fetchApi(`/api/stats?t=${t}`);
        if (statsRes.ok) setStats(await statsRes.json());

        const recordsRes = await fetchApi(`/api/erp-records?t=${t}`);
        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          setRecords(Array.isArray(recordsData) ? recordsData : []);
        }

        const eventsRes = await fetchApi(`/api/events?t=${t}`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(Array.isArray(eventsData) ? eventsData : []);
        }
      } catch(e) {}

    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetchApi(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          name: profileForm.name,
          role: user.role,
          phone: profileForm.phone,
          email: profileForm.email,
          dob: profileForm.dob,
          gender: profileForm.gender,
          address: profileForm.address,
          password: profileForm.password || undefined
        }),
      });
      
      if (!res.ok) {
        let msg = 'Failed to update profile';
        try {
          const data = await res.json();
          msg = data.error || data.message || msg;
        } catch(e) {}
        throw new Error(msg);
      }

      if (onUpdateUser) {
        const meRes = await fetchApi('/api/me'); if (meRes.ok) { const meData = await meRes.json();
          if (meData.user) {
             onUpdateUser(meData.user);
          }
        }
      }
      alert('Cập nhật thông tin thành công!');
    } catch (error: any) {
      console.error('Failed to update profile', error);
      alert(error.message);
    }
  };

  const generateStaffCode = (title: string, userIndex: number) => {
    if (!title) return `NV${String(userIndex).padStart(3, '0')}`;
    const words = title.trim().split(/\s+/);
    let prefix = '';
    if (words.length === 1) {
      prefix = words[0].substring(0, 2).toUpperCase();
    } else {
      prefix = words.map(w => w[0].toUpperCase()).join('');
    }
    prefix = prefix.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D');
    return `${prefix}${String(userIndex).padStart(3, '0')}`;
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const method = editingUser.id ? 'PUT' : 'POST';
    const url = editingUser.id ? `/api/users/${editingUser.id}` : '/api/users';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });
      
      if (!res.ok) {
        let msg = 'Failed to save user';
        try {
          const data = await res.json();
          msg = data.error || data.message || msg;
        } catch(e) {}
        throw new Error(msg);
      }

      await fetchData();
      setEditingUser(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save user', error);
      alert(error.message);
    }
  };

  const handleResetUserAccount = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục tài khoản',
      message: 'Bạn có chắc chắn muốn khôi phục tài khoản người dùng này về mặc định (Mật khẩu: Abcd@12345, xoá liên kết thiết bị)? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/users/${id}/reset_account`, { method: 'POST' });
          if (!res.ok) {
            let msg = 'Failed to reset user account';
            try {
              const data = await res.json();
              msg = data.error || data.message || msg;
            } catch(e) {}
            throw new Error(msg);
          }
          alert('Khôi phục tài khoản thành công. Mật khẩu mới là Abcd@12345');
          fetchData();
        } catch (error: any) {
          console.error('Failed to reset user account', error);
          alert('Khôi phục thất bại: ' + (error.message || error));
        }
      }
    });
  };

  const handleDeleteUser = async (id: number) => {
    if (id === user?.id) {
      alert('Bạn không thể xóa tài khoản của chính mình.');
      return;
    }
    const targetUser = users.find(u => u.id === id);
    if (targetUser?.role === 'admin' || targetUser?.username === 'admin') {
      alert('Không thể xóa tài khoản quản trị viên.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa người dùng',
      message: 'Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setUsers(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(`/api/users/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete user', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    }); return;
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const method = editingService.id ? 'PUT' : 'POST';
    const url = editingService.id ? `/api/services/${editingService.id}` : '/api/services';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      fetchData();
      setEditingService(null);
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to save service', error);
      alert('Lỗi: ' + error);
    }
  };

  const handleDeleteService = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa dịch vụ',
      message: 'Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setServices(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(`/api/services/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };

  const handleSaveLegalService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLegalService) return;

    const method = editingLegalService.id ? 'PUT' : 'POST';
    const url = editingLegalService.id ? `/api/legal-services/${editingLegalService.id}` : '/api/legal-services';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLegalService),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingLegalService(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save legal service', error);
      alert('Lưu thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteLegalService = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa dịch vụ pháp lý',
      message: 'Bạn có chắc chắn muốn xóa dịch vụ pháp lý này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setLegalServices(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(`/api/legal-services/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete legal service', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;

    const method = editingNews.id ? 'PUT' : 'POST';
    const url = editingNews.id ? `/api/news/${editingNews.id}` : '/api/news';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNews),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingNews(null);
      setIsAdding(false);
      window.dispatchEvent(new Event('news-updated'));
    } catch (error: any) {
      console.error('Failed to save news', error);
      alert('Lưu thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteNews = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setNews(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(`/api/news/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
          window.dispatchEvent(new Event('news-updated'));
        } catch (error: any) {
          console.error('Failed to delete news', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };

  const handleSaveRecruitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecruitment) return;

    const method = editingRecruitment.id ? 'PUT' : 'POST';
    const url = editingRecruitment.id ? `/api/recruitment/${editingRecruitment.id}` : '/api/recruitment';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRecruitment),
      });
      
      if (!res.ok) throw new Error(await res.text());

      fetchData();
      setEditingRecruitment(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save recruitment', error);
      alert('Lưu thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteRecruitment = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa tin tuyển dụng',
      message: 'Bạn có chắc chắn muốn xóa tin tuyển dụng này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setRecruitment(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(`/api/recruitment/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };

  const handleRecruitmentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingRecruitment) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setEditingRecruitment({ 
          ...editingRecruitment, 
          file_url: data.fileUrl,
          file_name: file.name
        });
      } else {
        alert(`Tải file thất bại: ${data.message}`);
      }
    } catch (error) {
      console.error('Upload error', error);
      alert('Lỗi kết nối khi tải file');
    }
  };

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBenefit) return;

    const method = editingBenefit.id ? 'PUT' : 'POST';
    const url = editingBenefit.id ? `/api/recruitment-benefits/${editingBenefit.id}` : '/api/recruitment-benefits';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBenefit),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingBenefit(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save benefit', error);
      alert('Lưu thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteBenefit = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa quyền lợi',
      message: 'Bạn có chắc chắn muốn xóa quyền lợi này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/recruitment-benefits/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete benefit', error);
          alert('Xoá thất bại: ' + (error.message || error));
        }
      }
    });
  };

  // ==================== LEGAL TOOLS & TESTIMONIALS CRUD HANDLERS ====================
  const handleSaveLegalForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLegalForm) return;

    const method = editingLegalForm.id ? 'PUT' : 'POST';
    const url = editingLegalForm.id ? `/api/cms/legal-forms/${editingLegalForm.id}` : '/api/cms/legal-forms';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLegalForm),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingLegalForm(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save legal form', error);
      alert('Lưu biểu mẫu thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteLegalForm = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa biểu mẫu pháp lý',
      message: 'Bạn có chắc chắn muốn xóa biểu mẫu pháp lý này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/cms/legal-forms/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete legal form', error);
          alert('Xoá thất bại: ' + (error.message || error));
        }
      }
    });
  };

  const handleSaveJudgment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJudgment) return;

    const method = editingJudgment.id ? 'PUT' : 'POST';
    const url = editingJudgment.id ? `/api/cms/judgments/${editingJudgment.id}` : '/api/cms/judgments';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingJudgment),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingJudgment(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save judgment', error);
      alert('Lưu bản án thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteJudgment = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa bản án công bố',
      message: 'Bạn có chắc chắn muốn xóa bản án công bố này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/cms/judgments/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete judgment', error);
          alert('Xoá thất bại: ' + (error.message || error));
        }
      }
    });
  };

  const handleSavePrecedent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrecedent) return;

    const method = editingPrecedent.id ? 'PUT' : 'POST';
    const url = editingPrecedent.id ? `/api/cms/precedents/${editingPrecedent.id}` : '/api/cms/precedents';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingPrecedent,
          approved_date: editingPrecedent.approvedDate || editingPrecedent.approved_date,
          law_issue: editingPrecedent.lawIssue || editingPrecedent.law_issue
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingPrecedent(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save precedent', error);
      alert('Lưu án lệ thất bại: ' + (error.message || error));
    }
  };

  const handleDeletePrecedent = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa án lệ tối cao',
      message: 'Bạn có chắc chắn muốn xóa án lệ này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/cms/precedents/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete precedent', error);
          alert('Xoá thất bại: ' + (error.message || error));
        }
      }
    });
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;

    const method = editingTestimonial.id ? 'PUT' : 'POST';
    const url = editingTestimonial.id ? `/api/cms/testimonials/${editingTestimonial.id}` : '/api/cms/testimonials';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTestimonial),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingTestimonial(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save testimonial', error);
      alert('Lưu đánh giá thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa đánh giá / chia sẻ',
      message: 'Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/cms/testimonials/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete testimonial', error);
          alert('Xoá thất bại: ' + (error.message || error));
        }
      }
    });
  };

  const handleSaveLandPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLandPrice) return;

    const method = editingLandPrice.id ? 'PUT' : 'POST';
    const url = editingLandPrice.id ? `/api/cms/land-prices/${editingLandPrice.id}` : '/api/cms/land-prices';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLandPrice),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingLandPrice(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save land price', error);
      alert('Lưu bảng giá đất thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteLandPrice = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa bảng giá đất',
      message: 'Bạn có chắc chắn muốn xóa bản ghi giá đất này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/cms/land-prices/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete land price', error);
          alert('Xóa thất bại: ' + (error.message || error));
        }
      }
    });
  };

  const [isScanningLand, setIsScanningLand] = useState(false);
  const [isScanningSubdivision, setIsScanningSubdivision] = useState(false);

  const handleScanLandPrices = async (provinceName: string, file: File | null, rawText: string) => {
    if (!provinceName) {
      alert("Vui lòng chọn hoặc nhập Tỉnh / Thành phố");
      return;
    }
    if (!file && !rawText.trim()) {
      alert("Vui lòng tải tệp tin văn bản hoặc dán nội dung quy định");
      return;
    }

    setIsScanningLand(true);
    const formData = new FormData();
    formData.append("province_name", provinceName);
    if (file) {
      formData.append("file", file);
    } else {
      formData.append("text", rawText);
    }

    try {
      const res = await fetchApi("/api/cms/scan-land-prices", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert("Quét AI thành công! Các bản ghi giá đất đã được phân tích và lưu vào cơ sở dữ liệu.");
        fetchData();
      } else {
        alert(`Có lỗi khi quét: ${data.error || "Vui lòng thử lại."}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi kết nối khi gọi API quét bảng giá đất.");
    } finally {
      setIsScanningLand(false);
    }
  };

  const handleScanSubdivisionLimits = async (provinceName: string, file: File | null, rawText: string) => {
    if (!provinceName) {
      alert("Vui lòng chọn hoặc nhập Tỉnh / Thành phố");
      return;
    }
    if (!file && !rawText.trim()) {
      alert("Vui lòng tải tệp tin văn bản hoặc dán nội dung quy định");
      return;
    }

    setIsScanningSubdivision(true);
    const formData = new FormData();
    formData.append("province_name", provinceName);
    if (file) {
      formData.append("file", file);
    } else {
      formData.append("text", rawText);
    }

    try {
      const res = await fetchApi("/api/cms/scan-subdivision-limits", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert("Quét AI thành công! Quy định diện tích tách thửa và đất ở đã được lưu vào cơ sở dữ liệu.");
        fetchData();
      } else {
        alert(`Có lỗi khi quét: ${data.error || "Vui lòng thử lại."}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi kết nối khi gọi API quét hạn mức tách thửa.");
    } finally {
      setIsScanningSubdivision(false);
    }
  };

  const handleSaveLandDocument = async (provinceName: string, file: File | null, rawText: string, docType: 'price' | 'subdivision') => {
    if (!provinceName) {
      alert("Vui lòng chọn hoặc nhập Tỉnh / Thành phố");
      return;
    }
    if (!file && !rawText.trim()) {
      alert("Vui lòng tải tệp tin văn bản hoặc dán nội dung quy định");
      return;
    }

    setIsSavingLandDoc(true);
    const formData = new FormData();
    formData.append("province_name", provinceName);
    formData.append("doc_type", docType);
    if (file) {
      formData.append("file", file);
    } else {
      formData.append("text", rawText);
    }

    try {
      const res = await fetchApi("/api/cms/save-land-document", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Lưu tài liệu cơ sở dữ liệu địa phương ${provinceName} thành công! Hệ thống đồng thời phân tích tự động dữ liệu sang dạng cấu trúc.`);
        fetchData();
      } else {
        alert(`Có lỗi khi lưu tài liệu: ${data.error || "Vui lòng thử lại."}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi kết nối khi gọi API lưu tài liệu đất đai.");
    } finally {
      setIsSavingLandDoc(false);
    }
  };

  const handleDeleteLandDocument = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa tài liệu cơ sở dữ liệu địa phương',
      message: 'Bạn có chắc chắn muốn xóa tài liệu này khỏi cơ sở dữ liệu địa phương? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/cms/land-documents/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete land document', error);
          alert('Xóa thất bại: ' + (error.message || error));
        }
      }
    });
  };

  const handleSaveSubdivisionLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubdivisionLimit) return;

    const method = editingSubdivisionLimit.id ? "PUT" : "POST";
    const url = editingSubdivisionLimit.id ? `/api/cms/subdivision-limits/${editingSubdivisionLimit.id}` : "/api/cms/subdivision-limits";

    try {
      const res = await fetchApi(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSubdivisionLimit),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingSubdivisionLimit(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error("Failed to save subdivision limit", error);
      alert("Lưu hạn mức tách thửa thất bại: " + (error.message || error));
    }
  };

  const handleDeleteSubdivisionLimit = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xóa hạn mức tách thửa",
      message: "Bạn có chắc chắn muốn xóa bản ghi hạn mức tách thửa này? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/cms/subdivision-limits/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error("Failed to delete subdivision limit", error);
          alert("Xóa thất bại: " + (error.message || error));
        }
      }
    });
  };

  const handleSaveProcessStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProcessStep) return;

    const method = editingProcessStep.id ? 'PUT' : 'POST';
    const url = editingProcessStep.id ? `/api/recruitment-process/${editingProcessStep.id}` : '/api/recruitment-process';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProcessStep),
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
      setEditingProcessStep(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save process step', error);
      alert('Lưu thất bại: ' + (error.message || error));
    }
  };

  const handleDeleteProcessStep = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa bước quy trình',
      message: 'Bạn có chắc chắn muốn xóa bước quy trình này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetchApi(`/api/recruitment-process/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete process step', error);
          alert('Xoá thất bại: ' + (error.message || error));
        }
      }
    });
  };

  const handleNewsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingNews) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setEditingNews({ 
          ...editingNews, 
          file_url: data.imageUrl,
          file_name: file.name
        });
      } else {
        console.error('Upload failed:', data.message);
        alert(`Tải file thất bại: ${data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Upload error', error);
      alert('Lỗi kết nối khi tải file');
    }
  };

  const handleLegalServiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLegalService) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setEditingLegalService({ 
          ...editingLegalService, 
          file_url: data.imageUrl,
          file_name: file.name
        });
      } else {
        console.error('Upload failed:', data.message);
        alert(`Tải file thất bại: ${data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Upload error', error);
      alert('Lỗi kết nối khi tải file');
    }
  };

  const handleServiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingService) return;

    const formData = new FormData();
    formData.append('image', file); // Reuse existing upload endpoint

    try {
      const response = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setEditingService({ 
          ...editingService, 
          file_url: data.imageUrl,
          file_name: file.name
        });
      } else {
        console.error('Upload failed:', data.message);
        alert(`Tải file thất bại: ${data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Upload error', error);
      alert('Lỗi kết nối khi tải file');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTeam) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetchApi('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setEditingTeam({ ...editingTeam, image: data.imageUrl });
      } else {
        console.error('Upload failed:', data.message);
        alert(`Tải ảnh thất bại: ${data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Upload error', error);
      alert('Lỗi kết nối khi tải ảnh');
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    const method = editingTeam.id ? 'PUT' : 'POST';
    const url = editingTeam.id ? `/api/team/${editingTeam.id}` : '/api/team';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTeam),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save team member');
      }

      await fetchData();
      setEditingTeam(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save team member', error);
      alert(error.message);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa đội ngũ',
      message: 'Bạn có chắc chắn muốn xóa thành viên này khỏi đội ngũ? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setTeam(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(`/api/team/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    }); return;
  };

  const handleSaveOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffice) return;

    const method = editingOffice.id ? 'PUT' : 'POST';
    const url = editingOffice.id ? `/api/offices/${editingOffice.id}` : '/api/offices';

    try {
      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOffice),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save office');
      }

      await fetchData();
      setEditingOffice(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Failed to save office', error);
      alert(error.message);
    }
  };

  const handleDeleteOffice = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa văn phòng',
      message: 'Bạn có chắc chắn muốn xóa văn phòng này khỏi hệ thống? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setOffices(prev => prev.filter(item => item.id !== id));
          const res = await fetchApi(`/api/offices/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          fetchData();
        } catch (error: any) {
          console.error('Failed to delete office', error);
          alert('Xoá thất bại: ' + (error.message || error));
          fetchData();
        }
      }
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {/* Confirm Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div style={{ zIndex: 999999 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 custom-scrollbar">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-[var(--color-text-dark)] mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-600 font-medium">
                {confirmDialog.message}
              </p>
            </div>
            
            <div className="flex gap-2 p-4 bg-gray-50 border-t border-gray-100 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Không (No)
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} /> Có (Yes)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <img 
                src={contactSettings.logo_cms_url || contactSettings.logo_url || "/logo.svg"} 
                alt="Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith('/logo.svg')) {
                    target.src = '/logo.svg';
                  }
                }}
              />
              <div className="flex flex-col py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
                  <h1 className="text-base sm:text-lg font-serif font-bold text-slate-800 leading-tight">
                    Hệ thống Quản lý Nội dung (CMS)
                  </h1>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-none mt-1 hidden xs:block">
                  Thay đổi thông tin, hình ảnh bài viết giới thiệu, dự án, tin tức, tuyển dụng...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-300 active:scale-95 group font-medium text-xs sm:text-sm"
              >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                <span>Quay lại trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-col md:flex-row gap-6 overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <nav className="flex-1 overflow-y-auto space-y-1 p-4 custom-scrollbar">
            {canEditContent && (
              <>
                <div className="mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng quan</div>
                <NavItem icon={<LayoutDashboard size={20} />} label="Tổng quan Dashboard" active={activeTab === 'dashboard_overview'} onClick={() => { setActiveTab('dashboard_overview'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
                <NavItem icon={<TrendingUp size={20} />} label="Thống kê" active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
                <NavItem 
                  icon={
                    <div className="relative">
                      <MessageSquare size={20} />
                      {stats?.summary?.unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  } 
                  label="Tin nhắn" 
                  active={activeTab === 'messages'} 
                  onClick={() => { setActiveTab('messages'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} 
                />

                <div className="mt-6 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quản lý nội dung</div>
                <NavItem icon={<Newspaper />} label="Tin Tức & Sự Kiện" active={activeTab === 'news'} onClick={() => { setActiveTab('news'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingRecruitment(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
                <NavItem icon={<Briefcase />} label="Lĩnh Vực Hoạt Động" active={activeTab === 'services'} onClick={() => { setActiveTab('services'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
                <NavItem icon={<Scale />} label="Dịch Vụ" active={activeTab === 'legal_services'} onClick={() => { setActiveTab('legal_services'); setEditingService(null); setEditingLegalService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
                <NavItem icon={<Users2 />} label="Đội Ngũ" active={activeTab === 'team'} onClick={() => { setActiveTab('team'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingRecruitment(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
                <NavItem icon={<UserPlus />} label="Tuyển Dụng" active={activeTab === 'recruitment'} onClick={() => { setActiveTab('recruitment'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingRecruitment(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
                <NavItem icon={<Calculator />} label="Công cụ pháp lý" active={activeTab === 'tools'} onClick={() => { setActiveTab('tools'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingRecruitment(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
                <NavItem icon={<Award />} label="Đối tác & Khách hàng" active={activeTab === 'clients'} onClick={() => { setActiveTab('clients'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingRecruitment(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
              </>
            )}

            {canManageUsers && (
              <>
                <div className="mt-6 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hệ thống</div>
                <NavItem icon={<Users />} label="Người dùng" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setEditingOffice(null); setIsAdding(false); }} />
                <NavItem icon={<History />} label="Nhật ký Hoạt động (Activity Logs)" active={activeTab === 'activity_logs'} onClick={() => { setActiveTab('activity_logs'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setEditingOffice(null); setIsAdding(false); }} />
                <NavItem icon={<Building2 />} label="Hệ thống văn phòng" active={activeTab === 'offices'} onClick={() => { setActiveTab('offices'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setEditingOffice(null); setIsAdding(false); }} />
                <NavItem icon={<Phone />} label="Quản lý liên hệ" active={activeTab === 'contacts'} onClick={() => { setActiveTab('contacts'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setEditingOffice(null); setIsAdding(false); }} />

                <NavItem icon={<Settings />} label="Cài đặt" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setEditingOffice(null); setIsAdding(false); }} />
              </>
            )}
            
            <div className={`${canEditContent || canManageUsers ? 'mt-6 ' : ''}mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider`}>Tài khoản</div>
            <NavItem icon={<UserCircle />} label="Thông tin cá nhân" active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setEditingLegalService(null); setEditingService(null); setEditingNews(null); setEditingTeam(null); setEditingUser(null); setIsAdding(false); }} />
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex-1 p-6 overflow-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Greeting Banner based on Image 3 */}
                <div className="mb-6 pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">
                      {getGreetingText(user, language)}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 font-medium font-mono">
                    Ngày làm việc: {(() => {
                      const daysVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
                      const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                      const date = new Date();
                      const dayName = language === 'vi' ? daysVi[date.getDay()] : daysEn[date.getDay()];
                      const dd = String(date.getDate()).padStart(2, '0');
                      const mm = String(date.getMonth() + 1).padStart(2, '0');
                      const yyyy = date.getFullYear();
                      return `${dayName}, ${dd}/${mm}/${yyyy}`;
                    })()}
                  </div>
                </div>

                {/* Tools Tab (Công cụ Pháp lý) */}
                {activeTab === 'tools' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 font-serif">Quản lý Công cụ pháp lý</h3>
                        <p className="text-slate-500 text-xs mt-1 font-medium">Cập nhật danh mục tài liệu, biểu mẫu, án lệ và bản án phục vụ tra cứu tiện ích</p>
                      </div>
                      
                      {!isAdding && !editingLegalForm && !editingJudgment && !editingPrecedent && !editingLandPrice && !editingSubdivisionLimit && canEditContent && ['forms', 'judgments', 'precedents', 'land', 'subdivision'].includes(toolsSubTab) && (
                        <button
                          onClick={() => {
                            setIsAdding(true);
                            if (toolsSubTab === 'forms') {
                              setEditingLegalForm({ id: 0, title: '', category: 'Dân sự', description: '', content: '' });
                            } else if (toolsSubTab === 'judgments') {
                              setEditingJudgment({ id: 0, code: '', title: '', court: '', date: '', category: 'Dân sự', summary: '', content: '' });
                            } else if (toolsSubTab === 'precedents') {
                              setEditingPrecedent({ id: 0, code: '', title: '', approvedDate: '', summary: '', lawIssue: '', solution: '' });
                            } else if (toolsSubTab === 'land') {
                              setEditingLandPrice({ id: 0, province_code: '', province_name: '', district_id: '', district_name: '', ward_name: '', street_name: '', price: 0, residential_price: '', commercial_price: '', non_agricultural_price: '', agricultural_price: '' });
                            } else if (toolsSubTab === 'subdivision') {
                              setEditingSubdivisionLimit({ id: 0, province_name: '', district_name: '', ward_name: '', subdivision_area: '', residential_limit: '', note: '' });
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors text-sm font-semibold shadow-sm shrink-0 self-start sm:self-center"
                        >
                          <Plus size={16} /> Thêm mới {toolsSubTab === 'forms' ? 'Biểu mẫu' : toolsSubTab === 'judgments' ? 'Bản án' : toolsSubTab === 'precedents' ? 'Án lệ' : toolsSubTab === 'land' ? 'Bản ghi giá đất' : 'Quy định tách thửa'}
                        </button>
                      )}
                    </div>

                    {/* Sub-tabs Selection */}
                    {!isAdding && !editingLegalForm && !editingJudgment && !editingPrecedent && !editingLandPrice && !editingSubdivisionLimit && (
                      <div className="flex border-b border-gray-200 overflow-x-auto gap-6 custom-scrollbar pb-1">
                        {/* 1. Án lệ tối cao */}
                        <button
                          onClick={() => { setToolsSubTab('precedents'); setIsAdding(false); setEditingLegalForm(null); setEditingJudgment(null); setEditingPrecedent(null); setEditingLandPrice(null); setEditingSubdivisionLimit(null); }}
                          className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                            toolsSubTab === 'precedents'
                              ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Án lệ tối cao ({precedents.length})
                        </button>
                        {/* 2. Bản án công bố */}
                        <button
                          onClick={() => { setToolsSubTab('judgments'); setIsAdding(false); setEditingLegalForm(null); setEditingJudgment(null); setEditingPrecedent(null); setEditingLandPrice(null); setEditingSubdivisionLimit(null); }}
                          className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                            toolsSubTab === 'judgments'
                              ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Bản án công bố ({judgments.length})
                        </button>
                        {/* 3. Bảng giá đất */}
                        <button
                          onClick={() => { setToolsSubTab('land'); setIsAdding(false); setEditingLegalForm(null); setEditingJudgment(null); setEditingPrecedent(null); setEditingLandPrice(null); setEditingSubdivisionLimit(null); }}
                          className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                            toolsSubTab === 'land'
                              ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Bảng giá đất ({landPrices.length})
                        </button>
                        {/* 4. Biểu mẫu pháp lý */}
                        <button
                          onClick={() => { setToolsSubTab('forms'); setIsAdding(false); setEditingLegalForm(null); setEditingJudgment(null); setEditingPrecedent(null); setEditingLandPrice(null); setEditingSubdivisionLimit(null); }}
                          className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                            toolsSubTab === 'forms'
                              ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Biểu mẫu pháp lý ({legalForms.length})
                        </button>
                        {/* 5. Tách thửa & Đất ở */}
                        <button
                          onClick={() => { setToolsSubTab('subdivision'); setIsAdding(false); setEditingLegalForm(null); setEditingJudgment(null); setEditingPrecedent(null); setEditingLandPrice(null); setEditingSubdivisionLimit(null); }}
                          className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                            toolsSubTab === 'subdivision'
                              ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Tách thửa & Đất ở ({subdivisionLimits.length})
                        </button>
                      </div>
                    )}

                    {/* 1. BIỂU MẪU PHÁP LÝ SECTION */}
                    {toolsSubTab === 'forms' && (
                      <>
                        {isAdding || editingLegalForm ? (
                          <form onSubmit={handleSaveLegalForm} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-800 text-lg mb-4">{editingLegalForm?.id ? 'Hiệu chỉnh Biểu mẫu' : 'Thêm Biểu mẫu mới'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề biểu mẫu</label>
                                <input
                                  type="text"
                                  required
                                  value={editingLegalForm?.title || ''}
                                  onChange={(e) => setEditingLegalForm({ ...editingLegalForm!, title: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                  placeholder="Ví dụ: Đơn khởi kiện dân sự..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Lĩnh vực / Phân loại</label>
                                <select
                                  value={editingLegalForm?.category || 'Dân sự'}
                                  onChange={(e) => setEditingLegalForm({ ...editingLegalForm!, category: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                >
                                  <option value="Dân sự">Dân sự</option>
                                  <option value="Doanh nghiệp">Doanh nghiệp</option>
                                  <option value="Hình sự">Hình sự</option>
                                  <option value="Đất đai">Đất đai</option>
                                  <option value="Lao động">Lao động</option>
                                  <option value="Hôn nhân">Hôn nhân</option>
                                  <option value="Hành chính">Hành chính</option>
                                  <option value="Khác">Khác</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                              <textarea
                                required
                                rows={2}
                                value={editingLegalForm?.description || ''}
                                onChange={(e) => setEditingLegalForm({ ...editingLegalForm!, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                placeholder="Tóm tắt ngắn gọn mục đích sử dụng biểu mẫu này..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung biểu mẫu</label>
                              <textarea
                                required
                                rows={10}
                                value={editingLegalForm?.content || ''}
                                onChange={(e) => setEditingLegalForm({ ...editingLegalForm!, content: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono text-xs leading-relaxed"
                                placeholder="Nhập cấu trúc và nội dung chi tiết của biểu mẫu..."
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => { setEditingLegalForm(null); setIsAdding(false); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-semibold"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors text-sm font-semibold"
                              >
                                <Save size={16} /> Lưu thay đổi
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {legalForms.map((form) => (
                              <div key={form.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                                      {form.category}
                                    </span>
                                    <FileText size={16} className="text-slate-400" />
                                  </div>
                                  <h4 className="font-bold font-serif text-slate-800 text-base mb-2 line-clamp-1">{form.title}</h4>
                                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">{form.description}</p>
                                </div>
                                {canEditContent && (
                                  <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full">
                                    <button
                                      onClick={() => setEditingLegalForm(form)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                    >
                                      <Edit2 size={13} /> HIỆU CHỈNH
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLegalForm(form.id)}
                                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                      title="Xóa biểu mẫu"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {legalForms.length === 0 && (
                              <div className="col-span-full bg-slate-50 py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm font-semibold">
                                Chưa có biểu mẫu pháp lý nào được cập nhật.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* 2. BẢN ÁN CÔNG BỐ SECTION */}
                    {toolsSubTab === 'judgments' && (
                      <>
                        {isAdding || editingJudgment ? (
                          <form onSubmit={handleSaveJudgment} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-800 text-lg mb-4">{editingJudgment?.id ? 'Hiệu chỉnh Bản án' : 'Đăng Bản án mới'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mã bản án / Số bản án</label>
                                <input
                                  type="text"
                                  required
                                  value={editingJudgment?.code || ''}
                                  onChange={(e) => setEditingJudgment({ ...editingJudgment!, code: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-mono"
                                  placeholder="Ví dụ: 01/2026/HS-ST..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề bản án</label>
                                <input
                                  type="text"
                                  required
                                  value={editingJudgment?.title || ''}
                                  onChange={(e) => setEditingJudgment({ ...editingJudgment!, title: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                  placeholder="Ví dụ: Về việc Tranh chấp quyền sử dụng đất..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tòa án ban hành</label>
                                <input
                                  type="text"
                                  required
                                  value={editingJudgment?.court || ''}
                                  onChange={(e) => setEditingJudgment({ ...editingJudgment!, court: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                  placeholder="Ví dụ: TAND Thành phố Hà Nội..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày ban hành (dd/mm/yyyy)</label>
                                <input
                                  type="text"
                                  required
                                  value={editingJudgment?.date || ''}
                                  onChange={(e) => setEditingJudgment({ ...editingJudgment!, date: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                  placeholder="Ví dụ: 15/05/2026..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại / Lĩnh vực</label>
                                <select
                                  value={editingJudgment?.category || 'Dân sự'}
                                  onChange={(e) => setEditingJudgment({ ...editingJudgment!, category: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                >
                                  <option value="Dân sự">Dân sự</option>
                                  <option value="Hình sự">Hình sự</option>
                                  <option value="Thương mại">Kinh doanh thương mại</option>
                                  <option value="Hôn nhân">Hôn nhân & Gia định</option>
                                  <option value="Đất đai">Đất đai & Nhà ở</option>
                                  <option value="Lao động">Lao động</option>
                                  <option value="Khác">Khác</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Tóm tắt bản án</label>
                              <textarea
                                required
                                rows={2}
                                value={editingJudgment?.summary || ''}
                                onChange={(e) => setEditingJudgment({ ...editingJudgment!, summary: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                placeholder="Tóm tắt khái quát nội dung và kết quả phán quyết..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung bản án chi tiết</label>
                              <textarea
                                required
                                rows={10}
                                value={editingJudgment?.content || ''}
                                onChange={(e) => setEditingJudgment({ ...editingJudgment!, content: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono text-xs leading-relaxed"
                                placeholder="Nhập toàn bộ nội dung phán quyết công bố..."
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => { setEditingJudgment(null); setIsAdding(false); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-semibold"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors text-sm font-semibold"
                              >
                                <Save size={16} /> Lưu thay đổi
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {judgments.map((judgment) => (
                              <div key={judgment.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md font-mono">
                                      {judgment.code}
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                      {judgment.category}
                                    </span>
                                  </div>
                                  <h4 className="font-bold font-serif text-slate-800 text-base mb-2 line-clamp-1">{judgment.title}</h4>
                                  <p className="text-[11px] text-slate-400 font-medium mb-2">🏛️ {judgment.court} • 📅 {judgment.date}</p>
                                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{judgment.summary}</p>
                                </div>
                                {canEditContent && (
                                  <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full">
                                    <button
                                      onClick={() => setEditingJudgment(judgment)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                    >
                                      <Edit2 size={13} /> HIỆU CHỈNH
                                    </button>
                                    <button
                                      onClick={() => handleDeleteJudgment(judgment.id)}
                                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                      title="Xóa bản án"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {judgments.length === 0 && (
                              <div className="col-span-full bg-slate-50 py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm font-semibold">
                                Chưa có bản án nào được cập nhật.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* 3. ÁN LỆ TỐI CAO SECTION */}
                    {toolsSubTab === 'precedents' && (
                      <>
                        {isAdding || editingPrecedent ? (
                          <form onSubmit={handleSavePrecedent} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-800 text-lg mb-4">{editingPrecedent?.id ? 'Hiệu chỉnh Án lệ' : 'Thêm Án lệ mới'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mã án lệ / Tên gọi chính thức</label>
                                <input
                                  type="text"
                                  required
                                  value={editingPrecedent?.code || ''}
                                  onChange={(e) => setEditingPrecedent({ ...editingPrecedent!, code: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: Án lệ số 01/2026/AL..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề án lệ</label>
                                <input
                                  type="text"
                                  required
                                  value={editingPrecedent?.title || ''}
                                  onChange={(e) => setEditingPrecedent({ ...editingPrecedent!, title: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                  placeholder="Ví dụ: Về bồi thường thiệt hại do nguồn nguy hiểm cao độ..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày thông qua (dd/mm/yyyy)</label>
                                <input
                                  type="text"
                                  required
                                  value={editingPrecedent?.approvedDate || editingPrecedent?.approved_date || ''}
                                  onChange={(e) => setEditingPrecedent({ ...editingPrecedent!, approvedDate: e.target.value, approved_date: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                  placeholder="Ví dụ: 24/02/2026..."
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Khái quát nội dung án lệ (Tóm tắt)</label>
                              <textarea
                                required
                                rows={2}
                                value={editingPrecedent?.summary || ''}
                                onChange={(e) => setEditingPrecedent({ ...editingPrecedent!, summary: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                placeholder="Khái quát hoàn cảnh thực tế phát sinh tranh chấp..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Quy định pháp luật liên quan (Tình huống pháp lý)</label>
                              <textarea
                                required
                                rows={3}
                                value={editingPrecedent?.lawIssue || editingPrecedent?.law_issue || ''}
                                onChange={(e) => setEditingPrecedent({ ...editingPrecedent!, lawIssue: e.target.value, law_issue: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                placeholder="Tập hợp các điều khoản luật được viện dẫn giải quyết..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Giải pháp pháp lý (Nội dung án lệ)</label>
                              <textarea
                                required
                                rows={6}
                                value={editingPrecedent?.solution || ''}
                                onChange={(e) => setEditingPrecedent({ ...editingPrecedent!, solution: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-serif leading-relaxed"
                                placeholder="Phán quyết mang tính chuẩn mực làm giải pháp giải quyết tranh chấp tương tự..."
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => { setEditingPrecedent(null); setIsAdding(false); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-semibold"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors text-sm font-semibold"
                              >
                                <Save size={16} /> Lưu thay đổi
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {precedents.map((precedent) => (
                              <div key={precedent.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md font-mono">
                                      {precedent.code}
                                    </span>
                                    <span className="text-slate-400 text-[10px] font-semibold">
                                      📅 {precedent.approvedDate || precedent.approved_date}
                                    </span>
                                  </div>
                                  <h4 className="font-bold font-serif text-slate-800 text-sm mb-2 line-clamp-2 h-10">{precedent.title}</h4>
                                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2 italic"><strong>Vấn đề pháp lý:</strong> {precedent.lawIssue || precedent.law_issue}</p>
                                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4"><strong>Tóm tắt:</strong> {precedent.summary}</p>
                                </div>
                                {canEditContent && (
                                  <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full">
                                    <button
                                      onClick={() => setEditingPrecedent(precedent)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                    >
                                      <Edit2 size={13} /> HIỆU CHỈNH
                                    </button>
                                    <button
                                      onClick={() => handleDeletePrecedent(precedent.id)}
                                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                      title="Xóa án lệ"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {precedents.length === 0 && (
                              <div className="col-span-full bg-slate-50 py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm font-semibold">
                                Chưa có án lệ nào được cập nhật.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* 4. BẢNG GIÁ ĐẤT SECTION */}
                    {toolsSubTab === 'land' && (
                      <>
                        {/* AI Scanner Panel for Land Prices */}
                        {!isAdding && !editingLandPrice && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200/80 shadow-sm mb-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-600 text-white rounded-lg">
                                <Cpu size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-amber-950 text-sm">Quét Văn Bản Quy Định Giá Đất Tự Động (Gemini AI)</h4>
                                <p className="text-amber-800 text-xs font-medium font-sans">Tải văn bản pháp lý / bảng giá đất địa phương (PDF/TXT/Doc) hoặc dán trực tiếp. AI tự động quét và phân tích để thêm dữ liệu.</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Tỉnh / Thành phố áp dụng</label>
                                <select
                                  id="scan-land-province"
                                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                                >
                                  <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                  {PROVINCES_DATA.map(p => (
                                    <option key={p.Code} value={p.FullName}>{p.FullName}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tải lên tệp văn bản (Quyết định / Bảng giá)</label>
                                <input
                                  id="scan-land-file"
                                  type="file"
                                  accept=".pdf,.doc,.docx,.txt"
                                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Hoặc dán nội dung văn bản quyết định giá đất</label>
                              <textarea
                                id="scan-land-text"
                                placeholder="Dán nội dung văn bản quy định giá đất cụ thể của phường/xã/quận/huyện vào đây..."
                                rows={3}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                              />
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                              <button
                                type="button"
                                disabled={isSavingLandDoc || isScanningLand}
                                onClick={() => {
                                  const provinceInput = document.getElementById("scan-land-province") as HTMLInputElement;
                                  const fileInput = document.getElementById("scan-land-file") as HTMLInputElement;
                                  const textInput = document.getElementById("scan-land-text") as HTMLTextAreaElement;
                                  const file = fileInput?.files?.[0] || null;
                                  const text = textInput?.value || "";
                                  handleSaveLandDocument(provinceInput?.value || "", file, text, 'price');
                                }}
                                className={`flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all ${isSavingLandDoc ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isSavingLandDoc ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ĐANG LƯU TÀI LIỆU...
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} /> LƯU TỆP LÀM CSDL ĐỊA PHƯƠNG
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={isScanningLand || isSavingLandDoc}
                                onClick={() => {
                                  const provinceInput = document.getElementById("scan-land-province") as HTMLInputElement;
                                  const fileInput = document.getElementById("scan-land-file") as HTMLInputElement;
                                  const textInput = document.getElementById("scan-land-text") as HTMLTextAreaElement;
                                  const file = fileInput?.files?.[0] || null;
                                  const text = textInput?.value || "";
                                  handleScanLandPrices(provinceInput?.value || "", file, text);
                                }}
                                className={`flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all ${isScanningLand ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isScanningLand ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ĐANG QUÉT & TỰ ĐỘNG LƯU PHÂN TÍCH (AI)...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14} className="animate-pulse" /> BẮT ĐẦU TRÍCH XUẤT VỚI GEMINI AI
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Saved local documents list for Prices */}
                            {landDocuments.filter(d => d.doc_type === 'price').length > 0 && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-3">
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                  📂 TÀI LIỆU CSDL ĐỊA PHƯƠNG ĐÃ LƯU ({landDocuments.filter(d => d.doc_type === 'price').length})
                                </h5>
                                <div className="divide-y divide-slate-200 max-h-40 overflow-y-auto pr-1">
                                  {landDocuments.filter(d => d.doc_type === 'price').map((doc) => (
                                    <div key={doc.id} className="py-2 flex items-center justify-between text-xs gap-4">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                                          {doc.province_name}
                                        </span>
                                        <span className="text-slate-700 font-medium truncate" title={doc.file_name}>
                                          {doc.file_name}
                                        </span>
                                        <span className="text-slate-400 text-[10px] whitespace-nowrap">
                                          ({doc.uploaded_at})
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLandDocument(doc.id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                        title="Xóa tài liệu"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isAdding || editingLandPrice ? (
                          <form onSubmit={handleSaveLandPrice} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-800 text-lg mb-4">{editingLandPrice?.id ? 'Hiệu chỉnh Bảng giá đất' : 'Thêm Bản ghi giá đất mới'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tỉnh / Thành phố</label>
                                <select
                                  value={editingLandPrice?.province_name || ''}
                                  onChange={(e) => {
                                    const name = e.target.value;
                                    const code = PROVINCES_DATA.find(p => p.FullName === name)?.Code || 'HN';
                                    setEditingLandPrice({ 
                                      ...editingLandPrice!, 
                                      province_name: name, 
                                      province_code: code,
                                      ward_name: '' 
                                    });
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold cursor-pointer"
                                  required
                                >
                                  <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                  {PROVINCES_DATA.map(p => (
                                    <option key={p.Code} value={p.FullName}>{p.FullName}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Phường / Xã / Thị trấn</label>
                                <select
                                  value={editingLandPrice?.ward_name || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, ward_name: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold cursor-pointer"
                                  required
                                >
                                  <option value="">-- Chọn Phường/Xã --</option>
                                  {(PROVINCES_DATA.find(p => p.FullName === editingLandPrice?.province_name)?.Wards || []).map(w => (
                                    <option key={w.Code} value={w.FullName}>{w.FullName}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mã Quận / Huyện (Ví dụ: HK, CG, Q1...)</label>
                                <input
                                  type="text"
                                  required
                                  value={editingLandPrice?.district_id || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, district_id: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold font-mono uppercase"
                                  placeholder="Ví dụ: HK, CG, Q1, BT..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Quận / Huyện</label>
                                <input
                                  type="text"
                                  required
                                  value={editingLandPrice?.district_name || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, district_name: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: Quận Hoàn Kiếm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Đường / Phố / Khu vực</label>
                                <input
                                  type="text"
                                  required
                                  value={editingLandPrice?.street_name || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, street_name: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: Phố Đinh Tiên Hoàng"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Đơn giá đất trung bình (VNĐ/m²)</label>
                                <input
                                  type="number"
                                  required
                                  value={editingLandPrice?.price || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, price: Number(e.target.value) || 0 })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: 162000000"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Giá Đất Ở (Ví dụ: 162.0 triệu/m²)</label>
                                <input
                                  type="text"
                                  required
                                  value={editingLandPrice?.residential_price || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, residential_price: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: 162.0 triệu/m²"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Giá Đất Thương Mại Dịch Vụ</label>
                                <input
                                  type="text"
                                  value={editingLandPrice?.commercial_price || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, commercial_price: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: 130.0 triệu/m² (Không bắt buộc)"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Giá Đất Phi Nông Nghiệp</label>
                                <input
                                  type="text"
                                  value={editingLandPrice?.non_agricultural_price || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, non_agricultural_price: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: 110.0 triệu/m² (Không bắt buộc)"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Giá Đất Nông Nghiệp</label>
                                <input
                                  type="text"
                                  value={editingLandPrice?.agricultural_price || ''}
                                  onChange={(e) => setEditingLandPrice({ ...editingLandPrice!, agricultural_price: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: 200 nghìn/m² (Không bắt buộc)"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => { setEditingLandPrice(null); setIsAdding(false); }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                              >
                                HỦY BỎ
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
                              >
                                LƯU THÔNG TIN
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {landPrices.map((item) => (
                              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md font-mono uppercase">
                                      {item.province_code || 'TỈNH'} - {item.district_id || 'HUYỆN'}
                                    </span>
                                    <span className="text-slate-400 text-[10px] font-semibold font-mono">
                                      ID: #{item.id}
                                    </span>
                                  </div>
                                  <h4 className="font-bold font-serif text-slate-800 text-sm mb-2">{item.street_name}</h4>
                                  <p className="text-xs text-slate-500 mb-2"><strong>Khu vực:</strong> {item.ward_name ? `${item.ward_name}, ` : ''}{item.district_name}, {item.province_name}</p>
                                  
                                  <div className="space-y-1.5 border-t border-slate-100 pt-2.5 mt-2.5 text-xs font-medium">
                                    <div className="flex justify-between text-slate-500">
                                      <span>Đơn giá chuẩn:</span>
                                      <span className="text-slate-900 font-bold font-mono">{Number(item.price).toLocaleString('vi-VN')} đ/m²</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                      <span>Giá đất ở:</span>
                                      <span className="text-emerald-700 font-bold font-mono">{item.residential_price || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                      <span>Giá thương mại:</span>
                                      <span className="text-slate-700 font-bold font-mono">{item.commercial_price || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                      <span>Phi nông nghiệp:</span>
                                      <span className="text-slate-700 font-bold font-mono">{item.non_agricultural_price || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                      <span>Đất nông nghiệp:</span>
                                      <span className="text-amber-700 font-bold font-mono">{item.agricultural_price || 'Chưa cập nhật'}</span>
                                    </div>
                                  </div>
                                </div>
                                {canEditContent && (
                                  <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full">
                                    <button
                                      onClick={() => setEditingLandPrice(item)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                    >
                                      <Edit2 size={13} /> HIỆU CHỈNH
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLandPrice(item.id)}
                                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                      title="Xóa giá đất"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {landPrices.length === 0 && (
                              <div className="col-span-full bg-slate-50 py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm font-semibold">
                                Chưa có thông tin giá đất nào được cập nhật.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* 5. TÁCH THỬA & ĐẤT Ở SECTION */}
                    {toolsSubTab === 'subdivision' && (
                      <>
                        {/* AI Scanner Panel for Subdivision Limits */}
                        {!isAdding && !editingSubdivisionLimit && (
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200/80 shadow-sm mb-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                <Cpu size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-indigo-950 text-sm">Quét Văn Bản Hạn Mức Tách Thửa & Giao Đất Ở Tự Động (Gemini AI)</h4>
                                <p className="text-indigo-800 text-xs font-medium font-sans">Tải lên quyết định hạn mức đất ở, tách thửa tối thiểu (PDF/TXT/Doc) hoặc dán văn bản trực tiếp. AI tự động trích xuất các quy định.</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Tỉnh / Thành phố áp dụng</label>
                                <select
                                  id="scan-sub-province"
                                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                                >
                                  <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                  {PROVINCES_DATA.map(p => (
                                    <option key={p.Code} value={p.FullName}>{p.FullName}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tải lên văn bản pháp lý (Quyết định UBND tỉnh)</label>
                                <input
                                  id="scan-sub-file"
                                  type="file"
                                  accept=".pdf,.doc,.docx,.txt"
                                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Hoặc dán nội dung văn bản quyết định tách thửa</label>
                              <textarea
                                id="scan-sub-text"
                                placeholder="Dán nội dung văn bản quy định tách thửa hoặc hạn mức công nhận đất ở của tỉnh/thành phố vào đây..."
                                rows={3}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                              />
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                              <button
                                type="button"
                                disabled={isSavingLandDoc || isScanningSubdivision}
                                onClick={() => {
                                  const provinceInput = document.getElementById("scan-sub-province") as HTMLInputElement;
                                  const fileInput = document.getElementById("scan-sub-file") as HTMLInputElement;
                                  const textInput = document.getElementById("scan-sub-text") as HTMLTextAreaElement;
                                  const file = fileInput?.files?.[0] || null;
                                  const text = textInput?.value || "";
                                  handleSaveLandDocument(provinceInput?.value || "", file, text, 'subdivision');
                                }}
                                className={`flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all ${isSavingLandDoc ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isSavingLandDoc ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ĐANG LƯU TÀI LIỆU...
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} /> LƯU TỆP LÀM CSDL ĐỊA PHƯƠNG
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={isScanningSubdivision || isSavingLandDoc}
                                onClick={() => {
                                  const provinceInput = document.getElementById("scan-sub-province") as HTMLInputElement;
                                  const fileInput = document.getElementById("scan-sub-file") as HTMLInputElement;
                                  const textInput = document.getElementById("scan-sub-text") as HTMLTextAreaElement;
                                  const file = fileInput?.files?.[0] || null;
                                  const text = textInput?.value || "";
                                  handleScanSubdivisionLimits(provinceInput?.value || "", file, text);
                                }}
                                className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all ${isScanningSubdivision ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isScanningSubdivision ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ĐANG QUÉT & TỰ ĐỘNG LƯU QUY ĐỊNH (AI)...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14} className="animate-pulse" /> BẮT ĐẦU TRÍCH XUẤT VỚI GEMINI AI
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Saved local documents list for Subdivision Limits */}
                            {landDocuments.filter(d => d.doc_type === 'subdivision').length > 0 && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-3">
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                  📂 TÀI LIỆU CSDL ĐỊA PHƯƠNG ĐÃ LƯU ({landDocuments.filter(d => d.doc_type === 'subdivision').length})
                                </h5>
                                <div className="divide-y divide-slate-200 max-h-40 overflow-y-auto pr-1">
                                  {landDocuments.filter(d => d.doc_type === 'subdivision').map((doc) => (
                                    <div key={doc.id} className="py-2 flex items-center justify-between text-xs gap-4">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                                          {doc.province_name}
                                        </span>
                                        <span className="text-slate-700 font-medium truncate" title={doc.file_name}>
                                          {doc.file_name}
                                        </span>
                                        <span className="text-slate-400 text-[10px] whitespace-nowrap">
                                          ({doc.uploaded_at})
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLandDocument(doc.id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                        title="Xóa tài liệu"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isAdding || editingSubdivisionLimit ? (
                          <form onSubmit={handleSaveSubdivisionLimit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-800 text-lg mb-4">{editingSubdivisionLimit?.id ? 'Hiệu chỉnh Quy định tách thửa' : 'Thêm Quy định tách thửa mới'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tỉnh / Thành phố áp dụng</label>
                                <select
                                  value={editingSubdivisionLimit?.province_name || ''}
                                  onChange={(e) => {
                                    setEditingSubdivisionLimit({ 
                                      ...editingSubdivisionLimit!, 
                                      province_name: e.target.value,
                                      ward_name: ''
                                    });
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold cursor-pointer"
                                  required
                                >
                                  <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                  {PROVINCES_DATA.map(p => (
                                    <option key={p.Code} value={p.FullName}>{p.FullName}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Phường / Xã / Thị trấn áp dụng</label>
                                <select
                                  value={editingSubdivisionLimit?.ward_name || ''}
                                  onChange={(e) => setEditingSubdivisionLimit({ ...editingSubdivisionLimit!, ward_name: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold cursor-pointer"
                                  required
                                >
                                  <option value="">-- Chọn Phường/Xã --</option>
                                  {(PROVINCES_DATA.find(p => p.FullName === editingSubdivisionLimit?.province_name)?.Wards || []).map(w => (
                                    <option key={w.Code} value={w.FullName}>{w.FullName}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Quận / Huyện</label>
                                <input
                                  type="text"
                                  required
                                  value={editingSubdivisionLimit?.district_name || ''}
                                  onChange={(e) => setEditingSubdivisionLimit({ ...editingSubdivisionLimit!, district_name: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: Quận Hoàn Kiếm, hoặc Huyện Gia Lâm..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Quy định diện tích tối thiểu được phép tách thửa</label>
                                <input
                                  type="text"
                                  required
                                  value={editingSubdivisionLimit?.subdivision_area || ''}
                                  onChange={(e) => setEditingSubdivisionLimit({ ...editingSubdivisionLimit!, subdivision_area: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: Tối thiểu 30 m² và chiều rộng mặt tiền >= 3m"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Hạn mức đất ở / Diện tích đất ở tối đa hoặc hạn mức giao</label>
                                <input
                                  type="text"
                                  required
                                  value={editingSubdivisionLimit?.residential_limit || ''}
                                  onChange={(e) => setEditingSubdivisionLimit({ ...editingSubdivisionLimit!, residential_limit: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm font-semibold"
                                  placeholder="Ví dụ: Hạn mức công nhận tối đa 120 m²"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => { setEditingSubdivisionLimit(null); setIsAdding(false); }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                              >
                                HỦY BỎ
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
                              >
                                LƯU QUY ĐỊNH
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subdivisionLimits.map((item) => (
                              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start mb-3">
                                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-md font-sans uppercase">
                                      {item.province_name}
                                    </span>
                                    <span className="text-slate-400 text-[10px] font-semibold font-mono">
                                      ID: #{item.id}
                                    </span>
                                  </div>
                                  <h4 className="font-bold font-serif text-slate-800 text-sm mb-1">{item.district_name}</h4>
                                  <p className="text-xs text-slate-500 mb-3"><strong>Khu vực:</strong> {item.ward_name ? `${item.ward_name}, ` : ''}{item.district_name}, {item.province_name}</p>
                                  
                                  <div className="space-y-1.5 border-t border-slate-100 py-3 my-3">
                                    <div className="flex flex-col text-xs font-semibold gap-1">
                                      <span className="text-slate-500">Diện tích tách thửa tối thiểu:</span>
                                      <span className="text-slate-800 font-sans">{item.subdivision_area || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className="flex flex-col text-xs font-semibold gap-1 pt-2 border-t border-dashed border-slate-100">
                                      <span className="text-slate-500">Hạn mức công nhận giao đất ở:</span>
                                      <span className="text-amber-700 font-sans">{item.residential_limit || 'Chưa cập nhật'}</span>
                                    </div>
                                  </div>

                                  {item.note && (
                                    <p className="text-xs text-slate-500 italic line-clamp-2 mt-2 leading-relaxed">
                                      <strong>Ghi chú:</strong> {item.note}
                                    </p>
                                  )}
                                </div>
                                {canEditContent && (
                                  <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full">
                                    <button
                                      onClick={() => setEditingSubdivisionLimit(item)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                    >
                                      <Edit2 size={13} /> HIỆU CHỈNH
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubdivisionLimit(item.id)}
                                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                      title="Xóa quy định"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            {subdivisionLimits.length === 0 && (
                              <div className="col-span-full bg-slate-50 py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm font-semibold">
                                Chưa có thông tin quy định tách thửa nào được cập nhật.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}


                  </div>
                )}

                {/* Testimonials / Clients Tab (Đối tác và Khách hàng) */}
                {activeTab === 'clients' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 font-serif">Đánh giá từ Đối tác & Khách hàng</h3>
                        <p className="text-slate-500 text-xs mt-1 font-medium font-sans">Quản lý các nhận xét, chia sẻ và đánh giá chất lượng dịch vụ từ các doanh nghiệp đối tác và cá nhân</p>
                      </div>
                      
                      {!isAdding && !editingTestimonial && canEditContent && (
                        <button
                          onClick={() => {
                            setIsAdding(true);
                            setEditingTestimonial({ id: 0, name: '', role: '', company: '', rating: 5, content: '', avatar: '' });
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors text-sm font-semibold shadow-sm shrink-0 self-start sm:self-center"
                        >
                          <Plus size={16} /> Đăng nhận xét mới
                        </button>
                      )}
                    </div>

                    {isAdding || editingTestimonial ? (
                      <form onSubmit={handleSaveTestimonial} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-bold text-slate-800 text-lg mb-4">{editingTestimonial?.id ? 'Hiệu chỉnh đánh giá' : 'Thêm nhận xét / đánh giá mới'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Tên khách hàng / Đối tác</label>
                            <input
                              type="text"
                              required
                              value={editingTestimonial?.name || ''}
                              onChange={(e) => setEditingTestimonial({ ...editingTestimonial!, name: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                              placeholder="Ví dụ: Ông Lê Ánh Dương..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Chức vụ / Vị trí</label>
                            <input
                              type="text"
                              required
                              value={editingTestimonial?.role || ''}
                              onChange={(e) => setEditingTestimonial({ ...editingTestimonial!, role: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                              placeholder="Ví dụ: Giám đốc Điều hành..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Tên công ty / Doanh nghiệp</label>
                            <input
                              type="text"
                              value={editingTestimonial?.company || ''}
                              onChange={(e) => setEditingTestimonial({ ...editingTestimonial!, company: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                              placeholder="Ví dụ: Công ty TNHH Ánh Dương (không bắt buộc)..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Đánh giá xếp hạng (Số sao)</label>
                            <select
                              value={editingTestimonial?.rating || 5}
                              onChange={(e) => setEditingTestimonial({ ...editingTestimonial!, rating: Number(e.target.value) })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                            >
                              <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                              <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                              <option value="3">⭐⭐⭐ (3 sao)</option>
                              <option value="2">⭐⭐ (2 sao)</option>
                              <option value="1">⭐ (1 sao)</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh đại diện / Logo doanh nghiệp (URL)</label>
                            <input
                              type="text"
                              value={editingTestimonial?.avatar || ''}
                              onChange={(e) => setEditingTestimonial({ ...editingTestimonial!, avatar: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                              placeholder="Ví dụ: https://images.unsplash.com/... hoặc để trống để sử dụng avatar mặc định"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung đánh giá, chia sẻ</label>
                          <textarea
                            required
                            rows={4}
                            value={editingTestimonial?.content || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial!, content: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                            placeholder="Nhập nội dung chia sẻ thực tế từ khách hàng..."
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => { setEditingTestimonial(null); setIsAdding(false); }}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-semibold"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors text-sm font-semibold"
                          >
                            <Save size={16} /> Lưu thay đổi
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map((t) => (
                          <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-2 right-4 text-slate-100 pointer-events-none font-serif text-8xl font-bold">“</div>
                            <div className="relative z-10">
                              <div className="flex gap-0.5 text-amber-400 mb-3">
                                {Array.from({ length: Number(t.rating || 5) }).map((_, idx) => (
                                  <span key={idx} className="text-sm">★</span>
                                ))}
                              </div>
                              <p className="text-slate-600 text-xs italic leading-relaxed mb-4 line-clamp-4">"{t.content}"</p>
                              <div className="flex items-center gap-3">
                                <img
                                  src={t.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=60&w=150&auto=format&fit=crop'}
                                  alt={t.name}
                                  className="w-10 h-10 object-cover rounded-full border border-slate-100"
                                />
                                <div>
                                  <h5 className="font-bold text-xs text-slate-800">{t.name}</h5>
                                  <p className="text-[10px] text-slate-500 font-medium">{t.role} {t.company ? `• ${t.company}` : ''}</p>
                                </div>
                              </div>
                            </div>
                            {canEditContent && (
                              <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full relative z-10">
                                <button
                                  onClick={() => setEditingTestimonial(t)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                >
                                  <Edit2 size={13} /> HIỆU CHỈNH
                                </button>
                                <button
                                  onClick={() => handleDeleteTestimonial(t.id)}
                                  className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                  title="Xóa nhận xét"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {testimonials.length === 0 && (
                          <div className="col-span-full bg-slate-50 py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-sm font-semibold">
                            Chưa có nhận xét hay đánh giá nào từ khách hàng được đăng tải.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Services Tab (Lĩnh Vực Hoạt Động) */}
                {activeTab === 'services' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-[var(--color-text-dark)]">Danh sách lĩnh vực hoạt động</h3>
                        {!isAdding && !editingService && canEditContent && (
                          <button
                            onClick={() => {
                              setEditingService({ id: 0, title: '', description: '', icon: 'Leaf' });
                              setIsAdding(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                          >
                            <Plus size={18} /> Thêm mới
                          </button>
                        )}
                      </div>

                      {(isAdding || editingService) ? (
                        <form onSubmit={handleSaveService} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                          <h4 className="font-bold text-lg mb-4">{isAdding ? 'Thêm lĩnh vực mới' : 'Chỉnh sửa lĩnh vực'}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tên lĩnh vực</label>
                              <div className="relative">
                                <Type className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                  type="text"
                                  required
                                  value={editingService?.title || ''}
                                  onChange={(e) => setEditingService({ ...editingService!, title: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Lucide Name)</label>
                              <select
                                value={editingService?.icon || 'Leaf'}
                                onChange={(e) => setEditingService({ ...editingService!, icon: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              >
                                <option value="Leaf">Leaf (Môi trường/ATTP)</option>
                                <option value="Globe">Globe (Du lịch/Đầu tư)</option>
                                <option value="Building2">Building2 (BĐS/Doanh nghiệp)</option>
                                <option value="Briefcase">Briefcase (Lao động/Kinh doanh)</option>
                                <option value="Gavel">Gavel (Tranh tụng/Hình sự)</option>
                                <option value="Scale">Scale (Sở hữu trí tuệ/Khác)</option>
                                <option value="Shield">Shield (Bảo mật)</option>
                                <option value="Users">Users (Nhân sự/Dân sự)</option>
                                <option value="Heart">Heart (Hôn nhân gia đình)</option>
                                <option value="FileText">FileText (Hợp đồng/Hành chính)</option>
                              </select>
                            </div>
                          </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                              <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                  required
                                  rows={2}
                                  value={editingService?.description || ''}
                                  onChange={(e) => setEditingService({ ...editingService!, description: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                ></textarea>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                              <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                  rows={5}
                                  value={editingService?.content || ''}
                                  onChange={(e) => setEditingService({ ...editingService!, content: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                  placeholder="Nhập nội dung chi tiết bài viết..."
                                ></textarea>
                              </div>
                            </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tài liệu đính kèm</label>
                            <div className="space-y-2">
                                <input 
                                    type="file" 
                                    onChange={handleServiceFileUpload}
                                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-light)]"
                                />
                                {editingService?.file_name && (
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <span>File hiện tại: <strong>{editingService.file_name}</strong></span>
                                        <button 
                                            type="button"
                                            onClick={() => setEditingService({...editingService, file_url: '', file_name: ''})}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => { setEditingService(null); setIsAdding(false); }}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                            >
                              <Save size={18} /> Lưu thay đổi
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {services.map((service) => (
                            <div key={service.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)]">
                                  <span className="font-bold">{service.icon}</span>
                                </div>
                                <h4 className="font-bold text-[var(--color-text-dark)] mb-2">{service.title}</h4>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{service.description}</p>
                                {service.file_name && (
                                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mt-auto">
                                    <FileText size={14} />
                                    <span className="truncate max-w-[200px]">{service.file_name}</span>
                                  </div>
                                )}
                              </div>
                              {canEditContent && (
                                <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full">
                                  <button
                                    onClick={() => setEditingService(service)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                  >
                                    <Edit2 size={13} /> HIỆU CHỈNH
                                  </button>
                                  <button
                                    onClick={() => service.id && handleDeleteService(service.id)}
                                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                    title="Xóa lĩnh vực"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legal Services Tab (Dịch Vụ) */}
                  {activeTab === 'legal_services' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[var(--color-text-dark)]">Danh sách dịch vụ</h3>
                        {!isAdding && !editingLegalService && canEditContent && (
                          <button
                            onClick={() => {
                              setEditingLegalService({ id: 0, title: '', description: '', icon: 'Leaf' });
                              setIsAdding(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                          >
                            <Plus size={18} /> Thêm mới
                          </button>
                        )}
                      </div>

                      {!isAdding && !editingLegalService && (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="Tìm kiếm dịch vụ..."
                            value={legalServiceSearch}
                            onChange={(e) => setLegalServiceSearch(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                          />
                          {legalServiceSearch && (
                            <button
                              onClick={() => setLegalServiceSearch('')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      )}

                      {(isAdding || editingLegalService) ? (
                        <form onSubmit={handleSaveLegalService} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                          <h4 className="font-bold text-lg mb-4">{isAdding ? 'Thêm dịch vụ mới' : 'Chỉnh sửa dịch vụ'}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tên dịch vụ</label>
                              <div className="relative">
                                <Type className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                  type="text"
                                  required
                                  value={editingLegalService?.title || ''}
                                  onChange={(e) => setEditingLegalService({ ...editingLegalService!, title: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Lucide Name)</label>
                              <select
                                value={editingLegalService?.icon || 'Leaf'}
                                onChange={(e) => setEditingLegalService({ ...editingLegalService!, icon: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              >
                                <option value="Leaf">Leaf (Môi trường/ATTP)</option>
                                <option value="Globe">Globe (Du lịch/Đầu tư)</option>
                                <option value="Building2">Building2 (BĐS/Doanh nghiệp)</option>
                                <option value="Briefcase">Briefcase (Lao động/Kinh doanh)</option>
                                <option value="Gavel">Gavel (Tranh tụng/Hình sự)</option>
                                <option value="Scale">Scale (Sở hữu trí tuệ/Khác)</option>
                                <option value="Shield">Shield (Bảo mật)</option>
                                <option value="Users">Users (Nhân sự/Dân sự)</option>
                                <option value="Heart">Heart (Hôn nhân gia đình)</option>
                                <option value="FileText">FileText (Hợp đồng/Hành chính)</option>
                              </select>
                            </div>
                          </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                              <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                  required
                                  rows={2}
                                  value={editingLegalService?.description || ''}
                                  onChange={(e) => setEditingLegalService({ ...editingLegalService!, description: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                ></textarea>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                              <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                  rows={5}
                                  value={editingLegalService?.content || ''}
                                  onChange={(e) => setEditingLegalService({ ...editingLegalService!, content: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                  placeholder="Nhập nội dung chi tiết bài viết..."
                                ></textarea>
                              </div>
                            </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tài liệu đính kèm</label>
                            <div className="space-y-2">
                                <input 
                                    type="file" 
                                    onChange={handleLegalServiceFileUpload}
                                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-light)]"
                                />
                                {editingLegalService?.file_name && (
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <span>File hiện tại: <strong>{editingLegalService.file_name}</strong></span>
                                        <button 
                                            type="button"
                                            onClick={() => setEditingLegalService({...editingLegalService, file_url: '', file_name: ''})}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => { setIsAdding(false); }}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                            >
                              <Save size={18} /> Lưu thay đổi
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {legalServices
                            .filter(service => 
                              (service.title || '').toLowerCase().includes(legalServiceSearch.toLowerCase()) || 
                              (service.description || '').toLowerCase().includes(legalServiceSearch.toLowerCase())
                            )
                            .map((service) => (
                            <div key={service.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)]">
                                  <span className="font-bold">{service.icon}</span>
                                </div>
                                <h4 className="font-bold text-[var(--color-text-dark)] mb-2">{service.title}</h4>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{service.description}</p>
                                {service.file_name && (
                                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mt-auto">
                                    <FileText size={14} />
                                    <span className="truncate max-w-[200px]">{service.file_name}</span>
                                  </div>
                                )}
                              </div>
                              {canEditContent && (
                                <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full">
                                  <button
                                    onClick={() => setEditingLegalService(service)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                  >
                                    <Edit2 size={13} /> HIỆU CHỈNH
                                  </button>
                                  <button
                                    onClick={() => service.id && handleDeleteLegalService(service.id)}
                                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                    title="Xóa dịch vụ"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* News Tab (Tin tức và sự kiện) */}
                  {activeTab === 'news' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[var(--color-text-dark)]">Danh sách tin tức và sự kiện</h3>
                        {!isAdding && !editingNews && canEditContent && (
                          <button
                            onClick={() => {
                              setEditingNews({ id: 0, title: '', description: '', icon: 'FileText', category: 'TIN TỨC', related_service: '' });
                              setIsAdding(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                          >
                            <Plus size={18} /> Thêm mới
                          </button>
                        )}
                      </div>

                      {(isAdding || editingNews) ? (
                        <form onSubmit={handleSaveNews} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                          <div className="flex items-center justify-between border-b pb-3 mb-2">
                            <h4 className="font-bold text-lg">{isAdding ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết'}</h4>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNews({
                                    ...editingNews,
                                    title: '🎂 CHÚC MỪNG SINH NHẬT THÀNH VIÊN ÁNH DƯƠNG LAW',
                                    category: 'CHÚC MỪNG SINH NHẬT',
                                    description: 'Công ty Luật TNHH Ánh Dương xin gửi lời chúc mừng sinh nhật chân thành và ấm áp nhất đến thành viên thân yêu!',
                                    content: '🎉 Nhân dịp sinh nhật, Đại gia đình Ánh Dương Law xin kính chúc Anh/Chị tuổi mới thật nhiều Sức khỏe - Hạnh phúc - Thành công rực rỡ và luôn giữ vững ngọn lửa nhiệt huyết với nghề Luật!\n\nCảm ơn Anh/Chị đã luôn đồng hành, cống hiến và gắn bó cùng sự phát triển vững mạnh của Công ty. Chúc Anh/Chị có một ngày sinh nhật thật ý nghĩa bên gia đình, đồng nghiệp và người thân!',
                                    icon: 'Heart',
                                    file_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop',
                                    file_name: 'sinhnhat.jpg'
                                  });
                                }}
                                className="px-3 py-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-lg text-xs font-bold border border-pink-200 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                🎂 Mẫu Bài Đăng Sinh Nhật
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNews({
                                    ...editingNews,
                                    title: '📸 HOẠT ĐỘNG NỘI BỘ & TEAM BUILDING ÁNH DƯƠNG LAW',
                                    category: 'HOẠT ĐỘNG NỘI BỘ',
                                    description: 'Cùng nhìn lại những khoảnh khắc đáng nhớ và không khí sôi nổi trong chuỗi hoạt động nội bộ vừa qua.',
                                    content: '📸 Nhằm gắn kết tinh thần đồng đội và tái tạo năng lượng làm việc, Ánh Dương Law đã tổ chức thành công chương trình Hoạt động Nội bộ & Team Building.\n\nSự kiện diễn ra tràn ngập tiếng cười, tinh thần đoàn kết và sự sáng tạo nhiệt huyết của toàn thể Luật sư, Chuyên viên và Chuyên gia. Đây là dịp để tất cả thành viên hiểu nhau hơn và cùng hướng tới những mục tiêu bứt phá tiếp theo!',
                                    icon: 'Users',
                                    file_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop',
                                    file_name: 'teambuilding.jpg'
                                  });
                                }}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                📸 Mẫu Hoạt Động Nội Bộ
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề bài viết</label>
                              <div className="relative">
                                <Type className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                  type="text"
                                  required
                                  value={editingNews?.title || ''}
                                  onChange={(e) => setEditingNews({ ...editingNews!, title: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục chung</label>
                                  <select
                                    value={editingNews?.category || 'TIN TỨC'}
                                    onChange={(e) => {
                                      setEditingNews({ ...editingNews!, category: e.target.value, related_service: '' })
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-medium text-sm"
                                  >
                                    <option value="TIN TỨC">TIN TỨC</option>
                                    <option value="SỰ KIỆN">SỰ KIỆN</option>
                                    <option value="THÔNG BÁO">THÔNG BÁO</option>
                                    <option value="TRUYỀN THÔNG">TRUYỀN THÔNG</option>
                                    <option value="CHÚC MỪNG SINH NHẬT">🎂 CHÚC MỪNG SINH NHẬT</option>
                                    <option value="HOẠT ĐỘNG NỘI BỘ">📸 HOẠT ĐỘNG NỘI BỘ</option>
                                    <option value="Lĩnh vực hoạt động">Lĩnh vực hoạt động</option>
                                    <option value="Dịch vụ">Dịch vụ</option>
                                  </select>
                                </div>
                                {(editingNews?.category === 'Lĩnh vực hoạt động' || editingNews?.category === 'Dịch vụ') && (
                                  <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chi tiết {editingNews?.category?.toLowerCase()}</label>
                                    <select
                                      value={editingNews?.related_service || ''}
                                      onChange={(e) => setEditingNews({ ...editingNews!, related_service: e.target.value })}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    >
                                      <option value="">-- Chọn nội dung --</option>
                                      {editingNews?.category === 'Lĩnh vực hoạt động' && services.map(s => (
                                        <option key={`service-${s.id}`} value={s.title}>{s.title}</option>
                                      ))}
                                      {editingNews?.category === 'Dịch vụ' && legalServices.map(l => (
                                        <option key={`legal-${l.id}`} value={l.title}>{l.title}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Lucide Name)</label>
                              <select
                                value={editingNews?.icon || 'FileText'}
                                onChange={(e) => setEditingNews({ ...editingNews!, icon: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              >
                                <option value="FileText">FileText (Tin tức)</option>
                                <option value="BookOpen">BookOpen (Tài liệu)</option>
                                <option value="MessageCircle">MessageCircle (Tư vấn)</option>
                                <option value="Megaphone">Megaphone (Thông báo)</option>
                                <option value="Radio">Radio (Truyền thông)</option>
                                <option value="Calendar">Calendar (Sự kiện)</option>
                                <option value="Award">Award (Thành tựu)</option>
                                <option value="Star">Star (Nổi bật)</option>
                                <option value="Globe">Globe (Quốc tế/Du lịch)</option>
                                <option value="Briefcase">Briefcase (Công việc)</option>
                                <option value="Users">Users (Nhân sự/Nội bộ)</option>
                                <option value="Building2">Building2 (Doanh nghiệp)</option>
                                <option value="Leaf">Leaf (Môi trường)</option>
                                <option value="Gavel">Gavel (Pháp lý)</option>
                                <option value="Shield">Shield (Bảo mật)</option>
                                <option value="Heart">Heart (Sinh nhật/Đời sống)</option>
                              </select>
                            </div>
                          </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                              <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                  required
                                  rows={2}
                                  value={editingNews?.description || ''}
                                  onChange={(e) => setEditingNews({ ...editingNews!, description: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                ></textarea>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                              <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                  rows={5}
                                  value={editingNews?.content || ''}
                                  onChange={(e) => setEditingNews({ ...editingNews!, content: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                  placeholder="Nhập nội dung chi tiết bài viết..."
                                ></textarea>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh đính kèm / Đại diện</label>
                                <div className="space-y-2">
                                    <input 
                                        type="file" 
                                        onChange={handleNewsFileUpload}
                                        accept="image/*"
                                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-light)]"
                                    />
                                    {editingNews?.file_url && (
                                        <div className="mt-2">
                                            <img src={editingNews.file_url} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                <span>File hiện tại: <strong>{editingNews.file_name}</strong></span>
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditingNews({...editingNews, file_url: '', file_name: ''})}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video đính kèm (URL YouTube / MP4)</label>
                                <input
                                  type="text"
                                  value={editingNews?.video_url || ''}
                                  onChange={(e) => setEditingNews({ ...editingNews!, video_url: e.target.value })}
                                  placeholder="Ví dụ: https://www.youtube.com/watch?v=... hoặc link video MP4"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm"
                                />
                                <span className="text-xs text-gray-400 mt-1 block">Tùy chọn: Nhập liên kết video cho bài chúc mừng sinh nhật hoặc hoạt động nội bộ</span>
                              </div>
                            </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => { setEditingNews(null); setIsAdding(false); }}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                            >
                              <Save size={18} /> Lưu thay đổi
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-fit overflow-x-auto gap-1">
                            <button
                                onClick={() => { setAdminNewsFilter('ALL'); setAdminNewsSubFilter('ALL'); }}
                                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    adminNewsFilter === 'ALL'
                                    ? 'bg-white text-[var(--color-text-dark)] shadow-sm'
                                    : 'text-gray-600 hover:text-[var(--color-text-dark)] hover:bg-gray-200'
                                }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => { setAdminNewsFilter('TIN_TUC_CHUNG'); setAdminNewsSubFilter('ALL'); }}
                                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    adminNewsFilter === 'TIN_TUC_CHUNG'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-[var(--color-text-dark)] hover:bg-gray-200'
                                }`}
                            >
                                Tin tức chung
                            </button>
                            <button
                                onClick={() => { setAdminNewsFilter('CHUC_MUNG_SINH_NHAT'); setAdminNewsSubFilter('ALL'); }}
                                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    adminNewsFilter === 'CHUC_MUNG_SINH_NHAT'
                                    ? 'bg-white text-pink-600 shadow-sm'
                                    : 'text-gray-600 hover:text-[var(--color-text-dark)] hover:bg-gray-200'
                                }`}
                            >
                                🎂 Sinh nhật
                            </button>
                            <button
                                onClick={() => { setAdminNewsFilter('HOAT_DONG_NOI_BO'); setAdminNewsSubFilter('ALL'); }}
                                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    adminNewsFilter === 'HOAT_DONG_NOI_BO'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-[var(--color-text-dark)] hover:bg-gray-200'
                                }`}
                            >
                                📸 Nội bộ
                            </button>
                            <button
                                onClick={() => { setAdminNewsFilter('LINH_VUC_HOAT_DONG'); setAdminNewsSubFilter('ALL'); }}
                                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    adminNewsFilter === 'LINH_VUC_HOAT_DONG'
                                    ? 'bg-white text-[var(--color-primary)] shadow-sm'
                                    : 'text-gray-600 hover:text-[var(--color-text-dark)] hover:bg-gray-200'
                                }`}
                            >
                                Lĩnh vực hoạt động
                            </button>
                            <button
                                onClick={() => { setAdminNewsFilter('DICH_VU_PHAP_LY'); setAdminNewsSubFilter('ALL'); }}
                                className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    adminNewsFilter === 'DICH_VU_PHAP_LY'
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-[var(--color-text-dark)] hover:bg-gray-200'
                                }`}
                            >
                                Dịch vụ
                            </button>
                          </div>
                          
                          

<div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                                  <th className="p-4 font-medium w-24">Hình ảnh</th>
                                  <th className="p-4 font-medium">Tiêu đề & Mô tả</th>
                                  <th className="p-4 font-medium w-64">
                                    {adminNewsFilter === 'ALL' ? 'Phân loại' : (
                                       adminNewsFilter === 'TIN_TUC_CHUNG' ? (
                                         <select 
                                            value={adminNewsSubFilter} 
                                            onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white w-full font-medium"
                                        >
                                            <option value="ALL">Phân loại: TẤT CẢ DỮ LIỆU</option>
                                            <option value="TIN TỨC">TIN TỨC</option>
                                            <option value="SỰ KIỆN">SỰ KIỆN</option>
                                            <option value="THÔNG BÁO">THÔNG BÁO</option>
                                            <option value="TRUYỀN THÔNG">TRUYỀN THÔNG</option>
                                        </select>
                                       ) : adminNewsFilter === 'LINH_VUC_HOAT_DONG' ? (
                                         <select 
                                            value={adminNewsSubFilter} 
                                            onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary)] bg-white w-full font-medium"
                                        >
                                            <option value="ALL">Phân loại: TẤT CẢ DỮ LIỆU</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.title}>{s.title}</option>
                                            ))}
                                        </select>
                                       ) : (
                                        <select 
                                            value={adminNewsSubFilter} 
                                            onChange={(e) => setAdminNewsSubFilter(e.target.value)}
                                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500 bg-white w-full font-medium"
                                        >
                                            <option value="ALL">Phân loại: TẤT CẢ DỮ LIỆU</option>
                                            {legalServices.map(ls => (
                                                <option key={ls.id} value={ls.title}>{ls.title}</option>
                                            ))}
                                        </select>
                                       )
                                    )}
                                  </th>
                                  {canEditContent && <th className="p-4 font-medium text-right w-24">Thao tác</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {news.filter(item => {
                                  // Update logic for ALL view so it renders based on ALL drop down.  Wait, ALL doesn't have a dropdown.

                                  if (adminNewsFilter === 'ALL') {
                                      return true;
                                  }

                                  if (adminNewsFilter === 'TIN_TUC_CHUNG') {
                                      if (['Lĩnh vực hoạt động', 'Dịch vụ', 'CHÚC MỪNG SINH NHẬT', 'HOẠT ĐỘNG NỘI BỘ'].includes(item.category || '')) return false;
                                      if (adminNewsSubFilter !== 'ALL' && item.category !== adminNewsSubFilter) return false;
                                      return true;
                                  }
                                  if (adminNewsFilter === 'CHUC_MUNG_SINH_NHAT') {
                                      return item.category === 'CHÚC MỪNG SINH NHẬT';
                                  }
                                  if (adminNewsFilter === 'HOAT_DONG_NOI_BO') {
                                      return item.category === 'HOẠT ĐỘNG NỘI BỘ';
                                  }
                                  if (adminNewsFilter === 'LINH_VUC_HOAT_DONG') {
                                      if (item.category !== 'Lĩnh vực hoạt động') return false;
                                      if (adminNewsSubFilter !== 'ALL' && item.related_service !== adminNewsSubFilter) return false;
                                      return true;
                                  }
                                  if (adminNewsFilter === 'DICH_VU_PHAP_LY') {
                                      if (item.category !== 'Dịch vụ') return false;
                                      if (adminNewsSubFilter !== 'ALL' && item.related_service !== adminNewsSubFilter) return false;
                                      return true;
                                  }
                                  return true;

                                }).map((item) => (
                                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 align-top">
                                      {item.file_url ? (
                                        <img src={item.file_url} alt={item.title} className="w-16 h-16 object-cover rounded-full border border-gray-200" />
                                      ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                          <FileText size={24} />
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-4 align-top">
                                      <h4 className="font-bold text-[var(--color-text-dark)] text-sm mb-1 line-clamp-2">{item.title}</h4>
                                      <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                                    </td>
                                    <td className="p-4 align-top">
                                      <div className="flex flex-col items-start gap-1">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                                          {item.category || 'TIN TỨC'}
                                        </span>
                                        {item.related_service && (
                                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium truncate max-w-[180px]" title={item.related_service}>
                                            🔗 {item.related_service}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    {canEditContent && (
                                      <td className="p-4 align-top text-right">
                                        <div className="flex justify-end items-center gap-2">
                                          <button
                                            onClick={() => setEditingNews(item)}
                                            className="flex items-center gap-1.5 py-1.5 px-3 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-lg transition-colors"
                                          >
                                            <Edit2 size={13} /> HIỆU CHỈNH
                                          </button>
                                          <button
                                            onClick={() => item.id && handleDeleteNews(item.id)}
                                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                            title="Xóa tin tức"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {news.length === 0 && (
                              <div className="p-8 text-center text-gray-600">
                                Chưa có bài viết nào
                              </div>
                            )}
                          </div>
                        </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recruitment Tab (Tuyển dụng) */}
                  {activeTab === 'recruitment' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-[var(--color-text-dark)]">Quản lý Tuyển Dụng</h3>
                          <p className="text-xs text-gray-500 mt-1">Cập nhật tin tuyển dụng, chế độ đãi ngộ và quy trình phỏng vấn</p>
                        </div>
                        {!isAdding && !editingRecruitment && !editingBenefit && !editingProcessStep && canEditContent && (
                          <button
                            onClick={() => {
                              setIsAdding(true);
                              if (recruitmentSubTab === 'positions') {
                                setEditingRecruitment({ id: 0, title: '', location: 'Hà Nội', type: 'Toàn thời gian', salary: '', description: '', content: '' });
                              } else if (recruitmentSubTab === 'benefits') {
                                setEditingBenefit({ title: '', description: '', icon: 'Coins' });
                              } else {
                                setEditingProcessStep({ step: (recruitmentProcess.length + 1).toString().padStart(2, '0'), title: '', description: '' });
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors self-end md:self-auto"
                          >
                            <Plus size={18} /> Thêm mới
                          </button>
                        )}
                      </div>

                      {/* Sub Tabs switcher inside Recruitment section */}
                      <div className="flex border-b border-gray-200 gap-6">
                        <button
                          onClick={() => { setRecruitmentSubTab('positions'); setIsAdding(false); setEditingRecruitment(null); setEditingBenefit(null); setEditingProcessStep(null); }}
                          className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                            recruitmentSubTab === 'positions'
                              ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Tin tuyển dụng ({recruitment.length})
                        </button>
                        <button
                          onClick={() => { setRecruitmentSubTab('benefits'); setIsAdding(false); setEditingRecruitment(null); setEditingBenefit(null); setEditingProcessStep(null); }}
                          className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                            recruitmentSubTab === 'benefits'
                              ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Chế độ đãi ngộ ({recruitmentBenefits.length})
                        </button>
                        <button
                          onClick={() => { setRecruitmentSubTab('process'); setIsAdding(false); setEditingRecruitment(null); setEditingBenefit(null); setEditingProcessStep(null); }}
                          className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                            recruitmentSubTab === 'process'
                              ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Quy trình tuyển dụng ({recruitmentProcess.length})
                        </button>
                      </div>

                      {/* 1. POSITIONS SECTION */}
                      {recruitmentSubTab === 'positions' && (
                        <>
                          {(isAdding || editingRecruitment) ? (
                            <form onSubmit={handleSaveRecruitment} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                              <h4 className="font-bold text-lg mb-4">{isAdding ? 'Thêm tin tuyển dụng mới' : 'Chỉnh sửa tin tuyển dụng'}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí tuyển dụng</label>
                                  <div className="relative">
                                    <Type className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <select
                                      required
                                      value={editingRecruitment?.title || ''}
                                      onChange={(e) => setEditingRecruitment({ ...editingRecruitment!, title: e.target.value })}
                                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none appearance-none bg-white"
                                    >
                                      <option value="">Chọn vị trí tuyển dụng</option>
                                      {SYSTEM_TITLES.map((title, index) => (
                                        <option key={index} value={title}>{title}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm làm việc</label>
                                  <select
                                    value={editingRecruitment?.location || 'Hà Nội'}
                                    onChange={(e) => setEditingRecruitment({ ...editingRecruitment!, location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                                  >
                                    <option value="Hà Nội">Hà Nội</option>
                                    <option value="Đà Nẵng">Đà Nẵng</option>
                                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại hình công việc</label>
                                  <select
                                    value={editingRecruitment?.type || 'Toàn thời gian'}
                                    onChange={(e) => setEditingRecruitment({ ...editingRecruitment!, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                                  >
                                    <option value="Toàn thời gian">Toàn thời gian</option>
                                    <option value="Bán thời gian">Bán thời gian</option>
                                    <option value="Thực tập">Thực tập</option>
                                    <option value="Cộng tác viên">Cộng tác viên</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Mức lương</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingRecruitment?.salary || ''}
                                    onChange={(e) => setEditingRecruitment({ ...editingRecruitment!, salary: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="Ví dụ: Thỏa thuận"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                                <div className="relative">
                                  <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                                  <textarea
                                    required
                                    rows={2}
                                    value={editingRecruitment?.description || ''}
                                    onChange={(e) => setEditingRecruitment({ ...editingRecruitment!, description: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="Nhập mô tả ngắn về công việc..."
                                  ></textarea>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chi tiết công việc & Yêu cầu</label>
                                <div className="relative">
                                  <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                                  <textarea
                                    rows={8}
                                    value={editingRecruitment?.content || ''}
                                    onChange={(e) => setEditingRecruitment({ ...editingRecruitment!, content: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="Nhập chi tiết công việc, yêu cầu, quyền lợi (hỗ trợ định dạng Markdown)..."
                                  ></textarea>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tài liệu đính kèm (JD)</label>
                                <div className="space-y-2">
                                  <input 
                                    type="file" 
                                    onChange={handleRecruitmentFileUpload}
                                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-primary-light)]"
                                  />
                                  {editingRecruitment?.file_name && (
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                      <span>File hiện tại: <strong>{editingRecruitment.file_name}</strong></span>
                                      <button 
                                        type="button"
                                        onClick={() => setEditingRecruitment({...editingRecruitment!, file_url: '', file_name: ''})}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end gap-3 pt-4">
                                <button
                                  type="button"
                                  onClick={() => { setEditingRecruitment(null); setIsAdding(false); }}
                                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  Hủy bỏ
                                </button>
                                <button
                                  type="submit"
                                  className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                                >
                                  <Save size={18} /> Lưu thay đổi
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {recruitment.map((job) => (
                                <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-lg uppercase">
                                        {job.type}
                                      </span>
                                      <span className="text-xs text-gray-600">{job.location}</span>
                                    </div>
                                    <h4 className="font-bold text-[var(--color-text-dark)] mb-2">{job.title}</h4>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{job.description}</p>
                                    <p className="text-xs text-gray-600 mb-2">Lương: <span className="font-semibold text-green-600 font-mono">{job.salary}</span></p>
                                    {job.file_name && (
                                      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mt-auto">
                                        <FileText size={14} />
                                        <span className="truncate max-w-[200px]">{job.file_name}</span>
                                      </div>
                                    )}
                                  </div>
                                  {canEditContent && (
                                    <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between gap-3 w-full">
                                      <button
                                        onClick={() => setEditingRecruitment(job)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                      >
                                        <Edit2 size={13} /> HIỆU CHỈNH
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRecruitment(job.id)}
                                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                        title="Xóa tin tuyển dụng"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {recruitment.length === 0 && (
                                <div className="col-span-full bg-white p-8 rounded-lg border border-dashed border-gray-200 text-center text-gray-500">
                                  Chưa có tin tuyển dụng nào được đăng.
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* 2. BENEFITS SECTION */}
                      {recruitmentSubTab === 'benefits' && (
                        <>
                          {(isAdding || editingBenefit) ? (
                            <form onSubmit={handleSaveBenefit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                              <h4 className="font-bold text-lg mb-4">{isAdding ? 'Thêm đãi ngộ mới' : 'Chỉnh sửa đãi ngộ'}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề đãi ngộ</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingBenefit?.title || ''}
                                    onChange={(e) => setEditingBenefit({ ...editingBenefit!, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="Ví dụ: Lương Thưởng Vượt Trội"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Biểu tượng (Icon)</label>
                                  <select
                                    value={editingBenefit?.icon || 'Coins'}
                                    onChange={(e) => setEditingBenefit({ ...editingBenefit!, icon: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white"
                                  >
                                    <option value="Coins">Coins (Lương thưởng)</option>
                                    <option value="TrendingUp">TrendingUp (Thăng tiến)</option>
                                    <option value="BookOpen">BookOpen (Đào tạo)</option>
                                    <option value="Heart">Heart (Phúc lợi)</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả đãi ngộ</label>
                                <textarea
                                  required
                                  rows={4}
                                  value={editingBenefit?.description || ''}
                                  onChange={(e) => setEditingBenefit({ ...editingBenefit!, description: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                  placeholder="Nhập mô tả cụ thể về đãi ngộ, chế độ làm việc..."
                                ></textarea>
                              </div>
                              <div className="flex justify-end gap-3 pt-4">
                                <button
                                  type="button"
                                  onClick={() => { setEditingBenefit(null); setIsAdding(false); }}
                                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  Hủy bỏ
                                </button>
                                <button
                                  type="submit"
                                  className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                                >
                                  <Save size={18} /> Lưu đãi ngộ
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {recruitmentBenefits.map((b) => (
                                <div key={b.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                                        Icon: {b.icon}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-[var(--color-text-dark)] mb-2">{b.title}</h4>
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-2">{b.description}</p>
                                  </div>
                                  {canEditContent && (
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                      <button
                                        onClick={() => setEditingBenefit(b)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Edit2 size={18} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteBenefit(b.id!)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {recruitmentBenefits.length === 0 && (
                                <div className="col-span-full bg-white p-8 rounded-lg border border-dashed border-gray-200 text-center text-gray-500">
                                  Chưa có chế độ đãi ngộ nào được thiết lập.
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* 3. PROCESS SECTION */}
                      {recruitmentSubTab === 'process' && (
                        <>
                          {(isAdding || editingProcessStep) ? (
                            <form onSubmit={handleSaveProcessStep} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                              <h4 className="font-bold text-lg mb-4">{isAdding ? 'Thêm bước quy trình mới' : 'Chỉnh sửa bước quy trình'}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã bước (Ví dụ: 01, 02)</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingProcessStep?.step || ''}
                                    onChange={(e) => setEditingProcessStep({ ...editingProcessStep!, step: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="Ví dụ: 01"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên bước</label>
                                  <input
                                    type="text"
                                    required
                                    value={editingProcessStep?.title || ''}
                                    onChange={(e) => setEditingProcessStep({ ...editingProcessStep!, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    placeholder="Ví dụ: Phỏng vấn chuyên sâu"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả quy trình</label>
                                <textarea
                                  required
                                  rows={4}
                                  value={editingProcessStep?.description || ''}
                                  onChange={(e) => setEditingProcessStep({ ...editingProcessStep!, description: e.target.value })}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                  placeholder="Nhập mô tả chi tiết quy trình thực hiện ở bước này..."
                                ></textarea>
                              </div>
                              <div className="flex justify-end gap-3 pt-4">
                                <button
                                  type="button"
                                  onClick={() => { setEditingProcessStep(null); setIsAdding(false); }}
                                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  Hủy bỏ
                                </button>
                                <button
                                  type="submit"
                                  className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                                >
                                  <Save size={18} /> Lưu bước quy trình
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {recruitmentProcess.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                                        Bước {item.step}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-[var(--color-text-dark)] mb-2">{item.title}</h4>
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-2">{item.description}</p>
                                  </div>
                                  {canEditContent && (
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                      <button
                                        onClick={() => setEditingProcessStep(item)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Edit2 size={18} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProcessStep(item.id!)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {recruitmentProcess.length === 0 && (
                                <div className="col-span-full bg-white p-8 rounded-lg border border-dashed border-gray-200 text-center text-gray-500">
                                  Chưa có bước quy trình nào được thiết lập.
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Team Tab */}
                  {activeTab === 'team' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="text-2xl font-serif font-bold text-slate-900">
                            {(isAdding || editingTeam) ? (isAdding ? 'Thêm thành viên mới' : 'Hiệu chỉnh nội dung chi tiết') : 'Danh sách thành viên'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {(isAdding || editingTeam) ? 'Nhập thông tin chi tiết và lưu hồ sơ chuyên môn' : 'Quản lý thông tin hồ sơ và danh sách hội đồng luật sư'}
                          </p>
                        </div>
                        
                        {(isAdding || editingTeam) ? (
                          <button
                            type="button"
                            onClick={() => { setEditingTeam(null); setIsAdding(false); }}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
                          >
                            <X size={14} /> HỦY BỎ
                          </button>
                        ) : (
                          canEditContent && (
                            <button
                              onClick={() => {
                                setEditingTeam({ id: 0, name: '', title: '', description: '', image: '', email: '', phone: '', specialties: '', degrees: '' });
                                setIsAdding(true);
                              }}
                              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold text-sm shadow-sm"
                            >
                              <Plus size={16} /> Thêm mới
                            </button>
                          )
                        )}
                      </div>

                      {(isAdding || editingTeam) ? (
                        <form onSubmit={handleSaveTeam} className="bg-white p-8 rounded-2xl border border-gray-150 shadow-sm space-y-6 max-w-4xl">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">HỌ VÀ TÊN LUẬT SƯ</label>
                              <input
                                type="text"
                                required
                                placeholder="VD: Luật sư Lê Ánh Dương"
                                value={editingTeam?.name || ''}
                                onChange={(e) => setEditingTeam({ ...editingTeam!, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">CHỨC VỤ / HỌC VỊ</label>
                              <select
                                required
                                value={editingTeam?.title || ''}
                                onChange={(e) => setEditingTeam({ ...editingTeam!, title: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-850 bg-white"
                              >
                                <option value="">Chọn chức vụ hệ thống...</option>
                                {SYSTEM_TITLES.map((title, index) => (
                                  <option key={index} value={title}>{title}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">EMAIL LIÊN HỆ</label>
                              <input
                                type="email"
                                placeholder="VD: duong.le@anhduonglaw.vn"
                                value={editingTeam?.email || ''}
                                onChange={(e) => setEditingTeam({ ...editingTeam!, email: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">SỐ ĐIỆN THOẠI DI ĐỘNG</label>
                              <input
                                type="text"
                                placeholder="VD: 0988.123.456"
                                value={editingTeam?.phone || ''}
                                onChange={(e) => setEditingTeam({ ...editingTeam!, phone: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">ĐƯỜNG DẪN ẢNH CHÂN DUNG CHUYÊN NGHIỆP</label>
                            <div className="space-y-3">
                              <input
                                type="text"
                                required
                                value={editingTeam?.image || ''}
                                onChange={(e) => setEditingTeam({ ...editingTeam!, image: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800"
                                placeholder="https://... hoặc tải ảnh lên"
                              />
                              
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 font-medium">Hoặc tải tệp lên từ thiết bị:</span>
                                <label className="cursor-pointer px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-gray-200">
                                  <span>Chọn tệp ảnh</span>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>

                              {editingTeam?.image && (
                                <div className="mt-3 flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-gray-150 w-fit">
                                  <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                    <img src={editingTeam.image} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">✔ Đã liên kết ảnh</span>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{editingTeam.image}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">MÔ TẢ TIỂU SỬ TÓM TẮT</label>
                            <textarea
                              value={editingTeam?.description || ''}
                              onChange={(e) => setEditingTeam({ ...editingTeam!, description: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800 min-h-[100px]"
                              placeholder="Nhập châm ngôn hoặc tóm tắt tiểu sử luật sư..."
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">CHUYÊN MÔN CHÍNH (PHÂN TÁCH BẰNG DẤU PHẨY)</label>
                            <input
                              type="text"
                              placeholder="VD: Tư vấn M&A, Đầu tư nước ngoài (FDI), Bản quyền công nghệ"
                              value={editingTeam?.specialties || ''}
                              onChange={(e) => setEditingTeam({ ...editingTeam!, specialties: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">HỌC VỊ & BẰNG CẤP DANH GIÁ (MỖI DÒNG MỘT VĂN BẰNG)</label>
                            <textarea
                              value={editingTeam?.degrees || ''}
                              onChange={(e) => setEditingTeam({ ...editingTeam!, degrees: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800 min-h-[100px]"
                              placeholder="VD: Thạc sĩ Luật chuyên ngành Luật Kinh tế quốc tế - Đại học Paris 1 Panthéon-Sorbonne (Pháp)&#10;Cử nhân Luật chất lượng cao - Đại học Luật Hà Nội"
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => { setEditingTeam(null); setIsAdding(false); }}
                              className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                            >
                              Đóng
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-2 px-8 py-2.5 bg-[#c2a278]/25 hover:bg-[#c2a278]/40 text-[#5c4018] font-bold rounded-xl shadow-sm transition-colors text-sm"
                            >
                              <Save size={16} /> LƯU THÔNG TIN
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-6">
                          {canEditContent && (
                            <div className="bg-amber-50/40 border border-amber-200/50 p-5 rounded-2xl">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Edit2 className="text-amber-700" size={16} />
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Chỉnh sửa tiêu đề & Mô tả phần Đội Ngũ</h4>
                                    <p className="text-xs text-slate-500">Cập nhật subtitle, title (dùng **để tô vàng**) và mô tả hiển thị ở trang chủ</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingTeamHeader(!isEditingTeamHeader)}
                                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs rounded-lg transition-colors"
                                >
                                  {isEditingTeamHeader ? 'Thu gọn' : 'Chỉnh sửa'}
                                </button>
                              </div>
                              
                              {isEditingTeamHeader && (
                                <div className="mt-4 space-y-4 bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Subtitle (Tiêu đề nhỏ)</label>
                                      <input
                                        type="text"
                                        value={teamHeaderSettings.team_subtitle}
                                        onChange={(e) => setTeamHeaderSettings({...teamHeaderSettings, team_subtitle: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm text-slate-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Title (Tiêu đề chính - Dùng **để tô vàng**)</label>
                                      <input
                                        type="text"
                                        value={teamHeaderSettings.team_title}
                                        onChange={(e) => setTeamHeaderSettings({...teamHeaderSettings, team_title: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm text-slate-800"
                                        placeholder="Đội Ngũ **Luật Sư Cộng Sự** Cấp Cao"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description (Mô tả chi tiết)</label>
                                    <textarea
                                      value={teamHeaderSettings.team_description}
                                      onChange={(e) => setTeamHeaderSettings({...teamHeaderSettings, team_description: e.target.value})}
                                      rows={3}
                                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm text-slate-800"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      disabled={isSavingTeamHeader}
                                      onClick={handleSaveTeamHeader}
                                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                                    >
                                      {isSavingTeamHeader ? 'Đang lưu...' : 'Lưu tiêu đề'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {team.map((member) => {
                              const specialtyList = member.specialties 
                                ? member.specialties.split(',').map(s => s.trim()).filter(Boolean)
                                : [];
                              
                              return (
                                <div 
                                  key={member.id} 
                                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                                  id={`member-admin-card-${member.id}`}
                                >
                                  <div>
                                    <div className="flex items-start gap-4">
                                      <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-150 shrink-0">
                                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="font-serif font-bold text-lg text-slate-900 truncate leading-snug">{member.name}</h4>
                                        <p className="text-[10px] font-bold text-[#0e3b32] uppercase tracking-wider mt-1 truncate">{member.title}</p>
                                        {member.email && (
                                          <span className="text-xs text-slate-400 mt-1 block truncate font-medium">{member.email}</span>
                                        )}
                                      </div>
                                    </div>

                                    {member.description && (
                                      <p className="text-slate-500 italic text-xs leading-relaxed mt-4 line-clamp-2">
                                        &ldquo;{member.description}&rdquo;
                                      </p>
                                    )}

                                    {specialtyList.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-4">
                                        {specialtyList.map((spec, idx) => (
                                          <span 
                                            key={idx}
                                            className="bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded"
                                          >
                                            {spec}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {canEditContent && (
                                    <div className="border-t border-gray-100 pt-4 mt-5 flex items-center justify-between gap-3">
                                      <button
                                        onClick={() => setEditingTeam(member)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#f5eae1] hover:bg-[#ebd8c8] text-[#8c6239] text-xs font-bold rounded-xl transition-colors"
                                      >
                                        <Edit2 size={13} /> HIỆU CHỈNH
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTeam(member.id)}
                                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                        title="Xóa thành viên"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Messages Tab */}
                  {activeTab === 'messages' && (
                    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
                      
                      <div className="flex border-b border-gray-200 p-2 gap-2 bg-gray-50/50">
                        <button 
                          onClick={() => setActiveMessageTab('live')}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeMessageTab === 'live' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                          Danh sách Chat Trực tuyến
                        </button>
                        <button 
                          onClick={() => setActiveMessageTab('form')}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${activeMessageTab === 'form' ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                          Yêu cầu từ Form Liên hệ
                          {formMessages.filter(m => !m.is_read).length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-lg">{formMessages.filter(m => !m.is_read).length}</span>
                          )}
                        </button>
                      </div>

                    {activeMessageTab === 'live' ? (
                      <div className="h-[600px] flex bg-white">
                        {/* Threads List Sidebar */}
                        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
                          <div className="p-4 border-b border-gray-200 bg-white">
                            <h3 className="font-bold text-[var(--color-text-dark)]">Danh sách Chat</h3>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {messages.map((thread: any) => (
                              <div 
                                key={thread.visitor_id}
                                onClick={() => setActiveVisitorId(thread.visitor_id)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${activeVisitorId === thread.visitor_id ? 'bg-[var(--color-primary)] text-white shadow-md' : 'bg-white border border-gray-100 hover:border-blue-300 hover:shadow-sm'}`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-semibold text-sm truncate flex-1">Khách: {thread.visitor_id.substring(0,8)}</span>
                                  {thread.unread_count > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg ml-2 shrink-0">
                                      {thread.unread_count} mới
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs truncate ${activeVisitorId === thread.visitor_id ? 'text-gray-100' : 'text-gray-600'} ${thread.unread_count > 0 ? 'font-bold' : ''}`}>
                                  {thread.last_sender === 'admin' ? 'Bạn: ' : ''}{thread.last_message || 'File đính kèm'}
                                </p>
                                <div className={`text-[10px] mt-2 text-right ${activeVisitorId === thread.visitor_id ? 'text-gray-200' : 'text-gray-400'}`}>
                                  {new Date(thread.last_message_time).toLocaleString('vi-VN')}
                                </div>
                              </div>
                            ))}
                            {messages.length === 0 && (
                              <div className="text-center p-4 text-gray-600 text-sm">Chưa có cuộc trò chuyện nào</div>
                            )}
                          </div>
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 flex flex-col bg-slate-50">
                        {activeVisitorId ? (
                           <>
                             <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10 flex justify-between items-center shrink-0">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                   KH
                                 </div>
                                 <div>
                                   <h4 className="font-bold text-[var(--color-text-dark)]">Khách: {activeVisitorId.substring(0,8)}</h4>
                                   <span className="text-xs text-green-500 flex items-center gap-1">
                                     <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Đang trực tuyến
                                   </span>
                                 </div>
                               </div>
                             </div>

                             <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                               {visitorMessages.map((msg, i) => {
                                 const isAdmin = msg.sender_type === 'admin';
                                 return (
                                   <div key={i} className={`flex max-w-[70%] ${isAdmin ? 'self-end' : 'self-start'}`}>
                                     {!isAdmin && (
                                       <div className="w-8 h-8 rounded-full bg-blue-500 shrink-0 flex items-center justify-center text-white mr-2 mt-auto text-xs font-bold shadow-sm">
                                         KH
                                       </div>
                                     )}
                                     <div className={`flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                                       <div 
                                         className={`px-4 py-2.5 text-sm shadow-sm ${
                                           isAdmin 
                                             ? 'bg-[var(--color-primary)] text-white rounded-lg rounded-lg' 
                                             : 'bg-white text-[var(--color-text-dark)] rounded-lg rounded-lg border border-gray-100'
                                         }`}
                                       >
                                         {msg.content}
                                         {(msg.file_url || msg.fileUrl) && (
                                           <a 
                                             href={msg.file_url || msg.fileUrl} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             className={`mt-2 flex items-center gap-2 p-2 rounded-lg ${isAdmin ? 'bg-black/10' : 'bg-gray-50 border border-gray-100'} hover:opacity-80 transition-opacity`}
                                           >
                                             {(msg.file_url || msg.fileUrl).match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                               <img src={msg.file_url || msg.fileUrl} alt="attachment" className="max-w-[250px] rounded-lg object-cover cursor-pointer" />
                                             ) : (
                                               <>
                                                <FileText size={16} />
                                                <span className="text-sm truncate max-w-[200px] font-medium">{msg.file_name || msg.fileName || 'Tệp đính kèm'}</span>
                                               </>
                                             )}
                                           </a>
                                         )}
                                       </div>
                                       <span className="text-[10px] text-gray-400 px-1 font-medium select-none">
                                         {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                     </div>
                                   </div>
                                 )
                               })}
                               <div ref={visitorEndRef} />
                             </div>

                             <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                               <div className="flex items-end gap-2 bg-gray-50 rounded-lg border border-gray-200 p-2 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all">
                                 <button 
                                   onClick={() => adminFileInputRef.current?.click()}
                                   disabled={isUploadingObj}
                                   className="p-2.5 text-gray-600 hover:text-[var(--color-primary)] hover:bg-white rounded-lg transition-colors shrink-0"
                                   title="Đính kèm tệp"
                                 >
                                   <Paperclip size={20} />
                                 </button>
                                 <input 
                                   type="file" 
                                   ref={adminFileInputRef} 
                                   className="hidden" 
                                   onChange={handleAdminFileUpload}
                                 />
                                 
                                 <textarea 
                                   value={adminInput}
                                   onChange={(e) => setAdminInput(e.target.value)}
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter' && !e.shiftKey) {
                                       e.preventDefault();
                                       sendAdminMessage();
                                     }
                                   }}
                                   placeholder={isUploadingObj ? "Đang tải tệp lên..." : "Nhập phản hồi cho khách hàng..."}
                                   className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-sm py-3 px-2 placeholder:text-gray-400"
                                   rows={Math.min(4, adminInput.split('\n').length || 1)}
                                   disabled={isUploadingObj}
                                 />
                                 
                                 <button 
                                   onClick={sendAdminMessage}
                                   disabled={(!adminInput.trim() && !isUploadingObj) || isUploadingObj}
                                   className="p-2.5 bg-[var(--color-primary)] text-white gap-2 rounded-lg hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50 shrink-0 shadow-sm flex items-center font-medium"
                                   title="Gửi tin nhắn"
                                 >
                                   <Send size={18} /> Gửi
                                 </button>
                               </div>
                             </div>
                           </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <MessageSquare size={64} className="text-gray-300" />
                            <p>Chọn một cuộc trò chuyện để bắt đầu phản hồi</p>
                          </div>
                        )}
                      </div>
                    </div>
                    ) : (
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar h-[600px] bg-white">
                        <div className="mb-4">
                          <h3 className="font-bold text-[var(--color-text-dark)] text-lg">Danh sách Yêu cầu từ Form Liên hệ</h3>
                          <p className="text-sm text-gray-600">Các tin nhắn được gửi từ biểu mẫu ngoài trang web.</p>
                        </div>
                        {formMessages.length === 0 ? (
                          <div className="text-center p-8 text-gray-600 border border-dashed border-gray-200 rounded-lg">Chưa có yêu cầu tư vấn nào</div>
                        ) : (
                          <div className="space-y-4">
                            {formMessages.map((msg: any) => (
                              <div key={msg.id} className={`p-4 border rounded-lg overflow-hidden shadow-sm transition-all ${msg.is_read ? 'bg-gray-50 border-gray-100' : 'bg-white border-blue-200 ring-1 ring-blue-50'}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">
                                      {msg.name?.substring(0, 2).toUpperCase() || 'KH'}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-[var(--color-text-dark)] flex items-center gap-2">
                                        {msg.name}
                                        {!msg.is_read && <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">Mới</span>}
                                      </h4>
                                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                        <span className="flex items-center gap-1"><Phone size={12}/> {msg.phone}</span>
                                        {msg.email && <span className="flex items-center gap-1"><Mail size={12}/> {msg.email}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400 flex flex-col items-end gap-2">
                                    {new Date(msg.created_at).toLocaleString('vi-VN')}
                                    {!msg.is_read && (
                                      <button 
                                        onClick={async () => {
                                          await fetchApi(`/api/messages/${msg.id}`, {
                                            method: 'PUT',
                                            headers: {'Content-Type': 'application/json'},
                                            body: JSON.stringify({ is_read: true })
                                          });
                                          // Refresh data
                                          const t = Date.now();
                                          const formMsgsRes = await fetchApi(`/api/messages?t=${t}`);
                                          if (formMsgsRes.ok) setFormMessages(await formMsgsRes.json());
                                          fetchData();
                                        }}
                                        className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded-lg"
                                      >
                                        Đánh dấu đã đọc
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap border border-gray-100 mt-2">
                                  {msg.content}
                                  {msg.file_url && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-2 rounded border border-gray-100">
                                        <FileText size={16} className="text-blue-500" />
                                        <span className="font-medium max-w-xs truncate">{msg.file_name || 'Tài liệu đính kèm'}</span>
                                      </div>
                                      <a
                                        href={msg.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded transition flex items-center gap-1"
                                      >
                                        Xem tài liệu
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  )}

                  {/* Dashboard Overview Tab */}
                  {activeTab === 'dashboard_overview' && (
                    <DashboardOverview
                      user={user}
                      language={language}
                    />
                  )}

                  {/* Stats Tab */}
                  {activeTab === 'stats' && (
                    <div className="space-y-8">
                      {/* Top Header & Range Controls */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div>
                          <h3 className="text-xl font-bold text-[var(--color-text-dark)] flex items-center gap-2">
                            <BarChart3 className="text-[var(--color-primary)]" size={24} />
                            Thống kê Truy cập Website & Hiệu suất Dịch vụ Pháp lý
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Phân tích lưu lượng truy cập hàng ngày của khách hàng và hiệu quả của các dịch vụ pháp lý
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-auto bg-gray-100 p-1.5 rounded-lg text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setStatsRange('7d')}
                            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${statsRange === '7d' ? 'bg-white text-[var(--color-primary)] shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                          >
                            7 Ngày
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatsRange('14d')}
                            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${statsRange === '14d' ? 'bg-white text-[var(--color-primary)] shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                          >
                            14 Ngày
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatsRange('30d')}
                            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${statsRange === '30d' ? 'bg-white text-[var(--color-primary)] shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                          >
                            30 Ngày
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatsRange('all')}
                            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${statsRange === 'all' ? 'bg-white text-[var(--color-primary)] shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
                          >
                            Tất cả
                          </button>
                        </div>
                      </div>

                      {/* Summary KPI Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách truy cập (Visitors)</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                              <UserPlus size={18} />
                            </div>
                          </div>
                          <div className="text-3xl font-extrabold text-gray-900">
                            {filteredChartData.length > 0 ? filteredChartData.reduce((acc: number, d: any) => acc + (d.visitors || 0), 0).toLocaleString() : 0}
                          </div>
                          <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                            <TrendingUp size={14} /> Tăng trưởng +18.4% so với kỳ trước
                          </div>
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lượt xem trang (Page Views)</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                              <Eye size={18} />
                            </div>
                          </div>
                          <div className="text-3xl font-extrabold text-gray-900">
                            {filteredChartData.length > 0 ? filteredChartData.reduce((acc: number, d: any) => acc + (d.page_views || 0), 0).toLocaleString() : 0}
                          </div>
                          <div className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                            <TrendingUp size={14} /> Trung bình {filteredChartData.length > 0 ? Math.round(filteredChartData.reduce((acc: number, d: any) => acc + (d.page_views || 0), 0) / filteredChartData.length) : 0} lượt/ngày
                          </div>
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Yêu cầu tư vấn (Chats)</span>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <MessageSquare size={18} />
                            </div>
                          </div>
                          <div className="text-3xl font-extrabold text-indigo-600">
                            {filteredChartData.length > 0 ? filteredChartData.reduce((acc: number, d: any) => acc + (d.chats || 0), 0).toLocaleString() : 0}
                          </div>
                          <div className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Tỷ lệ chuyển đổi ~12.5%
                          </div>
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Doanh thu Dịch vụ Pháp lý</span>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                              <Scale size={18} />
                            </div>
                          </div>
                          <div className="text-2xl font-extrabold text-gray-900">
                            {(legalPerfData.reduce((acc: number, item: any) => acc + (item.revenue || 0), 0) / 1000000000).toFixed(2)} Tỷ VNĐ
                          </div>
                          <div className="text-xs text-amber-600 font-medium mt-2 flex items-center gap-1">
                            <Award size={14} /> {legalPerfData.reduce((acc: number, item: any) => acc + (item.casesCount || 0), 0)} Vụ việc / Hồ sơ
                          </div>
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                        </div>
                      </div>

                      {/* Chart 1: Biểu đồ Lượt truy cập & Tương tác Khách hàng hàng ngày */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <div>
                            <h4 className="font-bold text-lg text-[var(--color-text-dark)] flex items-center gap-2">
                              <TrendingUp className="text-[var(--color-primary)]" size={20} />
                              Lưu Lượng Khách Hàng Truy Cập Website Hàng Ngày
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">Theo dõi số lượt xem trang, khách truy cập độc nhất và lượt gửi yêu cầu tư vấn</p>
                          </div>

                          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
                            <button
                              type="button"
                              onClick={() => setWebsiteChartType('area')}
                              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${websiteChartType === 'area' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500'}`}
                            >
                              Biểu đồ Miền
                            </button>
                            <button
                              type="button"
                              onClick={() => setWebsiteChartType('line')}
                              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${websiteChartType === 'line' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500'}`}
                            >
                              Biểu đồ Đường
                            </button>
                            <button
                              type="button"
                              onClick={() => setWebsiteChartType('bar')}
                              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${websiteChartType === 'bar' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500'}`}
                            >
                              Biểu đồ Cột
                            </button>
                          </div>
                        </div>

                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            {websiteChartType === 'area' ? (
                              <AreaChart data={filteredChartData}>
                                <defs>
                                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#64748b'}} tickMargin={8} minTickGap={20} />
                                <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                                <Area type="monotone" name="Lượt xem trang (Page Views)" dataKey="page_views" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPageViews)" />
                                <Area type="monotone" name="Khách truy cập độc nhất (Visitors)" dataKey="visitors" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisitors)" />
                                <Area type="monotone" name="Yêu cầu tư vấn (Chats)" dataKey="chats" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorChats)" />
                              </AreaChart>
                            ) : websiteChartType === 'line' ? (
                              <LineChart data={filteredChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#64748b'}} tickMargin={8} minTickGap={20} />
                                <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                                <Line type="monotone" name="Lượt xem trang (Page Views)" dataKey="page_views" stroke="#3b82f6" strokeWidth={3} dot={{r: 3}} activeDot={{r: 6}} />
                                <Line type="monotone" name="Khách truy cập độc nhất (Visitors)" dataKey="visitors" stroke="#10b981" strokeWidth={3} dot={{r: 3}} activeDot={{r: 6}} />
                                <Line type="monotone" name="Yêu cầu tư vấn (Chats)" dataKey="chats" stroke="#f43f5e" strokeWidth={3} dot={{r: 3}} activeDot={{r: 6}} />
                              </LineChart>
                            ) : (
                              <BarChart data={filteredChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#64748b'}} tickMargin={8} minTickGap={20} />
                                <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                                <Bar name="Lượt xem trang" dataKey="page_views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar name="Khách truy cập" dataKey="visitors" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar name="Yêu cầu tư vấn" dataKey="chats" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Chart 2 & 3: Hiệu Suất Các Dịch Vụ Pháp Lý */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart - So sánh Số vụ việc & Doanh thu các Dịch vụ */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                              <h4 className="font-bold text-lg text-[var(--color-text-dark)] flex items-center gap-2">
                                <Briefcase className="text-[var(--color-primary)]" size={20} />
                                Đánh Giá Hiệu Suất Các Dịch Vụ Pháp Lý
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">So sánh khối lượng hồ sơ, doanh thu và tỷ lệ chuyển đổi tư vấn thành công</p>
                            </div>

                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
                              <button
                                type="button"
                                onClick={() => setServiceChartMetric('cases')}
                                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${serviceChartMetric === 'cases' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500'}`}
                              >
                                Số vụ việc
                              </button>
                              <button
                                type="button"
                                onClick={() => setServiceChartMetric('revenue')}
                                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${serviceChartMetric === 'revenue' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500'}`}
                              >
                                Doanh thu (Tr VNĐ)
                              </button>
                              <button
                                type="button"
                                onClick={() => setServiceChartMetric('conversion')}
                                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${serviceChartMetric === 'conversion' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500'}`}
                              >
                                Tỷ lệ chốt (%)
                              </button>
                            </div>
                          </div>

                          <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={legalPerfData.map((item: any) => ({
                                ...item,
                                revenueInMillions: Math.round(item.revenue / 1000000)
                              }))} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis 
                                  dataKey="name" 
                                  tick={{fontSize: 10, fill: '#64748b'}} 
                                  interval={0}
                                  angle={-15}
                                  textAnchor="end"
                                />
                                <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <RechartsTooltip 
                                  formatter={(value: any, name: any) => {
                                    if (name.includes('Doanh thu')) return [`${value.toLocaleString()} Triệu VNĐ`, 'Doanh Thu'];
                                    if (name.includes('Tỷ lệ')) return [`${value}%`, 'Tỷ Lệ Chuyển Đổi'];
                                    return [`${value} Hồ sơ`, 'Số Vụ Việc'];
                                  }}
                                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                {serviceChartMetric === 'cases' && (
                                  <Bar name="Số vụ việc / Hồ sơ" dataKey="casesCount" fill="var(--color-primary)" radius={[6, 6, 0, 0]}>
                                    {legalPerfData.map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={entry.color || 'var(--color-primary)'} />
                                    ))}
                                  </Bar>
                                )}
                                {serviceChartMetric === 'revenue' && (
                                  <Bar name="Doanh thu (Triệu VNĐ)" dataKey="revenueInMillions" fill="#10b981" radius={[6, 6, 0, 0]}>
                                    {legalPerfData.map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                                    ))}
                                  </Bar>
                                )}
                                {serviceChartMetric === 'conversion' && (
                                  <Bar name="Tỷ lệ chuyển đổi (%)" dataKey="conversionRate" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                                    {legalPerfData.map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={entry.color || '#8b5cf6'} />
                                    ))}
                                  </Bar>
                                )}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Pie Chart - Phân Bổ Tỷ Trọng Doanh Thu Theo Dịch Vụ */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-lg text-[var(--color-text-dark)] flex items-center gap-2">
                              <Scale className="text-[var(--color-primary)]" size={20} />
                              Cơ Cấu Doanh Thu
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">Tỷ trọng đóng góp doanh thu của các nhóm dịch vụ pháp lý</p>
                          </div>

                          <div className="h-52 my-2 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={legalPerfData.map((item: any) => ({
                                    name: item.name,
                                    value: item.revenue
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={75}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {legalPerfData.map((entry: any, index: number) => (
                                    <Cell key={`pie-cell-${index}`} fill={entry.color || '#3b82f6'} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(val: any) => [`${(val / 1000000).toLocaleString()} Tr VNĐ`, 'Doanh Thu']}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="space-y-1.5 text-xs max-h-36 overflow-y-auto pr-1">
                            {legalPerfData.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                                  <span className="text-gray-700 truncate">{item.name}</span>
                                </div>
                                <span className="font-bold text-gray-900 flex-shrink-0 ml-2">
                                  {(item.revenue / 1000000).toLocaleString()} Tr
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Chart 4: Xu Hướng Nhu Cầu Dịch Vụ Pháp Lý Theo Tháng */}
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="font-bold text-lg text-[var(--color-text-dark)] flex items-center gap-2">
                              <Calendar className="text-[var(--color-primary)]" size={20} />
                              Xu Hướng Nhu Cầu Tư Vấn Theo Tháng
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">Thống kê sự tăng trưởng lượt đăng ký tư vấn từng nhóm dịch vụ pháp lý qua các tháng</p>
                          </div>
                        </div>

                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrendData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                              <XAxis dataKey="month" tick={{fontSize: 12, fill: '#64748b'}} />
                              <YAxis tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                              <Bar name="Tranh tụng" dataKey="Tranh tụng" fill="#a855f7" stackId="a" />
                              <Bar name="Tư vấn Pháp luật" dataKey="Tư vấn Pháp luật" fill="#3b82f6" stackId="a" />
                              <Bar name="Đại diện Ngoài tố tụng" dataKey="Đại diện Ngoài tố tụng" fill="#06b6d4" stackId="a" />
                              <Bar name="Pháp chế & Nội bộ" dataKey="Pháp chế & Nội bộ" fill="#10b981" stackId="a" />
                              <Bar name="Trọng tài & Hòa giải" dataKey="Trọng tài & Hòa giải" fill="#f59e0b" stackId="a" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Bảng Chi Tiết Hiệu Suất Dịch Vụ Pháp Lý */}
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-lg text-[var(--color-text-dark)]">Bảng Báo Cáo Hiệu Suất Chi Tiết Dịch Vụ Pháp Lý</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Tổng hợp chỉ số KPI, tỷ lệ hài lòng và doanh thu từng danh mục dịch vụ</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <tr>
                                <th className="px-6 py-3.5">Dịch Vụ Pháp Lý</th>
                                <th className="px-6 py-3.5 text-center">Số Vụ Việc / Hồ Sơ</th>
                                <th className="px-6 py-3.5 text-center">Đang Tư Vấn</th>
                                <th className="px-6 py-3.5 text-right">Doanh Thu Dự Kiến</th>
                                <th className="px-6 py-3.5 text-center">Tỷ Lệ Chốt (%)</th>
                                <th className="px-6 py-3.5 text-center">Mức Hài Lòng</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {legalPerfData.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                                  <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 text-center font-bold text-gray-800">
                                    {item.casesCount}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full">
                                      {item.activeConsultations} hồ sơ
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                    {(item.revenue / 1000000).toLocaleString()} Tr VNĐ
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${item.conversionRate}%` }}></div>
                                      </div>
                                      <span className="font-semibold text-xs text-gray-700">{item.conversionRate}%</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md text-xs">
                                      ★ {item.satisfaction}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Users Tab */}
                  {activeTab === 'users' && canManageUsers && (
                    <div className="space-y-6">
                      {/* ... existing users content ... */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-[var(--color-text-dark)]">Quản lý tài khoản & Phân quyền</h3>
                          <p className="text-sm text-gray-500">Quản lý thông tin tài khoản nhân sự và điều chỉnh quyền truy cập phòng ban</p>
                        </div>
                        {!isAdding && !editingUser && (
                          <div className="flex gap-2">
                            {usersSubTab === 'list' && (
                              <button
                                onClick={() => {
                                  setEditingUser({ id: 0, username: '', name: '', role: 'user', password: '', practice_areas: '' });
                                  setIsAdding(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors text-sm font-semibold cursor-pointer shadow-sm"
                              >
                                <Plus size={18} /> Thêm mới
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {!isAdding && !editingUser && (
                        <div className="flex border-b border-gray-200">
                          <button
                            onClick={() => setUsersSubTab('list')}
                            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                              usersSubTab === 'list'
                                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Danh sách tài khoản
                          </button>
                          <button
                            onClick={() => setUsersSubTab('matrix')}
                            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                              usersSubTab === 'matrix'
                                ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Ma trận Quyền phòng ban
                          </button>
                        </div>
                      )}

                      {(isAdding || editingUser) ? (
                        <form onSubmit={handleSaveUser} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                          <h4 className="font-bold text-lg mb-4">{isAdding ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                              <div className="relative">
                                <Type className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                  type="text"
                                  required
                                  value={editingUser?.username || ''}
                                  onChange={(e) => setEditingUser({ ...editingUser!, username: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                              <div className="relative">
                                <Type className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                  type="text"
                                  required
                                  value={editingUser?.name || ''}
                                  onChange={(e) => setEditingUser({ ...editingUser!, name: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu {editingUser?.id ? '(Để trống nếu không đổi)' : ''}</label>
                              <div className="relative">
                                <Type className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                  type="password"
                                  required={!editingUser?.id}
                                  value={editingUser?.password || ''}
                                  onChange={(e) => setEditingUser({ ...editingUser!, password: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                              </div>
                              {editingUser?.password && <PasswordStrengthMeter password={editingUser.password} />}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                              <select
                                value={editingUser?.role || 'user'}
                                onChange={(e) => {
                                  const newRole = e.target.value;
                                  const filtered = getFilteredPracticeAreas(newRole, editingUser?.title || '');
                                  let newAreas = editingUser?.practice_areas || '';
                                  if (!newAreas && filtered.length > 0 && !['admin', 'director', 'deputyDirector', 'deputy_director'].includes(newRole)) {
                                    newAreas = filtered[0].key;
                                  }
                                  setEditingUser({ ...editingUser!, role: newRole, practice_areas: newAreas });
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              >
                                <option value="admin">Admin (Quản trị viên)</option>
                                <option value="director">Director (Giám đốc)</option>
                                <option value="deputyDirector">Deputy Director (Phó giám đốc)</option>
                                <option value="head_of_department">Head of Department (Trưởng phòng)</option>
                                <option value="manager">Manager (Quản lý)</option>
                                <option value="prosecutor">Quality Controller (Kiểm soát chất lượng)</option>
                                <option value="controller">Controller (Kiểm soát viên)</option>
                                <option value="lawyer">Lawyer (Luật sư)</option>
                                <option value="specialist">Specialist (Chuyên viên pháp lý)</option>
                                <option value="legal_associate">Legal Associate (Trợ lý pháp lý)</option>
                                <option value="accountant">Accountant (Kế toán)</option>
                                <option value="editor">Editor (Biên tập viên)</option>
                                <option value="trainee_lawyer">Trainee Lawyer (Luật sư Tập sự)</option>
                                <option value="legal_intern">Legal Intern (Thực tập sinh)</option>
                                <option value="consultant">Consultant (Nhân viên tư vấn)</option>
                                <option value="uploader">Uploader (IT - Quản trị hồ sơ)</option>
                                <option value="user">User (Người dùng)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Chức danh</label>
                              <select
                                value={editingUser?.title || ''}
                                onChange={(e) => {
                                  const newTitle = e.target.value;
                                  setEditingUser(prev => {
                                    if (!prev) return prev;
                                    const nextId = prev.id || (users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1);
                                    
                                    const filtered = getFilteredPracticeAreas(prev.role || 'user', newTitle);
                                    let newAreas = prev.practice_areas || '';
                                    if (!newAreas && filtered.length > 0 && !['admin', 'director', 'deputyDirector', 'deputy_director'].includes(prev.role || '')) {
                                      newAreas = filtered[0].key;
                                    }

                                    return {
                                      ...prev,
                                      title: newTitle,
                                      practice_areas: newAreas,
                                      staff_code: prev.id && prev.staff_code ? prev.staff_code : generateStaffCode(newTitle, nextId)
                                    };
                                  });
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              >
                                <option value="">Chọn chức danh</option>
                                {SYSTEM_TITLES.map((title, index) => (
                                  <option key={index} value={title}>{title}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân sự</label>
                              <input
                                type="text"
                                value={editingUser?.staff_code || ''}
                                onChange={(e) => setEditingUser(prev => prev ? { ...prev, staff_code: e.target.value } : prev)}
                                placeholder="(Sẽ tạo tự động theo chức danh)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Bảng lương</label>
                              <input
                                type="text"
                                value={editingUser?.salary ? Number(String(editingUser.salary).replace(/[^0-9]/g, '')).toLocaleString('en-US') : ''}
                                onChange={(e) => setEditingUser({ ...editingUser!, salary: e.target.value.replace(/[^0-9]/g, '') })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono"
                                placeholder="VD: 10,000,000"
                              />
                              {(editingUser?.salary && Number(String(editingUser.salary).replace(/[^0-9]/g, '')) > 0) ? (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  Bằng chữ: {numberToWords(Number(String(editingUser.salary).replace(/[^0-9]/g, '')))}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phần thưởng (Bonus)</label>
                              <input
                                type="text"
                                value={editingUser?.bonus ? Number(String(editingUser.bonus).replace(/[^0-9]/g, '')).toLocaleString('en-US') : ''}
                                onChange={(e) => setEditingUser({ ...editingUser!, bonus: e.target.value.replace(/[^0-9]/g, '') })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none font-mono"
                                placeholder="VD: 2,000,000"
                              />
                              {(editingUser?.bonus && Number(String(editingUser.bonus).replace(/[^0-9]/g, '')) > 0) ? (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  Bằng chữ: {numberToWords(Number(String(editingUser.bonus).replace(/[^0-9]/g, '')))}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
                              <select
                                value={editingUser?.branch || ''}
                                onChange={(e) => setEditingUser({ ...editingUser!, branch: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              >
                                <option value="">-- Chọn chi nhánh --</option>
                                {offices && offices.length > 0 ? (
                                  offices.map((off: any) => (
                                    <option key={off.id} value={off.name}>
                                      {off.name}
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="Chi nhánh Hà Nội">Chi nhánh Hà Nội</option>
                                    <option value="Chi nhánh Đà Nẵng">Chi nhánh Đà Nẵng</option>
                                    <option value="Trụ sở chính TP. Hồ Chí Minh">Trụ sở chính TP. Hồ Chí Minh</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày vào làm</label>
                              <DatePickerInput
                                value={editingUser?.start_date || ''}
                                onChange={(val: string) => setEditingUser({ ...editingUser!, start_date: val })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Loại HĐLĐ</label>
                              <select
                                value={editingUser?.contract_type || ''}
                                onChange={(e) => setEditingUser({ ...editingUser!, contract_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white font-medium text-slate-800"
                              >
                                <option value="">-- Chọn loại hợp đồng --</option>
                                <option value="Chính thức">Chính thức</option>
                                <option value="Thử việc">Thử việc</option>
                                <option value="Cộng tác viên">Cộng tác viên</option>
                                <option value="Thời vụ">Thời vụ</option>
                                <option value="Khác">Khác</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ký HĐLĐ</label>
                              <DatePickerInput
                                value={editingUser?.contract_sign_date || ''}
                                onChange={(val: string) => setEditingUser({ ...editingUser!, contract_sign_date: val })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Người quản lý trực tiếp</label>
                              <select
                                value={editingUser?.manager_id || ''}
                                onChange={(e) => setEditingUser({ ...editingUser!, manager_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white text-slate-800 font-medium"
                              >
                                <option value="">-- Không có (Hoặc tự quản lý) --</option>
                                {users
                                  .filter((u: any) => u.id !== editingUser?.id && u.role !== 'admin' && u.username !== 'admin' && ["director", "deputy_director", "deputyDirector", "head_of_department", "manager", "controller"].includes(u.role))
                                  .map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.title || u.role})</option>
                                  ))}
                              </select>
                            </div>

                            {/* Phòng, Ban / Lĩnh vực chuyên môn */}
                            <div className="relative">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng, Ban / Lĩnh vực chuyên môn</label>
                              <button
                                type="button"
                                onClick={() => setShowPracticeDropdown(!showPracticeDropdown)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-white text-slate-800 font-medium text-left flex justify-between items-center cursor-pointer min-h-[42px]"
                              >
                                <span className="truncate">
                                  {editingUser?.practice_areas ? (
                                    editingUser.practice_areas.split(',').filter(Boolean).map((key: string) => {
                                      const areaObj = PRACTICE_AREAS.find(pa => pa.key === key);
                                      return areaObj ? areaObj.label : key;
                                    }).join(', ')
                                  ) : '-- Chọn phòng ban / lĩnh vực chuyên môn --'}
                                </span>
                                <ChevronDown size={18} className={`text-gray-500 transition-transform ${showPracticeDropdown ? 'rotate-180' : ''}`} />
                              </button>
                              {showPracticeDropdown && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowPracticeDropdown(false)} 
                                  />
                                  <div className="absolute right-0 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto p-3 space-y-3">
                                    {(() => {
                                      const filtered = getFilteredPracticeAreas(editingUser?.role || 'user', editingUser?.title || '');
                                      const currentKeys = editingUser?.practice_areas ? editingUser.practice_areas.split(',').filter(Boolean) : [];
                                      const displayedAreas = PRACTICE_AREAS.filter(area => 
                                        filtered.some(fa => fa.key === area.key) || currentKeys.includes(area.key)
                                      );
                                      return displayedAreas.map((area) => {
                                        const currentAreas = editingUser?.practice_areas ? editingUser.practice_areas.split(',').filter(Boolean) : [];
                                        const isChecked = currentAreas.includes(area.key);
                                        return (
                                          <label key={area.key} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(e) => {
                                                let newAreas: string[];
                                                if (e.target.checked) {
                                                  newAreas = [...currentAreas, area.key];
                                                } else {
                                                  newAreas = currentAreas.filter(k => k !== area.key);
                                                }
                                                setEditingUser({ ...editingUser!, practice_areas: newAreas.join(',') });
                                              }}
                                              className="mt-1 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-4 w-4 shrink-0"
                                            />
                                            <div className="flex flex-col">
                                              <span className="font-semibold text-slate-800 text-sm">{area.label}</span>
                                            </div>
                                          </label>
                                        );
                                      });
                                    })()}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => { setEditingUser(null); setIsAdding(false); }}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
                            >
                              <Save size={18} /> Lưu thay đổi
                            </button>
                          </div>
                        </form>
                      ) : usersSubTab === 'matrix' ? (
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                            <div>
                              <h4 className="font-bold text-lg text-slate-800">Ma trận phân quyền theo Phòng ban</h4>
                              <p className="text-sm text-slate-500">Cấu hình các module chức năng được phép truy cập cho từng phòng ban chuyên môn và vận hành.</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (confirm('Bạn có chắc chắn muốn khôi phục ma trận quyền về mặc định không?')) {
                                    setDepartmentPermissions(DEFAULT_DEPARTMENT_PERMISSIONS);
                                    localStorage.setItem('dept_permissions', JSON.stringify(DEFAULT_DEPARTMENT_PERMISSIONS));
                                  }
                                }}
                                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                              >
                                Khôi phục mặc định
                              </button>
                              <button
                                onClick={() => {
                                  localStorage.setItem('dept_permissions', JSON.stringify(departmentPermissions));
                                  alert('Đã lưu cấu hình ma trận phân quyền phòng ban thành công!');
                                }}
                                className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
                              >
                                <Save size={16} /> Lưu ma trận
                              </button>
                            </div>
                          </div>

                          {/* Legend / Info card */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded bg-emerald-500 shrink-0 mt-0.5 flex items-center justify-center text-white text-[10px]">✓</div>
                              <div>
                                <span className="font-semibold text-slate-700">Có quyền truy cập:</span> Nhân sự thuộc phòng ban này sẽ được tự động kích hoạt module tương ứng trên ERP.
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded border border-gray-300 bg-white shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-700">Không có quyền:</span> Module sẽ bị ẩn hoặc chặn quyền truy cập đối với các tài khoản thông thường.
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-blue-500 shrink-0 font-bold">★</span>
                              <div>
                                <span className="font-semibold text-slate-700">Quản trị viên & Ban Giám đốc:</span> Mặc định luôn có toàn quyền truy cập bất kể cấu hình ma trận.
                              </div>
                            </div>
                          </div>

                          {/* Main Matrix Table */}
                          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 uppercase text-xs font-bold border-b border-gray-200">
                                  <th className="p-4 min-w-[200px] bg-slate-100 sticky left-0 z-10 border-r border-gray-200">Phòng ban / Bộ phận</th>
                                  {PERMISSION_KEYS.map((perm) => (
                                    <th key={perm.key} className="p-4 text-center min-w-[130px] border-r border-gray-200" title={perm.desc}>
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="whitespace-nowrap">{perm.label}</span>
                                        <span className="text-[10px] text-gray-400 normal-case font-normal max-w-[110px] line-clamp-1">{perm.desc}</span>
                                      </div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-sm">
                                {Object.keys(departmentPermissions).map((deptKey) => {
                                  const dept = departmentPermissions[deptKey];
                                  return (
                                    <tr key={deptKey} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 font-semibold text-slate-800 bg-white sticky left-0 z-10 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="flex flex-col">
                                          <span>{dept.label}</span>
                                          <span className="text-xs text-gray-400 font-normal">@{deptKey}</span>
                                        </div>
                                      </td>
                                      {PERMISSION_KEYS.map((perm) => {
                                        const hasAccess = dept.permissions[perm.key];
                                        const isBgdoc = deptKey === 'ban_giam_doc';
                                        return (
                                          <td key={perm.key} className="p-4 text-center border-r border-gray-200">
                                            <label className="inline-flex items-center justify-center cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                              <input
                                                type="checkbox"
                                                checked={hasAccess}
                                                disabled={isBgdoc} // Management always has access
                                                onChange={(e) => {
                                                  const updatedPermissions = {
                                                    ...departmentPermissions,
                                                    [deptKey]: {
                                                      ...dept,
                                                      permissions: {
                                                        ...dept.permissions,
                                                        [perm.key]: e.target.checked
                                                      }
                                                    }
                                                  };
                                                  setDepartmentPermissions(updatedPermissions);
                                                }}
                                                className={`rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] h-5 w-5 ${isBgdoc ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                              />
                                            </label>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Notice footer */}
                          <p className="text-xs text-gray-400 italic text-right mt-2">
                            * Cấu hình ma trận được áp dụng ngay lập tức cho các phân hệ ERP tương ứng của nhân sự sau khi lưu.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {users.filter(u => u.role !== 'client' && u.role !== 'admin' && u.username !== 'admin').map((u) => (
                            <div key={u.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${u.role === 'pending' || !u.role ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1'}`}>
                                    {u.role === 'pending' || !u.role ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block animate-pulse"></span> Pending
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Live
                                      </>
                                    )}
                                  </span>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {u.role === 'admin' ? 'ADMIN' : 'USER'}
                                  </span>
                                  {u.title && (
                                    <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                                      {translateRole(u.title, language)}
                                    </span>
                                  )}
                                  {!u.title && u.role && (
                                    <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                                      {translateRole(ROLE_NAMES[u.role] || u.role, language)}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-[var(--color-text-dark)] mb-1">
                                  {u.name}
                                </h4>
                                <p className="text-sm text-gray-600">@{u.username}</p>
                                {u.practice_areas && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {u.practice_areas.split(',').filter(Boolean).map((areaKey: string) => {
                                      const areaObj = PRACTICE_AREAS.find(pa => pa.key === areaKey);
                                      return areaObj ? (
                                        <span key={areaKey} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold" title={areaObj.desc}>
                                          {areaObj.label}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                                
                                {canManageUsers && (u.salary || u.bonus) && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
                                    {u.salary && (
                                      <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">Lương:</span>
                                        <span className="font-semibold text-[var(--color-text-dark)]">{Number(String(u.salary).replace(/[^0-9]/g, '')).toLocaleString('en-US')} VNĐ</span>
                                      </div>
                                    )}
                                    {u.bonus && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Thưởng:</span>
                                        <span className="font-semibold text-green-600">{Number(String(u.bonus).replace(/[^0-9]/g, '')).toLocaleString('en-US')} VNĐ</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                <button
                                  onClick={() => handleResetUserAccount(u.id)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Khôi phục tài khoản (Reset mật khẩu & Thiết bị)"
                                >
                                  <RefreshCw size={18} />
                                </button>
                                <button
                                  onClick={() => setEditingUser({ ...u, password: '' })}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit2 size={18} />
                                </button>
                                {u.role !== 'admin' && u.username !== 'admin' && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}



                  {/* Offices Tab */}
                  {activeTab === 'offices' && canManageUsers && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800 font-serif">Hệ Thống Văn Phòng</h3>
                          <p className="text-slate-500 mt-1">Quản lý mạng lưới chi nhánh, trụ sở và toạ độ bản đồ</p>
                        </div>
                        {!editingOffice && !isAdding && (
                          <button
                            onClick={() => {
                              setEditingOffice({
                                name: '',
                                short_name: '',
                                region: 'south',
                                address: '',
                                phone: '',
                                email: '',
                                map_url: '',
                                is_headquarters: 0,
                                latitude: 10.784206,
                                longitude: 106.666993
                              });
                              setIsAdding(true);
                            }}
                            className="bg-[var(--color-primary)] text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm text-sm cursor-pointer"
                          >
                            <Plus size={18} /> Thêm văn phòng
                          </button>
                        )}
                      </div>

                      {editingOffice || isAdding ? (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                          <div className="p-6 border-b border-slate-200">
                            <h4 className="text-xl font-bold text-[var(--color-primary)] font-serif">
                              {editingOffice?.id ? 'Chỉnh sửa văn phòng' : 'Thêm văn phòng mới'}
                            </h4>
                          </div>
                          <form onSubmit={handleSaveOffice} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Tên văn phòng <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  required
                                  value={editingOffice?.name || ''}
                                  onChange={e => setEditingOffice({ ...editingOffice, name: e.target.value })}
                                  placeholder="Ví dụ: Chi nhánh Đà Nẵng"
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Tên viết tắt (hiển thị tab) <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  required
                                  value={editingOffice?.short_name || ''}
                                  onChange={e => setEditingOffice({ ...editingOffice, short_name: e.target.value })}
                                  placeholder="Ví dụ: Đà Nẵng"
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Khu vực <span className="text-red-500">*</span></label>
                                <select
                                  value={editingOffice?.region || 'south'}
                                  onChange={e => setEditingOffice({ ...editingOffice, region: e.target.value })}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                >
                                  <option value="north">Miền Bắc</option>
                                  <option value="central">Miền Trung</option>
                                  <option value="south">Miền Nam</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  required
                                  value={editingOffice?.phone || ''}
                                  onChange={e => setEditingOffice({ ...editingOffice, phone: e.target.value })}
                                  placeholder="Ví dụ: 1900 3330"
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Email liên hệ <span className="text-red-500">*</span></label>
                                <input
                                  type="email"
                                  required
                                  value={editingOffice?.email || ''}
                                  onChange={e => setEditingOffice({ ...editingOffice, email: e.target.value })}
                                  placeholder="Ví dụ: info@anhduonglaw.vn"
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Đường dẫn Google Maps (Liên kết ngoài)</label>
                                <input
                                  type="text"
                                  value={editingOffice?.map_url || ''}
                                  onChange={e => setEditingOffice({ ...editingOffice, map_url: e.target.value })}
                                  placeholder="https://maps.google.com/?q=..."
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Kinh độ (Latitude trên bản đồ)</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={editingOffice?.latitude || 10.784206}
                                  onChange={e => setEditingOffice({ ...editingOffice, latitude: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-700">Vĩ độ (Longitude trên bản đồ)</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={editingOffice?.longitude || 106.666993}
                                  onChange={e => setEditingOffice({ ...editingOffice, longitude: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-sm font-semibold text-slate-700">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                              <textarea
                                required
                                rows={2}
                                value={editingOffice?.address || ''}
                                onChange={e => setEditingOffice({ ...editingOffice, address: e.target.value })}
                                placeholder="Địa chỉ chi tiết của chi nhánh..."
                                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm resize-none"
                              />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <input
                                id="is_headquarters"
                                type="checkbox"
                                checked={!!editingOffice?.is_headquarters}
                                onChange={e => setEditingOffice({ ...editingOffice, is_headquarters: e.target.checked ? 1 : 0 })}
                                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                              />
                              <label htmlFor="is_headquarters" className="text-sm font-bold text-amber-800 select-none cursor-pointer">
                                Đặt làm Trụ sở chính (Các văn phòng khác sẽ tự động chuyển thành chi nhánh)
                              </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOffice(null);
                                  setIsAdding(false);
                                }}
                                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2 bg-[var(--color-primary)] text-white hover:bg-slate-800 rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer"
                              >
                                Lưu lại
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                          {offices.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                              <Building2 size={48} className="mx-auto text-slate-300 mb-3" />
                              <p className="font-bold">Chưa có văn phòng nào</p>
                              <p className="text-sm mt-1 text-slate-400">Vui lòng nhấp vào nút "Thêm văn phòng" để tạo mới chi nhánh.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                    <th className="p-4 pl-6">Tên văn phòng</th>
                                    <th className="p-4">Khu vực</th>
                                    <th className="p-4">Thông tin liên hệ</th>
                                    <th className="p-4">Bản đồ (Tọa độ)</th>
                                    <th className="p-4 pr-6 text-right">Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                                  {offices.map((off) => (
                                    <tr key={off.id} className="hover:bg-slate-50/55 transition-colors">
                                      <td className="p-4 pl-6">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-800">{off.name}</span>
                                          {off.is_headquarters === 1 && (
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                              Trụ sở chính
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-slate-500 font-normal mt-1 max-w-sm line-clamp-2">
                                          {off.address}
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        {off.region === 'north' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">Miền Bắc</span>}
                                        {off.region === 'central' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">Miền Trung</span>}
                                        {off.region === 'south' && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Miền Nam</span>}
                                      </td>
                                      <td className="p-4 text-xs space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <Phone size={12} className="text-slate-400" />
                                          <span>{off.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Mail size={12} className="text-slate-400" />
                                          <span>{off.email}</span>
                                        </div>
                                      </td>
                                      <td className="p-4 text-xs font-mono text-slate-500">
                                        <div>Lat: {off.latitude}</div>
                                        <div>Lng: {off.longitude}</div>
                                      </td>
                                      <td className="p-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            onClick={() => {
                                              setEditingOffice(off);
                                              setIsAdding(false);
                                            }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                            title="Sửa"
                                          >
                                            <Edit2 size={16} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteOffice(off.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                            title="Xóa"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}




{/* Contact & CMS Management Tab */}
                  {activeTab === 'contacts' && canManageUsers && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800 font-serif">Quản lý CMS & Thương hiệu Website</h3>
                          <p className="text-slate-500 mt-1">Cấu hình Logo công ty, hình ảnh Banner Hero, hình ảnh Giới thiệu và thông tin liên hệ Hotline/Email</p>
                        </div>
                      </div>

                      {/* Sub-tabs bar for CMS */}
                      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-3 custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => setCmsSubTab('logo')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                            cmsSubTab === 'logo'
                              ? 'bg-[var(--color-primary)] text-white shadow-md'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <ImageIcon size={16} />
                          <span>1. Tải Logo Công Ty</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCmsSubTab('hero')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                            cmsSubTab === 'hero'
                              ? 'bg-[var(--color-primary)] text-white shadow-md'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <Layout size={16} />
                          <span>2. Banner Hero</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCmsSubTab('about')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                            cmsSubTab === 'about'
                              ? 'bg-[var(--color-primary)] text-white shadow-md'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <FileText size={16} />
                          <span>3. Hình ảnh Giới thiệu</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCmsSubTab('contact')}
                          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                            cmsSubTab === 'contact'
                              ? 'bg-[var(--color-primary)] text-white shadow-md'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <Phone size={16} />
                          <span>4. Hotline & Mạng Xã Hội</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Configuration Form */}
                        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              setIsSavingContacts(true);
                              setSaveContactsSuccess(null);
                              try {
                                const res = await fetchApi('/api/settings', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(contactSettings)
                                });
                                if (res.ok) {
                                  setSaveContactsSuccess(true);
                                  window.dispatchEvent(new Event('contact-settings-updated'));
                                  setTimeout(() => setSaveContactsSuccess(null), 3000);
                                } else {
                                  setSaveContactsSuccess(false);
                                }
                              } catch (err) {
                                console.error(err);
                                setSaveContactsSuccess(false);
                              } finally {
                                setIsSavingContacts(false);
                              }
                            }}
                            className="p-6 space-y-6"
                          >
                            {/* 1. LOGO TAB */}
                            {cmsSubTab === 'logo' && (
                              <div className="space-y-6 animate-in fade-in duration-150">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                                    <ImageIcon size={20} />
                                  </div>
                                  <div>
                                    <h4 className="text-base font-bold text-slate-800">Cấu hình Logo Hệ thống</h4>
                                    <p className="text-xs text-slate-500">Tùy chỉnh riêng biệt logo hiển thị trên Website chính, thanh tiêu đề quản trị CMS (Hình 1) và cổng Khách Hàng (Hình 2)</p>
                                  </div>
                                </div>

                                {/* 1.1 LOGO WEBSITE CHÍNH */}
                                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1 bg-amber-50 text-amber-600 rounded-md"><Building2 size={14} /></span>
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">1. Logo chính của Website (Công ty)</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tải ảnh lên từ máy tính</label>
                                        <div className="flex items-center gap-3">
                                          <label className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                                            <Upload size={14} />
                                            <span>Chọn tệp ảnh...</span>
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              onChange={(e) => handleCmsFileUpload(e, 'logo_url')}
                                              className="hidden" 
                                            />
                                          </label>
                                          {isUploadingImage && <span className="text-[11px] font-semibold text-indigo-600 animate-pulse">Đang tải...</span>}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hoặc đường dẫn URL ảnh</label>
                                        <input
                                          type="text"
                                          value={contactSettings.logo_url || ''}
                                          onChange={(e) => setContactSettings({ ...contactSettings, logo_url: e.target.value })}
                                          placeholder="Ví dụ: /logo.svg hoặc https://..."
                                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--color-primary)] text-slate-800 bg-white text-xs font-mono"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="bg-slate-900 rounded-lg p-3 flex flex-col justify-between border border-slate-800">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Xem trước trên nền tối (Navbar / Website)</span>
                                      <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded border border-slate-800">
                                        <img src={contactSettings.logo_url || '/logo.svg'} alt="Logo Website" className="h-8 object-contain" />
                                        <span className="text-white font-serif font-bold text-xs">ÁNH DƯƠNG <span className="text-amber-400">LAW</span></span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* 1.2 LOGO HỆ THỐNG CMS */}
                                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md"><LayoutDashboard size={14} /></span>
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">2. Logo Hệ thống Quản lý CMS (Hình 1)</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tải ảnh lên từ máy tính</label>
                                        <div className="flex items-center gap-3">
                                          <label className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                                            <Upload size={14} />
                                            <span>Chọn tệp ảnh...</span>
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              onChange={(e) => handleCmsFileUpload(e, 'logo_cms_url')}
                                              className="hidden" 
                                            />
                                          </label>
                                          {isUploadingImage && <span className="text-[11px] font-semibold text-emerald-600 animate-pulse">Đang tải...</span>}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hoặc đường dẫn URL ảnh</label>
                                        <input
                                          type="text"
                                          value={contactSettings.logo_cms_url || ''}
                                          onChange={(e) => setContactSettings({ ...contactSettings, logo_cms_url: e.target.value })}
                                          placeholder="Ví dụ: /logo.svg hoặc https://..."
                                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--color-primary)] text-slate-800 bg-white text-xs font-mono"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="bg-slate-100 rounded-lg p-3 flex flex-col justify-between border border-slate-200">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Xem trước trên thanh tiêu đề CMS (Nền sáng)</span>
                                      <div className="flex items-center gap-3 bg-white p-2 rounded border border-slate-150 shadow-sm">
                                        <img src={contactSettings.logo_cms_url || contactSettings.logo_url || '/logo.svg'} alt="Logo CMS" className="h-8 object-contain" />
                                        <span className="text-slate-800 font-serif font-bold text-xs">Ánh Dương <span className="text-amber-600">Law CMS</span></span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* 1.3 LOGO CỔNG KHÁCH HÀNG & QUẢN LÝ KHÁCH */}
                                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1 bg-blue-50 text-blue-600 rounded-md"><Users size={14} /></span>
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">3. Logo Quản lý & Cổng Khách Hàng (Hình 2)</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tải ảnh lên từ máy tính</label>
                                        <div className="flex items-center gap-3">
                                          <label className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                                            <Upload size={14} />
                                            <span>Chọn tệp ảnh...</span>
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              onChange={(e) => handleCmsFileUpload(e, 'logo_portal_url')}
                                              className="hidden" 
                                            />
                                          </label>
                                          {isUploadingImage && <span className="text-[11px] font-semibold text-blue-600 animate-pulse">Đang tải...</span>}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hoặc đường dẫn URL ảnh</label>
                                        <input
                                          type="text"
                                          value={contactSettings.logo_portal_url || ''}
                                          onChange={(e) => setContactSettings({ ...contactSettings, logo_portal_url: e.target.value })}
                                          placeholder="Ví dụ: /logo.svg hoặc https://..."
                                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--color-primary)] text-slate-800 bg-white text-xs font-mono"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="bg-slate-100 rounded-lg p-3 flex flex-col justify-between border border-slate-200">
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Xem trước trên Cổng Khách Hàng (Nền sáng)</span>
                                      <div className="flex items-center gap-3 bg-white p-2 rounded border border-slate-150 shadow-sm">
                                        <img src={contactSettings.logo_portal_url || contactSettings.logo_url || '/logo.svg'} alt="Logo Portal" className="h-8 object-contain" />
                                        <span className="text-slate-800 font-serif font-bold text-xs">Cổng Khách Hàng</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 2. HERO BANNER TAB */}
                            {cmsSubTab === 'hero' && (
                              <div className="space-y-6 animate-in fade-in duration-150">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                                    <Layout size={20} />
                                  </div>
                                  <div>
                                    <h4 className="text-base font-bold text-slate-800">Quản lý Hình Ảnh & Nội Dung Banner Hero</h4>
                                    <p className="text-xs text-slate-500">Thay đổi hình nền lớn, tiêu đề chính, phụ đề và đoạn giới thiệu ở trang chủ</p>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tải hình ảnh Banner Hero từ máy tính
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <label className="px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-2 transition-all">
                                      <Upload size={16} />
                                      <span>Tải tệp hình nền Hero...</span>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleCmsFileUpload(e, 'hero_image_url')}
                                        className="hidden" 
                                      />
                                    </label>
                                    {isUploadingImage && <span className="text-xs font-semibold text-blue-600 animate-pulse">Đang tải...</span>}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL Hình ảnh Hero</label>
                                  <input
                                    type="text"
                                    value={contactSettings.hero_image_url || ''}
                                    onChange={(e) => setContactSettings({ ...contactSettings, hero_image_url: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/30 font-mono"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phụ đề trên cùng (Subtitle)</label>
                                    <input
                                      type="text"
                                      value={contactSettings.hero_subtitle || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, hero_subtitle: e.target.value })}
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dòng tiêu đề chính 1</label>
                                    <input
                                      type="text"
                                      value={contactSettings.hero_title_1 || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, hero_title_1: e.target.value })}
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/30 font-bold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dòng tiêu đề nổi bật 2</label>
                                    <input
                                      type="text"
                                      value={contactSettings.hero_title_2 || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, hero_title_2: e.target.value })}
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/30 font-bold text-amber-600"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả ngắn bên dưới</label>
                                    <textarea
                                      rows={3}
                                      value={contactSettings.hero_description || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, hero_description: e.target.value })}
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 3. ABOUT SECTION TAB */}
                            {cmsSubTab === 'about' && (
                              <div className="space-y-6 animate-in fade-in duration-150">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                  <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
                                    <FileText size={20} />
                                  </div>
                                  <div>
                                    <h4 className="text-base font-bold text-slate-800">Quản lý Hình Ảnh & Nội Dung Giới Thiệu</h4>
                                    <p className="text-xs text-slate-500">Cập nhật hình ảnh văn phòng, huy hiệu số năm kinh nghiệm và nội dung Tầm nhìn / Sứ mệnh</p>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tải hình ảnh Giới thiệu từ máy tính
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <label className="px-4 py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-2 transition-all">
                                      <Upload size={16} />
                                      <span>Tải tệp hình ảnh Giới thiệu...</span>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleCmsFileUpload(e, 'about_image_url')}
                                        className="hidden" 
                                      />
                                    </label>
                                    {isUploadingImage && <span className="text-xs font-semibold text-purple-600 animate-pulse">Đang tải...</span>}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL Hình ảnh Giới thiệu</label>
                                  <input
                                    type="text"
                                    value={contactSettings.about_image_url || ''}
                                    onChange={(e) => setContactSettings({ ...contactSettings, about_image_url: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50/30 font-mono"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số kinh nghiệm (Huy hiệu góc)</label>
                                    <input
                                      type="text"
                                      value={contactSettings.about_years_exp || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, about_years_exp: e.target.value })}
                                      placeholder="15+"
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50/30 font-bold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nhãn kinh nghiệm</label>
                                    <input
                                      type="text"
                                      value={contactSettings.about_years_label || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, about_years_label: e.target.value })}
                                      placeholder="NĂM KINH NGHIỆM VỮNG CHẮC"
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50/30 font-semibold"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung Tầm nhìn (Vision)</label>
                                    <input
                                      type="text"
                                      value={contactSettings.about_vision_text || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, about_vision_text: e.target.value })}
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50/30"
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung Sứ mệnh (Mission)</label>
                                    <input
                                      type="text"
                                      value={contactSettings.about_mission_text || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, about_mission_text: e.target.value })}
                                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50/30"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 4. CONTACT & SOCIAL TAB */}
                            {cmsSubTab === 'contact' && (
                              <div className="space-y-6 animate-in fade-in duration-150">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                    <Phone size={20} />
                                  </div>
                                  <div>
                                    <h4 className="text-base font-bold text-slate-800">Cấu hình Hotline, Email & Mạng xã hội</h4>
                                    <p className="text-xs text-slate-500">Thiết lập các số đường dây nóng tư vấn, khiếu nại và các liên kết mạng xã hội chính thức</p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                      Hotline Tư Vấn Luật <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={contactSettings.hotline_consult || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, hotline_consult: e.target.value })}
                                      placeholder="Ví dụ: 1900 3330"
                                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--color-primary)] text-slate-800 bg-slate-50/30 font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                      Hotline Kế Toán Thuế
                                    </label>
                                    <input
                                      type="text"
                                      value={contactSettings.hotline_accounting || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, hotline_accounting: e.target.value })}
                                      placeholder="Ví dụ: 084.696.7979"
                                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--color-primary)] text-slate-800 bg-slate-50/30 font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                      Góp Ý Chất Lượng DV
                                    </label>
                                    <input
                                      type="text"
                                      value={contactSettings.hotline_feedback || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, hotline_feedback: e.target.value })}
                                      placeholder="Ví dụ: 090.999.3330"
                                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--color-primary)] text-slate-800 bg-slate-50/30 font-semibold"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                      Email Liên Hệ Toàn Diện
                                    </label>
                                    <input
                                      type="email"
                                      value={contactSettings.email || ''}
                                      onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                                      placeholder="Ví dụ: info@anhduonglaw.vn"
                                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[var(--color-primary)] text-slate-800 bg-slate-50/30 font-semibold"
                                    />
                                  </div>

                                  {/* Social Media Links Section */}
                                  <div className="pt-4 border-t border-slate-200">
                                    <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                      <Share2 size={18} className="text-blue-600" /> Liên Kết Mạng Xã Hội
                                    </h5>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Trang Facebook (Fanpage)</label>
                                        <input
                                          type="text"
                                          value={contactSettings.facebook_url || ''}
                                          onChange={(e) => setContactSettings({ ...contactSettings, facebook_url: e.target.value })}
                                          placeholder="https://facebook.com/anhduonglaw.vn"
                                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Facebook Messenger (m.me)</label>
                                        <input
                                          type="text"
                                          value={contactSettings.messenger_url || ''}
                                          onChange={(e) => setContactSettings({ ...contactSettings, messenger_url: e.target.value })}
                                          placeholder="https://m.me/anhduonglaw.vn"
                                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Link Zalo Official Account</label>
                                        <input
                                          type="text"
                                          value={contactSettings.zalo_url || ''}
                                          onChange={(e) => setContactSettings({ ...contactSettings, zalo_url: e.target.value })}
                                          placeholder="https://zalo.me/0846967979"
                                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/30"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kênh YouTube</label>
                                        <input
                                          type="text"
                                          value={contactSettings.youtube_url || ''}
                                          onChange={(e) => setContactSettings({ ...contactSettings, youtube_url: e.target.value })}
                                          placeholder="https://youtube.com/@anhduonglaw"
                                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-red-500 bg-slate-50/30"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                              <div>
                                {saveContactsSuccess === true && (
                                  <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5 animate-bounce">
                                    <CheckCircle2 size={16} /> Lưu cấu hình thành công trên toàn bộ hệ thống!
                                  </span>
                                )}
                                {saveContactsSuccess === false && (
                                  <span className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
                                    <X size={16} /> Lưu thất bại. Vui lòng kiểm tra lại.
                                  </span>
                                )}
                              </div>

                              <button
                                type="submit"
                                disabled={isSavingContacts}
                                className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2 cursor-pointer"
                              >
                                {isSavingContacts ? (
                                  <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Đang lưu...
                                  </>
                                ) : (
                                  <>
                                    <Save size={16} />
                                    Lưu tất cả cấu hình CMS
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* Live Real-time Preview Area */}
                        <div className="lg:col-span-5 bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-6">
                          <div>
                            <h4 className="text-lg font-bold text-slate-800 font-serif">Xem trước thực tế CMS</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Hiển thị thời gian thực nội dung Logo, Banner, Giới thiệu & Hotline</p>
                          </div>

                          <div className="space-y-4">
                             {/* Logo Card Preview */}
                             <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-4">
                               <div>
                                 <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">1. Xem trước các Logo Hệ thống</span>
                                 <p className="text-[10px] text-slate-400 mt-0.5">Tải tệp ảnh hoặc đổi đường dẫn để cập nhật trực tiếp</p>
                               </div>
                               
                               <div className="space-y-3">
                                 {/* 1.1 Website Logo */}
                                 <div className="space-y-1">
                                   <span className="text-[9px] text-slate-400 font-semibold block">Logo Website chính (Navbar/Footer):</span>
                                   <div className="flex items-center gap-2.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                     <img src={contactSettings.logo_url || '/logo.svg'} alt="Logo Website Preview" className="h-6 object-contain" />
                                     <span className="text-xs font-serif font-bold text-white">ÁNH DƯƠNG <span className="text-amber-400">LAW</span></span>
                                   </div>
                                 </div>

                                 {/* 1.2 CMS Logo */}
                                 <div className="space-y-1">
                                   <span className="text-[9px] text-slate-400 font-semibold block">Logo Hệ thống CMS (Hình 1):</span>
                                   <div className="flex items-center gap-2.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                     <img src={contactSettings.logo_cms_url || contactSettings.logo_url || '/logo.svg'} alt="Logo CMS Preview" className="h-6 object-contain" />
                                     <span className="text-xs font-serif font-bold text-white">Ánh Dương <span className="text-emerald-400">Law CMS</span></span>
                                   </div>
                                 </div>

                                 {/* 1.3 Portal Logo */}
                                 <div className="space-y-1">
                                   <span className="text-[9px] text-slate-400 font-semibold block">Logo Cổng Khách Hàng / Quản lý (Hình 2):</span>
                                   <div className="flex items-center gap-2.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                                     <img src={contactSettings.logo_portal_url || contactSettings.logo_url || '/logo.svg'} alt="Logo Portal Preview" className="h-6 object-contain" />
                                     <span className="text-xs font-serif font-bold text-white">Cổng Khách Hàng</span>
                                   </div>
                                 </div>
                               </div>
                             </div>

                            {/* Hero Banner Preview */}
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm h-36 flex items-center justify-center p-4 text-center">
                              <img src={contactSettings.hero_image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=60&w=1280&auto=format&fit=crop'} alt="Hero Background" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60"></div>
                              <div className="relative z-10 text-white space-y-1">
                                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-amber-400 text-amber-300 rounded inline-block">
                                  {contactSettings.hero_subtitle || 'Công ty Luật TNHH Ánh Dương'}
                                </span>
                                <h5 className="text-sm font-serif font-bold text-white">
                                  {contactSettings.hero_title_1 || 'Vững Pháp Lý'} <span className="text-amber-300">{contactSettings.hero_title_2 || 'Sáng Tương Lai'}</span>
                                </h5>
                              </div>
                            </div>

                            {/* About Preview */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                              <img src={contactSettings.about_image_url || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=60&w=800&auto=format&fit=crop'} alt="About Preview" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">3. Giới thiệu</span>
                                <div className="text-xs font-bold text-slate-800 truncate">{contactSettings.about_years_exp || '15+'} {contactSettings.about_years_label || 'NĂM KINH NGHIỆM VỮNG CHẮC'}</div>
                                <div className="text-[10px] text-slate-500 italic truncate">{contactSettings.about_vision_text || 'Tầm nhìn biểu tượng...'}</div>
                              </div>
                            </div>

                            {/* Hotline Card Preview */}
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                                <Phone size={18} className="stroke-[2.5]" />
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Hotline Tư Vấn Luật</span>
                                <span className="text-base font-bold text-[var(--color-primary)] block">
                                  {contactSettings.hotline_consult || '1900 3330'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}




{/* Settings Tab */}
                  {activeTab === 'settings' && canManageUsers && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800 font-serif">Cài đặt</h3>
                          <p className="text-slate-500 mt-1">Quản lý cấu hình & bảo mật hệ thống</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cài đặt chung */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                          <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                            <Settings size={28} className="text-[var(--color-primary)]" />
                            <h4 className="text-xl font-bold text-[var(--color-primary)] font-serif">Cài đặt chung</h4>
                          </div>

                          <div className="p-6 space-y-6">
                            {/* Avatar */}
                            <div className="bg-[var(--color-text-light)] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm flex items-center justify-center">
                                  {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <UserCircle size={28} className="text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <h5 className="text-base font-medium text-slate-800">Ảnh đại diện</h5>
                                  <p className="text-sm text-slate-500 mt-0.5">Cập nhật ảnh của bạn</p>
                                </div>
                              </div>
                              <div>
                                <input 
                                  type="file" 
                                  ref={fileInputRef}
                                  onChange={handleProfileAvatarChange}
                                  accept="image/*"
                                  className="hidden"
                                />
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors text-sm shadow-sm"
                                >
                                  Tải ảnh lên
                                </button>
                              </div>
                            </div>

                            {/* Dark Mode */}
                            <div className="bg-[var(--color-text-light)] rounded-lg p-5 flex items-center justify-between border border-slate-100">
                              <div>
                                <h5 className="text-base font-medium text-slate-800">Giao diện tối (Dark Mode)</h5>
                                <p className="text-sm text-slate-500 mt-0.5">Chuyển sang nền tối</p>
                              </div>
                              <button 
                                onClick={() => handleToggleDarkMode(!darkMode)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-lg transition-colors ${darkMode ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                              >
                                <span className={`inline-block h-5 w-5 transform rounded-lg bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>

                            {/* Email Notifications */}
                            <div className="bg-[var(--color-text-light)] rounded-lg p-5 flex items-center justify-between border border-slate-100">
                              <div>
                                <h5 className="text-base font-medium text-slate-800">Thông báo Email</h5>
                                <p className="text-sm text-slate-500 mt-0.5">Nhận email khi có cập nhật</p>
                              </div>
                              <button 
                                onClick={() => setEmailNotifications(!emailNotifications)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-lg transition-colors ${emailNotifications ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                              >
                                <span className={`inline-block h-5 w-5 transform rounded-lg bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>

                            {/* Language */}
                            <div className="bg-[var(--color-text-light)] rounded-lg p-5 flex items-center justify-between border border-slate-100">
                              <div>
                                <h5 className="text-base font-medium text-slate-800">Ngôn ngữ</h5>
                                <p className="text-sm text-slate-500 mt-0.5">Ngôn ngữ hiển thị</p>
                              </div>
                              <div className="relative">
                                <select 
                                  value={language}
                                  onChange={(e) => setLanguage(e.target.value)}
                                  className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent cursor-pointer font-medium text-sm shadow-sm"
                                >
                                  <option value="vi">Tiếng Việt</option>
                                  <option value="en">English</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bảo mật & Đăng nhập */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                          <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                            <Shield size={28} className="text-[var(--color-primary)]" />
                            <h4 className="text-xl font-bold text-[var(--color-primary)] font-serif">Bảo mật & Đăng nhập</h4>
                          </div>

                          <div className="p-6 space-y-6">
                            {/* 2FA */}
                            <div className="bg-[var(--color-text-light)] rounded-lg p-5 flex items-center justify-between border border-slate-100">
                              <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600 mt-0.5 shrink-0">
                                  <Smartphone size={20} />
                                </div>
                                <div>
                                  <h5 className="text-base font-medium text-slate-800">Xác thực 2 bước (2FA)</h5>
                                  <p className="text-sm text-slate-500 mt-0.5 max-w-[200px] leading-snug">Bảo vệ tài khoản bằng mã OTP gửi về điện thoại</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-lg transition-colors shrink-0 ${twoFactorAuth ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                              >
                                <span className={`inline-block h-5 w-5 transform rounded-lg bg-white transition-transform shadow-sm ${twoFactorAuth ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>

                            {/* Cảnh báo đăng nhập lạ */}
                            <div className="bg-[var(--color-text-light)] rounded-lg p-5 flex items-center justify-between border border-slate-100">
                              <div className="flex items-start gap-4">
                                <div className="bg-amber-100 p-2.5 rounded-lg text-amber-600 mt-0.5 shrink-0">
                                  <Info size={20} />
                                </div>
                                <div>
                                  <h5 className="text-base font-medium text-slate-800">Cảnh báo đăng nhập</h5>
                                  <p className="text-sm text-slate-500 mt-0.5 max-w-[200px] leading-snug">Thông báo khi có thiết bị mới đăng nhập</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setLoginAlerts(!loginAlerts)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-lg transition-colors shrink-0 ${loginAlerts ? 'bg-[var(--color-primary)]' : 'bg-slate-200'}`}
                              >
                                <span className={`inline-block h-5 w-5 transform rounded-lg bg-white transition-transform shadow-sm ${loginAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </div>

                            {/* Auto logout */}
                            <div className="bg-[var(--color-text-light)] rounded-lg p-5 flex items-center justify-between border border-slate-100">
                              <div className="flex items-start gap-4">
                                <div className="bg-purple-100 p-2.5 rounded-lg text-purple-600 mt-0.5 shrink-0">
                                  <Clock size={20} />
                                </div>
                                <div>
                                  <h5 className="text-base font-medium text-slate-800">Tự động đăng xuất</h5>
                                  <p className="text-sm text-slate-500 mt-0.5 max-w-[200px] leading-snug">Sau khoảng thời gian không hoạt động</p>
                                </div>
                              </div>
                              <div className="relative shrink-0">
                                <select 
                                  value={autoLogout}
                                  onChange={(e) => setAutoLogout(e.target.value)}
                                  className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent cursor-pointer font-medium text-sm shadow-sm"
                                >
                                  <option value="15">15 Phút</option>
                                  <option value="30">30 Phút</option>
                                  <option value="60">1 Giờ</option>
                                  <option value="never">Không bao giờ</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Phân quyền Data backup */}
                            <div className="bg-[var(--color-text-light)] rounded-lg p-5 flex items-center justify-between border border-slate-100">
                              <div className="flex items-start gap-4">
                                <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-600 mt-0.5 shrink-0">
                                  <Key size={20} />
                                </div>
                                <div>
                                  <h5 className="text-base font-medium text-slate-800">Cập nhật mật khẩu</h5>
                                  <p className="text-sm text-slate-500 mt-0.5 max-w-[200px] leading-snug">Đổi mật khẩu định kỳ để an toàn hơn</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setActiveTab('profile')}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors text-sm shadow-sm whitespace-nowrap shrink-0"
                              >
                                Đổi mật khẩu
                              </button>
                            </div>
                            
                          </div>
                        </div>

                        {/* Cấu hình AI Module & API Keys */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-indigo-100 overflow-hidden mt-2">
                          <div className="p-6 border-b border-indigo-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                                <Cpu size={24} />
                              </div>
                              <div>
                                <h4 className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
                                  <span>Cấu hình AI Module & Gateway API</span>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                                    Legal OS AI
                                  </span>
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">Quản lý API Key, AI Models, Temperature & Tích hợp dịch vụ trí tuệ nhân tạo</p>
                              </div>
                            </div>
                            <button
                              onClick={handleSaveAiSettings}
                              disabled={isSavingAiSettings}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                            >
                              {isSavingAiSettings ? (
                                <>
                                  <RefreshCw size={16} className="animate-spin" />
                                  <span>Đang lưu...</span>
                                </>
                              ) : (
                                <>
                                  <Save size={16} />
                                  <span>Lưu cấu hình AI</span>
                                </>
                              )}
                            </button>
                          </div>

                          {saveAiSuccess === true && (
                            <div className="m-6 mb-0 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-3 text-sm">
                              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                              <span>Đã cập nhật cấu hình AI Module & API Keys thành công!</span>
                            </div>
                          )}

                          {saveAiSuccess === false && (
                            <div className="m-6 mb-0 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-3 text-sm">
                              <Info size={20} className="text-rose-600 shrink-0" />
                              <span>Không thể lưu cấu hình AI. Vui lòng kiểm tra lại kết nối mạng.</span>
                            </div>
                          )}

                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Gemini / AI API Key Input */}
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center justify-between">
                                  <span>Khóa API AI (Gemini / Custom Provider Key)</span>
                                  <span className="text-[11px] font-normal text-indigo-600">Được mã hóa & lưu trữ an toàn</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type={showAiKey ? "text" : "password"}
                                    value={aiSettings.api_key}
                                    onChange={(e) => setAiSettings({ ...aiSettings, api_key: e.target.value })}
                                    placeholder="AIzaSy... hoặc nhập Custom AI API Key"
                                    className="w-full pl-10 pr-24 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-slate-50/50"
                                  />
                                  <Key size={18} className="absolute left-3 top-3 text-slate-400" />
                                  <button
                                    type="button"
                                    onClick={() => setShowAiKey(!showAiKey)}
                                    className="absolute right-3 top-2.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded flex items-center gap-1"
                                  >
                                    {showAiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                    <span>{showAiKey ? "Ẩn" : "Hiện"}</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Mặc định hệ thống sử dụng khóa bí mật server <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">GEMINI_API_KEY</code>. Nhập tại đây nếu bạn muốn thay thế khóa API riêng cho Legal OS.
                                </p>
                              </div>

                              {/* AI Model Provider */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                  Mô hình AI mặc định (Default Model)
                                </label>
                                <select
                                  value={aiSettings.model}
                                  onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value, provider: e.target.value })}
                                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-medium"
                                >
                                  <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Tối ưu tốc độ & phản hồi nhanh)</option>
                                  <option value="gemini-2.0-pro">Google Gemini 2.0 Pro (Phân tích chuyên sâu & pháp lý)</option>
                                  <option value="antigravity-agent">Antigravity Legal Agent Mesh</option>
                                  <option value="custom-llm">Custom OpenAI-Compatible API</option>
                                </select>
                              </div>

                              {/* AI Temperature */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center justify-between">
                                  <span>Mức độ sáng tạo (Temperature)</span>
                                  <span className="font-mono text-indigo-600 font-bold">{aiSettings.temperature}</span>
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={aiSettings.temperature}
                                  onChange={(e) => setAiSettings({ ...aiSettings, temperature: e.target.value })}
                                  className="w-full accent-indigo-600 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                  <span>0.0 (Chính xác / Pháp lý)</span>
                                  <span>0.5 (Cân bằng)</span>
                                  <span>1.0 (Sáng tạo)</span>
                                </div>
                              </div>
                            </div>

                            {/* Feature Toggles */}
                            <div className="border-t border-slate-100 pt-5 space-y-4">
                              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={16} className="text-indigo-600" />
                                <span>Tính năng AI được kích hoạt toàn hệ thống</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">Tóm tắt hồ sơ vụ án tự động</p>
                                    <p className="text-xs text-slate-500">Tóm tắt văn bản pháp lý & tiến độ tố tụng</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={aiSettings.auto_summary}
                                    onChange={(e) => setAiSettings({ ...aiSettings, auto_summary: e.target.checked })}
                                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                  />
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">OCR & Bóc tách Hợp đồng</p>
                                    <p className="text-xs text-slate-500">Trích xuất điều khoản từ ảnh scan & PDF</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={aiSettings.contract_ocr}
                                    onChange={(e) => setAiSettings({ ...aiSettings, contract_ocr: e.target.checked })}
                                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                  />
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">Tra cứu Văn bản & Án lệ AI</p>
                                    <p className="text-xs text-slate-500">Tìm kiếm ngữ nghĩa pháp luật thông minh</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={aiSettings.legal_search}
                                    onChange={(e) => setAiSettings({ ...aiSettings, legal_search: e.target.checked })}
                                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                  />
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">Bot Tư vấn tự động cho Khách hàng</p>
                                    <p className="text-xs text-slate-500">Trả lời câu hỏi sơ bộ trên Website & Portal</p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={aiSettings.consultation_bot}
                                    onChange={(e) => setAiSettings({ ...aiSettings, consultation_bot: e.target.checked })}
                                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Multi-Model AI Gateway & API Management Section */}
                        <div className="lg:col-span-2">
                          <AiProviderManager fetchApi={fetchApi} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800 font-serif">Hồ sơ cá nhân</h3>
                          <p className="text-slate-500 mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Profile Card */}
                        <div className="lg:col-span-1 space-y-6">
                          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 flex flex-col items-center border-b border-slate-100 relative group">
                              <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-4 relative">
                                {user?.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <UserCircle size={48} className="text-slate-400" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-col gap-1" onClick={() => profileAvatarRef.current?.click()}>
                                  <ImageIcon size={20} className="text-white" />
                                  <span className="text-white text-[10px] font-medium">{isUploadingAvatar ? 'Đang tải...' : 'Đổi ảnh'}</span>
                                </div>
                                <input 
                                  type="file" 
                                  ref={profileAvatarRef} 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={handleProfileAvatarChange} 
                                />
                              </div>
                              <h3 className="text-xl font-bold text-slate-800 text-center">{user?.name}</h3>
                              <span className="mt-2 px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg text-xs font-semibold">
                                {translateRole(user?.title || user?.role || 'Nhân sự', language)}
                              </span>
                              <p className="text-slate-500 text-sm mt-1.5">{user?.staff_code || `NV${user?.id?.toString().padStart(4, '0')}`}</p>
                            </div>
                            
                            <div className="p-0">
                              <div className="py-4 px-6 border-b border-slate-100 grid grid-cols-[20px_1fr] items-center gap-3 text-sm">
                                <Briefcase size={16} className="text-slate-400 justify-self-center" />
                                <div>
                                  <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Phòng ban</p>
                                  <p className="text-slate-800 font-medium">{user?.branch || "Hà Nội"}</p>
                                </div>
                              </div>
                              <div className="py-4 px-6 border-b border-slate-100 grid grid-cols-[20px_1fr] items-center gap-3 text-sm">
                                <Mail size={16} className="text-slate-400 justify-self-center" />
                                <div>
                                  <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Tên đăng nhập / Email</p>
                                  <p className="text-slate-800 font-medium whitespace-pre-wrap word-break min-w-0" style={{ wordBreak: 'break-all' }}>{user?.username}</p>
                                </div>
                              </div>
                              <div className="py-4 px-6 grid grid-cols-[20px_1fr] items-center gap-3 text-sm">
                                <CalendarDays size={16} className="text-slate-400 justify-self-center" />
                                <div>
                                  <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-0.5">Ngày gia nhập</p>
                                  <p className="text-slate-800 font-medium">{user?.start_date ? new Date(user.start_date).toLocaleDateString('vi-VN') : 'Không cung cấp'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Forms */}
                        <div className="lg:col-span-2 space-y-6">
                          <form onSubmit={handleSaveProfile} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200">
                              <h4 className="text-lg font-bold text-slate-800">Chỉnh sửa thông tin</h4>
                            </div>
                            <div className="p-6 space-y-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                    <User size={16} className="text-slate-400" />
                                    Họ và tên
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-slate-800"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                    <Mail size={16} className="text-slate-400" />
                                    Tên đăng nhập
                                  </label>
                                  <input
                                    type="text"
                                    disabled
                                    value={user?.username || ''}
                                    className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed font-medium"
                                  />
                                  <p className="text-xs text-slate-400 mt-1">Không thể thay đổi tên đăng nhập</p>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-5">
                                <h5 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                  <User size={16} className="text-[var(--color-primary)]" />
                                  Thông tin liên hệ & cá nhân
                                </h5>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                      <Phone size={16} className="text-slate-400" />
                                      Số điện thoại
                                    </label>
                                    <input
                                      type="tel"
                                      value={profileForm.phone}
                                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-slate-800"
                                      placeholder="Ví dụ: 0912345678"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                      <Mail size={16} className="text-slate-400" />
                                      Email liên hệ
                                    </label>
                                    <input
                                      type="email"
                                      value={profileForm.email}
                                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-slate-800"
                                      placeholder="Ví dụ: email@domain.com"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                      <CalendarDays size={16} className="text-slate-400" />
                                      Ngày sinh
                                    </label>
                                    <DatePickerInput
                                      value={profileForm.dob}
                                      onChange={(val: string) => setProfileForm({ ...profileForm, dob: val })}
                                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                      <Users size={16} className="text-slate-400" />
                                      Giới tính
                                    </label>
                                    <select
                                      value={profileForm.gender}
                                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-slate-800 bg-white"
                                    >
                                      <option value="male">Nam</option>
                                      <option value="female">Nữ</option>
                                      <option value="other">Khác / Không tiết lộ</option>
                                    </select>
                                  </div>
                                </div>
                                  
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                                    <AlignLeft size={16} className="text-slate-400" />
                                    Địa chỉ
                                  </label>
                                  <input
                                    type="text"
                                    value={profileForm.address}
                                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-slate-800"
                                    placeholder="Địa chỉ liên hệ"
                                  />
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-5">
                                <h5 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                  <Shield size={16} className="text-[var(--color-primary)]" />
                                  Đổi mật khẩu
                                </h5>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới</label>
                                    <div className="relative">
                                      <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                      <input
                                        type="password"
                                        value={profileForm.password}
                                        onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-slate-800"
                                        placeholder="Để trống nếu không đổi"
                                      />
                                    </div>
                                    {profileForm.password && <PasswordStrengthMeter password={profileForm.password} />}
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Trạng thái bảo mật</label>
                                    <div className="w-full px-4 py-2 border border-emerald-200 bg-emerald-50 rounded-lg text-emerald-700 font-medium flex items-center gap-2">
                                      <CheckCircle2 size={18} className="text-emerald-500" />
                                      Đang được bảo vệ
                                    </div>
                                  </div>
                                </div>
                              </div>

                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                              <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[#0c3645] transition-colors font-medium shadow-sm"
                              >
                                <Save size={18} /> Cập nhật thông tin
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity Logs Tab */}
                  {activeTab === 'activity_logs' && (
                    <div className="h-full">
                      <ActivityLogsView user={user} language={language} isEmbedded={true} />
                    </div>
                  )}
                </>
              )}
          </div>
        </main>
      </div>

      {canEditContent && showReminder && (
        <div className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[100] animate-bounce flex items-center gap-3">
          <MessageSquare size={24} />
          <div>
            <div className="font-bold">Nhắc nhở</div>
            <div className="text-sm">Bạn có {stats?.summary?.unreadMessages || 0} tin nhắn chưa đọc!</div>
            <button 
              onClick={() => {
                setActiveTab('messages');
                setShowReminder(false);
              }} 
              className="text-xs underline hover:text-red-100 mt-1 inline-block"
            >
              Xem ngay
            </button>
          </div>
          <button onClick={() => setShowReminder(false)} className="ml-4 p-1 hover:bg-red-600 rounded-lg transition-all duration-300">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
