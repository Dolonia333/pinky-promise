import type { ScoreKey } from "./types.ts";

export const HABITS = ["planning", "quality", "pace", "exploration", "steering"] as const satisfies readonly ScoreKey[];

export type Habit = (typeof HABITS)[number];

export type QuizArchetypeId =
  | "blueprint"
  | "inspector"
  | "rocket"
  | "scout"
  | "pilot"
  | "allrounder"
  | "wildcard"
  | "fresh";

export type Answer = { id: string; text: string; kind: Habit };

export type Question = {
  id: string;
  scene: string;
  prompt: string;
  answers: [Answer, Answer, Answer];
};

export type QuizArchetype = {
  id: QuizArchetypeId;
  name: string;
  synonym: string;
  plain: string;
  habit: Habit | null;
};

export const SCORE_WORD: Record<Habit, string> = {
  planning: "Planning",
  quality: "Proof",
  pace: "Pace",
  exploration: "Listening",
  steering: "Direction",
};
  planning: "blueprint",
  quality: "inspector",
  pace: "rocket",
  exploration: "scout",
  steering: "pilot",
};

export const QUIZ_ARCHETYPES: QuizArchetype[] = [
  { id: "blueprint", name: "The Blueprint", synonym: "The Mapmaker", plain: "You write the path before anyone spends the week.", habit: "planning" },
  { id: "inspector", name: "The Inspector", synonym: "The Proofer", plain: "You won't call it done until the claim and the proof match.", habit: "quality" },
  { id: "rocket", name: "The Rocket", synonym: "The Sprinter", plain: "You'd rather put a small thing in someone's hands than polish a big one.", habit: "pace" },
  { id: "scout", name: "The Scout", synonym: "The Listener", plain: "You learn the people and the problem before you pick a direction.", habit: "exploration" },
  { id: "pilot", name: "The Pilot", synonym: "The Skipper", plain: "When the work drifts, you bring it back to the one result you asked for.", habit: "steering" },
  { id: "allrounder", name: "The All-Rounder", synonym: "The Balancer", plain: "Your picks finished in a tie. More than one way of working stayed in play.", habit: null },
  { id: "wildcard", name: "The Wildcard", synonym: "The Improviser", plain: "Two ways of working tied. Neither one took the week.", habit: null },
  { id: "fresh", name: "The Fresh Start", synonym: "The Newcomer", plain: "There isn't a pattern yet. A few answers aren't a way of working.", habit: null },
];

function answer(question: number, slot: number, kind: Habit, text: string): Answer {
  return { id: `q${question}${String.fromCharCode(97 + slot)}`, kind, text };
}

/** Ten scenes. Each answer leads with its cost, so none is the flattering choice. */
export const QUESTIONS: Question[] = [
  {
    id: "q1",
    scene: "A partner texts",
    prompt: "“Let's just start.” What do you do first?",
    answers: [
      answer(1, 0, "planning", "They wait on your page — you won't start until it says who it's for."),
      answer(1, 1, "quality", "The rest of the idea sits — you refuse the part you can't already show."),
      answer(1, 2, "pace", "You will have to explain the holes — you send something rough tomorrow."),
    ],
  },
  {
    id: "q2",
    scene: "The customer is still a blur",
    prompt: "You have a morning and no meetings. How do you use it?",
    answers: [
      answer(2, 0, "planning", "You still haven't spoken to anyone — the morning goes to one sentence about who they are."),
      answer(2, 1, "exploration", "You leave with notes and no decision — the morning goes to sitting with people who have the problem."),
      answer(2, 2, "steering", "You may have picked the wrong one — you choose one kind of person and ignore the rest."),
    ],
  },
  {
    id: "q3",
    scene: "The deck looks finished",
    prompt: "The numbers on the page are still guesses. What happens to it?",
    answers: [
      answer(3, 0, "quality", "Nobody sees the deck — it stays in the folder until the numbers are real."),
      answer(3, 1, "pace", "A guess goes out with your name on it — you send the deck and fix the numbers from the replies."),
      answer(3, 2, "exploration", "The deck waits — you ask three people if those numbers even matter."),
    ],
  },
  {
    id: "q4",
    scene: "A helper drifts",
    prompt: "Someone you hired starts solving a different problem. You…",
    answers: [
      answer(4, 0, "steering", "Their other idea dies — you stop them mid-task and drag them back."),
      answer(4, 1, "quality", "They wasted the time — you let them finish, then throw it out if it doesn't match."),
      answer(4, 2, "planning", "Nothing ships while you rewrite — you stop the work and rewrite the brief."),
    ],
  },
  {
    id: "q5",
    scene: "Monday is empty",
    prompt: "Nothing is on the calendar. What gets the hour?",
    answers: [
      answer(5, 0, "planning", "Nothing goes out the door — the hour goes to writing the next three steps."),
      answer(5, 1, "pace", "The rest of the list stays blank — you put one small thing in front of a person before lunch."),
      answer(5, 2, "exploration", "The calendar stays empty — the hour goes to a question you still haven't asked."),
    ],
  },
  {
    id: "q6",
    scene: "A plan you don't believe",
    prompt: "Someone you respect pushes a direction you doubt. You…",
    answers: [
      answer(6, 0, "steering", "You may be wrong in public — you refuse their direction and say what you'll do instead."),
      answer(6, 1, "pace", "The week goes to a bet you don't believe — you try their version with one person."),
      answer(6, 2, "quality", "The decision waits on you — you don't move until you can show their version fails."),
    ],
  },
  {
    id: "q7",
    scene: "Nobody owns the call",
    prompt: "The team is moving, but nobody has said who decides. You…",
    answers: [
      answer(7, 0, "planning", "The team stops — you freeze the work until every piece has a name."),
      answer(7, 1, "steering", "Everyone else loses a say — you name one person and close the thread."),
      answer(7, 2, "exploration", "The call slips another day — you ask what the group heard before anyone decides."),
    ],
  },
  {
    id: "q8",
    scene: "The favorite idea cracks",
    prompt: "A customer says something that kills the idea you liked most. You…",
    answers: [
      answer(8, 0, "exploration", "You delay the cut — you book two more conversations before you bury it or keep it."),
      answer(8, 1, "quality", "The idea stays half-dead — you don't choose until you can show which version holds."),
      answer(8, 2, "pace", "You might have dropped the right one — you drop it and ship the other version this week."),
    ],
  },
  {
    id: "q9",
    scene: "How to work with you",
    prompt: "A possible partner asks what they should know. You say…",
    answers: [
      answer(9, 0, "pace", "They get no help until it's done — you tell them you only look at a finished scrap."),
      answer(9, 1, "steering", "They don't get a long leash — you tell them you'll yank the work back if it drifts."),
      answer(9, 2, "planning", "They wait on your page — you tell them you won't start until the steps are written."),
    ],
  },
  {
    id: "q10",
    scene: "The week is almost gone",
    prompt: "A lot got discussed. Nothing feels finished. You…",
    answers: [
      answer(10, 0, "exploration", "The unfinished work stays unfinished — the last hour goes to someone you still haven't heard."),
      answer(10, 1, "steering", "The other threads die tonight — you cut the list to one result and ignore the rest."),
      answer(10, 2, "quality", "Everything else gets thrown out — you keep only the claim you can still stand behind."),
    ],
  },
];

export type QuizResult = {
  archetypeId: QuizArchetypeId;
  counts: Record<Habit, number>;
  offered: Record<Habit, number>;
  answered: number;
  lead: Habit | null;
  aheadBy: number;
  runnerUp: Habit | null;
};

const ZERO: Record<Habit, number> = { planning: 0, quality: 0, pace: 0, exploration: 0, steering: 0 };

export function archetypeById(id: QuizArchetypeId): QuizArchetype {
  const found = QUIZ_ARCHETYPES.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown archetype ${id}`);
  return found;
}

/** One habit ahead → that type. Two tied → Wildcard. Three or more tied → All-Rounder. */
export function archetypeFromCounts(counts: Record<Habit, number>): QuizArchetypeId {
  const ranked = HABITS.map((habit) => [habit, counts[habit]] as const).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = ranked[0][1];
  const leaders = ranked.filter(([, count]) => count === top);
  if (leaders.length === 1) return BY_HABIT[leaders[0][0]];
  if (leaders.length === 2) return "wildcard";
  return "allrounder";
}

export function offerCounts(): Record<Habit, number> {
  const counts = { ...ZERO };
  for (const question of QUESTIONS) for (const choice of question.answers) counts[choice.kind] += 1;
  return counts;
}

/** A pick counts only for that habit. The command's 15-point rule is not used here. */
export function scorePicks(picks: Answer[]): QuizResult {
  const offered = offerCounts();
  const counts = { ...ZERO };
  if (picks.length < 3) {
    return { archetypeId: "fresh", counts, offered, answered: picks.length, lead: null, aheadBy: 0, runnerUp: null };
  }
  for (const pick of picks) counts[pick.kind] += 1;
  const ranked = HABITS.map((habit) => [habit, counts[habit]] as const).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = ranked[0][1];
  const leaders = ranked.filter(([, count]) => count === top);
  const second = ranked.find(([, count]) => count < top);
  const seconds = second ? ranked.filter(([, count]) => count === second[1]) : [];
  return {
    archetypeId: archetypeFromCounts(counts),
    counts,
    offered,
    answered: picks.length,
    lead: leaders.length === 1 ? leaders[0][0] : null,
    aheadBy: leaders.length === 1 ? top - (second?.[1] ?? 0) : 0,
    runnerUp: leaders.length === 1 && seconds.length === 1 ? seconds[0][0] : null,
  };
}

export function pickFor(question: Question, kind: Habit): Answer {
  const match = question.answers.find((item) => item.kind === kind);
  if (!match) throw new Error(`${question.id} has no ${kind}`);
  return match;
}

export function picksForHabit(habit: Habit): Answer[] {
  const fallbacks = { ...ZERO };
  return QUESTIONS.map((question) => {
    const exact = question.answers.find((item) => item.kind === habit);
    if (exact) return exact;
    const choice = question.answers.slice().sort((a, b) => fallbacks[a.kind] - fallbacks[b.kind] || a.kind.localeCompare(b.kind))[0];
    fallbacks[choice.kind] += 1;
    return choice;
  });
}

export function picksForBalance(): Answer[] {
  const order: Habit[] = ["planning", "exploration", "quality", "steering", "pace", "quality", "planning", "exploration", "pace", "steering"];
  return order.map((kind, index) => pickFor(QUESTIONS[index]!, kind));
}

export function picksForSplit(): Answer[] {
  const order: Habit[] = ["planning", "planning", "exploration", "planning", "exploration", "quality", "exploration", "quality", "pace", "steering"];
  return order.map((kind, index) => pickFor(QUESTIONS[index]!, kind));
}

export function picksForLean(): Answer[] {
  const order: Habit[] = ["planning", "exploration", "exploration", "quality", "pace", "quality", "planning", "exploration", "pace", "steering"];
  return order.map((kind, index) => pickFor(QUESTIONS[index]!, kind));
}
