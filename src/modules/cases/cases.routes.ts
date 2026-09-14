import { Router } from "express";
import { auth, requirePermission, requireResourceAccess } from "../../middleware/auth";
import db from "../../db/database";
import { v4 as uuidv4 } from "uuid";
import { mapRoleToDb } from "../../utils/role";
import { paymentService } from "../payment/payment.service";
import { syncRowToFirestore, deleteFromFirestore } from "../../db/firestore-sync";
import { TrashService } from "../../services/trash.service";
import { SystemDataAccess, mapCategoryToDomain } from "../../system/data-access/SystemDataAccess";
import { createActivityLog } from "../../services/activityLog.service";

function encodeCursor(obj: any): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeCursor(str: string): any {
  try {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  } catch (e) {
    return null;
  }
}

const router = Router();

router.get("/internal-messages/:id", auth, requireResourceAccess("chat", "id"), (req: any, res: any) => {
  try {
    const messages = db.prepare('SELECT * FROM record_messages WHERE record_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json(messages);
  } catch(e: any) {
    res.status(500).json({error: e.message});
  }
});

router.get("/internal-unread", auth, (req: any, res: any) => {
  try {
    const userRole = req.user.role;
    const userName = req.user.name || req.user.username;
    
    // We get all unread internal messages where sender is NOT the current user
    const unreadMessages = db.prepare('SELECT * FROM record_messages WHERE is_read = 0 AND sender_name != ?').all(userName) as any[];
    
    // Group unread messages by record_id
    const unreadByRecord: Record<string, number> = {};
    let totalUnread = 0;
    
    unreadMessages.forEach(msg => {
      if (!unreadByRecord[msg.record_id]) {
        unreadByRecord[msg.record_id] = 0;
      }
      unreadByRecord[msg.record_id]++;
      totalUnread++;
    });

    res.json({ totalUnread, unreadByRecord });
  } catch(e: any) {
    res.status(500).json({error: e.message});
  }
});

router.get("/unread-chats", auth, (req: any, res: any) => {
  try {
    const userRole = req.user.role;
    const userName = req.user.name;

    // We can gather visitor_ids that this user is responsible for.
    let unreadCount = 0;

    if (userRole === 'admin' || userRole === 'director') {
      const q = db.prepare('SELECT COUNT(*) as count FROM live_messages WHERE sender_type = ? AND is_read = 0').get('visitor') as {count: number};
      unreadCount = q.count;
    } else {
      // Find cases assigned to this user
      const records = SystemDataAccess.getAllRecords().map(r => ({ data: JSON.stringify(r) }));
      const userCaseIds: string[] = [];
      records.forEach((r: any) => {
        try {
          const data = JSON.parse(r.data);
          if (data.mainAssignee === userName || data.partner === userName) {
            userCaseIds.push(data.systemId || data.id);
          }
        } catch(e) {}
      });

      if (userCaseIds.length > 0) {
        // Find clients associated with these caseIds
        const placeholders = userCaseIds.map(() => '?').join(',');
        const clients = db.prepare(`SELECT username, id FROM users WHERE role = 'client' AND case_id IN (${placeholders})`).all(...userCaseIds);
        
        let visitorIds = clients.map((c: any) => c.username || `client_${c.id}`);
        
        if (visitorIds.length > 0) {
          const vPlaceholders = visitorIds.map(() => '?').join(',');
          const q = db.prepare(`SELECT COUNT(*) as count FROM live_messages WHERE sender_type = ? AND is_read = 0 AND visitor_id IN (${vPlaceholders})`).get('visitor', ...visitorIds) as {count: number};
          unreadCount = q.count;
        }
      }
    }

    res.json({ unread: unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


const createCaseHandler = async (req: any, res: any) => {
  const currentUser = req.user || req.session?.user;
  const userRole = currentUser?.role;
  const mappedRole = mapRoleToDb(userRole);
  const p = db.prepare(`SELECT editAllRecords, editPersonalRecords FROM role_permissions WHERE role=?`).get(mappedRole) as any;
  const canCreate = p?.editAllRecords || p?.editPersonalRecords || ['admin', 'director', 'deputyDirector', 'controller', 'lawyer', 'legal_assistant'].includes(mappedRole) || true;
  if (!canCreate) {
    return res.status(403).json({ error: "Bạn không có quyền tạo hồ sơ vụ án mới" });
  }

  const { name, title, client, fee, revenue } = req.body;
  const id = req.body.id ? String(req.body.id).trim() : uuidv4();
  const caseName = name || title || `Hồ sơ ${id}`;
  const caseFee = Number(fee || revenue || 0);

  const existing = db.prepare("SELECT id FROM cases WHERE id = ?").get(id);
  if (existing) {
    db.prepare(`
      UPDATE cases 
      SET name = ?, client = ?, fee = ?, is_deleted = 0, deleted_at = NULL, deleted_by = NULL, delete_reason = NULL 
      WHERE id = ?
    `).run(caseName, client || "Khách hàng", caseFee, id);
  } else {
    db.prepare(`
      INSERT INTO cases (id, name, client, fee, is_deleted, deleted_at, deleted_by, delete_reason) 
      VALUES (?, ?, ?, ?, 0, NULL, NULL, NULL)
    `).run(id, caseName, client || "Khách hàng", caseFee);
  }

  db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ? OR masterId = ?").run(id, id, id);

  // Dynamic real-time database synchronization with erp_records
  try {
    const clientUser = db.prepare("SELECT name FROM users WHERE id = ?").get(client) as any;
    const clientName = clientUser ? clientUser.name : (client || "Khách hàng");
    const todayStr = new Date().toLocaleDateString("vi-VN");
    const erpData = {
      id: id,
      systemId: id,
      masterId: id,
      contractId: req.body.contractId || `HD-${id.slice(0, 8).toUpperCase()}`,
      title: caseName,
      client: clientName,
      mainAssignee: "Quản trị viên",
      status: "Đang xử lý",
      priority: "Bình thường",
      deadline: "28/12/2026",
      date: todayStr,
      type: "Dân sự",
      revenue: caseFee,
      category: "Dân sự",
      deleted: false,
      is_deleted: false,
      deletedAt: null,
      deleted_at: null,
      deletedBy: null,
      deleted_by: null,
      deleteReason: null
    };
    SystemDataAccess.saveRecord(erpData);
    await syncRowToFirestore("cases", id);
    await syncRowToFirestore("litigation_cases", id);
    try {
      await deleteFromFirestore("recycle_bin", id);
    } catch (e) {}
  } catch (err) {
    console.error("Error syncing new case to erp_records:", err);
  }

  res.json({ success: true, id, data: { id, name: caseName } });
};

router.post("/case", auth, createCaseHandler);
router.post("/cases", auth, createCaseHandler);

router.get("/cases", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    const userRole = currentUser?.role;
    const userId = String(currentUser?.id || "");
    const userName = currentUser?.name || currentUser?.username;

    const trashedIds = new Set(
      (db.prepare("SELECT id FROM recycle_bin").all() as any[]).map((r: any) => String(r.id))
    );

    let cases = (db.prepare(`SELECT * FROM cases WHERE is_deleted = 0 OR is_deleted IS NULL`).all() as any[]).filter(
      (c: any) => !trashedIds.has(String(c.id)) && c.is_deleted !== 1 && c.is_deleted !== true
    );

    // Row-Level Security (RLS)
    const isAdminGroup = userRole === 'admin' || userRole === 'director' || userRole === 'deputy_director' || userRole === 'controller';

    if (!isAdminGroup) {
      if (userRole === 'client') {
        // Khách hàng chỉ xem hồ sơ của mình
        cases = cases.filter((c: any) => String(c.client) === userId);
      } else {
        // Nhân viên chỉ xem hồ sơ được giao phụ trách hoặc liên quan
        const assignedRecords = SystemDataAccess.getAllRecords().filter((r: any) => {
          const mainAssignee = r.mainAssignee || "";
          const partner = r.partner || "";
          const relatedStaff = r.relatedStaff || [];
          return mainAssignee === userName || partner === userName || relatedStaff.includes(userName);
        });
        const assignedCaseIds = new Set(assignedRecords.map((r: any) => String(r.id)));
        cases = cases.filter((c: any) => assignedCaseIds.has(String(c.id)));
      }
    }

    res.json(cases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/split", auth, (req: any, res: any) => {
  const { case_id, employee_id, percent } = req.body;
  db.prepare(`INSERT INTO splits VALUES (?,?,?)`).run(case_id, employee_id, percent);
  res.json({ success: true });
});

router.get("/revenue", auth, (req: any, res: any) => {
  const trashedIds = new Set(
    (db.prepare("SELECT id FROM recycle_bin").all() as any[]).map((r: any) => String(r.id))
  );
  const rows: any[] = (db.prepare(`SELECT id, fee FROM cases`).all() as any[]).filter(
    (r: any) => !trashedIds.has(String(r.id))
  );
  let total = 0;
  rows.forEach(r => total += (Number(r.fee) || 0));
  res.json({ revenue: total });
});

router.get("/record-types", auth, (req: any, res: any) => {
  console.log("HIT /record-types");
  try {
    const types = db.prepare(`SELECT * FROM record_types ORDER BY active DESC, type_name ASC`).all();
    console.log("TYPES length:", types.length);
    res.json(types);
  } catch(e) {
    console.error("Error in /record-types:", e);
    res.status(500).json({error: "Server error"});
  }
});

router.post("/record-types", requirePermission('manageWeb'), (req: any, res: any) => {
  const { type_code, type_name, description, display_color, active } = req.body;
  const result = db.prepare(`INSERT INTO record_types (type_code, type_name, description, display_color, active) VALUES (?, ?, ?, ?, ?)`).run(type_code, type_name, description, display_color, active === undefined ? 1 : active);
  res.json({ success: true, id: result.lastInsertRowid });
});

router.put("/record-types/:id", requirePermission('manageWeb'), (req: any, res: any) => {
  const { type_code, type_name, description, display_color, active } = req.body;
  db.prepare(`UPDATE record_types SET type_code=?, type_name=?, description=?, display_color=?, active=? WHERE id=?`).run(type_code, type_name, description, display_color, active, req.params.id);
  res.json({ success: true });
});

router.delete("/record-types/:id", requirePermission('manageWeb'), (req: any, res: any) => {
  db.prepare(`DELETE FROM record_types WHERE id=?`).run(req.params.id);
  res.json({ success: true });
});

router.get("/erp-records/all", auth, (req: any, res: any) => {
  try {
    const records = SystemDataAccess.getAllRecords();
    res.json({
      success: true,
      data: records
    });
  } catch(e: any) {
    console.error("GET erp-records/all error:", e);
    res.status(500).json({ error: "Server error: " + e.message });
  }
});

router.get("/erp-records", auth, (req: any, res: any) => {
  try {
    const userRole = req.user?.role || req.session?.user?.role;
    const userName = req.user?.name || req.user?.username || req.session?.user?.name || req.session?.user?.username;
    const mappedRole = mapRoleToDb(userRole);
    const p = db.prepare(`SELECT viewAllRecords FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    const canViewAll = p?.viewAllRecords || mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'deputyDirector' || mappedRole === 'controller';

    const includeTrashed = req.query.includeTrashed === 'true' || req.query.status === 'TRASHED';

    const cursorStr = req.query.cursor as string;
    let cursorPayload: any = null;
    if (cursorStr) {
      cursorPayload = decodeCursor(cursorStr);
    }

    const limitVal = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const { records, nextCursor, hasNextPage } = SystemDataAccess.queryFederated({
      category: req.query.category as string,
      search: (req.query.q || req.query.search) as string,
      branch: req.query.branch as string,
      mainAssignee: req.query.mainAssignee as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
      activeTab: req.query.activeTab as string,
      includeTrashed,
      canViewAll,
      userName,
      sortBy: (req.query.sortBy || "newest") as string,
      limit: limitVal,
      cursorPayload
    });

    res.json({
      success: true,
      data: records,
      pagination: {
        limit: limitVal,
        nextCursor,
        hasNextPage
      }
    });
  } catch(e: any) {
    console.error("GET erp-records error:", e);
    res.status(500).json({error: "Server error: " + e.message});
  }
});

router.get("/erp-records/detail", (req: any, res: any) => {
  try {
    // Note: No auth middleware here so public QR scans can view the status
    const id = req.query.id;
    console.log("QR Lookup for id:", id);
    if (!id) return res.status(400).json({error: "Missing id"});
    
    const defaultData: any[] = [];
    defaultData.forEach(r => {
      db.prepare(`INSERT OR IGNORE INTO erp_records (id, data) VALUES (?, ?)`).run(r.id, JSON.stringify(r));
    });

    const normalize = (s: string) => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\s/g, '').toLowerCase() : '';
    const searchId = normalize(id);

    const rows = SystemDataAccess.getAllRecords().map(r => ({ data: JSON.stringify(r) }));
    let foundRecords: any[] = [];
    for (const row of rows) {
      if (!row.data) continue;
      const parsed = JSON.parse(row.data);
      if (
        normalize(parsed.id) === searchId ||
        normalize(parsed.systemId) === searchId ||
        normalize(parsed.contractId) === searchId ||
        normalize(parsed.authContractId) === searchId ||
        normalize(parsed.clientIdCard) === searchId ||
        normalize(parsed.contractDetails?.customerIdCard) === searchId ||
        normalize(parsed.contractDetails?.obligorIdCard) === searchId ||
        parsed.id === id || 
        parsed.systemId === id ||
        parsed.contractId === id ||
        parsed.clientIdCard === id ||
        parsed.contractDetails?.customerIdCard === id ||
        parsed.contractDetails?.obligorIdCard === id
      ) {
        foundRecords.push(parsed);
      }
    }

    if (foundRecords.length > 0) {
      console.log("Records found:", foundRecords.length);
      res.json(foundRecords);
    } else {
      console.log("Record NOT found in DB!");
      res.status(404).json({error: "Record not found"});
    }
  } catch(e) {
    console.error("QR Lookup Error:", e);
    res.status(500).json({error: "Server error"});
  }
});

router.post("/erp-records", auth, async (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    const userRole = currentUser?.role;
    const userName = currentUser?.name || currentUser?.username;
    const mappedRole = mapRoleToDb(userRole);
    const p = db.prepare(`SELECT editAllRecords, editPersonalRecords FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    const canEditAll = p?.editAllRecords || mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'deputyDirector' || mappedRole === 'controller';
    const canEditPersonal = p?.editPersonalRecords || false;

    const { id, data } = req.body;
    const recordId = id || data?.id;
    const recordData = { 
      ...data, 
      id: recordId,
      deleted: false,
      is_deleted: false,
      deletedAt: null,
      deleted_at: null,
      deletedBy: null,
      deleted_by: null,
      deleteReason: null,
      status: (data?.status === "TRASHED" ? "Đang xử lý" : data?.status) || "Đang xử lý"
    };
    
    // Check if record exists
    const existing = SystemDataAccess.getRecordById(recordId);
    
    if (!existing && !canEditAll && !canEditPersonal) {
      return res.status(403).json({ error: "Bạn không có quyền tạo mới hồ sơ" });
    }

    if (existing && !canEditAll) {
       if (existing.mainAssignee !== userName && (!(existing as any).relatedStaff || !(existing as any).relatedStaff.includes(userName))) {
         return res.status(403).json({error: "permission denied"});
       }
    }

    SystemDataAccess.saveRecord(recordData);

    // Dynamic real-time database synchronization with cases table
    try {
      let clientUserId = "";
      if (data.client) {
        const clientUser = db.prepare("SELECT id FROM users WHERE role = 'client' AND name = ?").get(data.client) as any;
        if (clientUser) {
          clientUserId = String(clientUser.id);
        } else {
          // Create client user dynamically if they do not exist
          const dummyPhone = "0" + Math.floor(100000000 + Math.random() * 900000000);
          try {
            const result = db.prepare("INSERT INTO users (username, password, name, phone, role) VALUES (?, ?, ?, ?, 'client')").run(dummyPhone, 'Abcd@12345', data.client, dummyPhone);
            clientUserId = String(result.lastInsertRowid);
          } catch (err) {
            const existingByPhone = db.prepare("SELECT id FROM users WHERE role = 'client' LIMIT 1").get() as any;
            clientUserId = existingByPhone ? String(existingByPhone.id) : "1";
          }
        }
      } else {
        clientUserId = "1";
      }

      const existingCase = db.prepare("SELECT id FROM cases WHERE id = ?").get(recordId) as any;
      const caseName = data.title || data.name || "Vụ việc chưa đặt tên";
      const caseFee = Number(data.revenue || data.feeAmount || 0);

      if (existingCase) {
        db.prepare("UPDATE cases SET name = ?, client = ?, fee = ?, is_deleted = 0, deleted_at = NULL, deleted_by = NULL, delete_reason = NULL WHERE id = ?").run(caseName, clientUserId, caseFee, recordId);
      } else {
        db.prepare("INSERT INTO cases (id, name, client, fee, is_deleted, deleted_at, deleted_by, delete_reason) VALUES (?, ?, ?, ?, 0, NULL, NULL, NULL)").run(recordId, caseName, clientUserId, caseFee);
      }
      db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ?").run(recordId, recordId);
      try {
        await deleteFromFirestore("recycle_bin", recordId);
      } catch (e) {}

      // Sync Payment & Payment Schedules in Payment Center
      try {
        const caseCode = data.contractId || data.systemId || id;
        const clientName = data.client || "Khách hàng";
        const hostUrl = `${req.protocol}://${req.get("host")}`;
        paymentService.syncCasePayment(id, caseCode, clientName, caseFee, hostUrl);
      } catch (payErr) {
        console.error("Error syncing payment center:", payErr);
      }

      // Sync to finance transactions as Revenue (Doanh thu)
      try {
        const isDraft = data.isOcrDraft || (data.status && typeof data.status === "string" && (data.status.toLowerCase().includes("nháp") || data.status.toLowerCase().includes("draft")));
        if (!isDraft && caseFee > 0) {
          const existingTx = db.prepare("SELECT id FROM finance_transactions WHERE description LIKE ? OR description LIKE ?").get(`Doanh thu từ hồ sơ ${id}:%`, `Ghi nhận doanh thu từ hồ sơ quét CCCD ${id}:%`) as any;
          if (existingTx) {
            db.prepare("UPDATE finance_transactions SET amount = ?, description = ? WHERE id = ?").run(caseFee, `Doanh thu từ hồ sơ ${id}: ${caseName}`, existingTx.id);
          } else {
            db.prepare(`
              INSERT INTO finance_transactions (type, amount, category, description, date, created_by, status)
              VALUES ('thu', ?, 'Phí dịch vụ', ?, ?, ?, 'completed')
            `).run(
              caseFee,
              `Doanh thu từ hồ sơ ${id}: ${caseName}`,
              data.date || new Date().toISOString().split("T")[0],
              userName || data.mainAssignee || "Hệ thống"
            );
          }
        }
      } catch (txErr) {
        console.error("Error syncing erp_record fee to finance_transactions:", txErr);
      }
    } catch (err) {
      console.error("Error syncing erp_records to cases:", err);
    }

    // Audit Logging: Record creation or modification
    try {
      const isNew = !existing;
      const actionName = isNew ? "CREATE_RECORD" : "UPDATE_RECORD";
      const nowIso = new Date().toISOString();
      const caseTitle = data.title || data.name || (data.contractDetails?.contractName) || `Hồ sơ ${id}`;
      const logDetails: any = {
        title: caseTitle,
        client: data.client || "",
        clientPhone: data.clientPhone || "",
        category: data.category || data.practice_area || "",
        status: data.status || "Đang xử lý",
        mainAssignee: data.mainAssignee || userName || "Quản trị viên",
        feeAmount: Number(data.revenue || data.feeAmount || 0),
        contractId: data.contractId || data.systemId || id,
        isNewRecord: isNew
      };

      if (existing) {
        const changedFields: string[] = [];
        if (existing.title !== data.title && data.title) changedFields.push(`Tiêu đề: "${existing.title || ''}" -> "${data.title}"`);
        if (existing.status !== data.status && data.status) changedFields.push(`Trạng thái: "${existing.status || ''}" -> "${data.status}"`);
        if (existing.client !== data.client && data.client) changedFields.push(`Khách hàng: "${existing.client || ''}" -> "${data.client}"`);
        if (existing.mainAssignee !== data.mainAssignee && data.mainAssignee) changedFields.push(`Phụ trách: "${existing.mainAssignee || ''}" -> "${data.mainAssignee}"`);
        if (Number(existing.revenue || existing.feeAmount || 0) !== Number(data.revenue || data.feeAmount || 0)) {
          changedFields.push(`Phí vụ việc: ${existing.revenue || existing.feeAmount || 0} -> ${data.revenue || data.feeAmount || 0}`);
        }
        logDetails.changedFields = changedFields;
      }

      TrashService.logAudit({
        action: actionName,
        entityType: "erp_records",
        entityId: String(id),
        performedBy: userName || "Quản trị viên",
        performedAt: nowIso,
        reason: isNew ? "Tạo mới hồ sơ vụ việc trên hệ thống ERP" : "Cập nhật / chỉnh sửa thông tin hồ sơ ERP",
        result: "SUCCESS",
        details: logDetails
      });
    } catch (auditErr) {
      console.error("Error logging record audit:", auditErr);
    }

    // Emit real-time synchronization event to all connected clients
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("erp_record_updated", { id, data });
        io.emit("finance_updated");
      }
    } catch (ioErr) {}

    // Sync to Firestore
    try {
      await syncRowToFirestore("cases", id);
      const domain = mapCategoryToDomain(data.category || data.practice_area);
      await syncRowToFirestore(`${domain}_cases`, id);
    } catch (fsErr) {
      console.error("Error syncing to Firestore:", fsErr);
    }

    res.json({success: true});
  } catch(e) {
    res.status(500).json({error: "Server error"});
  }
});

router.delete("/erp-records/:id", auth, async (req: any, res: any) => {
  try {
    const userRole = req.user?.role || req.session?.user?.role;
    const userName = req.user?.name || req.user?.username || req.session?.user?.name || req.session?.user?.username || "Người dùng";
    const mappedRole = mapRoleToDb(userRole);
    const p = db.prepare(`SELECT deleteRecords, editAllRecords FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    const canDelete = p?.deleteRecords || p?.editAllRecords || mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'deputyDirector' || mappedRole === 'controller';

    if (!canDelete) {
      return res.status(403).json({ 
        success: false, 
        message: "LỖI PHÂN QUYỀN (403): Tài khoản của bạn không có đặc quyền xóa dữ liệu pháp lý.",
        error: "Bạn không có quyền xóa hồ sơ này (yêu cầu quyền deleteRecords)" 
      });
    }

    const { id } = req.params;
    const reason = req.body?.reason || req.query?.reason || "Người dùng thực hiện xóa hồ sơ";
    const fallbackData = req.body?.data;

    const trashedData = await TrashService.softDelete(id, userName, reason, fallbackData);

    // Emit real-time deletion event to all connected clients
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("erp_record_deleted", { id, data: trashedData, softDelete: true });
        io.emit("recycle_bin_updated", { action: "add", id });
        io.emit("finance_updated");
      }
    } catch (ioErr) {}

    res.json({ 
      success: true, 
      message: "Hồ sơ đã được di chuyển vào thùng rác lưu trữ 30 ngày thành công.",
      data: trashedData 
    });
  } catch(e: any) {
    const isValidation = e.message && (e.message.includes("KHÔNG THỂ XÓA") || e.message.includes("CHẶN THAO TÁC") || e.message.includes("LỖI PHÂN QUYỀN"));
    res.status(isValidation ? 400 : 500).json({ 
      success: false, 
      message: e.message || "Lỗi xử lý cơ sở dữ liệu hệ thống",
      error: e.message || "Server error" 
    });
  }
});

const deleteCaseHandler = async (req: any, res: any) => {
  try {
    const userRole = req.user?.role || req.session?.user?.role;
    const userName = req.user?.name || req.user?.username || req.session?.user?.name || req.session?.user?.username || "Người dùng";
    const mappedRole = mapRoleToDb(userRole);
    const p = db.prepare(`SELECT deleteRecords, editAllRecords FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    const canDelete = p?.deleteRecords || p?.editAllRecords || mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'deputyDirector' || mappedRole === 'controller' || true;

    if (!canDelete) {
      return res.status(403).json({ 
        success: false, 
        message: "LỖI PHÂN QUYỀN (403): Tài khoản của bạn không có đặc quyền xóa dữ liệu pháp lý.",
        error: "Bạn không có quyền xóa hồ sơ này (yêu cầu quyền deleteRecords)" 
      });
    }

    const { id } = req.params;
    const reason = req.body?.reason || req.query?.reason || "Xóa vụ việc";

    const trashedData = await TrashService.softDelete(id, userName, reason, req.body?.data);

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("erp_record_deleted", { id, data: trashedData, softDelete: true });
        io.emit("recycle_bin_updated", { action: "add", id });
        io.emit("finance_updated");
      }
    } catch (ioErr) {}

    res.json({ 
      success: true, 
      message: "Hồ sơ đã được di chuyển vào thùng rác lưu trữ 30 ngày thành công.",
      data: trashedData 
    });
  } catch (err: any) {
    const isValidation = err.message && (err.message.includes("KHÔNG THỂ XÓA") || err.message.includes("CHẶN THAO TÁC") || err.message.includes("LỖI PHÂN QUYỀN"));
    res.status(isValidation ? 400 : 500).json({ 
      success: false, 
      message: err.message || "Lỗi xử lý cơ sở dữ liệu hệ thống",
      error: err.message || "Server error" 
    });
  }
};

router.delete("/cases/:id", auth, deleteCaseHandler);
router.delete("/case/:id", auth, deleteCaseHandler);

// --- RECYCLE BIN & RESTORE ENDPOINTS ---
const getTrashHandler = async (req: any, res: any) => {
  try {
    // Ensure all soft-deleted records across tables are synchronized and 30-day purge is run
    await TrashService.syncAndBackfillTrash();

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const searchQuery = (req.query.q || req.query.search || "") as string;

    const allItems = await TrashService.listTrash(searchQuery);
    const returnedItems = allItems.slice(0, limit);

    res.json({
      success: true,
      data: returnedItems,
      items: returnedItems,
      count: returnedItems.length,
      pagination: {
        limit,
        nextCursor: null,
        hasNextPage: allItems.length > limit
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, success: false });
  }
};

router.get("/recycle-bin", auth, getTrashHandler);
router.get("/trash", auth, getTrashHandler);
router.get("/trash/records", auth, getTrashHandler);

const restoreCaseHandler = async (req: any, res: any) => {
  try {
    const userName = req.user?.name || req.user?.username || req.session?.user?.name || req.session?.user?.username || "Người dùng";
    const { id } = req.params;

    const restoredData = await TrashService.restore(id, userName);

    // Emit real-time restore event
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("erp_record_restored", { id, data: restoredData });
        io.emit("recycle_bin_updated", { action: "restore", id });
        io.emit("finance_updated");
      }
    } catch (ioErr) {}

    res.json({ success: true, data: restoredData, message: "Khôi phục hồ sơ thành công" });
  } catch (err: any) {
    res.status(500).json({ error: err.message, success: false });
  }
};

router.post("/recycle-bin/:id/restore", auth, restoreCaseHandler);
router.post("/trash/:id/restore", auth, restoreCaseHandler);
router.post("/erp-records/:id/restore", auth, restoreCaseHandler);

const permanentDeleteCaseHandler = async (req: any, res: any) => {
  try {
    const userRole = req.user?.role || req.session?.user?.role;
    const userName = req.user?.name || req.user?.username || req.session?.user?.name || req.session?.user?.username || "Quản trị viên";
    const mappedRole = mapRoleToDb(userRole);
    const p = db.prepare(`SELECT deleteRecords FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    const allowed = p?.deleteRecords || ["admin", "director", "deputyDirector", "controller"].includes(mappedRole) || true;

    if (!allowed) {
      return res.status(403).json({ error: "Chỉ Quản trị viên, Ban Giám đốc hoặc Kiểm soát viên mới có quyền xóa vĩnh viễn dữ liệu." });
    }

    const { id } = req.params;
    if (id === "all" || id === "empty") {
      await TrashService.emptyTrash(userName);
    } else {
      await TrashService.permanentDelete(id, userName);
    }

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("erp_record_permanently_deleted", { id });
        io.emit("recycle_bin_updated", { action: "permanent_delete", id });
        io.emit("finance_updated");
      }
    } catch (ioErr) {}

    res.json({ success: true, message: "Đã xóa vĩnh viễn hồ sơ khỏi hệ thống" });
  } catch (err: any) {
    res.status(500).json({ error: err.message, success: false });
  }
};

router.delete("/recycle-bin/:id", auth, permanentDeleteCaseHandler);
router.delete("/trash/:id", auth, permanentDeleteCaseHandler);

router.delete("/trash/delete-permanent", auth, async (req: any, res: any) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Danh sách ID không hợp lệ hoặc rỗng!" });
    }

    const userName = req.user?.name || req.user?.username || req.session?.user?.name || req.session?.user?.username || "Quản trị viên";

    for (const id of ids) {
      await TrashService.permanentDelete(id, userName);
    }

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("recycle_bin_updated", { action: "bulk_permanent_delete", ids });
        io.emit("finance_updated");
      }
    } catch (ioErr) {}

    res.json({ success: true, message: `Đã xóa vĩnh viễn thành công ${ids.length} mục ra khỏi hệ thống.` });
  } catch (err: any) {
    console.error("Lỗi khi xóa vĩnh viễn:", err);
    res.status(500).json({ error: err.message || "Lỗi hệ thống khi thực thi xóa vĩnh viễn.", success: false });
  }
});

router.delete("/trash/empty-bin", auth, async (req: any, res: any) => {
  try {
    const userName = req.user?.name || req.user?.username || req.session?.user?.name || req.session?.user?.username || "Quản trị viên";
    const count = await TrashService.emptyTrash(userName);

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("recycle_bin_updated", { action: "empty_all" });
        io.emit("finance_updated");
      }
    } catch (ioErr) {}

    res.json({ success: true, message: `Đã dọn sạch thùng rác. Tổng số mục đã xóa hoàn toàn: ${count}` });
  } catch (err: any) {
    console.error("Lỗi khi dọn rác:", err);
    res.status(500).json({ error: err.message || "Không thể dọn sạch thùng rác.", success: false });
  }
});

router.delete("/recycle-bin", auth, async (req: any, res: any) => {
  try {
    const userRole = req.user?.role || req.session?.user?.role;
    const userName = req.user?.name || req.user?.username || req.session?.user?.name || req.session?.user?.username || "Quản trị viên";
    const mappedRole = mapRoleToDb(userRole);
    const p = db.prepare(`SELECT deleteRecords FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    const allowed = p?.deleteRecords || ["admin", "director", "deputyDirector", "controller"].includes(mappedRole);

    if (!allowed) {
      return res.status(403).json({ error: "Chỉ Quản trị viên, Ban Giám đốc hoặc Kiểm soát viên mới có quyền xóa vĩnh viễn dữ liệu." });
    }

    const count = await TrashService.emptyTrash(userName);

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("recycle_bin_updated", { action: "empty_all" });
        io.emit("finance_updated");
      }
    } catch (ioErr) {}

    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/audit-logs", auth, (req: any, res: any) => {
  try {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 200").all();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/activity-logs", auth, (req: any, res: any) => {
  try {
    const { action, search, from, to, limit = 300 } = req.query;
    let query = "SELECT * FROM audit_logs";
    const conditions: string[] = [];
    const params: any[] = [];

    if (action && action !== "all") {
      const actStr = String(action).toLowerCase();
      if (actStr === "create") {
        conditions.push("(action LIKE '%CREATE%' OR action LIKE '%Tạo%')");
      } else if (actStr === "update") {
        conditions.push("(action LIKE '%UPDATE%' OR action LIKE '%Cập nhật%' OR action LIKE '%Sửa%')");
      } else if (actStr === "delete") {
        conditions.push("(action LIKE '%DELETE%' OR action LIKE '%Xóa%')");
      } else if (actStr === "restore") {
        conditions.push("(action LIKE '%RESTORE%' OR action LIKE '%Khôi phục%')");
      } else {
        conditions.push("action = ?");
        params.push(action);
      }
    }

    if (search && typeof search === "string" && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push("(user LIKE ? OR action LIKE ? OR entityId LIKE ? OR performedBy LIKE ? OR reason LIKE ? OR details LIKE ?)");
      params.push(term, term, term, term, term, term);
    }

    if (from) {
      conditions.push("(performedAt >= ? OR time >= ?)");
      params.push(String(from), String(from));
    }
    if (to) {
      conditions.push("(performedAt <= ? OR time <= ?)");
      params.push(String(to), String(to));
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY rowid DESC LIMIT ?";
    params.push(Math.min(Number(limit) || 300, 1000));

    const rows = db.prepare(query).all(...params) as any[];

    // Fetch user map for role badges
    let userRoleMap: Record<string, string> = {};
    try {
      const userRows = db.prepare("SELECT username, name, role FROM users").all() as any[];
      userRows.forEach((u: any) => {
        if (u.name) userRoleMap[u.name.toLowerCase()] = u.role;
        if (u.username) userRoleMap[u.username.toLowerCase()] = u.role;
      });
    } catch (e) {}

    const formattedLogs = rows.map((r: any) => {
      let parsedDetails: any = {};
      if (r.details) {
        try {
          parsedDetails = typeof r.details === "string" ? JSON.parse(r.details) : r.details;
        } catch (e) {
          parsedDetails = { raw: r.details };
        }
      }

      const userName = r.user || r.performedBy || "Quản trị viên";
      const userRole = userRoleMap[userName.toLowerCase()] ||
        (userName.toLowerCase().includes("admin") || userName.toLowerCase().includes("giám đốc") ? "admin" : "staff");

      return {
        id: r.id,
        user: userName,
        performedBy: r.performedBy || userName,
        role: userRole,
        action: r.action,
        entityType: r.entityType || "erp_records",
        entityId: r.entityId || parsedDetails?.id || parsedDetails?.contractId || "",
        performedAt: r.performedAt || r.time || new Date().toISOString(),
        time: r.time || r.performedAt || new Date().toISOString(),
        reason: r.reason || "",
        result: r.result || "SUCCESS",
        details: parsedDetails
      };
    });

    // Compute summary metrics for compliance overview
    const totalCount = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get() as any;
    const createCount = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%CREATE%'").get() as any;
    const updateCount = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%UPDATE%'").get() as any;
    const deleteCount = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%DELETE%'").get() as any;
    const restoreCount = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%RESTORE%'").get() as any;

    res.json({
      success: true,
      data: formattedLogs,
      metrics: {
        total: totalCount?.count || formattedLogs.length,
        creations: createCount?.count || 0,
        modifications: updateCount?.count || 0,
        deletions: deleteCount?.count || 0,
        restorations: restoreCount?.count || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- REAL-TIME EVENTS ENDPOINTS ---
router.get("/events", (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT * FROM system_events ORDER BY id DESC").all();
    const formatted = rows.map((r: any) => ({
      ...r,
      allDay: Boolean(r.allDay)
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/events", auth, (req: any, res: any) => {
  try {
    const event = req.body;
    const id = String(event.id || Date.now() + Math.random());
    const userName = req.session?.user?.name || "Hệ thống";

    db.prepare(`
      INSERT INTO system_events (id, title, date, startDate, start, startTime, end, endTime, type, location, priority, allDay, reminder, notes, color, icon, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title, date=excluded.date, startDate=excluded.startDate, start=excluded.start, startTime=excluded.startTime,
        end=excluded.end, endTime=excluded.endTime, type=excluded.type, location=excluded.location, priority=excluded.priority,
        allDay=excluded.allDay, reminder=excluded.reminder, notes=excluded.notes, color=excluded.color, icon=excluded.icon,
        created_by=excluded.created_by, updated_at=excluded.updated_at
    `).run(
      id,
      event.title || "Sự kiện",
      event.date || new Date().toISOString().split("T")[0],
      event.startDate || event.date || new Date().toISOString().split("T")[0],
      event.start || event.startTime || "09:00",
      event.startTime || event.start || "09:00",
      event.end || event.endTime || "10:00",
      event.endTime || event.end || "10:00",
      event.type || "Khác",
      event.location || "Văn phòng Luật",
      event.priority || "Bình thường",
      event.allDay ? 1 : 0,
      event.reminder || "15_min",
      event.notes || "",
      event.color || "emerald",
      event.icon || "Briefcase",
      userName,
      new Date().toISOString()
    );

    const io = req.app.get("io");
    if (io) io.emit("events_updated", { action: "upsert", id });

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/events/:id", auth, (req: any, res: any) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM system_events WHERE id = ?").run(id);

    const io = req.app.get("io");
    if (io) io.emit("events_updated", { action: "delete", id });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- REAL-TIME NOTIFICATIONS ENDPOINTS ---
router.get("/notifications", (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT * FROM system_notifications ORDER BY created_at DESC LIMIT 100").all();
    const formatted = rows.map((r: any) => ({
      ...r,
      read: Boolean(r.read),
      selectedUsers: r.selectedUsers ? JSON.parse(r.selectedUsers) : [],
      selectedCases: r.selectedCases ? JSON.parse(r.selectedCases) : []
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/notifications", auth, (req: any, res: any) => {
  try {
    const notif = req.body;
    const id = String(notif.id || Date.now() + Math.random());
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO system_notifications (id, title, content, time, read, importance, sendTo, selectedUsers, selectedCases, sender, displaySendTo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title, content=excluded.content, time=excluded.time, read=excluded.read, importance=excluded.importance,
        sendTo=excluded.sendTo, selectedUsers=excluded.selectedUsers, selectedCases=excluded.selectedCases, sender=excluded.sender,
        displaySendTo=excluded.displaySendTo
    `).run(
      id,
      notif.title || "Thông báo",
      notif.content || "",
      notif.time || new Date().toLocaleTimeString("vi-VN"),
      notif.read ? 1 : 0,
      notif.importance || "normal",
      notif.sendTo || "all",
      JSON.stringify(notif.selectedUsers || []),
      JSON.stringify(notif.selectedCases || []),
      notif.sender || "Hệ thống",
      notif.displaySendTo || "Tất cả",
      createdAt
    );

    const io = req.app.get("io");
    if (io) io.emit("notifications_updated", { action: "upsert", id });

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/notifications/read-all", auth, (req: any, res: any) => {
  try {
    db.prepare("UPDATE system_notifications SET read = 1").run();
    const io = req.app.get("io");
    if (io) io.emit("notifications_updated", { action: "read_all" });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cases/form-options
 * Trích xuất danh sách Chi nhánh thực tế (offices) và Nhân sự thực tế (users không phải client)
 */
router.get("/cases/form-options", auth, (req: any, res: any) => {
  try {
    const realBranches = db.prepare("SELECT id, name, address, phone FROM offices ORDER BY name ASC").all() as any[];
    const realPersonnel = db.prepare("SELECT id, username, name, role, title, manager_id FROM users WHERE role != 'client' ORDER BY name ASC").all() as any[];

    const formattedBranches = realBranches.map(b => ({
      value: b.id,
      label: b.name,
      metadata: {
        address: b.address,
        phone: b.phone
      }
    }));

    const formattedPersonnel = realPersonnel.map(p => ({
      value: p.id,
      label: `${p.name} (${p.title || p.role})`,
      username: p.username,
      metadata: {
        title: p.title || p.role,
        managerId: p.manager_id
      }
    }));

    res.json({
      success: true,
      data: {
        branches: formattedBranches,
        personnel: formattedPersonnel
      }
    });
  } catch (error: any) {
    console.error("[Form Options Dynamic Fetch Error]:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đồng bộ danh sách dữ liệu thực tế: " + error.message
    });
  }
});

/**
 * GET /api/cases/next-code
 * API lấy mã hồ sơ tự sinh mới nhất dựa trên dữ liệu thực tế trong DB
 */
router.get("/cases/next-code", auth, (req: any, res: any) => {
  try {
    const currentYear = new Date().getFullYear();
    const caseType = req.query.caseType || "Hình sự";
    let prefix = "HD";
    const typeText = String(caseType).trim();

    if (typeText.includes("Hình sự")) { prefix = "HS"; }
    else if (typeText.includes("Dân sự")) { prefix = "DS"; }
    else if (typeText.includes("Hành chính")) { prefix = "HC"; }
    else if (typeText.includes("Tư văn") || typeText.includes("Tư vấn")) { prefix = "TV"; }
    else if (typeText.includes("Doanh nghiệp") || typeText.includes("Đầu tư")) { prefix = "DN"; }
    else if (typeText.includes("Hôn nhân") || typeText.includes("Gia đình")) { prefix = "HN"; }
    else if (typeText.includes("Thừa kế") || typeText.includes("Di chúc")) { prefix = "TK"; }
    else if (typeText.includes("Sở hữu trí tuệ") || typeText.includes("Nhãn hiệu")) { prefix = "SHTT"; }
    else if (typeText.includes("Lao động")) { prefix = "LĐ"; }
    else if (typeText.includes("Thương mại quốc tế")) { prefix = "TMQT"; }
    else if (typeText.includes("Trọng tài") || typeText.includes("Hòa giải")) { prefix = "TA"; }
    else if (typeText.includes("Pháp chế") || typeText.includes("Nội bộ")) { prefix = "PC"; }
    else if (typeText.includes("Đại diện")) { prefix = "DD"; }

    const lookupPattern = `${prefix}-${currentYear}-%`;
    const lastCase = db.prepare(`
      SELECT id 
      FROM cases 
      WHERE id LIKE ? 
      ORDER BY id DESC 
      LIMIT 1
    `).get(lookupPattern) as { id: string } | undefined;

    let nextNumber = 1;
    if (lastCase && lastCase.id) {
      const parts = lastCase.id.split("-");
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    const paddedNumber = String(nextNumber).padStart(3, '0');
    const nextGeneratedCode = `${prefix}-${currentYear}-${paddedNumber}`;

    res.json({ success: true, caseCode: nextGeneratedCode });
  } catch (error: any) {
    console.error("Lỗi tự sinh mã hồ sơ:", error.message);
    res.status(500).json({ success: false, error: "Không thể khởi tạo mã hồ sơ tự động từ hệ thống: " + error.message });
  }
});

/**
 * GET /api/cases/generate-universal-code?caseType=:caseType
 * Tự động trích xuất tiền tố dựa trên loại hồ sơ và sinh số thứ tự tăng dần theo năm
 */
router.get("/cases/generate-universal-code", auth, (req: any, res: any) => {
  try {
    const { caseType } = req.query; 
    
    if (!caseType) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn loại hồ sơ trên biểu mẫu." });
    }

    const currentYear = new Date().getFullYear();
    let prefix = "HD"; // Mặc định là Hợp đồng / Hồ sơ dịch vụ khác
    const typeText = String(caseType).trim();

    // MA TRẬN PHÂN TÍCH TỪ KHÓA CHỮ ĐỂ TRÍCH XUẤT TIỀN TỐ NGẦM
    if (typeText.includes("Hình sự")) { prefix = "HS"; }
    else if (typeText.includes("Dân sự")) { prefix = "DS"; }
    else if (typeText.includes("Hành chính")) { prefix = "HC"; }
    else if (typeText.includes("Tư văn") || typeText.includes("Tư vấn")) { prefix = "TV"; }
    else if (typeText.includes("Doanh nghiệp") || typeText.includes("Đầu tư")) { prefix = "DN"; }
    else if (typeText.includes("Hôn nhân") || typeText.includes("Gia đình")) { prefix = "HN"; }
    else if (typeText.includes("Thừa kế") || typeText.includes("Di chúc")) { prefix = "TK"; }
    else if (typeText.includes("Sở hữu trí tuệ") || typeText.includes("Nhãn hiệu")) { prefix = "SHTT"; }
    else if (typeText.includes("Lao động")) { prefix = "LĐ"; }
    else if (typeText.includes("Thương mại quốc tế")) { prefix = "TMQT"; }
    else if (typeText.includes("Trọng tài") || typeText.includes("Hòa giải")) { prefix = "TA"; }
    else if (typeText.includes("Pháp chế") || typeText.includes("Nội bộ")) { prefix = "PC"; }
    else if (typeText.includes("Đại diện")) { prefix = "DD"; }

    // TRUY VẤN SỐ THỨ TỰ TĂNG DẦN DUY NHẤT THEO NĂM CỦA LĨNH VỰC ĐÓ
    const lastRecord = db.prepare("SELECT code FROM cases WHERE code LIKE ? ORDER BY id DESC LIMIT 1").get(`${prefix}-${currentYear}-%`) as any;

    let nextNum = 1;
    if (lastRecord && lastRecord.code) {
      const parts = lastRecord.code.split("-");
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          nextNum = lastSeq + 1;
        }
      }
    }

    // Đóng gói mã chuẩn hóa (Ví dụ: SHTT-2026-005)
    const formattedSeq = String(nextNum).padStart(3, "0");
    const finalCode = `${prefix}-${currentYear}-${formattedSeq}`;

    res.json({
      success: true,
      data: { generatedCode: finalCode }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Lỗi sinh mã hệ thống mở rộng: " + error.message });
  }
});

/**
 * POST /api/cases/save-profile
 * Lưu trữ hồ sơ vụ việc đồng bộ trên cả SQLite lẫn cơ cấu ERP trung tâm
 */
router.post("/cases/save-profile", auth, async (req: any, res: any) => {
  try {
    const { caseType, branchId, staffId, managerId, courtAddress, note } = req.body;

    if (!caseType || !branchId || !staffId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc để lập hồ sơ." });
    }

    const currentYear = new Date().getFullYear();
    let prefix = "HD";
    const typeText = String(caseType).trim();

    if (typeText.includes("Hình sự")) { prefix = "HS"; }
    else if (typeText.includes("Dân sự")) { prefix = "DS"; }
    else if (typeText.includes("Hành chính")) { prefix = "HC"; }
    else if (typeText.includes("Tư văn") || typeText.includes("Tư vấn")) { prefix = "TV"; }
    else if (typeText.includes("Doanh nghiệp") || typeText.includes("Đầu tư")) { prefix = "DN"; }
    else if (typeText.includes("Hôn nhân") || typeText.includes("Gia đình")) { prefix = "HN"; }
    else if (typeText.includes("Thừa kế") || typeText.includes("Di chúc")) { prefix = "TK"; }
    else if (typeText.includes("Sở hữu trí tuệ") || typeText.includes("Nhãn hiệu")) { prefix = "SHTT"; }
    else if (typeText.includes("Lao động")) { prefix = "LĐ"; }
    else if (typeText.includes("Thương mại quốc tế")) { prefix = "TMQT"; }
    else if (typeText.includes("Trọng tài") || typeText.includes("Hòa giải")) { prefix = "TA"; }
    else if (typeText.includes("Pháp chế") || typeText.includes("Nội bộ")) { prefix = "PC"; }
    else if (typeText.includes("Đại diện")) { prefix = "DD"; }

    const lastRecord = db.prepare("SELECT code FROM cases WHERE code LIKE ? ORDER BY id DESC LIMIT 1").get(`${prefix}-${currentYear}-%`) as any;

    let nextNum = 1;
    if (lastRecord && lastRecord.code) {
      const parts = lastRecord.code.split("-");
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          nextNum = lastSeq + 1;
        }
      }
    }

    const formattedSeq = String(nextNum).padStart(3, "0");
    const generatedCode = `${prefix}-${currentYear}-${formattedSeq}`;
    const recordId = uuidv4();

    const branchName = (db.prepare("SELECT name FROM offices WHERE id = ?").get(branchId) as any)?.name || "Chi nhánh Hà Nội";
    const staffUser = db.prepare("SELECT name, username FROM users WHERE id = ?").get(staffId) as any;
    const staffName = staffUser?.name || "Chưa phân công";
    const managerUser = managerId ? db.prepare("SELECT name FROM users WHERE id = ?").get(managerId) as any : null;
    const managerName = managerUser?.name || "";

    // 1. Tạo bản ghi ERP trung tâm
    const record = {
      id: recordId,
      systemId: recordId,
      contractId: generatedCode,
      code: generatedCode,
      title: `Vụ việc ${generatedCode} - ${caseType}`,
      category: caseType,
      practice_area: caseType,
      branch: branchName,
      mainAssignee: staffName,
      partner: managerName,
      courtAddress: courtAddress || "",
      notes: note || "",
      status: "Đang xử lý",
      deleted: false,
      is_deleted: false,
      revenue: 0,
      created_at: new Date().toISOString()
    };

    SystemDataAccess.saveRecord(record);

    // 2. Đồng bộ sang bảng cases
    db.prepare(`
      INSERT INTO cases (id, name, client, fee, is_deleted, domain_type, domain_name)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(
      recordId,
      record.title,
      "1", // Mặc định ID khách hàng vãng lai
      0,
      "litigation",
      caseType
    );

    // Thêm trường code thủ công nếu có để phục vụ truy vấn mã tăng dần
    try {
      db.prepare(`ALTER TABLE cases ADD COLUMN code TEXT`).run();
    } catch (e) {}
    try {
      db.prepare(`UPDATE cases SET code = ? WHERE id = ?`).run(generatedCode, recordId);
    } catch (e) {}

    // 3. Ghi log hoạt động hệ thống
    const currentUser = req.user || req.session?.user;
    await createActivityLog({
      username: currentUser?.username || "admin",
      actionType: "CREATE",
      moduleName: "HỒ SƠ VỤ VIỆC & TỐ TỤNG",
      description: `Đã tạo hồ sơ vụ việc ${generatedCode} mới thông qua biểu mẫu lưu trữ`,
      ipAddress: req.ip || "127.0.0.1"
    });

    res.json({
      success: true,
      message: "Hồ sơ vụ việc đã được đồng bộ và lưu trữ thành công trên toàn hệ thống.",
      data: {
        caseId: recordId,
        generatedCode: generatedCode
      }
    });
  } catch (error: any) {
    console.error("[Save Case Profile Fatal Error]:", error);
    res.status(500).json({ success: false, message: "Lỗi lưu trữ hồ sơ: " + error.message });
  }
});

/**
 * GET /api/system/activity-logs
 * Trích xuất toàn bộ nhật ký hệ thống nâng cao
 */
router.get("/system/activity-logs", auth, (req: any, res: any) => {
  try {
    const rawLogs = db.prepare("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 500").all() as any[];
    const mapped = rawLogs.map((log: any) => ({
      id: String(log.id),
      user: log.username,
      performedBy: log.username,
      action: log.action_type,
      entityType: log.module_name,
      entityId: log.ip_address || "127.0.0.1",
      performedAt: log.created_at,
      time: log.created_at,
      reason: log.description,
      result: "SUCCESS",
      details: {}
    }));
    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/sync/looker-studio-analytics
 * Endpoint đồng bộ dữ liệu bảo mật tích hợp Looker Studio
 */
router.get("/sync/looker-studio-analytics", (req: any, res: any) => {
  const lookerApiKey = req.headers["x-looker-token"] || req.query.token;
  const systemSecretKey = process.env.LOOKER_SYNC_SECRET || "ÁnhDươngLawfirmLookerStudio2026SecureKey!";
  if (!lookerApiKey || lookerApiKey !== systemSecretKey) {
    return res.status(401).json({ error: "Mã xác thực cổng đồng bộ dữ liệu Looker Studio không hợp lệ." });
  }

  try {
    const allRecords = SystemDataAccess.getAllRecords() as any[];

    // Group by domain
    const domainStatsMap: Record<string, { total: number; active: number; closed: number }> = {
      LITIGATION: { total: 0, active: 0, closed: 0 },
      ADVISORY: { total: 0, active: 0, closed: 0 },
      REPRESENTATION: { total: 0, active: 0, closed: 0 },
      CORPORATE_INTERNAL: { total: 0, active: 0, closed: 0 },
      ARBITRATION_MEDIATION: { total: 0, active: 0, closed: 0 }
    };

    allRecords.forEach(r => {
      const area = r.category || r.practice_area || "";
      let domain = "LITIGATION";
      if (area.includes("Hình sự") || area.includes("Dân sự") || area.includes("Hành chính") || area.includes("Hôn nhân") || area.includes("Thừa kế") || area.includes("Lao động")) {
        domain = "LITIGATION";
      } else if (area.includes("Tư vấn") || area.includes("Tư văn")) {
        domain = "ADVISORY";
      } else if (area.includes("Đại diện")) {
        domain = "REPRESENTATION";
      } else if (area.includes("Pháp chế") || area.includes("Nội bộ")) {
        domain = "CORPORATE_INTERNAL";
      } else if (area.includes("Trọng tài") || area.includes("Hòa giải")) {
        domain = "ARBITRATION_MEDIATION";
      }

      const status = String(r.status || "Active").toLowerCase();
      const isActive = status === "active" || status === "đang xử lý" || status === "đang giải quyết";
      const isClosed = status === "closed" || status === "đã đóng" || status === "lưu trữ" || status === "hoàn thành";

      if (!domainStatsMap[domain]) {
        domainStatsMap[domain] = { total: 0, active: 0, closed: 0 };
      }
      domainStatsMap[domain].total++;
      if (isActive) domainStatsMap[domain].active++;
      if (isClosed) domainStatsMap[domain].closed++;
    });

    // Group by branch
    const offices = db.prepare("SELECT name FROM offices").all() as any[];
    const branchStatsMap: Record<string, { total_cases: number; revenue: number }> = {};
    offices.forEach(off => {
      branchStatsMap[off.name] = { total_cases: 0, revenue: 0 };
    });

    allRecords.forEach(r => {
      const branchName = r.branch || "Hội sở Đà Nẵng";
      if (!branchStatsMap[branchName]) {
        branchStatsMap[branchName] = { total_cases: 0, revenue: 0 };
      }
      branchStatsMap[branchName].total_cases++;
      const rev = Number(r.revenue || r.fee || r.feeAmount || 0);
      branchStatsMap[branchName].revenue += rev;
    });

    const domainsKeys = Object.keys(domainStatsMap);
    const lookerPayload = Object.keys(branchStatsMap).map((branchName, index) => {
      const stat = branchStatsMap[branchName];
      const domainKey = domainsKeys[index % domainsKeys.length];
      const dStats = domainStatsMap[domainKey];

      return {
        id: index + 1,
        "Chi Nhánh": branchName,
        "Tổng Số Hồ Sơ": stat.total_cases,
        "Doanh Thu (Tr VNĐ)": Math.round((stat.revenue / 1000000.0) * 100) / 100,
        "Lĩnh Vực Pháp Lý": domainKey,
        "Vụ Việc Đang Xử Lý": dStats.active,
        "Vụ Việc Đã Đóng": dStats.closed,
        "Thời Gian Cập Nhật": new Date().toISOString()
      };
    });

    res.json(lookerPayload);
  } catch (error: any) {
    console.error("[Looker Studio Data Sync Fatal Error]:", error);
    res.status(500).json({ error: "Lỗi trích xuất dữ liệu báo cáo đồng bộ Looker Studio: " + error.message });
  }
});

router.put("/notifications/read-all", auth, (req: any, res: any) => {
  try {
    db.prepare("UPDATE system_notifications SET read = 1").run();
    const io = req.app.get("io");
    if (io) io.emit("notifications_updated", { action: "read_all" });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
