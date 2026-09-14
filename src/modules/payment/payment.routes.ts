import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/auth";

const router = Router();

// Public route for scanning Case QR Code
router.get("/public/case-qr/:token", (req, res) => paymentController.getPublicCaseQr(req, res));

// Banking Gateway Webhook Receiver (unprotected or signature protected for bank webhooks)
router.post("/bank-webhook", (req, res) => paymentController.receiveBankWebhook(req, res));

// Protected API routes
router.get("/case/:caseId", auth, (req, res) => paymentController.getCasePayment(req, res));
router.post("/schedule", auth, (req, res) => paymentController.createOrUpdateSchedule(req, res));
router.post("/simulate-transfer", auth, (req, res) => paymentController.simulateTransfer(req, res));
router.get("/receipts", auth, (req, res) => paymentController.getReceipts(req, res));
router.get("/financial-dashboard", auth, (req, res) => paymentController.getFinancialDashboard(req, res));

export default router;
