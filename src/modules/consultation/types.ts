import type { RecordItem } from "../../domain/shared";

export interface ConsultationCase extends RecordItem {
  consultationType?: string;
  legalOpinionDate?: string;
  reviewComplexity?: "low" | "medium" | "high";
}
