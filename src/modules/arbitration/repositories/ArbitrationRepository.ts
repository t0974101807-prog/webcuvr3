import { getArbitrationDb } from "../../../db/DatabaseManager";
import { ArbitrationCase } from "../types";

export class ArbitrationRepository {
  public static getAll(): ArbitrationCase[] {
    try {
      const db = getArbitrationDb();
      const rows = db.prepare("SELECT data FROM arbitration_cases").all() as { data: string }[];
      return rows.map(r => JSON.parse(r.data));
    } catch (err) {
      console.error("Error in ArbitrationRepository.getAll:", err);
      return [];
    }
  }

  public static getById(id: string): ArbitrationCase | null {
    try {
      const db = getArbitrationDb();
      const row = db.prepare("SELECT data FROM arbitration_cases WHERE id = ?").get(id) as { data: string } | undefined;
      return row ? JSON.parse(row.data) : null;
    } catch (err) {
      console.error("Error in ArbitrationRepository.getById:", err);
      return null;
    }
  }

  public static save(c: ArbitrationCase): void {
    try {
      const db = getArbitrationDb();
      db.prepare(`
        INSERT INTO arbitration_cases (id, title, client, status, mainAssignee, feeAmount, date, data)
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
      console.error("Error in ArbitrationRepository.save:", err);
    }
  }

  public static delete(id: string): void {
    try {
      const db = getArbitrationDb();
      const stringId = String(id).trim();
      db.prepare(`
        DELETE FROM arbitration_cases 
        WHERE id = ? 
           OR json_extract(data, '$.id') = ? 
           OR json_extract(data, '$.systemId') = ? 
           OR json_extract(data, '$.contractId') = ?
      `).run(stringId, stringId, stringId, stringId);
    } catch (err) {
      console.error("Error in ArbitrationRepository.delete:", err);
    }
  }
}
