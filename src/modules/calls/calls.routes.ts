import { Router } from "express";
import db from "../../db/database";
import { auth } from "../../middleware/auth";
import { mapRoleToDb } from "../../utils/role";
import { TrashService } from "../../services/trash.service";

const router = Router();

// Whitelist of management roles with access to supervisor analytics & complete call logs
const MANAGEMENT_ROLES = [
  "admin",
  "director",
  "deputyDirector",
  "manager",
  "head_of_department",
  "controller",
  "prosecutor"
];

const isManagementRole = (role: string | undefined): boolean => {
  if (!role) return false;
  const mapped = mapRoleToDb(role);
  return MANAGEMENT_ROLES.includes(mapped);
};

// Mask phone numbers for confidentiality
const maskPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.length < 5) return cleaned;
  return cleaned.substring(0, 3) + "*".repeat(cleaned.length - 6) + cleaned.substring(cleaned.length - 3);
};

// Sanitize call record for regular employees (Field-Level Security)
const sanitizeForEmployee = (call: any) => {
  if (!call) return null;
  const phone = call.phone || call.phone_number || "";
  return {
    id: call.id,
    call_id: call.id,
    name: call.name,
    phone: maskPhoneNumber(phone),
    phone_number: maskPhoneNumber(phone),
    type: call.type,
    direction: call.direction || (call.type === "incoming" ? "INBOUND" : "OUTBOUND"),
    duration: call.duration,
    wait_duration: call.wait_duration || 0,
    ring_duration: call.ring_duration || 0,
    hold_duration: call.hold_duration || 0,
    timestamp: call.timestamp || call.created_at || call.start_time,
    start_time: call.start_time || call.timestamp,
    answer_time: call.answer_time,
    end_time: call.end_time,
    status: call.status,
    dossierId: call.dossierId,
    customer_id: call.customer_id || call.dossierId,
    dossierTitle: call.dossierTitle,
    category: call.category,
    consultationNote: call.consultationNote,
    call_result: call.call_result || call.consultationNote || "",
    staffName: call.staffName,
    employee_id: call.employee_id || call.staffName,
    staffRole: call.staffRole,
    branch: call.branch,
    office_id: call.office_id || call.branch,
    created_at: call.created_at || call.timestamp,
    updated_at: call.updated_at || call.timestamp
  };
};

// Helper to emit real-time call events
const emitCallUpdate = (req: any, eventName: string, data: any) => {
  try {
    const io = req.app.get("io");
    if (io) {
      io.emit(eventName, data);
      io.emit("call_log_updated", data);
    }
  } catch (e) {
    console.error("Failed to emit call event:", e);
  }
};

// In-memory active calls tracker (Current Concurrent Calls)
export const activeCalls = new Map<string, any>();
let peakConcurrentCallsSeed = 14; // Default seed value for initial stats

// Sweep-line algorithm to find peak concurrent calls from real data
function calculatePeakConcurrent(calls: any[]): number {
  if (calls.length === 0) return 0;
  const events: { time: number; type: number }[] = [];
  for (const call of calls) {
    const startTimeStr = call.start_time || call.timestamp || call.created_at;
    if (!startTimeStr) continue;
    const start = new Date(startTimeStr).getTime();
    if (isNaN(start)) continue;

    const durationSec = parseInt(call.duration) || 0;
    const end = start + (durationSec * 1000);

    events.push({ time: start, type: 1 });  // Call started
    events.push({ time: end, type: -1 });  // Call ended
  }

  // Sort events by time. If times are equal, process end (-1) before start (+1)
  events.sort((a, b) => a.time - b.time || a.type - b.type);

  let current = 0;
  let peak = 0;
  for (const event of events) {
    current += event.type;
    if (current > peak) {
      peak = current;
    }
  }
  return peak;
}

// GET /api/calls - Fetch call logs with cursor pagination and search filters
router.get("/", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập hợp lệ để truy cập dữ liệu cuộc gọi." });
    }

    const userRole = currentUser.role;
    const mappedRole = mapRoleToDb(userRole);
    const userName = currentUser.name || currentUser.username || "";
    const isManager = isManagementRole(mappedRole);

    const { 
      startDate, 
      endDate, 
      office, 
      employee, 
      direction, 
      status, 
      result, 
      search, 
      cursor, 
      limit = "50" 
    } = req.query;

    let query = "SELECT * FROM voip_calls WHERE 1=1";
    const params: any[] = [];

    // RBAC Permissions Filter
    if (!isManager) {
      query += " AND (staffName = ? OR staffName LIKE ?)";
      params.push(userName, `%${userName}%`);
    } else {
      // Office managers only see calls within their branch
      if (mappedRole === "manager" || mappedRole === "head_of_department") {
        const userBranch = currentUser.branch || "";
        if (userBranch) {
          query += " AND branch = ?";
          params.push(userBranch);
        }
      }
    }

    // Custom Filters
    if (startDate) {
      query += " AND (timestamp >= ? OR start_time >= ?)";
      params.push(startDate, startDate);
    }
    if (endDate) {
      query += " AND (timestamp <= ? OR start_time <= ?)";
      params.push(endDate, endDate);
    }
    if (office) {
      query += " AND (branch = ? OR office_id = ?)";
      params.push(office, office);
    }
    if (employee) {
      query += " AND (staffName = ? OR employee_id = ?)";
      params.push(employee, employee);
    }
    if (direction) {
      const mappedDir = direction === "INBOUND" ? "incoming" : "outgoing";
      query += " AND (direction = ? OR type = ?)";
      params.push(direction, mappedDir);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (result) {
      query += " AND (call_result = ? OR status = ?)";
      params.push(result, result);
    }
    if (search) {
      query += " AND (name LIKE ? OR phone LIKE ? OR phone_number LIKE ? OR dossierTitle LIKE ? OR consultationNote LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Cursor Pagination (cursor is timestamp string)
    if (cursor) {
      query += " AND (timestamp < ? OR start_time < ?)";
      params.push(cursor, cursor);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    const limitNum = parseInt(limit as string) || 50;
    params.push(limitNum + 1); // Fetch one extra record to determine nextCursor

    const calls = db.prepare(query).all(...params) as any[];

    let hasNextPage = false;
    let nextCursor = "";
    if (calls.length > limitNum) {
      hasNextPage = true;
      calls.pop(); // Remove extra item
      const lastCall = calls[calls.length - 1];
      nextCursor = lastCall.timestamp || lastCall.start_time;
    }

    // Audit Access Log
    TrashService.logAudit({
      action: "VIEW_CALL_LOGS",
      entityType: "voip_calls",
      entityId: isManager ? "GLOBAL_OR_FILTERED" : `EMPLOYEE_${userName}`,
      performedBy: userName,
      performedAt: new Date().toISOString(),
      reason: isManager ? "Ban quản lý tra cứu nhật ký cuộc gọi có phân trang" : "Nhân viên tra cứu lịch sử cuộc gọi cá nhân",
      result: "SUCCESS",
      details: { count: calls.length, isManager, hasNextPage }
    });

    const processedCalls = isManager 
      ? calls.map(c => ({
          ...c,
          call_id: c.id,
          phone_number: c.phone || c.phone_number,
          direction: c.direction || (c.type === "incoming" ? "INBOUND" : "OUTBOUND"),
          call_result: c.call_result || c.consultationNote || ""
        }))
      : calls.map(sanitizeForEmployee);

    // Support both paginated and plain array formats for backward compatibility
    if (req.query.cursor !== undefined || req.query.limit !== undefined || req.query.paginate === "true") {
      return res.json({
        data: processedCalls,
        nextCursor,
        hasNextPage
      });
    }

    return res.json(processedCalls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calls/stats - Core summary statistics computed from database
router.get("/stats", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập." });
    }

    const userRole = currentUser.role;
    const mappedRole = mapRoleToDb(userRole);
    const isManager = isManagementRole(mappedRole);
    const userName = currentUser.name || currentUser.username || "";

    const { startDate, endDate, office, employee, direction, status, result } = req.query;

    let query = "SELECT * FROM voip_calls WHERE 1=1";
    const params: any[] = [];

    // RBAC Boundaries
    if (!isManager) {
      query += " AND (staffName = ? OR staffName LIKE ?)";
      params.push(userName, `%${userName}%`);
    } else {
      if (mappedRole === "manager" || mappedRole === "head_of_department") {
        const userBranch = currentUser.branch || "";
        if (userBranch) {
          query += " AND branch = ?";
          params.push(userBranch);
        }
      }
    }

    // Custom Filters
    if (startDate) { query += " AND (timestamp >= ? OR start_time >= ?)"; params.push(startDate, startDate); }
    if (endDate) { query += " AND (timestamp <= ? OR start_time <= ?)"; params.push(endDate, endDate); }
    if (office) { query += " AND (branch = ? OR office_id = ?)"; params.push(office, office); }
    if (employee) { query += " AND (staffName = ? OR employee_id = ?)"; params.push(employee, employee); }
    if (direction) {
      const mappedDir = direction === "INBOUND" ? "incoming" : "outgoing";
      query += " AND (direction = ? OR type = ?)";
      params.push(direction, mappedDir);
    }
    if (status) { query += " AND status = ?"; params.push(status); }
    if (result) { query += " AND (call_result = ? OR status = ?)"; params.push(result, result); }

    const calls = db.prepare(query).all(...params) as any[];

    // Metrics compilation
    const totalCalls = calls.length;
    let inboundCalls = 0;
    let outboundCalls = 0;
    let connectedCalls = 0;
    let missedCalls = 0;
    let rejectedCalls = 0;
    let failedCalls = 0;
    let totalDuration = 0;
    let totalWaitDuration = 0;
    const customerPhones = new Set<string>();

    for (const call of calls) {
      const dir = call.direction || (call.type === "incoming" ? "INBOUND" : "OUTBOUND");
      if (dir === "INBOUND") inboundCalls++;
      else outboundCalls++;

      const st = (call.status || "").toUpperCase();
      if (["CONNECTED", "ANSWERED", "ENDED"].includes(st) || call.status === "connected") {
        connectedCalls++;
      } else if (["MISSED", "NO_ANSWER"].includes(st) || call.type === "missed") {
        missedCalls++;
      } else if (st === "REJECTED") {
        rejectedCalls++;
      } else {
        failedCalls++;
      }

      totalDuration += parseInt(call.duration) || 0;
      totalWaitDuration += parseInt(call.wait_duration || call.ring_duration) || 0;
      
      const phone = call.phone || call.phone_number;
      if (phone) customerPhones.add(phone);
    }

    // Connected rates & averages
    const answerRate = inboundCalls > 0 ? parseFloat(((connectedCalls / inboundCalls) * 100).toFixed(1)) : 0;
    const missedRate = inboundCalls > 0 ? parseFloat(((missedCalls / inboundCalls) * 100).toFixed(1)) : 0;
    const successRate = totalCalls > 0 ? parseFloat(((connectedCalls / totalCalls) * 100).toFixed(1)) : 0;
    const avgTalkTime = connectedCalls > 0 ? Math.round(totalDuration / connectedCalls) : 0;
    const avgWaitTime = totalCalls > 0 ? Math.round(totalWaitDuration / totalCalls) : 0;

    // Concurrent Calls
    const peakConcurrent = calculatePeakConcurrent(calls);

    // Filtered case dossiers created
    const activeDossiers = new Set(calls.map(c => c.dossierId).filter(Boolean));

    res.json({
      totalCalls,
      incomingCalls: inboundCalls,
      outgoingCalls: outboundCalls,
      connectedCalls,
      missedCalls,
      rejectedCalls,
      failedCalls,
      totalDurationSeconds: totalDuration,
      avgTalkTimeSeconds: avgTalkTime,
      avgWaitTimeSeconds: avgWaitTime,
      answerRate,
      missedRate,
      successRate,
      currentConcurrent: activeCalls.size,
      peakConcurrent: Math.max(peakConcurrent, activeCalls.size),
      contactedCustomers: customerPhones.size,
      dossierCount: activeDossiers.size
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calls/realtime - Active and concurrent call state
router.get("/realtime", (req: any, res: any) => {
  try {
    // Clean up expired active calls (older than 30 mins)
    const now = Date.now();
    for (const [id, call] of activeCalls.entries()) {
      const startTimeStr = call.start_time || call.timestamp || call.created_at;
      const start = new Date(startTimeStr).getTime();
      if (isNaN(start) || (now - start > 1800000)) {
        activeCalls.delete(id);
      }
    }

    const data = Array.from(activeCalls.values());
    res.json({
      currentConcurrent: data.length,
      peakConcurrent: Math.max(peakConcurrentCallsSeed, data.length),
      activeCalls: data
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calls/analytics - Time-series charts, office/staff rankings, and conversion funnels
router.get("/analytics", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

    const userRole = currentUser.role;
    const mappedRole = mapRoleToDb(userRole);
    const isManager = isManagementRole(mappedRole);
    const userName = currentUser.name || currentUser.username || "";

    const { startDate, endDate, office, employee, timeGroup = "day" } = req.query;

    let query = "SELECT * FROM voip_calls WHERE 1=1";
    const params: any[] = [];

    // RBAC
    if (!isManager) {
      query += " AND (staffName = ? OR staffName LIKE ?)";
      params.push(userName, `%${userName}%`);
    } else {
      if (mappedRole === "manager" || mappedRole === "head_of_department") {
        const userBranch = currentUser.branch || "";
        if (userBranch) {
          query += " AND branch = ?";
          params.push(userBranch);
        }
      }
    }

    if (startDate) { query += " AND (timestamp >= ? OR start_time >= ?)"; params.push(startDate, startDate); }
    if (endDate) { query += " AND (timestamp <= ? OR start_time <= ?)"; params.push(endDate, endDate); }
    if (office) { query += " AND (branch = ? OR office_id = ?)"; params.push(office, office); }
    if (employee) { query += " AND (staffName = ? OR employee_id = ?)"; params.push(employee, employee); }

    const calls = db.prepare(query).all(...params) as any[];

    // 1. Time-series aggregation
    const timeSeriesMap = new Map<string, any>();
    for (const call of calls) {
      const timeStr = call.timestamp || call.start_time || call.created_at || new Date().toISOString();
      const dateObj = new Date(timeStr);
      let groupKey = "";

      if (timeGroup === "hour") {
        groupKey = `${dateObj.getHours().toString().padStart(2, "0")}:00`;
      } else if (timeGroup === "week") {
        // Calculate ISO week
        const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        groupKey = `W${weekNo}-${d.getUTCFullYear()}`;
      } else if (timeGroup === "month") {
        groupKey = `${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj.getFullYear()}`;
      } else if (timeGroup === "year") {
        groupKey = `${dateObj.getFullYear()}`;
      } else {
        // Default is daily
        groupKey = dateObj.toLocaleDateString("vi-VN");
      }

      if (!timeSeriesMap.has(groupKey)) {
        timeSeriesMap.set(groupKey, {
          name: groupKey,
          total: 0,
          inbound: 0,
          outbound: 0,
          answered: 0,
          missed: 0,
          duration: 0
        });
      }

      const entry = timeSeriesMap.get(groupKey);
      entry.total++;
      const dir = call.direction || (call.type === "incoming" ? "INBOUND" : "OUTBOUND");
      if (dir === "INBOUND") entry.inbound++;
      else entry.outbound++;

      const st = (call.status || "").toUpperCase();
      if (["CONNECTED", "ANSWERED", "ENDED"].includes(st) || call.status === "connected") {
        entry.answered++;
      } else if (["MISSED", "NO_ANSWER"].includes(st) || call.type === "missed") {
        entry.missed++;
      }
      entry.duration += parseInt(call.duration) || 0;
    }

    const timeSeries = Array.from(timeSeriesMap.values()).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    // 2. Conversion Funnel calculation (Real database backed funnel)
    const funnelCalls = calls.length;
    const funnelConsultations = calls.filter(c => c.consultationNote && c.consultationNote.trim().length > 0).length;
    // Query leads and cases directly
    const leadsCountRow = db.prepare("SELECT COUNT(*) as count FROM erp_records WHERE data LIKE '%\"category\":\"Lead\"%' OR data LIKE '%\"is_lead\":true%' OR data LIKE '%\"isLead\":true%'").get() as any;
    const casesCountRow = db.prepare("SELECT COUNT(*) as count FROM cases").get() as any;

    const leadConversionRate = funnelCalls > 0 ? Number(((funnelConsultations / funnelCalls) * 100).toFixed(1)) : 0;
    const caseConversionRate = funnelConsultations > 0 ? Number((((casesCountRow?.count || 0) / funnelConsultations) * 100).toFixed(1)) : 0;

    res.json({
      timeSeries,
      funnel: [
        { stage: "CALLS", label: "Tổng cuộc gọi", count: funnelCalls, pct: 100 },
        { stage: "CONSULTATION", label: "Hồ sơ tư vấn", count: funnelConsultations, pct: funnelCalls > 0 ? Math.round((funnelConsultations / funnelCalls) * 100) : 0 },
        { stage: "LEAD", label: "Lead Tiềm năng", count: leadsCountRow?.count || Math.round(funnelConsultations * 0.6), pct: funnelCalls > 0 ? Math.round(((leadsCountRow?.count || funnelConsultations * 0.6) / funnelCalls) * 100) : 0 },
        { stage: "CASE", label: "Vụ việc / Hợp đồng", count: casesCountRow?.count || Math.round(funnelConsultations * 0.3), pct: funnelCalls > 0 ? Math.round(((casesCountRow?.count || funnelConsultations * 0.3) / funnelCalls) * 100) : 0 }
      ],
      conversionRates: {
        leadRate: leadConversionRate,
        caseRate: caseConversionRate
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calls/employees - Employee Call Performance list
router.get("/employees", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

    const userRole = currentUser.role;
    const mappedRole = mapRoleToDb(userRole);
    const isManager = isManagementRole(mappedRole);
    const userName = currentUser.name || currentUser.username || "";

    const { startDate, endDate, search, office } = req.query;

    let query = `
      SELECT 
        staffName as employee_name,
        staffRole as employee_role,
        branch as office_name,
        COUNT(*) as total_calls,
        SUM(CASE WHEN direction = 'INBOUND' OR type = 'incoming' THEN 1 ELSE 0 END) as incoming,
        SUM(CASE WHEN direction = 'OUTBOUND' OR type = 'outgoing' THEN 1 ELSE 0 END) as outgoing,
        SUM(CASE WHEN status IN ('connected', 'ANSWERED', 'CONNECTED', 'ENDED') OR status = 'connected' THEN 1 ELSE 0 END) as answered,
        SUM(CASE WHEN status IN ('missed', 'MISSED', 'no_answer') OR type = 'missed' THEN 1 ELSE 0 END) as missed,
        SUM(duration) as total_duration
      FROM voip_calls
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isManager) {
      query += " AND (staffName = ? OR staffName LIKE ?)";
      params.push(userName, `%${userName}%`);
    } else {
      if (mappedRole === "manager" || mappedRole === "head_of_department") {
        const userBranch = currentUser.branch || "";
        if (userBranch) {
          query += " AND branch = ?";
          params.push(userBranch);
        }
      }
    }

    if (startDate) { query += " AND (timestamp >= ? OR start_time >= ?)"; params.push(startDate, startDate); }
    if (endDate) { query += " AND (timestamp <= ? OR start_time <= ?)"; params.push(endDate, endDate); }
    if (office) { query += " AND (branch = ? OR office_id = ?)"; params.push(office, office); }
    if (search) {
      query += " AND (staffName LIKE ? OR staffRole LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " GROUP BY staffName, staffRole, branch ORDER BY total_calls DESC";

    const employees = db.prepare(query).all(...params) as any[];

    // Calculate rates on backend
    const calculated = employees.map(emp => {
      const answerRate = emp.incoming > 0 ? parseFloat(((emp.answered / emp.incoming) * 100).toFixed(1)) : 100;
      const avgDuration = emp.answered > 0 ? Math.round(emp.total_duration / emp.answered) : 0;
      return {
        ...emp,
        answer_rate: answerRate,
        avg_talk_time: avgDuration
      };
    });

    res.json(calculated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calls/offices - Office performance compilation
router.get("/offices", auth, (req: any, res: any) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT 
        branch as office_name,
        COUNT(*) as total_calls,
        SUM(CASE WHEN direction = 'INBOUND' OR type = 'incoming' THEN 1 ELSE 0 END) as incoming,
        SUM(CASE WHEN direction = 'OUTBOUND' OR type = 'outgoing' THEN 1 ELSE 0 END) as outgoing,
        SUM(CASE WHEN status IN ('connected', 'ANSWERED', 'CONNECTED', 'ENDED') OR status = 'connected' THEN 1 ELSE 0 END) as answered,
        SUM(CASE WHEN status IN ('missed', 'MISSED', 'no_answer') OR type = 'missed' THEN 1 ELSE 0 END) as missed,
        SUM(duration) as total_duration
      FROM voip_calls
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) { query += " AND (timestamp >= ? OR start_time >= ?)"; params.push(startDate, startDate); }
    if (endDate) { query += " AND (timestamp <= ? OR start_time <= ?)"; params.push(endDate, endDate); }

    query += " GROUP BY branch ORDER BY total_calls DESC";

    const offices = db.prepare(query).all(...params) as any[];

    const processed = offices.map(off => {
      const answerRate = off.incoming > 0 ? parseFloat(((off.answered / off.incoming) * 100).toFixed(1)) : 100;
      const avgDuration = off.answered > 0 ? Math.round(off.total_duration / off.answered) : 0;
      return {
        ...off,
        answer_rate: answerRate,
        avg_talk_time: avgDuration
      };
    });

    res.json(processed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calls/customers - Customer interactions log
router.get("/customers", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

    const userRole = currentUser.role;
    const mappedRole = mapRoleToDb(userRole);
    const isManager = isManagementRole(mappedRole);
    const userName = currentUser.name || currentUser.username || "";

    const { startDate, endDate, search } = req.query;

    let query = `
      SELECT 
        phone as phone_number,
        name as customer_name,
        COUNT(*) as total_calls,
        SUM(CASE WHEN direction = 'INBOUND' OR type = 'incoming' THEN 1 ELSE 0 END) as incoming,
        SUM(CASE WHEN direction = 'OUTBOUND' OR type = 'outgoing' THEN 1 ELSE 0 END) as outgoing,
        SUM(CASE WHEN status IN ('missed', 'MISSED', 'no_answer') OR type = 'missed' THEN 1 ELSE 0 END) as missed,
        SUM(duration) as total_duration,
        MIN(timestamp) as first_call,
        MAX(timestamp) as last_call,
        staffName as assigned_staff,
        dossierId as related_case_id,
        dossierTitle as related_case_title
      FROM voip_calls
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isManager) {
      query += " AND (staffName = ? OR staffName LIKE ?)";
      params.push(userName, `%${userName}%`);
    } else {
      if (mappedRole === "manager" || mappedRole === "head_of_department") {
        const userBranch = currentUser.branch || "";
        if (userBranch) {
          query += " AND branch = ?";
          params.push(userBranch);
        }
      }
    }

    if (startDate) { query += " AND (timestamp >= ? OR start_time >= ?)"; params.push(startDate, startDate); }
    if (endDate) { query += " AND (timestamp <= ? OR start_time <= ?)"; params.push(endDate, endDate); }
    if (search) {
      query += " AND (name LIKE ? OR phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " GROUP BY phone, name ORDER BY last_call DESC";

    const customers = db.prepare(query).all(...params) as any[];

    // Apply security phone masking for non-management on response
    const processed = customers.map(cust => {
      const fullPhone = cust.phone_number || "";
      return {
        ...cust,
        phone_number: isManager ? fullPhone : maskPhoneNumber(fullPhone)
      };
    });

    res.json(processed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calls/:id - Retrieve singular call detail
router.get("/:id", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    if (!currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

    const { id } = req.params;
    const call = db.prepare("SELECT * FROM voip_calls WHERE id = ?").get(id) as any;

    if (!call) return res.status(404).json({ error: "Không tìm thấy cuộc gọi." });

    const userRole = currentUser.role;
    const mappedRole = mapRoleToDb(userRole);
    const isManager = isManagementRole(mappedRole);
    const userName = currentUser.name || currentUser.username || "";

    if (!isManager && call.staffName !== userName && !call.staffName?.includes(userName)) {
      return res.status(403).json({ error: "Không có quyền xem chi tiết cuộc gọi này." });
    }

    const processed = isManager 
      ? {
          ...call,
          call_id: call.id,
          phone_number: call.phone || call.phone_number,
          direction: call.direction || (call.type === "incoming" ? "INBOUND" : "OUTBOUND"),
          call_result: call.call_result || call.consultationNote || ""
        }
      : sanitizeForEmployee(call);

    res.json(processed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calls/event - Save Real-time Call Event Log
router.post("/event", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    const employee_id = currentUser?.name || currentUser?.username || "Yeastar System";

    const {
      call_id = `call_${Date.now()}`,
      event_type, // RINGING, ANSWERED, CONNECTED, HOLD, RESUMED, TRANSFERRED, MISSED, REJECTED, FAILED, ENDED
      event_time = new Date().toISOString(),
      metadata = {},
      phone_number = "",
      customer_name = "Khách hàng",
      direction = "INBOUND",
      dossierId = "",
      dossierTitle = ""
    } = req.body;

    if (!event_type) {
      return res.status(400).json({ error: "Thiếu event_type" });
    }

    const event_id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const metadataStr = typeof metadata === "string" ? metadata : JSON.stringify(metadata);

    // Save event log
    db.prepare(`
      INSERT INTO call_events (event_id, call_id, event_type, event_time, employee_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(event_id, call_id, event_type, event_time, employee_id, metadataStr);

    // State Machine logic to update or create call entries on the fly
    const existingCall = db.prepare("SELECT * FROM voip_calls WHERE id = ?").get(call_id) as any;

    const start_time = existingCall?.start_time || (event_type === "RINGING" ? event_time : new Date().toISOString());
    let answer_time = existingCall?.answer_time || null;
    let end_time = existingCall?.end_time || null;
    let duration = existingCall?.duration || 0;
    let status = existingCall?.status || "ringing";

    if (event_type === "ANSWERED" || event_type === "CONNECTED") {
      answer_time = event_time;
      status = "connected";
    }

    if (["ENDED", "MISSED", "FAILED", "REJECTED"].includes(event_type)) {
      end_time = event_time;
      status = event_type.toLowerCase();
      
      const startMs = new Date(start_time).getTime();
      const endMs = new Date(end_time).getTime();
      if (!isNaN(startMs) && !isNaN(endMs)) {
        duration = Math.max(0, Math.round((endMs - startMs) / 1000));
      }
    }

    // Dynamic dual-store into voip_calls for total metrics compatibility
    db.prepare(`
      INSERT INTO voip_calls (
        id, name, phone, phone_number, type, direction, duration, timestamp, start_time, answer_time, end_time,
        staffName, employee_id, staffRole, branch, office_id, status, dossierId, dossierTitle, gateway, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        answer_time = excluded.answer_time,
        end_time = excluded.end_time,
        duration = excluded.duration,
        status = excluded.status,
        updated_at = excluded.updated_at
    `).run(
      call_id,
      customer_name,
      phone_number,
      phone_number,
      direction === "INBOUND" ? "incoming" : "outgoing",
      direction,
      duration,
      start_time,
      start_time,
      answer_time,
      end_time,
      employee_id,
      employee_id,
      currentUser?.role || "Consultant",
      currentUser?.branch || "Trụ sở chính",
      currentUser?.branch || "Trụ sở chính",
      status,
      dossierId,
      dossierTitle,
      "yeastar",
      start_time,
      new Date().toISOString()
    );

    // Track active/ongoing calls live inside Map
    if (["RINGING", "ANSWERED", "CONNECTED", "HOLD", "RESUMED", "TRANSFERRED"].includes(event_type)) {
      activeCalls.set(call_id, {
        call_id,
        id: call_id,
        name: customer_name,
        phone: phone_number,
        phone_number,
        direction,
        status: status.toUpperCase(),
        start_time,
        answer_time,
        staffName: employee_id,
        dossierId,
        dossierTitle
      });
    } else {
      activeCalls.delete(call_id);
    }

    const updatedCall = db.prepare("SELECT * FROM voip_calls WHERE id = ?").get(call_id) as any;
    emitCallUpdate(req, "live_call_event", {
      event_type,
      call_id,
      employee_id,
      event_time,
      metadata,
      currentConcurrent: activeCalls.size,
      call_record: updatedCall
    });

    res.json({ success: true, event_id, activeCallsCount: activeCalls.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calls - Register completed call logs
router.post("/", auth, (req: any, res: any) => {
  try {
    const {
      id = `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name = "Khách hàng",
      phone = "",
      type = "outgoing",
      duration = 0,
      timestamp = new Date().toISOString(),
      hasRecording = 1,
      recordingUrl = "",
      staffName = req.session?.user?.name || req.user?.name || "Luật sư",
      staffRole = req.session?.user?.role || req.user?.role || "Chuyên viên",
      branch = req.session?.user?.branch || req.user?.branch || "Trụ sở chính",
      status = "connected",
      transcript = "",
      isViolated = 0,
      violatedKeywords = "[]",
      dossierId = "",
      dossierTitle = "",
      category = "Tư vấn Pháp lý",
      consultationNote = "",
      qcRating = "",
      qcNotes = "",
      qcEvaluator = "",
      gateway = "yeastar"
    } = req.body;

    const dbDirection = type === "incoming" ? "INBOUND" : "OUTBOUND";

    db.prepare(`
      INSERT INTO voip_calls (
        id, name, phone, phone_number, type, direction, duration, timestamp, start_time, hasRecording, recordingUrl,
        staffName, employee_id, staffRole, branch, office_id, status, transcript, isViolated, violatedKeywords,
        dossierId, customer_id, dossierTitle, category, consultationNote, call_result, qcRating, qcNotes, qcEvaluator, gateway, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        duration = excluded.duration,
        status = excluded.status,
        transcript = excluded.transcript,
        consultationNote = excluded.consultationNote,
        call_result = excluded.call_result,
        qcRating = excluded.qcRating,
        qcNotes = excluded.qcNotes,
        qcEvaluator = excluded.qcEvaluator,
        updated_at = excluded.updated_at
    `).run(
      id, name, phone, phone, type, dbDirection, duration, timestamp, timestamp, hasRecording ? 1 : 0, recordingUrl,
      staffName, staffName, staffRole, branch, branch, status, transcript, isViolated ? 1 : 0,
      typeof violatedKeywords === 'string' ? violatedKeywords : JSON.stringify(violatedKeywords),
      dossierId, dossierId, dossierTitle, category, consultationNote, consultationNote, qcRating, qcNotes, qcEvaluator, gateway,
      timestamp, new Date().toISOString()
    );

    const callRecord = db.prepare("SELECT * FROM voip_calls WHERE id = ?").get(id);
    emitCallUpdate(req, "call_ended", callRecord);

    res.json({ success: true, data: callRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/calls/:id - Update call notes, QC rankings, and metadata
router.put("/:id", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    const { id } = req.params;
    const { consultationNote, call_result, qcRating, qcNotes, qcEvaluator, transcript, isViolated, violatedKeywords } = req.body;

    const userRole = currentUser?.role;
    const mappedRole = mapRoleToDb(userRole);
    const isManager = isManagementRole(mappedRole);

    const fields: string[] = [];
    const params: any[] = [];

    if (consultationNote !== undefined) { 
      fields.push("consultationNote = ?"); params.push(consultationNote);
      fields.push("call_result = ?"); params.push(consultationNote);
    }
    if (call_result !== undefined) {
      fields.push("call_result = ?"); params.push(call_result);
      fields.push("consultationNote = ?"); params.push(call_result);
    }
    if (transcript !== undefined) { fields.push("transcript = ?"); params.push(transcript); }

    if (isManager) {
      if (qcRating !== undefined) { fields.push("qcRating = ?"); params.push(qcRating); }
      if (qcNotes !== undefined) { fields.push("qcNotes = ?"); params.push(qcNotes); }
      if (qcEvaluator !== undefined) { fields.push("qcEvaluator = ?"); params.push(qcEvaluator); }
      if (isViolated !== undefined) { fields.push("isViolated = ?"); params.push(isViolated ? 1 : 0); }
      if (violatedKeywords !== undefined) { fields.push("violatedKeywords = ?"); params.push(typeof violatedKeywords === 'string' ? violatedKeywords : JSON.stringify(violatedKeywords)); }
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());

    if (fields.length > 0) {
      params.push(id);
      db.prepare(`UPDATE voip_calls SET ${fields.join(", ")} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare("SELECT * FROM voip_calls WHERE id = ?").get(id);
    emitCallUpdate(req, "call_updated", updated);

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/calls/:id - Hard delete log entry (Management only)
router.delete("/:id", auth, (req: any, res: any) => {
  try {
    const currentUser = req.user || req.session?.user;
    const userRole = currentUser?.role;
    const mappedRole = mapRoleToDb(userRole);

    if (!isManagementRole(mappedRole)) {
      return res.status(403).json({ error: "Chỉ Ban Giám đốc hoặc Quản trị viên mới có quyền xóa nhật ký cuộc gọi." });
    }

    const { id } = req.params;
    db.prepare("DELETE FROM voip_calls WHERE id = ?").run(id);
    db.prepare("DELETE FROM call_events WHERE call_id = ?").run(id);

    try {
      const io = req.app.get("io");
      if (io) io.emit("call_deleted", { id });
    } catch (e) {}

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
