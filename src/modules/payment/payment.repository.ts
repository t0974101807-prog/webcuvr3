import db from "../../db/database";
import { v4 as uuidv4 } from "uuid";
import { encodeCursor, decodeCursor } from "../../utils/cursor";

export interface PaymentRecord {
  id: string;
  case_id: string;
  case_code: string;
  client_id: string;
  client_name: string;
  contract_value: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentScheduleRecord {
  id: string;
  payment_id: string;
  case_id: string;
  case_code: string;
  payment_ref: string;
  type: "DP" | "IP" | "FP" | "RF";
  round: number;
  percentage: number;
  amount: number;
  due_date: string;
  status: string;
  notes: string;
  qr_code_url: string;
  qr_token: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionRecord {
  id: string;
  payment_ref: string;
  schedule_id: string;
  case_id: string;
  bank_code: string;
  account_number: string;
  account_holder: string;
  amount: number;
  transfer_content: string;
  transaction_time: string;
  transaction_id: string;
  status: string;
  reconciliation_notes: string;
  created_at: string;
}

export interface ReceiptRecord {
  id: string;
  receipt_code: string;
  payment_ref: string;
  case_id: string;
  case_code: string;
  client_name: string;
  amount: number;
  payment_method: string;
  created_by: string;
  notes: string;
  created_at: string;
}

export class PaymentRepository {
  // Payments
  public findPaymentByCaseId(caseId: string): PaymentRecord | null {
    const row = db.prepare("SELECT * FROM payments WHERE case_id = ?").get(caseId) as PaymentRecord | undefined;
    return row || null;
  }

  public createPayment(data: Partial<PaymentRecord>): PaymentRecord {
    const now = new Date().toISOString();
    const id = data.id || `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;
    const record: PaymentRecord = {
      id,
      case_id: data.case_id || "",
      case_code: data.case_code || "",
      client_id: data.client_id || "",
      client_name: data.client_name || "Khách hàng",
      contract_value: Number(data.contract_value || 0),
      paid_amount: Number(data.paid_amount || 0),
      remaining_amount: Number((data.contract_value || 0) - (data.paid_amount || 0)),
      status: data.status || "Pending",
      created_at: now,
      updated_at: now
    };

    db.prepare(`
      INSERT INTO payments (id, case_id, case_code, client_id, client_name, contract_value, paid_amount, remaining_amount, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(case_id) DO UPDATE SET
        case_code = excluded.case_code,
        client_name = excluded.client_name,
        contract_value = excluded.contract_value,
        remaining_amount = excluded.contract_value - payments.paid_amount,
        updated_at = excluded.updated_at
    `).run(
      record.id,
      record.case_id,
      record.case_code,
      record.client_id,
      record.client_name,
      record.contract_value,
      record.paid_amount,
      record.remaining_amount,
      record.status,
      record.created_at,
      record.updated_at
    );

    return this.findPaymentByCaseId(record.case_id)!;
  }

  public updatePaymentSummary(caseId: string): PaymentRecord | null {
    const payment = this.findPaymentByCaseId(caseId);
    if (!payment) return null;

    const schedules = this.findSchedulesByCaseId(caseId);
    let paidTotal = 0;

    for (const sched of schedules) {
      if (sched.status === "Completed" || sched.status === "Receipt Created" || sched.status === "Finance Approved") {
        paidTotal += Number(sched.amount || 0);
      }
    }

    const remaining = Math.max(0, payment.contract_value - paidTotal);
    let newStatus = payment.status;
    if (paidTotal >= payment.contract_value && payment.contract_value > 0) {
      newStatus = "Completed";
    } else if (paidTotal > 0) {
      newStatus = "Partially Paid";
    } else {
      newStatus = "Pending";
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE payments
      SET paid_amount = ?, remaining_amount = ?, status = ?, updated_at = ?
      WHERE case_id = ?
    `).run(paidTotal, remaining, newStatus, now, caseId);

    return this.findPaymentByCaseId(caseId);
  }

  // Payment Schedules
  public findSchedulesByCaseId(caseId: string): PaymentScheduleRecord[] {
    return db.prepare("SELECT * FROM payment_schedules WHERE case_id = ? ORDER BY round ASC").all(caseId) as PaymentScheduleRecord[];
  }

  public findScheduleByRef(paymentRef: string): PaymentScheduleRecord | null {
    const row = db.prepare("SELECT * FROM payment_schedules WHERE payment_ref = ?").get(paymentRef) as PaymentScheduleRecord | undefined;
    return row || null;
  }

  public findPendingScheduleByCaseId(caseId: string): PaymentScheduleRecord | null {
    const row = db.prepare(`
      SELECT * FROM payment_schedules 
      WHERE case_id = ? AND status NOT IN ('Completed', 'Receipt Created', 'Cancelled')
      ORDER BY round ASC LIMIT 1
    `).get(caseId) as PaymentScheduleRecord | undefined;
    return row || null;
  }

  public createSchedule(data: Partial<PaymentScheduleRecord>): PaymentScheduleRecord {
    const now = new Date().toISOString();
    const id = data.id || `SCHED-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    db.prepare(`
      INSERT INTO payment_schedules (id, payment_id, case_id, case_code, payment_ref, type, round, percentage, amount, due_date, status, notes, qr_code_url, qr_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(payment_ref) DO UPDATE SET
        amount = excluded.amount,
        percentage = excluded.percentage,
        due_date = excluded.due_date,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(
      id,
      data.payment_id || "",
      data.case_id || "",
      data.case_code || "",
      data.payment_ref || "",
      data.type || "DP",
      data.round || 1,
      data.percentage || 0,
      data.amount || 0,
      data.due_date || "",
      data.status || "Draft",
      data.notes || "",
      data.qr_code_url || "",
      data.qr_token || "",
      now,
      now
    );

    return this.findScheduleByRef(data.payment_ref!)!;
  }

  public updateScheduleStatus(paymentRef: string, status: string, extra: Record<string, any> = {}): PaymentScheduleRecord | null {
    const now = new Date().toISOString();
    db.prepare("UPDATE payment_schedules SET status = ?, updated_at = ? WHERE payment_ref = ?").run(status, now, paymentRef);
    const updated = this.findScheduleByRef(paymentRef);
    if (updated) {
      this.updatePaymentSummary(updated.case_id);
    }
    return updated;
  }

  // Transactions
  public createTransaction(tx: Partial<PaymentTransactionRecord>): PaymentTransactionRecord {
    const id = tx.id || `TX-${uuidv4().substring(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO payment_transactions (id, payment_ref, schedule_id, case_id, bank_code, account_number, account_holder, amount, transfer_content, transaction_time, transaction_id, status, reconciliation_notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      tx.payment_ref || "",
      tx.schedule_id || "",
      tx.case_id || "",
      tx.bank_code || "MB",
      tx.account_number || "999988889999",
      tx.account_holder || "CONG TY LUAT TNHH ANH DUONG",
      tx.amount || 0,
      tx.transfer_content || "",
      tx.transaction_time || now,
      tx.transaction_id || `FT${Date.now()}`,
      tx.status || "Matched",
      tx.reconciliation_notes || "Tự động đối chiếu thành công qua Banking Gateway",
      now
    );

    return db.prepare("SELECT * FROM payment_transactions WHERE id = ?").get(id) as PaymentTransactionRecord;
  }

  public findTransactionsByRef(paymentRef: string): PaymentTransactionRecord[] {
    return db.prepare("SELECT * FROM payment_transactions WHERE payment_ref = ? ORDER BY created_at DESC").all(paymentRef) as PaymentTransactionRecord[];
  }

  // Receipts (Phiếu thu)
  public createReceipt(data: Partial<ReceiptRecord>): ReceiptRecord {
    const id = data.id || `REC-${uuidv4().substring(0, 8).toUpperCase()}`;
    let receiptCode = data.receipt_code;
    if (!receiptCode) {
      let isUnique = false;
      while (!isUnique) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        receiptCode = `PT-${new Date().getFullYear()}-${rand}`;
        const existing = db.prepare("SELECT id FROM receipts WHERE receipt_code = ?").get(receiptCode);
        if (!existing) {
          isUnique = true;
        }
      }
    }
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO receipts (id, receipt_code, payment_ref, case_id, case_code, client_name, amount, payment_method, created_by, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      receiptCode,
      data.payment_ref || "",
      data.case_id || "",
      data.case_code || "",
      data.client_name || "Khách hàng",
      data.amount || 0,
      data.payment_method || "VietQR Chuyển khoản ngân hàng",
      data.created_by || "Hệ thống Financial Center",
      data.notes || "Thanh toán tự động qua VietQR đối chiếu thành công",
      now
    );

    return db.prepare("SELECT * FROM receipts WHERE id = ?").get(id) as ReceiptRecord;
  }

  public findReceiptByRef(paymentRef: string): ReceiptRecord | null {
    const row = db.prepare("SELECT * FROM receipts WHERE payment_ref = ?").get(paymentRef) as ReceiptRecord | undefined;
    return row || null;
  }

  public findAllReceipts(limit?: number | null, cursorStr?: string): { receipts: ReceiptRecord[], nextCursor: string | null, hasNextPage: boolean } | ReceiptRecord[] {
    if (limit !== undefined && limit !== null) {
      let query = "SELECT * FROM receipts";
      const params: any = {};

      if (cursorStr) {
        const cursor = decodeCursor(cursorStr);
        if (cursor && cursor.createdAt && cursor.id) {
          query += " WHERE created_at < :cursorCreatedAt OR (created_at = :cursorCreatedAt AND id < :cursorId)";
          params.cursorCreatedAt = cursor.createdAt;
          params.cursorId = cursor.id;
        }
      }

      query += " ORDER BY created_at DESC, id DESC LIMIT :limitPlusOne";
      params.limitPlusOne = limit + 1;

      const rows = db.prepare(query).all(params) as ReceiptRecord[];
      const hasNextPage = rows.length > limit;
      const returnedRows = hasNextPage ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasNextPage && returnedRows.length > 0) {
        const lastRow = returnedRows[returnedRows.length - 1];
        nextCursor = encodeCursor({ createdAt: lastRow.created_at, id: lastRow.id });
      }

      return { receipts: returnedRows, nextCursor, hasNextPage };
    }
    return db.prepare("SELECT * FROM receipts ORDER BY created_at DESC").all() as ReceiptRecord[];
  }

  // Case QR Token
  public getOrCreateCaseQrToken(caseId: string): string {
    const existing = db.prepare("SELECT token FROM case_qr_tokens WHERE case_id = ?").get(caseId) as { token: string } | undefined;
    if (existing) return existing.token;

    const token = `case_${uuidv4().substring(0, 12)}`;
    db.prepare("INSERT INTO case_qr_tokens (id, case_id, token, created_at) VALUES (?, ?, ?, ?)").run(
      `CQR-${uuidv4().substring(0, 8)}`,
      caseId,
      token,
      new Date().toISOString()
    );
    return token;
  }

  public findCaseByQrToken(token: string): string | null {
    const row = db.prepare("SELECT case_id FROM case_qr_tokens WHERE token = ?").get(token) as { case_id: string } | undefined;
    return row ? row.case_id : null;
  }
}

export const paymentRepository = new PaymentRepository();
