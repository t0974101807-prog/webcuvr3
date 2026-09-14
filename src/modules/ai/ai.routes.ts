import { Router } from "express";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import db from "../../db/database";
import { AgentMemoryService } from "./memory.service";
import { executeUnifiedMcpTool } from "../mcp/unified.registry";

const router = Router();

// ================= AI AGENT MEMORY ENGINE (TencentDB / Mem0) REST API =================

// GET /api/ai/memory - List all memories with optional search & filter
router.get("/memory", async (req, res) => {
  try {
    const { query, type, category, entity_id, status = "active", limit = "50" } = req.query as any;
    let sql = `SELECT * FROM ai_agent_memories WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== "all") {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (type && type !== "all") {
      sql += ` AND memory_type = ?`;
      params.push(type);
    }
    if (category && category !== "all") {
      sql += ` AND category = ?`;
      params.push(category);
    }
    if (entity_id) {
      sql += ` AND entity_id = ?`;
      params.push(entity_id);
    }
    if (query && query.trim() !== "") {
      sql += ` AND (title LIKE ? OR content LIKE ? OR summary LIKE ? OR tags LIKE ?)`;
      const term = `%${query.trim()}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY importance_score DESC, id DESC LIMIT ?`;
    params.push(parseInt(limit, 10) || 50);

    const rows = db.prepare(sql).all(...params) as any[];
    const formatted = rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      metadata: JSON.parse(r.metadata || "{}")
    }));

    res.json({
      success: true,
      count: formatted.length,
      memories: formatted
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch memories." });
  }
});

// POST /api/ai/memory - Store a new memory item
router.post("/memory", async (req, res) => {
  try {
    const { title, content, memory_type, category, entity_type, entity_id, importance_score, tags, summary } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: "Tiêu đề và nội dung ký ức là bắt buộc." });
    }

    const sessionUser = (req as any).session?.user?.email || "system";
    const result = AgentMemoryService.storeMemory({
      user_email: sessionUser,
      title,
      content,
      summary: summary || title,
      memory_type: memory_type || "semantic",
      category: category || "general",
      entity_type: entity_type || "SYSTEM",
      entity_id: entity_id || null,
      importance_score: importance_score !== undefined ? parseFloat(importance_score) : undefined,
      tags: Array.isArray(tags) ? tags : []
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to add memory." });
  }
});

// PUT /api/ai/memory/:id - Update an existing memory
router.put("/memory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, memory_type, category, importance_score, status, tags } = req.body;
    const now = new Date().toISOString();

    const existing = db.prepare("SELECT * FROM ai_agent_memories WHERE id = ?").get(id) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: "Ký ức không tồn tại." });
    }

    const nextTitle = title !== undefined ? title : existing.title;
    const nextContent = content !== undefined ? content : existing.content;
    const nextSummary = summary !== undefined ? summary : existing.summary;
    const nextType = memory_type !== undefined ? memory_type : existing.memory_type;
    const nextCategory = category !== undefined ? category : existing.category;
    const nextImportance = importance_score !== undefined ? parseFloat(importance_score) : existing.importance_score;
    const nextStatus = status !== undefined ? status : existing.status;
    const nextTags = tags !== undefined ? JSON.stringify(tags) : existing.tags;

    db.prepare(`
      UPDATE ai_agent_memories SET
        title = ?, content = ?, summary = ?, memory_type = ?, category = ?,
        importance_score = ?, status = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `).run(nextTitle, nextContent, nextSummary, nextType, nextCategory, nextImportance, nextStatus, nextTags, now, id);

    res.json({ success: true, message: "Đã cập nhật ký ức thành công." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to update memory." });
  }
});

// DELETE /api/ai/memory/:id - Soft-delete / archive memory
router.delete("/memory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    if (permanent === "true") {
      db.prepare("DELETE FROM ai_agent_memories WHERE id = ?").run(id);
    } else {
      db.prepare("UPDATE ai_agent_memories SET status = 'archived', updated_at = ? WHERE id = ?").run(new Date().toISOString(), id);
    }

    res.json({ success: true, message: permanent === "true" ? "Đã xóa vĩnh viễn ký ức." : "Đã chuyển ký ức vào kho lưu trữ (Archive)." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to delete memory." });
  }
});

// POST /api/ai/memory/consolidate - Run cognitive reflection cycle
router.post("/memory/consolidate", async (req, res) => {
  try {
    const result = AgentMemoryService.consolidateMemories();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Consolidation failed." });
  }
});

// GET /api/ai/memory/stats - Memory store metrics
router.get("/memory/stats", async (req, res) => {
  try {
    const stats = AgentMemoryService.getStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/memory/recall-test - Simulate cognitive retrieval
router.post("/memory/recall-test", async (req, res) => {
  try {
    const { query, user_email, limit = 5 } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const recalled = AgentMemoryService.recallMemories({
      query,
      user_email: user_email || "system",
      limit: parseInt(limit, 10) || 5
    });

    res.json({
      success: true,
      query,
      count: recalled.length,
      results: recalled
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Initialize tables if needed
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_training_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT,
      pattern TEXT,
      response TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      provider_type TEXT,
      api_key TEXT,
      api_url TEXT,
      default_model TEXT,
      task_assignment TEXT DEFAULT 'all',
      temperature REAL DEFAULT 0.2,
      max_tokens INTEGER DEFAULT 4096,
      is_active INTEGER DEFAULT 1,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_models (
      id TEXT PRIMARY KEY,
      name TEXT,
      provider TEXT,
      context_window TEXT,
      input_cost REAL DEFAULT 0,
      output_cost REAL DEFAULT 0,
      capabilities TEXT,
      enabled INTEGER DEFAULT 1,
      assigned_task TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT,
      model_used TEXT,
      prompt_snippet TEXT,
      response_snippet TEXT,
      latency_ms INTEGER,
      status TEXT,
      error_message TEXT,
      created_at TEXT
    );
  `);

  // Seed default training rules
  const count = db.prepare("SELECT COUNT(*) as count FROM ai_training_data").get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare("INSERT INTO ai_training_data (topic, pattern, response, created_at) VALUES (?, ?, ?, ?)");
    insert.run(
      "Quy trình tiếp nhận khách hàng mới",
      "quy trình tiếp nhận khách hàng",
      "Bước 1: Tiếp nhận thông tin từ tổng đài hoặc livechat.\nBước 2: Phân nhóm dịch vụ (Hình sự, Dân sự, Doanh nghiệp...).\nBước 3: Người điều phối ERP phân công Luật sư phụ trách chính.\nBước 4: Luật sư chủ động liên hệ đặt lịch tư vấn trực tiếp trong vòng 2 giờ.",
      new Date().toISOString()
    );
    insert.run(
      "Bảo mật thông tin khách hàng",
      "bảo mật thông tin khách hàng hoặc hồ sơ vụ việc",
      "Tất cả thông tin hồ sơ của khách hàng tại Ánh Dương Law được bảo mật tuyệt đối theo Luật Luật sư 2006. Nhân viên không được tự ý tiết lộ chi tiết vụ án hoặc danh tính khách hàng cho bên thứ ba khi chưa có sự đồng ý bằng văn bản của Giám đốc hoặc chính khách hàng.",
      new Date().toISOString()
    );
    insert.run(
      "Quy chế báo cáo công việc",
      "quy chế báo cáo công việc hoặc ghi nhận log",
      "Mỗi luật sư và chuyên viên tại Ánh Dương Law có trách nhiệm cập nhật tiến độ công việc (ERP Records) và ghi lại nhật ký tác vụ hàng ngày trước 17:30. Các trường hợp hoàn thành xuất sắc nhiệm vụ sẽ được xem xét thưởng KPI cuối tháng.",
      new Date().toISOString()
    );
  }

  // Seed default providers
  const pCount = db.prepare("SELECT COUNT(*) as count FROM ai_providers").get() as { count: number };
  if (!pCount || pCount.count === 0) {
    const insertP = db.prepare(`
      INSERT INTO ai_providers (name, provider_type, api_key, api_url, default_model, task_assignment, temperature, max_tokens, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertP.run("Google Gemini AI", "gemini", "", "https://generativelanguage.googleapis.com", "gemini-2.5-flash", "all", 0.2, 4096, 1, now);
    insertP.run("OpenAI ChatGPT", "openai", "", "https://api.openai.com/v1", "gpt-4o", "drafting", 0.3, 4096, 1, now);
    insertP.run("Anthropic Claude", "claude", "", "https://api.anthropic.com/v1", "claude-3-5-sonnet-20241022", "summary", 0.2, 4096, 1, now);
    insertP.run("DeepSeek AI", "deepseek", "", "https://api.deepseek.com/v1", "deepseek-chat", "legal_search", 0.1, 4096, 1, now);
    insertP.run("OpenRouter Gateway", "openrouter", "", "https://openrouter.ai/api/v1", "google/gemini-2.5-flash", "all", 0.2, 4096, 1, now);
    insertP.run("Ollama Local GPU", "ollama", "LOCAL_GATEWAY", "http://localhost:11434/v1", "qwen2.5-coder:32b", "ocr", 0.1, 4096, 0, now);
  }

  // Auto-migrate legacy invalid model names (gemini-3.6-flash, gemini-3.0-flash) to gemini-2.5-flash
  try {
    db.prepare("UPDATE ai_providers SET default_model = 'gemini-2.5-flash' WHERE default_model LIKE '%gemini-3.%' OR default_model LIKE '%gemini-3.0%'").run();
    db.prepare("UPDATE ai_providers SET default_model = 'google/gemini-2.5-flash' WHERE default_model LIKE '%google/gemini-3.%'").run();
    db.prepare("UPDATE settings SET value = 'gemini-2.5-flash' WHERE key = 'ai_model' AND (value LIKE '%gemini-3.%' OR value = 'gemini-3.0-flash')").run();
  } catch (e) {}
} catch (e) {
  console.error("Initialization error in ai.routes.ts:", e);
}

export function normalizeModelName(modelName: string | undefined, providerType: string): string {
  if (!modelName) {
    return providerType === "openrouter" ? "google/gemini-2.5-flash" : "gemini-2.5-flash";
  }
  let m = modelName.trim();
  if (providerType === "gemini") {
    if (m.includes("3.6") || m.includes("3.0") || m.includes("3.5")) {
      return "gemini-2.5-flash";
    }
  }
  if (providerType === "openrouter") {
    if (m.includes("3.6") || m.includes("3.0")) {
      return "google/gemini-2.5-flash";
    }
  }
  return m;
}

// Helper: Query system tables
function executeSearchSystemData(query: string, targetTable: string): any[] {
  const searchTerm = `%${query}%`;
  try {
    switch (targetTable) {
      case "clients":
        return db.prepare("SELECT id, name, phone FROM clients WHERE name LIKE ? OR phone LIKE ? LIMIT 8").all(searchTerm, searchTerm);
      case "cases":
        return db.prepare("SELECT id, name, client, fee FROM cases WHERE name LIKE ? OR client LIKE ? LIMIT 8").all(searchTerm, searchTerm);
      case "court_schedule":
        return db.prepare("SELECT id, case_id, date, location, note FROM court_schedule WHERE location LIKE ? OR note LIKE ? LIMIT 8").all(searchTerm, searchTerm);
      case "tasks":
        return db.prepare("SELECT id, employee_id, title, deadline, status FROM tasks WHERE title LIKE ? LIMIT 8").all(searchTerm);
      case "employees":
        return db.prepare("SELECT id, name, position, salary FROM employees WHERE name LIKE ? OR position LIKE ? LIMIT 8").all(searchTerm, searchTerm);
      case "invoices":
        return db.prepare("SELECT id, client_id, case_id, amount, status, created FROM invoices WHERE status LIKE ? LIMIT 8").all(searchTerm);
      case "services":
        return db.prepare(`
          SELECT id, title, description, content, 'services' as source FROM services WHERE title LIKE ? OR content LIKE ?
          UNION
          SELECT id, title, description, content, 'legal_services' as source FROM legal_services WHERE title LIKE ? OR content LIKE ?
          LIMIT 8
        `).all(searchTerm, searchTerm, searchTerm, searchTerm);
      case "news":
        return db.prepare("SELECT id, title, excerpt, content, date FROM news WHERE title LIKE ? OR content LIKE ? LIMIT 8").all(searchTerm, searchTerm);
      case "erp_records":
        return db.prepare("SELECT id, data FROM erp_records WHERE id LIKE ? OR data LIKE ? LIMIT 8").all(searchTerm, searchTerm);
      default:
        return [];
    }
  } catch (err) {
    console.error(`Error searching table ${targetTable}:`, err);
    return [];
  }
}

// Helper: Query trained expert knowledge
function executeSearchTrainedKnowledge(query: string): any[] {
  const searchTerm = `%${query}%`;
  try {
    return db.prepare("SELECT id, topic, pattern, response FROM ai_training_data WHERE topic LIKE ? OR pattern LIKE ? OR response LIKE ? LIMIT 8")
      .all(searchTerm, searchTerm, searchTerm);
  } catch (err) {
    console.error("Error searching trained knowledge:", err);
    return [];
  }
}

// Helper: Query total stats
function executeGetSystemStatistics(): any {
  try {
    const clients = db.prepare("SELECT COUNT(*) as count FROM clients").get() as any;
    const cases = db.prepare("SELECT COUNT(*) as count FROM cases").get() as any;
    const employees = db.prepare("SELECT COUNT(*) as count FROM employees").get() as any;
    const tasks = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as any;
    const erpRecords = db.prepare("SELECT COUNT(*) as count FROM erp_records").get() as any;
    const trained = db.prepare("SELECT COUNT(*) as count FROM ai_training_data").get() as any;

    return {
      total_clients: clients?.count || 0,
      total_cases: cases?.count || 0,
      total_employees: employees?.count || 0,
      total_tasks: tasks?.count || 0,
      total_erp_records: erpRecords?.count || 0,
      total_trained_rules: trained?.count || 0,
      system_name: "Hệ thống Quản lý Ánh Dương Law ERP"
    };
  } catch (err) {
    console.error("Error getting system statistics:", err);
    return {};
  }
}

// Helper: Log execution metrics
function logAiCall(providerName: string, modelUsed: string, promptText: string, responseText: string, latencyMs: number, status: "success" | "error", errorMsg: string = "") {
  try {
    const stmt = db.prepare(`
      INSERT INTO ai_logs (provider_name, model_used, prompt_snippet, response_snippet, latency_ms, status, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      providerName,
      modelUsed,
      (promptText || "").slice(0, 200),
      (responseText || "").slice(0, 300),
      latencyMs,
      status,
      errorMsg.slice(0, 300),
      new Date().toISOString()
    );
  } catch (e) {
    console.warn("Could not write to ai_logs:", e);
  }
}

// GET /api/ai/training - List training data
router.get("/training", async (req, res) => {
  try {
    const items = db.prepare("SELECT * FROM ai_training_data ORDER BY id DESC").all();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch training data." });
  }
});

// POST /api/ai/training - Add new trained rule
router.post("/training", async (req, res) => {
  try {
    const { topic, pattern, response } = req.body;
    if (!topic || !pattern || !response) {
      return res.status(400).json({ error: "Missing required fields (topic, pattern, response)." });
    }
    const stmt = db.prepare("INSERT INTO ai_training_data (topic, pattern, response, created_at) VALUES (?, ?, ?, ?)");
    const result = stmt.run(topic, pattern, response, new Date().toISOString());
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to add training data." });
  }
});

// DELETE /api/ai/training/:id - Delete trained rule
router.delete("/training/:id", async (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM ai_training_data WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete training data." });
  }
});

// GET /api/ai/providers - List all configured AI Providers
router.get("/providers", async (req, res) => {
  try {
    const providers = db.prepare("SELECT * FROM ai_providers ORDER BY id ASC").all();
    res.json(providers);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch AI providers." });
  }
});

// POST /api/ai/providers - Add new AI Provider
router.post("/providers", async (req, res) => {
  try {
    const { name, provider_type, api_key, api_url, default_model, task_assignment, temperature, max_tokens, is_active } = req.body;
    if (!name || !provider_type) {
      return res.status(400).json({ error: "Tên nhà cung cấp và loại provider là bắt buộc." });
    }
    const stmt = db.prepare(`
      INSERT INTO ai_providers (name, provider_type, api_key, api_url, default_model, task_assignment, temperature, max_tokens, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const defaultUrl = provider_type === "openai" ? "https://api.openai.com/v1" 
      : provider_type === "claude" ? "https://api.anthropic.com/v1"
      : provider_type === "deepseek" ? "https://api.deepseek.com/v1"
      : provider_type === "openrouter" ? "https://openrouter.ai/api/v1"
      : provider_type === "ollama" ? "http://localhost:11434/v1"
      : "https://generativelanguage.googleapis.com";

    const defaultModel = provider_type === "openai" ? "gpt-4o"
      : provider_type === "claude" ? "claude-3-5-sonnet-20241022"
      : provider_type === "deepseek" ? "deepseek-chat"
      : provider_type === "openrouter" ? "google/gemini-2.5-flash"
      : provider_type === "ollama" ? "qwen2.5-coder:32b"
      : "gemini-2.5-flash";

    const result = stmt.run(
      name,
      provider_type,
      api_key || "",
      api_url || defaultUrl,
      default_model || defaultModel,
      task_assignment || "all",
      temperature !== undefined ? parseFloat(temperature) : 0.2,
      max_tokens ? parseInt(max_tokens, 10) : 4096,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      new Date().toISOString()
    );
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to add AI provider." });
  }
});

// PUT /api/ai/providers/:id - Update AI Provider
router.put("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, provider_type, api_key, api_url, default_model, task_assignment, temperature, max_tokens, is_active } = req.body;

    db.prepare(`
      UPDATE ai_providers
      SET name = ?, provider_type = ?, api_key = ?, api_url = ?, default_model = ?, task_assignment = ?, temperature = ?, max_tokens = ?, is_active = ?
      WHERE id = ?
    `).run(
      name,
      provider_type,
      api_key,
      api_url,
      default_model,
      task_assignment || "all",
      temperature !== undefined ? parseFloat(temperature) : 0.2,
      max_tokens ? parseInt(max_tokens, 10) : 4096,
      is_active ? 1 : 0,
      id
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update AI provider." });
  }
});

// DELETE /api/ai/providers/:id - Delete AI Provider
router.delete("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM ai_providers WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete AI provider." });
  }
});

// GET /api/ai/models - List synced models
router.get("/models", async (req, res) => {
  try {
    const models = db.prepare("SELECT * FROM ai_models ORDER BY provider ASC, name ASC").all();
    res.json(models);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch models catalog." });
  }
});

// POST /api/ai/models/sync - Dynamically fetch and sync models list from AI Provider
router.post("/models/sync", async (req, res) => {
  try {
    const { provider_type, api_key, api_url } = req.body;
    let fetchedModels: any[] = [];

    if (provider_type === "openrouter") {
      const url = "https://openrouter.ai/api/v1/models";
      const headers: any = {};
      if (api_key) headers["Authorization"] = `Bearer ${api_key}`;
      const resp = await fetch(url, { headers });
      if (resp.ok) {
        const data = await resp.json();
        if (data.data && Array.isArray(data.data)) {
          fetchedModels = data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            provider: "OpenRouter",
            context_window: `${m.context_length || 128000} Tokens`,
            input_cost: Number((m.pricing?.prompt || 0) * 1000000) || 0,
            output_cost: Number((m.pricing?.completion || 0) * 1000000) || 0,
            capabilities: ["tools", "json", "streaming"],
            enabled: true
          }));
        }
      }
    } else if (provider_type === "openai") {
      const baseUrl = api_url || "https://api.openai.com/v1";
      const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
        headers: { "Authorization": `Bearer ${api_key}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.data && Array.isArray(data.data)) {
          fetchedModels = data.data
            .filter((m: any) => m.id.includes("gpt") || m.id.includes("o1") || m.id.includes("o3"))
            .map((m: any) => ({
              id: m.id,
              name: `OpenAI ${m.id}`,
              provider: "OpenAI",
              context_window: "128,000 Tokens",
              input_cost: 2.50,
              output_cost: 10.00,
              capabilities: ["vision", "tools", "json", "streaming"],
              enabled: true
            }));
        }
      }
    } else if (provider_type === "gemini") {
      const keyToUse = api_key || process.env.GEMINI_API_KEY;
      if (keyToUse) {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToUse}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.models && Array.isArray(data.models)) {
            fetchedModels = data.models.map((m: any) => {
              const cleanId = m.name.replace("models/", "");
              return {
                id: cleanId,
                name: m.displayName || cleanId,
                provider: "Google Gemini",
                context_window: `${m.inputTokenLimit || 1000000} Tokens`,
                input_cost: 0.075,
                output_cost: 0.30,
                capabilities: ["vision", "ocr", "reasoning", "tools", "json", "streaming"],
                enabled: true
              };
            });
          }
        }
      }
    } else if (provider_type === "deepseek") {
      fetchedModels = [
        { id: "deepseek-chat", name: "DeepSeek V3", provider: "DeepSeek AI", context_window: "128,000 Tokens", input_cost: 0.14, output_cost: 0.28, capabilities: ["tools", "json", "streaming"], enabled: true },
        { id: "deepseek-reasoner", name: "DeepSeek R1 (Thinking)", provider: "DeepSeek AI", context_window: "128,000 Tokens", input_cost: 0.55, output_cost: 2.19, capabilities: ["reasoning", "thinking", "json"], enabled: true }
      ];
    } else if (provider_type === "claude") {
      fetchedModels = [
        { id: "claude-3-5-sonnet-20241022", name: "Anthropic Claude 3.5 Sonnet", provider: "Anthropic", context_window: "200,000 Tokens", input_cost: 3.00, output_cost: 15.00, capabilities: ["vision", "ocr", "reasoning", "tools"], enabled: true },
        { id: "claude-3-5-haiku-20241022", name: "Anthropic Claude 3.5 Haiku", provider: "Anthropic", context_window: "200,000 Tokens", input_cost: 0.80, output_cost: 4.00, capabilities: ["tools", "json", "streaming"], enabled: true }
      ];
    }

    if (fetchedModels.length > 0) {
      const upsert = db.prepare(`
        INSERT OR REPLACE INTO ai_models (id, name, provider, context_window, input_cost, output_cost, capabilities, enabled, assigned_task)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const m of fetchedModels) {
        upsert.run(
          m.id,
          m.name,
          m.provider,
          m.context_window,
          m.input_cost,
          m.output_cost,
          JSON.stringify(m.capabilities),
          1,
          "Tất cả nghiệp vụ"
        );
      }
    }

    res.json({ success: true, count: fetchedModels.length, models: fetchedModels });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to sync models." });
  }
});

// POST /api/ai/providers/test - Test connection to AI API Key
router.post("/providers/test", async (req, res) => {
  const startTime = Date.now();
  try {
    const { provider_type, api_key, api_url, default_model } = req.body;
    if (!api_key && provider_type !== "gemini") {
      return res.status(400).json({ success: false, message: "Vui lòng nhập API Key để kiểm tra kết nối." });
    }

    if (provider_type === "gemini" || !provider_type) {
      const keyToUse = api_key || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({ success: false, message: "Chưa cấu hình Gemini API Key." });
      }
      const testAi = new GoogleGenAI({ apiKey: keyToUse });
      const testModel = normalizeModelName(default_model, "gemini");
      const resp = await testAi.models.generateContent({
        model: testModel,
        contents: "Ping"
      });
      const latency = Date.now() - startTime;
      if (resp && resp.text) {
        logAiCall(provider_type, testModel, "Ping", resp.text, latency, "success");
        return res.json({ success: true, latency_ms: latency, message: `Kết nối thành công tới Gemini (${testModel})! [${latency}ms]` });
      }
    } else if (provider_type === "openrouter") {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const testModel = normalizeModelName(default_model, "openrouter");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${api_key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: "user", content: "Ping" }],
          max_tokens: 10
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        logAiCall("OpenRouter", default_model || "openrouter", "Ping", "OK", latency, "success");
        return res.json({ success: true, latency_ms: latency, message: `Kết nối thành công tới OpenRouter Gateway! [${latency}ms]` });
      } else {
        const errData = await response.text();
        logAiCall("OpenRouter", default_model || "openrouter", "Ping", "", latency, "error", errData);
        return res.status(400).json({ success: false, message: `Lỗi kết nối OpenRouter (${response.status}): ${errData.slice(0, 150)}` });
      }
    } else if (provider_type === "openai" || provider_type === "deepseek" || provider_type === "custom" || provider_type === "ollama") {
      const baseUrl = api_url || (provider_type === "openai" ? "https://api.openai.com/v1" : provider_type === "deepseek" ? "https://api.deepseek.com/v1" : "http://localhost:11434/v1");
      const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${api_key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: default_model || (provider_type === "openai" ? "gpt-4o" : "deepseek-chat"),
          messages: [{ role: "user", content: "Ping" }],
          max_tokens: 10
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        logAiCall(provider_type, default_model || "default", "Ping", "OK", latency, "success");
        return res.json({ success: true, latency_ms: latency, message: `Kết nối thành công tới ${provider_type.toUpperCase()} Gateway! [${latency}ms]` });
      } else {
        const errData = await response.text();
        logAiCall(provider_type, default_model || "default", "Ping", "", latency, "error", errData);
        return res.status(400).json({ success: false, message: `Lỗi kết nối (${response.status}): ${errData.slice(0, 150)}` });
      }
    } else if (provider_type === "claude") {
      const baseUrl = api_url || "https://api.anthropic.com/v1";
      const url = `${baseUrl.replace(/\/$/, "")}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": api_key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: default_model || "claude-3-5-sonnet-20241022",
          messages: [{ role: "user", content: "Ping" }],
          max_tokens: 10
        })
      });
      const latency = Date.now() - startTime;
      if (response.ok) {
        logAiCall("Claude", default_model || "claude-3-5-sonnet", "Ping", "OK", latency, "success");
        return res.json({ success: true, latency_ms: latency, message: `Kết nối thành công tới Anthropic Claude API! [${latency}ms]` });
      } else {
        const errData = await response.text();
        logAiCall("Claude", default_model || "claude-3-5-sonnet", "Ping", "", latency, "error", errData);
        return res.status(400).json({ success: false, message: `Lỗi kết nối Claude (${response.status}): ${errData.slice(0, 150)}` });
      }
    }

    return res.json({ success: true, message: "Kiểm tra cấu hình hoàn tất." });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message || "Lỗi kiểm tra kết nối API." });
  }
});

// Helper to get ALL active AI provider candidates for failover
export function getAllCandidateAiProviders(taskType: string = "all", customApiKey?: string, customProviderType?: string) {
  const candidates: any[] = [];

  // Priority 0: User passed custom API Key in request body
  if (customApiKey && customApiKey.trim() !== "") {
    const cleanKey = customApiKey.trim();
    let providerType = customProviderType;
    if (!providerType) {
      if (cleanKey.startsWith("sk-or-")) providerType = "openrouter";
      else if (cleanKey.startsWith("sk-")) providerType = "openai";
      else providerType = "gemini";
    }

    const apiUrl = providerType === "openai" ? "https://api.openai.com/v1"
      : providerType === "claude" ? "https://api.anthropic.com/v1"
      : providerType === "deepseek" ? "https://api.deepseek.com/v1"
      : providerType === "openrouter" ? "https://openrouter.ai/api/v1"
      : "https://generativelanguage.googleapis.com";

    const defaultModel = providerType === "openai" ? "gpt-4o"
      : providerType === "claude" ? "claude-3-5-sonnet-20241022"
      : providerType === "deepseek" ? "deepseek-chat"
      : providerType === "openrouter" ? "google/gemini-2.5-flash"
      : "gemini-2.5-flash";

    candidates.push({
      id: -1,
      name: `User Custom (${providerType})`,
      provider_type: providerType,
      api_key: cleanKey,
      api_url: apiUrl,
      default_model: defaultModel,
      temperature: 0.2,
      max_tokens: 4096,
      is_active: 1
    });

    // Save to settings
    try {
      const exists = db.prepare("SELECT id FROM settings WHERE key = 'ai_api_key'").get();
      if (exists) {
        db.prepare("UPDATE settings SET value = ? WHERE key = 'ai_api_key'").run(cleanKey);
      } else {
        db.prepare("INSERT INTO settings (key, value) VALUES ('ai_api_key', ?)").run(cleanKey);
      }
      if (providerType) {
        const pExists = db.prepare("SELECT id FROM settings WHERE key = 'ai_provider'").get();
        if (pExists) {
          db.prepare("UPDATE settings SET value = ? WHERE key = 'ai_provider'").run(providerType);
        } else {
          db.prepare("INSERT INTO settings (key, value) VALUES ('ai_provider', ?)").run(providerType);
        }
      }
    } catch (e) {}
  }

  // Priority 1: DB active providers in ai_providers table
  try {
    const activeProviders = db.prepare("SELECT * FROM ai_providers WHERE is_active = 1 ORDER BY id ASC").all() as any[];
    if (activeProviders && activeProviders.length > 0) {
      for (const p of activeProviders) {
        if (p.api_key && p.api_key.trim() !== "") {
          candidates.push(p);
        }
      }
    }
  } catch (e) {
    console.error("Error fetching ai_providers:", e);
  }

  // Priority 2: Custom Key in settings table
  try {
    const apiKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'ai_api_key'").get() as any;
    const modelRow = db.prepare("SELECT value FROM settings WHERE key = 'ai_model'").get() as any;
    const providerRow = db.prepare("SELECT value FROM settings WHERE key = 'ai_provider'").get() as any;
    if (apiKeyRow && apiKeyRow.value && apiKeyRow.value.trim() !== "") {
      const k = apiKeyRow.value.trim();
      if (!candidates.some(c => c.api_key === k)) {
        const pType = providerRow?.value || (k.startsWith("sk-or-") ? "openrouter" : k.startsWith("sk-") ? "openai" : "gemini");
        candidates.push({
          id: 0,
          name: `Settings Key (${pType})`,
          provider_type: pType,
          api_key: k,
          api_url: pType === "openai" ? "https://api.openai.com/v1" : pType === "claude" ? "https://api.anthropic.com/v1" : pType === "openrouter" ? "https://openrouter.ai/api/v1" : "https://generativelanguage.googleapis.com",
          default_model: modelRow?.value || (pType === "openai" ? "gpt-4o" : pType === "openrouter" ? "google/gemini-2.5-flash" : "gemini-2.5-flash"),
          temperature: 0.2,
          max_tokens: 4096,
          is_active: 1
        });
      }
    }
  } catch (e) {}

  // Priority 3: Default Environment Key
  let defaultKey = process.env.GEMINI_API_KEY;
  if (defaultKey === 'MY_GEMINI_API_KEY' || defaultKey === 'dummy' || defaultKey === 'your_api_key_here') {
    defaultKey = undefined;
  }
  if (defaultKey && !candidates.some(c => c.api_key === defaultKey)) {
    candidates.push({
      id: 999,
      name: "Default Gemini",
      provider_type: "gemini",
      api_key: defaultKey,
      api_url: "https://generativelanguage.googleapis.com",
      default_model: "gemini-2.5-flash",
      temperature: 0.2,
      max_tokens: 4096,
      is_active: 1
    });
  }

  return candidates;
}

export function getResolvedAiProvider(taskType: string = "all") {
  const candidates = getAllCandidateAiProviders(taskType);
  return candidates[0] || {
    id: 0,
    name: "Default Gemini",
    provider_type: "gemini",
    api_key: "",
    api_url: "https://generativelanguage.googleapis.com",
    default_model: "gemini-2.5-flash",
    temperature: 0.2,
    max_tokens: 4096,
    is_active: 1
  };
}

// MAIN POST /api/ai/ask - Multi-Provider AI Gateway with Automatic Failover
router.post("/ask", async (req, res) => {
  const startTime = Date.now();
  try {
    const { prompt, files, enableSearchGrounding, customApiKey, customProviderType } = req.body;
    const candidates = getAllCandidateAiProviders("all", customApiKey, customProviderType);

    if (candidates.length === 0) {
      return res.status(400).json({
        error: "Chưa cấu hình API Key cho AI. Vui lòng dán API Key của bạn để sử dụng ngay.",
        needApiKeyPrompt: true
      });
    }

    let lastError: any = null;

    for (let i = 0; i < candidates.length; i++) {
      const provider = candidates[i];
      const pStart = Date.now();
      console.log(`Trying AI Candidate [${i + 1}/${candidates.length}]: ${provider.name} (${provider.provider_type})`);

      try {
        // 1. OpenAI / DeepSeek / OpenRouter / Custom / Ollama Execution
        if (["openai", "deepseek", "openrouter", "custom", "ollama"].includes(provider.provider_type)) {
          const baseUrl = provider.api_url || (provider.provider_type === "openai" ? "https://api.openai.com/v1" : provider.provider_type === "deepseek" ? "https://api.deepseek.com/v1" : provider.provider_type === "openrouter" ? "https://openrouter.ai/api/v1" : "http://localhost:11434/v1");
          const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
          const systemInstruction = "Bạn là Trợ lý AI Siêu việt của Ánh Dương Law. Trả lời chính xác, chuyên nghiệp bằng Tiếng Việt dựa trên thông tin được cung cấp.";

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${provider.api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: provider.default_model || (provider.provider_type === "openai" ? "gpt-4o" : provider.provider_type === "openrouter" ? "google/gemini-2.5-flash" : "deepseek-chat"),
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt || "Xin chào!" }
              ],
              temperature: provider.temperature || 0.2,
              max_tokens: provider.max_tokens || 4096
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API ${provider.name} (${response.status}): ${errText}`);
          }

          const data = await response.json();
          const responseText = data.choices?.[0]?.message?.content || "Khởi tạo phản hồi từ AI không thành công.";
          const latency = Date.now() - pStart;
          logAiCall(provider.name, provider.default_model, prompt, responseText, latency, "success");
          return res.json({ text: responseText, providerUsed: provider.name });
        }

        // 2. Anthropic Claude Execution
        if (provider.provider_type === "claude") {
          const baseUrl = provider.api_url || "https://api.anthropic.com/v1";
          const url = `${baseUrl.replace(/\/$/, "")}/messages`;
          const systemInstruction = "Bạn là Trợ lý AI Siêu việt của Ánh Dương Law. Trả lời chính xác, chuyên nghiệp bằng Tiếng Việt dựa trên thông tin được cung cấp.";

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "x-api-key": provider.api_key,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: provider.default_model || "claude-3-5-sonnet-20241022",
              system: systemInstruction,
              messages: [{ role: "user", content: prompt || "Xin chào!" }],
              max_tokens: provider.max_tokens || 4096
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Claude (${response.status}): ${errText}`);
          }

          const data = await response.json();
          const responseText = data.content?.[0]?.text || "Khởi tạo phản hồi từ Claude không thành công.";
          const latency = Date.now() - pStart;
          logAiCall(provider.name, provider.default_model, prompt, responseText, latency, "success");
          return res.json({ text: responseText, providerUsed: provider.name });
        }

        // 3. Google Gemini Execution (Robust, Compliant Gemini Call)
        let apiKeyToUse = provider.api_key || process.env.GEMINI_API_KEY;
        if (apiKeyToUse === 'MY_GEMINI_API_KEY' || apiKeyToUse === 'dummy' || apiKeyToUse === 'your_api_key_here') {
          apiKeyToUse = undefined;
        }

        if (!apiKeyToUse) {
          throw new Error("Gemini API key is empty.");
        }

        const ai = new GoogleGenAI({
          apiKey: apiKeyToUse,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        // Function Declarations
        const searchSystemDataTool: FunctionDeclaration = {
          name: "search_system_data",
          description: "Tìm kiếm thông tin thực tế trong các bảng dữ liệu của hệ thống ERP Ánh Dương Law (như khách hàng, lịch tòa, vụ việc, nhân sự, hóa đơn, dịch vụ, tin tức, tài liệu ERP).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Từ khóa cần tìm kiếm." },
              targetTable: { type: Type.STRING, description: "Tên bảng dữ liệu đích: 'clients', 'cases', 'court_schedule', 'tasks', 'employees', 'invoices', 'services', 'news', 'erp_records'." }
            },
            required: ["query", "targetTable"]
          }
        };

        const searchTrainedKnowledgeTool: FunctionDeclaration = {
          name: "search_trained_knowledge",
          description: "Tra cứu kiến thức pháp lý đặc thù, quy trình nghiệp vụ hoặc hướng dẫn vận hành nội bộ đã được người dùng huấn luyện.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Chủ đề cần tra cứu kiến thức đã huấn luyện." }
            },
            required: ["query"]
          }
        };

        const getSystemStatisticsTool: FunctionDeclaration = {
          name: "get_system_statistics",
          description: "Lấy báo cáo số liệu thống kê tổng thể hiện tại của văn phòng luật.",
          parameters: {
            type: Type.OBJECT,
            properties: {}
          }
        };

        const generateLegalDocumentTool: FunctionDeclaration = {
          name: "generate_legal_document",
          description: "Tạo dự thảo văn bản pháp lý mới dựa trên thông tin khách hàng.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tiêu đề của văn bản pháp lý." },
              documentType: { type: Type.STRING, description: "Loại văn bản: 'Hợp đồng', 'Đơn khởi kiện', 'Di chúc'." },
              clientName: { type: Type.STRING, description: "Tên khách hàng." },
              content: { type: Type.STRING, description: "Nội dung chi tiết dự thảo." }
            },
            required: ["title", "documentType", "clientName", "content"]
          }
        };

        const updateRecordStatusTool: FunctionDeclaration = {
          name: "update_record_status",
          description: "Cập nhật trạng thái của nhiệm vụ hoặc hồ sơ vụ việc.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              targetType: { type: Type.STRING, description: "'tasks' hoặc 'erp_records'." },
              targetId: { type: Type.STRING, description: "Mã ID đối tượng." },
              status: { type: Type.STRING, description: "'completed', 'pending', 'processing'." }
            },
            required: ["targetType", "targetId", "status"]
          }
        };

        const searchAgentMemoryTool: FunctionDeclaration = {
          name: "search_agent_memory",
          description: "Truy xuất bộ nhớ nhận thức dài hạn và kinh nghiệm của AI Agent (TencentDB/Mem0 Memory Engine) theo điểm số nhận thức tương đồng, mức độ quan trọng và độ tươi mới.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Từ khóa hoặc câu hỏi cần tra cứu ký ức." },
              memory_type: { type: Type.STRING, description: "Loại ký ức: 'semantic', 'episodic', 'user_preference', 'case_insight', 'client_fact', 'decision_pattern'." },
              entity_id: { type: Type.STRING, description: "Mã định danh thực thể (Mã vụ án, Mã khách hàng)." }
            },
            required: ["query"]
          }
        };

        const storeAgentMemoryTool: FunctionDeclaration = {
          name: "store_agent_memory",
          description: "Ghi nhớ một sở thích người dùng, quy tắc pháp lý, sự kiện vụ án hoặc kinh nghiệm nghiệp vụ vào bộ nhớ dài hạn của AI.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tiêu đề ngắn gọn của mẩu ký ức." },
              content: { type: Type.STRING, description: "Nội dung chi tiết của ký ức." },
              memory_type: { type: Type.STRING, description: "Loại ký ức: 'user_preference', 'case_insight', 'client_fact', 'decision_pattern', 'semantic'." },
              entity_id: { type: Type.STRING, description: "Mã vụ án hoặc mã khách hàng liên quan nếu có." },
              importance_score: { type: Type.NUMBER, description: "Độ quan trọng từ 0.1 đến 1.0." }
            },
            required: ["title", "content"]
          }
        };

        const executeUnifiedMcpToolDecl: FunctionDeclaration = {
          name: "execute_unified_mcp_tool",
          description: "Gọi công cụ MCP Unified Gateway (CASE, CLIENT, LEGAL, MEMORY, TASK, IOT, SYSTEM, CALL, FINANCE, HR) có kiểm soát phân quyền RBAC và ghi Audit Log.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              toolName: {
                type: Type.STRING,
                description: "Tên công cụ MCP cần gọi: search_cases, get_case, search_clients, get_client, search_laws, search_judgments, search_precedents, search_memories, store_memory, get_case_memory, consolidate_memories, get_system_status, get_mcp_tools, hoặc bất kỳ công cụ IoT (discover_devices, get_device, set_relay, get_sensor_data, diagnose_device...)."
              },
              args: {
                type: Type.OBJECT,
                description: "Tham số truyền vào cho công cụ MCP dạng JSON object."
              }
            },
            required: ["toolName"]
          }
        };

        const executeMcpIotTool: FunctionDeclaration = {
          name: "execute_mcp_iot_tool",
          description: "Gọi một công cụ Model Context Protocol (MCP) để thao tác hoặc truy vấn thiết bị IoT ESP. Tất cả hành động điều khiển, kiểm tra trạng thái, đọc cảm biến, chẩn đoán lỗi, hay cấu hình đều phải qua công cụ này.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              toolName: {
                type: Type.STRING,
                description: "Tên công cụ MCP cần chạy. Danh sách: discover_devices, get_device (args: {device_id}), register_device (args: {device_id, name, model, mac_address, ip_address, location, confirmed: true}), update_device, remove_device, get_device_status (args: {device_id}), ping_device (args: {device_id}), get_device_config (args: {device_id}), configure_device, configure_gpio (args: {device_id, pin, type, name, mode}), get_gpio_config (args: {device_id}), get_relay_status (args: {device_id, pin}), set_relay (args: {device_id, pin, state: 'ON'|'OFF'}), toggle_relay (args: {device_id, pin}), get_sensor_data (args: {device_id, pin}), get_sensor_status (args: {device_id, pin}), configure_sensor, get_mqtt_status, configure_mqtt, test_mqtt_connection, diagnose_device (args: {device_id}), get_device_health (args: {device_id}), get_device_logs (args: {device_id, limit}), restart_device (args: {device_id, confirmed: true}), get_firmware_version, check_firmware_update, update_firmware (args: {device_id, target_version, confirmed: true}), rollback_firmware, create_automation, update_automation, delete_automation, get_automations"
              },
              args: {
                type: Type.OBJECT,
                description: "Tham số truyền vào cho công cụ MCP dạng JSON object. Chú ý các hành động nguy hiểm như restart_device, register_device, update_firmware phải truyền confirmed: true nếu người dùng đã xác nhận."
              }
            },
            required: ["toolName"]
          }
        };

        // Note: For Gemini 2.5 Flash, do NOT mix googleSearch grounding tool with functionDeclarations to avoid 'Tool call context circulation' error.
        const tools: any[] = [
          {
            functionDeclarations: [
              searchSystemDataTool,
              searchTrainedKnowledgeTool,
              searchAgentMemoryTool,
              storeAgentMemoryTool,
              executeUnifiedMcpToolDecl,
              getSystemStatisticsTool,
              generateLegalDocumentTool,
              updateRecordStatusTool,
              executeMcpIotTool
            ]
          }
        ];

        const sessionUserEmail = (req as any).session?.user?.email || "system";
        const memoryContext = AgentMemoryService.buildMemoryContext(prompt || "", sessionUserEmail);

        const parts: any[] = [];
        if (memoryContext) {
          parts.push({ text: memoryContext });
        }
        if (prompt && prompt.trim() !== "") {
          parts.push({ text: prompt });
        }
        if (files && files.length > 0) {
          for (const f of files) {
            parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
          }
        }
        if (parts.length === 0) {
          parts.push({ text: "Xin chào, bạn có thể giúp gì cho tôi?" });
        }

        const systemInstruction =
          "Bạn là Trợ lý AI Siêu việt thế hệ mới của Công ty Luật Ánh Dương Law (Legal OS AI Copilot).\n" +
          "Hệ thống tích hợp Bộ nhớ Nhận thức Dài hạn (TencentDB/Mem0 Agent Memory) và MCP Gateway toàn diện.\n" +
          "Hãy trả lời thông minh, chuẩn mực, viện dẫn chính xác căn cứ pháp lý bằng Tiếng Việt dựa trên dữ liệu hệ thống ERP, tri thức pháp luật và bộ nhớ kinh nghiệm.";

        const contents: any[] = [{ role: "user", parts: parts }];
        const modelToUse = normalizeModelName(provider.default_model, provider.provider_type);

        const result = await ai.models.generateContent({
          model: modelToUse,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            tools: tools
          }
        });

        let finalResponseText = result.text || "";
        const functionCalls = result.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
          const toolParts: any[] = [];

          for (const call of functionCalls) {
            let results: any = null;
            const callArgs = call.args as any;

            if (call.name === "search_system_data") {
              results = executeSearchSystemData(callArgs.query || "", callArgs.targetTable || "");
            } else if (call.name === "search_trained_knowledge") {
              results = executeSearchTrainedKnowledge(callArgs.query || "");
            } else if (call.name === "get_system_statistics") {
              results = executeGetSystemStatistics();
            } else if (call.name === "generate_legal_document") {
              try {
                const stmt = db.prepare(`
                  INSERT INTO legal_documents (title, document_number, issue_date, effective_date, agency, signer, content, status, category, summary, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                const docNumber = "AI-" + Math.floor(100000 + Math.random() * 900000);
                const issueDate = new Date().toISOString().split("T")[0];
                const resDoc = stmt.run(
                  callArgs.title,
                  docNumber,
                  issueDate,
                  issueDate,
                  "Ánh Dương Law AI",
                  callArgs.clientName,
                  callArgs.content,
                  "Nháp",
                  callArgs.documentType,
                  `Văn bản dự thảo được tạo tự động bởi Trợ lý AI cho khách hàng ${callArgs.clientName}.`,
                  new Date().toISOString()
                );

                results = {
                  success: true,
                  document_id: resDoc.lastInsertRowid,
                  document_number: docNumber,
                  title: callArgs.title,
                  message: `Đã tạo thành công dự thảo văn bản pháp lý "${callArgs.title}" với mã số ${docNumber}.`
                };
              } catch (e: any) {
                results = { success: false, error: e.message };
              }
            } else if (call.name === "update_record_status") {
              try {
                const table = callArgs.targetType;
                let rowsAffected = 0;
                if (table === "tasks") {
                  const resTasks = db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(callArgs.status, callArgs.targetId);
                  rowsAffected = resTasks.changes;
                } else if (table === "erp_records") {
                  const record = db.prepare("SELECT data FROM erp_records WHERE id = ?").get(callArgs.targetId) as { data: string } | undefined;
                  if (record) {
                    const dataObj = JSON.parse(record.data);
                    dataObj.status = callArgs.status;
                    const resRec = db.prepare("UPDATE erp_records SET data = ? WHERE id = ?").run(JSON.stringify(dataObj), callArgs.targetId);
                    rowsAffected = resRec.changes;
                  }
                }
                results = {
                  success: rowsAffected > 0,
                  message: rowsAffected > 0
                    ? `Đã cập nhật trạng thái của ${table} (${callArgs.targetId}) thành "${callArgs.status}".`
                    : `Không tìm thấy bản ghi có ID "${callArgs.targetId}".`
                };
              } catch (e: any) {
                results = { success: false, error: e.message };
              }
            } else if (call.name === "search_agent_memory") {
              try {
                const sessionUser = (req as any).session?.user?.email || "system";
                const recalled = AgentMemoryService.recallMemories({
                  query: callArgs.query || "",
                  user_email: sessionUser,
                  memory_types: callArgs.memory_type ? [callArgs.memory_type] : undefined,
                  entity_id: callArgs.entity_id,
                  limit: 5
                });
                results = {
                  success: true,
                  count: recalled.length,
                  memories: recalled.map(r => ({
                    id: r.memory.id,
                    title: r.memory.title,
                    content: r.memory.content,
                    summary: r.memory.summary,
                    type: r.memory.memory_type,
                    importance: r.importanceScore,
                    score: r.score
                  }))
                };
              } catch (e: any) {
                results = { success: false, error: e.message };
              }
            } else if (call.name === "store_agent_memory") {
              try {
                const sessionUser = (req as any).session?.user?.email || "system";
                results = AgentMemoryService.storeMemory({
                  user_email: sessionUser,
                  title: callArgs.title,
                  content: callArgs.content,
                  memory_type: callArgs.memory_type || "user_preference",
                  entity_id: callArgs.entity_id || null,
                  importance_score: callArgs.importance_score
                });
              } catch (e: any) {
                results = { success: false, error: e.message };
              }
            } else if (call.name === "execute_unified_mcp_tool") {
              try {
                const sessionUser = (req as any).session?.user || { email: "system@anhduonglaw.vn", role: "admin" };
                results = await executeUnifiedMcpTool(callArgs.toolName, callArgs.args || {}, {
                  userEmail: sessionUser.email || "system",
                  userRole: sessionUser.role || "admin"
                });
              } catch (e: any) {
                results = { success: false, error: e.message };
              }
            } else if (call.name === "execute_mcp_iot_tool") {
              try {
                const sessionUser = (req as any).session?.user || { email: "anonymous@anhduonglaw.vn", role: "specialist" };
                const user = {
                  email: sessionUser.email,
                  role: sessionUser.role || "specialist"
                };
                const { executeMcpTool } = await import("../iot/mcp.server");
                results = await executeMcpTool(callArgs.toolName, callArgs.args || {}, user);
              } catch (e: any) {
                results = { success: false, error: e.message };
              }
            }

            toolParts.push({
              functionResponse: {
                name: call.name,
                response: { results: results }
              }
            });
          }

          const modelContent = result.candidates?.[0]?.content;
          if (modelContent) {
            contents.push(modelContent);
          }
          contents.push({ role: "user", parts: toolParts });

          const secondResult = await ai.models.generateContent({
            model: modelToUse,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              tools: tools
            }
          });

          finalResponseText = secondResult.text || "";
        }

        const latency = Date.now() - pStart;
        logAiCall(provider.name, modelToUse, prompt, finalResponseText, latency, "success");
        return res.json({ text: finalResponseText, providerUsed: provider.name });

      } catch (err: any) {
        const latency = Date.now() - pStart;
        console.warn(`Candidate [${provider.name}] failed (${latency}ms):`, err.message || err);
        logAiCall(provider.name, provider.default_model || "gemini-2.5-flash", prompt, "", latency, "error", err.message || String(err));
        lastError = err;
      }
    }

    console.error("All AI candidates failed. Last error:", lastError);
    const errString = lastError ? (lastError.message || String(lastError)) : "";
    const isQuota = errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED') || errString.includes('Quota exceeded');

    return res.status(429).json({
      error: isQuota
        ? "Lỗi 429 Quota Exceeded (Các API Key hiện tại đều đã hết hạn ngạch/dung lượng). Vui lòng nhập API Key cá nhân của bạn để sửung ngay tức thì."
        : `Lỗi kết nối AI Gateway: ${errString}. Vui lòng nhập API Key mới để tiếp tục.`,
      quotaExceeded: true,
      needApiKeyPrompt: true
    });

  } catch (error: any) {
    console.error("AI Route Global Error:", error);
    res.status(500).json({
      error: error.message || "Lỗi khi xử lý với AI.",
      needApiKeyPrompt: true
    });
  }
});

// ================= AI DATA FORMULATOR ENDPOINT =================
router.post("/data-formulator/formulate", async (req: any, res: any) => {
  try {
    const { dataset, instruction, custom_api_key } = req.body;
    if (!dataset || !Array.isArray(dataset)) {
      return res.status(400).json({ error: "Yêu cầu cung cấp bộ dữ liệu (dataset) hợp lệ dạng danh sách." });
    }
    if (!instruction || typeof instruction !== "string") {
      return res.status(400).json({ error: "Yêu cầu cung cấp chỉ thị phân tích (instruction) bằng lời nói tự nhiên." });
    }

    const apiKeyToUse = custom_api_key || process.env.GEMINI_API_KEY;
    if (!apiKeyToUse) {
      return res.status(400).json({ 
        error: "Vui lòng cấu hình GEMINI_API_KEY trong Settings hoặc nhập mã khóa cá nhân." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKeyToUse,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `Bạn là một Chuyên gia Phân tích Dữ liệu AI cao cấp tích hợp trong Legal OS.
Nhiệm vụ của bạn là nhận bộ dữ liệu đầu vào (dataset) và một chỉ thị phân tích dữ liệu bằng ngôn ngữ tự nhiên từ người dùng.
Hãy phân tích, biến đổi, gom nhóm (group by), tính tổng (sum), tính trung bình (average) hoặc đếm (count) bộ dữ liệu đó thành định dạng phù hợp nhất để vẽ biểu đồ và trả về kết quả dạng JSON khớp hoàn hảo với cấu trúc yêu cầu.

Yêu cầu quy tắc biểu đồ:
- chartType phải là một trong các giá trị: 'bar', 'line', 'pie', 'area', 'scatter'.
- yAxisKeys chứa các cột số liệu đã được tổng hợp (ví dụ: ['revenue', 'count'] hoặc ['value']).
- Cột giá trị trong 'data' phải là số thực hoặc số nguyên thực tế, không để dạng chuỗi nếu nó là chỉ số đo lường.
- xAxisKey là cột định danh phân loại hoặc mốc thời gian trên trục hoành.
- title là tiêu đề biểu đồ súc tích, chuyên nghiệp bằng tiếng Việt.
- insight là 1-2 câu nhận xét sâu sắc về xu hướng dữ liệu bằng tiếng Việt.`;

    const userPrompt = `Dữ liệu gốc (dataset):
${JSON.stringify(dataset.slice(0, 500), null, 2)}

Chỉ thị phân tích từ người dùng:
"${instruction}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: {
              type: Type.STRING,
              description: "Mô tả ngắn gọn tư duy xử lý và lý do chọn loại biểu đồ."
            },
            chartType: {
              type: Type.STRING,
              description: "Loại biểu đồ khuyên dùng. Chỉ được chọn một trong: 'bar', 'line', 'pie', 'area', 'scatter'."
            },
            title: {
              type: Type.STRING,
              description: "Tiêu đề biểu đồ tiếng Việt chuyên nghiệp."
            },
            xAxisKey: {
              type: Type.STRING,
              description: "Tên thuộc tính trong mảng 'data' đại diện cho trục hoành (ví dụ: 'practice_area' hoặc 'status')."
            },
            yAxisKeys: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách tên thuộc tính số liệu đại diện cho trục tung (ví dụ: ['revenue'] hoặc ['value', 'count'])."
            },
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                description: "Dữ liệu sau khi gom nhóm, tính toán tổng hợp."
              },
              description: "Danh sách các bản ghi số liệu đã tổng hợp để đưa vào biểu đồ."
            },
            insight: {
              type: Type.STRING,
              description: "Nhận xét phân tích chuyên môn (1-2 câu tiếng Việt) từ dữ liệu đã tổng hợp."
            }
          },
          required: ["reasoning", "chartType", "title", "xAxisKey", "yAxisKeys", "data", "insight"]
        }
      }
    });

    const text = response.text || "{}";
    const parsedResponse = JSON.parse(text.trim());
    res.json({ success: true, ...parsedResponse });
  } catch (err: any) {
    console.error("[Data Formulator API Error]:", err);
    res.status(500).json({ success: false, error: err.message || "Lỗi xử lý phân tích dữ liệu AI." });
  }
});

export default router;
