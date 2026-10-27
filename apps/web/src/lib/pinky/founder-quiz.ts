/** Exact founder test from https://pinkypromise.grok.me — sixteen types, four splits. */

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

/** Four groups — same shape as 16Personalities' Analysts / Diplomats / Sentinels / Explorers. */
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

export type Poles = { start: Pole; trust: Pole; call: Pole; scope: Pole };

export type Archetype = {
  id: string;
  group: GroupId;
  poles: Poles;
  synonym: string;
  name: string;
  plain: string;
  need: string;
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
  };
}

/** The sixteen founder types. */
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

export function archetypeKey(poles: Poles): string {
  return `${poles.start}-${poles.trust}-${poles.call}-${poles.scope}`;
}

export type Answer = { id: string; text: string; kind: Pole };

export type Question = {
  id: string;
  scene: string;
  prompt: string;
  axis: Axis;
  answers: [Answer, Answer, Answer];
};

function answer(question: number, slot: number, kind: Pole, text: string): Answer {
  return { id: `q${question}${String.fromCharCode(97 + slot)}`, kind, text };
}

/** Twelve scenes. Three costs each. */
export const QUESTIONS: Question[] = [
  {
    id: "q1",
    scene: "A partner texts",
    prompt: "“Let's just start.” What do you do first?",
    axis: "start",
    answers: [
      answer(1, 0, "page", "They wait on your page. You will not start until it says who it is for."),
      answer(1, 1, "hands", "You will have to explain the holes. You send something rough tomorrow."),
      answer(1, 2, "proof", "The rest of the idea sits. You only start the part you can already show."),
    ],
  },
  {
    id: "q2",
    scene: "Monday is empty",
    prompt: "Nothing is on the calendar. What gets the hour?",
    axis: "start",
    answers: [
      answer(2, 0, "page", "Nothing goes out the door. The hour goes to writing the next three steps."),
      answer(2, 1, "hands", "The rest of the list stays blank. You put one small thing in front of a person before lunch."),
      answer(2, 2, "room", "The calendar stays empty. The hour goes to a question you still have not asked."),
    ],
  },
  {
    id: "q3",
    scene: "Two ideas, one week",
    prompt: "You can only touch one of them properly. What happens to the other?",
    axis: "start",
    answers: [
      answer(3, 0, "page", "The second idea gets no time. You write the path for the first and leave the other unnamed."),
      answer(3, 1, "hands", "The second idea gets no time. You ship the first and leave the other on the table."),
      answer(3, 2, "one", "You ignore a good second idea. This week has one bet, even if the other is better."),
    ],
  },
  {
    id: "q4",
    scene: "The deck looks finished",
    prompt: "The numbers on the page are still guesses. What happens to it?",
    axis: "trust",
    answers: [
      answer(4, 0, "proof", "Nobody sees the deck. It stays in the folder until the numbers are real."),
      answer(4, 1, "trial", "A guess goes out with your name on it. You send it and fix the numbers from the replies."),
      answer(4, 2, "page", "The deck waits. You rewrite who it is for before you touch the numbers."),
    ],
  },
  {
    id: "q5",
    scene: "A plan you doubt",
    prompt: "Someone you respect pushes a direction you do not believe. You...",
    axis: "trust",
    answers: [
      answer(5, 0, "proof", "The decision waits on you. You do not move until you can show their version fails."),
      answer(5, 1, "trial", "The week goes to a bet you doubt. You try their version with one person."),
      answer(5, 2, "helm", "You may be wrong in public. You refuse their direction and name your own."),
    ],
  },
  {
    id: "q6",
    scene: "The week is almost gone",
    prompt: "A lot got discussed. Nothing feels finished. You...",
    axis: "trust",
    answers: [
      answer(6, 0, "proof", "You throw out every claim you cannot stand behind. The rest of the week is lost."),
      answer(6, 1, "trial", "You send several rough claims. Some of them will be wrong in front of people."),
      answer(6, 2, "several", "You keep four bets alive. None of them gets a full proof this week."),
    ],
  },
  {
    id: "q7",
    scene: "Nobody owns the call",
    prompt: "The team is moving, but nobody has said who decides. You...",
    axis: "call",
    answers: [
      answer(7, 0, "room", "The call slips a day. You ask what the group heard before anyone decides."),
      answer(7, 1, "helm", "Everyone else loses a say. You name one person and close the thread."),
      answer(7, 2, "hands", "You skip the debate. A rough version goes out, and that is the decision."),
    ],
  },
  {
    id: "q8",
    scene: "The favorite idea cracks",
    prompt: "A customer kills the idea you liked most. You...",
    axis: "call",
    answers: [
      answer(8, 0, "room", "You delay the cut. You book two more conversations before you bury it or keep it."),
      answer(8, 1, "helm", "You might bury the right one. You kill it now and move the team."),
      answer(8, 2, "trial", "You do not decide. You send both versions to one person each and wait."),
    ],
  },
  {
    id: "q9",
    scene: "A helper drifts",
    prompt: "Someone you hired starts solving a different problem. You...",
    axis: "call",
    answers: [
      answer(9, 0, "room", "Their detour gets the hour. You hear why they left the brief before you stop them."),
      answer(9, 1, "helm", "Their other idea dies. You stop them mid-task and drag them back."),
      answer(9, 2, "one", "You refuse the new problem even if it is real. The week already has its bet."),
    ],
  },
  {
    id: "q10",
    scene: "A second good idea",
    prompt: "The first bet is still open. Another good one shows up. You...",
    axis: "scope",
    answers: [
      answer(10, 0, "one", "A good idea dies. You will not add a second bet until the first has been shown."),
      answer(10, 1, "several", "The first bet gets less of you. You keep the second one alive beside it."),
      answer(10, 2, "proof", "You add neither. You stay on the only claim you can already prove."),
    ],
  },
  {
    id: "q11",
    scene: "The customer is still a blur",
    prompt: "You have a morning and no meetings. How do you use it?",
    axis: "scope",
    answers: [
      answer(11, 0, "one", "You may have picked the wrong person. You ignore every other kind of customer."),
      answer(11, 1, "several", "You leave with no single choice. You keep two kinds of customer in the notes."),
      answer(11, 2, "room", "You do not pick a customer. The morning goes to listening, not to a list."),
    ],
  },
  {
    id: "q12",
    scene: "What you will show",
    prompt: "Friday needs something a person can react to. You...",
    axis: "scope",
    answers: [
      answer(12, 0, "one", "Nothing else ships. The week goes to a single rough version."),
      answer(12, 1, "several", "Every version stays thin. You send three small ones instead of finishing one."),
      answer(12, 2, "hands", "You do not settle the list. You send whatever is ready and drop the rest."),
    ],
  },
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
  if (picks.length < 3) {
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

/** Closest other type by flipping the narrowest split. */
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

export function typesInGroup(groupId: GroupId): Archetype[] {
  return ARCHETYPES.filter((item) => item.group === groupId);
}

export function pickFor(question: Question, kind: Pole): Answer {
  const match = question.answers.find((item) => item.kind === kind);
  if (!match) throw new Error(`${question.id} has no ${kind}`);
  return match;
}

/** All twelve answers aimed at one pole set → that archetype. */
export function picksForArchetype(target: Archetype): Answer[] {
  return QUESTIONS.map((question) => {
    const want = target.poles[question.axis];
    const exact = question.answers.find((item) => item.kind === want);
    if (exact) return exact;
    return question.answers[0];
  });
}
