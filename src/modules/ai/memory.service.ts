import db from "../../db/database";

export interface MemoryItem {
  id?: number;
  user_email: string;
  memory_type: 'semantic' | 'episodic' | 'user_preference' | 'case_insight' | 'client_fact' | 'decision_pattern' | 'working';
  category?: string;
  title: string;
  content: string;
  summary?: string;
  entity_type?: 'CLIENT' | 'CASE' | 'LAWYER' | 'LAW' | 'DOCUMENT' | 'USER' | 'SYSTEM';
  entity_id?: string;
  importance_score?: number; // 0.0 - 1.0
  confidence_score?: number; // 0.0 - 1.0
  access_count?: number;
  last_accessed_at?: string;
  status?: 'active' | 'archived' | 'consolidated';
  source_session?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface MemoryEntity {
  id?: number;
  entity_name: string;
  entity_type: 'PERSON' | 'ORGANIZATION' | 'CASE' | 'LAW' | 'CONTRACT' | 'LOCATION';
  description?: string;
  attributes?: Record<string, any>;
  relations?: Array<{ target: string; relation: string; weight: number }>;
  updated_at?: string;
}

export interface RecallOptions {
  query: string;
  user_email?: string;
  entity_type?: string;
  entity_id?: string;
  category?: string;
  memory_types?: string[];
  limit?: number;
  min_score?: number;
}

export interface ScoredMemory {
  memory: MemoryItem;
  score: number;
  relevanceScore: number;
  importanceScore: number;
  recencyScore: number;
}

// Heuristic Importance Calculator
export function calculateImportanceScore(title: string, content: string, memoryType: string): number {
  let score = 0.5;
  const text = `${title} ${content}`.toLowerCase();

  // High importance indicators in legal domain
  const highKeywords = [
    "khẩn cấp", "tối mật", "bắt buộc", "luôn luôn", "không bao giờ", "thời hiệu", "khởi kiện", 
    "án phí", "nghị định", "điều luật", "bản án", "ưu tiên cao", "chú ý đặc biệt", "thỏa thuận kín"
  ];
  const mediumKeywords = [
    "thói quen", "sở thích", "yêu cầu", "định dạng", "hạn chót", "tiến độ", "liên hệ", "chi nhánh"
  ];

  for (const kw of highKeywords) {
    if (text.includes(kw)) score += 0.15;
  }
  for (const kw of mediumKeywords) {
    if (text.includes(kw)) score += 0.08;
  }

  if (memoryType === "user_preference" || memoryType === "case_insight") {
    score += 0.1;
  }

  return Math.min(1.0, Math.max(0.1, parseFloat(score.toFixed(2))));
}

// Seed default long-term memories if table is empty
export function seedDefaultMemoriesIfEmpty() {
  try {
    const row = db.prepare("SELECT COUNT(*) as count FROM ai_agent_memories").get() as { count: number };
    if (!row || row.count === 0) {
      const now = new Date().toISOString();
      const insert = db.prepare(`
        INSERT INTO ai_agent_memories (
          user_email, memory_type, category, title, content, summary,
          entity_type, entity_id, importance_score, confidence_score,
          access_count, last_accessed_at, status, tags, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const defaults: MemoryItem[] = [
        {
          user_email: "system",
          memory_type: "user_preference",
          category: "legal_preference",
          title: "Quy chuẩn Định dạng Văn bản Tố tụng",
          content: "Các văn bản tố tụng (Đơn khởi kiện, Bản tự khai, Đơn đề nghị) gửi Tòa án luôn phải tuân thủ chuẩn phông chữ Times New Roman 14, dãn dòng 1.25, có đầy đủ căn cứ viện dẫn Bộ luật Tố tụng Dân sự 2015 và thông tin người đại diện theo ủy quyền.",
          summary: "Quy chuẩn soạn thảo văn bản tố tụng: font Times New Roman 14, căn cứ BLTTDS 2015.",
          entity_type: "SYSTEM",
          importance_score: 0.95,
          confidence_score: 0.98,
          tags: ["tố_tụng", "văn_bản", "quy_chuẩn", "định_dạng"]
        },
        {
          user_email: "system",
          memory_type: "decision_pattern",
          category: "case_note",
          title: "Chiến lược Xử lý Vụ án Tranh chấp Đất đai",
          content: "Khi tiếp nhận tranh chấp ranh giới đất đai hoặc thừa kế quyền sử dụng đất, bước đầu tiên bắt buộc phải kiểm tra thủ tục Hòa giải tại UBND cấp xã/phường theo Điều 202 Luật Đất đai trước khi nộp đơn khởi kiện tại TAND cấp quận/huyện.",
          summary: "Tranh chấp đất đai bắt buộc hòa giải cấp xã trước khi khởi kiện.",
          entity_type: "LAW",
          importance_score: 0.92,
          confidence_score: 0.95,
          tags: ["đất_đai", "hòa_giải", "khởi_kiện", "thủ_tục"]
        },
        {
          user_email: "system",
          memory_type: "client_fact",
          category: "client_profile",
          title: "Hồ sơ Khách hàng Tập đoàn Bất động sản Đô Thành",
          content: "Khách hàng ưu tiên trao đổi trực tiếp qua Ban Pháp chế, yêu cầu báo cáo tiến độ bằng văn bản tóm tắt vào thứ Sáu hàng tuần trước 15:00. Người liên hệ chính: Ông Trần Đình Toàn (Trưởng phòng Pháp chế).",
          summary: "Tập đoàn Đô Thành yêu cầu báo cáo tiến độ thứ 6 hàng tuần qua Trưởng phòng Pháp chế.",
          entity_type: "CLIENT",
          entity_id: "KH-DOTHANH",
          importance_score: 0.88,
          confidence_score: 0.9,
          tags: ["khách_hàng_vip", "đô_thành", "báo_cáo_tuần"]
        },
        {
          user_email: "system",
          memory_type: "case_insight",
          category: "case_note",
          title: "Kinh nghiệm Vụ án Hợp đồng Xây dựng EPC",
          content: "Đối với tranh chấp hợp đồng EPC xây dựng công trình, cần đặc biệt lưu ý kiểm tra Nhật ký thi công, Biên bản nghiệm thu từng giai đoạn và Chứng từ xác nhận khối lượng phát sinh ngoài phạm vi hợp đồng ban đầu.",
          summary: "Tranh chấp EPC cần đối chiếu kỹ Nhật ký công trình và nghiệm thu khối lượng phát sinh.",
          entity_type: "CASE",
          importance_score: 0.85,
          confidence_score: 0.92,
          tags: ["hợp_đồng_epc", "xây_dựng", "chứng_cứ", "nghiệm_thu"]
        },
        {
          user_email: "system",
          memory_type: "user_preference",
          category: "procedural_habit",
          title: "Nguyên tắc Bảo mật Hồ sơ Khách hàng",
          content: "Tuyệt đối không gửi bản sao Giấy chứng nhận quyền sử dụng đất hoặc CMND/CCCD của thân chủ qua các kênh chưa được mã hóa mà không có sự phê duyệt của Luật sư điều hành.",
          summary: "Bảo mật tài liệu nhạy cảm của khách hàng, cấm gửi qua kênh không an toàn.",
          entity_type: "SYSTEM",
          importance_score: 0.98,
          confidence_score: 1.0,
          tags: ["bảo_mật", "quy_chế", "cccd", "sổ_đỏ"]
        }
      ];

      for (const item of defaults) {
        insert.run(
          item.user_email,
          item.memory_type,
          item.category || "general",
          item.title,
          item.content,
          item.summary || item.title,
          item.entity_type || "SYSTEM",
          item.entity_id || null,
          item.importance_score || 0.5,
          item.confidence_score || 0.8,
          1,
          now,
          "active",
          JSON.stringify(item.tags || []),
          JSON.stringify(item.metadata || {}),
          now,
          now
        );
      }

      // Seed Entities
      const insertEntity = db.prepare(`
        INSERT OR IGNORE INTO ai_memory_entities (entity_name, entity_type, description, attributes, relations, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertEntity.run("Tập đoàn Bất động sản Đô Thành", "ORGANIZATION", "Khách hàng Doanh nghiệp VIP chuyên dự án nhà ở thương mại", JSON.stringify({ tax_code: "0312345678", contact_person: "Trần Đình Toàn" }), JSON.stringify([{ target: "Ánh Dương Law", relation: "CLIENT_OF", weight: 0.95 }]), now);
      insertEntity.run("Luật Đất đai 2024", "LAW", "Luật số 31/2024/QH15 quy định chế độ sở hữu, quản lý và sử dụng đất đai", JSON.stringify({ effective_date: "2024-08-01", doc_number: "31/2024/QH15" }), JSON.stringify([{ target: "Hòa giải đất đai", relation: "GOVERNS", weight: 1.0 }]), now);
      insertEntity.run("Bộ luật Tố tụng Dân sự 2015", "LAW", "Bộ luật số 92/2015/QH13 điều chỉnh trình tự, thủ tục giải quyết các vụ việc dân sự", JSON.stringify({ doc_number: "92/2015/QH13" }), JSON.stringify([{ target: "Khởi kiện dân sự", relation: "REGULATES", weight: 1.0 }]), now);
    }
  } catch (err) {
    console.error("Error seeding default AI memories:", err);
  }
}

// Call seed check on service load
seedDefaultMemoriesIfEmpty();

/**
 * Core Agent Memory Service
 */
export class AgentMemoryService {
  /**
   * Store or update an AI Memory item
   */
  static storeMemory(item: MemoryItem): { success: boolean; id: number; message: string } {
    try {
      const now = new Date().toISOString();
      const importance = item.importance_score ?? calculateImportanceScore(item.title, item.content, item.memory_type);
      const confidence = item.confidence_score ?? 0.85;
      const tagsJson = JSON.stringify(item.tags || []);
      const metaJson = JSON.stringify(item.metadata || {});

      // Deduplication / Update check: If title & entity match closely, update instead of duplicate
      const existing = db.prepare(`
        SELECT id, content, access_count, tags, metadata 
        FROM ai_agent_memories 
        WHERE (title = ? OR (entity_id = ? AND entity_type = ? AND title LIKE ?))
          AND status = 'active'
        LIMIT 1
      `).get(item.title, item.entity_id || "NONE", item.entity_type || "NONE", `%${item.title.slice(0, 15)}%`) as any;

      if (existing) {
        db.prepare(`
          UPDATE ai_agent_memories SET
            content = ?,
            summary = ?,
            importance_score = MAX(importance_score, ?),
            confidence_score = ?,
            access_count = access_count + 1,
            last_accessed_at = ?,
            tags = ?,
            metadata = ?,
            updated_at = ?
          WHERE id = ?
        `).run(
          item.content,
          item.summary || item.title,
          importance,
          confidence,
          now,
          tagsJson,
          metaJson,
          now,
          existing.id
        );

        return {
          success: true,
          id: existing.id,
          message: `Đã hợp nhất và cập nhật ký ức hiện hữu ID #${existing.id}.`
        };
      }

      const stmt = db.prepare(`
        INSERT INTO ai_agent_memories (
          user_email, memory_type, category, title, content, summary,
          entity_type, entity_id, importance_score, confidence_score,
          access_count, last_accessed_at, status, source_session, tags, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'active', ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        item.user_email || "system",
        item.memory_type || "semantic",
        item.category || "general",
        item.title,
        item.content,
        item.summary || item.title,
        item.entity_type || "SYSTEM",
        item.entity_id || null,
        importance,
        confidence,
        now,
        item.source_session || null,
        tagsJson,
        metaJson,
        now,
        now
      );

      return {
        success: true,
        id: Number(result.lastInsertRowid),
        message: `Đã lưu ký ức mới vào Memory Store thành công.`
      };
    } catch (err: any) {
      console.error("Error storing agent memory:", err);
      throw new Error(err.message || "Failed to store memory.");
    }
  }

  /**
   * Recall / Search Memories with Cognitive Scoring (Similarity + Importance + Recency Decay)
   */
  static recallMemories(options: RecallOptions): ScoredMemory[] {
    try {
      const {
        query,
        user_email,
        entity_type,
        entity_id,
        category,
        memory_types,
        limit = 6,
        min_score = 0.25
      } = options;

      let sql = `SELECT * FROM ai_agent_memories WHERE status = 'active'`;
      const params: any[] = [];

      if (user_email && user_email !== "all") {
        sql += ` AND (user_email = ? OR user_email = 'system')`;
        params.push(user_email);
      }

      if (entity_type) {
        sql += ` AND entity_type = ?`;
        params.push(entity_type);
      }

      if (entity_id) {
        sql += ` AND entity_id = ?`;
        params.push(entity_id);
      }

      if (category) {
        sql += ` AND category = ?`;
        params.push(category);
      }

      if (memory_types && memory_types.length > 0) {
        const placeholders = memory_types.map(() => '?').join(',');
        sql += ` AND memory_type IN (${placeholders})`;
        params.push(...memory_types);
      }

      const rows = db.prepare(sql).all(...params) as any[];
      if (!rows || rows.length === 0) return [];

      const nowTime = Date.now();
      const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

      const scored: ScoredMemory[] = rows.map(row => {
        const text = `${row.title} ${row.content} ${row.summary || ''} ${row.tags || ''}`.toLowerCase();
        
        // 1. Relevance / Keyword Token Matching
        let matchCount = 0;
        for (const token of queryTokens) {
          if (text.includes(token)) {
            matchCount++;
          }
        }
        const relevanceScore = queryTokens.length > 0 ? (matchCount / queryTokens.length) : 0.5;

        // 2. Importance Score (from DB)
        const importanceScore = row.importance_score || 0.5;

        // 3. Recency Decay Calculation (exponential decay with 7-day half-life)
        const itemTime = row.updated_at ? new Date(row.updated_at).getTime() : nowTime;
        const diffDays = Math.max(0, (nowTime - itemTime) / (1000 * 60 * 60 * 24));
        const recencyScore = Math.exp(-0.05 * diffDays); // slow decay

        // 4. Access Count Boost
        const accessBoost = Math.min(0.2, (row.access_count || 0) * 0.02);

        // Combined Cognitive Score
        const finalScore = parseFloat((
          (relevanceScore * 0.5) +
          (importanceScore * 0.3) +
          (recencyScore * 0.15) +
          (accessBoost * 0.05)
        ).toFixed(3));

        return {
          memory: {
            id: row.id,
            user_email: row.user_email,
            memory_type: row.memory_type,
            category: row.category,
            title: row.title,
            content: row.content,
            summary: row.summary,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            importance_score: row.importance_score,
            confidence_score: row.confidence_score,
            access_count: row.access_count,
            last_accessed_at: row.last_accessed_at,
            status: row.status,
            tags: JSON.parse(row.tags || "[]"),
            metadata: JSON.parse(row.metadata || "{}"),
            created_at: row.created_at,
            updated_at: row.updated_at
          },
          score: finalScore,
          relevanceScore: parseFloat(relevanceScore.toFixed(2)),
          importanceScore: parseFloat(importanceScore.toFixed(2)),
          recencyScore: parseFloat(recencyScore.toFixed(2))
        };
      });

      // Filter by min_score and sort descending
      const results = scored
        .filter(s => s.score >= min_score || (options.query === "" && s.importanceScore > 0.6))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Asynchronously bump access count for retrieved items
      if (results.length > 0) {
        const ids = results.map(r => r.memory.id).filter(Boolean);
        if (ids.length > 0) {
          const placeholders = ids.map(() => '?').join(',');
          const updateSql = `
            UPDATE ai_agent_memories 
            SET access_count = access_count + 1, last_accessed_at = ? 
            WHERE id IN (${placeholders})
          `;
          db.prepare(updateSql).run(new Date().toISOString(), ...ids);
        }
      }

      return results;
    } catch (err) {
      console.error("Error recalling memories:", err);
      return [];
    }
  }

  /**
   * Build memory context block for AI Prompt Augmentation
   */
  static buildMemoryContext(query: string, userEmail: string = "system", entityId?: string): string {
    const recalled = this.recallMemories({
      query,
      user_email: userEmail,
      entity_id: entityId,
      limit: 4,
      min_score: 0.3
    });

    if (!recalled || recalled.length === 0) {
      return "";
    }

    const lines = [
      "--- [BỘ NHỚ DÀI HẠN & KINH NGHIỆM AI (TencentDB/Mem0 Agent Memory)] ---"
    ];

    for (const item of recalled) {
      const m = item.memory;
      lines.push(`• [${m.memory_type.toUpperCase()} | Độ quan trọng: ${(item.importanceScore * 100).toFixed(0)}%] ${m.title}: ${m.content}`);
    }

    lines.push("--- [HẾT BỘ NHỚ DÀI HẠN] ---\n");
    return lines.join("\n");
  }

  /**
   * Consolidate memories: Detect duplicates, consolidate reflections, remove obsolete data
   */
  static consolidateMemories(): { consolidatedCount: number; newReflections: number; message: string } {
    try {
      const activeMemories = db.prepare("SELECT * FROM ai_agent_memories WHERE status = 'active' ORDER BY importance_score DESC").all() as any[];
      let consolidated = 0;
      let newReflections = 0;

      // Group memories by category
      const byCategory: Record<string, any[]> = {};
      for (const m of activeMemories) {
        const cat = m.category || "general";
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(m);
      }

      // Consolidate categories with 3+ memories into synthetic reflections
      for (const [cat, items] of Object.entries(byCategory)) {
        if (items.length >= 3) {
          const titles = items.map(i => i.title).join("; ");
          const summarySynthesis = `Hệ thống đã đúc kết ${items.length} quy tắc và kinh nghiệm trong danh mục '${cat}': Gồm ${titles}.`;
          
          const refTitle = `Tổng hợp kinh nghiệm & Thói quen: ${cat.toUpperCase()}`;
          const existingRef = db.prepare("SELECT id FROM ai_memory_reflections WHERE reflection_title = ?").get(refTitle);

          if (!existingRef) {
            db.prepare(`
              INSERT INTO ai_memory_reflections (user_email, reflection_title, insights, source_memory_ids, created_at)
              VALUES (?, ?, ?, ?, ?)
            `).run(
              "system",
              refTitle,
              summarySynthesis,
              JSON.stringify(items.map(i => i.id)),
              new Date().toISOString()
            );
            newReflections++;
          }
          consolidated += items.length;
        }
      }

      return {
        consolidatedCount: consolidated,
        newReflections,
        message: `Đã hoàn tất chu trình hợp nhất bộ nhớ. Đã đúc kết ${newReflections} phân tích tổng hợp mới từ ${consolidated} mẩu ký ức.`
      };
    } catch (err: any) {
      console.error("Error consolidating memories:", err);
      throw new Error(err.message || "Failed to consolidate memories.");
    }
  }

  /**
   * Get memory store statistics
   */
  static getStats() {
    try {
      const total = db.prepare("SELECT COUNT(*) as count FROM ai_agent_memories WHERE status = 'active'").get() as any;
      const archived = db.prepare("SELECT COUNT(*) as count FROM ai_agent_memories WHERE status = 'archived'").get() as any;
      const avgImp = db.prepare("SELECT AVG(importance_score) as avg FROM ai_agent_memories WHERE status = 'active'").get() as any;
      const totalEntities = db.prepare("SELECT COUNT(*) as count FROM ai_memory_entities").get() as any;
      const totalReflections = db.prepare("SELECT COUNT(*) as count FROM ai_memory_reflections").get() as any;

      const typeDistribution = db.prepare(`
        SELECT memory_type, COUNT(*) as count 
        FROM ai_agent_memories 
        WHERE status = 'active' 
        GROUP BY memory_type
      `).all() as any[];

      return {
        total_active_memories: total?.count || 0,
        total_archived_memories: archived?.count || 0,
        average_importance: parseFloat((avgImp?.avg || 0.5).toFixed(2)),
        total_entities: totalEntities?.count || 0,
        total_reflections: totalReflections?.count || 0,
        type_distribution: typeDistribution,
        engine: "TencentDB-Agent-Memory / Mem0 Cognitive Engine for Legal OS"
      };
    } catch (err) {
      console.error("Error getting memory stats:", err);
      return {};
    }
  }
}
