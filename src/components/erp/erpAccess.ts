import { mapRoleToDb } from "../../utils/role";

export const LEGAL_PRACTICE_MODULES = [
  "tranh_tung",
  "tu_van",
  "dai_dien_ngoai_to_tung",
  "noi_bo",
  "trong_tai_hoa_giai",
] as const;

const INTERNAL_STAFF_ROLES = new Set([
  "admin",
  "director",
  "deputyDirector",
  "controller",
  "head_of_department",
  "manager",
  "prosecutor",
  "lawyer",
  "specialist",
  "legal_associate",
  "accountant",
  "editor",
  "traineeLawyer",
  "intern",
  "consultant",
  "uploader",
]);

const MANAGEMENT_ROLES = new Set(["admin", "director", "deputyDirector", "controller"]);

export function getAllowedERPModules(user: any): string[] {
  if (!user) return [LEGAL_PRACTICE_MODULES[0]];

  const roleKey = mapRoleToDb(user.role);
  const isInternalStaff = INTERNAL_STAFF_ROLES.has(roleKey);
  const isManagement = MANAGEMENT_ROLES.has(roleKey);

  if (!isInternalStaff) return [LEGAL_PRACTICE_MODULES[0]];

  if (user.practice_areas && !isManagement) {
    const parsed = user.practice_areas
      .split(",")
      .map((area: string) => area.trim())
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  }

  return [...LEGAL_PRACTICE_MODULES];
}

export function getFirstLegalPracticeModule(user: any): string | null {
  if (!user) return null;
  const userAreas = user.practice_areas
    ? user.practice_areas.split(",").map((area: string) => area.trim()).filter(Boolean)
    : [];
  return userAreas.find((area: string) => LEGAL_PRACTICE_MODULES.includes(area as typeof LEGAL_PRACTICE_MODULES[number])) || null;
}
