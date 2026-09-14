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

  // Calculate old counts per domain
  const oldCounts: Record<string, number> = {
    litigation: 0,
    consultation: 0,
    representation: 0,
    compliance: 0,
    arbitration: 0
  };

  for (const row of legacyRows) {
    try {
      const item = JSON.parse(row.data);
      const domain = mapCategoryToDomain(item.category || item.practice_area);
      if (oldCounts[domain] !== undefined) {
        oldCounts[domain]++;
      }
      // Save to correct domain database
      SystemDataAccess.saveRecord(item);
    } catch (parseErr) {
      console.error(`Failed to parse/migrate record ID: ${row.id}`, parseErr);
    }
  }

  console.log("Migration finished. Starting Verification Phase...");

  // Count new records in each domain database
  const newCounts: Record<string, number> = {
    litigation: LitigationRepository.getAll().length,
    consultation: ConsultationRepository.getAll().length,
    representation: RepresentationRepository.getAll().length,
    compliance: ComplianceRepository.getAll().length,
    arbitration: ArbitrationRepository.getAll().length
  };

  // Verification Report
  console.log("\n============================================================");
  console.log("MIGRATION INTEGRITY REPORT");
  console.log("============================================================");
  
  let totalMismatch = 0;
  for (const domain of Object.keys(oldCounts)) {
    const oldVal = oldCounts[domain];
    const newVal = newCounts[domain];
    const mismatch = Math.abs(oldVal - newVal);
    totalMismatch += mismatch;
    console.log(`${domain.toUpperCase()}:`);
    console.log(`  OLD COUNT: ${oldVal}`);
    console.log(`  NEW COUNT: ${newVal}`);
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
