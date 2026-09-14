import { RecordItem } from "../SpecializedRecords/repository/SpecializedRecordsRepository";

export interface ConsultationCase extends RecordItem {
  consultationType?: string;
  legalOpinionDate?: string;
  reviewComplexity?: "low" | "medium" | "high";
}
