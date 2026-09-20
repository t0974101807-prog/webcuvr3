import db from "./database";
import { SystemDataAccess, mapCategoryToDomain } from "../system/data-access/SystemDataAccess";
import { LitigationRepository } from "../modules/litigation/repositories/LitigationRepository";
import { ConsultationRepository } from "../modules/consultation/repositories/ConsultationRepository";
import { RepresentationRepository } from "../modules/representation/repositories/RepresentationRepository";
import { ComplianceRepository } from "../modules/compliance/repositories/ComplianceRepository";
import { ArbitrationRepository } from "../modules/arbitration/repositories/ArbitrationRepository";

export function runMigration() {
  console.log("=== STARTING LEGACY DATA MIGRATION ===");
  
  // Check if erp_records exists in the main database
  let tableExists = false;
  try {
    const check = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='erp_records'").get();
    if (check) tableExists = true;
  } catch (err) {
    console.error("Error checking for legacy erp_records table:", err);
  }

  if (!tableExists) {
    console.log("Legacy erp_records table not found. No migration required.");
    return;
  }

  let legacyRows: { id: string; data: string }[] = [];
  try {
    legacyRows = db.prepare("SELECT id, data FROM erp_records").all() as { id: string; data: string }[];
  } catch (err) {
    console.error("Error reading erp_records for migration:", err);
    return;
  }

  if (legacyRows.length === 0) {
    console.log("Legacy erp_records table is empty. No data to migrate.");
    return;
  }

  console.log(`Found ${legacyRows.length} legacy records to migrate.`);

  // Calculate old counts per domain and track legacy IDs to validate migration accurately.
  const oldCounts: Record<string, number> = {
    litigation: 0,
    consultation: 0,
    representation: 0,
    compliance: 0,
    arbitration: 0
  };
  const oldIdsByDomain: Record<string, Set<string>> = {
    litigation: new Set(),
    consultation: new Set(),
    representation: new Set(),
    compliance: new Set(),
    arbitration: new Set()
  };

  for (const row of legacyRows) {
    try {
      const item = JSON.parse(row.data);
      const domain = mapCategoryToDomain(item.category || item.practice_area);
      if (oldCounts[domain] !== undefined) {
        oldCounts[domain]++;
        const recordId = String(item.id || item.systemId || row.id || "").trim();
        if (recordId) oldIdsByDomain[domain].add(recordId);
      }
      // Save to correct domain database
      SystemDataAccess.saveRecord(item);
    } catch (parseErr) {
      console.error(`Failed to parse/migrate record ID: ${row.id}`, parseErr);
    }
  }

  console.log("Migration finished. Starting Verification Phase...");

  // Count new records in each domain database and validate against original legacy IDs.
  const newCounts: Record<string, number> = {
    litigation: LitigationRepository.getAll().length,
    consultation: ConsultationRepository.getAll().length,
    representation: RepresentationRepository.getAll().length,
    compliance: ComplianceRepository.getAll().length,
    arbitration: ArbitrationRepository.getAll().length
  };
  const newIdsByDomain: Record<string, Set<string>> = {
    litigation: new Set(LitigationRepository.getAll().map((item: any) => String(item.id || item.systemId || "").trim()).filter(Boolean)),
    consultation: new Set(ConsultationRepository.getAll().map((item: any) => String(item.id || item.systemId || "").trim()).filter(Boolean)),
    representation: new Set(RepresentationRepository.getAll().map((item: any) => String(item.id || item.systemId || "").trim()).filter(Boolean)),
    compliance: new Set(ComplianceRepository.getAll().map((item: any) => String(item.id || item.systemId || "").trim()).filter(Boolean)),
    arbitration: new Set(ArbitrationRepository.getAll().map((item: any) => String(item.id || item.systemId || "").trim()).filter(Boolean))
  };

  // Verification Report
  console.log("\n============================================================");
  console.log("MIGRATION INTEGRITY REPORT");
  console.log("============================================================");
  
  let totalMismatch = 0;
  for (const domain of Object.keys(oldCounts)) {
    const oldVal = oldCounts[domain];
    const newVal = newCounts[domain];
    const legacyIds = oldIdsByDomain[domain];
    const migratedIds = newIdsByDomain[domain];
    const matchedLegacy = Array.from(legacyIds).filter((id) => id && migratedIds.has(id)).length;
    const missingLegacy = Math.max(0, legacyIds.size - matchedLegacy);
    const mismatch = missingLegacy;
    totalMismatch += mismatch;
    console.log(`${domain.toUpperCase()}:`);
    console.log(`  OLD COUNT: ${oldVal}`);
    console.log(`  NEW COUNT: ${newVal}`);
    console.log(`  MISSING LEGACY IDS: ${missingLegacy}`);
    console.log(`  MISMATCH : ${mismatch === 0 ? "0 (✓ MATCHED)" : mismatch + " (❌ MISMATCH)"}`);
  }

  console.log("============================================================");
  if (totalMismatch === 0) {
    console.log("STATUS: SUCCESS - All records migrated and verified successfully.");
  } else {
    console.warn("STATUS: PARTIALLY COMPLETE - Mismatches detected. Please inspect.");
  }
  console.log("============================================================\n");
}
