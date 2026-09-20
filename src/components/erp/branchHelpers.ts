import { CANONICAL_BRANCHES, normalizeBranchName as normalizeCanonicalBranchName } from "../../utils/branch";

export const DEFAULT_BRANCH_OPTIONS = [...CANONICAL_BRANCHES];

export const normalizeBranchName = (bName: string): string => {
  if (!bName) return "Hội sở Đà Nẵng";
  return normalizeCanonicalBranchName(bName) || "Hội sở Đà Nẵng";
};

export const isManagerLikePersonnel = (person: any): boolean => {
  const title = String(person?.title || "").toLowerCase();
  const role = String(person?.role || "").toLowerCase();

  return (
    title.includes("giám đốc") ||
    title.includes("trưởng") ||
    title.includes("quản lý") ||
    role.includes("director") ||
    role.includes("manager") ||
    role.includes("head")
  );
};

export const isStaffLikePersonnel = (person: any): boolean => {
  const title = String(person?.title || "").toLowerCase();
  const role = String(person?.role || "").toLowerCase();

  return !isManagerLikePersonnel(person) && (
    title.includes("luật sư") ||
    title.includes("chuyên viên") ||
    title.includes("nhân viên") ||
    title.includes("pháp lý") ||
    title.includes("cộng tác viên") ||
    role.includes("employee") ||
    role.includes("staff")
  );
};

export const filterPersonnelByBranch = (personnel: any[], selectedBranch: string) => {
  if (!selectedBranch) return personnel;
  const normalizedSelected = normalizeBranchName(selectedBranch);
  return personnel.filter((person) => isUserInBranch(person?.branch || "", normalizedSelected));
};

export const isUserInBranch = (userBranch: string, selectedBranch: string): boolean => {
  if (!selectedBranch) return true;
  const normUser = normalizeBranchName(userBranch || "");
  const normSelected = normalizeBranchName(selectedBranch);

  if (normSelected === "Hội sở Đà Nẵng") {
    return normUser === "Hội sở Đà Nẵng" || normUser === "Hội sở";
  }
  if (normSelected === "Chi nhánh TP. Hồ Chí Minh") {
    return normUser === "Chi nhánh TP. Hồ Chí Minh" || normUser === "Trụ sở chính" || normUser === "Chi nhánh TP.HCM";
  }
  return normUser === normSelected;
};
