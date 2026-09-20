import type { RecordItem } from "../../domain/shared";

export interface ComplianceCase extends RecordItem {
  departmentInvolved?: string;
  auditScope?: string;
  isRegulatoryReviewed?: boolean;
}
