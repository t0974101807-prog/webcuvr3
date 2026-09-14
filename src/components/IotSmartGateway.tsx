import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  Cpu, Wifi, Thermometer, Droplets, Wind, Sun, Camera, UserCheck, Code, Terminal,
  RefreshCw, Plus, Radio, CheckCircle2, AlertTriangle, Copy, Check, Send, Zap,
  HardDrive, LayoutDashboard, Database, Activity, Map, Settings, Play, ShieldAlert,
  AlertOctagon, Power, Bell, Layers, Eye, Users, ChevronRight, X, Sparkles, Binary, Trash2, Edit3, Link2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { api } from "../lib/api";
import { IotDevice, TelemetryData, AttendanceEvent, AlarmEvent, AutomationRule } from "../types/iot";
import { IotDigitalTwin } from "./IotDigitalTwin";
import { IotCameraAI } from "./IotCameraAI";
import { IotCodeGenerator } from "./IotCodeGenerator";

export const IotSmartGateway: React.FC<{ language: "vi" | "en" }> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "devices" | "digital_twin" | "camera" | "automation" | "firmware" | "tester" | "mcp"
  >("dashboard");

  // Faceplugin Face Recognition SDK states
  const [sdkMinFaceSize, setSdkMinFaceSize] = useState(40);
  const [sdkConfidenceThreshold, setSdkConfidenceThreshold] = useState(75);
  const [sdkLivenessThreshold, setSdkLivenessThreshold] = useState(85);
  const [sdkPlaygroundLang, setSdkPlaygroundLang] = useState<"wasm" | "cpp" | "python" | "kotlin">("wasm");
  const [isFaceEnrollOpen, setIsFaceEnrollOpen] = useState(false);
  const [faceEnrollForm, setFaceEnrollForm] = useState({ name: "", role: "", avatarUrl: "" });
  const [users, setUsers] = useState<any[]>([]);
  const [enrolledFaces, setEnrolledFaces] = useState([
    { id: 1, name: "Quản trị viên", role: "", confidence: 99.1, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", status: "Active" },
    { id: 2, name: "Luật sư Trần Văn Bảo", role: "Luật sư Cấp cao", confidence: 98.4, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", status: "Active" },
    { id: 3, name: "Chuyên viên Nguyễn Hải Nguyệt", role: "Chuyên viên Pháp lý", confidence: 96.5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", status: "Active" }
  ]);
  const [sdkLogs, setSdkLogs] = useState([
    { id: "L-01", time: "10:25 AM", name: "Quản trị viên", location: "Cổng Chính (Lễ tân Tầng 1)", match: 99.1, liveness: 94.2, status: "PASS" },
    { id: "L-02", time: "10:12 AM", name: "Luật sư Trần Văn Bảo", location: "Cổng Chính (Lễ tân Tầng 1)", match: 98.4, liveness: 92.5, status: "PASS" },
    { id: "L-03", time: "09:45 AM", name: "Chuyên viên Nguyễn Hải Nguyệt", location: "Cổng Chính (Lễ tân Tầng 1)", match: 96.5, liveness: 91.8, status: "PASS" }
  ]);

  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [weather, setWeather] = useState<TelemetryData | null>(null);
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (users.length > 0) {
      const realFaces = users
        .filter((u: any) => u.role !== "client")
        .map((u: any, idx: number) => {
          // Quản trị viên sử dụng chức danh thực tế, mặc định là Luật sư Điều hành
          const roleTitle = u.title || ((u.role === "admin" || u.username === "admin") ? "Luật sư Điều hành" : "Chuyên viên Pháp lý");
          return {
            id: u.id || (idx + 1),
            name: u.name || u.username,
            role: roleTitle,
            confidence: u.role === "admin" ? 99.1 : parseFloat((95.0 + ((u.id || idx) % 5) * 0.9).toFixed(1)),
            avatar: u.avatar || (u.gender === "Nữ" ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"),
            status: "Active"
          };
        });
      setEnrolledFaces(realFaces);
    }
  }, [users]);

  useEffect(() => {
    if (attendanceEvents.length > 0) {
      const realLogs = attendanceEvents.map((evt, idx) => {
        const timeStr = (() => {
          try {
            const d = new Date(evt.timestamp);
            if (isNaN(d.getTime())) {
              return evt.timestamp || "Just now";
            }
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch (e) {
            return "Just now";
          }
        })();

        return {
          id: `L-${evt.id || idx}`,
          time: timeStr,
          name: evt.employee_name,
          location: evt.device_id === "DEV-ESP32-CAM-01" ? "Cổng Chính (Lễ tân Tầng 1)" : "Cổng Phụ Tầng 2",
          match: evt.confidence || 95.0,
          liveness: parseFloat(((evt.confidence || 95.0) * 0.95).toFixed(1)),
          status: "PASS"
        };
      });
      setSdkLogs(realLogs);
    }
  }, [attendanceEvents]);

  // Custom UI-driven states
  const [systemAlerts, setSystemAlerts] = useState<AlarmEvent[]>([
    {
      id: "AL-01",
      time: "10:28 AM",
      title: "Door Forced Open (Cửa sau tòa nhà)",
      location: "Cổng Phụ Tầng 1",
      severity: "critical",
      status: "active",
      details: "Phát hiện lực tác động mạnh liên tục mở cửa từ bên ngoài."
    },
    {
      id: "AL-02",
      time: "10:27 AM",
      title: "Nhiệt độ phòng Server tăng cao (38.5°C)",
      location: "Phòng Server",
      severity: "critical",
      status: "active",
      details: "Nhiệt độ phòng máy chủ vượt ngưỡng khuyến nghị 24°C."
    },
    {
      id: "AL-03",
      time: "10:24 AM",
      title: "Camera CAM-02 Mất kết nối",
      location: "Hành lang Tầng 2",
      severity: "warning",
      status: "active",
      details: "Không nhận tín hiệu hình ảnh RTSP trong 3 phút qua."
    },
    {
      id: "AL-04",
      time: "10:20 AM",
      title: "Khói nhẹ phát hiện ở khu bếp",
      location: "Khu vực Pantry",
      severity: "warning",
      status: "active",
      details: "Cảm biến quang học phát hiện lượng khói mật độ 12ppm."
    },
    {
      id: "AL-05",
      time: "10:18 AM",
      title: "Pin thiết bị RFID-01 yếu (15%)",
      location: "Cổng Phụ Tầng 2",
      severity: "warning",
      status: "active",
      details: "Điện áp pin dự phòng hạ xuống còn 2.8V."
    }
  ]);

  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: "R-01",
      name: "Tự động tắt điều hòa sau 18h00 khi vắng người",
      triggerDevice: "DEV-ESP32-CAM-01",
      triggerParam: "occupancy",
      operator: "=",
      triggerValue: "0",
      actionDevice: "DEV-AC-LOBBY",
      actionCommand: "POWER_OFF",
      active: true
    },
    {
      id: "R-02",
      name: "Bật quạt thông gió nếu nhiệt độ phòng máy chủ > 35°C",
      triggerDevice: "DEV-SERVER-TEMP",
      triggerParam: "temperature",
      operator: ">",
      triggerValue: "35",
      actionDevice: "DEV-SERVER-FAN",
      actionCommand: "FAN_ON_100%",
      active: true
    },
    {
      id: "R-03",
      name: "Cảnh báo mở cửa phòng Server ngoài giờ hành chính",
      triggerDevice: "DEV-RFID-01",
      triggerParam: "access",
      operator: "changes",
      triggerValue: "unauthorized",
      actionDevice: "SIREN_ALERT",
      actionCommand: "PLAY_ALARM",
      active: false
    }
  ]);

  // Add/Edit device form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);
  const [newDevice, setNewDevice] = useState({
    id: "",
    name: "",
    mac_address: "",
    ip_address: "",
    location: "",
    device_type: "esp32_cam",
    api_key: ""
  });

  // Automation Rule form state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleForm, setRuleForm] = useState<Omit<AutomationRule, "active">>({
    id: "",
    name: "",
    triggerDevice: "DEV-ESP32-CAM-01",
    triggerParam: "occupancy",
    operator: "=",
    triggerValue: "0",
    actionDevice: "DEV-AC-LOBBY",
    actionCommand: "POWER_OFF"
  });

  // Simulator state
  const [simName, setSimName] = useState("Nguyễn Văn A");
  const [simEmpId, setSimEmpId] = useState("NV001");
  const [simDevice, setSimDevice] = useState("DEV-ESP32-CAM-01");
  const [simTelemetryDevice, setSimTelemetryDevice] = useState("DEV-WEATHER-01");
  const [simConfidence, setSimConfidence] = useState(98.5);
  const [simTemp, setSimTemp] = useState(29.2);
  const [simHumid, setSimHumid] = useState(62.0);
  const [simWeather, setSimWeather] = useState("Nắng rực rỡ");
  const [simStatusMsg, setSimStatusMsg] = useState("");

  // MCP States
  const [mcpAuditLogs, setMcpAuditLogs] = useState<any[]>([]);
  const [mcpPermissions, setMcpPermissions] = useState<any[]>([]);
  const [mcpToolsList, setMcpToolsList] = useState<any[]>([]);
  const [selectedMcpDevice, setSelectedMcpDevice] = useState<string>("");
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>("discover_devices");
  const [mcpToolArgs, setMcpToolArgs] = useState<string>("{}");
  const [mcpToolResult, setMcpToolResult] = useState<any>(null);
  const [mcpExecuting, setMcpExecuting] = useState<boolean>(false);
  const [simulateMcpFault, setSimulateMcpFault] = useState<boolean>(false);
  const [gpioConfigList, setGpioConfigList] = useState<any[]>([]);
  const [gpioForm, setGpioForm] = useState({
    pin: "2",
    type: "RELAY",
    name: "Đèn trần",
    mode: "OUTPUT"
  });

  const fetchGpioConfig = async (devId: string) => {
    if (!devId) return;
    try {
      const res = await api.req("/api/iot/mcp/execute", {
        method: "POST",
        body: JSON.stringify({
          toolName: "get_gpio_config",
          args: { device_id: devId }
        })
      });
      if (res.success && Array.isArray(res.data)) {
        setGpioConfigList(res.data);
      } else {
        setGpioConfigList([]);
      }
    } catch (e) {
      console.error("Error fetching GPIO config:", e);
    }
  };

  useEffect(() => {
    if (devices.length > 0 && !selectedMcpDevice) {
      setSelectedMcpDevice(devices[0].id);
    }
  }, [devices]);

  useEffect(() => {
    if (selectedMcpDevice) {
      fetchGpioConfig(selectedMcpDevice);
    }
  }, [selectedMcpDevice]);

  useEffect(() => {
    const templates: Record<string, string> = {
      discover_devices: "{}",
      get_device: '{\n  "device_id": "DEV-ESP32-CAM-01"\n}',
      register_device: '{\n  "device_id": "DEV-ESP32-CAM-02",\n  "name": "Cửa Phòng Pháp Lý",\n  "model": "ESP32",\n  "mac_address": "AA:BB:CC:DD:EE:FF",\n  "ip_address": "192.168.1.151",\n  "location": "Phòng Pháp Lý",\n  "confirmed": true\n}',
      update_device: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "name": "Cổng Chính (Lễ tân Tầng 1) Đã cập nhật"\n}',
      remove_device: '{\n  "device_id": "DEV-ESP32-CAM-02",\n  "confirmed": true\n}',
      get_device_status: '{\n  "device_id": "DEV-ESP32-CAM-01"\n}',
      ping_device: '{\n  "device_id": "DEV-ESP32-CAM-01"\n}',
      get_device_config: '{\n  "device_id": "DEV-ESP32-CAM-01"\n}',
      configure_device: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "config": {\n    "reporting_interval": 30\n  }\n}',
      configure_gpio: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "pin": "2",\n  "type": "RELAY",\n  "name": "Đèn trần",\n  "mode": "OUTPUT"\n}',
      get_gpio_config: '{\n  "device_id": "DEV-ESP32-CAM-01"\n}',
      get_relay_status: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "pin": "2"\n}',
      set_relay: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "pin": "2",\n  "state": "ON"\n}',
      toggle_relay: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "pin": "2"\n}',
      get_sensor_data: '{\n  "device_id": "DEV-WEATHER-01",\n  "pin": "4"\n}',
      get_sensor_status: '{\n  "device_id": "DEV-WEATHER-01",\n  "pin": "4"\n}',
      configure_sensor: '{\n  "device_id": "DEV-WEATHER-01",\n  "pin": "4",\n  "sensor_type": "DHT22"\n}',
      get_mqtt_status: "{}",
      configure_mqtt: '{\n  "broker_url": "mqtt://broker.emqx.io"\n}',
      test_mqtt_connection: "{}",
      diagnose_device: '{\n  "device_id": "DEV-ESP32-CAM-01"\n}',
      get_device_health: '{\n  "device_id": "DEV-ESP32-CAM-01"\n}',
      get_device_logs: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "limit": 10\n}',
      restart_device: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "confirmed": true\n}',
      get_firmware_version: "{}",
      check_firmware_update: "{}",
      update_firmware: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "target_version": "v1.2.1",\n  "confirmed": true\n}',
      rollback_firmware: '{\n  "device_id": "DEV-ESP32-CAM-01",\n  "confirmed": true\n}',
      create_automation: '{\n  "name": "Bật đèn khi có người",\n  "trigger_device_id": "DEV-ESP32-CAM-01",\n  "trigger_param": "occupancy",\n  "operator": ">",\n  "trigger_value": "0",\n  "action_device_id": "DEV-ESP32-CAM-01",\n  "action_command": "RELAY_ON_2"\n}',
      update_automation: '{\n  "automation_id": "R-01",\n  "name": "Cập nhật kịch bản"\n}',
      delete_automation: '{\n  "automation_id": "R-01"\n}',
      get_automations: "{}"
    };
    if (templates[selectedMcpTool]) {
      setMcpToolArgs(templates[selectedMcpTool]);
    }
  }, [selectedMcpTool]);

  const handleExecuteMcpToolPlayground = async () => {
    setMcpExecuting(true);
    setMcpToolResult(null);
    try {
      if (simulateMcpFault) {
        throw new Error("ERR_CONNECTION_TIMEOUT: Mất kết nối đến ESP Gateway (Simulated Fault)");
      }
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(mcpToolArgs);
      } catch (err) {
        throw new Error("Lỗi cú pháp JSON đối số!");
      }

      const res = await api.req("/api/iot/mcp/execute", {
        method: "POST",
        body: JSON.stringify({
          toolName: selectedMcpTool,
          args: parsedArgs
        })
      });
      setMcpToolResult(res);
      
      // Re-fetch audits and permissions
      const [auditRes, permRes] = await Promise.all([
        api.req("/api/iot/mcp/audit-logs"),
        api.req("/api/iot/mcp/permissions")
      ]);
      if (auditRes && auditRes.success) setMcpAuditLogs(auditRes.logs);
      if (permRes && permRes.success) setMcpPermissions(permRes.permissions);
      
      if (selectedMcpDevice) {
        fetchGpioConfig(selectedMcpDevice);
      }
      fetchData();
    } catch (err: any) {
      setMcpToolResult({ success: false, error: err.message });
    } finally {
      setMcpExecuting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devRes, wRes, attRes, usersRes, rulesRes, alertsRes, auditRes, permRes, toolsRes] = await Promise.all([
        api.req("/api/iot/devices"),
        api.req("/api/iot/weather"),
        api.req("/api/iot/attendance-events"),
        api.req("/api/users"),
        api.req("/api/iot/rules"),
        api.req("/api/iot/alerts"),
        api.req("/api/iot/mcp/audit-logs"),
        api.req("/api/iot/mcp/permissions"),
        api.req("/api/iot/mcp/tools")
      ]);
      if (devRes.success) setDevices(devRes.devices);
      if (wRes.success && wRes.weather) setWeather(wRes.weather);
      if (attRes.success) setAttendanceEvents(attRes.events);
      if (rulesRes && rulesRes.success) setAutomationRules(rulesRes.rules);
      if (alertsRes && alertsRes.success) setSystemAlerts(alertsRes.alerts);
      if (auditRes && auditRes.success) setMcpAuditLogs(auditRes.logs);
      if (permRes && permRes.success) setMcpPermissions(permRes.permissions);
      if (toolsRes && toolsRes.success) setMcpToolsList(toolsRes.tools);
      if (Array.isArray(usersRes)) {
        setUsers(usersRes);
      }
    } catch (err) {
      console.error("Error fetching IoT data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.id || !newDevice.name) return;
    try {
      await api.req("/api/iot/devices", {
        method: "POST",
        body: JSON.stringify(newDevice)
      });
      setShowAddModal(false);
      setEditingDevice(null);
      setNewDevice({
        id: "",
        name: "",
        mac_address: "",
        ip_address: "",
        location: "",
        device_type: "esp32_cam",
        api_key: ""
      });
      fetchData();
    } catch (err) {
      alert("Lỗi đăng ký thiết bị");
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thiết bị ${id}?`)) return;
    try {
      await api.req(`/api/iot/devices/${id}`, {
        method: "DELETE"
      });
      fetchData();
    } catch (err) {
      alert("Lỗi khi xóa thiết bị");
    }
  };

  const handleStartEditDevice = (dev: any) => {
    setEditingDevice(dev);
    setNewDevice({
      id: dev.id,
      name: dev.name,
      mac_address: dev.mac_address || "",
      ip_address: dev.ip_address || "",
      location: dev.location || "",
      device_type: dev.device_type,
      api_key: dev.api_key || ""
    });
    setShowAddModal(true);
  };

  // Rule CRUD handlers
  const handleOpenAddRuleModal = () => {
    setEditingRule(null);
    setRuleForm({
      id: `R-0${automationRules.length + 1}`,
      name: "",
      triggerDevice: devices[0]?.id || "DEV-ESP32-CAM-01",
      triggerParam: "occupancy",
      operator: "=",
      triggerValue: "0",
      actionDevice: "DEV-AC-LOBBY",
      actionCommand: "POWER_OFF"
    });
    setShowRuleModal(true);
  };

  const handleStartEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setRuleForm({
      id: rule.id,
      name: rule.name,
      triggerDevice: rule.triggerDevice,
      triggerParam: rule.triggerParam,
      operator: rule.operator,
      triggerValue: rule.triggerValue,
      actionDevice: rule.actionDevice,
      actionCommand: rule.actionCommand
    });
    setShowRuleModal(true);
  };

  const handleDuplicateRule = (rule: AutomationRule) => {
    setEditingRule(null);
    setRuleForm({
      id: `R-0${automationRules.length + 1}_COPY`,
      name: `${rule.name} (Copy)`,
      triggerDevice: rule.triggerDevice,
      triggerParam: rule.triggerParam,
      operator: rule.operator,
      triggerValue: rule.triggerValue,
      actionDevice: rule.actionDevice,
      actionCommand: rule.actionCommand
    });
    setShowRuleModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.id || !ruleForm.name) return;

    try {
      const isDuplicateId = automationRules.some(r => r.id === ruleForm.id);
      const finalId = editingRule ? ruleForm.id : (isDuplicateId ? `${ruleForm.id}_${Date.now().toString().slice(-4)}` : ruleForm.id);
      
      const ruleToSave = {
        ...ruleForm,
        id: finalId,
        active: editingRule ? editingRule.active : true
      };

      await api.req("/api/iot/rules", {
        method: "POST",
        body: ruleToSave
      });

      fetchData();
    } catch (err: any) {
      console.error("Error saving rule:", err);
      alert(`Lỗi lưu kịch bản: ${err.message}`);
    }

    setShowRuleModal(false);
    setEditingRule(null);
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kịch bản ${id}?`)) return;
    try {
      await api.req(`/api/iot/rules/${id}`, {
        method: "DELETE"
      });
      fetchData();
    } catch (err: any) {
      console.error("Error deleting rule:", err);
      alert(`Lỗi xóa kịch bản: ${err.message}`);
    }
  };

  const handleExecuteRule = async (rule: AutomationRule) => {
    try {
      await api.req(`/api/iot/devices/${rule.actionDevice}/action`, {
        method: "POST",
        body: { action: rule.actionCommand }
      });
      fetchData();
      alert(`⚡ [TEST TRIGGER] Đã thực thi kịch bản "${rule.name}" thành công!\nHành động: Gửi lệnh ${rule.actionCommand} đến thiết bị ${rule.actionDevice}.`);
    } catch (err: any) {
      console.error("Error executing rule:", err);
      alert(`Lỗi thực thi kịch bản: ${err.message}`);
    }
  };

  const handleSimulateAttendance = async () => {
    setSimStatusMsg("Đang gửi gói tin mô phỏng từ ESP32-CAM...");
    try {
      const targetDev = devices.find(d => d.id === simDevice);
      const devApiKey = targetDev ? targetDev.api_key : "iot_secret_key_01";
      const res = await api.req("/api/iot/attendance", {
        method: "POST",
        headers: {
          "x-api-key": devApiKey
        },
        body: JSON.stringify({
          device_id: simDevice,
          employee_id: simEmpId,
          employee_name: simName,
          method: "face_id",
          confidence: parseFloat(simConfidence.toString()),
          snapshot_url:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        })
      });
      setSimStatusMsg(`✅ ${res.message}`);
      fetchData();
    } catch (err: any) {
      setSimStatusMsg(`❌ Lỗi: ${err.message}`);
    }
  };

  const handleSimulateTelemetry = async () => {
    setSimStatusMsg("Đang gửi telemetry từ trạm cảm biến môi trường...");
    try {
      const targetDev = devices.find(d => d.id === simTelemetryDevice);
      const devApiKey = targetDev ? targetDev.api_key : "iot_secret_key_02";
      const res = await api.req("/api/iot/telemetry", {
        method: "POST",
        headers: {
          "x-api-key": devApiKey
        },
        body: JSON.stringify({
          device_id: simTelemetryDevice,
          temperature: parseFloat(simTemp.toString()),
          humidity: parseFloat(simHumid.toString()),
          air_quality: 38,
          pressure: 1012.8,
          weather_condition: simWeather
        })
      });
      setSimStatusMsg(`✅ ${res.message}`);

      // If simulated temperature exceeds 35, dynamically trigger high temperature alarm
      if (simTemp > 35) {
        const hasServerAlarm = systemAlerts.some(a => a.id === "AL-SERVER-TEMP-HIGH");
        if (!hasServerAlarm) {
          setSystemAlerts(prev => [
            {
              id: "AL-SERVER-TEMP-HIGH",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: `Cảnh báo quá nhiệt mô phỏng (${simTemp}°C)`,
              location: targetDev ? targetDev.location : "Trạm Weather-01",
              severity: "critical",
              status: "active",
              details: `Telemetry nhận tín hiệu nhiệt độ vượt ngưỡng báo động.`
            },
            ...prev
          ]);
        }
      }
      fetchData();
    } catch (err: any) {
      setSimStatusMsg(`❌ Lỗi: ${err.message}`);
    }
  };

  const handleMuteAlert = async (id: string) => {
    try {
      await api.req(`/api/iot/alerts/${id}/mute`, {
        method: "POST"
      });
      fetchData();
    } catch (err: any) {
      console.error("Error muting alert:", err);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await api.req(`/api/iot/alerts/${id}/resolve`, {
        method: "POST"
      });
      fetchData();
    } catch (err: any) {
      console.error("Error resolving alert:", err);
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await api.req(`/api/iot/rules/${id}/toggle`, {
        method: "POST"
      });
      fetchData();
    } catch (err: any) {
      console.error("Error toggling rule:", err);
    }
  };

  const handleDeviceAction = async (deviceId: string, action: string) => {
    try {
      await api.req(`/api/iot/devices/${deviceId}/action`, {
        method: "POST",
        body: { action }
      });
      fetchData();
    } catch (err: any) {
      console.error("Error executing device action:", err);
    }
  };

  // Recharts Chart Mock Data representing past 24 hours
  const environmentTrendData = [
    { name: "10:00", temperature: 28.5, humidity: 65, AQI: 42, electricity: 78 },
    { name: "14:00", temperature: 31.2, humidity: 60, AQI: 48, electricity: 85 },
    { name: "18:00", temperature: 29.8, humidity: 62, AQI: 45, electricity: 80 },
    { name: "22:00", temperature: 27.5, humidity: 68, AQI: 39, electricity: 65 },
    { name: "02:00", temperature: 25.1, humidity: 74, AQI: 35, electricity: 52 },
    { name: "06:00", temperature: 24.3, humidity: 78, AQI: 32, electricity: 55 },
    { name: "10:00", temperature: weather?.temperature || 29.2, humidity: weather?.humidity || 65, AQI: weather?.air_quality || 38, electricity: 85 }
  ];

  // Donut chart distribution
  const deviceTypePieData = [
    { name: "Camera AI", value: 32, color: "#6366f1" },
    { name: "ESP32/Arduino", value: 45, color: "#10b981" },
    { name: "Cảm biến môi trường", value: 18, color: "#f59e0b" },
    { name: "RFID/Access Control", value: 16, color: "#ec4899" },
    { name: "Khác", value: 15, color: "#64748b" }
  ];

  const totalDevicesPie = deviceTypePieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-6 font-sans select-none">
      {/* Enterprise Title & Connectivity HUD Indicators */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Cpu className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Enterprise IoT Center
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">
                  ENTERPRISE EDITION
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Nền tảng Quản trị Thiết bị vật lý, Chấm công FaceID, Camera AI, Giám sát phòng máy chủ & Văn phòng thông minh
              </p>
            </div>
          </div>
        </div>

        {/* User Request: Red Box containing day of week and formatted date */}
        <div id="iot-date-red-box" className="border-2 border-red-500 bg-red-500/10 text-red-500 px-4 py-2.5 rounded-xl font-bold font-mono text-xs sm:text-sm shadow-md flex items-center gap-2 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
          <span>
            {(() => {
              const daysVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
              const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              const date = new Date();
              const dayName = language === 'vi' ? daysVi[date.getDay()] : daysEn[date.getDay()];
              const dd = String(date.getDate()).padStart(2, '0');
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              const yyyy = date.getFullYear();
              return `${dayName}, ${dd}/${mm}/${yyyy}`;
            })()}
          </span>
        </div>

        {/* Connectivity Status Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-mono font-bold select-none">
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850">
            <ServerStateIndicator online={true} />
            <span className="text-slate-400">GATEWAY:</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850">
            <ServerStateIndicator online={true} />
            <span className="text-slate-400">MQTT BROKER:</span>
            <span className="text-emerald-400">CONNECTED</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850">
            <ServerStateIndicator online={true} />
            <span className="text-slate-400">API:</span>
            <span className="text-emerald-400">NORMAL</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850">
            <ServerStateIndicator online={true} />
            <span className="text-slate-400">DB:</span>
            <span className="text-emerald-400">HEALTHY</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850">
            <ServerStateIndicator online={true} />
            <span className="text-slate-400">AI ENGINE:</span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Primary Dashboard Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-850 my-6 py-1 select-none scrollbar-none">
        <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard />} label="Dashboard" />
        <TabButton active={activeTab === "devices"} onClick={() => setActiveTab("devices")} icon={<HardDrive />} label={`Thiết bị (${devices.length})`} />
        <TabButton active={activeTab === "mcp"} onClick={() => setActiveTab("mcp")} icon={<Cpu />} label="MCP & ESP Controller" />
        <TabButton active={activeTab === "digital_twin"} onClick={() => setActiveTab("digital_twin")} icon={<Map />} label="Digital Twin Map" />
        <TabButton active={activeTab === "camera"} onClick={() => setActiveTab("camera")} icon={<Camera />} label="Camera AI Live" />
        <TabButton active={activeTab === "automation"} onClick={() => setActiveTab("automation")} icon={<Zap />} label="Automation Engine" />
        <TabButton active={activeTab === "firmware"} onClick={() => setActiveTab("firmware")} icon={<Code />} label="C++ Firmware" />
        <TabButton active={activeTab === "tester"} onClick={() => setActiveTab("tester")} icon={<Terminal />} label="Mô phỏng (API Sandbox)" />
      </div>

      {/* MAIN CONTAINER CONTENT VIEW */}
      <div className="space-y-6">
        {/* VIEW 1: ENTERPRISE DASHBOARD METRICS & FEED */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Six Key Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <MetricTile title="Thiết bị Online" value={devices.length + 123} subtitle="↑ 12% so với hôm qua" trendUp={true} colorClass="bg-indigo-500/10 text-indigo-400 border-indigo-500/20" icon={<Activity />} />
              <MetricTile title="Thiết bị Offline" value={3} subtitle="↓ 25% so với hôm qua" trendUp={false} colorClass="bg-rose-500/10 text-rose-400 border-rose-500/20" icon={<Power />} />
              <MetricTile title="Cảnh báo active" value={systemAlerts.filter(a => a.status === "active").length} subtitle="Xem chi tiết" isWarning={true} colorClass="bg-amber-500/10 text-amber-400 border-amber-500/20" icon={<AlertOctagon />} />
              <MetricTile title="Routines Auto" value={18} subtitle="Đang hoạt động" trendUp={true} colorClass="bg-teal-500/10 text-teal-400 border-teal-500/20" icon={<Zap />} />
              <MetricTile title="Người trong văn phòng" value={32} subtitle="Hiện tại" trendUp={true} colorClass="bg-sky-500/10 text-sky-400 border-sky-500/20" icon={<Users />} />
              <MetricTile title="Điện năng tiêu thụ" value="85%" subtitle="Hiệu suất tối ưu" trendUp={false} colorClass="bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" icon={<Cpu />} />
            </div>

            {/* Layout Grid: Charts & Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Multi-Series Recharts Line Graph */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">Biểu đồ Môi trường & Năng lượng</h3>
                    <p className="text-[11px] text-slate-400">Giám sát dao động nhiệt độ, độ ẩm và AQI qua IoT Gateways 24h</p>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-indigo-400 font-bold">24 GIỜ QUA</span>
                </div>

                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={environmentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorHumid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", color: "#e2e8f0" }} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                      <Area type="monotone" dataKey="temperature" name="Nhiệt độ (°C)" stroke="#ec4899" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTemp)" />
                      <Area type="monotone" dataKey="humidity" name="Độ ẩm (%)" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHumid)" />
                      <Line type="monotone" dataKey="AQI" name="AQI (Chỉ số không khí)" stroke="#10b981" strokeWidth={2} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Assistant Smart Insights */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">AI Insights (Phân tích Trí tuệ)</h3>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto max-h-[280px] scrollbar-none pr-1">
                  <InsightRow severity="danger" title="Phòng Server có hiện tượng tăng nhiệt" desc="Ghi nhận nhiệt độ tăng 3.2°C so với trung bình 24h. Hệ thống đã kích hoạt quạt thông gió 100%." />
                  <InsightRow severity="warning" title="Bảo trì dự đoán: RFID-01 yếu pin" desc="Pin của RFID-01 chỉ còn 15%. AI dự báo thiết bị sẽ ngưng hoạt động trong 4 ngày tới." />
                  <InsightRow severity="success" title="Không khí trong lành" desc="Chỉ số AQI đo được ổn định ở mức 38-42. Không gian làm việc an toàn, lưu thông không khí tốt." />
                  <InsightRow severity="info" title="UPS Hoạt động bình thường" desc="Điện áp lưới ổn định ở 220.5V. Hệ thống lưu điện phòng Server sẵn sàng." />
                </div>
              </div>
            </div>

            {/* Subgrid: Digital Twin & Live Events */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Sơ đồ Tòa nhà Digital Twin Component */}
              <div className="xl:col-span-2">
                <IotDigitalTwin devices={devices} onTriggerAction={handleDeviceAction} />
              </div>

              {/* Live Events Log */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-white text-base">Nhật ký Hoạt động Live</h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-850">TIME-SERIES</span>
                  </div>

                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
                    {attendanceEvents.length === 0 ? (
                      <p className="text-xs text-slate-500 py-10 text-center">Chưa ghi nhận hoạt động nào</p>
                    ) : (
                      attendanceEvents.map((evt, idx) => (
                        <div key={evt.id || idx} className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-850 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-500 text-[10px]">
                              {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                {evt.employee_name}
                                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-500/10 text-indigo-400 rounded">
                                  {evt.method === "face_id" ? "FaceID" : "RFID"}
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Quét tại {evt.device_id}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400">Match {evt.confidence}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Alarm Center List & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Alarms Alerts Panel */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                    <h3 className="font-bold text-white text-base">Trung tâm Cảnh báo & Khắc phục Sự cố</h3>
                  </div>
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full font-bold">
                    {systemAlerts.filter(a => a.status === "active").length} ACTIVE
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {systemAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${
                        alert.status === "resolved"
                          ? "bg-slate-950/40 border-slate-850 opacity-60"
                          : alert.severity === "critical"
                          ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
                          : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            alert.status === "resolved"
                              ? "bg-slate-600"
                              : alert.severity === "critical"
                              ? "bg-rose-500 animate-pulse"
                              : "bg-amber-500"
                          }`} />
                          <h4 className="font-bold text-white text-sm tracking-tight">{alert.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{alert.details}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1.5">
                          <span>📍 {alert.location}</span>
                          <span>•</span>
                          <span>🕒 {alert.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {alert.status === "active" && (
                          <>
                            <button
                              onClick={() => handleMuteAlert(alert.id)}
                              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-lg text-[10px] font-bold border border-slate-800 transition"
                            >
                              Tắt chuông
                            </button>
                            <button
                              onClick={() => handleResolveAlert(alert.id)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold shadow transition"
                            >
                              Đã xử lý
                            </button>
                          </>
                        )}
                        {alert.status === "muted" && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow transition"
                          >
                            Đã xử lý
                          </button>
                        )}
                        {alert.status === "resolved" && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/20">
                            ✓ RESOLVED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Devices Distribution Donut Chart */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
                <div className="border-b border-slate-800 pb-3 mb-4">
                  <h3 className="font-bold text-white text-base">Cơ cấu Thiết bị kết nối</h3>
                  <p className="text-[11px] text-slate-400">Tỷ lệ phân loại các mốc phần cứng trong mạng nội bộ ERP</p>
                </div>

                <div className="h-[180px] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceTypePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {deviceTypePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} thiết bị`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-white">{totalDevicesPie}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Tổng mốc</span>
                  </div>
                </div>

                {/* Custom list description */}
                <div className="space-y-2 mt-4 text-[11px]">
                  {deviceTypePieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{item.value} ({Math.round((item.value/totalDevicesPie)*100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Hardware System Health indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">CPU Gateway (Pi 5)</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "32%" }} />
                  </div>
                  <span className="text-xs font-bold font-mono text-white select-none">32%</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Dung lượng RAM</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "48%" }} />
                  </div>
                  <span className="text-xs font-bold font-mono text-white select-none">48%</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Truyền tải MQTT</span>
                <div className="flex items-center gap-2 font-mono text-xs text-white">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>1,250 msgs/s</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Thời gian chạy liên tục (Uptime)</span>
                <p className="font-mono text-xs text-white flex items-center gap-1.5 font-bold">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
                  12 ngày, 4 giờ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DEVICE INVENTORY TABLE */}
        {activeTab === "devices" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-white text-lg">Danh sách Thiết bị Hardware Connected</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đăng ký, giám sát và cấu hình bảo mật cho toàn bộ thiết bị đầu cuối Arduino, ESP32, RFID và Camera AI.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                <Plus className="w-4 h-4" /> Đăng ký thiết bị mới
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 select-none">
                  <tr>
                    <th className="py-4.5 px-4">Mã Thiết bị</th>
                    <th className="py-4.5 px-4">Tên Thiết bị</th>
                    <th className="py-4.5 px-4">Loại Phần cứng</th>
                    <th className="py-4.5 px-4">IP / MAC Address</th>
                    <th className="py-4.5 px-4">Mốc vị trí</th>
                    <th className="py-4.5 px-4 text-center">Trạng thái</th>
                    <th className="py-4.5 px-4">Hoạt động cuối</th>
                    <th className="py-4.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {devices.map((dev) => (
                    <tr key={dev.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-400">{dev.id}</td>
                      <td className="py-4 px-4 font-bold text-white">{dev.name}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md font-mono text-[10px] border border-slate-800">
                          {dev.device_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <div>{dev.ip_address || "192.168.1.X"}</div>
                        <div className="text-[10px] text-slate-500">{dev.mac_address}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{dev.location}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-mono">
                        {new Date(dev.last_seen).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 px-1">
                          <button
                            onClick={() => handleStartEditDevice(dev)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                            title="Chỉnh sửa thiết bị"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRule(null);
                              setRuleForm({
                                id: `R-0${automationRules.length + 1}`,
                                name: `Kịch bản tự động cho ${dev.name}`,
                                triggerDevice: dev.id,
                                triggerParam: dev.device_type === "esp32_cam" ? "occupancy" : "temperature",
                                operator: "=",
                                triggerValue: "1",
                                actionDevice: "DEV-AC-LOBBY",
                                actionCommand: "ACTIVATE"
                              });
                              setShowRuleModal(true);
                              setActiveTab("automation");
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                            title="Tạo kịch bản nhanh"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDevice(dev.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: DEVICE INVENTORY TABLE */}
        {activeTab === "devices" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-white text-lg">Danh sách Thiết bị Hardware Connected</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đăng ký, giám sát và cấu hình bảo mật cho toàn bộ thiết bị đầu cuối Arduino, ESP32, RFID và Camera AI.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                <Plus className="w-4 h-4" /> Đăng ký thiết bị mới
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 select-none">
                  <tr>
                    <th className="py-4.5 px-4">Mã Thiết bị</th>
                    <th className="py-4.5 px-4">Tên Thiết bị</th>
                    <th className="py-4.5 px-4">Loại Phần cứng</th>
                    <th className="py-4.5 px-4">IP / MAC Address</th>
                    <th className="py-4.5 px-4">Mốc vị trí</th>
                    <th className="py-4.5 px-4 text-center">Trạng thái</th>
                    <th className="py-4.5 px-4">Hoạt động cuối</th>
                    <th className="py-4.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {devices.map((dev) => (
                    <tr key={dev.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-400">{dev.id}</td>
                      <td className="py-4 px-4 font-bold text-white">{dev.name}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-slate-950 text-slate-400 rounded-md font-mono text-[10px] border border-slate-800">
                          {dev.device_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <div>{dev.ip_address || "192.168.1.X"}</div>
                        <div className="text-[10px] text-slate-500">{dev.mac_address}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{dev.location}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-mono">
                        {new Date(dev.last_seen).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 px-1">
                          <button
                            onClick={() => handleStartEditDevice(dev)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                            title="Chỉnh sửa thiết bị"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRule(null);
                              setRuleForm({
                                id: `R-0${automationRules.length + 1}`,
                                name: `Kịch bản tự động cho ${dev.name}`,
                                triggerDevice: dev.id,
                                triggerParam: dev.device_type === "esp32_cam" ? "occupancy" : "temperature",
                                operator: "=",
                                triggerValue: "1",
                                actionDevice: "DEV-AC-LOBBY",
                                actionCommand: "ACTIVATE"
                              });
                              setShowRuleModal(true);
                              setActiveTab("automation");
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                            title="Tạo kịch bản nhanh"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDevice(dev.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Xóa thiết bị"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: MCP SERVER & ESP DEVICE MANAGEMENT */}
        {activeTab === "mcp" && (
          <div className="space-y-6">
            {/* Header info about MCP integration */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                    Model Context Protocol (MCP) Integrated
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-mono font-bold">MCP SERVER: RUNNING</span>
                </div>
                <h3 className="font-bold text-white text-lg mt-1">Hệ thống IoT Agent - Quản lý Thiết bị ESP</h3>
                <p className="text-xs text-slate-400 mt-1">
                  MCP hoạt động như lớp trung gian bảo mật giữa AI Agent và phần cứng. Mọi thao tác đều được kiểm tra quyền thực tế (VIEW, CONTROL, CONFIG, ADMIN) và ghi Audit Log.
                </p>
              </div>
            </div>

            {/* Split layout: Interactive Hardware & MCP Tools Playground */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (8 cols): ESP Hardware & Pins */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Interactive Pinout Board */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Cpu className="w-4.5 h-4.5 text-indigo-400" /> Sơ đồ GPIO & Relay Switcher (ESP PCB)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Mô phỏng chân vật lý và trạng thái Relay thời gian thực</p>
                    </div>
                    
                    <select
                      value={selectedMcpDevice}
                      onChange={(e) => setSelectedMcpDevice(e.target.value)}
                      className="p-2 bg-slate-950 border border-slate-800 text-xs font-semibold rounded-xl text-indigo-400 focus:border-indigo-500 focus:outline-none shrink-0"
                    >
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* PCB Graphical Layout */}
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* PCB Grid decoration lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                    
                    <div className="w-full max-w-lg bg-emerald-950/40 border-2 border-emerald-500/30 rounded-xl p-5 z-10 relative">
                      {/* Silicon Chip branding */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-[9px] font-bold">
                          ESP32-S3 CORE
                        </div>
                        <div className="text-right text-[9px] font-mono font-bold text-emerald-400 tracking-wider">
                          PCB v2.4a • POWER ON
                        </div>
                      </div>

                      {/* Pins Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {gpioConfigList.length === 0 ? (
                          <div className="col-span-full text-center py-6 text-xs text-slate-500 font-mono">
                            Chưa cấu hình chân GPIO nào cho thiết bị. Hãy đăng ký GPIO bên dưới!
                          </div>
                        ) : (
                          gpioConfigList.map((gpio) => {
                            const isRelay = gpio.type === "RELAY";
                            const isInput = gpio.mode === "INPUT";
                            const stateOn = gpio.state === "ON" || gpio.state === "HIGH";
                            
                            return (
                              <div
                                key={gpio.id || gpio.pin}
                                className={`p-3 rounded-xl border flex flex-col justify-between h-28 relative group transition-all ${
                                  stateOn
                                    ? "bg-indigo-950/20 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                                    : "bg-slate-900/60 border-slate-800"
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 bg-slate-950 rounded text-slate-400">
                                      G{gpio.pin}
                                    </span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${stateOn ? "bg-indigo-500 animate-pulse" : "bg-slate-600"}`} />
                                  </div>
                                  <p className="text-[11px] font-bold text-white mt-2 truncate">{gpio.name}</p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{gpio.mode} • {gpio.type}</p>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                    stateOn ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-950 text-slate-500"
                                  }`}>
                                    {gpio.state || "OFF"}
                                  </span>

                                  {isRelay && (
                                    <button
                                      onClick={async () => {
                                        const nextState = stateOn ? "OFF" : "ON";
                                        try {
                                          const res = await api.req("/api/iot/mcp/execute", {
                                            method: "POST",
                                            body: JSON.stringify({
                                              toolName: "set_relay",
                                              args: {
                                                device_id: selectedMcpDevice,
                                                pin: gpio.pin,
                                                state: nextState
                                              }
                                            })
                                          });
                                          if (res.success) {
                                            fetchGpioConfig(selectedMcpDevice);
                                          } else {
                                            alert(`Lỗi: ${res.message || res.error}`);
                                          }
                                        } catch (e: any) {
                                          alert(`Lỗi thực thi: ${e.message}`);
                                        }
                                      }}
                                      className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-colors border ${
                                        stateOn
                                          ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
                                          : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                                      }`}
                                    >
                                      {stateOn ? "TẮT" : "BẬT"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Configure GPIO Form */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                  <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Settings className="w-4.5 h-4.5 text-emerald-400" /> Cài đặt & Phân cấu hình chân GPIO cho ESP
                  </h4>
                  
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!selectedMcpDevice) return;
                      try {
                        const res = await api.req("/api/iot/mcp/execute", {
                          method: "POST",
                          body: JSON.stringify({
                            toolName: "configure_gpio",
                            args: {
                              device_id: selectedMcpDevice,
                              pin: gpioForm.pin,
                              type: gpioForm.type,
                              name: gpioForm.name,
                              mode: gpioForm.mode
                            }
                          })
                        });
                        if (res.success) {
                          alert(`✅ Đã cấu hình chân G${gpioForm.pin} thành công!`);
                          fetchGpioConfig(selectedMcpDevice);
                        } else {
                          alert(`Lỗi: ${res.message || res.error}`);
                        }
                      } catch (err: any) {
                        alert(`Lỗi: ${err.message}`);
                      }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs"
                  >
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Mã chân Pin (GPIO)</label>
                      <input
                        type="text"
                        value={gpioForm.pin}
                        onChange={(e) => setGpioForm({ ...gpioForm, pin: e.target.value })}
                        placeholder="Ví dụ: 2, 4, 12"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Tên nhãn chân</label>
                      <input
                        type="text"
                        value={gpioForm.name}
                        onChange={(e) => setGpioForm({ ...gpioForm, name: e.target.value })}
                        placeholder="Ví dụ: Đèn phòng họp"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Chế độ Mode</label>
                      <select
                        value={gpioForm.mode}
                        onChange={(e) => setGpioForm({ ...gpioForm, mode: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs"
                      >
                        <option value="OUTPUT">OUTPUT (Điều khiển/Relay)</option>
                        <option value="INPUT">INPUT (Cảm biến/Nút bấm)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Loại cảm biến / tải</label>
                      <select
                        value={gpioForm.type}
                        onChange={(e) => setGpioForm({ ...gpioForm, type: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs"
                      >
                        <option value="RELAY">RELAY (Rơ le đóng ngắt)</option>
                        <option value="SENSOR">SENSOR (Cảm biến nhiệt độ dht)</option>
                        <option value="RFID">RFID (Mở cửa thẻ từ)</option>
                        <option value="LED">LED INDICATOR</option>
                      </select>
                    </div>
                    
                    <div className="sm:col-span-4 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                      >
                        Áp dụng & Ghi đè GPIO
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column (5 cols): MCP Playground & Exec */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 3. MCP Tool Playground */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Terminal className="w-4.5 h-4.5 text-indigo-400" /> MCP Playgrounds (Tool Runner)
                    </h4>
                    
                    {/* Fault injection simulation */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Giả lập lỗi kết nối:</span>
                      <button
                        onClick={() => setSimulateMcpFault(!simulateMcpFault)}
                        className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center p-0.5 focus:outline-none ${
                          simulateMcpFault ? "bg-rose-600 justify-end" : "bg-slate-850 justify-start"
                        }`}
                        title="Simulate Timeout Error to test Fault Tolerance"
                      >
                        <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md block" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Chọn Công cụ MCP (MCP Tools)</label>
                      <select
                        value={selectedMcpTool}
                        onChange={(e) => setSelectedMcpTool(e.target.value)}
                        className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl font-bold font-mono focus:border-indigo-500 focus:outline-none text-indigo-400"
                      >
                        {mcpToolsList.map((t) => (
                          <option key={t.name} value={t.name} className="font-mono bg-slate-900">
                            [{t.category}] {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Show selected tool meta */}
                    {(() => {
                      const matched = mcpToolsList.find(t => t.name === selectedMcpTool);
                      if (!matched) return null;
                      return (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                          <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                            {matched.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[10px] font-mono">
                            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md">
                              Quyền: {matched.requiredPermission}
                            </span>
                            {matched.dangerous && (
                              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/25 rounded-md font-bold flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> NGUY HIỂM / YÊU CẦU CONFIRMED
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Raw JSON Input */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Đối số JSON Payload (Arguments)</label>
                      <textarea
                        rows={6}
                        value={mcpToolArgs}
                        onChange={(e) => setMcpToolArgs(e.target.value)}
                        className="w-full p-3 bg-slate-950 border border-slate-800 text-white font-mono rounded-xl focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <button
                      onClick={handleExecuteMcpToolPlayground}
                      disabled={mcpExecuting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {mcpExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang thực thi lệnh...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white/10" />
                          Thực thi MCP Tool qua API
                        </>
                      )}
                    </button>

                    {/* Execution JSON Result Block */}
                    {mcpToolResult && (
                      <div className="space-y-1.5">
                        <label className="block text-slate-400 font-semibold">Kết quả phản hồi (Response Payload)</label>
                        <div className={`p-4 rounded-xl border font-mono text-[10px] overflow-x-auto leading-relaxed max-h-[220px] ${
                          mcpToolResult.success ? "bg-emerald-950/15 border-emerald-500/25 text-emerald-400" : "bg-rose-950/15 border-rose-500/25 text-rose-400"
                        }`}>
                          <pre className="text-left">{JSON.stringify(mcpToolResult, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Permissions Grid & Real-time Audit Logs */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Permissions matrix (4 cols) */}
              <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                    <ShieldAlert className="w-4.5 h-4.5 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">Bảng Phân Quyền MCP Tool Quyền Thực Tế</h3>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {mcpPermissions.map((perm) => (
                      <div key={perm.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-indigo-400 uppercase">{perm.role}</span>
                          <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-[9px] font-mono rounded text-slate-400">
                            {perm.permission_level}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{perm.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time audit logs (8 cols) */}
              <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4.5 h-4.5 text-indigo-400" />
                      <h3 className="font-bold text-white text-sm">Nhật ký Audit Log Thực Thi Thiết bị & MCP</h3>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      Cơ chế bảo mật cao
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-850">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="bg-slate-950 font-extrabold text-[9px] text-slate-500 uppercase tracking-widest border-b border-slate-850">
                        <tr>
                          <th className="py-2.5 px-3">Thời gian</th>
                          <th className="py-2.5 px-3">Tài khoản</th>
                          <th className="py-2.5 px-3">Công cụ</th>
                          <th className="py-2.5 px-3">Quyền</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-950/40">
                        {mcpAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-xs">
                              Chưa ghi nhận hoạt động thực thi nào.
                            </td>
                          </tr>
                        ) : (
                          mcpAuditLogs.slice(0, 10).map((log) => (
                            <tr key={log.id} className="hover:bg-slate-850/30 transition font-mono">
                              <td className="py-2 px-3 text-[10px] text-slate-400">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td className="py-2 px-3 text-[10px] text-white">
                                <div className="font-semibold text-[11px] text-slate-300">{log.user_email}</div>
                                <div className="text-[9px] text-indigo-400 uppercase font-extrabold">{log.user_role}</div>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-200 text-[10px]">{log.action}</td>
                              <td className="py-2 px-3">
                                <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] text-slate-400 rounded">
                                  {log.required_permission}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                  log.status === "SUCCESS"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DIGITAL TWIN INTERACTIVE OFFICE MAP */}
        {activeTab === "digital_twin" && (
          <div className="h-[500px]">
            <IotDigitalTwin devices={devices} onTriggerAction={handleDeviceAction} />
          </div>
        )}

        {/* VIEW 4: LIVE AI CAMERA VIEWER & FACEPLUGIN SDK CONTROLLERS */}
        {activeTab === "camera" && (
          <div className="space-y-6">
            {/* SDK Header Info */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold rounded-md">
                    SDK INTEGRATED
                  </span>
                  <h3 className="font-bold text-white text-base">Faceplugin Face Recognition Platform</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Hệ thống tích hợp Open-Source Face Recognition SDK từ Faceplugin-ltd hỗ trợ Nhận diện, Đối sánh 1:N và Phát hiện giả mạo (Liveness Detection).
                </p>
                <a
                  href="https://github.com/Faceplugin-ltd/Open-Source-Face-Recognition-SDK"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 mt-1 underline"
                >
                  <Link2 className="w-3.5 h-3.5" /> View SDK on GitHub
                </a>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFaceEnrollOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Đăng ký FaceID mới
                </button>
              </div>
            </div>

            {/* Main Dual Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left Side: Live AI Camera */}
              <div className="xl:col-span-6 bg-slate-950 p-1.5 rounded-2xl border border-slate-850">
                <IotCameraAI
                  onFaceMatched={(name, score) => {
                    // Prepend new scan log automatically
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isNew = !sdkLogs.some(l => l.name === name && l.time === timeStr);
                    if (isNew) {
                      setSdkLogs(prev => [
                        {
                          id: `L-${Math.floor(Math.random() * 1000)}`,
                          time: timeStr,
                          name,
                          location: "Live Camera Stream",
                          match: score,
                          liveness: Math.floor(Math.random() * 15) + 85,
                          status: "PASS"
                        },
                        ...prev.slice(0, 5)
                      ]);
                    }
                  }}
                />
                
                {/* SDK Live Logs */}
                <div className="p-4 bg-slate-900 border-t border-slate-850 rounded-b-xl">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Nhật ký quét khuôn mặt thời gian thực
                  </h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {sdkLogs.map((log) => (
                      <div key={log.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-semibold text-white">{log.name}</span>
                          <span className="text-slate-500 text-[10px]">({log.time})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                            Khớp: {log.match}%
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                            Liveness: {log.liveness}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Faceplugin SDK Configuration & Code Playground */}
              <div className="xl:col-span-6 space-y-6">
                {/* SDK Parameters & Thresholds */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-400" /> Cấu hình tham số Faceplugin SDK
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      Latency: ~42ms
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Parameter 1: Min Face Size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
                        <span>Kích thước khuôn mặt tối thiểu (Min Face Size)</span>
                        <span className="font-mono text-indigo-400">{sdkMinFaceSize} px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="120"
                        value={sdkMinFaceSize}
                        onChange={(e) => setSdkMinFaceSize(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <p className="text-[10px] text-slate-500">Kích thước pixel tối thiểu để SDK thực hiện trích xuất và nhận dạng.</p>
                    </div>

                    {/* Parameter 2: Confidence Threshold */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
                        <span>Ngưỡng tin cậy đối sánh (Verification Threshold)</span>
                        <span className="font-mono text-indigo-400">{sdkConfidenceThreshold}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="98"
                        value={sdkConfidenceThreshold}
                        onChange={(e) => setSdkConfidenceThreshold(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <p className="text-[10px] text-slate-500">Ngưỡng chính xác cần đạt để xác nhận danh tính thành công (FAR &lt; 0.001%).</p>
                    </div>

                    {/* Parameter 3: Liveness Threshold */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-slate-300 font-semibold">
                        <span>Ngưỡng chống giả mạo (Liveness Threshold)</span>
                        <span className="font-mono text-indigo-400">{sdkLivenessThreshold}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="95"
                        value={sdkLivenessThreshold}
                        onChange={(e) => setSdkLivenessThreshold(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <p className="text-[10px] text-slate-500">Ngưỡng phát hiện ảnh chụp, video giả mạo để vượt qua chấm công FaceID.</p>
                    </div>
                  </div>
                </div>

                {/* Enrolled Face Profiles Grid */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                  <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> Cơ sở dữ liệu khuôn mặt đã đăng ký ({enrolledFaces.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {enrolledFaces.map((face) => (
                      <div key={face.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col items-center text-center space-y-2 relative group">
                        <img
                          src={face.avatar}
                          alt={face.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-800 group-hover:border-indigo-500 transition-colors"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-white truncate w-32">{face.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate w-32">{face.role}</p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full font-bold">
                          {face.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API & Code Playground for SDK Integration */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Code className="w-4 h-4 text-indigo-400" /> Faceplugin SDK Code Playground
                    </h4>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
                      {(["wasm", "cpp", "python", "kotlin"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSdkPlaygroundLang(lang)}
                          className={`px-2 py-1 rounded transition uppercase ${
                            sdkPlaygroundLang === lang ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {lang === "kotlin" ? "Android" : lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Block Container */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-300 leading-relaxed overflow-x-auto relative group">
                    <button
                      onClick={() => {
                        let textToCopy = "";
                        if (sdkPlaygroundLang === "wasm") {
                          textToCopy = `import { FacePluginSDK } from "@faceplugin/face-sdk";\n\nconst sdk = new FacePluginSDK();\nawait sdk.loadModel("/models");\n\nconst results = await sdk.detectFaces(videoElement);\nresults.forEach(face => {\n  const liveness = sdk.checkLiveness(face);\n  if (liveness > ${sdkLivenessThreshold}) {\n    const match = sdk.compare(face, enrolledFace);\n    if (match > ${sdkConfidenceThreshold}) {\n      console.log("Face verified successfully!");\n    }\n  }\n});`;
                        } else if (sdkPlaygroundLang === "cpp") {
                          textToCopy = `#include "FacePlugin.h"\n\nFacePlugin::SDK sdk;\nsdk.Init("/path/to/models", "YOUR_LICENSE_KEY_HERE");\nsdk.SetMinFaceSize(${sdkMinFaceSize});\n\nstd::vector<FaceInfo> faces;\nsdk.Detect(image_data, width, height, faces);\nfor (const auto& face : faces) {\n    FaceTemplate descriptor;\n    sdk.ExtractFeature(image_data, width, height, face, descriptor);\n    float score = sdk.Compare(descriptor, enrolled_descriptor);\n    if (score > ${sdkConfidenceThreshold} / 100.0f) {\n        std::cout << "Match successfully!" << std::endl;\n    }\n}`;
                        } else if (sdkPlaygroundLang === "python") {
                          textToCopy = `import face_plugin_sdk\n\nsdk = face_plugin_sdk.FaceSDK()\nsdk.initialize(model_path="./models", license_key="KEY")\nsdk.set_parameter("min_face_size", ${sdkMinFaceSize})\n\nfaces = sdk.detect_faces(image_data)\nfor face in faces:\n    liveness = sdk.check_liveness(image_data, face)\n    if liveness > ${sdkLivenessThreshold} / 100:\n        score = sdk.compare_features(face.feature, enrolled_feature)\n        if score > ${sdkConfidenceThreshold} / 100:\n            print("Face ID identified!")`;
                        } else if (sdkPlaygroundLang === "kotlin") {
                          textToCopy = `import com.faceplugin.sdk.FaceEngine\n\nval engine = FaceEngine(context)\nengine.init(modelPath = "/assets/models")\nengine.setMinFaceSize(${sdkMinFaceSize})\n\nval detectedFaces = engine.detectFaces(bitmap)\nfor (face in detectedFaces) {\n    val score = engine.matchFaces(face.descriptor, savedDescriptor)\n    if (score > ${sdkConfidenceThreshold}f) {\n        // Unlocked and triggered Relay\n    }\n}`;
                        }
                        navigator.clipboard.writeText(textToCopy);
                        alert("Copied successfully!");
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition shadow-md opacity-0 group-hover:opacity-100"
                      title="Copy code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {sdkPlaygroundLang === "wasm" && (
                      <pre className="text-left">
                        <span className="text-indigo-400">import</span> {"{"} FacePluginSDK {"}"} <span className="text-indigo-400">from</span> <span className="text-emerald-400">"@faceplugin/face-sdk"</span>;{"\n\n"}
                        <span className="text-indigo-400">const</span> sdk = <span className="text-indigo-400">new</span> <span className="text-sky-400">FacePluginSDK</span>();{"\n"}
                        <span className="text-indigo-400">await</span> sdk.loadModel(<span className="text-emerald-400">"/models"</span>);{"\n\n"}
                        <span className="text-indigo-400">const</span> results = <span className="text-indigo-400">await</span> sdk.detectFaces(videoElement);{"\n"}
                        results.forEach(face =&gt; {"\n"}
                        {"  "}<span className="text-indigo-400">const</span> liveness = sdk.checkLiveness(face);{"\n"}
                        {"  "}<span className="text-indigo-400">if</span> (liveness &gt; <span className="text-amber-400">{sdkLivenessThreshold}</span>) {"{"}{"\n"}
                        {"    "}<span className="text-indigo-400">const</span> match = sdk.compare(face, enrolledFace);{"\n"}
                        {"    "}<span className="text-indigo-400">if</span> (match &gt; <span className="text-amber-400">{sdkConfidenceThreshold}</span>) {"{"}{"\n"}
                        {"      "}console.log(<span className="text-emerald-400">"Face verified successfully!"</span>);{"\n"}
                        {"    "}{"}"}{"\n"}
                        {"  "}{"}"}{"\n"}
                        {"}"});
                      </pre>
                    )}

                    {sdkPlaygroundLang === "cpp" && (
                      <pre className="text-left">
                        <span className="text-rose-400">#include</span> <span className="text-emerald-400">"FacePlugin.h"</span>{"\n\n"}
                        FacePlugin::SDK sdk;{"\n"}
                        sdk.Init(<span className="text-emerald-400">"/path/to/models"</span>, <span className="text-emerald-400">"YOUR_LICENSE_KEY"</span>);{"\n"}
                        sdk.SetMinFaceSize(<span className="text-amber-400">{sdkMinFaceSize}</span>);{"\n\n"}
                        std::vector&lt;FaceInfo&gt; faces;{"\n"}
                        sdk.Detect(image_data, width, height, faces);{"\n"}
                        <span className="text-indigo-400">for</span> (<span className="text-indigo-400">const auto</span>&amp; face : faces) {"{"}{"\n"}
                        {"    "}FaceTemplate descriptor;{"\n"}
                        {"    "}sdk.ExtractFeature(image_data, width, height, face, descriptor);{"\n"}
                        {"    "}<span className="text-indigo-400">float</span> score = sdk.Compare(descriptor, enrolled_descriptor);{"\n"}
                        {"    "}<span className="text-indigo-400">if</span> (score &gt; <span className="text-amber-400">{sdkConfidenceThreshold}</span> / 100.0f) {"{"}{"\n"}
                        {"        "}std::cout &lt;&lt; <span className="text-emerald-400">"Match successfully!"</span> &lt;&lt; std::endl;{"\n"}
                        {"    "}{"}"}{"\n"}
                        {"}"}
                      </pre>
                    )}

                    {sdkPlaygroundLang === "python" && (
                      <pre className="text-left">
                        <span className="text-indigo-400">import</span> face_plugin_sdk{"\n\n"}
                        sdk = face_plugin_sdk.FaceSDK(){"\n"}
                        sdk.initialize(model_path=<span className="text-emerald-400">"./models"</span>, license_key=<span className="text-emerald-400">"KEY"</span>){"\n"}
                        sdk.set_parameter(<span className="text-emerald-400">"min_face_size"</span>, <span className="text-amber-400">{sdkMinFaceSize}</span>){"\n\n"}
                        faces = sdk.detect_faces(image_data){"\n"}
                        <span className="text-indigo-400">for</span> face <span className="text-indigo-400">in</span> faces:{"\n"}
                        {"    "}liveness = sdk.check_liveness(image_data, face){"\n"}
                        {"    "}<span className="text-indigo-400">if</span> liveness &gt; <span className="text-amber-400">{sdkLivenessThreshold}</span> / 100:{"\n"}
                        {"        "}score = sdk.compare_features(face.feature, enrolled_feature){"\n"}
                        {"        "}<span className="text-indigo-400">if</span> score &gt; <span className="text-amber-400">{sdkConfidenceThreshold}</span> / 100:{"\n"}
                        {"            "}print(<span className="text-emerald-400">"Face ID identified!"</span>)
                      </pre>
                    )}

                    {sdkPlaygroundLang === "kotlin" && (
                      <pre className="text-left">
                        <span className="text-indigo-400">import</span> com.faceplugin.sdk.FaceEngine{"\n\n"}
                        <span className="text-indigo-400">val</span> engine = FaceEngine(context){"\n"}
                        engine.init(modelPath = <span className="text-emerald-400">"/assets/models"</span>){"\n"}
                        engine.setMinFaceSize(<span className="text-amber-400">{sdkMinFaceSize}</span>){"\n\n"}
                        <span className="text-indigo-400">val</span> detectedFaces = engine.detectFaces(bitmap){"\n"}
                        <span className="text-indigo-400">for</span> (face <span className="text-indigo-400">in</span> detectedFaces) {"{"}{"\n"}
                        {"    "}<span className="text-indigo-400">val</span> score = engine.matchFaces(face.descriptor, savedDescriptor){"\n"}
                        {"    "}<span className="text-indigo-400">if</span> (score &gt; <span className="text-amber-400">{sdkConfidenceThreshold}</span>f) {"{"}{"\n"}
                        {"        "}<span className="text-slate-500">// Unlocked and triggered Relay</span>{"\n"}
                        {"    "}{"}"}{"\n"}
                        {"}"}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Enroll FaceID */}
            {isFaceEnrollOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-indigo-400" /> Đăng ký FaceID (Enroll Profile)
                    </h3>
                    <button
                      onClick={() => setIsFaceEnrollOpen(false)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!faceEnrollForm.name || !faceEnrollForm.role) return;
                      const newFace = {
                        id: enrolledFaces.length + 1,
                        name: faceEnrollForm.name,
                        role: faceEnrollForm.role,
                        confidence: 95.0 + Math.random() * 4,
                        avatar: faceEnrollForm.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                        status: "Active"
                      };
                      setEnrolledFaces(prev => [...prev, newFace]);
                      
                      // Prepend scan history
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      setSdkLogs(prev => [
                        {
                          id: `L-${Math.floor(Math.random() * 1000)}`,
                          time: timeStr,
                          name: faceEnrollForm.name,
                          location: "Cổng Chính (Lễ tân Tầng 1)",
                          match: Number(newFace.confidence.toFixed(1)),
                          liveness: 95,
                          status: "PASS"
                        },
                        ...prev
                      ]);

                      setIsFaceEnrollOpen(false);
                      setFaceEnrollForm({ name: "", role: "", avatarUrl: "" });
                      alert("Đăng ký thành công và đồng bộ hóa khuôn mặt vào hệ thống camera!");
                    }}
                    className="space-y-4 text-left"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-semibold">Họ và tên nhân sự / khách hàng</label>
                      <input
                        type="text"
                        required
                        value={faceEnrollForm.name}
                        onChange={(e) => setFaceEnrollForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ví dụ: Nguyễn Văn C"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-semibold">Chức vụ / Nhóm phân quyền</label>
                      <input
                        type="text"
                        required
                        value={faceEnrollForm.role}
                        onChange={(e) => setFaceEnrollForm(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="Ví dụ: Trợ lý Luật sư / Đối tác VIP"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-semibold">URL Ảnh chân dung (tùy chọn)</label>
                      <input
                        type="url"
                        value={faceEnrollForm.avatarUrl}
                        onChange={(e) => setFaceEnrollForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsFaceEnrollOpen(false)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
                      >
                        Đồng bộ & Lưu
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: AUTOMATION WORKFLOWS */}
        {activeTab === "automation" && (
          <div className="space-y-6">
            {/* Rule builder alert */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Động cơ Luật & Kịch bản tự động (If-Then Rules)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Xây dựng kịch bản tự động hóa văn phòng không dây bằng giao diện trực quan, liên kết dữ liệu cảm biến với role hành động vật lý.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddRuleModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
                >
                  <Plus className="w-4 h-4" /> Thêm kịch bản mới
                </button>
              </div>

              {/* Automation list */}
              <div className="space-y-4">
                {automationRules.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Chưa có kịch bản tự động nào được thiết lập. Hãy thêm kịch bản mới!
                  </div>
                ) : (
                  automationRules.map((rule) => (
                    <div key={rule.id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold">{rule.id}</span>
                          <h4 className="font-bold text-white text-sm">{rule.name}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="text-indigo-400 font-semibold">IF</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800">{rule.triggerDevice}</span>
                          <span>({rule.triggerParam})</span>
                          <span className="text-indigo-400 font-bold">{rule.operator}</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800">{rule.triggerValue}</span>
                          <span className="text-indigo-400 font-semibold">THEN</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800">{rule.actionDevice}</span>
                          <span className="text-emerald-400 font-bold">({rule.actionCommand})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {/* Simulate rule trigger */}
                        <button
                          onClick={() => handleExecuteRule(rule)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                          title="Chạy thử nghiệm kịch bản"
                        >
                          <Play className="w-4 h-4 fill-emerald-500/20" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleStartEditRule(rule)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                          title="Chỉnh sửa kịch bản"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicateRule(rule)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                          title="Sao chép kịch bản"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Xóa kịch bản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="h-5 w-[1px] bg-slate-800 mx-1.5" />

                        <span className={`text-[10px] font-bold ${rule.active ? "text-emerald-400" : "text-slate-500"}`}>
                          {rule.active ? "ĐANG BẬT" : "ĐÃ TẮT"}
                        </span>
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 focus:outline-none ${
                            rule.active ? "bg-indigo-600 justify-end" : "bg-slate-800 justify-start"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: C++ HARDWARE FIRMWARE */}
        {activeTab === "firmware" && (
          <div className="h-[600px]">
            <IotCodeGenerator />
          </div>
        )}

        {/* VIEW 7: API SIMULATOR TESTING TOOL */}
        {activeTab === "tester" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
            {/* Simulation Attendance Packet Form */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-850 pb-3">
                <Camera className="w-5 h-5" />
                <h4>Mô phỏng Quét FaceID / RFID (POST Packet)</h4>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Mã nguồn thiết bị phát tín hiệu</label>
                  <select
                    value={simDevice}
                    onChange={(e) => setSimDevice(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono focus:border-indigo-500 focus:outline-none"
                  >
                    {devices.map((dev) => (
                      <option key={dev.id} value={dev.id} className="bg-slate-900">
                        {dev.name} ({dev.id})
                      </option>
                    ))}
                    {!devices.some(d => d.id === "DEV-ESP32-CAM-01") && (
                      <option value="DEV-ESP32-CAM-01" className="bg-slate-900">
                        Cổng Chấm công FaceID ESP32-CAM (DEV-ESP32-CAM-01)
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Họ tên nhân viên nhận diện</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Mã nhân sự (Employee ID)</label>
                    <input
                      type="text"
                      value={simEmpId}
                      onChange={(e) => setSimEmpId(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Tỷ lệ chính xác (% Match)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={simConfidence}
                      onChange={(e) => setSimConfidence(parseFloat(e.target.value))}
                      className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSimulateAttendance}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Gửi dữ liệu qua `/api/iot/attendance`
                </button>
              </div>
            </div>

            {/* Simulation Telemetry sensors */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-slate-850 pb-3">
                <Sun className="w-5 h-5" />
                <h4>Mô phỏng Gửi Dữ liệu cảm biến DHT22 (Telemetry POST)</h4>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Mã nguồn thiết bị phát tín hiệu</label>
                  <select
                    value={simTelemetryDevice}
                    onChange={(e) => setSimTelemetryDevice(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono focus:border-indigo-500 focus:outline-none"
                  >
                    {devices.map((dev) => (
                      <option key={dev.id} value={dev.id} className="bg-slate-900">
                        {dev.name} ({dev.id})
                      </option>
                    ))}
                    {!devices.some(d => d.id === "DEV-WEATHER-01") && (
                      <option value="DEV-WEATHER-01" className="bg-slate-900">
                        Trạm Thời tiết & Môi trường DHT22/BMP280 (DEV-WEATHER-01)
                      </option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Nhiệt độ phòng họp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={simTemp}
                      onChange={(e) => setSimTemp(parseFloat(e.target.value))}
                      className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Độ ẩm tương đối (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={simHumid}
                      onChange={(e) => setSimHumid(parseFloat(e.target.value))}
                      className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Trạng thái thời tiết tổng hợp</label>
                  <input
                    type="text"
                    value={simWeather}
                    onChange={(e) => setSimWeather(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl"
                  />
                </div>

                <button
                  onClick={handleSimulateTelemetry}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Gửi telemetry qua `/api/iot/telemetry`
                </button>

                {simStatusMsg && (
                  <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-850 leading-relaxed">
                    {simStatusMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: REGISTER/EDIT DEVICE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingDevice ? `Chỉnh sửa Thiết bị IoT: ${editingDevice.id}` : "Đăng ký thiết bị IoT mới"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">ID thiết bị (Unique ID)</label>
                <input
                  type="text"
                  placeholder="VD: DEV-ESP32-CAM-02"
                  value={newDevice.id}
                  onChange={(e) => setNewDevice({ ...newDevice, id: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!!editingDevice}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Tên thiết bị</label>
                <input
                  type="text"
                  placeholder="VD: Cửa từ Phòng Hành chính"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Loại phần cứng</label>
                  <select
                    value={newDevice.device_type}
                    onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="esp32_cam">ESP32-CAM (FaceID)</option>
                    <option value="weather_station">Trạm Môi trường</option>
                    <option value="rfid_reader">RFID Reader</option>
                    <option value="arduino_mega">Arduino Controller</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Vị trí lắp đặt</label>
                  <input
                    type="text"
                    placeholder="VD: Tầng 3 Sảnh chính"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Địa chỉ IP / MAC</label>
                <input
                  type="text"
                  placeholder="192.168.1.150"
                  value={newDevice.ip_address}
                  onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Khóa bảo mật API Key</label>
                <input
                  type="text"
                  placeholder="VD: iot_secret_key_99"
                  value={newDevice.api_key}
                  onChange={(e) => setNewDevice({ ...newDevice, api_key: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
                >
                  {editingDevice ? "Cập nhật" : "Đăng ký"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RULE BUILDER */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingRule ? `Chỉnh sửa kịch bản: ${editingRule.id}` : "Thêm kịch bản tự động mới"}
              </h3>
              <button onClick={() => setShowRuleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-400 font-semibold mb-1.5">Mã kịch bản</label>
                  <input
                    type="text"
                    placeholder="VD: R-04"
                    value={ruleForm.id}
                    onChange={(e) => setRuleForm({ ...ruleForm, id: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1.5">Tên kịch bản mô tả</label>
                  <input
                    type="text"
                    placeholder="VD: Tự động bật quạt sảnh..."
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    required
                  />
                </div>
              </div>

              {/* IF STATEMENT */}
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <span className="px-2 py-0.5 bg-indigo-500/10 rounded text-[10px]">ĐIỀU KIỆN (IF)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Thiết bị cảm biến</label>
                    <select
                      value={ruleForm.triggerDevice}
                      onChange={(e) => setRuleForm({ ...ruleForm, triggerDevice: e.target.value })}
                      className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    >
                      {devices.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                      ))}
                      <option value="DEV-WEATHER-01">DEV-WEATHER-01 (Trạm khí tượng)</option>
                      <option value="DEV-SERVER-TEMP">DEV-SERVER-TEMP (Phòng server)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Thông số theo dõi</label>
                    <select
                      value={ruleForm.triggerParam}
                      onChange={(e) => setRuleForm({ ...ruleForm, triggerParam: e.target.value })}
                      className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    >
                      <option value="temperature">Nhiệt độ (°C)</option>
                      <option value="humidity">Độ ẩm (%)</option>
                      <option value="occupancy">Số người hiện diện</option>
                      <option value="access">Lượt quét RFID / FaceID</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Phép so sánh</label>
                      <select
                        value={ruleForm.operator}
                        onChange={(e) => setRuleForm({ ...ruleForm, operator: e.target.value as any })}
                        className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                      >
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="=">=</option>
                        <option value="changes">Thay đổi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Giá trị ngưỡng</label>
                      <input
                        type="text"
                        placeholder="35"
                        value={ruleForm.triggerValue}
                        onChange={(e) => setRuleForm({ ...ruleForm, triggerValue: e.target.value })}
                        className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* THEN STATEMENT */}
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-[10px]">HÀNH ĐỘNG (THEN)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Thiết bị chấp hành</label>
                    <input
                      type="text"
                      placeholder="VD: DEV-AC-LOBBY, DEV-SERVER-FAN"
                      value={ruleForm.actionDevice}
                      onChange={(e) => setRuleForm({ ...ruleForm, actionDevice: e.target.value })}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1.5">Lệnh điều khiển gửi đi</label>
                    <input
                      type="text"
                      placeholder="VD: POWER_OFF, FAN_ON_100%, PLAY_ALARM"
                      value={ruleForm.actionCommand}
                      onChange={(e) => setRuleForm({ ...ruleForm, actionCommand: e.target.value })}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
                >
                  {editingRule ? "Lưu kịch bản" : "Tạo kịch bản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Auxiliary Small Sub-Components (Internal scoped to keep clean layout)
const ServerStateIndicator: React.FC<{ online: boolean }> = ({ online }) => (
  <span className="relative flex h-2 w-2">
    {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
    <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? "bg-emerald-500" : "bg-rose-500"}`} />
  </span>
);

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
      active
        ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
    }`}
  >
    {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
    {label}
  </button>
);

interface MetricTileProps {
  title: string;
  value: string | number;
  subtitle: string;
  trendUp?: boolean;
  isWarning?: boolean;
  colorClass: string;
  icon: React.ReactNode;
}

const MetricTile: React.FC<MetricTileProps> = ({ title, value, subtitle, trendUp, isWarning, colorClass, icon }) => (
  <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{title}</span>
      <div className={`p-2 rounded-xl border ${colorClass}`}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-4.5 h-4.5" })}
      </div>
    </div>
    <div className="mt-2.5">
      <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
      <p className={`text-[10px] font-medium mt-0.5 ${
        isWarning ? "text-amber-400 font-bold" : trendUp ? "text-emerald-400" : "text-rose-400"
      }`}>
        {subtitle}
      </p>
    </div>
  </div>
);

interface InsightRowProps {
  severity: "danger" | "warning" | "success" | "info";
  title: string;
  desc: string;
}

const InsightRow: React.FC<InsightRowProps> = ({ severity, title, desc }) => {
  const dotColor = {
    danger: "bg-rose-500",
    warning: "bg-amber-500",
    success: "bg-emerald-500",
    info: "bg-indigo-500"
  }[severity];

  const labelColor = {
    danger: "text-rose-400",
    warning: "text-amber-400",
    success: "text-emerald-400",
    info: "text-indigo-400"
  }[severity];

  return (
    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 flex gap-3 text-xs leading-relaxed">
      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor}`} />
      <div>
        <h5 className={`font-bold tracking-tight ${labelColor}`}>{title}</h5>
        <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
};
