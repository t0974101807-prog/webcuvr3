import db from "../../db/database";
import { mapRoleToDb } from "../../utils/role";

// Initialize additional tables for MCP ESP Device Management if they don't exist
try {
  // Ensure the base iot_devices table exists first
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
  `);

  // Alter iot_devices table to include ESP32-specific fields if they are missing
  const columns = db.prepare("PRAGMA table_info(iot_devices)").all() as any[];
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes("model")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN model TEXT DEFAULT 'ESP32'");
  }
  if (!columnNames.includes("firmware")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN firmware TEXT DEFAULT '1.0.0'");
  }
  if (!columnNames.includes("protocol")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN protocol TEXT DEFAULT 'MQTT'");
  }
  if (!columnNames.includes("wifi_status")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN wifi_status TEXT DEFAULT 'connected'");
  }
  if (!columnNames.includes("mqtt_status")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN mqtt_status TEXT DEFAULT 'connected'");
  }
  if (!columnNames.includes("rssi")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN rssi INTEGER DEFAULT -65");
  }
  if (!columnNames.includes("cpu_usage")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN cpu_usage REAL DEFAULT 15.2");
  }
  if (!columnNames.includes("memory_usage")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN memory_usage REAL DEFAULT 42.1");
  }
  if (!columnNames.includes("uptime")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN uptime INTEGER DEFAULT 3600");
  }
  if (!columnNames.includes("gpio_schema")) {
    db.exec("ALTER TABLE iot_devices ADD COLUMN gpio_schema TEXT");
  }

  // Create child tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS device_gpio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      pin INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'relay', 'temperature', 'humidity', 'motion', 'light', 'pwm', etc.
      name TEXT NOT NULL,
      mode TEXT DEFAULT 'OUTPUT', -- 'INPUT', 'OUTPUT', etc.
      readable INTEGER DEFAULT 1,
      writable INTEGER DEFAULT 1,
      unit TEXT,
      current_value TEXT,
      UNIQUE(device_id, pin)
    );

    CREATE TABLE IF NOT EXISTS device_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      log_level TEXT DEFAULT 'INFO',
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS device_firmware (
      version TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      description TEXT,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mcp_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      permission TEXT NOT NULL,
      UNIQUE(role, permission)
    );

    CREATE TABLE IF NOT EXISTS mcp_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT,
      ai_agent TEXT,
      mcp_tool TEXT,
      device_id TEXT,
      command TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      result TEXT,
      success INTEGER DEFAULT 1
    );
  `);

  // Seed default GPIOs for default devices if empty
  const gpioCount = db.prepare("SELECT COUNT(*) as cnt FROM device_gpio").get() as { cnt: number };
  if (gpioCount.cnt === 0) {
    const insertGpio = db.prepare(`
      INSERT OR IGNORE INTO device_gpio (device_id, pin, type, name, mode, readable, writable, unit, current_value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // For CAM Device
    insertGpio.run('DEV-ESP32-CAM-01', 4, 'light', 'Đèn Flash ESP32-CAM', 'OUTPUT', 1, 1, '', 'OFF');
    insertGpio.run('DEV-ESP32-CAM-01', 12, 'motion', 'Cảm biến hồng ngoại PIR', 'INPUT', 1, 0, '', '0');

    // For Weather Station
    insertGpio.run('DEV-WEATHER-01', 25, 'temperature', 'Cảm biến nhiệt độ DHT22', 'INPUT', 1, 0, '°C', '28.5');
    insertGpio.run('DEV-WEATHER-01', 26, 'humidity', 'Cảm biến độ ẩm DHT22', 'INPUT', 1, 0, '%', '65.0');
    insertGpio.run('DEV-WEATHER-01', 34, 'light', 'Cảm biến ánh sáng LDR', 'INPUT', 1, 0, 'lux', '350');

    // For RFID RC522
    insertGpio.run('DEV-RFID-01', 5, 'relay', 'Chốt cửa điện từ Solenoid', 'OUTPUT', 1, 1, '', 'LOCKED');
    insertGpio.run('DEV-RFID-01', 13, 'relay', 'Còi báo động Buzzer', 'OUTPUT', 1, 1, '', 'OFF');
  }

  // Seed default firmwares if empty
  const fwCount = db.prepare("SELECT COUNT(*) as cnt FROM device_firmware").get() as { cnt: number };
  if (fwCount.cnt === 0) {
    db.prepare(`
      INSERT OR IGNORE INTO device_firmware (version, model, description, url)
      VALUES 
      ('1.0.0', 'ESP32', 'Bản phát hành đầu tiên cho ESP32', 'https://firmware.anhduonglaw.vn/v1.0.0.bin'),
      ('1.0.5', 'ESP32', 'Cải tiến độ ổn định kết nối WiFi và MQTT', 'https://firmware.anhduonglaw.vn/v1.0.5.bin'),
      ('1.1.0', 'ESP32', 'Bổ sung khả năng tự chẩn đoán và mã hóa TLS', 'https://firmware.anhduonglaw.vn/v1.1.0.bin')
    `).run();
  }

  // Seed default MCP Permissions
  const permCount = db.prepare("SELECT COUNT(*) as cnt FROM mcp_permissions").get() as { cnt: number };
  if (permCount.cnt === 0) {
    const insertPerm = db.prepare("INSERT OR IGNORE INTO mcp_permissions (role, permission) VALUES (?, ?)");
    
    // admin / director / deputyDirector -> All permissions
    ['admin', 'director', 'deputyDirector'].forEach(r => {
      ['VIEW', 'CONTROL', 'CONFIG', 'ADMIN'].forEach(p => {
        insertPerm.run(r, p);
      });
    });

    // manager / head_of_department -> VIEW, CONTROL, CONFIG
    ['manager', 'head_of_department'].forEach(r => {
      ['VIEW', 'CONTROL', 'CONFIG'].forEach(p => {
        insertPerm.run(r, p);
      });
    });

    // lawyer / accountant -> VIEW, CONTROL
    ['lawyer', 'accountant', 'controller', 'prosecutor', 'legal_associate'].forEach(r => {
      ['VIEW', 'CONTROL'].forEach(p => {
        insertPerm.run(r, p);
      });
    });

    // specialist (chuyên viên) / editor / guest -> VIEW only
    ['specialist', 'editor', 'staff', ''].forEach(r => {
      insertPerm.run(r, 'VIEW');
    });
  }

  // Update original iot_devices schema descriptions if they exist to reflect ESP specifications
  db.prepare(`
    UPDATE iot_devices SET 
      model = 'ESP32-CAM', 
      firmware = '1.0.0', 
      gpio_schema = '{"gpios": [{"pin": 4, "type": "light", "name": "Đèn Flash"}, {"pin": 12, "type": "motion", "name": "Cảm biến PIR"}]}'
    WHERE id = 'DEV-ESP32-CAM-01'
  `).run();

  db.prepare(`
    UPDATE iot_devices SET 
      model = 'ESP32', 
      firmware = '1.0.5', 
      gpio_schema = '{"gpios": [{"pin": 25, "type": "temperature", "name": "Nhiệt độ"}, {"pin": 26, "type": "humidity", "name": "Độ ẩm"}, {"pin": 34, "type": "light", "name": "Ánh sáng"}]}'
    WHERE id = 'DEV-WEATHER-01'
  `).run();

  db.prepare(`
    UPDATE iot_devices SET 
      model = 'ESP8266', 
      firmware = '1.0.0', 
      gpio_schema = '{"gpios": [{"pin": 5, "type": "relay", "name": "Chốt cửa"}, {"pin": 13, "type": "relay", "name": "Còi Buzzer"}]}'
    WHERE id = 'DEV-RFID-01'
  `).run();

} catch (err) {
  console.error("Error setting up MCP Tables:", err);
}

// Define Permission check helper
export function checkMcpPermission(role: string | undefined, requiredPerm: 'VIEW' | 'CONTROL' | 'CONFIG' | 'ADMIN'): boolean {
  try {
    const dbRole = mapRoleToDb(role);
    const row = db.prepare("SELECT COUNT(*) as cnt FROM mcp_permissions WHERE role = ? AND permission = ?")
      .get(dbRole, requiredPerm) as { cnt: number };
    return row.cnt > 0;
  } catch (err) {
    console.error("Error checking MCP Permission:", err);
    return false;
  }
}

// Log MCP activity
export function logMcpAudit(userEmail: string, aiAgent: string, toolName: string, deviceId: string | null, command: string, result: string, success: boolean) {
  try {
    db.prepare(`
      INSERT INTO mcp_audit_logs (user_email, ai_agent, mcp_tool, device_id, command, result, success)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userEmail || "anonymous", aiAgent || "Gemini-IoT-Agent", toolName, deviceId, command, result, success ? 1 : 0);
  } catch (err) {
    console.warn("Could not log MCP Audit:", err);
  }
}

// Write Device Logs
export function logDeviceActivity(deviceId: string, logLevel: 'INFO' | 'WARN' | 'ERROR', message: string) {
  try {
    db.prepare(`
      INSERT INTO device_logs (device_id, log_level, message)
      VALUES (?, ?, ?)
    `).run(deviceId, logLevel, message);
  } catch (err) {
    console.warn("Could not log device activity:", err);
  }
}

export interface McpTool {
  name: string;
  description: string;
  category: 'DEVICE' | 'CONFIGURATION' | 'RELAY' | 'SENSOR' | 'MQTT' | 'DIAGNOSTICS' | 'FIRMWARE' | 'AUTOMATION';
  requiredPermission: 'VIEW' | 'CONTROL' | 'CONFIG' | 'ADMIN';
  dangerous?: boolean;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, context: { userEmail: string; userRole: string }) => Promise<any>;
}

export const mcpToolsRegistry: Record<string, McpTool> = {
  // ================= DEVICE TOOLS =================
  discover_devices: {
    name: "discover_devices",
    description: "Quét mạng nội bộ để phát hiện các thiết bị ESP32/ESP8266 chưa được đăng ký trong hệ thống.",
    category: "DEVICE",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        scan_time_seconds: { type: "integer", description: "Thời gian quét (giây)", default: 5 }
      }
    },
    handler: async (args, context) => {
      // Simulate discovering devices
      const discovered = [
        {
          id: "DEV-ESP32-LIVING-01",
          name: "ESP32 Cảm Biến Phòng Khách",
          mac_address: "A4:CF:12:89:66:99",
          ip_address: "192.168.1.130",
          model: "ESP32",
          firmware: "1.0.5",
          location: "Phòng khách Tầng 1"
        },
        {
          id: "DEV-ESP8266-KITCHEN-01",
          name: "ESP8266 Điều Khiển Thiết Bị Bếp",
          mac_address: "A4:CF:12:89:66:A1",
          ip_address: "192.168.1.131",
          model: "ESP8266",
          firmware: "1.0.0",
          location: "Khu vực Pantry"
        }
      ];

      // Filter out already registered devices
      const existing = db.prepare("SELECT id FROM iot_devices").all() as { id: string }[];
      const existingIds = new Set(existing.map(d => d.id));
      const newDevices = discovered.filter(d => !existingIds.has(d.id));

      return {
        success: true,
        scanned: true,
        count: newDevices.length,
        devices: newDevices,
        message: newDevices.length > 0 
          ? `Đã tìm thấy ${newDevices.length} thiết bị ESP mới trong mạng.` 
          : "Không tìm thấy thiết bị ESP mới nào chưa đăng ký."
      };
    }
  },

  get_device: {
    name: "get_device",
    description: "Lấy thông tin chi tiết và Schema hoàn chỉnh của một thiết bị ESP chỉ định (bao gồm GPIO và Trạng thái).",
    category: "DEVICE",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID duy nhất của thiết bị ESP" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT * FROM iot_devices WHERE id = ?").get(args.device_id) as any;
      if (!device) {
        return { success: false, message: `Không tìm thấy thiết bị với ID ${args.device_id}` };
      }

      // Query pin configuration from device_gpio table
      const gpios = db.prepare("SELECT pin, type, name, mode, readable, writable, unit, current_value FROM device_gpio WHERE device_id = ?")
        .all(args.device_id) as any[];

      return {
        success: true,
        device: {
          device_id: device.id,
          name: device.name,
          model: device.model,
          firmware: device.firmware,
          location: device.location,
          status: device.status,
          protocol: device.protocol,
          mac_address: device.mac_address,
          ip_address: device.ip_address,
          wifi_status: device.wifi_status,
          mqtt_status: device.mqtt_status,
          rssi: device.rssi,
          cpu_usage: device.cpu_usage,
          memory_usage: device.memory_usage,
          uptime: device.uptime,
          last_seen: device.last_seen,
          gpio: gpios.map(g => ({
            pin: g.pin,
            type: g.type,
            name: g.name,
            mode: g.mode,
            readable: g.readable === 1,
            writable: g.writable === 1,
            unit: g.unit || undefined,
            current_value: g.current_value
          }))
        }
      };
    }
  },

  register_device: {
    name: "register_device",
    description: "Đăng ký một thiết bị ESP mới vào hệ thống quản trị.",
    category: "DEVICE",
    requiredPermission: "ADMIN",
    dangerous: true,
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID của thiết bị" },
        name: { type: "string", description: "Tên hiển thị thiết bị" },
        model: { type: "string", description: "Dòng chip ESP (ESP32 hoặc ESP8266)", default: "ESP32" },
        mac_address: { type: "string", description: "Địa chỉ MAC" },
        ip_address: { type: "string", description: "Địa chỉ IP tĩnh/động" },
        location: { type: "string", description: "Vị trí lắp đặt" },
        device_type: { type: "string", description: "Loại thiết bị (ví dụ: relay_board, sensor_hub, generic)", default: "generic" },
        api_key: { type: "string", description: "Khóa bảo mật API Key của thiết bị" },
        confirmed: { type: "boolean", description: "Xác nhận thực hiện hành động nguy hiểm", default: false }
      },
      required: ["device_id", "name"]
    },
    handler: async (args, context) => {
      if (!args.confirmed) {
        return {
          success: false,
          requireConfirmation: true,
          message: `Thao tác đăng ký thiết bị mới '${args.name}' (${args.device_id}) yêu cầu xác nhận.`
        };
      }

      db.prepare(`
        INSERT INTO iot_devices (id, name, model, mac_address, ip_address, location, device_type, api_key, status, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'online', CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          model=excluded.model,
          mac_address=excluded.mac_address,
          ip_address=excluded.ip_address,
          location=excluded.location,
          device_type=excluded.device_type,
          api_key=excluded.api_key,
          status='online',
          last_seen=CURRENT_TIMESTAMP
      `).run(
        args.device_id,
        args.name,
        args.model || 'ESP32',
        args.mac_address || '',
        args.ip_address || '',
        args.location || 'Chưa định vị',
        args.device_type || 'generic',
        args.api_key || 'mcp_secret_' + Math.floor(Math.random() * 1000)
      );

      logDeviceActivity(args.device_id, 'INFO', `Đăng ký thiết bị thành công qua MCP bởi ${context.userEmail}`);

      return {
        success: true,
        device_id: args.device_id,
        message: `Đăng ký thiết bị IoT '${args.name}' thành công.`
      };
    }
  },

  update_device: {
    name: "update_device",
    description: "Cập nhật thông tin cơ bản của thiết bị ESP (tên, vị trí, loại).",
    category: "DEVICE",
    requiredPermission: "CONFIG",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị cần cập nhật" },
        name: { type: "string", description: "Tên hiển thị mới" },
        location: { type: "string", description: "Vị trí lắp đặt mới" },
        device_type: { type: "string", description: "Loại thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT * FROM iot_devices WHERE id = ?").get(args.device_id) as any;
      if (!device) {
        return { success: false, message: `Không tìm thấy thiết bị với ID ${args.device_id}` };
      }

      const nextName = args.name !== undefined ? args.name : device.name;
      const nextLocation = args.location !== undefined ? args.location : device.location;
      const nextType = args.device_type !== undefined ? args.device_type : device.device_type;

      db.prepare("UPDATE iot_devices SET name = ?, location = ?, device_type = ? WHERE id = ?")
        .run(nextName, nextLocation, nextType, args.device_id);

      logDeviceActivity(args.device_id, 'INFO', `Cập nhật cấu hình cơ bản thiết bị qua MCP bởi ${context.userEmail}`);

      return {
        success: true,
        message: `Đã cập nhật thiết bị ${args.device_id} thành công.`
      };
    }
  },

  remove_device: {
    name: "remove_device",
    description: "Xóa hoàn toàn thiết bị khỏi hệ thống cơ sở dữ liệu quản lý.",
    category: "DEVICE",
    requiredPermission: "ADMIN",
    dangerous: true,
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị cần xóa" },
        confirmed: { type: "boolean", description: "Xác nhận xóa", default: false }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      if (!args.confirmed) {
        return {
          success: false,
          requireConfirmation: true,
          message: `Hành động xóa thiết bị ${args.device_id} là không thể khôi phục và yêu cầu người dùng xác nhận.`
        };
      }

      db.prepare("DELETE FROM iot_devices WHERE id = ?").run(args.device_id);
      db.prepare("DELETE FROM device_gpio WHERE device_id = ?").run(args.device_id);

      return {
        success: true,
        message: `Đã xóa hoàn toàn thiết bị ${args.device_id} khỏi cơ sở dữ liệu.`
      };
    }
  },

  get_device_status: {
    name: "get_device_status",
    description: "Lấy trạng thái vận hành trực tuyến, thời gian hoạt động, chất lượng sóng WiFi (RSSI) và hiệu suất tài nguyên (CPU, Memory) của ESP.",
    category: "DEVICE",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT status, last_seen, wifi_status, mqtt_status, rssi, cpu_usage, memory_usage, uptime FROM iot_devices WHERE id = ?")
        .get(args.device_id) as any;
      if (!device) {
        return { success: false, message: `Không tìm thấy thiết bị ${args.device_id}` };
      }

      return {
        success: true,
        device_id: args.device_id,
        status: device.status,
        last_seen: device.last_seen,
        metrics: {
          wifi_status: device.wifi_status,
          mqtt_status: device.mqtt_status,
          rssi: device.rssi,
          signal_strength: device.rssi > -50 ? "Xuất sắc" : device.rssi > -70 ? "Tốt" : device.rssi > -85 ? "Khá" : "Yếu",
          cpu_usage: `${device.cpu_usage}%`,
          memory_free: `${100 - device.memory_usage}%`,
          uptime_formatted: `${Math.floor(device.uptime / 3600)} giờ ${Math.floor((device.uptime % 3600) / 60)} phút`
        }
      };
    }
  },

  ping_device: {
    name: "ping_device",
    description: "Gửi lệnh kiểm tra kết nối mạng (Ping) tới ESP để xác nhận phản hồi tức thì.",
    category: "DEVICE",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT ip_address, status FROM iot_devices WHERE id = ?").get(args.device_id) as any;
      if (!device) {
        return { success: false, message: `Không tìm thấy thiết bị ${args.device_id}` };
      }

      const isOnline = device.status === 'online';
      const latency = isOnline ? Math.floor(15 + Math.random() * 45) : null;

      // Update last seen if online
      if (isOnline) {
        db.prepare("UPDATE iot_devices SET last_seen = CURRENT_TIMESTAMP WHERE id = ?").run(args.device_id);
      }

      return {
        success: isOnline,
        device_id: args.device_id,
        ip_address: device.ip_address,
        ping_status: isOnline ? "SUCCESS" : "TIMEOUT",
        latency_ms: latency,
        message: isOnline 
          ? `Thiết bị trực tuyến tại IP ${device.ip_address}. Phản hồi trong ${latency}ms.` 
          : `Không có phản hồi từ thiết bị tại IP ${device.ip_address || "không xác định"}.`
      };
    }
  },

  // ================= CONFIGURATION TOOLS =================
  get_device_config: {
    name: "get_device_config",
    description: "Lấy toàn bộ cấu hình kết nối của thiết bị ESP (MQTT broker, WiFi SSID, IP, khoảng thời gian gửi tin).",
    category: "CONFIGURATION",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT id, name, mac_address, ip_address, protocol, api_key FROM iot_devices WHERE id = ?").get(args.device_id) as any;
      if (!device) return { success: false, message: `Không tìm thấy thiết bị ${args.device_id}` };

      return {
        success: true,
        device_id: args.device_id,
        config: {
          wifi_ssid: "AnhDuongLaw_Staff_5G",
          mqtt_broker: "mqtt.anhduonglaw.vn",
          mqtt_port: 1883,
          telemetry_interval_ms: 10000,
          dns_server: "8.8.8.8",
          mac_address: device.mac_address,
          ip_address: device.ip_address,
          protocol: device.protocol,
          auth_api_key_hidden: "••••••••" + (device.api_key || "").slice(-4)
        }
      };
    }
  },

  configure_device: {
    name: "configure_device",
    description: "Cấu hình tham số WiFi hoặc MQTT Broker cho thiết bị ESP.",
    category: "CONFIGURATION",
    requiredPermission: "CONFIG",
    dangerous: true,
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        wifi_ssid: { type: "string", description: "Tên mạng WiFi mới" },
        wifi_password: { type: "string", description: "Mật khẩu WiFi mới" },
        mqtt_broker: { type: "string", description: "Tên miền/IP của MQTT Broker" },
        telemetry_interval_ms: { type: "integer", description: "Khoảng cách gửi dữ liệu telemetry (ms)" },
        confirmed: { type: "boolean", description: "Xác nhận cấu hình", default: false }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      if ((args.wifi_ssid || args.wifi_password || args.mqtt_broker) && !args.confirmed) {
        return {
          success: false,
          requireConfirmation: true,
          message: "Thay đổi cấu hình WiFi hoặc MQTT Broker có thể làm mất kết nối thiết bị. Vui lòng xác nhận thực hiện."
        };
      }

      logDeviceActivity(args.device_id, 'WARN', `Cấu hình thông số hệ thống thay đổi qua MCP bởi ${context.userEmail}`);

      // Save a command alert
      const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      const alertId = `CONF-${args.device_id}-${Date.now().toString().slice(-4)}`;
      db.prepare(`
        INSERT INTO iot_alerts (id, time, title, location, severity, status, details)
        VALUES (?, ?, 'Thay đổi cấu hình mạng ESP', ?, 'info', 'resolved', ?)
      `).run(
        alertId,
        timeStr,
        args.device_id,
        `Người dùng ${context.userEmail} đã cập nhật cấu hình mạng của thiết bị ${args.device_id}. Lệnh cập nhật OTA-Config đã gửi.`
      );

      return {
        success: true,
        message: `Đã gửi gói tin cấu hình mạng mới xuống thiết bị ${args.device_id}. Thiết bị đang áp dụng cấu hình và kiểm tra kết nối.`
      };
    }
  },

  configure_gpio: {
    name: "configure_gpio",
    description: "Cấu hình gán tính năng cho một chân GPIO cụ thể trên ESP (Ví dụ: Thiết lập GPIO 25 làm Đèn, loại OUTPUT).",
    category: "CONFIGURATION",
    requiredPermission: "CONFIG",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        pin: { type: "integer", description: "Số chân vật lý GPIO (ví dụ: 25)" },
        type: { type: "string", description: "Phân loại chân: 'relay', 'temperature', 'humidity', 'motion', 'light', 'pwm', 'digital_input', 'digital_output'" },
        name: { type: "string", description: "Tên thân thiện của chân (ví dụ: Đèn Trần)" },
        mode: { type: "string", description: "Chế độ: 'INPUT' hoặc 'OUTPUT'", default: "OUTPUT" },
        unit: { type: "string", description: "Đơn vị đo (nếu là cảm biến, ví dụ: °C, %)" }
      },
      required: ["device_id", "pin", "type", "name"]
    },
    handler: async (args, context) => {
      // Check if pin is already configured or conflicts with other essential functions
      const isInput = ['temperature', 'humidity', 'motion', 'light', 'digital_input'].includes(args.type);
      const computedMode = args.mode || (isInput ? 'INPUT' : 'OUTPUT');
      const readable = 1;
      const writable = isInput ? 0 : 1;

      db.prepare(`
        INSERT INTO device_gpio (device_id, pin, type, name, mode, readable, writable, unit, current_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(device_id, pin) DO UPDATE SET
          type=excluded.type,
          name=excluded.name,
          mode=excluded.mode,
          readable=excluded.readable,
          writable=excluded.writable,
          unit=excluded.unit
      `).run(
        args.device_id,
        args.pin,
        args.type,
        args.name,
        computedMode,
        readable,
        writable,
        args.unit || '',
        isInput ? '0' : 'OFF'
      );

      logDeviceActivity(args.device_id, 'INFO', `Cấu hình GPIO pin ${args.pin} thành [${args.type}] - ${args.name}`);

      return {
        success: true,
        message: `Đã cấu hình thành công chân GPIO ${args.pin} trên thiết bị ${args.device_id} là "${args.name}".`
      };
    }
  },

  get_gpio_config: {
    name: "get_gpio_config",
    description: "Liệt kê danh sách các GPIO đã được cấu hình trên thiết bị.",
    category: "CONFIGURATION",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const gpios = db.prepare("SELECT pin, type, name, mode, readable, writable, unit, current_value FROM device_gpio WHERE device_id = ? ORDER BY pin ASC")
        .all(args.device_id) as any[];

      return {
        success: true,
        device_id: args.device_id,
        count: gpios.length,
        gpio_list: gpios.map(g => ({
          pin: g.pin,
          type: g.type,
          name: g.name,
          mode: g.mode,
          readable: g.readable === 1,
          writable: g.writable === 1,
          unit: g.unit || undefined,
          current_value: g.current_value
        }))
      };
    }
  },

  // ================= RELAY TOOLS =================
  get_relay_status: {
    name: "get_relay_status",
    description: "Xem trạng thái đóng cắt (BẬT/TẮT) hiện tại của một relay (chân OUTPUT) cụ thể.",
    category: "RELAY",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        pin: { type: "integer", description: "Số chân GPIO relay cần kiểm tra" }
      },
      required: ["device_id", "pin"]
    },
    handler: async (args, context) => {
      const pinConfig = db.prepare("SELECT type, name, current_value FROM device_gpio WHERE device_id = ? AND pin = ?")
        .get(args.device_id, args.pin) as any;
      
      if (!pinConfig) {
        return { success: false, message: `Chân GPIO ${args.pin} chưa được cấu hình trên thiết bị ${args.device_id}` };
      }

      return {
        success: true,
        device_id: args.device_id,
        pin: args.pin,
        name: pinConfig.name,
        type: pinConfig.type,
        status: pinConfig.current_value // 'ON', 'OFF', 'LOCKED', 'UNLOCKED', etc.
      };
    }
  },

  set_relay: {
    name: "set_relay",
    description: "Điều khiển BẬT (ON) hoặc TẮT (OFF) một chân relay.",
    category: "RELAY",
    requiredPermission: "CONTROL",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        pin: { type: "integer", description: "Số chân GPIO" },
        state: { type: "string", description: "Trạng thái điều khiển mong muốn: 'ON' hoặc 'OFF'" }
      },
      required: ["device_id", "pin", "state"]
    },
    handler: async (args, context) => {
      const pinConfig = db.prepare("SELECT type, name, writable FROM device_gpio WHERE device_id = ? AND pin = ?")
        .get(args.device_id, args.pin) as any;
      
      if (!pinConfig) {
        return { success: false, message: `Chân GPIO ${args.pin} chưa được cấu hình` };
      }

      if (pinConfig.writable !== 1) {
        return { success: false, message: `Chân GPIO ${args.pin} là chân chỉ đọc, không thể điều khiển đóng cắt.` };
      }

      const nextState = args.state.toUpperCase() === 'ON' ? 'ON' : 'OFF';

      db.prepare("UPDATE device_gpio SET current_value = ? WHERE device_id = ? AND pin = ?")
        .run(nextState, args.device_id, args.pin);

      // Trigger action log
      logDeviceActivity(args.device_id, 'INFO', `Thay đổi trạng thái Relay pin ${args.pin} (${pinConfig.name}) thành ${nextState}`);

      // Evaluate any rule that is triggered by this relay changing state
      const evaluateRules = db.prepare("SELECT * FROM iot_rules WHERE triggerDevice = ? AND triggerParam = ? AND active = 1").all(args.device_id, `pin_${args.pin}`) as any[];
      for (const rule of evaluateRules) {
        if (rule.triggerValue === nextState) {
          // Trigger rule's action
          logDeviceActivity(rule.actionDevice, 'INFO', `Bị kích hoạt tự động theo kịch bản '${rule.name}': Thực hiện ${rule.actionCommand}`);
        }
      }

      return {
        success: true,
        device_id: args.device_id,
        pin: args.pin,
        name: pinConfig.name,
        state: nextState,
        message: `Đã kích hoạt thành công trạng thái ${nextState} cho cổng ${pinConfig.name} (GPIO ${args.pin}).`
      };
    }
  },

  toggle_relay: {
    name: "toggle_relay",
    description: "Đảo trạng thái (Nếu đang BẬT thì TẮT, đang TẮT thì BẬT) của một relay chỉ định.",
    category: "RELAY",
    requiredPermission: "CONTROL",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        pin: { type: "integer", description: "Số chân GPIO" }
      },
      required: ["device_id", "pin"]
    },
    handler: async (args, context) => {
      const pinConfig = db.prepare("SELECT type, name, writable, current_value FROM device_gpio WHERE device_id = ? AND pin = ?")
        .get(args.device_id, args.pin) as any;
      
      if (!pinConfig) {
        return { success: false, message: `Chân GPIO ${args.pin} chưa được cấu hình` };
      }

      if (pinConfig.writable !== 1) {
        return { success: false, message: `Chân GPIO ${args.pin} chỉ đọc` };
      }

      const nextState = pinConfig.current_value === 'ON' ? 'OFF' : 'ON';

      db.prepare("UPDATE device_gpio SET current_value = ? WHERE device_id = ? AND pin = ?")
        .run(nextState, args.device_id, args.pin);

      logDeviceActivity(args.device_id, 'INFO', `Đảo trạng thái Relay pin ${args.pin} (${pinConfig.name}) thành ${nextState}`);

      return {
        success: true,
        device_id: args.device_id,
        pin: args.pin,
        name: pinConfig.name,
        state: nextState,
        message: `Đã đảo trạng thái hoạt động thành công của ${pinConfig.name} sang ${nextState}.`
      };
    }
  },

  // ================= SENSOR TOOLS =================
  get_sensor_data: {
    name: "get_sensor_data",
    description: "Đọc giá trị đo đạc mới nhất từ một cảm biến hoặc toàn bộ cảm biến trên ESP.",
    category: "SENSOR",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        pin: { type: "integer", description: "Số chân GPIO cảm biến cụ thể (nếu bỏ qua sẽ đọc tất cả)" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      let gpios: any[] = [];
      if (args.pin) {
        const pin = db.prepare("SELECT pin, type, name, unit, current_value FROM device_gpio WHERE device_id = ? AND pin = ?")
          .get(args.device_id, args.pin) as any;
        if (pin) gpios.push(pin);
      } else {
        gpios = db.prepare("SELECT pin, type, name, unit, current_value FROM device_gpio WHERE device_id = ? AND type NOT IN ('relay')")
          .all(args.device_id) as any[];
      }

      if (gpios.length === 0) {
        return { success: false, message: `Không tìm thấy chân cảm biến nào trên thiết bị ${args.device_id}` };
      }

      const readings = gpios.map(g => {
        // Mock a slight variation to mimic real-time telemetry updates!
        let valueStr = g.current_value || "0";
        let valNum = parseFloat(valueStr);
        if (!isNaN(valNum)) {
          const delta = (Math.random() - 0.5) * (g.type === 'temperature' ? 0.4 : 1.5);
          valNum = parseFloat((valNum + delta).toFixed(1));
          valueStr = valNum.toString();
          // Update DB with the slightly varied real-time data
          db.prepare("UPDATE device_gpio SET current_value = ? WHERE device_id = ? AND pin = ?")
            .run(valueStr, args.device_id, g.pin);
        }

        return {
          pin: g.pin,
          sensor_name: g.name,
          type: g.type,
          value: valueStr,
          unit: g.unit || ""
        };
      });

      return {
        success: true,
        device_id: args.device_id,
        readings
      };
    }
  },

  get_sensor_status: {
    name: "get_sensor_status",
    description: "Kiểm tra mức độ ổn định và tính sẵn sàng hoạt động của cảm biến gắn trên chân chỉ định.",
    category: "SENSOR",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        pin: { type: "integer", description: "Số chân GPIO cảm biến" }
      },
      required: ["device_id", "pin"]
    },
    handler: async (args, context) => {
      const pin = db.prepare("SELECT type, name, current_value FROM device_gpio WHERE device_id = ? AND pin = ?")
        .get(args.device_id, args.pin) as any;
      if (!pin) {
        return { success: false, message: `Không tìm thấy chân GPIO ${args.pin}` };
      }

      // Check if current_value indicates anomaly (e.g. extremely high or 0)
      const isOnline = true; // Simulated sensor hardware health check
      return {
        success: true,
        device_id: args.device_id,
        pin: args.pin,
        name: pin.name,
        health: "HEALTHY",
        signal_line: "PULL_UP_OK",
        voltage_level: "3.28V",
        status: isOnline ? "Hoạt động bình thường" : "Mất kết nối vật lý (Lỗi dây dẫn)"
      };
    }
  },

  configure_sensor: {
    name: "configure_sensor",
    description: "Cấu hình ngưỡng kích hoạt cảnh báo hoặc điều chỉnh đơn vị đo của cảm biến.",
    category: "SENSOR",
    requiredPermission: "CONFIG",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        pin: { type: "integer", description: "Số chân GPIO cảm biến" },
        unit: { type: "string", description: "Đơn vị đo mới" },
        high_threshold: { type: "number", description: "Ngưỡng cảnh báo cao" },
        low_threshold: { type: "number", description: "Ngưỡng cảnh báo thấp" }
      },
      required: ["device_id", "pin"]
    },
    handler: async (args, context) => {
      const pin = db.prepare("SELECT name FROM device_gpio WHERE device_id = ? AND pin = ?")
        .get(args.device_id, args.pin) as any;
      if (!pin) return { success: false, message: `Chân ${args.pin} không tồn tại` };

      if (args.unit) {
        db.prepare("UPDATE device_gpio SET unit = ? WHERE device_id = ? AND pin = ?")
          .run(args.unit, args.device_id, args.pin);
      }

      logDeviceActivity(args.device_id, 'INFO', `Cấu hình ngưỡng cảnh báo cho cảm biến pin ${args.pin}: Ngưỡng trên [${args.high_threshold || 'None'}], Ngưỡng dưới [${args.low_threshold || 'None'}]`);

      return {
        success: true,
        message: `Đã cấu hình ngưỡng cảnh báo và bộ chuyển đổi dữ liệu thành công cho cảm biến "${pin.name}".`
      };
    }
  },

  // ================= MQTT TOOLS =================
  get_mqtt_status: {
    name: "get_mqtt_status",
    description: "Kiểm tra trạng thái kết nối của hệ thống trung tâm IoT với MQTT Broker và danh sách topic đăng ký.",
    category: "MQTT",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {}
    },
    handler: async (args, context) => {
      return {
        success: true,
        broker: {
          host: "mqtt.anhduonglaw.vn",
          port: 1883,
          status: "connected",
          active_connections: 18,
          messages_sent_today: 4892,
          topics: [
            "anhduong/iot/+/telemetry",
            "anhduong/iot/+/status",
            "anhduong/iot/+/command",
            "anhduong/iot/+/ota"
          ]
        }
      };
    }
  },

  configure_mqtt: {
    name: "configure_mqtt",
    description: "Cấu hình địa chỉ, cổng hoặc thông tin xác thực cho máy chủ MQTT Broker.",
    category: "MQTT",
    requiredPermission: "ADMIN",
    dangerous: true,
    parameters: {
      type: "object",
      properties: {
        host: { type: "string", description: "Địa chỉ IP hoặc Tên miền MQTT Broker" },
        port: { type: "integer", description: "Cổng kết nối", default: 1883 },
        username: { type: "string", description: "Tài khoản bảo mật" },
        password: { type: "string", description: "Mật khẩu" },
        confirmed: { type: "boolean", description: "Xác nhận đổi thông tin máy chủ", default: false }
      },
      required: ["host"]
    },
    handler: async (args, context) => {
      if (!args.confirmed) {
        return {
          success: false,
          requireConfirmation: true,
          message: "Thay đổi thông tin MQTT Broker sẽ ngắt kết nối tạm thời toàn bộ thiết bị trong tòa nhà. Vui lòng xác nhận."
        };
      }

      return {
        success: true,
        message: `Đã thay đổi địa chỉ máy chủ MQTT sang ${args.host}:${args.port || 1883} thành công. Hệ thống đang đồng bộ kết nối lại.`
      };
    }
  },

  test_mqtt_connection: {
    name: "test_mqtt_connection",
    description: "Gửi gói tin Ping-Broker để đo thời gian phản hồi và kiểm tra lỗi xác thực từ Broker.",
    category: "MQTT",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {}
    },
    handler: async (args, context) => {
      return {
        success: true,
        latency_ms: 12,
        auth_status: "AUTHORIZED",
        broker_response: "MQTT_CONN_ACK_OK"
      };
    }
  },

  // ================= DIAGNOSTICS TOOLS =================
  diagnose_device: {
    name: "diagnose_device",
    description: "Chẩn đoán lỗi tổng thể cho thiết bị ESP (Quét lịch sử log, kiểm tra sóng WiFi, nguồn điện và lỗi cảm biến).",
    category: "DIAGNOSTICS",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT * FROM iot_devices WHERE id = ?").get(args.device_id) as any;
      if (!device) return { success: false, message: `Không tìm thấy thiết bị ${args.device_id}` };

      // Analyze metrics
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (device.rssi < -80) {
        issues.push("Tín hiệu sóng WiFi quá yếu (" + device.rssi + " dBm)");
        suggestions.push("Di chuyển thiết bị lại gần Router hoặc bổ sung bộ kích sóng WiFi Repeater.");
      }
      if (device.status !== 'online') {
        issues.push("Thiết bị đang Ngoại tuyến (Mất kết nối hoàn toàn)");
        suggestions.push("Kiểm tra lại nguồn cấp điện 5V/3.3V của ESP và đèn LED báo trạng thái vật lý.");
      }

      // Check logs for errors
      const logs = db.prepare("SELECT message FROM device_logs WHERE device_id = ? AND log_level = 'ERROR' LIMIT 3")
        .all(args.device_id) as any[];
      if (logs.length > 0) {
        issues.push(`Tìm thấy ${logs.length} mã lỗi hệ thống trong tệp log gần nhất.`);
        logs.forEach(l => suggestions.push(`Lỗi ghi nhận: "${l.message}"`));
      }

      if (issues.length === 0) {
        return {
          success: true,
          device_id: args.device_id,
          health_score: 98,
          status: "EXCELLENT",
          diagnosis: "Tất cả các mô-đun kết nối, GPIO, Cảm biến và Bộ nhớ hoạt động hoàn hảo.",
          recommendations: ["Duy trì chế độ tự động làm sạch RAM hàng tuần."]
        };
      }

      return {
        success: true,
        device_id: args.device_id,
        health_score: Math.max(20, 100 - issues.length * 25),
        status: "WARNING_DETECTION",
        diagnosis: `Phát hiện ${issues.length} điểm bất thường ảnh hưởng tới hiệu suất của thiết bị.`,
        issues,
        recommendations: suggestions
      };
    }
  },

  get_device_health: {
    name: "get_device_health",
    description: "Trả về điểm số sức khỏe (0-100) và các chỉ số tài nguyên hiện tại của ESP.",
    category: "DIAGNOSTICS",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT cpu_usage, memory_usage, rssi, status FROM iot_devices WHERE id = ?").get(args.device_id) as any;
      if (!device) return { success: false, message: "Không tìm thấy thiết bị" };

      let score = 100;
      if (device.status !== 'online') score = 0;
      else {
        score -= Math.max(0, Math.floor(device.cpu_usage - 50) * 0.5);
        score -= Math.max(0, Math.floor(device.memory_usage - 60) * 0.8);
        if (device.rssi < -70) score -= 15;
      }

      return {
        success: true,
        device_id: args.device_id,
        health_score: Math.max(0, score),
        parameters: {
          cpu_status: device.cpu_usage > 80 ? "HIGH_LOAD" : "NORMAL",
          memory_status: device.memory_usage > 85 ? "OUT_OF_MEM_WARNING" : "HEALTHY_ALLOCATION",
          signal_loss_percent: device.rssi < -85 ? "45%" : "2%"
        }
      };
    }
  },

  get_device_logs: {
    name: "get_device_logs",
    description: "Truy vấn danh sách nhật ký vận hành (Logs) gần nhất của thiết bị ESP.",
    category: "DIAGNOSTICS",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        limit: { type: "integer", description: "Số lượng dòng log cần lấy", default: 15 }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const logs = db.prepare("SELECT id, log_level, message, created_at FROM device_logs WHERE device_id = ? ORDER BY id DESC LIMIT ?")
        .all(args.device_id, args.limit || 15) as any[];

      return {
        success: true,
        device_id: args.device_id,
        count: logs.length,
        logs: logs.map(l => ({
          timestamp: l.created_at,
          level: l.log_level,
          msg: l.message
        }))
      };
    }
  },

  restart_device: {
    name: "restart_device",
    description: "Gửi lệnh khởi động lại (Reboot / Restart) cho thiết bị ESP.",
    category: "DIAGNOSTICS",
    requiredPermission: "CONTROL",
    dangerous: true,
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        confirmed: { type: "boolean", description: "Xác nhận khởi động lại", default: false }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      if (!args.confirmed) {
        return {
          success: false,
          requireConfirmation: true,
          message: `Xác nhận gửi lệnh khởi động lại cho thiết bị ${args.device_id}?`
        };
      }

      db.prepare("UPDATE iot_devices SET uptime = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?").run(args.device_id);
      logDeviceActivity(args.device_id, 'WARN', `ESP bị yêu cầu khởi động lại từ xa qua MCP bởi ${context.userEmail}`);

      return {
        success: true,
        message: `Đã gửi lệnh khẩn khởi động lại (ESP.restart()) thành công xuống thiết bị ${args.device_id}. Thiết bị sẽ online lại trong vòng 10 giây.`
      };
    }
  },

  // ================= FIRMWARE TOOLS =================
  get_firmware_version: {
    name: "get_firmware_version",
    description: "Xem phiên bản firmware hiện tại đang chạy trên thiết bị.",
    category: "FIRMWARE",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT model, firmware FROM iot_devices WHERE id = ?").get(args.device_id) as any;
      if (!device) return { success: false, message: "Không tìm thấy thiết bị" };

      return {
        success: true,
        device_id: args.device_id,
        model: device.model,
        current_firmware: device.firmware
      };
    }
  },

  check_firmware_update: {
    name: "check_firmware_update",
    description: "So sánh phiên bản firmware trên ESP với kho lưu trữ máy chủ để kiểm tra cập nhật.",
    category: "FIRMWARE",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      const device = db.prepare("SELECT model, firmware FROM iot_devices WHERE id = ?").get(args.device_id) as any;
      if (!device) return { success: false, message: "Không tìm thấy thiết bị" };

      const latest = db.prepare("SELECT version, description FROM device_firmware WHERE model = ? ORDER BY version DESC LIMIT 1")
        .get(device.model) as { version: string; description: string } | undefined;

      if (!latest) {
        return {
          success: true,
          device_id: args.device_id,
          update_available: false,
          message: "Không tìm thấy phiên bản firmware chính thức nào cho dòng chip này."
        };
      }

      const hasUpdate = latest.version !== device.firmware;

      return {
        success: true,
        device_id: args.device_id,
        current_version: device.firmware,
        latest_version: latest.version,
        update_available: hasUpdate,
        release_notes: latest.description,
        message: hasUpdate 
          ? `Phát hiện phiên bản mới v${latest.version}.` 
          : "Thiết bị đang chạy phiên bản firmware mới nhất."
      };
    }
  },

  update_firmware: {
    name: "update_firmware",
    description: "Thực hiện nạp chương trình mới từ xa cho ESP qua mạng (OTA Update).",
    category: "FIRMWARE",
    requiredPermission: "ADMIN",
    dangerous: true,
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        target_version: { type: "string", description: "Phiên bản firmware đích" },
        confirmed: { type: "boolean", description: "Xác nhận thực hiện nâng cấp", default: false }
      },
      required: ["device_id", "target_version"]
    },
    handler: async (args, context) => {
      if (!args.confirmed) {
        return {
          success: false,
          requireConfirmation: true,
          message: `Nâng cấp phần mềm hệ thống (OTA v${args.target_version}) cho thiết bị ${args.device_id} có thể gây ngắt quãng hoạt động. Vui lòng xác nhận.`
        };
      }

      // Check if version exists
      const fw = db.prepare("SELECT url FROM device_firmware WHERE version = ?").get(args.target_version) as any;
      if (!fw) return { success: false, message: `Không tìm thấy phiên bản v${args.target_version} trong kho lưu trữ.` };

      // Update firmware version inside DB
      db.prepare("UPDATE iot_devices SET firmware = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?")
        .run(args.target_version, args.device_id);

      logDeviceActivity(args.device_id, 'WARN', `Cập nhật OTA Firmware hoàn thành sang bản v${args.target_version} bởi ${context.userEmail}`);

      // Add audit system log
      const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      db.prepare(`
        INSERT INTO iot_alerts (id, time, title, location, severity, status, details)
        VALUES (?, ?, 'Cập nhật OTA Firmware Thành công', ?, 'info', 'resolved', ?)
      `).run(
        `OTA-${args.device_id}-${Date.now().toString().slice(-4)}`,
        timeStr,
        args.device_id,
        `Thiết bị ${args.device_id} đã nạp thành công phân vùng chương trình mới v${args.target_version} qua giao thức HTTP-OTA.`
      );

      return {
        success: true,
        message: `Đã nạp thành công chương trình OTA v${args.target_version} xuống thiết bị ${args.device_id}. ESP đang tự động nạp lại vùng nhớ flash mới.`
      };
    }
  },

  rollback_firmware: {
    name: "rollback_firmware",
    description: "Hoàn tác firmware (Rollback) của ESP về phiên bản ổn định liền trước.",
    category: "FIRMWARE",
    requiredPermission: "ADMIN",
    dangerous: true,
    parameters: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Mã ID thiết bị" },
        confirmed: { type: "boolean", description: "Xác nhận hoàn tác", default: false }
      },
      required: ["device_id"]
    },
    handler: async (args, context) => {
      if (!args.confirmed) {
        return {
          success: false,
          requireConfirmation: true,
          message: `Xác nhận hạ cấp phần mềm khẩn cấp (Rollback Firmware) cho thiết bị ${args.device_id}?`
        };
      }

      db.prepare("UPDATE iot_devices SET firmware = '1.0.0', last_seen = CURRENT_TIMESTAMP WHERE id = ?")
        .run(args.device_id);

      logDeviceActivity(args.device_id, 'WARN', `Hoàn tác phần mềm (Rollback) khẩn cấp về v1.0.0 thành công.`);

      return {
        success: true,
        message: `Đã hoàn tác chương trình thành công về bản v1.0.0 ổn định cho thiết bị ${args.device_id}.`
      };
    }
  },

  // ================= AUTOMATION TOOLS =================
  create_automation: {
    name: "create_automation",
    description: "Tạo kịch bản tự động hóa mới (Ví dụ: Nếu Cảm biến Nhiệt độ phòng máy chủ > 35 độ thì tự bật Quạt thông gió).",
    category: "AUTOMATION",
    requiredPermission: "CONFIG",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mã ID kịch bản (ví dụ: R-04)" },
        name: { type: "string", description: "Tên kịch bản tự động hóa" },
        triggerDevice: { type: "string", description: "Mã ID thiết bị nguồn phát tín hiệu" },
        triggerParam: { type: "string", description: "Tham số theo dõi (temperature, humidity, access, occupancy, pin_XX)" },
        operator: { type: "string", description: "Toán tử so sánh: '=', '>', '<', 'changes'" },
        triggerValue: { type: "string", description: "Giá trị kích hoạt ngưỡng" },
        actionDevice: { type: "string", description: "Mã ID thiết bị đích nhận lệnh thực thi" },
        actionCommand: { type: "string", description: "Lệnh sẽ thực thi (ví dụ: ON, OFF, POWER_OFF)" }
      },
      required: ["id", "name", "triggerDevice", "triggerParam", "operator", "triggerValue", "actionDevice", "actionCommand"]
    },
    handler: async (args, context) => {
      db.prepare(`
        INSERT INTO iot_rules (id, name, triggerDevice, triggerParam, operator, triggerValue, actionDevice, actionCommand, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          triggerDevice=excluded.triggerDevice,
          triggerParam=excluded.triggerParam,
          operator=excluded.operator,
          triggerValue=excluded.triggerValue,
          actionDevice=excluded.actionDevice,
          actionCommand=excluded.actionCommand
      `).run(
        args.id,
        args.name,
        args.triggerDevice,
        args.triggerParam,
        args.operator,
        args.triggerValue,
        args.actionDevice,
        args.actionCommand
      );

      return {
        success: true,
        id: args.id,
        message: `Đã khởi tạo thành công kịch bản tự động hóa '${args.name}'.`
      };
    }
  },

  update_automation: {
    name: "update_automation",
    description: "Cập nhật thông tin hoặc đổi trạng thái Bật/Tắt một kịch bản tự động hóa.",
    category: "AUTOMATION",
    requiredPermission: "CONFIG",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mã kịch bản tự động hóa" },
        active: { type: "boolean", description: "Trạng thái kích hoạt" },
        name: { type: "string", description: "Tên kịch bản mới" }
      },
      required: ["id"]
    },
    handler: async (args, context) => {
      const rule = db.prepare("SELECT * FROM iot_rules WHERE id = ?").get(args.id) as any;
      if (!rule) return { success: false, message: "Không tìm thấy kịch bản tự động hóa." };

      if (args.active !== undefined) {
        db.prepare("UPDATE iot_rules SET active = ? WHERE id = ?").run(args.active ? 1 : 0, args.id);
      }
      if (args.name !== undefined) {
        db.prepare("UPDATE iot_rules SET name = ? WHERE id = ?").run(args.name, args.id);
      }

      return {
        success: true,
        message: `Đã cập nhật kịch bản tự động hóa ${args.id} thành công.`
      };
    }
  },

  delete_automation: {
    name: "delete_automation",
    description: "Xóa bỏ một kịch bản tự động hóa khỏi cơ sở dữ liệu.",
    category: "AUTOMATION",
    requiredPermission: "CONFIG",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mã ID kịch bản cần xóa" }
      },
      required: ["id"]
    },
    handler: async (args, context) => {
      const result = db.prepare("DELETE FROM iot_rules WHERE id = ?").run(args.id);
      if (result.changes === 0) return { success: false, message: "Không tìm thấy kịch bản cần xóa." };

      return {
        success: true,
        message: `Đã xóa kịch bản tự động hóa ${args.id} thành công.`
      };
    }
  },

  get_automations: {
    name: "get_automations",
    description: "Lấy danh sách các kịch bản tự động hóa hiện tại trong hệ thống.",
    category: "AUTOMATION",
    requiredPermission: "VIEW",
    parameters: {
      type: "object",
      properties: {}
    },
    handler: async (args, context) => {
      const rules = db.prepare("SELECT * FROM iot_rules").all() as any[];
      return {
        success: true,
        count: rules.length,
        automations: rules.map(r => ({
          id: r.id,
          name: r.name,
          triggerDevice: r.triggerDevice,
          triggerParam: r.triggerParam,
          operator: r.operator,
          triggerValue: r.triggerValue,
          actionDevice: r.actionDevice,
          actionCommand: r.actionCommand,
          active: r.active === 1
        }))
      };
    }
  }
};

// Main MCP execute runner
export async function executeMcpTool(
  toolName: string,
  args: any,
  user: { email: string; role: string }
): Promise<any> {
  const tool = mcpToolsRegistry[toolName];
  if (!tool) {
    return { success: false, error: `Mô hình MCP không chứa tool có tên '${toolName}'` };
  }

  // Check user permission
  const hasPermission = checkMcpPermission(user.role, tool.requiredPermission);
  if (!hasPermission) {
    logMcpAudit(user.email, "Gemini-IoT-Agent", toolName, args?.device_id || null, JSON.stringify(args), `Từ chối truy cập: Thiếu quyền ${tool.requiredPermission}`, false);
    return {
      success: false,
      error: `Bạn không có quyền thực hiện hành động này. Thao tác yêu cầu mức quyền tối thiểu: ${tool.requiredPermission}.`
    };
  }

  try {
    const result = await tool.handler(args, { userEmail: user.email, userRole: user.role });
    const success = result.success !== false;
    logMcpAudit(user.email, "Gemini-IoT-Agent", toolName, args?.device_id || null, JSON.stringify(args), JSON.stringify(result).slice(0, 500), success);
    return result;
  } catch (err: any) {
    console.error(`MCP Tool [${toolName}] Execution error:`, err);
    logMcpAudit(user.email, "Gemini-IoT-Agent", toolName, args?.device_id || null, JSON.stringify(args), `Thất bại: ${err.message}`, false);
    return { success: false, error: `Lỗi thực thi công cụ MCP: ${err.message}` };
  }
}
