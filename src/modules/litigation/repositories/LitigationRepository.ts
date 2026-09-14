import { getLitigationDb } from "../../../db/DatabaseManager";
import { LitigationCase } from "../types";

export class LitigationRepository {
  public static getAll(): LitigationCase[] {
    try {
      const db = getLitigationDb();
      const rows = db.prepare("SELECT data FROM litigation_cases").all() as { data: string }[];
      return rows.map(r => JSON.parse(r.data));
    } catch (err) {
      console.error("Error in LitigationRepository.getAll:", err);
      return [];
    }
  }

  public static getById(id: string): LitigationCase | null {
    try {
      const db = getLitigationDb();
      const row = db.prepare("SELECT data FROM litigation_cases WHERE id = ?").get(id) as { data: string } | undefined;
      return row ? JSON.parse(row.data) : null;
    } catch (err) {
      console.error("Error in LitigationRepository.getById:", err);
      return null;
    }
  }

  public static save(c: LitigationCase): void {
    try {
      const db = getLitigationDb();
      const fee = Number(c.feeAmount || (c as any).revenue || 0);
      const title = c.title || (c as any).name || (c as any).contractDetails?.contractName || "Hồ sơ vụ việc";
      const date = c.date || (c as any).receiveDate || (c as any).created_at || new Date().toLocaleDateString("vi-VN");

      db.prepare(`
        INSERT INTO litigation_cases (id, title, client, status, mainAssignee, feeAmount, date, data)
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
        title,
        c.client || "",
        c.status || "Tiếp nhận",
        c.mainAssignee || "",
        fee,
        date,
        JSON.stringify(c)
      );
    } catch (err) {
      console.error("Error in LitigationRepository.save:", err);
      throw err;
    }
  }

  public static delete(id: string): void {
    try {
      const db = getLitigationDb();
      const stringId = String(id).trim();
      db.prepare(`
        DELETE FROM litigation_cases 
        WHERE id = ? 
           OR json_extract(data, '$.id') = ? 
           OR json_extract(data, '$.systemId') = ? 
           OR json_extract(data, '$.contractId') = ?
      `).run(stringId, stringId, stringId, stringId);
    } catch (err) {
      console.error("Error in LitigationRepository.delete:", err);
    }
  }
}
