import fs from "fs";
import os from "os";
import path from "path";
import db from "../db/database";
import { getActiveRequestsCount, getActiveRequestsDetails } from "../middleware/RequestTracker";
import { OperationTracker } from "./OperationTracker";
import { pdfLimiter, ocrLimiter, aiLimiter, embeddingLimiter, reportLimiter } from "./ConcurrencyManager";

export type MemoryStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OOM_RISK';
export type MemorySource = 'CGROUP_V2' | 'CGROUP_V1' | 'SYSTEM_MEMORY';

export interface MemoryState {
  timestamp: string;
  pid: number;
  uptime: number;

  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;

  memoryCurrent: number;
  memoryLimit: number;
  memoryPercent: number;

  heapUsedPercent: number;

  activeRequests: number;
  activeConnections: number;

  currentRoute: string;
  currentOperation: string;

  queueSize: number;

  aiJobs: number;
  pdfJobs: number;
  ocrJobs: number;

  status: MemoryStatus;
}

export interface ShutdownState {
  graceful: boolean;
  timestamp: string;
  lastState?: MemoryState | null;
}

export class MemoryMonitor {
  private static intervalId: NodeJS.Timeout | null = null;
  private static logDir = path.join(process.cwd(), "logs", "runtime");
  private static stateFilePath = path.join(MemoryMonitor.logDir, "memory-state.json");
  private static shutdownMarkerPath = path.join(MemoryMonitor.logDir, "shutdown-marker.json");

  // Threshold configurations
  private static warningPercent = parseInt(process.env.MEMORY_WARNING_PERCENT || "70", 10);
  private static criticalPercent = parseInt(process.env.MEMORY_CRITICAL_PERCENT || "85", 10);
  private static oomPercent = parseInt(process.env.MEMORY_OOM_PERCENT || "95", 10);
  private static intervalMs = parseInt(process.env.MEMORY_MONITOR_INTERVAL_MS || "60000", 10);
  private static bufferSize = parseInt(process.env.MEMORY_STATE_BUFFER_SIZE || "500", 10);

  // Leak trend history
  private static rssHistory: number[] = [];
  private static heapHistory: number[] = [];
  private static leakSuspected = false;
  private static restartLoopDetected = false;

  static validateConfig() {
    if (this.warningPercent >= this.criticalPercent) {
      throw new Error(`Startup Error: MEMORY_WARNING_PERCENT (${this.warningPercent}) must be less than MEMORY_CRITICAL_PERCENT (${this.criticalPercent})`);
    }
    if (this.criticalPercent >= this.oomPercent) {
      throw new Error(`Startup Error: MEMORY_CRITICAL_PERCENT (${this.criticalPercent}) must be less than MEMORY_OOM_PERCENT (${this.oomPercent})`);
    }
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (err) {
        console.error("Failed to create log directory", err);
      }
    }
  }

  static getMetrics(): MemoryState {
    const nodeMemory = process.memoryUsage();
    let memoryCurrent = nodeMemory.rss;
    let memoryLimit = os.totalmem();
    let memorySource: MemorySource = 'SYSTEM_MEMORY';

    // cgroup v2
    try {
      if (fs.existsSync('/sys/fs/cgroup/memory.current') && fs.existsSync('/sys/fs/cgroup/memory.max')) {
        const currentRaw = fs.readFileSync('/sys/fs/cgroup/memory.current', 'utf8').trim();
        const maxRaw = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
        
        const currentVal = parseInt(currentRaw, 10);
        if (!isNaN(currentVal) && currentVal > 0) {
          memoryCurrent = currentVal;
          memorySource = 'CGROUP_V2';
          
          if (maxRaw !== 'max' && !maxRaw.includes('max')) {
            const maxVal = parseInt(maxRaw, 10);
            if (!isNaN(maxVal) && maxVal > 0) {
              memoryLimit = maxVal;
            }
          }
        }
      }
    } catch (e) {
      // cgroup v1 fallback
      try {
        if (fs.existsSync('/sys/fs/cgroup/memory/memory.usage_in_bytes') && fs.existsSync('/sys/fs/cgroup/memory/memory.limit_in_bytes')) {
          const currentRaw = fs.readFileSync('/sys/fs/cgroup/memory/memory.usage_in_bytes', 'utf8').trim();
          const maxRaw = fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8').trim();
          
          const currentVal = parseInt(currentRaw, 10);
          const maxVal = parseInt(maxRaw, 10);
          
          if (!isNaN(currentVal) && currentVal > 0) {
            memoryCurrent = currentVal;
            memorySource = 'CGROUP_V1';
            if (!isNaN(maxVal) && maxVal > 0 && maxVal < 9223372036854771712) {
              memoryLimit = maxVal;
            }
          }
        }
      } catch (v1Err) {
        // Keep system memory default
      }
    }

    // Safety fallback
    if (memoryLimit > os.totalmem()) {
      memoryLimit = os.totalmem();
    }

    const memoryPercent = (memoryCurrent / memoryLimit) * 100;
    
    // Determine status
    let status: MemoryStatus = 'NORMAL';
    if (memoryPercent >= this.oomPercent) {
      status = 'OOM_RISK';
    } else if (memoryPercent >= this.criticalPercent) {
      status = 'CRITICAL';
    } else if (memoryPercent >= this.warningPercent) {
      status = 'WARNING';
    }

    // Capture request and operation details
    const activeRequests = getActiveRequestsCount();
    const activeReqs = getActiveRequestsDetails();
    const currentRoute = activeReqs.length > 0 ? `${activeReqs[0].method} ${activeReqs[0].route}` : 'NONE';
    const currentOperation = OperationTracker.getCurrentOperationSummary();

    // Sum concurrency queue sizes
    const queueSize = pdfLimiter.getQueueSize() + 
                      ocrLimiter.getQueueSize() + 
                      aiLimiter.getQueueSize() + 
                      embeddingLimiter.getQueueSize() + 
                      reportLimiter.getQueueSize();

    return {
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime(),
      rss: nodeMemory.rss,
      heapTotal: nodeMemory.heapTotal,
      heapUsed: nodeMemory.heapUsed,
      external: nodeMemory.external,
      arrayBuffers: nodeMemory.arrayBuffers || 0,
      memoryCurrent,
      memoryLimit,
      memoryPercent,
      heapUsedPercent: (nodeMemory.heapUsed / nodeMemory.heapTotal) * 100,
      activeRequests,
      activeConnections: activeRequests, // Simple mapped tracking
      currentRoute,
      currentOperation,
      queueSize,
      aiJobs: aiLimiter.getActiveCount(),
      pdfJobs: pdfLimiter.getActiveCount(),
      ocrJobs: ocrLimiter.getActiveCount(),
      status
    };
  }

  static initialize() {
    this.validateConfig();

    // Detect previous startup state
    this.runStartupDiagnostic();

    // Write initial clean marker
    this.clearShutdownMarker();

    if (process.env.MEMORY_MONITOR_ENABLED === "false") {
      console.log("Memory Monitor is explicitly disabled via ENV");
      return;
    }

    console.log(`Memory Monitor started (interval: ${this.intervalMs}ms, Warning: ${this.warningPercent}%, Critical: ${this.criticalPercent}%, OOM: ${this.oomPercent}%)`);
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  static tick() {
    try {
      const state = this.getMetrics();
      
      // Update historical leak checks
      this.trackLeakSuspect(state);

      // Persist to Ring Buffer file
      this.persistState(state);

      // Write to SQL system_performance_metrics table for dashboard visual charts
      this.writeToDbMetrics(state);

      // Proactive alerts
      if (state.status === 'OOM_RISK') {
        console.error(`[OOM RISK ALERT] Memory usage is critically high at ${state.memoryPercent.toFixed(2)}%! Route: ${state.currentRoute}, Job: ${state.currentOperation}`);
        // Flush state immediately for protection
        this.persistStateImmediate(state);
      } else if (state.status === 'CRITICAL') {
        console.warn(`[MEMORY CRITICAL WARNING] Memory at ${state.memoryPercent.toFixed(2)}%!`);
      }
    } catch (err) {
      console.error("Error during MemoryMonitor tick:", err);
    }
  }

  private static trackLeakSuspect(state: MemoryState) {
    this.rssHistory.push(state.rss);
    this.heapHistory.push(state.heapUsed);

    // Keep history at 15 items
    if (this.rssHistory.length > 15) {
      this.rssHistory.shift();
      this.heapHistory.shift();
    }

    if (this.rssHistory.length >= 10) {
      // Check if RSS and Heap are monotonically increasing
      let rssIncreases = 0;
      let heapIncreases = 0;
      for (let i = 1; i < this.rssHistory.length; i++) {
        if (this.rssHistory[i] > this.rssHistory[i - 1]) rssIncreases++;
        if (this.heapHistory[i] > this.heapHistory[i - 1]) heapIncreases++;
      }

      // If RSS and heap consistently increase > 80% of the window
      if (rssIncreases >= this.rssHistory.length - 3 && heapIncreases >= this.heapHistory.length - 3) {
        this.leakSuspected = true;
      } else {
        this.leakSuspected = false;
      }
    }
  }

  private static writeToDbMetrics(state: MemoryState) {
    try {
      const timestamp = new Date().toISOString();
      const insertMetric = db.prepare(`
        INSERT INTO system_performance_metrics (id, metric_type, value, details, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const details = JSON.stringify({
        pid: state.pid,
        rss: state.rss,
        heapUsed: state.heapUsed,
        heapTotal: state.heapTotal,
        external: state.external,
        arrayBuffers: state.arrayBuffers,
        limit: state.memoryLimit,
        route: state.currentRoute,
        op: state.currentOperation,
        status: state.status,
        leakSuspected: this.leakSuspected,
      });

      insertMetric.run(
        Math.random().toString(36).substring(7) + '-' + Date.now(),
        'memory_percent',
        state.memoryPercent,
        details,
        timestamp
      );
    } catch (err) {
      // Quietly log to prevent crashing monitor
    }
  }

  static persistState(state: MemoryState) {
    let list: MemoryState[] = [];
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const raw = fs.readFileSync(this.stateFilePath, 'utf8');
        list = JSON.parse(raw);
      }
    } catch (e) {
      list = [];
    }

    list.push(state);
    
    // Maintain Ring Buffer size boundary
    if (list.length > this.bufferSize) {
      list.shift();
    }

    try {
      fs.writeFileSync(this.stateFilePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error("Failed to write persistent memory states ring-buffer:", err);
    }
  }

  private static persistStateImmediate(state: MemoryState) {
    this.persistState(state);
  }

  static getSavedStates(): MemoryState[] {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  static runStartupDiagnostic() {
    console.log("[Diagnostic Engine] Running startup diagnostic sequence...");
    
    let abnormalShutdown = false;
    let possibleOOM = false;
    let lastState: MemoryState | null = null;

    // 1. Read last state
    const saved = this.getSavedStates();
    if (saved.length > 0) {
      lastState = saved[saved.length - 1];
    }

    // 2. Read shutdown marker
    let shutdownState: ShutdownState | null = null;
    try {
      if (fs.existsSync(this.shutdownMarkerPath)) {
        shutdownState = JSON.parse(fs.readFileSync(this.shutdownMarkerPath, 'utf8'));
      }
    } catch (e) {}

    if (!shutdownState || !shutdownState.graceful) {
      abnormalShutdown = true;
      if (lastState && lastState.memoryPercent >= this.oomPercent) {
        possibleOOM = true;
      }
    }

    // 3. Track unstable restart loop protect
    const restartLogPath = path.join(this.logDir, "restarts.json");
    let restartTimes: number[] = [];
    try {
      if (fs.existsSync(restartLogPath)) {
        restartTimes = JSON.parse(fs.readFileSync(restartLogPath, 'utf8'));
      }
    } catch (e) {}

    const now = Date.now();
    restartTimes.push(now);
    
    // Retain restarts in last 5 minutes (300,000ms)
    restartTimes = restartTimes.filter(t => now - t < 300000);
    
    if (restartTimes.length >= 5) {
      this.restartLoopDetected = true;
      console.error(`[CRITICAL] RESTART LOOP PROTECTION TRIGGERED. Process has restarted ${restartTimes.length} times in under 5 minutes.`);
    }

    try {
      fs.writeFileSync(restartLogPath, JSON.stringify(restartTimes), 'utf8');
    } catch (e) {}

    // 4. Log diagnostic outcome
    if (possibleOOM) {
      console.error(`[Diagnostic Outcome] Last session terminated due to POSSIBLY OOM KILLED. Peak RSS: ${lastState?.rss}, Used Percent: ${lastState?.memoryPercent.toFixed(2)}%`);
      this.logSystemEvent("OOM_KILLED", lastState);
    } else if (abnormalShutdown) {
      console.warn(`[Diagnostic Outcome] Last session terminated due to ABNORMAL_SHUTDOWN / PROCESS_CRASH.`);
      this.logSystemEvent("PROCESS_CRASH", lastState);
    } else {
      console.log(`[Diagnostic Outcome] Last session terminated gracefully.`);
    }
  }

  private static logSystemEvent(type: string, lastState: MemoryState | null) {
    try {
      const timestamp = new Date().toISOString();
      const insertLog = db.prepare(`
        INSERT INTO system_performance_metrics (id, metric_type, value, details, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const details = JSON.stringify({
        eventType: type,
        lastState: lastState,
        leakSuspected: this.leakSuspected,
        restartLoopDetected: this.restartLoopDetected
      });

      insertLog.run(
        Math.random().toString(36).substring(7) + '-' + Date.now(),
        'system_event',
        0,
        details,
        timestamp
      );
    } catch (err) {
      // prevent breaking
    }
  }

  static writeShutdownMarker(graceful: boolean) {
    const last = this.getMetrics();
    const shutdown: ShutdownState = {
      graceful,
      timestamp: new Date().toISOString(),
      lastState: last
    };
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      fs.writeFileSync(this.shutdownMarkerPath, JSON.stringify(shutdown, null, 2), 'utf8');
    } catch (err) {
      console.error("Failed to write shutdown marker:", err);
    }
  }

  static clearShutdownMarker() {
    try {
      if (fs.existsSync(this.shutdownMarkerPath)) {
        fs.unlinkSync(this.shutdownMarkerPath);
      }
    } catch (e) {}
  }

  static isLeakSuspected() {
    return this.leakSuspected;
  }

  static isRestartLoopDetected() {
    return this.restartLoopDetected;
  }
}
export default MemoryMonitor;
