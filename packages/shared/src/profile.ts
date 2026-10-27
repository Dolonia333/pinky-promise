import {
  AREAS,
  AREA_LABELS,
  DIMENSIONS,
  TOPICS,
  TOPIC_LABELS,
  type Area,
  type Dimension,
  type Topic,
} from "./dimensions";
import type { Payload } from "./payload";
import { HIGH_SCORE, LOW_SCORE } from "./scoring";
import { formatHour, joinList } from "./text";

export type ProfileLike = Pick<Payload, "scores" | "signals" | "confidence">;
export type AreaLabels = Record<Area, string>;

export interface CofounderNeed {
  summary: string;
  lookFor: string[];
  coverAreas: Area[];
}

export type Voice = "builder" | "business";

export const STRENGTH_PHRASES_BY: Record<Voice, Record<Dimension, string>> = {
  builder: {
    planning: "plan before you build",
    quality: "back your work with tests",
    pace: "ship in small, frequent commits",
    exploration: "read the code before you change it",
    steering: "redirect your AI tools when they drift",
  },
  business: {
    planning: "plan before you act",
    quality: "check facts and numbers before anything goes out",
    pace: "move fast and work in short bursts",
    exploration: "research before you decide",
    steering: "push back when your AI tools drift",
  },
};

export const NEED_PHRASES_BY: Record<Voice, Record<Dimension, string>> = {
  builder: {
    planning: "plans and writes things down before building",
    quality: "writes tests and catches what breaks",
    pace: "keeps shipping momentum",
    exploration: "digs into existing code before changing it",
    steering: "pushes back when the AI goes off track",
  },
  business: {
    planning: "plans and writes things down before acting",
    quality: "double-checks the facts and numbers",
    pace: "keeps momentum and moves things forward",
    exploration: "researches the market before deciding",
    steering: "pushes back when the AI goes off track",
  },
};

export const STRENGTH_PHRASES = STRENGTH_PHRASES_BY.builder;
export const NEED_PHRASES = NEED_PHRASES_BY.builder;

const TIPS: Record<Voice, Record<string, string>> = {
  builder: {
    fast: "I ship fast. A quick demo works better for me than a long doc.",
    lowQuality: "Ask me to add tests on anything critical. I won't always think of it.",
    highQuality: "I'll push for tests on anything that matters. That's on purpose.",
    explore: "Give me time to read the code first. I move faster after that.",
    planLow: "Pull me into a short plan before big changes, or I'll dive straight in.",
    planHigh: "Bring me in early. I want to plan before anyone builds.",
  },
  business: {
    fast: "I move fast. A quick call works better for me than a long doc.",
    lowQuality: "Ask me to double-check numbers and claims on anything important.",
    highQuality: "I'll push to check facts and numbers before anything goes out. That's on purpose.",
    explore: "Give me time to research first. I move faster after that.",
    planLow: "Pull me into a short plan before big decisions, or I'll dive straight in.",
    planHigh: "Bring me in early. I want to plan before we decide.",
  },
};

export function strengths(payload: ProfileLike): Dimension[] {
  return DIMENSIONS.filter((dimension) => (payload.scores[dimension] ?? -1) >= HIGH_SCORE);
}

export function gaps(payload: ProfileLike): Dimension[] {
  return DIMENSIONS.filter((dimension) => {
    const value = payload.scores[dimension];
    return value !== null && value <= LOW_SCORE;
  });
}

export function strongAreas(payload: ProfileLike, threshold = 0.3): Area[] {
  return AREAS.filter((area) => (payload.signals.areas[area] ?? 0) >= threshold);
}

export function missingAreas(payload: ProfileLike, threshold = 0.1): Area[] {
  if (Object.keys(payload.signals.areas).length === 0) return [];
  return AREAS.filter((area) => (payload.signals.areas[area] ?? 0) < threshold);
}

export function peakHour(activeHours: number[]): number | null {
  const peak = Math.max(...activeHours);
  return peak === 0 ? null : activeHours.indexOf(peak);
}

export const areaList = (areas: Area[], labels: AreaLabels = AREA_LABELS) =>
  joinList(areas.map((area) => labels[area]));

export function strongTopics(payload: ProfileLike, threshold = 0.25): Topic[] {
  const topics = payload.signals.topics ?? {};
  return TOPICS.filter((topic) => (topics[topic] ?? 0) >= threshold)
    .sort((a, b) => (topics[b] ?? 0) - (topics[a] ?? 0))
    .slice(0, 2);
}

export function cofounderYouNeed(
  payload: ProfileLike,
  labels: AreaLabels = AREA_LABELS,
  voice: Voice = "builder",
): CofounderNeed {
  const lookFor = gaps(payload).map((dimension) => NEED_PHRASES_BY[voice][dimension]);
  const coverAreas = missingAreas(payload);
  const strongIn = strongAreas(payload);
  const focus = strongTopics(payload);

  const habits = strengths(payload).map((dimension) => STRENGTH_PHRASES_BY[voice][dimension]);
  const opening = habits.length > 0 ? `You ${joinList(habits)}` : "Your habits are fairly even";
  const areaClause =
    strongIn.length > 0
      ? `, and you're strongest on ${areaList(strongIn, labels)}`
      : focus.length > 0
        ? `, and most of your work is on ${joinList(focus.map((topic) => TOPIC_LABELS[topic]))}`
        : "";

  const asks = [...lookFor];
  if (coverAreas.length > 0) asks.push(`owns ${areaList(coverAreas, labels)}`);
  const closing =
    asks.length > 0
      ? `Look for someone who ${joinList(asks)}.`
      : "Look for someone who matches your habits and brings a different point of view.";

  return { summary: `${opening}${areaClause}. ${closing}`, lookFor, coverAreas };
}

export function howToWorkWithMe(payload: ProfileLike, voice: Voice = "builder"): string[] {
  const { scores, signals } = payload;
  const tips: string[] = [];
  const text = TIPS[voice];
  const isHigh = (dimension: Dimension) => (scores[dimension] ?? -1) >= HIGH_SCORE;
  const isLow = (dimension: Dimension) => {
    const value = scores[dimension];
    return value !== null && value <= LOW_SCORE;
  };

  if (isHigh("pace")) tips.push(text.fast!);
  if (isHigh("planning")) tips.push(text.planHigh!);
  if (isLow("planning")) tips.push(text.planLow!);
  if (isLow("quality")) tips.push(text.lowQuality!);
  if (isHigh("quality")) tips.push(text.highQuality!);
  if (isHigh("steering")) tips.push("I redirect quickly when something's off. Expect direct feedback.");
  if (isHigh("exploration")) tips.push(text.explore!);

  const peak = peakHour(signals.activeHours);
  if (peak !== null) tips.push(`I'm most active around ${formatHour(peak)}. That's the best time to pair.`);

  return tips.slice(0, 4);
}
