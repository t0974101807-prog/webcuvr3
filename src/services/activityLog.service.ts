import db from "../db/database";

interface LogPayload {
  username: string;
  actionType: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  moduleName: string;
  description: string;
  ipAddress?: string;
}

/**
 * Hàm dịch vụ ngầm: Tự động chèn nhật ký hoạt động của Admin/Nhân sự vào CSDL
 * Vận hành bất đồng bộ, bảo toàn 100% giao diện UI hiện có của ERP.
 */
export const createActivityLog = async (payload: LogPayload): Promise<void> => {
  try {
    const { username, actionType, moduleName, description, ipAddress } = payload;
    db.prepare(`
      INSERT INTO activity_logs (username, action_type, module_name, description, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(
      username,
      actionType,
      moduleName,
      description,
      ipAddress || "127.0.0.1"
    );
    console.log(`[AI Activity Log Success]: Đã ghi nhận lịch sử thao tác của người dùng @${username}`);
  } catch (logError) {
    // Chỉ ghi lỗi ra bảng điều khiển Server nội bộ, không quăng lỗi ra màn hình làm đơ Form của Admin
    console.error("[AI Activity Log Error]: Không thể lưu nhật ký hệ thống:", logError);
  }
};
