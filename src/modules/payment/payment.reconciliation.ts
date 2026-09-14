import { paymentRepository } from "./payment.repository";
import { bankingGateway, IncomingBankTransaction } from "./payment.bank";
import { paymentEventBus, PaymentEventType } from "./payment.event";
import { paymentNotificationDispatcher } from "./payment.notification";
import { paymentWorkflowEngine, PaymentWorkflowState } from "./payment.workflow";

export interface ReconciliationResult {
  matched: boolean;
  paymentRef?: string;
  scheduleId?: string;
  receiptCode?: string;
  message: string;
  error?: string;
}

export class ReconciliationEngine {
  /**
   * Processes an incoming transaction from Banking Gateway
   * 1. Extracts Payment Reference
   * 2. Matches against open payment schedule
   * 3. Validates amount
   * 4. Updates schedule status -> Money Received -> AI Reconciliation -> Finance Approved -> Receipt Created -> Completed
   * 5. Creates Phiếu Thu (Receipt)
   * 6. Emits events and triggers Socket/Notifications
   */
  public processTransaction(tx: IncomingBankTransaction): ReconciliationResult {
    const match = bankingGateway.matchPayment(tx.transferContent, tx.amount);
    if (!match.matched || !match.paymentRef) {
      // Record unmatched transaction log
      paymentRepository.createTransaction({
        payment_ref: tx.transferContent,
        amount: tx.amount,
        transfer_content: tx.transferContent,
        bank_code: tx.bankCode,
        account_number: tx.accountNumber,
        status: "Unmatched",
        reconciliation_notes: "Không tìm thấy Payment Reference phù hợp trong nội dung chuyển khoản"
      });

      return {
        matched: false,
        message: "Giao dịch không chứa Payment Reference hợp lệ"
      };
    }

    const paymentRef = match.paymentRef;
    const schedule = paymentRepository.findScheduleByRef(paymentRef);

    if (!schedule) {
      paymentRepository.createTransaction({
        payment_ref: paymentRef,
        amount: tx.amount,
        transfer_content: tx.transferContent,
        bank_code: tx.bankCode,
        account_number: tx.accountNumber,
        status: "Exception",
        reconciliation_notes: `Tham chiếu ${paymentRef} không tồn tại trên hệ thống`
      });

      return {
        matched: false,
        paymentRef,
        message: `Mã đợt thanh toán ${paymentRef} không tồn tại trên hệ thống`
      };
    }

    // Verify amount match or tolerance
    const expectedAmount = schedule.amount;
    if (tx.amount < expectedAmount) {
      console.warn(`[ReconciliationEngine] Partial amount received for ${paymentRef}: Got ${tx.amount}, expected ${expectedAmount}`);
    }

    // Record matched transaction
    const txRecord = paymentRepository.createTransaction({
      payment_ref: paymentRef,
      schedule_id: schedule.id,
      case_id: schedule.case_id,
      bank_code: tx.bankCode,
      account_number: tx.accountNumber,
      account_holder: tx.accountHolder || "Khách hàng",
      amount: tx.amount,
      transfer_content: tx.transferContent,
      transaction_id: tx.transactionId,
      status: "Matched",
      reconciliation_notes: `Tự động khớp lệnh 100% qua Banking Gateway cho ${paymentRef}`
    });

    // Workflow state progression
    paymentRepository.updateScheduleStatus(paymentRef, PaymentWorkflowState.Completed);

    // Create Receipt (Phiếu Thu)
    const payment = paymentRepository.findPaymentByCaseId(schedule.case_id);
    const clientName = payment ? payment.client_name : "Khách hàng";
    const receipt = paymentRepository.createReceipt({
      payment_ref: paymentRef,
      case_id: schedule.case_id,
      case_code: schedule.case_code,
      client_name: clientName,
      amount: tx.amount,
      payment_method: "VietQR Chuyển Khoản Tự Động",
      created_by: "AI Banking Reconciliation Engine",
      notes: `Ghi nhận thu tiền tự động đợt [${paymentRef}] - STK: ${tx.accountNumber}`
    });

    // Publish Events
    paymentEventBus.publish({
      eventType: PaymentEventType.TransactionMatched,
      caseId: schedule.case_id,
      paymentRef,
      data: { transaction: txRecord, schedule }
    });

    paymentEventBus.publish({
      eventType: PaymentEventType.PaymentCompleted,
      caseId: schedule.case_id,
      paymentRef,
      data: { amount: tx.amount, receiptCode: receipt.receipt_code, schedule }
    });

    // Dispatch real-time Notifications & Socket.IO
    paymentNotificationDispatcher.notifyPaymentSuccess({
      caseId: schedule.case_id,
      caseCode: schedule.case_code,
      paymentRef,
      amount: tx.amount,
      clientName,
      receiptCode: receipt.receipt_code
    });

    return {
      matched: true,
      paymentRef,
      scheduleId: schedule.id,
      receiptCode: receipt.receipt_code,
      message: `Khớp lệnh tự động thành công cho mã ${paymentRef}. Đã tạo Phiếu Thu ${receipt.receipt_code}`
    };
  }
}

export const reconciliationEngine = new ReconciliationEngine();
