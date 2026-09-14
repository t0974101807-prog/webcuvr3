import { ArbitrationCase } from "../types";

export class ArbitrationService {
  /**
   * Validate parameters specifically for Arbitration and Mediation cases
   */
  public static validateArbitration(caseData: Partial<ArbitrationCase>): string | null {
    if (!caseData.title?.trim()) {
      return "Tiêu đề vụ tranh chấp trọng tài không được để trống";
    }
    return null;
  }

  /**
   * Generates specialized timeline milestones for international and commercial arbitration trials
   */
  public static getArbitrationTimeline(caseData: ArbitrationCase) {
    return [
      {
        phase: "Thành lập Hội đồng Trọng tài",
        date: caseData.tribunalEstablishedDate || caseData.date || new Date().toLocaleDateString("vi-VN"),
        details: "Chỉ định Trọng tài viên duy nhất hoặc Hội đồng gồm 3 Trọng tài viên."
      },
      {
        phase: "Phiên họp giải quyết tranh chấp",
        date: caseData.hearingDate || "Chờ ấn định",
        details: "Hội đồng trọng tài triệu tập phiên họp nghe các bên trình bày lập luận."
      }
    ];
  }
}
