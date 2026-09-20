import { Router } from "express";
import { auth, requirePermission } from "../../middleware/auth";
import db from "../../db/database";
import { v4 as uuidv4 } from "uuid";
import { logAction } from "../../utils/logger";
import bcrypt from "bcrypt";
import { validatePassword } from "../../utils/password";
import { mapRoleToDb } from "../../utils/role";
import { enrichUsersWithStaffCode } from "../../utils/staffCode";
import { syncRowToFirestore, deleteFromFirestore } from "../../db/firestore-sync";
import { encodeCursor, decodeCursor } from "../../utils/cursor";
import { normalizeBranchName } from "../../utils/branch";
import { SharedDirectoryService } from "../../application/services/sharedDirectory.service";
import type { UserAccount, Personnel } from "../../domain/shared";

const router = Router();
const canManageUsers = requirePermission("manageUsers");

/* EMPLOYEE */
router.post("/employee", canManageUsers, (req: any, res: any) => {
  const { name, position, salary, dependents } = req.body;
  db.prepare(`INSERT INTO employees VALUES (?,?,?,?,?)`).run(
    uuidv4(), name, position, salary, dependents
  );
  logAction(req.session.user, "ADD_EMPLOYEE");
  try {
    const io = req.app.get("io");
    if (io) io.emit("users_updated");
  } catch (e) {}
  res.json({ success: true });
});

router.get("/employees", auth, (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    if (limit !== null) {
      const params: any = {};
      let query = `SELECT * FROM employees`;

      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.id) {
          query += ` WHERE id < :cursorId`;
          params.cursorId = cursor.id;
        }
      }

      query += ` ORDER BY id DESC LIMIT :limitPlusOne`;
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
      const employees = db.prepare(`SELECT * FROM employees ORDER BY id DESC`).all();
      res.json(employees);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* USERS */
router.get("/users/employees", auth, (req: any, res: any) => {
  try {
    const employees = SharedDirectoryService.listPersonnel({
      branch: typeof req.query.branch as string === "string" ? req.query.branch as string : undefined
    });
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/users/admins", canManageUsers, (req: any, res: any) => {
  try {
    res.json(SharedDirectoryService.listAdmins());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/users", auth, (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    if (limit !== null) {
      let cursorId: number | string | undefined;
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.id) {
          cursorId = cursor.id;
        }
      }

      const rows = SharedDirectoryService.listAccountsPage(cursorId, limit + 1);
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        nextCursor = encodeCursor({ id: returnedRows[returnedRows.length - 1].id });
      }

      const enriched = enrichUsersWithStaffCode(returnedRows).map((user: any) => ({
        ...user,
        branch: normalizeBranchName(user.branch)
      }));

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
      const users = SharedDirectoryService.listAccounts();
      const enriched = enrichUsersWithStaffCode(users).map((user: any) => ({
        ...user,
        branch: normalizeBranchName(user.branch)
      }));
      res.json(enriched);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/users/bulk-add", canManageUsers, async (req: any, res: any) => {
  try {
    const users = req.body?.users;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Dữ liệu nạp vào phải là một mảng không rỗng" });
    }

    const insert = db.prepare(`
      INSERT INTO users (username, password, name, role, title, staff_code, branch, salary, practice_areas, account_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items: any[]) => {
      const insertedIds: number[] = [];
      for (const item of items) {
        const username = String(item?.username || '').trim();
        const name = String(item?.name || '').trim();
        const role = String(item?.role || 'user').trim();
        if (!username || !name || username.toLowerCase() === 'admin' || role.toLowerCase() === 'admin') {
          throw new Error("Không được nạp tài khoản admin vào danh bạ nhân sự");
        }
        const password = String(item?.password || 'Abcd@12345');
        const result = insert.run(
          username,
          bcrypt.hashSync(password, 10),
          name,
          role,
          item?.title || '',
          item?.staff_code || '',
          item?.branch || '',
          item?.salary || '0',
          item?.practice_areas || '',
          item?.account_type || 'INTERNAL'
        );
        insertedIds.push(Number(result.lastInsertRowid));
      }
      return insertedIds;
    });

    const insertedIds = insertMany(users);
    await Promise.all(insertedIds.map((id) => syncRowToFirestore("users", id)));
    try {
      const io = req.app.get("io");
      if (io) io.emit("users_updated");
    } catch (e) {}
    res.json({ success: true, inserted: insertedIds.length, ids: insertedIds });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Lỗi xử lý nạp dữ liệu hàng loạt" });
  }
});

router.post("/users", canManageUsers, async (req: any, res: any) => {
  try {
    const data = req.body;
    const requestedUsername = String(data.username || '').trim().toLowerCase();
    const requestedRole = mapRoleToDb(data.role);
    if (requestedUsername === 'admin' || requestedRole === 'admin') {
      return res.status(403).json({ error: "Tài khoản Admin tối cao chỉ được hệ thống khôi phục tự động, không thể tạo thủ công." });
    }
    
    if (data.password) {
      const passwordError = validatePassword(data.password);
      if (passwordError) {
        return res.status(400).json({ error: passwordError });
      }
    }

    if (!data.account_type) {
      const r = (data.role || "").toLowerCase().trim();
      if (r === 'client' || r === 'customer' || r === 'khách hàng' || r === 'khach hang') {
        data.account_type = 'CUSTOMER';
      } else if (r === 'partner' || r === 'đối tác' || r === 'doi tac') {
        data.account_type = 'PARTNER';
      } else {
        data.account_type = 'INTERNAL';
      }
    }

    const fields = ['username', 'password', 'name', 'role', 'title', 'staff_code', 'branch', 'start_date', 'contract_type', 'contract_sign_date', 'salary', 'bonus', 'avatar', 'phone', 'email', 'dob', 'gender', 'address', 'case_id', 'manager_id', 'practice_areas', 'account_type'];
    let keys: string[] = [];
    let values: string[] = [];
    let params: any[] = [];
    
    for (const field of fields) {
      if (data[field] !== undefined) {
        keys.push(field);
        values.push('?');
        let val = data[field];
        if (field === 'password' && val) {
          val = bcrypt.hashSync(val.toString(), 10);
        }
        params.push(val);
      }
    }
    
    let lastId: number | null = null;
    if (keys.length > 0) {
      const query = `INSERT INTO users (${keys.join(', ')}) VALUES (${values.join(', ')})`;
      const result = db.prepare(query).run(...params);
      lastId = Number(result.lastInsertRowid);
    }
    
    if (lastId) {
      await syncRowToFirestore("users", lastId);
    }

    try {
      const io = req.app.get("io");
      if (io) io.emit("users_updated");
    } catch (e) {}
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error inserting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/users/:id", auth, async (req: any, res: any) => {
  try {
    const userId = req.params.id;
    const currentUser = req.user || req.session?.user;

    if (!currentUser) return res.status(401).json({ error: "login required" });

    // Check permissions
    const mappedRole = mapRoleToDb(currentUser.role);
    const currentUserPerms = db.prepare(`SELECT manageUsers FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    const canManage = currentUserPerms?.manageUsers || mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'deputyDirector';
    if (!canManage && currentUser.id.toString() !== userId) {
       return res.status(403).json({ error: "permission denied" });
    }

    const data = req.body;
    
    // Protect system admin from critical changes
    const targetUser = db.prepare(`SELECT username, role FROM users WHERE id=?`).get(userId) as any;
    if (targetUser && (targetUser.username === 'admin' || targetUser.role === 'admin')) {
      if (currentUser.id.toString() !== userId) {
        return res.status(403).json({ error: "Chỉ tài khoản Admin tối cao mới được tự cập nhật thông tin bảo mật của chính tài khoản này" });
      }
      if (data.username !== undefined && data.username !== 'admin') {
        return res.status(403).json({ error: "Cannot change system administrator username" });
      }
      if (data.role !== undefined && data.role !== 'admin') {
        return res.status(403).json({ error: "Cannot change system administrator role" });
      }
      if (data.account_type !== undefined && data.account_type !== 'INTERNAL') {
        return res.status(403).json({ error: "Cannot change system administrator account type" });
      }
    }

    // Non-admins can't change their role or sensitive financial/contract fields
    if (!canManage) {
      delete data.role;
      delete data.salary;
      delete data.bonus;
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

    if (data.role && !data.account_type) {
      const r = (data.role || "").toLowerCase().trim();
      if (r === 'client' || r === 'customer' || r === 'khách hàng' || r === 'khach hang') {
        data.account_type = 'CUSTOMER';
      } else if (r === 'partner' || r === 'đối tác' || r === 'doi tac') {
        data.account_type = 'PARTNER';
      } else {
        data.account_type = 'INTERNAL';
      }
    }

    const fields = ['username', 'password', 'name', 'role', 'title', 'staff_code', 'branch', 'start_date', 'contract_type', 'contract_sign_date', 'salary', 'bonus', 'avatar', 'phone', 'email', 'dob', 'gender', 'address', 'case_id', 'manager_id', 'practice_areas', 'account_type'];
    let updates: string[] = [];
    let params: any[] = [];
    
    for (const field of fields) {
      if (data[field] !== undefined) {
        // If updating password to empty, we skip or hash the new one
        if (field === 'password') {
          if (!data[field]) continue; // If empty string passed, don't update password
          updates.push(`${field}=?`);
          params.push(bcrypt.hashSync(data[field].toString(), 10));
        } else {
          updates.push(`${field}=?`);
          params.push(data[field]);
        }
      }
    }
    
    if (updates.length > 0) {
      const query = `UPDATE users SET ${updates.join(", ")} WHERE id=?`;
      params.push(userId);
      db.prepare(query).run(...params);
    }
    
    await syncRowToFirestore("users", userId);
    
    try {
      const io = req.app.get("io");
      if (io) io.emit("users_updated");
    } catch (e) {}

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/users/:id/reset_account", auth, async (req: any, res: any) => {
  try {
    const userId = req.params.id;
    const currentUser = req.session?.user;

    if (!currentUser) return res.status(401).json({ error: "login required" });

    // Check permissions
    const mappedRole = mapRoleToDb(currentUser.role);
    const currentUserPerms = db.prepare(`SELECT manageUsers FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    const canManage = currentUserPerms?.manageUsers || mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'deputyDirector';
    if (!canManage) {
       return res.status(403).json({ error: "permission denied" });
    }

    const defaultPassword = "Abcd@12345";
    const targetUser = db.prepare('SELECT username, role FROM users WHERE id = ?').get(userId) as any;
    if (targetUser?.username === 'admin' || mapRoleToDb(targetUser?.role) === 'admin') {
      return res.status(403).json({ error: "Không thể reset cưỡng bức tài khoản Admin tối cao; hãy đổi mật khẩu sau khi đăng nhập." });
    }
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    db.prepare('UPDATE users SET password = ?, known_devices = ? WHERE id = ?').run(hashedPassword, '[]', userId);
    await syncRowToFirestore("users", userId);

    try {
      const io = req.app.get("io");
      if (io) io.emit("users_updated");
    } catch (e) {}

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error resetting user account:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/users/:id", canManageUsers, async (req: any, res: any) => {
  const userId = req.params.id;
  const targetUser = db.prepare(`SELECT role, username FROM users WHERE id=?`).get(userId) as any;
  const targetMapped = mapRoleToDb(targetUser?.role);
  if (targetUser && (targetUser.role === 'admin' || targetUser.username === 'admin' || targetUser.role === 'director' || targetMapped === 'director' || targetMapped === 'deputyDirector')) {
    return res.status(403).json({ error: "Cannot delete administrator, director, or deputy director accounts" });
  }
  db.prepare(`DELETE FROM monthly_payrolls WHERE user_id=?`).run(userId);
  db.prepare(`DELETE FROM evaluations WHERE user_id=?`).run(userId);
  db.prepare(`DELETE FROM users WHERE id=?`).run(userId);

  await deleteFromFirestore("users", userId);

  try {
    const io = req.app.get("io");
    if (io) io.emit("users_updated");
  } catch (e) {}

  res.json({ success: true });
});

export default router;
