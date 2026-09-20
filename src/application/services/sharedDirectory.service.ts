import { enrichUsersWithStaffCode } from "../../utils/staffCode";
import { normalizeBranchName } from "../../utils/branch";
import { SharedDirectoryRepository } from "../../domain/shared/sharedDirectory.repository";
import type { Office, Personnel } from "../../domain/shared";

export interface PersonnelDirectoryOptions {
  includeClients?: boolean;
  includePartners?: boolean;
  includeAdmins?: boolean;
  branch?: string;
}

export class SharedDirectoryService {
  static getOfficeName(id: number | string): string | null {
    return SharedDirectoryRepository.getOfficeName(id);
  }

  static getUserSummary(id: number | string): { name?: string; username?: string } | null {
    return SharedDirectoryRepository.getUserSummary(id);
  }

  static listOfficeNames(): { name: string }[] {
    return SharedDirectoryRepository.listOfficeNames();
  }

  static listOfficeFormOptions(): any[] {
    return SharedDirectoryRepository.listOfficeFormOptions();
  }

  static listPersonnelFormOptions(): any[] {
    return SharedDirectoryRepository.listPersonnelFormOptions();
  }

  static listAccountsPage(cursorId: number | string | undefined, limitPlusOne: number): any[] {
    return SharedDirectoryRepository.listAccountsPage(cursorId, limitPlusOne);
  }

  static listAccounts(): any[] {
    return SharedDirectoryRepository.listAccounts();
  }

  static listGatewayUsers(): Array<{ id: number | string; name: string; username: string; role: string }> {
    return SharedDirectoryRepository.listGatewayUsers();
  }

  static listAttendanceTargets(role?: string): any[] {
    return SharedDirectoryRepository.listAttendanceTargets(role);
  }

  static listAdmins(): any[] {
    const admins = SharedDirectoryRepository.listAdmins();
    return enrichUsersWithStaffCode(admins).map((admin: any) => ({
      ...admin,
      branch: normalizeBranchName(admin.branch)
    }));
  }

  static listStaffPage(cursorId: number | string | undefined, limitPlusOne: number): any[] {
    return SharedDirectoryRepository.listStaffPage(cursorId, limitPlusOne);
  }

  static listStaff(): any[] {
    return SharedDirectoryRepository.listStaff();
  }

  static listClientsPage(cursorId: number | string | undefined, limitPlusOne: number): any[] {
    return SharedDirectoryRepository.listClientsPage(cursorId, limitPlusOne);
  }

  static listClients(): any[] {
    return SharedDirectoryRepository.listClients();
  }

  static listPartners(): any[] {
    return SharedDirectoryRepository.listPartners();
  }

  static createClient(name: string | null, phone: string | null): void {
    SharedDirectoryRepository.createClient(name, phone);
  }

  static listPersonnel(options: PersonnelDirectoryOptions = {}): Personnel[] {
    const roleFilters = ["1 = 1"];
    if (!options.includeClients) roleFilters.push("role != 'client'");
    if (!options.includePartners) roleFilters.push("role != 'partner'");
    if (!options.includeAdmins) {
      roleFilters.push("role != 'admin'");
      roleFilters.push("COALESCE(username, '') != 'admin'");
    }

    const rows = SharedDirectoryRepository.listPersonnel(roleFilters);

    const enriched = enrichUsersWithStaffCode(rows as any[]) as Personnel[];
    const normalized = enriched.map((personnel) => ({
      ...personnel,
      branch: normalizeBranchName(personnel.branch)
    }));

    if (!options.branch) return normalized;
    const branch = normalizeBranchName(options.branch);
    return normalized.filter((personnel) => personnel.branch === branch);
  }

  static listOffices(): Office[] {
    return SharedDirectoryRepository.listOffices();
  }

  static clearHeadquarters(exceptId?: string | number): void {
    SharedDirectoryRepository.clearHeadquarters(exceptId);
  }

  static createOffice(input: Parameters<typeof SharedDirectoryRepository.createOffice>[0]): number {
    return SharedDirectoryRepository.createOffice(input);
  }

  static updateOffice(id: string | number, input: Parameters<typeof SharedDirectoryRepository.updateOffice>[1]): void {
    SharedDirectoryRepository.updateOffice(id, input);
  }

  static deleteOffice(id: string | number): void {
    SharedDirectoryRepository.deleteOffice(id);
  }
}
