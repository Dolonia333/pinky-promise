import { z } from "zod";
import { CONFIDENCE_LEVELS, SOURCES } from "./dimensions";

const rate = z.number().min(0).max(1);
const count = z.number().int().min(0);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const score = z.number().int().min(0).max(100).nullable();
const confidence = z.enum(CONFIDENCE_LEVELS);

export const chatSchema = z
  .object({
    conversations: count,
    planFirstRate: rate.nullable(),
    researchFirstRate: rate.nullable(),
    verifyRate: rate.nullable(),
    pushbackRate: rate.nullable(),
    revisionsPerConversation: z.number().min(0).nullable(),
    conversationsPerActiveDay: z.number().min(0).nullable(),
  })
  .strict();

export const topicsSchema = z
  .object({
    customers: rate.optional(),
    product: rate.optional(),
    sales: rate.optional(),
    marketing: rate.optional(),
    fundraising: rate.optional(),
    finance: rate.optional(),
    hiring: rate.optional(),
    operations: rate.optional(),
  })
  .strict();

export const signalsSchema = z
  .object({
    testRunsPerSession: z.number().min(0).nullable(),
    testFixRate: rate.nullable(),
    exploreBeforeEditRate: rate.nullable(),
    planBeforeCodeRate: rate.nullable(),
    agentRejectRate: rate.nullable(),
    medianCommitLines: z.number().min(0).nullable(),
    commitsPerActiveDay: z.number().min(0).nullable(),
    testCommitShare: rate.nullable(),
    activeHours: z.array(z.number().int().min(0).max(9)).length(24),
    areas: z
      .object({
        frontend: rate.optional(),
        backend: rate.optional(),
        infra: rate.optional(),
        data: rate.optional(),
      })
      .strict(),
    chat: chatSchema.optional(),
    topics: topicsSchema.optional(),
    sharedRepos: z
      .object({
        count,
        separateAreasRate: rate.nullable(),
        buildsOnOthersRate: rate.nullable(),
        coAuthoredRate: rate.nullable(),
      })
      .strict(),
  })
  .strict();

export const countsSchema = z
  .object({ repos: count, commits: count, sessions: count, conversations: count.optional() })
  .strict();

export const scoresSchema = z
  .object({ planning: score, quality: score, pace: score, exploration: score, steering: score })
  .strict();

export const confidenceSchema = z
  .object({
    planning: confidence,
    quality: confidence,
    pace: confidence,
    exploration: confidence,
    steering: confidence,
  })
  .strict();

export const payloadSchema = z
  .object({
    analyzerVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    sources: z.array(z.enum(SOURCES)).min(1),
    window: z.object({ from: isoDate, to: isoDate }).strict(),
    counts: countsSchema,
    signals: signalsSchema,
    scores: scoresSchema,
    confidence: confidenceSchema,
  })
  .strict();

export type Signals = z.infer<typeof signalsSchema>;
export type Counts = z.infer<typeof countsSchema>;
export type ChatSignals = z.infer<typeof chatSchema>;
export type Topics = z.infer<typeof topicsSchema>;
export type Scores = z.infer<typeof scoresSchema>;
export type ConfidenceMap = z.infer<typeof confidenceSchema>;
export type Payload = z.infer<typeof payloadSchema>;
