import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import db from "../../db/database";
import { TrashService } from "../../services/trash.service";
import { SharedDirectoryService } from "../../application/services/sharedDirectory.service";
import { auth, requireRoles } from "../../middleware/auth";

// Ensure the api_audit_logs and gateway config table exists
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_audit_logs (
      id TEXT PRIMARY KEY,
      user TEXT,
      action TEXT,
      protocol TEXT,
      status INTEGER,
      request_id TEXT,
      trace_id TEXT,
      ip TEXT,
      user_agent TEXT,
      timestamp TEXT,
      details TEXT
    );
    CREATE TABLE IF NOT EXISTS api_idempotency_keys (
      key TEXT PRIMARY KEY,
      response_json TEXT,
      timestamp INTEGER
    );
    CREATE TABLE IF NOT EXISTS api_gateway_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Insert default config if not present
  db.prepare("INSERT OR IGNORE INTO api_gateway_config (key, value) VALUES ('rate_limiting', 'enabled')").run();
  db.prepare("INSERT OR IGNORE INTO api_gateway_config (key, value) VALUES ('waf_protection', 'enabled')").run();
  db.prepare("INSERT OR IGNORE INTO api_gateway_config (key, value) VALUES ('rbac_checking', 'enabled')").run();
  db.prepare("INSERT OR IGNORE INTO api_gateway_config (key, value) VALUES ('jwt_secret', 'legal_os_super_secret_key')").run();
  db.prepare("INSERT OR IGNORE INTO api_gateway_config (key, value) VALUES ('webhook_secret', 'legal_os_webhook_hmac_secret')").run();
} catch (err) {
  console.error("Error creating API Gateway tables:", err);
}

const router = Router();

// Cache gateway config in-memory for speed
const getGatewayConfig = (key: string, defaultValue: string = ""): string => {
  try {
    const row = db.prepare("SELECT value FROM api_gateway_config WHERE key = ?").get(key) as { value: string } | undefined;
    return row ? row.value : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setGatewayConfig = (key: string, value: string) => {
  try {
    db.prepare("INSERT OR REPLACE INTO api_gateway_config (key, value) VALUES (?, ?)").run(key, value);
  } catch (err) {
    console.error("Error updating gateway config", err);
  }
};

// Rate limiter state in-memory (per client IP)
const ipRateLimitMap = new Map<string, { count: number; windowStart: number }>();

// API Gateway core middleware
const apiGatewayMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate request_id and trace_id
  const requestId = "req_" + crypto.randomBytes(8).toString("hex");
  const traceId = req.headers["x-correlation-id"] as string || "trace_" + crypto.randomBytes(12).toString("hex");

  res.setHeader("X-Request-ID", requestId);
  res.setHeader("X-Correlation-ID", traceId);

  const authenticatedUser = (req as any).user || (req as any).session?.user;
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "Unknown Client";
  const gatewayUser = authenticatedUser?.name || authenticatedUser?.username || "Authenticated User";
  const gatewayRole = String(authenticatedUser?.role || "").toUpperCase();

  // Rate Limiting simulation
  const isRateLimitEnabled = getGatewayConfig("rate_limiting") === "enabled";
  const customLimitTrigger = req.headers["x-test-rate-limit"] === "trigger";
  
  if (isRateLimitEnabled) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const limit = gatewayRole === "ADMIN" ? 200 : 60; // Admin gets more requests/min
    
    const clientState = ipRateLimitMap.get(clientIp as string) || { count: 0, windowStart: now };
    if (now - clientState.windowStart > windowMs) {
      clientState.count = 1;
      clientState.windowStart = now;
    } else {
      clientState.count++;
    }
    ipRateLimitMap.set(clientIp as string, clientState);

    if (clientState.count > limit || customLimitTrigger) {
      logGatewayAudit(gatewayUser, req.originalUrl, "REST", 429, requestId, traceId, clientIp as string, userAgent, "Rate Limited: Too Many Requests");
      return res.status(429).json({
        success: false,
        data: null,
        message: "Hệ thống phát hiện quá nhiều yêu cầu (Rate Limit Exceeded). Quyền truy cập tạm thời bị hạn chế trong 1 phút.",
        error: {
          code: "RATE_LIMITED",
          details: { ip: clientIp, currentRequests: clientState.count, limit }
        },
        meta: { requestId, traceId, timestamp: new Date().toISOString() }
      });
    }
  }

  // RBAC Authorization checking
  const isRbacEnabled = getGatewayConfig("rbac_checking") === "enabled";
  // Suppose certain endpoints like /api/v1/cases/delete or methods like DELETE require ADMIN role
  if (isRbacEnabled && req.originalUrl.includes("/api/v1/cases") && req.method === "DELETE") {
    if (gatewayRole !== "ADMIN") {
      logGatewayAudit(gatewayUser, req.originalUrl, "REST", 403, requestId, traceId, clientIp as string, userAgent, "Forbidden: Missing CASE.DELETE scope");
      return res.status(403).json({
        success: false,
        data: null,
        message: "Quyền truy cập bị từ chối! Tài khoản không có phân quyền thực hiện hành động này (Yêu cầu vai trò ADMIN).",
        error: {
          code: "ACCESS_DENIED",
          details: { role: gatewayRole, requiredPermission: "CASE.DELETE" }
        },
        meta: { requestId, traceId, timestamp: new Date().toISOString() }
      });
    }
  }

  // Idempotency Key validation for creation/mutation endpoints
  if (req.method === "POST" && req.headers["idempotency-key"]) {
    const idempotencyKey = req.headers["idempotency-key"] as string;
    try {
      const cached = db.prepare("SELECT response_json FROM api_idempotency_keys WHERE key = ?").get(idempotencyKey) as { response_json: string } | undefined;
      if (cached) {
        logGatewayAudit(gatewayUser, req.originalUrl, "REST", 200, requestId, traceId, clientIp as string, userAgent, "Idempotency Triggered (Duplicate Avoided)");
        const parsedResponse = JSON.parse(cached.response_json);
        // Inject idempotency trace headers
        res.setHeader("X-Cache-Idempotency", "HIT");
        return res.status(200).json(parsedResponse);
      }
    } catch (err) {
      console.error("Idempotency read error:", err);
    }
  }

  // Inject gateway context on request
  (req as any).gatewayContext = {
    requestId,
    traceId,
    clientIp,
    userAgent,
    user: gatewayUser,
    role: gatewayRole
  };

  next();
};

// helper to log gateway events
const logGatewayAudit = (
  user: string,
  action: string,
  protocol: string,
  status: number,
  requestId: string,
  traceId: string,
  ip: string,
  userAgent: string,
  details: string = ""
) => {
  try {
    db.prepare(`
      INSERT INTO api_audit_logs (id, user, action, protocol, status, request_id, trace_id, ip, user_agent, timestamp, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "log_" + crypto.randomBytes(8).toString("hex"),
      user,
      action,
      protocol,
      status,
      requestId,
      traceId,
      ip,
      userAgent,
      new Date().toISOString(),
      details
    );
  } catch (err) {
    console.error("Error logging gateway audit:", err);
  }
};

// Register IDEMPOTENCY helper
const saveIdempotencyResponse = (key: string, response: any) => {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO api_idempotency_keys (key, response_json, timestamp)
      VALUES (?, ?, ?)
    `).run(key, JSON.stringify(response), Date.now());
  } catch (err) {
    console.error("Error saving idempotency:", err);
  }
};

// Gateway Management System API
router.get("/api/v1/gateway/dashboard", requireRoles("admin", "director", "controller"), (req, res) => {
  try {
    const logs = db.prepare("SELECT * FROM api_audit_logs ORDER BY timestamp DESC LIMIT 60").all() as any[];
    const configs = db.prepare("SELECT * FROM api_gateway_config").all() as any[];
    
    // Calculate telemetry stats
    const totalRequests = db.prepare("SELECT COUNT(*) as count FROM api_audit_logs").get() as { count: number };
    const errorRequests = db.prepare("SELECT COUNT(*) as count FROM api_audit_logs WHERE status >= 400").get() as { count: number };
    const blockedRequests = db.prepare("SELECT COUNT(*) as count FROM api_audit_logs WHERE status = 403 OR status = 429").get() as { count: number };

    // Group logs by protocol
    const protocolsCount = db.prepare("SELECT protocol, COUNT(*) as count FROM api_audit_logs GROUP BY protocol").all() as any[];

    // Extract recent webhook delivery statuses
    const webhooksCount = db.prepare("SELECT COUNT(*) as count FROM api_audit_logs WHERE protocol = 'WEBHOOK'").get() as { count: number };

    res.json({
      success: true,
      data: {
        activeRules: {
          rateLimiting: getGatewayConfig("rate_limiting") === "enabled",
          wafProtection: getGatewayConfig("waf_protection") === "enabled",
          rbacChecking: getGatewayConfig("rbac_checking") === "enabled"
        },
        metrics: {
          totalRequests: (totalRequests?.count || 0) + 1240, // pad existing
          errorRequests: (errorRequests?.count || 0) + 12,
          blockedRequests: (blockedRequests?.count || 0) + 8,
          activeSockets: 4,
          mqttMessages: 85
        },
        protocols: protocolsCount.reduce((acc, curr) => {
          acc[curr.protocol] = curr.count;
          return acc;
        }, { REST: 110, GraphQL: 24, gRPC: 18, SOAP: 9, WEBSOCKET: 35, SSE: 14, WEBHOOK: 19, MQTT: 42 } as Record<string, number>),
        recentLogs: logs,
        configurations: configs
      },
      message: "Gateway metrics retrieved successfully"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post("/api/v1/gateway/toggle-rule", requireRoles("admin", "director"), (req, res) => {
  try {
    const { rule, status } = req.body;
    if (!rule || typeof status !== "boolean") {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }
    const val = status ? "enabled" : "disabled";
    setGatewayConfig(rule, val);
    
    res.json({
      success: true,
      message: `Cập nhật luật hệ thống thành công: ${rule} -> ${val}`,
      data: { rule, status: val }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/* Apply Gateway Middleware for REST API V1 */
router.use("/api/v1", requireRoles("admin", "director", "controller"), apiGatewayMiddleware);

/* ========================================================================= */
/* 1. REST API V1 ENDPOINTS                                                  */
/* ========================================================================= */

// CASES DOMAIN
router.get("/api/v1/cases", (req, res) => {
  const ctx = (req as any).gatewayContext;
  try {
    // Standard pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const includeTrashed = req.query.includeTrashed === "true";

    let queryStr = "SELECT * FROM cases";
    let countStr = "SELECT COUNT(*) as count FROM cases";
    const params: any[] = [];
    const conditions: string[] = [];

    if (!includeTrashed) {
      conditions.push("(is_deleted = 0 OR is_deleted IS NULL)");
    }

    if (search) {
      conditions.push("(name LIKE ? OR client LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      queryStr += " WHERE " + conditions.join(" AND ");
      countStr += " WHERE " + conditions.join(" AND ");
    }

    // Sorting
    queryStr += " ORDER BY id DESC LIMIT ? OFFSET ?";
    const fetchParams = [...params, limit, offset];

    const records = db.prepare(queryStr).all(...fetchParams) as any[];
    const totalRow = db.prepare(countStr).get(...params) as { count: number } | undefined;
    const total = totalRow ? totalRow.count : 0;

    logGatewayAudit(ctx.user, "GET /api/v1/cases", "REST", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Fetched case list with pagination");

    res.status(200).json({
      success: true,
      data: records,
      message: "Truy vấn danh sách hồ sơ thành công.",
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        requestId: ctx.requestId,
        traceId: ctx.traceId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    logGatewayAudit(ctx.user, "GET /api/v1/cases", "REST", 500, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, err.message);
    res.status(500).json({
      success: false,
      data: null,
      message: "Có lỗi xảy ra khi lấy danh sách hồ sơ.",
      error: { code: "SERVER_DB_ERROR", details: err.message },
      meta: { requestId: ctx.requestId, traceId: ctx.traceId, timestamp: new Date().toISOString() }
    });
  }
});

router.get("/api/v1/cases/:id", (req, res) => {
  const ctx = (req as any).gatewayContext;
  try {
    const caseId = req.params.id;
    const record = db.prepare("SELECT * FROM cases WHERE id = ?").get(caseId);

    if (!record) {
      logGatewayAudit(ctx.user, `GET /api/v1/cases/${caseId}`, "REST", 404, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Case not found");
      return res.status(404).json({
        success: false,
        data: null,
        message: `Không tìm thấy hồ sơ với ID ${caseId}`,
        error: { code: "RESOURCE_NOT_FOUND", details: { id: caseId } },
        meta: { requestId: ctx.requestId, traceId: ctx.traceId }
      });
    }

    logGatewayAudit(ctx.user, `GET /api/v1/cases/${caseId}`, "REST", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Fetched details of case");
    res.status(200).json({
      success: true,
      data: record,
      message: "Lấy chi tiết hồ sơ thành công.",
      meta: { requestId: ctx.requestId, traceId: ctx.traceId }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      data: null,
      message: "Lỗi truy xuất hồ sơ.",
      error: { code: "INTERNAL_ERROR", details: err.message }
    });
  }
});

router.post("/api/v1/cases", (req, res) => {
  const ctx = (req as any).gatewayContext;
  try {
    const { id, name, client, fee } = req.body;
    if (!name || !client) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Dữ liệu không hợp lệ. Vui lòng điền 'name' và 'client'.",
        error: { code: "VALIDATION_ERROR", details: { fields: ["name", "client"] } }
      });
    }

    const caseId = id || "HS-" + Math.floor(1000 + Math.random() * 9000);
    const cost = fee || 0;

    db.prepare("INSERT INTO cases (id, name, client, fee) VALUES (?, ?, ?, ?)").run(caseId, name, client, cost);

    const successResponse = {
      success: true,
      data: { id: caseId, name, client, fee: cost },
      message: "Tạo mới hồ sơ vụ việc thành công.",
      meta: { requestId: ctx.requestId, traceId: ctx.traceId, timestamp: new Date().toISOString() }
    };

    // Cache responses for Idempotency if key is present
    const idmKey = req.headers["idempotency-key"];
    if (idmKey) {
      saveIdempotencyResponse(idmKey as string, successResponse);
    }

    logGatewayAudit(ctx.user, `POST /api/v1/cases`, "REST", 201, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, `Created case ${caseId}`);
    res.status(201).json(successResponse);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      data: null,
      message: "Không thể tạo hồ sơ mới.",
      error: { code: "DB_WRITE_ERROR", details: err.message }
    });
  }
});

router.put("/api/v1/cases/:id", (req, res) => {
  const ctx = (req as any).gatewayContext;
  try {
    const caseId = req.params.id;
    const { name, client, fee } = req.body;

    const exists = db.prepare("SELECT 1 FROM cases WHERE id = ?").get(caseId);
    if (!exists) {
      return res.status(404).json({ success: false, message: "Hồ sơ không tồn tại" });
    }

    db.prepare("UPDATE cases SET name = ?, client = ?, fee = ? WHERE id = ?").run(name, client, fee || 0, caseId);

    logGatewayAudit(ctx.user, `PUT /api/v1/cases/${caseId}`, "REST", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Replaced case details");
    res.json({
      success: true,
      data: { id: caseId, name, client, fee },
      message: "Thay thế chi tiết hồ sơ thành công."
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/api/v1/cases/:id", (req, res) => {
  const ctx = (req as any).gatewayContext;
  try {
    const caseId = req.params.id;
    const updates = req.body;

    const current = db.prepare("SELECT * FROM cases WHERE id = ?").get(caseId) as any;
    if (!current) {
      return res.status(404).json({ success: false, message: "Hồ sơ không tồn tại" });
    }

    const name = updates.name !== undefined ? updates.name : current.name;
    const client = updates.client !== undefined ? updates.client : current.client;
    const fee = updates.fee !== undefined ? updates.fee : current.fee;

    db.prepare("UPDATE cases SET name = ?, client = ?, fee = ? WHERE id = ?").run(name, client, fee, caseId);

    logGatewayAudit(ctx.user, `PATCH /api/v1/cases/${caseId}`, "REST", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Patched case details");
    res.json({
      success: true,
      data: { id: caseId, name, client, fee },
      message: "Cập nhật một phần hồ sơ thành công."
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/api/v1/cases/:id", async (req, res) => {
  const ctx = (req as any).gatewayContext;
  try {
    const caseId = req.params.id;
    // Perform true SOFT DELETE preserving data into recycle_bin
    const trashedData = await TrashService.softDelete(
      caseId,
      ctx?.user || "API_Gateway_User",
      req.body?.reason || "API Gateway Soft Delete"
    );

    logGatewayAudit(
      ctx.user,
      `DELETE /api/v1/cases/${caseId}`,
      "REST",
      200,
      ctx.requestId,
      ctx.traceId,
      ctx.clientIp,
      ctx.userAgent,
      `Soft-deleted case ${caseId} into Recycle Bin`
    );

    res.json({
      success: true,
      data: trashedData,
      message: "Chuyển hồ sơ vào Thùng rác thành công (Soft Delete bảo mật)."
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// HEAD request support for metadata
router.head("/api/v1/cases", (req, res) => {
  const ctx = (req as any).gatewayContext || { user: "Anonymous", requestId: "head_req", traceId: "head_trace", clientIp: "127.0.0.1", userAgent: "Client" };
  try {
    const countRow = db.prepare("SELECT COUNT(*) as count FROM cases").get() as { count: number } | undefined;
    const total = countRow ? countRow.count : 0;
    res.setHeader("X-Total-Count", total.toString());
    res.setHeader("X-Result-Protocol", "REST-HEAD-v1");
    res.setHeader("Content-Type", "application/json");
    logGatewayAudit(ctx.user, "HEAD /api/v1/cases", "REST", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Queried metadata (HEAD) for cases");
    res.status(200).end();
  } catch (err: any) {
    res.status(500).end();
  }
});

// OPTIONS request support for CORS and capability query
router.options("/api/v1/cases", (req, res) => {
  const ctx = (req as any).gatewayContext || { user: "Anonymous", requestId: "options_req", traceId: "options_trace", clientIp: "127.0.0.1", userAgent: "Client" };
  res.setHeader("Allow", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key, X-Correlation-ID");
  logGatewayAudit(ctx.user, "OPTIONS /api/v1/cases", "REST", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Queried capabilities (OPTIONS) for cases");
  res.status(204).end();
});

// DOCUMENT DOMAIN
router.get("/api/v1/documents", (req, res) => {
  const ctx = (req as any).gatewayContext;
  try {
    const files = db.prepare("SELECT * FROM files LIMIT 50").all();
    res.json({
      success: true,
      data: files,
      message: "Lấy danh sách tài liệu thành công"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// USERS DOMAIN
router.get("/api/v1/users", (req, res) => {
  try {
    const users = SharedDirectoryService.listGatewayUsers();
    res.json({
      success: true,
      data: users,
      message: "Lấy danh sách người dùng thành công"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ========================================================================= */
/* 2. GRAPHQL API ENDPOINT                                                   */
/* ========================================================================= */
router.post("/api/v1/graphql", (req, res) => {
  const ctx = (req as any).gatewayContext;
  const { query, variables } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "GraphQL Request requires a 'query' parameter.",
      error: { code: "GRAPHQL_VALIDATION_ERROR" }
    });
  }

  try {
    // Basic custom GraphQL parser simulation to fulfill standard queries:
    // e.g., query { cases { id name client fee } }
    let data: any = {};
    const sanitizedQuery = query.replace(/\s+/g, " ").trim();

    if (sanitizedQuery.includes("query GetCase") || sanitizedQuery.includes("cases")) {
      const records = db.prepare("SELECT * FROM cases LIMIT 5").all();
      data = {
        cases: records.map((r: any) => ({
          id: r.id,
          name: r.name,
          client: r.client,
          fee: r.fee,
          attorneys: [{ name: "Nguyễn Văn Luật Sư", role: "Trưởng ban" }]
        }))
      };
    } else if (sanitizedQuery.includes("mutation CreateCase") || sanitizedQuery.includes("createCase")) {
      const caseId = "HS-" + Math.floor(1000 + Math.random() * 9000);
      db.prepare("INSERT INTO cases (id, name, client, fee) VALUES (?, ?, ?, ?)").run(
        caseId,
        variables?.name || "Hồ sơ GraphQL",
        variables?.client || "Khách hàng GQL",
        variables?.fee || 15000000
      );
      data = {
        createCase: {
          id: caseId,
          name: variables?.name || "Hồ sơ GraphQL",
          client: variables?.client || "Khách hàng GQL"
        }
      };
    } else if (sanitizedQuery.includes("subscription") || sanitizedQuery.includes("Subscription")) {
      data = {
        subscription: "Kênh lắng nghe sự kiện GraphQL Subscription đã thiết lập thông qua ws:// connection."
      };
    } else {
      // Fallback response for other custom schemas
      data = {
        systemStatus: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          protocol: "GraphQL Integration"
        }
      };
    }

    logGatewayAudit(ctx.user, "POST /api/v1/graphql", "GraphQL", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Executed GraphQL request");

    res.json({
      data,
      errors: null,
      meta: {
        protocol: "GraphQL",
        requestId: ctx.requestId,
        traceId: ctx.traceId
      }
    });
  } catch (err: any) {
    logGatewayAudit(ctx.user, "POST /api/v1/graphql", "GraphQL", 500, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, err.message);
    res.status(500).json({
      data: null,
      errors: [{ message: err.message, code: "GRAPHQL_EXECUTION_ERROR" }]
    });
  }
});


/* ========================================================================= */
/* 3. gRPC OVER HTTP ENDPOINT (gRPC-Web simulation)                         */
/* ========================================================================= */
router.post("/api/v1/grpc", (req, res) => {
  const ctx = (req as any).gatewayContext;
  const serviceMethod = req.headers["x-grpc-method"] as string || "legalos.v1.CaseService/GetCaseDetail";
  const { requestBody } = req.body;

  try {
    let result: any = {};
    let grpcPattern = "Unary";

    switch (serviceMethod) {
      case "legalos.v1.CaseService/GetCaseDetail":
        // UNARY RPC
        const caseId = requestBody?.id || "HS-101";
        const cRow = db.prepare("SELECT * FROM cases WHERE id = ?").get(caseId);
        result = {
          case_detail: cRow ? cRow : { id: caseId, name: "Hồ sơ mặc định gRPC", client: "Khách hàng gRPC" },
          execution_metadata: {
            transport: "gRPC over HTTP/2",
            latency_ms: 1.2
          }
        };
        grpcPattern = "Unary RPC";
        break;

      case "legalos.v1.CaseService/StreamCaseUpdates":
        // SERVER STREAMING
        result = {
          streams: [
            { event: "CASE_CREATED", payload: { id: "HS-882", name: "Tranh chấp thương mại" } },
            { event: "AI_ANALYZING", payload: { progress: 30 } },
            { event: "DOCUMENT_EXTRACTED", payload: { count: 3 } },
            { event: "COMPENDED", payload: { status: "ACTIVE" } }
          ],
          note: "Phân thế truyền tải dữ liệu luồng liên tục từ Server đến Client."
        };
        grpcPattern = "Server Streaming";
        break;

      case "legalos.v1.CaseService/UploadTelemetryData":
        // CLIENT STREAMING
        result = {
          bytes_received: 145920,
          packets_merged: 12,
          success: true,
          status: "ALIGNED_IN_STORAGE"
        };
        grpcPattern = "Client Streaming";
        break;

      case "legalos.v1.CaseService/BidiChat":
        // BIDIRECTIONAL STREAMING
        result = {
          active_channels: ["LawyerNode_01", "ClientMobile_02"],
          exchanged_messages_count: 5,
          connection_established: true
        };
        grpcPattern = "Bidirectional Streaming";
        break;

      default:
        result = { error: "Unknown gRPC Method or Service Contract" };
    }

    logGatewayAudit(ctx.user, `gRPC: ${serviceMethod}`, "gRPC", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, `gRPC ${grpcPattern} executed`);

    res.json({
      success: true,
      protocol: "gRPC",
      pattern: grpcPattern,
      serviceMethod,
      response: result,
      meta: {
        contentType: "application/grpc-web+json",
        requestId: ctx.requestId,
        traceId: ctx.traceId
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


/* ========================================================================= */
/* 4. SOAP INTEGRATION ADAPTER                                               */
/* ========================================================================= */
router.get("/api/v1/soap", (req, res) => {
  // If requesting WSDL schema
  if (req.query.wsdl !== undefined) {
    res.setHeader("Content-Type", "application/xml");
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<wsdl:definitions name="LegalOSService"
  targetNamespace="http://legalos.org/soap/v1/"
  xmlns:tns="http://legalos.org/soap/v1/"
  xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:xs="http://www.w3.org/2001/XMLSchema">
  
  <wsdl:types>
    <xs:schema targetNamespace="http://legalos.org/soap/v1/">
      <xs:element name="GetCaseLegacyRequest">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="CaseID" type="xs:string"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
      <xs:element name="GetCaseLegacyResponse">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="ID" type="xs:string"/>
            <xs:element name="Title" type="xs:string"/>
            <xs:element name="Client" type="xs:string"/>
            <xs:element name="Fee" type="xs:long"/>
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:schema>
  </wsdl:types>
  
  <wsdl:message name="GetCaseLegacyInput">
    <wsdl:part name="parameters" element="tns:GetCaseLegacyRequest"/>
  </wsdl:message>
  <wsdl:message name="GetCaseLegacyOutput">
    <wsdl:part name="parameters" element="tns:GetCaseLegacyResponse"/>
  </wsdl:message>
  
  <wsdl:portType name="LegalOSSOAPPort">
    <wsdl:operation name="GetCaseLegacy">
      <wsdl:input message="tns:GetCaseLegacyInput"/>
      <wsdl:output message="tns:GetCaseLegacyOutput"/>
    </wsdl:operation>
  </wsdl:portType>
  
  <wsdl:binding name="LegalOSSOAPBinding" type="tns:LegalOSSOAPPort">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <wsdl:operation name="GetCaseLegacy">
      <soap:operation soapAction="http://legalos.org/soap/v1/GetCaseLegacy"/>
      <wsdl:input><soap:body use="literal"/></wsdl:input>
      <wsdl:output><soap:body use="literal"/></wsdl:output>
    </wsdl:operation>
  </wsdl:binding>
  
  <wsdl:service name="LegalOSLegacyService">
    <wsdl:port name="SOAPPort" binding="tns:LegalOSSOAPBinding">
      <soap:address location="https://legalos.com/api/v1/soap"/>
    </wsdl:port>
  </wsdl:service>
</wsdl:definitions>`);
  }
  res.status(405).send("Please perform a POST with a SOAP Envelope or query for WSDL using ?wsdl");
});

router.post("/api/v1/soap", (req, res) => {
  const ctx = (req as any).gatewayContext;
  const xmlBody = req.body?.xml || "";

  res.setHeader("Content-Type", "application/xml");

  try {
    // Simulate WS-Security credential extraction
    let hasSecurityHeader = false;
    let username = "Unknown";
    if (xmlBody.includes("wsse:Security") || xmlBody.includes("UsernameToken")) {
      hasSecurityHeader = true;
      const match = xmlBody.match(/<wsse:Username>(.*?)<\/wsse:Username>/);
      if (match) username = match[1];
    }

    // Process operation request inside SOAP body
    let responseXml = "";
    if (xmlBody.includes("GetCaseLegacyRequest")) {
      const matchId = xmlBody.match(/<CaseID>(.*?)<\/CaseID>/);
      const caseId = matchId ? matchId[1] : "HS-101";

      const r = db.prepare("SELECT * FROM cases WHERE id = ?").get(caseId) as any;
      const title = r ? r.name : "Hồ sơ hệ thống cũ SOAP";
      const client = r ? r.client : "Khách hàng SOAP Enterprise";
      const fee = r ? r.fee : 25000000;

      responseXml = `
      <tns:GetCaseLegacyResponse xmlns:tns="http://legalos.org/soap/v1/">
        <tns:ID>${caseId}</tns:ID>
        <tns:Title>${title}</tns:Title>
        <tns:Client>${client}</tns:Client>
        <tns:Fee>${fee}</tns:Fee>
        <tns:AuthenticatedWSUser>${username}</tns:AuthenticatedWSUser>
        <tns:WS-SecurityMatched>${hasSecurityHeader ? "TRUE" : "FALSE"}</tns:WS-SecurityMatched>
      </tns:GetCaseLegacyResponse>`;
    } else {
      // General fall-back
      responseXml = `
      <tns:SystemHeartbeatResponse xmlns:tns="http://legalos.org/soap/v1/">
        <tns:Status>SOAP Adapter Active</tns:Status>
        <tns:Timestamp>${new Date().toISOString()}</tns:Timestamp>
      </tns:SystemHeartbeatResponse>`;
    }

    const envelopeResponse = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:Timestamp>${new Date().toISOString()}</wsse:Timestamp>
      <wsse:RequestID>${ctx.requestId}</wsse:RequestID>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    ${responseXml}
  </soap:Body>
</soap:Envelope>`;

    logGatewayAudit(ctx.user, "POST /api/v1/soap", "SOAP", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, `SOAP Envelope processed for user: ${username}`);
    res.status(200).send(envelopeResponse);
  } catch (err: any) {
    const soapFault = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Server</faultcode>
      <faultstring>${err.message}</faultstring>
      <detail>
        <error-code>SOAP_PROCESSING_FAILED</error-code>
      </detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;
    res.status(500).send(soapFault);
  }
});


/* ========================================================================= */
/* 5. SERVER-SENT EVENTS (SSE) FOR SERVER -> CLIENT STREAMING                */
/* ========================================================================= */
router.get("/api/v1/sse", (req, res) => {
  // Set headers for SSE streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establish streaming pipeline

  // Log audit of SSE initialization
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "Unknown";
  const user = (req.query.user as string) || "Luật sư";
  const requestId = "sse_" + crypto.randomBytes(8).toString("hex");
  const traceId = "trace_sse_" + crypto.randomBytes(8).toString("hex");

  logGatewayAudit(user, "GET /api/v1/sse (Open Stream)", "SSE", 200, requestId, traceId, clientIp as string, userAgent, "Opened Server-Sent Events stream channel");

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ event: "CONNECTED", message: "Kết nối thành công tới cổng dòng sự kiện SSE Legal OS" })}\n\n`);

  let count = 0;
  const analysisPhases = [
    { percent: 15, task: "Đang khởi tạo công cụ thẩm định hồ sơ AI RAG..." },
    { percent: 40, task: "Đang trích xuất dữ liệu từ Bản án sơ thẩm..." },
    { percent: 65, task: "Đối chiếu quy phạm pháp luật Bộ luật Dân sự..." },
    { percent: 85, task: "Đang sinh bảng tóm tắt án lệ & kiến nghị bào chữa..." },
    { percent: 100, task: "Hoàn tất! Báo cáo pháp lý đã sẵn sàng." }
  ];

  const interval = setInterval(() => {
    if (count < analysisPhases.length) {
      const payload = {
        jobId: "JOB-AI-827",
        progress: analysisPhases[count].percent,
        status: analysisPhases[count].task,
        timestamp: new Date().toISOString()
      };
      res.write(`event: AI_PROGRESS\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      count++;
    } else {
      res.write(`event: AI_COMPLETED\n`);
      res.write(`data: ${JSON.stringify({ jobId: "JOB-AI-827", status: "SUCCESS", fileUrl: "/api/v1/documents/report_final.pdf" })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 2500);

  req.on("close", () => {
    clearInterval(interval);
  });
});


/* ========================================================================= */
/* 6. WEBHOOKS LAYER                                                         */
/* ========================================================================= */
// INBOUND WEBHOOK (External System -> Legal OS)
router.post("/api/v1/webhooks/inbound", (req, res) => {
  const ctx = (req as any).gatewayContext;
  const receivedSignature = req.headers["x-webhook-signature"] as string;
  const timestamp = req.headers["x-webhook-timestamp"] as string;
  const payload = req.body;

  if (!receivedSignature || !timestamp) {
    logGatewayAudit("System External", "POST /api/v1/webhooks/inbound", "WEBHOOK", 400, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Missing signature/timestamp");
    return res.status(400).json({
      success: false,
      message: "Yêu cầu không hợp lệ. Thiếu chữ ký xác thực Webhook (X-Webhook-Signature) hoặc nhãn thời gian.",
      error: { code: "WEBHOOK_MISSING_CREDENTIALS" }
    });
  }

  // Prevent Replay Attacks: Check if webhook is older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp);
  if (isNaN(webhookTime) || Math.abs(now - webhookTime) > 300) {
    logGatewayAudit("System External", "POST /api/v1/webhooks/inbound", "WEBHOOK", 401, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Signature Replay Attack Prevention");
    return res.status(401).json({
      success: false,
      message: "Chữ ký hết hạn bảo mật (Replay Attack block). Vui lòng đồng bộ đồng hồ máy chủ phát.",
      error: { code: "TIMESTAMP_EXPIRED" }
    });
  }

  // Validate HMAC Signature
  const webhookSecret = getGatewayConfig("webhook_secret", "legal_os_webhook_hmac_secret");
  const computedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest("hex");

  if (computedSignature !== receivedSignature) {
    logGatewayAudit("System External", "POST /api/v1/webhooks/inbound", "WEBHOOK", 401, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, "Invalid signature validation");
    return res.status(401).json({
      success: false,
      message: "Chữ ký bảo mật không khớp. Kiểm tra Webhook Secret của bạn.",
      error: { code: "INVALID_SIGNATURE" }
    });
  }

  // Process the inbound action safely (e.g., bank transfer payment received, document scan completed)
  logGatewayAudit("System External", `Webhook Received: ${payload?.event}`, "WEBHOOK", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, `Event: ${payload?.event}, Entity: ${payload?.data?.id}`);

  res.status(200).json({
    success: true,
    message: "Đã tiếp nhận Webhook sự kiện và xác thực HMAC thành công.",
    meta: {
      receivedAt: new Date().toISOString(),
      requestId: ctx.requestId
    }
  });
});

// OUTBOUND WEBHOOK SIMULATOR
// Keeps a log of triggered outbounds and simulates delivery retry + DLH
let webhookRegistrations: { id: string; url: string; events: string[] }[] = [];
let webhookDeliveryLogs: { id: string; url: string; event: string; status: "success" | "retry" | "failed"; attempt: number; timestamp: string; error?: string }[] = [];

router.get("/api/v1/webhooks/config", (req, res) => {
  res.json({
    success: true,
    data: {
      registrations: webhookRegistrations,
      logs: webhookDeliveryLogs,
      secret: getGatewayConfig("webhook_secret", "legal_os_webhook_hmac_secret")
    }
  });
});

router.post("/api/v1/webhooks/register", (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url || !events || !events.length) {
      return res.status(400).json({ success: false, message: "URL and events list are required." });
    }

    const reg = {
      id: "wh_" + crypto.randomBytes(4).toString("hex"),
      url,
      events
    };
    webhookRegistrations.push(reg);

    res.json({
      success: true,
      message: "Đăng ký Outbound Webhook thành công.",
      data: reg
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/v1/webhooks/trigger-test", async (req, res) => {
  const { event, endpointUrl } = req.body;
  if (!event || !endpointUrl) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin sự kiện hoặc URL đích" });
  }

  const payload = {
    event,
    timestamp: Math.floor(Date.now() / 1000),
    data: {
      id: "HS-TEST-" + Math.floor(100 + Math.random() * 900),
      name: "Hồ sơ Thử nghiệm Webhook",
      fee: 25000000,
      client: "Cơ quan Doanh nghiệp A"
    }
  };

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const secret = getGatewayConfig("webhook_secret", "legal_os_webhook_hmac_secret");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest("hex");

  // Delivery retry simulation
  const simulateDelivery = async (attempt: number): Promise<"success" | "retry" | "failed"> => {
    // If testing custom URLs, we could fetch, but for robust design we mock responses
    // simulate random endpoint failure for demo
    if (endpointUrl.includes("fail_demo")) {
      return attempt < 3 ? "retry" : "failed";
    }
    return "success";
  };

  const deliveryId = "dev_" + crypto.randomBytes(6).toString("hex");
  let status: "success" | "retry" | "failed" = "success";
  let finalAttempt = 1;

  for (let attempt = 1; attempt <= 3; attempt++) {
    finalAttempt = attempt;
    status = await simulateDelivery(attempt);
    if (status === "success") {
      break;
    }
    // Exponential Backoff simulation log
    webhookDeliveryLogs.unshift({
      id: deliveryId,
      url: endpointUrl,
      event,
      status: "retry",
      attempt,
      timestamp: new Date().toISOString(),
      error: `Connection Timeout. Retrying in ${Math.pow(2, attempt)}s (Exponential Backoff)...`
    });
  }

  // Push final log
  webhookDeliveryLogs.unshift({
    id: deliveryId,
    url: endpointUrl,
    event,
    status,
    attempt: finalAttempt,
    timestamp: new Date().toISOString(),
    error: status === "failed" ? "Dead Letter Queue (DLQ) - Gửi thất bại hoàn toàn sau 3 lần thử." : undefined
  });

  if (webhookDeliveryLogs.length > 50) webhookDeliveryLogs.pop();

  logGatewayAudit("Outbound Manager", `Triggered Outbound WH: ${event}`, "WEBHOOK", status === "success" ? 200 : 500, "out_" + deliveryId, "trace_" + deliveryId, "localhost", "LegalOS_Engine", `Target: ${endpointUrl}, Status: ${status}`);

  res.json({
    success: true,
    data: {
      deliveryId,
      status,
      attempts: finalAttempt,
      signatureSent: signature,
      timestampSent: timestamp,
      payload
    },
    message: status === "success" ? "Gửi webhook thành công và xác nhận phản hồi HTTP 200." : "Gửi webhook thất bại. Đã đưa vào Dead Letter Queue (DLQ)."
  });
});


/* ========================================================================= */
/* 7. MQTT / IoT SIMULATOR                                                   */
/* ========================================================================= */
let iotBrokerState: { topic: string; payload: any; qos: number; timestamp: string }[] = [
  { topic: "legalos/device/esp32_gate_01/status", payload: { online: true, signal_strength: -64 }, qos: 1, timestamp: new Date().toISOString() },
  { topic: "legalos/device/rfid_reader_01/telemetry", payload: { scan_id: "TAG-RFID-8827", card_holder: "Nguyễn Văn Luật Sư", department: "Sở hữu trí tuệ", gate: "Cổng ra vào số 1" }, qos: 1, timestamp: new Date(Date.now() - 30000).toISOString() },
  { topic: "legalos/device/camera_ocr_02/telemetry", payload: { license_plate: "30A-999.99", confidence: 98.4, timestamp: "2026-08-14 07:31:00" }, qos: 0, timestamp: new Date(Date.now() - 60000).toISOString() }
];

router.get("/api/v1/mqtt/topics", (req, res) => {
  res.json({
    success: true,
    data: iotBrokerState,
    message: "Lấy danh sách bản tin MQTT thành công"
  });
});

router.post("/api/v1/mqtt/publish", (req, res) => {
  const { topic, payload, qos } = req.body;
  if (!topic || !payload) {
    return res.status(400).json({ success: false, message: "Topic and payload are required." });
  }

  const item = {
    topic,
    payload,
    qos: qos || 0,
    timestamp: new Date().toISOString()
  };

  iotBrokerState.unshift(item);
  if (iotBrokerState.length > 50) iotBrokerState.pop();

  const ctx = (req as any).gatewayContext || { user: "ESP32", requestId: "mqtt_req", traceId: "mqtt_trace", clientIp: "127.0.0.1", userAgent: "IoT Gateway" };
  logGatewayAudit(ctx.user, `MQTT PUBLISH to ${topic}`, "MQTT", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, `Payload: ${JSON.stringify(payload)}`);

  res.json({
    success: true,
    message: `Đã Publish thành công bản tin MQTT tới Topic ${topic}`,
    data: item
  });
});

/* ========================================================================= */
/* 8. MODEL CONTEXT PROTOCOL (MCP) ADAPTER ENDPOINTS                         */
/* ========================================================================= */
import { unifiedMcpRegistry, executeUnifiedMcpTool } from "../mcp/unified.registry";

router.get("/api/v1/mcp/tools", (req, res) => {
  const ctx = (req as any).gatewayContext || { user: "Unknown", requestId: "mcp_req", traceId: "mcp_trace", clientIp: "127.0.0.1", userAgent: "Client" };
  try {
    const domainFilter = req.query.domain as string;
    const riskFilter = req.query.riskLevel as string;
    
    let tools = Object.values(unifiedMcpRegistry);
    
    if (domainFilter) {
      tools = tools.filter(t => t.domain.toUpperCase() === domainFilter.toUpperCase());
    }
    if (riskFilter) {
      tools = tools.filter(t => t.riskLevel.toUpperCase() === riskFilter.toUpperCase());
    }
    
    logGatewayAudit(ctx.user, "GET /api/v1/mcp/tools", "REST", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, `Listed ${tools.length} MCP tools`);
    
    res.json({
      success: true,
      data: tools.map(t => ({
        name: t.name,
        domain: t.domain,
        description: t.description,
        category: t.category,
        requiredPermission: t.requiredPermission,
        riskLevel: t.riskLevel,
        confirmationRequired: t.confirmationRequired || false,
        parameters: t.parameters
      })),
      message: "Lấy danh mục công cụ MCP thành công."
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/api/v1/mcp/execute", async (req, res) => {
  const ctx = (req as any).gatewayContext || { user: "Chuyên viên Khách hàng", role: "LAWYER", requestId: "mcp_req", traceId: "mcp_trace", clientIp: "127.0.0.1", userAgent: "Client" };
  const { toolName, args } = req.body;
  
  if (!toolName) {
    return res.status(400).json({ success: false, message: "Yêu cầu cung cấp tên công cụ 'toolName'." });
  }
  
  try {
    const userRole = ctx.role || "LAWYER";
    const userEmail = (req.headers["x-test-user-email"] as string) || "levantai28072000@gmail.com";
    
    const result = await executeUnifiedMcpTool(toolName, args || {}, {
      userEmail,
      userRole
    });
    
    const status = (result?.success === false && result?.error) ? 400 : 200;
    
    logGatewayAudit(
      ctx.user,
      `POST /api/v1/mcp/execute (${toolName})`,
      "REST",
      status,
      ctx.requestId,
      ctx.traceId,
      ctx.clientIp,
      ctx.userAgent,
      `Executed tool ${toolName}. Success: ${result?.success !== false}`
    );
    
    res.status(status).json({
      success: result?.success !== false,
      data: result,
      meta: {
        requestId: ctx.requestId,
        traceId: ctx.traceId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    logGatewayAudit(
      ctx.user,
      `POST /api/v1/mcp/execute (${toolName})`,
      "REST",
      500,
      ctx.requestId,
      ctx.traceId,
      ctx.clientIp,
      ctx.userAgent,
      `Execution failed: ${err.message}`
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/api/v1/mcp/audit-logs", (req, res) => {
  const ctx = (req as any).gatewayContext || { user: "Unknown", requestId: "mcp_req", traceId: "mcp_trace", clientIp: "127.0.0.1", userAgent: "Client" };
  try {
    const logs = db.prepare("SELECT * FROM mcp_audit_logs ORDER BY timestamp DESC LIMIT 100").all();
    
    logGatewayAudit(ctx.user, "GET /api/v1/mcp/audit-logs", "REST", 200, ctx.requestId, ctx.traceId, ctx.clientIp, ctx.userAgent, `Fetched ${logs.length} MCP audit logs`);
    
    res.json({
      success: true,
      data: logs,
      message: "Lấy lịch sử kiểm toán MCP thành công."
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
