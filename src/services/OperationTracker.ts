export type OperationType = 
  | 'PDF_PROCESSING'
  | 'OCR_PROCESSING'
  | 'AI_ANALYSIS'
  | 'RAG_SEARCH'
  | 'EMBEDDING'
  | 'FILE_UPLOAD'
  | 'FILE_CONVERSION'
  | 'REPORT_GENERATION'
  | 'DATABASE_QUERY';

export interface ActiveOperation {
  id: string;
  operation: OperationType;
  startTime: number;
  metadata?: any;
}

export class OperationTracker {
  private static activeOperations = new Map<string, ActiveOperation>();

  static start(operation: OperationType, metadata?: any): string {
    const id = Math.random().toString(36).substring(7) + '-' + Date.now();
    this.activeOperations.set(id, {
      id,
      operation,
      startTime: Date.now(),
      metadata,
    });
    return id;
  }

  static end(id: string) {
    this.activeOperations.delete(id);
  }

  static getActiveOperations(): ActiveOperation[] {
    return Array.from(this.activeOperations.values());
  }

  static getCurrentOperationSummary(): string {
    const ops = this.getActiveOperations();
    if (ops.length === 0) return "NONE";
    return ops.map(o => o.operation).join(", ");
  }

  static getCount(operation: OperationType): number {
    let count = 0;
    for (const op of this.activeOperations.values()) {
      if (op.operation === operation) {
        count++;
      }
    }
    return count;
  }
}
