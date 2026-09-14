import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, FileText, Gavel, Scale, BookOpen, Map, MapPin, 
  ChevronRight, Phone, ArrowRight, FileSpreadsheet, Plus, Trash2, 
  Printer, Copy, Check, Search, RefreshCw, Info, Download, Briefcase,
  Sparkles, Cpu
} from 'lucide-react';
import { navigateTo } from '../utils/api';
import { useContactSettings } from '../hooks/useContactSettings';
import CourtFeeCalculator from './CourtFeeCalculator';
import { PROVINCES_DATA } from '../data/provinces';
import DocumentScanner from './DocumentScanner';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectWithSearchProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

function SelectWithSearch({ 
  value, 
  onChange, 
  options, 
  placeholder = "Chọn...", 
  searchPlaceholder = "Tìm kiếm...", 
  className = "" 
}: SelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const normalizedOptions = useMemo<SelectOption[]>(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedLabel = useMemo(() => {
    const found = normalizedOptions.find(o => o.value === value);
    return found ? found.label : (value || placeholder);
  }, [value, normalizedOptions, placeholder]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedOptions.filter(opt => normalize(opt.label).includes(normalize(searchQuery)));
  }, [searchQuery, normalizedOptions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 outline-none bg-white hover:border-slate-300 text-left flex items-center justify-between font-semibold text-slate-800 transition-all cursor-pointer shadow-sm min-h-[42px]"
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="text-slate-400 shrink-0 ml-2">
          {isOpen ? (
            <svg className="w-3 h-3 fill-slate-500" viewBox="0 0 24 24">
              <path d="M12 8l-6 6h12z" />
            </svg>
          ) : (
            <svg className="w-3 h-3 fill-slate-400" viewBox="0 0 24 24">
              <path d="M12 16l-6-6h12z" />
            </svg>
          )}
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-fade-in max-h-72">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1.5">
            <span className="text-slate-400 pl-1.5 shrink-0">
              <Search size={14} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-xs sm:text-sm py-1.5 pr-2 outline-none bg-transparent text-slate-800 placeholder-slate-400 font-semibold"
            />
          </div>

          {/* Options List */}
          <ul className="overflow-y-auto divide-y divide-slate-100 text-xs sm:text-sm flex-1">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-slate-400 italic text-center">
                Không tìm thấy kết quả nào khớp
              </li>
            ) : (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value + '-' + opt.label}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50/60 hover:text-indigo-950 font-medium transition-colors ${
                    opt.value === value 
                      ? "bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 pl-3.5" 
                      : "text-slate-700"
                  }`}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Document helper
const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function ToolsPage({ 
  user, 
  isERP = false, 
  initialTab, 
  onTabChange 
}: { 
  user?: any; 
  isERP?: boolean; 
  initialTab?: string; 
  onTabChange?: (tab: string) => void; 
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'precedents');
  const { settings } = useContactSettings();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  useEffect(() => {
    if (!isERP) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Listen for custom navigation event from Navbar
    const handleOpenToolTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      if (customEvent.detail?.tab) {
        if (customEvent.detail.tab === 'billing' && !user) {
          changeTab('fee');
        } else {
          changeTab(customEvent.detail.tab);
        }
      }
    };
    window.addEventListener('open-tool-tab', handleOpenToolTab);
    return () => window.removeEventListener('open-tool-tab', handleOpenToolTab);
  }, [user, isERP]);

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs = [
    { id: 'precedents', label: 'Án lệ Tối cao', icon: BookOpen },
    { id: 'judgments', label: 'Bản án công bố', icon: Gavel },
    { id: 'land', label: 'Bảng giá đất nhà nước', icon: Map },
    { id: 'forms', label: 'Biểu mẫu pháp lý', icon: FileText },
    { id: 'pdf_scanner', label: 'Quét & Số hóa PDF', icon: Sparkles },
    { id: 'fee', label: 'Tính án phí Tòa án', icon: Calculator },
    ...(user ? [{ id: 'billing', label: 'Tính bảng kê lãi', icon: FileSpreadsheet }] : []),
  ];

  // ==================== TÍNH BẢNG KÊ LẠI STATES & LOGIC ====================
  // Sub-tabs switcher inside 'billing' tab: 'debt' (Lập bảng kê nợ & lãi quá hạn) or 'costs' (Bảng kê chi phí pháp lý)
  const [billingMode, setBillingMode] = useState<'debt' | 'costs'>('debt');

  // --- 1. LẬP BẢNG KÊ DƯ NỢ & LÃI QUÁ HẠN STATES ---
  interface DebtItem {
    id: string;
    reference: string;          // Số hóa đơn, chứng từ hoặc hợp đồng
    principal: number;          // Số tiền nợ gốc (VND)
    overdueStartDate: string;   // Ngày bắt đầu quá hạn (YYYY-MM-DD)
    rate: number;               // Lãi suất áp dụng
    rateType: 'year' | 'month' | 'day'; // Loại lãi suất
  }

  // Pre-seed with helpful example data
  const [debtItems, setDebtItems] = useState<DebtItem[]>([
    { id: '1', reference: 'Hợp đồng mua bán số 04/2024/HDMB', principal: 150000000, overdueStartDate: '2024-05-15', rate: 12, rateType: 'year' },
    { id: '2', reference: 'Hóa đơn giá trị gia tăng số GT-8812', principal: 35000000, overdueStartDate: '2024-10-01', rate: 1.5, rateType: 'month' },
    { id: '3', reference: 'Biên bản thỏa thuận tạm ứng đợt 2', principal: 60000000, overdueStartDate: '2025-01-10', rate: 0.05, rateType: 'day' }
  ]);

  const [debtEndDate, setDebtEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Inputs for adding new debt item
  const [debtRef, setDebtRef] = useState('');
  const [debtPrincipal, setDebtPrincipal] = useState('');
  const [debtStartDate, setDebtStartDate] = useState('');
  const [debtRate, setDebtRate] = useState('');
  const [debtRateType, setDebtRateType] = useState<'year' | 'month' | 'day'>('year');

  // Helper calculation functions
  const calculateDays = (startDateStr: string, endDateStr: string): number => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    const diffTime = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calculateInterest = (principal: number, startDateStr: string, endDateStr: string, rate: number, rateType: 'year' | 'month' | 'day'): number => {
    const days = calculateDays(startDateStr, endDateStr);
    let interest = 0;
    
    if (rateType === 'year') {
      interest = principal * (rate / 100) * (days / 365);
    } else if (rateType === 'month') {
      interest = principal * (rate / 100) * (days / 30);
    } else if (rateType === 'day') {
      interest = principal * (rate / 100) * days;
    }
    
    return Math.round(interest);
  };

  const handleAddDebtItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtRef.trim() || !debtStartDate || !debtRate) return;
    const pNum = Number(debtPrincipal.replace(/,/g, '')) || 0;
    const rNum = Number(debtRate) || 0;

    setDebtItems([
      ...debtItems,
      {
        id: Date.now().toString(),
        reference: debtRef,
        principal: pNum,
        overdueStartDate: debtStartDate,
        rate: rNum,
        rateType: debtRateType
      }
    ]);

    setDebtRef('');
    setDebtPrincipal('');
    setDebtStartDate('');
    setDebtRate('');
    setDebtRateType('year');
  };

  const handleRemoveDebtItem = (id: string) => {
    setDebtItems(debtItems.filter(item => item.id !== id));
  };

  const handleResetDebtItems = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả các dòng hiện tại và đặt lại bảng kê?')) {
      setDebtItems([]);
    }
  };

  const handleDebtPrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(rawValue)) {
      rawValue = rawValue.replace(/^0+(?=\d)/, '');
      setDebtPrincipal(rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
  };

  const exportDebtToCSV = () => {
    if (debtItems.length === 0) return;
    
    let csvContent = "\uFEFF"; // UTF-8 BOM for proper Vietnamese diacritic rendering in MS Excel
    
    // Headers
    csvContent += "STT,Số hợp đồng/Hóa đơn/Chứng từ,Số nợ gốc (VND),Ngày bắt đầu quá hạn,Ngày chốt tính lãi,Số ngày quá hạn,Lãi suất áp dụng (%),Loại lãi suất,Tiền lãi phát sinh (VND),Tổng dư nợ cả gốc và lãi (VND)\r\n";
    
    let totalPrincipal = 0;
    let totalInterest = 0;
    let totalSum = 0;
    
    debtItems.forEach((item, index) => {
      const days = calculateDays(item.overdueStartDate, debtEndDate);
      const interest = calculateInterest(item.principal, item.overdueStartDate, debtEndDate, item.rate, item.rateType);
      const total = item.principal + interest;
      
      totalPrincipal += item.principal;
      totalInterest += interest;
      totalSum += total;
      
      const rateTypeLabel = item.rateType === 'year' ? 'Năm' : item.rateType === 'month' ? 'Tháng' : 'Ngày';
      
      csvContent += `${index + 1},` +
                    `"${item.reference.replace(/"/g, '""')}",` +
                    `${item.principal},` +
                    `"${item.overdueStartDate}",` +
                    `"${debtEndDate}",` +
                    `${days},` +
                    `${item.rate},` +
                    `"${rateTypeLabel}",` +
                    `${interest},` +
                    `${total}\r\n`;
    });
    
    // Totals row
    csvContent += `Tổng cộng,,${totalPrincipal},,,,${totalInterest},${totalSum}\r\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bang_ke_lai_qua_han_${debtEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Debt totals calculations
  const totalDebtPrincipal = debtItems.reduce((sum, item) => sum + item.principal, 0);
  const totalDebtInterest = debtItems.reduce((sum, item) => sum + calculateInterest(item.principal, item.overdueStartDate, debtEndDate, item.rate, item.rateType), 0);
  const totalDebtSum = totalDebtPrincipal + totalDebtInterest;


  // --- 2. BẢNG KÊ CHI PHÍ PHÁP LÝ STATES ---
  const [billingItems, setBillingItems] = useState([
    { id: 1, desc: 'Lệ phí nộp đơn khởi kiện sơ thẩm', qty: 1, price: 300000 },
    { id: 2, desc: 'Phí sao lục hồ sơ bản sao từ Tòa án', qty: 5, price: 50000 },
    { id: 3, desc: 'Phí lập vi bằng ghi nhận hiện trạng bàn giao đất', qty: 1, price: 4500000 },
    { id: 4, desc: 'Thù lao Luật sư soạn thảo Đơn khởi kiện chuyên sâu', qty: 1, price: 10000000 },
  ]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [billingTax, setBillingTax] = useState<number>(10); // VAT %
  const [billingDiscount, setBillingDiscount] = useState<number>(0); // Giảm giá VND

  const handleAddBillingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;
    const priceNum = Number(newItemPrice.replace(/,/g, '')) || 0;
    setBillingItems([
      ...billingItems,
      {
        id: Date.now(),
        desc: newItemDesc,
        qty: newItemQty,
        price: priceNum,
      }
    ]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemPrice('');
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(rawValue)) {
      rawValue = rawValue.replace(/^0+(?=\d)/, '');
      setNewItemPrice(rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
  };

  const handleRemoveBillingItem = (id: number) => {
    setBillingItems(billingItems.filter(item => item.id !== id));
  };

  const billingSubtotal = billingItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const billingTaxAmount = (billingSubtotal * billingTax) / 100;
  const billingTotal = billingSubtotal + billingTaxAmount - billingDiscount;

  // ==================== BIỂU MẪU STATES & DATA ====================
  const [formSearch, setFormSearch] = useState('');
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [legalForms, setLegalForms] = useState<any[]>([]);

  // ==================== BẢN ÁN STATES & DATA ====================
  const [judgmentSearch, setJudgmentSearch] = useState('');
  const [selectedJudgment, setSelectedJudgment] = useState<any | null>(null);
  const [judgments, setJudgments] = useState<any[]>([]);

  // ==================== ÁN LỆ STATES & DATA ====================
  const [precedentSearch, setPrecedentSearch] = useState('');
  const [selectedPrecedent, setSelectedPrecedent] = useState<any | null>(null);
  const [precedents, setPrecedents] = useState<any[]>([]);

  useEffect(() => {
    // Fetch legal forms
    fetch('/api/cms/legal-forms')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLegalForms(data); })
      .catch(err => console.error("Error fetching legal forms:", err));

    // Fetch judgments
    fetch('/api/cms/judgments')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setJudgments(data); })
      .catch(err => console.error("Error fetching judgments:", err));

    // Fetch precedents
    fetch('/api/cms/precedents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(p => ({
            ...p,
            approvedDate: p.approved_date || p.approvedDate,
            lawIssue: p.law_issue || p.lawIssue
          }));
          setPrecedents(mapped);
        }
      })
      .catch(err => console.error("Error fetching precedents:", err));

    // Fetch land prices
    fetch('/api/cms/land-prices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLandPrices(data);
        }
      })
      .catch(err => console.error("Error fetching land prices:", err));
  }, []);

  const filteredForms = legalForms.filter(f => f.title.toLowerCase().includes(formSearch.toLowerCase()) || f.description.toLowerCase().includes(formSearch.toLowerCase()));
  const filteredJudgments = judgments.filter(j => j.title.toLowerCase().includes(judgmentSearch.toLowerCase()) || j.code.toLowerCase().includes(judgmentSearch.toLowerCase()));
  const filteredPrecedents = precedents.filter(p => p.title.toLowerCase().includes(precedentSearch.toLowerCase()) || p.code.toLowerCase().includes(precedentSearch.toLowerCase()));

  // ==================== BẢNG GIÁ ĐẤT & DIỆN TÍCH TÁCH THỬA DYNAMIC STATES ====================
  const [landPrices, setLandPrices] = useState<any[]>([]);
  const [subdivisionLimits, setSubdivisionLimits] = useState<any[]>([]);
  const [landSubTab, setLandSubTab] = useState<'prices' | 'subdivision' | 'query_docs'>('prices');
  const [landDocuments, setLandDocuments] = useState<any[]>([]);

  // Q&A land documents states
  const [selectedDocProvince, setSelectedDocProvince] = useState<string>('Thành phố Hà Nội');
  const [docQueryText, setDocQueryText] = useState<string>('');
  const [docQueryAnswer, setDocQueryAnswer] = useState<string>('');
  const [isQueryingDocs, setIsQueryingDocs] = useState<boolean>(false);

  // Land prices search states
  const [selectedPriceProvince, setSelectedPriceProvince] = useState<string>('Thành phố Hà Nội');
  const [selectedPriceWard, setSelectedPriceWard] = useState<string>('');
  const [priceSearchQuery, setPriceSearchQuery] = useState<string>('');
  const [selectedPriceItem, setSelectedPriceItem] = useState<any | null>(null);
  const [landAreaForCalc, setLandAreaForCalc] = useState<string>('100');
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);

  // Subdivision regulations search states
  const [selectedLimitProvince, setSelectedLimitProvince] = useState<string>('Thành phố Hà Nội');
  const [selectedLimitWard, setSelectedLimitWard] = useState<string>('');

  useEffect(() => {
    // Fetch land prices
    fetch('/api/cms/land-prices')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLandPrices(data); })
      .catch(err => console.error("Error fetching land prices:", err));

    // Fetch subdivision limits
    fetch('/api/cms/subdivision-limits')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSubdivisionLimits(data); })
      .catch(err => console.error("Error fetching subdivision limits:", err));

    // Fetch land documents
    fetch('/api/cms/land-documents')
      .then(res => res.json())
      .then(resData => { if (resData && Array.isArray(resData.data)) setLandDocuments(resData.data); })
      .catch(err => console.error("Error fetching land documents:", err));
  }, []);

  const normalizeLocalityName = (name: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/^(thành phố|tỉnh|quận|huyện|thị xã|thị trấn|phường|xã)\s+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isMatchLocality = (dbName: string, selectedName: string) => {
    if (!dbName || !selectedName) return false;
    return normalizeLocalityName(dbName) === normalizeLocalityName(selectedName);
  };

  // Auto-set default price ward when province changes
  useEffect(() => {
    setSelectedPriceWard('');
    setSelectedPriceItem(null);
    setPriceSearchQuery('');
  }, [selectedPriceProvince]);

  // Auto-set default limit ward when province changes
  useEffect(() => {
    setSelectedLimitWard('');
  }, [selectedLimitProvince]);

  // Compute calculated cost when area or selected item changes
  useEffect(() => {
    if (!selectedPriceItem) {
      setCalculatedCost(null);
      return;
    }
    const rawPrice = Number(selectedPriceItem.price) || 0;
    const area = Number(landAreaForCalc) || 0;
    setCalculatedCost(rawPrice * area);
  }, [selectedPriceItem, landAreaForCalc]);

  // Dynamic lists of provinces extracted from static PROVINCES_DATA
  const priceProvinces = useMemo(() => {
    return PROVINCES_DATA.map(p => p.FullName);
  }, []);

  const limitProvinces = useMemo(() => {
    return PROVINCES_DATA.map(p => p.FullName);
  }, []);

  // Dynamic lists of wards for current selections
  const priceWards = useMemo(() => {
    const prov = PROVINCES_DATA.find(p => p.FullName === selectedPriceProvince);
    return prov ? prov.Wards.map(w => w.FullName) : [];
  }, [selectedPriceProvince]);

  const limitWards = useMemo(() => {
    const prov = PROVINCES_DATA.find(p => p.FullName === selectedLimitProvince);
    return prov ? prov.Wards.map(w => w.FullName) : [];
  }, [selectedLimitProvince]);

  // Autocomplete suggestions based on current query
  const priceSuggestions = useMemo(() => {
    if (!priceSearchQuery.trim()) return [];
    const queryWords = priceSearchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (queryWords.length === 0) return [];

    return landPrices.filter(item => {
      if (item.is_approved === 0) return false;
      if (!isMatchLocality(item.province_name, selectedPriceProvince)) return false;
      if (selectedPriceWard && !isMatchLocality(item.ward_name, selectedPriceWard)) return false;

      const streetLower = (item.street_name || '').toLowerCase();
      const districtLower = (item.district_name || '').toLowerCase();
      const wardLower = (item.ward_name || '').toLowerCase();
      const textToSearch = `${streetLower} ${districtLower} ${wardLower}`;

      return queryWords.some(word => textToSearch.includes(word));
    }).slice(0, 15);
  }, [priceSearchQuery, selectedPriceProvince, selectedPriceWard, landPrices]);

  return (
    <div className={isERP ? "" : "bg-[#FAF9F6] min-h-screen"}>
      {/* Page Hero Header Banner */}
      {!isERP && (
        <div className="relative bg-[var(--color-primary)] text-white py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,var(--color-accent),transparent_60%)]" />
          <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <nav className="flex items-center justify-center lg:justify-start gap-2 text-xs md:text-sm text-white/60 mb-3 font-semibold uppercase tracking-wider">
                  <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigateTo('/')}>Trang chủ</span>
                  <ChevronRight size={12} />
                  <span className="text-[var(--color-accent)]">Công cụ pháp lý</span>
                </nav>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                  Công Cụ Tính Toán & Tài Liệu Pháp Lý
                </h1>
                <p className="text-white/80 text-sm md:text-base max-w-2xl leading-relaxed">
                  Hệ thống công cụ hỗ trợ người dân và doanh nghiệp dự tính án phí, lập bảng kê chi phí, tra cứu biểu mẫu pháp luật, án lệ và tính giá đất nhà nước nhanh chóng, chính xác.
                </p>
              </div>
              <div className="shrink-0 flex items-center justify-center gap-3">
                <a href={`tel:${settings.hotline_consult.replace(/\s+/g, '')}`} className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-slate-900 font-bold rounded-xl shadow-lg transition-all text-sm">
                  <Phone size={16} className="fill-transparent stroke-[2.5]" />
                  <span>{settings.hotline_consult}</span>
                </a>
                <button onClick={() => navigateTo('/lien-he')} className="px-6 py-3 border border-white/20 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm">
                  Yêu cầu trợ giúp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout with Sticky Left Sidebar */}
      <div className={isERP ? "py-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16"}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar Navigation (3 cols) */}
          {!isERP && (
            <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 whitespace-nowrap scrollbar-none">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSelectedForm(null);
                        setSelectedJudgment(null);
                        setSelectedPrecedent(null);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs xl:text-sm font-bold transition-all w-full text-left cursor-pointer ${
                        isSelected 
                          ? 'bg-[var(--color-primary)] text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)]'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-[var(--color-accent)]' : 'text-slate-400'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden lg:block bg-gradient-to-br from-slate-800 to-slate-950 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                <h4 className="font-serif font-bold text-base mb-2 text-white">Bạn cần Luật sư hỗ trợ?</h4>
                <p className="text-white/75 text-xs leading-relaxed mb-4">
                  Nếu kết quả tính toán hoặc mẫu biểu chưa đáp ứng đủ trường hợp đặc thù của bạn, hãy gửi yêu cầu tư vấn chuyên sâu cho chúng tôi.
                </p>
                <button 
                  onClick={() => navigateTo('/lien-he')}
                  className="w-full py-2.5 bg-white text-slate-950 hover:bg-[var(--color-accent)] hover:text-slate-900 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Tư vấn trực tiếp với Luật sư</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: Tab Views (12 cols in ERP, 9 cols otherwise) */}
          <div className={`${isERP ? 'lg:col-span-12' : 'lg:col-span-9'} bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg border border-slate-100 min-h-[550px]`}>
            {isERP && (
              <div className="mb-6 border-b border-slate-100 pb-2">
                <div className="flex flex-wrap gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSelectedForm(null);
                          setSelectedJudgment(null);
                          setSelectedPrecedent(null);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-white shadow-sm'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={14} className={isSelected ? 'text-[var(--color-accent)]' : 'text-slate-400'} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              
              {/* 0. PDF DOCUMENT SCANNER VIEW */}
              {activeTab === 'pdf_scanner' && (
                <motion.div
                  key="pdf_scanner"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <DocumentScanner />
                </motion.div>
              )}

              {/* 1. COURT FEE CALCULATOR VIEW */}
              {activeTab === 'fee' && (
                <motion.div
                  key="fee"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <CourtFeeCalculator isEmbedded={true} />
                </motion.div>
              )}

              {/* 2. BILLING & OVERDUE INTEREST CALCULATORS (Bảng kê chi phí & nợ) */}
              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Mode switcher tabs */}
                  <div className="flex border-b border-slate-200 gap-6 mb-6">
                    <button
                      onClick={() => setBillingMode('debt')}
                      className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                        billingMode === 'debt'
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <FileSpreadsheet size={16} />
                      Lập bảng kê nợ & lãi quá hạn
                    </button>
                    <button
                      onClick={() => setBillingMode('costs')}
                      className={`pb-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                        billingMode === 'costs'
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Calculator size={16} />
                      Bảng kê chi phí pháp lý
                    </button>
                  </div>

                  {/* ======================================================== */}
                  {/* MODE 1: LẬP BẢNG KÊ DƯ NỢ & LÃI QUÁ HẠN (USER REQUESTED) */}
                  {/* ======================================================== */}
                  {billingMode === 'debt' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-2">
                        <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.15em] block">Công cụ tài chính pháp lý</span>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-primary)]">Lập Bảng Kê Dư Nợ & Lãi Quá Hạn</h2>
                        <div className="h-1 w-20 bg-[var(--color-accent)] rounded-full" />
                      </div>

                      <p className="text-slate-500 text-sm leading-relaxed">
                        Hệ thống tự động tính toán chính xác số ngày quá hạn và tiền lãi phát sinh lũy kế theo thời gian thực (hỗ trợ các phương thức tính lãi theo Năm, Tháng, hoặc Ngày). Hãy nhập hóa đơn/hợp đồng dưới đây, chọn ngày chốt tính lãi để kết xuất bảng kê chuẩn phục vụ đàm phán hoặc khởi kiện.
                      </p>

                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng nợ gốc</span>
                          <span className="text-base sm:text-lg font-mono font-bold text-slate-800 mt-1">{formatVND(totalDebtPrincipal)}</span>
                        </div>
                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Tổng lãi quá hạn</span>
                          <span className="text-base sm:text-lg font-mono font-bold text-amber-700 mt-1">{formatVND(totalDebtInterest)}</span>
                        </div>
                        <div className="bg-[var(--color-primary)]/5 p-4 rounded-xl border border-[var(--color-primary)]/10 flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">Tổng dư nợ cả gốc & lãi</span>
                          <span className="text-base sm:text-lg font-mono font-bold text-[var(--color-primary)] mt-1">{formatVND(totalDebtSum)}</span>
                        </div>
                      </div>

                      {/* Control Panel: Chốt ngày tính lãi */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                          <Info size={16} className="text-[var(--color-primary)] shrink-0" />
                          <span>Mặc định chốt tính lãi đến <strong>Ngày hiện tại</strong>. Có thể thay đổi để ước tính:</span>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <label className="text-xs font-bold text-slate-500 uppercase shrink-0">Ngày chốt tính lãi:</label>
                          <input
                            type="date"
                            required
                            value={debtEndDate}
                            onChange={(e) => setDebtEndDate(e.target.value)}
                            className="text-xs sm:text-sm px-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[var(--color-primary)] font-medium font-mono text-slate-800 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Form: Add Debt Item */}
                      <form onSubmit={handleAddDebtItem} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">Thêm khoản nợ mới vào bảng kê</h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số hóa đơn / Hợp đồng / Chứng từ</label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: Hợp đồng 01/HDMB..."
                              value={debtRef}
                              onChange={(e) => setDebtRef(e.target.value)}
                              className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-medium"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số nợ gốc (VNĐ)</label>
                            <input
                              type="text"
                              required
                              placeholder="0"
                              value={debtPrincipal}
                              onChange={handleDebtPrincipalChange}
                              className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-right font-mono font-semibold text-slate-800"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày bắt đầu quá hạn</label>
                            <input
                              type="date"
                              required
                              value={debtStartDate}
                              onChange={(e) => setDebtStartDate(e.target.value)}
                              className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-mono"
                            />
                          </div>
                          <div className="md:col-span-1.5 md:w-28">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lãi suất (%)</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              placeholder="Ví dụ: 8.5"
                              value={debtRate}
                              onChange={(e) => setDebtRate(e.target.value)}
                              className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-center font-mono"
                            />
                          </div>
                          <div className="md:col-span-1.5 md:w-28">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Đơn vị lãi</label>
                            <select
                              value={debtRateType}
                              onChange={(e) => setDebtRateType(e.target.value as 'year' | 'month' | 'day')}
                              className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-semibold text-slate-700 bg-none"
                            >
                              <option value="year">/ Năm</option>
                              <option value="month">/ Tháng</option>
                              <option value="day">/ Ngày</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                          >
                            <Plus size={14} /> Thêm khoản nợ
                          </button>
                        </div>
                      </form>

                      {/* Debt Listing Table */}
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="py-3 px-4">STT</th>
                                <th className="py-3 px-4">Hóa đơn / Hợp đồng</th>
                                <th className="py-3 px-4 text-right">Số nợ gốc</th>
                                <th className="py-3 px-4 text-center">Bắt đầu quá hạn</th>
                                <th className="py-3 px-4 text-center">Chốt chênh lệch</th>
                                <th className="py-3 px-4 text-center">Số ngày</th>
                                <th className="py-3 px-4 text-center">Lãi suất</th>
                                <th className="py-3 px-4 text-right">Lãi phát sinh</th>
                                <th className="py-3 px-4 text-right">Cộng dồn dư nợ</th>
                                <th className="py-3 px-4 text-center">Xóa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {debtItems.length > 0 ? (
                                debtItems.map((item, idx) => {
                                  const days = calculateDays(item.overdueStartDate, debtEndDate);
                                  const interest = calculateInterest(item.principal, item.overdueStartDate, debtEndDate, item.rate, item.rateType);
                                  const total = item.principal + interest;
                                  return (
                                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                      <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                                      <td className="py-3 px-4 text-slate-800 font-semibold">{item.reference}</td>
                                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">{formatVND(item.principal)}</td>
                                      <td className="py-3 px-4 text-center font-mono text-slate-500">{item.overdueStartDate}</td>
                                      <td className="py-3 px-4 text-center font-mono text-slate-500">{debtEndDate}</td>
                                      <td className="py-3 px-4 text-center font-bold text-slate-700 font-mono">{days} ngày</td>
                                      <td className="py-3 px-4 text-center font-medium text-slate-600 font-mono">{item.rate}% ({item.rateType === 'year' ? 'Năm' : item.rateType === 'month' ? 'Tháng' : 'Ngày'})</td>
                                      <td className="py-3 px-4 text-right font-bold text-amber-700 font-mono">{formatVND(interest)}</td>
                                      <td className="py-3 px-4 text-right font-bold text-[var(--color-primary)] font-mono">{formatVND(total)}</td>
                                      <td className="py-3 px-4 text-center">
                                        <button
                                          onClick={() => handleRemoveDebtItem(item.id)}
                                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                                    Bảng kê trống. Vui lòng thêm các khoản nợ quá hạn ở trên để bắt đầu tính toán.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Total bottom drawer */}
                        {debtItems.length > 0 && (
                          <div className="bg-slate-50 p-5 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <span className="text-xs text-slate-500 font-medium">
                              Số liệu bảng kê được chốt tự động từ các hóa đơn chi tiết. Định dạng xuất excel tương thích tốt nhất với bộ gõ Unicode Tiếng Việt.
                            </span>
                            <div className="w-full md:w-auto flex flex-col items-end space-y-1 text-right font-serif font-bold text-slate-800 text-sm">
                              <div className="flex justify-between w-full md:justify-end gap-8 text-xs text-slate-500 font-sans font-semibold">
                                <span>Cộng gốc:</span>
                                <span className="font-mono">{formatVND(totalDebtPrincipal)}</span>
                              </div>
                              <div className="flex justify-between w-full md:justify-end gap-8 text-xs text-amber-700 font-sans font-semibold">
                                <span>Cộng lãi quá hạn:</span>
                                <span className="font-mono">{formatVND(totalDebtInterest)}</span>
                              </div>
                              <div className="flex justify-between w-full md:justify-end gap-8 text-base text-[var(--color-primary)] border-t border-slate-200 pt-2 mt-1">
                                <span>TỔNG DƯ NỢ CẦN THU HỒI:</span>
                                <span className="font-mono">{formatVND(totalDebtSum)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {debtItems.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                          <button
                            onClick={handleResetDebtItems}
                            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-red-200"
                          >
                            <RefreshCw size={14} /> Xóa tất cả & Đặt lại
                          </button>
                          <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <Printer size={14} /> In bảng kê nợ
                          </button>
                          <button
                            onClick={exportDebtToCSV}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <Download size={14} /> Xuất File Excel (BOM CSV)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* MODE 2: BẢNG KÊ CHI PHÍ & LỆ PHÍ PHÁP LÝ (ORIGINAL CHANNELS) */}
                  {/* ======================================================== */}
                  {billingMode === 'costs' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-2">
                        <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.15em] block">Lập bảng kê chi phí vụ việc</span>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-primary)]">Bảng Kê Chi Phí & Lệ Phí Pháp Lý</h2>
                        <div className="h-1 w-20 bg-[var(--color-accent)] rounded-full" />
                      </div>

                      <p className="text-slate-500 text-sm leading-relaxed">
                        Công cụ giúp người dân, doanh nghiệp hoặc luật sư tự lập danh sách, cộng dồn toàn bộ thù lao, lệ phí tòa án, chi phí dịch vụ pháp lý và xuất bản bảng kê hoàn chỉnh để lưu trữ hoặc gửi khách hàng.
                      </p>

                      {/* Add Row Form */}
                      <form onSubmit={handleAddBillingItem} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nội dung chi phí</label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Lệ phí công chứng ủy quyền..."
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số lượng</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(Number(e.target.value))}
                            className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-center"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Đơn giá (VNĐ)</label>
                          <input
                            type="text"
                            required
                            placeholder="0"
                            value={newItemPrice}
                            onChange={handlePriceInputChange}
                            className="w-full text-xs sm:text-sm px-3 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-right font-medium"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer h-10 shadow"
                          >
                            <Plus size={14} /> Thêm dòng
                          </button>
                        </div>
                      </form>

                      {/* Billing Table */}
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                <th className="py-3 px-4">STT</th>
                                <th className="py-3 px-4">Nội dung chi phí</th>
                                <th className="py-3 px-4 text-center">SL</th>
                                <th className="py-3 px-4 text-right">Đơn giá</th>
                                <th className="py-3 px-4 text-right">Thành tiền</th>
                                <th className="py-3 px-4 text-center">Xóa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {billingItems.length > 0 ? (
                                billingItems.map((item, idx) => (
                                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                                    <td className="py-3 px-4 text-slate-800 font-semibold">{item.desc}</td>
                                    <td className="py-3 px-4 text-center font-semibold text-slate-600">{item.qty}</td>
                                    <td className="py-3 px-4 text-right font-medium text-slate-600">{formatVND(item.price)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(item.qty * item.price)}</td>
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        onClick={() => handleRemoveBillingItem(item.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="py-12 text-center text-slate-400">
                                    Bảng kê trống. Vui lòng thêm nội dung chi phí phía trên.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Calculations Summary block */}
                        {billingItems.length > 0 && (
                          <div className="bg-slate-50 p-5 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-4">
                                <label className="text-xs font-semibold text-slate-500 w-24">Thuế VAT (%):</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={billingTax}
                                  onChange={(e) => setBillingTax(Number(e.target.value))}
                                  className="w-20 text-xs px-2 py-1 border border-slate-200 bg-white rounded-lg focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="text-xs font-semibold text-slate-500 w-24">Giảm trừ trực tiếp:</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={billingDiscount}
                                  onChange={(e) => setBillingDiscount(Number(e.target.value))}
                                  className="w-32 text-xs px-2 py-1 border border-slate-200 bg-white rounded-lg focus:outline-none text-right font-medium"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col justify-end space-y-1.5 text-right font-semibold text-xs sm:text-sm text-slate-600">
                              <div className="flex justify-between md:justify-end gap-10">
                                <span>Cộng tiền chưa thuế:</span>
                                <span className="text-slate-900">{formatVND(billingSubtotal)}</span>
                              </div>
                              <div className="flex justify-between md:justify-end gap-10">
                                <span>Thuế VAT ({billingTax}%):</span>
                                <span className="text-slate-900">{formatVND(billingTaxAmount)}</span>
                              </div>
                              {billingDiscount > 0 && (
                                <div className="flex justify-between md:justify-end gap-10 text-emerald-600">
                                  <span>Số tiền giảm trừ:</span>
                                  <span>-{formatVND(billingDiscount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between md:justify-end gap-10 text-base font-serif font-bold text-[var(--color-primary)] border-t border-slate-200 pt-2 mt-1">
                                <span>TỔNG CỘNG THANH TOÁN:</span>
                                <span>{formatVND(billingTotal)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Print / Action Buttons */}
                      {billingItems.length > 0 && (
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <Printer size={14} /> In bảng kê này
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* 3. LEGAL FORMS VIEW (Biểu mẫu pháp lý) */}
              {activeTab === 'forms' && (
                <motion.div
                  key="forms"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.15em] block">Thư viện biểu mẫu quốc gia</span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-primary)]">Biểu Mẫu Pháp Lý Chuẩn Tố Tụng</h2>
                    <div className="h-1 w-20 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed">
                    Hệ thống biểu mẫu đơn khởi kiện, giấy ủy quyền, đơn xin ly hôn được ban hành chuẩn theo nghị quyết của Hội đồng Thẩm phán Tòa án nhân dân Tối cao. Bạn có thể xem nhanh, sao chép văn bản hoặc tải về sử dụng.
                  </p>

                  <AnimatePresence mode="wait">
                    {!selectedForm ? (
                      <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        {/* Search Box */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Tìm kiếm biểu mẫu (Ví dụ: Đơn khởi kiện, ly hôn...)"
                            value={formSearch}
                            onChange={(e) => setFormSearch(e.target.value)}
                            className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] bg-slate-50/50 shadow-inner"
                          />
                          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Forms Grid List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredForms.length > 0 ? (
                            filteredForms.map((form) => (
                              <div key={form.id} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all flex flex-col justify-between">
                                <div className="space-y-2">
                                  <span className="text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{form.category}</span>
                                  <h4 className="font-serif font-bold text-slate-900 text-sm leading-tight">{form.title}</h4>
                                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{form.description}</p>
                                </div>
                                <button
                                  onClick={() => setSelectedForm(form)}
                                  className="mt-4 w-full py-2 bg-slate-50 hover:bg-[var(--color-accent)] text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                                >
                                  Xem & Sao chép nội dung
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                              Không tìm thấy biểu mẫu pháp lý nào khớp với từ khóa tìm kiếm.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <button
                            onClick={() => setSelectedForm(null)}
                            className="text-xs text-slate-500 hover:text-[var(--color-primary)] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            ← Trở lại danh sách
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => triggerCopy(selectedForm.content, selectedForm.id)}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                            >
                              {copiedId === selectedForm.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              <span>{copiedId === selectedForm.id ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const blob = new Blob([selectedForm.content], { type: 'text/plain;charset=utf-8' });
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = `${selectedForm.title}.txt`;
                                link.click();
                              }}
                              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download size={14} />
                              <span>Tải về .txt</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{selectedForm.category}</span>
                          <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">{selectedForm.title}</h3>
                          <p className="text-slate-500 text-xs leading-relaxed">{selectedForm.description}</p>
                        </div>

                        <div className="bg-slate-950 text-slate-200 p-6 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed border border-slate-800 shadow-lg max-h-[420px] overflow-y-auto">
                          {selectedForm.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* 4. JUDGMENTS VIEW (Bản án công bố) */}
              {activeTab === 'judgments' && (
                <motion.div
                  key="judgments"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.15em] block">Cổng công bố bản án tòa án</span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-primary)]">Hệ Thống Bản Án Tham Khảo</h2>
                    <div className="h-1 w-20 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed">
                    Tổng hợp và lưu hành các quyết định xét xử, bản án sơ thẩm, phúc thẩm đã có hiệu lực thi hành pháp luật trên toàn quốc nhằm giúp độc giả tham chiếu định hướng pháp lý chuẩn xác cho vụ việc tương tự.
                  </p>

                  <AnimatePresence mode="wait">
                    {!selectedJudgment ? (
                      <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        {/* Search Box */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Tìm kiếm số hiệu bản án hoặc nội dung (Ví dụ: đặt cọc, nợ hàng...)"
                            value={judgmentSearch}
                            onChange={(e) => setJudgmentSearch(e.target.value)}
                            className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] bg-slate-50/50 shadow-inner"
                          />
                          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Judgments Cards Grid */}
                        <div className="grid grid-cols-1 gap-4">
                          {filteredJudgments.length > 0 ? (
                            filteredJudgments.map((j) => (
                              <div key={j.id} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1.5 md:max-w-[75%]">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{j.code}</span>
                                    <span className="text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{j.category}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{j.date}</span>
                                  </div>
                                  <h4 className="font-serif font-bold text-slate-900 text-sm sm:text-base leading-snug">{j.title}</h4>
                                  <p className="text-slate-400 text-[11px] font-medium">{j.court}</p>
                                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{j.summary}</p>
                                </div>
                                <button
                                  onClick={() => setSelectedJudgment(j)}
                                  className="py-2.5 px-4 bg-slate-900 hover:bg-[var(--color-primary)] text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap text-center"
                                >
                                  Đọc bản án đầy đủ
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                              Không tìm thấy bản án công bố nào phù hợp.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <button
                            onClick={() => setSelectedJudgment(null)}
                            className="text-xs text-slate-500 hover:text-[var(--color-primary)] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            ← Trở lại danh sách bản án
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => triggerCopy(selectedJudgment.content, selectedJudgment.id)}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                            >
                              {copiedId === selectedJudgment.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              <span>{copiedId === selectedJudgment.id ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">{selectedJudgment.code}</span>
                            <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{selectedJudgment.category}</span>
                            <span className="text-xs text-slate-400 font-semibold">{selectedJudgment.date}</span>
                          </div>
                          <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">{selectedJudgment.title}</h3>
                          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{selectedJudgment.court}</p>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 italic text-slate-600 text-xs sm:text-sm">
                            <strong>Nội dung tóm tắt:</strong> {selectedJudgment.summary}
                          </div>
                        </div>

                        <div className="bg-slate-950 text-slate-200 p-6 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed border border-slate-800 shadow-lg max-h-[420px] overflow-y-auto">
                          {selectedJudgment.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* 5. PRECEDENTS VIEW (Án lệ Tối cao) */}
              {activeTab === 'precedents' && (
                <motion.div
                  key="precedents"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.15em] block">Hệ thống án lệ tối cao</span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-primary)]">Án Lệ Tòa Án Nhân Dân Tối Cao</h2>
                    <div className="h-1 w-20 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed">
                    Tra cứu hệ thống các án lệ chính thức được Hội đồng Thẩm phán Tòa án nhân dân Tối cao tuyển chọn và công bố, áp dụng bắt buộc trong thực tế tranh tụng pháp đình nhằm chuẩn hóa giải pháp pháp lý.
                  </p>

                  <AnimatePresence mode="wait">
                    {!selectedPrecedent ? (
                      <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        {/* Search Box */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Tìm kiếm án lệ (Ví dụ: côn đồ, người Việt kiều, viết tay...)"
                            value={precedentSearch}
                            onChange={(e) => setPrecedentSearch(e.target.value)}
                            className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] bg-slate-50/50 shadow-inner"
                          />
                          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Precedents cards */}
                        <div className="grid grid-cols-1 gap-4">
                          {filteredPrecedents.length > 0 ? (
                            filteredPrecedents.map((p) => (
                              <div key={p.id} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all flex flex-col justify-between gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-white bg-[var(--color-primary)] px-2.5 py-0.5 rounded-full">{p.code}</span>
                                    <span className="text-xs text-slate-400 font-semibold">Công bố: {p.approvedDate}</span>
                                  </div>
                                  <h4 className="font-serif font-bold text-slate-900 text-sm sm:text-base leading-snug">{p.title}</h4>
                                  <p className="text-slate-500 text-xs leading-relaxed">{p.summary}</p>
                                </div>
                                <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                                  <span className="text-[10px] text-slate-400 font-medium italic">Hội đồng Thẩm phán TAND Tối cao thông qua</span>
                                  <button
                                    onClick={() => setSelectedPrecedent(p)}
                                    className="text-xs text-[var(--color-primary)] font-bold hover:text-[var(--color-accent)] transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    Xem chi tiết án lệ →
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                              Không tìm thấy án lệ nào khớp với từ khóa của bạn.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-5"
                      >
                        <button
                          onClick={() => setSelectedPrecedent(null)}
                          className="text-xs text-slate-500 hover:text-[var(--color-primary)] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          ← Trở lại danh sách án lệ
                        </button>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white bg-[var(--color-primary)] px-3 py-0.5 rounded-full">{selectedPrecedent.code}</span>
                            <span className="text-xs text-slate-400 font-semibold">Công bố: {selectedPrecedent.approvedDate}</span>
                          </div>
                          <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl leading-snug">{selectedPrecedent.title}</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-2">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Khái quát nội dung án lệ:</h4>
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{selectedPrecedent.summary}</p>
                          </div>

                          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                            <h4 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">Tình huống pháp lý:</h4>
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold">{selectedPrecedent.lawIssue}</p>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Giải pháp pháp lý giải quyết:</h4>
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic font-medium">{selectedPrecedent.solution}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* 6. STATE LAND PRICE & SUBDIVISION LIMITS VIEW (Bảng giá đất & Tách thửa) */}
              {activeTab === 'land' && (
                <motion.div
                  key="land"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <span className="text-[var(--color-accent)] font-bold text-xs uppercase tracking-[0.15em] block">Công cụ đất đai nhà nước</span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--color-primary)]">Bảng Giá Đất & Hạn Mức Tách Thửa</h2>
                    <div className="h-1 w-20 bg-[var(--color-accent)] rounded-full" />
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed">
                    Hệ thống tra cứu tự động bảng giá đất Nhà nước của 34 tỉnh thành và các hạn mức đất ở, diện tích tách thửa tối thiểu theo từng xã/phường/thị trấn mới sáp nhập.
                  </p>

                  {/* Secondary Sub-Tabs */}
                  <div className="flex border-b border-slate-200 gap-6 mb-6">
                    <button
                      onClick={() => setLandSubTab('prices')}
                      className={`pb-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                        landSubTab === 'prices'
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Map size={16} /> Tra cứu Bảng giá đất
                    </button>
                    <button
                      onClick={() => setLandSubTab('subdivision')}
                      className={`pb-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                        landSubTab === 'subdivision'
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Scale size={16} /> Diện tích tách thửa & Hạn mức đất ở
                    </button>
                    <button
                      onClick={() => setLandSubTab('query_docs')}
                      className={`pb-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                        landSubTab === 'query_docs'
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Sparkles size={16} /> Hỏi đáp CSDL Tài liệu địa phương
                    </button>
                  </div>

                  {/* ==================== SUB-TAB 1: TRA CỨU BẢNG GIÁ ĐẤT ==================== */}
                  {landSubTab === 'prices' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tỉnh / Thành phố</label>
                            <SelectWithSearch
                              value={selectedPriceProvince}
                              onChange={(val) => setSelectedPriceProvince(val)}
                              options={priceProvinces}
                              placeholder="Chọn Tỉnh / Thành phố..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phường / Xã / Thị trấn</label>
                            <SelectWithSearch
                              value={selectedPriceWard}
                              onChange={(val) => {
                                setSelectedPriceWard(val);
                                setSelectedPriceItem(null);
                                setPriceSearchQuery('');
                              }}
                              options={[
                                { label: "-- Tất cả xã/phường --", value: "" },
                                ...priceWards
                              ]}
                              placeholder="-- Tất cả xã/phường --"
                            />
                          </div>
                        </div>

                        {(() => {
                          const provinceDocs = landDocuments.filter(d => isMatchLocality(d.province_name, selectedPriceProvince));
                          if (provinceDocs.length > 0) {
                            return (
                              <div className="p-3 bg-indigo-50/70 text-indigo-900 text-xs rounded-xl border border-indigo-100 flex items-center justify-between gap-3 font-medium">
                                <div className="flex items-center gap-2">
                                  <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                                  <span>
                                    Hệ thống có <strong>{provinceDocs.length} tài liệu gốc</strong> cho {selectedPriceProvince} trong cơ sở dữ liệu. Bạn có thể dùng tính năng Hỏi đáp để tra cứu chi tiết.
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDocProvince(selectedPriceProvince);
                                    setLandSubTab('query_docs');
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition-all text-[10px] uppercase whitespace-nowrap cursor-pointer"
                                >
                                  Hỏi đáp tài liệu →
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Search keyword block */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nhập từ khóa tìm kiếm địa chỉ / địa danh / tuyến đường</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={priceSearchQuery}
                              onChange={(e) => setPriceSearchQuery(e.target.value)}
                              placeholder="Ví dụ: Đinh Tiên Hoàng, Bạch Đằng, Nguyễn Huệ..."
                              className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] bg-white shadow-sm"
                            />
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            * Chỉ cần nhập trùng một vài từ viết liền không dấu hoặc có dấu để hiển thị nhanh danh sách gợi ý.
                          </p>
                        </div>
                      </div>

                      {/* Autocomplete Proposal Suggestions list */}
                      {priceSuggestions.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 z-10 relative">
                          <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">Gợi ý địa chỉ tìm được:</div>
                          {priceSuggestions.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setSelectedPriceItem(item);
                                setPriceSearchQuery('');
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs sm:text-sm flex items-center justify-between gap-4 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-[var(--color-primary)] shrink-0" />
                                <span className="font-semibold text-slate-800">{item.street_name}</span>
                                <span className="text-slate-400 text-xs">- {item.ward_name} ({item.district_name})</span>
                              </div>
                              <span className="text-emerald-600 font-bold shrink-0">Chọn xem →</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Detail pricing result */}
                      <AnimatePresence mode="wait">
                        {selectedPriceItem ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2"
                          >
                            {/* Visual Display Prices Card */}
                            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Báo cáo chi tiết giá đất
                                </span>
                                <span className="text-xs text-slate-400 font-semibold">{selectedPriceItem.province_name}</span>
                              </div>

                              <div className="space-y-1">
                                <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">
                                  {selectedPriceItem.street_name}
                                </h3>
                                <p className="text-slate-500 text-xs font-semibold">
                                  {selectedPriceItem.ward_name} - {selectedPriceItem.district_name || 'Quận/Huyện'}
                                </p>
                              </div>

                              {/* Grid of four main categories */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="p-4 bg-red-50/40 rounded-xl border border-red-100">
                                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Giá đất ở</span>
                                  <span className="text-base font-bold text-slate-800 mt-1 block">
                                    {selectedPriceItem.residential_price || (selectedPriceItem.price ? formatVND(selectedPriceItem.price) : 'Chưa cập nhật')}
                                  </span>
                                </div>

                                <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100">
                                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Thương mại dịch vụ</span>
                                  <span className="text-base font-bold text-slate-800 mt-1 block">
                                    {selectedPriceItem.commercial_price || 'Chưa cập nhật'}
                                  </span>
                                </div>

                                <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100">
                                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Đất phi nông nghiệp</span>
                                  <span className="text-base font-bold text-slate-800 mt-1 block">
                                    {selectedPriceItem.non_agricultural_price || 'Chưa cập nhật'}
                                  </span>
                                </div>

                                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Đất nông nghiệp</span>
                                  <span className="text-base font-bold text-slate-800 mt-1 block">
                                    {selectedPriceItem.agricultural_price || 'Chưa cập nhật'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Cost Calculator Card */}
                            <div className="lg:col-span-5 h-full">
                              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl h-full flex flex-col justify-between border border-slate-800 shadow-md">
                                <div className="space-y-4">
                                  <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider block">Dự toán thuế sơ bộ</span>
                                  <h4 className="font-serif font-bold text-white text-base leading-tight">Tính Giá Trị Thửa Đất Theo Diện Tích</h4>
                                  
                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Diện tích thửa đất (m²):</label>
                                    <input
                                      type="number"
                                      value={landAreaForCalc}
                                      onChange={(e) => setLandAreaForCalc(e.target.value)}
                                      className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-700 rounded-lg outline-none bg-slate-800 text-white focus:border-[var(--color-accent)] font-mono font-semibold"
                                      placeholder="100"
                                    />
                                  </div>
                                </div>

                                <div className="pt-6 border-t border-slate-800 mt-6 space-y-2">
                                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tổng giá trị định giá ước tính:</span>
                                  <div className="text-2xl font-serif font-bold text-[var(--color-accent)] break-all font-mono">
                                    {calculatedCost !== null && calculatedCost > 0 ? formatVND(calculatedCost) : '--- VNĐ'}
                                  </div>
                                  <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                                    * Giá dự tính sơ bộ dựa trên diện tích nhân đơn giá đất ở được ghi trong cơ sở dữ liệu ({formatVND(Number(selectedPriceItem.price) || 0)}/m²).
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100/60 font-medium">
                            Hãy nhập từ khóa tìm kiếm và chọn một địa điểm cụ thể để xem chi tiết bảng giá.
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ==================== SUB-TAB 2: DIỆN TÍCH TÁCH THỬA & HẠN MỨC ĐẤT Ở ==================== */}
                  {landSubTab === 'subdivision' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tỉnh / Thành phố</label>
                            <SelectWithSearch
                              value={selectedLimitProvince}
                              onChange={(val) => setSelectedLimitProvince(val)}
                              options={limitProvinces}
                              placeholder="Chọn Tỉnh / Thành phố..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phường / Xã / Thị trấn</label>
                            <SelectWithSearch
                              value={selectedLimitWard}
                              onChange={(val) => setSelectedLimitWard(val)}
                              options={[
                                { label: "-- Tất cả xã/phường --", value: "" },
                                ...limitWards
                              ]}
                              placeholder="-- Tất cả xã/phường --"
                            />
                          </div>
                        </div>

                        {(() => {
                          const provinceDocs = landDocuments.filter(d => isMatchLocality(d.province_name, selectedLimitProvince));
                          if (provinceDocs.length > 0) {
                            return (
                              <div className="p-3 bg-indigo-50/70 text-indigo-900 text-xs rounded-xl border border-indigo-100 flex items-center justify-between gap-3 font-medium">
                                <div className="flex items-center gap-2">
                                  <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                                  <span>
                                    Hệ thống có <strong>{provinceDocs.length} tài liệu gốc</strong> cho {selectedLimitProvince} trong cơ sở dữ liệu. Bạn có thể dùng tính năng Hỏi đáp để tra cứu chi tiết.
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDocProvince(selectedLimitProvince);
                                    setLandSubTab('query_docs');
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition-all text-[10px] uppercase whitespace-nowrap cursor-pointer"
                                >
                                  Hỏi đáp tài liệu →
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Regulatory results view */}
                      <div className="space-y-4">
                        {subdivisionLimits.filter(item => {
                          if (item.is_approved === 0) return false;
                          if (!isMatchLocality(item.province_name, selectedLimitProvince)) return false;
                          if (selectedLimitWard && !isMatchLocality(item.ward_name, selectedLimitWard)) return false;
                          return true;
                        }).length > 0 ? (
                          subdivisionLimits.filter(item => {
                            if (item.is_approved === 0) return false;
                            if (!isMatchLocality(item.province_name, selectedLimitProvince)) return false;
                            if (selectedLimitWard && !isMatchLocality(item.ward_name, selectedLimitWard)) return false;
                            return true;
                          }).map((limit) => (
                            <div key={limit.id} className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4 hover:border-[var(--color-primary)]/20 transition-all">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-white bg-slate-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Quy định tách thửa & hạn mức</span>
                                  <span className="text-xs text-slate-500 font-semibold">{limit.ward_name} ({limit.district_name})</span>
                                </div>
                                <span className="text-xs text-slate-400 font-bold">{limit.province_name}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                                    <Scale size={14} />
                                    <span>Diện tích tách thửa tối thiểu</span>
                                  </div>
                                  <p className="text-slate-800 font-serif font-semibold text-sm sm:text-base">{limit.subdivision_area || 'Chưa cập nhật'}</p>
                                </div>

                                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
                                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                                    <BookOpen size={14} />
                                    <span>Hạn mức đất ở tối đa / công nhận</span>
                                  </div>
                                  <p className="text-slate-800 font-serif font-semibold text-sm sm:text-base">{limit.residential_limit || 'Chưa cập nhật'}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                            Không tìm thấy quy định tách thửa hay hạn mức đất ở nào của xã/phường đã chọn.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==================== SUB-TAB 3: HỎI ĐÁP CSDL TÀI LIỆU ĐỊA PHƯƠNG ==================== */}
                  {landSubTab === 'query_docs' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 space-y-4">
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                          <Cpu size={18} className="animate-pulse" />
                          <span>Gemini RAG (Retrieval-Augmented Generation)</span>
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed font-sans">
                          Hỏi đáp trực tiếp bằng ngôn ngữ tự nhiên dựa trên cơ sở dữ liệu các quyết định, văn bản pháp lý gốc đã tải lên cho từng địa phương. Hệ thống sẽ tự động tham chiếu và trả lời chính xác thông tin bạn cần.
                        </p>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">Chọn Tỉnh / Thành phố để tra cứu tài liệu</label>
                          <SelectWithSearch
                            value={selectedDocProvince}
                            onChange={(val) => {
                              setSelectedDocProvince(val);
                              setDocQueryAnswer('');
                            }}
                            options={priceProvinces}
                            placeholder="Chọn Tỉnh / Thành phố để tra cứu..."
                          />
                        </div>

                        {/* Document summary info for selected province */}
                        {(() => {
                          const docs = landDocuments.filter(d => isMatchLocality(d.province_name, selectedDocProvince));
                          if (docs.length > 0) {
                            return (
                              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-100 flex items-center gap-2 font-medium">
                                <span className="text-base">📁</span>
                                <span>
                                  Tìm thấy <strong>{docs.length} tài liệu gốc</strong> cho {selectedDocProvince}. Bạn có thể hỏi bất kỳ câu hỏi nào liên quan đến bảng giá đất hoặc quy định tách thửa của địa phương này!
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-100 flex items-center gap-2 font-medium">
                                <span className="text-base">⚠️</span>
                                <span>
                                  Chưa có tài liệu gốc nào được tải lên cho {selectedDocProvince} trong Cơ sở dữ liệu địa phương. (AI sẽ sử dụng tri thức sẵn có để hỗ trợ bạn).
                                </span>
                              </div>
                            );
                          }
                        })()}

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">Nhập câu hỏi của bạn</label>
                          <textarea
                            value={docQueryText}
                            onChange={(e) => setDocQueryText(e.target.value)}
                            placeholder="Ví dụ: Giá đất ở tối đa tại đường Bạch Đằng là bao nhiêu? Hoặc diện tích tách thửa tối thiểu cho đất trồng cây hàng năm ở đây là bao nhiêu m2?"
                            rows={4}
                            className="w-full text-xs sm:text-sm p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white shadow-sm font-sans"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={isQueryingDocs || !docQueryText.trim()}
                            onClick={async () => {
                              setIsQueryingDocs(true);
                              setDocQueryAnswer('');
                              try {
                                const response = await fetch("/api/cms/query-land-document", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    province_name: selectedDocProvince,
                                    query: docQueryText
                                  })
                                });
                                const resData = await response.json();
                                if (response.ok) {
                                  setDocQueryAnswer(resData.answer || "Không nhận được phản hồi.");
                                } else {
                                  setDocQueryAnswer(`Lỗi: ${resData.error || "Vui lòng thử lại sau."}`);
                                }
                              } catch (err: any) {
                                console.error(err);
                                setDocQueryAnswer("Có lỗi xảy ra khi truy vấn dữ liệu từ máy chủ.");
                              } finally {
                                setIsQueryingDocs(false);
                              }
                            }}
                            className={`flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl text-xs sm:text-sm hover:bg-[var(--color-primary-light)] transition-all cursor-pointer shadow-sm ${
                              isQueryingDocs || !docQueryText.trim() ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            {isQueryingDocs ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Đang truy xuất & phân tích dữ liệu...
                              </>
                            ) : (
                              <>
                                <Sparkles size={16} /> Gửi câu hỏi cho Gemini RAG
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Gemini RAG Answer Area */}
                      {(docQueryAnswer || isQueryingDocs) && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                              <Sparkles size={16} />
                            </span>
                            <h3 className="font-serif font-bold text-slate-800 text-base">Phản hồi từ Hệ thống Cơ sở dữ liệu</h3>
                          </div>
                          {isQueryingDocs ? (
                            <div className="space-y-2 py-4">
                              <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                              <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
                              <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3"></div>
                            </div>
                          ) : (
                            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                              {docQueryAnswer}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
