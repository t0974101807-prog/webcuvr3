import { Router } from "express";
import { auth } from "../../middleware/auth";
import db from "../../db/database";
import { v4 as uuidv4 } from "uuid";
import { encodeCursor, decodeCursor } from "../../utils/cursor";

const router = Router();

router.post("/client", auth, (req: any, res: any) => {
  const { name, phone } = req.body;
  try {
    // Basic password hashing simulation to match users.routes logic, but here we just use the raw insert
    const stmt = db.prepare(`INSERT INTO users (username, password, name, phone, role) VALUES (?, ?, ?, ?, 'client')`);
    stmt.run(phone, 'Abcd@12345', name, phone);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: "Số điện thoại / tên đăng nhập đã tồn tại" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.get("/clients", auth, (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    if (limit !== null) {
      const params: any = {};
      let query = `SELECT id, username, name, phone, email, address, role FROM users WHERE role = 'client'`;

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
      const clients = db.prepare(`SELECT id, username, name, phone, email, address, role, branch, manager_id, case_id FROM users WHERE role = 'client' OR account_type = 'CUSTOMER' ORDER BY id DESC`).all();
      res.json(clients);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/partners", auth, (req: any, res: any) => {
  try {
    const partners = db.prepare(`SELECT id, username, name, phone, email, address, role, branch, manager_id, case_id FROM users WHERE role = 'partner' OR account_type = 'PARTNER' ORDER BY id DESC`).all();
    res.json(partners);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
