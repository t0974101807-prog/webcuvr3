import { getShortTitle } from "./erpFormatters";

export function formatUserDisplayName(user: any): string {
  if (!user) return "";
  const name = (user.name || user.username || "").trim();
  if (!name) return "";

  const rawTitle = (user.title || "").trim();
  const rawRole = (user.role || "").trim();
  let shortTitle = getShortTitle(rawTitle);
  if (!shortTitle && rawRole && rawRole !== "user" && rawRole !== "client") {
    if (rawRole === "lawyer") shortTitle = "Luật sư";
    else if (rawRole === "director") shortTitle = "Giám đốc";
    else if (rawRole === "deputyDirector" || rawRole === "deputy_director") shortTitle = "Phó giám đốc";
    else if (rawRole === "manager") shortTitle = "Quản lý";
    else if (rawRole === "head_of_department") shortTitle = "Trưởng phòng";
    else if (rawRole === "consultant") shortTitle = "Tư vấn viên";
  }

  if (!shortTitle) return name;
  const lowerName = name.toLowerCase();
  const lowerShort = shortTitle.toLowerCase();
  if (lowerName.startsWith(lowerShort) || lowerName.includes(` ${lowerShort} `)) return name;
  if (lowerShort === "luật sư" && (lowerName.startsWith("ls.") || lowerName.startsWith("ls "))) {
    return name.replace(/^ls\.?\s+/i, "Luật sư ");
  }
  if (lowerName === lowerShort || lowerName === "quản trị viên" || lowerName === "admin") return name;
  return `${shortTitle} ${name}`;
}

export function getUserTitleWithPracticeAreas(user: any, language: string = "vi"): string {
  if (!user) return "";
  const role = user.role || "";
  const title = (user.title || "").trim();
  const keys = (user.practice_areas || "").split(",").map((key: string) => key.trim().toLowerCase()).filter(Boolean);
  const areasList: string[] = [];
  if (keys.includes("tranh_tung")) areasList.push(language === "vi" ? "Tranh tụng" : "Litigation");
  if (keys.includes("tu_van")) areasList.push(language === "vi" ? "Tư vấn" : "Consultation");
  if (keys.includes("trong_tai_hoa_giai")) areasList.push(language === "vi" ? "Trọng tài / Hòa giải" : "Arbitration / Mediation");
  if (keys.includes("noi_bo")) areasList.push(language === "vi" ? "Pháp chế & Nội bộ" : "In-house & Compliance");
  if (keys.includes("dai_dien_ngoai_to_tung")) areasList.push(language === "vi" ? "Đại diện ngoài tố tụng" : "Representation");

  if (title) return areasList.length > 0 ? `${title} (${areasList.join(", ")})` : title;
  const isWebAdmin = role === "admin" || title.toLowerCase().includes("admin") || title.toLowerCase().includes("quản trị viên");
  if (isWebAdmin) {
    const baseTitle = language === "vi" ? "Quản trị viên" : "Administrator";
    return areasList.length > 0 ? `${baseTitle} (${areasList.join(", ")})` : baseTitle;
  }
  return translateRole(role || "user", language);
}

export function translateRole(title: string, language: string): string {
  if (!title) return title;
  const value = title.toLowerCase().trim().replace(/^@/, "");
  const vi: Record<string, string> = {
    admin: "Quản trị viên", manager: "Quản lý", manage: "Quản lý", deputy_director: "Phó giám đốc", "deputy director": "Phó giám đốc", deputydirector: "Phó giám đốc", director: "Giám đốc", head_of_department: "Trưởng phòng", "head of department": "Trưởng phòng", headofdept: "Trưởng phòng", lawyer: "Luật sư", traineelawyer: "Luật sư Tập sự", "trainee lawyer": "Luật sư Tập sự", trainee_lawyer: "Luật sư Tập sự", legal_associate: "Trợ lý pháp lý", "legal associate": "Trợ lý pháp lý", specialist: "Chuyên viên pháp lý", accountant: "Kế toán", prosecutor: "Kiểm soát chất lượng", controller: "Kiểm soát viên", editor: "Biên tập viên", intern: "Thực tập sinh", legal_intern: "Thực tập sinh", user: "Người dùng", uploader: "IT - Quản trị hồ sơ", consultant: "Nhân viên tư vấn", "nhân viên tư vấn": "Nhân viên tư vấn",
  };
  const en: Record<string, string> = {
    admin: "Admin", "quản trị viên": "Admin", "quản trị": "Admin", manager: "Manager", manage: "Manager", "quản lý": "Manager", deputy_director: "Deputy Director", "deputy director": "Deputy Director", deputydirector: "Deputy Director", "phó giám đốc": "Deputy Director", director: "Director", "giám đốc": "Director", head_of_department: "Head of Department", "head of department": "Head of Department", headofdept: "Head of Department", "trưởng phòng": "Head of Department", lawyer: "Lawyer", "luật sư": "Lawyer", traineelawyer: "Trainee Lawyer", "trainee lawyer": "Trainee Lawyer", trainee_lawyer: "Trainee Lawyer", "luật sư tập sự": "Trainee Lawyer", legal_associate: "Legal Associate", "legal associate": "Legal Associate", "trợ lý pháp lý": "Legal Associate", specialist: "Specialist", "chuyên viên": "Specialist", "chuyên viên pháp lý": "Specialist", accountant: "Accountant", "kế toán": "Accountant", prosecutor: "Quality Controller", "kiểm soát chất lượng": "Quality Controller", controller: "Controller", "kiểm soát viên": "Controller", editor: "Editor", "biên tập viên": "Editor", intern: "Intern", legal_intern: "Intern", "thực tập sinh": "Intern", user: "User", "người dùng": "User", uploader: "Document Administrator", "quản trị hồ sơ": "Document Administrator", consultant: "Consultant", "nhân viên tư vấn": "Consultant",
  };
  return (language === "vi" ? vi[value] : en[value]) || (language === "vi" ? title : title.charAt(0).toUpperCase() + title.slice(1));
}
