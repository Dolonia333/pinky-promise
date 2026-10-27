import {
  assertOnlyNumbers,
  payloadSchema,
  scoreProfile,
  type Payload,
  type Signals,
  type Source,
} from "@pinky-promise/shared";
import { ExportError, type Conversation } from "./conversation";
import { chatSignals, historyActiveHours, topicShares, withinWindow } from "./signals";

export const HISTORY_VERSION = "0.1.0";
const WINDOW_MONTHS = 12;

function isoDate(time: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`;
}

export function historyPayload(conversations: Conversation[], now = new Date()): Payload {
  const since = new Date(now);
  since.setMonth(since.getMonth() - WINDOW_MONTHS);
  const recent = withinWindow(conversations, since, now);
  if (recent.length === 0) {
    throw new ExportError("No conversations from the last 12 months were found in this export.");
  }

  const signals: Signals = {
    testRunsPerSession: null,
    testFixRate: null,
    exploreBeforeEditRate: null,
    planBeforeCodeRate: null,
    agentRejectRate: null,
    medianCommitLines: null,
    commitsPerActiveDay: null,
    testCommitShare: null,
    activeHours: historyActiveHours(recent),
    areas: {},
    chat: chatSignals(recent),
    topics: topicShares(recent),
    sharedRepos: { count: 0, separateAreasRate: null, buildsOnOthersRate: null, coAuthoredRate: null },
  };
  const counts = { repos: 0, commits: 0, sessions: 0, conversations: recent.length };
  const sources = [...new Set(recent.map((conversation) => conversation.source))] as Source[];

  const payload = payloadSchema.parse({
    analyzerVersion: HISTORY_VERSION,
    sources,
    window: { from: isoDate(since), to: isoDate(now) },
    counts,
    signals,
    ...scoreProfile(signals, counts),
  });
  assertOnlyNumbers(payload);
  return payload;
}
