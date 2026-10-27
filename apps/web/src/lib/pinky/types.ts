import {
  AREAS,
  DIMENSIONS,
  DIMENSION_LABELS,
  type Area,
  type Confidence,
  type Counts,
  type Dimension,
  type Scores,
  type Signals,
} from "@pinky-promise/shared";

export type { Confidence, Scores, Signals };
export type ScoreKey = Dimension;
export type AreaKey = Area;
export type Background = "technical" | "business" | "both";

export const SCORE_KEYS: readonly ScoreKey[] = DIMENSIONS;
export const SCORE_LABEL: Record<ScoreKey, string> = DIMENSION_LABELS;
export const AREA_KEYS: AreaKey[] = [...AREAS];

export type ProfileInput = {
  id: string;
  displayName: string;
  background: Background;
  demo: boolean;
  sources: string[];
  window: { from: string; to: string } | null;
  counts: Counts;
  signals: Signals;
  scores: Scores;
  confidence: Record<ScoreKey, Confidence>;
  rating: number | null;
  createdAt: string;
  uploadCount: number;
};

const BUSINESS_AREAS: Record<AreaKey, string> = {
  frontend: "product",
  backend: "the build",
  infra: "roles",
  data: "proof",
};

const TECHNICAL_AREAS: Record<AreaKey, string> = {
  frontend: "frontend",
  backend: "backend",
  infra: "infrastructure",
  data: "data",
};

export function areaLabels(background: Background): Record<AreaKey, string> {
  return background === "business" ? BUSINESS_AREAS : TECHNICAL_AREAS;
}

export function areaWord(area: AreaKey, background: Background): string {
  return areaLabels(background)[area];
}
