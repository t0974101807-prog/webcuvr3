import React from "react";
import Markdown from "react-markdown";
import { Loader2, Star, X } from "lucide-react";

interface ERPAIAnalysisModalProps {
  showAIModal: boolean;
  selectedRecord?: any;
  viewingRecord?: any;
  language: string;
  t: {
    aiAnalysis?: string;
    [key: string]: any;
  };
  isAnalyzing: boolean;
  aiAnalysisResult: string | null;
  onClose: () => void;
}

export default function ERPAIAnalysisModal({
  showAIModal,
  selectedRecord,
  viewingRecord,
  language,
  t,
  isAnalyzing,
  aiAnalysisResult,
  onClose,
}: ERPAIAnalysisModalProps) {
  const record = selectedRecord || viewingRecord;

  if (!showAIModal || !record) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Star size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {t.aiAnalysis}
              </h2>
              <p className="text-sm text-slate-500">{record.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-all duration-300 active:scale-95"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
              <Loader2 size={40} className="animate-spin text-purple-600" />
              <p className="text-lg font-medium">
                {language === "vi"
                  ? "AI đang phân tích hồ sơ..."
                  : "AI is analyzing the record..."}
              </p>
            </div>
          ) : (
            <div className="markdown-body text-slate-700 leading-relaxed">
              <Markdown>{aiAnalysisResult || ""}</Markdown>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg transition-all duration-300 hover:bg-purple-700 font-medium transition-all duration-300 active:scale-95"
          >
            {language === "vi" ? "Đóng" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
