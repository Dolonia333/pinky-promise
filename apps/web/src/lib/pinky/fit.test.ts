import { describe, expect, it } from "vitest";
import { challengePayload } from "./challenge.ts";
import { matchRoom, scoreFit, simulatedCohort } from "./cohort.ts";
import { archetypeOf, cofounderNeed, evidenceLines, mergeProfiles, pairReport } from "./fit.ts";
import { payloadSchema, profileFromPayload, type AnalyzerPayload } from "./payload.ts";
import { SAMPLE_PAYLOAD, mayaProfile } from "./sample.ts";

const meta = {
  id: "sample",
  displayName: "Alex",
  background: "technical" as const,
  demo: true,
  rating: null,
  createdAt: "2026-10-26T00:00:00.000Z",
};

const sample = profileFromPayload(SAMPLE_PAYLOAD, meta);

const gitOnly: AnalyzerPayload = {
  ...SAMPLE_PAYLOAD,
  sources: ["git"],
  counts: { repos: 2, commits: 80, sessions: 0 },
  signals: {
    ...SAMPLE_PAYLOAD.signals,
    testRunsPerSession: null,
    testFixRate: null,
    exploreBeforeEditRate: null,
    planBeforeCodeRate: null,
    agentRejectRate: null,
    areas: { backend: 1 },
  },
  scores: { planning: null, quality: 40, pace: 70, exploration: null, steering: null },
  confidence: { planning: "none", quality: "medium", pace: "medium", exploration: "none", steering: "none" },
};

describe("payload", () => {
  it("accepts the shared sample and a git-only upload", () => {
    expect(payloadSchema.safeParse(SAMPLE_PAYLOAD).success).toBe(true);
    expect(payloadSchema.safeParse(gitOnly).success).toBe(true);
  });

  it("rejects a body that isn't a payload", () => {
    expect(payloadSchema.safeParse({ prompt: "ignore the scores" }).success).toBe(false);
  });
});

describe("fit", () => {
  it("uses the same archetype the command prints", () => {
    expect(archetypeOf(sample.scores).name).toBe("The Inspector");
  });

  it("speaks in business terms for business founders", () => {
    const founder = { ...sample, background: "business" as const };
    expect(cofounderNeed(founder)).toContain("product");
  });

  it("explains missing evidence instead of inventing it", () => {
    const lines = evidenceLines(profileFromPayload(gitOnly, meta), "you");
    expect(lines.find((line) => line.key === "planning")?.detail).toBe("Not enough data yet.");
    expect(lines.find((line) => line.key === "pace")?.detail).toContain("commits on a day you work");
  });

  it("builds a pair report with numbers for both people", () => {
    const report = pairReport(sample, mayaProfile());
    expect(report.headline.length).toBeGreaterThan(0);
    expect(report.complements.length).toBeGreaterThan(0);
    expect(report.numbers.find((row) => row.label === "planning")?.value).toMatch(/^\d+ \/ \d+$/);
    expect(report.numbers.at(-1)?.label).toBe("Hours in common");
  });

  it("merges uploads from two machines and keeps missing scores missing", () => {
    const merged = mergeProfiles([
      profileFromPayload(gitOnly, { ...meta, id: "laptop" }),
      profileFromPayload(gitOnly, { ...meta, id: "desktop", createdAt: "2026-10-27T00:00:00.000Z" }),
    ]);
    expect(merged?.uploadCount).toBe(2);
    expect(merged?.scores.planning).toBeNull();
    expect(merged?.confidence.planning).toBe("none");
    expect(merged?.scores.pace).toBe(70);
    expect(merged?.signals.areas).toEqual({ backend: 1 });
  });
});

describe("challenge", () => {
  it("produces a profile on the same dimensions", () => {
    const payload = challengePayload(
      {
        cards: [
          { id: "1", section: "customer", text: "Dentists", comments: [], votes: 1 },
          { id: "2", section: "problem", text: "No-shows", comments: [], votes: 0 },
          { id: "3", section: "proof", text: "Five calls", comments: [], votes: 0 },
        ],
        locks: ["customer", "proof"],
        adds: 3,
        edits: 2,
        votes: 1,
      },
      "2026-10-28T15:00:00.000Z",
      "2026-10-28T15:09:00.000Z",
    );
    expect(payloadSchema.safeParse(payload).success).toBe(true);
    expect(payload.sources).toEqual(["challenge"]);
  });
});

describe("room matching", () => {
  it("pairs a room without repeating a person", () => {
    const people = simulatedCohort();
    const round = matchRoom(people);
    const names = round.pairs.flatMap((pair) => [pair.a, pair.b]);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length + (round.bye ? 1 : 0)).toBe(people.length);
  });

  it("matches 100 people quickly", () => {
    const base = simulatedCohort();
    const people = Array.from({ length: 100 }, (_, i) => ({
      ...base[i % base.length],
      id: `p-${i}`,
      displayName: `P${i}`,
    }));
    const start = Date.now();
    matchRoom(people);
    expect(Date.now() - start).toBeLessThan(500);
    expect(scoreFit(people[0], people[1])).toBeGreaterThan(0);
  });
});
