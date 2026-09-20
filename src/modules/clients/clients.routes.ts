import { Router } from "express";
import { auth } from "../../middleware/auth";
import { encodeCursor, decodeCursor } from "../../utils/cursor";
import { SharedDirectoryService } from "../../application/services/sharedDirectory.service";

const router = Router();

router.post("/client", auth, (req: any, res: any) => {
  const { name, phone } = req.body;
  try {
    SharedDirectoryService.createClient(name ?? null, phone ?? null);
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
      let cursorId: number | string | undefined;
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.id) {
          cursorId = cursor.id;
        }
      }

      const rows = SharedDirectoryService.listClientsPage(cursorId, limit + 1);
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
      const clients = SharedDirectoryService.listClients();
      res.json(clients);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/partners", auth, (req: any, res: any) => {
  try {
    const partners = SharedDirectoryService.listPartners();
    res.json(partners);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
