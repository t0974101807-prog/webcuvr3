export const dedupeRecordsById = (records: any[] = []) => {
  const aliases = new Map<string, any>();
  const uniqueRecords: any[] = [];

  for (const item of records) {
    if (!item) continue;

    const keys = [item.id, item.systemId, item.contractId]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
    if (keys.length === 0) continue;

    const existing = keys.map((key) => aliases.get(key)).find(Boolean);
    if (existing) {
      for (const key of keys) aliases.set(key, existing);
      continue;
    }

    uniqueRecords.push(item);
    for (const key of keys) aliases.set(key, item);
  }

  return uniqueRecords;
};

export const filterDeletedRecords = (records: any[] = [], deletedIds: string[] = []) => {
  return records.filter((item: any) => !deletedIds.includes(String(item?.id)));
};

export const matchesRecordSearchText = (record: any, query: string) => {
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

export const isRecordCompleted = (record: any) => {
  const status = String(record?.status || "").toLowerCase();
  return status.includes("hoàn thành") || status.includes("completed") || status.includes("done");
};
