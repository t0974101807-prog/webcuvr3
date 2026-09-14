import { Request, Response, NextFunction } from "express";

export interface RequestInfo {
  requestId: string;
  method: string;
  route: string;
  startTime: number;
  url: string;
}

export const activeRequestsMap = new Map<string, RequestInfo>();

// Simple counter to assist tracing without exposing raw requests
export function getActiveRequestsCount(): number {
  return activeRequestsMap.size;
}

export function getActiveRequestsDetails(): RequestInfo[] {
  return Array.from(activeRequestsMap.values());
}

export function RequestTracker(req: any, res: any, next: NextFunction) {
  const requestId = Math.random().toString(36).substring(7) + '-' + Date.now();
  req.requestId = requestId;
  
  const routePath = req.route ? req.route.path : req.baseUrl + req.path;
  
  const info: RequestInfo = {
    requestId,
    method: req.method,
    route: routePath || req.path || "unknown",
    startTime: Date.now(),
    url: req.originalUrl || req.url || "unknown",
  };
  
  activeRequestsMap.set(requestId, info);
  
  const cleanup = () => {
    activeRequestsMap.delete(requestId);
  };
  
  res.on("finish", cleanup);
  res.on("close", cleanup);
  
  next();
}
