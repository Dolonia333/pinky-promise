import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultCodexDir, findCodexFiles, parseCodexSession, readCodexSessions } from "../src/sources/codex";
import { fixture, installSession, tempDir } from "./helpers";

describe("parseCodexSession", () => {
  const session = parseCodexSession("codex-fixture", fixture("codex-session.jsonl"))!;

  it("reads the timeline and folder", () => {
    expect(session.source).toBe("codex");
    expect(session.cwd).toBe("/Users/maya/acme-secret-startup");
    expect(session.start.toISOString()).toBe("2026-10-21T16:00:00.000Z");
    expect(session.end.toISOString()).toBe("2026-10-21T16:10:00.000Z");
  });

  it("counts real prompts once and skips injected context", () => {
    expect(session.prompts).toHaveLength(2);
    expect(session.interrupts).toBe(1);
  });

  it("turns tool calls into the same actions as Claude Code", () => {
    expect(session.tools.map((tool) => [tool.kind, tool.command, tool.outcome])).toEqual([
      ["explore", "explore", "ok"],
      ["plan", null, "unknown"],
      ["edit", null, "unknown"],
      ["command", "test", "error"],
      ["command", "other", "rejected"],
      ["command", "test", "ok"],
    ]);
    expect(session.tools[2]!.file).toEqual({ area: "frontend", isTest: false });
  });

  it("reads the older Codex layout too", () => {
    const legacy = [
      { id: "old", timestamp: "2025-06-01T10:00:00.000Z", instructions: "" },
      { record_type: "state" },
      { type: "message", role: "user", content: [{ type: "input_text", text: "Add tests" }] },
      {
        type: "function_call",
        name: "shell",
        arguments: JSON.stringify({ command: ["bash", "-lc", "pytest -q"] }),
        call_id: "a",
      },
      {
        type: "function_call_output",
        call_id: "a",
        output: JSON.stringify({ output: "ok", metadata: { exit_code: 0 } }),
      },
    ]
      .map((line) => JSON.stringify(line))
      .join("\n");
    const parsed = parseCodexSession("old", legacy)!;
    expect(parsed.prompts).toHaveLength(1);
    expect(parsed.tools).toEqual([{ kind: "command", command: "test", file: null, outcome: "ok" }]);
  });

  it("returns null for files without activity", () => {
    expect(
      parseCodexSession("empty", '{"timestamp":"2026-10-21T16:00:00Z","type":"session_meta","payload":{}}'),
    ).toBeNull();
  });
});

describe("finding Codex sessions", () => {
  it("looks in dated folders under the sessions folder", async () => {
    const dir = tempDir();
    installSession(join(dir, "2026", "10"), "21", "rollout-1", fixture("codex-session.jsonl"));
    installSession(join(dir, "2026", "09"), "30", "rollout-2", fixture("codex-session.jsonl"));
    const files = await findCodexFiles(dir);
    expect(files).toHaveLength(2);
    expect(await readCodexSessions(files)).toHaveLength(2);
  });

  it("respects CODEX_HOME", () => {
    expect(defaultCodexDir("/home/maya", { CODEX_HOME: "/data/codex" })).toBe("/data/codex/sessions");
    expect(defaultCodexDir("/home/maya", {})).toBe("/home/maya/.codex/sessions");
  });
});
