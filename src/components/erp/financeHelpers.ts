export const getRevenueValue = (record: any): number => {
  const raw = record?.feeAmount ?? record?.revenue ?? record?.retainerPaid ?? record?.fee ?? "0";
  const value = Number(String(raw).replace(/,/g, "")) || 0;
  return Number.isFinite(value) ? value : 0;
};

export const sumRecordRevenue = (records: any[] = []) => {
  return records.reduce((sum, record) => sum + getRevenueValue(record), 0);
};

export const formatCurrencyDisplay = (value: number | string) => {
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/,/g, "")) || 0;
  return Number.isFinite(numeric) ? `${numeric.toLocaleString("vi-VN")} VNĐ` : "0 VNĐ";
};
