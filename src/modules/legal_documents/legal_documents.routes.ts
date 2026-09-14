import express from "express";
import db from "../../db/database";
import { upload } from "../../middleware/upload";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import { auth } from "../../middleware/auth";
import { getResolvedAiProvider } from "../ai/ai.routes";
import { encodeCursor, decodeCursor } from "../../utils/cursor";

const router = express.Router();

router.post("/legal_documents/parse-file", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Không tìm thấy tệp được tải lên." });
    }

    const filename = file.originalname;
    const fileExt = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    
    let textContent = "";
    let isMultimodal = false;
    let mimeType = file.mimetype;

    // 1. Extract raw text if possible or mark as multimodal
    if (fileExt === ".txt") {
      textContent = file.buffer.toString("utf-8");
    } else if (fileExt === ".docx" || fileExt === ".doc") {
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        textContent = result.value;
      } catch (err: any) {
        console.error("Mammoth error:", err);
        return res.status(400).json({ error: "Lỗi giải nén tệp Word: " + err.message });
      }
    } else if (fileExt === ".pdf") {
      isMultimodal = true;
      mimeType = "application/pdf";
      // Try local text extraction as fallback / cache
      try {
        const pdfParseModule = (await import("pdf-parse")) as any;
        const parsePdf = pdfParseModule.default || pdfParseModule;
        const pdfData = await parsePdf(file.buffer);
        textContent = pdfData.text;
      } catch (err) {
        console.warn("pdf-parse failed, relying on Gemini vision:", err);
      }
    } else if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(fileExt)) {
      isMultimodal = true;
      if (fileExt === ".jpg" || fileExt === ".jpeg") mimeType = "image/jpeg";
      else if (fileExt === ".png") mimeType = "image/png";
      else if (fileExt === ".gif") mimeType = "image/gif";
      else if (fileExt === ".webp") mimeType = "image/webp";
    } else {
      return res.status(400).json({ error: "Định dạng tệp không hỗ trợ. Vui lòng tải lên tệp .txt, .docx, .pdf hoặc tệp ảnh." });
    }

    // 2. Setup Gemini AI if key is available
    const aiProvider = getResolvedAiProvider("all");
    let apiKey = aiProvider.api_key || process.env.GEMINI_API_KEY;
    if (apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'dummy' || apiKey === 'your_api_key_here') {
      apiKey = undefined; 
    }

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      try {
        let contents: any[] = [];
        
        if (isMultimodal) {
          // Send raw binary to Gemini for best OCR/understanding
          contents.push({
            inlineData: {
              mimeType: mimeType,
              data: file.buffer.toString("base64")
            }
          });
          contents.push({
            text: "Hãy đọc văn bản pháp luật này và trích xuất thông tin chi tiết."
          });
        } else {
          contents.push({
            text: `Hãy đọc nội dung văn bản pháp luật sau và trích xuất thông tin:\n\n${textContent}`
          });
        }

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Tên hoặc tiêu đề chính thức của văn bản pháp luật."
            },
            refNumber: {
              type: Type.STRING,
              description: "Số hiệu văn bản (ví dụ: '15/2020/NĐ-CP', '100/2015/QH13')"
            },
            type: {
              type: Type.STRING,
              description: "Loại văn bản. Chỉ chọn từ danh sách sau: 'Hiến pháp', 'Bộ luật', 'Luật', 'Pháp lệnh', 'Nghị định', 'Thông tư', 'Thông tư liên tịch', 'Quyết định', 'Lệnh', 'Nghị quyết', 'Chỉ thị', 'Công văn', 'Quy định', 'Thông báo', 'Văn bản khác'"
            },
            dateStr: {
              type: Type.STRING,
              description: "Ngày ban hành văn bản định dạng YYYY-MM-DD"
            },
            effectiveDateStr: {
              type: Type.STRING,
              description: "Ngày có hiệu lực định dạng YYYY-MM-DD. Nếu không rõ, hãy dự đoán hoặc để trống."
            },
            agency: {
              type: Type.STRING,
              description: "Cơ quan ban hành. Chỉ chọn từ danh sách sau: 'Quốc hội', 'Ủy ban Thường vụ Quốc hội', 'Chính phủ', 'Chủ tịch nước', 'Bộ Tư pháp', 'Bộ Công an', 'Bộ Quốc phòng', 'Bộ Công Thương', 'Bộ Giáo dục và Đào tạo', 'Bộ Y tế', 'Bộ Tài chính', 'Bộ Nội vụ', 'Bộ Ngoại giao', 'Bộ Xây dựng', 'Bộ Lao động - Thương binh và Xã hội', 'Thủ tướng Chính phủ', 'Ủy ban nhân dân Tỉnh', 'Tòa án nhân dân tối cao', 'Viện kiểm sát nhân dân tối cao'"
            },
            signer: {
              type: Type.STRING,
              description: "Người ký duyệt ban hành văn bản."
            },
            category: {
              type: Type.STRING,
              description: "Lĩnh vực pháp luật, chọn một trong các từ: 'Đất đai', 'Hình sự', 'Dân sự', 'Doanh nghiệp', 'Lao động', 'Hôn nhân gia đình', hoặc lĩnh vực liên quan khác."
            },
            status: {
              type: Type.STRING,
              description: "Trạng thái hiệu lực. Chỉ chọn từ danh sách sau: 'Còn hiệu lực', 'Chưa có hiệu lực', 'Hết hiệu lực toàn bộ', 'Hết hiệu lực một phần', 'Ngưng hiệu lực', 'Ngưng hiệu lực một phần', 'Không còn phù hợp'"
            },
            summary: {
              type: Type.STRING,
              description: "Tóm tắt ngắn gọn 3-4 câu trích yếu nội dung cốt lõi của văn bản."
            },
            content: {
              type: Type.STRING,
              description: "Nội dung văn bản gốc đầy đủ và sạch sẽ đã được trích xuất (OCR)."
            }
          },
          required: ["title", "refNumber", "type", "dateStr", "agency", "signer", "summary", "content"]
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: "Bạn là một AI chuyên phân tích, OCR và số hóa văn bản pháp luật Việt Nam. Hãy đọc kỹ tài liệu được cung cấp và điền thông tin vào lược đồ JSON được yêu cầu một cách chính xác nhất.",
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        });

        const parsedResult = JSON.parse(response.text?.trim() || "{}");
        return res.json({ success: true, data: parsedResult });

      } catch (geminiErr: any) {
        console.error("Gemini parse failed, falling back to basic extraction:", geminiErr);
        // Fallback below
      }
    }

    // 3. Fallback extraction if no Gemini key or Gemini failed
    const defaultData = {
      title: filename.substring(0, filename.lastIndexOf(".")),
      refNumber: "",
      type: fileExt === ".pdf" ? "Luật" : "Khác",
      dateStr: new Date().toISOString().split("T")[0],
      effectiveDateStr: "",
      agency: "Quốc hội",
      signer: "",
      category: "Dân sự",
      status: "Còn hiệu lực",
      summary: `Tệp văn bản ${filename} được tải lên hệ thống.`,
      content: textContent || `[Nội dung từ tệp: ${filename}]`
    };

    return res.json({ success: true, data: defaultData });

  } catch (error: any) {
    console.error("File parse route error:", error);
    res.status(500).json({ error: error.message || "Lỗi khi xử lý tệp tin." });
  }
});

router.get("/legal_documents", (req, res) => {
  try {
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
    const cursorStr = req.query.cursor as string;

    let query = "SELECT * FROM legal_documents";
    const params: any = {};

    if (limit !== null) {
      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.issueDate && cursor.id) {
          query += " WHERE issue_date < :cursorIssueDate OR (issue_date = :cursorIssueDate AND id < :cursorId)";
          params.cursorIssueDate = cursor.issueDate;
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY issue_date DESC, id DESC LIMIT :limitPlusOne";
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as any[];
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        const lastRow = returnedRows[returnedRows.length - 1];
        nextCursor = encodeCursor({ issueDate: lastRow.issue_date, id: lastRow.id });
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
      query += " ORDER BY issue_date DESC, id DESC";
      const docs = db.prepare(query).all(params);
      res.json(docs);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/legal_documents/history", auth, (req: any, res: any) => {
  try {
    const logs = db.prepare("SELECT * FROM legal_documents_history ORDER BY id DESC LIMIT 100").all();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/legal_documents", auth, (req: any, res: any) => {
  try {
    const { title, document_number, issue_date, effective_date, agency, signer, content, status, summary, category } = req.body;
    const created_at = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO legal_documents (title, document_number, issue_date, effective_date, agency, signer, content, status, summary, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, document_number, issue_date, effective_date, agency, signer, content, status, summary, category, created_at);
    
    // Log to legal_documents_history
    try {
      const userVal = req.session?.user?.name || req.session?.user?.username || "Quản trị viên";
      const timeVal = new Date().toLocaleString("vi-VN");
      db.prepare(`
        INSERT INTO legal_documents_history (action, doc_name, user, time)
        VALUES (?, ?, ?, ?)
      `).run("Thêm", title, userVal, timeVal);
    } catch (logErr) {
      console.error("Failed to log add doc history:", logErr);
    }

    res.json({ success: true, id: result.lastInsertRowid });
    try {
      const io = req.app.get("io");
      if (io) io.emit("legal_docs_updated");
    } catch (e) {}
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/legal_documents/:id", auth, (req: any, res: any) => {
  try {
    const { title, document_number, issue_date, effective_date, agency, signer, content, status, summary, category } = req.body;
    const { id } = req.params;
    
    db.prepare(`
      UPDATE legal_documents 
      SET title = ?, document_number = ?, issue_date = ?, effective_date = ?, agency = ?, signer = ?, content = ?, status = ?, summary = ?, category = ?
      WHERE id = ?
    `).run(title, document_number, issue_date, effective_date, agency, signer, content, status, summary, category, id);
    
    // Log to legal_documents_history
    try {
      const userVal = req.session?.user?.name || req.session?.user?.username || "Quản trị viên";
      const timeVal = new Date().toLocaleString("vi-VN");
      db.prepare(`
        INSERT INTO legal_documents_history (action, doc_name, user, time)
        VALUES (?, ?, ?, ?)
      `).run("Chỉnh sửa", title, userVal, timeVal);
    } catch (logErr) {
      console.error("Failed to log edit doc history:", logErr);
    }

    try {
      const io = req.app.get("io");
      if (io) io.emit("legal_docs_updated");
    } catch (e) {}

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/legal_documents/:id", auth, (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    // Get doc name for history logging before delete
    let docTitle = "Văn bản #" + id;
    try {
      const doc = db.prepare("SELECT title FROM legal_documents WHERE id = ?").get(id) as any;
      if (doc) docTitle = doc.title;
    } catch (err) {
      console.warn("Failed to find doc title for delete log:", err);
    }

    db.prepare("DELETE FROM legal_documents WHERE id = ?").run(id);

    // Log to legal_documents_history
    try {
      const userVal = req.session?.user?.name || req.session?.user?.username || "Quản trị viên";
      const timeVal = new Date().toLocaleString("vi-VN");
      db.prepare(`
        INSERT INTO legal_documents_history (action, doc_name, user, time)
        VALUES (?, ?, ?, ?)
      `).run("Xóa", docTitle, userVal, timeVal);
    } catch (logErr) {
      console.error("Failed to log delete doc history:", logErr);
    }

    try {
      const io = req.app.get("io");
      if (io) io.emit("legal_docs_updated");
    } catch (e) {}

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
