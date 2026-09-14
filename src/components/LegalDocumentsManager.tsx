import React, { useState, useMemo, useEffect } from "react";
import { fetchApi } from "../utils/api";
import { provinceService } from "../services/provinceService";
import { io } from "socket.io-client";

const simplifyProvinceName = (fullName: string) => {
  if (fullName === "Thành phố Hồ Chí Minh") return "TP. Hồ Chí Minh";
  return fullName
    .replace("Thành phố ", "")
    .replace("Tỉnh ", "");
};
import {
  FileText,
  Plus,
  Search,
  Trash2,
  X,
  Upload,
  BookOpen,
  AlertCircle,
  Calendar,
  User,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Link as LinkIcon,
  Building2,
  Tag,
  Printer,
  Edit,
  Share2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import DocumentExporter from "./DocumentExporter";

interface LegalDoc {
  id: string;
  name: string;
  refNumber?: string;
  type?: string;
  dateStr: string;
  effectiveDateStr?: string;
  signer: string;
  agency?: string;
  summary?: string;
  content: string;
  status: string;
  category: string;
}

function inferDocType(doc: LegalDoc) {
  if (doc.type) return doc.type;
  const name = doc.name;
  const lower = name.toLowerCase();
  if (lower.includes("bộ luật")) return "Bộ luật";
  if (
    lower.includes("luật số") ||
    lower.includes(" luật ") ||
    lower.startsWith("luật ")
  )
    return "Luật";
  if (lower.includes("nghị quyết")) return "Nghị quyết";
  if (lower.includes("nghị định")) return "Nghị định";
  if (lower.includes("thông tư liên tịch")) return "Thông tư liên tịch";
  if (lower.includes("thông tư")) return "Thông tư";
  if (lower.includes("quyết định")) return "Quyết định";
  if (lower.includes("chỉ thị")) return "Chỉ thị";
  if (lower.includes("pháp lệnh")) return "Pháp lệnh";
  if (lower.includes("công văn")) return "Công văn";
  return "Khác";
}

const formatDisplayDate = (dateString: string) => {
  if (!dateString) return "---";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  placeholder: string;
  options: (string | DropdownOption)[];
  value?: string;
  onChange: (val: string) => void;
  searchPlaceholder?: string;
  disabled?: boolean;
  autoOpenTrigger?: any;
}

const DropdownWithSearch: React.FC<DropdownProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  searchPlaceholder = "Nhập tìm kiếm...",
  disabled = false,
  autoOpenTrigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoOpenTrigger && !disabled) {
      setIsOpen(true);
      setSearch("");
    }
  }, [autoOpenTrigger, disabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = useMemo(() => {
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [normalizedOptions, search]);

  const displayLabel = useMemo(() => {
    if (value === undefined || value === null) return placeholder;
    const found = normalizedOptions.find((opt) => opt.value === value);
    if (found) {
      return found.label;
    }
    return placeholder;
  }, [normalizedOptions, value, placeholder]);

  return (
    <div className={`flex flex-col space-y-1 relative ${disabled ? "opacity-60" : ""}`} ref={dropdownRef}>
      <label className="text-white text-xs font-semibold mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              setSearch("");
            }
          }}
          className={`w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-left text-sm flex justify-between items-center shadow-sm h-10 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            disabled
              ? "bg-slate-100 cursor-not-allowed text-slate-400"
              : "bg-white text-slate-800 cursor-pointer"
          }`}
        >
          <span className="truncate">
            {value && value !== "Tất cả" && value !== "" ? displayLabel : placeholder}
          </span>
          <span className="absolute right-3 top-3 text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-100 transition-colors ${
                    value === opt.value
                      ? "bg-slate-100 font-semibold text-blue-600"
                      : "text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LOAI_VAN_BAN_OPTIONS = [
  "Tất cả",
  "Hiến pháp",
  "Bộ luật",
  "Luật",
  "Pháp lệnh",
  "Nghị định",
  "Thông tư",
  "Thông tư liên tịch",
  "Quyết định",
  "Lệnh",
  "Nghị quyết",
  "Nghị quyết liên tịch",
  "Văn bản hợp nhất",
  "Văn bản hành chính liên quan",
  "Bản dịch văn bản",
  "Chỉ thị",
  "Văn bản hệ thống hóa",
  "Chưa xác định",
  "Công văn",
  "Quy định",
  "Sắc luật",
  "Thông báo",
  "Công ước",
  "Văn bản khác",
  "Văn bản liên quan",
  "Thông tư liên bộ",
  "Sắc lệnh",
];

const CO_QUAN_OPTIONS = [
  "Tất cả",
  "Quốc hội",
  "Ủy ban Thường vụ Quốc hội",
  "Chính phủ",
  "Chủ tịch nước",
  "Bộ Tư pháp",
  "Bộ Công an",
  "Bộ Quốc phòng",
  "Bộ Công Thương",
  "Bộ Giáo dục và Đào tạo",
  "Bộ Y tế",
  "Bộ Tài chính",
  "Bộ Nội vụ",
  "Bộ Ngoại giao",
  "Bộ Xây dựng",
  "Bộ Lao động - Thương binh và Xã hội",
  "Thủ tướng Chính phủ",
  "Ủy ban nhân dân Tỉnh",
  "Tòa án nhân dân tối cao",
  "Viện kiểm sát nhân dân tối cao",
  "Kiểm toán nhà nước",
  "Thống đốc Ngân hàng Nhà nước Việt Nam",
  "Bộ Văn hóa, Thể thao và Du lịch",
  "Bộ Thông tin và Truyền thông",
  "Bộ Kế hoạch và Đầu tư",
  "Bộ Tài nguyên và Môi trường",
  "Bộ Nông nghiệp và Phát triển nông thôn",
  "Bộ Giao thông vận tải",
];

const TINH_TRANG_OPTIONS = [
  "Tất cả",
  "Còn hiệu lực",
  "Chưa có hiệu lực",
  "Hết hiệu lực toàn bộ",
  "Hết hiệu lực một phần",
  "Ngưng hiệu lực",
  "Ngưng hiệu lực một phần",
  "Chưa xác định",
  "Không còn phù hợp",
];

const PROVINCE_OPTIONS = [
  "Tất cả",
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Lâm Đồng",
  "Bình Dương",
  "Đồng Nai",
  "Quảng Ninh",
  "Khánh Hòa",
];

const WARD_OPTIONS = [
  "Tất cả",
  "Phường Bến Nghé",
  "Phường Tràng Tiền",
  "Phường Hải Châu I",
  "Phường Lộc Thọ",
  "Phường 1",
  "Phường 2",
  "Phường 3",
  "Phường 4",
  "Phường 5",
];

export default function LegalDocumentsManager({
  user,
  myPermissions,
}: {
  user?: any;
  myPermissions?: any;
}) {
  const canEdit = myPermissions
    ? myPermissions.manageLegalDocs
    : [
        "admin",
        "manager",
        "head_of_department",
        "manage",
        "director",
        "deputyDirector",
        "deputy_director",
        "deputydirector",
      ].includes(user?.role || "");
  const [documents, setDocuments] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetchApi("/api/legal_documents");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            id: String(d.id),
            name: d.title || "",
            refNumber: d.document_number || "",
            type: d.type || undefined,
            dateStr: d.issue_date || "",
            effectiveDateStr: d.effective_date || "",
            signer: d.signer || "",
            agency: d.agency || "",
            summary: d.summary || "",
            content: d.content || "",
            status: d.status || "",
            category: d.category || "",
          }));
          setDocuments(mapped);
        }
      }
    } catch (err) {
      console.error("Error fetching legal documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetchApi("/api/legal_documents/history");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((h: any) => ({
            action: h.action || "",
            docName: h.doc_name || "",
            user: h.user || "",
            time: h.time || "",
          }));
          setHistory(mapped);
        }
      }
    } catch (err) {
      console.error("Error fetching legal documents history:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchHistory();

    let s: any = null;
    try {
      s = io();
      s.on("legal_docs_updated", () => {
        fetchDocuments();
        fetchHistory();
      });
      s.on("cms_updated", (data: any) => {
        if (!data?.type || ["legal_forms", "judgments", "precedents", "legal-forms", "legal_documents"].includes(data.type)) {
          fetchDocuments();
          fetchHistory();
        }
      });
    } catch (e) {}

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showExporter, setShowExporter] = useState(false);

  // Quick Link Document Citation states
  const [previewCitationDoc, setPreviewCitationDoc] = useState<LegalDoc | null>(null);
  const [showCitationSelector, setShowCitationSelector] = useState(false);
  const [citationSearchTerm, setCitationSearchTerm] = useState("");

  // Advanced filters
  const [filterCategory, setFilterCategory] = useState("Tất cả");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [filterType, setFilterType] = useState("Tất cả");
  const [filterSigner, setFilterSigner] = useState("Tất cả");

  // National Database specific search and filter states
  const [searchScope, setSearchScope] = useState<
    "noi-dung" | "tieu-de" | "so-hieu"
  >("tieu-de");
  const [exactPhrase, setExactPhrase] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterProvince, setFilterProvince] = useState("");
  const [filterWard, setFilterWard] = useState("");
  const [wardAutoOpenTrigger, setWardAutoOpenTrigger] = useState(0);

  const provincesList = useMemo(() => provinceService.getAll(), []);

  const provinceOptions = useMemo(() => {
    return [
      { label: "Tất cả", value: "" },
      ...provincesList.map((prov) => ({
        label: simplifyProvinceName(prov.FullName),
        value: prov.Code,
      })),
    ];
  }, [provincesList]);

  const selectedProvinceObj = useMemo(() => {
    return provincesList.find((prov) => prov.Code === filterProvince);
  }, [provincesList, filterProvince]);

  const wardOptions = useMemo(() => {
    return [
      { label: "Tất cả", value: "" },
      ...(selectedProvinceObj?.Wards || []).map((ward) => ({
        label: ward.FullName,
        value: ward.Code,
      })),
    ];
  }, [selectedProvinceObj]);
  const [issueDateRange, setIssueDateRange] = useState("");
  const [effectiveDateRange, setEffectiveDateRange] = useState("");
  const [expireDateRange, setExpireDateRange] = useState("");
  const [csdlScope, setCsdlScope] = useState<"all" | "central" | "local">(
    "all",
  );

  const [history, setHistory] = useState<
    { action: string; docName: string; user: string; time: string }[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    refNumber: "",
    type: "Luật",
    dateStr: "",
    effectiveDateStr: "",
    signer: "",
    agency: "Chính phủ",
    summary: "",
    content: "",
    status: "Còn hiệu lực",
    category: "",
  });

  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      refNumber: "",
      type: "Luật",
      dateStr: "",
      effectiveDateStr: "",
      signer: "",
      agency: "Chính phủ",
      summary: "",
      content: "",
      status: "Còn hiệu lực",
      category: "",
    });
    setEditingDocId(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (doc: LegalDoc, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Map legacy database status names to unified filter status names if needed
    let formStatus = doc.status || "Còn hiệu lực";
    if (formStatus === "Đang có hiệu lực") formStatus = "Còn hiệu lực";
    else if (formStatus === "Hết hiệu lực") formStatus = "Hết hiệu lực toàn bộ";
    else if (formStatus === "Sắp có hiệu lực") formStatus = "Chưa có hiệu lực";

    setFormData({
      name: doc.name,
      refNumber: doc.refNumber || "",
      type: inferDocType(doc),
      category: doc.category || "",
      agency: doc.agency || "Chính phủ",
      signer: doc.signer || "",
      dateStr: doc.dateStr || "",
      effectiveDateStr: doc.effectiveDateStr || "",
      status: formStatus,
      summary: doc.summary || "",
      content: doc.content || "",
    });
    setEditingDocId(doc.id);
    setShowModal(true);
  };

  const categories = [
    "Tất cả",
    ...Array.from(new Set(documents.map((d) => d.category).filter(Boolean))),
  ];
  const statuses = [
    "Tất cả",
    "Đang có hiệu lực",
    "Hết hiệu lực",
    "Sắp có hiệu lực",
  ];
  const types = [
    "Tất cả",
    "Bộ luật",
    "Luật",
    "Pháp lệnh",
    "Lệnh",
    "Nghị quyết",
    "Nghị định",
    "Thông tư",
    "Thông tư liên tịch",
    "Quyết định",
    "Công văn",
    "Chỉ thị",
    "Khác",
  ];
  const signers = [
    "Tất cả",
    ...Array.from(
      new Set(documents.map((d) => d.signer || d.agency).filter(Boolean)),
    ),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const url = editingDocId
        ? `/api/legal_documents/${editingDocId}`
        : "/api/legal_documents";
      const method = editingDocId ? "PUT" : "POST";

      const res = await fetchApi(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.name,
          document_number: formData.refNumber,
          issue_date: formData.dateStr,
          effective_date: formData.effectiveDateStr,
          agency: formData.agency,
          signer: formData.signer,
          content: formData.content,
          status: formData.status,
          summary: formData.summary,
          category: formData.category,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          fetchDocuments();
          fetchHistory();
          setShowModal(false);
          if (!editingDocId && result.id) {
            setSelectedDocId(String(result.id));
          } else if (editingDocId) {
            setSelectedDocId(editingDocId);
          }
          setEditingDocId(null);
          setFormData({
            name: "",
            refNumber: "",
            type: "Luật",
            dateStr: "",
            effectiveDateStr: "",
            signer: "",
            agency: "Chính phủ",
            summary: "",
            content: "",
            status: "Còn hiệu lực",
            category: "",
          });
        }
      } else {
        alert("Có lỗi xảy ra khi xử lý văn bản.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối.");
    }
  };

  const deleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa văn bản này?")) {
      const doc = documents.find((d) => d.id === id);
      try {
        const res = await fetchApi(`/api/legal_documents/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            fetchDocuments();
            fetchHistory();
            if (selectedDocId === id) {
              setSelectedDocId(null);
            }
          }
        } else {
          alert("Có lỗi xảy ra khi xóa văn bản.");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối.");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsParsingFile(true);
      try {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const response = await fetch("/api/legal_documents/parse-file", {
          method: "POST",
          body: uploadData,
        });

        if (!response.ok) {
          throw new Error("Không thể phân tích tệp tin này.");
        }

        const result = await response.json();
        if (result.success && result.data) {
          setFormData({
            name: result.data.title || result.data.name || "",
            refNumber: result.data.refNumber || "",
            type: result.data.type || "Luật",
            dateStr: result.data.dateStr || "",
            effectiveDateStr: result.data.effectiveDateStr || "",
            signer: result.data.signer || "",
            agency: result.data.agency || "Chính phủ",
            summary: result.data.summary || "",
            content: result.data.content || "",
            status: result.data.status || "Còn hiệu lực",
            category: result.data.category || "",
          });
        } else {
          alert("Lỗi khi phân tích tệp.");
        }
      } catch (err: any) {
        console.error(err);
        alert("Đã xảy ra lỗi khi phân tích tệp: " + (err.message || err));
      } finally {
        setIsParsingFile(false);
      }
    }
    e.target.value = "";
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      if (doc.category) {
        counts[doc.category] = (counts[doc.category] || 0) + 1;
      }
    });
    return counts;
  }, [documents]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      const t = inferDocType(doc);
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      // 1. Term matching based on searchScope and exactPhrase
      let matchSearch = true;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();

        const inTitle = d.name.toLowerCase().includes(term);
        const inRef = (d.refNumber || "").toLowerCase().includes(term);
        const inContent =
          d.content.toLowerCase().includes(term) ||
          (d.summary || "").toLowerCase().includes(term);

        if (searchScope === "tieu-de") {
          matchSearch = inTitle;
        } else if (searchScope === "so-hieu") {
          matchSearch = inRef;
        } else if (searchScope === "noi-dung") {
          matchSearch = inContent;
        } else {
          matchSearch = inTitle || inRef || inContent;
        }
      }

      // 2. Document type matching
      let matchType = true;
      if (filterType !== "Tất cả") {
        matchType = inferDocType(d).toLowerCase() === filterType.toLowerCase();
      }

      // 3. Status matching
      let matchStatus = true;
      if (filterStatus !== "Tất cả") {
        const mappedStatus =
          filterStatus === "Còn hiệu lực"
            ? "Đang có hiệu lực"
            : filterStatus === "Hết hiệu lực toàn bộ"
              ? "Hết hiệu lực"
              : filterStatus === "Chưa có hiệu lực"
                ? "Sắp có hiệu lực"
                : filterStatus;
        matchStatus =
          d.status.toLowerCase() === mappedStatus.toLowerCase() ||
          d.status.toLowerCase() === filterStatus.toLowerCase();
      }

      // 4. Agency/Signer matching
      let matchSigner = true;
      if (filterSigner !== "Tất cả") {
        matchSigner =
          (d.signer || "").toLowerCase().includes(filterSigner.toLowerCase()) ||
          (d.agency || "").toLowerCase().includes(filterSigner.toLowerCase());
      }

      // 5. CSDL Scope matching (Central vs Local)
      let matchCsdl = true;
      if (csdlScope === "central") {
        const centralAgencies = [
          "quốc hội",
          "chính phủ",
          "chủ tịch nước",
          "bộ",
          "văn phòng quốc hội",
          "văn phòng chính phủ",
          "thủ tướng",
        ];
        const agencyLower = (d.agency || "").toLowerCase();
        matchCsdl = centralAgencies.some((ca) => agencyLower.includes(ca));
      } else if (csdlScope === "local") {
        const agencyLower = (d.agency || "").toLowerCase();
        matchCsdl =
          agencyLower.includes("ủy ban nhân dân") ||
          agencyLower.includes("ubnd") ||
          agencyLower.includes("tỉnh") ||
          agencyLower.includes("thành phố") ||
          agencyLower.includes("phường");
      }

      // 6. Category matching
      let matchCategory = true;
      if (filterCategory !== "Tất cả") {
        matchCategory = (d.category || "").toLowerCase() === filterCategory.toLowerCase();
      }

      // 7. Province and Ward filtering
      let matchProvince = true;
      if (filterProvince) {
        const provinceObj = provincesList.find((p) => p.Code === filterProvince);
        const provinceFullName = provinceObj ? provinceObj.FullName.toLowerCase() : "";
        const provinceShortName = provinceFullName
          ? provinceFullName.replace("thành phố ", "").replace("tỉnh ", "")
          : "";
        
        const agencyLower = (d.agency || "").toLowerCase();
        const nameLower = d.name.toLowerCase();
        const contentLower = (d.content || "").toLowerCase();

        matchProvince =
          (!!provinceFullName && (agencyLower.includes(provinceFullName) || nameLower.includes(provinceFullName) || contentLower.includes(provinceFullName))) ||
          (!!provinceShortName && (agencyLower.includes(provinceShortName) || nameLower.includes(provinceShortName) || contentLower.includes(provinceShortName)));
      }

      let matchWard = true;
      if (filterWard) {
        const provinceObj = provincesList.find((p) => p.Code === filterProvince);
        const wardObj = provinceObj?.Wards.find((w) => w.Code === filterWard);
        const wardFullName = wardObj ? wardObj.FullName.toLowerCase() : "";

        const agencyLower = (d.agency || "").toLowerCase();
        const nameLower = d.name.toLowerCase();
        const contentLower = (d.content || "").toLowerCase();

        matchWard =
          !!wardFullName &&
          (agencyLower.includes(wardFullName) ||
            nameLower.includes(wardFullName) ||
            contentLower.includes(wardFullName));
      }

      return (
        matchSearch &&
        matchType &&
        matchStatus &&
        matchSigner &&
        matchCsdl &&
        matchCategory &&
        matchProvince &&
        matchWard
      );
    });
  }, [
    documents,
    searchTerm,
    searchScope,
    exactPhrase,
    filterType,
    filterStatus,
    filterSigner,
    csdlScope,
    filterCategory,
    filterProvince,
    filterWard,
  ]);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  // Quick Citation Parser Function for Document Text
  const renderInteractiveContent = (text: string) => {
    if (!text) return null;

    const citationRegex = /(\[Trích dẫn:[^\]]+\]|\[Tham chiếu:[^\]]+\]|\{\{doc:[^\}]+\}\})/g;
    const parts = text.split(citationRegex);

    return (
      <span className="whitespace-pre-wrap font-sans text-[15px] leading-[1.8] text-slate-800">
        {parts.map((part, idx) => {
          if (citationRegex.test(part)) {
            let matchedDoc: LegalDoc | undefined;
            let cleanTitle = part;

            if (part.startsWith("[Trích dẫn:") || part.startsWith("[Tham chiếu:")) {
              cleanTitle = part.replace(/^\[(Trích dẫn|Tham chiếu):\s*/, "").replace(/\]$/, "");
              matchedDoc = documents.find(d => 
                d.name.toLowerCase().includes(cleanTitle.toLowerCase()) || 
                (d.refNumber && d.refNumber.toLowerCase().includes(cleanTitle.toLowerCase())) ||
                cleanTitle.toLowerCase().includes(d.name.toLowerCase())
              );
            } else if (part.startsWith("{{doc:")) {
              const raw = part.replace(/^\{\{doc:/, "").replace(/\}\}$/, "");
              const [idPart, namePart] = raw.split("|");
              matchedDoc = documents.find(d => d.id === idPart) || documents.find(d => d.name.includes(namePart));
              cleanTitle = namePart || matchedDoc?.name || idPart;
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (matchedDoc) {
                    setPreviewCitationDoc(matchedDoc);
                  } else {
                    alert(`Trích dẫn văn bản: "${cleanTitle}".`);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 my-0.5 mx-1 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer group hover:scale-[1.02]"
                title="Kích để xem trích dẫn xem trước hình ảnh/nội dung trực tiếp"
              >
                <LinkIcon size={13} className="text-sky-600 group-hover:rotate-45 transition-transform shrink-0" />
                <span className="underline decoration-sky-400 decoration-dotted underline-offset-2">
                  Trích dẫn: {cleanTitle}
                </span>
                <Eye size={12} className="text-sky-500 opacity-70 group-hover:opacity-100 shrink-0" />
              </button>
            );
          }
          return part;
        })}
      </span>
    );
  };

  const handleDownloadOriginal = () => {
    if (!selectedDoc) return;
    const contentToDownload = selectedDoc.content || "Nội dung văn bản trống.";
    const element = document.createElement("a");
    const file = new Blob([contentToDownload], {
      type: "text/plain;charset=utf-8",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedDoc.name.replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/gi, "_").substring(0, 50)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPDFList = async () => {
    setIsExporting(true);
    try {
      const element = document.createElement("div");
      element.innerHTML = `
        <div style="padding: 40px; font-family: 'Times New Roman', serif; width: 800px; background: white; color: black;">
          <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #1e3a8a; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase;">CÔNG TY LUẬT ÁNH DƯƠNG</h1>
            <p style="font-size: 14px; color: #475569; margin: 5px 0 0 0;">Uy tín - Chuyên nghiệp - Hiệu quả</p>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Website: anhduonglaw.vn | Hotline: 1900 633 294</p>
          </div>
          <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px; text-transform: uppercase;">DANH MỤC TÓM TẮT VĂN BẢN PHÁP LUẬT<br/><span style="font-size: 14px; font-weight: normal; color: #475569;">(Trích xuất ngày: ${new Date().toLocaleDateString("vi-VN")})</span></h2>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #1e3a8a; color: white;">
                <th style="border: 1px solid #1e3a8a; padding: 10px; text-align: center; width: 5%;">STT</th>
                <th style="border: 1px solid #1e3a8a; padding: 10px; text-align: left; width: 45%;">Tên / Số hiệu Văn bản</th>
                <th style="border: 1px solid #1e3a8a; padding: 10px; text-align: left; width: 15%;">Ngày BH</th>
                <th style="border: 1px solid #1e3a8a; padding: 10px; text-align: left; width: 20%;">Cơ quan BH</th>
                <th style="border: 1px solid #1e3a8a; padding: 10px; text-align: left; width: 15%;">Lĩnh vực</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDocs
                .map(
                  (doc, index) => `
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 10px;">
                    <b style="font-size: 13px;">${doc.name}</b>
                    ${doc.refNumber ? `<br/><span style="font-size: 11px; color: #475569;">Số hiệu: ${doc.refNumber}</span>` : ""}
                    <br/><span style="font-size: 11px; font-weight: bold; color: ${doc.status === "Đang có hiệu lực" ? "#1e8e3e" : "#b45309"}">${doc.status}</span>
                  </td>
                  <td style="border: 1px solid #cbd5e1; padding: 10px;">${formatDisplayDate(doc.dateStr)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 10px;">${doc.agency || "Chính phủ"}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 10px;">${doc.category || "-"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div style="text-align: right; font-size: 14px; margin-top: 40px;">
            <p style="margin: 0; font-style: italic;">Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
            <p style="margin: 5px 0 0 0; font-weight: bold;">NGƯỜI XUẤT BÁO CÁO</p>
            <p style="margin: 60px 0 0 0; font-weight: bold;">${user?.name || user?.username || "Quản trị viên"}</p>
          </div>
        </div>
      `;

      element.style.position = "absolute";
      element.style.left = "-9999px";
      document.body.appendChild(element);

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight > pageHeight) {
        let heightLeft = pdfHeight;
        while (heightLeft > 0) {
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
          position -= pageHeight;
          if (heightLeft > 0) {
            pdf.addPage();
          }
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save("AnhDuongLaw_Danh_Muc_Van_Ban.pdf");
      document.body.removeChild(element);
    } catch (err) {
      console.error(err);
      alert("Lỗi xuất PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocSummary = async (doc: LegalDoc) => {
    setIsExporting(true);
    try {
      const element = document.createElement("div");
      element.innerHTML = `
        <div style="padding: 40px; font-family: 'Times New Roman', serif; width: 800px; background: white; color: black;">
          <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #1e3a8a; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase;">CÔNG TY LUẬT ÁNH DƯƠNG</h1>
            <p style="font-size: 14px; color: #475569; margin: 5px 0 0 0;">Uy tín - Chuyên nghiệp - Hiệu quả</p>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Website: anhduonglaw.vn | Hotline: 1900 633 294</p>
          </div>
          <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 30px; text-transform: uppercase;">TRÍCH LỤC VÀ TÓM TẮT VĂN BẢN PHÁP LUẬT<br/><span style="font-size: 14px; font-weight: normal; color: #475569;">(Trích xuất từ Hệ thống Quản trị Ánh Dương Law)</span></h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9; width: 25%;">Tên văn bản</th><td style="border: 1px solid #cbd5e1; padding: 10px;"><b>${doc.name}</b></td></tr>
            ${doc.refNumber ? `<tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9;">Số ký hiệu</th><td style="border: 1px solid #cbd5e1; padding: 10px;"><b>${doc.refNumber}</b></td></tr>` : ""}
            <tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9;">Loại văn bản</th><td style="border: 1px solid #cbd5e1; padding: 10px;">${inferDocType(doc)}</td></tr>
            <tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9;">Cơ quan ban hành</th><td style="border: 1px solid #cbd5e1; padding: 10px;">${doc.agency || "Chính phủ"}</td></tr>
            <tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9;">Người ký</th><td style="border: 1px solid #cbd5e1; padding: 10px;">${doc.signer}</td></tr>
            <tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9;">Ngày ban hành</th><td style="border: 1px solid #cbd5e1; padding: 10px;">${formatDisplayDate(doc.dateStr)}</td></tr>
            ${doc.effectiveDateStr ? `<tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9;">Ngày có hiệu lực</th><td style="border: 1px solid #cbd5e1; padding: 10px;">${formatDisplayDate(doc.effectiveDateStr)}</td></tr>` : ""}
            <tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9;">Lĩnh vực</th><td style="border: 1px solid #cbd5e1; padding: 10px;">${doc.category || "-"}</td></tr>
            <tr><th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; background-color: #f1f5f9;">Trạng thái hiệu lực</th><td style="border: 1px solid #cbd5e1; padding: 10px;">${doc.status}</td></tr>
          </table>
          
          ${
            doc.summary
              ? `
            <h3 style="font-size: 16px; margin-bottom: 10px; text-transform: uppercase; color: #1e3a8a;">Tóm tắt trích yếu nội dung chính</h3>
            <div style="border: 1px solid #cbd5e1; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b; font-size: 14px; text-align: justify; line-height: 1.6; margin-bottom: 25px; font-style: italic;">"${doc.summary}"</div>
          `
              : ""
          }

          <h3 style="font-size: 16px; margin-bottom: 10px; text-transform: uppercase;">Toàn văn nội dung</h3>
          <div style="border: 1px solid #cbd5e1; padding: 15px; background: #f8fafc; white-space: pre-wrap; font-size: 14px; text-align: justify; line-height: 1.6;">${doc.content || "Không có mô tả chi tiết."}</div>
          
          <div style="text-align: right; font-size: 14px; margin-top: 40px;">
            <p style="margin: 0; font-style: italic;">Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</p>
            <p style="margin: 5px 0 0 0; font-weight: bold;">CHUYÊN VIÊN TRÍCH LỤC</p>
            <p style="margin: 60px 0 0 0; font-weight: bold;">${user?.name || user?.username || "Quản trị viên"}</p>
          </div>
        </div>
      `;

      element.style.position = "absolute";
      element.style.left = "-9999px";
      document.body.appendChild(element);

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight > pageHeight) {
        let heightLeft = pdfHeight;
        while (heightLeft > 0) {
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
          position -= pageHeight;
          if (heightLeft > 0) {
            pdf.addPage();
          }
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      const safeName = doc.name.replace(/[^a-z0-9]/gi, "_").substring(0, 30);
      pdf.save(`Trich_Luc_${safeName}.pdf`);
      document.body.removeChild(element);
    } catch (err) {
      console.error(err);
      alert("Lỗi xuất PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    // Simulate copying link (since real router is not integrated)
    navigator.clipboard.writeText(
      `${window.location.origin}/documents/${selectedDoc?.id}`,
    );
    alert("Đã sao chép đường dẫn!");
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[var(--color-primary)] flex items-center gap-2">
            <BookOpen className="text-[var(--color-primary)]" size={26} />
            Hệ thống Tra cứu Văn bản
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Cơ sở dữ liệu pháp luật hiện hành dành cho chuyên viên
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchHistory();
              setShowHistory(true);
            }}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
          >
            Lịch sử
          </button>
          <button
            onClick={handleExportPDFList}
            disabled={isExporting}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={16} />
            {isExporting ? "Đang xuất..." : "Xuất danh mục"}
          </button>
          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap text-sm"
            >
              <Plus size={18} />
              Thêm Văn bản Mới
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-gradient-to-b from-[#0062b1] to-[#004a87] text-white p-6 rounded-xl shadow-lg border border-blue-500/30">
        <div className="space-y-4">
          {/* Main Search Bar & Collapse Toggle */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-lg p-1 border border-slate-300 shadow-sm">
              <input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent px-4 py-2.5 text-slate-800 text-sm focus:outline-none"
              />
              <button
                onClick={() => {
                  // Triggers useMemo re-filtering instantly
                }}
                className="bg-[#0072bc] text-white px-5 py-2 rounded-md font-semibold text-sm flex items-center gap-1.5 hover:bg-[#005a96] transition-colors"
              >
                <Search size={16} />
                Tìm kiếm
              </button>
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center gap-1 text-white hover:text-slate-200 font-semibold text-sm whitespace-nowrap bg-black/20 hover:bg-black/30 px-4 py-3 rounded-lg border border-white/10 transition-all shadow-sm"
            >
              <span>{isCollapsed ? "Mở rộng" : "Thu gọn"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Search Scopes & Options Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-1 pb-2">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold text-white/95">
                Tìm kiếm trong:
              </span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="searchScope"
                  checked={searchScope === "noi-dung"}
                  onChange={() => setSearchScope("noi-dung")}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Nội dung</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="searchScope"
                  checked={searchScope === "tieu-de"}
                  onChange={() => setSearchScope("tieu-de")}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Tiêu đề</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="searchScope"
                  checked={searchScope === "so-hieu"}
                  onChange={() => setSearchScope("so-hieu")}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Số hiệu</span>
              </label>

              <div className="w-[1px] h-4 bg-white/20 hidden md:block mx-2"></div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={exactPhrase}
                  onChange={(e) => setExactPhrase(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Chính xác cụm từ trên</span>
              </label>
            </div>

            <a
              href="#instructions"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  "Hướng dẫn tra cứu:\n1. Chọn phạm vi tìm kiếm (Nội dung, Tiêu đề hoặc Số hiệu).\n2. Sử dụng bộ lọc nâng cao bên dưới để giới hạn kết quả theo cơ quan ban hành, loại văn bản, tình trạng hiệu lực và địa phương.\n3. Click 'Tìm kiếm' để cập nhật kết quả.",
                );
              }}
              className="text-white hover:text-sky-200 hover:underline text-sm font-medium flex items-center gap-1"
            >
              Hướng dẫn tra cứu
            </a>
          </div>

          {/* Advanced Filter Box */}
          {!isCollapsed && (
            <div className="border border-white/20 rounded-xl p-5 bg-[#004a87]/30 space-y-4">
              {/* Row 1: Advanced Dropdowns & Calendar Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DropdownWithSearch
                  label="Loại văn bản"
                  placeholder="Chọn loại văn bản"
                  options={LOAI_VAN_BAN_OPTIONS}
                  value={filterType}
                  onChange={setFilterType}
                />
                <DropdownWithSearch
                  label="Cơ quan ban hành"
                  placeholder="Chọn cơ quan ban hành"
                  options={CO_QUAN_OPTIONS}
                  value={filterSigner}
                  onChange={setFilterSigner}
                />
                <div className="flex flex-col space-y-1 relative">
                  <label className="text-white text-xs font-semibold mb-1">
                    Ngày ban hành
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy - dd/mm/yyyy"
                      value={issueDateRange}
                      onChange={(e) => setIssueDateRange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 h-10"
                    />
                    <Calendar
                      size={16}
                      className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
                <DropdownWithSearch
                  label="Tình trạng hiệu lực"
                  placeholder="Chọn tình trạng hiệu lực"
                  options={TINH_TRANG_OPTIONS}
                  value={filterStatus}
                  onChange={setFilterStatus}
                />
              </div>

              {/* Row 2: Province, Ward, Effective date, Expiry date */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                <DropdownWithSearch
                  label="Tỉnh/Thành phố"
                  placeholder="Chọn Tỉnh/Thành phố"
                  options={provinceOptions}
                  value={filterProvince}
                  onChange={(val) => {
                    setFilterProvince(val);
                    setFilterWard("");
                    if (val) {
                      setWardAutoOpenTrigger((prev) => prev + 1);
                    }
                  }}
                />
                <DropdownWithSearch
                  label="Xã/Phường"
                  placeholder={filterProvince ? "Chọn Xã/Phường" : "Chọn Tỉnh/Thành phố trước"}
                  options={wardOptions}
                  value={filterWard}
                  onChange={setFilterWard}
                  disabled={!filterProvince}
                  autoOpenTrigger={wardAutoOpenTrigger}
                />
                <div className="flex flex-col space-y-1 relative">
                  <label className="text-white text-xs font-semibold mb-1">
                    Ngày có hiệu lực
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy - dd/mm/yyyy"
                      value={effectiveDateRange}
                      onChange={(e) => setEffectiveDateRange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 h-10"
                    />
                    <Calendar
                      size={16}
                      className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1 relative">
                  <label className="text-white text-xs font-semibold mb-1">
                    Ngày hết hiệu lực
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy - dd/mm/yyyy"
                      value={expireDateRange}
                      onChange={(e) => setExpireDateRange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 h-10"
                    />
                    <Calendar
                      size={16}
                      className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* Search Scope within CSDL */}
              <div className="flex flex-wrap items-center gap-4 text-sm pt-2 border-t border-white/10">
                <span className="font-semibold text-white/95">
                  Tìm kiếm trong CSDL:
                </span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="csdlScope"
                    checked={csdlScope === "all"}
                    onChange={() => setCsdlScope("all")}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>Tất cả</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="csdlScope"
                    checked={csdlScope === "central"}
                    onChange={() => setCsdlScope("central")}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>Trung ương</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="csdlScope"
                    checked={csdlScope === "local"}
                    onChange={() => setCsdlScope("local")}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span>Địa phương</span>
                </label>
              </div>
            </div>
          )}

          {/* Bottom Control Buttons */}
          <div className="flex justify-center md:justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("Tất cả");
                setFilterSigner("Tất cả");
                setFilterStatus("Tất cả");
                setFilterProvince("");
                setFilterWard("");
                setIssueDateRange("");
                setEffectiveDateRange("");
                setExpireDateRange("");
                setCsdlScope("all");
                setSearchScope("tieu-de");
                setExactPhrase(false);
              }}
              className="bg-[#f07d00] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 hover:bg-[#d46a00] transition-colors shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17"
                />
              </svg>
              Xóa dữ liệu tìm kiếm
            </button>
            <button
              onClick={() => {
                // Instantly re-triggered by reactive useMemo
              }}
              className="bg-[#0072bc] text-white px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 hover:bg-[#005a96] transition-colors shadow-sm"
            >
              <Search size={16} />
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Results List */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-lg font-bold text-slate-800 border-b-2 border-[var(--color-primary)] pb-1 inline-block">
              KẾT QUẢ TÌM KIẾM ({filteredDocs.length})
            </h2>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center flex flex-col items-center justify-center border border-slate-200">
              <Search className="text-slate-300 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Không tìm thấy tài liệu phù hợp
              </h3>
              <p className="text-slate-500">
                Vui lòng thử lại với từ khóa hoặc bộ lọc khác.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocs.map((doc, index) => {
                const docType = inferDocType(doc);
                const isActiveStatus = doc.status === "Đang có hiệu lực" || doc.status === "Còn hiệu lực";
                const isInactiveStatus = doc.status === "Hết hiệu lực" || 
                                         doc.status === "Hết hiệu lực toàn bộ" || 
                                         doc.status === "Hết hiệu lực một phần" || 
                                         doc.status === "Ngưng hiệu lực" || 
                                         doc.status === "Ngưng hiệu lực một phần" || 
                                         doc.status === "Không còn phù hợp";
                const isUpcomingStatus = doc.status === "Sắp có hiệu lực" || doc.status === "Chưa có hiệu lực";

                const isExpanded = !!expandedDocIds[doc.id];
                const toggleExpand = (e: React.MouseEvent) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('select')) {
                    return;
                  }
                  setExpandedDocIds(prev => ({
                    ...prev,
                    [doc.id]: !prev[doc.id]
                  }));
                };

                return (
                  <div
                    key={doc.id}
                    onClick={toggleExpand}
                    className={`bg-white rounded-xl shadow-sm border border-slate-200/80 hover:border-blue-500/50 hover:shadow-md transition-all duration-300 group overflow-hidden border-l-4 border-l-blue-600/90 cursor-pointer ${
                      isExpanded ? "ring-2 ring-blue-500/10 border-blue-500" : ""
                    }`}
                  >
                    <div className="p-5">
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            #{String(index + 1).padStart(2, '0')}
                          </span>

                          {doc.refNumber && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-50/80 text-blue-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-100/60 font-mono">
                              {doc.refNumber}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200/60">
                            {docType}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isActiveStatus
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : isInactiveStatus
                                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                                  : isUpcomingStatus
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isActiveStatus 
                                ? "bg-emerald-500 animate-pulse" 
                                : isInactiveStatus 
                                  ? "bg-rose-400" 
                                  : isUpcomingStatus 
                                    ? "bg-blue-400" 
                                    : "bg-amber-400"
                            }`} />
                            {doc.status}
                          </span>

                          {/* Inline Toggle Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDocIds(prev => ({ ...prev, [doc.id]: !prev[doc.id] }));
                            }}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Main Title */}
                      <h3 className={`font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mt-2.5 ${
                        isExpanded ? "text-lg md:text-[20px]" : "text-sm md:text-base line-clamp-1"
                      }`}>
                        {doc.name}
                      </h3>

                      {/* Inline Expanded Area */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                          {/* Summary */}
                          {doc.summary && (
                            <div className="relative bg-slate-50/55 rounded-xl px-4 py-4 border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                              <span className="absolute -top-2 left-3 bg-white px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trích yếu nội dung</span>
                              "{doc.summary}"
                            </div>
                          )}

                          {/* Info Panel Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-3 px-4 bg-slate-50/30 rounded-xl border border-slate-100/70 text-xs text-slate-600">
                            <div className="flex items-center gap-2.5">
                              <Tag size={15} className="text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Lĩnh vực</p>
                                <p className="font-semibold text-slate-800 truncate">{doc.category || "Dân sự"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Building2 size={15} className="text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Cơ quan ban hành</p>
                                <p className="font-semibold text-slate-800 truncate">{doc.agency || "Quốc hội"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <User size={15} className="text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Người ký duyệt</p>
                                <p className="font-semibold text-slate-800 truncate">{doc.signer || "Chưa cập nhật"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Calendar size={15} className="text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ngày ký & Hiệu lực</p>
                                <p className="font-semibold text-slate-800 truncate">
                                  {formatDisplayDate(doc.dateStr)}
                                  {doc.effectiveDateStr && ` (HL: ${formatDisplayDate(doc.effectiveDateStr)})`}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Scrollable Document Content Panel */}
                          <div className="bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden">
                            <div className="px-4 py-2 border-b border-slate-200 bg-slate-100/80 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung văn bản chính thức</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDocId(doc.id);
                                }}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-slate-200 shadow-sm px-2 py-1 rounded"
                              >
                                <Eye size={12} /> Xem Toàn Màn Hình
                              </button>
                            </div>
                            <div className="p-4 max-h-72 overflow-y-auto text-sm text-slate-800 bg-white leading-relaxed whitespace-pre-line custom-scrollbar">
                              {doc.content || <span className="text-slate-400 italic">Không có nội dung.</span>}
                            </div>
                          </div>

                          {/* Actions Footer */}
                          <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDocId(doc.id);
                              }}
                              className="flex items-center gap-1.5 text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm border border-blue-100"
                            >
                              <Eye size={16} /> Chi tiết & Tải văn bản
                            </button>
                            {canEdit && (
                              <>
                                <button
                                  onClick={(e) => handleOpenEditModal(doc, e)}
                                  className="text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-500 p-2 rounded-lg transition-all border border-amber-100"
                                  title="Chỉnh sửa"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={(e) => deleteDoc(doc.id, e)}
                                  className="text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 p-2 rounded-lg transition-all border border-rose-100"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Categories Sidebar (Optional/Decorative for full authentic feel) */}
        <div className="hidden lg:block w-72 shrink-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Lĩnh vực phổ biến</h3>
              {filterCategory !== "Tất cả" && (
                <button
                  onClick={() => setFilterCategory("Tất cả")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Xóa lọc
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto custom-scrollbar">
              {[
                "Luật Xây dựng",
                "Luật Kiến trúc",
                "Luật Nhà ở",
                "Luật Đất đai",
                "Luật Quy hoạch ĐT & NT",
                "Luật Đấu thầu",
                "Luật PCCC",
                "Luật địa chất khoáng sản",
                "Luật Đầu tư",
                "Luật Đường sắt",
                "Luật Đầu tư công",
                "Luật Đầu tư PPP",
                "Luật KD BĐS",
                "Luật Bảo vệ môi trường",
              ].map((cat, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setFilterCategory(filterCategory === cat ? "Tất cả" : cat)
                  }
                  className={`w-full text-left px-5 py-2.5 text-xs flex items-center justify-between hover:bg-blue-50/50 transition-colors ${filterCategory === cat ? "text-blue-700 font-semibold bg-blue-50/70 border-l-2 border-blue-600 pl-4.5" : "text-slate-600"}`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <ChevronRight
                      size={12}
                      className={
                        filterCategory === cat
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    />{" "}
                    {cat}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${filterCategory === cat ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Loại văn bản</h3>
              {filterType !== "Tất cả" && (
                <button
                  onClick={() => setFilterType("Tất cả")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Xóa lọc
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {[
                "Luật",
                "Nghị định",
                "Thông tư",
                "Nghị quyết",
                "Quyết định",
              ].map((type, i) => (
                <button
                  key={i}
                  onClick={() => setFilterType(filterType === type ? "Tất cả" : type)}
                  className={`w-full text-left px-5 py-3 text-sm flex items-center justify-between hover:bg-blue-50/50 transition-colors ${filterType === type ? "text-blue-700 font-semibold bg-blue-50/70 border-l-2 border-blue-600 pl-4.5" : "text-slate-600"}`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <ChevronRight
                      size={14}
                      className={
                        filterType === type
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    />{" "}
                    {type}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${filterType === type ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                    {typeCounts[type] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Document Detail Viewer (Overlay) */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center lg:justify-end z-[60] overflow-hidden">
          <div className="bg-white w-full lg:max-w-4xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDocId(null)}
                  className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={24} />
                </button>
                <h3 className="font-bold text-lg text-slate-800">
                  Chi tiết văn bản
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <LinkIcon size={16} /> Sao chép link
                </button>
                {canEdit && (
                  <button
                    onClick={(e) => handleOpenEditModal(selectedDoc, e)}
                    className="flex items-center gap-2 text-sm font-medium text-white bg-amber-600 px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    <Edit size={16} /> Chỉnh sửa
                  </button>
                )}
                <button
                  onClick={() => setShowExporter(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-md border border-emerald-500/20 cursor-pointer"
                >
                  <Share2 size={16} /> Xuất file & Chia sẻ
                </button>
                <button
                  onClick={handleDownloadOriginal}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-[var(--color-primary)] px-4 py-2 rounded-lg hover:bg-[var(--color-primary-light)] transition-colors shadow-sm"
                >
                  <Download size={16} /> Tải bản gốc
                </button>
                <button
                  onClick={() => handleExportDocSummary(selectedDoc)}
                  disabled={isExporting}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={16} />{" "}
                  {isExporting ? "Đang xuất..." : "Xuất PDF"}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mx-auto max-w-3xl">
                {/* Meta */}
                <div className="p-6 md:p-10 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                        selectedDoc.status === "Đang có hiệu lực" ||
                        selectedDoc.status === "Còn hiệu lực"
                          ? "bg-[#e6f4ea] text-[#1e8e3e]"
                          : selectedDoc.status === "Hết hiệu lực" ||
                              selectedDoc.status === "Hết hiệu lực toàn bộ" ||
                              selectedDoc.status === "Hết hiệu lực một phần" ||
                              selectedDoc.status === "Ngưng hiệu lực" ||
                              selectedDoc.status ===
                                "Ngưng hiệu lực một phần" ||
                              selectedDoc.status === "Không còn phù hợp"
                            ? "bg-red-50 text-red-600"
                            : selectedDoc.status === "Sắp có hiệu lực" ||
                                selectedDoc.status === "Chưa có hiệu lực"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {selectedDoc.status}
                    </span>
                    <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">
                      {inferDocType(selectedDoc)}
                    </span>
                    {selectedDoc.refNumber && (
                      <span className="bg-blue-100 text-blue-850 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider border border-blue-200">
                        Số ký hiệu: {selectedDoc.refNumber}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 leading-tight mb-6">
                    {selectedDoc.name}
                  </h1>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white p-5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 block mb-1">
                        Cơ quan ban hành:
                      </span>{" "}
                      <strong className="text-slate-800">
                        {selectedDoc.agency || "Chính phủ"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">
                        Người ký:
                      </span>{" "}
                      <strong className="text-slate-800">
                        {selectedDoc.signer}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">
                        Ngày ban hành:
                      </span>{" "}
                      <strong className="text-slate-800">
                        {formatDisplayDate(selectedDoc.dateStr)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">
                        Ngày có hiệu lực:
                      </span>{" "}
                      <strong className="text-slate-800">
                        {formatDisplayDate(
                          selectedDoc.effectiveDateStr || "",
                        ) || "---"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">
                        Lĩnh vực:
                      </span>{" "}
                      <strong className="text-slate-800">
                        {selectedDoc.category || "-"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">
                        Loại văn bản:
                      </span>{" "}
                      <strong className="text-slate-800">
                        {inferDocType(selectedDoc)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                {selectedDoc.summary && (
                  <div className="p-6 md:p-10 border-b border-slate-200 bg-amber-50/30">
                    <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs mb-3 inline-flex items-center gap-2">
                      <FileText size={16} className="text-amber-600" />
                      Tóm tắt trích yếu nội dung chính
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-sm bg-white p-4 rounded-lg border border-slate-200 shadow-sm whitespace-pre-line">
                      {selectedDoc.summary}
                    </p>
                  </div>
                )}

                {/* Text Body */}
                <div className="p-6 md:p-10">
                  <h3 className="font-bold border-b-2 border-slate-200 pb-2 mb-6 text-slate-800 uppercase tracking-widest text-sm inline-block">
                    Nội dung văn bản
                  </h3>
                  <div className="whitespace-pre-wrap font-sans text-[15px] leading-[1.8] text-slate-800">
                    {selectedDoc.content ? (
                      renderInteractiveContent(selectedDoc.content)
                    ) : (
                      <span className="text-slate-400 italic">
                        Không có nội dung.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] min-h-0">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--color-primary)]">
                <FileText className="text-[var(--color-primary)]" />
                {editingDocId
                  ? "Cập Nhật Văn Bản Pháp Luật"
                  : "Khai Báo Văn Bản Pháp Luật"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 max-h-[calc(85vh-160px)] flex-1">
              <form
                id="add-doc-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Section 1: Thông tin cơ bản */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-1">
                    1. Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Tên đầy đủ của văn bản / Tiêu đề{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
                        placeholder="VD: Luật Đất đai năm 2024..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Số ký hiệu{" "}
                        <span className="text-slate-400 font-normal">
                          (nếu có)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.refNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            refNumber: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
                        placeholder="VD: 15/2020/NĐ-CP..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Loại văn bản <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white text-slate-800"
                      >
                        {LOAI_VAN_BAN_OPTIONS.filter((opt) => opt !== "Tất cả").map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Lĩnh vực / Chuyên ngành{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        list="categories-list"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition text-slate-800"
                        placeholder="VD: Luật Đất đai, Hình sự, Dân sự, Hôn nhân gia đình, Doanh nghiệp..."
                      />
                      <datalist id="categories-list">
                        {[
                          "Luật Xây dựng",
                          "Luật Kiến trúc",
                          "Luật Nhà ở",
                          "Luật Đất đai",
                          "Luật Quy hoạch ĐT & NT",
                          "Luật Đấu thầu",
                          "Luật PCCC",
                          "Luật địa chất khoáng sản",
                          "Luật Đầu tư",
                          "Luật Đường sắt",
                          "Luật Đầu tư công",
                          "Luật Đầu tư PPP",
                          "Luật KD BĐS",
                          "Luật Bảo vệ môi trường",
                          "Hôn nhân gia đình",
                          "Dân sự",
                          "Hình sự",
                          "Lao động",
                          "Doanh nghiệp",
                        ].map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Section 2: Cơ quan ban hành & Người ký */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-1">
                    2. Thẩm quyền ban hành
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Cơ quan ban hành <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.agency}
                        onChange={(e) =>
                          setFormData({ ...formData, agency: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white text-slate-800"
                      >
                        {CO_QUAN_OPTIONS.filter((opt) => opt !== "Tất cả").map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                        <option value="Khác">Cơ quan khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Người ký <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        list="signers-list"
                        value={formData.signer}
                        onChange={(e) =>
                          setFormData({ ...formData, signer: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition text-slate-800"
                        placeholder="VD: Nguyễn Xuân Phúc, Vương Đình Huệ..."
                      />
                      <datalist id="signers-list">
                        {Array.from(new Set(documents.map((d) => d.signer).filter(Boolean))).map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Section 3: Hiệu lực & Thời gian */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-1">
                    3. Hiệu lực & Thời gian
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Ngày ban hành <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        value={formData.dateStr}
                        onChange={(e) =>
                          setFormData({ ...formData, dateStr: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Ngày có hiệu lực
                      </label>
                      <input
                        type="date"
                        value={formData.effectiveDateStr}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            effectiveDateStr: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Trạng thái hiệu lực
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition bg-white text-slate-800"
                      >
                        {TINH_TRANG_OPTIONS.filter((opt) => opt !== "Tất cả").map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Tóm tắt & Toàn văn */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-1">
                    4. Tóm tắt & Toàn văn
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Tóm tắt trích yếu nội dung chính{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.summary}
                        onChange={(e) =>
                          setFormData({ ...formData, summary: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition resize-y"
                        placeholder="Nhập tóm tắt ngắn gọn các điểm mấu chốt của văn bản..."
                      />
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Toàn văn nội dung (Trích xuất văn bản)
                        </label>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setShowCitationSelector(true)}
                            className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors shadow-xs cursor-pointer"
                          >
                            <LinkIcon size={14} className="text-sky-600" />
                            + Chèn Liên Kết Trích Dẫn
                          </button>

                          {isParsingFile ? (
                            <div className="text-xs font-medium text-[var(--color-primary)] flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                              <svg className="animate-spin h-3.5 w-3.5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              AI đang đọc tài liệu...
                            </div>
                          ) : (
                            <label className="cursor-pointer text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-light)] flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 shadow-xs shrink-0">
                              <Upload size={14} />
                              Tải tệp lên (.txt, .docx, .pdf)
                              <input
                                type="file"
                                className="hidden"
                                accept=".txt,.pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp"
                                onChange={handleFileUpload}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-start gap-2 mb-3">
                        <AlertCircle
                          className="text-blue-500 shrink-0 mt-0.5"
                          size={16}
                        />
                        <p className="text-xs text-blue-700">
                          Nội dung toàn văn này phục vụ cho việc lưu trữ gốc và
                          hỗ trợ AI đọc hiểu, soạn thảo văn bản tự động.
                        </p>
                      </div>
                      <textarea
                        rows={8}
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition resize-y font-sans text-[15px] leading-relaxed"
                        placeholder="Nhập hoặc dán toàn văn nội dung văn bản pháp luật vào đây..."
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                form="add-doc-form"
                type="submit"
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm"
              >
                {editingDocId ? "Cập Nhật Văn Bản" : "Thêm Văn Bản"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col min-h-0">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                Lịch sử hoạt động
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 max-h-[calc(85vh-160px)] flex-1">
              {history.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Chưa có lịch sử hoạt động nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50/50"
                    >
                      <div
                        className={`mt-1 shrink-0 ${h.action === "Thêm" ? "text-green-500" : "text-red-500"}`}
                      >
                        {h.action === "Thêm" ? (
                          <Plus size={20} />
                        ) : (
                          <Trash2 size={20} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-slate-800">
                          <span className="font-semibold">{h.user}</span> đã{" "}
                          <span
                            className={`font-semibold ${h.action === "Thêm" ? "text-green-600" : "text-red-600"}`}
                          >
                            {h.action.toLowerCase()}
                          </span>{" "}
                          văn bản:
                        </p>
                        <p className="text-base font-medium text-slate-900 mt-1">
                          {h.docName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{h.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Live Citation Document Preview Overlay Modal */}
      {previewCitationDoc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-sky-100">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <LinkIcon size={20} className="text-sky-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200 block">
                    Trích Dẫn Trực Tiếp Văn Bản Liên Quan
                  </span>
                  <h3 className="text-base sm:text-lg font-bold line-clamp-1">
                    {previewCitationDoc.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewCitationDoc(null)}
                className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Số hiệu:</span>
                  <strong className="text-slate-800 font-mono">{previewCitationDoc.refNumber || "Đang cập nhật"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Cơ quan:</span>
                  <strong className="text-slate-800">{previewCitationDoc.agency || "Chính phủ"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày ban hành:</span>
                  <strong className="text-slate-800">{previewCitationDoc.dateStr || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Trạng thái:</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {previewCitationDoc.status || "Còn hiệu lực"}
                  </span>
                </div>
              </div>

              {/* Summary */}
              {previewCitationDoc.summary && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-600" /> Tóm tắt trích yếu
                  </h4>
                  <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-line">
                    {previewCitationDoc.summary}
                  </p>
                </div>
              )}

              {/* Document Excerpt Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-sky-600" /> Trích đoạn nội dung chính
                </h4>
                <div className="text-xs leading-relaxed text-slate-800 font-sans max-h-52 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                  {previewCitationDoc.content || "Nội dung trích dẫn hiện chưa được nhập toàn văn."}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Click nút bên để xem toàn văn đầy đủ trong trình xem văn bản
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewCitationDoc(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocId(previewCitationDoc.id);
                    setPreviewCitationDoc(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Eye size={14} /> Xem Toàn Văn Văn Bản Này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Citation Document Inserter Modal */}
      {showCitationSelector && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[85] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <LinkIcon size={18} className="text-sky-400" />
                <h3 className="font-bold text-base">Chọn Văn Bản Từ Cơ Sở Dữ Liệu Để Trích Dẫn</h3>
              </div>
              <button
                onClick={() => setShowCitationSelector(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={citationSearchTerm}
                  onChange={(e) => setCitationSearchTerm(e.target.value)}
                  placeholder="Nhập tên văn bản, số hiệu, từ khóa để liên kết trích dẫn..."
                  className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>

            {/* List of Documents */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {documents
                .filter(d => 
                  !citationSearchTerm || 
                  d.name.toLowerCase().includes(citationSearchTerm.toLowerCase()) || 
                  (d.refNumber && d.refNumber.toLowerCase().includes(citationSearchTerm.toLowerCase()))
                )
                .map(doc => (
                  <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-400 transition-all flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                          {doc.type || "Luật"}
                        </span>
                        {doc.refNumber && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Số: {doc.refNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 truncate">
                        {doc.name}
                      </h4>
                      {doc.summary && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {doc.summary}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const citationTag = ` [Trích dẫn: ${doc.name}] `;
                        setFormData(prev => ({
                          ...prev,
                          content: (prev.content || "") + citationTag
                        }));
                        setShowCitationSelector(false);
                      }}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Chèn
                    </button>
                  </div>
                ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowCitationSelector(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Exporter Overlay */}
      {showExporter && selectedDoc && (
        <DocumentExporter
          title={selectedDoc.name}
          refNumber={selectedDoc.refNumber || "---/---"}
          agency={selectedDoc.agency || "Công ty Luật Ánh Dương"}
          signer={selectedDoc.signer || "Chuyên viên tư vấn"}
          dateStr={formatDisplayDate(selectedDoc.dateStr)}
          content={selectedDoc.content || ""}
          onClose={() => setShowExporter(false)}
          metadata={{
            "Tình trạng hiệu lực": selectedDoc.status || "Chưa xác định",
            "Loại văn bản": inferDocType(selectedDoc),
            "Lĩnh vực": selectedDoc.category || "Dân sự",
            "Ngày có hiệu lực": formatDisplayDate(selectedDoc.effectiveDateStr || "")
          }}
        />
      )}
    </div>
  );
}
