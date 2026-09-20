import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export const CATEGORY_OPTIONS = [
  "Dân sự",
  "Hình sự",
  "Hành chính",
  "Hôn nhân & Gia đình",
  "Kinh doanh & Thương mại",
  "Lao động",
  "Đất đai & Bất động sản",
  "Doanh nghiệp & Đầu tư",
  "Tư vấn pháp luật",
  "Khác",
];

export const STATUS_OPTIONS = [
  "Tiếp nhận",
  "Đã phân công",
  "Đang xử lý",
  "Chờ tài liệu",
  "Đang làm việc với cơ quan",
  "Đang xét xử",
  "Hoàn thành",
  "Tạm dừng",
  "Lưu trữ",
];

export const STEP_OPTIONS = [
  "B1: Chuẩn bị hồ sơ",
  "B2: Nộp hồ sơ khởi kiện",
  "B3: Theo dõi & Xử lý đơn",
  "B4: Nộp tạm ứng án phí",
  "B5: Thụ lý vụ án",
  "B6: Hòa giải",
  "B7: Kết quả hòa giải",
  "B8: Quyết định đưa vụ án ra xét xử",
  "B9: Bản án sơ thẩm",
  "B10: Thi hành án",
  "B11: Kết thúc tố tụng",
];

export const CONSULTING_STEP_OPTIONS = [
  "B1: Tiếp nhận nhu cầu tư vấn doanh nghiệp",
  "B2: Khảo sát & Đánh giá rủi ro pháp lý",
  "B3: Lập Đề xuất & Hợp đồng dịch vụ pháp lý",
  "B4: Nghiên cứu & Dữ liệu hồ sơ doanh nghiệp",
  "B5: Soạn thảo Văn bản / Ý kiến pháp lý (Legal Opinion)",
  "B6: Trao đổi & Thống nhất với Doanh nghiệp",
  "B7: Phát hành Văn bản tư vấn chính thức",
  "B8: Hỗ trợ Thực thi & Tối ưu hóa thủ tục",
  "B9: Nghiệm thu & Bàn giao kết quả tư vấn",
];

export const PRIORITY_OPTIONS = ["Bình thường", "Cao", "Khẩn cấp"];

export const COURT_OPTIONS = [
  "TAND TP Đà Nẵng",
  "TAND Quận Liên Chiểu",
  "TAND Quận Hải Châu",
  "TAND Tỉnh Quảng Nam",
  "TAND Tỉnh Thừa Thiên Huế",
  "TAND Cấp cao tại Đà Nẵng",
];

export const DOMAIN_OPTIONS = [
  "Tranh tụng (Tố tụng Tòa án)",
  "Tư vấn Doanh nghiệp",
  "Tư vấn Đầu tư & M&A",
  "Bất động sản & Đất đai",
  "Sở hữu trí tuệ",
  "Lao động & Hợp đồng",
  "Đại diện ngoài tố tụng",
  "Trọng tài & Hòa giải thương mại",
];

export const GENDER_OPTIONS = ["Nam", "Nữ", "Khác"];
export const BRANCH_OPTIONS = ["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh"];
export const ROLE_OPTIONS = [
  "Giám đốc",
  "Phó giám đốc",
  "Trưởng phòng",
  "Quản lý",
  "Quản trị viên",
  "Kiểm soát viên",
  "Kiểm soát chất lượng",
  "Kế toán",
  "Luật sư",
  "Chuyên viên pháp lý",
  "Trợ lý pháp lý",
  "Biên tập viên",
  "Luật sư Tập sự",
  "Thực tập sinh",
  "Nhân viên tư vấn",
  "Người dùng",
];

type ComboboxOption = string | { label: string; value: string };

export const Combobox = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const getLabel = (opt: ComboboxOption) =>
    typeof opt === "string" ? opt : opt.label;
  const getValue = (opt: ComboboxOption) =>
    typeof opt === "string" ? opt : opt.value;

  useEffect(() => {
    if (!value) {
      setInputValue("");
      return;
    }
    const matchedOption = options.find((opt) => getValue(opt) === value);
    setInputValue(matchedOption ? getLabel(matchedOption) : value);
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    if (!inputValue) return true;
    const matchedOption = options.find((option) => getValue(option) === value);
    if (matchedOption && inputValue === getLabel(matchedOption)) return true;
    return getLabel(opt).toLowerCase().includes(inputValue.toLowerCase());
  });

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg outline-none bg-transparent"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="px-2 py-2 text-slate-400 hover:text-slate-600 border-l border-slate-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto py-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                className="px-3 py-2 cursor-pointer transition-all duration-300 hover:bg-slate-100 text-sm font-medium text-slate-700"
                onClick={() => {
                  setInputValue(getLabel(opt));
                  onChange(getValue(opt));
                  setIsOpen(false);
                }}
              >
                {getLabel(opt)}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">
              Không tìm thấy kết quả
            </div>
          )}
        </div>
      )}
    </div>
  );
};
