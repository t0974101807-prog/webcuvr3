import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import { paymentRepository } from "./payment.repository";
import { reconciliationEngine } from "./payment.reconciliation";
import { bankingGateway } from "./payment.bank";
import { aiFinancialAssistant } from "./payment.ai";
import { financialReportEngine } from "./payment.report";
import { paymentScheduleEngine } from "./payment.schedule";
import { qrEngine } from "./payment.qr";
import { SystemDataAccess } from "../../system/data-access/SystemDataAccess";
import db from "../../db/database";

export class PaymentController {
  /**
   * GET /api/payment/case/:caseId
   * Returns full payment details, schedules, receipts, and VietQR info for a case
   */
  public async getCasePayment(req: Request, res: Response) {
    try {
      const caseId = String(req.params.caseId);
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      // Check if payment initialized in DB
      let payment = paymentRepository.findPaymentByCaseId(caseId);
      if (!payment) {
        const parsed = SystemDataAccess.getRecordById(caseId);
        if (parsed) {
          const caseCode = parsed.contractId || parsed.systemId || caseId;
          const clientName = parsed.client || "Khách hàng";
          const contractVal = Number(parsed.revenue || parsed.feeAmount || 0);

          paymentService.syncCasePayment(caseId, caseCode, clientName, contractVal, baseUrl);
        }
      }

      const details = paymentService.getCasePaymentDetails(caseId, baseUrl);
      res.json({ success: true, ...details });
    } catch (err: any) {
      console.error("[PaymentController] getCasePayment error:", err);
      res.status(500).json({ success: false, error: err.message || "Lỗi máy chủ" });
    }
  }

  /**
   * POST /api/payment/schedule
   * Creates or updates a custom payment schedule round
   */
  public async createOrUpdateSchedule(req: Request, res: Response) {
    try {
      const { caseId, caseCode, type, roundNumber, percentage, amount, dueDate, notes } = req.body;
      if (!caseId) return res.status(400).json({ success: false, error: "Thiếu caseId" });

      const schedule = paymentScheduleEngine.addOrUpdateScheduleRound({
        caseId,
        caseCode: caseCode || caseId,
        type: type || "DP",
        roundNumber: Number(roundNumber) || 1,
        percentage: Number(percentage) || 0,
        amount: Number(amount) || 0,
        dueDate,
        notes
      });

      // Recalculate payment summary
      paymentRepository.updatePaymentSummary(caseId);

      res.json({ success: true, schedule });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/payment/bank-webhook
   * Banking Gateway Webhook Receiver Endpoint
   * Accepts incoming transactions from bank gateways (Cassso, MBBank, SeABank, Vietcombank, etc.)
   */
  public async receiveBankWebhook(req: Request, res: Response) {
    try {
      const { transactionId, bankCode, accountNumber, amount, transferContent, transactionTime, signature } = req.body;

      if (!transferContent || !amount || !accountNumber || !signature) {
        return res.status(400).json({ success: false, error: "Thiếu nội dung chuyển khoản, số tiền, tài khoản nhận hoặc chữ ký webhook" });
      }
      if (!bankingGateway.isConfigured() || !bankingGateway.verifySignature(req.body, signature)) {
        return res.status(401).json({ success: false, error: "Webhook ngân hàng chưa được cấu hình hoặc chữ ký không hợp lệ" });
      }

      const tx = {
        transactionId: transactionId || `FT${Date.now()}`,
        bankCode: String(bankCode || "").trim(),
        accountNumber: String(accountNumber).trim(),
        amount: Number(amount),
        transferContent: String(transferContent).trim(),
        transactionTime: transactionTime || new Date().toISOString(),
        signature
      };

      // 1. Log transaction in Gateway
      await bankingGateway.receiveTransaction(tx);

      // 2. Auto Reconciliation Engine
      const reconResult = reconciliationEngine.processTransaction(tx);

      res.json({
        success: reconResult.matched,
        message: reconResult.message,
        paymentRef: reconResult.paymentRef,
        receiptCode: reconResult.receiptCode
      });
    } catch (err: any) {
      console.error("[PaymentController] receiveBankWebhook error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/payment/simulate-transfer
   * Testing endpoint for simulating a VietQR bank transfer
   */
  public async simulateTransfer(req: Request, res: Response) {
    try {
      const { paymentRef, amount, accountNumber, bankCode } = req.body;
      if (!paymentRef) return res.status(400).json({ success: false, error: "Thiếu paymentRef" });

      const schedule = paymentRepository.findScheduleByRef(paymentRef);
      if (!schedule) {
        return res.status(404).json({ success: false, error: `Mã đợt thanh toán ${paymentRef} không tồn tại` });
      }

      const transferAmount = Number(amount) || schedule.amount;

      const tx = {
        transactionId: `SIM-${Date.now()}`,
        bankCode: bankCode || "MB",
        accountNumber: accountNumber || "0383111222",
        amount: transferAmount,
        transferContent: paymentRef,
        transactionTime: new Date().toISOString()
      };

      await bankingGateway.receiveTransaction(tx);
      const reconResult = reconciliationEngine.processTransaction(tx);

      res.json({
        success: reconResult.matched,
        message: reconResult.message,
        paymentRef: reconResult.paymentRef,
        receiptCode: reconResult.receiptCode,
        schedule: paymentRepository.findScheduleByRef(paymentRef)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/payment/public/case-qr/:token
   * Public Case QR lookup & dynamic payment routing
   */
  public async getPublicCaseQr(req: Request, res: Response) {
    try {
      const token = String(req.params.token);
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const result = paymentService.processPublicCaseQrScan(token, baseUrl);
      if (!result.found) {
        return res.status(404).json({ success: false, error: result.message });
      }

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/payment/receipts
   * List all generated Phiếu Thu
   */
  public async getReceipts(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) : null;
      const cursorStr = req.query.cursor as string;

      const result = paymentRepository.findAllReceipts(limit, cursorStr);
      if (Array.isArray(result)) {
        res.json({ success: true, receipts: result });
      } else {
        res.json({
          success: true,
          receipts: result.receipts,
          pagination: {
            limit,
            nextCursor: result.nextCursor,
            hasNextPage: result.hasNextPage
          }
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/payment/financial-dashboard
   * Full Financial Center Dashboard overview
   */
  public async getFinancialDashboard(req: Request, res: Response) {
    try {
      const report = financialReportEngine.getSummaryReport();
      const insights = aiFinancialAssistant.generateFinancialInsights();
      const recentTransactions = db.prepare("SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10").all();
      const recentEvents = db.prepare("SELECT * FROM payment_events ORDER BY id DESC LIMIT 15").all();

      res.json({
        success: true,
        report,
        insights,
        recentTransactions,
        recentEvents
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const paymentController = new PaymentController();
