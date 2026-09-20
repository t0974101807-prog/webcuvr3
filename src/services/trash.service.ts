import db from "../db/database";
import { syncRowToFirestore, deleteFromFirestore } from "../db/firestore-sync";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { SystemDataAccess, mapCategoryToDomain } from "../system/data-access/SystemDataAccess";

export interface TrashItem {
  id: string;
  originalTable: string;
  data: any;
  deletedAt: string;
  deletedBy?: string;
  reason?: string;
  previousStatus?: string;
}

export interface AuditLogEntry {
  id?: string;
  user?: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedAt: string;
  reason?: string;
  result: "SUCCESS" | "FAILED" | "DENIED";
  details?: string | any;
}

export class TrashService {
  private static io: any = null;

  static setSocketServer(io: any) {
    this.io = io;
  }

  /**
   * Log an action to the audit_logs table
   */
  static logAudit(entry: AuditLogEntry) {
    try {
      const id = entry.id || uuidv4();
      const user = entry.performedBy || "system";
      const time = entry.performedAt || new Date().toISOString();
      const detailsStr = typeof entry.details === "object" ? JSON.stringify(entry.details) : (entry.details || "");

      db.prepare(`
        INSERT INTO audit_logs (id, user, action, entityType, entityId, performedBy, performedAt, reason, result, time, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        user,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.performedBy,
        entry.performedAt,
        entry.reason || "",
        entry.result,
        time,
        detailsStr
      );

      if (this.io) {
        try {
          const logPayload = {
            id,
            user,
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            performedBy: entry.performedBy,
            performedAt: time,
            time,
            reason: entry.reason || "",
            result: entry.result,
            details: typeof entry.details === "object" ? entry.details : detailsStr
          };
          this.io.emit("activity_log_created", logPayload);
          this.io.emit("audit_log_created", logPayload);
        } catch (ioErr) {
          console.error("[TrashService] Socket emit error:", ioErr);
        }
      }
    } catch (err) {
      console.error("[TrashService] Error logging audit:", err);
      // Fallback simple insert if legacy table
      try {
        db.prepare(`INSERT INTO audit_logs (id, user, action, time) VALUES (?, ?, ?, ?)`).run(
          entry.id || uuidv4(),
          entry.performedBy || "system",
          `${entry.action}:${entry.entityType}:${entry.entityId}`,
          entry.performedAt || new Date().toISOString()
        );
      } catch (fallbackErr) {
        console.error("[TrashService] Fallback audit log failed:", fallbackErr);
      }
    }
  }

  /**
   * Auto purge records in recycle_bin that have been deleted for more than 30 days
   */
  static async cleanupExpired(days: number = 30) {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const expired = db.prepare("SELECT * FROM recycle_bin WHERE deleted_at < ?").all(cutoff) as any[];

      for (const item of expired) {
        const id = String(item.id);

        if (item.original_table === "chat_channels") {
          db.prepare("DELETE FROM chat_channels WHERE id = ?").run(id);
          db.prepare("DELETE FROM chat_channel_members WHERE channel_id = ?").run(id);
          db.prepare("DELETE FROM chat_messages WHERE channel_id = ?").run(id);
          db.prepare("DELETE FROM recycle_bin WHERE id = ?").run(id);
          await deleteFromFirestore("recycle_bin", id);
          try { await deleteFromFirestore("chat_channels", id); } catch (e) {}
          this.logAudit({
            action: "PERMANENT_DELETE_CHAT_CHANNEL",
            entityType: "chat_channels",
            entityId: id,
            performedBy: "SYSTEM_AUTO_PURGE_30_DAYS",
            performedAt: new Date().toISOString(),
            reason: `Tự động dọn dẹp sau ${days} ngày trong thùng rác`,
            result: "SUCCESS",
            details: item.data
          });
          continue;
        }

        // Remove from erp_records, cases, and recycle_bin
        SystemDataAccess.deleteRecord(id);
        db.prepare("DELETE FROM cases WHERE id = ?").run(id);
        db.prepare("DELETE FROM recycle_bin WHERE id = ?").run(id);

        await deleteFromFirestore("recycle_bin", id);
        try {
          const domain = mapCategoryToDomain(item.data?.category || item.data?.practice_area);
          await deleteFromFirestore(`${domain}_cases`, id);
        } catch (err) {}
        await deleteFromFirestore("cases", id);

        this.logAudit({
          action: "PERMANENT_DELETE_CASE",
          entityType: item.original_table || "erp_records",
          entityId: id,
          performedBy: "SYSTEM_AUTO_PURGE_30_DAYS",
          performedAt: new Date().toISOString(),
          reason: `Tự động dọn dẹp sau ${days} ngày trong thùng rác`,
          result: "SUCCESS",
          details: item.data
        });
      }

      return expired.length;
    } catch (err) {
      console.error("[TrashService] cleanupExpired error:", err);
      return 0;
    }
  }

  /**
   * Helper to ensure an ID strictly uses the 'HS-' prefix for case records
   * Replaces contract-specific prefixes (such as HD-, HD, UQ-, UQ, DN-, DN) with HS-
   */
  static ensureHsPrefix(id: string, data?: any): string {
    if (!id) return "HS-UNKNOWN";
    const sId = String(id).trim();

    // 1. Check if data contains an explicit HS- candidate first
    if (data) {
      const candidates = [
        data.masterId,
        data.systemId,
        data.caseId,
        data.case_id,
        data.caseCode,
        data.case_code,
        data.recordId,
        data.id
      ].filter(Boolean).map(x => String(x).trim());

      const hsDashMatch = candidates.find(c => /^HS-/i.test(c));
      if (hsDashMatch) return hsDashMatch;

      const hsMatch = candidates.find(c => /^HS/i.test(c));
      if (hsMatch) return hsMatch.replace(/^HS-?/i, "HS-");
    }

    if (/^HS-/i.test(sId)) {
      return sId;
    }
    if (/^HS/i.test(sId)) {
      return sId.replace(/^HS-?/i, "HS-");
    }
    if (/^HD-HS-/i.test(sId)) {
      return sId.replace(/^HD-HS-/i, "HS-");
    }
    if (/^HD-/i.test(sId)) {
      return sId.replace(/^HD-/i, "HS-");
    }
    if (/^HD/i.test(sId)) {
      return sId.replace(/^HD/i, "HS-");
    }
    if (/^UQ-?/i.test(sId)) {
      return sId.replace(/^UQ-?/i, "HS-");
    }
    if (/^DN-?/i.test(sId)) {
      return sId.replace(/^DN-?/i, "HS-");
    }

    return `HS-${sId}`;
  }

  /**
   * Helper to resolve canonical Case Master ID
   * Prioritizes Dossier code starting with HS (e.g. HS-E2E-001, HS001)
   * Strictly avoids contract ID (HD001) or authorization ID (UQ001) replacing master ID
   */
  static resolveMasterId(data: any, fallbackId: string): string {
    const candidates = [
      fallbackId,
      data?.systemId,
      data?.masterId,
      data?.caseId,
      data?.case_id,
      data?.caseCode,
      data?.case_code,
      data?.id,
      data?.recordId
    ].filter(Boolean).map(x => String(x).trim());

    // 1. Highest priority: ID starting with HS- or HS
    const hsDashMatch = candidates.find(c => /^HS-/i.test(c));
    if (hsDashMatch) return hsDashMatch;

    const hsMatch = candidates.find(c => /^HS/i.test(c));
    if (hsMatch) return hsMatch;

    // 2. Do not let HD (contract) or UQ (authorization) take over
    const nonContract = candidates.find(c => !/^HD/i.test(c) && !/^UQ/i.test(c));
    if (nonContract) return nonContract;

    return candidates[0] || fallbackId;
  }

  /**
   * Perform Soft Delete on a record (ACTIVE -> TRASHED)
   */
  static async softDelete(
    id: string,
    performedBy: string,
    reason: string = "Người dùng xóa hồ sơ",
    fallbackData?: any
  ): Promise<any> {
    const stringId = String(id).trim();
      console.log(`[TRASH DEBUG] softDelete called for ID: ${stringId}, performedBy: ${performedBy}, reason: ${reason}`);
    let originalData: any = null;

    // 1. Check existing record in erp_records by exact ID
    const existingRecord = SystemDataAccess.getRecordById(stringId);
    if (existingRecord) {
      originalData = existingRecord;
        console.log("[TRASH DEBUG] Found record in specialized/domain repositories:", existingRecord.id);
    }

    // 1b. If not found by exact ID, search erp_records by parsing JSON
    if (!originalData) {
      try {
        const allErp = SystemDataAccess.getAllRecords();
        for (const parsed of allErp) {
          try {
            if (
              String(parsed.id) === stringId ||
              String(parsed.contractId) === stringId ||
              String((parsed as any).systemId) === stringId ||
              String((parsed as any).authContractId) === stringId
            ) {
              originalData = parsed;
                console.log("[TRASH DEBUG] Found matching record by alias scan:", parsed.id);
              break;
            }
          } catch (e) {}
        }
      } catch (scanErr) {}
    }

    // 2. Check fallbackData if provided
    if (!originalData && fallbackData) {
      originalData = { ...fallbackData };
        console.log("[TRASH DEBUG] Using fallbackData as originalData source");
    }

    // 3b. Check cases table if exists
    if (!originalData) {
      try {
        const caseRow = db.prepare("SELECT * FROM cases WHERE id = ?").get(stringId) as any;
        if (caseRow) {
          originalData = {
            id: stringId,
            systemId: stringId,
            title: caseRow.name || `Hồ sơ ${stringId}`,
            client: caseRow.client || "Khách hàng",
            feeAmount: caseRow.fee || 0,
            status: "Đang xử lý",
            date: new Date().toLocaleDateString("vi-VN")
          };
            console.log("[TRASH DEBUG] Synthesized originalData from cases table:", stringId);
        }
      } catch (caseQueryErr) {}
    }

    // 4. Fallback default structure if totally missing
    if (!originalData) {
      originalData = {
        id: stringId,
        systemId: stringId,
        title: `Hồ sơ ${stringId}`,
        client: "Khách hàng",
        status: "Đang xử lý",
        date: new Date().toLocaleDateString("vi-VN")
      };
        console.log("[TRASH DEBUG] Created default fallback originalData structure");
    }

    // Determine resolved masterId with strict priority (HS-E2E-001 over HD001/UQ001)
    const resolvedMasterId = this.resolveMasterId(originalData, stringId);
      console.log(`[TRASH DEBUG] Resolved masterId: ${resolvedMasterId}`);

    // Collect all alias IDs associated with this record
    const aliasIds = Array.from(
      new Set(
        [
          resolvedMasterId,
          stringId,
          originalData.id ? String(originalData.id) : null,
          originalData.systemId ? String(originalData.systemId) : null,
          originalData.contractId ? String(originalData.contractId) : null,
          originalData.authContractId ? String(originalData.authContractId) : null
        ].filter(Boolean) as string[]
      )
    );

    // --- ENFORCE THREE-LEVEL VALIDATION GUARDS (PART 1 & 2) ---
    // 1. Kiểm tra trạng thái đóng hoặc lưu trữ của hồ sơ
    const recordStatus = originalData.status || originalData.currentStatus;
    if (recordStatus === "Closed" || recordStatus === "Archived" || recordStatus === "Đã đóng" || recordStatus === "Lưu trữ") {
      throw new Error("CHẶN THAO TÁC: Hồ sơ vụ việc đã chuyển sang trạng thái Đóng (Closed) hoặc Lưu trữ (Archived). Hệ thống tự động khóa dữ liệu lịch sử doanh nghiệp, không được phép xóa cứng.");
    }

    // 2. Kiểm tra ràng buộc tài chính (Module Finance)
    for (const aId of aliasIds) {
      try {
        const finCheck = db.prepare("SELECT COUNT(*) as count FROM finance_transactions WHERE case_id = ?").get(aId) as { count: number };
        if (finCheck && finCheck.count > 0) {
          throw new Error(`KHÔNG THỂ XÓA: Hồ sơ này đã phát sinh các chứng từ thù lao, chi phí hoặc hóa đơn dịch vụ pháp lý tại Module Finance. Bạn phải truy cập Module Finance để hủy gỡ các liên kết tài chính trước.`);
        }
      } catch (err: any) {
        if (err.message && err.message.includes("KHÔNG THỂ XÓA")) throw err;
      }
    }

    // 3. Kiểm tra ràng buộc công việc (Module Workflow)
    for (const aId of aliasIds) {
      try {
        const taskCheck = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE case_id = ?").get(aId) as { count: number };
        if (taskCheck && taskCheck.count > 0) {
          throw new Error("KHÔNG THỂ XÓA: Module Workflow đang ghi nhận có Lịch tòa, lịch làm việc hoặc Nhiệm vụ kiểm soát chất lượng (QC Rules) gắn liền với hồ sơ vụ việc này. Vui lòng dọn sạch danh mục công việc trước.");
        }
      } catch (err: any) {
        if (err.message && err.message.includes("KHÔNG THỂ XÓA")) throw err;
      }
    }

    // Map Domain Type and Domain Name for hidden database classification
    const rawCategory = originalData.category || originalData.practice_area || "tranh_tung";
    let domainType = "LITIGATION";
    let domainName = "Tranh tụng";
    const catStr = String(rawCategory).toLowerCase();

    if (catStr.includes("tranh_tung") || catStr.includes("tranh tụng") || catStr.includes("litigation")) {
      domainType = "LITIGATION";
      domainName = "Tranh tụng";
    } else if (catStr.includes("tu_van") || catStr.includes("tư vấn") || catStr.includes("advisory") || catStr.includes("consultation") || catStr.includes("co_van")) {
      domainType = "ADVISORY";
      domainName = "Tư vấn Pháp luật";
    } else if (catStr.includes("dai_dien") || catStr.includes("đại diện") || catStr.includes("representation")) {
      domainType = "REPRESENTATION";
      domainName = "Đại diện Ngoài tố tụng";
    } else if (catStr.includes("phap_che") || catStr.includes("pháp chế") || catStr.includes("corporate_internal") || catStr.includes("compliance") || catStr.includes("nội bộ")) {
      domainType = "CORPORATE_INTERNAL";
      domainName = "Pháp chế & Nội bộ";
    } else if (catStr.includes("trong_tai") || catStr.includes("trọng tài") || catStr.includes("arbitration_mediation") || catStr.includes("arbitration") || catStr.includes("hòa giải")) {
      domainType = "ARBITRATION_MEDIATION";
      domainName = "Trọng tài & Hòa giải";
    }

    const previousStatus =
      originalData.status && originalData.status !== "TRASHED"
        ? originalData.status
        : originalData.previousStatus || "Đang xử lý";

    const now = new Date().toISOString();

    // Prepare complete soft-deleted payload preserving ALL existing attributes
    const trashedData = {
      ...originalData,
      id: resolvedMasterId,
      masterId: resolvedMasterId,
      systemId: resolvedMasterId,
      deleted: true,
      is_deleted: true,
      deletedAt: now,
      deleted_at: now,
      deletedBy: performedBy,
      deleted_by: performedBy,
      status: "TRASHED",
      previousStatus: previousStatus,
      deleteReason: reason,
      domain_type: domainType,
      domain_name: domainName,
      title: originalData.title || originalData.name || `Hồ sơ ${resolvedMasterId}`,
      client: originalData.client || originalData.customer || "Khách hàng",
      practice_area: rawCategory
    };

    const dataJson = JSON.stringify(trashedData);
      console.log("[TRASH DEBUG] List of associated alias IDs to mark as soft-deleted:", aliasIds);

    // ATOMIC TRANSACTION: (1) read record (done), (2) identify masterId (done), (3) insert recycle_bin, (4) update cases, (5) update related data
    const softDeleteTx = db.transaction(() => {
      // Primary row in recycle_bin with masterId = resolvedMasterId
      db.prepare(`
        INSERT OR REPLACE INTO recycle_bin (id, master_id, masterId, systemId, originalId, original_table, data, deleted_at, deleted_by, reason, previous_status)
        VALUES (?, ?, ?, ?, ?, 'cases', ?, ?, ?, ?, ?)
      `).run(
        resolvedMasterId,
        resolvedMasterId,
        resolvedMasterId,
        resolvedMasterId,
        resolvedMasterId,
        dataJson,
        now,
        performedBy,
        reason,
        previousStatus
      );

      // Save soft-deleted state to erp_records and recycle_bin for all associated IDs
      for (const aId of aliasIds) {
        if (aId !== resolvedMasterId) {
          db.prepare(`
            INSERT OR REPLACE INTO recycle_bin (id, master_id, masterId, systemId, originalId, original_table, data, deleted_at, deleted_by, reason, previous_status)
            VALUES (?, ?, ?, ?, ?, 'cases', ?, ?, ?, ?, ?)
          `).run(
            aId,
            resolvedMasterId,
            resolvedMasterId,
            resolvedMasterId,
            aId,
            dataJson,
            now,
            performedBy,
            reason,
            previousStatus
          );
        }

        const parsedRecord = JSON.parse(dataJson);
        parsedRecord.id = aId;
        parsedRecord.masterId = resolvedMasterId;
        SystemDataAccess.saveRecord(parsedRecord);

        // Update cases table with hidden fields is_deleted, deleted_at, domain_type, domain_name
        const caseExists = db.prepare("SELECT id FROM cases WHERE id = ?").get(aId);
        if (caseExists) {
          db.prepare(`
            UPDATE cases 
            SET is_deleted = 1, deleted_at = ?, deleted_by = ?, delete_reason = ?, domain_type = ?, domain_name = ?
            WHERE id = ?
          `).run(now, performedBy, reason, domainType, domainName, aId);
            console.log(`[TRASH DEBUG] Updated is_deleted=1 in cases table for ID: ${aId}`);
        } else if (aId === resolvedMasterId) {
          db.prepare(`
            INSERT INTO cases (id, name, client, fee, is_deleted, deleted_at, deleted_by, delete_reason, domain_type, domain_name)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
          `).run(
            resolvedMasterId,
            trashedData.title || trashedData.name || `Hồ sơ ${resolvedMasterId}`,
            trashedData.client || "",
            Number(trashedData.revenue || trashedData.feeAmount || 0),
            now,
            performedBy,
            reason,
            domainType,
            domainName
          );
            console.log(`[TRASH DEBUG] Inserted soft-deleted record in cases table for ID: ${resolvedMasterId}`);
        }

        // TỰ ĐỘNG DỌN DẸP FILE ĐÍNH KÈM VẬT LÝ VÀ CHUYỂN TRẠNG THÁI TÀI LIỆU SANG XÓA MỀM (DOCUMENT Subsystem Cleanup)
        try {
          const uploadDir = process.env.UPLOAD_DIR || "/app/uploads";

          // 1. Quét bảng legal_documents
          const legalDocs = db.prepare("SELECT id, file_path FROM legal_documents WHERE case_id = ? AND is_deleted = 0").all(aId) as any[];
          for (const docRow of legalDocs) {
            if (docRow.file_path) {
              const absPath = path.resolve(uploadDir, path.basename(docRow.file_path));
              if (fs.existsSync(absPath)) {
                try {
                  fs.unlinkSync(absPath);
                    console.log(`[AI Document Cleanup] Deleted physical document from legal_documents: ${absPath}`);
                } catch (unlinkErr) {}
              }
            }
          }
          db.prepare("UPDATE legal_documents SET is_deleted = 1, deleted_at = ?, deleted_by = ? WHERE case_id = ?").run(now, performedBy, aId);

          // 2. Quét bảng files (chứa hồ sơ scan đính kèm)
          const filesRows = db.prepare("SELECT id, path FROM files WHERE case_id = ? AND is_deleted = 0").all(aId) as any[];
          for (const fRow of filesRows) {
            if (fRow.path) {
              const absPath = path.resolve(uploadDir, path.basename(fRow.path));
              if (fs.existsSync(absPath)) {
                try {
                  fs.unlinkSync(absPath);
                    console.log(`[AI Document Cleanup] Deleted physical file from files: ${absPath}`);
                } catch (unlinkErr) {}
              }
            }
          }
          db.prepare("UPDATE files SET is_deleted = 1, deleted_at = ?, deleted_by = ?, delete_reason = ? WHERE case_id = ?").run(now, performedBy, reason, aId);

        } catch (cleanupErr) {
          console.error("[AI Document Cleanup Error] Failed to auto cleanup physical files:", cleanupErr);
        }
      }
    });

    try {
      softDeleteTx();
        console.log(`[TRASH DEBUG] Soft delete transaction committed successfully for ${resolvedMasterId}`);
    } catch (txErr) {
      console.error("[TRASH DEBUG] Soft delete transaction failed, rolled back:", txErr);
      throw txErr;
    }

    // Sync to Firestore & write audit log (post-commit)
    for (const aId of aliasIds) {
      try {
        const domain = mapCategoryToDomain(trashedData.practice_area || trashedData.category);
        await syncRowToFirestore(`${domain}_cases`, aId);
        await syncRowToFirestore("recycle_bin", aId);
        await syncRowToFirestore("cases", aId);
      } catch (fsErr) {
        console.error("[TrashService] Firestore sync error for id:", aId, fsErr);
      }
    }

    // Write audit log
    this.logAudit({
      action: "DELETE_CASE",
      entityType: "erp_records",
      entityId: resolvedMasterId,
      performedBy: performedBy,
      performedAt: now,
      reason: reason,
      result: "SUCCESS",
      details: { title: trashedData.title, client: trashedData.client, previousStatus, aliasIds }
    });

      console.log(`[TRASH DEBUG] softDelete process completed successfully for ID: ${stringId}`);
    return trashedData;
  }

  /**
   * Soft Delete a Chat Channel (Hoạt động -> TRASHED in Recycle Bin)
   */
  static async softDeleteChannel(
    channelId: string | number,
    performedBy: string,
    reason: string = "Người dùng thực hiện xóa kênh trò chuyện"
  ): Promise<any> {
    const sId = String(channelId);
    const now = new Date().toISOString();

    const chanRow = db.prepare("SELECT * FROM chat_channels WHERE id = ?").get(channelId) as any;
    if (!chanRow) {
      throw new Error("Không tìm thấy kênh trò chuyện để xóa");
    }

    const chanData = {
      ...chanRow,
      id: sId,
      title: chanRow.name,
      name: chanRow.name,
      description: chanRow.description,
      is_private: chanRow.is_private,
      category: chanRow.category || "general",
      department: chanRow.department,
      branch: chanRow.branch,
      case_id: chanRow.case_id,
      case_code: chanRow.case_code,
      case_title: chanRow.case_title,
      deleted: true,
      is_deleted: true,
      deletedAt: now,
      deletedBy: performedBy,
      deleteReason: reason,
      status: "TRASHED",
      previousStatus: "Hoạt động"
    };

    db.prepare(`
      UPDATE chat_channels
      SET is_deleted = 1, deleted_at = ?, deleted_by = ?, delete_reason = ?
      WHERE id = ?
    `).run(now, performedBy, reason, channelId);

    db.prepare(`
      INSERT OR REPLACE INTO recycle_bin (id, original_table, data, deleted_at, deleted_by, reason, previous_status)
      VALUES (?, 'chat_channels', ?, ?, ?, ?, 'Hoạt động')
    `).run(sId, JSON.stringify(chanData), now, performedBy, reason);

    // Write audit log
    this.logAudit({
      action: "DELETE_CHAT_CHANNEL",
      entityType: "chat_channels",
      entityId: sId,
      performedBy: performedBy,
      performedAt: now,
      reason: reason,
      result: "SUCCESS",
      details: { name: chanRow.name, category: chanRow.category, case_id: chanRow.case_id }
    });

    // Sync to Firestore
    try {
      await syncRowToFirestore("chat_channels", sId);
      await syncRowToFirestore("recycle_bin", sId);
    } catch (e) {}

    // Emit socket
    if (this.io) {
      try {
        this.io.emit("chat_channel_deleted", { id: sId, channel: chanData });
        this.io.emit("recycle_bin_updated", { action: "add", id: sId });
      } catch (e) {}
    }

    return chanData;
  }

  /**
   * Restore a trashed record (TRASHED -> ACTIVE)
   */
  static async restore(id: string, performedBy: string): Promise<any> {
    const stringId = String(id).trim();
    console.log(`[TRASH DEBUG] restore called for ID: ${stringId}, performedBy: ${performedBy}`);
    let recordData: any = null;

    // 1. Check in recycle_bin table by exact ID or by master_id
    let binRow = db.prepare("SELECT * FROM recycle_bin WHERE id = ?").get(stringId) as any;
    if (!binRow) {
      binRow = db.prepare("SELECT * FROM recycle_bin WHERE master_id = ?").get(stringId) as any;
    }

    if (binRow && binRow.original_table === "chat_channels") {
      let chanData: any = {};
      try {
        chanData = typeof binRow.data === "string" ? JSON.parse(binRow.data) : binRow.data;
      } catch (e) {}

      db.prepare(`
        UPDATE chat_channels 
        SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, delete_reason = NULL 
        WHERE id = ?
      `).run(stringId);

      db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ?").run(stringId, stringId);

      this.logAudit({
        action: "RESTORE_CHAT_CHANNEL",
        entityType: "chat_channels",
        entityId: stringId,
        performedBy: performedBy,
        performedAt: new Date().toISOString(),
        reason: "Khôi phục kênh trò chuyện từ thùng rác",
        result: "SUCCESS",
        details: chanData
      });

      try {
        await deleteFromFirestore("recycle_bin", stringId);
        await syncRowToFirestore("chat_channels", stringId);
      } catch (e) {}

      if (this.io) {
        try {
          this.io.emit("chat_channel_created", { ...chanData, is_deleted: 0 });
          this.io.emit("chat_channel_restored", { id: stringId, channel: chanData });
          this.io.emit("recycle_bin_updated", { action: "restore", id: stringId });
        } catch (e) {}
      }

      return chanData;
    }

    if (binRow && binRow.original_table === "files") {
      db.prepare(`
        UPDATE files 
        SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, delete_reason = NULL 
        WHERE id = ?
      `).run(stringId);

      db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ?").run(stringId, stringId);

      this.logAudit({
        action: "RESTORE_FILE",
        entityType: "files",
        entityId: stringId,
        performedBy: performedBy,
        performedAt: new Date().toISOString(),
        reason: "Khôi phục tệp tin từ thùng rác",
        result: "SUCCESS",
        details: binRow.data
      });

      try {
        return typeof binRow.data === "string" ? JSON.parse(binRow.data) : binRow.data;
      } catch (e) {
        return binRow.data;
      }
    }

    if (binRow && binRow.data) {
      try {
        recordData = JSON.parse(binRow.data);
      } catch (e) {}
    }

    // 1b. Search recycle_bin by scanning JSON if not matched
    if (!recordData) {
      const allBins = db.prepare("SELECT * FROM recycle_bin").all() as any[];
      for (const row of allBins) {
        try {
          const parsed = JSON.parse(row.data);
          if (
            String(parsed.id) === stringId ||
            String(parsed.contractId) === stringId ||
            String(parsed.systemId) === stringId ||
            String(parsed.masterId) === stringId
          ) {
            recordData = parsed;
            break;
          }
        } catch (e) {}
      }
    }

    // 2. Check in erp_records table
    if (!recordData) {
      const existingErp = SystemDataAccess.getRecordById(stringId);
      if (existingErp) {
        recordData = existingErp;
      }
    }

    if (!recordData) {
      throw new Error("Không tìm thấy hồ sơ trong thùng rác hoặc hồ sơ đã hết hạn tự xóa.");
    }

    const previousStatus = recordData.previousStatus || "Đang xử lý";
    const now = new Date().toISOString();

    // Determine resolved masterId with requested high priority
    const resolvedMasterId = String(
      recordData.masterId ||
      recordData.systemId ||
      recordData.id ||
      stringId
    ).trim();
    console.log(`[TRASH DEBUG] restore resolving masterId: ${resolvedMasterId}`);

    // Clean soft delete flags
    const restoredData = {
      ...recordData,
      id: stringId,
      masterId: resolvedMasterId,
      deleted: false,
      is_deleted: false,
      deletedAt: null,
      deleted_at: null,
      deletedBy: null,
      deleted_by: null,
      status: previousStatus === "TRASHED" ? "Đang xử lý" : previousStatus,
      previousStatus: null,
      deleteReason: null
    };

    const aliasIdsRaw = Array.from(
      new Set(
        [
          stringId,
          recordData.id ? String(recordData.id) : null,
          recordData.systemId ? String(recordData.systemId) : null,
          recordData.contractId ? String(recordData.contractId) : null,
          recordData.authContractId ? String(recordData.authContractId) : null,
          resolvedMasterId
        ].filter(Boolean) as string[]
      )
    );

    // Expand to include all possible prefix variations (e.g., HS-test-delete-1, test-delete-1, HS001, HS-001)
    const aliasIdsSet = new Set<string>();
    for (const idVal of aliasIdsRaw) {
      const cleanId = idVal.trim();
      aliasIdsSet.add(cleanId);
      if (cleanId.startsWith("HS-")) {
        aliasIdsSet.add(cleanId.substring(3));
        aliasIdsSet.add("HS" + cleanId.substring(3));
      } else if (cleanId.toUpperCase().startsWith("HS")) {
        const withoutHS = cleanId.substring(2);
        aliasIdsSet.add(withoutHS);
        if (withoutHS.startsWith("-")) {
          aliasIdsSet.add(withoutHS.substring(1));
        } else {
          aliasIdsSet.add("HS-" + withoutHS);
        }
      } else {
        aliasIdsSet.add(`HS-${cleanId}`);
        aliasIdsSet.add(`HS${cleanId}`);
      }
    }
    const aliasIds = Array.from(aliasIdsSet);
    console.log("[TRASH DEBUG] List of associated alias IDs to restore and clean up:", aliasIds);

    // Comprehensive cleanup from recycle_bin for all alias IDs and master ID
    db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ? OR masterId = ? OR systemId = ?").run(
      resolvedMasterId,
      resolvedMasterId,
      resolvedMasterId,
      resolvedMasterId
    );

    for (const aId of aliasIds) {
      db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ? OR masterId = ? OR systemId = ?").run(
        aId,
        aId,
        aId,
        aId
      );

      // Restore record details specific to this loop alias ID
      const activeRecord = { ...restoredData, id: aId };
      // Update erp_records
      SystemDataAccess.saveRecord(activeRecord);

      // Update or insert into cases table
      const caseName = restoredData.title || restoredData.description?.slice(0, 50) || `Hồ sơ ${aId}`;
      const client = restoredData.client || "Chưa rõ";
      const fee = Number(restoredData.feeAmount || restoredData.revenue || 0);

      try {
        const caseExists = db.prepare("SELECT id FROM cases WHERE id = ?").get(aId);
        if (caseExists) {
          db.prepare(`
            UPDATE cases 
            SET name = ?, client = ?, fee = ?, is_deleted = 0, deleted_at = NULL, deleted_by = NULL, delete_reason = NULL
            WHERE id = ?
          `).run(caseName, client, fee, aId);
          console.log(`[TRASH DEBUG] Restored (updated is_deleted=0) in cases table for ID: ${aId}`);
        } else {
          db.prepare(`
            INSERT INTO cases (id, name, client, fee, is_deleted, deleted_at, deleted_by, delete_reason) 
            VALUES (?, ?, ?, ?, 0, NULL, NULL, NULL)
          `).run(aId, caseName, client, fee);
          console.log(`[TRASH DEBUG] Restored (inserted is_deleted=0) in cases table for ID: ${aId}`);
        }

        // Restore associated files and legal_documents
        db.prepare("UPDATE legal_documents SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL WHERE case_id = ?").run(aId);
        db.prepare("UPDATE files SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, delete_reason = NULL WHERE case_id = ?").run(aId);
        console.log(`[TRASH DEBUG] Restored associated legal_documents and files for ID: ${aId}`);

      } catch (caseErr) {
        console.error("[TrashService] Error updating cases and associated docs for restore:", caseErr);
      }

      // Sync with Firestore
      try {
        const domain = mapCategoryToDomain(restoredData.category || restoredData.practice_area);
        await syncRowToFirestore(`${domain}_cases`, aId);
        await syncRowToFirestore("cases", aId);
        await deleteFromFirestore("recycle_bin", aId);
        console.log(`[TRASH DEBUG] Synced restored ID ${aId} to Firestore.`);
      } catch (fsErr) {
        console.error("[TrashService] Firestore sync restore error:", fsErr);
      }
    }

    // Also ensure all related erp_records are marked active
    try {
      const allErp = SystemDataAccess.getAllRecords();
      for (const erp of allErp) {
        if (erp.id === resolvedMasterId || erp.masterId === resolvedMasterId || erp.systemId === resolvedMasterId || aliasIds.includes(String(erp.id))) {
          SystemDataAccess.saveRecord({
            ...erp,
            deleted: false,
            is_deleted: false,
            deletedAt: null,
            deleted_at: null,
            deletedBy: null,
            deleted_by: null,
            status: "Đang xử lý",
            previousStatus: null,
            deleteReason: null
          });
        }
      }
    } catch (erpUpdErr) {}

    // Write audit log
    this.logAudit({
      action: "RESTORE_CASE",
      entityType: "erp_records",
      entityId: stringId,
      performedBy: performedBy,
      performedAt: now,
      reason: "Khôi phục hồ sơ từ thùng rác",
      result: "SUCCESS",
      details: { title: restoredData.title, client: restoredData.client, restoredStatus: restoredData.status }
    });

    console.log(`[TRASH DEBUG] restore process completed successfully for ID: ${stringId}`);
    return restoredData;
  }

  /**
   * Permanent Delete (Recycle Bin / TRASHED -> PERMANENTLY_DELETED)
   */
  static async permanentDelete(id: string, performedBy: string): Promise<boolean> {
    let stringId = String(id).trim();
    console.log(`[TRASH DEBUG] permanentDelete called for ID: ${stringId}, performedBy: ${performedBy}`);
    const now = new Date().toISOString();

    // Check if it's a file or channel
    let binRow = db.prepare("SELECT * FROM recycle_bin WHERE id = ? OR master_id = ?").get(stringId, stringId) as any;
    if (!binRow) {
      const candidates = new Set<string>([stringId]);
      if (stringId.startsWith("HS-")) {
        candidates.add(stringId.slice(3));
        candidates.add(`HS${stringId.slice(3)}`);
      } else if (stringId.startsWith("HS")) {
        candidates.add(stringId.slice(2).replace(/^[-]/, ""));
        candidates.add(`HS-${stringId.slice(2).replace(/^[-]/, "")}`);
      } else {
        candidates.add(`HS-${stringId}`);
        candidates.add(`HS${stringId}`);
      }
      for (const candidate of candidates) {
        binRow = db.prepare("SELECT * FROM recycle_bin WHERE id = ? OR master_id = ?").get(candidate, candidate) as any;
        if (binRow) {
          stringId = String(binRow.id);
          break;
        }
      }
    }

    if (binRow && binRow.original_table === "chat_channels") {
      let chanData: any = {};
      try {
        chanData = typeof binRow.data === "string" ? JSON.parse(binRow.data) : binRow.data;
      } catch (e) {}

      db.prepare("DELETE FROM chat_channels WHERE id = ?").run(stringId);
      db.prepare("DELETE FROM chat_channel_members WHERE channel_id = ?").run(stringId);
      db.prepare("DELETE FROM chat_messages WHERE channel_id = ?").run(stringId);
      db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ?").run(stringId, stringId);

      this.logAudit({
        action: "PERMANENT_DELETE_CHAT_CHANNEL",
        entityType: "chat_channels",
        entityId: stringId,
        performedBy: performedBy,
        performedAt: now,
        reason: "Xóa vĩnh viễn kênh trò chuyện và toàn bộ lịch sử tin nhắn",
        result: "SUCCESS",
        details: chanData
      });

      try {
        await deleteFromFirestore("recycle_bin", stringId);
        await deleteFromFirestore("chat_channels", stringId);
      } catch (e) {}

      if (this.io) {
        try {
          this.io.emit("chat_channel_permanently_deleted", { id: stringId });
          this.io.emit("recycle_bin_updated", { action: "permanent_delete", id: stringId });
        } catch (e) {}
      }

      return true;
    }

    if (binRow && binRow.original_table === "files") {
      let fileData: any = {};
      try {
        fileData = typeof binRow.data === "string" ? JSON.parse(binRow.data) : binRow.data;
      } catch (e) {}

      // Delete physical file from disk
      try {
        const fileRow = db.prepare("SELECT path FROM files WHERE id = ?").get(stringId) as any;
        const filePath = fileRow?.path || fileData?.path;
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("[TrashService] Error unlinking physical file:", err);
      }

      db.prepare("DELETE FROM files WHERE id = ?").run(stringId);
      db.prepare("DELETE FROM case_text WHERE file_id = ?").run(stringId);
      db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ?").run(stringId, stringId);

      this.logAudit({
        action: "PERMANENT_DELETE_FILE",
        entityType: "files",
        entityId: stringId,
        performedBy: performedBy,
        performedAt: now,
        reason: "Xóa vĩnh viễn tệp tin khỏi hệ thống",
        result: "SUCCESS",
        details: fileData
      });

      return true;
    }

    // Fetch existing info for audit log and aliases before deletion
    let existingInfo: any = null;
    try {
      existingInfo = SystemDataAccess.getRecordById(stringId);
    } catch (e) {}

    if (!existingInfo && binRow && binRow.data) {
      try {
        existingInfo = typeof binRow.data === "string" ? JSON.parse(binRow.data) : binRow.data;
      } catch (e) {}
    }

    const resolvedMasterId = String(
      existingInfo?.masterId ||
      existingInfo?.systemId ||
      existingInfo?.id ||
      stringId
    ).trim();
    console.log(`[TRASH DEBUG] permanentDelete resolvedMasterId: ${resolvedMasterId}`);

    const aliasIdsRaw = Array.from(
      new Set(
        [
          stringId,
          existingInfo?.id ? String(existingInfo.id) : null,
          existingInfo?.systemId ? String(existingInfo.systemId) : null,
          existingInfo?.contractId ? String(existingInfo.contractId) : null,
          existingInfo?.authContractId ? String(existingInfo.authContractId) : null,
          resolvedMasterId
        ].filter(Boolean) as string[]
      )
    );

    // Expand to include all possible prefix variations (e.g., HS-test-delete-1, test-delete-1, HS001, HS-001)
    const aliasIdsSet = new Set<string>();
    for (const idVal of aliasIdsRaw) {
      const cleanId = idVal.trim();
      aliasIdsSet.add(cleanId);
      if (cleanId.startsWith("HS-")) {
        aliasIdsSet.add(cleanId.substring(3));
        aliasIdsSet.add("HS" + cleanId.substring(3));
      } else if (cleanId.toUpperCase().startsWith("HS")) {
        const withoutHS = cleanId.substring(2);
        aliasIdsSet.add(withoutHS);
        if (withoutHS.startsWith("-")) {
          aliasIdsSet.add(withoutHS.substring(1));
        } else {
          aliasIdsSet.add("HS-" + withoutHS);
        }
      } else {
        aliasIdsSet.add(`HS-${cleanId}`);
        aliasIdsSet.add(`HS${cleanId}`);
      }
    }
    const aliasIds = Array.from(aliasIdsSet);
    console.log("[TRASH DEBUG] List of associated alias IDs to physically delete:", aliasIds);

    // Delete all related records from recycle_bin table
    db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ? OR masterId = ? OR systemId = ?").run(
      resolvedMasterId,
      resolvedMasterId,
      resolvedMasterId,
      resolvedMasterId
    );

    for (const aId of aliasIds) {
      // Physical deletion from all relevant tables
      db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ? OR masterId = ? OR systemId = ?").run(
        aId,
        resolvedMasterId,
        resolvedMasterId,
        resolvedMasterId
      );
      SystemDataAccess.deleteRecord(aId);
      db.prepare("DELETE FROM cases WHERE id = ?").run(aId);
      db.prepare("DELETE FROM files WHERE case_id = ?").run(aId);
      db.prepare("DELETE FROM court_schedule WHERE case_id = ?").run(aId);
      db.prepare("DELETE FROM tasks WHERE employee_id = ?").run(aId);
      db.prepare("DELETE FROM splits WHERE case_id = ?").run(aId);
      db.prepare("DELETE FROM invoices WHERE case_id = ?").run(aId);
      db.prepare("DELETE FROM finance_transactions WHERE description LIKE ? OR description LIKE ?").run(
        `Doanh thu từ hồ sơ ${aId}:%`,
        `Ghi nhận doanh thu từ hồ sơ quét CCCD ${aId}:%`
      );

      // Sync deletion to Firestore
      try {
        await deleteFromFirestore("recycle_bin", aId);
        if (existingInfo) {
          const domain = mapCategoryToDomain(existingInfo.category || existingInfo.practice_area);
          await deleteFromFirestore(`${domain}_cases`, aId);
        }
        await deleteFromFirestore("cases", aId);
      } catch (fsErr) {
        console.error("[TrashService] Firestore permanent delete sync error:", fsErr);
      }
    }

    db.prepare("DELETE FROM cases WHERE id = ?").run(resolvedMasterId);
    SystemDataAccess.deleteRecord(resolvedMasterId);

    // Write audit log
    this.logAudit({
      action: "PERMANENT_DELETE_CASE",
      entityType: "erp_records",
      entityId: stringId,
      performedBy: performedBy,
      performedAt: now,
      reason: "Xóa vĩnh viễn hồ sơ khỏi hệ thống",
      result: "SUCCESS",
      details: existingInfo
    });

    console.log(`[TRASH DEBUG] permanentDelete process completed successfully for ID: ${stringId}`);
    return true;
  }

  /**
   * Synchronizes soft-deleted items across tables (cases, erp_records) into recycle_bin
   */
  static async syncAndBackfillTrash() {
    await this.cleanupExpired(30);

    const seenIds = new Set(
      (db.prepare("SELECT id FROM recycle_bin").all() as any[]).map(r => String(r.id))
    );

    // Check erp_records
    try {
      const allErp = SystemDataAccess.getAllRecords();
      for (const r of allErp) {
        if (r.deleted === true || r.deleted === 1 || r.status === "TRASHED" || (r as any).is_deleted === true || (r as any).is_deleted === 1) {
          const sId = String(r.id);
          if (!seenIds.has(sId)) {
            seenIds.add(sId);
            const delAt = r.deletedAt || (r as any).deleted_at || new Date().toISOString();
            const delBy = r.deletedBy || (r as any).deleted_by || "Quản trị viên";
            const delReason = r.deleteReason || (r as any).delete_reason || "Xóa hồ sơ";
            const prevStatus = r.previousStatus || "Đang xử lý";
            const resolvedMasterId = String(r.masterId || r.systemId || r.id || sId).trim();
            db.prepare(`
              INSERT OR REPLACE INTO recycle_bin (id, master_id, original_table, data, deleted_at, deleted_by, reason, previous_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(sId, resolvedMasterId, "erp_records", JSON.stringify(r), delAt, delBy, delReason, prevStatus);
          }
        }
      }
    } catch (erpErr) {
      console.error("[TrashService] syncAndBackfillTrash erp_records error:", erpErr);
    }

    // Check cases table
    try {
      const trashedCases = db.prepare("SELECT * FROM cases WHERE is_deleted = 1").all() as any[];
      for (const c of trashedCases) {
        const sId = String(c.id);
        if (!seenIds.has(sId)) {
          seenIds.add(sId);
          const caseData = {
            id: sId,
            title: c.name || `Hồ sơ ${sId}`,
            client: c.client || "Chưa rõ",
            feeAmount: c.fee || 0,
            status: "TRASHED",
            deletedAt: c.deleted_at || new Date().toISOString(),
            deletedBy: c.deleted_by || "Quản trị viên",
            deleteReason: c.delete_reason || "Xóa hồ sơ",
            practice_area: "tranh_tung"
          };
          db.prepare(`
            INSERT OR REPLACE INTO recycle_bin (id, master_id, original_table, data, deleted_at, deleted_by, reason, previous_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(sId, sId, "cases", JSON.stringify(caseData), c.deleted_at || new Date().toISOString(), c.deleted_by || "Quản trị viên", c.delete_reason || "Xóa hồ sơ", "Đang xử lý");
        }
      }
    } catch (e) {}

    // Check chat_channels table
    try {
      const trashedChannels = db.prepare("SELECT * FROM chat_channels WHERE is_deleted = 1").all() as any[];
      for (const ch of trashedChannels) {
        const sId = String(ch.id);
        if (!seenIds.has(sId)) {
          seenIds.add(sId);
          const chanData = {
            id: sId,
            title: ch.name || `Kênh ${sId}`,
            name: ch.name,
            description: ch.description,
            is_private: ch.is_private,
            category: ch.category || "general",
            department: ch.department,
            branch: ch.branch,
            case_id: ch.case_id,
            status: "TRASHED",
            deletedAt: ch.deleted_at || new Date().toISOString(),
            deletedBy: ch.deleted_by || "Quản trị viên",
            deleteReason: ch.delete_reason || "Xóa kênh trò chuyện",
            previousStatus: "Hoạt động"
          };
          db.prepare(`
            INSERT OR REPLACE INTO recycle_bin (id, master_id, original_table, data, deleted_at, deleted_by, reason, previous_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(sId, sId, "chat_channels", JSON.stringify(chanData), ch.deleted_at || new Date().toISOString(), ch.deleted_by || "Quản trị viên", ch.delete_reason || "Xóa kênh trò chuyện", "Hoạt động");
        }
      }
    } catch (chanErr) {}
  }

  /**
   * Empty / purge all items in the recycle bin
   */
  static async emptyTrash(performedBy: string = "Quản trị viên") {
    const allBins = db.prepare("SELECT id, master_id, masterId, systemId, data FROM recycle_bin").all() as any[];
    const ids = new Set<string>();

    for (const item of allBins) {
      for (const value of [item.id, item.master_id, item.masterId, item.systemId]) {
        if (value) ids.add(String(value));
      }
      try {
        const data = typeof item.data === "string" ? JSON.parse(item.data) : item.data;
        for (const value of [data?.id, data?.masterId, data?.systemId, data?.contractId, data?.authContractId]) {
          if (value) ids.add(String(value));
        }
      } catch {}
    }

    const deletedCases = db.prepare("SELECT id FROM cases WHERE is_deleted = 1").all() as any[];
    deletedCases.forEach((row) => ids.add(String(row.id)));
    const deletedRecords = db.prepare("SELECT id FROM erp_records WHERE json_extract(data, '$.deleted') IN (1, true) OR json_extract(data, '$.is_deleted') IN (1, true) OR json_extract(data, '$.status') = 'TRASHED'").all() as any[];
    deletedRecords.forEach((row) => ids.add(String(row.id)));

    for (const id of ids) {
      SystemDataAccess.deleteRecord(id);
      db.prepare("DELETE FROM cases WHERE id = ?").run(id);
      db.prepare("DELETE FROM files WHERE case_id = ?").run(id);
      db.prepare("DELETE FROM court_schedule WHERE case_id = ?").run(id);
      db.prepare("DELETE FROM recycle_bin WHERE id = ? OR master_id = ? OR masterId = ? OR systemId = ?").run(id, id, id, id);
      try {
        const sourceData = typeof item.data === "string" ? JSON.parse(item.data) : item.data;
        const domain = mapCategoryToDomain(sourceData?.category || sourceData?.practice_area);
        await deleteFromFirestore("recycle_bin", id);
        await deleteFromFirestore("erp_records", id);
        await deleteFromFirestore("cases", id);
        await deleteFromFirestore(`${domain}_cases`, id);
      } catch (syncError) {
        console.error("[TrashService] Failed to remove purged item from Firestore:", id, syncError);
      }
    }

    const remaining = db.prepare("SELECT COUNT(*) AS count FROM recycle_bin").get() as { count: number };
    db.prepare("DELETE FROM recycle_bin").run();
    this.io?.emit("recycle_bin_updated", { action: "empty_all" });
    this.logAudit({
      action: "EMPTY_RECYCLE_BIN",
      entityType: "recycle_bin",
      entityId: "all",
      performedBy,
      performedAt: new Date().toISOString(),
      reason: "Dọn sạch toàn bộ thùng rác hệ thống",
      result: "SUCCESS",
      details: { deletedIds: Array.from(ids), remainingBeforeCleanup: remaining.count }
    });
    return allBins.length;
  }

  /**
   * List all active items in the Recycle Bin
   */
  static async listTrash(searchQuery: string = ""): Promise<TrashItem[]> {
    // 1. Clean up expired items (> 30 days)
    await this.cleanupExpired(30);

    // 2. Fetch all records from recycle_bin table
    const binRows = db.prepare("SELECT * FROM recycle_bin ORDER BY deleted_at DESC").all() as any[];

    const itemsMap = new Map<string, TrashItem>();
    const seenEntityKeys = new Set<string>();

    for (const r of binRows) {
      try {
        const parsed = typeof r.data === "string" ? JSON.parse(r.data) : (r.data || {});
        const stringId = String(r.id);
        const isCaseRecord = r.original_table !== "files" && r.original_table !== "chat_channels";

        let masterId: string;
        if (!isCaseRecord) {
          masterId = stringId;
        } else {
          const resolved = this.resolveMasterId(parsed, r.masterId || r.master_id || r.systemId || stringId);
          masterId = this.ensureHsPrefix(resolved, parsed);
        }

        if (seenEntityKeys.has(masterId)) continue;
        seenEntityKeys.add(masterId);

        itemsMap.set(masterId, {
          id: masterId,
          originalTable: r.original_table || "cases",
          data: { ...parsed, id: masterId, masterId: masterId, systemId: masterId },
          deletedAt: r.deleted_at || parsed.deletedAt || new Date().toISOString(),
          deletedBy: r.deleted_by || parsed.deletedBy || "Chưa rõ",
          reason: r.reason || parsed.deleteReason || "Xóa hồ sơ",
          previousStatus: r.previous_status || parsed.previousStatus || "Đang xử lý"
        });
      } catch (err) {
        console.error("[TrashService] Error parsing recycle_bin row:", err);
      }
    }

    // 3. Also check cases table for any rows with is_deleted = 1
    try {
      const trashedCases = db.prepare("SELECT * FROM cases WHERE is_deleted = 1").all() as any[];
      for (const c of trashedCases) {
        const stringId = String(c.id);
        const masterId = this.ensureHsPrefix(stringId, c);
        if (seenEntityKeys.has(masterId)) continue;
        seenEntityKeys.add(masterId);

        const caseData = {
          id: masterId,
          masterId: masterId,
          systemId: masterId,
          title: c.name || `Hồ sơ ${masterId}`,
          client: c.client || "Chưa rõ",
          feeAmount: c.fee || 0,
          status: "TRASHED",
          deletedAt: c.deleted_at || new Date().toISOString(),
          deletedBy: c.deleted_by || "Chưa rõ",
          deleteReason: c.delete_reason || "Xóa hồ sơ",
          practice_area: "tranh_tung"
        };
        itemsMap.set(masterId, {
          id: masterId,
          originalTable: "cases",
          data: caseData,
          deletedAt: c.deleted_at || new Date().toISOString(),
          deletedBy: c.deleted_by || "Chưa rõ",
          reason: c.delete_reason || "Xóa hồ sơ",
          previousStatus: "Đang xử lý"
        });
      }
    } catch (casesQueryErr) {}

    // 4. Also check chat_channels table for any rows with is_deleted = 1
    try {
      const trashedChannels = db.prepare("SELECT * FROM chat_channels WHERE is_deleted = 1").all() as any[];
      for (const ch of trashedChannels) {
        const stringId = String(ch.id);
        if (seenEntityKeys.has(stringId)) continue;
        seenEntityKeys.add(stringId);

        const chanData = {
          id: stringId,
          title: ch.name || `Kênh ${stringId}`,
          name: ch.name,
          description: ch.description,
          is_private: ch.is_private,
          category: ch.category || "general",
          department: ch.department,
          branch: ch.branch,
          case_id: ch.case_id,
          status: "TRASHED",
          deletedAt: ch.deleted_at || new Date().toISOString(),
          deletedBy: ch.deleted_by || "Chưa rõ",
          deleteReason: ch.delete_reason || "Xóa kênh trò chuyện",
          previousStatus: "Hoạt động"
        };
        itemsMap.set(stringId, {
          id: stringId,
          originalTable: "chat_channels",
          data: chanData,
          deletedAt: ch.deleted_at || new Date().toISOString(),
          deletedBy: ch.deleted_by || "Chưa rõ",
          reason: ch.delete_reason || "Xóa kênh trò chuyện",
          previousStatus: "Hoạt động"
        });
      }
    } catch (chanErr) {}

    let items = Array.from(itemsMap.values());
    items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(it => 
        it.id.toLowerCase().includes(q) ||
        (it.data?.title || "").toLowerCase().includes(q) ||
        (it.data?.client || "").toLowerCase().includes(q)
      );
    }

    console.log(`[TrashService] Returning ${items.length} trash items`);
    return items;
  }
}

export default TrashService;
