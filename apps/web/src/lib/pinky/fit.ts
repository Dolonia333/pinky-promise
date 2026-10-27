import {
  AREA_KEYS,
  SCORE_KEYS,
  areaWord,
  type AreaKey,
  type Background,
  type Confidence,
  type ProfileInput,
  type ScoreKey,
  type Scores,
  type Signals,
} from "./types.ts";

const ARCHETYPE: Record<ScoreKey, { name: string; line: string }> = {
  planning: {
    name: "The Blueprint",
    line: "You settle the plan before the code starts moving.",
  },
  quality: {
    name: "The Proof",
    line: "You don't trust it until something checks the work.",
  },
  pace: {
    name: "The Rocket",
    line: "You'd rather ship a smaller thing today than polish a plan.",
  },
  exploration: {
    name: "The Scout",
    line: "You read the ground before you change it.",
  },
  steering: {
    name: "The Helm",
    line: "You stay in the loop and correct course early.",
  },
};

const TIE_BREAK: ScoreKey[] = ["steering", "quality", "planning", "exploration", "pace"];

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export function archetypeOf(scores: Scores): { name: string; line: string } {
  let best: ScoreKey = "planning";
  for (const key of SCORE_KEYS) {
    if (scores[key] > scores[best]) best = key;
    else if (scores[key] === scores[best] && TIE_BREAK.indexOf(key) < TIE_BREAK.indexOf(best)) {
      best = key;
    }
  }
  return ARCHETYPE[best];
}

function topAreas(p: ProfileInput, min: number, limit: number): AreaKey[] {
  return AREA_KEYS.filter((k) => p.signals.areas[k] >= min)
    .sort((a, b) => p.signals.areas[b] - p.signals.areas[a])
    .slice(0, limit);
}

export function cofounderNeed(p: ProfileInput): string {
  const strong = topAreas(p, 0.28, 2).map((k) => areaWord(k, p.background));
  const strongText = strong.length ? joinAnd(strong) : "a wide mix of the work";
  const wants: string[] = [];
  if (p.scores.planning < 68) wants.push("plans before building");
  if (p.scores.quality < 60 || p.signals.testCommitShare < 0.18) {
    wants.push("treats tests as part of the job");
  }
  const missing = AREA_KEYS.filter((k) => p.signals.areas[k] < 0.2);
  if (missing.length) wants.push(`owns ${joinAnd(missing.map((k) => areaWord(k, p.background)))}`);
  const pace =
    p.scores.pace >= 75
      ? "You ship fast"
      : p.scores.pace <= 45
        ? "You would rather get it right than get it out"
        : "Your pace sits in the middle";
  const soft = p.scores.quality < 60 ? " and quality is the soft spot" : "";
  const head = `${pace}${soft}, and you're strongest on ${strongText}.`;
  if (!wants.length) {
    return `${head} You don't have an obvious hole. Look for a different temperament, not a copy of your resume.`;
  }
  return `${head} Look for someone who ${joinAnd(wants)}.`;
}

export function workWithMe(p: ProfileInput): string[] {
  const tips: { rank: number; text: string }[] = [];
  if (p.scores.quality < 65) {
    tips.push({
      rank: 65 - p.scores.quality,
      text: "Put quality on your side of the table. Ask for the test, or it may not happen.",
    });
  }
  if (p.scores.planning < 70) {
    tips.push({
      rank: 70 - p.scores.planning,
      text: "Bring the plan. They will start building while you are still framing it.",
    });
  }
  if (p.scores.pace >= 75) {
    tips.push({
      rank: p.scores.pace - 50,
      text: "Agree what done means before the week starts. They ship before the spec feels finished.",
    });
  }
  if (p.scores.pace <= 48) {
    tips.push({
      rank: 55 - p.scores.pace,
      text: "Don't read a slow first day as a lack of care. They are still checking the edges.",
    });
  }
  if (p.scores.steering >= 65) {
    tips.push({
      rank: 12,
      text: "They correct course early. That is care, not distrust. Expect notes.",
    });
  }
  if (p.scores.exploration < 55) {
    tips.push({
      rank: 10,
      text: "They dive in. Ask them to look before they edit if the area is unfamiliar.",
    });
  }
  if (p.signals.sharedRepos.separateAreasRate >= 0.6) {
    tips.push({
      rank: 8,
      text: "In shared repos they tend to take their own slice. Say out loud where you want to overlap.",
    });
  }
  tips.sort((a, b) => b.rank - a.rank);
  const picked = tips.slice(0, 3).map((t) => t.text);
  if (!picked.length) {
    picked.push("Show them this page. It is evidence for a conversation, not a verdict.");
  }
  return picked;
}

export function evidenceLines(p: ProfileInput, voice: "you" | "they"): { key: ScoreKey; detail: string }[] {
  const you = voice === "you";
  const challengeOnly =
    p.sources.includes("challenge") && !p.sources.includes("git") && !p.sources.includes("claude_code");
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
  return [
    { key: "planning", detail: `A plan shows up before code in ${pct(s.planBeforeCodeRate)} of sessions.` },
    {
      key: "quality",
      detail: `Tests run ${s.testRunsPerSession.toFixed(1)} times a session. ${pct(s.testFixRate)} of failures get a fix. ${pct(s.testCommitShare)} of commits touch tests.`,
    },
    {
      key: "pace",
      detail: `${s.commitsPerActiveDay.toFixed(1)} commits on a day ${you ? "you work" : "they work"}. A typical change is ${Math.round(s.medianCommitLines)} lines.`,
    },
    { key: "exploration", detail: `${who} read or search before editing ${pct(s.exploreBeforeEditRate)} of the time.` },
    {
      key: "steering",
      detail: `${who} reject or correct the agent ${pct(s.agentRejectRate)} of the time. Steering sits with ${your} hands.`,
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

function leads(a: ProfileInput, b: ProfileInput): { owner: ProfileInput; area: AreaKey }[] {
  const out: { owner: ProfileInput; area: AreaKey }[] = [];
  for (const area of AREA_KEYS) {
    const d = a.signals.areas[area] - b.signals.areas[area];
    if (d >= 0.14 && a.signals.areas[area] >= 0.25) out.push({ owner: a, area });
    if (d <= -0.14 && b.signals.areas[area] >= 0.25) out.push({ owner: b, area });
  }
  return out;
}

function evidenceWeight(p: ProfileInput): string {
  if (p.sources.includes("challenge") && p.counts.commits === 0) return "1 challenge";
  const bits = [];
  if (p.counts.sessions) bits.push(`${p.counts.sessions} sessions`);
  if (p.counts.commits) bits.push(`${p.counts.commits} commits`);
  return bits.join(" · ") || "thin evidence";
}

function weakest(p: ProfileInput): Confidence {
  const rank: Record<Confidence, number> = { weak: 0, medium: 1, strong: 2 };
  return SCORE_KEYS.reduce<Confidence>(
    (acc, key) => (rank[p.confidence[key]] < rank[acc] ? p.confidence[key] : acc),
    "strong",
  );
}

export function pairReport(a: ProfileInput, b: ProfileInput): PairReport {
  const owned = leads(a, b);
  const aLeads = owned.filter((x) => x.owner === a).map((x) => areaWord(x.area, a.background));
  const bLeads = owned.filter((x) => x.owner === b).map((x) => areaWord(x.area, b.background));
  const paceDelta = Math.abs(a.scores.pace - b.scores.pace);
  const avgDelta = SCORE_KEYS.reduce((sum, k) => sum + Math.abs(a.scores[k] - b.scores[k]), 0) / SCORE_KEYS.length;
  const cover = aLeads.length + bLeads.length >= 2 || a.background !== b.background;

  let archetype: { name: string; line: string };
  if (avgDelta < 10) {
    archetype = {
      name: "The Echo",
      line: "You build like the same person twice. Comfortable, and easy to miss a whole side of the company.",
    };
  } else if (cover) {
    archetype = {
      name: "The Cover",
      line: "Each of you is carrying a side the other doesn't.",
    };
  } else if (paceDelta >= 30) {
    archetype = {
      name: "The Tempo Clash",
      line: "The skills can fit. The speed will fight unless you name it.",
    };
  } else {
    archetype = {
      name: "The Open Question",
      line: "Nothing here is a no. Nothing here is a yes. Run the longer trial.",
    };
  }

  const aSide = aLeads.length ? joinAnd(aLeads) : "a similar spread";
  const bSide = bLeads.length ? joinAnd(bLeads) : "a similar spread";
  const risk = paceDelta >= 25 ? " The biggest risk is pace." : "";
  const headline = cover
    ? `${a.displayName} and ${b.displayName} cover different ground. ${a.displayName} carries ${aSide}. ${b.displayName} carries ${bSide}.${risk}`
    : avgDelta < 10
      ? `${a.displayName} and ${b.displayName} overlap more than they cover. A company needs a second shape.`
      : `${a.displayName} and ${b.displayName} are close. Pace is the argument to have before anyone splits equity.`;

  const complements: string[] = [];
  if (aLeads.length) complements.push(`${a.displayName} carries more of the ${joinAnd(aLeads)}.`);
  if (bLeads.length) complements.push(`${b.displayName} carries more of the ${joinAnd(bLeads)}.`);
  for (const key of ["planning", "quality", "steering"] as ScoreKey[]) {
    const d = a.scores[key] - b.scores[key];
    if (Math.abs(d) >= 18) {
      const hi = d > 0 ? a : b;
      const lo = d > 0 ? b : a;
      complements.push(
        `${hi.displayName} is stronger on ${key} (${hi.scores[key]} vs ${lo.scores[key]}). That gap is useful if you let them own it.`,
      );
    }
  }
  if (!complements.length) {
    complements.push("No sharp complement in the numbers. The value would have to come from taste, not from coverage.");
  }

  const frictions: string[] = [];
  if (paceDelta >= 22) {
    const fast = a.scores.pace >= b.scores.pace ? a : b;
    const slow = fast === a ? b : a;
    frictions.push(
      `Pace is ${fast.scores.pace} against ${slow.scores.pace}. ${fast.displayName} will feel stalled. ${slow.displayName} will feel rushed. Agree how fast is fast enough.`,
    );
  }
  if (a.scores.quality < 58 && b.scores.quality < 58) {
    frictions.push("Quality is soft on both sides. Nobody in this pair is the person who writes the test.");
  }
  if (a.scores.planning < 55 && b.scores.planning < 55) {
    frictions.push("Planning is light for both. You will start building two different products.");
  }
  if (avgDelta < 10) {
    frictions.push("The profiles echo. Shared taste feels like chemistry and hides the missing role.");
  }
  if (!frictions.length) {
    frictions.push("No sharp clash in the numbers. Still run a longer trial before you split a company.");
  }

  let nextStep: string;
  if (archetype.name === "The Echo") {
    nextStep = "Good conversation, probably not co-founders. You overlap more than you cover.";
  } else if (cover && paceDelta >= 25) {
    nextStep = "Worth a longer trial: one week, with an explicit agreement on pace.";
  } else if (cover) {
    nextStep = "Worth a longer trial: try a one-week project together.";
  } else if (paceDelta >= 30) {
    nextStep = "Good conversation, probably not co-founders, unless you can name the pace and mean it.";
  } else {
    nextStep = "Start with one more trial before you decide anything.";
  }

  const numbers = SCORE_KEYS.map((key) => ({
    label: key,
    value: `${a.scores[key]} / ${b.scores[key]}`,
  }));

  const wa = weakest(a);
  const wb = weakest(b);
  const rank: Record<Confidence, number> = { weak: 0, medium: 1, strong: 2 };
  const floor = rank[wa] <= rank[wb] ? wa : wb;
  const confidenceNote = `${floor} confidence. ${a.displayName}: ${evidenceWeight(a)}. ${b.displayName}: ${evidenceWeight(b)}. One friendly session is not a marriage.`;

  return { archetype, headline, complements, frictions, nextStep, numbers, confidenceNote };
}

function wavg(rows: ProfileInput[], weights: number[], pick: (p: ProfileInput) => number): number {
  const sum = weights.reduce((s, w) => s + w, 0);
  return rows.reduce((s, row, i) => s + pick(row) * weights[i], 0) / sum;
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
    SCORE_KEYS.map((k) => [k, Math.round(wavg(rows, weights, (p) => p.scores[k]))]),
  ) as Scores;
  const signals: Signals = {
    testRunsPerSession: round1(wavg(rows, weights, (p) => p.signals.testRunsPerSession)),
    testFixRate: round2(wavg(rows, weights, (p) => p.signals.testFixRate)),
    exploreBeforeEditRate: round2(wavg(rows, weights, (p) => p.signals.exploreBeforeEditRate)),
    planBeforeCodeRate: round2(wavg(rows, weights, (p) => p.signals.planBeforeCodeRate)),
    agentRejectRate: round2(wavg(rows, weights, (p) => p.signals.agentRejectRate)),
    medianCommitLines: Math.round(wavg(rows, weights, (p) => p.signals.medianCommitLines)),
    commitsPerActiveDay: round1(wavg(rows, weights, (p) => p.signals.commitsPerActiveDay)),
    testCommitShare: round2(wavg(rows, weights, (p) => p.signals.testCommitShare)),
    activeHours: Array.from({ length: 24 }, (_, h) =>
      Math.round(wavg(rows, weights, (p) => p.signals.activeHours[h] ?? 0)),
    ),
    areas: {
      frontend: round2(wavg(rows, weights, (p) => p.signals.areas.frontend)),
      backend: round2(wavg(rows, weights, (p) => p.signals.areas.backend)),
      infra: round2(wavg(rows, weights, (p) => p.signals.areas.infra)),
      data: round2(wavg(rows, weights, (p) => p.signals.areas.data)),
    },
    sharedRepos: {
      count: Math.round(rows.reduce((s, r) => s + r.signals.sharedRepos.count, 0)),
      separateAreasRate: round2(wavg(rows, weights, (p) => p.signals.sharedRepos.separateAreasRate)),
      buildsOnOthersRate: round2(wavg(rows, weights, (p) => p.signals.sharedRepos.buildsOnOthersRate)),
      coAuthoredRate: round2(wavg(rows, weights, (p) => p.signals.sharedRepos.coAuthoredRate)),
    },
  };
  const sessions = rows.reduce((s, r) => s + r.counts.sessions, 0);
  const commits = rows.reduce((s, r) => s + r.counts.commits, 0);
  const level: Confidence =
    sessions >= 40 || commits >= 150 ? "strong" : sessions >= 5 || sources.includes("challenge") ? "medium" : "weak";
  const confidence = Object.fromEntries(SCORE_KEYS.map((k) => [k, level])) as Record<ScoreKey, Confidence>;
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
    },
    signals,
    scores,
    confidence,
    rating: latest.rating,
    createdAt: latest.createdAt,
    uploadCount: rows.length,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
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
