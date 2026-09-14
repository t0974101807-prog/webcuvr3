export const getRoleRankAndPrefix = (user: { role?: string; title?: string }) => {
  const role = (user.role || "").toLowerCase();
  const title = (user.title || "").toLowerCase();

  let prefix = "NV";
  let rank = 10;

  if (role === "admin" || title.includes("quản trị viên")) {
    prefix = "QTV";
    rank = 100;
  } else if (role === "deputy_director" || role === "deputydirector" || title.includes("phó giám đốc")) {
    prefix = "PGD";
    rank = 80;
  } else if (role === "director" || title.includes("giám đốc")) {
    prefix = "GD";
    rank = 90;
  } else if (role === "head_of_department" || title.includes("trưởng phòng")) {
    prefix = "TP";
    rank = 70;
  } else if (role === "manager" || title.includes("quản lý")) {
    prefix = "QL";
    rank = 65;
  } else if (role === "prosecutor" || role === "controller" || title.includes("kiểm soát viên") || title.includes("kiểm soát")) {
    prefix = "KSV";
    rank = 60;
  } else if (role === "lawyer" || title.includes("luật sư")) {
    prefix = "LS";
    rank = 55;
  } else if (role === "specialist" || title.includes("chuyên viên") || title.includes("tư vấn") || role === "specialist") {
    prefix = "CVPL";
    rank = 50;
  } else if (role === "accountant" || title.includes("kế toán")) {
    prefix = "KT";
    rank = 45;
  } else if (role === "editor" || title.includes("biên tập")) {
    prefix = "BTV";
    rank = 40;
  } else if (role === "trainee_lawyer" || role === "traineelawyer" || title.includes("tập sự")) {
    prefix = "LSTS";
    rank = 35;
  } else if (role === "intern" || role === "legal_intern" || title.includes("thực tập")) {
    prefix = "TTS";
    rank = 30;
  } else {
    prefix = "NV";
    rank = 10;
  }

  return { prefix, rank };
};

export const enrichUsersWithStaffCode = (users: any[]) => {
  // Filter out clients
  const employees = users.filter((u) => u && u.role !== "client");

  // Sort employees by rank (descending) and then stably by id (ascending)
  const sorted = [...employees].sort((a, b) => {
    const rankA = getRoleRankAndPrefix(a).rank;
    const rankB = getRoleRankAndPrefix(b).rank;
    if (rankA !== rankB) {
      return rankB - rankA;
    }
    return Number(a.id || 0) - Number(b.id || 0);
  });

  // Create a map of user ID to their calculated staff code
  const codeMap = new Map<number, string>();
  sorted.forEach((u, index) => {
    const { prefix } = getRoleRankAndPrefix(u);
    const suffix = String(index).padStart(3, "0");
    codeMap.set(Number(u.id), `${prefix}${suffix}`);
  });

  // Enrich the original users array
  return users.map((u) => {
    if (!u) return u;
    if (u.role === "client") {
      return { ...u, staff_code: "" };
    }
    const computedCode = codeMap.get(Number(u.id)) || "";
    return { ...u, staff_code: computedCode };
  });
};
