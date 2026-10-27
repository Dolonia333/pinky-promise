import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectEvidence } from "../src/evidence";
import { assertOnlyNumbers, buildPayload } from "../src/payload";
import { fixture, installSession, makeRepo, tempDir } from "./helpers";

const SECRETS = [
  "sk-ant-api03-SUPERSECRETKEY",
  "ghp_ABCDEF1234567890",
  "hunter2",
  "maya@acme.io",
  "jordan@acme.io",
  "Maya",
  "Jordan",
  "acme-secret-startup",
  "Nightingale",
  "localStorage",
  "signIn",
  "Login.tsx",
  "/Users/",
  "AKIAIOSFODNN7EXAMPLE",
  "Add login using",
];

async function analyzeFixture() {
  const home = tempDir();
  const projects = join(home, "code");
  makeRepo(join(projects, "acme-secret-startup"), [
    {
      author: "teammate",
      message: "Init Nightingale with AKIAIOSFODNN7EXAMPLE",
      files: { "server/signIn.ts": "export const signIn = () => 'hunter2';\n" },
      date: "2026-09-01T10:00:00",
    },
    {
      author: "me",
      message: "Project Nightingale login for maya@acme.io",
      files: { "web/Login.tsx": "const key = 'sk-ant-api03-SUPERSECRETKEY';\n" },
      date: "2026-09-02T14:00:00",
    },
  ]);
  const claudeDir = join(home, ".claude", "projects");
  installSession(claudeDir, "-Users-maya-acme-secret-startup", "s1", fixture("session.jsonl"));

  const evidence = await collectEvidence({
    root: projects,
    project: null,
    all: true,
    claudeDir,
    emails: [],
    since: new Date("2025-10-27"),
    until: new Date("2026-10-26"),
  });
  return { evidence, payload: buildPayload(evidence, "0.1.0") };
}

describe("finding your work", () => {
  it("finds the project when run from a subfolder inside it", async () => {
    const repo = makeRepo(join(tempDir(), "app"), [
      { author: "me", message: "Start", files: { "web/src/App.tsx": "a\n" }, date: "2026-09-02T14:00:00" },
    ]);
    const evidence = await collectEvidence({
      root: join(repo, "web", "src"),
      project: null,
      all: false,
      claudeDir: join(tempDir(), "none"),
      emails: [],
      since: new Date("2025-10-27"),
      until: new Date("2026-10-26"),
    });
    expect(evidence.repos).toHaveLength(1);
  });
});

describe("what leaves the machine", () => {
  it("finds the evidence it needs", async () => {
    const { payload } = await analyzeFixture();
    expect(payload.counts).toEqual({ repos: 1, commits: 1, sessions: 1 });
    expect(payload.sources).toEqual(["git", "claude_code"]);
  });

  it("never includes prompts, code, paths, names, emails, commit messages, or secrets", async () => {
    const { payload } = await analyzeFixture();
    const uploaded = JSON.stringify(payload);
    for (const secret of SECRETS) expect(uploaded).not.toContain(secret);
  });

  it("contains only numbers and known labels", async () => {
    const { payload } = await analyzeFixture();
    expect(() => assertOnlyNumbers(payload)).not.toThrow();
  });

  it("refuses any free text that slips into a payload", () => {
    expect(() => assertOnlyNumbers({ counts: { repos: 1 }, note: "fix login" })).toThrow(/payload\.note/);
    expect(() => assertOnlyNumbers({ list: [1, "/Users/maya"] })).toThrow(/payload\.list\[1\]/);
  });
});
