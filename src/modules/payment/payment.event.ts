import EventEmitter from "events";
import db from "../../db/database";

export enum PaymentEventType {
  CaseCreated = "CaseCreated",
  PaymentCreated = "PaymentCreated",
  PaymentReferenceGenerated = "PaymentReferenceGenerated",
  PaymentScheduleCreated = "PaymentScheduleCreated",
  QRGenerated = "QRGenerated",
  QRViewed = "QRViewed",
  QRScanned = "QRScanned",
  TransactionReceived = "TransactionReceived",
  TransactionMatched = "TransactionMatched",
  PaymentCompleted = "PaymentCompleted",
  ReceiptCreated = "ReceiptCreated",
  InvoiceCreated = "InvoiceCreated",
  WorkflowUnlocked = "WorkflowUnlocked",
  NotificationSent = "NotificationSent",
  PaymentRefunded = "PaymentRefunded",
  PaymentCancelled = "PaymentCancelled"
}

export interface PaymentEventPayload {
  eventType: PaymentEventType;
  caseId: string;
  paymentRef?: string;
  data: Record<string, any>;
  timestamp?: string;
}

class InternalEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  public publish(payload: PaymentEventPayload): void {
    const timestamp = payload.timestamp || new Date().toISOString();
    try {
      db.prepare(`
        INSERT INTO payment_events (event_type, case_id, payment_ref, payload_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        payload.eventType,
        payload.caseId || "",
        payload.paymentRef || "",
        JSON.stringify(payload.data || {}),
        timestamp
      );
    } catch (err) {
      console.error("[PaymentEventBus] Failed to log event to database:", err);
    }

    // Emit event asynchronously on local event bus
    this.emit(payload.eventType, { ...payload, timestamp });
    this.emit("*", { ...payload, timestamp });
  }

  public subscribe(eventType: PaymentEventType | "*", listener: (payload: PaymentEventPayload) => void): void {
    this.on(eventType, listener);
  }
}

export const paymentEventBus = new InternalEventBus();
