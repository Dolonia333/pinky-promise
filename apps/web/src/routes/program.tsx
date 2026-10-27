import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, Note, Shell } from "@/components/pinky-ui";
import { getRoom } from "@/lib/pinky/fns";

export const Route = createFileRoute("/program")({ component: Program });

function Program() {
  const [room, setRoom] = useState<Awaited<ReturnType<typeof getRoom>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancel = false;
    getRoom()
      .then((value) => {
        if (!cancel) setRoom(value);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <Shell wide>
      <p className="text-xs uppercase tracking-widest text-seal">Program view</p>
      <h1 className="mt-1 font-display text-4xl italic">Who should try whom</h1>
      <Note>
        Twenty simulated founders, plus you if you have a profile. Individual scores stay off this screen. Reasons
        describe the fit.
      </Note>
      {error ? <p className="mt-3 text-sm text-seal">{error}</p> : null}
      {!room && !error ? <div className="mt-4 h-40 animate-pulse rounded-card bg-paper" /> : null}
      {room ? (
        <>
          <h2 className="mt-6 font-display text-2xl">Your best trials</h2>
          {room.matches.length === 0 ? <Note>Load a profile and this list fills in.</Note> : null}
          <ul className="mt-3 space-y-3">
            {room.matches.map((match) => (
              <li key={match.id}>
                <Card>
                  <p className="text-xs uppercase tracking-wide text-dust">
                    {match.archetype} · {match.domain} · {match.goals}
                  </p>
                  <h3 className="font-display text-2xl">{match.name}</h3>
                  <p className="mt-1 text-sm text-dust">{match.reason}</p>
                  <p className="mt-1 text-xs text-dust">{match.background}</p>
                </Card>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-2xl">This round</h2>
          <Note>{room.roomSize} people. The strongest matches are paired first, and the odd person sits out.</Note>
          <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-paper">
            {room.round.pairs.map((pair) => (
              <li key={`${pair.a}-${pair.b}`} className="px-4 py-3 text-sm">
                <p>
                  {pair.a} <span className="text-dust">with</span> {pair.b}
                </p>
                <p className="text-dust">{pair.note}</p>
              </li>
            ))}
          </ul>
          {room.round.bye ? (
            <p className="mt-3 text-sm text-dust">Bye this round: {room.round.bye}. They rotate in next.</p>
          ) : null}
        </>
      ) : null}
    </Shell>
  );
}
