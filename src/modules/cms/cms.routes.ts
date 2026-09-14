import { Router } from "express";
import { requirePermission } from "../../middleware/auth";
import db from "../../db/database";
import { syncRowToFirestore, deleteFromFirestore } from "../../db/firestore-sync";
import { SharedDirectoryService } from "../../application/services/sharedDirectory.service";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";
import { upload } from "../../middleware/upload";
import { extractTextFromFile } from "../../utils/file";
import { getResolvedAiProvider } from "../ai/ai.routes";
import { encodeCursor, decodeCursor } from "../../utils/cursor";

const router = Router();
const canEditWeb = requirePermission("manageWeb");

// Helper to avoid better-sqlite3 TypeError on undefined
const val = (v: any) => v ?? null;

// Initialize CMS columns for approval
try { db.prepare("ALTER TABLE legal_forms ADD COLUMN is_approved INTEGER DEFAULT 1").run(); } catch(e) {}
try { db.prepare("ALTER TABLE judgments ADD COLUMN is_approved INTEGER DEFAULT 1").run(); } catch(e) {}
try { db.prepare("ALTER TABLE precedents ADD COLUMN is_approved INTEGER DEFAULT 1").run(); } catch(e) {}
try { db.prepare("ALTER TABLE testimonials ADD COLUMN is_approved INTEGER DEFAULT 1").run(); } catch(e) {}
try { db.prepare("ALTER TABLE news ADD COLUMN is_approved INTEGER DEFAULT 1").run(); } catch(e) {}
try { db.prepare("ALTER TABLE services ADD COLUMN is_approved INTEGER DEFAULT 1").run(); } catch(e) {}

const getIsApprovedDefault = (req: any) => {
  const user = req.session?.user;
  if (!user) return 1; // Default to 1 for internal seeding
  const role = (user.role || "").toLowerCase();
  if (["admin", "director", "deputy_director", "deputydirector", "prosecutor", "kiểm soát viên", "controller", "kiểm soát chất lượng"].includes(role)) {
    return 1;
  }
  return 0;
};

// Dynamic CMS approval & real-time sync middleware
router.use((req: any, res: any, next: any) => {
  const originalJson = res.json;
  res.json = function (data: any) {
    if (data && data.success && (req.method === "POST" || req.method === "PUT" || req.method === "DELETE")) {
      const pathParts = req.path.split("/").filter(Boolean);
      const table = pathParts[0] || "cms";
      const allowedTables = ["legal_forms", "judgments", "precedents", "testimonials", "news", "services", "land_prices", "subdivision_limits"];
      const matchTable = allowedTables.find(t => t === table || t.replace("_", "-") === table);
      
      if (matchTable && (req.method === "POST" || req.method === "PUT")) {
        const isApproved = getIsApprovedDefault(req);
        if (isApproved === 0) {
          try {
            const id = req.params.id || data.id || data.lastInsertRowid;
            if (id) {
              db.prepare(`UPDATE ${matchTable} SET is_approved = 0 WHERE id = ?`).run(id);
            }
          } catch (e) {
            console.error("Auto approval middleware error:", e);
          }
        }
      }

      // Real-time synchronization broadcast across all connected clients
      try {
        const io = req.app.get("io");
        if (io) {
          io.emit("cms_updated", { type: table, method: req.method });
          if (["legal_forms", "judgments", "precedents", "legal-forms"].includes(table)) {
            io.emit("legal_docs_updated");
          }
        }
      } catch (e) {}
    }
    return originalJson.call(this, data);
  };
  next();
});

// Services
router.get("/services", (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT * FROM services";
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
      const services = db.prepare(query).all(params);
      res.json(services);
    }
  } catch (err: any) {
    console.error("ERROR IN /api/services:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/services", canEditWeb, async (req: any, res: any) => {
  const { title, description, content, icon, file_url, file_name, category } = req.body;
  try {
    const result = db.prepare(`INSERT INTO services (title, description, content, icon, file_url, file_name, category) VALUES (?,?,?,?,?,?,?)`)
      .run(val(title), val(description), val(content), val(icon), val(file_url), val(file_name), val(category));
    await syncRowToFirestore("services", Number(result.lastInsertRowid));
    res.json({ success: true });
  } catch (err: any) {
    console.error("POST /services ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/services/:id", canEditWeb, async (req: any, res: any) => {
  const { title, description, content, icon, file_url, file_name, category } = req.body;
  try {
    db.prepare(`UPDATE services SET title=?, description=?, content=?, icon=?, file_url=?, file_name=?, category=? WHERE id=?`)
      .run(val(title), val(description), val(content), val(icon), val(file_url), val(file_name), val(category), req.params.id);
    await syncRowToFirestore("services", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("PUT /services ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/services/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM services WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("services", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Legal Services
router.get("/legal-services", (req: any, res: any) => {
  try {
    const services = db.prepare(`SELECT * FROM legal_services`).all();
    res.json(services);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/legal-services", canEditWeb, async (req: any, res: any) => {
  const { title, description, content, icon, file_url, file_name } = req.body;
  try {
    const result = db.prepare(`INSERT INTO legal_services (title, description, content, icon, file_url, file_name) VALUES (?,?,?,?,?,?)`)
      .run(val(title), val(description), val(content), val(icon), val(file_url), val(file_name));
    await syncRowToFirestore("legal_services", Number(result.lastInsertRowid));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/legal-services/:id", canEditWeb, async (req: any, res: any) => {
  const { title, description, content, icon, file_url, file_name } = req.body;
  try {
    db.prepare(`UPDATE legal_services SET title=?, description=?, content=?, icon=?, file_url=?, file_name=? WHERE id=?`)
      .run(val(title), val(description), val(content), val(icon), val(file_url), val(file_name), req.params.id);
    await syncRowToFirestore("legal_services", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/legal-services/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM legal_services WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("legal_services", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Team
router.get("/team", (req: any, res: any) => {
  try {
    try { db.prepare("ALTER TABLE team ADD COLUMN email TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN phone TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN specialties TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN degrees TEXT").run(); } catch(e) {}
    const team = db.prepare(`SELECT * FROM team`).all();
    res.json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/team", canEditWeb, async (req: any, res: any) => {
  const { name, title, description, image, email, phone, specialties, degrees } = req.body;
  try {
    try { db.prepare("ALTER TABLE team ADD COLUMN email TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN phone TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN specialties TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN degrees TEXT").run(); } catch(e) {}
    const result = db.prepare(`INSERT INTO team (name, title, description, image, email, phone, specialties, degrees) VALUES (?,?,?,?,?,?,?,?)`)
      .run(val(name), val(title), val(description), val(image), val(email), val(phone), val(specialties), val(degrees));
    await syncRowToFirestore("team", Number(result.lastInsertRowid));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/team/:id", canEditWeb, async (req: any, res: any) => {
  const { name, title, description, image, email, phone, specialties, degrees } = req.body;
  try {
    try { db.prepare("ALTER TABLE team ADD COLUMN email TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN phone TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN specialties TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE team ADD COLUMN degrees TEXT").run(); } catch(e) {}
    db.prepare(`UPDATE team SET name=?, title=?, description=?, image=?, email=?, phone=?, specialties=?, degrees=? WHERE id=?`)
      .run(val(name), val(title), val(description), val(image), val(email), val(phone), val(specialties), val(degrees), req.params.id);
    await syncRowToFirestore("team", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/team/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM team WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("team", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Recruitment
router.get("/recruitment", (req: any, res: any) => {
  try {
    const recruitment = db.prepare(`SELECT * FROM recruitment`).all();
    res.json(recruitment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/recruitment", canEditWeb, async (req: any, res: any) => {
  const { title, location, type, salary, description, content, file_url, file_name } = req.body;
  try {
    const result = db.prepare(`INSERT INTO recruitment (title, location, type, salary, description, content, file_url, file_name) VALUES (?,?,?,?,?,?,?,?)`)
      .run(val(title), val(location), val(type), val(salary), val(description), val(content), val(file_url), val(file_name));
    await syncRowToFirestore("recruitment", Number(result.lastInsertRowid));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/recruitment/:id", canEditWeb, async (req: any, res: any) => {
  const { title, location, type, salary, description, content, file_url, file_name } = req.body;
  try {
    db.prepare(`UPDATE recruitment SET title=?, location=?, type=?, salary=?, description=?, content=?, file_url=?, file_name=? WHERE id=?`)
      .run(val(title), val(location), val(type), val(salary), val(description), val(content), val(file_url), val(file_name), req.params.id);
    await syncRowToFirestore("recruitment", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/recruitment/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM recruitment WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("recruitment", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// News
router.get("/news", (req: any, res: any) => {
  try {
    try { db.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE news ADD COLUMN video_url TEXT").run(); } catch(e) {}

    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT id, title, excerpt as description, content, date as created_at, image as file_url, category, related_service, video_url FROM news";
    const params: any = {};

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.date && cursor.id) {
          query += " WHERE date < :cursorDate OR (date = :cursorDate AND id < :cursorId)";
          params.cursorDate = cursor.date;
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY date DESC, id DESC LIMIT :limitPlusOne";
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as any[];
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        const lastRow = returnedRows[returnedRows.length - 1];
        nextCursor = encodeCursor({ date: lastRow.created_at, id: lastRow.id });
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
      query += " ORDER BY date DESC, id DESC";
      const news = db.prepare(query).all(params);
      res.json(news);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/news", canEditWeb, async (req: any, res: any) => {
  const { title, description, content, created_at, file_url, category, related_service, video_url } = req.body;
  const date = created_at || new Date().toISOString().split('T')[0];
  try {
    try { db.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE news ADD COLUMN video_url TEXT").run(); } catch(e) {}
    const result = db.prepare(`INSERT INTO news (title, excerpt, content, date, image, category, related_service, video_url) VALUES (?,?,?,?,?,?,?,?)`)
      .run(val(title), val(description), val(content), val(date), val(file_url), val(category), val(related_service), val(video_url));
    await syncRowToFirestore("news", Number(result.lastInsertRowid));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/news/:id", canEditWeb, async (req: any, res: any) => {
  const { title, description, content, created_at, file_url, category, related_service, video_url } = req.body;
  const date = created_at || new Date().toISOString().split('T')[0];
  try {
    try { db.prepare("ALTER TABLE news ADD COLUMN related_service TEXT").run(); } catch(e) {}
    try { db.prepare("ALTER TABLE news ADD COLUMN video_url TEXT").run(); } catch(e) {}
    db.prepare(`UPDATE news SET title=?, excerpt=?, content=?, date=?, image=?, category=?, related_service=?, video_url=? WHERE id=?`)
      .run(val(title), val(description), val(content), val(date), val(file_url), val(category), val(related_service), val(video_url), req.params.id);
    await syncRowToFirestore("news", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/news/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM news WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("news", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Recruitment Benefits
router.get("/recruitment-benefits", (req: any, res: any) => {
  try {
    const benefits = db.prepare(`SELECT * FROM recruitment_benefits`).all();
    res.json(benefits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/recruitment-benefits", canEditWeb, async (req: any, res: any) => {
  const { title, description, icon } = req.body;
  try {
    const result = db.prepare(`INSERT INTO recruitment_benefits (title, description, icon) VALUES (?,?,?)`)
      .run(val(title), val(description), val(icon));
    await syncRowToFirestore("recruitment_benefits", Number(result.lastInsertRowid));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/recruitment-benefits/:id", canEditWeb, async (req: any, res: any) => {
  const { title, description, icon } = req.body;
  try {
    db.prepare(`UPDATE recruitment_benefits SET title=?, description=?, icon=? WHERE id=?`)
      .run(val(title), val(description), val(icon), req.params.id);
    await syncRowToFirestore("recruitment_benefits", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/recruitment-benefits/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM recruitment_benefits WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("recruitment_benefits", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Recruitment Process
router.get("/recruitment-process", (req: any, res: any) => {
  try {
    const process = db.prepare(`SELECT * FROM recruitment_process ORDER BY step ASC`).all();
    res.json(process);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/recruitment-process", canEditWeb, async (req: any, res: any) => {
  const { step, title, description } = req.body;
  try {
    const result = db.prepare(`INSERT INTO recruitment_process (step, title, description) VALUES (?,?,?)`)
      .run(val(step), val(title), val(description));
    await syncRowToFirestore("recruitment_process", Number(result.lastInsertRowid));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/recruitment-process/:id", canEditWeb, async (req: any, res: any) => {
  const { step, title, description } = req.body;
  try {
    db.prepare(`UPDATE recruitment_process SET step=?, title=?, description=? WHERE id=?`)
      .run(val(step), val(title), val(description), req.params.id);
    await syncRowToFirestore("recruitment_process", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/recruitment-process/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM recruitment_process WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("recruitment_process", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Offices / Branch Offices Management
router.get("/offices", (req: any, res: any) => {
  try {
    const offices = SharedDirectoryService.listOffices();
    res.json(offices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/offices", canEditWeb, async (req: any, res: any) => {
  const { name, short_name, region, address, phone, email, map_url, is_headquarters, latitude, longitude } = req.body;
  try {
    // If setting this one as headquarters, unset any other
    if (is_headquarters) {
      db.prepare(`UPDATE offices SET is_headquarters = 0`).run();
    }
    const result = db.prepare(`INSERT INTO offices (name, short_name, region, address, phone, email, map_url, is_headquarters, latitude, longitude) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(val(name), val(short_name), val(region), val(address), val(phone), val(email), val(map_url), is_headquarters ? 1 : 0, val(latitude), val(longitude));
    await syncRowToFirestore("offices", Number(result.lastInsertRowid));
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("offices_updated");
        io.emit("cms_updated", { type: "offices", method: "POST" });
      }
    } catch (e) {}
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/offices/:id", canEditWeb, async (req: any, res: any) => {
  const { name, short_name, region, address, phone, email, map_url, is_headquarters, latitude, longitude } = req.body;
  try {
    // If setting this one as headquarters, unset any other
    if (is_headquarters) {
      db.prepare(`UPDATE offices SET is_headquarters = 0 WHERE id != ?`).run(req.params.id);
    }
    db.prepare(`UPDATE offices SET name=?, short_name=?, region=?, address=?, phone=?, email=?, map_url=?, is_headquarters=?, latitude=?, longitude=? WHERE id=?`)
      .run(val(name), val(short_name), val(region), val(address), val(phone), val(email), val(map_url), is_headquarters ? 1 : 0, val(latitude), val(longitude), req.params.id);
    await syncRowToFirestore("offices", req.params.id);
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("offices_updated");
        io.emit("cms_updated", { type: "offices", method: "PUT" });
      }
    } catch (e) {}
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/offices/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM offices WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("offices", req.params.id);
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("offices_updated");
        io.emit("cms_updated", { type: "offices", method: "DELETE" });
      }
    } catch (e) {}
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Legal Forms
router.get("/legal-forms", (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT * FROM legal_forms";
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
      const data = db.prepare(query).all(params);
      res.json(data);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/legal-forms", canEditWeb, async (req: any, res: any) => {
  const { title, category, description, content } = req.body;
  try {
    const result = db.prepare(`INSERT INTO legal_forms (title, category, description, content) VALUES (?,?,?,?)`)
      .run(val(title), val(category), val(description), val(content));
    await syncRowToFirestore("legal_forms", Number(result.lastInsertRowid));
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/legal-forms/:id", canEditWeb, async (req: any, res: any) => {
  const { title, category, description, content } = req.body;
  try {
    db.prepare(`UPDATE legal_forms SET title=?, category=?, description=?, content=? WHERE id=?`)
      .run(val(title), val(category), val(description), val(content), req.params.id);
    await syncRowToFirestore("legal_forms", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/legal-forms/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM legal_forms WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("legal_forms", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Judgments
router.get("/judgments", (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT * FROM judgments";
    const params: any = {};

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.date && cursor.id) {
          query += " WHERE date < :cursorDate OR (date = :cursorDate AND id < :cursorId)";
          params.cursorDate = cursor.date;
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY date DESC, id DESC LIMIT :limitPlusOne";
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
      query += " ORDER BY date DESC, id DESC";
      const data = db.prepare(query).all(params);
      res.json(data);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/judgments", canEditWeb, async (req: any, res: any) => {
  const { code, title, court, date, category, summary, content } = req.body;
  try {
    const result = db.prepare(`INSERT INTO judgments (code, title, court, date, category, summary, content) VALUES (?,?,?,?,?,?,?)`)
      .run(val(code), val(title), val(court), val(date), val(category), val(summary), val(content));
    await syncRowToFirestore("judgments", Number(result.lastInsertRowid));
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/judgments/:id", canEditWeb, async (req: any, res: any) => {
  const { code, title, court, date, category, summary, content } = req.body;
  try {
    db.prepare(`UPDATE judgments SET code=?, title=?, court=?, date=?, category=?, summary=?, content=? WHERE id=?`)
      .run(val(code), val(title), val(court), val(date), val(category), val(summary), val(content), req.params.id);
    await syncRowToFirestore("judgments", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/judgments/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM judgments WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("judgments", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Precedents
router.get("/precedents", (req: any, res: any) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT * FROM precedents";
    const params: any = {};

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.approvedDate && cursor.id) {
          query += " WHERE approved_date < :cursorApprovedDate OR (approved_date = :cursorApprovedDate AND id < :cursorId)";
          params.cursorApprovedDate = cursor.approvedDate;
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY approved_date DESC, id DESC LIMIT :limitPlusOne";
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as any[];
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        const lastRow = returnedRows[returnedRows.length - 1];
        nextCursor = encodeCursor({ approvedDate: lastRow.approved_date, id: lastRow.id });
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
      query += " ORDER BY approved_date DESC, id DESC";
      const data = db.prepare(query).all(params);
      res.json(data);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/precedents", canEditWeb, async (req: any, res: any) => {
  const { code, title, approved_date, summary, law_issue, solution } = req.body;
  try {
    const result = db.prepare(`INSERT INTO precedents (code, title, approved_date, summary, law_issue, solution) VALUES (?,?,?,?,?,?)`)
      .run(val(code), val(title), val(approved_date), val(summary), val(law_issue), val(solution));
    await syncRowToFirestore("precedents", Number(result.lastInsertRowid));
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/precedents/:id", canEditWeb, async (req: any, res: any) => {
  const { code, title, approved_date, summary, law_issue, solution } = req.body;
  try {
    db.prepare(`UPDATE precedents SET code=?, title=?, approved_date=?, summary=?, law_issue=?, solution=? WHERE id=?`)
      .run(val(code), val(title), val(approved_date), val(summary), val(law_issue), val(solution), req.params.id);
    await syncRowToFirestore("precedents", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/precedents/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM precedents WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("precedents", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Testimonials
router.get("/testimonials", (req: any, res: any) => {
  try {
    const data = db.prepare(`SELECT * FROM testimonials`).all();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/testimonials", canEditWeb, async (req: any, res: any) => {
  const { name, role, rating, content, avatar, company } = req.body;
  try {
    const result = db.prepare(`INSERT INTO testimonials (name, role, rating, content, avatar, company) VALUES (?,?,?,?,?,?)`)
      .run(val(name), val(role), Number(rating) || 5, val(content), val(avatar), val(company));
    await syncRowToFirestore("testimonials", Number(result.lastInsertRowid));
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/testimonials/:id", canEditWeb, async (req: any, res: any) => {
  const { name, role, rating, content, avatar, company } = req.body;
  try {
    db.prepare(`UPDATE testimonials SET name=?, role=?, rating=?, content=?, avatar=?, company=? WHERE id=?`)
      .run(val(name), val(role), Number(rating) || 5, val(content), val(avatar), val(company), req.params.id);
    await syncRowToFirestore("testimonials", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/testimonials/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM testimonials WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("testimonials", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Land Prices
router.get("/land-prices", (req: any, res: any) => {
  try {
    const data = db.prepare(`SELECT * FROM land_prices`).all();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to get province code from name
function getProvinceCode(name: string): string {
  if (!name) return "KHAC";
  const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d");
  if (norm.includes("ha noi")) return "HN";
  if (norm.includes("ho chi minh")) return "HCM";
  if (norm.includes("da nang")) return "DN";
  if (norm.includes("quang nam")) return "QNA";
  
  return name
    .split(/\s+/)
    .filter(word => word && word[0] === word[0].toUpperCase())
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

// Land Prices
router.get("/land-prices", (req: any, res: any) => {
  try {
    const data = db.prepare(`SELECT * FROM land_prices ORDER BY id DESC`).all();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/land-prices", canEditWeb, async (req: any, res: any) => {
  const { 
    province_code, province_name, district_id, district_name, ward_name, street_name, price,
    residential_price, commercial_price, non_agricultural_price, agricultural_price 
  } = req.body;
  try {
    const isApproved = getIsApprovedDefault(req);
    const code = province_code || getProvinceCode(province_name);
    const result = db.prepare(`
      INSERT INTO land_prices (
        province_code, province_name, district_id, district_name, ward_name, street_name, price, 
        residential_price, commercial_price, non_agricultural_price, agricultural_price, is_approved
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      val(code), val(province_name), val(district_id), val(district_name), val(ward_name), val(street_name), 
      Number(price) || 0, val(residential_price), val(commercial_price), val(non_agricultural_price), val(agricultural_price), isApproved
    );
    await syncRowToFirestore("land_prices", Number(result.lastInsertRowid));
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/land-prices/:id", canEditWeb, async (req: any, res: any) => {
  const { 
    province_code, province_name, district_id, district_name, ward_name, street_name, price,
    residential_price, commercial_price, non_agricultural_price, agricultural_price 
  } = req.body;
  try {
    const code = province_code || getProvinceCode(province_name);
    db.prepare(`
      UPDATE land_prices SET 
        province_code=?, province_name=?, district_id=?, district_name=?, ward_name=?, street_name=?, price=?, 
        residential_price=?, commercial_price=?, non_agricultural_price=?, agricultural_price=? 
      WHERE id=?
    `).run(
      val(code), val(province_name), val(district_id), val(district_name), val(ward_name), val(street_name), Number(price) || 0, 
      val(residential_price), val(commercial_price), val(non_agricultural_price), val(agricultural_price), req.params.id
    );
    await syncRowToFirestore("land_prices", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/land-prices/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM land_prices WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("land_prices", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Subdivision Limits
router.get("/subdivision-limits", (req: any, res: any) => {
  try {
    const data = db.prepare(`SELECT * FROM subdivision_limits ORDER BY id DESC`).all();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/subdivision-limits", canEditWeb, async (req: any, res: any) => {
  const { province_name, district_name, ward_name, subdivision_area, residential_limit } = req.body;
  try {
    const isApproved = getIsApprovedDefault(req);
    const result = db.prepare(`
      INSERT INTO subdivision_limits (province_name, district_name, ward_name, subdivision_area, residential_limit, is_approved) 
      VALUES (?,?,?,?,?,?)
    `).run(val(province_name), val(district_name), val(ward_name), val(subdivision_area), val(residential_limit), isApproved);
    await syncRowToFirestore("subdivision_limits", Number(result.lastInsertRowid));
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/subdivision-limits/:id", canEditWeb, async (req: any, res: any) => {
  const { province_name, district_name, ward_name, subdivision_area, residential_limit } = req.body;
  try {
    db.prepare(`
      UPDATE subdivision_limits SET province_name=?, district_name=?, ward_name=?, subdivision_area=?, residential_limit=? 
      WHERE id=?
    `).run(val(province_name), val(district_name), val(ward_name), val(subdivision_area), val(residential_limit), req.params.id);
    await syncRowToFirestore("subdivision_limits", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/subdivision-limits/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare(`DELETE FROM subdivision_limits WHERE id=?`).run(req.params.id);
    await deleteFromFirestore("subdivision_limits", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Scanning - Land Prices
router.post("/scan-land-prices", canEditWeb, upload.any(), async (req: any, res: any) => {
  try {
    const { province_name } = req.body;
    if (!province_name) {
      return res.status(400).json({ error: "Missing province_name" });
    }

    let fileText = "";
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (file) {
      const uploadDir = process.env.NODE_ENV === "production" ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const safeName = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'upload.bin';
      const filename = `${Date.now()}_${safeName}`;
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, file.buffer);

      fileText = await extractTextFromFile(fullPath);

      try {
        fs.unlinkSync(fullPath);
      } catch (err) {}
    } else if (req.body.text) {
      fileText = req.body.text;
    }

    if (!fileText || fileText.trim().length === 0) {
      return res.status(400).json({ error: "Không tìm thấy nội dung văn bản để phân tích." });
    }

    const aiProvider = getResolvedAiProvider("all");
    let apiKey = aiProvider.api_key || process.env.GEMINI_API_KEY;
    if (apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'dummy' || apiKey === 'your_api_key_here') {
      apiKey = undefined;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Bạn là một chuyên gia phân tích văn bản pháp lý Việt Nam. Nhiệm vụ của bạn là đọc kỹ văn bản quy định về bảng giá đất dưới đây thuộc tỉnh/thành phố: "${province_name}".
Hãy quét văn bản, xác định đơn giá đất của từng địa phương như xã/phường/đường phố... trong văn bản này và trích xuất thành danh sách JSON có cấu trúc chính xác.

Hãy trích xuất:
- Tên quận/huyện (district_name)
- Tên xã/phường (ward_name)
- Tên đường phố, khu vực hoặc vị trí cụ thể (street_name)
- Đơn giá đất ở trung bình/cao nhất hoặc giá cụ thể (price) - Chuyển sang dạng số nguyên đại diện (ví dụ: "15,000,000" -> 15000000), nếu không có thì tính toán hoặc để 0.
- Giá đất ở (residential_price) - Ghi rõ đơn vị hoặc số cụ thể (ví dụ: "15.0 triệu/m²" hoặc "15,000,000")
- Giá đất thương mại dịch vụ (commercial_price) - Trích xuất nếu có, nếu không có ghi "Chưa cập nhật"
- Giá đất phi nông nghiệp khác (non_agricultural_price) - Trích xuất nếu có, nếu không có ghi "Chưa cập nhật"
- Giá đất nông nghiệp (agricultural_price) - Trích xuất nếu có, nếu không có ghi "Chưa cập nhật"

Nội dung văn bản quy định về giá đất:
"""
${fileText}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              district_name: { type: Type.STRING },
              ward_name: { type: Type.STRING },
              street_name: { type: Type.STRING },
              price: { type: Type.INTEGER },
              residential_price: { type: Type.STRING },
              commercial_price: { type: Type.STRING },
              non_agricultural_price: { type: Type.STRING },
              agricultural_price: { type: Type.STRING },
            },
            required: ["district_name", "ward_name", "street_name", "residential_price"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Không nhận được phản hồi từ AI");
    }

    const parsedRows = JSON.parse(responseText);
    const isApproved = getIsApprovedDefault(req);
    const code = getProvinceCode(province_name);

    const insertStmt = db.prepare(`
      INSERT INTO land_prices (
        province_code, province_name, district_id, district_name, ward_name, street_name, price, 
        residential_price, commercial_price, non_agricultural_price, agricultural_price, is_approved
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const savedRecords: any[] = [];
    for (const r of parsedRows) {
      const res = insertStmt.run(
        code,
        province_name,
        "", // district_id
        r.district_name || "",
        r.ward_name || "",
        r.street_name || "",
        Number(r.price) || 0,
        r.residential_price || "",
        r.commercial_price || "Chưa cập nhật",
        r.non_agricultural_price || "Chưa cập nhật",
        r.agricultural_price || "Chưa cập nhật",
        isApproved
      );
      
      const newId = Number(res.lastInsertRowid);
      await syncRowToFirestore("land_prices", newId);
      savedRecords.push({ id: newId, ...r });
    }

    res.json({ success: true, count: savedRecords.length, data: savedRecords });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Scanning - Subdivision Limits
router.post("/scan-subdivision-limits", canEditWeb, upload.any(), async (req: any, res: any) => {
  try {
    const { province_name } = req.body;
    if (!province_name) {
      return res.status(400).json({ error: "Missing province_name" });
    }

    let fileText = "";
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (file) {
      const uploadDir = process.env.NODE_ENV === "production" ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const safeName = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'upload.bin';
      const filename = `${Date.now()}_${safeName}`;
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, file.buffer);

      fileText = await extractTextFromFile(fullPath);

      try {
        fs.unlinkSync(fullPath);
      } catch (err) {}
    } else if (req.body.text) {
      fileText = req.body.text;
    }

    if (!fileText || fileText.trim().length === 0) {
      return res.status(400).json({ error: "Không tìm thấy nội dung văn bản để phân tích." });
    }

    const aiProvider = getResolvedAiProvider("all");
    let apiKey = aiProvider.api_key || process.env.GEMINI_API_KEY;
    if (apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'dummy' || apiKey === 'your_api_key_here') {
      apiKey = undefined;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Bạn là một chuyên gia phân tích văn bản pháp lý Việt Nam. Nhiệm vụ của bạn là đọc kỹ văn bản quy định dưới đây về diện tích tối thiểu được tách thửa và diện tích đất ở (hạn mức giao đất ở hoặc công nhận đất ở) thuộc tỉnh/thành phố: "${province_name}".
Hãy quét văn bản, xác định quy định cụ thể của từng địa phương (quận, huyện, xã, phường, thị trấn...) và trích xuất thành danh sách JSON có cấu trúc chính xác.

Hãy trích xuất:
- Tên quận/huyện (district_name)
- Tên xã/phường (ward_name)
- Diện tích tách thửa tối thiểu (subdivision_area) - Ghi rõ điều kiện hoặc diện tích tối thiểu (ví dụ: "40 m²", "Tối thiểu 50 m² và chiều rộng mặt tiền >= 4m")
- Hạn mức đất ở / Diện tích đất ở tối đa hoặc hạn mức giao (residential_limit) - Trích xuất nếu có, nếu không ghi "Chưa cập nhật"

Nội dung văn bản quy định:
"""
${fileText}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              district_name: { type: Type.STRING },
              ward_name: { type: Type.STRING },
              subdivision_area: { type: Type.STRING },
              residential_limit: { type: Type.STRING }
            },
            required: ["district_name", "ward_name", "subdivision_area", "residential_limit"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Không nhận được phản hồi từ AI");
    }

    const parsedRows = JSON.parse(responseText);
    const isApproved = getIsApprovedDefault(req);

    const insertStmt = db.prepare(`
      INSERT INTO subdivision_limits (province_name, district_name, ward_name, subdivision_area, residential_limit, is_approved) 
      VALUES (?,?,?,?,?,?)
    `);

    const savedRecords: any[] = [];
    for (const r of parsedRows) {
      const res = insertStmt.run(
        province_name,
        r.district_name || "",
        r.ward_name || "",
        r.subdivision_area || "",
        r.residential_limit || "Chưa cập nhật",
        isApproved
      );
      
      const newId = Number(res.lastInsertRowid);
      await syncRowToFirestore("subdivision_limits", newId);
      savedRecords.push({ id: newId, ...r });
    }

    res.json({ success: true, count: savedRecords.length, data: savedRecords });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// LAND DOCUMENTS - LOCAL DATABASE ENDPOINTS
// =========================================================================

// GET /api/cms/land-documents
router.get("/land-documents", async (req: any, res: any) => {
  try {
    const { province_name, doc_type } = req.query;
    let query = "SELECT * FROM land_documents";
    const params: any[] = [];
    
    if (province_name || doc_type) {
      query += " WHERE";
      const conditions: string[] = [];
      if (province_name) {
        conditions.push(" province_name = ?");
        params.push(province_name);
      }
      if (doc_type) {
        conditions.push(" doc_type = ?");
        params.push(doc_type);
      }
      query += conditions.join(" AND");
    }
    
    query += " ORDER BY id DESC";
    const docs = db.prepare(query).all(...params);
    res.json({ success: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cms/save-land-document
router.post("/save-land-document", canEditWeb, upload.any(), async (req: any, res: any) => {
  try {
    const { province_name, doc_type, text } = req.body;
    if (!province_name) {
      return res.status(400).json({ error: "Missing province_name" });
    }
    if (!doc_type) {
      return res.status(400).json({ error: "Missing doc_type" });
    }

    let fileText = "";
    let originalName = "Nội dung dán trực tiếp";
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;

    if (file) {
      originalName = file.originalname || "Văn bản đính kèm";
      const uploadDir = process.env.NODE_ENV === "production" ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const safeName = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'upload.bin';
      const filename = `${Date.now()}_${safeName}`;
      const fullPath = path.join(uploadDir, filename);
      fs.writeFileSync(fullPath, file.buffer);

      fileText = await extractTextFromFile(fullPath);

      try {
        fs.unlinkSync(fullPath);
      } catch (err) {}
    } else if (text) {
      fileText = text;
    }

    if (!fileText || fileText.trim().length === 0) {
      return res.status(400).json({ error: "Không tìm thấy nội dung văn bản để lưu." });
    }

    const code = getProvinceCode(province_name);
    const uploadedAt = new Date().toLocaleString("vi-VN");

    const result = db.prepare(`
      INSERT INTO land_documents (province_name, province_code, file_name, uploaded_at, content, doc_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(province_name, code, originalName, uploadedAt, fileText, doc_type);

    const newId = Number(result.lastInsertRowid);
    await syncRowToFirestore("land_documents", newId);

    // ALSO AUTOMATICALLY trigger AI extraction into land_prices / subdivision_limits as well so they are in sync!
    try {
      const aiProvider = getResolvedAiProvider("all");
      let apiKey = aiProvider.api_key || process.env.GEMINI_API_KEY;
      if (apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'dummy' || apiKey === 'your_api_key_here') {
        apiKey = undefined;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      if (doc_type === "price") {
        const prompt = `Bạn là một chuyên gia phân tích văn bản pháp lý Việt Nam. Nhiệm vụ của bạn là đọc kỹ văn bản quy định về bảng giá đất dưới đây thuộc tỉnh/thành phố: "${province_name}".
Hãy quét văn bản, xác định đơn giá đất của từng địa phương như xã/phường/đường phố... trong văn bản này và trích xuất thành danh sách JSON có cấu trúc chính xác.

Hãy trích xuất:
- Tên quận/huyện (district_name)
- Tên xã/phường (ward_name)
- Tên đường phố, khu vực hoặc vị trí cụ thể (street_name)
- Đơn giá đất ở trung bình/cao nhất hoặc giá cụ thể (price) - Chuyển sang dạng số nguyên đại diện (ví dụ: "15,000,000" -> 15000000), nếu không có thì tính toán hoặc để 0.
- Giá đất ở (residential_price) - Ghi rõ đơn vị hoặc số cụ thể (ví dụ: "15.0 triệu/m²" hoặc "15,000,000")
- Giá đất thương mại dịch vụ (commercial_price) - Trích xuất nếu có, nếu không có ghi "Chưa cập nhật"
- Giá đất phi nông nghiệp khác (non_agricultural_price) - Trích xuất nếu có, nếu không có ghi "Chưa cập nhật"
- Giá đất nông nghiệp (agricultural_price) - Trích xuất nếu có, nếu không có ghi "Chưa cập nhật"

Nội dung văn bản quy định về giá đất:
"""
${fileText}
"""`;

// Auto land price extraction
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  district_name: { type: Type.STRING },
                  ward_name: { type: Type.STRING },
                  street_name: { type: Type.STRING },
                  price: { type: Type.INTEGER },
                  residential_price: { type: Type.STRING },
                  commercial_price: { type: Type.STRING },
                  non_agricultural_price: { type: Type.STRING },
                  agricultural_price: { type: Type.STRING },
                },
                required: ["district_name", "ward_name", "street_name", "residential_price"]
              }
            }
          }
        });

        const responseText = response.text;
        if (responseText) {
          const parsedRows = JSON.parse(responseText);
          const isApproved = getIsApprovedDefault(req);
          const insertStmt = db.prepare(`
            INSERT INTO land_prices (
              province_code, province_name, district_id, district_name, ward_name, street_name, price, 
              residential_price, commercial_price, non_agricultural_price, agricultural_price, is_approved
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
          `);
          for (const r of parsedRows) {
            const priceRes = insertStmt.run(
              code,
              province_name,
              "",
              r.district_name || "",
              r.ward_name || "",
              r.street_name || "",
              Number(r.price) || 0,
              r.residential_price || "",
              r.commercial_price || "Chưa cập nhật",
              r.non_agricultural_price || "Chưa cập nhật",
              r.agricultural_price || "Chưa cập nhật",
              isApproved
            );
            await syncRowToFirestore("land_prices", Number(priceRes.lastInsertRowid));
          }
        }
      } else {
        // subdivision limits
        const prompt = `Bạn là một chuyên gia phân tích văn bản pháp lý Việt Nam. Nhiệm vụ của bạn là đọc kỹ văn bản quy định dưới đây về diện tích tối thiểu được tách thửa và diện tích đất ở (hạn mức giao đất ở hoặc công nhận đất ở) thuộc tỉnh/thành phố: "${province_name}".
Hãy quét văn bản, xác định quy định cụ thể của từng địa phương (quận, huyện, xã, phường, thị trấn...) và trích xuất thành danh sách JSON có cấu trúc chính xác.

Hãy trích xuất:
- Tên quận/huyện (district_name)
- Tên xã/phường (ward_name)
- Diện tích tách thửa tối thiểu (subdivision_area) - Ghi rõ điều kiện hoặc diện tích tối thiểu (ví dụ: "40 m²", "Tối thiểu 50 m² và chiều rộng mặt tiền >= 4m")
- Hạn mức đất ở / Diện tích đất ở tối đa hoặc hạn mức giao (residential_limit) - Trích xuất nếu có, nếu không ghi "Chưa cập nhật"

Nội dung văn bản quy định:
"""
${fileText}
"""`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  district_name: { type: Type.STRING },
                  ward_name: { type: Type.STRING },
                  subdivision_area: { type: Type.STRING },
                  residential_limit: { type: Type.STRING }
                },
                required: ["district_name", "ward_name", "subdivision_area", "residential_limit"]
              }
            }
          }
        });

        const responseText = response.text;
        if (responseText) {
          const parsedRows = JSON.parse(responseText);
          const isApproved = getIsApprovedDefault(req);
          const insertStmt = db.prepare(`
            INSERT INTO subdivision_limits (province_name, district_name, ward_name, subdivision_area, residential_limit, is_approved) 
            VALUES (?,?,?,?,?,?)
          `);
          for (const r of parsedRows) {
            const limitRes = insertStmt.run(
              province_name,
              r.district_name || "",
              r.ward_name || "",
              r.subdivision_area || "",
              r.residential_limit || "Chưa cập nhật",
              isApproved
            );
            await syncRowToFirestore("subdivision_limits", Number(limitRes.lastInsertRowid));
          }
        }
      }
    } catch (aiErr: any) {
      console.error("AI automated extraction failed but file saved successfully:", aiErr.message);
    }

    res.json({ success: true, id: newId, file_name: originalName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cms/land-documents/:id
router.delete("/land-documents/:id", canEditWeb, async (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM land_documents WHERE id = ?").run(req.params.id);
    await deleteFromFirestore("land_documents", req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cms/query-land-document
router.post("/query-land-document", async (req: any, res: any) => {
  try {
    const { province_name, query } = req.body;
    if (!province_name || !query) {
      return res.status(400).json({ error: "Thiếu province_name hoặc query." });
    }

    // Get all documents for this province
    const docs = db.prepare("SELECT file_name, content FROM land_documents WHERE province_name = ?").all(province_name) as any[];
    if (docs.length === 0) {
      return res.json({ success: true, answer: `Hiện tại chưa có tài liệu cơ sở dữ liệu đất đai nào được tải lên cho **${province_name}**. Bạn vui lòng tải lên tài liệu văn bản để AI có thể phân tích và trả lời.` });
    }

    // Combine contents
    let combinedContent = "";
    docs.forEach((doc, idx) => {
      combinedContent += `--- TÀI LIỆU ${idx + 1}: ${doc.file_name} ---\n${doc.content}\n\n`;
    });

    const aiProvider = getResolvedAiProvider("all");
    let apiKey = aiProvider.api_key || process.env.GEMINI_API_KEY;
    if (apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'dummy' || apiKey === 'your_api_key_here') {
      apiKey = undefined;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Bạn là trợ lý AI chuyên nghiệp phân tích đất đai Việt Nam. Dưới đây là các tài liệu cơ sở dữ liệu đất đai được tải lên cho địa phương "${province_name}":
"""
${combinedContent.substring(0, 15000)} // Safe limit
"""

Dựa vào các tài liệu đất đai trên, hãy trả lời câu hỏi sau đây của người dùng một cách chính xác, chi tiết và có căn cứ:
"${query}"

Nếu trong tài liệu không có thông tin để trả lời, hãy báo cho người dùng biết một cách khách quan dựa trên những gì tài liệu cung cấp.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ success: true, answer: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// CMS CONTENT APPROVAL & ATTENDANCE & REPORT UNLOCK ENDPOINTS FOR CONTROLLER
// =========================================================================

// GET Pending CMS approvals
router.get("/pending-approvals", (req: any, res: any) => {
  try {
    const pending: any[] = [];
    const tables = ["legal_forms", "judgments", "precedents", "testimonials", "news", "services", "land_prices", "subdivision_limits"];
    for (const t of tables) {
      try {
        const rows = db.prepare(`SELECT * FROM ${t} WHERE is_approved = 0`).all() as any[];
        rows.forEach((r: any) => {
          let itemTitle = r.title || r.name || r.code;
          if (!itemTitle && r.street_name) {
            itemTitle = `${r.street_name} (${r.district_name || ''})`;
          }
          if (t === "subdivision_limits") {
            itemTitle = `Tách thửa & Đất ở: ${r.ward_name || ''} - ${r.district_name || r.province_name || ''}`;
          }
          if (!itemTitle) {
            itemTitle = `CMS Item #${r.id}`;
          }

          let desc = r.description || r.summary || r.excerpt || r.content;
          if (!desc && r.price) {
            desc = `Đơn giá: ${r.price.toLocaleString('vi-VN')} VNĐ/m²`;
          } else if (t === "land_prices") {
            desc = `Đất ở: ${r.residential_price || 'Chưa cập nhật'}, TM-DV: ${r.commercial_price || 'Chưa cập nhật'}`;
          } else if (t === "subdivision_limits") {
            desc = `Tách thửa: ${r.subdivision_area || 'Chưa cập nhật'}, Hạn mức: ${r.residential_limit || 'Chưa cập nhật'}`;
          }

          pending.push({
            id: r.id,
            title: itemTitle,
            description: desc || "",
            contentType: t,
            created_by: r.created_by || "Nhân viên",
            date: r.date || r.approved_date || ""
          });
        });
      } catch (err) {}
    }
    res.json(pending);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Approve CMS Content
router.post("/approve-content", async (req: any, res: any) => {
  const { type, id } = req.body;
  try {
    db.prepare(`UPDATE ${type} SET is_approved = 1 WHERE id = ?`).run(id);
    await syncRowToFirestore(type, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Reject/Delete CMS Content
router.post("/reject-content", async (req: any, res: any) => {
  const { type, id } = req.body;
  try {
    db.prepare(`DELETE FROM ${type} WHERE id = ?`).run(id);
    await deleteFromFirestore(type, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Attendance log
router.get("/attendance", (req: any, res: any) => {
  try {
    const { userId, date } = req.query;
    let query = "SELECT * FROM attendance";
    const params: any[] = [];
    
    if (userId && date) {
      query += " WHERE user_id = ? AND date = ?";
      params.push(userId, date);
    } else if (userId) {
      query += " WHERE user_id = ?";
      params.push(userId);
    } else if (date) {
      query += " WHERE date = ?";
      params.push(date);
    }
    query += " ORDER BY date DESC, id DESC";
    const rows = db.prepare(query).all(params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Staff Check-in
router.post("/attendance/check-in", (req: any, res: any) => {
  const { userId, staffCode, staffName, role, date, status, checkInTime, explanation, proofFile } = req.body;
  try {
    const existing = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?").get(userId, date) as any;
    if (existing) {
      db.prepare(`UPDATE attendance SET status = ?, check_in_time = ?, explanation = ?, proof_file = ?, approved_by_controller = 0 WHERE id = ?`)
        .run(status, checkInTime, val(explanation), val(proofFile), existing.id);
    } else {
      db.prepare(`INSERT INTO attendance (user_id, staff_code, staff_name, role, date, status, check_in_time, explanation, proof_file, approved_by_controller) VALUES (?,?,?,?,?,?,?,?,?,0)`)
        .run(userId, val(staffCode), val(staffName), val(role), date, status, checkInTime, val(explanation), val(proofFile));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Bulk Attendance by Admin/Controller
router.post("/attendance/bulk", (req: any, res: any) => {
  const { date, role, status, checkInTime } = req.body;
  try {
    let usersQuery = "SELECT id, username, name, role, staff_code FROM users";
    const params: any[] = [];
    if (role && role !== "All") {
      usersQuery += " WHERE role = ?";
      params.push(role);
    }
    const targetUsers = db.prepare(usersQuery).all(params) as any[];
    
    for (const u of targetUsers) {
      const existing = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?").get(u.id, date) as any;
      if (existing) {
        db.prepare(`UPDATE attendance SET status = ?, check_in_time = ?, approved_by_controller = 1 WHERE id = ?`)
          .run(status, checkInTime, existing.id);
      } else {
        db.prepare(`INSERT INTO attendance (user_id, staff_code, staff_name, role, date, status, check_in_time, approved_by_controller) VALUES (?,?,?,?,?,?,?,1)`)
          .run(u.id, u.staff_code || "", u.name || u.username, u.role || "user", date, status, checkInTime);
      }
    }
    res.json({ success: true, count: targetUsers.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Approve/Reject Late Check-in
router.post("/attendance/approve-late", (req: any, res: any) => {
  const { id, approve } = req.body;
  try {
    const status = approve ? "Present" : "Late_Rejected";
    const valApproved = approve ? 1 : -1;
    db.prepare("UPDATE attendance SET status = ?, approved_by_controller = ? WHERE id = ?").run(status, valApproved, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET Report Unlock Requests
router.get("/unlock-requests", (req: any, res: any) => {
  try {
    const rows = db.prepare("SELECT * FROM report_unlock_requests ORDER BY id DESC").all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Create Unlock Request
router.post("/unlock-requests/create", (req: any, res: any) => {
  const { dossierId, clientName, staffName, eventTitle, eventDate, reason } = req.body;
  const createdAt = new Date().toISOString();
  try {
    db.prepare(`INSERT INTO report_unlock_requests (dossier_id, client_name, staff_name, event_title, event_date, reason, status, created_at) VALUES (?,?,?,?,?,?,'pending',?)`)
      .run(val(dossierId), val(clientName), val(staffName), val(eventTitle), val(eventDate), val(reason), createdAt);
    
    try {
      const io = req.app.get("io");
      if (io) io.emit("unlock_requests_updated");
    } catch (e) {}

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Approve/Reject Unlock Request
router.post("/unlock-requests/approve", (req: any, res: any) => {
  const { id, approve } = req.body;
  try {
    const status = approve ? "approved" : "rejected";
    db.prepare("UPDATE report_unlock_requests SET status = ? WHERE id = ?").run(status, id);
    
    try {
      const io = req.app.get("io");
      if (io) io.emit("unlock_requests_updated");
    } catch (e) {}

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
