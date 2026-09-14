import { Router } from "express";
import { auth, requirePermission } from "../../middleware/auth";
import db from "../../db/database";
import { mapRoleToDb } from "../../utils/role";
import { enrichUsersWithStaffCode } from "../../utils/staffCode";
import { normalizeBranchName } from "../../utils/branch";

const router = Router();
const canManageFinance = requirePermission("manageFinance");

// Real-time synchronization middleware for payroll
router.use((req: any, res: any, next: any) => {
  const originalJson = res.json;
  res.json = function (data: any) {
    if (data && data.success && (req.method === "POST" || req.method === "PUT" || req.method === "DELETE")) {
      try {
        const io = req.app.get("io");
        if (io) {
          io.emit("payroll_updated");
          io.emit("finance_updated");
        }
      } catch (e) {}
    }
    return originalJson.call(this, data);
  };
  next();
});

router.post("/monthly-payrolls", canManageFinance, (req: any, res: any) => {
  const { user_id, month, year, staff_code, title, branch, working_days, dependents, gross, insurance, tax, food_allowance, gas_allowance, phone_allowance, other_benefits, violations, total_salary } = req.body;
  const userProfile = db.prepare(`SELECT branch FROM users WHERE id = ?`).get(user_id) as any;
  const canonicalBranch = normalizeBranchName(userProfile?.branch || branch);
  
  // Always synchronize bonus from evaluations table (only for personnel/individual rewards)
  const sumBonus = (db.prepare(`SELECT SUM(bonus_amount) as s FROM evaluations WHERE user_id=? AND month=? AND year=? AND target_type='personnel'`).get(user_id, month, year) as any)?.s || 0;
  
  // Recalculate net salary to ensure it's correct
  const net = (total_salary || 0) + (other_benefits || 0) + sumBonus - (violations || 0) - (insurance || 0) - (tax || 0);

  const existing = db.prepare(`SELECT id FROM monthly_payrolls WHERE user_id=? AND month=? AND year=?`).get(user_id, month, year);
  if (existing) {
    db.prepare(`UPDATE monthly_payrolls SET staff_code=?, title=?, branch=?, working_days=?, dependents=?, gross=?, insurance=?, tax=?, net=?, food_allowance=?, gas_allowance=?, phone_allowance=?, other_benefits=?, bonus=?, violations=?, total_salary=? WHERE id=?`).run(
      staff_code, title, branch, working_days, dependents, gross, insurance, tax, net, food_allowance, gas_allowance, phone_allowance, other_benefits, sumBonus, violations, total_salary, (existing as any).id
    );
  } else {
    db.prepare(`INSERT INTO monthly_payrolls (user_id, month, year, staff_code, title, branch, working_days, dependents, gross, insurance, tax, net, food_allowance, gas_allowance, phone_allowance, other_benefits, bonus, violations, total_salary) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      user_id, month, year, staff_code, title, branch, working_days, dependents, gross, insurance, tax, net, food_allowance, gas_allowance, phone_allowance, other_benefits, sumBonus, violations, total_salary
    );
  }
  res.json({ success: true });
});

const parseSalaryNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[^0-9]/g, '');
  return Number(str) || 0;
};

const calculatePayrollTaxes = (gross: number, dependents: number) => {
  const baseSalary = 2340000;
  const regionMinWage = 4960000;
  const bhxh_bhyt_cap = baseSalary * 20;
  const bhtn_cap = regionMinWage * 20;

  const bhxh_bhyt =
      Math.min(gross, bhxh_bhyt_cap) * 0.08 +
      Math.min(gross, bhxh_bhyt_cap) * 0.015; // 8% BHXH + 1.5% BHYT
  const bhtn = Math.min(gross, bhtn_cap) * 0.01; // 1% BHTN
  const insurance = Math.round(bhxh_bhyt + bhtn);

  const personalDeduction = 15500000;
  const dependentDeduction = 6200000 * dependents;

  const taxableIncome =
      gross - insurance - personalDeduction - dependentDeduction;
  let tax = 0;

  if (taxableIncome > 0) {
    if (taxableIncome <= 10000000) {
      tax = taxableIncome * 0.05;
    } else if (taxableIncome <= 30000000) {
      tax = taxableIncome * 0.1 - 500000;
    } else if (taxableIncome <= 50000000) {
      tax = taxableIncome * 0.2 - 3500000;
    } else if (taxableIncome <= 80000000) {
      tax = taxableIncome * 0.28 - 7500000;
    } else {
      tax = taxableIncome * 0.35 - 13100000;
    }
  }

  return { insurance, tax: Math.round(tax) };
};

router.get("/monthly-payrolls", auth, (req: any, res: any) => {
  const { month, year } = req.query;
  const user = req.session.user;
  
  const mappedRole = mapRoleToDb(user.role);
  const p = db.prepare(`SELECT manageFinance FROM role_permissions WHERE role=?`).get(mappedRole) as any;
  const hasAccess = p?.manageFinance || mappedRole === 'admin' || mappedRole === 'director';

  let dbPayrolls: any[];
  if (hasAccess) {
    dbPayrolls = db.prepare(`
      SELECT p.*, u.name as user_name,
             COALESCE((SELECT SUM(bonus_amount) FROM evaluations e WHERE e.user_id = p.user_id AND e.month = p.month AND e.year = p.year AND e.target_type = 'personnel'), 0) as synced_bonus
      FROM monthly_payrolls p 
      JOIN users u ON p.user_id = u.id
      WHERE p.month = ? AND p.year = ?
    `).all(month, year);
  } else {
    dbPayrolls = db.prepare(`
      SELECT p.*, u.name as user_name,
             COALESCE((SELECT SUM(bonus_amount) FROM evaluations e WHERE e.user_id = p.user_id AND e.month = p.month AND e.year = p.year AND e.target_type = 'personnel'), 0) as synced_bonus
      FROM monthly_payrolls p 
      JOIN users u ON p.user_id = u.id
      WHERE p.month = ? AND p.year = ? AND p.user_id = ?
    `).all(month, year, user.id);
  }
  
  // Fetch all users to obtain latest profiles & computed staff codes
  const allUsers = db.prepare(`SELECT id, name, role, title, branch, salary FROM users`).all();
  const enrichedUsers = enrichUsersWithStaffCode(allUsers);

  const targetUsers = enrichedUsers.filter(u => {
    if (u.role === "client") return false;
    if (hasAccess) return true;
    return u.id === user.id;
  });

  const results: any[] = [];
  
  for (const u of targetUsers) {
    const existing = dbPayrolls.find(p => p.user_id === u.id);
    const sumBonus = (db.prepare(`SELECT SUM(bonus_amount) as s FROM evaluations WHERE user_id=? AND month=? AND year=? AND target_type='personnel'`).get(u.id, month, year) as any)?.s || 0;
    
    if (existing) {
      existing.staff_code = u.staff_code;
      existing.title = u.title || u.role;
      existing.branch = u.branch || "";
      existing.user_name = u.name;
      
      const latestGross = parseSalaryNumber(u.salary) || existing.gross || 0;
      if (existing.gross !== latestGross) {
        existing.gross = latestGross;
      }
      
      existing.total_salary = (existing.gross || 0) + (existing.food_allowance || 0) + (existing.gas_allowance || 0) + (existing.phone_allowance || 0);
      existing.bonus = sumBonus;
      
      // Re-calculate taxes and net
      const calcs = calculatePayrollTaxes(existing.gross, existing.dependents || 0);
      existing.insurance = calcs.insurance;
      existing.tax = calcs.tax;
      existing.net = existing.total_salary + (existing.other_benefits || 0) + existing.bonus - (existing.violations || 0) - (existing.insurance || 0) - (existing.tax || 0);
      
      // Update DB to ensure persistence of the synchronized details
      db.prepare(`UPDATE monthly_payrolls SET staff_code=?, title=?, branch=?, gross=?, insurance=?, tax=?, total_salary=?, bonus=?, net=? WHERE id=?`).run(
        existing.staff_code, existing.title, existing.branch, existing.gross, existing.insurance, existing.tax, existing.total_salary, existing.bonus, existing.net, existing.id
      );
      
      results.push(existing);
    } else {
      const grossVal = parseSalaryNumber(u.salary) || 0;
      const calcs = calculatePayrollTaxes(grossVal, 0);
      const totalSalary = grossVal;
      const netVal = totalSalary + sumBonus - calcs.insurance - calcs.tax;
      
      const defaultP = {
        id: -u.id,
        user_id: u.id,
        month: Number(month),
        year: Number(year),
        staff_code: u.staff_code,
        title: u.title || u.role,
        branch: u.branch || "",
        working_days: 26,
        dependents: 0,
        gross: grossVal,
        insurance: calcs.insurance,
        tax: calcs.tax,
        net: netVal,
        food_allowance: 0,
        gas_allowance: 0,
        phone_allowance: 0,
        other_benefits: 0,
        bonus: sumBonus,
        violations: 0,
        total_salary: totalSalary,
        user_name: u.name,
        synced_bonus: sumBonus
      };
      
      results.push(defaultP);
    }
  }

  // Sort by staff_code suffix ascending
  results.sort((a, b) => {
    const numA = Number((a.staff_code || "").match(/\d+$/)?.[0] || 999);
    const numB = Number((b.staff_code || "").match(/\d+$/)?.[0] || 999);
    return numA - numB;
  });

  res.json(results);
});

router.delete("/monthly-payrolls/:id", canManageFinance, (req: any, res: any) => {
  db.prepare(`DELETE FROM monthly_payrolls WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});

router.post("/evaluations", canManageFinance, (req: any, res: any) => {
  const { id, user_id, month, year, rating, bonus_amount, notes, target_type, target_name } = req.body;
  
  const tType = target_type || "personnel";
  const tName = target_name || null;
  const uId = tType === "personnel" ? user_id : null;

  if (id) {
    db.prepare(`UPDATE evaluations SET user_id=?, target_type=?, target_name=?, rating=?, bonus_amount=?, notes=? WHERE id=?`).run(
      uId, tType, tName, rating, bonus_amount, notes, id
    );
  } else {
    db.prepare(`INSERT INTO evaluations (user_id, month, year, rating, bonus_amount, notes, target_type, target_name) VALUES (?,?,?,?,?,?,?,?)`).run(
      uId, month, year, rating, bonus_amount, notes, tType, tName
    );
  }

  // Auto-sync bonus to monthly_payrolls if it's an individual/personnel reward
  if (tType === "personnel" && uId) {
    const payroll = db.prepare(`SELECT * FROM monthly_payrolls WHERE user_id=? AND month=? AND year=?`).get(uId, month, year) as any;
    const sumBonus = (db.prepare(`SELECT SUM(bonus_amount) as s FROM evaluations WHERE user_id=? AND month=? AND year=? AND target_type='personnel'`).get(uId, month, year) as any)?.s || 0;
    
    if (payroll) {
      const net = (payroll.total_salary || 0) + (payroll.other_benefits || 0) + sumBonus - (payroll.violations || 0) - (payroll.insurance || 0) - (payroll.tax || 0);
      db.prepare(`UPDATE monthly_payrolls SET bonus=?, net=? WHERE id=?`).run(sumBonus, net, payroll.id);
    } else {
      // Determine defaults for new payroll based on User info
      const user = db.prepare(`SELECT * FROM users WHERE id=?`).get(uId) as any;
      if (user) {
        const gross = 0;
        const net = sumBonus;
        db.prepare(`INSERT INTO monthly_payrolls (user_id, month, year, staff_code, title, branch, working_days, dependents, gross, insurance, tax, net, food_allowance, gas_allowance, phone_allowance, other_benefits, bonus, violations, total_salary) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
          uId, month, year, user.staff_code || '', user.title || user.role || '', user.branch || 'Hà Nội', 26, 0, gross, 0, 0, net, 0, 0, 0, 0, sumBonus, 0, 0
        );
      }
    }
  }

  res.json({ success: true });
});

router.get("/evaluations", auth, (req: any, res: any) => {
  const { month, year } = req.query;
  const user = req.session.user;

  const mappedRole = mapRoleToDb(user.role);
  const p = db.prepare(`SELECT manageFinance FROM role_permissions WHERE role=?`).get(mappedRole) as any;
  const hasAccess = p?.manageFinance || mappedRole === 'admin' || mappedRole === 'director';

  let evaluations: any[];
  if (hasAccess) {
    evaluations = db.prepare(`
      SELECT e.*, u.name as user_name, u.staff_code, u.title, u.branch 
      FROM evaluations e 
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.month = ? AND e.year = ?
    `).all(month, year);
  } else {
    evaluations = db.prepare(`
      SELECT e.*, u.name as user_name, u.staff_code, u.title, u.branch 
      FROM evaluations e 
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.month = ? AND e.year = ? AND (e.user_id = ? OR e.target_type != 'personnel')
    `).all(month, year, user.id);
  }
  
  // Fetch latest profiles and dynamic codes to keep evaluations consistent
  const allUsers = db.prepare(`SELECT id, name, role, title, branch FROM users`).all();
  const enrichedUsers = enrichUsersWithStaffCode(allUsers);

  const targetUsers = enrichedUsers.filter(u => {
    if (u.role === "client") return false;
    if (hasAccess) return true;
    return u.id === user.id;
  });

  const results: any[] = [];
  for (const u of targetUsers) {
    const existing = evaluations.find(ev => ev.user_id === u.id && ev.target_type === 'personnel');
    if (existing) {
      existing.staff_code = u.staff_code;
      existing.user_name = u.name;
      existing.title = u.title || u.role;
      existing.branch = u.branch || "";
      results.push(existing);
    } else {
      results.push({
        id: -u.id, // negative ID to indicate virtual row
        user_id: u.id,
        month: Number(month),
        year: Number(year),
        rating: "-",
        bonus_amount: 0,
        notes: "",
        target_type: "personnel",
        target_name: null,
        staff_code: u.staff_code,
        user_name: u.name,
        title: u.title || u.role,
        branch: u.branch || ""
      });
    }
  }

  // Include non-personnel evaluations (e.g. department/team rewards)
  const groupEvals = evaluations.filter(ev => ev.target_type !== 'personnel');
  
  // Sort the personnel ones by staff_code suffix
  results.sort((a, b) => {
    const numA = Number((a.staff_code || "").match(/\d+$/)?.[0] || 999);
    const numB = Number((b.staff_code || "").match(/\d+$/)?.[0] || 999);
    return numA - numB;
  });
  
  const finalResults = [...results, ...groupEvals];
  res.json(finalResults);
});

router.delete("/evaluations/:id", canManageFinance, (req: any, res: any) => {
  const evalRec = db.prepare(`SELECT user_id, month, year, target_type FROM evaluations WHERE id=?`).get(req.params.id) as any;
  db.prepare(`DELETE FROM evaluations WHERE id=?`).run(req.params.id);
  
  if (evalRec && evalRec.target_type === "personnel" && evalRec.user_id) {
    const payroll = db.prepare(`SELECT * FROM monthly_payrolls WHERE user_id=? AND month=? AND year=?`).get(evalRec.user_id, evalRec.month, evalRec.year) as any;
    if (payroll) {
      const sumBonus = (db.prepare(`SELECT SUM(bonus_amount) as s FROM evaluations WHERE user_id=? AND month=? AND year=? AND target_type='personnel'`).get(evalRec.user_id, evalRec.month, evalRec.year) as any)?.s || 0;
      const net = (payroll.total_salary || 0) + (payroll.other_benefits || 0) + sumBonus - (payroll.violations || 0) - (payroll.insurance || 0) - (payroll.tax || 0);
      db.prepare(`UPDATE monthly_payrolls SET bonus=?, net=? WHERE id=?`).run(sumBonus, net, payroll.id);
    }
  }

  res.json({ success: true });
});

// Helper to sync QC records with Evaluations & Payrolls
export function syncQcAndPayroll(userId: number, month: number, year: number) {
  try {
    // 1. Fetch user info
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    if (!user) return;

    // 2. Fetch all QC records for this user in this month and year
    const records = db.prepare(`
      SELECT r.*, rule.type, rule.points_effect, rule.money_effect 
      FROM qc_records r
      JOIN qc_rules rule ON r.rule_code = rule.code
      WHERE r.user_id = ? AND r.month = ? AND r.year = ?
    `).all(userId, month, year) as any[];

    let totalViolationsFines = 0;
    let totalBonusesGains = 0;
    let totalPoints = 100;

    for (const r of records) {
      if (r.type === 'violation') {
        totalViolationsFines += Math.abs(r.money_effect || 0);
        totalPoints += (r.points_effect || 0);
      } else if (r.type === 'bonus') {
        totalBonusesGains += Math.abs(r.money_effect || 0);
        totalPoints += (r.points_effect || 0);
      }
    }

    if (totalPoints < 0) totalPoints = 0;
    if (totalPoints > 120) totalPoints = 120;

    // Determine Rating
    let rating = 'B';
    if (totalPoints >= 95) rating = 'A';
    else if (totalPoints >= 80) rating = 'B';
    else if (totalPoints >= 60) rating = 'C';
    else rating = 'D';

    // 3. Upsert evaluation record
    const existingEval = db.prepare(`
      SELECT id FROM evaluations 
      WHERE user_id = ? AND month = ? AND year = ? AND target_type = 'personnel'
    `).get(userId, month, year) as any;

    const evaluationNotes = `Hệ thống tự động xếp loại từ điểm thi đua: ${totalPoints} điểm. (Trừ lỗi: -${100 - totalPoints + (totalPoints > 100 ? totalPoints - 100 : 0)}đ)`;

    if (existingEval) {
      db.prepare(`
        UPDATE evaluations 
        SET rating = ?, bonus_amount = ?, notes = ?
        WHERE id = ?
      `).run(rating, totalBonusesGains, evaluationNotes, existingEval.id);
    } else {
      db.prepare(`
        INSERT INTO evaluations (user_id, month, year, rating, bonus_amount, notes, target_type, target_name)
        VALUES (?, ?, ?, ?, ?, ?, 'personnel', NULL)
      `).run(userId, month, year, rating, totalBonusesGains, evaluationNotes);
    }

    // 4. Fetch updated total bonus from all evaluations
    const sumBonus = (db.prepare(`
      SELECT SUM(bonus_amount) as s 
      FROM evaluations 
      WHERE user_id = ? AND month = ? AND year = ? AND target_type = 'personnel'
    `).get(userId, month, year) as any)?.s || 0;

    // 5. Upsert monthly payroll record
    const payroll = db.prepare(`
      SELECT * FROM monthly_payrolls 
      WHERE user_id = ? AND month = ? AND year = ?
    `).get(userId, month, year) as any;

    const gross = parseSalaryNumber(user.salary) || 0;
    const dependents = payroll ? (payroll.dependents || 0) : 0;
    const food = payroll ? (payroll.food_allowance || 0) : 0;
    const gas = payroll ? (payroll.gas_allowance || 0) : 0;
    const phone = payroll ? (payroll.phone_allowance || 0) : 0;
    const otherBenefits = payroll ? (payroll.other_benefits || 0) : 0;

    const calcs = calculatePayrollTaxes(gross, dependents);
    const totalSalary = gross + food + gas + phone;
    const net = totalSalary + otherBenefits + sumBonus - totalViolationsFines - calcs.insurance - calcs.tax;

    if (payroll) {
      db.prepare(`
        UPDATE monthly_payrolls 
        SET gross = ?, insurance = ?, tax = ?, violations = ?, bonus = ?, net = ?, total_salary = ?
        WHERE id = ?
      `).run(gross, calcs.insurance, calcs.tax, totalViolationsFines, sumBonus, net, totalSalary, payroll.id);
    } else {
      db.prepare(`
        INSERT INTO monthly_payrolls (
          user_id, month, year, staff_code, title, branch, working_days, dependents, 
          gross, insurance, tax, net, food_allowance, gas_allowance, phone_allowance, 
          other_benefits, bonus, violations, total_salary
        ) VALUES (?, ?, ?, ?, ?, ?, 26, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, month, year, user.staff_code || '', user.title || user.role || '', user.branch || '',
        dependents, gross, calcs.insurance, calcs.tax, net, food, gas, phone, 
        otherBenefits, sumBonus, totalViolationsFines, totalSalary
      );
    }
  } catch (err: any) {
    console.error("Error syncing QC and Payroll:", err.message);
  }
}

// Controller / QC Authorization Middleware
const isControllerOrAdmin = (req: any, res: any, next: any) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const role = mapRoleToDb(user.role);
  if (role === 'admin' || role === 'director' || role === 'controller' || role === 'prosecutor') {
    next();
  } else {
    res.status(403).json({ success: false, error: "Chỉ Kiểm soát viên hoặc Quản trị viên mới có quyền thực hiện thao tác này." });
  }
};

// QC Rules Routes
router.get("/qc-rules", auth, (req: any, res: any) => {
  try {
    const rules = db.prepare("SELECT * FROM qc_rules ORDER BY code ASC").all();
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/qc-rules", auth, isControllerOrAdmin, (req: any, res: any) => {
  try {
    const { id, code, name, type, points_effect, money_effect, category } = req.body;
    if (id) {
      db.prepare(`
        UPDATE qc_rules 
        SET code = ?, name = ?, type = ?, points_effect = ?, money_effect = ?, category = ?
        WHERE id = ?
      `).run(code, name, type, Number(points_effect), Number(money_effect), category, id);
    } else {
      db.prepare(`
        INSERT INTO qc_rules (code, name, type, points_effect, money_effect, category)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(code, name, type, Number(points_effect), Number(money_effect), category);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/qc-rules/:id", auth, isControllerOrAdmin, (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM qc_rules WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// QC Records Routes
router.get("/qc-records", auth, (req: any, res: any) => {
  try {
    const { month, year } = req.query;
    const user = req.session.user;
    const role = mapRoleToDb(user.role);
    
    const hasFullAccess = ['admin', 'director', 'controller', 'prosecutor', 'accountant'].includes(role);
    
    let records: any[];
    if (hasFullAccess) {
      records = db.prepare(`
        SELECT r.*, u.name as user_name, u.staff_code, u.title, u.branch,
               rule.name as rule_name, rule.type as rule_type, rule.points_effect, rule.money_effect, rule.category
        FROM qc_records r
        JOIN users u ON r.user_id = u.id
        JOIN qc_rules rule ON r.rule_code = rule.code
        WHERE r.month = ? AND r.year = ?
        ORDER BY r.id DESC
      `).all(Number(month), Number(year));
    } else {
      records = db.prepare(`
        SELECT r.*, u.name as user_name, u.staff_code, u.title, u.branch,
               rule.name as rule_name, rule.type as rule_type, rule.points_effect, rule.money_effect, rule.category
        FROM qc_records r
        JOIN users u ON r.user_id = u.id
        JOIN qc_rules rule ON r.rule_code = rule.code
        WHERE r.month = ? AND r.year = ? AND r.user_id = ?
        ORDER BY r.id DESC
      `).all(Number(month), Number(year), user.id);
    }
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/qc-records", auth, isControllerOrAdmin, (req: any, res: any) => {
  try {
    const { id, user_id, rule_code, month, year, note } = req.body;
    const author = req.session.user.name || req.session.user.username;
    
    if (id) {
      db.prepare(`
        UPDATE qc_records 
        SET user_id = ?, rule_code = ?, month = ?, year = ?, note = ?
        WHERE id = ?
      `).run(Number(user_id), rule_code, Number(month), Number(year), note, id);
    } else {
      db.prepare(`
        INSERT INTO qc_records (user_id, rule_code, month, year, note, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(Number(user_id), rule_code, Number(month), Number(year), note, author);
    }

    // Recalculate and sync payroll / evaluation
    syncQcAndPayroll(Number(user_id), Number(month), Number(year));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/qc-records/:id", auth, isControllerOrAdmin, (req: any, res: any) => {
  try {
    const record = db.prepare("SELECT user_id, month, year FROM qc_records WHERE id = ?").get(req.params.id) as any;
    if (record) {
      db.prepare("DELETE FROM qc_records WHERE id = ?").run(req.params.id);
      syncQcAndPayroll(record.user_id, record.month, record.year);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
