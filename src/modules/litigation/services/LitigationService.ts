import { LitigationCase } from "../types";

export class LitigationService {
  /**
   * Validate parameters specifically for Litigation cases
   */
  public static validateLitigation(caseData: Partial<LitigationCase>): string | null {
    if (!caseData.title?.trim()) {
      return "Tiêu đề hồ sơ tranh tụng không được để trống";
    }
    if (!caseData.client?.trim()) {
      return "Thông tin khách hàng là bắt buộc";
    }
    return null;
  }

  /**
   * Generates specific timeline milestones for litigation proceedings
   */
  public static getLitigationTimeline(caseData: LitigationCase) {
    return [
      {
        phase: "Thụ lý vụ án",
        date: caseData.date || new Date().toLocaleDateString("vi-VN"),
        details: "Tòa án đã chính thức cấp thông báo thụ lý hồ sơ tranh tụng."
      },
      {
        phase: "Chuẩn bị xét xử",
        date: caseData.trialDate || "Chờ cập nhật",
        details: "Luật sư thu thập hồ sơ chứng cứ và làm việc với Thẩm phán."
      }
    ];
  }
}
