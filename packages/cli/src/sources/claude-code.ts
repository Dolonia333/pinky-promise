import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { classifyCommand, classifyFile, type CommandCategory, type FileKind } from "../classify";

export type ToolKind = "explore" | "edit" | "plan" | "command" | "other";
export type Outcome = "ok" | "error" | "rejected" | "unknown";

export interface ToolCall {
  kind: ToolKind;
  command: CommandCategory | null;
  file: FileKind | null;
  outcome: Outcome;
}

export interface Session {
  id: string;
  cwd: string | null;
  start: Date;
  end: Date;
  prompts: Date[];
  interrupts: number;
  planMode: boolean;
  tools: ToolCall[];
}

interface ContentBlock {
  type?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  is_error?: boolean;
  content?: unknown;
  text?: string;
}

interface Entry {
  type?: string;
  timestamp?: string;
  cwd?: string;
  isSidechain?: boolean;
  isMeta?: boolean;
  isCompactSummary?: boolean;
  permissionMode?: string;
  message?: { role?: string; content?: string | ContentBlock[] };
}

const EXPLORE_TOOLS = new Set(["Read", "Grep", "Glob", "LS", "WebFetch", "WebSearch", "NotebookRead"]);
const EDIT_TOOLS = new Set(["Edit", "MultiEdit", "Write", "NotebookEdit"]);
const PLAN_TOOLS = new Set(["TodoWrite", "TaskCreate", "EnterPlanMode", "ExitPlanMode"]);
const PLAN_FILE = /(^|\/)[^/]*(plan|design|spec|todo)[^/]*\.md$/i;
const REJECTED = /doesn't want to proceed with this tool use|tool use was rejected/i;
const INTERRUPTED = /^\[Request interrupted by user/;
const NOT_A_PROMPT = /^\s*(<command-|<local-command|<system-reminder|<bash-|Caveat:)/;

export function defaultClaudeDir(home = homedir()): string {
  return join(home, ".claude", "projects");
}

export async function findSessionFiles(root: string): Promise<string[]> {
  const projects = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    projects
      .filter((entry) => entry.isDirectory())
      .map(async (project) => {
        const dir = join(root, project.name);
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
        return entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
          .map((entry) => join(dir, entry.name));
      }),
  );
  return files.flat();
}

function stringInput(input: Record<string, unknown> | undefined, key: string): string | null {
  const value = input?.[key];
  return typeof value === "string" ? value : null;
}

export function classifyTool(name: string, input?: Record<string, unknown>): Omit<ToolCall, "outcome"> {
  const filePath = stringInput(input, "file_path") ?? stringInput(input, "notebook_path");
  const file = filePath ? classifyFile(filePath) : null;

  if (PLAN_TOOLS.has(name)) return { kind: "plan", command: null, file: null };
  if (name === "Write" && filePath && PLAN_FILE.test(filePath)) return { kind: "plan", command: null, file: null };
  if (EDIT_TOOLS.has(name)) return { kind: "edit", command: null, file };
  if (EXPLORE_TOOLS.has(name)) return { kind: "explore", command: null, file };
  if (name === "Bash") {
    const command = classifyCommand(stringInput(input, "command") ?? "");
    return { kind: command === "explore" ? "explore" : "command", command, file: null };
  }
  if (name === "Task" || name === "Agent") {
    const agent = stringInput(input, "subagent_type");
    if (agent === "Explore") return { kind: "explore", command: null, file: null };
    if (agent === "Plan") return { kind: "plan", command: null, file: null };
  }
  return { kind: "other", command: null, file: null };
}

function blockText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((block: ContentBlock) => (block?.type === "text" ? (block.text ?? "") : "")).join("\n");
}

export function parseSession(id: string, text: string): Session | null {
  const session: Session = {
    id,
    cwd: null,
    start: new Date(8.64e15),
    end: new Date(-8.64e15),
    prompts: [],
    interrupts: 0,
    planMode: false,
    tools: [],
  };
  const byId = new Map<string, ToolCall>();

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let entry: Entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.isSidechain) continue;

    const time = entry.timestamp ? new Date(entry.timestamp) : null;
    if (time && !Number.isNaN(time.getTime())) {
      if (time < session.start) session.start = time;
      if (time > session.end) session.end = time;
    }
    session.cwd ??= entry.cwd ?? null;
    if (entry.permissionMode === "plan") session.planMode = true;

    const content = entry.message?.content;
    if (entry.type === "assistant" && Array.isArray(content)) {
      for (const block of content) {
        if (block.type !== "tool_use" || !block.name) continue;
        const call: ToolCall = { ...classifyTool(block.name, block.input), outcome: "unknown" };
        session.tools.push(call);
        if (block.id) byId.set(block.id, call);
      }
    }

    if (entry.type === "user" && !entry.isMeta && !entry.isCompactSummary) {
      const blocks = typeof content === "string" ? [{ type: "text", text: content }] : (content ?? []);
      for (const block of blocks) {
        if (block.type === "tool_result" && block.tool_use_id) {
          const call = byId.get(block.tool_use_id);
          if (!call) continue;
          if (REJECTED.test(blockText(block.content))) call.outcome = "rejected";
          else call.outcome = block.is_error ? "error" : "ok";
        } else if (block.type === "text") {
          const value = block.text ?? "";
          if (INTERRUPTED.test(value)) session.interrupts += 1;
          else if (value.trim() && !NOT_A_PROMPT.test(value) && time) session.prompts.push(time);
        }
      }
    }
  }

  const empty = session.prompts.length === 0 && session.tools.length === 0;
  return empty || session.start > session.end ? null : session;
}

export async function readSessions(files: string[]): Promise<Session[]> {
  const sessions = await Promise.all(
    files.map(async (file) => {
      const text = await readFile(file, "utf8").catch(() => "");
      return parseSession(basename(file, ".jsonl"), text);
    }),
  );
  return sessions.filter((session): session is Session => session !== null);
}
