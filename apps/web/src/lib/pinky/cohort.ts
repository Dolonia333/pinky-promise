import { pairReport } from "./fit.ts";
import { profileFromPayload } from "./payload.ts";
import type { AnalyzerPayload } from "./payload.ts";
import type { AreaKey, Background, ProfileInput, Scores } from "./types.ts";
import { AREA_KEYS, SCORE_KEYS } from "./types.ts";

export type CohortPerson = ProfileInput & { domain: string; goals: "full-time" | "nights" };

type Seed = {
  name: string;
  background: Background;
  domain: string;
  goals: "full-time" | "nights";
  scores: Scores;
  areas: Record<AreaKey, number>;
};

const SEEDS: Seed[] = [
  {
    name: "Priya Shah",
    background: "technical",
    domain: "Fintech",
    goals: "full-time",
    scores: { planning: 74, quality: 81, pace: 52, exploration: 63, steering: 70 },
    areas: { frontend: 0.12, backend: 0.46, infra: 0.28, data: 0.14 },
  },
  {
    name: "Andre Blake",
    background: "business",
    domain: "Health",
    goals: "full-time",
    scores: { planning: 86, quality: 64, pace: 58, exploration: 72, steering: 60 },
    areas: { frontend: 0.55, backend: 0.15, infra: 0.1, data: 0.2 },
  },
  {
    name: "Luis Ortega",
    background: "technical",
    domain: "Climate",
    goals: "nights",
    scores: { planning: 48, quality: 44, pace: 86, exploration: 40, steering: 55 },
    areas: { frontend: 0.62, backend: 0.2, infra: 0.1, data: 0.08 },
  },
  {
    name: "Hana Ito",
    background: "both",
    domain: "Education",
    goals: "full-time",
    scores: { planning: 77, quality: 70, pace: 61, exploration: 80, steering: 68 },
    areas: { frontend: 0.34, backend: 0.22, infra: 0.14, data: 0.3 },
  },
  {
    name: "Samira Diallo",
    background: "business",
    domain: "Consumer",
    goals: "full-time",
    scores: { planning: 69, quality: 58, pace: 73, exploration: 66, steering: 62 },
    areas: { frontend: 0.48, backend: 0.12, infra: 0.18, data: 0.22 },
  },
  {
    name: "Jonah Ellis",
    background: "technical",
    domain: "B2B",
    goals: "full-time",
    scores: { planning: 58, quality: 76, pace: 49, exploration: 54, steering: 72 },
    areas: { frontend: 0.1, backend: 0.28, infra: 0.47, data: 0.15 },
  },
  {
    name: "Noor Rahman",
    background: "technical",
    domain: "Health",
    goals: "nights",
    scores: { planning: 80, quality: 83, pace: 41, exploration: 70, steering: 64 },
    areas: { frontend: 0.08, backend: 0.22, infra: 0.18, data: 0.52 },
  },
  {
    name: "Camille Berger",
    background: "business",
    domain: "Climate",
    goals: "full-time",
    scores: { planning: 88, quality: 60, pace: 55, exploration: 74, steering: 71 },
    areas: { frontend: 0.42, backend: 0.1, infra: 0.28, data: 0.2 },
  },
  {
    name: "Theo March",
    background: "technical",
    domain: "Education",
    goals: "full-time",
    scores: { planning: 51, quality: 47, pace: 84, exploration: 46, steering: 58 },
    areas: { frontend: 0.57, backend: 0.25, infra: 0.1, data: 0.08 },
  },
  {
    name: "Imani Brooks",
    background: "both",
    domain: "Consumer",
    goals: "full-time",
    scores: { planning: 73, quality: 69, pace: 66, exploration: 71, steering: 75 },
    areas: { frontend: 0.38, backend: 0.3, infra: 0.16, data: 0.16 },
  },
  {
    name: "Owen Park",
    background: "technical",
    domain: "Fintech",
    goals: "nights",
    scores: { planning: 63, quality: 88, pace: 45, exploration: 52, steering: 60 },
    areas: { frontend: 0.06, backend: 0.54, infra: 0.22, data: 0.18 },
  },
  {
    name: "Leila Haddad",
    background: "business",
    domain: "B2B",
    goals: "full-time",
    scores: { planning: 82, quality: 71, pace: 50, exploration: 68, steering: 77 },
    areas: { frontend: 0.36, backend: 0.14, infra: 0.32, data: 0.18 },
  },
  {
    name: "Mateo Cruz",
    background: "technical",
    domain: "Health",
    goals: "full-time",
    scores: { planning: 70, quality: 62, pace: 78, exploration: 59, steering: 66 },
    areas: { frontend: 0.44, backend: 0.33, infra: 0.13, data: 0.1 },
  },
  {
    name: "Freya Nilsen",
    background: "technical",
    domain: "Climate",
    goals: "full-time",
    scores: { planning: 76, quality: 79, pace: 53, exploration: 64, steering: 58 },
    areas: { frontend: 0.11, backend: 0.2, infra: 0.41, data: 0.28 },
  },
  {
    name: "Kwame Mensah",
    background: "business",
    domain: "Education",
    goals: "nights",
    scores: { planning: 65, quality: 54, pace: 80, exploration: 77, steering: 61 },
    areas: { frontend: 0.5, backend: 0.16, infra: 0.12, data: 0.22 },
  },
  {
    name: "Sasha Klein",
    background: "technical",
    domain: "Consumer",
    goals: "full-time",
    scores: { planning: 57, quality: 50, pace: 82, exploration: 48, steering: 69 },
    areas: { frontend: 0.66, backend: 0.18, infra: 0.08, data: 0.08 },
  },
  {
    name: "Amira Hassan",
    background: "both",
    domain: "Fintech",
    goals: "full-time",
    scores: { planning: 79, quality: 74, pace: 60, exploration: 66, steering: 81 },
    areas: { frontend: 0.22, backend: 0.4, infra: 0.24, data: 0.14 },
  },
  {
    name: "Diego Alvarez",
    background: "technical",
    domain: "B2B",
    goals: "nights",
    scores: { planning: 46, quality: 72, pace: 68, exploration: 43, steering: 57 },
    areas: { frontend: 0.14, backend: 0.18, infra: 0.52, data: 0.16 },
  },
  {
    name: "Ruthie Cole",
    background: "business",
    domain: "Health",
    goals: "full-time",
    scores: { planning: 84, quality: 67, pace: 47, exploration: 73, steering: 70 },
    areas: { frontend: 0.4, backend: 0.1, infra: 0.2, data: 0.3 },
  },
  {
    name: "Pavel Novak",
    background: "technical",
    domain: "Climate",
    goals: "full-time",
    scores: { planning: 68, quality: 77, pace: 56, exploration: 61, steering: 63 },
    areas: { frontend: 0.09, backend: 0.36, infra: 0.39, data: 0.16 },
  },
];

function blankHours(): number[] {
  return Array.from({ length: 24 }, (_, i) => (i >= 9 && i <= 18 ? 2 : 0));
}

function toProfile(seed: Seed, index: number): CohortPerson {
  const payload: AnalyzerPayload = {
    analyzerVersion: "cohort-0.1.0",
    sources: seed.background === "business" ? ["challenge"] : ["git", "claude_code"],
    window: { from: "2026-01-01", to: "2026-10-26" },
    counts: {
      repos: seed.background === "business" ? 0 : 4 + (index % 5),
      commits: seed.background === "business" ? 0 : 120 + index * 17,
      sessions: seed.background === "business" ? 1 : 30 + index * 3,
    },
    signals: {
      testRunsPerSession: seed.scores.quality / 40,
      testFixRate: Math.min(1, seed.scores.quality / 100),
      exploreBeforeEditRate: seed.scores.exploration / 100,
      planBeforeCodeRate: seed.scores.planning / 100,
      agentRejectRate: seed.scores.steering / 400,
      medianCommitLines: 40 + (index % 7) * 10,
      commitsPerActiveDay: seed.scores.pace / 30,
      testCommitShare: Math.min(1, seed.scores.quality / 200),
      activeHours: blankHours(),
      areas: seed.areas,
      sharedRepos: { count: 1, separateAreasRate: 0.5, buildsOnOthersRate: 0.3, coAuthoredRate: 0.05 },
    },
    scores: seed.scores,
    confidence: {
      planning: "medium",
      quality: "medium",
      pace: "medium",
      exploration: "medium",
      steering: "medium",
    },
  };
  const profile = profileFromPayload(payload, {
    id: `sim-${index + 1}`,
    displayName: seed.name,
    background: seed.background,
    demo: true,
    rating: null,
    createdAt: "2026-10-26T12:00:00.000Z",
  });
  return { ...profile, domain: seed.domain, goals: seed.goals };
}

export function simulatedCohort(): CohortPerson[] {
  return SEEDS.map(toProfile);
}

export type MatchHit = {
  id: string;
  name: string;
  background: Background;
  domain: string;
  goals: string;
  reason: string;
  archetype: string;
};

export function topMatches(you: ProfileInput, people: CohortPerson[], limit = 3): MatchHit[] {
  return people
    .map((person) => {
      const report = pairReport(you, person);
      const reason = report.complements.find((line) => !/\d/.test(line)) ?? "Different ground. Worth a conversation.";
      const pace = report.frictions.some((line) => line.toLowerCase().includes("pace"));
      return {
        id: person.id,
        name: person.displayName,
        background: person.background,
        domain: person.domain,
        goals: person.goals,
        archetype: report.archetype.name,
        reason: pace ? `${reason} Pace is the thing to name before you start.` : reason,
        sort: scoreFit(you, person),
      };
    })
    .sort((a, b) => b.sort - a.sort)
    .slice(0, limit)
    .map(({ sort: _sort, ...hit }) => hit);
}

export function scoreFit(
  a: ProfileInput & { domain?: string; goals?: string },
  b: ProfileInput & { domain?: string; goals?: string },
): number {
  let score = 36;
  for (const key of AREA_KEYS) {
    const hi = Math.max(a.signals.areas[key], b.signals.areas[key]);
    const lo = Math.min(a.signals.areas[key], b.signals.areas[key]);
    if (hi >= 0.34 && lo <= 0.2) score += 14;
  }
  const pace = Math.abs(a.scores.pace - b.scores.pace);
  if (pace > 28) score -= (pace - 28) * 0.7;
  const qualityGap = Math.abs(a.scores.quality - b.scores.quality);
  if (qualityGap > 18 && Math.min(a.scores.quality, b.scores.quality) < 62) score += 8;
  const planGap = Math.abs(a.scores.planning - b.scores.planning);
  if (planGap > 15 && Math.min(a.scores.planning, b.scores.planning) < 68) score += 6;
  if (a.domain && b.domain && a.domain === b.domain) score += 10;
  if (a.goals && b.goals && a.goals === b.goals) score += 6;
  if (a.background !== b.background) score += 8;
  const avg = SCORE_KEYS.reduce((sum, k) => sum + Math.abs(a.scores[k] - b.scores[k]), 0) / SCORE_KEYS.length;
  if (avg < 8) score -= 18;
  return Math.round(score);
}

export type RoomPair = { a: string; b: string; note: string };
export type RoomRound = { pairs: RoomPair[]; bye: string | null };

export function matchRoom(people: CohortPerson[]): RoomRound {
  const edges: { i: number; j: number; s: number }[] = [];
  for (let i = 0; i < people.length; i += 1) {
    for (let j = i + 1; j < people.length; j += 1) {
      edges.push({ i, j, s: scoreFit(people[i], people[j]) });
    }
  }
  edges.sort((a, b) => b.s - a.s);
  const used = new Set<number>();
  const pairs: RoomPair[] = [];
  for (const edge of edges) {
    if (used.has(edge.i) || used.has(edge.j)) continue;
    used.add(edge.i);
    used.add(edge.j);
    const left = people[edge.i];
    const right = people[edge.j];
    const report = pairReport(left, right);
    pairs.push({
      a: left.displayName,
      b: right.displayName,
      note: report.archetype.name === "The Echo" ? "Too alike to learn much" : report.archetype.name,
    });
  }
  const byeIndex = people.findIndex((_, i) => !used.has(i));
  return { pairs, bye: byeIndex >= 0 ? people[byeIndex].displayName : null };
}
