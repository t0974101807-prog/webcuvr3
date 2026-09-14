import { Router } from "express";
import { auth } from "../../middleware/auth";
import db from "../../db/database";
import { logAction } from "../../utils/logger";
import { mapRoleToDb } from "../../utils/role";

const router = Router();

// Lấy danh sách phân quyền (cho Admin)
router.get("/permissions", auth, (req: any, res: any) => {
  try {
    const perms = db.prepare(`SELECT * FROM role_permissions`).all();
    // Transform to object mapping role -> permissions
    const permissionsMap: any = {};
    for (const p of perms as any[]) {
      permissionsMap[p.role] = {
        manageUsers: !!p.manageUsers,
        viewAllRecords: !!p.viewAllRecords,
        editAllRecords: !!p.editAllRecords,
        deleteRecords: !!p.deleteRecords,
        viewReports: !!p.viewReports,
        manageWeb: !!p.manageWeb,
        manageFinance: !!p.manageFinance,
        viewPersonalRecords: !!p.viewPersonalRecords,
        editPersonalRecords: !!p.editPersonalRecords,
        manageEvents: !!p.manageEvents,
        manageLegalDocs: !!p.manageLegalDocs,
        viewEventHistory: !!p.viewEventHistory
      };
    }
    res.json(permissionsMap);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật phân quyền
router.put("/permissions", auth, (req: any, res: any) => {
  try {
    // Chỉ admin và director mới có quyền thực sự sửa
    const userRole = mapRoleToDb(req.session?.user?.role);
    if (userRole !== 'admin' && userRole !== 'director') {
      return res.status(403).json({ error: "Access denied" });
    }

    const permissionsMap = req.body;
    const updatePerm = db.prepare(`
      UPDATE role_permissions 
      SET manageUsers=?, viewAllRecords=?, editAllRecords=?, deleteRecords=?, viewReports=?, manageWeb=?, manageFinance=?, viewPersonalRecords=?, editPersonalRecords=?, manageEvents=?, manageLegalDocs=?, viewEventHistory=?
      WHERE role=?
    `);

    db.transaction(() => {
      for (const [role, perms] of Object.entries(permissionsMap) as any[]) {
        updatePerm.run(
          perms.manageUsers ? 1 : 0,
          perms.viewAllRecords ? 1 : 0,
          perms.editAllRecords ? 1 : 0,
          perms.deleteRecords ? 1 : 0,
          perms.viewReports ? 1 : 0,
          perms.manageWeb ? 1 : 0,
          perms.manageFinance ? 1 : 0,
          perms.viewPersonalRecords ? 1 : 0,
          perms.editPersonalRecords ? 1 : 0,
          perms.manageEvents ? 1 : 0,
          perms.manageLegalDocs ? 1 : 0,
          perms.viewEventHistory ? 1 : 0,
          mapRoleToDb(role)
        );
      }
    })();
    
    logAction(req.session.user, "UPDATE_PERMISSIONS");
    try {
      const io = req.app.get("io");
      if (io) io.emit("permissions_updated");
    } catch (e) {}
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy phân quyền của người dùng hiện tại (cái này trả về ở auth/me luôn là tốt nhất, nhưng có thể gọi thêm)
router.get("/permissions/me", auth, (req: any, res: any) => {
  try {
    const role = req.session?.user?.role;
    if (!role) return res.json({});
    
    const mappedRole = mapRoleToDb(role);
    const p = db.prepare(`SELECT * FROM role_permissions WHERE role=?`).get(mappedRole) as any;
    if (!p) return res.json({});

    res.json({
      manageUsers: !!p.manageUsers,
      viewAllRecords: !!p.viewAllRecords,
      editAllRecords: !!p.editAllRecords,
      deleteRecords: !!p.deleteRecords,
      viewReports: !!p.viewReports,
      manageWeb: !!p.manageWeb,
      manageFinance: !!p.manageFinance,
      viewPersonalRecords: !!p.viewPersonalRecords,
      editPersonalRecords: !!p.editPersonalRecords,
      manageEvents: !!p.manageEvents,
      manageLegalDocs: !!p.manageLegalDocs,
      viewEventHistory: !!p.viewEventHistory
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
