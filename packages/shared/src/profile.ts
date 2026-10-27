import { AREAS, AREA_LABELS, DIMENSIONS, type Area, type Dimension } from "./dimensions";
import type { Payload } from "./payload";
import { HIGH_SCORE, LOW_SCORE } from "./scoring";
import { formatHour, joinList } from "./text";

export interface CofounderNeed {
  summary: string;
  lookFor: string[];
  coverAreas: Area[];
}

export const STRENGTH_PHRASES: Record<Dimension, string> = {
  planning: "plan before you build",
  quality: "test your work and fix what breaks",
  pace: "ship in small, frequent commits",
  exploration: "read the code before you change it",
  steering: "redirect your AI tools when they drift",
};

export const NEED_PHRASES: Record<Dimension, string> = {
  planning: "plans and writes things down before building",
  quality: "writes tests and catches what breaks",
  pace: "keeps shipping momentum",
  exploration: "digs into existing code before changing it",
  steering: "pushes back when the AI goes off track",
};

export function strengths(payload: Payload): Dimension[] {
  return DIMENSIONS.filter((dimension) => (payload.scores[dimension] ?? -1) >= HIGH_SCORE);
}

export function gaps(payload: Payload): Dimension[] {
  return DIMENSIONS.filter((dimension) => {
    const value = payload.scores[dimension];
    return value !== null && value <= LOW_SCORE;
  });
}

export function strongAreas(payload: Payload, threshold = 0.3): Area[] {
  return AREAS.filter((area) => (payload.signals.areas[area] ?? 0) >= threshold);
}

export function missingAreas(payload: Payload, threshold = 0.1): Area[] {
  return AREAS.filter((area) => (payload.signals.areas[area] ?? 0) < threshold);
}

export function peakHour(activeHours: number[]): number | null {
  const peak = Math.max(...activeHours);
  return peak === 0 ? null : activeHours.indexOf(peak);
}

const areaList = (areas: Area[]) => joinList(areas.map((area) => AREA_LABELS[area]));

export function cofounderYouNeed(payload: Payload): CofounderNeed {
  const lookFor = gaps(payload).map((dimension) => NEED_PHRASES[dimension]);
  const coverAreas = missingAreas(payload);
  const strongIn = strongAreas(payload);

  const habits = strengths(payload).map((dimension) => STRENGTH_PHRASES[dimension]);
  const opening = habits.length > 0 ? `You ${joinList(habits)}` : "Your habits are fairly even";
  const areaClause = strongIn.length > 0 ? `, and you're strongest on ${areaList(strongIn)}` : "";

  const asks = [...lookFor];
  if (coverAreas.length > 0) asks.push(`owns ${areaList(coverAreas)}`);
  const closing =
    asks.length > 0
      ? `Look for someone who ${joinList(asks)}.`
      : "Look for someone who matches your habits and brings a different point of view.";

  return { summary: `${opening}${areaClause}. ${closing}`, lookFor, coverAreas };
}

export function howToWorkWithMe(payload: Payload): string[] {
  const { scores, signals } = payload;
  const tips: string[] = [];
  const isHigh = (dimension: Dimension) => (scores[dimension] ?? -1) >= HIGH_SCORE;
  const isLow = (dimension: Dimension) => {
    const value = scores[dimension];
    return value !== null && value <= LOW_SCORE;
  };

  if (isHigh("pace")) tips.push("I ship fast. A quick demo works better for me than a long doc.");
  if (isHigh("planning")) tips.push("Bring me in early. I want to plan before anyone builds.");
  if (isLow("planning")) tips.push("Pull me into a short plan before big changes, or I'll dive straight in.");
  if (isLow("quality")) tips.push("Ask me to add tests on anything critical. I won't always think of it.");
  if (isHigh("quality")) tips.push("I'll push for tests on anything that matters. That's on purpose.");
  if (isHigh("steering")) tips.push("I redirect quickly when something's off. Expect direct feedback.");
  if (isHigh("exploration")) tips.push("Give me time to read the code first. I move faster after that.");

  const peak = peakHour(signals.activeHours);
  if (peak !== null) tips.push(`I'm most active around ${formatHour(peak)}. That's the best time to pair.`);

  return tips.slice(0, 4);
}
