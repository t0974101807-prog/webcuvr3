export interface SeedRecord {
  id: string;
  contractId: string;
  client: string;
  clientPhone: string;
  address: string;
  dob: string;
  gender: string;
  overdueAmount: number;
  feeAmount: number;
  liquidationAmount: number;
  loanStatus: string;
  branch: string;
  mainAssignee: string;
  status: string;
  date: string;
  practice_area: string;
  category: string;
  description: string;
  courtArea: string;
}

// Zero-mock policy: no simulated seed records
export const SPECIALIZED_SEEDS: SeedRecord[] = [];
