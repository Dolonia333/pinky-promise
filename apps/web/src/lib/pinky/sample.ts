import type { AnalyzerPayload } from "./payload.ts";
import { profileFromPayload } from "./payload.ts";
import type { ProfileInput } from "./types.ts";

/** The agreed upload shape from the build plan. Numbers are made up for testing. */
export const SAMPLE_PAYLOAD: AnalyzerPayload = {
  analyzerVersion: "0.1.0",
  sources: ["git", "claude_code"],
  window: { from: "2025-10-27", to: "2026-10-26" },
  counts: { repos: 9, commits: 812, sessions: 214 },
  signals: {
    testRunsPerSession: 2.4,
    testFixRate: 0.71,
    exploreBeforeEditRate: 0.62,
    planBeforeCodeRate: 0.35,
    agentRejectRate: 0.12,
    medianCommitLines: 48,
    commitsPerActiveDay: 3.1,
    testCommitShare: 0.22,
    activeHours: [0, 0, 0, 0, 0, 0, 0, 1, 3, 6, 8, 9, 7, 8, 9, 7, 5, 4, 3, 5, 6, 4, 2, 1],
    areas: { frontend: 0.4, backend: 0.35, infra: 0.15, data: 0.1 },
    sharedRepos: { count: 3, separateAreasRate: 0.7, buildsOnOthersRate: 0.3, coAuthoredRate: 0.05 },
  },
  scores: { planning: 62, quality: 48, pace: 81, exploration: 55, steering: 70 },
  confidence: {
    planning: "medium",
    quality: "strong",
    pace: "strong",
    exploration: "medium",
    steering: "medium",
  },
};

export const MAYA_ID = "sample-maya";

export function mayaProfile(): ProfileInput {
  return profileFromPayload(
    {
      analyzerVersion: "0.1.0",
      sources: ["git", "claude_code"],
      window: { from: "2025-10-27", to: "2026-10-26" },
      counts: { repos: 6, commits: 540, sessions: 160 },
      signals: {
        testRunsPerSession: 3.4,
        testFixRate: 0.86,
        exploreBeforeEditRate: 0.74,
        planBeforeCodeRate: 0.71,
        agentRejectRate: 0.18,
        medianCommitLines: 86,
        commitsPerActiveDay: 1.4,
        testCommitShare: 0.41,
        activeHours: [0, 0, 0, 0, 0, 0, 1, 2, 4, 6, 7, 8, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0],
        areas: { frontend: 0.08, backend: 0.5, infra: 0.32, data: 0.1 },
        sharedRepos: { count: 4, separateAreasRate: 0.55, buildsOnOthersRate: 0.48, coAuthoredRate: 0.12 },
      },
      scores: { planning: 84, quality: 80, pace: 44, exploration: 58, steering: 66 },
      confidence: {
        planning: "strong",
        quality: "strong",
        pace: "medium",
        exploration: "medium",
        steering: "medium",
      },
    },
    {
      id: MAYA_ID,
      displayName: "Maya Chen",
      background: "technical",
      demo: true,
      rating: null,
      createdAt: "2026-10-26T18:00:00.000Z",
    },
  );
}
