import type { AnalyzerPayload } from "./payload.ts";
import type { AreaKey, Scores } from "./types.ts";

export const SECTION_IDS = ["customer", "problem", "feature", "proof", "roles"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const SECTIONS: { id: SectionId; label: string; hint: string }[] = [
  { id: "customer", label: "Customer", hint: "Who is first. One person, not a market." },
  { id: "problem", label: "Problem", hint: "The pain, in their words." },
  { id: "feature", label: "First feature", hint: "The one thing you would build." },
  { id: "proof", label: "How we'll know", hint: "What changes if it worked." },
  { id: "roles", label: "Who does what", hint: "Who owns which part." },
];

export type ChallengeTemplate = {
  domain: string;
  title: string;
  brief: string;
  quotes: string[];
  constraint: string;
};

export const CHALLENGES: ChallengeTemplate[] = [
  {
    domain: "Health",
    title: "Shift handoff",
    brief:
      "Nurses lose the thread when a shift changes. Twelve complaints are on the table. In 15 minutes, name the first customer, the one feature, how you'd know it worked, and who owns what.",
    quotes: [
      "I spend the first hour re-asking what the last shift already knew.",
      "The notes app is a graveyard. Nobody reads it at 7am.",
      "If it's urgent it gets a text. Then the text is gone.",
    ],
    constraint: "One hospital unit. No new hardware.",
  },
  {
    domain: "Fintech",
    title: "Late invoices",
    brief:
      "Freelance designers get paid late and don't know which client to chase. Pick the first customer and the smallest thing that would get one invoice paid.",
    quotes: [
      "I don't invoice until I'm embarrassed, then it's already late.",
      "Net 30 means maybe, from the ones who like me.",
      "I will not learn accounting software to get $400.",
    ],
    constraint: "They will not connect a bank on day one.",
  },
  {
    domain: "Education",
    title: "The dropped course",
    brief:
      "Students at a community college disappear from one required course in week four. Decide who you serve first and what you'd build before midterms.",
    quotes: [
      "The tutor hours are when I work.",
      "I didn't know I was failing until the withdraw date.",
      "The group chat has the answers. The portal doesn't.",
    ],
    constraint: "The school will not give you grades data.",
  },
  {
    domain: "Climate",
    title: "The walk-in",
    brief:
      "Small restaurants throw out food they already paid for. Twelve owners complained about the walk-in, not about carbon.",
    quotes: [
      "I over-order fish on Fridays because Saturday is a guess.",
      "The sheet on the cooler door is a lie by noon.",
      "I don't need a sustainability badge. I need less in the bin.",
    ],
    constraint: "Budget this month is $2,000. One location.",
  },
  {
    domain: "Consumer",
    title: "The well visit",
    brief:
      "New parents lose track of what the pediatrician asked them to watch. Build the smallest thing for one kind of parent.",
    quotes: [
      "I have six screenshots and no idea which dose was today.",
      "The portal wants a password I made at 3am.",
      "My mother has different advice and a louder phone.",
    ],
    constraint: "No medical claims. No diagnosing.",
  },
  {
    domain: "B2B",
    title: "The truck notes",
    brief:
      "Field technicians finish a job and the notes never make it back to the office. The office then sends someone to redo it.",
    quotes: [
      "I type it later. Later is tomorrow. Tomorrow I forget the serial number.",
      "The form has 40 fields. The customer is watching me.",
      "Dispatch doesn't believe me unless there's a photo.",
    ],
    constraint: "Gloves on. One thumb, bad signal.",
  },
  {
    domain: "Housing",
    title: "The roommate bill",
    brief: "Roommates split bills badly and the resentment shows up in the group chat, not in a spreadsheet.",
    quotes: [
      "I buy the detergent and nobody venmos me.",
      "The rent is equal. The electricity isn't. We don't talk about it.",
      "I will not be the accountant of this apartment.",
    ],
    constraint: "Three people. No one will download a bank aggregator.",
  },
  {
    domain: "Climate",
    title: "The Tuesday water",
    brief: "Small farms guess at irrigation. They don't want a platform. They want to know if Tuesday needs water.",
    quotes: [
      "The sensor company wanted a subscription and a seminar.",
      "I know the north field. I don't know it at 5am from the truck.",
      "Last year I watered a field that didn't need it and I still think about it.",
    ],
    constraint: "One crop. The farmer will not learn a dashboard.",
  },
];

const CONSTRAINTS = [
  "You have six weeks, nights only.",
  "One engineer. No new hires.",
  "The first version has to fit on a phone.",
];

export function renderBrief(t: ChallengeTemplate, seed: string): { brief: string; constraint: string } {
  const extra = CONSTRAINTS[seed.charCodeAt(0) % CONSTRAINTS.length] ?? CONSTRAINTS[0];
  const constraint = `${t.constraint} ${extra}`;
  const quotes = t.quotes.map((q) => `“${q}”`).join("\n");
  return {
    constraint,
    brief: `${t.brief}\n\nWhat you heard:\n${quotes}\n\nConstraint: ${constraint}`,
  };
}

export type Card = {
  id: string;
  section: SectionId;
  text: string;
  comments: string[];
  votes: number;
};

export type BoardEvent = {
  type: string;
  section: string | null;
  cardId: string | null;
  payload: { text?: string };
  createdAt: string;
};

export type Board = {
  cards: Card[];
  locks: SectionId[];
  adds: number;
  edits: number;
  votes: number;
};

export function boardFromEvents(events: BoardEvent[]): Board {
  const cards: Card[] = [];
  const locks: SectionId[] = [];
  let adds = 0;
  let edits = 0;
  let votes = 0;
  for (const event of events) {
    if (event.type === "add" && event.cardId && event.section && isSection(event.section)) {
      adds += 1;
      cards.push({
        id: event.cardId,
        section: event.section,
        text: event.payload.text ?? "",
        comments: [],
        votes: 0,
      });
    } else if (event.type === "edit" && event.cardId) {
      edits += 1;
      const card = cards.find((c) => c.id === event.cardId);
      if (card && event.payload.text) card.text = event.payload.text;
    } else if (event.type === "comment" && event.cardId && event.payload.text) {
      const card = cards.find((c) => c.id === event.cardId);
      if (card) card.comments.push(event.payload.text);
    } else if (event.type === "vote" && event.cardId) {
      votes += 1;
      const card = cards.find((c) => c.id === event.cardId);
      if (card) card.votes += 1;
    } else if (event.type === "lock" && event.section && isSection(event.section) && !locks.includes(event.section)) {
      locks.push(event.section);
    }
  }
  return { cards, locks, adds, edits, votes };
}

export function isSection(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value);
}

export function nudgesFor(board: Board, elapsedSec: number): string[] {
  const out: string[] = [];
  const feature = board.cards.filter((c) => c.section === "feature").length;
  const customers = board.cards.filter((c) => c.section === "customer").length;
  if (elapsedSec > 300 && feature === 0) out.push("Five minutes in and there's no first feature yet.");
  if (customers >= 2 && !board.locks.includes("customer")) {
    out.push("More than one customer is on the board. Pick one before you move on.");
  }
  if (elapsedSec > 780 && board.locks.length < 3) out.push("Two minutes left. Lock the sections you actually believe.");
  return out.slice(0, 3);
}

export function challengePayload(board: Board, startedAt: string, endedAt: string): AnalyzerPayload {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const firstLockAt = end;
  const mins = Math.max(0.5, (firstLockAt - start) / 60000);
  const sectionsTouched = new Set(board.cards.map((c) => c.section));
  let planning = 18;
  if (sectionsTouched.has("customer")) planning += 16;
  if (sectionsTouched.has("problem")) planning += 16;
  if (sectionsTouched.has("proof")) planning += 18;
  if (board.locks.includes("proof")) planning += 16;
  if (board.locks.includes("customer") || board.locks.includes("problem")) planning += 12;
  let quality = 16 + Math.min(board.edits, 8) * 6;
  if (board.locks.includes("proof")) quality += 24;
  if (board.locks.includes("roles")) quality += 12;
  let pace = mins <= 4 ? 88 : mins <= 8 ? 74 : mins <= 12 ? 58 : 42;
  if (board.locks.length >= 4) pace = Math.min(100, pace + 6);
  const exploration = Math.min(100, 28 + Math.min(board.cards.length, 8) * 8 + sectionsTouched.size * 6);
  const ratio = (board.edits + board.votes) / Math.max(1, board.adds);
  const steering = Math.min(100, Math.round(22 + ratio * 50));
  const scores: Scores = {
    planning: cap(planning),
    quality: cap(quality),
    pace: cap(pace),
    exploration: cap(exploration),
    steering: cap(steering),
  };
  const weights: Record<AreaKey, number> = { frontend: 0, backend: 0, infra: 0, data: 0 };
  for (const card of board.cards) {
    const area = sectionArea(card.section);
    weights[area] += 1;
  }
  for (const lock of board.locks) weights[sectionArea(lock)] += 1.5;
  const total = Object.values(weights).reduce((s, n) => s + n, 0) || 1;
  const areas = {
    frontend: round2(weights.frontend / total),
    backend: round2(weights.backend / total),
    infra: round2(weights.infra / total),
    data: round2(weights.data / total),
  };
  const hour = new Date(endedAt).getUTCHours();
  const activeHours = Array.from({ length: 24 }, (_, i) => (i === hour ? 1 : 0));
  const level = board.adds >= 3 ? "medium" : "weak";
  return {
    analyzerVersion: "challenge-0.1.0",
    sources: ["challenge"],
    window: { from: startedAt.slice(0, 10), to: endedAt.slice(0, 10) },
    counts: { repos: 0, commits: 0, sessions: 1 },
    signals: {
      testRunsPerSession: 0,
      testFixRate: board.locks.includes("proof") ? 1 : 0,
      exploreBeforeEditRate: Math.min(1, sectionsTouched.size / 5),
      planBeforeCodeRate: board.locks.includes("problem") || board.locks.includes("customer") ? 0.8 : 0.3,
      agentRejectRate: Math.min(1, board.edits / Math.max(1, board.adds)),
      medianCommitLines: 0,
      commitsPerActiveDay: 0,
      testCommitShare: 0,
      activeHours,
      areas,
      sharedRepos: { count: 0, separateAreasRate: 0, buildsOnOthersRate: 0, coAuthoredRate: 0 },
    },
    scores,
    confidence: {
      planning: level,
      quality: level,
      pace: level,
      exploration: level,
      steering: level,
    },
  };
}

function sectionArea(section: SectionId): AreaKey {
  if (section === "customer" || section === "problem") return "frontend";
  if (section === "feature") return "backend";
  if (section === "roles") return "infra";
  return "data";
}

function cap(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const CHALLENGE_MS = 15 * 60 * 1000;
