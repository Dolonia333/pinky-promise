import { describe, expect, it } from "vitest";
import { matchRoom, scoreFit, simulatedCohort } from "./cohort.ts";

describe("program room matching", () => {
  it("simulates twenty founders", () => {
    expect(simulatedCohort()).toHaveLength(20);
  });

  it("pairs everyone when the room size is even", () => {
    const people = simulatedCohort();
    const round = matchRoom(people);
    expect(round.pairs).toHaveLength(10);
    expect(round.bye).toBeNull();
    const names = new Set(round.pairs.flatMap((pair) => [pair.a, pair.b]));
    expect(names.size).toBe(20);
  });

  it("picks a bye when the room size is odd", () => {
    const people = simulatedCohort().slice(0, 5);
    const round = matchRoom(people);
    expect(round.pairs).toHaveLength(2);
    expect(round.bye).toBeTruthy();
  });

  it("scores complementary backgrounds higher than clones", () => {
    const [a, b] = simulatedCohort();
    const clone = { ...a, id: "clone", displayName: "Clone" };
    expect(scoreFit(a, b)).toBeGreaterThan(0);
    expect(scoreFit(a, clone)).toBeLessThan(scoreFit(a, b) + 40);
  });
});
