import { strFromU8, unzipSync } from "fflate";
import { readChatGPT, isChatGPTExport } from "./chatgpt";
import { readClaude, isClaudeExport } from "./claude";
import { ExportError, type Conversation } from "./conversation";

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

function isZip(bytes: Uint8Array): boolean {
  return ZIP_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

function conversationsJson(bytes: Uint8Array): string {
  if (!isZip(bytes)) return strFromU8(bytes);
  const files = unzipSync(bytes, { filter: (file) => /(^|\/)conversations\.json$/.test(file.name) });
  const entry = Object.values(files)[0];
  if (!entry)
    throw new ExportError("No conversations.json in this file. Upload the export exactly as it was downloaded.");
  return strFromU8(entry);
}

export function parseExport(data: unknown): Conversation[] {
  if (isChatGPTExport(data)) return readChatGPT(data);
  if (isClaudeExport(data)) return readClaude(data);
  if (Array.isArray(data) && data.length === 0) return [];
  throw new ExportError("This doesn't look like a ChatGPT or Claude export.");
}

export function readExportFile(bytes: Uint8Array): Conversation[] {
  let data: unknown;
  try {
    data = JSON.parse(conversationsJson(bytes));
  } catch (error) {
    if (error instanceof ExportError) throw error;
    throw new ExportError("This file couldn't be read. Upload the ChatGPT or Claude export file as downloaded.");
  }
  return parseExport(data);
}
