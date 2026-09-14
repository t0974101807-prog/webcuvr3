export type AccountRole =
  | "admin"
  | "director"
  | "deputyDirector"
  | "deputy_director"
  | "manager"
  | "head_of_department"
  | "controller"
  | "prosecutor"
  | "lawyer"
  | "specialist"
  | "client"
  | "partner"
  | string;

export interface UserAccount {
  id: number | string;
  username: string;
  name: string;
  role: AccountRole;
  title?: string;
  staff_code?: string;
  branch?: string;
  branch_code?: string;
  department?: string;
  phone?: string;
  email?: string;
  account_type?: "INTERNAL" | "CUSTOMER" | "PARTNER" | string;
}

export interface Personnel extends UserAccount {
  employee_code?: string;
  practice_areas?: string;
  status?: string;
}

export interface Office {
  id: number | string;
  code?: string;
  name: string;
  short_name?: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  map_url?: string;
  is_headquarters?: boolean | number;
  latitude?: number;
  longitude?: number;
}

export interface ClientAccount extends UserAccount {
  account_type: "CUSTOMER" | "PARTNER" | string;
  manager_id?: string | number;
  case_id?: string;
  address?: string;
}

export interface LegalRecord {
  id: string;
  title?: string;
  name?: string;
  client?: string;
  clientId?: string;
  mainAssignee?: string;
  branch?: string;
  category?: string;
  practice_area?: string;
  status?: string;
  deleted?: boolean | number;
  is_deleted?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentRecord {
  id: string | number;
  case_id?: string;
  case_code?: string;
  file_name?: string;
  filename?: string;
  path?: string;
  is_deleted?: boolean | number;
  deleted_at?: string | null;
}
