import express from "express";
import db from "../../db/database";
import { auth, requireRoles } from "../../middleware/auth";
import { syncToFirestore, syncRowToFirestore, deleteFromFirestore } from "../../db/firestore-sync";
import TrashService from "../../services/trash.service";

import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { SystemDataAccess } from "../../system/data-access/SystemDataAccess";

const router = express.Router();

router.get("/appointments", auth, (req: any, res: any) => {
  try {
    const user = req.user || req.session?.user;
    const accountType = String(user?.account_type || user?.accountType || "").toUpperCase();
    const isClient = accountType === "CUSTOMER" || ["client", "customer"].includes(String(user?.role || "").toLowerCase());
    let query = `
      SELECT id, client_name as clientName, phone, category,
             date_time as dateTime, assigned_staff as assignedStaff,
             type, notes, status, created_at as createdAt
      FROM appointments`;
    const params: string[] = [];
    if (isClient) {
      query += " WHERE client_name = ? OR phone = ?";
      params.push(user?.name || "", user?.phone || "");
    }
    query += " ORDER BY id DESC";
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load appointments" });
  }
});

router.post("/appointments", auth, (req: any, res: any) => {
  try {
    const user = req.user || req.session?.user;
    const payload = req.body || {};
    const accountType = String(user?.account_type || user?.accountType || "").toUpperCase();
    const isClient = accountType === "CUSTOMER" || ["client", "customer"].includes(String(user?.role || "").toLowerCase());
    if (!payload.dateTime || !payload.category || !payload.type || (isClient && !user?.name)) {
      return res.status(400).json({ error: "Thiếu thông tin lịch hẹn." });
    }
    const id = String(payload.id || `appt-client-${Date.now()}`);
    const clientName = isClient ? user.name : String(payload.clientName || "");
    const phone = isClient ? user.phone || "" : String(payload.phone || "");
    if (!clientName || !phone) return res.status(400).json({ error: "Thiếu thông tin khách hàng." });
    db.prepare(`
      INSERT INTO appointments (
        id, client_name, phone, category, date_time, assigned_staff,
        type, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(id, clientName, phone, payload.category, payload.dateTime, payload.assignedStaff || "Đang phân công", payload.type, payload.notes || "", new Date().toISOString());
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create appointment" });
  }
});

router.put("/appointments/:id", requireRoles("admin", "director", "manager", "controller"), (req: any, res: any) => {
  try {
    const payload = req.body || {};
    const allowedFields = ["clientName", "phone", "category", "dateTime", "assignedStaff", "type", "notes", "status"];
    const updates: string[] = [];
    const values: any[] = [];
    const columnMap: Record<string, string> = {
      clientName: "client_name", dateTime: "date_time", assignedStaff: "assigned_staff",
      phone: "phone", category: "category", type: "type", notes: "notes", status: "status"
    };
    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updates.push(`${columnMap[field]} = ?`);
        values.push(payload[field]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: "Không có dữ liệu cập nhật." });
    values.push(req.params.id);
    db.prepare(`UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update appointment" });
  }
});

router.delete("/appointments/:id", requireRoles("admin", "director", "manager", "controller"), (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete appointment" });
  }
});

router.get("/portal-activities", requireRoles("admin", "director", "manager", "controller"), (req: any, res: any) => {
  try {
    const rows = db.prepare(`
      SELECT id, type, client_id as clientId, client_name as clientName,
             document_title as documentTitle, response_time_minutes as responseTimeMinutes,
             timestamp
      FROM portal_activities
      ORDER BY timestamp DESC
      LIMIT 100
    `).all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load portal activities" });
  }
});

router.post("/portal-activities", requireRoles("admin", "director", "manager", "controller"), (req: any, res: any) => {
  try {
    const payload = req.body || {};
    if (!payload.type || !payload.clientName) {
      return res.status(400).json({ error: "Thiếu thông tin hoạt động cổng khách hàng." });
    }
    const id = String(payload.id || `portal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    db.prepare(`
      INSERT INTO portal_activities (id, type, client_id, client_name, document_title, response_time_minutes, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      payload.type,
      payload.clientId || null,
      payload.clientName,
      payload.documentTitle || null,
      payload.responseTimeMinutes === undefined ? null : Number(payload.responseTimeMinutes),
      payload.timestamp || new Date().toISOString()
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create portal activity" });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = process.env.NODE_ENV === "production" ? path.join("/tmp", "uploads") : path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || !ext) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Get all threads for admin
router.get("/live-threads", requireRoles("admin", "director", "manager", "controller"), (req: any, res: any) => {
  try {
    const threads = db.prepare(`
      SELECT visitor_id, MAX(created_at) as last_message_time, SUM(CASE WHEN is_read=0 AND sender_type='visitor' THEN 1 ELSE 0 END) as unread_count 
      FROM live_messages 
      GROUP BY visitor_id 
      ORDER BY last_message_time DESC
    `).all();
    
    for (const t of threads as any[]) {
      const lastMsg = db.prepare('SELECT content, sender_type FROM live_messages WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1').get(t.visitor_id) as any;
      t.last_message = lastMsg?.content || 'Đã gửi file đính kèm';
      t.last_sender = lastMsg?.sender_type;
    }

    res.json(threads);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get messages for a specific authenticated portal visitor
router.get("/live-messages/:visitorId", auth, (req: any, res: any) => {
  try {
    const user = req.user || req.session?.user;
    const visitorId = String(req.params.visitorId || "");
    const isClient = String(user?.role || "").toLowerCase() === "client";
    const allowedVisitorIds = [String(user?.username || ""), `client_${user?.id}`];

    if (isClient && !allowedVisitorIds.includes(visitorId)) {
      return res.status(403).json({ error: "Bạn không có quyền xem cuộc trò chuyện này." });
    }

    const msgs = db.prepare('SELECT * FROM live_messages WHERE visitor_id = ? ORDER BY created_at ASC').all(req.params.visitorId);
    res.json(msgs);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Upload file for chat & CMS
router.post("/live-upload", auth, upload.single('file'), (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    url: fileUrl, 
    fileUrl: fileUrl, 
    name: req.file.originalname,
    fileName: req.file.originalname
  });
});

// Authenticated uploads for portal, internal chat, CMS, and document workflows.
router.post("/secure-upload", auth, upload.single('file'), (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    fileUrl,
    name: req.file.originalname,
    fileName: req.file.originalname
  });
});


// Get unique visitors via IP (in a real app, you'd use session/cookies or proper fingerprinting)
router.post("/record-view", (req: any, res: any) => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    db.prepare('INSERT OR IGNORE INTO visitor_stats (date, visitors, page_views, chats) VALUES (?, 0, 0, 0)').run(today);
    
    // Simplistic: just increment page_views. We could differentiate visitors if we wanted via a cookie.
    db.prepare('UPDATE visitor_stats SET page_views = page_views + 1 WHERE date = ?').run(today);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Failed to record view' });
  }
});

router.post("/record-visitor", (req: any, res: any) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    db.prepare('INSERT OR IGNORE INTO visitor_stats (date, visitors, page_views, chats) VALUES (?, 0, 0, 0)').run(today);
    db.prepare('UPDATE visitor_stats SET visitors = visitors + 1 WHERE date = ?').run(today);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Failed to record visitor' });
  }
});

// Messages Routes
router.post("/messages", (req: any, res: any) => {
  const { name, email, phone, content, file_url, file_name } = req.body;
  const created_at = new Date().toISOString();
  const today = created_at.split('T')[0];

  try {
    db.prepare('INSERT INTO messages (name, email, phone, content, file_url, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(name, email, phone, content, file_url || null, file_name || null, created_at);
      
    // Update chat stats
    db.prepare('INSERT OR IGNORE INTO visitor_stats (date, visitors, page_views, chats) VALUES (?, 0, 0, 0)').run(today);
    db.prepare('UPDATE visitor_stats SET chats = chats + 1 WHERE date = ?').run(today);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/messages", requireRoles("admin", "director", "manager", "controller"), (req: any, res: any) => {
  try {
    const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/messages/:id", requireRoles("admin", "director", "manager", "controller"), (req: any, res: any) => {
  const { is_read, reply_notes } = req.body;
  try {
    if (reply_notes !== undefined) {
      db.prepare('UPDATE messages SET is_read = ?, reply_notes = ? WHERE id = ?').run(is_read ? 1 : 0, reply_notes, req.params.id);
    } else {
      db.prepare('UPDATE messages SET is_read = ? WHERE id = ?').run(is_read ? 1 : 0, req.params.id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", auth, (req: any, res: any) => {
  try {
    let stats = db.prepare('SELECT * FROM visitor_stats ORDER BY date ASC').all() as any[];
    
    // Message stats
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number };
    const unreadMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_read = 0').get() as { count: number };
    
    // Legal services performance metrics from erp_records
    let records: any[] = [];
    try {
      records = SystemDataAccess.getAllRecords();
    } catch (e) {}

    const getRecordArea = (r: any) => {
      const pa = r.practice_area;
      if (pa) {
        if (pa === 'tranh_tung' || pa.includes('tranh') || pa.includes('dân sự')) return 'tranh_tung';
        if (pa === 'tu_van' || pa.includes('tư vấn')) return 'tu_van';
        if (pa === 'dai_dien_ngoai_to_tung' || pa.includes('ngoại tố tụng')) return 'dai_dien_ngoai_to_tung';
        if (pa === 'noi_bo' || pa.includes('nội bộ') || pa.includes('pháp chế')) return 'noi_bo';
        if (pa === 'trong_tai_hoa_giai' || pa.includes('trọng tài') || pa.includes('hòa giải')) return 'trong_tai_hoa_giai';
      }
      const cat = (r.category || r.type || r.description || r.title || "").toLowerCase();
      if (cat.includes("tranh tụng") || cat.includes("dân sự") || cat.includes("hình sự") || cat.includes("tố tụng")) return "tranh_tung";
      if (cat.includes("tư vấn") || cat.includes("consultancy") || cat.includes("pháp luật")) return "tu_van";
      if (cat.includes("ngoại tố tụng") || cat.includes("đại diện")) return "dai_dien_ngoai_to_tung";
      if (cat.includes("nội bộ") || cat.includes("pháp chế")) return "noi_bo";
      if (cat.includes("trọng tài") || cat.includes("hòa giải") || cat.includes("arbitration")) return "trong_tai_hoa_giai";
      return "unclassified";
    };

    const countTranhTung = records.filter(r => getRecordArea(r) === 'tranh_tung').length;
    const countTuVan = records.filter(r => getRecordArea(r) === 'tu_van').length;
    const countDaiDien = records.filter(r => getRecordArea(r) === 'dai_dien_ngoai_to_tung').length;
    const countNoiBo = records.filter(r => getRecordArea(r) === 'noi_bo').length;
    const countTrongTai = records.filter(r => getRecordArea(r) === 'trong_tai_hoa_giai').length;
    const countUnclassified = records.filter(r => getRecordArea(r) === 'unclassified').length;

    const sumRevenue = (area: string) => {
      return records
        .filter(r => getRecordArea(r) === area)
        .reduce((sum, r) => {
          const rawValue = r.feeAmount ?? r.fee ?? 0;
          const value = typeof rawValue === 'number' ? rawValue : Number(String(rawValue).replace(/[^0-9.-]/g, ''));
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);
    };

    const legalServicesPerformance = [
      { 
        name: 'Tranh tụng & Dân sự', 
        casesCount: countTranhTung,
        revenue: sumRevenue('tranh_tung'),
        conversionRate: 0,
        satisfaction: 0,
        activeConsultations: records.filter(r => getRecordArea(r) === 'tranh_tung' && !['hoàn thành', 'completed', 'đóng hồ sơ'].includes(String(r.status || '').toLowerCase())).length,
        color: '#a855f7' 
      },
      { 
        name: 'Tư vấn Pháp luật', 
        casesCount: countTuVan,
        revenue: sumRevenue('tu_van'),
        conversionRate: 0,
        satisfaction: 0,
        activeConsultations: records.filter(r => getRecordArea(r) === 'tu_van' && !['hoàn thành', 'completed', 'đóng hồ sơ'].includes(String(r.status || '').toLowerCase())).length,
        color: '#3b82f6' 
      },
      { 
        name: 'Đại diện Ngoài tố tụng', 
        casesCount: countDaiDien,
        revenue: sumRevenue('dai_dien_ngoai_to_tung'),
        conversionRate: 0,
        satisfaction: 0,
        activeConsultations: records.filter(r => getRecordArea(r) === 'dai_dien_ngoai_to_tung' && !['hoàn thành', 'completed', 'đóng hồ sơ'].includes(String(r.status || '').toLowerCase())).length,
        color: '#06b6d4' 
      },
      { 
        name: 'Pháp chế & Nội bộ', 
        casesCount: countNoiBo,
        revenue: sumRevenue('noi_bo'),
        conversionRate: 0,
        satisfaction: 0,
        activeConsultations: records.filter(r => getRecordArea(r) === 'noi_bo' && !['hoàn thành', 'completed', 'đóng hồ sơ'].includes(String(r.status || '').toLowerCase())).length,
        color: '#10b981' 
      },
      { 
        name: 'Trọng tài & Hòa giải', 
        casesCount: countTrongTai,
        revenue: sumRevenue('trong_tai_hoa_giai'),
        conversionRate: 0,
        satisfaction: 0,
        activeConsultations: records.filter(r => getRecordArea(r) === 'trong_tai_hoa_giai' && !['hoàn thành', 'completed', 'đóng hồ sơ'].includes(String(r.status || '').toLowerCase())).length,
        color: '#f59e0b' 
      },
      {
        name: 'Chưa phân loại',
        casesCount: countUnclassified,
        revenue: sumRevenue('unclassified'),
        conversionRate: 0,
        satisfaction: 0,
        activeConsultations: records.filter(r => getRecordArea(r) === 'unclassified' && !['hoàn thành', 'completed', 'đóng hồ sơ'].includes(String(r.status || '').toLowerCase())).length,
        color: '#94a3b8'
      },
    ];

    const areaLabels: Record<string, string> = {
      tranh_tung: 'Tranh tụng & Dân sự',
      tu_van: 'Tư vấn Pháp luật',
      dai_dien_ngoai_to_tung: 'Đại diện Ngoài tố tụng',
      noi_bo: 'Pháp chế & Nội bộ',
      trong_tai_hoa_giai: 'Trọng tài & Hòa giải',
      unclassified: 'Chưa phân loại'
    };
    const now = new Date();
    const monthlyServicesTrend = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const row: Record<string, string | number> = { month: `Tháng ${monthDate.getMonth() + 1}/${monthDate.getFullYear()}` };
      for (const area of Object.keys(areaLabels)) {
        row[areaLabels[area]] = records.filter(record => {
          const date = String(record.created_at || record.date || record.receiveDate || '').slice(0, 7);
          return date === monthKey && getRecordArea(record) === area;
        }).length;
      }
      return row;
    });

    res.json({
      chartData: stats,
      legalServicesPerformance,
      monthlyServicesTrend,
      summary: {
        totalMessages: totalMessages?.count || 0,
        unreadMessages: unreadMessages?.count || 0,
        totalVisitorsThisMonth: stats.reduce((acc: number, item: any) => acc + (item.visitors || 0), 0),
        totalPageViewsThisMonth: stats.reduce((acc: number, item: any) => acc + (item.page_views || 0), 0),
        totalChatsThisMonth: stats.reduce((acc: number, item: any) => acc + (item.chats || 0), 0),
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard statistics are write-only from real visitor, page-view, and chat events.
// Synthetic seed data is intentionally unavailable in production and development.
router.post("/stats/seed", auth, (_req: any, res: any) => {
  res.status(410).json({ success: false, error: "Synthetic dashboard data is disabled" });
});

// Get all contact settings (Public)
router.get("/settings", (req: any, res: any) => {
  try {
    const settings = db.prepare("SELECT key, value FROM contact_settings").all() as any[];
    const response: Record<string, string> = {};
    for (const item of settings) {
      response[item.key] = item.value;
    }
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update contact settings (Admin/auth only)
router.put("/settings", auth, (req: any, res: any) => {
  try {
    const updateOrCreate = (key: string, value: string) => {
      const stringVal = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
      const exists = db.prepare("SELECT id FROM contact_settings WHERE key = ?").get(key);
      if (exists) {
        db.prepare("UPDATE contact_settings SET value = ? WHERE key = ?").run(stringVal, key);
      } else {
        db.prepare("INSERT INTO contact_settings (key, value) VALUES (?, ?)").run(key, stringVal);
      }
      // Sync to Firestore persistently
      syncToFirestore("contact_settings", key, { value: stringVal });
    };

    if (req.body && typeof req.body === "object") {
      Object.entries(req.body).forEach(([k, v]) => {
        if (v !== undefined) {
          updateOrCreate(k, v as any);
        }
      });
    }

    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("settings_updated", req.body);
      }
    } catch (e) {}

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// KÊNH CHAT (COLLABORATIVE CHAT CHANNEL) API
// ==========================================

// Helper to check if a user is an admin of a specific channel or system admin
function canManageChannel(currentUser: any, channel: any): boolean {
  if (!currentUser) return false;
  const isSystemAdmin = currentUser.role === "admin" || currentUser.role === "director" || currentUser.role === "superadmin";
  if (isSystemAdmin) return true;
  if (channel.created_by === currentUser.id) return true;
  const member = db.prepare("SELECT role FROM chat_channel_members WHERE channel_id = ? AND user_id = ?").get(channel.id, currentUser.id) as any;
  return member?.role === "admin";
}

// Get visible channels
router.get("/chat/channels", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const isPartner = currentUser.role === 'partner' || currentUser.account_type === 'PARTNER';
    
    let channels: any[] = [];
    if (!isPartner) {
      channels = db.prepare(`
        SELECT cc.*, 
          (SELECT role FROM chat_channel_members WHERE channel_id = cc.id AND user_id = ?) as my_role
        FROM chat_channels cc
        WHERE (cc.is_deleted = 0 OR cc.is_deleted IS NULL)
        ORDER BY cc.is_private ASC, cc.name ASC
      `).all(currentUser.id);
    } else {
      channels = db.prepare(`
        SELECT cc.*, ccm.role as my_role
        FROM chat_channels cc
        LEFT JOIN chat_channel_members ccm ON cc.id = ccm.channel_id AND ccm.user_id = ?
        WHERE (cc.is_deleted = 0 OR cc.is_deleted IS NULL)
          AND (cc.is_private = 0 OR ccm.user_id = ?)
        ORDER BY cc.name ASC
      `).all(currentUser.id, currentUser.id);
    }
    
    for (const c of channels) {
      const countRes = db.prepare('SELECT COUNT(*) as count FROM chat_channel_members WHERE channel_id = ?').get(c.id) as { count: number };
      c.member_count = countRes?.count || 0;
      
      // Calculate unread messages count for channels
      const unread = db.prepare(`
        SELECT COUNT(*) as count FROM chat_messages 
        WHERE channel_id = ? AND sender_id != ? AND is_read = 0 AND created_at > (
          SELECT COALESCE(joined_at, '1970-01-01') FROM chat_channel_members WHERE channel_id = ? AND user_id = ?
        )
      `).get(c.id, currentUser.id, c.id, currentUser.id) as { count: number };
      c.unread_count = unread?.count || 0;
    }

    res.json(channels);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create channel
router.post("/chat/channels", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const isPartner = currentUser.role === 'partner' || currentUser.account_type === 'PARTNER';
    if (isPartner) {
      return res.status(403).json({ error: "Partners are not allowed to create channels" });
    }

    const { name, description, is_private, category, department, branch, case_id, case_code, case_title, member_ids } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Channel name is required" });
    }

    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
    const created_at = new Date().toISOString();
    const chanCategory = category || (case_id ? "case" : department ? "department" : branch ? "branch" : "general");

    const info = db.prepare(`
      INSERT INTO chat_channels (name, description, is_private, created_by, created_at, category, department, branch, case_id, case_code, case_title, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      cleanName,
      description || "",
      is_private ? 1 : 0,
      currentUser.id,
      created_at,
      chanCategory,
      department || null,
      branch || null,
      case_id ? String(case_id) : null,
      case_code || null,
      case_title || null
    );
    
    const channelId = Number(info.lastInsertRowid);

    // Auto-join creator as channel admin
    db.prepare('INSERT INTO chat_channel_members (channel_id, user_id, joined_at, role) VALUES (?, ?, ?, ?)')
      .run(channelId, currentUser.id, created_at, "admin");

    // Join other members if specified
    if (Array.isArray(member_ids)) {
      const insertMem = db.prepare('INSERT OR IGNORE INTO chat_channel_members (channel_id, user_id, joined_at, role) VALUES (?, ?, ?, ?)');
      for (const uid of member_ids) {
        if (Number(uid) !== Number(currentUser.id)) {
          insertMem.run(channelId, uid, created_at, "member");
        }
      }
    }

    const newChannel = {
      id: channelId,
      name: cleanName,
      description: description || "",
      is_private: is_private ? 1 : 0,
      created_by: currentUser.id,
      created_at,
      category: chanCategory,
      department: department || null,
      branch: branch || null,
      case_id: case_id ? String(case_id) : null,
      case_code: case_code || null,
      case_title: case_title || null,
      is_deleted: 0,
      member_count: Array.isArray(member_ids) ? member_ids.length : 1,
      unread_count: 0,
      my_role: "admin"
    };

    // Log Audit
    TrashService.logAudit({
      action: "CREATE_CHAT_CHANNEL",
      entityType: "chat_channels",
      entityId: String(channelId),
      performedBy: currentUser.name || currentUser.username || "Quản trị viên",
      performedAt: created_at,
      reason: "Tạo kênh trò chuyện mới",
      result: "SUCCESS",
      details: { name: cleanName, category: chanCategory, case_id }
    });

    // Sync to Firestore
    syncRowToFirestore("chat_channels", channelId);

    const io = req.app.get("io");
    if (io) {
      io.emit("chat_channel_created", newChannel);
    }

    res.json({ success: true, channel: newChannel });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update channel details
router.put("/chat/channels/:channelId", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.channelId;
    const channel = db.prepare("SELECT * FROM chat_channels WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)").get(channelId) as any;
    if (!channel) return res.status(404).json({ error: "Channel not found or already deleted" });

    if (!canManageChannel(currentUser, channel)) {
      return res.status(403).json({ error: "Bạn không có quyền chỉnh sửa kênh này" });
    }

    const { name, description, is_private, category, department, branch, case_id, case_code, case_title } = req.body;
    const cleanName = name ? name.trim().toLowerCase().replace(/\s+/g, '-') : channel.name;

    db.prepare(`
      UPDATE chat_channels
      SET name = ?, description = ?, is_private = ?, category = ?, department = ?, branch = ?, case_id = ?, case_code = ?, case_title = ?
      WHERE id = ?
    `).run(
      cleanName,
      description !== undefined ? description : channel.description,
      is_private !== undefined ? (is_private ? 1 : 0) : channel.is_private,
      category !== undefined ? category : channel.category,
      department !== undefined ? department : channel.department,
      branch !== undefined ? branch : channel.branch,
      case_id !== undefined ? String(case_id) : channel.case_id,
      case_code !== undefined ? case_code : channel.case_code,
      case_title !== undefined ? case_title : channel.case_title,
      channelId
    );

    const updated = db.prepare("SELECT * FROM chat_channels WHERE id = ?").get(channelId) as any;

    TrashService.logAudit({
      action: "UPDATE_CHAT_CHANNEL",
      entityType: "chat_channels",
      entityId: String(channelId),
      performedBy: currentUser.name || currentUser.username || "Quản trị viên",
      performedAt: new Date().toISOString(),
      reason: "Cập nhật thông tin kênh trò chuyện",
      result: "SUCCESS",
      details: { name: cleanName, previous: channel.name }
    });

    syncRowToFirestore("chat_channels", channelId);

    const io = req.app.get("io");
    if (io) {
      io.emit("chat_channel_updated", updated);
    }

    res.json({ success: true, channel: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-delete channel into Recycle Bin
router.delete("/chat/channels/:channelId", auth, async (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.channelId;
    const channel = db.prepare("SELECT * FROM chat_channels WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)").get(channelId) as any;
    if (!channel) return res.status(404).json({ error: "Channel not found or already deleted" });

    if (!canManageChannel(currentUser, channel)) {
      return res.status(403).json({ error: "Bạn không có quyền xóa kênh này" });
    }

    const performer = currentUser.name || currentUser.username || "Quản trị viên";
    const reason = req.body?.reason || "Người dùng chuyển kênh vào thùng rác";

    const trashedChannel = await TrashService.softDeleteChannel(channelId, performer, reason);

    res.json({ success: true, message: "Kênh đã được chuyển vào Thùng rác thành công.", channel: trashedChannel });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get members of a channel
router.get("/chat/channels/:channelId/members", auth, (req: any, res: any) => {
  try {
    const channelId = req.params.channelId;
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.role as user_role, u.avatar, u.username, ccm.role as channel_role, ccm.joined_at
      FROM chat_channel_members ccm
      JOIN users u ON ccm.user_id = u.id
      WHERE ccm.channel_id = ?
      ORDER BY (CASE WHEN ccm.role = 'admin' THEN 0 ELSE 1 END), u.name ASC
    `).all(channelId);

    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add member(s) to a channel
router.post("/chat/channels/:channelId/members", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.channelId;
    const channel = db.prepare("SELECT * FROM chat_channels WHERE id = ?").get(channelId) as any;
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    if (!canManageChannel(currentUser, channel)) {
      return res.status(403).json({ error: "Bạn không có quyền thêm thành viên vào kênh này" });
    }

    const { user_ids, user_id, role } = req.body;
    const targetIds: number[] = Array.isArray(user_ids) ? user_ids : user_id ? [user_id] : [];
    if (targetIds.length === 0) {
      return res.status(400).json({ error: "Vui lòng chọn ít nhất một thành viên" });
    }

    const joinedAt = new Date().toISOString();
    const insertMem = db.prepare("INSERT OR REPLACE INTO chat_channel_members (channel_id, user_id, joined_at, role) VALUES (?, ?, ?, ?)");
    for (const uid of targetIds) {
      insertMem.run(channelId, uid, joinedAt, role || "member");
    }

    TrashService.logAudit({
      action: "ADD_CHAT_CHANNEL_MEMBER",
      entityType: "chat_channels",
      entityId: String(channelId),
      performedBy: currentUser.name || currentUser.username || "Quản trị viên",
      performedAt: joinedAt,
      reason: "Thêm thành viên vào kênh trò chuyện",
      result: "SUCCESS",
      details: { added_users: targetIds, channel: channel.name }
    });

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.role as user_role, u.avatar, u.username, ccm.role as channel_role, ccm.joined_at
      FROM chat_channel_members ccm
      JOIN users u ON ccm.user_id = u.id
      WHERE ccm.channel_id = ?
    `).all(channelId);

    const io = req.app.get("io");
    if (io) {
      io.to(`chat_channel_${channelId}`).emit("chat_channel_members_updated", { channelId, members });
    }

    res.json({ success: true, members });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a member from a channel
router.delete("/chat/channels/:channelId/members/:userId", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.channelId;
    const targetUserId = Number(req.params.userId);
    const channel = db.prepare("SELECT * FROM chat_channels WHERE id = ?").get(channelId) as any;
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const isSelf = Number(currentUser.id) === targetUserId;
    if (!isSelf && !canManageChannel(currentUser, channel)) {
      return res.status(403).json({ error: "Bạn không có quyền xóa thành viên khỏi kênh này" });
    }

    db.prepare("DELETE FROM chat_channel_members WHERE channel_id = ? AND user_id = ?").run(channelId, targetUserId);

    TrashService.logAudit({
      action: "REMOVE_CHAT_CHANNEL_MEMBER",
      entityType: "chat_channels",
      entityId: String(channelId),
      performedBy: currentUser.name || currentUser.username || "Quản trị viên",
      performedAt: new Date().toISOString(),
      reason: isSelf ? "Người dùng tự rời khỏi kênh" : "Quản trị viên xóa thành viên khỏi kênh",
      result: "SUCCESS",
      details: { user_id: targetUserId, channel: channel.name }
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`chat_channel_${channelId}`).emit("chat_channel_members_updated", { channelId, removedUserId: targetUserId });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update member role in channel ('admin' | 'member')
router.put("/chat/channels/:channelId/members/:userId/role", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.channelId;
    const targetUserId = Number(req.params.userId);
    const { role } = req.body;
    if (role !== "admin" && role !== "member") {
      return res.status(400).json({ error: "Role must be 'admin' or 'member'" });
    }

    const channel = db.prepare("SELECT * FROM chat_channels WHERE id = ?").get(channelId) as any;
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    if (!canManageChannel(currentUser, channel)) {
      return res.status(403).json({ error: "Bạn không có quyền thay đổi phân quyền thành viên" });
    }

    db.prepare("UPDATE chat_channel_members SET role = ? WHERE channel_id = ? AND user_id = ?").run(role, channelId, targetUserId);

    TrashService.logAudit({
      action: "UPDATE_CHAT_MEMBER_ROLE",
      entityType: "chat_channels",
      entityId: String(channelId),
      performedBy: currentUser.name || currentUser.username || "Quản trị viên",
      performedAt: new Date().toISOString(),
      reason: `Cập nhật quyền thành viên thành ${role}`,
      result: "SUCCESS",
      details: { user_id: targetUserId, new_role: role }
    });

    res.json({ success: true, role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a channel (includes reply info, reactions, and pins)
router.get("/chat/channels/:channelId/messages", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const channelId = req.params.channelId;
    const channel = db.prepare('SELECT * FROM chat_channels WHERE id = ?').get(channelId) as any;
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const isPartner = currentUser.role === 'partner' || currentUser.account_type === 'PARTNER';
    if (channel.is_private) {
      const isMember = db.prepare('SELECT COUNT(*) as count FROM chat_channel_members WHERE channel_id = ? AND user_id = ?')
        .get(channelId, currentUser.id) as { count: number };
      
      if (isMember.count === 0 && isPartner) {
        return res.status(403).json({ error: "Access denied to private channel" });
      }
    }

    const messages = db.prepare(`
      SELECT cm.*, 
        u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar, u.username as sender_username,
        rm.content as reply_content, ru.name as reply_sender_name,
        pu.name as pinned_by_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN chat_messages rm ON cm.reply_to_id = rm.id
      LEFT JOIN users ru ON rm.sender_id = ru.id
      LEFT JOIN users pu ON cm.pinned_by = pu.id
      WHERE cm.channel_id = ?
      ORDER BY cm.created_at ASC
    `).all(channelId) as any[];

    // Fetch reactions for these messages
    if (messages.length > 0) {
      const msgIds = messages.map(m => m.id);
      const placeholders = msgIds.map(() => "?").join(",");
      const allReactions = db.prepare(`
        SELECT cr.*, u.name as user_name
        FROM chat_reactions cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.message_id IN (${placeholders})
      `).all(...msgIds) as any[];

      const reactionsByMsg = new Map<number, any[]>();
      for (const r of allReactions) {
        if (!reactionsByMsg.has(r.message_id)) {
          reactionsByMsg.set(r.message_id, []);
        }
        reactionsByMsg.get(r.message_id)!.push(r);
      }

      for (const m of messages) {
        const rawReactions = reactionsByMsg.get(m.id) || [];
        // Group by emoji
        const groupedMap = new Map<string, { emoji: string; count: number; users: string[]; has_reacted: boolean }>();
        for (const rr of rawReactions) {
          if (!groupedMap.has(rr.emoji)) {
            groupedMap.set(rr.emoji, { emoji: rr.emoji, count: 0, users: [], has_reacted: false });
          }
          const item = groupedMap.get(rr.emoji)!;
          item.count++;
          item.users.push(rr.user_name);
          if (rr.user_id === currentUser.id) {
            item.has_reacted = true;
          }
        }
        m.reactions = Array.from(groupedMap.values());
      }
    }

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Pin message in channel (supports both PUT and POST)
const handleTogglePinMessage = (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const messageId = req.params.messageId;
    const msg = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(messageId) as any;
    if (!msg) return res.status(404).json({ error: "Message not found" });

    const newPinned = msg.is_pinned === 1 ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare("UPDATE chat_messages SET is_pinned = ?, pinned_by = ?, pinned_at = ? WHERE id = ?")
      .run(newPinned, newPinned ? currentUser.id : null, newPinned ? now : null, messageId);

    const updated = db.prepare(`
      SELECT cm.*, u.name as sender_name, pu.name as pinned_by_name
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN users pu ON cm.pinned_by = pu.id
      WHERE cm.id = ?
    `).get(messageId);

    TrashService.logAudit({
      action: newPinned ? "PIN_CHAT_MESSAGE" : "UNPIN_CHAT_MESSAGE",
      entityType: "chat_messages",
      entityId: String(messageId),
      performedBy: currentUser.name || currentUser.username || "Quản trị viên",
      performedAt: now,
      reason: newPinned ? "Ghim tin nhắn lên đầu kênh" : "Bỏ ghim tin nhắn",
      result: "SUCCESS",
      details: { channelId: msg.channel_id, content: msg.content?.slice(0, 40) }
    });

    const io = req.app.get("io");
    if (io && msg.channel_id) {
      io.to(`chat_channel_${msg.channel_id}`).emit("chat_message_pinned", {
        messageId: Number(messageId),
        is_pinned: newPinned,
        pinned_by: newPinned ? currentUser.id : null,
        pinned_by_name: newPinned ? (currentUser.name || currentUser.username) : null,
        pinned_at: newPinned ? now : null,
        message: updated
      });
    }

    res.json({ success: true, is_pinned: newPinned, message: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

router.put("/chat/messages/:messageId/pin", auth, handleTogglePinMessage);
router.post("/chat/messages/:messageId/pin", auth, handleTogglePinMessage);

// Add or toggle emoji reaction to message
router.post("/chat/messages/:messageId/reactions", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const messageId = req.params.messageId;
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: "Emoji is required" });

    const msg = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(messageId) as any;
    if (!msg) return res.status(404).json({ error: "Message not found" });

    const existing = db.prepare("SELECT id FROM chat_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?")
      .get(messageId, currentUser.id, emoji) as any;

    if (existing) {
      // Toggle off
      db.prepare("DELETE FROM chat_reactions WHERE id = ?").run(existing.id);
    } else {
      // Add reaction
      db.prepare("INSERT INTO chat_reactions (message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?)")
        .run(messageId, currentUser.id, emoji, new Date().toISOString());
    }

    // Fetch updated reactions for this message
    const allReactions = db.prepare(`
      SELECT cr.*, u.name as user_name
      FROM chat_reactions cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.message_id = ?
    `).all(messageId) as any[];

    const groupedMap = new Map<string, { emoji: string; count: number; users: string[]; has_reacted: boolean }>();
    for (const rr of allReactions) {
      if (!groupedMap.has(rr.emoji)) {
        groupedMap.set(rr.emoji, { emoji: rr.emoji, count: 0, users: [], has_reacted: false });
      }
      const item = groupedMap.get(rr.emoji)!;
      item.count++;
      item.users.push(rr.user_name);
      if (rr.user_id === currentUser.id) {
        item.has_reacted = true;
      }
    }
    const reactions = Array.from(groupedMap.values());

    const io = req.app.get("io");
    if (io && msg.channel_id) {
      io.to(`chat_channel_${msg.channel_id}`).emit("chat_reaction_updated", {
        messageId: Number(messageId),
        reactions
      });
      io.to(`chat_channel_${msg.channel_id}`).emit("chat_reactions_updated", {
        messageId: Number(messageId),
        reactions
      });
    }

    res.json({ success: true, reactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Search across messages and channels
router.get("/chat/search", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const q = (req.query.q || "").trim().toLowerCase();
    if (!q) {
      return res.json({ messages: [], channels: [] });
    }

    const likeQuery = `%${q}%`;

    // Search channels
    const channels = db.prepare(`
      SELECT * FROM chat_channels
      WHERE (is_deleted = 0 OR is_deleted IS NULL)
        AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(case_title) LIKE ? OR LOWER(case_code) LIKE ?)
      ORDER BY name ASC
      LIMIT 20
    `).all(likeQuery, likeQuery, likeQuery, likeQuery);

    // Search messages in visible channels
    const messages = db.prepare(`
      SELECT cm.*, cc.name as channel_name, u.name as sender_name, u.avatar as sender_avatar
      FROM chat_messages cm
      JOIN chat_channels cc ON cm.channel_id = cc.id
      JOIN users u ON cm.sender_id = u.id
      WHERE (cc.is_deleted = 0 OR cc.is_deleted IS NULL)
        AND (LOWER(cm.content) LIKE ? OR LOWER(cm.file_name) LIKE ? OR LOWER(u.name) LIKE ?)
      ORDER BY cm.created_at DESC
      LIMIT 30
    `).all(likeQuery, likeQuery, likeQuery);

    res.json({ channels, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Find or auto-create chat channel linked to a case
router.get("/chat/case-channel/:caseId", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const caseId = req.params.caseId;

    // Check if channel already exists for this case
    let channel = db.prepare(`
      SELECT * FROM chat_channels 
      WHERE case_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
      LIMIT 1
    `).get(caseId) as any;

    if (!channel) {
      // Find case information to set smart channel name and title
      const caseRow = db.prepare("SELECT * FROM cases WHERE id = ?").get(caseId) as any;
      const cleanCaseName = caseRow?.name ? caseRow.name.slice(0, 40) : `Hồ sơ ${caseId}`;
      const channelSlug = `ho-so-${String(caseId).toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const now = new Date().toISOString();

      const info = db.prepare(`
        INSERT INTO chat_channels (name, description, is_private, created_by, created_at, category, case_id, case_title, is_deleted)
        VALUES (?, ?, 0, ?, ?, 'case', ?, ?, 0)
      `).run(
        channelSlug,
        `Kênh trao đổi hồ sơ vụ án: ${cleanCaseName}`,
        currentUser.id,
        now,
        String(caseId),
        cleanCaseName
      );

      const channelId = Number(info.lastInsertRowid);

      // Auto join current user as admin
      db.prepare("INSERT INTO chat_channel_members (channel_id, user_id, joined_at, role) VALUES (?, ?, ?, 'admin')")
        .run(channelId, currentUser.id, now);

      channel = db.prepare("SELECT * FROM chat_channels WHERE id = ?").get(channelId);

      syncRowToFirestore("chat_channels", channelId);

      const io = req.app.get("io");
      if (io) {
        io.emit("chat_channel_created", channel);
      }
    }

    res.json({ success: true, channel });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get 1-1 Direct Messages
router.get("/chat/direct/:userId/messages", auth, (req: any, res: any) => {
  try {
    const currentUser = req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    const targetUserId = req.params.userId;

    const messages = db.prepare(`
      SELECT cm.*, u.name as sender_name, u.role as sender_role, u.avatar as sender_avatar, u.username as sender_username
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE (cm.sender_id = ? AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = ?)
      ORDER BY cm.created_at ASC
    `).all(currentUser.id, targetUserId, targetUserId, currentUser.id);

    // Mark these DMs as read
    db.prepare('UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?').run(targetUserId, currentUser.id);

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
