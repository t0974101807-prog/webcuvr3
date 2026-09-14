import { Router } from "express";
import { auth } from "../../middleware/auth";
import rateLimit from "express-rate-limit";
import { AuthService } from "./auth.service";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login requests per 15 minutes
  skipSuccessfulRequests: true,
  message: { success: false, message: "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút để bảo đảm an toàn." },
  standardHeaders: true,
  legacyHeaders: false,
});

const handleLogin = (req: any, res: any) => {
  console.log("Login request secure:", req.secure, "protocol:", req.protocol, "headers:", req.headers['x-forwarded-proto']);
  const { username, password, deviceId } = req.body;

  // 1. Find user in database using modular AuthService
  const dbUser = AuthService.findUserByUsernameOrPhone(username);
  if (!dbUser) {
    return res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }

  // 2. Verify password with support for auto password migration
  const isValid = AuthService.verifyAndMigratePassword(password, dbUser);
  if (!isValid) {
    return res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng" });
  }

  // 3. Verify and register device if needed
  const { isNewDevice } = AuthService.handleDeviceVerification(dbUser.id, deviceId, dbUser.known_devices);

  // 4. Fetch full enriched user details
  const user = AuthService.getUserDetails(dbUser.id);
  if (!user) {
    return res.status(500).json({ success: false, message: "Lỗi đồng bộ dữ liệu tài khoản nhân sự" });
  }

  // 5. Establish session & generate secure token
  req.session.user = user;
  const token = AuthService.generateJwtToken(user);

  res.json({ success: true, user, token, isNewDevice });
};

router.post("/login", loginLimiter, handleLogin);
router.post("/auth/login", loginLimiter, handleLogin);

const handleLogout = (req: any, res: any) => {
  if (req.session) {
    req.session.destroy();
  }
  res.json({ success: true });
};

router.post("/logout", auth, handleLogout);
router.post("/auth/logout", auth, handleLogout);

const handleMe = (req: any, res: any) => {
  if (req.session?.user?.id) {
    // Refresh user info in the session to ensure latest roles and positions are kept
    const user = AuthService.getUserDetails(req.session.user.id);
    if (user) {
      req.session.user = user;
      return res.json({ success: true, user });
    }
  }
  res.json({ success: !!req.session?.user, user: req.session?.user || null });
};

router.get("/me", auth, handleMe);
router.get("/auth/me", auth, handleMe);

router.post("/change-password", auth, (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Vui lòng đăng nhập lại" });
  }

  const result = AuthService.changePassword(userId, currentPassword, newPassword);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  res.json({ success: true, message: result.message });
});

export default router;

