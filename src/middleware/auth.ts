import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import db from "../db/database";

import { mapRoleToDb } from "../utils/role";
import { SystemDataAccess } from "../system/data-access/SystemDataAccess";

export function auth(req: any, res: any, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader !== 'Bearer null' && authHeader !== 'Bearer undefined' && authHeader.substring(7).trim() !== '') {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.SESSION_SECRET);
      req.session = req.session || {};
      req.session.user = decoded;
      req.user = decoded;
      return next();
    } catch (err) {
      // Invalid token
    }
  }

  // Fallback to session
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Reject unauthenticated requests. No fake admin, no dev bypass, no curl bypass.
  return res.status(401).json({ error: "Xác thực không hợp lệ hoặc chưa đăng nhập", success: false });
}

export function requireAdmin(req: any, res: any, next: NextFunction) {
  auth(req, res, () => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "login required" });
    }
    
    const role = req.session.user.role;
    if (!role) {
      return res.status(403).json({ error: "admin access required" });
    }
    
    const mappedRole = mapRoleToDb(role);
    if (mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'deputyDirector') {
       return next();
    }

    return res.status(403).json({ error: "admin access required" });
  });
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: any, res: any, next: NextFunction) => {
    auth(req, res, () => {
      const mappedRole = mapRoleToDb(req.user?.role || req.session?.user?.role);
      const normalizedAllowed = allowedRoles.map((role) => mapRoleToDb(role));
      if (normalizedAllowed.includes(mappedRole) || mappedRole === "admin") return next();
      return res.status(403).json({ error: "permission denied" });
    });
  };
}

export function requirePermission(permissionKey: string) {
  return (req: any, res: any, next: NextFunction) => {
    auth(req, res, () => {
      if (!req.session || !req.session.user) {
          return res.status(401).json({ error: "login required" });
      }
      
      const role = req.user?.role || req.session.user.role;
      const mappedRole = mapRoleToDb(role);
      if (mappedRole === 'admin' || mappedRole === 'director' || mappedRole === 'deputyDirector') {
         return next(); // Admins, directors, and deputy directors always have all permissions
      }
      try {
        // Lookup role permissions
        const p = db.prepare(`SELECT * FROM role_permissions WHERE role=?`).get(mappedRole) as any;
        if (p && p[permissionKey]) {
          return next();
        }
      } catch(e) {
        console.error(e);
      }

      return res.status(403).json({ error: "permission denied for " + permissionKey });
    });
  };
}

export function getAccountType(role: string | undefined): 'INTERNAL' | 'PARTNER' | 'CUSTOMER' {
  if (!role) return 'CUSTOMER';
  const r = role.toLowerCase().trim();
  if (r === 'client' || r === 'customer' || r === 'user' || r === 'người dùng' || r === 'nguoi dung' || r === 'khách hàng' || r === 'khach hang') {
    return 'CUSTOMER';
  }
  if (r === 'partner' || r === 'đối tác' || r === 'doi tac') {
    return 'PARTNER';
  }
  return 'INTERNAL';
}

export function getDataScope(user: any): 'ALL' | 'BRANCH' | 'ASSIGNED' | 'OWN' {
  if (!user) return 'OWN';
  const role = mapRoleToDb(user.role);
  
  if (role === 'admin' || role === 'director' || role === 'deputyDirector') {
    return 'ALL';
  }
  
  const accountType = getAccountType(user.role);
  if (accountType === 'CUSTOMER') {
    return 'OWN';
  }
  if (accountType === 'PARTNER') {
    return 'ASSIGNED';
  }
  
  if (role === 'supervisor' || role === 'accountant' || role === 'controller' || role === 'prosecutor') {
    return 'ALL';
  }
  
  if (role === 'manager' || role === 'head_of_department') {
    return 'BRANCH';
  }
  
  return 'ASSIGNED';
}

export function checkResourceAccess(user: any, resourceType: string, resourceId: string): boolean {
  if (!user) return false;
  
  const accountType = getAccountType(user.role);
  const dataScope = getDataScope(user);
  
  if (dataScope === 'ALL') return true;
  
  if (resourceType === 'case' || resourceType === 'record' || resourceType === 'chat') {
    const record = SystemDataAccess.getRecordById(resourceId) ?? (() => {
      try {
        const legacyRow = db.prepare('SELECT * FROM erp_records WHERE id = ?').get(resourceId) as any;
        if (!legacyRow) return null;
        return typeof legacyRow.data === 'string' ? JSON.parse(legacyRow.data) : legacyRow.data;
      } catch (e) {
        return null;
      }
    })();

    if (!record) {
      return true;
    }
    
    const recordData: any = record && typeof record === 'object' && 'data' in record ? ((record as any).data || record) : record;

    if (accountType === 'CUSTOMER') {
      const isClient = user.case_id === resourceId || recordData.client === user.name || recordData.clientIdCard === user.username;
      return !!isClient;
    }
    
    if (accountType === 'PARTNER') {
      const isPartner = recordData.partner === user.name || recordData.mainAssignee === user.name || (recordData.relatedStaff && recordData.relatedStaff.includes(user.name));
      return !!isPartner;
    }
    
    if (dataScope === 'BRANCH') {
      return recordData.branch === user.branch;
    }
    
    if (dataScope === 'ASSIGNED') {
      return recordData.mainAssignee === user.name || recordData.partner === user.name || (recordData.relatedStaff && recordData.relatedStaff.includes(user.name));
    }
  }
  
  return true;
}

export function requireResourceAccess(resourceType: string, idParamName: string = 'id') {
  return (req: any, res: any, next: NextFunction) => {
    auth(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ error: "Xác thực không hợp lệ hoặc chưa đăng nhập", success: false });
      }
      const resourceId = req.params[idParamName] || req.body[idParamName] || req.query[idParamName];
      if (!resourceId) {
        return next();
      }
      
      const hasAccess = checkResourceAccess(req.user, resourceType, resourceId);
      if (hasAccess) {
        return next();
      }
      return res.status(403).json({ error: "permission denied for resource: " + resourceType + "/" + resourceId, success: false });
    });
  };
}
