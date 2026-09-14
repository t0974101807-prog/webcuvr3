import { RepresentationCase } from "../types";

export class RepresentationService {
  /**
   * Validate parameters specifically for Out-of-court Representation cases
   */
  public static validateRepresentation(caseData: Partial<RepresentationCase>): string | null {
    if (!caseData.title?.trim()) {
      return "Tiêu đề hồ sơ đại diện không được để trống";
    }
    return null;
  }

  /**
   * Generates specialized timeline milestones for out-of-court negotiations
   */
  public static getRepresentationTimeline(caseData: RepresentationCase) {
    return [
      {
        phase: "Đàm phán hòa giải",
        date: caseData.date || new Date().toLocaleDateString("vi-VN"),
        details: "Tham gia tiếp xúc, đàm phán trực tiếp với đối tác hoặc bên thứ ba."
      },
      {
        phase: "Ký kết thỏa thuận",
        date: caseData.targetCompletionDate || "Chờ ký kết",
        details: "Các bên đồng thuận và ký biên bản hòa giải/thương lượng thành công."
      }
    ];
  }
}
