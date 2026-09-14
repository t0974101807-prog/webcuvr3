import { RecordItem } from "../SpecializedRecords/repository/SpecializedRecordsRepository";

export interface LitigationCase extends RecordItem {
  courtArea?: string;
  prosecutor?: string;
  defendant?: string;
  trialDate?: string;
  judgmentNumber?: string;
}
