import React, { useState, useEffect } from "react";
import { Camera, Eye, Radio, ShieldAlert, Users, Film, CheckCircle2 } from "lucide-react";

interface CameraAIProps {
  onFaceMatched?: (name: string, confidence: number) => void;
}

export const IotCameraAI: React.FC<CameraAIProps> = ({ onFaceMatched }) => {
  const [activeCam, setActiveCam] = useState<number>(0);
  const [scanning, setScanning] = useState(true);
  const [detectedFaces, setDetectedFaces] = useState<Array<{ name: string; match: number; role: string; x: string; y: string; w: string; h: string }>>([]);

  const cameraFeeds = [
    {
      id: "CAM-01",
      name: "Cổng Chính (Lễ tân Tầng 1)",
      location: "Entrance",
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
      faces: [
        { name: "Luật sư Nguyễn Văn A", match: 98.4, role: "Luật sư thành viên", x: "32%", y: "42%", w: "120px", h: "120px" },
        { name: "Trần Thị B", match: 96.1, role: "Trưởng phòng Kế toán", x: "65%", y: "46%", w: "100px", h: "100px" }
      ]
    },
    {
      id: "CAM-02",
      name: "Phòng Server Trung tâm",
      location: "Server Room",
      url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
      faces: []
    },
    {
      id: "CAM-03",
      name: "Phòng Họp Lớn (Tầng 2)",
      location: "Conference Room",
      url: "https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?auto=format&fit=crop&w=600&q=80",
      faces: [
        { name: "Khách hàng VIP", match: 89.2, role: "Đối tác doanh nghiệp", x: "45%", y: "50%", w: "110px", h: "110px" }
      ]
    }
  ];

  useEffect(() => {
    // Scan animation toggle
    const interval = setInterval(() => {
      setScanning((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sync face detections of current camera
    setDetectedFaces(cameraFeeds[activeCam].faces);
    
    // Optionally trigger a callback on select for live feedback
    if (cameraFeeds[activeCam].faces.length > 0 && onFaceMatched) {
      const f = cameraFeeds[activeCam].faces[0];
      onFaceMatched(f.name, f.match);
    }
  }, [activeCam]);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-full shadow-2xl relative overflow-hidden">
      {/* CCTV Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-base">Hệ thống Camera AI Nhận diện & Giám sát</h3>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
          <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
          LIVE - AI ACTIVE
        </span>
      </div>

      {/* Main Stream Area */}
      <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-850 bg-slate-950 flex items-center justify-center group">
        <img
          src={cameraFeeds[activeCam].url}
          alt={cameraFeeds[activeCam].name}
          className="w-full h-full object-cover select-none brightness-90 group-hover:scale-[1.02] transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* HUD Grid Overlay */}
        <div className="absolute inset-0 border-3 border-indigo-500/10 pointer-events-none" />
        <div className="absolute top-4 left-4 font-mono text-xs text-emerald-400 bg-slate-950/80 px-2 py-1 rounded border border-emerald-500/20 backdrop-blur-sm shadow flex items-center gap-1.5 select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          REC • {cameraFeeds[activeCam].id}
        </div>
        <div className="absolute top-4 right-4 font-mono text-xs text-slate-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/40 backdrop-blur-sm select-none">
          FPS: 30.0 / {cameraFeeds[activeCam].location}
        </div>

        {/* Scan line animation */}
        {scanning && (
          <div className="absolute left-0 w-full h-[2px] bg-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.8)] pointer-events-none animate-[bounce_5s_infinite]" />
        )}

        {/* Target face boxes */}
        {detectedFaces.map((face, index) => (
          <div
            key={index}
            className="absolute border-2 border-emerald-500 rounded-lg animate-pulse flex flex-col justify-end p-2 select-none"
            style={{
              left: `calc(${face.x} - 50px)`,
              top: `calc(${face.y} - 50px)`,
              width: face.w,
              height: face.h
            }}
          >
            {/* Tracking Corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400 -mt-1.5 -ml-1.5" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400 -mt-1.5 -mr-1.5" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400 -mb-1.5 -ml-1.5" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400 -mb-1.5 -mr-1.5" />

            {/* User credentials banner */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-slate-950/90 text-[10px] text-white px-2.5 py-1.5 rounded-lg border border-emerald-500/40 whitespace-nowrap shadow-xl flex flex-col gap-0.5">
              <span className="font-bold flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {face.name}
              </span>
              <span className="text-slate-400 text-[9px]">{face.role}</span>
              <span className="font-mono text-[9px] text-indigo-400 font-bold border-t border-slate-800 mt-1 pt-1">
                CONFIDENCE: {face.match}%
              </span>
            </div>
          </div>
        ))}

        {/* No faces warning */}
        {detectedFaces.length === 0 && (
          <div className="absolute bottom-4 left-4 font-mono text-[10px] text-rose-400 bg-slate-950/80 px-2 py-1 rounded border border-rose-500/20 backdrop-blur-sm select-none flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 animate-bounce" />
            NO RECOGNIZED FACES DETECTED
          </div>
        )}
      </div>

      {/* Camera Swapping Thumbnail Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {cameraFeeds.map((feed, idx) => (
          <button
            key={feed.id}
            onClick={() => setActiveCam(idx)}
            className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative overflow-hidden group ${
              activeCam === idx
                ? "bg-slate-950 border-indigo-500 ring-2 ring-indigo-500/20"
                : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase font-bold">
              <Film className="w-3.5 h-3.5" />
              {feed.id}
            </div>
            <p className="text-white text-xs font-bold mt-1 tracking-tight truncate w-full">
              {feed.name.replace(/\(.*?\)/g, "")}
            </p>
            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{feed.location}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
