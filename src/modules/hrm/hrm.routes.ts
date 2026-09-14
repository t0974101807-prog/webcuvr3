import { Router } from "express";
import { auth, requirePermission } from "../../middleware/auth";
import db from "../../db/database";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import { encodeCursor, decodeCursor } from "../../utils/cursor";
import { normalizeBranchName } from "../../utils/branch";

const router = Router();

// Helper for AI initialization
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Socket broadcast middleware for HRM events
router.use((req: any, res: any, next: any) => {
  const originalJson = res.json;
  res.json = function (data: any) {
    if (data && data.success && ["POST", "PUT", "DELETE"].includes(req.method)) {
      try {
        const io = req.app.get("io");
        if (io) {
          io.emit("hrm_updated", { path: req.originalUrl, timestamp: new Date().toISOString() });
        }
      } catch (e) {}
    }
    return originalJson.call(this, data);
  };
  next();
});

/* ==========================================================================
   1. HR DASHBOARD REALTIME METRICS
   ========================================================================== */
router.get("/dashboard", auth, (req: any, res: any) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const totalEmployees = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role != 'client'").get() as any)?.c || 0;
    const presentToday = (db.prepare("SELECT COUNT(DISTINCT employee_id) as c FROM hr_attendance WHERE date = ? AND status = 'Present'").get(today) as any)?.c || 0;
    const lateToday = (db.prepare("SELECT COUNT(DISTINCT employee_id) as c FROM hr_attendance WHERE date = ? AND late_minutes > 0").get(today) as any)?.c || 0;
    const earlyLeaveToday = (db.prepare("SELECT COUNT(DISTINCT employee_id) as c FROM hr_attendance WHERE date = ? AND early_leave > 0").get(today) as any)?.c || 0;
    const onLeaveToday = (db.prepare("SELECT COUNT(DISTINCT employee_id) as c FROM hr_leave_requests WHERE ? BETWEEN start_date AND end_date AND status = 'Approved'").get(today) as any)?.c || 0;
    const businessTripToday = (db.prepare("SELECT COUNT(DISTINCT employee_id) as c FROM hr_business_trips WHERE ? BETWEEN start_date AND end_date AND status = 'Approved'").get(today) as any)?.c || 0;
    const otToday = (db.prepare("SELECT COUNT(DISTINCT employee_id) as c FROM hr_overtimes WHERE date = ? AND status = 'Approved'").get(today) as any)?.c || 0;
    const missingCheckoutToday = (db.prepare("SELECT COUNT(DISTINCT employee_id) as c FROM hr_attendance WHERE date = ? AND (check_out IS NULL OR check_out = '')").get(today) as any)?.c || 0;
    
    const probationCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE contract_type LIKE '%Thử việc%' OR contract_type LIKE '%Probation%'").get() as any)?.c || 0;
    
    // Contracts expiring in next 30 days
    const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const expiringContracts = db.prepare("SELECT c.*, u.name as employee_name FROM hr_contracts c JOIN users u ON c.employee_id = CAST(u.id AS TEXT) WHERE c.end_date BETWEEN ? AND ? AND c.status = 'Active'").all(today, next30);
    
    // Birthdays this month
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const birthdayEmployees = db.prepare("SELECT id, name, dob, title, branch FROM users WHERE dob LIKE ? OR dob LIKE ?").all(`%/${currentMonth}/%`, `%- ${currentMonth}-%`);

    // Timekeeper Devices Status
    const timekeepers = [
      { id: "DEV-ZKT-01", name: "ZKTeco MB2000 - HCM HQ", type: "Fingerprint/Face", status: "Online", lastSync: "Vừa xong", ip: "192.168.1.201" },
      { id: "DEV-HIK-02", name: "Hikvision DS-K1T671M - Da Nang", type: "Face ID/QR", status: "Online", lastSync: "1 phút trước", ip: "192.168.2.105" },
      { id: "DEV-SUP-03", name: "Suprema BioStation - Ha Noi", type: "Fingerprint/NFC", status: "Online", lastSync: "3 phút trước", ip: "192.168.3.88" },
      { id: "DEV-RJ-04", name: "Ronald Jack FA210 - Hue Branch", type: "Face ID", status: "Offline", lastSync: "12 giờ trước", ip: "192.168.4.12" },
      { id: "DEV-ANV-05", name: "Anviz W2 Pro - Tam Ky", type: "NFC/GPS", status: "Online", lastSync: "Vừa xong", ip: "192.168.5.55" }
    ];

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentToday,
        lateToday,
        earlyLeaveToday,
        onLeaveToday,
        businessTripToday,
        otToday,
        missingCheckoutToday,
        probationCount,
        expiringContractsCount: expiringContracts.length,
        expiringContracts,
        birthdayEmployees,
        timekeepers,
        onlineDevices: timekeepers.filter(t => t.status === "Online").length,
        offlineDevices: timekeepers.filter(t => t.status === "Offline").length
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   2. EMPLOYEES MANAGEMENT
   ========================================================================== */
router.get("/employees", auth, (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let employees;
    let nextCursor: string | null = null;
    let hasNextPage = false;

    if (limit !== null) {
      const params: any = {};
      let query = `
        SELECT id, username, name, role, title, staff_code, branch, start_date, 
               contract_type, salary, bonus, avatar, phone, email, dob, gender, address, 
               manager_id, practice_areas
        FROM users 
        WHERE role != 'client'
      `;

      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.id) {
          query += ` AND id < :cursorId`;
          params.cursorId = cursor.id;
        }
      }

      query += ` ORDER BY id DESC LIMIT :limitPlusOne`;
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as any[];
      hasNextPage = rows.length > limit;
      employees = hasNextPage ? rows.slice(0, limit) : rows;

      if (hasNextPage && employees.length > 0) {
        nextCursor = encodeCursor({ id: employees[employees.length - 1].id });
      }
    } else {
      employees = db.prepare(`
        SELECT id, username, name, role, title, staff_code, branch, start_date, 
               contract_type, salary, bonus, avatar, phone, email, dob, gender, address, 
               manager_id, practice_areas
        FROM users 
        WHERE role != 'client'
        ORDER BY id DESC
      `).all();
    }

    // Enrich with employee code, department, QR, face/finger ID
    const enriched = employees.map((emp: any) => ({
      ...emp,
      branch: normalizeBranchName(emp.branch),
      employee_code: emp.staff_code || `NV-${1000 + emp.id}`,
      department_id: emp.practice_areas || "Khối Tố tụng & Dân sự",
      citizen_id: `0${30000000000 + emp.id}`,
      tax_code: `8${400000000 + emp.id}`,
      social_insurance: `79${10000000 + emp.id}`,
      fingerprint_id: `FP-${emp.id}`,
      face_id: `FACE-${emp.id}`,
      qr_code: `QR-LEGAL-${emp.id}`,
      erp_account: emp.username,
      status: "Active"
    }));

    if (limit !== null) {
      res.json({
        success: true,
        data: enriched,
        pagination: {
          limit,
          nextCursor,
          hasNextPage
        }
      });
    } else {
      res.json({ success: true, data: enriched });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/employees", auth, (req: any, res: any) => {
  try {
    const { username, name, role, title, branch, salary, phone, email, dob, gender, address, department } = req.body;
    const staff_code = req.body.staff_code || `NV-${Math.floor(1000 + Math.random() * 9000)}`;
    const start_date = req.body.start_date || new Date().toISOString().split("T")[0];
    const contract_type = req.body.contract_type || "HĐLĐ 12-36 tháng";

    const stmt = db.prepare(`
      INSERT INTO users (username, password, name, role, title, staff_code, branch, start_date, contract_type, salary, phone, email, dob, gender, address, practice_areas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(username || email.split("@")[0], "123456", name, role || "lawyer", title || "Luật sư", staff_code, branch || "Trụ sở chính", start_date, contract_type, salary || 20000000, phone, email, dob, gender, address, department);

    res.json({ success: true, id: info.lastInsertRowid, staff_code });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   3. DEPARTMENTS & POSITIONS
   ========================================================================== */
router.get("/departments", auth, (req: any, res: any) => {
  try {
    const depts = db.prepare("SELECT * FROM hr_departments").all();
    if (depts.length === 0) {
      // Seed default legal firm departments
      const seedDepts = [
        { id: "DEPT-01", department_name: "Ban Giám đốc & Điều hành", manager_id: "1", description: "Lãnh đạo & định hướng chiến lược", status: "Active" },
        { id: "DEPT-02", department_name: "Phòng Tố tụng & Dân sự", manager_id: "2", description: "Tranh tụng tòa án, đại diện pháp lý", status: "Active" },
        { id: "DEPT-03", department_name: "Phòng Doanh nghiệp & Đầu tư", manager_id: "3", description: "Tư vấn hợp đồng, M&A, Giấy phép", status: "Active" },
        { id: "DEPT-04", department_name: "Phòng Hành chính - Nhân sự", manager_id: "4", description: "Tuyển dụng, chấm công, tính lương, ISO", status: "Active" },
        { id: "DEPT-05", department_name: "Phòng Kế toán & Tài chính", manager_id: "5", description: "Thu chi, hóa đơn, thuế, báo cáo tài chính", status: "Active" },
        { id: "DEPT-06", department_name: "Phòng Marketing & Truyền thông", manager_id: "6", description: "Nhận diện thương hiệu, khách hàng mới", status: "Active" },
        { id: "DEPT-07", department_name: "Trung tâm Khách hàng & Call Center", manager_id: "7", description: "Tổng đài tư vấn 24/7 & CSKH", status: "Active" }
      ];
      for (const d of seedDepts) {
        db.prepare("INSERT OR REPLACE INTO hr_departments (id, department_name, manager_id, description, status) VALUES (?, ?, ?, ?, ?)").run(d.id, d.department_name, d.manager_id, d.description, d.status);
      }
      return res.json({ success: true, data: seedDepts });
    }
    res.json({ success: true, data: depts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/departments", auth, (req: any, res: any) => {
  try {
    const { department_name, manager_id, description } = req.body;
    const id = `DEPT-${Date.now()}`;
    db.prepare("INSERT INTO hr_departments (id, department_name, manager_id, description) VALUES (?, ?, ?, ?)").run(id, department_name, manager_id || "", description || "");
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/positions", auth, (req: any, res: any) => {
  try {
    const positions = db.prepare("SELECT * FROM hr_positions").all();
    if (positions.length === 0) {
      const seedPositions = [
        { id: "POS-01", position_name: "Giám đốc / Luật sư Điều hành", level: 5, salary_grade: "L5-S1", permission_group: "Director" },
        { id: "POS-02", position_name: "Trưởng phòng / Luật sư Thành viên", level: 4, salary_grade: "L4-S2", permission_group: "Manager" },
        { id: "POS-03", position_name: "Luật sư Chính / Senior Counsel", level: 3, salary_grade: "L3-S1", permission_group: "Lawyer" },
        { id: "POS-04", position_name: "Chuyên viên Pháp lý / Associate", level: 2, salary_grade: "L2-S3", permission_group: "Staff" },
        { id: "POS-05", position_name: "Thực tập sinh / Legal Intern", level: 1, salary_grade: "L1-S1", permission_group: "Intern" }
      ];
      for (const p of seedPositions) {
        db.prepare("INSERT OR REPLACE INTO hr_positions (id, position_name, level, salary_grade, permission_group) VALUES (?, ?, ?, ?, ?)").run(p.id, p.position_name, p.level, p.salary_grade, p.permission_group);
      }
      return res.json({ success: true, data: seedPositions });
    }
    res.json({ success: true, data: positions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   4. SHIFTS MANAGEMENT
   ========================================================================== */
router.get("/shifts", auth, (req: any, res: any) => {
  try {
    const shifts = db.prepare("SELECT * FROM hr_shifts").all();
    if (shifts.length === 0) {
      const seedShifts = [
        { id: "SHIFT-01", shift_name: "Ca sáng Hành chính", start_time: "07:30", end_time: "11:30", break_time: "11:30-13:00", late_allowance: 15, early_allowance: 15, working_days: "Mon-Sat" },
        { id: "SHIFT-02", shift_name: "Ca chiều Hành chính", start_time: "13:00", end_time: "17:00", break_time: "12:00-13:00", late_allowance: 15, early_allowance: 15, working_days: "Mon-Sat" },
        { id: "SHIFT-03", shift_name: "Ca tối / Trực ban Tòa án", start_time: "17:00", end_time: "22:00", break_time: "19:00-19:30", late_allowance: 10, early_allowance: 10, working_days: "Mon-Fri" },
        { id: "SHIFT-04", shift_name: "Ca linh hoạt (Flexible)", start_time: "08:30", end_time: "17:30", break_time: "12:00-13:00", late_allowance: 30, early_allowance: 30, working_days: "Mon-Fri" },
        { id: "SHIFT-05", shift_name: "Ca Online / Tư vấn từ xa", start_time: "08:00", end_time: "20:00", break_time: "Linh hoạt", late_allowance: 30, early_allowance: 30, working_days: "All" }
      ];
      for (const s of seedShifts) {
        db.prepare("INSERT OR REPLACE INTO hr_shifts (id, shift_name, start_time, end_time, break_time, late_allowance, early_allowance, working_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(s.id, s.shift_name, s.start_time, s.end_time, s.break_time, s.late_allowance, s.early_allowance, s.working_days);
      }
      return res.json({ success: true, data: seedShifts });
    }
    res.json({ success: true, data: shifts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   5. ATTENDANCE & TIMEKEEPING (Fingerprint, Face, QR, NFC, GPS, Mobile, AI)
   ========================================================================== */
router.get("/attendance", auth, (req: any, res: any) => {
  try {
    const { date, month, year, employee_id } = req.query;
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT a.*, u.name as employee_name, u.staff_code FROM hr_attendance a JOIN users u ON a.employee_id = CAST(u.id AS TEXT) WHERE 1=1";
    const params: any = {};

    if (date) {
      query += " AND a.date = :date";
      params.date = date;
    }
    if (month && year) {
      query += " AND a.date LIKE :monthPattern";
      params.monthPattern = `${year}-${String(month).padStart(2, '0')}%`;
    }
    if (employee_id) {
      query += " AND a.employee_id = :employee_id";
      params.employee_id = String(employee_id);
    }

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.date && cursor.id) {
          query += " AND (a.date < :cursorDate OR (a.date = :cursorDate AND a.id < :cursorId))";
          params.cursorDate = cursor.date;
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY a.date DESC, a.id DESC LIMIT :limitPlusOne";
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as any[];
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        const lastRow = returnedRows[returnedRows.length - 1];
        nextCursor = encodeCursor({ date: lastRow.date, id: lastRow.id });
      }

      res.json({
        success: true,
        data: returnedRows,
        pagination: {
          limit,
          nextCursor,
          hasNextPage
        }
      });
    } else {
      query += " ORDER BY a.date DESC, a.check_in ASC";
      const rows = db.prepare(query).all(params);
      res.json({ success: true, data: rows });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/attendance/check-in-out", auth, (req: any, res: any) => {
  try {
    const { employee_id, date, time, method, gps, ip, device_id, photo, type } = req.body;
    const today = date || new Date().toISOString().split("T")[0];
    const nowTime = time || new Date().toTimeString().split(" ")[0].substring(0, 5);

    const empIdStr = String(employee_id || req.session.user?.id);
    const existing = db.prepare("SELECT * FROM hr_attendance WHERE employee_id = ? AND date = ?").get(empIdStr, today) as any;

    // AI Anomaly detection logic
    let aiWarning = "";
    if (method === "GPS" && gps) {
      const [lat, lng] = String(gps).split(",").map(Number);
      // Office coordinates check (mock HQ 10.776, 106.700)
      if (lat && lng && (Math.abs(lat - 10.776) > 0.05 || Math.abs(lng - 106.700) > 0.05)) {
        aiWarning = "Cảnh báo GPS: Vị trí chấm công xa trụ sở chính quá 5km!";
      }
    }

    if (!existing) {
      const lateMins = nowTime > "08:00" ? Math.round((new Date(`1970-01-01T${nowTime}:00`).getTime() - new Date("1970-01-01T08:00:00").getTime()) / 60000) : 0;
      const id = `ATT-${Date.now()}`;
      db.prepare(`
        INSERT INTO hr_attendance (id, employee_id, date, check_in, working_hours, late_minutes, device_id, attendance_method, gps, ip, photo, status, ai_warning)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, empIdStr, today, nowTime, 0, Math.max(0, lateMins), device_id || "MOBILE-APP", method || "Mobile App", gps || "", ip || req.ip, photo || "", "Present", aiWarning);

      res.json({ success: true, action: "CHECK_IN", time: nowTime, late_minutes: Math.max(0, lateMins), aiWarning });
    } else {
      // Calculate working hours
      let workingHours = 8;
      if (existing.check_in) {
        const inMs = new Date(`1970-01-01T${existing.check_in}:00`).getTime();
        const outMs = new Date(`1970-01-01T${nowTime}:00`).getTime();
        workingHours = Math.max(0, Math.round(((outMs - inMs) / 3600000) * 10) / 10);
      }
      const earlyLeave = nowTime < "17:00" ? Math.round((new Date("1970-01-01T17:00:00").getTime() - new Date(`1970-01-01T${nowTime}:00`).getTime()) / 60000) : 0;

      db.prepare(`
        UPDATE hr_attendance 
        SET check_out = ?, working_hours = ?, early_leave = ?, ai_warning = COALESCE(ai_warning, '') || ?
        WHERE id = ?
      `).run(nowTime, workingHours, Math.max(0, earlyLeave), aiWarning ? ` | ${aiWarning}` : "", existing.id);

      res.json({ success: true, action: "CHECK_OUT", time: nowTime, working_hours: workingHours, early_leave: Math.max(0, earlyLeave) });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   6. LEAVE REQUESTS & WORKFLOWS
   ========================================================================== */
router.get("/leave", auth, (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = `
      SELECT l.*, u.name as employee_name, u.staff_code, u.title 
      FROM hr_leave_requests l 
      JOIN users u ON l.employee_id = CAST(u.id AS TEXT)
    `;
    const params: any = {};

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.startDate && cursor.id) {
          query += " WHERE l.start_date < :cursorStartDate OR (l.start_date = :cursorStartDate AND l.id < :cursorId)";
          params.cursorStartDate = cursor.startDate;
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY l.start_date DESC, l.id DESC LIMIT :limitPlusOne";
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as any[];
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        const lastRow = returnedRows[returnedRows.length - 1];
        nextCursor = encodeCursor({ startDate: lastRow.start_date, id: lastRow.id });
      }

      res.json({
        success: true,
        data: returnedRows,
        pagination: {
          limit,
          nextCursor,
          hasNextPage
        }
      });
    } else {
      query += " ORDER BY l.start_date DESC, l.id DESC";
      const leaves = db.prepare(query).all(params);
      res.json({ success: true, data: leaves });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/leave", auth, (req: any, res: any) => {
  try {
    const { leave_type, start_date, end_date, reason, attachment } = req.body;
    const empId = String(req.session.user?.id || 1);
    const id = `LEAVE-${Date.now()}`;

    db.prepare(`
      INSERT INTO hr_leave_requests (id, employee_id, leave_type, start_date, end_date, reason, attachment, status, workflow_step)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, empId, leave_type || "Nghỉ phép năm", start_date, end_date, reason || "", attachment || "", "Pending", 1);

    res.json({ success: true, id, message: "Đã gửi đơn xin nghỉ phép đến Trưởng phòng duyệt!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/leave/:id/approve", auth, (req: any, res: any) => {
  try {
    const { status, approved_by } = req.body;
    db.prepare("UPDATE hr_leave_requests SET status = ?, approved_by = ? WHERE id = ?").run(status || "Approved", approved_by || req.session.user?.name, req.params.id);
    res.json({ success: true, message: `Đơn nghỉ phép đã được ${status === 'Approved' ? 'Phê duyệt' : 'Từ chối'}!` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   7. BUSINESS TRIPS & OVERTIME
   ========================================================================== */
router.get("/business-trip", auth, (req: any, res: any) => {
  try {
    const trips = db.prepare("SELECT t.*, u.name as employee_name FROM hr_business_trips t JOIN users u ON t.employee_id = CAST(u.id AS TEXT) ORDER BY t.start_date DESC").all();
    res.json({ success: true, data: trips });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/business-trip", auth, (req: any, res: any) => {
  try {
    const { destination, start_date, end_date, budget, task_description } = req.body;
    const empId = String(req.session.user?.id || 1);
    const id = `TRIP-${Date.now()}`;
    db.prepare("INSERT INTO hr_business_trips (id, employee_id, destination, start_date, end_date, budget, task_description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, empId, destination, start_date, end_date, budget || 0, task_description || "", "Approved");
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/overtime", auth, (req: any, res: any) => {
  try {
    const ots = db.prepare("SELECT o.*, u.name as employee_name FROM hr_overtimes o JOIN users u ON o.employee_id = CAST(u.id AS TEXT) ORDER BY o.date DESC").all();
    res.json({ success: true, data: ots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/overtime", auth, (req: any, res: any) => {
  try {
    const { date, ot_hours, multiplier, reason } = req.body;
    const empId = String(req.session.user?.id || 1);
    const id = `OT-${Date.now()}`;
    db.prepare("INSERT INTO hr_overtimes (id, employee_id, date, ot_hours, multiplier, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, empId, date || new Date().toISOString().split("T")[0], ot_hours || 2, multiplier || 1.5, reason || "Hồ sơ gấp", "Approved");
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   8. PAYROLL, INSURANCE & TAXES
   ========================================================================== */
router.get("/payroll", auth, (req: any, res: any) => {
  try {
    const { month, year } = req.query;
    const m = Number(month || 7);
    const y = Number(year || 2026);

    const rows = db.prepare(`
      SELECT p.*, u.name as employee_name, u.staff_code, u.title, u.branch
      FROM hr_payrolls p
      JOIN users u ON p.employee_id = CAST(u.id AS TEXT)
      WHERE p.month = ? AND p.year = ?
      ORDER BY u.id ASC
    `).all(m, y);

    if (rows.length === 0) {
      // Generate default payrolls from users table for this month
      const users = db.prepare("SELECT * FROM users WHERE role != 'client'").all() as any[];
      const generated = users.map((u: any) => {
        const base = u.salary ? Number(String(u.salary).replace(/[^0-9]/g, '')) || 20000000 : 20000000;
        const allowance = 1500000; // Food + Gas
        const bonus = Number(u.bonus) || 2000000;
        const ot_salary = 1200000;
        const insurance = Math.round(base * 0.105); // 10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%)
        const taxable = Math.max(0, base + bonus + ot_salary - insurance - 11000000);
        const tax = Math.round(taxable * 0.1);
        const net = base + allowance + bonus + ot_salary - insurance - tax;

        const id = `PAY-${u.id}-${m}-${y}`;
        db.prepare(`
          INSERT OR REPLACE INTO hr_payrolls (id, employee_id, month, year, base_salary, allowance, bonus, ot_salary, insurance, tax, net_salary, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, String(u.id), m, y, base, allowance, bonus, ot_salary, insurance, tax, net, "Approved");

        return {
          id,
          employee_id: String(u.id),
          employee_name: u.name,
          staff_code: u.staff_code || `NV-${u.id}`,
          title: u.title,
          branch: u.branch,
          month: m,
          year: y,
          base_salary: base,
          allowance,
          bonus,
          ot_salary,
          insurance,
          tax,
          net_salary: net,
          status: "Approved"
        };
      });

      return res.json({ success: true, data: generated });
    }

    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import payroll list from Excel
router.post("/payroll/import", auth, async (req: any, res: any) => {
  try {
    const { payrolls, month, year } = req.body;
    const m = Number(month || 7);
    const y = Number(year || 2026);

    if (!Array.isArray(payrolls)) {
      return res.status(400).json({ success: false, error: "Invalid payrolls data format" });
    }

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO hr_payrolls (id, employee_id, month, year, base_salary, allowance, insurance, tax, net_salary, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const p of payrolls) {
        const id = p.id || `PAY-${p.employee_id}-${m}-${y}`;
        insertStmt.run(
          id,
          String(p.employee_id),
          m,
          y,
          Number(p.base_salary) || 0,
          Number(p.allowance) || 0,
          Number(p.insurance) || 0,
          Number(p.tax) || 0,
          Number(p.net_salary) || 0,
          p.status || "Approved"
        );
      }
    })();

    // Retrieve updated list
    const rows = db.prepare(`
      SELECT p.*, u.name as employee_name, u.staff_code, u.title, u.branch
      FROM hr_payrolls p
      JOIN users u ON p.employee_id = CAST(u.id AS TEXT)
      WHERE p.month = ? AND p.year = ?
      ORDER BY u.id ASC
    `).all(m, y);

    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error("Payroll import error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   9. LAWYER & CONSULTANT KPI & PERFORMANCE (360 Degree Evaluation)
   ========================================================================== */
router.get("/kpi", auth, (req: any, res: any) => {
  try {
    const { month, year } = req.query;
    const m = Number(month || 7);
    const y = Number(year || 2026);

    const kpis = db.prepare(`
      SELECT p.*, u.name as employee_name, u.title, u.role
      FROM hr_performances p
      JOIN users u ON p.employee_id = CAST(u.id AS TEXT)
      WHERE p.month = ? AND p.year = ?
    `).all(m, y);

    if (kpis.length === 0) {
      const users = db.prepare("SELECT * FROM users WHERE role != 'client'").all() as any[];
      const seeded = users.map((u: any) => {
        const id = `PERF-${u.id}-${m}-${y}`;
        const isLawyer = String(u.role).includes("lawyer") || String(u.title).includes("Luật sư");
        const billable = isLawyer ? 120 + Math.floor(Math.random() * 40) : 0;
        const court = isLawyer ? 30 + Math.floor(Math.random() * 20) : 0;
        const meetings = 25 + Math.floor(Math.random() * 15);

        const kpi_score = 85 + Math.floor(Math.random() * 12);
        const ai_score = 90 + Math.floor(Math.random() * 8);
        const manager_score = 88 + Math.floor(Math.random() * 10);
        const total = Math.round((kpi_score + ai_score + manager_score) / 3);
        const rank = total >= 92 ? "A+" : total >= 85 ? "A" : "B";

        db.prepare(`
          INSERT OR REPLACE INTO hr_performances (id, employee_id, month, year, kpi_score, ai_score, manager_score, total_score, rank, billable_hours, non_billable_hours, court_time, client_meetings)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, String(u.id), m, y, kpi_score, ai_score, manager_score, total, rank, billable, 30, court, meetings);

        return {
          id,
          employee_id: String(u.id),
          employee_name: u.name,
          title: u.title,
          role: u.role,
          month: m,
          year: y,
          kpi_score,
          ai_score,
          manager_score,
          total_score: total,
          rank,
          billable_hours: billable,
          court_time: court,
          client_meetings: meetings
        };
      });
      return res.json({ success: true, data: seeded });
    }

    res.json({ success: true, data: kpis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import KPI / Evaluation from Excel
router.post("/kpi/import", auth, async (req: any, res: any) => {
  try {
    const { kpis, month, year } = req.body;
    const m = Number(month || 7);
    const y = Number(year || 2026);

    if (!Array.isArray(kpis)) {
      return res.status(400).json({ success: false, error: "Invalid KPIs data format" });
    }

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO hr_performances (id, employee_id, month, year, kpi_score, ai_score, manager_score, total_score, rank, billable_hours, non_billable_hours, court_time, client_meetings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const k of kpis) {
        const id = k.id || `PERF-${k.employee_id}-${m}-${y}`;
        insertStmt.run(
          id,
          String(k.employee_id),
          m,
          y,
          Number(k.kpi_score) || 0,
          Number(k.ai_score) || 0,
          Number(k.manager_score) || 0,
          Number(k.total_score) || 0,
          k.rank || "B",
          Number(k.billable_hours) || 0,
          30, // Default non-billable hours
          Number(k.court_time) || 0,
          Number(k.client_meetings) || 0
        );
      }
    })();

    // Retrieve updated KPI list
    const updatedKpis = db.prepare(`
      SELECT p.*, u.name as employee_name, u.title, u.role
      FROM hr_performances p
      JOIN users u ON p.employee_id = CAST(u.id AS TEXT)
      WHERE p.month = ? AND p.year = ?
    `).all(m, y);

    res.json({ success: true, data: updatedKpis });
  } catch (err: any) {
    console.error("KPI import error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   10. CONTRACTS, EQUIPMENT, TRAINING, RECRUITMENT
   ========================================================================== */
router.get("/contracts", auth, (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    const existCheck = db.prepare("SELECT COUNT(*) as count FROM hr_contracts").get() as { count: number };
    if (existCheck.count === 0) {
      const users = db.prepare("SELECT * FROM users WHERE role != 'client' LIMIT 5").all() as any[];
      users.forEach((u: any) => {
        const id = `CTR-${u.id}`;
        db.prepare(`
          INSERT OR REPLACE INTO hr_contracts (id, employee_id, contract_code, contract_type, start_date, end_date, status, digital_signature)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, String(u.id), `HDLD-2026-${u.id}`, "HĐLĐ Xác định thời hạn (36 tháng)", "2024-01-01", "2027-01-01", "Active", "VERIFIED_CA_DIGITAL_KEY");
      });
    }

    let query = "SELECT c.*, u.name as employee_name FROM hr_contracts c JOIN users u ON c.employee_id = CAST(u.id AS TEXT)";
    const params: any = {};

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.id) {
          query += " WHERE c.id < :cursorId";
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY c.id DESC LIMIT :limitPlusOne";
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as any[];
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        nextCursor = encodeCursor({ id: returnedRows[returnedRows.length - 1].id });
      }

      res.json({
        success: true,
        data: returnedRows,
        pagination: {
          limit,
          nextCursor,
          hasNextPage
        }
      });
    } else {
      query += " ORDER BY c.id DESC";
      const contracts = db.prepare(query).all(params);
      res.json({ success: true, data: contracts });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/equipment", auth, (req: any, res: any) => {
  try {
    const eq = db.prepare("SELECT e.*, u.name as employee_name FROM hr_equipment e JOIN users u ON e.employee_id = CAST(u.id AS TEXT)").all();
    res.json({ success: true, data: eq });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/training", auth, (req: any, res: any) => {
  try {
    const tr = db.prepare("SELECT t.*, u.name as employee_name FROM hr_training t JOIN users u ON t.employee_id = CAST(u.id AS TEXT)").all();
    res.json({ success: true, data: tr });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/recruitment", auth, (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT * FROM hr_recruitment";
    const params: any = {};

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.interviewDate && cursor.id) {
          query += " WHERE interview_date < :cursorInterviewDate OR (interview_date = :cursorInterviewDate AND id < :cursorId)";
          params.cursorInterviewDate = cursor.interviewDate;
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY interview_date DESC, id DESC LIMIT :limitPlusOne";
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as any[];
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        const lastRow = returnedRows[returnedRows.length - 1];
        nextCursor = encodeCursor({ interviewDate: lastRow.interview_date, id: lastRow.id });
      }

      res.json({
        success: true,
        data: returnedRows,
        pagination: {
          limit,
          nextCursor,
          hasNextPage
        }
      });
    } else {
      query += " ORDER BY interview_date DESC, id DESC";
      const rec = db.prepare(query).all(params);
      res.json({ success: true, data: rec });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   11. AI HR ASSISTANT & CHATBOT
   ========================================================================== */
router.post("/ai-assistant", auth, async (req: any, res: any) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, error: "Trống câu hỏi AI" });

    const q = question.toLowerCase();

    // Natural Language Queries handling
    if (q.includes("chưa chấm công") || q.includes("quên check")) {
      const today = new Date().toISOString().split("T")[0];
      const uncheck = db.prepare(`
        SELECT u.name, u.staff_code, u.title, u.branch 
        FROM users u 
        WHERE u.role != 'client' AND u.id NOT IN (SELECT employee_id FROM hr_attendance WHERE date = ?)
      `).all(today);

      return res.json({
        success: true,
        answer: `Hôm nay (${today}) có ${uncheck.length} nhân sự chưa chấm công:`,
        data: uncheck
      });
    }

    if (q.includes("đi trễ") || q.includes("muộn")) {
      const lateStaff = db.prepare(`
        SELECT u.name, u.staff_code, COUNT(a.id) as late_count, SUM(a.late_minutes) as total_late_minutes
        FROM hr_attendance a
        JOIN users u ON a.employee_id = CAST(u.id AS TEXT)
        WHERE a.late_minutes > 0
        GROUP BY a.employee_id
        HAVING late_count >= 1
        ORDER BY late_count DESC
      `).all();

      return res.json({
        success: true,
        answer: `Thống kê danh sách nhân sự có lịch sử đi trễ trong tháng:`,
        data: lateStaff
      });
    }

    if (q.includes("hết hạn hợp đồng") || q.includes("sắp hết hợp đồng")) {
      const contracts = db.prepare(`
        SELECT c.*, u.name as employee_name, u.title 
        FROM hr_contracts c 
        JOIN users u ON c.employee_id = CAST(u.id AS TEXT)
        WHERE c.status = 'Active'
      `).all();

      return res.json({
        success: true,
        answer: `Danh sách các hợp đồng nhân sự đang trong thời hạn theo dõi:`,
        data: contracts
      });
    }

    // Default Gemini AI response
    const ai = getAiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Bạn là trợ lý AI HR Trí tuệ nhân tạo của Legal OS (Hãng luật Ánh Dương). Hãy trả lời chuyên nghiệp, chính xác về tư vấn quy định nội quy, tính lương, KPI, phép năm, đánh giá hiệu suất nhân sự cho câu hỏi sau: "${question}"`
      });
      return res.json({ success: true, answer: response.text });
    }

    res.json({
      success: true,
      answer: `Hệ thống AI HR Assistant đã ghi nhận câu hỏi: "${question}". Theo quy định Luật Lao động 2019 và Nội quy Hãng luật Ánh Dương: Thời giờ làm việc tiêu chuẩn là 8 giờ/ngày (44 giờ/tuần). Mọi đăng ký phép năm, nghỉ bù hoặc tăng ca OT cần nộp trước 24h trên portal ESS.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   12. ORG CHART & WORKFLOW ENGINE
   ========================================================================== */
router.get("/org-chart", auth, (req: any, res: any) => {
  try {
    const chart = {
      name: "Trần Ánh Dương",
      title: "Luật sư Điều hành / CEO",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
      children: [
        {
          name: "Nguyễn Văn Hùng",
          title: "Trưởng phòng Tố tụng",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
          children: [
            { name: "Lê Minh Tuấn", title: "Luật sư Tranh tụng Senior", avatar: "" },
            { name: "Phạm Thảo Nhi", title: "Chuyên viên Pháp lý", avatar: "" }
          ]
        },
        {
          name: "Lê Thị Mai",
          title: "Trưởng phòng Tư vấn Doanh nghiệp",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
          children: [
            { name: "Hoàng Đức Anh", title: "Luật sư M&A", avatar: "" }
          ]
        },
        {
          name: "Trần Bảo Ngọc",
          title: "Trưởng phòng Hành chính Nhân sự",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          children: [
            { name: "Vũ Hải Đăng", title: "Chuyên viên C&B & Chấm công", avatar: "" }
          ]
        }
      ]
    };
    res.json({ success: true, data: chart });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
