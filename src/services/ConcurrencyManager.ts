import { config } from "../config/env";

export class ConcurrencyLimiter {
  private activeCount = 0;
  private queue: (() => void)[] = [];

  constructor(private maxConcurrency: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.maxConcurrency) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }
    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getMaxConcurrency(): number {
    return this.maxConcurrency;
  }
}

// Concurrency bounds matching requirements and ENV overrides
export const pdfLimiter = new ConcurrencyLimiter(
  parseInt(process.env.PDF_MAX_CONCURRENCY || "2", 10)
);

export const ocrLimiter = new ConcurrencyLimiter(
  parseInt(process.env.OCR_MAX_CONCURRENCY || "2", 10)
);

export const aiLimiter = new ConcurrencyLimiter(
  parseInt(process.env.AI_MAX_CONCURRENCY || "3", 10)
);

export const embeddingLimiter = new ConcurrencyLimiter(
  parseInt(process.env.EMBEDDING_MAX_CONCURRENCY || "3", 10)
);

export const reportLimiter = new ConcurrencyLimiter(
  parseInt(process.env.REPORT_MAX_CONCURRENCY || "2", 10)
);
