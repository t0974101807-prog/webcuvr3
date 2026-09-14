import { getComplianceDb } from "../../../db/DatabaseManager";
import { ComplianceCase } from "../types";

export class ComplianceRepository {
  public static getAll(): ComplianceCase[] {
    try {
      const db = getComplianceDb();
      const rows = db.prepare("SELECT data FROM compliance_cases").all() as { data: string }[];
      return rows.map(r => JSON.parse(r.data));
    } catch (err) {
      console.error("Error in ComplianceRepository.getAll:", err);
      return [];
    }
  }

  public static getById(id: string): ComplianceCase | null {
    try {
      const db = getComplianceDb();
      const row = db.prepare("SELECT data FROM compliance_cases WHERE id = ?").get(id) as { data: string } | undefined;
      return row ? JSON.parse(row.data) : null;
    } catch (err) {
      console.error("Error in ComplianceRepository.getById:", err);
      return null;
    }
  }

  public static save(c: ComplianceCase): void {
    try {
      const db = getComplianceDb();
      db.prepare(`
        INSERT INTO compliance_cases (id, title, client, status, mainAssignee, feeAmount, date, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          client = excluded.client,
          status = excluded.status,
          mainAssignee = excluded.mainAssignee,
          feeAmount = excluded.feeAmount,
          date = excluded.date,
          data = excluded.data
      `).run(
        c.id,
        c.title || "",
        c.client || "",
        c.status || "",
        c.mainAssignee || "",
        Number(c.feeAmount) || 0,
        c.date || "",
        JSON.stringify(c)
      );
    } catch (err) {
      console.error("Error in ComplianceRepository.save:", err);
    }
  }

  public static delete(id: string): void {
    try {
      const db = getComplianceDb();
      const stringId = String(id).trim();
      db.prepare(`
        DELETE FROM compliance_cases 
        WHERE id = ? 
           OR json_extract(data, '$.id') = ? 
           OR json_extract(data, '$.systemId') = ? 
           OR json_extract(data, '$.contractId') = ?
      `).run(stringId, stringId, stringId, stringId);
    } catch (err) {
      console.error("Error in ComplianceRepository.delete:", err);
    }
  }
}
