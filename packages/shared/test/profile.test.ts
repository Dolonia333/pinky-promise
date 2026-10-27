import { describe, expect, it } from "vitest";
import {
  cofounderYouNeed,
  howToWorkWithMe,
  joinList,
  profileArchetype,
  samplePartnerPayload,
  samplePayload,
  type Payload,
} from "../src";

function withScores(scores: Payload["scores"], areas: Payload["signals"]["areas"] = {}): Payload {
  return { ...samplePayload, scores, signals: { ...samplePayload.signals, areas } };
}

describe("joinList", () => {
  it("reads like a sentence", () => {
    expect(joinList(["a"])).toBe("a");
    expect(joinList(["a", "b"])).toBe("a and b");
    expect(joinList(["a", "b", "c"])).toBe("a, b, and c");
  });
});

describe("profileArchetype", () => {
  it("names the standout dimension", () => {
    expect(profileArchetype({ planning: 30, quality: 20, pace: 90, exploration: 40, steering: 35 }).name).toBe(
      "The Rocket",
    );
  });

  it("calls out an even profile", () => {
    expect(profileArchetype({ planning: 70, quality: 72, pace: 68, exploration: 75, steering: 66 }).name).toBe(
      "The All-Rounder",
    );
  });

  it("holds back when there is too little evidence", () => {
    expect(profileArchetype({ planning: null, quality: null, pace: 80, exploration: null, steering: null }).name).toBe(
      "The Fresh Start",
    );
  });
});

describe("cofounderYouNeed", () => {
  it("names strengths and the partner who covers the gaps", () => {
    const need = cofounderYouNeed(
      withScores(
        { planning: 20, quality: 25, pace: 90, exploration: 50, steering: 50 },
        { frontend: 0.8, backend: 0.2 },
      ),
    );
    expect(need.summary).toBe(
      "You ship in small, frequent commits, and you're strongest on frontend. " +
        "Look for someone who plans and writes things down before building, writes tests and catches what breaks, " +
        "and owns infrastructure and data.",
    );
    expect(need.coverAreas).toEqual(["infra", "data"]);
  });

  it("still gives advice to a balanced builder", () => {
    const need = cofounderYouNeed(
      withScores(
        { planning: 55, quality: 55, pace: 55, exploration: 55, steering: 55 },
        { frontend: 0.25, backend: 0.25, infra: 0.25, data: 0.25 },
      ),
    );
    expect(need.summary).toContain("Look for someone who matches your habits");
  });
});

describe("howToWorkWithMe", () => {
  it("returns up to four practical tips", () => {
    const tips = howToWorkWithMe(samplePartnerPayload);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips.length).toBeLessThanOrEqual(4);
    expect(tips.at(-1)).toMatch(/most active around/);
  });
});

describe("profiles without coding areas", () => {
  it("doesn't ask for a partner to own every area just because there is no code", () => {
    const need = cofounderYouNeed(withScores({ planning: 80, quality: 30, pace: 50, exploration: 50, steering: 50 }));
    expect(need.coverAreas).toEqual([]);
    expect(need.summary).not.toContain("owns");
  });
});

describe("business wording", () => {
  const founder = {
    ...samplePayload,
    scores: { planning: 80, quality: 30, pace: 75, exploration: 50, steering: 50 },
    signals: { ...samplePayload.signals, areas: {}, topics: { fundraising: 0.5, customers: 0.3, sales: 0.2 } },
  };

  it("describes business founders in their own terms", () => {
    expect(cofounderYouNeed(founder, undefined, "business").summary).toBe(
      "You plan before you act and move fast and work in short bursts, and most of your work is on fundraising and customers. " +
        "Look for someone who double-checks the facts and numbers.",
    );
  });

  it("gives business tips without coding words", () => {
    const tips = howToWorkWithMe(founder, "business").join(" ");
    expect(tips).not.toMatch(/test|code|commit|demo/i);
  });
});
