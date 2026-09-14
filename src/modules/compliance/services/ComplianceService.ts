import { ComplianceCase } from "../types";

export class ComplianceService {
  /**
   * Validate parameters specifically for Legal Compliance cases
   */
  public static validateCompliance(caseData: Partial<ComplianceCase>): string | null {
    if (!caseData.title?.trim()) {
      return "Tiêu đề hồ sơ pháp chế không được để trống";
    }
    return null;
  }

  /**
   * Generates specialized timeline milestones for regulatory audits and company compliance reviews
   */
  public static getComplianceTimeline(caseData: ComplianceCase) {
    return [
      {
        phase: "Khảo sát rủi ro tuân thủ",
        date: caseData.date || new Date().toLocaleDateString("vi-VN"),
        details: "Rà soát điều lệ, quy chế nội bộ và báo cáo các rủi ro pháp lý tiềm ẩn."
      },
      {
        phase: "Ban hành sổ tay tuân thủ",
        date: new Date().toLocaleDateString("vi-VN"),
        details: "Hoàn thiện và ban hành bộ hướng dẫn tuân thủ pháp luật doanh nghiệp."
      }
    ];
  }
}
