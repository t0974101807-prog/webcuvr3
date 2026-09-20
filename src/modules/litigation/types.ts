import type { RecordItem } from "../../domain/shared";

export interface LitigationCase extends RecordItem {
  courtArea?: string;
  prosecutor?: string;
  defendant?: string;
  trialDate?: string;
  judgmentNumber?: string;
}
