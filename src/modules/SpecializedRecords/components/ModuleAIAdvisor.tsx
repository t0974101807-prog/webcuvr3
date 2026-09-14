import React, { useState } from "react";
import { Brain, Sparkles, AlertTriangle, CheckCircle, ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import Markdown from "react-markdown";
import { askAI } from "../../../services/ai.service";
import { RecordItem } from "../repository/SpecializedRecordsRepository";

interface ModuleAIAdvisorProps {
  record: RecordItem | null;
  language: "vi" | "en";
}

export const ModuleAIAdvisor: React.FC<ModuleAIAdvisorProps> = ({
  record,
  language,
}) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  if (!record) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center h-[300px]">
        <Brain className="w-12 h-12 text-slate-300 dark:text-slate-700 animate-pulse" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4">
          {language === "vi"
            ? "Chọn một hồ sơ chuyên môn để xem phân tích rủi ro từ Trợ lý AI"
            : "Select a specialized dossier to view risk analysis from the AI Assistant"}
        </p>
      </div>
    );
  }

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const prompt = `Bạn là Trợ lý Pháp lý AI Cấp cao của hệ thống Legal OS Ánh Dương Law. 
Hãy thực hiện phân tích rủi ro pháp lý sơ bộ và đưa ra 3 khuyến nghị hành động thiết thực cho hồ sơ sau:
- Tên vụ việc/Hồ sơ: ${record.title}
- Đối tác/Khách hàng: ${record.client}
- Phân hệ Chuyên môn: ${record.category || record.practice_area}
- Mô tả hồ sơ: ${record.description || "Chưa có mô tả chi tiết."}
- Trạng thái hiện tại: ${record.status}

Hãy viết câu trả lời bằng ngôn ngữ: ${language === "vi" ? "Tiếng Việt" : "Tiếng Anh"}. 
Sử dụng các định dạng Markdown tiêu chuẩn như tiêu đề (#, ##), danh sách (-), in đậm (**). Hãy giữ câu trả lời súc tích, chuyên nghiệp, sang trọng, mang phong cách của một Luật sư điều hành cấp cao.`;

      const response = await askAI(prompt);
      setAnalysis(response);
    } catch (err: any) {
      console.error(err);
      setError(language === "vi" ? "Đã có lỗi xảy ra khi kết nối tới máy chủ AI." : "An error occurred connecting to the AI Advisor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[var(--color-primary)] dark:text-[var(--color-accent)] animate-pulse" />
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {language === "vi" ? "Trợ lý AI - Đánh giá rủi ro" : "AI Advisor - Risk Assessment"}
          </span>
        </div>
        {analysis && !loading && (
          <button
            onClick={runAnalysis}
            className="text-slate-400 hover:text-[var(--color-primary)] dark:hover:text-[var(--color-accent)] p-1 rounded-lg transition shrink-0 cursor-pointer"
            title={language === "vi" ? "Phân tích lại" : "Analyze again"}
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {!analysis && !loading && !error && (
        <div className="py-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-primary)]/5 dark:bg-[var(--color-accent)]/5 flex items-center justify-center text-[var(--color-primary)] dark:text-[var(--color-accent)]">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {language === "vi" ? "Hồ sơ: " : "Dossier: "} {record.title}
            </h5>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {language === "vi"
                ? "Sử dụng trí tuệ nhân tạo Gemini để quét sơ bộ rủi ro pháp lý tiềm ẩn và lập tức đề xuất phương án xử lý."
                : "Utilize Gemini AI to perform preliminary checks of legal risks and draft instant strategic actions."}
            </p>
          </div>
          <button
            onClick={runAnalysis}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] dark:bg-[var(--color-accent)] hover:bg-[var(--color-primary-light)] dark:hover:bg-[var(--color-accent-hover)] text-white dark:text-slate-950 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Brain size={14} />
            {language === "vi" ? "Bắt đầu phân tích AI" : "Run AI Analysis"}
          </button>
        </div>
      )}

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[var(--color-primary)] dark:text-[var(--color-accent)] animate-spin" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            {language === "vi"
              ? "Trí tuệ nhân tạo đang phân tích hồ sơ pháp lý..."
              : "AI is analyzing legal provisions and records..."}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400 flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                {language === "vi" ? "Kiểm duyệt Trí tuệ Nhân tạo hoàn tất" : "AI Review Completed"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {language === "vi"
                  ? "Báo cáo phân tích rủi ro tự động được cá nhân hóa cho hồ sơ Ánh Dương Law."
                  : "Automated risk analysis report customized for Ánh Dương Law پرونده."}
              </p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert prose-xs max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto pr-1">
            <div className="markdown-body">
              <Markdown>{analysis}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
