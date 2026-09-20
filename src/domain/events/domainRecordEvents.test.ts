import test from "node:test";
import assert from "node:assert/strict";
import { domainRecordEvents, emitDomainRecordChange } from "./domainRecordEvents";

test("emits a canonical upsert change for federated records", () => {
  let received: any;
  const listener = (change: any) => {
    received = change;
  };

  domainRecordEvents.once("changed", listener);
  emitDomainRecordChange({
    action: "upsert",
    domain: "litigation",
    id: "case-1",
    data: { id: "case-1" },
  });

  assert.equal(received.action, "upsert");
  assert.equal(received.domain, "litigation");
  assert.equal(received.id, "case-1");
  assert.equal(typeof received.timestamp, "string");
});

test("emits a canonical delete change for federated records", () => {
  let received: any;
  domainRecordEvents.once("changed", (change) => {
    received = change;
  });

  emitDomainRecordChange({
    action: "delete",
    domain: "federated",
    id: "case-2",
  });

  assert.deepEqual(
    { action: received.action, domain: received.domain, id: received.id },
    { action: "delete", domain: "federated", id: "case-2" }
  );
});
