export type ExportSource = "chatgpt" | "claude_chat";
export type ToolKind = "search" | "code" | "image" | "document" | "other";

export interface Turn {
  role: "user" | "assistant" | "tool";
  time: Date | null;
  text: string;
  tool: ToolKind | null;
  edited: boolean;
  regenerated: boolean;
}

export interface Conversation {
  source: ExportSource;
  created: Date;
  turns: Turn[];
}

export class ExportError extends Error {}
