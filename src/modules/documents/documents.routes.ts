import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { auth, checkResourceAccess, requirePermission, requireResourceAccess } from "../../middleware/auth";
import { mapRoleToDb } from "../../utils/role";
import { upload } from "../../middleware/upload";
import db from "../../db/database";
import { v4 as uuidv4 } from "uuid";
import { saveFileToNAS, extractTextFromFile } from "../../utils/file";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/signed-documents", auth, (req: any, res: any) => {
  try {
    const user = req.user || req.session?.user;
    const isClient = String(user?.role || "").toLowerCase() === "client";
    const requestedClientId = String(req.query.clientId || "");
    const ownClientId = String(user?.username || `client_${user?.id || ""}`);
    const clientId = isClient ? ownClientId : requestedClientId;

    if (!clientId) return res.json([]);

    const rows = db.prepare(`
      SELECT id, client_id as clientId, client_name as clientName,
             template_id as templateId, document_title as documentTitle,
             document_code as documentCode, signed_url as signedUrl,
             signed_at as signedAt, ink_color as inkColor, method
      FROM signed_documents
      WHERE client_id = ?
      ORDER BY signed_at DESC
    `).all(clientId);

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load signed documents" });
  }
});

router.post("/signed-documents", auth, (req: any, res: any) => {
  try {
    const user = req.user || req.session?.user;
    const payload = req.body || {};
    const isClient = String(user?.role || "").toLowerCase() === "client";
    const ownClientId = String(user?.username || `client_${user?.id || ""}`);
    const clientId = isClient ? ownClientId : String(payload.clientId || "");

    if (!clientId || !payload.id || !payload.signedUrl) {
      return res.status(400).json({ error: "Missing signed document data" });
    }

    db.prepare(`
      INSERT OR REPLACE INTO signed_documents (
        id, client_id, client_name, template_id, document_title,
        document_code, signed_url, signed_at, ink_color, method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(payload.id),
      clientId,
      payload.clientName || user?.name || "",
      payload.templateId || "",
      payload.documentTitle || "",
      payload.documentCode || "",
      payload.signedUrl,
      payload.signedAt || new Date().toISOString(),
      payload.inkColor || "",
      payload.method || "type",
      new Date().toISOString(),
    );

    res.json({ success: true, id: payload.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save signed document" });
  }
});


router.post("/upload", auth, upload.any(), async (req: any, res: any) => {
  const caseId = req.body.caseId;
  const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
  
  if (!file) return res.status(400).json({ error: "Missing file" });

  if (caseId) {
    if (!checkResourceAccess(req.user || req.session?.user, "record", String(caseId))) {
      return res.status(403).json({ error: "Bạn không có quyền tải tài liệu vào hồ sơ này." });
    }
    // Law Firm Case File Upload Logic
    const savedFile = saveFileToNAS(file, caseId);
    const id = uuidv4();
    db.prepare(`INSERT INTO files (id, case_id, filename, path, is_deleted) VALUES (?,?,?,?,0)`).run(id, caseId, savedFile.filename, savedFile.path);
    const text = await extractTextFromFile(savedFile.path);
    db.prepare(`INSERT INTO case_text VALUES (?,?)`).run(id, text);
  
    return res.json({ success: true, fileId: id, fileUrl: `/api/files/download/${id}` });
  } else {
    const role = mapRoleToDb(req.user?.role || req.session?.user?.role);
    const permission = db.prepare("SELECT manageWeb FROM role_permissions WHERE role = ?").get(role) as any;
    if (!permission?.manageWeb && !["admin", "director", "deputyDirector"].includes(role)) {
      return res.status(403).json({ error: "Bạn không có quyền tải tệp hệ thống." });
    }
    // Generic CMS/Image Upload Logic
    const uploadDir = process.env.NODE_ENV === "production" ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
    // Create unique filename from either multer's random or originalname
    const safeName = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'upload.bin';
    const filename = `${Date.now()}_${safeName}`;
    const fullPath = path.join(uploadDir, filename);
    
    fs.writeFileSync(fullPath, file.buffer);
    
    // Return both so AdminDashboard and Services get what they expect
    return res.json({ 
      success: true, 
      imageUrl: `/uploads/${filename}`, 
      fileUrl: `/uploads/${filename}` 
    });
  }
});

router.get("/files/:caseId", auth, requireResourceAccess("record", "caseId"), (req: any, res: any) => {
  const files = db.prepare(`SELECT id, filename FROM files WHERE case_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`).all(req.params.caseId);
  res.json(files);
});

router.delete("/files/:id", auth, requirePermission("manageLegalDocs"), async (req: any, res: any) => {
  try {
    const fileId = req.params.id;
    const fileRow = db.prepare(`SELECT * FROM files WHERE id = ?`).get(fileId) as any;
    if (!fileRow) {
      return res.status(404).json({ error: "File not found" });
    }

    const performedBy = req.user?.username || req.user?.email || "system";
    const now = new Date().toISOString();
    const reason = req.body.reason || "Xóa tệp tin";

    // Update files table to mark as deleted
    db.prepare(`
      UPDATE files 
      SET is_deleted = 1, deleted_at = ?, deleted_by = ?, delete_reason = ? 
      WHERE id = ?
    `).run(now, performedBy, reason, fileId);

    // Prepare JSON data for recycle_bin
    const fileData = {
      id: fileRow.id,
      case_id: fileRow.case_id,
      filename: fileRow.filename,
      path: fileRow.path,
      is_deleted: 1,
      deletedAt: now,
      deletedBy: performedBy,
      deleteReason: reason
    };

    // Store in recycle_bin table
    db.prepare(`
      INSERT OR REPLACE INTO recycle_bin (id, original_table, data, deleted_at, deleted_by, reason, previous_status)
      VALUES (?, 'files', ?, ?, ?, ?, 'ACTIVE')
    `).run(fileId, JSON.stringify(fileData), now, performedBy, reason);

    // Log audit
    try {
      const { TrashService } = require("../../services/trash.service");
      TrashService.logAudit({
        action: "DELETE_FILE",
        entityType: "files",
        entityId: fileId,
        performedBy: performedBy,
        performedAt: now,
        reason: reason,
        result: "SUCCESS",
        details: fileData
      });
    } catch (auditErr) {
      console.error("Failed to log audit for file deletion:", auditErr);
    }

    res.json({ success: true, message: "File soft-deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/files/download/:id", auth, (req: any, res: any) => {
  try {
    const fileRow = db.prepare(`SELECT * FROM files WHERE id = ?`).get(req.params.id) as any;
    if (!fileRow) {
      return res.status(404).json({ error: "File not found" });
    }
    const recordAccess = requireResourceAccess("record", "caseId");
    req.params.caseId = fileRow.case_id;
    return recordAccess(req, res, () => {
      if (!fs.existsSync(fileRow.path)) {
        return res.status(404).json({ error: "File path on disk not found: " + fileRow.path });
      }
    const ext = path.extname(fileRow.filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".doc") contentType = "application/msword";
    else if (ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === ".xls") contentType = "application/vnd.ms-excel";
    else if (ext === ".txt") contentType = "text/plain; charset=utf-8";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(fileRow.filename)}`);
    
      fs.createReadStream(fileRow.path).pipe(res);
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/files/text/:id", auth, (req: any, res: any) => {
  try {
    const row = db.prepare(`SELECT ct.content, f.case_id FROM case_text ct JOIN files f ON f.id = ct.file_id WHERE ct.file_id = ?`).get(req.params.id) as any;
    if (!row) return res.status(404).json({ error: "File text not found" });
    req.params.caseId = row.case_id;
    return requireResourceAccess("record", "caseId")(req, res, () => {
    res.json({ text: row ? row.content : "" });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/documents/ai/ask", auth, async (req: any, res: any) => {
  try {
    const { caseId, question } = req.body;
    if (!caseId || !checkResourceAccess(req.user || req.session?.user, "record", String(caseId))) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập hồ sơ này." });
    }
    const rows: any[] = db.prepare(`
      SELECT content FROM case_text
      JOIN files ON case_text.file_id = files.id
      WHERE files.case_id = ? AND (files.is_deleted = 0 OR files.is_deleted IS NULL)
    `).all(caseId);

    let context = "";
    rows.forEach(r => context += (r.content || "") + "\n");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Bối cảnh hồ sơ vụ án:\n${context.slice(0, 10000)}\n\nCâu hỏi: ${question}\nTrả lời chính xác, ngắn gọn bằng tiếng Việt.`,
    });

    res.json({ answer: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi khi xử lý bằng Gemini AI." });
  }
});

router.post("/ai/summary", auth, async (req: any, res: any) => {
  try {
    const { caseId } = req.body;
    const rows: any[] = db.prepare(`
      SELECT content FROM case_text
      JOIN files ON case_text.file_id = files.id
      WHERE files.case_id = ? AND (files.is_deleted = 0 OR files.is_deleted IS NULL)
    `).all(caseId);

    let context = "";
    rows.forEach(r => context += (r.content || "") + "\n");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Tóm tắt chi tiết các điểm mấu chốt của hồ sơ vụ án sau đây bằng tiếng Việt:\n\n${context.slice(0, 15000)}`,
    });

    res.json({ summary: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi tóm tắt bằng Gemini AI." });
  }
});

router.post("/scan-file", auth, upload.any(), async (req: any, res: any) => {
  try {
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (!file) return res.status(400).json({ error: "Missing file" });

    // Save temporary file
    const uploadDir = process.env.NODE_ENV === "production" ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const safeName = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'upload.bin';
    const filename = `${Date.now()}_${safeName}`;
    const fullPath = path.join(uploadDir, filename);
    fs.writeFileSync(fullPath, file.buffer);

    // Extract text
    const text = await extractTextFromFile(fullPath);

    // Delete temporary file
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error("Error deleting temp file:", err);
    }

    res.json({ success: true, text, filename: file.originalname });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Server error while scanning file" });
  }
});

export default router;
