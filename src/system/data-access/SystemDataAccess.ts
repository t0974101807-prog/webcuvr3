import type { RecordItem } from "../../domain/shared";
import { LitigationRepository } from "../../modules/litigation/repositories/LitigationRepository";
import { ConsultationRepository } from "../../modules/consultation/repositories/ConsultationRepository";
import { RepresentationRepository } from "../../modules/representation/repositories/RepresentationRepository";
import { ComplianceRepository } from "../../modules/compliance/repositories/ComplianceRepository";
import { ArbitrationRepository } from "../../modules/arbitration/repositories/ArbitrationRepository";
import db from "../../db/database";
import { emitDomainRecordChange } from "../../domain/events/domainRecordEvents";

export const DOMAINS = ["litigation", "consultation", "representation", "compliance", "arbitration"];

export function normalizeCategoryText(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapCategoryToDomain(categoryOrArea: string | undefined): string {
  const normalized = normalizeCategoryText(categoryOrArea);
  if (!normalized) return "litigation";

  const domainRules: Record<string, string[]> = {
    arbitration: [
      "trong tai",
      "hoa giai",
      "arbitration",
      "mediation",
      "tranh chap trong tai",
      "trong tai hoa giai"
    ],
    compliance: [
      "phap che",
      "compliance",
      "tuan thu",
      "tuan thu phap luat",
      "noi bo",
      "risk management",
      "kiem soat rui ro",
      "phap che noi bo"
    ],
    representation: [
      "dai dien",
      "dai dien ngoai to tung",
      "representation",
      "ngoai to tung",
      "dai dien khach hang",
      "ngoai to"
    ],
    consultation: [
      "tu van",
      "tu van phap ly",
      "consultation",
      "counseling",
      "phap ly",
      "tu van doanh nghiep",
      "hoi dong phap ly"
    ],
    litigation: [
      "tranh tung",
      "litigation",
      "hinh su",
      "dan su",
      "hinh su dan su",
      "hanh chinh",
      "khieu nai",
      "phuc tham",
      "danh gia",
      "tranh chap",
      "cong ty"
    ]
  };

  for (const [domain, keywords] of Object.entries(domainRules)) {
    if (keywords.some(keyword => normalized.includes(keyword))) return domain;
  }

  return "litigation";
}

export class SystemDataAccess {
  public static getAllRecords(domains: string[] = DOMAINS): RecordItem[] {
    let all: RecordItem[] = [];
    for (const d of domains) {
      try {
        if (d === "litigation") all = all.concat(LitigationRepository.getAll());
        else if (d === "consultation") all = all.concat(ConsultationRepository.getAll());
        else if (d === "representation") all = all.concat(RepresentationRepository.getAll());
        else if (d === "compliance") all = all.concat(ComplianceRepository.getAll());
        else if (d === "arbitration") all = all.concat(ArbitrationRepository.getAll());
      } catch (err) {
        console.error(`Fault Isolation: Failed to fetch records from domain "${d}"`, err);
      }
    }
    return all;
  }

  public static getRecordById(id: string): RecordItem | null {
    for (const d of DOMAINS) {
      try {
        let record: RecordItem | null = null;
        if (d === "litigation") record = LitigationRepository.getById(id);
        else if (d === "consultation") record = ConsultationRepository.getById(id);
        else if (d === "representation") record = RepresentationRepository.getById(id);
        else if (d === "compliance") record = ComplianceRepository.getById(id);
        else if (d === "arbitration") record = ArbitrationRepository.getById(id);
        
        if (record) return record;
      } catch (err) {
        console.error(`Fault Isolation: Failed to getRecordById from domain "${d}"`, err);
      }
    }
    return null;
  }

  public static findRecordByToken(token: string): RecordItem | null {
    const normalizedToken = String(token || "").trim();
    if (!normalizedToken) return null;
    const exact = this.getRecordById(normalizedToken);
    if (exact) return exact;

    return this.getAllRecords().find((record: any) =>
      String(record.id || "") === normalizedToken ||
      String(record.systemId || "") === normalizedToken ||
      String(record.contractId || "") === normalizedToken ||
      JSON.stringify(record).includes(normalizedToken)
    ) || null;
  }

  public static saveRecord(record: RecordItem): void {
    const category = record.category || record.practice_area;
    const domain = mapCategoryToDomain(category);
    try {
      if (domain === "litigation") LitigationRepository.save(record);
      else if (domain === "consultation") ConsultationRepository.save(record);
      else if (domain === "representation") RepresentationRepository.save(record);
      else if (domain === "compliance") ComplianceRepository.save(record);
      else if (domain === "arbitration") ArbitrationRepository.save(record);
    } catch (err) {
      console.error(`Failed to save record to domain "${domain}"`, err);
      throw err;
    }

    // Write-through cache to legacy table for backward compatibility
    try {
      db.prepare(`INSERT INTO erp_records (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`).run(record.id, JSON.stringify(record));
    } catch (e: any) {
      console.warn("Write-through to legacy erp_records table skipped or failed:", e.message);
    }

    emitDomainRecordChange({
      action: "upsert",
      domain,
      id: String(record.id),
      data: record,
    });
  }

  public static deleteRecord(id: string): void {
    const stringId = String(id).trim();
    // Delete from all specialized/domain repositories unconditionally
    try { LitigationRepository.delete(stringId); } catch (e) { console.error("Failed to delete from LitigationRepository:", e); }
    try { ConsultationRepository.delete(stringId); } catch (e) { console.error("Failed to delete from ConsultationRepository:", e); }
    try { RepresentationRepository.delete(stringId); } catch (e) { console.error("Failed to delete from RepresentationRepository:", e); }
    try { ComplianceRepository.delete(stringId); } catch (e) { console.error("Failed to delete from ComplianceRepository:", e); }
    try { ArbitrationRepository.delete(stringId); } catch (e) { console.error("Failed to delete from ArbitrationRepository:", e); }
    
    // Delete from legacy erp_records cache
    try {
      db.prepare(`DELETE FROM erp_records WHERE id = ?`).run(stringId);
    } catch (e) {}

    emitDomainRecordChange({
      action: "delete",
      domain: "federated",
      id: stringId,
    });
  }

  public static queryFederated(options: {
    category?: string;
    search?: string;
    branch?: string;
    mainAssignee?: string;
    status?: string;
    priority?: string;
    activeTab?: string;
    includeTrashed?: boolean;
    canViewAll?: boolean;
    userName?: string;
    sortBy?: string;
    limit?: number;
    cursorPayload?: any;
  }): { records: RecordItem[]; nextCursor: string | null; hasNextPage: boolean } {
    let selectedDomains = DOMAINS;
    if (options.category && options.category !== "Tất cả" && options.category !== "All" && options.category !== "Chọn nhóm hồ sơ" && options.category !== "Select Category") {
      selectedDomains = [mapCategoryToDomain(options.category)];
    } else if (options.activeTab === "litigation") {
      selectedDomains = ["litigation"];
    } else if (options.activeTab === "records") {
      selectedDomains = DOMAINS;
    } else if (options.activeTab === "specialized_records") {
      selectedDomains = ["consultation", "representation", "compliance", "arbitration"];
    } else if (["consultation", "representation", "compliance", "arbitration"].includes(options.activeTab || "")) {
      selectedDomains = [options.activeTab!];
    }

    let records = this.getAllRecords(selectedDomains);

    records = records.filter(r => {
      const isTrashed = r.deleted === 1 || r.deleted === true || r.status === "TRASHED" || (r as any).is_deleted === 1 || (r as any).is_deleted === true;
      if (options.includeTrashed) {
        if (!isTrashed) return false;
      } else {
        if (isTrashed) return false;
      }

      if (options.canViewAll === false && options.userName) {
        const name = options.userName;
        const matchesAssignee = r.mainAssignee === name || r.client === name || (r as any).relatedStaff?.includes(name);
        if (!matchesAssignee) return false;
      }

      if (options.search && options.search.trim()) {
        const query = options.search.toLowerCase().trim();
        const match =
          r.id.toLowerCase().includes(query) ||
          (r.title && r.title.toLowerCase().includes(query)) ||
          (r.client && r.client.toLowerCase().includes(query)) ||
          (r.mainAssignee && r.mainAssignee.toLowerCase().includes(query)) ||
          (r.clientIdCard && r.clientIdCard.toLowerCase().includes(query)) ||
          (r.contractId && r.contractId.toLowerCase().includes(query));
        if (!match) return false;
      }

      if (options.branch && options.branch !== "Tất cả" && options.branch !== "All" && options.branch !== "Chọn chi nhánh" && options.branch !== "Select Branch") {
        if (r.branch !== options.branch) return false;
      }

      if (options.mainAssignee && options.mainAssignee !== "Tất cả" && options.mainAssignee !== "All") {
        if (r.mainAssignee !== options.mainAssignee) return false;
      }

      if (options.status && options.status !== "Tất cả" && options.status !== "All") {
        if (r.status !== options.status) return false;
      }

      if (options.priority && options.priority !== "Tất cả" && options.priority !== "All") {
        if ((r as any).priority !== options.priority) return false;
      }

      if (options.activeTab && options.activeTab !== "all" && options.activeTab !== "all_cases") {
        if (options.activeTab === "overdue") {
          const notDone = r.status !== "Hoàn thành" && r.status !== "Completed";
          if (!notDone) return false;
          const deadline = (r as any).deadline;
          if (!deadline) return false;
          let deadlineDateStr = "";
          if (deadline.includes("-")) {
            deadlineDateStr = deadline;
          } else if (deadline.includes("/")) {
            const parts = deadline.split("/");
            if (parts.length === 3) {
              deadlineDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
          if (!deadlineDateStr) return false;
          const deadlineDate = new Date(deadlineDateStr);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          if (deadlineDate >= now) return false;
        } else if (options.activeTab === "active") {
          if (r.status === "Hoàn thành" || r.status === "Completed") return false;
        } else if (options.activeTab === "unread") {
          if (r.viewed !== false && !(r as any).unread) return false;
        } else if (options.activeTab === "high") {
          const p = String((r as any).priority || "").toLowerCase();
          if (!p.includes("cao") && !p.includes("khẩn") && !p.includes("high")) return false;
        } else if (
          !["records", "litigation", "specialized_records", "consultation", "representation", "compliance", "arbitration"].includes(options.activeTab)
        ) {
          if (r.status !== options.activeTab) return false;
        }
      }

      return true;
    });

    const sortBy = options.sortBy || "newest";
    records.sort((a, b) => {
      const idA = a && a.id !== undefined && a.id !== null ? String(a.id) : "";
      const idB = b && b.id !== undefined && b.id !== null ? String(b.id) : "";

      if (sortBy === "deadline") {
        const d1 = String((a as any)?.deadline || "9999-12-31");
        const d2 = String((b as any)?.deadline || "9999-12-31");
        return d1.localeCompare(d2) || idA.localeCompare(idB);
      } else {
        const t1 = String(a?.created_at || a?.date || (a as any)?.receiveDate || "");
        const t2 = String(b?.created_at || b?.date || (b as any)?.receiveDate || "");
        if (sortBy === "oldest") {
          return t1.localeCompare(t2) || idA.localeCompare(idB);
        } else {
          return t2.localeCompare(t1) || idB.localeCompare(idA);
        }
      }
    });

    if (options.cursorPayload) {
      const { id: cursorId } = options.cursorPayload;
      const idx = records.findIndex(r => r.id === cursorId);
      if (idx !== -1) {
        records = records.slice(idx + 1);
      }
    }

    const limit = options.limit || 20;
    const hasNextPage = records.length > limit;
    const paginatedRecords = records.slice(0, limit);

    let nextCursor: string | null = null;
    if (hasNextPage && paginatedRecords.length > 0) {
      const lastRecord = paginatedRecords[paginatedRecords.length - 1];
      const sortValue = sortBy === "deadline" ? ((lastRecord as any).deadline || "") : (lastRecord.created_at || lastRecord.date || (lastRecord as any).receiveDate || "");
      
      const payload = {
        sortBy,
        sortValue,
        id: lastRecord.id
      };
      nextCursor = Buffer.from(JSON.stringify(payload)).toString("base64");
    }

    return {
      records: paginatedRecords,
      nextCursor,
      hasNextPage
    };
  }
}
