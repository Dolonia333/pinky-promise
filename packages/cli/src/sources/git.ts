import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { renamedPath } from "../classify";

const run = promisify(execFile);
const RECORD = "\x1e";
const FIELD = "\x1f";
const AI_COAUTHOR = /anthropic\.com|openai\.com|cursor|copilot|codex|claude|\[bot\]/i;

export interface FileChange {
  path: string;
  added: number;
  deleted: number;
}

export interface Commit {
  hash: string;
  parents: string[];
  isMine: boolean;
  time: Date;
  coAuthored: boolean;
  files: FileChange[];
}

export interface Identity {
  emails: Set<string>;
  names: Set<string>;
}

async function git(repo: string, args: string[]): Promise<string> {
  const { stdout } = await run("git", ["-C", repo, ...args], { maxBuffer: 512 * 1024 * 1024 });
  return stdout;
}

async function configValue(repo: string, key: string): Promise<string | null> {
  try {
    const value = (await git(repo, ["config", "--get", key])).trim();
    return value || null;
  } catch {
    return null;
  }
}

export async function readIdentity(repo: string, extraEmails: string[] = []): Promise<Identity> {
  const email = await configValue(repo, "user.email");
  const name = await configValue(repo, "user.name");
  return {
    emails: new Set(
      [email, ...extraEmails].filter((value): value is string => !!value).map((value) => value.toLowerCase()),
    ),
    names: new Set(name ? [name.toLowerCase()] : []),
  };
}

export async function repoRoot(path: string): Promise<string | null> {
  try {
    return (await git(path, ["rev-parse", "--show-toplevel"])).trim() || null;
  } catch {
    return null;
  }
}

export function isMine(identity: Identity, email: string, name: string): boolean {
  return identity.emails.has(email.toLowerCase()) || identity.names.has(name.toLowerCase());
}

export function parseLog(output: string, identity: Identity): Commit[] {
  return output
    .split(RECORD)
    .filter((record) => record.trim())
    .map((record) => {
      const [header = "", ...lines] = record.split("\n");
      const [hash = "", parents = "", email = "", name = "", seconds = "0", trailers = ""] = header.split(FIELD);
      const coAuthors = trailers.split(";").filter((value) => value.trim() && !AI_COAUTHOR.test(value));
      return {
        hash,
        parents: parents.split(" ").filter(Boolean),
        isMine: isMine(identity, email, name),
        time: new Date(Number(seconds) * 1000),
        coAuthored: coAuthors.length > 0,
        files: lines.flatMap(parseNumstat),
      };
    });
}

function parseNumstat(line: string): FileChange[] {
  const [added, deleted, ...rest] = line.split("\t");
  if (added === undefined || deleted === undefined || rest.length === 0) return [];
  return [
    {
      path: renamedPath(rest.join("\t")),
      added: Number(added) || 0,
      deleted: Number(deleted) || 0,
    },
  ];
}

export async function readCommits(repo: string, since: Date, identity: Identity): Promise<Commit[]> {
  const format = `${RECORD}%H${FIELD}%P${FIELD}%ae${FIELD}%an${FIELD}%at${FIELD}%(trailers:key=Co-authored-by,valueonly,separator=;)`;
  const log = (sinceFlag: string) =>
    git(repo, [
      "log",
      "--branches",
      "--no-merges",
      `${sinceFlag}=${since.toISOString()}`,
      "--numstat",
      `--format=${format}`,
    ]);
  try {
    const output = await log("--since-as-filter").catch(() => log("--since"));
    return parseLog(output, identity);
  } catch {
    return [];
  }
}
