import { DIMENSIONS, type Confidence, type Dimension } from "./dimensions";
import type { ConfidenceMap, Counts, Scores, Signals } from "./payload";

type Part = [value: number | null, weight: number];

export const HIGH_SCORE = 65;
export const LOW_SCORE = 40;

export function scale(value: number | null, low: number, high: number): number | null {
  if (value === null) return null;
  const position = ((value - low) / (high - low)) * 100;
  return Math.min(100, Math.max(0, position));
}

function blend(parts: Part[]): number | null {
  const present = parts.filter((part): part is [number, number] => part[0] !== null);
  const totalWeight = present.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight === 0) return null;
  const weighted = present.reduce((sum, [value, weight]) => sum + value * weight, 0);
  return Math.round(weighted / totalWeight);
}

export function scoreSignals(signals: Signals): Scores {
  return {
    planning: blend([
      [scale(signals.planBeforeCodeRate, 0, 0.6), 0.8],
      [scale(signals.exploreBeforeEditRate, 0, 0.9), 0.2],
    ]),
    quality: blend([
      [scale(signals.testRunsPerSession, 0, 3), 0.35],
      [scale(signals.testFixRate, 0, 1), 0.35],
      [scale(signals.testCommitShare, 0, 0.35), 0.3],
    ]),
    pace: blend([
      [scale(signals.commitsPerActiveDay, 0.5, 5), 0.6],
      [scale(signals.medianCommitLines, 400, 20), 0.4],
    ]),
    exploration: blend([[scale(signals.exploreBeforeEditRate, 0, 0.9), 1]]),
    steering: blend([[scale(signals.agentRejectRate, 0, 0.25), 1]]),
  };
}

function level(amount: number, strong: number, medium: number): Confidence {
  if (amount >= strong) return "strong";
  if (amount >= medium) return "medium";
  return "weak";
}

const EVIDENCE: Record<Dimension, (counts: Counts) => Confidence> = {
  planning: (counts) => level(counts.sessions, 30, 8),
  exploration: (counts) => level(counts.sessions, 30, 8),
  steering: (counts) => level(counts.sessions, 30, 8),
  pace: (counts) => level(counts.commits, 150, 40),
  quality: (counts) => {
    if (counts.sessions >= 30 && counts.commits >= 100) return "strong";
    if (counts.sessions >= 8 || counts.commits >= 50) return "medium";
    return "weak";
  },
};

export function confidenceFor(scores: Scores, counts: Counts): ConfidenceMap {
  const entries = DIMENSIONS.map((dimension) => [
    dimension,
    scores[dimension] === null ? "none" : EVIDENCE[dimension](counts),
  ]);
  return Object.fromEntries(entries) as ConfidenceMap;
}

export function scoreProfile(signals: Signals, counts: Counts): { scores: Scores; confidence: ConfidenceMap } {
  const scores = scoreSignals(signals);
  return { scores, confidence: confidenceFor(scores, counts) };
}
