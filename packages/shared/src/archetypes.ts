import { DIMENSIONS, type Dimension } from "./dimensions";
import type { Scores } from "./payload";

export interface Archetype {
  name: string;
  tagline: string;
}

const BY_DIMENSION: Record<Dimension, Archetype> = {
  planning: { name: "The Blueprint", tagline: "Maps it out before building." },
  quality: { name: "The Inspector", tagline: "Trusts what's tested, not what's hoped." },
  pace: { name: "The Rocket", tagline: "Ships in small, fast steps." },
  exploration: { name: "The Scout", tagline: "Reads the terrain before moving." },
  steering: { name: "The Pilot", tagline: "Keeps a firm hand on the AI." },
};

const ALL_ROUNDER: Archetype = { name: "The All-Rounder", tagline: "No weak spot, no single obsession." };
const WILDCARD: Archetype = { name: "The Wildcard", tagline: "No single habit dominates yet." };
const FRESH_START: Archetype = { name: "The Fresh Start", tagline: "Not enough history yet to call it." };

export function rankDimensions(scores: Scores): Array<[Dimension, number]> {
  return DIMENSIONS.flatMap((dimension): Array<[Dimension, number]> => {
    const value = scores[dimension];
    return value === null ? [] : [[dimension, value]];
  }).sort((a, b) => b[1] - a[1]);
}

export function profileArchetype(scores: Scores): Archetype {
  const ranked = rankDimensions(scores);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  if (ranked.length < 3 || !top || !bottom) return FRESH_START;
  if (top[1] < 50) return WILDCARD;
  if (top[1] - bottom[1] < 15) return ALL_ROUNDER;
  return BY_DIMENSION[top[0]];
}
