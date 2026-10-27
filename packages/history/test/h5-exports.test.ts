import { describe, expect, it } from "vitest";
import { ExportError, analyzeExport } from "../src/index.ts";
import { asBytes, chatgptConversation, claudeConversation, zipped } from "./exports.ts";

/** H5 — three real-shaped exports should produce rateable profiles. */
describe("H5 sample exports", () => {
  it("reads a ChatGPT zip about customers and sales", () => {
    const bytes = zipped([
      chatgptConversation([
        { role: "user", text: "Who is the customer for our B2B sales tool?", minute: 0 },
        { role: "assistant", text: "Ops leads at mid-market SaaS.", minute: 1 },
        { role: "user", text: "Draft a one-pager and a price.", minute: 3 },
        { role: "assistant", text: "Here is a rough one-pager.", minute: 4 },
      ]),
    ]);
    const payload = analyzeExport(bytes);
    expect(payload.sources).toContain("chatgpt");
    expect(payload.signals.topics?.customers ?? 0).toBeGreaterThan(0);
    expect(payload.signals.topics?.sales ?? 0).toBeGreaterThan(0);
    expect(Object.values(payload.scores).some((score) => score !== null)).toBe(true);
  });

  it("reads a Claude JSON about product and fundraising", () => {
    const bytes = asBytes([
      claudeConversation([
        { role: "user", text: "Plan the product roadmap before we raise.", minute: 0 },
        { role: "assistant", text: "Start with one wedge feature.", minute: 1 },
        { role: "user", text: "Search comparable seed rounds for fundraising comps.", minute: 2 },
        { role: "tool", tool: "search", minute: 3 },
        { role: "assistant", text: "Three comps.", minute: 4 },
      ]),
    ]);
    const payload = analyzeExport(bytes);
    expect(payload.sources).toContain("claude_chat");
    expect((payload.signals.topics?.product ?? 0) + (payload.signals.topics?.fundraising ?? 0)).toBeGreaterThan(0);
  });

  it("rejects junk that is not an export", () => {
    expect(() => analyzeExport(asBytes({ hello: "world" }))).toThrow(ExportError);
  });
});
