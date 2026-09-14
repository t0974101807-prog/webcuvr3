import { MemoryMonitor } from "./MemoryMonitor";
import { OperationTracker } from "./OperationTracker";
import { pdfLimiter, ocrLimiter, aiLimiter } from "./ConcurrencyManager";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING PRODUCTION MEMORY MONITOR UNIT & INTEGRATION TESTS");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  };

  // --- 1. CONFIGURATION VALIDATION TESTS ---
  try {
    console.log("\n--- Testing Configuration Thresholds ---");
    // Validate default settings don't crash
    MemoryMonitor.validateConfig();
    assert(true, "Default memory monitor config thresholds validated successfully.");
  } catch (err: any) {
    assert(false, `Config validation failed: ${err.message}`);
  }

  // --- 2. METRIC COLLECTION & CGROUP TESTS ---
  try {
    console.log("\n--- Testing Memory Metric Calculations ---");
    const metrics = MemoryMonitor.getMetrics();
    
    assert(metrics.pid > 0, "PID is correctly resolved.");
    assert(metrics.rss > 0, "RSS memory is correctly captured.");
    assert(metrics.heapTotal > 0, "heapTotal is correctly captured.");
    assert(metrics.heapUsed > 0, "heapUsed is correctly captured.");
    assert(metrics.memoryLimit > 0, "Memory limit is parsed (falls back to system total RAM or cgroups).");
    assert(metrics.memoryPercent >= 0 && metrics.memoryPercent <= 100, `Memory percentage calculated correctly: ${metrics.memoryPercent.toFixed(2)}%`);
    assert(['NORMAL', 'WARNING', 'CRITICAL', 'OOM_RISK'].includes(metrics.status), `Memory status is categorized as ${metrics.status}`);
  } catch (err: any) {
    assert(false, `Metrics calculation crashed: ${err.message}`);
  }

  // --- 3. CONCURRENCY & WORKLOAD PROTECTION TESTS ---
  try {
    console.log("\n--- Testing Concurrency Limiters ---");
    assert(pdfLimiter.getMaxConcurrency() === 2, "PDF Concurrency is correctly capped at 2.");
    assert(ocrLimiter.getMaxConcurrency() === 2, "OCR Concurrency is correctly capped at 2.");
    assert(aiLimiter.getMaxConcurrency() === 3, "AI Concurrency is correctly capped at 3.");

    // Simulate busy queue
    let runCount = 0;
    const task = async () => {
      runCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
    };

    // Parallel schedule tasks
    pdfLimiter.run(task);
    pdfLimiter.run(task);
    const p3 = pdfLimiter.run(task); // Queue this task
    
    assert(pdfLimiter.getActiveCount() <= 2, "PDF execution count stays within limit.");
    assert(pdfLimiter.getQueueSize() === 1, "Excess PDF tasks are correctly enqueued.");
    
    await p3; // Wait for resolving
  } catch (err: any) {
    assert(false, `Concurrency managers crashed: ${err.message}`);
  }

  // --- 4. PERSISTENT RING BUFFER TESTS ---
  try {
    console.log("\n--- Testing State Persistent Ring Buffer ---");
    const originalStates = MemoryMonitor.getSavedStates();
    const metrics = MemoryMonitor.getMetrics();
    
    // Simulate writes manually to populate the state file
    MemoryMonitor.persistState(metrics);
    
    const logDir = path.join(process.cwd(), "logs", "runtime");
    const stateFilePath = path.join(logDir, "memory-state.json");
    
    // Check if files or directory got created
    assert(fs.existsSync(logDir), "Memory Monitor logs directory is persistently created.");
    assert(fs.existsSync(stateFilePath), "memory-state.json ring-buffer file got populated.");
    
    const saved = MemoryMonitor.getSavedStates();
    assert(saved.length > 0, "Persistent states can be read successfully from state file.");
  } catch (err: any) {
    assert(false, `State Ring Buffer storage test failed: ${err.message}`);
  }

  // --- 5. GRACEFUL SHUTDOWN & CRASH MARKERS ---
  try {
    console.log("\n--- Testing Graceful Shutdown and Recovery Diagnostic ---");
    MemoryMonitor.writeShutdownMarker(true);
    const markerFile = path.join(process.cwd(), "logs", "runtime", "shutdown-marker.json");
    
    assert(fs.existsSync(markerFile), "Shutdown marker is successfully written to storage.");
    const content = JSON.parse(fs.readFileSync(markerFile, 'utf8'));
    assert(content.graceful === true, "Graceful termination flag is set correctly.");
    
    // Clear marker
    MemoryMonitor.clearShutdownMarker();
    assert(!fs.existsSync(markerFile), "Shutdown marker is correctly cleared during normal startup.");
  } catch (err: any) {
    assert(false, `Shutdown markers check failed: ${err.message}`);
  }

  // --- SUMMARY ---
  console.log("\n=================================================");
  console.log(`TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
