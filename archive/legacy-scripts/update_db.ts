import Database from "better-sqlite3";
const db = new Database("lawfirm.db");
try {
  db.prepare("ALTER TABLE team ADD COLUMN description TEXT").run();
  console.log("Column description added to team table");
} catch (e: any) {
  if (e.message.includes("duplicate column name")) {
    console.log("Column already exists");
  } else {
    console.error(e);
  }
}
