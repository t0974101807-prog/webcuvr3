import { paymentRepository, PaymentRecord, PaymentScheduleRecord, ReceiptRecord } from "./payment.repository";
import { paymentScheduleEngine } from "./payment.schedule";
import { qrEngine } from "./payment.qr";
import { paymentEventBus, PaymentEventType } from "./payment.event";
import db from "../../db/database";

export class PaymentService {
  /**
   * Initializes or updates Payment & Payment Schedules when a Case is created or updated in ERP
   */
  public syncCasePayment(
    caseId: string,
    caseCode: string,
    clientName: string,
    contractValue: number,
    baseUrl: string = ""
  ): { payment: PaymentRecord; schedules: PaymentScheduleRecord[]; caseQrToken: string } {
    // 1. Create or update payment summary
    const payment = paymentRepository.createPayment({
      case_id: caseId,
      case_code: caseCode,
      client_name: clientName,
      contract_value: contractValue,
      status: "Pending"
    });

    // 2. Get or create case QR token
    const caseQrToken = paymentRepository.getOrCreateCaseQrToken(caseId);

    // 3. Initialize default payment schedules if none exist
    let schedules = paymentRepository.findSchedulesByCaseId(caseId);
    if (!schedules || schedules.length === 0) {
      schedules = paymentScheduleEngine.initializeDefaultSchedules(caseId, caseCode, contractValue, baseUrl);
    } else {
      // Recalculate remaining & update status
      paymentRepository.updatePaymentSummary(caseId);
    }

    // 4. Publish Event
    paymentEventBus.publish({
      eventType: PaymentEventType.PaymentCreated,
      caseId,
      paymentRef: payment.id,
      data: { payment, schedules }
    });

    return {
      payment,
      schedules,
      caseQrToken
    };
  }

  /**
   * Gets complete financial details for a single Case
   */
  public getCasePaymentDetails(caseId: string, baseUrl: string = "") {
    const payment = paymentRepository.findPaymentByCaseId(caseId);
    const schedules = paymentRepository.findSchedulesByCaseId(caseId);
    const caseQrInfo = qrEngine.generateCaseQrUrl(baseUrl, caseId);
    const pendingSchedule = paymentRepository.findPendingScheduleByCaseId(caseId);

    let activeVietQrUrl = "";
    if (pendingSchedule) {
      activeVietQrUrl = qrEngine.generateVietQrUrl(pendingSchedule.amount, pendingSchedule.payment_ref);
    }

    return {
      payment,
      schedules,
      caseQrToken: caseQrInfo.caseToken,
      caseQrUrl: caseQrInfo.caseQrUrl,
      pendingSchedule: pendingSchedule ? { ...pendingSchedule, activeVietQrUrl } : null,
      receipts: (paymentRepository.findAllReceipts() as ReceiptRecord[]).filter(r => r.case_id === caseId)
    };
  }

  /**
   * Processes public Case QR Lookup scan
   */
  public processPublicCaseQrScan(token: string, baseUrl: string = "") {
    const caseId = paymentRepository.findCaseByQrToken(token);
    if (!caseId) {
      // Fallback: try looking up case directly by token or systemId
      const erpRow = db.prepare("SELECT data FROM erp_records WHERE id = ? OR data LIKE ?").get(token, `%${token}%`) as any;
      if (erpRow) {
        const parsed = JSON.parse(erpRow.data);
        return {
          found: true,
          caseDetails: parsed,
          paymentEval: qrEngine.evaluateCaseQrScan(parsed.id || token, baseUrl)
        };
      }
      return { found: false, message: "Mã QR không tồn tại hoặc đã hết hạn" };
    }

    const erpRow = db.prepare("SELECT data FROM erp_records WHERE id = ?").get(caseId) as any;
    const caseDetails = erpRow ? JSON.parse(erpRow.data) : { id: caseId, title: "Hồ sơ vụ việc" };
    const paymentEval = qrEngine.evaluateCaseQrScan(caseId, baseUrl);

    // Event log
    paymentEventBus.publish({
      eventType: PaymentEventType.QRScanned,
      caseId,
      data: { token, timestamp: new Date().toISOString() }
    });

    return {
      found: true,
      caseDetails,
      paymentEval
    };
  }
}

export const paymentService = new PaymentService();
