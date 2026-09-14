import { getConsultationDb } from "../../../db/DatabaseManager";
import { ConsultationCase } from "../types";

export class ConsultationRepository {
  public static getAll(): ConsultationCase[] {
    try {
      const db = getConsultationDb();
      const rows = db.prepare("SELECT data FROM consultation_cases").all() as { data: string }[];
      return rows.map(r => JSON.parse(r.data));
    } catch (err) {
      console.error("Error in ConsultationRepository.getAll:", err);
      return [];
    }
  }

  public static getById(id: string): ConsultationCase | null {
    try {
      const db = getConsultationDb();
      const row = db.prepare("SELECT data FROM consultation_cases WHERE id = ?").get(id) as { data: string } | undefined;
      return row ? JSON.parse(row.data) : null;
    } catch (err) {
      console.error("Error in ConsultationRepository.getById:", err);
      return null;
    }
  }

  public static save(c: ConsultationCase): void {
    try {
      const db = getConsultationDb();
      db.prepare(`
        INSERT INTO consultation_cases (id, title, client, status, mainAssignee, feeAmount, date, data)
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
      console.error("Error in ConsultationRepository.save:", err);
    }
  }

  public static delete(id: string): void {
    try {
      const db = getConsultationDb();
      const stringId = String(id).trim();
      db.prepare(`
        DELETE FROM consultation_cases 
        WHERE id = ? 
           OR json_extract(data, '$.id') = ? 
           OR json_extract(data, '$.systemId') = ? 
           OR json_extract(data, '$.contractId') = ?
      `).run(stringId, stringId, stringId, stringId);
    } catch (err) {
      console.error("Error in ConsultationRepository.delete:", err);
    }
  }
}
