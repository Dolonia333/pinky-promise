import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, Ghost, Note, Primary, Shell } from "@/components/pinky-ui";
import { nudgesFor, SECTIONS, type SectionId } from "@/lib/pinky/challenge";
import { actOnChallenge, closeChallenge, getChallenge } from "@/lib/pinky/fns";

export const Route = createFileRoute("/challenge/$id")({ component: BoardPage });

type ChallengeView = NonNullable<Awaited<ReturnType<typeof getChallenge>>>;

function BoardPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState<ChallengeView | null>(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());

  async function reload() {
    const next = await getChallenge({ data: id });
    setBoard(next);
  }

  useEffect(() => {
    let cancel = false;
    getChallenge({ data: id })
      .then((value) => {
        if (!cancel) setBoard(value);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancel = true;
      window.clearInterval(timer);
    };
  }, [id]);

  if (!board && !error) {
    return (
      <Shell>
        <div className="h-48 animate-pulse rounded-card bg-paper" />
      </Shell>
    );
  }
  if (!board) {
    return (
      <Shell>
        <p className="text-sm text-seal">{error || "Challenge not found."}</p>
      </Shell>
    );
  }

  const remaining = Math.max(0, new Date(board.endsAt).getTime() - now);
  const elapsed = Math.max(0, now - new Date(board.startedAt).getTime());
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const nudges = nudgesFor(
    {
      cards: board.cards,
      locks: board.locks,
      adds: board.counts.adds,
      edits: board.counts.edits,
      votes: board.counts.votes,
    },
    Math.floor(elapsed / 1000),
  );
  const touched = new Set(board.cards.map((card) => card.section)).size;

  async function act(
    action:
      | {
          sessionId: string;
          type: "add";
          section: SectionId;
          text: string;
        }
      | {
          sessionId: string;
          type: "edit" | "comment";
          cardId: string;
          text: string;
        }
      | {
          sessionId: string;
          type: "vote";
          cardId: string;
        }
      | {
          sessionId: string;
          type: "lock";
          section: SectionId;
        },
  ) {
    setError("");
    const result = await actOnChallenge({ data: action });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await reload();
  }

  return (
    <Shell>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-seal">{board.domain}</p>
          <h1 className="font-display text-3xl italic">{board.title}</h1>
        </div>
        <p className="font-display text-3xl tabular-nums">
          {mm}:{ss}
        </p>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-dust">{board.brief}</p>
      {nudges[0] ? (
        <p className="mt-3 rounded-2xl border border-line bg-raised px-3 py-2 text-sm">{nudges[0]}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-seal">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {SECTIONS.map((section) => {
          const cards = board.cards.filter((card) => card.section === section.id);
          const locked = board.locks.includes(section.id);
          return (
            <Card key={section.id}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl">{section.label}</h2>
                {locked ? <span className="text-xs uppercase tracking-wide text-seal">Locked</span> : null}
              </div>
              <Note>{section.hint}</Note>
              <ul className="mt-3 space-y-2">
                {cards.map((card) => (
                  <li key={card.id} className="rounded-2xl bg-raised px-3 py-2">
                    <p className="text-sm">{card.text}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="min-h-11 text-xs text-dust"
                        onClick={() => void act({ sessionId: id, type: "vote", cardId: card.id })}
                      >
                        Vote {card.votes}
                      </button>
                    </div>
                    {card.comments.map((comment) => (
                      <p key={comment} className="mt-1 text-xs text-dust">
                        {comment}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
              {locked ? null : (
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const text = drafts[section.id]?.trim();
                    if (!text) return;
                    void act({ sessionId: id, type: "add", section: section.id as SectionId, text }).then(() =>
                      setDrafts((prev) => ({ ...prev, [section.id]: "" })),
                    );
                  }}
                >
                  <input
                    value={drafts[section.id] ?? ""}
                    onChange={(event) => setDrafts((prev) => ({ ...prev, [section.id]: event.target.value }))}
                    maxLength={280}
                    placeholder="Add a card"
                    className="min-h-11 flex-1 rounded-2xl border border-line bg-ink px-3 text-sm"
                  />
                  <Ghost type="submit">Add</Ghost>
                </form>
              )}
              <button
                type="button"
                disabled={locked || cards.length === 0}
                className="mt-2 min-h-11 text-sm text-dust disabled:opacity-40"
                onClick={() => void act({ sessionId: id, type: "lock", section: section.id })}
              >
                Lock this section
              </button>
            </Card>
          );
        })}
      </div>
      <Primary
        className="mt-4 w-full"
        disabled={touched < 3 || board.status !== "open"}
        onClick={() => {
          void closeChallenge({ data: id }).then((result) => {
            if (!result.ok) {
              setError(result.error);
              return;
            }
            void navigate({ to: "/profile" });
          });
        }}
      >
        {board.status === "open" ? "Finish and score it" : "Already scored"}
      </Primary>
      <Note>Three sections with a card is the minimum. You can finish before the timer.</Note>
    </Shell>
  );
}
