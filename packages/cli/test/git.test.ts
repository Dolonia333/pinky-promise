import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readCommits, readIdentity } from "../src/sources/git";
import { ME, makeRepo, tempDir } from "./helpers";

describe("readCommits", () => {
  const repo = makeRepo(join(tempDir(), "acme"), [
    {
      author: "teammate",
      message: "Set up server",
      files: { "server/index.ts": "a\nb\n" },
      date: "2026-09-01T10:00:00",
    },
    { author: "me", message: "Add login page", files: { "web/Login.tsx": "x\ny\nz\n" }, date: "2026-09-02T14:00:00" },
    {
      author: "me",
      message: "Test login",
      files: { "web/Login.test.tsx": "t\n" },
      date: "2026-09-03T09:00:00",
      coAuthor: "Jordan Reyes <jordan@acme.io>",
    },
    {
      author: "me",
      message: "Refactor with AI",
      files: { "web/Login.tsx": "x\n" },
      date: "2026-09-04T09:00:00",
      coAuthor: "Claude <noreply@anthropic.com>",
    },
    { author: "me", message: "Ancient work", files: { "old.ts": "o\n" }, date: "2024-01-01T09:00:00" },
  ]);

  it("separates my commits from teammates' and respects the window", async () => {
    const identity = await readIdentity(repo);
    const commits = await readCommits(repo, new Date("2025-10-01"), identity);
    expect(commits).toHaveLength(4);
    expect(commits.filter((commit) => commit.isMine)).toHaveLength(3);
  });

  it("reads line counts and paths", async () => {
    const commits = await readCommits(repo, new Date("2025-10-01"), await readIdentity(repo));
    const login = commits.find((commit) =>
      commit.files.some((file) => file.path === "web/Login.tsx" && file.added === 3),
    );
    expect(login?.files).toEqual([{ path: "web/Login.tsx", added: 3, deleted: 0 }]);
  });

  it("counts human co-authors but not AI tools", async () => {
    const commits = await readCommits(repo, new Date("2025-10-01"), await readIdentity(repo));
    expect(commits.filter((commit) => commit.coAuthored)).toHaveLength(1);
  });

  it("matches extra emails passed on the command line", async () => {
    const identity = await readIdentity(repo, ["JORDAN@acme.io"]);
    const commits = await readCommits(repo, new Date("2025-10-01"), identity);
    expect(commits.every((commit) => commit.isMine)).toBe(true);
    expect(identity.emails.has(ME.email)).toBe(true);
  });

  it("returns nothing for a folder that isn't a repo", async () => {
    expect(await readCommits(tempDir(), new Date("2025-10-01"), await readIdentity(repo))).toEqual([]);
  });
});
