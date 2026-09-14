import { RecordItem } from "../SpecializedRecords/repository/SpecializedRecordsRepository";

export interface RepresentationCase extends RecordItem {
  negotiationParties?: string;
  settlementTerms?: string;
  targetCompletionDate?: string;
}
