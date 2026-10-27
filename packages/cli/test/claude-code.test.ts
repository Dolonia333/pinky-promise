import { describe, expect, it } from "vitest";
import { classifyTool, findSessionFiles, parseSession, readSessions } from "../src/sources/claude-code";
import { fixture, installSession, tempDir } from "./helpers";

describe("parseSession", () => {
  const session = parseSession("fixture", fixture("session.jsonl"))!;

  it("reads the session timeline", () => {
    expect(session.start.toISOString()).toBe("2026-10-20T15:00:00.000Z");
    expect(session.end.toISOString()).toBe("2026-10-20T15:09:00.000Z");
    expect(session.cwd).toBe("/Users/maya/acme-secret-startup");
  });

  it("counts only real prompts", () => {
    expect(session.prompts).toHaveLength(2);
    expect(session.interrupts).toBe(1);
  });

  it("turns tool calls into kinds and outcomes", () => {
    expect(session.tools.map((tool) => [tool.kind, tool.command, tool.outcome])).toEqual([
      ["explore", null, "ok"],
      ["explore", null, "ok"],
      ["plan", null, "ok"],
      ["edit", null, "ok"],
      ["command", "test", "error"],
      ["edit", null, "rejected"],
      ["command", "test", "ok"],
    ]);
  });

  it("keeps file types, never file paths", () => {
    expect(session.tools[3]!.file).toEqual({ area: "frontend", isTest: false });
    expect(JSON.stringify(session)).not.toContain("acme-secret-startup/src");
  });

  it("ignores subagent work", () => {
    expect(session.tools.some((tool) => tool.command === "test" && tool.outcome === "unknown")).toBe(false);
  });

  it("returns null for files without activity", () => {
    expect(parseSession("empty", '{"type":"summary","summary":"x"}\n')).toBeNull();
    expect(parseSession("garbage", "not json\n")).toBeNull();
  });
});

describe("classifyTool", () => {
  it("treats plan files and plan agents as planning", () => {
    expect(classifyTool("Write", { file_path: "docs/launch-plan.md" }).kind).toBe("plan");
    expect(classifyTool("Task", { subagent_type: "Plan" }).kind).toBe("plan");
    expect(classifyTool("Task", { subagent_type: "Explore" }).kind).toBe("explore");
    expect(classifyTool("Write", { file_path: "src/index.ts" }).kind).toBe("edit");
    expect(classifyTool("mcp__github__create_issue", {}).kind).toBe("other");
  });
});

describe("finding session files", () => {
  it("reads every project folder", async () => {
    const claudeDir = tempDir();
    installSession(claudeDir, "-Users-maya-acme", "one", fixture("session.jsonl"));
    installSession(claudeDir, "-Users-maya-other", "two", fixture("session.jsonl"));
    expect(await findSessionFiles(claudeDir)).toHaveLength(2);
    expect(await readSessions(await findSessionFiles(claudeDir))).toHaveLength(2);
  });

  it("handles a missing folder", async () => {
    expect(await findSessionFiles("/nowhere/at/all")).toEqual([]);
  });
});
