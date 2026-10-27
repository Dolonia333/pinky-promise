import { describe, expect, it } from "vitest";
import {
  ARCHETYPES,
  AXES,
  GROUPS,
  POLES,
  QUESTIONS,
  assertAxisPure,
  complementaryArchetype,
  frictionPoints,
  nextRead,
  picksForArchetype,
  scorePicks,
  typesInGroup,
} from "./founder-quiz.ts";

describe("founder quiz (sixteen types)", () => {
  it("has 24 axis-pure scenes, four groups, sixteen types", () => {
    expect(QUESTIONS).toHaveLength(24);
    expect(GROUPS).toHaveLength(4);
    expect(ARCHETYPES).toHaveLength(16);
    assertAxisPure();
    for (const axis of AXES) {
      expect(QUESTIONS.filter((q) => q.axis === axis)).toHaveLength(6);
    }
    for (const group of GROUPS) {
      expect(typesInGroup(group.id)).toHaveLength(4);
    }
  });

  it("keeps every answer on its question's axis", () => {
    for (const question of QUESTIONS) {
      expect(question.answers).toHaveLength(2);
      const [left, right] = POLES[question.axis];
      expect(question.answers.map((a) => a.kind).sort()).toEqual([left, right].sort());
      for (const answer of question.answers) {
        expect(answer.text.length).toBeLessThanOrEqual(90);
      }
    }
  });

  it("resolves each archetype from a full set of picks", () => {
    for (const archetype of ARCHETYPES) {
      const result = scorePicks(picksForArchetype(archetype));
      expect(result.archetype?.id).toBe(archetype.id);
      expect(result.tied).toEqual([]);
      for (const axis of AXES) {
        expect(result.axes[axis].winner).toBe(archetype.poles[axis]);
      }
      expect(complementaryArchetype(archetype).id).not.toBe(archetype.id);
      expect(frictionPoints(archetype).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("needs four answers before naming a type", () => {
    expect(scorePicks([]).archetype).toBeNull();
    expect(scorePicks(QUESTIONS.slice(0, 3).map((q) => q.answers[0])).archetype).toBeNull();
  });

  it("offers a next read by flipping the narrowest split", () => {
    const archetype = ARCHETYPES[0]!;
    const result = scorePicks(picksForArchetype(archetype));
    const other = nextRead(result);
    expect(other).not.toBeNull();
    expect(other!.id).not.toBe(archetype.id);
  });
});
