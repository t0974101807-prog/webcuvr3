export const normalizeCallRecord = (call: any) => ({
  ...call,
  id: String(call?.id ?? call?.call_id ?? ""),
  phone: call?.phone ?? call?.phone_number ?? call?.caller_number ?? "",
  phone_number: call?.phone_number ?? call?.phone ?? call?.caller_number ?? "",
  direction: String(call?.direction ?? call?.type ?? "").toUpperCase(),
  duration: Number(call?.duration ?? 0) || 0,
  staffName: call?.staffName ?? call?.employee_id ?? "",
  branch: call?.branch ?? call?.office_id ?? "",
  call_result: call?.call_result ?? call?.consultationNote ?? "",
});

export const normalizeCallRecords = (calls: any[] = []) => calls.map(normalizeCallRecord);

export const isMissedCall = (call: any) => {
  const normalized = normalizeCallRecord(call);
  const status = String(normalized.status || "").toLowerCase();
  const direction = String(normalized.direction || "").toUpperCase();
  return (
    (direction === "INBOUND" || direction === "INCOMING") &&
    ["missed", "no_answer", "no-answer", "failed", "rejected"].includes(status)
  );
};

export const getCallDurationSeconds = (call: any) => {
  return Number(normalizeCallRecord(call).duration) || 0;
};