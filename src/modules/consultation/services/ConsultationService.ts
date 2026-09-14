import { ConsultationCase } from "../types";

export class ConsultationService {
  /**
   * Validate parameters specifically for Legal Consultation cases
   */
  public static validateConsultation(caseData: Partial<ConsultationCase>): string | null {
    if (!caseData.title?.trim()) {
      return "Tiêu đề hồ sơ tư vấn không được để trống";
    }
    return null;
  }

  /**
   * Generates specialized timeline milestones for consultation deliverables
   */
  public static getConsultationTimeline(caseData: ConsultationCase) {
    return [
      {
        phase: "Nghiên cứu văn bản pháp lý",
        date: caseData.date || new Date().toLocaleDateString("vi-VN"),
        details: "Chuyên viên phân tích điều khoản luật liên quan đến yêu cầu tư vấn."
      },
      {
        phase: "Phát hành thư tư vấn",
        date: caseData.legalOpinionDate || "Chờ ban hành",
        details: "Gửi Thư ý kiến pháp lý chính thức tới khách hàng."
      }
    ];
  }
}
