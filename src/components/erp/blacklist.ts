export const getRecordBlacklistViolations = (record: any): string[] => {
  try {
    const saved = localStorage.getItem("blacklist_keywords");
    const blacklist = saved ? JSON.parse(saved) : ["tham nhũng", "hối lộ", "trễ hạn", "từ chối", "sai sót", "đình chỉ", "kháng cáo quá hạn", "vi phạm", "xung đột lợi ích"];
    const textToScan = [
      record.title,
      record.client,
      record.caseDescription,
      record.generalNotes,
      record.status,
      record.mainAssignee,
      ...(record.stages?.map((stage: any) => stage.name + " " + (stage.notes || "")) || [])
    ].join(" ").toLowerCase();

    return blacklist.filter((word: string) => {
      const cleanWord = word.trim().toLowerCase();
      return cleanWord && textToScan.includes(cleanWord);
    });
  } catch (e) {
    return [];
  }
};
