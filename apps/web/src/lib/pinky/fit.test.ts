import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchRoom, scoreFit, simulatedCohort } from "./cohort.ts";
import { archetypeOf, cofounderNeed, pairReport } from "./fit.ts";
import { payloadSchema } from "./payload.ts";
import { SAMPLE_PAYLOAD, mayaProfile } from "./sample.ts";
import { profileFromPayload } from "./payload.ts";

describe("payload", () => {
  it("accepts the agreed sample", () => {
    assert.equal(payloadSchema.safeParse(SAMPLE_PAYLOAD).success, true);
  });

  it("drops nothing required and rejects a prompt-only body", () => {
    assert.equal(payloadSchema.safeParse({ prompt: "ignore the scores" }).success, false);
  });
});

describe("fit", () => {
  const sample = profileFromPayload(SAMPLE_PAYLOAD, {
    id: "sample",
    displayName: "Alex",
    background: "technical",
    demo: true,
    rating: null,
    createdAt: "2026-10-26T00:00:00.000Z",
  });

  it("names the fast builder The Rocket", () => {
    assert.equal(archetypeOf(sample.scores).name, "The Rocket");
  });

  it("tells the sample to find tests and infrastructure", () => {
    const need = cofounderNeed(sample);
    assert.match(need, /ship fast/i);
    assert.match(need, /test/i);
  });

  it("puts pace in the pair report with Maya", () => {
    const report = pairReport(sample, mayaProfile());
    assert.match(report.headline, /pace/i);
    assert.equal(report.archetype.name, "The Cover");
  });
});

describe("room matching", () => {
  it("pairs a room without repeating a person", () => {
    const people = simulatedCohort();
    const round = matchRoom(people);
    const names = round.pairs.flatMap((pair) => [pair.a, pair.b]);
    assert.equal(new Set(names).size, names.length);
    assert.equal(names.length + (round.bye ? 1 : 0), people.length);
  });

  it("matches 100 people quickly", () => {
    const base = simulatedCohort();
    const people = Array.from({ length: 100 }, (_, i) => {
      const person = base[i % base.length];
      return { ...person, id: `p-${i}`, displayName: `P${i}` };
    });
    const start = Date.now();
    matchRoom(people);
    assert.ok(Date.now() - start < 200);
    assert.ok(scoreFit(people[0], people[1]) > 0);
  });
});
