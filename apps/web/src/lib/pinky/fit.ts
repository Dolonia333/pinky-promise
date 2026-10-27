import {
  compareFounders,
  cofounderYouNeed,
  howToWorkWithMe,
  plural,
  profileArchetype,
  type Confidence,
  type Founder,
  type Voice,
} from "@pinky-promise/shared";
import {
  AREA_KEYS,
  SCORE_KEYS,
  areaLabels,
  type Background,
  type ProfileInput,
  type ScoreKey,
  type Scores,
  type Signals,
} from "./types.ts";

export function pct(n: number | null): string {
  return n === null ? "no data" : `${Math.round(n * 100)}%`;
}

function showScore(n: number | null): string {
  return n === null ? "No data" : String(n);
}

export function archetypeOf(scores: Scores): { name: string; line: string } {
  const archetype = profileArchetype(scores);
  return { name: archetype.name, line: archetype.tagline };
}

export function voiceOf(p: ProfileInput): Voice {
  return p.background === "business" ? "business" : "builder";
}

export function cofounderNeed(p: ProfileInput): string {
  return cofounderYouNeed(p, areaLabels(p.background), voiceOf(p)).summary;
}

export function workWithMe(p: ProfileInput): string[] {
  const tips = howToWorkWithMe(p, voiceOf(p));
  return tips.length > 0 ? tips : ["Show them this page. It is evidence for a conversation, not a verdict."];
}

export function evidenceLines(p: ProfileInput, voice: "you" | "they"): { key: ScoreKey; detail: string }[] {
  const you = voice === "you";
  const challengeOnly =
    p.sources.includes("challenge") && !p.sources.includes("git") && !p.sources.includes("claude_code");
  const chat = p.signals.chat;
  const hasCode = p.sources.includes("git") || p.sources.includes("claude_code");
  if (chat && !hasCode) {
    const who = you ? "You" : "They";
    const unknown = "Not enough data yet.";
    return [
      {
        key: "planning",
        detail:
          chat.planFirstRate === null
            ? unknown
            : `${who} ask for a plan before a draft in ${pct(chat.planFirstRate)} of chats.`,
      },
      {
        key: "quality",
        detail:
          chat.verifyRate === null
            ? unknown
            : `${who} check sources or numbers in ${pct(chat.verifyRate)} of longer chats.`,
      },
      {
        key: "pace",
        detail:
          chat.conversationsPerActiveDay === null
            ? unknown
            : `${chat.conversationsPerActiveDay.toFixed(1)} AI conversations on a day ${you ? "you work" : "they work"}.`,
      },
      {
        key: "exploration",
        detail:
          chat.researchFirstRate === null
            ? unknown
            : `${who} research before drafting in ${pct(chat.researchFirstRate)} of chats.`,
      },
      {
        key: "steering",
        detail:
          chat.pushbackRate === null ? unknown : `${who} push back on or redo ${pct(chat.pushbackRate)} of answers.`,
      },
    ];
  }
  if (challengeOnly) {
    return [
      { key: "planning", detail: "From the challenge: what got a card, and what actually got locked." },
      { key: "quality", detail: "Revisions, and whether a way to know it worked was locked. Not writing polish." },
      { key: "pace", detail: "Time from the opening of the challenge to the first locked section." },
      { key: "exploration", detail: "How many distinct options hit the board before the first lock." },
      { key: "steering", detail: "Edits and votes. The challenge version of correcting course." },
    ];
  }
  const s = p.signals;
  const who = you ? "You" : "They";
  const your = you ? "your" : "their";
  const unknown = "Not enough data yet.";
  const quality = [
    s.testRunsPerSession === null ? null : `Tests run ${s.testRunsPerSession.toFixed(1)} times a session.`,
    s.testFixRate === null ? null : `${pct(s.testFixRate)} of failures get a fix.`,
    s.testCommitShare === null ? null : `${pct(s.testCommitShare)} of commits touch tests.`,
  ].filter(Boolean);
  const pace = [
    s.commitsPerActiveDay === null
      ? null
      : `${s.commitsPerActiveDay.toFixed(1)} commits on a day ${you ? "you work" : "they work"}.`,
    s.medianCommitLines === null ? null : `A typical change is ${Math.round(s.medianCommitLines)} lines.`,
  ].filter(Boolean);
  return [
    {
      key: "planning",
      detail:
        s.planBeforeCodeRate === null
          ? unknown
          : `A plan shows up before code in ${pct(s.planBeforeCodeRate)} of sessions.`,
    },
    { key: "quality", detail: quality.length > 0 ? quality.join(" ") : unknown },
    { key: "pace", detail: pace.length > 0 ? pace.join(" ") : unknown },
    {
      key: "exploration",
      detail:
        s.exploreBeforeEditRate === null
          ? unknown
          : `${who} read or search before editing ${pct(s.exploreBeforeEditRate)} of the time.`,
    },
    {
      key: "steering",
      detail:
        s.agentRejectRate === null
          ? unknown
          : `${who} reject or correct the agent ${pct(s.agentRejectRate)} of the time. Steering sits with ${your} hands.`,
    },
  ];
}

export type PairReport = {
  archetype: { name: string; line: string };
  headline: string;
  complements: string[];
  frictions: string[];
  nextStep: string;
  numbers: { label: string; value: string }[];
  confidenceNote: string;
};

function evidenceWeight(p: ProfileInput): string {
  if (p.sources.includes("challenge") && p.counts.commits === 0) return "1 challenge";
  const bits = [];
  if (p.counts.sessions) bits.push(plural(p.counts.sessions, "session"));
  if (p.counts.conversations) bits.push(plural(p.counts.conversations, "AI conversation"));
  if (p.counts.commits) bits.push(plural(p.counts.commits, "commit"));
  return bits.join(" · ") || "thin evidence";
}

function asFounder(p: ProfileInput): Founder {
  return { name: p.displayName, payload: p, areaLabels: areaLabels(p.background), voice: voiceOf(p) };
}

export function pairReport(a: ProfileInput, b: ProfileInput): PairReport {
  const report = compareFounders(asFounder(a), asFounder(b));
  const numbers: PairReport["numbers"] = SCORE_KEYS.map((key) => ({
    label: key,
    value: `${showScore(a.scores[key])} / ${showScore(b.scores[key])}`,
  }));
  numbers.push({ label: "Hours in common", value: pct(report.numbers.hoursOverlap) });
  const confidenceNote = `${report.confidence} confidence. ${a.displayName}: ${evidenceWeight(a)}. ${b.displayName}: ${evidenceWeight(b)}. One friendly session is not a marriage.`;

  return {
    archetype: { name: report.archetype.name, line: report.archetype.tagline },
    headline: report.headline,
    complements: report.complements,
    frictions: report.frictions,
    nextStep: report.nextStep,
    numbers,
    confidenceNote,
  };
}

function wavg(rows: ProfileInput[], weights: number[], pick: (p: ProfileInput) => number | null | undefined) {
  let total = 0;
  let weight = 0;
  rows.forEach((row, i) => {
    const value = pick(row);
    if (value === null || value === undefined) return;
    total += value * weights[i];
    weight += weights[i];
  });
  return weight === 0 ? null : total / weight;
}

const round = (n: number | null, places: number) => (n === null ? null : Math.round(n * 10 ** places) / 10 ** places);

function withChat(rows: ProfileInput[]): Pick<Signals, "chat" | "topics"> {
  const latest = [...rows].reverse().find((row) => row.signals.chat);
  return latest ? { chat: latest.signals.chat, topics: latest.signals.topics } : {};
}

export function mergeProfiles(rows: ProfileInput[]): ProfileInput | null {
  if (rows.length === 0) return null;
  if (rows.length === 1) return { ...rows[0], uploadCount: 1 };
  const weights = rows.map((r) => Math.max(1, r.counts.sessions, r.counts.commits / 20));
  const latest = rows.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  const backgrounds = new Set(rows.map((r) => r.background));
  const background: Background = backgrounds.size > 1 ? "both" : latest.background;
  const sources = [...new Set(rows.flatMap((r) => r.sources))];
  const scores = Object.fromEntries(
    SCORE_KEYS.map((k) => [
      k,
      round(
        wavg(rows, weights, (p) => p.scores[k]),
        0,
      ),
    ]),
  ) as Scores;
  const areas = Object.fromEntries(
    AREA_KEYS.map((k): [string, number] => [
      k,
      round(
        wavg(rows, weights, (p) => p.signals.areas[k] ?? 0),
        2,
      ) ?? 0,
    ]).filter(([, value]) => value > 0),
  ) as Signals["areas"];
  const signals: Signals = {
    testRunsPerSession: round(
      wavg(rows, weights, (p) => p.signals.testRunsPerSession),
      1,
    ),
    testFixRate: round(
      wavg(rows, weights, (p) => p.signals.testFixRate),
      2,
    ),
    exploreBeforeEditRate: round(
      wavg(rows, weights, (p) => p.signals.exploreBeforeEditRate),
      2,
    ),
    planBeforeCodeRate: round(
      wavg(rows, weights, (p) => p.signals.planBeforeCodeRate),
      2,
    ),
    agentRejectRate: round(
      wavg(rows, weights, (p) => p.signals.agentRejectRate),
      2,
    ),
    medianCommitLines: round(
      wavg(rows, weights, (p) => p.signals.medianCommitLines),
      0,
    ),
    commitsPerActiveDay: round(
      wavg(rows, weights, (p) => p.signals.commitsPerActiveDay),
      1,
    ),
    testCommitShare: round(
      wavg(rows, weights, (p) => p.signals.testCommitShare),
      2,
    ),
    activeHours: Array.from({ length: 24 }, (_, h) =>
      Math.round(wavg(rows, weights, (p) => p.signals.activeHours[h] ?? 0) ?? 0),
    ),
    areas,
    ...withChat(rows),
    sharedRepos: {
      count: rows.reduce((s, r) => s + r.signals.sharedRepos.count, 0),
      separateAreasRate: round(
        wavg(rows, weights, (p) => p.signals.sharedRepos.separateAreasRate),
        2,
      ),
      buildsOnOthersRate: round(
        wavg(rows, weights, (p) => p.signals.sharedRepos.buildsOnOthersRate),
        2,
      ),
      coAuthoredRate: round(
        wavg(rows, weights, (p) => p.signals.sharedRepos.coAuthoredRate),
        2,
      ),
    },
  };
  const sessions = rows.reduce((s, r) => s + r.counts.sessions, 0);
  const conversations = rows.reduce((s, r) => s + (r.counts.conversations ?? 0), 0);
  const commits = rows.reduce((s, r) => s + r.counts.commits, 0);
  const level: Confidence =
    sessions >= 40 || commits >= 150 ? "strong" : sessions >= 5 || sources.includes("challenge") ? "medium" : "weak";
  const confidence = Object.fromEntries(SCORE_KEYS.map((k) => [k, scores[k] === null ? "none" : level])) as Record<
    ScoreKey,
    Confidence
  >;
  const from =
    rows
      .map((r) => r.window?.from)
      .filter((v): v is string => Boolean(v))
      .sort()[0] ?? null;
  const to =
    rows
      .map((r) => r.window?.to)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1) ?? null;
  return {
    id: latest.id,
    displayName: latest.displayName || rows.find((r) => r.displayName)?.displayName || "Founder",
    background,
    demo: rows.every((r) => r.demo),
    sources,
    window: from && to ? { from, to } : null,
    counts: {
      repos: Math.max(...rows.map((r) => r.counts.repos)),
      commits,
      sessions,
      ...(conversations > 0 ? { conversations } : {}),
    },
    signals,
    scores,
    confidence,
    rating: latest.rating,
    createdAt: latest.createdAt,
    uploadCount: rows.length,
  };
}

export function followUpIcs(reportId: string, nameA: string, nameB: string): string {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 3);
  start.setUTCHours(16, 0, 0, 0);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  const stamp = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const summary = `Pinky Promise follow-up: ${nameA} and ${nameB}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pinky Promise//EN",
    "BEGIN:VEVENT",
    `UID:${reportId}@pinky-promise`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${summary}`,
    "DESCRIPTION:A longer conversation. The report is evidence, not a verdict.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
