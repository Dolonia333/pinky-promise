import type { Counts, Payload, Signals } from "./payload";
import { scoreProfile } from "./scoring";

function samplePayloadFrom(signals: Signals, counts: Counts): Payload {
  return {
    analyzerVersion: "0.1.0",
    sources: ["git", "claude_code"],
    window: { from: "2025-10-27", to: "2026-10-26" },
    counts,
    signals,
    ...scoreProfile(signals, counts),
  };
}

export const samplePayload: Payload = samplePayloadFrom(
  {
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
  { repos: 9, commits: 812, sessions: 214 },
);

export const samplePartnerPayload: Payload = samplePayloadFrom(
  {
    testRunsPerSession: 0.4,
    testFixRate: 0.5,
    exploreBeforeEditRate: 0.3,
    planBeforeCodeRate: 0.05,
    agentRejectRate: 0.04,
    medianCommitLines: 160,
    commitsPerActiveDay: 6.2,
    testCommitShare: 0.04,
    activeHours: [3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 4, 5, 5, 6, 7, 8, 9, 9, 8, 6],
    areas: { frontend: 0.75, backend: 0.2, infra: 0.05 },
    sharedRepos: { count: 0, separateAreasRate: null, buildsOnOthersRate: null, coAuthoredRate: null },
  },
  { repos: 4, commits: 390, sessions: 41 },
);
