import { RecordItem } from "../SpecializedRecords/repository/SpecializedRecordsRepository";

export interface ArbitrationCase extends RecordItem {
  arbitratorName?: string;
  tribunalEstablishedDate?: string;
  hearingDate?: string;
  viacCaseNumber?: string;
}
