import { describe, expect, it } from "vitest";
import type { Evidence } from "../src/evidence";
import { activeHours, computeSignals, median } from "../src/signals";
import { parseSession } from "../src/sources/claude-code";
import type { Commit } from "../src/sources/git";
import { fixture } from "./helpers";

function commit(hash: string, isMine: boolean, time: string, files: Commit["files"], parent?: string): Commit {
  return { hash, parents: parent ? [parent] : [], isMine, time: new Date(time), coAuthored: false, files };
}

const repo: Commit[] = [
  commit("a", false, "2026-09-01T10:00:00", [{ path: "server/api.ts", added: 40, deleted: 0 }]),
  commit("b", true, "2026-09-01T15:00:00", [{ path: "web/App.tsx", added: 20, deleted: 5 }], "a"),
  commit("c", true, "2026-09-01T16:00:00", [{ path: "web/App.test.tsx", added: 10, deleted: 0 }], "b"),
  commit("d", true, "2026-09-03T11:00:00", [{ path: "server/api.ts", added: 80, deleted: 20 }], "c"),
];

const evidence: Evidence = {
  repos: [repo],
  sessions: [parseSession("fixture", fixture("session.jsonl"))!],
  since: new Date("2025-10-27"),
  until: new Date("2026-10-26"),
};

describe("computeSignals", () => {
  const signals = computeSignals(evidence);

  it("reads session habits", () => {
    expect(signals.testRunsPerSession).toBe(2);
    expect(signals.testFixRate).toBe(1);
    expect(signals.exploreBeforeEditRate).toBe(1);
    expect(signals.planBeforeCodeRate).toBe(1);
    expect(signals.agentRejectRate).toBe(0.29);
  });

  it("reads commit rhythm from my commits only", () => {
    expect(signals.medianCommitLines).toBe(25);
    expect(signals.commitsPerActiveDay).toBe(1.5);
    expect(signals.testCommitShare).toBe(0.33);
  });

  it("splits work into areas", () => {
    expect(signals.areas).toEqual({ frontend: 0.75, backend: 0.25 });
  });

  it("describes teamwork in shared repos", () => {
    expect(signals.sharedRepos).toEqual({
      count: 1,
      separateAreasRate: 0.5,
      buildsOnOthersRate: 0.33,
      coAuthoredRate: 0,
    });
  });

  it("returns empty signals when there is nothing to read", () => {
    const none = computeSignals({ ...evidence, repos: [], sessions: [] });
    expect(none.testRunsPerSession).toBeNull();
    expect(none.medianCommitLines).toBeNull();
    expect(none.areas).toEqual({});
    expect(none.activeHours.every((value) => value === 0)).toBe(true);
  });
});

describe("helpers", () => {
  it("scales active hours to 0 through 9", () => {
    const hours = activeHours([
      new Date("2026-01-01T09:00:00"),
      new Date("2026-01-01T09:30:00"),
      new Date("2026-01-01T17:00:00"),
    ]);
    expect(hours[9]).toBe(9);
    expect(hours[17]).toBe(5);
    expect(hours.reduce((a, b) => a + b, 0)).toBe(14);
  });

  it("finds the median", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});
