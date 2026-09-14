import { Scale, Users, Shield, Gavel, Briefcase, FileText } from "lucide-react";

export interface ModuleConfig {
  id: string;
  nameVi: string;
  nameEn: string;
  category: string;
  descriptionVi: string;
  descriptionEn: string;
  icon: string;
  displayColor: string;
  statuses: {
    value: string;
    labelVi: string;
    labelEn: string;
    colorClass: string;
  }[];
  formFields: {
    name: string;
    labelVi: string;
    labelEn: string;
    type: "text" | "number" | "select" | "textarea" | "date";
    required?: boolean;
    placeholderVi?: string;
    placeholderEn?: string;
    options?: { value: string; labelVi: string; labelEn: string }[];
  }[];
}

export const ModuleRegistry: Record<string, ModuleConfig> = {
  tu_van: {
    id: "tu_van",
    nameVi: "Tư vấn Pháp luật",
    nameEn: "Legal Consultancy",
    category: "Tư vấn",
    descriptionVi: "Không gian quản lý hồ sơ tư vấn pháp luật chuyên sâu dành cho khách hàng doanh nghiệp và cá nhân.",
    descriptionEn: "Specialized space to manage legal consultancy dossiers for corporate and individual clients.",
    icon: "Scale",
    displayColor: "emerald",
    statuses: [
      { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received", colorClass: "bg-amber-50 text-amber-700 border border-amber-100" },
      { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress", colorClass: "bg-blue-50 text-blue-700 border border-blue-100" },
      { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed", colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
    ],
    formFields: [
      { name: "title", labelVi: "Tên hồ sơ / Vụ việc *", labelEn: "Case / Record Title *", type: "text", required: true, placeholderVi: "Ví dụ: Tư vấn rà soát hợp đồng thương mại", placeholderEn: "e.g. Consultancy for trade contract review" },
      { name: "client", labelVi: "Khách hàng", labelEn: "Client", type: "text", placeholderVi: "Nguyễn Văn A", placeholderEn: "John Doe" },
      { name: "feeAmount", labelVi: "Phí dịch vụ (VND)", labelEn: "Fee (VND)", type: "number", placeholderVi: "10000000", placeholderEn: "10000000" },
      { name: "mainAssignee", labelVi: "Người phụ trách", labelEn: "Assignee", type: "select" },
      { name: "status", labelVi: "Trạng thái", labelEn: "Status", type: "select", options: [
        { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received" },
        { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress" },
        { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed" }
      ]},
      { name: "description", labelVi: "Mô tả / Nội dung tóm tắt", labelEn: "Description / Summary", type: "textarea" },
      { name: "date", labelVi: "Ngày tiếp nhận", labelEn: "Date Received", type: "date" }
    ]
  },
  dai_dien_ngoai_to_tung: {
    id: "dai_dien_ngoai_to_tung",
    nameVi: "Đại diện Ngoài Tố tụng",
    nameEn: "Out-of-court Representation",
    category: "Đại diện ngoài tố tụng",
    descriptionVi: "Hồ sơ và vụ việc đại diện ngoài tố tụng, đàm phán thương lượng thương mại.",
    descriptionEn: "Out-of-court representation, negotiation, and commercial arbitration cases.",
    icon: "Users",
    displayColor: "blue",
    statuses: [
      { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received", colorClass: "bg-amber-50 text-amber-700 border border-amber-100" },
      { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress", colorClass: "bg-blue-50 text-blue-700 border border-blue-100" },
      { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed", colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
    ],
    formFields: [
      { name: "title", labelVi: "Tên hồ sơ / Vụ việc *", labelEn: "Case / Record Title *", type: "text", required: true, placeholderVi: "Ví dụ: Đại diện đàm phán giải phóng mặt bằng", placeholderEn: "e.g. Representing land clearance negotiation" },
      { name: "client", labelVi: "Khách hàng", labelEn: "Client", type: "text", placeholderVi: "Nguyễn Văn A", placeholderEn: "John Doe" },
      { name: "feeAmount", labelVi: "Phí dịch vụ (VND)", labelEn: "Fee (VND)", type: "number", placeholderVi: "15000000", placeholderEn: "15000000" },
      { name: "mainAssignee", labelVi: "Người phụ trách", labelEn: "Assignee", type: "select" },
      { name: "status", labelVi: "Trạng thái", labelEn: "Status", type: "select", options: [
        { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received" },
        { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress" },
        { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed" }
      ]},
      { name: "description", labelVi: "Mô tả / Nội dung tóm tắt", labelEn: "Description / Summary", type: "textarea" },
      { name: "date", labelVi: "Ngày tiếp nhận", labelEn: "Date Received", type: "date" }
    ]
  },
  noi_bo: {
    id: "noi_bo",
    nameVi: "Pháp chế & Nội bộ",
    nameEn: "In-house Legal",
    category: "Nội bộ",
    descriptionVi: "Hồ sơ lưu trữ pháp chế doanh nghiệp, rà soát văn bản nội bộ, tuân thủ pháp lý phòng ban.",
    descriptionEn: "Corporate compliance records, internal document review, and departmental compliance.",
    icon: "Shield",
    displayColor: "indigo",
    statuses: [
      { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received", colorClass: "bg-amber-50 text-amber-700 border border-amber-100" },
      { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress", colorClass: "bg-blue-50 text-blue-700 border border-blue-100" },
      { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed", colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
    ],
    formFields: [
      { name: "title", labelVi: "Tiêu đề hồ sơ *", labelEn: "Record Title *", type: "text", required: true, placeholderVi: "Ví dụ: Rà soát điều lệ công ty", placeholderEn: "e.g. Internal charter review" },
      { name: "client", labelVi: "Phòng ban", labelEn: "Department", type: "text", placeholderVi: "Phòng Hành chính nhân sự", placeholderEn: "HR Department" },
      { name: "feeAmount", labelVi: "Phí dự kiến (VND)", labelEn: "Estimated Cost (VND)", type: "number", placeholderVi: "0", placeholderEn: "0" },
      { name: "mainAssignee", labelVi: "Người phụ trách", labelEn: "Assignee", type: "select" },
      { name: "status", labelVi: "Trạng thái", labelEn: "Status", type: "select", options: [
        { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received" },
        { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress" },
        { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed" }
      ]},
      { name: "description", labelVi: "Mô tả / Nội dung tóm tắt", labelEn: "Description / Summary", type: "textarea" },
      { name: "date", labelVi: "Ngày lập hồ sơ", labelEn: "Creation Date", type: "date" }
    ]
  },
  trong_tai_hoa_giai: {
    id: "trong_tai_hoa_giai",
    nameVi: "Trọng tài & Hòa giải",
    nameEn: "Arbitration & Mediation",
    category: "Trọng tài/Hòa giải",
    descriptionVi: "Hồ sơ thủ tục phân xử trọng tài thương mại quốc tế & hòa giải tranh chấp ngoài tòa án.",
    descriptionEn: "International arbitration dossiers and out-of-court commercial dispute mediation.",
    icon: "Gavel",
    displayColor: "amber",
    statuses: [
      { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received", colorClass: "bg-amber-50 text-amber-700 border border-amber-100" },
      { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress", colorClass: "bg-blue-50 text-blue-700 border border-blue-100" },
      { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed", colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
    ],
    formFields: [
      { name: "title", labelVi: "Tên vụ tranh chấp *", labelEn: "Dispute Name *", type: "text", required: true, placeholderVi: "Ví dụ: Tranh chấp hợp đồng mua bán thép VIAC", placeholderEn: "e.g. VIAC steel purchase contract dispute" },
      { name: "client", labelVi: "Các bên tranh chấp", labelEn: "Disputing Parties", type: "text", placeholderVi: "Công ty A vs Công ty B", placeholderEn: "Company A vs Company B" },
      { name: "feeAmount", labelVi: "Giá trị tranh chấp (VND)", labelEn: "Value (VND)", type: "number", placeholderVi: "500000000", placeholderEn: "500000000" },
      { name: "mainAssignee", labelVi: "Trọng tài viên / Hòa giải viên", labelEn: "Arbitrator / Mediator", type: "select" },
      { name: "status", labelVi: "Trạng thái", labelEn: "Status", type: "select", options: [
        { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received" },
        { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress" },
        { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed" }
      ]},
      { name: "description", labelVi: "Mô tả / Tóm tắt vụ việc", labelEn: "Dispute Summary", type: "textarea" },
      { name: "date", labelVi: "Ngày thụ lý", labelEn: "Acquisition Date", type: "date" }
    ]
  },
  tranh_tung: {
    id: "tranh_tung",
    nameVi: "Tranh tụng",
    nameEn: "Litigation",
    category: "Tranh tụng",
    descriptionVi: "Hồ sơ vụ án, tố tụng tòa án các cấp và đại diện tranh chấp pháp lý.",
    descriptionEn: "Court litigation dossiers, multi-level trial proceedings, and legal representation.",
    icon: "Briefcase",
    displayColor: "purple",
    statuses: [
      { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received", colorClass: "bg-amber-50 text-amber-700 border border-amber-100" },
      { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress", colorClass: "bg-blue-50 text-blue-700 border border-blue-100" },
      { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed", colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
    ],
    formFields: [
      { name: "title", labelVi: "Tên vụ án / Hồ sơ *", labelEn: "Case Title *", type: "text", required: true, placeholderVi: "Ví dụ: Vụ án tranh chấp hợp đồng kinh doanh", placeholderEn: "e.g. Business contract dispute case" },
      { name: "client", labelVi: "Khách hàng", labelEn: "Client", type: "text", placeholderVi: "Nguyễn Văn A", placeholderEn: "John Doe" },
      { name: "feeAmount", labelVi: "Phí dịch vụ (VND)", labelEn: "Fee (VND)", type: "number", placeholderVi: "20000000", placeholderEn: "20000000" },
      { name: "mainAssignee", labelVi: "Người phụ trách", labelEn: "Assignee", type: "select" },
      { name: "status", labelVi: "Trạng thái", labelEn: "Status", type: "select", options: [
        { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received" },
        { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress" },
        { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed" }
      ]},
      { name: "description", labelVi: "Nội dung vụ việc", labelEn: "Case Details", type: "textarea" },
      { name: "date", labelVi: "Ngày thụ lý", labelEn: "Acquisition Date", type: "date" }
    ]
  },
  ban_giam_doc: {
    id: "ban_giam_doc",
    nameVi: "Ban Giám đốc & Điều hành",
    nameEn: "Board of Directors & Management",
    category: "Ban Giám đốc",
    descriptionVi: "Không gian chỉ đạo điều hành chiến lược, phê duyệt trọng án, giám sát tiến độ và kiểm soát chất lượng vụ việc toàn hệ thống.",
    descriptionEn: "Executive governance workspace for strategic steering, major case approvals, timeline monitoring, and firm-wide quality oversight.",
    icon: "Briefcase",
    displayColor: "amber",
    statuses: [
      { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận / Đang chỉ đạo", labelEn: "Newly Received / Directing", colorClass: "bg-amber-50 text-amber-700 border border-amber-100" },
      { value: "Đang giải quyết", labelVi: "Đang giải quyết / Giám sát", labelEn: "In Progress / Supervising", colorClass: "bg-blue-50 text-blue-700 border border-blue-100" },
      { value: "Chờ phê duyệt", labelVi: "Chờ BGD phê duyệt", labelEn: "Pending Approval", colorClass: "bg-purple-50 text-purple-700 border border-purple-100" },
      { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed", colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
    ],
    formFields: [
      { name: "title", labelVi: "Tên hồ sơ chỉ đạo / Vụ việc trọng điểm *", labelEn: "Executive Case / Directive Title *", type: "text", required: true, placeholderVi: "Ví dụ: Chỉ đạo chiến lược tái cấu trúc tập đoàn tài chính", placeholderEn: "e.g. Executive restructuring directive" },
      { name: "client", labelVi: "Khách hàng / Đối tác chiến lược", labelEn: "Client / Strategic Partner", type: "text", placeholderVi: "Tập đoàn ABC / Ban Giám đốc", placeholderEn: "ABC Group" },
      { name: "feeAmount", labelVi: "Giá trị hợp đồng / Ngân sách (VND)", labelEn: "Contract Value / Budget (VND)", type: "number", placeholderVi: "100000000", placeholderEn: "100000000" },
      { name: "mainAssignee", labelVi: "Lãnh đạo phụ trách / Luật sư chủ nhiệm", labelEn: "Executive Lead / Senior Counsel", type: "select" },
      { name: "status", labelVi: "Trạng thái chỉ đạo", labelEn: "Directive Status", type: "select", options: [
        { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận / Đang chỉ đạo", labelEn: "Newly Received / Directing" },
        { value: "Đang giải quyết", labelVi: "Đang giải quyết / Giám sát", labelEn: "In Progress / Supervising" },
        { value: "Chờ phê duyệt", labelVi: "Chờ BGD phê duyệt", labelEn: "Pending Approval" },
        { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed" }
      ]},
      { name: "description", labelVi: "Nội dung chỉ đạo & Phương án thực hiện", labelEn: "Directive Details & Action Plan", type: "textarea" },
      { name: "date", labelVi: "Ngày ban hành chỉ đạo", labelEn: "Directive Date", type: "date" }
    ]
  }
};

export const getModuleByActiveTab = (activeModule: string): ModuleConfig => {
  return ModuleRegistry[activeModule] || {
    id: activeModule,
    nameVi: "Hồ sơ Chuyên môn",
    nameEn: "Specialized Dossiers",
    category: "Khác",
    descriptionVi: "Không gian làm việc quản lý hồ sơ vụ việc.",
    descriptionEn: "Dossier case workspace.",
    icon: "Briefcase",
    displayColor: "slate",
    statuses: [
      { value: "Mới tiếp nhận", labelVi: "Mới tiếp nhận", labelEn: "Newly Received", colorClass: "bg-amber-50 text-amber-700 border border-amber-100" },
      { value: "Đang giải quyết", labelVi: "Đang giải quyết", labelEn: "In Progress", colorClass: "bg-blue-50 text-blue-700 border border-blue-100" },
      { value: "Hoàn thành", labelVi: "Hoàn thành", labelEn: "Completed", colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-100" }
    ],
    formFields: []
  };
};
