export const SCORE_KEYS = ["planning", "quality", "pace", "exploration", "steering"] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];
export type Scores = Record<ScoreKey, number>;
export type Confidence = "strong" | "medium" | "weak";
export type AreaKey = "frontend" | "backend" | "infra" | "data";
export type Background = "technical" | "business" | "both";

export type Signals = {
  testRunsPerSession: number;
  testFixRate: number;
  exploreBeforeEditRate: number;
  planBeforeCodeRate: number;
  agentRejectRate: number;
  medianCommitLines: number;
  commitsPerActiveDay: number;
  testCommitShare: number;
  activeHours: number[];
  areas: Record<AreaKey, number>;
  sharedRepos: {
    count: number;
    separateAreasRate: number;
    buildsOnOthersRate: number;
    coAuthoredRate: number;
  };
};

export type ProfileInput = {
  id: string;
  displayName: string;
  background: Background;
  demo: boolean;
  sources: string[];
  window: { from: string; to: string } | null;
  counts: { repos: number; commits: number; sessions: number };
  signals: Signals;
  scores: Scores;
  confidence: Record<ScoreKey, Confidence>;
  rating: number | null;
  createdAt: string;
  uploadCount: number;
};

export const SCORE_LABEL: Record<ScoreKey, string> = {
  planning: "Planning",
  quality: "Quality",
  pace: "Pace",
  exploration: "Exploration",
  steering: "Steering",
};

export const AREA_KEYS: AreaKey[] = ["frontend", "backend", "infra", "data"];

export function areaWord(area: AreaKey, background: Background): string {
  if (background === "business") {
    if (area === "frontend") return "product";
    if (area === "backend") return "the build";
    if (area === "infra") return "roles";
    return "proof";
  }
  if (area === "frontend") return "frontend";
  if (area === "backend") return "backend";
  if (area === "infra") return "infrastructure";
  return "data";
}
