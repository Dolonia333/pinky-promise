import { strToU8, zipSync } from "fflate";

export interface FakeTurn {
  role: "user" | "assistant" | "tool";
  text?: string;
  tool?: string;
  minute: number;
}

const BASE = Date.UTC(2026, 9, 20, 15, 0, 0) / 1000;

export function chatgptConversation(turns: FakeTurn[], options: { day?: number; branchAt?: number } = {}) {
  const start = BASE + (options.day ?? 0) * 86400;
  const mapping: Record<string, unknown> = { root: { message: null, parent: null, children: ["n0"] } };
  turns.forEach((turn, index) => {
    const id = `n${index}`;
    const children = index < turns.length - 1 ? [`n${index + 1}`] : [];
    if (options.branchAt === index + 1) children.push(`alt${index + 1}`);
    mapping[id] = {
      parent: index === 0 ? "root" : `n${index - 1}`,
      children,
      message: {
        author: { role: turn.role, name: turn.tool ?? null },
        create_time: start + turn.minute * 60,
        content: { content_type: "text", parts: [turn.text ?? ""] },
      },
    };
  });
  if (options.branchAt !== undefined) {
    const at = options.branchAt;
    mapping[`alt${at}`] = {
      parent: `n${at - 1}`,
      children: [],
      message: {
        author: { role: turns[at]!.role },
        create_time: start,
        content: { content_type: "text", parts: ["old"] },
      },
    };
  }
  return { create_time: start, current_node: `n${turns.length - 1}`, mapping };
}

export function claudeConversation(turns: FakeTurn[], day = 0) {
  const start = BASE * 1000 + day * 86400000;
  const iso = (minute: number) => new Date(start + minute * 60000).toISOString();
  return {
    created_at: iso(0),
    chat_messages: turns
      .filter((turn) => turn.role !== "tool")
      .map((turn, index) => ({
        sender: turn.role === "user" ? "human" : "assistant",
        text: turn.text ?? "",
        created_at: iso(turn.minute),
        content: [
          { type: "text", text: turn.text ?? "" },
          ...(turns[index + 1]?.role === "tool" ? [{ type: "tool_use", name: turns[index + 1]!.tool }] : []),
        ],
      })),
  };
}

export function zipped(conversations: unknown, folder = ""): Uint8Array {
  return zipSync({
    [`${folder}conversations.json`]: strToU8(JSON.stringify(conversations)),
    [`${folder}user.json`]: strToU8(JSON.stringify({ email: "dana@acme.io", name: "Dana Reyes" })),
  });
}

export const asBytes = (value: unknown) => strToU8(JSON.stringify(value));
