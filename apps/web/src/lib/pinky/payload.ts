import { payloadSchema, type Payload } from "@pinky-promise/shared";
import type { ProfileInput } from "./types.ts";

export { payloadSchema };
export type AnalyzerPayload = Payload;

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
    signals: payload.signals,
    scores: payload.scores,
    confidence: payload.confidence,
    rating: meta.rating,
    createdAt: meta.createdAt,
    uploadCount: 1,
  };
}
