import db from "../../db/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../../config/env";
import { validatePassword } from "../../utils/password";
import { enrichUsersWithStaffCode } from "../../utils/staffCode";

export interface AuthenticatedUser {
  id: number;
  username: string;
  name: string;
  role: string;
  title?: string;
  staff_code?: string;
  branch?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  practice_areas?: string;
}

export class AuthService {
  /**
   * Finds a user by their username or phone number.
   */
  public static findUserByUsernameOrPhone(username: string): any {
    try {
      return db.prepare(`SELECT * FROM users WHERE username = ? OR phone = ?`).get(username, username);
    } catch (err) {
      console.error("[AuthService] Error finding user:", err);
      return null;
    }
  }

  /**
   * Verifies the provided password against the stored password (supporting bcrypt & plain-text fallback).
   * Automatically migrates plain-text passwords to bcrypt hashes.
   */
  public static verifyAndMigratePassword(password: string, dbUser: any): boolean {
    if (!dbUser || !dbUser.password) {
      return false;
    }

    let isValid = false;
    const storedPassword = dbUser.password;

    if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
      isValid = bcrypt.compareSync(password, storedPassword);
    } else {
      // Plain text fallback (for soft migration)
      isValid = (storedPassword === password);
      if (isValid) {
        try {
          const hashed = bcrypt.hashSync(password, 10);
          db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, dbUser.id);
          console.log(`[AuthService] Successfully migrated password hash for user: ${dbUser.username}`);
        } catch (migrationErr) {
          console.error("[AuthService] Password migration failed:", migrationErr);
        }
      }
    }

    return isValid;
  }

  /**
   * Registers a new device to the user's known devices list if it isn't already known.
   */
  public static handleDeviceVerification(userId: number, deviceId: string | undefined, knownDevicesStr: string | null): { isNewDevice: boolean; knownDevices: string[] } {
    let knownDevices: string[] = [];
    try {
      knownDevices = knownDevicesStr ? JSON.parse(knownDevicesStr) : [];
      if (!Array.isArray(knownDevices)) {
        knownDevices = [];
      }
    } catch (e) {
      knownDevices = [];
    }

    if (!deviceId) {
      return { isNewDevice: false, knownDevices };
    }

    const isNewDevice = !knownDevices.includes(deviceId);
    if (isNewDevice) {
      knownDevices.push(deviceId);
      try {
        db.prepare('UPDATE users SET known_devices = ? WHERE id = ?').run(JSON.stringify(knownDevices), userId);
      } catch (err) {
        console.error("[AuthService] Failed to update known devices:", err);
      }
    }

    return { isNewDevice, knownDevices };
  }

  /**
   * Fetches full user details by ID, enriched with staff code.
   */
  public static getUserDetails(userId: number): AuthenticatedUser | null {
    try {
      const allUsers = db.prepare(`SELECT id, username, name, role, title, staff_code, branch, start_date, contract_type, contract_sign_date, salary, bonus, avatar, phone, email, dob, gender, address, case_id, practice_areas FROM users`).all();
      const enriched = enrichUsersWithStaffCode(allUsers);
      const user = enriched.find(u => u.id === userId);
      return user || null;
    } catch (err) {
      console.error("[AuthService] Error fetching user details:", err);
      return null;
    }
  }

  /**
   * Changes a user's password after validating constraints and checking correctness of current password.
   */
  public static changePassword(userId: number, currentPassword: string, newPassword: string): { success: boolean; message: string } {
    if (!userId || !currentPassword || !newPassword) {
      return { success: false, message: "Thiếu thông tin mật khẩu" };
    }

    // Validate new password safety
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      return { success: false, message: passwordValidationError };
    }

    // Fetch user
    const dbUser: any = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
    if (!dbUser) {
      return { success: false, message: "Không tìm thấy thông tin tài khoản người dùng" };
    }

    // Verify current password
    let isValid = false;
    if (dbUser.password && (dbUser.password.startsWith('$2b$') || dbUser.password.startsWith('$2a$'))) {
      isValid = bcrypt.compareSync(currentPassword, dbUser.password);
    } else {
      isValid = (dbUser.password === currentPassword);
    }

    if (!isValid) {
      return { success: false, message: "Mật khẩu hiện tại không chính xác" };
    }

    // Update with new hashed password
    try {
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedNewPassword, userId);
      return { success: true, message: "Đổi mật khẩu thành công" };
    } catch (err: any) {
      console.error("[AuthService] Error updating password in database:", err);
      return { success: false, message: "Lỗi hệ thống khi cập nhật mật khẩu" };
    }
  }

  /**
   * Generates a secure JSON Web Token for the user.
   */
  public static generateJwtToken(user: AuthenticatedUser): string {
    return jwt.sign(user as object, config.SESSION_SECRET || 'secret', { expiresIn: '24h' });
  }
}
