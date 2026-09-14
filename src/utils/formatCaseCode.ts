export function formatCaseCode(rawCode?: string): string {
  const currentYear = new Date().getFullYear();
  const cleaned = String(rawCode || "").replace(/\s+/g, "").toUpperCase();
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return `HS-${currentYear}-000`;

  const candidateYear = digits.length >= 7 ? Number(digits.slice(0, 4)) : 0;
  const hasValidYear = candidateYear >= 1900 && candidateYear <= currentYear + 1;
  const year = hasValidYear ? String(candidateYear) : String(currentYear);
  const sequenceDigits = hasValidYear ? digits.slice(4) : digits;
  const sequence = sequenceDigits.padStart(3, "0").slice(-3);
  return `HS-${year}-${sequence}`;
}
