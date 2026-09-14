import { Router } from "express";
import { auth } from "../../middleware/auth";
import db from "../../db/database";
import { mapRoleToDb } from "../../utils/role";
import { encodeCursor, decodeCursor } from "../../utils/cursor";

const router = Router();

// Helper to check if user has finance permission
const checkFinancePermission = (req: any, res: any, next: any) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const mappedRole = mapRoleToDb(user.role);
  const p = db.prepare(`SELECT manageFinance FROM role_permissions WHERE role=?`).get(mappedRole) as any;
  const isFinanceManager = p?.manageFinance || mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'accountant';
  
  if (!isFinanceManager) {
    return res.status(403).json({ success: false, error: "Permission denied" });
  }
  next();
};

// 1. Get transactions
router.get("/transactions", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT * FROM finance_transactions";
    const params: any = {};

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.id) {
          query += " WHERE id < :cursorId";
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY id DESC LIMIT :limitPlusOne";
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
      query += " ORDER BY id DESC";
      const transactions = db.prepare(query).all(params);
      res.json({ success: true, data: transactions });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Create transaction
router.post("/transactions", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { type, amount, category, description, date } = req.body;
    const user = req.session.user;
    const mappedRole = mapRoleToDb(user.role);
    
    // Accountant role creates 'chi' with status 'pending_approval'
    // Admin & Director create directly as 'completed'
    let status = "completed";
    if (type === "chi" && (mappedRole === "accountant" || user.role === "Kế toán" || user.role === "kế toán")) {
      status = "pending_approval";
    }

    const result = db.prepare(`
      INSERT INTO finance_transactions (type, amount, category, description, date, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(type, Number(amount), category, description, date, user.name || user.username, status);

    try {
      const io = req.app.get("io");
      if (io) io.emit("finance_updated");
    } catch (e) {}

    res.json({ 
      success: true, 
      data: { 
        id: result.lastInsertRowid, 
        type, 
        amount, 
        category, 
        description, 
        date, 
        created_by: user.name || user.username, 
        status 
      } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Approve / Reject transaction
router.post("/transactions/approve", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { id, action } = req.body; // action: 'approve' or 'reject'
    const user = req.session.user;
    const mappedRole = mapRoleToDb(user.role);

    // Only Director/Admin can approve
    const isApprover = mappedRole === 'admin' || mappedRole === 'director';
    if (!isApprover) {
      return res.status(403).json({ success: false, error: "Only Directors or Admins can approve expenditure orders." });
    }

    const status = action === "approve" ? "completed" : "rejected";
    const result = db.prepare(`
      UPDATE finance_transactions 
      SET status = ?, approved_by = ? 
      WHERE id = ? AND status = 'pending_approval'
    `).run(status, user.name || user.username, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: "No pending transaction found with that ID." });
    }

    try {
      const io = req.app.get("io");
      if (io) io.emit("finance_updated");
    } catch (e) {}

    res.json({ success: true, message: `Expenditure order successfully ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Assets & Debts
router.get("/assets-debts", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const assets = db.prepare("SELECT * FROM company_assets ORDER BY id DESC").all();
    const debts = db.prepare("SELECT * FROM company_debts ORDER BY id DESC").all() as any[];

    // Include unpaid case debts from erp_records
    const erpRecords = db.prepare("SELECT * FROM erp_records").all() as any[];
    const erpDebts: any[] = [];
    for (const r of erpRecords) {
      try {
        const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
        const remFee = Number(d?.remainingFee !== undefined ? d.remainingFee : (d?.debt || 0));
        if (remFee > 0) {
          const clientName = d.clientName || d.client || "Khách hàng";
          const caseId = d.id || r.id;
          // Check if already in debts list to prevent duplication
          const exists = debts.some((item: any) => String(item.description || '').includes(caseId));
          if (!exists) {
            erpDebts.push({
              id: `ERP-DEBT-${caseId}`,
              debtor_name: `${clientName} (Hồ sơ ${caseId})`,
              type: "phai_thu",
              amount: remFee,
              due_date: d.deadline || d.date || "2026-07-30",
              status: "chua_thanh_toan",
              description: `Phí dịch vụ pháp lý đợt tiếp theo còn nợ theo hợp đồng ${caseId}: ${d.title || ''}`
            });
          }
        }
      } catch (e) {}
    }

    res.json({ success: true, data: { assets, debts: [...debts, ...erpDebts] } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Add asset
router.post("/assets", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { name, value, purchase_date, description } = req.body;
    db.prepare(`
      INSERT INTO company_assets (name, value, purchase_date, description)
      VALUES (?, ?, ?, ?)
    `).run(name, Number(value), purchase_date, description);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Add/Update debt
router.post("/debts", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { id, debtor_name, type, amount, due_date, status, description } = req.body;
    if (id) {
      db.prepare(`
        UPDATE company_debts 
        SET debtor_name = ?, type = ?, amount = ?, due_date = ?, status = ?, description = ?
        WHERE id = ?
      `).run(debtor_name, type, Number(amount), due_date, status, description, id);
    } else {
      db.prepare(`
        INSERT INTO company_debts (debtor_name, type, amount, due_date, status, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(debtor_name, type, Number(amount), due_date, status, description);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get tax reports
router.get("/tax-reports", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const reports = db.prepare("SELECT * FROM tax_reports ORDER BY year DESC, period DESC").all();
    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Add/Update tax report
router.post("/tax-reports", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { id, period, year, tax_type, amount, status, submission_date, notes } = req.body;
    if (id) {
      db.prepare(`
        UPDATE tax_reports 
        SET period = ?, year = ?, tax_type = ?, amount = ?, status = ?, submission_date = ?, notes = ?
        WHERE id = ?
      `).run(period, Number(year), tax_type, Number(amount), status, submission_date, notes, id);
    } else {
      db.prepare(`
        INSERT INTO tax_reports (period, year, tax_type, amount, status, submission_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(period, Number(year), tax_type, Number(amount), status, submission_date, notes);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Get budget plans
router.get("/budget-plans", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const budgets = db.prepare("SELECT * FROM budget_plans ORDER BY year DESC, period DESC").all();
    res.json({ success: true, data: budgets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Add/Update budget plan
router.post("/budget-plans", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { id, period, year, budget_amount, expected_revenue, expected_expense, notes } = req.body;
    if (id) {
      db.prepare(`
        UPDATE budget_plans 
        SET period = ?, year = ?, budget_amount = ?, expected_revenue = ?, expected_expense = ?, notes = ?
        WHERE id = ?
      `).run(period, Number(year), Number(budget_amount), Number(expected_revenue), Number(expected_expense), notes, id);
    } else {
      db.prepare(`
        INSERT INTO budget_plans (period, year, budget_amount, expected_revenue, expected_expense, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(period, Number(year), Number(budget_amount), Number(expected_revenue), Number(expected_expense), notes);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Get salary orders
router.get("/salary-orders", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const orders = db.prepare("SELECT * FROM salary_payment_orders ORDER BY id DESC").all();
    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. Create salary order
router.post("/salary-orders", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { month, year, total_amount, details } = req.body;
    const user = req.session.user;

    const result = db.prepare(`
      INSERT INTO salary_payment_orders (month, year, total_amount, status, created_by, details)
      VALUES (?, ?, ?, 'pending_approval', ?, ?)
    `).run(Number(month), Number(year), Number(total_amount), user.name || user.username, JSON.stringify(details));

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. Approve salary order
router.post("/salary-orders/approve", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { id } = req.body;
    const user = req.session.user;
    const mappedRole = mapRoleToDb(user.role);

    // Only Director / Admin can approve
    if (mappedRole !== 'admin' && mappedRole !== 'director') {
      return res.status(403).json({ success: false, error: "Only Directors or Admins can approve salary orders." });
    }

    db.prepare(`
      UPDATE salary_payment_orders 
      SET status = 'approved', approved_by = ? 
      WHERE id = ? AND status = 'pending_approval'
    `).run(user.name || user.username, id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 14. Pay salary order (Bank integration simulation)
router.post("/salary-orders/pay", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { id } = req.body;
    
    // Retrieve the order to get details
    const order = db.prepare("SELECT * FROM salary_payment_orders WHERE id = ?").get(id) as any;
    if (!order) {
      return res.status(404).json({ success: false, error: "Salary order not found." });
    }

    db.prepare(`
      UPDATE salary_payment_orders 
      SET status = 'paid', paid_at = ? 
      WHERE id = ? AND status = 'approved'
    `).run(new Date().toISOString(), id);

    // Record as an expenditure transaction ('chi') in finance_transactions automatically!
    db.prepare(`
      INSERT INTO finance_transactions (type, amount, category, description, date, created_by, status)
      VALUES ('chi', ?, 'Chi lương', ?, ?, 'Hệ thống ngân hàng', 'completed')
    `).run(order.total_amount, `Chi trả lương tự động Tháng ${order.month}/${order.year}`, new Date().toISOString().split("T")[0]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 15. Get performance (analytical figures for dashboards)
router.get("/performance", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    // Revenue: sum of all completed 'thu' transactions + sum of fee amounts from erp_records
    const thuTrans = db.prepare("SELECT SUM(amount) as s FROM finance_transactions WHERE type='thu' AND status='completed'").get() as any;
    let totalThu = thuTrans?.s || 0;

    const erpRecords = db.prepare("SELECT data FROM erp_records").all() as any[];
    let erpTotalRevenue = 0;
    for (const r of erpRecords) {
      try {
        const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
        if (d && d.feeAmount) {
          erpTotalRevenue += Number(String(d.feeAmount).replace(/,/g, "")) || 0;
        } else if (d && d.revenue) {
          erpTotalRevenue += Number(String(d.revenue).replace(/,/g, "")) || 0;
        }
      } catch (e) {}
    }

    if (erpTotalRevenue > totalThu) {
      totalThu = erpTotalRevenue;
    }

    // Expenses: sum of completed 'chi' transactions + paid salary orders
    const chiTrans = db.prepare("SELECT SUM(amount) as s FROM finance_transactions WHERE type='chi' AND status='completed'").get() as any;
    const totalChi = chiTrans?.s || 0;

    const profit = totalThu - totalChi;

    res.json({
      success: true,
      data: {
        revenue: totalThu,
        expense: totalChi,
        profit: profit
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 16. Update user commission rates
router.post("/config", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    const { user_id, commission_percent, bonus_completion_percent } = req.body;
    db.prepare(`
      UPDATE users 
      SET commission_percent = ?, bonus_completion_percent = ? 
      WHERE id = ?
    `).run(Number(commission_percent), Number(bonus_completion_percent), user_id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 17. Get dynamic staff commissions
router.get("/staff-commissions", auth, checkFinancePermission, (req: any, res: any) => {
  try {
    // Get all users who are litigation staff
    const staff = db.prepare(`
      SELECT id, name, username, role, title, commission_percent, bonus_completion_percent 
      FROM users 
      WHERE role != 'client'
    `).all() as any[];

    // Get all erp records
    const records = db.prepare("SELECT data FROM erp_records").all() as any[];
    
    const results = staff.map(s => {
      let earnedCommission = 0;
      let earnedCompletionReward = 0;
      const associatedCases: any[] = [];

      records.forEach(r => {
        try {
          const data = JSON.parse(r.data);
          // Check if main assignee is this staff member (checking name or username)
          if (data.mainAssignee === s.name || data.mainAssignee === s.username) {
            const revenue = Number(data.revenue || data.feeAmount || 0);
            
            // Commission: based on revenue
            const commission = revenue * ((s.commission_percent || 5) / 100);
            earnedCommission += commission;

            // Completion reward: if status is completed ("Hoàn thành")
            let reward = 0;
            if (data.status === "Hoàn thành") {
              reward = revenue * ((s.bonus_completion_percent || 10) / 100);
              earnedCompletionReward += reward;
            }

            associatedCases.push({
              id: data.id || "---",
              title: data.title || "---",
              client: data.client || "---",
              revenue: revenue,
              status: data.status,
              commission,
              reward
            });
          }
        } catch (e) {}
      });

      return {
        id: s.id,
        name: s.name || s.username,
        role: s.role,
        title: s.title || s.role,
        commission_percent: s.commission_percent || 5,
        bonus_completion_percent: s.bonus_completion_percent || 10,
        earnedCommission,
        earnedCompletionReward,
        totalCompensation: earnedCommission + earnedCompletionReward,
        cases: associatedCases
      };
    });

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
