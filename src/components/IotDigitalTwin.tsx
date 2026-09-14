import React, { useState, useEffect } from "react";
import { 
  Map, Thermometer, Wifi, RefreshCw, Layers, ShieldAlert, Cpu, Eye, CheckCircle2 
} from "lucide-react";
import { IotDevice } from "../types/iot";

interface DigitalTwinProps {
  devices: IotDevice[];
  onTriggerAction: (deviceId: string, action: string) => void;
}

export const IotDigitalTwin: React.FC<DigitalTwinProps> = ({ devices, onTriggerAction }) => {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [draggedPinId, setDraggedPinId] = useState<string | null>(null);

  // Map coordinate placement and colors for devices inside state to support dragging
  const [pins, setPins] = useState([
    {
      id: "DEV-ESP32-CAM-01",
      x: 400,
      y: 380,
      room: "Khu vực Lễ tân",
      type: "FaceID Terminal",
      color: "bg-emerald-500",
      accent: "text-emerald-400"
    },
    {
      id: "DEV-WEATHER-01",
      x: 180,
      y: 160,
      room: "Phòng họp lớn",
      type: "Weather Station",
      color: "bg-indigo-500",
      accent: "text-indigo-400"
    },
    {
      id: "DEV-RFID-01",
      x: 620,
      y: 180,
      room: "P. Giám đốc",
      type: "RFID Access Gate",
      color: "bg-amber-500",
      accent: "text-amber-400"
    },
    {
      id: "DEV-SERVER-TEMP",
      x: 660,
      y: 360,
      room: "Phòng Server",
      type: "Server Climate Probe",
      color: "bg-rose-500",
      accent: "text-rose-400"
    }
  ]);

  // Handle document/mouse move for smooth dragging
  useEffect(() => {
    if (!draggedPinId) return;

    const handleMove = (clientX: number, clientY: number) => {
      const container = document.getElementById("digital-twin-map-container");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const pctX = (clientX - rect.left) / rect.width;
      const pctY = (clientY - rect.top) / rect.height;

      // Clamp values between 0 and 1 to prevent pins from being dragged outside of the container bounds
      const clampedPctX = Math.max(0, Math.min(1, pctX));
      const clampedPctY = Math.max(0, Math.min(1, pctY));

      const newX = clampedPctX * 800;
      const newY = clampedPctY * 500;

      setPins((prev) =>
        prev.map((p) => (p.id === draggedPinId ? { ...p, x: newX, y: newY } : p))
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      // Prevent screen scrolling when dragging pins on mobile
      if (e.cancelable) {
        e.preventDefault();
      }
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleStop = () => {
      setDraggedPinId(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleStop);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleStop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleStop);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleStop);
    };
  }, [draggedPinId]);

  const handleActionClick = (deviceId: string, action: string) => {
    setActionStatus(`Đang thực hiện ${action} cho thiết bị ${deviceId}...`);
    onTriggerAction(deviceId, action);
    setTimeout(() => {
      setActionStatus(`✅ ${action} thành công!`);
      setTimeout(() => setActionStatus(null), 3000);
    }, 2000);
  };

  // Get active device info from devices prop, else fallback to a default
  const getDeviceDetails = (id: string) => {
    const matched = devices.find(d => d.id === id);
    const pinConf = pins.find(p => p.id === id);
    return {
      id,
      name: matched?.name || pinConf?.type || "Thiết bị IoT",
      status: matched?.status || "online",
      location: matched?.location || pinConf?.room || "Văn phòng",
      ip: matched?.ip_address || "192.168.1.150",
      mac: matched?.mac_address || "A4:CF:12:89:55:01",
      type: matched?.device_type || "ESP32",
      room: pinConf?.room || "Khu vực chung",
      color: pinConf?.color || "bg-indigo-500",
      accent: pinConf?.accent || "text-indigo-400"
    };
  };

  const selectedDevice = selectedPin ? getDeviceDetails(selectedPin) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden h-full flex flex-col justify-between shadow-2xl">
      {/* Blueprint Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-base">Bản đồ Sơ đồ tòa nhà & Thiết bị Live</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> FaceID</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" /> Trạm DHT</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" /> RFID</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" /> Server</span>
        </div>
      </div>

      {/* Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center flex-1">
        {/* SVG Office blueprint */}
        <div 
          id="digital-twin-map-container"
          className="lg:col-span-2 relative bg-slate-950 rounded-xl border border-slate-800/80 p-4 h-[350px] flex items-center justify-center select-none overflow-hidden"
        >
          <svg viewBox="0 0 800 500" className="w-full h-full opacity-70 pointer-events-none">
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(99, 102, 241, 0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Main Outer Walls */}
            <rect x="50" y="40" width="700" height="420" fill="none" stroke="#312e81" strokeWidth="3" rx="12" />

            {/* Room Dividers */}
            {/* Meeting Room 1 */}
            <rect x="50" y="40" width="250" height="200" fill="none" stroke="#1e1b4b" strokeWidth="2" strokeDasharray="4 2" />
            {/* Meeting Room 2 */}
            <rect x="50" y="240" width="250" height="220" fill="none" stroke="#1e1b4b" strokeWidth="2" />
            
            {/* Director's Office */}
            <rect x="500" y="40" width="250" height="200" fill="none" stroke="#1e1b4b" strokeWidth="2" />
            {/* Server Room */}
            <rect x="550" y="300" width="200" height="160" fill="none" stroke="#1e1b4b" strokeWidth="2" strokeDasharray="4 2" />

            {/* Hallway & Working Open Space */}
            {/* Interior labels */}
            <text x="175" y="140" fill="#4f46e5" fontSize="16" fontWeight="bold" textAnchor="middle" className="tracking-wide">Phòng Họp 1</text>
            <text x="175" y="350" fill="#4f46e5" fontSize="16" fontWeight="bold" textAnchor="middle" className="tracking-wide">Phòng Họp 2</text>
            <text x="625" y="140" fill="#4f46e5" fontSize="16" fontWeight="bold" textAnchor="middle" className="tracking-wide">P. Giám đốc</text>
            <text x="650" y="380" fill="#e11d48" fontSize="16" fontWeight="bold" textAnchor="middle" className="tracking-wide">Phòng Server</text>
            <text x="400" y="250" fill="#6366f1" fontSize="18" fontWeight="bold" textAnchor="middle" className="tracking-wide">Khu Làm Việc Chung</text>
            <text x="400" y="440" fill="#10b981" fontSize="16" fontWeight="bold" textAnchor="middle" className="tracking-wide">Lễ Tân & Cổng Chính</text>

            {/* Doors markers */}
            <path d="M 300 120 A 40 40 0 0 1 300 160" fill="none" stroke="#4f46e5" strokeWidth="2" />
            <path d="M 500 120 A 40 40 0 0 0 500 160" fill="none" stroke="#4f46e5" strokeWidth="2" />
            <path d="M 550 350 A 30 30 0 0 0 550 380" fill="none" stroke="#e11d48" strokeWidth="2" />
          </svg>

          {/* Interactive beacon overlay elements */}
          {pins.map((pin) => {
            const currentDev = devices.find(d => d.id === pin.id) || { status: "online" };
            const isSelected = selectedPin === pin.id;
            const isWarning = currentDev.status === "warning";
            const isOffline = currentDev.status === "offline";
            const isCurrentlyDragged = draggedPinId === pin.id;

            return (
              <button
                key={pin.id}
                onClick={() => setSelectedPin(isSelected ? null : pin.id)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggedPinId(pin.id);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setDraggedPinId(pin.id);
                }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 focus:outline-none cursor-grab active:cursor-grabbing hover:scale-125 ${
                  isCurrentlyDragged ? "scale-125 cursor-grabbing" : "transition duration-300"
                }`}
                style={{ left: `${pin.x / 8}%`, top: `${pin.y / 5}%` }}
              >
                {/* Outer Ripple Effect */}
                <span className={`absolute inline-flex h-10 w-10 rounded-full opacity-35 animate-ping -left-3 -top-3 ${
                  isOffline ? "bg-rose-500" : isWarning ? "bg-amber-500" : pin.color
                }`} />
                {/* Core Pin */}
                <div className={`h-4.5 w-4.5 rounded-full border-2 border-slate-900 shadow-lg flex items-center justify-center transition-all ${
                  isSelected ? "scale-125 ring-4 ring-indigo-500/50" : ""
                } ${
                  isOffline ? "bg-rose-500" : isWarning ? "bg-amber-500" : pin.color
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Pin Details Sidebar */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-[350px]">
          {selectedDevice ? (
            <div className="flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {selectedDevice.room}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${
                    selectedDevice.status === "offline" ? "text-rose-400" : selectedDevice.status === "warning" ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      selectedDevice.status === "offline" ? "bg-rose-500" : selectedDevice.status === "warning" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                    }`} />
                    {selectedDevice.status.toUpperCase()}
                  </span>
                </div>

                <h4 className="text-white font-bold text-base mt-2 tracking-tight">{selectedDevice.name}</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{selectedDevice.id}</p>

                {/* Telemetry info */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Địa chỉ IP</p>
                    <p className="text-slate-200 font-mono mt-0.5">{selectedDevice.ip}</p>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Địa chỉ MAC</p>
                    <p className="text-slate-200 font-mono text-[10px] mt-0.5">{selectedDevice.mac}</p>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Tín hiệu Wi-Fi</p>
                    <p className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5" /> -56 dBm
                    </p>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Cấp điện</p>
                    <p className="text-slate-200 font-semibold mt-0.5">AC 220V</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {actionStatus && (
                  <div className="text-[11px] font-mono text-indigo-400 bg-slate-900 p-2 rounded border border-indigo-950">
                    {actionStatus}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleActionClick(selectedDevice.id, "REBOOT")}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                  <button
                    onClick={() => handleActionClick(selectedDevice.id, "OTA UPDATE")}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    OTA Update
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-2">
              <Map className="w-8 h-8 opacity-20" />
              <p className="text-xs">Click và kéo thả các thiết bị trên sơ đồ để di chuyển vị trí, hoặc click để mở bảng điều khiển trực tiếp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
