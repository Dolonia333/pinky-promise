import { describe, expect, it } from "vitest";
import { confidenceFor, samplePayload, scale, scoreSignals, type Signals } from "../src";

const empty: Signals = {
  testRunsPerSession: null,
  testFixRate: null,
  exploreBeforeEditRate: null,
  planBeforeCodeRate: null,
  agentRejectRate: null,
  medianCommitLines: null,
  commitsPerActiveDay: null,
  testCommitShare: null,
  activeHours: Array(24).fill(0),
  areas: {},
  sharedRepos: { count: 0, separateAreasRate: null, buildsOnOthersRate: null, coAuthoredRate: null },
};

describe("scale", () => {
  it("maps a range onto 0 to 100 and clamps", () => {
    expect(scale(0.3, 0, 0.6)).toBe(50);
    expect(scale(2, 0, 1)).toBe(100);
    expect(scale(-1, 0, 1)).toBe(0);
    expect(scale(null, 0, 1)).toBeNull();
  });

  it("supports inverted ranges where smaller is better", () => {
    expect(scale(20, 400, 20)).toBe(100);
    expect(scale(400, 400, 20)).toBe(0);
  });
});

describe("scoreSignals", () => {
  it("returns null scores when there is no evidence", () => {
    expect(scoreSignals(empty)).toEqual({
      planning: null,
      quality: null,
      pace: null,
      exploration: null,
      steering: null,
    });
  });

  it("scores git-only evidence without session dimensions", () => {
    const scores = scoreSignals({ ...empty, commitsPerActiveDay: 5, medianCommitLines: 20, testCommitShare: 0.35 });
    expect(scores.pace).toBe(100);
    expect(scores.quality).toBe(100);
    expect(scores.planning).toBeNull();
    expect(scores.steering).toBeNull();
  });

  it("rewards planning before code", () => {
    const planner = scoreSignals({ ...empty, planBeforeCodeRate: 0.6, exploreBeforeEditRate: 0.9 });
    const diver = scoreSignals({ ...empty, planBeforeCodeRate: 0, exploreBeforeEditRate: 0.1 });
    expect(planner.planning).toBe(100);
    expect(diver.planning).toBeLessThan(10);
  });

  it("produces whole numbers between 0 and 100", () => {
    for (const value of Object.values(samplePayload.scores)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});

describe("confidenceFor", () => {
  it("labels by how much evidence backs each score", () => {
    const scores = { planning: 50, quality: 50, pace: 50, exploration: null, steering: 50 };
    expect(confidenceFor(scores, { repos: 1, commits: 200, sessions: 3 })).toEqual({
      planning: "weak",
      quality: "medium",
      pace: "strong",
      exploration: "none",
      steering: "weak",
    });
  });
});

describe("AI history signals", () => {
  const chatOnly: Signals = {
    ...empty,
    chat: {
      conversations: 120,
      planFirstRate: 0.5,
      researchFirstRate: 0.6,
      verifyRate: 0.2,
      pushbackRate: 0.25,
      revisionsPerConversation: 1.5,
      conversationsPerActiveDay: 4,
    },
  };

  it("scores every dimension from chat history alone", () => {
    expect(scoreSignals(chatOnly)).toEqual({ planning: 100, quality: 50, pace: 100, exploration: 100, steering: 100 });
  });

  it("averages chat history with coding evidence", () => {
    const both = scoreSignals({ ...chatOnly, agentRejectRate: 0 });
    expect(both.steering).toBe(50);
  });

  it("counts conversations as evidence", () => {
    const scores = scoreSignals(chatOnly);
    expect(confidenceFor(scores, { repos: 0, commits: 0, sessions: 0, conversations: 120 })).toEqual({
      planning: "strong",
      quality: "strong",
      pace: "medium",
      exploration: "strong",
      steering: "strong",
    });
  });
});
