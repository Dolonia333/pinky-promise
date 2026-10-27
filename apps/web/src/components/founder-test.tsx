import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AXIS_WORD,
  AXES,
  GROUPS,
  POLE_WORD,
  QUESTIONS,
  complementaryArchetype,
  frictionPoints,
  groupById,
  loadResult,
  nextRead,
  saveResult,
  scorePicks,
  shareText,
  typesInGroup,
  type Answer,
  type Archetype,
  type Axis,
  type QuizResult,
} from "@/lib/pinky/founder-quiz";

function rotate<T>(items: readonly T[], by: number): T[] {
  const shift = by % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

/** Public founder test — no sign-in. */
export function FounderTest() {
  const [step, setStep] = useState<"intro" | "question" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Answer[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  const question = QUESTIONS[index];

  function start() {
    setPicks([]);
    setIndex(0);
    setChosen(null);
    setShowNext(false);
    setRating(null);
    setFeedback("");
    setCopied(false);
    setStep("question");
  }

  function commit() {
    if (!chosen || !question) return;
    const answer = question.answers.find((item) => item.id === chosen);
    if (!answer) return;
    const next = [...picks.slice(0, index), answer];
    setPicks(next);
    if (index === QUESTIONS.length - 1) {
      const scored = scorePicks(next);
      saveResult({
        archetypeId: scored.archetype?.id ?? null,
        tiedIds: scored.tied.map((t) => t.id),
        rating: null,
        feedback: "",
        savedAt: new Date().toISOString(),
        pickIds: next.map((p) => p.id),
      });
      setStep("result");
      return;
    }
    const following = QUESTIONS[index + 1];
    const already = next[index + 1];
    setIndex(index + 1);
    setChosen(already && following?.answers.some((item) => item.id === already.id) ? already.id : null);
  }

  function persistRating(nextRating: number) {
    setRating(nextRating);
    const scored = scorePicks(picks);
    saveResult({
      archetypeId: scored.archetype?.id ?? null,
      tiedIds: scored.tied.map((t) => t.id),
      rating: nextRating,
      feedback,
      savedAt: new Date().toISOString(),
      pickIds: picks.map((p) => p.id),
    });
  }

  function persistFeedback(value: string) {
    setFeedback(value);
    const scored = scorePicks(picks);
    saveResult({
      archetypeId: scored.archetype?.id ?? null,
      tiedIds: scored.tied.map((t) => t.id),
      rating,
      feedback: value,
      savedAt: new Date().toISOString(),
      pickIds: picks.map((p) => p.id),
    });
  }

  async function copyShare(type: Archetype) {
    try {
      await navigator.clipboard.writeText(shareText(type));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const result = step === "result" ? scorePicks(picks) : null;
  const saved = typeof window !== "undefined" ? loadResult() : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8">
      <header className="flex items-center justify-between gap-3 text-sm text-dust">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-seal" aria-hidden="true" />
          Pinky Promise
        </div>
        <Link to="/types" className="text-seal">
          All 16 types
        </Link>
      </header>

      {step === "intro" ? <Intro onStart={start} savedTypeId={saved?.archetypeId ?? null} /> : null}

      {step === "question" && question ? (
        <section className="mt-8 flex flex-1 flex-col">
          <div className="flex items-baseline justify-between gap-3 text-sm text-dust">
            <p>
              {index + 1} of {QUESTIONS.length}
            </p>
            <p>{question.scene}</p>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full bg-seal" style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} />
          </div>
          <p className="mt-4 text-xs uppercase tracking-widest text-seal">{AXIS_WORD[question.axis]}</p>
          <h1 className="mt-2 font-display text-3xl italic text-cream">{question.prompt}</h1>
          <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label={question.prompt}>
            {rotate(question.answers, index).map((answer) => {
              const selected = chosen === answer.id;
              return (
                <button
                  key={answer.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setChosen(answer.id)}
                  className={
                    "min-h-14 rounded-card border px-4 py-3 text-left text-base leading-snug transition-colors " +
                    (selected ? "border-seal bg-raised text-cream" : "border-line bg-paper text-cream hover:bg-raised")
                  }
                >
                  {answer.text}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (index === 0) {
                  setStep("intro");
                  return;
                }
                setIndex(index - 1);
                setChosen(picks[index - 1]?.id ?? null);
              }}
              className="min-h-12 flex-1 rounded-card border border-line bg-paper px-4 text-dust"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!chosen}
              onClick={commit}
              className="min-h-12 flex-[2] rounded-card bg-seal px-4 font-medium text-seal-ink disabled:opacity-40"
            >
              {index === QUESTIONS.length - 1 ? "See your type" : "Next"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "result" && result ? (
        <Result
          result={result}
          showNext={showNext}
          setShowNext={setShowNext}
          onRetake={start}
          rating={rating}
          feedback={feedback}
          onRate={persistRating}
          onFeedback={persistFeedback}
          copied={copied}
          onCopy={copyShare}
        />
      ) : null}
    </main>
  );
}

function Intro({ onStart, savedTypeId }: { onStart: () => void; savedTypeId: string | null }) {
  return (
    <section className="mt-10 flex flex-1 flex-col">
      <p className="text-xs font-medium uppercase tracking-widest text-seal">Founder types</p>
      <h1 className="mt-3 font-display text-4xl italic text-cream">Sixteen types. Four splits.</h1>
      <p className="mt-4 text-base text-dust">
        Twenty-four scenes. Two costs each. There is no smart answer. Pick the cost you would actually pay. Built for
        founders — technical or not.
      </p>
      {savedTypeId ? (
        <p className="mt-3 text-sm text-dust">
          You have a saved result on this device.{" "}
          <Link to="/types/$id" params={{ id: savedTypeId }} className="text-seal">
            Open your type
          </Link>
          , or take it again.
        </p>
      ) : null}
      <button
        type="button"
        onClick={onStart}
        className="mt-8 min-h-12 rounded-card bg-seal px-4 font-medium text-seal-ink"
      >
        Start the test
      </button>

      <h2 className="mt-10 font-display text-2xl text-cream">The sixteen types</h2>
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
        , made for how founders actually work.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {GROUPS.map((group) => (
          <section key={group.id}>
            <h3 className="text-sm font-medium uppercase tracking-wide text-seal">{group.title}</h3>
            <p className="mt-1 text-sm text-dust">{group.plain}</p>
            <ul className="mt-2 flex flex-col gap-2">
              {typesInGroup(group.id).map((type) => (
                <li key={type.id}>
                  <Link
                    to="/types/$id"
                    params={{ id: type.id }}
                    className="block rounded-card border border-line bg-paper px-3 py-3 hover:bg-raised"
                  >
                    <p className="text-cream">
                      {type.synonym}
                      <span className="text-dust"> · {type.name}</span>
                    </p>
                    <p className="text-sm text-dust">{type.plain}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-8 space-y-2 border-t border-line pt-6 text-sm text-dust">
        <p>Other ways in:</p>
        <p>
          <Link to="/studio" className="text-seal">
            Run the coding command
          </Link>{" "}
          ·{" "}
          <Link to="/history" className="text-seal">
            Upload ChatGPT / Claude history
          </Link>
        </p>
      </div>
    </section>
  );
}

function Result({
  result,
  showNext,
  setShowNext,
  onRetake,
  rating,
  feedback,
  onRate,
  onFeedback,
  copied,
  onCopy,
}: {
  result: QuizResult;
  showNext: boolean;
  setShowNext: (value: boolean | ((open: boolean) => boolean)) => void;
  onRetake: () => void;
  rating: number | null;
  feedback: string;
  onRate: (value: number) => void;
  onFeedback: (value: string) => void;
  copied: boolean;
  onCopy: (type: Archetype) => void;
}) {
  const other = nextRead(result);
  const partner = result.archetype ? complementaryArchetype(result.archetype) : null;
  const frictions = result.archetype ? frictionPoints(result.archetype) : [];

  return (
    <section className="mt-8 flex flex-1 flex-col">
      <p className="text-xs font-medium uppercase tracking-widest text-seal">Your type</p>
      {result.archetype ? (
        <ArchetypeBlock archetype={result.archetype} />
      ) : result.tied.length > 1 ? (
        <>
          <h1 className="mt-3 font-display text-4xl italic text-cream">Two types fit</h1>
          <p className="mt-3 text-dust">One split finished even, so the test will not pretend it was decided.</p>
          <div className="mt-4 flex flex-col gap-3">
            {result.tied.map((type) => (
              <Link
                key={type.id}
                to="/types/$id"
                params={{ id: type.id }}
                className="rounded-card border border-line bg-paper px-3 py-3"
              >
                <p className="font-display text-2xl italic text-cream">{type.synonym}</p>
                <p className="text-sm text-dust">Also called {type.name}</p>
                <p className="mt-2 text-sm text-cream">{type.plain}</p>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-3 font-display text-4xl italic text-cream">Not enough yet</h1>
          <p className="mt-3 text-dust">Answer more scenes to land one of the sixteen types.</p>
        </>
      )}

      <ul className="mt-8 flex flex-col gap-4">
        {AXES.map((axis) => (
          <AxisBar key={axis} axis={axis} result={result} />
        ))}
      </ul>

      {result.archetype && partner ? (
        <>
          <h2 className="mt-8 font-display text-2xl text-cream">The co-founder you need</h2>
          <p className="mt-3 text-dust">{result.archetype.need}</p>
          <Link
            to="/types/$id"
            params={{ id: partner.id }}
            className="mt-3 block rounded-card border border-seal/40 bg-paper px-3 py-3"
          >
            <p className="text-sm text-seal">Strong complement</p>
            <p className="font-display text-2xl italic text-cream">{partner.synonym}</p>
            <p className="text-sm text-dust">{partner.plain}</p>
          </Link>

          <h2 className="mt-8 font-display text-2xl text-cream">Where you&apos;ll clash</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-dust">
            {frictions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onCopy(result.archetype!)}
              className="min-h-12 flex-1 rounded-card bg-seal px-4 font-medium text-seal-ink"
            >
              {copied ? "Copied" : "Copy invite text"}
            </button>
            <Link
              to="/types/$id"
              params={{ id: result.archetype.id }}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-card border border-line bg-paper px-4 text-cream"
            >
              Open full type page
            </Link>
          </div>
        </>
      ) : null}

      {other ? (
        <div className="mt-6">
          <button type="button" onClick={() => setShowNext((open) => !open)} className="text-left text-sm text-seal">
            {showNext ? "Hide the next read" : "This doesn't sound like me"}
          </button>
          {showNext ? (
            <p className="mt-2 text-sm text-dust">
              The closest other type is {other.synonym}. Also called {other.name}. It does not replace this result.
            </p>
          ) : null}
        </div>
      ) : null}

      <h2 className="mt-10 font-display text-2xl text-cream">Does this sound like you?</h2>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRate(value)}
            className={
              "min-h-11 min-w-11 rounded-card border text-sm " +
              (rating === value ? "border-seal bg-seal text-seal-ink" : "border-line bg-paper text-cream")
            }
            aria-label={`Rate ${value} of 5`}
          >
            {value}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-dust">1 = not me · 5 = exactly me. Saved on this device only.</p>
      {rating !== null && rating <= 3 ? (
        <textarea
          value={feedback}
          onChange={(event) => onFeedback(event.target.value)}
          placeholder="What felt wrong?"
          rows={3}
          className="mt-3 w-full rounded-card border border-line bg-paper px-3 py-2 text-sm text-cream placeholder:text-dust"
        />
      ) : null}

      <button
        type="button"
        onClick={onRetake}
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-card border border-line bg-paper px-4 text-cream"
      >
        Take it again
      </button>
    </section>
  );
}

function ArchetypeBlock({ archetype }: { archetype: Archetype }) {
  const group = groupById(archetype.group);
  return (
    <>
      <p className="mt-3 text-sm text-dust">{group.title}</p>
      <h1 className="mt-1 font-display text-4xl italic text-cream">{archetype.synonym}</h1>
      <p className="mt-2 text-dust">Also called {archetype.name}</p>
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
