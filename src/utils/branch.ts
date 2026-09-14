export const CANONICAL_BRANCHES = [
  "Hội sở Đà Nẵng",
  "Chi nhánh TP. Hồ Chí Minh",
  "Chi nhánh Hà Nội",
  "Chi nhánh Bình Dương",
  "Chi nhánh Đồng Nai",
  "Chi nhánh Cần Thơ",
  "Chi nhánh Vũng Tàu",
  "Chi nhánh Hải Phòng",
] as const;

export function normalizeBranchName(value?: string | null): string {
  const branch = String(value || "").trim();
  if (!branch) return "";

  const aliases: Record<string, string> = {
    "Đà Nẵng": "Hội sở Đà Nẵng",
    "Hội sở": "Hội sở Đà Nẵng",
    "Chi nhánh Đà Nẵng": "Hội sở Đà Nẵng",
    "Trụ sở chính": "Chi nhánh TP. Hồ Chí Minh",
    "TP.HCM": "Chi nhánh TP. Hồ Chí Minh",
    "Hồ Chí Minh": "Chi nhánh TP. Hồ Chí Minh",
    "Chi nhánh TP.HCM": "Chi nhánh TP. Hồ Chí Minh",
    "TP. Hồ Chí Minh": "Chi nhánh TP. Hồ Chí Minh",
    "Hà Nội": "Chi nhánh Hà Nội",
    "Bình Dương": "Chi nhánh Bình Dương",
    "Đồng Nai": "Chi nhánh Đồng Nai",
    "Cần Thơ": "Chi nhánh Cần Thơ",
    "Vũng Tàu": "Chi nhánh Vũng Tàu",
    "Hải Phòng": "Chi nhánh Hải Phòng",
  };

  return aliases[branch] || branch;
}
