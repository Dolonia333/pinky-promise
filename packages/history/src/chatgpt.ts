import type { Conversation, ToolKind, Turn } from "./conversation";

interface ChatGPTMessage {
  author?: { role?: string; name?: string | null };
  create_time?: number | null;
  content?: { content_type?: string; parts?: unknown[]; text?: string };
}

interface ChatGPTNode {
  message?: ChatGPTMessage | null;
  parent?: string | null;
  children?: string[];
}

export interface ChatGPTConversation {
  create_time?: number | null;
  current_node?: string | null;
  mapping: Record<string, ChatGPTNode>;
}

export function isChatGPTExport(value: unknown): value is ChatGPTConversation[] {
  return Array.isArray(value) && value.length > 0 && typeof value[0]?.mapping === "object";
}

function toolKind(name: string | null | undefined, contentType: string | undefined): ToolKind {
  const label = `${name ?? ""} ${contentType ?? ""}`.toLowerCase();
  if (/browser|web|search|tether/.test(label)) return "search";
  if (/python|code|execution/.test(label)) return "code";
  if (/dall|image/.test(label)) return "image";
  if (/canmore|canvas|document/.test(label)) return "document";
  return "other";
}

function messageText(message: ChatGPTMessage): string {
  const parts = message.content?.parts ?? [];
  const text = parts.filter((part): part is string => typeof part === "string").join("\n");
  return text || message.content?.text || "";
}

function activePath(conversation: ChatGPTConversation): string[] {
  const path: string[] = [];
  const seen = new Set<string>();
  let id = conversation.current_node ?? null;
  while (id && conversation.mapping[id] && !seen.has(id)) {
    seen.add(id);
    path.unshift(id);
    id = conversation.mapping[id].parent ?? null;
  }
  return path;
}

function toTurn(conversation: ChatGPTConversation, id: string): Turn | null {
  const node = conversation.mapping[id];
  const message = node?.message;
  const role = message?.author?.role;
  if (!message || (role !== "user" && role !== "assistant" && role !== "tool")) return null;

  const contentType = message.content?.content_type;
  const siblings = node.parent ? (conversation.mapping[node.parent]?.children?.length ?? 1) : 1;
  const isTool = role === "tool" || contentType === "tether_browsing_display" || contentType === "code";
  return {
    role: isTool ? "tool" : role,
    time: message.create_time ? new Date(message.create_time * 1000) : null,
    text: isTool ? "" : messageText(message),
    tool: isTool ? toolKind(message.author?.name, contentType) : null,
    edited: role === "user" && siblings > 1,
    regenerated: role === "assistant" && siblings > 1,
  };
}

export function readChatGPT(conversations: ChatGPTConversation[]): Conversation[] {
  return conversations.map((conversation) => {
    const turns = activePath(conversation)
      .map((id) => toTurn(conversation, id))
      .filter((turn): turn is Turn => turn !== null && (turn.role === "tool" || turn.text.trim() !== ""));
    const firstTime = turns.find((turn) => turn.time)?.time;
    const created = conversation.create_time ? new Date(conversation.create_time * 1000) : (firstTime ?? new Date(0));
    return { source: "chatgpt", created, turns };
  });
}
