import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export interface FakeCommit {
  author: "me" | "teammate";
  message: string;
  files: Record<string, string>;
  date: string;
  coAuthor?: string;
}

export const ME = { name: "Maya Lopez", email: "maya@acme.io" };
export const TEAMMATE = { name: "Jordan Reyes", email: "jordan@acme.io" };

export function tempDir(prefix = "pinky-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function makeRepo(dir: string, commits: FakeCommit[]): string {
  mkdirSync(dir, { recursive: true });
  const git = (args: string[], env: Record<string, string> = {}) =>
    execFileSync("git", args, { cwd: dir, env: { ...process.env, ...env }, stdio: "pipe" });

  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", ME.name]);
  git(["config", "user.email", ME.email]);
  git(["config", "commit.gpgsign", "false"]);

  for (const commit of commits) {
    for (const [path, content] of Object.entries(commit.files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), content);
    }
    const person = commit.author === "me" ? ME : TEAMMATE;
    const message = commit.coAuthor ? `${commit.message}\n\nCo-authored-by: ${commit.coAuthor}` : commit.message;
    git(["add", "-A"]);
    git(["commit", "-q", "-m", message], {
      GIT_AUTHOR_NAME: person.name,
      GIT_AUTHOR_EMAIL: person.email,
      GIT_AUTHOR_DATE: commit.date,
      GIT_COMMITTER_NAME: person.name,
      GIT_COMMITTER_EMAIL: person.email,
      GIT_COMMITTER_DATE: commit.date,
    });
  }
  return dir;
}

export function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

export function installSession(claudeDir: string, project: string, id: string, text: string): void {
  const dir = join(claudeDir, project);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}.jsonl`), text);
}
