import { RecordItem } from "../SpecializedRecords/repository/SpecializedRecordsRepository";

export interface ComplianceCase extends RecordItem {
  departmentInvolved?: string;
  auditScope?: string;
  isRegulatoryReviewed?: boolean;
}
