import { Request, Response, NextFunction } from "express";

export function requireRole(role: string) {
  return (req: any, res: any, next: NextFunction) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập", success: false });
    }
    // Strict role check
    if (req.session.user.role !== role && req.session.user.role !== "admin" && req.session.user.role !== "director") {
      return res.status(403).json({ error: "Truy cập bị từ chối do không đủ thẩm quyền", success: false });
    }
    next();
  };
}
