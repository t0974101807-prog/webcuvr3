import db from "../../db/database";
import { mcpToolsRegistry as iotToolsRegistry, executeMcpTool as executeIotTool, checkMcpPermission, logMcpAudit } from "../iot/mcp.server";
import { AgentMemoryService } from "../ai/memory.service";

export type McpRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type McpDomain = 'CASE' | 'CLIENT' | 'DOCUMENT' | 'LEGAL' | 'CONSULTATION' | 'CALL' | 'TASK' | 'FINANCE' | 'HR' | 'MEMORY' | 'IOT' | 'SYSTEM' | 'AUDIT';

export interface UnifiedMcpTool {
  name: string;
  domain: McpDomain;
  description: string;
  category?: string;
  requiredPermission: 'VIEW' | 'CONTROL' | 'CONFIG' | 'ADMIN';
  riskLevel: McpRiskLevel;
  confirmationRequired?: boolean;
  auditEnabled: boolean;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, context: { userEmail: string; userRole: string }) => Promise<any>;
}

// Global Unified MCP Tool Registry
export const unifiedMcpRegistry: Record<string, UnifiedMcpTool> = {};

// Register all existing IoT tools into the unified registry with IOT domain
for (const [toolName, iotTool] of Object.entries(iotToolsRegistry)) {
  unifiedMcpRegistry[toolName] = {
    name: iotTool.name,
    domain: 'IOT',
    description: iotTool.description,
    category: iotTool.category,
    requiredPermission: iotTool.requiredPermission,
    riskLevel: iotTool.dangerous ? 'HIGH' : 'LOW',
    confirmationRequired: iotTool.dangerous,
    auditEnabled: true,
    parameters: iotTool.parameters,
    handler: iotTool.handler
  };
}

// ================= DOMAIN: MEMORY TOOLS (TencentDB-Agent-Memory) =================
unifiedMcpRegistry["search_memories"] = {
  name: "search_memories",
  domain: "MEMORY",
  description: "Truy xuất bộ nhớ nhận thức dài hạn và kinh nghiệm của AI Agent theo điểm số nhận thức (Cosine/Similarity + Tầm quan trọng + Độ tươi mới Recency Decay).",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Từ khóa hoặc câu hỏi cần tra cứu ký ức." },
      memory_type: { type: "string", description: "Loại ký ức: 'semantic', 'episodic', 'user_preference', 'case_insight', 'client_fact', 'decision_pattern'." },
      category: { type: "string", description: "Danh mục: 'case_note', 'client_profile', 'legal_preference', 'rule'." },
      entity_id: { type: "string", description: "Mã định danh thực thể (Mã vụ án, Mã khách hàng)." },
      limit: { type: "integer", description: "Số lượng ký ức tối đa cần lấy (mặc định: 5)", default: 5 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    const results = AgentMemoryService.recallMemories({
      query: args.query || "",
      user_email: context.userEmail,
      memory_types: args.memory_type ? [args.memory_type] : undefined,
      category: args.category,
      entity_id: args.entity_id,
      limit: args.limit || 5
    });

    return {
      success: true,
      count: results.length,
      memories: results.map(r => ({
        id: r.memory.id,
        title: r.memory.title,
        content: r.memory.content,
        summary: r.memory.summary,
        type: r.memory.memory_type,
        importance_score: r.importanceScore,
        cognitive_score: r.score,
        tags: r.memory.tags
      }))
    };
  }
};

unifiedMcpRegistry["store_memory"] = {
  name: "store_memory",
  domain: "MEMORY",
  description: "Lưu trữ một sự kiện, kinh nghiệm xử lý vụ án, thói quen của luật sư hoặc quy tắc nghiệp vụ mới vào bộ nhớ dài hạn của AI.",
  requiredPermission: "CONTROL",
  riskLevel: "MEDIUM",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Tiêu đề ngắn gọn của mẩu ký ức." },
      content: { type: "string", description: "Nội dung chi tiết của ký ức hoặc bài học kinh nghiệm." },
      memory_type: { type: "string", description: "Loại ký ức ('semantic', 'episodic', 'user_preference', 'case_insight', 'client_fact', 'decision_pattern').", default: "semantic" },
      category: { type: "string", description: "Danh mục ('case_note', 'client_profile', 'legal_preference', 'procedural_habit', 'rule')", default: "general" },
      entity_type: { type: "string", description: "Thực thể liên quan: 'CLIENT', 'CASE', 'LAWYER', 'LAW', 'SYSTEM'" },
      entity_id: { type: "string", description: "Mã ID thực thể nếu có (ví dụ: HS-2026-001, KH-001)" },
      importance_score: { type: "number", description: "Điểm số quan trọng (0.0 đến 1.0)" },
      tags: { type: "array", items: { type: "string" }, description: "Danh sách thẻ nhãn tag" }
    },
    required: ["title", "content"]
  },
  handler: async (args, context) => {
    const result = AgentMemoryService.storeMemory({
      user_email: context.userEmail || "system",
      memory_type: args.memory_type || "semantic",
      category: args.category || "general",
      title: args.title,
      content: args.content,
      summary: args.summary || args.title,
      entity_type: args.entity_type || "SYSTEM",
      entity_id: args.entity_id || null,
      importance_score: args.importance_score,
      tags: args.tags || []
    });

    return result;
  }
};

unifiedMcpRegistry["get_case_memory"] = {
  name: "get_case_memory",
  domain: "MEMORY",
  description: "Lấy toàn bộ dòng thời gian ký ức, bài học kinh nghiệm và lưu ý đặc biệt liên quan đến một vụ án cụ thể.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      case_id: { type: "string", description: "Mã hồ sơ vụ việc (ví dụ: HS-2026-001 hoặc ID vụ án)" }
    },
    required: ["case_id"]
  },
  handler: async (args, context) => {
    const memories = db.prepare(`
      SELECT id, title, content, summary, memory_type, importance_score, created_at, tags
      FROM ai_agent_memories
      WHERE (entity_id = ? OR content LIKE ?) AND status = 'active'
      ORDER BY importance_score DESC, id DESC
    `).all(args.case_id, `%${args.case_id}%`) as any[];

    return {
      success: true,
      case_id: args.case_id,
      count: memories.length,
      insights: memories.map(m => ({
        id: m.id,
        title: m.title,
        content: m.content,
        summary: m.summary,
        type: m.memory_type,
        importance: m.importance_score,
        created_at: m.created_at,
        tags: JSON.parse(m.tags || "[]")
      }))
    };
  }
};

unifiedMcpRegistry["consolidate_memories"] = {
  name: "consolidate_memories",
  domain: "MEMORY",
  description: "Kích hoạt chu trình hợp nhất bộ nhớ (Memory Consolidation & Reflection), khử trùng lặp và đúc kết kinh nghiệm tổng quát.",
  requiredPermission: "CONFIG",
  riskLevel: "MEDIUM",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {}
  },
  handler: async (args, context) => {
    return AgentMemoryService.consolidateMemories();
  }
};

// ================= DOMAIN: CASE TOOLS =================
unifiedMcpRegistry["search_cases"] = {
  name: "search_cases",
  domain: "CASE",
  description: "Tìm kiếm danh sách hồ sơ vụ việc theo tên, mã hồ sơ, khách hàng, hoặc loại tranh chấp.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Từ khóa tìm kiếm (tên vụ việc, mã vụ án, khách hàng)." },
      status: { type: "string", description: "Trạng thái hồ sơ." },
      limit: { type: "integer", default: 10 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    const term = `%${args.query}%`;
    const cases = db.prepare("SELECT id, name, client, fee FROM cases WHERE name LIKE ? OR client LIKE ? OR id LIKE ? LIMIT ?")
      .all(term, term, term, args.limit || 10) as any[];

    return {
      success: true,
      count: cases.length,
      cases
    };
  }
};

unifiedMcpRegistry["get_case"] = {
  name: "get_case",
  domain: "CASE",
  description: "Lấy thông tin chi tiết của một hồ sơ vụ việc cụ thể (bao gồm thông tin khách hàng, phí dịch vụ, tiến độ).",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      case_id: { type: "string", description: "Mã ID hồ sơ vụ án." }
    },
    required: ["case_id"]
  },
  handler: async (args, context) => {
    const c = db.prepare("SELECT * FROM cases WHERE id = ?").get(args.case_id) as any;
    if (!c) {
      return { success: false, error: `Không tìm thấy hồ sơ có mã ${args.case_id}` };
    }

    const tasks = db.prepare("SELECT id, title, deadline, status FROM tasks WHERE employee_id = ? OR title LIKE ? LIMIT 5")
      .all(c.id, `%${c.id}%`) as any[];

    const schedules = db.prepare("SELECT id, date, location, note FROM court_schedule WHERE case_id = ?")
      .all(c.id) as any[];

    return {
      success: true,
      case: c,
      related_tasks: tasks,
      court_schedules: schedules
    };
  }
};

// ================= DOMAIN: CLIENT TOOLS =================
unifiedMcpRegistry["search_clients"] = {
  name: "search_clients",
  domain: "CLIENT",
  description: "Tìm kiếm khách hàng theo họ tên, số điện thoại hoặc mã định danh.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Họ tên hoặc số điện thoại khách hàng." },
      limit: { type: "integer", default: 10 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    const term = `%${args.query}%`;
    const clients = db.prepare("SELECT id, name, phone FROM clients WHERE name LIKE ? OR phone LIKE ? LIMIT ?")
      .all(term, term, args.limit || 10) as any[];

    return {
      success: true,
      count: clients.length,
      clients
    };
  }
};

unifiedMcpRegistry["get_client"] = {
  name: "get_client",
  domain: "CLIENT",
  description: "Lấy thông tin chi tiết của khách hàng bao gồm các vụ việc liên quan và tình hình công nợ/hóa đơn.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      client_id: { type: "string", description: "Mã định danh khách hàng." }
    },
    required: ["client_id"]
  },
  handler: async (args, context) => {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(args.client_id) as any;
    if (!client) {
      return { success: false, error: `Không tìm thấy khách hàng ID ${args.client_id}` };
    }

    const clientCases = db.prepare("SELECT id, name, fee FROM cases WHERE client = ? OR client LIKE ?")
      .all(client.name, `%${client.id}%`) as any[];

    const clientInvoices = db.prepare("SELECT id, case_id, amount, status, created FROM invoices WHERE client_id = ?")
      .all(client.id) as any[];

    return {
      success: true,
      client,
      cases: clientCases,
      invoices: clientInvoices
    };
  }
};

// ================= DOMAIN: LEGAL KNOWLEDGE TOOLS =================
unifiedMcpRegistry["search_laws"] = {
  name: "search_laws",
  domain: "LEGAL",
  description: "Tra cứu văn bản quy phạm pháp luật, điều luật, nghị định, thông tư trong cơ sở dữ liệu pháp lý của công ty.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Từ khóa tra cứu điều luật, tên văn bản hoặc số hiệu văn bản." },
      limit: { type: "integer", default: 8 }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    const term = `%${args.query}%`;
    const docs = db.prepare(`
      SELECT id, title, document_number, issue_date, effective_date, agency, category, summary, content
      FROM legal_documents
      WHERE title LIKE ? OR document_number LIKE ? OR content LIKE ? OR summary LIKE ?
      LIMIT ?
    `).all(term, term, term, term, args.limit || 8) as any[];

    return {
      success: true,
      count: docs.length,
      documents: docs.map(d => ({
        id: d.id,
        title: d.title,
        document_number: d.document_number,
        effective_date: d.effective_date,
        agency: d.agency,
        summary: d.summary || (d.content ? d.content.slice(0, 200) + '...' : '')
      }))
    };
  }
};

unifiedMcpRegistry["search_judgments"] = {
  name: "search_judgments",
  domain: "LEGAL",
  description: "Tìm kiếm bản án hoặc quyết định của Tòa án có nội dung pháp lý tương tự.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Từ khóa vụ việc, số bản án hoặc loại án." }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    const term = `%${args.query}%`;
    const judgments = db.prepare(`
      SELECT id, code, title, court, date, category, summary 
      FROM judgments 
      WHERE title LIKE ? OR code LIKE ? OR summary LIKE ? OR content LIKE ?
      LIMIT 6
    `).all(term, term, term, term) as any[];

    return {
      success: true,
      count: judgments.length,
      judgments
    };
  }
};

unifiedMcpRegistry["search_precedents"] = {
  name: "search_precedents",
  domain: "LEGAL",
  description: "Tra cứu Án lệ được Hội đồng Thẩm phán TANDTC thông qua.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: true,
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Chủ đề án lệ hoặc số án lệ." }
    },
    required: ["query"]
  },
  handler: async (args, context) => {
    const term = `%${args.query}%`;
    const precedents = db.prepare(`
      SELECT id, code, title, approved_date, summary, law_issue, solution
      FROM precedents
      WHERE title LIKE ? OR code LIKE ? OR law_issue LIKE ? OR solution LIKE ?
      LIMIT 6
    `).all(term, term, term, term) as any[];

    return {
      success: true,
      count: precedents.length,
      precedents
    };
  }
};

// ================= DOMAIN: SYSTEM & AUDIT TOOLS =================
unifiedMcpRegistry["get_system_status"] = {
  name: "get_system_status",
  domain: "SYSTEM",
  description: "Lấy báo cáo tình trạng kỹ thuật, kết nối cơ sở dữ liệu và các module vận hành của Legal OS.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: false,
  parameters: {
    type: "object",
    properties: {}
  },
  handler: async (args, context) => {
    const clientCount = (db.prepare("SELECT COUNT(*) as c FROM clients").get() as any)?.c || 0;
    const caseCount = (db.prepare("SELECT COUNT(*) as c FROM cases").get() as any)?.c || 0;
    const taskCount = (db.prepare("SELECT COUNT(*) as c FROM tasks").get() as any)?.c || 0;
    const memoryCount = (db.prepare("SELECT COUNT(*) as c FROM ai_agent_memories WHERE status = 'active'").get() as any)?.c || 0;
    const deviceCount = (db.prepare("SELECT COUNT(*) as c FROM iot_devices").get() as any)?.c || 0;

    return {
      success: true,
      system_name: "Ánh Dương Law Legal OS & Enterprise ERP",
      status: "OPERATIONAL",
      uptime: process.uptime(),
      metrics: {
        total_clients: clientCount,
        total_cases: caseCount,
        total_tasks: taskCount,
        total_ai_memories: memoryCount,
        total_iot_devices: deviceCount,
        database_engine: "SQLite WAL / Memory Caching"
      }
    };
  }
};

unifiedMcpRegistry["get_mcp_tools"] = {
  name: "get_mcp_tools",
  domain: "SYSTEM",
  description: "Liệt kê danh mục tất cả công cụ MCP khả dụng trên toàn bộ hệ thống Legal OS phân loại theo Domain và Risk Level.",
  requiredPermission: "VIEW",
  riskLevel: "LOW",
  auditEnabled: false,
  parameters: {
    type: "object",
    properties: {
      domain: { type: "string", description: "Lọc theo domain cụ thể: 'CASE', 'CLIENT', 'MEMORY', 'LEGAL', 'IOT', 'SYSTEM', etc." }
    }
  },
  handler: async (args, context) => {
    let tools = Object.values(unifiedMcpRegistry);
    if (args.domain) {
      tools = tools.filter(t => t.domain.toUpperCase() === args.domain.toUpperCase());
    }

    return {
      success: true,
      total_tools: tools.length,
      tools: tools.map(t => ({
        name: t.name,
        domain: t.domain,
        description: t.description,
        risk_level: t.riskLevel,
        required_permission: t.requiredPermission,
        confirmation_required: t.confirmationRequired || false
      }))
    };
  }
};

/**
 * Unified MCP Gateway Execution Handler
 */
export async function executeUnifiedMcpTool(
  toolName: string,
  args: any,
  context: { userEmail: string; userRole: string }
): Promise<any> {
  const tool = unifiedMcpRegistry[toolName];
  if (!tool) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `MCP Tool '${toolName}' không tồn tại trong hệ thống.`
      }
    };
  }

  // 1. Check RBAC Permission
  const hasPermission = checkMcpPermission(context.userRole, tool.requiredPermission);
  if (!hasPermission) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: `Tài khoản '${context.userEmail}' (vai trò: ${context.userRole}) không có quyền '${tool.requiredPermission}' để thực thi công cụ '${toolName}'.`
      }
    };
  }

  // 2. Check High-Risk confirmation
  if (tool.confirmationRequired && !args.confirmed) {
    return {
      success: false,
      requireConfirmation: true,
      riskLevel: tool.riskLevel,
      message: `Hành động này có mức rủi ro '${tool.riskLevel}' và yêu cầu người dùng xác nhận rõ ràng trước khi thực thi.`
    };
  }

  const startTime = Date.now();
  let result: any;
  let isSuccess = true;

  try {
    result = await tool.handler(args, context);
  } catch (err: any) {
    isSuccess = false;
    result = {
      success: false,
      error: {
        code: "TOOL_EXECUTION_ERROR",
        message: err.message || "Lỗi khi chạy handler của MCP Tool."
      }
    };
  }

  const durationMs = Date.now() - startTime;

  // 3. Audit Log
  if (tool.auditEnabled) {
    logMcpAudit(
      context.userEmail,
      "Unified-LegalOS-Agent",
      toolName,
      args.device_id || args.case_id || args.client_id || null,
      JSON.stringify(args || {}),
      JSON.stringify(result || {}),
      isSuccess
    );
  }

  return {
    ...result,
    _mcp_meta: {
      tool: toolName,
      domain: tool.domain,
      duration_ms: durationMs,
      timestamp: new Date().toISOString()
    }
  };
}
