import React, { useState, useEffect, useRef } from "react";
import { 
  Network, Search, ZoomIn, ZoomOut, Maximize2, FileText, 
  Settings, HelpCircle, Code, Briefcase, Play, RefreshCw,
  Plus, Trash2, Edit2, Info, ChevronRight, Check, Sparkles
} from "lucide-react";

// Types for our Knowledge Graph
interface Node {
  id: string;
  label: string;
  type: "file" | "class" | "function" | "dependency" | "concept";
  summary: string;
  complexity?: "Low" | "Medium" | "High";
  linesOfCode?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string;
  target: string;
  type: "calls" | "imports" | "extends" | "references";
}

export default function UnderstandAnything() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: "1", label: "App.tsx", type: "file", summary: "Tệp cấu hình chính của ứng dụng ERP, định tuyến các phân hệ.", complexity: "Low", linesOfCode: 45 },
    { id: "2", label: "LegalConsulting.tsx", type: "file", summary: "Module tư vấn pháp lý, quản lý 12 trường thông tin khách hàng.", complexity: "High", linesOfCode: 380 },
    { id: "3", label: "TelephonyGateway", type: "class", summary: "Lớp tích hợp tổng đài VoIP, xử lý kết nối cuộc gọi và ghi âm.", complexity: "High", linesOfCode: 120 },
    { id: "4", label: "triggerCall()", type: "function", summary: "Hàm kích hoạt cuộc gọi điện thoại, đồng bộ thông số thời gian thực.", complexity: "Medium", linesOfCode: 35 },
    { id: "5", label: "d3-visualizer", type: "dependency", summary: "Thư viện d3 dùng để render sơ đồ cây quan hệ và sơ đồ tri thức.", complexity: "Medium" },
    { id: "6", label: "QAEngine", type: "class", summary: "Hệ thống AI đánh giá tuân thủ chất lượng đàm thoại và phân tích ngữ âm.", complexity: "High", linesOfCode: 250 },
    { id: "7", label: "DatabaseSync", type: "function", summary: "Đồng bộ dữ liệu hồ sơ pháp lý về máy chủ trung tâm.", complexity: "Medium", linesOfCode: 50 },
  ]);

  const [links, setLinks] = useState<Link[]>([
    { source: "1", target: "2", type: "imports" },
    { source: "2", target: "3", type: "references" },
    { source: "3", target: "4", type: "calls" },
    { source: "2", target: "5", type: "imports" },
    { source: "4", target: "6", type: "calls" },
    { source: "2", target: "7", type: "calls" },
  ]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Simple custom Force-Directed simulation layout since external packages can be tricky
  useEffect(() => {
    // Initialize positions
    const width = 600;
    const height = 400;
    
    let simulatedNodes = nodes.map((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      return {
        ...node,
        x: node.x || width / 2 + 120 * Math.cos(angle),
        y: node.y || height / 2 + 120 * Math.sin(angle),
      };
    });

    // Simple spring-embedder simulation
    for (let step = 0; step < 50; step++) {
      // Gravity towards center
      simulatedNodes.forEach(node => {
        node.x += ((width / 2) - node.x!) * 0.05;
        node.y += ((height / 2) - node.y!) * 0.05;
      });

      // Repulsion between all nodes
      for (let i = 0; i < simulatedNodes.length; i++) {
        for (let j = i + 1; j < simulatedNodes.length; j++) {
          const dx = simulatedNodes[j].x! - simulatedNodes[i].x!;
          const dy = simulatedNodes[j].y! - simulatedNodes[i].y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 100) {
            const force = (100 - dist) * 0.1;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            simulatedNodes[j].x += fx;
            simulatedNodes[j].y += fy;
            simulatedNodes[i].x -= fx;
            simulatedNodes[i].y -= fy;
          }
        }
      }

      // Link attraction
      links.forEach(link => {
        const sourceNode = simulatedNodes.find(n => n.id === link.source);
        const targetNode = simulatedNodes.find(n => n.id === link.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.x! - sourceNode.x!;
          const dy = targetNode.y! - sourceNode.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 80) * 0.05;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          targetNode.x -= fx;
          targetNode.y -= fy;
          sourceNode.x += fx;
          sourceNode.y += fy;
        }
      });
    }

    setNodes(simulatedNodes);
  }, [links.length]);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    const interval = setInterval(() => {
      setAnalysisProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          // Add a new node discovered as bonus
          const newNodeId = (nodes.length + 1).toString();
          const newNodes: Node[] = [
            ...nodes,
            { 
              id: newNodeId, 
              label: "UnderstandAnything.tsx", 
              type: "file", 
              summary: "Module phân tích tri thức mã nguồn tự động, tích hợp Bản đồ Quan hệ Thông minh.", 
              complexity: "Medium", 
              linesOfCode: 220 
            }
          ];
          setNodes(newNodes);
          setLinks([...links, { source: "1", target: newNodeId, type: "imports" }]);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "file": return "#6366f1"; // Indigo
      case "class": return "#10b981"; // Emerald
      case "function": return "#f59e0b"; // Amber
      case "dependency": return "#ec4899"; // Pink
      default: return "#64748b"; // Slate
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 space-y-6 shadow-2xl" id="understand_anything_module">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Network size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                Understand Anything <span className="text-[10px] font-black px-1.5 py-0.5 bg-indigo-500 text-white rounded">V1.0</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Bản đồ Tri thức & Phân tích Quan hệ Mã nguồn tự động</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/10"
          >
            <RefreshCw size={12} className={isAnalyzing ? "animate-spin" : ""} />
            <span>{isAnalyzing ? `Đang phân tích (${analysisProgress}%)` : "QUÉT & PHÂN TÍCH HỆ THỐNG"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel: Search & Node list */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Tìm kiếm file, hàm, class..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-3 max-h-[350px] overflow-y-auto">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Danh sách các Thành phần ({nodes.length})</span>
            <div className="space-y-2">
              {nodes
                .filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(node => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex justify-between items-center ${
                      selectedNode?.id === node.id 
                        ? "bg-indigo-600/10 border-indigo-500/40 text-white" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(node.type) }}></span>
                      <span className="font-mono font-bold text-[11px]">{node.label}</span>
                    </div>
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-slate-900 text-slate-500">
                      {node.type}
                    </span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>

        {/* Center: Graph Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden h-[380px] flex items-center justify-center">
            
            {/* Interactive SVG Canvas */}
            <svg ref={svgRef} className="w-full h-full cursor-grab">
              {/* Definition of marker arrowheads */}
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
                </marker>
              </defs>

              {/* Draw Links */}
              {links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                if (!sourceNode?.x || !targetNode?.x) return null;
                return (
                  <line
                    key={idx}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="#334155"
                    strokeWidth="1.5"
                    strokeDasharray={link.type === "references" ? "4" : "0"}
                    markerEnd="url(#arrow)"
                  />
                );
              })}

              {/* Draw Nodes */}
              {nodes.map((node) => (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x || 300}, ${node.y || 200})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  <circle 
                    r={selectedNode?.id === node.id ? 14 : 10} 
                    fill={getNodeColor(node.type)} 
                    className="transition-all duration-300 group-hover:scale-125"
                    stroke="#1e293b"
                    strokeWidth="2"
                  />
                  <text 
                    y="-16" 
                    textAnchor="middle" 
                    fill="#cbd5e1" 
                    className="text-[10px] font-mono font-bold select-none pointer-events-none group-hover:fill-white"
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Instruction tooltip overlay */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-2 rounded-xl text-[10px] text-slate-400 font-bold space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]"></span> <span>File</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] ml-2"></span> <span>Class</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] ml-2"></span> <span>Func</span>
              </div>
              <p>💡 Click vào nút để xem thông tin chi tiết quan hệ phụ thuộc.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer / Selected Node Analysis Panel */}
      {selectedNode ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-start border-b border-slate-900 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-white" style={{ backgroundColor: getNodeColor(selectedNode.type) }}>
                  {selectedNode.type}
                </span>
                <h3 className="text-sm font-black text-white font-mono">{selectedNode.label}</h3>
              </div>
              {selectedNode.linesOfCode && (
                <p className="text-[10px] text-slate-500 font-bold mt-1 font-mono">Dung lượng: {selectedNode.linesOfCode} dòng mã nguồn</p>
              )}
            </div>
            {selectedNode.complexity && (
              <div className="text-right">
                <span className="text-[9px] text-slate-500 font-black uppercase block mb-1">Độ phức tạp</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  selectedNode.complexity === "High" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                  selectedNode.complexity === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {selectedNode.complexity}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tóm tắt tính năng & Phân tích cấu trúc:</span>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">{selectedNode.summary}</p>
          </div>

          {/* Dependencies / Connections for selected node */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl space-y-1.5">
              <span className="text-[9px] text-slate-500 font-black uppercase block">Thành phần tham chiếu đến (Source of):</span>
              <div className="space-y-1">
                {links.filter(l => l.source === selectedNode.id).map((l, i) => (
                  <div key={i} className="text-[10px] font-mono text-indigo-400 flex items-center space-x-1 font-bold">
                    <span>{selectedNode.label}</span> 
                    <span className="text-slate-600 text-[9px] uppercase font-black font-mono">--{l.type}--&gt;</span>
                    <span>{nodes.find(n => n.id === l.target)?.label}</span>
                  </div>
                ))}
                {links.filter(l => l.source === selectedNode.id).length === 0 && (
                  <p className="text-[10px] text-slate-600 italic">Không có quan hệ gọi đi nào.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl space-y-1.5">
              <span className="text-[9px] text-slate-500 font-black uppercase block">Được gọi / Nhập bởi (Target of):</span>
              <div className="space-y-1">
                {links.filter(l => l.target === selectedNode.id).map((l, i) => (
                  <div key={i} className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1 font-bold">
                    <span>{nodes.find(n => n.id === l.source)?.label}</span> 
                    <span className="text-slate-600 text-[9px] uppercase font-black font-mono">--{l.type}--&gt;</span>
                    <span>{selectedNode.label}</span>
                  </div>
                ))}
                {links.filter(l => l.target === selectedNode.id).length === 0 && (
                  <p className="text-[10px] text-slate-600 italic">Không có thành phần nào nhập vào.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/40 border border-slate-800/60 p-6 rounded-2xl text-center text-xs text-slate-500 font-bold flex flex-col items-center justify-center space-y-2">
          <Sparkles size={18} className="text-indigo-400 animate-pulse" />
          <p>Chọn bất kỳ nút nào trên Sơ đồ tri thức để mở bảng giải thích bản vẽ kỹ thuật chi tiết.</p>
        </div>
      )}

    </div>
  );
}
