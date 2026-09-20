import db from "../../db/database";
import type { Office, UserAccount } from "./contracts";

const userDirectoryFields = `id, username, name, role, title, staff_code, branch, start_date,
  contract_type, contract_sign_date, salary, bonus, avatar, phone, email, dob, gender,
  address, case_id, manager_id, practice_areas`;

export interface OfficeWriteInput {
  name?: string | null;
  short_name?: string | null;
  region?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  map_url?: string | null;
  is_headquarters?: boolean | number | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export class SharedDirectoryRepository {
  static listPersonnel(roleFilters: string[] = ["1 = 1"]): UserAccount[] {
    return db.prepare(`
      SELECT id, username, name, role, title, staff_code, branch, phone, email,
             manager_id, practice_areas, account_type
      FROM users
      WHERE ${roleFilters.join(" AND ")}
      ORDER BY name COLLATE NOCASE ASC
    `).all() as UserAccount[];
  }

  static listStaffPage(cursorId: number | string | undefined, limitPlusOne: number): any[] {
    const params: Record<string, number | string> = { limitPlusOne };
    let query = `
      SELECT id, username, name, role, title, staff_code, branch, start_date,
             contract_type, salary, bonus, avatar, phone, email, dob, gender,
             address, manager_id, practice_areas
      FROM users
      WHERE role != 'client'
    `;
    if (cursorId !== undefined) {
      query += " AND id < :cursorId";
      params.cursorId = cursorId;
    }
    query += " ORDER BY id DESC LIMIT :limitPlusOne";
    return db.prepare(query).all(params) as any[];
  }

  static listStaff(): any[] {
    return db.prepare(`
      SELECT id, username, name, role, title, staff_code, branch, start_date,
             contract_type, salary, bonus, avatar, phone, email, dob, gender,
             address, manager_id, practice_areas
      FROM users
      WHERE role != 'client'
      ORDER BY id DESC
    `).all() as any[];
  }

  static listAdmins(): any[] {
    return db.prepare(`
      SELECT ${userDirectoryFields}
      FROM users
      WHERE role = 'admin' OR username = 'admin'
      ORDER BY id ASC
    `).all() as any[];
  }

  static listAccountsPage(cursorId: number | string | undefined, limitPlusOne: number): any[] {
    const params: Record<string, number | string> = { limitPlusOne };
    let query = `SELECT ${userDirectoryFields} FROM users`;
    if (cursorId !== undefined) {
      query += " WHERE id < :cursorId";
      params.cursorId = cursorId;
    }
    query += " ORDER BY id DESC LIMIT :limitPlusOne";
    return db.prepare(query).all(params) as any[];
  }

  static listAccounts(): any[] {
    return db.prepare(`SELECT ${userDirectoryFields} FROM users ORDER BY id DESC`).all() as any[];
  }

  static listGatewayUsers(): Array<{ id: number | string; name: string; username: string; role: string }> {
    return db.prepare("SELECT id, name, username, role FROM users LIMIT 50").all() as Array<{ id: number | string; name: string; username: string; role: string }>;
  }

  static listAttendanceTargets(role?: string): any[] {
    if (role && role !== "All") {
      return db.prepare("SELECT id, username, name, role, staff_code FROM users WHERE role = ?").all(role) as any[];
    }
    return db.prepare("SELECT id, username, name, role, staff_code FROM users").all() as any[];
  }

  static listOffices(): Office[] {
    return db.prepare(`
      SELECT id, name, short_name, region, address, phone, email, map_url,
             is_headquarters, latitude, longitude
      FROM offices
      ORDER BY is_headquarters DESC, id ASC
    `).all() as Office[];
  }

  static listOfficeFormOptions(): any[] {
    return db.prepare(`
      SELECT id, name, address, phone
      FROM offices
      ORDER BY name ASC
    `).all() as any[];
  }

  static listPersonnelFormOptions(): any[] {
    return db.prepare(`
      SELECT id, username, name, role, title, manager_id
      FROM users
      WHERE role != 'client'
      ORDER BY name ASC
    `).all() as any[];
  }

  static getOfficeName(id: number | string): string | null {
    const row = db.prepare("SELECT name FROM offices WHERE id = ?").get(id) as { name?: string } | undefined;
    return row?.name || null;
  }

  static getUserSummary(id: number | string): { name?: string; username?: string } | null {
    return db.prepare("SELECT name, username FROM users WHERE id = ?").get(id) as { name?: string; username?: string } | null;
  }

  static listOfficeNames(): { name: string }[] {
    return db.prepare("SELECT name FROM offices").all() as { name: string }[];
  }

  static listClientsPage(cursorId: number | string | undefined, limitPlusOne: number): any[] {
    const params: Record<string, number | string> = { limitPlusOne };
    let query = `SELECT id, username, name, phone, email, address, role
                 FROM users WHERE role = 'client'`;
    if (cursorId !== undefined) {
      query += " AND id < :cursorId";
      params.cursorId = cursorId;
    }
    query += " ORDER BY id DESC LIMIT :limitPlusOne";
    return db.prepare(query).all(params) as any[];
  }

  static listClients(): any[] {
    return db.prepare(`
      SELECT id, username, name, phone, email, address, role, branch, manager_id, case_id
      FROM users
      WHERE role = 'client' OR account_type = 'CUSTOMER'
      ORDER BY id DESC
    `).all() as any[];
  }

  static listPartners(): any[] {
    return db.prepare(`
      SELECT id, username, name, phone, email, address, role, branch, manager_id, case_id
      FROM users
      WHERE role = 'partner' OR account_type = 'PARTNER'
      ORDER BY id DESC
    `).all() as any[];
  }

  static createClient(name: string | null, phone: string | null): void {
    db.prepare(`
      INSERT INTO users (username, password, name, phone, role)
      VALUES (?, ?, ?, ?, 'client')
    `).run(phone, "Abcd@12345", name, phone);
  }

  static createOffice(input: OfficeWriteInput): number {
    const result = db.prepare(`
      INSERT INTO offices (name, short_name, region, address, phone, email, map_url,
                           is_headquarters, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.name ?? null,
      input.short_name ?? null,
      input.region ?? null,
      input.address ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.map_url ?? null,
      input.is_headquarters ? 1 : 0,
      input.latitude ?? null,
      input.longitude ?? null
    );
    return Number(result.lastInsertRowid);
  }

  static clearHeadquarters(exceptId?: string | number): void {
    if (exceptId === undefined) {
      db.prepare("UPDATE offices SET is_headquarters = 0").run();
      return;
    }
    db.prepare("UPDATE offices SET is_headquarters = 0 WHERE id != ?").run(exceptId);
  }

  static updateOffice(id: string | number, input: OfficeWriteInput): void {
    db.prepare(`
      UPDATE offices
      SET name=?, short_name=?, region=?, address=?, phone=?, email=?, map_url=?,
          is_headquarters=?, latitude=?, longitude=?
      WHERE id=?
    `).run(
      input.name ?? null,
      input.short_name ?? null,
      input.region ?? null,
      input.address ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.map_url ?? null,
      input.is_headquarters ? 1 : 0,
      input.latitude ?? null,
      input.longitude ?? null,
      id
    );
  }

  static deleteOffice(id: string | number): void {
    db.prepare("DELETE FROM offices WHERE id=?").run(id);
  }
}