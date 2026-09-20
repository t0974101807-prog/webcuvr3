import type { RecordItem } from "../../domain/shared";

export interface RepresentationCase extends RecordItem {
  negotiationParties?: string;
  settlementTerms?: string;
  targetCompletionDate?: string;
}
