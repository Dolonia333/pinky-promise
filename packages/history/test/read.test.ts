import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { ExportError, parseExport, readExportFile } from "../src";
import { asBytes, chatgptConversation, claudeConversation, zipped } from "./exports";

describe("ChatGPT exports", () => {
  const conversation = chatgptConversation(
    [
      { role: "user", text: "Help me plan a launch", minute: 0 },
      { role: "tool", tool: "web.run", minute: 1 },
      { role: "assistant", text: "Here is a plan", minute: 2 },
      { role: "user", text: "No, shorter please", minute: 3 },
      { role: "assistant", text: "Shorter plan", minute: 4 },
    ],
    { branchAt: 3 },
  );

  it("follows the conversation the person kept and marks edits", () => {
    const [parsed] = parseExport([conversation]);
    expect(parsed!.source).toBe("chatgpt");
    expect(parsed!.turns.map((turn) => [turn.role, turn.tool, turn.edited])).toEqual([
      ["user", null, false],
      ["tool", "search", false],
      ["assistant", null, false],
      ["user", null, true],
      ["assistant", null, false],
    ]);
  });

  it("reads the zip exactly as downloaded, even inside a folder", () => {
    expect(readExportFile(zipped([conversation], "export-2026/"))).toHaveLength(1);
  });

  it("reads conversations.json on its own", () => {
    expect(readExportFile(asBytes([conversation]))).toHaveLength(1);
  });
});

describe("Claude exports", () => {
  it("reads messages and tool use in order", () => {
    const [parsed] = readExportFile(
      zipped([
        claudeConversation([
          { role: "user", text: "Research competitors", minute: 0 },
          { role: "assistant", text: "Searching", minute: 1 },
          { role: "tool", tool: "web_search", minute: 1 },
          { role: "user", text: "Thanks", minute: 2 },
        ]),
      ]),
    );
    expect(parsed!.source).toBe("claude_chat");
    expect(parsed!.turns.map((turn) => [turn.role, turn.tool])).toEqual([
      ["user", null],
      ["assistant", null],
      ["tool", "search"],
      ["user", null],
    ]);
  });
});

describe("files that aren't exports", () => {
  it("explains what went wrong", () => {
    expect(() => readExportFile(asBytes({ hello: "world" }))).toThrow(ExportError);
    expect(() => readExportFile(strToU8("not json"))).toThrow(/couldn't be read/);
    expect(() => readExportFile(zipSync({ "notes.txt": strToU8("hi") }))).toThrow(/No conversations.json/);
  });

  it("accepts an empty export", () => {
    expect(readExportFile(asBytes([]))).toEqual([]);
  });
});
