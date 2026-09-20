export function normalizeClientMatchValue(value: any): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
}

export function matchesClientRecord(record: any, user: any): boolean {
  if (!record || !user) return false;

  const candidateFields = [
    record.client,
    record.clientName,
    record.client_name,
    record.contractDetails?.requesterName,
    record.contractDetails?.customerName,
    record.contractDetails?.obligorName,
    record.clientIdCard,
    record.taxCode,
    record.taxId,
    record.contractDetails?.customerTaxCode,
    record.contractDetails?.obligorTaxCode,
    record.contractDetails?.customerBusinessId,
    record.contractDetails?.obligorBusinessId,
    record.contractDetails?.requesterIdCard,
    record.contractDetails?.customerIdCard,
    record.contractDetails?.obligorIdCard,
    record.clientPhone,
    record.contractDetails?.requesterPhone,
    record.contractDetails?.customerPhone,
    record.contractDetails?.obligorPhone,
    record.systemId,
    record.id,
    record.contractId,
    record.authContractId,
  ];

  const normalizedUserName = normalizeClientMatchValue(user.name || user.username);
  const normalizedUserUsername = normalizeClientMatchValue(user.username);
  const normalizedUserPhone = normalizeClientMatchValue(user.phone || user.mobile);
  const normalizedCaseId = normalizeClientMatchValue(user.case_id);
  const normalizedUserTaxId = normalizeClientMatchValue(user.taxCode || user.tax_id || user.taxId || user.businessId || user.mst);

  const exactMatches = candidateFields
    .map((field) => normalizeClientMatchValue(field))
    .filter(Boolean);

  const userMatches = [
    normalizedUserName,
    normalizedUserUsername,
    normalizedUserPhone,
    normalizedCaseId,
    normalizedUserTaxId,
  ].filter(Boolean);

  if (userMatches.length === 0) return false;

  const userCaseMatches = [
    String(record.id || ''),
    String(record.systemId || ''),
    String(record.contractId || ''),
    String(record.authContractId || ''),
  ].map((value) => normalizeClientMatchValue(value));

  if (userCaseMatches.includes(normalizedCaseId) && normalizedCaseId) return true;

  for (const field of exactMatches) {
    if (userMatches.includes(field)) return true;
  }

  const listMatches = [
    normalizeClientMatchValue(record.client),
    normalizeClientMatchValue(record.contractDetails?.requesterName),
    normalizeClientMatchValue(record.contractDetails?.customerName),
    normalizeClientMatchValue(record.contractDetails?.obligorName),
  ].filter(Boolean);

  if (normalizedUserName && listMatches.some((value) => value === normalizedUserName)) return true;
  if (normalizedUserPhone && [
    normalizeClientMatchValue(record.clientPhone),
    normalizeClientMatchValue(record.contractDetails?.requesterPhone),
    normalizeClientMatchValue(record.contractDetails?.customerPhone),
    normalizeClientMatchValue(record.contractDetails?.obligorPhone),
  ].includes(normalizedUserPhone)) return true;

  if (normalizedUserTaxId && [
    normalizeClientMatchValue(record.taxCode),
    normalizeClientMatchValue(record.taxId),
    normalizeClientMatchValue(record.contractDetails?.customerTaxCode),
    normalizeClientMatchValue(record.contractDetails?.obligorTaxCode),
    normalizeClientMatchValue(record.contractDetails?.customerBusinessId),
    normalizeClientMatchValue(record.contractDetails?.obligorBusinessId),
  ].includes(normalizedUserTaxId)) return true;

  return false;
}
