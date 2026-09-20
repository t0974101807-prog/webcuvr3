import Database from "better-sqlite3";
import fs from "fs";
import bcrypt from "bcrypt";

// In Cloud Run or production environments without a writable volume, we must write to /tmp
const dbPath = process.env.NODE_ENV === "production" ? "/tmp/lawfirm.db" : "lawfirm.db";

let db: Database.Database;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('cache_size = 10000');
} catch (err: any) {
  if (err && err.message && (err.message.includes("malformed") || err.message.includes("corrupt"))) {
    console.error("Database disk image is malformed or corrupt. Deleting and recreating...", err);
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    } catch (unlinkErr) {
      console.error("Failed to delete corrupt database files:", unlinkErr);
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('temp_store = MEMORY');
    db.pragma('cache_size = 10000');
  } else {
    throw err;
  }
}

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
  CREATE TABLE IF NOT EXISTS audit_logs(id TEXT PRIMARY KEY, user TEXT, action TEXT, entityType TEXT, entityId TEXT, performedBy TEXT, performedAt TEXT, reason TEXT, result TEXT, time TEXT, details TEXT);
  CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, content TEXT, icon TEXT, file_url TEXT, file_name TEXT, category TEXT);
  CREATE TABLE IF NOT EXISTS legal_services(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, content TEXT, icon TEXT, file_url TEXT, file_name TEXT);
  CREATE TABLE IF NOT EXISTS team(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, title TEXT, description TEXT, image TEXT);
  CREATE TABLE IF NOT EXISTS recruitment(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, location TEXT, type TEXT, salary TEXT, description TEXT, content TEXT, file_url TEXT, file_name TEXT);
  CREATE TABLE IF NOT EXISTS recruitment_benefits(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, icon TEXT);
  CREATE TABLE IF NOT EXISTS recruitment_process(id INTEGER PRIMARY KEY AUTOINCREMENT, step TEXT, title TEXT, description TEXT);
  CREATE TABLE IF NOT EXISTS news(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, excerpt TEXT, content TEXT, date TEXT, image TEXT, category TEXT);
  CREATE TABLE IF NOT EXISTS legal_forms(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, category TEXT, description TEXT, content TEXT);
  CREATE TABLE IF NOT EXISTS judgments(id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, title TEXT, court TEXT, date TEXT, category TEXT, summary TEXT, content TEXT);
  CREATE TABLE IF NOT EXISTS precedents(id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, title TEXT, approved_date TEXT, summary TEXT, law_issue TEXT, solution TEXT);
  CREATE TABLE IF NOT EXISTS testimonials(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, role TEXT, rating INTEGER, content TEXT, avatar TEXT, company TEXT);
  CREATE TABLE IF NOT EXISTS land_prices(
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    province_code TEXT, 
    province_name TEXT, 
    district_id TEXT, 
    district_name TEXT, 
    ward_name TEXT,
    street_name TEXT, 
    price INTEGER, 
    residential_price TEXT,
    commercial_price TEXT,
    non_agricultural_price TEXT,
    agricultural_price TEXT,
    is_approved INTEGER DEFAULT 1
  );
  
  CREATE TABLE IF NOT EXISTS subdivision_limits(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province_name TEXT,
    district_name TEXT,
    ward_name TEXT,
    subdivision_area TEXT,
    residential_limit TEXT,
    is_approved INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS land_documents(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province_name TEXT,
    province_code TEXT,
    file_name TEXT,
    file_path TEXT,
    uploaded_at TEXT,
    content TEXT,
    doc_type TEXT
  );
  
  CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, phone TEXT, content TEXT, created_at TEXT, is_read INTEGER DEFAULT 0, reply_notes TEXT);
  CREATE TABLE IF NOT EXISTS portal_activities(id TEXT PRIMARY KEY, type TEXT NOT NULL, client_id TEXT, client_name TEXT, document_title TEXT, response_time_minutes INTEGER, timestamp TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS visitor_stats(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT UNIQUE, visitors INTEGER DEFAULT 0, page_views INTEGER DEFAULT 0, chats INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS record_types(id INTEGER PRIMARY KEY AUTOINCREMENT, type_code TEXT, type_name TEXT, description TEXT, display_color TEXT, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS erp_records(id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS recycle_bin (id TEXT PRIMARY KEY, master_id TEXT, masterId TEXT, systemId TEXT, originalId TEXT, original_table TEXT, data TEXT, deleted_at TEXT, deleted_by TEXT, reason TEXT, previous_status TEXT);
  CREATE TABLE IF NOT EXISTS gmail_accounts (email TEXT PRIMARY KEY, pass TEXT, recovery TEXT, proxy TEXT, phone TEXT, status TEXT, created_at TEXT);
  CREATE TABLE IF NOT EXISTS system_events (
    id TEXT PRIMARY KEY,
    title TEXT,
    date TEXT,
    startDate TEXT,
    start TEXT,
    startTime TEXT,
    end TEXT,
    endTime TEXT,
    type TEXT,
    location TEXT,
    priority TEXT,
    allDay INTEGER DEFAULT 1,
    reminder TEXT,
    notes TEXT,
    color TEXT,
    icon TEXT,
    created_by TEXT,
    updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS system_notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    time TEXT,
    read INTEGER DEFAULT 0,
    importance TEXT,
    sendTo TEXT,
    selectedUsers TEXT,
    selectedCases TEXT,
    sender TEXT,
    displaySendTo TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS legal_documents_history (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, doc_name TEXT, user TEXT, time TEXT);
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

  CREATE TABLE IF NOT EXISTS firestore_sync_outbox(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT,
    created_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    UNIQUE(table_name, record_id)
  );

  
  CREATE TABLE IF NOT EXISTS record_messages(id INTEGER PRIMARY KEY AUTOINCREMENT, record_id TEXT, sender_name TEXT, sender_role TEXT, content TEXT, file_url TEXT, file_name TEXT, created_at TEXT, is_read INTEGER DEFAULT 0);
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
  CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, name TEXT, role TEXT, title TEXT, staff_code TEXT, branch TEXT, start_date TEXT, contract_type TEXT, contract_sign_date TEXT, salary TEXT, bonus TEXT, avatar TEXT, phone TEXT, email TEXT, dob TEXT, gender TEXT, address TEXT, case_id TEXT, manager_id TEXT, practice_areas TEXT, account_type TEXT DEFAULT 'INTERNAL');
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
  CREATE TABLE IF NOT EXISTS signed_documents(
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    client_name TEXT,
    template_id TEXT,
    document_title TEXT,
    document_code TEXT,
    signed_url TEXT,
    signed_at TEXT,
    ink_color TEXT,
    method TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS appointments(
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    phone TEXT,
    category TEXT,
    date_time TEXT,
    assigned_staff TEXT,
    type TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS offices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    short_name TEXT,
    region TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    map_url TEXT,
    is_headquarters INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL
  );

  CREATE TABLE IF NOT EXISTS contact_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    provider_type TEXT,
    api_key TEXT,
    api_url TEXT,
    default_model TEXT,
    task_assignment TEXT DEFAULT 'all',
    temperature REAL DEFAULT 0.2,
    max_tokens INTEGER DEFAULT 4096,
    is_active INTEGER DEFAULT 1,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_models (
    id TEXT PRIMARY KEY,
    name TEXT,
    provider TEXT,
    context_window TEXT,
    input_cost REAL DEFAULT 0,
    output_cost REAL DEFAULT 0,
    capabilities TEXT,
    enabled INTEGER DEFAULT 1,
    assigned_task TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_name TEXT,
    model_used TEXT,
    prompt_snippet TEXT,
    response_snippet TEXT,
    latency_ms INTEGER,
    status TEXT,
    error_message TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    case_id TEXT UNIQUE,
    case_code TEXT,
    client_id TEXT,
    client_name TEXT,
    contract_value INTEGER DEFAULT 0,
    paid_amount INTEGER DEFAULT 0,
    remaining_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payment_schedules (
    id TEXT PRIMARY KEY,
    payment_id TEXT,
    case_id TEXT,
    case_code TEXT,
    payment_ref TEXT UNIQUE,
    type TEXT DEFAULT 'DP',
    round INTEGER DEFAULT 1,
    percentage REAL DEFAULT 0,
    amount INTEGER DEFAULT 0,
    due_date TEXT,
    status TEXT DEFAULT 'Draft',
    notes TEXT,
    qr_code_url TEXT,
    qr_token TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,
    payment_ref TEXT,
    schedule_id TEXT,
    case_id TEXT,
    bank_code TEXT,
    account_number TEXT,
    account_holder TEXT,
    amount INTEGER,
    transfer_content TEXT,
    transaction_time TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'Matched',
    reconciliation_notes TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS payment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    case_id TEXT,
    payment_ref TEXT,
    payload_json TEXT,
    created_at TEXT
  );

  /* HRM SYSTEM TABLES */
  CREATE TABLE IF NOT EXISTS hr_departments (
    id TEXT PRIMARY KEY,
    department_name TEXT,
    manager_id TEXT,
    description TEXT,
    status TEXT DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS hr_positions (
    id TEXT PRIMARY KEY,
    position_name TEXT,
    level INTEGER DEFAULT 1,
    salary_grade TEXT,
    permission_group TEXT
  );

  CREATE TABLE IF NOT EXISTS hr_shifts (
    id TEXT PRIMARY KEY,
    shift_name TEXT,
    start_time TEXT,
    end_time TEXT,
    break_time TEXT,
    late_allowance INTEGER DEFAULT 15,
    early_allowance INTEGER DEFAULT 15,
    working_days TEXT DEFAULT 'Mon-Fri'
  );

  CREATE TABLE IF NOT EXISTS hr_attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    date TEXT,
    check_in TEXT,
    check_out TEXT,
    working_hours REAL DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    early_leave INTEGER DEFAULT 0,
    ot_hours REAL DEFAULT 0,
    device_id TEXT,
    attendance_method TEXT,
    gps TEXT,
    ip TEXT,
    photo TEXT,
    status TEXT DEFAULT 'Present',
    ai_warning TEXT
  );

  CREATE TABLE IF NOT EXISTS hr_leave_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    leave_type TEXT,
    start_date TEXT,
    end_date TEXT,
    reason TEXT,
    attachment TEXT,
    approved_by TEXT,
    status TEXT DEFAULT 'Pending',
    workflow_step INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS hr_payrolls (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    month INTEGER,
    year INTEGER,
    base_salary REAL DEFAULT 0,
    allowance REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    commission REAL DEFAULT 0,
    ot_salary REAL DEFAULT 0,
    insurance REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    deduction REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft'
  );

  CREATE TABLE IF NOT EXISTS hr_performances (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    month INTEGER,
    year INTEGER,
    kpi_score REAL DEFAULT 0,
    ai_score REAL DEFAULT 0,
    manager_score REAL DEFAULT 0,
    total_score REAL DEFAULT 0,
    rank TEXT DEFAULT 'B',
    billable_hours REAL DEFAULT 0,
    non_billable_hours REAL DEFAULT 0,
    court_time REAL DEFAULT 0,
    client_meetings REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS hr_contracts (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    contract_code TEXT,
    contract_type TEXT,
    start_date TEXT,
    end_date TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'Active',
    digital_signature TEXT
  );

  CREATE TABLE IF NOT EXISTS hr_equipment (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    equipment_name TEXT,
    category TEXT,
    serial_number TEXT,
    assigned_date TEXT,
    status TEXT DEFAULT 'In Use'
  );

  CREATE TABLE IF NOT EXISTS hr_training (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    course_name TEXT,
    score REAL DEFAULT 0,
    certificate_url TEXT,
    issued_date TEXT,
    expiry_date TEXT,
    status TEXT DEFAULT 'Completed',
    media_url TEXT
  );

  CREATE TABLE IF NOT EXISTS hr_recruitment (
    id TEXT PRIMARY KEY,
    candidate_name TEXT,
    email TEXT,
    phone TEXT,
    position TEXT,
    cv_url TEXT,
    ai_score REAL DEFAULT 0,
    ocr_summary TEXT,
    status TEXT DEFAULT 'New',
    interview_date TEXT
  );

  CREATE TABLE IF NOT EXISTS hr_workflows (
    id TEXT PRIMARY KEY,
    workflow_name TEXT,
    type TEXT,
    steps_json TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS hr_business_trips (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    destination TEXT,
    start_date TEXT,
    end_date TEXT,
    budget REAL DEFAULT 0,
    task_description TEXT,
    report_url TEXT,
    status TEXT DEFAULT 'Pending'
  );

  CREATE TABLE IF NOT EXISTS hr_overtimes (
    id TEXT PRIMARY KEY,
    employee_id TEXT,
    date TEXT,
    ot_hours REAL DEFAULT 0,
    multiplier REAL DEFAULT 1.5,
    reason TEXT,
    status TEXT DEFAULT 'Pending'
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    receipt_code TEXT UNIQUE,
    payment_ref TEXT,
    case_id TEXT,
    case_code TEXT,
    client_name TEXT,
    amount INTEGER,
    payment_method TEXT DEFAULT 'VietQR Bank Transfer',
    created_by TEXT,
    notes TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS case_qr_tokens (
    id TEXT PRIMARY KEY,
    case_id TEXT UNIQUE,
    token TEXT UNIQUE,
    created_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_live_messages_visitor_id ON live_messages(visitor_id);
  CREATE INDEX IF NOT EXISTS idx_record_messages_record_id ON record_messages(record_id);
  CREATE INDEX IF NOT EXISTS idx_monthly_payrolls_user_id ON monthly_payrolls(user_id);
  CREATE INDEX IF NOT EXISTS idx_monthly_payrolls_month_year ON monthly_payrolls(month, year);
  CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    staff_code TEXT,
    staff_name TEXT,
    role TEXT,
    date TEXT,
    status TEXT,
    check_in_time TEXT,
    explanation TEXT,
    proof_file TEXT,
    approved_by_controller INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS report_unlock_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dossier_id TEXT,
    client_name TEXT,
    staff_name TEXT,
    event_title TEXT,
    event_date TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS qc_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT,
    type TEXT, -- 'violation' or 'bonus'
    points_effect INTEGER,
    money_effect INTEGER,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS qc_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    rule_code TEXT,
    month INTEGER,
    year INTEGER,
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
  );

  CREATE TABLE IF NOT EXISTS finance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    amount INTEGER,
    category TEXT,
    description TEXT,
    date TEXT,
    created_by TEXT,
    status TEXT DEFAULT 'completed',
    approved_by TEXT
  );

  CREATE TABLE IF NOT EXISTS company_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    value INTEGER,
    purchase_date TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS company_debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debtor_name TEXT,
    type TEXT,
    amount INTEGER,
    due_date TEXT,
    status TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS tax_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT,
    year INTEGER,
    tax_type TEXT,
    amount INTEGER,
    status TEXT,
    submission_date TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS budget_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT,
    year INTEGER,
    budget_amount INTEGER,
    expected_revenue INTEGER,
    expected_expense INTEGER,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS salary_payment_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month INTEGER,
    year INTEGER,
    total_amount INTEGER,
    status TEXT DEFAULT 'pending_approval',
    created_by TEXT,
    approved_by TEXT,
    paid_at TEXT,
    details TEXT
  );

  CREATE TABLE IF NOT EXISTS voip_calls (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    type TEXT,
    duration INTEGER DEFAULT 0,
    timestamp TEXT,
    hasRecording INTEGER DEFAULT 1,
    recordingUrl TEXT,
    staffName TEXT,
    staffRole TEXT,
    branch TEXT,
    status TEXT DEFAULT 'connected',
    transcript TEXT,
    isViolated INTEGER DEFAULT 0,
    violatedKeywords TEXT DEFAULT '[]',
    dossierId TEXT,
    dossierTitle TEXT,
    category TEXT DEFAULT 'Tư vấn Pháp lý',
    consultationNote TEXT,
    qcRating TEXT,
    qcNotes TEXT,
    qcEvaluator TEXT,
    gateway TEXT DEFAULT 'yeastar'
  );

  CREATE TABLE IF NOT EXISTS call_events (
    event_id TEXT PRIMARY KEY,
    call_id TEXT,
    event_type TEXT,
    event_time TEXT,
    employee_id TEXT,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS system_performance_metrics (
    id TEXT PRIMARY KEY,
    metric_type TEXT,
    value REAL,
    details TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS quality_assurance_evaluations (
    id TEXT PRIMARY KEY,
    call_id TEXT,
    staff_name TEXT,
    score TEXT,
    has_violation INTEGER DEFAULT 0,
    violated_keywords TEXT DEFAULT '[]',
    audited_at TEXT,
    details TEXT
  );

  -- AI AGENT MEMORY ENGINE TABLES (Inspired by TencentDB-Agent-Memory / Mem0)
  CREATE TABLE IF NOT EXISTS ai_agent_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL DEFAULT 'system',
    memory_type TEXT NOT NULL DEFAULT 'semantic', -- 'semantic', 'episodic', 'user_preference', 'case_insight', 'client_fact', 'decision_pattern', 'working'
    category TEXT DEFAULT 'general', -- 'case_note', 'client_profile', 'legal_preference', 'procedural_habit', 'rule'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    entity_type TEXT DEFAULT 'SYSTEM', -- 'CLIENT', 'CASE', 'LAWYER', 'LAW', 'DOCUMENT', 'USER', 'SYSTEM'
    entity_id TEXT,
    importance_score REAL DEFAULT 0.5, -- 0.0 to 1.0
    confidence_score REAL DEFAULT 0.8, -- 0.0 to 1.0
    access_count INTEGER DEFAULT 0,
    last_accessed_at TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'archived', 'consolidated'
    source_session TEXT,
    tags TEXT DEFAULT '[]', -- JSON array of tags
    metadata TEXT DEFAULT '{}', -- JSON metadata
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_memory_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name TEXT NOT NULL UNIQUE,
    entity_type TEXT NOT NULL, -- 'PERSON', 'ORGANIZATION', 'CASE', 'LAW', 'CONTRACT', 'LOCATION'
    description TEXT,
    attributes TEXT DEFAULT '{}', -- JSON key-values
    relations TEXT DEFAULT '[]', -- JSON array of [{ target, relation, weight }]
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_memory_reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT DEFAULT 'system',
    reflection_title TEXT NOT NULL,
    insights TEXT NOT NULL,
    source_memory_ids TEXT DEFAULT '[]', -- JSON array of memory IDs
    created_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_memories_user ON ai_agent_memories(user_email);
  CREATE INDEX IF NOT EXISTS idx_memories_type ON ai_agent_memories(memory_type);
  CREATE INDEX IF NOT EXISTS idx_memories_entity ON ai_agent_memories(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_memories_importance ON ai_agent_memories(importance_score);

  CREATE TABLE IF NOT EXISTS chat_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_private INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS chat_channel_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER,
    user_id INTEGER,
    joined_at TEXT
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    created_at TEXT,
    is_read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    action_type TEXT NOT NULL,
    module_name TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS cost_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    current_approver_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS case_deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT NOT NULL,
    deadline_type TEXT NOT NULL,
    deadline_date TEXT NOT NULL,
    is_notified_zalo INTEGER DEFAULT 0,
    is_notified_email INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_cost_approvals_status ON cost_approvals(status);
`);

// Add custom commission rate columns to users table
try {
  db.prepare("ALTER TABLE users ADD COLUMN commission_percent INTEGER DEFAULT 5").run();
} catch (e) {
  // Column might already exist
}

try {
  db.prepare("ALTER TABLE users ADD COLUMN bonus_completion_percent INTEGER DEFAULT 10").run();
} catch (e) {
  // Column might already exist
}

// Add contract_sign_date column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN contract_sign_date TEXT").run();
} catch (e) {
  // Column might already exist
}

// Add salary column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN salary TEXT").run();
} catch (e) {
  // Column might already exist
}

// Add case_id column if it doesn't exist for client associations
try {
  db.prepare("ALTER TABLE users ADD COLUMN case_id TEXT").run();
} catch (e) {
  // Column might already exist
}

// Add known_devices column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN known_devices TEXT").run();
} catch (e) {
  // Column might already exist
}

// Add login protection fields if they don't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN login_failures INTEGER DEFAULT 0").run();
} catch (e) {
  // Column might already exist
}

try {
  db.prepare("ALTER TABLE users ADD COLUMN locked_until TEXT").run();
} catch (e) {
  // Column might already exist
}

// Add practice_areas column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN practice_areas TEXT").run();
} catch (e) {
  // Column might already exist
}

// Add account_type column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'INTERNAL'").run();
} catch (e) {
  // Column might already exist
}

// Database-level guard: the canonical admin account cannot be deleted or demoted.
db.exec(`
  CREATE TRIGGER IF NOT EXISTS protect_system_admin_delete
  BEFORE DELETE ON users
  WHEN OLD.username = 'admin' OR OLD.role = 'admin'
  BEGIN
    SELECT RAISE(ABORT, 'SYSTEM_ADMIN_PROTECTED');
  END;
  CREATE TRIGGER IF NOT EXISTS protect_system_admin_identity
  BEFORE UPDATE OF username, role ON users
  WHEN OLD.username = 'admin' AND (NEW.username <> 'admin' OR NEW.role <> 'admin')
  BEGIN
    SELECT RAISE(ABORT, 'SYSTEM_ADMIN_IDENTITY_PROTECTED');
  END;
`);

// Migrations for recycle_bin table
try {
  db.prepare("ALTER TABLE recycle_bin ADD COLUMN deleted_by TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE recycle_bin ADD COLUMN reason TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE recycle_bin ADD COLUMN previous_status TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE recycle_bin ADD COLUMN master_id TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE recycle_bin ADD COLUMN masterId TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE recycle_bin ADD COLUMN systemId TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE recycle_bin ADD COLUMN originalId TEXT").run();
} catch (e) {}

// Migrations and indexes for voip_calls and call_events
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN phone_number TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN customer_id TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN employee_id TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN office_id TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN direction TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN start_time TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN answer_time TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN end_time TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN wait_duration INTEGER DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN ring_duration INTEGER DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN hold_duration INTEGER DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN call_result TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN created_at TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE voip_calls ADD COLUMN updated_at TEXT").run(); } catch (e) {}

try { db.prepare("CREATE INDEX IF NOT EXISTS idx_voip_calls_phone ON voip_calls(phone)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_voip_calls_phone_num ON voip_calls(phone_number)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_voip_calls_staff ON voip_calls(staffName)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_voip_calls_timestamp ON voip_calls(timestamp)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_voip_calls_dossier ON voip_calls(dossierId)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_voip_calls_status ON voip_calls(status)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_voip_calls_direction ON voip_calls(direction)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_call_events_call ON call_events(call_id)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_call_events_type ON call_events(event_type)").run(); } catch (e) {}

// Migrations for cases table (Soft Delete support)
try {
  db.prepare("ALTER TABLE cases ADD COLUMN is_deleted INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE cases ADD COLUMN deleted_at TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE cases ADD COLUMN deleted_by TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE cases ADD COLUMN delete_reason TEXT").run();
} catch (e) {}

// Indexes for cases and recycle_bin table to improve performance & ensure indexes are updated
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_cases_is_deleted ON cases(is_deleted)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_cases_deleted_at ON cases(deleted_at)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_cases_id ON cases(id)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_recycle_bin_deleted_at ON recycle_bin(deleted_at)").run(); } catch (e) {}

// Migrations for files table (Soft Delete support)
try {
  db.prepare("ALTER TABLE files ADD COLUMN is_deleted INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE files ADD COLUMN deleted_at TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE files ADD COLUMN deleted_by TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE files ADD COLUMN delete_reason TEXT").run();
} catch (e) {}

// Migrations for audit_logs table
try {
  db.prepare("ALTER TABLE audit_logs ADD COLUMN entityType TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE audit_logs ADD COLUMN entityId TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE audit_logs ADD COLUMN performedBy TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE audit_logs ADD COLUMN performedAt TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE audit_logs ADD COLUMN reason TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE audit_logs ADD COLUMN result TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE audit_logs ADD COLUMN details TEXT").run();
} catch (e) {}

// Migrations for chat_channels, chat_messages, chat_channel_members, chat_reactions
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN is_deleted INTEGER DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN deleted_at TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN deleted_by TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN delete_reason TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN case_id TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN case_code TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN case_title TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN category TEXT DEFAULT 'general'").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN department TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_channels ADD COLUMN branch TEXT").run(); } catch (e) {}

try { db.prepare("ALTER TABLE chat_channel_members ADD COLUMN role TEXT DEFAULT 'member'").run(); } catch (e) {}

try { db.prepare("ALTER TABLE chat_messages ADD COLUMN reply_to_id INTEGER").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_messages ADD COLUMN is_pinned INTEGER DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_messages ADD COLUMN pinned_by INTEGER").run(); } catch (e) {}
try { db.prepare("ALTER TABLE chat_messages ADD COLUMN pinned_at TEXT").run(); } catch (e) {}

try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS chat_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      created_at TEXT
    )
  `).run();
} catch (e) {}

try { db.prepare("CREATE INDEX IF NOT EXISTS idx_chat_reactions_msg ON chat_reactions(message_id)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_chat_channels_deleted ON chat_channels(is_deleted)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id)").run(); } catch (e) {}
try { db.prepare("CREATE INDEX IF NOT EXISTS idx_chat_channel_members_chan ON chat_channel_members(channel_id)").run(); } catch (e) {}

// Seed default official channels if none exist
try {
  const channelCount = db.prepare("SELECT COUNT(*) as count FROM chat_channels WHERE is_deleted = 0 OR is_deleted IS NULL").get() as { count: number };
  if (!channelCount || channelCount.count === 0) {
    const defaultChannels = [
      { name: "chung-toan-van-phong", description: "Kênh trao đổi chung cho toàn thể cán bộ nhân viên hãng luật", is_private: 0, category: "general" },
      { name: "thong-bao-noi-bo", description: "Kênh thông báo chính thức từ Ban Giám đốc và Hành chính", is_private: 0, category: "general" },
      { name: "phong-tranh-tung", description: "Phòng nghiệp vụ Luật sư Tranh tụng & Tố tụng", is_private: 0, category: "department", department: "Tranh tụng" },
      { name: "phong-tu-van", description: "Phòng nghiệp vụ Tư vấn Doanh nghiệp & Đầu tư", is_private: 0, category: "department", department: "Tư vấn" },
      { name: "chi-nhanh-ha-noi", description: "Kênh kết nối đội ngũ Chi nhánh Hà Nội", is_private: 0, category: "branch", branch: "Hà Nội" },
      { name: "chi-nhanh-ho-chi-minh", description: "Kênh kết nối đội ngũ Chi nhánh TP. Hồ Chí Minh", is_private: 0, category: "branch", branch: "TP. Hồ Chí Minh" }
    ];
    const insertChan = db.prepare(`
      INSERT INTO chat_channels (name, description, is_private, created_by, created_at, category, department, branch, is_deleted)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?, 0)
    `);
    const nowIso = new Date().toISOString();
    for (const dc of defaultChannels) {
      insertChan.run(dc.name, dc.description, dc.is_private, nowIso, dc.category, dc.department || null, dc.branch || null);
    }
  }
} catch (seedChanErr) {
  console.error("Error seeding default chat channels:", seedChanErr);
}

// Add missing soft-delete and metadata columns to cases table if they don't exist
const casesColumns = [
  'is_deleted INTEGER DEFAULT 0',
  'deleted_at TEXT',
  'deleted_by TEXT',
  'delete_reason TEXT',
  'domain_type TEXT',
  'domain_name TEXT'
];
for (const colDef of casesColumns) {
  try {
    db.prepare(`ALTER TABLE cases ADD COLUMN ${colDef}`).run();
  } catch (e) {
    // Column might already exist
  }
}

// Add target_type and target_name columns to evaluations if they don't exist
try {
  db.prepare("ALTER TABLE evaluations ADD COLUMN target_type TEXT DEFAULT 'personnel'").run();
} catch (e) {
  // Column might already exist
}

try {
  db.prepare("ALTER TABLE evaluations ADD COLUMN target_name TEXT").run();
} catch (e) {
  // Column might already exist
}

// Add new role_permissions columns if they don't exist
const permColumns = [
  'manageUsers',
  'viewAllRecords',
  'editAllRecords',
  'deleteRecords',
  'viewReports',
  'manageWeb',
  'manageFinance',
  'viewPersonalRecords',
  'editPersonalRecords',
  'manageEvents',
  'manageLegalDocs',
  'viewEventHistory'
];
for (const col of permColumns) {
  try {
    db.prepare(`ALTER TABLE role_permissions ADD COLUMN ${col} INTEGER DEFAULT 0`).run();
  } catch (e) {
    // Column might already exist
  }
}

// Add new profile columns if they don't exist
const newColumns = ['avatar', 'phone', 'email', 'dob', 'gender', 'address'];
for (const col of newColumns) {
  try {
    db.prepare(`ALTER TABLE users ADD COLUMN ${col} TEXT`).run();
  } catch (e) {
    // Column might already exist
  }
}

// Add summary and category columns to legal_documents if they don't exist
try {
  db.prepare("ALTER TABLE legal_documents ADD COLUMN summary TEXT").run();
} catch (e) {
  // Column might already exist
}

try {
  db.prepare("ALTER TABLE legal_documents ADD COLUMN category TEXT").run();
} catch (e) {
  // Column might already exist
}

// Add new columns to land_prices if they don't exist
const landPriceCols = [
  'ward_name TEXT',
  'residential_price TEXT',
  'commercial_price TEXT',
  'non_agricultural_price TEXT',
  'agricultural_price TEXT'
];
for (const colDef of landPriceCols) {
  try {
    const colName = colDef.split(' ')[0];
    db.prepare(`ALTER TABLE land_prices ADD COLUMN ${colDef}`).run();
  } catch (e) {
    // Column might already exist
  }
}


// Seed Data
const seedData = () => {
  const defaultServices = [
    {
      title: "Môi trường & ATTP",
      description: "Tư vấn pháp lý về môi trường, giấy phép vệ sinh an toàn thực phẩm.",
      icon: "Leaf",
      content: `### Dịch vụ Môi trường & ATTP\n\nChúng tôi cung cấp các tư vấn chuyên sâu về pháp luật môi trường và an toàn thực phẩm:\n\n- Tư vấn lập Báo cáo đánh giá tác động môi trường (ĐTM).\n- Hỗ trợ thủ tục xin cấp Giấy phép môi trường.\n- Tư vấn và xin cấp Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm.\n- Đại diện làm việc với cơ quan chức năng khi thanh tra.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Du lịch & Đầu tư",
      description: "Tư vấn dự án du lịch, xin giấy phép lữ hành, thủ tục đầu tư nước ngoài.",
      icon: "Globe",
      content: `### Dịch vụ Du lịch & Đầu tư\n\nHỗ trợ nhà đầu tư các thủ tục pháp lý quan trọng:\n\n- Tư vấn thành lập và xin Giấy phép kinh doanh dịch vụ lữ hành.\n- Tư vấn lập dự án đầu tư nước ngoài tại Việt Nam.\n- Hỗ trợ điều chỉnh Giấy chứng nhận đăng ký đầu tư.\n- Tư vấn ưu đãi đầu tư hiện hành.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Bất động sản & Doanh nghiệp",
      description: "Tư vấn pháp lý dự án bất động sản, M&A, thành lập và quản trị doanh nghiệp.",
      icon: "Building2",
      content: `### Dịch vụ Bất động sản & Doanh nghiệp\n\nGiải pháp pháp lý toàn diện:\n\n- Tư vấn pháp lý dự án bất động sản, thu hồi đất.\n- Tư vấn Mua bán, Sáp nhập doanh nghiệp (M&A).\n- Tư vấn thành lập, giải thể doanh nghiệp.\n- Hỗ trợ quản trị nội bộ và phòng ngừa rủi ro.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Lao động & Kinh doanh",
      description: "Tư vấn hợp đồng lao động, giải quyết tranh chấp lao động, giấy phép kinh doanh.",
      icon: "Briefcase",
      content: `### Dịch vụ Lao động & Kinh doanh\n\n- Rà soát hợp đồng lao động, nội quy lao động.\n- Đại diện giải quyết các tranh chấp lao động.\n- Xin cấp Giấy phép lao động cho người nước ngoài.\n- Tư vấn đàm phán tranh chấp hoạt động thương mại.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Tranh tụng & Hình sự",
      description: "Đại diện tham gia tố tụng các vụ án dân sự, hình sự, hành chính.",
      icon: "Gavel",
      content: `### Dịch vụ Tranh tụng & Hình sự\n\n- Cử Luật sư tham gia tố tụng bào chữa vụ án hình sự.\n- Bảo vệ quyền lợi hợp pháp trong vụ án Dân sự, Kinh doanh thương mại.\n- Tư vấn thu thập chứng cứ, định hướng giải quyết.\n- Thương lượng, hòa giải trước và trong quá trình tố tụng.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Sở hữu trí tuệ & Khác",
      description: "Đăng ký nhãn hiệu, bản quyền tác giả, kiểu dáng công nghiệp.",
      icon: "Scale",
      content: `### Sở hữu trí tuệ & Các dịch vụ khác\n\n- Tư vấn đăng ký Nhãn hiệu, Kiểu dáng, Sáng chế, Bản quyền.\n- Tư vấn xử lý vi phạm quyền Sở hữu trí tuệ.\n- Giải quyết thủ tục thay đổi thông tin hoạt động kinh doanh.\n- Tư vấn pháp luật Hôn nhân gia đình, thừa kế.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Doanh nghiệp",
      description: "Tư vấn thành lập, mua bán sáp nhập, thay đổi đăng ký kinh doanh và tái cấu trúc doanh nghiệp.",
      icon: "Building2",
      content: `### Tư vấn Pháp luật Doanh nghiệp Toàn diện\n\nChúng tôi đồng hành cùng sự phát triển của doanh nghiệp từ khi khởi sự đến khi vận hành ổn định và phát triển bền vững:\n\n- **Tái cấu trúc & Quản trị**: Tư vấn xây dựng điều lệ, quy chế quản lý nội bộ, phân chia quyền hạn đại diện pháp luật, phòng ngừa tranh chấp nội bộ cổ đông.\n- **Thủ tục đăng ký kinh doanh**: Thay đổi ngành nghề, tăng/giảm vốn điều lệ, chuyển đổi loại hình doanh nghiệp, chuyển nhượng cổ phần/vốn góp.\n- **Thư ký pháp lý thường xuyên**: Giải đáp các vướng mắc phát sinh trong giao dịch hàng ngày, rà soát văn bản hành chính.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Vụ việc dân sự",
      description: "Bảo vệ quyền lợi trong các tranh chấp đất đai, thừa kế di sản, đòi nợ và bồi thường thiệt hại ngoài hợp đồng.",
      icon: "Scale",
      content: `### Giải quyết Vụ việc Dân sự & Đất đai\n\nHỗ trợ khách hàng bảo vệ quyền và lợi ích hợp pháp tối đa trong các giao dịch và tranh chấp dân sự:\n\n- **Thừa kế & Di chúc**: Tư vấn soạn thảo di chúc hợp pháp, phân chia di sản thừa kế theo pháp luật hoặc di chúc, giải quyết tranh chấp di sản thừa kế phức tạp.\n- **Giao dịch dân sự**: Tư vấn tính pháp lý của hợp đồng đặt cọc, chuyển nhượng, tặng cho, thế chấp tài sản, đòi lại nhà đất cho mượn, cho ở nhờ.\n- **Bồi thường thiệt hại**: Tư vấn và đại diện yêu cầu bồi thường thiệt hại về tính mạng, sức khỏe, danh dự, tài sản do hành vi trái pháp luật gây ra.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Lao động",
      description: "Tư vấn hợp đồng lao động, nội quy lao động, giải quyết tranh chấp sa thải trái luật.",
      icon: "Briefcase",
      content: `### Tư vấn Pháp luật Lao động & Nhân sự\n\nKiến tạo môi trường làm việc hài hòa, đúng luật cho doanh nghiệp và bảo vệ quyền lợi hợp pháp cho người lao động:\n\n- **Xây dựng hệ thống quy chế**: Soạn thảo hợp đồng lao động, thỏa ước lao động tập thể, nội quy lao động đăng ký đúng quy định với Sở Lao động.\n- **Giải quyết tranh chấp lao động**: Đại diện đàm phán hoặc tham gia tố tụng trong các vụ án đơn phương chấm dứt hợp đồng lao động, kỷ luật sa thải, bồi thường chi phí đào tạo.\n- **Giấy phép lao động**: Thực hiện thủ tục cấp mới, gia hạn Giấy phép lao động (Work Permit) và Thẻ tạm trú cho người lao động nước ngoài tại Việt Nam.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Mua bán & Sáp nhập",
      description: "Thực hiện rà soát pháp lý (due diligence), đàm phán và soạn thảo hợp đồng M&A.",
      icon: "Building2",
      content: `### Dịch vụ Tư vấn Mua bán & Sáp nhập (M&A)\n\nCung cấp giải pháp chiến lược và kiểm soát rủi ro pháp lý toàn diện cho các giao dịch mua bán, sáp nhập doanh nghiệp:\n\n- **Thẩm định pháp lý (Due Diligence)**: Rà soát toàn bộ hồ sơ đất đai, tài sản, dự án, lao động, thuế và các nghĩa vụ nợ của công ty mục tiêu trước khi chuyển nhượng.\n- **Soạn thảo & Đàm phán hợp đồng**: Thiết kế cấu trúc giao dịch an toàn, soạn thảo hợp đồng mua bán cổ phần (SPA), hợp đồng cổ đông (SHA).\n- **Thủ tục pháp lý hoàn tất**: Thực hiện thủ tục chuyển nhượng, đăng ký cổ đông mới tại cơ quan nhà nước có thẩm quyền.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Hôn nhân và Gia đình",
      description: "Tư vấn thủ tục ly hôn thuận tình, ly hôn đơn phương, phân chia tài sản chung và giành quyền nuôi con.",
      icon: "Heart",
      content: `### Luật sư Tư vấn Hôn nhân & Gia đình\n\nGiải pháp pháp lý nhân văn, bảo mật thông tin tuyệt đối cho gia đình bạn:\n\n- **Phân chia tài sản**: Tư vấn thỏa thuận tài sản chung/riêng trước khi kết hôn, phân chia tài sản chung của vợ chồng trong thời kỳ hôn nhân hoặc khi ly hôn.\n- **Ly hôn nhanh gọn**: Soạn thảo đơn từ, chuẩn bị hồ sơ ly hôn thuận tình hoặc đơn phương, rút ngắn tối đa thời gian giải quyết tại Tòa án.\n- **Giành quyền nuôi con & Cấp dưỡng**: Luật sư tham gia tố tụng chứng minh điều kiện nuôi con tốt nhất, yêu cầu mức cấp dưỡng hợp lý theo pháp luật.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Tư vấn hợp đồng",
      description: "Soạn thảo, rà soát và đàm phán các loại hợp đồng kinh tế, thương mại, hợp đồng hợp tác đầu tư.",
      icon: "FileText",
      content: `### Dịch vụ Soạn thảo & Rà soát Hợp đồng Chuyên nghiệp\n\nHợp đồng chặt chẽ là lá chắn pháp lý vững chắc nhất phòng ngừa rủi ro cho cá nhân và doanh nghiệp:\n\n- **Soạn thảo hợp đồng theo yêu cầu**: Hợp đồng mua bán hàng hóa, hợp đồng dịch vụ, hợp đồng hợp tác kinh doanh (BCC), hợp đồng thuê mặt bằng...\n- **Rà soát hợp đồng (Contract Review)**: Phát hiện và cảnh báo các điều khoản mập mờ, bất lợi hoặc vô hiệu theo pháp luật, đề xuất điều khoản thay thế tối ưu.\n- **Hỗ trợ đàm phán**: Tham gia cùng khách hàng đàm phán với đối tác để đạt được các thỏa thuận có lợi nhất về mặt pháp lý và thương mại.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Đầu tư trong & ngoài nước",
      description: "Hỗ trợ nhà đầu tư nước ngoài xin cấp IRC, thành lập doanh nghiệp FDI và tư vấn đầu tư ra nước ngoài.",
      icon: "Globe",
      content: `### Tư vấn Đầu tư Trong nước & Nước ngoài\n\nCầu nối pháp lý hỗ trợ các nhà đầu tư hiện thực hóa dòng vốn an toàn và hiệu quả:\n\n- **Đầu tư trực tiếp nước ngoài (FDI)**: Xin cấp Giấy chứng nhận đăng ký đầu tư (IRC), đăng ký doanh nghiệp (ERC), thuê đất khu công nghiệp, xin ưu đãi đầu tư.\n- **Đầu tư gián tiếp**: Hỗ trợ nhà đầu tư nước ngoài góp vốn, mua cổ phần của doanh nghiệp Việt Nam theo đúng quy định pháp luật.\n- **Đầu tư ra nước ngoài**: Tư vấn thủ tục chuyển tiền hợp pháp ra nước ngoài, xin giấy chứng nhận đầu tư ra nước ngoài cho doanh nghiệp Việt Nam.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Bất động sản",
      description: "Thẩm định pháp lý dự án bất động sản, chuyển nhượng quyền sử dụng đất, tách thửa và cấp sổ đỏ.",
      icon: "Building2",
      content: `### Pháp lý Bất động sản & Nhà đất\n\nĐồng hành bảo vệ giá trị tài sản lớn của khách hàng trước các rủi ro pháp lý phức tạp:\n\n- **Thẩm định pháp lý dự án**: Kiểm tra quy hoạch, giấy phép xây dựng, điều kiện bán nhà hình thành trong tương lai của chủ đầu tư trước khi đặt mua.\n- **Chuyển nhượng & Sang tên**: Soạn hồ sơ và thực hiện trọn gói thủ tục sang tên sổ đỏ, sổ hồng, thừa kế, tặng cho quyền sử dụng đất.\n- **Hỗ trợ thủ tục đất đai**: Tách thửa, hợp thửa, chuyển mục đích sử dụng đất (từ đất nông nghiệp lên đất thổ cư), cấp sổ đỏ lần đầu.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Tranh tụng",
      description: "Luật sư tranh tụng bảo vệ quyền lợi tại Tòa án các cấp và Trọng tài Thương mại quốc tế.",
      icon: "Gavel",
      content: `### Luật sư Tranh tụng Chuyên nghiệp tại Tòa án & Trọng tài\n\nĐội ngũ Luật sư tố tụng bản lĩnh, giàu kinh nghiệm thực tế đấu tranh bảo vệ công lý:\n\n- **Thu thập chứng cứ**: Nghiên cứu hồ sơ, phân tích điểm mạnh/yếu, định hướng chiến lược tranh tụng tối ưu nhất cho khách hàng.\n- **Đại diện giải quyết tranh chấp**: Luật sư đại diện tham gia thương lượng, hòa giải giúp các bên đạt được thỏa thuận trước khi phải khởi kiện.\n- **Bảo vệ tại phiên tòa**: Cử Luật sư bào chữa cho bị can/bị cáo trong án Hình sự; bảo vệ quyền lợi cho đương sự trong án Dân sự, Đất đai, Thương mại.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Hàng hải & Vận chuyển",
      description: "Tư vấn tranh chấp vận đơn, tổn thất hàng hóa hàng hải, bảo hiểm và bắt giữ tàu biển.",
      icon: "Globe",
      content: `### Tư vấn Pháp luật Hàng hải & Vận tải Quốc tế\n\nHỗ trợ pháp lý chuyên biệt cho các hãng tàu, công ty logistics, bảo hiểm và chủ hàng:\n\n- **Tranh chấp hợp đồng vận chuyển**: Giải quyết tranh chấp liên quan đến vận đơn (B/L), hợp đồng thuê tàu, chậm trễ giao hàng, tổn thất hàng hóa.\n- **Tổn thất & Tai nạn hàng hải**: Tư vấn giải quyết đâm va tàu biển, cứu hộ hàng hải, tổn thất chung (General Average) và bảo hiểm thân tàu.\n- **Bắt giữ tàu biển**: Thực hiện thủ tục yêu cầu Tòa án bắt giữ tàu biển để bảo đảm giải quyết khiếu nại hàng hải hoặc thả tàu bị bắt giữ.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Thuế",
      description: "Tư vấn lập kế hoạch thuế tối ưu, đại diện giải trình quyết toán thuế và giải quyết khiếu nại thuế.",
      icon: "Shield",
      content: `### Tư vấn Pháp luật Thuế & Tối ưu Chi phí Thuế\n\nGiúp doanh nghiệp chủ động kiểm soát rủi ro về thuế và thực hiện nghĩa vụ tài chính hiệu quả nhất:\n\n- **Hoạch định kế hoạch thuế**: Tư vấn áp dụng ưu đãi thuế TNDN, thuế suất GTGT cho các dự án mới, tối ưu cơ cấu chi phí hợp lý được trừ.\n- **Hỗ trợ thanh tra thuế**: Rà soát trước sổ sách kế toán, phát hiện rủi ro, cùng doanh nghiệp giải trình số liệu trực tiếp với cơ quan thuế.\n- **Khiếu nại về thuế**: Đại diện thực hiện thủ tục khiếu nại các quyết định truy thu thuế, xử phạt hành chính về thuế không đúng quy định pháp luật.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Di trú & Visa",
      description: "Tư vấn thủ tục làm thẻ tạm trú, giấy phép lao động, visa định cư kết hôn nước ngoài.",
      icon: "Globe",
      content: `### Dịch vụ Di trú, Visa & Thẻ tạm trú\n\nHỗ trợ thủ tục xuất nhập cảnh cho công dân nước ngoài và công dân Việt Nam nhanh chóng, đúng quy định:\n\n- **Visa & Thẻ tạm trú (TRC)**: Xin cấp thẻ tạm trú thời hạn từ 2 đến 5 năm cho nhà đầu tư nước ngoài, chuyên gia nước ngoài làm việc tại Việt Nam.\n- **Hợp pháp hóa lãnh sự**: Thực hiện thủ tục dịch thuật công chứng, hợp pháp hóa lãnh sự các giấy tờ nước ngoài để sử dụng tại Việt Nam.\n- **Di trú định cư**: Tư vấn hồ sơ bảo lãnh định cư, visa kết hôn, visa du học các nước Châu Âu, Mỹ, Úc, Nhật Bản.`,
      category: "Lĩnh vực hoạt động"
    },
    {
      title: "Hộ tịch",
      description: "Thủ tục làm giấy khai sinh quá hạn, khai sinh có yếu tố nước ngoài, nhận cha mẹ con.",
      icon: "Heart",
      content: `### Tư vấn Thủ tục Hộ tịch & Nhân thân\n\nĐảm bảo đầy đủ các quyền nhân thân cơ bản cho công dân một cách nhanh gọn và chuẩn xác:\n\n- **Khai sinh có yếu tố nước ngoài**: Hỗ trợ đăng ký khai sinh cho con có cha hoặc mẹ là người nước ngoài, trẻ em sinh ra tại nước ngoài về cư trú.\n- **Xác định quan hệ nhân thân**: Thực hiện thủ tục nhận cha, mẹ, con, đăng ký khai sinh muộn, thay đổi họ tên, cải chính hộ tịch trên giấy tờ gốc.\n- **Đăng ký kết hôn**: Tư vấn thủ tục kết hôn giữa người Việt Nam và người nước ngoài, đảm bảo tính hợp pháp của các giấy tờ cần thiết.`,
      category: "Lĩnh vực hoạt động"
    }
  ];

  // Seed services if missing
  const checkService = db.prepare("SELECT COUNT(*) as count FROM services WHERE title = ?");
  const insertService = db.prepare("INSERT INTO services (title, description, icon, content, category) VALUES (?, ?, ?, ?, ?)");
  
  defaultServices.forEach(s => {
    const res = checkService.get(s.title) as { count: number };
    if (res.count === 0) {
      insertService.run(s.title, s.description, s.icon, s.content, s.category);
    }
  });

  const defaultLegalServices = [
    {
      title: "Tư vấn pháp luật thường xuyên",
      description: "Cung cấp dịch vụ tư vấn pháp lý định kỳ cho doanh nghiệp.",
      icon: "Shield",
      content: `### Tư vấn pháp luật thường xuyên\n\nĐóng vai trò như một bộ phận pháp chế thuê ngoài:\n\n- Rà soát tính hợp pháp của các quyết định nội bộ.\n- Đánh giá rủi ro pháp lý trong hợp đồng.\n- Cập nhật quy định pháp luật mới.\n- Tư vấn vấn đề pháp lý phát sinh hàng ngày.`
    },
    {
      title: "Tư vấn dự án đầu tư",
      description: "Hỗ trợ pháp lý toàn diện cho các dự án đầu tư trong và ngoài nước.",
      icon: "Briefcase",
      content: `### Tư vấn dự án đầu tư\n\nGiải pháp pháp lý toàn diện:\n\n- Đánh giá khả năng và điều kiện pháp lý của dự án.\n- Lựa chọn hình thức đầu tư phù hợp.\n- Soạn thảo hợp đồng hợp tác.\n- Thực hiện thủ tục Giấy chứng nhận đầu tư.`
    },
    {
      title: "Giải quyết tranh chấp",
      description: "Đại diện khách hàng giải quyết các tranh chấp thương mại, dân sự.",
      icon: "Gavel",
      content: `### Giải quyết tranh chấp\n\nBảo vệ quyền lợi tối đa:\n\n- Tranh chấp hợp đồng mua bán.\n- Tranh chấp giữa thành viên/cổ đông.\n- Tranh chấp sở hữu trí tuệ, bất động sản.\n- Đại diện thương lượng, hoà giải hoặc tham gia Tòa án/Trọng tài.`
    },
    {
      title: "Đại diện ngoài tố tụng",
      description: "Đại diện khách hàng làm việc với cơ quan nhà nước, đối tác.",
      icon: "Users",
      content: `### Đại diện ngoài tố tụng\n\n- Đại diện khách hàng tham gia họp, đàm phán.\n- Đại diện làm việc với cơ quan chức năng, thuế.\n- Thực hiện thủ tục khiếu nại, tố cáo.\n- Thực hiện thủ tục thi hành án dân sự.`
    },
    {
      title: "Dịch vụ giấy phép",
      description: "Thực hiện các thủ tục xin cấp các loại giấy phép con.",
      icon: "FileText",
      content: `### Dịch vụ giấy phép\n\nXin cấp các loại giấy tờ, giấy phép:\n\n- Giấy phép kinh doanh dịch vụ lữ hành, vận tải.\n- Giấy phép thành lập cơ sở giáo dục.\n- Giấy phép vệ sinh an toàn thực phẩm.\n- Giấy phép phòng cháy chữa cháy.`
    },
    {
      title: "Tư vấn hợp đồng",
      description: "Soạn thảo, rà soát và tư vấn đàm phán các loại hợp đồng.",
      icon: "FileText",
      content: `### Tư vấn hợp đồng\n\nKiểm soát rủi ro và tối đa hóa lợi ích:\n\n- Đàm phán, xây dựng dự thảo hợp đồng.\n- Rà soát, chỉ ra điểm bất lợi và đề xuất sửa đổi.\n- Tư vấn thủ tục và điều kiện đảm bảo hiệu lực.\n- Giải quyết tranh chấp quá trình thực hiện hợp đồng.`
    },
    {
      title: "Dịch vụ luật sư",
      description: "Tư vấn pháp lý thường xuyên, giải quyết tranh chấp dân sự, thương mại và hình sự.",
      icon: "Gavel",
      content: `### Dịch vụ Luật sư Chuyên nghiệp & Uy tín\n\nChúng tôi cung cấp đội ngũ Luật sư giàu kinh nghiệm thực tế, sẵn sàng hỗ trợ khách hàng giải quyết mọi vướng mắc pháp lý:\n\n- **Tư vấn pháp lý thường xuyên**: Đồng hành cùng cá nhân và doanh nghiệp trong hoạt động hàng ngày.\n- **Tham gia tố tụng**: Bào chữa trong các vụ án Hình sự; Bảo vệ quyền và lợi ích hợp pháp trong các vụ án Dân sự, Đất đai, Hôn nhân gia đình, Kinh doanh thương mại, Lao động...\n- **Đại diện ngoài tố tụng**: Thực hiện đàm phán, thương lượng, làm việc với các đối tác và cơ quan Nhà nước có thẩm quyền.\n- **Soạn thảo văn bản**: Đơn khởi kiện, đơn khiếu nại, các loại hợp đồng và văn bản pháp lý khác.`
    },
    {
      title: "Thành lập công ty",
      description: "Trọn gói thủ tục đăng ký kinh doanh, chuẩn bị hồ sơ thành lập doanh nghiệp, khắc dấu và khai thuế ban đầu.",
      icon: "Building2",
      content: `### Dịch vụ Thành lập Công ty Trọn gói\n\nGiải pháp tối ưu cho người khởi nghiệp, cam kết nhanh chóng, uy tín và không phát sinh chi phí:\n\n- **Tư vấn trước thành lập**: Lựa chọn loại hình doanh nghiệp phù hợp (TNHH, Cổ phần, Doanh nghiệp tư nhân...), đặt tên công ty, chọn ngành nghề kinh doanh, vốn điều lệ và địa chỉ trụ sở.\n- **Soạn thảo hồ sơ**: Hoàn thiện toàn bộ hồ sơ đăng ký doanh nghiệp theo quy định.\n- **Nộp hồ sơ & Nhận kết quả**: Đại diện khách hàng nộp hồ sơ tại Sở Kế hoạch và Đầu tư, nhận Giấy chứng nhận đăng ký doanh nghiệp.\n- **Thủ tục sau thành lập**: Khắc dấu tròn công ty, công bố mẫu dấu, đăng ký tài khoản ngân hàng, mua chữ ký số, hóa đơn điện tử, kê khai thuế ban đầu.`
    },
    {
      title: "Giấy phép kinh doanh",
      description: "Xin cấp các loại giấy phép con, giấy phép hoạt động ngành nghề có điều kiện.",
      icon: "FileText",
      content: `### Xin cấp Giấy phép kinh doanh & Giấy phép con\n\nHỗ trợ doanh nghiệp hoàn thiện các điều kiện pháp lý để hoạt động trong các ngành nghề kinh doanh có điều kiện:\n\n- **Giấy phép lữ hành**: Lữ hành nội địa, lữ hành quốc tế.\n- **Giấy phép giáo dục**: Thành lập trung tâm ngoại ngữ, trung tâm tin học, tư vấn du học.\n- **Giấy phép vận tải**: Phù hiệu xe, giấy phép kinh doanh vận tải bằng xe ô tô.\n- **Giấy phép hoạt động khác**: Giấy phép bán lẻ rượu, thuốc lá, giấy phép phòng cháy chữa cháy, cam kết môi trường.`
    },
    {
      title: "Đăng ký hộ kinh doanh",
      description: "Hỗ trợ đăng ký thành lập hộ kinh doanh cá thể tại các quận, huyện nhanh chóng, thủ tục đơn giản.",
      icon: "Users",
      content: `### Đăng ký thành lập Hộ kinh doanh cá thể\n\nPhương án kinh doanh phù hợp cho quy mô nhỏ, gia đình, thủ tục tinh gọn và tiết kiệm thuế:\n\n- **Tư vấn đặt tên**: Đảm bảo tên hộ kinh doanh không trùng lặp và tuân thủ pháp luật.\n- **Tư vấn ngành nghề**: Lựa chọn ngành nghề kinh doanh phù hợp với năng lực hoạt động.\n- **Soạn hồ sơ**: Chuẩn bị đơn đăng ký, bản sao giấy tờ cá nhân và các tài liệu liên quan khác.\n- **Đại diện nộp hồ sơ**: Nộp hồ sơ tại UBND quận/huyện và bàn giao Giấy đăng ký hộ kinh doanh cùng mã số thuế tận nơi.`
    },
    {
      title: "Đăng ký mã số thuế",
      description: "Cấp mới mã số thuế cá nhân, doanh nghiệp và hướng dẫn sử dụng hóa đơn điện tử.",
      icon: "Shield",
      content: `### Dịch vụ Đăng ký mã số thuế cá nhân & doanh nghiệp\n\nĐảm bảo nghĩa vụ thuế được thực hiện đúng hạn, chính xác và chuyên nghiệp:\n\n- **Mã số thuế cá nhân**: Đăng ký mã số thuế cho người lao động, người có thu nhập chịu thuế.\n- **Mã số thuế doanh nghiệp**: Cấp mã số thuế tích hợp trên Giấy chứng nhận đăng ký kinh doanh.\n- **Mã số thuế phụ thuộc**: Đăng ký mã số thuế cho người phụ thuộc để giảm trừ gia cảnh.\n- **Khai thuế ban đầu**: Thiết lập hồ sơ thuế ban đầu cho doanh nghiệp mới thành lập.`
    },
    {
      title: "Quyết toán thuế",
      description: "Thực hiện quyết toán thuế thu nhập cá nhân, thuế thu nhập doanh nghiệp định kỳ hoặc khi giải thể.",
      icon: "FileText",
      content: `### Dịch vụ Quyết toán thuế Chuyên nghiệp\n\nHỗ trợ doanh nghiệp và cá nhân rà soát, nộp hồ sơ quyết toán thuế đúng quy định pháp luật:\n\n- **Quyết toán thuế TNCN**: Dành cho cá nhân có nhiều nguồn thu nhập, người nước ngoài tại Việt Nam hoặc ủy quyền qua tổ chức chi trả.\n- **Quyết toán thuế TNDN**: Lập báo cáo quyết toán thuế thu nhập doanh nghiệp hàng năm, tối ưu chi phí hợp lý.\n- **Hỗ trợ thanh tra thuế**: Chuẩn bị hồ sơ sổ sách, đại diện giải trình số liệu với cơ quan thuế khi có thanh tra, kiểm tra.`
    },
    {
      title: "Dịch vụ làm visa",
      description: "Tư vấn thủ tục và làm visa nhập cảnh, xuất cảnh, gia hạn visa, thẻ tạm trú cho người nước ngoài.",
      icon: "Globe",
      content: `### Dịch vụ Visa & Thẻ tạm trú\n\nHỗ trợ thủ tục xuất nhập cảnh cho người Việt Nam ra nước ngoài và người nước ngoài vào Việt Nam:\n\n- **Visa du lịch, công tác**: Tư vấn xin visa các nước Châu Âu, Mỹ, Úc, Nhật Bản, Hàn Quốc...\n- **Công văn nhập cảnh**: Xin công văn cho người nước ngoài vào Việt Nam làm việc, du lịch.\n- **Gia hạn Visa**: Thực hiện gia hạn thời gian tạm trú hợp pháp tại Việt Nam.\n- **Thẻ tạm trú & Giấy phép lao động**: Làm thẻ tạm trú (2-5 năm), Giấy phép lao động cho chuyên gia, lao động kỹ thuật nước ngoài.`
    },
    {
      title: "Dịch vụ ly hôn",
      description: "Tư vấn ly hôn thuận tình, đơn phương, phân chia tài sản và giành quyền nuôi con nhanh chóng, bảo mật.",
      icon: "Heart",
      content: `### Dịch vụ Luật sư Giải quyết Ly hôn nhanh, bảo mật\n\nĐóng hành và bảo vệ tối đa quyền lợi hợp pháp của bạn trong giai đoạn khó khăn:\n\n- **Ly hôn thuận tình**: Tư vấn soạn hồ sơ, nộp đơn và hỗ trợ giải quyết nhanh gọn tại Tòa án trong vòng 7 - 15 ngày, hạn chế số lần lên Tòa.\n- **Ly hôn đơn phương**: Luật sư hỗ trợ thu thập chứng cứ chứng minh mâu thuẫn trầm trọng, bảo vệ quyền lợi khi tranh chấp quyền nuôi con và phân chia tài sản chung.\n- **Ly hôn có yếu tố nước ngoài**: Giải quyết thủ tục ly hôn khi một bên ở nước ngoài hoặc là người nước ngoài.`
    },
    {
      title: "Tạm ngừng kinh doanh",
      description: "Hỗ trợ làm thủ tục tạm ngừng hoạt động kinh doanh cho doanh nghiệp theo quy định mới nhất.",
      icon: "Briefcase",
      content: `### Thủ tục Tạm ngừng hoạt động kinh doanh\n\nHỗ trợ doanh nghiệp tạm dừng hoạt động hợp pháp để tái cấu trúc hoặc giải quyết khó khăn tài chính:\n\n- **Tư vấn thời hạn**: Giải thích quy định về thời gian tạm ngừng tối đa, quyền và nghĩa vụ thuế trong thời gian tạm ngừng.\n- **Soạn hồ sơ**: Chuẩn bị thông báo tạm ngừng, nghị quyết/quyết định của Hội đồng thành viên/Hội đồng quản trị.\n- **Nộp hồ sơ**: Đại diện nộp hồ sơ lên Phòng Đăng ký kinh doanh và nhận thông báo chấp thuận tạm ngừng.`
    },
    {
      title: "Kiểm nghiệm sản phẩm",
      description: "Hỗ trợ lấy mẫu, gửi kiểm nghiệm và nhận kết quả kiểm nghiệm sản phẩm tại các trung tâm uy tín.",
      icon: "Leaf",
      content: `### Dịch vụ Kiểm nghiệm sản phẩm chuyên nghiệp\n\nKiểm nghiệm chất lượng sản phẩm là bước bắt buộc để thực hiện công bố chất lượng sản phẩm ra thị trường:\n\n- **Tư vấn chỉ tiêu**: Lên chỉ tiêu kiểm nghiệm phù hợp cho từng loại sản phẩm (thực phẩm, mỹ phẩm, thức ăn chăn nuôi, hàng tiêu dùng) để tiết kiệm chi phí mà vẫn đúng luật.\n- **Gửi mẫu**: Đại diện gửi mẫu đến các trung tâm kiểm nghiệm được Nhà nước chỉ định (Eurofins, Quatest...).\n- **Nhận kết quả**: Theo dõi quá trình, nhận phiếu kết quả kiểm nghiệm đạt chuẩn.`
    },
    {
      title: "Lý lịch tư pháp",
      description: "Xin cấp phiếu Lý lịch tư pháp số 1, số 2 cho công dân Việt Nam và người nước ngoài nhanh gọn.",
      icon: "Shield",
      content: `### Dịch vụ Làm Lý lịch tư pháp nhanh toàn quốc\n\nHỗ trợ khách hàng xin phiếu Lý lịch tư pháp số 1 và số 2 nhanh chóng, không cần xếp hàng chờ đợi:\n\n- **Lý lịch tư pháp số 1**: Phục vụ nhu cầu xin việc làm, đi học, làm thủ tục hành chính...\n- **Lý lịch tư pháp số 2**: Phục vụ mục đích đi định cư, kết hôn với người nước ngoài, làm visa định cư...\n- **Đặc biệt**: Hỗ trợ làm nhanh cho người đang ở nước ngoài, người ngoại tỉnh, người nước ngoài từng cư trú tại Việt Nam.`
    },
    {
      title: "Báo cáo tài chính",
      description: "Lập báo cáo tài chính cuối năm, rà soát sổ sách kế toán, báo cáo thuế cho doanh nghiệp.",
      icon: "FileText",
      content: `### Dịch vụ Lập Báo cáo tài chính cuối năm\n\nĐảm bảo hệ thống sổ sách kế toán minh bạch, chính xác và tuân thủ đúng chuẩn mực kế toán Việt Nam:\n\n- **Thu thập dữ liệu**: Rà soát chứng từ đầu vào, đầu ra, tờ khai thuế đã nộp.\n- **Xử lý số liệu**: Định khoản kế toán, lập bảng cân đối phát sinh, báo cáo kết quả hoạt động kinh doanh, lưu chuyển tiền tệ, thuyết minh báo cáo tài chính.\n- **Nộp báo cáo**: Nộp báo cáo tài chính đến cơ quan thuế, cơ quan thống kê đúng thời hạn pháp luật.`
    },
    {
      title: "Hoàn thuế thu nhập cá nhân",
      description: "Hỗ trợ hồ sơ xin hoàn thuế thu nhập cá nhân cho người lao động, chuyên gia nước ngoài.",
      icon: "Scale",
      content: `### Dịch vụ Hoàn thuế thu nhập cá nhân (TNCN)\n\nHỗ trợ người lao động lấy lại số tiền thuế TNCN đã nộp thừa một cách nhanh chóng, đúng luật:\n\n- **Rà soát chứng từ**: Kiểm tra chứng từ khấu trừ thuế, thư xác nhận thu nhập, hồ sơ người phụ thuộc.\n- **Tính toán số thuế hoàn**: Tính chính xác số thuế được hoàn hoặc số thuế nộp thêm.\n- **Nộp hồ sơ quyết toán**: Đại diện nộp hồ sơ lên cơ quan thuế quản lý và theo dõi nhận tiền hoàn thuế về tài khoản cá nhân.`
    },
    {
      title: "Đăng ký kinh doanh",
      description: "Thay đổi nội dung đăng ký doanh nghiệp như tăng vốn, thay đổi đại diện pháp luật, chuyển địa chỉ.",
      icon: "Building2",
      content: `### Thay đổi nội dung Đăng ký kinh doanh\n\nHỗ trợ doanh nghiệp cập nhật các thay đổi trong quá trình hoạt động kinh doanh theo quy định mới:\n\n- **Tăng/Giảm vốn điều lệ**: Thay đổi cơ cấu góp vốn của các thành viên, cổ đông.\n- **Thay đổi đại diện pháp luật**: Thay đổi Giám đốc, Chủ tịch công ty.\n- **Thay đổi trụ sở, tên công ty**: Chuyển địa chỉ cùng quận hoặc khác quận, tỉnh thành.\n- **Thay đổi ngành nghề**: Thêm mới hoặc lược bỏ các ngành nghề kinh doanh.`
    },
    {
      title: "Công bố sản phẩm",
      description: "Thực hiện thủ tục tự công bố, công bố chất lượng sản phẩm thực phẩm, mỹ phẩm nhập khẩu và trong nước.",
      icon: "Leaf",
      content: `### Dịch vụ Tự công bố & Công bố chất lượng sản phẩm\n\nĐảm bảo sản phẩm của doanh nghiệp đủ điều kiện lưu hành hợp pháp trên thị trường Việt Nam:\n\n- **Thực phẩm thường & Nhập khẩu**: Soạn hồ sơ tự công bố sản phẩm, nộp lên cơ quan quản lý an toàn thực phẩm.\n- **Thực phẩm chức năng, bảo vệ sức khỏe**: Đăng ký công bố sản phẩm tại Cục An toàn thực phẩm - Bộ Y tế.\n- **Mỹ phẩm**: Công bố mỹ phẩm sản xuất trong nước và mỹ phẩm nhập khẩu.`
    },
    {
      title: "Báo cáo thuế",
      description: "Dịch vụ kế toán thuế trọn gói hàng tháng, hàng quý, nộp tờ khai thuế đúng hạn, chính xác.",
      icon: "FileText",
      content: `### Dịch vụ Kế toán & Báo cáo thuế trọn gói\n\nGiải pháp tiết kiệm chi phí tối đa cho doanh nghiệp vừa và nhỏ, không cần thuê kế toán nội bộ:\n\n- **Kê khai thuế hàng tháng/quý**: Lập và nộp tờ khai thuế GTGT, thuế TNCN, tình hình sử dụng hóa đơn.\n- **Cân đối chi phí**: Tư vấn hóa đơn hợp lệ, hợp pháp, cân đối doanh thu - chi phí tối ưu nhất cho doanh nghiệp.\n- **Sổ sách kế toán**: Thiết lập hệ thống sổ sách kế toán theo quy chuẩn, in và lưu trữ hồ sơ cẩn thận.`
    },
    {
      title: "Giấy chứng nhận vệ sinh an toàn thực phẩm",
      description: "Tư vấn set up cơ sở và xin cấp giấy chứng nhận đủ điều kiện an toàn thực phẩm cho nhà hàng, hộ kinh doanh.",
      icon: "Leaf",
      content: `### Xin Giấy phép Vệ sinh an toàn thực phẩm (ATTP)\n\nĐảm bảo nhà hàng, quán ăn, cơ sở sản xuất thực phẩm hoạt động đúng luật, tránh bị phạt nặng:\n\n- **Khảo sát thực tế**: Khảo sát mặt bằng, tư vấn cách bố trí bếp theo nguyên tắc một chiều.\n- **Tập huấn & Khám sức khỏe**: Hỗ trợ thủ tục đăng ký tập huấn kiến thức ATTP và khám sức khỏe cho chủ cơ sở và nhân viên.\n- **Soạn & Nộp hồ sơ**: Chuẩn bị hồ sơ xin cấp giấy chứng nhận đủ điều kiện gửi cơ quan chức năng.\n- **Đón đoàn thẩm định**: Hướng dẫn cơ sở chuẩn bị sổ sách, mẫu lưu thực phẩm để đón đoàn thẩm định đạt kết quả tốt nhất.`
    },
    {
      title: "Giải thể công ty",
      description: "Thực hiện thủ tục đóng mã số thuế, quyết toán thuế giải thể, trả con dấu và hoàn tất giải thể doanh nghiệp.",
      icon: "Building2",
      content: `### Dịch vụ Giải thể Doanh nghiệp trọn gói\n\nHỗ trợ doanh nghiệp hoàn tất thủ tục chấm dứt hoạt động một cách an toàn, đúng pháp luật, tránh nợ đọng thuế:\n\n- **Quyết toán thuế giải thể**: Đây là bước khó khăn nhất, chúng tôi sẽ hỗ trợ dọn dẹp sổ sách kế toán, nộp hồ sơ quyết toán thuế giải thể với cơ quan thuế.\n- **Đóng mã số thuế**: Nhận thông báo khóa mã số thuế từ cơ quan thuế quản lý.\n- **Giải thể tại Sở KH&ĐT**: Nộp hồ sơ xin giải thể doanh nghiệp tại Phòng Đăng ký kinh doanh và nhận quyết định giải thể chính thức.`
    },
    {
      title: "Đầu tư nước ngoài",
      description: "Tư vấn thành lập công ty có vốn nước ngoài (FDI), điều chỉnh giấy chứng nhận đầu tư, xin visa đầu tư.",
      icon: "Globe",
      content: `### Tư vấn Đầu tư nước ngoài tại Việt Nam\n\nHỗ trợ toàn diện cho nhà đầu tư nước ngoài thiết lập và vận hành doanh nghiệp FDI tại Việt Nam:\n\n- **Thành lập công ty FDI**: Xin cấp Giấy chứng nhận đăng ký đầu tư (IRC) và Giấy chứng nhận đăng ký doanh nghiệp (ERC).\n- **Góp vốn, mua cổ phần**: Tư vấn và thực hiện thủ tục cho nhà đầu tư nước ngoài mua lại phần vốn góp của công ty Việt Nam.\n- **Thay đổi dự án đầu tư**: Hỗ trợ điều chỉnh quy mô, tăng vốn, thay đổi địa điểm dự án đầu tư.`
    },
    {
      title: "Làm giấy khai sinh",
      description: "Tư vấn thủ tục đăng ký khai sinh quá hạn, khai sinh có yếu tố nước ngoài, đăng ký nhận cha mẹ con.",
      icon: "Heart",
      content: `### Tư vấn thủ tục Đăng ký khai sinh & Nhận cha mẹ con\n\nHỗ trợ pháp lý tận tâm để đảm bảo quyền nhân thân cho trẻ em:\n\n- **Đăng ký khai sinh có yếu tố nước ngoài**: Khi cha hoặc mẹ là người nước ngoài, trẻ em sinh ra tại Việt Nam hoặc nước ngoài.\n- **Khai sinh quá hạn**: Tư vấn thủ tục, giấy tờ thay thế khi đăng ký khai sinh muộn.\n- **Nhận cha, mẹ, con**: Thực hiện thủ tục nhận con ngoài giá thú, xét nghiệm ADN chứng minh quan hệ huyết thống để làm giấy khai sinh hợp lệ.`
    }
  ];

  // Seed legal services if missing
  const checkLegalService = db.prepare("SELECT COUNT(*) as count FROM legal_services WHERE title = ?");
  const insertLegalService = db.prepare("INSERT INTO legal_services (title, description, icon, content) VALUES (?, ?, ?, ?)");
  
  defaultLegalServices.forEach(s => {
    const res = checkLegalService.get(s.title) as { count: number };
    if (res.count === 0) {
      insertLegalService.run(s.title, s.description, s.icon, s.content);
    }
  });

  const teamCount = db.prepare("SELECT COUNT(*) as count FROM team").get() as { count: number };
  if (teamCount.count === 0) {
    const insertTeam = db.prepare("INSERT INTO team (name, title, image) VALUES (?, ?, ?)");
    insertTeam.run("Luật sư Nguyễn Văn A", "Giám đốc", "https://picsum.photos/seed/lawyer1/400/500");
    insertTeam.run("Luật sư Trần Thị B", "Trưởng phòng", "https://picsum.photos/seed/lawyer2/400/500");
    insertTeam.run("Luật sư Lê Văn C", "Chuyên viên pháp lý", "https://picsum.photos/seed/lawyer3/400/500");
  }

  const recruitmentCount = db.prepare("SELECT COUNT(*) as count FROM recruitment").get() as { count: number };
  if (recruitmentCount.count === 0) {
    const insertRecruitment = db.prepare("INSERT INTO recruitment (title, location, type, salary, description, content) VALUES (?, ?, ?, ?, ?, ?)");
    insertRecruitment.run(
      "Luật sư",
      "Hà Nội",
      "Toàn thời gian",
      "Thỏa thuận (Cạnh tranh)",
      "Chịu trách nhiệm đại diện khách hàng tham gia tranh tụng tại Tòa án các cấp và các cơ quan tố tụng. Nghiên cứu hồ sơ, tư vấn phương án giải quyết tối ưu.",
      "### Chi tiết công việc:\n- Nghiên cứu hồ sơ vụ việc, thu thập tài liệu chứng cứ cần thiết để phục vụ công tác tranh tụng.\n- Soạn thảo các văn bản pháp lý chuyên sâu: Đơn khởi kiện, Bản tự khai, Ý kiến pháp lý, Bài bào chữa, Bản luận cứ bảo vệ quyền lợi hợp pháp...\n- Đại diện theo ủy quyền hoặc cử người bảo vệ quyền và lợi ích hợp pháp cho khách hàng tại Tòa án nhân dân, Trung tâm Trọng tài và các Cơ quan nhà nước có thẩm quyền.\n- Tư vấn, định hướng giải pháp phòng ngừa rủi ro tranh chấp hợp đồng, lao động, đất đai cho doanh nghiệp.\n\n### Yêu cầu ứng viên:\n- Đã được cấp Thẻ hành nghề Luật sư tại Việt Nam.\n- Tối thiểu 03 - 05 năm kinh nghiệm tham gia tranh tụng thực tế (ưu tiên lĩnh vực Dân sự, Kinh doanh thương mại, Đất đai).\n- Tư duy logic pháp lý nhạy bén, bản lĩnh nghề nghiệp vững vàng, chịu được áp lực công việc cao.\n- Khả năng tranh luận, thuyết trình tốt và thuyết phục trước hội đồng xét xử.\n\n### Quyền lợi & Chế độ đãi ngộ:\n- Lương cứng hấp dẫn (trao đổi trực tiếp theo năng lực) + Thưởng vụ việc vượt trội (lên đến 15 - 20% giá trị hợp đồng dịch vụ).\n- Tham gia đầy đủ các chế độ BHXH, BHYT, BHTN theo quy định pháp luật.\n- Được hỗ trợ chi phí công tác, văn phòng phẩm và các công cụ phục vụ công việc.\n- Du lịch nghỉ dưỡng 5 sao thường niên cùng công ty. Lộ trình phát triển lên vị trí Luật sư thành viên sáng lập."
    );
    insertRecruitment.run(
      "Chuyên viên pháp lý",
      "TP. Hồ Chí Minh",
      "Toàn thời gian",
      "15 - 25 triệu VNĐ",
      "Thực hiện dịch vụ tư vấn thành lập, mua bán sáp nhập (M&A), thay đổi đăng ký kinh doanh và rà soát hợp đồng thương mại cho các khách hàng doanh nghiệp lớn.",
      "### Chi tiết công việc:\n- Thực hiện tư vấn và trực tiếp triển khai thủ tục: Thành lập doanh nghiệp, thay đổi đăng ký kinh doanh, xin các loại Giấy phép con (vệ sinh an toàn thực phẩm, lữ hành, phòng cháy chữa cháy...).\n- Tư vấn thường xuyên cho các doanh nghiệp: Rà soát hợp đồng thương mại, tư vấn pháp luật lao động, sở hữu trí tuệ, quản trị nội bộ doanh nghiệp.\n- Hỗ trợ Luật sư trong các giao dịch M&A (mua bán & sáp nhập), soạn thảo báo cáo rà soát đặc biệt (Due Diligence).\n- Nghiên cứu cập nhật các văn bản quy phạm pháp luật mới để chia sẻ with đội ngũ và xây dựng bản tin pháp luật gửi khách hàng.\n\n### Yêu cầu ứng viên:\n- Tốt nghiệp cử nhân Đại học chuyên ngành Luật trở lên (Ưu tiên ĐH Luật Hà Nội, ĐH Luật TP.HCM, ĐH Quốc Gia).\n- Tối thiểu 02 năm kinh nghiệm làm việc tại tổ chức hành nghề luật hoặc phòng pháp chế doanh nghiệp lớn.\n- Am hiểu sâu sắc Luật Doanh nghiệp, Luật Đầu tư, Luật Thương mại và các quy trình hành chính công.\n- Sử dụng tiếng Anh tốt (đặc biệt là đọc hiểu, soạn thảo hợp đồng thương mại) là một lợi thế lớn.\n\n### Quyền lợi & Chế độ đãi ngộ:\n- Thu nhập cạnh tranh: Lương cứng từ 15 - 25 triệu VNĐ (tùy năng lực) + hoa hồng tư vấn hấp dẫn (5% - 10% doanh thu mang về).\n- Thưởng hiệu quả công việc hàng tháng/quý theo KPI rõ ràng.\n- Được đào tạo định kỳ bởi các Luật sư thành viên, định hướng thi chứng chỉ hành nghề Luật sư.\n- Môi trường làm việc trẻ trung, năng động, tiện nghi hiện đại tại trung tâm quận 1."
    );
    insertRecruitment.run(
      "Thực tập sinh",
      "TP. Hồ Chí Minh",
      "Thực tập",
      "Hỗ trợ xăng xe + Thưởng hiệu quả",
      "Cơ hội rèn luyện thực tế dành cho các bạn sinh viên năm cuối ngành Luật. Hỗ trợ Luật sư nghiên cứu hồ sơ, thực hiện các thủ tục hành chính công.",
      "### Chi tiết công việc:\n- Hỗ trợ Luật sư và Chuyên viên pháp lý nghiên cứu văn bản pháp luật, tra cứu thông tin phục vụ vụ việc thực tế.\n- Đi nộp hồ sơ, tiếp nhận kết quả tại các Cơ quan nhà nước dưới sự hướng dẫn của Chuyên viên pháp lý.\n- Soạn thảo sơ bộ các văn bản hành chính, chuẩn bị hồ sơ thành lập doanh nghiệp, giấy phép con đơn giản.\n- Tham gia dịch thuật tài liệu pháp lý (nếu có năng lực ngoại ngữ) và hỗ trợ công tác lưu trữ hồ sơ văn phòng.\n\n### Yêu cầu ứng viên:\n- Sinh viên năm cuối hoặc mới tốt nghiệp Đại học chuyên ngành Luật.\n- Có thể thực tập tối thiểu 4 ngày/tuần.\n- Thái độ làm việc tích cực, chăm chỉ, cẩn thận, có trách nhiệm và tinh thần học hỏi cao.\n- Có phương tiện đi lại cá nhân và máy tính xách tay phục vụ công việc.\n\n### Quyền lợi & Chế độ đãi ngộ:\n- Được hỗ trợ đóng dấu thực tập, cung cấp số liệu viết báo cáo tốt nghiệp.\n- Hỗ trợ phụ cấp xăng xe đi lại + Thưởng hiệu quả xử lý hồ sơ thực tế.\n- Được hướng dẫn tận tình, cầm tay chỉ việc bởi các chuyên gia và Luật sư gạo cội.\n- Cơ hội được giữ lại làm nhân viên chính thức (Chuyên viên pháp lý tập sự) sau kỳ thực tập mà không cần thử việc."
    );
    insertRecruitment.run(
      "Kế toán",
      "Đà Nẵng",
      "Toàn thời gian",
      "12 - 18 triệu VNĐ",
      "Tư vấn và thực hiện dịch vụ báo cáo tài chính, quyết toán thuế thu nhập cá nhân, thuế thu nhập doanh nghiệp cho tệp khách hàng của công ty luật.",
      "### Chi tiết công việc:\n- Trực tiếp quản lý và thực hiện dịch vụ kế toán thuế trọn gói cho tệp khách hàng doanh nghiệp được phân công.\n- Soạn thảo và nộp tờ khai thuế GTGT, TNCN, TNDN, tình hình sử dụng hóa đơn định kỳ (tháng/quý/năm).\n- Lập báo cáo tài chính, quyết toán thuế năm và trực tiếp giải trình số liệu với cơ quan thuế khi có yêu cầu thanh tra, kiểm tra.\n- Tư vấn cho khách hàng về tối ưu hóa chi phí hợp lý, hợp lệ theo đúng quy định pháp luật thuế hiện hành.\n\n### Yêu cầu ứng viên:\n- Tốt nghiệp Đại học trở lên chuyên ngành Kế toán, Kiểm toán, Tài chính doanh nghiệp.\n- Ít nhất 02 năm kinh nghiệm thực tế làm kế toán tổng hợp hoặc kế toán thuế (ưu tiên ứng viên từng làm việc tại các đại lý thuế, công ty dịch vụ kế toán).\n- Thành thạo các phần mềm kế toán (Misa, Fast...) và phần mềm kê khai thuế HTKK.\n- Chịu khó, cẩn thận, trung thực, có năng lực giao tiếp và tư vấn khách hàng tốt.\n\n### Quyền lợi & Chế độ đãi ngộ:\n- Lương cứng cạnh tranh 12 - 18 triệu VNĐ (xem xét tăng lương hàng năm) + phụ cấp trách nhiệm + phần trăm doanh thu dịch vụ kế toán thường xuyên.\n- Môi trường làm việc độc lập, tôn trọng sáng tạo cá nhân.\n- Đầy đủ chế độ phúc lợi: Bảo hiểm xã hội, thưởng Lễ Tết lớn, nghỉ mát hàng năm.\n- Được tham gia các khóa cập nhật chính sách thuế mới nhất từ các chuyên gia Tổng cục Thuế."
    );
  }

  const benefitsCount = db.prepare("SELECT COUNT(*) as count FROM recruitment_benefits").get() as { count: number };
  if (benefitsCount.count === 0) {
    const insertBenefit = db.prepare("INSERT INTO recruitment_benefits (title, description, icon) VALUES (?, ?, ?)");
    insertBenefit.run("Lương Thưởng Vượt Trội", "Lương cứng cạnh tranh theo đúng năng lực thực tế. Cơ chế thưởng vụ việc, hoa hồng doanh số mang về cực kỳ vượt trội và minh bạch từ 10% - 20% doanh thu vụ việc.", "Coins");
    insertBenefit.run("Lộ Trình Thăng Tiến Rõ Ràng", "Kế hoạch phát triển sự nghiệp cá nhân chi tiết. Đánh giá tăng lương và thăng cấp vị trí định kỳ 6 tháng một lần dựa hoàn toàn trên năng lực và đóng góp thực tế.", "TrendingUp");
    insertBenefit.run("Đào Tạo Thực Chiến", "Cơ hội rèn luyện sâu rộng thông qua các buổi chia sẻ chuyên đề pháp luật định kỳ. Được kèm cặp, dìu dắt trực tiếp (1-on-1) bởi các Luật sư thành viên gạo cội.", "BookOpen");
    insertBenefit.run("Phúc Lợi Toàn Diện", "Hưởng đầy đủ bảo hiểm xã hội, bảo hiểm y tế. Các hoạt động Teambuilding sôi nổi, du lịch nghỉ dưỡng 5 sao trong & ngoài nước ít nhất 1 lần/năm cùng gia đình Ánh Dương Law.", "Heart");
  }

  const processCount = db.prepare("SELECT COUNT(*) as count FROM recruitment_process").get() as { count: number };
  if (processCount.count === 0) {
    const insertProcess = db.prepare("INSERT INTO recruitment_process (step, title, description) VALUES (?, ?, ?)");
    insertProcess.run("01", "Gửi hồ sơ ứng tuyển", "Ứng viên nộp CV trực tiếp thông qua biểu mẫu website hoặc email tuyển dụng. Bộ phận HR tiến hành sàng lọc và phản hồi kết quả trong tối đa 3 ngày làm việc.");
    insertProcess.run("02", "Phỏng vấn sơ loại", "Một buổi trò chuyện thân mật (trực tiếp hoặc online) cùng bộ phận HR để chia sẻ định hướng công việc, lộ trình nghề nghiệp và mức độ phù hợp văn hóa làm việc.");
    insertProcess.run("03", "Đánh giá năng lực chuyên môn", "Ứng viên tham gia thực hiện bài đánh giá kiến thức chuyên môn thực tế hoặc trao đổi chuyên sâu trực tiếp cùng Hội đồng Luật sư thành viên sáng lập của Ánh Dương Law.");
    insertProcess.run("04", "Nhận việc & Onboarding", "Bộ phận nhân sự gửi Thư mời nhận việc (Offer Letter) với các thỏa thuận đãi ngộ chi tiết. Ứng viên tham gia chương trình đào tạo hội nhập có Mentor dẫn dắt.");
  }

  const newsCount = db.prepare("SELECT COUNT(*) as count FROM news").get() as { count: number };
  if (newsCount.count === 0) {
    const insertNews = db.prepare("INSERT INTO news (title, excerpt, date, category, image) VALUES (?, ?, ?, ?, ?)");
    insertNews.run("Quy định mới về Luật Đất đai 2024", "Những điểm mới quan trọng trong Luật Đất đai 2024 ảnh hưởng đến doanh nghiệp.", "2024-03-15", "Pháp luật", "https://picsum.photos/seed/news1/800/600");
    insertNews.run("Hướng dẫn thủ tục thành lập doanh nghiệp", "Cập nhật các bước và thủ tục cần thiết để thành lập công ty năm 2024.", "2024-03-10", "Doanh nghiệp", "https://picsum.photos/seed/news2/800/600");
  }

  const officesCount = db.prepare("SELECT COUNT(*) as count FROM offices").get() as { count: number };
  if (officesCount.count === 0) {
    const insertOffice = db.prepare("INSERT INTO offices (name, short_name, region, address, phone, email, map_url, is_headquarters, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    insertOffice.run("Trụ sở chính TP. Hồ Chí Minh", "Hồ Chí Minh", "south", "Lầu 8, Tòa nhà số 520 Cách Mạng Tháng Tám, Phường 11, Quận 3, TP. Hồ Chí Minh", "1900 3330", "info@anhduonglaw.vn", "https://maps.google.com/?q=520+Cach+Mang+Thang+Tam+Quan+3+TP+HCM", 1, 10.784206, 106.666993);
    insertOffice.run("Chi nhánh Hà Nội", "Hà Nội", "north", "Tầng 13, Toà nhà MD Complex, Số 68 Nguyễn Cơ Thạch, KĐT Mỹ Đình 1, Phường Cầu Diễn, Quận Nam Từ Liêm, Hà Nội", "1900 3330", "info@anhduonglaw.vn", "https://maps.google.com/?q=68+Nguyen+Co+Thach+Nam+Tu+Liem+Ha+Noi", 0, 21.029851, 105.766173);
    insertOffice.run("Chi nhánh Đà Nẵng", "Đà Nẵng", "central", "Tầng 3, Số 229 Lê Duẩn, Phường Tân Chính, Quận Thanh Khê, TP. Đà Nẵng", "1900 3330", "info@anhduonglaw.vn", "https://maps.google.com/?q=229+Le+Duan+Thanh+Khe+Da+Nang", 0, 16.069154, 108.214064);
    insertOffice.run("Chi nhánh Bình Dương", "Bình Dương", "south", "Số 30/10 Đường Nguyễn Du, KP. Nhị Đồng 1, Phường Dĩ An, TP. Dĩ An, Bình Dương", "1900 3330", "info@anhduonglaw.vn", "https://maps.google.com/?q=Nguyen+Du+Di+An+Binh+Duong", 0, 10.9804, 106.7119);
    insertOffice.run("Chi nhánh Đồng Nai", "Đồng Nai", "south", "Số 262/2 Cách Mạng Tháng Tám, Phường Thanh Bình, TP. Biên Hòa, Đồng Nai", "1900 3330", "info@anhduonglaw.vn", "https://maps.google.com/?q=262+CMT8+Thanh+Binh+Bien+Hoa+Dong+Nai", 0, 10.9574, 106.8427);
    insertOffice.run("Chi nhánh Cần Thơ", "Cần Thơ", "south", "Số 120-122 Đường Ngô Quyền, Phường An Hoà, Quận Ninh Kiều, Cần Thơ", "1900 3330", "info@anhduonglaw.vn", "https://maps.google.com/?q=120+Ngo+Quyen+An+Hoa+Ninh+Kieu+Can+Tho", 0, 10.0452, 105.7469);
    insertOffice.run("Chi nhánh Vũng Tàu", "Vũng Tàu", "south", "Số 516 Cách Mạng Tháng Tám, Phường Phước Trung, TP. Bà Rịa, Vũng Tàu", "1900 3330", "info@anhduonglaw.vn", "https://maps.google.com/?q=516+CMT8+Phuoc+Trung+Ba+Ria+Vung+Tau", 0, 10.4963, 107.1691);
    insertOffice.run("Chi nhánh Hải Phòng", "Hải Phòng", "north", "Số 30 Đường Trần Nguyên Hãn, Phường Lê Chân, TP. Hải Phòng", "1900 3330", "info@anhduonglaw.vn", "https://maps.google.com/?q=30+Tran+Nguyen+Han+Le+Chan+Hai+Phong", 0, 20.8449, 106.6881);
  }

  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "Abcd@12345";
  const adminPasswordHash = bcrypt.hashSync(adminPassword, 12);
  const adminExists = db.prepare("SELECT id, password FROM users WHERE username = 'admin' OR role = 'admin' ORDER BY CASE WHEN username = 'admin' THEN 0 ELSE 1 END, id LIMIT 1").get() as { id?: number; password?: string } | undefined;
  if (!adminExists) {
    db.prepare("INSERT INTO users (username, password, name, role, staff_code, title, branch, salary, practice_areas, account_type, known_devices, login_failures, locked_until) VALUES (?, ?, 'Quản trị viên', 'admin', 'QTV001', '', 'Trụ sở chính', '0', 'ban_giam_doc', 'INTERNAL', '[]', 0, NULL)").run('admin', adminPasswordHash);
  } else {
    // Keep the protected account canonical without resetting its password on every restart.
    const passwordUpdate = adminExists.password && /^\$2[aby]\$/.test(adminExists.password)
      ? adminExists.password
      : adminPasswordHash;
    db.prepare("UPDATE users SET username = 'admin', name = 'Quản trị viên', role = 'admin', password = ?, title = '', practice_areas = 'ban_giam_doc', salary = '0', branch = 'Trụ sở chính', account_type = 'INTERNAL' WHERE id = ?").run(passwordUpdate, adminExists.id);
  }

  // Khôi phục đồng bộ lập tức cho dữ liệu hiện có trong CSDL thực tế
  try {
    db.prepare("UPDATE users SET branch = 'Trụ sở chính', salary = '0' WHERE username = 'admin'").run();
    db.prepare(`
      UPDATE monthly_payrolls 
      SET branch = 'Trụ sở chính', gross = 0, total_salary = 0, insurance = 0, tax = 0, net = bonus
      WHERE user_id = (SELECT id FROM users WHERE username = 'admin')
    `).run();
  } catch (e) {
    console.error("Lỗi đồng bộ lương Quản trị viên:", e);
  }

  // Luôn đảm bảo có các tài khoản nhân sự / luật sư thực tế
  const staffUsersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'client'").get() as { count: number };
  if (staffUsersCount.count <= 1) {
    const insertStaff = db.prepare("INSERT OR IGNORE INTO users (username, password, name, role, staff_code, title, branch, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    insertStaff.run("ls_tranvanbao", "Abcd@12345", "Luật sư Trần Văn Bảo", "staff", "NV002", "Luật sư", "Hội sở", "25000000");
    insertStaff.run("cv_nguyenhainguyet", "Abcd@12345", "Chuyên viên Nguyễn Hải Nguyệt", "staff", "NV003", "Chuyên viên pháp lý", "Chi nhánh Hà Nội", "18000000");
    insertStaff.run("ls_phamhoanglong", "Abcd@12345", "Luật sư Phạm Hoàng Long", "staff", "NV004", "Luật sư", "Chi nhánh TP.HCM", "22000000");
  }

  // Khôi phục, cập nhật chức vụ của nhân viên theo đúng danh mục chức vụ hệ thống
  try {
    db.prepare("UPDATE users SET title = 'Luật sư' WHERE title = 'Luật sư Cấp cao' OR title = 'Luật sư Tranh tụng'").run();
    db.prepare("UPDATE users SET title = 'Chuyên viên pháp lý' WHERE title = 'Chuyên viên Pháp lý' OR title = 'Chuyên viên Tư vấn Pháp lý Doanh nghiệp'").run();
    db.prepare("UPDATE users SET title = 'Thực tập sinh' WHERE title = 'Thực tập sinh Pháp lý (Legal Intern)'").run();
    db.prepare("UPDATE users SET title = 'Kế toán' WHERE title = 'Chuyên viên Quyết toán Thuế & Kế toán Doanh nghiệp'").run();

    db.prepare("UPDATE team SET title = 'Trưởng phòng' WHERE title = 'Trưởng phòng Tranh tụng'").run();
    db.prepare("UPDATE team SET title = 'Chuyên viên pháp lý' WHERE title = 'Chuyên viên Tư vấn'").run();
  } catch (err) {
    console.error("Lỗi khi đồng bộ chuẩn hóa chức vụ hệ thống:", err);
  }

  const recordTypesCount = db.prepare("SELECT COUNT(*) as count FROM record_types").get() as { count: number };
  if (recordTypesCount.count === 0) {
    const insertType = db.prepare("INSERT INTO record_types (type_code, type_name, description, display_color, active) VALUES (?, ?, ?, ?, ?)");
    insertType.run("DS", "Dân sự", "Tranh chấp dân sự, thừa kế, hợp đồng dân sự, bồi thường thiệt hại ngoài hợp đồng...", "bg-orange-500", 1);
    insertType.run("HS", "Hình sự", "Các vụ án hình sự, bào chữa, bảo vệ quyền lợi hợp pháp của bị can, bị cáo, đương sự...", "bg-rose-500", 1);
    insertType.run("HC", "Hành chính", "Khiếu nại, khởi kiện quyết định hành chính, hành vi hành chính của cơ quan nhà nước...", "bg-blue-500", 1);
    insertType.run("HNGĐ", "Hôn nhân & Gia đình", "Thủ tục ly hôn, tranh chấp quyền nuôi con, chia tài sản chung, cấp dưỡng...", "bg-pink-500", 1);
    insertType.run("KDTM", "Kinh doanh & Thương mại", "Tranh chấp hợp đồng thương mại, mua bán hàng hóa, tranh chấp nội bộ công ty, cổ đông...", "bg-purple-500", 1);
    insertType.run("LĐ", "Lao động", "Tranh chấp hợp đồng lao động, sa thải, tiền lương, bảo hiểm xã hội, kỷ luật lao động...", "bg-emerald-500", 1);
    insertType.run("ĐĐ", "Đất đai & Bất động sản", "Tranh chấp quyền sử dụng đất, cấp sổ đỏ, thu hồi đất, bồi thường tái định cư, giao dịch nhà đất...", "bg-amber-500", 1);
    insertType.run("DN", "Doanh nghiệp & Đầu tư", "Tư vấn thành lập, sáp nhập, giải thể doanh nghiệp, xin giấy phép con, dự án đầu tư...", "bg-indigo-500", 1);
    insertType.run("TV", "Tư vấn pháp luật", "Cung cấp dịch vụ tư vấn pháp lý thường xuyên, soạn thảo hợp đồng, di chúc, rà soát văn bản...", "bg-blue-500", 1);
    insertType.run("K", "Khác", "Các dịch vụ pháp lý và vụ việc khác không thuộc các phân loại trên...", "bg-gray-500", 1);
  }

  const gmailAccountsCount = db.prepare("SELECT COUNT(*) as count FROM gmail_accounts").get() as { count: number };
  if (gmailAccountsCount.count === 0) {
    const insertGmail = db.prepare("INSERT INTO gmail_accounts (email, pass, recovery, proxy, phone, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    insertGmail.run("anhduong.legal.01@gmail.com", "AdL@2026_x89", "recovery.ad01@anhduonglaw.vn", "103.142.14.88:1080", "+84918239401", "Active", "2026-08-14 14:20");
    insertGmail.run("anhduong.legal.02@gmail.com", "Sec#Lawyer2026", "recovery.ad02@anhduonglaw.vn", "194.28.112.44:8080", "+84988776655", "Active", "2026-08-14 16:45");
  }

  const chatChannelsCount = db.prepare("SELECT COUNT(*) as count FROM chat_channels").get() as { count: number };
  if (chatChannelsCount.count === 0) {
    const insertChannel = db.prepare("INSERT INTO chat_channels (name, description, is_private, created_by, created_at) VALUES (?, ?, ?, ?, ?)");
    insertChannel.run("chung-toan-van-phong", "Kênh thảo luận chung dành cho toàn bộ nhân viên và đối tác", 0, 1, new Date().toISOString());
    insertChannel.run("thảo-luận-luật", "Nơi trao đổi chuyên môn, án lệ, văn bản pháp luật và kinh nghiệm tư vấn", 0, 1, new Date().toISOString());
    insertChannel.run("thông-báo-nội-bộ", "Kênh thông báo chính thức từ Ban Giám đốc (Chỉ đọc với nhân viên thường và đối tác)", 0, 1, new Date().toISOString());
  }

  const qcRulesCount = db.prepare("SELECT COUNT(*) as count FROM qc_rules").get() as { count: number };
  if (qcRulesCount.count === 0) {
    const insertRule = db.prepare("INSERT INTO qc_rules (code, name, type, points_effect, money_effect, category) VALUES (?, ?, ?, ?, ?, ?)");
    // Violations
    insertRule.run("VP01", "Đi trễ / Về sớm không lý do chính đáng", "violation", -5, -100000, "Kỷ luật");
    insertRule.run("VP02", "Chậm nộp hoặc chậm cập nhật hồ sơ vụ việc", "violation", -15, -200000, "Chuyên môn");
    insertRule.run("VP03", "Sai sót lỗi chuyên môn hoặc soạn thảo sai mẫu văn bản", "violation", -10, -150000, "Chuyên môn");
    insertRule.run("VP04", "Bị khách hàng phản hồi không tốt về thái độ phục vụ", "violation", -20, -300000, "Thái độ");
    insertRule.run("VP05", "Vắng mặt tại phiên tòa hoặc buổi hẹn khách hàng không báo trước", "violation", -30, -500000, "Kỷ luật");
    insertRule.run("VP06", "Không cập nhật trạng thái hồ sơ / tài liệu trên hệ thống", "violation", -5, -50000, "Kỷ luật");
    
    // Bonuses
    insertRule.run("TH01", "Hoàn thành hồ sơ vụ việc xuất sắc và trước thời hạn", "bonus", 15, 300000, "Chuyên môn");
    insertRule.run("TH02", "Được khách hàng đánh giá 5 sao hoặc gửi thư khen ngợi", "bonus", 10, 200000, "Thái độ");
    insertRule.run("TH03", "Nỗ lực hỗ trợ đồng nghiệp xử lý vụ việc phức tạp ngoài giờ", "bonus", 5, 100000, "Hỗ trợ");
    insertRule.run("TH04", "Đóng góp sáng kiến pháp lý có giá trị áp dụng thực tiễn", "bonus", 20, 500000, "Sáng tạo");
  }

  // Clean up only temporary simulated voip call records if explicitly marked as mock seed
  try {
    const callSeedIds = ["call-seed-1", "call-seed-2", "call-seed-3", "appt-seed-1", "appt-seed-2"];
    for (const mId of callSeedIds) {
      db.prepare("DELETE FROM voip_calls WHERE id = ?").run(mId);
    }
    // Never delete user cases or dossiers by ID. Clean up only records explicitly marked with is_seed = 1
    db.prepare("DELETE FROM erp_records WHERE json_extract(data, '$.is_seed') = 1").run();
  } catch (e) {
    console.warn("Cleanup of mock records error:", e);
  }

  // Clear simulated finance data as requested
  try {
    db.prepare("DELETE FROM finance_transactions").run();
    db.prepare("DELETE FROM company_assets").run();
    db.prepare("DELETE FROM company_debts").run();
    db.prepare("DELETE FROM tax_reports").run();
    db.prepare("DELETE FROM budget_plans").run();
    db.prepare("DELETE FROM salary_payment_orders").run();
  } catch (err) {
    console.warn("Clearing finance tables error:", err);
  }

  // Do not seed evaluations and monthly payrolls for deleted simulated users

  // Clear any existing Buddhist or religious documents, and enforce clean seeding for pure legal documents
  db.prepare("DELETE FROM legal_documents WHERE title LIKE '%Phật giáo%' OR title LIKE '%Tăng sự%' OR category LIKE '%Phật giáo%' OR category = 'Tôn giáo & Phật giáo'").run();

  const legalDocsCount = db.prepare("SELECT COUNT(*) as count FROM legal_documents").get() as { count: number };
  if (legalDocsCount.count < 10) {
    db.prepare("DELETE FROM legal_documents").run();
    
    const insertDoc = db.prepare(`
      INSERT INTO legal_documents (title, document_number, issue_date, effective_date, agency, signer, content, status, summary, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertDoc.run(
      "Luật Xây dựng số 135/2025/QH15",
      "135/2025/QH15",
      "2025-11-15",
      "2026-07-01",
      "Quốc hội",
      "Trần Thanh Mẫn",
      "LUẬT XÂY DỰNG\n\nCăn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;\nQuốc hội ban hành Luật Xây dựng.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nLuật này quy định về hoạt động đầu tư xây dựng, quyền và nghĩa vụ của tổ chức, cá nhân tham gia hoạt động đầu tư xây dựng, quản lý nhà nước về hoạt động đầu tư xây dựng.\n\nĐiều 2. Đối tượng áp dụng\nLuật này áp dụng đối với cơ quan, tổ chức, cá nhân trong nước; tổ chức, cá nhân nước ngoài hoạt động đầu tư xây dựng trên lãnh thổ nước Cộng hòa xã hội chủ nghĩa Việt Nam.",
      "Sắp có hiệu lực",
      "Luật Xây dựng quy định về hoạt động đầu tư xây dựng, quyền và nghĩa vụ của tổ chức, cá nhân tham gia hoạt động đầu tư xây dựng, quản lý nhà nước về hoạt động đầu tư xây dựng.",
      "Luật Xây dựng",
      new Date().toISOString()
    );

    insertDoc.run(
      "Nghị định số 193/2026/NĐ-CP",
      "193/2026/NĐ-CP",
      "2026-02-15",
      "2026-07-01",
      "Chính phủ",
      "Phạm Minh Chính",
      "NGHỊ ĐỊNH\nQuy định chi tiết một số điều của Luật Xây dựng về quản lý dự án đầu tư xây dựng.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nNghị định này quy định chi tiết một số điều của Luật Xây dựng về quản lý dự án đầu tư xây dựng, gồm lập, thẩm định, phê duyệt dự án, hình thức quản lý dự án và điều kiện năng lực hoạt động.",
      "Sắp có hiệu lực",
      "Nghị định quy định chi tiết một số điều của Luật Xây dựng về quản lý dự án đầu tư xây dựng, bao gồm việc lập, thẩm định, phê duyệt dự án, hình thức quản lý dự án và điều kiện năng lực hoạt động.",
      "Luật Xây dựng",
      new Date().toISOString()
    );

    insertDoc.run(
      "Nghị định số 206/2026/NĐ-CP",
      "206/2026/NĐ-CP",
      "2026-02-20",
      "2026-07-01",
      "Chính phủ",
      "Phạm Minh Chính",
      "NGHỊ ĐỊNH\nQuy định về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nNghị định này quy định chi tiết về quản lý chất lượng công trình xây dựng, thi công xây dựng và công tác bảo trì công trình.",
      "Sắp có hiệu lực",
      "Nghị định quy định về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng nhằm bảo đảm an toàn và tuổi thọ công trình.",
      "Luật Xây dựng",
      new Date().toISOString()
    );

    insertDoc.run(
      "Nghị định số 207/2026/NĐ-CP",
      "207/2026/NĐ-CP",
      "2026-02-22",
      "2026-07-01",
      "Chính phủ",
      "Phạm Minh Chính",
      "NGHỊ ĐỊNH\nQuy định về hợp đồng xây dựng trong hoạt động đầu tư xây dựng.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nNghị định này quy định chi tiết về các loại hợp đồng xây dựng, nguyên tắc ký kết, thực hiện, điều chỉnh và quyết toán hợp đồng xây dựng.",
      "Sắp có hiệu lực",
      "Nghị định quy định về hợp đồng xây dựng trong hoạt động đầu tư xây dựng, các nguyên tắc ký kết và điều khoản thực hiện.",
      "Luật Xây dựng",
      new Date().toISOString()
    );

    insertDoc.run(
      "Nghị định số 209/2026/NĐ-CP",
      "209/2026/NĐ-CP",
      "2026-02-25",
      "2026-07-01",
      "Chính phủ",
      "Phạm Minh Chính",
      "NGHỊ ĐỊNH\nQuy định chi tiết về chi phí đầu tư xây dựng và phương pháp xác định định mức.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nNghị định này quy định chi tiết về lập, quản lý chi phí đầu tư xây dựng bao gồm tổng mức đầu tư, dự toán, định mức và đơn giá xây dựng.",
      "Sắp có hiệu lực",
      "Nghị định quy định chi tiết về chi phí đầu tư xây dựng và phương pháp xác định định mức, tổng mức đầu tư, dự toán xây dựng.",
      "Luật Xây dựng",
      new Date().toISOString()
    );

    insertDoc.run(
      "Nghị định số 210/2026/NĐ-CP",
      "210/2026/NĐ-CP",
      "2026-02-28",
      "2026-07-01",
      "Chính phủ",
      "Phạm Minh Chính",
      "NGHỊ ĐỊNH\nQuy định chi tiết về an toàn lao động và bảo vệ môi trường trong thi công xây dựng.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nNghị định này quy định về các tiêu chuẩn an toàn lao động, phòng chống cháy nổ và bảo vệ môi trường đối với công trường thi công xây dựng.",
      "Sắp có hiệu lực",
      "Nghị định quy định chi tiết về an toàn lao động và bảo vệ môi trường trong thi công xây dựng.",
      "Luật Xây dựng",
      new Date().toISOString()
    );

    insertDoc.run(
      "Nghị định số 212/2026/NĐ-CP",
      "212/2026/NĐ-CP",
      "2026-03-05",
      "2026-07-01",
      "Chính phủ",
      "Phạm Minh Chính",
      "NGHỊ ĐỊNH\nVề điều kiện năng lực hoạt động xây dựng của tổ chức, cá nhân.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nNghị định này quy định về điều kiện cấp chứng chỉ hành nghề đối với cá nhân và chứng chỉ năng lực đối với tổ chức hoạt động xây dựng.",
      "Sắp có hiệu lực",
      "Nghị định về điều kiện năng lực hoạt động xây dựng của tổ chức, cá nhân, quy định về chứng chỉ hành nghề và chứng chỉ năng lực hoạt động.",
      "Luật Xây dựng",
      new Date().toISOString()
    );

    insertDoc.run(
      "Nghị định số 217/2026/NĐ-CP",
      "217/2026/NĐ-CP",
      "2026-03-12",
      "2026-07-01",
      "Chính phủ",
      "Phạm Minh Chính",
      "NGHỊ ĐỊNH\nQuy định chi tiết về giám sát, đánh giá đầu tư dự án xây dựng.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nNghị định này quy định về quy trình, thẩm quyền và tiêu chuẩn giám sát, đánh giá đầu tư dự án xây dựng sử dụng nguồn vốn nhà nước và nguồn vốn khác.",
      "Sắp có hiệu lực",
      "Nghị định quy định chi tiết về giám sát, đánh giá đầu tư dự án xây dựng.",
      "Luật Xây dựng",
      new Date().toISOString()
    );

    insertDoc.run(
      "Luật Đất đai năm 2024",
      "31/2024/QH15",
      "2024-01-18",
      "2025-01-01",
      "Quốc hội",
      "Vương Đình Huệ",
      "LUẬT ĐẤT ĐAI\n\nCăn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;\nQuốc hội ban hành Luật Đất đai.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nLuật này quy định về chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước đại diện chủ sở hữu toàn dân về đất đai và thống nhất quản lý về đất đai, chế độ quản lý và sử dụng đất đai, quyền và nghĩa vụ của công dân, người sử dụng đất đối với đất đai thuộc lãnh thổ của nước Cộng hòa xã hội chủ nghĩa Việt Nam.\n\nĐiều 2. Đối ứng áp dụng\n1. Cơ quan nhà nước thực hiện quyền hạn và trách nhiệm đại diện chủ sở hữu toàn dân về đất đai, thực hiện nhiệm vụ thống nhất quản lý nhà nước về đất đai.\n2. Người sử dụng đất.\n3. Các đối tượng khác có liên quan đến việc quản lý, sử dụng đất đai.",
      "Đang có hiệu lực",
      "Luật Đất đai năm 2024 quy định về chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước đại diện chủ sở hữu toàn dân về đất đai và thống nhất quản lý về đất đai, chế độ quản lý và sử dụng đất đai, quyền và nghĩa vụ của công dân, người sử dụng đất đối với đất đai thuộc lãnh thổ Việt Nam.",
      "Luật Đất đai",
      new Date().toISOString()
    );

    insertDoc.run(
      "Luật Kiến trúc năm 2019",
      "40/2019/QH14",
      "2019-06-14",
      "2020-07-01",
      "Quốc hội",
      "Nguyễn Thị Kim Ngân",
      "LUẬT KIẾN TRÚC\n\nCăn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;\nQuốc hội ban hành Luật Kiến trúc.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nLuật này quy định về quản lý kiến trúc, hành nghề kiến trúc; quyền, nghĩa vụ và trách nhiệm của cơ quan, tổ chức, cá nhân trong hoạt động kiến trúc.",
      "Đang có hiệu lực",
      "Luật này quy định về quản lý kiến trúc, hành nghề kiến trúc; quyền, nghĩa vụ và trách nhiệm của cơ quan, tổ chức, cá nhân trong hoạt động kiến trúc.",
      "Luật Kiến trúc",
      new Date().toISOString()
    );

    insertDoc.run(
      "Luật Nhà ở năm 2023",
      "27/2023/QH15",
      "2023-11-27",
      "2024-08-01",
      "Quốc hội",
      "Vương Đình Huệ",
      "LUẬT NHÀ Ở\n\nCăn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;\nQuốc hội ban hành Luật Nhà ở.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nLuật này quy định về sở hữu, phát triển, quản lý vận hành, sử dụng nhà ở; giao dịch về nhà ở; quản lý nhà nước về nhà ở tại Việt Nam.",
      "Đang có hiệu lực",
      "Luật này quy định về sở hữu, phát triển, quản lý vận hành, sử dụng nhà ở; giao dịch về nhà ở; quản lý nhà nước về nhà ở tại Việt Nam.",
      "Luật Nhà ở",
      new Date().toISOString()
    );

    insertDoc.run(
      "Luật Quy hoạch đô thị năm 2009",
      "30/2009/QH12",
      "2009-06-17",
      "2010-01-01",
      "Quốc hội",
      "Nguyễn Phú Trọng",
      "LUẬT QUY HOẠCH ĐÔ THỊ\n\nCăn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;\nQuốc hội ban hành Luật Quy hoạch đô thị.\n\nCHƯƠNG I: QUY ĐỊNH CHUNG\n\nĐiều 1. Phạm vi điều chỉnh\nLuật này quy định về hoạt động quy hoạch đô thị gồm lập, thẩm định, phê duyệt và điều chỉnh quy hoạch đô thị; tổ chức thực hiện quy hoạch đô thị và quản lý phát triển đô thị theo quy hoạch.",
      "Đang có hiệu lực",
      "Luật này quy định về hoạt động quy hoạch đô thị gồm lập, thẩm định, phê duyệt và điều chỉnh quy hoạch đô thị; tổ chức thực hiện quy hoạch đô thị và quản lý phát triển đô thị theo quy hoạch.",
      "Luật Quy hoạch ĐT & NT",
      new Date().toISOString()
    );
  }

  const insertPerm = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (role, manageUsers, viewAllRecords, editAllRecords, deleteRecords, viewReports, manageWeb, manageFinance, viewPersonalRecords, editPersonalRecords, manageEvents, manageLegalDocs, viewEventHistory)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const initialPermissions: Record<string, any> = {
    admin: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    director: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    deputyDirector: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    controller: { manageUsers: 1, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 1, viewReports: 1, manageWeb: 1, manageFinance: 1, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    head_of_department: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    manager: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    prosecutor: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 1, manageLegalDocs: 1, viewEventHistory: 1 },
    lawyer: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 1, viewEventHistory: 1 },
    specialist: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    accountant: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 1, manageWeb: 0, manageFinance: 1, viewPersonalRecords: 0, editPersonalRecords: 0, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    editor: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 1, manageFinance: 0, viewPersonalRecords: 0, editPersonalRecords: 0, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    traineeLawyer: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    intern: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    legal_associate: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 1, viewEventHistory: 1 },
    consultant: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    uploader: { manageUsers: 0, viewAllRecords: 1, editAllRecords: 1, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
    user: { manageUsers: 0, viewAllRecords: 0, editAllRecords: 0, deleteRecords: 0, viewReports: 0, manageWeb: 0, manageFinance: 0, viewPersonalRecords: 1, editPersonalRecords: 1, manageEvents: 0, manageLegalDocs: 0, viewEventHistory: 0 },
  };

  for (const [role, perms] of Object.entries(initialPermissions)) {
    insertPerm.run(role, perms.manageUsers, perms.viewAllRecords, perms.editAllRecords, perms.deleteRecords, perms.viewReports, perms.manageWeb, perms.manageFinance, perms.viewPersonalRecords, perms.editPersonalRecords, perms.manageEvents, perms.manageLegalDocs, perms.viewEventHistory);
  }

  // Forced check to guarantee controller role has full permissions set to 1
  try {
    const checkController = db.prepare(`SELECT COUNT(*) as count FROM role_permissions WHERE role='controller'`).get() as { count: number };
    if (checkController.count === 0) {
      db.prepare(`
        INSERT INTO role_permissions (role, manageUsers, viewAllRecords, editAllRecords, deleteRecords, viewReports, manageWeb, manageFinance, viewPersonalRecords, editPersonalRecords, manageEvents, manageLegalDocs, viewEventHistory)
        VALUES ('controller', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
      `).run();
    } else {
      db.prepare(`
        UPDATE role_permissions 
        SET manageUsers=1, viewAllRecords=1, editAllRecords=1, deleteRecords=1, viewReports=1, manageWeb=1, manageFinance=1, viewPersonalRecords=1, editPersonalRecords=1, manageEvents=1, manageLegalDocs=1, viewEventHistory=1
        WHERE role='controller'
      `).run();
    }
  } catch (e: any) {
    console.error("Failed to configure controller permissions forcefully in SQLite DB", e.message);
  }

  // Enforce deputyDirector permissions: full management authority, but manageFinance=0 (restricted to Director, Admin, Accountant)
  try {
    db.prepare(`
      UPDATE role_permissions 
      SET manageUsers=1, viewAllRecords=1, editAllRecords=1, deleteRecords=1, viewReports=1, manageWeb=1, manageFinance=0, viewPersonalRecords=1, editPersonalRecords=1, manageEvents=1, manageLegalDocs=1, viewEventHistory=1
      WHERE role='deputyDirector'
    `).run();
  } catch (e: any) {
    console.error("Failed to enforce deputyDirector permissions", e.message);
  }

  // Seed contact settings
  try {
    const contactSettingsCount = db.prepare("SELECT COUNT(*) as count FROM contact_settings").get() as { count: number };
    if (contactSettingsCount.count === 0) {
      const insertSetting = db.prepare("INSERT INTO contact_settings (key, value) VALUES (?, ?)");
      insertSetting.run("hotline_consult", "1900 3330");
      insertSetting.run("hotline_accounting", "084.696.7979");
      insertSetting.run("hotline_feedback", "090.999.3330");
      insertSetting.run("email", "info@anhduonglaw.vn");
    }
  } catch (e: any) {
    console.error("Error seeding contact settings:", e.message);
  }

  // Seed legal forms
  try {
    const formsCount = db.prepare("SELECT COUNT(*) as count FROM legal_forms").get() as { count: number };
    if (formsCount.count === 0) {
      const insertForm = db.prepare("INSERT INTO legal_forms (title, category, description, content) VALUES (?, ?, ?, ?)");
      insertForm.run(
        "Đơn khởi kiện dân sự (Mẫu số 23-DS)",
        "Dân sự",
        "Mẫu đơn chuẩn dùng để khởi kiện các vụ án dân sự, tranh chấp hợp đồng, đất đai theo Nghị quyết 01/2017/NQ-HĐTP.",
        `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n--------------------\n\n..., ngày ... tháng ... năm ...\n\nĐƠN KHỞI KIỆN\n\nKính gửi: Tòa án nhân dân ....................................................\n\nNgười khởi kiện: .............................................................\nĐịa chỉ cư trú: ...............................................................\nSố điện thoại: ............................ Email: ..........................\n\nNgười bị kiện: ...............................................................\nĐịa chỉ cư trú: ...............................................................\nSố điện thoại: ............................ Email: ..........................\n\nYÊU CẦU TÒA ÁN GIẢI QUYẾT NHỮNG VẤN ĐỀ SAU ĐÂY:\n1. ............................................................................\n2. ............................................................................\n\nDANH MỤC TÀI LIỆU, CHỨNG CỨ KÈM THEO ĐƠN:\n1. Bản sao Căn cước công dân.\n2. Tài liệu chứng minh quyền sở hữu tài sản / Hợp đồng tranh chấp.\n3. ............................................................................\n\nNgười khởi kiện (Ký và ghi rõ họ tên)`
      );
      insertForm.run(
        "Đơn xin ly hôn thuận tình",
        "Hôn nhân",
        "Mẫu đơn dùng khi cả hai vợ chồng tự nguyện ly hôn và đã thỏa thuận xong các vấn đề về tài sản, con chung.",
        `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n--------------------\n\nĐƠN YÊU CẦU CÔNG NHẬN THUẬN TÌNH LY HÔN,\nNUÔI CON VÀ CHIA TÀI SẢN KHI LY HÔN\n\nKính gửi: Tòa án nhân dân ....................................................\n\nChúng tôi gồm:\nChồng: ........................................... Sinh năm: .................\nCăn cước công dân số: ............................ Cấp ngày: ................\nĐịa chỉ thường trú: ...........................................................\n\nVợ: ............................................. Sinh năm: .................\nCăn cước công dân số: ............................ Cấp ngày: ................\nĐịa chỉ thường trú: ...........................................................\n\nChúng tôi làm đơn này đề nghị Tòa án công nhận thuận tình ly hôn với các nội dung sau:\n1. Về quan hệ hôn nhân: ........................................................\n2. Về con chung: ...............................................................\n3. Về tài sản chung và nợ chung: ................................................\n\nKính đề nghị Tòa án giải quyết.\n\nCHỒNG KÝ TÊN                                 VỢ KÝ TÊN`
      );
      insertForm.run(
        "Đơn khởi kiện vụ án hành chính",
        "Hành chính",
        "Dùng để khởi kiện quyết định hành chính, hành vi hành chính trái pháp luật của cơ quan nhà nước.",
        `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n--------------------\n\nĐƠN KHỞI KIỆN HÀNH CHÍNH\n\nKính gửi: Tòa án nhân dân ....................................................\n\nNgười khởi kiện: .............................................................\nĐịa chỉ: ......................................................................\n\nĐối tượng bị khởi kiện: Quyết định hành chính số: ....... ngày .... của .............\nVề việc: ......................................................................\n\nNội dung khởi kiện và lý do: ...................................................\n...............................................................................\n\nYêu cầu Tòa án giải quyết:\n- Hủy bỏ toàn bộ/một phần Quyết định hành chính nêu trên.\n\nNgười khởi kiện`
      );
      insertForm.run(
        "Mẫu giấy ủy quyền cá nhân",
        "Hợp đồng",
        "Mẫu giấy ủy quyền đơn giản dùng trong giao dịch dân sự, nộp và nhận hồ sơ, đại diện làm thủ tục.",
        `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n--------------------\n\nGIẤY ỦY QUYỀN\n\nBÊN ỦY QUYỀN (BÊN A):\nHọ và tên: ....................................... Sinh năm: .................\nCCCD số: ......................................... Địa chỉ: ..................\n\nBÊN ĐƯỢC ỦY QUYỀN (BÊN B):\nHọ và tên: ....................................... Sinh năm: .................\nCCCD số: ......................................... Địa chỉ: ..................\n\nNỘI DUNG ỦY QUYỀN:\nBên A ủy quyền cho Bên B thay mặt Bên A thực hiện các công việc sau:\n1. Nộp và nhận hồ sơ tại ......................................................\n2. Ký các giấy tờ liên quan hành chính.\n\nThời hạn ủy quyền: Từ ngày .../.../... đến ngày .../.../...\n\nBÊN ỦY QUYỀN                                 BÊN ĐƯỢC ỦY QUYỀN`
      );
    }
  } catch (err: any) {
    console.error("Error seeding legal_forms:", err.message);
  }

  // Seed judgments
  try {
    const judgmentsCount = db.prepare("SELECT COUNT(*) as count FROM judgments").get() as { count: number };
    if (judgmentsCount.count === 0) {
      const insertJudg = db.prepare("INSERT INTO judgments (code, title, court, date, category, summary, content) VALUES (?, ?, ?, ?, ?, ?, ?)");
      insertJudg.run(
        "89/2023/DS-ST",
        "Bản án sơ thẩm về Tranh chấp Hợp đồng đặt cọc mua bán bất động sản",
        "Tòa án nhân dân Quận 1, TP. Hồ Chí Minh",
        "14/05/2023",
        "Dân sự",
        "Quyết định buộc bên nhận đặt cọc hoàn trả gấp đôi số tiền cọc do vi phạm thời hạn công chứng chuyển nhượng quyền sử dụng đất thuộc lỗi của bên bán.",
        `BẢN ÁN SỐ: 89/2023/DS-ST\nVỀ VIỆC TRANH CHẤP HỢP ĐỒNG ĐẶT CỌC CHUYỂN NHƯỢNG ĐẤT\n\nVào ngày 14 tháng 5 năm 2023, tại trụ sở Tòa án nhân dân Quận 1 xét xử sơ thẩm công khai vụ án thụ lý số 120/2023/TLST-DS.\n- Nguyên đơn: Ông Nguyễn Văn A.\n- Bị đơn: Bà Trần Thị B.\n\nNHẬN ĐỊNH CỦA TÒA ÁN:\nXét hợp đồng đặt cọc ký ngày 12/01/2023 giữa nguyên đơn và bị đơn trị giá cọc 500.000.000đ. Bên bán cam kết đến ngày 12/02/2023 hoàn tất giấy tờ để công chứng. Đến hạn bên bán không thực hiện được do đất đang bị thế chấp ngân hàng chưa giải chấp. Lỗi hoàn toàn thuộc về bị đơn.\n\nQUYẾT ĐỊNH:\n1. Chấp nhận yêu cầu khởi kiện của nguyên đơn. Tuyên bố hủy hợp đồng đặt cọc.\n2. Buộc bà Trần Thị B trả lại cho ông Nguyễn Văn A số tiền đặt cọc 500.000.000đ và phạt cọc số tiền 500.000.000đ. Tổng cộng 1.000.000.000đ (Một tỷ đồng).`
      );
      insertJudg.run(
        "42/2023/KDTM-ST",
        "Bản án tranh chấp hợp đồng mua bán hàng hóa, phạt vi phạm và nợ gốc",
        "Tòa án nhân dân Quận Cầu Giấy, TP. Hà Nội",
        "28/08/2023",
        "Kinh doanh",
        "Buộc Công ty bê tông X thanh toán nợ gốc cho Công ty thép Y kèm lãi chậm trả và phạt vi phạm hợp đồng tối đa 8% giá trị phần nghĩa vụ bị vi phạm.",
        `BẢN ÁN SỐ: 42/2023/KDTM-ST\nVỀ TRANH CHẤP HỢP ĐỒNG MUA BÁN THÉP XÂY DỰNG\n\nTòa án nhân dân Quận Cầu Giấy xét xử sơ thẩm vụ án kinh tế thương mại nợ tiền hàng.\n- Nguyên đơn: Công ty Cổ phần Thép Y.\n- Bị đơn: Công ty TNHH Bê tông X.\n\nNHẬN ĐỊNH CỦA TÒA ÁN:\nBị đơn thừa nhận nhận đủ thép theo các hóa đơn bàn giao nhưng chưa thanh toán số tiền nợ gốc 2.450.000.000đ quá hạn 180 ngày. Điều khoản hợp đồng quy định phạt chậm trả 0.05%/ngày và phạt vi phạm 8%.\n\nQUYẾT ĐỊNH:\nBuộc Công ty TNHH Bê tông X thanh toán nợ gốc 2.450.000.000đ, tiền phạt vi phạm chậm trả 196.000.000đ (đúng 8% mức trần luật định) cho Công ty Cổ phần Thép Y.`
      );
      insertJudg.run(
        "15/2023/LĐ-ST",
        "Bản án sơ thẩm về Đơn phương chấm dứt hợp đồng lao động trái luật",
        "Tòa án nhân dân TP. Thuận An, Tỉnh Bình Dương",
        "02/11/2023",
        "Lao động",
        "Tuyên bố quyết định sa thải của Công ty May mặc Z là trái pháp luật, buộc nhận lại người lao động làm việc và bồi thường 6 tháng tiền lương.",
        `BẢN ÁN SỐ: 15/2023/LĐ-ST\nTRANH CHẤP ĐƠN PHƯƠNG CHẤM DỨT HỢP ĐỒNG LAO ĐỘNG\n\nXét xử vụ án sa thải kỷ luật lao động trái luật.\n- Nguyên đơn: Chị Lê Thị C.\n- Bị đơn: Công ty May mặc Z.\n\nNHẬN ĐỊNH CỦA TÒA ÁN:\nCông ty May mặc Z sa thải chị Lê Thị C với lý do tự ý nghỉ việc 5 ngày cộng dồn nhưng không mở cuộc họp kỷ luật lao động có sự tham gia của Công đoàn cơ sở, vi phạm quy trình Bộ luật Lao động 2019.\n\nQUYẾT ĐỊNH:\n1. Tuyên bố Quyết định sa thải số 45/QĐ-May mặc Z là vô hiệu.\n2. Buộc Công ty May mặc Z nhận chị C trở lại làm việc.\n3. Buộc bồi thường tiền lương trong những ngày không được làm việc và 2 tháng lương vi phạm thời hạn báo trước, tổng cộng bồi thường 72.000.000đ.`
      );
    }
  } catch (err: any) {
    console.error("Error seeding judgments:", err.message);
  }

  // Seed precedents
  try {
    const precedentsCount = db.prepare("SELECT COUNT(*) as count FROM precedents").get() as { count: number };
    if (precedentsCount.count === 0) {
      const insertPrec = db.prepare("INSERT INTO precedents (code, title, approved_date, summary, law_issue, solution) VALUES (?, ?, ?, ?, ?, ?)");
      insertPrec.run(
        "Án lệ số 01/2016/AL",
        "Án lệ về vụ án giết người có tính chất côn đồ",
        "06/04/2016",
        "Quy định hướng dẫn cụ thể về tình tiết định khung giết người có tính chất côn đồ khi bị cáo có hành vi hung hãn, coi thường mạng sống chỉ vì mâu thuẫn nhỏ nhặt.",
        "Xác định tình tiết tăng nặng \"Có tính chất côn đồ\" trong tội giết người.",
        "Hành vi vô cớ đâm chém nạn nhân do mâu thuẫn bộc phát nhỏ nhặt được áp dụng tình tiết định khung côn đồ."
      );
      insertPrec.run(
        "Án lệ số 02/2016/AL",
        "Án lệ về tranh chấp tài sản là quyền sử dụng đất có người Việt kiều đóng góp",
        "06/04/2016",
        "Xác định công sức đóng góp của người Việt Nam định cư ở nước ngoài gửi tiền về nhờ người thân trong nước đứng tên mua hộ bất động sản khi phân chia di sản tranh chấp.",
        "Người Việt kiều gửi tiền mua đất nhờ người trong nước đứng tên hộ.",
        "Tòa án phải xác định công sức đóng góp của Việt kiều tương ứng tỷ lệ tiền gửi về, phân chia công bằng thay vì bác bỏ hoàn toàn."
      );
      insertPrec.run(
        "Án lệ số 04/2016/AL",
        "Án lệ về tranh chấp hợp đồng chuyển nhượng quyền sử dụng đất",
        "06/04/2016",
        "Trường hợp hợp đồng chuyển nhượng đất bằng giấy viết tay trước ngày Luật Đất đai có hiệu lực nhưng các bên đã giao tiền và nhận đất canh tác ổn định lâu dài.",
        "Hiệu lực của hợp đồng viết tay chưa công chứng nhưng đã thực hiện nghĩa vụ giao tiền, đất.",
        "Công nhận hiệu lực hợp đồng chuyển nhượng thực tế nhằm bảo đảm tính ổn định của giao dịch dân sự và đời sống người dân."
      );
    }
  } catch (err: any) {
    console.error("Error seeding precedents:", err.message);
  }

  // Seed testimonials
  try {
    const testimonialsCount = db.prepare("SELECT COUNT(*) as count FROM testimonials").get() as { count: number };
    if (testimonialsCount.count === 0) {
      const insertTestimonial = db.prepare("INSERT INTO testimonials (name, role, rating, content, avatar, company) VALUES (?, ?, ?, ?, ?, ?)");
      insertTestimonial.run(
        "Chị Zema",
        "Nhà đầu tư bất động sản",
        5,
        "Ánh Dương Law đã đồng hành cùng tôi trong thương vụ mua bán sáp nhập dự án nghỉ dưỡng tại Đà Nẵng. Sự am hiểu quy hoạch địa phương và tốc độ giải quyết hồ sơ của đội ngũ thực sự vượt ngoài mong đợi!",
        "https://picsum.photos/seed/user1/100/100",
        "Zema Group"
      );
      insertTestimonial.run(
        "Ông Lê Hoàng Nam",
        "Giám đốc Công ty TechVina",
        5,
        "Chúng tôi sử dụng dịch vụ Tư vấn thường xuyên của Ánh Dương Law hơn 3 năm qua. Các Luật sư luôn túc trực, phản hồi rủi ro hợp đồng siêu tốc và bảo vệ tối đa lợi thế thương mại cho chúng tôi.",
        "https://picsum.photos/seed/user2/100/100",
        "TechVina Corp"
      );
      insertTestimonial.run(
        "Bà Trần Mỹ Linh",
        "Trưởng phòng Nhân sự",
        5,
        "Rất hài lòng với giải pháp tái cấu trúc lao động mà Ánh Dương Law tư vấn. Quy trình hòa giải và xây dựng thỏa ước lao động tập thể cực kỳ khéo léo, không để xảy ra bất kỳ tranh chấp hay căng thẳng nội bộ nào.",
        "https://picsum.photos/seed/user3/100/100",
        "Tập đoàn H&K"
      );
    }
  } catch (err: any) {
    console.error("Error seeding testimonials:", err.message);
  }

  // Seed land prices
  try {
    const landPricesCount = db.prepare("SELECT COUNT(*) as count FROM land_prices").get() as { count: number };
    if (landPricesCount.count === 0) {
      const insertPrice = db.prepare(`
        INSERT INTO land_prices (
          province_code, province_name, district_id, district_name, ward_name, street_name, price, 
          residential_price, commercial_price, non_agricultural_price, agricultural_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // HN
      insertPrice.run("HN", "Thành phố Hà Nội", "HK", "Quận Hoàn Kiếm", "Phường Tràng Tiền", "Phố Đinh Tiên Hoàng", 162000000, "162.0 triệu/m²", "130.0 triệu/m²", "110.0 triệu/m²", "");
      insertPrice.run("HN", "Thành phố Hà Nội", "HK", "Quận Hoàn Kiếm", "Phường Hàng Đào", "Phố Hàng Ngang", 145000000, "145.0 triệu/m²", "115.0 triệu/m²", "98.0 triệu/m²", "");
      insertPrice.run("HN", "Thành phố Hà Nội", "HK", "Quận Hoàn Kiếm", "Phường Phan Chu Trinh", "Phố Lý Thường Kiệt", 110000000, "110.0 triệu/m²", "88.0 triệu/m²", "75.0 triệu/m²", "");
      insertPrice.run("HN", "Thành phố Hà Nội", "CG", "Quận Cầu Giấy", "Phường Dịch Vọng", "Đường Nguyễn Văn Huyên", 42000000, "42.0 triệu/m²", "33.6 triệu/m²", "28.5 triệu/m²", "");
      insertPrice.run("HN", "Thành phố Hà Nội", "CG", "Quận Cầu Giấy", "Phường Quan Hoa", "Đường Cầu Giấy", 38000000, "38.0 triệu/m²", "30.4 triệu/m²", "25.8 triệu/m²", "");
      insertPrice.run("HN", "Thành phố Hà Nội", "CG", "Quận Cầu Giấy", "Phường Trung Hòa", "Đường Trần Duy Hưng", 45000000, "45.0 triệu/m²", "36.0 triệu/m²", "30.6 triệu/m²", "");
      insertPrice.run("HN", "Thành phố Hà Nội", "TX", "Quận Thanh Xuân", "Phường Khương Mai", "Đường Nguyễn Trãi", 28000000, "28.0 triệu/m²", "22.4 triệu/m²", "19.0 triệu/m²", "");
      insertPrice.run("HN", "Thành phố Hà Nội", "TX", "Quận Thanh Xuân", "Phường Khương Mai", "Phố Lê Trọng Tấn", 24000000, "24.0 triệu/m²", "19.2 triệu/m²", "16.3 triệu/m²", "");

      // HCM
      insertPrice.run("HCM", "Thành phố Hồ Chí Minh", "Q1", "Quận 1", "Phường Bến Nghé", "Đường Nguyễn Huệ", 180000000, "180.0 triệu/m²", "150.0 triệu/m²", "125.0 triệu/m²", "");
      insertPrice.run("HCM", "Thành phố Hồ Chí Minh", "Q1", "Quận 1", "Phường Bến Nghé", "Đường Đồng Khởi", 180000000, "180.0 triệu/m²", "150.0 triệu/m²", "125.0 triệu/m²", "");
      insertPrice.run("HCM", "Thành phố Hồ Chí Minh", "Q1", "Quận 1", "Phường Bến Nghé", "Đường Lê Lợi", 172000000, "172.0 triệu/m²", "142.0 triệu/m²", "120.0 triệu/m²", "");
      insertPrice.run("HCM", "Thành phố Hồ Chí Minh", "Q3", "Quận 3", "Phường Võ Thị Sáu", "Đường Nam Kỳ Khởi Nghĩa", 82000000, "82.0 triệu/m²", "65.6 triệu/m²", "55.8 triệu/m²", "");
      insertPrice.run("HCM", "Thành phố Hồ Chí Minh", "Q3", "Quận 3", "Phường Võ Thị Sáu", "Đường Nguyễn Thị Minh Khai", 78000000, "78.0 triệu/m²", "62.4 triệu/m²", "53.0 triệu/m²", "");
      insertPrice.run("HCM", "Thành phố Hồ Chí Minh", "BT", "Quận Bình Thạnh", "Phường 22", "Đường Điện Biên Phủ", 34000000, "34.0 triệu/m²", "27.2 triệu/m²", "23.1 triệu/m²", "");
      insertPrice.run("HCM", "Thành phố Hồ Chí Minh", "BT", "Quận Bình Thạnh", "Phường 22", "Đường Nguyễn Hữu Cảnh", 40000000, "40.0 triệu/m²", "32.0 triệu/m²", "27.2 triệu/m²", "");

      // DN
      insertPrice.run("DN", "Thành phố Đà Nẵng", "HC", "Quận Hải Châu", "Phường Hải Châu I", "Đường Bạch Đằng", 55000000, "55.0 triệu/m²", "44.0 triệu/m²", "37.4 triệu/m²", "");
      insertPrice.run("DN", "Thành phố Đà Nẵng", "HC", "Quận Hải Châu", "Phường Tân Chính", "Đường Lê Duẩn", 48000000, "48.0 triệu/m²", "38.4 triệu/m²", "32.6 triệu/m²", "");
      insertPrice.run("DN", "Thành phố Đà Nẵng", "ST", "Quận Sơn Trà", "Phường An Hải Bắc", "Đường Võ Nguyên Giáp", 62000000, "62.0 triệu/m²", "49.6 triệu/m²", "42.1 triệu/m²", "");
      insertPrice.run("DN", "Thành phố Đà Nẵng", "ST", "Quận Sơn Trà", "Phường An Hải Bắc", "Đường Phạm Văn Đồng", 35000000, "35.0 triệu/m²", "28.0 triệu/m²", "23.8 triệu/m²", "");
    }

    const subLimitsCount = db.prepare("SELECT COUNT(*) as count FROM subdivision_limits").get() as { count: number };
    if (subLimitsCount.count === 0) {
      const insertLimit = db.prepare(`
        INSERT INTO subdivision_limits (province_name, district_name, ward_name, subdivision_area, residential_limit) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      // HN
      insertLimit.run("Thành phố Hà Nội", "Quận Hoàn Kiếm", "Phường Tràng Tiền", "Tối thiểu 30 m²", "Hạn mức công nhận tối đa 120 m²");
      insertLimit.run("Thành phố Hà Nội", "Quận Cầu Giấy", "Phường Dịch Vọng", "Tối thiểu 40 m²", "Hạn mức công nhận tối đa 150 m²");
      insertLimit.run("Thành phố Hà Nội", "Quận Thanh Xuân", "Phường Khương Mai", "Tối thiểu 40 m²", "Hạn mức công nhận tối đa 150 m²");
      
      // HCM
      insertLimit.run("Thành phố Hồ Chí Minh", "Quận 1", "Phường Bến Nghé", "Tối thiểu 36 m² và chiều rộng mặt tiền >= 3m", "Hạn mức giao tối đa 160 m²");
      insertLimit.run("Thành phố Hồ Chí Minh", "Quận 3", "Phường Võ Thị Sáu", "Tối thiểu 36 m² và chiều rộng mặt tiền >= 3m", "Hạn mức giao tối đa 160 m²");
      insertLimit.run("Thành phố Hồ Chí Minh", "Quận Bình Thạnh", "Phường 22", "Tối thiểu 50 m² và chiều rộng mặt tiền >= 4m", "Hạn mức giao tối đa 200 m²");

      // DN
      insertLimit.run("Thành phố Đà Nẵng", "Quận Hải Châu", "Phường Hải Châu I", "Tối thiểu 50 m² và chiều rộng mặt tiền >= 3.5m", "Hạn mức công nhận tối đa 150 m²");
      insertLimit.run("Thành phố Đà Nẵng", "Quận Sơn Trà", "Phường An Hải Bắc", "Tối thiểu 60 m² và chiều rộng mặt tiền >= 4.0m", "Hạn mức công nhận tối đa 200 m²");
    }
  } catch (err: any) {
    console.error("Error seeding land_prices or subdivision_limits:", err.message);
  }
};

seedData();

// We no longer clean up or delete non-admin users on startup to ensure full login and session persistence.
// Try to preserve all registered or synced users in both local SQLite and Firestore.

// Add file_url and file_name columns to messages table if they don't exist
try {
  db.prepare("ALTER TABLE messages ADD COLUMN file_url TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE messages ADD COLUMN file_name TEXT").run();
} catch (e) {}

// Auto-synchronize SQLite write queries to Firestore in real-time
const SYNCED_TABLES = [
  "employees",
  "clients",
  "cases",
  "splits",
  "payrolls",
  "monthly_payrolls",
  "evaluations",
  "files",
  "case_text",
  "court_schedule",
  "tasks",
  "invoices",
  "audit_logs",
  "services",
  "legal_services",
  "team",
  "recruitment",
  "recruitment_benefits",
  "recruitment_process",
  "news",
  "legal_forms",
  "judgments",
  "precedents",
  "testimonials",
  "messages",
  "visitor_stats",
  "record_types",
  "erp_records",
  "legal_documents_history",
  "role_permissions",
  "record_messages",
  "live_messages",
  "users",
  "legal_documents",
  "offices",
  "contact_settings",
  "attendance",
  "report_unlock_requests",
  "land_prices",
  "subdivision_limits",
  "land_documents",
  "hr_departments",
  "hr_positions",
  "hr_shifts",
  "hr_attendance",
  "hr_leave_requests",
  "hr_payrolls",
  "hr_performances",
  "hr_contracts",
  "hr_equipment",
  "hr_training",
  "hr_recruitment",
  "hr_workflows",
  "hr_business_trips",
  "hr_overtimes",
  "settings",
  "ai_providers",
  "ai_models",
  "ai_logs",
  "payments",
  "payment_schedules",
  "payment_transactions",
  "payment_events",
  "receipts",
  "case_qr_tokens",
  "qc_rules",
  "qc_records",
  "finance_transactions",
  "company_assets",
  "company_debts",
  "tax_reports",
  "budget_plans",
  "salary_payment_orders",
  "voip_calls",
  "system_performance_metrics",
  "quality_assurance_evaluations",
  "call_events"
];

// Initialize table and triggers for real-time sync tracking
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _sync_changelog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT,
      operation TEXT,
      row_id TEXT
    );
  `);

  for (const tableName of SYNCED_TABLES) {
    // Determine target ID column dynamically or based on table schemas
    let idCol = "id";
    if (tableName === "contact_settings") {
      idCol = "key";
    } else if (tableName === "role_permissions") {
      idCol = "role";
    } else if (tableName === "payrolls") {
      idCol = "employee_id";
    } else if (tableName === "case_text") {
      idCol = "file_id";
    } else if (tableName === "call_events") {
      idCol = "event_id";
    }

    // Verify if table actually exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName);
    if (!tableExists) continue;

    if (tableName === "splits") {
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_splits_insert AFTER INSERT ON splits
        BEGIN
          INSERT INTO _sync_changelog (table_name, operation, row_id)
          VALUES ('splits', 'INSERT', NEW.case_id || '_' || NEW.employee_id);
        END;
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_splits_update AFTER UPDATE ON splits
        BEGIN
          INSERT INTO _sync_changelog (table_name, operation, row_id)
          VALUES ('splits', 'UPDATE', NEW.case_id || '_' || NEW.employee_id);
        END;
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_splits_delete AFTER DELETE ON splits
        BEGIN
          INSERT INTO _sync_changelog (table_name, operation, row_id)
          VALUES ('splits', 'DELETE', OLD.case_id || '_' || OLD.employee_id);
        END;
      `);
    } else {
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_${tableName}_insert AFTER INSERT ON ${tableName}
        BEGIN
          INSERT INTO _sync_changelog (table_name, operation, row_id)
          VALUES ('${tableName}', 'INSERT', CAST(NEW.${idCol} AS TEXT));
        END;
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_${tableName}_update AFTER UPDATE ON ${tableName}
        BEGIN
          INSERT INTO _sync_changelog (table_name, operation, row_id)
          VALUES ('${tableName}', 'UPDATE', CAST(NEW.${idCol} AS TEXT));
        END;
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_${tableName}_delete AFTER DELETE ON ${tableName}
        BEGIN
          INSERT INTO _sync_changelog (table_name, operation, row_id)
          VALUES ('${tableName}', 'DELETE', CAST(OLD.${idCol} AS TEXT));
        END;
      `);
    }
  }
} catch (e: any) {
  console.error("Failed to initialize sync triggers:", e.message);
}

const originalPrepare = db.prepare;
(db as any).prepare = function <BindParameters extends any[] | {} = any[], Result = any>(sql: string) {
  const stmt = originalPrepare.call(db, sql);
  const originalRun = stmt.run;
  
  stmt.run = function (...params: any[]) {
    const result = originalRun.apply(stmt, params);
    
    // Check if sync is disabled (e.g. during startup sync)
    if ((db as any).isSyncingFromFirestore) {
      try {
        (originalPrepare.call(db, "DELETE FROM _sync_changelog") as any).run();
      } catch (e) {}
      return result;
    }
    
    // Query triggers' changelog to find out what changed
    try {
      const changelog = (originalPrepare.call(db, "SELECT * FROM _sync_changelog") as any).all() as any[];
      if (changelog.length > 0) {
        (originalPrepare.call(db, "DELETE FROM _sync_changelog") as any).run();
        
        setImmediate(async () => {
          try {
            const { syncToFirestore, deleteFromFirestore } = await import("./firestore-sync");
            for (const change of changelog) {
              if (change.operation === "DELETE") {
                await deleteFromFirestore(change.table_name, change.row_id);
              } else {
                let row: any = null;
                if (change.table_name === "splits") {
                  const parts = change.row_id.split("_");
                  row = (originalPrepare.call(db, "SELECT * FROM splits WHERE case_id = ? AND employee_id = ?") as any).get(parts[0], parts[1]);
                } else {
                  let idCol = "id";
                  if (change.table_name === "contact_settings") idCol = "key";
                  else if (change.table_name === "role_permissions") idCol = "role";
                  else if (change.table_name === "payrolls") idCol = "employee_id";
                  else if (change.table_name === "case_text") idCol = "file_id";
                  else if (change.table_name === "call_events") idCol = "event_id";
                  
                  row = (originalPrepare.call(db, `SELECT * FROM ${change.table_name} WHERE ${idCol} = ?`) as any).get(change.row_id);
                }
                
                if (row) {
                  await syncToFirestore(change.table_name, change.row_id, row);
                }
              }
            }
          } catch (syncErr: any) {
            console.error("Error in background real-time sync:", syncErr.message);
          }
        });
      }
    } catch (e: any) {
      console.error("Error processing sync changelog:", e.message);
    }
    
    return result;
  };
  
  return stmt;
};

export default db;
