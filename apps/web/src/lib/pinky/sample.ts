import { samplePayload, scoreProfile, type Counts, type Signals } from "@pinky-promise/shared";
import { profileFromPayload, type AnalyzerPayload } from "./payload.ts";
import type { ProfileInput } from "./types.ts";

export const SAMPLE_PAYLOAD: AnalyzerPayload = samplePayload;

export const MAYA_ID = "sample-maya";

const MAYA_COUNTS: Counts = { repos: 6, commits: 540, sessions: 160 };
const MAYA_SIGNALS: Signals = {
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
};

export function mayaProfile(): ProfileInput {
  return profileFromPayload(
    {
      analyzerVersion: "0.1.0",
      sources: ["git", "claude_code"],
      window: { from: "2025-10-27", to: "2026-10-26" },
      counts: MAYA_COUNTS,
      signals: MAYA_SIGNALS,
      ...scoreProfile(MAYA_SIGNALS, MAYA_COUNTS),
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
