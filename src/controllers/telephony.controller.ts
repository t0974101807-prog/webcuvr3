import { Router, Request, Response } from "express";
import db from "../db/database";

const router = Router();

// Track ongoing click-to-call sessions
export const activeVoipCalls = new Map<string, any>();

/**
 * POST /api/telephony/click-to-call
 * Initiates click-to-call session by communicating with VoIP gateway (e.g. Yeastart, FPT VCC, or simulation)
 */
router.post("/click-to-call", async (req: Request, res: Response) => {
  try {
    const { phone, dossierId, name } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: "Số điện thoại là bắt buộc" });
    }

    const sessionUser = (req as any).user || (req as any).session?.user || { name: "Luật sư", role: "Chuyên viên" };
    const callId = `call_voip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    console.log(`[Telephony Click-To-Call] Initiating call to ${phone} (Client: ${name || "N/A"}, Case: ${dossierId || "N/A"}) by ${sessionUser.name}`);

    // Simulate connection to VOIP Provider Gateway API (e.g. FPT.AI / VCC / Yeastar)
    // In a real system, you would do a fetch to the provider's HTTPS endpoint.
    const mockVoipResponse = {
      status: "success",
      message: "Call request dispatched to SBC trunk successfully",
      trunkLine: "TRUNK_VCC_01",
      sessionId: callId
    };

    // Store active VoIP call state
    const callSession = {
      id: callId,
      phone,
      dossierId,
      name: name || "Khách hàng",
      staffName: sessionUser.name,
      status: "DIALING",
      start_time: new Date().toISOString(),
      direction: "OUTBOUND"
    };
    activeVoipCalls.set(callId, callSession);

    // Broadcast DIALING state to all connected Socket.io users
    const io = req.app.get("io");
    if (io) {
      io.emit("telephony_dialing", callSession);
      
      // Simulate ringing after 1.5 seconds
      setTimeout(() => {
        const ringSession = { ...callSession, status: "RINGING" };
        activeVoipCalls.set(callId, ringSession);
        io.emit("telephony_ringing", ringSession);
      }, 1500);

      // Simulate connection answered after 4 seconds
      setTimeout(() => {
        const connectedSession = { ...callSession, status: "CONNECTED", answer_time: new Date().toISOString() };
        activeVoipCalls.set(callId, connectedSession);
        io.emit("telephony_connected", connectedSession);
      }, 4000);
    }

    return res.json({
      success: true,
      data: mockVoipResponse,
      session: callSession
    });
  } catch (error: any) {
    console.error("[Telephony Click-to-Call Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/telephony/hangup
 * Terminates active click-to-call session
 */
router.post("/hangup", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    // Find first active call if sessionId is not specified
    let targetSessionId = sessionId;
    if (!targetSessionId && activeVoipCalls.size > 0) {
      targetSessionId = Array.from(activeVoipCalls.keys())[0];
    }

    if (!targetSessionId || !activeVoipCalls.has(targetSessionId)) {
      return res.json({ success: true, message: "No active VoIP session found to hang up" });
    }

    const callSession = activeVoipCalls.get(targetSessionId);
    const end_time = new Date().toISOString();
    const duration = Math.round((Date.now() - new Date(callSession.start_time).getTime()) / 1000);

    const endedSession = {
      ...callSession,
      status: "ENDED",
      end_time,
      duration,
      recordingUrl: `/uploads/recordings/${targetSessionId}.mp3` // Simulated auto-recording url
    };

    activeVoipCalls.delete(targetSessionId);

    // Save completed call log to `voip_calls` table
    try {
      db.prepare(`
        INSERT INTO voip_calls (
          id, name, phone, phone_number, type, direction, duration, timestamp, start_time, answer_time, end_time,
          staffName, staffRole, branch, status, hasRecording, recordingUrl, dossierId, gateway, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        targetSessionId,
        endedSession.name,
        endedSession.phone,
        endedSession.phone,
        "outgoing",
        "OUTBOUND",
        duration,
        endedSession.start_time,
        endedSession.start_time,
        endedSession.start_time, // answer time approximation
        end_time,
        endedSession.staffName,
        "Lawyer",
        "Trụ sở chính",
        "connected",
        1,
        endedSession.recordingUrl,
        endedSession.dossierId || null,
        "yeastar",
        endedSession.start_time,
        new Date().toISOString()
      );
    } catch (insertErr) {
      console.error("Error saving hung up call session to database:", insertErr);
    }

    // Broadcast ENDED state to frontend
    const io = req.app.get("io");
    if (io) {
      io.emit("telephony_ended", endedSession);
      io.emit("call_log_updated", endedSession);
    }

    return res.json({
      success: true,
      message: "Call successfully hung up",
      session: endedSession
    });
  } catch (error: any) {
    console.error("[Telephony Hangup Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
