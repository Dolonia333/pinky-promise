import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, Ghost, Note, Primary, Shell } from "@/components/pinky-ui";
import {
  ARCHETYPES,
  AXIS_WORD,
  AXES,
  GROUPS,
  POLE_WORD,
  QUESTIONS,
  groupById,
  nextRead,
  scorePicks,
  typesInGroup,
  type Answer,
  type Archetype,
  type Axis,
  type QuizResult,
} from "@/lib/pinky/founder-quiz";

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

  return (
    <Shell>
      {step === "intro" ? <Intro onStart={start} /> : null}

      {step === "question" && question ? (
        <>
          <div className="flex items-baseline justify-between gap-3 text-sm text-dust">
            <p>
              {index + 1} of {QUESTIONS.length}
            </p>
            <p>{question.scene}</p>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full bg-seal" style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} />
          </div>
          <h1 className="mt-6 font-display text-3xl italic">{question.prompt}</h1>
          <div className="mt-6 space-y-3" role="radiogroup" aria-label={question.prompt}>
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
          <div className="mt-6 flex gap-3">
            <Ghost
              type="button"
              className="flex-1"
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
            <Primary type="button" disabled={!chosen} onClick={commit} className="flex-[2]">
              {index === QUESTIONS.length - 1 ? "See your type" : "Next"}
            </Primary>
          </div>
        </>
      ) : null}

      {step === "result" && result ? (
        <Result result={result} showNext={showNext} setShowNext={setShowNext} onRetake={start} />
      ) : null}
    </Shell>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <>
      <p className="text-xs uppercase tracking-widest text-seal">Non-technical founders</p>
      <h1 className="mt-1 font-display text-4xl italic">Sixteen types. Four splits.</h1>
      <Note>
        Twelve scenes. Three costs each. There is no smart answer. Pick the cost you would actually pay. The names
        are Pinky Promise&apos;s. They are not taken from another test.
      </Note>
      <Primary className="mt-4" onClick={onStart}>
        Start the test
      </Primary>

      <h2 className="mt-10 font-display text-2xl">The sixteen types</h2>
      <p className="mt-2 text-sm text-dust">
        Four groups of four — same idea as{" "}
        <a
          href="https://www.16personalities.com/personality-types"
          className="text-seal underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          16Personalities
        </a>
        , built for founders.
      </p>
      <div className="mt-4 flex flex-col gap-6">
        {GROUPS.map((group) => (
          <section key={group.id}>
            <h3 className="text-sm font-medium uppercase tracking-wide text-seal">{group.title}</h3>
            <p className="mt-1 text-sm text-dust">{group.plain}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {typesInGroup(group.id).map((type) => (
                <li key={type.id} className="rounded-card border border-line bg-paper px-3 py-3">
                  <p className="text-cream">
                    {type.synonym}
                    <span className="text-dust"> · {type.name}</span>
                  </p>
                  <p className="mt-1 text-sm text-dust">{type.plain}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-4 text-xs text-dust">{ARCHETYPES.length} founder types · {QUESTIONS.length} scenes</p>
    </>
  );
}

function Result({
  result,
  showNext,
  setShowNext,
  onRetake,
}: {
  result: QuizResult;
  showNext: boolean;
  setShowNext: (value: boolean | ((open: boolean) => boolean)) => void;
  onRetake: () => void;
}) {
  const other = nextRead(result);

  return (
    <>
      <p className="text-xs uppercase tracking-widest text-seal">Your type</p>
      {result.archetype ? (
        <ArchetypeBlock archetype={result.archetype} />
      ) : result.tied.length > 1 ? (
        <>
          <h1 className="mt-1 font-display text-4xl italic">Two types fit</h1>
          <Note>One split finished even, so the test will not pretend it was decided.</Note>
          <div className="mt-4 flex flex-col gap-3">
            {result.tied.map((type) => (
              <Card key={type.id}>
                <p className="font-display text-2xl italic">{type.synonym}</p>
                <p className="text-sm text-dust">Also called {type.name}</p>
                <p className="mt-2 text-sm text-cream">{type.plain}</p>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-1 font-display text-4xl italic">Not enough yet</h1>
          <Note>Three answers is the minimum. A few scenes are not one of the sixteen types.</Note>
        </>
      )}

      <ul className="mt-8 space-y-4">
        {AXES.map((axis) => (
          <AxisBar key={axis} axis={axis} result={result} />
        ))}
      </ul>

      {other ? (
        <div className="mt-6">
          <button type="button" className="text-sm text-seal" onClick={() => setShowNext((open) => !open)}>
            {showNext ? "Hide the next read" : "This doesn't sound like me"}
          </button>
          {showNext ? (
            <Note>
              The closest other type is {other.synonym}. Also called {other.name}. It does not replace this result.
            </Note>
          ) : null}
        </div>
      ) : null}

      {result.archetype ? (
        <>
          <h2 className="mt-8 font-display text-2xl">The co-founder you need</h2>
          <p className="mt-3 text-dust">{result.archetype.need}</p>
        </>
      ) : null}

      <Ghost className="mt-8" onClick={onRetake}>
        Take it again
      </Ghost>
    </>
  );
}

function ArchetypeBlock({ archetype }: { archetype: Archetype }) {
  const group = groupById(archetype.group);
  return (
    <>
      <p className="mt-3 text-sm text-dust">{group.title}</p>
      <h1 className="mt-1 font-display text-4xl italic">{archetype.synonym}</h1>
      <Note>Also called {archetype.name}</Note>
      <p className="mt-4 text-lg text-cream">{archetype.plain}</p>
    </>
  );
}

function AxisBar({ axis, result }: { axis: Axis; result: QuizResult }) {
  const split = result.axes[axis];
  const total = Math.max(1, split.leftCount + split.rightCount);
  return (
    <li>
      <p className="text-sm text-dust">{AXIS_WORD[axis]}</p>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className={split.winner === split.left ? "text-cream" : "text-dust"}>{POLE_WORD[split.left]}</span>
        <span className="text-dust">
          {split.leftCount} to {split.rightCount}
          {split.winner ? "" : " · even"}
        </span>
        <span className={split.winner === split.right ? "text-cream" : "text-dust"}>{POLE_WORD[split.right]}</span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-seal" style={{ width: `${(split.leftCount / total) * 100}%` }} />
      </div>
    </li>
  );
}
