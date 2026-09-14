import { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export const setPaymentSocketServer = (io: SocketIOServer) => {
  ioInstance = io;
};

export class PaymentSocketNotifier {
  public emitPaymentCompleted(data: {
    caseId: string;
    caseCode: string;
    paymentRef: string;
    amount: number;
    clientName: string;
    receiptCode: string;
  }) {
    if (!ioInstance) return;
    try {
      ioInstance.to("erp_users").emit("payment_completed", data);
      ioInstance.to(`case_${data.caseId}`).emit("payment_completed", data);
      ioInstance.emit("financial_stats_updated", { timestamp: new Date().toISOString() });
      console.log(`[PaymentSocketNotifier] Emitted payment_completed for ${data.paymentRef}`);
    } catch (err) {
      console.error("[PaymentSocketNotifier] Socket emit error:", err);
    }
  }

  public emitTransactionMatched(data: {
    transactionId: string;
    paymentRef: string;
    amount: number;
    caseId: string;
  }) {
    if (!ioInstance) return;
    try {
      ioInstance.to("erp_users").emit("transaction_matched", data);
      console.log(`[PaymentSocketNotifier] Emitted transaction_matched for ${data.paymentRef}`);
    } catch (err) {
      console.error("[PaymentSocketNotifier] Socket emit error:", err);
    }
  }

  public emitQrViewedOrScanned(data: { caseId: string; paymentRef: string; action: "viewed" | "scanned" }) {
    if (!ioInstance) return;
    try {
      ioInstance.to("erp_users").emit("qr_activity", data);
    } catch (err) {}
  }
}

export const paymentSocketNotifier = new PaymentSocketNotifier();
