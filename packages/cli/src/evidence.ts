import { readdir } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { readCommits, readIdentity, repoRoot, type Commit } from "./sources/git";
import { findSessionFiles, readSessions, type Session } from "./sources/claude-code";

export interface Scope {
  root: string;
  project: string | null;
  all: boolean;
  claudeDir: string;
  emails: string[];
  since: Date;
  until: Date;
}

export interface Evidence {
  repos: Commit[][];
  sessions: Session[];
  since: Date;
  until: Date;
}

const SKIP_DIRS = new Set(["node_modules", "vendor", "dist", "build", "target", "Library", "Applications"]);

export function isInside(child: string, parent: string): boolean {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

export async function findGitRepos(dir: string, depth = 3): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  if (entries.some((entry) => entry.name === ".git")) return [dir];
  if (depth === 0) return [];
  const children = entries.filter(
    (entry) => entry.isDirectory() && !entry.name.startsWith(".") && !SKIP_DIRS.has(entry.name),
  );
  const nested = await Promise.all(children.map((entry) => findGitRepos(join(dir, entry.name), depth - 1)));
  return nested.flat();
}

async function selectRepos(scope: Scope, sessions: Session[]): Promise<string[]> {
  if (scope.project) {
    const root = await repoRoot(scope.project);
    return root ? [root] : [];
  }
  const enclosing = await repoRoot(scope.root);
  const found = enclosing ? [enclosing] : await findGitRepos(scope.root);
  if (!scope.all) return found;
  const fromSessions = await Promise.all(
    [...new Set(sessions.map((session) => session.cwd).filter((cwd): cwd is string => !!cwd))].map(repoRoot),
  );
  return [...new Set([...found, ...fromSessions.filter((root): root is string => !!root)])];
}

function inScope(session: Session, scope: Scope, projectRoot: string | null): boolean {
  if (session.start < scope.since || session.start > scope.until) return false;
  if (scope.all && !scope.project) return true;
  if (!session.cwd) return false;
  return isInside(session.cwd, projectRoot ?? scope.root);
}

export async function collectEvidence(scope: Scope): Promise<Evidence> {
  const projectRoot = scope.project ? ((await repoRoot(scope.project)) ?? resolve(scope.project)) : null;
  const allSessions = await readSessions(await findSessionFiles(scope.claudeDir));
  const sessions = allSessions.filter((session) => inScope(session, scope, projectRoot));

  const repoPaths = await selectRepos(scope, sessions);
  const repos = await Promise.all(
    repoPaths.map(async (repo) => {
      const identity = await readIdentity(repo, scope.emails);
      const commits = await readCommits(repo, scope.since, identity);
      return commits.filter((commit) => commit.time <= scope.until);
    }),
  );

  return {
    repos: repos.filter((commits) => commits.some((commit) => commit.isMine)),
    sessions,
    since: scope.since,
    until: scope.until,
  };
}
