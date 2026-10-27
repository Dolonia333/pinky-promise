import { z } from "zod";
import type { ProfileInput, Signals } from "./types.ts";

const rate = z.number().finite().min(0).max(1);
const score = z.number().finite().min(0).max(100);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const payloadSchema = z.object({
  analyzerVersion: z.string().trim().min(1).max(32),
  sources: z
    .array(
      z
        .string()
        .trim()
        .regex(/^[a-z0-9_+.-]{1,32}$/),
    )
    .min(1)
    .max(8),
  window: z.object({ from: day, to: day }),
  counts: z.object({
    repos: z.number().int().min(0).max(100_000),
    commits: z.number().int().min(0).max(1_000_000),
    sessions: z.number().int().min(0).max(1_000_000),
  }),
  signals: z.object({
    testRunsPerSession: z.number().finite().min(0).max(100),
    testFixRate: rate,
    exploreBeforeEditRate: rate,
    planBeforeCodeRate: rate,
    agentRejectRate: rate,
    medianCommitLines: z.number().finite().min(0).max(100_000),
    commitsPerActiveDay: z.number().finite().min(0).max(1_000),
    testCommitShare: rate,
    activeHours: z.array(z.number().finite().min(0).max(100_000)).length(24),
    areas: z.object({
      frontend: rate,
      backend: rate,
      infra: rate,
      data: rate,
    }),
    sharedRepos: z.object({
      count: z.number().int().min(0).max(100_000),
      separateAreasRate: rate,
      buildsOnOthersRate: rate,
      coAuthoredRate: rate,
    }),
  }),
  scores: z.object({
    planning: score,
    quality: score,
    pace: score,
    exploration: score,
    steering: score,
  }),
  confidence: z.object({
    planning: z.enum(["strong", "medium", "weak"]),
    quality: z.enum(["strong", "medium", "weak"]),
    pace: z.enum(["strong", "medium", "weak"]),
    exploration: z.enum(["strong", "medium", "weak"]),
    steering: z.enum(["strong", "medium", "weak"]),
  }),
});

export type AnalyzerPayload = z.infer<typeof payloadSchema>;

export function profileFromPayload(
  payload: AnalyzerPayload,
  meta: {
    id: string;
    displayName: string;
    background: ProfileInput["background"];
    demo: boolean;
    rating: number | null;
    createdAt: string;
  },
): ProfileInput {
  return {
    id: meta.id,
    displayName: meta.displayName,
    background: meta.background,
    demo: meta.demo,
    sources: payload.sources,
    window: payload.window,
    counts: payload.counts,
    signals: payload.signals satisfies Signals,
    scores: payload.scores,
    confidence: payload.confidence,
    rating: meta.rating,
    createdAt: meta.createdAt,
    uploadCount: 1,
  };
}
