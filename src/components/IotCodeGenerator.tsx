import React, { useState } from "react";
import { Code, Copy, Check, Info, Radio, Terminal } from "lucide-react";
import { ARDUINO_TEMPLATES } from "../types/iot";

export const IotCodeGenerator: React.FC = () => {
  const [template, setTemplate] = useState<"esp32_cam" | "weather" | "rfid">("esp32_cam");
  const [copied, setCopied] = useState(false);

  const getCode = () => {
    return ARDUINO_TEMPLATES[template];
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-full shadow-2xl text-slate-200">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-400" />
              Bộ nạp Mã nguồn C++ cho Arduino / ESP32
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Mã nguồn chuẩn cấu hình sẵn URL và payload để kết nối phần cứng trực tiếp vào ERP
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as any)}
              className="bg-slate-950 text-slate-300 border border-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-indigo-500 shadow-inner"
            >
              <option value="esp32_cam">ESP32-CAM FaceID Chấm công</option>
              <option value="weather">Arduino DHT22 Trạm Môi trường</option>
              <option value="rfid">Arduino RC522 Máy Đọc Thẻ</option>
            </select>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Đã sao chép!" : "Copy Code"}
            </button>
          </div>
        </div>

        {/* Informative warning alert about connecting devices */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-indigo-950 text-xs text-slate-300 flex items-start gap-2.5 mb-4">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-indigo-300">Hướng dẫn lắp đặt:</span> Nạp firmware này thông qua <b>Arduino IDE</b>. Cấu hình đúng SSID mạng Wi-Fi công ty của bạn. Thiết bị sẽ tự động đồng bộ thời gian thực với Legal OS.
          </div>
        </div>

        {/* Monospace code view */}
        <div className="relative">
          <pre className="bg-slate-950 p-5 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800/80 leading-relaxed max-h-[420px] shadow-inner select-all">
            <code>{getCode()}</code>
          </pre>
          <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono flex items-center gap-1 bg-slate-950/90 px-2 py-1 rounded border border-slate-800/60">
            <Terminal className="w-3.5 h-3.5" />
            C++ / Arduino IDE v2.1+
          </div>
        </div>
      </div>
    </div>
  );
};
