import { getRepresentationDb } from "../../../db/DatabaseManager";
import { RepresentationCase } from "../types";

export class RepresentationRepository {
  public static getAll(): RepresentationCase[] {
    try {
      const db = getRepresentationDb();
      const rows = db.prepare("SELECT data FROM representation_cases").all() as { data: string }[];
      return rows.map(r => JSON.parse(r.data));
    } catch (err) {
      console.error("Error in RepresentationRepository.getAll:", err);
      return [];
    }
  }

  public static getById(id: string): RepresentationCase | null {
    try {
      const db = getRepresentationDb();
      const row = db.prepare("SELECT data FROM representation_cases WHERE id = ?").get(id) as { data: string } | undefined;
      return row ? JSON.parse(row.data) : null;
    } catch (err) {
      console.error("Error in RepresentationRepository.getById:", err);
      return null;
    }
  }

  public static save(c: RepresentationCase): void {
    try {
      const db = getRepresentationDb();
      db.prepare(`
        INSERT INTO representation_cases (id, title, client, status, mainAssignee, feeAmount, date, data)
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
      console.error("Error in RepresentationRepository.save:", err);
    }
  }

  public static delete(id: string): void {
    try {
      const db = getRepresentationDb();
      const stringId = String(id).trim();
      db.prepare(`
        DELETE FROM representation_cases 
        WHERE id = ? 
           OR json_extract(data, '$.id') = ? 
           OR json_extract(data, '$.systemId') = ? 
           OR json_extract(data, '$.contractId') = ?
      `).run(stringId, stringId, stringId, stringId);
    } catch (err) {
      console.error("Error in RepresentationRepository.delete:", err);
    }
  }
}
