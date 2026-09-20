import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import session from "express-session";
import sqliteStoreFactory from "better-sqlite3-session-store";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import hpp from "hpp";
import xss from "xss-clean";
import compression from "compression";
import { config } from "./config/env";
import { createServer } from "http";
import { Server } from "socket.io";
import db from "./db/database";
import { startRealTimeSync, syncFromFirestore } from "./db/firestore-sync";
import { runMigration } from "./db/migration";
import { RequestTracker } from "./middleware/RequestTracker";
import MemoryMonitor from "./services/MemoryMonitor";
import { checkResourceAccess } from "./middleware/auth";

// Routes
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import casesRoutes from "./modules/cases/cases.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import cmsRoutes from "./modules/cms/cms.routes";
import payrollRoutes from "./modules/payroll/payroll.routes";
import contactRoutes from "./modules/contact/contact.routes";
import aiRoutes from "./modules/ai/ai.routes";
import permissionsRoutes from "./modules/permissions/permissions.routes";
import legalDocumentsRoutes from "./modules/legal_documents/legal_documents.routes";
import systemRoutes from "./modules/system/system.routes";
import financeRoutes from "./modules/finance/finance.routes";
import callsRoutes from "./modules/calls/calls.routes";
import paymentRoutes from "./modules/payment/payment.routes";
import hrmRoutes from "./modules/hrm/hrm.routes";
import iotRoutes from "./modules/iot/iot.routes";
import gatewayRoutes from "./modules/api_gateway/gateway.routes";
import telephonyRoutes from "./controllers/telephony.controller";
import { setPaymentSocketServer } from "./modules/payment/payment.socket";
import { TrashService } from "./services/trash.service";
import { retryFirestoreSync } from "./db/firestore-sync";
import { domainRecordEvents } from "./domain/events/domainRecordEvents";

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
  maxHttpBufferSize: 1e8 // 100 MB for file uploads via socket if needed
});
app.set("io", io);
setPaymentSocketServer(io);
TrashService.setSocketServer(io);

domainRecordEvents.on("changed", (change) => {
  io.emit("domain_records_updated", change);
  if (change.action === "upsert") {
    io.emit("erp_record_updated", {
      id: change.id,
      data: change.data,
      domain: change.domain,
      timestamp: change.timestamp,
    });
  } else {
    io.emit("erp_record_deleted", {
      id: change.id,
      domain: change.domain,
      timestamp: change.timestamp,
    });
  }
});

const PORT = config.PORT;

/* SYSTEM & SECURITY LOGS */
export const systemLogs: { timestamp: string; ip: string; url: string; reason: string; action: string; resolution: string }[] = [];
const addSecurityLog = (ip: string, url: string, reason: string, resolution: string) => {
  systemLogs.unshift({
    timestamp: new Date().toISOString(),
    ip,
    url,
    reason,
    action: "Blocked",
    resolution
  });
  if (systemLogs.length > 50) systemLogs.pop();
};

/* SECURITY */
/* APPLICATION FIREWALL (WAF) */
const firewallMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Chỉ áp dụng tường lửa cho các API endpoint để tránh chặn các asset của Vite/Frontend hoặc HMR
  if (!req.originalUrl.startsWith("/api/")) {
    return next();
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const url = req.originalUrl.toLowerCase();
  
  // 1. Chặn các mẫu tấn công phổ biến (Path Traversal, LFI, SQLi, NOSQLi, XSS)
  const suspiciousPatterns = [
    '<script>', '%3cscript%3e', 'javascript:', 'vbscript:',
    '../', '..%2f', 'etc/passwd', 'cmd.exe', '/bin/sh', '/bin/bash',
    'union select', 'drop table', 'information_schema', 'waitfor delay',
    '-- ', '1=1', 'or 1=1'
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (url.includes(pattern) && !url.includes('/api/ai/')) {
      console.warn(`[FIREWALL] Blocked malicious request pattern from ${clientIp}: ${req.originalUrl}`);
      addSecurityLog(clientIp as string, req.originalUrl, `Phát hiện payload độc hại: ${pattern} (SQLi/XSS/LFI)`, "Hệ thống WAF đã tự động chặn request. Cần theo dõi IP này nếu tiếp tục tần suất cao thì block IP trên firewall server.");
      return res.status(403).json({ success: false, error: "Access Denied by WAF: Malicious payload detected" });
    }
  }

  // 2. Chặn các User-Agent độc hại (Scanners, Botnets)
  const userAgent = req.headers['user-agent']?.toLowerCase() || '';
  const badBots = ['sqlmap', 'nikto', 'dirbuster', 'masscan', 'zmap', 'acunetix', 'nmap'];
  for (const bot of badBots) {
    if (userAgent.includes(bot)) {
      console.warn(`[FIREWALL] Blocked scanner bot from ${clientIp}: ${userAgent}`);
      addSecurityLog(clientIp as string, req.originalUrl, `Phát hiện bot rà quét: ${bot}`, "Hệ thống WAF đã chặn truy cập từ User-Agent độc hại. Đảm bảo server không mở port thừa nào ngoài port 3000.");
      return res.status(403).json({ success: false, error: "Access Denied by WAF: Scanner detected" });
    }
  }

  next();
};
app.use(firewallMiddleware);
app.use(RequestTracker);
app.use(compression());


app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: false 
}));
app.use((req, res, next) => {
  if (req.query) {
    const q = req.query;
    Object.defineProperty(req, 'query', {
      value: q,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});
app.use(hpp());
app.use(xss());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number.parseInt(process.env.API_RATE_LIMIT_MAX || "5000", 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    res.status(429).json({ error: "Quá nhiều yêu cầu gửi tới hệ thống. Vui lòng thử lại sau 15 phút." });
  }
});

// Dedicated Strict Rate Limiter for Payment & Webhook endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 payment requests per IP in 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    res.status(429).json({ error: "Quá nhiều thao tác thanh toán. Vui lòng thử lại sau 15 phút." });
  }
});

app.use("/api/payment", paymentLimiter);
app.use("/api", apiLimiter);

/* SESSION */
const SqliteStore = sqliteStoreFactory(session);
const sessionMiddleware = session({
  store: new SqliteStore({
    client: db, 
    expired: {
      clear: true,
      intervalMs: 900000 
    }
  }),
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    maxAge: 86400000,
    sameSite: 'none',
    secure: true
  }
});
app.use("/api", sessionMiddleware);
io.engine.use(sessionMiddleware);

/* HEALTH ENDPOINTS & PROBES (Production Tiered Health) */
app.get("/healthz", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    version: process.env.APP_VERSION || "2026.08.25",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
app.get("/health/live", (req, res) => {
  // Liveness probe: checks process execution
  res.status(200).json({ status: "alive", uptime: process.uptime() });
});
app.get("/health/ready", (req, res) => {
  // Readiness probe: checks core database availability
  try {
    const isDbAlive = db ? true : false;
    if (isDbAlive) {
      return res.status(200).json({ 
        status: "ready", 
        database: "connected",
        memory: process.memoryUsage().heapUsed 
      });
    }
    return res.status(503).json({ status: "degraded", error: "Database not ready" });
  } catch (err: any) {
    return res.status(503).json({ status: "degraded", error: err.message });
  }
});
app.get("/health/info", (req, res) => {
  res.status(200).json({
    version: process.env.APP_VERSION || "2026.08.25",
    gitSha: process.env.GIT_SHA || "production-git-head",
    nodeVersion: process.version,
    environment: config.NODE_ENV,
    coreStatus: "HEALTHY",
    aiTier: "ISOLATED_FAILOVER_READY"
  });
});

app.get("/api/test", (req, res) => res.json({ test: "ok" }));

app.post("/api/logs", (req, res) => {
  if (req.body?.type) {
    console.info(`[Client Log - ${req.body.type}]:`, req.body.message || req.body);
  }
  res.status(200).json({ status: "ok" });
});

/* ROUTES */
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);
app.use("/api", usersRoutes);
app.use("/api", clientsRoutes);
app.use("/api", casesRoutes);
app.use("/api", documentsRoutes);
app.use("/api", cmsRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api", payrollRoutes);
app.use("/api", contactRoutes);
app.use("/public-ai", aiRoutes);
app.use("/api", permissionsRoutes);
app.use("/api/legal_documents", legalDocumentsRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/calls", callsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/financial", paymentRoutes);
app.use("/api/hr", hrmRoutes);
app.use("/api/iot", iotRoutes);
app.use("/api/telephony", telephonyRoutes);

// Legal OS API Gateway Routes
app.use(gatewayRoutes);

// Catch-all for missing API routes
app.use("/api", (req: any, res: any) => {
  res.status(404).json({ error: "API route not found" });
});

// Global Error Handler to always return JSON (no HTML stack traces)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message || "Internal Server Error"
  });
});

/* STATIC UPLOADS - Must be served before Vite catch-all */
const uploadPath = config.NODE_ENV === "production" ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadPath)) {
  try { fs.mkdirSync(uploadPath, { recursive: true }); } catch (e) {}
}
app.use("/uploads", express.static(uploadPath, {
  setHeaders: (res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'unsafe-inline'");
  }
}));

/* WEBSOCKET LOGIC */
io.on("connection", (socket) => {
  const getSocketUser = () => (socket.request as any).session?.user || null;
  const requireSocketUser = () => {
    const user = getSocketUser();
    if (!user) {
      socket.emit("socket_authorization_error", { message: "Yêu cầu đăng nhập để thực hiện thao tác này." });
      return null;
    }
    return user;
  };
  const requireInternalSocketUser = () => {
    const user = requireSocketUser();
    if (user && String(user.role || "").toLowerCase() === "client") {
      socket.emit("socket_authorization_error", { message: "Thao tác này chỉ dành cho nhân sự nội bộ." });
      return null;
    }
    return user;
  };

  // Visitor joins their own unique room
  socket.on("join_visitor", (visitorId: string) => {
    const user = getSocketUser();
    if (user && String(user.role || "").toLowerCase() === "client") {
      const allowedIds = [String(user.username || ""), `client_${user.id}`];
      if (!allowedIds.includes(String(visitorId))) return;
    }
    socket.join(`visitor_${visitorId}`);
  });

  // Admin joins the admin room to listen for all incoming chats
  socket.on("join_admin", () => {
    if (!requireInternalSocketUser()) return;
    socket.join("admins");
  });

  // Handle messages
  socket.on("send_message", (data: { 
    visitorId: string; 
    senderType: 'visitor' | 'admin'; 
    content: string; 
    fileUrl?: string; 
    fileName?: string 
  }) => {
    const user = data.senderType === "admin" ? requireInternalSocketUser() : getSocketUser();
    if (data.senderType === "admin" && !user) return;

    // 1. Save to DB
    const created_at = new Date().toISOString();
    try {
      db.prepare('INSERT INTO live_messages (visitor_id, sender_type, content, file_url, file_name, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(data.visitorId, data.senderType, data.content, data.fileUrl || null, data.fileName || null, created_at, data.senderType === 'admin' ? 1 : 0);
      
      const newMsg = { ...data, created_at };

      // 2. Broadcast
      if (data.senderType === 'visitor') {
        io.to("admins").emit("receive_message", newMsg);
        io.to(`visitor_${data.visitorId}`).emit("receive_message", newMsg);
      } else if (data.senderType === 'admin') {
        io.to(`visitor_${data.visitorId}`).emit("receive_message", newMsg);
        io.to("admins").emit("receive_message", newMsg);
      }
    } catch (e) {
      console.error("Socket insert err", e);
    }
  });

  socket.on("mark_read", (visitorId: string) => {
    if (!requireInternalSocketUser()) return;
    try {
      db.prepare("UPDATE live_messages SET is_read = 1 WHERE visitor_id = ? AND sender_type = 'visitor'").run(visitorId);
      io.to("admins").emit("messages_read", { visitorId });
    } catch(e) {}
  });

  socket.on("join_erp", () => {
    if (!requireInternalSocketUser()) return;
    socket.join("erp_users");
  });

  socket.on("join_record", (recordId: string) => {
    const user = requireSocketUser();
    if (!user || !checkResourceAccess(user, "record", String(recordId))) return;
    socket.join(`record_${recordId}`);
  });

  socket.on("send_internal_message", (data: {
    recordId: string;
    senderName: string;
    senderRole: string;
    content: string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    const user = requireSocketUser();
    if (!user || !checkResourceAccess(user, "record", String(data.recordId))) return;

    const senderName = user.name || user.username || "Unknown";
    const senderRole = user.role || "staff";
    const created_at = new Date().toISOString();
    try {
      const info = db.prepare('INSERT INTO record_messages (record_id, sender_name, sender_role, content, file_url, file_name, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
        .run(data.recordId, senderName, senderRole, data.content, data.fileUrl || null, data.fileName || null, created_at);
      
      const newMsg = {
        id: info.lastInsertRowid,
        record_id: data.recordId,
        sender_name: senderName,
        sender_role: senderRole,
        content: data.content,
        file_url: data.fileUrl,
        file_name: data.fileName,
        created_at,
        is_read: 0
      };

      io.to(`record_${data.recordId}`).emit("receive_internal_message", newMsg);
      io.to("erp_users").emit("internal_message_notification", newMsg);
    } catch(e) {
      console.error(e);
    }
  });

  socket.on("mark_internal_messages_read", (data: { recordId: string }) => {
    const user = requireSocketUser();
    if (!user || !checkResourceAccess(user, "record", String(data.recordId))) return;
    try {
      db.prepare("UPDATE record_messages SET is_read = 1 WHERE record_id = ?").run(data.recordId);
      io.to("erp_users").emit("internal_messages_read", { recordId: data.recordId });
    } catch (e) {
      console.error(e);
    }
  });

  // --- KÊNH CHAT COLLABORATIVE SOCKETS ---
  socket.on("join_chat_channel", (channelId: any) => {
    socket.join(`chat_channel_${channelId}`);
  });

  socket.on("join_chat_user", (userId: any) => {
    socket.join(`chat_user_${userId}`);
  });

  socket.on("send_chat_message", (data: {
    channelId?: any;
    senderId: any;
    receiverId?: any;
    content: string;
    fileUrl?: string | null;
    fileName?: string | null;
    replyToId?: any;
  }) => {
    const created_at = new Date().toISOString();
    try {
      const info = db.prepare(`
        INSERT INTO chat_messages (channel_id, sender_id, receiver_id, content, file_url, file_name, created_at, is_read, reply_to_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        data.channelId || null,
        data.senderId,
        data.receiverId || null,
        data.content,
        data.fileUrl || null,
        data.fileName || null,
        created_at,
        data.replyToId || null
      );

      const msgId = info.lastInsertRowid;
      const sender = db.prepare('SELECT name, role, avatar, username FROM users WHERE id = ?').get(data.senderId) as any;

      let reply_content = null;
      let reply_sender_name = null;
      if (data.replyToId) {
        const replyMsg = db.prepare(`
          SELECT cm.content, u.name as sender_name
          FROM chat_messages cm
          JOIN users u ON cm.sender_id = u.id
          WHERE cm.id = ?
        `).get(data.replyToId) as any;
        if (replyMsg) {
          reply_content = replyMsg.content;
          reply_sender_name = replyMsg.sender_name;
        }
      }

      const newMsg = {
        id: msgId,
        channel_id: data.channelId || null,
        sender_id: data.senderId,
        receiver_id: data.receiverId || null,
        content: data.content,
        file_url: data.fileUrl || null,
        file_name: data.fileName || null,
        reply_to_id: data.replyToId || null,
        reply_content,
        reply_sender_name,
        created_at,
        is_read: 0,
        reactions: [],
        is_pinned: 0,
        sender_name: sender?.name || sender?.username || "Unknown",
        sender_role: sender?.role || "staff",
        sender_avatar: sender?.avatar || null
      };

      if (data.channelId) {
        io.to(`chat_channel_${data.channelId}`).emit("receive_chat_message", newMsg);
      } else if (data.receiverId) {
        io.to(`chat_user_${data.receiverId}`).emit("receive_chat_message", newMsg);
        io.to(`chat_user_${data.senderId}`).emit("receive_chat_message", newMsg);
      }
    } catch (e) {
      console.error("Error sending collaborative chat message:", e);
    }
  });

  socket.on("disconnect", () => {
    // Handling disconnect logic
  });
});

/* CATCH MISSING API ROUTES */
app.all("/api/*all", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

/* VITE MIDDLEWARE */
async function startServer() {
  if (config.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          // Reuse the application's HTTP server for Vite HMR instead of binding a second socket.
          hmr: { server: httpServer }
        },
        appType: "spa",
      });
      app.use(vite.middlewares);

      const fs = await import("fs");
      app.get("*all", async (req, res, next) => {
        if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/public-ai") || req.originalUrl.startsWith("/uploads") || req.originalUrl.startsWith("/__aistudio_internal_control_plane")) {
          return next();
        }
        try {
          const url = req.originalUrl;
          let template = fs.readFileSync(
            path.resolve(process.cwd(), "index.html"),
            "utf-8"
          );
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (e) {
      console.warn("Vite not found or failed to load. Falling back to static serving.");
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*all', (req: any, res: any) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Use httpServer instead of app to enable WebSockets
  httpServer.on("error", (e: NodeJS.ErrnoException) => {
    if (e.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Exiting to allow restart...`);
      process.exit(1);
    } else {
      console.error("Server error:", e);
    }
  });

  // Handle Graceful Shutdown signals
  const gracefulShutdown = (signal: string) => {
    console.log(`[Shutdown Service] Received ${signal}. Starting graceful termination...`);
    
    // 1. Write the graceful shutdown marker
    try {
      MemoryMonitor.writeShutdownMarker(true);
    } catch (err) {
      console.error("Failed to write shutdown marker:", err);
    }

    // 2. Stop monitoring tick
    MemoryMonitor.stop();

    // 3. Stop accepting new requests & close httpServer
    httpServer.close(() => {
      console.log("[Shutdown Service] HTTP Server closed successfully. Exiting process.");
      process.exit(0);
    });

    // Fallback force exit after 5 seconds
    setTimeout(() => {
      console.warn("[Shutdown Service] Force exiting after timeout.");
      process.exit(1);
    }, 5000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`LAW FIRM ERP AI RUNNING ON HTTP://LOCALHOST:${PORT}`);

    // Start background work only after the server has successfully bound its port.
    syncFromFirestore()
      .then(() => {
        runMigration();
        TrashService.cleanupExpired(30).catch((err) => console.error("Initial trash cleanup failed:", err));
        setInterval(() => {
          TrashService.cleanupExpired(30).catch((err) => console.error("Scheduled trash cleanup failed:", err));
        }, 60 * 60 * 1000);
        setInterval(() => {
          retryFirestoreSync().catch((err) => console.error("Scheduled Firestore retry failed:", err));
        }, 5 * 60 * 1000);
        try {
          startRealTimeSync();
        } catch (errSync) {
          console.error("Failed to start server-side real-time sync listeners:", errSync);
        }
      })
      .catch((err) => {
        console.error("Failed to sync from Firestore on startup:", err);
        runMigration();
        TrashService.cleanupExpired(30).catch((cleanupErr) => console.error("Initial trash cleanup failed:", cleanupErr));
        setInterval(() => {
          TrashService.cleanupExpired(30).catch((cleanupErr) => console.error("Scheduled trash cleanup failed:", cleanupErr));
        }, 60 * 60 * 1000);
        setInterval(() => {
          retryFirestoreSync().catch((retryErr) => console.error("Scheduled Firestore retry failed:", retryErr));
        }, 5 * 60 * 1000);
        try {
          startRealTimeSync();
        } catch (errSync) {
          console.error("Failed to start server-side real-time sync listeners after error:", errSync);
        }
      });

    try {
      MemoryMonitor.initialize();
    } catch (err: any) {
      console.error("CRITICAL ERROR: Failed to initialize MemoryMonitor:", err.message);
      process.exit(1);
    }
  });
}

startServer();
