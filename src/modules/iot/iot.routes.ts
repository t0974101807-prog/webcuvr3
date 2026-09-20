import { Router, Request, Response, NextFunction } from "express";
import db from "../../db/database";
import { auth, requireRoles } from "../../middleware/auth";
import { executeMcpTool, mcpToolsRegistry } from "./mcp.server";

const router = Router();

// Middleware to authenticate physical IoT hardware via custom API Key
const validateDeviceApiKey = (req: Request, res: Response, next: NextFunction) => {
  const { device_id } = req.body;
  const apiKey = req.headers["x-api-key"] || req.query.api_key || req.body.api_key;

  if (!device_id) {
    return res.status(400).json({ success: false, message: "Thiếu device_id" });
  }

  try {
    const device = db.prepare("SELECT api_key FROM iot_devices WHERE id = ?").get(device_id) as { api_key: string } | undefined;
    if (!device) {
      return res.status(404).json({ success: false, message: "Thiết bị chưa được đăng ký trong hệ thống" });
    }

    if (!apiKey || apiKey !== device.api_key) {
      return res.status(401).json({ success: false, message: "Xác thực thiết bị thất bại: API Key không đúng hoặc bị từ chối" });
    }

    next();
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Ensure iot tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS iot_devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mac_address TEXT,
    ip_address TEXT,
    location TEXT,
    device_type TEXT NOT NULL, -- 'esp32_cam', 'weather_station', 'rfid_reader', 'led_display'
    status TEXT DEFAULT 'online', -- 'online', 'offline', 'warning'
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    api_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS iot_telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    air_quality INTEGER,
    pressure REAL,
    weather_condition TEXT,
    raw_payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS iot_attendance_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    employee_id TEXT,
    employee_name TEXT,
    method TEXT DEFAULT 'face_id', -- 'face_id', 'rfid', 'fingerprint'
    confidence REAL,
    snapshot_url TEXT,
    status TEXT DEFAULT 'success',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS iot_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    triggerDevice TEXT NOT NULL,
    triggerParam TEXT NOT NULL,
    operator TEXT NOT NULL,
    triggerValue TEXT NOT NULL,
    actionDevice TEXT NOT NULL,
    actionCommand TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS iot_alerts (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'critical', 'warning', 'info', 'resolved'
    status TEXT NOT NULL, -- 'active', 'muted', 'resolved'
    details TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default devices if empty
const countDevices = db.prepare("SELECT COUNT(*) as cnt FROM iot_devices").get() as { cnt: number };
if (countDevices.cnt === 0) {
  db.prepare(`
    INSERT INTO iot_devices (id, name, mac_address, ip_address, location, device_type, status, api_key)
    VALUES 
    ('DEV-ESP32-CAM-01', 'Cổng Chấm công FaceID ESP32-CAM', 'A4:CF:12:89:55:01', '192.168.1.120', 'Cổng chính Tầng 1', 'esp32_cam', 'online', 'iot_secret_key_01'),
    ('DEV-WEATHER-01', 'Trạm Thời tiết & Môi trường DHT22/BMP280', 'A4:CF:12:89:55:02', '192.168.1.121', 'Ban công Văn phòng', 'weather_station', 'online', 'iot_secret_key_02'),
    ('DEV-RFID-01', 'Máy Quét Thẻ Thông Minh RFID RC522', 'A4:CF:12:89:55:03', '192.168.1.122', 'Cổng Phụ Tầng 2', 'rfid_reader', 'online', 'iot_secret_key_03')
  `).run();

  db.prepare(`
    INSERT INTO iot_telemetry (device_id, temperature, humidity, air_quality, pressure, weather_condition)
    VALUES ('DEV-WEATHER-01', 28.5, 65.0, 42, 1012.3, 'Nắng nhẹ')
  `).run();

  db.prepare(`
    INSERT INTO iot_attendance_events (device_id, employee_id, employee_name, method, confidence, snapshot_url)
    VALUES 
    ('DEV-ESP32-CAM-01', 'QTV001', 'Quản trị viên', 'face_id', 99.1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'),
    ('DEV-ESP32-CAM-01', 'NV002', 'Luật sư Trần Văn Bảo', 'face_id', 98.4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'),
    ('DEV-ESP32-CAM-01', 'NV003', 'Chuyên viên Nguyễn Hải Nguyệt', 'face_id', 96.5, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80')
  `).run();
}

// Seed default rules if empty
const countRules = db.prepare("SELECT COUNT(*) as cnt FROM iot_rules").get() as { cnt: number };
if (countRules.cnt === 0) {
  db.prepare(`
    INSERT INTO iot_rules (id, name, triggerDevice, triggerParam, operator, triggerValue, actionDevice, actionCommand, active)
    VALUES 
    ('R-01', 'Tự động tắt điều hòa sau 18h00 khi vắng người', 'DEV-ESP32-CAM-01', 'occupancy', '=', '0', 'DEV-AC-LOBBY', 'POWER_OFF', 1),
    ('R-02', 'Bật quạt thông gió nếu nhiệt độ phòng máy chủ > 35°C', 'DEV-SERVER-TEMP', 'temperature', '>', '35', 'DEV-SERVER-FAN', 'FAN_ON_100%', 1),
    ('R-03', 'Cảnh báo mở cửa phòng Server ngoài giờ hành chính', 'DEV-RFID-01', 'access', 'changes', 'unauthorized', 'SIREN_ALERT', 'PLAY_ALARM', 0)
  `).run();
}

// Seed default alerts if empty
const countAlerts = db.prepare("SELECT COUNT(*) as cnt FROM iot_alerts").get() as { cnt: number };
if (countAlerts.cnt === 0) {
  db.prepare(`
    INSERT INTO iot_alerts (id, time, title, location, severity, status, details)
    VALUES 
    ('AL-01', '10:28 AM', 'Door Forced Open (Cửa sau tòa nhà)', 'Cổng Phụ Tầng 1', 'critical', 'active', 'Phát hiện lực tác động mạnh liên tục mở cửa từ bên ngoài.'),
    ('AL-02', '10:27 AM', 'Nhiệt độ phòng Server tăng cao (38.5°C)', 'Phòng Server', 'critical', 'active', 'Nhiệt độ phòng máy chủ vượt ngưỡng khuyến nghị 24°C.'),
    ('AL-03', '10:24 AM', 'Camera CAM-02 Mất kết nối', 'Hành lang Tầng 2', 'warning', 'active', 'Không nhận tín hiệu hình ảnh RTSP trong 3 phút qua.'),
    ('AL-04', '10:20 AM', 'Khói nhẹ phát hiện ở khu bếp', 'Khu vực Pantry', 'warning', 'active', 'Cảm biến quang học phát hiện lượng khói mật độ 12ppm.'),
    ('AL-05', '10:18 AM', 'Pin thiết bị RFID-01 yếu (15%)', 'Cổng Phụ Tầng 2', 'warning', 'active', 'Điện áp pin dự phòng hạ xuống còn 2.8V.')
  `).run();
}

// Evaluate rules engine on the backend
const evaluateRules = (deviceId: string, triggerParam: string, value: any) => {
  try {
    const rules = db.prepare("SELECT * FROM iot_rules WHERE triggerDevice = ? AND triggerParam = ? AND active = 1").all() as any[];
    for (const rule of rules) {
      let triggered = false;
      const valNum = parseFloat(value);
      const trigNum = parseFloat(rule.triggerValue);

      if (rule.operator === "=") {
        triggered = value.toString() === rule.triggerValue.toString();
      } else if (rule.operator === ">" && !isNaN(valNum) && !isNaN(trigNum)) {
        triggered = valNum > trigNum;
      } else if (rule.operator === "<" && !isNaN(valNum) && !isNaN(trigNum)) {
        triggered = valNum < trigNum;
      } else if (rule.operator === "changes") {
        triggered = true;
      }

      if (triggered) {
        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        const alertId = `EXEC-${rule.id}-${Date.now().toString().slice(-4)}`;
        const details = `Thiết bị ${rule.triggerDevice} kích hoạt hành động [${rule.actionCommand}] trên thiết bị đích ${rule.actionDevice}.`;
        
        db.prepare(`
          INSERT INTO iot_alerts (id, time, title, location, severity, status, details)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          alertId,
          timeStr,
          `[AUTOMATION ENFORCED] ${rule.name}`,
          rule.actionDevice,
          "resolved",
          "resolved",
          details
        );
        console.log(`[AUTOMATION] Triggered rule ${rule.id}: ${rule.name}`);
      }
    }
  } catch (err) {
    console.error("Error evaluating rules:", err);
  }
};

// 1. Get all registered IoT Devices
router.get("/devices", auth, (req: Request, res: Response) => {
  try {
    const devices = db.prepare("SELECT * FROM iot_devices ORDER BY last_seen DESC").all();
    res.json({ success: true, devices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Register or update a device
router.post("/devices", requireRoles("admin", "director", "controller"), (req: Request, res: Response) => {
  try {
    const { id, name, mac_address, ip_address, location, device_type, api_key } = req.body;
    if (!id || !name) {
      return res.status(400).json({ success: false, message: "Thiếu id hoặc tên thiết bị" });
    }

    db.prepare(`
      INSERT INTO iot_devices (id, name, mac_address, ip_address, location, device_type, api_key, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        mac_address=excluded.mac_address,
        ip_address=excluded.ip_address,
        location=excluded.location,
        device_type=excluded.device_type,
        api_key=excluded.api_key,
        status='online',
        last_seen=CURRENT_TIMESTAMP
    `).run(id, name, mac_address || '', ip_address || '', location || 'Chưa định vị', device_type || 'arduino_generic', api_key || 'key_default');

    res.json({ success: true, message: "Đăng ký thiết bị IoT thành công", id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a device
router.delete("/devices/:id", requireRoles("admin", "director", "controller"), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM iot_devices WHERE id = ?").run(id);
    res.json({ success: true, message: "Đã xóa thiết bị thành công" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Receive Telemetry Payload from Arduino / ESP32 (Weather / Sensors)
router.post("/telemetry", validateDeviceApiKey, (req: Request, res: Response) => {
  try {
    const { device_id, temperature, humidity, air_quality, pressure, weather_condition } = req.body;

    db.prepare(`
      INSERT INTO iot_telemetry (device_id, temperature, humidity, air_quality, pressure, weather_condition, raw_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      device_id,
      temperature || 27.0,
      humidity || 60.0,
      air_quality || 35,
      pressure || 1013.25,
      weather_condition || "Nắng đẹp",
      JSON.stringify(req.body)
    );

    // Update last seen
    db.prepare("UPDATE iot_devices SET last_seen = CURRENT_TIMESTAMP, status = 'online' WHERE id = ?").run(device_id);

    // If simulated temperature exceeds 35, dynamically trigger high temperature alarm in database!
    if (temperature && parseFloat(temperature) > 35) {
      const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      const countHighAlerts = db.prepare("SELECT COUNT(*) as cnt FROM iot_alerts WHERE id = 'AL-SERVER-TEMP-HIGH' AND status = 'active'").get() as { cnt: number };
      if (countHighAlerts.cnt === 0) {
        db.prepare(`
          INSERT INTO iot_alerts (id, time, title, location, severity, status, details)
          VALUES ('AL-SERVER-TEMP-HIGH', ?, 'Cảnh báo quá nhiệt mô phỏng', 'Trạm Weather-01', 'critical', 'active', ?)
        `).run(
          timeStr,
          `Telemetry nhận tín hiệu nhiệt độ vượt ngưỡng báo động (${temperature}°C).`
        );
      }
    }

    // Trigger automation rules evaluation
    if (temperature !== undefined) {
      evaluateRules(device_id, "temperature", temperature);
    }
    if (humidity !== undefined) {
      evaluateRules(device_id, "humidity", humidity);
    }

    res.json({ success: true, message: "Đã nhận dữ liệu telemetry từ Arduino thành công" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Latest Weather & Telemetry Data
router.get("/weather", auth, (req: Request, res: Response) => {
  try {
    const latest = db.prepare("SELECT * FROM iot_telemetry ORDER BY id DESC LIMIT 1").get();
    res.json({ success: true, weather: latest });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Receive Attendance Event from ESP32-CAM / FaceID / RFID Arduino
router.post("/attendance", validateDeviceApiKey, (req: Request, res: Response) => {
  try {
    const { device_id, employee_id, employee_name, method, confidence, snapshot_url } = req.body;

    if (!employee_name) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin nhận diện" });
    }

    db.prepare(`
      INSERT INTO iot_attendance_events (device_id, employee_id, employee_name, method, confidence, snapshot_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      device_id,
      employee_id || "NV_GUEST",
      employee_name,
      method || "face_id",
      confidence || 95.0,
      snapshot_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    );

    // Auto update device status
    db.prepare("UPDATE iot_devices SET last_seen = CURRENT_TIMESTAMP, status = 'online' WHERE id = ?").run(device_id);

    // Trigger automation rules evaluation for occupancy and access
    evaluateRules(device_id, "access", employee_id === "NV_GUEST" ? "unauthorized" : "authorized");
    evaluateRules(device_id, "occupancy", "1");

    res.json({
      success: true,
      message: `Đã ghi nhận chấm công thành công cho [${employee_name}] từ Arduino ${device_id}`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Get Attendance Events log
router.get("/attendance-events", auth, (req: Request, res: Response) => {
  try {
    const events = db.prepare("SELECT * FROM iot_attendance_events ORDER BY id DESC LIMIT 50").all();
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Get Automation Rules
router.get("/rules", auth, (req: Request, res: Response) => {
  try {
    const rules = db.prepare("SELECT * FROM iot_rules").all();
    const mapped = rules.map((r: any) => ({ ...r, active: !!r.active }));
    res.json({ success: true, rules: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Create or Update Rule
router.post("/rules", requireRoles("admin", "director", "controller"), (req: Request, res: Response) => {
  try {
    const { id, name, triggerDevice, triggerParam, operator, triggerValue, actionDevice, actionCommand, active } = req.body;
    if (!id || !name) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin kịch bản" });
    }
    db.prepare(`
      INSERT INTO iot_rules (id, name, triggerDevice, triggerParam, operator, triggerValue, actionDevice, actionCommand, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        triggerDevice=excluded.triggerDevice,
        triggerParam=excluded.triggerParam,
        operator=excluded.operator,
        triggerValue=excluded.triggerValue,
        actionDevice=excluded.actionDevice,
        actionCommand=excluded.actionCommand,
        active=excluded.active
    `).run(id, name, triggerDevice, triggerParam, operator, triggerValue, actionDevice, actionCommand, active === undefined ? 1 : (active ? 1 : 0));
    res.json({ success: true, message: "Đã lưu kịch bản tự động thành công", id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Toggle Rule Active
router.post("/rules/:id/toggle", requireRoles("admin", "director", "controller"), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = db.prepare("SELECT active FROM iot_rules WHERE id = ?").get(id) as { active: number } | undefined;
    if (!rule) {
      return res.status(404).json({ success: false, message: "Không tìm thấy kịch bản" });
    }
    const newActive = rule.active ? 0 : 1;
    db.prepare("UPDATE iot_rules SET active = ? WHERE id = ?").run(newActive, id);
    res.json({ success: true, message: "Đã chuyển trạng thái kịch bản", active: !!newActive });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Delete Rule
router.delete("/rules/:id", requireRoles("admin", "director", "controller"), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM iot_rules WHERE id = ?").run(id);
    res.json({ success: true, message: "Đã xóa kịch bản thành công" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Get System Alerts
router.get("/alerts", auth, (req: Request, res: Response) => {
  try {
    const alerts = db.prepare("SELECT * FROM iot_alerts ORDER BY created_at DESC").all();
    res.json({ success: true, alerts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Resolve Alert
router.post("/alerts/:id/resolve", requireRoles("admin", "director", "controller"), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE iot_alerts SET status = 'resolved', severity = 'resolved' WHERE id = ?").run(id);
    res.json({ success: true, message: "Đã xử lý cảnh báo thành công" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Mute Alert
router.post("/alerts/:id/mute", requireRoles("admin", "director", "controller"), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE iot_alerts SET status = 'muted' WHERE id = ?").run(id);
    res.json({ success: true, message: "Đã tắt tiếng cảnh báo thành công" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Execute Device Command / Action (Reset, OTA Update, etc.)
router.post("/devices/:id/action", requireRoles("admin", "director", "controller"), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, message: "Thiếu loại hành động" });
    }

    // Update status of that device to online
    db.prepare("UPDATE iot_devices SET status = 'online', last_seen = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    // Create a system alert log
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const alertId = `SYS-${action.replace(/\s+/g, "-")}-${Date.now().toString().slice(-4)}`;
    const details = `Thực thi thành công lệnh [${action}] trên thiết bị ${id}.`;
    db.prepare(`
      INSERT INTO iot_alerts (id, time, title, location, severity, status, details)
      VALUES (?, ?, ?, ?, 'info', 'resolved', ?)
    `).run(
      alertId,
      timeStr,
      `[COMMAND SENT] ${action} - ${id}`,
      id,
      details
    );

    res.json({ success: true, message: `Thực thi lệnh ${action} thành công trên thiết bị ${id}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= MCP SERVER API ENDPOINTS =================

// 15. List all available MCP Tools
router.get("/mcp/tools", auth, (req: Request, res: Response) => {
  try {
    const tools = Object.values(mcpToolsRegistry).map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
      requiredPermission: t.requiredPermission,
      dangerous: !!t.dangerous,
      parameters: t.parameters
    }));
    res.json({ success: true, tools });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. Execute an MCP Tool
router.post("/mcp/execute", auth, async (req: Request, res: Response) => {
  try {
    const { toolName, args } = req.body;
    if (!toolName) {
      return res.status(400).json({ success: false, message: "Thiếu tên công cụ MCP (toolName)" });
    }

    const sessionUser = (req as any).session?.user || { email: "anonymous@anhduonglaw.vn", role: "specialist" };
    const user = {
      email: sessionUser.email,
      role: sessionUser.role || "specialist"
    };

    const result = await executeMcpTool(toolName, args || {}, user);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 17. View recent MCP Audit Logs
router.get("/mcp/audit-logs", auth, (req: Request, res: Response) => {
  try {
    const logs = db.prepare("SELECT * FROM mcp_audit_logs ORDER BY id DESC LIMIT 100").all();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 18. View device-specific logs
router.get("/mcp/device-logs/:device_id", auth, (req: Request, res: Response) => {
  try {
    const { device_id } = req.params;
    const logs = db.prepare("SELECT * FROM device_logs WHERE device_id = ? ORDER BY id DESC LIMIT 100").all(device_id);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 19. Get active MCP Permissions mapping
router.get("/mcp/permissions", auth, (req: Request, res: Response) => {
  try {
    const perms = db.prepare("SELECT * FROM mcp_permissions").all();
    res.json({ success: true, permissions: perms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
