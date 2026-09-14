import db from "../db/database";
import { v4 as uuidv4 } from "uuid";

export function logAction(user: string, action: string) {
  try {
    db.prepare(`INSERT INTO audit_logs VALUES (?,?,?,?)`).run(
      uuidv4(), user, action, new Date().toISOString()
    );
  } catch (err) {
    console.error("Failed to log action:", err);
  }
}
