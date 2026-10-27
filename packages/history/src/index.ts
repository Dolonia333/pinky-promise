import type { Payload } from "@pinky-promise/shared";
import { historyPayload } from "./payload";
import { readExportFile } from "./read";

export { ExportError, type Conversation, type Turn } from "./conversation";
export { historyPayload, HISTORY_VERSION } from "./payload";
export { parseExport, readExportFile } from "./read";
export { chatSignals, topicShares } from "./signals";

export function analyzeExport(bytes: Uint8Array, now = new Date()): Payload {
  return historyPayload(readExportFile(bytes), now);
}
