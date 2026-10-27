import { describe, expect, it } from "vitest";
import { HABITS, QUESTIONS, archetypeById, picksForBalance, picksForHabit, picksForLean, picksForSplit, scorePicks } from "./founder-quiz.ts";

describe("founder quiz", () => {
  it("offers each habit six times, and every answer states a cost first", () => {
    expect(QUESTIONS).toHaveLength(10);
    for (const habit of HABITS) {
      const offered = QUESTIONS.flatMap((question) => question.answers).filter((item) => item.kind === habit);
      expect(offered).toHaveLength(6);
    }
    for (const question of QUESTIONS) {
      expect(new Set(question.answers.map((item) => item.kind)).size).toBe(3);
      for (const item of question.answers) expect(item.text.indexOf(" — ")).toBeGreaterThan(8);
    }
  });

  it("names the habit when it leads, including by a single pick", () => {
    for (const habit of HABITS) {
      const result = scorePicks(picksForHabit(habit));
      expect(archetypeById(result.archetypeId).habit).toBe(habit);
      expect(result.counts[habit]).toBe(6);
      expect(result.aheadBy).toBeGreaterThanOrEqual(2);
    }
    const lean = scorePicks(picksForLean());
    expect(lean.archetypeId).toBe("scout");
    expect(lean.aheadBy).toBe(1);
  });

  it("calls a real tie The All-Rounder and a two-way tie The Wildcard", () => {
    expect(scorePicks(picksForBalance()).archetypeId).toBe("allrounder");
    expect(scorePicks(picksForSplit()).archetypeId).toBe("wildcard");
    expect(scorePicks([]).archetypeId).toBe("fresh");
  });
});
