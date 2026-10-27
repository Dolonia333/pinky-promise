import { describe, expect, it } from "vitest";
import { chatSignals, parseExport, topicShares } from "../src";
import { intentsOf, topicsOf } from "../src/intent";
import { chatgptConversation } from "./exports";

const planner = chatgptConversation([
  { role: "user", text: "Give me a step-by-step plan to reach our first 10 customers", minute: 0 },
  { role: "assistant", text: "Plan", minute: 1 },
  { role: "user", text: "Now write the cold email for sales outreach", minute: 2 },
  { role: "assistant", text: "Email", minute: 3 },
  { role: "user", text: "Are you sure about those numbers? Cite sources", minute: 4 },
  { role: "assistant", text: "Sources", minute: 5 },
]);

const diver = chatgptConversation(
  [
    { role: "user", text: "Write a pitch deck outline for investors", minute: 0 },
    { role: "assistant", text: "Deck", minute: 1 },
    { role: "user", text: "Too generic, try again", minute: 2 },
    { role: "assistant", text: "Deck v2", minute: 3 },
  ],
  { day: 1 },
);

const researcher = chatgptConversation(
  [
    { role: "user", text: "Compare competitors in our market", minute: 0 },
    { role: "tool", tool: "web.run", minute: 1 },
    { role: "assistant", text: "Comparison", minute: 2 },
    { role: "user", text: "Draft a positioning one-pager", minute: 3 },
    { role: "assistant", text: "One-pager", minute: 4 },
  ],
  { day: 1 },
);

describe("intents and topics", () => {
  it("reads what a message asks for", () => {
    expect([...intentsOf("Help me plan the launch, then write the email")].sort()).toEqual(["draft", "plan"]);
    expect(intentsOf("No, that's not what I asked").has("pushback")).toBe(true);
    expect(intentsOf("Double-check the math").has("verify")).toBe(true);
    expect(intentsOf("What's a good name for a cat?").size).toBe(0);
  });

  it("reads what a message is about", () => {
    expect([...topicsOf("Build a financial model for our seed round")].sort()).toEqual(["finance", "fundraising"]);
  });
});

describe("chatSignals", () => {
  const signals = chatSignals(parseExport([planner, diver, researcher]));

  it("counts conversations and pace", () => {
    expect(signals.conversations).toBe(3);
    expect(signals.conversationsPerActiveDay).toBe(1.5);
  });

  it("measures planning and research before drafting", () => {
    expect(signals.planFirstRate).toBe(0.67);
    expect(signals.researchFirstRate).toBe(0.33);
  });

  it("measures checking and pushback", () => {
    expect(signals.verifyRate).toBe(0.33);
    expect(signals.pushbackRate).toBe(0.14);
    expect(signals.revisionsPerConversation).toBe(1.3);
  });

  it("splits work into business topics", () => {
    expect(topicShares(parseExport([planner, diver, researcher]))).toEqual({
      customers: 0.25,
      sales: 0.25,
      marketing: 0.25,
      fundraising: 0.25,
    });
  });

  it("returns empty signals for no conversations", () => {
    expect(chatSignals([])).toEqual({
      conversations: 0,
      planFirstRate: null,
      researchFirstRate: null,
      verifyRate: null,
      pushbackRate: null,
      revisionsPerConversation: null,
      conversationsPerActiveDay: null,
    });
  });
});
