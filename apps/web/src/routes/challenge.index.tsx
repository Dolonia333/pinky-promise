import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, Note, Primary, Shell } from "@/components/pinky-ui";
import { beginChallenge } from "@/lib/pinky/fns";

export const Route = createFileRoute("/challenge/")({ component: ChallengeHome });

function ChallengeHome() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell>
      <p className="text-xs uppercase tracking-widest text-seal">Business founders</p>
      <h1 className="mt-1 font-display text-4xl italic">Fifteen minutes. Five sections.</h1>
      <Note>
        No coding sessions required. You get a customer problem, and the board records what you add, edit, vote, and
        lock. The score comes from those actions.
      </Note>
      <Card className="mt-4">
        <ol className="space-y-2 text-sm text-dust">
          <li>Customer</li>
          <li>Problem</li>
          <li>First feature</li>
          <li>How we'll know</li>
          <li>Who does what</li>
        </ol>
        {error ? <p className="mt-3 text-sm text-seal">{error}</p> : null}
        <Primary
          className="mt-4"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void beginChallenge()
              .then((session) => navigate({ to: "/challenge/$id", params: { id: session.id } }))
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Failed");
                setBusy(false);
              });
          }}
        >
          Start the challenge
        </Primary>
      </Card>
    </Shell>
  );
}
