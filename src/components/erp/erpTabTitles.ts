export const ERP_TAB_TITLES: Record<string, { vi: string; en: string }> = {
  dashboard: { vi: "Tổng quan hệ thống", en: "System Overview" },
  sync_management: { vi: "Trung tâm Đối soát & Đồng bộ Dữ liệu", en: "Cloud Sync & Audit Center" },
  qr_profiles: { vi: "Danh sách mã QR cá nhân", en: "QR Profile Manager" },
  legal_docs: { vi: "Kho tài liệu Pháp lý", en: "Legal Documents Library" },
  legal_tools: { vi: "Công cụ nghiệp vụ", en: "Professional Legal Tools" },
  calendar: { vi: "Lịch làm việc", en: "Operational Calendar" },
  events: { vi: "Sự kiện & Lịch trình", en: "Events & Schedules" },
  payroll: { vi: "Tổng quan Lương & Thưởng", en: "Payroll & Compensation Overview" },
  finance: { vi: "Trung tâm Thanh toán & Quản lý Dòng tiền", en: "Payment & Financial Management Center" },
  ai_training: { vi: "Studio Huấn luyện AI", en: "AI Training Studio" },
  records: { vi: "Hồ sơ vụ việc", en: "Legal Cases & Records" },
  specialized_records: { vi: "Hồ sơ chuyên biệt", en: "Specialized Legal Records" },
  contracts: { vi: "Mẫu hợp đồng", en: "Contracts & Templates" },
  statistics: { vi: "Thống kê hoạt động", en: "Operational Statistics" },
  reports: { vi: "Báo cáo vận hành", en: "Operational Reports" },
  employees: { vi: "Trung tâm Giám sát Nhân sự & Lộ trình Cấp bậc", en: "HR Monitoring & Lawyer Progression Center" },
  iot_gateway: { vi: "Enterprise IoT Center (Giám sát thiết bị)", en: "Enterprise IoT Center (Device Monitoring)" },
  permissions: { vi: "Phân quyền hệ thống", en: "System Permissions" },
  company_settings: { vi: "Công cụ Tạo Gmail Hàng loạt (Pro)", en: "Gmail Creator Pro" },
  security: { vi: "Trung tâm Bảo mật & Giám sát Hệ thống", en: "System Security & WAF Monitoring" },
  record_types: { vi: "Danh mục loại hồ sơ", en: "Record Categories" },
  notifications: { vi: "Thông báo hệ thống", en: "System Notifications" },
  executive_center: { vi: "Trung tâm Điều hành Doanh nghiệp", en: "Executive Dashboard" },
  dossier_brain: { vi: "Trí tuệ hồ sơ (Dossier Brain)", en: "Dossier Brain Center" },
  supervision: { vi: "Hệ thống Thẩm định & Giám sát Tiến độ (SLA)", en: "SLA Appraisal & Progress Supervision" },
  ai: { vi: "Trợ lý ảo AI Law Copilot", en: "AI Law Copilot Assistant" },
  consultation_center: { vi: "Trung tâm Tư vấn Đa kênh", en: "Multi-channel Consultation Center" },
  video_meeting: { vi: "Phòng họp trực tuyến AI", en: "AI Video Meeting Room" },
};

export function getERPTabTitle(tab: string, language: "vi" | "en") {
  return ERP_TAB_TITLES[tab]?.[language] || tab;
}
