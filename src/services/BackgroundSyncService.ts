import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { fetchApi } from "../utils/api";

export interface SyncItem {
  uid: string; // Unique queue ID
  type: "call_log" | "system_metric" | "qa_evaluation";
  payload: any;
  retryCount: number;
  createdAt: string;
}

class BackgroundSyncService {
  private queue: SyncItem[] = [];
  private isSyncing: boolean = false;
  private intervalId: any = null;

  constructor() {
    this.loadQueue();
    this.startAutoSync();
    
    // Listen for network online status to flush the queue immediately
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        console.log("[BackgroundSync] Network is back online. Flushing queue...");
        this.flushQueue();
      });

      // Hook page performance event to log page load times automatically
      window.addEventListener("load", () => {
        setTimeout(() => {
          this.logPagePerformance();
        }, 1000);
      });
    }
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem("bg_sync_queue_v1");
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (e) {
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem("bg_sync_queue_v1", JSON.stringify(this.queue));
    } catch (e) {
      console.error("[BackgroundSync] Failed to save queue to localStorage:", e);
    }
  }

  /**
   * Start periodic synchronization check
   */
  public startAutoSync() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.flushQueue();
    }, 15000); // Check every 15s
  }

  /**
   * Stop periodic synchronization
   */
  public stopAutoSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Log current page performance metrics automatically
   */
  private logPagePerformance() {
    if (typeof window === "undefined" || !window.performance) return;
    try {
      const timing = window.performance.timing;
      if (timing) {
        const loadTimeSec = (timing.loadEventEnd - timing.navigationStart) / 1000;
        if (loadTimeSec > 0 && loadTimeSec < 60) {
          this.enqueuePerformanceMetric(
            "page_load_duration",
            loadTimeSec,
            `Trình duyệt khách: ${navigator.userAgent || "Unknown"}`
          );
        }
      }
    } catch (e) {
      console.warn("[BackgroundSync] Failed to measure page performance:", e);
    }
  }

  /**
   * Enqueue a VoIP call log for offloading
   */
  public enqueueCallLog(callLog: any) {
    const item: SyncItem = {
      uid: "sync-call-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      type: "call_log",
      payload: callLog,
      retryCount: 0,
      createdAt: new Date().toISOString()
    };
    this.queue.push(item);
    this.saveQueue();
    this.flushQueue(); // Try to sync immediately
  }

  /**
   * Enqueue a system performance metric
   */
  public enqueuePerformanceMetric(type: string, value: number, details: string = "") {
    const item: SyncItem = {
      uid: "sync-metric-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      type: "system_metric",
      payload: {
        id: "metric-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        metric_type: type,
        value,
        details,
        timestamp: new Date().toISOString()
      },
      retryCount: 0,
      createdAt: new Date().toISOString()
    };
    this.queue.push(item);
    this.saveQueue();
    this.flushQueue(); // Try to sync immediately
  }

  /**
   * Enqueue a QA audit / evaluation log
   */
  public enqueueQualityEvaluation(
    callId: string,
    staffName: string,
    score: string,
    hasViolation: boolean,
    violatedKeywords: string[],
    details: string = ""
  ) {
    const item: SyncItem = {
      uid: "sync-qa-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      type: "qa_evaluation",
      payload: {
        id: "qa-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        call_id: callId,
        staff_name: staffName,
        score,
        has_violation: hasViolation,
        violated_keywords: violatedKeywords,
        audited_at: new Date().toISOString(),
        details
      },
      retryCount: 0,
      createdAt: new Date().toISOString()
    };
    this.queue.push(item);
    this.saveQueue();
    this.flushQueue(); // Try to sync immediately
  }

  /**
   * Process and synchronize all pending items in the queue
   */
  public async flushQueue() {
    if (this.isSyncing || this.queue.length === 0) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.log("[BackgroundSync] App is currently offline. Buffering records locally.");
      return;
    }

    this.isSyncing = true;
    console.log(`[BackgroundSync] Flushing ${this.queue.length} items to database and backend...`);

    const itemsToProcess = [...this.queue];

    for (const item of itemsToProcess) {
      let success = false;
      try {
        if (item.type === "call_log") {
          // Offload call log to both backend SQLite API and Firestore
          const tasks: Promise<any>[] = [
            // 1. Backend API
            fetchApi("/api/calls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item.payload)
            })
          ];
          // 2. Firestore Document Sync (if available)
          if (db && !(db as any).isMock) {
            tasks.push(setDoc(doc(db, "voip_calls", item.payload.id), item.payload));
          }
          await Promise.all(tasks);
          success = true;

        } else if (item.type === "system_metric") {
          // Offload system metrics
          const tasks: Promise<any>[] = [
            // 1. Backend API
            fetchApi("/api/system/metrics", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item.payload)
            })
          ];
          // 2. Firestore Document Sync (if available)
          if (db && !(db as any).isMock) {
            tasks.push(setDoc(doc(db, "system_performance_metrics", item.payload.id), item.payload));
          }
          await Promise.all(tasks);
          success = true;

        } else if (item.type === "qa_evaluation") {
          // Offload quality evaluation
          const tasks: Promise<any>[] = [
            // 1. Backend API
            fetchApi("/api/system/qa-evaluation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item.payload)
            })
          ];
          // 2. Firestore Document Sync (if available)
          if (db && !(db as any).isMock) {
            tasks.push(setDoc(doc(db, "quality_assurance_evaluations", item.payload.id), item.payload));
          }
          await Promise.all(tasks);
          success = true;
        }
      } catch (err) {
        console.error(`[BackgroundSync] Failed to offload item: ${item.uid} (retry: ${item.retryCount})`, err);
        item.retryCount += 1;
      }

      if (success) {
        // Remove from current queue
        this.queue = this.queue.filter(q => q.uid !== item.uid);
        this.saveQueue();
      } else if (item.retryCount > 10) {
        // Discard or archive dead letters to avoid clogging
        console.warn(`[BackgroundSync] Discarding item ${item.uid} after exceeding max retry attempts.`);
        this.queue = this.queue.filter(q => q.uid !== item.uid);
        this.saveQueue();
      }
    }

    this.isSyncing = false;
    console.log("[BackgroundSync] Sync execution run finished.");
  }

  /**
   * Retrieve total pending records currently in queue
   */
  public getPendingCount(): number {
    return this.queue.length;
  }
}

export const syncService = new BackgroundSyncService();
