import { paymentRepository } from "./payment.repository";

export interface VietQrConfig {
  bankId: string; // e.g. "MB" or "970422"
  accountNo: string;
  accountName: string;
  template: "compact" | "compact2" | "qr_only" | "print";
}

export const DEFAULT_COMPANY_BANK: VietQrConfig = {
  bankId: "MB",
  accountNo: "0383111222",
  accountName: "CONG TY LUAT TNHH ANH DUONG LEGAL",
  template: "compact2"
};

export class QrEngine {
  /**
   * Generates standard VietQR image URL using img.vietqr.io format
   * VietQR format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
   */
  public generateVietQrUrl(
    amount: number,
    paymentRef: string,
    bankConfig: VietQrConfig = DEFAULT_COMPANY_BANK
  ): string {
    const encodedRef = encodeURIComponent(paymentRef);
    const encodedName = encodeURIComponent(bankConfig.accountName);
    return `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-${bankConfig.template}.png?amount=${amount}&addInfo=${encodedRef}&accountName=${encodedName}`;
  }

  /**
   * Generates Case QR URL: https://domain/case/:token
   */
  public generateCaseQrUrl(baseUrl: string, caseId: string): { caseToken: string; caseQrUrl: string } {
    const token = paymentRepository.getOrCreateCaseQrToken(caseId);
    const cleanBase = baseUrl.replace(/\/$/, "");
    return {
      caseToken: token,
      caseQrUrl: `${cleanBase}/case-qr/${token}`
    };
  }

  /**
   * Evaluates what to display when a Case QR code is scanned:
   * If there is an unpaid payment schedule -> return VietQR payment details
   * If all schedules are paid -> return Case progress
   */
  public evaluateCaseQrScan(caseId: string, baseUrl: string) {
    const pendingSchedule = paymentRepository.findPendingScheduleByCaseId(caseId);
    const payment = paymentRepository.findPaymentByCaseId(caseId);
    const allSchedules = paymentRepository.findSchedulesByCaseId(caseId);

    if (pendingSchedule && pendingSchedule.amount > 0) {
      const vietQrUrl = this.generateVietQrUrl(pendingSchedule.amount, pendingSchedule.payment_ref);
      return {
        has_pending_payment: true,
        active_schedule: {
          ...pendingSchedule,
          vietqr_url: vietQrUrl,
          bank_account: DEFAULT_COMPANY_BANK.accountNo,
          bank_name: "Ngân hàng TMCP Quân Đội (MBBank)",
          account_holder: DEFAULT_COMPANY_BANK.accountName,
          transfer_content: pendingSchedule.payment_ref
        },
        payment_summary: payment,
        all_schedules: allSchedules
      };
    }

    return {
      has_pending_payment: false,
      active_schedule: null,
      payment_summary: payment,
      all_schedules: allSchedules
    };
  }
}

export const qrEngine = new QrEngine();
