import { AREAS, type Area, type Signals } from "@pinky-promise/shared";
import { classifyFile } from "./classify";
import type { Evidence } from "./evidence";
import type { Commit } from "./sources/git";
import type { Session } from "./sources/claude-code";

const MIN_EXPLORE_BEFORE_EDIT = 2;

export const roundRate = (value: number) => Math.round(value * 100) / 100;
const roundOne = (value: number) => Math.round(value * 10) / 10;

export function localDate(time: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`;
}

function rate<T>(items: T[], test: (item: T) => boolean): number | null {
  return items.length === 0 ? null : roundRate(items.filter(test).length / items.length);
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : roundRate(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function ownCommits(evidence: Evidence): Commit[] {
  return evidence.repos.flat().filter((commit) => commit.isMine);
}

function firstEditIndex(session: Session): number {
  return session.tools.findIndex((tool) => tool.kind === "edit");
}

function exploredFirst(session: Session): boolean {
  const before = session.tools.slice(0, firstEditIndex(session));
  return before.filter((tool) => tool.kind === "explore").length >= MIN_EXPLORE_BEFORE_EDIT;
}

function plannedFirst(session: Session): boolean {
  return session.planMode || session.tools.slice(0, firstEditIndex(session)).some((tool) => tool.kind === "plan");
}

function testRuns(session: Session) {
  return session.tools.filter((tool) => tool.command === "test" && tool.outcome !== "rejected");
}

function fixedAfterFailing(session: Session): boolean {
  const runs = testRuns(session);
  const firstFailure = runs.findIndex((run) => run.outcome === "error");
  return runs.slice(firstFailure + 1).some((run) => run.outcome === "ok");
}

function sessionSignals(sessions: Session[]) {
  const withEdits = sessions.filter((session) => firstEditIndex(session) >= 0);
  const withFailures = sessions.filter((session) => testRuns(session).some((run) => run.outcome === "error"));
  const tools = sessions.flatMap((session) => session.tools);
  const pushback =
    tools.filter((tool) => tool.outcome === "rejected").length + sessions.reduce((sum, s) => sum + s.interrupts, 0);
  const testRunCount = sessions.reduce((sum, session) => sum + testRuns(session).length, 0);

  return {
    testRunsPerSession: sessions.length === 0 ? null : roundOne(testRunCount / sessions.length),
    testFixRate: rate(withFailures, fixedAfterFailing),
    exploreBeforeEditRate: rate(withEdits, exploredFirst),
    planBeforeCodeRate: rate(withEdits, plannedFirst),
    agentRejectRate: tools.length === 0 ? null : roundRate(Math.min(1, pushback / tools.length)),
  };
}

function gitSignals(commits: Commit[]) {
  const activeDays = new Set(commits.map((commit) => localDate(commit.time)));
  return {
    medianCommitLines: median(commits.map((commit) => commit.files.reduce((sum, f) => sum + f.added + f.deleted, 0))),
    commitsPerActiveDay: activeDays.size === 0 ? null : roundOne(commits.length / activeDays.size),
    testCommitShare: rate(commits, (commit) => commit.files.some((file) => classifyFile(file.path).isTest)),
  };
}

function areaShares(commits: Commit[], sessions: Session[]): Signals["areas"] {
  const counts = new Map<Area, number>();
  const add = (area: Area | null) => area && counts.set(area, (counts.get(area) ?? 0) + 1);
  for (const commit of commits) for (const file of commit.files) add(classifyFile(file.path).area);
  for (const session of sessions)
    for (const tool of session.tools)
      if (tool.kind === "edit" && tool.outcome !== "rejected") add(tool.file?.area ?? null);

  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  if (total === 0) return {};
  return Object.fromEntries(
    AREAS.filter((area) => counts.has(area)).map((area) => [area, roundRate(counts.get(area)! / total)]),
  );
}

export function activeHours(times: Date[]): number[] {
  const hours = Array<number>(24).fill(0);
  for (const time of times) hours[time.getHours()] += 1;
  const peak = Math.max(...hours);
  return peak === 0 ? hours : hours.map((value) => Math.round((value / peak) * 9));
}

function topDirectory(path: string): string {
  const slash = path.indexOf("/");
  return slash === -1 ? "." : path.slice(0, slash);
}

function sharedRepoSignals(repos: Commit[][]): Signals["sharedRepos"] {
  const separate: number[] = [];
  const buildsOn: number[] = [];
  const coAuthored: number[] = [];

  for (const commits of repos) {
    const mine = commits.filter((commit) => commit.isMine);
    const theirs = commits.filter((commit) => !commit.isMine);
    if (mine.length === 0 || theirs.length === 0) continue;

    const myDirs = new Set(mine.flatMap((commit) => commit.files.map((file) => topDirectory(file.path))));
    const theirDirs = new Set(theirs.flatMap((commit) => commit.files.map((file) => topDirectory(file.path))));
    if (myDirs.size > 0) separate.push([...myDirs].filter((dir) => !theirDirs.has(dir)).length / myDirs.size);

    const byHash = new Map(commits.map((commit) => [commit.hash, commit]));
    const withKnownParent = mine.filter((commit) => commit.parents[0] && byHash.has(commit.parents[0]));
    if (withKnownParent.length > 0) {
      const onOthers = withKnownParent.filter((commit) => !byHash.get(commit.parents[0]!)!.isMine);
      buildsOn.push(onOthers.length / withKnownParent.length);
    }
    coAuthored.push(mine.filter((commit) => commit.coAuthored).length / mine.length);
  }

  return {
    count: coAuthored.length,
    separateAreasRate: mean(separate),
    buildsOnOthersRate: mean(buildsOn),
    coAuthoredRate: mean(coAuthored),
  };
}

export function computeSignals(evidence: Evidence): Signals {
  const commits = ownCommits(evidence);
  const times = [...commits.map((commit) => commit.time), ...evidence.sessions.flatMap((session) => session.prompts)];
  return {
    ...sessionSignals(evidence.sessions),
    ...gitSignals(commits),
    activeHours: activeHours(times),
    areas: areaShares(commits, evidence.sessions),
    sharedRepos: sharedRepoSignals(evidence.repos),
  };
}
