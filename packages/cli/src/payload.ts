import { payloadSchema, scoreProfile, type Payload, type Source } from "@pinky-promise/shared";
import type { Evidence } from "./evidence";
import { computeSignals, localDate, ownCommits } from "./signals";

const SAFE_TEXT = /^(\d{4}-\d{2}-\d{2}|\d+\.\d+\.\d+|git|claude_code|codex|challenge|strong|medium|weak|none)$/;

export function assertOnlyNumbers(value: unknown, path = "payload"): void {
  if (typeof value === "string") {
    if (!SAFE_TEXT.test(value)) throw new Error(`Refusing to upload free text at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertOnlyNumbers(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) assertOnlyNumbers(item, `${path}.${key}`);
  }
}

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
