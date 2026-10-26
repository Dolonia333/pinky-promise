import { createHash } from "node:crypto";
import type { AuditEvent } from "./store/types.ts";

export const genesisHash = "0".repeat(64);

export function hashAuditEvent(event: Omit<AuditEvent, "hash">): string {
  const body = JSON.stringify([event.seq, event.contractId, event.event, event.actor, event.data, event.prevHash, event.createdAt]);
  return createHash("sha256").update(body).digest("hex");
}

export function verifyAuditChain(events: readonly AuditEvent[]): boolean {
  let prevHash = genesisHash;
  for (const event of events) {
    if (event.prevHash !== prevHash || hashAuditEvent(event) !== event.hash) return false;
    prevHash = event.hash;
  }
  return true;
}
