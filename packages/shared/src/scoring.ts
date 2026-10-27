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
  const chat = signals.chat;
  return {
    planning: blend([
      [scale(signals.planBeforeCodeRate, 0, 0.6), 0.8],
      [scale(signals.exploreBeforeEditRate, 0, 0.9), 0.2],
      [scale(chat?.planFirstRate ?? null, 0, 0.5), 0.8],
    ]),
    quality: blend([
      [scale(signals.testRunsPerSession, 0, 3), 0.35],
      [scale(signals.testFixRate, 0, 1), 0.35],
      [scale(signals.testCommitShare, 0, 0.35), 0.3],
      [scale(chat?.verifyRate ?? null, 0, 0.4), 0.7],
      [scale(chat?.revisionsPerConversation ?? null, 0, 3), 0.3],
    ]),
    pace: blend([
      [scale(signals.commitsPerActiveDay, 0.5, 5), 0.6],
      [scale(signals.medianCommitLines, 400, 20), 0.4],
      [scale(chat?.conversationsPerActiveDay ?? null, 0.5, 4), 0.6],
    ]),
    exploration: blend([
      [scale(signals.exploreBeforeEditRate, 0, 0.9), 1],
      [scale(chat?.researchFirstRate ?? null, 0, 0.6), 1],
    ]),
    steering: blend([
      [scale(signals.agentRejectRate, 0, 0.25), 1],
      [scale(chat?.pushbackRate ?? null, 0, 0.25), 1],
    ]),
  };
}

function level(amount: number, strong: number, medium: number): Confidence {
  if (amount >= strong) return "strong";
  if (amount >= medium) return "medium";
  return "weak";
}

const sessionsOf = (counts: Counts) => counts.sessions + (counts.conversations ?? 0);

const EVIDENCE: Record<Dimension, (counts: Counts) => Confidence> = {
  planning: (counts) => level(sessionsOf(counts), 30, 8),
  exploration: (counts) => level(sessionsOf(counts), 30, 8),
  steering: (counts) => level(sessionsOf(counts), 30, 8),
  pace: (counts) => level(Math.max(counts.commits, counts.conversations ?? 0), 150, 40),
  quality: (counts) => {
    const sessions = sessionsOf(counts);
    if ((sessions >= 30 && counts.commits >= 100) || (counts.conversations ?? 0) >= 60) return "strong";
    if (sessions >= 8 || counts.commits >= 50) return "medium";
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
