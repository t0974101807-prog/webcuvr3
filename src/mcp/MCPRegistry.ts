import db from "../db/database";
import { AgentMemoryService } from "../modules/ai/memory.service";

/* ========================================================================= */
/* 1. MCP TYPES & INTERFACES                                                 */
/* ========================================================================= */

export enum McpRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export enum McpDomain {
  CASE = "CASE",
  CLIENT = "CLIENT",
  DOCUMENT = "DOCUMENT",
  LEGAL = "LEGAL",
  CONSULTATION = "CONSULTATION",
  CALL = "CALL",
  TASK = "TASK",
  FINANCE = "FINANCE",
  HR = "HR",
  MEMORY = "MEMORY",
  IOT = "IOT",
  SYSTEM = "SYSTEM",
  AUDIT = "AUDIT"
}

export interface McpContext {
  userEmail: string;
  userRole: string;
  confirmed?: boolean;
}

export interface McpInputSchema {
  type: "object";
  properties: Record<string, {
    type: "string" | "integer" | "number" | "boolean" | "array" | "object";
    description: string;
    items?: { type: string };
    default?: any;
  }>;
  required?: string[];
}

export interface McpTool {
  name: string;
  domain: McpDomain;
  description: string;
  inputSchema: McpInputSchema;
  permission: "VIEW" | "CONTROL" | "CONFIG" | "ADMIN";
  riskLevel: McpRiskLevel;
  auditEnabled: boolean;
  handler: (args: any, context: McpContext) => Promise<any>;
}

export interface McpAuditLog {
  userEmail: string;
  aiAgent: string;
  mcpTool: string;
  deviceId: string | null;
  command: string;
  result: string;
  success: boolean;
}

/* ========================================================================= */
/* 2. REPUTABLE BUSINESS LOGIC SERVICES (DECOUPLED FROM DIRECT CONTROLLERS)  */
/* ========================================================================= */

export class McpMemoryService {
  public static async search(query: string, userEmail: string, limit: number = 5): Promise<any[]> {
    // Tenant Isolation: Only return memories created by this user or global system guidelines
    const memories = db.prepare(`
      SELECT id, title, content, summary, memory_type, importance_score, tags, created_at
      FROM ai_agent_memories
      WHERE (user_email = ? OR user_email = 'system')
        AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
        AND status = 'active'
      ORDER BY importance_score DESC, id DESC
      LIMIT ?
    `).all(userEmail, `%${query}%`, `%${query}%`, `%${query}%`, limit) as any[];

    return memories.map(m => ({
      id: m.id,
      title: m.title,
      content: m.content,
      summary: m.summary,
      type: m.memory_type,
      importance: m.importance_score,
      created_at: m.created_at,
      tags: JSON.parse(m.tags || "[]")
    }));
  }

  public static async store(
    userEmail: string,
    title: string,
    content: string,
    memoryType: "user_preference" | "case_insight" | "client_fact" | "decision_pattern" | "semantic" | "episodic" | "working" = "semantic",
    category: string = "general",
    importanceScore: number = 0.5,
    tags: string[] = []
  ): Promise<any> {
    // Tenant Isolation: Ensure memory is stamped strictly with the calling user's email
    const result = AgentMemoryService.storeMemory({
      user_email: userEmail,
      memory_type: memoryType,
      category: category,
      title: title,
      content: content,
      summary: title,
      entity_type: "USER",
      entity_id: userEmail,
      importance_score: importanceScore,
      tags: tags
    });
    return result;
  }
}

export class McpCaseService {
  public static async search(query: string, userEmail: string, userRole: string, limit: number = 5): Promise<any[]> {
    const isRestricted = userRole !== "ADMIN" && userRole !== "PARTNER";
    const term = `%${query}%`;

    if (isRestricted) {
      // Tenant Isolation: Restricted lawyers/staff only see cases assigned to their user record or splits
      const cases = db.prepare(`
        SELECT c.id, c.name, c.client, c.fee 
        FROM cases c
        JOIN users u ON u.case_id = c.id
        WHERE u.email = ? AND (c.name LIKE ? OR c.client LIKE ? OR c.id LIKE ?)
        LIMIT ?
      `).all(userEmail, term, term, term, limit) as any[];

      return cases;
    } else {
      const cases = db.prepare(`
        SELECT id, name, client, fee 
        FROM cases 
        WHERE name LIKE ? OR client LIKE ? OR id LIKE ?
        LIMIT ?
      `).all(term, term, term, limit) as any[];

      return cases;
    }
  }

  public static async getCaseDetails(caseId: string, userEmail: string, userRole: string): Promise<any> {
    const isRestricted = userRole !== "ADMIN" && userRole !== "PARTNER";
    
    // Fetch case record
    const c = db.prepare("SELECT * FROM cases WHERE id = ?").get(caseId) as any;
    if (!c) {
      throw new Error(`Không tìm thấy hồ sơ vụ án: ${caseId}`);
    }

    if (isRestricted) {
      // Tenant Isolation Check: Verify that the restricted user is actually assigned to this case
      const userAssigned = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE email = ? AND case_id = ?").get(userEmail, caseId) as any;
      const hasSplit = db.prepare("SELECT COUNT(*) as cnt FROM splits s JOIN users u ON s.employee_id = u.id WHERE u.email = ? AND s.case_id = ?").get(userEmail, caseId) as any;
      
      const isAuthorized = (userAssigned?.cnt || 0) > 0 || (hasSplit?.cnt || 0) > 0;
      if (!isAuthorized) {
        throw new Error("Tenant Violation: Bạn không có quyền truy cập thông tin hồ sơ vụ án này.");
      }
    }

    const tasks = db.prepare("SELECT id, title, deadline, status FROM tasks WHERE employee_id = ? OR title LIKE ? LIMIT 5")
      .all(c.id, `%${c.id}%`) as any[];

    const schedules = db.prepare("SELECT id, date, location, note FROM court_schedule WHERE case_id = ?")
      .all(c.id) as any[];

    return {
      case: c,
      related_tasks: tasks,
      court_schedules: schedules
    };
  }

  public static async createCase(name: string, client: string, fee: number, userRole: string): Promise<any> {
    if (userRole !== "ADMIN" && userRole !== "PARTNER") {
      throw new Error("Quyền hạn không đủ để tạo hồ sơ vụ án mới.");
    }
    const id = `HS-${Date.now().toString().slice(-6)}`;
    db.prepare("INSERT INTO cases (id, name, client, fee) VALUES (?, ?, ?, ?)")
      .run(id, name, client, fee);

    return {
      success: true,
      case_id: id,
      name,
      client,
      fee
    };
  }
}

export class McpClientService {
  public static async search(query: string, userEmail: string, userRole: string, limit: number = 5): Promise<any[]> {
    const isRestricted = userRole !== "ADMIN" && userRole !== "PARTNER";
    const term = `%${query}%`;

    if (isRestricted) {
      // Tenant Isolation: Only return clients whose cases are assigned to the lawyer
      const clients = db.prepare(`
        SELECT DISTINCT cl.id, cl.name, cl.phone
        FROM clients cl
        JOIN cases c ON c.client = cl.name OR c.client LIKE '%' || cl.id || '%'
        JOIN users u ON u.case_id = c.id
        WHERE u.email = ? AND (cl.name LIKE ? OR cl.phone LIKE ?)
        LIMIT ?
      `).all(userEmail, term, term, limit) as any[];

      return clients;
    } else {
      const clients = db.prepare(`
        SELECT id, name, phone
        FROM clients
        WHERE name LIKE ? OR phone LIKE ?
        LIMIT ?
      `).all(term, term, limit) as any[];

      return clients;
    }
  }

  public static async getClientDetails(clientId: string, userEmail: string, userRole: string): Promise<any> {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId) as any;
    if (!client) {
      throw new Error(`Không tìm thấy khách hàng ID: ${clientId}`);
    }

    const isRestricted = userRole !== "ADMIN" && userRole !== "PARTNER";
    if (isRestricted) {
      // Tenant Isolation check: Does the lawyer have an assigned case belonging to this client?
      const checkAccess = db.prepare(`
        SELECT COUNT(*) as cnt
        FROM cases c
        JOIN users u ON u.case_id = c.id
        WHERE u.email = ? AND (c.client = ? OR c.client LIKE '%' || ? || '%')
      `).get(userEmail, client.name, client.id) as any;

      if (!checkAccess || checkAccess.cnt === 0) {
        throw new Error("Tenant Violation: Bạn không có quyền truy cập dữ liệu của khách hàng này.");
      }
    }

    const clientCases = db.prepare("SELECT id, name, fee FROM cases WHERE client = ? OR client LIKE ?")
      .all(client.name, `%${client.id}%`) as any[];

    const clientInvoices = db.prepare("SELECT id, case_id, amount, status, created FROM invoices WHERE client_id = ?")
      .all(client.id) as any[];

    return {
      client,
      cases: clientCases,
      invoices: clientInvoices
    };
  }
}

export class McpLegalKnowledgeService {
  public static async searchLaws(query: string, limit: number = 5): Promise<any[]> {
    const term = `%${query}%`;
    const docs = db.prepare(`
      SELECT id, title, document_number, issue_date, effective_date, agency, summary
      FROM legal_documents
      WHERE title LIKE ? OR document_number LIKE ? OR content LIKE ? OR summary LIKE ?
      LIMIT ?
    `).all(term, term, term, term, limit) as any[];

    return docs;
  }

  public static async searchPrecedents(query: string, limit: number = 5): Promise<any[]> {
    const term = `%${query}%`;
    const precedents = db.prepare(`
      SELECT id, code, title, approved_date, summary, law_issue, solution
      FROM precedents
      WHERE title LIKE ? OR code LIKE ? OR law_issue LIKE ? OR solution LIKE ?
      LIMIT ?
    `).all(term, term, term, term, limit) as any[];

    return precedents;
  }
}

/* ========================================================================= */
/* 3. ARGUMENTS VALIDATOR ENGINE                                             */
/* ========================================================================= */

export function validateMcpArguments(schema: McpInputSchema, args: any): { valid: boolean; errors?: string[] } {
  if (!args || typeof args !== "object") {
    return { valid: false, errors: ["Đối số yêu cầu phải là một Object."] };
  }

  const errors: string[] = [];
  const requiredFields = schema.required || [];

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in args) || args[field] === undefined || args[field] === null) {
      errors.push(`Thiếu tham số bắt buộc: '${field}'.`);
    }
  }

  // Check property types
  const properties = schema.properties || {};
  for (const [key, value] of Object.entries(args)) {
    if (properties[key]) {
      const expectedType = properties[key].type;
      const actualType = typeof value;

      if (expectedType === "integer") {
        if (!Number.isInteger(value)) {
          errors.push(`Tham số '${key}' phải là số nguyên (integer), hiện tại là: ${actualType}.`);
        }
      } else if (expectedType === "number") {
        if (actualType !== "number") {
          errors.push(`Tham số '${key}' phải là số (number), hiện tại là: ${actualType}.`);
        }
      } else if (expectedType === "boolean") {
        if (actualType !== "boolean") {
          errors.push(`Tham số '${key}' phải là Boolean, hiện tại là: ${actualType}.`);
        }
      } else if (expectedType === "array") {
        if (!Array.isArray(value)) {
          errors.push(`Tham số '${key}' phải là một mảng (Array).`);
        }
      } else if (expectedType === "object") {
        if (actualType !== "object" || value === null || Array.isArray(value)) {
          errors.push(`Tham số '${key}' phải là một Object.`);
        }
      } else if (actualType !== expectedType) {
        errors.push(`Tham số '${key}' yêu cầu kiểu dữ liệu ${expectedType}, hiện tại là: ${actualType}.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/* ========================================================================= */
/* 4. REPUTABLE CORE MCP REGISTRY GATEWAY                                    */
/* ========================================================================= */

export class McpRegistryGateway {
  private static registry: Record<string, McpTool> = {};

  public static registerTool(tool: McpTool): void {
    this.registry[tool.name] = tool;
  }

  public static listTools(domain?: string): McpTool[] {
    const tools = Object.values(this.registry);
    if (domain) {
      return tools.filter(t => t.domain.toUpperCase() === domain.toUpperCase());
    }
    return tools;
  }

  public static getTool(name: string): McpTool | undefined {
    return this.registry[name];
  }

  public static checkPermission(userRole: string, requiredPermission: "VIEW" | "CONTROL" | "CONFIG" | "ADMIN"): boolean {
    const roleHierarchy: Record<string, number> = {
      "CLIENT": 1,
      "LAWYER": 2,
      "PARTNER": 3,
      "ADMIN": 4
    };

    const permissionWeights: Record<string, number> = {
      "VIEW": 1,
      "CONTROL": 2,
      "CONFIG": 3,
      "ADMIN": 4
    };

    const userWeight = roleHierarchy[userRole.toUpperCase()] || 1;
    const requiredWeight = permissionWeights[requiredPermission.toUpperCase()] || 1;

    return userWeight >= requiredWeight;
  }

  public static async executeTool(name: string, args: any, context: McpContext): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Công cụ MCP '${name}' không tồn tại trong hệ thống.`
        }
      };
    }

    // 1. RBAC Check
    const hasPermission = this.checkPermission(context.userRole, tool.permission);
    if (!hasPermission) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Tài khoản '${context.userEmail}' (vai trò: ${context.userRole}) không đủ quyền hạn '${tool.permission}' để gọi công cụ '${name}'.`
        }
      };
    }

    // 2. High-Risk Confirmation Logic
    if (tool.riskLevel === McpRiskLevel.HIGH && !args.confirmed && !context.confirmed) {
      return {
        success: false,
        requireConfirmation: true,
        riskLevel: tool.riskLevel,
        message: `Hành động này mang mức rủi ro CAO (HIGH) và yêu cầu người dùng xác nhận rõ ràng trước khi thực hiện.`
      };
    }

    // 3. Schema Validation
    const validationResult = validateMcpArguments(tool.inputSchema, args);
    if (!validationResult.valid) {
      return {
        success: false,
        error: {
          code: "INVALID_ARGUMENTS",
          message: "Tham số gửi lên không đúng định dạng.",
          details: validationResult.errors
        }
      };
    }

    const startTime = Date.now();
    let result: any;
    let isSuccess = true;

    try {
      // Handlers are executed within the sandbox context (strictly enforcing tenant isolation inside handlers)
      result = await tool.handler(args, context);
    } catch (err: any) {
      isSuccess = false;
      result = {
        success: false,
        error: {
          code: "EXECUTION_ERROR",
          message: err.message || "Đã xảy ra lỗi trong quá trình thực thi công cụ."
        }
      };
    }

    const durationMs = Date.now() - startTime;

    // 4. Safe Logging
    if (tool.auditEnabled) {
      try {
        this.auditToolCall({
          userEmail: context.userEmail,
          aiAgent: "LegalOS-Core-MCP",
          mcpTool: name,
          deviceId: args.case_id || args.client_id || null,
          command: JSON.stringify(args || {}),
          result: JSON.stringify(result || {}),
          success: isSuccess
        });
      } catch (auditErr) {
        console.error("Lỗi khi ghi nhật ký kiểm toán MCP:", auditErr);
      }
    }

    return {
      success: isSuccess !== false && result?.success !== false,
      data: result,
      meta: {
        tool: name,
        domain: tool.domain,
        riskLevel: tool.riskLevel,
        durationMs,
        timestamp: new Date().toISOString()
      }
    };
  }

  public static auditToolCall(log: McpAuditLog): void {
    const id = `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    db.prepare(`
      INSERT INTO audit_logs (id, user, action, time)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      id,
      log.userEmail,
      `MCP EXECUTED: ${log.mcpTool} | Success: ${log.success} | Tool: ${log.mcpTool}`
    );

    // Also try to insert into specialized mcp_audit_logs if it exists
    try {
      db.prepare(`
        INSERT INTO mcp_audit_logs (id, user_email, ai_agent, mcp_tool, device_id, command, result, success, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        id,
        log.userEmail,
        log.aiAgent,
        log.mcpTool,
        log.deviceId,
        log.command,
        log.result,
        log.success ? 1 : 0
      );
    } catch (e) {
      // Table might not exist or schema differs slightly, fallback to default audit_logs completed safely
    }
  }
}

/* ========================================================================= */
/* 5. DEFAULT TOOL REGISTRATIONS                                             */
/* ========================================================================= */

// Register Memory Tools
McpRegistryGateway.registerTool({
  name: "search_memories",
  domain: McpDomain.MEMORY,
  description: "Truy xuất bộ nhớ nhận thức dài hạn và kinh nghiệm của AI Agent liên quan đến tài khoản người dùng.",
  permission: "VIEW",
  riskLevel: McpRiskLevel.LOW,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Từ khóa hoặc nội dung ký ức cần tra cứu." },
      limit: { type: "integer", description: "Số kết quả tối đa.", default: 5 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    return McpMemoryService.search(args.query, context.userEmail, args.limit || 5);
  }
});

McpRegistryGateway.registerTool({
  name: "store_memory",
  domain: McpDomain.MEMORY,
  description: "Lưu giữ một mẩu thông tin, thói quen làm việc hoặc bài học thực tế vào bộ nhớ AI.",
  permission: "CONTROL",
  riskLevel: McpRiskLevel.MEDIUM,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Tiêu đề ngắn gọn." },
      content: { type: "string", description: "Nội dung chi tiết mẩu ký ức cần lưu trữ." },
      importance: { type: "number", description: "Điểm độ quan trọng (0.0 đến 1.0).", default: 0.5 }
    },
    required: ["title", "content"]
  },
  handler: async (args, context) => {
    return McpMemoryService.store(context.userEmail, args.title, args.content, "semantic", "general", args.importance || 0.5, []);
  }
});

// Register Case Tools
McpRegistryGateway.registerTool({
  name: "search_cases",
  domain: McpDomain.CASE,
  description: "Tìm kiếm danh sách các hồ sơ vụ án mà luật sư được phân quyền quản lý.",
  permission: "VIEW",
  riskLevel: McpRiskLevel.LOW,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Từ khóa vụ việc, mã vụ việc, hoặc tên khách hàng." },
      limit: { type: "integer", description: "Số kết quả tối đa.", default: 5 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    return McpCaseService.search(args.query, context.userEmail, context.userRole, args.limit || 5);
  }
});

McpRegistryGateway.registerTool({
  name: "get_case",
  domain: McpDomain.CASE,
  description: "Lấy chi tiết thông tin hồ sơ vụ án cùng các lịch tòa và nhiệm vụ liên quan.",
  permission: "VIEW",
  riskLevel: McpRiskLevel.LOW,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      case_id: { type: "string", description: "Mã hồ sơ vụ án (ví dụ: HS-101)." }
    },
    required: ["case_id"]
  },
  handler: async (args, context) => {
    return McpCaseService.getCaseDetails(args.case_id, context.userEmail, context.userRole);
  }
});

McpRegistryGateway.registerTool({
  name: "create_case",
  domain: McpDomain.CASE,
  description: "Khởi tạo một hồ sơ vụ việc pháp lý mới trên hệ thống.",
  permission: "CONTROL",
  riskLevel: McpRiskLevel.MEDIUM,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Tên vụ việc hoặc quan hệ tranh chấp." },
      client: { type: "string", description: "Tên khách hàng hoặc ID khách hàng." },
      fee: { type: "integer", description: "Phí dịch vụ thỏa thuận (VNĐ)." }
    },
    required: ["name", "client", "fee"]
  },
  handler: async (args, context) => {
    return McpCaseService.createCase(args.name, args.client, args.fee, context.userRole);
  }
});

// Register Client Tools
McpRegistryGateway.registerTool({
  name: "search_clients",
  domain: McpDomain.CLIENT,
  description: "Tìm kiếm hồ sơ khách hàng mà luật sư được phân quyền tiếp cận.",
  permission: "VIEW",
  riskLevel: McpRiskLevel.LOW,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Tên khách hàng hoặc số điện thoại." },
      limit: { type: "integer", description: "Số kết quả tối đa.", default: 5 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    return McpClientService.search(args.query, context.userEmail, context.userRole, args.limit || 5);
  }
});

McpRegistryGateway.registerTool({
  name: "get_client",
  domain: McpDomain.CLIENT,
  description: "Lấy chi tiết hồ sơ thông tin khách hàng, lịch sử thanh toán và danh sách vụ việc liên quan.",
  permission: "VIEW",
  riskLevel: McpRiskLevel.LOW,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      client_id: { type: "string", description: "Mã định danh khách hàng." }
    },
    required: ["client_id"]
  },
  handler: async (args, context) => {
    return McpClientService.getClientDetails(args.client_id, context.userEmail, context.userRole);
  }
});

// Register Legal Knowledge Tools
McpRegistryGateway.registerTool({
  name: "search_laws",
  domain: McpDomain.LEGAL,
  description: "Tra cứu các văn bản pháp lý, nghị định, thông tư trong thư viện số của Legal OS.",
  permission: "VIEW",
  riskLevel: McpRiskLevel.LOW,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Từ khóa hoặc số hiệu văn bản pháp luật." },
      limit: { type: "integer", description: "Số kết quả tối đa.", default: 5 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    return McpLegalKnowledgeService.searchLaws(args.query, args.limit || 5);
  }
});

McpRegistryGateway.registerTool({
  name: "search_precedents",
  domain: McpDomain.LEGAL,
  description: "Tra cứu danh sách án lệ chính thống được Hội đồng Thẩm phán thông qua.",
  permission: "VIEW",
  riskLevel: McpRiskLevel.LOW,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Chủ đề án lệ hoặc từ khóa tóm tắt sự việc." },
      limit: { type: "integer", description: "Số kết quả tối đa.", default: 5 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    return McpLegalKnowledgeService.searchPrecedents(args.query, args.limit || 5);
  }
});

// High Risk Simulation Tools (Verification & Commands)
McpRegistryGateway.registerTool({
  name: "make_call",
  domain: McpDomain.CALL,
  description: "Thiết lập cuộc gọi VoIP tự động kết nối khách hàng thông qua tổng đài Yeastars (HIGH RISK).",
  permission: "CONTROL",
  riskLevel: McpRiskLevel.HIGH,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      phone: { type: "string", description: "Số điện thoại nhận cuộc gọi." },
      reason: { type: "string", description: "Lý do cuộc gọi hoặc kịch bản hỗ trợ." },
      confirmed: { type: "boolean", description: "Xác nhận thực hiện cuộc gọi.", default: false }
    },
    required: ["phone", "reason"]
  },
  handler: async (args, context) => {
    return {
      success: true,
      message: `Đang kết nối cuộc gọi VoIP tự động đến số ${args.phone} thông qua Yeastars Trunk. Trạng thái: CONNECTING.`,
      call_ref: `CALL-${Date.now().toString().slice(-4)}`
    };
  }
});

McpRegistryGateway.registerTool({
  name: "execute_device_command",
  domain: McpDomain.IOT,
  description: "Gửi lệnh điều khiển phần cứng, thiết bị IoT phòng họp hoặc cổng thông minh (HIGH RISK).",
  permission: "CONTROL",
  riskLevel: McpRiskLevel.HIGH,
  auditEnabled: true,
  inputSchema: {
    type: "object",
    properties: {
      device_id: { type: "string", description: "Mã ID thiết bị thông minh." },
      command: { type: "string", description: "Lệnh thực thi (ví dụ: 'unlock_door', 'shutdown_power')." },
      confirmed: { type: "boolean", description: "Xác nhận cưỡng chế lệnh rủi ro cao.", default: false }
    },
    required: ["device_id", "command"]
  },
  handler: async (args, context) => {
    return {
      success: true,
      device_id: args.device_id,
      command: args.command,
      status: "EXECUTED",
      message: `Lệnh '${args.command}' đã được gửi thành công đến thiết bị IoT Smart Gateway '${args.device_id}'.`
    };
  }
});
