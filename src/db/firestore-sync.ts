import { db as firestoreDb } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import db from "./database";
import { 
  getLitigationDb, 
  getConsultationDb, 
  getRepresentationDb, 
  getComplianceDb, 
  getArbitrationDb 
} from "./DatabaseManager";

// Define the tables we want to sync
const TABLES_TO_SYNC = [
  "employees",
  "clients",
  "cases",
  "splits",
  "payrolls",
  "monthly_payrolls",
  "evaluations",
  "files",
  "case_text",
  "court_schedule",
  "tasks",
  "invoices",
  "audit_logs",
  "services",
  "legal_services",
  "team",
  "recruitment",
  "recruitment_benefits",
  "recruitment_process",
  "news",
  "legal_forms",
  "judgments",
  "precedents",
  "testimonials",
  "messages",
  "visitor_stats",
  "record_types",
  "erp_records",
  "legal_documents_history",
  "role_permissions",
  "record_messages",
  "live_messages",
  "users",
  "legal_documents",
  "offices",
  "contact_settings",
  "attendance",
  "report_unlock_requests",
  "land_prices",
  "subdivision_limits",
  "land_documents",
  "hr_departments",
  "hr_positions",
  "hr_shifts",
  "hr_attendance",
  "hr_leave_requests",
  "hr_payrolls",
  "hr_performances",
  "hr_contracts",
  "hr_equipment",
  "hr_training",
  "hr_recruitment",
  "hr_workflows",
  "hr_business_trips",
  "hr_overtimes",
  "settings",
  "ai_providers",
  "ai_models",
  "ai_logs",
  "payments",
  "payment_schedules",
  "payment_transactions",
  "payment_events",
  "receipts",
  "case_qr_tokens",
  "qc_rules",
  "qc_records",
  "finance_transactions",
  "company_assets",
  "company_debts",
  "tax_reports",
  "budget_plans",
  "salary_payment_orders",
  "voip_calls",
  "system_performance_metrics",
  "quality_assurance_evaluations",
  "gmail_accounts",
  "recycle_bin",
  
  // Collaborative Chat Tables
  "chat_channels",
  "chat_channel_members",
  "chat_messages",
  "chat_reactions",

  // Isolated Domain Case Tables
  "litigation_cases",
  "consultation_cases",
  "representation_cases",
  "compliance_cases",
  "arbitration_cases"
];

function getDbForTable(tableName: string) {
  if (tableName === "litigation_cases") return getLitigationDb();
  if (tableName === "consultation_cases") return getConsultationDb();
  if (tableName === "representation_cases") return getRepresentationDb();
  if (tableName === "compliance_cases") return getComplianceDb();
  if (tableName === "arbitration_cases") return getArbitrationDb();
  return db;
}

/**
 * Synchronizes the SQLite database with data from Firestore on startup.
 */
export async function syncFromFirestore() {
  console.log("=== STARTING FIRESTORE TO SQLITE SYNC ===");
  (db as any).isSyncingFromFirestore = true;
  try {
    for (const tableName of TABLES_TO_SYNC) {
      try {
        const targetDb = getDbForTable(tableName);
        const colRef = collection(firestoreDb, tableName);
        
        let queryRef: any = colRef;
        if (tableName === "system_performance_metrics") {
          queryRef = query(colRef, limit(50));
        } else if (tableName === "ai_logs" || tableName === "audit_logs") {
          queryRef = query(colRef, limit(50));
        }
        
        const snapshot = await getDocs(queryRef);
        if (!snapshot.empty) {
          console.log(`Syncing table "${tableName}" from Firestore: found ${snapshot.size} records.`);
          
          // Clear local table first to ensure we exactly match the cloud state (except for critical transactional/case/trash tables to prevent data loss or reverse sync wipeout)
          const skipDeleteTables = [
            "cases",
            "erp_records",
            "recycle_bin",
            "litigation_cases",
            "consultation_cases",
            "representation_cases",
            "compliance_cases",
            "arbitration_cases",
            "audit_logs",
            "users",
            "chat_channels",
            "chat_channel_members",
            "chat_messages"
          ];
          if (!skipDeleteTables.includes(tableName)) {
            targetDb.prepare(`DELETE FROM ${tableName}`).run();
          }
          
          if (tableName === "contact_settings") {
            const insertStmt = targetDb.prepare("INSERT OR REPLACE INTO contact_settings (key, value) VALUES (?, ?)");
            for (const fireDoc of snapshot.docs) {
              const key = fireDoc.id;
              const data = fireDoc.data() as any;
              insertStmt.run(key, data.value);
            }
          } else {
            let validColumns: string[] = [];
            try {
              const info = targetDb.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
              validColumns = info.map(col => col.name);
            } catch (e) {}

            for (const fireDoc of snapshot.docs) {
              const data = fireDoc.data();
              const keys = Object.keys(data).filter(k => k !== "rowid" && (validColumns.length === 0 || validColumns.includes(k)));
              if (keys.length === 0) continue;
              
              const columns = keys.join(", ");
              const placeholders = keys.map(() => "?").join(", ");
              const values = keys.map(k => {
                const val = data[k];
                if (val === null || val === undefined) return null;
                if (typeof val === "boolean") return val ? 1 : 0;
                if (typeof val === "object") {
                  return JSON.stringify(val);
                }
                return val;
              });
              
              const query = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
              try {
                targetDb.prepare(query).run(...values);
              } catch (err: any) {
                console.error(`Error inserting synced row into SQLite table ${tableName}:`, err.message);
              }
            }
          }
        } else {
          console.log(`No records found in Firestore for "${tableName}". Uploading default seeded local data to Firestore for permanent persistence.`);
          try {
            if (tableName === "contact_settings") {
              const localRows = targetDb.prepare(`SELECT * FROM contact_settings`).all() as any[];
              for (const row of localRows) {
                await syncToFirestore("contact_settings", row.key, { value: row.value });
              }
            } else {
              const localRows = targetDb.prepare(`SELECT * FROM ${tableName}`).all() as any[];
              for (const row of localRows) {
                let docId = row.id;
                if (tableName === "role_permissions") docId = row.role;
                else if (docId === undefined || docId === null) docId = row.rowid ? `row_${row.rowid}` : undefined;
                
                if (docId !== undefined && docId !== null) {
                  await syncToFirestore(tableName, docId, row);
                }
              }
            }
          } catch (uploadErr: any) {
            console.error(`Error uploading default seeded local data for "${tableName}" to Firestore:`, uploadErr.message);
          }
        }
      } catch (tableErr: any) {
        if (tableErr.message?.includes("Quota limit exceeded") || tableErr.message?.includes("quota") || tableErr.message?.includes("Quota")) {
          console.warn(`Firestore quota exceeded while syncing table "${tableName}". Reverting to local SQLite cache.`);
          break;
        } else {
          console.error(`Error syncing table "${tableName}" from Firestore:`, tableErr.message);
        }
      }
    }
    console.log("=== FIRESTORE TO SQLITE SYNC COMPLETED SUCCESSFULLY ===");
  } catch (err: any) {
    if (err.message?.includes("Quota") || err.message?.includes("quota")) {
      console.warn("Firestore quota exceeded during Firestore -> SQLite sync. Running on local SQLite engine.");
    } else {
      console.error("CRITICAL: Error during Firestore -> SQLite sync:", err.message);
    }
  } finally {
    (db as any).isSyncingFromFirestore = false;
  }
}

/**
 * Syncs a single record of a table to Firestore.
 */
export async function syncToFirestore(tableName: string, id: string | number, data: any) {
  try {
    const docRef = doc(firestoreDb, tableName, String(id));
    const cleanedData: any = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && typeof v !== "function" && v !== null) {
        cleanedData[k] = v;
      } else if (v === null) {
        cleanedData[k] = null;
      }
    }
    // Ensure the ID is part of the document
    cleanedData.id = id;

    // Normalize deleted / is_deleted flags for consistent Firestore querying
    if (cleanedData.is_deleted !== undefined || cleanedData.deleted !== undefined) {
      const isDel = Boolean(
        cleanedData.is_deleted === 1 ||
        cleanedData.is_deleted === true ||
        cleanedData.deleted === 1 ||
        cleanedData.deleted === true
      );
      cleanedData.deleted = isDel;
      cleanedData.is_deleted = isDel ? 1 : 0;
      if (isDel && (!cleanedData.status || cleanedData.status !== "TRASHED")) {
        cleanedData.status = "TRASHED";
      }
    }

    if (tableName === "recycle_bin") {
      cleanedData.deleted = true;
      cleanedData.is_deleted = 1;
      cleanedData.status = "TRASHED";
      if (typeof cleanedData.data === "string") {
        try {
          const parsed = JSON.parse(cleanedData.data);
          if (parsed && typeof parsed === "object") {
            if (parsed.title || parsed.name) cleanedData.title = parsed.title || parsed.name;
            if (parsed.client) cleanedData.client = parsed.client;
            if (parsed.mainAssignee) cleanedData.mainAssignee = parsed.mainAssignee;
            if (parsed.category || parsed.practice_area) cleanedData.category = parsed.category || parsed.practice_area;
            if (parsed.feeAmount || parsed.revenue) cleanedData.feeAmount = Number(parsed.feeAmount || parsed.revenue || 0);
          }
        } catch (e) {}
      }
    } else if (typeof cleanedData.data === "string") {
      try {
        const parsed = JSON.parse(cleanedData.data);
        if (parsed && typeof parsed === "object") {
          if (parsed.deleted !== undefined || parsed.is_deleted !== undefined || parsed.status === "TRASHED") {
            const isDel = Boolean(
              parsed.deleted === true ||
              parsed.deleted === 1 ||
              parsed.is_deleted === true ||
              parsed.is_deleted === 1 ||
              parsed.status === "TRASHED"
            );
            cleanedData.deleted = isDel;
            cleanedData.is_deleted = isDel ? 1 : 0;
            if (isDel) cleanedData.status = "TRASHED";
          }
        }
      } catch (e) {}
    }
    
    await setDoc(docRef, cleanedData);
    console.log(`Successfully persisted ${tableName}/${id} to Firestore.`);
  } catch (err: any) {
    console.error(`Error saving ${tableName}/${id} to Firestore:`, err.message);
  }
}

/**
 * Syncs a row from SQLite to Firestore by fetching its latest state.
 */
export async function syncRowToFirestore(tableName: string, id: string | number) {
  try {
    const targetDb = getDbForTable(tableName);
    const row = targetDb.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id) as any;
    if (row) {
      await syncToFirestore(tableName, id, row);
    }
  } catch (err: any) {
    console.error(`Error fetching row ${id} of ${tableName} for Firestore sync:`, err.message);
  }
}

/**
 * Deletes a record from Firestore.
 */
export async function deleteFromFirestore(tableName: string, id: string | number) {
  try {
    const docRef = doc(firestoreDb, tableName, String(id));
    await deleteDoc(docRef);
    console.log(`Successfully deleted ${tableName}/${id} from Firestore.`);
  } catch (err: any) {
    console.error(`Error deleting ${tableName}/${id} from Firestore:`, err.message);
  }
}

/**
 * Deletes all documents in all synced collections in Firestore.
 */
export async function clearAllFirestoreCollections() {
  if ((firestoreDb as any).isMock) {
    console.warn("[Firestore] Database is in mock fallback mode. Skipping Firestore collections clearing.");
    return;
  }
  console.log("=== CLEARING ALL FIRESTORE COLLECTIONS FOR RESET ===");
  for (const tableName of TABLES_TO_SYNC) {
    try {
      const colRef = collection(firestoreDb, tableName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        console.log(`Clearing ${snapshot.size} documents from Firestore collection: "${tableName}"`);
        const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(promises);
      }
    } catch (err: any) {
      if (err.message?.includes("Quota limit exceeded") || err.message?.includes("quota") || err.message?.includes("Quota")) {
        console.warn(`[Firestore] Quota exceeded while clearing collection "${tableName}".`);
      } else {
        console.error(`Error clearing collection "${tableName}" from Firestore:`, err.message);
      }
    }
  }
  console.log("=== FIRESTORE COLLECTIONS CLEARED ===");
}

let activeListeners: (() => void)[] = [];

/**
 * Starts persistent, server-side onSnapshot real-time sync with Firestore.
 */
export function startRealTimeSync() {
  if ((firestoreDb as any).isMock) {
    console.log("[RealTimeSync] Firestore is in fallback mock mode. Real-time sync listener disabled.");
    return;
  }
  
  console.log("=== STARTING SERVER-SIDE REAL-TIME SYNC WITH FIRESTORE ===");
  
  // Unsubscribe from any active listeners first
  for (const unsub of activeListeners) {
    try {
      unsub();
    } catch (e) {}
  }
  activeListeners = [];

  const tablesToListen = [
    "cases",
    "erp_records",
    "clients",
    "users",
    "tasks",
    "invoices",
    "payments",
    "payment_schedules",
    "payment_transactions",
    "court_schedule",
    "voip_calls",
    "chat_messages"
  ];

  for (const tableName of tablesToListen) {
    try {
      const targetDb = getDbForTable(tableName);
      const colRef = collection(firestoreDb, tableName);
      
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        // Prevent processing if this was triggered during initial boot sync to avoid race conditions
        if ((db as any).isSyncingFromFirestore) return;

        snapshot.docChanges().forEach((change) => {
          const docId = change.doc.id;
          const data = change.doc.data();

          if (change.type === "added" || change.type === "modified") {
            // Write to local SQLite
            let validColumns: string[] = [];
            try {
              const info = targetDb.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
              validColumns = info.map(col => col.name);
            } catch (e) {}

            const keys = Object.keys(data).filter(k => k !== "rowid" && (validColumns.length === 0 || validColumns.includes(k)));
            if (keys.length > 0) {
              const columns = keys.join(", ");
              const placeholders = keys.map(() => "?").join(", ");
              const values = keys.map(k => {
                const val = data[k];
                if (val === null || val === undefined) return null;
                if (typeof val === "boolean") return val ? 1 : 0;
                if (typeof val === "object") return JSON.stringify(val);
                return val;
              });

              const queryStr = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
              try {
                targetDb.prepare(queryStr).run(...values);
                console.log(`[RealTimeSync] Synced addition/modification for ${tableName}/${docId}`);
              } catch (err: any) {
                console.error(`[RealTimeSync] Error inserting row ${docId} into ${tableName}:`, err.message);
              }
            }
          } else if (change.type === "removed") {
            // Delete from local SQLite
            try {
              let deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
              if (tableName === "role_permissions") deleteQuery = `DELETE FROM ${tableName} WHERE role = ?`;
              targetDb.prepare(deleteQuery).run(docId);
              console.log(`[RealTimeSync] Synced removal of ${tableName}/${docId}`);
            } catch (err: any) {
              console.error(`[RealTimeSync] Error deleting row ${docId} from ${tableName}:`, err.message);
            }
          }
        });
      }, (err) => {
        if (err.message?.includes("Quota limit exceeded") || err.message?.includes("quota") || err.message?.includes("Quota")) {
          console.warn(`[RealTimeSync] Firestore quota exceeded for real-time listener on "${tableName}". Real-time updates paused.`);
        } else {
          console.error(`[RealTimeSync] Error in real-time listener for "${tableName}":`, err.message);
        }
      });

      activeListeners.push(unsubscribe);
    } catch (err: any) {
      console.error(`[RealTimeSync] Failed to initialize real-time sync for "${tableName}":`, err.message);
    }
  }
}
