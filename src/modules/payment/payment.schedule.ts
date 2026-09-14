import { paymentRepository, PaymentScheduleRecord } from "./payment.repository";
import { qrEngine } from "./payment.qr";
import { paymentEventBus, PaymentEventType } from "./payment.event";

export interface ScheduleSplitInput {
  caseId: string;
  caseCode: string;
  type: "DP" | "IP" | "FP" | "RF";
  roundNumber: number;
  percentage?: number;
  amount?: number;
  dueDate?: string;
  notes?: string;
}

export class PaymentScheduleEngine {
  /**
   * Generates a unique Payment Reference in format [CaseCode]-[Type]-[Round]
   * Example: DN003-DP01 or HS2026-0001-IP02
   */
  public generatePaymentRef(caseCode: string, type: "DP" | "IP" | "FP" | "RF", roundNumber: number): string {
    const cleanCaseCode = (caseCode || "HS").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const formattedRound = String(roundNumber).padStart(2, "0");
    return `${cleanCaseCode}-${type}${formattedRound}`;
  }

  /**
   * Automatically initializes standard 3-round schedule for a new or updated case:
   * Round 1: Deposit (DP) - 30%
   * Round 2: Installment (IP) - 40%
   * Round 3: Final (FP) - 30%
   */
  public initializeDefaultSchedules(
    caseId: string,
    caseCode: string,
    totalContractValue: number,
    baseUrl: string = ""
  ): PaymentScheduleRecord[] {
    const existing = paymentRepository.findSchedulesByCaseId(caseId);
    if (existing && existing.length > 0) {
      return existing;
    }

    const val = Number(totalContractValue) || 0;
    const dpAmount = Math.round(val * 0.3);
    const ipAmount = Math.round(val * 0.4);
    const fpAmount = val - (dpAmount + ipAmount);

    const today = new Date();
    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res.toLocaleDateString("vi-VN");
    };

    const splits: ScheduleSplitInput[] = [
      {
        caseId,
        caseCode,
        type: "DP",
        roundNumber: 1,
        percentage: 30,
        amount: dpAmount,
        dueDate: addDays(today, 3),
        notes: "Thanh toán đợt 1: Tạm ứng/Đặt cọc 30% hợp đồng"
      },
      {
        caseId,
        caseCode,
        type: "IP",
        roundNumber: 2,
        percentage: 40,
        amount: ipAmount,
        dueDate: addDays(today, 30),
        notes: "Thanh toán đợt 2: Theo tiến độ thực hiện 40%"
      },
      {
        caseId,
        caseCode,
        type: "FP",
        roundNumber: 3,
        percentage: 30,
        amount: fpAmount,
        dueDate: addDays(today, 60),
        notes: "Thanh toán đợt 3: Nghiệm thu & Thanh lý hợp đồng 30%"
      }
    ];

    const results: PaymentScheduleRecord[] = [];
    const payment = paymentRepository.findPaymentByCaseId(caseId);

    for (const s of splits) {
      const ref = this.generatePaymentRef(s.caseCode, s.type, s.roundNumber);
      const qrUrl = qrEngine.generateVietQrUrl(s.amount || 0, ref);

      const created = paymentRepository.createSchedule({
        payment_id: payment ? payment.id : `PAY-${caseId}`,
        case_id: s.caseId,
        case_code: s.caseCode,
        payment_ref: ref,
        type: s.type,
        round: s.roundNumber,
        percentage: s.percentage,
        amount: s.amount,
        due_date: s.dueDate,
        status: s.roundNumber === 1 ? "Waiting Payment" : "Draft",
        notes: s.notes,
        qr_code_url: qrUrl
      });

      results.push(created);

      paymentEventBus.publish({
        eventType: PaymentEventType.PaymentScheduleCreated,
        caseId,
        paymentRef: ref,
        data: created
      });
    }

    return results;
  }

  /**
   * Adds or updates a single custom schedule round
   */
  public addOrUpdateScheduleRound(input: ScheduleSplitInput): PaymentScheduleRecord {
    const payment = paymentRepository.findPaymentByCaseId(input.caseId);
    const ref = this.generatePaymentRef(input.caseCode, input.type, input.roundNumber);
    const amount = Number(input.amount) || 0;
    const qrUrl = qrEngine.generateVietQrUrl(amount, ref);

    const record = paymentRepository.createSchedule({
      payment_id: payment ? payment.id : `PAY-${input.caseId}`,
      case_id: input.caseId,
      case_code: input.caseCode,
      payment_ref: ref,
      type: input.type,
      round: input.roundNumber,
      percentage: input.percentage || 0,
      amount,
      due_date: input.dueDate || new Date().toLocaleDateString("vi-VN"),
      status: "Waiting Payment",
      notes: input.notes || `Đợt thanh toán ${input.roundNumber}`,
      qr_code_url: qrUrl
    });

    return record;
  }
}

export const paymentScheduleEngine = new PaymentScheduleEngine();
