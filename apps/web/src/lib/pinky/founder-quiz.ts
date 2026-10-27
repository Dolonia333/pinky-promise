/** Sixteen founder types · four splits · axis-pure scenes. */

export const AXES = ["start", "trust", "call", "scope"] as const;
export type Axis = (typeof AXES)[number];

export type Pole =
  | "page"
  | "hands"
  | "proof"
  | "trial"
  | "room"
  | "helm"
  | "one"
  | "several";

export const POLES: Record<Axis, [Pole, Pole]> = {
  start: ["page", "hands"],
  trust: ["proof", "trial"],
  call: ["room", "helm"],
  scope: ["one", "several"],
};

export const POLE_WORD: Record<Pole, string> = {
  page: "Page",
  hands: "Hands",
  proof: "Proof",
  trial: "Trial",
  room: "Room",
  helm: "Helm",
  one: "One bet",
  several: "Several bets",
};

export const AXIS_WORD: Record<Axis, string> = {
  start: "How you start",
  trust: "What you trust",
  call: "Who makes the call",
  scope: "How wide the week is",
};

export type GroupId = "paper-proof" | "paper-trial" | "hand-proof" | "hand-trial";

export type Group = {
  id: GroupId;
  title: string;
  plain: string;
};

export const GROUPS: Group[] = [
  {
    id: "paper-proof",
    title: "On paper, then proof",
    plain: "You write the path, and you will not send it until it holds.",
  },
  {
    id: "paper-trial",
    title: "On paper, then a trial",
    plain: "You write the path, then you try a small piece before it is finished.",
  },
  {
    id: "hand-proof",
    title: "In hand, but only proof",
    plain: "You put it in someone's hands, but only the part you can already show.",
  },
  {
    id: "hand-trial",
    title: "In hand, then you learn",
    plain: "You send something rough and let the replies decide what stays.",
  },
];

const NEED: Record<Pole, string> = {
  page: "put a rough version in someone's hands before the page is done",
  hands: "write the path before the next thing goes out",
  proof: "try a version before every fact is in",
  trial: "hold it until the claim and the proof match",
  room: "close the call while you are still listening",
  helm: "hear the room before you lock it",
  one: "keep a second bet alive beside the first",
  several: "kill the extra bets and stay on one",
};

const STRENGTH: Record<Pole, string> = {
  page: "You clarify the path before spend.",
  hands: "You get something real in front of people fast.",
  proof: "You won't claim what you can't show.",
  trial: "You learn from small bets before the big one.",
  room: "You keep listening before the decision locks.",
  helm: "You close the call when the work drifts.",
  one: "You protect focus on a single bet.",
  several: "You keep more than one path alive.",
};

const BLIND: Record<Pole, string> = {
  page: "The page can delay the first real contact.",
  hands: "Speed can outrun the brief.",
  proof: "Waiting for proof can miss the window.",
  trial: "Rough trials can confuse the room.",
  room: "Listening forever can stall the week.",
  helm: "Closing hard can shut out a better path.",
  one: "One bet can miss a better second idea.",
  several: "Several bets can thin every one of them.",
};

export type Poles = { start: Pole; trust: Pole; call: Pole; scope: Pole };

export type Archetype = {
  id: string;
  group: GroupId;
  poles: Poles;
  synonym: string;
  name: string;
  plain: string;
  need: string;
  strengths: string[];
  blinds: string[];
};

function archetype(poles: Poles, synonym: string, name: string, plain: string): Archetype {
  const group: GroupId = `${poles.start === "page" ? "paper" : "hand"}-${poles.trust}` as GroupId;
  return {
    id: `${poles.start}-${poles.trust}-${poles.call}-${poles.scope}`,
    group,
    poles,
    synonym,
    name,
    plain,
    need: `Look for someone who will ${NEED[poles.start]}, and who will ${NEED[poles.call]}.`,
    strengths: [STRENGTH[poles.start], STRENGTH[poles.trust], STRENGTH[poles.call], STRENGTH[poles.scope]],
    blinds: [BLIND[poles.start], BLIND[poles.trust], BLIND[poles.call], BLIND[poles.scope]],
  };
}

export const ARCHETYPES: Archetype[] = [
  archetype(
    { start: "page", trust: "proof", call: "room", scope: "one" },
    "The Archivist",
    "The Narrow File",
    "One bet. You write it, you prove it, and you hear the room before you lock it.",
  ),
  archetype(
    { start: "page", trust: "proof", call: "room", scope: "several" },
    "The Surveyor",
    "The Wide File",
    "Several bets. You write each one, you prove each one, and you keep listening.",
  ),
  archetype(
    { start: "page", trust: "proof", call: "helm", scope: "one" },
    "The Warden",
    "The Closed Brief",
    "One bet. You write it, you prove it, and you are the one who closes the call.",
  ),
  archetype(
    { start: "page", trust: "proof", call: "helm", scope: "several" },
    "The Clerk",
    "The Full Docket",
    "Several bets. You write them, you prove them, and you decide when each one closes.",
  ),
  archetype(
    { start: "page", trust: "trial", call: "room", scope: "one" },
    "The Drafter",
    "The Quiet Trial",
    "One plan, then a small trial. You stay in the room before you lock it.",
  ),
  archetype(
    { start: "page", trust: "trial", call: "room", scope: "several" },
    "The Sketcher",
    "The Open Draft",
    "Several plans, each tried small. You let the room tell you which sketch stays.",
  ),
  archetype(
    { start: "page", trust: "trial", call: "helm", scope: "one" },
    "The Marker",
    "The Marked Course",
    "One plan, a small trial, and you hold the wheel if it drifts.",
  ),
  archetype(
    { start: "page", trust: "trial", call: "helm", scope: "several" },
    "The Dispatcher",
    "The Split Plan",
    "Several plans, each tried small, and you pull them back when they drift.",
  ),
  archetype(
    { start: "hands", trust: "proof", call: "room", scope: "one" },
    "The Bench",
    "The Shown Piece",
    "One thing, in someone's hands, but only the part you can show. You still listen.",
  ),
  archetype(
    { start: "hands", trust: "proof", call: "room", scope: "several" },
    "The Sampler",
    "The Proof Run",
    "Several small proofs, shipped. You keep asking before you pick one.",
  ),
  archetype(
    { start: "hands", trust: "proof", call: "helm", scope: "one" },
    "The Inspector",
    "The Held Release",
    "One ship. Only what you can show. You decide when it stops.",
  ),
  archetype(
    { start: "hands", trust: "proof", call: "helm", scope: "several" },
    "The Auditor",
    "The Checked List",
    "Several releases. Each one has to hold, and you cut the ones that do not.",
  ),
  archetype(
    { start: "hands", trust: "trial", call: "room", scope: "one" },
    "The Scout",
    "The First Listen",
    "One rough thing in someone's hands, then you go hear more before you choose.",
  ),
  archetype(
    { start: "hands", trust: "trial", call: "room", scope: "several" },
    "The Host",
    "The Open Floor",
    "Several rough tries. You let the room tell you which one stays.",
  ),
  archetype(
    { start: "hands", trust: "trial", call: "helm", scope: "one" },
    "The Sprinter",
    "The Fast Cut",
    "One rough ship, then you close the other paths.",
  ),
  archetype(
    { start: "hands", trust: "trial", call: "helm", scope: "several" },
    "The Juggler",
    "The Many Cuts",
    "Several rough ships. You are the one who kills the ones that drift.",
  ),
];

export function groupById(id: GroupId): Group {
  const found = GROUPS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown group ${id}`);
  return found;
}

export function archetypeById(id: string): Archetype {
  const found = ARCHETYPES.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown archetype ${id}`);
  return found;
}

export function archetypeKey(poles: Poles): string {
  return `${poles.start}-${poles.trust}-${poles.call}-${poles.scope}`;
}

export function typesInGroup(groupId: GroupId): Archetype[] {
  return ARCHETYPES.filter((item) => item.group === groupId);
}

/** Flips start + call — the partner who covers how you begin and who decides. */
export function complementaryArchetype(type: Archetype): Archetype {
  const [startLeft, startRight] = POLES.start;
  const [callLeft, callRight] = POLES.call;
  const poles: Poles = {
    start: type.poles.start === startLeft ? startRight : startLeft,
    trust: type.poles.trust,
    call: type.poles.call === callLeft ? callRight : callLeft,
    scope: type.poles.scope,
  };
  return archetypeById(archetypeKey(poles));
}

/** Likely friction lines from your poles. */
export function frictionPoints(type: Archetype): string[] {
  const lines: string[] = [];
  if (type.poles.start === "page" && type.poles.trust === "proof") {
    lines.push("You'll want the brief finished while a partner wants something in someone's hands.");
  }
  if (type.poles.start === "hands" && type.poles.trust === "trial") {
    lines.push("You'll ship rough while a careful partner still wants the claim to hold.");
  }
  if (type.poles.call === "helm") {
    lines.push("You'll close the thread; a listening partner may feel cut out.");
  }
  if (type.poles.call === "room") {
    lines.push("You'll keep the room open; a decisive partner may feel the week is stalling.");
  }
  if (type.poles.scope === "one") {
    lines.push("You'll kill side bets; a wide partner will want a second path alive.");
  }
  if (type.poles.scope === "several") {
    lines.push("You'll keep several bets; a focused partner will say nothing is finished.");
  }
  if (lines.length < 2) {
    lines.push(BLIND[type.poles.start], BLIND[type.poles.trust]);
  }
  return lines.slice(0, 3);
}

export type Answer = { id: string; text: string; kind: Pole };

export type Question = {
  id: string;
  scene: string;
  prompt: string;
  axis: Axis;
  answers: [Answer, Answer];
};

function pair(
  question: number,
  axis: Axis,
  scene: string,
  prompt: string,
  leftText: string,
  rightText: string,
): Question {
  const [left, right] = POLES[axis];
  return {
    id: `q${question}`,
    scene,
    prompt,
    axis,
    answers: [
      { id: `q${question}a`, kind: left, text: leftText },
      { id: `q${question}b`, kind: right, text: rightText },
    ],
  };
}

/**
 * 24 scenes · 6 per axis · each answer stays on that axis.
 * Copy leads with the cost, kept short for phones.
 */
export const QUESTIONS: Question[] = [
  // start: page vs hands
  pair(1, "start", "A partner texts", "“Let's just start.” First move?", "They wait — you won't start until the page says who it's for.", "Holes stay — you send something rough tomorrow."),
  pair(2, "start", "Monday is empty", "Nothing on the calendar. The hour goes to…", "Nothing ships — you write the next three steps.", "The list stays blank — one small thing hits a person before lunch."),
  pair(3, "start", "Two ideas, one week", "You can only do one properly. The other…", "Gets no time — you write the path for the first.", "Gets no time — you ship the first and leave the other."),
  pair(4, "start", "Kickoff feels fuzzy", "The goal is still vague. You…", "Freeze build — clarify the page before anyone codes.", "Ship a stub — let the stub force the clarity."),
  pair(5, "start", "Investor wants a demo", "They asked for something tomorrow. You…", "Say not yet — the story on paper isn't ready.", "Send a rough cut — explain the holes live."),
  pair(6, "start", "New hire day one", "They ask what to do first. You hand them…", "A written brief — no build until it names the bet.", "A tiny task — they'll learn the bet by shipping."),

  // trust: proof vs trial
  pair(7, "trust", "The deck looks finished", "Numbers are still guesses. You…", "Nobody sees it — it stays put until numbers are real.", "A guess goes out — you fix numbers from the replies."),
  pair(8, "trust", "A plan you doubt", "Someone you respect pushes a path you don't buy. You…", "Wait — you won't move until you can show it fails.", "Try it — one person, one week, then decide."),
  pair(9, "trust", "Week almost gone", "Lots of talk, nothing finished. You…", "Throw out every claim you can't stand behind.", "Send several rough claims — some will be wrong."),
  pair(10, "trust", "Landing page copy", "The promise still feels soft. You…", "Hold publish — the claim has to be true first.", "Publish soft — learn which line people click."),
  pair(11, "trust", "Pricing guess", "You don't know what they'll pay. You…", "Pause selling — get one hard data point first.", "Name a price — let the first ten answers teach you."),
  pair(12, "trust", "Feature almost done", "One edge case still fails. You…", "Block release — it ships when the claim holds.", "Ship the core — note the edge and watch."),

  // call: room vs helm
  pair(13, "call", "Nobody owns the call", "The team is moving with no decider. You…", "Slip a day — ask what the group heard first.", "Close it — name one owner and end the thread."),
  pair(14, "call", "Favorite idea cracks", "A customer kills the idea you liked. You…", "Delay the cut — two more conversations first.", "Kill it now — move the team the same day."),
  pair(15, "call", "A helper drifts", "They start solving a different problem. You…", "Hear why they left the brief before you stop them.", "Stop them mid-task — drag them back."),
  pair(16, "call", "Slack is spinning", "The thread has twenty unread takes. You…", "Ask each person what they heard — then decide.", "Pick a direction in one message — debate later."),
  pair(17, "call", "Co-founder stalemate", "You're split 50/50 on the next bet. You…", "Keep talking until you both can live with it.", "Call it — one of you owns the pick this week."),
  pair(18, "call", "Scope creep", "A friendly customer wants “just one more.” You…", "Listen out the ask — maybe the brief was wrong.", "Say no today — park it on a later list."),

  // scope: one vs several
  pair(19, "scope", "A second good idea", "First bet still open. Another shows up. You…", "Kill it — no second bet until the first is shown.", "Keep it alive — first bet gets less of you."),
  pair(20, "scope", "Customer still a blur", "Morning free, no meetings. You…", "Pick one kind of person — ignore the rest.", "Keep two kinds in the notes — no single pick."),
  pair(21, "scope", "What you will show", "Friday needs a reaction. You…", "One rough version — nothing else ships.", "Three thin versions — none fully finished."),
  pair(22, "scope", "Roadmap fight", "The board wants three themes. You…", "Cut to one theme — the other two wait.", "Run thin work on all three this sprint."),
  pair(23, "scope", "Hiring slot", "One seat, two strong candidates. You…", "Hire for the one bet — the other waitlists.", "Hire the generalist — cover more than one bet."),
  pair(24, "scope", "Side project itch", "A weekend idea looks hot. You…", "Park it — this week's bet already owns you.", "Spike it for two hours — keep both alive."),
];

const ZERO: Record<Pole, number> = {
  page: 0,
  hands: 0,
  proof: 0,
  trial: 0,
  room: 0,
  helm: 0,
  one: 0,
  several: 0,
};

export type AxisResult = {
  left: Pole;
  right: Pole;
  leftCount: number;
  rightCount: number;
  winner: Pole | null;
};

export type QuizResult = {
  answered: number;
  counts: Record<Pole, number>;
  axes: Record<Axis, AxisResult>;
  archetype: Archetype | null;
  tied: Archetype[];
};

function axisResults(counts: Record<Pole, number>): Record<Axis, AxisResult> {
  return Object.fromEntries(
    AXES.map((axis) => {
      const [left, right] = POLES[axis];
      const leftCount = counts[left];
      const rightCount = counts[right];
      return [
        axis,
        {
          left,
          right,
          leftCount,
          rightCount,
          winner: leftCount === rightCount ? null : leftCount > rightCount ? left : right,
        },
      ];
    }),
  ) as Record<Axis, AxisResult>;
}

export function scorePicks(picks: Answer[]): QuizResult {
  const counts = { ...ZERO };
  for (const pick of picks) counts[pick.kind] += 1;
  const axes = axisResults(counts);
  if (picks.length < 4) {
    return { answered: picks.length, counts, axes, archetype: null, tied: [] };
  }
  const decided = AXES.every((axis) => axes[axis].winner !== null);
  if (decided) {
    const poles = Object.fromEntries(AXES.map((axis) => [axis, axes[axis].winner])) as Poles;
    const found = ARCHETYPES.find((item) => item.id === archetypeKey(poles)) ?? null;
    return { answered: picks.length, counts, axes, archetype: found, tied: [] };
  }
  const tied = ARCHETYPES.filter((item) =>
    AXES.every((axis) => axes[axis].winner === null || item.poles[axis] === axes[axis].winner),
  );
  return { answered: picks.length, counts, axes, archetype: null, tied };
}

export function nextRead(result: QuizResult): Archetype | null {
  if (!result.archetype) return result.tied[1] ?? null;
  const closest = AXES.map((axis) => ({
    axis,
    margin: Math.abs(result.axes[axis].leftCount - result.axes[axis].rightCount),
  })).sort((a, b) => a.margin - b.margin)[0]?.axis;
  if (!closest) return null;
  return (
    ARCHETYPES.find((item) =>
      AXES.every((axis) =>
        axis === closest
          ? item.poles[axis] !== result.archetype!.poles[axis]
          : item.poles[axis] === result.archetype!.poles[axis],
      ),
    ) ?? null
  );
}

export function pickFor(question: Question, kind: Pole): Answer {
  const match = question.answers.find((item) => item.kind === kind);
  if (!match) throw new Error(`${question.id} has no ${kind}`);
  return match;
}

export function picksForArchetype(target: Archetype): Answer[] {
  return QUESTIONS.map((question) => pickFor(question, target.poles[question.axis]));
}

/** Every question's answers stay on its axis. */
export function assertAxisPure(questions: Question[] = QUESTIONS): void {
  for (const question of questions) {
    const allowed = new Set(POLES[question.axis]);
    for (const answer of question.answers) {
      if (!allowed.has(answer.kind)) {
        throw new Error(`${question.id} answer ${answer.id} leaves axis ${question.axis}`);
      }
    }
  }
}

export type SavedResult = {
  archetypeId: string | null;
  tiedIds: string[];
  rating: number | null;
  feedback: string;
  savedAt: string;
  pickIds: string[];
};

const STORAGE_KEY = "pinky-founder-test-v2";

export function saveResult(payload: SavedResult): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadResult(): SavedResult | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedResult;
  } catch {
    return null;
  }
}

export function clearResult(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function shareText(type: Archetype): string {
  const partner = complementaryArchetype(type);
  return [
    `I'm ${type.synonym} (${type.name}) on Pinky Promise.`,
    type.plain,
    `Co-founder fit: ${partner.synonym} — ${type.need}`,
  ].join("\n");
}
