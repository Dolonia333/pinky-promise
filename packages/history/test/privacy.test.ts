import { describe, expect, it } from "vitest";
import { ExportError, analyzeExport, profileReport } from "../src";
import { chatgptConversation, claudeConversation, zipped } from "./exports";

const NOW = new Date("2026-10-27T18:00:00Z");

const SECRETS = [
  "sk-live-SUPERSECRET123",
  "dana@acme.io",
  "Dana Reyes",
  "Project Bluebird",
  "Acme Robotics",
  "$2.4M",
  "555-0142",
  "plan a launch",
];

function exportWithSecrets() {
  return [
    chatgptConversation([
      { role: "user", text: "Help me plan a launch for Project Bluebird at Acme Robotics", minute: 0 },
      { role: "assistant", text: "Sure, Dana Reyes", minute: 1 },
      { role: "user", text: "Write an email to investors about our $2.4M seed round, call 555-0142", minute: 2 },
      { role: "assistant", text: "Here it is", minute: 3 },
      { role: "user", text: "My key is sk-live-SUPERSECRET123, is this right?", minute: 4 },
    ]),
  ];
}

describe("what leaves the browser", () => {
  it("builds a profile from a ChatGPT export", () => {
    const payload = analyzeExport(zipped(exportWithSecrets()), NOW);
    expect(payload.sources).toEqual(["chatgpt"]);
    expect(payload.counts).toEqual({ repos: 0, commits: 0, sessions: 0, conversations: 1 });
    expect(payload.scores.planning).not.toBeNull();
    expect(payload.signals.areas).toEqual({});
  });

  it("never includes messages, names, emails, numbers they typed, or secrets", () => {
    const uploaded = JSON.stringify(analyzeExport(zipped(exportWithSecrets()), NOW));
    for (const secret of SECRETS) expect(uploaded).not.toContain(secret);
  });

  it("builds a profile from a Claude export too", () => {
    const payload = analyzeExport(
      zipped([claudeConversation([{ role: "user", text: "Outline a hiring plan", minute: 0 }])]),
      NOW,
    );
    expect(payload.sources).toEqual(["claude_chat"]);
    expect(payload.signals.topics).toEqual({ hiring: 1 });
  });

  it("refuses an export with nothing from the last 12 months", () => {
    const old = chatgptConversation([{ role: "user", text: "Plan", minute: 0 }], { day: -800 });
    expect(() => analyzeExport(zipped([old]), NOW)).toThrow(ExportError);
  });
});

describe("the local profile report", () => {
  it("speaks in business terms and repeats nothing the person wrote", () => {
    const lines = profileReport(analyzeExport(zipped(exportWithSecrets()), NOW)).join("\n");
    expect(lines).toContain("Read 1 conversation from");
    expect(lines).not.toMatch(/commit|code/i);
    for (const secret of SECRETS) expect(lines).not.toContain(secret);
  });
});
