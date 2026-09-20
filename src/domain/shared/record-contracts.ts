export interface SharedLegalRecord {
  id: string;
  title?: string;
  client?: string;
  feeAmount?: string | number;
  status?: string;
  mainAssignee?: string;
  description?: string;
  date?: string;
  practice_area?: string;
  category?: string;
  revenue?: string | number;
  contractId?: string;
  clientPhone?: string;
  code?: string;
  address?: string;
  dob?: string;
  gender?: string;
  remainingPrincipal?: string | number;
  overdueAmount?: string | number;
  overdueDays?: number;
  overduePeriods?: number;
  monthlyPayment?: string | number;
  lastRepaymentDate?: string;
  liquidationAmount?: string | number;
  loanStatus?: string;
  province?: string;
  region?: string;
  branch?: string;
  courtArea?: string;
  [key: string]: any;
}

export type RecordItem = SharedLegalRecord;
