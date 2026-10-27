import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, Ghost, Note, Primary, Shell } from "@/components/pinky-ui";
import { QUESTIONS, SCORE_WORD, archetypeById, scorePicks, type Answer } from "@/lib/pinky/founder-quiz";

export const Route = createFileRoute("/challenge/")({ component: ChallengeHome });

function rotate<T>(items: readonly T[], by: number): T[] {
  const shift = by % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

function ChallengeHome() {
  const [step, setStep] = useState<"intro" | "question" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Answer[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [showNext, setShowNext] = useState(false);
  const question = QUESTIONS[index];

  function start() {
    setPicks([]);
    setIndex(0);
    setChosen(null);
    setShowNext(false);
    setStep("question");
  }

  function commit() {
    if (!chosen || !question) return;
    const answer = question.answers.find((item) => item.id === chosen);
    if (!answer) return;
    const next = [...picks.slice(0, index), answer];
    setPicks(next);
    if (index === QUESTIONS.length - 1) {
      setStep("result");
      return;
    }
    const following = QUESTIONS[index + 1];
    const already = next[index + 1];
    setIndex(index + 1);
    setChosen(already && following?.answers.some((item) => item.id === already.id) ? already.id : null);
  }

  const result = step === "result" ? scorePicks(picks) : null;
  const archetype = result ? archetypeById(result.archetypeId) : null;
  const runner = result?.runnerUp ? archetypeById(habitArchetype(result.runnerUp)) : null;

  return (
    <Shell>
      {step === "intro" ? (
        <>
          <p className="text-xs uppercase tracking-widest text-seal">Business founders</p>
          <h1 className="mt-1 font-display text-4xl italic">Ten scenes. Three costs.</h1>
          <Note>
            No coding history. Each choice costs you something. There is no smart answer. Pick the cost you would
            actually pay.
          </Note>
          <Primary className="mt-4" onClick={start}>
            Start the test
          </Primary>
        </>
      ) : null}

      {step === "question" && question ? (
        <>
          <div className="flex items-baseline justify-between gap-3 text-sm text-dust">
            <p>
              {index + 1} of {QUESTIONS.length}
            </p>
            <p>{question.scene}</p>
          </div>
          <h1 className="mt-3 font-display text-3xl italic">{question.prompt}</h1>
          <div className="mt-4 space-y-2" role="radiogroup" aria-label={question.prompt}>
            {rotate(question.answers, index).map((answer) => {
              const selected = chosen === answer.id;
              return (
                <button
                  key={answer.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setChosen(answer.id)}
                  className={`min-h-14 w-full rounded-card border px-4 py-3 text-left text-sm leading-snug ${
                    selected ? "border-seal bg-raised text-cream" : "border-line bg-paper text-cream"
                  }`}
                >
                  {answer.text}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <Ghost
              type="button"
              onClick={() => {
                if (index === 0) {
                  setStep("intro");
                  return;
                }
                setIndex(index - 1);
                setChosen(picks[index - 1]?.id ?? null);
              }}
            >
              Back
            </Ghost>
            <Primary type="button" disabled={!chosen} onClick={commit} className="flex-1">
              {index === QUESTIONS.length - 1 ? "See your type" : "Next"}
            </Primary>
          </div>
        </>
      ) : null}

      {step === "result" && result && archetype ? (
        <>
          <p className="text-xs uppercase tracking-widest text-seal">Your type</p>
          <h1 className="mt-1 font-display text-4xl italic">{archetype.synonym}</h1>
          <Note>Also called {archetype.name}</Note>
          <p className="mt-3 text-cream">{archetype.plain}</p>
          <Note>{leadCopy(result)}</Note>
          <Card className="mt-4">
            <ul className="space-y-3">
              {HABITS.map((habit) => {
                const count = result.counts[habit];
                const offered = result.offered[habit];
                return (
                  <li key={habit}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{SCORE_WORD[habit]}</span>
                      <span className="text-dust">
                        {count} of {offered}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                      <div className="h-full bg-seal" style={{ width: `${offered ? (count / offered) * 100 : 0}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          {runner && result.runnerUp ? (
            <div className="mt-4">
              <button type="button" className="text-sm text-seal" onClick={() => setShowNext((open) => !open)}>
                {showNext ? "Hide the next read" : "This doesn't sound like me"}
              </button>
              {showNext ? (
                <Note>
                  The next habit was {SCORE_WORD[result.runnerUp]}, {result.counts[result.runnerUp]} of{" "}
                  {result.offered[result.runnerUp]}. That read would be {runner.synonym}. It does not replace this
                  result.
                </Note>
              ) : null}
            </div>
          ) : null}
          <Note>This is a read of these ten scenes. It does not replace a profile from the command.</Note>
          <Ghost className="mt-4" onClick={start}>
            Take it again
          </Ghost>
        </>
      ) : null}
    </Shell>
  );
}

const HABITS = ["planning", "quality", "pace", "exploration", "steering"] as const;

function habitArchetype(habit: (typeof HABITS)[number]) {
  const id = { planning: "blueprint", quality: "inspector", pace: "rocket", exploration: "scout", steering: "pilot" } as const;
  return archetypeById(id[habit]);
}

function leadCopy(result: NonNullable<ReturnType<typeof scorePicks>>): string {
  const ranked = HABITS.map((habit) => ({ habit, count: result.counts[habit] })).sort(
    (a, b) => b.count - a.count || a.habit.localeCompare(b.habit),
  );
  const top = ranked[0]?.count ?? 0;
  const leaders = ranked.filter((item) => item.count === top);
  const names = leaders.map((item) => SCORE_WORD[item.habit]);
  if (leaders.length >= 3) return `${names.slice(0, -1).join(", ")} and ${names.at(-1)} tied at ${top} picks. No habit took the week.`;
  if (leaders.length === 2) return `${names[0]} and ${names[1]} tied at ${top} picks. Neither habit took the week.`;
  const leader = leaders[0];
  if (!leader) return "";
  const next = ranked.find((item) => item.count < top);
  const ahead = top - (next?.count ?? 0);
  const nextBit = next ? ` ${SCORE_WORD[next.habit]} was next, with ${next.count}.` : "";
  return `${SCORE_WORD[leader.habit]} led by ${ahead} ${ahead === 1 ? "pick" : "picks"} — ${top} of the ${result.offered[leader.habit]} times it was offered.${nextBit}`;
}
