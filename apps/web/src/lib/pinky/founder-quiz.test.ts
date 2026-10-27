import { describe, expect, it } from "vitest";
import {
  ARCHETYPES,
  AXES,
  GROUPS,
  QUESTIONS,
  nextRead,
  picksForArchetype,
  scorePicks,
  typesInGroup,
} from "./founder-quiz.ts";

describe("founder quiz (sixteen types)", () => {
  it("has twelve scenes, four groups, and sixteen types", () => {
    expect(QUESTIONS).toHaveLength(12);
    expect(GROUPS).toHaveLength(4);
    expect(ARCHETYPES).toHaveLength(16);
    for (const group of GROUPS) {
      expect(typesInGroup(group.id)).toHaveLength(4);
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
    }
  });

  it("needs three answers before naming a type", () => {
    expect(scorePicks([]).archetype).toBeNull();
    expect(scorePicks(QUESTIONS.slice(0, 2).map((q) => q.answers[0])).archetype).toBeNull();
  });

  it("offers a next read by flipping the narrowest split", () => {
    const archetype = ARCHETYPES[0]!;
    const result = scorePicks(picksForArchetype(archetype));
    const other = nextRead(result);
    expect(other).not.toBeNull();
    expect(other!.id).not.toBe(archetype.id);
  });
});
