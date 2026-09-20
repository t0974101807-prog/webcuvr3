import { EventEmitter } from "node:events";

export type DomainRecordChange = {
  action: "upsert" | "delete";
  domain: string;
  id: string;
  data?: unknown;
  timestamp: string;
};

export const domainRecordEvents = new EventEmitter();

export const emitDomainRecordChange = (change: Omit<DomainRecordChange, "timestamp">) => {
  const payload: DomainRecordChange = {
    ...change,
    timestamp: new Date().toISOString(),
  };
  domainRecordEvents.emit("changed", payload);
  return payload;
};
