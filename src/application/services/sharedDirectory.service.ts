import db from "../../db/database";
import { enrichUsersWithStaffCode } from "../../utils/staffCode";
import { normalizeBranchName } from "../../utils/branch";
import type { Office, Personnel, UserAccount } from "../../types/shared-entities";

export interface PersonnelDirectoryOptions {
  includeClients?: boolean;
  includePartners?: boolean;
  includeAdmins?: boolean;
  branch?: string;
}

export class SharedDirectoryService {
  static listPersonnel(options: PersonnelDirectoryOptions = {}): Personnel[] {
    const roleFilters = ["1 = 1"];
    if (!options.includeClients) roleFilters.push("role != 'client'");
    if (!options.includePartners) roleFilters.push("role != 'partner'");
    if (!options.includeAdmins) {
      roleFilters.push("role != 'admin'");
      roleFilters.push("COALESCE(username, '') != 'admin'");
    }

    const rows = db.prepare(`
      SELECT id, username, name, role, title, staff_code, branch, phone, email,
             manager_id, practice_areas, account_type
      FROM users
      WHERE ${roleFilters.join(" AND ")}
      ORDER BY name COLLATE NOCASE ASC
    `).all() as UserAccount[];

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
    return db.prepare(`
      SELECT id, name, short_name, region, address, phone, email, map_url,
             is_headquarters, latitude, longitude
      FROM offices
      ORDER BY is_headquarters DESC, id ASC
    `).all() as Office[];
  }
}
