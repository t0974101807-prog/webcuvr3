"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_express12 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_express_session = __toESM(require("express-session"), 1);
var import_better_sqlite3_session_store = __toESM(require("better-sqlite3-session-store"), 1);
var import_path5 = __toESM(require("path"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_hpp = __toESM(require("hpp"), 1);
var import_xss_clean = __toESM(require("xss-clean"), 1);

// src/config/env.ts
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var config = {
  PORT: 3e3,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "lawfirm_secret",
  NODE_ENV: process.env.NODE_ENV || "development"
};

// src/server.ts
var import_http = require("http");
var import_socket = require("socket.io");

// src/db/database.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var db = new import_better_sqlite3.default("lawfirm.db");
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS employees(id TEXT, name TEXT, position TEXT, salary INTEGER, dependents INTEGER);
  CREATE TABLE IF NOT EXISTS clients(id TEXT, name TEXT, phone TEXT);
  CREATE TABLE IF NOT EXISTS cases(id TEXT, name TEXT, client TEXT, fee INTEGER);
  CREATE TABLE IF NOT EXISTS splits(case_id TEXT, employee_id TEXT, percent INTEGER);
  CREATE TABLE IF NOT EXISTS payrolls(employee_id TEXT, gross INTEGER, insurance INTEGER, tax INTEGER, net INTEGER);
  CREATE TABLE IF NOT EXISTS monthly_payrolls(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, month INTEGER, year INTEGER, staff_code TEXT, title TEXT, branch TEXT, working_days INTEGER, dependents INTEGER, gross INTEGER, insurance INTEGER, tax INTEGER, net INTEGER, food_allowance INTEGER DEFAULT 0, gas_allowance INTEGER DEFAULT 0, phone_allowance INTEGER DEFAULT 0, other_benefits INTEGER DEFAULT 0, bonus INTEGER DEFAULT 0, violations INTEGER DEFAULT 0, total_salary INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS evaluations(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, month INTEGER, year INTEGER, rating TEXT, bonus_amount INTEGER, notes TEXT);
  CREATE TABLE IF NOT EXISTS files(id TEXT, case_id TEXT, filename TEXT, path TEXT);
  CREATE TABLE IF NOT EXISTS case_text(file_id TEXT, content TEXT);
  CREATE TABLE IF NOT EXISTS court_schedule(id TEXT, case_id TEXT, date TEXT, location TEXT, note TEXT);
  CREATE TABLE IF NOT EXISTS tasks(id TEXT, employee_id TEXT, title TEXT, deadline TEXT, status TEXT);
  CREATE TABLE IF NOT EXISTS invoices(id TEXT, client_id TEXT, case_id TEXT, amount INTEGER, status TEXT, created TEXT);
  CREATE TABLE IF NOT EXISTS audit_logs(id TEXT, user TEXT, action TEXT, time TEXT);
  CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, content TEXT, icon TEXT, file_url TEXT, file_name TEXT, category TEXT);
  CREATE TABLE IF NOT EXISTS legal_services(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, content TEXT, icon TEXT, file_url TEXT, file_name TEXT);
  CREATE TABLE IF NOT EXISTS team(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, title TEXT, description TEXT, image TEXT);
  CREATE TABLE IF NOT EXISTS recruitment(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, location TEXT, type TEXT, salary TEXT, description TEXT, content TEXT, file_url TEXT, file_name TEXT);
  CREATE TABLE IF NOT EXISTS news(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, excerpt TEXT, content TEXT, date TEXT, image TEXT, category TEXT);
  
  CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, content TEXT, created_at TEXT, is_read INTEGER DEFAULT 0, reply_notes TEXT);
  CREATE TABLE IF NOT EXISTS visitor_stats(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT UNIQUE, visitors INTEGER DEFAULT 0, page_views INTEGER DEFAULT 0, chats INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS record_types(id INTEGER PRIMARY KEY AUTOINCREMENT, type_code TEXT, type_name TEXT, description TEXT, display_color TEXT, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS erp_records(id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS role_permissions (
    role TEXT PRIMARY KEY,
    manageUsers INTEGER DEFAULT 0,
    viewAllRecords INTEGER DEFAULT 0,
    editAllRecords INTEGER DEFAULT 0,
    deleteRecords INTEGER DEFAULT 0,
    viewReports INTEGER DEFAULT 0,
    manageWeb INTEGER DEFAULT 0,
    manageFinance INTEGER DEFAULT 0,
    viewPersonalRecords INTEGER DEFAULT 0,
    editPersonalRecords INTEGER DEFAULT 0,
    manageEvents INTEGER DEFAULT 0,
    manageLegalDocs INTEGER DEFAULT 0,
    viewEventHistory INTEGER DEFAULT 0
  );

  
  CREATE TABLE IF NOT EXISTS live_messages(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    visitor_id TEXT, 
    sender_type TEXT, 
    content TEXT, 
    file_url TEXT,
    file_name TEXT,
    created_at TEXT, 
    is_read INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, name TEXT, role TEXT, title TEXT, staff_code TEXT, branch TEXT, start_date TEXT, contract_type TEXT, contract_sign_date TEXT, salary TEXT, bonus TEXT, avatar TEXT, phone TEXT, email TEXT, dob TEXT, gender TEXT, address TEXT);
  CREATE TABLE IF NOT EXISTS legal_documents(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    document_number TEXT,
    issue_date TEXT,
    effective_date TEXT,
    agency TEXT,
    signer TEXT,
    content TEXT,
    status TEXT,
    created_at TEXT
  );
`);
try {
  db.prepare("ALTER TABLE users ADD COLUMN contract_sign_date TEXT").run();
} catch (e) {
}
try {
  db.prepare("ALTER TABLE users ADD COLUMN salary TEXT").run();
} catch (e) {
}
var permColumns = ["manageEvents", "manageLegalDocs", "viewEventHistory"];
for (const col of permColumns) {
  try {
    db.prepare(`ALTER TABLE role_permissions ADD COLUMN ${col} INTEGER DEFAULT 0`).run();
  } catch (e) {
  }
}
var newColumns = ["avatar", "phone", "email", "dob", "gender", "address"];
for (const col of newColumns) {
  try {
    db.prepare(`ALTER TABLE users ADD COLUMN ${col} TEXT`).run();
  } catch (e) {
  }
}
var seedData = () => {
  const servicesCount = db.prepare("SELECT COUNT(*) as count FROM services").get();
  if (servicesCount.count === 0) {
    const insertService = db.prepare("INSERT INTO services (title, description, icon, content, category) VALUES (?, ?, ?, ?, ?)");
    insertService.run("M\xF4i tr\u01B0\u1EDDng & ATTP", "T\u01B0 v\u1EA5n ph\xE1p l\xFD v\u1EC1 m\xF4i tr\u01B0\u1EDDng, gi\u1EA5y ph\xE9p v\u1EC7 sinh an to\xE0n th\u1EF1c ph\u1EA9m.", "Leaf", "### D\u1ECBch v\u1EE5 M\xF4i tr\u01B0\u1EDDng & ATTP\n\nCh\xFAng t\xF4i cung c\u1EA5p c\xE1c t\u01B0 v\u1EA5n chuy\xEAn s\xE2u v\u1EC1 ph\xE1p lu\u1EADt m\xF4i tr\u01B0\u1EDDng v\xE0 an to\xE0n th\u1EF1c ph\u1EA9m:\n\n- T\u01B0 v\u1EA5n l\u1EADp B\xE1o c\xE1o \u0111\xE1nh gi\xE1 t\xE1c \u0111\u1ED9ng m\xF4i tr\u01B0\u1EDDng (\u0110TM).\n- H\u1ED7 tr\u1EE3 th\u1EE7 t\u1EE5c xin c\u1EA5p Gi\u1EA5y ph\xE9p m\xF4i tr\u01B0\u1EDDng.\n- T\u01B0 v\u1EA5n v\xE0 xin c\u1EA5p Gi\u1EA5y ch\u1EE9ng nh\u1EADn c\u01A1 s\u1EDF \u0111\u1EE7 \u0111i\u1EC1u ki\u1EC7n an to\xE0n th\u1EF1c ph\u1EA9m.\n- \u0110\u1EA1i di\u1EC7n l\xE0m vi\u1EC7c v\u1EDBi c\u01A1 quan ch\u1EE9c n\u0103ng khi thanh tra.", "L\u0129nh v\u1EF1c ho\u1EA1t \u0111\u1ED9ng");
    insertService.run("Du l\u1ECBch & \u0110\u1EA7u t\u01B0", "T\u01B0 v\u1EA5n d\u1EF1 \xE1n du l\u1ECBch, xin gi\u1EA5y ph\xE9p l\u1EEF h\xE0nh, th\u1EE7 t\u1EE5c \u0111\u1EA7u t\u01B0 n\u01B0\u1EDBc ngo\xE0i.", "Globe", "### D\u1ECBch v\u1EE5 Du l\u1ECBch & \u0110\u1EA7u t\u01B0\n\nH\u1ED7 tr\u1EE3 nh\xE0 \u0111\u1EA7u t\u01B0 c\xE1c th\u1EE7 t\u1EE5c ph\xE1p l\xFD quan tr\u1ECDng:\n\n- T\u01B0 v\u1EA5n th\xE0nh l\u1EADp v\xE0 xin Gi\u1EA5y ph\xE9p kinh doanh d\u1ECBch v\u1EE5 l\u1EEF h\xE0nh.\n- T\u01B0 v\u1EA5n l\u1EADp d\u1EF1 \xE1n \u0111\u1EA7u t\u01B0 n\u01B0\u1EDBc ngo\xE0i t\u1EA1i Vi\u1EC7t Nam.\n- H\u1ED7 tr\u1EE3 \u0111i\u1EC1u ch\u1EC9nh Gi\u1EA5y ch\u1EE9ng nh\u1EADn \u0111\u0103ng k\xFD \u0111\u1EA7u t\u01B0.\n- T\u01B0 v\u1EA5n \u01B0u \u0111\xE3i \u0111\u1EA7u t\u01B0 hi\u1EC7n h\xE0nh.", "L\u0129nh v\u1EF1c ho\u1EA1t \u0111\u1ED9ng");
    insertService.run("B\u1EA5t \u0111\u1ED9ng s\u1EA3n & Doanh nghi\u1EC7p", "T\u01B0 v\u1EA5n ph\xE1p l\xFD d\u1EF1 \xE1n b\u1EA5t \u0111\u1ED9ng s\u1EA3n, M&A, th\xE0nh l\u1EADp v\xE0 qu\u1EA3n tr\u1ECB doanh nghi\u1EC7p.", "Building2", "### D\u1ECBch v\u1EE5 B\u1EA5t \u0111\u1ED9ng s\u1EA3n & Doanh nghi\u1EC7p\n\nGi\u1EA3i ph\xE1p ph\xE1p l\xFD to\xE0n di\u1EC7n:\n\n- T\u01B0 v\u1EA5n ph\xE1p l\xFD d\u1EF1 \xE1n b\u1EA5t \u0111\u1ED9ng s\u1EA3n, thu h\u1ED3i \u0111\u1EA5t.\n- T\u01B0 v\u1EA5n Mua b\xE1n, S\xE1p nh\u1EADp doanh nghi\u1EC7p (M&A).\n- T\u01B0 v\u1EA5n th\xE0nh l\u1EADp, gi\u1EA3i th\u1EC3 doanh nghi\u1EC7p.\n- H\u1ED7 tr\u1EE3 qu\u1EA3n tr\u1ECB n\u1ED9i b\u1ED9 v\xE0 ph\xF2ng ng\u1EEBa r\u1EE7i ro.", "L\u0129nh v\u1EF1c ho\u1EA1t \u0111\u1ED9ng");
    insertService.run("Lao \u0111\u1ED9ng & Kinh doanh", "T\u01B0 v\u1EA5n h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng, gi\u1EA3i quy\u1EBFt tranh ch\u1EA5p lao \u0111\u1ED9ng, gi\u1EA5y ph\xE9p kinh doanh.", "Briefcase", "### D\u1ECBch v\u1EE5 Lao \u0111\u1ED9ng & Kinh doanh\n\n- R\xE0 so\xE1t h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng, n\u1ED9i quy lao \u0111\u1ED9ng.\n- \u0110\u1EA1i di\u1EC7n gi\u1EA3i quy\u1EBFt c\xE1c tranh ch\u1EA5p lao \u0111\u1ED9ng.\n- Xin c\u1EA5p Gi\u1EA5y ph\xE9p lao \u0111\u1ED9ng cho ng\u01B0\u1EDDi n\u01B0\u1EDBc ngo\xE0i.\n- T\u01B0 v\u1EA5n \u0111\xE0m ph\xE1n tranh ch\u1EA5p ho\u1EA1t \u0111\u1ED9ng th\u01B0\u01A1ng m\u1EA1i.", "L\u0129nh v\u1EF1c ho\u1EA1t \u0111\u1ED9ng");
    insertService.run("Tranh t\u1EE5ng & H\xECnh s\u1EF1", "\u0110\u1EA1i di\u1EC7n tham gia t\u1ED1 t\u1EE5ng c\xE1c v\u1EE5 \xE1n d\xE2n s\u1EF1, h\xECnh s\u1EF1, h\xE0nh ch\xEDnh.", "Gavel", "### D\u1ECBch v\u1EE5 Tranh t\u1EE5ng & H\xECnh s\u1EF1\n\n- C\u1EED Lu\u1EADt s\u01B0 tham gia t\u1ED1 t\u1EE5ng b\xE0o ch\u1EEFa v\u1EE5 \xE1n h\xECnh s\u1EF1.\n- B\u1EA3o v\u1EC7 quy\u1EC1n l\u1EE3i h\u1EE3p ph\xE1p trong v\u1EE5 \xE1n D\xE2n s\u1EF1, Kinh doanh th\u01B0\u01A1ng m\u1EA1i.\n- T\u01B0 v\u1EA5n thu th\u1EADp ch\u1EE9ng c\u1EE9, \u0111\u1ECBnh h\u01B0\u1EDBng gi\u1EA3i quy\u1EBFt.\n- Th\u01B0\u01A1ng l\u01B0\u1EE3ng, h\xF2a gi\u1EA3i tr\u01B0\u1EDBc v\xE0 trong qu\xE1 tr\xECnh t\u1ED1 t\u1EE5ng.", "L\u0129nh v\u1EF1c ho\u1EA1t \u0111\u1ED9ng");
    insertService.run("S\u1EDF h\u1EEFu tr\xED tu\u1EC7 & Kh\xE1c", "\u0110\u0103ng k\xFD nh\xE3n hi\u1EC7u, b\u1EA3n quy\u1EC1n t\xE1c gi\u1EA3, ki\u1EC3u d\xE1ng c\xF4ng nghi\u1EC7p.", "Scale", "### S\u1EDF h\u1EEFu tr\xED tu\u1EC7 & C\xE1c d\u1ECBch v\u1EE5 kh\xE1c\n\n- T\u01B0 v\u1EA5n \u0111\u0103ng k\xFD Nh\xE3n hi\u1EC7u, Ki\u1EC3u d\xE1ng, S\xE1ng ch\u1EBF, B\u1EA3n quy\u1EC1n.\n- T\u01B0 v\u1EA5n x\u1EED l\xFD vi ph\u1EA1m quy\u1EC1n S\u1EDF h\u1EEFu tr\xED tu\u1EC7.\n- Gi\u1EA3i quy\u1EBFt th\u1EE7 t\u1EE5c thay \u0111\u1ED5i th\xF4ng tin ho\u1EA1t \u0111\u1ED9ng kinh doanh.\n- T\u01B0 v\u1EA5n ph\xE1p lu\u1EADt H\xF4n nh\xE2n gia \u0111\xECnh, th\u1EEBa k\u1EBF.", "L\u0129nh v\u1EF1c ho\u1EA1t \u0111\u1ED9ng");
  }
  const legalServicesCount = db.prepare("SELECT COUNT(*) as count FROM legal_services").get();
  if (legalServicesCount.count === 0) {
    const insertLegalService = db.prepare("INSERT INTO legal_services (title, description, icon, content) VALUES (?, ?, ?, ?)");
    insertLegalService.run("T\u01B0 v\u1EA5n ph\xE1p lu\u1EADt th\u01B0\u1EDDng xuy\xEAn", "Cung c\u1EA5p d\u1ECBch v\u1EE5 t\u01B0 v\u1EA5n ph\xE1p l\xFD \u0111\u1ECBnh k\u1EF3 cho doanh nghi\u1EC7p.", "Shield", "### T\u01B0 v\u1EA5n ph\xE1p lu\u1EADt th\u01B0\u1EDDng xuy\xEAn\n\n\u0110\xF3ng vai tr\xF2 nh\u01B0 m\u1ED9t b\u1ED9 ph\u1EADn ph\xE1p ch\u1EBF thu\xEA ngo\xE0i:\n\n- R\xE0 so\xE1t t\xEDnh h\u1EE3p ph\xE1p c\u1EE7a c\xE1c quy\u1EBFt \u0111\u1ECBnh n\u1ED9i b\u1ED9.\n- \u0110\xE1nh gi\xE1 r\u1EE7i ro ph\xE1p l\xFD trong h\u1EE3p \u0111\u1ED3ng.\n- C\u1EADp nh\u1EADt quy \u0111\u1ECBnh ph\xE1p lu\u1EADt m\u1EDBi.\n- T\u01B0 v\u1EA5n v\u1EA5n \u0111\u1EC1 ph\xE1p l\xFD ph\xE1t sinh h\xE0ng ng\xE0y.");
    insertLegalService.run("T\u01B0 v\u1EA5n d\u1EF1 \xE1n \u0111\u1EA7u t\u01B0", "H\u1ED7 tr\u1EE3 ph\xE1p l\xFD to\xE0n di\u1EC7n cho c\xE1c d\u1EF1 \xE1n \u0111\u1EA7u t\u01B0 trong v\xE0 ngo\xE0i n\u01B0\u1EDBc.", "Briefcase", "### T\u01B0 v\u1EA5n d\u1EF1 \xE1n \u0111\u1EA7u t\u01B0\n\nGi\u1EA3i ph\xE1p ph\xE1p l\xFD to\xE0n di\u1EC7n:\n\n- \u0110\xE1nh gi\xE1 kh\u1EA3 n\u0103ng v\xE0 \u0111i\u1EC1u ki\u1EC7n ph\xE1p l\xFD c\u1EE7a d\u1EF1 \xE1n.\n- L\u1EF1a ch\u1ECDn h\xECnh th\u1EE9c \u0111\u1EA7u t\u01B0 ph\xF9 h\u1EE3p.\n- So\u1EA1n th\u1EA3o h\u1EE3p \u0111\u1ED3ng h\u1EE3p t\xE1c.\n- Th\u1EF1c hi\u1EC7n th\u1EE7 t\u1EE5c Gi\u1EA5y ch\u1EE9ng nh\u1EADn \u0111\u1EA7u t\u01B0.");
    insertLegalService.run("Gi\u1EA3i quy\u1EBFt tranh ch\u1EA5p", "\u0110\u1EA1i di\u1EC7n kh\xE1ch h\xE0ng gi\u1EA3i quy\u1EBFt c\xE1c tranh ch\u1EA5p th\u01B0\u01A1ng m\u1EA1i, d\xE2n s\u1EF1.", "Gavel", "### Gi\u1EA3i quy\u1EBFt tranh ch\u1EA5p\n\nB\u1EA3o v\u1EC7 quy\u1EC1n l\u1EE3i t\u1ED1i \u0111a:\n\n- Tranh ch\u1EA5p h\u1EE3p \u0111\u1ED3ng mua b\xE1n.\n- Tranh ch\u1EA5p gi\u1EEFa th\xE0nh vi\xEAn/c\u1ED5 \u0111\xF4ng.\n- Tranh ch\u1EA5p s\u1EDF h\u1EEFu tr\xED tu\u1EC7, b\u1EA5t \u0111\u1ED9ng s\u1EA3n.\n- \u0110\u1EA1i di\u1EC7n th\u01B0\u01A1ng l\u01B0\u1EE3ng, ho\xE0 gi\u1EA3i ho\u1EB7c tham gia T\xF2a \xE1n/Tr\u1ECDng t\xE0i.");
    insertLegalService.run("\u0110\u1EA1i di\u1EC7n ngo\xE0i t\u1ED1 t\u1EE5ng", "\u0110\u1EA1i di\u1EC7n kh\xE1ch h\xE0ng l\xE0m vi\u1EC7c v\u1EDBi c\u01A1 quan nh\xE0 n\u01B0\u1EDBc, \u0111\u1ED1i t\xE1c.", "Users", "### \u0110\u1EA1i di\u1EC7n ngo\xE0i t\u1ED1 t\u1EE5ng\n\n- \u0110\u1EA1i di\u1EC7n kh\xE1ch h\xE0ng tham gia h\u1ECDp, \u0111\xE0m ph\xE1n.\n- \u0110\u1EA1i di\u1EC7n l\xE0m vi\u1EC7c v\u1EDBi c\u01A1 quan ch\u1EE9c n\u0103ng, thu\u1EBF.\n- Th\u1EF1c hi\u1EC7n th\u1EE7 t\u1EE5c khi\u1EBFu n\u1EA1i, t\u1ED1 c\xE1o.\n- Th\u1EF1c hi\u1EC7n th\u1EE7 t\u1EE5c thi h\xE0nh \xE1n d\xE2n s\u1EF1.");
    insertLegalService.run("D\u1ECBch v\u1EE5 gi\u1EA5y ph\xE9p", "Th\u1EF1c hi\u1EC7n c\xE1c th\u1EE7 t\u1EE5c xin c\u1EA5p c\xE1c lo\u1EA1i gi\u1EA5y ph\xE9p con.", "FileText", "### D\u1ECBch v\u1EE5 gi\u1EA5y ph\xE9p\n\nXin c\u1EA5p c\xE1c lo\u1EA1i gi\u1EA5y t\u1EDD, gi\u1EA5y ph\xE9p:\n\n- Gi\u1EA5y ph\xE9p kinh doanh d\u1ECBch v\u1EE5 l\u1EEF h\xE0nh, v\u1EADn t\u1EA3i.\n- Gi\u1EA5y ph\xE9p th\xE0nh l\u1EADp c\u01A1 s\u1EDF gi\xE1o d\u1EE5c.\n- Gi\u1EA5y ph\xE9p v\u1EC7 sinh an to\xE0n th\u1EF1c ph\u1EA9m.\n- Gi\u1EA5y ph\xE9p ph\xF2ng ch\xE1y ch\u1EEFa ch\xE1y.");
    insertLegalService.run("T\u01B0 v\u1EA5n h\u1EE3p \u0111\u1ED3ng", "So\u1EA1n th\u1EA3o, r\xE0 so\xE1t v\xE0 t\u01B0 v\u1EA5n \u0111\xE0m ph\xE1n c\xE1c lo\u1EA1i h\u1EE3p \u0111\u1ED3ng.", "FileText", "### T\u01B0 v\u1EA5n h\u1EE3p \u0111\u1ED3ng\n\nKi\u1EC3m so\xE1t r\u1EE7i ro v\xE0 t\u1ED1i \u0111a h\xF3a l\u1EE3i \xEDch:\n\n- \u0110\xE0m ph\xE1n, x\xE2y d\u1EF1ng d\u1EF1 th\u1EA3o h\u1EE3p \u0111\u1ED3ng.\n- R\xE0 so\xE1t, ch\u1EC9 ra \u0111i\u1EC3m b\u1EA5t l\u1EE3i v\xE0 \u0111\u1EC1 xu\u1EA5t s\u1EEDa \u0111\u1ED5i.\n- T\u01B0 v\u1EA5n th\u1EE7 t\u1EE5c v\xE0 \u0111i\u1EC1u ki\u1EC7n \u0111\u1EA3m b\u1EA3o hi\u1EC7u l\u1EF1c.\n- Gi\u1EA3i quy\u1EBFt tranh ch\u1EA5p qu\xE1 tr\xECnh th\u1EF1c hi\u1EC7n h\u1EE3p \u0111\u1ED3ng.");
  }
  const teamCount = db.prepare("SELECT COUNT(*) as count FROM team").get();
  if (teamCount.count === 0) {
    const insertTeam = db.prepare("INSERT INTO team (name, title, image) VALUES (?, ?, ?)");
    insertTeam.run("Lu\u1EADt s\u01B0 Nguy\u1EC5n V\u0103n A", "Gi\xE1m \u0111\u1ED1c", "https://picsum.photos/seed/lawyer1/400/500");
    insertTeam.run("Lu\u1EADt s\u01B0 Tr\u1EA7n Th\u1ECB B", "Tr\u01B0\u1EDFng ph\xF2ng Tranh t\u1EE5ng", "https://picsum.photos/seed/lawyer2/400/500");
    insertTeam.run("Lu\u1EADt s\u01B0 L\xEA V\u0103n C", "Chuy\xEAn vi\xEAn T\u01B0 v\u1EA5n", "https://picsum.photos/seed/lawyer3/400/500");
  }
  const recruitmentCount = db.prepare("SELECT COUNT(*) as count FROM recruitment").get();
  if (recruitmentCount.count === 0) {
    const insertRecruitment = db.prepare("INSERT INTO recruitment (title, location, type, salary, description, content) VALUES (?, ?, ?, ?, ?, ?)");
    insertRecruitment.run("Lu\u1EADt s\u01B0 Tranh t\u1EE5ng", "H\xE0 N\u1ED9i", "To\xE0n th\u1EDDi gian", "Th\u1ECFa thu\u1EADn", "T\xECm ki\u1EBFm lu\u1EADt s\u01B0 c\xF3 kinh nghi\u1EC7m trong l\u0129nh v\u1EF1c tranh t\u1EE5ng d\xE2n s\u1EF1 v\xE0 h\xECnh s\u1EF1.", "Y\xEAu c\u1EA7u: C\xF3 ch\u1EE9ng ch\u1EC9 h\xE0nh ngh\u1EC1 lu\u1EADt s\u01B0, \xEDt nh\u1EA5t 3 n\u0103m kinh nghi\u1EC7m tranh t\u1EE5ng th\u1EF1c t\u1EBF. K\u1EF9 n\u0103ng giao ti\u1EBFp v\xE0 \u0111\xE0m ph\xE1n t\u1ED1t.");
    insertRecruitment.run("Chuy\xEAn vi\xEAn Ph\xE1p l\xFD", "TP. H\u1ED3 Ch\xED Minh", "To\xE0n th\u1EDDi gian", "10 - 15 tri\u1EC7u", "H\u1ED7 tr\u1EE3 lu\u1EADt s\u01B0 trong vi\u1EC7c nghi\xEAn c\u1EE9u h\u1ED3 s\u01A1, so\u1EA1n th\u1EA3o v\u0103n b\u1EA3n ph\xE1p l\xFD.", "Y\xEAu c\u1EA7u: T\u1ED1t nghi\u1EC7p \u0111\u1EA1i h\u1ECDc chuy\xEAn ng\xE0nh Lu\u1EADt, ti\u1EBFng Anh giao ti\u1EBFp t\u1ED1t, th\xE0nh th\u1EA1o tin h\u1ECDc v\u0103n ph\xF2ng.");
  }
  const newsCount = db.prepare("SELECT COUNT(*) as count FROM news").get();
  if (newsCount.count === 0) {
    const insertNews = db.prepare("INSERT INTO news (title, excerpt, date, category, image) VALUES (?, ?, ?, ?, ?)");
    insertNews.run("Quy \u0111\u1ECBnh m\u1EDBi v\u1EC1 Lu\u1EADt \u0110\u1EA5t \u0111ai 2024", "Nh\u1EEFng \u0111i\u1EC3m m\u1EDBi quan tr\u1ECDng trong Lu\u1EADt \u0110\u1EA5t \u0111ai 2024 \u1EA3nh h\u01B0\u1EDFng \u0111\u1EBFn doanh nghi\u1EC7p.", "2024-03-15", "Ph\xE1p lu\u1EADt", "https://picsum.photos/seed/news1/800/600");
    insertNews.run("H\u01B0\u1EDBng d\u1EABn th\u1EE7 t\u1EE5c th\xE0nh l\u1EADp doanh nghi\u1EC7p", "C\u1EADp nh\u1EADt c\xE1c b\u01B0\u1EDBc v\xE0 th\u1EE7 t\u1EE5c c\u1EA7n thi\u1EBFt \u0111\u1EC3 th\xE0nh l\u1EADp c\xF4ng ty n\u0103m 2024.", "2024-03-10", "Doanh nghi\u1EC7p", "https://picsum.photos/seed/news2/800/600");
  }
  const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (usersCount.count === 0) {
    const insertUser = db.prepare("INSERT INTO users (username, password, name, role, staff_code, title, branch) VALUES (?, ?, ?, ?, ?, ?, ?)");
    insertUser.run("admin", "123456", "Qu\u1EA3n tr\u1ECB vi\xEAn", "admin", "NV000", "Qu\u1EA3n tr\u1ECB", "H\u1ED9i s\u1EDF");
    insertUser.run("luatsu1", "123456", "Nguy\u1EC5n V\u0103n Lu\u1EADt", "lawyer", "NV001", "Lu\u1EADt s\u01B0", "H\xE0 N\u1ED9i");
    insertUser.run("troly1", "123456", "Tr\u1EA7n Th\u1ECB Tr\u1EE3", "specialist", "NV002", "Tr\u1EE3 l\xFD ph\xE1p l\xFD", "H\xE0 N\u1ED9i");
  }
  const recordTypesCount = db.prepare("SELECT COUNT(*) as count FROM record_types").get();
  if (recordTypesCount.count === 0) {
    const insertType = db.prepare("INSERT INTO record_types (type_code, type_name, description, display_color, active) VALUES (?, ?, ?, ?, ?)");
    insertType.run("TV", "T\u01B0 v\u1EA5n", "C\xE1c v\u1EE5 vi\u1EC7c t\u01B0 v\u1EA5n ph\xE1p l\xFD chung, so\u1EA1n th\u1EA3o h\u1EE3p \u0111\u1ED3ng, di ch\xFAc...", "bg-blue-500", 1);
    insertType.run("HS", "H\xECnh s\u1EF1", "C\xE1c v\u1EE5 \xE1n h\xECnh s\u1EF1, b\xE0o ch\u1EEFa, b\u1EA3o v\u1EC7 quy\u1EC1n l\u1EE3i h\u1EE3p ph\xE1p...", "bg-rose-500", 1);
    insertType.run("DS", "D\xE2n s\u1EF1", "Tranh ch\u1EA5p d\xE2n s\u1EF1, th\u1EEBa k\u1EBF, h\u1EE3p \u0111\u1ED3ng vay m\u01B0\u1EE3n, b\u1ED3i th\u01B0\u1EDDng...", "bg-orange-500", 1);
    insertType.run("HNG\u0110", "H\xF4n nh\xE2n Gia \u0111\xECnh", "Ly h\xF4n, tranh ch\u1EA5p quy\u1EC1n nu\xF4i con, chia t\xE0i s\u1EA3n...", "bg-pink-500", 1);
    insertType.run("KDTM", "Kinh doanh Th\u01B0\u01A1ng m\u1EA1i", "Tranh ch\u1EA5p h\u1EE3p \u0111\u1ED3ng th\u01B0\u01A1ng m\u1EA1i, mua b\xE1n h\xE0ng h\xF3a, s\u1EDF h\u1EEFu tr\xED tu\u1EC7...", "bg-purple-500", 1);
    insertType.run("L\u0110", "Lao \u0111\u1ED9ng", "Tranh ch\u1EA5p h\u1EE3p \u0111\u1ED3ng lao \u0111\u1ED9ng, sa th\u1EA3i tr\xE1i ph\xE1p lu\u1EADt, b\u1EA3o hi\u1EC3m...", "bg-emerald-500", 1);
    insertType.run("HC", "H\xE0nh ch\xEDnh", "Khi\u1EBFu n\u1EA1i, t\u1ED1 c\xE1o, tranh ch\u1EA5p h\xE0nh ch\xEDnh...", "bg-emerald-500", 1);
    insertType.run("K", "Kh\xE1c", "C\xE1c lo\u1EA1i h\xECnh d\u1ECBch v\u1EE5 kh\xE1c...", "bg-slate-500", 1);
  }
  const evaluationsCount = db.prepare("SELECT COUNT(*) as count FROM evaluations").get();
  if (evaluationsCount.count === 0) {
    const insertEval = db.prepare("INSERT INTO evaluations (user_id, month, year, rating, bonus_amount, notes) VALUES (?, ?, ?, ?, ?, ?)");
    const currentMonth = (/* @__PURE__ */ new Date()).getMonth() + 1;
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    insertEval.run(2, currentMonth, currentYear, "A", 5e6, "Ho\xE0n th\xE0nh xu\u1EA5t s\u1EAFc nhi\u1EC7m v\u1EE5");
    insertEval.run(3, currentMonth, currentYear, "B", 2e6, "Ho\xE0n th\xE0nh t\u1ED1t nhi\u1EC7m v\u1EE5");
  }
  const payrollsCount = db.prepare("SELECT COUNT(*) as count FROM monthly_payrolls").get();
  if (payrollsCount.count === 0) {
    const insertPayroll = db.prepare("INSERT INTO monthly_payrolls (user_id, month, year, staff_code, title, branch, working_days, dependents, gross, insurance, tax, net) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const currentMonth = (/* @__PURE__ */ new Date()).getMonth() + 1;
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    insertPayroll.run(2, currentMonth, currentYear, "NV001", "Lu\u1EADt s\u01B0", "H\xE0 N\u1ED9i", 26, 1, 2e7, 21e5, 0, 179e5);
    insertPayroll.run(3, currentMonth, currentYear, "NV002", "Tr\u1EE3 l\xFD ph\xE1p l\xFD", "H\xE0 N\u1ED9i", 24, 0, 1e7, 105e4, 0, 895e4);
  }
  const insertPerm = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (role, manageUsers, viewAllRecords, editAllRecords, deleteRecords, viewReports, manageWeb, manageFinance, viewPersonalRecords, editPersonalRecords, manageEvents, manageLegalDocs, viewEventHistory)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const initialPermissions = {
    admin: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    director: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    deputyDirector: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    head_of_department: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    manager: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    prosecutor: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 1, viewEventHistory: 1 },
    lawyer: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 1, viewEventHistory: 1 },
    specialist: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    accountant: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 1, viewPersonalRecords: 0, editPersonalRecords: 0, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    editor: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 1, manageFinance: 0, viewPersonalRecords: 0, editPersonalRecords: 0, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    traineeLawyer: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    intern: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 }
  };
  for (const [role, perms] of Object.entries(initialPermissions)) {
    insertPerm.run(role, perms.manageUsers, perms.viewAllRecords, perms.editAllRecords, perms.deleteRecords, perms.viewReports, perms.manageWeb, perms.manageFinance, perms.viewPersonalRecords, perms.editPersonalRecords, perms.manageEvents, perms.manageLegalDocs, perms.viewEventHistory);
  }
};
seedData();
var database_default = db;

// src/modules/auth/auth.routes.ts
var import_express = require("express");

// src/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = import_jsonwebtoken.default.verify(token, config.SESSION_SECRET);
      req.session = req.session || {};
      req.session.user = decoded;
      return next();
    } catch (err) {
    }
  }
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "login required" });
}
function requirePermission(permissionKey) {
  return (req, res, next) => {
    auth(req, res, () => {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "login required" });
      }
      const role = req.session.user.role;
      if (role === "admin" || role === "Admin") {
        return next();
      }
      try {
        const p = database_default.prepare(`SELECT * FROM role_permissions WHERE role=?`).get(role || "");
        if (p && p[permissionKey]) {
          return next();
        }
      } catch (e) {
        console.error(e);
      }
      return res.status(403).json({ error: "permission denied for " + permissionKey });
    });
  };
}

// src/modules/auth/auth.routes.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_bcrypt = __toESM(require("bcrypt"), 1);

// src/utils/password.ts
function validatePassword(password) {
  if (!password) return "M\u1EADt kh\u1EA9u kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng";
  if (password.length < 8) return "M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 8 k\xFD t\u1EF1";
  if (!/^[A-Z]/.test(password)) return "Ch\u1EEF \u0111\u1EA7u ti\xEAn c\u1EE7a m\u1EADt kh\u1EA9u ph\u1EA3i vi\u1EBFt hoa";
  if (!/[a-z]/.test(password)) return "M\u1EADt kh\u1EA9u ph\u1EA3i ch\u1EE9a \xEDt nh\u1EA5t 1 ch\u1EEF vi\u1EBFt th\u01B0\u1EDDng";
  if (!/[0-9]/.test(password)) return "M\u1EADt kh\u1EA9u ph\u1EA3i ch\u1EE9a \xEDt nh\u1EA5t 1 ch\u1EEF s\u1ED1";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "M\u1EADt kh\u1EA9u ph\u1EA3i ch\u1EE9a \xEDt nh\u1EA5t 1 k\xFD t\u1EF1 \u0111\u1EB7c bi\u1EC7t";
  return null;
}

// src/modules/auth/auth.routes.ts
var router = (0, import_express.Router)();
router.post("/login", (req, res) => {
  console.log("Login request secure:", req.secure, "protocol:", req.protocol, "headers:", req.headers["x-forwarded-proto"]);
  const { username, password } = req.body;
  const dbUser = database_default.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
  let isValid = false;
  if (dbUser) {
    if (dbUser.password && (dbUser.password.startsWith("$2b$") || dbUser.password.startsWith("$2a$"))) {
      isValid = import_bcrypt.default.compareSync(password, dbUser.password);
    } else {
      isValid = dbUser.password === password;
      if (isValid) {
        const hashed = import_bcrypt.default.hashSync(password, 10);
        database_default.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, dbUser.id);
      }
    }
  }
  if (isValid) {
    const user = database_default.prepare(`SELECT id, username, name, role, title, staff_code, branch, start_date, contract_type, contract_sign_date, salary, bonus, avatar, phone, email, dob, gender, address FROM users WHERE id = ?`).get(dbUser.id);
    req.session.user = user;
    const token = import_jsonwebtoken2.default.sign(user, config.SESSION_SECRET || "secret", { expiresIn: "24h" });
    res.json({ success: true, user, token });
  } else {
    res.status(401).json({ success: false, message: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng" });
  }
});
router.post("/logout", auth, (req, res) => {
  if (req.session) {
    req.session.destroy();
  }
  res.json({ success: true });
});
router.get("/me", auth, (req, res) => {
  if (req.session?.user?.id) {
    const user = database_default.prepare(`SELECT id, username, name, role, title, staff_code, branch, start_date, contract_type, contract_sign_date, salary, bonus, avatar, phone, email, dob, gender, address FROM users WHERE id = ?`).get(req.session.user.id);
    if (user) {
      req.session.user = user;
      return res.json({ user });
    }
  }
  res.json({ user: req.session.user });
});
router.post("/change-password", auth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session?.user?.id;
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Thi\u1EBFu th\xF4ng tin" });
  }
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }
  const dbUser = database_default.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (!dbUser) {
    return res.status(404).json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng" });
  }
  let isValid = false;
  if (dbUser.password && (dbUser.password.startsWith("$2b$") || dbUser.password.startsWith("$2a$"))) {
    isValid = import_bcrypt.default.compareSync(currentPassword, dbUser.password);
  } else {
    isValid = dbUser.password === currentPassword;
  }
  if (!isValid) {
    return res.status(401).json({ success: false, message: "M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i kh\xF4ng \u0111\xFAng" });
  }
  const hashedNewPassword = import_bcrypt.default.hashSync(newPassword, 10);
  database_default.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedNewPassword, userId);
  res.json({ success: true, message: "\u0110\u1ED5i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng" });
});
var auth_routes_default = router;

// src/modules/users/users.routes.ts
var import_express2 = require("express");
var import_uuid2 = require("uuid");

// src/utils/logger.ts
var import_uuid = require("uuid");
function logAction(user, action) {
  try {
    database_default.prepare(`INSERT INTO audit_logs VALUES (?,?,?,?)`).run(
      (0, import_uuid.v4)(),
      user,
      action,
      (/* @__PURE__ */ new Date()).toISOString()
    );
  } catch (err) {
    console.error("Failed to log action:", err);
  }
}

// src/modules/users/users.routes.ts
var import_bcrypt2 = __toESM(require("bcrypt"), 1);
var router2 = (0, import_express2.Router)();
var canManageUsers = requirePermission("manageUsers");
router2.post("/employee", canManageUsers, (req, res) => {
  const { name, position, salary, dependents } = req.body;
  database_default.prepare(`INSERT INTO employees VALUES (?,?,?,?,?)`).run(
    (0, import_uuid2.v4)(),
    name,
    position,
    salary,
    dependents
  );
  logAction(req.session.user, "ADD_EMPLOYEE");
  res.json({ success: true });
});
router2.get("/employees", auth, (req, res) => {
  const employees = database_default.prepare(`SELECT * FROM employees`).all();
  res.json(employees);
});
router2.get("/users", auth, (req, res) => {
  const users = database_default.prepare(`SELECT id, username, name, role, title, staff_code, branch, start_date, contract_type, contract_sign_date, salary, bonus, avatar, phone, email, dob, gender, address FROM users`).all();
  res.json(users);
});
router2.post("/users", canManageUsers, (req, res) => {
  try {
    const data = req.body;
    if (data.password) {
      const passwordError = validatePassword(data.password);
      if (passwordError) {
        return res.status(400).json({ error: passwordError });
      }
    }
    const fields = ["username", "password", "name", "role", "title", "staff_code", "branch", "start_date", "contract_type", "contract_sign_date", "salary", "bonus", "avatar", "phone", "email", "dob", "gender", "address"];
    let keys = [];
    let values = [];
    let params = [];
    for (const field of fields) {
      if (data[field] !== void 0) {
        keys.push(field);
        values.push("?");
        let val2 = data[field];
        if (field === "password" && val2) {
          val2 = import_bcrypt2.default.hashSync(val2.toString(), 10);
        }
        params.push(val2);
      }
    }
    if (keys.length > 0) {
      const query = `INSERT INTO users (${keys.join(", ")}) VALUES (${values.join(", ")})`;
      database_default.prepare(query).run(...params);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error inserting user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router2.put("/users/:id", auth, (req, res) => {
  try {
    const userId = req.params.id;
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "login required" });
    const currentUserPerms = database_default.prepare(`SELECT manageUsers FROM role_permissions WHERE role=?`).get(currentUser.role || "");
    const canManage = currentUserPerms?.manageUsers || currentUser.role === "admin" || currentUser.role === "Admin";
    if (!canManage && currentUser.id.toString() !== userId) {
      return res.status(403).json({ error: "permission denied" });
    }
    const data = req.body;
    if (!canManage) {
      delete data.role;
      delete data.salary;
      delete data.bonus;
      delete data.title;
      delete data.staff_code;
      delete data.branch;
      delete data.start_date;
      delete data.contract_type;
      delete data.contract_sign_date;
    }
    if (data.password) {
      const passwordError = validatePassword(data.password);
      if (passwordError) {
        return res.status(400).json({ error: passwordError });
      }
    }
    const fields = ["username", "password", "name", "role", "title", "staff_code", "branch", "start_date", "contract_type", "contract_sign_date", "salary", "bonus", "avatar", "phone", "email", "dob", "gender", "address"];
    let updates = [];
    let params = [];
    for (const field of fields) {
      if (data[field] !== void 0) {
        if (field === "password") {
          if (!data[field]) continue;
          updates.push(`${field}=?`);
          params.push(import_bcrypt2.default.hashSync(data[field].toString(), 10));
        } else {
          updates.push(`${field}=?`);
          params.push(data[field]);
        }
      }
    }
    if (updates.length > 0) {
      const query = `UPDATE users SET ${updates.join(", ")} WHERE id=?`;
      params.push(userId);
      database_default.prepare(query).run(...params);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router2.delete("/users/:id", canManageUsers, (req, res) => {
  database_default.prepare(`DELETE FROM users WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});
var users_routes_default = router2;

// src/modules/clients/clients.routes.ts
var import_express3 = require("express");
var import_uuid3 = require("uuid");
var router3 = (0, import_express3.Router)();
router3.post("/client", auth, (req, res) => {
  const { name, phone } = req.body;
  database_default.prepare(`INSERT INTO clients VALUES (?,?,?)`).run((0, import_uuid3.v4)(), name, phone);
  res.json({ success: true });
});
router3.get("/clients", auth, (req, res) => {
  const clients = database_default.prepare(`SELECT * FROM clients`).all();
  res.json(clients);
});
var clients_routes_default = router3;

// src/modules/cases/cases.routes.ts
var import_express4 = require("express");
var import_uuid4 = require("uuid");
var router4 = (0, import_express4.Router)();
router4.post("/case", auth, (req, res) => {
  const { name, client, fee } = req.body;
  database_default.prepare(`INSERT INTO cases VALUES (?,?,?,?)`).run((0, import_uuid4.v4)(), name, client, fee);
  res.json({ success: true });
});
router4.get("/cases", auth, (req, res) => {
  const cases = database_default.prepare(`SELECT * FROM cases`).all();
  res.json(cases);
});
router4.post("/split", auth, (req, res) => {
  const { case_id, employee_id, percent } = req.body;
  database_default.prepare(`INSERT INTO splits VALUES (?,?,?)`).run(case_id, employee_id, percent);
  res.json({ success: true });
});
router4.get("/revenue", auth, (req, res) => {
  const rows = database_default.prepare(`SELECT fee FROM cases`).all();
  let total = 0;
  rows.forEach((r) => total += r.fee);
  res.json({ revenue: total });
});
router4.get("/record-types", auth, (req, res) => {
  console.log("HIT /record-types");
  try {
    const types = database_default.prepare(`SELECT * FROM record_types ORDER BY active DESC, type_name ASC`).all();
    console.log("TYPES length:", types.length);
    res.json(types);
  } catch (e) {
    console.error("Error in /record-types:", e);
    res.status(500).json({ error: "Server error" });
  }
});
router4.post("/record-types", requirePermission("manageWeb"), (req, res) => {
  const { type_code, type_name, description, display_color, active } = req.body;
  const result = database_default.prepare(`INSERT INTO record_types (type_code, type_name, description, display_color, active) VALUES (?, ?, ?, ?, ?)`).run(type_code, type_name, description, display_color, active === void 0 ? 1 : active);
  res.json({ success: true, id: result.lastInsertRowid });
});
router4.put("/record-types/:id", requirePermission("manageWeb"), (req, res) => {
  const { type_code, type_name, description, display_color, active } = req.body;
  database_default.prepare(`UPDATE record_types SET type_code=?, type_name=?, description=?, display_color=?, active=? WHERE id=?`).run(type_code, type_name, description, display_color, active, req.params.id);
  res.json({ success: true });
});
router4.delete("/record-types/:id", requirePermission("manageWeb"), (req, res) => {
  database_default.prepare(`DELETE FROM record_types WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});
router4.get("/erp-records", auth, (req, res) => {
  try {
    const userRole = req.session?.user?.role;
    const userName = req.session?.user?.name;
    const p = database_default.prepare(`SELECT viewAllRecords FROM role_permissions WHERE role=?`).get(userRole || "");
    const canViewAll = p?.viewAllRecords || userRole === "admin" || userRole === "Admin";
    const rows = database_default.prepare(`SELECT data FROM erp_records`).all();
    let records = rows.map((r) => JSON.parse(r.data));
    if (!canViewAll) {
      records = records.filter((r) => r.mainAssignee === userName || r.relatedStaff && Array.isArray(r.relatedStaff) && r.relatedStaff.includes(userName));
    }
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});
router4.get("/erp-records/detail", (req, res) => {
  try {
    const id = req.query.id;
    console.log("QR Lookup for id:", id);
    if (!id) return res.status(400).json({ error: "Missing id" });
    const defaultData = [];
    defaultData.forEach((r) => {
      database_default.prepare(`INSERT OR IGNORE INTO erp_records (id, data) VALUES (?, ?)`).run(r.id, JSON.stringify(r));
    });
    const normalize = (s) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/\s/g, "").toLowerCase() : "";
    const searchId = normalize(id);
    const rows = database_default.prepare(`SELECT data FROM erp_records`).all();
    let foundRecord = null;
    for (const row of rows) {
      if (!row.data) continue;
      const parsed = JSON.parse(row.data);
      if (normalize(parsed.id) === searchId || normalize(parsed.systemId) === searchId || normalize(parsed.contractId) === searchId || normalize(parsed.authContractId) === searchId || parsed.id === id || parsed.systemId === id || parsed.contractId === id) {
        foundRecord = parsed;
        break;
      }
    }
    if (foundRecord) {
      console.log("Record found!");
      res.json(foundRecord);
    } else {
      console.log("Record NOT found in DB!");
      res.status(404).json({ error: "Record not found" });
    }
  } catch (e) {
    console.error("QR Lookup Error:", e);
    res.status(500).json({ error: "Server error" });
  }
});
router4.post("/erp-records", auth, (req, res) => {
  try {
    const userRole = req.session?.user?.role;
    const userName = req.session?.user?.name;
    const p = database_default.prepare(`SELECT editAllRecords FROM role_permissions WHERE role=?`).get(userRole || "");
    const canEditAll = p?.editAllRecords || userRole === "admin" || userRole === "Admin";
    const { id, data } = req.body;
    const existing = database_default.prepare(`SELECT data FROM erp_records WHERE id=?`).get(id);
    if (existing && !canEditAll) {
      const existingData = JSON.parse(existing.data);
      if (existingData.mainAssignee !== userName && (!existingData.relatedStaff || !existingData.relatedStaff.includes(userName))) {
        return res.status(403).json({ error: "permission denied" });
      }
    }
    database_default.prepare(`INSERT INTO erp_records (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`).run(id, JSON.stringify(data));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});
var cases_routes_default = router4;

// src/modules/documents/documents.routes.ts
var import_express5 = require("express");

// src/middleware/upload.ts
var import_multer = __toESM(require("multer"), 1);
var import_path = __toESM(require("path"), 1);
var allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx"];
var upload = (0, import_multer.default)({
  storage: import_multer.default.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  // 100MB limit
  fileFilter: (req, file, cb) => {
    const ext = import_path.default.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || !ext) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// src/modules/documents/documents.routes.ts
var import_uuid5 = require("uuid");

// src/utils/file.ts
var import_fs = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var pdfParseModule = __toESM(require("pdf-parse"), 1);
var import_mammoth = __toESM(require("mammoth"), 1);
var XLSX = __toESM(require("xlsx"), 1);
var pdfParse = pdfParseModule.default || pdfParseModule;
var NAS = import_path2.default.join(process.cwd(), "nas_storage");
if (!import_fs.default.existsSync(NAS)) import_fs.default.mkdirSync(NAS, { recursive: true });
function saveFileToNAS(file, caseId) {
  const folder = import_path2.default.join(NAS, caseId);
  if (!import_fs.default.existsSync(folder)) import_fs.default.mkdirSync(folder, { recursive: true });
  const filename = `${Date.now()}_${file.originalname}`;
  const full = import_path2.default.join(folder, filename);
  import_fs.default.writeFileSync(full, file.buffer);
  return { filename, path: full };
}
async function extractTextFromFile(filePath) {
  const ext = import_path2.default.extname(filePath).toLowerCase();
  try {
    if (ext === ".pdf") {
      const data = await pdfParse(import_fs.default.readFileSync(filePath));
      return data.text;
    }
    if (ext === ".docx") {
      const result = await import_mammoth.default.extractRawText({ path: filePath });
      return result.value;
    }
    if (ext === ".xlsx") {
      const wb = XLSX.readFile(filePath);
      let text = "";
      wb.SheetNames.forEach((s) => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1 });
        text += JSON.stringify(rows) + "\n";
      });
      return text;
    }
  } catch (e) {
    console.error("Error extracting text:", e);
  }
  return "";
}

// src/modules/documents/documents.routes.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path3 = __toESM(require("path"), 1);
var router5 = (0, import_express5.Router)();
router5.post("/upload", auth, upload.any(), async (req, res) => {
  const caseId = req.body.caseId;
  const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
  if (!file) return res.status(400).json({ error: "Missing file" });
  if (caseId) {
    const savedFile = saveFileToNAS(file, caseId);
    const id = (0, import_uuid5.v4)();
    database_default.prepare(`INSERT INTO files VALUES (?,?,?,?)`).run(id, caseId, savedFile.filename, savedFile.path);
    const text = await extractTextFromFile(savedFile.path);
    database_default.prepare(`INSERT INTO case_text VALUES (?,?)`).run(id, text);
    return res.json({ success: true, fileId: id, fileUrl: `/api/files/download/${id}` });
  } else {
    const uploadDir = import_path3.default.join(process.cwd(), "uploads");
    if (!import_fs2.default.existsSync(uploadDir)) import_fs2.default.mkdirSync(uploadDir, { recursive: true });
    const safeName = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_") : "upload.bin";
    const filename = `${Date.now()}_${safeName}`;
    const fullPath = import_path3.default.join(uploadDir, filename);
    import_fs2.default.writeFileSync(fullPath, file.buffer);
    return res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      fileUrl: `/uploads/${filename}`
    });
  }
});
router5.get("/files/:caseId", auth, (req, res) => {
  const files = database_default.prepare(`SELECT id, filename FROM files WHERE case_id = ?`).all(req.params.caseId);
  res.json(files);
});
var documents_routes_default = router5;

// src/modules/cms/cms.routes.ts
var import_express6 = require("express");
var router6 = (0, import_express6.Router)();
var canEditWeb = requirePermission("manageWeb");
var val = (v) => v ?? null;
router6.get("/services", (req, res) => {
  try {
    const services = database_default.prepare(`SELECT * FROM services`).all();
    res.json(services);
  } catch (err) {
    console.error("ERROR IN /api/services:", err);
    res.status(500).json({ error: err.message });
  }
});
router6.post("/services", canEditWeb, (req, res) => {
  const { title, description, content, icon, file_url, file_name, category } = req.body;
  try {
    database_default.prepare(`INSERT INTO services (title, description, content, icon, file_url, file_name, category) VALUES (?,?,?,?,?,?,?)`).run(val(title), val(description), val(content), val(icon), val(file_url), val(file_name), val(category));
    res.json({ success: true });
  } catch (err) {
    console.error("POST /services ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
router6.put("/services/:id", canEditWeb, (req, res) => {
  const { title, description, content, icon, file_url, file_name, category } = req.body;
  try {
    database_default.prepare(`UPDATE services SET title=?, description=?, content=?, icon=?, file_url=?, file_name=?, category=? WHERE id=?`).run(val(title), val(description), val(content), val(icon), val(file_url), val(file_name), val(category), req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("PUT /services ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
router6.delete("/services/:id", canEditWeb, (req, res) => {
  try {
    database_default.prepare(`DELETE FROM services WHERE id=?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.get("/legal-services", (req, res) => {
  try {
    const services = database_default.prepare(`SELECT * FROM legal_services`).all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.post("/legal-services", canEditWeb, (req, res) => {
  const { title, description, content, icon, file_url, file_name } = req.body;
  try {
    database_default.prepare(`INSERT INTO legal_services (title, description, content, icon, file_url, file_name) VALUES (?,?,?,?,?,?)`).run(val(title), val(description), val(content), val(icon), val(file_url), val(file_name));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.put("/legal-services/:id", canEditWeb, (req, res) => {
  const { title, description, content, icon, file_url, file_name } = req.body;
  try {
    database_default.prepare(`UPDATE legal_services SET title=?, description=?, content=?, icon=?, file_url=?, file_name=? WHERE id=?`).run(val(title), val(description), val(content), val(icon), val(file_url), val(file_name), req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.delete("/legal-services/:id", canEditWeb, (req, res) => {
  try {
    database_default.prepare(`DELETE FROM legal_services WHERE id=?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.get("/team", (req, res) => {
  try {
    const team = database_default.prepare(`SELECT * FROM team`).all();
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.post("/team", canEditWeb, (req, res) => {
  const { name, title, description, image } = req.body;
  try {
    database_default.prepare(`INSERT INTO team (name, title, description, image) VALUES (?,?,?,?)`).run(val(name), val(title), val(description), val(image));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.put("/team/:id", canEditWeb, (req, res) => {
  const { name, title, description, image } = req.body;
  try {
    database_default.prepare(`UPDATE team SET name=?, title=?, description=?, image=? WHERE id=?`).run(val(name), val(title), val(description), val(image), req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.delete("/team/:id", canEditWeb, (req, res) => {
  try {
    database_default.prepare(`DELETE FROM team WHERE id=?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.get("/recruitment", (req, res) => {
  try {
    const recruitment = database_default.prepare(`SELECT * FROM recruitment`).all();
    res.json(recruitment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.post("/recruitment", canEditWeb, (req, res) => {
  const { title, location, type, salary, description, content, file_url, file_name } = req.body;
  try {
    database_default.prepare(`INSERT INTO recruitment (title, location, type, salary, description, content, file_url, file_name) VALUES (?,?,?,?,?,?,?,?)`).run(val(title), val(location), val(type), val(salary), val(description), val(content), val(file_url), val(file_name));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.put("/recruitment/:id", canEditWeb, (req, res) => {
  const { title, location, type, salary, description, content, file_url, file_name } = req.body;
  try {
    database_default.prepare(`UPDATE recruitment SET title=?, location=?, type=?, salary=?, description=?, content=?, file_url=?, file_name=? WHERE id=?`).run(val(title), val(location), val(type), val(salary), val(description), val(content), val(file_url), val(file_name), req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.delete("/recruitment/:id", canEditWeb, (req, res) => {
  try {
    database_default.prepare(`DELETE FROM recruitment WHERE id=?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.get("/news", (req, res) => {
  try {
    try {
      database_default.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run();
    } catch (e) {
    }
    const news = database_default.prepare(`SELECT id, title, excerpt as description, content, date as created_at, image as file_url, category, related_service FROM news ORDER BY date DESC`).all();
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.post("/news", canEditWeb, (req, res) => {
  const { title, description, content, created_at, file_url, category, related_service } = req.body;
  const date = created_at || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  try {
    try {
      database_default.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run();
    } catch (e) {
    }
    database_default.prepare(`INSERT INTO news (title, excerpt, content, date, image, category, related_service) VALUES (?,?,?,?,?,?,?)`).run(val(title), val(description), val(content), val(date), val(file_url), val(category), val(related_service));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.put("/news/:id", canEditWeb, (req, res) => {
  const { title, description, content, created_at, file_url, category, related_service } = req.body;
  const date = created_at || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  try {
    try {
      database_default.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run();
    } catch (e) {
    }
    database_default.prepare(`UPDATE news SET title=?, excerpt=?, content=?, date=?, image=?, category=?, related_service=? WHERE id=?`).run(val(title), val(description), val(content), val(date), val(file_url), val(category), val(related_service), req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router6.delete("/news/:id", canEditWeb, (req, res) => {
  try {
    database_default.prepare(`DELETE FROM news WHERE id=?`).run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var cms_routes_default = router6;

// src/modules/payroll/payroll.routes.ts
var import_express7 = require("express");
var router7 = (0, import_express7.Router)();
var canManageFinance = requirePermission("manageFinance");
router7.post("/monthly-payrolls", canManageFinance, (req, res) => {
  const { user_id, month, year, staff_code, title, branch, working_days, dependents, gross, insurance, tax, food_allowance, gas_allowance, phone_allowance, other_benefits, violations, total_salary } = req.body;
  const sumBonus = database_default.prepare(`SELECT SUM(bonus_amount) as s FROM evaluations WHERE user_id=? AND month=? AND year=?`).get(user_id, month, year)?.s || 0;
  const net = (total_salary || 0) + (other_benefits || 0) + sumBonus - (violations || 0) - (insurance || 0) - (tax || 0);
  const existing = database_default.prepare(`SELECT id FROM monthly_payrolls WHERE user_id=? AND month=? AND year=?`).get(user_id, month, year);
  if (existing) {
    database_default.prepare(`UPDATE monthly_payrolls SET staff_code=?, title=?, branch=?, working_days=?, dependents=?, gross=?, insurance=?, tax=?, net=?, food_allowance=?, gas_allowance=?, phone_allowance=?, other_benefits=?, bonus=?, violations=?, total_salary=? WHERE id=?`).run(
      staff_code,
      title,
      branch,
      working_days,
      dependents,
      gross,
      insurance,
      tax,
      net,
      food_allowance,
      gas_allowance,
      phone_allowance,
      other_benefits,
      sumBonus,
      violations,
      total_salary,
      existing.id
    );
  } else {
    database_default.prepare(`INSERT INTO monthly_payrolls (user_id, month, year, staff_code, title, branch, working_days, dependents, gross, insurance, tax, net, food_allowance, gas_allowance, phone_allowance, other_benefits, bonus, violations, total_salary) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      user_id,
      month,
      year,
      staff_code,
      title,
      branch,
      working_days,
      dependents,
      gross,
      insurance,
      tax,
      net,
      food_allowance,
      gas_allowance,
      phone_allowance,
      other_benefits,
      sumBonus,
      violations,
      total_salary
    );
  }
  res.json({ success: true });
});
router7.get("/monthly-payrolls", auth, (req, res) => {
  const { month, year } = req.query;
  const user = req.session.user;
  const p = database_default.prepare(`SELECT manageFinance FROM role_permissions WHERE role=?`).get(user.role || "");
  const hasAccess = p?.manageFinance || user.role === "Admin" || user.role === "admin";
  let payrolls;
  if (hasAccess) {
    payrolls = database_default.prepare(`
      SELECT p.*, u.name as user_name,
             COALESCE((SELECT SUM(bonus_amount) FROM evaluations e WHERE e.user_id = p.user_id AND e.month = p.month AND e.year = p.year), 0) as synced_bonus
      FROM monthly_payrolls p 
      JOIN users u ON p.user_id = u.id
      WHERE p.month = ? AND p.year = ?
    `).all(month, year);
  } else {
    payrolls = database_default.prepare(`
      SELECT p.*, u.name as user_name,
             COALESCE((SELECT SUM(bonus_amount) FROM evaluations e WHERE e.user_id = p.user_id AND e.month = p.month AND e.year = p.year), 0) as synced_bonus
      FROM monthly_payrolls p 
      JOIN users u ON p.user_id = u.id
      WHERE p.month = ? AND p.year = ? AND p.user_id = ?
    `).all(month, year, user.id);
  }
  for (const p2 of payrolls) {
    if (p2.bonus !== p2.synced_bonus) {
      const net = (p2.total_salary || 0) + (p2.other_benefits || 0) + p2.synced_bonus - (p2.violations || 0) - (p2.insurance || 0) - (p2.tax || 0);
      database_default.prepare(`UPDATE monthly_payrolls SET bonus=?, net=? WHERE id=?`).run(p2.synced_bonus, net, p2.id);
      p2.bonus = p2.synced_bonus;
      p2.net = net;
    }
  }
  res.json(payrolls);
});
router7.delete("/monthly-payrolls/:id", canManageFinance, (req, res) => {
  database_default.prepare(`DELETE FROM monthly_payrolls WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});
router7.post("/evaluations", canManageFinance, (req, res) => {
  const { id, user_id, month, year, rating, bonus_amount, notes } = req.body;
  if (id) {
    database_default.prepare(`UPDATE evaluations SET rating=?, bonus_amount=?, notes=? WHERE id=?`).run(
      rating,
      bonus_amount,
      notes,
      id
    );
  } else {
    database_default.prepare(`INSERT INTO evaluations (user_id, month, year, rating, bonus_amount, notes) VALUES (?,?,?,?,?,?)`).run(
      user_id,
      month,
      year,
      rating,
      bonus_amount,
      notes
    );
  }
  const payroll = database_default.prepare(`SELECT * FROM monthly_payrolls WHERE user_id=? AND month=? AND year=?`).get(user_id, month, year);
  const sumBonus = database_default.prepare(`SELECT SUM(bonus_amount) as s FROM evaluations WHERE user_id=? AND month=? AND year=?`).get(user_id, month, year)?.s || 0;
  if (payroll) {
    const net = (payroll.total_salary || 0) + (payroll.other_benefits || 0) + sumBonus - (payroll.violations || 0) - (payroll.insurance || 0) - (payroll.tax || 0);
    database_default.prepare(`UPDATE monthly_payrolls SET bonus=?, net=? WHERE id=?`).run(sumBonus, net, payroll.id);
  } else {
    const user = database_default.prepare(`SELECT * FROM users WHERE id=?`).get(user_id);
    if (user) {
      const gross = 0;
      const net = sumBonus;
      database_default.prepare(`INSERT INTO monthly_payrolls (user_id, month, year, staff_code, title, branch, working_days, dependents, gross, insurance, tax, net, food_allowance, gas_allowance, phone_allowance, other_benefits, bonus, violations, total_salary) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        user_id,
        month,
        year,
        user.staff_code || "",
        user.title || user.role || "",
        user.branch || "H\xE0 N\u1ED9i",
        26,
        0,
        gross,
        0,
        0,
        net,
        0,
        0,
        0,
        0,
        sumBonus,
        0,
        0
      );
    }
  }
  res.json({ success: true });
});
router7.get("/evaluations", auth, (req, res) => {
  const { month, year } = req.query;
  const user = req.session.user;
  const p = database_default.prepare(`SELECT manageFinance FROM role_permissions WHERE role=?`).get(user.role || "");
  const hasAccess = p?.manageFinance || user.role === "Admin" || user.role === "admin";
  let evaluations;
  if (hasAccess) {
    evaluations = database_default.prepare(`
      SELECT e.*, u.name as user_name, u.staff_code, u.title, u.branch 
      FROM evaluations e 
      JOIN users u ON e.user_id = u.id
      WHERE e.month = ? AND e.year = ?
    `).all(month, year);
  } else {
    evaluations = database_default.prepare(`
      SELECT e.*, u.name as user_name, u.staff_code, u.title, u.branch 
      FROM evaluations e 
      JOIN users u ON e.user_id = u.id
      WHERE e.month = ? AND e.year = ? AND e.user_id = ?
    `).all(month, year, user.id);
  }
  res.json(evaluations);
});
router7.delete("/evaluations/:id", canManageFinance, (req, res) => {
  const evalRec = database_default.prepare(`SELECT user_id, month, year FROM evaluations WHERE id=?`).get(req.params.id);
  database_default.prepare(`DELETE FROM evaluations WHERE id=?`).run(req.params.id);
  if (evalRec) {
    const payroll = database_default.prepare(`SELECT * FROM monthly_payrolls WHERE user_id=? AND month=? AND year=?`).get(evalRec.user_id, evalRec.month, evalRec.year);
    if (payroll) {
      const sumBonus = database_default.prepare(`SELECT SUM(bonus_amount) as s FROM evaluations WHERE user_id=? AND month=? AND year=?`).get(evalRec.user_id, evalRec.month, evalRec.year)?.s || 0;
      const net = (payroll.total_salary || 0) + (payroll.other_benefits || 0) + sumBonus - (payroll.violations || 0) - (payroll.insurance || 0) - (payroll.tax || 0);
      database_default.prepare(`UPDATE monthly_payrolls SET bonus=?, net=? WHERE id=?`).run(sumBonus, net, payroll.id);
    }
  }
  res.json({ success: true });
});
var payroll_routes_default = router7;

// src/modules/contact/contact.routes.ts
var import_express8 = __toESM(require("express"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);
var import_multer2 = __toESM(require("multer"), 1);
var router8 = import_express8.default.Router();
var storage = import_multer2.default.diskStorage({
  destination: function(req, file, cb) {
    const dir = import_path4.default.join(process.cwd(), "uploads");
    if (!import_fs3.default.existsSync(dir)) {
      import_fs3.default.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "chat-" + uniqueSuffix + import_path4.default.extname(file.originalname));
  }
});
var allowedExtensions2 = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx"];
var upload2 = (0, import_multer2.default)({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  // 20MB limit
  fileFilter: (req, file, cb) => {
    const ext = import_path4.default.extname(file.originalname).toLowerCase();
    if (allowedExtensions2.includes(ext) || !ext) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});
router8.get("/live-threads", auth, (req, res) => {
  try {
    const threads = database_default.prepare(`
      SELECT visitor_id, MAX(created_at) as last_message_time, SUM(CASE WHEN is_read=0 AND sender_type='visitor' THEN 1 ELSE 0 END) as unread_count 
      FROM live_messages 
      GROUP BY visitor_id 
      ORDER BY last_message_time DESC
    `).all();
    for (const t of threads) {
      const lastMsg = database_default.prepare("SELECT content, sender_type FROM live_messages WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1").get(t.visitor_id);
      t.last_message = lastMsg?.content || "\u0110\xE3 g\u1EEDi file \u0111\xEDnh k\xE8m";
      t.last_sender = lastMsg?.sender_type;
    }
    res.json(threads);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router8.get("/live-messages/:visitorId", (req, res) => {
  try {
    const msgs = database_default.prepare("SELECT * FROM live_messages WHERE visitor_id = ? ORDER BY created_at ASC").all(req.params.visitorId);
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router8.post("/live-upload", upload2.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, name: req.file.originalname });
});
router8.post("/record-view", (req, res) => {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  try {
    database_default.prepare("INSERT OR IGNORE INTO visitor_stats (date, visitors, page_views, chats) VALUES (?, 0, 0, 0)").run(today);
    database_default.prepare("UPDATE visitor_stats SET page_views = page_views + 1 WHERE date = ?").run(today);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to record view" });
  }
});
router8.post("/record-visitor", (req, res) => {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  try {
    database_default.prepare("INSERT OR IGNORE INTO visitor_stats (date, visitors, page_views, chats) VALUES (?, 0, 0, 0)").run(today);
    database_default.prepare("UPDATE visitor_stats SET visitors = visitors + 1 WHERE date = ?").run(today);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to record visitor" });
  }
});
router8.post("/messages", (req, res) => {
  const { name, email, phone, content } = req.body;
  const created_at = (/* @__PURE__ */ new Date()).toISOString();
  const today = created_at.split("T")[0];
  try {
    database_default.prepare("INSERT INTO messages (name, email, phone, content, created_at) VALUES (?, ?, ?, ?, ?)").run(name, email, phone, content, created_at);
    database_default.prepare("INSERT OR IGNORE INTO visitor_stats (date, visitors, page_views, chats) VALUES (?, 0, 0, 0)").run(today);
    database_default.prepare("UPDATE visitor_stats SET chats = chats + 1 WHERE date = ?").run(today);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router8.get("/messages", auth, (req, res) => {
  try {
    const messages = database_default.prepare("SELECT * FROM messages ORDER BY created_at DESC").all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router8.put("/messages/:id", auth, (req, res) => {
  const { is_read, reply_notes } = req.body;
  try {
    if (reply_notes !== void 0) {
      database_default.prepare("UPDATE messages SET is_read = ?, reply_notes = ? WHERE id = ?").run(is_read ? 1 : 0, reply_notes, req.params.id);
    } else {
      database_default.prepare("UPDATE messages SET is_read = ? WHERE id = ?").run(is_read ? 1 : 0, req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router8.get("/stats", auth, (req, res) => {
  try {
    const stats = database_default.prepare("SELECT * FROM visitor_stats ORDER BY date ASC").all();
    const totalMessages = database_default.prepare("SELECT COUNT(*) as count FROM messages").get();
    const unreadMessages = database_default.prepare("SELECT COUNT(*) as count FROM messages WHERE is_read = 0").get();
    res.json({
      chartData: stats,
      summary: {
        totalMessages: totalMessages.count,
        unreadMessages: unreadMessages.count
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router8.post("/stats/seed", auth, (req, res) => {
  for (let i = 20; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    try {
      database_default.prepare("INSERT OR IGNORE INTO visitor_stats (date, visitors, page_views, chats) VALUES (?, ?, ?, ?)").run(
        dateStr,
        Math.floor(Math.random() * 20),
        Math.floor(Math.random() * 50) + 10,
        Math.floor(Math.random() * 5)
      );
    } catch (e) {
    }
  }
  res.json({ success: true });
});
var contact_routes_default = router8;

// src/modules/ai/ai.routes.ts
var import_express9 = require("express");
var import_genai = require("@google/genai");
var router9 = (0, import_express9.Router)();
router9.post("/ask", auth, async (req, res) => {
  try {
    const { prompt, files } = req.body;
    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey === "MY_GEMINI_API_KEY" || apiKey === "dummy" || apiKey === "your_api_key_here") {
      apiKey = void 0;
    }
    const ai = new import_genai.GoogleGenAI(apiKey ? { apiKey } : {});
    const searchLegalDocumentsTool = {
      name: "search_legal_documents",
      description: "Tra c\u1EE9u c\xE1c v\u0103n b\u1EA3n ph\xE1p lu\u1EADt hi\u1EC7n h\xE0nh trong kho d\u1EEF li\u1EC7u c\u1EE7a c\xF4ng ty b\u1EB1ng t\u1EEB kh\xF3a li\xEAn quan.",
      parameters: {
        type: import_genai.Type.OBJECT,
        properties: {
          query: {
            type: import_genai.Type.STRING,
            description: "T\u1EEB kh\xF3a t\xECm ki\u1EBFm (VD: 'Lu\u1EADt doanh nghi\u1EC7p', 'ly h\xF4n', 'h\u1EE3p \u0111\u1ED3ng th\xE0nh l\u1EADp')."
          }
        },
        required: ["query"]
      }
    };
    const parts = [];
    if (prompt && prompt.trim() !== "") {
      parts.push({ text: prompt });
    }
    if (files && files.length > 0) {
      for (const f of files) {
        parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
      }
    }
    if (parts.length === 0) {
      parts.push({ text: "Xin ch\xE0o, b\u1EA1n c\xF3 th\u1EC3 gi\xFAp g\xEC cho t\xF4i?" });
    }
    const systemInstruction = "B\u1EA1n l\xE0 m\u1ED9t tr\u1EE3 l\xFD ph\xE1p l\xFD AI xu\u1EA5t s\u1EAFc c\u1EE7a c\xF4ng ty Lu\u1EADt TNHH \xC1nh D\u01B0\u01A1ng. Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n l\xE0 h\u1ED7 tr\u1EE3 lu\u1EADt s\u01B0 v\xE0 nh\xE2n vi\xEAn c\xF4ng ty tra c\u1EE9u th\xF4ng tin, ph\xE2n t\xEDch h\u1ED3 s\u01A1 v\xE0 \u0111\u01B0a ra c\xE1c \u0111\u1EC1 xu\u1EA5t v\u1EC1 ph\xE1p l\xFD. H\xE3y s\u1EED d\u1EE5ng c\xF4ng c\u1EE5 'search_legal_documents' n\u1EBFu c\xE2u h\u1ECFi li\xEAn quan \u0111\u1EBFn ho\u1EB7c c\u1EA7n tham chi\u1EBFu c\xE1c v\u0103n b\u1EA3n ph\xE1p lu\u1EADt, lu\u1EADt ho\u1EB7c n\u1ED9i quy \u0111ang \xE1p d\u1EE5ng. Sau \u0111\xF3 tr\xEDch d\u1EABn th\xF4ng tin \u0111\u1EC3 ph\xE2n t\xEDch h\u1ED3 s\u01A1 v\u1EE5 \xE1n cho ch\xEDnh x\xE1c nh\u1EA5t.";
    let chat;
    let modelResponse;
    try {
      chat = await ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [searchLegalDocumentsTool] }]
        }
      });
      modelResponse = await chat.sendMessage({ parts });
    } catch (err) {
      console.log(err);
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts }],
        config: { systemInstruction }
      });
      return res.json({ text: result.text });
    }
    let finalResponseText = modelResponse.text || "";
    if (modelResponse.functionCalls && modelResponse.functionCalls.length > 0) {
      for (const call of modelResponse.functionCalls) {
        if (call.name === "search_legal_documents") {
          const query = call.args?.query || "";
          let results = [];
          try {
            const docs = database_default.prepare(`SELECT title, document_number, issue_date, content FROM legal_documents WHERE title LIKE ? OR content LIKE ? COLLATE NOCASE LIMIT 20`).all(`%${query}%`, `%${query}%`);
            results = docs;
          } catch (e) {
          }
          const functionResponseParts = [{
            functionResponse: {
              name: "search_legal_documents",
              response: { results }
            }
          }];
          const secondResponse = await chat.sendMessage(functionResponseParts);
          finalResponseText = secondResponse.text || "";
        }
      }
    }
    res.json({ text: finalResponseText });
  } catch (error) {
    console.error("AI Route Error:", error);
    const errorStr = error.message || String(error);
    if (errorStr.includes("API key not valid") || errorStr.includes("API_KEY_INVALID") || errorStr.includes("API key not valid")) {
      return res.status(400).json({ error: "API Key kh\xF4ng h\u1EE3p l\u1EC7. Vui l\xF2ng c\u1EADp nh\u1EADt API Key ch\xEDnh x\xE1c tr\xEAn h\u1EC7 th\u1ED1ng." });
    }
    res.status(500).json({ error: error.message || "L\u1ED7i khi x\u1EED l\xFD v\u1EDBi AI." });
  }
});
var ai_routes_default = router9;

// src/modules/permissions/permissions.routes.ts
var import_express10 = require("express");
var router10 = (0, import_express10.Router)();
router10.get("/permissions", auth, (req, res) => {
  try {
    const perms = database_default.prepare(`SELECT * FROM role_permissions`).all();
    const permissionsMap = {};
    for (const p of perms) {
      permissionsMap[p.role] = {
        manageUsers: !!p.manageUsers,
        viewAllRecords: !!p.viewAllRecords,
        editAllRecords: !!p.editAllRecords,
        deleteRecords: !!p.deleteRecords,
        viewReports: !!p.viewReports,
        manageWeb: !!p.manageWeb,
        manageFinance: !!p.manageFinance,
        viewPersonalRecords: !!p.viewPersonalRecords,
        editPersonalRecords: !!p.editPersonalRecords,
        manageEvents: !!p.manageEvents,
        manageLegalDocs: !!p.manageLegalDocs,
        viewEventHistory: !!p.viewEventHistory
      };
    }
    res.json(permissionsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router10.put("/permissions", auth, (req, res) => {
  try {
    if (req.session?.user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    const permissionsMap = req.body;
    const updatePerm = database_default.prepare(`
      UPDATE role_permissions 
      SET manageUsers=?, viewAllRecords=?, editAllRecords=?, deleteRecords=?, viewReports=?, manageWeb=?, manageFinance=?, viewPersonalRecords=?, editPersonalRecords=?, manageEvents=?, manageLegalDocs=?, viewEventHistory=?
      WHERE role=?
    `);
    database_default.transaction(() => {
      for (const [role, perms] of Object.entries(permissionsMap)) {
        updatePerm.run(
          perms.manageUsers ? 1 : 0,
          perms.viewAllRecords ? 1 : 0,
          perms.editAllRecords ? 1 : 0,
          perms.deleteRecords ? 1 : 0,
          perms.viewReports ? 1 : 0,
          perms.manageWeb ? 1 : 0,
          perms.manageFinance ? 1 : 0,
          perms.viewPersonalRecords ? 1 : 0,
          perms.editPersonalRecords ? 1 : 0,
          perms.manageEvents ? 1 : 0,
          perms.manageLegalDocs ? 1 : 0,
          perms.viewEventHistory ? 1 : 0,
          role
        );
      }
    })();
    logAction(req.session.user, "UPDATE_PERMISSIONS");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router10.get("/permissions/me", auth, (req, res) => {
  try {
    const role = req.session?.user?.role;
    if (!role) return res.json({});
    const p = database_default.prepare(`SELECT * FROM role_permissions WHERE role=?`).get(role || "");
    if (!p) return res.json({});
    res.json({
      manageUsers: !!p.manageUsers,
      viewAllRecords: !!p.viewAllRecords,
      editAllRecords: !!p.editAllRecords,
      deleteRecords: !!p.deleteRecords,
      viewReports: !!p.viewReports,
      manageWeb: !!p.manageWeb,
      manageFinance: !!p.manageFinance,
      viewPersonalRecords: !!p.viewPersonalRecords,
      editPersonalRecords: !!p.editPersonalRecords,
      manageEvents: !!p.manageEvents,
      manageLegalDocs: !!p.manageLegalDocs,
      viewEventHistory: !!p.viewEventHistory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var permissions_routes_default = router10;

// src/modules/legal_documents/legal_documents.routes.ts
var import_express11 = __toESM(require("express"), 1);
var router11 = import_express11.default.Router();
router11.get("/legal_documents", (req, res) => {
  try {
    const docs = database_default.prepare("SELECT * FROM legal_documents ORDER BY issue_date DESC").all();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router11.post("/legal_documents", (req, res) => {
  try {
    const { title, document_number, issue_date, effective_date, agency, signer, content, status } = req.body;
    const created_at = (/* @__PURE__ */ new Date()).toISOString();
    const result = database_default.prepare(`
      INSERT INTO legal_documents (title, document_number, issue_date, effective_date, agency, signer, content, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, document_number, issue_date, effective_date, agency, signer, content, status, created_at);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router11.put("/legal_documents/:id", (req, res) => {
  try {
    const { title, document_number, issue_date, effective_date, agency, signer, content, status } = req.body;
    const { id } = req.params;
    database_default.prepare(`
      UPDATE legal_documents 
      SET title = ?, document_number = ?, issue_date = ?, effective_date = ?, agency = ?, signer = ?, content = ?, status = ?
      WHERE id = ?
    `).run(title, document_number, issue_date, effective_date, agency, signer, content, status, id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router11.delete("/legal_documents/:id", (req, res) => {
  try {
    const { id } = req.params;
    database_default.prepare("DELETE FROM legal_documents WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
var legal_documents_routes_default = router11;

// src/server.ts
var app = (0, import_express12.default)();
var httpServer = (0, import_http.createServer)(app);
var io = new import_socket.Server(httpServer, {
  cors: { origin: true, credentials: true },
  maxHttpBufferSize: 1e8
  // 100 MB for file uploads via socket if needed
});
var PORT = config.PORT;
app.use((0, import_helmet.default)({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: false
}));
app.use((req, res, next) => {
  if (req.query) {
    const q = req.query;
    Object.defineProperty(req, "query", {
      value: q,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});
app.use((0, import_hpp.default)());
app.use((0, import_xss_clean.default)());
app.use((0, import_cors.default)({ origin: true, credentials: true }));
app.use(import_express12.default.json({ limit: "50mb" }));
app.use(import_express12.default.urlencoded({ limit: "50mb", extended: true }));
var limiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 300
});
app.use("/api", limiter);
app.set("trust proxy", 1);
var SqliteStore = (0, import_better_sqlite3_session_store.default)(import_express_session.default);
app.use((0, import_express_session.default)({
  store: new SqliteStore({
    client: database_default,
    expired: {
      clear: true,
      intervalMs: 9e5
    }
  }),
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 864e5,
    sameSite: "none",
    secure: true
  }
}));
app.get("/api/test", (req, res) => res.json({ test: "ok" }));
app.use("/api", auth_routes_default);
app.use("/api", users_routes_default);
app.use("/api", clients_routes_default);
app.use("/api", cases_routes_default);
app.use("/api", documents_routes_default);
app.use("/api", cms_routes_default);
app.use("/api", payroll_routes_default);
app.use("/api", contact_routes_default);
app.use("/api/ai", ai_routes_default);
app.use("/api", permissions_routes_default);
app.use("/api", legal_documents_routes_default);
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});
app.use("/uploads", import_express12.default.static(import_path5.default.join(process.cwd(), "uploads"), {
  setHeaders: (res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'unsafe-inline'");
  }
}));
io.on("connection", (socket) => {
  socket.on("join_visitor", (visitorId) => {
    socket.join(`visitor_${visitorId}`);
  });
  socket.on("join_admin", () => {
    socket.join("admins");
  });
  socket.on("send_message", (data) => {
    const created_at = (/* @__PURE__ */ new Date()).toISOString();
    try {
      database_default.prepare("INSERT INTO live_messages (visitor_id, sender_type, content, file_url, file_name, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)").run(data.visitorId, data.senderType, data.content, data.fileUrl || null, data.fileName || null, created_at, data.senderType === "admin" ? 1 : 0);
      const newMsg = { ...data, created_at };
      if (data.senderType === "visitor") {
        io.to("admins").emit("receive_message", newMsg);
        io.to(`visitor_${data.visitorId}`).emit("receive_message", newMsg);
      } else if (data.senderType === "admin") {
        io.to(`visitor_${data.visitorId}`).emit("receive_message", newMsg);
        io.to("admins").emit("receive_message", newMsg);
      }
    } catch (e) {
      console.error("Socket insert err", e);
    }
  });
  socket.on("mark_read", (visitorId) => {
    try {
      database_default.prepare("UPDATE live_messages SET is_read = 1 WHERE visitor_id = ? AND sender_type = 'visitor'").run(visitorId);
      io.to("admins").emit("messages_read", { visitorId });
    } catch (e) {
    }
  });
  socket.on("disconnect", () => {
  });
});
async function startServer() {
  if (config.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path5.default.join(process.cwd(), "dist");
    app.use(import_express12.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path5.default.join(distPath, "index.html"));
    });
  }
  httpServer.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Exiting to allow restart...`);
      process.exit(1);
    } else {
      console.error("Server error:", e);
    }
  });
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`LAW FIRM ERP AI RUNNING ON HTTP://LOCALHOST:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
