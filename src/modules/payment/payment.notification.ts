import db from "../../db/database";
import { paymentSocketNotifier } from "./payment.socket";

export class PaymentNotificationDispatcher {
  public notifyPaymentSuccess(payload: {
    caseId: string;
    caseCode: string;
    paymentRef: string;
    amount: number;
    clientName: string;
    receiptCode: string;
  }) {
    const title = `Thanh toán thành công đợt [${payload.paymentRef}]`;
    const message = `Khách hàng ${payload.clientName} đã thanh toán thành công ${payload.amount.toLocaleString("vi-VN")} VNĐ cho hồ sơ ${payload.caseCode}. Mã phiếu thu: ${payload.receiptCode}`;

    // 1. Save system message / notification in DB if record_messages or audit_logs exists
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, user, action, time)
        VALUES (?, ?, ?, ?)
      `).run(
        `LOG-${Date.now()}`,
        "Banking Gateway AI",
        `Xác nhận thanh toán ${payload.amount.toLocaleString("vi-VN")}đ cho mã ${payload.paymentRef}`,
        new Date().toISOString()
      );

      // Add internal message to case discussion record
      db.prepare(`
        INSERT INTO record_messages (record_id, sender_name, sender_role, content, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(
        payload.caseId,
        "Hệ thống Financial Center",
        "system",
        `✅ ${message}`,
        new Date().toISOString()
      );
    } catch (err) {
      console.error("[PaymentNotification] Error saving system notification:", err);
    }

    // 2. Broadcast via Socket
    paymentSocketNotifier.emitPaymentCompleted(payload);

    // 3. Email / Zalo / SMS interfaces for future integration
    this.sendZaloNotificationHook(payload);
    this.sendSmsNotificationHook(payload);
  }

  private sendZaloNotificationHook(payload: any) {
    // Interface placeholder for Zalo ZNS API
    console.log(`[Zalo ZNS Hook] Ready to dispatch Zalo ZNS template to client for ${payload.paymentRef}`);
  }

  private sendSmsNotificationHook(payload: any) {
    // Interface placeholder for SMS Brandname API
    console.log(`[SMS Hook] Ready to dispatch SMS Brandname to client for ${payload.paymentRef}`);
  }
}

export const paymentNotificationDispatcher = new PaymentNotificationDispatcher();
