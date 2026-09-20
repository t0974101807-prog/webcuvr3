export const formatDisplayDate = (dateString: string) => {
  if (!dateString) return "---";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

export const formatCaseCode = (rawCode: string): string => {
  if (!rawCode) return "HS-2026-000";
  const cleaned = rawCode.replace(/\s+/g, "").toUpperCase();
  if (/^[A-Z]+-\d{4}-\d{3}$/.test(cleaned)) return cleaned;
  const prefixes = ["HS", "DS", "HC", "TV", "DN", "HN", "TK", "SHTT", "LĐ", "TMQT", "TA", "PC", "DD", "HD"];
  if (prefixes.some(prefix => cleaned.startsWith(prefix))) {
    const prefixMatch = cleaned.match(/^([A-Z]+)/);
    const prefix = prefixMatch ? prefixMatch[1] : "HS";
    let digits = cleaned.replace(prefix, "").replace(/-/g, "");
    let year = digits.substring(0, 4);
    if (!/^\d{4}$/.test(year)) year = "2026";
    let num = digits.substring(4) || "001";
    if (num.length < 3) num = num.padStart(3, "0");
    return `${prefix}-${year}-${num.substring(0, 3)}`;
  }
  const numbersOnly = cleaned.replace(/-/g, "");
  if (numbersOnly.length >= 4) {
    let year = numbersOnly.substring(0, 4);
    if (!/^\d{4}$/.test(year)) year = "2026";
    let num = numbersOnly.substring(4) || "001";
    if (num.length < 3) num = num.padStart(3, "0");
    return `HS-${year}-${num.substring(0, 3)}`;
  }
  return `HS-2026-${cleaned.padStart(3, "0")}`;
};

export function getShortTitle(titleOrRole: string): string {
  if (!titleOrRole) return "";
  const title = titleOrRole.trim().toLowerCase();
  if (title.includes("luật sư") || title.includes("lawyer") || title.includes("attorney")) return "Luật sư";
  if (title.includes("phó giám đốc") || title.includes("deputy")) return "Phó giám đốc";
  if (title.includes("giám đốc") || title === "director") return "Giám đốc";
  if (title.includes("trưởng phòng") || title === "head_of_department") return "Trưởng phòng";
  if (title.includes("quản lý") || title.includes("manager")) return "Quản lý";
  if (title.includes("chuyên viên") || title.includes("specialist")) return "Chuyên viên";
  if (title.includes("trợ lý") || title.includes("assistant")) return "Trợ lý";
  if (title.includes("cố vấn") || title.includes("advisor")) return "Cố vấn";
  if (title.includes("kế toán") || title.includes("accountant")) return "Kế toán";
  if (title.includes("thực tập sinh") || title.includes("intern")) return "Thực tập sinh";
  if (title.includes("kiểm soát")) return "Kiểm soát viên";
  if (title.includes("quản trị viên") || title.includes("administrator")) return "Quản trị viên";
  if (title.includes("tư vấn") || title === "consultant") return "Tư vấn viên";
  const words = titleOrRole.trim().split(/\s+/);
  return words.slice(0, Math.min(2, words.length)).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
