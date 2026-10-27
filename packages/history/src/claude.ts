import type { Conversation, ToolKind, Turn } from "./conversation";

interface ClaudeContent {
  type?: string;
  text?: string;
  name?: string;
}

interface ClaudeMessage {
  sender?: string;
  text?: string;
  created_at?: string;
  content?: ClaudeContent[];
}

export interface ClaudeConversation {
  created_at?: string;
  chat_messages: ClaudeMessage[];
}

export function isClaudeExport(value: unknown): value is ClaudeConversation[] {
  return Array.isArray(value) && value.length > 0 && Array.isArray(value[0]?.chat_messages);
}

function toolKind(name: string | undefined): ToolKind {
  const label = (name ?? "").toLowerCase();
  if (/search|fetch|web/.test(label)) return "search";
  if (/repl|analysis|code/.test(label)) return "code";
  if (/artifact|document|file/.test(label)) return "document";
  if (/image/.test(label)) return "image";
  return "other";
}

function parseTime(value: string | undefined): Date | null {
  if (!value) return null;
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? null : time;
}

function toTurns(message: ClaudeMessage): Turn[] {
  const time = parseTime(message.created_at);
  const role = message.sender === "human" ? "user" : message.sender === "assistant" ? "assistant" : null;
  if (!role) return [];

  const content = message.content ?? [];
  const text =
    message.text ||
    content
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("\n");
  const turns: Turn[] = [];
  if (text.trim()) turns.push({ role, time, text, tool: null, edited: false, regenerated: false });
  for (const part of content) {
    if (part.type === "tool_use") {
      turns.push({ role: "tool", time, text: "", tool: toolKind(part.name), edited: false, regenerated: false });
    }
  }
  return turns;
}

export function readClaude(conversations: ClaudeConversation[]): Conversation[] {
  return conversations.map((conversation) => {
    const turns = conversation.chat_messages.flatMap(toTurns);
    const created = parseTime(conversation.created_at) ?? turns.find((turn) => turn.time)?.time ?? new Date(0);
    return { source: "claude_chat", created, turns };
  });
}
