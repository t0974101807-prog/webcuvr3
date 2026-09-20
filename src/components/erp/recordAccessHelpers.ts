export const checkPersonalAccess = (record: any, user: any) => {
  if (!record || !user) return false;

  const uName = user?.name;
  const uUsername = user?.username;

  return (
    record.mainAssignee === uName ||
    record.subAssignee === uName ||
    record.authStaff1 === uName ||
    record.authStaff2 === uName ||
    record.authStaff3 === uName ||
    record.manager === uName ||
    record.lawyer === uName ||
    record.specialist === uName ||
    record.userEA === uName ||
    record.userEA === uUsername
  );
};

export const getRecordRevenueValue = (record: any): number => {
  const raw = record?.feeAmount ?? record?.revenue ?? "0";
  const value = Number(String(raw).replace(/,/g, "")) || 0;
  return Number.isFinite(value) ? value : 0;
};

export const isRecordOverdue = (deadlineStr: string, status: string) => {
  if (!deadlineStr || (status && status.includes("Hoàn thành"))) return false;

  let time = 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
    time = new Date(deadlineStr).getTime();
  } else {
    const parts = deadlineStr.split("/");
    if (parts.length === 3) {
      time = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0]),
      ).getTime();
    }
  }

  return time > 0 && time < Date.now();
};

export const canUserEditRecord = (record: any, myPermissions: any, user: any) => {
  if (!myPermissions) return true;
  if (myPermissions.editAllRecords) return true;
  if (myPermissions.editPersonalRecords && checkPersonalAccess(record, user)) return true;
  return false;
};

export const canUserDeleteRecord = (record: any, myPermissions: any, user: any) => {
  if (!myPermissions) {
    return ["admin", "manager", "director", "deputyDirector", "deputy_director"].includes(
      user?.role || "",
    );
  }

  return myPermissions.deleteRecords;
};

export const matchesRecordSearch = (record: any, query: string) => {
  if (!query) return true;

  const q = query.toLowerCase();
  return (
    (record?.title && record.title.toLowerCase().includes(q)) ||
    (record?.client && record.client.toLowerCase().includes(q)) ||
    (record?.mainAssignee && record.mainAssignee.toLowerCase().includes(q)) ||
    (record?.category && record.category.toLowerCase().includes(q)) ||
    (record?.status && record.status.toLowerCase().includes(q))
  );
};
