import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { classifyCommand, classifyFile } from "../classify";
import type { Session, ToolCall } from "./claude-code";

interface Item {
  type?: string;
  role?: string;
  name?: string;
  arguments?: string;
  input?: string;
  call_id?: string;
  output?: unknown;
  action?: { command?: string[] | string };
  content?: Array<{ type?: string; text?: string }>;
  message?: string;
  cwd?: string;
}

interface Line {
  timestamp?: string;
  type?: string;
  payload?: Item;
  id?: string;
}

const SHELL_TOOLS = new Set(["shell", "container.exec", "exec_command", "local_shell"]);
const PLAN_TOOLS = new Set(["update_plan"]);
const PATCH_FILE = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/m;
const REJECTED = /rejected by user|declined by user|user (?:denied|declined)/i;
const INJECTED = /^\s*<(environment_context|user_instructions|user_action|turn_aborted)/;

export function defaultCodexDir(home = homedir(), env: NodeJS.ProcessEnv = process.env): string {
  return join(env.CODEX_HOME?.trim() || join(home, ".codex"), "sessions");
}

export async function findCodexFiles(dir: string, depth = 4): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
    .map((entry) => join(dir, entry.name));
  if (depth === 0) return files;
  const nested = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => findCodexFiles(join(dir, entry.name), depth - 1)),
  );
  return [...files, ...nested.flat()];
}

function parseJson<T>(text: string | undefined): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function commandText(item: Item): string {
  const args = parseJson<{ command?: string[] | string; cmd?: string }>(item.arguments);
  const command = item.action?.command ?? args?.command ?? args?.cmd ?? "";
  const parts = Array.isArray(command) ? command : [command];
  const shellIndex = parts.findIndex((part) => part === "-lc" || part === "-c");
  return shellIndex >= 0 ? parts.slice(shellIndex + 1).join(" ") : parts.join(" ");
}

function patchFile(text: string) {
  const match = text.match(PATCH_FILE);
  return match?.[1] ? classifyFile(match[1].trim()) : null;
}

function toolCall(item: Item): Omit<ToolCall, "outcome"> | null {
  const name = item.name ?? "";
  if (item.type === "web_search_call") return { kind: "explore", command: null, file: null };
  if (PLAN_TOOLS.has(name)) return { kind: "plan", command: null, file: null };
  if (name === "apply_patch")
    return { kind: "edit", command: null, file: patchFile(item.input ?? item.arguments ?? "") };
  if (item.type === "local_shell_call" || SHELL_TOOLS.has(name)) {
    const command = commandText(item);
    if (/^\s*apply_patch\b/.test(command)) return { kind: "edit", command: null, file: patchFile(command) };
    const category = classifyCommand(command);
    return { kind: category === "explore" ? "explore" : "command", command: category, file: null };
  }
  if (item.type === "function_call" || item.type === "custom_tool_call")
    return { kind: "other", command: null, file: null };
  return null;
}

function outcomeOf(output: unknown): ToolCall["outcome"] {
  const text = typeof output === "string" ? output : JSON.stringify(output ?? "");
  if (REJECTED.test(text)) return "rejected";
  const parsed = typeof output === "string" ? parseJson<{ metadata?: { exit_code?: number } }>(output) : null;
  const exitCode = parsed?.metadata?.exit_code ?? Number(text.match(/exit(?:_| )code:?\s*(-?\d+)/i)?.[1] ?? NaN);
  if (Number.isNaN(exitCode)) return "unknown";
  return exitCode === 0 ? "ok" : "error";
}

function messageText(item: Item): string {
  return (item.content ?? []).map((part) => part.text ?? "").join("\n");
}

export function parseCodexSession(id: string, text: string): Session | null {
  const session: Session = {
    id,
    source: "codex",
    cwd: null,
    start: new Date(8.64e15),
    end: new Date(-8.64e15),
    prompts: [],
    interrupts: 0,
    planMode: false,
    tools: [],
  };
  const byCallId = new Map<string, ToolCall>();
  const eventPrompts: Date[] = [];
  const itemPrompts: Date[] = [];
  let lastTime: Date | null = null;

  for (const raw of text.split("\n")) {
    if (!raw.trim()) continue;
    const line = parseJson<Line & Item>(raw);
    if (!line) continue;
    const wrapped = line.payload !== undefined && typeof line.type === "string";
    const item: Item = wrapped ? (line.payload as Item) : line;
    const kind = wrapped ? line.type : "response_item";

    const time = line.timestamp ? new Date(line.timestamp) : null;
    if (time && !Number.isNaN(time.getTime())) {
      lastTime = time;
      if (time < session.start) session.start = time;
      if (time > session.end) session.end = time;
    }
    if ((kind === "session_meta" || kind === "turn_context") && item.cwd) session.cwd ??= item.cwd;

    if (kind === "event_msg") {
      if (item.type === "user_message" && lastTime && !INJECTED.test(item.message ?? "")) eventPrompts.push(lastTime);
      if (item.type === "turn_aborted") session.interrupts += 1;
      continue;
    }
    if (kind !== "response_item") continue;

    if (item.type === "message" && item.role === "user") {
      const body = messageText(item);
      if (body.trim() && !INJECTED.test(body) && lastTime) itemPrompts.push(lastTime);
      continue;
    }
    if (item.type === "function_call_output" || item.type === "custom_tool_call_output") {
      const call = item.call_id ? byCallId.get(item.call_id) : undefined;
      if (call) call.outcome = outcomeOf(item.output);
      continue;
    }
    const call = toolCall(item);
    if (!call) continue;
    const entry: ToolCall = { ...call, outcome: "unknown" };
    session.tools.push(entry);
    if (item.call_id) byCallId.set(item.call_id, entry);
  }

  session.prompts = eventPrompts.length > 0 ? eventPrompts : itemPrompts;
  const empty = session.prompts.length === 0 && session.tools.length === 0;
  return empty || session.start > session.end ? null : session;
}

export async function readCodexSessions(files: string[]): Promise<Session[]> {
  const sessions = await Promise.all(
    files.map(async (file) =>
      parseCodexSession(basename(file, ".jsonl"), await readFile(file, "utf8").catch(() => "")),
    ),
  );
  return sessions.filter((session): session is Session => session !== null);
}
