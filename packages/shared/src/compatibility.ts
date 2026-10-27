import { profileArchetype, type Archetype } from "./archetypes";
import { AREAS, AREA_LABELS, DIMENSIONS, type Confidence, type Dimension } from "./dimensions";
import {
  NEED_PHRASES_BY,
  STRENGTH_PHRASES_BY,
  areaList,
  missingAreas,
  strongAreas,
  type AreaLabels,
  type ProfileLike,
  type Voice,
} from "./profile";
import { HIGH_SCORE, LOW_SCORE } from "./scoring";

export interface Founder {
  name: string;
  payload: ProfileLike;
  areaLabels?: AreaLabels;
  voice?: Voice;
}

export interface PairReport {
  archetype: Archetype;
  headline: string;
  complements: string[];
  frictions: string[];
  numbers: {
    hoursOverlap: number | null;
    areaCoverage: number;
    scoreGaps: Record<Dimension, number | null>;
  };
  nextStep: string;
  confidence: Confidence;
  people: Array<{ name: string; archetype: Archetype }>;
}

const BIG_GAP = 35;
const RISKS: Partial<Record<Dimension, string>> = {
  pace: "pace",
  planning: "how much to plan",
  quality: "how much to test",
};

export function hoursOverlap(a: number[], b: number[]): number | null {
  const totalA = a.reduce((sum, value) => sum + value, 0);
  const totalB = b.reduce((sum, value) => sum + value, 0);
  if (totalA === 0 || totalB === 0) return null;
  const shared = a.reduce((sum, value, hour) => sum + Math.min(value / totalA, (b[hour] ?? 0) / totalB), 0);
  return Math.round(shared * 100) / 100;
}

function scoreGaps(a: ProfileLike, b: ProfileLike): Record<Dimension, number | null> {
  const entries = DIMENSIONS.map((dimension) => {
    const left = a.scores[dimension];
    const right = b.scores[dimension];
    return [dimension, left === null || right === null ? null : Math.abs(left - right)];
  });
  return Object.fromEntries(entries) as Record<Dimension, number | null>;
}

function weakestConfidence(a: ProfileLike, b: ProfileLike): Confidence {
  const order: Confidence[] = ["none", "weak", "medium", "strong"];
  const levels = DIMENSIONS.flatMap((dimension) => [a.confidence[dimension], b.confidence[dimension]]).filter(
    (level) => level !== "none",
  );
  if (levels.length === 0) return "none";
  return levels.reduce((lowest, level) => (order.indexOf(level) < order.indexOf(lowest) ? level : lowest));
}

function pairArchetype(
  a: Founder,
  b: Founder,
  gaps: Record<Dimension, number | null>,
  areasComplement: boolean,
): Archetype {
  const values = DIMENSIONS.map((dimension) => gaps[dimension]).filter((gap): gap is number => gap !== null);
  if ((gaps.pace ?? 0) >= BIG_GAP) return { name: "Rocket and Brakes", tagline: "One pushes, one steadies." };
  if (areasComplement) return { name: "Puzzle Pieces", tagline: "Different halves of the same product." };
  const bothPlan = (a.payload.scores.planning ?? 0) >= HIGH_SCORE && (b.payload.scores.planning ?? 0) >= HIGH_SCORE;
  if (bothPlan) return { name: "Two Architects", tagline: "Plenty of plans. Someone has to ship." };
  if (values.length > 0 && values.every((gap) => gap < 15)) {
    return { name: "Mirror Match", tagline: "Easy to work with, same blind spots." };
  }
  return { name: "Balanced Pair", tagline: "Some overlap, some contrast." };
}

export function compareFounders(a: Founder, b: Founder): PairReport {
  const complements: string[] = [];
  const frictions: string[] = [];
  const risks: string[] = [];
  const gaps = scoreGaps(a.payload, b.payload);
  const aVoice = a.voice ?? "builder";
  const bVoice = b.voice ?? "builder";
  const sharedVoice: Voice = aVoice === bVoice ? aVoice : "business";

  for (const dimension of DIMENSIONS) {
    const left = a.payload.scores[dimension];
    const right = b.payload.scores[dimension];
    if (left === null || right === null) continue;

    if (left >= HIGH_SCORE && right <= LOW_SCORE + 5) {
      complements.push(
        `${a.name} brings what ${b.name} is lighter on: someone who ${NEED_PHRASES_BY[aVoice][dimension]}.`,
      );
    } else if (right >= HIGH_SCORE && left <= LOW_SCORE + 5) {
      complements.push(
        `${b.name} brings what ${a.name} is lighter on: someone who ${NEED_PHRASES_BY[bVoice][dimension]}.`,
      );
    } else if (left >= HIGH_SCORE && right >= HIGH_SCORE) {
      complements.push(`You both ${STRENGTH_PHRASES_BY[sharedVoice][dimension]}. That's a shared foundation.`);
    } else if (left <= LOW_SCORE && right <= LOW_SCORE) {
      frictions.push(`Neither of you is someone who ${NEED_PHRASES_BY[sharedVoice][dimension]}. Decide who owns it.`);
      risks.push(RISKS[dimension] ?? dimension);
    }
  }

  if ((gaps.pace ?? 0) >= BIG_GAP) {
    frictions.push('One of you ships much faster. Agree on what "done" means before you start.');
    risks.unshift("pace");
  }
  if ((gaps.planning ?? 0) >= BIG_GAP) {
    frictions.push("One of you plans, one dives in. Agree on how much planning a feature needs.");
    risks.push("how much to plan");
  }

  const overlap = hoursOverlap(a.payload.signals.activeHours, b.payload.signals.activeHours);
  if (overlap !== null && overlap < 0.35) {
    frictions.push("You're active at different hours. Set a daily window where you're both around.");
    risks.push("working hours");
  } else if (overlap !== null && overlap >= 0.6) {
    complements.push("You keep similar hours, so working live together comes naturally.");
  }

  const aOwns = strongAreas(a.payload).filter((area) => missingAreas(b.payload).includes(area));
  const bOwns = strongAreas(b.payload).filter((area) => missingAreas(a.payload).includes(area));
  const areasComplement = aOwns.length > 0 && bOwns.length > 0;
  const aAreas = areaList(aOwns, a.areaLabels ?? AREA_LABELS);
  const bAreas = areaList(bOwns, b.areaLabels ?? AREA_LABELS);
  if (areasComplement) {
    complements.unshift(`${a.name} covers ${aAreas}; ${b.name} covers ${bAreas}.`);
  }

  const covered = AREAS.filter(
    (area) => (a.payload.signals.areas[area] ?? 0) >= 0.15 || (b.payload.signals.areas[area] ?? 0) >= 0.15,
  );
  const uniqueRisks = [...new Set(risks)];

  const opening = areasComplement
    ? `You cover each other's gaps: ${a.name} on ${aAreas}, ${b.name} on ${bAreas}.`
    : complements.length > 0
      ? "You bring different strengths to the table."
      : "You build in similar ways.";
  const headline =
    uniqueRisks.length > 0
      ? `${opening} Your biggest risk is ${uniqueRisks[0]}.`
      : `${opening} No major friction showed up.`;

  const balance = complements.length - frictions.length;
  const nextStep =
    balance >= 1
      ? "Worth a longer trial: build one small feature together this week."
      : balance === 0 && uniqueRisks.length > 0
        ? `Promising, with a clear risk. Talk through ${uniqueRisks[0]} before committing.`
        : "Good collaborators, but you'd leave the same gaps open. Keep looking, or plan to hire for them.";

  return {
    archetype: pairArchetype(a, b, gaps, areasComplement),
    headline,
    complements: complements.length > 0 ? complements : ["No sharp complement in the numbers yet."],
    frictions:
      frictions.length > 0
        ? frictions
        : ["No clear friction in the numbers. Still try a longer trial before you commit."],
    numbers: { hoursOverlap: overlap, areaCoverage: covered.length / AREAS.length, scoreGaps: gaps },
    nextStep,
    confidence: weakestConfidence(a.payload, b.payload),
    people: [
      { name: a.name, archetype: profileArchetype(a.payload.scores) },
      { name: b.name, archetype: profileArchetype(b.payload.scores) },
    ],
  };
}
