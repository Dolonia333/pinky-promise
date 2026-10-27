import { assertOnlyNumbers, payloadSchema, scoreProfile, type Payload, type Source } from "@pinky-promise/shared";

export { assertOnlyNumbers };
import type { Evidence } from "./evidence";
import { computeSignals, localDate, ownCommits } from "./signals";

export function buildPayload(evidence: Evidence, analyzerVersion: string): Payload {
  const signals = computeSignals(evidence);
  const counts = {
    repos: evidence.repos.length,
    commits: ownCommits(evidence).length,
    sessions: evidence.sessions.length,
  };
  const sources: Source[] = [];
  if (counts.commits > 0) sources.push("git");
  if (counts.sessions > 0) sources.push("claude_code");

  const payload = payloadSchema.parse({
    analyzerVersion,
    sources,
    window: { from: localDate(evidence.since), to: localDate(evidence.until) },
    counts,
    signals,
    ...scoreProfile(signals, counts),
  });
  assertOnlyNumbers(payload);
  return payload;
}
