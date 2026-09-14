import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// In Cloud Run or production environments without a writable volume, write to /tmp/data/
const baseDir = process.env.NODE_ENV === "production" ? "/tmp/data" : "data";
try {
  fs.mkdirSync(baseDir, { recursive: true });
} catch (err) {
  console.error("Failed to create data directory:", err);
}

export class DatabaseManager {
  private static connections: Map<string, Database.Database> = new Map();

  public static getDbPath(name: string): string {
    return path.join(baseDir, `${name}.db`);
  }

  public static getConnection(name: string): Database.Database {
    if (this.connections.has(name)) {
      return this.connections.get(name)!;
    }

    const dbPath = this.getDbPath(name);
    let db: Database.Database;

    try {
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('busy_timeout = 5000');
    } catch (err: any) {
      console.error(`Database ${name} at ${dbPath} is malformed or locked. Recreating...`, err);
      try {
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
        if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
      } catch (e) {}
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('busy_timeout = 5000');
    }

    this.connections.set(name, db);
    this.initializeSchema(name, db);
    return db;
  }

  private static initializeSchema(name: string, db: Database.Database) {
    const tableName = `${name}_cases`;
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id TEXT PRIMARY KEY,
        title TEXT,
        client TEXT,
        status TEXT,
        mainAssignee TEXT,
        feeAmount REAL,
        date TEXT,
        data TEXT
      );
    `);
  }

  public static closeAll() {
    for (const [name, conn] of this.connections.entries()) {
      try {
        conn.close();
      } catch (err) {
        console.error(`Error closing connection for ${name}:`, err);
      }
    }
    this.connections.clear();
  }
}

export const getLitigationDb = () => DatabaseManager.getConnection("litigation");
export const getConsultationDb = () => DatabaseManager.getConnection("consultation");
export const getRepresentationDb = () => DatabaseManager.getConnection("representation");
export const getComplianceDb = () => DatabaseManager.getConnection("compliance");
export const getArbitrationDb = () => DatabaseManager.getConnection("arbitration");
