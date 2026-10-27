import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, Note, Primary, Shell } from "@/components/pinky-ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { previewInvite, takeInvite } from "@/lib/pinky/fns";

export const Route = createFileRoute("/i/$token")({ component: Invite });

function Invite() {
  const { token } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [peek, setPeek] = useState<Awaited<ReturnType<typeof previewInvite>> | null>(null);
  const [error, setError] = useState("");
  const [needProfile, setNeedProfile] = useState(false);

  useEffect(() => {
    let cancel = false;
    previewInvite({ data: token })
      .then((value) => {
        if (!cancel) setPeek(value);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "Failed");
      });
    return () => {
      cancel = true;
    };
  }, [token]);

  if (isPending) return <div className="min-h-screen bg-ink" />;
  if (!user) return <RedirectToSignIn />;
  if (!peek) {
    return (
      <Shell>
        <div className="h-32 animate-pulse rounded-card bg-paper" />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-4xl italic">Compare</h1>
      {!peek.ok ? <p className="mt-3 text-sm text-seal">{peek.error}</p> : null}
      {peek.ok ? (
        <Card className="mt-4">
          <p className="text-sm text-dust">{peek.name}</p>
          <h2 className="font-display text-3xl italic">{peek.archetype}</h2>
          <Note>You'll both see the same report. Scores stay between the two of you.</Note>
          {peek.expired ? <p className="mt-2 text-sm text-seal">This invite expired.</p> : null}
          {error ? <p className="mt-2 text-sm text-seal">{error}</p> : null}
          {needProfile ? (
            <Link to="/studio" className="mt-3 inline-flex min-h-11 items-center text-sm">
              Make a profile first
            </Link>
          ) : (
            <Primary
              className="mt-4"
              disabled={peek.expired}
              onClick={() => {
                setError("");
                void takeInvite({ data: token }).then((result) => {
                  if (!result.ok) {
                    setError(result.error);
                    if ("needProfile" in result && result.needProfile) setNeedProfile(true);
                    return;
                  }
                  void navigate({ to: "/reports/$id", params: { id: result.reportId } });
                });
              }}
            >
              Agree to compare
            </Primary>
          )}
        </Card>
      ) : null}
    </Shell>
  );
}
